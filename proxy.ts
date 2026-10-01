import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

// Next.js 16+: berkas ini bernama proxy.ts dengan fungsi `proxy`.
// Kalau versi Next.js-mu lebih lama, namai middleware.ts dan fungsinya `middleware`.
export async function proxy(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
