import { NextRequest, NextResponse } from 'next/server';

/**
 * GET handler for checking if the user is authenticated
 * Returns 200 OK if authenticated, 401 Unauthorized otherwise
 */
export async function GET(request: NextRequest) {
  try {
    // Get auth cookie from the request - backend uses 'session' not 'session_token'
    const authCookie = request.cookies.get('session')?.value || request.cookies.get('session_token')?.value;
    
    if (!authCookie) {
      console.log('No session cookie found');
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    
    console.log('Found session cookie, forwarding to backend');
    
    // Forward the request to the backend API
    const backendUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/check-session`;
    console.log(`Forwarding to backend URL: ${backendUrl}`);
    
    // The Go backend expects a cookie named 'session'
    const response = await fetch(backendUrl, {
      headers: {
        'Cookie': `session=${authCookie}`,
      },
      credentials: 'include',
    });
    
    if (!response.ok) {
      console.log(`Backend returned status: ${response.status}`);
      return NextResponse.json({ error: 'Session invalid or expired' }, { status: 401 });
    }
    
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error checking session:', error);
    return NextResponse.json({ error: 'Failed to check session' }, { status: 500 });
  }
}
