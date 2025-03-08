import { NextRequest, NextResponse } from 'next/server';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export async function GET(req: NextRequest) {
  try {
    const authCookie = req.cookies.get('session')?.value || req.cookies.get('session_token')?.value;
    const response = await fetch(`${BASE_URL}/notifications`, {
      credentials: 'include',
      headers: {
        'Cookie': `session=${authCookie}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch notifications');
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const authCookie = req.cookies.get('session')?.value || req .cookies.get('session_token')?.value;
    const response = await fetch(`${BASE_URL}/notifications`, {
      method: 'PUT',
      credentials: 'include',
      headers: {
        'Cookie': `session=${authCookie}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to mark all notifications as read');
    }

    return NextResponse.json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    return NextResponse.json(
      { error: 'Failed to mark all notifications as read' },
      { status: 500 }
    );
  }
}
