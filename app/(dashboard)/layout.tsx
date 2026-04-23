import { AppShell } from "@/components/app-shell";
import { signOutAction } from "@/app/(dashboard)/actions";
import { requireActiveProfile } from "@/server/profile";

export default async function DashboardLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const profile = await requireActiveProfile();

  return (
    <AppShell profile={profile} onSignOut={signOutAction}>
      {children}
    </AppShell>
  );
}
