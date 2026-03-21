# ANÁLISIS COMPLETO: Sistema de Logros y Compartir en AX-CORE

## Cómo Funciona Actualmente

### Flujo Técnico Paso a Paso
1. El usuario está en la sección **"Ajustes"** de la app
2. Hay un apartado llamado **"Logros y Compartir"** que muestra:
   - Nombre del usuario
   - Déficit calórico acumulado (kcal totales quemadas)
   - Cintura actual (cm)
3. Al presionar el botón **"Compartir Mis Logros"**, el sistema ejecuta la función `generateAchievementCard()`, que es código JavaScript puro (cero IA involucrada)
4. Esta función crea un **Canvas HTML5** de 1080×1350 píxeles (formato Instagram Story)
5. El Canvas dibuja:
   - Un fondo aleatorio de 3 imágenes predefinidas (gym neón, mancuernas, carbono)
   - Un overlay oscuro degradado para legibilidad
   - Un panel central "glassmorphism" (cristal semi-transparente)
   - El logo de AX-CORE
   - El título "RESULTADOS OFICIALES"
   - El nombre del usuario en mayúsculas
   - El número grande de kcal calcinadas
   - La cintura actual
   - Un badge "SISTEMA AX-CORE"
   - Un pie de imagen "OPTIMIZACIÓN BIOLÓGICA BY ARTHUR"
6. El Canvas se convierte a un archivo PNG (`canvas.toBlob`)
7. Si el celular soporta `navigator.share` (Android/iOS modernos), abre el menú nativo para compartir (WhatsApp, Instagram, etc.)
8. Si no lo soporta, descarga el archivo directamente como `axcore_logros.png`

### Problemas Detectados
- **Solo 3 fondos**: Siempre sale uno de 3 fondos aleatorios (no hay opción de elegir)
- **Sin opciones de estilo**: El usuario no puede personalizar nada
- **Solo 2 métricas**: Muestra únicamente déficit calórico y cintura (podría mostrar más)
- **El estilo está atado al tema de la app**: Los colores del acento cambian según el tema elegido del usuario
- **No hay preview**: El usuario no ve la tarjeta antes de compartirla
- **Solo un formato**: Instagram Story (1080×1350), no hay opción para cuadrado (1080×1080) o paisaje

---

## PROMPT PARA CLAUDE: Optimización del Sistema de Logros

Copia y pega exactamente este texto en Claude para que te devuelva un plan de acción optimizado:

---

**CONTEXTO PARA CLAUDE:**

Soy Arthur, creador de AX-CORE, una aplicación web progresiva (PWA) de control de peso y optimización biológica para usuarios de gimnasios en México. La app está construida en HTML/CSS/JavaScript vanilla (sin frameworks). Tengo un sistema de tarjetas de logros para compartir en redes sociales que necesito mejorar radicalmente.

**ESTADO ACTUAL DEL SISTEMA DE LOGROS:**

Actualmente uso HTML5 Canvas para generar imágenes de 1080×1350px (formato Instagram Story). El sistema funciona así:
1. Cargo una imagen de fondo aleatoria de 3 opciones predefinidas (imágenes estáticas en carpeta assets/)
2. Dibujo un overlay oscuro degradado encima
3. Dibujo un panel central con efecto glassmorphism (cristal semitransparente)
4. Coloco el logo, el nombre del usuario, las métricas (déficit calórico en kcal y cintura en cm) y un badge de la marca
5. Convierto el Canvas a PNG y lo comparto con navigator.share()

**PROBLEMAS QUE QUIERO RESOLVER:**

1. Solo hay 3 fondos y son aleatorios (el usuario no elige)
2. No hay preview antes de compartir
3. Solo muestra 2 métricas (déficit y cintura), pero tengo más datos: peso actual, peso meta, bíceps, tríceps, pecho, espalda, pierna, cadera, pantorrilla, glúteo, cuello, antebrazo
4. El estilo visual está atado al tema de la plataforma (los colores del acento cambian con el tema)
5. Solo hay un formato (Story vertical), no cuadrado ni paisaje
6. Las letras son genéricas, quiero que se vean más integradas con la imagen de fondo, como si fueran parte de un diseño de marketing real de un gimnasio premium

**LO QUE QUIERO LOGRAR:**

1. **Múltiples estilos/plantillas seleccionables**: Que el usuario pueda elegir entre 5-8 diseños diferentes. Cada diseño debe tener su propia identidad visual (colores, tipografía, disposición de elementos, estilo del fondo). Los estilos deben ser independientes del tema de la plataforma.
2. **Cada estilo debe tener un nombre temático** (ej: "Militar", "Neón Nocturno", "Fibra de Carbono", "Fuego", "Hielo", etc.)
3. **Preview en tiempo real**: Antes de compartir, el usuario debe ver una miniatura de cómo se verá la tarjeta con el estilo elegido
4. **Textos integrados al diseño**: No quiero letras flotando sobre un fondo, quiero que los textos se sientan parte integral del diseño, con sombras, glows, degradados en las letras, efectos de relieve, etc.
5. **Más métricas visibles**: Mostrar peso actual, cintura, y las métricas más relevantes que el usuario quiera presumir
6. **Múltiples formatos**: Story (1080×1350), Cuadrado (1080×1080), y Paisaje (1920×1080)
7. **Todo debe funcionar con Canvas puro de JavaScript** (sin librerías externas ni IA), ya que los fondos son generados con gradientes, patrones geométricos y efectos puros de Canvas (no imágenes estáticas)

**RESTRICCIONES:**
- No puedo usar librerías externas como Fabric.js. Todo debe ser Canvas nativo
- No puedo usar IA para generar imágenes en tiempo real (costo prohibitivo)
- Los fondos deben generarse con código (gradientes, formas geométricas, partículas, líneas) en vez de cargar imágenes pesadas
- La app es una PWA, debe funcionar offline
- Debo mantener el rendimiento: la generación de la tarjeta no debe tardar más de 2 segundos

**ENTREGABLES QUE NECESITO DE TI:**
1. El código JavaScript completo de la función `generateAchievementCard()` refactorizada con el sistema de plantillas
2. El HTML necesario para la UI de selección de estilo y preview
3. El CSS para el selector de estilos
4. Los 6-8 estilos con sus fondos generados por código (gradientes, patrones, etc.)
5. La lógica de preview en miniatura

Dame el código completo listo para copiar y pegar. No omitas nada. Todo debe funcionar al primer intento sin dependencias externas.

---

## FIN DEL PROMPT PARA CLAUDE
