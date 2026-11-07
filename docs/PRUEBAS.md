# Verificación del proyecto

Ejecutar desde `/workspace/Stage-Designer-Pro` o la raíz del checkout local. Las pruebas automatizadas están versionadas con el código; sus reportes y archivos generados quedan en directorios ignorados por Git.

## Bloque actual: precisión e interferencias

| Verificación | Resultado |
| --- | --- |
| TypeScript estricto y build de producción | Aprobados |
| Vitest | **142 pruebas aprobadas**, 13 archivos |
| Chromium | **16 flujos verificados**; 14 pasaron en la suite inicial y los dos corregidos pasaron al repetirlos |
| Formato | Aprobado |
| Sitio bajo subruta | `/Stage-Designer-Pro/` y `/Other-stage/`: 3D online/offline, manifest relativo y cachés separadas; sin errores de página |

Las dos primeras fallas de los tests nuevos eran de automatización: un selector de SVG no coincidía con su etiqueta y el punto elegido para arrastrar el gizmo X estaba en el lado opuesto al que Three muestra desde esa cámara. Se corrigieron el selector y el punto de interacción. Se comprobó además el giro real mediante el control 2D alrededor del pivote configurado.

Los flujos nuevos verifican: pivote persistente, traslación con gizmo 3D, giro 2D y conservación del punto fijo; guías y omisión con Alt sin modificar entradas numéricas; revisión/localización de interferencias, reapertura al cambiar geometría, historial y exportación PDF con motivos.

Las pruebas de dominio añadidas cubren SAT 3D, contacto superficial, gabinetes inclinados, límites de listado, pivotes/grupos/locks, migración estricta de esquemas 1 y 2 a 3, firmas de revisión, reapertura y eliminación/deshacer. El rendimiento en escenas grandes sigue sin benchmark formal. El despliegue remoto y la configuración Pages no se pueden confirmar sólo con estas pruebas locales; ver DEPLOYMENT.md.

## Evidencia del bloque anterior: capas y anclajes

| Verificación ejecutada | Resultado |
| --- | --- |
| `npm run typecheck` | Aprobada, TypeScript estricto |
| `npm test` | **86 aprobadas**, 9 archivos, ninguna omitida |
| `npm run build` | Aprobada, service worker con 11 recursos locales |
| `npm run test:e2e` | **13 aprobadas** en Chromium sobre producción, 1,4 min; ninguna omitida |
| `npm run format:check` | Aprobada |
| Inspección visual | Capturas actuales `anclajes-preview.png` y `capas-preview.png` |

La suite actual incorpora 30 regresiones de dominio sobre capas, jerarquías, migración 1→2, exportación y comandos durante arrastres. La ejecución Chromium incluye los ocho flujos anteriores y cinco nuevos:

1. Anclar equipo a tarima, trasladar/girar/elevar, editar coordenadas relativas, guardar/reabrir y desvincular conservando pose.
2. Crear/asignar una capa, ocultar en 2D/3D/SVG conservando inventario, recargar, bloquear/desbloquear sin perder el bloqueo individual y eliminar/deshacer sin perder equipos.
3. Distribuir tres centros con extremos fijos, deshacer y editar un miembro de grupo independientemente antes de volver al movimiento conjunto.
4. Duplicar durante un arrastre real del gizmo 3D y borrar durante un arrastre 2D: el comando permanece tras soltar y se deshace por separado.
5. Importar un archivo de esquema 1, comprobar esquema 2 guardado sin alterar objetos, anclajes ni canales y reabrir con capas disponibles.

La revisión detectó que alinear un grupo parcialmente seleccionado dependía del miembro elegido. Ahora usa las raíces físicas del conjunto expandido; una regresión verifica que elegir cualquiera de sus miembros produce las mismas posiciones. También se separaron los comandos discretos de los arrastres para que desmontar el gizmo no elimine copias ni restaure objetos borrados.

## Evidencia histórica de la primera entrega

| Verificación ejecutada | Resultado |
| --- | --- |
| `npm ci --no-audit --no-fund` | Aprobada: instalación reproducida desde el lockfile, 139 paquetes |
| `npm run typecheck` | Aprobada, TypeScript estricto |
| `npm test` | **56 aprobadas**, 6 archivos, ninguna omitida |
| `npm run build` | Aprobada: Vite y service worker con 11 recursos locales |
| `npm run test:e2e` | **8 aprobadas** en Chromium sobre producción, 50,3 s; ninguna omitida |
| `npm run format:check` | Aprobada |
| PDF demo con `pdfinfo` y `pdftotext` | Abre correctamente, 5 páginas A4, texto seleccionable, sin JavaScript; contiene los 17 canales y salidas de la demo |
| Inspección visual | Editor y primera página PDF renderizados; captura real en `editor-preview.png` |

Las advertencias de tamaño de bundle de Vite permanecen: el núcleo y Three.js superan 500 kB sin comprimir. No impiden compilar, pero el rendimiento todavía no tiene un benchmark formal. La ejecución de CI está configurada en `.github/workflows/verify.yml`; no se afirma que haya corrido en GitHub.

