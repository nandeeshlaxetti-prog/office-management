import { NextRequest, NextResponse } from 'next/server'
import { ECourtsProvider } from '@/lib/ecourts-provider'

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    
    const searchType = searchParams.get('searchType') || 'number' // 'number' or 'name'
    const courtType = searchParams.get('courtType') || 'district'
    const advocateNumber = searchParams.get('advocateNumber')
    const advocateName = searchParams.get('advocateName')
    const state = searchParams.get('state') || 'KAR'
    const year = searchParams.get('year') || '2021'
    const complex = searchParams.get('complex') || 'bangalore'

    console.log(`🔍 Advocate search: ${searchType} in ${courtType} court`)
    console.log(`📋 Parameters:`, { advocateNumber, advocateName, state, year, complex })

    // Initialize ECourts provider with Kleopatra API only
    const config = {
      provider: 'third_party' as const,
      apiKey: process.env.KLEOPATRA_API_KEY || process.env.ECOURTS_API_KEY || 'klc_2cef7fc42178c58211cd8b8b1d23c3206c1e778f13ed566237803d8897a9b104', // Kleopatra API Key
      timeout: 30000
    }
    const ecourtsProvider = new ECourtsProvider(config)

    let result: any = null

    if (searchType === 'number' && advocateNumber?.trim()) {
      console.log(`🔍 Advocate number search for: ${advocateNumber}`)
      const advocateNumberResult = await ecourtsProvider.searchByAdvocateNumber(advocateNumber, courtType as any, {
        stateCode: state,
        year: year,
        courtId: complex
      })
      if (advocateNumberResult.success && advocateNumberResult.data && advocateNumberResult.data.length > 0) {
        result = advocateNumberResult.data[0] as any
      } else {
        return NextResponse.json({
          success: false,
          error: advocateNumberResult.error || 'NO_RESULTS',
          message: advocateNumberResult.message || 'No cases found for the given advocate number'
        }, { status: 404 })
      }
    } else if (searchType === 'name' && advocateName?.trim()) {
      console.log(`🔍 Advocate name search for: ${advocateName}`)
      const advocateNameResult = await ecourtsProvider.searchByAdvocate(advocateName, courtType as any, {
        stage: 'BOTH',
        courtId: complex
      })
      if (advocateNameResult.success && advocateNameResult.data && advocateNameResult.data.length > 0) {
        result = advocateNameResult.data[0] as any
      } else {
        return NextResponse.json({
          success: false,
          error: advocateNameResult.error || 'NO_RESULTS',
          message: advocateNameResult.message || 'No cases found for the given advocate name'
        }, { status: 404 })
      }
    } else {
      return NextResponse.json({
        success: false,
        error: 'INVALID_PARAMETERS',
        message: 'Either advocateNumber or advocateName must be provided'
      }, { status: 400 })
    }

    if (!result) {
      return NextResponse.json({
        success: false,
        error: 'NO_CASES_FOUND',
        message: 'No cases found for the given advocate'
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
      caseValue: '',
      caseDescription: result.title || '',
      caseNotes: '',
      tags: [],
      documents: [],
      hearings: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    return NextResponse.json({
      success: true,
      data: mappedCase,
      message: `Advocate ${searchType} search completed successfully`
    })

  } catch (error) {
    console.error('❌ Advocate search API error:', error)
    return NextResponse.json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: error instanceof Error ? error.message : 'Advocate search failed'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const { searchType, courtType, advocateNumber, advocateName, state, year, complex } = body

    console.log(`🔍 Advocate search POST: ${searchType} in ${courtType} court`)
    console.log(`📋 Parameters:`, { advocateNumber, advocateName, state, year, complex })

    // Initialize ECourts provider with Kleopatra API only
    const config = {
      provider: 'third_party' as const,
      apiKey: process.env.KLEOPATRA_API_KEY || process.env.ECOURTS_API_KEY || 'klc_2cef7fc42178c58211cd8b8b1d23c3206c1e778f13ed566237803d8897a9b104', // Kleopatra API Key
      timeout: 30000
    }
    const ecourtsProvider = new ECourtsProvider(config)

    let result: any = null

    if (searchType === 'number' && advocateNumber?.trim()) {
      console.log(`🔍 Advocate number search for: ${advocateNumber}`)
      const advocateNumberResult = await ecourtsProvider.searchByAdvocateNumber(advocateNumber, courtType || 'district', {
        stateCode: state || 'KAR',
        year: year || '2021',
        courtId: complex || 'bangalore'
      })
      if (advocateNumberResult.success && advocateNumberResult.data && advocateNumberResult.data.length > 0) {
        result = advocateNumberResult.data[0] as any
      } else {
        return NextResponse.json({
          success: false,
          error: advocateNumberResult.error || 'NO_RESULTS',
          message: advocateNumberResult.message || 'No cases found for the given advocate number'
        }, { status: 404 })
      }
    } else if (searchType === 'name' && advocateName?.trim()) {
      console.log(`🔍 Advocate name search for: ${advocateName}`)
      const advocateNameResult = await ecourtsProvider.searchByAdvocate(advocateName, courtType || 'district', {
        stage: 'BOTH',
        courtId: complex || 'bangalore'
      })
      if (advocateNameResult.success && advocateNameResult.data && advocateNameResult.data.length > 0) {
        result = advocateNameResult.data[0] as any
      } else {
        return NextResponse.json({
          success: false,
          error: advocateNameResult.error || 'NO_RESULTS',
          message: advocateNameResult.message || 'No cases found for the given advocate name'
        }, { status: 404 })
      }
    } else {
      return NextResponse.json({
        success: false,
        error: 'INVALID_PARAMETERS',
        message: 'Either advocateNumber or advocateName must be provided'
      }, { status: 400 })
    }

    if (!result) {
      return NextResponse.json({
        success: false,
        error: 'NO_CASES_FOUND',
        message: 'No cases found for the given advocate'
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
      caseValue: '',
      caseDescription: result.title || '',
      caseNotes: '',
      tags: [],
      documents: [],
      hearings: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    return NextResponse.json({
      success: true,
      data: mappedCase,
      message: `Advocate ${searchType} search completed successfully`
    })

  } catch (error) {
    console.error('❌ Advocate search API error:', error)
    return NextResponse.json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: error instanceof Error ? error.message : 'Advocate search failed'
    }, { status: 500 })
  }
}
