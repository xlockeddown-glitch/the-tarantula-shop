import { createFileRoute, Navigate } from "@tanstack/react-router";
import { SignInButtons } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";

export const Route = createFileRoute("/login")({ component: LoginPage });

function LoginPage() {
  const { user, isPending } = useCurrentUserState();
  if (isPending) return null;
  if (user) return <Navigate to="/" />;
  return (
    <main className="flex min-h-dvh items-center justify-center bg-[#7a8480] px-5 py-12 text-[#3a3a3c]">
      <div className="w-full max-w-md rounded-[22px] border-4 border-[#5aa8a0] bg-[#efe6d8] p-7 shadow-[0_16px_0_#7a8680]">
        <p className="font-mono text-[11px] tracking-[0.18em] text-[#5aa8a0] uppercase">
          The Tarantula Shop
        </p>
        <h1 className="font-display mt-2 text-3xl text-[#3a3a3c]">Sign in to continue</h1>
        <div className="mt-6">
          <SignInButtons />
        </div>
      </div>
    </main>
  );
}
