import { NextRequest, NextResponse } from 'next/server'
import { ECourtsProvider, ECourtsCaseData } from '@/lib/ecourts-provider'

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    
    const courtType = searchParams.get('courtType') || 'district'
    const searchType = searchParams.get('searchType') || 'cnr'
    
    // New Court Type driven parameters
    const cnrNumber = searchParams.get('cnrNumber') || searchParams.get('cnr')
    const partyName = searchParams.get('partyName')
    const state = searchParams.get('state')
    const district = searchParams.get('district')
    const complex = searchParams.get('complex')
    const caseStage = searchParams.get('caseStage')
    const year = searchParams.get('year')
    const advocateName = searchParams.get('advocateName')
    const advocateNumber = searchParams.get('advocateNumber')
    const filingNumber = searchParams.get('filingNumber')
    
    // Legacy parameters for backward compatibility
    const searchQuery = searchParams.get('searchQuery') || cnrNumber || ''

    console.log(`🔍 Advanced search: ${searchType} in ${courtType} court`)
    console.log(`📋 Parameters:`, { cnrNumber, partyName, advocateName, advocateNumber, filingNumber })

    // Initialize ECourts provider with Kleopatra API only
    const config = {
      provider: 'third_party' as const,
      apiKey: process.env.KLEOPATRA_API_KEY || process.env.ECOURTS_API_KEY || 'klc_2cef7fc42178c58211cd8b8b1d23c3206c1e778f13ed566237803d8897a9b104', // Kleopatra API Key
      timeout: 120000
    }
    const ecourtsProvider = new ECourtsProvider(config)

    let result: ECourtsCaseData | null = null

    // Handle different search types based on Court Type
    if (courtType === 'district') {
      switch (searchType) {
        case 'cnr':
          const cnrToSearch = cnrNumber || searchQuery
          if (!cnrToSearch?.trim()) {
            return NextResponse.json({
              success: false,
              error: 'CNR Number is required for CNR lookup'
            }, { status: 400 })
          }
          result = await ecourtsProvider.getCaseByCNR(cnrToSearch, courtType as any)
          break
          
        case 'party':
          if (!partyName?.trim()) {
            return NextResponse.json({
              success: false,
              error: 'Party Name is required for party search'
            }, { status: 400 })
          }
          console.log(`🔍 Party search for: ${partyName}`)
          const partyResult = await ecourtsProvider.searchByPartyName(partyName, courtType as any, {
            year: year,
            stage: caseStage === 'both' ? 'BOTH' : caseStage === 'pending' ? 'PENDING' : 'DISPOSED',
            courtId: complex // Use complex as courtId for district court
          })
          if (partyResult.success && partyResult.data && partyResult.data.length > 0) {
            result = partyResult.data[0] as any
          } else {
            return NextResponse.json({
              success: false,
              error: partyResult.error || 'No cases found for the given party name',
              message: partyResult.message || 'Party search failed'
            }, { status: 404 })
          }
          break
          
        case 'advocate':
          if (!advocateName?.trim()) {
            return NextResponse.json({
              success: false,
              error: 'Advocate Name is required for advocate search'
            }, { status: 400 })
          }
          console.log(`🔍 Advocate search for: ${advocateName}`)
          const advocateResult = await ecourtsProvider.searchByAdvocate(advocateName, courtType as any, {
            stage: 'BOTH',
            courtId: complex, // Use complex as courtId for district court
            stateCode: 'KAR', // Karnataka state code
            year: '2021' // Test year
          })
          
          console.log(`📊 Advocate search result:`, advocateResult)
          
          if (advocateResult.success && advocateResult.data && advocateResult.data.length > 0) {
            result = advocateResult.data[0] as any
            console.log(`✅ Advocate search found ${advocateResult.data.length} cases`)
          } else {
            console.log(`❌ Advocate search failed:`, advocateResult.error, advocateResult.message)
            return NextResponse.json({
              success: false,
              error: advocateResult.error || 'NO_CASES_FOUND',
              message: advocateResult.message || 'No cases found for the given advocate name. Try searching by party name instead.'
            }, { status: 404 })
          }
          break
          
        case 'advocateNumber':
          if (!advocateNumber?.trim()) {
            return NextResponse.json({
              success: false,
              error: 'Advocate Number is required for advocate number search'
            }, { status: 400 })
          }
          console.log(`🔍 Advocate number search for: ${advocateNumber}`)
          const advocateNumberResult = await ecourtsProvider.searchByAdvocateNumber(advocateNumber, courtType as any, {
            stateCode: state || 'KAR', // Default to Karnataka if not provided
            year: year || '2021', // Default to 2021 if not provided
            courtId: complex // Use complex as courtId for district court
          })
          if (advocateNumberResult.success && advocateNumberResult.data && advocateNumberResult.data.length > 0) {
            result = advocateNumberResult.data[0] as any
          } else {
            return NextResponse.json({
              success: false,
              error: advocateNumberResult.error || 'No cases found for the given advocate number',
              message: advocateNumberResult.message || 'Advocate number search completed successfully'
            }, { status: 404 })
          }
          break
          
        case 'filing':
          if (!filingNumber?.trim()) {
            return NextResponse.json({
              success: false,
              error: 'Filing Number is required for filing search'
            }, { status: 400 })
          }
          console.log(`🔍 Filing search for: ${filingNumber}`)
          const filingResult = await ecourtsProvider.searchByFilingNumber(filingNumber, courtType as any, {
            filingYear: year,
            courtId: complex // Use complex as courtId for district court
          })
          if (filingResult.success && filingResult.data && filingResult.data.length > 0) {
            result = filingResult.data[0] as any
          } else {
            return NextResponse.json({
              success: false,
              error: filingResult.error || 'No cases found for the given filing number',
              message: filingResult.message || 'Filing search failed'
            }, { status: 404 })
          }
          break
          
        default:
          return NextResponse.json({
            success: false,
            error: `Unsupported search type: ${searchType} for ${courtType} court`
          }, { status: 400 })
      }
    } else {
      // Other court types - not implemented yet
      return NextResponse.json({
        success: false,
        error: `Search functions for ${courtType} court are not yet implemented`,
        message: 'Currently only District Court search functions are available.'
      }, { status: 501 })
    }

    if (!result) {
      return NextResponse.json({
        success: false,
        error: 'No case found matching the search criteria'
      }, { status: 404 })
    }

    // Map the result to our case format
    const mappedCase = {
      id: Date.now().toString(),
      cnrNumber: result.cnr || '',
      caseNumber: result.details?.registrationNumber || result.details?.filingNumber || '',
      filingNumber: result.details?.filingNumber || '',
      title: result.title || '',
      petitionerName: result.parties?.petitioners?.[0] || '',
      respondentName: result.parties?.respondents?.[0] || '',
      court: result.status?.courtNumberAndJudge || '',
      courtLocation: result.status?.courtNumberAndJudge || '',
      hallNumber: '',
      caseType: result.details?.type || '',
      caseStatus: result.status?.caseStage || '',
      filingDate: result.details?.filingDate || '',
      lastHearingDate: result.status?.nextHearingDate || '',
      nextHearingDate: result.status?.nextHearingDate || '',
      priority: 'MEDIUM' as const,
      stage: result.status?.caseStage || '',
      subjectMatter: '',
      reliefSought: '',
      caseValue: 0,
      jurisdiction: '',
      advocates: [
        ...(result.parties?.petitionerAdvocates || []).map(name => ({ name, type: 'Petitioner' })),
        ...(result.parties?.respondentAdvocates || []).map(name => ({ name, type: 'Respondent' }))
      ],
      judges: result.status?.courtNumberAndJudge ? [{
        name: result.status.courtNumberAndJudge,
        designation: 'Judge',
        court: courtType
      }] : [],
      parties: [
        ...(result.parties?.petitioners || []).map(name => ({ name, type: 'PETITIONER' as const })),
        ...(result.parties?.respondents || []).map(name => ({ name, type: 'RESPONDENT' as const }))
      ],
      hearingHistory: result.history?.map(hearing => ({
        date: hearing.businessDate || hearing.date || '',
        purpose: hearing.purpose || '',
        judge: hearing.judge || '',
        status: hearing.status || '',
        nextDate: hearing.nextDate || '',
        url: hearing.url || ''
      })) || [],
      orders: result.orders?.map(order => ({
        number: order.number || 0,
        name: order.name || '',
        date: order.date || '',
        url: order.url || ''
      })) || [],
      actsAndSections: {
        acts: result.actsAndSections?.acts || '',
        sections: result.actsAndSections?.sections || ''
      },
      registrationNumber: result.details?.registrationNumber || '',
      registrationDate: result.details?.registrationDate || '',
      firstHearingDate: result.status?.firstHearingDate || '',
      decisionDate: result.status?.decisionDate || '',
      natureOfDisposal: result.status?.natureOfDisposal || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    console.log(`✅ Advanced search completed: ${searchType} in ${courtType} court`)
    console.log(`📊 Found case: ${mappedCase.title}`)

    return NextResponse.json({
      success: true,
      data: mappedCase,
      searchType,
      courtType,
      searchParams: {
        cnrNumber,
        partyName,
        state,
        district,
        complex,
        caseStage,
        year,
        advocateName,
        advocateNumber,
        filingNumber
      }
    })

  } catch (error) {
    console.error('❌ Advanced search error:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Advanced search failed'
    }, { status: 500 })
  }
}
