/* ════════════════════════════════════════════════════════════════
   AX-CORE Premium Extras — FAB global + Onboarding 3 pasos
   Solo se activa con .premium-mode. Inerte si el toggle está OFF.
   ════════════════════════════════════════════════════════════════ */
(function(){
    'use strict';

    // ─── FAB (Floating Action Button) ─────────────────────────────
    let fabOpen = false;

    function injectFAB() {
        if (document.getElementById('pmFabWrap')) return;
        const wrap = document.createElement('div');
        wrap.id = 'pmFabWrap';
        wrap.className = 'pm-fab-wrap';
        wrap.innerHTML = `
            <div class="pm-fab-menu" id="pmFabMenu">
                <div class="pm-fab-item" data-action="weight"><div class="pm-fab-icon">⚖️</div>Registrar peso</div>
                <div class="pm-fab-item" data-action="food"><div class="pm-fab-icon">🍽️</div>Log comida</div>
                <div class="pm-fab-item" data-action="exercise"><div class="pm-fab-icon">💪</div>Log ejercicio</div>
                <div class="pm-fab-item" data-action="card"><div class="pm-fab-icon">⭐</div>Crear tarjeta</div>
            </div>
            <button class="pm-fab-main" id="pmFabMain" title="Acciones rápidas">+</button>
        `;
        document.body.appendChild(wrap);

        // Eventos
        document.getElementById('pmFabMain').addEventListener('click', toggleFAB);
        wrap.querySelectorAll('.pm-fab-item').forEach(item => {
            item.addEventListener('click', () => fabAction(item.dataset.action));
        });

        // Cerrar al click fuera
        document.addEventListener('click', (e) => {
            if (fabOpen && !e.target.closest('.pm-fab-wrap')) closeFAB();
        });
    }

    function toggleFAB() {
        fabOpen = !fabOpen;
        document.getElementById('pmFabMain').classList.toggle('open', fabOpen);
        const items = document.querySelectorAll('.pm-fab-item');
        items.forEach((el, i) => {
            setTimeout(() => el.classList.toggle('vis', fabOpen), fabOpen ? i * 60 : (3 - i) * 40);
        });
    }

    function closeFAB() {
        if (!fabOpen) return;
        fabOpen = false;
        document.getElementById('pmFabMain').classList.remove('open');
        document.querySelectorAll('.pm-fab-item').forEach(el => el.classList.remove('vis'));
    }

    function fabAction(type) {
        closeFAB();
        const map = { weight: 'evolution', food: 'diet', exercise: 'workout', card: 'studio' };
        const target = map[type];
        if (!target) return;
        const link = document.querySelector(`[data-page="${target}"]`);
        if (link) {
            link.click();
            // Si es peso, scroll al form
            if (type === 'weight') {
                setTimeout(() => {
                    const inp = document.getElementById('log-weight');
                    if (inp) { inp.focus(); inp.scrollIntoView({behavior:'smooth', block:'center'}); }
                }, 250);
            }
        }
    }

    // Ocultar FAB solo si NO está premium-mode
    function syncFABVisibility() {
        const wrap = document.getElementById('pmFabWrap');
        if (!wrap) return;
        wrap.style.display = document.body.classList.contains('premium-mode') ? '' : 'none';
    }

    // ─── ONBOARDING 3 PASOS ───────────────────────────────────────
    const OB_STEPS = [
        { e:'🎯', t:'BIENVENIDO A AX-CORE', d:'Tu sistema de evolución personal premium.\nControla peso, dieta y entrenamiento desde una sola app.' },
        { e:'📊', t:'REGISTRA TU PROGRESO', d:'Cada día mide tu peso, cintura y calorías.\nVerás tu evolución en tiempo real.' },
        { e:'🏆', t:'GANA 100 INSIGNIAS', d:'Completa retos y desbloquea insignias de bronce a legendaria.\nComparte tu progreso con tarjetas HD.' }
    ];
    let obStep = 0;

    function injectOnboarding() {
        if (document.getElementById('pmOnboarding')) return;
        const ov = document.createElement('div');
        ov.id = 'pmOnboarding';
        ov.className = 'pm-ob-overlay';
        ov.style.display = 'none';
        ov.innerHTML = `<div class="pm-ob-step" id="pmObStep"></div>`;
        document.body.appendChild(ov);
    }

    function renderOBStep(i) {
        obStep = i;
        const step = OB_STEPS[i];
        const dots = OB_STEPS.map((_, j) => `<div class="pm-ob-dot ${j===i?'on':''}"></div>`).join('');
        const isLast = i === OB_STEPS.length - 1;
        document.getElementById('pmObStep').innerHTML = `
            <span class="pm-ob-emoji">${step.e}</span>
            <div class="pm-ob-title">${step.t}</div>
            <div class="pm-ob-desc">${step.d.replace(/\n/g, '<br>')}</div>
            <div class="pm-ob-dots">${dots}</div>
            <button class="pm-ob-btn" id="pmObBtn">${isLast ? 'COMENZAR ✓' : 'SIGUIENTE →'}</button>
            ${!isLast ? '<div class="pm-ob-skip" id="pmObSkip">Saltar</div>' : ''}
        `;
        document.getElementById('pmObBtn').onclick = () => isLast ? closeOnboarding() : renderOBStep(i + 1);
        const skip = document.getElementById('pmObSkip');
        if (skip) skip.onclick = closeOnboarding;
    }

    function showOnboarding() {
        if (!document.body.classList.contains('premium-mode')) return;
        if (localStorage.getItem('axcore_pm_onboarding_done') === '1') return;
        injectOnboarding();
        document.getElementById('pmOnboarding').style.display = 'flex';
        renderOBStep(0);
    }

    function closeOnboarding() {
        const ov = document.getElementById('pmOnboarding');
        if (ov) ov.style.display = 'none';
        localStorage.setItem('axcore_pm_onboarding_done', '1');
    }

    // ─── INIT ─────────────────────────────────────────────────────
    function init() {
        // injectFAB(); // (FAB global "+" eliminado por ser redundante e innecesario)
        syncFABVisibility();

        // Mostrar onboarding sólo cuando la app está visible (usuario logueado)
        const tryOnboarding = () => {
            const ac = document.getElementById('app-container');
            if (ac && !ac.classList.contains('hidden')) {
                setTimeout(showOnboarding, 800);
            }
        };
        tryOnboarding();

        // Re-sincronizar visibility cuando se cambia el toggle premium
        const observer = new MutationObserver(syncFABVisibility);
        observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });

        // También cuando el app-container deja de estar oculto (login completo)
        const acObserver = new MutationObserver(tryOnboarding);
        const ac = document.getElementById('app-container');
        if (ac) acObserver.observe(ac, { attributes: true, attributeFilter: ['class'] });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Expose for debugging / re-trigger
    window.pmShowOnboarding = function() {
        localStorage.removeItem('axcore_pm_onboarding_done');
        showOnboarding();
    };
    window.pmResetOnboarding = function() {
        localStorage.removeItem('axcore_pm_onboarding_done');
    };

})();
