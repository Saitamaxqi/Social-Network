import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

export async function GET(request: NextRequest) {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';
    const response = await axios.get(`${apiUrl}/logout`, {
      headers: {
        Cookie: request.headers.get('cookie') || '',
        'Content-Type': 'application/json'
      },
      withCredentials: true,
    });

    const nextResponse = NextResponse.json({ response });
    
    // Clear all cookies
    const cookies = request.headers.get('cookie')?.split(';') || [];
    cookies.forEach(cookie => {
      const [name] = cookie.split('=');
      if (name) {
        nextResponse.cookies.set(name.trim(), '', {
          path: '/',
          expires: new Date(0),
          maxAge: 0
        });
      }
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
