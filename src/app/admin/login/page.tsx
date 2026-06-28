"use client";

import { Eye, EyeOff } from "lucide-react";
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
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
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
    <div className="min-h-dvh bg-cream-white px-4 py-8 text-oxford-black sm:px-6 sm:py-12">
      <section className="mx-auto w-full max-w-lg rounded-2xl border border-ochre/20 bg-white p-5 sm:rounded-3xl sm:p-8">
        <p className="text-[0.68rem] uppercase tracking-[0.25em] text-ochre sm:text-xs sm:tracking-[0.35em]">
          Admin Login
        </p>
        <h2 className="mt-2 font-serif text-3xl text-royal-blue sm:text-4xl">
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
              className="min-h-11 w-full rounded-2xl border border-ochre/30 px-3 py-2 text-sm outline-none focus-visible:border-royal-blue focus-visible:ring-2 focus-visible:ring-royal-blue/20"
              autoComplete="username"
              required
            />
          </label>

          <div className="block">
            <label
              htmlFor="admin-password"
              className="mb-1 block text-sm text-oxford-black/80"
            >
              Password
            </label>
            <div className="relative">
              <input
                id="admin-password"
                type={isPasswordVisible ? "text" : "password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="min-h-11 w-full rounded-2xl border border-ochre/30 px-3 py-2 pr-12 text-sm outline-none focus-visible:border-royal-blue focus-visible:ring-2 focus-visible:ring-royal-blue/20"
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                aria-label={
                  isPasswordVisible
                    ? "Ocultar contraseña"
                    : "Mostrar contraseña"
                }
                title={
                  isPasswordVisible
                    ? "Ocultar contraseña"
                    : "Mostrar contraseña"
                }
                className="-translate-y-1/2 absolute top-1/2 right-1.5 inline-flex size-10 items-center justify-center rounded-full text-oxford-black/55 transition hover:bg-ochre/10 hover:text-royal-blue focus:outline-none focus-visible:ring-2 focus-visible:ring-royal-blue/45"
                onClick={() => setIsPasswordVisible((visible) => !visible)}
              >
                {isPasswordVisible ? (
                  <EyeOff aria-hidden="true" className="size-4" />
                ) : (
                  <Eye aria-hidden="true" className="size-4" />
                )}
              </button>
            </div>
          </div>

          {errorMessage ? (
            <p className="rounded-2xl bg-wine-red/10 px-4 py-3 text-sm text-wine-red">
              {errorMessage}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={isSubmitting}
            className="min-h-11 w-full rounded-2xl bg-royal-blue px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
          >
            {isSubmitting ? "Entrando" : "Entrar"}
          </button>
        </form>
      </section>
    </div>
  );
}
