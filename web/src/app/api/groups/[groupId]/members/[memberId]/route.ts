import { NextRequest, NextResponse } from 'next/server';

/**
 * DELETE handler for removing a member or canceling a join request
 * @param request - The Next.js request object
 * @param params - Route parameters including groupId and memberId
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { groupId: string, memberId: string } }
) {
  try {
    const { groupId, memberId } = params;
    
    // Get auth cookie from the request
    const authCookie = request.cookies.get('session')?.value || request.cookies.get('session_token')?.value;
    
    if (!authCookie) {
      console.log('No session cookie found in cancel join request API');
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    
    // Forward the request to the backend API
    const backendUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/groups/${groupId}/members/${memberId}`;
    console.log(`Canceling join request at backend URL: ${backendUrl}`);
    
    const response = await fetch(
      backendUrl,
      {
        method: 'DELETE',
        headers: {
          'Cookie': `session=${authCookie}`,
        },
        credentials: 'include',
      }
    );
    
    if (!response.ok) {
      console.log(`Backend returned status: ${response.status} when canceling join request`);
      throw new Error('Failed to cancel join request');
    }
    
    console.log('Successfully canceled join request');
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error canceling join request:', error);
    return NextResponse.json({ error: 'Failed to cancel join request' }, { status: 500 });
  }
}
