const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

const app = express();
app.set('trust proxy', 1);

// ============================================================
// VARIABLES DE ENTORNO (configurar en Render)
// ADMIN_TOKEN — clave del panel maestro
// MONGO_URI   — connection string de MongoDB Atlas
// JWT_SECRET  — secreto para firmar tokens de atletas
// ALLOWED_ORIGINS — dominios permitidos (coma separados)
// MAX_ATHLETES_PER_GYM — tope global (default 50)
// STRIPE_SECRET — opcional, para pagos
// ============================================================
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || '';
const MONGO_URI   = process.env.MONGO_URI   || '';
const JWT_SECRET  = process.env.JWT_SECRET  || crypto.randomBytes(48).toString('hex');
const MAX_ATHLETES_PER_GYM = parseInt(process.env.MAX_ATHLETES_PER_GYM || '50', 10);
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS ||
    'https://arthur-arias-martinez.github.io,http://localhost:3000,http://localhost:5500,http://127.0.0.1:5500'
).split(',').map(s => s.trim()).filter(Boolean);

if (!ADMIN_TOKEN) console.warn('⚠️  ADMIN_TOKEN no definido en variables de entorno.');
if (!MONGO_URI)   console.warn('⚠️  MONGO_URI no definido. La base de datos no funcionará.');
if (!process.env.JWT_SECRET) console.warn('⚠️  JWT_SECRET no definido — usando aleatorio (sesiones se invalidan al reiniciar).');

// ============================================================
// MIDDLEWARES BASE — orden importa
// ============================================================
app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: false
}));

app.use(cors({
    origin: (origin, cb) => {
        // Permitir same-origin y herramientas (Postman/curl no envían origin)
        if (!origin) return cb(null, true);
        if (ALLOWED_ORIGINS.includes(origin)) return cb(null, true);
        return cb(new Error(`CORS bloqueado para origen: ${origin}`));
    },
    credentials: true
}));

app.use(express.json({ limit: '500kb' }));

// ============================================================
// RATE LIMITERS
// ============================================================
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,           // 15 min
    max: 10,                             // 10 intentos/IP/15min
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Demasiados intentos. Espera 15 minutos.' }
});

const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300,                            // 300 req/IP/15min general
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Demasiadas solicitudes. Espera unos minutos.' }
});
app.use('/api', apiLimiter);

// ============================================================
// MODELOS DE MONGOOSE
// ============================================================
const gymSchema = new mongoose.Schema({
    gymCode:   { type: String, required: true, unique: true, index: true },
    name:      { type: String, required: true },
    owner:     { type: String, default: '' },
    manager:   { type: String, default: '' },
    coach:     { type: String, default: '' },
    plan:      { type: String, default: 'basico' },
    maxUsers:  { type: Number, default: MAX_ATHLETES_PER_GYM },
    rent:      { type: Number, default: 1500 },
    active:    { type: Boolean, default: true },
    blockId:   { type: String, default: '' },
    password:  { type: String, default: '' },
    branding:  {
        logoUrl:      { type: String, default: '' },
        primaryColor: { type: String, default: '#00ff88' },
        accentColor:  { type: String, default: '#d4af37' }
    },
    stripeCustomerId: { type: String, default: '' },
    nextPaymentDate:  { type: Date, default: null },
    createdAt: { type: Date, default: Date.now }
});

const codeSchema = new mongoose.Schema({
    code:       { type: String, required: true, unique: true, index: true },
    gymCode:    { type: String, required: true, index: true },
    active:     { type: Boolean, default: true },
    user:       { type: String, default: 'Atleta' },
    registered: { type: Boolean, default: false },
    createdAt:  { type: Date, default: Date.now }
});

const userSchema = new mongoose.Schema({
    code:        { type: String, required: true, unique: true, index: true }, // código AXV vinculado
    gymCode:     { type: String, required: true, index: true },
    username:    { type: String, required: true },
    password:    { type: String, required: true }, // bcrypt hash
    privacyAccepted: { type: Boolean, default: false },
    privacyDate: { type: Date, default: null },
    data:        { type: mongoose.Schema.Types.Mixed, default: {} }, // payload completo del atleta
    achievements:{ type: [String], default: [] },
    createdAt:   { type: Date, default: Date.now },
    lastSync:    { type: Date, default: Date.now }
});

const Gym  = mongoose.model('Gym', gymSchema);
const Code = mongoose.model('Code', codeSchema);
const User = mongoose.model('User', userSchema);

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

