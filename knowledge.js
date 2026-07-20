// Base de conocimiento local ampliada para Arthur Vanguardia
const ARTHUR_KNOWLEDGE = {
    stats_initial: {
        date: "2026-03-17",
        age: 36,
        height: 1.74,
        weight: 100,
        waist: 115,
        target_weight: 85,
        target_waist: 100
    },
    diet_rules: [
        "Sin aceite (todo en teflón)",
        "3L de agua al día",
        "Masticar 20 veces cada bocado",
        "Ayuno de 6 PM a 7 AM",
        "Café negro o té verde sin azúcar permitido",
        "Sal, chile y limón son libres",
        "Ajustar raciones según ingredientes disponibles"
    ],
    meals: {
        breakfast: { time: "7:00 AM", items: "3 huevos revueltos con jitomate/cebolla + 1 tortilla", cal: 300 },
        lunch: { time: "1:00 PM", items: "1.5 tazas de frijoles/lentejas + ensalada gigante (lechuga, zanahoria, jitomate) + 1 tortilla", cal: 600 },
        dinner: { time: "6:00 PM", items: "2 tortillas con 2 huevos batidos + ensalada", cal: 400 },
        snacks: "Zanahoria rallada con limón/chile o lechuga enrollada"
    },
    exercises_catalog: [
        // === CARDIO ===
        { name: "Caminata Rápida", desc: "6-7 km/h. Quema ~6 cal/min (90kg).", cal: 180, type: "Cardio", unit: "Minutos", baseVal: 30 },
        { name: "Trote Ligero", desc: "8-9 km/h. Quema ~10 cal/min (90kg).", cal: 300, type: "Cardio", unit: "Minutos", baseVal: 30 },
        { name: "Carrera Moderada", desc: "10-12 km/h. Quema ~13 cal/min (90kg).", cal: 390, type: "Cardio", unit: "Minutos", baseVal: 30 },
        { name: "Saltos de Cuerda", desc: "Rítmico. Quema ~14 cal/min (90kg).", cal: 140, type: "Cardio", unit: "Minutos", baseVal: 10 },
        { name: "Escaladora Inclinada", desc: "Intensidad moderada. Quema ~11 cal/min.", cal: 165, type: "Cardio", unit: "Minutos", baseVal: 15 },
        { name: "Ciclismo Intenso", desc: "Ritmo fuerte. Quema ~14 cal/min (90kg).", cal: 280, type: "Cardio", unit: "Minutos", baseVal: 20 },
        { name: "Natación (Crawl)", desc: "Ritmo vigoroso. Quema ~12 cal/min (90kg).", cal: 360, type: "Cardio", unit: "Minutos", baseVal: 30 },
        // === HIIT / FUNCIONAL ===
        { name: "Burpees", desc: "~1.5 cal/rep. Al fallo si necesario.", cal: 90, type: "HIIT", unit: "Series de 15", baseVal: 4 },
        { name: "Mountain Climbers", desc: "~0.6 cal/rep. Rodillas al pecho rápido.", cal: 50, type: "HIIT", unit: "Series de 20", baseVal: 4 },
        { name: "Jumping Jacks", desc: "~0.5 cal/rep, ritmo alto.", cal: 60, type: "HIIT", unit: "Series de 30", baseVal: 4 },
        { name: "Sombra Boxeo (Shadow Boxing)", desc: "Quema ~10 cal/min. Combinaciones de 3.", cal: 150, type: "HIIT", unit: "Minutos", baseVal: 15 },
        { name: "Battle Ropes", desc: "~17 cal/min. Ondas dobles continuas.", cal: 170, type: "HIIT", unit: "Minutos", baseVal: 10 },
        { name: "Kettlebell Swing", desc: "~1.1 cal/swing. Cadera como motor.", cal: 88, type: "HIIT", unit: "Series de 20", baseVal: 4 },
        { name: "Saco de Boxeo", desc: "Quema ~11 cal/min. Combos 2-3 min/round.", cal: 165, type: "HIIT", unit: "Minutos", baseVal: 15 },
        // === PIERNA ===
        { name: "Sentadillas Libres", desc: "~0.5 cal/rep. Paralelo completo.", cal: 40, type: "Pierna", unit: "Series de 20", baseVal: 4 },
        { name: "Sentadilla Copa (Goblet)", desc: "~0.6 cal/rep. 1 mancuerna al pecho.", cal: 36, type: "Pierna", unit: "Series de 15", baseVal: 4 },
        { name: "Desplantes (Lunges)", desc: "~0.6 cal/rep por pierna.", cal: 36, type: "Pierna", unit: "Series de 15", baseVal: 4 },
        { name: "Peso Muerto Rumano", desc: "~0.7 cal/rep. Tensión en femorales.", cal: 34, type: "Pierna", unit: "Series de 12", baseVal: 4 },
        { name: "Sumo Squat", desc: "~0.5 cal/rep. Piernas separadas, punta fuera.", cal: 40, type: "Pierna", unit: "Series de 20", baseVal: 4 },
        { name: "Elevación de Talones (Calf Raise)", desc: "~0.3 cal/rep. Quema en pantorrilla.", cal: 30, type: "Pantorrilla", unit: "Series de 25", baseVal: 4 },
        // === GLÚTEO ===
        { name: "Hip Thrust (Empuje Cadera)", desc: "~0.8 cal/rep. El rey del glúteo.", cal: 48, type: "Glúteo", unit: "Series de 15", baseVal: 4 },
        { name: "Elevación de Pelvis (Glute Bridge)", desc: "~0.5 cal/rep. Contracción 1 seg arriba.", cal: 40, type: "Glúteo", unit: "Series de 20", baseVal: 4 },
        { name: "Patada Trasera (Kickback)", desc: "~0.4 cal/rep por pierna. Cuadrupedia.", cal: 30, type: "Glúteo", unit: "Series de 20", baseVal: 4 },
        { name: "Abducción Lateral", desc: "~0.3 cal/rep. Tumbado de lado o de pie.", cal: 25, type: "Glúteo", unit: "Series de 20", baseVal: 4 },
        // === PECHO / ESPALDA / HOMBROS ===
        { name: "Flexiones (Lagartijas)", desc: "~0.5 cal/rep. Cuerpo alineado.", cal: 30, type: "Pecho", unit: "Series de 15", baseVal: 4 },
        { name: "Press de Pecho en Suelo", desc: "~0.5 cal/rep con mancuernas.", cal: 24, type: "Pecho", unit: "Series de 12", baseVal: 4 },
        { name: "Dominadas (Pull-ups)", desc: "~1 cal/rep. Agarre prono sobre barra.", cal: 32, type: "Espalda", unit: "Series de 8", baseVal: 4 },
        { name: "Remo a un Brazo", desc: "~0.5 cal/rep. Cada lado.", cal: 24, type: "Espalda", unit: "Series de 12", baseVal: 4 },
        { name: "Superman en Suelo", desc: "~0.3 cal/rep. Extensión lumbar.", cal: 20, type: "Espalda", unit: "Series de 15", baseVal: 4 },
        { name: "Press Militar con Mancuernas", desc: "~0.5 cal/rep. Hombro enfocado.", cal: 20, type: "Hombros", unit: "Series de 10", baseVal: 4 },
        { name: "Aperturas Laterales", desc: "~0.3 cal/rep. Sin balanceo.", cal: 20, type: "Hombros", unit: "Series de 15", baseVal: 4 },
        { name: "Face Pulls con Banda/Pesa", desc: "~0.3 cal/rep. Postura y hombro posterior.", cal: 24, type: "Hombros", unit: "Series de 20", baseVal: 4 },
        // === BÍCEPS / TRÍCEPS ===
        { name: "Curl de Bíceps", desc: "~0.4 cal/rep. Control de bajada.", cal: 19, type: "Bíceps", unit: "Series de 12", baseVal: 4 },
        { name: "Curl Martillo", desc: "~0.4 cal/rep. Antebrazo activo.", cal: 19, type: "Bíceps", unit: "Series de 12", baseVal: 4 },
        { name: "Fondos en Silla/Banco (Dips)", desc: "~0.8 cal/rep. Tríceps completo.", cal: 40, type: "Tríceps", unit: "Series de 12", baseVal: 4 },
        { name: "Patada de Tríceps", desc: "~0.3 cal/rep. Codo fijo.", cal: 20, type: "Tríceps", unit: "Series de 15", baseVal: 4 },
        { name: "Copa de Tríceps (Overhead)", desc: "~0.4 cal/rep. Extensión atrás.", cal: 19, type: "Tríceps", unit: "Series de 12", baseVal: 4 },
        // === CORE ===
        { name: "Plancha Abdominal", desc: "~5 cal/min. Activa core completo.", cal: 20, type: "Core", unit: "Minutos", baseVal: 4 },
        { name: "Abdominales Crunch", desc: "~0.3 cal/rep. Ombligo hacia adentro.", cal: 30, type: "Core", unit: "Series de 25", baseVal: 4 },
        { name: "Tijeras (Leg Raises)", desc: "~0.5 cal/rep. Lumbares en suelo.", cal: 40, type: "Core", unit: "Series de 20", baseVal: 4 },
        { name: "Russian Twists", desc: "~0.4 cal/rep. Rotación con o sin peso.", cal: 32, type: "Core", unit: "Series de 20", baseVal: 4 },
        // === CALISTENIA (reclasificados a su músculo) ===
        { name: "Dips en Paralelas", desc: "~1 cal/rep. Pecho + Tríceps.", cal: 40, type: "Tríceps", unit: "Series de 10", baseVal: 4 },
        { name: "Pike Push-ups", desc: "~0.6 cal/rep. Hombro calistenia.", cal: 24, type: "Hombros", unit: "Series de 10", baseVal: 4 },
        // === PREPARACIÓN CARRERA ===
        { name: "Intervalos HIIT (Sprints)", desc: "20 seg sprint / 40 seg descanso. Ritmo activo ~18 cal/min; promedio real con descansos ~12 cal/min.", cal: 180, type: "Carrera", unit: "Minutos totales", baseVal: 15 },
        { name: "Fartlek (Correr libre)", desc: "Alternancia libre de velocidad. ~12 cal/min.", cal: 240, type: "Carrera", unit: "Minutos", baseVal: 20 },
        // === ESPALDA (ampliación v5.26) ===
        { name: "Remo con Barra", desc: "~0.7 cal/rep. Torso a 45°, espalda recta.", cal: 34, type: "Espalda", unit: "Series de 12", baseVal: 4 },
        { name: "Jalón al Pecho (Polea)", desc: "~0.6 cal/rep. Agarre abierto, pecho arriba.", cal: 29, type: "Espalda", unit: "Series de 12", baseVal: 4 },
        { name: "Remo en Polea Baja", desc: "~0.6 cal/rep. Codos pegados al cuerpo.", cal: 29, type: "Espalda", unit: "Series de 12", baseVal: 4 },
        { name: "Peso Muerto Convencional", desc: "~1 cal/rep. Cadera y espalda completa.", cal: 32, type: "Espalda", unit: "Series de 8", baseVal: 4 },
        { name: "Pullover con Mancuerna", desc: "~0.5 cal/rep. Dorsal y serrato.", cal: 24, type: "Espalda", unit: "Series de 12", baseVal: 4 },
        { name: "Hiperextensiones Lumbares", desc: "~0.4 cal/rep. Banco romano o suelo.", cal: 24, type: "Espalda", unit: "Series de 15", baseVal: 4 },
        { name: "Remo Invertido en Barra", desc: "~0.7 cal/rep. Cuerpo recto bajo la barra.", cal: 28, type: "Espalda", unit: "Series de 10", baseVal: 4 },
        { name: "Encogimientos de Trapecio", desc: "~0.3 cal/rep. Hombros a las orejas, pausa arriba.", cal: 18, type: "Espalda", unit: "Series de 15", baseVal: 4 },
        // === PECHO (ampliación) ===
        { name: "Press de Banca con Barra", desc: "~0.7 cal/rep. Escápulas retraídas.", cal: 28, type: "Pecho", unit: "Series de 10", baseVal: 4 },
        { name: "Press Inclinado", desc: "~0.7 cal/rep. Pecho superior.", cal: 28, type: "Pecho", unit: "Series de 10", baseVal: 4 },
        { name: "Aperturas con Mancuernas", desc: "~0.4 cal/rep. Codos semiflexionados.", cal: 19, type: "Pecho", unit: "Series de 12", baseVal: 4 },
        { name: "Fondos para Pecho", desc: "~1 cal/rep. Torso inclinado al frente.", cal: 40, type: "Pecho", unit: "Series de 10", baseVal: 4 },
        { name: "Press en Máquina (Pecho)", desc: "~0.6 cal/rep. Control total del recorrido.", cal: 29, type: "Pecho", unit: "Series de 12", baseVal: 4 },
        { name: "Flexiones Diamante", desc: "~0.6 cal/rep. Manos juntas, pecho interno y tríceps.", cal: 29, type: "Pecho", unit: "Series de 12", baseVal: 4 },
        // === HOMBRO (ampliación) ===
        { name: "Elevaciones Frontales", desc: "~0.3 cal/rep. Hombro anterior, sin impulso.", cal: 20, type: "Hombros", unit: "Series de 15", baseVal: 4 },
        { name: "Pájaros (Hombro Posterior)", desc: "~0.3 cal/rep. Inclinado, brazos abiertos.", cal: 20, type: "Hombros", unit: "Series de 15", baseVal: 4 },
        { name: "Press Arnold", desc: "~0.5 cal/rep. Giro completo de muñeca.", cal: 20, type: "Hombros", unit: "Series de 10", baseVal: 4 },
        { name: "Remo al Mentón", desc: "~0.4 cal/rep. Codos por encima de las manos.", cal: 19, type: "Hombros", unit: "Series de 12", baseVal: 4 },
        { name: "Toques de Hombro en Plancha", desc: "~0.4 cal/rep. Core firme, sin balanceo.", cal: 32, type: "Hombros", unit: "Series de 20", baseVal: 4 },
        // === BÍCEPS (ampliación) ===
        { name: "Curl con Barra", desc: "~0.5 cal/rep. Codos fijos al costado.", cal: 24, type: "Bíceps", unit: "Series de 12", baseVal: 4 },
        { name: "Curl Concentrado", desc: "~0.3 cal/rep. Codo apoyado en el muslo.", cal: 14, type: "Bíceps", unit: "Series de 12", baseVal: 4 },
        { name: "Curl Predicador", desc: "~0.4 cal/rep. Banco Scott, estiramiento completo.", cal: 19, type: "Bíceps", unit: "Series de 12", baseVal: 4 },
        // === TRÍCEPS (ampliación) ===
        { name: "Press Francés", desc: "~0.4 cal/rep. Barra Z a la frente.", cal: 19, type: "Tríceps", unit: "Series de 12", baseVal: 4 },
        { name: "Extensión de Tríceps en Polea", desc: "~0.4 cal/rep. Codos pegados.", cal: 25, type: "Tríceps", unit: "Series de 15", baseVal: 4 },
        { name: "Press Cerrado en Banca", desc: "~0.6 cal/rep. Manos al ancho de hombros.", cal: 24, type: "Tríceps", unit: "Series de 10", baseVal: 4 },
        // === ANTEBRAZO (v5.27 — antes no existía ningún ejercicio de este tipo) ===
        { name: "Curl de Muñeca con Barra", desc: "~0.2 cal/rep. Antebrazo apoyado, solo mueve la muñeca.", cal: 12, type: "Antebrazo", unit: "Series de 15", baseVal: 4 },
        { name: "Curl de Muñeca Inverso (Agarre Prono)", desc: "~0.2 cal/rep. Extensor del antebrazo.", cal: 12, type: "Antebrazo", unit: "Series de 15", baseVal: 4 },
        { name: "Extensión de Muñeca con Mancuerna", desc: "~0.15 cal/rep. Movimiento lento y controlado.", cal: 9, type: "Antebrazo", unit: "Series de 15", baseVal: 4 },
        { name: "Rodillo de Muñeca (Wrist Roller)", desc: "~0.3 cal/rep. Enrolla y desenrolla la cuerda con peso.", cal: 12, type: "Antebrazo", unit: "Series de 10", baseVal: 4 },
        { name: "Paseo del Granjero (Farmer's Walk)", desc: "Carga pesada en ambas manos. Quema ~7 cal/min.", cal: 35, type: "Antebrazo", unit: "Minutos", baseVal: 5 },
        // === PIERNA (ampliación) ===
        { name: "Prensa de Pierna", desc: "~0.8 cal/rep. Sin bloquear rodillas arriba.", cal: 38, type: "Pierna", unit: "Series de 12", baseVal: 4 },
        { name: "Extensiones de Cuádriceps", desc: "~0.4 cal/rep. Pausa de 1 seg arriba.", cal: 24, type: "Pierna", unit: "Series de 15", baseVal: 4 },
        { name: "Curl Femoral", desc: "~0.4 cal/rep. Acostado o sentado en máquina.", cal: 19, type: "Pierna", unit: "Series de 12", baseVal: 4 },
        { name: "Sentadilla Búlgara", desc: "~0.7 cal/rep por pierna. Pie trasero en banco.", cal: 28, type: "Pierna", unit: "Series de 10", baseVal: 4 },
        { name: "Hack Squat", desc: "~0.8 cal/rep. Espalda pegada al respaldo.", cal: 38, type: "Pierna", unit: "Series de 12", baseVal: 4 },
        { name: "Zancadas Caminando", desc: "~0.7 cal/rep. Paso largo, rodilla al suelo.", cal: 50, type: "Pierna", unit: "Series de 20", baseVal: 4 },
        { name: "Aductores en Máquina", desc: "~0.3 cal/rep. Cierre controlado.", cal: 18, type: "Pierna", unit: "Series de 15", baseVal: 4 },
        { name: "Elevación de Talones Sentado", desc: "~0.3 cal/rep. Sóleo, pausa arriba.", cal: 25, type: "Pantorrilla", unit: "Series de 20", baseVal: 4 },
        // === GLÚTEO (ampliación) ===
        { name: "Peso Muerto Rumano a 1 Pierna", desc: "~0.6 cal/rep. Equilibrio y glúteo medio.", cal: 24, type: "Glúteo", unit: "Series de 10", baseVal: 4 },
        { name: "Abducción en Máquina", desc: "~0.3 cal/rep. Apertura con pausa.", cal: 18, type: "Glúteo", unit: "Series de 15", baseVal: 4 },
        { name: "Frog Pumps", desc: "~0.4 cal/rep. Plantas de pies juntas.", cal: 32, type: "Glúteo", unit: "Series de 20", baseVal: 4 },
        { name: "Subidas al Banco (Step-ups)", desc: "~0.6 cal/rep por pierna. Empuja con el talón.", cal: 29, type: "Glúteo", unit: "Series de 12", baseVal: 4 },
        // === CORE (ampliación) ===
        { name: "Plancha Lateral", desc: "~4 cal/min por lado. Cadera arriba.", cal: 16, type: "Core", unit: "Minutos", baseVal: 4 },
        { name: "Rueda Abdominal (Ab Wheel)", desc: "~0.8 cal/rep. Extensión sin arquear lumbar.", cal: 32, type: "Core", unit: "Series de 10", baseVal: 4 },
        { name: "Elevaciones de Piernas Colgado", desc: "~0.7 cal/rep. Sin balanceo.", cal: 28, type: "Core", unit: "Series de 10", baseVal: 4 },
        { name: "Crunch en Polea Alta", desc: "~0.4 cal/rep. Enrolla la columna.", cal: 24, type: "Core", unit: "Series de 15", baseVal: 4 },
        { name: "Dead Bug", desc: "~0.3 cal/rep. Lumbar pegada al suelo.", cal: 24, type: "Core", unit: "Series de 20", baseVal: 4 },
        // === CARDIO (ampliación) ===
        { name: "Elíptica", desc: "Ritmo moderado. Quema ~9 cal/min (90kg).", cal: 270, type: "Cardio", unit: "Minutos", baseVal: 30 },
        { name: "Remo en Máquina (Ergómetro)", desc: "Cuerpo completo. ~11 cal/min.", cal: 220, type: "Cardio", unit: "Minutos", baseVal: 20 },
        { name: "Escalera (StairMaster)", desc: "Sube sin apoyarte de más. ~10 cal/min.", cal: 200, type: "Cardio", unit: "Minutos", baseVal: 20 },
        { name: "Spinning / Bici Indoor", desc: "Clase o libre. ~11 cal/min.", cal: 330, type: "Cardio", unit: "Minutos", baseVal: 30 },
        { name: "Caminadora con Inclinación 12%", desc: "6 km/h con inclinación. ~9 cal/min.", cal: 270, type: "Cardio", unit: "Minutos", baseVal: 30 },
        // === HIIT (ampliación) ===
        { name: "Box Jumps", desc: "~1 cal/salto. Aterriza suave.", cal: 48, type: "HIIT", unit: "Series de 12", baseVal: 4 },
        { name: "Wall Balls", desc: "~0.8 cal/rep. Sentadilla + lanzamiento.", cal: 50, type: "HIIT", unit: "Series de 15", baseVal: 4 },
        { name: "Thrusters", desc: "~1 cal/rep. Sentadilla frontal + press.", cal: 48, type: "HIIT", unit: "Series de 12", baseVal: 4 },
        { name: "Ball Slams", desc: "~0.8 cal/rep. Azota el balón con todo.", cal: 45, type: "HIIT", unit: "Series de 15", baseVal: 4 }
    ],
    emergency_food: {
        "tacos al pastor": { cal_per_unit: 150, recommendation: "Max 3-4 si saltas una comida. Compensa con 20 min extra de burpees. Ponle mucha salsa y limón." },
        "pizza": { cal_per_slice: 280, recommendation: "Solo 1 rebanada. Compensar con 30 min de trote." }
    }
};

