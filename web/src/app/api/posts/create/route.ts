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
    const originalFormData = await request.formData();
    
    // Create a new FormData object for the backend
    const backendFormData = new FormData();
    
    // Add title and content/body
    backendFormData.append('title', originalFormData.get('title') as string);
    backendFormData.append('body', originalFormData.get('content') as string);
    
    // Handle categories - backend expects a comma-separated string
    const categories = originalFormData.getAll('categories');
    if (categories.length > 0) {
      backendFormData.append('categories', categories.join(','));
    }
    
    // Handle media file
    const mediaFile = originalFormData.get('media') as File;
    if (mediaFile && mediaFile.size > 0) {
      backendFormData.append('media', mediaFile, mediaFile.name);
    }
    
    // Forward the request to the backend
    const response = await axios.post(`${apiUrl}/posts`, backendFormData, {
      headers: {
        // Forward cookies for authentication
        Cookie: request.headers.get('cookie') || '',
        'Content-Type': 'multipart/form-data',
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
