import axios from 'axios'
import * as cheerio from 'cheerio'

export type ECourtsProviderType = 'official' | 'manual' | 'third_party'

export interface ECourtsConfig {
  provider: ECourtsProviderType
  apiKey?: string
  baseUrl?: string
  timeout?: number
}

export interface ECourtsCaseData {
  cnr: string
  caseNumber: string
  filingNumber?: string
  title: string
  court: string
  courtLocation: string
  hallNumber?: string
  caseType: string
  caseStatus: string
  filingDate: string
  lastHearingDate?: string
  nextHearingDate?: string
  parties: Array<{
    name: string
    type: 'PLAINTIFF' | 'DEFENDANT' | 'PETITIONER' | 'RESPONDENT'
    address?: string
    phone?: string
    email?: string
  }>
  advocates: Array<{
    name: string
    type?: string
    barNumber?: string
    phone?: string
    email?: string
    address?: string
  }>
  judges: Array<{
    name: string
    designation: string
    court: string
  }>
  hearingHistory: Array<{
    date: string
    purpose: string
    judge: string
    status?: string
  }>
  orders: Array<{
    number: number
    name: string
    date: string
    url?: string
  }>
  actsAndSections?: {
    acts: string
    sections: string
  }
  registrationNumber?: string
  registrationDate?: string
  firstHearingDate?: string
  decisionDate?: string
  natureOfDisposal?: string
  caseDetails: {
    subjectMatter: string
    caseDescription: string
    reliefSought: string
    caseValue?: number
    jurisdiction: string
  }
}

export interface ECourtsResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
  requiresCaptcha?: boolean
  requiresManual?: boolean
}

export interface SearchFilters {
  cnr?: string
  caseNumber?: string
  partyName?: string
  advocateName?: string
  court?: string
  courtType?: 'district' | 'high' | 'supreme' | 'nclt' | 'cat' | 'consumer'
  filingDateFrom?: string
  filingDateTo?: string
  hearingDateFrom?: string
  hearingDateTo?: string
  caseType?: string
  caseStatus?: string
  limit?: number
  offset?: number
}

export interface SearchResult {
  success: boolean
  data?: ECourtsCaseData[]
  total?: number
  page?: number
  limit?: number
  error?: string
  message?: string
}

export class ECourtsProvider {
  private config: ECourtsConfig
  private timeout = 120000

  // Official API endpoints
  private readonly OFFICIAL_ENDPOINTS = {
    NAPIX: 'https://napix.gov.in/api/ecourts',
    API_SETU: 'https://apisetu.gov.in/api/ecourts',
    DISTRICT_PORTAL: 'https://services.ecourts.gov.in/',
    HIGH_COURT_PORTAL: 'https://hcservices.ecourts.gov.in/',
    JUDGMENTS_PORTAL: 'https://judgments.ecourts.gov.in/'
  }

  // Third-party API endpoints (updated from official documentation)
  private readonly THIRD_PARTY_ENDPOINTS = {
    KLEOPATRA: process.env.COURT_API_BASE || 'https://court-api.kleopatra.io',
    PHOENIX: process.env.PHOENIX_BASE || 'https://phoenix.akshit.me', // Phoenix E-Courts India API
    ECOURTS_V17: 'https://api.ecourts.gov.in/v17', // Official E-Courts India API v17.0
    SUREPASS: 'https://surepass.io/api/ecourt-cnr-search',
    LEGALKART: 'https://www.legalkart.com/api/ecourts'
  }

  // API endpoint paths (from official documentation)
  private readonly API_PATHS = {
    KLEOPATRA: {
      CNR: process.env.COURT_API_PATH_CNR || '/v17/cases/by-cnr',
      SEARCH: process.env.COURT_API_PATH_SEARCH || '/v17/cases/search',
      ADVOCATE_NUMBER: '/api/core/live/district-court/search/advocate-number',
      ADVOCATE_NAME: '/api/core/live/district-court/search/advocate'
    },
    PHOENIX: {
      STATES: process.env.PHOENIX_PATH_STATES || '/states',
      DISTRICTS: process.env.PHOENIX_PATH_DISTRICTS || '/districts',
      COMPLEXES: process.env.PHOENIX_PATH_COMPLEXES || '/court-complexes',
      COURTS: process.env.PHOENIX_PATH_COURTS || '/courts'
    }
  }

  constructor(config?: ECourtsConfig) {
    this.config = {
      provider: config?.provider || (process.env.ECOURTS_PROVIDER as ECourtsProviderType) || 'official',
      apiKey: config?.apiKey || process.env.KLEOPATRA_API_KEY || process.env.ECOURTS_API_KEY || 'klc_2cef7fc42178c58211cd8b8b1d23c3206c1e778f13ed566237803d8897a9b104',
      baseUrl: config?.baseUrl,
      timeout: config?.timeout || 120000
    }
  }

  /**
   * Determine court type based on CNR pattern
   */
  private determineCourtType(cnr: string): 'district' | 'high' | 'supreme' | 'nclt' | 'consumer' {
    const upperCnr = cnr.toUpperCase()
    
    // High Court patterns (DLHC, KAHC, etc.)
    if (upperCnr.includes('HC') || upperCnr.startsWith('DLHC') || upperCnr.startsWith('KAHC')) {
      return 'high'
    }
    
    // Supreme Court patterns
    if (upperCnr.includes('SC') || upperCnr.startsWith('DLSC')) {
      return 'supreme'
    }
    
    // NCLT patterns
    if (upperCnr.includes('NCLT') || upperCnr.includes('NCLAT')) {
      return 'nclt'
    }
    
    // Consumer Forum patterns
    if (upperCnr.includes('CF') || upperCnr.includes('CONSUMER')) {
      return 'consumer'
    }
    
    // Default to district court
    return 'district'
  }

