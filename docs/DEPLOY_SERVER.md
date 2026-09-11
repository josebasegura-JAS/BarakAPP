# BarakAPP · Firebase Hosting + Auth + Firestore

Esta rama convierte BarakAPP en una aplicación web/PWA centralizada en Firebase.

## Arquitectura

- Frontend: React + Vite.
- Hosting: Firebase Hosting.
- Autenticación: Firebase Authentication con email y contraseña.
- Datos: Cloud Firestore.
- Caché local: localStorage como copia de trabajo.
- PWA: manifest + service worker para instalar BarakAPP desde navegador.

## 1. Crear el proyecto Firebase

1. Entrar en Firebase Console y crear un proyecto, por ejemplo `barakapp`.
2. No es necesario activar Google Analytics para que BarakAPP funcione.
3. En la pantalla principal del proyecto, añadir una aplicación Web (`</>`).
4. Nombre sugerido: `BarakAPP Web`.
5. Copiar el objeto `firebaseConfig` que muestra Firebase.

## 2. Activar Authentication

1. Abrir `Build > Authentication`.
2. Pulsar `Get started`.
3. En `Sign-in method`, activar `Email/Password`.
4. No habilitar registro público en BarakAPP.
5. En `Users`, crear manualmente las cuentas autorizadas del club.

Todos los usuarios que tú crees en Firebase Auth compartirán los datos del club Barakaldo.

## 3. Crear Firestore

1. Abrir `Build > Firestore Database`.
2. Crear la base de datos.
3. Elegir una región europea cercana.
4. Puedes iniciar en modo bloqueado/producción: las reglas definitivas están en `firestore.rules`.

La aplicación guardará los datos bajo:

- `clubs/barakaldo/teams`
- `clubs/barakaldo/rivals`
- `clubs/barakaldo/matches`

Cada partido guarda sus lanzamientos dentro del propio documento del partido.

## 4. Variables de Firebase

Crear un archivo `.env.local` a partir de `.env.example`:

```text
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

Los valores salen del objeto `firebaseConfig` de la aplicación Web creada en Firebase.

## 5. Probar localmente

```bash
npm install
npm run dev
```

Después entra con una cuenta creada manualmente en Firebase Authentication.

## 6. Preparar Firebase CLI

```bash
npm install -g firebase-tools
firebase login
firebase use --add
```

Selecciona el proyecto Firebase de BarakAPP y asígnalo como `default`.

## 7. Desplegar

Primero compilar:

```bash
npm run build
```

Después desplegar Hosting y las reglas de Firestore:

```bash
firebase deploy --only hosting,firestore:rules
```

Firebase publicará la aplicación normalmente en:

```text
https://PROJECT_ID.web.app
```

También tendrás el dominio equivalente `PROJECT_ID.firebaseapp.com`.

## 8. Seguridad

`firestore.rules` deniega cualquier lectura o escritura anónima. Solo usuarios autenticados con Firebase Authentication pueden acceder a `clubs/barakaldo/**`.

No existe alta pública de usuarios desde BarakAPP. Las cuentas se crean desde Firebase Console.

## 9. Funcionamiento y sincronización

BarakAPP conserva localmente los equipos, rivales y partidos para que la interfaz sea rápida. Con una sesión autenticada, los cambios se sincronizan con Firestore automáticamente.

La PWA cachea además los recursos principales de la aplicación. Una interrupción breve de conexión no impide seguir viendo la interfaz ya cargada; la escritura remota requiere recuperar conectividad.

## 10. Prueba antes de fusionar a main

- comprobar que GitHub Actions termina en verde;
- iniciar sesión con un usuario real;
- crear un partido y varios lanzamientos desde un dispositivo;
- abrir BarakAPP desde otro dispositivo con otra cuenta autorizada;
- comprobar que aparecen los mismos datos;
- cerrar sesión y verificar que Firestore no es accesible sin autenticación.
