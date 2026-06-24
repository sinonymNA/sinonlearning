import { NextRequest, NextResponse } from "next/server";
import { STATE_COOKIE_NAME, createOAuthClient, parseTargetFromState } from "@/lib/googleExportAuth";

export const dynamic = "force-dynamic";

function popupResponse(payload: Record<string, unknown>): NextResponse {
  const html = `<!doctype html><html><body><script>
    if (window.opener) {
      window.opener.postMessage(${JSON.stringify({ source: "sinon-google-export", ...payload })}, window.location.origin);
    }
    window.close();
  </script></body></html>`;
  const response = new NextResponse(html, { headers: { "Content-Type": "text/html" } });
  response.cookies.delete(STATE_COOKIE_NAME);
  return response;
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");
  const cookieState = request.cookies.get(STATE_COOKIE_NAME)?.value;

  if (error) {
    return popupResponse({ error: "Google sign-in was cancelled." });
  }
  if (!code || !state || !cookieState || state !== cookieState) {
    return popupResponse({ error: "That sign-in link expired. Please try again." });
  }
  const target = parseTargetFromState(state);
  if (!target) {
    return popupResponse({ error: "That sign-in link expired. Please try again." });
  }

  try {
    const client = createOAuthClient();
    const { tokens } = await client.getToken(code);
    if (!tokens.access_token) {
      return popupResponse({ error: "Google didn't return an access token. Please try again." });
    }
    return popupResponse({ accessToken: tokens.access_token, target });
  } catch {
    return popupResponse({ error: "Couldn't finish signing in with Google. Please try again." });
  }
}
