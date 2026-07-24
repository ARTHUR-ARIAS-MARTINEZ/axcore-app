/* ════════════════════════════════════════════════════════════════
   AX-CORE · RETROCESO GLOBAL
   Hace que el botón "atrás" del teléfono (el triángulo / el gesto de
   deslizar desde el borde) retroceda UN PASO dentro de la app en vez
   de cerrarla de golpe.

   Orden de retroceso:
     1. Si hay una ventana/aviso abierto encima  → lo cierra.
     2. Si no, vuelve a la sección anterior del recorrido.
     3. Si no hay recorrido y no está en INICIO  → va a INICIO.
     4. Ya en INICIO y sin nada abierto          → avisa "presiona otra
        vez para salir"; la segunda pulsación sí cierra la app.

   NO toca ningún código existente: observa la app desde fuera.
   Si algo fallara, todo queda como estaba (la app sigue igual).
   ════════════════════════════════════════════════════════════════ */
(function () {
    'use strict';
    if (window.__axBackReady) return;
    window.__axBackReady = true;

    var HOME = 'dashboard';
    var MAX_STACK = 60;

    var pageStack = [];    // recorrido de secciones visitadas
    var currentPage = null;
    var goingBack = false; // true mientras NOSOTROS navegamos hacia atrás
    var guardOn = false;   // ¿hay una "entrada centinela" en el historial?
    var rearmT = null;

    // ── ¿El elemento está realmente a la vista? ──────────────────
    function visible(el) {
        if (!el || !el.isConnected) return false;
        var cs;
        try { cs = getComputedStyle(el); } catch (e) { return false; }
        if (cs.display === 'none' || cs.visibility === 'hidden') return false;
        return el.getClientRects().length > 0;
    }

    function click(el) { if (el) { try { el.click(); } catch (e) {} } }

    // ── Capas que se pueden cerrar, de la de más arriba a la de más abajo ──
    var LAYERS = [
        // Globitos flotantes: siempre son lo más superficial que hay abierto.
        // Lista de sugerencias de alimentos
        { sel: '.ax-suggest', close: function (el) { el.remove(); } },
        // Globo de ayuda "cómo medir"
        { sel: '.meas-help-pop', close: function (el) { el.remove(); } },
        // Avisos propios: axConfirm / axPrompt / selector de color.
        // Se pulsa CANCELAR para que el código que espera respuesta no quede colgado.
        { sel: '.ax-modal-ov.show', close: function (el) {
            var c = el.querySelector('.ax-cancel');
            if (c) click(c); else el.remove();
        } },
        // Ventana de vista de una comida
        { sel: '.ax-view-ov.show', close: function (el) {
            var c = el.querySelector('.ax-ok');
            if (c) click(c); else el.remove();
        } },
        // Vista previa de la tarjeta de ESTUDIO
        { sel: '#studio-preview-modal.active', close: function () {
            if (typeof window.closeStudioPreviewModal === 'function') window.closeStudioPreviewModal();
        } },
        // Catálogo "TODAS LAS INSIGNIAS"
        { sel: '#pmBadgesModal.on', close: function () {
            if (typeof window.pmCloseBadges === 'function') window.pmCloseBadges();
        } },
        // Editor de comida a pantalla completa (mismo efecto que "← VOLVER")
        { sel: '#meal-modal-overlay.active', close: function (el) {
            var b = document.getElementById('meal-modal-back');
            if (b) click(b); else el.classList.remove('active');
        } },
        // Cambiar nombre de usuario
        { sel: '#pm-name-modal', vis: true, close: function (el) {
            if (typeof window.pmCloseNameModal === 'function') window.pmCloseNameModal();
            else el.style.display = 'none';
        } },
        // Cambiar contraseña
        { sel: '#pm-pass-modal', vis: true, close: function (el) {
            if (typeof window.pmClosePassModal === 'function') window.pmClosePassModal();
            else el.style.display = 'none';
        } },
        // Bienvenida de 3 pasos
        { sel: '#pmOnboarding', vis: true, close: function () {
            click(document.getElementById('pmObSkip') || document.getElementById('pmObBtn'));
        } },
        // Tour guiado de bienvenida
        { sel: '#onb-overlay', vis: true, close: function (el) {
            var s = document.getElementById('onb-skip');
            if (s) click(s); else el.remove();
        } }
    ];

    // Cierra la capa de más arriba que esté abierta. Devuelve true si cerró algo.
    function closeTopLayer() {
        for (var i = 0; i < LAYERS.length; i++) {
            var L = LAYERS[i];
            var list = document.querySelectorAll(L.sel);
            // La última del DOM es la de más arriba (se agregan al final del body)
            for (var j = list.length - 1; j >= 0; j--) {
                var el = list[j];
                if (L.vis && !visible(el)) continue;
                try { L.close(el); } catch (e) { console.warn('[axBack] cerrar', L.sel, e); }
                return true;
            }
        }
        return false;
    }

    // ── Secciones ────────────────────────────────────────────────
    function activePageId() {
        var el = document.querySelector('.page.active');
        return el ? el.id.replace(/^page-/, '') : null;
    }

    // Reutiliza el mismo clic de navegación de la app: así se ejecuta
    // exactamente la misma lógica de siempre (render, menús, scroll…).
    function backToPage(id) {
        if (!id) return false;
        var link = document.querySelector('[data-page="' + id + '"]');
        if (!link) return false;
        goingBack = true;
        click(link);
        setTimeout(function () { goingBack = false; }, 0);
        return true;
    }

    function watchPages() {
        var pages = document.querySelectorAll('.page');
        if (!pages.length) return false;
        currentPage = activePageId();
        var obs = new MutationObserver(function () {
            var np = activePageId();
            if (!np || np === currentPage) return;
            if (!goingBack && currentPage) {
                pageStack.push(currentPage);
                if (pageStack.length > MAX_STACK) pageStack.shift();
            }
            currentPage = np;
        });
        for (var i = 0; i < pages.length; i++) {
            obs.observe(pages[i], { attributes: true, attributeFilter: ['class'] });
        }
        return true;
    }

    // ── Un paso atrás ────────────────────────────────────────────
    function stepBack() {
        if (closeTopLayer()) return true;

        var cur = activePageId();
        while (pageStack.length) {
            var prev = pageStack.pop();
            if (prev && prev !== cur && backToPage(prev)) return true;
        }
        if (cur && cur !== HOME && backToPage(HOME)) return true;
        return false;
    }

    // ── Centinela del historial ──────────────────────────────────
    // Mantiene siempre una entrada "de sobra" para que la pulsación de
    // atrás la consuma a ella y no cierre la aplicación.
    function ensureGuard() {
        if (guardOn) return;
        try { history.pushState({ axGuard: Date.now() }, ''); guardOn = true; } catch (e) {}
    }

    window.addEventListener('popstate', function () {
        guardOn = false; // el centinela se acaba de consumir

        var handled = false;
        try { handled = stepBack(); } catch (e) { console.warn('[axBack]', e); }

        if (handled) { ensureGuard(); return; }

        // No había nada que cerrar: se avisa y se deja el historial libre,
        // así la SIGUIENTE pulsación sí cierra la app (como en cualquier
        // aplicación de Android). Si el usuario sigue usándola, se rearma solo.
        if (typeof window.axToast === 'function') {
            window.axToast('Presiona ATRÁS otra vez para salir de AX-CORE', 2200);
        }
        clearTimeout(rearmT);
        rearmT = setTimeout(ensureGuard, 2500);
    });

    // Cualquier interacción del usuario vuelve a armar el centinela.
    document.addEventListener('pointerdown', ensureGuard, true);
    document.addEventListener('keydown', ensureGuard, true);

    // ── Arranque ─────────────────────────────────────────────────
    function init() {
        if (!watchPages()) { setTimeout(init, 400); return; }
        ensureGuard();
    }
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
