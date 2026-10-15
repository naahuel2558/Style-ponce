import type { Metadata } from "next";
import { Bodoni_Moda, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import Link from "next/link";

const bodoni = Bodoni_Moda({
  subsets: ["latin"],
  variable: "--font-bodoni",
  display: "swap",
});

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Style Ponce | Peluquería Masculina & Reservas Online",
  description: "Cortes actuales, prolijidad y atención individual sin demoras. Reservá tu turno online en segundos con confirmación inmediata.",
  keywords: ["peluquería", "corte de pelo", "Style Ponce", "turnos online", "degradé", "fade", "Buenos Aires"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`dark ${bodoni.variable} ${plusJakarta.variable}`}>
      <body className="min-h-screen bg-background text-on-surface font-body antialiased flex flex-col selection:bg-primary selection:text-on-primary">
        {/* Header estilo moderno y profesional */}
        <header className="fixed top-0 left-0 right-0 w-full z-50 bg-surface-container-lowest/90 backdrop-blur-xl border-b border-surface-container-high/60 shadow-[0_1px_12px_rgba(0,0,0,0.5)]">
          <div className="max-w-7xl mx-auto px-6 lg:px-12 h-20 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="flex flex-col">
                <span className="font-display text-xl uppercase tracking-widest text-primary font-semibold">
                  Style Ponce
                </span>
                <span className="text-[10px] uppercase tracking-[0.25em] text-on-surface-variant">
                  Peluquería Masculina
                </span>
              </div>
            </Link>

            <nav className="hidden md:flex items-center gap-6 text-xs uppercase tracking-wider text-on-surface-variant font-medium">
              <Link href="#inicio" className="hover:text-primary transition-colors py-1 px-2 text-primary font-semibold">
                Inicio
              </Link>
              <Link href="#proceso" className="hover:text-primary transition-colors py-1 px-2">
                Cómo Trabajamos
              </Link>
              <Link href="#servicios" className="hover:text-primary transition-colors py-1 px-2">
                Servicios
              </Link>
              <Link href="#reserva" className="hover:text-primary transition-colors py-1 px-2">
                Reservar Turno
              </Link>
            </nav>

            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-surface-container-low rounded border border-surface-container-high">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-[10px] uppercase tracking-wider text-on-surface font-medium">
                  Agenda Abierta
                </span>
              </div>

              <Link
                href="#reserva"
                className="px-5 py-2.5 bg-primary text-on-primary text-xs uppercase tracking-wider font-bold rounded-lg hover:bg-secondary transition-all shadow-md"
              >
                Reservar Turno
              </Link>
            </div>
          </div>
        </header>

        <main className="flex-1 pt-20">
          {children}
        </main>

        {/* Footer */}
        <footer className="border-t border-surface-container-high/60 bg-surface-container-lowest py-12 text-center text-xs text-on-surface-variant">
          <div className="max-w-7xl mx-auto px-6 space-y-4">
            <div className="flex flex-col items-center gap-1">
              <span className="font-display text-lg uppercase tracking-widest text-primary font-semibold">
                Style Ponce
              </span>
              <span className="text-[10px] uppercase tracking-[0.25em] text-on-surface-variant">
                Peluquería Masculina • Atención Personalizada
              </span>
            </div>

            <p className="max-w-md mx-auto text-xs text-on-surface-variant/80">
              Atención de Lunes a Sábados de 09:00 a 19:00 hs. Turnos individuales con confirmación autoritativa en servidor. Precios en Pesos Argentinos (ARS).
            </p>

            <div className="pt-4 border-t border-surface-container/60 flex flex-wrap items-center justify-center gap-4 text-[11px] text-on-surface-variant/60">
              <span>© {new Date().getFullYear()} Style Ponce.</span>
              <span>·</span>
              <Link href="/admin" className="text-primary hover:underline font-medium">
                Acceso Personal / Administración
              </Link>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
