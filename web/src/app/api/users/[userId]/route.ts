import { NextRequest, NextResponse } from 'next/server';

/**
 * GET handler for retrieving a user's details
 * @param request - The Next.js request object
 * @param params - Route parameters including userId
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params;
    
    // Get auth cookie from the request - backend uses 'session' not 'session_token'
    const authCookie = request.cookies.get('session')?.value || request.cookies.get('session_token')?.value;
    
    if (!authCookie) {
      console.log('No session cookie found in user details API');
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    
    console.log(`Found session cookie, fetching details for user ${userId}`);
    
    // Forward the request to the backend API - using path from server/api.go
    const backendUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/users/${userId}`;
    console.log(`Forwarding to backend URL: ${backendUrl}`);
    
    const response = await fetch(
      backendUrl,
      {
        headers: {
          'Cookie': `session=${authCookie}`,
        },
        credentials: 'include',
      }
    );
    
    if (!response.ok) {
      console.log(`Backend returned status: ${response.status} when fetching user details`);
      throw new Error('Failed to fetch user details');
    }
    
    console.log('Successfully fetched user details');
    
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching user details:', error);
    
    // Log more detailed error information
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    
    return NextResponse.json({ error: 'Failed to fetch user details' }, { status: 500 });
  }
}
