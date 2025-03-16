import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Define the backend category structure
interface BackendCategory {
  id: number;
  name: string;
}

// Define the frontend category structure
interface FrontendCategory {
  id: string;
  name: string;
}

export async function GET(request: NextRequest) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';
  
  try {
    const response = await fetch(`${apiUrl}/categories`);
    
    if (!response.ok) {
      throw new Error(`API responded with status: ${response.status}`);
    }
    
    const backendCategories = await response.json();
    
    // If backend returns null or not an array, return an empty array
    if (!backendCategories || !Array.isArray(backendCategories)) {
      return NextResponse.json([]);
    }
    
    // Transform the data to match the frontend structure
    const frontendCategories: FrontendCategory[] = backendCategories.map((category: BackendCategory) => ({
      id: String(category.id),
      name: category.name
    }));
    
    return NextResponse.json(frontendCategories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json([], { status: 200 }); // Return empty array instead of error
  }
}
