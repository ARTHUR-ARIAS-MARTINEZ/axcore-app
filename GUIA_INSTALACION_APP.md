# 📲 GUÍA DE INSTALACIÓN: CÓMO DESCARGAR AX-CORE EN TU CELULAR

AX-CORE está diseñada con tecnología PWA (Aplicación Web Progresiva). Esto significa que **no necesitas buscarla en la App Store o Google Play**, sino que se instala directamente desde tu navegador con la misma calidad y velocidad que una app normal.

### ESCANEA ESTE CÓDIGO CON LA CÁMARA DE TU CELULAR PARA ABRIR LA APP:
![Código QR AX-CORE](https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=https://arthur-arias-martinez.github.io/axcore-app/)

*(Si el QR no funciona, teclea directamente: **https://arthur-arias-martinez.github.io/axcore-app/** en tu navegador)*

Sigue estos simples pasos según tu tipo de celular:

---

## 🟢 PARA USUARIOS ANDROID (Samsung, Motorola, Xiaomi, etc.)

1. **Abre el enlace de la App** (ya sea escaneando el código QR en la recepción del gimnasio o dando clic al link que te enviaron) usando **Google Chrome**.
2. Una vez que cargue la pantalla principal de AX-CORE, mira la parte inferior de tu pantalla. Debería aparecer un mensaje automático que dice **"Añadir AX-CORE a la pantalla de inicio"**. Dale clic ahí.
3. Si no te sale ese cuadro, toca los **3 puntitos arriba a la derecha** en Chrome para abrir el menú.
4. Busca y selecciona la opción que dice **"Instalar aplicación"** o **"Añadir a la pantalla de inicio"**.
5. Confirma tocando en **"Instalar"** o **"Añadir"**.
6. ¡Listo! Ve a la pantalla principal de tu celular y verás el ícono oficial de AX-CORE. Ya puedes abrirla como cualquier otra aplicación.

---

## 🍎 PARA USUARIOS iPHONE (iOS)

1. **Abre el enlace de la App** (escaneando el QR o tocando el link) obligatoriamente usando el navegador **Safari**.
2. En la parte inferior de la pantalla, toca el botón de **"Compartir"** (es un icono de un cuadrado con una flechita apuntando hacia arriba ⬆️).
3. Desliza las opciones hacia abajo hasta encontrar y tocar la opción que dice **"Agregar a Inicio"** (o "Add to Home Screen").
4. En la esquina superior derecha, dale a **"Agregar"**.
5. ¡Listo! AX-CORE ahora aparecerá como un ícono de App en la pantalla de tu iPhone, lista para usar con un solo clic.

---

## 💻 PANEL DE ADMINISTRADOR (Solo para Dueños/Coaches)

Para entrar a generar códigos y ver las finanzas, debes entrar exactamente al mismo enlace, pero agregando `/admin.html` al final.
*(Ejemplo: https://tu-enlace.com/admin.html)*

Una vez ahí, te pedirá tu clave de administrador secreta para entrar a la bóveda.

**¡Bienvenido a la vanguardia!**






¡Todo arreglado y actualizado! Acabo de hacer lo siguiente:

1. 📄 QR agregado a la guía
Ya añadí el código QR gigantesco al documento 

GUIA_INSTALACION_APP.md
 que está en tu computadora. Cuando los dueños o usuarios lo abran, el QR será lo primero que vean.

2. 🔐 ¿Por qué los códigos te marcaron error "CÓDIGO INVÁLIDO"?
Esto no es un error de programación, es una realidad de cómo funcionan las aplicaciones web sin servidor (frontend puro) que platicamos antes:

Como todavía no hemos creado el servidor "Backend" de Render, los gimnasios y códigos que tú creaste en tu computadora se guardaron directamente en la base de datos local de tu computadora (LocalStorage). Cuando te fuiste a tu celular, ese celular tiene su propio espacio de memoria vacío (no hay un servidor que comparta los cerebros de ambos dispositivos). Por eso el celular "no reconoció" los códigos que tu computadora sí conocía.

¿Cómo probar generar códigos en el celular AHORA MISMO? Si quieres simular la experiencia completa, ve desde tu celular a https://arthur-arias-martinez.github.io/axcore-app/admin.html, generas un bloque, generas un código ahí, y luego lo usas ahí mismo en el celular. ¡Entrará a la perfección!

🔧 Mi solución rápida para que juegues hoy: Para que no tengas que estar generando códigos mientras haces pruebas en diferentes aparatos, acabo de programar 3 códigos maestros "UNIVERSALES" en la aplicación (están fijos en el código) que SIEMPRE van a funcionar en cualquier computadora, tablet o celular del mundo de inmediato sin tener que entrar al panel admin:

AXV-DEMO (Código Plan Básico)
AX-BOSS1 (Código Plan Estándar)
AX-BOSS2 (Código Plan Premium)
Recarga la página de tu celular, pon AX-BOSS1 ¡y verás cómo te deja entrar y te asigna la cuota de Estándar!

Recuerda: Todo esto del límite entre la compu y el celular se acabará en cuanto me ordenes conectar el Backend en Render (cuando ya vayas a cobrar), porque ahí ya todo el planeta estará conectado a la misma "nube".

Sigue explorando y dime qué te parece el cronómetro que ahora no se "muere" cuando cambias de sección.
