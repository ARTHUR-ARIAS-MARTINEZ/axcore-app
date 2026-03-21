const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
app.use(cors());
app.use(express.json());

// ============================================================
// BASE DE DATOS EN LA NUBE (npoint.io - 100% gratis, sin cuenta)
// Persiste para siempre. Lectura y escritura via JSON REST.
// ============================================================
const DB_URL = "https://api.npoint.io/3540867fff5ccdedc4d6";

// Memoria RAM activa (espejo de la nube)
let db = {
    gyms: [],
    clientCodes: []
};

// --- SINCRONIZACIÓN CON LA NUBE ---

async function saveToCloud() {
    try {
        const res = await fetch(DB_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(db)
        });
        if (res.ok) {
            console.log(`☁️ GUARDADO → Gyms: ${db.gyms.length}, Codes: ${db.clientCodes.length}`);
        } else {
            console.error("❌ Error al guardar:", res.status, await res.text());
        }
    } catch(e) {
        console.error("❌ Error de red al guardar:", e.message);
    }
}

async function loadFromCloud() {
    try {
        const res = await fetch(DB_URL);
        if (res.ok) {
            const data = await res.json();
            if (data && Array.isArray(data.gyms) && Array.isArray(data.clientCodes)) {
                db = data;
            }
        }
        console.log(`✅ CARGADO → Gyms: ${db.gyms.length}, Codes: ${db.clientCodes.length}`);
    } catch(e) {
        console.error("⚠️ No se pudo cargar desde nube:", e.message);
    }
}

// ============================================================
// RUTAS DEL PANEL MAESTRO (admin.html / admin.js)
// ============================================================

app.get('/api/admin/gyms', (req, res) => {
    const formatted = db.gyms.map(g => {
        const count = db.clientCodes.filter(c => c.gymCode === g.gymCode).length;
        return { ...g, currentUsers: count };
    });
    res.json({ success: true, gyms: formatted });
});

app.post('/api/admin/gyms', async (req, res) => {
    const data = req.body;
    data.active = true;
    data.password = data.password || '1234';
    data.createdAt = new Date().toISOString();

    if (!db.gyms.find(g => g.gymCode === data.gymCode)) {
        db.gyms.push(data);
        await saveToCloud();
    }
    res.json({ success: true, gym: data });
});

app.post('/api/admin/toggle', async (req, res) => {
    const { gymCode, status } = req.body;
    const gym = db.gyms.find(g => g.gymCode === gymCode);
    if (gym) {
        gym.active = status;
        await saveToCloud();
    }
    res.json({ success: true, message: `Gimnasio ${gymCode} actualizado` });
});

app.delete('/api/admin/gyms/:gymCode', async (req, res) => {
    db.gyms = db.gyms.filter(g => g.gymCode !== req.params.gymCode);
    db.clientCodes = db.clientCodes.filter(c => c.gymCode !== req.params.gymCode);
    await saveToCloud();
    res.json({ success: true });
});

// ============================================================
// RUTAS DEL PANEL COACH (coach.html)
// ============================================================

app.post('/api/coach/login', (req, res) => {
    const { gymCode, password } = req.body;

    if (gymCode === "GYM-MASTER" && password === "1234") {
        return res.json({
            success: true,
            gym: { name: "Máquina Principal", maxUsers: 9999, active: true, gymCode: "GYM-MASTER" },
            currentUsers: db.clientCodes.filter(c => c.gymCode === "GYM-MASTER").length
        });
    }

    const gym = db.gyms.find(g => g.gymCode === gymCode);
    if (!gym) return res.json({ success: false, message: "CÓDIGO DE FRANQUICIA INEXISTENTE" });
    if (!gym.active) return res.json({ success: false, message: "SISTEMA CONGELADO. CONTACTA AX-CORE MÁSTER." });
    if (gym.password !== password) return res.json({ success: false, message: "CONTRASEÑA INCORRECTA" });

    const usageCount = db.clientCodes.filter(c => c.gymCode === gymCode).length;
    res.json({ success: true, gym, currentUsers: usageCount });
});

app.get('/api/coach/codes/:gymCode', (req, res) => {
    res.json(db.clientCodes.filter(c => c.gymCode === req.params.gymCode));
});

app.post('/api/coach/generate', async (req, res) => {
    const { gymId, user } = req.body;

    let limit = 50;
    if (gymId !== "GYM-MASTER") {
        const gym = db.gyms.find(g => g.gymCode === gymId);
        if (!gym) return res.json({ success: false, message: "Franquicia no encontrada." });
        if (!gym.active) return res.json({ success: false, message: "SISTEMA PAUSADO POR AX-CORE." });
        limit = gym.maxUsers || 50;
    } else {
        limit = 9999;
    }

    const currentCount = db.clientCodes.filter(c => c.gymCode === gymId).length;
    if (currentCount >= limit) {
        return res.json({ success: false, message: `LÍMITE ALCANZADO (${limit} códigos). Mejore su plan.` });
    }

    const newCode = `AX-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
    db.clientCodes.push({
        code: newCode,
        gymCode: gymId,
        active: true,
        user: user || "Atleta",
        createdAt: new Date().toISOString()
    });
    await saveToCloud();

    res.json({ success: true, code: newCode, remaining: limit - (currentCount + 1) });
});

app.post('/api/coach/toggle', async (req, res) => {
    const { code, status } = req.body;
    const cc = db.clientCodes.find(c => c.code === code);
    if (cc) {
        cc.active = status;
        await saveToCloud();
    }
    res.json({ success: true });
});

// ============================================================
// VALIDACIÓN PARA LA APP DEL USUARIO (app.js)
// ============================================================

app.post('/api/validate', (req, res) => {
    const { code } = req.body;

    // Códigos maestros
    if (code === "AXV-DEMO" || code === "GYM-MASTER" || code === "AXV-ADMIN") {
        return res.json({ success: true, message: "ACCESO ALFA OTORGADO." });
    }

    // Buscar código generado por un coach
    const pass = db.clientCodes.find(c => c.code === code);
    if (pass) {
        if (!pass.active) {
            return res.json({ success: false, message: "ACCESO DENEGADO POR TU RECEPCIÓN. CORTADO TEMPORALMENTE." });
        }
        if (pass.gymCode !== "GYM-MASTER") {
            const gym = db.gyms.find(g => g.gymCode === pass.gymCode);
            if (gym && !gym.active) {
                return res.json({ success: false, message: "FRANQUICIA SIN PAGO ACTIVO. COMUNÍCATE CON EL DUEÑO." });
            }
            return res.json({ success: true, message: "ACCESO ÉLITE CONCEDIDO.", apiKey: gym ? gym.apiKey : "" });
        }
        return res.json({ success: true, message: "ACCESO ALFA CONCEDIDO." });
    }

    res.json({ success: false, message: "CÓDIGO INEXISTENTE. Pide uno en la recepción del gimnasio." });
});

// ============================================================
// HEALTH & DEBUG
// ============================================================

app.get('/health', (req, res) => {
    res.json({
        status: "AX-CORE BACKEND ONLINE",
        gyms: db.gyms.length,
        codes: db.clientCodes.length
    });
});

app.get('/api/debug/all', (req, res) => {
    res.json(db);
});

// ============================================================
// INICIO
// ============================================================

async function startServer() {
    await loadFromCloud();
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`🚀 AX-CORE Backend en puerto ${PORT}`);
    });
}
startServer();
