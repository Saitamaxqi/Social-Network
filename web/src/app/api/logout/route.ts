import { NextRequest, NextResponse } from 'next/server';

/**
 * GET handler for logging out a user
 * Forwards the logout request to the backend API
 */
export async function GET(request: NextRequest) {
  try {
    // Get auth cookie from the request - try both cookie names
    const authCookie = request.cookies.get('session')?.value || request.cookies.get('session_token')?.value;
    
    if (!authCookie) {
      return NextResponse.json({ message: 'Already logged out' }, { status: 200 });
    }
    
    // Forward the request to the backend API
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/logout`, {
      method: 'GET',
      headers: {
        'Cookie': `session=${authCookie}`,
      },
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(errorData, { status: response.status });
    }
    
    // Create a response that clears the session cookie
    const newResponse = NextResponse.json({ message: 'Logged out successfully' });
    
    // Clear both session cookie names to be safe
    newResponse.cookies.delete('session');
    newResponse.cookies.delete('session_token');
    
    return newResponse;
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json({ error: 'An error occurred during logout' }, { status: 500 });
  }
}
