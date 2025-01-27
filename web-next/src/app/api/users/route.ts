import { NextResponse } from 'next/server';

// Temporary mock data - replace with actual database calls later
const mockUsers = [
  { id: '1', username: 'Ichigo Kurosaki' },
  { id: '2', username: 'Rukia Kuchiki' },
  { id: '3', username: 'Renji Abarai' },
  { id: '4', username: 'Byakuya Kuchiki' },
  { id: '5', username: 'Toshiro Hitsugaya' },
];

export async function GET() {
  return NextResponse.json(mockUsers);
}
