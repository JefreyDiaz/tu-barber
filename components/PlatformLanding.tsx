import Link from 'next/link';
import { PLAN_LIST, TRIAL_DAYS } from '@/lib/plans';
import PlanCard from '@/components/platform/PlanCard';
import PlatformLogo from '@/components/PlatformLogo';

const FEATURES = [
  {
    icon: '📅',
    title: 'Reservas 24/7',
    desc: 'Tus clientes agendan desde el celular, a cualquier hora.',
  },
  {
    icon: '💬',
    title: 'WhatsApp automático',
    desc: 'Confirmaciones y recordatorios sin escribir a mano.',
  },
  {
    icon: '✂️',
    title: 'Tu equipo',
    desc: 'Cada barbero con su perfil, horarios y servicios.',
  },
];

const FAQ = [
  {
    q: '¿Necesito tarjeta para la prueba?',
    a: `No. Todos los planes incluyen ${TRIAL_DAYS} días gratis después de que aprobemos tu barbería.`,
  },
  {
    q: '¿Puedo cambiar de plan después?',
    a: 'Sí. Puedes empezar con Emprendedor, Negocio o Cadena y cambiar cuando quieras.',
  },
  {
    q: '¿Cómo me aprueban?',
    a: 'Revisamos tu solicitud en pocas horas y te avisamos por WhatsApp.',
  },
];

export default function PlatformLanding() {
  return (
    <div className="platform-bg min-h-screen min-h-[100dvh] text-white">
      {/* Nav */}
      <header className="sticky top-0 z-50 border-b border-white/5 bg-stone-950/60 backdrop-blur-xl">
        <div className="mx-auto flex max-w-lg items-center justify-between px-4 py-3 sm:max-w-2xl lg:max-w-4xl">
          <PlatformLogo size="sm" priority />
          <div className="flex items-center gap-2">
            <Link href="#precios" className="btn-glass hidden rounded-full px-4 py-2 text-xs font-medium sm:inline-block">
              Precios
            </Link>
            <Link href="/registro?plan=negocio" className="btn-accent rounded-full px-4 py-2 text-xs font-semibold">
              Empezar gratis
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-lg px-4 pb-16 sm:max-w-2xl lg:max-w-4xl">
        {/* Hero */}
        <section className="relative pt-10 pb-8 text-center sm:pt-16">
          <div className="glass-card-strong mx-auto max-w-md p-6 sm:p-8 animate-scale-in">
            <p className="text-xs font-semibold uppercase tracking-widest text-amber-400/80">
              Plataforma para barberías
            </p>
            <h1 className="mt-3 text-3xl font-bold leading-tight sm:text-4xl">
              Reservas online
              <br />
              <span className="text-gradient-gold">con estilo premium</span>
            </h1>
            <p className="mt-4 text-sm leading-relaxed text-white/60 sm:text-base">
              Sitio moderno para tu barbería, panel de administración y notificaciones WhatsApp.
              Diseñado para que tus clientes reserven desde el celular.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Link
                href="/registro?plan=negocio"
                className="btn-accent rounded-2xl px-6 py-3.5 text-sm font-semibold"
              >
                Probar {TRIAL_DAYS} días gratis →
              </Link>
              <Link href="#precios" className="btn-glass rounded-2xl px-6 py-3.5 text-sm font-medium">
                Ver planes
              </Link>
            </div>
          </div>

          {/* Mock phone preview */}
          <div className="relative mx-auto mt-10 max-w-[280px] animate-slide-in-bottom animation-delay-300">
            <div className="glass-card-strong overflow-hidden rounded-[2rem] p-1 shadow-2xl shadow-black/50">
              <div className="relative aspect-[9/16] overflow-hidden rounded-[1.75rem] bg-stone-900">
                <div
                  className="absolute inset-0 bg-cover bg-center opacity-60"
                  style={{ backgroundImage: 'url(/image/barberos/Santiago_1.png)' }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/40 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-5 text-left">
                  <p className="text-xs text-white/50">Tu barbería</p>
                  <p className="text-lg font-bold">Elige tu barbero</p>
                  <div className="mt-3 flex gap-2">
                    <div className="h-16 w-16 rounded-2xl bg-white/10 backdrop-blur-md" />
                    <div className="h-16 w-16 rounded-2xl bg-amber-500/20 ring-2 ring-amber-400/50 backdrop-blur-md" />
                    <div className="h-16 w-16 rounded-2xl bg-white/10 backdrop-blur-md" />
                  </div>
                  <div className="btn-accent mt-4 rounded-xl py-2.5 text-center text-xs font-semibold">
                    Reservar cita
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-10">
          <h2 className="text-center text-xl font-bold">Todo lo que necesitas</h2>
          <div className="mt-6 space-y-3">
            {FEATURES.map((f, i) => (
              <div
                key={f.title}
                className="glass-card flex items-start gap-4 p-4 animate-slide-in-bottom"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <span className="text-2xl">{f.icon}</span>
                <div>
                  <h3 className="font-semibold">{f.title}</h3>
                  <p className="mt-0.5 text-sm text-white/55">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Pricing */}
        <section id="precios" className="scroll-mt-20 py-10">
          <div className="text-center">
            <h2 className="text-xl font-bold">Elige tu plan</h2>
            <p className="mt-2 text-sm text-white/50">
              Todos los planes incluyen {TRIAL_DAYS} días gratis · sin tarjeta
            </p>
          </div>
          <div className="mt-8 grid gap-4 lg:grid-cols-3">
            {PLAN_LIST.map((plan) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                href={`/registro?plan=${plan.id}`}
              />
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section className="py-10">
          <h2 className="text-center text-xl font-bold">Preguntas frecuentes</h2>
          <div className="mt-6 space-y-3">
            {FAQ.map((item) => (
              <details key={item.q} className="glass-card group p-4">
                <summary className="cursor-pointer list-none font-medium marker:content-none [&::-webkit-details-marker]:hidden">
                  <span className="flex items-center justify-between gap-2">
                    {item.q}
                    <span className="text-white/40 transition group-open:rotate-45">+</span>
                  </span>
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-white/55">{item.a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-6">
          <div className="glass-card-strong p-6 text-center">
            <h2 className="text-xl font-bold">¿Listo para digitalizar tu barbería?</h2>
            <p className="mt-2 text-sm text-white/55">
              Regístrate en 2 minutos. Te activamos en pocas horas.
            </p>
            <Link href="/registro?plan=negocio" className="btn-accent mt-5 inline-block rounded-2xl px-8 py-3.5 text-sm font-semibold">
              Crear mi barbería
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/5 py-6 text-center text-xs text-white/35">
        <p>© {new Date().getFullYear()} TuBarber</p>
        <Link href="/platform/login" className="mt-2 inline-block hover:text-white/60">
          Admin plataforma
        </Link>
        <p className="mt-3">
          Created by{' '}
          <a
            href="https://prakto.co"
            target="_blank"
            rel="noopener noreferrer"
            className="text-white/50 underline decoration-white/20 underline-offset-2 hover:text-amber-400/90"
          >
            prakto.co
          </a>
        </p>
      </footer>
    </div>
  );
}
