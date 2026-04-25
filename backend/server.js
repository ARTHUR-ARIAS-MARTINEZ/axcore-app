const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const mongoose = require('mongoose');

const app = express();
app.use(cors());
app.use(express.json());

// ============================================================
// VARIABLES DE ENTORNO (configurar en Render)
// ADMIN_TOKEN — clave del panel maestro
// MONGO_URI   — connection string de MongoDB Atlas
// ============================================================
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || '';
const MONGO_URI   = process.env.MONGO_URI   || '';

if (!ADMIN_TOKEN) console.warn('⚠️  ADMIN_TOKEN no definido en variables de entorno.');
if (!MONGO_URI)   console.warn('⚠️  MONGO_URI no definido. La base de datos no funcionará.');

// ============================================================
// MODELOS DE MONGOOSE
// ============================================================
const gymSchema = new mongoose.Schema({
    gymCode:   { type: String, required: true, unique: true },
    name:      { type: String, required: true },
    owner:     { type: String, default: '' },
    manager:   { type: String, default: '' },
    coach:     { type: String, default: '' },
    plan:      { type: String, default: 'basico' },
    maxUsers:  { type: Number, default: 50 },
    rent:      { type: Number, default: 1500 },
    active:    { type: Boolean, default: true },
    blockId:   { type: String, default: '' },
    password:  { type: String, default: '' },
    createdAt: { type: Date, default: Date.now }
});

const codeSchema = new mongoose.Schema({
    code:      { type: String, required: true, unique: true },
    gymCode:   { type: String, required: true },
    active:    { type: Boolean, default: true },
    user:      { type: String, default: 'Atleta' },
    createdAt: { type: Date, default: Date.now }
});

const Gym  = mongoose.model('Gym', gymSchema);
const Code = mongoose.model('Code', codeSchema);

// ============================================================
// HELPERS DE SEGURIDAD
// ============================================================
function safeCompare(a, b) {
    if (typeof a !== 'string' || typeof b !== 'string') return false;
    if (a.length !== b.length) return false;
    try {
        return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
    } catch { return false; }
}

function requireAdminAuth(req, res, next) {
    if (!ADMIN_TOKEN) return res.status(503).json({ success: false, message: 'ADMIN_TOKEN no configurado.' });
    const provided = req.header('X-Admin-Token') || '';
    if (!safeCompare(provided, ADMIN_TOKEN)) return res.status(401).json({ success: false, message: 'No autorizado.' });
    next();
}

async function hashPassword(plain) {
    if (!plain) return '';
    if (String(plain).startsWith('$2')) return plain;
    return await bcrypt.hash(String(plain), 10);
}

async function comparePassword(plain, stored) {
    if (!plain || !stored) return false;
    if (String(stored).startsWith('$2')) return await bcrypt.compare(String(plain), stored);
    return safeCompare(String(plain), String(stored));
}

function stripPassword(doc) {
    const obj = doc.toObject ? doc.toObject() : { ...doc };
    delete obj.password;
    delete obj.__v;
    return obj;
}

// ============================================================
// LOGIN ADMIN
// ============================================================
app.post('/api/admin/login', (req, res) => {
    if (!ADMIN_TOKEN) return res.status(503).json({ success: false, message: 'ADMIN_TOKEN no configurado.' });
    const { token } = req.body || {};
    if (!safeCompare(String(token || ''), ADMIN_TOKEN)) return res.status(401).json({ success: false, message: 'Clave maestra incorrecta.' });
    res.json({ success: true });
});

