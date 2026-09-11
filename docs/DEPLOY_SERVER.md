# BarakAPP · Firebase Hosting + Auth + Firestore

Esta rama convierte BarakAPP en una aplicación web/PWA centralizada en Firebase.

## Arquitectura

- Frontend: React + Vite.
- Hosting: Firebase Hosting.
- Autenticación: Firebase Authentication con email y contraseña.
- Datos: Cloud Firestore.
- PWA instalable en móvil, tablet y PC.
- Caché local: localStorage como copia de trabajo.

## 1. Crear el proyecto Firebase

1. En Firebase Console crea un proyecto, por ejemplo `barakapp`.
2. Google Analytics es opcional.
3. Añade una aplicación Web (`</>`), por ejemplo `BarakAPP Web`.
4. Copia el objeto `firebaseConfig` que muestra Firebase.

## 2. Activar Authentication

1. `Build > Authentication > Get started`.
2. En `Sign-in method`, activa `Email/Password`.
3. En `Users`, crea manualmente cada cuenta autorizada.
4. Copia el UID de cada usuario creado.

## 3. Crear Firestore

1. `Build > Firestore Database`.
2. Crea la base de datos en una región europea adecuada.
3. Puedes iniciar en modo producción/bloqueado.

La app usa estas rutas:

```text
clubs/barakaldo/members/{UID}
clubs/barakaldo/teams/{teamId}
clubs/barakaldo/rivals/{rivalId}
clubs/barakaldo/matches/{matchId}
```

## 4. Autorizar usuarios del club

Para cada usuario de Authentication, crea manualmente en Firestore el documento:

```text
clubs / barakaldo / members / UID_DEL_USUARIO
```

El ID del documento debe ser exactamente el UID de Firebase Authentication.

Puedes añadir campos informativos, por ejemplo:

```text
email: entrenador@club.es
role: coach
```

Las reglas de `firestore.rules` comprueban que ese documento exista. Una cuenta autenticada que no figure en `members` no puede leer ni escribir los datos del club.

## 5. Variables de Firebase

Crea `.env.local` a partir de `.env.example`:

```text
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

Los valores salen del objeto `firebaseConfig` de tu app Web.

## 6. Probar localmente

```bash
npm install
npm run dev
```

Entra con una cuenta creada en Authentication y autorizada en `members`.

## 7. Preparar Firebase CLI

```bash
npm install -g firebase-tools
firebase login
firebase use --add
```

Selecciona el proyecto de BarakAPP y asígnalo como `default`.

## 8. Desplegar

```bash
npm run build
firebase deploy --only hosting,firestore:rules
```

Firebase Hosting publicará normalmente en:

```text
https://PROJECT_ID.web.app
```

También estará disponible mediante `PROJECT_ID.firebaseapp.com`.

## 9. Prueba antes de fusionar a main

- GitHub Actions en verde.
- Login con usuario autorizado.
- Crear partido y lanzamientos desde un dispositivo.
- Abrir desde otro dispositivo y comprobar los mismos datos.
- Probar un usuario autenticado sin documento en `members` y verificar que Firestore deniega el acceso.
