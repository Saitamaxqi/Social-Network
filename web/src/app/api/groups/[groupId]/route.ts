import { NextRequest, NextResponse } from 'next/server';

/**
 * GET handler for retrieving a specific group's details
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
      console.log('No session cookie found in group details API');
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    
    // Forward the request to the backend API
    const backendUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/groups/${groupId}`;
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
      console.log(`Backend returned status: ${response.status} when fetching group details`);
      throw new Error('Failed to fetch group details');
    }
    
    console.log('Successfully fetched group details');
    
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching group details:', error);
    return NextResponse.json({ error: 'Failed to fetch group details' }, { status: 500 });
  }
}

/**
 * POST handler for requesting to join a group
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
      console.log('No session cookie found in join group API');
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    
    // Forward the request to the backend API
    const backendUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/groups/${groupId}/join`;
    console.log(`Requesting to join group at backend URL: ${backendUrl}`);
    
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
      console.log(`Backend returned status: ${response.status} when requesting to join group`);
      throw new Error('Failed to request joining group');
    }
    
    console.log('Successfully requested to join group');
    
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error requesting to join group:', error);
    return NextResponse.json({ error: 'Failed to request joining group' }, { status: 500 });
  }
}
