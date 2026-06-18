# 🚀 Cómo iniciar el proyecto — Guía paso a paso

Hay **dos formas** de usar el sistema: con lo que ya está en la nube (rápido) o corriéndolo en tu PC (desarrollo).

---

## 🟢 OPCIÓN A — Usar lo que ya está desplegado (lo más fácil)

No necesitas correr nada.

1. **Dashboard web:** abre en el navegador
   `https://gestion-de-residuos-cusco.onrender.com`
   Ingresa con `admin@residuos.cusco.gob.pe` / `admin123`
   > La primera carga tarda ~40 s (el plan gratuito "despierta" el servidor).

2. **App móvil:** instala el archivo `ResiduosCusco-APP.apk` en tu celular.
   Ingresa con `ciudadano1@gmail.com` / `ciudadano123`.

---

## 🔵 OPCIÓN B — Correrlo en tu PC (desarrollo)

### Requisitos
- Node.js 20+ y npm
- (App) Expo Go en el celular **o** un emulador Android

### Paso 1 — Backend (API + dashboard web)
```bash
cd MiResiduosCusco/backend
npm install
npm run seed     # solo la primera vez: carga datos de prueba
npm start
```
Queda disponible en `http://localhost:4000` (API y dashboard web).

Si no existe el archivo `backend/.env`, créalo:
```env
MONGODB_URI=mongodb+srv://<usuario>:<password>@<cluster>.mongodb.net/miresiduos?retryWrites=true&w=majority
JWT_SECRET=una-cadena-secreta-larga
DNI_API_TOKEN=<token-de-apisperu>   # opcional
PORT=4000
```

### Paso 2 — App móvil
Abre **otra terminal** (deja el backend corriendo):
```bash
cd MiResiduosCusco/mobile-app
npm install
npx expo start
```
Luego:
- Escanea el QR con **Expo Go** (celular en el mismo WiFi), **o**
- Presiona `a` para abrir en un emulador Android.

Configura `mobile-app/.env`:
```env
# Emulador Android: http://10.0.2.2:4000
# Celular físico (mismo WiFi): http://TU-IP-LAN:4000
# Producción: https://gestion-de-residuos-cusco.onrender.com
EXPO_PUBLIC_API_URL=http://10.0.2.2:4000
```

---

## 📦 Generar el APK
```bash
cd MiResiduosCusco/mobile-app
npx expo prebuild --platform android --clean
cd android
./gradlew assembleRelease
# Resultado: android/app/build/outputs/apk/release/app-release.apk
```

---

## 🔑 Credenciales de prueba

| Rol | Email | Contraseña |
|---|---|---|
| Administrador | `admin@residuos.cusco.gob.pe` | `admin123` |
| Admin municipal | `municipal@residuos.cusco.gob.pe` | `admin123` |
| Operador | `operador1@residuos.cusco.gob.pe` | `operador123` |
| Ciudadano | `ciudadano1@gmail.com` | `ciudadano123` |

---

## ❓ Problemas comunes
- **"Network error" / carga lenta:** el backend de Render estaba dormido; espera ~40 s y reintenta.
- **La app no conecta en local:** usa la IP LAN de tu PC en `EXPO_PUBLIC_API_URL`, no `localhost`.
- **`Falta MONGODB_URI`:** crea el archivo `backend/.env`.
