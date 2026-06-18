# Gestión de ramas y asignación — GitHub

**Repositorio:** https://github.com/GamoLG/Gestion-de-Residuos-Cusco
**Rama principal:** `main` (código integrado y desplegado)
**Convención de ramas:** `feature/HU<NN>-<descripcion-corta>`

---

## 1. Ramas por historia de usuario (creadas en GitHub)

| Rama | Historia de usuario | RF | Módulo |
|------|---------------------|----|--------|
| `feature/HU01-registro-ciudadanos` | Registro de ciudadanos | RF-01 | Usuarios y zonas |
| `feature/HU02-inicio-sesion` | Autenticación e inicio de sesión | RF-02 | Usuarios y zonas |
| `feature/HU03-consulta-horarios` | Consulta de rutas/horarios | RF-10 | Aplicación móvil |
| `feature/HU04-gestion-zonas` | Gestión y asignación de zonas | RF-03, RF-04 | Usuarios y zonas |
| `feature/HU05-monitoreo-rutas` | Monitoreo y seguimiento de rutas | RF-07, RF-08, RF-09 | Monitoreo de rutas |
| `feature/HU06-reporte-incidencias` | Reporte ciudadano de incidencias | RF-11 | Aplicación móvil |
| `feature/HU07-segregacion-residuos` | Catálogo y guía de segregación | RF-05, RF-06 | Gestión de residuos |
| `feature/HU08-dashboard-admin` | Dashboard web + reportes | RF-14, RF-15, RF-16 | Reportes y analítica |

---

## 2. Tabla de asignación por integrante

> Ajusten los nombres según cómo se repartieron realmente el trabajo.

| Integrante | Rol | Ramas asignadas | Responsabilidad |
|-----------|-----|-----------------|-----------------|
| **Luicho Quispe, Jhoel Alex (224871)** | Product Owner / Dev | `feature/HU04-gestion-zonas`, `feature/HU08-dashboard-admin`, `main` | Zonas, dashboard web, integración y despliegue |
| **Luna Ccapa, Carlos Willian (210178)** | Developer Full Stack | `feature/HU01-registro-ciudadanos`, `feature/HU02-inicio-sesion` | Autenticación y registro (backend + móvil) |
| **Puma Condori, Richard Braulio (161809)** | Developer Full Stack | `feature/HU06-reporte-incidencias`, `feature/HU07-segregacion-residuos` | Incidencias y catálogo de residuos |
| **Huaracallo Arenas, Lino Zeynt (204798)** | Scrum Master / Dev | `feature/HU03-consulta-horarios`, `feature/HU05-monitoreo-rutas` | Rutas, mapa y seguimiento; facilita el proceso |

---

## 3. Commits relacionados a cada historia

> El proyecto se integró en `main`. Mapeo de los commits actuales a las historias:

| Commit | Descripción | Historias relacionadas |
|--------|-------------|------------------------|
| `3d702bc` | Proyecto propio: backend Express+MongoDB + app Expo | HU01, HU02, HU04, HU05, HU06, HU07 (base) |
| `e5e4b23` | Incluir código de la app móvil | HU01, HU02, HU03, HU06 (pantallas) |
| `49272a0` | Agregar README del proyecto | Documentación |
| `2675667` | Dashboard web de administrador | HU04, HU08 |
| `523b111` | Documentación Entrega 2 | Documentación |

---

## 4. Flujo de trabajo recomendado (de aquí en adelante)

1. Cada integrante trabaja en su rama: `git checkout feature/HUxx-...`
2. Hace commits descriptivos: `git commit -m "HU05: agregar filtro de rutas activas"`
3. Sube su rama: `git push origin feature/HUxx-...`
4. Abre un **Pull Request** hacia `main` en GitHub.
5. El responsable de integración (Luicho) revisa y hace **merge** a `main`.
6. `main` se despliega automáticamente (o con Manual Deploy) en Render.

> Nota: las ramas se crearon a partir de la integración actual en `main`. Para futuros cambios, cada quien parte de su rama y abre PR. Así queda evidencia del trabajo individual para la evaluación.
