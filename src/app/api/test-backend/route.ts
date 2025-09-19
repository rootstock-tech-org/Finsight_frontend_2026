import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = 'https://aqov9nte4kdgej-8000.proxy.runpod.net';

export async function GET() {
  try {
    console.log('Testing backend connectivity...');
    
    // Test basic connectivity
    const testEndpoints = ['/', '/health', '/status', '/docs', '/api', '/v1', '/v1/health'];
    const results = [];
    
    for (const endpoint of testEndpoints) {
      try {
        console.log(`Testing endpoint: ${BACKEND_URL}${endpoint}`);
        const response = await fetch(`${BACKEND_URL}${endpoint}`, {
          method: 'GET',
        });
        
        results.push({
          endpoint,
          status: response.status,
          statusText: response.statusText,
          ok: response.ok
        });
        
        console.log(`Endpoint ${endpoint}: ${response.status} ${response.statusText}`);
      } catch (error) {
        results.push({
          endpoint,
          status: 'ERROR',
          statusText: error instanceof Error ? error.message : 'Unknown error',
          ok: false
        });
        console.log(`Endpoint ${endpoint}: ERROR - ${error}`);
      }
    }
    
    return NextResponse.json({
      message: 'Backend connectivity test results',
      backend_url: BACKEND_URL,
      results
    });
    
  } catch (error) {
    console.error('Test error:', error);
    return NextResponse.json(
      { error: 'Test failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
