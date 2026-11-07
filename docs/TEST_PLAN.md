# Cobertura requerida por la especificación

Este plan desglosa la sección 46 del prompt. “Pendiente” significa que todavía falta vincular una prueba ejecutada a esa obligación; no implica que el código correspondiente no exista. Los resultados reales están en [PRUEBAS.md](PRUEBAS.md).

| Área | Obligación | Estado/evidencia |
| --- | --- | --- |
| Geometría | Los objetos mantienen sus dimensiones al cambiar el escenario. | Pendiente de evidencia |
| Geometría | El zoom no modifica valores físicos. | Pendiente de evidencia |
| Geometría | La conversión entre coordenadas 2D/3D es correcta. | Pendiente de evidencia |
| Geometría | Las rotaciones mantienen transformaciones coherentes. | Pendiente de evidencia |
| Geometría | Los objetos agrupados mantienen posiciones relativas. | Pendiente de evidencia |
| Geometría | Las tarimas trasladan correctamente los objetos anclados. | Pendiente de evidencia |
| Geometría | Las mediciones utilizan dimensiones reales. | Pendiente de evidencia |
| Escena | Un objeto movido en 2D se actualiza en 3D. | Pendiente de evidencia |
| Escena | Un objeto movido en 3D se actualiza en 2D. | Pendiente de evidencia |
| Escena | El cambio de cámara no altera la geometría. | Pendiente de evidencia |
| Escena | La selección se sincroniza. | Pendiente de evidencia |
| Escena | Los grupos pueden editarse internamente. | Pendiente de evidencia |
| Escena | Los objetos bloqueados no se mueven accidentalmente. | Pendiente de evidencia |
| Pantallas | Las dimensiones se calculan correctamente. | Pendiente de evidencia |
| Pantallas | El número de gabinetes coincide con la geometría. | Pendiente de evidencia |
| Pantallas | Se detectan configuraciones incompatibles. | Pendiente de evidencia |
| Pantallas | El ancho, alto y profundidad afectan correctamente la ocupación física. | Pendiente de evidencia |
| Line arrays | La cantidad de gabinetes coincide con los parámetros. | Pendiente de evidencia |
| Line arrays | Los lados pueden configurarse independientemente. | Pendiente de evidencia |
| Line arrays | Los cambios de cantidad actualizan el inventario. | Pendiente de evidencia |
| Line arrays | Los ángulos se aplican correctamente. | Pendiente de evidencia |
| Line arrays | La vista frontal refleja la configuración. | Pendiente de evidencia |
| Audio | Cambiar un número de canal actualiza todas las vistas. | Pendiente de evidencia |
| Audio | Los identificadores internos se mantienen. | Pendiente de evidencia |
| Audio | Los canales duplicados incompatibles se detectan. | Pendiente de evidencia |
| Audio | Dos cuñas pueden compartir un bus. | Pendiente de evidencia |
| Audio | Un IEM estéreo requiere los recursos de salida correspondientes. | Pendiente de evidencia |
| Audio | Las stageboxes controlan ocupación de puertos. | Pendiente de evidencia |
| Audio | Cambiar perfiles de consola no borra fuentes. | Pendiente de evidencia |
| Audio | Los perfiles de patch permanecen independientes. | Pendiente de evidencia |
| Audio | Los splitters documentan rutas independientes. | Pendiente de evidencia |
| Audio | El patch automático respeta asignaciones bloqueadas. | Pendiente de evidencia |
| Persistencia | Guardar y reabrir mantiene objetos. | Pendiente de evidencia |
| Persistencia | Guardar y reabrir mantiene dimensiones. | Pendiente de evidencia |
| Persistencia | Guardar y reabrir mantiene canales. | Pendiente de evidencia |
| Persistencia | Guardar y reabrir mantiene relaciones físicas. | Pendiente de evidencia |
| Persistencia | La importación de archivos inválidos no rompe la aplicación. | Pendiente de evidencia |
| Persistencia | Las migraciones preservan datos. | Pendiente de evidencia |
| Persistencia | Una actualización de catálogo no altera silenciosamente proyectos históricos. | Pendiente de evidencia |
| Documentación | El PDF contiene los canales correctos. | Pendiente de evidencia |
| Documentación | Las medidas del plano coinciden con el proyecto. | Pendiente de evidencia |
| Documentación | El PDF utiliza el perfil de audio seleccionado. | Pendiente de evidencia |
| Documentación | Las tablas se paginan correctamente. | Pendiente de evidencia |
| Documentación | Los renders utilizan la revisión correcta. | Pendiente de evidencia |
| Documentación | Las revisiones antiguas se pueden recuperar. | Pendiente de evidencia |
| Documentación | Los símbolos mantienen legibilidad monocromática. | Pendiente de evidencia |
| Documentación | No aparecen páginas vacías inesperadas. | Pendiente de evidencia |
| Documentación | Los archivos generados se abren correctamente. | Pendiente de evidencia |
| Rendimiento | Fluidez de navegación. | Pendiente de evidencia |
| Rendimiento | Velocidad de selección. | Pendiente de evidencia |
| Rendimiento | Respuesta de edición. | Pendiente de evidencia |
| Rendimiento | Consumo de memoria. | Pendiente de evidencia |
| Rendimiento | Gestión de modelos repetidos. | Pendiente de evidencia |
| Rendimiento | Tiempo de carga. | Pendiente de evidencia |
| Rendimiento | Estabilidad de exportaciones. | Pendiente de evidencia |

La suite inicial no reemplaza pruebas pendientes de funcionalidades todavía no implementadas. No se añaden assertions triviales para completar esta tabla. Las pruebas de rendimiento deberán identificar hardware, tamaño de escena y metodología antes de establecer resultados.
