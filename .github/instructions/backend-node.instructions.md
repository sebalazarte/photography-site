---
description: "Use when writing Express routes, services, middleware, or utility modules in the backend. Covers architecture, input validation, centralized error handling, logging, and security for backend-back4app/."
applyTo: "backend-back4app/**/*.{ts,js}"
---

# Backend Instructions — `backend-back4app/`

## Arquitectura por capas

```
routes/      → Parsea request/response y llama al service. Sin lógica de negocio.
services/    → Lógica de negocio pura. No importa req/res ni depende de Express.
lib/         → Clientes compartidos y utilidades (parseClient, etc.).
```

- Los **routers** validan la forma del request, llaman al service y devuelven la respuesta. Nada más.
- Los **services** son testeables de forma independiente sin montar Express.
- Si el acceso a datos crece, introduce `repositories/` entre services y el cliente externo.
- No pongas lógica de negocio en `index.js`; ese archivo solo registra middlewares y routers.

## Validación de inputs

- Valida y sanitiza **todos** los datos de entrada (body, query, params) antes de pasarlos al service.
- Usa un schema de validación explícito: Zod, Joi o `express-validator`.
- Devuelve `400 Bad Request` con un mensaje claro si la validación falla.
- No confíes en que los tipos de TypeScript validan en runtime; valida explícitamente en la frontera HTTP.

## Manejo centralizado de errores

- El middleware de error global en `index.js` ya está configurado. Úsalo: llama `next(error)` en lugar de capturar errores localmente en cada ruta.
- Para distinguir errores operativos de errores de programación, crea clases semánticas:
  ```js
  class NotFoundError extends Error { constructor(msg) { super(msg); this.status = 404; } }
  class ValidationError extends Error { constructor(msg) { super(msg); this.status = 400; } }
  ```
- Nunca devuelvas stack traces al cliente. El middleware global loggea internamente y responde con un mensaje genérico.
- Usa HTTP status codes correctos: `400` validación, `401` sin autenticar, `403` sin autorización, `404` no encontrado, `500` error interno.

## Logging

- **Nunca loggees secretos, tokens, passwords ni datos personales sensibles.**
- Revisa todos los `console.log` de debug antes de hacer commit; elimina o reemplaza por logs estructurados.
- En producción, considera un logger estructurado (`pino`, `winston`) en lugar de `console.log`.
- Loggea el error completo internamente (`console.error(err)`), pero devuelve al cliente solo `err.message` o un mensaje genérico.

## Seguridad

- Toda configuración sensible (App ID de Back4App, claves OpenAI, URLs de base de datos) va en `.env` y se lee con `dotenv`. Nunca hardcodees credenciales.
- El archivo `.env` debe estar en `.gitignore`. Si no está, agrégalo de inmediato.
- Sanitiza inputs antes de pasarlos a queries o llamadas externas (Back4App, OpenAI) para prevenir inyección.
- CORS está configurado como abierto en desarrollo (`app.use(cors())`). Antes de producción, especifica `origin` explícitamente:
  ```js
  app.use(cors({ origin: process.env.ALLOWED_ORIGIN }));
  ```
- En endpoints de carga de archivos (`multer`), valida siempre el tamaño máximo y el tipo MIME permitido.
- No expongas detalles de infraestructura (versiones, nombres de servicios internos) en respuestas de error.

## Convenciones de módulos

- El proyecto usa `"type": "module"` (ESM). Usa `import`/`export`; no uses `require()`.
- Las importaciones locales incluyen la extensión `.js` (incluso si el archivo fuente es `.ts` cuando se migre).
- Nombra los archivos de ruta con el recurso en plural y kebab-case: `customers.js`, `photos.js`.
- Cada router exporta `default`; `index.js` los monta bajo su prefijo `/api/<recurso>`.

## TypeScript (cuando se migre el backend)

- Activa `strict: true` desde el inicio en el `tsconfig.json`.
- Tipea las respuestas de Back4App y OpenAI con interfaces explícitas; no uses `any`.
- Separa los tipos compartidos en un directorio `types/` dentro del paquete.
