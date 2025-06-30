import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

export async function POST(request: NextRequest, { params }: { params: { groupId: string } }) {
  try {
    const { groupId } = params;
    const formData = await request.formData();
    const status = formData.get('status');
    
    // Get auth cookie from the request
    const authCookie = request.cookies.get('session')?.value || request.cookies.get('session_token')?.value;
    
    if (!authCookie) {
      console.log('No session cookie found in respond-invite API');
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    
    // Forward the request to the backend API
    const backendUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/groups/${groupId}/respond-invite`;
    console.log(`Forwarding to backend URL: ${backendUrl}`);
    
    const backendFormData = new FormData();
    backendFormData.append('status', status as string);
    
    const response = await axios.post(
      backendUrl,
      backendFormData,
      {
        headers: {
          'Cookie': `session=${authCookie}`,
        },
        withCredentials: true,
      }
    );
    
    return NextResponse.json(response.data);
  } catch (error) {
    console.error('Error responding to group invitation:', error);
    return NextResponse.json(
      { message: 'Failed to respond to group invitation' },
      { status: 500 }
    );
  }
}
