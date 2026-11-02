import { NextResponse } from "next/server";

export function GET(request: Request) {
  const headers = new Headers(request.headers);
  const host = headers.get("x-forwarded-host") ?? headers.get("host");
  const protocol = headers.get("x-forwarded-proto") ?? "https";
  const destination = host
    ? `${protocol}://${host}/suspect/index.html`
    : new URL("/suspect/index.html", request.url).toString();
  return NextResponse.redirect(destination);
}
