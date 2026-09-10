# BarakAPP v0.1.0

Primera versión funcional de la aplicación web del club para registrar estadísticas de porteros de balonmano.

## Qué incluye

- Login con Supabase cuando se configuran las variables de entorno.
- Modo demo local automático si todavía no se configura Supabase.
- Selección de equipo.
- Historial de partidos.
- Creación de partido y rival reutilizable.
- Marcador local/rival con +/-.
- Cronómetro iniciar / pausar / reiniciar y cambio de parte.
- Exclusiones de 2 minutos con cuenta atrás sincronizada con el cronómetro.
- Registro de tarjetas en cronología.
- Selección del portero en pista.
- Registro de lanzamiento con dorsal rival obligatorio.
- Zona de origen del tiro.
- Destino pulsando directamente sobre una portería; se guardan coordenadas X/Y.
- Resultado: gol, parada, fuera/poste o bloqueo.
- El gol recibido actualiza automáticamente el marcador rival según local/visitante.
- Hoja de destino / mapa básico en tiempo real.
- Filtro combinado por dorsal y zona de origen.
- Cronología de eventos.
- Deshacer último evento.
- Diseño responsive amarillo/negro inspirado en los mockups aprobados.

## Arranque rápido local

```bash
npm install
npm run dev
```

Sin `.env`, la app funciona en **modo demo** y guarda los datos en `localStorage`.

## Activar Supabase

1. Crea un proyecto gratuito en Supabase.
2. Abre **SQL Editor** y ejecuta `supabase/migrations/001_initial.sql`.
3. Copia `.env.example` a `.env.local`.
4. Completa:

```env
VITE_SUPABASE_URL=https://TU-PROYECTO.supabase.co
VITE_SUPABASE_ANON_KEY=TU_ANON_KEY
```

5. En Supabase Authentication crea inicialmente los usuarios del club.

> En v0.1 el login ya usa Supabase cuando está configurado, pero la capa de datos de partidos sigue trabajando en almacenamiento local para permitir probar toda la interfaz sin backend. La migración SQL incluida deja preparado el modelo servidor. La siguiente versión conectará equipos, partidos, tiros y eventos directamente a esas tablas.

## Subir a GitHub

Desde la carpeta del proyecto:

```bash
git init
git add .
git commit -m "BarakAPP v0.1.0"
git branch -M main
git remote add origin https://github.com/TU-USUARIO/barakapp.git
git push -u origin main
```

## Publicar gratis

### Cloudflare Pages

- Conecta el repositorio GitHub.
- Build command: `npm run build`
- Output directory: `dist`
- Añade `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` en Environment variables cuando conectemos Supabase.

### Vercel

También funciona directamente importando el repo de GitHub; detectará Vite automáticamente.

## Siguiente versión recomendada

1. Persistencia real en Supabase.
2. Gestión de plantillas y porteros desde la app.
3. Roles de usuario.
4. Rival + dorsales rivales persistentes por partido.
5. Mapa de calor continuo de origen y destino.
6. Funcionamiento PWA/offline con sincronización posterior.
7. Edición completa de eventos históricos.

## Referencias visuales aprobadas

Se incluyen en `docs/reference/` los dos mockups acordados:

- `barakapp-partido-reference.png`
- `barakapp-hoja-lanzamientos-reference.png`

Estas imágenes son la referencia de diseño para las siguientes iteraciones.
