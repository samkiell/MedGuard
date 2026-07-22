import { NextResponse } from "next/server";
import { HolonClient } from "@ontomorph/holon-client";

export async function GET() {
  try {
    const apiKey = process.env.HOLON_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "HOLON_KEY is not configured in environment variables." },
        { status: 500 }
      );
    }

    const client = new HolonClient({ apiKey });
    const response = await client.concepts.search({ query: "aspirin" });

    return NextResponse.json({ success: true, data: response });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "An unexpected error occurred",
      },
      { status: 500 }
    );
  }
}
