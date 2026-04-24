---
description: "Use when writing React components, hooks, pages, context providers, or API calls in the frontend. Covers TypeScript strict mode, component structure, state management, accessibility, and error handling for portfolio/."
applyTo: "portfolio/**/*.{ts,tsx}"
---

# Frontend Instructions — `portfolio/`

## TypeScript

- `strict: true`, `noUnusedLocals` y `noUnusedParameters` están habilitados. No los desactives.
- Nunca uses `any`. Prefiere `unknown` + narrowing o generics.
- Usa `interface` para props y respuestas de API. Usa `type` para uniones e intersecciones.
- Los tipos compartidos entre módulos van en `src/types/`. Exporta desde allí, no los repitas.

## Componentes

- Solo **componentes funcionales**. No uses clases ni `React.Component`.
- Nombra con `PascalCase`. Un componente por archivo; el archivo lleva el mismo nombre.
- Todas las props deben estar tipadas con `interface Props` o `type Props`. Nunca dejes props implícitas.
- Si un componente supera ~150 líneas, extrae sub-componentes o un custom hook.
- No exportes componentes anónimos por defecto (`export default () => ...`). Nombra siempre la función.

## Hooks

- Los custom hooks van en `src/hooks/`. El nombre empieza con `use`.
- Encapsulan lógica reutilizable sin JSX. No renderizan nada.
- Devuelven un objeto o tupla con tipos explícitos, no `any`.
- Si un hook fetcha datos, expone `{ data, loading, error }` con tipos precisos.

## Capas y responsabilidades

```
src/api/        → Fetch al backend. Sin lógica de negocio. Tipea request y response.
src/components/ → UI reutilizable. Sin llamadas fetch directas.
src/context/    → Estado global compartido. Minimiza re-renders: divide Contexts por dominio.
src/hooks/      → Lógica reutilizable sin UI.
src/pages/      → Montan secciones completas. Orquestan componentes y hooks.
src/utils/      → Funciones puras sin efectos secundarios ni imports de React.
src/types/      → Interfaces y tipos compartidos entre módulos.
```

- Las páginas y los componentes **nunca** llaman `fetch` directamente; usan `src/api/`.
- No pongas lógica de negocio en páginas; delégala a hooks o servicios.

## Estado

- Estado local simple → `useState`.
- Lógica de estado derivada o con múltiples transiciones → `useReducer`.
- Estado compartido entre componentes distantes → `Context` (`src/context/`).
- No guardes en Context datos que vengan del servidor; usa un hook con `useState` + `useEffect` o TanStack Query.
- Evita prop drilling de más de dos niveles; usa Context o un hook compartido.

## Llamadas al backend

- Toda función de fetch vive en `src/api/`. Retorna tipos explícitos, nunca `any`.
- En el componente o hook que consuma la API, maneja siempre los tres estados: `loading`, `error`, `data`.
- Nunca dejes una pantalla en blanco silenciosa en caso de error.

## Accesibilidad (a11y)

- Todo elemento interactivo necesita texto visible o `aria-label`.
- Usa semántica HTML: `<nav>`, `<main>`, `<section>`, `<button>`, `<h1>`–`<h6>` en lugar de `<div>` genéricos.
- Las imágenes decorativas usan `alt=""`. Las imágenes de contenido tienen `alt` descriptivo.
- Los formularios vinculan `<label>` con su `<input>` via `htmlFor` / `id`.

## Manejo de errores en UI

- No muestres stack traces ni mensajes técnicos al usuario final.
- Usa `try/catch` en handlers asíncronos; propaga el error al estado del componente.
- Envuelve secciones críticas con `ErrorBoundary` para aislar fallos.
- Los mensajes de error al usuario deben ser comprensibles y accionables.

## Estilos

- El proyecto usa Bootstrap 5. Usa clases utilitarias antes de escribir CSS custom.
- El CSS custom específico de un componente va en un archivo `.css` junto al componente (e.g., `UploadPhotos.css` junto a `UploadPhotos.tsx`).
- No uses estilos inline salvo para valores dinámicos que no se puedan expresar con clases.
- `App.css` e `index.css` son para estilos globales; no añadas estilos de componentes allí.
