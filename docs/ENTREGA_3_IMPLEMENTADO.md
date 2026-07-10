# ✅ Entrega 3 — Funcionalidades implementadas

> Estado real del sistema tras implementar el alcance comprometido de la Entrega 3
> (ver [IDEAS_ENTREGA3.md](IDEAS_ENTREGA3.md) y [DISENO_ENTREGA3.md](DISENO_ENTREGA3.md)).

## 1. Interfaces por rol (con color propio)
- Al iniciar sesión, la app **enruta automáticamente** según el rol.
- **Ciudadano (azul):** Inicio · Mapa · Horarios · Incidencias · Segregar · Perfil.
- **Operador/Conductor (verde):** Jornada · Mi Ruta · Horario · Perfil.
- **Administrador (morado):** dashboard web con control total.

## 2. Geolocalización en tiempo real (indispensable ✔)
- **Camión:** el celular con la cuenta del conductor transmite su GPS cada ~8 s
  (`PUT /api/rutas/:id/ubicacion`). El ciudadano y el admin lo ven moverse en vivo.
- **Ciudadano:** mientras mira el mapa, su posición se reporta
  (`PUT /api/usuarios/me/ubicacion`) y el admin la ve en el mapa en vivo del panel
  (`GET /api/usuarios/ubicaciones`, marca "EN VIVO" si reportó hace <30 min).
- **Traza GPS:** cada posición del camión se guarda (`TrazaGPS`, TTL 60 días) y se
  dibuja el **recorrido real** (línea verde) + la **ruta planificada** (línea punteada).
- **Paradas:** verdes = atendidas, grises = pendientes; el conductor las marca en "Mi Ruta".

## 3. Avisos automáticos del camión (geocercas + ETA)
Motor de geocercas en el backend (`src/geocercas.js`), evaluado en cada posición GPS:
- 🔔 **"El camión está próximo"** (≤800 m, con ETA en minutos según velocidad real).
- ✅ **"El camión llegó a tu zona"** (≤200 m).
- ⏭️ **"El camión ya pasó"** (se alejó >600 m tras haber llegado).
- Sin duplicados por jornada; se ven en la pestaña **Horarios** y como banner en Inicio.
- **ETA bajo demanda:** `GET /api/rutas/:id/eta?lat=&lng=` (se muestra sobre el mapa).

## 4. Horarios de recojo por zona
- Colección `Horario` (zona + día + hora + tipo de residuo). CRUD del admin (web).
- El ciudadano ve el calendario de SU zona y la **próxima recolección** destacada.
- El conductor ve su **programación semanal** por zona y sus paradas.

## 5. Perfil editable (todos los usuarios)
- Editar nombre/teléfono/dirección, **cambiar contraseña** (verifica la actual),
  y **actualizar ubicación por GPS** con detección automática de zona.

## 6. Reportes, estadísticas y ranking (admin web)
- KPIs, y reportes con **gráficos** (Chart.js): kg por zona, por contaminante,
  incidencias por zona/estado, participación por mes, **cumplimiento de rutas**.
- **Exportar CSV** e **imprimir/PDF** de cualquier tabla.
- 🏆 **Ranking de zonas más limpias** (índice 0-100) — endpoint **público** `GET /api/reportes/ranking`.
- Registro de **recolecciones en kg** por zona/categoría.

## 7. IA con Google Gemini
- `POST /api/ia/segregar` — chatbot de segregación (texto) y **clasificación de
  residuo por foto** (multimodal). Clave en el backend (`GEMINI_API_KEY`).
- **Fallback sin clave:** clasificador local por palabras clave (la demo nunca falla).
- En la app: pestaña Segregar (pregunta + foto con cámara/galería) y chatbot.

## 8. Chatbot navegador + Soporte WhatsApp
- Asistente por **botones** que lleva a la pantalla correcta (horarios, mapa,
  incidencias, jornada del conductor…) y responde dudas con IA.
- Botón de **WhatsApp de la municipalidad** en Perfil (quejas/soporte).

## 9. Dashboard web admin — control total
- **CRUD completo:** usuarios (crear/rol/zona/activar/clave/eliminar), zonas,
  rutas (+ paradas, operador asignado), horarios, incidencias, residuos.
- **Mapa en vivo** con camiones 🚛, trazas, paradas y ciudadanos (actualiza cada 8 s).
- **Auditoría:** quién creó/editó/eliminó qué y cuándo (`GET /api/auditoria`).
- Filtros de búsqueda en tablas.

## Endpoints nuevos (resumen)
| Método | Ruta | Uso |
|---|---|---|
| GET | /api/rutas/mias | Rutas del operador |
| PUT | /api/rutas/:id/ubicacion | GPS en vivo + geocercas |
| PUT | /api/rutas/:id/paradas/:idx | Marcar parada atendida |
| GET | /api/rutas/:id/traza | Recorrido real |
| GET | /api/rutas/:id/eta | ETA del camión |
| CRUD | /api/horarios | Horarios por zona |
| PUT | /api/usuarios/me · /me/password · /me/ubicacion | Perfil propio |
| POST/PUT/DELETE | /api/usuarios | CRUD admin |
| GET | /api/usuarios/ubicaciones | Posiciones en vivo (admin) |
| GET | /api/reportes/(resumen·recolectado·incidencias·cumplimiento·participacion) | Estadísticas |
| GET | /api/reportes/ranking | Ranking público |
| POST | /api/ia/segregar | IA Gemini (texto/foto) |
| POST | /api/residuos/recoleccion | Registrar kg |
| GET | /api/auditoria | Auditoría |

## ⏭️ Trabajo futuro (documentado, NO implementado)
Modelo de visión propio · predicción ML de generación · optimización de rutas ·
sensores IoT · multi-municipalidad · 2FA. Las notificaciones **push nativas**
(app cerrada) quedan como mejora; hoy los avisos llegan dentro de la app
(banner en Inicio + centro de avisos en Horarios).
