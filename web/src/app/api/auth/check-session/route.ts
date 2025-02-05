import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

export async function GET(request: NextRequest) {
  try {
    const response = await axios.get('http://localhost:8080/api/check-session', {
      headers: {
        Cookie: request.headers.get('cookie') || '',
      },
      withCredentials: true,
    });

    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error('Session check error:', error);
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: error.response?.status || 500 }
    );
  }
}