const NUTRITION_ADVANCES = [
    "Descubrimiento 2026: El consumo de fibra antes de la proteína reduce el pico de glucosa en un 30%.",
    "Estudio Vanguardia: La exposición al frío (ducha fría) después del entrenamiento acelera la oxidación de grasa parda en hombres de +35 años.",
    "Traders Hint: Mantener la hidratación con electrolitos mejora la toma de decisiones bajo estrés financiero.",
    "Investigación MIT: Caminatas cortas de 5 min después de cada comida estabilizan insulina mejor que una larga caminata matinal.",
    "Science 2026: El descanso activo (caminar despacio) quema 15% más lípidos que descansar totalmente entre series de pesas."
];

/**
 * ================================================================
 * SISTEMA DE PLANES Y CÓDIGOS DE GIMNASIO
 * ================================================================
 * 
 * PLANES DISPONIBLES:
 *   BÁSICO   → $1,500 MXN/mes → Hasta 50 usuarios
 *   ESTÁNDAR → $2,000 MXN/mes → Hasta 100 usuarios
 *   PREMIUM  → $3,000 MXN/mes → Hasta 200 usuarios
 * 
 * Los códigos se generan AUTOMÁTICAMENTE desde el Panel Admin (admin.html).
 * Arthur NO necesita tocar este archivo para nada.
 * 
 * El sistema funciona así:
 *   1. Arthur abre admin.html → Crea un Bloque → Asigna Gimnasio
 *   2. Al asignar, elige el PLAN (Básico/Estándar/Premium)
 *   3. El código se genera automáticamente (Ej: AXV-K8M2)
 *   4. Ese código se guarda en localStorage del admin Y en GYM_CODES
 *   5. El usuario final ingresa ese código al registrarse
 *   6. El sistema valida: ¿código existe? ¿cuántos usuarios tiene? ¿supera el límite del plan?
 * ================================================================
 */

// Planes de negocio
const AX_PLANS = {
    basico:   { name: "BÁSICO",   price: 1500, maxUsers: 50,  color: "#00ff88" },
    estandar: { name: "ESTÁNDAR", price: 2000, maxUsers: 100, color: "#00d4ff" },
    premium:  { name: "PREMIUM",  price: 3000, maxUsers: 200, color: "#ffd700" }
};

/**
 * GYM_CODES se carga DINÁMICAMENTE desde localStorage (admin genera los códigos).
 * Se mantiene AXV-DEMO como código de prueba manual.
 */
const GYM_CODES_STATIC = {
    "AXV-DEMO": { plan: "basico", active: true },
    "AX-BOSS1": { plan: "estandar", active: true },
    "AX-BOSS2": { plan: "premium", active: true }
};

// Cargar códigos dinámicos del Admin
function loadGymCodes() {
    const adminRaw = localStorage.getItem('arthur_admin_blocks_data');
    const dynamicCodes = {};
    
    if (adminRaw) {
        try {
            const adminData = JSON.parse(adminRaw);
            if (adminData.gyms && Array.isArray(adminData.gyms)) {
                adminData.gyms.forEach(gym => {
                    if (gym.gymCode && gym.active !== false) {
                        dynamicCodes[gym.gymCode] = {
                            plan: gym.plan || "basico",
                            active: gym.active !== false,
                            maxUsers: gym.maxUsers || AX_PLANS[gym.plan || "basico"].maxUsers,
                            gymName: gym.name || "Sin nombre"
                        };
                    }
                });
            }
        } catch(e) { console.error("Error cargando códigos dinámicos:", e); }
    }
    
    return { ...GYM_CODES_STATIC, ...dynamicCodes };
}

// Contar usuarios registrados con un código específico
function countUsersWithCode(code) {
    let count = 0;
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith('arthur_data_')) {
            try {
                const data = JSON.parse(localStorage.getItem(key));
                if (data.gymCode === code) count++;
            } catch(e) {}
        }
    }
    return count;
}





