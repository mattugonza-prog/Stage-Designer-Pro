# PROMPT MAESTRO PARA CODEX
# STAGE DESIGNER PRO
## Desarrollo integral de una aplicación profesional para Stage Plots, Technical Riders y planificación escénica 2D/3D

---

# 1. TU ROL Y OBJETIVO

Actuá como un equipo senior de ingeniería de software integrado por:

- Arquitecto de software.
- Desarrollador frontend especializado en React y TypeScript.
- Ingeniero de gráficos 2D/3D especializado en Three.js.
- Especialista en modelado de datos y geometría.
- Diseñador UX/UI de aplicaciones profesionales.
- Ingeniero de audio y sistemas de producción escénica.
- Especialista en generación de documentos PDF.
- Ingeniero de calidad, automatización de pruebas y rendimiento.

Tu responsabilidad es **DISEÑAR, IMPLEMENTAR, PROBAR Y DOCUMENTAR una aplicación funcional**, denominada provisionalmente **Stage Designer Pro**.

No quiero únicamente una propuesta conceptual, una maqueta visual, un prototipo decorativo ni una interfaz con botones que no funcionan.

Quiero comenzar el desarrollo real de un software de nivel profesional que pueda convertirse en mi herramienta principal y definitiva para diseñar escenarios, preparar stage plots, generar riders técnicos, planificar equipamiento y presentar montajes tridimensionales.

La aplicación deberá reunir en un solo sistema las mejores capacidades de herramientas profesionales de diseño escénico y documentación técnica.

## Referencias conceptuales

Tomá como referencia funcional, visual y operativa, sin copiar código, diseños protegidos ni recursos sujetos a licencias incompatibles, herramientas como:

- Stageplot Pro.
- StageBuilder Pro.
- StagePlot Live.
- Techrider.live.
- Plotnik.
- Vectorworks Spotlight.
- Capture.
- SketchUp.
- Meyer Sound MAPP 3D.
- d&b ArrayCalc.

Las referencias son para comprender flujos, convenciones, precisión, configuración de equipos y calidad de presentación.

No se pretende copiar integralmente esas aplicaciones ni desarrollar desde el inicio simulaciones acústicas o estructurales certificadas.

El objetivo es construir una herramienta propia, moderna, intuitiva, potente, visualmente superior y sin depender de suscripciones para sus funcionalidades esenciales.

---

# 2. INSTRUCCIONES GENERALES DE DESARROLLO

Estas instrucciones son obligatorias.

1. Inspeccioná primero el repositorio y el entorno disponible.
2. Si el repositorio está vacío, creá el proyecto desde cero.
3. Si existe código previo, analizalo y reutilizá lo que sea compatible con esta especificación.
4. Establecé una arquitectura modular, tipada, verificable y preparada para ampliaciones.
5. Utilizá versiones estables y compatibles de las dependencias, verificando sus APIs actuales.
6. Implementá funcionalidades reales, no interfaces simuladas.
7. Trabajá por hitos técnicos verificables, pero mantené todo el alcance descrito como objetivo del producto.
8. No descartes funcionalidades complejas por considerarlas opcionales sin registrarlas en el plan.
9. No reemplaces funcionalidades solicitadas por imágenes estáticas o componentes decorativos.
10. No inventes características comerciales, dimensiones o capacidades técnicas de equipos específicos.
11. No utilices modelos 3D, texturas, logotipos ni recursos de terceros sin comprobar sus condiciones de uso.
12. Implementá pruebas automáticas para la lógica crítica.
13. Mantené documentación técnica actualizada.
14. Antes de dar una función por terminada, verificá que realmente funciona.
15. Si una etapa depende de otra, implementá primero la dependencia.
16. Si una capacidad requiere implementación posterior, dejá su arquitectura prevista y documentá su estado real.
17. No marques como completa ninguna funcionalidad que todavía sea un placeholder.
18. No solicites confirmación para decisiones técnicas menores que puedas resolver profesionalmente; documentá las decisiones adoptadas.
19. No borres trabajo existente ni sobrescribas proyectos sin mecanismos de protección.
20. Priorizá siempre precisión de datos, estabilidad, facilidad de uso y calidad visual.

**El objetivo final es una aplicación funcional y mantenible, no una demostración visual.**

---

# 3. VISIÓN DEL PRODUCTO

Stage Designer Pro será una aplicación para construir escenarios virtuales mediante elementos físicos dimensionados a escala real.

Permitirá:

- Definir un escenario con dimensiones exactas.
- Configurar su forma, elevación y orientación.
- Incorporar instrumentos, músicos, micrófonos, soportes, pantallas, PA, monitores, iluminación, estructuras y equipamiento técnico.
- Trabajar con elementos de dimensiones reales.
- Personalizar el catálogo de equipos.
- Configurar pantallas LED por medidas o gabinetes.
- Construir sistemas line array modulares.
- Trabajar con un editor técnico 2D.
- Trabajar simultáneamente con una escena tridimensional.
- Orbitar la escena 360 grados.
- Generar representaciones tridimensionales hiperrealistas.
- Editar objetos desde ambas vistas.
- Configurar entradas, salidas, consolas, stageboxes, buses y mezclas.
- Documentar conexiones y recorridos de señales.
- Generar automáticamente input lists, output lists, patches e inventarios.
- Producir riders técnicos profesionales.
- Exportar planos, documentos e imágenes.
- Guardar, recuperar, duplicar y versionar proyectos.
- Trabajar sin conexión a internet.
- Reutilizar escenarios, equipos y configuraciones.

El producto debe servir tanto para escenarios pequeños como para producciones de iglesias, bandas, conferencias, auditorios y eventos de mayor escala.

La interfaz debe ser suficientemente sencilla para que una persona pueda diseñar visualmente un escenario sin conocimientos de CAD, pero suficientemente rigurosa para que un técnico profesional pueda utilizar su documentación.

---

# 4. PRINCIPIOS ARQUITECTÓNICOS INNEGOCIABLES

## 4.1. Una sola fuente de información

Todos los datos técnicos deben existir una sola vez dentro del modelo del proyecto.

El editor 2D, el editor 3D, las listas de canales, el inventario y los documentos exportados deben utilizar los mismos datos.

No crear modelos independientes de información para cada vista.

Si se modifica un elemento, todos los módulos afectados deberán actualizarse automáticamente.

## 4.2. Dimensiones físicas independientes del zoom

El tamaño real de un objeto no debe cambiar cuando se modifica el zoom de la cámara o las dimensiones del escenario.

Los objetos deben conservar sus dimensiones físicas hasta que el usuario modifique explícitamente un parámetro permitido.

## 4.3. Separación entre definición e instancia

Un modelo de equipo existirá en el catálogo.

Cada elemento colocado dentro de un proyecto será una instancia de ese modelo, con su propio identificador, posición y configuración.

## 4.4. Separación entre geometría y representación

Un objeto debe poder tener:

- Geometría física utilizada para cálculos.
- Símbolo técnico 2D.
- Representación 3D funcional.
- Representación 3D de alta fidelidad.

Las representaciones gráficas no pueden alterar las dimensiones físicas almacenadas.

## 4.5. Separación entre escena y configuración de audio

El escenario físico debe poder permanecer idéntico mientras se cambian las consolas, el patch o las mezclas.

## 4.6. Persistencia segura

Ninguna modificación debe perderse por cambiar entre vistas, cerrar un panel o generar un documento.

## 4.7. Integridad histórica

Actualizar el catálogo o modificar un proyecto no debe alterar silenciosamente documentos o revisiones anteriores.

---

# 5. TECNOLOGÍAS Y ARQUITECTURA

Utilizá como base tecnológica preferida:

- React.
- TypeScript en modo estricto.
- Vite.
- Three.js.
- React Three Fiber.
- SVG interactivo para el editor 2D.
- Zustand para estado del editor.
- IndexedDB mediante Dexie para almacenamiento local.
- Zod o mecanismo equivalente para validar datos.
- React PDF o una solución equivalente para documentos PDF.
- Vitest para pruebas unitarias.
- Playwright para pruebas end-to-end.
- PWA para instalación y funcionamiento sin conexión.
- GLB/glTF 2.0 como formato tridimensional principal.

Podés incorporar bibliotecas adicionales si aportan funcionalidades verificables y son compatibles con el proyecto.

No introduzcas dependencias innecesarias ni servicios pagos obligatorios.

El motor geométrico, las entidades del dominio y las validaciones deben ser independientes de React y del motor gráfico.

La aplicación debe ser una herramienta web instalable inicialmente. Su arquitectura debe permitir una posible distribución futura para Windows mediante Tauri u otra tecnología apropiada, sin necesidad de reescribir el sistema.

## Organización lógica sugerida

- app/: navegación, vistas y estructura visual.
- core/: entidades, coordenadas, geometría, unidades, transformaciones y validaciones.
- editor-2d/: plano, cotas, símbolos y manipulación.
- editor-3d/: cámaras, materiales, modelos e iluminación.
- catalog/: equipamiento, familias, modelos y plantillas.
- audio/: consolas, canales, puertos, buses, señales y monitoreo.
- documents/: riders, planos, PDF y exportaciones.
- storage/: persistencia, paquetes de proyectos y migraciones.
- assets/: modelos, símbolos, texturas y miniaturas.
- tests/: pruebas automatizadas.

La estructura exacta puede ajustarse, pero deben mantenerse estas responsabilidades separadas.

---

# 6. CREACIÓN Y ADMINISTRACIÓN DE PROYECTOS

