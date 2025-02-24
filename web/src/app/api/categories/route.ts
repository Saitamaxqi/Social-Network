import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

export async function GET(request: NextRequest) {
  try {
    const response = await axios.get(
      `${process.env.NEXT_PUBLIC_API_URL}/categories`,
      {
        withCredentials: true,
      }
    );

    return NextResponse.json(response.data);
  } catch (error) {
    console.error('Categories fetch error:', error);
    if (axios.isAxiosError(error)) {
      return NextResponse.json(
        { message: error.response?.data?.message || 'Failed to fetch categories' },
        { status: error.response?.status || 500 }
      );
    }
    return NextResponse.json(
      { message: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}