function requireUserAuth(req, res, next) {
    const auth = req.header('Authorization') || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
    if (!token) return res.status(401).json({ success: false, message: 'Token requerido.' });
    try {
        const payload = jwt.verify(token, JWT_SECRET);
        req.user = payload; // { code, gymCode, username }
        next();
    } catch {
        return res.status(401).json({ success: false, message: 'Sesión inválida o expirada.' });
    }
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

function sanitizeStr(v, max = 100) {
    if (typeof v !== 'string') return '';
    return v.trim().slice(0, max);
}

function isValidCode(code) {
    return typeof code === 'string' && /^[A-Z0-9\-]{3,30}$/.test(code);
}

// ============================================================
// LOGIN ADMIN
// ============================================================
app.post('/api/admin/login', loginLimiter, (req, res) => {
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
        const data = req.body || {};
        if (!data.gymCode) return res.status(400).json({ success: false, message: 'gymCode requerido.' });
        if (!isValidCode(String(data.gymCode).toUpperCase())) {
            return res.status(400).json({ success: false, message: 'gymCode inválido (use A-Z, 0-9, -).' });
        }
        data.gymCode = String(data.gymCode).toUpperCase();
        data.password = await hashPassword(data.password || String(Math.floor(1000 + Math.random() * 9000)));
        data.active = true;
        // El plan default no puede exceder MAX_ATHLETES_PER_GYM salvo override admin explícito
        if (typeof data.maxUsers !== 'number' || data.maxUsers < 1) data.maxUsers = MAX_ATHLETES_PER_GYM;
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
        const gymCode = String(req.params.gymCode).toUpperCase();
        await Gym.deleteOne({ gymCode });
        await Code.deleteMany({ gymCode });
        await User.deleteMany({ gymCode });
        res.json({ success: true });
    } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// ============================================================
// PANEL COACH
// ============================================================
app.post('/api/coach/login', loginLimiter, async (req, res) => {
    try {
        const { gymCode, password } = req.body || {};
        if (!gymCode || !password) return res.json({ success: false, message: 'Faltan credenciales.' });

        const gymCodeUp = String(gymCode).toUpperCase();
        const gym = await Gym.findOne({ gymCode: gymCodeUp });
        if (!gym)        return res.json({ success: false, message: 'CÓDIGO DE FRANQUICIA INEXISTENTE' });
        if (!gym.active) return res.json({ success: false, message: 'SISTEMA CONGELADO. CONTACTA AX-CORE MÁSTER.' });

        const ok = await comparePassword(password, gym.password);
        if (!ok) return res.json({ success: false, message: 'CONTRASEÑA INCORRECTA' });

        // Rehashear si sigue en plaintext
        if (!String(gym.password).startsWith('$2')) {
            gym.password = await hashPassword(password);
            await gym.save();
        }

        const currentUsers = await Code.countDocuments({ gymCode: gymCodeUp });
        res.json({ success: true, gym: stripPassword(gym), currentUsers });
    } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

app.get('/api/coach/codes/:gymCode', async (req, res) => {
    try {
        const gymCode = String(req.params.gymCode).toUpperCase();
        const codes = await Code.find({ gymCode });
        res.json(codes.map(c => c.toObject()));
    } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

app.post('/api/coach/generate', async (req, res) => {
    try {
        const { gymId, user } = req.body || {};
        const gymCode = String(gymId || '').toUpperCase();
        const gym = await Gym.findOne({ gymCode });
        if (!gym)        return res.json({ success: false, message: 'Franquicia no encontrada.' });
        if (!gym.active) return res.json({ success: false, message: 'SISTEMA PAUSADO POR AX-CORE.' });

        const currentCount = await Code.countDocuments({ gymCode });
        const limit = Math.min(gym.maxUsers || MAX_ATHLETES_PER_GYM, MAX_ATHLETES_PER_GYM);
        if (currentCount >= limit) {
            return res.json({ success: false, message: `LÍMITE ALCANZADO (${limit} códigos). Contacta a AX-CORE para ampliar.` });
        }

        // Generar código único — AXV-XXXXX (mejor formato que AX- aleatorio)
        let newCode;
        for (let i = 0; i < 5; i++) {
            const candidate = `AXV-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
            const exists = await Code.findOne({ code: candidate });
            if (!exists) { newCode = candidate; break; }
        }
        if (!newCode) return res.status(500).json({ success: false, message: 'No se pudo generar código único.' });

        await Code.create({
            code: newCode,
            gymCode,
            active: true,
            user: sanitizeStr(user, 60) || 'Atleta'
        });
        res.json({ success: true, code: newCode, remaining: limit - (currentCount + 1) });
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
        const code = req.params.code;
        const result = await Code.deleteOne({ code });
        if (result.deletedCount === 0) return res.status(404).json({ success: false, message: 'No encontrado.' });
        // También borrar datos del User si ya se había registrado
        await User.deleteOne({ code });
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
        const codeUp = String(code).toUpperCase();
        if (codeUp === 'AXV-DEMO') return res.json({ success: true, message: 'ACCESO DEMO OTORGADO.', demo: true });

        const pass = await Code.findOne({ code: codeUp });
        if (!pass)        return res.json({ success: false, message: 'CÓDIGO INEXISTENTE. Pide uno en la recepción del gimnasio.' });
        if (!pass.active) return res.json({ success: false, message: 'ACCESO DENEGADO POR TU RECEPCIÓN. CORTADO TEMPORALMENTE.' });

        const gym = await Gym.findOne({ gymCode: pass.gymCode });
        if (gym && !gym.active) return res.json({ success: false, message: 'FRANQUICIA SIN PAGO ACTIVO. COMUNÍCATE CON EL DUEÑO.' });

        const branding = gym?.branding || {};
        res.json({
            success: true,
            message: 'ACCESO ÉLITE CONCEDIDO.',
            registered: !!pass.registered,
            gymName: gym?.name || '',
            branding
        });
    } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// ============================================================
// SYNC DE DATOS DEL ATLETA
// ============================================================
// Registro inicial — vincula código AXV con username/password y data inicial
app.post('/api/user/register', loginLimiter, async (req, res) => {
    try {
        const { code, username, password, privacyAccepted, data } = req.body || {};
        const codeUp = String(code || '').toUpperCase();
        const u = sanitizeStr(username, 40);
        const p = sanitizeStr(password, 100);

        if (!isValidCode(codeUp)) return res.json({ success: false, message: 'Código inválido.' });
        if (u.length < 3 || p.length < 4) return res.json({ success: false, message: 'Usuario mín 3 caracteres, clave mín 4.' });
        if (!privacyAccepted) return res.json({ success: false, message: 'Debe aceptar el aviso de privacidad y T&C.' });

        // DEMO: no permitimos registrar/sync (es código compartido)
        if (codeUp === 'AXV-DEMO') return res.json({ success: false, message: 'AXV-DEMO no permite registrar datos en la nube. Pide código a tu coach.' });

        const pass = await Code.findOne({ code: codeUp });
        if (!pass) return res.json({ success: false, message: 'Código inexistente.' });
        if (!pass.active) return res.json({ success: false, message: 'Código inactivo.' });

        const gym = await Gym.findOne({ gymCode: pass.gymCode });
        if (gym && !gym.active) return res.json({ success: false, message: 'Franquicia sin pago activo.' });

        // Si el código ya está vinculado a un usuario, rechazar
        const existing = await User.findOne({ code: codeUp });
        if (existing) return res.json({ success: false, message: 'Este código ya tiene un usuario registrado. Usa el botón INICIAR SESIÓN.' });

        const hashed = await hashPassword(p);
        const user = await User.create({
            code: codeUp,
            gymCode: pass.gymCode,
            username: u,
            password: hashed,
            privacyAccepted: true,
            privacyDate: new Date(),
            data: data || {},
            achievements: []
        });
        await Code.updateOne({ code: codeUp }, { registered: true, user: u });

        const token = jwt.sign({ code: codeUp, gymCode: pass.gymCode, username: u }, JWT_SECRET, { expiresIn: '30d' });
        res.json({ success: true, message: 'Usuario registrado.', token, gymCode: pass.gymCode, gymName: gym?.name || '' });
    } catch (e) {
        if (e.code === 11000) return res.json({ success: false, message: 'Ya existe un usuario con ese código.' });
        res.status(500).json({ success: false, message: e.message });
    }
});

// Login del atleta — devuelve JWT + data
app.post('/api/user/login', loginLimiter, async (req, res) => {
    try {
        const { code, password } = req.body || {};
        const codeUp = String(code || '').toUpperCase();
        const p = sanitizeStr(password, 100);

        if (!isValidCode(codeUp) || !p) return res.json({ success: false, message: 'Faltan datos.' });

        const user = await User.findOne({ code: codeUp });
        if (!user) return res.json({ success: false, message: 'Usuario no registrado. Usa NUEVO ATLETA.' });

        const ok = await comparePassword(p, user.password);
        if (!ok) return res.json({ success: false, message: 'Contraseña incorrecta.' });

        // Validar que el código siga activo y la franquicia pagada
        const pass = await Code.findOne({ code: codeUp });
        if (!pass || !pass.active) return res.json({ success: false, message: 'Acceso suspendido por tu gimnasio.' });
        const gym = await Gym.findOne({ gymCode: user.gymCode });
        if (gym && !gym.active) return res.json({ success: false, message: 'Franquicia sin pago activo.' });

        const token = jwt.sign({ code: codeUp, gymCode: user.gymCode, username: user.username }, JWT_SECRET, { expiresIn: '30d' });
        res.json({
            success: true,
            token,
            username: user.username,
            gymCode: user.gymCode,
            gymName: gym?.name || '',
            branding: gym?.branding || {},
            data: user.data || {},
            achievements: user.achievements || []
        });
    } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// Sync — guarda data completa del atleta
app.post('/api/user/sync', requireUserAuth, async (req, res) => {
    try {
        const { data, achievements } = req.body || {};
        if (!data || typeof data !== 'object') return res.status(400).json({ success: false, message: 'data requerida.' });

        // Sanitizar tamaño (evitar abuso)
        const payload = JSON.stringify(data);
        if (payload.length > 400000) return res.status(413).json({ success: false, message: 'Payload demasiado grande.' });

        const update = { data, lastSync: new Date() };
        if (Array.isArray(achievements)) update.achievements = achievements.slice(0, 200);

        await User.updateOne({ code: req.user.code }, update);
        res.json({ success: true, lastSync: update.lastSync });
    } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// Pull — recupera data más reciente
app.get('/api/user/data', requireUserAuth, async (req, res) => {
    try {
        const user = await User.findOne({ code: req.user.code });
        if (!user) return res.status(404).json({ success: false, message: 'Usuario no encontrado.' });
        const gym = await Gym.findOne({ gymCode: user.gymCode });
        res.json({
            success: true,
            data: user.data || {},
            achievements: user.achievements || [],
            lastSync: user.lastSync,
            gymName: gym?.name || '',
            branding: gym?.branding || {}
        });
    } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// Cambiar contraseña del atleta
app.post('/api/user/password', requireUserAuth, async (req, res) => {
    try {
        const { oldPassword, newPassword } = req.body || {};
        const user = await User.findOne({ code: req.user.code });
        if (!user) return res.status(404).json({ success: false, message: 'Usuario no encontrado.' });
        const ok = await comparePassword(oldPassword, user.password);
        if (!ok) return res.json({ success: false, message: 'Contraseña actual incorrecta.' });
        if (!newPassword || String(newPassword).length < 4) return res.json({ success: false, message: 'Nueva contraseña mín 4 caracteres.' });
        user.password = await hashPassword(newPassword);
        await user.save();
        res.json({ success: true });
    } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// ============================================================
// STRIPE — pagos mensuales del coach al maestro
// Requiere variables: STRIPE_SECRET, STRIPE_WEBHOOK_SECRET
// Y crear productos/precios en dashboard de Stripe (price_xxx)
// ============================================================
const STRIPE_SECRET = process.env.STRIPE_SECRET || '';
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || '';
const stripe = STRIPE_SECRET ? require('stripe')(STRIPE_SECRET) : null;

// El webhook necesita el body crudo — montarlo ANTES de express.json para esa ruta
// Aquí lo hacemos lazy: si no hay STRIPE_SECRET, los endpoints responden 503.

app.post('/api/stripe/checkout', requireAdminAuth, async (req, res) => {
    if (!stripe) return res.status(503).json({ success: false, message: 'STRIPE no configurado.' });
    try {
        const { gymCode, priceId, successUrl, cancelUrl } = req.body || {};
        if (!gymCode || !priceId) return res.status(400).json({ success: false, message: 'gymCode y priceId requeridos.' });

        const gym = await Gym.findOne({ gymCode: String(gymCode).toUpperCase() });
        if (!gym) return res.status(404).json({ success: false, message: 'Gym no encontrado.' });

        const session = await stripe.checkout.sessions.create({
            mode: 'subscription',
            payment_method_types: ['card'],
            line_items: [{ price: priceId, quantity: 1 }],
            client_reference_id: gym.gymCode,
            customer: gym.stripeCustomerId || undefined,
            success_url: successUrl || 'https://arthur-arias-martinez.github.io/axcore-app/success.html',
            cancel_url:  cancelUrl  || 'https://arthur-arias-martinez.github.io/axcore-app/'
        });
        res.json({ success: true, url: session.url });
    } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

app.post('/api/stripe/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
    if (!stripe || !STRIPE_WEBHOOK_SECRET) return res.status(503).end();
    let event;
    try {
        event = stripe.webhooks.constructEvent(
            req.body,
            req.header('stripe-signature'),
            STRIPE_WEBHOOK_SECRET
        );
    } catch (err) {
        console.error('Stripe webhook signature falló:', err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    try {
        switch (event.type) {
            case 'checkout.session.completed': {
                const s = event.data.object;
                const gymCode = s.client_reference_id;
                if (gymCode && s.customer) {
                    await Gym.updateOne({ gymCode }, {
                        stripeCustomerId: s.customer,
                        active: true
                    });
                    console.log(`✅ Pago confirmado: ${gymCode}`);
                }
                break;
            }
            case 'invoice.paid': {
                const inv = event.data.object;
                if (inv.customer) {
                    const next = inv.lines?.data?.[0]?.period?.end ? new Date(inv.lines.data[0].period.end * 1000) : null;
                    await Gym.updateOne({ stripeCustomerId: inv.customer }, {
                        active: true,
                        nextPaymentDate: next
                    });
                }
                break;
            }
            case 'invoice.payment_failed':
            case 'customer.subscription.deleted': {
                const obj = event.data.object;
                const customerId = obj.customer || obj.id;
                await Gym.updateOne({ stripeCustomerId: customerId }, { active: false });
                console.log(`⚠️ Pago fallido / cancelado: ${customerId}`);
                break;
            }
        }
        res.json({ received: true });
    } catch (e) {
        console.error('Stripe webhook handler error:', e);
        res.status(500).end();
    }
});

// ============================================================
// PUSH NOTIFICATIONS — VAPID + suscripciones
// Variables: VAPID_PUBLIC, VAPID_PRIVATE, VAPID_SUBJECT (mailto:tu@email)
// ============================================================
const VAPID_PUBLIC  = process.env.VAPID_PUBLIC  || '';
const VAPID_PRIVATE = process.env.VAPID_PRIVATE || '';
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:arthurplatinoamway@gmail.com';

let webpush = null;
if (VAPID_PUBLIC && VAPID_PRIVATE) {
    webpush = require('web-push');
    webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC, VAPID_PRIVATE);
}

// El atleta envía su PushSubscription
app.post('/api/push/subscribe', requireUserAuth, async (req, res) => {
    try {
        const { subscription } = req.body || {};
        if (!subscription) return res.status(400).json({ success: false, message: 'subscription requerida.' });
        await User.updateOne({ code: req.user.code }, { 'data.pushSubscription': subscription });
        res.json({ success: true });
    } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// Endpoint público de la VAPID pública (lo lee el frontend para suscribirse)
app.get('/api/push/vapid', (req, res) => {
    if (!VAPID_PUBLIC) return res.status(503).json({ success: false, message: 'Push no configurado.' });
    res.json({ success: true, key: VAPID_PUBLIC });
});

// Maestro envía notificación a un atleta o a un gym completo
app.post('/api/push/send', requireAdminAuth, async (req, res) => {
    if (!webpush) return res.status(503).json({ success: false, message: 'Push no configurado.' });
    try {
        const { gymCode, code, title, body, url } = req.body || {};
        const filter = code ? { code } : (gymCode ? { gymCode } : {});
        const users = await User.find(filter);
        let sent = 0, failed = 0;
        await Promise.all(users.map(async u => {
            const sub = u.data?.pushSubscription;
            if (!sub) return;
            try {
                await webpush.sendNotification(sub, JSON.stringify({ title: title || 'AX-CORE', body: body || '', url: url || '/' }));
                sent++;
            } catch { failed++; }
        }));
        res.json({ success: true, sent, failed });
    } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// ============================================================
// HEALTH
// ============================================================
app.get('/health', async (req, res) => {
    try {
        const gyms  = await Gym.countDocuments();
        const codes = await Code.countDocuments();
        const users = await User.countDocuments();
        res.json({
            status: 'AX-CORE ONLINE',
            db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
            gyms, codes, users
        });
    } catch { res.json({ status: 'AX-CORE ONLINE', db: 'error' }); }
});

// ============================================================
// 404 + ERROR HANDLER
// ============================================================
app.use((req, res) => res.status(404).json({ success: false, message: 'Endpoint no encontrado.' }));
app.use((err, req, res, next) => {
    console.error('Error:', err.message);
    if (err.message?.includes('CORS')) return res.status(403).json({ success: false, message: 'Origen no autorizado.' });
    res.status(500).json({ success: false, message: 'Error interno.' });
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
    app.listen(PORT, () => {
        console.log(`🚀 AX-CORE Backend en puerto ${PORT}`);
        console.log(`   CORS allowed: ${ALLOWED_ORIGINS.join(', ')}`);
        console.log(`   Max atletas/gym: ${MAX_ATHLETES_PER_GYM}`);
    });
}
startServer();