La aplicación deberá tener una pantalla inicial desde la cual sea posible:

- Crear un proyecto.
- Abrir uno existente.
- Consultar proyectos recientes.
- Duplicar un proyecto.
- Renombrarlo.
- Archivarlo.
- Eliminarlo con confirmación.
- Importar un archivo de proyecto.
- Exportar un respaldo.
- Crear un proyecto desde una plantilla.
- Revisar la última fecha de modificación.

Cada proyecto tendrá:

- ID interno único.
- Nombre.
- Descripción.
- Nombre del evento, si corresponde.
- Organización o responsable.
- Contactos técnicos opcionales.
- Fecha opcional.
- Configuración de unidades.
- Escenario principal.
- Entorno físico.
- Elementos de escena.
- Perfiles de audio.
- Recursos vinculados.
- Plantillas documentales.
- Estado del proyecto.
- Revisiones.
- Fechas de creación y modificación.

El evento no será obligatorio.

El núcleo del proyecto es el escenario y su configuración técnica.

---

# 7. CONFIGURACIÓN DEL ESCENARIO

Al crear un proyecto nuevo, ofrecer un asistente de configuración del escenario.

## Propiedades

- Ancho.
- Profundidad.
- Altura sobre el piso del lugar.
- Forma.
- Orientación.
- Material o color de la superficie.
- Cuadrícula.
- Unidad de medida.
- Área útil y áreas restringidas.
- Niveles y elevaciones.
- Accesos y escaleras.
- Puntos de referencia.

La configuración inicial tendrá escenario rectangular.

Permitir introducir medidas libres, no solamente elegir tamaños predefinidos.

Ejemplo: escenario de 8 metros de ancho, 6 metros de profundidad y 0,80 metros de altura.

Preparar el motor para incorporar posteriormente escenarios trapezoidales, irregulares, curvos o compuestos por varios módulos.

## Unidades

El sistema almacenará internamente longitudes en metros y utilizará precisión suficiente para representar medidas en milímetros.

La interfaz permitirá introducir metros, centímetros y, donde corresponda, milímetros.

Las conversiones deben ser centralizadas y verificables.

## Cuadrícula

Permitir divisiones como:

- 1 metro.
- 50 centímetros.
- 25 centímetros.
- 10 centímetros.
- 1 centímetro, cuando sea útil.

La cuadrícula debe poder mostrarse, ocultarse y utilizarse como referencia magnética.

## Orientación

El escenario tendrá claramente identificados:

- Frente o downstage.
- Fondo o upstage.
- Izquierda escénica.
- Derecha escénica.
- Dirección del público.

La izquierda y derecha escénicas se definen desde la posición del artista mirando al público.

## Convención de coordenadas

Usar para el proyecto:

- X: horizontal.
- Y: profundidad hacia el fondo.
- Z: altura.

El origen principal será el centro del borde frontal de la plataforma.

X positivo apunta hacia la izquierda escénica, que corresponde a la derecha del observador situado entre el público.

Y positivo apunta hacia el fondo.

Z positivo apunta hacia arriba.

Para Three.js, utilizar una conversión centralizada al sistema Y-up, por ejemplo:

- X del proyecto → X del motor.
- Y del proyecto → Z negativo del motor.
- Z del proyecto → Y del motor.

No distribuir conversiones manuales por todos los componentes.

## Regla crítica

Si el escenario cambia de 8 × 6 metros a 10 × 8 metros, los objetos colocados no deben cambiar de tamaño.

Debe aumentar el espacio disponible alrededor de ellos.

Los objetos que queden fuera de límites deben identificarse para revisión, no corregirse silenciosamente.

---

# 8. ENTORNO ESCÉNICO

El escenario y el entorno físico deben existir como entidades diferenciadas.

El entorno puede incluir:

- Piso del lugar.
- Paredes.
- Altura libre.
- Techo.
- Columnas.
- Accesos.
- Rampas.
- Escaleras.
- Estructuras superiores.
- Puntos de referencia de suspensión.
- Áreas laterales.
- Espacios técnicos.
- Sectores restringidos.

Los equipos no tienen que estar obligatoriamente dentro de la superficie del escenario.

Una pantalla puede estar fijada detrás de la plataforma.

Un sistema line array puede encontrarse suspendido a los costados.

El sistema debe admitir estas situaciones sin considerarlas automáticamente errores.

No se deben calcular ni certificar cargas estructurales de suspensión sin datos y métodos adecuados.

---

# 9. MOTOR GEOMÉTRICO Y ESCALA REAL

Este es uno de los módulos más importantes.

Todos los equipos tendrán dimensiones físicas.

Como mínimo:

- Ancho.
- Profundidad.
- Altura.
- Posición.
- Rotación.
- Punto de referencia.
- Volumen de ocupación.
- Relación con soportes o estructuras.

La geometría debe calcularse en unidades reales.

No utilizar píxeles como medidas físicas.

El zoom solamente modifica la visualización.

## Reglas

1. Los objetos específicos mantienen dimensiones verificadas.
2. Los objetos genéricos pueden tener dimensiones predeterminadas editables.
3. Los objetos paramétricos modifican su geometría mediante parámetros explícitos.
4. Un modelo físico no debe deformarse arbitrariamente.
5. El tamaño real debe coincidir entre 2D y 3D.
6. Las dimensiones físicas deben conservarse al agrupar objetos.
7. Las mediciones deben poder realizarse entre elementos.
8. Las transformaciones deben mantener precisión métrica.
9. Los objetos deben tener puntos de anclaje y pivotes coherentes.
10. Las operaciones de copia y duplicación no deben compartir accidentalmente identificadores internos.

## Símbolos 2D

Para elementos pequeños, como micrófonos, permitir símbolos técnicos ampliados visualmente.

Esta ampliación no modificará su volumen real.

Debe distinguirse la geometría física de la representación utilizada para legibilidad.

---

# 10. DISEÑO DE LA INTERFAZ

La interfaz deberá tener una estética premium, profesional, moderna, sobria y consistente.

No crear una apariencia de aplicación infantil, genérica o excesivamente decorativa.

Debe sentirse como una herramienta de ingeniería y producción escénica.

## Organización principal

### Barra superior

- Nombre del proyecto.
- Estado del guardado.
- Deshacer.
- Rehacer.
- Guardar.
- Configuración.
- Cambiar de vista.
- Publicar/exportar.
- Acceso al historial.

### Panel izquierdo

Catálogo de elementos con categorías, búsqueda, filtros, favoritos y miniaturas.

### Área central

Editor principal de escenario.

Permitir:

- Vista 2D.
- Vista 3D.
- Vista dividida 2D/3D.
- Modo técnico.
- Modo presentación.

### Panel derecho

Propiedades del elemento seleccionado.

Debe permitir modificar dimensiones, posición, rotación, propiedades técnicas y conexiones según el tipo de objeto.

### Panel inferior expandible

- Input list.
- Output list.
- Patch.
- Inventario.
- Capas.
- Advertencias.
- Historial o registros de cambios.

La interfaz debe permitir reorganizar espacios de trabajo cuando sea razonable.

## Diseño visual

- Tipografía legible.
- Jerarquía clara.
- Íconos consistentes.
- Paneles ordenados.
- Separadores discretos.
- Buen contraste.
- Modo oscuro y claro.
- Controles compactos pero cómodos.
- Estados hover, selección, foco y deshabilitado.
- Atajos de teclado.
- Indicaciones de guardado y errores.

El uso principal será en computadora con mouse y teclado.

La interfaz debe adaptarse a diferentes resoluciones de escritorio.

El soporte táctil podrá ampliarse después, pero no debe comprometer la precisión inicial del editor.

---

# 11. EDITOR 2D

Desarrollar un editor cenital profesional, vectorial e interactivo.

Debe permitir:

- Seleccionar elementos.
- Arrastrar.
- Rotar.
- Duplicar.
- Copiar y pegar.
- Eliminar.
- Selección múltiple.
- Agrupar y desagrupar.
- Bloquear y desbloquear.
- Ocultar y mostrar.
- Alinear objetos.
- Distribuir uniformemente.
- Usar guías magnéticas.
- Trabajar con cuadrícula.
- Mostrar cotas.
- Medir distancias.
- Cambiar zoom.
- Desplazar el lienzo.
- Ajustar vista al escenario.
- Restaurar vista.
- Ver propiedades.
- Editar posiciones numéricas.
- Deshacer y rehacer.

El editor debe utilizar la geometría real del modelo del proyecto.

No debe guardar el dibujo como una imagen plana.

## Precisión

Permitir desplazamientos mediante valores exactos, incluso cuando no coincidan con la cuadrícula.

El ajuste magnético debe poder desactivarse.

Los valores numéricos deben prevalecer sobre el snap.

Los elementos deben conservar posición y rotación al cambiar de vista.

---

# 12. MOTOR 3D INTERACTIVO

La visualización tridimensional es una función central, no un complemento secundario.

Debe desarrollarse desde las primeras etapas, utilizando el mismo modelo de datos que el editor 2D.

## Funciones

- Rotación de cámara en 360 grados.
- Zoom.
- Panorámica.
- Órbita.
- Desplazamiento de cámara.
- Selección de objetos.
- Manipulación mediante controles visuales.
- Edición de propiedades.
- Vista de escenario completo.
- Encuadre automático sobre el objeto seleccionado.
- Cámara frontal.
- Cámara posterior.
- Cámara lateral izquierda.
- Cámara lateral derecha.
- Cámara superior.
- Cámara isométrica.
- Cámara libre.
- Cámaras personalizadas.
- Captura de imágenes.

