require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();
app.use(cors());
app.use(express.json());

// URI de MongoDB. Si el usuario no lo ha cambiado por uno válido, fallará intencionalmente, y entraremos al Fallback
const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://admin:arthur2026@cluster0.abcde.mongodb.net/axcore?retryWrites=true&w=majority";

let isMongoConnected = false;

// Memoria Local RAM (Fallback) - Mantiene el ecosistema vivo incluso si Mongo explota
let localGyms = [];
let localClientCodes = [];

// Conexión Inteligente con Timeout (Para no hacer bucles infinitos)
mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true, serverSelectionTimeoutMS: 5000 })
    .then(() => {
        isMongoConnected = true;
        console.log('✅ AX-CORE Conectado a MongoDB Exitosamente en la nube');
    })
    .catch(err => {
        isMongoConnected = false;
        console.error('❌ Error MongoDB (URI Inválida o red caída). AX-CORE Entrando en modo FALLBACK (Memoria RAM).');
    });

// --- MODELOS MONGODB ---
const gymSchema = new mongoose.Schema({
    gymCode: { type: String, required: true, unique: true },
    name: String,
    owner: String,
    manager: String,
    coach: String,
    plan: String,
    maxUsers: Number,
    rent: Number,
    active: { type: Boolean, default: true },
    password: { type: String, default: '1234' },
    createdAt: { type: Date, default: Date.now }
});
const Gym = mongoose.model('Gym', gymSchema);

const clientCodeSchema = new mongoose.Schema({
    code: { type: String, required: true, unique: true },
    gymCode: { type: String, required: true },
    user: String,
    active: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now }
});
const ClientCode = mongoose.model('ClientCode', clientCodeSchema);

// --- RUTAS DEL PANEL MAESTRO (admin.js) ---

