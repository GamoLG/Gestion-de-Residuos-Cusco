# ♻️ Residuos Cusco — Sistema Inteligente de Recolección de Residuos Sólidos

Sistema para la gestión y monitoreo de la recolección de residuos sólidos segregados en la ciudad del Cusco. Incluye una **app móvil (Android/APK)** para los ciudadanos y operadores, y una **API REST** que centraliza la lógica y los datos.

> Proyecto del curso **IF614 – Ingeniería de Software I** · Escuela Profesional de Ing. Informática y de Sistemas · **UNSAAC** · 2026-1.

---

## 📂 Estructura del proyecto

```
MiResiduosCusco/
├── backend/          → API REST (Node.js + Express + MongoDB)
│   └── src/
│       ├── models/   → Usuario, Zona, Ruta, Incidente, Residuo, Alerta
│       ├── routes/   → auth, usuarios, zonas, rutas, incidentes, residuos, alertas, dni
│       ├── middleware/auth.js  → autenticación JWT
│       ├── seed.js   → datos de prueba
│       └── server.js → punto de entrada
└── mobile-app/       → App móvil (Expo + React Native + expo-router)
    └── src/
        ├── app/      → pantallas (login, registro, tabs: inicio, mapa, incidencias, segregar, perfil)
        ├── components/MapaOSM.tsx  → mapa OpenStreetMap
        └── lib/      → api (axios), auth (contexto JWT), theme (tema oscuro/azul)
```

---

## 🧰 Tecnologías

| Capa | Tecnología |
|---|---|
| **Backend** | Node.js 20, Express, Mongoose |
| **Base de datos** | MongoDB Atlas |
| **Autenticación** | JWT (jsonwebtoken) + bcryptjs |
| **App móvil** | Expo SDK 54, React Native, expo-router, TypeScript |
| **Mapas** | OpenStreetMap (Leaflet en WebView) — sin API key |
| **Ubicación** | expo-location (GPS) |
| **Despliegue** | Render (backend) · EAS / Gradle (APK) |
| **Integraciones** | API RENIEC (apisperu) para autocompletar por DNI |

---

## 👥 Roles del sistema
`CIUDADANO` · `OPERADOR_CAMION` · `ADMIN_ZONA` · `ADMIN_MUNICIPAL` · `SUPER_ADMIN`

---

## ✅ Módulos / funcionalidades

1. **Gestión de usuarios y zonas** — registro de ciudadanos, login, detección automática de zona por GPS, asignación de zonas.
2. **Gestión de residuos** — catálogo de tipos y guía de segregación (orgánico, reciclable, no reciclable, peligroso).
3. **Monitoreo de rutas** — visualización de rutas y seguimiento en tiempo real de camiones (ubicación GPS).
4. **App móvil** — consulta de rutas/horarios, reporte de incidencias con ubicación.
5. **Sistema de alertas** — avisos (registro de ciudadanos, próximamente proximidad/retraso).
6. **Reportes y analítica** — volumen de residuos por zona y categoría.

---

## 🚀 Ejecutar en local

### Backend
```bash
cd backend
npm install
# crear archivo .env (ver variables abajo)
npm run seed   # poblar datos de prueba
npm start      # API en http://localhost:4000
```

Variables de entorno (`backend/.env`):
```env
MONGODB_URI=mongodb+srv://USUARIO:PASSWORD@cluster.mongodb.net/miresiduos?retryWrites=true&w=majority
JWT_SECRET=una-cadena-secreta
DNI_API_TOKEN=token-de-apisperu   # opcional (autocompletar DNI)
PORT=4000
```

### App móvil
```bash
cd mobile-app
npm install
# crear .env con EXPO_PUBLIC_API_URL (emulador: http://10.0.2.2:4000)
npx expo start
```

---

## 📦 Despliegue

- **Backend → Render:** Root Directory `backend`, Build `npm install`, Start `npm start`, variables de entorno arriba.
- **App → APK:** se compila con EAS Build o Gradle local; la URL del backend se inyecta con `EXPO_PUBLIC_API_URL`.

---

## 🔑 Credenciales de prueba (seed)

| Rol | Email | Contraseña |
|---|---|---|
| Administrador | `admin@residuos.cusco.gob.pe` | `admin123` |
| Admin municipal | `municipal@residuos.cusco.gob.pe` | `admin123` |
| Operador | `operador1@residuos.cusco.gob.pe` | `operador123` |
| Ciudadano | `ciudadano1@gmail.com` | `ciudadano123` |

---

## 🔒 Consideraciones éticas y legales
- Cifrado de contraseñas (bcrypt) y autenticación por token (JWT).
- Manejo de datos personales conforme a la **Ley N.° 29733 – Protección de Datos Personales (Perú)**.
- Clasificación de residuos alineada al enfoque de la **NTP 900.058** (código de colores).

---

*Equipo: Jisbaj Gamarra Salas · Stephan Jhoel Cosio Loaiza · Luz Indira Ticona Felix.*
