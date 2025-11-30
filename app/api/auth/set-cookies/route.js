import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const { token, user } = await request.json();

    if (!token || !user) {
      console.error("❌ Missing token or user data");
      return NextResponse.json(
        { error: "Missing token or user data" },
        { status: 400 }
      );
    }

    const response = NextResponse.json({ success: true });

    // Determine if we're in production (HTTPS) or development (HTTP)
    const isProduction = process.env.NODE_ENV === "production";
    
    // Cookie options for Safari/iOS compatibility
    const cookieOptions = {
      path: "/",
      maxAge: 60 * 60 * 2, // 2 hours
      httpOnly: false, // Must be false so client JS can read it
      sameSite: "lax",
      // Only set Secure in production (HTTPS)
      ...(isProduction && { secure: true }),
    };

    console.log(`🍪 Setting cookies (production: ${isProduction}, secure: ${isProduction})`);

    // Set session cookie
    response.cookies.set("bgvSession", token, cookieOptions);

    // Set user cookie for middleware RBAC
    response.cookies.set(
      "bgvUser",
      JSON.stringify({
        role: user.role,
        userName: user.userName,
        email: user.email,
        organizationId: user.organizationId,
      }),
      cookieOptions
    );

    console.log(`✅ Cookies set for user: ${user.email} (${user.role})`);

    return response;
  } catch (error) {
    console.error("❌ Cookie setting error:", error);
    return NextResponse.json(
      { error: "Failed to set cookies" },
      { status: 500 }
    );
  }
}
