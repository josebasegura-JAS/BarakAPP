# BarakAPP 0.4.0 — Firebase Web/PWA

BarakAPP es una aplicación de estadística de porteros de balonmano orientada al registro visual de lanzamientos.

## Arquitectura actual

- React + TypeScript + Vite.
- Firebase Hosting para publicar la aplicación web.
- Firebase Authentication con email y contraseña.
- Cloud Firestore como base de datos central.
- PWA instalable en móvil, tablet y PC.
- Caché local para mantener una experiencia rápida.

## Funcionalidad principal

- Selección de equipo.
- Gestión de porteros por equipo.
- Alta y reutilización de rivales.
- Creación de hojas de lanzamientos.
- Introducción rápida del dorsal rival mediante teclado numérico.
- Selección visual del origen del lanzamiento sobre la pista.
- Selección visual del destino sobre la portería.
- Registro de gol, parada, fuera/poste o bloqueo.
- Cambio de portero durante la hoja.
- Deshacer último lanzamiento.
- Filtros por dorsal y zona de lanzamiento.
- Visualización mediante trazas o mapa de calor.

BarakAPP no utiliza cronómetro, marcador, exclusiones ni tarjetas en la versión simplificada actual.

## Datos centralizados

Los usuarios autorizados trabajan sobre los mismos datos del club. Firestore almacena:

```text
clubs/barakaldo/members
clubs/barakaldo/teams
clubs/barakaldo/rivals
clubs/barakaldo/matches
```

Cada partido contiene sus lanzamientos asociados.

## Desarrollo local

Copia `.env.example` como `.env.local` y rellena los valores del objeto `firebaseConfig` de tu aplicación Web de Firebase.

```bash
npm install
npm run dev
```

## Compilar

```bash
npm run build
```

El resultado web se genera en `dist/`.

## Desplegar en Firebase

Con Firebase CLI instalada y el proyecto asociado:

```bash
npm run build
firebase deploy --only hosting,firestore:rules
```

Consulta `docs/DEPLOY_SERVER.md` para el proceso completo de configuración.

## Seguridad

`firestore.rules` deniega el acceso anónimo y además exige que el UID autenticado tenga un documento en `clubs/barakaldo/members/{uid}`. Las cuentas y su autorización se gestionan manualmente desde Firebase Console.
