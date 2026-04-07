"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { type FormEvent, useMemo, useState } from "react";

function isSafeNextPath(value: string) {
  return value.startsWith("/admin") && !value.startsWith("//");
}

export default function AdminLoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextParam = searchParams.get("next") ?? "/admin";
  const nextPath = useMemo(
    () => (isSafeNextPath(nextParam) ? nextParam : "/admin"),
    [nextParam],
  );

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Credenciales inválidas");
        }

        const payload = (await response.json()) as { message?: string };
        throw new Error(payload.message ?? "No se pudo iniciar sesión");
      }

      router.replace(nextPath);
      router.refresh();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Error desconocido",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-cream-white px-6 py-12 text-oxford-black">
      <section className="mx-auto w-full max-w-lg rounded-3xl border border-ochre/20 bg-white p-8">
        <p className="text-xs uppercase tracking-[0.35em] text-ochre">
          Admin Login
        </p>
        <h2 className="mt-2 font-serif text-4xl text-royal-blue">
          Iniciar sesión
        </h2>
        <p className="mt-2 text-sm text-oxford-black/70">
          Acceso interno para operación de pedidos, sabores y análisis.
        </p>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <label className="block">
            <span className="mb-1 block text-sm text-oxford-black/80">
              Email
            </span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-2xl border border-ochre/30 px-3 py-2 text-sm outline-none focus:border-royal-blue"
              autoComplete="username"
              required
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm text-oxford-black/80">
              Password
            </span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-2xl border border-ochre/30 px-3 py-2 text-sm outline-none focus:border-royal-blue"
              autoComplete="current-password"
              required
            />
          </label>

          {errorMessage ? (
            <p className="rounded-2xl bg-wine-red/10 px-4 py-3 text-sm text-wine-red">
              {errorMessage}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-2xl bg-royal-blue px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
          >
            {isSubmitting ? "Entrando..." : "Entrar"}
          </button>
        </form>
      </section>
    </div>
  );
}
