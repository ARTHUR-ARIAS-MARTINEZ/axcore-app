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
    
    const themeBtns = document.querySelectorAll('.theme-btn');
    const saveSettingsBtn = document.getElementById('save-settings');
    const saveMeasurementsBtn = document.getElementById('save-measurements');
    const navLogout = document.getElementById('nav-logout');

    const sensationFeedback = document.getElementById('sensation-feedback');
    const btnAskAiSensation = document.getElementById('btn-ask-ai-sensation');

    // Gráficas — declaradas aquí para evitar TDZ cuando updateDashboard() se llama desde initAuth()
    let chartWeight, chartCalories, chartWaist, chartHistory;

    // --- INSTALACIÓN PWA ---
    let deferredPrompt = null;
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        const installBtn = document.getElementById('btn-install-app');
        if (installBtn) installBtn.style.display = 'block';
    });
    document.addEventListener('click', (e) => {
        if (e.target && e.target.id === 'btn-install-app' && deferredPrompt) {
            deferredPrompt.prompt();
            deferredPrompt.userChoice.then(result => {
                if (result.outcome === 'accepted') {
                    const btn = document.getElementById('btn-install-app');
                    if (btn) btn.style.display = 'none';
                }
                deferredPrompt = null;
            });
        }
    });

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
            // CRÍTICO: showApp() PRIMERO para garantizar que la UI esté visible
            // aunque loadUserData() falle por cualquier razón
            try { showApp(); } catch (e) { console.error('[initAuth] showApp err:', e); }
            try { loadUserData(); } catch (e) { console.error('[initAuth] loadUserData err:', e); }

            // Restaurar la sección donde estaba el usuario antes de recargar
            try {
                const savedPage = localStorage.getItem('axcore_active_page');
                if (savedPage) {
                    const targetPage = document.getElementById(`page-${savedPage}`);
                    if (targetPage) {
                        pages.forEach(p => p.classList.remove('active'));
                        targetPage.classList.add('active');
                        navLinks.forEach(l => {
                            l.classList.toggle('active', l.dataset.page === savedPage);
                        });
                        if (savedPage === 'diet' && typeof renderDietPage === 'function') renderDietPage();
                        if (savedPage === 'workout' && typeof renderWorkoutPage === 'function') renderWorkoutPage();
                        if (savedPage === 'evolution' && typeof renderEvolutionPage === 'function') renderEvolutionPage('all');
                        if (savedPage === 'studio' && typeof renderStudioPage === 'function') renderStudioPage();
                    }
                }
            } catch (e) { console.error('[initAuth] savedPage err:', e); }
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
            if (!userData.achievements) userData.achievements = [];

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

        // Pull remoto en background — sobreescribe local si remote es más reciente
        if (apiToken()) {
            pullRemoteData().then(remote => {
                if (!remote) return;
                const remoteSync = remote.lastSync ? new Date(remote.lastSync).getTime() : 0;
                const localSync  = userData.lastSync ? new Date(userData.lastSync).getTime() : 0;
                if (remoteSync > localSync && remote.data && Object.keys(remote.data).length > 0) {
                    userData = { ...userData, ...remote.data };
                    userData.lastSync = remote.lastSync;
                    if (Array.isArray(remote.achievements)) userData.achievements = remote.achievements;
                    localStorage.setItem(getStorageKey(), JSON.stringify(userData));
                    applySettings();
                    updateDashboard();
                    console.log('[sync] datos restaurados desde la nube.');
                }
            });
        }

        // Lanzar onboarding tour si es primer login
        if (localStorage.getItem('axcore_first_run') === '1') {
            localStorage.removeItem('axcore_first_run');
            setTimeout(() => { if (typeof launchOnboardingTour === 'function') launchOnboardingTour(); }, 800);
        }

        // Verificar logros tras cargar
        if (typeof checkAchievements === 'function') checkAchievements();
    }

    function applySettings() {
        document.body.setAttribute('data-theme', userData.theme || 'neon');
        themeBtns.forEach(b => {
            b.classList.toggle('active', b.dataset.theme === userData.theme);
        });
        const dispUser = document.getElementById('display-username');
        if (dispUser) dispUser.textContent = (userData.username || 'ATLETA').toUpperCase();
        if (userData.avatar) {
            const ap = document.getElementById('avatar-preview');
            if (ap) ap.style.backgroundImage = `url(${userData.avatar})`;
        }

        // Listener para avatar
        const avatarEl = document.getElementById('avatar-preview');
        const uploadEl = document.getElementById('avatar-upload');
        if (avatarEl && uploadEl) {
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
                };
                reader.readAsDataURL(file);
            };
        }

        const unEl = document.getElementById('input-username');
        if (unEl) unEl.value = userData.username || '';
        const hEl = document.getElementById('input-height'); if (hEl) hEl.value = userData.height || '';
        const wEl = document.getElementById('input-weight'); if (wEl) wEl.value = userData.weight || '';
        const waEl = document.getElementById('input-waist'); if (waEl) waEl.value = userData.waist || '';
        const twEl = document.getElementById('input-target-weight'); if (twEl) twEl.value = userData.target_weight || '';
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

    // ============================================================
    // SYNC CON BACKEND — capa de persistencia remota
    // ============================================================
    function apiToken()        { return localStorage.getItem('axcore_token') || ''; }
    function setApiToken(t)    { localStorage.setItem('axcore_token', t || ''); }
    function clearApiToken()   { localStorage.removeItem('axcore_token'); }
    function apiAuthHeaders()  {
        const t = apiToken();
        return t ? { 'Authorization': `Bearer ${t}`, 'Content-Type': 'application/json' }
                 : { 'Content-Type': 'application/json' };
    }

    let _syncTimer = null;
    let _syncing = false;
    function pushSync(immediate = false) {
        if (!apiToken() || !currentUser) return;
        clearTimeout(_syncTimer);
        const run = async () => {
            if (_syncing) return;
            _syncing = true;
            try {
                const res = await fetch(`${API_URL}/api/user/sync`, {
                    method: 'POST',
                    headers: apiAuthHeaders(),
                    body: JSON.stringify({
                        data: userData,
                        achievements: userData.achievements || []
                    })
                });
                if (res.status === 401) {
                    try {
                        const body = await res.json();
                        if (body.displaced) {
                            // Otro dispositivo inició sesión — forzar cierre aquí
                            clearApiToken();
                            localStorage.removeItem('arthur_current_user');
                            alert('⚠️ Tu cuenta fue abierta en otro dispositivo.\nEsta sesión se ha cerrado para proteger tu cuenta.');
                            location.reload();
                            return;
                        }
                    } catch (_) {}
                    clearApiToken();
                    console.warn('[sync] sesión remota expirada, datos solo en local.');
                }
            } catch (e) {
                console.warn('[sync] sin conexión, reintento luego:', e.message);
            } finally {
                _syncing = false;
            }
        };
        if (immediate) run();
        else _syncTimer = setTimeout(run, 1500);  // debounce
    }

    async function pullRemoteData() {
        if (!apiToken()) return null;
        try {
            const res = await fetch(`${API_URL}/api/user/data`, { headers: apiAuthHeaders() });
            if (!res.ok) return null;
            const j = await res.json();
            return j.success ? j : null;
        } catch { return null; }
    }

    function saveData() {
        if (currentUser) {
            localStorage.setItem(getStorageKey(), JSON.stringify(userData));
            pushSync(); // debounced — solo si hay token
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
        const privacyChk = document.getElementById('reg-privacy');
        const privacyAccepted = !!(privacyChk && privacyChk.checked);
        const errDiv = document.getElementById('reg-error');

        const showErr = (msg) => {
            if (errDiv) { errDiv.textContent = msg; errDiv.style.display = 'block'; }
            else alert(msg);
        };

        if (errDiv) errDiv.style.display = 'none';

        if (u.length < 3 || p.length < 4) {
            showErr("⚠️ Usuario mínimo 3 caracteres y contraseña mínimo 4 caracteres.");
            return;
        }
        if (!gc) {
            showErr("⚠️ CÓDIGO DE ATLETA requerido. Pídelo a tu coach.");
            return;
        }
        if (!privacyAccepted) {
            showErr("⚠️ Debes marcar la casilla: He leído y acepto el Aviso de Privacidad y los Términos y Condiciones.");
            if (privacyChk) privacyChk.focus();
            return;
        }
        if (localStorage.getItem(`arthur_data_${u}`)) {
            if (!confirm("Ya existe un usuario con ese nombre en este dispositivo.\n¿Deseas reemplazarlo con una cuenta nueva?")) {
                return;
            }
        }

        const btn = document.getElementById('btn-register-confirm');
        const originalText = btn.textContent;
        btn.textContent = "⏳ CONECTANDO (puede tardar 30-60s la 1a vez)...";
        btn.style.opacity = '0.7';
        btn.disabled = true;

        // Caso DEMO: solo local, no se persiste en servidor
        if (gc === "AXV-DEMO") {
            currentUser = u;
            userData.username = u;
            userData.password = p;
            userData.gymCode = gc;
            userData.privacyAccepted = true;
            userData.achievements = userData.achievements || [];
            clearApiToken();
            saveData();
            localStorage.setItem('arthur_current_user', u);
            localStorage.setItem('axcore_first_run', '1');
            showErr("✅ Modo DEMO activado. Recarga la página para entrar.");
            if (errDiv) errDiv.style.background = 'rgba(0,255,136,0.15)';
            setTimeout(() => location.reload(), 1500);
            return;
        }

        try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 60000);

            const res = await fetch(`${API_URL}/api/user/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    code: gc,
                    username: u,
                    password: p,
                    privacyAccepted: true,
                    data: { username: u, gymCode: gc, privacyAccepted: true, privacyDate: new Date().toISOString() }
                }),
                signal: controller.signal
            });
            clearTimeout(timeout);
            const data = await res.json();

            if (data.success) {
                setApiToken(data.token);
                currentUser = u;
                userData.username = u;
                userData.password = p;
                userData.gymCode = gc;
                userData.privacyAccepted = true;
                userData.privacyDate = new Date().toISOString();
                userData.achievements = [];
                saveData();
                localStorage.setItem('arthur_current_user', u);
                localStorage.setItem('axcore_first_run', '1');
                showErr(`✅ Cuenta creada. Entrando a AX-CORE...`);
                if (errDiv) errDiv.style.background = 'rgba(0,255,136,0.15)';
                setTimeout(() => location.reload(), 1500);
            } else {
                showErr(`❌ ${data.message || "No se pudo registrar. Verifica el código."}`);
                if (errDiv) errDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        } catch(e) {
            if (e.name === 'AbortError') {
                showErr("⏱️ El servidor tardó demasiado (puede estar iniciando). Espera 30 segundos e intenta de nuevo.");
            } else {
                showErr(`❌ Sin conexión al servidor. Revisa tu internet o intenta en 1 minuto.\n(${e.message})`);
            }
            if (errDiv) errDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
            console.error('[registro]', e);
        }

        btn.textContent = originalText;
        btn.style.opacity = '';
        btn.disabled = false;
    };

    document.getElementById('btn-login-access').onclick = async () => {
        const u = loginUser.value.trim();
        const p = loginPass.value.trim();
        if (u.length < 3 || p.length < 4) {
            alert("Usuario y contraseña requeridos.");
            return;
        }

        const btn = document.getElementById('btn-login-access');
        const originalText = btn.textContent;
        btn.textContent = "CONECTANDO...";
        btn.disabled = true;

        // 1. Intentar primero login local (necesario para casos DEMO/offline)
        const savedRaw = localStorage.getItem(`arthur_data_${u}`);
        const savedLocal = savedRaw ? JSON.parse(savedRaw) : null;
        const localCode = savedLocal?.gymCode || '';

        // 2. Si tenemos código (no DEMO), intentar login remoto con ese código
        if (localCode && localCode !== 'AXV-DEMO') {
            try {
                const res = await fetch(`${API_URL}/api/user/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ code: localCode, password: p })
                });
                const data = await res.json();
                if (data.success) {
                    setApiToken(data.token);
                    // Merge: priorizar data remota si es más nueva
                    const merged = { ...(savedLocal || {}), ...(data.data || {}) };
                    merged.username = u;
                    merged.password = p;
                    merged.gymCode = localCode;
                    merged.achievements = data.achievements || merged.achievements || [];
                    localStorage.setItem(`arthur_data_${u}`, JSON.stringify(merged));
                    currentUser = u;
                    localStorage.setItem('arthur_current_user', u);
                    location.reload();
                    return;
                } else {
                    // Mensaje del backend (ej. franquicia sin pago)
                    alert(data.message || "Credenciales incorrectas.");
                    btn.textContent = originalText;
                    btn.disabled = false;
                    return;
                }
            } catch (e) {
                // Sin conexión: caer a login local si las credenciales coinciden
                console.warn('[login] backend no responde, modo offline');
            }
        }

        // 3. Login local (DEMO o fallback offline)
        if (!savedLocal) {
            alert("Usuario no encontrado en este dispositivo.\nUsa NUEVO ATLETA para crear cuenta.");
            btn.textContent = originalText; btn.disabled = false;
            return;
        }
        if (savedLocal.password !== p) {
            alert("Contraseña incorrecta.");
            btn.textContent = originalText; btn.disabled = false;
            return;
        }
        currentUser = u;
        localStorage.setItem('arthur_current_user', u);
        location.reload();
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

    function getThemeColors() {
        const cs = getComputedStyle(document.body);
        return {
            main: (cs.getPropertyValue('--accent-main') || '#00ff88').trim(),
            secondary: (cs.getPropertyValue('--accent-secondary') || '#00d4ff').trim(),
            alert: (cs.getPropertyValue('--accent-alert') || '#ff3366').trim(),
            dim: (cs.getPropertyValue('--text-dim') || '#94a3b8').trim()
        };
    }

    function initOrUpdateCharts(progW, progWaist, calPerc) {
        if (typeof ApexCharts === 'undefined' || !document.getElementById('chart-weight')) return;
        const themeColors = getThemeColors();
        const isLight = document.body.getAttribute('data-theme') === 'natural';
        const trackBg = isLight ? 'rgba(46,125,50,0.08)' : 'rgba(255,255,255,0.05)';

        const commonOptions = {
            chart: { type: 'radialBar', height: 160, sparkline: { enabled: true } },
            plotOptions: {
                radialBar: {
                    hollow: { size: '60%', background: 'transparent' },
                    track: { background: trackBg },
                    dataLabels: {
                        name: { show: false },
                        value: {
                            show: true,
                            fontSize: '18px',
                            fontFamily: 'var(--font-accent)',
                            fontWeight: 'bold',
                            color: themeColors.main,
                            formatter: function (val) { return Math.round(val) + "%" }
                        }
                    }
                }
            },
            stroke: { lineCap: 'round' },
            legend: { show: false }
        };

        // Weight
        if (!chartWeight) {
            chartWeight = new ApexCharts(document.querySelector("#chart-weight"), {
                ...commonOptions, series: [progW], colors: [themeColors.main]
            });
            chartWeight.render();
        } else {
            chartWeight.updateOptions({ colors: [themeColors.main], plotOptions: { radialBar: { track: { background: trackBg }, dataLabels: { value: { color: themeColors.main } } } } });
            chartWeight.updateSeries([progW]);
        }

        // Calories
        let colorCal = (userData.caloriesConsumedToday > userData.dailyCalLimit) ? themeColors.alert : themeColors.main;
        if (!chartCalories) {
            chartCalories = new ApexCharts(document.querySelector("#chart-calories"), {
                ...commonOptions,
                series: [Math.min(calPerc, 100)],
                colors: [colorCal],
                plotOptions: { radialBar: { ...commonOptions.plotOptions.radialBar, dataLabels: { value: { ...commonOptions.plotOptions.radialBar.dataLabels.value, color: colorCal } } } }
            });
            chartCalories.render();
        } else {
            chartCalories.updateOptions({ colors: [colorCal], plotOptions: { radialBar: { track: { background: trackBg }, dataLabels: { value: { color: colorCal } } } } });
            chartCalories.updateSeries([Math.min(calPerc, 100)]);
        }

        // Waist
        if (!chartWaist) {
            chartWaist = new ApexCharts(document.querySelector("#chart-waist"), {
                ...commonOptions, series: [progWaist], colors: [themeColors.secondary]
            });
            chartWaist.render();
        } else {
            chartWaist.updateOptions({ colors: [themeColors.secondary], plotOptions: { radialBar: { track: { background: trackBg }, dataLabels: { value: { color: themeColors.secondary } } } } });
            chartWaist.updateSeries([progWaist]);
        }

        // Evolución Reciente — tarjetas visuales + sparkline
        renderEvolReciente(themeColors, isLight);
    }

    function renderEvolReciente(themeColors, isLight) {
        const historyData = userData.history || [];
        const cardsEl   = document.getElementById('evol-cards');
        const emptyEl   = document.getElementById('evol-empty');
        const progWrap  = document.getElementById('evol-progress-wrap');

        if (!cardsEl) return;

        if (historyData.length === 0) {
            cardsEl.innerHTML = '';
            if (emptyEl) { emptyEl.style.display = 'block'; }
            if (progWrap) progWrap.style.display = 'none';
            if (chartHistory) { chartHistory.destroy(); chartHistory = null; }
            return;
        }
        if (emptyEl) emptyEl.style.display = 'none';

        // Barra de progreso hacia la meta
        const initW  = userData.weight || 0;
        const goalW  = userData.target_weight || 0;
        const lastH  = historyData[historyData.length - 1];
        const currW  = lastH ? (lastH.weight || initW) : initW;
        if (progWrap && goalW > 0 && initW > goalW) {
            progWrap.style.display = 'block';
            const totalToLose = initW - goalW;
            const lostSoFar   = Math.max(0, initW - currW);
            const pct = Math.min(100, Math.round((lostSoFar / totalToLose) * 100));
            const bar = document.getElementById('evol-prog-bar');
            const lbl = document.getElementById('evol-prog-label');
            const start = document.getElementById('evol-prog-start');
            const goal  = document.getElementById('evol-prog-goal');
            if (bar) bar.style.width = pct + '%';
            if (lbl) lbl.textContent = `${pct}% completado · ${lostSoFar.toFixed(1)} kg perdidos`;
            if (start) start.textContent = `${initW} kg`;
            if (goal)  goal.textContent  = `${goalW} kg`;
        } else if (progWrap) {
            progWrap.style.display = 'none';
        }

        // Tarjetas de los últimos 5 registros (más reciente primero)
        const recent = [...historyData].slice(-5).reverse();
        cardsEl.innerHTML = recent.map((h, i, arr) => {
            const prev   = arr[i + 1];
            const delta  = prev ? (h.weight - prev.weight) : null;
            const losing = delta !== null && delta < 0;
            const gaining = delta !== null && delta > 0;
            const arrow  = delta === null ? '' : (losing ? '▼' : (gaining ? '▲' : '→'));
            const dColor = delta === null ? '#888' : (losing ? '#00ff88' : (gaining ? '#ff3366' : '#888'));
            const dText  = delta === null ? '—' : (losing ? delta.toFixed(1) : `+${delta.toFixed(1)}`);
            const dateShort = (h.date || '').slice(5); // MM-DD
            return `
            <div style="
                flex-shrink:0; width:88px; background:rgba(255,255,255,0.04);
                border:1px solid rgba(255,255,255,0.08); border-radius:14px;
                padding:10px 8px; text-align:center; position:relative;
                ${i === 0 ? 'border-color:' + dColor + ';box-shadow:0 0 8px ' + dColor + '22;' : ''}
            ">
                ${i === 0 ? '<span style="position:absolute;top:4px;right:6px;font-size:8px;color:#888;">HOY</span>' : ''}
                <p style="font-size:0.6rem;color:#666;margin-bottom:4px;">${dateShort}</p>
                <p style="font-family:var(--font-accent);font-size:1.05rem;color:#fff;margin:0;">${(h.weight||0).toFixed(1)}</p>
                <p style="font-size:0.6rem;color:#555;margin:0 0 4px;">kg</p>
                <p style="font-size:0.85rem;font-weight:700;color:${dColor};margin:0;">${arrow} ${dText}</p>
                ${h.waist ? `<p style="font-size:0.6rem;color:#555;margin-top:3px;">${h.waist}cm</p>` : ''}
            </div>`;
        }).join('');

        // Sparkline compacto (últimas 10 entradas)
        const last10    = historyData.slice(-10);
        const dates10   = last10.map(h => (h.date || '').slice(5));
        const weights10 = last10.map(h => h.weight || 0);
        const waists10  = last10.map(h => h.waist || 0);
        const sparkEl   = document.querySelector('#chart-history');

        if (!chartHistory && sparkEl) {
            chartHistory = new ApexCharts(sparkEl, {
                series: [
                    { name: 'Peso kg', data: weights10 },
                    { name: 'Cintura cm', data: waists10 }
                ],
                chart: { height: 130, type: 'area', toolbar: { show: false }, background: 'transparent', sparkline: { enabled: false }, parentHeightOffset: 0, animations: { enabled: false } },
                stroke: { curve: 'smooth', width: [2, 2] },
                fill: {
                    type: ['gradient', 'solid'],
                    gradient: { shade: 'dark', shadeIntensity: 1, opacityFrom: 0.3, opacityTo: 0.02 },
                    opacity: [1, 0]
                },
                colors: [themeColors.main, themeColors.secondary],
                labels: dates10,
                xaxis: { labels: { style: { colors: '#555', fontSize: '9px' } }, axisBorder: { show: false }, axisTicks: { show: false }, tooltip: { enabled: false } },
                yaxis: [
                    { labels: { style: { colors: '#555', fontSize: '9px' }, formatter: v => v.toFixed(0) + 'kg' } },
                    { opposite: true, labels: { style: { colors: '#555', fontSize: '9px' }, formatter: v => v.toFixed(0) + 'cm' } }
                ],
                legend: { show: true, position: 'top', labels: { colors: '#888' }, fontSize: '10px', markers: { size: 5 } },
                tooltip: { theme: 'dark', shared: true },
                grid: { borderColor: 'rgba(255,255,255,0.04)', strokeDashArray: 4, padding: { top: 0, bottom: 0 } },
                theme: { mode: isLight ? 'light' : 'dark' }
            });
            chartHistory.render();
        } else if (chartHistory) {
            chartHistory.updateOptions({ labels: dates10, theme: { mode: isLight ? 'light' : 'dark' } });
            chartHistory.updateSeries([
                { name: 'Peso kg', data: weights10 },
                { name: 'Cintura cm', data: waists10 }
            ]);
        }
    }

    function updateDashboard() {
        const s = (id) => document.getElementById(id);

        // Peso
        if (s('current-weight')) s('current-weight').textContent = (userData.weight || 0).toFixed(1);
        if (s('weight-meta-text')) s('weight-meta-text').textContent = `Meta: ${userData.target_weight || 0} KG`;
        const progW = Math.max(0, Math.min(100, ((110 - (userData.weight || 110)) / Math.max(1, (110 - (userData.target_weight || 85)))) * 100));

        // Cintura
        if (s('current-waist')) s('current-waist').textContent = userData.waist || 0;
        const targetWaist = userData.target_waist || 0;
        const initialWaist = userData.waist || 0;
        const progWaist = targetWaist > 0 ? Math.max(0, Math.min(100, ((initialWaist - (userData.waist || initialWaist)) / Math.max(1, initialWaist - targetWaist)) * 100)) : 0;
        if (s('waist-meta-text')) s('waist-meta-text').textContent = targetWaist > 0 ? `Meta: ${targetWaist} CM` : `Meta: 0 CM`;

        // Calorías
        const net = (userData.caloriesConsumedToday || 0) - (userData.caloriesBurnedToday || 0);
        const calEl = s('calories-net');
        if (calEl) { calEl.textContent = net; calEl.style.color = net > userData.dailyCalLimit ? 'var(--accent-alert)' : ''; }
        if (s('cal-in')) s('cal-in').textContent = userData.caloriesConsumedToday || 0;
        if (s('cal-out')) s('cal-out').textContent = userData.caloriesBurnedToday || 0;

        const calPerc = userData.dailyCalLimit ? Math.max(0, (userData.caloriesConsumedToday / userData.dailyCalLimit) * 100) : 0;
        if (s('cal-rem-text')) s('cal-rem-text').textContent = `Límite diario: ${userData.dailyCalLimit || 0} KCAL`;

        // Render o Update de Gráficas
        initOrUpdateCharts(progW, progWaist, calPerc);

        // Déficit histórico
        const def = userData.totalNetDeficit || 0;
        if (s('total-deficit')) s('total-deficit').textContent = def;
        const kgEquiv = Math.abs(def / 7700).toFixed(2);
        const kbText = s('kilos-burned-text');
        if (kbText) {
            kbText.textContent = def >= 0 ? `${kgEquiv} kg` : `+${kgEquiv} kg`;
            kbText.style.color = def >= 0 ? 'var(--accent-secondary)' : 'var(--accent-alert)';
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

        // ═══ PREMIUM DASHBOARD (Paso 2) ═══
        try { updatePremiumDashboard(); } catch(e) { console.warn('[premium-dash]', e.message); }
    }

    // ═══════════════ PREMIUM DASHBOARD ═══════════════
    function updatePremiumDashboard() {
        const get = (id) => document.getElementById(id);
        const set = (id, val) => { const el = get(id); if (el) el.textContent = val; };

        // PESO ACTUAL + META
        const w  = +(userData.weight || 0);
        const tw = +(userData.target_weight || 0);
        const sw = +(userData.startWeight || (userData.history?.[0]?.weight) || w);
        set('pd-weight', w.toFixed(1));
        const remain = (w - tw).toFixed(1);
        set('pd-goal-text', tw > 0 ? `Meta: ${tw} kg · ${remain} kg restantes` : 'Meta: configura tu peso objetivo');

        // RING DE PROGRESO + BARRA
        let pct = 0;
        if (sw > tw && sw > 0) {
            const lost = Math.max(0, sw - w);
            const total = sw - tw;
            pct = Math.max(0, Math.min(100, Math.round((lost / total) * 100)));
        }
        const ring = get('pd-ring-progress');
        if (ring) {
            const dashLen = 220;
            ring.setAttribute('stroke-dashoffset', dashLen - (dashLen * pct / 100));
        }
        set('pd-ring-pct', pct + '%');
        const bar = get('pd-progress-bar');
        if (bar) bar.style.width = pct + '%';
        set('pd-progress-start', sw + ' kg');
        set('pd-progress-goal', tw + ' kg');
        set('pd-progress-pct-label', pct + '% completado');

        // RACHA — del state si existe, si no calcular
        const streak = userData.streak || (userData.history?.length || 0);
        set('pd-streak-days', streak);

        // RESUMEN DE HOY
        const calIn  = +(userData.caloriesConsumedToday || 0);
        const calOut = +(userData.caloriesBurnedToday || 0);
        const lim    = +(userData.dailyCalLimit || 0);
        const deficit = +(userData.totalNetDeficit || 0);
        set('pd-cal-in', calIn.toLocaleString());
        set('pd-cal-limit', lim.toLocaleString());
        set('pd-cal-out', calOut);
        set('pd-deficit', deficit.toLocaleString());
        const fat = Math.abs(deficit / 7700).toFixed(2);
        set('pd-fat', fat);

        // IMC
        const h = +(userData.height || 0);
        if (h > 0 && w > 0) {
            const imc = w / (h * h);
            set('pd-imc-val', imc.toFixed(1));
            let tag = '--';
            if (imc < 18.5) tag = 'BAJO PESO';
            else if (imc < 25) tag = 'NORMAL';
            else if (imc < 30) tag = 'SOBREPESO';
            else tag = 'OBESIDAD';
            set('pd-imc-tag', tag);
        }

        // ÚLTIMA MEDIDA
        if (userData.history && userData.history.length > 0) {
            const last = userData.history[userData.history.length - 1];
            set('pd-last-info', `${last.date} · ${last.weight} kg · cintura ${last.waist || 0} cm`);
        }

        // INSIGNIAS scroll (8 visibles, primeras unlocked + locked como mystery)
        const ach = userData.achievements || [];
        const ACHIEVEMENT_DEFS = (typeof ACHIEVEMENTS_DEF !== 'undefined') ? ACHIEVEMENTS_DEF : [];
        const allBadges = (ACHIEVEMENT_DEFS.length > 0) ? ACHIEVEMENT_DEFS : [
            // Fallback si no hay definiciones
            { id: 'welcome', name: 'Bienvenido', emoji: '🎯' },
            { id: 'first_log', name: '1er Registro', emoji: '📋' },
            { id: 'streak_3', name: 'Racha 3', emoji: '🔥' },
            { id: 'streak_7', name: 'Racha 7', emoji: '⚡' }
        ];
        const unlockedB = allBadges.filter(b => ach.includes(b.id)).slice(0, 6);
        const lockedCount = Math.max(2, 8 - unlockedB.length);
        const scroll = get('pd-badges-scroll');
        if (scroll) {
            scroll.innerHTML = unlockedB.map(b =>
                `<div class="pd-badge"><div class="pd-badge-icon unlocked">${b.emoji || '🏅'}</div><div class="pd-badge-name">${(b.name || '').toUpperCase()}</div></div>`
            ).join('') + Array.from({length: lockedCount}).map(() =>
                `<div class="pd-badge locked"><div class="pd-badge-icon locked">🔒</div><div class="pd-badge-name">???</div></div>`
            ).join('');
        }
        set('pd-badges-count', ach.length);
    }

    // Navegación rápida desde botones del hero
    window.pdGoToEvolution = function() {
        const link = document.querySelector('[data-page=evolution]');
        if (link) link.click();
    };

    // --- NAVIGATION ---
    navLinks.forEach(link => {
        link.onclick = async (e) => {
            if (link.id === 'nav-logout') {
                if (confirm("¿Cerrar sesión táctica en AX-CORE?")) {
                    // Invalidar sesión en el servidor para liberar el dispositivo
                    if (apiToken()) {
                        try {
                            await fetch(`${API_URL}/api/user/logout`, {
                                method: 'POST', headers: apiAuthHeaders()
                            });
                        } catch (_) {}
                    }
                    localStorage.removeItem('arthur_current_user');
                    clearApiToken();
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
            if (pageId === 'assistant' && typeof window._activateCalculator === 'function') window._activateCalculator();
            if (pageId === 'settings' && typeof window.syncPremiumToggleVisual === 'function') window.syncPremiumToggleVisual();

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

    // ═══════════════════════════════════════════════════════════
    // INDICADOR DE SWIPE — se muestra una sola vez al entrar
    // ═══════════════════════════════════════════════════════════
    (function showSwipeHint() {
        try {
            if (localStorage.getItem('axcore_swipe_hint_seen')) return;
            const hint = document.createElement('div');
            hint.id = 'swipe-hint';
            hint.innerHTML = '<span>← Desliza con el pulgar para cambiar de sección →</span>';
            hint.style.cssText = `
                position: fixed; bottom: 80px; left: 50%; transform: translateX(-50%);
                background: rgba(0,229,255,0.12); color: var(--accent-main);
                border: 1px solid rgba(0,229,255,0.4); border-radius: 30px;
                padding: 10px 20px; font-size: 0.8rem; font-weight: 700;
                letter-spacing: 0.5px; z-index: 9999;
                backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px);
                animation: hintPulse 2s ease-in-out infinite;
                box-shadow: 0 8px 30px rgba(0,0,0,0.4);
                pointer-events: none;
            `;
            const style = document.createElement('style');
            style.textContent = `
                @keyframes hintPulse {
                    0%, 100% { transform: translateX(-50%) scale(1); opacity: 0.95; }
                    50% { transform: translateX(-50%) scale(1.04); opacity: 1; }
                }
                @keyframes hintOut {
                    to { opacity: 0; transform: translateX(-50%) translateY(20px); }
                }
            `;
            document.head.appendChild(style);
            setTimeout(() => {
                if (document.body) document.body.appendChild(hint);
            }, 1500);
            setTimeout(() => {
                if (hint.parentNode) {
                    hint.style.animation = 'hintOut 0.5s forwards';
                    setTimeout(() => hint.remove(), 600);
                }
                localStorage.setItem('axcore_swipe_hint_seen', '1');
            }, 6000);
        } catch(e) {}
    })();

    // ═══════════════════════════════════════════════════════════
    // SWIPE LATERAL — Cambiar de sección con el pulgar (←/→)
    // ═══════════════════════════════════════════════════════════
    (function setupSwipeNavigation() {
        let sX = 0, sY = 0, sT = 0, tracking = false;

        // Solo bloqueamos elementos que USAN scroll horizontal propio
        // o capturan touch de forma activa (inputs, sliders, scroll horizontal)
        function isHorizontalScroller(el) {
            if (!el) return false;
            // Range inputs capturan el swipe para cambiar valor
            if (el.tagName === 'INPUT' && el.type === 'range') return true;
            // Contenedores con scroll horizontal (plantillas, etc.)
            const style = window.getComputedStyle(el);
            if ((style.overflowX === 'auto' || style.overflowX === 'scroll') && el.scrollWidth > el.clientWidth + 4) return true;
            return false;
        }

        function shouldBlock(target) {
            // Bloqueamos inputs de texto y textareas (el usuario escribe)
            if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') return true;
            // Recorremos hacia arriba buscando un scroller horizontal
            let el = target;
            for (let i = 0; i < 8 && el; i++) {
                if (isHorizontalScroller(el)) return true;
                el = el.parentElement;
            }
            return false;
        }

        function activePageId() {
            const active = document.querySelector('.page.active');
            return active ? active.id.replace(/^page-/, '') : null;
        }

        function goToPage(dx) {
            const list = Array.from(navLinks).filter(l => l.dataset.page && l.id !== 'nav-logout');
            const curId = activePageId();
            const idx = list.findIndex(l => l.dataset.page === curId);
            if (idx < 0) return;
            const newIdx = dx < 0
                ? (idx + 1) % list.length
                : (idx - 1 + list.length) % list.length;
            const target = list[newIdx];
            if (!target) return;
            target.click();
            const pg = document.querySelector('.page.active');
            if (pg) {
                pg.style.animation = 'none';
                void pg.offsetWidth;
                pg.style.animation = `axcore-swipe-${dx < 0 ? 'l' : 'r'} 0.28s ease`;
            }
        }

        document.addEventListener('touchstart', (e) => {
            tracking = false;
            if (shouldBlock(e.target)) return;
            sX = e.touches[0].clientX;
            sY = e.touches[0].clientY;
            sT = Date.now();
            tracking = true;
        }, { passive: true });

        document.addEventListener('touchmove', (e) => {
            if (!tracking) return;
            // Si la dirección inicial es mayormente vertical, cancelar tracking
            const dx = Math.abs(e.touches[0].clientX - sX);
            const dy = Math.abs(e.touches[0].clientY - sY);
            if (dy > dx && dy > 12) tracking = false;
        }, { passive: true });

        document.addEventListener('touchend', (e) => {
            if (!tracking) return;
            tracking = false;
            const dt = Date.now() - sT;
            if (dt > 500) return;
            const eX = e.changedTouches[0].clientX;
            const eY = e.changedTouches[0].clientY;
            const dx = eX - sX;
            const dy = Math.abs(eY - sY);
            if (Math.abs(dx) < 30) return;   // mínimo 30px horizontal
            if (dy > 80) return;             // máximo 80px vertical
            if (Math.abs(dx) < dy * 1.2) return; // debe ser más horizontal que diagonal
            goToPage(dx);
        }, { passive: true });
    })();

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
            if (typeof checkAchievements === 'function') checkAchievements();
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
    function parseDietText(text) {
        const result = { breakfast: '', lunch: '', dinner: '', snacks: '', recommendations: '' };
        const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
        let current = null;
        for (const line of lines) {
            const low = line.toLowerCase();
            if (/desayuno|breakfast|mañana/i.test(low)) { current = 'breakfast'; result.breakfast += line.replace(/.*?[:：]\s*/,'') + '\n'; continue; }
            if (/comida|almuerzo|lunch|mediod[ií]a/i.test(low)) { current = 'lunch'; result.lunch += line.replace(/.*?[:：]\s*/,'') + '\n'; continue; }
            if (/cena|dinner|noche/i.test(low)) { current = 'dinner'; result.dinner += line.replace(/.*?[:：]\s*/,'') + '\n'; continue; }
            if (/snack|merienda|colaci[oó]n|tentempié|refrigerio|botana|extras/i.test(low)) { current = 'snacks'; result.snacks += line.replace(/.*?[:：]\s*/,'') + '\n'; continue; }
            if (/recomend|reglas?|consejo|tips|indicaciones|protocolo|importante/i.test(low)) { current = 'recommendations'; result.recommendations += line.replace(/.*?[:：]\s*/,'') + '\n'; continue; }
            if (current) result[current] += line + '\n';
        }
        return {
            breakfast: result.breakfast.trim(),
            lunch: result.lunch.trim(),
            dinner: result.dinner.trim(),
            snacks: result.snacks.trim(),
            recommendations: result.recommendations.trim()
        };
    }

    function renderDietPage() {
        const diet = userData.recommendedDiet || { breakfast: '', lunch: '', dinner: '', snacks: '' };
        const hasCustomRules = userData.customDietRules && userData.customDietRules.length > 0;
        const rules = hasCustomRules
            ? userData.customDietRules
            : (typeof ARTHUR_KNOWLEDGE !== 'undefined' && ARTHUR_KNOWLEDGE.diet_rules ? ARTHUR_KNOWLEDGE.diet_rules : []);
        const dietEl = document.getElementById('page-diet');
        dietEl.innerHTML = `
            <div class="glass-card diet-plan" style="max-width:800px; margin: 0 auto;">
                <h2 style="font-family:var(--font-accent); color:var(--accent-main); margin-bottom:1.5rem; text-align:center;">NUTRICIÓN</h2>

                <!-- IMPORTAR DIETA COMPLETA -->
                <div class="meal-item glass-card" style="padding:2rem; border-color:var(--accent-main); margin-bottom:2rem; border-width:2px;">
                    <h3 style="color:var(--accent-main); font-size:1rem; margin-bottom:0.4rem; font-family:var(--font-accent); letter-spacing:1px;">📋 IMPORTAR DIETA COMPLETA</h3>
                    <p style="font-size:0.78rem; color:var(--text-dim); margin-bottom:1rem; line-height:1.5;">Pega aquí el plan de tu nutriólogo o toda tu dieta en texto libre. La app la distribuirá automáticamente en desayuno, comida, cena y snacks.</p>
                    <textarea id="diet-full-import" style="width:100%; min-height:130px; background:var(--glass-bg, rgba(0,0,0,0.2)); border:1px solid var(--glass-border); border-radius:10px; padding:1rem; color:var(--text-primary); font-family:var(--font-main); font-size:0.9rem; line-height:1.6; resize:vertical;" placeholder="Ejemplo:&#10;Desayuno: 3 huevos revueltos, 1 taza de avena con fruta&#10;Comida: 200g pechuga a la plancha, 1 taza arroz integral, ensalada&#10;Cena: 2 tortillas con frijoles, 1 taza de sopa de verduras&#10;Snacks: 1 manzana, 30g nueces"></textarea>
                    <button class="btn-premium" id="btn-distribute-diet" style="width:100%; margin-top:1rem;">⚡ DISTRIBUIR DIETA AUTOMÁTICAMENTE</button>
                </div>

                <!-- DIETA EDITABLE MANUAL -->
                <div class="meal-item glass-card" style="padding:2rem; border-color:var(--accent-secondary); margin-bottom:2rem;">
                    <h3 style="color:var(--accent-secondary); font-size:1rem; margin-bottom:0.5rem; font-family:var(--font-accent); letter-spacing:1px; border-bottom:1px solid var(--accent-secondary); padding-bottom:0.5rem;">DIETA DETALLADA POR TIEMPO</h3>
                    <p style="font-size:0.78rem; color:var(--text-dim); margin-bottom:1rem;">Edita manualmente cada tiempo de comida. Pulsa <strong>GUARDAR DIETA</strong> cuando termines.</p>
                    <div style="display:grid; grid-template-columns: 1fr; gap:16px;" class="diet-grid-mobile">
                        <div style="display:flex; flex-direction:column;">
                            <label style="color:var(--accent-main); font-weight:bold; display:block; font-size:0.85rem; margin-bottom:0.5rem;">🌅 DESAYUNO</label>
                            <textarea id="diet-edit-breakfast" style="flex:1; min-height:90px; background:var(--glass-bg, rgba(0,0,0,0.2)); border:1px solid var(--glass-border); border-radius:8px; padding:0.8rem; color:var(--text-primary); line-height:1.5; font-size:0.9rem; font-family:var(--font-main); resize:vertical;" placeholder="Ej. 3 huevos revueltos + 1 tortilla">${diet.breakfast || ''}</textarea>
                        </div>
                        <div style="display:flex; flex-direction:column;">
                            <label style="color:var(--accent-main); font-weight:bold; display:block; font-size:0.85rem; margin-bottom:0.5rem;">☀️ COMIDA</label>
                            <textarea id="diet-edit-lunch" style="flex:1; min-height:90px; background:var(--glass-bg, rgba(0,0,0,0.2)); border:1px solid var(--glass-border); border-radius:8px; padding:0.8rem; color:var(--text-primary); line-height:1.5; font-size:0.9rem; font-family:var(--font-main); resize:vertical;" placeholder="Ej. Pechuga asada 200g + arroz integral + ensalada">${diet.lunch || ''}</textarea>
                        </div>
                        <div style="display:flex; flex-direction:column;">
                            <label style="color:var(--accent-main); font-weight:bold; display:block; font-size:0.85rem; margin-bottom:0.5rem;">🌙 CENA</label>
                            <textarea id="diet-edit-dinner" style="flex:1; min-height:90px; background:var(--glass-bg, rgba(0,0,0,0.2)); border:1px solid var(--glass-border); border-radius:8px; padding:0.8rem; color:var(--text-primary); line-height:1.5; font-size:0.9rem; font-family:var(--font-main); resize:vertical;" placeholder="Ej. 2 tortillas con 2 huevos + ensalada">${diet.dinner || ''}</textarea>
                        </div>
                        <div style="display:flex; flex-direction:column;">
                            <label style="color:var(--accent-main); font-weight:bold; display:block; font-size:0.85rem; margin-bottom:0.5rem;">🍎 SNACKS / ADICIONALES</label>
                            <textarea id="diet-edit-snacks" style="flex:1; min-height:90px; background:var(--glass-bg, rgba(0,0,0,0.2)); border:1px solid var(--glass-border); border-radius:8px; padding:0.8rem; color:var(--text-primary); line-height:1.5; font-size:0.9rem; font-family:var(--font-main); resize:vertical;" placeholder="Ej. Zanahoria con limón, té verde">${diet.snacks || ''}</textarea>
                        </div>
                    </div>
                    <button class="btn-premium" id="btn-save-diet" style="width:100%; margin-top:1.2rem;">💾 GUARDAR DIETA</button>
                    <button class="btn-premium" id="btn-reset-diet" style="width:100%; margin-top:10px; background:transparent; border:1px solid var(--accent-alert); color:var(--accent-alert);">🗑️ REINICIAR DIETA</button>
                </div>

                <!-- REGLAS DE PROTOCOLO -->
                <div class="meal-item glass-card" style="padding:2rem; margin-bottom:2rem; border-color:var(--accent-main);">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem; flex-wrap:wrap; gap:8px;">
                        <h3 style="color:var(--accent-main); font-size:1rem; font-family:var(--font-accent); letter-spacing:1px; margin:0;">📋 REGLAS DE PROTOCOLO</h3>
                        <button class="btn-premium" id="btn-edit-rules" style="font-size:0.65rem; padding:0.4rem 0.9rem;">✏️ EDITAR</button>
                    </div>
                    ${!hasCustomRules ? '<p style="font-size:0.72rem; color:var(--text-dim); font-style:italic; margin-bottom:0.8rem;">Ejemplos predefinidos. Edita para adaptarlas a tu dieta personal:</p>' : ''}
                    <ul id="rules-list-display" style="list-style:none; padding:0; display:flex; flex-direction:column; gap:8px;">
                        ${rules.length > 0 ? rules.map(r =>
                            `<li style="padding:0.6rem 0.8rem; background:rgba(0,255,136,${hasCustomRules ? '0.05' : '0.02'}); border-left:3px solid var(--accent-main); border-radius:6px; font-size:0.85rem; color:${hasCustomRules ? 'var(--text-primary)' : 'var(--text-dim)'}; ${hasCustomRules ? '' : 'opacity:0.55; font-style:italic;'}">▸ ${r}</li>`
                        ).join('') : '<li style="color:var(--text-dim); font-style:italic; font-size:0.85rem;">Sin reglas definidas aún. Pulsa EDITAR para agregar.</li>'}
                    </ul>
                </div>

                <!-- REGISTRO DE CALORÍAS REALES -->
                <div class="reg-food-container" style="border: 2px solid var(--accent-main); background: var(--glass-bg, rgba(0,0,0,0.1)); padding:2rem; border-radius:20px;">
                    <h3 style="color:var(--accent-main); font-family:var(--font-accent); margin-bottom:0.5rem;">REGISTRO DE INGESTA REAL</h3>
                    <p style="font-size:0.8rem; margin-bottom:1.5rem; color:var(--text-dim);">Reporta tus alimentos para que AXCore calibre tu metabolismo.</p>
                    <div class="food-entry-group" style="display:flex; gap:12px; flex-wrap:wrap;">
                        <input type="text" id="food-desc" placeholder="Ej. 100g de pollo y media taza de arroz..." style="flex:1; min-width:150px; background:var(--glass-bg, rgba(0,0,0,0.2)); border:1px solid var(--accent-main); padding:0.9rem; color:var(--text-primary); border-radius:12px; font-size:0.95rem;">
                        <button class="btn-premium" id="btn-add-food" style="flex:1; min-width:110px; padding:0.9rem; font-weight:bold;">REGISTRAR</button>
                    </div>
                </div>
            </div>
        `;

        // Editar reglas de protocolo
        const btnEditRules = document.getElementById('btn-edit-rules');
        if (btnEditRules) {
            btnEditRules.onclick = () => {
                const current = (userData.customDietRules && userData.customDietRules.length > 0)
                    ? userData.customDietRules
                    : rules;
                const text = prompt("Edita tus reglas de protocolo (una por línea):", current.join('\n'));
                if (text === null) return;
                const newRules = text.split('\n').map(s => s.trim()).filter(Boolean);
                userData.customDietRules = newRules;
                saveData();
                renderDietPage();
            };
        }

        // Distribuir dieta completa automáticamente
        document.getElementById('btn-distribute-diet').onclick = () => {
            const raw = document.getElementById('diet-full-import').value.trim();
            if (!raw) { alert('Escribe o pega tu dieta primero.'); return; }
            const parsed = parseDietText(raw);
            const hasData = parsed.breakfast || parsed.lunch || parsed.dinner || parsed.snacks || parsed.recommendations;
            if (!hasData) {
                alert('No se encontraron secciones reconocibles.\nUsa palabras como "Desayuno:", "Comida:", "Cena:", "Snacks:", "Recomendaciones:" para que la app las detecte.');
                return;
            }
            if (parsed.breakfast) document.getElementById('diet-edit-breakfast').value = parsed.breakfast;
            if (parsed.lunch)     document.getElementById('diet-edit-lunch').value = parsed.lunch;
            if (parsed.dinner)    document.getElementById('diet-edit-dinner').value = parsed.dinner;
            if (parsed.snacks)    document.getElementById('diet-edit-snacks').value = parsed.snacks;
            // Recomendaciones detectadas → se convierten en reglas custom
            if (parsed.recommendations) {
                const newRules = parsed.recommendations.split('\n').map(l => l.trim()).filter(l => l.length > 3);
                if (newRules.length > 0) {
                    userData.customDietRules = newRules;
                    saveData();
                }
            }
            document.getElementById('diet-full-import').value = '';
            document.getElementById('diet-edit-breakfast').scrollIntoView({ behavior: 'smooth' });
            const recsMsg = parsed.recommendations ? '\n💡 También detecté reglas/recomendaciones y se guardaron como reglas custom.' : '';
            alert('✅ Dieta distribuida. Revisa cada sección y pulsa GUARDAR DIETA cuando estés conforme.' + recsMsg);
        };

        // Guardar dieta editada manualmente
        document.getElementById('btn-save-diet').onclick = () => {
            const breakfast = document.getElementById('diet-edit-breakfast').value.trim();
            const lunch = document.getElementById('diet-edit-lunch').value.trim();
            const dinner = document.getElementById('diet-edit-dinner').value.trim();
            const snacks = document.getElementById('diet-edit-snacks').value.trim();

            userData.recommendedDiet = { breakfast, lunch, dinner, snacks };
            saveData();
            alert('✅ Dieta guardada correctamente.');
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

        document.getElementById('btn-add-food').onclick = () => {
            const desc = document.getElementById('food-desc').value.trim();
            if (!desc) return;

            const btn = document.getElementById('btn-add-food');
            const calUsed = userData.caloriesConsumedToday;
            const calLimit = userData.dailyCalLimit;

            const ldesc = desc.toLowerCase().trim();
            let estimatedCal = null;
            let dbMatch = null;
            let longestMatchLen = 0;

            // Buscar en FOOD_DATABASE base
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

            // Buscar también en alimentos personalizados del usuario
            if (!dbMatch && Array.isArray(userData.customFoods)) {
                for (const food of userData.customFoods) {
                    if (ldesc.includes(food.name) || food.name.includes(ldesc)) {
                        if (food.name.length > longestMatchLen) {
                            longestMatchLen = food.name.length;
                            dbMatch = food;
                        }
                    }
                }
            }

            if (dbMatch) {
                estimatedCal = dbMatch.cal;
                registerFood(desc, estimatedCal, calLimit, calUsed);
            } else {
                // Sin match: pedir kcal al usuario y persistirlo en su DB personal
                const input = prompt(`No tengo "${desc}" en mi base de alimentos.\n\n¿Cuántas kcal aproximadas tiene?\n(Lo guardaré para que la próxima vez lo encuentre solo)`);
                if (input === null) {
                    btn.textContent = "REGISTRAR";
                    btn.disabled = false;
                    return;
                }
                const manualCal = parseInt(String(input).replace(/[^0-9]/g, ""));
                if (isNaN(manualCal) || manualCal <= 0 || manualCal > 5000) {
                    alert("Valor inválido. Escribe un número entre 1 y 5000.");
                    return;
                }
                estimatedCal = manualCal;
                // Guardar en customFoods del usuario para futuros hits
                if (!Array.isArray(userData.customFoods)) userData.customFoods = [];
                userData.customFoods.push({ name: ldesc, cal: estimatedCal, p: 0, c: 0, f: 0 });
                registerFood(desc, estimatedCal, calLimit, calUsed);
            }
        };

        function registerFood(desc, estimatedCal, calLimit, calUsed) {
            const newTotal = calUsed + estimatedCal;
            const remaining = calLimit - newTotal;

            userData.caloriesConsumedToday += estimatedCal;
            userData.totalNetDeficit -= Math.round(estimatedCal * 0.15);
            userData.totalFoodLogs = (userData.totalFoodLogs || 0) + 1;
            userData.foodLogToday.push({
                time: new Date().toLocaleTimeString('es-MX', {hour: '2-digit', minute:'2-digit'}),
                desc, cal: estimatedCal
            });
            saveData();
            updateDashboard();
            if (typeof checkAchievements === 'function') checkAchievements();

            let msg = `✅ Registrado: "${desc}"\n📊 Calorías: +${estimatedCal} kcal\n`;
            if (remaining > 0) {
                msg += `💚 Te quedan ${remaining} kcal disponibles hoy.`;
            } else {
                msg += `⚠️ SUPERASTE tu límite diario por ${Math.abs(remaining)} kcal. Compensa con ejercicio.`;
            }
            alert(msg);
            const descEl = document.getElementById('food-desc');
            const btn = document.getElementById('btn-add-food');
            if (descEl) descEl.value = "";
            if (btn) { btn.textContent = "REGISTRAR"; btn.disabled = false; }
        }
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

                <h2 style="font-size:1.1rem; margin-bottom:1rem;">CATÁLOGO DE ENTRENAMIENTO</h2>
                <div class="exercise-catalog" style="grid-template-columns: repeat(2, 1fr);">
                    ${ARTHUR_KNOWLEDGE.exercises_catalog.map((ex, i) => {
                        const unit = ex.unit || (ex.type === 'Cardio' || ex.type === 'HIIT' ? 'Minutos' : 'Series');
                        const baseVal = ex.baseVal || (ex.type === 'Cardio' || ex.type === 'HIIT' ? 30 : 4);
                        return `
                        <div class="exercise-card" style="text-align:left; padding:0.85rem;">
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
        const userInput = document.getElementById('sensation-input').value.trim() || "Sin detalle adicional.";
        const out = document.getElementById('sensation-analysis');

        const ctx = {
            caloriesConsumedToday: userData.caloriesConsumedToday,
            caloriesBurnedToday: userData.caloriesBurnedToday,
            dailyCalLimit: userData.dailyCalLimit,
            foodLogToday: userData.foodLogToday,
            weight: userData.weight
        };
        const analysis = (typeof analyzeSensation === 'function')
            ? analyzeSensation(type, userInput, ctx)
            : `Sensación registrada: "${userInput}".`;

        if (out) {
            out.style.display = 'block';
            out.innerHTML = analysis.replace(/\n/g, '<br>');
            out.style.color = 'var(--text-primary)';
        }
    };

    // (applySettings duplicado eliminado — la versión completa está en la línea 108)

    themeBtns.forEach(btn => {
        btn.onclick = () => {
            const theme = btn.dataset.theme;
            userData.theme = theme;
            applySettings();
            // Destruir gráficas previas para que se recreen con el color del tema
            try { if (chartWeight) { chartWeight.destroy(); chartWeight = null; } } catch(_){}
            try { if (chartCalories) { chartCalories.destroy(); chartCalories = null; } } catch(_){}
            try { if (chartWaist) { chartWaist.destroy(); chartWaist = null; } } catch(_){}
            try { if (chartHistory) { chartHistory.destroy(); chartHistory = null; } } catch(_){}
            updateDashboard();
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

    let studioState = {
        tpl: 'neon', fmt: 'story', metrics: ['deficit','weight','waist'],
        textColor: 'theme', textSize: 1.0,
        accentColor: 'neon',       // neon | cyan | gold | blood | fuchsia
        hudStyle: 'tech-corners',  // (legacy)
        fontStyle: 'bold-impact',  // bold-impact | tech-mono | elegant-sans
        overlayFilter: 'clear',    // clear | glitch | grain | vignette
        cardStyle: 'hud-tactical', // hud-tactical | carbon-elite | data-panel | editorial | split-hero | nordic-dark
        heroMetric: 'deficit'      // métrica principal (número grande)
    };

    const STUDIO_BG_IMAGES = {};
    let isStudioPreloading = false;
    let STUDIO_LOGO_IMG = null;

    let _studioLoadPromise = null;

    async function preloadStudioImages() {
        if (Object.keys(STUDIO_BG_IMAGES).length > 0 && STUDIO_LOGO_IMG) return;
        if (_studioLoadPromise) return _studioLoadPromise;

        _studioLoadPromise = (async () => {
            // Carga del logo
            await new Promise((r) => {
                const l = new Image(); l.crossOrigin = 'anonymous';
                l.onload = () => { STUDIO_LOGO_IMG = l; _studioTryRedraw(); r(); };
                l.onerror = () => { r(); };
                l.src = 'logo.png';
            });
            // Carga paralela de fondos — cada imagen redibuja al cargar
            await Promise.all(STUDIO_TEMPLATES.map(tpl => new Promise((r) => {
                const img = new Image();
                img.crossOrigin = 'anonymous';
                img.onload = () => { STUDIO_BG_IMAGES[tpl.id] = img; _studioTryRedraw(tpl.id); r(); };
                img.onerror = () => { r(); };
                img.src = tpl.bg;
            })));
        })();

        return _studioLoadPromise;
    }

    // Redibujar la preview cuando una imagen carga en background
    let _studioRedrawTimer = null;
    function _studioTryRedraw(tplId) {
        // 1. Redibujar la vista previa grande con debounce (evita freezear si cargan 19 juntas)
        const canvas = document.getElementById('studio-preview-canvas');
        if (canvas) {
            clearTimeout(_studioRedrawTimer);
            _studioRedrawTimer = setTimeout(() => {
                renderStudioCard(canvas, studioState.tpl, studioState.fmt, studioState.metrics, true);
            }, 100);
        }
        // 2. Redibujar el thumbnail (miniatura) si ya existe en el DOM
        if (tplId) {
            const mini = document.getElementById('studio-mini-' + tplId);
            if (mini) {
                const tplDef = STUDIO_TEMPLATES.find(t => t.id === tplId);
                if (tplDef) drawStudioBg(mini.getContext('2d'), 100, 140, tplDef);
            }
        }
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
        let tpl = STUDIO_TEMPLATES.find(t => t.id === tplId);
        if (tplId === 'custom') tpl = { id:'custom', colors:['#fff','#111','#00e5ff','#000'] };
        else if (!tpl) tpl = STUDIO_TEMPLATES[0];
        const fmt = STUDIO_FORMATS.find(f => f.id === fmtId) || STUDIO_FORMATS[0];
        const W = fmt.w, H = fmt.h, isL = fmtId === 'landscape';
        canvas.width = W; canvas.height = H;
        const ctx = canvas.getContext('2d');
        const cx = W / 2, pad = Math.floor(W * 0.065);

        // ─── ACCENT ──────────────────────────────────────────────────────────
        const APAL = { neon:'#00e5ff', cyan:'#00ffcc', gold:'#ffd700', blood:'#ff2222', fuchsia:'#ff00e5' };
        const TACC = { hielo:'#0099cc',carbono:'#d4af37',neon:'#00e5ff',fuego:'#ffcc00',blood:'#ff3333',
            militar:'#8aff7a',custom:'#00e5ff',fem1:'#ffcccc',fem2:'#d4a0a8',fem3:'#ffb347',
            fem4:'#00ced1',gay_m1:'#ff00ff',gay_m2:'#add8e6',gay_m3:'#ffd700',
            gay_f1:'#ff4500',gay_f2:'#8a2be2',gay_f3:'#8fbc8f' };
        const accent = studioState.accentColor === 'theme'
            ? (TACC[tpl.id] || '#8aff7a') : (APAL[studioState.accentColor] || '#00e5ff');

        // ─── FONT ────────────────────────────────────────────────────────────
        const FM = {
            'bold-impact':  { fam:"Impact,'Arial Narrow',sans-serif", wt:'900', itl:false },
            'tech-mono':    { fam:"'Courier New',Courier,monospace",  wt:'700', itl:false },
            'elegant-sans': { fam:"'Trebuchet MS',Arial,sans-serif",  wt:'600', itl:true  }
        };
        const fd = FM[studioState.fontStyle] || FM['bold-impact'];
        const fi = fd.itl ? 'italic ' : '';
        const tS = Math.max(0.5, Math.min(2.5, studioState.textSize));
        const cc = studioState.textColor === 'theme' ? '#ffffff' : studioState.textColor;
        const isAuto = studioState.textColor === 'theme';

        // ─── METRICS & DATA ───────────────────────────────────────────────────
        const allM  = STUDIO_METRICS.filter(m => activeMetrics.includes(m.key));
        const heroK = studioState.heroMetric || activeMetrics[0] || 'deficit';
        const heroM = allM.find(m => m.key === heroK) || allM[0];
        const secM  = allM.filter(m => m !== heroM).slice(0, isL ? 5 : 3);
        const name  = (userData.username || 'ATLETA').toUpperCase();
        const weeks = Math.min(8, Math.max(1, Math.ceil(((userData.history||[]).length)/7)||1));
        const PHRASES = ["La disciplina paga.","Deficit achieved.",`Week ${weeks} complete.`,
                         "No excuses, only results.","Powering your biology.","Results don't lie."];
        const phrase = PHRASES[(weeks + allM.length) % PHRASES.length];
        const ICONS = { deficit:'🔥',weight:'⚖️',waist:'📏',bicep:'💪',chest:'🏋️',leg:'🦵',hip:'🎯',back:'🔩' };

        // ─── HELPERS ─────────────────────────────────────────────────────────
        const ac = (a) => {
            const r=parseInt(accent.slice(1,3),16),g=parseInt(accent.slice(3,5),16),b=parseInt(accent.slice(5,7),16);
            return `rgba(${r},${g},${b},${a})`;
        };
        const gradH = (x1,x2,a0=0,a1=1) => {
            const g=ctx.createLinearGradient(x1,0,x2,0);
            g.addColorStop(0,ac(a0)); g.addColorStop(0.5,ac(a1)); g.addColorStop(1,ac(a0)); return g;
        };
        const autoText = (txt,x,y,sz) => {
            ctx.font=`${fi}${fd.wt} ${sz}px ${fd.fam}`; ctx.textAlign='center';
            if (isAuto) {
                ctx.fillStyle=accent; ctx.shadowColor=accent; ctx.shadowBlur=38; ctx.globalCompositeOperation='screen';
                ctx.fillText(txt,x,y); ctx.globalCompositeOperation='source-over'; ctx.shadowBlur=0;
                ctx.fillStyle='#fff'; ctx.shadowColor='rgba(0,0,0,0.95)'; ctx.shadowBlur=12;
                ctx.fillText(txt,x,y); ctx.shadowBlur=0;
            } else {
                ctx.fillStyle=cc; ctx.shadowColor='rgba(0,0,0,0.9)'; ctx.shadowBlur=14;
                ctx.fillText(txt,x,y); ctx.shadowBlur=0;
            }
        };
        const weekBar = (y) => {
            const bW=W-pad*2, sW=bW/8, gap=sW*0.1;
            for(let i=0;i<8;i++){
                const bx=pad+i*sW, done=i<weeks, last=i===weeks-1, h=last?14:10;
                ctx.beginPath(); if(ctx.roundRect) ctx.roundRect(bx,y,sW-gap,h,2); else ctx.rect(bx,y,sW-gap,h);
                ctx.fillStyle=done?accent:ac(0.08); ctx.fill();
                if(last){ctx.fillStyle='rgba(255,255,255,0.2)';ctx.fill();}
                ctx.font=`700 ${Math.floor(9*tS)}px Arial`; ctx.textAlign='center';
                ctx.fillStyle=done?ac(0.7):ac(0.2);
                ctx.fillText(`S${i+1}`,bx+(sW-gap)/2,y+h+13);
            }
        };
        const radar = (rcx,rcy,rMax) => {
            ctx.save();
            [rMax,rMax*.72,rMax*.44,rMax*.22].forEach((r,i)=>{
                ctx.beginPath(); ctx.arc(rcx,rcy,r,0,Math.PI*2);
                ctx.strokeStyle=ac(.07+i*.02); ctx.lineWidth=0.8; ctx.stroke();
            });
            ctx.beginPath(); ctx.arc(rcx,rcy,5,0,Math.PI*2); ctx.fillStyle=ac(0.5); ctx.fill();
            ctx.restore();
        };
        const footer = (fy) => {
            ctx.fillStyle='#181818'; ctx.fillRect(pad,fy-20,W-pad*2,1);
            ctx.font=`700 ${Math.floor(10*tS)}px ${fd.fam}`; ctx.textAlign='start';
            ctx.fillStyle=accent; ctx.shadowColor=accent; ctx.shadowBlur=6;
            ctx.fillText('AX-CORE BY ARTHUR',pad,fy); ctx.shadowBlur=0;
            ctx.textAlign='end'; ctx.fillStyle='#2a2a2a';
            ctx.fillText('MÉXICO · 2025',W-pad,fy);
            [0,10,20].forEach((dx,i)=>{
                ctx.beginPath(); ctx.arc(pad+dx,fy+16,2.5,0,Math.PI*2);
                ctx.fillStyle=ac(0.8-i*0.3); ctx.fill();
            });
            ctx.fillStyle=accent; ctx.fillRect(0,H-8,W,8);
            ctx.fillStyle='rgba(255,255,255,0.2)'; ctx.fillRect(0,H-8,W*.3,8);
        };
        const grid = () => {
            ctx.save(); ctx.lineWidth=0.4; ctx.strokeStyle=ac(0.055);
            for(let x=0;x<=W;x+=W/6){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,H);ctx.stroke();}
            for(let y=0;y<=H;y+=H/10){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke();}
            ctx.restore();
        };
        const secBoxes = (y, mArr) => {
            const n=Math.max(mArr.length,1), cW=(W-pad*2)/n;
            mArr.forEach((m,i)=>{
                const bx=pad+i*cW;
                ctx.fillStyle='rgba(8,10,18,0.75)';
                ctx.beginPath(); if(ctx.roundRect) ctx.roundRect(bx,y,cW-8,Math.floor(95*tS),5); else ctx.rect(bx,y,cW-8,Math.floor(95*tS));
                ctx.fill(); ctx.fillStyle=ac(0.7); ctx.fillRect(bx,y,cW-8,2);
                const mx=bx+(cW-8)/2;
                ctx.font=`700 ${Math.floor(10*tS)}px ${fd.fam}`; ctx.textAlign='center'; ctx.fillStyle='#444';
                ctx.fillText(m.label.toUpperCase(),mx,y+18);
                ctx.font=`${fi}${fd.wt} ${Math.floor(28*tS)}px ${fd.fam}`; ctx.fillStyle='#fff';
                ctx.shadowColor='rgba(0,0,0,0.9)'; ctx.shadowBlur=8;
                ctx.fillText(m.val(),mx,y+Math.floor(52*tS)); ctx.shadowBlur=0;
                ctx.font=`700 ${Math.floor(10*tS)}px ${fd.fam}`; ctx.fillStyle=accent;
                ctx.fillText(m.key==='deficit'?'kcal total':m.key==='weight'?'kg actual':'cm',mx,y+Math.floor(68*tS));
            });
        };
        const secCols = (y, mArr) => {
            const n=Math.max(mArr.length,1), cW=(W-pad*2)/n;
            mArr.forEach((m,i)=>{
                const mx=pad+i*cW+cW/2;
                ctx.font=`700 ${Math.floor(10*tS)}px ${fd.fam}`; ctx.textAlign='center'; ctx.fillStyle='#4a5060';
                ctx.fillText(m.label.toUpperCase(),mx,y);
                ctx.font=`${fi}${fd.wt} ${Math.floor(30*tS)}px ${fd.fam}`; ctx.fillStyle='#fff';
                ctx.shadowColor='rgba(0,0,0,0.85)'; ctx.shadowBlur=8;
                ctx.fillText(m.val(),mx,y+Math.floor(36*tS)); ctx.shadowBlur=0;
                ctx.font=`700 ${Math.floor(10*tS)}px ${fd.fam}`; ctx.fillStyle=accent;
                ctx.fillText(m.key==='deficit'?'kcal':m.key==='weight'?'kg':'cm',mx,y+Math.floor(50*tS));
                if(i<mArr.length-1){ctx.strokeStyle='#1e2228';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(pad+i*cW+cW-12,y-8);ctx.lineTo(pad+i*cW+cW-12,y+Math.floor(62*tS));ctx.stroke();}
            });
        };
        const progressZone = (y) => {
            ctx.strokeStyle='#1c1c1c'; ctx.lineWidth=1;
            ctx.beginPath(); ctx.moveTo(pad,y); ctx.lineTo(W-pad,y); ctx.stroke();
            ctx.font=`700 ${Math.floor(10*tS)}px ${fd.fam}`; ctx.textAlign='start'; ctx.fillStyle='#3a3a3a';
            ctx.fillText('PROGRESO — 8 SEMANAS',pad,y+18);
            weekBar(y+26);
        };
        const lowerZone = (y) => {
            ctx.fillStyle='rgba(0,0,0,0.48)'; ctx.fillRect(0,y,W,H-y-8);
            radar(W*0.82,H*0.89,W*0.24);
            ctx.font=`900 ${Math.floor(68*tS)}px 'Arial Black',Arial,sans-serif`;
            ctx.textAlign='start'; ctx.fillStyle='rgba(255,255,255,0.05)';
            ctx.fillText('AX-CORE',pad,y+H*0.065);
            ctx.font=`700 ${Math.floor(10*tS)}px ${fd.fam}`; ctx.fillStyle='#333';
            ctx.fillText('SISTEMA DE CONTROL',pad,H*0.884);
            ctx.fillText('PESO · RENDIMIENTO · DISCIPLINA',pad,H*0.908);
        };

        // ── BACKGROUND + BASE OVERLAY ─────────────────────────────────────────
        drawStudioBg(ctx, W, H, tpl);
        const ov=ctx.createLinearGradient(0,0,0,H);
        ov.addColorStop(0,'rgba(0,0,0,0.28)'); ov.addColorStop(.45,'rgba(0,0,0,0.55)'); ov.addColorStop(1,'rgba(0,0,0,0.90)');
        ctx.fillStyle=ov; ctx.fillRect(0,0,W,H);

        // ── CARD STYLE ────────────────────────────────────────────────────────
        const style = studioState.cardStyle || 'hud-tactical';

        if (style === 'hud-tactical') {
            // SVG1-INSPIRED: left bar + tech grid + week badges + metric boxes + progress bar
            grid();
            ctx.fillStyle=accent; ctx.fillRect(0,0,6,H);
            ctx.fillStyle=ac(0.25); ctx.fillRect(7.5,0,1.5,H);
            const halo=ctx.createLinearGradient(0,0,W,0); halo.addColorStop(0,ac(0.08)); halo.addColorStop(1,ac(0));
            ctx.fillStyle=halo; ctx.fillRect(0,150,W,200);
            ctx.fillStyle=gradH(0,W*.6,0,0.5); ctx.fillRect(0,153,W*.6,1.5);
            // Week badges
            ctx.beginPath(); if(ctx.roundRect) ctx.roundRect(pad,38,116,26,4); else ctx.rect(pad,38,116,26);
            ctx.fillStyle=accent; ctx.fill();
            ctx.font=`700 ${Math.floor(11*tS)}px ${fd.fam}`; ctx.textAlign='center'; ctx.fillStyle='#040a0a';
            ctx.fillText(`WEEK ${String(weeks).padStart(2,'0')}`,pad+58,56);
            ctx.beginPath(); if(ctx.roundRect) ctx.roundRect(pad+124,38,130,26,4); else ctx.rect(pad+124,38,130,26);
            ctx.strokeStyle=accent; ctx.lineWidth=1; ctx.stroke();
            ctx.fillStyle=accent; ctx.fillText('COMPLETADO',pad+189,56);
            // Name
            ctx.font=`${fi}700 ${Math.floor(17*tS)}px ${fd.fam}`; ctx.textAlign='start'; ctx.fillStyle='#cccccc';
            ctx.fillText(name,pad,100); ctx.fillStyle=accent; ctx.fillRect(pad,106,Math.min(name.length*9*tS,200),2);
            // Hero label + value
            ctx.font=`700 ${Math.floor(10*tS)}px ${fd.fam}`; ctx.fillStyle=ac(0.85);
            ctx.fillText(heroM?heroM.label.toUpperCase():'MÉTRICA',pad,138);
            const hSz=Math.floor((isL?82:112)*tS);
            ctx.font=`${fi}${fd.wt} ${hSz}px ${fd.fam}`; ctx.textAlign='start';
            ctx.fillStyle='#fff'; ctx.shadowColor='rgba(0,0,0,0.9)'; ctx.shadowBlur=14;
            ctx.fillText(heroM?heroM.val():'—',pad,Math.floor(280*tS)); ctx.shadowBlur=0;
            const sep1Y=Math.floor(280*tS)+26;
            ctx.fillStyle=ac(0.4); ctx.fillRect(pad,sep1Y,W-pad*2,1);
            ctx.fillStyle='#111'; ctx.fillRect(pad,sep1Y+1,W-pad*2,1);
            // Phrase
            ctx.font=`italic 300 ${Math.floor(17*tS)}px 'Trebuchet MS',Arial,sans-serif`;
            ctx.textAlign='start'; ctx.fillStyle='#888';
            ctx.fillText(`"${phrase}"`,pad,sep1Y+52);
            ctx.strokeStyle='#1c1c1c'; ctx.lineWidth=1;
            ctx.beginPath(); ctx.moveTo(pad,sep1Y+72); ctx.lineTo(W-pad,sep1Y+72); ctx.stroke();
            // Secondary metric boxes
            secBoxes(sep1Y+88, secM);
            // Progress
            progressZone(H*0.70);
            lowerZone(H*0.80);
            footer(H-50);

        } else if (style === 'carbon-elite') {
            // IMAGE2-INSPIRED: top/bottom bars + diamond chevron + open columns
            const tg=ctx.createLinearGradient(0,0,W,0);
            tg.addColorStop(0,accent); tg.addColorStop(0.6,ac(1)); tg.addColorStop(1,ac(0.3));
            ctx.fillStyle=tg; ctx.fillRect(0,0,W,4);
            // Side diagonal chevrons
            ctx.save(); ctx.strokeStyle=ac(0.55); ctx.lineWidth=3;
            [20,36,52].forEach(off=>{
                ctx.beginPath(); ctx.moveTo(pad,H*.2+off); ctx.lineTo(pad+44,H*.18+off); ctx.stroke();
                ctx.beginPath(); ctx.moveTo(W-pad,H*.2+off); ctx.lineTo(W-pad-44,H*.18+off); ctx.stroke();
            }); ctx.restore();
            // Name centered
            ctx.font=`${fi}700 ${Math.floor(22*tS)}px ${fd.fam}`; ctx.textAlign='center'; ctx.fillStyle='#fff';
            ctx.shadowColor='rgba(0,0,0,0.85)'; ctx.shadowBlur=10;
            ctx.fillText(name,cx,68); ctx.shadowBlur=0;
            ctx.fillStyle=ac(0.55); ctx.fillRect(cx-50,74,100,1.5);
            // Diamond shape behind hero
            const dcy=H*.34, dh=H*.28, dw=W*.72;
            ctx.save(); ctx.beginPath();
            ctx.moveTo(cx,dcy-dh/2); ctx.lineTo(cx+dw/2,dcy); ctx.lineTo(cx,dcy+dh/2); ctx.lineTo(cx-dw/2,dcy); ctx.closePath();
            ctx.fillStyle=ac(0.055); ctx.fill(); ctx.strokeStyle=ac(0.32); ctx.lineWidth=2; ctx.stroke();
            // Inner chevrons
            ctx.strokeStyle=ac(0.22); ctx.lineWidth=1.5;
            [-60,-30,0].forEach(off=>{
                ctx.beginPath(); ctx.moveTo(cx-W*.25,dcy+off+28); ctx.lineTo(cx,dcy+off); ctx.lineTo(cx+W*.25,dcy+off+28); ctx.stroke();
            }); ctx.restore();
            // Hero value (centered in diamond)
            const hSz2=Math.floor((isL?80:118)*tS);
            ctx.font=`700 ${Math.floor(10*tS)}px ${fd.fam}`; ctx.fillStyle=ac(0.75); ctx.textAlign='center';
            ctx.fillText(heroM?heroM.label.toUpperCase():'MÉTRICA',cx,dcy-hSz2*.55);
            autoText(heroM?heroM.val():'—',cx,dcy+hSz2*.42,hSz2);
            // Separator
            const sep2Y=dcy+dh/2+28;
            ctx.fillStyle=gradH(pad,W-pad,0,0.4); ctx.fillRect(pad,sep2Y,W-pad*2,2);
            // Secondary cols (open)
            secCols(sep2Y+36, secM);
            const sm2bot=sep2Y+Math.floor(80*tS);
            // Phrase
            ctx.font=`italic 300 ${Math.floor(16*tS)}px 'Trebuchet MS',Arial,sans-serif`;
            ctx.textAlign='center'; ctx.fillStyle='#666';
            ctx.fillText(`"${phrase}"`,cx,sm2bot+22);
            progressZone(sm2bot+42);
            footer(H-50);

        } else if (style === 'data-panel') {
            // IMAGE3-INSPIRED: big icon panels + centered hero
            const tg3=ctx.createLinearGradient(0,0,W,0);
            tg3.addColorStop(0,ac(0)); tg3.addColorStop(0.5,accent); tg3.addColorStop(1,ac(0));
            ctx.fillStyle=tg3; ctx.fillRect(0,0,W,4);
            ctx.font=`${fi}700 ${Math.floor(20*tS)}px ${fd.fam}`; ctx.textAlign='center'; ctx.fillStyle='#ccc';
            ctx.fillText(name,cx,58); ctx.fillStyle=gradH(cx-60,cx+60,0,0.6); ctx.fillRect(cx-60,64,120,1.5);
            // Hero
            ctx.font=`700 ${Math.floor(10*tS)}px ${fd.fam}`; ctx.fillStyle=ac(0.8); ctx.textAlign='center';
            ctx.fillText(heroM?heroM.label.toUpperCase():'MÉTRICA',cx,96);
            const hSz3=Math.floor((isL?78:122)*tS);
            autoText(heroM?heroM.val():'—',cx,96+hSz3,hSz3);
            const ph3Y=96+hSz3*1.12+28;
            ctx.font=`italic 300 ${Math.floor(15*tS)}px 'Trebuchet MS',Arial,sans-serif`;
            ctx.textAlign='center'; ctx.fillStyle=isAuto?accent:'#aaa';
            ctx.fillText(`"${phrase}"`,cx,ph3Y);
            ctx.fillStyle=gradH(pad,W-pad,0,0.35); ctx.fillRect(pad,ph3Y+16,W-pad*2,2);
            // Large icon panels
            const panY=ph3Y+34, nP=Math.min(secM.length,3);
            const panW=(W-pad*2-(nP-1)*12)/Math.max(nP,1), panH=Math.floor(118*tS);
            secM.slice(0,nP).forEach((m,i)=>{
                const bx=pad+i*(panW+12), pcx=bx+panW/2;
                ctx.fillStyle='rgba(8,12,22,0.72)';
                ctx.beginPath(); if(ctx.roundRect) ctx.roundRect(bx,panY,panW,panH,12); else ctx.rect(bx,panY,panW,panH);
                ctx.fill(); ctx.strokeStyle=ac(0.45); ctx.lineWidth=1.5; ctx.stroke();
                ctx.fillStyle=accent; ctx.fillRect(bx+12,panY,panW-24,2);
                ctx.font=`${Math.floor(22*tS)}px sans-serif`; ctx.textAlign='center';
                ctx.fillText(ICONS[m.key]||'📊',pcx,panY+Math.floor(34*tS));
                ctx.font=`${fi}${fd.wt} ${Math.floor(36*tS)}px ${fd.fam}`; ctx.fillStyle='#fff';
                ctx.shadowColor='rgba(0,0,0,0.9)'; ctx.shadowBlur=8;
                ctx.fillText(m.val(),pcx,panY+Math.floor(76*tS)); ctx.shadowBlur=0;
                ctx.font=`700 ${Math.floor(10*tS)}px ${fd.fam}`; ctx.fillStyle=accent;
                ctx.fillText(m.label.toUpperCase(),pcx,panY+Math.floor(92*tS));
            });
            progressZone(panY+panH+28);
            radar(W*.8,H*.87,W*.22);
            ctx.font=`900 ${Math.floor(66*tS)}px 'Arial Black',Arial,sans-serif`;
            ctx.textAlign='center'; ctx.fillStyle='rgba(255,255,255,0.04)';
            ctx.fillText('AX-CORE',cx,H*.88);
            footer(H-50);

        } else if (style === 'editorial') {
            // SVG2-INSPIRED: left thin bar + week badge top-right + open columns
            ctx.fillStyle=accent; ctx.fillRect(pad-12,80,3,H*.6);
            const wbW=144, wbH=54;
            ctx.beginPath(); if(ctx.roundRect) ctx.roundRect(W-pad-wbW,32,wbW,wbH,4); else ctx.rect(W-pad-wbW,32,wbW,wbH);
            ctx.strokeStyle=accent; ctx.lineWidth=1; ctx.stroke();
            ctx.font=`900 ${Math.floor(11*tS)}px ${fd.fam}`; ctx.textAlign='center'; ctx.fillStyle=accent;
            ctx.fillText('WEEK',W-pad-wbW/2,52);
            ctx.font=`900 ${Math.floor(22*tS)}px ${fd.fam}`;
            ctx.fillText(String(weeks).padStart(2,'0'),W-pad-wbW/2,76);
            ctx.font=`700 ${Math.floor(13*tS)}px ${fd.fam}`; ctx.textAlign='start'; ctx.fillStyle='#888';
            ctx.fillText(name,pad,56);
            ctx.strokeStyle=accent; ctx.lineWidth=0.5; ctx.setLineDash([3,6]);
            ctx.beginPath(); ctx.moveTo(pad,62); ctx.lineTo(W-pad-wbW-20,62); ctx.stroke(); ctx.setLineDash([]);
            ctx.font=`700 ${Math.floor(10*tS)}px ${fd.fam}`; ctx.fillStyle=ac(0.7);
            ctx.fillText(heroM?heroM.label.toUpperCase():'MÉTRICA',pad,108);
            const hSz4=Math.floor((isL?78:110)*tS);
            ctx.font=`${fi}${fd.wt} ${hSz4}px ${fd.fam}`; ctx.textAlign='start';
            ctx.fillStyle='#fff'; ctx.shadowColor='rgba(0,0,0,0.9)'; ctx.shadowBlur=12;
            ctx.fillText(heroM?heroM.val():'—',pad,108+hSz4); ctx.shadowBlur=0;
            const hy4=108+hSz4;
            ctx.fillStyle=gradH(pad,W-pad*3,0,0.6); ctx.fillRect(pad,hy4+20,W-pad*3,2);
            ctx.fillStyle='rgba(255,255,255,0.06)'; ctx.fillRect(pad,hy4+22,W-pad*3,1);
            ctx.font=`italic 400 ${Math.floor(17*tS)}px Georgia,serif`; ctx.textAlign='start'; ctx.fillStyle='#666';
            ctx.fillText(`"${phrase}"`,pad,hy4+58);
            ctx.strokeStyle='#1e1e1e'; ctx.lineWidth=1;
            ctx.beginPath(); ctx.moveTo(pad,hy4+78); ctx.lineTo(W-pad,hy4+78); ctx.stroke();
            secCols(hy4+102, secM);
            progressZone(hy4+Math.floor(170*tS));
            // Lower zone editorial
            const lz4=H*.78; ctx.fillStyle='rgba(0,0,0,0.5)'; ctx.fillRect(0,lz4,W,H-lz4-6);
            radar(cx,H*.875,W*.2);
            ctx.save(); ctx.strokeStyle=ac(0.06); ctx.lineWidth=0.5;
            ctx.beginPath(); ctx.moveTo(cx,lz4+8); ctx.lineTo(cx,H-10); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(pad,H*.875); ctx.lineTo(W-pad,H*.875); ctx.stroke();
            ctx.restore();
            ctx.font=`900 ${Math.floor(68*tS)}px 'Arial Black',Arial,sans-serif`;
            ctx.textAlign='start'; ctx.fillStyle='rgba(255,255,255,0.04)';
            ctx.fillText('AX-CORE',pad,lz4+H*.055);
            ctx.font=`700 ${Math.floor(10*tS)}px ${fd.fam}`; ctx.fillStyle='#2c3038';
            ctx.fillText('CONTROL · PESO · RENDIMIENTO',pad,H*.9);
            footer(H-50);

        } else if (style === 'split-hero') {
            // SPLIT: Left = giant hero, Right = stacked metrics
            const splitX=W*.5;
            ctx.fillStyle='rgba(0,0,0,0.22)'; ctx.fillRect(0,0,splitX,H);
            ctx.fillStyle=ac(0.28); ctx.fillRect(splitX-1.5,50,2,H-100);
            ctx.font=`${fi}700 ${Math.floor(13*tS)}px ${fd.fam}`; ctx.textAlign='start'; ctx.fillStyle='#888';
            ctx.fillText(name,pad,56); ctx.fillStyle=accent; ctx.fillRect(pad,62,80,1.5);
            ctx.save(); ctx.translate(pad+14,H*.5); ctx.rotate(-Math.PI/2);
            ctx.font=`700 ${Math.floor(10*tS)}px ${fd.fam}`; ctx.textAlign='center'; ctx.fillStyle=ac(0.5);
            ctx.fillText(heroM?heroM.label.toUpperCase():'RESULTADO',0,0); ctx.restore();
            const hcx=splitX*.5+pad/2, hSz5=Math.floor((isL?70:108)*tS);
            autoText(heroM?heroM.val():'—',hcx,H*.52,hSz5);
            ctx.font=`italic 300 ${Math.floor(14*tS)}px 'Trebuchet MS',Arial,sans-serif`;
            ctx.textAlign='center'; ctx.fillStyle='#555';
            ctx.fillText(`"${phrase}"`,hcx,H*.66);
            const rx=splitX+pad, rw=W-splitX-pad;
            ctx.beginPath(); if(ctx.roundRect) ctx.roundRect(rx,40,rw-pad,32,4); else ctx.rect(rx,40,rw-pad,32);
            ctx.fillStyle=accent; ctx.fill();
            ctx.font=`700 ${Math.floor(12*tS)}px ${fd.fam}`; ctx.textAlign='center'; ctx.fillStyle='#000';
            ctx.fillText(`WEEK ${String(weeks).padStart(2,'0')} ✓`,rx+(rw-pad)/2,61);
            const sm5Y=96, sm5H=Math.floor((H*.65)/Math.max(secM.length,1));
            secM.forEach((m,i)=>{
                const my5=sm5Y+i*sm5H;
                ctx.font=`700 ${Math.floor(10*tS)}px ${fd.fam}`; ctx.textAlign='start'; ctx.fillStyle='#444';
                ctx.fillText(m.label.toUpperCase(),rx,my5);
                ctx.font=`${fi}${fd.wt} ${Math.floor(32*tS)}px ${fd.fam}`; ctx.fillStyle='#fff';
                ctx.shadowColor='rgba(0,0,0,0.9)'; ctx.shadowBlur=8;
                ctx.fillText(m.val(),rx,my5+Math.floor(36*tS)); ctx.shadowBlur=0;
                ctx.font=`700 ${Math.floor(10*tS)}px ${fd.fam}`; ctx.fillStyle=accent;
                ctx.fillText(m.key==='deficit'?'kcal':m.key==='weight'?'kg':'cm',rx,my5+Math.floor(50*tS));
                if(i<secM.length-1){ctx.strokeStyle='#2a2a2a';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(rx,my5+sm5H-10);ctx.lineTo(W-pad,my5+sm5H-10);ctx.stroke();}
            });
            progressZone(H*.72);
            radar(W*.82,H*.89,W*.2);
            footer(H-50);

        } else {
            // NORDIC DARK: Ultra minimal — typography dominates, no frame decoration
            ctx.fillStyle=gradH(0,W,0,1); ctx.fillRect(0,0,W,3);
            ctx.font=`${fi}700 ${Math.floor(16*tS)}px ${fd.fam}`; ctx.textAlign='center'; ctx.fillStyle='#777';
            ctx.fillText(name,cx,68); ctx.fillStyle=gradH(cx-40,cx+40,0,0.5); ctx.fillRect(cx-40,74,80,1);
            ctx.font=`700 ${Math.floor(10*tS)}px ${fd.fam}`; ctx.fillStyle=ac(0.6);
            ctx.fillText(`SEMANA ${weeks} DE 8`,cx,90);
            ctx.font=`700 ${Math.floor(10*tS)}px ${fd.fam}`; ctx.fillStyle=ac(0.72); ctx.textAlign='center';
            ctx.fillText(heroM?heroM.label.toUpperCase():'MÉTRICA',cx,118);
            const hSz6=Math.floor((isL?85:132)*tS);
            autoText(heroM?heroM.val():'—',cx,118+hSz6,hSz6);
            const hy6=118+hSz6;
            ctx.fillStyle=gradH(cx-W*.3,cx+W*.3,0,0.4); ctx.fillRect(cx-W*.3,hy6+26,W*.6,2);
            ctx.font=`italic 300 ${Math.floor(16*tS)}px Georgia,serif`; ctx.textAlign='center'; ctx.fillStyle='#5a5a5a';
            ctx.fillText(`"${phrase}"`,cx,hy6+58);
            ctx.strokeStyle='#1a1a1a'; ctx.lineWidth=1;
            ctx.beginPath(); ctx.moveTo(pad,hy6+76); ctx.lineTo(W-pad,hy6+76); ctx.stroke();
            secCols(hy6+102, secM);
            progressZone(hy6+Math.floor(178*tS));
            const lz6=H*.78; ctx.fillStyle='rgba(0,0,0,0.5)'; ctx.fillRect(0,lz6,W,H-lz6-6);
            radar(cx,H*.875,W*.2);
            ctx.font=`900 ${Math.floor(66*tS)}px 'Arial Black',Arial,sans-serif`;
            ctx.textAlign='center'; ctx.fillStyle='rgba(255,255,255,0.04)';
            ctx.fillText('AX-CORE',cx,H*.88+28);
            footer(H-50);
        }

        // ── OVERLAY FILTER (always last) ──────────────────────────────────────
        const filter = studioState.overlayFilter || 'clear';
        if (filter === 'vignette') {
            const vg=ctx.createRadialGradient(cx,H/2,H*.28,cx,H/2,H*.72);
            vg.addColorStop(0,'rgba(0,0,0,0)'); vg.addColorStop(1,'rgba(0,0,0,0.70)');
            ctx.fillStyle=vg; ctx.fillRect(0,0,W,H);
        } else if (filter === 'grain') {
            ctx.save();
            for(let yy=0;yy<H;yy+=2){ctx.fillStyle=`rgba(255,255,255,${Math.random()*.035})`;ctx.fillRect(0,yy,W,1);}
            ctx.restore();
        } else if (filter === 'glitch') {
            ctx.save(); ctx.lineWidth=1; ctx.strokeStyle='rgba(0,0,0,0.18)';
            for(let yy=0;yy<H;yy+=4){ctx.beginPath();ctx.moveTo(0,yy);ctx.lineTo(W,yy);ctx.stroke();}
            for(let i=0;i<6;i++){ctx.fillStyle=(i%2===0?accent:'#ff2222')+'2a';ctx.fillRect(0,Math.random()*H,W,Math.random()*5+1);}
            ctx.restore();
        }
    }

    async function renderStudioPage() {
        const el = document.getElementById('page-studio');
        if (!el) return;

        // Cargar imágenes en segundo plano SIN bloquear la interfaz
        preloadStudioImages();

        // Renderizar medallas primero, luego el studio
        const earned = new Set(userData.achievements || []);
        const earnedCount = [...earned].filter(id => ACHIEVEMENTS_DEF.find(a => a.id === id)).length;
        el.innerHTML = `
            <style>
                #studio-split { display:flex; gap:14px; align-items:flex-start; }
                #studio-controls { flex:1; min-width:0; }
                #studio-sticky-panel {
                    width:240px; flex-shrink:0;
                    position:sticky; top:60px;
                    display:flex; flex-direction:column; gap:10px;
                }
                @media (max-width:680px) {
                    #studio-split { flex-direction:column; }
                    #studio-sticky-panel {
                        order:-1;
                        position:sticky; top:0; width:100%; z-index:10;
                        background:var(--bg-dark,#0a0a0a);
                        padding:6px 0 10px;
                        border-bottom:1px solid rgba(255,255,255,0.08);
                    }
                    #studio-sticky-panel .studio-preview-wrap canvas { max-height:44vw; }
                }
            </style>

            <div class="glass-card" style="padding:1rem 1.2rem; margin-bottom:1rem;">
                <h2 style="color:var(--accent-main); margin-bottom:0.3rem; font-size:1.1rem;">🎖 MIS INSIGNIAS</h2>
                <p style="font-size:0.70rem; color:var(--text-dim); margin-bottom:0.8rem;">${earnedCount} de ${ACHIEVEMENTS_DEF.length} desbloqueadas</p>
                <div id="achievements-panel" style="display:grid; grid-template-columns:repeat(auto-fill, minmax(80px,1fr)); gap:8px;"></div>
            </div>

            <div class="glass-card studio-pro" style="padding:0; margin-bottom:1rem; overflow:hidden;">

                <!-- HEADER -->
                <div class="studio-pro-header">
                    <h2>🏆 ESTUDIO DE LOGROS</h2>
                </div>

                <!-- PREVIEW EN VIVO -->
                <div class="studio-pro-preview">
                    <span class="studio-pro-eyebrow">VISTA PREVIA EN VIVO</span>
                    <div class="studio-preview-wrap">
                        <canvas id="studio-preview-canvas"></canvas>
                    </div>
                    <button class="btn-premium" id="btn-studio-share">📤 COMPARTIR HD</button>
                </div>

                <!-- PLANTILLAS (siempre visible) -->
                <div class="studio-pro-section">
                    <div class="studio-pro-label">PLANTILLAS</div>
                    <div class="studio-templates" id="studio-tpl-list"></div>
                </div>

                <!-- FORMATO (siempre visible) -->
                <div class="studio-pro-section">
                    <div class="studio-pro-label">FORMATO</div>
                    <div class="studio-format-btns" id="studio-fmt-btns"></div>
                </div>

                <!-- TABS -->
                <div class="studio-pro-tabs">
                    <button class="studio-pro-tab active" data-stab="diseno">DISEÑO</button>
                    <button class="studio-pro-tab" data-stab="metricas">MÉTRICAS</button>
                    <button class="studio-pro-tab" data-stab="efectos">EFECTOS</button>
                </div>

                <!-- TAB: DISEÑO -->
                <div class="studio-pro-tab-content active" id="stab-diseno">
                    <div class="studio-pro-section">
                        <div class="studio-pro-label">🎨 ESTILO DE TARJETA</div>
                        <div id="studio-card-style-btns" class="studio-pro-pills"></div>
                    </div>
                    <div class="studio-pro-section">
                        <div class="studio-pro-label">ACENTO</div>
                        <div id="studio-accent-btns" class="studio-pro-pills"></div>
                    </div>
                    <div class="studio-pro-section">
                        <div class="studio-pro-label">TIPOGRAFÍA</div>
                        <div id="studio-font-btns" class="studio-pro-pills"></div>
                    </div>
                    <div class="studio-pro-section">
                        <div class="studio-pro-label">COLOR LETRA</div>
                        <div id="studio-color-swatches" class="studio-pro-swatches"></div>
                    </div>
                    <div class="studio-pro-section">
                        <div class="studio-pro-label"><span>TAMAÑO LETRA</span><span class="studio-pro-val" id="studio-size-val">${Math.round(studioState.textSize*100)}%</span></div>
                        <input type="range" id="studio-size-picker" class="studio-pro-slider" min="0.5" max="2.5" step="0.1" value="${studioState.textSize}">
                    </div>
                </div>

                <!-- TAB: MÉTRICAS -->
                <div class="studio-pro-tab-content" id="stab-metricas">
                    <div class="studio-pro-section">
                        <div class="studio-pro-label">MÉTRICAS A MOSTRAR</div>
                        <div class="studio-metrics" id="studio-met-list"></div>
                    </div>
                    <div class="studio-pro-section">
                        <div class="studio-pro-label">⭐ MÉTRICA PRINCIPAL</div>
                        <div id="studio-hero-metric-btns" class="studio-pro-pills"></div>
                    </div>
                </div>

                <!-- TAB: EFECTOS -->
                <div class="studio-pro-tab-content" id="stab-efectos">
                    <div class="studio-pro-section">
                        <div class="studio-pro-label">OVERLAY</div>
                        <div id="studio-filter-btns" class="studio-pro-pills"></div>
                    </div>
                    <div class="studio-pro-section">
                        <div class="studio-pro-label">ESTILO HUD</div>
                        <div id="studio-hud-btns" class="studio-pro-pills"></div>
                    </div>
                </div>

            </div>
        `;

        // Pintar medallas
        if (typeof renderAchievementsPanel === 'function') renderAchievementsPanel();

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
            miniCanvas.id = 'studio-mini-' + tpl.id;
            miniCanvas.width=100; miniCanvas.height=140;
            drawStudioBg(miniCanvas.getContext('2d'), 100, 140, tpl);
            card.appendChild(miniCanvas);
            const label = document.createElement('span');
            label.textContent = tpl.name;
            card.appendChild(label);
            card.onclick = () => {
                studioState.tpl = tpl.id;
                // Actualizar selección visual SIN reconstruir todo el DOM (evita reset de scroll)
                tplList.querySelectorAll('.studio-tpl-card').forEach(c => c.classList.remove('selected'));
                card.classList.add('selected');
                // Solo redibujar el canvas de preview
                const previewCanvas = document.getElementById('studio-preview-canvas');
                if (previewCanvas) renderStudioCard(previewCanvas, studioState.tpl, studioState.fmt, studioState.metrics, true);
            };
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
            { c:'theme',   l:'AUTO', bg:'linear-gradient(45deg,#00ff88,#00d2ff)', glow:true },
            // Blancos y grises
            { c:'#ffffff', bg:'#ffffff' },
            { c:'#d3d3d3', bg:'#d3d3d3' },
            { c:'#808080', bg:'#808080' },
            { c:'#36454F', bg:'#36454F' },
            { c:'#1a1a1a', bg:'#1a1a1a' },
            // NEONES
            { c:'#00e5ff', bg:'#00e5ff',  glow:true },  // Cyan neón
            { c:'#00ffcc', bg:'#00ffcc',  glow:true },  // Aqua neón
            { c:'#39ff14', bg:'#39ff14',  glow:true },  // Verde eléctrico
            { c:'#ccff00', bg:'#ccff00',  glow:true },  // Lima neón
            { c:'#ff073a', bg:'#ff073a',  glow:true },  // Rojo neón sangre
            { c:'#ff00ff', bg:'#ff00ff',  glow:true },  // Magenta neón
            { c:'#ff6ec7', bg:'#ff6ec7',  glow:true },  // Rosa hot neón
            { c:'#ff9500', bg:'#ff9500',  glow:true },  // Ámbar neón
            { c:'#ffd700', bg:'#ffd700',  glow:true },  // Oro neón
            { c:'#04d9ff', bg:'#04d9ff',  glow:true },  // Azul eléctrico
            { c:'#bf5fff', bg:'#bf5fff',  glow:true },  // Violeta neón
            // Vibrantes
            { c:'#ff4400', bg:'#ff4400' },
            { c:'#ff0000', bg:'#ff0000' },
            { c:'#800080', bg:'#800080' },
            { c:'#ffb6c1', bg:'#ffb6c1' },
        ];
        
        palette.forEach(p => {
            const btn = document.createElement('button');
            btn.style.width = '28px'; btn.style.height = '28px';
            btn.style.borderRadius = '7px'; btn.style.cursor = 'pointer';
            btn.style.background = p.bg; btn.style.transition = 'transform .15s, box-shadow .15s';
            if (p.glow) btn.style.boxShadow = `0 0 8px 1px ${p.c === 'theme' ? '#00ff88' : p.c}88`;
            if (p.l) { btn.textContent = p.l; btn.style.fontSize='9px'; btn.style.fontWeight='900'; btn.style.color='#000'; btn.style.width='44px'; }
            if (studioState.textColor === p.c) {
                btn.style.outline = '3px solid var(--accent-main)';
                btn.style.transform = 'scale(1.18)';
            } else {
                btn.style.border = '1px solid rgba(255,255,255,0.18)';
            }
            btn.onclick = () => { studioState.textColor = p.c; renderStudioPage(); };
            swatchesContainer.appendChild(btn);
        });

        const sizePicker = document.getElementById('studio-size-picker');
        const sizeVal = document.getElementById('studio-size-val');
        sizePicker.oninput = (e) => {
            studioState.textSize = parseFloat(e.target.value);
            if (sizeVal) sizeVal.textContent = Math.round(studioState.textSize * 100) + '%';
            renderStudioCard(previewCanvas, studioState.tpl, studioState.fmt, studioState.metrics, true);
        };

        // --- Lógica de TABS del estudio (DISEÑO / MÉTRICAS / EFECTOS) ---
        document.querySelectorAll('.studio-pro-tab').forEach(tab => {
            tab.onclick = () => {
                const target = tab.dataset.stab;
                document.querySelectorAll('.studio-pro-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                document.querySelectorAll('.studio-pro-tab-content').forEach(c => c.classList.remove('active'));
                const content = document.getElementById('stab-' + target);
                if (content) content.classList.add('active');
            };
        });

        // --- Selectores de Estilo Avanzado ---
        const _makeStyleBtns = (containerId, options, stateKey) => {
            const cont = document.getElementById(containerId);
            if (!cont) return;
            const accent_css = 'var(--accent-main)';
            const redraw = () => renderStudioCard(previewCanvas, studioState.tpl, studioState.fmt, studioState.metrics, true);
            const refreshBtns = () => cont.querySelectorAll('.sx-btn').forEach(b => {
                const active = b.dataset.val === studioState[stateKey];
                b.style.background = active ? accent_css : 'rgba(255,255,255,0.06)';
                b.style.color      = active ? '#000' : 'rgba(255,255,255,0.8)';
                b.style.borderColor = active ? accent_css : 'rgba(255,255,255,0.15)';
            });
            options.forEach(opt => {
                const btn = document.createElement('button');
                btn.className = 'sx-btn';
                btn.dataset.val = opt.v;
                btn.textContent = opt.l;
                const isActive = studioState[stateKey] === opt.v;
                btn.style.cssText = `padding:4px 9px; font-size:0.60rem; border-radius:8px; cursor:pointer;
                    border:1px solid ${isActive ? accent_css : 'rgba(255,255,255,0.15)'};
                    background:${isActive ? accent_css : 'rgba(255,255,255,0.06)'};
                    color:${isActive ? '#000' : 'rgba(255,255,255,0.8)'};
                    font-weight:800; letter-spacing:0.5px; transition:all .15s;`;
                if (opt.dot) {
                    const dot = document.createElement('span');
                    dot.style.cssText = `display:inline-block; width:8px; height:8px; border-radius:50%; background:${opt.dot}; margin-right:4px; vertical-align:middle;`;
                    btn.prepend(dot);
                }
                btn.onclick = () => { studioState[stateKey] = opt.v; refreshBtns(); redraw(); };
                cont.appendChild(btn);
            });
        };

        _makeStyleBtns('studio-card-style-btns', [
            { l:'HUD TACTICAL', v:'hud-tactical'  },
            { l:'CARBON ELITE', v:'carbon-elite'  },
            { l:'DATA PANEL',   v:'data-panel'    },
            { l:'EDITORIAL',    v:'editorial'      },
            { l:'SPLIT HERO',   v:'split-hero'    },
            { l:'NORDIC DARK',  v:'nordic-dark'   }
        ], 'cardStyle');

        // Métrica hero: botones dinámicos según métricas activas
        const heroContainer = document.getElementById('studio-hero-metric-btns');
        if (heroContainer) {
            const accent_main = 'var(--accent-main)';
            const refreshHero = () => heroContainer.querySelectorAll('.sx-btn').forEach(b => {
                const active = b.dataset.val === studioState.heroMetric;
                b.style.background = active ? accent_main : 'rgba(255,255,255,0.06)';
                b.style.color      = active ? '#000' : 'rgba(255,255,255,0.8)';
            });
            STUDIO_METRICS.filter(m => studioState.metrics.includes(m.key)).forEach(m => {
                const btn = document.createElement('button');
                btn.className = 'sx-btn'; btn.dataset.val = m.key;
                btn.textContent = m.label;
                const isActive = studioState.heroMetric === m.key;
                btn.style.cssText = `padding:4px 10px; font-size:0.60rem; border-radius:8px; cursor:pointer;
                    border:1px solid rgba(255,255,255,0.15);
                    background:${isActive ? accent_main : 'rgba(255,255,255,0.06)'};
                    color:${isActive ? '#000' : 'rgba(255,255,255,0.8)'};
                    font-weight:800; letter-spacing:0.5px; transition:all .15s;`;
                btn.onclick = () => {
                    studioState.heroMetric = m.key;
                    refreshHero();
                    renderStudioCard(previewCanvas, studioState.tpl, studioState.fmt, studioState.metrics, true);
                };
                heroContainer.appendChild(btn);
            });
        }

        _makeStyleBtns('studio-accent-btns', [
            { l:'NEON',    v:'neon',    dot:'#00e5ff' },
            { l:'CYAN',    v:'cyan',    dot:'#00ffcc' },
            { l:'GOLD',    v:'gold',    dot:'#ffd700' },
            { l:'BLOOD',   v:'blood',   dot:'#ff2222' },
            { l:'FUCHSIA', v:'fuchsia', dot:'#ff00e5' }
        ], 'accentColor');

        _makeStyleBtns('studio-hud-btns', [
            { l:'CORNERS', v:'tech-corners'  },
            { l:'SCANNER', v:'scanner-lines' },
            { l:'MINIMAL', v:'minimal'       },
            { l:'NONE',    v:'none'          }
        ], 'hudStyle');

        _makeStyleBtns('studio-font-btns', [
            { l:'IMPACT',  v:'bold-impact'  },
            { l:'MONO',    v:'tech-mono'    },
            { l:'ELEGANT', v:'elegant-sans' }
        ], 'fontStyle');

        _makeStyleBtns('studio-filter-btns', [
            { l:'LIMPIO', v:'clear'    },
            { l:'GLITCH', v:'glitch'   },
            { l:'GRAIN',  v:'grain'    },
            { l:'VIÑETA', v:'vignette' }
        ], 'overlayFilter');

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


    document.getElementById('btn-reset-all').onclick = () => {
        if (confirm("ESTO ELIMINARÁ TODA TU CUENTA Y DATOS. ¿ESTÁS SEGURO?")) {
            localStorage.clear();
            location.reload();
        }
    };

    // --- CALCULADORA INTELIGENTE 100% CÓDIGO (sin IA) ---
    function renderCalculatorPage() {
        const consumed = userData.caloriesConsumedToday || 0;
        const burned = userData.caloriesBurnedToday || 0;
        const limit = userData.dailyCalLimit || 0;
        const remaining = limit - consumed + burned;
        const status = document.getElementById('calc-status-line');
        if (status) {
            const tone = remaining < 0 ? '⛔' : remaining < 200 ? '⚠️' : '✅';
            status.innerHTML = `${tone} Hoy llevas <strong style="color:var(--accent-main)">${consumed} kcal</strong> ingeridas / <strong>${limit} kcal</strong> límite. Quemaste ${burned} kcal con ejercicio. Te quedan <strong style="color:${remaining < 0 ? '#ff3366' : '#00ff88'};">${remaining} kcal</strong> hoy.`;
        }
        const ageEl = document.getElementById('calc-age');
        if (ageEl && userData.age && !ageEl.value) ageEl.value = userData.age;
    }

    function setupCalcCompensate() {
        const btn = document.getElementById('btn-calc-compensate');
        if (!btn) return;
        btn.onclick = () => {
            const extra = parseInt(document.getElementById('calc-extra-cal').value);
            const out = document.getElementById('calc-compensate-result');
            if (!extra || extra <= 0) {
                out.innerHTML = `<p style="color:var(--accent-alert); font-size:0.85rem;">Escribe un número válido de kcal.</p>`;
                return;
            }
            const opts = (typeof findCompensationOptions === 'function') ? findCompensationOptions(extra, 6) : [];
            if (opts.length === 0) {
                out.innerHTML = `<p style="color:var(--text-dim); font-size:0.85rem;">No encontré ejercicios óptimos. Prueba con un valor menor.</p>`;
                return;
            }
            out.innerHTML = `
                <p style="font-size:0.8rem; color:var(--text-dim); margin-bottom:0.6rem;">Para quemar <strong style="color:var(--accent-main)">${extra} kcal</strong>, haz cualquiera:</p>
                <div style="display:grid; gap:0.5rem;">
                    ${opts.map(o => `
                        <div style="padding:0.7rem 1rem; background:rgba(0,255,136,0.08); border-radius:8px; border-left:3px solid var(--accent-main);">
                            <div style="font-weight:bold; color:#fff; font-size:0.9rem;">${o.name}</div>
                            <div style="font-size:0.75rem; color:var(--accent-main);">${o.amount} ${o.unit.toLowerCase()}</div>
                            <div style="font-size:0.7rem; color:var(--text-dim); margin-top:0.2rem;">${o.desc}</div>
                        </div>
                    `).join('')}
                </div>
            `;
        };
    }

    function setupCalcSwap() {
        const btn = document.getElementById('btn-calc-swap');
        if (!btn) return;
        btn.onclick = () => {
            const food = document.getElementById('calc-swap-food').value.trim();
            const out = document.getElementById('calc-swap-result');
            if (!food) {
                out.innerHTML = `<p style="color:var(--accent-alert); font-size:0.85rem;">Escribe un alimento.</p>`;
                return;
            }
            const found = (typeof findFood === 'function') ? findFood(food) : null;
            if (!found) {
                out.innerHTML = `<p style="color:var(--accent-alert); font-size:0.85rem;">No tengo "${food}" en mi base. Prueba con palabras más comunes (ej. "pizza", "taco", "hamburguesa").</p>`;
                return;
            }
            const swaps = (typeof findFoodSwaps === 'function') ? findFoodSwaps(found.cal, 0.15, 6) : [];
            const filtered = swaps.filter(s => s.name !== found.name);
            out.innerHTML = `
                <p style="font-size:0.8rem; color:var(--text-dim); margin-bottom:0.6rem;">
                    <strong style="color:var(--accent-secondary)">${found.name}</strong> = <strong>${found.cal} kcal</strong>${found.p ? ` · ${found.p}g proteína` : ''}.
                </p>
                <p style="font-size:0.8rem; color:var(--text-dim); margin-bottom:0.5rem;">En su lugar puedes comer:</p>
                <div style="display:grid; gap:0.4rem;">
                    ${filtered.length === 0
                        ? '<p style="color:var(--text-dim); font-size:0.8rem;">No hay alternativas con kcal similares en mi base.</p>'
                        : filtered.map(s => `
                            <div style="padding:0.6rem 0.9rem; background:rgba(0,212,255,0.06); border-radius:8px; border-left:3px solid var(--accent-secondary); display:flex; justify-content:space-between; align-items:center;">
                                <span style="color:#fff; font-size:0.85rem;">${s.name}</span>
                                <span style="color:var(--accent-secondary); font-weight:bold; font-size:0.85rem;">${s.cal} kcal</span>
                            </div>
                        `).join('')}
                </div>
            `;
        };
    }

    function setupCalcTDEE() {
        const btn = document.getElementById('btn-calc-tdee');
        if (!btn) return;
        btn.onclick = () => {
            const age = parseInt(document.getElementById('calc-age').value);
            const sex = document.getElementById('calc-sex').value;
            const activity = parseFloat(document.getElementById('calc-activity').value);
            const out = document.getElementById('calc-tdee-result');
            if (!age || !userData.weight || !userData.height) {
                out.innerHTML = `<p style="color:var(--accent-alert); font-size:0.85rem;">Necesito tu edad, peso y altura. Escribe edad arriba y completa peso/altura en Ajustes o Evolución.</p>`;
                return;
            }
            const bmr = calculateBMR(sex, userData.weight, userData.height, age);
            const tdee = calculateTDEE(bmr, activity);
            const limit = recommendCalorieLimit(tdee, userData.weight, userData.target_weight || userData.weight);
            const deficit = tdee - limit;
            userData.age = age;
            saveData();
            out.innerHTML = `
                <div style="padding:1rem; background:rgba(255,215,0,0.05); border-radius:10px; border:1px solid rgba(255,215,0,0.3);">
                    <div style="display:flex; justify-content:space-between; padding:0.4rem 0; border-bottom:1px solid rgba(255,255,255,0.05);">
                        <span style="color:var(--text-dim); font-size:0.8rem;">BMR (metabolismo basal)</span>
                        <strong style="color:#fff;">${bmr} kcal</strong>
                    </div>
                    <div style="display:flex; justify-content:space-between; padding:0.4rem 0; border-bottom:1px solid rgba(255,255,255,0.05);">
                        <span style="color:var(--text-dim); font-size:0.8rem;">TDEE (gasto total diario)</span>
                        <strong style="color:#fff;">${tdee} kcal</strong>
                    </div>
                    <div style="display:flex; justify-content:space-between; margin-top:0.3rem; background:rgba(0,255,136,0.08); border-radius:6px; padding:0.6rem 0.8rem;">
                        <span style="color:var(--accent-main); font-size:0.85rem; font-weight:bold;">LÍMITE RECOMENDADO</span>
                        <strong style="color:var(--accent-main); font-size:1.1rem;">${limit} kcal/día</strong>
                    </div>
                    <p style="font-size:0.75rem; color:var(--text-dim); margin-top:0.6rem; line-height:1.5;">
                        Déficit diario: <strong style="color:var(--accent-secondary)">${deficit} kcal</strong> (≈ ${(deficit * 7 / 7700).toFixed(2)} kg/semana).
                    </p>
                    <button class="btn-premium" id="btn-apply-limit" style="width:100%; margin-top:0.8rem; padding:0.7rem; font-size:0.8rem;">APLICAR ESTE LÍMITE A MI APP</button>
                </div>
            `;
            const apply = document.getElementById('btn-apply-limit');
            if (apply) apply.onclick = () => {
                userData.dailyCalLimit = limit;
                saveData();
                if (typeof updateDashboard === 'function') updateDashboard();
                renderCalculatorPage();
                alert(`✅ Límite diario actualizado: ${limit} kcal/día`);
            };
        };
    }

    function setupCalcProjection() {
        const btn = document.getElementById('btn-calc-projection');
        if (!btn) return;
        btn.onclick = () => {
            const out = document.getElementById('calc-projection-result');
            if (!userData.weight || !userData.target_weight || userData.weight <= userData.target_weight) {
                out.innerHTML = `<p style="color:var(--accent-alert); font-size:0.85rem;">Necesito tu peso actual y meta. Configúralos en Ajustes.</p>`;
                return;
            }
            const history = userData.history || [];
            let avgDailyDeficit = 500;
            if (userData.totalNetDeficit > 0 && history.length > 1) {
                const firstDate = new Date(history[0].date);
                const today = new Date();
                const daysElapsed = Math.max(1, Math.floor((today - firstDate) / (1000 * 60 * 60 * 24)));
                avgDailyDeficit = Math.round(userData.totalNetDeficit / daysElapsed);
            }
            const days = projectGoalDays(userData.weight, userData.target_weight, avgDailyDeficit);
            const kgToLose = (userData.weight - userData.target_weight).toFixed(1);
            if (!days) {
                out.innerHTML = `<p style="color:var(--text-dim); font-size:0.85rem;">No puedo proyectar todavía. Necesitas registrar al menos un mes de actividad.</p>`;
                return;
            }
            const goalDate = new Date();
            goalDate.setDate(goalDate.getDate() + days);
            out.innerHTML = `
                <div style="padding:1rem; background:rgba(0,212,255,0.05); border-radius:10px; border:1px solid rgba(0,212,255,0.3);">
                    <div style="text-align:center; margin-bottom:1rem;">
                        <div style="font-size:0.75rem; color:var(--text-dim);">FALTAN</div>
                        <div style="font-size:2rem; font-family:var(--font-accent); color:#00d4ff; font-weight:bold;">${days}</div>
                        <div style="font-size:0.75rem; color:var(--text-dim);">DÍAS PARA TU META</div>
                    </div>
                    <div style="display:grid; grid-template-columns: 1fr 1fr; gap:0.6rem;">
                        <div style="text-align:center; padding:0.6rem; background:rgba(0,0,0,0.2); border-radius:8px;">
                            <div style="font-size:0.7rem; color:var(--text-dim);">A BAJAR</div>
                            <strong style="color:#fff;">${kgToLose} kg</strong>
                        </div>
                        <div style="text-align:center; padding:0.6rem; background:rgba(0,0,0,0.2); border-radius:8px;">
                            <div style="font-size:0.7rem; color:var(--text-dim);">DÉFICIT/DÍA</div>
                            <strong style="color:#fff;">${avgDailyDeficit} kcal</strong>
                        </div>
                    </div>
                    <p style="text-align:center; font-size:0.8rem; color:var(--accent-main); margin-top:0.8rem;">
                        Fecha estimada: <strong>${goalDate.toLocaleDateString('es-MX', { day:'numeric', month:'long', year:'numeric' })}</strong>
                    </p>
                </div>
            `;
        };
    }

    function activateCalculator() {
        renderCalculatorPage();
        setupCalcCompensate();
        setupCalcSwap();
        setupCalcTDEE();
        setupCalcProjection();
    }
    window._activateCalculator = activateCalculator;

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

    // ============================================================
    // SISTEMA DE LOGROS / MEDALLAS
    // ============================================================
    const ACHIEVEMENTS_DEF = [
        { id: 'first_login',   icon: '🎯', title: 'PRIMER ACCESO',     desc: 'Bienvenido a AX-CORE.',                      check: () => !!userData.username },
        { id: 'first_weigh',   icon: '⚖️', title: 'PRIMER REGISTRO',  desc: 'Registraste tu peso por primera vez.',       check: () => (userData.history || []).length >= 1 },
        { id: 'streak_3',      icon: '🔥', title: 'RACHA DE 3 DÍAS',  desc: '3 días consecutivos registrando peso.',      check: () => streakDays() >= 3 },
        { id: 'streak_7',      icon: '🔥', title: 'RACHA DE 7 DÍAS',  desc: 'Una semana completa de constancia.',         check: () => streakDays() >= 7 },
        { id: 'streak_30',     icon: '👑', title: 'RACHA DE 30 DÍAS', desc: 'Un mes entero sin fallar. Élite.',           check: () => streakDays() >= 30 },
        { id: 'lose_1kg',      icon: '🔻', title: 'PRIMER KG ABAJO',  desc: 'Bajaste tu primer kilo. ¡Vamos!',            check: () => kilosLost() >= 1 },
        { id: 'lose_5kg',      icon: '💪', title: '5 KG MENOS',       desc: 'Cinco kilos menos. Estás transformándote.',  check: () => kilosLost() >= 5 },
        { id: 'lose_10kg',     icon: '🏆', title: '10 KG MENOS',      desc: 'Diez kilos menos. Otro nivel.',              check: () => kilosLost() >= 10 },
        { id: 'goal_reached',  icon: '🌟', title: 'META ALCANZADA',   desc: 'Llegaste a tu peso objetivo.',               check: () => userData.weight > 0 && userData.target_weight > 0 && userData.weight <= userData.target_weight },
        { id: 'food_log_50',   icon: '🥗', title: '50 ALIMENTOS',     desc: 'Registraste 50 alimentos en tu historial.',  check: () => (userData.totalFoodLogs || 0) >= 50 },
        { id: 'deficit_3500',  icon: '⚡', title: 'DÉFICIT DE 3500',  desc: 'Acumulaste un déficit de 3500 kcal (~½ kg).', check: () => (userData.totalNetDeficit || 0) >= 3500 },
        { id: 'deficit_7700',  icon: '🚀', title: 'DÉFICIT DE 7700',  desc: 'Déficit equivalente a 1 kg quemado.',         check: () => (userData.totalNetDeficit || 0) >= 7700 }
    ];

    function streakDays() {
        const h = userData.history || [];
        if (h.length === 0) return 0;
        // h debe estar ordenado por fecha; buscar último registro y contar consecutivos
        const dates = h.map(r => new Date(r.date).toDateString());
        const unique = [...new Set(dates)].map(d => new Date(d)).sort((a,b) => b-a);
        let streak = 1;
        for (let i = 1; i < unique.length; i++) {
            const diff = (unique[i-1] - unique[i]) / (1000 * 60 * 60 * 24);
            if (Math.round(diff) === 1) streak++;
            else break;
        }
        // Validar que el último sea hoy o ayer
        const lastDiff = (new Date() - unique[0]) / (1000 * 60 * 60 * 24);
        return lastDiff <= 1.5 ? streak : 0;
    }

    function kilosLost() {
        const h = userData.history || [];
        if (h.length < 2) return 0;
        const start = h[0].weight;
        const cur = userData.weight || h[h.length - 1].weight;
        return Math.max(0, start - cur);
    }

    function checkAchievements() {
        if (!userData.achievements) userData.achievements = [];
        const earned = new Set(userData.achievements);
        const newOnes = [];
        for (const a of ACHIEVEMENTS_DEF) {
            if (!earned.has(a.id) && a.check()) {
                earned.add(a.id);
                newOnes.push(a);
            }
        }
        if (newOnes.length > 0) {
            userData.achievements = [...earned];
            saveData();
            newOnes.forEach((a, i) => setTimeout(() => showAchievementToast(a), i * 2500));
        }
        renderAchievementsPanel();
    }
    window.checkAchievements = checkAchievements;

    function showAchievementToast(a) {
        const t = document.createElement('div');
        t.style.cssText = `
            position: fixed; top: 20px; left: 50%; transform: translateX(-50%);
            background: linear-gradient(135deg, #00ff88, #00cc6a); color: #000;
            padding: 14px 22px; border-radius: 14px; z-index: 5000;
            font-family: 'Oswald', sans-serif; letter-spacing: 1px;
            box-shadow: 0 12px 40px rgba(0,255,136,0.5);
            display: flex; align-items: center; gap: 12px; max-width: 90vw;
            animation: achPop 0.4s ease-out;
        `;
        t.innerHTML = `<span style="font-size:32px;">${a.icon}</span>
                       <div><div style="font-size:11px; opacity:0.7;">¡LOGRO DESBLOQUEADO!</div>
                       <div style="font-size:16px; font-weight:700;">${a.title}</div>
                       <div style="font-size:11px; font-weight:400; max-width:240px;">${a.desc}</div></div>`;
        document.body.appendChild(t);
        setTimeout(() => { t.style.transition = 'opacity 0.5s'; t.style.opacity = '0'; }, 4500);
        setTimeout(() => t.remove(), 5200);
    }

    function renderAchievementsPanel() {
        const panel = document.getElementById('achievements-panel');
        if (!panel) return;
        const earned = new Set(userData.achievements || []);
        panel.innerHTML = ACHIEVEMENTS_DEF.map(a => {
            const got = earned.has(a.id);
            return `<div class="ach-card ${got ? 'ach-card--got' : 'ach-card--locked'}">
                <div class="ach-icon">${a.icon}</div>
                <div class="ach-title">${a.title}</div>
                <div class="ach-desc">${a.desc}</div>
            </div>`;
        }).join('');
    }

    // ============================================================
    // ONBOARDING TOUR (primera vez)
    // ============================================================
    // ============================================================
    // PUSH NOTIFICATIONS — suscripción del atleta
    // ============================================================
    async function subscribeToPush() {
        if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
        if (!apiToken()) return; // necesita sesión
        try {
            const reg = await navigator.serviceWorker.ready;
            // ¿Ya suscrito?
            const existing = await reg.pushManager.getSubscription();
            if (existing) return;

            // Pedir VAPID al backend
            const r = await fetch(`${API_URL}/api/push/vapid`);
            if (!r.ok) return; // no hay push configurado
            const { key } = await r.json();
            if (!key) return;

            // Pedir permiso al usuario
            const perm = await Notification.requestPermission();
            if (perm !== 'granted') return;

            const sub = await reg.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlB64ToUint8Array(key)
            });

            await fetch(`${API_URL}/api/push/subscribe`, {
                method: 'POST',
                headers: apiAuthHeaders(),
                body: JSON.stringify({ subscription: sub })
            });
            console.log('[push] suscrito a notificaciones.');
        } catch (e) {
            console.warn('[push] error:', e.message);
        }
    }
    function urlB64ToUint8Array(b64) {
        const padding = '='.repeat((4 - b64.length % 4) % 4);
        const base64 = (b64 + padding).replace(/-/g, '+').replace(/_/g, '/');
        const raw = atob(base64);
        const out = new Uint8Array(raw.length);
        for (let i = 0; i < raw.length; ++i) out[i] = raw.charCodeAt(i);
        return out;
    }
    // Intentar suscripción 5s después de cargar (no bloquea UX)
    setTimeout(() => subscribeToPush(), 5000);

    function launchOnboardingTour() {
        if (document.getElementById('onb-overlay')) return;
        const steps = [
            { title: '👋 Bienvenido', body: 'Esta app te ayuda a controlar tu peso y calorías de forma inteligente. Te toma 30 segundos aprenderla.' },
            { title: '⚖️ Registra tu peso', body: 'Ve a la sección PESO y escribe tu peso del día. Hazlo siempre en las mismas condiciones (al despertar, sin zapatos).' },
            { title: '🥗 Registra lo que comes', body: 'En ALIMENTOS escribe lo que comiste. Tenemos +677 alimentos mexicanos en la base. Si no aparece, te pedimos las kcal una vez y se queda guardado.' },
            { title: '🧮 Usa la calculadora', body: 'En CALCULADORA puedes: compensar excesos, sustituir alimentos, calcular tu gasto diario y proyectar cuándo llegarás a tu meta.' },
            { title: '🏆 Gana logros', body: 'Cada constancia se reconoce: rachas, kilos abajo, hitos. Verás insignias conforme avances. ¡Empezamos!' }
        ];
        let idx = 0;
        const ov = document.createElement('div');
        ov.id = 'onb-overlay';
        ov.style.cssText = `
            position: fixed; inset: 0; background: rgba(0,0,0,0.85);
            backdrop-filter: blur(8px); z-index: 9000;
            display: flex; align-items: center; justify-content: center; padding: 20px;
        `;
        document.body.appendChild(ov);

        function render() {
            const s = steps[idx];
            ov.innerHTML = `
                <div style="background:linear-gradient(135deg,#0a1f12,#0d1a18); max-width:420px; width:100%;
                            border:2px solid #00ff88; border-radius:20px; padding:28px;
                            box-shadow:0 0 60px rgba(0,255,136,0.3);">
                    <div style="display:flex; gap:6px; margin-bottom:20px;">
                        ${steps.map((_, i) => `<div style="flex:1; height:4px; border-radius:2px; background:${i <= idx ? '#00ff88' : 'rgba(255,255,255,0.1)'};"></div>`).join('')}
                    </div>
                    <h2 style="font-family:'Oswald'; color:#00ff88; letter-spacing:1px; margin:0 0 12px;">${s.title}</h2>
                    <p style="color:#cce8d0; line-height:1.6; font-size:14px; margin:0 0 24px;">${s.body}</p>
                    <div style="display:flex; gap:10px; justify-content:flex-end;">
                        ${idx > 0 ? '<button id="onb-prev" style="background:transparent; border:1px solid rgba(255,255,255,0.2); color:#aaa; padding:10px 18px; border-radius:10px; cursor:pointer; font-family:Inter; font-weight:600;">ATRÁS</button>' : ''}
                        <button id="onb-skip" style="background:transparent; border:none; color:#666; padding:10px 16px; cursor:pointer; font-family:Inter; font-size:12px;">SALTAR</button>
                        <button id="onb-next" style="background:linear-gradient(135deg,#00ff88,#00cc6a); border:none; color:#000; padding:10px 22px; border-radius:10px; cursor:pointer; font-family:Inter; font-weight:700; letter-spacing:0.5px;">${idx === steps.length - 1 ? 'EMPEZAR' : 'SIGUIENTE'}</button>
                    </div>
                </div>`;
            const next = document.getElementById('onb-next');
            const prev = document.getElementById('onb-prev');
            const skip = document.getElementById('onb-skip');
            if (next) next.onclick = () => { if (idx === steps.length - 1) close(); else { idx++; render(); } };
            if (prev) prev.onclick = () => { idx--; render(); };
            if (skip) skip.onclick = close;
        }
        function close() { ov.remove(); }
        render();
    }
    window.launchOnboardingTour = launchOnboardingTour;

    // ============================================================
    // axcoreEnterApp — llamado desde axcoreLogin/axcoreRegister para
    // poblar el dashboard sin necesidad de reload de página.
    // ============================================================
    window.axcoreEnterApp = function(username) {
        try {
            currentUser = username;
            localStorage.setItem('arthur_current_user', username);
            try { loadUserData(); } catch(e) { console.error('[enterApp] loadUserData:', e); }
            try { showApp(); } catch(e) { console.error('[enterApp] showApp:', e); }
        } catch (e) {
            console.error('[enterApp] fatal:', e);
            // Último recurso: forzar visibilidad
            try {
                document.getElementById('login-overlay')?.classList.add('hidden');
                document.getElementById('register-overlay')?.classList.add('hidden');
                document.getElementById('app-container')?.classList.remove('hidden');
            } catch(_) {}
        }
    };

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
