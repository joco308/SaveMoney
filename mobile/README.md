# SaveMoney Expo con Supabase

Expo usa Supabase Auth y la Data API de la rama configurada. El proyecto no necesita iniciar el servidor Express para funcionar.

## Preparar cada rama de Supabase

1. Abre el proyecto y selecciona la rama de Supabase que vas a usar.
2. Verifica que tenga el esquema de SaveMoney, el perfil `1`, la moneda `BOB`, categorías activas de ingreso y egreso, y métodos de pago. El registro de un usuario nuevo usa el perfil estándar y BOB. El registro rápido usa el método llamado Efectivo.
3. Revisa y ejecuta `mobile/supabase/setup.sql` en SQL Editor de esa rama. Crea el vínculo con Supabase Auth y concede acceso de lectura a los datos propios, inserción de movimientos y actualización de la fecha de lectura de alertas. Prueba primero en una rama de desarrollo, especialmente si otro cliente utiliza la Data API.
4. Desde **Connect**, copia la URL y la clave publicable de esa rama a `mobile/.env.local`, siguiendo `mobile/.env.example`. Usa los mismos hosts para Auth y para la Data API. Reinicia Expo después de cambiar de rama.
5. Si alguien ya tiene registros en SaveMoney, crea o identifica su cuenta en **Authentication → Users**. Un administrador debe vincular el `auth_user_id` al `id_usuario` correspondiente tras verificar que ambas cuentas pertenecen a la misma persona. Las contraseñas del sistema anterior no se importan a Auth. Un usuario nuevo puede registrarse desde Expo, confirmar su correo e iniciar sesión para crear su perfil.

## Ejecución en Windows

Desde la carpeta `mobile`:

```text
npx expo install @supabase/supabase-js @react-native-async-storage/async-storage react-native-url-polyfill
npx tsc --noEmit
npx expo lint
npx expo start
```

Inicia sesión con dos cuentas de prueba. Registra un gasto y un ingreso con la primera, vuelve a Inicio y comprueba los importes. Comprueba que la segunda solo ve sus registros. Usa un usuario con un presupuesto, aportes o alertas existentes para revisar esas pantallas y probar el cambio de lectura. Las pantallas muestran alertas registradas en PostgreSQL. Expo no genera notificaciones push ni alertas al escribir movimientos.
