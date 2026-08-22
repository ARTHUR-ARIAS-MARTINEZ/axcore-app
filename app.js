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

    // ═══════════════════════════════════════════════════════════
    // AVISOS PROPIOS (toast/confirm/prompt) — reemplazan a los
    // nativos alert/confirm/prompt para NO mostrar el dominio
    // "usuario.github.io dice:" en el recuadro.
    // ═══════════════════════════════════════════════════════════
    function axToast(msg, ms) {
        const t = document.createElement('div');
        t.className = 'ax-toast';
        t.textContent = String(msg == null ? '' : msg);
        document.body.appendChild(t);
        requestAnimationFrame(() => t.classList.add('show'));
        const txt = String(msg || '');
        const dur = ms || (txt.length > 60 ? 4200 : 2600);
        setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 300); }, dur);
    }
    function axConfirm(msg, opts) {
        opts = opts || {};
        return new Promise((resolve) => {
            const ov = document.createElement('div');
            ov.className = 'ax-modal-ov';
            ov.innerHTML =
                '<div class="ax-modal">' +
                    '<div class="ax-modal-msg"></div>' +
                    '<div class="ax-modal-btns">' +
                        '<button class="ax-modal-btn ax-cancel"></button>' +
                        '<button class="ax-modal-btn ax-ok"></button>' +
                    '</div>' +
                '</div>';
            ov.querySelector('.ax-modal-msg').textContent = String(msg || '');
            ov.querySelector('.ax-cancel').textContent = opts.cancel || 'CANCELAR';
            const okBtn = ov.querySelector('.ax-ok');
            okBtn.textContent = opts.ok || 'ACEPTAR';
            if (opts.danger) okBtn.classList.add('danger');
            document.body.appendChild(ov);
            requestAnimationFrame(() => ov.classList.add('show'));
            const done = (v) => { ov.classList.remove('show'); setTimeout(() => ov.remove(), 200); resolve(v); };
            okBtn.onclick = () => done(true);
            ov.querySelector('.ax-cancel').onclick = () => done(false);
            ov.onclick = (e) => { if (e.target === ov) done(false); };
        });
    }
    function axPrompt(msg, def) {
        return new Promise((resolve) => {
            const ov = document.createElement('div');
            ov.className = 'ax-modal-ov';
            ov.innerHTML =
                '<div class="ax-modal">' +
                    '<div class="ax-modal-msg"></div>' +
                    '<textarea class="ax-modal-input"></textarea>' +
                    '<div class="ax-modal-btns">' +
                        '<button class="ax-modal-btn ax-cancel">CANCELAR</button>' +
                        '<button class="ax-modal-btn ax-ok">GUARDAR</button>' +
                    '</div>' +
                '</div>';
            ov.querySelector('.ax-modal-msg').textContent = String(msg || '');
            const inp = ov.querySelector('.ax-modal-input');
            inp.value = def == null ? '' : String(def);
            inp.rows = Math.min(12, Math.max(2, String(def || '').split('\n').length));
            document.body.appendChild(ov);
            requestAnimationFrame(() => { ov.classList.add('show'); inp.focus(); });
            const done = (v) => { ov.classList.remove('show'); setTimeout(() => ov.remove(), 200); resolve(v); };
            ov.querySelector('.ax-ok').onclick = () => done(inp.value);
            ov.querySelector('.ax-cancel').onclick = () => done(null);
            ov.onclick = (e) => { if (e.target === ov) done(null); };
        });
    }
    window.axToast = axToast; window.axConfirm = axConfirm; window.axPrompt = axPrompt;

    // Comidas del plan (fuente única). Se conservan las claves antiguas
    // (breakfast/lunch/dinner/snacks) para no perder dietas ya guardadas.
    const MEAL_SLOTS = [
        { key: 'breakfast',    name: 'DESAYUNO',       icon: '🌅' },
        { key: 'midmorning',   name: 'MEDIA MAÑANA',   icon: '🥤' },
        { key: 'lunch',        name: 'COMIDA',         icon: '☀️' },
        { key: 'midafternoon', name: 'MEDIA TARDE',    icon: '🍎' },
        { key: 'preworkout',   name: 'PRE-ENTRENO',    icon: '⚡' },
        { key: 'postworkout',  name: 'POST-ENTRENO',   icon: '💪' },
        { key: 'dinner',       name: 'CENA',           icon: '🌙' },
        { key: 'snacks',       name: 'SNACK OPCIONAL', icon: '🥕' }
    ];

    // ── Motor compartido de alimentos (Calculadora + Registrar) ──
    // Analiza un alimento (o número de kcal) × cantidad.
    function analyzeFoodEntry(rawInput, qty) {
        const raw = (rawInput || '').trim();
        qty = Math.max(1, parseInt(qty) || 1);
        if (!raw) return { error: 'Escribe un alimento o un número de kcal.' };
        if (/^\d+$/.test(raw)) {
            const n = parseInt(raw);
            if (n > 0) return { name: raw + ' kcal', qty, cal: n * qty, p: 0, c: 0, f: 0, isNumber: true };
        }
        const found = (typeof findFood === 'function') ? findFood(raw) : null;
        if (!found) return { error: `No encontré "${raw}" en mi base. Prueba con otro nombre o escribe las kcal (ej. 300).` };
        return {
            name: found.name, qty,
            u: (typeof foodUnit === 'function') ? foodUnit(found) : 'porción',
            cal: Math.round((found.cal || 0) * qty),
            p: Math.round((found.p || 0) * qty),
            c: Math.round((found.c || 0) * qty),
            f: Math.round((found.f || 0) * qty),
            isNumber: false
        };
    }
    // Plural de la unidad: "2 piezas", "3 platos"...
    function unitPlural(u, qty) {
        u = u || 'porción';
        if (qty === 1) return u;
        if (u === 'porción') return 'porciones';
        if (u === '100g') return '×100g';
        return /[aeiou]$/.test(u) ? u + 's' : u + 'es';
    }
    // Autocompletado tipo Google: sugiere alimentos mientras escribes.
    function setupFoodAutocomplete(inputId, unitLabelId) {
        const inp = document.getElementById(inputId);
        if (!inp || inp._axSuggest) return;
        inp._axSuggest = true;
        inp.setAttribute('autocomplete', 'off');
        // Limpiar cualquier caja huérfana de un render anterior (el input de dieta se
        // recrea con innerHTML pero la caja vive en <body>).
        document.querySelectorAll('.ax-suggest').forEach(b => b.remove());
        let box = null;
        const setUnitLbl = (f) => {
            const lbl = document.getElementById(unitLabelId);
            if (!lbl) return;
            const u = f && typeof foodUnit === 'function' ? foodUnit(f) : null;
            lbl.textContent = u ? `Cantidad (${unitPlural(u, 2)})` : 'Cantidad';
        };
        // Cierre + limpieza de listeners globales (se enganchan solo mientras hay caja
        // abierta, para no acumularlos en cada render).
        const onOutside = (e) => { if (!box) return; if (e.target === inp || box.contains(e.target)) return; close(); };
        const onScroll  = (e) => { if (box && e.target !== box && !box.contains(e.target)) close(); };
        function close() {
            if (box) { box.remove(); box = null; }
            document.removeEventListener('pointerdown', onOutside, true);
            window.removeEventListener('scroll', onScroll, true);
        }
        const select = (f) => { inp.value = f.name; setUnitLbl(f); close(); try { inp.focus(); } catch(_){} };
        const render = () => {
            close();
            const q = inp.value.trim();
            if (q.length < 2 || /^\d+$/.test(q)) { setUnitLbl(null); return; }
            const sugs = (typeof findFoodSuggestions === 'function') ? findFoodSuggestions(q) : [];
            if (!sugs.length) return;
            box = document.createElement('div');
            box.className = 'ax-suggest';
            sugs.forEach(f => {
                const row = document.createElement('div');
                row.className = 'ax-suggest-item';
                const nm = document.createElement('span'); nm.textContent = f.name;
                const info = document.createElement('small'); info.textContent = `${f.cal} kcal`;
                row.appendChild(nm); row.appendChild(info);
                // Seleccionar en CLICK real (no en pointerup): el navegador solo dispara
                // click en un TOQUE; si arrastras para desplazar la lista, no hay click.
                // Además la fila CONSUME el click. Antes se seleccionaba en pointerup y la
                // caja se eliminaba al instante → el click sintético del navegador caía en
                // lo que quedaba DEBAJO (el botón "+ AGREGAR A MI DÍA") y el alimento se
                // registraba solo, sin que el usuario diera Agregar.
                row.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); select(f); });
                box.appendChild(row);
            });
            // Colocación: debajo del campo si hay lugar; si no (campo abajo de la
            // pantalla o teclado abierto), ARRIBA del campo. Además se limita el
            // alto al espacio libre real para que la lista nunca quede cortada
            // fuera de la pantalla: siempre se puede desplazar completa.
            const r = inp.getBoundingClientRect();
            const vh = window.innerHeight || document.documentElement.clientHeight;
            const GAP = 4, MARGEN = 8, ALTO_MAX = 240;
            const libreAbajo = vh - r.bottom - GAP - MARGEN;
            const libreArriba = r.top - GAP - MARGEN;
            box.style.left = r.left + 'px';
            box.style.width = r.width + 'px';
            if (libreAbajo >= 120 || libreAbajo >= libreArriba) {
                box.style.top = (r.bottom + GAP) + 'px';
                box.style.bottom = 'auto';
                box.style.maxHeight = Math.max(96, Math.min(ALTO_MAX, libreAbajo)) + 'px';
            } else {
                box.style.top = 'auto';
                box.style.bottom = (vh - r.top + GAP) + 'px';
                box.style.maxHeight = Math.max(96, Math.min(ALTO_MAX, libreArriba)) + 'px';
            }
            document.body.appendChild(box);
            // Cierra al tocar fuera (input o caja) o al hacer scroll de la PÁGINA (no de la
            // caja). Reemplaza el 'blur', que cerraba la lista al desplazarla con el dedo.
            document.addEventListener('pointerdown', onOutside, true);
            window.addEventListener('scroll', onScroll, true);
        };
        inp.addEventListener('input', render);
    }
    // Activar autocompletado en el Asistente de comida (HTML estático)
    setupFoodAutocomplete('calc-extra-cal', 'calc-unit-lbl');
    function macrosRowHtml(a) {
        if (a.isNumber) return '';
        const cell = (lbl, val, col) => `<div style="flex:1; min-width:78px; text-align:center; background:rgba(255,255,255,0.05); border-radius:10px; padding:0.5rem 0.3rem;"><div style="font-size:1.1rem; font-weight:bold; color:${col};">${val}<small style="font-size:0.6rem;">g</small></div><div style="font-size:0.58rem; color:var(--text-dim); letter-spacing:0.5px;">${lbl}</div></div>`;
        return `<div style="display:flex; gap:8px; margin-top:0.6rem; flex-wrap:wrap;">${cell('PROTEÍNA', a.p, '#00c97a')}${cell('CARBOS', a.c, '#2979ff')}${cell('GRASA', a.f, '#ff9f43')}</div>`;
    }
    function burnExercisesHtml(cal) {
        const opts = (typeof findCompensationOptions === 'function') ? findCompensationOptions(cal, 4) : [];
        if (!opts.length) return '';
        return `<p style="font-size:0.78rem; color:var(--text-dim); margin:0.8rem 0 0.5rem;">🔥 Para quemar esas <strong style="color:var(--accent-main)">${cal.toLocaleString()} kcal</strong>, haz cualquiera:</p><div style="display:grid; gap:0.45rem;">${opts.map(o => `<div style="padding:0.6rem 0.9rem; background:rgba(0,201,122,0.08); border-radius:8px; border-left:3px solid var(--accent-main);"><div style="font-weight:bold; color:#fff; font-size:0.85rem;">${o.name}</div><div style="font-size:0.72rem; color:var(--accent-main);">${o.amount} ${o.unit.toLowerCase()}</div></div>`).join('')}</div>`;
    }
    // Botones +/- del selector de cantidad (delegado, global).
    document.addEventListener('click', (e) => {
        const b = e.target.closest && e.target.closest('.ax-qty-btn');
        if (!b) return;
        const inp = document.getElementById(b.dataset.qty);
        if (!inp) return;
        const cur = Math.max(1, parseInt(inp.value) || 1);
        inp.value = Math.max(1, cur + (parseInt(b.dataset.dir) || 0));
    });

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
            const slot = MEAL_SLOTS.find(s => s.key === mealType);
            titleEl.textContent = slot ? slot.name : 'COMIDA';
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

    // Ventana de vista de una comida: título centrado arriba, contenido abajo.
    function openMealViewModal(key) {
        const slot = MEAL_SLOTS.find(s => s.key === key);
        const diet = userData.recommendedDiet || {};
        const txt = (diet[key] || '').trim();
        const ov = document.createElement('div');
        ov.className = 'ax-view-ov';
        ov.innerHTML =
            '<div class="ax-view">' +
                '<div class="ax-view-title"></div>' +
                '<div class="ax-view-body"></div>' +
                '<div class="ax-view-btns">' +
                    '<button class="ax-modal-btn ax-view-edit">✎ EDITAR</button>' +
                    '<button class="ax-modal-btn ax-ok">CERRAR</button>' +
                '</div>' +
            '</div>';
        ov.querySelector('.ax-view-title').textContent = slot ? `${slot.icon} ${slot.name}` : 'COMIDA';
        ov.querySelector('.ax-view-body').textContent = txt || 'Sin contenido todavía. Pulsa ✎ EDITAR para agregarlo, o pega tu dieta completa en MI PLAN.';
        document.body.appendChild(ov);
        requestAnimationFrame(() => ov.classList.add('show'));
        const close = () => { ov.classList.remove('show'); setTimeout(() => ov.remove(), 200); };
        ov.querySelector('.ax-ok').onclick = close;
        ov.querySelector('.ax-view-edit').onclick = () => { close(); openMealModal(key); };
        ov.onclick = (e) => { if (e.target === ov) close(); };
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
                target.style.setProperty('color', document.body.getAttribute('data-theme') === 'blanco' ? '#14181d' : '#ffffff', 'important');
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
                        if (savedPage === 'assistant' && typeof window._activateCalculator === 'function') window._activateCalculator();
                        // Ajustes: rellenar días/kg/insignias del héroe (si no, quedan en 0
                        // hasta que el usuario navega a otra sección y regresa).
                        if (savedPage === 'settings' && typeof window.updatePmProfileHero === 'function') {
                            window.updatePmProfileHero();
                            setTimeout(() => window.updatePmProfileHero(), 450); // 2a pasada: tras cargar datos remotos/insignias
                        }
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
            if (!Array.isArray(userData.activeDays)) userData.activeDays = [];
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
                // Antes de limpiar los contadores del día que termina, marcarlo como
                // día activo si tuvo actividad (así cuenta para la racha aunque no se
                // haya registrado una medida ese día).
                const _endedHadActivity = (userData.foodLogToday || []).length > 0 || (userData.workoutLogToday || []).length > 0 ||
                    (+userData.caloriesConsumedToday || 0) > 0 || (+userData.caloriesBurnedToday || 0) > 0;
                if (_endedHadActivity && userData.lastUpdateDate) {
                    const _prev = new Date(userData.lastUpdateDate);
                    if (!isNaN(_prev.getTime())) markActiveDay(_prev);
                }
                const dayDeficit = userData.dailyCalLimit - (userData.caloriesConsumedToday - userData.caloriesBurnedToday);
                userData.totalNetDeficit += Math.max(0, dayDeficit);
                userData.caloriesConsumedToday = 0;
                userData.caloriesBurnedToday = 0;
                userData.foodLogToday = [];
                userData.workoutLogToday = [];
                userData.lastUpdateDate = today;
                saveData();
            }
            // Backfill: si HOY ya hubo actividad (contadores/logs del día) pero aún no
            // está en activeDays —p.ej. actividad registrada ANTES de esta versión, o
            // que solo vive en los contadores— marcar hoy para que la racha lo cuente.
            if (userData.lastUpdateDate === today &&
                ((userData.foodLogToday || []).length > 0 || (userData.workoutLogToday || []).length > 0 ||
                 (+userData.caloriesConsumedToday || 0) > 0 || (+userData.caloriesBurnedToday || 0) > 0)) {
                const _before = (userData.activeDays || []).length;
                markActiveToday();
                if ((userData.activeDays || []).length !== _before) saveData();
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
                    const _localHist   = Array.isArray(userData.history) ? userData.history : [];
                    const _localAch    = Array.isArray(userData.achievements) ? userData.achievements : [];
                    const _localActive = Array.isArray(userData.activeDays) ? userData.activeDays : [];
                    // Contadores de HOY: si lo local ya es de hoy y lo remoto es de
                    // un día viejo, conservar lo de hoy (comida/ejercicio del día).
                    const _localToday  = userData.lastUpdateDate === new Date().toDateString() ? {
                        lastUpdateDate: userData.lastUpdateDate,
                        caloriesConsumedToday: userData.caloriesConsumedToday || 0,
                        caloriesBurnedToday: userData.caloriesBurnedToday || 0,
                        foodLogToday: userData.foodLogToday || [],
                        workoutLogToday: userData.workoutLogToday || []
                    } : null;
                    userData = { ...userData, ...remote.data };
                    // MERGE de historial: UNIÓN sin duplicados, no reemplazo. Antes el
                    // pull reemplazaba history completo y BORRABA los registros locales
                    // que aún no habían subido (push debounced perdido o pull lento que
                    // llegaba después de registrar) → racha/días "no cambiaban".
                    const _seenRec = new Set();
                    userData.history = [...(Array.isArray(userData.history) ? userData.history : []), ..._localHist]
                        .filter(r => { const k = JSON.stringify(r); if (_seenRec.has(k)) return false; _seenRec.add(k); return true; })
                        .sort((a, b) => parseAppDate(a.date) - parseAppDate(b.date));
                    if (_localToday && userData.lastUpdateDate !== _localToday.lastUpdateDate) Object.assign(userData, _localToday);
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
                    // Insignias: unión remoto+local (no reemplazo, misma razón que history)
                    if (Array.isArray(remote.achievements)) userData.achievements = [...new Set([...remote.achievements, ..._localAch])];
                    // Días activos: unión remoto+local (racha/DÍAS no se pierden en el sync)
                    userData.activeDays = [...new Set([...(Array.isArray(userData.activeDays) ? userData.activeDays : []), ..._localActive])].sort();
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
        // Migración 2026-08-22: los 10 temas viejos se retiraron. Al atleta que
        // tenía uno de ellos se le pasa a la fusión más cercana de su familia,
        // para que nadie despierte sin color ni pierda el estilo que eligió.
        var TEMAS_RETIRADOS = {
            amarillo: 'fusion-oro', dorado: 'fusion-oro', cafe: 'fusion-oro',
            rojo: 'fusion-fuego',
            black: 'fusion-acero', blanco: 'fusion-acero',
            cyberpunk: 'fusion-aurora', azul: 'fusion-aurora',
            pink: 'fusion-orq', pastel: 'fusion-orq', violeta: 'fusion-orq'
        };
        if (TEMAS_RETIRADOS[userData.theme]) {
            userData.theme = TEMAS_RETIRADOS[userData.theme];
            try { saveData(); } catch(e){}
        }
        const activeTheme = userData.theme || 'neon';
        document.body.setAttribute('data-theme', activeTheme);
        if (typeof window.axSyncThemeColor === 'function') window.axSyncThemeColor();
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
                // La foto NO viaja en el sync (la maneja AXProfile en su propia clave,
                // se mantiene local). Se excluye del payload para no mandar ~250KB en
                // cada push; en memoria sigue en userData.avatarPhoto para mostrarla.
                const _dataForSync = Object.assign({}, userData);
                delete _dataForSync.avatarPhoto;
                delete _dataForSync.avatar;
                const res = await fetch(`${API_URL}/api/user/sync`, {
                    method: 'POST',
                    headers: apiAuthHeaders(),
                    body: JSON.stringify({
                        data: _dataForSync,
                        achievements: userData.achievements || []
                    })
                });
                if (res.ok) {
                    // Registrar el momento del push. Sin esto, userData.lastSync solo
                    // cambiaba al hacer PULL, así que el pull de cada arranque veía
                    // "remoto más nuevo" SIEMPRE y machacaba lo local — la racha, los
                    // días y las medidas recién registradas desaparecían si el pull
                    // (lento por el arranque en frío de Render) llegaba después.
                    try {
                        const okBody = await res.json();
                        if (okBody && okBody.lastSync) {
                            userData.lastSync = okBody.lastSync;
                            const _k = getStorageKey();
                            const _stored = JSON.parse(localStorage.getItem(_k) || 'null');
                            if (_stored) { _stored.lastSync = okBody.lastSync; localStorage.setItem(_k, JSON.stringify(_stored)); }
                        }
                    } catch(_) {}
                } else if (res.status === 401) {
                    try {
                        const body = await res.json();
                        if (body.displaced) {
                            // Otro dispositivo inició sesión — forzar cierre aquí
                            clearApiToken();
                            localStorage.removeItem('arthur_current_user');
                            axToast('⚠️ Tu cuenta fue abierta en otro dispositivo.\nEsta sesión se ha cerrado para proteger tu cuenta.');
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
        const emEl = document.getElementById('reg-email');
        const email = emEl ? emEl.value.trim().toLowerCase() : '';
        const gcc = document.getElementById('reg-gym-code');
        const gc = gcc ? gcc.value.trim().toUpperCase() : '';
        const privacyChk = document.getElementById('reg-privacy');
        const privacyAccepted = !!(privacyChk && privacyChk.checked);
        const errDiv = document.getElementById('reg-error');
        const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

        const showErr = (msg) => {
            if (errDiv) { errDiv.textContent = msg; errDiv.style.display = 'block'; }
            else axToast(msg);
        };

        if (errDiv) errDiv.style.display = 'none';

        if (u.length < 3 || p.length < 4) {
            showErr("⚠️ Usuario mínimo 3 caracteres y contraseña mínimo 4 caracteres.");
            return;
        }
        if (!emailOk) {
            showErr("⚠️ Escribe un correo electrónico válido. Es tu llave para recuperar tus datos si cambias de código o dispositivo.");
            if (emEl) emEl.focus();
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
            if (!(await axConfirm("Ya existe un usuario con ese nombre en este dispositivo. ¿Deseas reemplazarlo con una cuenta nueva?", { ok: 'REEMPLAZAR', danger: true }))) {
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
            userData.email = email;
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
                    email: email,
                    password: p,
                    privacyAccepted: true,
                    data: { username: u, email: email, gymCode: gc, privacyAccepted: true, privacyDate: new Date().toISOString() }
                }),
                signal: controller.signal
            });
            clearTimeout(timeout);
            const data = await res.json();

            if (data.success) {
                setApiToken(data.token);
                currentUser = u;
                // Si el servidor recuperó datos anteriores de este CORREO, adoptarlos.
                if (data.restored && data.data && typeof data.data === 'object') {
                    userData = { ...userData, ...data.data };
                }
                userData.username = u;
                userData.email = email;
                userData.passHash = await window.axPassHash(p);
                delete userData.password;
                userData.gymCode = gc;
                userData.privacyAccepted = true;
                userData.privacyDate = new Date().toISOString();
                if (Array.isArray(data.achievements)) userData.achievements = data.achievements;
                else if (!data.restored) userData.achievements = [];
                saveData();
                localStorage.setItem('arthur_current_user', u);
                localStorage.setItem('axcore_first_run', '1');
                showErr(data.restored ? `✅ Cuenta creada. ¡Recuperamos tu progreso anterior! Entrando...` : `✅ Cuenta creada. Entrando a AX-CORE...`);
                if (errDiv) errDiv.style.background = 'rgba(0,255,136,0.15)';
                setTimeout(() => location.reload(), 1800);
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
            axToast("Usuario y contraseña requeridos.");
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
                    axToast(data.message || "Credenciales incorrectas.");
                    btn.textContent = originalText;
                    btn.disabled = false;
                    return;
                }
            } catch (e) {
                // Sin conexión: caer a login local si las credenciales coinciden
                console.warn('[login] backend no responde, modo offline');
            }
        }

        // 2b. DISPOSITIVO NUEVO (o sin código local): login remoto por USERNAME para
        //     JALAR los datos de la nube a este dispositivo. Con esto, al poner tu
        //     usuario y contraseña en cualquier celular se restaura tu progreso.
        try {
            const res = await fetch(`${API_URL}/api/user/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: u, password: p })
            });
            const data = await res.json();
            if (data.success) {
                setApiToken(data.token);
                const merged = { ...(savedLocal || {}), ...(data.data || {}) };
                // Puede haber entrado con su CORREO; el username real lo dice el servidor.
                const realUser = (data.username && data.username.trim()) ? data.username.trim() : u;
                merged.username = realUser;
                if (u.includes('@')) merged.email = u;
                merged.passHash = await window.axPassHash(p);
                delete merged.password;
                if (data.gymCode) merged.gymCode = data.gymCode;
                merged.achievements = data.achievements || merged.achievements || [];
                localStorage.setItem(`arthur_data_${realUser}`, JSON.stringify(merged));
                currentUser = realUser;
                localStorage.setItem('arthur_current_user', realUser);
                location.reload();
                return;
            }
            // Backend respondió pero rechazó. Si NO hay respaldo local, mostrar su motivo
            // (salvo "Faltan datos", que indica un backend viejo sin login por usuario).
            if (!savedLocal && data.message && data.message !== 'Faltan datos.') {
                axToast(data.message);
                btn.textContent = originalText; btn.disabled = false;
                return;
            }
        } catch (e) {
            console.warn('[login] remoto por usuario no disponible:', e.message);
            // Sin conexión → intentar login local de abajo.
        }

        // 3. Login local (DEMO o fallback offline)
        if (!savedLocal) {
            axToast("Usuario no encontrado en este dispositivo.\nUsa NUEVO ATLETA para crear cuenta.");
            btn.textContent = originalText; btn.disabled = false;
            return;
        }
        const storedCred = (savedLocal.passHash != null) ? savedLocal.passHash : savedLocal.password;
        if (!(await window.axPassVerify(storedCred, p))) {
            axToast("Contraseña incorrecta.");
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

    // ═══════════════ RECUPERAR USUARIO / CONTRASEÑA ═══════════════
    window.axShowRecovery = function() {
        // Cuentas guardadas en ESTE dispositivo → ayuda si olvidó su usuario.
        const devUsers = [];
        try {
            for (let i = 0; i < localStorage.length; i++) {
                const k = localStorage.key(i);
                if (k && k.indexOf('arthur_data_') === 0) devUsers.push(k.replace('arthur_data_', ''));
            }
        } catch(_) {}
        const esc = s => String(s).replace(/</g,'&lt;').replace(/"/g,'&quot;');
        const ov = document.createElement('div');
        ov.className = 'pm-crop-ov';
        ov.innerHTML = `
            <div class="pm-crop-panel" style="max-width:360px; text-align:left;">
                <div class="pm-crop-title" style="text-align:center;">RECUPERAR ACCESO</div>
                <div class="ax-rec-block">
                    <div class="ax-rec-h">¿Olvidaste tu USUARIO?</div>
                    <div class="ax-rec-sub">Cuentas guardadas en este dispositivo:</div>
                    <div class="ax-rec-users">${devUsers.length ? devUsers.map(u => `<button class="ax-rec-user" data-u="${esc(u)}">${esc(u)}</button>`).join('') : '<span class="ax-rec-none">— Ninguna guardada en este dispositivo —</span>'}</div>
                </div>
                <div class="ax-rec-block">
                    <div class="ax-rec-h">¿Olvidaste tu CONTRASEÑA?</div>
                    <div class="ax-rec-sub">Restablécela con tu <b>código de atleta</b> (el que te dio tu coach) y tu usuario <b>o</b> tu correo.</div>
                    <input class="ax-rec-in" id="axRecCode" placeholder="Código de atleta (AXV-...)" autocomplete="off">
                    <input class="ax-rec-in" id="axRecUser" placeholder="Tu usuario (o déjalo vacío)" autocomplete="off">
                    <input class="ax-rec-in" id="axRecEmail" placeholder="Tu correo (o déjalo vacío)" autocomplete="off" style="text-transform:none;">
                    <input class="ax-rec-in" id="axRecPass" type="password" placeholder="Nueva contraseña (mín. 4)">
                    <div class="ax-rec-msg" id="axRecMsg"></div>
                    <button class="btn-premium ax-rec-apply" id="axRecReset">RESTABLECER CONTRASEÑA</button>
                </div>
                <button class="pm-crop-cancel" id="axRecClose" style="width:100%; margin-top:8px;">CERRAR</button>
            </div>`;
        document.body.appendChild(ov);
        const close = () => ov.remove();
        ov.querySelector('#axRecClose').onclick = close;
        ov.addEventListener('click', (e) => { if (e.target === ov) close(); });
        // Elegir un usuario del dispositivo → lo pone en el campo de login.
        ov.querySelectorAll('.ax-rec-user').forEach(b => {
            b.onclick = () => {
                const li = document.getElementById('login-user');
                if (li) li.value = b.dataset.u;
                if (typeof axToast === 'function') axToast('Usuario puesto en el login. Escribe tu contraseña.');
                close();
            };
        });
        // Restablecer contraseña con código + usuario.
        ov.querySelector('#axRecReset').onclick = async () => {
            const code = (document.getElementById('axRecCode').value || '').trim().toUpperCase();
            const user = (document.getElementById('axRecUser').value || '').trim();
            const email = (document.getElementById('axRecEmail').value || '').trim().toLowerCase();
            const pass = (document.getElementById('axRecPass').value || '').trim();
            const msg = document.getElementById('axRecMsg');
            const setMsg = (t, ok) => { if (msg) { msg.textContent = t; msg.style.color = ok ? '#00c97a' : '#ff6b6b'; } };
            if (!code) return setMsg('Escribe tu código de atleta.', false);
            if (user.length < 3 && !email) return setMsg('Escribe tu usuario o tu correo.', false);
            if (pass.length < 4) return setMsg('La nueva contraseña debe tener mín. 4 caracteres.', false);
            const btn = document.getElementById('axRecReset');
            const orig = btn.textContent; btn.textContent = 'CONECTANDO…'; btn.disabled = true;
            try {
                const res = await fetch(`${API_URL}/api/user/reset-password`, {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ code, username: user, email, newPassword: pass })
                });
                const data = await res.json();
                if (data.success) {
                    setMsg('✅ Contraseña actualizada. Entra con tu usuario y la nueva contraseña.', true);
                    const li = document.getElementById('login-user'); if (li) li.value = data.username || user;
                    setTimeout(close, 2400);
                } else {
                    setMsg('❌ ' + (data.message || 'No se pudo restablecer.'), false);
                }
            } catch(e) {
                setMsg('❌ Sin conexión al servidor. Intenta en 1 minuto (puede estar iniciando).', false);
            }
            btn.textContent = orig; btn.disabled = false;
        };
        // Despertar el backend (cold start de Render) mientras el usuario escribe.
        try { fetch(`${API_URL}/health`).catch(()=>{}); } catch(_) {}
    };

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
                spark.parentElement.style.display = '';
            } else if (spark) {
                // Menos de 2 medidas: no hay línea que trazar → mostrar aviso claro en
                // vez de una caja vacía (antes se veía "TENDENCIA 10 DÍAS" sin nada).
                spark.innerHTML = `<text x="155" y="33" text-anchor="middle" fill="#8a94a6" font-size="9.5" font-family="Inter,sans-serif">Registra 2 o más medidas para ver tu tendencia</text>`;
                spark.parentElement.style.display = '';
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
            scroll.innerHTML = unlockedB.map(b => {
                const med = (typeof axMedalHTML === 'function') ? axMedalHTML(b, true) : '';
                const icon = med
                    ? `<div class="pd-badge-icon has-med">${med}</div>`
                    : `<div class="pd-badge-icon unlocked t${getTier(b)}">${b.emoji || b.icon || '🏅'}</div>`;
                return `<div class="pd-badge">${icon}<div class="pd-badge-name">${(b.name || b.title || '').toUpperCase()}</div></div>`;
            }).join('') + Array.from({length: lockedCount}).map(() =>
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
        if (!modal) { axToast('Función de cambio de contraseña no disponible.'); return; }
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

    // Pinta la barra de estado del celular (arriba, donde va la hora y la
    // señal) del mismo color de fondo del tema activo. Sin esto se quedaba
    // siempre en el azul oscuro original y se veía un "escalón" de color.
    window.axSyncThemeColor = function() {
        try {
            const bg = (getComputedStyle(document.body).getPropertyValue('--bg-dark') || '').trim();
            if (!bg) return;
            let meta = document.querySelector('meta[name="theme-color"]');
            if (!meta) {
                meta = document.createElement('meta');
                meta.setAttribute('name', 'theme-color');
                document.head.appendChild(meta);
            }
            meta.setAttribute('content', bg);
        } catch (e) { /* sin barra que pintar */ }
    };

    window.pmSetTheme = function(themeName) {
        try {
            userData.theme = themeName;
            if (typeof checkAchievements === 'function') checkAchievements();
            document.body.setAttribute('data-theme', themeName);
            window.axSyncThemeColor();
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
                    neon: 'NEON',
                    // ── LAS 5 FUSIONES (Estilo visual) ──
                    'fusion-oro': 'ORO',
                    'fusion-fuego': 'FUEGO',
                    'fusion-acero': 'ACERO',
                    'fusion-aurora': 'AURORA',
                    'fusion-orq': 'ORQUÍDEA',
                    // ── COLECCIONES 2026 (5 familias × 3 tonos) ──
                    'oro-champan': 'ORO · CHAMPÁN',
                    'oro-cobre': 'ORO · COBRE',
                    'oro-ambar': 'ORO · ÁMBAR',
                    'fuego-brasa': 'FUEGO · BRASA',
                    'fuego-coral': 'FUEGO · CORAL',
                    'fuego-terracota': 'FUEGO · TERRACOTA',
                    'acero-obsidiana': 'ACERO · OBSIDIANA',
                    'acero-grafito': 'ACERO · GRAFITO',
                    'acero-titanio': 'ACERO · TITANIO',
                    'aurora-jade': 'AURORA · JADE',
                    'aurora-oceano': 'AURORA · OCÉANO',
                    'aurora-cobalto': 'AURORA · COBALTO',
                    'orq-lila': 'ORQUÍDEA · LILA',
                    'orq-rosa': 'ORQUÍDEA · ROSA',
                    'orq-magenta': 'ORQUÍDEA · MAGENTA'
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
        const file = inputEl?.files?.[0];
        if (!file) return;
        // Abrir el recortador para que el usuario acerque/aleje y acomode la imagen
        // dentro del círculo antes de guardarla. Se limpia el input para poder
        // volver a elegir el MISMO archivo después.
        if (typeof window.pmOpenPhotoCropper === 'function') {
            window.pmOpenPhotoCropper(file);
            try { inputEl.value = ''; } catch(_) {}
            return;
        }
        // Fallback: sin recorte, delega al sistema robusto AXProfile
        if (window.AXProfile && typeof window.AXProfile.handleFileInput === 'function') {
            window.AXProfile.handleFileInput(inputEl);
            return;
        }
        const reader = new FileReader();
        reader.onload = (ev) => pmSaveAvatar(ev.target.result);
        reader.readAsDataURL(file);
    };

    // ═══════════════ RECORTADOR DE FOTO DE PERFIL ═══════════════
    // Autónomo (sin librerías). El usuario acerca/aleja con la barra y arrastra
    // para reposicionar dentro del círculo; al APLICAR se dibuja el recorte a un
    // canvas 256×256 y se guarda vía AXProfile.savePhoto (misma persistencia).
    window.pmOpenPhotoCropper = function(file) {
        if (!file) return;
        const objectUrl = URL.createObjectURL(file);
        const image = new Image();
        image.onload = () => buildCropper();
        image.onerror = () => {
            try { URL.revokeObjectURL(objectUrl); } catch(_){}
            if (typeof axToast === 'function') axToast('❌ No se pudo abrir la imagen.');
        };
        image.src = objectUrl;

        function buildCropper() {
            const V = 260;                                   // lado del área de recorte
            const natW = image.naturalWidth  || image.width;
            const natH = image.naturalHeight || image.height;
            const coverScale = V / Math.min(natW, natH);     // en zoom=1 cubre el cuadro
            const MINZ = 1, MAXZ = 4;
            let zoom = 1, tx = 0, ty = 0;                    // tx,ty = esquina sup-izq de la imagen (≤0)

            const ov = document.createElement('div');
            ov.className = 'pm-crop-ov';
            ov.innerHTML = `
                <div class="pm-crop-panel">
                    <div class="pm-crop-title">AJUSTA TU FOTO</div>
                    <div class="pm-crop-hint">Arrastra para mover · usa la barra para acercar</div>
                    <div class="pm-crop-stage" id="pmCropStage" style="width:${V}px;height:${V}px;">
                        <img class="pm-crop-img" id="pmCropImg" alt="" draggable="false">
                        <div class="pm-crop-ring"></div>
                    </div>
                    <input type="range" class="pm-crop-zoom" id="pmCropZoom" min="1" max="4" step="0.01" value="1">
                    <div class="pm-crop-btns">
                        <button class="pm-crop-cancel" id="pmCropCancel">CANCELAR</button>
                        <button class="btn-premium pm-crop-apply" id="pmCropApply">APLICAR</button>
                    </div>
                </div>`;
            document.body.appendChild(ov);

            const stage = ov.querySelector('#pmCropStage');
            const imgEl = ov.querySelector('#pmCropImg');
            const zoomEl = ov.querySelector('#pmCropZoom');
            imgEl.src = objectUrl;

            const dispW = () => natW * coverScale * zoom;
            const dispH = () => natH * coverScale * zoom;
            function clamp() {
                const minX = V - dispW(), minY = V - dispH();
                tx = Math.min(0, Math.max(minX, tx));
                ty = Math.min(0, Math.max(minY, ty));
            }
            function render() {
                imgEl.style.width  = dispW() + 'px';
                imgEl.style.height = dispH() + 'px';
                imgEl.style.left = tx + 'px';
                imgEl.style.top  = ty + 'px';
            }
            tx = (V - dispW()) / 2; ty = (V - dispH()) / 2; clamp(); render();

            zoomEl.oninput = () => {
                const cx = V/2, cy = V/2;
                const preScale = coverScale * zoom;
                const srcCx = (cx - tx) / preScale, srcCy = (cy - ty) / preScale;
                zoom = Math.max(MINZ, Math.min(MAXZ, parseFloat(zoomEl.value) || 1));
                const postScale = coverScale * zoom;
                tx = cx - srcCx * postScale; ty = cy - srcCy * postScale;
                clamp(); render();
            };

            let dragging = false, lastX = 0, lastY = 0;
            stage.addEventListener('pointerdown', (e) => {
                dragging = true; lastX = e.clientX; lastY = e.clientY;
                try { stage.setPointerCapture(e.pointerId); } catch(_){}
            });
            stage.addEventListener('pointermove', (e) => {
                if (!dragging) return;
                tx += e.clientX - lastX; ty += e.clientY - lastY;
                lastX = e.clientX; lastY = e.clientY;
                clamp(); render();
            });
            const endDrag = (e) => { dragging = false; try { stage.releasePointerCapture(e.pointerId); } catch(_){} };
            stage.addEventListener('pointerup', endDrag);
            stage.addEventListener('pointercancel', endDrag);

            const close = () => { try { URL.revokeObjectURL(objectUrl); } catch(_){} ov.remove(); };
            ov.querySelector('#pmCropCancel').onclick = close;
            ov.addEventListener('click', (e) => { if (e.target === ov) close(); });

            ov.querySelector('#pmCropApply').onclick = () => {
                const OUT = 256;
                const canvas = document.createElement('canvas');
                canvas.width = OUT; canvas.height = OUT;
                const ctx = canvas.getContext('2d');
                // Recorte WYSIWYG: se MIDE la geometría real renderizada (rects en
                // pantalla) en vez de recalcularla, para que lo guardado sea EXACTO a
                // lo que se ve dentro del círculo, sin depender de reglas CSS externas.
                const sRect = stage.getBoundingClientRect();
                const iRect = imgEl.getBoundingClientRect();
                const sx = natW / iRect.width;      // px naturales por px de pantalla
                const sy = natH / iRect.height;
                const srcX = Math.max(0, (sRect.left - iRect.left) * sx);
                const srcY = Math.max(0, (sRect.top  - iRect.top ) * sy);
                const srcW = sRect.width  * sx;
                const srcH = sRect.height * sy;
                try {
                    ctx.drawImage(image, srcX, srcY, srcW, srcH, 0, 0, OUT, OUT);
                    // Máscara CIRCULAR: deja las esquinas TRANSPARENTES para que la foto se
                    // vea perfectamente redonda en cualquier contenedor/dispositivo. (El
                    // avatar es un círculo por border-radius, pero algunos WebView de Android
                    // no recortan bien el fondo y asomaban las esquinas cuadradas negras →
                    // "semicuadrada".) PNG para conservar el canal alfa.
                    ctx.globalCompositeOperation = 'destination-in';
                    ctx.beginPath();
                    ctx.arc(OUT / 2, OUT / 2, OUT / 2, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.globalCompositeOperation = 'source-over';
                    const dataUrl = canvas.toDataURL('image/png');
                    // Reflejar la foto en memoria para que TODAS las vistas del avatar la
                    // muestren (updatePmProfileHero/applySettings leen userData.avatarPhoto;
                    // antes lo veían vacío y borraban la foto recién puesta por AXProfile).
                    // saveData la quita del JSON de localStorage → no rompe la cuota.
                    try { userData.avatarPhoto = dataUrl; userData.avatar = dataUrl; } catch(_){}
                    if (window.AXProfile && typeof window.AXProfile.savePhoto === 'function') window.AXProfile.savePhoto(dataUrl);
                    else if (typeof pmSaveAvatar === 'function') pmSaveAvatar(dataUrl);
                    if (typeof window.syncProfileEverywhere === 'function') window.syncProfileEverywhere();
                    if (typeof window.updatePmProfileHero === 'function') window.updatePmProfileHero();
                    if (typeof checkAchievements === 'function') checkAchievements();
                    if (typeof axToast === 'function') axToast('✓ Foto de perfil actualizada.');
                } catch (err) {
                    console.warn('[pmCrop]', err.message);
                    if (typeof axToast === 'function') axToast('❌ No se pudo recortar la foto.');
                }
                close();
            };
        }
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
                headerName.style.setProperty('color', document.body.getAttribute('data-theme') === 'blanco' ? '#14181d' : '#ffffff', 'important');
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
            // Foto: la fuente canónica es AXProfile (donde guarda el recortador);
            // userData.avatarPhoto es respaldo. Antes solo miraba userData y, como
            // AXProfile no escribe ahí, borraba la foto recién recortada.
            let _heroPhoto = ud.avatarPhoto || ud.avatar || '';
            try { if (window.AXProfile && typeof window.AXProfile.getPhoto === 'function') _heroPhoto = window.AXProfile.getPhoto() || _heroPhoto; } catch(_){}
            const av = document.getElementById('pmProfAvatar');
            if (av) {
                if (_heroPhoto) {
                    av.style.background = `url(${_heroPhoto}) center/cover`;
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
            // "DÍAS" = días CALENDARIO distintos con CUALQUIER actividad (comida,
            // ejercicio o medida) — misma base que la racha del Tablero.
            const days = (typeof activeDaySet === 'function')
                ? activeDaySet().length
                : new Set(history.map(h => parseAppDate(h.date).toDateString())).size;
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
                if (await axConfirm("¿Cerrar sesión táctica en AX-CORE?", { ok: 'CERRAR SESIÓN', danger: true })) {
                    // Invalidar sesión en el servidor para liberar el dispositivo
                    if (apiToken()) {
                        try {
                            await fetch(`${API_URL}/api/user/logout`, {
                                method: 'POST', headers: apiAuthHeaders()
                            });
                        } catch (_) {}
                    }
                    // Datos de la cuenta que sale: si era cuenta de NUBE (tenía token),
                    // borrar su copia local para NO dejar rastro en dispositivos
                    // compartidos — la nube la conserva y se re-jala al volver a entrar.
                    // Las cuentas DEMO (sin token, sin respaldo) se conservan.
                    const _outUser = currentUser;
                    const _hadCloud = !!apiToken();
                    localStorage.removeItem('arthur_current_user');
                    clearApiToken();
                    try {
                        if (_hadCloud && _outUser) {
                            localStorage.removeItem('arthur_data_' + _outUser);
                            localStorage.removeItem('axcore_uname_' + _outUser);
                            localStorage.removeItem('axcore_avatar_' + _outUser);
                        }
                        // Perfil (nombre/foto) global: siempre se limpia para no filtrarlo.
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
    // FEEDBACK AL BRINCAR DE SECCIÓN — tick digital elegante (sin vibración)
    // ═══════════════════════════════════════════════════════════
    // Sintetizado con Web Audio (sin archivos → funciona offline). Timbre limpio
    // tipo "glass tick" moderno: fundamental + su octava en seno, sin bend, con
    // caída suave y volumen discreto. Sobrio y tecnológico.
    let _axAudioCtx = null;
    function axPlayBlip() {
        try {
            const AC = window.AudioContext || window.webkitAudioContext;
            if (!AC) return;
            if (!_axAudioCtx) _axAudioCtx = new AC();
            const ctx = _axAudioCtx;
            if (ctx.state === 'suspended') ctx.resume();   // el swipe es gesto de usuario → permitido
            const now = ctx.currentTime;
            const master = ctx.createGain();
            master.gain.value = 0.85;
            master.connect(ctx.destination);
            // [frecuencia, volumen, duración] — la octava alta cae más rápido (crisp).
            [[988, 0.11, 0.12], [1976, 0.045, 0.075]].forEach(([freq, vol, dec]) => {
                const osc = ctx.createOscillator();
                const g = ctx.createGain();
                osc.type = 'sine';
                osc.frequency.value = freq;
                g.gain.setValueAtTime(0.0001, now);
                g.gain.exponentialRampToValueAtTime(vol, now + 0.006);   // ataque rápido
                g.gain.exponentialRampToValueAtTime(0.0001, now + dec);  // caída suave
                osc.connect(g); g.connect(master);
                osc.start(now);
                osc.stop(now + dec + 0.02);
            });
        } catch(_) {}
    }
    function axNavFeedback() {
        // Solo sonido (la vibración se eliminó por completo a petición del dueño).
        axPlayBlip();
    }

    // ═══════════════════════════════════════════════════════════
    // SWIPE LATERAL — Cambiar de sección con el pulgar (←/→)
    // ═══════════════════════════════════════════════════════════
    (function setupSwipeNavigation() {
        let sX = 0, sY = 0, sT = 0, tracking = false, fired = false;

        // Solo bloqueamos elementos que USAN scroll horizontal propio
        // o capturan touch de forma activa (inputs, sliders, scroll horizontal)
        function isHorizontalScroller(el) {
            if (!el) return false;
            // Range inputs capturan el swipe para cambiar valor
            if (el.tagName === 'INPUT' && el.type === 'range') return true;
            // Comprobación ultra-rápida por clases de contenedores con scroll horizontal en nuestra app
            // Esto evita llamar a getComputedStyle (provoca layout thrashing extremo en touchstart)
            if (el.classList) {
                // SOLO scrollers HORIZONTALES reales (una franja horizontal roba el
                // swipe para su propio scroll). NO incluir grids que envuelven como
                // .theme-grid (es grid de 3 columnas, no scrollea) ni contenedores de
                // scroll vertical: esos deben permitir el swipe de sección.
                if (el.classList.contains('studio-templates') ||
                    el.classList.contains('studio-metrics') ||
                    el.classList.contains('studio-pro-pills') ||
                    el.classList.contains('studio-pro-swatches') ||
                    el.classList.contains('studio-pro-tabs') ||
                    el.classList.contains('sx-tabbar') ||
                    el.classList.contains('sx-font-pills') ||    // fila TIPOGRAFÍA (12 fuentes)
                    el.classList.contains('sx-phrase-row') ||    // fila FRASES (12 frases)
                    el.classList.contains('sx-badge-row') ||     // fila INSIGNIA de la tarjeta
                    el.classList.contains('pm-workout-filters') ||
                    el.classList.contains('pd-badges-scroll')) {   // carrusel de insignias del tablero
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
                    // Modales a pantalla completa (no navegar por detrás) y la tabla de
                    // medidas (scrollea en horizontal). Se QUITARON sx-sheet (ya no existe),
                    // sx-ach-bar/body (scroll VERTICAL), history-controls y measurement-form:
                    // bloqueaban el swipe en Estudio y Ajustes sin ser scrollers horizontales.
                    el.classList.contains('studio-modal-overlay') ||
                    el.classList.contains('studio-modal-container') ||
                    el.classList.contains('history-table-container')
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
            axNavFeedback();   // "blup" + vibración al brincar de sección
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
            fired = false;
            // FIX: con un modal propio abierto (ej. color picker) el swipe NO debe
            // cambiar de pestaña — el modal ya maneja su propio gesto internamente.
            if (window.__axModalSwipeBlock) return;
            if (shouldBlock(e.target)) return;
            sX = e.touches[0].clientX;
            sY = e.touches[0].clientY;
            sT = Date.now();
            tracking = true;
        }, { passive: true });

        document.addEventListener('touchmove', (e) => {
            if (!tracking || fired) return;
            const dx = e.touches[0].clientX - sX;
            const dy = Math.abs(e.touches[0].clientY - sY);
            const adx = Math.abs(dx);
            // Si el gesto se inclina a VERTICAL, es scroll: soltamos el tracking de inmediato
            // para NO robar el gesto ni disparar cambio de sección por el arco natural del
            // pulgar (esto era lo que "trababa" el scroll, sobre todo del lado izquierdo).
            if (dy > 8 && dy >= adx) { tracking = false; return; }
            // DISPARO horizontal SOLO si es CLARAMENTE horizontal (50px y bastante más
            // horizontal que vertical) — un arrastre suave basta, pero un scroll con arco no.
            if (adx >= 50 && adx > dy * 1.6) {
                fired = true;
                tracking = false;
                goToPage(dx);
                return;
            }
        }, { passive: true });

        document.addEventListener('touchend', (e) => {
            if (!tracking || fired) return;
            tracking = false;
            // Respaldo para FLICKS cortos (el dedo se levantó antes de los 50px del
            // disparo en movimiento). Sin límite de tiempo: también cuenta un arrastre
            // corto y deliberado.
            const dx = e.changedTouches[0].clientX - sX;
            const dy = Math.abs(e.changedTouches[0].clientY - sY);
            const adx = Math.abs(dx);
            // Flick corto: solo cuenta si fue CLARAMENTE horizontal (>30px y más que vertical).
            if (adx < 30 || adx <= dy) return;
            goToPage(dx);
        }, { passive: true });
    })();

    // ═══════════════════════════════════════════════════════════
    // TOOLTIPS DE AYUDA (?) — Cómo medir cada parte del cuerpo
    // ═══════════════════════════════════════════════════════════
    (function setupMeasHelp() {
        let pop = null;
        function close() { if (pop) { pop.remove(); pop = null; } }
        document.addEventListener('click', (e) => {
            const btn = e.target.closest && e.target.closest('.meas-help');
            if (!btn) { close(); return; }
            e.preventDefault();
            e.stopPropagation();
            const wasOpen = pop && pop._owner === btn;
            close();
            if (wasOpen) return; // segundo clic sobre el mismo (?) lo cierra
            pop = document.createElement('div');
            pop.className = 'meas-help-pop';
            pop._owner = btn;
            const title = document.createElement('strong');
            title.textContent = btn.dataset.title || 'CÓMO MEDIR';
            const body = document.createElement('span');
            body.textContent = btn.dataset.help || '';
            pop.appendChild(title);
            pop.appendChild(body);
            document.body.appendChild(pop);
            // Posicionar bajo el (?) y ajustar si se sale de pantalla
            const r = btn.getBoundingClientRect();
            const pw = pop.offsetWidth;
            const ph = pop.offsetHeight;
            let left = r.left + r.width / 2 - pw / 2;
            left = Math.max(12, Math.min(left, window.innerWidth - pw - 12));
            let top = r.bottom + 8;
            if (top + ph > window.innerHeight - 12) top = Math.max(12, r.top - ph - 8);
            pop.style.left = left + 'px';
            pop.style.top = top + 'px';
        }, true);
        window.addEventListener('scroll', close, true);
        window.addEventListener('resize', close);
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
            const lg = parseFloat(document.getElementById('log-leg').value) || 0;
            const ch = parseFloat(document.getElementById('log-chest').value) || 0;
            const hp = parseFloat(document.getElementById('log-hip').value) || 0;
            const cf = parseFloat(document.getElementById('log-calf').value) || 0;
            const gl = parseFloat(document.getElementById('log-glute').value) || 0;
            const nk = parseFloat(document.getElementById('log-neck').value) || 0;
            const fr = parseFloat(document.getElementById('log-forearm').value) || 0;
            const bk = parseFloat(document.getElementById('log-back').value) || 0;

            if (!w && !ws) { axToast("Al menos ingresa Peso o Cintura."); return; }

            const rec = { date: new Date().toLocaleDateString('es-MX'), weight: w, waist: ws, bicep: bc, leg: lg, chest: ch, hip: hp, calf: cf, glute: gl, neck: nk, forearm: fr, back: bk };
            userData.history.push(rec);
            if (w) userData.weight = w;
            if (ws) userData.waist = ws;
            if (bc) userData.bicep = bc;
            if (lg) userData.leg = lg;
            if (ch) userData.chest = ch;
            if (hp) userData.hip = hp;
            if (cf) userData.calf = cf;
            if (gl) userData.glute = gl;
            if (nk) userData.neck = nk;
            if (fr) userData.forearm = fr;
            if (bk) userData.back = bk;
            if (typeof window.markActiveToday === 'function') window.markActiveToday();
            saveData();
            updateDashboard();
            renderEvolutionPage(filter);
            if (typeof checkAchievements === 'function') checkAchievements();
            // Limpiar inputs
            ['log-weight','log-waist','log-bicep','log-leg','log-chest','log-hip','log-calf','log-glute','log-neck','log-forearm','log-back'].forEach(id => {
                const el = document.getElementById(id);
                if(el) el.value = '';
            });
            axToast("Medidas guardadas con éxito.");
        };

        window.deleteHistoryRow = async (realIndex) => {
            if (await axConfirm("¿Eliminar este registro de evolución?", { ok: 'ELIMINAR', danger: true })) {
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
    // ── "IA sin IA": distancia de edición (Levenshtein) para tolerar errores
    //    de dedo en los encabezados de la dieta ("desalluno", "colasion"...).
    function _lev(a, b) {
        if (a === b) return 0;
        const m = a.length, n = b.length;
        if (Math.abs(m - n) > 2) return 3;
        const dp = [];
        for (let i = 0; i <= m; i++) { dp[i] = [i]; }
        for (let j = 0; j <= n; j++) { dp[0][j] = j; }
        for (let i = 1; i <= m; i++)
            for (let j = 1; j <= n; j++)
                dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
        return dp[m][n];
    }
    // ¿La palabra escrita "suena" a la clave? Tolerancia según el largo de la clave.
    function _fuzzyWord(w, k) {
        if (w === k) return true;
        const tol = k.length >= 8 ? 2 : k.length >= 5 ? 1 : 0;
        return tol > 0 && _lev(w, k) <= tol;
    }
    function _phraseHit(phrase, tokens) {
        return phrase.every(k => tokens.some(t => _fuzzyWord(t, k)));
    }

    function parseDietText(text) {
        // Detectores en ORDEN DE PRIORIDAD (los específicos primero, para que
        // "media mañana" no caiga en desayuno ni "snack opcional (noche)" en cena).
        // Cada frase se compara palabra por palabra con tolerancia a errores.
        const MATCHERS = [
            { key: 'midmorning',      phrases: [['media', 'manana'], ['colacion', 'matutina']] },
            { key: 'midafternoon',    phrases: [['media', 'tarde'], ['colacion', 'vespertina']] },
            { key: 'preworkout',      phrases: [['pre', 'entreno'], ['preentreno'], ['pre', 'workout'], ['antes', 'entrenar']] },
            { key: 'postworkout',     phrases: [['post', 'entreno'], ['postentreno'], ['post', 'workout'], ['despues', 'entrenar'], ['post', 'ejercicio']] },
            { key: 'snacks',          phrases: [['snack', 'opcional'], ['snack'], ['colacion'], ['merienda'], ['tentempie'], ['refrigerio'], ['botana'], ['extras']] },
            { key: 'breakfast',       phrases: [['desayuno'], ['breakfast'], ['ayunas']] },
            { key: 'lunch',           phrases: [['comida', 'fuerte'], ['comida'], ['almuerzo'], ['lunch'], ['mediodia']] },
            { key: 'dinner',          phrases: [['cena'], ['dinner'], ['noche']] },
            { key: 'recommendations', phrases: [['recomendaciones'], ['recomendacion'], ['reglas'], ['regla'], ['consejos'], ['tips'], ['indicaciones'], ['protocolo'], ['importante'], ['notas']] }
        ];
        const normLine = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
        const result = {};
        MATCHERS.forEach(m => { result[m.key] = ''; });
        const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
        let current = null;
        for (const line of lines) {
            // Encabezado = línea corta (título suelto) o con separador ":"/"-".
            const sep = line.match(/^(.{0,34}?)\s*[:：\-–—]\s*(.*)$/);
            const isShort = line.length <= 30;
            let matched = false;
            if (sep || isShort) {
                const headTokens = normLine(sep ? sep[1] : line)
                    .replace(/[^a-z0-9ñ\s]/g, ' ')
                    .split(/\s+/).filter(Boolean).slice(0, 6);
                if (headTokens.length) {
                    for (const m of MATCHERS) {
                        if (m.phrases.some(ph => _phraseHit(ph, headTokens))) {
                            current = m.key;
                            const rest = sep ? sep[2].trim() : '';
                            if (rest) result[m.key] += rest + '\n';
                            matched = true;
                            break;
                        }
                    }
                }
            }
            if (matched) continue;
            if (current) result[current] += line + '\n';
        }
        const out = {};
        MATCHERS.forEach(m => { out[m.key] = (result[m.key] || '').trim(); });
        return out;
    }

    // Detecta las calorías reales escritas en el texto de la dieta.
    // Si hay una línea con "total", usa ese número; si no, suma las menciones "kcal".
    function extractDietCalories(text) {
        const num = (s) => parseInt(String(s).replace(/[.,\s]/g, ''), 10);
        const totalLine = text.split('\n').find(l => /total/i.test(l) && /\d/.test(l));
        if (totalLine) {
            const mt = totalLine.match(/(\d[\d.,\s]{1,6})\s*k?cal/i) || totalLine.match(/(\d[\d.,]{2,6})/);
            if (mt) { const v = num(mt[1]); if (v >= 500 && v <= 8000) return v; }
        }
        let sum = 0, count = 0, mm;
        const re = /(\d[\d.,\s]{1,6})\s*k?cal/gi;
        while ((mm = re.exec(text)) !== null) {
            const v = num(mm[1]);
            if (v > 0 && v < 3000) { sum += v; count++; }
        }
        if (count >= 2 && sum >= 800 && sum <= 8000) return sum;
        return 0;
    }

    // Tab activo de la página de Dieta — PERSISTE entre re-renders (renderDietPage
    // se llama al agregar/quitar alimentos y antes siempre regresaba a MI PLAN).
    let pmDietTab = 'plan';
    function renderDietPage() {
        const diet = userData.recommendedDiet || { breakfast: '', lunch: '', dinner: '', snacks: '' };
        const hasCustomRules = userData.customDietRules && userData.customDietRules.length > 0;
        const rules = hasCustomRules ? userData.customDietRules : [];
        // Ejemplos sombreados (NO son reglas reales): se muestran mientras no haya reglas propias.
        const RULE_EXAMPLES = [
            '3 litros de agua al día',
            'Nada de refresco ni azúcar entre semana',
            'Ayuno de 8 PM a 7 AM',
            'Verduras libres: come sin contar',
            '1 comida libre a la semana'
        ];
        const dietEl = document.getElementById('page-diet');

        // Datos para barra de calorías
        const calIn  = +(userData.caloriesConsumedToday || 0);
        const calLim = +(userData.dailyCalLimit || 0);
        const calAvail = Math.max(0, calLim - calIn);
        const calPct = calLim > 0 ? Math.min(100, Math.round((calIn / calLim) * 100)) : 0;
        const foodLog = Array.isArray(userData.foodLogToday) ? userData.foodLogToday : [];
        const macroTot = foodLog.reduce((t, f) => { t.cal += (+f.cal || 0); t.p += (+f.p || 0); t.c += (+f.c || 0); t.f += (+f.f || 0); return t; }, { cal: 0, p: 0, c: 0, f: 0 });

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

                <!-- PESTAÑAS (la activa se conserva entre re-renders: al agregar un
                     alimento se re-dibuja la página y antes te regresaba a MI PLAN) -->
                <div class="pm-d-tabs">
                    <div class="pm-d-tab ${pmDietTab === 'log' ? 'on' : ''}" data-d-tab="log">REGISTRAR</div>
                    <div class="pm-d-tab ${pmDietTab === 'plan' ? 'on' : ''}" data-d-tab="plan">MI PLAN</div>
                    <div class="pm-d-tab ${pmDietTab === 'rules' ? 'on' : ''}" data-d-tab="rules">REGLAS</div>
                </div>

                <!-- ─── TAB MI PLAN ─── -->
                <div class="pm-d-panel ${pmDietTab === 'plan' ? 'on' : ''}" id="pmDt-plan">
                    <div class="pm-d-plan-hint">Toca una comida para abrirla · el lápiz ✎ para editarla</div>
                    ${MEAL_SLOTS.map(m => {
                        const has = (diet[m.key] || '').trim();
                        return `
                    <div class="pm-d-meal ${has ? 'has-content' : ''}" data-meal="${m.key}">
                        <div class="pm-d-meal-center">
                            <span class="pm-d-meal-name-c">${m.icon} ${m.name}</span>
                            <button class="pm-d-meal-edit" data-edit="${m.key}" title="Editar" aria-label="Editar">✎</button>
                        </div>
                    </div>`;
                    }).join('')}

                    <!-- INGRESO AUTOMÁTICO DE DIETA -->
                    <div class="pm-diet-import-card">
                        <div class="pm-diet-import-title">📥 INGRESO DE DIETA COMPLETA</div>
                        <div class="pm-diet-import-sub">Pega tu plan completo. Lo distribuyo en Desayuno · Media mañana · Comida · Media tarde · Pre-entreno · Post-entreno · Cena · Snack · Recomendaciones, y detecto las calorías automáticamente.</div>
                        <textarea class="pm-diet-import-area" id="diet-full-import" placeholder="Ejemplo:&#10;Desayuno: 2 huevos + 4 claras + 2 tortillas (~470 kcal)&#10;Media mañana: 200g yogur griego + 1 fruta (~250 kcal)&#10;Comida: pechuga 200g + arroz + ensalada (~620 kcal)&#10;Media tarde: 30g nueces&#10;Post-entreno: 1 scoop proteína (~150 kcal)&#10;Cena: 200g pollo + camote + verduras (~450 kcal)&#10;Snack: 150g cottage&#10;Recomendaciones: 3L agua, 8000 pasos"></textarea>
                        <button class="pm-diet-import-btn" id="btn-distribute-diet">⚡ DISTRIBUIR AUTOMÁTICAMENTE</button>
                    </div>
                    <button class="btn-premium pm-d-reset" id="btn-reset-diet" style="width:100%; margin-top:14px; background:transparent; border:1px solid rgba(255,51,102,.4); color:#ff3366;">🗑️ REINICIAR DIETA</button>
                </div>

                <!-- ─── TAB REGISTRAR ALIMENTO ─── -->
                <div class="pm-d-panel ${pmDietTab === 'log' ? 'on' : ''}" id="pmDt-log">
                    <div class="pm-d-reg-title">🍽️ REGISTRA LO QUE COMES HOY</div>
                    <div class="pm-d-reg-sub">Solo escribe el alimento (te sugiero mientras escribes) y cuántas piezas, platos o tazas. Las calorías y macros se calculan SOLAS.</div>

                    <div class="pm-d-reg-totals">
                        <div><strong>${macroTot.cal.toLocaleString()}</strong><span>KCAL HOY</span></div>
                        <div><strong style="color:#00c97a">${macroTot.p}g</strong><span>PROTEÍNA</span></div>
                        <div><strong style="color:#2979ff">${macroTot.c}g</strong><span>CARBOS</span></div>
                        <div><strong style="color:#ff9f43">${macroTot.f}g</strong><span>GRASA</span></div>
                    </div>

                    <input type="text" id="food-desc" class="pm-d-reg-input" placeholder="Ej. taco de adobada, sushi, caldo de pollo...">
                    <div class="pm-d-reg-qtyrow">
                        <label id="food-unit-lbl">Cantidad</label>
                        <div class="ax-qty">
                            <button type="button" class="ax-qty-btn" data-qty="food-qty" data-dir="-1">−</button>
                            <input type="number" id="food-qty" class="ax-qty-input" value="1" min="1" step="1">
                            <button type="button" class="ax-qty-btn" data-qty="food-qty" data-dir="1">+</button>
                        </div>
                    </div>
                    <button class="pm-d-reg-add" id="btn-add-food">+ AGREGAR A MI DÍA</button>

                    <div class="pm-d-food-log" id="pmFoodLogList" style="margin-top:1.2rem;">
                        ${foodLog.length === 0
                            ? '<div class="pm-d-food-empty">Sin registros hoy. Agrega tu primera comida arriba ↑</div>'
                            : foodLog.map((f, i) => `<div class="pm-d-food-item"><div style="flex:1; min-width:0;"><span class="pm-d-food-name">${(f.desc || '').toString().replace(/</g,'&lt;')}</span>${(f.p || f.c || f.f) ? `<div style="font-size:0.62rem; color:var(--text-dim); margin-top:2px;">P ${f.p || 0}g · C ${f.c || 0}g · G ${f.f || 0}g</div>` : ''}</div><span class="pm-d-food-cal">${f.cal || 0}<small>kcal</small></span><button class="pm-d-food-del" onclick="window.deleteFoodLog(${i})" title="Quitar este registro" aria-label="Quitar" style="background:transparent;border:none;color:#ff5c6c;font-size:1rem;line-height:1;cursor:pointer;padding:2px 8px;margin-left:6px;flex-shrink:0;">✕</button></div>`).join('')
                        }
                    </div>
                </div>

                <!-- ─── TAB REGLAS ─── -->
                <div class="pm-d-panel ${pmDietTab === 'rules' ? 'on' : ''}" id="pmDt-rules">
                    <div class="pm-d-log-hint">${hasCustomRules ? 'Las reglas de TU plan' : 'Aún no tienes reglas propias: se llenan SOLAS al pegar tu dieta completa (la parte de "Recomendaciones") o con ✏️ EDITAR REGLAS. Estos son solo ejemplos:'}</div>
                    <div class="pm-d-rules-list" id="rules-list-display">
                        ${hasCustomRules
                            ? rules.map((r, i) => `<div class="pm-d-rule"><div class="pm-d-rule-num">${i+1}</div><div class="pm-d-rule-txt">${r}</div></div>`).join('')
                            : RULE_EXAMPLES.map((r, i) => `<div class="pm-d-rule ax-example"><div class="pm-d-rule-num">${i+1}</div><div class="pm-d-rule-txt">Ej. ${r}</div></div>`).join('')
                        }
                    </div>
                    <button class="btn-premium" id="btn-edit-rules" style="width:100%; margin-top:14px;">✏️ EDITAR REGLAS</button>
                </div>
            </div>
        `;

        // Autocompletado en el registro de alimentos
        setupFoodAutocomplete('food-desc', 'food-unit-lbl');

        // ─── Lógica de pestañas ───
        dietEl.querySelectorAll('.pm-d-tab').forEach(tab => {
            tab.onclick = () => {
                const target = tab.dataset.dTab;
                pmDietTab = target;   // recordar para sobrevivir re-renders
                dietEl.querySelectorAll('.pm-d-tab').forEach(t => t.classList.toggle('on', t === tab));
                dietEl.querySelectorAll('.pm-d-panel').forEach(p => p.classList.toggle('on', p.id === `pmDt-${target}`));
            };
        });

        // ─── Tocar la comida abre su ventana; el lápiz abre el editor ───
        dietEl.querySelectorAll('.pm-d-meal').forEach(card => {
            card.onclick = (e) => {
                if (e.target.closest('.pm-d-meal-edit')) return;
                openMealViewModal(card.dataset.meal);
            };
        });
        dietEl.querySelectorAll('.pm-d-meal-edit').forEach(btn => {
            btn.onclick = (e) => { e.stopPropagation(); openMealModal(btn.dataset.edit); };
        });

        // Editar reglas de protocolo
        const btnEditRules = document.getElementById('btn-edit-rules');
        if (btnEditRules) {
            btnEditRules.onclick = async () => {
                const current = (userData.customDietRules && userData.customDietRules.length > 0)
                    ? userData.customDietRules
                    : rules;
                const text = await axPrompt("Edita tus reglas de protocolo (una por línea):", current.join('\n'));
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
            if (!raw) { axToast('Escribe o pega tu dieta primero.'); return; }
            const parsed = parseDietText(raw);
            const mealKeys = MEAL_SLOTS.map(s => s.key);
            const hasData = mealKeys.some(k => parsed[k]) || parsed.recommendations;
            if (!hasData) {
                axToast('No reconocí secciones. Usa encabezados como "Desayuno:", "Media mañana:", "Comida:", "Media tarde:", "Pre-entreno:", "Post-entreno:", "Cena:", "Snack:", "Recomendaciones:".');
                return;
            }
            if (!userData.recommendedDiet) userData.recommendedDiet = {};
            mealKeys.forEach(k => { if (parsed[k]) userData.recommendedDiet[k] = parsed[k]; });

            // Recomendaciones detectadas → se convierten en reglas custom
            if (parsed.recommendations) {
                const newRules = parsed.recommendations.split('\n').map(l => l.trim()).filter(l => l.length > 3);
                if (newRules.length > 0) userData.customDietRules = newRules;
            }

            // Calorías reales detectadas en el texto → límite diario
            const kcal = extractDietCalories(raw);
            let calMsg = '';
            if (kcal > 0) { userData.dailyCalLimit = kcal; calMsg = ' · Detecté ~' + kcal.toLocaleString() + ' kcal y las puse como tu límite diario'; }

            saveData();
            document.getElementById('diet-full-import').value = '';
            renderDietPage();
            if (typeof checkAchievements === 'function') checkAchievements();
            const recsMsg = parsed.recommendations ? ' · Guardé también reglas/recomendaciones' : '';
            axToast('✅ Dieta distribuida y guardada' + calMsg + recsMsg + '.');
        };

        const btnResetDiet = document.getElementById('btn-reset-diet');
        if (btnResetDiet) {
            btnResetDiet.onclick = async () => {
                if (await axConfirm("¿Estás seguro de borrar toda la dieta actual y sus reglas para empezar desde cero?", { ok: 'BORRAR TODO', danger: true })) {
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
            const qtyEl = document.getElementById('food-qty');
            const qty = qtyEl ? qtyEl.value : 1;

            let a = analyzeFoodEntry(desc, qty);
            if (a.error) {
                // No está en la base: pedir kcal por porción y guardarlo para la próxima
                const input = await axPrompt(`No tengo "${desc}" en mi base.\n¿Cuántas kcal tiene UNA porción? (solo el número)`);
                if (input === null) return;
                const per = parseInt(String(input).replace(/[^0-9]/g, ''));
                if (isNaN(per) || per <= 0 || per > 5000) { axToast('Valor inválido. Escribe un número entre 1 y 5000.'); return; }
                if (!Array.isArray(userData.customFoods)) userData.customFoods = [];
                userData.customFoods.push({ name: desc.toLowerCase(), cal: per, p: 0, c: 0, f: 0 });
                const q = Math.max(1, parseInt(qty) || 1);
                a = { name: desc, qty: q, u: 'porción', cal: per * q, p: 0, c: 0, f: 0, isNumber: false };
            }
            registerFood(a);
        };

        // Quitar una comida ya registrada hoy y DESHACER su efecto en el contador
        // de calorías y en el déficit (revierte exactamente lo que hizo registerFood).
        window.deleteFoodLog = async function(i) {
            const list = Array.isArray(userData.foodLogToday) ? userData.foodLogToday : [];
            const item = list[i];
            if (!item) return;
            if (!(await axConfirm(`¿Quitar "${item.desc}" (${item.cal || 0} kcal) del registro de hoy?`, { ok: 'QUITAR', danger: true }))) return;
            const cal = +item.cal || 0;
            userData.caloriesConsumedToday = Math.max(0, (+userData.caloriesConsumedToday || 0) - cal);
            userData.totalNetDeficit = (+userData.totalNetDeficit || 0) + Math.round(cal * 0.15); // revierte el ajuste de registerFood
            userData.totalFoodLogs = Math.max(0, (+userData.totalFoodLogs || 0) - 1);
            list.splice(i, 1);
            saveData();
            updateDashboard();
            renderDietPage();
        };

        function registerFood(a) {
            userData.caloriesConsumedToday = (+userData.caloriesConsumedToday || 0) + a.cal;
            userData.totalNetDeficit = (+userData.totalNetDeficit || 0) - Math.round(a.cal * 0.15);
            userData.totalFoodLogs = (userData.totalFoodLogs || 0) + 1;
            if (!Array.isArray(userData.foodLogToday)) userData.foodLogToday = [];
            userData.foodLogToday.push({
                time: new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }),
                desc: a.name + (a.qty > 1 ? ` × ${a.qty} ${unitPlural(a.u, a.qty)}` : ''),
                cal: a.cal, p: a.p, c: a.c, f: a.f
            });
            if (typeof window.markActiveToday === 'function') window.markActiveToday();
            saveData();
            updateDashboard();
            if (typeof checkAchievements === 'function') checkAchievements();
            renderDietPage();
            const macroMsg = (a.p || a.c || a.f) ? ` · P ${a.p} · C ${a.c} · G ${a.f}` : '';
            axToast(`✅ +${a.cal.toLocaleString()} kcal registradas${macroMsg}.`);
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
                    <button class="pm-wf-chip" data-filter="espalda">ESPALDA</button>
                    <button class="pm-wf-chip" data-filter="hombro">HOMBRO</button>
                    <button class="pm-wf-chip" data-filter="brazo">BRAZO</button>
                    <button class="pm-wf-chip" data-filter="core">CORE</button>
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
                            : typeSlug.startsWith('pecho') ? 'pecho'
                            : typeSlug === 'espalda' ? 'espalda'
                            : typeSlug === 'biceps' || typeSlug === 'triceps' || typeSlug === 'antebrazo' ? 'brazo'
                            : typeSlug === 'core' || typeSlug === 'abdomen' || typeSlug === 'calistenia' ? 'core'
                            : typeSlug.startsWith('cardio') || typeSlug === 'carrera' ? 'cardio'
                            : typeSlug.startsWith('hiit') ? 'hiit'
                            : typeSlug;
                        // El badge usa el MISMO color que su chip de filtro (filterKey),
                        // así "CARDIO" en la tarjeta se ve igual que el chip CARDIO activo.
                        const badgeClass = filterKey;
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
                // Mostrar/ocultar tarjetas. OJO: premium.css pinta .exercise-card con
                // display:flex !important, así que el inline normal pierde — hay que
                // ocultar con !important inline (setProperty) para que el filtro gane.
                document.querySelectorAll('#pm-ex-catalog .exercise-card').forEach(card => {
                    if (filter === 'todos' || card.dataset.filterKey === filter) {
                        card.style.removeProperty('display');
                    } else {
                        card.style.setProperty('display', 'none', 'important');
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
        window.deleteWorkoutLog = async function(i) {
            const list = Array.isArray(userData.workoutLogToday) ? userData.workoutLogToday : [];
            const item = list[i];
            if (!item) return;
            if (!(await axConfirm(`¿Quitar "${item.name}" (-${item.cal || 0} kcal) del registro de hoy?`, { ok: 'QUITAR', danger: true }))) return;
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
            if (typeof window.markActiveToday === 'function') window.markActiveToday();
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
        axToast("Sensación registrada en el historial de Arthur.");
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
        // Enlace corto NEUTRO (creado en TinyURL, alias fijo 'axcoremx'): redirige
        // 301 a la app en GitHub Pages sin mostrar el nombre del dueño ni github.io
        // en el mensaje. Si algún día cambia el hosting, basta apuntar el alias.
        const APP_URL = 'https://tinyurl.com/axcoremx';
        axCountShare();   // suma a las insignias de COMUNIDAD
        if (navigator.share) {
            navigator.share({
                title: 'AX-CORE By ARTHUR',
                text: 'Te invito a AX-CORE 💪 Registra tu peso, tu dieta y tus entrenamientos, y mira tu evolución día a día. Entra aquí:',
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
    // 12 plantillas nuevas (JPEG web-safe en assets/). Campo `accent` = acento sugerido por plantilla
    // (neon|cyan|blood|fuchsia|gold). OJO: hoy el render NO lee este campo — el acento "auto" sale de
    // TACC[tpl.id] dentro de renderStudioCard. Queda como dato listo para cablear (ver reporte).
    const STUDIO_TEMPLATES = [
        { id:'verde',          name:'Verde',          accent:'neon',    bg: 'assets/plantilla-verde.jpg',          colors:['#39ff14','#0a1a0f','#8aff7a','#050d08'] },
        { id:'verde-lima',     name:'Verde Lima',     accent:'neon',    bg: 'assets/plantilla-verde-lima.jpg',     colors:['#ccff00','#131a05','#a8e000','#0a0d02'] },
        { id:'cian',           name:'Cian',           accent:'cyan',    bg: 'assets/plantilla-cian.jpg',           colors:['#00ffcc','#001a1a','#00e5ff','#000d0d'] },
        { id:'azul-electrico', name:'Azul Eléctrico', accent:'cyan',    bg: 'assets/plantilla-azul-electrico.jpg', colors:['#04d9ff','#00121f','#00a2ff','#00090f'] },
        { id:'azul-profundo',  name:'Azul Profundo',  accent:'cyan',    bg: 'assets/plantilla-azul-profundo.jpg',  colors:['#0077b3','#001522','#0099cc','#000b12'] },
        { id:'blanco',         name:'Blanco Hielo',   accent:'cyan',    bg: 'assets/plantilla-blanco.jpg',         colors:['#e8f4ff','#0d1218','#b3e0ff','#05080c'] },
        { id:'rojo',           name:'Rojo Carmesí',   accent:'blood',   bg: 'assets/plantilla-rojo.jpg',           colors:['#ff2222','#1a0000','#cc1a1a','#0d0000'] },
        { id:'rosa',           name:'Rosa Magenta',   accent:'fuchsia', bg: 'assets/plantilla-rosa.jpg',           colors:['#ff6ec7','#1a0512','#ff00ff','#0d0209'] },
        { id:'morado',         name:'Morado Violeta', accent:'fuchsia', bg: 'assets/plantilla-morado.jpg',         colors:['#bf5fff','#0f0620','#8a2be2','#080310'] },
        { id:'dorado',         name:'Dorado Campeón', accent:'gold',    bg: 'assets/plantilla-dorado.jpg',         colors:['#ffd700','#1a1500','#d4af37','#0d0a00'] },
        { id:'naranja',        name:'Naranja Ámbar',  accent:'gold',    bg: 'assets/plantilla-naranja.jpg',        colors:['#ff9500','#1a0d00','#ffaa33','#0d0600'] },
        { id:'atardecer',      name:'Atardecer',      accent:'gold',    bg: 'assets/plantilla-atardecer.jpg',      colors:['#ff6b3d','#1a0a05','#ffb347','#0d0502'] }
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
    // PASO 6 — FRASES: título (líneas ya agrupadas para canvas, máx 3) + subtítulo (2 líneas).
    // La frase 9 trae 4 palabras agrupadas en 3 líneas equilibradas ("MÁS" / "ALLÁ DEL" / "LÍMITE").
    // La frase 12 trae solo 2 palabras → 2 líneas (sin línea vacía forzada).
    const STUDIO_PHRASES = [
        { id:1,  title:'MI AVANCE HOY',          lines:['MI','AVANCE','HOY'],            sub:['SIGUE ENFOCADO','SIGUE EVOLUCIONANDO'] },
        { id:2,  title:'SIENTO EL PODER',        lines:['SIENTO','EL','PODER'],          sub:['CADA DÍA','MÁS FUERTE'] },
        { id:3,  title:'AQUÍ Y AHORA',           lines:['AQUÍ','Y','AHORA'],             sub:['SIN EXCUSAS','SIN LÍMITES'] },
        { id:4,  title:'ESTO ES DISCIPLINA',     lines:['ESTO','ES','DISCIPLINA'],       sub:['MENTE FIRME','CUERPO FUERTE'] },
        { id:5,  title:'UN PASO MÁS',            lines:['UN','PASO','MÁS'],              sub:['HACIA LA','MEJOR VERSIÓN'] },
        { id:6,  title:'NADA ME DETIENE',        lines:['NADA','ME','DETIENE'],          sub:['CONSTANCIA PURA','RESULTADOS REALES'] },
        { id:7,  title:'FORJANDO MI CAMINO',     lines:['FORJANDO','MI','CAMINO'],       sub:['ESFUERZO HOY','ORGULLO MAÑANA'] },
        { id:8,  title:'MODO SIN FRENO',         lines:['MODO','SIN','FRENO'],           sub:['LATE FUERTE','RESPIRA HONDO'] },
        { id:9,  title:'MÁS ALLÁ DEL LÍMITE',    lines:['MÁS','ALLÁ DEL','LÍMITE'],      sub:['ROMPE LA','BARRERA MENTAL'] },
        { id:10, title:'CONSTRUYO MI FUERZA',    lines:['CONSTRUYO','MI','FUERZA'],      sub:['LADRILLO A','LADRILLO'] },
        { id:11, title:'HOY GANO YO',            lines:['HOY','GANO','YO'],              sub:['CONTRA MI','PROPIO RÉCORD'] },
        { id:12, title:'ENERGÍA IMPARABLE',      lines:['ENERGÍA','IMPARABLE'],          sub:['CUERPO ACTIVO','MENTE CLARA'] }
    ];

    let studioState = {
        tpl: 'verde', fmt: 'story', metrics: ['deficit','weight','waist'],
        textColor: 'theme', textSize: 1.0,
        accentColor: '#22c55e',    // FIJO por defecto (= primer color de COLOR PRINCIPAL,
                                    // VERDE). Solo cambia desde ahí — la plantilla NO lo toca.
        phraseId: 1,               // PASO 6 — frase activa (título+subtítulo de la tarjeta)
        badgeId: null,             // insignia lucida arriba-derecha (null = ninguna). Máx 1.
        hudStyle: 'tech-corners',  // (legacy)
        fontStyle: 'bold-impact',  // bold-impact | tech-mono | elegant-sans
        overlayFilter: 'clear',    // clear | glitch | grain | vignette (fijo: PASO 6 quitó su UI)
        cardStyle: 'hud-tactical', // hud-tactical | carbon-elite | data-panel | editorial | split-hero | nordic-dark
        heroMetric: 'deficit',     // métrica principal (número grande)
        activeTab: 'diseno'        // tab activo — persiste entre renderStudioPage() calls
    };

    const STUDIO_BG_IMAGES = {};
    let isStudioPreloading = false;
    let STUDIO_LOGO_IMG = null;
    // QR del enlace de descarga de la app para la tarjeta.
    // OJO: antes apuntaba a 'QR_APP_ATLETA.png', que .gitignore excluye con la regla
    // `QR_*.png` — nunca llegó al repo, daba 404 en el sitio publicado y en la tarjeta
    // solo quedaba el recuadro blanco. Ahora vive en assets/ (sí versionado).
    const STUDIO_QR_SRC = 'assets/qr-axcore.png?v=1';
    let STUDIO_QR_IMG = null;

    // Medallas elegidas para la esquina superior derecha de la tarjeta (id → Image).
    const STUDIO_MEDAL_IMGS = {};
    const _studioMedalPending = {};
    // La tarjeta luce UNA sola insignia (decisión del dueño: 2-3 saturaban la esquina).
    // El selector es de una-a-la-vez; este tope queda como salvaguarda si algún día se amplía.
    const AX_MAX_CARD_BADGES = 1;

    // Carga (una sola vez) la imagen de una insignia para poder dibujarla en el canvas.
    function loadStudioMedal(id) {
        if (!id || STUDIO_MEDAL_IMGS[id] || _studioMedalPending[id]) return;
        const def = ACHIEVEMENTS_DEF.find(a => a.id === id);
        const src = def ? axMedalImg(def) : null;
        if (!src) return;
        _studioMedalPending[id] = true;
        const im = new Image(); im.crossOrigin = 'anonymous';
        im.onload  = () => { STUDIO_MEDAL_IMGS[id] = im; _studioMedalPending[id] = false; _studioTryRedraw(); };
        im.onerror = () => { _studioMedalPending[id] = false; };
        im.src = src;
    }

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
                    const q = new Image(); q.crossOrigin = 'anonymous';
                    q.onload = () => { STUDIO_QR_IMG = q; _studioTryRedraw(); r(); };
                    q.onerror = () => { r(); };
                    q.src = STUDIO_QR_SRC;
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
        // ── PASO 3: tarjeta "MI AVANCE HOY" (diseño fijo). Lee: tpl (foto), accentColor
        //    (acento; AUTO=color insignia de la plantilla), fmt, fontStyle/textColor/textSize
        //    y overlayFilter. Datos reales: déficit, peso, entrenamientos, racha, progreso %.
        let tpl = STUDIO_TEMPLATES.find(t => t.id === tplId);
        if (tplId === 'custom') tpl = { id:'custom', colors:['#39ff14','#0a1a0f','#8aff7a','#050d08'] };
        else if (!tpl) tpl = STUDIO_TEMPLATES[0];
        const fmt = STUDIO_FORMATS.find(f => f.id === fmtId) || STUDIO_FORMATS[0];
        const W = fmt.w, H = fmt.h;
        canvas.width = W; canvas.height = H;
        const ctx = canvas.getContext('2d');

        // Columna de contenido (retrato). En paisaje se centra más angosta.
        const isLand = fmtId === 'landscape';
        // PASO 5h: CUADRADO tiene 20% menos alto que STORY con el mismo CW (texto del
        // mismo tamaño en px) — sin este flag el grid/progreso/pie quedaban encimados.
        const isSquare = fmtId === 'square';
        const CW = isLand ? Math.round(H * 0.82) : W;
        const ox = Math.round((W - CW) / 2);
        const padX = ox + Math.round(CW * 0.075);
        const contW = CW - Math.round(CW * 0.075) * 2;

        // ── ACENTO: SOLO lo decide COLOR PRINCIPAL, nunca la plantilla (FIX: antes 'theme'
        //    tomaba tpl.colors[0] y el acento cambiaba solo al cambiar de plantilla) ──
        const APAL = { neon:'#00e5ff', cyan:'#00ffcc', gold:'#ffd700', blood:'#ff2222', fuchsia:'#ff00e5' };
        let accent;
        if (typeof studioState.accentColor === 'string' && studioState.accentColor.charAt(0) === '#') {
            accent = studioState.accentColor;                       // color custom (picker o preset hex)
        } else {
            accent = APAL[studioState.accentColor] || '#22c55e';    // compat valores nombrados viejos (o default fijo)
        }
        const hex = (h) => { h = (h || '#000').replace('#',''); if (h.length === 3) h = h.split('').map(c => c + c).join('');
            return [parseInt(h.slice(0,2),16)||0, parseInt(h.slice(2,4),16)||0, parseInt(h.slice(4,6),16)||0]; };
        const AR = hex(accent);
        const ac = (a) => `rgba(${AR[0]},${AR[1]},${AR[2]},${a})`;

        // ── Tipografía / color / escala (siguen vivos desde el chrome) ──
        // Los 3 valores originales se conservan intactos (compat con estado guardado).
        // PASO 5d: 12 familias RADICALMENTE distintas (una por categoría tipográfica)
        // para las tarjetas de TIPOGRAFÍA (solo "Aa").
        const FM = {
            'bold-impact':   { fam:"Impact,'Arial Narrow',sans-serif", wt:'900' },
            'tech-mono':     { fam:"'Courier New',Courier,monospace",  wt:'800' },
            'elegant-sans':  { fam:"'Trebuchet MS',Arial,sans-serif",  wt:'800' },
            'orbitron':      { fam:"'Orbitron',sans-serif",      wt:'800' },  // display/tech geométrica
            'bebas-neue':    { fam:"'Bebas Neue',sans-serif",    wt:'400' },  // condensada alta
            'playfair':      { fam:"'Playfair Display',serif",  wt:'700' },  // serif clásica
            'space-mono':    { fam:"'Space Mono',monospace",    wt:'700' },  // monoespaciada
            'fjalla-one':    { fam:"'Fjalla One',sans-serif",   wt:'400' },  // condensada deportiva (reemplaza script, no pegaba con fitness)
            'fredoka':       { fam:"'Fredoka',sans-serif",      wt:'600' },  // redondeada
            'rokkitt':       { fam:"'Rokkitt',serif",           wt:'700' },  // slab
            'montserrat':    { fam:"'Montserrat',sans-serif",   wt:'800' },  // humanista limpia
            'archivo-black': { fam:"'Archivo Black',sans-serif",wt:'400' },  // grotesk pesada
            'russo-one':     { fam:"'Russo One',sans-serif",    wt:'400' },  // futurista
            'raleway-light': { fam:"'Raleway',sans-serif",      wt:'300' },  // elegante fina
            'bungee':        { fam:"'Bungee',cursive",          wt:'400' }   // graffiti/impact
        };
        const fd = FM[studioState.fontStyle] || FM['bold-impact'];
        const tS = Math.max(0.5, Math.min(2.5, studioState.textSize || 1));
        const cc = (studioState.textColor && studioState.textColor !== 'theme') ? studioState.textColor : '#ffffff';
        const titleFont = (px) => `${fd.wt} ${Math.round(px * tS)}px ${fd.fam}`;
        const sans = (px, wt) => `${wt || '700'} ${Math.round(px * tS)}px 'Segoe UI',Arial,sans-serif`;
        const rr = (x,y,w,h,r) => { ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(x,y,w,h,r); else ctx.rect(x,y,w,h); };

        // ── Datos reales ──
        const deficitV = (userData.totalNetDeficit || 0).toLocaleString('es-MX');
        const pesoV    = (userData.weight || 0) + 'kg';
        const workV    = String(userData.totalWorkouts || 0);
        const streak   = (typeof streakDays === 'function') ? streakDays() : ((userData.history && userData.history.length) || 0);
        const rachaV   = streak + (streak === 1 ? ' día' : ' días');
        const wNow = +(userData.weight || 0), twG = +(userData.target_weight || 0);
        const swG  = +(userData.startWeight || (userData.history && userData.history[0] && userData.history[0].weight) || wNow);
        let pct = 0;
        if (swG > twG && swG > 0) pct = Math.max(0, Math.min(100, Math.round((Math.max(0, swG - wNow) / (swG - twG)) * 100)));
        const MESES = ['ENE','FEB','MAR','ABR','MAY','JUN','JUL','AGO','SEP','OCT','NOV','DIC'];
        const nd = new Date();
        const fechaV = `${nd.getDate()} ${MESES[nd.getMonth()]} ${nd.getFullYear()}`;

        // ── Fondo (foto) + oscurecido izquierda/base + tinte de acento ──
        drawStudioBg(ctx, W, H, tpl);
        // Oscurecer SOLO la izquierda (para el texto). La foto de la persona queda nítida a la derecha.
        let g1 = ctx.createLinearGradient(ox, 0, ox + CW, 0);
        g1.addColorStop(0,'rgba(2,5,4,0.88)'); g1.addColorStop(0.30,'rgba(2,5,4,0.55)');
        g1.addColorStop(0.50,'rgba(2,5,4,0.06)'); g1.addColorStop(0.72,'rgba(2,5,4,0)');
        ctx.fillStyle = g1; ctx.fillRect(0, 0, W, H);
        if (isLand) { ctx.fillStyle = 'rgba(2,5,4,0.45)'; ctx.fillRect(0,0,ox,H); ctx.fillRect(ox+CW,0,W-(ox+CW),H); }
        // Oscurecer solo la base (para el pie/QR y el grid), dejando libre la parte alta de la foto.
        let g2 = ctx.createLinearGradient(0, H*0.66, 0, H);
        g2.addColorStop(0,'rgba(2,5,4,0)'); g2.addColorStop(0.5,'rgba(2,5,4,0.55)'); g2.addColorStop(1,'rgba(2,5,4,0.9)');
        ctx.fillStyle = g2; ctx.fillRect(0, Math.round(H*0.66), W, Math.round(H*0.34));

        // Marco interior con brillo de acento
        const ins = Math.round(CW * 0.022);
        ctx.save();
        ctx.strokeStyle = ac(0.5); ctx.lineWidth = Math.max(2, CW*0.004);
        ctx.shadowColor = ac(0.5); ctx.shadowBlur = Math.round(CW*0.02);
        rr(ox+ins, ins, CW-ins*2, H-ins*2, Math.round(CW*0.035)); ctx.stroke();
        ctx.restore();

        ctx.textBaseline = 'alphabetic';

        // ── Header: logo + AX-CORE / BY ARTHUR ──
        const logoTop = Math.round(H * 0.065);
        const logoS = Math.round(CW * 0.085);
        if (STUDIO_LOGO_IMG) {
            ctx.save();
            ctx.beginPath(); ctx.arc(padX + logoS/2, logoTop + logoS/2, logoS/2, 0, Math.PI*2); ctx.clip();
            ctx.drawImage(STUDIO_LOGO_IMG, padX, logoTop, logoS, logoS);
            ctx.restore();
            ctx.beginPath(); ctx.arc(padX + logoS/2, logoTop + logoS/2, logoS/2, 0, Math.PI*2);
            ctx.strokeStyle = ac(0.75); ctx.lineWidth = Math.max(1.5, CW*0.003); ctx.stroke();
        }
        const headTx = padX + logoS + Math.round(CW * 0.028);
        ctx.textAlign = 'left';
        ctx.fillStyle = cc; ctx.font = sans(Math.round(CW*0.05), '900');
        ctx.fillText('AX-CORE', headTx, logoTop + logoS*0.48);
        ctx.fillStyle = ac(0.92); ctx.font = sans(Math.round(CW*0.023), '800');
        ctx.fillText('BY ARTHUR', headTx, logoTop + logoS*0.82);

        // ── Insignia lucida (esquina superior derecha) — UNA sola, opcional ──
        // Espejo del logo: misma zona alta, alineada al margen derecho del contenido.
        // Sombra suave para separarla de la foto sin recuadros (queda limpia, no saturada).
        if (studioState.badgeId) {
            const bdef = ACHIEVEMENTS_DEF.find(a => a.id === studioState.badgeId);
            if (bdef) {
                const bimg = STUDIO_MEDAL_IMGS[studioState.badgeId];
                if (!bimg) loadStudioMedal(studioState.badgeId);  // async → redibuja al cargar
                const bS = Math.round(CW * 0.175);
                const bX = padX + contW - bS;
                const bY = Math.round(H * 0.05);
                if (bimg && bimg.complete && bimg.naturalWidth) {
                    ctx.save();
                    ctx.shadowColor = 'rgba(0,0,0,0.55)';
                    ctx.shadowBlur = Math.round(CW * 0.03);
                    ctx.shadowOffsetY = Math.max(1, Math.round(CW * 0.004));
                    ctx.drawImage(bimg, bX, bY, bS, bS);
                    ctx.restore();
                    // Número sobrepuesto (mismo lugar que en el panel: ~66% de la altura)
                    const bnum = axMedalNum(bdef);
                    if (bnum) {
                        const TIERCOL = { 1:'#f7cf9b', 2:'#eef2f8', 3:'#ffe08a', 4:'#c6f6ff', 5:'#d6ffd9' };
                        const tier = Math.min(5, Math.max(1, +(bdef.t || bdef.tier || 1)));
                        ctx.save();
                        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
                        ctx.font = `700 ${Math.round(bS * 0.21)}px 'Oswald','Segoe UI',sans-serif`;
                        ctx.fillStyle = TIERCOL[tier] || '#ffffff';
                        ctx.shadowColor = 'rgba(0,0,0,0.95)'; ctx.shadowBlur = Math.round(CW * 0.012);
                        ctx.fillText(bnum, bX + bS/2, bY + bS * 0.66);
                        ctx.restore();
                    }
                }
                ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';  // restaurar para lo que sigue
            }
        }

        // ── Título (PASO 6: líneas dinámicas según la FRASE elegida, 2-3 líneas) ──
        const phrase = STUDIO_PHRASES.find(p => p.id === studioState.phraseId) || STUDIO_PHRASES[0];
        const titleLines = phrase.lines;
        let tPx = Math.round(CW * 0.14);
        // Auto-ajuste: si la línea más ancha no cabe en el contenido (frases con palabras
        // largas o líneas agrupadas de 4 palabras), se achica el título hasta que quepa,
        // en AMBOS formatos (contW ya varía por formato).
        ctx.font = titleFont(tPx);
        const maxLineW = Math.max(...titleLines.map(w => ctx.measureText(w).width));
        const maxAllowedW = contW * 0.94;
        if (maxLineW > maxAllowedW) tPx = Math.round(tPx * (maxAllowedW / maxLineW));
        const lh  = Math.round(tPx * 0.88 * tS);
        let yMI = Math.round(H * 0.18) + Math.round(tPx * tS);
        ctx.textAlign = 'left'; ctx.font = titleFont(tPx);
        const titleLine = (txt, color, yy, glow) => {
            ctx.save(); ctx.fillStyle = color;
            if (glow) { ctx.shadowColor = ac(0.85); ctx.shadowBlur = Math.round(CW*0.03); }
            else { ctx.shadowColor = 'rgba(0,0,0,0.6)'; ctx.shadowBlur = Math.round(CW*0.012); ctx.shadowOffsetY = 2; }
            ctx.fillText(txt, padX, yy); ctx.restore();
        };
        // Línea de acento = la de en medio (o la última si solo hay 2 líneas) — mismo
        // ritmo visual blanco/acento/blanco que "MI / AVANCE / HOY".
        const accentIdx = Math.min(1, titleLines.length - 1);
        titleLines.forEach((word, i) => {
            titleLine(word, i === accentIdx ? accent : '#ffffff', yMI + lh * i, i === accentIdx);
        });

        // ── Subtítulo (2 líneas de la frase elegida) ──
        let y = yMI + lh * (titleLines.length - 1) + Math.round(H * 0.042);
        ctx.fillStyle = 'rgba(255,255,255,0.85)'; ctx.font = sans(Math.round(CW*0.032), '700');
        ctx.fillText(phrase.sub[0] || '', padX, y);
        y += Math.round(H * 0.033);
        ctx.fillText(phrase.sub[1] || '', padX, y);

        // ── Fecha (acento) ──
        y += Math.round(H * 0.044);
        ctx.fillStyle = accent; ctx.font = sans(Math.round(CW*0.036), '800');
        ctx.save(); ctx.shadowColor = ac(0.6); ctx.shadowBlur = Math.round(CW*0.01);
        ctx.fillText(fechaV, padX, y); ctx.restore();

        // ── Grid 2×2 ── (CUADRADO: crece para dar aire entre filas/celdas; PASO 5j lo
        //    sube un poco más para liberar más espacio en la zona baja)
        const gy = y + Math.round(H * (isSquare ? 0.004 : 0.022));
        const gW = contW, gH = Math.round(H * (isSquare ? 0.1407 : 0.13)), gx = padX;
        const cwd = gW/2, chd = gH/2;
        ctx.save(); rr(gx, gy, gW, gH, Math.round(CW*0.022));
        ctx.fillStyle = 'rgba(4,8,10,0.74)'; ctx.fill();
        ctx.strokeStyle = ac(0.55); ctx.lineWidth = Math.max(2, CW*0.0035); ctx.stroke(); ctx.restore();
        // Divisores completos (tenues con acento) para paneles bien definidos
        ctx.save(); ctx.strokeStyle = ac(0.30); ctx.lineWidth = Math.max(1.2, CW*0.002);
        ctx.beginPath(); ctx.moveTo(gx+cwd, gy+chd*0.12); ctx.lineTo(gx+cwd, gy+gH-chd*0.12); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(gx+cwd*0.05, gy+chd); ctx.lineTo(gx+gW-cwd*0.05, gy+chd); ctx.stroke();
        ctx.restore();

        const drawIcon = (type, ix, iy, s) => {
            ctx.save(); ctx.strokeStyle = accent; ctx.fillStyle = accent;
            ctx.lineWidth = Math.max(1.6, s*0.09); ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.translate(ix, iy);
            if (type === 'deficit') {
                ctx.beginPath(); ctx.moveTo(s*0.5,s*0.02); ctx.bezierCurveTo(s*0.98,s*0.55,s*0.78,s,s*0.5,s);
                ctx.bezierCurveTo(s*0.22,s,s*0.02,s*0.55,s*0.5,s*0.02); ctx.stroke();
            } else if (type === 'peso') {
                ctx.beginPath(); ctx.moveTo(s*0.18,s*0.5); ctx.lineTo(s*0.82,s*0.5); ctx.stroke();
                ctx.strokeRect(s*0.04,s*0.3,s*0.14,s*0.4); ctx.strokeRect(s*0.82,s*0.3,s*0.14,s*0.4);
            } else if (type === 'work') {
                ctx.beginPath(); ctx.arc(s*0.5,s*0.18,s*0.15,0,Math.PI*2); ctx.stroke();
                ctx.beginPath(); ctx.moveTo(s*0.5,s*0.33); ctx.lineTo(s*0.5,s*0.66);
                ctx.moveTo(s*0.18,s*0.46); ctx.lineTo(s*0.82,s*0.46);
                ctx.moveTo(s*0.5,s*0.66); ctx.lineTo(s*0.28,s); ctx.moveTo(s*0.5,s*0.66); ctx.lineTo(s*0.72,s); ctx.stroke();
            } else {
                ctx.beginPath(); ctx.moveTo(s*0.5,0); ctx.bezierCurveTo(s*0.95,s*0.38,s*0.72,s*0.72,s*0.5,s);
                ctx.bezierCurveTo(s*0.28,s*0.72,s*0.12,s*0.4,s*0.42,s*0.18);
                ctx.bezierCurveTo(s*0.46,s*0.42,s*0.62,s*0.42,s*0.5,0); ctx.stroke();
            }
            ctx.restore();
        };
        // Grid: 4 métricas REALES con valor (nunca 0). Se sustituye automáticamente por otra que sí exista.
        const _num = (v) => +v || 0;
        const diasAct = (userData.history && userData.history.length) || 0;
        const pool = [
            ['deficit','DÉFICIT KCAL',   _num(userData.totalNetDeficit) !== 0,    deficitV],
            ['peso',   'PESO ACTUAL',    _num(userData.weight) > 0,               pesoV],
            ['work',   'ENTRENAMIENTOS', _num(userData.totalWorkouts) > 0,        workV],
            ['racha',  'RACHA',          _num(streak) > 0,                        rachaV],
            ['racha',  'DÍAS ACTIVOS',   diasAct > 0,                             String(diasAct)],
            ['deficit','CAL. QUEMADAS',  _num(userData.totalCaloriesBurned) > 0,  _num(userData.totalCaloriesBurned).toLocaleString('es-MX')],
            ['peso',   'CINTURA',        _num(userData.waist) > 0,                _num(userData.waist)+'cm'],
            ['work',   'BÍCEPS',         _num(userData.bicep) > 0,                _num(userData.bicep)+'cm'],
            ['peso',   'PECHO',          _num(userData.chest) > 0,                _num(userData.chest)+'cm'],
            ['peso',   'PIERNA',         _num(userData.leg) > 0,                  _num(userData.leg)+'cm'],
            ['peso',   'META PESO',      _num(userData.target_weight) > 0,        _num(userData.target_weight)+'kg'],
            ['peso',   'ALTURA',         _num(userData.height) > 0,               _num(userData.height)+'cm']
        ];
        let cells = pool.filter(p => p[2]).map(p => [p[0], p[1], p[3]]);
        if (cells.length < 4) {
            const fb = [['deficit','DÉFICIT KCAL',deficitV],['peso','PESO ACTUAL',pesoV],['work','ENTRENAMIENTOS',workV],['racha','RACHA',rachaV]];
            for (const f of fb) { if (cells.length >= 4) break; if (!cells.some(c => c[1] === f[1])) cells.push(f); }
        }
        cells = cells.slice(0, 4);
        cells.forEach((c, i) => {
            const col = i % 2, row = Math.floor(i / 2);
            const bx = gx + col*cwd + Math.round(CW*0.03);
            const bcy = gy + row*chd + chd*0.5;
            const s = Math.round(CW*0.052);
            drawIcon(c[0], bx, bcy - s*0.5, s);
            const tx = bx + s + Math.round(CW*0.025);
            ctx.textAlign = 'left';
            // Etiqueta arriba (chica) + valor abajo (mediano) — separados para que el valor
            // no encime la etiqueta ni se salga del cuadrante (PASO 5g).
            ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.font = sans(Math.round(CW*0.021), '800');
            ctx.fillText(c[1], tx, bcy - s*0.30);
            ctx.fillStyle = cc; ctx.font = sans(Math.round(CW*0.033), '900');
            ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.6)'; ctx.shadowBlur = Math.round(CW*0.006);
            ctx.fillText(c[2], tx, bcy + s*0.46); ctx.restore();
        });

        // ── QR abajo-derecha (se dibuja antes para calcular el área libre de la barra) ──
        // CUADRADO: se achica y se ancla debajo del grid, con margen real hasta el borde.
        const qrS = Math.round(CW * (isSquare ? 0.088 : 0.135));
        const qrX = padX + contW - qrS;
        const qrY = isSquare ? (gy + gH + Math.round(H * 0.011)) : (Math.round(H * 0.96) - qrS);
        ctx.save();
        const qp = Math.round(CW*0.008);
        rr(qrX - qp, qrY - qp, qrS + qp*2, qrS + qp*2, Math.round(CW*0.01)); ctx.fillStyle = '#ffffff'; ctx.fill();
        if (STUDIO_QR_IMG) ctx.drawImage(STUDIO_QR_IMG, qrX, qrY, qrS, qrS);
        ctx.restore();

        // ── Progreso general (o métrica motivadora real si no hay meta de peso) ──
        let progLabel, progBig, barFrac;
        if (twG > 0 && swG > twG) {
            progLabel = 'PROGRESO GENERAL'; progBig = pct + '%'; barFrac = pct / 100;
        } else {
            const dias = (userData.history && userData.history.length) || streak || 0;
            progLabel = 'DÍAS ACTIVOS'; progBig = String(dias);
            barFrac = Math.max(0.06, Math.min(1, dias / 30));
        }
        // PASO 5h: en CUADRADO menos espacio hasta el número + número más chico, así
        // no choca contra la etiqueta de arriba ni empuja el pie fuera del canvas.
        const pLabelY = gy + gH + Math.round(H * (isSquare ? 0.0222 : 0.037));
        ctx.textAlign = 'left'; ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.font = sans(Math.round(CW*0.026), '800');
        ctx.fillText(progLabel, padX, pLabelY);
        const pPctY = pLabelY + Math.round(H * (isSquare ? 0.0455 : 0.063));
        // PASO 5j: número aún más chico en CUADRADO para dejar más aire hacia el pie.
        ctx.fillStyle = accent; ctx.font = sans(Math.round(CW*(isSquare ? 0.046 : 0.078)), '900');
        ctx.save(); ctx.shadowColor = ac(0.55); ctx.shadowBlur = Math.round(CW*0.012);
        ctx.fillText(progBig, padX, pPctY); ctx.restore();
        const pctW = ctx.measureText(progBig).width;
        const barX = padX + pctW + Math.round(CW*0.045);
        const barRight = (qrY - Math.round(CW*0.04) < pPctY) ? (qrX - Math.round(CW*0.05)) : (padX + contW);
        const barW = Math.max(Math.round(CW*0.15), barRight - barX);
        const barH = Math.round(H * 0.016);
        const barY = pPctY - Math.round(H * 0.019);
        ctx.save();
        rr(barX, barY, barW, barH, barH/2); ctx.fillStyle = 'rgba(255,255,255,0.14)'; ctx.fill();
        rr(barX, barY, Math.max(barH, barW * barFrac), barH, barH/2);
        ctx.fillStyle = accent; ctx.shadowColor = ac(0.5); ctx.shadowBlur = Math.round(CW*0.008); ctx.fill();
        ctx.restore();

        // ── Pie: tagline + #AXCORE (izquierda) ──
        // CUADRADO: no se ancla al borde inferior (chocaba con el número de progreso) —
        // se ancla debajo del progreso. PASO 5j: aún más separación entre renglones
        // (DÍAS ACTIVOS/barra → tagline → #AXCORE) y más margen real hasta el marco.
        const fY = isSquare ? (pPctY + Math.round(CW * 0.030)) : (H - Math.round(H * 0.075));
        ctx.textAlign = 'left'; ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.font = sans(Math.round(CW*(isSquare ? 0.018 : 0.023)), '700');
        ctx.fillText('DISCIPLINA. CONSTANCIA. EVOLUCIÓN.', padX, fY);
        ctx.fillStyle = accent; ctx.font = sans(Math.round(CW*(isSquare ? 0.023 : 0.03)), '900');
        ctx.fillText('#AXCORE', padX, fY + Math.round(CW*(isSquare ? 0.034 : 0.04)));

        // ── Filtro overlay (se conserva, siempre al final) ──
        const filter = studioState.overlayFilter || 'clear';
        if (filter === 'vignette') {
            const vg = ctx.createRadialGradient(W/2,H/2,H*0.28,W/2,H/2,H*0.72);
            vg.addColorStop(0,'rgba(0,0,0,0)'); vg.addColorStop(1,'rgba(0,0,0,0.7)');
            ctx.fillStyle = vg; ctx.fillRect(0,0,W,H);
        } else if (filter === 'grain') {
            ctx.save();
            for (let yy=0; yy<H; yy+=2) { ctx.fillStyle = `rgba(255,255,255,${Math.random()*0.035})`; ctx.fillRect(0,yy,W,1); }
            ctx.restore();
        } else if (filter === 'glitch') {
            ctx.save(); ctx.lineWidth = 1; ctx.strokeStyle = 'rgba(0,0,0,0.18)';
            for (let yy=0; yy<H; yy+=4) { ctx.beginPath(); ctx.moveTo(0,yy); ctx.lineTo(W,yy); ctx.stroke(); }
            for (let i=0; i<6; i++) { ctx.fillStyle = (i%2===0?accent:'#ff2222')+'2a'; ctx.fillRect(0,Math.random()*H,W,Math.random()*5+1); }
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

            <!-- ═══ STUDIO CORE — la TARJETA queda FIJA arriba; el resto scrollea por debajo ═══ -->
            <div class="sx-core sx-scrollmode">

                <!-- ═══ ZONA FIJA (pinada): tarjeta + título + barra de INSIGNIAS. Todo esto
                     queda arriba fijo (sticky) y SOLO los controles de abajo hacen scroll. ═══ -->
                <div class="sx-pinned">

                <!-- TÍTULO + INSIGNIAS — ARRIBA de la imagen que se edita (todo el bloque es fijo) -->
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

                <!-- INSIGNIAS (acordeón — ver TODAS tus medallas) -->
                <div class="sx-ach-bar">
                    <button class="sx-ach-toggle" onclick="this.closest('.sx-ach-bar').classList.toggle('sx-ach-open')">
                        <span class="sx-ach-lbl">🎖 INSIGNIAS &nbsp;·&nbsp; <span style="color:var(--accent-main)">${earnedCount}</span><span style="color:rgba(255,255,255,0.35)">/${ACHIEVEMENTS_DEF.length}</span> desbloqueadas</span>
                        <span class="sx-ach-chevron">›</span>
                    </button>
                    <div class="sx-ach-body">
                        <div id="achievements-panel" style="display:grid; grid-template-columns:repeat(auto-fill,minmax(78px,1fr)); gap:7px; padding:12px 14px 16px;"></div>
                    </div>
                </div>

                <!-- TARJETA (canvas) + ACCIONES — la imagen que se edita, DEBAJO del título/insignias -->
                <div class="sx-stage">
                    <div class="sx-canvas-frame">
                        <div class="sx-canvas-glow"></div>
                        <canvas id="studio-preview-canvas"></canvas>
                    </div>
                    <div class="sx-actions">
                        <button class="sx-act" title="Vista previa en pantalla completa" onclick="window.openStudioFullscreenPreview()">
                            <span class="sx-act-ico"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg></span>
                            <span class="sx-act-lbl">VISTA</span>
                        </button>
                        <button class="sx-act" title="Guardar en descargas" onclick="window.downloadStudioCardHD()">
                            <span class="sx-act-ico"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg></span>
                            <span class="sx-act-lbl">DESCARGAR</span>
                        </button>
                        <button class="sx-act sx-act-primary" title="Compartir logros" onclick="window.shareStudioCard()">
                            <span class="sx-act-ico"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg></span>
                            <span class="sx-act-lbl">COMPARTIR</span>
                        </button>
                    </div>
                </div>

                </div><!-- /.sx-pinned (fin de la zona fija) -->

                <!-- PESTAÑAS OCULTAS — se conservan .studio-pro-tab y [data-stab] para NO tocar el wiring/restorer -->
                <div class="studio-pro-tabs sx-tabbar" style="display:none" aria-hidden="true">
                    <button class="studio-pro-tab active" data-stab="diseno"></button>
                    <button class="studio-pro-tab" data-stab="metricas"></button>
                    <button class="studio-pro-tab" data-stab="estilo"></button>
                    <button class="studio-pro-tab" data-stab="fondo"></button>
                    <button class="studio-pro-tab" data-stab="fx"></button>
                </div>

                <!-- SECCIONES EN SCROLL VERTICAL -->
                <div class="sx-scroll">

                    <!-- 1. PLANTILLAS -->
                    <section class="sx-section">
                        <div class="sx-sn-h">PLANTILLAS</div>
                        <div class="studio-templates" id="studio-tpl-list"></div>
                    </section>

                    <!-- 1b. INSIGNIA (opcional — se luce arriba-derecha en la tarjeta) -->
                    <section class="sx-section">
                        <div class="sx-sn-h">🎖 INSIGNIA <span class="sx-sn-opt">— opcional · esquina superior</span></div>
                        <div class="sx-badge-row" id="studio-badge-row"></div>
                    </section>

                    <!-- 2. COLOR PRINCIPAL (acento — ya existe: studioState.accentColor) -->
                    <section class="sx-section">
                        <div class="sx-sn-h">COLOR PRINCIPAL</div>
                        <div id="studio-accent-btns" class="studio-pro-pills sx-accent-pills sx-color-row"></div>
                    </section>

                    <!-- FILA: 3. TIPOGRAFÍA | 4. DISEÑO Y EFECTOS -->
                    <div class="sx-row">
                        <section class="sx-section">
                            <div class="sx-sn-h">TIPOGRAFÍA</div>
                            <div id="studio-font-btns" class="studio-pro-pills sx-font-pills"></div>
                        </section>
                        <section class="sx-section">
                            <div class="sx-sn-h">FRASES</div>
                            <div id="studio-phrase-btns" class="sx-phrase-row"></div>
                        </section>
                    </div>

                    <!-- FORMATOS (antes compartía fila con COMPARTIR — eliminado en PASO 5g) -->
                    <section class="sx-section">
                        <div class="sx-sn-h">FORMATOS</div>
                        <div class="studio-format-btns sx-fmt-seg" id="studio-fmt-btns"></div>
                    </section>

                </div><!-- /.sx-scroll -->

            </div><!-- /.sx-core -->
        `;

        // La tarjeta FIJA se ancla justo debajo de la top-bar sticky de la app. Medimos su
        // alto real (por si cambia con el tema/tamaño) y lo exponemos como variable CSS para
        // que la tarjeta no arranque escondida bajo la barra ni se mueva al hacer scroll.
        const _tb = document.querySelector('.top-bar');
        el.style.setProperty('--sx-topbar-h', (((_tb && _tb.getBoundingClientRect().height) || 66)) + 'px');

        // Pintar medallas
        if (typeof renderAchievementsPanel === 'function') renderAchievementsPanel();

        // --- INSIGNIA de la tarjeta: fila con las medallas YA desbloqueadas + "NINGUNA" ---
        // Selección única: tocar una reemplaza a la anterior; "NINGUNA" la quita. Al elegir,
        // solo se redibuja el canvas (no se reconstruye el DOM → no se pierde el scroll).
        const badgeRow = document.getElementById('studio-badge-row');
        if (badgeRow) {
            const _earned = new Set(userData.achievements || []);
            const _earnedDefs = ACHIEVEMENTS_DEF.filter(a => _earned.has(a.id));
            // Si la insignia guardada ya no está desbloqueada (reinicio de datos), se limpia.
            if (studioState.badgeId && !_earned.has(studioState.badgeId)) studioState.badgeId = null;

            const _pickBadge = (id, chip) => {
                studioState.badgeId = id;
                badgeRow.querySelectorAll('.sx-badge-chip').forEach(c => c.classList.remove('sx-on'));
                chip.classList.add('sx-on');
                if (id) loadStudioMedal(id);
                const pc = document.getElementById('studio-preview-canvas');
                if (pc) renderStudioCard(pc, studioState.tpl, studioState.fmt, studioState.metrics, true);
            };
            const _mkChip = (id, inner, extraCls) => {
                const chip = document.createElement('button');
                chip.className = 'sx-badge-chip' + (extraCls ? ' ' + extraCls : '')
                    + (studioState.badgeId === id ? ' sx-on' : '');
                chip.innerHTML = inner;
                chip.onclick = () => _pickBadge(id, chip);
                badgeRow.appendChild(chip);
            };

            // Opción "NINGUNA" (siempre primera; por defecto activa)
            _mkChip(null, '<span class="sx-badge-x">∅</span><span class="sx-badge-lbl">NINGUNA</span>', 'sx-badge-none');

            if (_earnedDefs.length === 0) {
                const hint = document.createElement('div');
                hint.className = 'sx-badge-empty';
                hint.textContent = 'Desbloquea insignias para lucirlas en tu tarjeta.';
                badgeRow.appendChild(hint);
            } else {
                _earnedDefs.forEach(def => {
                    const med = (typeof axMedalHTML === 'function') ? axMedalHTML(def, true) : '';
                    const inner = med
                        ? `<span class="sx-badge-med">${med}</span>`
                        : `<span class="sx-badge-emoji">${def.icon || '🏅'}</span>`;
                    _mkChip(def.id, inner, '');
                    loadStudioMedal(def.id); // precarga para que aparezca al instante en el canvas
                });
            }
        }

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
        // PASO 5f: PAISAJE se quita de la interfaz (STUDIO_FORMATS/renderStudioCard lo
        // conservan intactos por si algo externo aún lo referencia). Si el estado venía
        // con 'landscape' seleccionado, cae a STORY por defecto.
        if (studioState.fmt === 'landscape') studioState.fmt = 'story';
        const fmtBtns = document.getElementById('studio-fmt-btns');
        const allFmtBtns = [];
        const refreshFmtBtns = () => {
            allFmtBtns.forEach(({ btn, fmt }) => {
                btn.classList.toggle('active', studioState.fmt === fmt.id);
            });
        };
        STUDIO_FORMATS.filter(fmt => fmt.id !== 'landscape').forEach(fmt => {
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

        // --- Preview ---
        const previewCanvas = document.getElementById('studio-preview-canvas');
        renderStudioCard(previewCanvas, studioState.tpl, studioState.fmt, studioState.metrics, true);

        // (Panel "DATOS Y TEXTO — avanzado" eliminado en PASO 5e: métricas, métrica hero,
        // estilo de tarjeta, color de texto y tamaño de texto quedan fijos en los defaults
        // de studioState — la tarjeta sigue dibujando igual, solo ya no son editables.)

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

        // --- COLOR PERSONALIZADO — picker propio (reemplaza el <input type=color> nativo,
        //     que abría el cuadro gris del sistema, desencajado del tema de la app) ---
        function openAccentColorPicker(initialHex, onApply) {
            const hex2rgb = (h) => { h = (h || '#00e5ff').replace('#','');
                if (h.length === 3) h = h.split('').map(c => c+c).join('');
                return [parseInt(h.slice(0,2),16)||0, parseInt(h.slice(2,4),16)||0, parseInt(h.slice(4,6),16)||0]; };
            const rgb2hsv = (r,g,b) => {
                r/=255; g/=255; b/=255;
                const max = Math.max(r,g,b), min = Math.min(r,g,b), d = max-min;
                let h = 0;
                if (d !== 0) {
                    if (max === r) h = 60 * (((g-b)/d) % 6);
                    else if (max === g) h = 60 * ((b-r)/d + 2);
                    else h = 60 * ((r-g)/d + 4);
                }
                if (h < 0) h += 360;
                return [h, max === 0 ? 0 : d/max, max];
            };
            const hsv2rgb = (h,s,v) => {
                const c = v*s, x = c*(1-Math.abs((h/60)%2-1)), m = v-c;
                let r,g,b;
                if (h<60) [r,g,b]=[c,x,0]; else if (h<120) [r,g,b]=[x,c,0];
                else if (h<180) [r,g,b]=[0,c,x]; else if (h<240) [r,g,b]=[0,x,c];
                else if (h<300) [r,g,b]=[x,0,c]; else [r,g,b]=[c,0,x];
                return [Math.round((r+m)*255), Math.round((g+m)*255), Math.round((b+m)*255)];
            };
            const rgb2hex = (r,g,b) => '#' + [r,g,b].map(v => Math.max(0,Math.min(255,v)).toString(16).padStart(2,'0')).join('');

            const [ir,ig,ib] = hex2rgb(initialHex);
            let [hue, sat, val] = rgb2hsv(ir,ig,ib);

            const ov = document.createElement('div');
            ov.className = 'ax-modal-ov sx-cp-ov';
            ov.innerHTML = `
                <div class="ax-modal sx-cp-modal">
                    <div class="ax-modal-msg">COLOR PERSONALIZADO</div>
                    <div class="sx-cp-sv-box">
                        <canvas class="sx-cp-sv" width="260" height="150"></canvas>
                        <div class="sx-cp-sv-cursor"></div>
                    </div>
                    <div class="sx-cp-hue-box">
                        <canvas class="sx-cp-hue" width="260" height="18"></canvas>
                        <div class="sx-cp-hue-cursor"></div>
                    </div>
                    <div class="sx-cp-row">
                        <div class="sx-cp-preview"></div>
                        <input class="sx-cp-hex" type="text" maxlength="7" autocapitalize="off" autocomplete="off" spellcheck="false">
                    </div>
                    <div class="ax-modal-btns">
                        <button class="ax-modal-btn ax-cancel">CANCELAR</button>
                        <button class="ax-modal-btn ax-ok">ESTABLECER</button>
                    </div>
                </div>`;
            document.body.appendChild(ov);
            requestAnimationFrame(() => ov.classList.add('show'));
            // FIX swipe de fondo: mientras el modal esté abierto, el listener global de
            // cambio de pestaña lo ignora por completo (flag + stopPropagation abajo).
            window.__axModalSwipeBlock = true;

            const svCanvas = ov.querySelector('.sx-cp-sv');
            const svCtx = svCanvas.getContext('2d');
            const svCursor = ov.querySelector('.sx-cp-sv-cursor');
            const hueCanvas = ov.querySelector('.sx-cp-hue');
            const hueCtx = hueCanvas.getContext('2d');
            const hueCursor = ov.querySelector('.sx-cp-hue-cursor');
            const preview = ov.querySelector('.sx-cp-preview');
            const hexInput = ov.querySelector('.sx-cp-hex');

            const drawHue = () => {
                const g = hueCtx.createLinearGradient(0, 0, hueCanvas.width, 0);
                for (let i = 0; i <= 6; i++) g.addColorStop(i/6, `hsl(${i*60},100%,50%)`);
                hueCtx.fillStyle = g; hueCtx.fillRect(0, 0, hueCanvas.width, hueCanvas.height);
            };
            const drawSV = () => {
                const [r,g,b] = hsv2rgb(hue, 1, 1);
                svCtx.fillStyle = `rgb(${r},${g},${b})`; svCtx.fillRect(0, 0, svCanvas.width, svCanvas.height);
                let gw = svCtx.createLinearGradient(0, 0, svCanvas.width, 0);
                gw.addColorStop(0, 'rgba(255,255,255,1)'); gw.addColorStop(1, 'rgba(255,255,255,0)');
                svCtx.fillStyle = gw; svCtx.fillRect(0, 0, svCanvas.width, svCanvas.height);
                let gb = svCtx.createLinearGradient(0, 0, 0, svCanvas.height);
                gb.addColorStop(0, 'rgba(0,0,0,0)'); gb.addColorStop(1, 'rgba(0,0,0,1)');
                svCtx.fillStyle = gb; svCtx.fillRect(0, 0, svCanvas.width, svCanvas.height);
            };
            const currentHex = () => { const [r,g,b] = hsv2rgb(hue, sat, val); return rgb2hex(r,g,b); };
            const syncUI = () => {
                // % en vez de px del canvas: evita desfasar el cursor si la resolución
                // interna del canvas no coincide 1:1 con su tamaño renderizado en CSS.
                svCursor.style.left = (sat * 100) + '%';
                svCursor.style.top  = ((1 - val) * 100) + '%';
                hueCursor.style.left = (hue / 360 * 100) + '%';
                const hx = currentHex();
                preview.style.background = hx;
                hexInput.value = hx;
                svCursor.style.borderColor = val > 0.55 ? '#000' : '#fff';
            };

            drawHue(); drawSV(); syncUI();

            const pt = (e) => (e.touches && e.touches[0]) ? e.touches[0] : e;
            const dragOn = (canvas, onMove) => {
                let dragging = false;
                const move = (e) => {
                    if (!dragging) return;
                    const r = canvas.getBoundingClientRect();
                    const p = pt(e);
                    const x = Math.max(0, Math.min(canvas.width,  (p.clientX - r.left) * (canvas.width / r.width)));
                    const y = Math.max(0, Math.min(canvas.height, (p.clientY - r.top)  * (canvas.height / r.height)));
                    onMove(x, y);
                    e.preventDefault();
                };
                const start = (e) => { dragging = true; move(e); };
                const end = () => { dragging = false; };
                // move/end en "ov" (no window): ov cubre toda la pantalla (fixed, inset:0)
                // así que no se pierde área de arrastre, y permite que ov corte la
                // propagación del gesto hacia el swipe de pestañas SIN romper el drag.
                canvas.addEventListener('mousedown', start);
                canvas.addEventListener('touchstart', start, { passive: false });
                ov.addEventListener('mousemove', move);
                ov.addEventListener('touchmove', move, { passive: false });
                ov.addEventListener('mouseup', end);
                ov.addEventListener('touchend', end);
                return () => {
                    canvas.removeEventListener('mousedown', start);
                    canvas.removeEventListener('touchstart', start);
                    ov.removeEventListener('mousemove', move);
                    ov.removeEventListener('touchmove', move);
                    ov.removeEventListener('mouseup', end);
                    ov.removeEventListener('touchend', end);
                };
            };
            const offSV = dragOn(svCanvas, (x, y) => {
                sat = x / svCanvas.width; val = 1 - (y / svCanvas.height);
                syncUI();
            });
            const offHue = dragOn(hueCanvas, (x) => {
                hue = (x / hueCanvas.width) * 360;
                drawSV(); syncUI();
            });
            hexInput.oninput = () => {
                let v = hexInput.value.trim();
                if (/^#?[0-9a-fA-F]{6}$/.test(v)) {
                    if (v.charAt(0) !== '#') v = '#' + v;
                    const [r,g,b] = hex2rgb(v);
                    [hue, sat, val] = rgb2hsv(r,g,b);
                    drawSV(); syncUI();
                }
            };

            const close = () => {
                offSV(); offHue();
                window.__axModalSwipeBlock = false;
                ov.classList.remove('show');
                setTimeout(() => ov.remove(), 200);
            };
            ov.querySelector('.ax-cancel').onclick = close;
            ov.querySelector('.ax-ok').onclick = () => { onApply(currentHex()); close(); };
            ov.onclick = (e) => { if (e.target === ov) close(); };

            // FIX swipe de fondo (refuerzo): el gesto no debe salir del modal, aunque
            // el flag de arriba de por sí ya basta para que el swipe-nav lo ignore.
            const stop = (e) => e.stopPropagation();
            ov.addEventListener('touchstart', stop, { passive: true });
            ov.addEventListener('touchmove', stop, { passive: true });
            ov.addEventListener('touchend', stop, { passive: true });
        }

        // --- Selectores de Estilo Avanzado ---
        const _makeStyleBtns = (containerId, options, stateKey) => {
            const cont = document.getElementById(containerId);
            if (!cont) return;
            const accent_css = 'var(--accent-main)';
            const redraw = () => renderStudioCard(previewCanvas, studioState.tpl, studioState.fmt, studioState.metrics, true);
            // Colores adaptativos al tema (funcionan en oscuros Y en BLANCO):
            //  activo   → fondo acento + tinta que contrasta (--pm-accent-ink)
            //  inactivo → superficie del tema + texto tenue + borde del tema
            const refreshBtns = () => {
                const val = studioState[stateKey];
                const btns = cont.querySelectorAll('.sx-btn');
                const anyPreset = Array.from(btns).some(x => x.dataset.val === val);
                btns.forEach(b => {
                    let active = b.dataset.val === val;
                    // La rueda/picker se marca activa con un color custom (hex fuera de los presets)
                    if (b.dataset.val === '__picker' && !anyPreset && typeof val === 'string' && val.charAt(0) === '#') active = true;
                    b.style.background = active ? accent_css : 'var(--pm-s2)';
                    b.style.color      = active ? 'var(--pm-accent-ink)' : 'var(--pm-dim2)';
                    b.style.borderColor = active ? accent_css : 'var(--pm-border)';
                    b.classList.toggle('sx-on', active);
                });
            };
            options.forEach(opt => {
                const btn = document.createElement('button');
                btn.className = 'sx-btn';
                btn.dataset.val = opt.v;
                // opt.icon (svg) → casilla ícono+etiqueta (DISEÑO Y EFECTOS, PASO 5d).
                // Sin opt.icon → comportamiento original (pill de texto), intacto para el resto.
                if (opt.icon) {
                    btn.innerHTML = `${opt.icon}<span class="sx-fx-lbl">${opt.l}</span>`;
                } else {
                    btn.textContent = opt.l;
                }
                const isActive = studioState[stateKey] === opt.v;
                btn.style.cssText = `padding:4px 9px; font-size:0.60rem; border-radius:8px; cursor:pointer;
                    border:1px solid ${isActive ? accent_css : 'var(--pm-border)'};
                    background:${isActive ? accent_css : 'var(--pm-s2)'};
                    color:${isActive ? 'var(--pm-accent-ink)' : 'var(--pm-dim2)'};
                    font-weight:800; letter-spacing:0.5px; transition:all .15s;`;
                if (opt.dot) {
                    const dot = document.createElement('span');
                    dot.style.cssText = `display:inline-block; width:8px; height:8px; border-radius:50%; background:${opt.dot}; margin-right:4px; vertical-align:middle;`;
                    btn.prepend(dot);
                }
                btn.classList.toggle('sx-on', isActive);
                btn.onclick = opt.onClick
                    ? () => opt.onClick(btn, refreshBtns, redraw)
                    : () => { studioState[stateKey] = opt.v; refreshBtns(); redraw(); };
                cont.appendChild(btn);
            });
            refreshBtns();
        };

        _makeStyleBtns('studio-accent-btns', [
            { l:'VERDE',    v:'#22c55e', dot:'#22c55e' },
            { l:'MORADO',   v:'#8b3dff', dot:'#8b3dff' },
            { l:'NARANJA',  v:'#ff6a1a', dot:'#ff6a1a' },
            { l:'DORADO',   v:'#ffc21a', dot:'#ffc21a' },
            { l:'AZUL',     v:'#2f7bff', dot:'#2f7bff' },
            { l:'ROJO',     v:'#ff3b3b', dot:'#ff3b3b' },
            { l:'ROSA',     v:'#ff2ea6', dot:'#ff2ea6' },
            { l:'TURQUESA', v:'#00e0c6', dot:'#00e0c6' },
            { l:'CUSTOM',   v:'__picker',
              dot:'conic-gradient(from 90deg, #00e5ff, #00ffcc, #ffd700, #ff2222, #ff00e5, #00e5ff)',
              onClick: (btn, refresh, redraw) => {
                  // Rueda arcoíris = picker PROPIO con el tema de la app (ya no <input type=color> nativo).
                  const cur = (typeof studioState.accentColor === 'string' && studioState.accentColor.charAt(0) === '#')
                      ? studioState.accentColor : '#00e5ff';
                  openAccentColorPicker(cur, (hex) => {
                      // El hex elegido se guarda en studioState (persiste en la sesión) y redibuja.
                      studioState.accentColor = hex; refresh(); redraw();
                  });
              } }
        ], 'accentColor');

        // TIPOGRAFÍA — 12 tarjetas cuadradas con preview "Aa" REAL en cada fuente, SIN nombre (mockup PASO 5c v2).
        // Las familias coinciden 1:1 con las keys nuevas del objeto FM en renderStudioCard,
        // así el preview del recuadro es exactamente la fuente que va a usar la tarjeta.
        (() => {
            const cont = document.getElementById('studio-font-btns');
            if (!cont) return;
            const redraw = () => renderStudioCard(previewCanvas, studioState.tpl, studioState.fmt, studioState.metrics, true);
            // PASO 5d — 12 categorías RADICALMENTE distintas (no solo variaciones de grosor).
            const FONTS = [
                { v:'orbitron',      fam:"'Orbitron',sans-serif",         wt:800 }, // display/tech geométrica
                { v:'bebas-neue',    fam:"'Bebas Neue',sans-serif",       wt:400 }, // condensada alta
                { v:'playfair',      fam:"'Playfair Display',serif",      wt:700 }, // serif clásica
                { v:'space-mono',    fam:"'Space Mono',monospace",        wt:700 }, // monoespaciada
                { v:'fjalla-one',    fam:"'Fjalla One',sans-serif",       wt:400 }, // condensada deportiva
                { v:'fredoka',       fam:"'Fredoka',sans-serif",          wt:600 }, // redondeada
                { v:'rokkitt',       fam:"'Rokkitt',serif",               wt:700 }, // slab
                { v:'montserrat',    fam:"'Montserrat',sans-serif",       wt:800 }, // humanista limpia
                { v:'archivo-black', fam:"'Archivo Black',sans-serif",    wt:400 }, // grotesk pesada
                { v:'russo-one',     fam:"'Russo One',sans-serif",        wt:400 }, // futurista
                { v:'raleway-light', fam:"'Raleway',sans-serif",          wt:300 }, // elegante fina
                { v:'bungee',        fam:"'Bungee',cursive",              wt:400 }  // graffiti/impact
            ];
            const refresh = () => cont.querySelectorAll('.sx-font-card').forEach(c =>
                c.classList.toggle('sx-on', c.dataset.val === studioState.fontStyle));
            FONTS.forEach(f => {
                const card = document.createElement('button');
                card.type = 'button';
                card.className = 'sx-font-card';
                card.dataset.val = f.v;
                card.innerHTML = `<span class="sx-font-aa" style="font-family:${f.fam}; font-weight:${f.wt};">Aa</span>`;
                card.onclick = () => { studioState.fontStyle = f.v; refresh(); redraw(); };
                cont.appendChild(card);
            });
            refresh();
        })();

        // FRASES — 12 tarjetas cuadradas (mismo tamaño 54×54 que usaban las casillas de
        // DISEÑO Y EFECTOS que reemplazan) mostrando el TEXTO de la frase en vez de un ícono.
        // Guarda studioState.phraseId y redibuja; renderStudioCard usa STUDIO_PHRASES para
        // el título (líneas) + subtítulo de la tarjeta.
        (() => {
            const cont = document.getElementById('studio-phrase-btns');
            if (!cont) return;
            const redraw = () => renderStudioCard(previewCanvas, studioState.tpl, studioState.fmt, studioState.metrics, true);
            const refresh = () => cont.querySelectorAll('.sx-phrase-btn').forEach(c =>
                c.classList.toggle('sx-on', +c.dataset.val === studioState.phraseId));
            STUDIO_PHRASES.forEach(p => {
                const btn = document.createElement('button');
                btn.type = 'button';
                btn.className = 'sx-phrase-btn';
                btn.dataset.val = p.id;
                btn.innerHTML = `<span class="sx-phrase-title">${p.title}</span><span class="sx-phrase-sub">${p.sub[0]}<br>${p.sub[1]}</span>`;
                btn.onclick = () => { studioState.phraseId = p.id; refresh(); redraw(); };
                cont.appendChild(btn);
            });
            refresh();
        })();

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

            // Marcar que compartió/creó una tarjeta (COMPARTIDOR + insignias de COMUNIDAD).
            axCountShare();

            if (typeof pmShowToast === 'function') {
                pmShowToast('📥 ¡Tarjeta guardada en descargas!', 'green');
            }
        };

        window.shareStudioCard = async function() {
            const hdCanvas = document.createElement('canvas');
            renderStudioCard(hdCanvas, studioState.tpl, studioState.fmt, studioState.metrics, false);
            
            hdCanvas.toBlob(async (blob) => {
                if (!blob) {
                    axToast('Error al generar la imagen.');
                    return;
                }
                const file = new File([blob], 'AX-CORE_Logros.png', { type: 'image/png' });

                // Marcar que compartió una tarjeta (COMPARTIDOR + insignias de COMUNIDAD).
                axCountShare();

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
        if (isNaN(h) || isNaN(w) || isNaN(ws) || isNaN(tw)) return axToast("Todos los campos del perfil deben ser numéricos.");
        userData.height = h;
        userData.weight = w;
        userData.waist = ws;
        userData.target_weight = tw;
        saveData();
        updateDashboard();
        applySettings();
        axToast("Perfil antropométrico actualizado.");
    };

    document.getElementById('btn-reset-measurements').onclick = async () => {
        if (await axConfirm("¿Seguro que quieres REINICIAR TODO? Se borrarán medidas, historial, dieta y progreso físico. Tu cuenta y API Key permanecerán activas.", { ok: 'REINICIAR', danger: true })) {
            // Reset físico total
            userData.weight = 0;
            userData.waist = 0;
            userData.height = 0;
            userData.target_weight = 0;
            userData.bicep = 0;
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
            axToast("SISTEMA REINICIADO: Todos los datos físicos y nutricionales han sido borrados.");
        }
    };

    // El botón toggle-api-pro fue eliminado del UI. La API Key solo se revela
    // con 5 toques rápidos en el título "SISTEMA ÉLITE" (toque secreto Arthur).


    document.getElementById('btn-reset-all').onclick = async () => {
        if (await axConfirm("ESTO ELIMINARÁ TODA TU CUENTA Y DATOS. ¿ESTÁS SEGURO?", { ok: 'ELIMINAR CUENTA', danger: true })) {
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
        const log = Array.isArray(userData.foodLogToday) ? userData.foodLogToday : [];
        const m = log.reduce((t, f) => { t.p += (+f.p || 0); t.c += (+f.c || 0); t.f += (+f.f || 0); return t; }, { p: 0, c: 0, f: 0 });
        const box = document.getElementById('calc-today-tiles');
        if (box) {
            const tile = (lbl, val, col, extra) => `<div class="ax-tile"${extra || ''}><strong style="color:${col};">${val}</strong><span>${lbl}</span></div>`;
            box.innerHTML =
                tile('CALORÍAS', consumed.toLocaleString(), 'var(--text-primary,#fff)') +
                tile('PROTEÍNA', m.p + 'g', '#00c97a') +
                tile('CARBOS', m.c + 'g', '#2979ff') +
                tile('GRASA', m.f + 'g', '#ff9f43') +
                tile('QUEMADAS', burned.toLocaleString(), '#ff5c6c') +
                tile('TE QUEDAN', limit > 0 ? remaining.toLocaleString() : 'FÍJALO ✎',
                     limit > 0 ? (remaining < 0 ? '#ff5c6c' : 'var(--accent-main)') : 'var(--accent-main)',
                     ' id="ax-tile-limit" style="cursor:pointer;" title="Toca para fijar o cambiar tu límite diario"');
            // El cuadro TE QUEDAN se toca para fijar/cambiar el límite diario
            // (también se fija solo al pegar la dieta completa con kcal).
            const lt = document.getElementById('ax-tile-limit');
            if (lt) lt.onclick = async () => {
                const input = await axPrompt('¿Cuál es tu límite diario de calorías?\n(También se fija solo al pegar tu dieta completa)', userData.dailyCalLimit || '');
                if (input === null) return;
                const v = parseInt(String(input).replace(/[^0-9]/g, ''));
                if (isNaN(v) || v < 800 || v > 6000) { axToast('Escribe un número entre 800 y 6000.'); return; }
                userData.dailyCalLimit = v;
                saveData();
                renderCalculatorPage();
                if (typeof updateDashboard === 'function') updateDashboard();
                axToast(`✅ Límite diario fijado: ${v.toLocaleString()} kcal`);
            };
        }
    }

    function setupCalcCompensate() {
        const btn = document.getElementById('btn-calc-compensate');
        if (!btn) return;
        btn.onclick = () => {
            const raw = document.getElementById('calc-extra-cal').value;
            const qtyEl = document.getElementById('calc-food-qty');
            const qty = qtyEl ? qtyEl.value : 1;
            const out = document.getElementById('calc-compensate-result');
            const a = analyzeFoodEntry(raw, qty);
            if (a.error) {
                out.innerHTML = `<p style="color:var(--accent-alert); font-size:0.85rem;">${a.error}</p>`;
                return;
            }
            out.innerHTML = `
                <div style="padding:0.9rem 1rem; background:rgba(0,201,122,0.08); border:1px solid rgba(0,201,122,0.25); border-radius:12px;">
                    <div style="font-size:0.9rem; color:#fff;">🍽️ <strong>${a.name}</strong>${a.qty > 1 ? ` × ${a.qty} ${unitPlural(a.u, a.qty)}` : ''}</div>
                    <div style="font-size:1.6rem; font-weight:bold; color:var(--accent-main); margin-top:0.15rem;">${a.cal.toLocaleString()} <small style="font-size:0.8rem; color:var(--text-dim);">kcal</small></div>
                    ${macrosRowHtml(a)}
                </div>
                ${burnExercisesHtml(a.cal)}
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
                axToast(`✅ Límite diario actualizado: ${limit} kcal/día`);
            };
        };
    }

    function setupCalcProjection() {
        const btn = document.getElementById('btn-calc-projection');
        if (!btn) return;
        btn.onclick = () => {
            const out = document.getElementById('calc-projection-result');
            const w = +userData.weight || 0;
            const tw = +userData.target_weight || 0;
            if (!w || !tw) {
                out.innerHTML = `<p style="color:var(--accent-alert); font-size:0.85rem;">Necesito tu peso actual y tu meta. Configúralos en Evolución → Perfil Antropométrico.</p>`;
                return;
            }
            if (w <= tw) {
                out.innerHTML = `<div style="padding:1rem; text-align:center; background:rgba(0,201,122,0.08); border:1px solid rgba(0,201,122,0.3); border-radius:12px;"><div style="font-size:1.6rem;">🎯</div><strong style="color:var(--accent-main);">¡Ya estás en tu meta (o por debajo)!</strong><p style="font-size:0.78rem; color:var(--text-dim); margin-top:0.4rem;">Ajusta una nueva meta en tu perfil para seguir proyectando.</p></div>`;
                return;
            }
            const kgToLose = w - tw;

            // ── PROYECCIÓN CON BASE CIENTÍFICA ──
            // · 1 kg de grasa ≈ 7,700 kcal (Wishnofsky).
            // · Se descuenta ~15% por adaptación metabólica (el gasto cae al bajar de peso).
            // · Pérdida sostenible: 0.5–1% del peso corporal por semana (estándar en
            //   nutrición deportiva). Todo ritmo medido se TOPA al 1%/semana: las caídas
            //   rápidas iniciales son agua/glucógeno, no grasa, y proyectarlas engaña.
            const ADAPT = 0.85, KCAL_KG = 7700;
            const maxPerDay = (w * 0.01) / 7; // techo saludable: 1% del peso por semana
            const hist = (userData.history || []).filter(h => +h.weight > 0);
            let ratePerDay = 0, method = '', capped = false;

            // Método 1: ritmo REAL de báscula, ventana reciente (hasta 8 pesajes) y
            // promediando extremos para suavizar el peso de agua. Exige ≥3 pesajes en ≥7 días.
            if (hist.length >= 3) {
                const recent = hist.slice(-8);
                const d1 = parseAppDate(recent[0].date), d2 = parseAppDate(recent[recent.length - 1].date);
                const spanDays = Math.max(1, Math.round((d2 - d1) / 86400000));
                if (spanDays >= 7) {
                    const k = Math.max(1, Math.min(3, Math.floor(recent.length / 2)));
                    const avg = arr => arr.reduce((s, h) => s + (+h.weight), 0) / arr.length;
                    const lost = avg(recent.slice(0, k)) - avg(recent.slice(-k));
                    if (lost > 0.1) { ratePerDay = lost / spanDays; method = 'tu ritmo real de báscula (pesajes recientes)'; }
                }
            }
            // Método 2 (respaldo): déficit calórico registrado, con adaptación descontada.
            if (!ratePerDay && userData.totalNetDeficit > 0 && hist.length >= 1) {
                const d1 = parseAppDate(hist[0].date);
                const daysElapsed = Math.max(1, Math.round((new Date() - d1) / 86400000));
                if (daysElapsed >= 7) {
                    const avgDef = userData.totalNetDeficit / daysElapsed;
                    if (avgDef > 100) { ratePerDay = (avgDef * ADAPT) / KCAL_KG; method = 'tu déficit calórico registrado'; }
                }
            }
            // Aplicar el techo saludable
            if (ratePerDay > maxPerDay) { ratePerDay = maxPerDay; capped = true; method = 'el máximo saludable (1% de tu peso por semana)'; }

            // Escenario de referencia: déficit disciplinado de 500 kcal/día (~0.4 kg/sem reales).
            const days500 = Math.ceil(kgToLose / Math.min(maxPerDay, (500 * ADAPT) / KCAL_KG));
            const date500 = new Date(); date500.setDate(date500.getDate() + days500);
            const fmt = (d) => d.toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' });

            if (!ratePerDay) {
                out.innerHTML = `
                    <div style="padding:1rem; background:rgba(0,0,0,0.2); border-radius:12px; border:1px solid var(--glass-border);">
                        <p style="font-size:0.82rem; color:var(--text-dim); line-height:1.5;">Para proyectar con TU ritmo real necesito al menos <strong style="color:var(--text-primary,#fff)">3 pesajes repartidos en 7 días o más</strong> (regístralos en Evolución). Así evito darte fechas infladas por el peso de agua de los primeros días.</p>
                        <p style="font-size:0.85rem; color:var(--text-primary,#fff); margin-top:0.6rem;">📌 Mientras tanto, la referencia científica: con un déficit sostenido de <strong>500 kcal/día</strong>, tus <strong>${kgToLose.toFixed(1)} kg</strong> tomarían ~<strong style="color:var(--accent-main)">${days500} días</strong> — alrededor del <strong style="color:var(--accent-main)">${fmt(date500)}</strong>.</p>
                        <p style="font-size:0.65rem; color:var(--text-dim); margin-top:0.5rem;">Base: 1 kg de grasa ≈ 7,700 kcal · −15% por adaptación metabólica · máx. saludable 1% de tu peso/semana.</p>
                    </div>`;
                return;
            }
            const days = Math.ceil(kgToLose / ratePerDay);
            const goalDate = new Date(); goalDate.setDate(goalDate.getDate() + days);
            const gramsDay = Math.round(ratePerDay * 1000);
            const kgWeek = (ratePerDay * 7).toFixed(2);
            const t = (lbl, val) => `<div style="text-align:center; padding:0.6rem 0.3rem; background:rgba(0,0,0,0.2); border-radius:8px;"><div style="font-size:0.62rem; color:var(--text-dim);">${lbl}</div><strong style="color:#fff; font-size:0.95rem;">${val}</strong></div>`;
            out.innerHTML = `
                <div style="padding:1rem; background:rgba(var(--pm-green-rgb, 0,201,122),0.05); border-radius:12px; border:1px solid rgba(var(--pm-green-rgb, 0,201,122),0.25);">
                    <div style="text-align:center; margin-bottom:0.9rem;">
                        <div style="font-size:0.72rem; color:var(--text-dim);">A TU RITMO ACTUAL FALTAN</div>
                        <div style="font-size:2.2rem; font-family:var(--font-accent); color:var(--accent-main); font-weight:bold; line-height:1;">${days}</div>
                        <div style="font-size:0.72rem; color:var(--text-dim);">DÍAS · llegas el <strong style="color:var(--accent-main)">${fmt(goalDate)}</strong></div>
                    </div>
                    <div style="display:grid; grid-template-columns:repeat(3,1fr); gap:0.5rem;">
                        ${t('A BAJAR', kgToLose.toFixed(1) + ' kg')}
                        ${t('VAS PERDIENDO', gramsDay + ' g/día')}
                        ${t('POR SEMANA', kgWeek + ' kg')}
                    </div>
                    <p style="font-size:0.68rem; color:var(--text-dim); margin-top:0.7rem; text-align:center;">Calculado con ${method}.${capped ? ' Tu ritmo medido era mayor, pero las bajadas rápidas del inicio son agua/glucógeno — proyecto solo grasa real.' : ''}</p>
                    ${days > 365 ? `<p style="font-size:0.68rem; color:var(--text-dim); margin-top:0.4rem; text-align:center;">⏳ A más de un año la proyección es orientativa: re-cálculala cada mes con tus nuevos pesajes.</p>` : ''}
                    ${days500 < days ? `<p style="font-size:0.75rem; color:var(--text-primary,#fff); margin-top:0.5rem; text-align:center;">⚡ Sosteniendo un déficit de 500 kcal/día podrías adelantarlo al <strong style="color:var(--accent-main)">${fmt(date500)}</strong>.</p>` : ''}
                    <p style="font-size:0.6rem; color:var(--text-dim); margin-top:0.5rem; text-align:center;">Base: 1 kg grasa ≈ 7,700 kcal · −15% adaptación metabólica · máx. saludable 1% de tu peso/semana.</p>
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
    // Una comida "cuenta" solo si tiene contenido con sentido (evita que letras
    // sueltas sin sentido desbloqueen el logro). Debe tener espacio/coma/dígito.
    const mealLooksReal = (t) => {
        const s = (t || '').trim();
        if (s.length < 5) return false;
        return /[\s,]/.test(s) || /\d/.test(s);
    };
    const dietConfigured = () => {
        const rd = userData.recommendedDiet || {};
        // Exige la dieta COMPLETA: las 3 comidas principales con contenido real.
        const core = ['breakfast', 'lunch', 'dinner'];
        return core.every(k => mealLooksReal(rd[k]));
    };
    const ACHIEVEMENTS_DEF = [
        // ─── INICIO (10) ───
        { id:'first_login',   icon:'🎯', title:'PRIMER ACCESO',    desc:'Entraste a AX-CORE.',                 t:1, cat:'inicio', num:'1',  check:()=>!!userData.username },
        { id:'first_weigh',   icon:'⚖️', title:'PESO EN MARCHA',    desc:'Registraste tu peso 3 veces.',        t:1, cat:'inicio', num:3,    check:()=>H().length>=3 },
        { id:'first_food',    icon:'🍽️', title:'DIETA EN MARCHA',   desc:'Registraste 5 comidas.',              t:1, cat:'inicio', num:5,    check:()=>FL()>=5 },
        { id:'first_workout', icon:'🏃', title:'ENTRENO EN MARCHA', desc:'Registraste 3 ejercicios.',           t:1, cat:'inicio', num:3,    check:()=>WK()>=3 },
        { id:'first_waist',   icon:'📏', title:'MEDIDAS EN MARCHA', desc:'Mediste tu cintura 2 veces.',         t:1, cat:'inicio', num:2,    check:()=>H().filter(h=>+h.waist>0).length>=2 },
        { id:'profile_photo', icon:'📸', title:'CON ROSTRO',       desc:'Pusiste foto de perfil.',              t:1, cat:'inicio', num:'✓', check:()=>!!(userData.avatarPhoto||userData.avatar) },
        { id:'theme_change',  icon:'🎨', title:'ESTILO PROPIO',    desc:'Cambiaste el color de la app.',        t:1, cat:'inicio', num:'✓', check:()=>!!userData.theme && userData.theme!=='neon' },
        { id:'diet_set',      icon:'🥗', title:'PLAN LISTO',       desc:'Configuraste tu dieta.',               t:1, cat:'inicio', num:'✓', check:()=>dietConfigured() },
        { id:'used_calc',     icon:'🧮', title:'CALCULADOR',       desc:'Usaste la calculadora.',               t:1, cat:'inicio', num:'✓', check:()=>!!userData.usedCalc },
        { id:'first_share',   icon:'🌟', title:'COMPARTIDOR',      desc:'Creaste tu 1ª tarjeta de logros.',     t:1, cat:'inicio', num:'1',  check:()=>!!userData.sharedCard },
        // ─── RACHA (18) — días CONSECUTIVOS registrando peso ───
        { id:'streak_2',   icon:'🔥', title:'RACHA 3',   desc:'3 días seguidos.',            t:1, cat:'racha', check:()=>streakDays()>=3 },
        { id:'streak_3',   icon:'🔥', title:'RACHA 5',   desc:'5 días seguidos.',            t:1, cat:'racha', check:()=>streakDays()>=5 },
        { id:'streak_5',   icon:'🔥', title:'RACHA 7',   desc:'Una semana completa.',        t:1, cat:'racha', check:()=>streakDays()>=7 },
        { id:'streak_7',   icon:'⚡', title:'RACHA 10',  desc:'10 días seguidos.',           t:2, cat:'racha', check:()=>streakDays()>=10 },
        { id:'streak_10',  icon:'⚡', title:'RACHA 14',  desc:'Dos semanas seguidas.',       t:2, cat:'racha', check:()=>streakDays()>=14 },
        { id:'streak_14',  icon:'⚡', title:'RACHA 21',  desc:'Hábito formado (21 días).',   t:2, cat:'racha', check:()=>streakDays()>=21 },
        { id:'streak_21',  icon:'🌙', title:'RACHA 30',  desc:'Un mes entero.',              t:3, cat:'racha', check:()=>streakDays()>=30 },
        { id:'streak_30',  icon:'💫', title:'RACHA 40',  desc:'40 días.',                    t:3, cat:'racha', check:()=>streakDays()>=40 },
        { id:'streak_40',  icon:'💫', title:'RACHA 50',  desc:'50 días.',                    t:3, cat:'racha', check:()=>streakDays()>=50 },
        { id:'streak_50',  icon:'💫', title:'RACHA 60',  desc:'Dos meses.',                  t:3, cat:'racha', check:()=>streakDays()>=60 },
        { id:'streak_60',  icon:'🌟', title:'RACHA 75',  desc:'75 días.',                    t:4, cat:'racha', check:()=>streakDays()>=75 },
        { id:'streak_75',  icon:'🌟', title:'RACHA 90',  desc:'Tres meses élite.',           t:4, cat:'racha', check:()=>streakDays()>=90 },
        { id:'streak_90',  icon:'💎', title:'RACHA 120', desc:'Cuatro meses.',               t:4, cat:'racha', check:()=>streakDays()>=120 },
        { id:'streak_120', icon:'💎', title:'RACHA 150', desc:'Cinco meses.',                t:4, cat:'racha', check:()=>streakDays()>=150 },
        { id:'streak_150', icon:'💎', title:'RACHA 180', desc:'Medio año sin fallar.',       t:5, cat:'racha', check:()=>streakDays()>=180 },
        { id:'streak_180', icon:'👑', title:'RACHA 240', desc:'Ocho meses.',                 t:5, cat:'racha', check:()=>streakDays()>=240 },
        { id:'streak_270', icon:'👑', title:'RACHA 300', desc:'Diez meses.',                 t:5, cat:'racha', check:()=>streakDays()>=300 },
        { id:'streak_365', icon:'👑', title:'RACHA 365', desc:'UN AÑO. Leyenda viva.',       t:5, cat:'racha', check:()=>streakDays()>=365 },
        // ─── PESO (14) — % DE TU META (rebalance por esfuerzo) ───
        // Los IDs se CONSERVAN a propósito para NO borrar insignias ya ganadas por los
        // atletas. Lo que cambia es la vara: ahora se mide contra la meta de CADA persona,
        // así quien quiere bajar 6 kg y quien quiere bajar 60 kg pueden llegar los dos
        // hasta LEYENDA con su propio esfuerzo.
        { id:'lose_05',   icon:'🔻', title:'AVANCE 10%',  desc:'10% de tu meta de peso.',   t:1, cat:'peso', num:10,  check:()=>goalPct()>=10 },
        { id:'lose_1kg',  icon:'🔻', title:'AVANCE 15%',  desc:'15% de tu meta.',           t:1, cat:'peso', num:15,  check:()=>goalPct()>=15 },
        { id:'lose_2',    icon:'🔻', title:'AVANCE 20%',  desc:'20% de tu meta.',           t:1, cat:'peso', num:20,  check:()=>goalPct()>=20 },
        { id:'lose_3',    icon:'🏅', title:'AVANCE 25%',  desc:'25% de tu meta.',           t:2, cat:'peso', num:25,  check:()=>goalPct()>=25 },
        { id:'lose_4',    icon:'🏅', title:'AVANCE 30%',  desc:'30% de tu meta.',           t:2, cat:'peso', num:30,  check:()=>goalPct()>=30 },
        { id:'lose_5kg',  icon:'🥉', title:'AVANCE 40%',  desc:'40% de tu meta.',           t:2, cat:'peso', num:40,  check:()=>goalPct()>=40 },
        { id:'lose_7',    icon:'🥈', title:'MITAD DEL CAMINO', desc:'50% de tu meta.',      t:3, cat:'peso', num:50,  check:()=>goalPct()>=50 },
        { id:'lose_10kg', icon:'🥇', title:'AVANCE 60%',  desc:'60% de tu meta.',           t:3, cat:'peso', num:60,  check:()=>goalPct()>=60 },
        { id:'lose_12',   icon:'🥇', title:'AVANCE 70%',  desc:'70% de tu meta.',           t:3, cat:'peso', num:70,  check:()=>goalPct()>=70 },
        { id:'lose_15',   icon:'💫', title:'AVANCE 80%',  desc:'80% de tu meta.',           t:4, cat:'peso', num:80,  check:()=>goalPct()>=80 },
        { id:'lose_18',   icon:'💫', title:'AVANCE 90%',  desc:'90% de tu meta.',           t:4, cat:'peso', num:90,  check:()=>goalPct()>=90 },
        { id:'lose_20',   icon:'🦅', title:'META 100%',   desc:'¡Llegaste a tu peso meta!', t:4, cat:'peso', num:100, check:()=>goalPct()>=100 },
        { id:'lose_25',   icon:'🦅', title:'META FIRME',  desc:'Meta lograda y sostenida (30 días activos).', t:5, cat:'peso', num:'30d', check:()=>goalPct()>=100 && distinctDaysLogged()>=30 },
        { id:'lose_30',   icon:'🔱', title:'SUPERMETA',   desc:'Superaste tu meta un 10% más.', t:5, cat:'peso', num:110, check:()=>goalPct()>=110 },
        // ─── MEDIDAS (12) — cintura reducida y # de mediciones ───
        { id:'waist_1',   icon:'📏', title:'CINTURA -2',  desc:'2 cm menos de cintura.',    t:1, cat:'medidas', check:()=>waistLost()>=2 },
        { id:'waist_2',   icon:'📏', title:'CINTURA -3',  desc:'3 cm menos.',               t:1, cat:'medidas', check:()=>waistLost()>=3 },
        { id:'waist_3',   icon:'📏', title:'CINTURA -5',  desc:'5 cm menos.',               t:2, cat:'medidas', check:()=>waistLost()>=5 },
        { id:'waist_5',   icon:'📏', title:'CINTURA -7',  desc:'7 cm menos.',               t:2, cat:'medidas', check:()=>waistLost()>=7 },
        { id:'waist_7',   icon:'📏', title:'CINTURA -10', desc:'10 cm menos.',              t:3, cat:'medidas', check:()=>waistLost()>=10 },
        { id:'waist_10',  icon:'📏', title:'CINTURA -12', desc:'12 cm menos.',              t:4, cat:'medidas', check:()=>waistLost()>=12 },
        { id:'waist_15',  icon:'📏', title:'CINTURA -15', desc:'15 cm menos. Cambio total.',t:5, cat:'medidas', check:()=>waistLost()>=15 },
        { id:'meas_5',    icon:'📐', title:'8 MEDICIONES',  desc:'Mediste tu cuerpo 8 veces.', t:1, cat:'medidas', check:()=>H().length>=8 },
        { id:'meas_10',   icon:'📐', title:'20 MEDICIONES', desc:'20 mediciones.',          t:2, cat:'medidas', check:()=>H().length>=20 },
        { id:'meas_25',   icon:'📐', title:'40 MEDICIONES', desc:'40 mediciones.',          t:3, cat:'medidas', check:()=>H().length>=40 },
        { id:'meas_50',   icon:'📐', title:'75 MEDICIONES', desc:'75 mediciones.',          t:4, cat:'medidas', check:()=>H().length>=75 },
        { id:'meas_full', icon:'🧍', title:'CUERPO COMPLETO', desc:'Registraste todas tus medidas en un día.', t:3, cat:'medidas', num:'✓', check:()=>H().some(h=>+h.bicep>0&&+h.leg>0&&+h.chest>0&&+h.hip>0&&+h.calf>0&&+h.glute>0&&+h.neck>0&&+h.forearm>0&&+h.back>0) },
        // ─── EJERCICIO (16) — calorías quemadas acumuladas y # de ejercicios ───
        { id:'burn_100',    icon:'🔥', title:'500 KCAL',    desc:'Quemaste 500 kcal.',       t:1, cat:'ejercicio', check:()=>BURN()>=500 },
        { id:'burn_500',    icon:'🔥', title:'1,500 KCAL',  desc:'Quemaste 1,500 kcal.',     t:1, cat:'ejercicio', check:()=>BURN()>=1500 },
        { id:'burn_1000',   icon:'🔥', title:'3,000 KCAL',  desc:'Quemaste 3,000 kcal.',     t:2, cat:'ejercicio', check:()=>BURN()>=3000 },
        { id:'burn_2500',   icon:'🔥', title:'6,000 KCAL',  desc:'Quemaste 6,000 kcal.',     t:2, cat:'ejercicio', check:()=>BURN()>=6000 },
        { id:'burn_5000',   icon:'🔥', title:'12,000 KCAL', desc:'Quemaste 12,000 kcal.',    t:3, cat:'ejercicio', check:()=>BURN()>=12000 },
        { id:'burn_10000',  icon:'🔥', title:'25,000 KCAL', desc:'Quemaste 25,000 kcal.',    t:3, cat:'ejercicio', check:()=>BURN()>=25000 },
        { id:'burn_25000',  icon:'🔥', title:'50,000 KCAL', desc:'Quemaste 50,000 kcal.',    t:4, cat:'ejercicio', check:()=>BURN()>=50000 },
        { id:'burn_50000',  icon:'🔥', title:'100,000 KCAL',desc:'Quemaste 100,000 kcal.',   t:4, cat:'ejercicio', check:()=>BURN()>=100000 },
        { id:'burn_100000', icon:'🔥', title:'200,000 KCAL',desc:'Quemaste 200,000 kcal.',   t:5, cat:'ejercicio', check:()=>BURN()>=200000 },
        { id:'workouts_5',   icon:'💪', title:'10 EJERCICIOS',  desc:'Registraste 10 ejercicios.',  t:1, cat:'ejercicio', check:()=>WK()>=10 },
        { id:'workouts_10',  icon:'💪', title:'25 EJERCICIOS',  desc:'25 ejercicios.',              t:1, cat:'ejercicio', check:()=>WK()>=25 },
        { id:'workouts_25',  icon:'💪', title:'50 EJERCICIOS',  desc:'50 ejercicios.',              t:2, cat:'ejercicio', check:()=>WK()>=50 },
        { id:'workouts_50',  icon:'💪', title:'100 EJERCICIOS', desc:'100 ejercicios.',             t:2, cat:'ejercicio', check:()=>WK()>=100 },
        { id:'workouts_100', icon:'💪', title:'200 EJERCICIOS', desc:'200 ejercicios.',             t:3, cat:'ejercicio', check:()=>WK()>=200 },
        { id:'workouts_250', icon:'💪', title:'400 EJERCICIOS', desc:'400 ejercicios.',             t:4, cat:'ejercicio', check:()=>WK()>=400 },
        { id:'workouts_500', icon:'💪', title:'750 EJERCICIOS', desc:'750 ejercicios. Bestia.',     t:5, cat:'ejercicio', check:()=>WK()>=750 },
        // ─── COMIDA (10) — total de alimentos registrados ───
        { id:'food_5',      icon:'🥗', title:'10 ALIMENTOS',   desc:'Registraste 10 comidas.',  t:1, cat:'comida', check:()=>FL()>=10 },
        { id:'food_10',     icon:'🥗', title:'25 ALIMENTOS',   desc:'25 comidas.',              t:1, cat:'comida', check:()=>FL()>=25 },
        { id:'food_25',     icon:'🥗', title:'60 ALIMENTOS',   desc:'60 comidas.',              t:1, cat:'comida', check:()=>FL()>=60 },
        { id:'food_log_50', icon:'🥗', title:'120 ALIMENTOS',  desc:'120 comidas.',             t:2, cat:'comida', check:()=>FL()>=120 },
        { id:'food_100',    icon:'🥗', title:'250 ALIMENTOS',  desc:'250 comidas.',             t:2, cat:'comida', check:()=>FL()>=250 },
        { id:'food_200',    icon:'🥗', title:'450 ALIMENTOS',  desc:'450 comidas.',             t:3, cat:'comida', check:()=>FL()>=450 },
        { id:'food_350',    icon:'🥗', title:'700 ALIMENTOS',  desc:'700 comidas.',             t:3, cat:'comida', check:()=>FL()>=700 },
        { id:'food_500',    icon:'🥗', title:'1,000 ALIMENTOS',desc:'1,000 comidas.',           t:4, cat:'comida', check:()=>FL()>=1000 },
        { id:'food_750',    icon:'🥗', title:'1,400 ALIMENTOS',desc:'1,400 comidas.',           t:4, cat:'comida', check:()=>FL()>=1400 },
        { id:'food_1000',   icon:'🥗', title:'MAESTRO NUTRICIÓN', desc:'2,000 comidas registradas.', t:5, cat:'comida', num:2000, check:()=>FL()>=2000 },
        // ─── DÉFICIT (10) — déficit calórico acumulado ───
        { id:'deficit_1000',   icon:'📉', title:'DÉFICIT 3,500',   desc:'≈ ½ kg de grasa.',         t:1, cat:'deficit', check:()=>DEF()>=3500 },
        { id:'deficit_3500',   icon:'📉', title:'DÉFICIT 7,700',   desc:'≈ 1 kg de grasa.',         t:2, cat:'deficit', check:()=>DEF()>=7700 },
        { id:'deficit_7700',   icon:'📉', title:'DÉFICIT 15,000',  desc:'≈ 2 kg de grasa.',         t:2, cat:'deficit', check:()=>DEF()>=15000 },
        { id:'deficit_15000',  icon:'📉', title:'DÉFICIT 25,000',  desc:'≈ 3 kg de grasa.',         t:3, cat:'deficit', check:()=>DEF()>=25000 },
        { id:'deficit_23000',  icon:'📉', title:'DÉFICIT 40,000',  desc:'≈ 5 kg de grasa.',         t:3, cat:'deficit', check:()=>DEF()>=40000 },
        { id:'deficit_38000',  icon:'📉', title:'DÉFICIT 60,000',  desc:'≈ 8 kg de grasa.',         t:4, cat:'deficit', check:()=>DEF()>=60000 },
        { id:'deficit_50000',  icon:'📉', title:'DÉFICIT 90,000',  desc:'≈ 12 kg de grasa.',        t:4, cat:'deficit', check:()=>DEF()>=90000 },
        { id:'deficit_77000',  icon:'📉', title:'DÉFICIT 130,000', desc:'≈ 17 kg de grasa.',        t:5, cat:'deficit', check:()=>DEF()>=130000 },
        { id:'deficit_100000', icon:'📉', title:'DÉFICIT 180,000', desc:'≈ 23 kg de grasa.',        t:5, cat:'deficit', check:()=>DEF()>=180000 },
        { id:'deficit_150000', icon:'📉', title:'DÉFICIT 250,000', desc:'≈ 32 kg de grasa.',        t:5, cat:'deficit', check:()=>DEF()>=250000 },
        // ─── CONSTANCIA (7) — días distintos con registro ───
        { id:'days_3',   icon:'📅', title:'5 DÍAS ACTIVO',   desc:'Registraste en 5 días distintos.',   t:1, cat:'constancia', check:()=>distinctDaysLogged()>=5 },
        { id:'days_7',   icon:'📅', title:'12 DÍAS ACTIVO',  desc:'12 días distintos.',                 t:1, cat:'constancia', check:()=>distinctDaysLogged()>=12 },
        { id:'days_15',  icon:'📅', title:'25 DÍAS ACTIVO',  desc:'25 días distintos.',                 t:2, cat:'constancia', check:()=>distinctDaysLogged()>=25 },
        { id:'days_30',  icon:'📅', title:'50 DÍAS ACTIVO',  desc:'50 días distintos.',                 t:2, cat:'constancia', check:()=>distinctDaysLogged()>=50 },
        { id:'days_60',  icon:'📅', title:'90 DÍAS ACTIVO',  desc:'90 días distintos.',                 t:3, cat:'constancia', check:()=>distinctDaysLogged()>=90 },
        { id:'days_100', icon:'📅', title:'150 DÍAS ACTIVO', desc:'150 días distintos.',                t:4, cat:'constancia', check:()=>distinctDaysLogged()>=150 },
        { id:'days_200', icon:'📅', title:'250 DÍAS ACTIVO', desc:'250 días distintos.',                t:5, cat:'constancia', check:()=>distinctDaysLogged()>=250 },
        // ─── COMUNIDAD (9) — veces que compartes AX-CORE (app o tarjeta de logros) ───
        // Difunden la app y traen al atleta de vuelta a abrirla para presumir su avance.
        { id:'share_1',   icon:'📣', title:'DIFUSOR',      desc:'Compartiste AX-CORE por 1ª vez.', t:1, cat:'comunidad', num:1,   check:()=>(+userData.shareCount||0)>=1 || !!userData.sharedCard },
        { id:'share_3',   icon:'📣', title:'VOZ ACTIVA',   desc:'Compartiste 3 veces.',            t:1, cat:'comunidad', num:3,   check:()=>(+userData.shareCount||0)>=3 },
        { id:'share_5',   icon:'📣', title:'ALTAVOZ',      desc:'Compartiste 6 veces.',            t:2, cat:'comunidad', num:6,   check:()=>(+userData.shareCount||0)>=6 },
        { id:'share_10',  icon:'📣', title:'PROMOTOR',     desc:'Compartiste 12 veces.',           t:2, cat:'comunidad', num:12,  check:()=>(+userData.shareCount||0)>=12 },
        { id:'share_20',  icon:'📣', title:'INFLUENCIA',   desc:'Compartiste 25 veces.',           t:3, cat:'comunidad', num:25,  check:()=>(+userData.shareCount||0)>=25 },
        { id:'share_35',  icon:'📣', title:'ONDA VIRAL',   desc:'Compartiste 40 veces.',           t:3, cat:'comunidad', num:40,  check:()=>(+userData.shareCount||0)>=40 },
        { id:'share_50',  icon:'📣', title:'REFERENTE',    desc:'Compartiste 60 veces.',           t:4, cat:'comunidad', num:60,  check:()=>(+userData.shareCount||0)>=60 },
        { id:'share_75',  icon:'📣', title:'FENÓMENO',     desc:'Compartiste 80 veces.',           t:4, cat:'comunidad', num:80,  check:()=>(+userData.shareCount||0)>=80 },
        { id:'share_100', icon:'👑', title:'EMBAJADOR AX', desc:'Compartiste 100 veces. Leyenda.', t:5, cat:'comunidad', num:100, check:()=>(+userData.shareCount||0)>=100 },
        // ─── ESPECIALES (3) ───
        { id:'goal_halfway', icon:'🎯', title:'MEDIO CAMINO', desc:'Llegaste a la mitad de tu meta de peso.', t:3, cat:'especial', num:50, check:()=>{ const h=H(); const start=(h[0]&&+h[0].weight)||+userData.weight||0; const tw=+userData.target_weight||0; return tw>0 && start>tw && kilosLost()>=(start-tw)/2; } },
        { id:'goal_reached', icon:'🔱', title:'META ALCANZADA', desc:'Llegaste a tu peso objetivo.',           t:5, cat:'especial', num:100, check:()=>userData.weight>0 && userData.target_weight>0 && userData.weight<=userData.target_weight },
        { id:'legend',       icon:'👑', title:'LEYENDA AX',     desc:'Desbloqueaste 75 insignias.',            t:5, cat:'especial', num:75, check:()=>(userData.achievements||[]).length>=75 }
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

    // ── DÍAS ACTIVOS ──────────────────────────────────────────────────────
    // La racha y los "DÍAS" de Ajustes cuentan CUALQUIER día con actividad real:
    // una comida registrada, un ejercicio registrado O una medida de Evolución.
    // (Antes solo contaban las medidas; el usuario podía usar la app a diario y
    // no ver ningún avance → desmotivante.) Se guardan como claves ISO
    // 'aaaa-mm-dd' en userData.activeDays, que PERSISTE (no se borra en el reset
    // diario, al revés que foodLogToday/workoutLogToday) y se fusiona en el sync.
    function _dayKey(d) {
        d = d || new Date();
        return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    }
    // Unión de activeDays + los días del historial de medidas (así los usuarios
    // que ya tenían medidas siguen contando sin migración). Date[] a medianoche
    // local, ordenado descendente y deduplicado por día calendario.
    function activeDaySet() {
        const keys = new Set();
        (Array.isArray(userData.activeDays) ? userData.activeDays : []).forEach(k => {
            const d = parseAppDate(k); if (!isNaN(d.getTime())) keys.add(_dayKey(d));
        });
        (userData.history || []).forEach(r => {
            const d = parseAppDate(r.date); if (!isNaN(d.getTime())) keys.add(_dayKey(d));
        });
        return [...keys].map(k => parseAppDate(k)).sort((a, b) => b - a);
    }
    // Marca un día (por defecto HOY) como activo. Declaración de función (hoisted)
    // para poder llamarla desde la carga de datos aunque el código esté más abajo.
    function markActiveDay(d) {
        if (!Array.isArray(userData.activeDays)) userData.activeDays = [];
        const k = _dayKey(d || new Date());
        if (!userData.activeDays.includes(k)) {
            userData.activeDays.push(k);
            userData.activeDays.sort();
        }
    }
    function markActiveToday() { markActiveDay(new Date()); }
    window.markActiveDay = markActiveDay;
    window.markActiveToday = markActiveToday;

    function streakDays() {
        const unique = activeDaySet();   // Date[] desc, un elemento por día activo
        if (unique.length === 0) return 0;
        let streak = 1;
        for (let i = 1; i < unique.length; i++) {
            const diff = (unique[i-1] - unique[i]) / (1000 * 60 * 60 * 24);
            if (Math.round(diff) === 1) streak++;
            else break;
        }
        // Válida solo si el último día activo es hoy o ayer.
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

    // % de avance hacia TU meta de peso (0–200). Es la base del rebalance por esfuerzo:
    // se compara lo bajado contra el objetivo propio (peso inicial → peso meta), de modo
    // que cualquier atleta, con la meta que sea, puede escalar hasta LEYENDA.
    // Devuelve 0 si aún no hay meta válida configurada (no rompe nada, solo no avanza).
    function goalPct() {
        const h = userData.history || [];
        const start = (h[0] && +h[0].weight) || +userData.weight || 0;
        if (start <= 0) return 0;
        let target = +userData.target_weight || 0;
        // Si el atleta AÚN no configuró su meta, se asume una razonable (10% del peso
        // inicial) para que sus insignias de peso no se queden congeladas.
        if (!(target > 0 && start > target)) target = start * 0.9;
        return Math.max(0, Math.min(200, (kilosLost() / (start - target)) * 100));
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
        // Días distintos con CUALQUIER actividad (comida/ejercicio/medida).
        return activeDaySet().length;
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

    // ═══════════════ MEDALLAS POR IMAGEN (assets/insignias) ═══════════════
    // Cada insignia usa la imagen de su categoría+nivel (assets/insignias/<cat>_<nivel>.webp)
    // con el número sobrepuesto. Si no hay imagen (inicio/especial/medidas-leyenda) cae al
    // emoji de siempre. NO cambia ninguna lógica de desbloqueo ni ids.
    const AX_TIERNAME = { 1: 'bronce', 2: 'plata', 3: 'oro', 4: 'platino', 5: 'leyenda' };
    const AX_MEDAL_SET = new Set([
        'racha_bronce','racha_plata','racha_oro','racha_platino','racha_leyenda',
        'peso_bronce','peso_plata','peso_oro','peso_platino','peso_leyenda',
        'medidas_bronce','medidas_plata','medidas_oro','medidas_platino',
        'ejercicio_bronce','ejercicio_plata','ejercicio_oro','ejercicio_platino','ejercicio_leyenda',
        'comida_bronce','comida_plata','comida_oro','comida_platino','comida_leyenda',
        'deficit_bronce','deficit_plata','deficit_oro','deficit_platino','deficit_leyenda',
        'constancia_bronce','constancia_plata','constancia_oro','constancia_platino','constancia_leyenda',
        'comunidad_bronce','comunidad_plata','comunidad_oro','comunidad_platino','comunidad_leyenda'
    ]);
    // Insignias sin imagen propia (INICIO, ESPECIAL, medidas-leyenda): se les asigna la
    // medalla existente más afín a su tema, para que TODAS se vean con el diseño nuevo
    // y ninguna quede con emoji suelto.
    const AX_MEDAL_OVERRIDE = {
        first_login:   'constancia_bronce',
        first_weigh:   'peso_bronce',
        first_food:    'comida_bronce',
        first_workout: 'ejercicio_bronce',
        first_waist:   'medidas_bronce',
        profile_photo: 'comunidad_bronce',
        theme_change:  'comunidad_bronce',
        diet_set:      'comida_bronce',
        used_calc:     'deficit_bronce',
        first_share:   'comunidad_bronce',
        goal_halfway:  'peso_oro',
        goal_reached:  'peso_leyenda',
        legend:        'especial_legend',
        waist_15:      'peso_leyenda'
    };
    function axMedalImg(def) {
        const ov = def.id && AX_MEDAL_OVERRIDE[def.id];
        if (ov) return 'assets/insignias/' + ov + '.webp?v=3';
        const t = +(def.t || def.tier || 1);
        const key = (def.cat || '') + '_' + (AX_TIERNAME[t] || 'bronce');
        return AX_MEDAL_SET.has(key) ? ('assets/insignias/' + key + '.webp?v=3') : null;
    }
    function axMedalNum(def) {
        // Si la insignia trae su propio número (num), ese manda (ej. COMUNIDAD, PESO %).
        if (def.num !== undefined && def.num !== null && def.num !== '') return String(def.num);
        const m = String(def.title || def.name || '').match(/-?\d[\d.,]*/);
        if (!m) return '';
        const raw = m[0].replace(/,/g, ''), n = parseFloat(raw);
        if (!isNaN(n) && Math.abs(n) >= 1000) { const k = n / 1000; return (Number.isInteger(k) ? k : +k.toFixed(1)) + 'K'; }
        return raw;
    }
    // Devuelve el HTML de la medalla-imagen, o '' si no hay imagen (para caer al emoji).
    // RESPALDO: si la imagen no carga (caché a medio bajar / offline), se muestra el emoji
    // de siempre (onerror) para que NINGUNA insignia ganada quede en blanco.
    function axMedalHTML(def, unlocked) {
        const img = axMedalImg(def);
        if (!img) return '';
        const num = axMedalNum(def);
        const emoji = def.icon || def.e || '🏅';
        const tier = Math.min(5, Math.max(1, +(def.t || def.tier || 1)));
        return '<span class="axmed axmed-t' + tier + (unlocked ? '' : ' axmed-lock') + '">'
            + '<img class="axmed-img" src="' + img + '" alt="" loading="lazy"'
            + ' onerror="this.style.display=\'none\';this.parentNode.classList.add(\'axmed-failed\');">'
            + '<span class="axmed-fb">' + emoji + '</span>'
            + (num ? '<span class="axmed-num">' + num + '</span>' : '')
            + '</span>';
    }
    window.axMedalHTML = axMedalHTML;

    // Cuenta cada vez que el atleta comparte (la app o una tarjeta de logros).
    // Alimenta las insignias de COMUNIDAD. Es aditivo: no altera nada existente.
    function axCountShare() {
        try {
            userData.shareCount = (+userData.shareCount || 0) + 1;
            if (!userData.sharedCard) userData.sharedCard = true;
            saveData();
            if (typeof checkAchievements === 'function') checkAchievements();
        } catch (e) { console.warn('[axCountShare]', e); }
    }
    window.axCountShare = axCountShare;

    function renderAchievementsPanel() {
        const panel = document.getElementById('achievements-panel');
        if (!panel) return;
        const earned = new Set(userData.achievements || []);
        panel.innerHTML = ACHIEVEMENTS_DEF.map(a => {
            const got = earned.has(a.id);
            const med = axMedalHTML(a, got);
            const iconHTML = med ? `<div class="ach-icon has-med">${med}</div>` : `<div class="ach-icon">${a.icon}</div>`;
            return `<div class="ach-card ${got ? 'ach-card--got' : 'ach-card--locked'}">
                ${iconHTML}
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
