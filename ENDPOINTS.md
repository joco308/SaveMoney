# Endpoints de SaveMoney

La API usa el prefijo `/api/v1`. Las rutas privadas esperan `Authorization: Bearer <accessToken>` y resuelven el usuario a partir del token. Las respuestas JSON siguen el formato `{ "success": true, "data": ... }`. Los IDs de tipo bigint se devuelven como cadenas.

## Rutas

| Ruta | Operaciones |
| --- | --- |
| `/health` | GET |
| `/auth/register`, `/auth/login`, `/auth/refresh`, `/auth/logout` | POST |
| `/me`, `/auth/me`, `/catalogos` | GET |
| `/categorias`, `/movimientos`, `/emprendimientos`, `/presupuestos`, `/metas-ahorro`, `/compras-impulsivas` | GET y POST en la colección. GET, PUT y DELETE en `/:id`. |
| `/categorias/:id/estado`, `/emprendimientos/:id/estado` | PATCH |
| `/presupuestos/:id/categorias` | GET y POST en la colección. GET, PUT y DELETE en `/:idLimite`. También disponible como `/presupuestos/:id/limites`. |
| `/metas-ahorro/:id/aportes` | GET y POST en la colección. GET, PUT y DELETE en `/:idAporte`. Las rutas de metas también están disponibles bajo `/metas`. |
| `/metas-ahorro/:id/cancelar` | PATCH |
| `/compras-impulsivas/:id/comprar`, `/compras-impulsivas/:id/descartar` | POST |
| `/alertas` y `/alertas/:id` | GET. DELETE en el detalle. |
| `/alertas/:id/leer`, `/alertas/leer-todas`, `/alertas/:id/lectura` | PATCH. La última recibe `{"leida":true}` o `{"leida":false}`. |

## Contratos de integración

- Las metas nuevas empiezan en **Activa**. El servidor recalcula el estado al escribir, comprueba que los aportes estén dentro del período y rechaza montos que superan el objetivo. `/metas` y `/metas-ahorro` devuelven el mismo formato.
- Las compras impulsivas usan `dias_espera` al crear. La acción `/comprar` registra el gasto una vez terminado el plazo y `/descartar` cierra la compra sin registrar un gasto. Los estados se buscan por nombre. La compra pendiente admite los nombres **Pendiente** y **En espera**.
- Los límites se aplican a categorías activas de egreso. Se admite un límite por categoría en el mismo presupuesto y su monto no puede superar el presupuesto. Un presupuesto con registros dependientes devuelve 409 al intentar borrarlo.
- Las alertas automáticas usan el código configurado en la base. Si faltan los tipos específicos de alerta se usa el código anterior equivalente cuando existe. La alerta por límite requiere `LIMITE_CATEGORIA_UMBRAL`.
- Para usar `/descartar`, el catálogo debe incluir **Descartada**. El cambio automático a **Vencida** requiere ese estado en `estado_meta`. Revisa los catálogos actuales de Supabase antes de ejecutar un script de carga. Los valores del seed y los de bases previamente inicializadas pueden usar IDs distintos.
- Los importes en presupuestos, metas, aportes y compras admiten números o cadenas con hasta dos decimales. Las fechas de metas y aportes usan YYYY-MM-DD.
- Las rutas compartidas usan la lógica y el formato de respuesta de `alex`. En los listados principales, los arrays llevan el nombre del recurso. Los listados de límites devuelven `registros` y `paginacion`.

## Comprobar localmente

Ejecuta `npm run typecheck`, `npm run prisma:validate` y `npm run dev` desde tu terminal de Windows, según AGENTS.md. Con una cuenta de prueba, comprueba el login, los catálogos y el flujo de categorías y movimientos. Después prueba un presupuesto con límite, una meta con aportes, y las transiciones de una compra impulsiva. Repite las consultas con otra cuenta para comprobar que las rutas privadas consultan solo registros propios.
