/* ════════════════════════════════════════════════════════════════
   AX-CORE Profile Persist — sistema ROBUSTO e INDEPENDIENTE
   Maneja exclusivamente: NOMBRE de usuario + FOTO de perfil.

   PROBLEMA QUE RESUELVE:
   - La foto era ~1.5MB, se guardaba 3 veces (userData JSON + 2 claves)
   - localStorage tiene límite ~5MB → QuotaExceededError silencioso
   - El error en saveData() impedía persistir cualquier cosa
   - Tras reload, foto desaparecía. Nombre tampoco persistía.

   ESTRATEGIA:
   1. Compresión AGRESIVA: 256x256 px JPEG q=0.55 (~15-25KB)
   2. UNA sola clave global ('axcore_profile_v1') con JSON pequeño
   3. NO se mete la foto en userData (que es enorme)
   4. Watchdog continuo que aplica el perfil al DOM
   5. APIs globales independientes de app.js

   USO:
   - AXProfile.saveName('Arthur')
   - AXProfile.savePhoto(dataUrl)    // se comprime automáticamente
   - AXProfile.getName() / getPhoto()
   - AXProfile.applyToDOM()
   - AXProfile.handleFileInput(inputElement)
   ════════════════════════════════════════════════════════════════ */

(function() {
    'use strict';
    if (window.AXProfile) return; // ya cargado

    var STORAGE_KEY = 'axcore_profile_v1';
    var BLOCKED_NAMES = ['', 'atleta', 'admin', 'usuario'];
    var DEFAULT_NAME = 'ATLETA';

    // ────────────────────────────────────────────────────────────
    // Storage helpers
    // ────────────────────────────────────────────────────────────
    function readProfile() {
        try {
            var raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) return {};
            return JSON.parse(raw) || {};
        } catch(e) { return {}; }
    }

    function writeProfile(obj) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(obj));
            return true;
        } catch(e) {
            console.warn('[AXProfile] localStorage falló:', e.message);
            // Si excede cuota, intenta limpiar otros datos viejos y reintentar
            if (e.name === 'QuotaExceededError' || e.code === 22) {
                try {
                    // Borra cualquier clave legacy que pudiera estar ocupando espacio
                    ['axcore_avatar_global', 'axcore_uname_global'].forEach(function(k) {
                        try { localStorage.removeItem(k); } catch(_) {}
                    });
                    // También limpia claves per-user antiguas
                    for (var i = localStorage.length - 1; i >= 0; i--) {
                        var k = localStorage.key(i);
                        if (k && (k.indexOf('axcore_avatar_') === 0 || k.indexOf('axcore_uname_') === 0)) {
                            try { localStorage.removeItem(k); } catch(_) {}
                        }
                    }
                    localStorage.setItem(STORAGE_KEY, JSON.stringify(obj));
                    return true;
                } catch(e2) {
                    console.error('[AXProfile] No se pudo persistir incluso tras limpiar:', e2.message);
                    return false;
                }
            }
            return false;
        }
    }

    function sanitizeName(v) {
        var s = String(v == null ? '' : v).trim();
        if (BLOCKED_NAMES.indexOf(s.toLowerCase()) !== -1) return '';
        return s;
    }

    // ────────────────────────────────────────────────────────────
    // Compresión AGRESIVA de la foto
    // ────────────────────────────────────────────────────────────
    function compressImage(file, callback) {
        if (!file) { callback(null); return; }
        var url = URL.createObjectURL(file);
        var img = new Image();
        img.onload = function() {
            try {
                var MAX = 256; // máximo 256x256 px → muy pequeño
                var w = img.width, h = img.height;
                if (w > h) {
                    if (w > MAX) { h = Math.round(h * MAX / w); w = MAX; }
                } else {
                    if (h > MAX) { w = Math.round(w * MAX / h); h = MAX; }
                }
                var canvas = document.createElement('canvas');
                canvas.width = w;
                canvas.height = h;
                var ctx = canvas.getContext('2d');
                ctx.fillStyle = '#000';
                ctx.fillRect(0, 0, w, h);
                ctx.drawImage(img, 0, 0, w, h);
                URL.revokeObjectURL(url);
                // JPEG quality 0.55 → ~15-25KB para 256x256
                var dataUrl = canvas.toDataURL('image/jpeg', 0.55);
                callback(dataUrl);
            } catch(e) {
                console.error('[AXProfile] compresión falló:', e.message);
                callback(null);
            }
        };
        img.onerror = function() {
            URL.revokeObjectURL(url);
            callback(null);
        };
        img.src = url;
    }

    // ────────────────────────────────────────────────────────────
    // API pública
    // ────────────────────────────────────────────────────────────
    var AXProfile = {
        // Guarda el nombre (sanitizado). Retorna true/false.
        saveName: function(name) {
            var clean = sanitizeName(name);
            if (!clean) return false;
            var profile = readProfile();
            profile.name = clean;
            profile.updatedAt = Date.now();
            var ok = writeProfile(profile);
            if (ok) {
                // Sincroniza con userData para compatibilidad con código viejo
                try {
                    if (window.userData) {
                        window.userData.userName = clean;
                        window.userData.username = clean;
                    }
                } catch(_) {}
                AXProfile.applyToDOM();
            }
            return ok;
        },

        // Guarda la foto (ya comprimida o no). Retorna true/false.
        savePhoto: function(dataUrl) {
            if (!dataUrl || typeof dataUrl !== 'string') return false;
            var profile = readProfile();
            profile.photo = dataUrl;
            profile.updatedAt = Date.now();
            var ok = writeProfile(profile);
            if (ok) {
                // NO metemos la foto en userData — eso causaba el QuotaExceededError
                AXProfile.applyToDOM();
            } else {
                // Si falló por cuota, intentar guardar SOLO la foto sin el resto
                try {
                    localStorage.setItem(STORAGE_KEY, JSON.stringify({
                        name: profile.name,
                        photo: dataUrl,
                        updatedAt: Date.now()
                    }));
                    AXProfile.applyToDOM();
                    return true;
                } catch(_) { return false; }
            }
            return ok;
        },

        // Procesa un archivo de input file: comprime y guarda
        handleFileInput: function(inputEl) {
            if (!inputEl || !inputEl.files || !inputEl.files[0]) return;
            var file = inputEl.files[0];
            compressImage(file, function(dataUrl) {
                if (!dataUrl) {
                    if (typeof window.pmShowToast === 'function')
                        window.pmShowToast('❌ Error al procesar imagen', 'red');
                    return;
                }
                var ok = AXProfile.savePhoto(dataUrl);
                if (ok && typeof window.pmShowToast === 'function')
                    window.pmShowToast('✓ Foto actualizada', 'green');
                else if (!ok && typeof window.pmShowToast === 'function')
                    window.pmShowToast('❌ No se pudo guardar (espacio)', 'red');
            });
            // Limpiar el input para permitir re-seleccionar la misma foto
            try { inputEl.value = ''; } catch(_) {}
        },

        // Lee el nombre — siempre devuelve algo válido
        getName: function() {
            var profile = readProfile();
            var n = sanitizeName(profile.name);
            if (n) return n;
            // Fallback a userData si profile vacío
            try {
                if (window.userData) {
                    var ud = sanitizeName(window.userData.userName) || sanitizeName(window.userData.username);
                    if (ud) return ud;
                }
            } catch(_) {}
            // Fallback a localStorage current user
            try {
                var cu = sanitizeName(localStorage.getItem('arthur_current_user'));
                if (cu) return cu;
            } catch(_) {}
            return DEFAULT_NAME;
        },

        // Lee la foto — puede devolver null
        getPhoto: function() {
            var profile = readProfile();
            if (profile.photo && typeof profile.photo === 'string' && profile.photo.indexOf('data:image') === 0) {
                return profile.photo;
            }
            return null;
        },

        // Aplica el nombre y la foto al DOM (header + ajustes hero + listas)
        applyToDOM: function() {
            var name = AXProfile.getName();
            var nameUpper = name.toUpperCase();
            var photo = AXProfile.getPhoto();

            // 1. HEADER — display-username
            var header = document.getElementById('display-username');
            if (header) {
                if (header.textContent.trim() !== nameUpper) {
                    header.textContent = nameUpper;
                }
                header.style.setProperty('color', '#ffffff', 'important');
                header.style.setProperty('display', 'block', 'important');
                header.style.setProperty('visibility', 'visible', 'important');
                header.style.setProperty('opacity', '1', 'important');
                header.style.setProperty('min-height', '18px', 'important');
            }

            // 2. HEADER — avatar
            var hAvatar = document.getElementById('avatar-preview');
            if (hAvatar) {
                if (photo) {
                    hAvatar.style.setProperty('background-image', 'url("' + photo + '")', 'important');
                    hAvatar.style.setProperty('background-size', 'cover', 'important');
                    hAvatar.style.setProperty('background-position', 'center', 'important');
                    hAvatar.style.setProperty('background-repeat', 'no-repeat', 'important');
                    hAvatar.textContent = '';
                } else {
                    hAvatar.style.removeProperty('background-image');
                    hAvatar.textContent = (nameUpper[0] || 'A');
                }
            }

            // 3. AJUSTES HERO — pmProfAvatar + pmProfName
            var pmAv = document.getElementById('pmProfAvatar');
            if (pmAv) {
                if (photo) {
                    pmAv.style.setProperty('background-image', 'url("' + photo + '")', 'important');
                    pmAv.style.setProperty('background-size', 'cover', 'important');
                    pmAv.style.setProperty('background-position', 'center', 'important');
                    pmAv.style.setProperty('background-repeat', 'no-repeat', 'important');
                    pmAv.textContent = '';
                } else {
                    pmAv.style.removeProperty('background-image');
                    pmAv.textContent = (nameUpper[0] || 'A');
                }
            }
            var pmName = document.getElementById('pmProfName');
            if (pmName) {
                pmName.textContent = nameUpper + ' ✎';
            }

            // 4. FILA iOS de nombre en Ajustes
            var pmRow = document.getElementById('pmSRowName');
            if (pmRow) pmRow.textContent = nameUpper + ' ›';

            // 5. SECCIÓN LOGROS
            var ach = document.getElementById('ach-username');
            if (ach) ach.textContent = nameUpper;

            // 6. Input legacy de nombre en ajustes
            var legacyInp = document.getElementById('input-username');
            if (legacyInp && name !== DEFAULT_NAME) legacyInp.value = name;
        },

        // ───── Setup automático ─────
        init: function() {
            // Aplicar inmediatamente
            AXProfile.applyToDOM();

            // Watchdog: aplica continuamente cada 800ms
            // Esto neutraliza CUALQUIER código que limpie el header por error
            setInterval(AXProfile.applyToDOM, 800);

            // Reaplica cuando localStorage cambia (otra tab)
            window.addEventListener('storage', function(e) {
                if (e.key === STORAGE_KEY) AXProfile.applyToDOM();
            });

            // Listener directo en el file input de Ajustes
            var fileInp = document.getElementById('pm-avatar-file-input');
            if (fileInp && !fileInp.__axprofile_bound) {
                fileInp.addEventListener('change', function(e) {
                    AXProfile.handleFileInput(e.target);
                });
                fileInp.__axprofile_bound = true;
            }

            // MutationObserver en display-username — auto-restaura si se vacía
            try {
                var target = document.getElementById('display-username');
                if (target && typeof MutationObserver !== 'undefined') {
                    var obs = new MutationObserver(function() {
                        if (!target.textContent || !target.textContent.trim()) {
                            AXProfile.applyToDOM();
                        }
                    });
                    obs.observe(target, { childList: true, characterData: true, subtree: true });
                }
            } catch(_) {}
        }
    };

    // Exportar
    window.AXProfile = AXProfile;

    // Auto-init cuando el DOM esté listo
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', AXProfile.init);
    } else {
        AXProfile.init();
    }
    // Re-init un poco más tarde por si elementos se inyectan después
    setTimeout(AXProfile.init, 500);
    setTimeout(AXProfile.init, 1500);
})();
