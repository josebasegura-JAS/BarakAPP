# BarakAPP en servidor

Esta rama convierte BarakAPP en una aplicación web/PWA con datos centralizados en Supabase.

## Arquitectura

- Frontend: React + Vite.
- Hosting web: Vercel, Netlify o equivalente.
- Backend y base de datos: Supabase.
- Autenticación: Supabase Auth.
- Persistencia: un estado JSON por club protegido con RLS.
- Caché local: `localStorage`, utilizada como copia de trabajo y respaldo durante pérdidas breves de conexión.
- PWA: manifest + service worker para poder instalar BarakAPP desde el navegador.

## 1. Crear proyecto Supabase

1. Crear un proyecto nuevo en Supabase.
2. Abrir `SQL Editor`.
3. Ejecutar el contenido completo de `supabase/migrations/001_initial.sql`.
4. En `Authentication > Users`, crear el primer usuario con email y contraseña.
5. Copiar el UUID del usuario.
6. Ejecutar en `SQL Editor`, sustituyendo el UUID:

```sql
with new_club as (
  insert into public.clubs(name)
  values ('Balonmano Barakaldo')
  returning id
)
insert into public.club_members(user_id, club_id, display_name, role)
select 'UUID_DEL_USUARIO'::uuid, id, 'Administrador', 'admin'
from new_club;
```

## 2. Obtener credenciales públicas

En Supabase, copiar:

- Project URL.
- anon/public key.

Estas claves se configuran como variables del frontend:

```text
VITE_SUPABASE_URL=https://TU-PROYECTO.supabase.co
VITE_SUPABASE_ANON_KEY=TU_CLAVE_ANON_PUBLICA
```

La anon key es una clave pública de cliente. La seguridad real depende de las políticas RLS definidas en la migración.

## 3. Desplegar el frontend

En Vercel:

1. Importar el repositorio `josebasegura-JAS/BarakAPP`.
2. Framework preset: Vite.
3. Build command: `npm run build`.
4. Output directory: `dist`.
5. Añadir `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` en Environment Variables.
6. Desplegar.

No hace falta mantener un servidor Node propio encendido.

## 4. Añadir más usuarios

Crear el usuario en `Authentication > Users`, copiar su UUID y ejecutar:

```sql
insert into public.club_members(user_id, club_id, display_name, role)
select 'UUID_NUEVO_USUARIO'::uuid, id, 'Entrenador', 'coach'
from public.clubs
where name = 'Balonmano Barakaldo'
limit 1;
```

Todos los usuarios asociados al mismo club ven el mismo estado de BarakAPP.

## 5. Funcionamiento offline

La aplicación mantiene una copia local de equipos, rivales, partidos y lanzamientos. Los cambios se agrupan y se sincronizan con Supabase al trabajar con sesión activa.

La PWA también cachea el shell de la aplicación. Esto permite abrir la app si la conexión cae, aunque la sincronización con el servidor necesita recuperar conectividad.

## 6. Paso a producción

Antes de fusionar con `main`:

- comprobar que `npm run build` finaliza sin errores;
- probar login con un usuario real de Supabase;
- crear un lanzamiento desde un dispositivo;
- abrir BarakAPP desde otro dispositivo y verificar que aparece;
- probar pérdida y recuperación de red;
- verificar que un usuario no asociado al club no puede leer `app_state`.
