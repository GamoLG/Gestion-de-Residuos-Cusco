# Sistema Inteligente de Recolección de Residuos Sólidos Segregados — Cusco
## Documentación — Entrega N.° 2 (Capítulo I mejorado, Capítulo II y bosquejo del Capítulo III)

**Asignatura:** IF614 – Ingeniería de Software I · **Escuela Profesional de Ing. Informática y de Sistemas – UNSAAC** · 2026-1
**Atributo del graduado:** AG-C01 — El Profesional y el Mundo
**Metodología:** SCRUM
**Equipo:** Jisbaj Gamarra Salas · Stephan Jhoel Cosio Loaiza · Luz Indira Ticona Felix

---

# CAPÍTULO I — DATOS GENERALES DEL PROYECTO

## 1.1. Título del proyecto
Diseño e Implementación de un Sistema Inteligente de Recolección de Residuos Sólidos Segregados para la Gestión Ambiental Urbana en la ciudad del Cusco.

## 1.2. Objetivo general y específicos

**Objetivo general:**
Diseñar e implementar un sistema inteligente de gestión de residuos sólidos segregados que optimice la recolección, mejore la comunicación con los ciudadanos y genere información estratégica para la toma de decisiones en la gestión ambiental urbana, aplicando la metodología ágil SCRUM.

**Objetivos específicos:**
1. Desarrollar un módulo de gestión de usuarios y zonas con registro de ciudadanos y asignación geográfica (detección por GPS).
2. Implementar un catálogo de tipos de residuos con guía de segregación (orgánico, reciclable, no reciclable, peligroso).
3. Construir el monitoreo de rutas con seguimiento de la ubicación de los camiones recolectores.
4. Ofrecer una aplicación móvil para que el ciudadano consulte rutas y reporte incidencias con geolocalización.
5. Proveer un sistema de alertas y un módulo de reportes para la municipalidad.

## 1.3. Alcance del sistema
El sistema permite a la municipalidad y a los ciudadanos del Cusco gestionar el proceso de recolección de residuos sólidos segregados. Comprende: administración de usuarios y zonas, catálogo de residuos, monitoreo de rutas, aplicación móvil ciudadana, sistema de alertas y módulo de reportes.
**Fuera de alcance:** instalación de hardware IoT en contenedores, pasarelas de pago e integración con sistemas tributarios municipales.

## 1.4. Justificación del proyecto
La gestión de residuos en el Cusco presenta rutas no optimizadas, escasa comunicación con la población y baja cultura de segregación, lo que genera acumulación de residuos y afecta la salubridad y la sostenibilidad ambiental. Una solución digital con monitoreo, comunicación ciudadana y analítica contribuye al desarrollo sostenible (impacto ambiental y social) y a una gestión municipal más eficiente y transparente.

## 1.5. Tecnologías utilizadas

| Capa | Tecnología |
|---|---|
| Backend / API | Node.js 20 + Express |
| Base de datos | MongoDB (MongoDB Atlas) + Mongoose |
| Autenticación | JWT (jsonwebtoken) + bcryptjs |
| Aplicación móvil | Expo SDK 54 + React Native + expo-router (TypeScript) |
| Dashboard web | HTML + JavaScript (servido por el backend) |
| Mapas / GPS | OpenStreetMap (Leaflet) + expo-location |
| Integraciones | API RENIEC (apisperu) para autocompletar por DNI |
| Despliegue | Render (backend + web) · APK (Android) |
| Gestión / colaboración | GitHub (control de versiones) |

## 1.6. Roles del equipo Scrum

| Rol | Integrante | Funciones |
|---|---|---|
| **Product Owner** | *(definir)* | Prioriza el Product Backlog, define criterios de aceptación, representa al cliente (municipalidad/ciudadanía). |
| **Scrum Master** | *(definir)* | Facilita el proceso, remueve impedimentos, asegura las ceremonias Scrum. |
| **Developers** | *(equipo)* | Diseñan e implementan backend, app móvil y dashboard; pruebas y despliegue. |

