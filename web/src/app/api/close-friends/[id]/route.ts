import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { getApiUrl } from '@/utils/config';
import { getAuthToken } from '@/utils/auth';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const apiUrl = getApiUrl();
    const token = await getAuthToken();
    const { id } = params;
    
    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const response = await axios.delete(`${apiUrl}/close-friends/${id}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error('Error removing close friend:', error);
    return NextResponse.json(
      { error: error.response?.data?.message || 'Failed to remove close friend' },
      { status: error.response?.status || 500 }
    );
  }
}
