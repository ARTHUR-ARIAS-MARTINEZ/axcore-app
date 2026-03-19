const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

const DB_FILE = path.join(__dirname, 'database.json');

// Inicializar DB si no existe (Nota: en plan gratuito de Render esto se borra al reiniciar)
// En una futura actualización podemos cambiar esta DB a MongoDB Atlas.
if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify({
        gyms: [
            { id: "GYM-MASTER", name: "AX-CORE Master Headquarters", active: true }
        ],
        codes: [
            { code: "AXV-DEMO", gymId: "GYM-MASTER", active: true, user: "Prueba Global" }
        ]
    }));
}

function getDB() {
    return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
}

function saveDB(data) {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

// 1. Endpoint: Validación de Acceso (Usado por la PWA del cliente)
app.post('/api/validate', (req, res) => {
    const { code } = req.body;
    const db = getDB();
    const found = db.codes.find(c => c.code === code);

    if (found) {
        if (found.active) {
            res.json({ success: true, message: "ACCESO ÉLITE CONCEDIDO." });
        } else {
            res.json({ success: false, message: "ACCESO DENEGADO (MENSUALIDAD PAUSADA)." });
        }
    } else {
        res.json({ success: false, message: "CÓDIGO INEXISTENTE. (Acércate a recepción)" });
    }
});

// 2. Endpoint: Obtener Clientes (Usado por la PWA del Gerente/Coach)
app.get('/api/coach/codes/:gymId', (req, res) => {
    const { gymId } = req.params;
    const db = getDB();
    const codes = db.codes.filter(c => c.gymId === gymId);
    res.json(codes);
});

// 3. Endpoint: Generar Nuevo Pase
app.post('/api/coach/generate', (req, res) => {
    const { gymId, user } = req.body;
    const db = getDB();
    const newCode = `AX-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
    
    db.codes.push({ code: newCode, gymId, active: true, user: user || "Nuevo Atleta" });
    saveDB(db);
    
    res.json({ success: true, code: newCode });
});

// 4. Endpoint: El "Kill Switch" (Pausar o Activar)
app.post('/api/coach/toggle', (req, res) => {
    const { code, status } = req.body;
    const db = getDB();
    const idx = db.codes.findIndex(c => c.code === code);
    
    if (idx !== -1) {
        db.codes[idx].active = status;
        saveDB(db);
        res.json({ success: true });
    } else {
        res.json({ success: false });
    }
});

app.get('/health', (req, res) => res.json({ status: "AX-CORE BACKEND ONLINE" }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`AX-CORE Coach Backend running on port ${PORT}`);
});
