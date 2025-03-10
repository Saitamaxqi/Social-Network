import { NextRequest, NextResponse } from 'next/server';

/**
 * GET handler for retrieving events for a specific group
 * @param request - The Next.js request object
 * @param params - Route parameters including groupId
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { groupId: string } }
) {
  try {
    const { groupId } = params;
    
    // Get auth cookie from the request
    const authCookie = request.cookies.get('session')?.value || request.cookies.get('session_token')?.value;
    
    if (!authCookie) {
      console.log('No session cookie found in group events API');
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    
    // Forward the request to the backend API
    const backendUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/groups/${groupId}/events`;
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
      console.log(`Backend returned status: ${response.status} when fetching group events`);
      throw new Error('Failed to fetch group events');
    }
    
    console.log('Successfully fetched group events');
    
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching group events:', error);
    return NextResponse.json({ error: 'Failed to fetch group events' }, { status: 500 });
  }
}

/**
 * POST handler for creating a new event in a group
 * @param request - The Next.js request object
 * @param params - Route parameters including groupId
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { groupId: string } }
) {
  try {
    const { groupId } = params;
    
    // Get auth cookie from the request
    const authCookie = request.cookies.get('session')?.value || request.cookies.get('session_token')?.value;
    
    if (!authCookie) {
      console.log('No session cookie found in create group event API');
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    
    // Get request body
    const body = await request.json();
    const { title, description, date, location } = body;
    
    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }
    
    if (!date) {
      return NextResponse.json({ error: 'Date is required' }, { status: 400 });
    }
    
    // Forward the request to the backend API
    const backendUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/groups/${groupId}/events`;
    console.log(`Creating event at backend URL: ${backendUrl}`);
    
    const formData = new FormData();
    formData.append('title', title);
    if (description) {
      formData.append('description', description);
    }
    formData.append('date', date);
    if (location) {
      formData.append('location', location);
    }
    
    const response = await fetch(
      backendUrl,
      {
        method: 'POST',
        headers: {
          'Cookie': `session=${authCookie}`,
        },
        body: formData,
        credentials: 'include',
      }
    );
    
    if (!response.ok) {
      console.log(`Backend returned status: ${response.status} when creating group event`);
      throw new Error('Failed to create group event');
    }
    
    console.log('Successfully created group event');
    
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error creating group event:', error);
    return NextResponse.json({ error: 'Failed to create group event' }, { status: 500 });
  }
}
