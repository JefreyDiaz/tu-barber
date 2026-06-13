This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Variables de entorno (Twilio WhatsApp)

Para enviar WhatsApp de confirmación al hacer una reserva, añade en tu `.env`:

- `TWILIO_ACCOUNT_SID` – Account SID de tu cuenta Twilio
- `TWILIO_AUTH_TOKEN` – Auth Token de tu cuenta Twilio
- `TWILIO_PHONE_NUMBER` – Número de Twilio con WhatsApp (sandbox o WhatsApp Business) en E.164 (ej. `+14155238886`)
- `TWILIO_WHATSAPP_BOOKING_TEMPLATE_SID` – SID de la plantilla aprobada en Twilio Content Template Builder (ej. `HX...`)
- `TWILIO_WHATSAPP_BARBER_TEMPLATE_SID` – SID de la plantilla para notificación al barbero (ej. `HX...`)
- `TWILIO_WHATSAPP_REMINDER_TEMPLATE_SID` – SID de la plantilla de **recordatorio** (~3 h antes de la cita). Variables en orden: `1` nombre cliente, `2` nombre barbero, `3` hora (Colombia), `4` teléfono barbero o “No disponible”, `5` URL cancelar.
- `CRON_SECRET` – cadena aleatoria larga; protege `GET /api/cron/reminders` (el cron externo debe enviar `Authorization: Bearer <CRON_SECRET>`).
- `NEXT_PUBLIC_APP_URL` – URL pública de la app en producción (ej. `https://tu-app.vercel.app`), para enlaces de cancelación en WhatsApp.

Si no están definidas, la reserva se guarda igual pero no se envía WhatsApp. En consola Twilio: Messaging → Try it out → Send a WhatsApp message para usar el sandbox o configurar tu número Business.

### Recordatorios (cron externo, plan Vercel Hobby)

El plan Hobby de Vercel no permite cron cada 15 min. Un servicio externo llama a tu API.

1. **Base de datos:** `npx prisma db push` o `npx prisma migrate deploy` (columna `reminderSentAt` en `Booking`).
2. **Vercel → Settings → Environment Variables:** `CRON_SECRET`, Twilio, `NEXT_PUBLIC_APP_URL`, `DATABASE_URL`, etc. Redeploy.
3. **cron-job.org** (gratis):
   - Cuenta en [cron-job.org](https://console.cron-job.org) → **Cronjobs** → **Create cronjob**.
   - **Title:** `BarberApp recordatorios`
   - **URL:** `https://TU-DOMINIO.vercel.app/api/cron/reminders` (sustituye por tu dominio real).
   - **Schedule:** cada **15** minutos (o el mínimo que permita el plan gratis).
   - **Request method:** GET
   - **Headers:** `Authorization` = `Bearer TU_CRON_SECRET` (mismo valor que en Vercel, con la palabra `Bearer` y un espacio).
   - Activa el job y usa **Run now** para probar.
4. Respuesta OK: `{"ok":true,"scanned":0,"sent":0,"failed":0}` (los números varían).

Prueba local: `curl -H "Authorization: Bearer TU_CRON_SECRET" http://localhost:3000/api/cron/reminders`

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
