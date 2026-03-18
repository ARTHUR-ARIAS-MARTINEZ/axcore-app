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
        { name: "Kettlebell Swing", desc: "~1.1 cal/swing. Cadera como motor.", cal: 55, type: "HIIT", unit: "Series de 20", baseVal: 4 },
        { name: "Saco de Boxeo", desc: "Quema ~11 cal/min. Combos 2-3 min/round.", cal: 165, type: "HIIT", unit: "Minutos", baseVal: 15 },
        // === PIERNA ===
        { name: "Sentadillas Libres", desc: "~0.5 cal/rep. Paralelo completo.", cal: 40, type: "Pierna", unit: "Series de 20", baseVal: 4 },
        { name: "Sentadilla Copa (Goblet)", desc: "~0.6 cal/rep. 1 mancuerna al pecho.", cal: 50, type: "Pierna", unit: "Series de 15", baseVal: 4 },
        { name: "Desplantes (Lunges)", desc: "~0.6 cal/rep por pierna.", cal: 45, type: "Pierna", unit: "Series de 15", baseVal: 4 },
        { name: "Peso Muerto Rumano", desc: "~0.7 cal/rep. Tensión en femorales.", cal: 55, type: "Pierna", unit: "Series de 12", baseVal: 4 },
        { name: "Sumo Squat", desc: "~0.5 cal/rep. Piernas separadas, punta fuera.", cal: 40, type: "Pierna", unit: "Series de 20", baseVal: 4 },
        { name: "Elevación de Talones (Calf Raise)", desc: "~0.3 cal/rep. Quema en pantorrilla.", cal: 30, type: "Pantorrilla", unit: "Series de 25", baseVal: 4 },
        // === GLÚTEO ===
        { name: "Hip Thrust (Empuje Cadera)", desc: "~0.8 cal/rep. El rey del glúteo.", cal: 60, type: "Glúteo", unit: "Series de 15", baseVal: 4 },
        { name: "Elevación de Pelvis (Glute Bridge)", desc: "~0.5 cal/rep. Contracción 1 seg arriba.", cal: 40, type: "Glúteo", unit: "Series de 20", baseVal: 4 },
        { name: "Patada Trasera (Kickback)", desc: "~0.4 cal/rep por pierna. Cuadrupedia.", cal: 30, type: "Glúteo", unit: "Series de 20", baseVal: 4 },
        { name: "Abducción Lateral", desc: "~0.3 cal/rep. Tumbado de lado o de pie.", cal: 25, type: "Glúteo", unit: "Series de 20", baseVal: 4 },
        // === PECHO / ESPALDA / HOMBROS ===
        { name: "Flexiones (Lagartijas)", desc: "~0.5 cal/rep. Cuerpo alineado.", cal: 30, type: "Pecho", unit: "Series de 15", baseVal: 4 },
        { name: "Press de Pecho en Suelo", desc: "~0.5 cal/rep con mancuernas.", cal: 35, type: "Pecho", unit: "Series de 12", baseVal: 4 },
        { name: "Dominadas (Pull-ups)", desc: "~1 cal/rep. Agarre prono sobre barra.", cal: 50, type: "Espalda", unit: "Series de 8", baseVal: 4 },
        { name: "Remo a un Brazo", desc: "~0.5 cal/rep. Cada lado.", cal: 30, type: "Espalda", unit: "Series de 12", baseVal: 4 },
        { name: "Superman en Suelo", desc: "~0.3 cal/rep. Extensión lumbar.", cal: 20, type: "Espalda", unit: "Series de 15", baseVal: 4 },
        { name: "Press Militar con Mancuernas", desc: "~0.5 cal/rep. Hombro enfocado.", cal: 35, type: "Hombros", unit: "Series de 10", baseVal: 4 },
        { name: "Aperturas Laterales", desc: "~0.3 cal/rep. Sin balanceo.", cal: 20, type: "Hombros", unit: "Series de 15", baseVal: 4 },
        { name: "Face Pulls con Banda/Pesa", desc: "~0.3 cal/rep. Postura y hombro posterior.", cal: 20, type: "Hombros", unit: "Series de 20", baseVal: 4 },
        // === BÍCEPS / TRÍCEPS ===
        { name: "Curl de Bíceps", desc: "~0.4 cal/rep. Control de bajada.", cal: 25, type: "Bíceps", unit: "Series de 12", baseVal: 4 },
        { name: "Curl Martillo", desc: "~0.4 cal/rep. Antebrazo activo.", cal: 25, type: "Bíceps", unit: "Series de 12", baseVal: 4 },
        { name: "Fondos en Silla/Banco (Dips)", desc: "~0.8 cal/rep. Tríceps completo.", cal: 40, type: "Tríceps", unit: "Series de 12", baseVal: 4 },
        { name: "Patada de Tríceps", desc: "~0.3 cal/rep. Codo fijo.", cal: 20, type: "Tríceps", unit: "Series de 15", baseVal: 4 },
        { name: "Copa de Tríceps (Overhead)", desc: "~0.4 cal/rep. Extensión atrás.", cal: 25, type: "Tríceps", unit: "Series de 12", baseVal: 4 },
        // === CORE ===
        { name: "Plancha Abdominal", desc: "~5 cal/min. Activa core completo.", cal: 20, type: "Core", unit: "Minutos", baseVal: 4 },
        { name: "Abdominales Crunch", desc: "~0.3 cal/rep. Ombligo hacia adentro.", cal: 20, type: "Core", unit: "Series de 25", baseVal: 4 },
        { name: "Tijeras (Leg Raises)", desc: "~0.5 cal/rep. Lumbares en suelo.", cal: 30, type: "Core", unit: "Series de 20", baseVal: 4 },
        { name: "Russian Twists", desc: "~0.4 cal/rep. Rotación con o sin peso.", cal: 25, type: "Core", unit: "Series de 20", baseVal: 4 },
        // === CALISTENIA ===
        { name: "Dips en Paralelas", desc: "~1 cal/rep. Pecho + Tríceps.", cal: 55, type: "Calistenia", unit: "Series de 10", baseVal: 4 },
        { name: "Pike Push-ups", desc: "~0.6 cal/rep. Hombro calistenia.", cal: 35, type: "Calistenia", unit: "Series de 10", baseVal: 4 },
        // === PREPARACIÓN CARRERA ===
        { name: "Intervalos HIIT (Sprints)", desc: "20 seg sprint / 40 seg descanso. Quema ~18 cal/min activo.", cal: 180, type: "Carrera", unit: "Minutos totales", baseVal: 15 },
        { name: "Fartlek (Correr libre)", desc: "Alternancia libre de velocidad. ~12 cal/min.", cal: 240, type: "Carrera", unit: "Minutos", baseVal: 20 }
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

