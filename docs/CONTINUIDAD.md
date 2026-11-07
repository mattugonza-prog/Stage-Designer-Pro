# Continuidad del desarrollo

## Punto de partida

El repositorio estaba vacío, con un commit inicial en `main`. La especificación del usuario está preservada completa en `ESPECIFICACION.md`. La primera entrega implementa la base ejecutable y avanza módulos sobre el mismo modelo; no reemplaza el alcance integral por una demo.

Consultar primero `IMPLEMENTATION.md` y `PRUEBAS.md`. El estado de una función sólo debe elevarse a Probada si existe evidencia de ejecución correspondiente. Volver a ejecutar únicamente las verificaciones afectadas al resolver un problema o cambiar un módulo.

## Estado verificado del trabajo actual

El bloque de precisión añade guías magnéticas, pivotes XY con controles 2D/3D, detección de interferencias y revisión intencional trazable en UI/PDF. Formato 3 con lectura de esquemas 1 y 2. Pasan 142 pruebas Vitest, tipos, build y formato; 16 flujos de navegador verificados, incluidos los dos repetidos tras corregir la automatización. Se probó también el artefacto bajo subrutas con cachés independientes y recarga offline.

El usuario autorizó publicar esta entrega en `main` para probarla. Verificar el resultado del push y del workflow **Verify and publish** al retomar; no confundir el commit remoto con un sitio desplegado. La API de GitHub no está permitida desde este entorno, por lo que la configuración Pages necesita confirmación externa si el workflow no puede desplegar. No volver a aplicar el borrador cloud ni publicar el entorno: el usuario pidió conservar la configuración publicada.

La primera entrega cerró la demostración de los hitos 1–2: instalación, build, formato, 56 tests Vitest y 8 E2E Chromium aprobados. La primera prueba offline detectó diferencias de `Vary: Origin` entre precache y solicitudes de módulos; se corrigió la lectura de caché y se volvió a verificar.

El bloque siguiente incorpora capas persistentes, visibilidad/bloqueo efectivo, anclajes multinivel, posición/giro relativos y alineación/distribución de conjuntos. El formato nativo pasó al esquema 2 con migración validada desde 1. **TypeScript, build, formato, 86 tests Vitest y 13 E2E Chromium aprobados** para este estado. La suite completa incluye los ocho flujos anteriores y cinco nuevos. Se corrigieron además el centro de alineación de grupos parcialmente seleccionados y los comandos de duplicación/borrado durante arrastres incompletos.

La base anterior estaba en el workspace sin commit de aplicación. Esta entrega prepara su primer commit completo y publicación en main. Consultar Git para confirmar SHA y estado remoto; las instrucciones para el navegador están en DEPLOYMENT.md.

## Secuencia de retomada

1. Revisar `git status` y conservar cambios locales existentes.
2. Leer `README.md`, los contratos de `src/core/types.ts` y las decisiones de `DECISIONES.md`.
3. Instalar con `npm ci` cuando sea necesario. No regenerar el lockfile sin una decisión explícita de actualización de dependencias.
4. Ejecutar la comprobación de tipos, la suite relevante y la aplicación.
5. Corregir cualquier problema de integración antes de iniciar la siguiente función.
6. Seguir el orden de dependencias siguiente y actualizar matriz/evidencia al terminar.

En entornos cloud, usar el checkout existente: cada tarea ya está aislada. No crear un worktree salvo petición explícita. Respetar el proxy y certificados administrados. No inferir falta de acceso a GitHub porque no exista una variable de token.

## Próximos bloques

1. Continuar el hito de editor con puntos de conexión configurables, presets de capas y entidad de recinto con alturas/zonas/obstáculos y validación de apoyos. La jerarquía actual propaga traslación, giro alrededor de Z y cambios de altura, con posiciones mundiales como fuente única.
2. Expandir el catálogo: administración de definiciones, metadata técnica y procedencia; importar GLB con validación y límites antes de aceptar recursos externos.
3. Completar audio: puertos/dispositivos reales, varias stageboxes, buses y grafo de rutas; phantom de cuatro estados; marcadores 2D; matriz de monitoreo y splitters.
4. Investigar documentación oficial para Mackie DL32S y Behringer XR18. Registrar fuentes y separar conectores/canales de procesamiento/buses.
5. Plantillas y conjuntos con identidades nuevas y conflictos de canales resueltos explícitamente.
6. Documentación: resolver colisiones de etiquetas en planos densos antes de considerar el rider maquetado final; configurador A4/A3, plantillas, preview y escalas físicas; XLSX, paquetes con recursos, estados y comparación de revisiones.
7. Mejorar presentación 3D y exportación a resolución nativa solicitada; guardar cámaras y medir rendimiento antes de afirmar hiperrealismo o metas de hardware.
8. Cerrar pruebas integrales, recuperación y distribución instalable.

## Condiciones permanentes

- Fuente de verdad única: no crear otra lista de canales para PDF ni otra escena independiente para 3D.
- Guardar posiciones en metros; cámara/zoom y símbolos legibles no deben alterar ocupación física.
- Mantener fuentes y escena al cambiar perfiles de audio.
- Conservar definiciones históricas y generar documentos desde una instantánea coherente.
- No inventar fichas técnicas, compatibilidad ni licencias.
- Guardar proyectos incompletos debe seguir siendo posible; las advertencias no equivalen a certificación de seguridad.
- No anunciar el producto final mientras existan capacidades pendientes de la especificación.

## Semántica que debe conservarse

- La capa oculta afecta vistas y planos exportados, no inventario, audio ni persistencia. Padre e hijo pueden pertenecer a disciplinas distintas; las banderas de capa no se heredan por el anclaje.
- Un bloqueo efectivo es el bloqueo individual o el de su capa. Si una transformación de soporte/conjunto afectaría un elemento bloqueado, se rechaza completa y se informa el motivo.
- La posición relativa usa el centro inferior del soporte y se deriva de posiciones mundiales. No introducir un segundo estado de transformaciones que pueda divergir.
- Distribución uniforme significa separación entre centros de las unidades seleccionadas, con extremos conservados; no asegura espacios libres iguales entre equipos de tamaños diferentes.
- La migración 1→2→3 es sobre datos leídos. Las revisiones originales permanecen intactas y duplicar un proyecto remapea también IDs de capas.