// Base de datos estática 70/30 generada automáticamente
const FOOD_DATABASE = [
  { name: "pollo_pechuga", cal: 165, p: 31, c: 0, f: 3.6 },
  { name: "res_magro", cal: 250, p: 26, c: 0, f: 15 },
  { name: "cerdo", cal: 242, p: 27, c: 0, f: 14 },
  { name: "atun", cal: 132, p: 28, c: 0, f: 1 },
  { name: "salmon", cal: 208, p: 20, c: 0, f: 13 },
  { name: "huevo", cal: 155, p: 13, c: 1, f: 11 },
  { name: "claras_huevo", cal: 52, p: 11, c: 0.7, f: 0.2 },
  { name: "jamon", cal: 145, p: 21, c: 1.5, f: 6 },
  { name: "pavo", cal: 135, p: 29, c: 0, f: 1 },
  { name: "queso_panela", cal: 200, p: 18, c: 2, f: 15 },
  { name: "arroz_blanco", cal: 130, p: 2.7, c: 28, f: 0.3 },
  { name: "arroz_integral", cal: 111, p: 2.6, c: 23, f: 0.9 },
  { name: "pasta", cal: 131, p: 5, c: 25, f: 1.1 },
  { name: "pan_blanco", cal: 265, p: 9, c: 49, f: 3.2 },
  { name: "pan_integral", cal: 247, p: 13, c: 41, f: 4.2 },
  { name: "tortilla_maiz", cal: 218, p: 6, c: 45, f: 2.8 },
  { name: "tortilla_harina", cal: 304, p: 8, c: 50, f: 8 },
  { name: "avena", cal: 389, p: 17, c: 66, f: 7 },
  { name: "quinoa", cal: 120, p: 4, c: 21, f: 2 },
  { name: "papa", cal: 77, p: 2, c: 17, f: 0.1 },
  { name: "aceite_oliva", cal: 884, p: 0, c: 0, f: 100 },
  { name: "mantequilla", cal: 717, p: 1, c: 0, f: 81 },
  { name: "mayonesa", cal: 680, p: 1, c: 0, f: 75 },
  { name: "aguacate", cal: 160, p: 2, c: 9, f: 15 },
  { name: "nueces", cal: 654, p: 15, c: 14, f: 65 },
  { name: "almendras", cal: 579, p: 21, c: 22, f: 50 },
  { name: "cacahuate", cal: 567, p: 26, c: 16, f: 49 },
  { name: "manzana", cal: 52, p: 0.3, c: 14, f: 0.2 },
  { name: "platano", cal: 89, p: 1.1, c: 23, f: 0.3 },
  { name: "naranja", cal: 47, p: 0.9, c: 12, f: 0.1 },
  { name: "fresa", cal: 32, p: 0.7, c: 8, f: 0.3 },
  { name: "piña", cal: 50, p: 0.5, c: 13, f: 0.1 },
  { name: "mango", cal: 60, p: 0.8, c: 15, f: 0.4 },
  { name: "sandia", cal: 30, p: 0.6, c: 8, f: 0.2 },
  { name: "pera", cal: 57, p: 0.4, c: 15, f: 0.1 },
  { name: "brocoli", cal: 34, p: 2.8, c: 7, f: 0.4 },
  { name: "espinaca", cal: 23, p: 2.9, c: 3.6, f: 0.4 },
  { name: "lechuga", cal: 15, p: 1.4, c: 2.9, f: 0.2 },
  { name: "zanahoria", cal: 41, p: 0.9, c: 10, f: 0.2 },
  { name: "pepino", cal: 16, p: 0.7, c: 4, f: 0.1 },
  { name: "jitomate", cal: 18, p: 0.9, c: 3.9, f: 0.2 },
  { name: "cebolla", cal: 40, p: 1.1, c: 9, f: 0.1 },
  { name: "calabaza", cal: 17, p: 1.2, c: 3, f: 0.3 },
  { name: "pizza", cal: 266, p: 11, c: 33, f: 10 },
  { name: "hamburguesa", cal: 295, p: 17, c: 30, f: 14 },
  { name: "tacos", cal: 226, p: 9, c: 25, f: 10 },
  { name: "tamal", cal: 180, p: 4, c: 30, f: 5 },
  { name: "pan_dulce", cal: 300, p: 5, c: 50, f: 10 },
  { name: "galletas", cal: 502, p: 6, c: 64, f: 24 },
  { name: "refresco", cal: 42, p: 0, c: 11, f: 0 },
  { name: "cerveza", cal: 43, p: 0.5, c: 3.6, f: 0 },
  { name: "pechuga de pollo a la plancha 100g", cal: 165, p: 31, c: 0, f: 3.6 },
  { name: "pechuga de pollo hervida 100g", cal: 158, p: 30, c: 0, f: 3.2 },
  { name: "muslo de pollo con piel 100g", cal: 209, p: 26, c: 0, f: 11 },
  { name: "muslo de pollo sin piel 100g", cal: 179, p: 25, c: 0, f: 8 },
  { name: "pollo entero asado 100g", cal: 239, p: 27, c: 0, f: 14 },
  { name: "milanesa de pollo empanizada 100g", cal: 260, p: 24, c: 12, f: 12 },
  { name: "nuggets de pollo 6 piezas", cal: 280, p: 15, c: 18, f: 17 },
  { name: "carne molida res 90% magra 100g", cal: 218, p: 26, c: 0, f: 12 },
  { name: "carne molida res 80% grasa 100g", cal: 254, p: 24, c: 0, f: 17 },
  { name: "bistec de res a la plancha 100g", cal: 217, p: 26, c: 0, f: 12 },
  { name: "filete de res 100g", cal: 271, p: 26, c: 0, f: 18 },
  { name: "costilla de res 100g", cal: 292, p: 22, c: 0, f: 22 },
  { name: "arrachera 100g", cal: 244, p: 26, c: 0, f: 15 },
  { name: "suadero 100g", cal: 310, p: 20, c: 0, f: 25 },
  { name: "cecina de res 100g", cal: 295, p: 28, c: 0, f: 20 },
  { name: "milanesa de res 100g", cal: 280, p: 25, c: 11, f: 14 },
  { name: "atun en agua escurrido 1 lata 140g", cal: 130, p: 29, c: 0, f: 1 },
  { name: "atun en aceite escurrido 1 lata 140g", cal: 225, p: 28, c: 0, f: 13 },
  { name: "salmon a la plancha 100g", cal: 208, p: 28, c: 0, f: 10 },
  { name: "salmon ahumado 100g", cal: 172, p: 26, c: 0, f: 7 },
  { name: "tilapia a la plancha 100g", cal: 128, p: 26, c: 0, f: 3 },
  { name: "sardinas en lata escurridas 100g", cal: 208, p: 25, c: 0, f: 11 },
  { name: "camaron cocido 100g", cal: 99, p: 21, c: 0, f: 1 },
  { name: "camaron empanizado 100g", cal: 229, p: 15, c: 14, f: 12 },
  { name: "huevo entero grande 1 pieza", cal: 78, p: 6, c: 0, f: 5 },
  { name: "clara de huevo 1 pieza", cal: 17, p: 4, c: 0, f: 0 },
  { name: "huevo revuelto con aceite 2 piezas", cal: 200, p: 12, c: 1, f: 16 },
  { name: "huevo estrellado con aceite 2 piezas", cal: 185, p: 12, c: 0, f: 15 },
  { name: "huevo cocido 2 piezas", cal: 155, p: 13, c: 1, f: 11 },
  { name: "omelette 2 huevos sin relleno", cal: 150, p: 12, c: 1, f: 11 },
  { name: "tocino de res 2 tiras", cal: 86, p: 6, c: 0, f: 7 },
  { name: "jamon de pavo 2 rebanadas", cal: 60, p: 9, c: 1, f: 2 },
  { name: "jamon de cerdo 2 rebanadas", cal: 80, p: 8, c: 1, f: 5 },
  { name: "salchicha de pavo 1 pieza", cal: 45, p: 5, c: 1, f: 2 },
  { name: "salchicha de cerdo 1 pieza", cal: 90, p: 4, c: 1, f: 8 },
  { name: "chorizo de cerdo cocido 50g", cal: 196, p: 9, c: 2, f: 17 },
  { name: "chorizo de res cocido 50g", cal: 165, p: 10, c: 2, f: 13 },
  { name: "longaniza cocida 100g", cal: 285, p: 16, c: 3, f: 23 },
  { name: "maciza de cerdo 100g", cal: 242, p: 27, c: 0, f: 15 },
  { name: "lomo de cerdo a la plancha 100g", cal: 212, p: 29, c: 0, f: 10 },
  { name: "carnitas 100g", cal: 300, p: 25, c: 0, f: 22 },
  { name: "barbacoa de res 100g", cal: 218, p: 28, c: 0, f: 11 },
  { name: "barbacoa de borrego 100g", cal: 232, p: 27, c: 0, f: 13 },
  { name: "birria de res 100g", cal: 210, p: 26, c: 3, f: 10 },
  { name: "cochinita pibil 100g", cal: 225, p: 22, c: 4, f: 13 },
  { name: "pastor con grasa 100g", cal: 264, p: 22, c: 4, f: 18 },
  { name: "pastor sin grasa 100g", cal: 210, p: 24, c: 4, f: 11 },
  { name: "lengua de res guisada 100g", cal: 252, p: 22, c: 0, f: 18 },
  { name: "higado de res 100g", cal: 175, p: 27, c: 4, f: 5 },
  { name: "pollo en salsa verde 100g", cal: 180, p: 22, c: 5, f: 7 },
  { name: "pollo en mole rojo 100g", cal: 235, p: 20, c: 8, f: 13 },
  { name: "leche entera 1 vaso 240ml", cal: 149, p: 8, c: 12, f: 8 },
  { name: "leche descremada 1 vaso 240ml", cal: 83, p: 8, c: 12, f: 0 },
  { name: "leche deslactosada entera 1 vaso", cal: 149, p: 8, c: 12, f: 8 },
  { name: "leche de almendras sin azucar 1 vaso", cal: 30, p: 1, c: 1, f: 3 },
  { name: "leche de soya sin azucar 1 vaso", cal: 80, p: 7, c: 4, f: 4 },
  { name: "yogur griego natural 0% 170g", cal: 100, p: 17, c: 6, f: 0 },
  { name: "yogur griego natural entero 170g", cal: 150, p: 15, c: 6, f: 7 },
  { name: "yogur natural endulzado 150g", cal: 140, p: 6, c: 22, f: 3 },
  { name: "yogur de sabores 150g", cal: 150, p: 5, c: 25, f: 3 },
  { name: "queso cottage 100g", cal: 98, p: 11, c: 3, f: 4 },
  { name: "queso panela 100g", cal: 263, p: 19, c: 3, f: 19 },
  { name: "queso fresco 100g", cal: 264, p: 17, c: 2, f: 21 },
  { name: "queso oaxaca 100g", cal: 357, p: 26, c: 2, f: 27 },
  { name: "queso manchego 100g", cal: 375, p: 25, c: 1, f: 30 },
  { name: "queso amarillo rebanada 1 pieza", cal: 80, p: 4, c: 1, f: 6 },
  { name: "queso crema 30g", cal: 99, p: 2, c: 1, f: 10 },
  { name: "requesón 100g", cal: 136, p: 12, c: 5, f: 7 },
  { name: "crema agria 2 cucharadas", cal: 61, p: 1, c: 1, f: 6 },
  { name: "mantequilla 1 cucharadita 5g", cal: 34, p: 0, c: 0, f: 4 },
  { name: "proteina whey en polvo 1 scoop 30g", cal: 120, p: 24, c: 3, f: 2 },
  { name: "proteina caseina en polvo 1 scoop 30g", cal: 110, p: 22, c: 4, f: 1 },
  { name: "proteina de soya en polvo 1 scoop 30g", cal: 100, p: 20, c: 4, f: 2 },
  { name: "frijoles negros cocidos 1 taza", cal: 227, p: 15, c: 41, f: 1 },
  { name: "frijoles pintos cocidos 1 taza", cal: 245, p: 15, c: 45, f: 1 },
  { name: "frijoles refritos con manteca 1 taza", cal: 334, p: 13, c: 46, f: 12 },
  { name: "frijoles refritos sin grasa 1 taza", cal: 240, p: 13, c: 44, f: 2 },
  { name: "lentejas cocidas 1 taza", cal: 230, p: 18, c: 40, f: 1 },
  { name: "garbanzos cocidos 1 taza", cal: 269, p: 15, c: 45, f: 4 },
  { name: "habas cocidas 1 taza", cal: 187, p: 13, c: 33, f: 1 },
  { name: "soya texturizada seca 100g", cal: 327, p: 52, c: 26, f: 1 },
  { name: "edamame cocido 1 taza", cal: 188, p: 17, c: 14, f: 8 },
  { name: "chicharo cocido 1 taza", cal: 134, p: 9, c: 25, f: 0 },
  { name: "jicama cruda 1 taza", cal: 46, p: 1, c: 11, f: 0 },
  { name: "tofu firme 100g", cal: 76, p: 8, c: 2, f: 4 },
  { name: "arroz blanco cocido 1 taza", cal: 206, p: 4, c: 45, f: 0 },
  { name: "arroz integral cocido 1 taza", cal: 216, p: 5, c: 45, f: 2 },
  { name: "arroz con leche casero 1 taza", cal: 320, p: 7, c: 58, f: 8 },
  { name: "pasta cocida sin salsa 1 taza", cal: 220, p: 8, c: 43, f: 1 },
  { name: "pasta con salsa de tomate 1 taza", cal: 290, p: 10, c: 52, f: 5 },
  { name: "avena cruda 1/2 taza", cal: 150, p: 5, c: 27, f: 3 },
  { name: "avena cocida en agua 1 taza", cal: 158, p: 6, c: 28, f: 3 },
  { name: "avena con leche entera 1 taza", cal: 280, p: 11, c: 38, f: 9 },
  { name: "pan blanco de caja 1 rebanada", cal: 79, p: 3, c: 15, f: 1 },
  { name: "pan integral de caja 1 rebanada", cal: 69, p: 3, c: 12, f: 1 },
  { name: "pan de dulce concha grande", cal: 310, p: 6, c: 52, f: 9 },
  { name: "pan de dulce cuernito", cal: 280, p: 5, c: 44, f: 10 },
  { name: "pan de dulce polvoron", cal: 160, p: 2, c: 20, f: 8 },
  { name: "pan para hamburguesa 1 pieza", cal: 120, p: 4, c: 22, f: 2 },
  { name: "pan para hotdog 1 pieza", cal: 110, p: 4, c: 20, f: 2 },
  { name: "tortilla de maiz 1 pieza", cal: 52, p: 1, c: 11, f: 1 },
  { name: "tortilla de harina chica 1 pieza", cal: 95, p: 3, c: 16, f: 2 },
  { name: "tortilla de harina grande 1 pieza", cal: 146, p: 4, c: 25, f: 3 },
  { name: "tostada horneada 1 pieza", cal: 60, p: 1, c: 12, f: 1 },
  { name: "tostada frita 1 pieza", cal: 80, p: 1, c: 11, f: 4 },
  { name: "totopo 10 piezas", cal: 130, p: 2, c: 18, f: 6 },
  { name: "galleta salada 5 piezas", cal: 65, p: 1, c: 11, f: 2 },
  { name: "galleta maria 5 piezas", cal: 100, p: 2, c: 17, f: 3 },
  { name: "galleta de avena 3 piezas", cal: 160, p: 3, c: 24, f: 6 },
  { name: "cereal corn flakes 1 taza", cal: 100, p: 2, c: 24, f: 0 },
  { name: "cereal granola 1/2 taza", cal: 300, p: 8, c: 44, f: 11 },
  { name: "cereal avena tostada 1 taza", cal: 110, p: 3, c: 22, f: 2 },
  { name: "tamale de elote 1 pieza", cal: 220, p: 4, c: 36, f: 7 },
  { name: "tamale de rajas 1 pieza", cal: 280, p: 6, c: 38, f: 11 },
  { name: "tamale de pollo 1 pieza", cal: 310, p: 14, c: 36, f: 12 },
  { name: "quesadilla tortilla maiz con queso", cal: 280, p: 12, c: 26, f: 14 },
  { name: "sope sin guarnicion 1 pieza", cal: 130, p: 3, c: 22, f: 4 },
  { name: "tlayuda sin guarnicion 1 pieza", cal: 200, p: 5, c: 38, f: 4 },
  { name: "elote cocido 1 pieza", cal: 100, p: 3, c: 22, f: 1 },
  { name: "elote en vaso con mayonesa y queso", cal: 350, p: 7, c: 40, f: 18 },
  { name: "esquite 1 vaso mediano", cal: 300, p: 6, c: 42, f: 13 },
  { name: "pozole rojo con guarnicion 1 plato", cal: 450, p: 28, c: 52, f: 12 },
  { name: "menudo 1 plato mediano", cal: 300, p: 24, c: 20, f: 13 },
  { name: "papa cocida mediana", cal: 130, p: 3, c: 30, f: 0 },
  { name: "papa al horno mediana", cal: 161, p: 4, c: 37, f: 0 },
  { name: "papa frita en casa 100g", cal: 312, p: 3, c: 41, f: 15 },
  { name: "papa a la francesa restaurante 100g", cal: 365, p: 4, c: 48, f: 17 },
  { name: "camote cocido 1 taza", cal: 180, p: 4, c: 41, f: 0 },
  { name: "camote al horno 1 taza", cal: 180, p: 4, c: 41, f: 0 },
  { name: "yuca cocida 100g", cal: 160, p: 1, c: 38, f: 0 },
  { name: "platano macho frito 2 rebanadas", cal: 180, p: 1, c: 32, f: 6 },
  { name: "platano macho hervido 100g", cal: 116, p: 1, c: 28, f: 0 },
  { name: "manzana mediana", cal: 95, p: 0, c: 25, f: 0 },
  { name: "pera mediana", cal: 101, p: 1, c: 27, f: 0 },
  { name: "platano mediano", cal: 105, p: 1, c: 27, f: 0 },
  { name: "platano pequeño", cal: 80, p: 1, c: 21, f: 0 },
  { name: "naranja mediana", cal: 62, p: 1, c: 15, f: 0 },
  { name: "mandarina mediana", cal: 47, p: 1, c: 12, f: 0 },
  { name: "toronja mitad", cal: 52, p: 1, c: 13, f: 0 },
  { name: "limon 1 pieza", cal: 11, p: 0, c: 3, f: 0 },
  { name: "lima 1 pieza", cal: 20, p: 0, c: 7, f: 0 },
  { name: "fresa 1 taza", cal: 49, p: 1, c: 12, f: 0 },
  { name: "sandia 1 taza en cubos", cal: 46, p: 1, c: 11, f: 0 },
  { name: "melon cantaloupe 1 taza", cal: 60, p: 1, c: 14, f: 0 },
  { name: "mango manila mediano", cal: 107, p: 1, c: 28, f: 0 },
  { name: "mango petacon mediano", cal: 135, p: 1, c: 35, f: 1 },
  { name: "papaya 1 taza en cubos", cal: 55, p: 1, c: 14, f: 0 },
  { name: "piña 1 taza en cubos", cal: 83, p: 1, c: 22, f: 0 },
  { name: "kiwi 1 pieza mediana", cal: 42, p: 1, c: 10, f: 0 },
  { name: "uva 1 taza", cal: 104, p: 1, c: 27, f: 0 },
  { name: "durazno mediano", cal: 58, p: 1, c: 14, f: 0 },
  { name: "ciruela mediana", cal: 30, p: 0, c: 8, f: 0 },
  { name: "chabacano mediano", cal: 17, p: 0, c: 4, f: 0 },
  { name: "guayaba mediana", cal: 37, p: 1, c: 8, f: 0 },
  { name: "tejocote 3 piezas", cal: 45, p: 0, c: 11, f: 0 },
  { name: "tamarindo natural 50g", cal: 115, p: 1, c: 30, f: 0 },
  { name: "tuna mediana", cal: 35, p: 1, c: 8, f: 0 },
  { name: "higo fresco mediano", cal: 37, p: 0, c: 10, f: 0 },
  { name: "coco fresco 100g", cal: 354, p: 3, c: 15, f: 33 },
  { name: "aguacate mediano entero", cal: 240, p: 3, c: 13, f: 22 },
  { name: "aguacate 1/2 pieza", cal: 120, p: 1, c: 6, f: 11 },
  { name: "aguacate 1/4 de pieza", cal: 60, p: 1, c: 3, f: 5 },
  { name: "brocoli cocido 1 taza", cal: 55, p: 4, c: 11, f: 1 },
  { name: "coliflor cocida 1 taza", cal: 29, p: 2, c: 5, f: 0 },
  { name: "espinaca cruda 1 taza", cal: 7, p: 1, c: 1, f: 0 },
  { name: "espinaca cocida 1 taza", cal: 41, p: 5, c: 7, f: 0 },
  { name: "kale crudo 1 taza", cal: 33, p: 3, c: 6, f: 0 },
  { name: "acelga cocida 1 taza", cal: 35, p: 3, c: 7, f: 0 },
  { name: "lechuga romana 2 tazas", cal: 16, p: 1, c: 3, f: 0 },
  { name: "lechuga mixta 2 tazas", cal: 10, p: 1, c: 2, f: 0 },
  { name: "jitomate mediano", cal: 22, p: 1, c: 5, f: 0 },
  { name: "jitomate cherry 1 taza", cal: 27, p: 1, c: 6, f: 0 },
  { name: "tomate verde 3 piezas", cal: 21, p: 1, c: 4, f: 1 },
  { name: "pepino mediano", cal: 16, p: 1, c: 4, f: 0 },
  { name: "zanahoria cruda 1 mediana", cal: 25, p: 1, c: 6, f: 0 },
  { name: "zanahoria cocida 1 taza", cal: 55, p: 1, c: 13, f: 0 },
  { name: "chile poblano 1 pieza", cal: 48, p: 2, c: 10, f: 1 },
  { name: "chile serrano 3 piezas", cal: 18, p: 1, c: 4, f: 0 },
  { name: "nopal en tiras cocido 1 taza", cal: 23, p: 2, c: 5, f: 0 },
  { name: "calabacita cocida 1 taza", cal: 20, p: 1, c: 4, f: 0 },
  { name: "chayote cocido 1 taza", cal: 38, p: 1, c: 9, f: 0 },
  { name: "betabel cocido 1 taza", cal: 75, p: 3, c: 17, f: 0 },
  { name: "ejotes cocidos 1 taza", cal: 44, p: 2, c: 10, f: 0 },
  { name: "apio 2 ramas", cal: 13, p: 1, c: 3, f: 0 },
  { name: "col blanca cruda 1 taza", cal: 22, p: 1, c: 5, f: 0 },
  { name: "col morada cruda 1 taza", cal: 28, p: 1, c: 7, f: 0 },
  { name: "cebolla picada 1/2 taza", cal: 32, p: 1, c: 7, f: 0 },
  { name: "cebolla morada 1/2 taza", cal: 28, p: 1, c: 7, f: 0 },
  { name: "pimiento verde 1 mediano", cal: 24, p: 1, c: 6, f: 0 },
  { name: "pimiento rojo 1 mediano", cal: 31, p: 1, c: 7, f: 0 },
  { name: "champiñon crudo 1 taza", cal: 21, p: 3, c: 3, f: 0 },
  { name: "champiñon salteado 1 taza", cal: 44, p: 4, c: 4, f: 2 },
  { name: "hongos portobello 1 pieza grande", cal: 35, p: 3, c: 5, f: 1 },
  { name: "esparragos 6 tallos", cal: 20, p: 2, c: 4, f: 0 },
  { name: "alcachofa mediana", cal: 60, p: 4, c: 13, f: 0 },
  { name: "verdolagas cocidas 1 taza", cal: 21, p: 2, c: 4, f: 0 },
  { name: "quelites cocidos 1 taza", cal: 29, p: 3, c: 5, f: 0 },
  { name: "huauzontle cocido 1 taza", cal: 38, p: 4, c: 6, f: 1 },
  { name: "aceite de oliva 1 cucharada", cal: 119, p: 0, c: 0, f: 14 },
  { name: "aceite de coco 1 cucharada", cal: 121, p: 0, c: 0, f: 14 },
  { name: "aceite vegetal 1 cucharada", cal: 120, p: 0, c: 0, f: 14 },
  { name: "mantequilla de mani natural 2 cuchrd", cal: 190, p: 8, c: 7, f: 16 },
  { name: "mantequilla de almendra 2 cuchrd", cal: 196, p: 7, c: 7, f: 17 },
  { name: "crema de cacahuate industrial 2 cuchrd", cal: 188, p: 8, c: 8, f: 16 },
  { name: "almendras 1 onza 28g", cal: 164, p: 6, c: 6, f: 14 },
  { name: "nuez de castilla 1 onza 28g", cal: 185, p: 4, c: 4, f: 18 },
  { name: "nuez de la india (caju) 1 onza", cal: 157, p: 5, c: 9, f: 12 },
  { name: "cacahuate natural 1 onza", cal: 166, p: 7, c: 6, f: 14 },
  { name: "pistache 1 onza sin cascara", cal: 157, p: 6, c: 8, f: 13 },
  { name: "semilla de chia 1 cucharada", cal: 58, p: 2, c: 5, f: 4 },
  { name: "semilla de linaza 1 cucharada", cal: 55, p: 2, c: 3, f: 4 },
  { name: "semilla de girasol 1 onza", cal: 165, p: 5, c: 6, f: 14 },
  { name: "pepita de calabaza 1 onza", cal: 158, p: 9, c: 4, f: 13 },
  { name: "aceitunas negras 10 piezas", cal: 50, p: 0, c: 1, f: 5 },
  { name: "crema de leche para cocinar 2 cuchrd", cal: 60, p: 1, c: 1, f: 6 },
  { name: "mayonesa regular 1 cucharada", cal: 94, p: 0, c: 0, f: 10 },
  { name: "mayonesa light 1 cucharada", cal: 49, p: 0, c: 1, f: 5 },
  { name: "agua natural 1 vaso", cal: 0, p: 0, c: 0, f: 0 },
  { name: "agua mineral 1 vaso", cal: 0, p: 0, c: 0, f: 0 },
  { name: "cafe americano negro 1 taza", cal: 5, p: 0, c: 1, f: 0 },
  { name: "cafe con leche entera 1 taza", cal: 75, p: 4, c: 6, f: 4 },
  { name: "cafe capuchino 1 taza mediana", cal: 120, p: 6, c: 10, f: 5 },
  { name: "cafe latte 1 taza grande", cal: 190, p: 9, c: 16, f: 8 },
  { name: "cafe frapuccino cadena 1 vaso grande", cal: 380, p: 6, c: 62, f: 13 },
  { name: "te negro sin azucar 1 taza", cal: 2, p: 0, c: 0, f: 0 },
  { name: "te verde sin azucar 1 taza", cal: 2, p: 0, c: 0, f: 0 },
  { name: "te de manzanilla sin azucar 1 taza", cal: 2, p: 0, c: 0, f: 0 },
  { name: "jugo de naranja natural 1 vaso", cal: 112, p: 2, c: 26, f: 0 },
  { name: "jugo de manzana natural 1 vaso", cal: 114, p: 0, c: 28, f: 0 },
  { name: "agua de jamaica sin azucar 1 vaso", cal: 10, p: 0, c: 2, f: 0 },
  { name: "agua de horchata 1 vaso", cal: 180, p: 2, c: 36, f: 4 },
  { name: "agua fresca de sabor 1 vaso", cal: 150, p: 0, c: 37, f: 0 },
  { name: "refresco de cola 1 lata 355ml", cal: 140, p: 0, c: 39, f: 0 },
  { name: "refresco de lima limon 1 lata", cal: 140, p: 0, c: 38, f: 0 },
  { name: "refresco light 1 lata", cal: 0, p: 0, c: 0, f: 0 },
  { name: "bebida energetica clasica 1 lata", cal: 110, p: 1, c: 28, f: 0 },
  { name: "bebida energetica sugar free 1 lata", cal: 15, p: 1, c: 3, f: 0 },
  { name: "bebida deportiva isotonica 1 botella", cal: 80, p: 0, c: 21, f: 0 },
  { name: "leche con chocolate 1 vaso", cal: 208, p: 9, c: 30, f: 6 },
  { name: "licuado de platano con leche 1 vaso", cal: 260, p: 9, c: 44, f: 6 },
  { name: "jugo verde natural 1 vaso 300ml", cal: 95, p: 3, c: 20, f: 1 },
  { name: "caldo de res casero 1 taza", cal: 70, p: 8, c: 3, f: 3 },
  { name: "caldo de pollo casero 1 taza", cal: 60, p: 7, c: 3, f: 2 },
  { name: "hamburguesa sencilla sin queso", cal: 480, p: 24, c: 44, f: 22 },
  { name: "hamburguesa doble con queso", cal: 750, p: 42, c: 46, f: 42 },
  { name: "pizza de queso 1 rebanada mediana", cal: 285, p: 12, c: 36, f: 10 },
  { name: "pizza de peperoni 1 rebanada", cal: 310, p: 13, c: 36, f: 13 },
  { name: "pizza hawaiana 1 rebanada", cal: 270, p: 12, c: 36, f: 9 },
  { name: "hot dog con salchicha y pan", cal: 270, p: 10, c: 25, f: 14 },
  { name: "torta de jamon basica", cal: 430, p: 20, c: 48, f: 17 },
  { name: "torta de milanesa", cal: 620, p: 32, c: 58, f: 27 },
  { name: "torta ahogada", cal: 580, p: 28, c: 60, f: 23 },
  { name: "burrito de pollo mediano", cal: 490, p: 28, c: 52, f: 16 },
  { name: "burrito de carne mediano", cal: 540, p: 30, c: 52, f: 20 },
  { name: "taco de canasta de frijol 1 pieza", cal: 95, p: 3, c: 16, f: 2 },
  { name: "taco de canasta de chicharron 1 pieza", cal: 120, p: 4, c: 14, f: 6 },
  { name: "taco de pastor 1 pieza", cal: 150, p: 10, c: 14, f: 6 },
  { name: "taco de suadero 1 pieza", cal: 170, p: 10, c: 13, f: 8 },
  { name: "taco de birria 1 pieza", cal: 180, p: 14, c: 13, f: 8 },
  { name: "enchiladas en salsa roja 3 piezas", cal: 380, p: 18, c: 38, f: 17 },
  { name: "enchiladas verdes 3 piezas", cal: 350, p: 18, c: 36, f: 14 },
  { name: "chilaquiles rojos con crema 1 plato", cal: 480, p: 16, c: 52, f: 22 },
  { name: "chilaquiles verdes con huevo 1 plato", cal: 500, p: 22, c: 50, f: 22 },
  { name: "quesadilla harina con queso", cal: 380, p: 16, c: 36, f: 18 },
  { name: "gordita de chicharron prensado", cal: 310, p: 12, c: 34, f: 14 },
  { name: "gordita de guisado promedio", cal: 280, p: 12, c: 34, f: 11 },
  { name: "mollete con frijoles y queso", cal: 320, p: 14, c: 44, f: 9 },
  { name: "sincronizada 2 tortillas jamon queso", cal: 400, p: 20, c: 38, f: 18 },
  { name: "flautas de pollo 3 piezas con guarnicion", cal: 450, p: 22, c: 46, f: 20 },
  { name: "sopa de tortilla con crema 1 plato", cal: 310, p: 9, c: 36, f: 14 },
  { name: "sopa de fideos seca 1 taza", cal: 240, p: 7, c: 38, f: 7 },
  { name: "arroz rojo con verduras 1 taza", cal: 220, p: 4, c: 44, f: 3 },
  { name: "guisado promedio con salsa 100g", cal: 250, p: 16, c: 14, f: 14 },
  { name: "papas fritas en bolsa 1 bolsa chica 28g", cal: 152, p: 2, c: 15, f: 10 },
  { name: "doritos 1 bolsa chica 28g", cal: 140, p: 2, c: 18, f: 7 },
  { name: "palomitas con mantequilla 1 taza", cal: 93, p: 2, c: 10, f: 5 },
  { name: "palomitas naturales 1 taza", cal: 55, p: 2, c: 11, f: 1 },
  { name: "chicharron de cerdo 30g", cal: 157, p: 17, c: 0, f: 10 },
  { name: "jicama con limon y chile 1 taza", cal: 50, p: 1, c: 12, f: 0 },
  { name: "pepino con limon y chile 1 taza", cal: 20, p: 1, c: 4, f: 0 },
  { name: "fruta mixta con chile 1 taza", cal: 90, p: 1, c: 22, f: 0 },
  { name: "elote preparado en vaso", cal: 350, p: 7, c: 52, f: 14 },
  { name: "gelatina de agua 1 taza", cal: 70, p: 2, c: 17, f: 0 },
  { name: "gelatina de leche 1 taza", cal: 140, p: 5, c: 22, f: 4 },
  { name: "paleta de agua 1 pieza", cal: 60, p: 0, c: 15, f: 0 },
  { name: "paleta de leche 1 pieza", cal: 100, p: 2, c: 14, f: 4 },
  { name: "helado de vainilla 1 bola", cal: 145, p: 3, c: 17, f: 8 },
  { name: "nieve de sabor 1 bola", cal: 100, p: 1, c: 24, f: 0 },
  { name: "chocolate de leche 1 cuadro 10g", cal: 54, p: 1, c: 6, f: 3 },
  { name: "chocolate oscuro 70% 1 cuadro 10g", cal: 50, p: 1, c: 5, f: 3 },
  { name: "gomitas 10 piezas", cal: 90, p: 2, c: 22, f: 0 },
  { name: "cacahuate japones 1/4 taza", cal: 140, p: 6, c: 14, f: 7 },
  { name: "pistaches sin cascara 1 onza", cal: 157, p: 6, c: 8, f: 13 },
  { name: "mazapan 1 pieza", cal: 135, p: 4, c: 17, f: 6 },
  { name: "obleas con cajeta 1 pieza", cal: 90, p: 1, c: 18, f: 2 },
  { name: "pay de manzana 1 rebanada", cal: 410, p: 4, c: 58, f: 19 },
  { name: "creatina monohidrato 1 cucharadita 5g", cal: 0, p: 0, c: 0, f: 0 },
  { name: "proteina whey 1 scoop 30g con agua", cal: 120, p: 24, c: 3, f: 2 },
  { name: "proteina whey 1 scoop 30g con leche desc", cal: 200, p: 32, c: 15, f: 2 },
  { name: "bcaa en polvo 1 scoop 10g", cal: 10, p: 2, c: 0, f: 0 },
  { name: "beta-alanina polvo 1 scoop 3g", cal: 10, p: 2, c: 0, f: 0 },
  { name: "pre-entreno promedio 1 scoop", cal: 25, p: 1, c: 5, f: 0 },
  { name: "colageno hidrolizado 1 scoop 10g", cal: 35, p: 9, c: 0, f: 0 },
  { name: "magnesio glicinato 1 capsula", cal: 0, p: 0, c: 0, f: 0 },
  { name: "vitamina d3 1 capsula", cal: 0, p: 0, c: 0, f: 0 },
  { name: "zinc picolinato 1 capsula", cal: 0, p: 0, c: 0, f: 0 },
  { name: "omega-3 1 capsula", cal: 10, p: 0, c: 0, f: 1 },
  // === ANTOJITOS MEXICANOS (TACOS, GORDITAS, TLACOYOS, ETC.) ===
  { name: "taco al pastor con piña 1 pieza", cal: 230, p: 11, c: 18, f: 12 },
  { name: "taco al pastor sin piña 1 pieza", cal: 215, p: 11, c: 14, f: 12 },
  { name: "taco de bistec 1 pieza", cal: 220, p: 14, c: 17, f: 11 },
  { name: "taco de carne asada 1 pieza", cal: 230, p: 15, c: 16, f: 12 },
  { name: "taco de suadero 1 pieza", cal: 260, p: 12, c: 15, f: 17 },
  { name: "taco de tripa 1 pieza", cal: 250, p: 11, c: 14, f: 17 },
  { name: "taco de lengua 1 pieza", cal: 245, p: 12, c: 14, f: 16 },
  { name: "taco de longaniza 1 pieza", cal: 280, p: 11, c: 15, f: 19 },
  { name: "taco de chorizo 1 pieza", cal: 270, p: 10, c: 15, f: 19 },
  { name: "taco de barbacoa 1 pieza", cal: 235, p: 14, c: 16, f: 13 },
  { name: "taco de carnitas 1 pieza", cal: 260, p: 13, c: 15, f: 16 },
  { name: "taco de cabeza 1 pieza", cal: 230, p: 12, c: 15, f: 13 },
  { name: "taco de cochinita pibil 1 pieza", cal: 240, p: 13, c: 18, f: 12 },
  { name: "taco de pollo 1 pieza", cal: 200, p: 14, c: 18, f: 8 },
  { name: "taco de pescado 1 pieza", cal: 220, p: 14, c: 18, f: 10 },
  { name: "taco de camarón 1 pieza", cal: 210, p: 13, c: 19, f: 8 },
  { name: "taco de chicharrón en salsa verde 1 pieza", cal: 250, p: 9, c: 17, f: 16 },
  { name: "taco de chicharrón en salsa roja 1 pieza", cal: 250, p: 9, c: 17, f: 16 },
  { name: "taco de huevo con chorizo 1 pieza", cal: 240, p: 12, c: 17, f: 14 },
  { name: "taco de papa con chorizo 1 pieza", cal: 220, p: 6, c: 26, f: 11 },
  { name: "taco de canasta 1 pieza", cal: 180, p: 5, c: 22, f: 8 },
  { name: "taco dorado de pollo 1 pieza", cal: 260, p: 11, c: 20, f: 15 },
  { name: "taco dorado de papa 1 pieza", cal: 230, p: 4, c: 27, f: 12 },
  { name: "taco árabe 1 pieza", cal: 290, p: 14, c: 28, f: 13 },
  { name: "gringa al pastor 1 pieza", cal: 380, p: 18, c: 30, f: 21 },
  { name: "alambre de res con queso 1 plato chico", cal: 540, p: 30, c: 24, f: 35 },
  { name: "alambre de pollo con queso 1 plato chico", cal: 480, p: 32, c: 24, f: 27 },
  { name: "gordita de chicharrón 1 pieza", cal: 280, p: 8, c: 30, f: 14 },
  { name: "gordita de frijol con queso 1 pieza", cal: 250, p: 9, c: 35, f: 9 },
  { name: "gordita de carne deshebrada 1 pieza", cal: 290, p: 14, c: 30, f: 13 },
  { name: "gordita de chile rajas 1 pieza", cal: 230, p: 6, c: 32, f: 9 },
  { name: "tlacoyo de frijol 1 pieza", cal: 200, p: 7, c: 32, f: 5 },
  { name: "tlacoyo de haba 1 pieza", cal: 195, p: 8, c: 32, f: 4 },
  { name: "tlacoyo de requesón 1 pieza", cal: 220, p: 9, c: 30, f: 7 },
  { name: "huarache con carne 1 pieza", cal: 420, p: 18, c: 45, f: 19 },
  { name: "huarache con bistec 1 pieza", cal: 440, p: 22, c: 44, f: 19 },
  { name: "memela con queso 1 pieza", cal: 240, p: 7, c: 30, f: 10 },
  { name: "molote 1 pieza", cal: 280, p: 9, c: 32, f: 13 },
  { name: "panucho de cochinita 1 pieza", cal: 270, p: 12, c: 30, f: 12 },
  { name: "salbute de pollo 1 pieza", cal: 230, p: 11, c: 26, f: 10 },
  { name: "tostada de tinga 1 pieza", cal: 200, p: 11, c: 18, f: 10 },
  { name: "tostada de pollo 1 pieza", cal: 190, p: 12, c: 18, f: 8 },
  { name: "tostada de ceviche 1 pieza", cal: 150, p: 12, c: 16, f: 4 },
  { name: "tostada de pata 1 pieza", cal: 240, p: 12, c: 18, f: 14 },
  { name: "chalupa poblana 1 pieza", cal: 220, p: 8, c: 24, f: 11 },
  { name: "enchilada verde con pollo 1 pieza", cal: 240, p: 12, c: 22, f: 12 },
  { name: "enchilada roja con pollo 1 pieza", cal: 240, p: 12, c: 22, f: 12 },
  { name: "enchilada de mole 1 pieza", cal: 270, p: 11, c: 26, f: 14 },
  { name: "enchilada suiza 1 pieza", cal: 290, p: 14, c: 22, f: 17 },
  { name: "enchilada potosina 1 pieza", cal: 250, p: 10, c: 24, f: 13 },
  { name: "chilaquiles verdes con pollo 1 plato", cal: 480, p: 22, c: 50, f: 21 },
  { name: "chilaquiles rojos con pollo 1 plato", cal: 480, p: 22, c: 50, f: 21 },
  { name: "chilaquiles verdes con huevo 1 plato", cal: 420, p: 16, c: 48, f: 18 },
  { name: "chilaquiles divorciados 1 plato", cal: 500, p: 22, c: 50, f: 23 },
  { name: "molletes con frijol y queso 1 pieza", cal: 320, p: 12, c: 38, f: 13 },
  { name: "molletes con chorizo 1 pieza", cal: 380, p: 14, c: 38, f: 19 },
  { name: "torta de jamón y queso 1 pieza", cal: 480, p: 22, c: 52, f: 19 },
  { name: "torta cubana 1 pieza", cal: 850, p: 38, c: 70, f: 45 },
  { name: "torta ahogada 1 pieza", cal: 620, p: 30, c: 65, f: 26 },
  { name: "torta de tamal guajolota 1 pieza", cal: 570, p: 12, c: 90, f: 17 },
  { name: "torta de milanesa 1 pieza", cal: 720, p: 32, c: 70, f: 33 },
  { name: "torta de pierna 1 pieza", cal: 580, p: 28, c: 60, f: 24 },
  { name: "torta de pavo 1 pieza", cal: 480, p: 28, c: 58, f: 14 },
  { name: "torta de chilaquiles 1 pieza", cal: 620, p: 18, c: 80, f: 25 },
  { name: "pambazo 1 pieza", cal: 480, p: 14, c: 50, f: 24 },
  { name: "burrito de bistec 1 pieza", cal: 520, p: 26, c: 55, f: 22 },
  { name: "burrito de frijol con queso 1 pieza", cal: 380, p: 14, c: 56, f: 11 },
  { name: "burrito de machaca 1 pieza", cal: 460, p: 25, c: 50, f: 18 },
  { name: "vampiro de carne 1 pieza", cal: 290, p: 14, c: 22, f: 16 },
  { name: "mulita 1 pieza", cal: 320, p: 16, c: 26, f: 17 },
  { name: "volcán 1 pieza", cal: 280, p: 13, c: 22, f: 16 },
  // === SOPAS, CALDOS, GUISADOS ===
  { name: "caldo de pollo 1 plato", cal: 180, p: 18, c: 12, f: 7 },
  { name: "caldo tlalpeño 1 plato", cal: 220, p: 18, c: 18, f: 9 },
  { name: "caldo de res 1 plato", cal: 250, p: 22, c: 18, f: 11 },
  { name: "mole de olla 1 plato", cal: 280, p: 22, c: 22, f: 13 },
  { name: "sopa de fideo 1 plato", cal: 180, p: 6, c: 30, f: 4 },
  { name: "sopa de fideo seco 1 plato", cal: 280, p: 8, c: 38, f: 11 },
  { name: "sopa de tortilla azteca 1 plato", cal: 320, p: 13, c: 32, f: 16 },
  { name: "sopa de calabaza 1 plato", cal: 140, p: 4, c: 22, f: 5 },
  { name: "sopa de elote 1 plato", cal: 220, p: 6, c: 32, f: 9 },
  { name: "sopa de hongos 1 plato", cal: 130, p: 6, c: 14, f: 6 },
  { name: "sopa de lentejas 1 plato", cal: 260, p: 18, c: 38, f: 4 },
  { name: "sopa de habas 1 plato", cal: 240, p: 14, c: 38, f: 4 },
  { name: "crema de chile poblano 1 plato", cal: 320, p: 8, c: 22, f: 22 },
  { name: "crema de elote 1 plato", cal: 280, p: 6, c: 32, f: 14 },
  { name: "albóndigas en chipotle 1 plato", cal: 380, p: 24, c: 22, f: 22 },
  { name: "tinga de pollo 100g", cal: 165, p: 18, c: 6, f: 8 },
  { name: "rajas con crema 100g", cal: 130, p: 4, c: 8, f: 9 },
  { name: "chiles rellenos de queso 1 pieza", cal: 380, p: 14, c: 14, f: 30 },
  { name: "chiles en nogada 1 pieza", cal: 540, p: 20, c: 35, f: 36 },
  { name: "mole poblano con pollo 1 plato", cal: 510, p: 28, c: 22, f: 35 },
  { name: "mole verde con pollo 1 plato", cal: 380, p: 26, c: 18, f: 22 },
  { name: "mole amarillo con pollo 1 plato", cal: 380, p: 26, c: 22, f: 20 },
  { name: "mole negro oaxaqueño 1 plato", cal: 480, p: 25, c: 30, f: 30 },
  { name: "asado de boda 1 plato", cal: 520, p: 28, c: 24, f: 35 },
  { name: "discada norteña 1 plato", cal: 580, p: 32, c: 18, f: 42 },
  { name: "machaca con huevo 1 plato", cal: 380, p: 28, c: 6, f: 26 },
  { name: "huevo a la mexicana 2 piezas", cal: 220, p: 13, c: 8, f: 15 },
  { name: "huevo divorciado 2 piezas", cal: 320, p: 16, c: 24, f: 18 },
  { name: "huevo en cazuela ranchero 2 piezas", cal: 320, p: 14, c: 24, f: 18 },
  { name: "frijol charro 1 taza", cal: 300, p: 16, c: 38, f: 10 },
  { name: "frijoles puercos 1 taza", cal: 380, p: 14, c: 40, f: 18 },
  { name: "frijoles maneados 1 taza", cal: 360, p: 14, c: 40, f: 15 },
  { name: "nopales asados 1 taza", cal: 22, p: 2, c: 4, f: 0 },
  { name: "nopales en penca con queso 1 plato", cal: 220, p: 12, c: 12, f: 14 },
  { name: "ceviche de pescado 1 plato", cal: 240, p: 26, c: 18, f: 6 },
  { name: "aguachile de camarón 1 plato", cal: 220, p: 28, c: 12, f: 5 },
  { name: "coctel de camarón 1 vaso mediano", cal: 280, p: 22, c: 28, f: 8 },
  { name: "filete empapelado 1 pieza", cal: 280, p: 30, c: 8, f: 14 },
  { name: "pescado a la veracruzana 1 plato", cal: 320, p: 32, c: 14, f: 14 },
  { name: "pescado zarandeado 1 pieza", cal: 280, p: 32, c: 4, f: 14 },
  { name: "tikinxic 1 plato", cal: 300, p: 30, c: 8, f: 16 },
  { name: "pulpo a las brasas 100g", cal: 170, p: 30, c: 4, f: 4 },
  { name: "callo de hacha 100g", cal: 90, p: 18, c: 4, f: 0 },
  // === FRUTAS DE MÉXICO ===
  { name: "guayaba 1 pieza mediana", cal: 37, p: 1, c: 8, f: 1 },
  { name: "papaya 1 taza", cal: 60, p: 1, c: 15, f: 0 },
  { name: "papaya 100g", cal: 43, p: 0, c: 11, f: 0 },
  { name: "tuna 1 pieza", cal: 42, p: 1, c: 10, f: 1 },
  { name: "xoconostle 1 pieza", cal: 25, p: 1, c: 6, f: 0 },
  { name: "mamey 100g", cal: 124, p: 1, c: 32, f: 1 },
  { name: "mamey 1/2 pieza", cal: 250, p: 2, c: 64, f: 1 },
  { name: "zapote negro 100g", cal: 80, p: 1, c: 21, f: 0 },
  { name: "chicozapote 1 pieza", cal: 95, p: 1, c: 24, f: 1 },
  { name: "guanábana 1 taza", cal: 150, p: 2, c: 38, f: 1 },
  { name: "tamarindo 100g", cal: 239, p: 3, c: 63, f: 1 },
  { name: "ciruela amarilla 1 pieza", cal: 30, p: 0, c: 8, f: 0 },
  { name: "capulín 100g", cal: 50, p: 1, c: 12, f: 0 },
  { name: "tejocote 1 pieza", cal: 26, p: 0, c: 7, f: 0 },
  { name: "carambola 1 pieza", cal: 30, p: 1, c: 7, f: 0 },
  { name: "níspero 1 pieza", cal: 25, p: 0, c: 6, f: 0 },
  { name: "granada china 1 pieza", cal: 75, p: 2, c: 18, f: 1 },
  { name: "pitahaya 1 pieza mediana", cal: 60, p: 1, c: 14, f: 0 },
  { name: "maracuyá 1 pieza", cal: 18, p: 0, c: 4, f: 0 },
  { name: "kiwi 1 pieza", cal: 42, p: 1, c: 10, f: 0 },
  { name: "uva 1 taza", cal: 104, p: 1, c: 27, f: 0 },
  { name: "cereza 1 taza", cal: 87, p: 1, c: 22, f: 0 },
  { name: "durazno 1 pieza", cal: 58, p: 1, c: 14, f: 0 },
  { name: "ciruela pasa 4 piezas", cal: 92, p: 1, c: 24, f: 0 },
  { name: "higo 1 pieza", cal: 37, p: 0, c: 10, f: 0 },
  { name: "moras 1 taza", cal: 62, p: 2, c: 14, f: 1 },
  { name: "frambuesas 1 taza", cal: 64, p: 1, c: 15, f: 1 },
  { name: "zarzamora 1 taza", cal: 62, p: 2, c: 14, f: 1 },
  { name: "arándanos 1 taza", cal: 84, p: 1, c: 21, f: 0 },
  { name: "coco fresco 100g", cal: 354, p: 3, c: 15, f: 33 },
  { name: "coco rallado seco 30g", cal: 200, p: 2, c: 7, f: 19 },
  { name: "agua de coco 1 vaso 240ml", cal: 46, p: 2, c: 9, f: 0 },
  { name: "melón 1 taza", cal: 54, p: 1, c: 14, f: 0 },
  { name: "papaya con limón 1 taza", cal: 70, p: 1, c: 17, f: 0 },
  // === VERDURAS / VEGETALES ===
  { name: "chayote cocido 1 taza", cal: 38, p: 2, c: 9, f: 0 },
  { name: "calabacita italiana 1 taza", cal: 20, p: 1, c: 4, f: 0 },
  { name: "calabaza de castilla 1 taza", cal: 49, p: 2, c: 12, f: 0 },
  { name: "ejotes cocidos 1 taza", cal: 44, p: 2, c: 10, f: 0 },
  { name: "espárragos cocidos 6 piezas", cal: 20, p: 2, c: 4, f: 0 },
  { name: "hongos champiñones cocidos 1 taza", cal: 44, p: 3, c: 8, f: 1 },
  { name: "berros 1 taza", cal: 4, p: 1, c: 0, f: 0 },
  { name: "rábano 5 piezas", cal: 10, p: 0, c: 2, f: 0 },
  { name: "betabel cocido 1 taza", cal: 75, p: 3, c: 17, f: 0 },
  { name: "col blanca rallada 1 taza", cal: 22, p: 1, c: 5, f: 0 },
  { name: "col morada rallada 1 taza", cal: 28, p: 1, c: 7, f: 0 },
  { name: "coliflor cocida 1 taza", cal: 29, p: 2, c: 5, f: 1 },
  { name: "alcachofa cocida 1 pieza", cal: 60, p: 4, c: 13, f: 0 },
  { name: "apio 1 taza", cal: 16, p: 1, c: 3, f: 0 },
  { name: "germen de soya 1 taza", cal: 30, p: 3, c: 6, f: 0 },
  { name: "huitlacoche 100g", cal: 50, p: 6, c: 8, f: 1 },
  { name: "flor de calabaza 1 taza", cal: 20, p: 2, c: 4, f: 0 },
  { name: "quintoniles 1 taza", cal: 24, p: 3, c: 4, f: 0 },
  { name: "verdolagas 1 taza", cal: 15, p: 1, c: 3, f: 0 },
  { name: "epazote 1 cucharada", cal: 1, p: 0, c: 0, f: 0 },
  { name: "cilantro 1/4 taza", cal: 1, p: 0, c: 0, f: 0 },
  { name: "perejil 1/4 taza", cal: 5, p: 0, c: 1, f: 0 },
  { name: "ajo 1 diente", cal: 4, p: 0, c: 1, f: 0 },
  { name: "chile poblano 1 pieza", cal: 30, p: 1, c: 7, f: 0 },
  { name: "chile jalapeño 1 pieza", cal: 4, p: 0, c: 1, f: 0 },
  { name: "chile serrano 1 pieza", cal: 2, p: 0, c: 0, f: 0 },
  { name: "chile habanero 1 pieza", cal: 8, p: 0, c: 2, f: 0 },
  { name: "chile chipotle adobado 1 pieza", cal: 18, p: 1, c: 3, f: 1 },
  // === BEBIDAS Y AGUAS FRESCAS ===
  { name: "agua de jamaica sin azúcar 1 vaso 240ml", cal: 5, p: 0, c: 1, f: 0 },
  { name: "agua de jamaica con azúcar 1 vaso 240ml", cal: 90, p: 0, c: 22, f: 0 },
  { name: "agua de horchata 1 vaso 240ml", cal: 160, p: 1, c: 30, f: 4 },
  { name: "agua de tamarindo 1 vaso 240ml", cal: 100, p: 0, c: 25, f: 0 },
  { name: "agua de chía con limón 1 vaso 240ml", cal: 70, p: 1, c: 14, f: 1 },
  { name: "agua de pepino 1 vaso 240ml", cal: 12, p: 0, c: 3, f: 0 },
  { name: "agua de limón con chía 1 vaso 240ml", cal: 70, p: 1, c: 14, f: 1 },
  { name: "agua de sandía 1 vaso 240ml", cal: 80, p: 1, c: 20, f: 0 },
  { name: "agua mineral 1 vaso 240ml", cal: 0, p: 0, c: 0, f: 0 },
  { name: "té helado sin azúcar 1 vaso", cal: 2, p: 0, c: 0, f: 0 },
  { name: "té chai con leche 1 taza", cal: 120, p: 4, c: 22, f: 3 },
  { name: "atole de masa 1 taza", cal: 220, p: 5, c: 38, f: 5 },
  { name: "atole de chocolate 1 taza", cal: 250, p: 5, c: 42, f: 6 },
  { name: "atole champurrado 1 taza", cal: 270, p: 5, c: 48, f: 7 },
  { name: "café americano sin azúcar 1 taza", cal: 5, p: 0, c: 0, f: 0 },
  { name: "café con leche entera 1 taza", cal: 90, p: 5, c: 8, f: 5 },
  { name: "café con leche descremada 1 taza", cal: 60, p: 5, c: 8, f: 0 },
  { name: "cafe latte 1 taza grande", cal: 190, p: 11, c: 18, f: 7 },
  { name: "cappuccino 1 taza grande", cal: 130, p: 8, c: 12, f: 5 },
  { name: "frappuccino con crema 1 grande", cal: 410, p: 5, c: 65, f: 15 },
  { name: "chocolate caliente con leche 1 taza", cal: 240, p: 8, c: 30, f: 10 },
  { name: "jugo de naranja natural 1 vaso 240ml", cal: 110, p: 2, c: 26, f: 0 },
  { name: "jugo de zanahoria 1 vaso 240ml", cal: 95, p: 2, c: 22, f: 0 },
  { name: "jugo verde con espinaca 1 vaso 240ml", cal: 80, p: 3, c: 18, f: 0 },
  { name: "jugo de betabel 1 vaso 240ml", cal: 100, p: 3, c: 24, f: 0 },
  { name: "smoothie de frutas 1 vaso 350ml", cal: 280, p: 6, c: 60, f: 3 },
  { name: "licuado de plátano con leche 1 vaso", cal: 280, p: 10, c: 50, f: 6 },
  { name: "licuado de fresa con leche 1 vaso", cal: 240, p: 10, c: 42, f: 6 },
  { name: "refresco cola 1 lata 355ml", cal: 150, p: 0, c: 39, f: 0 },
  { name: "refresco cola light 1 lata 355ml", cal: 0, p: 0, c: 0, f: 0 },
  { name: "refresco sabor limón 1 lata 355ml", cal: 145, p: 0, c: 38, f: 0 },
  { name: "refresco sabor toronja 1 lata 355ml", cal: 140, p: 0, c: 37, f: 0 },
  { name: "boing 1 cartón 250ml", cal: 130, p: 0, c: 32, f: 0 },
  { name: "agua tónica 1 vaso", cal: 90, p: 0, c: 22, f: 0 },
  { name: "cerveza clara 1 botella 355ml", cal: 153, p: 2, c: 13, f: 0 },
  { name: "cerveza oscura 1 botella 355ml", cal: 170, p: 2, c: 14, f: 0 },
  { name: "michelada con clamato 1 vaso grande", cal: 220, p: 3, c: 22, f: 0 },
  { name: "tequila 1 caballito 45ml", cal: 96, p: 0, c: 0, f: 0 },
  { name: "mezcal 1 caballito 45ml", cal: 96, p: 0, c: 0, f: 0 },
  { name: "ron 1 medida 45ml", cal: 97, p: 0, c: 0, f: 0 },
  { name: "vodka 1 medida 45ml", cal: 96, p: 0, c: 0, f: 0 },
  { name: "whisky 1 medida 45ml", cal: 105, p: 0, c: 0, f: 0 },
  { name: "vino tinto 1 copa 150ml", cal: 125, p: 0, c: 4, f: 0 },
  { name: "vino blanco 1 copa 150ml", cal: 121, p: 0, c: 4, f: 0 },
  { name: "margarita 1 vaso 250ml", cal: 280, p: 0, c: 26, f: 0 },
  { name: "piña colada 1 vaso 250ml", cal: 380, p: 1, c: 50, f: 8 },
  { name: "mojito 1 vaso 250ml", cal: 220, p: 0, c: 22, f: 0 },
  // === POSTRES Y DULCES MEXICANOS ===
  { name: "flan 1 porción mediana", cal: 280, p: 6, c: 38, f: 11 },
  { name: "arroz con leche 1 taza", cal: 320, p: 7, c: 58, f: 8 },
  { name: "tres leches 1 rebanada", cal: 380, p: 7, c: 50, f: 17 },
  { name: "gelatina con leche 1 porción", cal: 140, p: 4, c: 22, f: 4 },
  { name: "gelatina de agua 1 porción", cal: 80, p: 2, c: 18, f: 0 },
  { name: "buñuelo con miel 1 pieza", cal: 290, p: 4, c: 38, f: 14 },
  { name: "churro 1 pieza", cal: 130, p: 1, c: 14, f: 8 },
  { name: "churro relleno de cajeta 1 pieza", cal: 220, p: 2, c: 28, f: 11 },
  { name: "rosca de reyes 1 rebanada", cal: 280, p: 5, c: 40, f: 11 },
  { name: "pan de muerto 1 pieza chico", cal: 240, p: 5, c: 38, f: 8 },
  { name: "capirotada 1 porción", cal: 320, p: 7, c: 50, f: 11 },
  { name: "calabaza en tacha 1 porción", cal: 220, p: 2, c: 52, f: 0 },
  { name: "ate con queso 1 rebanada", cal: 200, p: 6, c: 28, f: 7 },
  { name: "cocada 1 pieza", cal: 200, p: 2, c: 26, f: 11 },
  { name: "jamoncillo 1 pieza", cal: 130, p: 2, c: 22, f: 4 },
  { name: "obleas con cajeta 2 piezas", cal: 180, p: 2, c: 32, f: 5 },
  { name: "alegría de amaranto 1 pieza", cal: 110, p: 3, c: 20, f: 3 },
  { name: "palanqueta de cacahuate 1 pieza", cal: 230, p: 7, c: 28, f: 12 },
  { name: "macarrón mexicano 1 pieza", cal: 150, p: 1, c: 30, f: 3 },
  { name: "tamarindo enchilado 1 paleta", cal: 80, p: 1, c: 20, f: 0 },
  { name: "pulparindo 1 pieza", cal: 60, p: 0, c: 14, f: 0 },
  { name: "duvalin 1 pieza", cal: 50, p: 1, c: 8, f: 2 },
  { name: "panditas 1 bolsita", cal: 120, p: 2, c: 28, f: 0 },
  { name: "mazapán de cacahuate 1 pieza", cal: 130, p: 4, c: 14, f: 7 },
  { name: "nieve de garrafa 1 bola", cal: 130, p: 2, c: 26, f: 3 },
  { name: "paleta de hielo de fruta 1 pieza", cal: 80, p: 1, c: 20, f: 0 },
  { name: "helado de vainilla 1 bola", cal: 140, p: 2, c: 18, f: 7 },
  { name: "helado de chocolate 1 bola", cal: 150, p: 3, c: 19, f: 8 },
  { name: "raspado con jarabe 1 vaso", cal: 110, p: 0, c: 28, f: 0 },
  // === SNACKS, FRITURAS Y ANTOJOS ===
  { name: "papitas fritas saladas 30g", cal: 152, p: 2, c: 15, f: 10 },
  { name: "doritos 30g", cal: 150, p: 2, c: 18, f: 8 },
  { name: "cheetos 30g", cal: 160, p: 2, c: 16, f: 10 },
  { name: "ruffles 30g", cal: 160, p: 2, c: 15, f: 10 },
  { name: "takis 30g", cal: 150, p: 2, c: 19, f: 7 },
  { name: "sabritones 30g", cal: 160, p: 2, c: 17, f: 9 },
  { name: "chicharrón de cerdo 30g", cal: 170, p: 17, c: 0, f: 11 },
  { name: "chicharrón de harina 30g", cal: 130, p: 2, c: 18, f: 6 },
  { name: "cacahuates japoneses 30g", cal: 150, p: 5, c: 16, f: 8 },
  { name: "cacahuates salados 30g", cal: 170, p: 7, c: 5, f: 14 },
  { name: "pistaches 30g", cal: 160, p: 6, c: 8, f: 13 },
  { name: "nueces de la india 30g", cal: 165, p: 5, c: 9, f: 13 },
  { name: "semillas de calabaza tostadas 30g", cal: 170, p: 9, c: 4, f: 14 },
  { name: "semillas de girasol 30g", cal: 165, p: 6, c: 6, f: 14 },
  { name: "almendras 23 piezas 30g", cal: 170, p: 6, c: 6, f: 15 },
  { name: "barra de granola 1 pieza", cal: 130, p: 3, c: 22, f: 4 },
  { name: "barra de proteína 1 pieza", cal: 200, p: 20, c: 18, f: 6 },
  { name: "barra de cereal 1 pieza", cal: 100, p: 1, c: 20, f: 2 },
  { name: "yogur con granola 1 vaso", cal: 230, p: 8, c: 38, f: 5 },
  { name: "donas glaseadas 1 pieza", cal: 270, p: 4, c: 30, f: 15 },
  { name: "muffin de chocolate 1 pieza", cal: 350, p: 5, c: 50, f: 14 },
  { name: "muffin de blueberry 1 pieza", cal: 380, p: 5, c: 52, f: 17 },
  { name: "galleta chocolate chip 1 pieza grande", cal: 220, p: 3, c: 30, f: 11 },
  { name: "brownie 1 pieza", cal: 270, p: 3, c: 36, f: 13 },
  { name: "cheesecake 1 rebanada", cal: 380, p: 6, c: 30, f: 26 },
  { name: "rebanada de pastel chocolate 1 porción", cal: 380, p: 4, c: 50, f: 17 },
  { name: "rebanada de pizza pepperoni 1", cal: 290, p: 13, c: 32, f: 12 },
  { name: "rebanada de pizza hawaiana 1", cal: 270, p: 12, c: 34, f: 10 },
  { name: "rebanada de pizza 4 quesos 1", cal: 320, p: 15, c: 30, f: 16 },
  { name: "alitas de pollo BBQ 6 piezas", cal: 480, p: 38, c: 14, f: 28 },
  { name: "alitas de pollo buffalo 6 piezas", cal: 520, p: 38, c: 6, f: 38 },
  { name: "boneless 6 piezas", cal: 460, p: 28, c: 30, f: 24 },
  { name: "hot dog clásico 1 pieza", cal: 280, p: 10, c: 22, f: 16 },
  { name: "hot dog tocino y queso 1 pieza", cal: 380, p: 14, c: 24, f: 25 },
  { name: "hamburguesa sencilla 1 pieza", cal: 480, p: 22, c: 38, f: 26 },
  { name: "hamburguesa doble con queso 1 pieza", cal: 720, p: 38, c: 42, f: 42 },
  { name: "papas a la francesa grandes 1 orden", cal: 510, p: 6, c: 64, f: 25 },
  { name: "aros de cebolla 1 orden", cal: 460, p: 6, c: 50, f: 26 },
  { name: "nachos con queso 1 orden", cal: 580, p: 14, c: 60, f: 32 },
  { name: "nachos supremos 1 orden", cal: 820, p: 26, c: 60, f: 50 },
  // === COMIDA INTERNACIONAL POPULAR EN MX ===
  { name: "sushi roll california 8 piezas", cal: 320, p: 9, c: 38, f: 14 },
  { name: "sushi roll philadelphia 8 piezas", cal: 360, p: 12, c: 38, f: 17 },
  { name: "sushi nigiri 2 piezas", cal: 80, p: 4, c: 14, f: 1 },
  { name: "ramen tradicional 1 plato", cal: 480, p: 22, c: 60, f: 16 },
  { name: "yakimeshi 1 plato", cal: 380, p: 12, c: 58, f: 11 },
  { name: "rollos primavera 2 piezas", cal: 200, p: 4, c: 24, f: 10 },
  { name: "pad thai 1 plato", cal: 480, p: 18, c: 60, f: 18 },
  { name: "lasaña 1 porción", cal: 440, p: 22, c: 38, f: 22 },
  { name: "espagueti boloñesa 1 plato", cal: 380, p: 18, c: 50, f: 12 },
  { name: "espagueti carbonara 1 plato", cal: 580, p: 22, c: 56, f: 28 },
  { name: "ensalada césar con pollo 1 plato", cal: 420, p: 30, c: 14, f: 28 },
  { name: "ensalada caprese 1 plato", cal: 280, p: 14, c: 8, f: 22 },
  { name: "kebab de pollo 1 pieza", cal: 380, p: 24, c: 30, f: 17 },
  { name: "shawarma 1 pieza", cal: 420, p: 28, c: 32, f: 19 },
  { name: "hummus con pita 1 porción", cal: 240, p: 8, c: 30, f: 10 },
  // === DESAYUNOS COMUNES ===
  { name: "huevos rancheros 2 piezas", cal: 320, p: 14, c: 24, f: 18 },
  { name: "huevos motuleños 2 piezas", cal: 380, p: 18, c: 28, f: 22 },
  { name: "huevos al albañil 2 piezas", cal: 280, p: 13, c: 18, f: 16 },
  { name: "molletes con frijol y queso 2 piezas", cal: 640, p: 24, c: 76, f: 26 },
  { name: "hot cakes 2 piezas con miel", cal: 380, p: 8, c: 70, f: 8 },
  { name: "waffle con miel 1 pieza", cal: 320, p: 6, c: 50, f: 10 },
  { name: "francés con plátano 1 plato", cal: 420, p: 10, c: 60, f: 14 },
  { name: "omelette de jamón y queso 2 huevos", cal: 320, p: 22, c: 4, f: 24 },
  { name: "omelette con verduras 2 huevos", cal: 230, p: 14, c: 8, f: 16 },
  { name: "fruta picada 1 vaso mediano", cal: 110, p: 2, c: 28, f: 0 },
  { name: "yogur con fruta y granola 1 vaso", cal: 280, p: 12, c: 42, f: 7 },
  { name: "smoothie bowl 1 plato", cal: 320, p: 8, c: 56, f: 7 },
  // === COMPLEMENTOS v5.24 (huecos detectados) ===
  { name: "taco de adobada 1 pieza", cal: 220, p: 11, c: 15, f: 12 },
  { name: "taco campechano 1 pieza", cal: 250, p: 13, c: 15, f: 15 },
  { name: "taco de asada con queso 1 pieza", cal: 300, p: 18, c: 16, f: 18 },
  { name: "sushi roll empanizado 8 piezas", cal: 480, p: 14, c: 52, f: 22 },
  { name: "sushi roll de aguacate 8 piezas", cal: 300, p: 6, c: 46, f: 10 },
  { name: "sashimi de salmón 3 piezas", cal: 120, p: 13, c: 0, f: 7 },
  { name: "arroz yakimeshi 1 plato", cal: 480, p: 18, c: 62, f: 16 },
  { name: "gohan con pollo 1 plato", cal: 520, p: 34, c: 68, f: 12 },
  { name: "coca-cola 1 lata 355ml", cal: 140, p: 0, c: 39, f: 0 },
  { name: "coca-cola 1 botella 600ml", cal: 252, p: 0, c: 63, f: 0 },
  { name: "coca-cola light o zero 1 lata", cal: 1, p: 0, c: 0, f: 0 },
  { name: "proteína en polvo 1 scoop", cal: 120, p: 24, c: 3, f: 2 },
  { name: "licuado de proteína con leche 1 vaso", cal: 280, p: 30, c: 18, f: 8 },
  { name: "barra de proteína 1 pieza", cal: 200, p: 20, c: 22, f: 6 },
  { name: "crema de cacahuate 1 cucharada", cal: 95, p: 4, c: 3, f: 8 },
  { name: "claras de huevo 4 piezas", cal: 68, p: 14, c: 1, f: 0 },
  { name: "pechuga asada 1 pieza 200g", cal: 330, p: 62, c: 0, f: 7 },
  { name: "salmón a la plancha 1 filete 180g", cal: 370, p: 36, c: 0, f: 24 },
  { name: "tilapia a la plancha 1 filete 150g", cal: 195, p: 40, c: 0, f: 3 },
  { name: "caldo de camarón 1 plato", cal: 250, p: 22, c: 18, f: 9 },
  { name: "lentejas guisadas 1 plato", cal: 280, p: 16, c: 40, f: 6 },
  { name: "ensalada de atún 1 plato", cal: 280, p: 30, c: 12, f: 12 },
  { name: "ensalada de pollo 1 plato", cal: 320, p: 32, c: 14, f: 14 },
  { name: "bowl de pollo con arroz y verdura 1 plato", cal: 520, p: 42, c: 58, f: 12 },
  { name: "camote cocido 1 pieza mediana", cal: 115, p: 2, c: 27, f: 0 },
  { name: "avena con proteína 1 plato", cal: 320, p: 28, c: 40, f: 6 },
  { name: "fresas 1 taza", cal: 50, p: 1, c: 12, f: 0 },
  { name: "uvas 1 taza", cal: 62, p: 1, c: 16, f: 0 },
  { name: "yogur griego natural 1 taza", cal: 130, p: 20, c: 8, f: 2 },
  { name: "queso cottage 1 taza", cal: 180, p: 24, c: 8, f: 5 },
  // === COMIDA INTERNACIONAL AMPLIADA (v5.49 — sin marcas) ===
  { name: "curry de pollo con arroz 1 plato", cal: 450, p: 28, c: 45, f: 18 },
  { name: "curry verde tailandés con pollo 1 plato", cal: 420, p: 24, c: 20, f: 28 },
  { name: "curry rojo con verduras 1 plato", cal: 340, p: 8, c: 30, f: 22 },
  { name: "falafel 4 piezas", cal: 220, p: 8, c: 24, f: 11 },
  { name: "pan pita integral 1 pieza", cal: 165, p: 6, c: 33, f: 2 },
  { name: "gyro (döner) de cordero 1 pieza", cal: 430, p: 24, c: 34, f: 22 },
  { name: "gyro (döner) de pollo 1 pieza", cal: 380, p: 26, c: 34, f: 15 },
  { name: "empanada de carne horneada 1 pieza", cal: 250, p: 9, c: 26, f: 12 },
  { name: "empanada de pollo horneada 1 pieza", cal: 230, p: 9, c: 24, f: 10 },
  { name: "empanada frita de carne 1 pieza", cal: 290, p: 8, c: 26, f: 17 },
  { name: "paella de mariscos 1 plato", cal: 480, p: 28, c: 58, f: 14 },
  { name: "risotto de champiñones 1 plato", cal: 420, p: 10, c: 60, f: 14 },
  { name: "gnocchi con salsa de tomate 1 plato", cal: 380, p: 10, c: 68, f: 8 },
  { name: "tiramisú 1 rebanada", cal: 350, p: 6, c: 34, f: 21 },
  { name: "croissant sencillo 1 pieza", cal: 230, p: 5, c: 26, f: 12 },
  { name: "croissant de jamón y queso 1 pieza", cal: 320, p: 13, c: 28, f: 18 },
  { name: "dim sum al vapor 4 piezas", cal: 220, p: 10, c: 26, f: 8 },
  { name: "chow mein de pollo 1 plato", cal: 420, p: 22, c: 50, f: 14 },
  { name: "arroz frito con verduras 1 plato", cal: 380, p: 8, c: 62, f: 10 },
  { name: "pho de res 1 plato", cal: 420, p: 26, c: 50, f: 10 },
  { name: "bibimbap con res 1 plato", cal: 520, p: 26, c: 62, f: 16 },
  { name: "kimchi 1/2 taza", cal: 25, p: 2, c: 5, f: 0 },
  { name: "tikka masala de pollo con arroz 1 plato", cal: 520, p: 32, c: 50, f: 22 },
  { name: "biryani de pollo 1 plato", cal: 480, p: 26, c: 60, f: 14 },
  { name: "shakshuka 1 plato", cal: 280, p: 16, c: 14, f: 18 },
  { name: "gazpacho 1 taza", cal: 90, p: 2, c: 14, f: 3 },
  { name: "tabulé (tabbouleh) 1 taza", cal: 180, p: 4, c: 26, f: 7 },
  { name: "moussaka 1 porción", cal: 380, p: 18, c: 22, f: 24 },
  { name: "goulash de res 1 plato", cal: 420, p: 28, c: 30, f: 20 },
  { name: "borscht 1 plato", cal: 150, p: 5, c: 22, f: 5 },
  { name: "ramen instantáneo preparado 1 taza", cal: 380, p: 8, c: 52, f: 14 },
  // === COMIDA RÁPIDA Y CASUAL AMPLIADA (sin marcas) ===
  { name: "pizza margarita 1 rebanada", cal: 260, p: 11, c: 32, f: 9 },
  { name: "pizza vegetariana 1 rebanada", cal: 250, p: 10, c: 32, f: 9 },
  { name: "pizza mexicana con chorizo y jalapeño 1 rebanada", cal: 330, p: 14, c: 32, f: 16 },
  { name: "pizza delgada estilo italiano 1 rebanada", cal: 210, p: 9, c: 24, f: 9 },
  { name: "hamburguesa con tocino y queso 1 pieza", cal: 620, p: 32, c: 40, f: 36 },
  { name: "hamburguesa vegetariana 1 pieza", cal: 380, p: 18, c: 40, f: 14 },
  { name: "sándwich club triple 1 pieza", cal: 520, p: 28, c: 42, f: 26 },
  { name: "sándwich de atún 1 pieza", cal: 380, p: 22, c: 34, f: 16 },
  { name: "sándwich de pavo 1 pieza", cal: 320, p: 20, c: 34, f: 10 },
  { name: "submarino mixto 15cm 1 pieza", cal: 420, p: 22, c: 48, f: 14 },
  { name: "wrap de pollo con vegetales 1 pieza", cal: 380, p: 24, c: 38, f: 14 },
  { name: "wrap vegetariano 1 pieza", cal: 320, p: 10, c: 42, f: 12 },
  { name: "fajitas de res con tortillas 1 plato", cal: 520, p: 32, c: 40, f: 24 },
  { name: "fajitas de pollo con tortillas 1 plato", cal: 480, p: 32, c: 38, f: 18 },
  { name: "fajitas de camarón con tortillas 1 plato", cal: 460, p: 30, c: 38, f: 16 },
  { name: "papas gajo (wedges) 1 orden", cal: 380, p: 5, c: 48, f: 18 },
  { name: "ensalada de nopales 1 plato", cal: 120, p: 6, c: 14, f: 5 },
  { name: "ensalada griega 1 plato", cal: 320, p: 10, c: 16, f: 24 },
  { name: "ensalada de espinaca con fresa y nuez 1 plato", cal: 280, p: 6, c: 22, f: 18 },
  { name: "ensalada de quinoa con verduras 1 plato", cal: 340, p: 10, c: 48, f: 11 },
  { name: "ensalada waldorf 1 plato", cal: 320, p: 4, c: 34, f: 19 },
  { name: "ensalada de garbanzo 1 plato", cal: 300, p: 13, c: 40, f: 9 },
  { name: "ensalada de pasta fría 1 plato", cal: 380, p: 10, c: 52, f: 14 },
  // === QUESADILLAS Y GUISADOS CASEROS AMPLIADOS ===
  { name: "quesadilla de champiñones 1 pieza", cal: 260, p: 10, c: 26, f: 13 },
  { name: "quesadilla de flor de calabaza 1 pieza", cal: 240, p: 9, c: 24, f: 12 },
  { name: "quesadilla de huitlacoche 1 pieza", cal: 250, p: 10, c: 25, f: 13 },
  { name: "quesadilla de rajas con queso 1 pieza", cal: 270, p: 10, c: 26, f: 14 },
  { name: "quesadilla de chicharrón prensado 1 pieza", cal: 300, p: 11, c: 25, f: 17 },
  { name: "quesadilla de papa con queso 1 pieza", cal: 260, p: 9, c: 34, f: 10 },
  { name: "quesadilla frita sin queso 1 pieza", cal: 150, p: 3, c: 18, f: 7 },
  { name: "pollo guisado en salsa de tomate 100g", cal: 190, p: 22, c: 6, f: 8 },
  { name: "pollo rostizado con piel 1 pierna", cal: 250, p: 22, c: 0, f: 17 },
  { name: "pollo rostizado sin piel 1 pierna", cal: 170, p: 24, c: 0, f: 7 },
  { name: "pollo rostizado pechuga con piel 1 pieza", cal: 300, p: 38, c: 0, f: 16 },
  { name: "pollo a la naranja 1 plato", cal: 380, p: 28, c: 34, f: 14 },
  { name: "res guisada con papas 1 plato", cal: 380, p: 26, c: 26, f: 18 },
  { name: "res en salsa de chile ancho 1 plato", cal: 350, p: 28, c: 18, f: 18 },
  { name: "picadillo de res 1 taza", cal: 320, p: 22, c: 18, f: 18 },
  { name: "carne deshebrada en salsa 100g", cal: 200, p: 22, c: 6, f: 9 },
  { name: "cerdo en salsa verde 100g", cal: 230, p: 22, c: 6, f: 13 },
  { name: "cerdo en salsa de chile pasilla 100g", cal: 250, p: 22, c: 8, f: 15 },
  { name: "pescado empanizado 1 filete", cal: 280, p: 24, c: 20, f: 12 },
  { name: "camarones a la diabla 1 plato", cal: 280, p: 28, c: 10, f: 13 },
  { name: "camarones al mojo de ajo 1 plato", cal: 320, p: 28, c: 8, f: 19 },
  // === COMIDA REGIONAL MEXICANA POCO COMÚN (v5.49) ===
  { name: "mixiote de pollo 1 pieza", cal: 320, p: 26, c: 8, f: 20 },
  { name: "mixiote de res 1 pieza", cal: 380, p: 28, c: 8, f: 26 },
  { name: "mixiote de borrego 1 pieza", cal: 400, p: 28, c: 8, f: 28 },
  { name: "tesmole de pollo 1 plato", cal: 320, p: 24, c: 20, f: 16 },
  { name: "pipián verde con pollo 1 plato", cal: 400, p: 28, c: 16, f: 24 },
  { name: "pipián rojo con pollo 1 plato", cal: 400, p: 28, c: 18, f: 24 },
  { name: "zacahuil (tamal huasteco) 1 rebanada", cal: 380, p: 14, c: 48, f: 14 },
  { name: "chanfaina 1 plato", cal: 280, p: 22, c: 14, f: 16 },
  { name: "relleno negro yucateco 1 plato", cal: 350, p: 26, c: 16, f: 20 },
  { name: "papadzules 3 piezas", cal: 420, p: 14, c: 40, f: 24 },
  { name: "sikil pak con totopos 1 porción", cal: 280, p: 9, c: 22, f: 18 },
  { name: "poc chuc 1 plato", cal: 380, p: 32, c: 8, f: 24 },
  { name: "cabrito al pastor 100g", cal: 280, p: 26, c: 0, f: 19 },
  { name: "chilorio de cerdo 100g", cal: 320, p: 24, c: 6, f: 22 },
  { name: "cecina enchilada 100g", cal: 260, p: 26, c: 4, f: 16 },
  { name: "gaznates poblanos 1 pieza", cal: 160, p: 2, c: 22, f: 7 },
  { name: "chongos zamoranos 1 porción", cal: 220, p: 6, c: 38, f: 5 },
  { name: "jericalla 1 porción", cal: 240, p: 6, c: 30, f: 10 },
  { name: "pozole verde con pollo 1 plato", cal: 420, p: 26, c: 46, f: 14 },
  { name: "pozole blanco con guarnición 1 plato", cal: 400, p: 24, c: 46, f: 13 },
  { name: "consomé de birria 1 taza", cal: 120, p: 12, c: 4, f: 6 },
  { name: "birria de chivo en su jugo 1 plato", cal: 380, p: 32, c: 6, f: 24 },
  { name: "chapulines tostados 30g", cal: 100, p: 18, c: 4, f: 2 },
  { name: "escamoles 100g", cal: 170, p: 18, c: 2, f: 10 },
  { name: "gusanos de maguey fritos 100g", cal: 240, p: 22, c: 4, f: 16 },
  { name: "chicatanas tostadas 30g", cal: 120, p: 14, c: 4, f: 6 },
  { name: "jumiles 30g", cal: 90, p: 14, c: 2, f: 3 },
  { name: "acociles fritos 100g", cal: 140, p: 22, c: 2, f: 5 },
  { name: "garnachas veracruzanas 3 piezas", cal: 320, p: 8, c: 40, f: 14 },
  { name: "empanadas de camote 1 pieza", cal: 220, p: 3, c: 32, f: 9 },
  { name: "clayuda con tasajo 1 pieza", cal: 620, p: 28, c: 62, f: 28 },
  { name: "huarache de nopal 1 pieza", cal: 280, p: 14, c: 24, f: 14 },
  // === OPCIONES KETO / BAJAS EN CARBOHIDRATOS ===
  { name: "harina de almendra 1/4 taza", cal: 160, p: 6, c: 6, f: 14 },
  { name: "harina de coco 2 cucharadas", cal: 60, p: 2, c: 8, f: 2 },
  { name: "pan keto casero 1 rebanada", cal: 90, p: 4, c: 3, f: 7 },
  { name: "tortilla de coliflor 1 pieza", cal: 40, p: 3, c: 5, f: 1 },
  { name: "tortilla de nopal 1 pieza", cal: 25, p: 2, c: 3, f: 1 },
  { name: "fideos de calabacita (zoodles) 1 taza", cal: 30, p: 2, c: 6, f: 0 },
  { name: "eritritol 1 cucharadita", cal: 0, p: 0, c: 0, f: 0 },
  { name: "pan de nube (cloud bread) 1 pieza", cal: 35, p: 3, c: 1, f: 2 },
  { name: "mug cake keto 1 pieza", cal: 220, p: 8, c: 6, f: 18 },
  { name: "grasa de tocino para cocinar 1 cucharada", cal: 115, p: 0, c: 0, f: 13 },
  { name: "caldo de hueso (bone broth) 1 taza", cal: 40, p: 9, c: 0, f: 1 },
  // === OPCIONES VEGANAS / VEGETARIANAS ===
  { name: "leche de avena sin azúcar 1 vaso 240ml", cal: 90, p: 2, c: 14, f: 3 },
  { name: "leche de coco para bebida 1 vaso 240ml", cal: 80, p: 1, c: 7, f: 5 },
  { name: "leche de arroz 1 vaso 240ml", cal: 113, p: 0, c: 22, f: 2 },
  { name: "yogur de coco natural 1 taza", cal: 180, p: 2, c: 8, f: 16 },
  { name: "yogur de almendra natural 1 taza", cal: 90, p: 2, c: 8, f: 5 },
  { name: "tempeh 100g", cal: 190, p: 20, c: 9, f: 11 },
  { name: "seitan 100g", cal: 370, p: 75, c: 14, f: 2 },
  { name: "hamburguesa de origen vegetal 1 pieza", cal: 250, p: 20, c: 14, f: 13 },
  { name: "chorizo vegano 100g", cal: 220, p: 18, c: 10, f: 12 },
  { name: "tocino vegano 2 tiras", cal: 60, p: 4, c: 3, f: 4 },
  { name: "queso vegano rebanada 1 pieza", cal: 70, p: 1, c: 4, f: 5 },
  { name: "mayonesa vegana 1 cucharada", cal: 90, p: 0, c: 1, f: 10 },
  { name: "crema vegana para cocinar 2 cucharadas", cal: 50, p: 0, c: 2, f: 4 },
  { name: "proteína de guisante en polvo 1 scoop 30g", cal: 110, p: 24, c: 2, f: 1 },
  { name: "proteína de arroz en polvo 1 scoop 30g", cal: 115, p: 22, c: 3, f: 1 },
  // === SIN GLUTEN ===
  { name: "pan sin gluten 1 rebanada", cal: 90, p: 2, c: 17, f: 2 },
  { name: "pasta de arroz cocida 1 taza", cal: 200, p: 4, c: 44, f: 1 },
  { name: "pasta de lenteja cocida 1 taza", cal: 230, p: 18, c: 40, f: 1 },
  { name: "galleta sin gluten 3 piezas", cal: 140, p: 2, c: 22, f: 5 },
  { name: "avena certificada sin gluten cruda 1/2 taza", cal: 150, p: 5, c: 27, f: 3 },
  { name: "harina de arroz 1/4 taza", cal: 145, p: 2, c: 32, f: 1 },
  { name: "cereal de arroz inflado 1 taza", cal: 90, p: 1, c: 21, f: 0 }
];

