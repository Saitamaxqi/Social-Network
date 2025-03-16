import { NextRequest, NextResponse } from 'next/server';

/**
 * POST handler for responding to a group event
 * @param request - The Next.js request object
 * @param params - Route parameters including groupId and eventId
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { groupId: string; eventId: string } }
) {
  try {
    // Ensure params is properly awaited
    const groupId = params.groupId;
    const eventId = params.eventId;
    
    // Get auth cookie from the request
    const authCookie = request.cookies.get('session')?.value || request.cookies.get('session_token')?.value;
    
    if (!authCookie) {
      console.log('No session cookie found in respond to event API');
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    
    // Get request body
    const body = await request.json();
    const { response } = body;
    
    if (!response) {
      return NextResponse.json({ error: 'Response is required' }, { status: 400 });
    }
    
    // Forward the request to the backend API
    const backendUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/groups/${groupId}/events/${eventId}/respond`;
    console.log(`Responding to event at backend URL: ${backendUrl}`);
    
    // Only send the response field as that's what the backend expects
    const formData = JSON.stringify({ response });
    
    const apiResponse = await fetch(
      backendUrl,
      {
        method: 'POST',
        headers: {
          'Cookie': `session=${authCookie}`,
          'Content-Type': 'application/json',
        },
        body: formData,
        credentials: 'include',
      }
    );
    
    if (!apiResponse.ok) {
      console.log(`Backend returned status: ${apiResponse.status} when responding to event`);
      throw new Error('Failed to respond to event');
    }
    
    console.log('Successfully responded to event');
    
    const data = await apiResponse.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error responding to event:', error);
    return NextResponse.json({ error: 'Failed to respond to event' }, { status: 500 });
  }
}
