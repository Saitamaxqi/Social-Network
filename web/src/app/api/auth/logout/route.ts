import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

export async function GET(request: NextRequest) {
  try {
    const response = await axios.get('http://localhost:8080/api/logout', {
      headers: {
        Cookie: request.headers.get('cookie') || '',
      },
      withCredentials: true,
    });

    const nextResponse = NextResponse.json(response.data);
    
    // Clear the session cookie
    nextResponse.cookies.set('session', '', {
      path: '/',
      expires: new Date(0),
    });

    return nextResponse;
  } catch (error: unknown) {
    console.error('Logout error:', error);
    if (axios.isAxiosError(error)) {
      return NextResponse.json(
        { message: error.response?.data?.message || 'Logout failed' },
        { status: error.response?.status || 500 }
      );
    }
    return NextResponse.json(
      { message: 'Logout failed' },
      { status: 500 }
    );
  }
}
