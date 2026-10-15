"use client";

import React, { useState, useTransition } from "react";
import { loginAdminAction } from "@/app/actions/admin";
import { useRouter } from "next/navigation";
import { Lock, ShieldAlert, ArrowRight, Scissors } from "lucide-react";
import Link from "next/link";

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      const formData = new FormData();
      formData.set("password", password);

      const res = await loginAdminAction(null, formData);
      if (res.success) {
        router.push("/admin");
        router.refresh();
      } else {
        setError(res.error || "Error al iniciar sesión.");
      }
    });
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md barber-panel rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-barber-gold opacity-60" />

        <div className="text-center space-y-2 mb-6">
          <div className="w-12 h-12 rounded-full bg-barber-gold/15 border border-barber-gold/30 flex items-center justify-center mx-auto text-barber-gold">
            <Lock className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-barber-textPrimary">
            Panel de Administración
          </h1>
          <p className="text-xs text-barber-textSecondary">
            Acceso restringido para el barbero / administrador del salón.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3.5 rounded-xl bg-red-950/40 border border-red-800/60 text-red-200 text-xs flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-barber-textSecondary mb-1.5 block">
              Contraseña de acceso *
            </label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-barber-card border border-barber-border rounded-xl px-4 py-2.5 text-sm text-barber-textPrimary placeholder:text-barber-textSecondary/40 focus:outline-none focus:border-barber-gold"
            />
          </div>

          <div className="p-3 rounded-xl bg-barber-card/60 border border-barber-border text-[11px] text-barber-textSecondary">
            <span className="font-semibold text-barber-gold block mb-0.5">Entorno Demo MVP:</span>
            Contraseña provisional configurada: <code className="font-mono text-barber-textPrimary bg-barber-panel px-1.5 py-0.5 rounded">admin123</code>
          </div>

          <button
            type="submit"
            disabled={isPending || !password}
            className={`w-full py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
              isPending || !password
                ? "bg-barber-card border border-barber-border text-barber-textSecondary/50 cursor-not-allowed"
                : "bg-barber-gold hover:bg-barber-goldHover text-barber-dark shadow-lg shadow-barber-gold/20 cursor-pointer"
            }`}
          >
            {isPending ? (
              <>
                <div className="w-4 h-4 border-2 border-barber-dark border-t-transparent rounded-full animate-spin" />
                Verificando credenciales...
              </>
            ) : (
              <>
                Ingresar al Panel
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-barber-border text-center">
          <Link
            href="/"
            className="text-xs text-barber-textSecondary hover:text-barber-textPrimary flex items-center justify-center gap-1.5"
          >
            <Scissors className="w-3.5 h-3.5 text-barber-gold" />
            Volver al sitio público de turnos
          </Link>
        </div>
      </div>
    </div>
  );
}
