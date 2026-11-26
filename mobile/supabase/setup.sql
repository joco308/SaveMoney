begin;

alter table public.usuario add column if not exists auth_user_id uuid references auth.users(id);
create unique index if not exists usuario_auth_user_id_uidx on public.usuario (auth_user_id);
alter table public.movimiento add column if not exists frecuencia text
  check (frecuencia in ('Fijo', 'Variable'));
alter table public.movimiento add column if not exists es_impulsivo boolean not null default false;

-- El UUID de Supabase Auth identifica un único perfil activo de SaveMoney.
create or replace function public.mobile_usuario_id()
returns bigint
language sql stable security definer set search_path = ''
as $$
  select u.id_usuario from public.usuario u
  where u.auth_user_id = (select auth.uid()) and u.activo;
$$;
revoke all on function public.mobile_usuario_id() from public, anon;
grant execute on function public.mobile_usuario_id() to authenticated;

-- Una cuenta existente se vincula administrativamente por UUID.
-- Una coincidencia de correo por sí sola nunca concede acceso a datos existentes.
create or replace function public.mobile_crear_perfil()
returns void
language plpgsql security definer set search_path = ''
as $$
declare
  identidad auth.users%rowtype;
begin
  select * into identidad from auth.users where id = (select auth.uid());
  if identidad.id is null or identidad.email_confirmed_at is null or identidad.email is null then
    raise exception 'Confirma el correo de tu cuenta antes de continuar';
  end if;

  if exists (select 1 from public.usuario where auth_user_id = identidad.id) then
    return;
  end if;

  if exists (select 1 from public.usuario where lower(email) = lower(identidad.email)) then
    raise exception 'El perfil existente debe ser vinculado por el administrador';
  end if;

  insert into public.usuario
    (auth_user_id, id_perfil, codigo_moneda, nombres, apellidos, email, hash_contrasena, activo, fecha_registro)
  values (
    identidad.id, 1, 'BOB',
    coalesce(nullif(left(btrim(identidad.raw_user_meta_data->>'nombres'), 80), ''), 'Usuario'),
    coalesce(left(btrim(identidad.raw_user_meta_data->>'apellidos'), 80), ''),
    lower(identidad.email), '!supabase-auth', true, timezone('UTC', now())
  ) on conflict (auth_user_id) do nothing;
end;
$$;
revoke all on function public.mobile_crear_perfil() from public, anon;
grant execute on function public.mobile_crear_perfil() to authenticated;

-- Las políticas restrictivas limitan también cualquier política permisiva preexistente.
do $$
declare
  item record;
begin
  for item in
    select * from (values
      ('usuario', 'id_usuario = (select public.mobile_usuario_id())'),
      ('movimiento', 'id_usuario = (select public.mobile_usuario_id())'),
      ('emprendimiento', 'id_usuario = (select public.mobile_usuario_id())'),
      ('presupuesto', 'id_usuario = (select public.mobile_usuario_id())'),
      ('meta_ahorro', 'id_usuario = (select public.mobile_usuario_id())'),
      ('compra_impulsiva', 'id_usuario = (select public.mobile_usuario_id())'),
      ('alerta', 'id_usuario = (select public.mobile_usuario_id())'),
      ('categoria', '(select public.mobile_usuario_id()) is not null and (id_usuario is null or id_usuario = (select public.mobile_usuario_id()))'),
      ('aporte_meta', 'exists (select 1 from public.meta_ahorro m where m.id_meta = aporte_meta.id_meta and m.id_usuario = (select public.mobile_usuario_id()))'),
      ('presupuesto_categoria', 'exists (select 1 from public.presupuesto p where p.id_presupuesto = presupuesto_categoria.id_presupuesto and p.id_usuario = (select public.mobile_usuario_id()))')
    ) as scopes(tabla, predicado)
  loop
    execute format('alter table public.%I enable row level security', item.tabla);
    execute format('revoke all on table public.%I from public, anon, authenticated', item.tabla);
    execute format('drop policy if exists mobile_read on public.%I', item.tabla);
    execute format('drop policy if exists mobile_scope on public.%I', item.tabla);
    execute format('create policy mobile_read on public.%I for select to authenticated using (true)', item.tabla);
    execute format('create policy mobile_scope on public.%I as restrictive for all to anon, authenticated using (%s) with check (%s)', item.tabla, item.predicado, item.predicado);
    if item.tabla <> 'usuario' then
      execute format('grant select on public.%I to authenticated', item.tabla);
    end if;
  end loop;

  for item in
    select unnest(array['tipo_movimiento','tipo_categoria','metodo_pago','estado_espera','estado_meta']) as tabla
  loop
    execute format('alter table public.%I enable row level security', item.tabla);
    execute format('revoke all on table public.%I from public, anon, authenticated', item.tabla);
    execute format('grant select on public.%I to authenticated', item.tabla);
    execute format('drop policy if exists mobile_catalogo on public.%I', item.tabla);
    execute format('create policy mobile_catalogo on public.%I for select to authenticated using ((select public.mobile_usuario_id()) is not null)', item.tabla);
  end loop;
end $$;

revoke select (hash_contrasena) on public.usuario from public, anon, authenticated;
grant select (id_usuario, nombres, apellidos, codigo_moneda) on public.usuario to authenticated;
grant insert (id_usuario, id_emprendimiento, id_categoria, id_metodo_pago, monto,
  fecha_movimiento, descripcion, fecha_registro, frecuencia, es_impulsivo) on public.movimiento to authenticated;
grant update (fecha_lectura) on public.alerta to authenticated;

-- PostgREST necesita poder usar la secuencia del identificador al insertar.
do $$
declare
  secuencia text := pg_get_serial_sequence('public.movimiento', 'id_movimiento');
begin
  if secuencia is not null then
    execute format('grant usage on sequence %s to authenticated', secuencia);
  end if;
end $$;

drop policy if exists mobile_insert_movimiento on public.movimiento;
drop policy if exists mobile_check_movimiento on public.movimiento;
create policy mobile_insert_movimiento on public.movimiento for insert to authenticated with check (true);
create policy mobile_check_movimiento on public.movimiento as restrictive for insert to authenticated
with check (
  monto > 0
  and exists (select 1 from public.categoria c where c.id_categoria = movimiento.id_categoria and c.activa)
  and (id_emprendimiento is null or exists (
    select 1 from public.emprendimiento e where e.id_emprendimiento = movimiento.id_emprendimiento and e.activo
  ))
);
drop policy if exists mobile_lectura_alerta on public.alerta;
create policy mobile_lectura_alerta on public.alerta for update to authenticated using (true) with check (true);

-- Las sesiones y los hashes del backend quedan fuera de la API móvil.
do $$
begin
  if to_regclass('public.sesion_usuario') is not null then
    execute 'revoke all on table public.sesion_usuario from public, anon, authenticated';
  end if;
end $$;

commit;
