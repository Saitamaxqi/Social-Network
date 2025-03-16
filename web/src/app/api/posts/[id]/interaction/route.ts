import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { getApiUrl } from '@/utils/config';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get the post ID from the URL parameters
    const postId = params.id;
    const apiUrl = getApiUrl();
    
    // Get all cookies from the request
    const cookieHeader = request.headers.get('cookie') || '';
    
    // Make the API call to the backend to get the post details with interaction
    const response = await axios.get(
      `${apiUrl}/posts/${postId}`,
      {
        headers: {
          'Cookie': cookieHeader
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
      
      console.error('Axios error details:', {
        status,
        message: errorMessage,
        data: error.response?.data
      });
      
      return NextResponse.json(
        { error: errorMessage, interaction: 0 },
        { status: status === 401 ? 200 : status } // Return 200 for unauthorized to prevent errors
      );
    }
    
    return NextResponse.json(
      { error: 'Internal server error', interaction: 0 },
      { status: 200 } // Return 200 with default values to prevent errors
    );
  }
}
