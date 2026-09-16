'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import PlanCard from '@/components/platform/PlanCard';
import ShopNameConfirmModal from '@/components/platform/ShopNameConfirmModal';
import PlatformLogo from '@/components/PlatformLogo';
import PasswordInput from '@/components/PasswordInput';
import { useVisualViewportInset } from '@/lib/hooks/use-visual-viewport-inset';
import { PLAN_LIST, TRIAL_DAYS, type PlanId, isValidPlanId } from '@/lib/plans';
import { sanitizeUsernameInput } from '@/lib/validations/username';
import { getOnboardingFieldErrors, type OnboardingData } from '@/lib/validations/tenant';

const STEPS = ['Plan', 'Barbería', 'Cuenta'] as const;
const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? 'tubarber.co';

function isSlugValid(slug: string): boolean {
  return slug.length >= 3 && /^[a-z0-9-]+$/.test(slug);
}

type AccountField = 'ownerName' | 'ownerEmail' | 'ownerPhone' | 'username' | 'password';

const ACCOUNT_FIELDS: AccountField[] = [
  'ownerName',
  'ownerEmail',
  'ownerPhone',
  'username',
  'password',
];

function RegistroWizardInner() {
  const searchParams = useSearchParams();
  const keyboardInset = useVisualViewportInset();
  const initialPlan = searchParams.get('plan');
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showShopNameConfirm, setShowShopNameConfirm] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<keyof OnboardingData, string>>
  >({});

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

  function clearFieldError(field: keyof OnboardingData) {
    setFieldErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }

  function validateForm(): boolean {
    const errors = getOnboardingFieldErrors({ ...form, plan });
    setFieldErrors(errors);

    const firstInvalid = ACCOUNT_FIELDS.find((field) => errors[field]);
    if (firstInvalid) {
      requestAnimationFrame(() => {
        document.getElementById(`field-${firstInvalid}`)?.scrollIntoView({
          block: 'center',
          behavior: 'smooth',
        });
      });
      return false;
    }

    return true;
  }

  function handleSubmitClick() {
    setError(null);
    if (!validateForm()) return;
    void handleSubmit();
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
          <PlatformLogo size="sm" href="/" />
          <span className="text-sm font-medium text-white/70">
            Paso {step + 1} de {STEPS.length}
          </span>
        </div>
      </header>

      <main
        className="mx-auto max-w-lg px-4 py-6"
        style={{ paddingBottom: `${96 + keyboardInset}px` }}
      >
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
                  slug: slugify(v),
                }));
              }}
              required
              placeholder="Ej. Luxe Cuts"
              hint="Usa espacios si quieres separar palabras (ej. Barbería Central). Así se verá en tu página."
            />
            <div className="glass-card p-4 text-center">
              <p className="text-xs text-white/40">Vista previa URL</p>
              <p className="mt-1 break-all font-mono text-sm text-amber-400/90">
                {form.slug || 'mi-barberia'}.{ROOT_DOMAIN}
              </p>
              {form.shopName.trim() && form.slug.length > 0 && form.slug.length < 3 && (
                <p className="mt-2 text-xs text-amber-400/80">
                  El nombre debe generar al menos 3 caracteres en la URL
                </p>
              )}
            </div>
            {selectedPlanDef.limits.customDomain && (
              <div className="flex gap-3 rounded-2xl border border-amber-400/15 bg-amber-400/5 px-4 py-3">
                <span className="shrink-0 text-amber-400/90" aria-hidden>
                  ℹ
                </span>
                <p className="text-left text-xs leading-relaxed text-white/55">
                  Esta es tu URL con subdominio de TuBarber. Tu{' '}
                  <span className="text-white/75">dominio personalizado</span> (ej. mibarberia.com) lo
                  podrás configurar después de activar tu cuenta, desde el panel de administración.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Step 2: Cuenta */}
        {step === 2 && (
          <div className="animate-fade-in space-y-4">
            <div className="text-center">
              <h1 className="text-2xl font-bold">Tu cuenta</h1>
              <p className="mt-2 text-sm text-white/50">Datos del dueño y acceso al panel</p>
            </div>
            {Object.keys(fieldErrors).some((key) =>
              ACCOUNT_FIELDS.includes(key as AccountField)
            ) && (
              <div className="rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                Revisa los campos marcados antes de enviar.
              </div>
            )}
            <WizardField
              id="field-ownerName"
              label="Tu nombre"
              value={form.ownerName}
              onChange={(v) => {
                clearFieldError('ownerName');
                setForm((f) => ({ ...f, ownerName: v }));
              }}
              required
              error={fieldErrors.ownerName}
            />
            <WizardField
              id="field-ownerEmail"
              label="Email"
              type="email"
              value={form.ownerEmail}
              onChange={(v) => {
                clearFieldError('ownerEmail');
                setForm((f) => ({ ...f, ownerEmail: v }));
              }}
              required
              error={fieldErrors.ownerEmail}
            />
            <WizardField
              id="field-ownerPhone"
              label="Teléfono WhatsApp"
              value={form.ownerPhone}
              onChange={(v) => {
                clearFieldError('ownerPhone');
                setForm((f) => ({ ...f, ownerPhone: v.replace(/\D/g, '').slice(0, 10) }));
              }}
              required
              placeholder="3001234567"
              hint="10 dígitos sin +57"
              error={fieldErrors.ownerPhone}
            />
            <hr className="border-white/10" />
            <WizardField
              id="field-username"
              label="Usuario de acceso"
              value={form.username}
              onChange={(v) => {
                clearFieldError('username');
                setForm((f) => ({ ...f, username: sanitizeUsernameInput(v) }));
              }}
              required
              placeholder="mi_usuario"
              hint="Letras, números, guión (-) y guión bajo (_). Sin espacios."
              error={fieldErrors.username}
            />
            <WizardField
              id="field-password"
              label="Contraseña"
              type="password"
              value={form.password}
              onChange={(v) => {
                clearFieldError('password');
                setForm((f) => ({ ...f, password: v }));
              }}
              required
              hint="Mínimo 8 caracteres"
              error={fieldErrors.password}
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

      {/* Bottom nav — lifts above mobile keyboard */}
      <div
        className="fixed inset-x-0 z-40 border-t border-white/5 bg-stone-950/80 p-4 backdrop-blur-xl transition-[bottom] duration-150"
        style={{
          bottom: keyboardInset,
          paddingBottom: keyboardInset > 0 ? '1rem' : 'max(1rem, env(safe-area-inset-bottom))',
        }}
      >
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
              onClick={() => {
                if (step === 1) {
                  setShowShopNameConfirm(true);
                  return;
                }
                setStep((s) => s + 1);
              }}
              disabled={step === 1 && (!form.shopName.trim() || !isSlugValid(form.slug))}
              className="btn-accent flex-[2] rounded-2xl py-3.5 text-sm font-semibold disabled:opacity-40"
            >
              Continuar
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmitClick}
              disabled={loading}
              className="btn-accent flex-[2] rounded-2xl py-3.5 text-sm font-semibold disabled:opacity-40"
            >
              {loading ? 'Enviando...' : 'Enviar solicitud'}
            </button>
          )}
        </div>
      </div>

      {showShopNameConfirm && (
        <ShopNameConfirmModal
          shopName={form.shopName}
          slug={form.slug}
          rootDomain={ROOT_DOMAIN}
          onEdit={() => setShowShopNameConfirm(false)}
          onConfirm={() => {
            setShowShopNameConfirm(false);
            setStep(2);
          }}
        />
      )}
    </div>
  );
}

