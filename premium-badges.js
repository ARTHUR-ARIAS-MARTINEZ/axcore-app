/* ════════════════════════════════════════════════════════════════
   AX-CORE Premium Badges — Catálogo de las 100 insignias
   Muestra las insignias REALES definidas en app.js
   (window.AXCORE_ACHIEVEMENTS). Cada una se desbloquea de verdad
   según tu progreso. Filtrable por categoría.
   ════════════════════════════════════════════════════════════════ */
(function(){
    'use strict';

    const TIER_NAMES = {1:'BRONCE',2:'PLATA',3:'ORO',4:'PLATINO',5:'LEYENDA'};
    const CAT_NAMES = {
        todos:'TODAS', inicio:'INICIO', racha:'RACHA', peso:'PESO', medidas:'MEDIDAS',
        ejercicio:'EJERCICIO', comida:'COMIDA', deficit:'DÉFICIT', constancia:'CONSTANCIA',
        comunidad:'COMUNIDAD', especial:'ESPECIAL'
    };
    const CAT_ORDER = ['todos','inicio','racha','peso','medidas','ejercicio','comida','deficit','constancia','comunidad','especial'];

    let activeCat = 'todos';

    // Lee las insignias reales expuestas por app.js y las normaliza.
    function getBadges() {
        const src = Array.isArray(window.AXCORE_ACHIEVEMENTS) ? window.AXCORE_ACHIEVEMENTS : [];
        return src.map(a => ({
            id: a.id,
            e:  a.icon  || '🏅',
            n:  a.title || 'INSIGNIA',
            d:  a.desc  || '',
            t:  a.t     || 2,
            c:  a.cat   || 'especial',
            num: a.num
        }));
    }

    function getUnlocked() {
        try {
            const ud = window.userData || {};
            return Array.isArray(ud.achievements) ? ud.achievements : [];
        } catch(e) { return []; }
    }
    function isUnlocked(id) { return getUnlocked().includes(id); }

    function injectModal() {
        if (document.getElementById('pmBadgesModal')) return;
        const modal = document.createElement('div');
        modal.id = 'pmBadgesModal';
        modal.className = 'pm-badges-modal';
        modal.innerHTML = `
            <div class="pm-badges-hdr">
                <div class="pm-badges-title">🏅 TODAS LAS INSIGNIAS</div>
                <button class="pm-badges-close" onclick="window.pmCloseBadges()">✕</button>
            </div>
            <div class="pm-badges-prog">Desbloqueadas: <strong id="pmBadgesNum">0</strong> de <span id="pmBadgesTotal">0</span></div>
            <div class="pm-badges-cats" id="pmBadgesCats"></div>
            <div class="pm-badges-body">
                <div class="pm-badges-grid" id="pmBadgesGrid"></div>
            </div>
        `;
        document.body.appendChild(modal);
    }

    function renderCats() {
        const wrap = document.getElementById('pmBadgesCats');
        if (!wrap) return;
        // Solo muestra las categorías que existen en la lista real.
        const present = new Set(getBadges().map(b => b.c));
        const cats = CAT_ORDER.filter(c => c === 'todos' || present.has(c));
        wrap.innerHTML = cats.map(c =>
            `<div class="pm-cat-chip ${c===activeCat?'on':''}" data-cat="${c}">${CAT_NAMES[c]||c.toUpperCase()}</div>`
        ).join('');
        wrap.querySelectorAll('.pm-cat-chip').forEach(chip => {
            chip.onclick = () => { activeCat = chip.dataset.cat; renderCats(); renderGrid(); };
        });
    }

    function renderGrid() {
        const wrap = document.getElementById('pmBadgesGrid');
        if (!wrap) return;
        const list = activeCat === 'todos' ? getBadges() : getBadges().filter(b => b.c === activeCat);
        wrap.innerHTML = list.map(b => {
            const unlocked = isUnlocked(b.id);
            const med = (typeof window.axMedalHTML === 'function')
                ? window.axMedalHTML({ id: b.id, cat: b.c, t: b.t, title: b.n, icon: b.e, num: b.num }, unlocked) : '';
            if (unlocked) {
                const iconEl = med ? `<div class="pm-bemoji has-med">${med}</div>` : `<div class="pm-bemoji">${b.e}</div>`;
                return `
                    <div class="pm-bcard unlocked t${b.t}" title="${b.n} · ${b.d}">
                        <div class="pm-btier">${TIER_NAMES[b.t]}</div>
                        ${iconEl}
                        <div class="pm-bname">${b.n}</div>
                        <div class="pm-bdesc">${b.d}</div>
                    </div>`;
            }
            // Bloqueada: se muestra la META (no oculta) para motivar a alcanzarla.
            const iconElL = med ? `<div class="pm-bemoji has-med">${med}</div>` : `<div class="pm-bemoji">🔒</div>`;
            return `
                <div class="pm-bcard locked t${b.t}" title="🔒 ${b.d}">
                    <div class="pm-btier">${TIER_NAMES[b.t]}</div>
                    ${iconElL}
                    <div class="pm-block-overlay">🔒</div>
                    <div class="pm-bname">${b.n}</div>
                    <div class="pm-bdesc">${b.d}</div>
                </div>`;
        }).join('');
    }

    function open() {
        if (!document.body.classList.contains('premium-mode')) return;
        injectModal();
        const badges = getBadges();
        const validIds = new Set(badges.map(b => b.id));
        const realCount = getUnlocked().filter(id => validIds.has(id)).length;
        const numEl = document.getElementById('pmBadgesNum');
        const totEl = document.getElementById('pmBadgesTotal');
        if (numEl) numEl.textContent = realCount;
        if (totEl) totEl.textContent = badges.length;
        renderCats();
        renderGrid();
        document.getElementById('pmBadgesModal').classList.add('on');
    }

    function close() {
        const m = document.getElementById('pmBadgesModal');
        if (m) m.classList.remove('on');
    }

    window.pmOpenBadges = open;
    window.pmCloseBadges = close;

    // Botón "Ver todas" dentro del panel de logros de Studio.
    function attachTriggers() {
        const ap = document.getElementById('achievements-panel');
        if (ap && !ap.querySelector('.pm-ver-todas-btn')) {
            const btn = document.createElement('div');
            btn.style.cssText = 'grid-column:1/-1;text-align:center;margin-top:14px;';
            btn.innerHTML = '<button class="pm-ver-todas-btn" onclick="window.pmOpenBadges()">🏅 VER TODAS LAS INSIGNIAS →</button>';
            ap.appendChild(btn);
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', attachTriggers);
    } else {
        attachTriggers();
    }
    // Reintenta al navegar a Studio (el panel se rellena dinámicamente).
    document.addEventListener('click', (e) => {
        if (e.target.closest('[data-page=studio]')) {
            setTimeout(attachTriggers, 200);
            setTimeout(attachTriggers, 600);
        }
    });

})();
