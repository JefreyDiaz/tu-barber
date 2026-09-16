'use client';

interface ShopNameConfirmModalProps {
  shopName: string;
  slug: string;
  rootDomain: string;
  onConfirm: () => void;
  onEdit: () => void;
}

function nameMayNeedSpaces(name: string): boolean {
  const trimmed = name.trim();
  if (!trimmed || trimmed.includes(' ')) return false;
  return trimmed.length >= 6;
}

export default function ShopNameConfirmModal({
  shopName,
  slug,
  rootDomain,
  onConfirm,
  onEdit,
}: ShopNameConfirmModalProps) {
  const displayName = shopName.trim() || 'Tu barbería';
  const showSpaceWarning = nameMayNeedSpaces(shopName);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 backdrop-blur-sm sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="shop-name-confirm-title"
    >
      <div className="glass-card-strong w-full max-w-md rounded-2xl p-5 shadow-2xl animate-scale-in">
        <h2 id="shop-name-confirm-title" className="text-lg font-bold text-white">
          ¿Así se verá tu barbería?
        </h2>
        <p className="mt-1 text-sm text-white/55">
          Revisa cómo aparecerá el nombre en la página principal de tus clientes.
        </p>

        <div className="relative mt-4 overflow-hidden rounded-xl border border-white/10">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage:
                'linear-gradient(135deg, rgba(41,37,36,0.95) 0%, rgba(28,25,23,0.98) 100%)',
            }}
          />
          <div className="absolute inset-0 bg-black/40" />
          <div className="relative flex min-h-[140px] flex-col items-center justify-center px-4 py-8">
            <h1 className="mx-auto max-w-[280px] text-center text-2xl font-bold tracking-tight text-white drop-shadow-[0_4px_20px_rgba(0,0,0,0.9)] sm:text-3xl">
              {displayName}
            </h1>
            <p className="mt-3 text-[10px] uppercase tracking-wider text-white/35">
              Encabezado de tu sitio
            </p>
          </div>
        </div>

        <div className="mt-4 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-center">
          <p className="text-xs text-white/40">Tu dirección web</p>
          <p className="mt-1 break-all font-mono text-sm text-amber-400/90">
            {slug || 'mi-barberia'}.{rootDomain}
          </p>
        </div>

        {showSpaceWarning && (
          <div className="mt-4 flex gap-3 rounded-xl border border-amber-400/25 bg-amber-400/10 px-4 py-3">
            <span className="shrink-0 text-amber-400/90" aria-hidden>
              ⚠
            </span>
            <p className="text-left text-xs leading-relaxed text-amber-100/90">
              Tu nombre no tiene espacios y se verá <strong>todo junto</strong>. Si quieres separar
              palabras, escribe por ejemplo <strong>Barbería Central</strong> en lugar de{' '}
              <strong>BarberíaCentral</strong>.
            </p>
          </div>
        )}

        <p className="mt-4 text-xs leading-relaxed text-white/45">
          El nombre se guardará exactamente como lo escribiste. Puedes corregirlo ahora o continuar si
          estás seguro.
        </p>

        <div className="mt-5 flex gap-3">
          <button
            type="button"
            onClick={onEdit}
            className="btn-glass flex-1 rounded-2xl py-3 text-sm font-medium"
          >
            Corregir nombre
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="btn-accent flex-1 rounded-2xl py-3 text-sm font-semibold"
          >
            Sí, continuar
          </button>
        </div>
      </div>
    </div>
  );
}