// ============================================================
// PANEL MAESTRO — todos protegidos con requireAdminAuth
// ============================================================
app.get('/api/admin/gyms', requireAdminAuth, async (req, res) => {
    try {
        const gyms = await Gym.find({});
        const result = await Promise.all(gyms.map(async g => {
            const count = await Code.countDocuments({ gymCode: g.gymCode });
            return { ...stripPassword(g), currentUsers: count };
        }));
        res.json({ success: true, gyms: result });
    } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

app.post('/api/admin/gyms', requireAdminAuth, async (req, res) => {
    try {
        const data = req.body;
        if (!data?.gymCode) return res.status(400).json({ success: false, message: 'gymCode requerido.' });
        data.password = await hashPassword(data.password || String(Math.floor(1000 + Math.random() * 9000)));
        data.active = true;
        const gym = await Gym.findOneAndUpdate(
            { gymCode: data.gymCode },
            data,
            { upsert: true, new: true }
        );
        res.json({ success: true, gym: stripPassword(gym) });
    } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

app.post('/api/admin/toggle', requireAdminAuth, async (req, res) => {
    try {
        const { gymCode, status } = req.body || {};
        await Gym.updateOne({ gymCode }, { active: !!status });
        res.json({ success: true });
    } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

app.delete('/api/admin/gyms/:gymCode', requireAdminAuth, async (req, res) => {
    try {
        await Gym.deleteOne({ gymCode: req.params.gymCode });
        await Code.deleteMany({ gymCode: req.params.gymCode });
        res.json({ success: true });
    } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// ============================================================
// PANEL COACH
// ============================================================
app.post('/api/coach/login', async (req, res) => {
    try {
        const { gymCode, password } = req.body || {};
        if (!gymCode || !password) return res.json({ success: false, message: 'Faltan credenciales.' });

        const gym = await Gym.findOne({ gymCode });
        if (!gym)       return res.json({ success: false, message: 'CÓDIGO DE FRANQUICIA INEXISTENTE' });
        if (!gym.active) return res.json({ success: false, message: 'SISTEMA CONGELADO. CONTACTA AX-CORE MÁSTER.' });

        const ok = await comparePassword(password, gym.password);
        if (!ok) return res.json({ success: false, message: 'CONTRASEÑA INCORRECTA' });

        // Rehashear si sigue en plaintext
        if (!String(gym.password).startsWith('$2')) {
            gym.password = await hashPassword(password);
            await gym.save();
        }

        const currentUsers = await Code.countDocuments({ gymCode });
        res.json({ success: true, gym: stripPassword(gym), currentUsers });
    } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

app.get('/api/coach/codes/:gymCode', async (req, res) => {
    try {
        const codes = await Code.find({ gymCode: req.params.gymCode });
        res.json(codes.map(c => c.toObject()));
    } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

app.post('/api/coach/generate', async (req, res) => {
    try {
        const { gymId, user } = req.body || {};
        const gym = await Gym.findOne({ gymCode: gymId });
        if (!gym)        return res.json({ success: false, message: 'Franquicia no encontrada.' });
        if (!gym.active) return res.json({ success: false, message: 'SISTEMA PAUSADO POR AX-CORE.' });

        const currentCount = await Code.countDocuments({ gymCode: gymId });
        if (currentCount >= gym.maxUsers) {
            return res.json({ success: false, message: `LÍMITE ALCANZADO (${gym.maxUsers} códigos). Mejore su plan.` });
        }

        const newCode = `AX-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
        await Code.create({ code: newCode, gymCode: gymId, active: true, user: user || 'Atleta' });
        res.json({ success: true, code: newCode, remaining: gym.maxUsers - (currentCount + 1) });
    } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

app.post('/api/coach/toggle', async (req, res) => {
    try {
        const { code, status } = req.body || {};
        await Code.updateOne({ code }, { active: !!status });
        res.json({ success: true });
    } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

app.delete('/api/coach/users/:code', async (req, res) => {
    try {
        const result = await Code.deleteOne({ code: req.params.code });
        if (result.deletedCount === 0) return res.status(404).json({ success: false, message: 'No encontrado.' });
        res.json({ success: true, message: 'Usuario eliminado.' });
    } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// ============================================================
// VALIDACIÓN PARA APP ATLETA
// ============================================================
app.post('/api/validate', async (req, res) => {
    try {
        const { code } = req.body || {};
        if (!code) return res.json({ success: false, message: 'Código requerido.' });
        if (code === 'AXV-DEMO') return res.json({ success: true, message: 'ACCESO DEMO OTORGADO.' });

        const pass = await Code.findOne({ code });
        if (!pass)        return res.json({ success: false, message: 'CÓDIGO INEXISTENTE. Pide uno en la recepción del gimnasio.' });
        if (!pass.active) return res.json({ success: false, message: 'ACCESO DENEGADO POR TU RECEPCIÓN. CORTADO TEMPORALMENTE.' });

        const gym = await Gym.findOne({ gymCode: pass.gymCode });
        if (gym && !gym.active) return res.json({ success: false, message: 'FRANQUICIA SIN PAGO ACTIVO. COMUNÍCATE CON EL DUEÑO.' });

        res.json({ success: true, message: 'ACCESO ÉLITE CONCEDIDO.' });
    } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// ============================================================
// HEALTH
// ============================================================
app.get('/health', async (req, res) => {
    try {
        const gyms  = await Gym.countDocuments();
        const codes = await Code.countDocuments();
        res.json({ status: 'AX-CORE ONLINE', db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected', gyms, codes });
    } catch { res.json({ status: 'AX-CORE ONLINE', db: 'error' }); }
});

// ============================================================
// INICIO
// ============================================================
async function startServer() {
    if (MONGO_URI) {
        try {
            await mongoose.connect(MONGO_URI);
            console.log('✅ MongoDB Atlas conectado');
        } catch (e) {
            console.error('❌ Error conectando MongoDB:', e.message);
            process.exit(1);
        }
    } else {
        console.warn('⚠️  Sin MONGO_URI — la app arrancará pero la DB no funcionará.');
    }
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => console.log(`🚀 AX-CORE Backend en puerto ${PORT}`));
}
startServer();
