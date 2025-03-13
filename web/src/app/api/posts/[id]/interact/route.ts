import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { getApiUrl } from '@/utils/config';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get the post ID from the URL parameters
    const postId = params.id;
    
    // Get the interaction type from the request body
    const { type } = await request.json();
    
    // Validate interaction type
    if (type !== 'like' && type !== 'dislike') {
      return NextResponse.json(
        { error: 'Invalid interaction type. Must be "like" or "dislike".' },
        { status: 400 }
      );
    }

    const apiUrl = getApiUrl();
    
    // Get all cookies from the request to forward to the backend
    const cookieHeader = request.headers.get('cookie') || '';
    
    if (!cookieHeader) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Create form data for the request
    const formData = new URLSearchParams();
    formData.append('type', type);

    // Make the API call to the backend
    const response = await axios.put(
      `${apiUrl}/posts/${postId}/interact`, 
      formData.toString(), 
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Cookie': cookieHeader
        },
        withCredentials: true
      }
    );

    // After interaction, fetch the updated post to get the current interaction status
    const postResponse = await axios.get(
      `${apiUrl}/posts/${postId}`,
      {
        headers: {
          'Cookie': cookieHeader
        },
        withCredentials: true
      }
    );

    // Return the updated post data with interaction status
    return NextResponse.json({
      interaction: response.data.interaction,
      likes: postResponse.data.likes,
      dislikes: postResponse.data.dislikes
    });
  } catch (error) {
    console.error('Error in post interaction:', error);
    
    // Handle Axios errors
    if (axios.isAxiosError(error)) {
      const status = error.response?.status || 500;
      const errorMessage = error.response?.data?.error || 'Failed to interact with post';
      
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
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
