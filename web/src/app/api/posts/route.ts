import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const categoryId = searchParams.get('category');

  // TODO: Replace with your actual API call
  const response = await fetch(`${process.env.API_URL}/posts${categoryId ? `?category=${categoryId}` : ''}`);
  const posts = await response.json();

  return NextResponse.json(posts);
}