Más adelante, preparar la posibilidad de un recorrido virtual en primera persona.

## Navegación frente a edición

Distinguir claramente el modo de navegación de la cámara y el modo de transformación de objetos.

Evitar movimientos accidentales.

Implementar controles de transformación visibles:

- Movimiento X.
- Movimiento Y.
- Movimiento Z.
- Rotación.
- Escalado solamente cuando el tipo de objeto lo permita.

## Sincronización

Si un objeto cambia en 2D, debe cambiar inmediatamente en 3D.

Si se edita desde 3D, debe actualizarse el 2D.

La selección debe mantenerse sincronizada entre ambas vistas.

En vista dividida, seleccionar un objeto en cualquiera de los paneles debe resaltarlo en ambos.

---

# 13. HIPERREALISMO Y CALIDAD VISUAL

Este requisito es prioritario.

El objetivo es obtener representaciones tridimensionales convincentes, nítidas y visualmente profesionales.

Se pretende que el usuario pueda comprender el montaje incluso sin saber interpretar un stage plot convencional.

## Requisitos visuales

- Modelos reconocibles.
- Proporciones físicamente correctas.
- Materiales PBR.
- Texturas de buena resolución.
- Rejillas acústicas.
- Superficies metálicas.
- Plásticos y pinturas.
- Madera y revestimientos.
- Pantallas con contenido visible.
- Instrumentos detallados.
- Personas con apariencia natural.
- Iluminación ambiental.
- Iluminación escénica.
- Sombras.
- Reflejos razonables.
- Antialiasing.
- Buen tratamiento de color.
- Cámaras con perspectivas adecuadas.
- Bordes nítidos.
- Exportaciones de alta resolución.

## Dos modos gráficos

### Modo edición

Prioriza precisión, respuesta rápida y fluidez.

Permite utilizar modelos optimizados, sombras reducidas y menores efectos gráficos.

### Modo presentación

Activa la máxima calidad disponible.

Debe permitir obtener imágenes de aspecto profesional con materiales, luces, sombras y modelos detallados.

## Calidad adaptable

Crear perfiles de calidad gráfica:

- Bajo.
- Medio.
- Alto.

El programa debe adaptarse a la capacidad del equipo.

Priorizar una experiencia funcional aunque el hardware no permita todos los efectos.

## Rendimiento

Utilizar:

- Carga diferida de recursos.
- Reutilización de geometrías.
- Instanciación de modelos repetidos.
- Niveles de detalle.
- Liberación de recursos no utilizados.
- Optimización de materiales.
- Control de memoria de video.
- Gestión cuidadosa del render loop.

No prometer hiperrealismo automático para modelos que solamente tengan geometría básica.

Cuando falte un modelo detallado, ofrecer un objeto genérico de buena calidad y dimensiones correctas.

---

# 14. BIBLIOTECA PROFESIONAL DE EQUIPAMIENTO

Crear un catálogo extensible, editable y persistente.

Distinguir cuatro tipos funcionales:

1. Modelos genéricos.
2. Equipos de fabricante y modelo específico.
3. Objetos paramétricos.
4. Conjuntos inteligentes reutilizables.

## Categorías obligatorias

### Personas y músicos

- Cantante.
- Corista.
- Baterista.
- Bajista.
- Guitarrista.
- Tecladista.
- Percusionista.
- Director musical.
- Instrumentistas de viento.
- Instrumentistas de cuerdas.
- Orador.
- Predicador.
- Técnico.
- Operador.

### Micrófonos

- Dinámicos.
- Condensador.
- Vocales.
- Instrumentales.
- Overhead.
- Shotgun.
- Solapa.
- Vincha.
- Inalámbricos.
- Talkback.
- Micrófonos de bombo.
- Micrófonos de redoblante.
- Micrófonos para toms.

### Soportes

- Rectos.
- Jirafa.
- Jirafa corta.
- De mesa.
- Bajos.
- Extensibles.
- Clips.
- Soportes especiales.

### Instrumentos

- Baterías acústicas.
- Baterías electrónicas.
- Percusión.
- Platillos.
- Guitarras acústicas.
- Guitarras eléctricas.
- Bajos.
- Pianos.
- Teclados.
- Sintetizadores.
- Instrumentos de cuerda.
- Instrumentos de viento.
- Instrumentos de percusión adicionales.
- Pedaleras.
- Soportes de instrumentos.

### Amplificación

- Amplificadores de guitarra.
- Amplificadores de bajo.
- Cabezales.
- Gabinetes.
- Racks.

### Monitoreo

- Cuñas activas.
- Cuñas pasivas.
- Sidefills.
- IEM cableados.
- IEM inalámbricos.
- Transmisores.
- Receptores.
- Bodypacks.
- Amplificadores de auriculares.
- Monitores de estudio.
- Controladores personales.

### PA

- Cajas full range.
- Line arrays.
- Line arrays compactos.
- Line arrays de gran formato.
- Subwoofers.
- Front fills.
- Out fills.
- Amplificadores.
- Procesadores.
- Sistemas de distribución.
- Flybars y elementos de montaje.

### Audio técnico

- Consolas digitales.
- Consolas analógicas.
- Stageboxes.
- DI activas.
- DI pasivas.
- Splitters.
- Snakes.
- Interfaces.
- Grabadores.
- Reproductores.
- Computadoras de pistas.
- Racks.
- Equipos de procesamiento.

### Video

- Pantallas LED.
- Gabinetes LED.
- Televisores.
- Monitores.
- Proyectores.
- Pantallas de proyección.
- Cámaras.
- Soportes.
- Monitores de confianza.
- Procesadores de video.
- Computadoras de presentación.

### Iluminación

- PAR LED.
- Fresnel.
- Moving heads.
- Barras LED.
- Estrobos.
- Seguidores.
- Luces de escenario.
- Consolas DMX.
- Distribuidores.
- Trusses.
- Soportes.
- Accesorios.

### Escenario y estructuras

- Tarimas.
- Risers.
- Escaleras.
- Rampas.
- Atriles.
- Púlpitos.
- Mesas.
- Sillas.
- Bancos.
- Telones.
- Cortinas.
- Biombos.
- Vallas.
- Estructuras metálicas.
- Columnas.
- Bastidores.

### Electricidad y red

- Tomas.
- Extensiones.
- Cajas de distribución.
- Tableros.
- Racks eléctricos.
- Puntos de red.
- Switches.
- Routers.
- Cableado.
- Puntos de alimentación.

### Accesorios

- Soportes de partituras.
- Computadoras.
- Tablets.
- Cajas de transporte.
- Accesorios de montaje.
- Elementos técnicos adicionales.

El catálogo debe crecer sin requerir modificaciones en el código de la aplicación cada vez que se agregue un equipo.

---

# 15. FICHA MAESTRA DE CADA EQUIPO

Cada elemento del catálogo debe tener una ficha.

Campos generales:

- Identificador interno.
- Nombre.
- Categoría.
- Subcategoría.
- Marca.
- Modelo.
- Descripción.
- Etiquetas.
- Dimensiones.
- Peso, cuando corresponda.
- Materiales.
- Punto de referencia.
- Puntos de apoyo.
- Restricciones de transformación.
- Representación 2D.
- Modelo 3D.
- Texturas.
- Miniatura.
- Puertos y conexiones.
- Alimentación.
- Montaje.
- Documentación.
- Fuente de los datos.
- Estado de verificación.
- Versión del modelo.
- Licencia de recursos externos.

No exigir propiedades de audio a elementos que no las necesiten.

Usar esquemas de propiedades específicos según categoría.

## Calidad de datos

Distinguir:

- Datos verificados por fabricante.
- Datos introducidos por el usuario.
- Datos estimados.
- Datos faltantes.

No presentar valores estimados como especificaciones verificadas.

---

# 16. CREACIÓN DE OBJETOS PERSONALIZADOS

El usuario debe poder incorporar equipos nuevos.

Crear un asistente que permita:

1. Elegir categoría.
2. Escribir nombre.
3. Definir marca y modelo.
4. Introducir dimensiones.
5. Configurar propiedades técnicas.
6. Definir conexiones.
7. Seleccionar símbolo 2D.
8. Elegir representación 3D genérica o importar un modelo.
9. Definir punto de apoyo y orientación.
10. Previsualizar.
11. Validar.
12. Guardar en biblioteca personal.

Permitir duplicar un modelo existente y crear variantes.

El equipo debe quedar disponible en proyectos futuros.

Una imagen PNG o SVG no equivale a un modelo tridimensional.

Si el usuario importa una imagen, debe utilizarse para símbolo o referencia visual, no como sustituto automático de un modelo 3D físico.

---

# 17. IMPORTACIÓN DE MODELOS 3D

Utilizar GLB/glTF como formato principal.

Permitir importar modelos tridimensionales personalizados.

El asistente deberá:

- Validar el archivo.
- Verificar estructura.
- Comprobar geometría.
- Verificar texturas.
- Revisar orientación.
- Comprobar unidades.
- Mostrar dimensiones geométricas.
- Solicitar dimensiones físicas confirmadas.
- Permitir corregir escala de importación.
- Definir punto de apoyo.
- Definir eje frontal.
- Generar miniatura.
- Guardar recursos.
- Crear geometría de respaldo.
- Registrar fuente y licencia.

Debe soportar un nivel básico, detallado y de alta fidelidad.

Gestionar errores sin bloquear ni corromper el proyecto.

No ejecutar código incorporado en archivos externos.

