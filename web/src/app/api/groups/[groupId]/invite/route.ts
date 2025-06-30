import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

export async function POST(request: NextRequest, { params }: { params: { groupId: string } }) {
  try {
    const { groupId } = params;
    const { username } = await request.json();
    
    // Get auth cookie from the request
    const authCookie = request.cookies.get('session')?.value || request.cookies.get('session_token')?.value;
    
    if (!authCookie) {
      console.log('No session cookie found in invite API');
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    
    // Forward the request to the backend API
    const backendUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/groups/${groupId}/invite`;
    console.log(`Forwarding to backend URL: ${backendUrl}`);
    //create form data
    const formData = new FormData();
    formData.append('username', username);
    formData.append('group_id', groupId);
    
    const response = await axios.post(
      backendUrl,
      formData,
      {
        headers: {
          'Cookie': `session=${authCookie}`,
        },
        withCredentials: true,
      }
    );
    
    return NextResponse.json(response.data);
  } catch (error) {
    console.error('Error inviting user to group:', error);
    return NextResponse.json(
      { message: 'Failed to invite user to group' },
      { status: 500 }
    );
  }
}