// Unidad de medida de un alimento (derivada del propio nombre: pieza, plato, taza...)
function foodUnit(food) {
    const n = ((food && food.name) || '').toLowerCase();
    const m = n.match(/\b(pieza|piezas|plato|platos|taza|tazas|vaso|vasos|rebanada|rebanadas|botella|lata|bolsa|copa|caballito|scoop|cucharada|cucharadas|orden|caja|barra|filete|huevos)\b/);
    if (m) {
        const map = { piezas: 'pieza', platos: 'plato', tazas: 'taza', vasos: 'vaso', rebanadas: 'rebanada', cucharadas: 'cucharada', huevos: 'huevo' };
        return map[m[1]] || m[1];
    }
    if (/100\s*g/.test(n)) return '100g';
    return 'porción';
}

// Sugerencias tipo autocompletado (Registrar + Asistente de comida).
// Muestra TODAS las coincidencias posibles, ordenadas de la A a la Z
// (el recuadro que las contiene ya tiene scroll propio y tamaño fijo,
// así que no hace falta recortar la lista a un puñado de opciones).
function findFoodSuggestions(query) {
    const norm = (s) => (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/_/g, ' ').replace(/\s+/g, ' ').trim();
    const q = norm(query);
    if (!q || q.length < 2) return [];
    const custom = (typeof loadCustomFoods === 'function') ? loadCustomFoods() : [];
    const all = [...FOOD_DATABASE, ...custom];
    const qWords = q.split(' ').filter(Boolean);
    const matches = [];
    for (const f of all) {
        const n = norm(f.name);
        let isMatch = false;
        if (n === q || n.startsWith(q) || n.includes(q)) {
            isMatch = true;
        } else {
            const nWords = n.split(' ');
            let hits = 0;
            for (const w of qWords) {
                if (nWords.some(x => x.startsWith(w) || (x.length >= 3 && w.startsWith(x)))) hits++;
            }
            if (hits > 0 && hits === qWords.length) isMatch = true;
        }
        if (isMatch) matches.push(f);
    }
    matches.sort((a, b) => a.name.localeCompare(b.name, 'es'));
    return matches;
}