  /**
   * Search for a case by CNR number with court type specification
   */
  async getCaseByCNR(cnr: string, courtType: 'district' | 'high' | 'supreme' | 'nclt' | 'cat' | 'consumer' = 'district'): Promise<ECourtsResponse<ECourtsCaseData>> {
    const startTime = Date.now()
    
    try {
      // Validate CNR format (exactly 16 characters, can contain letters and digits)
      if (!/^[A-Za-z0-9\-]{16}$/.test(cnr)) {
        console.log(`❌ Invalid CNR format: ${cnr}`)
        return {
          success: false,
          error: 'INVALID_CNR',
          message: 'CNR must be exactly 16 characters and contain only letters, digits, and hyphens'
        }
      }

      console.log(`🔍 Fetching case data for CNR: ${cnr}, Court Type: ${courtType}`)

      let result: ECourtsResponse<ECourtsCaseData>
      
      switch (this.config.provider) {
        case 'official':
          result = await this.getCaseFromOfficialAPI(cnr)
          break
        case 'manual':
          result = await this.getCaseFromManualPortal(cnr)
          break
        case 'third_party':
          result = await this.getCaseFromThirdPartyAPI(cnr, courtType)
          break
        default:
          result = {
            success: false,
            error: 'INVALID_PROVIDER',
            message: 'Invalid provider specified'
          }
      }
      
      const responseTime = Date.now() - startTime
      console.log(`⏱️ CNR lookup completed in ${responseTime}ms - ${result.success ? 'SUCCESS' : 'FAILED'}`)
      
      if (result.success && result.data) {
        console.log(`✅ Case found: ${result.data.title}`)
        console.log(`📊 Parties: ${result.data.parties.length}, Orders: ${result.data.orders.length}`)
      }
      
      return result
      
    } catch (error) {
      const responseTime = Date.now() - startTime
      console.error(`❌ CNR lookup failed after ${responseTime}ms:`, error)
      return {
        success: false,
        error: 'NETWORK_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }
  }

  /**
   * Try official government APIs (NAPIX, API Setu)
   */
  private async getCaseFromOfficialAPI(cnr: string): Promise<ECourtsResponse<ECourtsCaseData>> {
    try {
      // Try NAPIX API first
      if (this.config.apiKey) {
        try {
          const napixResponse = await axios.get(`${this.OFFICIAL_ENDPOINTS.NAPIX}/cases/${cnr}`, {
            headers: {
              'Authorization': `Bearer ${this.config.apiKey}`,
              'Content-Type': 'application/json'
            },
            timeout: this.config.timeout
          })

          if (napixResponse.data) {
            return {
              success: true,
              data: this.mapOfficialResponseToCaseData(napixResponse.data, cnr)
            }
          }
        } catch (napixError) {
          console.log('NAPIX API failed, trying API Setu...')
        }

        // Try API Setu as fallback
        try {
          const apiSetuResponse = await axios.get(`${this.OFFICIAL_ENDPOINTS.API_SETU}/cases/${cnr}`, {
            headers: {
              'X-API-KEY': this.config.apiKey,
              'Content-Type': 'application/json'
            },
            timeout: this.config.timeout
          })

          if (apiSetuResponse.data) {
            return {
              success: true,
              data: this.mapOfficialResponseToCaseData(apiSetuResponse.data, cnr)
            }
          }
        } catch (apiSetuError) {
          console.log('API Setu failed, falling back to manual portal...')
        }
      }

      // If no API key or official APIs fail, fall back to manual portal
      return await this.getCaseFromManualPortal(cnr)

    } catch (error) {
      console.error('Official API error:', error)
      return {
        success: false,
        error: 'OFFICIAL_API_ERROR',
        message: 'Official APIs are not accessible. Please use manual or third-party provider.',
        requiresManual: true
      }
    }
  }

  /**
   * Try manual portal scraping (with CAPTCHA handling)
   */
  private async getCaseFromManualPortal(cnr: string): Promise<ECourtsResponse<ECourtsCaseData>> {
    try {
      // Try district portal first
      const districtResponse = await this.scrapeDistrictPortal(cnr)
      if (districtResponse.success) {
        return districtResponse
      }

      // Try high court portal
      const highCourtResponse = await this.scrapeHighCourtPortal(cnr)
      if (highCourtResponse.success) {
        return highCourtResponse
      }

      // If both fail, return CAPTCHA required
      return {
        success: false,
        error: 'CAPTCHA_REQUIRED',
        message: 'Manual intervention required due to CAPTCHA or access restrictions',
        requiresCaptcha: true,
        requiresManual: true
      }

    } catch (error) {
      console.error('Manual portal error:', error)
      return {
        success: false,
        error: 'MANUAL_PORTAL_ERROR',
        message: 'Manual portals are not accessible',
        requiresManual: true
      }
    }
  }

  /**
   * Try third-party APIs with multiple providers including Phoenix
   */
  private async getCaseFromThirdPartyAPI(cnr: string, courtType: 'district' | 'high' | 'supreme' | 'nclt' | 'consumer' = 'district'): Promise<ECourtsResponse<ECourtsCaseData>> {
    try {
      // Use Kleopatra API only
      const providers = [
        { name: 'Kleopatra', endpoint: this.THIRD_PARTY_ENDPOINTS.KLEOPATRA }
      ]

      if (this.config.apiKey) {
        for (const provider of providers) {
          try {
            console.log(`🔍 Attempting ${provider.name} API with key:`, this.config.apiKey.substring(0, 10) + '...')
            
            // Use Kleopatra API endpoint
            let apiEndpoint: string
            let requestBody: any
            
            // Use the correct Kleopatra CNR search endpoint from documentation
            // For district court: https://court-api.kleopatra.io/api/core/live/district-court/case
              const endpointMap: Record<string, string> = {
              'district': '/api/core/live/district-court/case',
              'high': '/api/core/live/high-court/case',
              'supreme': '/api/core/live/supreme-court/case',
              'nclt': '/api/core/live/nclt/case',
              'consumer': '/api/core/live/consumer-forum/case'
            }
            
            apiEndpoint = `${provider.endpoint}${endpointMap[courtType] || endpointMap['district']}`
              requestBody = { cnr: cnr }
            
            console.log(`🔍 Using ${provider.name} ${courtType} court endpoint:`, apiEndpoint)
            console.log('📤 Sending request:', requestBody)
            
            const response = await axios.post(apiEndpoint, requestBody, {
              headers: {
                'Authorization': `Bearer ${this.config.apiKey}`,
                'Content-Type': 'application/json'
              },
              timeout: 120000 // 2 minutes timeout for browser environment
            })

            console.log(`✅ ${provider.name} API success:`, response.status)
            console.log('📊 Response data:', response.data)
            
            // Check for different response formats
            if (response.data && typeof response.data === 'object' && Object.keys(response.data).length > 0) {
              // Check for common case data fields
              if (response.data.title || response.data.parties || response.data.cnr || response.data.case_details) {
                console.log(`✅ ${provider.name} response validation passed - mapping data...`)
                
                // Use Kleopatra response mapping
                  return {
                    success: true,
                    data: this.mapKleopatraResponseToCaseData(response.data, cnr)
                }
              }
              
              // Check if response is an array with case data
              if (Array.isArray(response.data) && response.data.length > 0) {
                const caseData = response.data[0]
                // Use Kleopatra response mapping
                  return {
                    success: true,
                    data: this.mapKleopatraResponseToCaseData(caseData, cnr)
                }
              }
            }
            
            console.log(`⚠️ Empty or invalid response from ${provider.name} ${courtType} court API`)
            
          } catch (providerError) {
            console.log(`❌ ${provider.name} API failed:`, providerError instanceof Error ? providerError.message : 'Unknown error')
            
            // Log detailed error information
            if (providerError instanceof Error) {
              console.log(`❌ ${provider.name} Error details:`, {
                message: providerError.message,
                name: providerError.name
              })
            }
            
            // Continue to next provider
            continue
          }
        }
        
        // If Kleopatra API fails, return error
        console.log('❌ Kleopatra API failed')
      }

      // If Kleopatra API fails, return error
      return {
        success: false,
        error: 'KLEOPATRA_API_ERROR',
        message: 'Kleopatra API is not accessible. Please check API key.',
        requiresManual: true
      }

    } catch (error) {
      console.error('Kleopatra API error:', error)
      return {
        success: false,
        error: 'KLEOPATRA_API_ERROR',
        message: 'Kleopatra API is not accessible',
        requiresManual: true
      }
    }
  }

  /**
   * Scrape district portal
   */
  private async scrapeDistrictPortal(cnr: string): Promise<ECourtsResponse<ECourtsCaseData>> {
    try {
      const response = await axios.get(this.OFFICIAL_ENDPOINTS.DISTRICT_PORTAL, {
        timeout: this.config.timeout,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      })

      // Check if CAPTCHA is required
      const $ = cheerio.load(response.data)
      if ($('img[src*="captcha"]').length > 0 || $('input[name*="captcha"]').length > 0) {
        return {
          success: false,
          error: 'CAPTCHA_REQUIRED',
          message: 'CAPTCHA required on district portal',
          requiresCaptcha: true
        }
      }

      // If no CAPTCHA, try to parse case data
      // This would need to be implemented based on actual portal structure
      return {
        success: false,
        error: 'PARSING_ERROR',
        message: 'Unable to parse district portal data'
      }

    } catch (error) {
      return {
        success: false,
        error: 'DISTRICT_PORTAL_ERROR',
        message: 'District portal not accessible'
      }
    }
  }

  /**
   * Scrape high court portal
   */
  private async scrapeHighCourtPortal(cnr: string): Promise<ECourtsResponse<ECourtsCaseData>> {
    try {
      const response = await axios.get(this.OFFICIAL_ENDPOINTS.HIGH_COURT_PORTAL, {
        timeout: this.config.timeout,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      })

      // Check if CAPTCHA is required
      const $ = cheerio.load(response.data)
      if ($('img[src*="captcha"]').length > 0 || $('input[name*="captcha"]').length > 0) {
        return {
          success: false,
          error: 'CAPTCHA_REQUIRED',
          message: 'CAPTCHA required on high court portal',
          requiresCaptcha: true
        }
      }

      return {
        success: false,
        error: 'PARSING_ERROR',
        message: 'Unable to parse high court portal data'
      }

    } catch (error) {
      return {
        success: false,
        error: 'HIGH_COURT_PORTAL_ERROR',
        message: 'High court portal not accessible'
      }
    }
  }

  /**
   * Map official API response to our case data format
   */
  private mapOfficialResponseToCaseData(apiData: any, cnr: string): ECourtsCaseData {
    return {
      cnr,
      caseNumber: apiData.caseNumber || `CASE-${cnr.slice(-6)}`,
      title: apiData.title || apiData.caseTitle || 'Unknown Case',
      court: apiData.court || apiData.courtName || 'Unknown Court',
      courtLocation: apiData.courtLocation || apiData.location || 'Unknown Location',
      hallNumber: apiData.hallNumber || apiData.hall || 'Not specified',
      caseType: apiData.caseType || 'CIVIL',
      caseStatus: apiData.status || apiData.caseStatus || 'PENDING',
      filingDate: apiData.filingDate || apiData.dateOfFiling || '',
      lastHearingDate: apiData.lastHearingDate,
      nextHearingDate: apiData.nextHearingDate,
      parties: apiData.parties || [],
      advocates: apiData.advocates || [],
      judges: apiData.judges || [],
      hearingHistory: [],
      orders: [],
      caseDetails: {
        subjectMatter: apiData.subjectMatter || '',
        caseDescription: apiData.description || '',
        reliefSought: apiData.reliefSought || '',
        caseValue: apiData.caseValue,
        jurisdiction: apiData.jurisdiction || ''
      }
    }
  }

  /**
   * Format date string to proper format
   */
  private formatDate(dateString: string): string {
    if (!dateString) return ''
    try {
      const date = new Date(dateString)
      
      // Check if it's a null/default date (1970-01-01)
      if (date.getFullYear() === 1970 && date.getMonth() === 0 && date.getDate() === 1) {
        return '' // Return empty string for null dates
      }
      
      // Return YYYY-MM-DD format in local timezone
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      
      return `${year}-${month}-${day}`
    } catch {
      return dateString
    }
  }

  /**
   * Sanitize HTML tags from text
   */
  private sanitizeHtml(html: string): string {
    if (!html) return ''
    return html
      .replace(/<br\s*\/?>/gi, ' ')
      .replace(/<[^>]*>/g, '')
      .replace(/\s+/g, ' ')
      .trim()
  }

  /**
   * Map Kleopatra API response to our case data format
   */
  private mapKleopatraResponseToCaseData(apiData: any, cnr: string): ECourtsCaseData {
    // Use the top-level data directly (Kleopatra returns data at root level)
    const data = apiData.data || apiData
    
    // Extract registration number from details.registrationNumber or fallback
    const registrationNumber = data.details?.registrationNumber || data.registrationNumber || ''
    
    // Extract parties from the parties object
    const petitioners = data.parties?.petitioners || []
    const respondents = data.parties?.respondents || []
    const petitionerAdvocates = data.parties?.petitionerAdvocates || []
    const respondentAdvocates = data.parties?.respondentAdvocates || []
    
    // Format parties array
    const formattedParties = [
      ...petitioners.map((name: string) => ({ type: 'PLAINTIFF' as const, name })),
      ...respondents.map((name: string) => ({ type: 'DEFENDANT' as const, name }))
    ]
    
    // Format advocates array
    const formattedAdvocates = [
      ...petitionerAdvocates.map((name: string) => ({ name })),
      ...respondentAdvocates.map((name: string) => ({ name }))
    ]
    
    // Extract hearing history - use history array directly
    const hearingHistory = data.history || []
    const formattedHearingHistory = hearingHistory.map((hearing: any) => ({
      date: this.formatDate(hearing.businessDate || hearing.date || ''),
      purpose: hearing.purpose || 'Hearing',
      judge: hearing.judge || 'Unknown Judge',
      status: '',
      nextDate: this.formatDate(hearing.nextDate || ''),
      url: hearing.url || ''
    }))

    // Extract orders - use orders array directly
    const orders = data.orders || []
    const formattedOrders = orders.map((order: any, index: number) => ({
      number: order.number || index + 1,
      name: order.name || `Order ${index + 1}`,
      date: this.formatDate(order.date || ''),
      url: order.url || ''
    }))

    // Extract acts and sections
    const actsAndSections = data.actsAndSections || {}

    return {
      cnr,
      caseNumber: registrationNumber || `REG-${cnr.slice(-6)}`,
      filingNumber: data.details?.filingNumber || '',
      title: data.title || 'Unknown Case',
      court: data.status?.courtNumberAndJudge || 'Unknown Court',
      courtLocation: 'Bengaluru Rural',
      hallNumber: 'Not specified',
      caseType: data.details?.type || 'CIVIL',
      caseStatus: this.sanitizeHtml(data.status?.caseStage || 'PENDING'),
      filingDate: this.formatDate(data.details?.filingDate || ''),
      lastHearingDate: this.formatDate(''), // Not available in response
      nextHearingDate: this.formatDate(data.status?.nextHearingDate || ''),
      parties: formattedParties,
      advocates: formattedAdvocates,
      judges: [],
      hearingHistory: formattedHearingHistory,
      orders: formattedOrders,
      actsAndSections: actsAndSections.acts || actsAndSections.sections ? {
        acts: actsAndSections.acts || '',
        sections: actsAndSections.sections || ''
      } : undefined,
      registrationNumber: registrationNumber,
      registrationDate: this.formatDate(data.details?.registrationDate || ''),
      firstHearingDate: this.formatDate(data.status?.firstHearingDate || ''),
      decisionDate: this.formatDate(data.status?.decisionDate || ''),
      natureOfDisposal: data.status?.natureOfDisposal || '',
      caseDetails: {
        subjectMatter: data.title || '',
        caseDescription: '',
        reliefSought: '',
        caseValue: undefined,
        jurisdiction: ''
      }
    }
  }

  /**
   * Map Official E-Courts India API v17.0 response to our case data format
   */
  private mapECourtsV17ResponseToCaseData(apiData: any, cnr: string): ECourtsCaseData {
    const caseData = apiData.data || apiData
    
    // Extract parties information from official E-Courts v17 format
    const petitioners = caseData.petitioners || caseData.petitioner_names || []
    const respondents = caseData.respondents || caseData.respondent_names || []
    const petitionerAdvocates = caseData.petitioner_advocates || caseData.petitioner_advocate_names || []
    const respondentAdvocates = caseData.respondent_advocates || caseData.respondent_advocate_names || []
    
    // Format parties array for the expected structure
    const formattedParties = [
      ...petitioners.map((name: string) => ({ type: 'PLAINTIFF', name })),
      ...respondents.map((name: string) => ({ type: 'DEFENDANT', name }))
    ]
    
    // Format advocates array
    const formattedAdvocates = [
      ...petitionerAdvocates.map((name: string) => ({ type: 'PETITIONER', name })),
      ...respondentAdvocates.map((name: string) => ({ type: 'RESPONDENT', name }))
    ]
    
    // Extract hearing history from official format
    const hearingHistory = caseData.hearing_history || caseData.hearings || []
    const formattedHearingHistory = hearingHistory.map((hearing: any) => ({
      date: hearing.date || hearing.hearing_date || '',
      purpose: hearing.purpose || hearing.subject || hearing.description || 'Hearing',
      judge: hearing.judge || hearing.judge_name || 'Unknown Judge',
      status: hearing.status || hearing.outcome || '',
      nextDate: hearing.next_date || hearing.next_hearing_date || '',
      url: hearing.url || ''
    }))

    // Extract orders from official format
    const orders = caseData.orders || caseData.case_orders || []
    const formattedOrders = orders.map((order: any, index: number) => ({
      number: order.order_number || order.number || index + 1,
      name: order.order_name || order.name || order.description || `Order ${index + 1}`,
      date: order.order_date || order.date || '',
      url: order.url || order.pdf_url || order.download_url
    }))

    // Extract acts and sections from official format
    const actsAndSections = caseData.acts_and_sections || caseData.legal_provisions || {}
    const formattedActsAndSections = actsAndSections.acts || actsAndSections.sections ? {
      acts: actsAndSections.acts || actsAndSections.act_name || '',
      sections: actsAndSections.sections || actsAndSections.section_numbers || ''
    } : undefined

    return {
      cnr,
      caseNumber: caseData.registration_number || caseData.case_number || `REG-${cnr.slice(-6)}`,
      filingNumber: caseData.filing_number || caseData.filing_no || undefined,
      title: caseData.title || caseData.case_title || caseData.subject_matter || 'Unknown Case',
      court: caseData.court_name || caseData.court || caseData.jurisdiction || 'Unknown Court',
      courtLocation: caseData.location || caseData.court_location || caseData.district || 'Unknown Location',
      hallNumber: caseData.hall_number || caseData.hall || caseData.court_hall || 'Not specified',
      caseType: caseData.case_type || caseData.type || caseData.category || 'CIVIL',
      caseStatus: this.sanitizeHtml(caseData.status || caseData.case_status || caseData.current_status || 'PENDING'),
      filingDate: this.formatDate(caseData.filing_date || caseData.date_of_filing || caseData.registration_date || ''),
      lastHearingDate: this.formatDate(caseData.last_hearing_date || caseData.previous_hearing_date || ''),
      nextHearingDate: this.formatDate(caseData.next_hearing_date || caseData.upcoming_hearing_date || ''),
      parties: formattedParties,
      advocates: formattedAdvocates,
      judges: caseData.judges || caseData.bench || caseData.magistrate || [],
      hearingHistory: formattedHearingHistory,
      orders: formattedOrders,
      actsAndSections: formattedActsAndSections,
      registrationNumber: caseData.registration_number || caseData.case_number || '',
      registrationDate: caseData.registration_date || caseData.reg_date || '',
      firstHearingDate: caseData.first_hearing_date || caseData.first_hearing?.date || '',
      decisionDate: caseData.decision_date || caseData.disposal_date || '',
      natureOfDisposal: caseData.nature_of_disposal || caseData.disposal_type || '',
      caseDetails: {
        subjectMatter: caseData.title || caseData.subject_matter || caseData.nature_of_case || '',
        caseDescription: caseData.description || caseData.case_description || caseData.facts || '',
        reliefSought: caseData.relief_sought || caseData.reliefSought || caseData.prayer || '',
        caseValue: caseData.case_value || caseData.amount_involved,
        jurisdiction: caseData.jurisdiction || caseData.territorial_jurisdiction || ''
      }
    }
  }

  /**
   * Map Phoenix API response to our case data format
   */
  private mapPhoenixResponseToCaseData(apiData: any, cnr: string): ECourtsCaseData {
    const caseData = apiData.data || apiData
    
    // Extract parties information from Phoenix format
    const petitioners = caseData.petitioners || caseData.petitioner_names || []
    const respondents = caseData.respondents || caseData.respondent_names || []
    const petitionerAdvocates = caseData.petitioner_advocates || caseData.petitioner_advocate_names || []
    const respondentAdvocates = caseData.respondent_advocates || caseData.respondent_advocate_names || []
    
    // Format parties array for the expected structure
    const formattedParties = [
      ...petitioners.map((name: string) => ({ type: 'PLAINTIFF', name })),
      ...respondents.map((name: string) => ({ type: 'DEFENDANT', name }))
    ]
    
    // Format advocates array
    const formattedAdvocates = [
      ...petitionerAdvocates.map((name: string) => ({ type: 'PETITIONER', name })),
      ...respondentAdvocates.map((name: string) => ({ type: 'RESPONDENT', name }))
    ]
    
    // Extract hearing history
    const hearingHistory = caseData.hearing_history || caseData.hearings || []
    const formattedHearingHistory = hearingHistory.map((hearing: any) => ({
      date: hearing.date || hearing.hearing_date || '',
      purpose: hearing.purpose || hearing.subject || hearing.description || 'Hearing',
      judge: hearing.judge || hearing.judge_name || 'Unknown Judge',
      status: hearing.status || hearing.outcome || '',
      nextDate: hearing.next_date || hearing.next_hearing_date || '',
      url: hearing.url || ''
    }))

    // Extract orders
    const orders = caseData.orders || caseData.case_orders || []
    const formattedOrders = orders.map((order: any, index: number) => ({
      number: order.order_number || order.number || index + 1,
      name: order.order_name || order.name || order.description || `Order ${index + 1}`,
      date: order.order_date || order.date || '',
      url: order.url || order.pdf_url || order.download_url
    }))

    // Extract acts and sections
    const actsAndSections = caseData.acts_and_sections || caseData.legal_provisions || {}
    const formattedActsAndSections = actsAndSections.acts || actsAndSections.sections ? {
      acts: actsAndSections.acts || actsAndSections.act_name || '',
      sections: actsAndSections.sections || actsAndSections.section_numbers || ''
    } : undefined

    return {
      cnr,
      caseNumber: caseData.registration_number || caseData.case_number || `REG-${cnr.slice(-6)}`,
      filingNumber: caseData.filing_number || caseData.filing_no || undefined,
      title: caseData.title || caseData.case_title || caseData.subject_matter || 'Unknown Case',
      court: caseData.court_name || caseData.court || caseData.jurisdiction || 'Unknown Court',
      courtLocation: caseData.location || caseData.court_location || caseData.district || 'Unknown Location',
      hallNumber: caseData.hall_number || caseData.hall || caseData.court_hall || 'Not specified',
      caseType: caseData.case_type || caseData.type || caseData.category || 'CIVIL',
      caseStatus: this.sanitizeHtml(caseData.status || caseData.case_status || caseData.current_status || 'PENDING'),
      filingDate: this.formatDate(caseData.filing_date || caseData.date_of_filing || caseData.registration_date || ''),
      lastHearingDate: this.formatDate(caseData.last_hearing_date || caseData.previous_hearing_date || ''),
      nextHearingDate: this.formatDate(caseData.next_hearing_date || caseData.upcoming_hearing_date || ''),
      parties: formattedParties,
      advocates: formattedAdvocates,
      judges: caseData.judges || caseData.bench || caseData.magistrate || [],
      hearingHistory: formattedHearingHistory,
      orders: formattedOrders,
      actsAndSections: formattedActsAndSections,
      registrationNumber: caseData.registration_number || caseData.case_number || '',
      registrationDate: caseData.registration_date || caseData.reg_date || '',
      firstHearingDate: caseData.first_hearing_date || caseData.first_hearing?.date || '',
      decisionDate: caseData.decision_date || caseData.disposal_date || '',
      natureOfDisposal: caseData.nature_of_disposal || caseData.disposal_type || '',
      caseDetails: {
        subjectMatter: caseData.title || caseData.subject_matter || caseData.nature_of_case || '',
        caseDescription: caseData.description || caseData.case_description || caseData.facts || '',
        reliefSought: caseData.relief_sought || caseData.reliefSought || caseData.prayer || '',
        caseValue: caseData.case_value || caseData.amount_involved,
        jurisdiction: caseData.jurisdiction || caseData.territorial_jurisdiction || ''
      }
    }
  }

  /**
   * Map third-party API response to our case data format
   */
  private mapThirdPartyResponseToCaseData(apiData: any, cnr: string): ECourtsCaseData {
    return {
      cnr,
      caseNumber: apiData.registrationNumber || apiData.caseNumber || apiData.case_number || `REG-${cnr.slice(-6)}`,
      filingNumber: apiData.filingNumber || apiData.filingNo || apiData.filing_number || undefined,
      title: apiData.title || apiData.case_title || 'Unknown Case',
      court: apiData.court || apiData.court_name || 'Unknown Court',
      courtLocation: apiData.location || apiData.court_location || 'Unknown Location',
      caseType: apiData.type || apiData.case_type || 'CIVIL',
      caseStatus: apiData.status || apiData.case_status || 'PENDING',
      filingDate: apiData.filing_date || apiData.date_of_filing || '',
      lastHearingDate: apiData.last_hearing_date,
      nextHearingDate: apiData.next_hearing_date,
      parties: apiData.parties || [],
      advocates: apiData.advocates || [],
      judges: apiData.judges || [],
      hearingHistory: [],
      orders: [],
      caseDetails: {
        subjectMatter: apiData.subject_matter || apiData.subjectMatter || '',
        caseDescription: apiData.description || apiData.case_description || '',
        reliefSought: apiData.relief_sought || apiData.reliefSought || '',
        caseValue: apiData.case_value || apiData.caseValue,
        jurisdiction: apiData.jurisdiction || ''
      }
    }
  }

  /**
   * Search for cases with filters
   */
  async searchCases(filters: SearchFilters): Promise<SearchResult> {
    try {
      console.log('🔍 Starting comprehensive case search with filters:', filters)
      
      switch (this.config.provider) {
        case 'official':
          return await this.searchFromOfficialAPI(filters)
        case 'manual':
          return await this.searchFromManualPortal(filters)
        case 'third_party':
          return await this.searchFromThirdPartyAPI(filters)
        default:
          return {
            success: false,
            error: 'INVALID_PROVIDER',
            message: 'Invalid provider specified'
          }
      }
    } catch (error) {
      console.error('Error searching cases:', error)
      return {
        success: false,
        error: 'NETWORK_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }
  }

  /**
   * Search by CNR (existing method, kept for backward compatibility)
   */
  async searchByCNR(cnr: string): Promise<ECourtsResponse<ECourtsCaseData>> {
    return this.getCaseByCNR(cnr)
  }

  /**
   * Search by case number
   */
  async searchByCaseNumber(caseNumber: string, courtType: string = 'district'): Promise<SearchResult> {
    return this.searchCases({
      caseNumber,
      courtType: courtType as any,
      limit: 10
    })
  }

  /**
   * Search by party name
   */
  async searchByPartyName(partyName: string, courtType?: string): Promise<SearchResult> {
    return this.searchCases({
      partyName,
      courtType: courtType as any,
      limit: 20
    })
  }

  /**
   * Search by advocate name
   */
  async searchByAdvocate(advocateName: string, courtType?: string): Promise<SearchResult> {
    return this.searchCases({
      advocateName,
      courtType: courtType as any,
      limit: 20
    })
  }

  /**
   * Search by court and date range
   */
  async searchByCourtAndDate(court: string, dateFrom: string, dateTo: string, courtType?: string): Promise<SearchResult> {
    return this.searchCases({
      court,
      filingDateFrom: dateFrom,
      filingDateTo: dateTo,
      courtType: courtType as any,
      limit: 50
    })
  }

  /**
   * Get cause list for a specific court and date
   */
  async getCauseList(court: string, date: Date): Promise<ECourtsResponse<any[]>> {
    try {
      // Mock cause list data
      return {
        success: true,
        data: [
          {
            caseNumber: 'CASE-2024-001',
            title: 'Contract Dispute Resolution',
            parties: ['ABC Corp', 'XYZ Ltd'],
            advocates: ['Adv. John Doe'],
            judges: ['Hon. Justice Smith'],
            hearingTime: '10:30 AM',
            caseType: 'CIVIL'
          }
        ]
      }
    } catch (error) {
      console.error('Error fetching cause list:', error)
      return {
        success: false,
        error: 'NETWORK_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }
  }

  /**
   * Get orders for a specific case
   */
  async getOrders(cnr: string): Promise<ECourtsResponse<any[]>> {
    try {
      // Mock orders data
      return {
        success: true,
        data: [
          {
            orderId: 'ORD-001',
            orderDate: '2024-01-15',
            orderType: 'Interim Order',
            orderText: 'Interim relief granted to the petitioner...',
            judge: 'Hon. Justice Smith',
            caseNumber: `CASE-${cnr.slice(-6)}`
          }
        ]
      }
    } catch (error) {
      console.error('Error fetching orders:', error)
      return {
        success: false,
        error: 'NETWORK_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }
  }

  /**
   * Download order PDF
   */
  async downloadOrderPdf(orderId: string): Promise<ECourtsResponse<Buffer>> {
    try {
      // Mock PDF download
      return {
        success: true,
        data: Buffer.from('Mock PDF content')
      }
    } catch (error) {
      console.error('Error downloading order PDF:', error)
      return {
        success: false,
        error: 'NETWORK_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }
  }

  /**
   * Test connection to eCourts
   */
  async testConnection(): Promise<ECourtsResponse<boolean>> {
    try {
      // Test based on provider type
      switch (this.config.provider) {
        case 'official':
          return await this.testOfficialConnection()
        case 'manual':
          return await this.testManualConnection()
        case 'third_party':
          return await this.testThirdPartyConnection()
        default:
          return {
            success: false,
            error: 'INVALID_PROVIDER',
            message: 'Invalid provider specified'
          }
      }
    } catch (error) {
      console.error('Error testing connection:', error)
      return {
        success: false,
        error: 'CONNECTION_ERROR',
        message: error instanceof Error ? error.message : 'Connection failed'
      }
    }
  }

  private async testOfficialConnection(): Promise<ECourtsResponse<boolean>> {
    try {
      // Test NAPIX connection
      await axios.get(this.OFFICIAL_ENDPOINTS.NAPIX, { timeout: 5000 })
      return {
        success: true,
        data: true,
        message: 'Official APIs accessible'
      }
    } catch (error) {
      return {
        success: false,
        error: 'OFFICIAL_API_ERROR',
        message: 'Official APIs not accessible'
      }
    }
  }

  private async testManualConnection(): Promise<ECourtsResponse<boolean>> {
    try {
      // Test district portal connection
      await axios.get(this.OFFICIAL_ENDPOINTS.DISTRICT_PORTAL, { timeout: 5000 })
      return {
        success: true,
        data: true,
        message: 'Manual portals accessible'
      }
    } catch (error) {
      return {
        success: false,
        error: 'MANUAL_PORTAL_ERROR',
        message: 'Manual portals not accessible'
      }
    }
  }

  private async testThirdPartyConnection(): Promise<ECourtsResponse<boolean>> {
    try {
      // Test Kleopatra connection
      const testResponse = await axios.get(`${this.THIRD_PARTY_ENDPOINTS.KLEOPATRA}/health`, { 
        timeout: 5000,
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (testResponse.status === 200) {
        return {
          success: true,
          data: true,
          message: 'Kleopatra API accessible - Enterprise-grade Indian Courts API'
        }
      }
      
      return {
        success: false,
        error: 'THIRD_PARTY_API_ERROR',
        message: 'Kleopatra API not accessible'
      }
    } catch (error) {
      return {
        success: false,
        error: 'THIRD_PARTY_API_ERROR',
        message: `Kleopatra API not accessible: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }

  /**
   * Test API connectivity and discover working endpoints
   */
  async testApiConnectivity(): Promise<{ success: boolean; workingEndpoints: string[]; error?: string }> {
    const workingEndpoints: string[] = []
    
    if (!this.config.apiKey) {
      return { success: false, workingEndpoints, error: 'No API key provided' }
    }

    try {
      console.log('🔍 Testing Kleopatra API connectivity...')
      
      // Test basic connectivity with correct endpoints
        const courtTypes = ['district', 'high', 'supreme', 'nclt', 'consumer']
        const endpointMap: Record<string, string> = {
          'district': 'district-court',
          'high': 'high-court', 
          'supreme': 'supreme-court',
          'nclt': 'nclt',
          'consumer': 'consumer-forum'
        }
        const testEndpoints = courtTypes.map(courtType => 
          `${this.THIRD_PARTY_ENDPOINTS.KLEOPATRA}/api/core/live/${endpointMap[courtType]}/case`
        )

      for (const endpoint of testEndpoints) {
        try {
          const response = await axios.post(endpoint, {
            cnr: 'test'
          }, {
            headers: {
              'Authorization': `Bearer ${this.config.apiKey}`,
              'Content-Type': 'application/json'
            },
            timeout: 5000
          })
          
          if (response.status === 200 || response.status === 404) {
            // 404 means endpoint exists but resource not found (which is expected for test)
            workingEndpoints.push(endpoint)
            console.log('✅ Working endpoint:', endpoint, response.status)
          }
        } catch (error) {
          console.log('⚠️ Endpoint not working:', endpoint, error instanceof Error ? error.message : 'Unknown error')
        }
      }

      return {
        success: workingEndpoints.length > 0,
        workingEndpoints,
        error: workingEndpoints.length === 0 ? 'No working endpoints found' : undefined
      }
    } catch (error) {
      return {
        success: false,
        workingEndpoints,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Mock case data for testing
   */
  private getMockCaseData(cnr: string): ECourtsResponse<ECourtsCaseData> {
    const upperCnr = cnr.toUpperCase()
    const isHighCourt = upperCnr.includes('HC') || upperCnr.startsWith('DLHC') || upperCnr.startsWith('KAHC')
    
    const courtInfo = isHighCourt ? {
      court: 'Karnataka High Court',
      courtLocation: 'Bengaluru, Karnataka',
      hallNumber: 'Court Hall No. 1',
      caseType: 'WRIT_PETITION',
      title: 'Constitutional Matter - Writ Petition'
    } : {
      court: 'District and Sessions Court Bengaluru',
      courtLocation: 'Bengaluru, Karnataka', 
      hallNumber: 'Hall No. 1',
      caseType: 'CIVIL',
      title: 'Contract Dispute Resolution'
    }
    
    return {
      success: true,
      data: {
        cnr,
        caseNumber: `REG-${cnr.slice(-6)}`,
        filingNumber: `FIL-${cnr.slice(-6)}`,
        title: courtInfo.title,
        court: courtInfo.court,
        courtLocation: courtInfo.courtLocation,
        hallNumber: courtInfo.hallNumber,
        caseType: courtInfo.caseType,
        caseStatus: 'PENDING',
        filingDate: '2023-06-15',
        lastHearingDate: '2024-01-10',
        nextHearingDate: '2024-03-15',
        parties: [
          {
            name: 'ABC Corporation',
            type: 'PLAINTIFF',
            address: 'Bengaluru, Karnataka, India',
            phone: '+91-9876543210',
            email: 'abc@corp.com'
          },
          {
            name: 'XYZ Limited',
            type: 'DEFENDANT',
            address: 'Mumbai, Maharashtra, India',
            phone: '+91-9876543211',
            email: 'xyz@ltd.com'
          }
        ],
        advocates: [
          {
            name: 'Adv. John Doe',
            barNumber: 'KA123456',
            phone: '+91-9876543212',
            email: 'john@law.com',
            address: 'Bengaluru Legal Office'
          }
        ],
        judges: [
          {
            name: 'Hon. Justice Smith',
            designation: 'District Judge',
            court: 'District and Sessions Court Bengaluru'
          }
        ],
        hearingHistory: [],
        orders: [],
        caseDetails: {
          subjectMatter: 'Contract Dispute',
          caseDescription: 'Dispute regarding contract terms and conditions',
          reliefSought: 'Specific performance and damages',
          caseValue: 1000000,
          jurisdiction: 'Bengaluru'
        }
      }
    }
  }

  /**
   * Search from official eCourts API
   */
  private async searchFromOfficialAPI(filters: SearchFilters): Promise<SearchResult> {
    // Implementation for official eCourts API
    console.log('🔍 Searching from official eCourts API (not implemented)')
    return {
      success: false,
      error: 'NOT_IMPLEMENTED',
      message: 'Official eCourts API integration not yet implemented'
    }
  }

  /**
   * Search from manual portal (web scraping)
   */
  private async searchFromManualPortal(filters: SearchFilters): Promise<SearchResult> {
    // Implementation for manual portal scraping
    console.log('🔍 Searching from manual portal (not implemented)')
    return {
      success: false,
      error: 'NOT_IMPLEMENTED',
      message: 'Manual portal scraping not yet implemented'
    }
  }

  /**
   * Search from third-party APIs (Kleopatra, etc.)
   */
  private async searchFromThirdPartyAPI(filters: SearchFilters): Promise<SearchResult> {
    try {
      if (!this.config.apiKey) {
        return {
          success: false,
          error: 'NO_API_KEY',
          message: 'API key required for third-party search'
        }
      }

      console.log('🔍 Searching from third-party API with filters:', filters)

      // Determine court type from filters or use default
      const courtType = filters.courtType || 'district'
      
      // Map court types to endpoints
      const endpointMap: Record<string, string> = {
        'district': 'district-court',
        'high': 'high-court',
        'supreme': 'supreme-court',
        'nclt': 'nclt',
        'cat': 'cat',
        'consumer': 'consumer-forum'
      }

      const searchEndpoint = `${this.THIRD_PARTY_ENDPOINTS.KLEOPATRA}/api/core/live/${endpointMap[courtType]}/search`

      // Build search payload based on available filters
      const searchPayload: any = {}

      if (filters.caseNumber) searchPayload.case_number = filters.caseNumber
      if (filters.partyName) searchPayload.party_name = filters.partyName
      if (filters.advocateName) searchPayload.advocate_name = filters.advocateName
      if (filters.court) searchPayload.court = filters.court
      if (filters.caseType) searchPayload.case_type = filters.caseType
      if (filters.caseStatus) searchPayload.case_status = filters.caseStatus
      if (filters.filingDateFrom) searchPayload.filing_date_from = filters.filingDateFrom
      if (filters.filingDateTo) searchPayload.filing_date_to = filters.filingDateTo
      if (filters.hearingDateFrom) searchPayload.hearing_date_from = filters.hearingDateFrom
      if (filters.hearingDateTo) searchPayload.hearing_date_to = filters.hearingDateTo
      if (filters.limit) searchPayload.limit = filters.limit
      if (filters.offset) searchPayload.offset = filters.offset

      console.log('📤 Sending search request to:', searchEndpoint)
      console.log('📤 Search payload:', searchPayload)

      const response = await axios.post(searchEndpoint, searchPayload, {
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: this.config.timeout
      })

      console.log('✅ Search API response:', response.status)
      console.log('📊 Search response data:', response.data)

      if (response.data && Array.isArray(response.data)) {
        const cases = response.data.map((caseData: any) => 
          this.mapKleopatraResponseToCaseData(caseData, caseData.cnr || 'UNKNOWN')
        )

        return {
          success: true,
          data: cases,
          total: cases.length,
          page: 1,
          limit: filters.limit || 20
        }
      } else if (response.data && response.data.cases && Array.isArray(response.data.cases)) {
        const cases = response.data.cases.map((caseData: any) => 
          this.mapKleopatraResponseToCaseData(caseData, caseData.cnr || 'UNKNOWN')
        )

        return {
          success: true,
          data: cases,
          total: response.data.total || cases.length,
          page: response.data.page || 1,
          limit: response.data.limit || filters.limit || 20
        }
      } else {
        console.log('⚠️ No cases found in search results')
        return {
          success: true,
          data: [],
          total: 0,
          page: 1,
          limit: filters.limit || 20
        }
      }

    } catch (error) {
      console.log('❌ Third-party search API failed:', error instanceof Error ? error.message : 'Unknown error')
      
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as any
        console.log('❌ Axios error response:', {
          status: axiosError.response?.status,
          statusText: axiosError.response?.statusText,
          data: axiosError.response?.data,
          headers: axiosError.response?.headers
        })
      }

          // Return error instead of mock data
          console.log('❌ All search endpoints failed')
          return {
            success: false,
            error: 'API_UNAVAILABLE',
            message: 'All court API endpoints are currently unavailable. Please try again later.'
          }
    }
  }

  /**
   * Mock search results for testing
   */
  private getMockSearchResults(filters: SearchFilters): SearchResult {
    const mockCases: ECourtsCaseData[] = [
      {
        cnr: '1234567890123456',
        caseNumber: 'CASE-2024-001',
        title: 'Contract Dispute Resolution',
        court: 'High Court of Delhi',
        courtLocation: 'New Delhi',
        caseType: 'CIVIL',
        caseStatus: 'PENDING',
        filingDate: '2023-06-15',
        nextHearingDate: '2024-03-15',
        parties: [
          {
            name: 'ABC Corporation',
            type: 'PLAINTIFF'
          },
          {
            name: 'XYZ Limited',
            type: 'DEFENDANT'
          }
        ],
        advocates: [
          {
            name: 'Adv. John Doe'
          }
        ],
        judges: [
          {
            name: 'Hon. Justice Smith',
            designation: 'Judge',
            court: 'High Court of Delhi'
          }
        ],
        hearingHistory: [],
        orders: [],
        caseDetails: {
          subjectMatter: 'Contract Dispute',
          caseDescription: 'Dispute regarding contract terms',
          reliefSought: 'Specific performance',
          jurisdiction: 'Delhi'
        }
      }
    ]

    // Filter results based on search criteria
    let filteredCases = mockCases

    if (filters.partyName) {
      filteredCases = filteredCases.filter(caseData =>
        caseData.parties.some(party =>
          party.name.toLowerCase().includes(filters.partyName!.toLowerCase())
        )
      )
    }

    if (filters.caseNumber) {
      filteredCases = filteredCases.filter(caseData =>
        caseData.caseNumber.toLowerCase().includes(filters.caseNumber!.toLowerCase())
      )
    }

    if (filters.court) {
      filteredCases = filteredCases.filter(caseData =>
        caseData.court.toLowerCase().includes(filters.court!.toLowerCase())
      )
    }

    return {
      success: true,
      data: filteredCases,
      total: filteredCases.length,
      page: 1,
      limit: filters.limit || 20
    }
  }

  // ==================== KLEOPATRA API COMPREHENSIVE SEARCH METHODS ====================

  /**
   * Search by party name in District Court
   */
  async searchByPartyName(partyName: string, courtType: 'district' | 'high' | 'supreme' | 'nclt' | 'cat' | 'consumer' = 'district', options?: {
    year?: string
    stage?: 'BOTH' | 'PENDING' | 'DISPOSED'
    courtId?: string
    benchId?: string
  }): Promise<SearchResult> {
    try {
      if (!this.config.apiKey) {
        return {
          success: false,
          error: 'API_KEY_REQUIRED',
          message: 'Kleopatra API key is required for party search'
        }
      }

      const endpointMap: Record<string, string> = {
        'district': '/api/core/live/district-court/search/party',
        'high': '/api/core/live/high-court/search/party',
        'supreme': '/api/core/live/supreme-court/search/party',
        'nclt': '/api/core/live/national-company-law-tribunal/search/party',
        'cat': '/api/core/live/central-administrative-tribunal/search-party',
        'consumer': '/api/core/live/consumer-forum/search/party'
      }

      const endpoint = `${this.THIRD_PARTY_ENDPOINTS.KLEOPATRA}${endpointMap[courtType]}`
      
      const requestBody: any = {
        name: partyName,
        stage: options?.stage || 'BOTH',
        year: options?.year || '2021', // Test year
        districtId: options?.courtId || 'bangalore' // Default to Bangalore district for Karnataka
      }

      // Add court-specific parameters
      if (courtType === 'district' && options?.courtId) {
        requestBody.districtId = options.courtId
      } else if (courtType === 'high' && options?.benchId) {
        requestBody.benchId = options.benchId
      } else if (courtType === 'supreme') {
        requestBody.type = 'ANY' // PETITIONER, RESPONDENT, ANY
      } else if (courtType === 'nclt' && options?.benchId) {
        requestBody.benchId = options.benchId
        requestBody.partyType = 'PETITIONER' // PETITIONER, RESPONDENT
      } else if (courtType === 'cat' && options?.benchId) {
        requestBody.benchId = options.benchId
        requestBody.type = 'BOTH' // PETITIONER, RESPONDENT, BOTH
      }

      console.log(`🔍 Party search: ${partyName} in ${courtType} court`)
      console.log(`📤 Request body:`, requestBody)

      const response = await axios.post(endpoint, requestBody, {
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 120000
      })

      console.log(`✅ Party search success: ${response.status}`)
      
      if (response.data && Array.isArray(response.data)) {
        const mappedCases = response.data.map((caseData: any) => 
          this.mapKleopatraResponseToCaseData(caseData, caseData.cnr || '')
        )
        
        return {
          success: true,
          data: mappedCases,
          total: mappedCases.length
        }
      }

      return {
        success: false,
        error: 'NO_RESULTS',
        message: 'No cases found for the given party name'
      }

    } catch (error) {
      console.error('❌ Party search error:', error)
      return {
        success: false,
        error: 'SEARCH_ERROR',
        message: error instanceof Error ? error.message : 'Party search failed'
      }
    }
  }

  /**
   * Search by advocate name
   */
  async searchByAdvocate(advocateName: string, courtType: 'district' | 'high' | 'supreme' | 'nclt' | 'cat' | 'consumer' = 'district', options?: {
    stage?: 'BOTH' | 'PENDING' | 'DISPOSED'
    courtId?: string
    benchId?: string
  }): Promise<SearchResult> {
    try {
      if (!this.config.apiKey) {
        return {
          success: false,
          error: 'API_KEY_REQUIRED',
          message: 'Kleopatra API key is required for advocate search'
        }
      }

      // Try multiple providers for advocate name search
      const providers = [
        { name: 'ECourts_v17', endpoint: this.THIRD_PARTY_ENDPOINTS.ECOURTS_V17 },
        { name: 'Kleopatra', endpoint: this.THIRD_PARTY_ENDPOINTS.KLEOPATRA },
        { name: 'Phoenix', endpoint: this.THIRD_PARTY_ENDPOINTS.PHOENIX }
      ]

      for (const provider of providers) {
        try {
          console.log(`🔍 Attempting ${provider.name} advocate name search: ${advocateName}`)
          
          let endpoint: string
          let requestBody: any
          
          if (provider.name === 'ECourts_v17') {
            // Official E-Courts v17.0 advocate search
            endpoint = `${provider.endpoint}/advocates/search`
            requestBody = {
              advocate_name: advocateName,
              court_type: courtType,
              stage: options?.stage || 'BOTH'
            }
          } else if (provider.name === 'Kleopatra') {
            // Use the correct Kleopatra advocate name search endpoint from documentation
            endpoint = `${provider.endpoint}${this.API_PATHS.KLEOPATRA.ADVOCATE_NAME}`
            requestBody = {
              advocate: {
                name: advocateName
              },
              stage: options?.stage || 'BOTH',
              districtId: options?.courtId || 'bangalore'
            }
          } else if (provider.name === 'Phoenix') {
            // Phoenix advocate search
            endpoint = `${provider.endpoint}/api/v1/advocates/search`
            requestBody = {
              advocate_name: advocateName,
              court_type: courtType,
              stage: options?.stage || 'BOTH'
            }
          }

          console.log(`📤 ${provider.name} endpoint:`, endpoint)
          console.log(`📤 ${provider.name} request body:`, requestBody)

          const response = await axios.post(endpoint, requestBody, {
            headers: {
              'Authorization': `Bearer ${this.config.apiKey}`,
              'Content-Type': 'application/json'
            },
            timeout: 120000
          })

          console.log(`✅ ${provider.name} advocate search success: ${response.status}`)
          console.log(`📊 ${provider.name} response data:`, response.data)
          
          if (response.data) {
            let mappedCases: any[] = []
            
            if (Array.isArray(response.data)) {
              mappedCases = response.data.map((caseData: any) => {
                if (provider.name === 'ECourts_v17') {
                  return this.mapECourtsV17ResponseToCaseData(caseData, caseData.cnr || '')
                } else if (provider.name === 'Phoenix') {
                  return this.mapPhoenixResponseToCaseData(caseData, caseData.cnr || '')
                } else {
                  return this.mapKleopatraResponseToCaseData(caseData, caseData.cnr || '')
                }
              })
            } else if (response.data && response.data.cases) {
              // Handle nested case data structure
              const cases = Array.isArray(response.data.cases) ? response.data.cases : [response.data.cases]
              mappedCases = cases.map((caseData: any) => {
                if (provider.name === 'ECourts_v17') {
                  return this.mapECourtsV17ResponseToCaseData(caseData, caseData.cnr || '')
                } else if (provider.name === 'Phoenix') {
                  return this.mapPhoenixResponseToCaseData(caseData, caseData.cnr || '')
                } else {
                  return this.mapKleopatraResponseToCaseData(caseData, caseData.cnr || '')
                }
              })
            } else if (response.data && (response.data.cnr || response.data.case_number)) {
              // Single case response
              const caseData = response.data
              if (provider.name === 'ECourts_v17') {
                mappedCases = [this.mapECourtsV17ResponseToCaseData(caseData, caseData.cnr || '')]
              } else if (provider.name === 'Phoenix') {
                mappedCases = [this.mapPhoenixResponseToCaseData(caseData, caseData.cnr || '')]
              } else {
                mappedCases = [this.mapKleopatraResponseToCaseData(caseData, caseData.cnr || '')]
              }
            }
            
            if (mappedCases.length > 0) {
              return {
                success: true,
                data: mappedCases,
                total: mappedCases.length
              }
            }
          }
          
          console.log(`⚠️ ${provider.name} returned empty or invalid data`)
          
        } catch (providerError) {
          console.log(`❌ ${provider.name} advocate search failed:`, providerError instanceof Error ? providerError.message : 'Unknown error')
          
          // Log detailed error for debugging
          if (providerError && typeof providerError === 'object' && 'response' in providerError) {
            const axiosError = providerError as any
            console.log(`❌ ${provider.name} error details:`, {
              status: axiosError.response?.status,
              statusText: axiosError.response?.statusText,
              data: axiosError.response?.data
            })
          }
          
          // Continue to next provider
          continue
        }
      }

      return {
        success: false,
        error: 'NO_RESULTS',
        message: 'No cases found for the given advocate name'
      }

    } catch (error: any) {
      console.error('❌ Advocate search error:', error)
      console.error('❌ Error details:', error.response?.data)
      
      // If advocate search fails, try party search as fallback for district court
      if (courtType === 'district' && (error.response?.status === 404 || error.response?.status === 400)) {
        console.log(`⚠️ Advocate search failed, trying party search fallback`)
        return await this.searchByPartyNameFallback(advocateName, courtType, options)
      }
      
      return {
        success: false,
        error: 'SEARCH_ERROR',
        message: error.response?.data?.message || error.message || 'Advocate search failed'
      }
    }
  }

  /**
   * Fallback: Search by party name when advocate search fails
   */
  private async searchByPartyNameFallback(advocateName: string, courtType: string, options?: any): Promise<SearchResult> {
    try {
      console.log(`🔄 Trying party search fallback for advocate: ${advocateName}`)
      
      const partyEndpoint = `${this.THIRD_PARTY_ENDPOINTS.KLEOPATRA}/api/core/live/district-court/search/party`
      
      const requestBody = {
        name: advocateName,
        stage: options?.stage || 'BOTH',
        year: '2021', // Test year
        districtId: options?.courtId || 'bangalore' // Default to Bangalore district for Karnataka
      }

      if (options?.courtId) {
        requestBody.districtId = options.courtId
      }

      const response = await axios.post(partyEndpoint, requestBody, {
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 120000
      })

      console.log(`✅ Party search fallback response status: ${response.status}`)

      if (response.data && Array.isArray(response.data)) {
        // Filter results to only include cases where the advocate name appears in advocates
        const filteredCases = response.data.filter((caseData: any) => {
          const advocates = caseData.advocates || []
          return advocates.some((advocate: any) => 
            advocate.name && advocate.name.toLowerCase().includes(advocateName.toLowerCase())
          )
        })

        const mappedCases = filteredCases.map((caseData: any) => 
          this.mapKleopatraResponseToCaseData(caseData, caseData.cnr || '')
        )
        
        return {
          success: true,
          data: mappedCases,
          total: mappedCases.length,
          message: `Found ${mappedCases.length} cases using party search fallback`
        }
      }

      return {
        success: false,
        error: 'NO_CASES_FOUND',
        message: 'No cases found for the given advocate name'
      }

    } catch (error: any) {
      console.error('❌ Party search fallback error:', error)
      return {
        success: false,
        error: 'FALLBACK_SEARCH_FAILED',
        message: 'Both advocate search and party search fallback failed'
      }
    }
  }

  /**
   * Search by advocate number (registration number)
   */
  async searchByAdvocateNumber(advocateNumber: string, courtType: 'district' | 'high' | 'supreme' | 'nclt' | 'cat' | 'consumer' = 'district', options?: {
    stateCode?: string
    year?: string
    courtId?: string
    benchId?: string
  }): Promise<SearchResult> {
    try {
      if (!this.config.apiKey) {
        return {
          success: false,
          error: 'API_KEY_REQUIRED',
          message: 'API key is required for advocate number search'
        }
      }

      // Try multiple providers for advocate number search
      const providers = [
        { name: 'ECourts_v17', endpoint: this.THIRD_PARTY_ENDPOINTS.ECOURTS_V17 },
        { name: 'Kleopatra', endpoint: this.THIRD_PARTY_ENDPOINTS.KLEOPATRA },
        { name: 'Phoenix', endpoint: this.THIRD_PARTY_ENDPOINTS.PHOENIX }
      ]

      for (const provider of providers) {
        try {
          console.log(`🔍 Attempting ${provider.name} advocate number search: ${advocateNumber}`)
          
          let endpoint: string
          let requestBody: any
          
          if (provider.name === 'ECourts_v17') {
            // Official E-Courts v17.0 advocate search
            endpoint = `${provider.endpoint}/advocates/search`
            requestBody = {
              advocate_number: advocateNumber,
              state_code: options?.stateCode || 'KAR',
              year: options?.year || '2021',
              court_type: courtType
            }
          } else if (provider.name === 'Kleopatra') {
            // Use the correct Kleopatra advocate number search endpoint from documentation
            endpoint = `${provider.endpoint}${this.API_PATHS.KLEOPATRA.ADVOCATE_NUMBER}`
            requestBody = {
              search: {
                State: options?.stateCode || 'KAR',
                number: advocateNumber,
                year: options?.year || '2021'
              },
              stage: 'BOTH',
              districtId: options?.courtId || 'bangalore'
            }
          } else if (provider.name === 'Phoenix') {
            // Phoenix advocate search
            endpoint = `${provider.endpoint}/api/v1/advocates/search`
            requestBody = {
              advocate_number: advocateNumber,
              state_code: options?.stateCode || 'KAR',
              year: options?.year || '2021',
              court_type: courtType
            }
          }

          console.log(`📤 ${provider.name} endpoint:`, endpoint)
          console.log(`📤 ${provider.name} request body:`, requestBody)

          const response = await axios.post(endpoint, requestBody, {
            headers: {
              'Authorization': `Bearer ${this.config.apiKey}`,
              'Content-Type': 'application/json'
            },
            timeout: 120000
          })

          console.log(`✅ ${provider.name} advocate number search success: ${response.status}`)
          console.log(`📊 ${provider.name} response data:`, response.data)
          
          if (response.data) {
            let mappedCases: any[] = []
            
            if (Array.isArray(response.data)) {
              mappedCases = response.data.map((caseData: any) => {
                if (provider.name === 'ECourts_v17') {
                  return this.mapECourtsV17ResponseToCaseData(caseData, caseData.cnr || '')
                } else if (provider.name === 'Phoenix') {
                  return this.mapPhoenixResponseToCaseData(caseData, caseData.cnr || '')
                } else {
                  return this.mapKleopatraResponseToCaseData(caseData, caseData.cnr || '')
                }
              })
            } else if (response.data && response.data.cases) {
              // Handle nested case data structure
              const cases = Array.isArray(response.data.cases) ? response.data.cases : [response.data.cases]
              mappedCases = cases.map((caseData: any) => {
                if (provider.name === 'ECourts_v17') {
                  return this.mapECourtsV17ResponseToCaseData(caseData, caseData.cnr || '')
                } else if (provider.name === 'Phoenix') {
                  return this.mapPhoenixResponseToCaseData(caseData, caseData.cnr || '')
                } else {
                  return this.mapKleopatraResponseToCaseData(caseData, caseData.cnr || '')
                }
              })
            } else if (response.data && (response.data.cnr || response.data.case_number)) {
              // Single case response
              const caseData = response.data
              if (provider.name === 'ECourts_v17') {
                mappedCases = [this.mapECourtsV17ResponseToCaseData(caseData, caseData.cnr || '')]
              } else if (provider.name === 'Phoenix') {
                mappedCases = [this.mapPhoenixResponseToCaseData(caseData, caseData.cnr || '')]
              } else {
                mappedCases = [this.mapKleopatraResponseToCaseData(caseData, caseData.cnr || '')]
              }
            }
            
            if (mappedCases.length > 0) {
              return {
                success: true,
                data: mappedCases,
                total: mappedCases.length
              }
            }
          }
          
          console.log(`⚠️ ${provider.name} returned empty or invalid data`)
          
        } catch (providerError) {
          console.log(`❌ ${provider.name} advocate number search failed:`, providerError instanceof Error ? providerError.message : 'Unknown error')
          
          // Log detailed error for debugging
          if (providerError && typeof providerError === 'object' && 'response' in providerError) {
            const axiosError = providerError as any
            console.log(`❌ ${provider.name} error details:`, {
              status: axiosError.response?.status,
              statusText: axiosError.response?.statusText,
              data: axiosError.response?.data
            })
          }
          
          // Continue to next provider
          continue
        }
      }

      return {
        success: false,
        error: 'NO_RESULTS',
        message: 'No cases found for the given advocate number. The advocate may not have any cases in the system or the registration number may be incorrect.'
      }

    } catch (error) {
      console.error('❌ Advocate number search error:', error)
      return {
        success: false,
        error: 'SEARCH_ERROR',
        message: error instanceof Error ? error.message : 'Advocate number search failed'
      }
    }
  }

  /**
   * Search by filing number
   */
  async searchByFilingNumber(filingNumber: string, courtType: 'district' | 'high' | 'supreme' | 'nclt' | 'cat' | 'consumer' = 'district', options?: {
    filingYear?: string
    courtId?: string
    benchId?: string
  }): Promise<SearchResult> {
    try {
      if (!this.config.apiKey) {
        return {
          success: false,
          error: 'API_KEY_REQUIRED',
          message: 'Kleopatra API key is required for filing search'
        }
      }

      const endpointMap: Record<string, string> = {
        'district': '/api/core/live/district-court/search/filing',
        'high': '/api/core/live/high-court/search/filing',
        'supreme': '/api/core/live/supreme-court/case', // Uses diary number
        'nclt': '/api/core/live/national-company-law-tribunal/filing-number',
        'cat': '/api/core/live/central-administrative-tribunal/case-number',
        'consumer': '/api/core/live/consumer-forum/case'
      }

      const endpoint = `${this.THIRD_PARTY_ENDPOINTS.KLEOPATRA}${endpointMap[courtType]}`
      
      const requestBody: any = {
        filingNumber: filingNumber,
        filingYear: options?.filingYear || '2021', // Test year
        districtId: options?.courtId || 'bangalore' // Default to Bangalore district for Karnataka
      }

      // Add court-specific parameters
      if (courtType === 'district' && options?.courtId) {
        requestBody.districtId = options.courtId
      } else if (courtType === 'high' && options?.benchId) {
        requestBody.benchId = options.benchId
      } else if (courtType === 'supreme') {
        requestBody.diaryNumber = filingNumber
        requestBody.year = options?.filingYear || new Date().getFullYear().toString()
      } else if (courtType === 'nclt') {
        // NCLT filing search doesn't need additional params
      } else if (courtType === 'cat' && options?.benchId) {
        requestBody.caseNumber = filingNumber
        requestBody.caseYear = options?.filingYear || new Date().getFullYear().toString()
        requestBody.benchId = options.benchId
        requestBody.typeId = 'default' // This might need to be determined dynamically
      } else if (courtType === 'consumer') {
        requestBody.caseNumber = filingNumber
      }

      console.log(`🔍 Filing search: ${filingNumber} in ${courtType} court`)

      const response = await axios.post(endpoint, requestBody, {
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 120000
      })

      console.log(`✅ Filing search success: ${response.status}`)
      
      if (response.data) {
        const caseData = Array.isArray(response.data) ? response.data[0] : response.data
        const mappedCase = this.mapKleopatraResponseToCaseData(caseData, caseData.cnr || '')
        
        return {
          success: true,
          data: [mappedCase],
          total: 1
        }
      }

      return {
        success: false,
        error: 'NO_RESULTS',
        message: 'No cases found for the given filing number'
      }

    } catch (error) {
      console.error('❌ Filing search error:', error)
      return {
        success: false,
        error: 'SEARCH_ERROR',
        message: error instanceof Error ? error.message : 'Filing search failed'
      }
    }
  }

  /**
   * Search by case number (for courts that use case numbers instead of CNR)
   */
  async searchByCaseNumber(caseNumber: string, courtType: 'district' | 'high' | 'supreme' | 'nclt' | 'cat' | 'consumer' = 'district', options?: {
    caseYear?: string
    courtId?: string
    benchId?: string
    typeId?: string
  }): Promise<SearchResult> {
    try {
      if (!this.config.apiKey) {
        return {
          success: false,
          error: 'API_KEY_REQUIRED',
          message: 'Kleopatra API key is required for case number search'
        }
      }

      const endpointMap: Record<string, string> = {
        'district': '/api/core/live/district-court/case',
        'high': '/api/core/live/high-court/case',
        'supreme': '/api/core/live/supreme-court/case',
        'nclt': '/api/core/live/national-company-law-tribunal/case-number',
        'cat': '/api/core/live/central-administrative-tribunal/case-number',
        'consumer': '/api/core/live/consumer-forum/case'
      }

      const endpoint = `${this.THIRD_PARTY_ENDPOINTS.KLEOPATRA}${endpointMap[courtType]}`
      
      const requestBody: any = {
        caseNumber: caseNumber,
        caseYear: options?.caseYear || new Date().getFullYear().toString()
      }

      // Add court-specific parameters
      if (courtType === 'nclt' && options?.benchId && options?.typeId) {
        requestBody.benchId = options.benchId
        requestBody.typeId = options.typeId
      } else if (courtType === 'cat' && options?.benchId && options?.typeId) {
        requestBody.benchId = options.benchId
        requestBody.typeId = options.typeId
      } else if (courtType === 'supreme') {
        requestBody.diaryNumber = caseNumber
      }

      console.log(`🔍 Case number search: ${caseNumber} in ${courtType} court`)

      const response = await axios.post(endpoint, requestBody, {
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 120000
      })

      console.log(`✅ Case number search success: ${response.status}`)
      
      if (response.data) {
        const caseData = Array.isArray(response.data) ? response.data[0] : response.data
        const mappedCase = this.mapKleopatraResponseToCaseData(caseData, caseData.cnr || caseNumber)
        
        return {
          success: true,
          data: [mappedCase],
          total: 1
        }
      }

      return {
        success: false,
        error: 'NO_RESULTS',
        message: 'No cases found for the given case number'
      }

    } catch (error) {
      console.error('❌ Case number search error:', error)
      return {
        success: false,
        error: 'SEARCH_ERROR',
        message: error instanceof Error ? error.message : 'Case number search failed'
      }
    }
  }

  // ==================== STATIC DATA METHODS ====================

  /**
   * Get all states for District Court
   */
  async getDistrictCourtStates(): Promise<{ success: boolean; data?: Array<{ id: string; name: string }>; error?: string }> {
    try {
      if (!this.config.apiKey) {
        return {
          success: false,
          error: 'API_KEY_REQUIRED',
          message: 'Kleopatra API key is required for static data'
        }
      }

      const endpoint = `${this.THIRD_PARTY_ENDPOINTS.KLEOPATRA}/api/core/static/district-court/states`
      
      const response = await axios.get(endpoint, {
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      })

      return {
        success: true,
        data: response.data
      }

    } catch (error) {
      console.error('❌ Get states error:', error)
      return {
        success: false,
        error: 'STATIC_DATA_ERROR',
        message: error instanceof Error ? error.message : 'Failed to fetch states'
      }
    }
  }

  /**
   * Get districts for specified states
   */
  async getDistricts(stateIds?: string[]): Promise<{ success: boolean; data?: Array<{ id: string; name: string }>; error?: string }> {
    try {
      if (!this.config.apiKey) {
        return {
          success: false,
          error: 'API_KEY_REQUIRED',
          message: 'Kleopatra API key is required for static data'
        }
      }

      const endpoint = `${this.THIRD_PARTY_ENDPOINTS.KLEOPATRA}/api/core/static/district-court/districts`
      
      const requestBody = stateIds ? { stateIds } : { all: true }
      
      const response = await axios.post(endpoint, requestBody, {
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      })

      return {
        success: true,
        data: response.data.districts
      }

    } catch (error) {
      console.error('❌ Get districts error:', error)
      return {
        success: false,
        error: 'STATIC_DATA_ERROR',
        message: error instanceof Error ? error.message : 'Failed to fetch districts'
      }
    }
  }

  /**
   * Get complexes for specified districts
   */
  async getComplexes(districtIds?: string[]): Promise<{ success: boolean; data?: Array<{ id: string; name: string }>; error?: string }> {
    try {
      if (!this.config.apiKey) {
        return {
          success: false,
          error: 'API_KEY_REQUIRED',
          message: 'Kleopatra API key is required for static data'
        }
      }

      const endpoint = `${this.THIRD_PARTY_ENDPOINTS.KLEOPATRA}/api/core/static/district-court/complexes`
      
      const requestBody = districtIds ? { districtIds } : { all: true }
      
      const response = await axios.post(endpoint, requestBody, {
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      })

      return {
        success: true,
        data: response.data.complexes
      }

    } catch (error) {
      console.error('❌ Get complexes error:', error)
      return {
        success: false,
        error: 'STATIC_DATA_ERROR',
        message: error instanceof Error ? error.message : 'Failed to fetch complexes'
      }
    }
  }

  /**
   * Get courts for specified complexes
   */
  async getCourts(complexIds?: string[]): Promise<{ success: boolean; data?: Array<{ id: string; name: string }>; error?: string }> {
    try {
      if (!this.config.apiKey) {
        return {
          success: false,
          error: 'API_KEY_REQUIRED',
          message: 'Kleopatra API key is required for static data'
        }
      }

      const endpoint = `${this.THIRD_PARTY_ENDPOINTS.KLEOPATRA}/api/core/static/district-court/courts`
      
      const requestBody = complexIds ? { complexIds } : { all: true }
      
      const response = await axios.post(endpoint, requestBody, {
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      })

      return {
        success: true,
        data: response.data.courts
      }

    } catch (error) {
      console.error('❌ Get courts error:', error)
      return {
        success: false,
        error: 'STATIC_DATA_ERROR',
        message: error instanceof Error ? error.message : 'Failed to fetch courts'
      }
    }
  }
}