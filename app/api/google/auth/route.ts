import { NextRequest, NextResponse } from "next/server";
import {
  STATE_COOKIE_NAME,
  buildAuthState,
  createOAuthClient,
  isGoogleExportConfigured,
  scopeForTarget,
  type GoogleExportTarget,
} from "@/lib/googleExportAuth";

export const dynamic = "force-dynamic";

function popupErrorResponse(message: string): NextResponse {
  const html = `<!doctype html><html><body><script>
    if (window.opener) {
      window.opener.postMessage({ source: "sinon-google-export", error: ${JSON.stringify(message)} }, window.location.origin);
    }
    window.close();
  </script><p>${message}</p></body></html>`;
  return new NextResponse(html, { headers: { "Content-Type": "text/html" } });
}

export async function GET(request: NextRequest) {
  const target = request.nextUrl.searchParams.get("target");
  if (target !== "docs" && target !== "slides") {
    return popupErrorResponse("Missing export target.");
  }
  if (!isGoogleExportConfigured()) {
    return popupErrorResponse("Google export isn't set up yet.");
  }

  const state = buildAuthState(target as GoogleExportTarget);
  const client = createOAuthClient();
  const url = client.generateAuthUrl({
    access_type: "online",
    scope: [scopeForTarget(target as GoogleExportTarget)],
    state,
    prompt: "select_account",
  });

  const response = NextResponse.redirect(url);
  response.cookies.set(STATE_COOKIE_NAME, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/api/google",
    maxAge: 60 * 10,
  });
  return response;
}
