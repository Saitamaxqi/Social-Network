import { NextRequest, NextResponse } from 'next/server';

/**
 * GET handler for retrieving all groups
 * @param request - The Next.js request object
 */
export async function GET(request: NextRequest) {
  try {
    // Get auth cookie from the request
    const authCookie = request.cookies.get('session')?.value || request.cookies.get('session_token')?.value;
    
    if (!authCookie) {
      console.log('No session cookie found in groups API');
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    
    // Forward the request to the backend API
    const backendUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/groups`;
    console.log(`Forwarding to backend URL: ${backendUrl}`);
    
    try {
      const response = await fetch(
        backendUrl,
        {
          headers: {
            'Cookie': `session=${authCookie}`,
          },
          credentials: 'include',
        }
      );
      
      // Log the response status for debugging
      console.log(`Backend response status: ${response.status}`);
      
      // Try to get response headers for debugging
      const contentType = response.headers.get('content-type');
      console.log(`Response content type: ${contentType}`);
      
      // Clone the response for debugging
      const responseClone = response.clone();
    
      if (!response.ok) {
        console.log(`Backend returned status: ${response.status} when fetching groups`);
        // Try to read the error response body for debugging
        const errorText = await responseClone.text();
        console.log(`Error response body: ${errorText}`);
        throw new Error(`Failed to fetch groups: ${response.status}`);
      }
      
      console.log('Successfully fetched groups');
      
      // Parse the response body
      let data;
      try {
        data = await response.json();
        console.log('Response data type:', typeof data);
        console.log('Is array:', Array.isArray(data));
        if (data === null) {
          console.log('Response data is null, returning empty array');
          return NextResponse.json([]);
        }
      } catch (parseError) {
        console.error('Error parsing JSON response:', parseError);
        // If we can't parse JSON, return empty array
        return NextResponse.json([]);
      }
      
      // Ensure we're returning an array even if the backend returns something else
      return NextResponse.json(Array.isArray(data) ? data : []);
    } catch (fetchError) {
      console.error('Network error fetching groups:', fetchError);
      // Return an empty array on error to prevent frontend crashes
      return NextResponse.json([], { status: 200 });
    }
  } catch (error) {
    console.error('Error in groups API:', error);
    // Return an empty array on error to prevent frontend crashes
    return NextResponse.json([], { status: 200 });
  }
}

/**
 * POST handler for creating a new group
 * @param request - The Next.js request object
 */
export async function POST(request: NextRequest) {
  try {
    console.log('POST /api/groups - Starting group creation');
    
    // Get auth cookie from the request
    const authCookie = request.cookies.get('session')?.value || request.cookies.get('session_token')?.value;
    console.log('Auth cookie present:', !!authCookie);
    
    if (!authCookie) {
      console.log('No session cookie found in groups API');
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    
    // Parse JSON data from the request
    console.log('Attempting to parse JSON data');
    const body = await request.json();
    const title = body.title;
    const description = body.description || '';
    
    console.log('Received JSON data:', { title, description });
    
    if (!title) {
      console.log('Title is required but was not provided');
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }
    
    // Forward the request to the backend API
    const backendUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/groups`;
    console.log(`Creating group at backend URL: ${backendUrl}`);
    
    // Log the request details for debugging
    console.log('Request details:', {
      url: backendUrl,
      method: 'POST',
      title,
      description,
    });
    
    // Send the request to the backend API
    const response = await fetch(
      backendUrl,
      {
        method: 'POST',
        headers: {
          // Set the session cookie in the Cookie header
          'Cookie': `session=${authCookie}`,
          'Content-Type': 'application/json',
          // Add Authorization header as an alternative way to pass the session
          'Authorization': `Bearer ${authCookie}`,
        },
        body: JSON.stringify({
          title,
          description,
        }),
        // Don't use credentials: 'include' when we're manually setting the Cookie header
        // as it can cause issues with CORS and duplicate cookies
        cache: 'no-store',
      }
    );
  
    // Add detailed logging for debugging
    console.log(`Response status: ${response.status}`);
    console.log(`Response status text: ${response.statusText}`);
    
    // Try to log response headers
    const headers: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      headers[key] = value;
    });
    console.log('Response headers:', headers);
    
    if (!response.ok) {
      console.log(`Backend returned status: ${response.status} when creating group`);
      
      // Try to read the error response for debugging
      const responseClone = response.clone();
      const errorText = await responseClone.text();
      console.log(`Error response body: ${errorText}`);
      
      throw new Error(`Failed to create group: ${response.status}`);
    }
    
    console.log('Successfully created group');
    
    const data = await response.json();
    // For group creation, we expect an object with the created group details
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error creating group:', error);
    return NextResponse.json({ error: 'Failed to create group' }, { status: 500 });
  }
}
