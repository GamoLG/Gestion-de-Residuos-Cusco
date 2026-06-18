# Diseño técnico — Entrega 3 (Residuos Cusco)

> Bosquejo para el Capítulo III: base de datos robusta, diagramas (casos de uso por rol, chatbot, avisos del camión) y flujos de Google y recuperación de contraseña con verificación de identidad.
> Diagramas en **Mermaid** (se ven en GitHub).

---

## 1. Base de datos más robusta (nuevas colecciones)

MongoDB sigue siendo adecuado (escala bien y soporta índices geoespaciales). Lo "robusto" es **un esquema más completo**, no cambiar de motor.

| Colección | Para qué | Campos clave nuevos |
|---|---|---|
| **Usuario** | Personas | foto, verificado, googleId, ultimoAcceso |
| **Zona** | Sectores | geometry (polígono), color |
| **Horario** | Recojo por zona | zona, diaSemana, hora, tipoResiduo |
| **Ruta** | Recorrido | paradas[], polilínea (LineString), zona, operador, vehiculo |
| **Vehiculo** | Flota | placa, tipo, capacidadKg, activo |
| **Despacho/Turno** | Asignación | ruta, conductor, vehiculo, fecha, turno (AM/PM) |
| **EjecucionRuta** | Jornada real | ruta, inicio, fin, estado, distanciaKm |
| **TrazaGPS** | Historial de posiciones | ejecucion, [lng,lat], timestamp (índice TTL) |
| **Incidente** | Reportes | foto, evidencia, prioridad |
| **Residuo (catálogo)** | Tipos | categoria, color, instrucciones (es/qu) |
| **RegistroRecoleccion** | Volúmenes | zona, tipo, pesoKg, fecha (para reportes) |
| **Alerta/Notificacion** | Avisos | tipo (PROXIMIDAD/LLEGO/PASO/RETRASO), leida, pushToken |
| **Confirmacion** | Ciudadano confirma/califica | ejecucion, usuario, califico (1-5) |
| **SolicitudRecuperacion** | Recuperar contraseña | usuario, dni, estado, verificadoPor, fotoDni |
| **Auditoria** | Quién cambió qué | actor, accion, entidad, antes/después, fecha, ip |

Índices: `2dsphere` en Zona.geometry y TrazaGPS; índice por zona/fecha en RegistroRecoleccion; TTL en TrazaGPS (ej. 60 días).

### Modelo Entidad-Relación (resumen)
```mermaid
erDiagram
  USUARIO ||--o{ INCIDENTE : reporta
  USUARIO }o--|| ZONA : pertenece
  ZONA ||--o{ HORARIO : tiene
  ZONA ||--o{ RUTA : cubre
  RUTA ||--o{ DESPACHO : programa
  USUARIO ||--o{ DESPACHO : conduce
  VEHICULO ||--o{ DESPACHO : usa
  DESPACHO ||--|| EJECUCIONRUTA : genera
  EJECUCIONRUTA ||--o{ TRAZAGPS : registra
  EJECUCIONRUTA ||--o{ CONFIRMACION : recibe
  USUARIO ||--o{ ALERTA : recibe
  ZONA ||--o{ REGISTRORECOLECCION : acumula
  USUARIO ||--o{ SOLICITUDRECUPERACION : solicita
  USUARIO ||--o{ AUDITORIA : ejecuta
```

---

## 2. Casos de uso por rol
```mermaid
flowchart LR
  C([Ciudadano]); O([Operador]); A([Administrador])
  subgraph App_y_Web
    U1((Registrarse / Google))
    U2((Editar perfil))
    U3((Ver horarios y mapa))
    U4((Recibir avisos del camión))
    U5((Reportar incidencia))
    U6((Chatbot navegador))
    U7((Iniciar jornada / transmitir GPS))
    U8((Ver su horario y rutas))
    U9((Gestionar todo: CRUD))
    U10((Generar reportes / estadísticas))
    U11((Verificar identidad / recuperar cuentas))
  end
  C-->U1; C-->U2; C-->U3; C-->U4; C-->U5; C-->U6
  O-->U7; O-->U8; O-->U2
  A-->U9; A-->U10; A-->U11; A-->U2
```

---

## 3. Flujo del Chatbot navegador
```mermaid
flowchart TD
  Start([Usuario abre el chatbot]) --> Q{¿Qué necesitas?}
  Q -->|Cuándo pasa el camión| H[Abre Horarios / Mapa]
  Q -->|Reportar basura| I[Abre Incidencias con cámara + GPS]
  Q -->|Dónde va un residuo| S[Abre Segregar o responde]
  Q -->|Soy conductor| J[Abre Jornada]
  Q -->|Ayuda / queja| W[Abre Soporte / WhatsApp]
  Q -->|No entiende| L[IA interpreta lenguaje natural] --> Q
```

