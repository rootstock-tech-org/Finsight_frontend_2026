import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = 'https://aqov9nte4kdgej-8000.proxy.runpod.net';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url } = body;
    
    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      );
    }
    
    console.log('Proxying URL analysis request to backend:', BACKEND_URL);
    
    // Try multiple endpoints
    const endpoints = ['/analyze/url', '/analyze', '/url/analyze', '/api/analyze'];
    let response = null;
    let lastError = null;
    
    for (const endpoint of endpoints) {
      try {
        console.log(`Trying endpoint: ${BACKEND_URL}${endpoint}`);
        
        const backendResponse = await fetch(`${BACKEND_URL}${endpoint}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ url }),
        });
        
        if (backendResponse.ok) {
          console.log(`Success with endpoint: ${endpoint}`);
          response = backendResponse;
          break;
        } else {
          console.log(`Endpoint ${endpoint} returned status: ${backendResponse.status}`);
        }
      } catch (error) {
        console.log(`Failed with endpoint ${endpoint}:`, error);
        lastError = error;
      }
    }
    
    if (!response || !response.ok) {
      console.error('All backend endpoints failed');
      return NextResponse.json(
        { error: 'Backend service unavailable' },
        { status: 503 }
      );
    }
    
    const result = await response.json();
    console.log('Backend response:', result);
    
    return NextResponse.json(result);
    
  } catch (error) {
    console.error('Proxy error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
