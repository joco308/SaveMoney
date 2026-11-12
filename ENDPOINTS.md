# Endpoints adicionales

Todos usan el prefijo `/api/v1` y requieren `Authorization: Bearer <accessToken>` del login existente. El usuario se obtiene del token. Los cuerpos no aceptan `id_usuario`.

## Recursos

Cada ruta base de esta tabla admite GET (listar) y POST (crear). Agregando `/:id` admite GET (consultar), PUT (actualización parcial) y DELETE. Los IDs bigint deben enviarse como cadenas decimales.

| Ruta base | Campos obligatorios al crear | Campos opcionales |
| --- | --- | --- |
| /emprendimientos | nombre, activo | descripcion |
| /presupuestos | anio, mes, monto_total, umbral_alerta_pct | id_emprendimiento |
| /metas | id_estado_meta, nombre, monto_objetivo, fecha_inicio, fecha_limite | descripcion |
| /metas/:parentId/aportes | monto, fecha_aporte | nota |
| /presupuestos/:parentId/limites | id_categoria, monto_limite, umbral_alerta_pct | — |
| /compras-impulsivas | id_categoria, id_estado_espera, articulo, monto_estimado, fecha_inicio_espera, fecha_fin_espera | motivo, fecha_resolucion, id_movimiento |

- Los listados aceptan `page` y `limit` (20 por defecto, máximo 100).
- Los importes aceptan cadenas o números positivos, hasta 12 dígitos enteros y 2 decimales. Se recomienda enviar cadenas para conservar la precisión.
- Las fechas de metas y aportes usan YYYY-MM-DD. Las fechas de compras usan ISO 8601 con zona horaria.
- Los porcentajes son enteros de 1 a 100.
- Los campos opcionales pueden vaciarse enviando null.
- PUT requiere al menos un campo. Los campos desconocidos se rechazan.
- Los aportes requieren una meta activa y una fecha dentro de su periodo.
- Los límites requieren una categoría activa de egreso, propia o global, y no pueden superar el total del presupuesto. Se admite un límite por categoría y presupuesto.
- Las compras pendientes carecen de movimiento y fecha de resolución. Las compradas requieren ambos. El movimiento debe pertenecer al usuario y a la categoría.
- Las fechas y los estados se administran explícitamente. Estas rutas no generan movimientos ni cambian automáticamente el estado de las metas.
- DELETE devuelve 204. Si una clave foránea impide eliminar el recurso, devuelve 409.

## Catálogos

GET /catalogos devuelve monedas, perfiles, tipos_movimiento, tipos_categoria, metodos_pago, estados_meta, estados_espera y tipos_alerta. Los valores se consultan en PostgreSQL.

## Alertas

- GET /alertas permite listar con page y limit.
- GET /alertas/:id consulta una alerta propia.
- PATCH /alertas/:id/lectura recibe `{"leida":true}` o `{"leida":false}`.
- DELETE /alertas/:id elimina una alerta propia.

La generación automática de alertas requiere reglas de negocio adicionales. Estos endpoints administran las alertas existentes.

## Respuestas

Las consultas y escrituras devuelven `{"success":true,"data":...}`. Los listados contienen `registros` y `paginacion`. Los errores usan el middleware existente. Los importes Decimal y los IDs bigint se serializan como cadenas.

## Verificación en Windows

Ejecutar desde la carpeta del proyecto:

```powershell
npm run typecheck
npm run prisma:validate
npm run dev
```

Comprobar con dos usuarios diferentes:

1. Iniciar sesión con los endpoints existentes y consultar /api/v1/me, categorías y movimientos.
2. Consultar /api/v1/catalogos y usar los IDs devueltos.
3. Crear un emprendimiento, presupuesto, meta, aporte y límite. Consultar y actualizar cada recurso.
4. Con el segundo usuario, intentar consultar, actualizar y eliminar recursos del primero. Debe responder 404.
5. Intentar usar categorías, movimientos, emprendimientos o padres ajenos. Debe rechazar la operación.
6. Probar fechas inexistentes, rango invertido, montos negativos y más de dos decimales. Debe responder 400.
7. Eliminar un presupuesto con límites o una meta con aportes. Debe responder 409.
8. Marcar una alerta leída dos veces y comprobar que conserva la primera fecha de lectura.
9. Probar renovación de JWT. La tabla sesion_usuario debe existir con el esquema que requiere alex.

La configuración existente usa DATABASE_URL para la aplicación y DIRECT_URL para Prisma CLI. No ejecutar migraciones destructivas ni db push sobre Supabase.
