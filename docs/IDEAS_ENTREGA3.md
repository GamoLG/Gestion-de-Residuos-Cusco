# Visión y Mejoras — Entrega 3 (Residuos Cusco)

> Documento de ideas (no implementado aún). Integra las propuestas del equipo + mejoras sugeridas.
> Objetivo: llevar el sistema del 50% (Entrega 2) al 100% funcional y pulido para la entrega final.

---

## 1. Interfaces diferenciadas por rol (con color propio)

Cada rol tendría su **color de acento** para reconocerlo de un vistazo:

| Rol | Color de acento | Idea visual |
|-----|-----------------|-------------|
| Ciudadano | Azul `#58a6ff` | Limpio, informativo |
| Operador / Conductor | Verde `#3fb950` | "En ruta", operativo |
| Administrador | Morado `#a371f7` | Gestión / control |

Al iniciar sesión, la app enruta automáticamente a la interfaz del rol.

### 👤 Ciudadano — pestañas: Inicio · Mapa · Horarios · Incidencias · Segregar · Perfil
- **Inicio:** saludo, su zona, próxima recolección, estado del camión.
- **Mapa:** camión en vivo con **línea de su ruta** y paradas; "mapa de calor" de basura/incidencias.
- **Horarios:** calendario por día y tipo de residuo de SU zona; recordatorios.
- **Incidencias:** reportar (foto + GPS) y seguimiento de "mis reportes".
- **Segregar:** guía visual (orgánico/reciclable/no reciclable/peligroso).
- **Perfil:** **editar datos**, cambiar contraseña, foto.

### 🚛 Operador / Conductor — pestañas: Jornada · Mi Ruta · Horario · Perfil
- **Jornada:** rutas asignadas; "Iniciar jornada" → ruta EN_PROGRESO.
- **Mi Ruta:** mapa con paradas + **transmitir ubicación GPS** (el ciudadano lo ve moverse); marcar paradas atendidas; "Finalizar ruta".
- **Horario:** **qué días y a qué hora** le toca cada ruta/lugar (programación semanal).
- **Perfil:** editar datos, cerrar sesión.

