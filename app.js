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
        height: 0,
        weight: 0,
        waist: 0,
        bicep: 0,
        tricep: 0,
        leg: 0,
        chest: 0,
        hip: 0,
        calf: 0,
        glute: 0,
        neck: 0,
        target_weight: 0,
        dailyCalLimit: 0,
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
            // Restaurar la sección donde estaba el usuario antes de recargar
            const savedPage = localStorage.getItem('axcore_active_page');
            if (savedPage) {
                const targetPage = document.getElementById(`page-${savedPage}`);
                if (targetPage) {
                    pages.forEach(p => p.classList.remove('active'));
                    targetPage.classList.add('active');
                    navLinks.forEach(l => {
                        l.classList.toggle('active', l.dataset.page === savedPage);
                    });
                    if (savedPage === 'diet') renderDietPage();
                    if (savedPage === 'workout') renderWorkoutPage();
                    if (savedPage === 'evolution') renderEvolutionPage('all');
                    if (savedPage === 'studio') renderStudioPage();
                }
            }
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

    // Soporte para Enter
    [regUser, regPass, document.getElementById('reg-gym-code')].forEach(el => {
        if(el) el.addEventListener('keypress', e => { if(e.key === 'Enter') document.getElementById('btn-register-confirm').click() });
    });
    [loginUser, loginPass].forEach(el => {
        if(el) el.addEventListener('keypress', e => { if(e.key === 'Enter') document.getElementById('btn-login-access').click() });
    });

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
            if (!confirm("Ya existe un usuario con ese nombre en este dispositivo.\n¿Deseas reemplazarlo con una cuenta nueva?")) {
                return;
            }
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
                userData.apiKey = data.apiKey; // Recibir API Key real del servidor
                saveData();
                localStorage.setItem('arthur_current_user', u);
                alert(data.message);
                location.reload();
            } else {
                alert(data.message);
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
                // ACTUALIZAR API KEY PARA USUARIOS VIEJOS O RECURRENTES
                saved.apiKey = data.apiKey || saved.apiKey;
                localStorage.setItem(`arthur_data_${u}`, JSON.stringify(saved));
                
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
        const targetWaist = userData.target_waist || 0;
        const initialWaist = userData.waist || 0;
        const progWaist = targetWaist > 0 ? Math.max(0, Math.min(100, ((initialWaist - (userData.waist || initialWaist)) / Math.max(1, initialWaist - targetWaist)) * 100)) : 0;
        document.getElementById('waist-meta-text').textContent = targetWaist > 0 ? `Meta: ${targetWaist} CM` : `Meta: 0 CM`;
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
            // Persistir sección activa para que sobreviva al refrescar
            localStorage.setItem('axcore_active_page', pageId);
            
            if (pageId === 'diet') renderDietPage();
            if (pageId === 'workout') renderWorkoutPage();
            if (pageId === 'evolution') renderEvolutionPage('all');
            if (pageId === 'studio') renderStudioPage();

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
                    <textarea id="diet-raw-text" placeholder="Ej: Lunes: Desayuno 2 huevos con jamón, comida pechuga asada, cena ensalada, snacks cacahuates..." style="width:100%; min-height:80px; background:var(--glass-bg, rgba(0,0,0,0.2)); color:var(--text-primary); border:1px dashed var(--accent-main); border-radius:8px; padding:0.8rem; margin-bottom:1rem;"></textarea>
                    <button class="btn-premium" id="btn-parse-diet" style="width:100%;">⚙️ PROCESAR CON IA</button>
                    <button class="btn-premium" id="btn-reset-diet" style="width:100%; margin-top:10px; background:transparent; border:1px solid var(--accent-alert); color:var(--accent-alert);">🗑️ REINICIAR DIETA Y REGLAS</button>
                </div>

                <!-- DIETA RECOMENDADA: SOLO LECTURA -->
                <div class="meal-item glass-card" style="padding:2rem; border-color:var(--accent-secondary); margin-bottom:2rem;">
                    <h3 style="color:var(--accent-secondary); font-size:1.1rem; margin-bottom:1.5rem; border-bottom:1px solid var(--accent-secondary); padding-bottom:0.5rem;">DIETA DETALLADA</h3>
                    <div style="display:grid; grid-template-columns: 1fr 1fr; gap:20px;" class="diet-grid-mobile">
                        <div style="display:flex; flex-direction:column;">
                            <label style="color:var(--accent-main); font-weight:bold; display:block; font-size:0.85rem; margin-bottom:0.5rem;">DESAYUNO</label>
                            <div style="flex:1; background:var(--glass-bg, rgba(0,0,0,0.2)); border:1px solid var(--glass-border); border-radius:8px; padding:0.8rem; color:var(--text-primary); line-height:1.5; font-size:0.9rem;">${diet.breakfast || '<span style="color:var(--text-dim); font-style:italic;">Sin definir. Usa la importación inteligente.</span>'}</div>
                        </div>
                        <div style="display:flex; flex-direction:column;">
                            <label style="color:var(--accent-main); font-weight:bold; display:block; font-size:0.85rem; margin-bottom:0.5rem;">COMIDA</label>
                            <div style="flex:1; background:var(--glass-bg, rgba(0,0,0,0.2)); border:1px solid var(--glass-border); border-radius:8px; padding:0.8rem; color:var(--text-primary); line-height:1.5; font-size:0.9rem;">${diet.lunch || '<span style="color:var(--text-dim); font-style:italic;">Sin definir.</span>'}</div>
                        </div>
                        <div style="display:flex; flex-direction:column;">
                            <label style="color:var(--accent-main); font-weight:bold; display:block; font-size:0.85rem; margin-bottom:0.5rem;">CENA</label>
                            <div style="flex:1; background:var(--glass-bg, rgba(0,0,0,0.2)); border:1px solid var(--glass-border); border-radius:8px; padding:0.8rem; color:var(--text-primary); line-height:1.5; font-size:0.9rem;">${diet.dinner || '<span style="color:var(--text-dim); font-style:italic;">Sin definir.</span>'}</div>
                        </div>
                        <div style="display:flex; flex-direction:column;">
                            <label style="color:var(--accent-main); font-weight:bold; display:block; font-size:0.85rem; margin-bottom:0.5rem;">SNACKS / ADICIONALES</label>
                            <div style="flex:1; background:var(--glass-bg, rgba(0,0,0,0.2)); border:1px solid var(--glass-border); border-radius:8px; padding:0.8rem; color:var(--text-primary); line-height:1.5; font-size:0.9rem;">${diet.snacks || '<span style="color:var(--text-dim); font-style:italic;">Sin definir.</span>'}</div>
                        </div>
                    </div>
                    <p style="margin-top:1rem; font-size:0.7rem; color:var(--text-dim); text-align:center;">Para actualizar, usa la sección de Importación Inteligente arriba.</p>
                </div>

                <!-- REGLAS ESTRUCTURALES -->
                <div class="meal-item glass-card" style="padding:2rem; margin-bottom:2rem;">
                    <h3 style="color:var(--accent-main); font-size:1rem; margin-bottom:1rem;">REGLAS ESTRUCTURADAS GLOBALES</h3>
                    <ul style="display:grid; grid-template-columns: 1fr 1fr; gap:10px; font-size:0.9rem;">
                        ${(userData.customDietRules || ["Pendiente de importar plan de nutriólogo."]).map(r => `<li style="margin-bottom:5px; color:var(--text-dim);">• ${r}</li>`).join('')}
                    </ul>
                    <p style="margin-top:1rem; font-size:0.65rem; color:var(--text-dim); text-align:center; font-style:italic;">${userData.customDietRules ? '✅ Reglas personalizadas por tu nutriólogo (generadas por IA)' : 'Reglas base de AX-CORE. Se actualizarán automáticamente al procesar tu dieta del nutriólogo.'}</p>
                </div>

                <!-- REGISTRO DE CALORÍAS REALES -->
                <div class="reg-food-container" style="border: 2px solid var(--accent-main); background: var(--glass-bg, rgba(0,0,0,0.1)); padding:2rem; border-radius:20px;">
                    <h3 style="color:var(--accent-main); font-family:var(--font-accent); margin-bottom:0.5rem;">REGISTRO DE INGESTA REAL</h3>
                    <p style="font-size:0.8rem; margin-bottom:1.5rem; color:var(--text-dim);">Reporta tus alimentos para que Arthur calibre tu metabolismo.</p>
                    <div class="food-entry-group" style="display:flex; gap:15px;">
                        <input type="text" id="food-desc" placeholder="Ej. 100g de pollo y media taza de arroz..." style="flex:3; background:var(--glass-bg, rgba(0,0,0,0.2)); border:1px solid var(--accent-main); padding:1rem; color:var(--text-primary); border-radius:12px; font-size:1rem;">
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
            
            // PASO 1: Extraer comidas organizadas e integrarlas con el contexto histórico
            const promptComidas = `Eres AX-CORE. Esta es la dieta actual del atleta: Desayuno: ${userData.recommendedDiet.breakfast}. Comida: ${userData.recommendedDiet.lunch}. Cena: ${userData.recommendedDiet.dinner}. Snacks: ${userData.recommendedDiet.snacks}. Integra e incorpora de manera inteligente el siguiente nuevo texto/alimentos a la dieta actual: "${raw}". No borres lo anterior, combínalo. Responde SOLO en JSON válido con claves: "breakfast", "lunch", "dinner", "snacks". Usa textos extremadamente cortos y concretos.`;
            
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
                
                // PASO 2: Generar reglas estructurales ultra cortas basadas en la nueva dieta completa
                const promptReglas = `Genera de 5 a 8 reglas basadas en la dieta actual. Deben ser EXTREMADAMENTE directas, cortas y al grano, sin explicaciones ni rollo motivacional. Máximo 10 palabras por regla. Responde SOLO un JSON: {"rules":["regla 1", ...]}. Dieta actual: Desayuno: ${userData.recommendedDiet.breakfast}. Comida: ${userData.recommendedDiet.lunch}. Snacks: ${userData.recommendedDiet.snacks}.`;
                
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

        const btnResetDiet = document.getElementById('btn-reset-diet');
        if (btnResetDiet) {
            btnResetDiet.onclick = () => {
                if (confirm("¿Estás seguro de borrar toda la dieta actual y sus reglas para empezar desde cero?")) {
                    userData.recommendedDiet = { breakfast: '', lunch: '', dinner: '', snacks: '' };
                    userData.customDietRules = [];
                    saveData();
                    renderDietPage();
                }
            };
        }

        document.getElementById('btn-add-food').onclick = async () => {
            const desc = document.getElementById('food-desc').value.trim();
            if (!desc) return;
            
            const btn = document.getElementById('btn-add-food');
            btn.textContent = "Consultando IA...";
            btn.disabled = true;
            
            const calUsed = userData.caloriesConsumedToday;
            const calLimit = userData.dailyCalLimit;

            const ldesc = desc.toLowerCase().trim();
            let estimatedCal = 200;
            let dbMatch = null;
            let longestMatchLen = 0;

            // 70% OFFLINE DATA INTERCEPTER
            if (typeof FOOD_DATABASE !== 'undefined') {
                for (const food of FOOD_DATABASE) {
                    if (ldesc.includes(food.name) || food.name.includes(ldesc)) {
                        if (food.name.length > longestMatchLen) {
                            longestMatchLen = food.name.length;
                            dbMatch = food;
                        }
                    }
                }
            }

            if (dbMatch) {
                console.log(`[LOCAL DB HIT] Bypass IA: ${dbMatch.name} = ${dbMatch.cal} kcal`);
                estimatedCal = dbMatch.cal;
                
                // Efecto visual rápido ya que no hay latencia IA
                btn.textContent = "¡Añadido al instante!";
                setTimeout(() => { btn.textContent = "+ AÑADIR (IA)"; btn.disabled = false; }, 1000);
            } else if (userData.apiKey) {
                // 30% IA TAREAS COMPLEJAS
                const prompt = `Calorías exactas de: "${desc}". Responde SOLAMENTE con un número entero. Cero texto adicional.`;
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
                                <input type="number" class="ex-input" value="${baseVal}" style="width:60px; background:var(--glass-bg, rgba(0,0,0,0.2)); border:1px solid var(--accent-main); color:var(--text-primary); padding:5px; border-radius:5px;">
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

    // Helper para cargar imágenes
    async function loadCanvasImage(src) {
        return new Promise((resolve) => {
            if(!src) return resolve(null);
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => resolve(img);
            img.onerror = () => resolve(null);
            img.src = src;
        });
    }

    // ============================================================
    // ESTUDIO DE LOGROS — SECCIÓN INDEPENDIENTE COMPLETA
    // ============================================================
    const STUDIO_TEMPLATES = [
        { id:'militar',   name:'MILITAR',       bg: 'assets/bg_studio_militar_1774133302683.png', colors:['#2d3a1a','#1a2410','#4a5c2a','#0d1508'] },
        { id:'neon',      name:'NEÓN NOCTURNO', bg: 'assets/bg_studio_neon_1774133316841.png', colors:['#0a0a1a','#000','#00e5ff','#ff00e5'] },
        { id:'fuego',     name:'FUEGO',         bg: 'assets/bg_studio_fuego_1774133335029.png', colors:['#ff6b00','#cc2200','#ff9933','#1a0500'] },
        { id:'hielo',     name:'HIELO',         bg: 'assets/bg_studio_hielo_1774133351235.png', colors:['#b3e0ff','#e8f4ff','#0077b3','#003d5c'] },
        { id:'carbono',   name:'CARBONO',       bg: 'assets/bg_studio_carbono_1774133370189.png', colors:['#1a1a1a','#0d0d0d','#d4af37','#8a7220'] },
        { id:'blood',     name:'BLOOD & IRON',  bg: 'assets/bg_studio_blood_1774133388279.png', colors:['#5c0a0a','#1a0000','#cc1a1a','#330000'] },
        { id:'fem1',      name:'YOGA SUNRISE',  bg: 'assets/bg_studio_fem1_1774134638293.png', colors:['#ffd1dc','#3a2c2e','#ffcccc','#1a1516'] },
        { id:'fem2',      name:'ELEGANCE GYM',  bg: 'assets/bg_studio_fem2_1774134660838.png', colors:['#b76e79','#1a0d0f','#cccccc','#0d0607'] },
        { id:'fem3',      name:'SUNSET HEALTH', bg: 'assets/bg_studio_fem3_1774134674212.png', colors:['#ffb347','#331100','#ffaa33','#1a0800'] },
        { id:'fem4',      name:'CYAN AESTHETIC',bg: 'assets/bg_studio_fem4_1774134698585.png', colors:['#00ced1','#001a1a','#48d1cc','#000d0d'] },
        { id:'gay_m1',    name:'PRIDE NEON',    bg: 'assets/bg_studio_gay_m1_1774134716984.png', colors:['#ff00ff','#0a000a','#00ffff','#1a001a'] },
        { id:'gay_m2',    name:'LUXURY CLUB',   bg: 'assets/bg_studio_gay_m2_1774134733585.png', colors:['#ffb6c1','#1a0a0f','#add8e6','#0d0508'] },
        { id:'gay_m3',    name:'BEACH POWER',   bg: 'assets/bg_studio_gay_m3_1774134754666.png', colors:['#ffd700','#1a1500','#ffaa00','#0d0a00'] },
        { id:'gay_f1',    name:'URBAN PRIDE',   bg: 'assets/bg_studio_gay_f1_1774134772023.png', colors:['#ff4500','#1a0500','#ff1493','#0d0200'] },
        { id:'gay_f2',    name:'STREET ENERGY', bg: 'assets/bg_studio_gay_f2_1774134789052.png', colors:['#8a2be2','#0a001a','#00ced1','#05000d'] },
        { id:'gay_f3',    name:'NATURE PEACE',  bg: 'assets/bg_studio_gay_f3_1774134806610.png', colors:['#8fbc8f','#0a1a0f','#556b2f','#050d08'] }
    ];
    const STUDIO_FORMATS = [
        { id:'story', label:'STORY', w:1080, h:1350 },
        { id:'square', label:'CUADRADO', w:1080, h:1080 },
        { id:'landscape', label:'PAISAJE', w:1920, h:1080 }
    ];
    const STUDIO_METRICS = [
        { key:'deficit', label:'Déficit Kcal', val:() => (userData.totalNetDeficit||0).toLocaleString('es-MX'), default:true },
        { key:'weight',  label:'Peso actual',  val:() => (userData.weight||0)+'kg', default:true },
        { key:'waist',   label:'Cintura',       val:() => (userData.waist||0)+'cm', default:true },
        { key:'bicep',   label:'Bíceps',        val:() => (userData.bicep||0)+'cm', default:false },
        { key:'chest',   label:'Pecho',         val:() => (userData.chest||0)+'cm', default:false },
        { key:'leg',     label:'Pierna',        val:() => (userData.leg||0)+'cm', default:false },
        { key:'hip',     label:'Cadera',        val:() => (userData.hip||0)+'cm', default:false },
        { key:'back',    label:'Espalda',       val:() => (userData.back||0)+'cm', default:false }
    ];

    let studioState = { tpl: 'neon', fmt: 'story', metrics: ['deficit','weight','waist'], textColor: 'theme', textSize: 1.0 };

    const STUDIO_BG_IMAGES = {};
    let isStudioPreloading = false;
    let STUDIO_LOGO_IMG = null;

    let _studioLoadPromise = null;

    async function preloadStudioImages() {
        // Si ya cargaron, retornar inmediatamente
        if (Object.keys(STUDIO_BG_IMAGES).length > 0 && STUDIO_LOGO_IMG) return;
        // Si ya hay una carga en progreso, esperar esa misma promesa
        if (_studioLoadPromise) return _studioLoadPromise;

        _studioLoadPromise = (async () => {
            // Carga del logo
            await new Promise((r) => {
                const l = new Image(); l.crossOrigin = 'anonymous';
                l.onload = () => { STUDIO_LOGO_IMG = l; r(); };
                l.onerror = () => { r(); };
                l.src = 'logo.png';
            });
            // Carga paralela de fondos
            await Promise.all(STUDIO_TEMPLATES.map(tpl => new Promise((r) => {
                const img = new Image();
                img.crossOrigin = 'anonymous';
                img.onload = () => { STUDIO_BG_IMAGES[tpl.id] = img; r(); };
                img.onerror = () => { r(); };
                img.src = tpl.bg;
            })));
        })();

        return _studioLoadPromise;
    }

    function drawStudioBg(ctx, W, H, tpl) {
        if (STUDIO_BG_IMAGES[tpl.id]) {
            const img = STUDIO_BG_IMAGES[tpl.id];
            const scale = Math.max(W / img.width, H / img.height);
            const x = (W / 2) - (img.width / 2) * scale;
            const y = (H / 2) - (img.height / 2) * scale;
            ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
        } else {
            ctx.fillStyle = tpl.colors ? tpl.colors[1] : '#000';
            ctx.fillRect(0, 0, W, H);
            
            if (tpl.id === 'custom') {
                ctx.fillStyle = 'rgba(255,255,255,0.05)';
                ctx.font = '60px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
                ctx.fillText('📷', W/2, H/2);
            }
        }
    }

    function renderStudioCard(canvas, tplId, fmtId, activeMetrics, isPreview) {
        let tpl = STUDIO_TEMPLATES.find(t=>t.id===tplId);
        if (tplId === 'custom') {
            tpl = { id: 'custom', colors: ['#ffffff','#111111','#00e5ff','#000000'] };
        } else if (!tpl) {
            tpl = STUDIO_TEMPLATES[0];
        }
        const fmt = STUDIO_FORMATS.find(f=>f.id===fmtId) || STUDIO_FORMATS[0];
        const W = fmt.w, H = fmt.h;
        const isLandscape = fmtId === 'landscape';
        canvas.width = W; canvas.height = H;
        const ctx = canvas.getContext('2d');

        // 1. Fondo temático
        drawStudioBg(ctx, W, H, tpl);

        // 2. Overlay cinemático de contraste
        const ov = ctx.createLinearGradient(0, 0, 0, H);
        ov.addColorStop(0, 'rgba(0, 0, 0, 0.4)');
        ov.addColorStop(1, 'rgba(0, 0, 0, 0.85)');
        ctx.fillStyle = ov; ctx.fillRect(0, 0, W, H);

        const cx = W/2;
        const accentMap = {
            'hielo':'#0099cc','carbono':'#d4af37','neon':'#00e5ff','fuego':'#ffcc00',
            'blood':'#ff3333','militar':'#8aff7a','custom':'#00e5ff','fem1':'#ffcccc',
            'fem2':'#d4a0a8','fem3':'#ffb347','fem4':'#00ced1','gay_m1':'#ff00ff',
            'gay_m2':'#add8e6','gay_m3':'#ffd700','gay_f1':'#ff4500','gay_f2':'#8a2be2','gay_f3':'#8fbc8f'
        };
        const accent = accentMap[tpl.id] || '#8aff7a';

        // Escala global dinámica
        const tScale = Math.max(0.5, Math.min(2.5, studioState.textSize));
        const customColor = studioState.textColor === 'theme' ? '#ffffff' : studioState.textColor;
        const isAuto = studioState.textColor === 'theme';

        // 3. Panel central HUD / Trading Card style
        const pw = W*0.90, ph = H*0.86, px = (W-pw)/2, py = (H-ph)/2;
        
        ctx.beginPath();
        if(ctx.roundRect) ctx.roundRect(px, py, pw, ph, 24); else ctx.rect(px, py, pw, ph);
        ctx.fillStyle = 'rgba(10, 12, 18, 0.45)';
        ctx.fill();
        ctx.lineWidth = 1.5; ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)'; ctx.stroke();
        
        // Esquinas HUD deportivas
        ctx.beginPath(); ctx.lineWidth = isPreview ? 2 : 4; ctx.strokeStyle = accent;
        const cl = isPreview ? 15 : 45; // longitud del corte
        ctx.moveTo(px, py+cl); ctx.lineTo(px, py); ctx.lineTo(px+cl, py);
        ctx.moveTo(px+pw-cl, py); ctx.lineTo(px+pw, py); ctx.lineTo(px+pw, py+cl);
        ctx.moveTo(px+pw, py+ph-cl); ctx.lineTo(px+pw, py+ph); ctx.lineTo(px+pw-cl, py+ph);
        ctx.moveTo(px+cl, py+ph); ctx.lineTo(px, py+ph); ctx.lineTo(px, py+ph-cl);
        ctx.stroke();

        // LOGO INDEPENDIENTE (Aislado arriba, no colisiona jamás con texto)
        const logoTargetY = py + (isPreview ? 25 : 60);
        if (STUDIO_LOGO_IMG) {
            const logoW = isPreview ? 85 : 220;
            ctx.shadowColor = 'rgba(0,0,0,0.8)'; ctx.shadowBlur = isPreview ? 10 : 30;
            ctx.drawImage(STUDIO_LOGO_IMG, cx - logoW/2, logoTargetY, logoW, logoW);
            ctx.shadowBlur = 0;
        }

        // MOTOR DE EFECTO AUTO (Glow Mágico Híbrido)
        const drawAutoText = (txt, x, y, size, weight, shadowPass) => {
            ctx.font = `${weight} ${Math.floor(size)}px Inter,sans-serif`;
            ctx.textAlign = 'center';
            if (isAuto) {
                ctx.fillStyle = shadowPass ? accent : '#ffffff';
                ctx.shadowColor = shadowPass ? accent : 'rgba(0,0,0,0.95)';
                ctx.shadowBlur = isPreview ? (shadowPass ? 12 : 5) : (shadowPass ? 35 : 15);
                ctx.globalCompositeOperation = shadowPass ? 'screen' : 'source-over';
                ctx.fillText(txt, x, y);
                // La capa que chupa el color del fondo (Efecto cristal)
                if (!shadowPass) {
                    ctx.globalCompositeOperation = 'overlay';
                    ctx.fillStyle = 'rgba(255,255,255,0.6)';
                    ctx.fillText(txt, x, y);
                    ctx.globalCompositeOperation = 'source-over';
                }
            } else {
                ctx.fillStyle = customColor;
                ctx.shadowColor = 'rgba(0,0,0,0.9)'; ctx.shadowBlur = isPreview ? 6 : 18;
                ctx.fillText(txt, x, y);
            }
            ctx.shadowBlur = 0; ctx.globalCompositeOperation = 'source-over';
        };

        // El texto inicia debajo del logo
        const textStartY = logoTargetY + (STUDIO_LOGO_IMG ? (isPreview ? 100 : 250) : (isPreview ? 20 : 40));

        // TÍTULO OFICIAL
        ctx.fillStyle = accent; ctx.textAlign = 'center';
        // El título estático se escala ligéramente menos para dar jerarquía
        ctx.font = `800 ${Math.floor((isPreview?13:30)*(1 + (tScale-1)*0.5))}px Inter,sans-serif`;
        ctx.letterSpacing = '4px';
        ctx.shadowColor = 'rgba(0,0,0,0.9)'; ctx.shadowBlur = isPreview?4:15;
        ctx.fillText('RESULTADOS OFICIALES', cx, textStartY);
        ctx.letterSpacing = '0px'; ctx.shadowBlur = 0;

        // NOMBRE DEL ATLETA (Escala Completa Y Proporcional)
        const nameY = textStartY + (isPreview?22:64) * tScale;
        const atletaName = (userData.username||'ATLETA').toUpperCase();
        drawAutoText(atletaName, cx, nameY, (isPreview?24:70) * tScale, 900, true);
        drawAutoText(atletaName, cx, nameY, (isPreview?24:70) * tScale, 900, false);

        // SEPARADOR DINÁMICO
        const divY = nameY + (isPreview?16:45) * tScale;
        const gradLine = ctx.createLinearGradient(cx - (pw*0.35), 0, cx + (pw*0.35), 0);
        gradLine.addColorStop(0, 'rgba(255,255,255,0)');
        gradLine.addColorStop(0.5, accent);
        gradLine.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = gradLine; ctx.fillRect(cx - (pw*0.35), divY, pw*0.7, isPreview ? 2 : 4);

        // =======================================================
        // MÉTRICAS (PROPORCIÓN Y PERFECTA SIN COLISIONES VERTICALES)
        // =======================================================
        const mets = STUDIO_METRICS.filter(m => activeMetrics.includes(m.key));
        const metStartY = divY + (isPreview?35:90) * tScale;

        if (mets.length === 0) {
            ctx.fillStyle = 'rgba(255,255,255,0.2)'; ctx.font = `600 ${isPreview?12:28}px Inter,sans-serif`;
            ctx.fillText('SELECCIONE MÉTRICAS', cx, metStartY + (isPreview?30:80));
        } else if (isLandscape && mets.length > 1) {
            const colW = pw / Math.min(mets.length, 8);
            mets.forEach((m, i) => {
                const mx = px + colW/2 + i * colW;
                ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.font = `600 ${Math.floor((isPreview?9:22)*tScale)}px Inter,sans-serif`;
                ctx.fillText(m.label.toUpperCase(), mx, metStartY);
                drawAutoText(m.val(), mx, metStartY + (isPreview?24:65)*tScale, (isPreview?18:55)*tScale, 900, true);
                drawAutoText(m.val(), mx, metStartY + (isPreview?24:65)*tScale, (isPreview?18:55)*tScale, 900, false);
            });
        } else if (mets.length > 4) {
            const colW = pw / 2;
            const rowSpacing = (isPreview ? 45 : 125) * tScale;
            mets.forEach((m, i) => {
                const mx = px + colW/2 + ((i % 2) * colW);
                const my = metStartY + (Math.floor(i / 2) * rowSpacing);
                ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.font = `600 ${Math.floor((isPreview?8:20)*tScale)}px Inter,sans-serif`;
                ctx.fillText(m.label.toUpperCase(), mx, my);
                drawAutoText(m.val(), mx, my + (isPreview?22:60)*tScale, (isPreview?18:52)*tScale, 900, true);
                drawAutoText(m.val(), mx, my + (isPreview?22:60)*tScale, (isPreview?18:52)*tScale, 900, false);
            });
        } else {
            const rowSpacing = (isPreview ? 60 : 160) * tScale;
            mets.forEach((m, i) => {
                const my = metStartY + i * rowSpacing;
                ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.font = `600 ${Math.floor((isPreview?10:26)*tScale)}px Inter,sans-serif`;
                ctx.fillText(m.label.toUpperCase(), cx, my);
                drawAutoText(m.val(), cx, my + (isPreview?28:80)*tScale, (isPreview?26:80)*tScale, 900, true);
                drawAutoText(m.val(), cx, my + (isPreview?28:80)*tScale, (isPreview?26:80)*tScale, 900, false);
            });
        }

        // FOOTER / DISTINTIVO
        const badgeY = py + ph - (isPreview?26:70);
        ctx.fillStyle = accent;
        if(ctx.roundRect) { ctx.beginPath(); ctx.roundRect(cx-110*(isPreview?0.6:1), badgeY, 220*(isPreview?0.6:1), isPreview?18:40, 20); ctx.fill(); }
        else { ctx.fillRect(cx-110, badgeY, 220, 40); }
        ctx.fillStyle = '#000'; ctx.font = `800 ${isPreview?8:17}px Inter,sans-serif`;
        ctx.fillText('SISTEMA AX-CORE', cx, badgeY + (isPreview?12:26));
        
        ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.font = `500 ${isPreview?7:16}px Inter,sans-serif`;
        ctx.fillText('OPTIMIZACIÓN BIOLÓGICA BY ARTHUR', cx, H-(isPreview?12:30));
    }

    async function renderStudioPage() {
        const el = document.getElementById('page-studio');
        if (!el) return;

        // Esperar a que las imágenes carguen (solo la 1a vez, el resto es instantáneo)
        if (!isStudioPreloading && Object.keys(STUDIO_BG_IMAGES).length === 0) {
            // Mostrar esqueleto mientras carga la primera vez
            el.innerHTML = `<div style="text-align:center; padding:3rem; color:var(--text-dim);">
                <div style="font-size:2rem; margin-bottom:12px;">🏆</div>
                <div>Preparando Estudio...</div>
            </div>`;
        }
        await preloadStudioImages();

        el.innerHTML = `
            <div class="glass-card" style="padding:1.5rem; margin-bottom:1.5rem;">
                <h2 style="color:var(--accent-main); margin-bottom:0.5rem; font-size:1.2rem;">🏆 ESTUDIO DE LOGROS</h2>
                <p style="font-size:0.75rem; color:var(--text-dim); margin-bottom:1rem;">Generador oficial en alta resolución.</p>

                <h4 style="color:var(--text-primary); font-size:0.8rem; margin-bottom:8px;">PLANTILLA</h4>
                <div class="studio-templates" id="studio-tpl-list"></div>

                <h4 style="color:var(--text-primary); font-size:0.8rem; margin:16px 0 8px;">FORMATO</h4>
                <div class="studio-format-btns" id="studio-fmt-btns"></div>

                <h4 style="color:var(--text-primary); font-size:0.8rem; margin:16px 0 8px;">MÉTRICAS A MOSTRAR</h4>
                <div class="studio-metrics" id="studio-met-list"></div>

                <div style="display:flex; flex-direction:column; gap:12px; margin: 16px 0 8px;">
                    <div>
                        <h4 style="color:var(--text-primary); font-size:0.7rem; margin-bottom:8px;">COLOR LETRA</h4>
                        <div id="studio-color-swatches" style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;"></div>
                    </div>
                    <div>
                        <h4 style="color:var(--text-primary); font-size:0.7rem; margin-bottom:4px;">TAMAÑO LETRA</h4>
                        <input type="range" id="studio-size-picker" min="0.5" max="2.5" step="0.1" value="${studioState.textSize}" style="width:100%; cursor:pointer;">
                    </div>
                </div>
            </div>

            <div class="glass-card" style="padding:1.5rem; margin-bottom:1.5rem;">
                <h4 style="color:var(--accent-secondary); font-size:0.85rem; margin-bottom:8px; text-align:center;">PREVIEW</h4>
                <div class="studio-preview-wrap">
                    <canvas id="studio-preview-canvas"></canvas>
                </div>
            </div>

            <button class="btn-premium" id="btn-studio-share" style="width:100%; padding:16px; font-size:1rem;">📤 COMPARTIR TARJETA HD</button>
        `;

        // --- Render template thumbnails ---
        const tplList = document.getElementById('studio-tpl-list');
        
        // 📷 Botón Subir Foto Personalizada
        const camCard = document.createElement('div');
        camCard.className = 'studio-tpl-card' + (studioState.tpl==='custom' ? ' selected' : '');
        camCard.innerHTML = `<div style="width:100%; height:100%; display:flex; flex-direction:column; justify-content:center; align-items:center; background:linear-gradient(45deg, rgba(255,255,255,0.05), rgba(0,0,0,0.2)); border-radius:12px;">
            <span style="font-size:32px; margin-bottom:4px;">📷</span>
            <span style="font-size:0.55rem; text-align:center; font-weight:800; color:#fff; letter-spacing:1px; line-height:1.2;">TU<br>FOTO</span>
        </div>`;
        
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = 'image/*';
        fileInput.style.display = 'none';
        
        fileInput.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    const img = new Image();
                    img.onload = () => {
                        STUDIO_BG_IMAGES['custom'] = img;
                        studioState.tpl = 'custom';
                        renderStudioPage();
                    };
                    img.src = event.target.result;
                };
                reader.readAsDataURL(file);
            }
            e.target.value = ''; // Reset
        };
        camCard.onclick = () => fileInput.click();
        camCard.appendChild(fileInput);
        tplList.appendChild(camCard);

        STUDIO_TEMPLATES.forEach(tpl => {
            const card = document.createElement('div');
            card.className = 'studio-tpl-card' + (studioState.tpl===tpl.id ? ' selected' : '');
            const miniCanvas = document.createElement('canvas');
            miniCanvas.width=100; miniCanvas.height=140;
            drawStudioBg(miniCanvas.getContext('2d'), 100, 140, tpl);
            card.appendChild(miniCanvas);
            const label = document.createElement('span');
            label.textContent = tpl.name;
            card.appendChild(label);
            card.onclick = () => { studioState.tpl = tpl.id; renderStudioPage(); };
            tplList.appendChild(card);
        });

        // --- Format buttons ---
        const fmtBtns = document.getElementById('studio-fmt-btns');
        STUDIO_FORMATS.forEach(fmt => {
            const btn = document.createElement('button');
            btn.textContent = fmt.label;
            if(studioState.fmt===fmt.id) btn.classList.add('active');
            btn.onclick = () => { studioState.fmt = fmt.id; renderStudioPage(); };
            fmtBtns.appendChild(btn);
        });

        // --- Metric toggles ---
        const metList = document.getElementById('studio-met-list');
        STUDIO_METRICS.forEach(m => {
            const isOn = studioState.metrics.includes(m.key);
            const tog = document.createElement('div');
            tog.className = 'studio-metric-toggle' + (isOn ? ' on' : '');
            tog.innerHTML = `<div class="dot"></div> ${m.label}: <strong>${m.val()}</strong>`;
            tog.onclick = () => {
                if (isOn) studioState.metrics = studioState.metrics.filter(k=>k!==m.key);
                else studioState.metrics.push(m.key);
                renderStudioPage();
            };
            metList.appendChild(tog);
        });

        // --- Preview ---
        const previewCanvas = document.getElementById('studio-preview-canvas');
        renderStudioCard(previewCanvas, studioState.tpl, studioState.fmt, studioState.metrics, true);

        // --- Eventos controles texto (Paleta extendida) ---
        const swatchesContainer = document.getElementById('studio-color-swatches');
        const palette = [
            { c:'theme', l:'AUTO', bg:'linear-gradient(45deg, #00ff88, #00d2ff)' },
            { c:'#ffffff', bg:'#ffffff' },
            { c:'#d3d3d3', bg:'#d3d3d3' }, // Gris claro
            { c:'#808080', bg:'#808080' }, // Gris oxford medio
            { c:'#36454F', bg:'#36454F' }, // Gris oxford oscuro
            { c:'#ffb6c1', bg:'#ffb6c1' }, // Rosa pastel
            { c:'#ff00ff', bg:'#ff00ff' }, // Magenta neon
            { c:'#800080', bg:'#800080' }, // Purpura fuerte
            { c:'#ff0000', bg:'#ff0000' }, // Rojo vibrante
            { c:'#00e5ff', bg:'#00e5ff' }, // Cyan neon
            { c:'#00ff66', bg:'#00ff66' }, // Verde toxic
            { c:'#ffcc00', bg:'#ffcc00' }, // Oro
            { c:'#ff4400', bg:'#ff4400' }, // Naranja fuerte
            { c:'#1a1a1a', bg:'#1a1a1a' }  // Negro oscuro
        ];
        
        palette.forEach(p => {
            const btn = document.createElement('button');
            btn.style.width = '30px'; btn.style.height = '30px'; 
            btn.style.borderRadius = '8px'; btn.style.border = 'none';
            btn.style.cursor = 'pointer'; btn.style.background = p.bg;
            if(p.l) { btn.textContent = p.l; btn.style.fontSize='10px'; btn.style.fontWeight='900'; btn.style.color='#000'; }
            
            if (studioState.textColor === p.c) {
                btn.style.outline = '3px solid var(--accent-main)';
                btn.style.transform = 'scale(1.1)';
            } else {
                btn.style.border = '1px solid rgba(255,255,255,0.2)';
            }
            
            btn.onclick = () => { studioState.textColor = p.c; renderStudioPage(); };
            swatchesContainer.appendChild(btn);
        });

        const sizePicker = document.getElementById('studio-size-picker');
        sizePicker.oninput = (e) => { 
            studioState.textSize = parseFloat(e.target.value); 
            renderStudioCard(previewCanvas, studioState.tpl, studioState.fmt, studioState.metrics, true); 
        };

        // --- Share button ---
        document.getElementById('btn-studio-share').onclick = async () => {
            const btn = document.getElementById('btn-studio-share');
            btn.textContent = '⏱️ GENERANDO HD...';
            btn.disabled = true;

            const hdCanvas = document.createElement('canvas');
            renderStudioCard(hdCanvas, studioState.tpl, studioState.fmt, studioState.metrics, false);

            hdCanvas.toBlob(async (blob) => {
                btn.textContent = '📤 COMPARTIR TARJETA HD';
                btn.disabled = false;
                if (!blob) { alert('Error al generar.'); return; }

                const file = new File([blob], 'AX-CORE_Logros.png', { type: 'image/png' });
                if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
                    await navigator.share({
                        files: [file],
                        title: 'Mis Logros en AX-CORE',
                        text: `¡Déficit de ${userData.totalNetDeficit||0} kcal con AX-CORE! 🔥`
                    }).catch(()=>{});
                } else {
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url; a.download = 'AX-CORE_Logros.png';
                    document.body.appendChild(a); a.click();
                    document.body.removeChild(a); URL.revokeObjectURL(url);
                    alert('¡Tarjeta descargada! Compártela manualmente.');
                }
            }, 'image/png');
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
            mode === 'json' ? `Eres un asistente JSON. Devuelve ÚNICAMENTE un JSON válido sin texto extra.` :
            mode === 'number' ? `Contador de calorías. Responde ÚNICAMENTE con el número entero. Cero texto.` :
            `Eres AX-CORE, IA táctica. Usuario: ${userData.weight}kg ${userData.height}m. Hoy: ${userData.caloriesConsumedToday}/${userData.dailyCalLimit}cal. Gasto: ${userData.caloriesBurnedToday}cal. Déficit neto histórico: ${userData.totalNetDeficit}cal.
             ${dietContext} Alimentos hoy: ${foodStr}.
             Reglas: 1. NO uses asteriscos jamás. 2. NO numeres listas, usa bullets cortos. 3. Sé extremadamente directo, frío, analítico, cero adornos ni motivación vacía. 4. Exige acciones tomando en cuenta las métricas del usuario que acabo de pasarte.`;

        // Validar que el pase del atleta siga activo antes de consumir IA
        if (userData.gymCode && userData.gymCode !== "GYM-MASTER" && userData.gymCode !== "AXV-DEMO") {
            try {
                // userData.gymCode almacena el pase (ej. AX-TRL0E) asignado por la franquicia
                const check = await fetch(`${API_URL}/api/validate`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ code: userData.gymCode })
                });
                const checkData = await check.json();
                if (!checkData.success) {
                    return `⛔ SERVICIO CORTADO.\n\n${checkData.message}`;
                }
            } catch(e) {
                // Ignorar si no hay internet temporalmente para validar
            }
        }

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
