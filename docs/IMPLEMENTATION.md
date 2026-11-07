# Estado de implementación

La especificación completa permanece en [ESPECIFICACION.md](ESPECIFICACION.md). Esta matriz mantiene todo el alcance, incluidos módulos que no forman parte de la primera demostración. Un módulo puede tener algunas funciones probadas y seguir en desarrollo.

**Estados:** Pendiente = aún no implementada; En desarrollo = trabajo iniciado sin verificación final; Implementada = código/documentación existente sin evidencia de flujo completo; Probada = comprobación ejecutada y documentada para ese alcance; Bloqueada = requiere resolver un impedimento identificado.

La evidencia de ejecución está en [PRUEBAS.md](PRUEBAS.md). No se deduce aprobación de un producto o una instalación a partir de que exista código.

## Mapa integral de la especificación

| Sección | Alcance | Hito | Estado de la sección |
| --- | --- | --- | --- |
| 1. Rol y objetivo | Construcción de una herramienta real y mantenible, sin copiar recursos de referencias. | 1 | Implementada |
| 2. Instrucciones generales | Inspección, arquitectura tipada, implementación, pruebas y estado honesto. | 1 | Implementada |
| 3. Visión del producto | Escena física, audio, documentación, catálogo y trabajo local integrados. | 1–8 | Pendiente |
| 4. Principios arquitectónicos | Modelo único, escala física, definición/instancia e integridad histórica. | 1 | En desarrollo |
| 5. Tecnologías y arquitectura | React/TypeScript/Vite, SVG, R3F, Zustand, Dexie, validación y pruebas. | 1 | En desarrollo |
| 6. Administración de proyectos | Crear, abrir, recientes, duplicar, renombrar, archivar, eliminar, importar y respaldar. | 1 | En desarrollo |
| 7. Configuración del escenario | Dimensiones libres, unidades, orientación, cuadrícula y futuro escenario irregular. | 2 | En desarrollo |
| 8. Entorno escénico | Recinto, alturas, obstáculos, zonas y soportes separados de la plataforma. | 3 | Pendiente |
| 9. Motor geométrico | Escala real, ocupación, transformaciones, pivotes e IDs independientes. | 2 | En desarrollo |
| 10. Interfaz | Espacio de trabajo profesional con catálogo, propiedades, vistas y panel técnico. | 1 | En desarrollo |
| 11. Editor 2D | Manipulación vectorial, multiselección, grupos, medición y edición precisa. | 2–3 | En desarrollo |
| 12. Motor 3D | Cámaras, selección y transformaciones sincronizadas con el plano. | 2 | En desarrollo |
| 13. Hiperrealismo | Materiales, modelos, iluminación, resolución y calidad adaptable. | 7 | En desarrollo |
| 14. Biblioteca | Equipos genéricos/comerciales, paramétricos y conjuntos extensibles. | 4 | En desarrollo |
| 15. Ficha maestra | Geometría, puertos, procedencia, verificación, versiones y licencias. | 4 | En desarrollo |
| 16. Equipos personalizados | Asistente, variantes y biblioteca persistente entre proyectos. | 4 | En desarrollo |
| 17. Importación GLB/glTF | Validación, escalado uniforme, orientación, recursos, licencia y fallback. | 4 | Pendiente |
| 18. Objetos paramétricos | Pantallas, arrays, tarimas y familias estructurales con geometría derivada. | 4 | En desarrollo |
| 19. Pantallas LED | Dimensiones libres y módulos; montaje, datos de fabricante y contenido. | 4 | En desarrollo |
| 20. Line arrays | Gabinetes individuales, ángulos, simetría, montaje e inventario. | 4 | En desarrollo |
| 21. Grupos y relaciones físicas | Grupos, jerarquía, soportes y edición interna independiente del audio. | 3 | En desarrollo |
| 22. Plantillas | Puestos y escenarios con nuevos IDs y resolución de conflictos de canales. | 4 | Pendiente |
| 23. Capas | Visibilidad/bloqueo/filtros y presets por disciplina. | 3 | En desarrollo |
| 24. Colisiones | Ocupación física, interferencias y revisión trazable de advertencias. | 3 | En desarrollo |
| 25. Entradas y salidas de audio | Marcadores vinculados por ID y distinción de todas las entidades técnicas. | 5 | En desarrollo |
| 26. Input list | Tabla viva, fuentes multicanal, soportes, captadores y phantom. | 5 | En desarrollo |
| 27. Output list y monitoreo | Mezcla, bus, puertos, destinos y recursos mono/estéreo. | 5 | En desarrollo |
| 28. Perfiles de consola | Capacidades verificadas, perfiles independientes y adaptadores futuros. | 5 | En desarrollo |
| 29. Stageboxes y patch | Puertos, ocupación, conexiones, múltiples dispositivos y splitters. | 5 | En desarrollo |
| 30. Flujo de señales | Grafo técnico, vistas simple/patch/cableado y longitudes diferenciadas. | 5 | Pendiente |
| 31. Monitoreo por músico | Matriz fuentes/mezclas y datos RF separados del patch. | 5 | Pendiente |
| 32. Patch automático | Orden configurable, pares, bloqueos, vista previa y reversión. | 5 | En desarrollo |
| 33. Inventario | Catálogo, existencias personales y uso en proyecto diferenciados. | 4 | En desarrollo |
| 34. Versionado del catálogo | Definiciones históricas conservadas y actualización explícita. | 4 | En desarrollo |
| 35. Persistencia | Autosave, recuperación, historial, importación, respaldo y migraciones. | 1 | En desarrollo |
| 36. Generador de riders | Stage plot, plano, dossier y documentación departamental. | 6 | En desarrollo |
| 37. Estructura del rider | Secciones seleccionables derivadas del proyecto, sin páginas vacías. | 6 | En desarrollo |
| 38. Configurador documental | Papel, plantillas, secciones, cámaras, personalización y preview. | 6 | Pendiente |
| 39. Planos a escala | Ajustar a página diferenciado de escala técnica física. | 6 | En desarrollo |
| 40. PDF | Texto/vector, paginación, encabezados y lectura monocromática. | 6 | En desarrollo |
| 41. Imágenes 3D | Cámaras persistentes y render a resolución nativa solicitada. | 6 | En desarrollo |
| 42. Formatos | PDF, PNG, SVG, CSV, XLSX, JSON y paquete editable con recursos. | 6 | En desarrollo |
| 43. Revisiones | Instantáneas, estados explícitos, archivos asociados y comparación. | 6 | En desarrollo |
| 44. Validación global | Audio, geometría, recursos y documentación técnica incompleta. | 5 | En desarrollo |
| 45. Flujos reales | Flujos A–F reproducibles desde creación hasta revisión documental. | 1–8 | En desarrollo |
| 46. Pruebas | Dominio, integración, navegador, exportaciones y rendimiento. | 1–8 | En desarrollo |
| 47. Robustez y accesibilidad | Validación de archivos, errores, límites, confirmación y teclado. | 8 | En desarrollo |
| 48. Sin conexión | Funciones esenciales y recursos locales disponibles offline. | 8 | En desarrollo |
| 49. Calidad visual | Modelos legibles, fidelidad métrica y navegación natural. | 7 | En desarrollo |
| 50. Plan de hitos | Ocho hitos integrados sobre una única arquitectura. | 1–8 | Implementada |
| 51. Criterios de finalización | Código, build, pruebas, UI, persistencia, integración y evidencia. | 1–8 | Implementada |
| 52. Proyecto demostrativo | Escenario banda completa, LED, PA, músicos, entradas y salidas. | 2–6 | En desarrollo |
| 53. Documentación | Instalación, arquitectura, datos, módulos, seguimiento y continuidad. | 1–8 | Implementada |
| 54. Flujo de desarrollo | Avanzar con base ejecutable, corregir antes de acumular módulos. | 1–8 | Implementada |
| 55. Condiciones de calidad | Precisión, estabilidad, capacidades reales y límites explícitos. | 1–8 | Pendiente |
| 56. Resultado final | Producto profesional completo; no satisfecho por una demo básica. | 1–8 | Pendiente |
| 57. Primera entrega | Escenario editable, dos vistas, transformación, guardado y pruebas. | 1–2 | Probada |