/**
 * ================================================================
 * MOTOR DE CÁLCULO 100% LOCAL (reemplaza la IA)
 * ================================================================
 */

// Buscar alimento por matching del nombre más largo (igual que en app.js)
function findFood(query) {
    // Normaliza: minúsculas, sin acentos, sin guiones bajos.
    const norm = (s) => (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/_/g, ' ').replace(/\s+/g, ' ').trim();
    const q = norm(query);
    if (!q) return null;
    const customFoods = (typeof loadCustomFoods === 'function') ? loadCustomFoods() : [];
    const allFoods = [...FOOD_DATABASE, ...customFoods];

    // 1) Coincidencia directa por subcadena (la más específica gana).
    let best = null, bestLen = 0;
    for (const food of allFoods) {
        const n = norm(food.name);
        if (q.includes(n) || n.includes(q)) {
            if (n.length > bestLen) { bestLen = n.length; best = food; }
        }
    }
    if (best) return best;

    // 2) Fallback por palabras clave: tolera "taco de adobada" -> "tacos",
    //    "milanesa empanizada" -> "milanesa ...", ignora "de/con/en/al" etc.
    const stop = new Set(['de', 'con', 'la', 'el', 'un', 'una', 'al', 'a', 'y', 'en', 'sin', 'los', 'las', 'del', 'por', 'para']);
    const qWords = q.split(' ').filter(w => w.length >= 3 && !stop.has(w));
    if (qWords.length === 0) return null;
    let bestScore = 0;
    for (const food of allFoods) {
        const nWords = norm(food.name).split(' ');
        let score = 0;
        for (const qw of qWords) {
            for (const nw of nWords) {
                if (nw === qw || nw === qw + 's' || qw === nw + 's' || (qw.length >= 4 && nw.startsWith(qw)) || (nw.length >= 4 && qw.startsWith(nw))) {
                    score += Math.min(qw.length, nw.length);
                }
            }
        }
        if (score > bestScore) { bestScore = score; best = food; }
    }
    return bestScore > 0 ? best : null;
}