*(Asignar los nombres del equipo a cada rol.)*

## 1.7. Público objetivo del sistema
- **Ciudadanos** del Cusco (consultan rutas/horarios, reciben alertas, reportan incidencias, aprenden a segregar).
- **Operadores municipales** (ejecutan rutas y reportan su ubicación).
- **Administradores municipales** (gestionan zonas, rutas, usuarios y consultan reportes).

---

# CAPÍTULO II — MÉTODO SCRUM APLICADO

## 2.1. Product Backlog

### Requisitos Funcionales (priorizado)

| ID | Requisito funcional | Módulo | Prioridad | Estado |
|----|---------------------|--------|-----------|--------|
| RF-01 | Registro de ciudadanos | Usuarios y zonas | Alta | ✅ |
| RF-02 | Autenticación e inicio de sesión (JWT) | Usuarios y zonas | Alta | ✅ |
| RF-03 | Gestión de zonas de recolección | Usuarios y zonas | Alta | ✅ |
| RF-04 | Asignación de usuarios a zonas (detección GPS) | Usuarios y zonas | Media | ✅ |
| RF-05 | Registro de tipos de residuos | Gestión de residuos | Media | ✅ |
| RF-06 | Clasificación de residuos por categoría | Gestión de residuos | Alta | ✅ |
| RF-07 | Visualización de rutas de recolección | Monitoreo de rutas | Alta | ✅ |
| RF-08 | Seguimiento de ubicación de camiones | Monitoreo de rutas | Alta | ✅ |
| RF-09 | Gestión de rutas por el administrador | Monitoreo de rutas | Alta | ✅ |
| RF-10 | Consulta de rutas/horarios (app móvil) | Aplicación móvil | Alta | ✅ |
| RF-11 | Reporte ciudadano de incidencias (con GPS) | Aplicación móvil | Alta | ✅ |
| RF-12 | Notificación de cercanía del camión | Sistema de alertas | Alta | 🟡 Parcial |
| RF-13 | Alertas de retraso o incidencias | Sistema de alertas | Media | 🟡 Parcial |
| RF-14 | Reporte de residuos recolectados por zona | Reportes y analítica | Alta | ✅ |
| RF-15 | Reporte de cumplimiento de rutas | Reportes y analítica | Media | 🟡 Parcial |
| RF-16 | Reporte de participación ciudadana | Reportes y analítica | Media | 🟡 Parcial |

### Requisitos No Funcionales

| ID | Requisito no funcional |
|----|------------------------|
| RNF-01 | Seguridad: contraseñas cifradas (bcrypt) y autenticación por token JWT. |
| RNF-02 | Disponibilidad: backend y base de datos desplegados en la nube (acceso 24/7). |
| RNF-03 | Usabilidad: interfaz simple y accesible para todas las edades. |
| RNF-04 | Rendimiento: respuestas de la API < 3 s en operaciones comunes. |
| RNF-05 | Portabilidad: app instalable en Android (APK). |
| RNF-06 | Privacidad: cumplimiento de la Ley N.° 29733 de Protección de Datos Personales. |
| RNF-07 | Mantenibilidad: código modular (rutas, modelos, middleware) y versionado en GitHub. |

## 2.2. Sprints realizados

**Número total de sprints:** 3 · **Duración:** 2 semanas cada uno.

| Sprint | Objetivo | Entregables |
|--------|----------|-------------|
| **Sprint 1** | Base del sistema: autenticación y gestión de usuarios/zonas | API de auth (registro/login JWT), modelo de datos, gestión de zonas, detección por GPS |
| **Sprint 2** | Núcleo operativo: rutas, residuos e incidencias | CRUD de rutas + ubicación, catálogo de residuos, reporte de incidencias, app móvil (login, registro, inicio, mapa, incidencias) |
| **Sprint 3** | Cierre: alertas, reportes, dashboard web y despliegue | Alertas, reportes por zona/categoría, dashboard web admin, despliegue en la nube y generación del APK |