Las secciones 1, 2, 50, 51 y 54 definen el proceso de trabajo; “Implementada” allí significa que el plan y las reglas están registrados, no que los ocho hitos estén terminados. Las secciones 3, 55 y 56 describen la calidad y el producto final y permanecen pendientes hasta cumplir su alcance integral.

## Funcionalidades y extensiones

### 4. Principios arquitectónicos

| ID | Funcionalidad | Estado |
| --- | --- | --- |
| F04.1 | Modelo compartido por escena, audio y exportaciones | Probada |
| F04.2 | Dimensiones independientes del zoom y plataforma | Probada |
| F04.3 | Definición de catálogo separada de instancia | Probada |
| F04.4 | Representaciones y geometría física separadas | Implementada |
| F04.5 | Audio independiente de distribución física | Probada |
| F04.6 | Persistencia segura e integridad de revisiones | Probada |

### 5. Tecnologías y arquitectura

| ID | Funcionalidad | Estado |
| --- | --- | --- |
| F05.1 | React/TypeScript estricto/Vite y estructura modular | Probada |
| F05.2 | Pruebas Vitest, Playwright e IndexedDB simulada | Probada |
| F05.3 | PWA instalable y almacenamiento local | En desarrollo |
| F05.4 | Adaptador de distribución Windows/Tauri | Pendiente |

### 6. Administración de proyectos

