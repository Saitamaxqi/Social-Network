import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { getApiUrl } from '@/utils/config';

/**
 * GET handler for retrieving the current user's session
 * Returns user information if authenticated
 */
export async function GET(request: NextRequest) {
  try {
    const apiUrl = getApiUrl();
    const cookieHeader = request.headers.get('cookie') || '';
    
    if (!cookieHeader) {
      console.log('No cookies found in session request');
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    
    // Forward the request to the backend API
    const response = await axios.get(`${apiUrl}/login-session`, {
      headers: {
        'Cookie': cookieHeader,
        'Content-Type': 'application/json'
      },
      withCredentials: true
    });
    
    return NextResponse.json(response.data);
  } catch (error) {
    console.error('Error fetching user session:', error);
    
    if (axios.isAxiosError(error)) {
      return NextResponse.json(
        { error: error.response?.data?.message || 'Failed to fetch user session' },
        { status: error.response?.status || 401 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch user session' },
      { status: 500 }
    );
  }
}
