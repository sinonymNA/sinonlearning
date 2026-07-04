import { NextRequest, NextResponse } from "next/server";

export default function proxy(request: NextRequest) {
  const hasSession = request.cookies.has("margins_session");
  if (!hasSession) {
    const loginUrl = new URL("/margins/login", request.url);
    return NextResponse.redirect(loginUrl);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/margins/teacher/:path*", "/margins/student/:path*"],
};