| ID | Funcionalidad | Estado |
| --- | --- | --- |
| F06.1 | Crear proyecto y configurar escenario | Probada |
| F06.2 | Abrir, recientes, renombrar y fecha de modificación | Implementada |
| F06.3 | Duplicar con identidades independientes | Probada |
| F06.4 | Archivar y eliminar con confirmación | Implementada |
| F06.5 | Importar y exportar respaldo editable | Probada |
| F06.6 | Metadatos organización/fecha/descripción conservados en esquema y exportación; edición desde UI pendiente | En desarrollo |
| F06.7 | Contactos, recursos, plantillas documentales y unidades por proyecto | Pendiente |

### 7. Configuración del escenario

| ID | Funcionalidad | Estado |
| --- | --- | --- |
| F07.1 | Rectángulo de medidas libres y elevación | Probada |
| F07.2 | Cuadrícula configurable, visible y snap conmutable | Implementada |
| F07.3 | Conversión centralizada m/cm/mm; interfaz inicial en metros | Probada |
| F07.7 | Selección de unidades de entrada/presentación por proyecto | Pendiente |
| F07.4 | Orientación escénica y origen frontal central | Implementada |
| F07.5 | Formas trapezoidales, curvas, irregulares y compuestas | Pendiente |
| F07.6 | Zonas útiles/restringidas, accesos, niveles y referencias | Pendiente |

### 8. Entorno escénico

| ID | Funcionalidad | Estado |
| --- | --- | --- |
| F08.1 | Equipos admitidos fuera de la plataforma sin recolocación automática | Implementada |
| F08.2 | Piso del recinto de referencia | Implementada |
| F08.3 | Entidad recinto editable: techo, paredes, columnas, alturas y zonas | Pendiente |
| F08.4 | Rampas/escaleras y referencias de suspensión | Pendiente |

### 9. Motor geométrico

| ID | Funcionalidad | Estado |
| --- | --- | --- |
| F09.1 | Posición, rotación, dimensiones y conversión 2D/3D | Probada |
| F09.2 | Huella física girada, límites y ocupación paramétrica | Probada |
| F09.3 | Medición en metros y precisión milimétrica | Implementada |
| F09.4 | Dimensiones no cambian al agrupar o hacer zoom | Probada |
| F09.5 | Pivote inferior coherente y nuevas identidades al duplicar | Probada |
| F09.6 | Símbolos ampliados sin cambiar volumen físico | Pendiente |
| F09.7 | Restricciones por modelo comercial verificado | Pendiente |

### 10. Interfaz

| ID | Funcionalidad | Estado |
| --- | --- | --- |
| F10.1 | Barra de proyecto/guardado/historial/exportación | Implementada |
| F10.2 | Catálogo lateral con búsqueda/categorías | Implementada |
| F10.3 | Vistas 2D, 3D y dividida | Implementada |
| F10.4 | Propiedades y panel técnico inferior | Implementada |
| F10.5 | Temas claro/oscuro, foco y controles compactos | Implementada |
| F10.6 | Atajos de teclado y adaptación a escritorio | Implementada |
| F10.7 | Layout reorganizable y presets de espacio de trabajo | Pendiente |

### 11. Editor 2D

| ID | Funcionalidad | Estado |
| --- | --- | --- |
| F11.1 | Selección, arrastre, rotación y posición numérica | Probada |
| F11.2 | Duplicar/eliminar, selección múltiple y grupos | Probada |
| F11.3 | Bloquear/ocultar y deshacer/rehacer | Probada |
| F11.4 | Zoom/pan/ajuste y cotas del escenario | Implementada |
| F11.5 | Medición entre puntos | Implementada |
| F11.6 | Copiar/pegar por teclado con identidades nuevas | Implementada |
| F11.7 | Alineación de centros de grupos/subárboles como unidades en X/Y | Probada (dominio) |
| F11.8 | Distribución uniforme de centros, conservando extremos y relaciones internas | Probada |
| F11.9 | Guías magnéticas entre equipos, umbral visual y suspensión con Alt | Probada |

### 12. Motor 3D

| ID | Funcionalidad | Estado |
| --- | --- | --- |
| F12.1 | Órbita 360°, zoom y pan | Implementada |
| F12.2 | Cámaras frontal/posterior/laterales/superior/isométrica | Implementada |
| F12.3 | Selección compartida y manipulación de posición/rotación | Implementada |
| F12.4 | Separación entre navegación y edición | Implementada |
| F12.5 | Encuadre a selección y captura PNG | Implementada |
| F12.6 | Cámaras personalizadas persistentes y recorrido primera persona | Pendiente |
| F12.7 | Escalado condicionado al tipo de equipo | Pendiente |

### 13. Hiperrealismo

