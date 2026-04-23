import { redirect } from "next/navigation";
import { LoginForm } from "@/app/(auth)/login/login-form";
import { getCurrentProfile, getHomePathForRole } from "@/server/profile";

export default async function LoginPage() {
  const profile = await getCurrentProfile();

  if (profile?.active) {
    redirect(getHomePathForRole(profile.role));
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md items-center px-6">
      <section className="w-full rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-slate-900">Iniciar sesion</h2>
        <p className="mt-2 text-sm text-slate-600">Ingresa con tu usuario operativo y tu contrasena.</p>
        <LoginForm />
      </section>
    </div>
  );
}
