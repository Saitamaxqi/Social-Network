import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

/**
 * GET handler for retrieving recent chats
 * Fetches list of users with recent chat history for the current user
 */
export async function GET(request: NextRequest) {
  try {
    // Get all cookies from the request to forward to the backend
    const cookieHeader = request.headers.get('cookie') || '';
    
    if (!cookieHeader) {
      console.log('No cookies found in chats API');
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    
    console.log('Found cookies in chats API, forwarding to backend');
    
    // Forward the request to the backend API
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';
    const backendUrl = `${apiUrl}/chats`;
    console.log(`Forwarding to backend URL: ${backendUrl}`);
    
    const response = await axios.get(backendUrl, {
      headers: {
        'Cookie': cookieHeader
      },
      withCredentials: true
    });
    
    console.log('Successfully fetched recent chats');
    return NextResponse.json(response.data);
  } catch (error) {
    console.error('Error fetching recent chats:', error);
    
    if (axios.isAxiosError(error)) {
      const status = error.response?.status || 500;
      const errorMessage = error.response?.data?.error || 'Failed to fetch recent chats';
      
      console.error('Axios error details:', {
        status,
        message: errorMessage,
        data: error.response?.data
      });
      
      return NextResponse.json(
        { error: errorMessage },
        { status }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch recent chats' }, 
      { status: 500 }
    );
  }
}
