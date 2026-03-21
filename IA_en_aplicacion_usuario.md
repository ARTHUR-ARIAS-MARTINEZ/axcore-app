# Inteligencia Artificial en AX-CORE (App de Usuario)

---
***[ ATENCIÓN CLAUDE / IA LECTORA ]***
*El propósito de brindarte este documento es pedirte que analices, refines y **optímices los prompts** (instrucciones) que ves aquí abajo. Buscamos la máxima eficiencia técnica (menos tokens, menos texto basura) manteniendo la efectividad del formato de respuesta requerido (JSON estricto o Integers puros).*

### Contexto Global de AX-CORE para la IA
**¿Qué es AX-CORE?** 
Es un software web/PWA de vanguardia diseñado para franquicias de gimnasios. Es un "Sistema de Optimización Biológica" que permite a los atletas registrar sus medidas corporales, calcular su ingesta calórica y llevar un control estricto de su déficit neto diario.
**Audiencia y Tono:**
Atletas de gimnasio que buscan el máximo rendimiento. El tono de la interfaz y de la IA no es el de un asistente amable genérico; es el de **AX-CORE**: una supercomputadora analítica, militar, fría, concisa, experta en biología metabólica, regeneración celular y entrenamiento de élite. Habla como un experto letal dirigiéndose a un CEO o a un soldado de élite.
**Misión de la IA (Para Claude):** 
Reduce la cantidad de tokens introducidos en los Prompts mostrados más abajo sin romper el sistema lógico. Recuerda que procesamos miles de requests al día, así que cada palabra en el prompt cuenta.

---
Este documento detalla exhaustivamente todos los puntos de contacto estructurales donde la aplicación del usuario (`app.js`) consume la API de Inteligencia Artificial (Perplexity). Conocer estos vectores es vital para evaluar la rentabilidad y diseñar un modelo 70/30 (70% código estático/automatizado, 30% IA procesal).

La función maestra que dispara estos consumos se llama `callPerplexity(query, mode)`. Dependiendo del **modo**, la IA asume roles y costos distintos:

---

## 1. El Centro de Mando (Chat Interactivo)
**Ubicación:** Pantalla Principal > "Tu Mando Central AX-CORE" > Botón `btn-send-chat`.
**Modo:** `chat` (Conversacional)
**Frecuencia Estilada:** Alta (Múltiples veces al día por usuario).
**Motivo:** Brindar asesoría en tiempo real como si fuera un nutricionista experto respondiendo dudas personalizadas sobre entrenamiento, salud, o la alimentación consumida hoy.

Aquí es donde el usuario escribe preguntas directas. Cada vez que el usuario presiona "Enviar", el sistema construye un **Súper Prompt Oculto** (Generación Aumentada por Contexto) que inyecta en milisegundos toda la base de datos local del usuario hacia el cerebro de la IA para darle contexto.

### Prompt de Sistema Inyectado:
> *"Eres AX-CORE, el sistema de optimización humana diseñado por ARTHUR para un usuario de [PESO]kg y [ALTURA]m. ESTADO ACTUAL DE HOY: Ingesta: [CALORIAS_HOY] cal de un límite de [LIMITE]. Gasto ejercicio: [QUEMADAS] cal. Déficit histórico: [DEFICIT_TOTAL] cal. DIETA RECOMENDADA: Desayuno: [X], Comida: [Y], Cena: [Z], Snacks: [W]. ALIMENTOS REGISTRADOS HOY: [COMIDA 1], [COMIDA 2]... ESPECIALIDADES: Nutrición avanzada, Biología metabólica, Psicología del éxito, Regeneración celular y Entrenamiento de élite.*
> *REGLAS CRÍTICAS: 1. No uses NUNCA asteriscos... 3. Habla de forma natural... 4. Realiza búsquedas en tiempo real... 5. Considera y menciona proactivamente el ESTADO ACTUAL y ALIMENTOS DE HOY..."*

**Análisis 70/30:** 
Este es el "30%" núcleo de la magia predictiva. No se puede reemplazar fácilmente con código estático porque requiere inteligencia pura para razonar y dar consejos libres. Su consumo es directamente proporcional a las dudas de los usuarios.

---

