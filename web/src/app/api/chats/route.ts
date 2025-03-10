import { NextRequest, NextResponse } from 'next/server';

/**
 * GET handler for retrieving recent chats
 * Fetches list of users with recent chat history for the current user
 */
export async function GET(request: NextRequest) {
  try {
    // Get auth cookie from the request - backend uses 'session' not 'session_token'
    const authCookie = request.cookies.get('session')?.value || request.cookies.get('session_token')?.value;
    
    if (!authCookie) {
      console.log('No session cookie found in chats API');
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    
    console.log('Found session cookie in chats API, forwarding to backend');
    
    // Forward the request to the backend API - using path from server/api.go
    const backendUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/chats`;
    console.log(`Forwarding to backend URL: ${backendUrl}`);
    
    const response = await fetch(backendUrl, {
      headers: {
        'Cookie': `session=${authCookie}`,
      },
      credentials: 'include',
    });
    
    if (!response.ok) {
      console.log(`Backend returned status: ${response.status}`);
      throw new Error('Failed to fetch recent chats');
    }
    
    console.log('Successfully fetched recent chats');
    
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching recent chats:', error);
    return NextResponse.json({ error: 'Failed to fetch recent chats' }, { status: 500 });
  }
}
