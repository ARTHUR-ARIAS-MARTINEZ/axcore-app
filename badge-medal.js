/* ════════════════════════════════════════════════════════════════
   AX-CORE Badge Medal — piezas NUEVAS para el rediseño de insignias
   NO se usa todavía en ningún render real (INICIO / ESTUDIO / modal).
   No toca ACHIEVEMENTS_DEF ni window.AXCORE_ACHIEVEMENTS.

   Expone:
     - AXCORE_BADGE_ICONS           glifo sólido por categoría (9)
     - AXCORE_BADGE_ICON_OVERRIDES  glifo específico por id (hueco)
     - badgeMedal(a, {unlocked, size})  → HTML del medallón

   Fallback: si falta SVG para la categoría/id, se usa el emoji a.icon
   tal como ya lo hacen los renders actuales.
   ════════════════════════════════════════════════════════════════ */
(function () {
    'use strict';

    const DARK = '#0a0a0a';

    // Glifos sólidos por categoría, estilo Lucide/Tabler (24x24, sin CDN).
    const AXCORE_BADGE_ICONS = {
        inicio:     `<svg viewBox="0 0 24 24" fill="currentColor"><rect x="5" y="2.5" width="2" height="19" rx="1"/><path d="M7 4l11 3.5L7 11V4Z"/></svg>`,
        racha:      `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2c-1 4-5 5-5 9a5 5 0 0 0 10 0c0-2-1-3-2-4.5.3 1.5-.5 2.5-1.5 2.5-1.5 0-2-1.5-1-3.5C13.2 4.2 12.5 3 12 2Z"/></svg>`,
        peso:       `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 3a1 1 0 0 1 1 1v10.6l3-3a1 1 0 1 1 1.4 1.4l-4.7 4.7a1 1 0 0 1-1.4 0L6.6 13a1 1 0 1 1 1.4-1.4l3 3V4a1 1 0 0 1 1-1Z"/></svg>`,
        medidas:    `<svg viewBox="0 0 24 24" fill="currentColor"><rect x="3" y="9" width="18" height="6" rx="2"/><rect x="6" y="9" width="1.4" height="3" fill="${DARK}"/><rect x="10" y="9" width="1.4" height="3" fill="${DARK}"/><rect x="14" y="9" width="1.4" height="3" fill="${DARK}"/><rect x="18" y="9" width="1.4" height="2" fill="${DARK}"/></svg>`,
        ejercicio:  `<svg viewBox="0 0 24 24" fill="currentColor"><rect x="2" y="10" width="3" height="4" rx="1"/><rect x="19" y="10" width="3" height="4" rx="1"/><rect x="5" y="11" width="2" height="2"/><rect x="17" y="11" width="2" height="2"/><rect x="7" y="11.2" width="10" height="1.6" rx="0.8"/></svg>`,
        comida:     `<svg viewBox="0 0 24 24" fill="currentColor"><ellipse cx="12" cy="14" rx="7" ry="6.5"/><rect x="11.3" y="4" width="1.4" height="4" rx="0.7"/><path d="M13 5c2-2 4-1 4 1-2 .5-3-.2-4-1Z"/></svg>`,
        deficit:    `<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="9"/><rect x="7" y="10.8" width="10" height="2.4" rx="1.2" fill="${DARK}"/></svg>`,
        constancia: `<svg viewBox="0 0 24 24" fill="currentColor"><rect x="3" y="5" width="18" height="16" rx="2"/><rect x="6" y="2.5" width="2" height="4" rx="1"/><rect x="16" y="2.5" width="2" height="4" rx="1"/><rect x="3" y="9" width="18" height="2" fill="${DARK}"/><path d="M8.5 15.5l2 2 4.5-4.5" stroke="${DARK}" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
        especial:   `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.6 6.2 6.7.5-5.1 4.4 1.6 6.6L12 16.8 6.2 19.7l1.6-6.6L2.7 8.7l6.7-.5L12 2Z"/></svg>`
    };

    // Hueco para glifos específicos por id (prioridad sobre el de categoría).
    // Ejemplos ya cableados para probar el mecanismo con las 2 especiales más icónicas.
    const AXCORE_BADGE_ICON_OVERRIDES = {
        legend:       `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M3 18l-1.5-9L7 12l5-7 5 7 5.5-3L21 18H3Z"/><rect x="3" y="19" width="18" height="2" rx="1"/></svg>`,
        goal_reached: `<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5.5" fill="${DARK}"/><circle cx="12" cy="12" r="2.2"/></svg>`
    };

    // Deriva el número del logro desde title/desc ("RACHA 7" -> "7"). null si no hay dígitos.
    function axBadgeNumber(a) {
        const src = (a.title || '') + ' ' + (a.desc || '');
        const m = src.match(/(\d[\d,]*(?:\.\d+)?)/);
        if (!m) return null;
        return m[1].replace(/,/g, '');
    }

    function badgeMedal(a, opts) {
        a = a || {};
        opts = opts || {};
        const unlocked = !!opts.unlocked;
        const size = opts.size || 64;
        const tier = Math.min(5, Math.max(1, +(a.t || a.tier || 1)));
        const cat = a.cat || a.c || 'especial';
        const glyph = AXCORE_BADGE_ICON_OVERRIDES[a.id] || AXCORE_BADGE_ICONS[cat];

        // Sin SVG disponible: fallback al emoji actual, sin medallón.
        if (!glyph) {
            return `<div class="axb-fallback" style="width:${size}px;height:${size}px;font-size:${Math.round(size * 0.5)}px;">${a.icon || '🏅'}</div>`;
        }

        const num = axBadgeNumber(a);
        const lenClass = num ? (num.length >= 6 ? ' axb-num--xl' : num.length >= 4 ? ' axb-num--lg' : '') : '';

        return `
            <div class="axb-medal axb-t${tier}${unlocked ? '' : ' axb-off'}" style="width:${size}px;height:${size}px;font-size:${size}px;">
                <svg class="axb-ring" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="44" fill="none" stroke="currentColor" stroke-width="3" stroke-dasharray="2.2 7.5"/>
                    <circle cx="50" cy="50" r="37" fill="none" stroke="currentColor" stroke-width="1" opacity="0.5"/>
                </svg>
                <div class="axb-glyph">${glyph}</div>
                ${num ? `<div class="axb-num${lenClass}">${num}</div>` : ''}
            </div>`;
    }

    window.AXCORE_BADGE_ICONS = AXCORE_BADGE_ICONS;
    window.AXCORE_BADGE_ICON_OVERRIDES = AXCORE_BADGE_ICON_OVERRIDES;
    window.badgeMedal = badgeMedal;
})();
