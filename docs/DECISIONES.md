# Registro de decisiones

| ID | Decisión | Motivo y consecuencia |
| --- | --- | --- |
| ADR-001 | React + TypeScript estricto + Vite | Base web modular, con build reproducible y posible envoltorio de escritorio posterior. |
| ADR-002 | Metros en el dominio, X lateral/Y profundidad/Z altura | Evita que cámara, píxeles o unidades de presentación cambien la física del proyecto. |
| ADR-003 | Una instancia conserva una copia de su definición | Protege proyectos y revisiones cuando cambian los modelos del catálogo. |
| ADR-004 | SVG para plano y Three.js/R3F para escena | Ambos son adaptadores del mismo documento; el modelo no depende del motor de representación. |
| ADR-005 | IndexedDB mediante Dexie | Desarrollo local sin cuenta ni servicios externos. Requiere respaldos exportados para transferir o proteger trabajo fuera del navegador. |
| ADR-006 | Snapshot del proyecto para historial inicial | Operaciones atómicas sencillas; deben medirse memoria y latencia antes de ampliar escenas muy grandes. No se promete edición ilimitada. |
| ADR-007 | Geometría procedural y equipos genéricos iniciales | Permite editar a escala sin distribuir recursos de terceros ni presentar dimensiones inventadas como datos de fabricante. |
| ADR-008 | jsPDF + AutoTable | Documentos vectoriales y tablas paginadas sin servicio externo; verificar archivos y maquetación con contenido real. |
| ADR-009 | Separar fuente técnica de patch de perfil | Cambiar consola o puerto no destruye la fuente ni modifica posiciones de escena. |
| ADR-010 | Advertencia al salir de la plataforma | Los equipos pueden pertenecer al entorno: no se recolocan ni eliminan automáticamente. |
| ADR-011 | Primera entrega por hitos verificables | La primera demo no es el producto completo. Toda capacidad avanzada se conserva en la matriz de alcance. |
| ADR-012 | `.stagepro` como JSON versionado antes de paquetes con recursos | Simplifica validar y respaldar datos iniciales. El esquema 3 conserva capas, pivotes y revisiones de interferencias; valida y migra esquemas 1 y 2. ZIP con recursos, GLB y futuras migraciones permanecen en el plan. |
| ADR-013 | UI y documentación en español | Coincide con el flujo solicitado. Identificadores del código en inglés; internacionalización formal pendiente. |
| ADR-014 | Código de aplicación separado del despliegue | `dist/` es estático. Publicar la app o el entorno requiere una acción separada; una compilación no implica publicación. |
| ADR-015 | Posiciones mundiales como única fuente; transformaciones relativas derivadas | Evita duplicar poses y permite mover jerarquías multinivel sin acumular un segundo documento local. El giro físico actual es alrededor de Z. |
| ADR-016 | Transformación atómica de soportes y grupos | Un descendiente bloqueado o fuera de rango cancela toda la operación y produce un aviso; no se separan miembros silenciosamente. |
| ADR-017 | Capas como organización visual y de edición | Ocultar cambia vistas/planos, pero no el inventario ni audio. El bloqueo de capa se suma al individual y las banderas no se heredan por `parentId`. |
| ADR-018 | Migración validada de documento 1→2 al leer | Añade capas sin cambiar identidades, poses, audio ni revisión original. El guardado posterior usa v2; las tablas Dexie no necesitan índices nuevos. |
| ADR-019 | Alinear/distribuir centros de unidades de selección | Grupos y subárboles conservan posiciones relativas. La distribución mantiene extremos y no pretende calcular huecos iguales entre huellas de distinto tamaño. |
| ADR-020 | Separar comandos discretos de arrastres incompletos | Duplicar, borrar y otras operaciones cancelan primero el gesto y registran su propio paso de deshacer. El cleanup del editor no revierte el comando posterior. |

## Recursos y licencias

Los modelos iniciales se construyen con primitivas y símbolos del proyecto. No se atribuye compatibilidad comercial a equipos genéricos. Para añadir recursos externos deberán registrarse fuente, licencia, condiciones de redistribución y dimensiones confirmadas. La licencia de distribución del código propio debe decidirla su titular antes de distribuirlo públicamente; esta entrega no asigna unilateralmente una licencia al repositorio.

## Dependencias

El archivo de bloqueo fija las versiones instaladas. Las futuras actualizaciones deben conservar verificación de integridad y TLS. En entornos con proxy administrado se utiliza su configuración existente; no se recomienda desactivar certificados ni autenticación para instalar.

## Funcionamiento offline

`npm run build` ejecuta `scripts/build-sw.mjs`: calcula un hash del contenido completo de `dist` y genera un service worker que precachea incluso chunks 3D cargados de forma diferida. El cache match omite `Vary` exclusivamente para los recursos públicos del mismo origen, porque las cabeceras Origin de precache y módulos pueden diferir. No hay caché de datos autenticados ni servicios externos. Una actualización espera el cierre de clientes existentes; no se fuerza una recarga durante la edición. La actualización de instalaciones previas todavía requiere pruebas específicas.

## Decisiones del bloque de precisión

- Guías opcionales con umbral visual constante; no cambiar la precisión de los campos numéricos.
- Pivotes XY como referencias de edición, manteniendo centro inferior y dimensiones como geometría canónica.
- Interferencias como advertencias revisables, usando prismas físicos y gabinetes individuales. El contacto superficial no es penetración.
- Una aceptación intencional sólo se aplica a su firma geométrica y mantiene fecha/motivo; reabrir no borra el registro.
- Artefacto web con rutas relativas y caché aislada por alcance para servir en GitHub Pages. Publicación sólo después de checks en main; no implica que la configuración remota esté habilitada.
