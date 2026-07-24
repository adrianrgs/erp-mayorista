# Despliegue — Todo en Firebase (un solo dominio, sin CORS)

Objetivo: dejar de usar Vercel y tener **todo en Firebase**, bajo un mismo dominio
(`margariteno.com`), sin problemas de CORS.

## Arquitectura

```
Usuario ─► margariteno.com  (Firebase Hosting)
             ├── /            → app React (build de Vite en dist/)
             └── /api/**      → (rewrite) → Cloud Run "foratour-api" → Data Connect → Cloud SQL
```

- **Frontend:** Firebase Hosting (estático). El dominio `margariteno.com` se apunta aquí.
- **Backend:** Cloud Run (servicio `foratour-api`, `us-central1`). Es parte del ecosistema
  Google/Firebase, en el mismo proyecto `foratour-erp-2026`. (Es lo que App Hosting usa por
  debajo; lo usamos directo para poder poner el rewrite y así NO tener CORS.)
- El frontend llama a **`/api`** (ruta relativa, mismo dominio) → sin CORS, y el dominio se
  puede cambiar a futuro sin recompilar nada.

## Ya está preparado en el repo

- `apps/api/Dockerfile` + `.dockerignore` — para construir el backend en Cloud Run.
- `apps/api/src/main.ts` — escucha en `0.0.0.0` con el `PORT` del entorno.
- `apps/api/package.json` — `start` = `node dist/main`.
- `firebase.json` — rewrite `/api/**` → Cloud Run `foratour-api`.
- `.env.production` — `VITE_API_URL=/api` (el frontend llama al mismo dominio).
- `apps/api/.env.example` — saneado (ya no tiene secretos reales).

---

## Paso 1 — Crear los secretos (Secret Manager)

Requiere `gcloud` (Google Cloud CLI) autenticado en el proyecto `foratour-erp-2026`.

```bash
# JWT nuevo y fuerte (NO reutilices el viejo 'Expelliarmus0125'):
openssl rand -base64 48 | gcloud secrets create jwt-secret --data-file=-

# Clave del admin sembrado (simbólica: ya tienes usuarios, no se re-siembra):
printf 'ELIGE_UNA_CLAVE' | gcloud secrets create seed-admin-password --data-file=-
```

## Paso 2 — Desplegar el backend en Cloud Run

```bash
gcloud run deploy foratour-api \
  --source apps/api \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars FIREBASE_PROJECT_ID=foratour-erp-2026,DATA_CONNECT_LOCATION=us-central1,DATA_CONNECT_SERVICE_ID=foratour-erp,DATA_CONNECT_CONNECTOR_ID=foratour-erp-connector,JWT_EXPIRES_IN=8h \
  --set-secrets JWT_SECRET=jwt-secret:latest,SEED_ADMIN_PASSWORD=seed-admin-password:latest
```

Notas:
- `--allow-unauthenticated` es correcto: la app tiene su propia seguridad por JWT; el acceso
  de red público es normal. No se define `CORS_ORIGIN` porque, al ir todo por el mismo dominio
  (rewrite), el navegador nunca hace CORS.
- El nombre `foratour-api` y la región `us-central1` deben coincidir con lo que puse en
  `firebase.json`.

## Paso 3 — Dar permiso al backend para leer Data Connect

El servicio de Cloud Run corre con una service account (por defecto la de Compute). Dale el rol:

```bash
# Averigua la service account del servicio (o usa la de Compute por defecto):
PROJECT_NUMBER=$(gcloud projects describe foratour-erp-2026 --format='value(projectNumber)')
gcloud projects add-iam-policy-binding foratour-erp-2026 \
  --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
  --role="roles/firebasedataconnect.admin"
```

Sin esto, el login daría **500** (no puede leer la tabla de usuarios).

## Paso 4 — Desplegar el frontend en Firebase Hosting

```bash
npx vite build
firebase deploy --only hosting
```

Esto sube `dist/` a Firebase Hosting con el rewrite ya configurado. Quedará en
`https://foratour-erp-2026.web.app` (y en tu dominio, siguiente paso).

## Paso 5 — Apuntar el dominio margariteno.com a Firebase Hosting

En **Firebase Console → Hosting → Agregar dominio personalizado** → `www.margariteno.com`
(y opcionalmente `margariteno.com`). Firebase te da unos registros DNS (A / TXT) para poner
en tu proveedor de dominio. Al verificarse, tu app queda en `https://www.margariteno.com`.

> Antes tenías ese dominio apuntando a Vercel. Hay que cambiar esos registros DNS a los que
> te da Firebase. Cuando propague, Vercel queda fuera del circuito.

## Cambiar de dominio en el futuro
Trivial: como el frontend usa `/api` (relativo), **nada depende del dominio**. Solo agregas el
nuevo dominio en Firebase Hosting y cambias el DNS. No se recompila ni se reconfigura nada.

---

## Verificación final
1. Abre `https://www.margariteno.com` → DevTools → Network → login.
2. La petición debe ir a `https://www.margariteno.com/api/auth/login` (mismo dominio, sin CORS).
3. **200** → entra. **500** → falta el rol del Paso 3. **401** → ahí sí sería credencial real.

## Seguridad — pendientes
- El `JWT_SECRET` viejo (`Expelliarmus0125`) estuvo en git (en `.env.example`, ya saneado). Su
  valor sigue en el historial → **usa uno nuevo** (Paso 1), no lo reutilices.
- `service-account.json`: verificado que **nunca estuvo en git**. No requiere acción. En Cloud
  Run no se usa (ADC).
