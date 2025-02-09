import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    
    const response = await axios.post(
      `${process.env.NEXT_PUBLIC_API_URL}/login`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        withCredentials: true,
      }
    );

    // Create the response with the data
    const nextResponse = NextResponse.json(response.data);

    // Forward the Set-Cookie header from the backend if it exists
    const backendSetCookie = response.headers['set-cookie'];
    if (backendSetCookie && Array.isArray(backendSetCookie)) {
      // Get the last cookie which should be the session cookie
      const sessionCookie = backendSetCookie[backendSetCookie.length - 1];
      nextResponse.headers.set('Set-Cookie', sessionCookie);
    }

    return nextResponse;
  } catch (error: unknown) {
    console.error('Login error:', error);
    if (axios.isAxiosError(error)) {
      return NextResponse.json(
        { message: error.response?.data?.message || 'Login failed' },
        { status: error.response?.status || 500 }
      );
    }
    return NextResponse.json(
      { message: 'Login failed' },
      { status: 500 }
    );
  }
}
