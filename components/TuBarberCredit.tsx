type TuBarberCreditProps = {
  readonly className?: string;
  readonly fixed?: boolean;
};

/** Subtle footer credit for tenant public pages. */
export default function TuBarberCredit({ className = '', fixed = false }: TuBarberCreditProps) {
  return (
    <p
      className={[
        'text-center text-[10px] tracking-wide text-white/25 sm:text-[11px]',
        fixed
          ? 'pointer-events-auto absolute inset-x-0 bottom-0 z-30 pb-[max(0.5rem,env(safe-area-inset-bottom))]'
          : 'mt-8 pb-2',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      Create By{' '}
      <a
        href="https://tubarber.co"
        target="_blank"
        rel="noopener noreferrer"
        className="text-white/35 transition-colors hover:text-white/50"
      >
        TuBarber.co
      </a>
    </p>
  );
}
