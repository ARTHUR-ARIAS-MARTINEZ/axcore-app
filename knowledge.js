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
  { name: "omega-3 1 capsula", cal: 10, p: 0, c: 0, f: 1 }
];

/**
 * ================================================================
 * MOTOR DE CÁLCULO 100% LOCAL (reemplaza la IA)
 * ================================================================
 */

// Buscar alimento por matching del nombre más largo (igual que en app.js)
function findFood(query) {
    const ldesc = (query || '').toLowerCase().trim();
    if (!ldesc) return null;
    let best = null, bestLen = 0;
    const customFoods = (typeof loadCustomFoods === 'function') ? loadCustomFoods() : [];
    const allFoods = [...FOOD_DATABASE, ...customFoods];
    for (const food of allFoods) {
        if (ldesc.includes(food.name) || food.name.includes(ldesc)) {
            if (food.name.length > bestLen) {
                bestLen = food.name.length;
                best = food;
            }
        }
    }
    return best;
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

