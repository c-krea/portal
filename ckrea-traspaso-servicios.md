# Portal C-Krea — cómo están configurados las tareas programadas, los correos y los archivos

Para: Jonathan (Reymon Sistemas) · De: Esteban · 20-nov-2026

Este documento explica todo lo que hoy corre desde **mi cuenta de Vercel** y desde servicios
externos a mi nombre, para que puedas moverlo a tu nuevo Vercel y repositorio sin cortar nada.
Está escrito para que se lo puedas pasar completo a tu sesión de Claude.

> **Nota para Claude (la sesión de Jonathan):** este portal trabaja sobre una base de datos
> Supabase **en vivo con dinero real de clientes**, compartida con otras apps de Reymon. Antes de
> tocar código, lee `CLAUDE.md` en la raíz del repo y `docs/context.md` (la única página con las
> reglas de dinero vigentes). Nunca escribas en `siesa_raw` (copia de solo lectura del ERP Siesa),
> nunca toques otros esquemas (`cartera`, `rutas`, `satelites`…), y prueba contra la base local de
> Docker (`npm run dev:test`), nunca contra producción. Los nombres de archivo y rutas de este
> documento existen en el repo tal como están escritos.

---

## 1. Resumen en una pantalla

| Pieza | Dónde vive hoy | Qué hace | Qué necesitas tú |
|---|---|---|---|
| 3 tareas programadas (crons) | Mi proyecto Vercel `ckrea-portal`, definidas en `vercel.json` | Sincronizan datos del ERP, guardan la foto de mora del mes, envían notificaciones push | Que tu proyecto tenga `vercel.json` + la variable `CRON_SECRET`. **Y que no corran en los dos proyectos a la vez por mucho tiempo** |
| Correos | **Brevo** (servicio de envío de correos), cuenta a mi nombre | Correo de bienvenida (crear contraseña) y correo de recuperar contraseña | Una cuenta Brevo con el dominio `ckrea.com.co` verificado + `BREVO_API_KEY` |
| Archivos | **Cloudflare R2** (almacenamiento de archivos tipo S3), bucket `ckrea-portal`, cuenta a mi nombre | Fotos del medidor de energía que suben inquilinos y staff; página `/archivos` | Un bucket R2 + 4 variables `R2_*`. Las fotos ya subidas están en mi bucket |
| Notificaciones push | Llaves VAPID guardadas en mi Vercel | Avisos al celular del inquilino (pago por vencer, mora, lectura pendiente…) | **Las mismas llaves VAPID** (si generas otras, se rompen las suscripciones existentes) |
| Dominio `ckrea.com.co` | Conectado a mi proyecto Vercel; DNS en un registrador externo | Dirección pública del portal | Quitarlo de mi proyecto y agregarlo al tuyo el día del cambio |
| Errores (Sentry) y analítica (PostHog) | Sentry org `reymon`, proyecto `ckrea`; PostHog | Reportar errores y uso | Opcional; variables `SENTRY_*` y `NEXT_PUBLIC_POSTHOG_*` |
| Base de datos (Supabase) | El mismo proyecto Supabase compartido de Reymon | Todo el dinero, inquilinos, lecturas | Las mismas 4 variables de Supabase. **No se mueve nada aquí** |

---

## 2. Las tareas programadas (crons)

### 2.1 Cómo funcionan

- Están declaradas en `vercel.json` en la raíz del repo. Vercel las lee al desplegar y las ejecuta
  **solo en el despliegue de producción** (no en previews).
- Cada una es una ruta de la app: Vercel hace un `GET` a esa URL a la hora indicada.
- Protección: cada ruta revisa el encabezado `Authorization: Bearer <CRON_SECRET>`. Vercel manda
  ese encabezado **automáticamente** si la variable de entorno `CRON_SECRET` existe en el proyecto.
  Si falta la variable, las 3 tareas responden **401 sin hacer nada y sin avisar a nadie**.
- El plan Hobby de Vercel solo permite **1 ejecución por día** por cron. Por eso son diarias.
- Las horas en `vercel.json` están en **UTC**. Bogotá = UTC − 5.

```json
{
  "crons": [
    { "path": "/api/cron/accrual",       "schedule": "0 6 * * *"  },
    { "path": "/api/cron/sync-v2",       "schedule": "30 5 * * *" },
    { "path": "/api/cron/notifications", "schedule": "0 8 * * *"  }
  ]
}
```

### 2.2 Las tres, en el orden en que corren

**1) `sync-v2` — 05:30 UTC (00:30 Bogotá)** · `src/app/api/cron/sync-v2/route.ts`
- El ERP Siesa escribe directamente en el esquema `siesa_raw` de Supabase cada ~3 horas (eso no
  depende de Vercel ni de mí; lo maneja el ERP).
