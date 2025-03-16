import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { getApiUrl } from '@/utils/config';

export async function POST(request: NextRequest) {
  try {
    const apiUrl = getApiUrl();
    
    // Get cookies from the request to forward to the backend
    const cookieHeader = request.headers.get('cookie') || '';
    
    // Get the form data from the request
    const formData = await request.formData();
    
    // Make sure visibility is set (default to 'public' if not provided)
    if (!formData.get('visibility')) {
      formData.append('visibility', 'public');
    }
    
    // Ensure we have the body field (handle both 'body' and 'content' fields)
    if (!formData.get('body') && formData.get('content')) {
      formData.append('body', formData.get('content') as string);
    }
    
    // Log the form data for debugging
    console.log('Creating post with data:', {
      title: formData.get('title'),
      body: formData.get('body') || formData.get('content'),
      categories: formData.get('categories'),
      visibility: formData.get('visibility'),
      hasMedia: !!formData.get('media')
    });
    
    // Forward the request to the backend
    const response = await axios.post(`${apiUrl}/posts`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        'Cookie': cookieHeader
      },
      withCredentials: true
    });

    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error('Error creating post:', error);
    
    // Provide more detailed error information
    if (axios.isAxiosError(error)) {
      const statusCode = error.response?.status || 500;
      const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Failed to create post';
      
      console.error('Axios error details:', {
        status: statusCode,
        message: errorMessage,
        data: error.response?.data
      });
      
      return NextResponse.json(
        { error: errorMessage },
        { status: statusCode }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to create post' },
      { status: 500 }
    );
  }
}
