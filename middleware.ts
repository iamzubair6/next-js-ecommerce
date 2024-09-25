import { NextRequest, NextResponse } from "next/server";
import { isPasswordValid } from "./lib/isPasswordValid";

export async function middleware(req: NextRequest) {
  if ((await isAuthenticated(req)) === false) {
    return new NextResponse("Unauthorized", {
      status: 401,
      headers: { "WWW-Authenticate": "Basic" },
    });
  }
}

async function isAuthenticated(req: NextRequest) {
  const authHeader =
    req.headers.get("authorization") || req.headers.get("Authorization");
  if (authHeader == null) {
    return false;
  }
  const [username, password] = Buffer.from(authHeader.split(" ")[1], "base64")
    .toString()
    .split(":");
  return (
    username === process.env.NEXT_PUBLIC_ADMIN_USERNAME &&
    (await isPasswordValid(
      password,
      process.env.NEXT_PUBLIC_HASHED_ADMIN_PASSWORD as string
    ))
  );
}

//check if you are authenticated or in other words, if you are in the admin page
export const config = {
  matcher: "/admin/:path*",
};