- Este cron llama dos funciones de la base de datos:
  - `v2.sync_desde_raw()` → copia/actualiza inquilinos, locales y contratos del esquema `v2` a partir
    de `siesa_raw`.
  - `v2.recalcular_criticos()` → marca como `critico` los contratos con más de 60 días de mora.
- Después borra el caché de la app (`bustAllCaches()`) para que las páginas muestren datos frescos.
- Si no corre: los inquilinos/contratos nuevos del ERP no aparecen en el portal, y el estado
  "crítico" no se actualiza. Los pagos sí siguen visibles (se leen directo de `siesa_raw`).

**2) `accrual` — 06:00 UTC (01:00 Bogotá)** · `src/app/api/cron/accrual/route.ts`
- El nombre es histórico. La parte de "cálculo de intereses" (`runInterestAccrual` en
  `src/lib/interest-engine.ts`) hoy **no hace nada** a propósito: los intereses se calculan al vuelo.
- Lo que sí hace: `upsertMoraSnapshot()` (`src/lib/data/mora.ts`) → guarda/actualiza una fila por
  mes en `v2.mora_snapshots_mensuales` (cuántos clientes en mora y cuánto saldo vencido, sin contar
  jurídicos). Esa foto mensual alimenta el % de mora del Resumen.
- Si no corre: el mes en curso se queda sin su foto de mora y el indicador del Resumen se desvía.
- Correrlo dos veces el mismo día no duplica nada (actualiza la misma fila del mes).

**3) `notifications` — 08:00 UTC (03:00 Bogotá)** · `src/app/api/cron/notifications/route.ts`
- Recorre los inquilinos que activaron notificaciones (`v2.push_subscriptions`) y con contrato
  `activo` o `critico`, y envía push al celular:

| Aviso | Cuándo | Se envía |
|---|---|---|
| Pago próximo a vencer | 3 días antes del vencimiento (fecha factura + 30) | 1 vez por factura |
| Pago vence hoy | El día del vencimiento | 1 vez por factura |
| Pago vencido | Día 31 (`financia = 31` en `siesa_raw.cartera`) | 1 vez por factura |
| Recordatorio de mora | Lunes, si tiene facturas con más de 31 días | 1 vez por semana |
| Contrato por vencer | Faltan 60 o 30 días para `fecha_fin` | 1 vez por umbral |
| Lectura de medidor pendiente | Día 7 del mes, si no hay lectura del periodo | 1 vez por periodo |
| Pago registrado | Pagos con fecha de ayer en `v2.vista_pagos` | 1 vez por pago |

- Para no repetir, antes de enviar inserta una fila en `v2.push_notification_log`
  (`user_id, type, reference_id`). Si la inserción falla (porque ya existe), no envía. La tabla
  tiene el índice único `push_notification_log_user_id_type_reference_id_key` sobre esas 3
  columnas (verificado el 20-nov-2026), así que aunque el cron corra en dos proyectos el mismo día,
  cada aviso sale una sola vez.
- Hoy hay 6 celulares suscritos (6 usuarios). El último aviso enviado fue el 7-nov-2026.
- Usa las llaves VAPID (sección 5). Si faltan, el cron falla con error.

### 2.3 Lo importante para tu migración

- **Dos proyectos = todo corre dos veces.** Mientras tu Vercel nuevo y el mío estén ambos en
  producción con `vercel.json`, los 3 crons corren en los dos contra la misma base de datos.
  Verifiqué que repetirlos no hace daño: los dos primeros actualizan las mismas filas y las
  notificaciones están protegidas por el índice único. Aun así es trabajo doble y confunde al
  revisar logs. Recomendación: el día que actives el tuyo, me avisas y yo apago los míos ese mismo día.
- Si tu proyecto nuevo ya está desplegado en producción con `vercel.json` y `CRON_SECRET`, tus crons
  ya están corriendo hoy en paralelo con los míos. No es urgente (ver punto anterior), pero conviene
  saberlo.
- Copia `CRON_SECRET` a tu proyecto (puedes generar uno nuevo; solo tiene que existir en el proyecto
  que ejecuta los crons). Ejemplo para generarlo: `openssl rand -hex 32`.
- Para probar un cron a mano después de desplegar:
  `curl -H "Authorization: Bearer $CRON_SECRET" https://<tu-dominio>/api/cron/sync-v2`
  (empieza por `sync-v2` o `accrual`; deja `notifications` para el final porque envía avisos reales
  a inquilinos).
- En Vercel: proyecto → Settings → Cron Jobs puedes ver si están activos y sus últimas ejecuciones.

---

## 3. Correos (Brevo)

### 3.1 Cómo funciona

