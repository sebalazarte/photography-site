# Copilot Instructions — photography-site

Monorepo de sitio de fotografía con dos paquetes principales:
- **`portfolio/`** — Frontend: React 19 + TypeScript + Vite + React Router DOM + Bootstrap.
- **`backend-back4app/`** — Backend: Node.js + Express (JavaScript), integración con Back4App y OpenAI.

---

## Reglas generales del repositorio

- Trabaja siempre en el paquete correcto; nunca mezcles imports entre `portfolio/` y `backend-back4app/`.
- Usa inglés para nombres de símbolos (variables, funciones, tipos, rutas de archivo). Usa español solo en textos visibles al usuario y en comentarios si el equipo lo prefiere.
- No hagas commits con credenciales, tokens ni secretos. Toda configuración sensible va en variables de entorno (`.env`, nunca en código fuente).
- Mantén las dependencias mínimas y justificadas. Evalúa si una librería nueva es realmente necesaria antes de agregarla.
- Cuando un cambio afecte múltiples capas (frontend + backend), describe primero el impacto antes de implementar.

---

## TypeScript

- **`strict: true` está habilitado** en `portfolio/tsconfig.json`. Mantenlo activo. Si se añade un `tsconfig` para el backend, actívalo también.
- Evita `any`. Prefiere tipos explícitos, `unknown` + narrowing, o tipos generics cuando aplique.
- Usa `interface` para contratos de objetos públicos (props, respuestas de API). Usa `type` para uniones, intersecciones y alias simples.
- Exporta los tipos que se comparten entre módulos desde archivos dedicados (`types/`).
- Habilita `noUnusedLocals` y `noUnusedParameters` (ya activos en el frontend). No los deshabilites para "que compile rápido".

---

## Frontend — `portfolio/`

### Estructura de capas

```
src/
  api/          # Llamadas HTTP al backend. Sin lógica de negocio.
  components/   # Componentes reutilizables, organizados por dominio (photos/, master/, etc.).
  context/      # Providers de React Context para estado global.
  hooks/        # Custom hooks (lógica reutilizable sin UI).
  pages/        # Componentes de página, montados por el router.
  types/        # Tipos e interfaces compartidos.
  utils/        # Funciones puras sin efectos secundarios.
```

- Cada capa tiene una responsabilidad única. No coloques lógica de negocio en componentes de página ni en la capa `api/`.
- Un componente que crece demasiado debe dividirse: extrae sub-componentes o un custom hook.

### Componentes

- Usa **solo componentes funcionales** con hooks. No uses clases.
- Nombra componentes con `PascalCase`. Cada componente va en su propio archivo.
- Las **props** siempre deben estar tipadas con `interface` o `type`. Nunca dejes props sin tipo.
- Evita prop drilling profundo (más de dos niveles). Usa `Context` o un custom hook compartido.

### Manejo de estado

- Estado local simple → `useState`.
- Lógica de estado compleja o derivada → `useReducer`.
- Estado compartido entre componentes distantes → `Context` (ver `src/context/`).
- Si la aplicación crece y Context genera re-renders innecesarios, evalúa una librería de estado ligera (Zustand, Jotai) antes de introducir Redux.
- No pongas estado del servidor (datos fetched) en Context/Redux si ya tienes una capa `api/`. Usa un hook con `useState` + `useEffect`, o una librería de data fetching (TanStack Query) para caché y sincronización.

### Llamadas al backend

- Toda llamada HTTP va en `src/api/`. Los componentes y páginas nunca llaman `fetch` directamente.
- Maneja los tres estados en UI: `loading`, `error`, `data`. No dejes pantallas en blanco silenciosas.
- Tipea las respuestas de la API con interfaces explícitas. Nunca asumas la forma del payload.

### Accesibilidad (a11y) mínima

- Todo elemento interactivo (`button`, `input`, enlace) debe tener texto accesible o `aria-label`.
- Usa elementos semánticos HTML (`<nav>`, `<main>`, `<section>`, `<h1>`…`<h6>`) en lugar de `<div>` genéricos cuando corresponda.
- Las imágenes deben tener `alt` descriptivo (o `alt=""` si son decorativas).

### Manejo de errores en UI

- Muestra mensajes de error comprensibles al usuario. Nunca muestres stack traces en producción.
- Envuelve secciones críticas con `ErrorBoundary` para evitar que un error baje toda la app.
- Usa `try/catch` en los handlers de eventos asíncronos. Propaga los errores hacia el estado del componente, no los silencies.

---

## Backend — `backend-back4app/`

### Estructura de módulos

```
routes/     # Define endpoints Express. Solo parseo de request/response.
services/   # Lógica de negocio. Sin acceso directo a HTTP.
lib/        # Clientes y utilidades compartidas (parseClient, etc.).
```

- Los **routers** solo deben llamar al servicio correspondiente y devolver la respuesta. Sin lógica de negocio.
- Los **services** son testeables de forma independiente (sin Express). No importen `req`/`res`.
- Si la lógica de acceso a datos crece, introduce una capa `repositories/` entre services y el cliente de base de datos.

