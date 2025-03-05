import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import axios from 'axios';

export async function POST(request: NextRequest) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';
  
  try {
    // Check if user is authenticated
    const authResponse = await axios.get(`${apiUrl}/activity`, {
      headers: {
        Cookie: request.headers.get('cookie') || '',
      },
      withCredentials: true
    });
    
    if (!authResponse.data) {
      return NextResponse.json(
        { message: 'You must be logged in to create a post' },
        { status: 401 }
      );
    }
    
    // Get form data from the request
    const formData = await request.formData();
    
    // Forward the request to the backend
    const response = await axios.post(`${apiUrl}/posts`, formData, {
      headers: {
        // Forward cookies for authentication
        Cookie: request.headers.get('cookie') || '',
      },
      withCredentials: true
    });
    
    return NextResponse.json(response.data, { status: 201 });
  } catch (error) {
    console.error('Error creating post:', error);
    
    if (axios.isAxiosError(error)) {
      const statusCode = error.response?.status || 500;
      const errorMessage = error.response?.data?.message || 'Failed to create post';
      return NextResponse.json({ message: errorMessage }, { status: statusCode });
    }
    
    return NextResponse.json(
      { message: 'Failed to connect to the backend server. Please try again later.' },
      { status: 500 }
    );
  }
}
