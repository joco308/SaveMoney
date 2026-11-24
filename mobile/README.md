# SaveMoney Mobile

Expo consume el backend Express mediante `fetch`. La aplicación móvil no realiza consultas directas a la Data API de Supabase. El backend usa Prisma para guardar y leer información en PostgreSQL de Supabase.

## Configuración

1. Despliega el backend en un dominio accesible desde el teléfono y publícalo con HTTPS.
2. En la carpeta `mobile`, crea `.env.local` a partir de `.env.example` y configura `EXPO_PUBLIC_API_URL` con el dominio base, sin `/api/v1` al final.
3. En el backend configura `DATABASE_URL`, `DIRECT_URL`, `JWT_SECRET` y `CORS_ORIGIN`. `CORS_ORIGIN` debe contener el origen web de la app si también se usa Expo web.
4. Confirma que la base tenga el perfil estándar con ID `1`, la moneda `BOB`, categorías activas y métodos de pago. El registro usa `BOB`; el registro rápido preselecciona el método `Efectivo`.
5. Si las columnas `movimiento.frecuencia` y `movimiento.es_impulsivo` aún no existen, aplica deliberadamente la parte de columnas de `mobile/supabase/setup.sql` desde el SQL Editor de Supabase. No ejecutes `prisma db push` ni migraciones automáticas en la base compartida.

La app guarda los tokens propios de la API en AsyncStorage y renueva la sesión mediante `/auth/refresh`. Las cuentas existentes deben tener una contraseña compatible con el backend; la autenticación de Supabase Auth ya no inicia sesión en esta app.

## Desarrollo en Windows

Desde la carpeta `mobile`, ejecuta `npx expo start`. Para verificar cambios, ejecuta `npx expo lint` y `npx tsc --noEmit`. Para revisar el backend, desde la raíz ejecuta `npx prisma generate` y `npm run typecheck` en una terminal de Windows.

En un teléfono, `localhost` apunta al propio teléfono. Usa un host HTTPS accesible desde el dispositivo para que las solicitudes lleguen al backend.
