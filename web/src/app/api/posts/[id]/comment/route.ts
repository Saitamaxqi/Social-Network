import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get the post ID from the URL parameters
    const postId = params.id;
    
    // Check if the request is multipart/form-data
    const contentType = request.headers.get('content-type') || '';
    let body, mediaFile;
    
    if (contentType.includes('multipart/form-data')) {
      // Handle form data with possible media file
      const formData = await request.formData();
      body = formData.get('body') as string;
      mediaFile = formData.get('media') as File | null;
    } else {
      // Handle JSON request (backward compatibility)
      const jsonData = await request.json();
      body = jsonData.body;
    }
    
    // Validate comment body
    if (!body || (typeof body === 'string' && body.trim() === '')) {
      return NextResponse.json(
        { error: 'Comment body is required' },
        { status: 400 }
      );
    }

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';
    const sessionCookie = request.cookies.get('session')?.value || '';
    
    if (!sessionCookie) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Check if user is authenticated
    try {
      await axios.get(`${apiUrl}/activity`, {
        headers: {
          Cookie: `session=${sessionCookie}`,
        },
        withCredentials: true
      });
    } catch (error) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Create form data for the request
    const backendFormData = new FormData();
    backendFormData.append('body', body);
    
    // Add media file if it exists
    if (mediaFile) {
      backendFormData.append('media', mediaFile);
    }

    // Make the API call to the backend
    const response = await axios.post(
      `${apiUrl}/posts/${postId}/comment`, 
      backendFormData, 
      {
        headers: {
          'Content-Type': 'multipart/form-data',
          Cookie: `session=${sessionCookie}`,
        },
        withCredentials: true
      }
    );

    // Transform the comment data for frontend
    const backendComment = response.data;
    const frontendComment = {
      id: String(backendComment.id),
      content: backendComment.body || '',
      body: backendComment.body || '',
      created_at: backendComment.created_at,
      media: backendComment.media && backendComment.media.Valid ? backendComment.media.String : null,
      author: {
        id: String(backendComment.user?.id || '0'),
        username: backendComment.user?.username || 'Unknown User'
      },
      post_id: String(backendComment.post_id?.Int64 || '0')
    };

    return NextResponse.json(frontendComment);
  } catch (error) {
    console.error('Error adding comment:', error);
    
    // Handle Axios errors
    if (axios.isAxiosError(error)) {
      const status = error.response?.status || 500;
      const errorMessage = error.response?.data?.error || 'Failed to add comment';
      
      return NextResponse.json(
        { error: errorMessage },
        { status }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