// Cargar alimentos personalizados que el usuario fue agregando
function loadCustomFoods() {
    const user = localStorage.getItem('arthur_current_user');
    if (!user) return [];
    try {
        const raw = localStorage.getItem(`arthur_data_${user}`);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed.customFoods) ? parsed.customFoods : [];
    } catch (e) { return []; }
}

// Top N alternativas con kcal similares (±tolerance, default 15%)
function findFoodSwaps(targetCal, tolerance = 0.15, max = 6) {
    if (!targetCal || targetCal <= 0) return [];
    const lo = targetCal * (1 - tolerance);
    const hi = targetCal * (1 + tolerance);
    return FOOD_DATABASE
        .filter(f => f.cal >= lo && f.cal <= hi)
        .sort((a, b) => Math.abs(a.cal - targetCal) - Math.abs(b.cal - targetCal))
        .slice(0, max);
}

// Top N ejercicios para compensar X kcal extra
function findCompensationOptions(extraCal, max = 5) {
    if (!extraCal || extraCal <= 0) return [];
    return ARTHUR_KNOWLEDGE.exercises_catalog
        .filter(ex => ex.cal > 0)
        .map(ex => {
            const ratio = extraCal / ex.cal;
            const baseVal = ex.baseVal || 1;
            return {
                name: ex.name,
                type: ex.type,
                unit: ex.unit,
                amount: Math.ceil(baseVal * ratio),
                desc: ex.desc
            };
        })
        .filter(opt => opt.amount > 0 && opt.amount <= 200)
        .sort((a, b) => a.amount - b.amount)
        .slice(0, max);
}

