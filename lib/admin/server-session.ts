import { cookies } from "next/headers";
import { ADMIN_COOKIE_NAME, verifyAdminCookieValue } from "@/lib/admin/admin-cookie";

export async function hasAdminCookieSession(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
  return verifyAdminCookieValue(token);
}