| ID | Funcionalidad | Estado |
| --- | --- | --- |
| F13.1 | Modelos genéricos procedurales y materiales básicos | Implementada |
| F13.2 | Iluminación, sombras y antialiasing | Implementada |
| F13.3 | Modo presentación con calidad gráfica adaptable | Pendiente |
| F13.4 | Texturas PBR detalladas, personas naturales e hiperrealismo | Pendiente |
| F13.5 | LOD, instanciación masiva y presupuesto de memoria GPU | Pendiente |

### 14. Biblioteca

| ID | Funcionalidad | Estado |
| --- | --- | --- |
| F14.1 | Biblioteca genérica de personas/instrumentos/audio/video/escenario | Implementada |
| F14.2 | Búsqueda, categorías y favoritos | Implementada |
| F14.3 | Biblioteca personal persistente | Implementada |
| F14.4 | Variantes completas de micrófonos, soportes, amplificación y monitoreo | Pendiente |
| F14.5 | Catálogo completo de iluminación, electricidad, red y accesorios | Pendiente |
| F14.6 | Modelos de fabricante verificados y conjuntos inteligentes | Pendiente |

### 15. Ficha maestra

| ID | Funcionalidad | Estado |
| --- | --- | --- |
| F15.1 | Ficha con ID, nombre, categoría, versión, dimensiones y origen | Implementada |
| F15.2 | Marca/modelo/peso/puertos/alimentación/montaje/documentación | Pendiente |
| F15.3 | Anclajes/pivotes y restricciones por familia | Pendiente |
| F15.4 | Fuente/licencia y estados verificado/estimado/faltante por dato | Pendiente |

### 16. Equipos personalizados

| ID | Funcionalidad | Estado |
| --- | --- | --- |
| F16.1 | Alta genérica con nombre, tipo y dimensiones | Probada |
| F16.2 | Guardar equipo personal para otros proyectos | Probada |
| F16.3 | Duplicar definición y administrar variantes | Pendiente |
| F16.4 | Asistente completo de conexiones, apoyos, preview y recursos | Pendiente |

### 17. Importación GLB/glTF

| ID | Funcionalidad | Estado |
| --- | --- | --- |
| F17.1 | Importar/validar GLB y glTF 2.0 | Pendiente |
| F17.2 | Verificar texturas, unidades, orientación y dimensión física confirmada | Pendiente |
| F17.3 | Escalado uniforme, punto de apoyo, frente y miniatura | Pendiente |
| F17.4 | Licencia, niveles de detalle, respaldo genérico y límites de archivos | Pendiente |

### 18. Objetos paramétricos

| ID | Funcionalidad | Estado |
| --- | --- | --- |
| F18.1 | LED y line array con geometría/inventario derivados | Implementada |
| F18.2 | Tarima con dimensiones editables | Implementada |
| F18.3 | Truss, escalera, rampa, telón, mesa modular, grada y barrera | Pendiente |
| F18.4 | Propagación de parámetros a soportes y relaciones físicas | Pendiente |

### 19. Pantallas LED

| ID | Funcionalidad | Estado |
| --- | --- | --- |
| F19.1 | Columnas/filas/dimensión de gabinete y conteo | Probada |
| F19.2 | Ancho/alto/profundidad y elevación derivados | Implementada |
| F19.3 | Representación de gabinetes individuales | Implementada |
| F19.4 | Modalidad libre, montaje y soportes configurables | Pendiente |
| F19.5 | Pitch/resolución/peso/consumo con datos conocidos | Pendiente |
| F19.6 | Contenido local imagen/textura/apagado y advertencia de combinaciones | Pendiente |

### 20. Line arrays

| ID | Funcionalidad | Estado |
| --- | --- | --- |
| F20.1 | Gabinetes individuales, cantidad y splay | Probada |
| F20.2 | Lados independientes y dimensiones derivadas | Probada |
| F20.3 | Inventario de cantidad total por definición | Probada |
| F20.4 | Vinculación simétrica, ángulos individuales y ángulo general | Pendiente |
| F20.5 | Flybars/accesorios compatibles y datos de peso verificados | Pendiente |
| F20.6 | Configuración asociada de subs/front fills/out fills | Pendiente |

### 21. Grupos y relaciones físicas

| ID | Funcionalidad | Estado |
| --- | --- | --- |
| F21.1 | Agrupar/desagrupar y traslación conjunta | Probada |
| F21.2 | Conservar dimensiones e identidad técnica al mover | Probada |
| F21.3 | Propagación multinivel de traslación/giro Z/altura de soportes y rechazo atómico por bloqueo o límites | Probada (dominio) |
| F21.4 | Editar un miembro del grupo y sus descendientes sin mover sus hermanos | Probada |
| F21.5 | Inspector para anclar/desanclar, apoyar arriba y editar posición/giro relativos; árbol de escena | Probada |
| F21.6 | Puntos de conexión configurables y rotación física en tres ejes | Pendiente |
| F21.8 | Pivote de giro XY local configurable, control 2D/3D y persistencia | Probada |
| F21.7 | Guardar conjuntos inteligentes reutilizables | Pendiente |

