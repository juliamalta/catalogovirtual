import { headers } from "next/headers";
import { getAuth } from "@/lib/auth";

export async function getCurrentSession() {
  return getAuth().api.getSession({ headers: await headers() });
}
