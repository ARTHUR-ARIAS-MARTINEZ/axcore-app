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
    
    const themeBtns = document.querySelectorAll('.theme-buttons .theme-btn');
    const saveSettingsBtn = document.getElementById('save-settings');
    const saveMeasurementsBtn = document.getElementById('save-measurements');
    const navLogout = document.getElementById('nav-logout');

    // Modal de comida premium a pantalla completa
    let currentEditingMeal = null;
    function openMealModal(mealType) {
        currentEditingMeal = mealType;
        const diet = userData.recommendedDiet || { breakfast: '', lunch: '', dinner: '', snacks: '' };
        const titleEl = document.getElementById('meal-modal-title');
        const textareaEl = document.getElementById('meal-modal-textarea');
        const overlayEl = document.getElementById('meal-modal-overlay');
        
        if (titleEl) {
            const names = {
                breakfast: 'DESAYUNO',
                lunch: 'COMIDA',
                dinner: 'CENA',
                snacks: 'SNACKS'
            };
            titleEl.textContent = names[mealType] || 'COMIDA';
        }
        if (textareaEl) {
            textareaEl.value = diet[mealType] || '';
        }
        if (overlayEl) {
            overlayEl.classList.add('active');
        }
    }
    
    function closeMealModal() {
        const overlayEl = document.getElementById('meal-modal-overlay');
        if (overlayEl) {
            overlayEl.classList.remove('active');
        }
        currentEditingMeal = null;
    }
    
    function saveMealModal() {
        if (!currentEditingMeal) return;
        const textareaEl = document.getElementById('meal-modal-textarea');
        if (textareaEl) {
            if (!userData.recommendedDiet) userData.recommendedDiet = { breakfast: '', lunch: '', dinner: '', snacks: '' };
            userData.recommendedDiet[currentEditingMeal] = textareaEl.value.trim();
            saveData();
            renderDietPage();
        }
        closeMealModal();
    }

    const mBack = document.getElementById('meal-modal-back');
    if (mBack) mBack.onclick = closeMealModal;
    
    const mSave = document.getElementById('meal-modal-save');
    if (mSave) mSave.onclick = saveMealModal;

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
        totalCaloriesBurned: 0,
        totalWorkouts: 0,
        usedCalc: false,
        sharedCard: false,
        apiKey: '',
        theme: 'neon',
        history: [],
        foodLogToday: [],
        workoutLogToday: [],
        recommendedDiet: { breakfast: '', lunch: '', dinner: '', snacks: '' },
        customDietRules: null,
        lastUpdateDate: new Date().toDateString()
    };

    // --- INICIALIZACIÓN ---
    // (Inicialización pospuesta al final del DOMContentLoaded para evitar errores de TDZ)

    // Garantizar que el nombre y foto quedan sincronizados DESPUÉS de que
    // todos los scripts (premium-badges.js, premium-extras.js) hayan terminado
    setTimeout(function() {
        if (typeof window.syncProfileEverywhere === 'function') window.syncProfileEverywhere();
    }, 400);

    // ═══════════════════════════════════════════════════════════════
    // WATCHDOG del header: MutationObserver que detecta si display-username
    // se queda vacío y lo restaura desde la persistencia separada.
    // Esto neutraliza CUALQUIER código que limpie el header por error.
    // ═══════════════════════════════════════════════════════════════
    setTimeout(function installHeaderWatchdog() {
        try {
            const target = document.getElementById('display-username');
            if (!target || typeof MutationObserver === 'undefined') return;
            const restoreName = () => {
                let candidate = '';
                try {
                    if (window.AXProfile && typeof window.AXProfile.getName === 'function') {
                        candidate = window.AXProfile.getName();
                    }
                } catch(_) {}
                if (!candidate) {
                    const persist = (currentUser ? localStorage.getItem('axcore_uname_' + currentUser) : null)
                                 || localStorage.getItem('axcore_uname_global');
                    candidate = (persist || (window.userData && (window.userData.userName || window.userData.username)) || currentUser || 'ATLETA').toString().trim();
                }
                const low = candidate.toLowerCase();
                const blocked = ['', 'atleta', 'admin', 'usuario'];
                const finalName = blocked.includes(low) ? 'ATLETA' : candidate;
                const nameUpper = finalName.toUpperCase();
                if (target.textContent.trim() !== nameUpper) {
                    target.textContent = nameUpper;
                }
                // Reforzar estilos para garantizar visibilidad absoluta en cualquier tema
                target.style.setProperty('color', '#ffffff', 'important');
                target.style.setProperty('display', 'block', 'important');
                target.style.setProperty('visibility', 'visible', 'important');
                target.style.setProperty('opacity', '1', 'important');

                // También restaura el avatar si está vacío y hay foto persistida
                const ap = document.getElementById('avatar-preview');
                if (ap) {
                    let persistPhoto = null;
                    try {
                        if (window.AXProfile && typeof window.AXProfile.getPhoto === 'function') {
                            persistPhoto = window.AXProfile.getPhoto();
                        }
                    } catch(_) {}
                    if (!persistPhoto) {
                        persistPhoto = (currentUser ? localStorage.getItem('axcore_avatar_' + currentUser) : null)
                                          || localStorage.getItem('axcore_avatar_global')
                                          || (window.userData && (window.userData.avatarPhoto || window.userData.avatar));
                    }
                    const hasBg = ap.style.backgroundImage && ap.style.backgroundImage !== 'none' && ap.style.backgroundImage.indexOf('url') >= 0;
                    if (persistPhoto && !hasBg) {
                        ap.style.setProperty('background-image', `url("${persistPhoto}")`, 'important');
                        ap.style.setProperty('background-size', 'cover', 'important');
                        ap.style.setProperty('background-position', 'center', 'important');
                        ap.style.setProperty('background-repeat', 'no-repeat', 'important');
                        ap.textContent = '';
                    }
                }
            };
            // Restauración inicial
            restoreName();
            // Observa cambios en el contenido del span; si se vacía, restaura
            const obs = new MutationObserver(() => {
                if (!target.textContent || !target.textContent.trim()) restoreName();
            });
            obs.observe(target, { childList: true, characterData: true, subtree: true });
            // Y un latido cada 2s como red de seguridad
            setInterval(restoreName, 2000);
        } catch(e) { console.warn('[header-watchdog]', e.message); }
    }, 500);

    function initAuth() {
        // ALWAYS pass auth check to bypass login overlay
        if (!currentUser) {
            currentUser = 'DEMO';
            localStorage.setItem('arthur_current_user', currentUser);
        }
        
        if (true) { // Force bypass
            // CRÍTICO: showApp() PRIMERO para garantizar que la UI esté visible
            // aunque loadUserData() falle por cualquier razón
            try { showApp(); } catch (e) { console.error('[initAuth] showApp err:', e); }
            try { loadUserData(); } catch (e) { console.error('[initAuth] loadUserData err:', e); }

            // Restaurar la sección donde estaba el usuario antes de recargar
            try {
                const savedPage = sessionStorage.getItem('axcore_active_page');

                if (savedPage) {
                    const targetPage = document.getElementById(`page-${savedPage}`);
                    if (targetPage) {
                        pages.forEach(p => p.classList.remove('active'));
                        targetPage.classList.add('active');
                        navLinks.forEach(l => {
                            l.classList.toggle('active', l.dataset.page === savedPage);
                        });
                        // Sincronizar bottom nav premium
                        document.querySelectorAll('.pm-nav-btn').forEach(btn => {
                            btn.classList.toggle('active', btn.dataset.pmPage === savedPage);
                        });
                        if (savedPage === 'diet' && typeof renderDietPage === 'function') renderDietPage();
                        if (savedPage === 'workout' && typeof renderWorkoutPage === 'function') renderWorkoutPage();
                        if (savedPage === 'evolution' && typeof renderEvolutionPage === 'function') renderEvolutionPage('all');
                        if (savedPage === 'studio' && typeof renderStudioPage === 'function') renderStudioPage();
                    }
                }
                // Reset de scroll tras restaurar la página (timeout para asegurar render)
                setTimeout(() => {
                    const contentArea = document.querySelector('.content-area');
                    if (contentArea) contentArea.scrollTop = 0;
                }, 100);
            } catch (e) { console.error('[initAuth] savedPage err:', e); }
        } else {
            showLogin();
        }
    }
    function loadUserData() {
        const saved = localStorage.getItem(getStorageKey());
        if (saved) {
            userData = { ...userData, ...JSON.parse(saved) };
            window.userData = userData;
            if (!userData.foodLogToday) userData.foodLogToday = [];
            if (!userData.workoutLogToday) userData.workoutLogToday = [];
            if (!userData.forearm) userData.forearm = 0;
            if (!userData.back) userData.back = 0;
            if (!userData.achievements) userData.achievements = [];
            // Normalizar: si userName está vacío O es un placeholder genérico,
            // usar username de login, persistencia separada, o currentUser como fallback
            const _badNames = new Set(['', 'atleta', 'admin', 'usuario']);
            const _sanName  = (v) => { const s=(v||'').toString().trim(); return _badNames.has(s.toLowerCase()) ? '' : s; };
            // PRIORIDAD: clave separada (inmune a sync) > userName guardado > username login > currentUser
            const _persistedName = currentUser ? localStorage.getItem('axcore_uname_' + currentUser) : null;
            const _globalName = localStorage.getItem('axcore_uname_global');
            if (_sanName(_persistedName)) {
                userData.userName = _persistedName.trim();
            } else if (!_sanName(userData.userName)) {
                const _fb = _sanName(_globalName) || _sanName(userData.username) || _sanName(currentUser);
                if (_fb) userData.userName = _fb;
            }
            // PRIORIDAD avatar: clave separada (inmune a sync) > avatarPhoto guardado > avatar
            if (currentUser) {
                const _persistedAvatar = localStorage.getItem('axcore_avatar_' + currentUser)
                                      || localStorage.getItem('axcore_avatar_global');
                if (_persistedAvatar && !userData.avatarPhoto) {
                    userData.avatarPhoto = _persistedAvatar;
                    userData.avatar = _persistedAvatar;
                }
            }

            // Reset diario de calorías
            const today = new Date().toDateString();
            if (userData.lastUpdateDate !== today) {
                const dayDeficit = userData.dailyCalLimit - (userData.caloriesConsumedToday - userData.caloriesBurnedToday);
                userData.totalNetDeficit += Math.max(0, dayDeficit);
                userData.caloriesConsumedToday = 0;
                userData.caloriesBurnedToday = 0;
                userData.foodLogToday = [];
                userData.workoutLogToday = [];
                userData.lastUpdateDate = today;
                saveData();
            }
        }
        applySettings();
        updateDashboard();

        // Pull remoto en background — sobreescribe local si remote es más reciente
        // PERO preserva nombre y foto locales (son tan importantes que NUNCA se sobreescriben
        // por sync remoto; el push los enviará al backend la próxima vez).
        if (apiToken()) {
            pullRemoteData().then(remote => {
                if (!remote) return;
                const remoteSync = remote.lastSync ? new Date(remote.lastSync).getTime() : 0;
                const localSync  = userData.lastSync ? new Date(userData.lastSync).getTime() : 0;
                if (remoteSync > localSync && remote.data && Object.keys(remote.data).length > 0) {
                    // Capturar locales antes del merge
                    const _localName   = userData.userName;
                    const _localUser   = userData.username;
                    const _localAvatar = userData.avatarPhoto || userData.avatar;
                    userData = { ...userData, ...remote.data };
                    // Restaurar identidad local si remote viene vacío o con placeholder
                    const _bad = new Set(['', 'atleta', 'admin', 'usuario']);
                    const _ok  = v => v && !_bad.has(String(v).trim().toLowerCase());
                    if (_ok(_localName))   userData.userName = _localName;
                    if (_ok(_localUser))   userData.username = _localUser;
                    if (_localAvatar) {
                        userData.avatarPhoto = _localAvatar;
                        userData.avatar      = _localAvatar;
                    }
                    userData.lastSync = remote.lastSync;
                    if (Array.isArray(remote.achievements)) userData.achievements = remote.achievements;
                    window.userData = userData;
                    localStorage.setItem(getStorageKey(), JSON.stringify(userData));
                    applySettings();
                    updateDashboard();
                    console.log('[sync] datos restaurados desde la nube (identidad local preservada).');
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
        // Migración: el tema "amarillo" se eliminó (se parecía a dorado) → usar dorado.
        if (userData.theme === 'amarillo') { userData.theme = 'dorado'; try { saveData(); } catch(e){} }
        const activeTheme = userData.theme || 'neon';
        document.body.setAttribute('data-theme', activeTheme);
        // Marcar theme-btn (legacy) y t-swatch (premium) con estado activo
        document.querySelectorAll('.theme-buttons .theme-btn, .t-swatch').forEach(b => {
            b.classList.toggle('active', b.dataset.theme === activeTheme);
        });
        // Nombre: PRIORIDAD #1 es AXProfile (clave inmune); luego jerarquía clásica
        const dispUser = document.getElementById('display-username');
        const _bset = new Set(['', 'atleta', 'admin', 'usuario']);
        const _san  = (v) => { const s=(v||'').toString().trim(); return _bset.has(s.toLowerCase()) ? '' : s; };
        let _axName = '';
        try { if (window.AXProfile && typeof window.AXProfile.getName === 'function') _axName = window.AXProfile.getName() || ''; } catch(_) {}
        let nameToDisp = _san(_axName) || _san(userData.userName) || _san(userData.username) || _san(currentUser) || 'ATLETA';
        if (dispUser) {
            dispUser.textContent = nameToDisp.toUpperCase();
        }
        const photoSrc = userData.avatarPhoto || userData.avatar;
        const ap = document.getElementById('avatar-preview');
        if (ap) {
            if (photoSrc) {
                ap.style.setProperty('background-image', `url("${photoSrc}")`, 'important');
                ap.style.setProperty('background-size', 'cover', 'important');
                ap.style.setProperty('background-position', 'center', 'important');
                ap.style.setProperty('background-repeat', 'no-repeat', 'important');
                ap.textContent = '';
            } else {
                ap.style.removeProperty('background-image');
                ap.textContent = (nameToDisp[0] || 'A').toUpperCase();
            }
        }

        // NOTA: La edición de foto y nombre se hace SOLO desde la sección Ajustes.
        // El avatar del header ya NO abre selector de archivos; el onclick de la badge
        // navega a Ajustes (definido en index.html). No registramos onclick aquí porque
        // sobrescribiría el del HTML.

        const unEl = document.getElementById('input-username');
        let initialInputVal = (userData.userName || userData.username || '').trim();
        const lowInputVal = initialInputVal.toLowerCase();
        if (lowInputVal === 'admin' || lowInputVal === 'atleta' || lowInputVal === 'usuario') {
            initialInputVal = '';
        }
        if (unEl) unEl.value = initialInputVal;
        const hEl = document.getElementById('input-height'); if (hEl) hEl.value = userData.height || '';
        const wEl = document.getElementById('input-weight'); if (wEl) wEl.value = userData.weight || '';
        const waEl = document.getElementById('input-waist'); if (waEl) waEl.value = userData.waist || '';
        const twEl = document.getElementById('input-target-weight'); if (twEl) twEl.value = userData.target_weight || '';
        const cw = document.getElementById('current-waist');
        if (cw) cw.textContent = userData.waist || 0;

        // Logros Spans
        const achUser = document.getElementById('ach-username');
        const achName = _san(userData.userName) || _san(userData.username) || _san(currentUser) || 'ATLETA';
        if (achUser) achUser.textContent = achName.toUpperCase();
        const achDef = document.getElementById('ach-deficit');
        if (achDef) achDef.textContent = userData.totalNetDeficit || 0;
        const achWaist = document.getElementById('ach-waist');
        if (achWaist) achWaist.textContent = userData.waist || 0;

        // Sincronizar nombre y avatar en toda la interfaz (usa ambas propiedades userName/username)
        if (typeof window.syncProfileEverywhere === 'function') window.syncProfileEverywhere();
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
            try {
                // CRÍTICO: si la foto está dentro de userData (legado), removerla
                // antes de serializar — la foto vive ahora en axcore_profile_v1.
                // Esto previene QuotaExceededError por JSON gigante.
                const _backupPhoto = userData.avatarPhoto;
                const _backupAv    = userData.avatar;
                if (_backupPhoto && _backupPhoto.length > 1000) userData.avatarPhoto = '';
                if (_backupAv    && _backupAv.length    > 1000) userData.avatar      = '';
                localStorage.setItem(getStorageKey(), JSON.stringify(userData));
                // Restaurar en memoria (no en localStorage) por si el resto del código las usa
                if (_backupPhoto) userData.avatarPhoto = _backupPhoto;
                if (_backupAv)    userData.avatar      = _backupAv;
                pushSync(); // debounced — solo si hay token
            } catch (e) {
                console.error('[saveData] Falló:', e.message);
                // Si excede cuota incluso sin la foto, limpia caches secundarios
                if (e.name === 'QuotaExceededError' || e.code === 22) {
                    try {
                        for (let i = localStorage.length - 1; i >= 0; i--) {
                            const k = localStorage.key(i);
                            if (k && (k.indexOf('axcore_avatar_') === 0 || k.indexOf('axcore_uname_') === 0)) {
                                localStorage.removeItem(k);
                            }
                        }
                        // Reintentar
                        userData.avatarPhoto = '';
                        userData.avatar = '';
                        localStorage.setItem(getStorageKey(), JSON.stringify(userData));
                    } catch(e2) { console.error('[saveData] no se pudo recuperar:', e2.message); }
                }
            }
        }
        // Exponer userData globalmente para premium-badges.js
        window.userData = userData;
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
            userData.passHash = await window.axPassHash(p);
            delete userData.password;
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
                userData.passHash = await window.axPassHash(p);
                delete userData.password;
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
                    merged.passHash = await window.axPassHash(p);
                    delete merged.password;
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
        const storedCred = (savedLocal.passHash != null) ? savedLocal.passHash : savedLocal.password;
        if (!(await window.axPassVerify(storedCred, p))) {
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
            const dColor = delta === null ? themeColors.dim : (losing ? themeColors.main : (gaining ? themeColors.alert : themeColors.dim));
            const dText  = delta === null ? '—' : (losing ? delta.toFixed(1) : `+${delta.toFixed(1)}`);
            const dateShort = formatShortDate(h.date); // dd/mm
            return `
            <div style="
                flex-shrink:0; width:88px; background:rgba(255,255,255,0.04);
                border:1px solid rgba(255,255,255,0.08); border-radius:14px;
                padding:10px 8px; text-align:center; position:relative;
                ${i === 0 ? 'border-color:' + dColor + ';box-shadow:0 0 8px ' + dColor + '22;' : ''}
            ">
                ${i === 0 ? `<span style="position:absolute;top:4px;right:6px;font-size:8px;color:${themeColors.dim};">HOY</span>` : ''}
                <p style="font-size:0.6rem;color:${themeColors.dim};margin-bottom:4px;">${dateShort}</p>
                <p style="font-family:var(--font-accent);font-size:1.05rem;color:#fff;margin:0;">${(h.weight||0).toFixed(1)}</p>
                <p style="font-size:0.6rem;color:${themeColors.dim};margin:0 0 4px;">kg</p>
                <p style="font-size:0.85rem;font-weight:700;color:${dColor};margin:0;">${arrow} ${dText}</p>
                ${h.waist ? `<p style="font-size:0.6rem;color:${themeColors.dim};margin-top:3px;">${h.waist}cm</p>` : ''}
            </div>`;
        }).join('');

        // Sparkline compacto (últimas 10 entradas)
        const last10    = historyData.slice(-10);
        const dates10   = last10.map(h => formatShortDate(h.date));
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
                xaxis: { labels: { style: { colors: themeColors.dim, fontSize: '9px' } }, axisBorder: { show: false }, axisTicks: { show: false }, tooltip: { enabled: false } },
                yaxis: [
                    { labels: { style: { colors: themeColors.dim, fontSize: '9px' }, formatter: v => v.toFixed(0) + 'kg' } },
                    { opposite: true, labels: { style: { colors: themeColors.dim, fontSize: '9px' }, formatter: v => v.toFixed(0) + 'cm' } }
                ],
                legend: { show: true, position: 'top', labels: { colors: themeColors.dim }, fontSize: '10px', markers: { size: 5 } },
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
        if (s('current-weight')) s('current-weight').textContent = (+(userData.weight || 0)).toFixed(1);
        if (s('weight-meta-text')) s('weight-meta-text').textContent = `Meta: ${+(userData.target_weight || 0)} KG`;
        const progW = Math.max(0, Math.min(100, ((110 - (+(userData.weight || 110))) / Math.max(1, (110 - (+(userData.target_weight || 85))))) * 100));

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
            const imc = ((+userData.weight) / ((+userData.height) * (+userData.height))).toFixed(1);
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

        // RACHA — días CONSECUTIVOS reales registrando peso (no total de registros)
        const streak = (typeof streakDays === 'function') ? streakDays() : (userData.history?.length || 0);
        set('pd-streak-days', streak);
        set('pd-ach-streak-days', streak);

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

        // EVOLUCIÓN RECIENTE + SPARKLINE
        const hist = userData.history || [];
        const evolSection = get('pd-evol-section');
        const evolScroll  = get('pd-evol-scroll');
        if (evolSection && hist.length > 0) {
            evolSection.style.display = '';
            const recent = hist.slice(-10).reverse(); // últimos 10, más reciente primero
            evolScroll.innerHTML = recent.map((entry, i) => {
                const prev = recent[i + 1];
                let delta = '', dClass = 'eq';
                if (prev) {
                    const diff = (+(entry.weight) - +(prev.weight)).toFixed(1);
                    if (+diff < 0) { delta = `▼ ${diff}`; dClass = 'dn'; }
                    else if (+diff > 0) { delta = `▲ +${diff}`; dClass = 'up'; }
                    else { delta = `— 0.0`; dClass = 'eq'; }
                }
                const label = i === 0 ? 'HOY' : formatShortDate(entry.date);
                return `<div class="pd-evol-card${i===0?' first':''}">
                    <div class="pd-evol-date">${label}</div>
                    <div class="pd-evol-w">${(+entry.weight).toFixed(1)}</div>
                    <div class="pd-evol-unit">kg</div>
                    ${delta ? `<div class="pd-evol-delta ${dClass}">${delta}</div>` : ''}
                </div>`;
            }).join('');
            // SPARKLINE (hasta 10 puntos de peso)
            const spark = get('pd-spark-svg');
            if (spark && recent.length >= 2) {
                const pts = recent.slice().reverse(); // cronológico
                const weights = pts.map(p => +(p.weight));
                const waists  = pts.map(p => +(p.waist || 0));
                const W = 310, H = 58, pad = 4;
                const minW = Math.min(...weights) - 1, maxW = Math.max(...weights) + 1;
                const toY = v => H - pad - ((v - minW) / (maxW - minW + 0.001)) * (H - pad * 2);
                const toX = i => (i / (pts.length - 1)) * W;
                const wPath = weights.map((v, i) => `${i===0?'M':'L'}${toX(i).toFixed(1)},${toY(v).toFixed(1)}`).join(' ');
                const aPath = wPath + ` L${W},${H} L0,${H}Z`;
                const hasWaist = waists.some(v => v > 0);
                const cPath = hasWaist ? waists.map((v, i) => `${i===0?'M':'L'}${toX(i).toFixed(1)},${toY(v).toFixed(1)}`).join(' ') : '';
                const lastX = toX(pts.length - 1).toFixed(1);
                const lastY = toY(weights[weights.length - 1]).toFixed(1);
                // Leer color del tema activo (responde a NEON/GOLD/CORAL/etc.)
                const themeStyles = getComputedStyle(document.body);
                const accentMain = (themeStyles.getPropertyValue('--accent-main') || '#00c97a').trim();
                const accentSec  = (themeStyles.getPropertyValue('--accent-secondary') || '#00e5ff').trim();
                spark.innerHTML = `
                    <defs>
                        <linearGradient id="pdSG" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" style="stop-color:${accentMain};stop-opacity:.28"/>
                            <stop offset="100%" style="stop-color:${accentMain};stop-opacity:0"/>
                        </linearGradient>
                    </defs>
                    <path d="${aPath}" fill="url(#pdSG)" opacity=".7"/>
                    <path d="${wPath}" fill="none" stroke="${accentMain}" stroke-width="2" stroke-linecap="round"/>
                    ${cPath ? `<path d="${cPath}" fill="none" stroke="${accentSec}" stroke-width="1.5" stroke-dasharray="4 2" opacity=".7"/>` : ''}
                    <circle cx="${lastX}" cy="${lastY}" r="3" fill="${accentMain}"/>`;
                get('pd-spark-svg').parentElement.style.display = '';
            }
        } else if (evolSection) {
            evolSection.style.display = 'none';
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
            // Tier: usa b.tier o b.t (definiciones) o calcula por nombre. Default 1 (bronce).
            const getTier = (b) => +(b.tier || b.t || 1);
            scroll.innerHTML = unlockedB.map(b =>
                `<div class="pd-badge"><div class="pd-badge-icon unlocked t${getTier(b)}">${b.emoji || b.icon || '🏅'}</div><div class="pd-badge-name">${(b.name || b.title || '').toUpperCase()}</div></div>`
            ).join('') + Array.from({length: lockedCount}).map(() =>
                `<div class="pd-badge locked"><div class="pd-badge-icon locked">🔒</div><div class="pd-badge-name">???</div></div>`
            ).join('');
        }
        set('pd-badges-count', ach.length);
        set('pd-badges-total', '/' + (ACHIEVEMENT_DEFS.length || allBadges.length)); // total honesto (insignias reales)

        // PRÓXIMO LOGRO — calcular siguiente insignia y actualizar card
        try {
            const nextBadge = allBadges.find(b => !ach.includes(b.id));
            const totalB = allBadges.length || 100;
            const earnedB = ach.length;
            const pct = totalB > 0 ? Math.round((earnedB / totalB) * 100) : 0;
            if (nextBadge) {
                const nameEl = get('pd-next-ach-name');
                const iconEl = get('pd-next-ach-icon');
                const barEl  = get('pd-next-ach-bar');
                const pctEl  = get('pd-next-ach-pct');
                if (nameEl) nameEl.textContent = (nextBadge.name || nextBadge.title || 'PRÓXIMA INSIGNIA').toUpperCase();
                if (iconEl) iconEl.textContent  = nextBadge.emoji || nextBadge.icon || '🏅';
                if (barEl)  barEl.style.width   = pct + '%';
                if (pctEl)  pctEl.textContent   = pct + '%';
                set('pd-ach-pct-label', pct + '%');
            }
        } catch(e) {}
    }

    // Navegación rápida desde botones del hero
    window.pdGoToEvolution = function() {
        const link = document.querySelector('[data-page=evolution]');
        if (link) link.click();
    };

    // ═══════════════ AJUSTES iOS — Funciones de filas ═══════════════
    // ── Helpers modal nombre ──────────────────────────────────────────────────
    window.pmEditUserName = function() {
        try {
            const ud = window.userData || userData || {};
            // PRIORIDAD: AXProfile (clave inmune) > userData
            let cur = '';
            try { if (window.AXProfile && typeof window.AXProfile.getName === 'function') cur = (window.AXProfile.getName() || '').trim(); } catch(_) {}
            if (!cur || cur.toLowerCase() === 'atleta') cur = (ud.userName || '').trim();
            const low = cur.toLowerCase();
            if (!cur || low === 'admin' || low === 'atleta' || low === 'usuario') cur = '';

            const modal = document.getElementById('pm-name-modal');
            const input = document.getElementById('pm-name-input');
            if (!modal || !input) {
                // Fallback si el modal no existe
                const v = prompt('Nombre de usuario:', cur);
                if (v === null) return;
                pmApplyNewName(v.trim());
                return;
            }
            input.value = cur;
            modal.style.display = 'flex';
            setTimeout(() => input.focus(), 80);
            // Cerrar al hacer clic fuera del panel
            modal.onclick = function(e) { if (e.target === modal) pmCloseNameModal(); };
            // Confirmar con Enter
            input.onkeydown = function(e) {
                if (e.key === 'Enter') { e.preventDefault(); pmConfirmName(); }
                if (e.key === 'Escape') pmCloseNameModal();
            };
        } catch (e) { console.warn('[pmEditUserName]', e.message); }
    };

    window.pmConfirmName = function() {
        const input = document.getElementById('pm-name-input');
        if (!input) return;
        const newName = input.value.trim();
        if (newName.length < 1) { input.focus(); return; }
        pmApplyNewName(newName);
        pmCloseNameModal();
    };

    window.pmCloseNameModal = function() {
        const modal = document.getElementById('pm-name-modal');
        if (modal) modal.style.display = 'none';
    };

    function pmApplyNewName(newName) {
        try {
            // DELEGAR al sistema robusto AXProfile (clave única, persistencia inmune)
            if (window.AXProfile && typeof window.AXProfile.saveName === 'function') {
                window.AXProfile.saveName(newName);
            }
            // Sincronizar también con userData para compatibilidad con código viejo
            userData.userName = newName;
            userData.username = newName;
            window.userData = userData;
            try { saveData(); } catch(e) { console.warn('[pmApplyNewName] saveData:', e.message); }

            // Actualizar la interfaz de forma inmediata sin recargar la página
            if (typeof window.syncProfileEverywhere === 'function') {
                window.syncProfileEverywhere();
            } else if (typeof applySettings === 'function') {
                applySettings();
            }

            pmShowToast('✓ Nombre actualizado', 'green');
        } catch (e) { console.warn('[pmApplyNewName]', e.message); }
    }

    // ── Helpers modal contraseña ──────────────────────────────────────────────
    window.pmChangePassword = function() {
        const modal = document.getElementById('pm-pass-modal');
        if (!modal) { alert('Función de cambio de contraseña no disponible.'); return; }
        // Limpiar campos
        ['pm-pass-current','pm-pass-new','pm-pass-new2'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.value = '';
        });
        const errDiv = document.getElementById('pm-pass-err');
        if (errDiv) errDiv.style.display = 'none';
        modal.style.display = 'flex';
        setTimeout(() => { const el = document.getElementById('pm-pass-current'); if (el) el.focus(); }, 80);
        modal.onclick = function(e) { if (e.target === modal) pmClosePassModal(); };
    };

    window.pmClosePassModal = function() {
        const modal = document.getElementById('pm-pass-modal');
        if (modal) modal.style.display = 'none';
    };

    window.pmConfirmPassword = async function() {
        const cur = (document.getElementById('pm-pass-current')?.value || '').trim();
        const nw  = (document.getElementById('pm-pass-new')?.value  || '').trim();
        const nw2 = (document.getElementById('pm-pass-new2')?.value || '').trim();
        const errDiv = document.getElementById('pm-pass-err');
        const showErr = (msg) => { if (errDiv) { errDiv.textContent = msg; errDiv.style.display = 'block'; } };

        if (!cur) { showErr('⚠️ Escribe tu contraseña actual.'); return; }
        const storedCred = (userData.passHash != null) ? userData.passHash : userData.password;
        if (!(await window.axPassVerify(storedCred, cur))) { showErr('⚠️ Contraseña actual incorrecta.'); return; }
        if (nw.length < 4) { showErr('⚠️ La nueva contraseña debe tener al menos 4 caracteres.'); return; }
        if (nw !== nw2)   { showErr('⚠️ Las contraseñas nuevas no coinciden.'); return; }

        userData.passHash = await window.axPassHash(nw);
        delete userData.password;
        saveData();

        // Intentar actualizar en el backend si hay token
        if (typeof apiToken === 'function' && apiToken() && typeof API_URL !== 'undefined') {
            try {
                await fetch(`${API_URL}/api/user/change-password`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', ...(typeof apiAuthHeaders === 'function' ? apiAuthHeaders() : {}) },
                    body: JSON.stringify({ currentPassword: cur, newPassword: nw })
                });
            } catch(e) { /* Se guardó localmente igual */ }
        }

        pmClosePassModal();
        pmShowToast('🔒 Contraseña actualizada', 'green');
    };

    // ── Toast reutilizable ────────────────────────────────────────────────────
    function pmShowToast(msg, color) {
        const bgMap = { green: 'rgba(0,201,122,.95)', red: 'rgba(239,68,68,.95)', blue: 'rgba(0,229,255,.95)' };
        const t = document.createElement('div');
        t.textContent = msg;
        t.style.cssText = `position:fixed;bottom:90px;left:50%;transform:translateX(-50%);
            background:${bgMap[color]||bgMap.green};color:#000;font-family:'Oswald',sans-serif;
            font-weight:700;letter-spacing:1px;padding:10px 20px;border-radius:99px;
            box-shadow:0 8px 24px rgba(0,0,0,.4);z-index:99998;font-size:12px;
            white-space:nowrap;`;
        document.body.appendChild(t);
        setTimeout(() => t.remove(), 2200);
    }

    window.pmSetTheme = function(themeName) {
        try {
            userData.theme = themeName;
            if (typeof checkAchievements === 'function') checkAchievements();
            document.body.setAttribute('data-theme', themeName);
            // Marcar el swatch activo
            document.querySelectorAll('.t-swatch').forEach(btn => {
                if (btn.dataset.theme === themeName) btn.classList.add('active');
                else btn.classList.remove('active');
            });
            // Destruir gráficas para que recojan los nuevos colores del tema
            if (typeof chartWeight !== 'undefined' && chartWeight) { chartWeight.destroy(); chartWeight = null; }
            if (typeof chartCalories !== 'undefined' && chartCalories) { chartCalories.destroy(); chartCalories = null; }
            if (typeof chartWaist !== 'undefined' && chartWaist) { chartWaist.destroy(); chartWaist = null; }
            if (typeof chartHistory !== 'undefined' && chartHistory) { chartHistory.destroy(); chartHistory = null; }
            saveData();
            if (typeof updateDashboard === 'function') updateDashboard();
            if (typeof applySettings === 'function') applySettings();
            const toastFn = typeof pmShowToast === 'function' ? pmShowToast : null;
            if (toastFn) {
                const nombres = {
                    cyberpunk: 'VERDE',
                    black: 'NEGRO',
                    pink: 'ROSA',
                    pastel: 'LILA',
                    azul: 'AZUL',
                    violeta: 'VIOLETA',
                    cafe: 'CAFÉ',
                    rojo: 'ROJO',
                    dorado: 'DORADO',
                    neon: 'NEON'
                };
                toastFn('✦ Tema: ' + (nombres[themeName] || themeName.toUpperCase()), 'green');
            }
        } catch (e) {
            console.warn('[pmSetTheme]', e.message);
        }
    };

    window.pmEditPhoto = function() {
        // Usar el <input> real del DOM en vez de crear uno dinámico (más compatible en móvil)
        const realInput = document.getElementById('pm-avatar-file-input');
        if (realInput) {
            realInput.click();
        } else {
            // Fallback: crear dinámicamente si el elemento no existe
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*';
            input.style.display = 'none';
            document.body.appendChild(input);
            input.onchange = (e) => { pmHandlePhotoChange(e.target); input.remove(); };
            input.click();
        }
    };

    // Handler compartido para el cambio de foto — DELEGA al sistema robusto AXProfile
    // (compresión agresiva a 256x256 JPEG q=0.55 → ~20KB → cabe en localStorage)
    window.pmHandlePhotoChange = function(inputEl) {
        if (window.AXProfile && typeof window.AXProfile.handleFileInput === 'function') {
            window.AXProfile.handleFileInput(inputEl);
            return;
        }
        // Fallback: si AXProfile no cargó, lógica antigua mínima
        const file = inputEl?.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => pmSaveAvatar(ev.target.result);
        reader.readAsDataURL(file);
    };

    // Guarda la foto delegando al sistema robusto AXProfile.
    // CRÍTICO: NO se mete la foto en userData (causaba QuotaExceededError al
    // hacer JSON.stringify(userData) → impedía persistir cualquier cosa).
    function pmSaveAvatar(dataUrl) {
        if (window.AXProfile && typeof window.AXProfile.savePhoto === 'function') {
            window.AXProfile.savePhoto(dataUrl);
            return;
        }
        // Fallback de emergencia (solo si profile-persist.js no cargó)
        try {
            localStorage.setItem('axcore_profile_v1', JSON.stringify({ photo: dataUrl, updatedAt: Date.now() }));
        } catch(e) { console.warn('[pmSaveAvatar fallback]', e.message); }
    }

    // Actualizar visibilidad de "Instalar en dispositivo"
    window.pmSyncInstallRow = function() {
        const val = document.getElementById('pmInstallVal');
        if (!val) return;
        // Si hay deferredPrompt → mostrar DISPONIBLE
        if (deferredPrompt) {
            val.textContent = 'DISPONIBLE ›';
            val.classList.add('available');
        } else {
            val.textContent = 'NO DISPONIBLE ›';
            val.classList.remove('available');
        }
    };

    // ═══════════════ SINCRONIZACIÓN DE PERFIL EN TODA LA INTERFAZ ═══════════════
    /**
     * syncProfileEverywhere — actualiza nombre y foto de perfil en TODOS los
     * elementos visuales de la app: header, hero de ajustes, logros, etc.
     * Llámala siempre que el nombre o la foto cambie.
     */
    window.syncProfileEverywhere = function() {
        try {
            const ud = window.userData || userData || {};
            // Jerarquía: userName (display elegido) → username (login) → currentUser (sesión) → USUARIO
            // Jerarquía: PRIORIDAD #1 AXProfile (clave inmune); luego clave separada legacy; luego userData
            const _bset3 = new Set(['', 'atleta', 'admin', 'usuario']);
            const _san3  = (v) => { const s=(v||'').toString().trim(); return _bset3.has(s.toLowerCase()) ? '' : s; };
            let _axName3 = '', _axPhoto3 = null;
            try {
                if (window.AXProfile) {
                    if (typeof window.AXProfile.getName === 'function')  _axName3  = window.AXProfile.getName()  || '';
                    if (typeof window.AXProfile.getPhoto === 'function') _axPhoto3 = window.AXProfile.getPhoto() || null;
                }
            } catch(_) {}
            const _persistName = currentUser ? localStorage.getItem('axcore_uname_' + currentUser) : null;
            const _globalName  = localStorage.getItem('axcore_uname_global');
            const raw = _san3(_axName3) || _san3(_persistName) || _san3(_globalName) || _san3(ud.userName) || _san3(ud.username) || _san3(currentUser) || 'ATLETA';
            const nameUp = raw.toUpperCase();
            // Foto: AXProfile primero
            const _persistPhoto = currentUser ? localStorage.getItem('axcore_avatar_' + currentUser) : null;
            const _globalPhoto  = localStorage.getItem('axcore_avatar_global');
            const photo  = _axPhoto3 || _persistPhoto || _globalPhoto || ud.avatarPhoto || ud.avatar || null;

            // 1. Header superior: nombre y avatar
            const headerName = document.getElementById('display-username');
            if (headerName) {
                headerName.textContent = nameUp;
                headerName.style.setProperty('color', '#ffffff', 'important');
                headerName.style.setProperty('display', 'block', 'important');
                headerName.style.setProperty('visibility', 'visible', 'important');
                headerName.style.setProperty('opacity', '1', 'important');
            }

            const headerAvatar = document.getElementById('avatar-preview');
            if (headerAvatar) {
                if (photo) {
                    // Usar setProperty con !important para vencer cualquier regla CSS
                    headerAvatar.style.setProperty('background-image', `url("${photo}")`, 'important');
                    headerAvatar.style.setProperty('background-size', 'cover', 'important');
                    headerAvatar.style.setProperty('background-position', 'center', 'important');
                    headerAvatar.style.setProperty('background-repeat', 'no-repeat', 'important');
                    headerAvatar.textContent = '';
                } else {
                    // Sin foto: limpiar inline para que el CSS (gradiente + inicial) tome el control
                    headerAvatar.style.removeProperty('background-image');
                    headerAvatar.style.removeProperty('background-size');
                    headerAvatar.style.removeProperty('background-position');
                    headerAvatar.style.removeProperty('background-repeat');
                    headerAvatar.textContent = (raw[0] || 'A').toUpperCase();
                }
            }

            // 2. Hero del perfil en Ajustes
            const pmAvatar = document.getElementById('pmProfAvatar');
            if (pmAvatar) {
                if (photo) {
                    pmAvatar.style.background = `url(${photo}) center/cover`;
                    pmAvatar.textContent = '';
                } else {
                    pmAvatar.style.background = '';
                    pmAvatar.textContent = (raw[0] || 'A').toUpperCase();
                }
            }
            const pmName = document.getElementById('pmProfName');
            if (pmName) pmName.textContent = nameUp + ' ✎';

            // 3. Fila iOS de nombre en Ajustes
            const pmRowName = document.getElementById('pmSRowName');
            if (pmRowName) pmRowName.textContent = nameUp + ' ›';

            // 4. Sección de Logros
            const achUser = document.getElementById('ach-username');
            if (achUser) achUser.textContent = nameUp;

            // 5. Input de nombre en ajustes legacy (solo si no es el nombre placeholder)
            const legacyInput = document.getElementById('input-username');
            if (legacyInput && raw !== 'USUARIO') legacyInput.value = raw;

        } catch (e) { console.warn('[syncProfileEverywhere]', e.message); }
    };

    // ═══════════════ PROFILE HERO (Ajustes premium) ═══════════════
    window.updatePmProfileHero = function() {
        try {
            const ud = window.userData || userData || {};
            const setText = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };

            // Avatar: inicial del nombre (o foto si existe) — jerarquía limpia
            const _bset4 = new Set(['', 'atleta', 'admin', 'usuario']);
            const _san4  = (v) => { const s=(v||'').toString().trim(); return _bset4.has(s.toLowerCase()) ? '' : s; };
            let name = _san4(ud.userName) || _san4(ud.username) || _san4(currentUser) || 'ATLETA';
            const av = document.getElementById('pmProfAvatar');
            if (av) {
                if (ud.avatarPhoto) {
                    av.style.background = `url(${ud.avatarPhoto}) center/cover`;
                    av.textContent = '';
                } else {
                    av.style.background = '';
                    av.textContent = (name[0] || 'A').toUpperCase();
                }
            }

            // Nombre con icono de edición
            const nameEl = document.getElementById('pmProfName');
            if (nameEl) nameEl.textContent = name.toUpperCase() + ' ✎';

            // Sync nombre en fila iOS de Ajustes
            setText('pmSRowName', name.toUpperCase() + ' ›');

            // Stats: días, kg perdidos, insignias
            const history = Array.isArray(ud.history) ? ud.history : [];
            // "días" = días CALENDARIO distintos con registro (no cuenta doble si registras 2 veces el mismo día)
            const days = (typeof parseAppDate === 'function')
                ? new Set(history.map(h => parseAppDate(h.date).toDateString())).size
                : history.length;
            setText('pmProfDays', days);

            let lost = 0;
            if (history.length >= 2) {
                const first = +(history[0].weight) || 0;
                const last  = +(history[history.length - 1].weight) || 0;
                lost = Math.max(0, first - last);
            } else if (ud.startWeight && ud.weight) {
                lost = Math.max(0, (+ud.startWeight) - (+ud.weight));
            }
            setText('pmProfLost', lost.toFixed(1));

            const badges = Array.isArray(ud.achievements) ? ud.achievements.length : 0;
            setText('pmProfBadges', badges);
        } catch (e) {
            console.warn('[pm-profile-hero]', e.message);
        }
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
                    // Limpiar el PERFIL (nombre/foto) para no filtrarlo al siguiente
                    // usuario en dispositivos compartidos (ej. una tablet del gimnasio).
                    // NO se borran los datos del atleta (arthur_data_*) para no perder
                    // cuentas DEMO ni el historial guardado localmente.
                    try {
                        ['axcore_profile_v1', 'axcore_avatar_global', 'axcore_uname_global'].forEach(k => localStorage.removeItem(k));
                        Object.keys(localStorage).forEach(k => {
                            if (k.indexOf('axcore_avatar_') === 0 || k.indexOf('axcore_uname_') === 0) localStorage.removeItem(k);
                        });
                    } catch (_) {}
                    location.reload();
                }
                return;
            }

            const pageId = link.dataset.page;
            if (!pageId) return;

            // Reset de scroll al cambiar de sección
            const contentArea = document.querySelector('.content-area');
            if (contentArea) contentArea.scrollTop = 0;

            pages.forEach(p => p.classList.remove('active'));
            document.getElementById(`page-${pageId}`).classList.add('active');
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            // Persistir sección activa para que sobreviva al refrescar
            sessionStorage.setItem('axcore_active_page', pageId);
            
            if (pageId === 'diet') renderDietPage();
            if (pageId === 'workout') renderWorkoutPage();
            if (pageId === 'evolution') renderEvolutionPage('all');
            if (pageId === 'studio') renderStudioPage();
            if (pageId === 'assistant' && typeof window._activateCalculator === 'function') window._activateCalculator();
            if (pageId === 'settings' && typeof window.syncPremiumToggleVisual === 'function') window.syncPremiumToggleVisual();
            if (pageId === 'settings' && typeof window.updatePmProfileHero === 'function') window.updatePmProfileHero();
            if (pageId === 'settings' && typeof window.pmSyncInstallRow === 'function') window.pmSyncInstallRow();

            // SIEMPRE re-sincronizar el header al cambiar de página — garantiza
            // que el nombre y la foto del header reflejen los cambios hechos en Ajustes
            if (typeof window.syncProfileEverywhere === 'function') window.syncProfileEverywhere();

            // Sincronizar bottom nav premium
            document.querySelectorAll('.pm-nav-btn').forEach(btn => {
                btn.classList.toggle('active', btn.dataset.pmPage === pageId);
            });

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
                background: rgba(var(--accent-secondary-rgb),0.12); color: var(--accent-main);
                border: 1px solid rgba(var(--accent-secondary-rgb),0.4); border-radius: 30px;
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
            // Comprobación ultra-rápida por clases de contenedores con scroll horizontal en nuestra app
            // Esto evita llamar a getComputedStyle (provoca layout thrashing extremo en touchstart)
            if (el.classList) {
                if (el.classList.contains('studio-templates') || 
                    el.classList.contains('studio-metrics') ||
                    el.classList.contains('studio-pro-pills') ||
                    el.classList.contains('studio-pro-swatches') ||
                    el.classList.contains('studio-pro-tabs') ||
                    el.classList.contains('sx-tabbar') ||
                    el.classList.contains('theme-grid')) {
                    return true;
                }
            }
            return false;
        }

        function shouldBlock(target) {
            // Bloqueamos inputs de texto y textareas (el usuario escribe)
            if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') return true;
            // Recorremos hacia arriba buscando un scroller horizontal, la Bottom Sheet de Ajustes/Estudio o el panel de insignias
            let el = target;
            for (let i = 0; i < 8 && el; i++) {
                if (el.classList && (
                    el.classList.contains('sx-sheet') || 
                    el.classList.contains('sx-ach-bar') || 
                    el.classList.contains('sx-ach-body') || 
                    el.classList.contains('studio-modal-overlay') || 
                    el.classList.contains('studio-modal-container')
                )) {
                    return true;
                }
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
        if (filter === 'week') filtered = filtered.filter(h => parseAppDate(h.date) >= startOfWeek);
        if (filter === 'month') filtered = filtered.filter(h => parseAppDate(h.date) >= startOfMonth);

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

        // Datos para barra de calorías
        const calIn  = +(userData.caloriesConsumedToday || 0);
        const calLim = +(userData.dailyCalLimit || 0);
        const calAvail = Math.max(0, calLim - calIn);
        const calPct = calLim > 0 ? Math.min(100, Math.round((calIn / calLim) * 100)) : 0;
        const foodLog = Array.isArray(userData.foodLogToday) ? userData.foodLogToday : [];

        const formatMealText = (text) => {
            const t = (text || '').trim();
            return t ? t.replace(/\n/g, '<br>') : '<span style="opacity:0.5;font-style:italic;">Sin contenido — toca para agregar</span>';
        };

        dietEl.innerHTML = `
            <div class="pm-diet-wrap" style="max-width:800px; margin:0 auto;">
                <h2 class="pm-diet-h2">PLAN ALIMENTICIO</h2>

                <!-- BARRA DE CALORÍAS HOY -->
                <div class="pm-diet-bar">
                    <div class="pm-diet-bar-top">
                        <div>
                            <div class="pm-diet-bar-lbl">CALORÍAS HOY</div>
                            <div class="pm-diet-num"><span id="dCalIn">${calIn.toLocaleString()}</span> <span class="pm-diet-num-sep">/ <span id="dCalLim">${calLim.toLocaleString()}</span></span></div>
                        </div>
                        <div style="text-align:right;">
                            <div class="pm-diet-avail"><span id="dCalAvail">${calAvail.toLocaleString()}</span><small>disponibles</small></div>
                        </div>
                    </div>
                    <div class="pm-diet-bar-bg"><div id="dCalBar" class="pm-diet-bar-fill" style="width:${calPct}%;"></div></div>
                </div>

                <!-- PESTAÑAS -->
                <div class="pm-d-tabs">
                    <div class="pm-d-tab on" data-d-tab="plan">MI PLAN</div>
                    <div class="pm-d-tab" data-d-tab="log">REGISTRAR</div>
                    <div class="pm-d-tab" data-d-tab="rules">REGLAS</div>
                </div>

                <!-- ─── TAB MI PLAN ─── -->
                <div class="pm-d-panel on" id="pmDt-plan">
                    <div class="pm-d-meal ${diet.breakfast ? 'has-content' : ''}" data-meal="breakfast">
                        <div class="pm-d-meal-hdr"><span class="pm-d-meal-name">🌅 DESAYUNO</span><span class="pm-d-meal-icon">⛶</span></div>
                        <div class="pm-d-meal-body">${formatMealText(diet.breakfast)}</div>
                    </div>
                    <div class="pm-d-meal ${diet.lunch ? 'has-content' : ''}" data-meal="lunch">
                        <div class="pm-d-meal-hdr"><span class="pm-d-meal-name">☀️ COMIDA</span><span class="pm-d-meal-icon">⛶</span></div>
                        <div class="pm-d-meal-body">${formatMealText(diet.lunch)}</div>
                    </div>
                    <div class="pm-d-meal ${diet.dinner ? 'has-content' : ''}" data-meal="dinner">
                        <div class="pm-d-meal-hdr"><span class="pm-d-meal-name">🌙 CENA</span><span class="pm-d-meal-icon">⛶</span></div>
                        <div class="pm-d-meal-body">${formatMealText(diet.dinner)}</div>
                    </div>
                    <div class="pm-d-meal ${diet.snacks ? 'has-content' : ''}" data-meal="snacks">
                        <div class="pm-d-meal-hdr"><span class="pm-d-meal-name">🥕 SNACKS</span><span class="pm-d-meal-icon">⛶</span></div>
                        <div class="pm-d-meal-body">${formatMealText(diet.snacks)}</div>
                    </div>

                    <!-- INGRESO AUTOMÁTICO DE DIETA -->
                    <div class="pm-diet-import-card">
                        <div class="pm-diet-import-title">📥 INGRESO DE DIETA COMPLETA</div>
                        <div class="pm-diet-import-sub">Pega tu plan completo. El sistema lo distribuye en Desayuno · Comida · Cena · Snacks · Recomendaciones automáticamente.</div>
                        <textarea class="pm-diet-import-area" id="diet-full-import" placeholder="Ejemplo:&#10;Desayuno: 3 huevos revueltos + tortilla&#10;Comida: pechuga 200g + arroz integral + ensalada&#10;Cena: 2 tortillas con verduras&#10;Snacks: 1 manzana, 30g nueces&#10;Recomendaciones: 3L agua, ayuno 6PM-7AM"></textarea>
                        <button class="pm-diet-import-btn" id="btn-distribute-diet">⚡ DISTRIBUIR AUTOMÁTICAMENTE</button>
                    </div>
                    <button class="btn-premium pm-d-reset" id="btn-reset-diet" style="width:100%; margin-top:14px; background:transparent; border:1px solid rgba(255,51,102,.4); color:#ff3366;">🗑️ REINICIAR DIETA</button>
                </div>

                <!-- ─── TAB REGISTRAR ALIMENTO ─── -->
                <div class="pm-d-panel" id="pmDt-log">
                    <div class="pm-d-log-hint">Registra lo que comes HOY · suma al contador de calorías</div>
                    <div class="pm-d-food-row">
                        <input type="text" id="food-desc" class="pm-d-food-input" placeholder="Ej. 100g pollo y arroz...">
                        <button class="pm-d-food-add" id="btn-add-food">+ AGREGAR</button>
                    </div>
                    <div class="pm-d-food-log" id="pmFoodLogList">
                        ${foodLog.length === 0
                            ? '<div class="pm-d-food-empty">Sin registros hoy. Agrega tu primera comida arriba ↑</div>'
                            : foodLog.map((f, i) => `<div class="pm-d-food-item"><span class="pm-d-food-name">${(f.desc || '').toString().replace(/</g,'&lt;')}</span><span class="pm-d-food-cal">${f.cal || 0}<small>kcal</small></span><button class="pm-d-food-del" onclick="window.deleteFoodLog(${i})" title="Quitar este registro" aria-label="Quitar" style="background:transparent;border:none;color:#ff5c6c;font-size:1rem;line-height:1;cursor:pointer;padding:2px 8px;margin-left:6px;flex-shrink:0;">✕</button></div>`).join('')
                        }
                    </div>
                </div>

                <!-- ─── TAB REGLAS ─── -->
                <div class="pm-d-panel" id="pmDt-rules">
                    <div class="pm-d-log-hint">Reglas de tu plan + protocolo base AX-CORE</div>
                    <div class="pm-d-rules-list" id="rules-list-display">
                        ${rules.length > 0
                            ? rules.map((r, i) => `<div class="pm-d-rule"><div class="pm-d-rule-num">${i+1}</div><div class="pm-d-rule-txt">${r}</div></div>`).join('')
                            : '<div class="pm-d-rule"><div class="pm-d-rule-num">!</div><div class="pm-d-rule-txt" style="opacity:.6;font-style:italic;">Sin reglas aún. Pulsa EDITAR REGLAS para agregar.</div></div>'
                        }
                    </div>
                    <button class="btn-premium" id="btn-edit-rules" style="width:100%; margin-top:14px;">✏️ EDITAR REGLAS</button>
                </div>
            </div>
        `;

        // ─── Lógica de pestañas ───
        dietEl.querySelectorAll('.pm-d-tab').forEach(tab => {
            tab.onclick = () => {
                const target = tab.dataset.dTab;
                dietEl.querySelectorAll('.pm-d-tab').forEach(t => t.classList.toggle('on', t === tab));
                dietEl.querySelectorAll('.pm-d-panel').forEach(p => p.classList.toggle('on', p.id === `pmDt-${target}`));
            };
        });

        // ─── Click en meal card: abre modal de comida a pantalla completa ───
        dietEl.querySelectorAll('.pm-d-meal').forEach(card => {
            card.onclick = () => {
                openMealModal(card.dataset.meal);
            };
        });

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

        // Distribuir dieta completa automáticamente y guardar de inmediato
        document.getElementById('btn-distribute-diet').onclick = () => {
            const raw = document.getElementById('diet-full-import').value.trim();
            if (!raw) { alert('Escribe o pega tu dieta primero.'); return; }
            const parsed = parseDietText(raw);
            const hasData = parsed.breakfast || parsed.lunch || parsed.dinner || parsed.snacks || parsed.recommendations;
            if (!hasData) {
                alert('No se encontraron secciones reconocibles.\nUsa palabras como "Desayuno:", "Comida:", "Cena:", "Snacks:", "Recomendaciones:" para que la app las detecte.');
                return;
            }
            if (parsed.breakfast) userData.recommendedDiet.breakfast = parsed.breakfast;
            if (parsed.lunch)     userData.recommendedDiet.lunch = parsed.lunch;
            if (parsed.dinner)    userData.recommendedDiet.dinner = parsed.dinner;
            if (parsed.snacks)    userData.recommendedDiet.snacks = parsed.snacks;
            
            // Recomendaciones detectadas → se convierten en reglas custom
            if (parsed.recommendations) {
                const newRules = parsed.recommendations.split('\n').map(l => l.trim()).filter(l => l.length > 3);
                if (newRules.length > 0) {
                    userData.customDietRules = newRules;
                }
            }
            saveData();
            document.getElementById('diet-full-import').value = '';
            renderDietPage();
            const recsMsg = parsed.recommendations ? '\n💡 También detecté reglas/recomendaciones y se guardaron como reglas custom.' : '';
            alert('✅ Dieta distribuida y guardada de inmediato.' + recsMsg);
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

        // Quitar una comida ya registrada hoy y DESHACER su efecto en el contador
        // de calorías y en el déficit (revierte exactamente lo que hizo registerFood).
        window.deleteFoodLog = function(i) {
            const list = Array.isArray(userData.foodLogToday) ? userData.foodLogToday : [];
            const item = list[i];
            if (!item) return;
            if (!confirm(`¿Quitar "${item.desc}" (${item.cal || 0} kcal) del registro de hoy?`)) return;
            const cal = +item.cal || 0;
            userData.caloriesConsumedToday = Math.max(0, (+userData.caloriesConsumedToday || 0) - cal);
            userData.totalNetDeficit = (+userData.totalNetDeficit || 0) + Math.round(cal * 0.15); // revierte el ajuste de registerFood
            userData.totalFoodLogs = Math.max(0, (+userData.totalFoodLogs || 0) - 1);
            list.splice(i, 1);
            saveData();
            updateDashboard();
            renderDietPage();
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
        const woLog = Array.isArray(userData.workoutLogToday) ? userData.workoutLogToday : [];
        // Construye la lista de ejercicios registrados hoy (con botón para quitar).
        const woLogHtml = (list) => (list.length === 0
            ? '<div style="text-align:center;color:var(--text-dim);font-size:0.72rem;padding:12px;">Aún no registras ejercicios hoy. Pulsa ✓ en un ejercicio para sumarlo.</div>'
            : list.map((w, i) => `<div style="display:flex;align-items:center;justify-content:space-between;gap:8px;padding:9px 12px;border-bottom:1px solid rgba(255,255,255,0.06);">
                    <span style="font-size:0.8rem;color:var(--text-main);flex:1;min-width:0;">${(w.name || '').toString().replace(/</g,'&lt;')} <small style="color:var(--text-dim);">${(w.detail || '').toString().replace(/</g,'&lt;')} · ${w.time || ''}</small></span>
                    <span style="font-family:var(--font-accent);color:var(--accent-secondary);font-size:0.8rem;white-space:nowrap;">-${w.cal || 0} kcal</span>
                    <button onclick="window.deleteWorkoutLog(${i})" title="Quitar este ejercicio" aria-label="Quitar" style="background:transparent;border:none;color:#ff5c6c;font-size:1rem;line-height:1;cursor:pointer;padding:2px 8px;flex-shrink:0;">✕</button>
                </div>`).join('')
        );
        workoutEl.innerHTML = `
            <div class="glass-card workout-plan">
                <div class="stopwatch-container">
                    <h2 style="font-family:var(--font-accent); font-size:0.75rem; color:var(--accent-secondary); letter-spacing: 1.5px; margin-bottom: 2px;">CRONÓMETRO DE ALTO RENDIMIENTO</h2>
                    <p style="font-size:0.55rem; color:var(--text-dim); margin-bottom:0.3rem;">⚡ El cronómetro sigue corriendo aunque cambies de sección</p>
                    <div class="timer-display" id="sw-display" style="font-variant-numeric: tabular-nums; min-width: 220px; font-size: inherit; margin: 0;">${formatSwTime(swTimer)}</div>
                    <div class="timer-controls" style="margin-top: 6px;">
                        <button class="btn-premium" id="btn-sw-start" style="font-size:0.55rem; padding:0.4rem 0.8rem; border-radius: 99px;">${swRunning ? '⏱️ CORRIENDO...' : 'INICIAR'}</button>
                        <button class="btn-premium" id="btn-sw-stop" style="font-size:0.55rem; padding:0.4rem 0.8rem; border-radius: 99px;">PAUSAR</button>
                        <button class="btn-premium" id="btn-sw-reset" style="font-size:0.55rem; padding:0.4rem 0.8rem; border-radius: 99px; background:transparent; border-color:var(--accent-alert); color:var(--accent-alert);">REINICIAR</button>
                    </div>
                </div>

                <div class="pm-workout-filters" id="pm-wf-bar">
                    <button class="pm-wf-chip active-todos" data-filter="todos">TODOS</button>
                    <button class="pm-wf-chip" data-filter="cardio">CARDIO</button>
                    <button class="pm-wf-chip" data-filter="hiit">HIIT</button>
                    <button class="pm-wf-chip" data-filter="pierna">PIERNA</button>
                    <button class="pm-wf-chip" data-filter="gluteo">GLÚTEO</button>
                    <button class="pm-wf-chip" data-filter="pecho">PECHO</button>
                    <button class="pm-wf-chip" data-filter="hombro">HOMBRO</button>
                </div>
                <div class="exercise-catalog" id="pm-ex-catalog">
                    ${ARTHUR_KNOWLEDGE.exercises_catalog.map((ex, i) => {
                        const unit = ex.unit || (ex.type === 'Cardio' || ex.type === 'HIIT' ? 'Minutos' : 'Series');
                        const baseVal = ex.baseVal || (ex.type === 'Cardio' || ex.type === 'HIIT' ? 30 : 4);
                        const typeSlug = (ex.type || '')
                            .toLowerCase()
                            .replace(/á/g, 'a').replace(/é/g, 'e').replace(/í/g, 'i').replace(/ó/g, 'o').replace(/ú/g, 'u')
                            .replace(/ñ/g, 'n').replace(/\s+/g, '-');
                        const filterKey = typeSlug.startsWith('hombro') ? 'hombro'
                            : typeSlug.startsWith('pierna') || typeSlug === 'pantorrilla' ? 'pierna'
                            : typeSlug.startsWith('gluteo') ? 'gluteo'
                            : typeSlug.startsWith('pecho') || typeSlug === 'espalda' ? 'pecho'
                            : typeSlug.startsWith('cardio') ? 'cardio'
                            : typeSlug.startsWith('hiit') ? 'hiit'
                            : typeSlug;
                        const badgeClass = typeSlug === 'hiit' ? 'hiit' : typeSlug === 'cardio' ? 'cardio' : 'fuerza';
                        return `
                        <div class="exercise-card" data-ex-type="${typeSlug}" data-filter-key="${filterKey}" data-ex-name="${ex.name}">
                            <div>
                                <span class="ex-badge ${badgeClass}">${ex.type}</span>
                                <h4 class="ex-title">${ex.name}</h4>
                                <small class="ex-desc">${ex.desc}</small>
                            </div>
                            <div>
                                <div class="ex-cal-info">~${ex.cal} cal / ${baseVal} ${unit.toLowerCase().includes('minutos') ? 'min' : 'series'}</div>
                                <div class="ex-input-row">
                                    <div class="ex-input-wrapper">
                                        <input type="number" class="ex-input ex-num" value="${baseVal}">
                                        <span class="ex-unit-lbl">${unit.toLowerCase().includes('minutos') ? 'min' : 'series'}</span>
                                    </div>
                                    <button class="btn-ex-check ex-ok" data-base-cal="${ex.cal}" data-base-unit="${baseVal}" title="Registrar rápido">✓</button>
                                </div>
                            </div>
                        </div>
                    `}).join('')}
                </div>

                <div class="wo-total-box">
                    <div class="wo-total-lbl">TOTAL QUEMADO HOY</div>
                    <div class="wo-total-val"><span id="wo-total-calories-num">${userData.caloriesBurnedToday || 0}</span> <span class="wo-total-unit">KCAL</span></div>
                </div>

                <div class="glass-card" style="margin-top:14px; padding:6px 4px;">
                    <div style="font-family:var(--font-accent); font-size:0.7rem; color:var(--accent-secondary); letter-spacing:1.5px; text-align:center; padding:8px;">EJERCICIOS DE HOY</div>
                    <div id="woLogList">${woLogHtml(woLog)}</div>
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

        // Filtros de workout
        document.querySelectorAll('#pm-wf-bar .pm-wf-chip').forEach(chip => {
            chip.onclick = () => {
                const filter = chip.dataset.filter;
                // Actualizar chip activo
                document.querySelectorAll('#pm-wf-bar .pm-wf-chip').forEach(c => {
                    c.className = 'pm-wf-chip';
                });
                chip.classList.add(`active-${filter}`);
                // Mostrar/ocultar tarjetas
                document.querySelectorAll('#pm-ex-catalog .exercise-card').forEach(card => {
                    if (filter === 'todos' || card.dataset.filterKey === filter) {
                        card.style.display = '';
                    } else {
                        card.style.display = 'none';
                    }
                });
            };
        });

        // Refresca solo la lista de ejercicios registrados (sin re-render total).
        function renderWoLogList() {
            const box = document.getElementById('woLogList');
            if (box) box.innerHTML = woLogHtml(Array.isArray(userData.workoutLogToday) ? userData.workoutLogToday : []);
        }

        // Quitar un ejercicio registrado hoy y DESHACER las calorías quemadas.
        window.deleteWorkoutLog = function(i) {
            const list = Array.isArray(userData.workoutLogToday) ? userData.workoutLogToday : [];
            const item = list[i];
            if (!item) return;
            if (!confirm(`¿Quitar "${item.name}" (-${item.cal || 0} kcal) del registro de hoy?`)) return;
            const cal = +item.cal || 0;
            userData.caloriesBurnedToday = Math.max(0, (+userData.caloriesBurnedToday || 0) - cal);
            userData.totalNetDeficit = (+userData.totalNetDeficit || 0) - cal; // revierte el += de registerExercise
            userData.totalCaloriesBurned = Math.max(0, (+userData.totalCaloriesBurned || 0) - cal);
            userData.totalWorkouts = Math.max(0, (+userData.totalWorkouts || 0) - 1);
            list.splice(i, 1);
            saveData();
            updateDashboard();
            renderWoLogList();
            const totalNum = document.getElementById('wo-total-calories-num');
            if (totalNum) totalNum.textContent = userData.caloriesBurnedToday || 0;
        };

        // Helper para registrar calorías desde una tarjeta
        function registerExercise(card, btn, baseCal, baseUnit) {
            const val = parseFloat(card.querySelector('.ex-input').value) || 0;
            if (val <= 0) return;
            const realCal = Math.round((baseCal / baseUnit) * val);
            userData.caloriesBurnedToday += realCal;
            userData.totalNetDeficit += realCal;
            // Contadores acumulados (para las insignias de ejercicio).
            userData.totalCaloriesBurned = (+userData.totalCaloriesBurned || 0) + realCal;
            userData.totalWorkouts = (+userData.totalWorkouts || 0) + 1;
            // Guardar el ejercicio en el registro del día (para poder verlo/quitarlo).
            if (!Array.isArray(userData.workoutLogToday)) userData.workoutLogToday = [];
            const unitLbl = (card.querySelector('.ex-unit-lbl')?.textContent || '').trim();
            userData.workoutLogToday.push({
                time: new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }),
                name: card.dataset.exName || 'Ejercicio',
                detail: `${val} ${unitLbl}`.trim(),
                cal: realCal
            });
            saveData();
            updateDashboard();
            renderWoLogList();
            if (typeof checkAchievements === 'function') checkAchievements();

            // Badge acumulado pequeño y ordenado al lado del título
            let badge = card.querySelector('.ex-badge-accumulated');
            if (!badge) {
                badge = document.createElement('span');
                badge.className = 'ex-badge-accumulated';
                badge.style.cssText = 'display:inline-block; background:var(--accent-main); color:#000; font-size:0.55rem; font-weight:bold; padding:1px 5px; border-radius:6px; margin-left:6px; vertical-align:middle;';
                card.querySelector('.ex-title').appendChild(badge);
            }
            const newTotal = parseInt(badge.dataset.total || '0') + realCal;
            badge.dataset.total = newTotal;
            badge.textContent = `+${newTotal} cal`;

            // Actualizar total quemado hoy en calorías al final de la página
            const totalNum = document.getElementById('wo-total-calories-num');
            if (totalNum) {
                totalNum.textContent = userData.caloriesBurnedToday || 0;
            }
            return realCal;
        }

        // Botón checkmark (círculo relleno) — registrar con valor actual
        document.querySelectorAll('.btn-ex-check').forEach(btn => {
            btn.onclick = (e) => {
                const card = e.target.closest('.exercise-card');
                const realCal = registerExercise(card, btn, parseInt(btn.dataset.baseCal), parseInt(btn.dataset.baseUnit));
                if (!realCal) return;
                
                // Efecto de feedback visual rápido en el checkmark
                const originalText = btn.textContent;
                btn.textContent = '✓';
                btn.style.transform = 'scale(1.25)';
                setTimeout(() => { 
                    btn.style.transform = ''; 
                }, 300);
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

    document.addEventListener('click', (e) => {
        const themeBtn = e.target.closest('.theme-buttons .theme-btn');
        if (themeBtn) {
            const theme = themeBtn.dataset.theme;
            userData.theme = theme;
            if (typeof checkAchievements === 'function') checkAchievements();
            applySettings();
            // Destruir gráficas previas para que se recreen con el color del tema
            try { if (chartWeight) { chartWeight.destroy(); chartWeight = null; } } catch(_){}
            try { if (chartCalories) { chartCalories.destroy(); chartCalories = null; } } catch(_){}
            try { if (chartWaist) { chartWaist.destroy(); chartWaist = null; } } catch(_){}
            try { if (chartHistory) { chartHistory.destroy(); chartHistory = null; } } catch(_){}
            updateDashboard();
            saveData();
        }
    });

    // SHARE BUTTONS
    const btnShareApp = document.getElementById('btn-share-app');
    if (btnShareApp) {
        btnShareApp.onclick = () => pmShareApp();
    }

    // ── Funciones globales de compartir e instalar (llamadas desde ajustes) ──
    window.pmShareApp = function() {
        const APP_URL = 'https://arthur-arias-martinez.github.io/axcore-app/';
        if (navigator.share) {
            navigator.share({
                title: 'AX-CORE By Arthur',
                text: 'Únete a la vanguardia de la optimización biológica con AX-CORE.',
                url: APP_URL
            }).catch(err => console.warn('[pmShareApp]', err));
        } else {
            // Fallback: copiar al portapapeles
            if (navigator.clipboard) {
                navigator.clipboard.writeText(APP_URL).then(() => {
                    pmShowToast('🔗 Enlace copiado', 'blue');
                }).catch(() => pmShowToast('Enlace: ' + APP_URL, 'blue'));
            } else {
                pmShowToast('Enlace: ' + APP_URL, 'blue');
            }
        }
    };

    window.pmInstallApp = function() {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            deferredPrompt.userChoice.then(result => {
                if (result.outcome === 'accepted') {
                    pmShowToast('✓ App instalada', 'green');
                } else {
                    pmShowToast('Instalación cancelada', 'blue');
                }
                deferredPrompt = null;
                if (typeof window.pmSyncInstallRow === 'function') window.pmSyncInstallRow();
            });
        } else {
            pmShowToast('Ya está instalada o no disponible', 'blue');
        }
    };

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
        heroMetric: 'deficit',     // métrica principal (número grande)
        activeTab: 'diseno'        // tab activo — persiste entre renderStudioPage() calls
    };

    const STUDIO_BG_IMAGES = {};
    let isStudioPreloading = false;
    let STUDIO_LOGO_IMG = null;

    let _studioLoadPromise = null;

    async function preloadStudioImages() {
        if (Object.keys(STUDIO_BG_IMAGES).length > 0 && STUDIO_LOGO_IMG) return;
        if (_studioLoadPromise) return _studioLoadPromise;

        _studioLoadPromise = (async () => {
            // 1. Cargar el logo y la imagen del fondo activo en paralelo (dibujo inmediato de la preview)
            const activeTplId = studioState.tpl;
            const activeTpl = STUDIO_TEMPLATES.find(t => t.id === activeTplId) || STUDIO_TEMPLATES[0];

            await Promise.all([
                new Promise((r) => {
                    const l = new Image(); l.crossOrigin = 'anonymous';
                    l.onload = () => { STUDIO_LOGO_IMG = l; _studioTryRedraw(); r(); };
                    l.onerror = () => { r(); };
                    l.src = 'logo.png';
                }),
                new Promise((r) => {
                    if (activeTplId === 'custom') { r(); return; }
                    const img = new Image(); img.crossOrigin = 'anonymous';
                    img.onload = () => { STUDIO_BG_IMAGES[activeTplId] = img; _studioTryRedraw(activeTplId); r(); };
                    img.onerror = () => { r(); };
                    img.src = activeTpl.bg;
                })
            ]);

            // 2. Cargar las demás imágenes en segundo plano de forma progresiva con delay
            // Esto permite que el canvas principal pinte de inmediato y la UI no tenga lag
            setTimeout(() => {
                STUDIO_TEMPLATES.forEach(tpl => {
                    if (tpl.id === activeTplId) return;
                    const img = new Image(); img.crossOrigin = 'anonymous';
                    img.onload = () => {
                        STUDIO_BG_IMAGES[tpl.id] = img;
                        _studioTryRedraw(tpl.id);
                    };
                    img.onerror = () => {};
                    img.src = tpl.bg;
                });
            }, 300);
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
        const name  = (userData.username || userData.userName || 'USUARIO').toUpperCase();
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
            ctx.font=`300 ${Math.floor(9.5*tS)}px sans-serif`; ctx.textAlign='start';
            ctx.fillStyle='rgba(255,255,255,0.4)';
            ctx.fillText('✦ AX-CORE · PREMIUM LOGROS',pad,fy);
            ctx.textAlign='end'; ctx.fillStyle='rgba(255,255,255,0.2)';
            ctx.fillText('BY ARTHUR',W-pad,fy);
            [0,10,20].forEach((dx,i)=>{
                ctx.beginPath(); ctx.arc(pad+dx,fy+16,2.5,0,Math.PI*2);
                ctx.fillStyle=ac(0.5-i*0.15); ctx.fill();
            });
            ctx.fillStyle=accent; ctx.fillRect(0,H-8,W,8);
            ctx.fillStyle='rgba(255,255,255,0.15)'; ctx.fillRect(0,H-8,W*.3,8);
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

            <!-- ═══ INSIGNIAS (acordeón colapsable) ═══ -->
            <div class="sx-ach-bar">
                <button class="sx-ach-toggle" onclick="this.closest('.sx-ach-bar').classList.toggle('sx-ach-open')">
                    <span class="sx-ach-lbl">🎖 INSIGNIAS &nbsp;·&nbsp; <span style="color:var(--accent-main)">${earnedCount}</span><span style="color:rgba(255,255,255,0.35)">/${ACHIEVEMENTS_DEF.length}</span> desbloqueadas</span>
                    <span class="sx-ach-chevron">›</span>
                </button>
                <div class="sx-ach-body">
                    <div id="achievements-panel" style="display:grid; grid-template-columns:repeat(auto-fill,minmax(78px,1fr)); gap:7px; padding:12px 14px 16px;"></div>
                </div>
            </div>

            <!-- ═══ STUDIO CORE ═══ -->
            <div class="sx-core">

                <!-- HEADER COMPACTO -->
                <div class="sx-hdr">
                    <div class="sx-hdr-left">
                        <span class="sx-hdr-ico">🏆</span>
                        <div>
                            <div class="sx-hdr-title">ESTUDIO <em>DE LOGROS</em></div>
                            <div class="sx-hdr-sub">AX-CORE BY ARTHUR</div>
                        </div>
                    </div>
                    <div class="sx-hdr-badge">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                        PRO
                    </div>
                </div>

                <!-- PREVIEW HERO -->
                <div class="sx-hero">

                    <!-- BOTONES FLOTANTES SUPERIORES (glassmorphism, icon-only) -->
                    <div class="sx-float-bar">
                        <button class="sx-fab" id="sx-fab-preview" title="Vista previa en pantalla completa" onclick="window.openStudioFullscreenPreview()">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                        </button>
                        <button class="sx-fab" id="sx-fab-save" title="Guardar en descargas" onclick="window.downloadStudioCardHD()">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                        </button>
                        <button class="sx-fab sx-fab-primary" id="sx-fab-share" title="Compartir logros" onclick="window.shareStudioCard()">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
                        </button>
                    </div>

                    <div class="sx-canvas-frame">
                        <div class="sx-canvas-glow"></div>
                        <canvas id="studio-preview-canvas"></canvas>
                    </div>
                </div>

                <!-- BOTTOM SHEET -->
                <div class="sx-sheet">
                    <div class="sx-notch"></div>

                    <!-- TAB BAR (clases originales preservadas para JS) -->
                    <div class="studio-pro-tabs sx-tabbar">
                        <button class="studio-pro-tab active" data-stab="diseno">
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
                            <span>DISEÑO</span>
                        </button>
                        <button class="studio-pro-tab" data-stab="metricas">
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
                            <span>DATOS</span>
                        </button>
                        <button class="studio-pro-tab" data-stab="estilo">
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4"/></svg>
                            <span>ESTILO</span>
                        </button>
                        <button class="studio-pro-tab" data-stab="fondo">
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><rect x="3" y="3" width="18" height="18" rx="3"/><path d="M3 9h18"/></svg>
                            <span>FONDO</span>
                        </button>
                        <button class="studio-pro-tab" data-stab="fx">
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                            <span>FX</span>
                        </button>
                    </div>

                    <!-- CONTENIDO DE TABS -->
                    <div class="sx-tabscroll">

                        <!-- DISEÑO: plantillas + estilo de tarjeta -->
                        <div class="studio-pro-tab-content active" id="stab-diseno">
                            <div class="sx-sec-lbl">PLANTILLAS</div>
                            <div class="studio-templates" id="studio-tpl-list"></div>
                            <div class="sx-sec-lbl" style="margin-top:20px">ESTILO DE TARJETA</div>
                            <div id="studio-card-style-btns" class="studio-pro-pills sx-card-pills"></div>
                        </div>

                        <!-- DATOS: métricas + hero metric -->
                        <div class="studio-pro-tab-content" id="stab-metricas">
                            <div class="sx-sec-lbl">MÉTRICAS A MOSTRAR</div>
                            <div class="studio-metrics" id="studio-met-list"></div>
                            <div class="sx-sec-lbl" style="margin-top:20px">⭐ MÉTRICA PRINCIPAL</div>
                            <div id="studio-hero-metric-btns" class="studio-pro-pills"></div>
                        </div>

                        <!-- ESTILO: acento · tipografía · colores · tamaño -->
                        <div class="studio-pro-tab-content" id="stab-estilo">
                            <div class="sx-sec-lbl">ACENTO DE COLOR</div>
                            <div id="studio-accent-btns" class="studio-pro-pills sx-accent-pills"></div>
                            <div class="sx-sec-lbl" style="margin-top:20px">TIPOGRAFÍA</div>
                            <div id="studio-font-btns" class="studio-pro-pills sx-font-pills"></div>
                            <div class="sx-sec-lbl" style="margin-top:20px">COLOR DE TEXTO</div>
                            <div id="studio-color-swatches" class="studio-pro-swatches sx-swatches"></div>
                            <div class="sx-sec-lbl" style="margin-top:20px">TAMAÑO DE TEXTO <span class="sx-val-badge" id="studio-size-val">${Math.round(studioState.textSize*100)}%</span></div>
                            <input type="range" id="studio-size-picker" class="studio-pro-slider sx-slider" min="0.5" max="2.5" step="0.1" value="${studioState.textSize}">
                        </div>

                        <!-- FONDO: formato de tarjeta -->
                        <div class="studio-pro-tab-content" id="stab-fondo">
                            <div class="sx-sec-lbl">FORMATO DE TARJETA</div>
                            <div class="studio-format-btns sx-fmt-seg" id="studio-fmt-btns"></div>
                            <div class="sx-fmt-hint">
                                <span class="sx-fmt-hint-item">STORY · 4:5</span>
                                <span class="sx-fmt-hint-item">CUADRADO · 1:1</span>
                                <span class="sx-fmt-hint-item">PAISAJE · 16:9</span>
                            </div>
                        </div>

                        <!-- FX: overlay + HUD -->
                        <div class="studio-pro-tab-content" id="stab-fx">
                            <div class="sx-sec-lbl">FILTRO OVERLAY</div>
                            <div id="studio-filter-btns" class="studio-pro-pills"></div>
                            <div class="sx-sec-lbl" style="margin-top:20px">ESTILO HUD</div>
                            <div id="studio-hud-btns" class="studio-pro-pills"></div>
                        </div>

                    </div><!-- /.sx-tabscroll -->
                </div><!-- /.sx-sheet -->

            </div><!-- /.sx-core -->
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
        const allFmtBtns = [];
        const refreshFmtBtns = () => {
            allFmtBtns.forEach(({ btn, fmt }) => {
                btn.classList.toggle('active', studioState.fmt === fmt.id);
            });
        };
        STUDIO_FORMATS.forEach(fmt => {
            const btn = document.createElement('button');
            btn.textContent = fmt.label;
            if(studioState.fmt===fmt.id) btn.classList.add('active');
            btn.onclick = () => {
                studioState.fmt = fmt.id;
                // Actualizar botones activos en-lugar y redibujar canvas
                refreshFmtBtns();
                renderStudioCard(previewCanvas, studioState.tpl, studioState.fmt, studioState.metrics, true);
            };
            allFmtBtns.push({ btn, fmt });
            fmtBtns.appendChild(btn);
        });

        // --- Metric toggles ---
        const metList = document.getElementById('studio-met-list');
        STUDIO_METRICS.forEach(m => {
            const tog = document.createElement('div');
            // Leer estado en tiempo real (no closure) para que sea correcto tras renders
            const getOn = () => studioState.metrics.includes(m.key);
            tog.className = 'studio-metric-toggle' + (getOn() ? ' on' : '');
            tog.innerHTML = `<div class="dot"></div> ${m.label}: <strong>${m.val()}</strong>`;
            tog.onclick = () => {
                if (getOn()) {
                    studioState.metrics = studioState.metrics.filter(k => k !== m.key);
                } else {
                    studioState.metrics.push(m.key);
                }
                // Actualizar clase en-lugar SIN reconstruir toda la página
                tog.classList.toggle('on', getOn());
                // Solo redibujar el canvas de preview
                renderStudioCard(previewCanvas, studioState.tpl, studioState.fmt, studioState.metrics, true);
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
        
        const allSwatchBtns = [];
        const refreshSwatches = () => {
            allSwatchBtns.forEach(({ btn, p }) => {
                if (studioState.textColor === p.c) {
                    btn.style.outline = '3px solid var(--accent-main)';
                    btn.style.transform = 'scale(1.18)';
                    btn.style.border = '';
                } else {
                    btn.style.outline = '';
                    btn.style.transform = '';
                    btn.style.border = '1px solid rgba(255,255,255,0.18)';
                }
            });
        };
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
            btn.onclick = () => {
                studioState.textColor = p.c;
                // Actualizar selección visual en-lugar SIN reconstruir toda la página
                refreshSwatches();
                renderStudioCard(previewCanvas, studioState.tpl, studioState.fmt, studioState.metrics, true);
            };
            allSwatchBtns.push({ btn, p });
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
                studioState.activeTab = target; // persistir para sobrevivir re-renders
                document.querySelectorAll('.studio-pro-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                document.querySelectorAll('.studio-pro-tab-content').forEach(c => c.classList.remove('active'));
                const content = document.getElementById('stab-' + target);
                if (content) content.classList.add('active');
            };
        });

        // Restaurar el tab activo si renderStudioPage() fue llamado desde un botón interno
        if (studioState.activeTab && studioState.activeTab !== 'diseno') {
            const savedTabBtn = document.querySelector(`#page-studio .studio-pro-tab[data-stab="${studioState.activeTab}"]`);
            if (savedTabBtn) {
                document.querySelectorAll('#page-studio .studio-pro-tab').forEach(t => t.classList.remove('active'));
                savedTabBtn.classList.add('active');
                document.querySelectorAll('#page-studio .studio-pro-tab-content').forEach(c => c.classList.remove('active'));
                const savedContent = document.getElementById('stab-' + studioState.activeTab);
                if (savedContent) savedContent.classList.add('active');
            }
        }

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

        // --- Funciones de Interacción del Estudio ---
        window.openStudioFullscreenPreview = function() {
            const previewCanvas = document.getElementById('studio-preview-canvas');
            if (!previewCanvas) return;
            
            // Generar imagen en alta resolución
            const imgData = previewCanvas.toDataURL('image/png');
            
            // Crear modal si no existe
            let modal = document.getElementById('studio-preview-modal');
            if (!modal) {
                modal = document.createElement('div');
                modal.id = 'studio-preview-modal';
                modal.className = 'studio-modal-overlay';
                modal.innerHTML = `
                    <div class="studio-modal-container">
                        <button class="studio-modal-close" onclick="window.closeStudioPreviewModal()">&times;</button>
                        <img id="studio-modal-image" src="" alt="Vista previa de logros">
                        <p class="studio-modal-tip">Toca la X para volver a la edición</p>
                    </div>
                `;
                document.body.appendChild(modal);
                // Cerrar al hacer clic fuera de la imagen
                modal.addEventListener('click', (e) => {
                    if (e.target === modal || e.target.classList.contains('studio-modal-container')) {
                        window.closeStudioPreviewModal();
                    }
                });
            }
            
            // Cargar imagen y abrir modal con delay mínimo para animación
            document.getElementById('studio-modal-image').src = imgData;
            modal.style.display = 'flex';
            setTimeout(() => modal.classList.add('active'), 10);
        };

        window.closeStudioPreviewModal = function() {
            const modal = document.getElementById('studio-preview-modal');
            if (modal) {
                modal.classList.remove('active');
                setTimeout(() => modal.style.display = 'none', 250);
            }
        };

        window.downloadStudioCardHD = function() {
            const hdCanvas = document.createElement('canvas');
            renderStudioCard(hdCanvas, studioState.tpl, studioState.fmt, studioState.metrics, false);
            
            const link = document.createElement('a');
            link.download = 'AX-CORE_Logros.png';
            link.href = hdCanvas.toDataURL('image/png');
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            // Marcar que compartió/creó una tarjeta (insignia COMPARTIDOR).
            if (!userData.sharedCard) {
                userData.sharedCard = true;
                saveData();
                if (typeof checkAchievements === 'function') checkAchievements();
            }

            if (typeof pmShowToast === 'function') {
                pmShowToast('📥 ¡Tarjeta guardada en descargas!', 'green');
            }
        };

        window.shareStudioCard = async function() {
            const hdCanvas = document.createElement('canvas');
            renderStudioCard(hdCanvas, studioState.tpl, studioState.fmt, studioState.metrics, false);
            
            hdCanvas.toBlob(async (blob) => {
                if (!blob) {
                    alert('Error al generar la imagen.');
                    return;
                }
                const file = new File([blob], 'AX-CORE_Logros.png', { type: 'image/png' });

                // Marcar que compartió una tarjeta (insignia COMPARTIDOR).
                if (!userData.sharedCard) {
                    userData.sharedCard = true;
                    saveData();
                    if (typeof checkAchievements === 'function') checkAchievements();
                }

                if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
                    try {
                        await navigator.share({
                            files: [file],
                            title: 'Mis Logros en AX-CORE',
                            text: `¡Déficit de ${userData.totalNetDeficit||0} kcal con AX-CORE! 🔥`
                        });
                    } catch (e) {
                        console.log('Share cancelado o fallido', e);
                    }
                } else {
                    // Fallback a descarga
                    window.downloadStudioCardHD();
                    if (typeof pmShowToast === 'function') {
                        pmShowToast('📲 Compártela desde tus descargas.', 'blue');
                    }
                }
            }, 'image/png');
        };
    }


    // saveSettingsBtn puede ser null si el elemento legacy fue eliminado del HTML
    if (saveSettingsBtn) {
        saveSettingsBtn.onclick = () => {
            const unInput = document.getElementById('input-username');
            if (unInput) {
                const newName = unInput.value.trim();
                userData.username = newName;
                userData.userName = newName;
            }
            saveData();
            // Sincronizar en toda la interfaz
            if (typeof window.syncProfileEverywhere === 'function') window.syncProfileEverywhere();
        };
    }

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
            userData.workoutLogToday = [];

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
            status.innerHTML = `${tone} Hoy llevas <strong style="color:var(--accent-main)">${consumed} kcal</strong> ingeridas / <strong>${limit} kcal</strong> límite. Quemaste ${burned} kcal con ejercicio. Te quedan <strong style="color:${remaining < 0 ? 'var(--accent-alert)' : 'var(--accent-main)'};">${remaining} kcal</strong> hoy.`;
        }
        const ageEl = document.getElementById('calc-age');
        if (ageEl && userData.age && !ageEl.value) ageEl.value = userData.age;
    }

    function setupCalcCompensate() {
        const btn = document.getElementById('btn-calc-compensate');
        if (!btn) return;
        btn.onclick = () => {
            const raw = document.getElementById('calc-extra-cal').value.trim();
            const out = document.getElementById('calc-compensate-result');
            if (!raw) {
                out.innerHTML = `<p style="color:var(--accent-alert); font-size:0.85rem;">Escribe un alimento o número de kcal.</p>`;
                return;
            }
            
            let extra = 0;
            let foodName = '';

            // Detectar si es un número directo
            const asNum = parseInt(raw);
            if (!isNaN(asNum) && asNum > 0 && /^\d+$/.test(raw)) {
                extra = asNum;
            } else {
                // Es un texto, buscar el alimento en la base de datos
                const found = (typeof findFood === 'function') ? findFood(raw) : null;
                if (!found) {
                    out.innerHTML = `<p style="color:var(--accent-alert); font-size:0.85rem;">No encontré "${raw}" en mi base. Intenta con "pizza", "taco al pastor", etc., o escribe un número de kcal.</p>`;
                    return;
                }
                extra = found.cal;
                foodName = found.name;
            }

            const opts = (typeof findCompensationOptions === 'function') ? findCompensationOptions(extra, 6) : [];
            if (opts.length === 0) {
                out.innerHTML = `<p style="color:var(--text-dim); font-size:0.85rem;">No encontré ejercicios óptimos. Prueba con un valor menor.</p>`;
                return;
            }

            let foodInfoHtml = '';
            if (foodName) {
                foodInfoHtml = `<p style="font-size:0.85rem; color:#fff; margin-bottom:0.4rem;">🍔 Encontré <strong>${foodName}</strong> con <strong style="color:var(--accent-main)">${extra} kcal</strong>.</p>`;
            }

            out.innerHTML = `
                ${foodInfoHtml}
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
                <div style="padding:1rem; background:rgba(var(--pm-green-rgb, 0,201,122),0.05); border-radius:10px; border:1px solid rgba(var(--pm-green-rgb, 0,201,122),0.25);">
                    <div style="display:flex; justify-content:space-between; padding:0.4rem 0; border-bottom:1px solid rgba(255,255,255,0.05);">
                        <span style="color:var(--text-dim); font-size:0.8rem;">BMR (metabolismo basal)</span>
                        <strong style="color:#fff;">${bmr} kcal</strong>
                    </div>
                    <div style="display:flex; justify-content:space-between; padding:0.4rem 0; border-bottom:1px solid rgba(255,255,255,0.05);">
                        <span style="color:var(--text-dim); font-size:0.8rem;">TDEE (gasto total diario)</span>
                        <strong style="color:#fff;">${tdee} kcal</strong>
                    </div>
                    <div style="display:flex; justify-content:space-between; margin-top:0.3rem; background:rgba(var(--pm-green-rgb, 0,201,122),0.08); border-radius:6px; padding:0.6rem 0.8rem;">
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
            const kgToLose = (+(userData.weight || 0) - +(userData.target_weight || 0)).toFixed(1);
            if (!days) {
                out.innerHTML = `<p style="color:var(--text-dim); font-size:0.85rem;">No puedo proyectar todavía. Necesitas registrar al menos un mes de actividad.</p>`;
                return;
            }
            const goalDate = new Date();
            goalDate.setDate(goalDate.getDate() + days);
            out.innerHTML = `
                <div style="padding:1rem; background:rgba(var(--pm-green-rgb, 0,201,122),0.05); border-radius:10px; border:1px solid rgba(var(--pm-green-rgb, 0,201,122),0.25);">
                    <div style="text-align:center; margin-bottom:1rem;">
                        <div style="font-size:0.75rem; color:var(--text-dim);">FALTAN</div>
                        <div style="font-size:2rem; font-family:var(--font-accent); color:var(--accent-main); font-weight:bold;">${days}</div>
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
        // Marcar que usó la calculadora (insignia CALCULADOR).
        if (!userData.usedCalc) {
            userData.usedCalc = true;
            saveData();
            if (typeof checkAchievements === 'function') checkAchievements();
        }
    }
    window._activateCalculator = activateCalculator;

    function startClock() {
        const tick = () => {
            if (!liveTimeEl || !liveDateEl) return;
            const now = new Date();

            if (document.body.classList.contains('premium-mode')) {
                // Modo premium: Reloj de 24 horas y fecha en español en mayúsculas (Día de la semana, fecha y hora con segundos)
                const h24 = now.getHours().toString().padStart(2, '0');
                const m = now.getMinutes().toString().padStart(2, '0');
                const s = now.getSeconds().toString().padStart(2, '0');
                liveTimeEl.textContent = `${h24}:${m}:${s}`;
                
                const weekday = now.toLocaleDateString('es-MX', { weekday: 'long' }).toUpperCase();
                const day = now.getDate();
                const month = now.toLocaleDateString('es-MX', { month: 'short' }).toUpperCase().replace('.', '');
                const year = now.getFullYear();
                
                liveDateEl.textContent = `${weekday}, ${day} ${month} ${year}`;
            } else {
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
            }
        };
        tick();              // pinta de inmediato (evita el "00:00:00" tras recargar)
        setInterval(tick, 1000);
    }

    // ============================================================
    // SISTEMA DE LOGROS / MEDALLAS
    // ============================================================
    // ── 100 INSIGNIAS REALES ──────────────────────────────────────────────
    // Cada una tiene una condición (check) que se evalúa contra los datos del
    // usuario. Progresivas: entre más avanzas, más difíciles. t = nivel visual
    // (1 bronce → 5 leyenda), cat = categoría para el filtro del catálogo.
    // Se conservan los IDs de la versión anterior para no perder lo ya ganado.
    const H = () => userData.history || [];
    const FL = () => userData.totalFoodLogs || 0;
    const DEF = () => userData.totalNetDeficit || 0;
    const BURN = () => userData.totalCaloriesBurned || 0;
    const WK = () => userData.totalWorkouts || 0;
    const dietConfigured = () => {
        const rd = userData.recommendedDiet || {};
        return !!(rd.breakfast || rd.lunch || rd.dinner || rd.snacks) ||
               (Array.isArray(userData.customDietRules) && userData.customDietRules.length > 0);
    };
    const ACHIEVEMENTS_DEF = [
        // ─── INICIO (10) ───
        { id:'first_login',   icon:'🎯', title:'PRIMER ACCESO',    desc:'Entraste a AX-CORE.',                 t:1, cat:'inicio', check:()=>!!userData.username },
        { id:'first_weigh',   icon:'⚖️', title:'PRIMER PESO',      desc:'Registraste tu peso por 1ª vez.',      t:1, cat:'inicio', check:()=>H().length>=1 },
        { id:'first_food',    icon:'🍽️', title:'PRIMER ALIMENTO',  desc:'Registraste tu 1ª comida.',            t:1, cat:'inicio', check:()=>FL()>=1 },
        { id:'first_workout', icon:'🏃', title:'PRIMER EJERCICIO', desc:'Registraste tu 1er ejercicio.',        t:1, cat:'inicio', check:()=>WK()>=1 },
        { id:'first_waist',   icon:'📏', title:'PRIMERA CINTURA',  desc:'Registraste tu cintura.',              t:1, cat:'inicio', check:()=>H().some(h=>+h.waist>0) },
        { id:'profile_photo', icon:'📸', title:'CON ROSTRO',       desc:'Pusiste foto de perfil.',              t:1, cat:'inicio', check:()=>!!(userData.avatarPhoto||userData.avatar) },
        { id:'theme_change',  icon:'🎨', title:'ESTILO PROPIO',    desc:'Cambiaste el color de la app.',        t:1, cat:'inicio', check:()=>!!userData.theme && userData.theme!=='neon' },
        { id:'diet_set',      icon:'🥗', title:'PLAN LISTO',       desc:'Configuraste tu dieta.',               t:1, cat:'inicio', check:()=>dietConfigured() },
        { id:'used_calc',     icon:'🧮', title:'CALCULADOR',       desc:'Usaste la calculadora.',               t:1, cat:'inicio', check:()=>!!userData.usedCalc },
        { id:'first_share',   icon:'🌟', title:'COMPARTIDOR',      desc:'Creaste tu 1ª tarjeta de logros.',     t:1, cat:'inicio', check:()=>!!userData.sharedCard },
        // ─── RACHA (18) — días CONSECUTIVOS registrando peso ───
        { id:'streak_2',   icon:'🔥', title:'RACHA 2',   desc:'2 días seguidos.',            t:1, cat:'racha', check:()=>streakDays()>=2 },
        { id:'streak_3',   icon:'🔥', title:'RACHA 3',   desc:'3 días seguidos.',            t:1, cat:'racha', check:()=>streakDays()>=3 },
        { id:'streak_5',   icon:'🔥', title:'RACHA 5',   desc:'5 días seguidos.',            t:1, cat:'racha', check:()=>streakDays()>=5 },
        { id:'streak_7',   icon:'⚡', title:'RACHA 7',   desc:'Una semana completa.',        t:2, cat:'racha', check:()=>streakDays()>=7 },
        { id:'streak_10',  icon:'⚡', title:'RACHA 10',  desc:'10 días seguidos.',           t:2, cat:'racha', check:()=>streakDays()>=10 },
        { id:'streak_14',  icon:'⚡', title:'RACHA 14',  desc:'Dos semanas.',                t:2, cat:'racha', check:()=>streakDays()>=14 },
        { id:'streak_21',  icon:'🌙', title:'RACHA 21',  desc:'Hábito formado (21 días).',   t:3, cat:'racha', check:()=>streakDays()>=21 },
        { id:'streak_30',  icon:'💫', title:'RACHA 30',  desc:'Un mes entero.',              t:3, cat:'racha', check:()=>streakDays()>=30 },
        { id:'streak_40',  icon:'💫', title:'RACHA 40',  desc:'40 días.',                    t:3, cat:'racha', check:()=>streakDays()>=40 },
        { id:'streak_50',  icon:'💫', title:'RACHA 50',  desc:'50 días.',                    t:3, cat:'racha', check:()=>streakDays()>=50 },
        { id:'streak_60',  icon:'🌟', title:'RACHA 60',  desc:'Dos meses.',                  t:4, cat:'racha', check:()=>streakDays()>=60 },
        { id:'streak_75',  icon:'🌟', title:'RACHA 75',  desc:'75 días.',                    t:4, cat:'racha', check:()=>streakDays()>=75 },
        { id:'streak_90',  icon:'💎', title:'RACHA 90',  desc:'Tres meses élite.',           t:4, cat:'racha', check:()=>streakDays()>=90 },
        { id:'streak_120', icon:'💎', title:'RACHA 120', desc:'Cuatro meses.',               t:4, cat:'racha', check:()=>streakDays()>=120 },
        { id:'streak_150', icon:'💎', title:'RACHA 150', desc:'Cinco meses.',                t:5, cat:'racha', check:()=>streakDays()>=150 },
        { id:'streak_180', icon:'👑', title:'RACHA 180', desc:'Medio año sin fallar.',       t:5, cat:'racha', check:()=>streakDays()>=180 },
        { id:'streak_270', icon:'👑', title:'RACHA 270', desc:'Nueve meses.',                t:5, cat:'racha', check:()=>streakDays()>=270 },
        { id:'streak_365', icon:'👑', title:'RACHA 365', desc:'UN AÑO. Leyenda viva.',       t:5, cat:'racha', check:()=>streakDays()>=365 },
        // ─── PESO (14) — kilos perdidos desde tu inicio ───
        { id:'lose_05',   icon:'🔻', title:'-0.5 KG',  desc:'Primera bajada.',              t:1, cat:'peso', check:()=>kilosLost()>=0.5 },
        { id:'lose_1kg',  icon:'🔻', title:'-1 KG',    desc:'Tu primer kilo.',              t:1, cat:'peso', check:()=>kilosLost()>=1 },
        { id:'lose_2',    icon:'🔻', title:'-2 KG',    desc:'Dos kilos menos.',             t:1, cat:'peso', check:()=>kilosLost()>=2 },
        { id:'lose_3',    icon:'🏅', title:'-3 KG',    desc:'Tres kilos.',                  t:2, cat:'peso', check:()=>kilosLost()>=3 },
        { id:'lose_4',    icon:'🏅', title:'-4 KG',    desc:'Cuatro kilos.',                t:2, cat:'peso', check:()=>kilosLost()>=4 },
        { id:'lose_5kg',  icon:'🥉', title:'-5 KG',    desc:'Cinco kilos. Bronce.',         t:2, cat:'peso', check:()=>kilosLost()>=5 },
        { id:'lose_7',    icon:'🥈', title:'-7 KG',    desc:'Siete kilos. Plata.',          t:3, cat:'peso', check:()=>kilosLost()>=7 },
        { id:'lose_10kg', icon:'🥇', title:'-10 KG',   desc:'Diez kilos. Oro.',             t:3, cat:'peso', check:()=>kilosLost()>=10 },
        { id:'lose_12',   icon:'🥇', title:'-12 KG',   desc:'Doce kilos.',                  t:3, cat:'peso', check:()=>kilosLost()>=12 },
        { id:'lose_15',   icon:'💫', title:'-15 KG',   desc:'Quince kilos.',                t:4, cat:'peso', check:()=>kilosLost()>=15 },
        { id:'lose_18',   icon:'💫', title:'-18 KG',   desc:'Dieciocho kilos.',             t:4, cat:'peso', check:()=>kilosLost()>=18 },
        { id:'lose_20',   icon:'🦅', title:'-20 KG',   desc:'Veinte kilos.',                t:4, cat:'peso', check:()=>kilosLost()>=20 },
        { id:'lose_25',   icon:'🦅', title:'-25 KG',   desc:'Veinticinco kilos.',           t:5, cat:'peso', check:()=>kilosLost()>=25 },
        { id:'lose_30',   icon:'🔱', title:'-30 KG',   desc:'Treinta kilos. Increíble.',    t:5, cat:'peso', check:()=>kilosLost()>=30 },
        // ─── MEDIDAS (12) — cintura reducida y # de mediciones ───
        { id:'waist_1',   icon:'📏', title:'CINTURA -1',  desc:'1 cm menos de cintura.',    t:1, cat:'medidas', check:()=>waistLost()>=1 },
        { id:'waist_2',   icon:'📏', title:'CINTURA -2',  desc:'2 cm menos.',               t:1, cat:'medidas', check:()=>waistLost()>=2 },
        { id:'waist_3',   icon:'📏', title:'CINTURA -3',  desc:'3 cm menos.',               t:2, cat:'medidas', check:()=>waistLost()>=3 },
        { id:'waist_5',   icon:'📏', title:'CINTURA -5',  desc:'5 cm menos.',               t:2, cat:'medidas', check:()=>waistLost()>=5 },
        { id:'waist_7',   icon:'📏', title:'CINTURA -7',  desc:'7 cm menos.',               t:3, cat:'medidas', check:()=>waistLost()>=7 },
        { id:'waist_10',  icon:'📏', title:'CINTURA -10', desc:'10 cm menos.',              t:4, cat:'medidas', check:()=>waistLost()>=10 },
        { id:'waist_15',  icon:'📏', title:'CINTURA -15', desc:'15 cm menos. Cambio total.',t:5, cat:'medidas', check:()=>waistLost()>=15 },
        { id:'meas_5',    icon:'📐', title:'5 MEDICIONES',  desc:'Mediste tu cuerpo 5 veces.', t:1, cat:'medidas', check:()=>H().length>=5 },
        { id:'meas_10',   icon:'📐', title:'10 MEDICIONES', desc:'10 mediciones.',          t:2, cat:'medidas', check:()=>H().length>=10 },
        { id:'meas_25',   icon:'📐', title:'25 MEDICIONES', desc:'25 mediciones.',          t:3, cat:'medidas', check:()=>H().length>=25 },
        { id:'meas_50',   icon:'📐', title:'50 MEDICIONES', desc:'50 mediciones.',          t:4, cat:'medidas', check:()=>H().length>=50 },
        { id:'meas_full', icon:'🧍', title:'CUERPO COMPLETO', desc:'Registraste todas tus medidas en un día.', t:3, cat:'medidas', check:()=>H().some(h=>+h.bicep>0&&+h.tricep>0&&+h.leg>0&&+h.chest>0&&+h.hip>0&&+h.calf>0&&+h.glute>0&&+h.neck>0&&+h.forearm>0&&+h.back>0) },
        // ─── EJERCICIO (16) — calorías quemadas acumuladas y # de ejercicios ───
        { id:'burn_100',    icon:'🔥', title:'100 KCAL',    desc:'Quemaste 100 kcal.',       t:1, cat:'ejercicio', check:()=>BURN()>=100 },
        { id:'burn_500',    icon:'🔥', title:'500 KCAL',    desc:'Quemaste 500 kcal.',       t:1, cat:'ejercicio', check:()=>BURN()>=500 },
        { id:'burn_1000',   icon:'🔥', title:'1,000 KCAL',  desc:'Quemaste 1,000 kcal.',     t:2, cat:'ejercicio', check:()=>BURN()>=1000 },
        { id:'burn_2500',   icon:'🔥', title:'2,500 KCAL',  desc:'Quemaste 2,500 kcal.',     t:2, cat:'ejercicio', check:()=>BURN()>=2500 },
        { id:'burn_5000',   icon:'🔥', title:'5,000 KCAL',  desc:'Quemaste 5,000 kcal.',     t:3, cat:'ejercicio', check:()=>BURN()>=5000 },
        { id:'burn_10000',  icon:'🔥', title:'10,000 KCAL', desc:'Quemaste 10,000 kcal.',    t:3, cat:'ejercicio', check:()=>BURN()>=10000 },
        { id:'burn_25000',  icon:'🔥', title:'25,000 KCAL', desc:'Quemaste 25,000 kcal.',    t:4, cat:'ejercicio', check:()=>BURN()>=25000 },
        { id:'burn_50000',  icon:'🔥', title:'50,000 KCAL', desc:'Quemaste 50,000 kcal.',    t:4, cat:'ejercicio', check:()=>BURN()>=50000 },
        { id:'burn_100000', icon:'🔥', title:'100,000 KCAL',desc:'Quemaste 100,000 kcal.',   t:5, cat:'ejercicio', check:()=>BURN()>=100000 },
        { id:'workouts_5',   icon:'💪', title:'5 EJERCICIOS',   desc:'Registraste 5 ejercicios.',   t:1, cat:'ejercicio', check:()=>WK()>=5 },
        { id:'workouts_10',  icon:'💪', title:'10 EJERCICIOS',  desc:'10 ejercicios.',              t:1, cat:'ejercicio', check:()=>WK()>=10 },
        { id:'workouts_25',  icon:'💪', title:'25 EJERCICIOS',  desc:'25 ejercicios.',              t:2, cat:'ejercicio', check:()=>WK()>=25 },
        { id:'workouts_50',  icon:'💪', title:'50 EJERCICIOS',  desc:'50 ejercicios.',              t:2, cat:'ejercicio', check:()=>WK()>=50 },
        { id:'workouts_100', icon:'💪', title:'100 EJERCICIOS', desc:'100 ejercicios.',             t:3, cat:'ejercicio', check:()=>WK()>=100 },
        { id:'workouts_250', icon:'💪', title:'250 EJERCICIOS', desc:'250 ejercicios.',             t:4, cat:'ejercicio', check:()=>WK()>=250 },
        { id:'workouts_500', icon:'💪', title:'500 EJERCICIOS', desc:'500 ejercicios. Bestia.',     t:5, cat:'ejercicio', check:()=>WK()>=500 },
        // ─── COMIDA (10) — total de alimentos registrados ───
        { id:'food_5',      icon:'🥗', title:'5 ALIMENTOS',   desc:'Registraste 5 comidas.',   t:1, cat:'comida', check:()=>FL()>=5 },
        { id:'food_10',     icon:'🥗', title:'10 ALIMENTOS',  desc:'10 comidas.',              t:1, cat:'comida', check:()=>FL()>=10 },
        { id:'food_25',     icon:'🥗', title:'25 ALIMENTOS',  desc:'25 comidas.',              t:1, cat:'comida', check:()=>FL()>=25 },
        { id:'food_log_50', icon:'🥗', title:'50 ALIMENTOS',  desc:'50 comidas.',              t:2, cat:'comida', check:()=>FL()>=50 },
        { id:'food_100',    icon:'🥗', title:'100 ALIMENTOS', desc:'100 comidas.',             t:2, cat:'comida', check:()=>FL()>=100 },
        { id:'food_200',    icon:'🥗', title:'200 ALIMENTOS', desc:'200 comidas.',             t:3, cat:'comida', check:()=>FL()>=200 },
        { id:'food_350',    icon:'🥗', title:'350 ALIMENTOS', desc:'350 comidas.',             t:3, cat:'comida', check:()=>FL()>=350 },
        { id:'food_500',    icon:'🥗', title:'500 ALIMENTOS', desc:'500 comidas.',             t:4, cat:'comida', check:()=>FL()>=500 },
        { id:'food_750',    icon:'🥗', title:'750 ALIMENTOS', desc:'750 comidas.',             t:4, cat:'comida', check:()=>FL()>=750 },
        { id:'food_1000',   icon:'🥗', title:'MAESTRO NUTRICIÓN', desc:'1,000 comidas registradas.', t:5, cat:'comida', check:()=>FL()>=1000 },
        // ─── DÉFICIT (10) — déficit calórico acumulado ───
        { id:'deficit_1000',   icon:'📉', title:'DÉFICIT 1,000',   desc:'1,000 kcal acumuladas.',   t:1, cat:'deficit', check:()=>DEF()>=1000 },
        { id:'deficit_3500',   icon:'📉', title:'DÉFICIT 3,500',   desc:'≈ ½ kg de grasa.',         t:2, cat:'deficit', check:()=>DEF()>=3500 },
        { id:'deficit_7700',   icon:'📉', title:'DÉFICIT 7,700',   desc:'≈ 1 kg de grasa.',         t:2, cat:'deficit', check:()=>DEF()>=7700 },
        { id:'deficit_15000',  icon:'📉', title:'DÉFICIT 15,000',  desc:'≈ 2 kg de grasa.',         t:3, cat:'deficit', check:()=>DEF()>=15000 },
        { id:'deficit_23000',  icon:'📉', title:'DÉFICIT 23,000',  desc:'≈ 3 kg de grasa.',         t:3, cat:'deficit', check:()=>DEF()>=23000 },
        { id:'deficit_38000',  icon:'📉', title:'DÉFICIT 38,000',  desc:'≈ 5 kg de grasa.',         t:4, cat:'deficit', check:()=>DEF()>=38000 },
        { id:'deficit_50000',  icon:'📉', title:'DÉFICIT 50,000',  desc:'≈ 6.5 kg de grasa.',       t:4, cat:'deficit', check:()=>DEF()>=50000 },
        { id:'deficit_77000',  icon:'📉', title:'DÉFICIT 77,000',  desc:'≈ 10 kg de grasa.',        t:5, cat:'deficit', check:()=>DEF()>=77000 },
        { id:'deficit_100000', icon:'📉', title:'DÉFICIT 100,000', desc:'Seis cifras de déficit.',  t:5, cat:'deficit', check:()=>DEF()>=100000 },
        { id:'deficit_150000', icon:'📉', title:'DÉFICIT 150,000', desc:'≈ 19 kg de grasa.',        t:5, cat:'deficit', check:()=>DEF()>=150000 },
        // ─── CONSTANCIA (7) — días distintos con registro ───
        { id:'days_3',   icon:'📅', title:'3 DÍAS ACTIVO',   desc:'Registraste en 3 días distintos.',   t:1, cat:'constancia', check:()=>distinctDaysLogged()>=3 },
        { id:'days_7',   icon:'📅', title:'7 DÍAS ACTIVO',   desc:'7 días distintos.',                  t:1, cat:'constancia', check:()=>distinctDaysLogged()>=7 },
        { id:'days_15',  icon:'📅', title:'15 DÍAS ACTIVO',  desc:'15 días distintos.',                 t:2, cat:'constancia', check:()=>distinctDaysLogged()>=15 },
        { id:'days_30',  icon:'📅', title:'30 DÍAS ACTIVO',  desc:'30 días distintos.',                 t:2, cat:'constancia', check:()=>distinctDaysLogged()>=30 },
        { id:'days_60',  icon:'📅', title:'60 DÍAS ACTIVO',  desc:'60 días distintos.',                 t:3, cat:'constancia', check:()=>distinctDaysLogged()>=60 },
        { id:'days_100', icon:'📅', title:'100 DÍAS ACTIVO', desc:'100 días distintos.',                t:4, cat:'constancia', check:()=>distinctDaysLogged()>=100 },
        { id:'days_200', icon:'📅', title:'200 DÍAS ACTIVO', desc:'200 días distintos.',                t:5, cat:'constancia', check:()=>distinctDaysLogged()>=200 },
        // ─── ESPECIALES (3) ───
        { id:'goal_halfway', icon:'🎯', title:'MEDIO CAMINO', desc:'Llegaste a la mitad de tu meta de peso.', t:3, cat:'especial', check:()=>{ const h=H(); const start=(h[0]&&+h[0].weight)||+userData.weight||0; const tw=+userData.target_weight||0; return tw>0 && start>tw && kilosLost()>=(start-tw)/2; } },
        { id:'goal_reached', icon:'🔱', title:'META ALCANZADA', desc:'Llegaste a tu peso objetivo.',           t:5, cat:'especial', check:()=>userData.weight>0 && userData.target_weight>0 && userData.weight<=userData.target_weight },
        { id:'legend',       icon:'👑', title:'LEYENDA AX',     desc:'Desbloqueaste 75 insignias.',            t:5, cat:'especial', check:()=>(userData.achievements||[]).length>=75 }
    ];

    // ── Fechas: lee CUALQUIER formato guardado sin confundir día con mes ──
    // Soporta "d/m/aaaa" (es-MX, formato viejo) y "aaaa-mm-dd" (ISO). Evita que
    // "4/7/2026" se lea como 7-abril (formato EEUU) y rompa racha/filtros/logros.
    function parseAppDate(str) {
        if (str instanceof Date) return str;
        const s = String(str || '').trim();
        let m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);           // ISO aaaa-mm-dd
        if (m) return new Date(+m[1], +m[2] - 1, +m[3]);
        m = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/);   // d/m/aaaa
        if (m) { let y = +m[3]; if (y < 100) y += 2000; return new Date(y, +m[2] - 1, +m[1]); }
        return new Date(s);                                        // último recurso
    }
    // Etiqueta corta "dd/mm" a partir de la fecha guardada (para tarjetas y sparkline)
    function formatShortDate(str) {
        const d = parseAppDate(str);
        if (isNaN(d.getTime())) return String(str || '');
        return String(d.getDate()).padStart(2, '0') + '/' + String(d.getMonth() + 1).padStart(2, '0');
    }

    function streakDays() {
        const h = userData.history || [];
        if (h.length === 0) return 0;
        // h debe estar ordenado por fecha; buscar último registro y contar consecutivos
        const dates = h.map(r => parseAppDate(r.date).toDateString());
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

    // Centímetros de cintura reducidos desde el primer registro con cintura.
    function waistLost() {
        const h = userData.history || [];
        const firstWithWaist = h.find(r => +r.waist > 0);
        if (!firstWithWaist) return 0;
        const start = +firstWithWaist.waist;
        const cur = +userData.waist || (+h[h.length - 1].waist || start);
        return Math.max(0, start - cur);
    }

    // Cantidad de días de calendario DISTINTOS en los que hubo registro.
    function distinctDaysLogged() {
        const h = userData.history || [];
        return new Set(h.map(r => parseAppDate(r.date).toDateString())).size;
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
    // Exponer las insignias REALES (las que de verdad se pueden desbloquear) para
    // que el catálogo premium muestre solo estas y el conteo sea honesto.
    window.AXCORE_ACHIEVEMENTS = ACHIEVEMENTS_DEF;

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

    // --- INICIALIZACIÓN ---
    initAuth();
    startClock();

});