### 22. Plantillas

| ID | Funcionalidad | Estado |
| --- | --- | --- |
| F22.1 | Proyecto demo reutilizable con nuevos IDs | Probada |
| F22.2 | Plantillas de puestos, bandas, conferencias, iglesias y equipos | Pendiente |
| F22.3 | Conservar soportes, fuentes y conexiones propuestas | Pendiente |
| F22.4 | Resolver canales ocupados al insertar sin duplicar IDs | Pendiente |

### 23. Capas

| ID | Funcionalidad | Estado |
| --- | --- | --- |
| F23.1 | Visibilidad y bloqueo efectivos: bandera individual o de capa, conservando datos técnicos | Probada |
| F23.2 | Crear, renombrar, asignar y eliminar capas por disciplina; máximo 64 | Probada |
| F23.3 | Bloqueo, selección y visibilidad colectiva desde el panel de capas | Probada |
| F23.4 | Presets reutilizables de capas y filtros | Pendiente |

### 24. Colisiones

| ID | Funcionalidad | Estado |
| --- | --- | --- |
| F24.1 | Advertencias de límites físicos | Probada |
| F24.2 | Comprobación inicial de dimensiones válidas | En desarrollo |
| F24.3 | Intersecciones de prismas orientados y gabinetes de array; penetración de plataforma | Probada |
| F24.5 | Altura de recinto, validación general de apoyos y zonas restringidas | Pendiente |
| F24.4 | Motivo, firma geométrica, fecha, reapertura e historial de interferencias en UI/PDF | Probada |

### 25. Entradas y salidas de audio

| ID | Funcionalidad | Estado |
| --- | --- | --- |
| F25.1 | IDs estables y canal lógico separado del puerto | Probada |
| F25.2 | Fuente, captador, patch, salida y destino | Implementada |
| F25.3 | Marcadores I/O monocromáticos derivados en SVG/PDF exportados | Implementada |
| F25.6 | Marcadores I/O interactivos en el editor | Pendiente |
| F25.4 | Arrastrar marcador independiente, offset, tamaño y visibilidad | Pendiente |
| F25.5 | Consola/puerto/bus/conexión como entidades completas | Pendiente |

### 26. Input list

| ID | Funcionalidad | Estado |
| --- | --- | --- |
| F26.1 | Tabla editable: canal, fuente, captador, phantom, puerto y notas | Implementada |
| F26.2 | Fuentes multicanal como señales separadas | Implementada |
| F26.3 | Vincular y seleccionar objeto desde tabla | Implementada |
| F26.4 | Columnas personalizadas y datos de soporte/posición | Pendiente |
| F26.5 | Pares asociados, reservas y fuente agrupada | Pendiente |
| F26.6 | Phantom de cuatro estados | Pendiente |

### 27. Output list y monitoreo

| ID | Funcionalidad | Estado |
| --- | --- | --- |
| F27.1 | Salidas mono/estéreo, bus y destinos múltiples | Implementada |
| F27.2 | Contar dos recursos físicos para estéreo | Probada |
| F27.3 | Varias cuñas compartiendo mezcla sin duplicar bus | Probada |
| F27.4 | Separar completamente puerto físico y salida lógica | Pendiente |
| F27.5 | Tipos de monitor, sistema cableado/inalámbrico y observaciones | Pendiente |

### 28. Perfiles de consola

| ID | Funcionalidad | Estado |
| --- | --- | --- |
| F28.1 | Crear/duplicar/seleccionar perfiles genéricos con capacidades explícitas | Implementada |
| F28.2 | Patch independiente preservando fuentes y geometría | Probada |
| F28.3 | Advertir insuficiencia de canales/salidas | Probada |
| F28.4 | Mackie DL32S y Behringer XR18 con especificaciones verificadas | Pendiente |
| F28.5 | Capacidades analógicas/digitales, buses/grupos/matrices y expansiones | Pendiente |
| F28.6 | Adaptadores de archivos de consola y control en vivo | Pendiente |

### 29. Stageboxes y patch

| ID | Funcionalidad | Estado |
| --- | --- | --- |
| F29.1 | Asignación de puerto y detección de doble ocupación | Probada |
| F29.2 | Capacidad de entradas de stagebox por perfil | Probada |
| F29.3 | Múltiples stageboxes físicas con conectores y salidas | Pendiente |
| F29.4 | Patch directo, splitters, rutas analógicas/digitales y compatibilidad | Pendiente |
| F29.5 | Eliminar stagebox preservando fuente y marcando ruta pendiente | Pendiente |

### 30. Flujo de señales