### Validación de inputs

- Valida y sanitiza todos los datos de entrada antes de usarlos en servicios o consultas.
- Usa un schema de validación explícito (Zod, Joi, express-validator) para rutas que reciban body o query params.
- Devuelve `400 Bad Request` con un mensaje claro si la validación falla. No dejes que datos inválidos lleguen a la lógica de negocio.

### Manejo centralizado de errores

- El middleware de error global en `index.js` ya está configurado. Úsalo: llama `next(error)` en lugar de manejar errores localmente en cada ruta.
- Crea clases de error semánticas (`NotFoundError`, `ValidationError`, etc.) si el proyecto crece, para distinguir errores operativos de errores de programación.
- Nunca devuelvas stack traces al cliente en producción. Loggea internamente y devuelve un mensaje genérico.

### Seguridad

- **No loggees secretos, tokens ni passwords.** Revisa los `console.log` de debug antes de hacer commit.
- Toda configuración sensible (claves de API, URLs de base de datos, App ID de Back4App) va en `.env` y se lee con `dotenv`. El archivo `.env` debe estar en `.gitignore`.
- Sanitiza inputs antes de pasarlos a queries o llamadas externas para prevenir inyección.
- Configura CORS explícitamente: especifica `origin` en lugar de `app.use(cors())` abierto cuando vayas a producción.
- Valida el tamaño y tipo MIME de los archivos en los endpoints de carga (`multer`).

---

## Pruebas

No hay framework de tests configurado actualmente. Se recomienda introducirlo de la siguiente forma:

### Frontend
- **Framework sugerido**: Vitest (integra nativamente con Vite) + React Testing Library.
- Testea comportamiento visible al usuario, no detalles de implementación.
- Un test por caso de uso relevante: render inicial, interacción del usuario, estado de error.
- Mockea la capa `api/` en tests de componentes para no depender del backend.

### Backend
- **Framework sugerido**: Node.js `node:test` (built-in, sin dependencias) o Jest/Vitest.
- Testea los **services** de forma unitaria: son funciones puras sin Express.
- Testea las **routes** con supertest para verificar contratos HTTP (status codes, shape del response).
- No testees detalles internos; testea el contrato público de cada módulo.

### Convenciones comunes
- Archivos de test junto al módulo que testean: `foo.test.ts` / `foo.test.js`.
- Nomenclatura: `describe('nombre del módulo') > it('debería ...')`.
- Cubre los caminos felices y los casos de error principales.

---

## Calidad de código

### ESLint

- El frontend ya tiene ESLint configurado (`@typescript-eslint`, `eslint-plugin-react-hooks`, `eslint-plugin-react-refresh`).
- El backend no tiene ESLint aún. Se recomienda agregar `eslint` + `@typescript-eslint` (cuando se migre a TS) o `eslint` con reglas básicas de Node.
- **No deshabilites reglas de ESLint** con `// eslint-disable` sin un comentario que justifique el motivo.
- El script `npm run lint` del frontend ejecuta con `--max-warnings 0`. Mantenlo en cero advertencias.

### Prettier (recomendado)

- No está configurado actualmente. Si el equipo decide adoptarlo:
  - Agrega un `.prettierrc` en la raíz del monorepo.
  - Integra `eslint-config-prettier` para evitar conflictos entre ESLint y Prettier.
  - Configura `format on save` en VS Code para toda la carpeta del repo.

### Convenciones generales

- Prefiere funciones pequeñas con una sola responsabilidad.
- Elimina código comentado antes de hacer merge.
- Evita números mágicos y strings literales repetidos: extráelos a constantes con nombre.

---

## Cómo trabajar con Copilot

### Antes de cambios grandes

1. **Pide un plan primero.** Antes de implementar una feature compleja o refactorizar un módulo, pide a Copilot que describa el enfoque, los archivos que se modificarán y los riesgos. Revisa el plan antes de aceptarlo.
2. **Confirma el alcance.** Asegúrate de que el plan no toque más archivos de los necesarios.

### Cambios pequeños y revisables

- Prefiere commits atómicos: un cambio de comportamiento por commit.
- Pide a Copilot que haga cambios en pasos incrementales cuando la tarea sea grande; es más fácil revisar y revertir.
- Revisa todo el diff antes de aceptarlo, especialmente en archivos de configuración, rutas de API y manejo de autenticación.

### Contexto útil para Copilot

- Menciona el módulo o la capa en la que estás trabajando (`portfolio/src/api/`, `backend-back4app/services/`).
- Si estás añadiendo un endpoint nuevo, describe también el cambio en el cliente frontend correspondiente.
- Si tienes dudas sobre tipado, pide a Copilot que genere la interfaz antes de implementar la función.

### Lo que Copilot NO debe hacer sin confirmación explícita

- Borrar archivos o carpetas.
- Cambiar la estructura de rutas del router principal.
- Modificar variables de entorno o archivos `.env`.
- Hacer push a ramas protegidas o ejecutar comandos destructivos.