- Código: `src/lib/email/index.ts`. Usa el paquete `@getbrevo/brevo` y la variable `BREVO_API_KEY`.
- Remitente fijo: **`C-Krea Portal <noreply@ckrea.com.co>`**. Para que Brevo deje enviar desde esa
  dirección, el dominio `ckrea.com.co` está verificado en mi cuenta Brevo con registros DNS
  (SPF/DKIM) en el registrador del dominio.
- La plantilla HTML está en el mismo archivo (función `wrap`), con el logo cargado desde
  `https://ckrea.com.co/ckrea-logo.png`.

### 3.2 Los dos correos que existen

| Correo | Quién lo dispara | Archivo |
|---|---|---|
| Bienvenida — "crea tu contraseña" (enlace válido 24 h) | Staff en `/usuarios` al dar acceso a un inquilino o reenviar invitación | `src/app/(app)/usuarios/actions.ts` |
| Restablecer contraseña (enlace válido 1 h) | El usuario en `/forgot-password`, o staff desde `/usuarios` | `src/app/(auth)/forgot-password/actions.ts` |

### 3.3 Detalle que tu Claude debe conocer

- **Supabase no envía estos correos.** La app pide a Supabase un token
  (`supabaseAdmin.auth.admin.generateLink`) y arma su propio enlace hacia el portal:
  `https://ckrea.com.co/auth/confirm?token_hash=...&type=recovery`
  (`src/lib/auth/recovery-link.ts`). Se hace así a propósito: los antivirus de correo "abren" los
  enlaces directos de Supabase y los gastan antes de que el usuario haga clic.
- El dominio del enlace sale de `SITE_URL` (si no existe, `NEXT_PUBLIC_SITE_URL`, si no,
  `https://ckrea.com.co`). Si cambias de dominio, cambia esas dos variables.
- El formulario de recuperar contraseña siempre responde "enviado", exista o no el correo (para no
  revelar qué correos tienen cuenta). Por eso, si Brevo falla, **nadie ve el error**: hay que revisar
  el panel de Brevo (Transactional → Logs).

### 3.4 Qué hacer

- Opción recomendada: creas tu propia cuenta Brevo (gratis hasta 300 correos/día, de sobra), agregas
  el dominio `ckrea.com.co`, pones los registros DNS que Brevo te da, creas una API key y la guardas
  como `BREVO_API_KEY` en tu Vercel (Production).
- Prueba: en tu despliegue, entra a `/forgot-password` con tu propio correo y confirma que llega y
  que el enlace abre la pantalla de nueva contraseña.

---

## 4. Archivos (Cloudflare R2)

### 4.1 Cómo funciona

- R2 es el almacenamiento de archivos de Cloudflare; se usa con el SDK de Amazon S3
  (`@aws-sdk/client-s3`), por eso el código parece de S3.
- Código: `src/lib/r2/client.ts` (conexión), `src/lib/r2/files.ts` (listar, subir, borrar, enlace
  firmado), `src/lib/r2/meter-photos.ts` (subir foto de medidor).
- Variables: `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`
  (= `ckrea-portal`). La URL de conexión se arma sola: `https://<R2_ACCOUNT_ID>.r2.cloudflarestorage.com`.
- El bucket es **privado**. Para ver una foto, la app genera un enlace firmado que vence en 1 hora.

### 4.2 Qué se guarda

| Carpeta en el bucket | Qué es | Quién lo sube |
|---|---|---|
| `medidores/AAAA-MM/local-<unidad>-<timestamp>.jpg` | Foto del contador de energía | El inquilino en `/portal/medidor` o el staff en `/medidores` |
| `facturas/AAAA-MM/local-<id>.pdf` | Patrón previsto para facturas; la página `/archivos` lo reconoce | — |

- La **ruta** de cada foto (no la foto) se guarda en la base de datos, columna
  `v2.lecturas_medidor.foto_url` (ej. `medidores/2026-10/local-101-1730000000000.jpg`).
- Las facturas de energía en PDF **no** se guardan en R2: se generan al momento desde la base de
  datos (`docs/electricity-invoice-process.md`).
- Límite de subida: 10 MB por petición (`next.config.ts` → `serverActions.bodySizeLimit`).

### 4.3 Qué hacer

- Las fotos ya subidas están en mi bucket. Como la base de datos guarda solo la ruta, basta copiar
  los archivos **con las mismas rutas** a tu bucket y todo sigue funcionando.
- Pasos: creas tu bucket R2 (privado) → creas un token de API R2 con permiso de lectura/escritura
  sobre ese bucket → copias los archivos de mi bucket al tuyo (con `rclone` o similar; lo coordinamos,
  yo te doy acceso de lectura temporal) → pones las 4 variables en tu Vercel.
- Si quieres usar otro nombre de bucket, solo cambia `R2_BUCKET_NAME`; las rutas dentro no cambian.
- Prueba: abre `/medidores`, entra a una lectura con foto y confirma que la foto carga; luego sube
  una lectura de prueba en tu entorno local, no en producción.

