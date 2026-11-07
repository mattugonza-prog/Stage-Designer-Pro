# Publicación y prueba en navegador

El repositorio contiene una aplicación estática. Subir código a `main` y disponer de un sitio navegable son pasos distintos: el workflow **Verify and publish** comprueba el código y, sólo si todos los checks pasan en `main`, publica el mismo artefacto probado mediante GitHub Pages. Las pull requests ejecutan las comprobaciones sin desplegar.

## GitHub Pages

1. En el repositorio, revisar **Settings → Pages**. Si todavía no está configurado, seleccionar **Source: GitHub Actions**. Esta opción depende de los permisos y de la disponibilidad de Pages para el repositorio.
2. Abrir **Actions → Verify and publish** después del push a `main`. También se puede volver a ejecutar mediante **Run workflow**, seleccionando `main`.
3. Esperar a que los jobs `application` y `publish` terminen correctamente. El primero instala las dependencias del lockfile, comprueba formato y tipos, ejecuta Vitest y prueba la compilación de producción con Chromium.
4. Abrir la dirección informada por el deployment del entorno `github-pages` o por **Settings → Pages**. Esa dirección es la referencia para probar el sitio; la existencia del workflow no demuestra que el despliegue se haya completado.

No se necesita añadir tokens personales al código. El job de despliegue utiliza el token del workflow y OIDC, con permisos `contents: read`, `pages: write` e `id-token: write`.

La configuración remota de Pages no se pudo consultar desde este entorno porque el proxy bloqueó `api.github.com`. Por tanto, este documento no afirma que Pages esté habilitado ni que exista ya una dirección pública funcionando. Revisar el resultado del workflow después de publicar el código.

## Rutas y funcionamiento sin conexión

Vite genera rutas relativas (`base: './'`), de modo que el artefacto puede servirse tanto en la raíz de un dominio como bajo la ruta de un proyecto de GitHub Pages. El manifiesto usa inicio, alcance e icono relativos.

El service worker se registra junto a la aplicación. Sus URLs de precarga y su nombre de caché se calculan desde su propio alcance, y la limpieza sólo elimina versiones anteriores de esa misma ruta. Una instalación de Stage Designer Pro no elimina la caché de otra instalación bajo una ruta diferente del mismo origen.

El modo sin conexión requiere cargar la aplicación de producción mediante HTTPS o un origen local seguro y esperar a que el service worker quede activo. Al publicar una actualización, cerrar las pestañas anteriores y volver a abrir permite activar la versión nueva sin sustituir una sesión de edición abierta. El desarrollo con Vite no instala el service worker.

Los proyectos pertenecen al almacenamiento local del navegador y del origen. El despliegue no sube proyectos personales al repositorio. Exportar `.stagepro` antes de cambiar de dominio, perfil o dispositivo.

## Otro servidor estático

Ejecutar `npm ci`, `npm run build` y servir el contenido completo de `dist/`. Para comprobarlo localmente: `npm run preview -- --port 4173 --strictPort`. La aplicación no requiere backend ni secretos para sus funciones locales.

Para preparar una copia de prueba en una carpeta aislada, Vite admite `--outDir`; después, `node scripts/build-sw.mjs <carpeta>` genera el service worker en esa misma ubicación. El script sin argumento sigue usando `dist/`.
