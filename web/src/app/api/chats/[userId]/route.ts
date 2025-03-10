import { NextRequest, NextResponse } from 'next/server';

/**
 * GET handler for retrieving chat messages with a specific user
 * @param request - The Next.js request object
 * @param params - Route parameters including userId
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params;
    const page = request.nextUrl.searchParams.get('page') || '0';
    
    // Get auth cookie from the request - backend uses 'session' not 'session_token'
    const authCookie = request.cookies.get('session')?.value || request.cookies.get('session_token')?.value;
    
    if (!authCookie) {
      console.log('No session cookie found in chat messages API');
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    
    console.log(`Found session cookie, fetching chat messages with user ${userId}`);
    
    // Forward the request to the backend API - using path from server/api.go
    const backendUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/chats/${userId}?page=${page}`;
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
      console.log(`Backend returned status: ${response.status} when fetching messages`);
      throw new Error('Failed to fetch messages');
    }
    
    console.log('Successfully fetched chat messages');
    
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
  }
}

/**
 * POST handler for sending a new message to a specific user
 * @param request - The Next.js request object
 * @param params - Route parameters including userId
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params;
    const messageInput = request.nextUrl.searchParams.get('messageInput');
    
    if (!messageInput) {
      return NextResponse.json({ error: 'Message content is required' }, { status: 400 });
    }
    
    // Get auth cookie from the request - backend uses 'session' not 'session_token'
    const authCookie = request.cookies.get('session')?.value || request.cookies.get('session_token')?.value;
    
    if (!authCookie) {
      console.log('No session cookie found in chat messages API');
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    
    console.log(`Found session cookie, fetching chat messages with user ${userId}`);
    
    // Forward the request to the backend API - using path from server/api.go
    const backendUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/chats/${userId}?messageInput=${encodeURIComponent(messageInput)}`;
    console.log(`Sending message to backend URL: ${backendUrl}`);
    
    const response = await fetch(
      backendUrl,
      {
        method: 'POST',
        headers: {
          'Cookie': `session=${authCookie}`,
        },
        credentials: 'include',
      }
    );
    
    if (!response.ok) {
      console.log(`Backend returned status: ${response.status} when sending message`);
      throw new Error('Failed to send message');
    }
    
    console.log('Successfully sent message');
    
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error sending message:', error);
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
}
