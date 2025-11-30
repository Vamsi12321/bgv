import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.json({ success: true });

  // Clear all auth cookies
  const cookieOptions = {
    path: "/",
    maxAge: 0,
    httpOnly: false,
  };

  response.cookies.set("bgvSession", "", cookieOptions);
  response.cookies.set("bgvUser", "", cookieOptions);
  response.cookies.set("bgvTemp", "", cookieOptions);

  return response;
}