Controlar tamaños máximos y archivos maliciosos o excesivamente grandes.

Los modelos deben cumplir las licencias de distribución correspondientes.

---

# 18. OBJETOS PARAMÉTRICOS

Los objetos paramétricos tienen dimensiones o configuración generadas a partir de parámetros específicos.

Deben ser entidades propias del catálogo.

Como mínimo implementar o prever:

- Pantallas LED.
- Line arrays.
- Tarimas.
- Trusses.
- Escaleras.
- Rampas.
- Telones.
- Mesas modulares.
- Gradas.
- Barreras.
- Estructuras repetitivas.

Las modificaciones paramétricas deben actualizar:

- Geometría.
- Medidas.
- Volumen.
- Posición cuando corresponda.
- Relaciones físicas.
- Inventario.
- Representación 2D.
- Representación 3D.
- Documentos generados.

---

# 19. CONFIGURADOR DE PANTALLAS LED

Este módulo es obligatorio y debe tener un tratamiento especial.

Las pantallas ocupan espacio físico y deben ser medibles.

Al agregar una pantalla, ofrecer dos modalidades.

## Modalidad A: pantalla de dimensiones libres

Permitir introducir:

- Ancho.
- Alto.
- Profundidad.
- Elevación inferior.
- Posición.
- Rotación.
- Tipo de montaje.
- Material o acabado.

Se utilizará para pantallas genéricas, televisores y superficies de proyección.

## Modalidad B: pantalla LED modular

Permitir configurar:

- Marca.
- Modelo de gabinete.
- Ancho de gabinete.
- Alto de gabinete.
- Profundidad de gabinete.
- Columnas.
- Filas.
- Cantidad total de gabinetes.
- Ancho total.
- Alto total.
- Superficie.
- Pixel pitch, cuando exista información.
- Resolución total, cuando sea calculable.
- Peso, si se dispone de datos.
- Consumo estimado, si se dispone de especificaciones.
- Elevación inferior.
- Orientación.
- Sistema de montaje.

La geometría deberá generarse automáticamente en función de la cantidad de módulos.

No permitir combinaciones imposibles de gabinetes sin advertencia.

Si las medidas libres no coinciden exactamente con el gabinete seleccionado, ofrecer ajustar las medidas o cambiar el módulo.

## Montajes

- Apoyada sobre estructura de piso.
- Suspendida.
- Fijada a pared.
- Sobre estructura personalizada.

La pantalla debe tener profundidad y soportes, no solamente una superficie 2D.

## Representación 3D

Permitir mostrar:

- Pantalla apagada.
- Color sólido.
- Imagen cargada.
- Fotograma o textura estática.
- Contenido de demostración permitido.

El contenido debe ayudar a visualizar el montaje.

Debe calcularse correctamente la ocupación en el escenario y la altura de instalación.

No certificar estructuras de suspensión ni cargas eléctricas sin datos verificados.

---

# 20. CONFIGURADOR DE SISTEMAS LINE ARRAY

Este módulo también es prioritario.

Un line array no debe ser un único objeto alargado.

Debe estar formado por gabinetes individuales relacionados dentro de un conjunto.

## Configuración

Permitir elegir:

- Marca.
- Modelo.
- Tipo compacto o gran formato.
- Dimensiones reales de cada caja.
- Cantidad de cajas del lado izquierdo.
- Cantidad de cajas del lado derecho.
- Vinculación simétrica opcional.
- Configuración independiente por lado.
- Altura de instalación.
- Posición.
- Orientación.
- Ángulo general del arreglo.
- Ángulos entre gabinetes.
- Sistema de montaje.
- Flybar compatible cuando exista.
- Subgraves complementarios.
- Front fills.
- Out fills.

## Visualización

En vista frontal deben verse claramente las cajas individuales.

Si se configuran seis cajas por lado, deben verse seis gabinetes a izquierda y seis a derecha.

Al modificar la cantidad, la geometría debe actualizarse automáticamente.

Las vistas lateral y 3D deben reflejar los ángulos y la curvatura real configurada.

Debe permitir arreglos simétricos y asimétricos.

## Inventario

Calcular:

- Cantidad de gabinetes por lado.
- Cantidad total.
- Modelos utilizados.
- Accesorios configurados.
- Peso agregado, solamente si existen datos confiables.

## Seguridad

No inferir seguridad de rigging a partir de la apariencia.

No declarar compatible un accesorio por coincidencia geométrica.

No simular cobertura acústica certificada sin implementar los algoritmos y datos necesarios.

Este módulo es inicialmente de planificación visual y documentación.

---

# 21. SISTEMA DE AGRUPACIÓN Y RELACIONES FÍSICAS

Los objetos podrán agruparse.

Implementar:

- Grupos simples.
- Grupos jerárquicos.
- Conjuntos inteligentes.
- Puntos de anclaje.
- Relaciones entre soporte y objeto.
- Transformaciones relativas.

Ejemplos:

- Micrófono con pie.
- Batería con tarima.
- Teclado con soporte.
- Line array con flybar.
- Pantalla con estructura.
- Puesto musical completo.

Si una batería está sobre una tarima y la tarima se eleva, la batería debe mantener su posición relativa.

Si se mueve un conjunto, todos sus elementos deben acompañarlo.

Los canales y conexiones deben conservarse.

Permitir editar individualmente elementos dentro del conjunto.

Diferenciar agrupación física de asociación técnica.

Dos monitores pueden compartir una mezcla sin formar un grupo físico.

---

# 22. PLANTILLAS REUTILIZABLES

Permitir crear plantillas de:

- Puestos de batería.
- Puestos de teclados.
- Guitarras.
- Bajo.
- Voces.
- Coros.
- Oradores.
- Sistemas PA.
- Pantallas.
- Conjuntos de iluminación.
- Escenarios completos.
- Bandas.
- Conferencias.
- Montajes de iglesias.

Ejemplo de plantilla: banda de adoración con batería, bajo, guitarra eléctrica, dos teclados, voz principal, tres coristas y monitoreo.

La plantilla debe conservar:

- Objetos.
- Dimensiones.
- Posiciones relativas.
- Relación entre soportes.
- Fuentes de audio.
- Requerimientos de canales.
- Conexiones propuestas.

Al insertarla, generar identificadores nuevos.

Si la plantilla propone números de canales ocupados, solicitar resolución de conflictos.

Ofrecer:

- Conservar canales libres.
- Renumerar.
- Seleccionar asignaciones manualmente.

Nunca duplicar silenciosamente identificadores internos.

---

# 23. CAPAS Y FILTROS VISUALES

Crear un sistema de capas.

Capas iniciales:

- Estructura.
- Músicos.
- Instrumentos.
- Audio.
- Video.
- Iluminación.
- Electricidad.
- Conexiones.
- Identificación.

Cada capa permitirá:

- Mostrar.
- Ocultar.
- Bloquear.
- Seleccionar.
- Filtrar.

Crear presets de visualización:

- Vista completa.
- Solo estructura.
- Solo audio.
- Solo músicos.
- Solo iluminación.
- Solo conexiones.
- Presentación limpia.

Ocultar un elemento no significa eliminarlo del proyecto.

Las listas técnicas deben seguir conservando sus datos.

La participación de un elemento en la configuración debe administrarse mediante una propiedad independiente de su visibilidad.

---

# 24. DETECCIÓN DE COLISIONES E INTERFERENCIAS

Incorporar validación geométrica.

Detectar:

- Equipos fuera del escenario.
- Superposiciones físicas.
- Invasión de áreas restringidas.
- Objetos apoyados sin una superficie válida.
- Posibles interferencias entre estructuras.
- Equipos que excedan la altura disponible.

La detección debe utilizar geometría física, no símbolos ampliados.

No considerar automáticamente todas las intersecciones como errores.

Ejemplos de superposiciones permitidas:

- Micrófono próximo a batería.
- Músico junto a instrumento.
- Luminaria vinculada a truss.
- Equipo apoyado en tarima.

Permitir marcar advertencias como revisadas o intencionales, conservando trazabilidad.

Distinguir:

- Información.
- Advertencia.
- Error.

Las advertencias deberán localizar y seleccionar el objeto involucrado.

No presentar estas comprobaciones como una certificación estructural o de seguridad.

---

# 25. SISTEMA DE ENTRADAS Y SALIDAS DE AUDIO

Este módulo debe implementar la lógica técnica real del stage plot.

## Diseño visual obligatorio

### Entradas

Círculo con:

- Fondo blanco o muy claro.
- Borde negro.
- Número negro en negrita.

### Salidas

Círculo con:

- Fondo negro u oscuro.
- Número blanco en negrita.

Deben ser claramente distinguibles incluso en impresión monocromática.

## Comportamiento

Los marcadores deben poder:

- Arrastrarse al escenario.
- Asignarse a un objeto.
- Moverse sin desplazar el objeto.
- Mantener un desplazamiento relativo respecto del objeto.
- Editar número.
- Editar nombre.
- Mostrar abreviatura.
- Cambiar tamaño visual.
- Ocultarse por capa.
- Renumerarse.
- Duplicarse correctamente cuando sea válido.
- Seleccionarse desde las listas técnicas.

Los números visibles no deben ser identificadores internos.

Un marcador debe vincularse mediante ID a la entidad técnica correspondiente.

## Entrada lógica frente a física

Distinguir claramente:

- Fuente sonora.
- Dispositivo captador.
- Puerto físico de stagebox.
- Puerto físico de consola.
- Canal lógico de consola.
- Bus.
- Salida física.
- Destino.

