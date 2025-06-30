import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    
    const response = await axios.post(
      `${process.env.NEXT_PUBLIC_API_URL}/register`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        withCredentials: true,
      }
    );

    return NextResponse.json(response.data);
  } catch (error: unknown) {
    console.error('Registration error:', error);
    if (axios.isAxiosError(error)) {
      // Check if the error response contains data as text (which could be the error message directly)
      const errorMessage = error.response?.data;
      
      if (typeof errorMessage === 'string') {
        // If the backend returns the error message directly as a string
        return NextResponse.json(
          { message: errorMessage },
          { status: error.response?.status || 400 }
        );
      } else {
        // If it's in the standard format or another format
        return NextResponse.json(
          { message: error.response?.data?.message || errorMessage || 'Registration failed' },
          { status: error.response?.status || 400 }
        );
      }
    }
    return NextResponse.json(
      { message: 'Registration failed' },
      { status: 500 }
    );
  }
}
