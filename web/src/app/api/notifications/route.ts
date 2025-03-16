import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';

export async function GET(req: NextRequest) {
  try {
    // Get all cookies from the request to forward to the backend
    const cookieHeader = req.headers.get('cookie') || '';
    
    if (!cookieHeader) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const response = await axios.get(`${BASE_URL}/notifications`, {
      headers: {
        'Cookie': cookieHeader
      },
      withCredentials: true
    });

    return NextResponse.json(response.data);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    
    if (axios.isAxiosError(error)) {
      const status = error.response?.status || 500;
      const errorMessage = error.response?.data?.error || 'Failed to fetch notifications';
      
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
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    // Get all cookies from the request to forward to the backend
    const cookieHeader = req.headers.get('cookie') || '';
    
    if (!cookieHeader) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const response = await axios.put(`${BASE_URL}/notifications`, null, {
      headers: {
        'Cookie': cookieHeader
      },
      withCredentials: true
    });

    return NextResponse.json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    
    if (axios.isAxiosError(error)) {
      const status = error.response?.status || 500;
      const errorMessage = error.response?.data?.error || 'Failed to mark all notifications as read';
      
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
      { error: 'Failed to mark all notifications as read' },
      { status: 500 }
    );
  }
}