Un mismo canal de consola puede utilizar una entrada física cuyo número sea diferente.

La etiqueta de entrada mostrará normalmente el canal lógico.

La etiqueta de salida mostrará el identificador elegido del destino o plan de salidas.

La ficha técnica conservará siempre la relación entre bus, salida física y destino.

---

# 26. INPUT LIST

Crear una tabla de entradas vinculada al proyecto.

Campos iniciales:

- Canal.
- Nombre de fuente.
- Descripción.
- Micrófono o DI.
- Tipo de soporte.
- Phantom.
- Stagebox.
- Puerto físico.
- Consola.
- Canal lógico.
- Posición escénica.
- Observaciones.

Permitir columnas adicionales personalizables.

Todas las tablas deben utilizar los mismos datos del escenario.

Cambiar un canal desde la tabla debe actualizar el marcador.

Cambiar una fuente desde el escenario debe actualizar la tabla.

## Fuentes multicanal

Permitir:

- Baterías con múltiples micrófonos.
- Teclados estéreo.
- Pistas estéreo.
- Instrumentos con DI doble.
- Fuentes multicanal.
- Pares asociados.
- Canales de reserva.

Una fuente agrupada puede contener varias señales individuales.

No confundir instrumento con canal.

## Phantom

Registrar si una conexión requiere alimentación phantom.

No enviar instrucciones automáticas a una consola real.

Permitir estados como:

- Requiere.
- No requiere.
- Según dispositivo.
- Sin confirmar.

---

# 27. OUTPUT LIST Y MONITOREO

Separar conceptualmente:

- Mezcla.
- Bus.
- Salida lógica.
- Puerto físico.
- Destino.

Una mezcla mono puede utilizar una salida.

Una mezcla estéreo puede requerir dos salidas físicas.

Dos monitores pueden compartir una misma mezcla.

## Destinos

- Cuñas.
- Sidefills.
- IEM.
- PA principal.
- Front fills.
- Subgraves.
- Grabadores.
- Otros sistemas.

## Propiedades

- Nombre de mezcla.
- Número.
- Mono/estéreo.
- Bus de consola.
- Puertos de salida.
- Destinatario.
- Tipo de monitor.
- Sistema cableado o inalámbrico.
- Equipos compartidos.
- Observaciones.

## Validación

Calcular recursos utilizados y disponibles.

Advertir si se excede el número de salidas o buses de la consola.

No reducir automáticamente mezclas estéreo a mono.

No crear buses adicionales si dos cuñas comparten una mezcla.

---

# 28. PERFILES DE CONSOLAS

Crear una biblioteca de consolas.

Cada perfil deberá representar correctamente:

- Fabricante.
- Modelo.
- Entradas analógicas.
- Entradas digitales.
- Canales de procesamiento.
- Salidas físicas.
- Buses.
- Mezclas auxiliares.
- Grupos.
- Matrices, cuando corresponda.
- Main L/R.
- Expansiones.
- Stageboxes compatibles.
- Capacidades de patch.
- Restricciones técnicas.

Distinguir conectores físicos, canales de procesamiento y buses.

Incorporar como perfiles de referencia, con especificaciones verificadas del fabricante:

- Mackie DL32S.
- Behringer XR18.

Permitir crear perfiles personalizados.

No hardcodear que todas las consolas funcionan igual.

## Múltiples configuraciones por proyecto

Un mismo escenario debe admitir distintos perfiles de audio.

Ejemplo:

- Configuración A: Mackie DL32S.
- Configuración B: Behringer XR18.

Cambiar el perfil activo no debe modificar la distribución física del escenario.

Las fuentes deben conservarse.

El patch de cada perfil debe almacenarse independientemente.

Si la nueva consola tiene recursos insuficientes, mostrar advertencias y asignaciones pendientes.

No eliminar fuentes automáticamente.

## Exportación a consolas

Prever una arquitectura de adaptadores para formatos específicos de fabricantes.

No prometer compatibilidad universal.

La aplicación debe documentar consolas desde el inicio.

Exportar archivos propietarios y controlar consolas en vivo serán ampliaciones condicionadas a soporte técnico real.

---

# 29. STAGEBOXES Y PATCH FÍSICO

Permitir incorporar stageboxes:

- Analógicas.
- Digitales.
- Personalizadas.

Cada stagebox tendrá:

- Identificador.
- Nombre.
- Tipo.
- Cantidad de entradas.
- Cantidad de salidas.
- Puertos.
- Conectores.
- Conexiones disponibles.
- Conexiones ocupadas.
- Ubicación.
- Compatibilidad cuando corresponda.

El usuario debe poder asignar una fuente a un puerto físico.

Detectar duplicaciones incompatibles.

Mostrar estado de ocupación.

Permitir varias stageboxes.

Permitir patch directo a consola.

Contemplar splitters, rutas analógicas y digitales y distribución a varias consolas.

Si se elimina una stagebox, las fuentes vinculadas deben conservarse y las rutas afectadas pasar a estado pendiente de resolución.

---

# 30. FLUJO DE SEÑALES

Crear un módulo de Signal Flow.

Tres niveles:

## Vista simple

Representar el origen y el destino.

## Vista de patch

Representar:

- Fuentes.
- Stageboxes.
- Consolas.
- Canales.
- Buses.
- Salidas.
- Destinos.

## Vista de cableado

Representar:

- Tipo de cable.
- Origen.
- Destino.
- Conectores.
- Recorrido.
- Referencias de instalación.

Las conexiones deben formar un grafo técnico validable.

El flujo de señal debe poder representarse sin modificar la geometría del escenario.

## Cableado

Permitir registrar conexiones como:

- XLR.
- TRS.
- speakON.
- Ethernet.
- HDMI.
- SDI.
- Alimentación.
- Conectores personalizados.

No asumir compatibilidad por similitud de nombre.

Las longitudes de cable deben distinguir:

- Distancia geométrica.
- Recorrido planificado.
- Longitud recomendada.
- Longitud confirmada.

No afirmar longitudes exactas si solo existe una distancia en línea recta.

---

# 31. MONITOREO POR MÚSICO

Cada músico o puesto debe permitir configurar su monitoreo.

Propiedades:

- Destino.
- Cuña/IEM/sidefill.
- Mono o estéreo.
- Mezcla asignada.
- Bus.
- Salida física.
- Sistema cableado o inalámbrico.
- Equipos compartidos.
- Observaciones.

Permitir una matriz de monitoreo.

Filas: fuentes.

Columnas: mezclas.

Inicialmente documentar qué señales pertenecen a cada mezcla.

No inventar niveles de audio.

## Sistemas inalámbricos

Mantener la información RF separada del patch de audio.

Permitir registrar:

- Transmisor.
- Receptor.
- Banda.
- Canal RF.
- Frecuencia, si se conoce.
- Antenas.
- Estado de coordinación.
- Observaciones.

No presentar esta herramienta como reemplazo inicial de un coordinador RF especializado.

---

# 32. PATCH AUTOMÁTICO ASISTIDO

Crear un asistente de asignación de canales.

Debe permitir definir un orden preferido, por ejemplo:

1. Batería.
2. Percusión.
3. Bajo.
4. Guitarras.
5. Teclados.
6. Pistas.
7. Voces.
8. Canales adicionales.
9. Reservas.

El orden será configurable.

El asistente debe respetar:

- Canales bloqueados.
- Asignaciones existentes.
- Pares estéreo.
- Capacidades de consola.
- Puertos físicos ocupados.

Antes de renumerar, mostrar una vista previa.

No renumerar silenciosamente.

Permitir revertir.

---

# 33. INVENTARIO Y EQUIPAMIENTO DISPONIBLE

Distinguir tres niveles:

## Catálogo

Equipos que la aplicación puede representar.

## Inventario personal

Equipos realmente disponibles.

Permitir cantidades, ubicación y estado.

## Equipamiento utilizado en un proyecto

Instancias del catálogo incorporadas al escenario.

El inventario será opcional para poder trabajar sin administrar existencias.

Permitir identificar:

- Propio.
- Alquilado.
- Provisto por producción.
- Pendiente.
- Requerido.

Calcular cantidades utilizadas.

Advertir faltantes cuando exista inventario registrado.

No impedir el diseño si faltan unidades.

---

# 34. VERSIONADO DEL CATÁLOGO

Cada modelo del catálogo tendrá una versión.

Si se actualiza una definición, no modificar silenciosamente proyectos anteriores.

El usuario debe poder decidir si aplica una actualización.

El proyecto conservará la definición necesaria para reconstruir los elementos históricos.

Eliminar un modelo del catálogo no debe destruir proyectos que lo utilizan.

Preferir archivado sobre eliminación irreversible.

---

# 35. GUARDADO Y PERSISTENCIA

Implementar almacenamiento local persistente mediante IndexedDB.

Incluir:

- Guardado automático.
- Guardado explícito.
- Estado visual de guardado.
- Recuperación de sesión.
- Historial de deshacer y rehacer.
- Revisiones.
- Importación.
- Exportación.
- Respaldo.

Las operaciones de guardado deben ser coherentes y protegidas frente a estados parciales.

## Limitaciones del navegador

No considerar IndexedDB como garantía absoluta de respaldo.

Permitir exportar archivos nativos y realizar copias externas.

Solicitar almacenamiento persistente cuando corresponda, explicando sus limitaciones.

## Formato nativo

Utilizar provisionalmente `.stagepro`.

El archivo puede estar estructurado como un contenedor ZIP que incluya:

