import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

export async function POST(request: NextRequest, { params }: { params: { groupId: string } }) {
    try {
        // Extract groupId from URL params instead of request body
        const { groupId } = params;
        
        // Get auth cookie from the request
        const authCookie = request.cookies.get('session')?.value || request.cookies.get('session_token')?.value;
        const formData = new FormData();
        formData.append('group_id', groupId);
        
        if (!authCookie) {
            console.log('No session cookie found in join group API');
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }
        
        // Forward the request to the backend API
        const backendUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/groups/${groupId}/join`;
        console.log(`Forwarding join request to backend URL: ${backendUrl}`);
        
        const response = await axios.post(
            backendUrl,
            formData,
            {
                headers: {
                    'Cookie': `session=${authCookie}`,
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                withCredentials: true,
            }
        );
        
        return NextResponse.json(response.data);
    } catch (error) {
        console.error('Error joining group:', error);
        return NextResponse.json({ error: 'Failed to join group' }, { status: 500 });
    }
}