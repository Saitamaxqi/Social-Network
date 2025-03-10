import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get the post ID from the URL parameters
    const postId = params.id;
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';
    
    // Get the session cookie
    const sessionCookie = request.cookies.get('session')?.value || '';
    
    if (!sessionCookie) {
      return NextResponse.json(
        { interaction: 0 }, // No interaction if not logged in
        { status: 200 }
      );
    }
    
    // Make the API call to the backend to get the post details with interaction
    const response = await axios.get(
      `${apiUrl}/posts/${postId}`,
      {
        headers: {
          Cookie: `session=${sessionCookie}`,
        },
        withCredentials: true
      }
    );
    
    // Return the interaction status
    return NextResponse.json({
      interaction: response.data.interaction || 0
    });
  } catch (error) {
    console.error('Error fetching post interaction:', error);
    
    // Handle Axios errors
    if (axios.isAxiosError(error)) {
      const status = error.response?.status || 500;
      const errorMessage = error.response?.data?.error || 'Failed to fetch post interaction';
      
      return NextResponse.json(
        { error: errorMessage, interaction: 0 },
        { status }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal server error', interaction: 0 },
      { status: 500 }
    );
  }
}