- Manifest.
- Versión de esquema.
- Datos del proyecto.
- Configuraciones.
- Revisión.
- Definiciones de modelos utilizadas.
- Recursos permitidos.
- Texturas.
- Símbolos.
- Metadatos.

Validar los paquetes antes de importarlos.

Evitar sobrescrituras silenciosas.

Implementar migraciones entre versiones del esquema.

Los recursos con restricciones de redistribución deberán gestionarse correctamente y disponer de alternativas de representación.

---

# 36. GENERADOR PROFESIONAL DE RIDERS

El rider debe generarse automáticamente desde el proyecto.

No crear una segunda base de datos independiente para los documentos.

Los datos técnicos deben provenir del modelo maestro.

## Tipos de documento

### A. Stage plot compacto

Una página con:

- Escenario.
- Distribución.
- Músicos.
- Instrumentos.
- Entradas.
- Salidas.
- Monitoreo.
- Dimensiones.
- Leyenda.
- Contacto.

### B. Plano técnico

- Vista superior.
- Cotas.
- Posiciones.
- Dimensiones.
- Alturas.
- Pantallas.
- PA.
- Estructuras.
- Escala.

### C. Rider técnico completo

Dossier con secciones técnicas detalladas.

### D. Presentación visual 3D

Documento con imágenes de alta calidad del montaje.

### E. Documentación por departamento

Documentos específicos para:

- FOH.
- Monitores.
- Escenario.
- Video.
- Iluminación.
- Producción.

---

# 37. ESTRUCTURA DEL RIDER COMPLETO

El generador debe poder incluir:

1. Portada.
2. Resumen técnico.
3. Dimensiones del escenario.
4. Stage plot 2D.
5. Vista frontal.
6. Vista isométrica 3D.
7. Otras vistas seleccionadas.
8. Input list.
9. Output list.
10. Patch físico.
11. Distribución de monitoreo.
12. Backline.
13. Inventario de micrófonos.
14. Inventario de soportes.
15. PA.
16. Pantallas y video.
17. Iluminación.
18. Electricidad.
19. Conexiones.
20. Requerimientos.
21. Observaciones.
22. Estado de validación.
23. Datos de contacto.
24. Número de revisión.

Las páginas no serán obligatorias.

El usuario elegirá las secciones.

Si una sección no tiene contenido y no fue solicitada explícitamente, no generar páginas vacías.

---

# 38. CONFIGURADOR DE DOCUMENTOS

Crear una pantalla de publicación donde se pueda:

- Elegir tipo de documento.
- Seleccionar tamaño de papel.
- Elegir orientación.
- Elegir plantilla visual.
- Seleccionar secciones.
- Incluir u ocultar vistas 3D.
- Seleccionar cámaras.
- Incluir u ocultar inventario.
- Incluir u ocultar patch.
- Añadir logo.
- Elegir colores.
- Añadir contacto.
- Añadir observaciones.
- Definir revisión.
- Previsualizar páginas.
- Reordenar secciones.
- Exportar.

## Papel

Soportar:

- A4 vertical.
- A4 horizontal.
- A3 vertical.
- A3 horizontal.

Preparar tamaños personalizados cuando sea viable.

## Plantillas visuales

Implementar tres estilos:

### Technical Clean

Diseño blanco, técnico, minimalista y preparado para impresión.

### Production Pro

Diseño editorial profesional con planos, tablas y perspectivas.

### Visual Presentation

Diseño visual con imágenes 3D grandes y jerarquía de presentación.

Permitir personalización sin alterar los datos técnicos.

---

# 39. PLANOS A ESCALA Y EXPORTACIÓN VECTORIAL

Distinguir:

## Ajustar a página

El plano se adapta al espacio disponible manteniendo proporciones.

No declarar una escala técnica fija si no corresponde.

## Escala técnica

Permitir escalas como:

- 1:25.
- 1:50.
- 1:100.
- Personalizada.

Si el plano no entra en el papel, ofrecer alternativas.

Los planos deben incluir:

- Cotas.
- Unidades.
- Orientación.
- Escala declarada.
- Barra gráfica.
- Referencias.

No alterar dimensiones físicas durante la impresión.

Los símbolos sobredimensionados por legibilidad no deben utilizarse como geometría de medición.

---

# 40. CALIDAD DEL PDF

El PDF debe ser profesional y nítido.

Utilizar elementos vectoriales siempre que sea posible para:

- Líneas.
- Cotas.
- Etiquetas.
- Números.
- Símbolos.
- Tablas.
- Texto.

Las imágenes 3D podrán ser rasterizadas en alta resolución.

El sistema debe evitar:

- Textos cortados.
- Elementos superpuestos.
- Tablas truncadas.
- Páginas vacías.
- Imágenes faltantes.
- Planos deformados.
- Escalas incorrectas.
- Etiquetas ilegibles.

Las tablas extensas deberán distribuirse correctamente en varias páginas.

Repetir encabezados cuando corresponda.

Conservar agrupaciones de datos relacionadas siempre que sea posible.

El texto debe ser seleccionable cuando técnicamente corresponda.

Mantener legibilidad en blanco y negro.

---

# 41. EXPORTACIÓN DE IMÁGENES 3D

Permitir guardar cámaras de documentación.

Cámaras predefinidas:

- Frontal.
- Posterior.
- Superior.
- Lateral izquierda.
- Lateral derecha.
- Isométrica izquierda.
- Isométrica derecha.
- Vista desde el público.
- Cámaras personalizadas.

Ofrecer exportación PNG.

Resoluciones objetivo:

- 1080p.
- 4K cuando el equipo lo permita.
- Resolución personalizada.

Para impresión, calcular la resolución necesaria según dimensiones físicas y densidad objetivo.

No agrandar una captura de pantalla para simular mayor definición.

El motor debe renderizar a la resolución solicitada siempre que el hardware lo permita.

Permitir fondos neutros y opciones de iluminación.

Guardar los encuadres para reutilizarlos después de modificar el escenario.

---

# 42. FORMATOS DE EXPORTACIÓN

Implementar según etapas:

- PDF.
- PNG.
- SVG.
- CSV.
- XLSX.
- JSON del proyecto.
- Archivo nativo `.stagepro`.
- Paquete de respaldo con recursos.

El SVG debe conservar información vectorial.

Las listas CSV y XLSX deben mantener columnas, encabezados y valores técnicos coherentes.

El archivo nativo debe permitir recuperar la edición completa, no solamente visualizar un documento.

---

# 43. REVISIONES Y ESTADOS DOCUMENTALES

Implementar revisiones.

Cada revisión debe tener:

- Identificador.
- Número.
- Fecha.
- Descripción.
- Estado.
- Referencia al perfil de audio.
- Instantánea de los datos.
- Documentos asociados.

Estados:

- Borrador.
- Para revisión.
- Aprobado.

El estado aprobado debe requerir acción explícita del usuario.

No aprobar automáticamente por ausencia de errores.

## Instantáneas

Al exportar un documento, capturar una instantánea coherente.

El stage plot, las tablas y las imágenes deben corresponder a la misma revisión.

Si se modifica posteriormente el proyecto, el PDF exportado no debe cambiar.

Permitir volver a generar documentos desde revisiones anteriores.

## Comparaciones

Preparar una función para comparar revisiones:

- Cambios de posición.
- Equipos agregados o eliminados.
- Diferencias de cantidades.
- Cambios de canales.
- Cambios de patch.
- Cambios de dimensiones.
- Modificaciones de pantallas y PA.

---

# 44. VALIDADOR TÉCNICO GLOBAL

Implementar un panel de validaciones antes de exportar.

Debe detectar:

- Canales duplicados incompatibles.
- Fuentes sin canal.
- Patch físico incompleto.
- Puertos ocupados incorrectamente.
- Buses insuficientes.
- Salidas insuficientes.
- Mezclas estéreo incompletas.
- Objetos fuera de límites.
- Colisiones geométricas relevantes.
- Modelos sin dimensiones.
- Dimensiones estimadas.
- Equipos sin alimentación documentada.
- Conexiones incompatibles.
- Elementos sin representación 3D.
- Recursos faltantes.
- Datos de suspensión pendientes.
- Información técnica no confirmada.

Clasificar:

- Error.
- Advertencia.
- Información.

Permitir seleccionar una advertencia y localizar automáticamente el objeto involucrado.

No impedir guardar un proyecto incompleto.

Permitir exportaciones en estado borrador con advertencias explícitas.

No certificar seguridad acústica, eléctrica o estructural sin las verificaciones especializadas pertinentes.

---

# 45. FLUJOS DE TRABAJO REALES

Implementar y probar, como mínimo, estos flujos.

## Flujo A: creación desde cero

1. Crear proyecto.
2. Definir escenario de 8 × 6 metros.
3. Configurar elevación de 80 cm.
4. Abrir editor.
5. Agregar instrumentos.
6. Colocar músicos.
7. Incorporar micrófonos.
8. Agregar pantallas.
9. Configurar PA.
10. Incorporar monitores.
11. Definir canales.
12. Configurar consola.
13. Completar patch.
14. Revisar en 3D.
15. Guardar.
16. Generar PDF.

## Flujo B: pantalla LED

1. Agregar pantalla modular.
2. Seleccionar tipo de gabinete.
3. Definir columnas y filas.
4. Calcular dimensiones.
5. Configurar altura.
6. Colocar en escena.
7. Revisar vista frontal.
8. Cambiar dimensiones.
9. Actualizar geometría e inventario.
10. Generar render.

## Flujo C: line array