app.get('/api/admin/gyms', async (req, res) => {
    try {
        if (!isMongoConnected) {
            const formatted = localGyms.map(g => {
                const count = localClientCodes.filter(c => c.gymCode === g.gymCode).length;
                return { ...g, currentUsers: count };
            });
            return res.json({ success: true, gyms: formatted });
        }

        const gyms = await Gym.find().lean();
        const gymCodes = gyms.map(g => g.gymCode);
        const athletes = await ClientCode.aggregate([
            { $match: { gymCode: { $in: gymCodes } } },
            { $group: { _id: "$gymCode", count: { $sum: 1 } } }
        ]);

        const formatted = gyms.map(g => {
            const usage = athletes.find(a => a._id === g.gymCode);
            return { ...g, currentUsers: usage ? usage.count : 0 };
        });
        res.json({ success: true, gyms: formatted });
    } catch(err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

app.post('/api/admin/gyms', async (req, res) => {
    try {
        const data = req.body; 
        if (!isMongoConnected) {
            data.active = true;
            data.password = '1234';
            localGyms.push(data);
            return res.json({ success: true, gym: data });
        }

        const newGym = new Gym(data);
        await newGym.save();
        res.json({ success: true, gym: newGym });
    } catch(err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

app.post('/api/admin/toggle', async (req, res) => {
    try {
        const { gymCode, status } = req.body;
        if (!isMongoConnected) {
            const gym = localGyms.find(g => g.gymCode === gymCode);
            if (gym) gym.active = status;
            return res.json({ success: true, message: `Gimnasio ${gymCode} actualizdo offline` });
        }

        await Gym.updateOne({ gymCode }, { active: status });
        res.json({ success: true, message: `Gimnasio ${gymCode} ${status ? 'activado' : 'pausado'}` });
    } catch(err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

app.delete('/api/admin/gyms/:gymCode', async (req, res) => {
    try {
        if (!isMongoConnected) {
            localGyms = localGyms.filter(g => g.gymCode !== req.params.gymCode);
            localClientCodes = localClientCodes.filter(c => c.gymCode !== req.params.gymCode);
            return res.json({ success: true });
        }

        await Gym.deleteOne({ gymCode: req.params.gymCode });
        await ClientCode.deleteMany({ gymCode: req.params.gymCode });
        res.json({ success: true });
    } catch(err) {
        res.status(500).json({ success: false, error: err.message });
    }
});


// --- RUTAS DEL PANEL COACH (coach.html) ---

app.post('/api/coach/login', async (req, res) => {
    try {
        const { gymCode, password } = req.body;
        
        if(gymCode === "GYM-MASTER" && password === "1234") {
            return res.json({ success: true, gym: { name: "Máquina Principal", maxUsers: 9999, active: true, gymCode: "GYM-MASTER" }, currentUsers: 0 });
        }

        if (!isMongoConnected) {
            const gym = localGyms.find(g => g.gymCode === gymCode);
            if(!gym) return res.json({ success: false, message: "CÓDIGO DE FRANQUICIA INEXISTENTE (Memoria)" });
            if(!gym.active) return res.json({ success: false, message: "SISTEMA CONGELADO. CONTACTA AX-CORE MÁSTER." });
            if(gym.password !== password) return res.json({ success: false, message: "CONTRASEÑA INCORRECTA" });
            const usageCount = localClientCodes.filter(c => c.gymCode === gymCode).length;
            return res.json({ success: true, gym, currentUsers: usageCount });
        }

        const gym = await Gym.findOne({ gymCode });
        if(!gym) return res.json({ success: false, message: "CÓDIGO DE FRANQUICIA INEXISTENTE" });
        if(!gym.active) return res.json({ success: false, message: "SISTEMA CONGELADO. CONTACTA OFICINAS AX-CORE MÁSTER." });
        if(gym.password !== password) return res.json({ success: false, message: "CONTRASEÑA INCORRECTA" });

        const usageCount = await ClientCode.countDocuments({ gymCode });
        res.json({ success: true, gym, currentUsers: usageCount });
    } catch(err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

app.get('/api/coach/codes/:gymCode', async (req, res) => {
    try {
        const { gymCode } = req.params;
        if (!isMongoConnected) {
            return res.json(localClientCodes.filter(c => c.gymCode === gymCode));
        }
        const codes = await ClientCode.find({ gymCode }).lean();
        res.json(codes);
    } catch(err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

app.post('/api/coach/generate', async (req, res) => {
    try {
        const { gymId, user } = req.body; 
        
        let limit = 50; 
        
        if (!isMongoConnected) {
            if (gymId !== "GYM-MASTER") {
                const gym = localGyms.find(g => g.gymCode === gymId);
                if(!gym) return res.json({ success: false, message: "Franquicia no encontrada en memoria." });
                if(!gym.active) return res.json({ success: false, message: "SISTEMA PAUSADO POR AX-CORE." });
                limit = gym.maxUsers || 50;
            } else { limit = 9999; }

            const currentCount = localClientCodes.filter(c => c.gymCode === gymId).length;
            if (currentCount >= limit) {
                return res.json({ success: false, message: `LÍMITE ALCANZADO (Máx: ${limit} códigos).\nMejore su plan.` });
            }
            
            const newCode = `AX-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
            localClientCodes.push({ code: newCode, gymCode: gymId, active: true, user: user || "Atleta", createdAt: new Date() });
            return res.json({ success: true, code: newCode, remaining: limit - (currentCount + 1) });
        }

        if (gymId !== "GYM-MASTER") {
            const gym = await Gym.findOne({ gymCode: gymId });
            if(!gym) return res.json({ success: false, message: "Franquicia no encontrada." });
            if(!gym.active) return res.json({ success: false, message: "SISTEMA PAUSADO POR AX-CORE." });
            limit = gym.maxUsers;
        } else {
            limit = 9999;
        }

        const currentCount = await ClientCode.countDocuments({ gymCode: gymId });
        if (currentCount >= limit) {
            return res.json({ 
                success: false, 
                message: `LÍMITE ALCANZADO (Máx: ${limit} códigos).\nMejore su plan contactando a AX-CORE Central.` 
            });
        }

        const newCode = `AX-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
        const pase = new ClientCode({ code: newCode, gymCode: gymId, active: true, user: user || "Atleta" });
        await pase.save();
        
        res.json({ success: true, code: newCode, remaining: limit - (currentCount + 1) });
    } catch(err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

app.post('/api/coach/toggle', async (req, res) => {
    try {
        const { code, status } = req.body;
        if (!isMongoConnected) {
            const cc = localClientCodes.find(c => c.code === code);
            if (cc) cc.active = status;
            return res.json({ success: true });
        }
        await ClientCode.updateOne({ code }, { active: status });
        res.json({ success: true });
    } catch(err) {
        res.status(500).json({ success: false, error: err.message });
    }
});


// --- RUTAS DEL USUARIO FINAL (app.js) ---

app.post('/api/validate', async (req, res) => {
    try {
        const { code } = req.body;
        
        if (code === "AXV-DEMO" || code === "GYM-MASTER" || code === "AXV-ADMIN") {
            return res.json({ success: true, message: "ACCESO ALFA OTORGADO." });
        }

        if (!isMongoConnected) {
            const pass = localClientCodes.find(c => c.code === code);
            if (pass) {
                if (!pass.active) return res.json({ success: false, message: "ACCESO DENEGADO POR TU RECEPCIÓN. CORTADO TEMPORALMENTE." });
                if (pass.gymCode !== "GYM-MASTER") {
                    const gym = localGyms.find(g => g.gymCode === pass.gymCode);
                    if (gym && !gym.active) return res.json({ success: false, message: "FRANQUICIA SIN PAGO ACTIVO CON AX-CORE GLOBAL. COMUNÍCATE CON EL DUEÑO." });
                }
                return res.json({ success: true, message: "ACCESO ÉLITE CONCEDIDO." });
            }
            return res.json({ success: false, message: "CÓDIGO INEXISTENTE O LA BASE DE DATOS LOCAL SE REINICIÓ." });
        }

        const pass = await ClientCode.findOne({ code });
        if (pass) {
            if (!pass.active) return res.json({ success: false, message: "ACCESO DENEGADO POR TU RECEPCIÓN. CORTADO TEMPORALMENTE." });
            
            if (pass.gymCode !== "GYM-MASTER") {
                const gym = await Gym.findOne({ gymCode: pass.gymCode });
                if (gym && !gym.active) {
                    return res.json({ success: false, message: "FRANQUICIA SIN PAGO ACTIVO CON AX-CORE GLOBAL. COMUNÍCATE CON EL DUEÑO." });
                }
            }
            return res.json({ success: true, message: "ACCESO ÉLITE CONCEDIDO." });
        }
        res.json({ success: false, message: "CÓDIGO INEXISTENTE. (Acércate a recepción o solicita a tu Nutriólogo)" });
    } catch(err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

app.get('/health', (req, res) => {
    res.json({ status: "AX-CORE BACKEND ONLINE", dbMode: isMongoConnected ? "MONGODB" : "MEMORY_FALLBACK" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`AX-CORE Mongo Backend running on port ${PORT}`);
});
