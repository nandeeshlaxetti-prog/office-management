import { NextRequest, NextResponse } from "next/server";

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { caseNumber, state, year, caseType } = body;

    if (!caseNumber) {
      return NextResponse.json({ 
        success: false, 
        error: "INVALID_REQUEST",
        message: "Case number is required" 
      }, { status: 400 });
    }

    console.log(`🔍 Searching consumer forum case: ${caseNumber}`);

    // Try the Kleopatra consumer forum API endpoint
    const kleopatraEndpoint = 'https://court-api.kleopatra.io/api/core/live/consumer-forum/case';
    
    try {
      const response = await fetch(kleopatraEndpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.KLEOPATRA_API_KEY || process.env.COURT_API_KEY || 'klc_2cef7fc42178c58211cd8b8b1d23c3206c1e778f13ed566237803d8897a9b104'}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          caseNumber: caseNumber,
          state: state || 'KAR',
          year: year || 2025,
          caseType: caseType || 'CONSUMER'
        }),
        signal: AbortSignal.timeout(120000) // 2 minute timeout
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      return NextResponse.json({
        success: true,
        data: data,
        source: 'kleopatra_consumer_forum',
        endpoint: kleopatraEndpoint
      });

    } catch (kleopatraError: any) {
      console.error('Kleopatra Consumer Forum API Error:', kleopatraError.message);
      
      // Fallback: Try alternative consumer forum endpoints
      const fallbackEndpoints = [
        'https://court-api.kleopatra.io/api/core/static/consumer-forum/search',
        'https://court-api.kleopatra.io/v17/cases/search',
        'https://court-api.kleopatra.io/api/core/live/district-court/search/case-number'
      ];

      for (const endpoint of fallbackEndpoints) {
        try {
          console.log(`🔄 Trying fallback endpoint: ${endpoint}`);
          
          const fallbackResponse = await fetch(endpoint, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${process.env.KLEOPATRA_API_KEY || process.env.COURT_API_KEY || 'klc_2cef7fc42178c58211cd8b8b1d23c3206c1e778f13ed566237803d8897a9b104'}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              caseNumber: caseNumber,
              mode: 'caseNumber',
              caseType: 'CONSUMER',
              stateCode: state || 'KAR',
              year: year || 2025
            }),
            signal: AbortSignal.timeout(60000) // 1 minute timeout for fallbacks
          });

          if (fallbackResponse.ok) {
            const fallbackData = await fallbackResponse.json();
            
            return NextResponse.json({
              success: true,
              data: fallbackData,
              source: 'kleopatra_fallback',
              endpoint: endpoint
            });
          }
        } catch (fallbackError: any) {
          console.error(`Fallback endpoint ${endpoint} failed:`, fallbackError.message);
          continue;
        }
      }

      // If all endpoints fail, return a structured error
      return NextResponse.json({
        success: false,
        error: "CONSUMER_FORUM_NOT_FOUND",
        message: `Consumer case "${caseNumber}" not found in any available database`,
        details: {
          caseNumber: caseNumber,
          attemptedEndpoints: [kleopatraEndpoint, ...fallbackEndpoints],
          primaryError: kleopatraError.message
        }
      }, { status: 404 });
    }

  } catch (error: any) {
    console.error('Consumer Forum API Error:', error);
    
    return NextResponse.json({
      success: false,
      error: "INTERNAL_ERROR",
      message: error.message || "An unexpected error occurred while searching consumer forum cases"
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const caseNumber = searchParams.get('caseNumber');

  if (!caseNumber) {
    return NextResponse.json({ 
      success: false, 
      error: "INVALID_REQUEST",
      message: "Case number is required as query parameter" 
    }, { status: 400 });
  }

  // Convert GET request to POST request format
  return POST(new NextRequest(request.url, {
    method: 'POST',
    headers: request.headers,
    body: JSON.stringify({ caseNumber })
  }));
}