// BMR — Mifflin-St Jeor
function calculateBMR(sex, weight, heightM, age) {
    if (!weight || !heightM || !age) return 0;
    const heightCm = heightM * 100;
    if (sex === 'm') return Math.round(10 * weight + 6.25 * heightCm - 5 * age + 5);
    return Math.round(10 * weight + 6.25 * heightCm - 5 * age - 161);
}

// TDEE = BMR × factor de actividad
function calculateTDEE(bmr, activityFactor) {
    return Math.round(bmr * (activityFactor || 1.55));
}

// Recomendación de límite calórico para perder peso
function recommendCalorieLimit(tdee, weightCurrent, weightTarget) {
    if (!tdee || !weightCurrent) return tdee;
    if (weightCurrent <= weightTarget) return tdee; // mantener
    // Déficit moderado: ~500 kcal/día = 0.5 kg/sem (recomendado por OMS)
    const limit = tdee - 500;
    // Mínimo de seguridad: 1200 mujer, 1500 hombre
    return Math.max(1200, limit);
}

// Días para llegar a meta según déficit promedio diario
function projectGoalDays(currentWeight, targetWeight, avgDailyDeficit) {
    if (!currentWeight || !targetWeight || !avgDailyDeficit || avgDailyDeficit <= 0) return null;
    const kgToLose = currentWeight - targetWeight;
    if (kgToLose <= 0) return 0;
    // 7700 kcal ≈ 1 kg de grasa
    const totalKcalToLose = kgToLose * 7700;
    return Math.ceil(totalKcalToLose / avgDailyDeficit);
}

