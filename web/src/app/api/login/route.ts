import { NextRequest, NextResponse } from 'next/server';

/**
 * POST handler for logging in a user
 * Forwards the login request to the backend API
 */
export async function POST(request: NextRequest) {
  try {
    // Get the request body
    const formData = await request.formData();
    console.log('Login request received');
    
    // Forward the request to the backend API
    const backendUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/login`;
    console.log(`Forwarding to backend URL: ${backendUrl}`);
    
    const response = await fetch(backendUrl, {
      method: 'POST',
      body: formData,
      credentials: 'include',
    });
    
    if (!response.ok) {
      console.log(`Login failed with status: ${response.status}`);
      const errorData = await response.json();
      return NextResponse.json(errorData, { status: response.status });
    }
    
    console.log('Login successful, processing response');
    
    // Get the session cookie from the response
    const cookies = response.headers.getSetCookie();
    console.log(`Got ${cookies?.length || 0} cookies from backend`);
    
    // Get the user data from the response
    const userData = await response.json();
    
    // Create a new response with the user data
    const newResponse = NextResponse.json(userData);
    
    // Set all cookies from the backend response
    if (cookies && cookies.length > 0) {
      for (const cookie of cookies) {
        console.log(`Setting cookie: ${cookie.split(';')[0]}`);
        newResponse.headers.append('Set-Cookie', cookie);
      }
    } else {
      console.log('No cookies received from backend');
    }
    
    return newResponse;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'An error occurred during login' }, { status: 500 });
  }
}
