import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");
  const cookie = req.nextUrl.searchParams.get("cookie");

  if (!url) {
    return NextResponse.json({ error: "Missing url" }, { status: 400 });
  }

  const res = await fetch(url, {
    headers: cookie ? { Cookie: cookie } : {},
  });

  const body = await res.arrayBuffer();
  return new NextResponse(body, {
    headers: {
      "Content-Type": res.headers.get("content-type") || "application/vnd.apple.mpegurl",
    },
  });
}