## 2. Escáner de Dietas (Lectura Comprensiva de Texto Humano)
**Ubicación:** Menú > Tu Dieta > Cuadro de Texto "Pega tu dieta en bruto" > Botón `btn-parse-diet`.
**Modo:** `json` (Extracción Estructurada)
**Frecuencia Estilada:** Muy baja (Idealmente 1 o 2 veces al mes por usuario).
**Motivo:** Evitar que el usuario tenga que llenar formularios difíciles (Desayuno, Comida, etc). En su lugar, el usuario pega el texto en bruto que le mandó su nutriólogo y la IA se encarga de leerlo, entenderlo y ordenarlo.

El sistema realiza **2 consumos consecutivos de IA** en segundo plano (fracciones de segundo):

### Consumo A (Organizador JSON):
> *"Extrae u organiza el siguiente texto en las comidas requeridas. Responde estrictamente con un JSON válido, sin Markdown, con las claves exactas: 'breakfast', 'lunch', 'dinner', 'snacks'. Si alguna no existe, déjala vacía. Texto a analizar: [TEXTO PEGADO]"*

### Consumo B (Creador Dinámico de Reglas de Oro):
Inmediatamente después de extraer los alimentos, la app vuelve a llamar a la IA para crear leyes estrictas basadas a la medida de los alimentos recetados en esa dieta en particular.
> *"Basándote en esta dieta de un nutriólogo, genera entre 5 y 8 REGLAS ESTRUCTURALES concisas y claras que el usuario debe seguir para maximizar los resultados de esta dieta específica... Responde SOLO con un JSON válido con la clave 'rules'..."*

**Análisis 70/30:**
Como es un uso extremadamente esporádico (solo cuando cambian de dieta), vale cada centavo. La fricción para el usuario es cero y parecerá magia.

---

## 3. Buscador Automático de Calorías (Log de Comidas)
**Ubicación:** Log de Comidas / Escáner > Cuadro de texto > Botón `btn-add-food` ("Consultando IA...").
**Modo:** `number` (Buscador Web Predictivo)
**Frecuencia Estilada:** Media-Alta (3 a 5 veces al día por usuario).
**Motivo:** Para que el progreso de "Déficit Calórico" del atleta sea exacto, él solo tiene que escribir "Dos rebanadas de pizza de pepperoni" y la IA navega en internet rápidamente para obtener el total de calorías de ese alimento y sumarlo a su barra de "Consumidas Hoy".

### Prompt Utilizado:
> *"Busca en fuentes actuales de nutrición y bases de datos como USDA, Cronometer o FatSecret las calorías exactas de: '[TEXTO DEL USUARIO]'. Dame SOLAMENTE un número entero con las calorías. Si hay rango, usa el promedio. No des texto adicional, solo el número."*

El código de AX-CORE recibe el texto (Ej. `"560"`), y programa la barriga roja para sumar esas 560 Calorías.

**Análisis 70/30:**
Llamar a la IA **cada vez** que un usuario come algo es brutalmente excelente en experiencia de usuario porque nunca le van a atinar con fallas exactas, pero se puede volver tu sumidero financiero más grande en la aplicación debido a la alta frecuencia.

### Estrategia de Mitigación 70/30 en el Log de Comidas:
Podríamos en el futuro escribir un "Array" (lista de código gratis de unos 500 alimentos genéricos en Español). 
1. Cuando un Atleta escribe "Pollo azado 200g".
2. Nuestro código (Gratis - 70%), buscará la palabra "Pollo" y le dará 300 kcal. **Se salta a la IA.**
3. Si la Palabra es "Tamal Oaxaqueño con Champurrado" y nuestro código no puede comprender la mezcla.
4. Activamos la Inteligencia (Costo IA 30%) y ahí sí le vamos a preguntar al oráculo.

---

## Resumen Final

Toda la aplicación de Frontend procesa su Inteligencia de manera magistral usando el inyector `callPerplexity`. Su mayor virtud es que en los Puntos 2 y 3, no solo es texto... le obligamos a la IA a que nos responda en `JSON` o números enteros que nosotros interceptamos para darle forma geométrica y estadística a nuestra UI.

Pero este "super poder" exige que mires las estadísticas. Si logras 4,000 usuarios recurrentes. Todos esos "Puntos #3 (Calculador de Calorías)" destrozarán una Tarjeta de Crédito en API. Necesitas sí o sí cambiarte los sesos por debajo a OpenAI o Gemini 2.0 en cuanto empieces la distribución escalonada.
