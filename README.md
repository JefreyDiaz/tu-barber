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

### Twilio WhatsApp (solo clientes)

- `TWILIO_ACCOUNT_SID` — Account SID (Twilio Console)
- `TWILIO_AUTH_TOKEN` — Auth Token
- `TWILIO_WHATSAPP_FROM` — Número emisor (ej. `+14155238886`)
- `TWILIO_CONTENT_SID_BOOKING` — confirmación cliente (`tubarber_booking_confirm_v1`, `HX808125…`)
- `TWILIO_CONTENT_SID_REMINDER` — Content Template SID recordatorio
- `TWILIO_CONTENT_SID_REENGAGEMENT` — mensaje mensual “vuelve a la barbería” (`tubarber_customer_reengagement_v1`)

Avisos al barbero, bienvenida y renovación van por **email (Resend)** al correo del dueño (`ownerEmail` del registro).

Templates usan variables `{{1}}`, `{{2}}`, … Ver `.cursor/rules/twilio-messaging.mdc`.

### Cron jobs (externo — plan Hobby de Vercel no incluye crons)

Genera un secreto (`CRON_SECRET`) y configúralo en Vercel **y** en cron-job.org.

**Windows / sin OpenSSL (Node.js):**

```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

**PowerShell alternativo:**

```powershell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```

Todos los endpoints son `GET` con header:

```
Authorization: Bearer <CRON_SECRET>
```

#### Crear los jobs en [cron-job.org](https://cron-job.org) (gratis)

1. Regístrate en [console.cron-job.org/signup](https://console.cron-job.org/signup).
2. Menú **Cronjobs** → **Create cronjob**.
3. Repite para **cada** job de la tabla (son 3 jobs separados).

**Campos comunes en cada job:**

| Campo | Valor |
|-------|--------|
| **Title** | Nombre descriptivo (ej. `TuBarber — recordatorios citas`) |
| **URL** | `https://app.tubarber.com/api/cron/...` (tu dominio de producción) |
| **Schedule** | Ver tabla abajo |
| **Request method** | `GET` (pestaña *Advanced*) |
| **Request headers** | `Authorization` = `Bearer TU_CRON_SECRET` (pestaña *Advanced*) |
| **Timezone** | `America/Bogota` cuando aplique |

4. Guarda y activa el job (**Enabled**).

**Los 3 jobs:**

| # | Title sugerido | URL completa | Schedule en cron-job.org |
|---|----------------|--------------|--------------------------|
| 1 | TuBarber — recordatorios citas | `https://app.tubarber.com/api/cron/reminders` | **Every 15 minutes** |
| 2 | TuBarber — suscripción por vencer | `https://app.tubarber.com/api/cron/subscription-reminders` | **Every day at 09:00** · timezone **America/Bogota** |
| 3 | TuBarber — mensaje mensual clientes | `https://app.tubarber.com/api/cron/customer-reengagement` | **Every month on day 15 at 09:00** · timezone **America/Bogota** |

El job **3** solo se ejecuta **12 veces al año** (día 15 de cada mes a las 9 AM). Si alguien llama la URL otro día, el servidor responde al instante `{ skippedReason: "not_day_15" }` sin consultar la base de datos.

**Probar manualmente (PowerShell):**

```powershell
$secret = "TU_CRON_SECRET"
Invoke-WebRequest -Uri "https://app.tubarber.com/api/cron/customer-reengagement" -Headers @{ Authorization = "Bearer $secret" }
```

Fuera del día 15 deberías ver `"skippedReason":"not_day_15"`. El día 15 a las 9 AM verás `"sent": N` con los WhatsApp enviados.

### Suscripción manual (sin pasarela)

- `SUBSCRIPTION_PAYMENT_PHONES` — números para transferencia, separados por coma (ej. `311 240 5194, 300 123 4567`). Se incluyen en el email de renovación al dueño.

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
4. Configurar los 3 cron jobs en [cron-job.org](https://cron-job.org) (ver sección **Cron jobs** arriba)

## Arquitectura

- Multitenant: shared DB + `tenantId`
- Subdominios: `{slug}.tubarber.com`
- Plan Pro: dominio personalizado via `PATCH /api/platform/tenants/[id]` PUT
- Mensajería: Twilio WhatsApp (Content API)
