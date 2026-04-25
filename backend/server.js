const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const app = express();
app.use(cors());
app.use(express.json());

// ============================================================
// CONFIGURACIÓN — variables de entorno (Render)
// ============================================================
// ADMIN_TOKEN — clave del panel maestro. DEBE definirse en Render.
// DB_URL      — endpoint de la base de datos en la nube.
// ============================================================
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || '';
const DB_URL = process.env.DB_URL || 'https://api.npoint.io/3540867fff5ccdedc4d6';

if (!ADMIN_TOKEN) {
    console.warn('⚠️  ADMIN_TOKEN no está definido. Los endpoints de admin estarán bloqueados hasta que lo configures en Render.');
}

// ============================================================
// MEMORIA RAM (espejo de la nube)
// ============================================================
let db = {
    gyms: [],
    clientCodes: []
};

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
            console.error('❌ Error al guardar:', res.status);
        }
    } catch(e) {
        console.error('❌ Error de red al guardar:', e.message);
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
        console.error('⚠️ No se pudo cargar desde nube:', e.message);
    }
}

// ============================================================
// HELPERS DE SEGURIDAD
// ============================================================

// Comparación segura contra timing attacks
function safeCompare(a, b) {
    if (typeof a !== 'string' || typeof b !== 'string') return false;
    const bufA = Buffer.from(a);
    const bufB = Buffer.from(b);
    if (bufA.length !== bufB.length) return false;
    return crypto.timingSafeEqual(bufA, bufB);
}

// Middleware: solo deja pasar requests con header X-Admin-Token correcto
function requireAdminAuth(req, res, next) {
    if (!ADMIN_TOKEN) {
        return res.status(503).json({ success: false, message: 'Servidor sin ADMIN_TOKEN configurado.' });
    }
    const provided = req.header('X-Admin-Token') || '';
    if (!safeCompare(provided, ADMIN_TOKEN)) {
        return res.status(401).json({ success: false, message: 'No autorizado.' });
    }
    next();
}

// Hash bcrypt para contraseñas de gym
async function hashPassword(plain) {
    if (!plain) return '';
    if (typeof plain === 'string' && plain.startsWith('$2')) return plain; // ya hasheada
    return await bcrypt.hash(String(plain), 10);
}

// Compara plain con hash O con plaintext legacy (compatibilidad retro mientras migra DB)
async function comparePassword(plain, stored) {
    if (!plain || !stored) return false;
    if (typeof stored === 'string' && stored.startsWith('$2')) {
        return await bcrypt.compare(String(plain), stored);
    }
    // Compat con DB vieja (texto plano). Después del primer login exitoso se rehashea.
    return safeCompare(String(plain), String(stored));
}

// Devuelve una copia del gym sin el campo password
function stripPassword(gym) {
    const { password, ...safe } = gym;
    return safe;
}

// ============================================================
// LOGIN ADMIN — verifica token sin exponer info
// ============================================================
app.post('/api/admin/login', (req, res) => {
    const { token } = req.body || {};
    if (!ADMIN_TOKEN) {
        return res.status(503).json({ success: false, message: 'Servidor sin ADMIN_TOKEN configurado.' });
    }
    if (!safeCompare(String(token || ''), ADMIN_TOKEN)) {
        return res.status(401).json({ success: false, message: 'Clave maestra incorrecta.' });
    }
    res.json({ success: true });
});

// ============================================================
// RUTAS DEL PANEL MAESTRO (admin) — TODAS PROTEGIDAS
// ============================================================

app.get('/api/admin/gyms', requireAdminAuth, (req, res) => {
    const formatted = db.gyms.map(g => {
        const count = db.clientCodes.filter(c => c.gymCode === g.gymCode).length;
        return { ...stripPassword(g), currentUsers: count };
    });
    res.json({ success: true, gyms: formatted });
});

app.post('/api/admin/gyms', requireAdminAuth, async (req, res) => {
    const data = req.body;
    if (!data || !data.gymCode) {
        return res.status(400).json({ success: false, message: 'gymCode requerido.' });
    }
    data.active = true;
    data.createdAt = new Date().toISOString();
    // Hashear password antes de guardar
    data.password = await hashPassword(data.password || '1234');

    if (!db.gyms.find(g => g.gymCode === data.gymCode)) {
        db.gyms.push(data);
        await saveToCloud();
    }
    res.json({ success: true, gym: stripPassword(data) });
});

app.post('/api/admin/toggle', requireAdminAuth, async (req, res) => {
    const { gymCode, status } = req.body || {};
    const gym = db.gyms.find(g => g.gymCode === gymCode);
    if (gym) {
        gym.active = !!status;
        await saveToCloud();
    }
    res.json({ success: true, message: `Gimnasio ${gymCode} actualizado` });
});