| ID | Funcionalidad | Estado |
| --- | --- | --- |
| F30.1 | Representación tabular fuente/canal/puerto | Implementada |
| F30.2 | Grafo y vistas origen/destino, patch y cableado | Pendiente |
| F30.3 | Conectores XLR/TRS/speakON/Ethernet/HDMI/SDI/alimentación | Pendiente |
| F30.4 | Distancia, recorrido planificado, recomendado y confirmado | Pendiente |

### 31. Monitoreo por músico

| ID | Funcionalidad | Estado |
| --- | --- | --- |
| F31.1 | Asignación de destinos a una salida/mezcla | Implementada |
| F31.2 | Matriz de fuentes por mezcla y pertenencia sin niveles inventados | Pendiente |
| F31.3 | Monitoreo por músico con datos completos | Pendiente |
| F31.4 | Registro RF independiente y coordinación | Pendiente |

### 32. Patch automático

| ID | Funcionalidad | Estado |
| --- | --- | --- |
| F32.1 | Completar puertos disponibles respetando asignaciones bloqueadas | Probada |
| F32.2 | Revertir mediante historial | Implementada |
| F32.3 | Orden configurable, pares estéreo, preview de renumeración | Pendiente |

### 33. Inventario

| ID | Funcionalidad | Estado |
| --- | --- | --- |
| F33.1 | Cantidades de equipos usados desde instancias | Implementada |
| F33.2 | Gabinetes LED y array contados según parámetros | Implementada |
| F33.3 | Existencias personales, ubicación y estado | Pendiente |
| F33.4 | Propio/alquilado/provisto/pendiente y faltantes | Pendiente |

### 34. Versionado del catálogo

| ID | Funcionalidad | Estado |
| --- | --- | --- |
| F34.1 | Versión y definición embebida en cada instancia | Implementada |
| F34.2 | Históricos independientes de actualización del catálogo | Implementada |
| F34.3 | Aplicar actualización explícita y archivar modelos | Pendiente |

### 35. Persistencia

| ID | Funcionalidad | Estado |
| --- | --- | --- |
| F35.1 | IndexedDB, guardado explícito y automático | Probada |
| F35.2 | Estado de guardado y errores | Implementada |
| F35.3 | Deshacer/rehacer y revisiones guardadas | Probada |
| F35.4 | Importar/exportar JSON validado y respaldo editable | Probada |
| F35.5 | Reabrir último proyecto local al iniciar | Probada |
| F35.8 | Petición de almacenamiento persistente del navegador | Pendiente |
| F35.6 | Paquete .stagepro con recursos y manifiesto | Pendiente |
| F35.9 | Formato .stagepro como JSON validado de esquema 3; lectura de esquemas 1, 2 y 3 | Probada |
| F35.7 | Migración validada 1→2→3 sin reescribir revisiones originales; remapeo de capas al duplicar | Probada |

### 36. Generador de riders

| ID | Funcionalidad | Estado |
| --- | --- | --- |
| F36.1 | Stage plot y rider básico desde proyecto/perfil activo | Implementada |
| F36.2 | Documento compacto de una página con leyenda/contactos/monitoreo | Pendiente |
| F36.3 | Plano técnico y dossier completos | Pendiente |
| F36.4 | Presentación 3D y documentos departamentales | Pendiente |

### 37. Estructura del rider

| ID | Funcionalidad | Estado |
| --- | --- | --- |
| F37.1 | Escenario, plano, input/output, patch e inventario | Implementada |
| F37.2 | Portada, contactos, requerimientos, observaciones y revisión | Pendiente |
| F37.3 | Frontal/isométrica/otras vistas y backline especializado | Pendiente |
| F37.4 | Iluminación/electricidad/conexiones y secciones seleccionables | Pendiente |

### 38. Configurador documental

| ID | Funcionalidad | Estado |
| --- | --- | --- |
| F38.1 | Acciones de exportación de formatos disponibles | Implementada |
| F38.2 | Vista previa, papel A4/A3 vertical/horizontal y tamaños propios | Pendiente |
| F38.3 | Plantillas Technical Clean / Production Pro / Visual Presentation | Pendiente |
| F38.4 | Orden/secciones, logo, colores, cámaras y contactos | Pendiente |

### 39. Planos a escala

| ID | Funcionalidad | Estado |
| --- | --- | --- |
| F39.1 | SVG vectorial proporcional y cotas métricas | Implementada |
| F39.2 | Plano ajustado a página sin escala fija falsa | Implementada |
| F39.3 | Escalas 1:25/1:50/1:100/personalizada y comprobación de impresión | Pendiente |
| F39.4 | Barra gráfica de 1 m y orientación en SVG/PDF | Implementada |
| F39.5 | Alternativas de papel cuando el plano a escala fija no entra | Pendiente |

### 40. PDF

