import { NextRequest, NextResponse } from 'next/server';

/**
 * GET handler for retrieving the current user's session
 * Returns user information if authenticated
 */
export async function GET(request: NextRequest) {
  try {
    // Get auth cookie from the request - backend uses 'session' not 'session_token'
    const authCookie = request.cookies.get('session')?.value || request.cookies.get('session_token')?.value;
    
    if (!authCookie) {
      console.log('No session cookie found in login-session');
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    
    console.log('Found session cookie, forwarding to backend login-session');
    
    // Forward the request to the backend API
    const backendUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/login-session`;
    console.log(`Forwarding to backend URL: ${backendUrl}`);
    
    const response = await fetch(backendUrl, {
      headers: {
        'Cookie': `session=${authCookie}`,
      },
      credentials: 'include',
    });
    
    if (!response.ok) {
      console.log(`Backend returned status: ${response.status}`);
      throw new Error('Failed to fetch user session');
    }
    
    const data = await response.json();
    console.log('Successfully fetched user session data');
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching user session:', error);
    return NextResponse.json({ error: 'Failed to fetch user session' }, { status: 500 });
  }
}
