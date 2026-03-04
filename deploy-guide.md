# Deployment Guide — KoldHome PWA on Vercel

Esta guía detalla los pasos exactos para que **Yamil** despliegue la versión final del MVP de KoldHome en Producción utilizando Vercel.

## ⚠️ Pre-requisitos

- Acceso al repositorio privado en GitHub donde vive la PWA.
- Acceso al dashboard de **Stripe** de producción.
- Acceso a **Odoo** en el entorno de producción.

---

### Paso 1: Crear y sincronizar Vercel

1. Ingresa a [Vercel.com](https://vercel.com) e inicia sesión con tu cuenta de GitHub.
2. Haz clic en el botón **"Add New..." > "Project"**.
3. Selecciona el repositorio de GitHub de `koldhome-pwa`.
4. Vercel detectará automáticamente que es un proyecto **Next.js**.

### Paso 2: Configurar las Variables de Entorno

Antes de hacer clic en _Deploy_, debes abrir la sección **Environment Variables**.
Pega _una por una_ (o todas de golpe si usas la interfaz Raw) copiando la plantilla del archivo `.env.production.example`.

Asegúrate de conseguir los siguientes valores vitales:

- **`ODOO_URL`, `ODOO_DB`, `ODOO_SERVICE_USER`, `ODOO_SERVICE_PASSWORD`**: Los de Producción Real.
- **`STRIPE_SECRET_KEY` y `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`**: Las llaves _Live_ o _Test_ (dependiendo de la fase).
- **`JWT_SECRET`**: Genera un string largo al azar de buena seguridad.
- **`NEXT_PUBLIC_APP_URL`**: Dejar en blanco o colocar temporalmente la URL autogenerada de Vercel. Luego se actualizará en las opciones de Vercel.

**Haz clic en "Deploy".**

### Paso 3: Configurar Dominio Personalizado

1. Una vez finalizado el build, ve a **Settings > Domains**.
2. Agrega tu dominio (ej. `app.koldhome.mx` o `koldhome.com`).
3. Vercel te dará los registros CNAME o A que debes colocar en tu proveedor de DNS (GoDaddy, Cloudflare, etc.).

### Paso 4: Actualizar NEXT_PUBLIC_APP_URL

1. Vuelve a **Settings > Environment Variables** en Vercel.
2. Edita `NEXT_PUBLIC_APP_URL` para que sea `https://tu-dominio-real.com`.

### Paso 5: Configurar en Odoo y n8n (URLs base)

1. Ve a Odoo > Ajustes del Sistema Temporales (`kold.system.mode` a `prod`).
2. En los flujos de n8n aplicables (notificaciones, auth), asegúrate de que el login magic link apunte a tu nuevo dominio de Vercel: `https://tu-dominio.com/auth?token=XYZ...`

### Paso 6: Configurar Stripe Webhook

1. Ve a tu Dashboard de Stripe (Developers -> Webhooks).
2. Agrega un Endpoint apuntando a:
   `https://tu-dominio.com/api/payments/webhook`
3. Eventos que debes escuchar:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
4. Toma el _"Signing Secret"_ que te arroja Stripe y ponlo en la variable de entorno de Vercel llamada `STRIPE_WEBHOOK_SECRET`.
5. Re-despliega (Redeploy) en Vercel para que tome el webhook secret.

🎉 **¡Listo! La PWA está en producción real.**
