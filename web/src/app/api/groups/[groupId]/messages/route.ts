import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { cookies } from 'next/headers';

/**
 * GET handler for retrieving group messages
 * 
 * @param request - The incoming request
 * @param params - URL parameters including groupId
 * @returns NextResponse with messages or error
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { groupId: string } }
) {
  try {
    // Get the group ID from the URL parameters
    const groupId = params.groupId;
    
    // Get the page from the query parameters (for pagination)
    const searchParams = request.nextUrl.searchParams;
    const page = searchParams.get('page') || '0';
    
    // Forward the request to the backend API
    const cookieStore = cookies();
    const response = await axios.get(
      `${process.env.NEXT_PUBLIC_API_URL}/groups/${groupId}/messages?page=${page}`,
      {
        headers: {
          'Cookie': cookieStore.toString(),
        },
        withCredentials: true
      }
    );
    
    // Return the messages and group info
    return NextResponse.json(response.data);
  } catch (error) {
    console.error('Error fetching group messages:', error);
    if (axios.isAxiosError(error) && error.response) {
      return NextResponse.json(
        { error: error.response.data || 'Failed to fetch group messages' },
        { status: error.response.status }
      );
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST handler for sending a message to a group
 * 
 * @param request - The incoming request
 * @param params - URL parameters including groupId
 * @returns NextResponse with success or error
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { groupId: string } }
) {
  try {
    // Get the group ID from the URL parameters
    const groupId = params.groupId;
    
    // Get the message content from the request body
    const body = await request.json();
    const { messageInput } = body;
    
    if (!messageInput) {
      return NextResponse.json(
        { error: 'Message content is required' },
        { status: 400 }
      );
    }
    
    // Forward the request to the backend API
    const cookieStore = cookies();
    const response = await axios.post(
      `${process.env.NEXT_PUBLIC_API_URL}/groups/${groupId}/messages?messageInput=${encodeURIComponent(messageInput)}`,
      null, // No body needed as we're using query parameters
      {
        headers: {
          'Cookie': cookieStore.toString()
        },
        withCredentials: true
      }
    );
    
    // Return success response
    return NextResponse.json(response.data);
  } catch (error) {
    console.error('Error sending group message:', error);
    if (axios.isAxiosError(error) && error.response) {
      return NextResponse.json(
        { error: error.response.data || 'Failed to send message' },
        { status: error.response.status }
      );
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