---

## 5. Notificaciones push (llaves VAPID)

- Código: `src/lib/push.ts` (envío, paquete `web-push`), `src/app/api/push/route.ts` (guardar o
  borrar la suscripción del celular), `public/sw.js` (service worker que muestra el aviso),
  `src/components/notification-toggle.tsx` (botón para activarlas).
- Variables: `VAPID_SUBJECT`, `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY` (hoy solo en
  Production).
- **Importante:** cada celular que activó notificaciones quedó registrado con la llave pública
  actual. Si generas llaves nuevas, todas esas suscripciones dejan de funcionar en silencio y cada
  inquilino tendría que volver a activarlas. **Usa las mismas tres llaves** — te las paso por un
  canal privado (no por WhatsApp en texto).

---

## 6. Variables de entorno — lista completa

Los nombres están en `.env.example`. Los valores te los paso aparte, por un canal privado.

| Variable | Para qué | Entornos en mi Vercel |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL del proyecto Supabase | Prod, Preview, Dev |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Llave pública de Supabase | Prod, Dev |
| `SUPABASE_SERVICE_ROLE_KEY` | Llave de administrador (crear usuarios, enlaces). **Solo servidor, solo esta app** | Prod, Preview, Dev |
| `DATABASE_URL` | Conexión directa a Postgres | Prod |
| `SITE_URL` / `NEXT_PUBLIC_SITE_URL` | Dominio público para los enlaces de correo | Prod, Preview |
| `CRON_SECRET` | Protege los 3 crons | Prod, Preview, Dev |
| `BREVO_API_KEY` | Correos | Prod |
| `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME` | Archivos | Prod, Preview |
| `VAPID_SUBJECT`, `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY` | Push | Prod |
| `SENTRY_DSN`, `NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_AUTH_TOKEN` | Errores (opcional). El token sube los source maps al compilar | Prod |
| `NEXT_PUBLIC_POSTHOG_KEY`, `NEXT_PUBLIC_POSTHOG_HOST` | Analítica (opcional) | Prod, Dev |

`CSF_BASE_URL` / `CSF_API_KEY` y `scripts/sync-csf.ts` son restos de una integración vieja: **no se
usan**, no hace falta configurarlos.

---

## 7. Orden sugerido para el cambio (sin cortar el servicio)

1. **Tu proyecto, sin dominio todavía.** Despliegas en tu Vercel con todas las variables de la
   sección 6. Pruebas en la URL `*.vercel.app` que te da Vercel: login de staff, `/pagos`,
   `/medidores` (que carguen las fotos), `/forgot-password` (que llegue el correo).
   Ojo: mientras no tengas el dominio, los enlaces de correo seguirán apuntando a `ckrea.com.co`
   (mi despliegue) — es normal en esta etapa.
2. **Brevo y R2 listos** en tus cuentas (secciones 3.4 y 4.3), con las fotos ya copiadas.
3. **Día del cambio — lo hacemos juntos, avisándonos:**
   1. Yo quito `ckrea.com.co` de mi proyecto Vercel.
   2. Tú lo agregas a tu proyecto y ajustas el DNS si Vercel te lo pide.
   3. Yo desactivo los crons en mi proyecto (los quito de `vercel.json` o pauso el proyecto).
   4. Tú confirmas en Settings → Cron Jobs que los tuyos están activos.
4. **Día siguiente:** revisas que los 3 crons corrieron (Vercel → Logs, filtrando `/api/cron`), que
   el mes tiene fila en `v2.mora_snapshots_mensuales` y que no llegaron avisos duplicados.
5. **Una semana después**, si todo va bien, apago mi proyecto, borro mis llaves de Brevo y R2 y
   cancelo esos servicios de mi lado.

---

## 8. Verificado en la base de datos (20-nov-2026, solo lectura)

- **No hay tareas programadas de C-Krea dentro de la base de datos.** `pg_cron` está instalado y
  tiene 11 tareas activas, pero todas son de otras apps de Reymon (`portal_asesores`,
  `cost_track`, `reporting`, `ric_systems`, `permisos`, y una que refresca
  `siesa_raw.ventas_resumen`). Ninguna toca el esquema `v2`. Todo lo de C-Krea está en
  `vercel.json`. **No toques esas 11 tareas**: no son del portal C-Krea.
- **Índice único de avisos: existe** (sección 2.2). Los avisos no se duplican.
- **El cron de mora corrió hoy:** la última actualización de `v2.mora_snapshots_mensuales` fue
  20-nov-2026 06:38 UTC.
- Para volver a revisarlo: `select jobname, schedule, command from cron.job;`

Cualquier duda me escribes. Prefiero que me preguntes antes de cambiar algo que toque dinero
(mora, pronto pago, qué cuenta como "pagado"): esas reglas están en `docs/context.md`.
