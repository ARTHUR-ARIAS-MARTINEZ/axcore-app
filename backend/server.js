const express = require('express');
const cors = require('cors');
// Render usa Node.js 18+ que ya incluye fetch nativamente

const app = express();
app.use(cors());
app.use(express.json());

// BUCKET SECRETO Y GRATUITO DE KVDB (No requiere cuenta, nunca expira)
const KVDB_URL = "https://kvdb.io/JGJBgodczAc5vCBJrgZPuL/axcore_db";

// Memoria RAM 
let db = {
    gyms: [],
    clientCodes: []
};

// Funciones de Sincronización Inmortal
async function saveToCloud() {
    try {
        await fetch(KVDB_URL, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(db)
        });
        console.log("☁️ AX-CORE: Nube sincronizada con éxito.");
    } catch(e) {
        console.error("❌ AX-CORE Error al subir a Nube:", e);
    }
}

async function loadFromCloud() {
    try {
        const res = await fetch(KVDB_URL);
        if (res.ok) {
            const data = await res.json();
            if (data && data.gyms) {
                db = data;
                console.log(`✅ AX-CORE: Base de datos cargada. Gimnasios: ${db.gyms.length}, Pases: ${db.clientCodes.length}`);
            }
        } else {
            console.log("☁️ AX-CORE: Base de datos vacía, iniciando frescamente.");
        }
    } catch(e) {
        console.error("❌ AX-CORE Error al descargar desde la Nube (usando memoria volátil temporal):", e);
    }
}

// Iniciar carga inmediata
loadFromCloud();

// --- RUTAS DEL PANEL MAESTRO (admin.js) ---

app.get('/api/admin/gyms', (req, res) => {
    try {
        const formatted = db.gyms.map(g => {
            const count = db.clientCodes.filter(c => c.gymCode === g.gymCode).length;
            return { ...g, currentUsers: count };
        });
        res.json({ success: true, gyms: formatted });
    } catch(err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

app.post('/api/admin/gyms', async (req, res) => {
    try {
        const data = req.body; 
        data.active = true;
        data.password = '1234';
        data.createdAt = new Date();
        
        // Evitar duplicados
        if (!db.gyms.find(g => g.gymCode === data.gymCode)) {
            db.gyms.push(data);
            await saveToCloud();
        }
        res.json({ success: true, gym: data });
    } catch(err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

app.post('/api/admin/toggle', async (req, res) => {
    try {
        const { gymCode, status } = req.body;
        const gym = db.gyms.find(g => g.gymCode === gymCode);
        if (gym) {
            gym.active = status;
            await saveToCloud();
        }
        res.json({ success: true, message: `Gimnasio ${gymCode} actualizado en la nube` });
    } catch(err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

app.delete('/api/admin/gyms/:gymCode', async (req, res) => {
    try {
        db.gyms = db.gyms.filter(g => g.gymCode !== req.params.gymCode);
        db.clientCodes = db.clientCodes.filter(c => c.gymCode !== req.params.gymCode);
        await saveToCloud();
        res.json({ success: true });
    } catch(err) {
        res.status(500).json({ success: false, error: err.message });
    }
});


// --- RUTAS DEL PANEL COACH (coach.html) ---

app.post('/api/coach/login', (req, res) => {
    try {
        const { gymCode, password } = req.body;
        
        if(gymCode === "GYM-MASTER" && password === "1234") {
            return res.json({ success: true, gym: { name: "Máquina Principal", maxUsers: 9999, active: true, gymCode: "GYM-MASTER" }, currentUsers: 0 });
        }

        const gym = db.gyms.find(g => g.gymCode === gymCode);
        if(!gym) return res.json({ success: false, message: "CÓDIGO DE FRANQUICIA INEXISTENTE" });
        if(!gym.active) return res.json({ success: false, message: "SISTEMA CONGELADO. CONTACTA AX-CORE MÁSTER." });
        if(gym.password !== password) return res.json({ success: false, message: "CONTRASEÑA INCORRECTA" });
        
        const usageCount = db.clientCodes.filter(c => c.gymCode === gymCode).length;
        res.json({ success: true, gym, currentUsers: usageCount });
    } catch(err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

app.get('/api/coach/codes/:gymCode', (req, res) => {
    try {
        const { gymCode } = req.params;
        res.json(db.clientCodes.filter(c => c.gymCode === gymCode));
    } catch(err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

app.post('/api/coach/generate', async (req, res) => {
    try {
        const { gymId, user } = req.body; 
        
        let limit = 50; 
        if (gymId !== "GYM-MASTER") {
            const gym = db.gyms.find(g => g.gymCode === gymId);
            if(!gym) return res.json({ success: false, message: "Franquicia no encontrada en la Nube." });
            if(!gym.active) return res.json({ success: false, message: "SISTEMA PAUSADO POR AX-CORE." });
            limit = gym.maxUsers || 50;
        } else { 
            limit = 9999; 
        }

        const currentCount = db.clientCodes.filter(c => c.gymCode === gymId).length;
        if (currentCount >= limit) {
            return res.json({ success: false, message: `LÍMITE ALCANZADO (Máx: ${limit} códigos).\nMejore su plan para expandir límite.` });
        }
        
        const newCode = `AX-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
        db.clientCodes.push({ code: newCode, gymCode: gymId, active: true, user: user || "Atleta", createdAt: new Date() });
        await saveToCloud();
        
        res.json({ success: true, code: newCode, remaining: limit - (currentCount + 1) });
    } catch(err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

app.post('/api/coach/toggle', async (req, res) => {
    try {
        const { code, status } = req.body;
        const cc = db.clientCodes.find(c => c.code === code);
        if (cc) {
            cc.active = status;
            await saveToCloud();
        }
        res.json({ success: true });
    } catch(err) {
        res.status(500).json({ success: false, error: err.message });
    }
});


// --- RUTAS DEL USUARIO FINAL (app.js) ---

app.post('/api/validate', (req, res) => {
    try {
        const { code } = req.body;
        
        if (code === "AXV-DEMO" || code === "GYM-MASTER" || code === "AXV-ADMIN") {
            return res.json({ success: true, message: "ACCESO ALFA OTORGADO." });
        }

        const pass = db.clientCodes.find(c => c.code === code);
        if (pass) {
            if (!pass.active) return res.json({ success: false, message: "ACCESO DENEGADO POR TU RECEPCIÓN. CORTADO TEMPORALMENTE." });
            if (pass.gymCode !== "GYM-MASTER") {
                const gym = db.gyms.find(g => g.gymCode === pass.gymCode);
                if (gym && !gym.active) return res.json({ success: false, message: "FRANQUICIA SIN PAGO ACTIVO CON AX-CORE GLOBAL. COMUNÍCATE CON EL DUEÑO." });
            }
            return res.json({ success: true, message: "ACCESO ÉLITE CONCEDIDO." });
        }
        res.json({ success: false, message: "CÓDIGO INEXISTENTE. Pide uno en la recepción del gimnasio." });
    } catch(err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

app.get('/health', (req, res) => {
    res.json({ status: "AX-CORE BACKEND ONLINE", dbMode: "KVDB_CLOUD_PERSISTENT" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`AX-CORE KVDB Backend running on port ${PORT}`);
});