| ID | Funcionalidad | Estado |
| --- | --- | --- |
| F40.1 | PDF con texto y tablas paginadas | Probada |
| F40.2 | Planos proporcionales y encabezados de tabla | Implementada |
| F40.3 | Pruebas de contenido, apertura y tablas largas | Probada |
| F40.4 | Preflight visual extensivo y símbolos monocromáticos completos | Pendiente |

### 41. Imágenes 3D

| ID | Funcionalidad | Estado |
| --- | --- | --- |
| F41.1 | Captura PNG de la vista 3D real | Implementada |
| F41.2 | Cámaras de documentación persistentes | Pendiente |
| F41.3 | Render nativo 1080p/4K/personalizado y cálculo DPI | Pendiente |

### 42. Formatos

| ID | Funcionalidad | Estado |
| --- | --- | --- |
| F42.1 | PDF/PNG/SVG/CSV y JSON editable | Probada |
| F42.2 | XLSX | Pendiente |
| F42.3 | Contenedor nativo y paquete con recursos | Pendiente |

### 43. Revisiones

| ID | Funcionalidad | Estado |
| --- | --- | --- |
| F43.1 | Guardar y recuperar instantánea completa | Implementada |
| F43.2 | Regenerar documentos desde proyecto de revisión | Implementada |
| F43.3 | Estados borrador/revisión/aprobado con acción explícita | Pendiente |
| F43.4 | Número, metadatos y documentos asociados | Pendiente |
| F43.5 | Comparar posiciones, cantidades, patch y parámetros | Pendiente |

### 44. Validación global

| ID | Funcionalidad | Estado |
| --- | --- | --- |
| F44.1 | Límites/dimensiones y conflictos de canales/puertos/capacidad | Implementada |
| F44.2 | Fuentes sin asignación y patch incompleto | Implementada |
| F44.3 | Advertencias seleccionables sin impedir guardado | Implementada |
| F44.4 | Buses, compatibilidad, alimentación y datos técnicos pendientes | Pendiente |
| F44.5 | Recursos faltantes, rigging y revisión trazable | Pendiente |

### 45. Flujos reales

| ID | Funcionalidad | Estado |
| --- | --- | --- |
| F45.1 | A: crear, equipar, configurar audio, guardar y exportar | En desarrollo |
| F45.2 | B: configurar LED, geometría e inventario | En desarrollo |
| F45.3 | C: arrays seis/ocho cajas independientes | En desarrollo |
| F45.4 | D: perfiles de audio con escena invariable | En desarrollo |
| F45.5 | E: conjuntos anclados y plantilla | Pendiente |
| F45.6 | F: plantillas/preview/comparación documental | Pendiente |

### 46. Pruebas

| ID | Funcionalidad | Estado |
| --- | --- | --- |
| F46.1 | Pruebas unitarias de geometría, transformaciones y escala | Probada |
| F46.2 | Pruebas de estado, persistencia y JSON inválido | Probada |
| F46.3 | Pruebas de audio/perfiles/capacidad/patch | Probada |
| F46.4 | Pruebas de exportación y paginación | Probada |
| F46.5 | E2E de primera demo y reapertura | Probada |
| F46.6 | Cobertura completa de anclajes, splitters, revisiones y migraciones | Pendiente |
| F46.7 | Benchmark medible de rendimiento y memoria | Pendiente |
| F46.8 | Dominio de capas, jerarquías multinivel, distribución y migración 1→2 | Probada |
| F46.9 | Flujos Chromium de anclajes, capas, grupos, migración y comandos durante arrastres | Probada |

### 47. Robustez y accesibilidad

| ID | Funcionalidad | Estado |
| --- | --- | --- |
| F47.1 | Validación de entradas, tamaño y referencias de JSON | En desarrollo |
| F47.2 | Confirmar eliminación y mostrar errores recuperables | En desarrollo |
| F47.3 | Foco, etiquetas y alternativas numéricas al arrastre | En desarrollo |
| F47.4 | ZIP abusivo, rutas y modelos externos | Pendiente |
| F47.5 | Auditoría de accesibilidad y matriz navegador/hardware | Pendiente |

### 48. Sin conexión

| ID | Funcionalidad | Estado |
| --- | --- | --- |
| F48.1 | PWA y caché de recursos esenciales de producción | Probada |
| F48.2 | Persistencia, edición y exportaciones sin cuenta | Probada |
| F48.3 | E2E offline luego de cargar la app | Probada |
| F48.4 | Gestión de recursos remotos opcionales y actualizaciones | Pendiente |

### 49. Calidad visual

| ID | Funcionalidad | Estado |
| --- | --- | --- |
| F49.1 | Estética coherente y modelos procedurales reconocibles | En desarrollo |
| F49.2 | Fidelidad dimensional y gabinetes individuales | En desarrollo |
| F49.3 | Evaluación con usuarios de montaje y hardware de referencia | Pendiente |
| F49.4 | Calidad final hiperrealista de presentación | Pendiente |

