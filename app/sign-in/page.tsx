"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import { File01Icon, Loading03Icon } from "@hugeicons/core-free-icons";
import { signIn } from "@/lib/auth-client";
import { GoogleButton } from "@/components/google-button";
import { emailPasswordEnabled, googleEnabled } from "@/lib/auth-flags";
import { useT } from "@/lib/i18n";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";

export default function SignInPage() {
  const router = useRouter();
  const t = useT();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error } = await signIn.email({ email, password });
    setLoading(false);
    if (error) {
      setError(error.message ?? t.auth.signInFail);
      return;
    }
    router.push("/companies");
    router.refresh();
  }

  return (
    <div className="mx-auto mt-10 max-w-sm">
      <div className="mb-6 flex flex-col items-center gap-2 text-center">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--primary)] text-[var(--primary-foreground)]">
          <HugeiconsIcon icon={File01Icon} size={20} />
        </span>
        <h1 className="text-xl font-bold tracking-tight">{t.auth.signInTitle}</h1>
        <p className="text-sm text-[var(--muted-foreground)]">
          {t.auth.signInSubtitle}
        </p>
      </div>

      <Card>
        <CardContent className="space-y-4 p-5">
          {googleEnabled && <GoogleButton callbackURL="/companies" />}

          {googleEnabled && emailPasswordEnabled && (
            <div className="flex items-center gap-3 text-xs text-[var(--muted-foreground)]">
              <span className="h-px flex-1 bg-[var(--border)]" />
              {t.common.or}
              <span className="h-px flex-1 bg-[var(--border)]" />
            </div>
          )}

          {!googleEnabled && !emailPasswordEnabled && (
            <p className="text-center text-sm text-[var(--muted-foreground)]">
              {t.auth.noSignIn}
            </p>
          )}

          {emailPasswordEnabled && (
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email">{t.auth.email}</Label>
              <Input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t.auth.emailPh}
              />
            </div>
            <div>
              <Label htmlFor="password">{t.auth.password}</Label>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>

            {error && (
              <p className="text-sm text-red-600" role="alert">
                {error}
              </p>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading && (
                <HugeiconsIcon icon={Loading03Icon} size={16} className="animate-spin" />
              )}
              {t.auth.signInBtn}
            </Button>
          </form>
          )}
        </CardContent>
      </Card>

      {emailPasswordEnabled && (
        <p className="mt-4 text-center text-sm text-[var(--muted-foreground)]">
          {t.auth.noAccount}{" "}
          <Link href="/sign-up" className="font-medium text-[var(--primary)]">
            {t.auth.signUpBtn}
          </Link>
        </p>
      )}
    </div>
  );
}
