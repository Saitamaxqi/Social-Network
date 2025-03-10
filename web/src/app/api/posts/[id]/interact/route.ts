import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

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
    const formData = new URLSearchParams();
    formData.append('type', type);

    // Make the API call to the backend
    const response = await axios.put(
      `${apiUrl}/posts/${postId}/interact`, 
      formData.toString(), 
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Cookie: `session=${sessionCookie}`,
        },
        withCredentials: true
      }
    );

    // After interaction, fetch the updated post to get the current interaction status
    const postResponse = await axios.get(
      `${apiUrl}/posts/${postId}`,
      {
        headers: {
          Cookie: `session=${sessionCookie}`,
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