## 2.3. Herramientas de colaboración utilizadas
- **GitHub** — control de versiones y repositorio del proyecto.
- **Render** — despliegue del backend y dashboard web.
- **MongoDB Atlas** — base de datos en la nube.
- **Expo / EAS** — desarrollo y compilación de la app móvil (APK).
- *(Opcional: Trello/Notion para el tablero Scrum, Figma para prototipos.)*

---

# CAPÍTULO III — DESARROLLO POR SPRINT (BOSQUEJO)

> Esta sección se repite por cada sprint. A continuación, la estructura y el bosquejo del contenido.

## [Sprint 1] — Autenticación y gestión de usuarios/zonas
- **3.1 Objetivo del sprint:** habilitar registro/login seguro y la gestión de zonas con asignación por ubicación.
- **3.2 Sprint planning:**
  - Historias propuestas: RF-01, RF-02, RF-03, RF-04.
  - Historias completadas: RF-01, RF-02, RF-03, RF-04.
  - Tareas: modelo Usuario/Zona, hash de contraseñas, emisión de JWT, endpoint de detección de zona (punto-en-polígono).
- **3.3 Resultados y entregables:** API de autenticación funcional; seed de datos de prueba.
- **3.4 Capturas:** pantalla de login y registro (app), respuesta de la API.
- **3.5 Diagramas UML:** *(insertar)* casos de uso (Módulo 1), diagrama de clases (Usuario, Zona).
- **3.6 Daily Scrums:** *(resumen de seguimiento).*
- **3.7 Sprint Review:** se valida login/registro; feedback: agregar autocompletar por DNI.
- **3.8 Sprint Retrospective:** mejorar pruebas del endpoint de zonas.

## [Sprint 2] — Rutas, residuos e incidencias + app móvil
- **3.1 Objetivo:** núcleo operativo y primeras pantallas móviles.
- **3.2 Planning:** RF-05, RF-06, RF-07, RF-08, RF-09, RF-10, RF-11.
- **3.3 Entregables:** CRUD de rutas + ubicación, catálogo de residuos, incidencias con GPS, app móvil navegable.
- **3.4 Capturas:** mapa de rutas, registro de incidencia.
- **3.5 Diagramas:** casos de uso (Módulos 2-4), secuencia (reporte de incidencia), actividades (registro).
- **3.7 Review:** se valida reporte de incidencias; feedback: detección de zona en el registro.
- **3.8 Retrospective:** unificar el formato de respuestas de la API.

## [Sprint 3] — Alertas, reportes, web y despliegue
- **3.1 Objetivo:** cerrar funcionalidades y desplegar.
- **3.2 Planning:** RF-12 a RF-16, dashboard web, despliegue, APK.
- **3.3 Entregables:** alertas, reportes por zona/categoría, dashboard web admin, backend en Render, APK Android.
- **3.4 Capturas:** dashboard web, APK instalado.
- **3.5 Diagramas:** componentes (arquitectura), despliegue.
- **3.7 Review:** demostración del sistema completo (web + móvil).
- **3.8 Retrospective:** documentar y preparar la exposición.

---

# PENDIENTE PARA COMPLETAR (antes de entregar)
- [ ] Asignar nombres a los roles Scrum (1.6).
- [ ] Insertar **diagramas UML** (casos de uso, clases, secuencia, actividades, componentes).
- [ ] Insertar **diagrama Entidad-Relación / modelo de datos**.
- [ ] Insertar **capturas de pantalla** reales (app, dashboard).
- [ ] Evidencias de Scrum (tablero, daily, reviews) — Anexos.
- [ ] Análisis de impacto sostenible (AG-C01.1) y lista de normas/leyes (AG-C01.2).