function WizardField({
  id,
  label,
  value,
  onChange,
  type = 'text',
  required,
  placeholder,
  hint,
  error,
}: {
  id?: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
  placeholder?: string;
  hint?: string;
  error?: string;
}) {
  const scrollOnFocus = (target: HTMLElement) => {
    requestAnimationFrame(() => {
      target.scrollIntoView({ block: 'center', behavior: 'smooth' });
    });
  };

  const inputClassName = `glass-input w-full px-4 py-3 text-sm ${
    error ? 'border-red-400/50 ring-1 ring-red-400/30' : ''
  }`;

  return (
    <div id={id}>
      <label className="mb-1.5 block text-sm font-medium text-white/80">{label}</label>
      {type === 'password' ? (
        <PasswordInput
          required={required}
          value={value}
          placeholder={placeholder}
          minLength={8}
          autoComplete="new-password"
          onChange={(e) => onChange(e.target.value)}
          onFocus={(e) => scrollOnFocus(e.currentTarget)}
          className={`${inputClassName} pr-11`}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
        />
      ) : (
        <input
          type={type}
          required={required}
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          onFocus={(e) => scrollOnFocus(e.currentTarget)}
          className={inputClassName}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
        />
      )}
      {error ? (
        <p id={id ? `${id}-error` : undefined} className="mt-1.5 text-xs text-red-300">
          {error}
        </p>
      ) : (
        hint && <p className="mt-1.5 text-xs text-white/40">{hint}</p>
      )}
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