1. Seleccionar modelo.
2. Definir seis cajas por lado.
3. Verificar vista frontal.
4. Cambiar a ocho cajas.
5. Confirmar geometría.
6. Revisar vista lateral.
7. Ajustar ángulos.
8. Actualizar inventario.
9. Guardar.
10. Exportar.

## Flujo D: cambio de consola

1. Diseñar escenario.
2. Asignar fuentes.
3. Crear perfil de audio A.
4. Completar patch.
5. Crear perfil B.
6. Seleccionar otra consola.
7. Detectar recursos disponibles.
8. Resolver incompatibilidades.
9. Cambiar entre perfiles.
10. Confirmar que el escenario físico no se modificó.

## Flujo E: conjuntos

1. Crear tarima.
2. Agregar batería.
3. Agregar micrófonos.
4. Asignar canales.
5. Agrupar.
6. Mover la tarima.
7. Comprobar relación física.
8. Editar un micrófono interno.
9. Confirmar canales.
10. Guardar plantilla.

## Flujo F: documentación

1. Abrir proyecto.
2. Seleccionar perfil de audio.
3. Ejecutar validación.
4. Elegir plantilla.
5. Seleccionar secciones.
6. Generar vista previa.
7. Comprobar paginación.
8. Exportar PDF.
9. Guardar revisión.
10. Modificar proyecto.
11. Comparar revisiones.
12. Reexportar una revisión histórica.

---

# 46. PRUEBAS AUTOMÁTICAS OBLIGATORIAS

Implementar pruebas unitarias, de integración y end-to-end.

Como mínimo, verificar lo siguiente.

## Geometría

- Los objetos mantienen sus dimensiones al cambiar el escenario.
- El zoom no modifica valores físicos.
- La conversión entre coordenadas 2D/3D es correcta.
- Las rotaciones mantienen transformaciones coherentes.
- Los objetos agrupados mantienen posiciones relativas.
- Las tarimas trasladan correctamente los objetos anclados.
- Las mediciones utilizan dimensiones reales.

## Escena

- Un objeto movido en 2D se actualiza en 3D.
- Un objeto movido en 3D se actualiza en 2D.
- El cambio de cámara no altera la geometría.
- La selección se sincroniza.
- Los grupos pueden editarse internamente.
- Los objetos bloqueados no se mueven accidentalmente.

## Pantallas

- Las dimensiones se calculan correctamente.
- El número de gabinetes coincide con la geometría.
- Se detectan configuraciones incompatibles.
- El ancho, alto y profundidad afectan correctamente la ocupación física.

## Line arrays

- La cantidad de gabinetes coincide con los parámetros.
- Los lados pueden configurarse independientemente.
- Los cambios de cantidad actualizan el inventario.
- Los ángulos se aplican correctamente.
- La vista frontal refleja la configuración.

## Audio

- Cambiar un número de canal actualiza todas las vistas.
- Los identificadores internos se mantienen.
- Los canales duplicados incompatibles se detectan.
- Dos cuñas pueden compartir un bus.
- Un IEM estéreo requiere los recursos de salida correspondientes.
- Las stageboxes controlan ocupación de puertos.
- Cambiar perfiles de consola no borra fuentes.
- Los perfiles de patch permanecen independientes.
- Los splitters documentan rutas independientes.
- El patch automático respeta asignaciones bloqueadas.

## Persistencia

- Guardar y reabrir mantiene objetos.
- Guardar y reabrir mantiene dimensiones.
- Guardar y reabrir mantiene canales.
- Guardar y reabrir mantiene relaciones físicas.
- La importación de archivos inválidos no rompe la aplicación.
- Las migraciones preservan datos.
- Una actualización de catálogo no altera silenciosamente proyectos históricos.

## Documentación

- El PDF contiene los canales correctos.
- Las medidas del plano coinciden con el proyecto.
- El PDF utiliza el perfil de audio seleccionado.
- Las tablas se paginan correctamente.
- Los renders utilizan la revisión correcta.
- Las revisiones antiguas se pueden recuperar.
- Los símbolos mantienen legibilidad monocromática.
- No aparecen páginas vacías inesperadas.
- Los archivos generados se abren correctamente.

## Rendimiento

Preparar pruebas sobre escenarios de complejidad creciente.

Comprobar:

- Fluidez de navegación.
- Velocidad de selección.
- Respuesta de edición.
- Consumo de memoria.
- Gestión de modelos repetidos.
- Tiempo de carga.
- Estabilidad de exportaciones.

Establecer objetivos medibles según hardware de referencia y documentarlos.

---

# 47. SEGURIDAD, ROBUSTEZ Y ACCESIBILIDAD

La aplicación manejará archivos de proyectos y recursos proporcionados por usuarios.

Implementar:

- Validación de entradas.
- Protección ante datos malformados.
- Validación de paquetes importados.
- Límites razonables de tamaño.
- Protección ante archivos comprimidos abusivos.
- Manejo seguro de rutas y recursos.
- Confirmaciones para operaciones destructivas.
- Recuperación de errores.
- Mensajes comprensibles.
- Registro técnico para depuración.

No ejecutar contenido activo incorporado en modelos externos.

Los controles principales deben ser accesibles mediante teclado cuando sea viable.

Asegurar contraste visual, estados de foco y alternativas numéricas al arrastre.

No exigir movimientos delicados con mouse para completar operaciones que puedan realizarse escribiendo medidas.

---

# 48. FUNCIONAMIENTO SIN CONEXIÓN

La aplicación deberá poder ejecutarse sin internet una vez instalada y con sus recursos esenciales disponibles.

Sin conexión deben funcionar:

- Creación de proyectos.
- Edición 2D.
- Edición 3D.
- Biblioteca local.
- Modelos incluidos.
- Pantallas.
- Line arrays.
- Audio.
- Patch.
- Guardado local.
- Generación de documentos.
- Exportaciones compatibles.
- Recuperación de proyectos.

No requerir una cuenta para las funciones fundamentales.

Los recursos remotos opcionales no deben bloquear el resto del programa.

Mostrar claramente cuándo un recurso externo no está disponible.

---

# 49. EXPERIENCIA VISUAL Y CALIDAD PROFESIONAL

Quiero especial atención a este punto.

El producto final debe ser visualmente atractivo, coherente y distinguible de un editor simple de íconos.

Debe permitir que una persona vea un escenario virtual y entienda:

- Cómo está distribuido.
- Cuánto espacio ocupa cada equipo.
- Dónde están los músicos.
- Cómo está instalada la pantalla.
- Cuántas cajas tiene cada sistema PA.
- Qué altura tienen las estructuras.
- Dónde están los monitores.
- Cómo quedará el montaje visto desde el público.

La vista 3D debe resultar natural e intuitiva.

La calidad gráfica no debe sacrificar la fidelidad dimensional.

Evitar los siguientes errores:

- Instrumentos flotando.
- Equipos atravesando estructuras.
- Pantallas sin profundidad cuando el modelo la requiere.
- Line arrays representados como una sola caja.
- Modelos deformados.
- Texturas borrosas.
- Escalas incoherentes.
- Iluminación exagerada que impida ver el escenario.
- Controles que tapen permanentemente el montaje.
- Cámara incómoda o difícil de manejar.

Cuando sea posible, utilizar una biblioteca inicial de modelos genéricos visualmente cuidados.

No depender de tener modelos comerciales hiperrealistas para que el editor resulte funcional.

---

# 50. PLAN OBLIGATORIO DE IMPLEMENTACIÓN

Desarrollá el producto por hitos.

Todos los hitos deben integrarse sobre la misma arquitectura.

## Hito 1 — Fundación

Implementar:

- Proyecto React/TypeScript.
- Configuración de Vite.
- Estructura modular.
- Modelo de datos.
- Sistema de estado.
- Navegación.
- Pantalla inicial.
- Diseño base de interfaz.
- Configuración de pruebas.
- Persistencia inicial.
- Documentación.

Entrega verificable: aplicación ejecutable con estructura sólida.

## Hito 2 — Núcleo geométrico y primera escena

Implementar:

- Escenario rectangular.
- Dimensiones reales.
- Coordenadas.
- Cuadrícula.
- Zoom.
- Editor 2D.
- Primera escena Three.js.
- Primer objeto compartido.
- Transformaciones.
- Sincronización 2D/3D.
- Controles de cámara.

Entrega verificable: objeto que puede moverse en 2D y 3D manteniendo medidas y posición.

**No postergar el motor 3D hasta el final.**

## Hito 3 — Editor completo

Implementar:

- Selección.
- Movimiento.
- Rotación.
- Duplicación.
- Selección múltiple.
- Agrupaciones.
- Puntos de anclaje.
- Capas.
- Cotas.
- Alineación.
- Bloqueo.
- Historial.
- Guardado.
- Validación geométrica inicial.

Entrega verificable: editor realmente utilizable.

## Hito 4 — Catálogo y equipamiento inteligente

Implementar:

- Biblioteca.
- Categorías.
- Búsqueda.
- Favoritos.
- Equipos genéricos.
- Equipos personalizados.
- Importación GLB.
- Modelos paramétricos.
- Pantallas LED.
- Line arrays.
- Tarimas.
- Conjuntos.
- Plantillas.
- Inventario inicial.

Entrega verificable: escenario completo con equipamiento a escala real.

## Hito 5 — Audio y patch

Implementar:

- Fuentes.
- Entradas.
- Salidas.
- Marcadores.
- Listas.
- Consolas.
- Stageboxes.
- Patch.
- Buses.
- Mezclas.
- Monitoreo.
- Perfiles independientes.
- Validaciones.
- Flujo de señales.