// La API Key ofuscada (Arthur la configura desde el Admin)
const _AX_K = [112,112,108,120,45,56,79,104,53,103,72,77,70,49,70,55,104,54,79,57,97,52,80,74,80,113,70,87,73,116,120,49,76,65,57,106,57,78,109,76,51,97,122,56,115,89,71,49,88,113,111,99,48];
function _axDecode() { return _AX_K.map(c => String.fromCharCode(c)).join(''); }

/**
 * GYM_CODES ahora se carga DINÁMICAMENTE desde localStorage (admin genera los códigos).
 * Se mantiene AXV-DEMO como código de prueba manual.
 */
const GYM_CODES_STATIC = {
    "AXV-DEMO": { plan: "basico", active: true }
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

// Función para obtener la API Key real desde un código válido
function getApiKeyFromCode(code) {
    const allCodes = loadGymCodes();
    const codeInfo = allCodes[code];
    
    if (!codeInfo) return null;
    if (codeInfo.active === false) return null;
    
    // Verificar límite de usuarios según el plan
    const planKey = codeInfo.plan || "basico";
    const plan = AX_PLANS[planKey];
    const maxUsers = codeInfo.maxUsers || (plan ? plan.maxUsers : 50);
    const currentUsers = countUsersWithCode(code);
    
    if (currentUsers >= maxUsers) {
        return { error: "LÍMITE_USUARIOS", message: `Este código ya alcanzó su límite de ${maxUsers} usuarios (Plan ${plan ? plan.name : 'BÁSICO'}). El dueño del gimnasio debe contactar a AX-CORE para ampliar su plan.` };
    }
    
    return _axDecode();
}