### 52. Proyecto demostrativo

| ID | Funcionalidad | Estado |
| --- | --- | --- |
| F52.1 | Escenario 8×6×0,8 m; LED 5×2,5 m; arrays 6 por lado | Implementada |
| F52.2 | Banda completa, micrófonos y monitores genéricos | Implementada |
| F52.3 | Lista de fuentes, perfiles, patch e inventario de prueba | Implementada |
| F52.4 | IEM estéreo y mezcla de dos cuñas compartidas en demo | Implementada |
| F52.6 | Matriz de monitoreo completa de la demo | Pendiente |
| F52.5 | Consolas de fabricante con capacidades verificadas | Pendiente |

### 53. Documentación

| ID | Funcionalidad | Estado |
| --- | --- | --- |
| F53.1 | README, arquitectura, datos, decisiones y continuidad | Implementada |
| F53.2 | Matriz completa de alcance y limitaciones | Implementada |
| F53.3 | Registro de comandos ejecutados y resultados | Probada |

### 57. Primera entrega

| ID | Funcionalidad | Estado |
| --- | --- | --- |
| F57.1 | Primera demo de medidas/editado/selección/transformación 2D/3D | Probada |
| F57.2 | Guardado/reapertura y pruebas de escala/persistencia | Probada |

## Evidencia de ejecución

La primera entrega registró 56 pruebas unitarias/de integración, 8 E2E, build, tipos, instalación congelada y formato aprobados. El bloque de precisión pasa **142 pruebas Vitest**, tipos, build y formato. Se verificaron **16 flujos Chromium**: los trece anteriores y tres nuevos de pivotes, guías e interferencias. Los dos fallos iniciales de automatización se corrigieron y sus pruebas se repitieron correctamente; ver PRUEBAS.md. También pasó la verificación bajo dos subrutas con cachés separadas y recarga offline.

Las marcas **Probada** remiten al alcance específico en `PRUEBAS.md`; **Probada (dominio)** identifica operaciones verificadas en lógica/estado sin afirmar todavía su flujo completo en navegador. La primera demostración (hitos 1–2) está verificada y los hitos 3–8 siguen abiertos. Las capas/anclajes, la distribución y la migración 1→2 amplían el hito 3. Las guías, pivotes XY e interferencias físicas están probados; siguen abiertos presets, puntos de conexión, recinto y validación general de apoyos.

## Hitos y orden de continuidad

| Hito | Criterio de entrega | Estado |
| --- | --- | --- |
| 1. Fundación | Aplicación ejecutable, documento tipado, almacenamiento y pruebas | Probada |
| 2. Geometría y primera escena | Mover y rotar desde 2D/3D sin alterar medidas | Probada |
| 3. Editor completo | Grupos/anclajes/capas/alineación y validación geométrica | En desarrollo |
| 4. Catálogo y equipamiento | Equipos personalizados, GLB, paramétricos, conjuntos y plantillas | En desarrollo |
| 5. Audio y patch | Grafo técnico, perfiles, monitoreo y validación completos | En desarrollo |
| 6. Documentación | Plantillas, preview, escalas, revisiones y todos los formatos | En desarrollo |
| 7. Hiperrealismo | Modelos/materiales/render de presentación y optimización | Pendiente |
| 8. Validación y distribución | Pruebas integrales, recuperación, offline y distribución | En desarrollo |

No se cierran hitos 3–8 por implementar una parte. Para cada cierre deben cumplirse los nueve criterios de la sección 51: código, compilación, pruebas, ausencia de errores críticos conocidos, operación desde UI, persistencia, integración, documentación y flujo reproducible.

## Límites que no se presentan como capacidades

- Los equipos genéricos no son especificaciones comerciales verificadas.
- Dibujar soportes o arrays no certifica rigging, cargas eléctricas ni cobertura acústica.
- No hay control de consolas reales ni promesa de compatibilidad con archivos propietarios.
- Una captura 3D al tamaño del canvas no equivale a render 4K nativo ni hiperrealismo.
- Controles o tipos preparados sin operación completa permanecen pendientes o en desarrollo.
- Los perfiles de demo son configuraciones genéricas; los modelos DL32S/XR18 requieren investigación y fuentes oficiales antes de incorporarlos.

- El PDF y SVG exportan geometría y datos válidos, pero las etiquetas pueden superponerse en montajes densos; la composición automática de llamadas y leyendas sigue pendiente.
- El build advierte chunks mayores a 500 kB (núcleo y Three.js); aún falta medir rendimiento y separar más recursos.
- El modo offline fue probado en Chromium. La instalación desde el navegador y la actualización de una PWA previamente instalada no se probaron.
- Duplicar elementos del editor copia geometría y relaciones físicas; no crea nuevas fuentes/patch de audio. Duplicar un proyecto sí remapea sus entidades técnicas.
