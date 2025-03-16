import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { getApiUrl } from '@/utils/config';

export async function POST(request: NextRequest) {
  try {
    const apiUrl = getApiUrl();
    const formData = await request.formData();
    const userId = formData.get('user_id');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Get all cookies from the request to forward to the backend
    const cookieHeader = request.headers.get('cookie') || '';
    
    if (!cookieHeader) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Pass through the form data directly
    const response = await axios.post(`${apiUrl}/follow`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        'Cookie': cookieHeader
      },
      withCredentials: true,
    });

    return NextResponse.json(response.data);
  } catch (error) {
    console.error('Error following user:', error);
    if (axios.isAxiosError(error)) {
      const status = error.response?.status || 500;
      const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Failed to follow user';
      
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
      { error: 'Failed to follow user' },
      { status: 500 }
    );
  }
}
