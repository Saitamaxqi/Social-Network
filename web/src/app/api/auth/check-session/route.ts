import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { getApiUrl } from '@/utils/config';

/**
 * GET handler for checking if the user is authenticated
 * Returns 200 OK if authenticated, 401 Unauthorized otherwise
 */
export async function GET(request: NextRequest) {
  try {
    const apiUrl = getApiUrl();
    
    // Get auth cookie from the request
    const cookieHeader = request.headers.get('cookie') || '';
    
    // Forward the request to the backend API
    const response = await axios.get(`${apiUrl}/check-session`, {
      headers: {
        'Cookie': cookieHeader,
        'Content-Type': 'application/json'
      },
      withCredentials: true
    });

    return NextResponse.json(response.data);
  } catch (error: unknown) {
    console.error('Session check error:', error);
    if (axios.isAxiosError(error)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: error.response?.status || 401 }
      );
    }
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
