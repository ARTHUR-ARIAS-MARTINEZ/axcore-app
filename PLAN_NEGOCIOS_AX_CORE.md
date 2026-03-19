# 🚀 ESTRATEGIA MAESTRA: AX-CORE BY ARTHUR

## 🚀 MODELO DE RENTA PARA GIMNASIOS (B2B)

### 1. ¿Cómo funciona la Renta?
No es necesario descargar contenido en cada computadora. El sistema funcionará como una **Web App (SaaS)**:
*   **Acceso Centralizado:** Tú eres el "Dueño del Software". El dueño del gimnasio te paga una suscripción mensual.
*   **Marca Blanca:** El gimnasio puede mostrar su logo (Ej. "Gimnasio Titán Power Powered by AX-CORE").
*   **Control de API y Escalabilidad:** Solo tú administras y puedes ver u ocultar las API Keys a través del Panel Maestro o el código secreto. Crearemos "clones" o instancias independientes de la aplicación para dividir a los gimnasios en **bloques de 10 o 20 gimnasios por API Key**.
*   **Despliegue en la Nube (Cloud):** Utilizaremos plataformas como **GitHub Pages, Vercel o Firebase Hosting**. Son gratuitas para el nivel de tráfico inicial (miles de usuarios), extremadamente robustas y no tienen "límite de descargas" ya que la app se usa desde el navegador (PWA). Cada bloque de gimnasios tendrá su propia URL (ej: `vanguardia.com/bloque1/`, `vanguardia.com/bloque2/`).

### 2. Sistema de Código QR (Expansión Física y Directa)
*   **Implementación Personal:** Tú te encargarás de crear y llegar directamente a los gimnasios para pegar el **Código QR** en áreas estratégicas (recepción, pesas, espejos). Es un enfoque de marketing de guerrilla.
*   **Escaneo y Registro Directo:** Cualquier socio del gimnasio lo escanea, se registra en automático bajo la base de datos de ese "bloque/clon", y accede después de pagar su membresía o ser habilitado.

### 3. Pagos Automáticos (Plataforma Stripe y Comisiones)
*   **Uso de Stripe:** Utilizaremos **Stripe** para manejar cobros recurrentes en automático, sin estar cobrando puerta a puerta cada mes.
*   **Comisión de Stripe (México 2026):** Stripe generalmente cobra un **3.6% + $3.00 MXN** por cada cargo exitoso con tarjeta (crédito o débito), más IVA sobre esa comisión. Es la tarifa estándar más competitiva para pagos online seguros. 
*   **Dashboard para Emprendedores:** Desde el panel de Stripe generarás los "Links de Pago" y sabrás si la tarjeta del gimnasio no pasó para tomar acciones.

### 4. Estrategia Fiscal y Facturación (México)
*   **Consultoría Fiscal:** Trabajarás directamente con tu contadora (que queda como consultora estrella para revisión estratégica). Le preguntarás sobre el Régimen Simplificado de Confianza (RESICO) y si te conviene por tener pagos digitales y venta de productos.
*   **Facturación Futura:** Dejaremos como una "opción futura" la automatización vía **Facturapi** en caso de que un administrador de gimnasio de la élite exija su factura en automático.

### 5. Seguridad: API Key Oculta "Nivel Dios"
*   **Oculto para todos:** El botón de la API se eliminó de la interfaz gráfica. Los gimnasios no sabrán que existe IA de terceros atrás ni cómo se configura.
*   **Tu Toque Secreto:** Para ver o cambiar la API Key (solo en tus dispositivos de administración, o al hacer mantenimiento en tu servidor M36), tú (Arthur) deberás tocar 5 veces rápidamente el título "SISTEMA ÉLITE". Así se despliega u oculta de modo seguro.

## 1. ANÁLISIS DE COSTOS Y REPARTO (MÉXICO 2026)
*Cálculos basados en una renta mensual sugerida de **$1,500 MXN** por gimnasio.*

1.  **Ingreso por Gimnasio:** $1,500 MXN
2.  **Costo API Perplexity (Reserva):** -$500 MXN
3.  **Comisión Plataforma (Stripe/Cobro):** -$100 MXN
4.  **REMANENTE OPERATIVO:** **$900 MXN**
5.  **Comisión Vendedor (25% del remanente):** -$225 MXN
6.  **UTILIDAD NETA PARA ARTHUR:** **$675 MXN**

*Margen de utilidad neta: **45% sobre el total** tras cubrir todos los costos operativos.*

---

## 2. PROYECCIONES FINANCIERAS (POR BLOQUES)
*Cifras en Pesos Mexicanos (MXN) mensuales.*

