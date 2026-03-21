# SIGUIENTE PASO: ESCALAR A 4,000 USUARIOS O GIMNASIOS

## Contexto
Actualmente AX-CORE utiliza **Perplexity AI (modelo `sonar`)** como motor cerebral. Funciona correctamente, pero a escala de 4,000 gimnasios (hasta 200 usuarios c/u), el costo mensual sería insostenible (~$9,600 USD/mes). Este documento detalla el plan técnico exacto para migrar a dos proveedores prácticamente gratuitos sin perder calidad.

---

## Arquitectura Propuesta (2 Motores)

### Motor 1: Google Gemini 1.5 Flash (Chat Principal + Dietas)
| Característica | Detalle |
|---|---|
| **Proveedor** | Google AI Studio |
| **Modelo** | `gemini-1.5-flash` |
| **Costo** | Nivel gratuito: 1,500 peticiones/día. Después: ~$0.075 por 1 millón de tokens |
| **Velocidad** | ~400ms de latencia |
| **Uso en AX-CORE** | Chat inteligente, procesamiento de dietas (JSON), reglas estructurales |
| **URL del API** | `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent` |
| **Cómo obtener API Key** | Ir a https://aistudio.google.com → Crear proyecto → Generar API Key (gratis) |

**Costo estimado para 4,000 usuarios activos (20 consultas/día c/u):**
- ~80,000 mensajes/día × ~500 tokens promedio = 40M tokens/día
- 40M × 30 días = 1,200M tokens/mes
- **Costo: ~$90 USD/mes** (vs $9,600 con Perplexity)

### Motor 2: Groq + Llama 3.3 (Cálculos Rápidos de Calorías)
| Característica | Detalle |
|---|---|
| **Proveedor** | Groq Inc. |
| **Modelo** | `llama-3.3-70b-versatile` |
| **Costo** | Nivel gratuito generoso. Después: ~$0.05 por 1 millón de tokens |
| **Velocidad** | ~200ms (el más rápido del mercado) |
| **Uso en AX-CORE** | Solo el 30% residual de calorías que no encuentra nuestra base de datos local |
| **URL del API** | `https://api.groq.com/openai/v1/chat/completions` |
| **Cómo obtener API Key** | Ir a https://console.groq.com → Crear cuenta gratuita → API Keys |

**Costo estimado:**
- Solo se activa cuando el Interceptor Local (70%) no encuentra el alimento
- ~24,000 consultas residuales/día × ~100 tokens = 2.4M tokens/día
- **Costo: ~$3.6 USD/mes**

---

## Resumen de Costos Mensuales Proyectados

| Concepto | Actual (Perplexity) | Después (Gemini + Groq) |
|---|---|---|
| Chat + Dietas | ~$8,000 USD | ~$90 USD |
| Calorías residuales | ~$1,600 USD | ~$3.6 USD |
| **TOTAL** | **~$9,600 USD** | **~$93.6 USD** |
| **Ahorro** | - | **99%** |

---

## Pasos Técnicos Exactos para la Migración

### Paso 1: Obtener las API Keys gratuitas
1. Entrar a https://aistudio.google.com y crear una API Key de Gemini
2. Entrar a https://console.groq.com y crear una API Key de Groq

### Paso 2: Modificar `app.js` (función `callPerplexity`)
Cambiar la función principal que actualmente apunta a `api.perplexity.ai` para que:
- Si el `mode` es `'chat'` o `'json'` → Enviar a **Gemini Flash**
- Si el `mode` es `'number'` (calorías) → Enviar a **Groq Llama**

### Paso 3: Modificar el Panel Admin (`admin.js`)
En lugar de pedir una sola API Key de Perplexity al crear un bloque de gimnasio:
- Pedir **2 campos**: API Key Gemini + API Key Groq
- O bien, usar las Keys del administrador central (Arthur) como Keys maestras

### Paso 4: Testing con 10 usuarios reales
Antes de lanzar a 4,000 usuarios:
1. Crear un grupo piloto de 10 personas
2. Monitorear la calidad de las respuestas de Gemini vs Perplexity
3. Medir tiempos de respuesta reales
4. Ajustar prompts si Gemini genera texto diferente

---

## Cronograma Sugerido

| Fase | Duración | Acción |
|---|---|---|
| **Fase Beta** | Semana 1 | Obtener Keys, modificar código, probar con 10 usuarios |
| **Fase Piloto** | Semana 2-3 | Expandir a 1 gimnasio completo (~50 usuarios) |
| **Fase Lanzamiento** | Semana 4+ | Abrir todos los gimnasios, monitorear costos |

---

## Nota Final
La migración es un cambio de **menos de 1 hora de programación**. Solo se modifica una función (`callPerplexity`) y se redirigen las URLs. Todo el resto de la app (interfaz, base de datos local, lógica de negocio) permanece intacto.
