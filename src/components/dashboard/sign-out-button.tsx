"use client";
import { authClient } from "@/lib/auth/client";
import { LogOut } from "lucide-react";

export function SignOutButton() {
  return <button className="secondary-button dashboard-sign-out" type="button" onClick={async () => { await authClient.signOut(); window.location.assign("/login"); }}><LogOut size={16} />Sair</button>;
}