---

## 4. Flujo de avisos del camión (próximo / llegó / pasó)
```mermaid
sequenceDiagram
  participant Op as Operador (app)
  participant API
  participant Geo as Motor de geocercas
  participant Ciu as Ciudadano (push)
  Op->>API: Envía ubicación GPS (cada 8s)
  API->>Geo: ¿El camión entró/salió de la zona del ciudadano?
  Geo-->>API: Distancia y estado
  alt A menos de 500 m
    API->>Ciu: 🔔 "El camión está próximo (ETA X min)"
  else Dentro de la zona
    API->>Ciu: ✅ "El camión llegó"
  else Se alejó tras pasar
    API->>Ciu: ⏭️ "El camión ya pasó"
  end
```

---

## 5. Vincular cuenta de Google
```mermaid
sequenceDiagram
  participant App
  participant Google
  participant API
  App->>Google: Iniciar sesión (OAuth)
  Google-->>App: idToken (email, nombre)
  App->>API: POST /auth/google { idToken }
  API->>Google: Verifica idToken
  alt Email ya existe
    API->>API: Vincula googleId al usuario existente
  else Email nuevo
    API->>API: Crea usuario (rol Ciudadano)
  end
  API-->>App: token (JWT) + perfil
```
- Vinculación por **correo**: si el correo de Google ya está registrado, se enlaza (`googleId`) a esa cuenta; si no, se crea una nueva.
- Requiere credenciales OAuth (Google Cloud): Client ID Web (backend) y Android (con SHA-1).

---

## 6. Recuperación de contraseña + verificación de identidad

Hay **dos enfoques** (se pueden combinar):

### Opción A — Autoservicio por correo (RECOMENDADA, más segura y sin carga al admin)
```mermaid
sequenceDiagram
  participant U as Usuario
  participant API
  participant Mail as Correo
  U->>API: "Olvidé mi contraseña" (ingresa su correo)
  API->>Mail: Envía código de 6 dígitos (válido 15 min)
  U->>API: Ingresa el código + nueva contraseña
  API->>API: Verifica código y actualiza contraseña
  API-->>U: Contraseña actualizada
```
- **Identidad = control del correo** (estándar en la industria). No necesita al admin.

### Opción B — Mediada por el Administrador (lo que planteaste)
```mermaid
sequenceDiagram
  participant U as Usuario
  participant API
  participant Adm as Admin (panel web)
  participant RENIEC
  U->>API: Solicita recuperación (correo + DNI + foto DNI opcional)
  API->>API: Crea SolicitudRecuperacion (estado: pendiente)
  Adm->>API: Ve la solicitud en el panel
  API->>RENIEC: Verifica DNI (nombre real)
  Adm->>Adm: Compara: DNI ✔, nombre ✔, correo/teléfono ✔, foto ✔
  alt Identidad confirmada
    Adm->>API: Aprueba
    API->>U: Envía contraseña temporal al correo (cambiar al ingresar)
  else No coincide
    Adm->>API: Rechaza (motivo)
  end
```

### ¿Cómo se verifica la identidad? (para devolver la cuenta)
El admin (o el sistema) confirma con **varios factores**:
1. **DNI vs RENIEC:** el DNI ingresado debe coincidir con el **nombre real** (API RENIEC ya integrada) y con el DNI registrado en la cuenta.
2. **Datos registrados:** correo y/o teléfono deben coincidir con los de la cuenta.
3. **Foto del DNI** (opcional): el usuario sube una foto; el admin la compara.
4. **Preguntas de seguridad** (opcional): definidas al registrarse.
5. Tras aprobar, **nunca** se muestra la contraseña anterior: se genera una **contraseña temporal** y se obliga a cambiarla en el primer ingreso.

> Recomendación: usar **Opción A (código por correo)** como principal (segura y automática) y dejar la **Opción B** solo para casos especiales (usuario sin acceso a su correo), con verificación por DNI/RENIEC + foto.

---

## 7. Notas de seguridad
- Los códigos/temporales **expiran** (15 min) y son de **un solo uso**.
- Toda acción del admin queda en **Auditoría** (quién aprobó qué recuperación).
- Las contraseñas siempre **cifradas (bcrypt)**; nunca se guardan ni muestran en texto plano.
