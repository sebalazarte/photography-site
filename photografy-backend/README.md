# Photografy Backend

Servidor Express que actúa como fachada para la API de Parse (Back4App). Recibe las mismas rutas que usaba el servidor local anterior (`/api/photos`, `/api/galleries`) y delega toda la persistencia en tu instancia de Back4App.

## Configuración

1. Copiá `.env.example` a `.env` y completá las credenciales de tu app en Back4App:

	```env
	PORT=4000
	PARSE_SERVER_URL=https://parseapi.back4app.com
	PARSE_APP_ID=<tu app id>
	PARSE_REST_KEY=<tu rest key>
	PARSE_JS_KEY=<opcional>
	```

2. Instalá dependencias:

	```bash
	npm install
	```

3. Iniciá el servidor:

	```bash
	npm run dev
	```

## Scripts disponibles

- `npm run dev` / `npm start`: inicia el servidor HTTP (puerto configurable por `PORT`).
- `npm run verify`: reutilizado para mantener compatibilidad, pero ahora simplemente arranca el servidor (no crea carpetas locales).

## Endpoints principales

- `GET /api/galleries`: devuelve las galerías registradas en la clase `Gallery` de Parse.
- `POST /api/galleries`: crea una galería nueva (se genera un `slug` único).
- `PUT /api/galleries/:slug`: actualiza el nombre de una galería existente.
- `DELETE /api/galleries/:slug`: elimina la galería y sus fotos asociadas (`PhotoOrder`).
- `GET /api/photos?folder=home|contact|galleries/<slug>`: lista las fotos para la carpeta.
- `POST /api/photos?folder=...`: sube nuevas fotos; los archivos se envían a Parse como `File` y se crea el registro correspondiente en `PhotoOrder`.
- `DELETE /api/photos?id=<objectId>&folder=...`: borra una foto (por `objectId`).
- `PUT /api/photos/order`: guarda el orden manual de las fotos.

Toda la información se guarda en Back4App, por lo que ya no existe la carpeta `data/` ni `storage/` en este proyecto.
