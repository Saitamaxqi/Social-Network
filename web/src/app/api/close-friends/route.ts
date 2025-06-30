import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

export async function POST(request: NextRequest) {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';
    const body = await request.json();
    
    // Get all cookies from the request to forward to the backend
    const authCookie = request.cookies.get('session')?.value || request.cookies.get('session_token')?.value;
    
    // Forward the request to the backend
    const response = await axios.post(`${apiUrl}/close-friends`, body, {
      headers: {
        Cookie: `session=${authCookie}`,
        'Content-Type': 'application/json'
      },
      withCredentials: true,
    });
    
    // Return the response from the backend
    return NextResponse.json(response.data);
  } catch (error) {
    console.error('Error creating close friend:', error);
    return NextResponse.json(
      { message: 'Failed to create close friend' },
      { status: 500 }
    );
  }
}