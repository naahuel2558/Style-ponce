import { BookingWizard } from "@/components/BookingWizard";
import { getServicesConfig } from "@/lib/db";
import {
  Scissors,
  Clock,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Sparkles,
  ArrowRight,
  Award,
  Sparkle,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default function HomePage() {
  const servicesConfig = getServicesConfig();
  const cortePrice = servicesConfig["corte-tradicional"]?.priceArs || 10000;
  const comboPrice = servicesConfig["combo-corte-bebida"]?.priceArs || 13500;
  return (
    <div className="flex flex-col w-full" id="inicio">
      {/* 1. HERO REALISTA & PROFESIONAL */}
      <section className="relative w-full -mt-20 overflow-hidden bg-surface-container-lowest">
        <div className="absolute inset-0 z-0">
          <div
            className="w-full h-full bg-cover bg-center opacity-35 scale-105 transform duration-1000 ease-out"
            style={{
              backgroundImage:
                "url('https://lh3.googleusercontent.com/aida-public/AB6AXuA7TIqp5nWR8ixu4DZek3Caa7I9X_SqegZQbIz6phqG0GD0gC5jsBfzYsNeZcwp--JmJoSg_L0ywwX0xFqjy1ipJe6g8b2_Dr9ELjqkeV1riiXE66O6-u_aU2pZZqGNpS6jSYk6HjYYBWzZ9t2NHukr-AkHDZXe2XxcQrIMf8Q_f0DpMMBoB8rYQjJuVaLsEzynzCJW4fUyrTMmvM0rt5aDawYTNh8Sz89mA94Edf7rch19bfqJqBIj')",
            }}
          />
          <div className="absolute inset-0 bg-linear-to-t from-background via-background/80 to-surface-container-lowest/85" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_35%,rgba(238,207,166,0.12),transparent_65%)] pointer-events-none" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-12 pt-36 pb-16 md:pt-44 md:pb-24 flex flex-col justify-between min-h-195">
          <div className="flex flex-col gap-6 max-w-3xl">
            <div className="inline-flex items-center gap-2 self-start px-3.5 py-1.5 rounded-full bg-surface-container/90 backdrop-blur-md border border-surface-container-high shadow-md">
              <span className="text-primary text-xs">★</span>
              <span className="text-[11px] tracking-[0.2em] text-on-surface-variant uppercase font-medium">
                Peluquería Masculina Independiente
              </span>
            </div>

            <div className="space-y-2">
              <p className="text-xs text-primary uppercase tracking-[0.3em] font-semibold">
                Cortes Actuales • Atención Individual
              </p>
              <h1 className="font-display text-4xl sm:text-6xl text-on-surface leading-tight tracking-tight">
                Cortes con estilo, prolijidad <br />
                <span className="italic text-primary font-normal">&amp; atención a horario</span>
              </h1>
            </div>

            <p className="text-sm sm:text-base text-on-surface-variant max-w-2xl leading-relaxed">
              Trabajamos con turnos individuales para que vengas a tu horario, te atiendas tranquilo y sin perder tiempo haciendo fila. Máquinas profesionales, terminaciones prolijas con navaja y opción de bebida fría durante tu corte.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <a
                href="#reserva"
                className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-primary text-on-primary text-xs uppercase tracking-wider rounded font-bold shadow-xl hover:bg-secondary transition-all transform hover:-translate-y-0.5"
              >
                <span>Reservar Turno Ahora</span>
                <Calendar className="w-4 h-4" />
              </a>

              <a
                href="#servicios"
                className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-surface-container-high/80 text-on-surface text-xs uppercase tracking-wider rounded backdrop-blur-md border border-surface-container-highest shadow-md hover:text-primary transition-all"
              >
                <span>Ver Servicios y Precios</span>
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Quick Metrics Ribbon (Realistas y sin exageraciones) */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-8 mt-12 bg-surface-container-low/80 backdrop-blur-md p-6 rounded-2xl border border-surface-container-high/60 shadow-2xl">
            <div className="flex flex-col gap-1">
              <span className="font-display text-2xl sm:text-3xl text-primary font-bold">Certificado</span>
              <span className="text-[10px] text-on-surface-variant uppercase tracking-wider">
                Peluquero Formado &amp; Calificado
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="font-display text-2xl sm:text-3xl text-primary font-bold">Máquinas</span>
              <span className="text-[10px] text-on-surface-variant uppercase tracking-wider">
                Herramientas Propias Limpias
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="font-display text-2xl sm:text-3xl text-primary font-bold">Puntual</span>
              <span className="text-[10px] text-on-surface-variant uppercase tracking-wider">
                Atención 1 a 1 Sin Esperas
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="font-display text-2xl sm:text-3xl text-primary font-bold">4.9 ★</span>
              <span className="text-[10px] text-on-surface-variant uppercase tracking-wider">
                Opiniones de Clientes
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. CÓMO TRABAJAMOS (El proceso honesto y prolijo) */}
      <section id="proceso" className="w-full py-16 md:py-24 bg-background relative">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 flex flex-col gap-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="flex flex-col gap-2 max-w-xl">
              <span className="text-xs uppercase tracking-[0.25em] text-primary font-semibold">
                Paso a Paso
              </span>
              <h2 className="font-display text-3xl sm:text-4xl text-on-surface">
                Cómo Trabajamos en tu Turno
              </h2>
              <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed">
                Sin vueltas ni protocolos inventados: atención dedicada, buen trato y foco en que te vayas conforme con el corte.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Paso 1 */}
            <div className="p-6 rounded-2xl bg-surface-container-low border border-surface-container-high/60 shadow-md flex flex-col justify-between gap-4 group hover:bg-surface-container transition-all">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-display text-2xl text-primary/40 group-hover:text-primary transition-colors">01</span>
                  <div className="w-9 h-9 rounded-full bg-surface-container-high flex items-center justify-center text-primary text-sm font-semibold">
                    💬
                  </div>
                </div>
                <h3 className="font-display text-base text-on-surface font-semibold">
                  Charla Inicial de Estilo
                </h3>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  Vemos cómo te gusta el pelo: clásico, degradé, fade alto o bajo, o simplemente recortar y emprolijar las puntas.
                </p>
              </div>
              <span className="text-[10px] text-primary uppercase tracking-widest font-medium">
                Tu Corte, a tu Gusto
              </span>
            </div>

            {/* Paso 2 */}
            <div className="p-6 rounded-2xl bg-surface-container-low border border-surface-container-high/60 shadow-md flex flex-col justify-between gap-4 group hover:bg-surface-container transition-all">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-display text-2xl text-primary/40 group-hover:text-primary transition-colors">02</span>
                  <div className="w-9 h-9 rounded-full bg-surface-container-high flex items-center justify-center text-primary text-sm font-semibold">
                    ✂
                  </div>
                </div>
                <h3 className="font-display text-base text-on-surface font-semibold">
                  Corte a Máquina y Tijera
                </h3>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  Uso de máquinas de corte principales y tijera para lograr una caída prolija, uniforme y con buen desvanecido.
                </p>
              </div>
              <span className="text-[10px] text-primary uppercase tracking-widest font-medium">
                Técnica &amp; Prolijidad
              </span>
            </div>

            {/* Paso 3 */}
            <div className="p-6 rounded-2xl bg-surface-container-low border border-surface-container-high/60 shadow-md flex flex-col justify-between gap-4 group hover:bg-surface-container transition-all">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-display text-2xl text-primary/40 group-hover:text-primary transition-colors">03</span>
                  <div className="w-9 h-9 rounded-full bg-surface-container-high flex items-center justify-center text-primary text-sm font-semibold">
                    🪒
                  </div>
                </div>
                <h3 className="font-display text-base text-on-surface font-semibold">
                  Detalles a Navaja
                </h3>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  Definición precisa de patillas, contornos de la nuca, cejas y marcado de barba con navaja descartable de un solo uso.
                </p>
              </div>
              <span className="text-[10px] text-primary uppercase tracking-widest font-medium">
                Terminación Limpia
              </span>
            </div>

            {/* Paso 4 */}
            <div className="p-6 rounded-2xl bg-surface-container-low border border-surface-container-high/60 shadow-md flex flex-col justify-between gap-4 group hover:bg-surface-container transition-all">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-display text-2xl text-primary/40 group-hover:text-primary transition-colors">04</span>
                  <div className="w-9 h-9 rounded-full bg-surface-container-high flex items-center justify-center text-primary text-sm font-semibold">
                    🥤
                  </div>
                </div>
                <h3 className="font-display text-base text-on-surface font-semibold">
                  Bebida Fría en el Combo
                </h3>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  Si elegís el combo, podés tomarte una Coca-Cola fría o una cerveza Brahma durante tu sesión de corte.
                </p>
              </div>
              <span className="text-[10px] text-primary uppercase tracking-widest font-medium">
                Opción Combo
              </span>
            </div>
          </div>

          {/* Banner de Compromiso de Atención */}
          <div className="rounded-2xl bg-surface-container border border-surface-container-high p-6 sm:p-8 grid grid-cols-1 lg:grid-cols-12 items-center gap-6 shadow-xl">
            <div className="lg:col-span-8 space-y-2">
              <div className="flex items-center gap-2 text-primary">
                <ShieldCheck className="w-4 h-4" />
                <span className="text-xs uppercase tracking-widest font-semibold">
                  Atención Individual • Tu Turno es Tu Turno
                </span>
              </div>
              <h3 className="font-display text-xl sm:text-2xl text-on-surface font-semibold">
                Puntualidad y Respeto por tu Tiempo
              </h3>
              <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed">
                Organizamos la agenda de forma individual para evitar las esperas molestas de las peluquerías tradicionales. Llegás a tu horario reservado y te sentás directo en el sillón.
              </p>
            </div>

            <div className="lg:col-span-4 flex flex-col gap-2 text-xs text-on-surface border-l-0 lg:border-l border-surface-container-high lg:pl-6">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                <span>Máquinas limpiadas entre turnos</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                <span>Navajas descartables higiénicas</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                <span>Atención dedicada exclusivamente a vos</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. CARTA DE SERVICIOS INSIGNIA */}
      <section id="servicios" className="w-full py-16 md:py-24 bg-surface-container-lowest">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 flex flex-col gap-10">
          <div className="text-center space-y-2 max-w-xl mx-auto">
            <span className="text-xs uppercase tracking-[0.3em] text-primary font-semibold">
              Servicios &amp; Precios
            </span>
            <h2 className="font-display text-3xl sm:text-4xl text-on-surface">
              Servicios Disponibles
            </h2>
            <p className="text-xs sm:text-sm text-on-surface-variant">
              Precios informados en Pesos Argentinos (ARS). Podés abonar en efectivo o por transferencia al finalizar el corte.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto w-full">
            {/* Servicio 1: Corte Tradicional */}
            <div className="p-7 sm:p-8 rounded-2xl bg-surface-container border border-surface-container-high shadow-xl flex flex-col justify-between gap-6 hover:border-primary/50 transition-all">
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] text-primary uppercase tracking-widest font-semibold">
                      Servicio Principal
                    </span>
                    <h3 className="font-display text-xl text-on-surface font-semibold pt-1">
                      Corte Tradicional
                    </h3>
                  </div>
                  <span className="font-display text-2xl text-primary font-bold">
                    ${cortePrice.toLocaleString("es-AR")} <span className="text-xs font-normal text-on-surface-variant">ARS</span>
                  </span>
                </div>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  Corte completo a máquina y tijera, adaptado a tu estilo (clásico, fade o degradé) y terminación prolija de patillas y nuca.
                </p>
                <div className="flex items-center gap-4 text-xs text-on-surface-variant font-medium pt-2">
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-primary" />
                    30 Minutos
                  </span>
                  <span>•</span>
                  <span>Máquina, Tijera y Navaja</span>
                </div>
              </div>

              <a
                href="#reserva"
                className="w-full text-center py-3 bg-surface-container-high hover:bg-primary hover:text-on-primary text-on-surface text-xs uppercase tracking-wider font-semibold rounded-xl transition-all"
              >
                Elegir este Servicio
              </a>
            </div>

            {/* Servicio 2: Combo Corte + Bebida */}
            <div className="relative p-7 sm:p-8 rounded-2xl bg-surface-container-high border-2 border-primary/60 shadow-2xl flex flex-col justify-between gap-6">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-primary text-on-primary text-[10px] uppercase tracking-widest rounded-full font-bold shadow-md">
                Combo con Bebida
              </div>

              <div className="space-y-4 pt-2">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] text-primary uppercase tracking-widest font-semibold">
                      Corte &amp; Bebida
                    </span>
                    <h3 className="font-display text-xl text-on-surface font-semibold pt-1">
                      Combo Corte + Bebida
                    </h3>
                  </div>
                  <div className="text-right">
                    <span className="font-display text-2xl text-primary font-bold">
                      ${comboPrice.toLocaleString("es-AR")} <span className="text-xs font-normal text-on-surface-variant">ARS</span>
                    </span>
                  </div>
                </div>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  Corte completo con máquinas y navaja, acompañado por una bebida fría a tu elección: Coca-Cola fría o cerveza Brahma (+18 años).
                </p>
                <div className="flex items-center gap-4 text-xs text-on-surface-variant font-medium pt-2">
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-primary" />
                    45 Minutos
                  </span>
                  <span>•</span>
                  <span>Coca-Cola o Cerveza Brahma</span>
                </div>
              </div>

              <a
                href="#reserva"
                className="w-full text-center py-3 bg-primary text-on-primary hover:bg-secondary text-xs uppercase tracking-wider font-bold rounded-xl transition-all shadow-lg"
              >
                Elegir Combo con Bebida
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* 4. ASISTENTE INTERACTIVO DE RESERVA ONLINE */}
      <section id="reserva" className="w-full py-16 md:py-24 bg-background relative border-t border-surface-container-high">
        <div className="max-w-4xl mx-auto px-6 text-center space-y-3 mb-10">
          <span className="text-xs uppercase tracking-[0.3em] text-primary font-semibold">
            Turnos Online Inmediatos
          </span>
          <h2 className="font-display text-3xl sm:text-4xl text-on-surface font-semibold">
            Reservá tu Turno
          </h2>
          <p className="text-xs sm:text-sm text-on-surface-variant max-w-md mx-auto">
            Elegí el servicio, seleccioná fecha y horario libre y confirmá tu turno con tus datos.
          </p>
        </div>

        <div className="px-4">
          <BookingWizard servicesConfig={servicesConfig} />
        </div>
      </section>

      {/* 5. TESTIMONIOS SENCILLOS DE PRUEBA */}
      <section className="w-full py-16 bg-surface-container-lowest border-t border-surface-container-high/60">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 flex flex-col gap-8">
          <div className="text-center space-y-1 max-w-xl mx-auto">
            <span className="text-xs uppercase tracking-[0.2em] text-primary font-semibold">
              Opiniones
            </span>
            <h2 className="font-display text-2xl sm:text-3xl text-on-surface font-semibold">
              Lo Que Dicen Quienes Ya Vinieron
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-surface-container-low border border-surface-container-high/60 flex flex-col justify-between gap-4">
              <div className="space-y-2">
                <div className="text-primary text-xs tracking-widest">★★★★★</div>
                <p className="text-xs text-on-surface italic leading-relaxed">
                  "Muy buen corte, prolijo con la máquina y te atiende puntual a la hora del turno. Sin esperas."
                </p>
              </div>
              <div className="flex items-center gap-3 pt-2">
                <div className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center font-display text-primary font-bold text-xs">
                  MG
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-on-surface">Martín Gómez</span>
                  <span className="text-[10px] text-on-surface-variant">Cliente habitual</span>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-surface-container-low border border-surface-container-high/60 flex flex-col justify-between gap-4">
              <div className="space-y-2">
                <div className="text-primary text-xs tracking-widest">★★★★★</div>
                <p className="text-xs text-on-surface italic leading-relaxed">
                  "El degradé quedó impecable y las patillas bien marcadas. La birra fría mientras te corta suma un montón."
                </p>
              </div>
              <div className="flex items-center gap-3 pt-2">
                <div className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center font-display text-primary font-bold text-xs">
                  FL
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-on-surface">Federico López</span>
                  <span className="text-[10px] text-on-surface-variant">Cliente habitual</span>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-surface-container-low border border-surface-container-high/60 flex flex-col justify-between gap-4">
              <div className="space-y-2">
                <div className="text-primary text-xs tracking-widest">★★★★★</div>
                <p className="text-xs text-on-surface italic leading-relaxed">
                  "El sistema para sacar turno por la página es comodísimo. Reservás en dos clics y ya sabés que tu lugar está asegurado."
                </p>
              </div>
              <div className="flex items-center gap-3 pt-2">
                <div className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center font-display text-primary font-bold text-xs">
                  RA
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-on-surface">Rodrigo Ayala</span>
                  <span className="text-[10px] text-on-surface-variant">Cliente habitual</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