| Escenario | Gimnasios | Ingreso Bruto | Costos (API+Stripe) | Comisiones Ventas | **Utilidad Neta Arthur** |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Inicio (1 Bloque)** | 10 | $15,000 | $6,000 | $2,250 | **$6,750** |
| **Tracción (2 Bloques)** | 40 | $60,000 | $24,000 | $9,000 | **$27,000** |
| **Dominio (5 Bloques)** | 100 | $150,000 | $60,000 | $22,500 | **$67,500** |

---

## 3. MODELO DE CONTROL OPERATIVO: MULTI-CONTROL CLUSTERS
Para garantizar la estabilidad del servicio y un control financiero quirúrgico, implementaremos el sistema de **Clusters**:
*   **Arquitectura de Bloques**: La red se divide en grupos de **10 a 20 gimnasios**. Cada cluster opera con una URL independiente y una **API Key exclusiva**.
*   **Código de Vinculación (GYM-ID)**: Cada gimnasio tendrá un código único (ej: `V-MX01`) generado en el Panel Maestro. Este código vincula al usuario con la configuración del bloque correcto en automático.
*   **LÍMITE DE ESCALABILIDAD (50 CLIENTES/GYM)**: Para evitar el agotamiento de consultas en la IA (limitaciones de tokens) y asegurar un soporte premium, cada código `GYM-ID` estará limitado a un **máximo de 50 usuarios activos concurrentes** por gimnasio. 
    * *Estrategia:* Esto convierte a AX-CORE en un servicio **"Élite / VIP"** dentro del gimnasio. El dueño no se lo da a todos, se lo vende a los 50 clientes más exclusivos o comprometidos (ej. a los del plan nutricional avanzado o plan anual). Crea escasez y eleva el estatus de la App.
*   **Mitigación de Riesgos**: Si una API Key se satura, solo afectas a ese bloque. Simplemente mueves los gimnasios afectados a un nuevo bloque con una llave limpia en segundos.

---

## 4. FUERZA DE VENTAS Y COMISIONISTAS (75/25)
**AX-CORE** reclutará expertos en ventas fitness bajo el siguiente esquema:
*   **Comisión Recurrente**: El vendedor recibe el **25% de la mensualidad ($375 MXN)** por cada gimnasio en su cartera.
*   **Mantenimiento de Cuenta**: El pago de la comisión es **estrictamente condicional** al seguimiento mensual. El vendedor es responsable de la satisfacción del dueño del gimnasio y de la retención del cliente. Si el cliente cancela, la comisión finaliza.
*   **Inmuebles y Logística**: El vendedor aporta su propio transporte y labor de campo. AX-CORE aporta los materiales promocionales digitales, la infraestructura de servidor y el soporte técnico nivel 2.

---

## 5. CAPACIDAD Y TARGET DE MERCADO (MÉXICO)
Un gimnasio premium promedia entre **300 y 1,500 socios**. 
**Cadenas Objetivo:**
1.  **Sports World**: Máximo lujo, enfoque familiar y ejecutivo.
2.  **Sport City**: Altamente especializado, ideal para el perfil de biohacking.
3.  **Energy Fitness**: Enfoque tecnológico, clientes jóvenes y con alto poder adquisitivo.
4.  **Estudios Boutique (Commando, Indigo, Fitsi)**: Grupos pequeños de alto valor donde AX-CORE puede ser el diferencial total contra el gimnasio de al lado.

---

## 6. EL GANCHO DE VENTA (EL CIERRE MAESTRO)
*"Dueño, hoy compites contra miles de gimnasios que ofrecen lo mismo: fierros y duchas. Con **AX-CORE**, tu gimnasio se convierte en un **Centro de Biohacking**. 
Tus socios no solo entrenarán; tendrán un asesor inteligente las 24 horas del día que les dirá exactamente por qué no están bajando de peso basándose en lo que comieron hace 2 horas. 
Cobra 50 pesos extras en tu membresía 'Digital Plus'. Con los primeros 30 socios pagas mi licencia, y con los otros 100 socios te estás metiendo **$5,000 MXN adicionales mensuales** de pura utilidad, sin mover un solo aparato."*

---

## 7. CONTROL DE ACTIVACIÓN Y MOROSIDAD (AX-COACH)
Para blindar tu negocio y el del gimnasio, el sistema incluye la **Terminal de Coach**:
*   **Gestión de Pases**: El dueño genera códigos únicos para cobrar la inscripción a la plataforma.
*   **Filtro Anti-Morosos (Kill Switch)**: El dueño tiene el poder de **Pausar** el software de cualquier cliente que no haya pagado su gimnasio. Esto obliga al cliente a ponerse al corriente para recuperar su IA y sus planes de entrenamiento.
*   **Cero Riesgo Arthur**: Si el gimnasio deja de pagarte la renta del software, tú apagas el **GYM-ID** completo desde la base de datos de Render y todos los usuarios de ese gimnasio pierden el acceso automáticamente.

---
*Este plan de negocios es propiedad intelectual de AX-CORE By ARTHUR.*