## Cobertura unitaria e integración actual

- Geometría: ejes del proyecto/Three, unidades métricas, huellas giradas, panel de 50 gabinetes, volumen del array inclinado y lados independientes.
- Estado: escala independiente de escenario/vista, posición numérica sin snap, transacciones de arrastre con un undo, cancelación que conserva redo/dirty, bloqueo, grupos, propagación de soporte y duplicación sin IDs compartidos.
- Persistencia: demo completa en IndexedDB simulada, snapshots inmutables, copia de proyecto con referencias remapeadas, autosaves fuera de orden, catálogo histórico y validación de archivos, versiones, límites y ciclos.
- Audio: canales/puertos duplicados, capacidad, asignación automática que respeta bloqueos, agotamiento de puertos, salidas estéreo, destinos compartidos, perfiles independientes y cantidades de inventario.
- Transformaciones 3D: conversión de posición del gizmo y recuperación de yaw por cuaternión incluso más allá de ±90°.
- Documentos: escape XML, CSV protegido contra fórmulas, perfil activo, PDF válido y tabla larga de 137 entradas que pagina sin modificar el proyecto. Las capas ocultas se omiten en geometría, etiquetas y encuadre de SVG/PDF, pero sus equipos siguen en inventario y tablas de audio; bloquear capas no modifica la exportación.
- Jerarquías: anclaje/desanclaje con pose mundial conservada, apoyo sobre la cara superior, coordenadas relativas, propagación multinivel de traslación/giro/altura, ausencia de ciclos y transformación única cuando se seleccionan padre e hijo. Un descendiente bloqueado o fuera de rango rechaza toda la transformación.
- Alineación/distribución: grupos y subárboles como unidades, centros uniformemente separados con extremos conservados, edición individual de miembros y deshacer.
- Capas: visibilidad sin pérdida de datos, bloqueos individuales conservados al desbloquear la capa, banderas no heredadas por anclaje, CRUD/asignación, eliminación con deshacer y cancelación de un arrastre al cambiar visibilidad/bloqueo.
- Migración 1→2: validación del documento antiguo antes de migrarlo, conservación de IDs/poses/audio, lectura sin reescribir originales, guardado posterior en v2, revisiones inmutables, rechazo de referencias inválidas/límites y duplicación con IDs de capas nuevos.

## Ocho flujos E2E de la primera entrega

1. Crear proyecto, editar coordenadas exactas y rotación, verificar sincronización 3D, cambiar zoom/escenario sin cambiar objetos, guardar y recargar.
2. Arrastrar un objeto en 2D y verificar el cambio en 3D antes de soltar, deshacer una interacción, bloquear y duplicar con nuevos IDs.
3. Modificar LED a 8 × 4 gabinetes y array a 8 cajas, comprobar dimensiones e inventario.
4. Arrastrar el eje X real del gizmo 3D, verificar el plano en vivo, deshacer y descargar una captura PNG 3D válida.
5. Crear un equipo personalizado, recargar y usarlo desde otro proyecto con dimensiones preservadas.
6. Crear/restaurar una revisión, exportar respaldo, rechazar archivo inválido y reimportar sin sobrescribir el proyecto original.
7. Descargar y comprobar PDF, SVG, PNG y CSV reales desde la demo.
8. Esperar activación del service worker, desactivar red, recargar, abrir 3D, editar, guardar y exportar PDF; recargar nuevamente y comprobar datos.

La primera ejecución offline falló porque el servidor devuelve `Vary: Origin` y los recursos precacheados no coincidían con las solicitudes de módulos. Se corrigió el cache match para los recursos públicos del mismo origen; la prueba afectada y luego la suite completa pasaron. No se desactivó TLS ni se modificó la política de red.

## Entorno y límites de la evidencia

Node.js 24.22.1, npm 11.9.0, Chromium del entorno Linux y render WebGL por software SwiftShader para automatización. Viewport E2E: 1440 × 1000. Playwright usa un worker. Los tiempos anteriores describen esta máquina, no un objetivo de rendimiento de GPU ni una certificación de hardware.

No se ha verificado todavía el flujo de instalación PWA desde el menú del navegador, actualización de instalaciones previas, otros navegadores, dispositivos táctiles o distribución Windows. El guardado local no reemplaza una copia externa `.stagepro`.

El PDF es un borrador técnico funcional: en escenas densas pueden superponerse etiquetas. Faltan llamadas/leyendas con evitación de colisiones, escalas de impresión fijas, plantillas y preflight visual completo. GLB, puntos de conexión configurables y giro en tres ejes, varias stageboxes, splitters y RF permanecen en el plan y no están cubiertos por pruebas de funciones inexistentes. La migración real 1→2 está cubierta; cada futura versión necesitará su migración y evidencia propias.

Los reportes de Playwright y las exportaciones se regeneran en `playwright-report/` y `test-results/`. Para benchmarks futuros, registrar hardware, número de objetos/gabinetes, mediana/P95 de interacción, memoria y tiempos de carga/exportación.
