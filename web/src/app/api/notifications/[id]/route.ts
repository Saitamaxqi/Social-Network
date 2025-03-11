import { NextRequest, NextResponse } from 'next/server';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authCookie = req.cookies.get('session')?.value || req.cookies.get('session_token')?.value;
    const response = await fetch(`${BASE_URL}/notifications/${params.id}`, {
      method: 'PUT',
      credentials: 'include',
      headers: {
        'Cookie': `session=${authCookie}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to mark notification as read');
    }

    return NextResponse.json({ message: 'Notification marked as read' });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return NextResponse.json(
      { error: 'Failed to mark notification as read' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authCookie = req.cookies.get('session')?.value || req.cookies.get('session_token')?.value;
    const response = await fetch(`${BASE_URL}/notifications/${params.id}`, {
      method: 'DELETE',
      credentials: 'include',
      headers: {
        'Cookie': `session=${authCookie}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to delete notification');
    }

    return NextResponse.json({ message: 'Notification deleted' });
  } catch (error) {
    console.error('Error deleting notification:', error);
    return NextResponse.json(
      { error: 'Failed to delete notification' },
      { status: 500 }
    );
  }
}
