"use server";

import { redirect } from "next/navigation";
import { signOut } from "@/server/auth";

export async function signOutAction() {
  await signOut();
  redirect("/login");
}
