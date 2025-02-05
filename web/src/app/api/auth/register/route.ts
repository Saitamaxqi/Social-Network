import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    
    const response = await axios.post(
      'http://localhost:8080/api/register',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        withCredentials: true,
      }
    );

    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { message: error.response?.data?.message || 'Registration failed' },
      { status: error.response?.status || 500 }
    );
  }
}
