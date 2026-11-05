# AGENTS.md — SaveMoney Backend Protocol

## ENTORNO DE EJECUCIÓN (CRÍTICO)

- **OpenCode corre en WSL (Linux), pero el proyecto y Node.js residen físicamente en Windows.**
- **REGLA DE ORO:** **NO ejecutes comandos de Node/NPM/Prisma directamente desde la CLI del agente en WSL**, ya que fallarán por desajuste de binarios/rutas entre WSL y Windows (`npm`, `npx`, `node`).
- Si necesitas probar o ejecutar comandos, **solicítale al usuario que los ejecute en su terminal de Windows** (PowerShell / Command Prompt) o limítate a modificar y analizar archivos.

---

## 1. Contexto del Proyecto & Stack Target

Backend para la aplicación **SaveMoney**. La base de datos PostgreSQL ya existe en Supabase y está introspectada en `prisma/schema.prisma`.

- **Runtime & Lenguaje:** Node.js + TypeScript (Requiere `tsconfig.json`).
- **Framework HTTP:** Express.js.
- **ORM:** Prisma ORM v7.10.1 (Driver adapter `@prisma/adapter-pg` + `pg`).
- **Validaciones:** Zod (para todos los DTOs e inputs HTTP).
- **Base de Datos:** Supabase PostgreSQL.

---

## 2. Database / Prisma / Supabase Rules

### Prohibiciones Críticas en DB
- **NUNCA** ejecutes u ordenes ejecutar `npx prisma migrate reset`, `npx prisma migrate dev` o `npx prisma db push` contra la base de datos compartida de Supabase. Esto destruirá datos, esquemas de RLS y Check Constraints existentes.
- Los cambios en el esquema se gestionan exclusivamente mediante re-introspección (`npx prisma db pull`) o scripts SQL deliberados ejecutados manualmente en la consola de Supabase.

### Configuración de Conexiones & Drivers
- **Prisma Generator Output:** Ubicado en `src/generated/prisma`. Importar `PrismaClient` exclusivamente desde `src/generated/prisma/client`, **NUNCA** desde `@prisma/client`.
- **Pooler vs Direct Connection:**
  - `DIRECT_URL` (Puerto 5432 / Session Mode): Reservado para scripts CLI / operaciones de Prisma CLI.
  - `DATABASE_URL` (Puerto 6543 / Transaction Mode - PgBouncer): Reservado para la aplicación Express en ejecución.
- **Instanciación de Prisma** (implementada en `src/config/prisma.ts`; ajusta la ruta relativa según el archivo):
  ```ts
  import { PrismaClient } from '../generated/prisma/client';
  import { PrismaPg } from '@prisma/adapter-pg';
  import { Pool } from 'pg';

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  export const prisma = new PrismaClient({ adapter });
  ```

### Nomenclatura y Estilo
- Respetar la nomenclatura del esquema introspectado: **Spanish `snake_case`** para campos y tablas en PostgreSQL (`map:` explícitos). No renombrar entidades ni campos sin justificación explícita.

---

## 3. Arquitectura del Código Backend

El proyecto debe seguir una **Arquitectura por Capas limpia**:

```text
src/
├── config/         # Variables de entorno y cliente Prisma/Supabase
├── controllers/    # Extracción de parámetros/body/query, llamadas a servicios y respuestas HTTP
├── services/       # Lógica de negocio pura e interacción directa con Prisma
├── routes/         # Router de Express y aplicación de middlewares por endpoint
├── middlewares/    # Auth JWT Supabase, validación Zod, handler de errores
├── schemas/        # Esquemas de validación Zod para payloads HTTP
├── types/          # Definiciones y extensiones de tipos de TypeScript (ej. Express.Request)
└── generated/      # Cliente auto-generado de Prisma (NO MANIPULAR MANUALMENTE)
```

---

## 4. Estándares de Desarrollo para el Agente

### TypeScript & Módulos
- `package.json` usa `"type": "module"` porque el cliente generado de Prisma es ESM y usa `import.meta`. No volver a CommonJS.
- `tsconfig.json` usa `moduleResolution: "Bundler"` y `allowImportingTsExtensions` (necesario por los imports `.ts` del cliente generado).
- Ejecutar siempre con `tsx` (`npx tsx src/server.ts` o `npm run dev`); no hay paso de compilación a JS.

### Autenticación y Seguridad (Supabase + Express)
- Prisma se conecta con credenciales de superusuario/directas y **salta las políticas de Row Level Security (RLS)** de Supabase.
- **Obligatorio:** Implementar un middleware de autenticación que verifique el token JWT emitido por Supabase en el header `Authorization: Bearer <token>` (ya implementado en `src/middlewares/auth.middleware.ts` con `jose`; requiere `SUPABASE_URL` + JWKS o `SUPABASE_JWT_SECRET`).
- **Mapeo actual:** el JWT identifica a Supabase Auth con un UUID (`sub`), pero `usuario.id_usuario` es `BigInt`; hasta agregar una columna `auth_user_id`, el usuario se resuelve por `email` verificado y queda en `req.usuario`.
- **Obligatorio:** Incluir siempre el filtro explícito `where: { id_usuario }` en todas las consultas de Prisma dentro de los servicios (usar `req.usuario.id_usuario`, nunca el `sub` de Supabase).

### Validación de Entradas (Zod)
- Cada endpoint que procese `body`, `query` o `params` debe contar con un schema Zod validado antes de invocar la lógica del controlador.

### Manejo Estándar de Errores y Respuestas HTTP
- Utilizar un middleware de errores centralizado.
- Estructura unificada de respuesta de error:
  ```json
  {
    "success": false,
    "error": {
      "code": "BAD_REQUEST",
      "message": "Mensaje explicativo del error",
      "details": []
    }
  }
  ```

---

## 5. Referencia de Comandos (Para ejecutar por el usuario en Windows)

- `npm install` — Instala dependencias y corre sincronización.
- `npx prisma validate` — Valida el archivo `schema.prisma`.
- `npx prisma db pull` — Re-introspecta la base de datos de Supabase si hubo cambios SQL.
- `npx prisma generate` — Regenera el cliente en `src/generated/prisma`.
- `npx tsc --noEmit` — Verifica tipos (equivale a `npm run typecheck`).
- `npx tsx src/server.ts` — Inicia el servidor Express en Windows (o `npm run dev` con watch).

---

## 6. Skills a Ignorar

- Ignorar `.agents/skills/prisma-8/`. Este proyecto usa **Prisma 7.10.1**. Confía en la documentación y funcionamiento de la v7.