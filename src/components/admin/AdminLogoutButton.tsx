"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function AdminLogoutButton() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  async function handleLogout() {
    setIsLoading(true);
    try {
      await fetch("/api/admin/auth/logout", {
        method: "POST",
      });
    } finally {
      setIsLoading(false);
      router.replace("/admin/login");
      router.refresh();
    }
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={isLoading}
      className="rounded-2xl border border-ochre/40 px-4 py-2 text-sm text-royal-blue transition hover:bg-royal-blue/5 disabled:opacity-60"
    >
      {isLoading ? "Saliendo..." : "Cerrar sesión"}
    </button>
  );
}
