import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    
    // Send the request to the backend
    const response = await axios.post(
      `${process.env.NEXT_PUBLIC_API_URL}/posts`,
      formData,
      {
        headers: {
          Cookie: request.headers.get('cookie') || '',
          'Content-Type': 'multipart/form-data',
        },
        withCredentials: true,
      }
    );

    return NextResponse.json(response.data);
  } catch (error) {
    console.error('Create post error:', error);
    if (axios.isAxiosError(error)) {
      return NextResponse.json(
        { message: error.response?.data?.message || 'Failed to create post' },
        { status: error.response?.status || 500 }
      );
    }
    return NextResponse.json(
      { message: 'Failed to create post' },
      { status: 500 }
    );
  }
}