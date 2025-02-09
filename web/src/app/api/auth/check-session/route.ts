import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

export async function GET(request: NextRequest) {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';
    const response = await axios.get(`${apiUrl}/check-session`, {
      headers: {
        Cookie: request.headers.get('cookie') || '',
        'Content-Type': 'application/json'
      },
      withCredentials: true
    });

    return NextResponse.json(response.data);
  } catch (error: unknown) {
    console.error('Session check error:', error);
    if (axios.isAxiosError(error)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: error.response?.status || 500 }
      );
    }
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
