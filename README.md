# BarakAPP 0.2.0 — Electron local

Primera versión de escritorio de **BarakAPP** para probar el flujo completo de estadísticas de porteros sin servidor ni base de datos remota.

## Qué incluye

- Aplicación React + TypeScript empaquetable como **Electron portable para Windows**.
- Login local de pruebas.
- Selección de equipo.
- Historial de partidos.
- Alta de rival reutilizable.
- Nuevo partido.
- Marcador manual.
- Cronómetro iniciar / pausar / reanudar.
- Cambio de parte.
- Exclusiones de 2 minutos asociadas a dorsal con cuenta atrás ligada al reloj del partido.
- Tarjetas.
- Selección/cambio de portero.
- Registro de lanzamiento con dorsal rival obligatorio.
- Zona de origen del lanzamiento.
- Destino exacto pulsando sobre la portería (coordenadas X/Y).
- Gol, parada, fuera/poste y bloqueo.
- Cronología de eventos y deshacer.
- Mapa de destino filtrable por jugador, zona o ambos.

## Almacenamiento en esta versión

No existe Supabase ni servidor. Los datos se guardan localmente mediante el almacenamiento del navegador interno de Electron.

En Windows, Chromium/Electron conserva estos datos dentro del perfil de usuario de BarakAPP. Por tanto:

- cerrar y volver a abrir el programa **no borra los partidos**;
- los datos pertenecen únicamente a ese PC/usuario de Windows;
- borrar los datos de aplicación de BarakAPP sí elimina la información;
- esta versión es exclusivamente de pruebas. Antes del uso real conectaremos la aplicación a la base de datos central.

## Probar durante el desarrollo

Requisitos: Node.js 22 o superior.

```bash
npm install
npm run dev:electron
```

## Generar el EXE portable en Windows

```bash
npm install
npm run dist
```

El resultado aparecerá en:

```text
release/BarakAPP-0.2.0-portable.exe
```

El EXE es portable: no requiere instalador.

## Generarlo automáticamente desde GitHub

El repositorio contiene:

```text
.github/workflows/build-windows.yml
```

Al subir cambios a `main`, GitHub Actions compila automáticamente BarakAPP para Windows.

Para descargarlo:

1. Abre el repositorio en GitHub.
2. Entra en **Actions**.
3. Abre la ejecución `Build BarakAPP Windows`.
4. En la parte inferior, descarga el artefacto **BarakAPP-Windows-portable**.
5. Descomprime el ZIP del artefacto y ejecuta el `.exe`.

También se puede lanzar manualmente desde `Actions > Build BarakAPP Windows > Run workflow`.

## Estructura

```text
barakapp/
├─ electron/
│  ├─ main.cjs
│  └─ preload.cjs
├─ src/
├─ .github/workflows/
│  └─ build-windows.yml
├─ package.json
├─ vite.config.ts
└─ README.md
```

## Camino previsto

Esta fase mantiene todo en local para trabajar deprisa. Cuando el funcionamiento esté cerrado:

1. conectaremos autenticación y datos a Supabase;
2. mantendremos Electron para escritorio si interesa;
3. publicaremos la misma interfaz como PWA en Cloudflare Pages para Android/iOS/tablet.
