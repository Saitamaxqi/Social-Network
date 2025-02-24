import { NextResponse, NextRequest } from 'next/server';
import axios from 'axios';

export async function GET(request: NextRequest) {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';
    const response = await axios.get(`${apiUrl}/chats`, {
      headers: {
        Cookie: request.headers.get('cookie') || '',
        'Content-Type': 'application/json'
      },
      withCredentials: true,
    });
    return NextResponse.json(response.data);
  } catch (error: unknown) {
    console.error('Users fetch error:', error);
    if (axios.isAxiosError(error)) {
      return NextResponse.json(
        { message: error.response?.data?.message || 'Failed to fetch users' },
        { status: error.response?.status || 500 }
      );
    }
    return NextResponse.json(
      { message: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}