Entrega verificable: escenario con documentación de audio coherente.

## Hito 6 — Documentación

Implementar:

- Generador de stage plots.
- Rider técnico.
- Plantillas.
- PDF.
- SVG.
- PNG.
- CSV.
- XLSX.
- Vista previa.
- Revisiones.
- Estados documentales.
- Exportación de imágenes 3D.

Entrega verificable: rider profesional completo y utilizable.

## Hito 7 — Hiperrealismo y pulido

Implementar y perfeccionar:

- Materiales.
- Texturas.
- Luces.
- Sombras.
- Modelos detallados.
- Cámaras.
- Calidad gráfica.
- Render de presentación.
- Optimización.
- Experiencia de navegación.
- Mejoras de interfaz.

Entrega verificable: visualización tridimensional de alta calidad, coherente con las medidas reales.

## Hito 8 — Validación y distribución

Implementar:

- Pruebas integrales.
- Optimización.
- Manejo de errores.
- Recuperación de proyectos.
- Importación/exportación robusta.
- Funcionamiento offline.
- Documentación.
- Versión instalable.
- Preparación para distribución.

Entrega verificable: aplicación estable apta para uso real.

---

# 51. CRITERIOS DE FINALIZACIÓN DE CADA HITO

Un hito solamente podrá considerarse terminado cuando:

1. El código esté implementado.
2. La aplicación compile.
3. Las pruebas relacionadas funcionen.
4. No existan errores críticos conocidos.
5. La funcionalidad pueda utilizarse desde la interfaz.
6. Los datos se conserven correctamente.
7. Se haya comprobado su integración con los módulos anteriores.
8. La documentación esté actualizada.
9. El resultado pueda demostrarse con un flujo reproducible.

No considerar terminado un módulo simplemente porque su interfaz aparece en pantalla.

No reportar botones como funcionales si no ejecutan ninguna operación.

Si se utiliza una funcionalidad provisional durante una etapa, señalarla claramente y mantenerla en la lista de trabajo pendiente.

---

# 52. PROYECTO DEMOSTRATIVO PARA PRUEBAS

Crear un proyecto de ejemplo que permita validar la mayoría de las funciones.

Nombre: **Demo — Escenario Banda Completa**.

## Escenario

- Ancho: 8 metros.
- Profundidad: 6 metros.
- Elevación: 0,80 metros.
- Forma: rectangular.

## Pantalla

- Tipo: LED modular.
- Ancho: 5 metros.
- Alto: 2,5 metros.
- Ubicación: sector posterior.
- Montaje: configurable.

## PA

- Line array izquierdo.
- Line array derecho.
- Seis cajas por lado inicialmente.
- Posibilidad de cambiar a ocho.
- Subwoofers configurables.

## Músicos

- Baterista.
- Bajista.
- Guitarrista.
- Dos tecladistas o puestos de teclado.
- Voz principal.
- Tres coristas.

## Equipamiento

- Batería con microfonía.
- Bajo con DI.
- Guitarra y amplificación.
- Teclados estéreo.
- Micrófonos vocales.
- Soportes.
- Monitores de piso.
- Sistemas IEM.
- Stagebox.
- Consola.

## Audio

Crear una lista de entradas coherente con las fuentes incorporadas.

Permitir configurar perfiles de prueba de consola con capacidades verificadas.

Asignar distintas mezclas de monitoreo.

Generar:

- Stage plot 2D.
- Vista 3D.
- Input list.
- Output list.
- Patch.
- Inventario.
- Rider PDF.

Este proyecto debe utilizarse para las pruebas end-to-end.

No debe contener valores técnicos inventados presentados como especificaciones comerciales verificadas.

---

# 53. DOCUMENTACIÓN QUE DEBÉS PRODUCIR

Mantener dentro del repositorio:

- README.md.
- Instrucciones de instalación.
- Comandos de desarrollo.
- Comandos de compilación.
- Comandos de pruebas.
- Descripción de arquitectura.
- Modelo de datos.
- Convenciones geométricas.
- Documentación de módulos.
- Formato de proyectos.
- Sistema de exportaciones.
- Estado de implementación.
- Registro de decisiones.
- Funcionalidades pendientes.
- Limitaciones conocidas.
- Instrucciones de distribución.

Crear un documento de seguimiento con una matriz de funcionalidades.

Cada funcionalidad debe mostrar un estado real:

- Pendiente.
- En desarrollo.
- Implementada.
- Probada.
- Bloqueada.

No utilizar únicamente una descripción narrativa que dificulte determinar qué está terminado.

---

# 54. FLUJO DE TRABAJO QUE ESPERO DE VOS COMO CODEX

Primero:

1. Inspeccioná el repositorio y el entorno.
2. Identificá herramientas disponibles.
3. Confirmá dependencias apropiadas.
4. Diseñá la arquitectura inicial.
5. Creá el plan de hitos.
6. Registrá las decisiones esenciales.

Después:

7. Comenzá la implementación real.
8. Construí una primera versión ejecutable.
9. Implementá el núcleo geométrico.
10. Incorporá desde temprano el sistema 2D/3D.
11. Añadí progresivamente los módulos.
12. Ejecutá pruebas en cada hito.
13. Corregí problemas antes de acumular nuevas funciones.
14. Actualizá el registro de progreso.
15. Conservá una base ejecutable en todo momento.

Si la ejecución debe dividirse en varias sesiones de Codex, prepará un estado de continuidad claro para retomar exactamente donde quedó el trabajo.

No sacrifiques la calidad arquitectónica por intentar mostrar demasiadas funciones rápidamente.

Pero tampoco dediques toda la ejecución a planificación sin construir el producto.

**Quiero implementación efectiva desde la primera sesión.**

---

# 55. CONDICIONES DE CALIDAD QUE NO SE PUEDEN NEGOCIAR

El software debe cumplir estas reglas generales:

- Precisión dimensional.
- Coherencia entre 2D y 3D.
- Interfaz profesional.
- Alta calidad visual.
- Objetos editables.
- Catálogo extensible.
- Audio correctamente modelado.
- Patch consistente.
- Guardado real.
- Exportaciones válidas.
- Documentación útil.
- Arquitectura modular.
- Funcionamiento sin conexión.
- Protección de revisiones.
- Capacidad de crecimiento.
- Pruebas verificables.
- Manejo robusto de errores.

No utilizar simulaciones visuales como sustituto permanente de funcionalidades reales.

No declarar completado el software si todavía solamente permite dibujar un escenario básico.

No eliminar las funciones avanzadas de la especificación por conveniencia.

---

# 56. RESULTADO FINAL ESPERADO

Al completar el proyecto, espero disponer de un programa desde el cual pueda:

1. Crear un escenario con medidas reales.
2. Visualizarlo en 2D.
3. Visualizarlo en 3D.
4. Recorrerlo con cámaras interactivas.
5. Incorporar equipos desde una biblioteca.
6. Crear equipos personalizados.
7. Trabajar con modelos comerciales específicos.
8. Configurar pantallas LED de medidas exactas.
9. Configurar sistemas line array con cajas individuales.
10. Incorporar músicos e instrumentos.
11. Posicionar todo con precisión.
12. Administrar relaciones físicas y agrupaciones.
13. Crear canales de entrada.
14. Crear canales de salida.
15. Configurar consolas y stageboxes.
16. Crear distintas configuraciones de patch.
17. Organizar mezclas de monitoreo.
18. Verificar conexiones.
19. Detectar conflictos.
20. Generar inventarios.
21. Guardar proyectos.
22. Duplicar proyectos.
23. Mantener revisiones.
24. Exportar planos.
25. Exportar imágenes tridimensionales de alta calidad.
26. Generar riders técnicos profesionales.
27. Recuperar todos los datos para seguir editando.
28. Utilizar la herramienta sin depender de servicios pagos externos.

El resultado debe combinar la precisión de un editor técnico con una visualización tridimensional realista, atractiva e intuitiva.

---

# 57. INSTRUCCIÓN FINAL: COMENZAR EL DESARROLLO

Esta especificación representa el alcance integral de **Stage Designer Pro**.

No necesito que me vuelvas a explicar conceptualmente cómo podría construirse.

Necesito que comiences a implementarlo.

Iniciá por inspeccionar el entorno y establecer la arquitectura, y avanzá inmediatamente hacia una primera aplicación funcional.

La primera demostración técnica deberá incluir, como mínimo:

- Interfaz de escritorio profesional.
- Creación de un escenario rectangular.
- Dimensiones editables.
- Cuadrícula métrica.
- Editor 2D.
- Primera vista 3D interactiva.
- Cámaras.
- Un objeto físico dimensionado.
- Selección.
- Movimiento.
- Rotación.
- Sincronización de posición entre 2D y 3D.
- Guardado y recuperación.
- Pruebas básicas de escala y persistencia.

Esta demostración es el primer hito, no el producto completo.

Continuá luego con el resto de los módulos siguiendo el plan definido.

En cada entrega informá:

- Qué funcionalidades fueron implementadas realmente.
- Qué archivos o módulos se modificaron.
- Qué pruebas se ejecutaron.
- Qué resultados se obtuvieron.
- Qué dificultades permanecen.
- Qué sigue en el plan.

No confundas una implementación parcial con una versión final.

**El objetivo es desarrollar una herramienta profesional, completa, estable, visualmente sobresaliente y preparada para acompañar durante años el trabajo de planificación de escenarios y creación de riders técnicos.**

**Comenzá ahora con la implementación del proyecto Stage Designer Pro.**