import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

export async function GET(request: NextRequest) {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';
    
    // Get all cookies from the request to forward to the backend
    const cookieHeader = request.headers.get('cookie') || '';
    
    if (!cookieHeader) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const response = await axios.get(`${apiUrl}/follow/followers`, {
      headers: {
        'Cookie': cookieHeader
      },
      withCredentials: true
    });

    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error('Error fetching followers:', error);
    
    if (axios.isAxiosError(error)) {
      const status = error.response?.status || 500;
      const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Failed to fetch followers';
      
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
      { error: 'Failed to fetch followers' },
      { status: 500 }
    );
  }
}
