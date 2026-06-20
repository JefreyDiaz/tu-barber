# TuBarber — Plataforma SaaS Multitenant

## Setup inicial (Supabase)

1. Crear proyecto en Supabase y copiar URLs a `.env`:
   - `DATABASE_URL` — Connection pooling (puerto 6543, Transaction mode)
   - `DIRECT_URL` — Direct connection (puerto 5432)
   - `AUTH_SECRET` — `openssl rand -base64 32`

2. Aplicar schema:
   ```bash
   npx prisma migrate deploy
   npx prisma generate
   ```

3. Migrar datos existentes (si aplica):
   ```bash
   npx tsx scripts/migrate-to-multitenant.ts
   ```

4. Crear super-admin de plataforma:
   ```bash
   npx tsx scripts/seed-super-admin.ts
   ```

## Variables de entorno

Ver [`.env.example`](.env.example).

### Twilio WhatsApp

- `TWILIO_ACCOUNT_SID` — Account SID (Twilio Console)
- `TWILIO_AUTH_TOKEN` — Auth Token
- `TWILIO_WHATSAPP_FROM` — Número emisor (ej. `+14155238886`)
- `TWILIO_CONTENT_SID_BOOKING` — Content Template SID confirmación cliente
- `TWILIO_CONTENT_SID_BARBER` — Content Template SID aviso barbero
- `TWILIO_CONTENT_SID_REMINDER` — Content Template SID recordatorio
- `TWILIO_CONTENT_SID_WELCOME` — Content Template SID bienvenida dueño (opcional)

Templates usan variables `{{1}}`, `{{2}}`, … Ver `.cursor/rules/twilio-messaging.mdc`.

### Cron recordatorios

- `CRON_SECRET` — protege `GET /api/cron/reminders`
- Llamar cada 15 min con `Authorization: Bearer <CRON_SECRET>`

## Desarrollo local

```bash
npm run dev
```

- `http://localhost:3000` — landing plataforma
- `http://localhost:3000?tenant=the-barber-house` — tenant dev (usa `DEFAULT_TENANT_SLUG`)
- `/platform/login` — super-admin
- `/registro` — onboarding barberías

## Producción (Vercel)

1. Agregar dominio raíz: `tubarber.com`
2. Agregar wildcard: `*.tubarber.com`
3. Variables de entorno en Vercel (DATABASE_URL, DIRECT_URL, TWILIO_*, CRON_SECRET, NEXT_PUBLIC_ROOT_DOMAIN=tubarber.com)
4. Cron externo (cron-job.org) → `/api/cron/reminders`

## Arquitectura

- Multitenant: shared DB + `tenantId`
- Subdominios: `{slug}.tubarber.com`
- Plan Pro: dominio personalizado via `PATCH /api/platform/tenants/[id]` PUT
- Mensajería: Twilio WhatsApp (Content API)
