import Link from 'next/link';
import type { ReactNode } from 'react';
import { PLAN_LIST, TRIAL_DAYS } from '@/lib/plans';
import PlanCard from '@/components/platform/PlanCard';
import FaqAccordion from '@/components/platform/FaqAccordion';
import PlatformLogo from '@/components/PlatformLogo';

function FeatureIconBox({ children }: { readonly children: ReactNode }) {
  return (
    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-400/10 text-amber-400 ring-1 ring-amber-400/20">
      {children}
    </div>
  );
}

function CalendarIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor" className="h-5 w-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
    </svg>
  );
}

function MessageIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor" className="h-5 w-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
    </svg>
  );
}

function TeamIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor" className="h-5 w-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
    </svg>
  );
}

const FEATURES = [
  {
    icon: (
      <FeatureIconBox>
        <CalendarIcon />
      </FeatureIconBox>
    ),
    title: 'Reservas 24/7',
    desc: 'Tus clientes agendan desde el celular, a cualquier hora.',
  },
  {
    icon: (
      <FeatureIconBox>
        <MessageIcon />
      </FeatureIconBox>
    ),
    title: 'WhatsApp automático',
    desc: 'Confirmaciones y recordatorios sin escribir a mano.',
  },
  {
    icon: (
      <FeatureIconBox>
        <TeamIcon />
      </FeatureIconBox>
    ),
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
                <div className="shrink-0">{f.icon}</div>
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
          <FaqAccordion items={FAQ} />
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
