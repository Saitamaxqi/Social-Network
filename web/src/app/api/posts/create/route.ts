import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';
  
  try {
    // Check if user is authenticated
    const authResponse = await fetch(`${apiUrl}/activity`, {
      headers: {
        Cookie: request.headers.get('cookie') || '',
      },
    });
    
    if (!authResponse.ok) {
      return NextResponse.json(
        { message: 'You must be logged in to create a post' },
        { status: 401 }
      );
    }
    
    // Get form data from the request
    const formData = await request.formData();
    
    // Forward the request to the backend
    const response = await fetch(`${apiUrl}/posts`, {
      method: 'POST',
      body: formData,
      headers: {
        // Forward cookies for authentication
        Cookie: request.headers.get('cookie') || '',
      },
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to create post' }));
      return NextResponse.json(errorData, { status: response.status });
    }
    
    const data = await response.json();
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Error creating post:', error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'An unknown error occurred' },
      { status: 500 }
    );
  }
}
