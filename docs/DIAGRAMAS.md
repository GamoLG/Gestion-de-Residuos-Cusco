# Diagramas UML y Modelo de Datos — Residuos Cusco

> Diagramas en **Mermaid** y **PlantUML** (listos para insertar en el informe).
> Mermaid se renderiza directo en GitHub. PlantUML: pegar en https://www.plantuml.com/plantuml

---

## 1. Diagrama de Casos de Uso (Mermaid)

```mermaid
flowchart LR
  Ciudadano([Ciudadano])
  Operador([Operador de camión])
  Admin([Administrador municipal])

  subgraph Sistema[Sistema Residuos Cusco]
    UC1((Registrarse))
    UC2((Iniciar sesión))
    UC3((Consultar rutas/horarios))
    UC4((Ver camiones en el mapa))
    UC5((Reportar incidencia))
    UC6((Aprender a segregar))
    UC7((Actualizar ubicación del camión))
    UC8((Gestionar zonas))
    UC9((Gestionar rutas))
    UC10((Asignar usuarios a zonas))
    UC11((Gestionar incidencias))
    UC12((Ver reportes))
  end

  Ciudadano --> UC1
  Ciudadano --> UC2
  Ciudadano --> UC3
  Ciudadano --> UC4
  Ciudadano --> UC5
  Ciudadano --> UC6
  Operador --> UC2
  Operador --> UC7
  Admin --> UC2
  Admin --> UC8
  Admin --> UC9
  Admin --> UC10
  Admin --> UC11
  Admin --> UC12
```

---

## 2. Diagrama de Clases / Modelo de Dominio (Mermaid)

```mermaid
classDiagram
  class Usuario {
    +ObjectId id
    +String nombre
    +String email
    +String password
    +String dni
    +String telefono
    +String direccion
    +Number latitud
    +Number longitud
    +String rol
    +Boolean activo
  }
  class Zona {
    +ObjectId id
    +String nombre
    +String descripcion
    +String distrito
    +String color
    +GeoJSON geometry
    +Boolean activo
  }
  class Ruta {
    +ObjectId id
    +String nombre
    +String camionPlaca
    +String estado
    +Number latitudActual
    +Number longitudActual
    +Date ultimaActualizacion
    +Parada[] paradas
  }
  class Incidente {
    +ObjectId id
    +String tipo
    +String descripcion
    +Number latitud
    +Number longitud
    +String estado
  }
  class Residuo {
    +ObjectId id
    +String nombre
    +String categoria
    +String descripcion
    +String[] ejemplos
    +Number pesoKg
  }
  class Alerta {
    +ObjectId id
    +String tipo
    +String titulo
    +String mensaje
    +Boolean leida
  }

  Usuario "1" --> "0..1" Zona : pertenece
  Ruta "1" --> "0..1" Zona : cubre
  Ruta "1" --> "0..1" Usuario : operador
  Incidente "1" --> "1" Usuario : reportadoPor
  Incidente "1" --> "0..1" Zona : ubicadoEn
  Residuo "1" --> "0..1" Zona : recolectadoEn
  Alerta "1" --> "1" Usuario : destinatario
  Alerta "1" --> "0..1" Ruta : sobre
```

---

## 3. Modelo de Datos (Entidad-Relación lógico, Mermaid)

```mermaid
erDiagram
  USUARIO ||--o{ INCIDENTE : reporta
  USUARIO }o--|| ZONA : pertenece
  ZONA ||--o{ RUTA : tiene
  USUARIO ||--o{ RUTA : opera
  ZONA ||--o{ INCIDENTE : ubica
  ZONA ||--o{ RESIDUO : registra
  USUARIO ||--o{ ALERTA : recibe
  RUTA ||--o{ ALERTA : genera

  USUARIO {
    ObjectId _id
    string nombre
    string email
    string password
    string rol
    ObjectId zona
  }
  ZONA {
    ObjectId _id
    string nombre
    string distrito
    object geometry
  }
  RUTA {
    ObjectId _id
    string nombre
    string estado
    number latitudActual
    number longitudActual
    ObjectId zona
    ObjectId operador
  }
  INCIDENTE {
    ObjectId _id
    string tipo
    string descripcion
    string estado
    ObjectId usuario
  }
  RESIDUO {
    ObjectId _id
    string nombre
    string categoria
    number pesoKg
  }
  ALERTA {
    ObjectId _id
    string tipo
    string mensaje
    boolean leida
  }
```

---

## 4. Diagrama de Secuencia — Reporte de incidencia (Mermaid)

```mermaid
sequenceDiagram
  actor C as Ciudadano
  participant App as App móvil
  participant API as API (Express)
  participant DB as MongoDB

  C->>App: Completa incidencia + ubicación (GPS)
  App->>API: POST /api/incidentes (Bearer token)
  API->>API: Verifica JWT
  API->>DB: Inserta incidente (estado=PENDIENTE)
  DB-->>API: Incidente creado
  API-->>App: 201 { success, data }
  App-->>C: "Incidencia reportada ✓"
```

---

## 5. Diagrama de Secuencia — Inicio de sesión (Mermaid)

```mermaid
sequenceDiagram
  actor U as Usuario
  participant App
  participant API
  participant DB
  U->>App: email + contraseña
  App->>API: POST /api/auth/login
  API->>DB: Busca usuario por email
  DB-->>API: Usuario (hash)
  API->>API: bcrypt.compare + firma JWT
  API-->>App: { token, usuario }
  App->>App: Guarda token (SecureStore)
  App-->>U: Ingreso al panel según rol
```

---

## 6. Diagrama de Componentes / Arquitectura (Mermaid)

```mermaid
flowchart TB
  subgraph Cliente
    APK[App móvil Android - Expo]
    WEB[Dashboard web - navegador]
  end
  subgraph Nube
    API[API REST - Node/Express en Render]
    DB[(MongoDB Atlas)]
  end
  EXT[API RENIEC - apisperu]

  APK -- HTTPS/JSON --> API
  WEB -- HTTPS/JSON --> API
  API -- Mongoose --> DB
  API -- consulta DNI --> EXT
```

---

## 7. Versión PlantUML del Diagrama de Clases (alternativa)

```plantuml
@startuml
class Usuario {
  +nombre: String
  +email: String
  +rol: String
}
class Zona { +nombre: String +geometry: GeoJSON }
class Ruta { +nombre: String +estado: String +latitudActual: Number }
class Incidente { +tipo: String +estado: String }
class Residuo { +nombre: String +categoria: String }
class Alerta { +mensaje: String +leida: Boolean }

Usuario "*" --> "0..1" Zona
Ruta "*" --> "0..1" Zona
Ruta "*" --> "0..1" Usuario
Incidente "*" --> "1" Usuario
Residuo "*" --> "0..1" Zona
Alerta "*" --> "1" Usuario
@enduml
```