// Análisis algorítmico de sensaciones según contexto
function analyzeSensation(type, detail, ctx) {
    // ctx = { caloriesConsumedToday, caloriesBurnedToday, dailyCalLimit, foodLogToday, weight }
    const consumed = ctx.caloriesConsumedToday || 0;
    const burned = ctx.caloriesBurnedToday || 0;
    const limit = ctx.dailyCalLimit || 1600;
    const remaining = limit - consumed + burned;
    const isOverLimit = remaining < 0;
    const hour = new Date().getHours();
    const meals = (ctx.foodLogToday || []).length;

    if (type === 'hunger') {
        if (isOverLimit) {
            return `⛔ Ya superaste tu límite diario por ${Math.abs(remaining)} kcal. NO comas nada. Protocolo:\n• Bebe 500 ml agua fría con limón\n• 5 min plancha + 30 sentadillas\n• Té verde sin azúcar\n• Distrae con actividad 20 min — el antojo pasa en 18-20 min real`;
        }
        if (remaining > 400) {
            return `✅ Te quedan ${remaining} kcal disponibles hoy. Opciones bajas en kcal:\n• Zanahoria rallada con limón y chile (40 kcal/100g)\n• Pepino con tajín (16 kcal/100g)\n• 2 claras de huevo cocidas (34 kcal)\n• Té verde caliente sin azúcar\n• Si tienes hambre real, come tu siguiente comida programada`;
        }
        return `⚠️ Solo te quedan ${remaining} kcal. Aguanta con:\n• 500 ml agua + sal de mar (electrolitos suprimen hambre)\n• Café negro o té verde sin azúcar\n• Goma de mascar sin azúcar\n• Cepilla los dientes (corta el deseo)`;
    }

    if (type === 'symptom') {
        const txt = (detail || '').toLowerCase();
        if (txt.includes('mareo') || txt.includes('debil')) {
            return `⚠️ Mareo o debilidad — probable bajo nivel de glucosa o electrolitos:\n• Bebe 500 ml agua con 1 pizca sal y ½ limón\n• 1 fruta pequeña (plátano, manzana)\n• Siéntate 10 min, levanta piernas\n• Si persiste >30 min: come, no entrenes hoy`;
        }
        if (txt.includes('dolor') && (txt.includes('cabeza') || txt.includes('migraña'))) {
            return `⚠️ Dolor de cabeza — usual por deshidratación o cafeína:\n• 750 ml agua YA\n• Café negro o té (si no tomaste hoy)\n• 5 min respiración profunda\n• Aplica frío en nuca\n• Si es dolor agudo en pecho/brazo: VE AL DOCTOR`;
        }
        if (txt.includes('calambre') || txt.includes('musc')) {
            return `⚠️ Calambre muscular — falta de magnesio/sodio/agua:\n• Estira lento 30 seg\n• 500 ml agua con sal de mar y limón\n• 1 plátano o aguacate\n• Si fue durante ejercicio: para hoy, retoma mañana`;
        }
        if (txt.includes('cansado') || txt.includes('cansa') || txt.includes('fatig')) {
            return `⚠️ Fatiga — revisa:\n• ¿Dormiste >7h ayer?\n• ¿Comiste suficiente proteína hoy? (debes llevar ~${Math.round(ctx.weight * 1.5)}g)\n• 5 min caminata al sol\n• 1 vaso agua + electrolitos\n• Si llevas <3 comidas hoy, come ya`;
        }
        return `⚠️ Síntoma registrado: "${detail}". Protocolo general:\n• Hidrátate (500 ml agua)\n• Descansa 10 min\n• Si dolor agudo, mareo fuerte o pulso >100 en reposo: VE AL DOCTOR\n• Anota cuándo y con qué comida apareció (para detectar patrón)`;
    }

    if (type === 'mood') {
        if (hour < 11 && meals === 0) {
            return `🧠 Aún no desayunaste. La energía mental requiere glucosa estable:\n• Desayuna ya: 3 huevos + 1 tortilla + café negro\n• 5 min sol directo (regula cortisol)\n• 10 respiraciones diafragmáticas\n• Hidrátate (1 vaso agua antes de cualquier cosa)`;
        }
        if (hour >= 14 && hour <= 17) {
            return `🧠 Bajón de tarde — normal por insulina post-comida:\n• Caminata corta 10 min (mejor que café)\n• Té verde sin azúcar\n• Si llevas <60g proteína, agrega 1 huevo o atún\n• 5 min frío en cara (activa nervio vago)`;
        }
        if (isOverLimit) {
            return `🧠 Si te sientes mal por haber excedido kcal: NO te castigues con dieta extrema mañana — eso rompe el ciclo. Compensa con 30 min HIIT hoy y vuelve al protocolo mañana sin cambios.`;
        }
        return `🧠 Estado mental: "${detail}". Reseteo rápido:\n• 10 respiraciones lentas (4 seg in / 6 seg out)\n• Caminata 10 min (cualquier dirección)\n• Bebe agua\n• Anota 1 cosa que sí saliste bien hoy\n• Vuelve al plan, no al hábito viejo`;
    }
    return `Sensación registrada: "${detail}".`;
}

