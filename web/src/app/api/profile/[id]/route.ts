import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params; // Extract the profile ID from the URL

  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/profile/${id}`, {
      credentials: "include", // To send cookies/session tokens
    });

    if (!response.ok) {
      return NextResponse.json({ error: "Failed to fetch profile" }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data, { status: 200 });

  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