app.delete('/api/admin/gyms/:gymCode', requireAdminAuth, async (req, res) => {
    db.gyms = db.gyms.filter(g => g.gymCode !== req.params.gymCode);
    db.clientCodes = db.clientCodes.filter(c => c.gymCode !== req.params.gymCode);
    await saveToCloud();
    res.json({ success: true });
});

// ============================================================
// RUTAS DEL PANEL COACH (coach) — auth con código + contraseña
// ============================================================

app.post('/api/coach/login', async (req, res) => {
    const { gymCode, password } = req.body || {};
    if (!gymCode || !password) {
        return res.json({ success: false, message: 'Faltan credenciales.' });
    }
    const gym = db.gyms.find(g => g.gymCode === gymCode);
    if (!gym) return res.json({ success: false, message: 'CÓDIGO DE FRANQUICIA INEXISTENTE' });
    if (!gym.active) return res.json({ success: false, message: 'SISTEMA CONGELADO. CONTACTA AX-CORE MÁSTER.' });

    const ok = await comparePassword(password, gym.password);
    if (!ok) return res.json({ success: false, message: 'CONTRASEÑA INCORRECTA' });

    // Si la password venía en plaintext (legacy), la rehasheamos en este login
    if (gym.password && !String(gym.password).startsWith('$2')) {
        gym.password = await hashPassword(password);
        await saveToCloud();
    }

    const usageCount = db.clientCodes.filter(c => c.gymCode === gymCode).length;
    res.json({ success: true, gym: stripPassword(gym), currentUsers: usageCount });
});

app.get('/api/coach/codes/:gymCode', (req, res) => {
    res.json(db.clientCodes.filter(c => c.gymCode === req.params.gymCode));
});

app.post('/api/coach/generate', async (req, res) => {
    const { gymId, user } = req.body || {};
    const gym = db.gyms.find(g => g.gymCode === gymId);
    if (!gym) return res.json({ success: false, message: 'Franquicia no encontrada.' });
    if (!gym.active) return res.json({ success: false, message: 'SISTEMA PAUSADO POR AX-CORE.' });
    const limit = gym.maxUsers || 50;

    const currentCount = db.clientCodes.filter(c => c.gymCode === gymId).length;
    if (currentCount >= limit) {
        return res.json({ success: false, message: `LÍMITE ALCANZADO (${limit} códigos). Mejore su plan.` });
    }

    const newCode = `AX-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
    db.clientCodes.push({
        code: newCode,
        gymCode: gymId,
        active: true,
        user: user || 'Atleta',
        createdAt: new Date().toISOString()
    });
    await saveToCloud();

    res.json({ success: true, code: newCode, remaining: limit - (currentCount + 1) });
});

app.post('/api/coach/toggle', async (req, res) => {
    const { code, status } = req.body || {};
    const cc = db.clientCodes.find(c => c.code === code);
    if (cc) {
        cc.active = !!status;
        await saveToCloud();
    }
    res.json({ success: true });
});

app.delete('/api/coach/users/:code', async (req, res) => {
    const code = req.params.code;
    const initialLen = db.clientCodes.length;
    db.clientCodes = db.clientCodes.filter(c => c.code !== code);

    if (db.clientCodes.length < initialLen) {
        await saveToCloud();
        res.json({ success: true, message: 'Usuario eliminado definitivamente.' });
    } else {
        res.status(404).json({ success: false, message: 'Usuario no encontrado.' });
    }
});

// ============================================================
// VALIDACIÓN PARA LA APP DEL USUARIO (atleta)
// ============================================================

app.post('/api/validate', (req, res) => {
    const { code } = req.body || {};
    if (!code) return res.json({ success: false, message: 'Código requerido.' });

    // Solo AXV-DEMO queda como código de prueba abierto
    if (code === 'AXV-DEMO') {
        return res.json({ success: true, message: 'ACCESO DEMO OTORGADO.' });
    }

    const pass = db.clientCodes.find(c => c.code === code);
    if (pass) {
        if (!pass.active) {
            return res.json({ success: false, message: 'ACCESO DENEGADO POR TU RECEPCIÓN. CORTADO TEMPORALMENTE.' });
        }
        const gym = db.gyms.find(g => g.gymCode === pass.gymCode);
        if (gym && !gym.active) {
            return res.json({ success: false, message: 'FRANQUICIA SIN PAGO ACTIVO. COMUNÍCATE CON EL DUEÑO.' });
        }
        return res.json({ success: true, message: 'ACCESO ÉLITE CONCEDIDO.' });
    }

    res.json({ success: false, message: 'CÓDIGO INEXISTENTE. Pide uno en la recepción del gimnasio.' });
});

// ============================================================
// HEALTH (sin info sensible)
// ============================================================

app.get('/health', (req, res) => {
    res.json({
        status: 'AX-CORE BACKEND ONLINE',
        gyms: db.gyms.length,
        codes: db.clientCodes.length
    });
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