### 🛠️ Administrador — pestañas: Resumen · Rutas · Incidencias · Usuarios · Reportes
- **Poder total (CRUD):** crear/editar/**eliminar** usuarios, zonas, rutas, residuos, incidencias.
- **Reportes y estadísticas** (ver sección 4).
- También disponible en el **dashboard web** (ya existe).

---

## 2. Horarios de recolección y avisos del camión

- Cada **zona** tiene **horarios** de recojo (día + hora + tipo de residuo).
- El ciudadano ve el horario de su zona y puede activar **recordatorios**.
- Estados del camión que se le avisan automáticamente:
  - 🔔 **"El camión está próximo"** (a menos de X metros / Y minutos).
  - ✅ **"El camión llegó a tu zona"**.
  - ⏭️ **"El camión ya pasó"** (para que sepa que debe esperar al próximo).
  - ⚠️ **"Retraso en tu ruta"** (cambio de horario).

---

## 3. Camión en vivo + línea de ruta (mapa más bonito)

- El camión se mueve en el mapa en tiempo real (ya hay base con GPS).
- Dibujar la **línea/polilínea de la ruta** (recorrido planificado) y las paradas.
- Marcar paradas **atendidas** (verde) vs **pendientes** (gris).
- "Mapa de calor": dónde hay **más basura/incidencias** y **dónde no hubo recojo**.

---

## 4. Reportes y estadísticas (Administrador)

Generar y **exportar (PDF/Excel)**:
- Residuos recolectados **por zona** y **por tipo de contaminante** (orgánico, reciclable, etc.).
- **Incidencias** por zona, por tipo y por estado (pendiente/resuelto).
- **Cumplimiento de rutas** (planificadas vs ejecutadas, paradas omitidas).
- **Participación ciudadana** (registros, reportes, uso de la app).
- Gráficos: barras, líneas, torta.

### Ranking de distritos más limpios (visible a TODOS)
- Tabla/ranking público de **qué distritos están más limpios** (según incidencias, cumplimiento de rutas y participación). Fomenta la competencia sana entre zonas.

---

## 5. Edición de perfil (todos los usuarios)
- Cada usuario puede **editar sus datos** (nombre, teléfono, dirección, foto) y **cambiar contraseña**.
- El ciudadano puede actualizar su **ubicación/zona**.

---

## 6. Componente de IA (realista para el curso)

Ideas de IA aplicables (de menor a mayor dificultad):

1. **ETA del camión (predicción de llegada):** estimar en cuántos minutos llega a tu domicilio según la velocidad y posición actual del camión → dispara el aviso "está próximo". *(Modelo simple de regresión / cálculo de distancia-tiempo.)*
2. **Detección automática de "ya pasó / ya llegó":** comparar la posición del camión con la del ciudadano (geocercas) y notificar automáticamente. *(Geolocalización + reglas; opcionalmente un modelo.)*
3. **Zonas críticas (clustering):** agrupar incidencias para predecir **dónde se acumula más basura** y sugerir reforzar el recojo. *(K-means / DBSCAN sobre coordenadas de incidencias.)*
4. **Clasificación de residuos por foto:** el ciudadano toma una foto y la IA dice si es orgánico/reciclable/etc. *(Modelo de visión — más avanzado.)*
5. **Chatbot de segregación:** responde "¿dónde va este residuo?". *(Reglas + búsqueda, o un LLM.)*

> Para la entrega, lo más alcanzable y vistoso: **ETA + avisos automáticos de proximidad** y **mapa de calor de zonas críticas**.

---

## 7. Notificaciones push (automáticas)
- Avisos reales aunque la app esté cerrada (camión próximo, llegó, pasó, retraso).
- Requiere notificaciones push (Expo Notifications) + un disparador en el backend cuando el camión entra en la geocerca del ciudadano.

---

## 8. Más ideas de mejora (extra)

- **Modo offline:** ver horarios y guía de segregación sin internet (caché).
- **Multilenguaje español/quechua** (inclusión, alineado a la zona).
- **Accesibilidad:** texto grande, alto contraste, lectura por voz (para adultos mayores).
- **Gamificación:** puntos/insignias por reciclar o reportar; ranking de ciudadanos.
- **Calificar el servicio:** el ciudadano califica el recojo (1-5 estrellas) → métrica de satisfacción.
- **Confirmación de recojo:** el ciudadano confirma "sí pasó el camión" → valida el cumplimiento real.
- **Historial:** del ciudadano (sus reportes), del conductor (sus rutas), del admin (auditoría de cambios).
- **Auditoría:** registro de quién creó/editó/eliminó qué (para el admin).
- **Filtros y búsqueda** en las tablas del dashboard.
- **Verificación de cuenta por correo** (código), recuperación por correo real.
- **Vehículos/flota:** registrar camiones, placa, capacidad, asignación a rutas.
- **Despachos/turnos:** asignar conductor + vehículo + ruta por turno (mañana/tarde).
- **Exportación e impresión** de reportes para la municipalidad.

---

## 9. Priorización sugerida para la Entrega 3

**Alta (impacto + vistoso):**
1. Interfaz de **operador** (jornada + transmitir GPS) y colores por rol.
2. **Horarios** por zona + **avisos** del camión (próximo/llegó/pasó).
3. **Camión en vivo con línea de ruta** en el mapa.
4. **Reportes/estadísticas** del admin (con exportación) + ranking de distritos.
5. **Editar perfil** (todos).

**Media:**
6. Notificaciones **push** automáticas.
7. **Mapa de calor** de zonas críticas (IA/clustering).
8. **ETA** del camión (IA).

**Opcional (suma puntos):**
9. Gamificación, multilenguaje (quechua), calificación del servicio, modo offline.

---

## 10. Resumen de una frase
Pasar de "ver rutas y reportar" a una **plataforma viva**: el ciudadano sabe **cuándo llega su camión**, el conductor **transmite su recorrido**, y la municipalidad **decide con datos** (estadísticas, rankings y zonas críticas) — todo diferenciado por rol y con avisos automáticos.

---

## 11. Asistente / Chatbot navegador (con IA)
Un **chatbot** dentro de la app que, mediante preguntas, **lleva al usuario directo a la pantalla** que necesita.
- Hace preguntas simples y, según la respuesta, **abre la interfaz correspondiente**.
- Ejemplos:
  - "¿Quieres saber cuándo pasa el camión?" → abre **Horarios / Mapa**.
  - "¿Quieres reportar basura?" → abre **Incidencias** (con la cámara y GPS listos).
  - "¿Dudas de dónde va un residuo?" → abre **Segregar** o responde al instante.
  - "¿Eres conductor y quieres iniciar tu jornada?" → abre **Jornada**.
- Pensado también para **adultos mayores** (lenguaje simple, opción por voz).
- Implementación: reglas/intenciones + navegación (expo-router), opcionalmente con un LLM para entender lenguaje natural.

---

## 12. Dashboard web del Administrador — control total
El admin **controla todo** desde la web (centralizado y completo):
- **CRUD total:** usuarios, zonas, rutas, vehículos, residuos, incidencias (crear/editar/**eliminar**).
- **Reportes de TODO** lo conveniente: por zona, por contaminante, por incidencia, por conductor/vehículo, cumplimiento de rutas, participación ciudadana, impacto ambiental.
- **Exportación** PDF/Excel/CSV e **impresión** para la municipalidad.
- **Dashboards en vivo:** camiones activos ahora, incidencias pendientes, KPIs.
- **Auditoría:** registro de quién creó/editó/eliminó qué y cuándo.
- **Gestión de horarios** de recojo por zona y **asignación de turnos** a conductores.

---

## 13. Ayuda y Soporte (WhatsApp)
- Sección **"Ayuda / Soporte"** en la app y en la web.
- **Número de WhatsApp** de la municipalidad para **quejas, soporte y consultas**, con botón directo (abre el chat de WhatsApp).
- Complementos: **FAQ** (preguntas frecuentes) y **correo/teléfono** de contacto.
- Las **quejas** pueden registrarse también como incidencia para darles seguimiento.

---

## 14. Ideas adicionales (recopilación)

### Reportes (ampliados)
- **Reportes programados** (semanal/mensual) enviados por correo al admin.
- **Comparativos** entre periodos y entre zonas.
- **Impacto ambiental:** kg reciclados, CO₂ evitado, % de segregación correcta.
- Reporte **por conductor y por vehículo**.
- **Datos abiertos (Open Data)** para transparencia.

### Mapa y operación
- **Puntos de acopio / contenedores** en el mapa.
- **Optimización de rutas** (recorrido más eficiente).
- **Nivel de llenado de contenedores** (sensores IoT — a futuro).
- **Foto de evidencia** del conductor al completar una parada.

### Ciudadano
- **Solicitar recojo especial** (voluminosos, escombros) — agendar.
- **QR en contenedores** para reportar al instante.
- **Encuestas de satisfacción** del servicio.
- **Novedades/campañas** municipales (jornadas de limpieza).

### Educación / participación
- **Quizzes y videos** de reciclaje; buscador "¿dónde va este residuo?".
- **Gamificación con recompensas** (puntos, insignias, posibles beneficios).

### Seguridad y gestión
- **Verificación en 2 pasos (2FA)** y verificación de correo real.
- **Multi-municipalidad:** escalar a otros distritos.

### IA (más opciones)
- **Predicción de generación de residuos** por zona (planificación).
- **Detección de puntos críticos** (basurales recurrentes) con alerta al admin.
- **Asistente por voz** para accesibilidad.

---

## 15. Alcance realista de la Entrega 3 (decisión del equipo)

Para una entrega **sólida y defendible**, nos enfocamos en lo viable y vistoso. Mejor pocas cosas bien hechas.

### ✅ SÍ se hace (alcance comprometido)
| Función | Dificultad |
|---|---|
| Interfaz de **Operador** + **colores por rol** | 🟢 Fácil |
| **Horarios** por zona + **línea de ruta** en el mapa | 🟢 Fácil |
| **Editar perfil** (todos los usuarios) | 🟢 Fácil |
| **Reportes + estadísticas + ranking** de distritos | 🟡 Medio |
| **WhatsApp soporte** + **chatbot por botones** | 🟢 Fácil |
| **Notificaciones push** del camión (próximo/llegó/pasó) | 🟡 Medio (requiere celular real) |
| **IA con Gemini:** chatbot de segregación + **clasificar residuo por foto** | 🟡 Medio (API gratuita) |

### 🤖 IA elegida: **Google Gemini API** (gratis, multimodal)
- Una sola clave cubre **chatbot** (texto) y **clasificación por foto** (imagen).
- La clave va en el **backend** (`GEMINI_API_KEY`), nunca en la app.
- Endpoint: `POST /api/ia/segregar` (recibe pregunta o foto → responde categoría/consejo).
- Obtener clave gratis: https://aistudio.google.com

### ⏭️ Trabajo futuro (NO en esta entrega — muy complejo)
- Modelo de **visión entrenado** propio (usamos Gemini en su lugar).
- **Predicción ML** de generación de residuos (faltan datos históricos).
- **Optimización de rutas** (algoritmo).
- **Sensores IoT** de llenado de contenedores (requiere hardware).
- **Multi-municipalidad** (rediseño multi-tenant).
- **2FA** y verificación avanzada.

> Estas quedan documentadas como **mejoras a futuro**: suman valor en el informe sin arriesgar la entrega.
