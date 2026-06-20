'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import PlanCard from '@/components/platform/PlanCard';
import { PLAN_LIST, TRIAL_DAYS, type PlanId, isValidPlanId } from '@/lib/plans';

const STEPS = ['Plan', 'Barbería', 'Cuenta'] as const;

function RegistroWizardInner() {
  const searchParams = useSearchParams();
  const initialPlan = searchParams.get('plan');
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [plan, setPlan] = useState<PlanId>(
    initialPlan && isValidPlanId(initialPlan) ? initialPlan : 'negocio'
  );
  const [form, setForm] = useState({
    shopName: '',
    slug: '',
    ownerName: '',
    ownerEmail: '',
    ownerPhone: '',
    username: '',
    password: '',
  });

  useEffect(() => {
    if (initialPlan && isValidPlanId(initialPlan)) {
      setPlan(initialPlan);
    }
  }, [initialPlan]);

  function slugify(name: string) {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 30);
  }

  async function handleSubmit() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, plan }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? 'Error al registrar');
        setLoading(false);
        return;
      }
      setSuccess(true);
    } catch {
      setError('Error de conexión');
      setLoading(false);
    }
  }

  if (success) {
    const successPlan = PLAN_LIST.find((p) => p.id === plan)!;
    return (
      <div className="platform-bg flex min-h-screen min-h-[100dvh] items-center justify-center px-4">
        <div className="glass-card-strong w-full max-w-md p-8 text-center animate-scale-in">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-400/20 text-3xl">
            ✓
          </div>
          <h1 className="mt-4 text-2xl font-bold">¡Solicitud enviada!</h1>
          <p className="mt-3 text-sm leading-relaxed text-white/60">
            Revisaremos tu barbería y te activaremos con{' '}
            <strong className="text-amber-400">{TRIAL_DAYS} días de prueba gratis con plan {successPlan.name}</strong>.
            Te avisaremos por WhatsApp.
          </p>
          <Link href="/" className="btn-glass mt-6 inline-block rounded-2xl px-6 py-3 text-sm font-medium">
            Volver al inicio
          </Link>
        </div>
      </div>
    );
  }

  const selectedPlanDef = PLAN_LIST.find((p) => p.id === plan)!;

  return (
    <div className="platform-bg min-h-screen min-h-[100dvh] text-white">
      <header className="border-b border-white/5 bg-stone-950/60 backdrop-blur-xl">
        <div className="mx-auto flex max-w-lg items-center justify-between px-4 py-3">
          <Link href="/" className="text-sm text-white/50 hover:text-white/80">
            ← Inicio
          </Link>
          <span className="text-sm font-medium text-white/70">
            Paso {step + 1} de {STEPS.length}
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-lg px-4 py-6 pb-24">
        {/* Progress */}
        <div className="mb-8 flex gap-2">
          {STEPS.map((label, i) => (
            <div key={label} className="flex-1">
              <div
                className={`h-1 rounded-full transition-colors ${
                  i <= step ? 'bg-gradient-to-r from-amber-400 to-orange-500' : 'bg-white/10'
                }`}
              />
              <p className={`mt-1.5 text-center text-[10px] uppercase tracking-wider ${i <= step ? 'text-amber-400/80' : 'text-white/30'}`}>
                {label}
              </p>
            </div>
          ))}
        </div>

        {error && (
          <div className="mb-4 rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        {/* Step 0: Plan */}
        {step === 0 && (
          <div className="animate-fade-in space-y-4">
            <div className="text-center">
              <h1 className="text-2xl font-bold">Elige tu plan</h1>
              <p className="mt-2 text-sm text-white/50">
                Todos los planes incluyen {TRIAL_DAYS} días gratis al activarte · sin tarjeta
              </p>
            </div>
            <div className="space-y-3">
              {PLAN_LIST.map((p) => (
                <PlanCard
                  key={p.id}
                  plan={p}
                  selected={plan === p.id}
                  onSelect={setPlan}
                  compact
                />
              ))}
            </div>
            <ul className="glass-card mt-4 space-y-2 p-4">
              {selectedPlanDef.features.slice(0, 4).map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm text-white/70">
                  <span className="text-amber-400">✓</span> {f}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Step 1: Barbería */}
        {step === 1 && (
          <div className="animate-fade-in space-y-4">
            <div className="text-center">
              <h1 className="text-2xl font-bold">Tu barbería</h1>
              <p className="mt-2 text-sm text-white/50">Así te verán tus clientes</p>
            </div>
            <WizardField
              label="Nombre de la barbería"
              value={form.shopName}
              onChange={(v) => {
                setForm((f) => ({
                  ...f,
                  shopName: v,
                  slug: f.slug || slugify(v),
                }));
              }}
              required
              placeholder="Ej. Luxe Cuts"
            />
            <WizardField
              label="Subdominio"
              value={form.slug}
              onChange={(v) => setForm((f) => ({ ...f, slug: slugify(v) }))}
              required
              placeholder="luxe-cuts"
              hint={
                form.slug
                  ? `${form.slug}.tubarber.com`
                  : 'Solo minúsculas, números y guiones'
              }
            />
            <div className="glass-card p-4 text-center">
              <p className="text-xs text-white/40">Vista previa URL</p>
              <p className="mt-1 font-mono text-sm text-amber-400/90">
                {form.slug || 'mi-barberia'}.tubarber.com
              </p>
            </div>
          </div>
        )}

        {/* Step 2: Cuenta */}
        {step === 2 && (
          <div className="animate-fade-in space-y-4">
            <div className="text-center">
              <h1 className="text-2xl font-bold">Tu cuenta</h1>
              <p className="mt-2 text-sm text-white/50">Datos del dueño y acceso al panel</p>
            </div>
            <WizardField
              label="Tu nombre"
              value={form.ownerName}
              onChange={(v) => setForm((f) => ({ ...f, ownerName: v }))}
              required
            />
            <WizardField
              label="Email"
              type="email"
              value={form.ownerEmail}
              onChange={(v) => setForm((f) => ({ ...f, ownerEmail: v }))}
              required
            />
            <WizardField
              label="Teléfono WhatsApp"
              value={form.ownerPhone}
              onChange={(v) => setForm((f) => ({ ...f, ownerPhone: v.replace(/\D/g, '').slice(0, 10) }))}
              required
              placeholder="3001234567"
              hint="10 dígitos sin +57"
            />
            <hr className="border-white/10" />
            <WizardField
              label="Usuario de acceso"
              value={form.username}
              onChange={(v) => setForm((f) => ({ ...f, username: v }))}
              required
            />
            <WizardField
              label="Contraseña"
              type="password"
              value={form.password}
              onChange={(v) => setForm((f) => ({ ...f, password: v }))}
              required
              hint="Mínimo 8 caracteres"
            />

            <div className="glass-card p-4 text-sm text-white/60">
              <p>
                Plan seleccionado:{' '}
                <strong className="text-white">{selectedPlanDef.name}</strong> ({selectedPlanDef.priceLabel}/mes)
              </p>
              <p className="mt-1 text-amber-400/90">
                + {TRIAL_DAYS} días de prueba gratis al activarte
              </p>
            </div>
          </div>
        )}
      </main>

      {/* Bottom nav */}
      <div className="fixed inset-x-0 bottom-0 border-t border-white/5 bg-stone-950/80 p-4 backdrop-blur-xl">
        <div className="mx-auto flex max-w-lg gap-3">
          {step > 0 && (
            <button
              type="button"
              onClick={() => setStep((s) => s - 1)}
              className="btn-glass flex-1 rounded-2xl py-3.5 text-sm font-medium"
            >
              Atrás
            </button>
          )}
          {step < STEPS.length - 1 ? (
            <button
              type="button"
              onClick={() => setStep((s) => s + 1)}
              disabled={step === 1 && (!form.shopName || !form.slug)}
              className="btn-accent flex-[2] rounded-2xl py-3.5 text-sm font-semibold disabled:opacity-40"
            >
              Continuar
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading || !form.ownerName || !form.ownerEmail || !form.ownerPhone || !form.username || form.password.length < 8}
              className="btn-accent flex-[2] rounded-2xl py-3.5 text-sm font-semibold disabled:opacity-40"
            >
              {loading ? 'Enviando...' : 'Enviar solicitud'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function WizardField({
  label,
  value,
  onChange,
  type = 'text',
  required,
  placeholder,
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
  placeholder?: string;
  hint?: string;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-white/80">{label}</label>
      <input
        type={type}
        required={required}
        value={value}
        placeholder={placeholder}
        minLength={type === 'password' ? 8 : undefined}
        onChange={(e) => onChange(e.target.value)}
        className="glass-input w-full px-4 py-3 text-sm"
      />
      {hint && <p className="mt-1.5 text-xs text-white/40">{hint}</p>}
    </div>
  );
}

export default function RegistroWizard() {
  return (
    <Suspense
      fallback={
        <div className="platform-bg flex min-h-screen items-center justify-center text-white/50">
          Cargando...
        </div>
      }
    >
      <RegistroWizardInner />
    </Suspense>
  );
}
