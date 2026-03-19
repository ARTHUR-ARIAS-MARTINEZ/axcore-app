document.addEventListener('DOMContentLoaded', () => {
    // --- ELEMENTOS DEL DOM ---
    const loginOverlay = document.getElementById('login-overlay');
    const registerOverlay = document.getElementById('register-overlay');
    const appContainer = document.getElementById('app-container');
    
    // Auth inputs
    const loginUser = document.getElementById('login-user');
    const loginPass = document.getElementById('login-pass');
    const regUser = document.getElementById('reg-user');
    const regPass = document.getElementById('reg-pass');
    
    const liveTimeEl = document.getElementById('live-time');
    const liveDateEl = document.getElementById('live-date');
    const navLinks = document.querySelectorAll('.nav-links li');
    const pages = document.querySelectorAll('.page');
    
    const aiInput = document.getElementById('ai-input');
    const sendAiBtn = document.getElementById('send-ai');
    const btnMic = document.getElementById('btn-mic');
    const chatBox = document.getElementById('chat-box');
    
    const apiKeyInput = document.getElementById('api-key');
    const themeBtns = document.querySelectorAll('.theme-btn');
    const saveSettingsBtn = document.getElementById('save-settings');
    const saveMeasurementsBtn = document.getElementById('save-measurements');
    const navLogout = document.getElementById('nav-logout');

    const sensationFeedback = document.getElementById('sensation-feedback');
    const btnAskAiSensation = document.getElementById('btn-ask-ai-sensation');

    // --- ESTADO Y PERSISTENCIA ---
    let sessionActive = false;
    let currentUser = localStorage.getItem('arthur_current_user') || null;

    // --- CRONÓMETRO GLOBAL (persiste entre secciones) ---
    let swTimer = 0; // en centisegundos
    let swInterval = null;
    let swRunning = false;

    function getStorageKey() {
        return currentUser ? `arthur_data_${currentUser}` : null;
    }

    let userData = {
        username: '',
        password: '',
        avatar: '',
        height: 1.74,
        weight: 100,
        waist: 115,
        bicep: 0,
        tricep: 0,
        leg: 0,
        chest: 0,
        hip: 0,
        calf: 0,
        glute: 0,
        neck: 0,
        target_weight: 85,
        dailyCalLimit: 1600,
        caloriesConsumedToday: 0,
        caloriesBurnedToday: 0,
        totalNetDeficit: 0, 
        apiKey: '',
        theme: 'neon',
        history: [], 
        foodLogToday: [], 
        recommendedDiet: { breakfast: '', lunch: '', dinner: '', snacks: '' },
        customDietRules: null,
        lastUpdateDate: new Date().toDateString()
    };

    // --- INICIALIZACIÓN ---
    initAuth();
    startClock();

    function initAuth() {
        if (currentUser) {
            loadUserData();
            showApp();
        } else {
            showLogin();
        }
    }
    function loadUserData() {
        const saved = localStorage.getItem(getStorageKey());
        if (saved) {
            userData = { ...userData, ...JSON.parse(saved) };
            if (!userData.foodLogToday) userData.foodLogToday = [];
            if (!userData.forearm) userData.forearm = 0;
            if (!userData.back) userData.back = 0;
            
            // Reset diario de calorías
            const today = new Date().toDateString();
            if (userData.lastUpdateDate !== today) {
                const dayDeficit = userData.dailyCalLimit - (userData.caloriesConsumedToday - userData.caloriesBurnedToday);
                userData.totalNetDeficit += Math.max(0, dayDeficit);
                userData.caloriesConsumedToday = 0;
                userData.caloriesBurnedToday = 0;
                userData.foodLogToday = [];
                userData.lastUpdateDate = today;
                saveData();
            }
        }
        applySettings();
        updateDashboard();
    }

    function applySettings() {
        document.body.setAttribute('data-theme', userData.theme);
        themeBtns.forEach(b => {
            b.classList.toggle('active', b.dataset.theme === userData.theme);
        });
        document.getElementById('display-username').textContent = userData.username.toUpperCase();
        if (userData.avatar) {
            const ap = document.getElementById('avatar-preview');
            if (ap) ap.style.backgroundImage = `url(${userData.avatar})`;
        }
        
        // Listener para avatar
        const avatarEl = document.getElementById('avatar-preview');
        const uploadEl = document.getElementById('avatar-upload');
        avatarEl.onclick = () => uploadEl.click();
        uploadEl.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (f) => {
                const base64 = f.target.result;
                userData.avatar = base64;
                avatarEl.style.backgroundImage = `url(${base64})`;
                saveData();
                console.log("Avatar guardado profesionalmente.");
            };
            reader.readAsDataURL(file);
        };
        
        const unEl = document.getElementById('input-username');
        if (unEl) unEl.value = userData.username || '';
        document.getElementById('input-height').value = userData.height || '';
        document.getElementById('input-weight').value = userData.weight || '';
        document.getElementById('input-waist').value = userData.waist || '';
        document.getElementById('input-target-weight').value = userData.target_weight || '';
        const ap2 = document.getElementById('api-key');
        if (ap2) ap2.value = userData.apiKey || '';
        const cw = document.getElementById('current-waist');
        if (cw) cw.textContent = userData.waist || 0;

        // Logros Spans
        const achUser = document.getElementById('ach-username');
        if (achUser) achUser.textContent = (userData.username || 'USUARIO').toUpperCase();
        const achDef = document.getElementById('ach-deficit');
        if (achDef) achDef.textContent = userData.totalNetDeficit || 0;
        const achWaist = document.getElementById('ach-waist');
        if (achWaist) achWaist.textContent = userData.waist || 0;
    }

    function saveData() {
        if (currentUser) {
            localStorage.setItem(getStorageKey(), JSON.stringify(userData));
        }
    }

    // --- LOGIC AUTH ---
    document.getElementById('toggle-to-register').onclick = () => {
        loginOverlay.classList.add('hidden');
        registerOverlay.classList.remove('hidden');
    };
    document.getElementById('toggle-to-login').onclick = () => {
        registerOverlay.classList.add('hidden');
        loginOverlay.classList.remove('hidden');
    };

    const API_URL = "https://axcore-appax-core-backend.onrender.com";

    document.getElementById('btn-register-confirm').onclick = async () => {
        const u = regUser.value.trim();
        const p = regPass.value.trim();
        const gcc = document.getElementById('reg-gym-code');
        const gc = gcc ? gcc.value.trim().toUpperCase() : '';
        
        if (u.length < 3 || p.length < 4) {
            alert("Usuario min 3 caracteres, Clave min 4.");
            return;
        }
        if (!gc) {
            alert("CÓDIGO AX REQUERIDO: Pídelo en tu gimnasio para crear tu cuenta.");
            return;
        }
        if (localStorage.getItem(`arthur_data_${u}`)) {
            alert("Este usuario ya existe en tu dispositivo.");
            return;
        }

        const btn = document.getElementById('btn-register-confirm');
        const originalText = btn.textContent;
        btn.textContent = "VERIFICANDO...";
        btn.disabled = true;

        try {
            // Validar Código con Backend
            const res = await fetch(`${API_URL}/api/validate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code: gc })
            });
            const data = await res.json();
            
            if (data.success) {
                currentUser = u;
                userData.username = u;
                userData.password = p;
                userData.gymCode = gc;
                userData.apiKey = 'validated_via_backend'; 
                saveData();
                localStorage.setItem('arthur_current_user', u);
                alert(data.message);
                location.reload();
            } else {
                alert(data.message); // ej: "Código inactivo o inválido"
            }
        } catch(e) {
            // Si el backend duerme o falla, permitimos modo offline si usan pase maestro
            if (gc === "AXV-DEMO" || gc === "GYM-MASTER") {
                currentUser = u;
                userData.username = u;
                userData.password = p;
                userData.gymCode = gc;
                userData.apiKey = 'validated_offline';
                saveData();
                localStorage.setItem('arthur_current_user', u);
                alert("Modo Fuera de Línea Activado (Servidor reiniciando).");
                location.reload();
            } else {
                alert("Error contactando la Base de Datos Central. Verifica tu conexión o espera 1 minuto a que despierte el servidor.");
            }
        }
        
        btn.textContent = originalText;
        btn.disabled = false;
    };

    document.getElementById('btn-login-access').onclick = async () => {
        const u = loginUser.value.trim();
        const p = loginPass.value.trim();
        const savedRaw = localStorage.getItem(`arthur_data_${u}`);
        if (!savedRaw) {
            alert("Usuario no encontrado en este dispositivo.");
            return;
        }
        const saved = JSON.parse(savedRaw);
        if (saved.password !== p) {
            alert("Contraseña incorrecta.");
            return;
        }

        const gc = saved.gymCode || "AXV-DEMO"; // Fallback por si era usuario viejo
        const btn = document.getElementById('btn-login-access');
        const originalText = btn.textContent;
        btn.textContent = "CONECTANDO...";
        btn.disabled = true;

        try {
            // Cada que el usuario entra, validamos su membresía en tiempo real
            const res = await fetch(`${API_URL}/api/validate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code: gc })
            });
            const data = await res.json();
            
            if (data.success) {
                currentUser = u;
                localStorage.setItem('arthur_current_user', u);
                location.reload();
            } else {
                alert("ACCESO DENEGADO POR TU GIMNASIO: " + data.message);
            }
        } catch(e) {
            // Modo offline permitido para entrar rápido si el servidor se está levantando
            currentUser = u;
            localStorage.setItem('arthur_current_user', u);
            location.reload();
        }

        btn.textContent = originalText;
        btn.disabled = false;
    };

    // Enter para hacer login rápido
    if (loginPass) loginPass.onkeypress = (e) => { if (e.key === 'Enter') document.getElementById('btn-login-access').click(); };
    if (regPass) regPass.onkeypress = (e) => { if (e.key === 'Enter') document.getElementById('btn-register-confirm').click(); };

    // El logout se gestiona ahora dentro del click de navLinks para evitar sobreescritura

    function showApp() {
        loginOverlay.classList.add('hidden');
        registerOverlay.classList.add('hidden');
        appContainer.classList.remove('hidden');
    }
    function showLogin() {
        appContainer.classList.add('hidden');
        loginOverlay.classList.remove('hidden');
    }

    // --- DASHBOARD & STATS ---
    function updateDashboard() {
        // Peso
        document.getElementById('current-weight').textContent = (userData.weight || 0).toFixed(1);
        document.getElementById('weight-meta-text').textContent = `Meta: ${userData.target_weight || 0} KG`;
        const progW = Math.max(0, Math.min(100, ((110 - (userData.weight || 110)) / Math.max(1, (110 - (userData.target_weight || 85)))) * 100));
        document.getElementById('weight-progress').style.width = `${progW}%`;
        const wpEl = document.getElementById('weight-percent');
        if (wpEl) wpEl.textContent = `${Math.round(progW)}%`;

        // Cintura
        document.getElementById('current-waist').textContent = userData.waist || 0;
        const targetWaist = userData.target_waist || 100;
        const initialWaist = 115;
        const progWaist = Math.max(0, Math.min(100, ((initialWaist - (userData.waist || initialWaist)) / Math.max(1, initialWaist - targetWaist)) * 100));
        document.getElementById('waist-meta-text').textContent = `Meta: ${targetWaist} CM`;
        const waistBar = document.getElementById('waist-progress');
        if (waistBar) waistBar.style.width = `${progWaist}%`;
        const wapEl = document.getElementById('waist-percent');
        if (wapEl) wapEl.textContent = `${Math.round(progWaist)}%`;
        
        // Calorías
        const net = userData.caloriesConsumedToday - userData.caloriesBurnedToday;
        const calEl = document.getElementById('calories-net');
        calEl.textContent = net;
        calEl.style.color = net > userData.dailyCalLimit ? 'var(--accent-alert)' : '';
        document.getElementById('cal-in').textContent = userData.caloriesConsumedToday;
        document.getElementById('cal-out').textContent = userData.caloriesBurnedToday;
        
        const calPerc = Math.min(100, (userData.caloriesConsumedToday / userData.dailyCalLimit) * 100);
        const calBar = document.getElementById('cal-progress');
        calBar.style.width = `${calPerc}%`;
        calBar.classList.toggle('warning', userData.caloriesConsumedToday > userData.dailyCalLimit);
        document.getElementById('cal-rem-text').textContent = `Límite diario: ${userData.dailyCalLimit} KCAL`;
        const cpEl = document.getElementById('cal-percent');
        if (cpEl) cpEl.textContent = `${Math.round(calPerc)}%`;

        // Déficit histórico
        const def = userData.totalNetDeficit || 0;
        document.getElementById('total-deficit').textContent = def;
        const kgEquiv = Math.abs(def / 7700).toFixed(2);
        const kbText = document.getElementById('kilos-burned-text');
        if (def >= 0) {
            kbText.textContent = `${kgEquiv} kg`;
            kbText.style.color = "var(--accent-secondary)";
        } else {
            kbText.textContent = `+${kgEquiv} kg`;
            kbText.style.color = "var(--accent-alert)";
        }

        // IMC
        const imcEl = document.getElementById('imc-value');
        const imcLabel = document.getElementById('imc-label');
        if (imcEl && userData.height > 0 && userData.weight > 0) {
            const imc = (userData.weight / (userData.height * userData.height)).toFixed(1);
            imcEl.textContent = imc;
            if (imc < 18.5) { imcLabel.textContent = 'BAJO PESO'; imcLabel.style.color = 'var(--accent-secondary)'; }
            else if (imc < 25) { imcLabel.textContent = 'NORMAL'; imcLabel.style.color = 'var(--accent-main)'; }
            else if (imc < 30) { imcLabel.textContent = 'SOBREPESO'; imcLabel.style.color = 'var(--accent-alert)'; }
            else { imcLabel.textContent = 'OBESIDAD'; imcLabel.style.color = 'var(--accent-alert)'; }
        }
        
        // Última medida registrada
        const lastEl = document.getElementById('last-measure-info');
        if (lastEl && userData.history && userData.history.length > 0) {
            const last = userData.history[userData.history.length - 1];
            lastEl.textContent = `${last.date} | Peso: ${last.weight}kg | Cintura: ${last.waist || 0}cm | Bícep: ${last.bicep || 0}cm`;
        }
    }

    // --- NAVIGATION ---
    navLinks.forEach(link => {
        link.onclick = (e) => {
            if (link.id === 'nav-logout') {
                if (confirm("¿Cerrar sesión táctica en AX-CORE?")) {
                    localStorage.removeItem('arthur_current_user');
                    location.reload();
                }
                return;
            }

            const pageId = link.dataset.page;
            if (!pageId) return;
            pages.forEach(p => p.classList.remove('active'));
            document.getElementById(`page-${pageId}`).classList.add('active');
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            
            if (pageId === 'diet') renderDietPage();
            if (pageId === 'workout') renderWorkoutPage();
            if (pageId === 'evolution') renderEvolutionPage('all');

            // Mostrar mini-cronómetro cuando NO estamos en workout y está corriendo
            const miniContainer = document.getElementById('sw-mini-container');
            if (miniContainer) {
                if (pageId !== 'workout' && (swRunning || swTimer > 0)) {
                    miniContainer.style.display = 'flex';
                } else {
                    miniContainer.style.display = 'none';
                }
            }
        };
    });

    // --- EVOLUTION LOGIC ---
    function renderEvolutionPage(filter = 'all') {
        const body = document.getElementById('history-body');
        const now = new Date();
        const dayOfWeek = now.getDay();
        const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dayOfWeek);
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        let filtered = [...(userData.history || [])]; // Copia para no mutar
        if (filter === 'week') filtered = filtered.filter(h => new Date(h.date) >= startOfWeek);
        if (filter === 'month') filtered = filtered.filter(h => new Date(h.date) >= startOfMonth);

        body.innerHTML = filtered.reverse().map((h, i, arr) => {
            const prev = arr[i+1];
            const diff = prev ? (h.weight - prev.weight).toFixed(1) : "0.0";
            const diffColor = diff < 0 ? "#00ff88" : "#ff3366";
            return `
                <tr style="border-bottom:1px solid rgba(255,255,255,0.05);">
                    <td style="padding:1rem; font-size:0.8rem;">${h.date}</td>
                    <td style="padding:1rem; font-weight:bold;">${h.weight} kg</td>
                    <td style="padding:1rem;">${h.waist} cm</td>
                    <td style="padding:1rem;">${h.bicep || 0} cm</td>
                    <td style="padding:1rem;">${h.tricep || 0} cm</td>
                    <td style="padding:1rem;">${h.leg || 0} cm</td>
                    <td style="padding:1rem;">${h.chest || 0} cm</td>
                    <td style="padding:1rem;">${h.hip || 0} cm</td>
                    <td style="padding:1rem;">${h.calf || 0} cm</td>
                    <td style="padding:1rem;">${h.glute || 0} cm</td>
                    <td style="padding:1rem;">${h.neck || 0} cm</td>
                    <td style="padding:1rem;">${h.forearm || 0} cm</td>
                    <td style="padding:1rem;">${h.back || 0} cm</td>
                    <td style="padding:1rem; color:${diffColor}; font-weight:bold;">${diff > 0 ? '+'+diff : diff} kg</td>
                    <td style="padding:1rem;">
                        <button class="btn-cancel" style="padding:2px 6px; font-size:0.6rem; background:transparent; border:1px solid var(--accent-alert); color:var(--accent-alert); border-radius:4px;" onclick="deleteHistoryRow(${filtered.length - 1 - i})">X</button>
                    </td>
                </tr>
            `;
        }).join('');

        document.getElementById('btn-save-daily').onclick = () => {
            const w = parseFloat(document.getElementById('log-weight').value) || 0;
            const ws = parseFloat(document.getElementById('log-waist').value) || 0;
            const bc = parseFloat(document.getElementById('log-bicep').value) || 0;
            const tr = parseFloat(document.getElementById('log-tricep').value) || 0;
            const lg = parseFloat(document.getElementById('log-leg').value) || 0;
            const ch = parseFloat(document.getElementById('log-chest').value) || 0;
            const hp = parseFloat(document.getElementById('log-hip').value) || 0;
            const cf = parseFloat(document.getElementById('log-calf').value) || 0;
            const gl = parseFloat(document.getElementById('log-glute').value) || 0;
            const nk = parseFloat(document.getElementById('log-neck').value) || 0;
            const fr = parseFloat(document.getElementById('log-forearm').value) || 0;
            const bk = parseFloat(document.getElementById('log-back').value) || 0;

            if (!w && !ws) { alert("Al menos ingresa Peso o Cintura."); return; }
            
            const rec = { date: new Date().toLocaleDateString('es-MX'), weight: w, waist: ws, bicep: bc, tricep: tr, leg: lg, chest: ch, hip: hp, calf: cf, glute: gl, neck: nk, forearm: fr, back: bk };
            userData.history.push(rec);
            if (w) userData.weight = w;
            if (ws) userData.waist = ws;
            if (bc) userData.bicep = bc;
            if (tr) userData.tricep = tr;
            if (lg) userData.leg = lg;
            if (ch) userData.chest = ch;
            if (hp) userData.hip = hp;
            if (cf) userData.calf = cf;
            if (gl) userData.glute = gl;
            if (nk) userData.neck = nk;
            if (fr) userData.forearm = fr;
            if (bk) userData.back = bk;
            saveData();
            updateDashboard();
            renderEvolutionPage(filter);
            // Limpiar inputs
            ['log-weight','log-waist','log-bicep','log-tricep','log-leg','log-chest','log-hip','log-calf','log-glute','log-neck','log-forearm','log-back'].forEach(id => {
                const el = document.getElementById(id);
                if(el) el.value = '';
            });
            alert("Medidas guardadas con éxito.");
        };

        window.deleteHistoryRow = (realIndex) => {
            if (confirm("¿Eliminar este registro de evolución?")) {
                userData.history.splice(realIndex, 1);
                saveData();
                renderEvolutionPage(filter);
                updateDashboard();
            }
        };

        // Filtros
        document.getElementById('filter-all').onclick = () => renderEvolutionPage('all');
        document.getElementById('filter-week').onclick = () => renderEvolutionPage('week');
        document.getElementById('filter-month').onclick = () => renderEvolutionPage('month');
    }

    // --- DIET PAGE ---
    function renderDietPage() {
        const diet = userData.recommendedDiet || { breakfast: '', lunch: '', dinner: '', snacks: '' };
        const dietEl = document.getElementById('page-diet');
        dietEl.innerHTML = `
            <div class="glass-card diet-plan" style="max-width:800px; margin: 0 auto;">
                <h2 style="font-family:var(--font-accent); color:var(--accent-main); margin-bottom:1.5rem; text-align:center;">PLAN ALIMENTICIO VANGUARDIA</h2>
                
                <!-- AUTO-COMPLETAR CON IA -->
                <div class="meal-item glass-card" style="padding:2rem; border-color:var(--accent-main); margin-bottom:2rem;">
                    <h3 style="color:var(--accent-main); font-size:1.1rem; margin-bottom:1rem;">IMPORTACIÓN INTELIGENTE (IA)</h3>
                    <p style="font-size:0.8rem; color:var(--text-dim); margin-bottom:1rem;">Pega aquí el plan que te dio tu nutriólogo. AX-CORE lo procesará y acomodará en las casillas correspondientes.</p>
                    <textarea id="diet-raw-text" placeholder="Ej: Lunes: Desayuno 2 huevos con jamón, comida pechuga asada, cena ensalada, snacks cacahuates..." style="width:100%; min-height:80px; background:rgba(0,0,0,0.5); color:white; border:1px dashed var(--accent-main); border-radius:8px; padding:0.8rem; margin-bottom:1rem;"></textarea>
                    <button class="btn-premium" id="btn-parse-diet" style="width:100%;">⚙️ PROCESAR CON IA</button>
                </div>

                <!-- DIETA RECOMENDADA: SOLO LECTURA -->
                <div class="meal-item glass-card" style="padding:2rem; border-color:var(--accent-secondary); margin-bottom:2rem;">
                    <h3 style="color:var(--accent-secondary); font-size:1.1rem; margin-bottom:1.5rem; border-bottom:1px solid var(--accent-secondary); padding-bottom:0.5rem;">DIETA DETALLADA</h3>
                    <div style="display:grid; grid-template-columns: 1fr 1fr; gap:20px;" class="diet-grid-mobile">
                        <div style="display:flex; flex-direction:column;">
                            <label style="color:var(--accent-main); font-weight:bold; display:block; font-size:0.85rem; margin-bottom:0.5rem;">DESAYUNO</label>
                            <div style="flex:1; background:rgba(0,0,0,0.4); border:1px solid var(--glass-border); border-radius:8px; padding:0.8rem; color:var(--text-primary); line-height:1.5; font-size:0.9rem;">${diet.breakfast || '<span style="color:var(--text-dim); font-style:italic;">Sin definir. Usa la importación inteligente.</span>'}</div>
                        </div>
                        <div style="display:flex; flex-direction:column;">
                            <label style="color:var(--accent-main); font-weight:bold; display:block; font-size:0.85rem; margin-bottom:0.5rem;">COMIDA</label>
                            <div style="flex:1; background:rgba(0,0,0,0.4); border:1px solid var(--glass-border); border-radius:8px; padding:0.8rem; color:var(--text-primary); line-height:1.5; font-size:0.9rem;">${diet.lunch || '<span style="color:var(--text-dim); font-style:italic;">Sin definir.</span>'}</div>
                        </div>
                        <div style="display:flex; flex-direction:column;">
                            <label style="color:var(--accent-main); font-weight:bold; display:block; font-size:0.85rem; margin-bottom:0.5rem;">CENA</label>
                            <div style="flex:1; background:rgba(0,0,0,0.4); border:1px solid var(--glass-border); border-radius:8px; padding:0.8rem; color:var(--text-primary); line-height:1.5; font-size:0.9rem;">${diet.dinner || '<span style="color:var(--text-dim); font-style:italic;">Sin definir.</span>'}</div>
                        </div>
                        <div style="display:flex; flex-direction:column;">
                            <label style="color:var(--accent-main); font-weight:bold; display:block; font-size:0.85rem; margin-bottom:0.5rem;">SNACKS / ADICIONALES</label>
                            <div style="flex:1; background:rgba(0,0,0,0.4); border:1px solid var(--glass-border); border-radius:8px; padding:0.8rem; color:var(--text-primary); line-height:1.5; font-size:0.9rem;">${diet.snacks || '<span style="color:var(--text-dim); font-style:italic;">Sin definir.</span>'}</div>
                        </div>
                    </div>
                    <p style="margin-top:1rem; font-size:0.7rem; color:var(--text-dim); text-align:center;">Para actualizar, usa la sección de Importación Inteligente arriba.</p>
                </div>

                <!-- REGLAS ESTRUCTURALES -->
                <div class="meal-item glass-card" style="padding:2rem; margin-bottom:2rem;">
                    <h3 style="color:var(--accent-main); font-size:1rem; margin-bottom:1rem;">REGLAS ESTRUCTURADAS GLOBALES</h3>
                    <ul style="display:grid; grid-template-columns: 1fr 1fr; gap:10px; font-size:0.9rem;">
                        ${(userData.customDietRules || ARTHUR_KNOWLEDGE.diet_rules).map(r => `<li style="margin-bottom:5px; color:var(--text-dim);">• ${r}</li>`).join('')}
                    </ul>
                    <p style="margin-top:1rem; font-size:0.65rem; color:var(--text-dim); text-align:center; font-style:italic;">${userData.customDietRules ? '✅ Reglas personalizadas por tu nutriólogo (generadas por IA)' : 'Reglas base de AX-CORE. Se actualizarán automáticamente al procesar tu dieta del nutriólogo.'}</p>
                </div>

                <!-- REGISTRO DE CALORÍAS REALES -->
                <div class="reg-food-container" style="border: 2px solid var(--accent-main); background: rgba(0,0,0,0.5); padding:2rem; border-radius:20px;">
                    <h3 style="color:var(--accent-main); font-family:var(--font-accent); margin-bottom:0.5rem;">REGISTRO DE INGESTA REAL</h3>
                    <p style="font-size:0.8rem; margin-bottom:1.5rem; color:var(--text-dim);">Reporta tus alimentos para que Arthur calibre tu metabolismo.</p>
                    <div class="food-entry-group" style="display:flex; gap:15px;">
                        <input type="text" id="food-desc" placeholder="Ej. 100g de pollo y media taza de arroz..." style="flex:3; background:rgba(0,0,0,0.7); border:1px solid var(--accent-main); padding:1rem; color:white; border-radius:12px; font-size:1rem;">
                        <button class="btn-premium" id="btn-add-food" style="flex:1; padding:1rem; font-weight:bold;">REGISTRAR</button>
                    </div>
                </div>
            </div>
        `;

        // La dieta es solo lectura: no hay btn-save-diet-text
        // El procesamiento de IA actualiza los campos directamente
        document.getElementById('btn-parse-diet').onclick = async () => {
            const raw = document.getElementById('diet-raw-text').value.trim();
            if(!raw) return alert("Pega el texto original del nutricionista primero.");
            if(!userData.apiKey) return alert("Esta función requiere la API Key conectada.");
            
            const btn = document.getElementById('btn-parse-diet');
            btn.textContent = "⚙️ PROCESANDO DIETA Y REGLAS...";
            btn.disabled = true;
            
            // PASO 1: Extraer comidas organizadas
            const promptComidas = `Extrae u organiza el siguiente texto en las comidas requeridas. Responde estrictamente con un JSON válido, sin Markdown, con las claves exactas: "breakfast", "lunch", "dinner", "snacks". Si alguna no existe, déjala vacía. Texto a analizar: "${raw}"`;
            
            try {
                const res = await callPerplexity(promptComidas, 'json');
                const jsonStr = res.substring(res.indexOf('{'), res.lastIndexOf('}') + 1);
                const parsed = JSON.parse(jsonStr);
                
                userData.recommendedDiet = {
                    breakfast: parsed.breakfast || userData.recommendedDiet.breakfast || '',
                    lunch: parsed.lunch || userData.recommendedDiet.lunch || '',
                    dinner: parsed.dinner || userData.recommendedDiet.dinner || '',
                    snacks: parsed.snacks || userData.recommendedDiet.snacks || ''
                };
                
                btn.textContent = "⚙️ GENERANDO REGLAS PERSONALIZADAS...";
                
                // PASO 2: Generar reglas estructurales basadas en la dieta del nutriólogo
                const promptReglas = `Basándote en esta dieta de un nutriólogo, genera entre 5 y 8 REGLAS ESTRUCTURALES concisas y claras que el usuario debe seguir para maximizar los resultados de esta dieta específica. Las reglas deben ser prácticas, directas y adaptadas a los alimentos mencionados. Responde SOLO con un JSON válido con la clave "rules" que sea un array de strings. Dieta: Desayuno: ${userData.recommendedDiet.breakfast}. Comida: ${userData.recommendedDiet.lunch}. Cena: ${userData.recommendedDiet.dinner}. Snacks: ${userData.recommendedDiet.snacks}.`;
                
                try {
                    const resReglas = await callPerplexity(promptReglas, 'json');
                    const jsonReglas = resReglas.substring(resReglas.indexOf('{'), resReglas.lastIndexOf('}') + 1);
                    const parsedReglas = JSON.parse(jsonReglas);
                    
                    if (parsedReglas.rules && Array.isArray(parsedReglas.rules) && parsedReglas.rules.length > 0) {
                        userData.customDietRules = parsedReglas.rules;
                    }
                } catch(e2) {
                    console.warn("No se pudieron generar reglas personalizadas, se mantienen las base.", e2);
                }
                
                saveData();
                renderDietPage(); // Refrescar vista con dieta Y reglas actualizadas
                alert('✅ ¡Dieta Y reglas actualizadas! Las reglas estructurales ahora están basadas en tu dieta del nutriólogo.');
            } catch(e) {
                console.error(e);
                alert("Hubo un error al procesar. Revisa la conexión.");
            }
            btn.textContent = "⚙️ PROCESAR CON IA";
            btn.disabled = false;
        };

        document.getElementById('btn-add-food').onclick = async () => {
            const desc = document.getElementById('food-desc').value.trim();
            if (!desc) return;
            
            const btn = document.getElementById('btn-add-food');
            btn.textContent = "Consultando IA...";
            btn.disabled = true;
            
            const calUsed = userData.caloriesConsumedToday;
            const calLimit = userData.dailyCalLimit;

            // Prompt mejorado para obtener calorías reales del internet
            const prompt = `Busca en fuentes actuales de nutrición y bases de datos como USDA, Cronometer o FatSecret las calorías exactas de: "${desc}". Dame SOLAMENTE un número entero con las calorías. Si hay rango, usa el promedio. No des texto adicional, solo el número.`;
            
            let estimatedCal = 200;
            if (userData.apiKey) {
                try {
                    const res = await callPerplexity(prompt, 'number');
                    const parsed = parseInt(res.replace(/[^0-9]/g, ""));
                    if (!isNaN(parsed) && parsed > 0 && parsed < 5000) estimatedCal = parsed;
                } catch(e) { console.error(e); }
            }

            const newTotal = calUsed + estimatedCal;
            const remaining = calLimit - newTotal;
            
            userData.caloriesConsumedToday += estimatedCal;
            userData.totalNetDeficit -= Math.round(estimatedCal * 0.15);
            userData.foodLogToday.push({ time: new Date().toLocaleTimeString('es-MX', {hour: '2-digit', minute:'2-digit'}), desc, cal: estimatedCal });
            saveData();
            updateDashboard();
            
            let msg = `✅ Registrado: "${desc}"\n📊 Calorías: +${estimatedCal} kcal\n`;
            if (remaining > 0) {
                msg += `💚 Te quedan ${remaining} kcal disponibles hoy.`;
            } else {
                msg += `⚠️ SUPERASTE tu límite diario por ${Math.abs(remaining)} kcal. Compensa con ejercicio.`;
            }
            alert(msg);
            document.getElementById('food-desc').value = "";
            btn.textContent = "REGISTRAR";
            btn.disabled = false;
        };
    }

    // --- CRONÓMETRO GLOBAL (vive fuera del renderWorkoutPage) ---
    function formatSwTime(timer) {
        const h = Math.floor(timer/360000).toString().padStart(2,'0');
        const m = Math.floor((timer % 360000) / 6000).toString().padStart(2,'0');
        const s = Math.floor((timer % 6000) / 100).toString().padStart(2,'0');
        const ms = (timer % 100).toString().padStart(2,'0');
        return `${h}:${m}:${s}:${ms}`;
    }

    function startGlobalStopwatch() {
        if (swInterval) return; // Ya corriendo
        swRunning = true;
        swInterval = setInterval(() => {
            swTimer++;
            // Actualizar display si está visible
            const disp = document.getElementById('sw-display');
            if (disp) disp.textContent = formatSwTime(swTimer);
            // Actualizar mini-display del header si existe
            const miniDisp = document.getElementById('sw-mini-display');
            if (miniDisp) miniDisp.textContent = formatSwTime(swTimer);
        }, 10);
    }

    function pauseGlobalStopwatch() {
        clearInterval(swInterval);
        swInterval = null;
        swRunning = false;
    }

    function resetGlobalStopwatch() {
        pauseGlobalStopwatch();
        swTimer = 0;
        const disp = document.getElementById('sw-display');
        if (disp) disp.textContent = "00:00:00:00";
        const miniDisp = document.getElementById('sw-mini-display');
        if (miniDisp) {
            miniDisp.textContent = "00:00:00:00";
            miniDisp.parentElement.style.display = 'none';
        }
    }

    // --- WORKOUT PAGE ---
    function renderWorkoutPage() {
        const workoutEl = document.getElementById('page-workout');
        workoutEl.innerHTML = `
            <div class="glass-card workout-plan">
                <div class="stopwatch-container">
                    <h2 style="font-family:var(--font-accent); font-size:1rem; color:var(--accent-secondary);">CRONÓMETRO DE ALTO RENDIMIENTO</h2>
                    <p style="font-size:0.7rem; color:var(--text-dim); margin-bottom:0.5rem;">⚡ El cronómetro sigue corriendo aunque cambies de sección</p>
                    <div class="timer-display" id="sw-display" style="font-variant-numeric: tabular-nums; min-width: 320px;">${formatSwTime(swTimer)}</div>
                    <div class="timer-controls">
                        <button class="btn-premium" id="btn-sw-start" style="font-size:0.7rem; padding:0.8rem 1.5rem;">${swRunning ? '⏱️ CORRIENDO...' : 'INICIAR'}</button>
                        <button class="btn-premium" id="btn-sw-stop" style="font-size:0.7rem; padding:0.8rem 1.5rem;">PAUSAR</button>
                        <button class="btn-premium" id="btn-sw-reset" style="font-size:0.7rem; padding:0.8rem 1.5rem; background:transparent; border-color:var(--accent-alert); color:var(--accent-alert);">REINICIAR</button>
                    </div>
                </div>

                <h2>CATÁLOGO DE ENTRENAMIENTO (BASADO EN CIENCIA REAL)</h2>
                <div class="exercise-catalog" style="grid-template-columns: repeat(2, 1fr);">
                    ${ARTHUR_KNOWLEDGE.exercises_catalog.map((ex, i) => {
                        const unit = ex.unit || (ex.type === 'Cardio' || ex.type === 'HIIT' ? 'Minutos' : 'Series');
                        const baseVal = ex.baseVal || (ex.type === 'Cardio' || ex.type === 'HIIT' ? 30 : 4); 
                        return `
                        <div class="exercise-card" style="text-align:left; padding:1.5rem;">
                            <h4 style="color:var(--text-primary); font-family:var(--font-accent);">${ex.name}</h4>
                            <span style="font-size:0.7rem; color:var(--bg-dark); background:var(--accent-secondary); border-radius:10px; padding:3px 8px; display:inline-block; margin-bottom:10px; font-weight:bold;">${ex.type}</span>
                            <small>${ex.desc}</small>
                            <div style="margin:1rem 0; display:flex; align-items:center; gap:10px;">
                                <input type="number" class="ex-input" value="${baseVal}" style="width:60px; background:rgba(0,0,0,0.5); border:1px solid var(--accent-main); color:white; padding:5px; border-radius:5px;">
                                <label style="font-size:0.8rem;">${unit}</label>
                            </div>
                            <button class="btn-finish-ex" 
                                data-base-cal="${ex.cal}" 
                                data-base-unit="${baseVal}"
                                style="width:100%;">REGISTRAR</button>
                        </div>
                    `}).join('')}
                </div>
            </div>
        `;

        // Conectar botones al cronómetro GLOBAL
        document.getElementById('btn-sw-start').onclick = () => {
            startGlobalStopwatch();
            document.getElementById('btn-sw-start').textContent = '⏱️ CORRIENDO...';
            // Mostrar mini-display en header
            const miniDisp = document.getElementById('sw-mini-display');
            if (miniDisp) miniDisp.parentElement.style.display = 'flex';
        };
        document.getElementById('btn-sw-stop').onclick = () => {
            pauseGlobalStopwatch();
            document.getElementById('btn-sw-start').textContent = 'INICIAR';
        };
        document.getElementById('btn-sw-reset').onclick = () => {
            resetGlobalStopwatch();
            document.getElementById('btn-sw-start').textContent = 'INICIAR';
        };

        // Registro ejercicio – MÚLTIPLES VECES por ejercicio
        document.querySelectorAll('.btn-finish-ex').forEach(btn => {
            btn.onclick = (e) => {
                const card = e.target.closest('.exercise-card');
                const val = parseFloat(card.querySelector('.ex-input').value) || 0;
                if (val <= 0) return;
                const baseCal = parseInt(e.target.dataset.baseCal);
                const baseUnit = parseInt(e.target.dataset.baseUnit);
                const realCal = Math.round((baseCal / baseUnit) * val);
                
                userData.caloriesBurnedToday += realCal;
                userData.totalNetDeficit += realCal;
                saveData();
                updateDashboard();
                
                // Acumular en badge de la tarjeta
                let badge = card.querySelector('.ex-badge');
                if (!badge) {
                    badge = document.createElement('span');
                    badge.className = 'ex-badge';
                    badge.style.cssText = 'display:inline-block; background:var(--accent-main); color:#000; font-size:0.6rem; font-weight:bold; padding:2px 8px; border-radius:10px; margin-bottom:8px;';
                    card.querySelector('h4').insertAdjacentElement('afterend', badge);
                }
                const prev = parseInt(badge.dataset.total || '0');
                const newTotal = prev + realCal;
                badge.dataset.total = newTotal;
                badge.textContent = `✅ Acumulado: +${newTotal} CAL`;
                
                // Feedback en botón brevemente, luego se reactiva
                const origText = e.target.textContent;
                e.target.textContent = `+${realCal} CAL ✓`;
                e.target.style.background = 'rgba(0,201,122,0.2)';
                setTimeout(() => {
                    e.target.textContent = 'REGISTRAR';
                    e.target.style.background = '';
                }, 1500);
            };
        });
    }

    // --- SENSATIONS ---
    document.querySelectorAll('.feeling-btn').forEach(btn => {
        btn.onclick = () => {
            const type = btn.dataset.type;
            const sensationFeedback = document.getElementById('sensation-feedback');
            sensationFeedback.classList.remove('hidden');
            let title = "";
            let ph = "";
            if (type === 'hunger') { title = "Arthur detecta hambre/antojo"; ph = "Ej. Siento ansiedad por pan, o mucha hambre..."; }
            if (type === 'symptom') { title = "Sensación física detectada"; ph = "Ej. Me siento cansado, bajón de energía, dolor..."; }
            if (type === 'mood') { title = "Fluctuación de estado mental"; ph = "Ej. Estoy triste, con mucha energía, o sin foco..."; }
            
            document.getElementById('sensation-title').textContent = title;
            document.getElementById('sensation-input').placeholder = ph;
            document.getElementById('sensation-input').value = ""; // Clear
            document.getElementById('btn-ask-ai-sensation').dataset.type = type;
        };
    });

    document.getElementById('btn-just-record').onclick = () => {
        document.getElementById('sensation-feedback').classList.add('hidden');
        alert("Sensación registrada en el historial de Arthur.");
    };

    document.getElementById('btn-ask-ai-sensation').onclick = () => {
        const type = document.getElementById('btn-ask-ai-sensation').dataset.type;
        const userInput = document.getElementById('sensation-input').value.trim() || "Siento esta emoción o síntoma ahora mismo.";
        
        let query = "";
        if (type === 'hunger') query = `Reporte de Hambre/Antojo: "${userInput}". ¿Por qué me pasa esto hoy (basado en lo que he comido o mis calorías) y cómo lo controlo con ciencia?`;
        if (type === 'symptom') query = `Reporte de Síntoma físico: "${userInput}". Relaciona esto metabólicamente con mis registros nutricionales de hoy y dame un protocolo rápido.`;
        if (type === 'mood') query = `Reporte de Estado mental / Energía: "${userInput}". Dame un reseteo psicológico, biológico o de mentalidad para optimizarme basado en mi dieta de hoy.`;
        
        document.getElementById('sensation-feedback').classList.add('hidden');
        switchPageToAi(query);
    };

    function switchPageToAi(q) {
        pages.forEach(p => p.classList.remove('active'));
        document.getElementById('page-assistant').classList.add('active');
        navLinks.forEach(l => {
            l.classList.toggle('active', l.dataset.page === 'assistant');
        });
        handleAiQueryStr(q);
    }

    // (applySettings duplicado eliminado — la versión completa está en la línea 108)

    themeBtns.forEach(btn => {
        btn.onclick = () => {
            const theme = btn.dataset.theme;
            userData.theme = theme;
            applySettings();
            saveData();
        };
    });

    // SHARE BUTTONS
    const btnShareApp = document.getElementById('btn-share-app');
    if (btnShareApp) {
        btnShareApp.onclick = () => {
            if (navigator.share) {
                navigator.share({
                    title: 'AX-CORE By Arthur',
                    text: 'Únete a la vanguardia de la optimización biológica con AX-CORE.',
                    url: 'https://arthur-arias-martinez.github.io/axcore-app/'
                }).catch(err => console.error("Error share app:", err));
            } else {
                alert("Tu dispositivo no soporta compartir nativo. Copia este enlace: https://arthur-arias-martinez.github.io/axcore-app/");
            }
        };
    }

    // GENERADOR DE TARJETA ESTILO GIMNASIO ALTA GAMA (HIERRO Y METAL)
    async function generateAchievementCard() {
        return new Promise((resolve) => {
            const W = 1080, H = 1350;
            const canvas = document.createElement('canvas');
            canvas.width = W;
            canvas.height = H;
            const ctx = canvas.getContext('2d');

            // ─── FONDO OSCURO SÓLIDO (ACERO Y CAUCHO DE GIMNASIO) ───
            const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
            bgGrad.addColorStop(0, '#1c1f24'); // Gris oscuro
            bgGrad.addColorStop(0.5, '#14161a'); 
            bgGrad.addColorStop(1, '#0b0c0e'); // Casi negro
            ctx.fillStyle = bgGrad;
            ctx.fillRect(0, 0, W, H);

            // ─── TEXTURA MALLA DE ACERO ROMBOIDAL (DIAMOND PLATE) ───
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.02)';
            ctx.lineWidth = 3;
            for (let i = -H; i < W * 2; i += 50) {
                ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i + H, H); ctx.stroke();
                ctx.beginPath(); ctx.moveTo(i + H, 0); ctx.lineTo(i, H); ctx.stroke();
            }

            // ─── BORDES Y ESTRUCTURA FUERTE (BARRAS DE PESAS) ───
            const accentBase = userData.theme === "original" ? "#d4af37" : (userData.theme === "neon" ? "#00c97a" : "#e8394a");
            
            ctx.strokeStyle = accentBase;
            ctx.lineWidth = 14;
            ctx.strokeRect(40, 40, W - 80, H - 80);
            
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
            ctx.lineWidth = 4;
            ctx.strokeRect(55, 55, W - 110, H - 110);

            // ─── CARGAR LOGO ───
            const logo = new Image();
            logo.crossOrigin = 'anonymous';
            logo.src = 'logo.png';

            const drawCard = (logoLoaded) => {
                const cx = W / 2, cy = 250;

                if (logoLoaded) {
                    // Círculo sólido de fondo para el logo (como un disco de pesas)
                    ctx.save();
                    ctx.beginPath();
                    ctx.arc(cx, cy, 145, 0, Math.PI * 2);
                    ctx.fillStyle = '#0a0a0c';
                    ctx.fill();
                    ctx.lineWidth = 6;
                    ctx.strokeStyle = accentBase;
                    ctx.stroke();
                    ctx.clip(); // Cortar el logo si sobresale
                    ctx.drawImage(logo, cx - 130, cy - 130, 260, 260);
                    ctx.restore();
                }

                // Título Marca
                ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
                ctx.font = '700 32px Oswald, sans-serif';
                ctx.textAlign = 'center';
                ctx.letterSpacing = "4px";
                ctx.fillText('AX-CORE BY ARTHUR', cx, 440);

                // Divider grueso (Barra de Hierro)
                ctx.fillStyle = 'rgba(255,255,255,0.15)';
                ctx.fillRect(W * 0.15, 480, W * 0.70, 4);

                // ══════════════════════════════════
                //  BLOQUE CENTRAL DE NÚMEROS DE RENDIMIENTO
                // ══════════════════════════════════

                // Bloque Déficit (El Esfuerzo)
                ctx.fillStyle = accentBase; // Resaltado fuerte
                ctx.font = '700 36px Oswald, sans-serif';
                ctx.fillText('QUEMA CALÓRICA TOTAL', cx, 580);

                const defVal = (userData.totalNetDeficit || 0).toLocaleString('es-MX');
                ctx.fillStyle = '#ffffff';
                ctx.font = '700 130px Oswald, sans-serif';
                ctx.fillText(defVal, cx, 690);

                ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
                ctx.font = '700 28px Oswald, sans-serif';
                ctx.fillText('KILOCALORÍAS DESTRUIDAS', cx, 740);

                // Divider Sub
                ctx.fillStyle = 'rgba(255,255,255,0.08)';
                ctx.fillRect(W * 0.35, 790, W * 0.3, 3);

                // Bloque Cintura
                ctx.fillStyle = '#b0b0b0';
                ctx.font = '700 28px Oswald, sans-serif';
                ctx.fillText('CINTURA ACTUAL', cx, 860);

                const waistVal = userData.waist || 0;
                ctx.fillStyle = '#ffffff';
                ctx.font = '700 90px Oswald, sans-serif';
                ctx.fillText(`${waistVal} CM`, cx, 950);

                // ══════════════════════════════════
                //  BLOQUE INFERIOR DE ESTATUS (CHAMPION)
                // ══════════════════════════════════

                // Divider inferior
                ctx.fillStyle = 'rgba(255,255,255,0.15)';
                ctx.fillRect(W * 0.15, 1020, W * 0.70, 4);

                // Placa de Identificación Física (Estilo Gafete)
                const uname = `${(userData.username || 'ATLETA AX-CORE').toUpperCase()}`;
                ctx.fillStyle = '#ffffff';
                ctx.font = '600 38px Inter, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText(uname, cx, 1100);

                // Caja "MÁQUINA OPTIMIZADA"
                const bh = 70, bw = 500, bx = cx - bw/2, by = 1140;
                ctx.fillStyle = accentBase;
                ctx.beginPath();
                // Caja rectangular dura militar/gym
                ctx.moveTo(bx + 15, by); ctx.lineTo(bx + bw - 15, by);
                ctx.lineTo(bx + bw, by + 15); ctx.lineTo(bx + bw, by + bh - 15);
                ctx.lineTo(bx + bw - 15, by + bh); ctx.lineTo(bx + 15, by + bh);
                ctx.lineTo(bx, by + bh - 15); ctx.lineTo(bx, by + 15);
                ctx.closePath();
                ctx.fill();

                ctx.fillStyle = '#000000'; // Letra negra gruesa
                ctx.font = '700 36px Oswald, sans-serif';
                ctx.fillText('MÁQUINA OPTIMIZADA', cx, by + 48);

                // Footer
                ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
                ctx.font = '600 20px Oswald, sans-serif';
                ctx.fillText('SOFTWARE DE ENTRENAMIENTO AX-CORE', cx, 1260);

                canvas.toBlob(blob => resolve(blob), 'image/png');
            };

            logo.onload  = () => drawCard(true);
            logo.onerror = () => drawCard(false);
        });
    }

    const btnShareAch = document.getElementById('btn-share-achievements');
    if (btnShareAch) {
        btnShareAch.onclick = async () => {
            const originalText = btnShareAch.textContent;
            btnShareAch.textContent = "⏱️ GENERANDO TARJETA...";
            btnShareAch.style.opacity = '0.7';
            btnShareAch.disabled = true;

            try {
                const blob = await generateAchievementCard();
                
                btnShareAch.textContent = originalText;
                btnShareAch.style.opacity = '1';
                btnShareAch.disabled = false;

                if (!blob) {
                    alert("No se pudo generar la tarjeta de logros.");
                    return;
                }

                // Intentar usar Navigator Share API para archivos
                const file = new File([blob], 'axcore_logros.png', { type: 'image/png' });

                if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
                    await navigator.share({
                        files: [file],
                        title: 'Mis Logros en AX-CORE',
                        text: `¡Déficit acumulado de ${userData.totalNetDeficit || 0} kcal con AX-CORE By Arthur! 🔥 Envía un mensaje si también quieres optimizar tu biología.`
                    });
                } else {
                    // Descarga directa si el navegador/dispositivo no soporta compartir imágenes (safari desktop antiguo, etc)
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'Mis_Logros_AXCORE.png';
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                    alert("Tu celular no soporta envío directo de fotos. ¡La Bio-Tarjeta ha sido descargada en tus fotos para que la subas!");
                }
            } catch(error) {
                console.error("Error al generar tarjeta:", error);
                btnShareAch.textContent = originalText;
                btnShareAch.style.opacity = '1';
                btnShareAch.disabled = false;
                alert("Hubo un error al generar la gráfica de logros.");
            }
        };
    }

    saveSettingsBtn.onclick = () => {
        // Guardar nombre de usuario si se editó
        const unInput = document.getElementById('input-username');
        if (unInput && unInput.value.trim()) {
            userData.username = unInput.value.trim();
            document.getElementById('display-username').textContent = userData.username.toUpperCase();
        }
        // API Key: solo si fue revelada por el toque secreto
        const apiInput = document.getElementById('api-key');
        if (apiInput && apiInput.value.trim()) {
            userData.apiKey = apiInput.value.trim();
        }
        saveData();
        alert("Configuración guardada.");
    };

    saveMeasurementsBtn.onclick = () => {
        const h = parseFloat(document.getElementById('input-height').value);
        const w = parseFloat(document.getElementById('input-weight').value);
        const ws = parseFloat(document.getElementById('input-waist').value);
        const tw = parseFloat(document.getElementById('input-target-weight').value);
        if (isNaN(h) || isNaN(w) || isNaN(ws) || isNaN(tw)) return alert("Todos los campos del perfil deben ser numéricos.");
        userData.height = h;
        userData.weight = w;
        userData.waist = ws;
        userData.target_weight = tw;
        saveData();
        updateDashboard();
        applySettings();
        alert("Perfil antropométrico actualizado.");
    };

    document.getElementById('btn-reset-measurements').onclick = () => {
        if (confirm("¿Seguro que quieres REINICIAR TODO? Se borrarán medidas, historial, dieta y progreso físico. Tu cuenta y API Key permanecerán activas.")) {
            // Reset físico total
            userData.weight = 0;
            userData.waist = 0;
            userData.height = 0;
            userData.target_weight = 0;
            userData.bicep = 0;
            userData.tricep = 0;
            userData.leg = 0;
            userData.chest = 0;
            userData.hip = 0;
            userData.calf = 0;
            userData.glute = 0;
            userData.neck = 0;
            userData.forearm = 0;
            userData.back = 0;
            userData.history = [];
            userData.recommendedDiet = { breakfast: '', lunch: '', dinner: '', snacks: '' };
            userData.totalNetDeficit = 0;
            userData.caloriesConsumedToday = 0;
            userData.caloriesBurnedToday = 0;
            userData.foodLogToday = [];
            
            saveData();
            applySettings();
            updateDashboard();
            alert("SISTEMA REINICIADO: Todos los datos físicos y nutricionales han sido borrados.");
        }
    };

    // El botón toggle-api-pro fue eliminado del UI. La API Key solo se revela
    // con 5 toques rápidos en el título "SISTEMA ÉLITE" (toque secreto Arthur).

    let tapCount = 0;
    let tapTimer;
    document.getElementById('elite-title').onclick = () => {
        tapCount++;
        clearTimeout(tapTimer);
        tapTimer = setTimeout(() => { tapCount = 0; }, 2000);
        if (tapCount >= 5) { // 5 toques para ver la API (toque secreto Arthur)
            const container = document.getElementById('api-key-container');
            container.style.display = 'block';
            document.getElementById('api-key').type = 'text'; // Ver la clave real
            tapCount = 0;
            document.getElementById('elite-title').style.color = "var(--accent-alert)";
            setTimeout(() => { document.getElementById('elite-title').style.color = ""; }, 1000);
        }
    };

    document.getElementById('btn-reset-all').onclick = () => {
        if (confirm("ESTO ELIMINARÁ TODA TU CUENTA Y DATOS. ¿ESTÁS SEGURO?")) {
            localStorage.clear();
            location.reload();
        }
    };

    // --- AI LOGIC ---
    sendAiBtn.onclick = handleAiQuery;
    aiInput.onkeypress = (e) => { if (e.key === 'Enter') handleAiQuery(); };

    async function handleAiQuery() {
        const q = aiInput.value.trim();
        if (!q) return;
        aiInput.value = "";
        handleAiQueryStr(q);
    }

    async function handleAiQueryStr(query) {
        addMessage('user', query);
        const thinking = addMessage('system', 'Conectando con Redes de Vanguardia Científica...');
        
        if (!userData.apiKey) {
            setTimeout(() => {
                thinking.remove();
                addMessage('system', "Hola. Registra una API Key en Ajustes para activar los descubrimientos científicos en tiempo real. Por ahora, enfócate en tus reglas de oro: 3 huevos al desayuno y ejercicio diario.");
            }, 1000);
            return;
        }

        try {
            const result = await callPerplexity(query);
            thinking.remove();
            addMessage('system', result);
        } catch(e) {
            thinking.remove();
            addMessage('system', "Error de enlace. Verifica tu conexión o API Key.");
        }
    }

    async function callPerplexity(query, mode = 'chat') {
        // Prompt optimizado: EXPERTO NATURAL, SIN ASTERISCOS, SIN LISTAS NUMERADAS, CON CONTEXTO
        const foodStr = userData.foodLogToday && userData.foodLogToday.length > 0 
            ? userData.foodLogToday.map(f => `${f.time}: ${f.desc} (~${f.cal} cal)`).join(', ')
            : 'Nada registrado aún hoy';

        const dietContext = userData.recommendedDiet ? 
            `DIETA RECOMENDADA: Desayuno: ${userData.recommendedDiet.breakfast}, Comida: ${userData.recommendedDiet.lunch}, Cena: ${userData.recommendedDiet.dinner}, Snacks: ${userData.recommendedDiet.snacks}.` : '';

        const sysPrompt = 
            mode === 'json' ? `Eres un asistente de datos JSON. Analiza el texto y devuelve ÚNICAMENTE un JSON válido sin markdown ni explicaciones extras.` :
            mode === 'number' ? `Eres un contador de calorías experto. Analiza el alimento y responde ÚNICAMENTE con el número entero de calorías promedio. No escribas nada más.` :
            `Eres AX-CORE, el sistema de optimización humana diseñado por ARTHUR para un usuario de ${userData.weight}kg y ${userData.height}m. 
            ESTADO ACTUAL DE HOY: Ingesta: ${userData.caloriesConsumedToday} cal de un límite de ${userData.dailyCalLimit}. Gasto ejercicio: ${userData.caloriesBurnedToday} cal. Déficit histórico: ${userData.totalNetDeficit} cal.
            ${dietContext}
            ALIMENTOS REGISTRADOS HOY: ${foodStr}.
            ESPECIALIDADES: Nutrición avanzada, Biología metabólica, Psicología del éxito, Regeneración celular y Entrenamiento de élite.
            REGLAS CRÍTICAS: 
            1. No uses NUNCA asteriscos ni símbolos de formato. 
            2. No uses NUNCA listas numeradas (1, 2, 3), usa puntos tipo bullet. 
            3. Habla de forma natural, fluida y directa, como un experto hablando a un socio ejecutivo. 
            4. Realiza búsquedas en tiempo real en las especialidades citadas para dar consejos de vanguardia 2026.
            5. Considera y menciona proactivamente el ESTADO ACTUAL y ALIMENTOS DE HOY si la pregunta se relaciona con síntomas, hambre o energía. Por ejemplo "Tuviste un pico de insulina porque hace 2 horas comiste X".
            6. Sé conciso y potente. Evita saludos largos.`;

        try {
            const response = await fetch('https://api.perplexity.ai/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${userData.apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: 'sonar',
                    messages: [
                        { role: 'system', content: sysPrompt },
                        { role: 'user', content: query }
                    ]
                })
            });
            const data = await response.json();
            let result = data.choices[0].message.content;
            
            // Limpieza extra por si la IA ignora el prompt
            result = result.replace(/\*/g, "").replace(/^\d+\.\s/gm, "• "); 
            
            return result;
        } catch (error) {
            console.error("API Error:", error);
            if (mode === 'number') return "200";
            return "Error de conexión. Verifica tu llave en Ajustes.";
        }
    }

    function addMessage(sender, text) {
        const div = document.createElement('div');
        div.className = `msg ${sender}`;
        div.textContent = text;
        chatBox.appendChild(div);
        chatBox.scrollTop = chatBox.scrollHeight;
        return div;
    }

    function startClock() {
        setInterval(() => {
            const now = new Date();
            
            // Reloj 12 horas sin AM/PM
            let h = now.getHours();
            const m = now.getMinutes().toString().padStart(2, '0');
            const s = now.getSeconds().toString().padStart(2, '0');
            h = h % 12 || 12; // Convierte 0 a 12, 13 a 1, etc.
            liveTimeEl.textContent = `${h.toString().padStart(2, '0')}:${m}:${s}`;
            
            // Fecha con mayúsculas en Día y Mes
            let dateStr = now.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' }).replace(',', '');
            let words = dateStr.split(' ').map(w => {
                if(w.toLowerCase() === 'de' || w.toLowerCase() === 'del') return w.toLowerCase();
                return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
            });
            liveDateEl.textContent = words.join(' ');
            
        }, 1000);
    }

    // --- MIC / SPEECH ---
    if (btnMic) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
            const rec = new SpeechRecognition();
            rec.lang = 'es-MX';
            rec.onstart = () => btnMic.classList.add('recording');
            rec.onresult = (e) => {
                aiInput.value = e.results[0][0].transcript;
                handleAiQuery();
            };
            rec.onend = () => btnMic.classList.remove('recording');
            btnMic.onclick = () => rec.start();
        } else { btnMic.style.display = 'none'; }
    }
});

// --- PWA: REGISTRAR SERVICE WORKER ---
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js').then(registration => {
            console.log('AX-CORE PWA lista para instalar en celular: ', registration.scope);
        }).catch(err => {
            console.log('AX-CORE PWA Error: ', err);
        });
    });
}
