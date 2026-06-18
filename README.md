# ♻️ Residuos Cusco — Sistema Inteligente de Recolección de Residuos Sólidos Segregados

Sistema integral para la **gestión y monitoreo de la recolección de residuos sólidos** en la ciudad del Cusco. Incluye:

- 📱 **App móvil (Android / APK)** — ciudadanos y operadores
- 🖥️ **Dashboard web** — administración municipal
- ☁️ **API REST + base de datos** en la nube

### ✨ Funcionalidades de la app móvil
- Inicio de sesión y **registro** (con mapa de ubicación + GPS y autocompletado por **DNI**)
- **Recuperar contraseña** (correo + DNI)
- Botón **Continuar con Google** (se activa al configurar credenciales)
- **Inicio**, **Mapa** (camiones en vivo), **Incidencias**, **Segregar** (guía de residuos) y **Perfil**
- Tema oscuro/azul, ícono propio (símbolo de reciclaje) y barra de navegación adaptada al dispositivo

> Curso **IF614 – Ingeniería de Software I** · Escuela Profesional de Ing. Informática y de Sistemas · **UNSAAC** · 2026-1
> Metodología: **SCRUM** · Atributo del graduado: **AG-C01**

---

## 📑 Tabla de contenidos
1. [Descripción del problema](#1-descripción-del-problema)
2. [Objetivos](#2-objetivos)
3. [Arquitectura](#3-arquitectura)
4. [Tecnologías](#4-tecnologías)
5. [Estructura del repositorio](#5-estructura-del-repositorio)
6. [Requerimientos del sistema (RF y RNF)](#6-requerimientos-del-sistema)
7. [Requisitos previos](#7-requisitos-previos-software)
8. [Configurar MongoDB Atlas](#8-configurar-mongodb-atlas)
9. [Backend — ejecución local](#9-backend--ejecución-local)
10. [Dashboard web](#10-dashboard-web)
11. [App móvil — ejecución y APK](#11-app-móvil--ejecución-y-apk)
12. [Despliegue en Render](#12-despliegue-en-render)
13. [API RENIEC (consulta DNI)](#13-api-reniec-consulta-dni)
14. [Credenciales de prueba](#14-credenciales-de-prueba)
15. [Endpoints de la API](#15-endpoints-de-la-api)
16. [Ramas y flujo de trabajo](#16-ramas-y-flujo-de-trabajo)
17. [Solución de problemas](#17-solución-de-problemas)
18. [Consideraciones éticas y legales](#18-consideraciones-éticas-y-legales)
19. [Equipo](#19-equipo)

---

## 1. Descripción del problema
En el Cusco la gestión de residuos presenta rutas no optimizadas, escasa comunicación con la población, baja cultura de segregación y ausencia de reportes para la toma de decisiones. Esto provoca acumulación de residuos, afectando la salubridad y la sostenibilidad ambiental.

## 2. Objetivos
**General:** diseñar e implementar un sistema inteligente de gestión de residuos sólidos segregados que optimice la recolección, mejore la comunicación con la ciudadanía y genere información para la toma de decisiones, aplicando SCRUM.

**Específicos:** gestión de usuarios y zonas · catálogo y guía de segregación · monitoreo de rutas con ubicación · app móvil ciudadana · alertas · reportes.

---

## 3. Arquitectura

```
┌──────────────────────┐      ┌──────────────────────┐
│  App móvil (Expo)    │      │  Dashboard web       │
│  Android / APK       │      │  (navegador)         │
└──────────┬───────────┘      └──────────┬───────────┘
           │ HTTPS / JSON (JWT)           │
           └───────────────┬─────────────┘
                           ▼
              ┌──────────────────────────┐
              │  API REST (Node/Express) │   ← Render
              └───────────┬──────────────┘
                          │ Mongoose
                          ▼
              ┌──────────────────────────┐
              │   MongoDB Atlas (nube)   │
              └──────────────────────────┘
   (consulta DNI → API RENIEC / apisperu)
```

- Un solo backend sirve **la API** y **el dashboard web** (carpeta `public/`).
- La app móvil es un cliente que consume la API por HTTPS.
- Autenticación con **JWT**; contraseñas cifradas con **bcrypt**.

---

## 4. Tecnologías

| Capa | Tecnología |
|---|---|
| Backend / API | Node.js 20 · Express |
| Base de datos | MongoDB (Atlas) · Mongoose |
| Autenticación | JWT (jsonwebtoken) · bcryptjs |
| App móvil | Expo SDK 54 · React Native · expo-router · TypeScript |
| Dashboard web | HTML + JavaScript (servido por Express) |
| Mapas / GPS | OpenStreetMap (Leaflet) · expo-location |
| Integraciones | API RENIEC (apisperu) — autocompletar por DNI |
| Despliegue | Render (backend + web) · APK (EAS / Gradle) |
| Control de versiones | Git · GitHub |

---

## 5. Estructura del repositorio

```
MiResiduosCusco/
├── backend/                  # API REST + dashboard web
│   ├── public/index.html     # Dashboard web de administración
│   ├── src/
│   │   ├── models/           # Usuario, Zona, Ruta, Incidente, Residuo, Alerta
│   │   ├── routes/           # auth, usuarios, zonas, rutas, incidentes, residuos, alertas, dni
│   │   ├── middleware/auth.js # JWT (firmar / verificar / permitir por rol)
│   │   ├── db.js             # conexión a MongoDB
│   │   ├── utils.js          # respuestas { success, message, data }
│   │   ├── seed.js           # datos de prueba
│   │   └── server.js         # punto de entrada
│   └── package.json
├── mobile-app/               # App móvil (Expo)
│   ├── src/
│   │   ├── app/              # pantallas (expo-router): login, register, forgot, (tabs)
│   │   ├── components/MapaOSM.tsx
│   │   └── lib/              # api.ts, auth.tsx, theme.ts
│   ├── assets/logo.svg       # ícono de la app (símbolo de reciclaje)
│   ├── scripts/gen-icons.mjs # genera los íconos desde logo.svg
│   ├── app.json
│   └── package.json
├── docs/                     # ENTREGA_2.md, DIAGRAMAS.md, RAMAS_ASIGNACION.md
└── README.md
```

---

## 6. Requerimientos del sistema

### Requisitos Funcionales

| ID | Requisito | Estado |
|----|-----------|--------|
| RF-01 | Registro de ciudadanos | ✅ |
| RF-02 | Autenticación e inicio de sesión (JWT) | ✅ |
| RF-03 | Gestión de zonas de recolección | ✅ |
| RF-04 | Asignación de usuarios a zonas (detección GPS) | ✅ |
| RF-05 | Registro de tipos de residuos | ✅ |
| RF-06 | Clasificación de residuos por categoría | ✅ |
| RF-07 | Visualización de rutas | ✅ |
| RF-08 | Seguimiento de ubicación de camiones | ✅ |
| RF-09 | Gestión de rutas por el administrador | ✅ |
| RF-10 | Consulta de rutas/horarios (móvil) | ✅ |
| RF-11 | Reporte ciudadano de incidencias (GPS) | ✅ |
| RF-12 | Notificación de cercanía del camión | 🟡 Parcial |
| RF-13 | Alertas de retraso/incidencias | 🟡 Parcial |
| RF-14 | Reporte de residuos por zona | ✅ |
| RF-15 | Reporte de cumplimiento de rutas | 🟡 Parcial |
| RF-16 | Reporte de participación ciudadana | 🟡 Parcial |

### Requisitos No Funcionales
- **RNF-01** Seguridad: contraseñas con bcrypt + JWT.
- **RNF-02** Disponibilidad: backend y BD en la nube (24/7).
- **RNF-03** Usabilidad: interfaz simple y accesible.
- **RNF-04** Rendimiento: respuestas comunes < 3 s.
- **RNF-05** Portabilidad: APK instalable en Android.
- **RNF-06** Privacidad: Ley N.° 29733 (Protección de Datos Personales).
- **RNF-07** Mantenibilidad: código modular + versionado en GitHub.

---

## 7. Requisitos previos (software)
- **Node.js 20+** y **npm 10+**
- Cuenta de **MongoDB Atlas** (gratis)
- Cuenta de **GitHub** y **Render** (gratis)
- Para el APK: **Android Studio / SDK** (build local con Gradle) o cuenta **Expo (EAS)**
- (Opcional) Token de **apisperu** para consulta de DNI

---

## 8. Configurar MongoDB Atlas
1. Crear cuenta en https://www.mongodb.com/cloud/atlas/register
2. Crear un **cluster gratuito M0**.
3. **Database Access** → crear usuario de BD (usuario + contraseña).
4. **Network Access** → *Add IP Address* → **Allow access from anywhere** (`0.0.0.0/0`).
5. **Connect → Drivers** → copiar la cadena de conexión:
   ```
   mongodb+srv://<usuario>:<password>@<cluster>.mongodb.net/miresiduos?retryWrites=true&w=majority
   ```
   > El nombre de la base de datos es **`miresiduos`** (va después de `.net/`). Mongo la crea sola al sembrar.

---

## 9. Backend — ejecución local

```bash
cd backend
npm install
```

Crear el archivo **`backend/.env`** (NO se sube a git):
```env
MONGODB_URI=mongodb+srv://<usuario>:<password>@<cluster>.mongodb.net/miresiduos?retryWrites=true&w=majority
JWT_SECRET=una-cadena-secreta-larga
DNI_API_TOKEN=<token-de-apisperu>   # opcional
PORT=4000
```

Sembrar datos de prueba y arrancar:
```bash
npm run seed     # crea usuarios, zonas, rutas, tipos de residuo
npm start        # API + dashboard en http://localhost:4000
```

---

## 10. Dashboard web
- Servido por el mismo backend en `backend/public/index.html`.
- Local: **http://localhost:4000** · Producción: la URL de Render.
- Ingresar con una cuenta **administradora** (ver credenciales).
- Secciones: Resumen, Usuarios, Zonas, Rutas, Incidencias, Residuos.

---

## 11. App móvil — ejecución y APK

```bash
cd mobile-app
npm install
```

Crear **`mobile-app/.env`**:
```env
# Emulador Android: http://10.0.2.2:4000
# Celular físico (mismo WiFi): http://TU-IP:4000
# Producción: https://<tu-backend>.onrender.com
EXPO_PUBLIC_API_URL=https://<tu-backend>.onrender.com
```

**Desarrollo (Expo Go):**
```bash
npx expo start
```

**Generar APK — opción A (EAS, en la nube):**
```bash
npx eas-cli login
npx eas-cli build --platform android --profile preview
```

**Generar APK — opción B (local con Gradle):**
```bash
npx expo prebuild --platform android --clean
cd android
./gradlew assembleRelease
# APK: android/app/build/outputs/apk/release/app-release.apk
```

**Instalar en el celular:** pasar el `.apk` → abrir → Play Protect *“Más detalles → Instalar de todas formas”*.

---

## 12. Despliegue en Render
1. Subir el repo a GitHub.
2. En **Render** → *New → Web Service* → conectar el repo.
3. Configuración:
   | Campo | Valor |
   |---|---|
   | **Root Directory** | `backend` |
   | **Build Command** | `npm install` |
   | **Start Command** | `npm start` |
   | **Instance Type** | Free |
4. **Environment** → variables:
   ```
   MONGODB_URI = mongodb+srv://...mongodb.net/miresiduos?...
   JWT_SECRET  = una-cadena-secreta-larga
   DNI_API_TOKEN = <token-apisperu>
   ```
5. **Manual Deploy → Deploy latest commit** (o activar Auto-Deploy).

> El plan Free “duerme” tras 15 min de inactividad; la primera petición tarda ~40 s en despertar.

---

## 13. API RENIEC (consulta DNI)
- En el **registro**, el usuario puede autocompletar su nombre escribiendo su DNI.
- Requiere un **token gratuito** de https://apisperu.com/api/dni → configurarlo como `DNI_API_TOKEN` en el backend (local y en Render).
- Si no se configura, el resto del registro funciona igual (el botón avisa que no está disponible).

---

## 14. Credenciales de prueba (seed)

| Rol | Email | Contraseña |
|---|---|---|
| Administrador (SUPER_ADMIN) | `admin@residuos.cusco.gob.pe` | `admin123` |
| Admin municipal | `municipal@residuos.cusco.gob.pe` | `admin123` |
| Operador | `operador1@residuos.cusco.gob.pe` | `operador123` |
| Ciudadano | `ciudadano1@gmail.com` | `ciudadano123` |

---

## 15. Endpoints de la API

Base: `/api`

| Método | Ruta | Descripción | Acceso |
|---|---|---|---|
| POST | `/auth/register` | Registro de ciudadano | Público |
| POST | `/auth/login` | Inicio de sesión (JWT) | Público |
| POST | `/auth/recuperar` | Recuperar contraseña (correo + DNI) | Público |
| POST | `/auth/google` | Inicio de sesión con Google (verifica idToken) | Público |
| GET | `/auth/me` | Perfil del usuario autenticado | Token |
| GET | `/dni/:dni` | Consulta de DNI (RENIEC) | Público |
| GET | `/zonas` | Listar zonas | Público |
| POST | `/zonas/detect` | Detectar zona por lat/lng | Público |
| POST/PUT | `/zonas` `/zonas/:id` | Crear/editar zona | Admin |
| GET | `/rutas` `/rutas/activas` `/rutas/:id` | Listar/ver rutas | Público |
| POST | `/rutas` | Crear ruta | Admin |
| PUT | `/rutas/:id/estado` | Cambiar estado | Operador/Admin |
| PUT | `/rutas/:id/ubicacion` | Actualizar ubicación (GPS) | Operador/Admin |
| GET | `/incidentes` | Listar todos | Admin |
| GET | `/incidentes/mis-reportes` | Mis reportes | Token |
| POST | `/incidentes` | Reportar incidencia | Token |
| PUT | `/incidentes/:id/estado` | Cambiar estado | Admin |
| GET | `/residuos` | Catálogo de residuos | Público |
| GET | `/residuos/reportes` | Reportes por zona/categoría | Admin |
| GET | `/usuarios` | Listar usuarios | Admin |
| PUT | `/usuarios/:id/zona/:zonaId` | Asignar zona | Admin |
| GET | `/alertas/mias` | Mis alertas | Token |

---

## 16. Ramas y flujo de trabajo
- Rama principal: **`main`** (integrada y desplegada).
- Ramas por historia: `feature/HU01-registro-ciudadanos` … `feature/HU08-dashboard-admin`.
- Flujo: trabajar en la rama → commit → push → **Pull Request** a `main` → merge → deploy.
- Detalle y asignación por integrante: ver **`docs/RAMAS_ASIGNACION.md`**.

---

## 17. Solución de problemas

| Problema | Solución |
|---|---|
| `Falta MONGODB_URI` | Crear `backend/.env` con la cadena de Atlas |
| App: “Network error” / primera carga lenta | Backend Free de Render dormido (~40 s); reintentar |
| App no conecta en local | `EXPO_PUBLIC_API_URL` debe usar la IP LAN, no `localhost` |
| Zona “pendiente” al registrar | El punto está fuera de los polígonos; elegir dentro de Cusco o ampliar zonas en el seed |
| DNI: “servicio no configurado” | Falta `DNI_API_TOKEN` en el backend |
| Play Protect bloquea el APK | *Más detalles → Instalar de todas formas* |

---

## 18. Consideraciones éticas y legales
- **Ley N.° 29733** — Protección de Datos Personales (Perú): datos mínimos, contraseñas cifradas, uso de ubicación solo para el servicio.
- **Ley N.° 27314** — Gestión Integral de Residuos Sólidos.
- **NTP 900.058** — código de colores para la segregación de residuos.
- Seguridad: autenticación JWT, control de acceso por rol, secretos fuera del repositorio (en `.env` / variables de Render).

---

## 19. Equipo
Jisbaj Gamarra Salas · Stephan Jhoel Cosio Loaiza · Luz Indira Ticona Felix

**Repositorio:** https://github.com/GamoLG/Gestion-de-Residuos-Cusco
