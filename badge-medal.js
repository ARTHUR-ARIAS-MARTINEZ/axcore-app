/* ════════════════════════════════════════════════════════════════
   AX-CORE Badge Medal — medallón SVG estilo AX-CORE (HUD)
   NO se usa todavía en ningún render real (INICIO / ESTUDIO / modal).
   No toca ACHIEVEMENTS_DEF ni window.AXCORE_ACHIEVEMENTS.

   Expone:
     - AXCORE_BADGE_ICONS           glifo sólido por categoría (9)
     - AXCORE_BADGE_ICON_OVERRIDES  glifo específico por id (hueco)
     - badgeMedal(a, {unlocked, size})  → HTML del medallón

   El color (borde/glow/tinta) vive en premium.css como tokens
   --pm-tierN-border/-glow/-ink; este archivo solo dibuja forma,
   nunca hardcodea hex de tier.

   Fallback: si falta glifo para esa categoría/id, se usa el emoji
   a.icon tal como ya lo hacen los renders actuales.
   ════════════════════════════════════════════════════════════════ */
(function () {
    'use strict';

    const DARK = '#0a0a0a';

    // Glifos sólidos por categoría, estilo Lucide/Tabler (viewBox 24x24,
    // sin CDN). Son fragmentos SIN <svg> propio: badgeMedal los monta
    // dentro de su <g> con transform, para poder dibujarlos 2 veces
    // (glow + nítido) sin duplicar defs.
    const AXCORE_BADGE_ICONS = {
        inicio:     `<rect x="5" y="2.5" width="2" height="19" rx="1"/><path d="M7 4l11 3.5L7 11V4Z"/>`,
        racha:      `<polygon points="13,2 3,14 12,14 11,22 21,10 12,10 13,2"/>`,
        peso:       `<rect x="3" y="6" width="18" height="15" rx="3"/><circle cx="12" cy="13.5" r="4" fill="${DARK}"/><rect x="11.3" y="10" width="1.4" height="4" rx="0.7"/><rect x="9" y="3" width="6" height="2" rx="1"/>`,
        medidas:    `<rect x="3" y="9" width="18" height="6" rx="2"/><rect x="6" y="9" width="1.4" height="3" fill="${DARK}"/><rect x="10" y="9" width="1.4" height="3" fill="${DARK}"/><rect x="14" y="9" width="1.4" height="3" fill="${DARK}"/><rect x="18" y="9" width="1.4" height="2" fill="${DARK}"/>`,
        ejercicio:  `<rect x="2" y="10" width="3" height="4" rx="1"/><rect x="19" y="10" width="3" height="4" rx="1"/><rect x="5" y="11" width="2" height="2"/><rect x="17" y="11" width="2" height="2"/><rect x="7" y="11.2" width="10" height="1.6" rx="0.8"/>`,
        comida:     `<ellipse cx="12" cy="14" rx="7" ry="6.5"/><rect x="11.3" y="4" width="1.4" height="4" rx="0.7"/><path d="M13 5c2-2 4-1 4 1-2 .5-3-.2-4-1Z"/>`,
        deficit:    `<path d="M12 2c-1 4-5 5-5 9a5 5 0 0 0 10 0c0-2-1-3-2-4.5.3 1.5-.5 2.5-1.5 2.5-1.5 0-2-1.5-1-3.5C13.2 4.2 12.5 3 12 2Z"/>`,
        constancia: `<rect x="3" y="5" width="18" height="16" rx="2"/><rect x="6" y="2.5" width="2" height="4" rx="1"/><rect x="16" y="2.5" width="2" height="4" rx="1"/><rect x="3" y="9" width="18" height="2" fill="${DARK}"/><path d="M8.5 15.5l2 2 4.5-4.5" stroke="${DARK}" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`,
        especial:   `<path d="M12 2l2.6 6.2 6.7.5-5.1 4.4 1.6 6.6L12 16.8 6.2 19.7l1.6-6.6L2.7 8.7l6.7-.5L12 2Z"/>`
    };

    // Hueco para glifos específicos por id (prioridad sobre el de categoría).
    // Cableados los 3 especiales pedidos.
    const AXCORE_BADGE_ICON_OVERRIDES = {
        legend:       `<path d="M3 18l-1.5-9L7 12l5-7 5 7 5.5-3L21 18H3Z"/><rect x="3" y="19" width="18" height="2" rx="1"/>`,
        goal_reached: `<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5.5" fill="${DARK}"/><circle cx="12" cy="12" r="2.2"/>`,
        goal_halfway: `<path d="M12 3A9 9 0 0 1 12 21Z"/><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="1.4" opacity="0.35"/>`
    };

    // Deriva el número SOLO del title ("RACHA 7" -> "7"). Abrevia miles:
    // 1000->1K, 10000->10K, 150000->150K. null si no hay dígitos en title.
    function axBadgeNumber(title) {
        const m = String(title || '').match(/(\d[\d,]*(?:\.\d+)?)/);
        if (!m) return null;
        const raw = m[1].replace(/,/g, '');
        const n = parseFloat(raw);
        if (isNaN(n)) return null;
        if (Number.isInteger(n) && n >= 1000) {
            const k = n / 1000;
            const kStr = (k % 1 === 0) ? String(k) : k.toFixed(1);
            return kStr + 'K';
        }
        return raw;
    }

    function badgeMedal(a, opts) {
        a = a || {};
        opts = opts || {};
        const unlocked = !!opts.unlocked;
        const size = opts.size || 72;
        const tier = Math.min(5, Math.max(1, +(a.t || a.tier || 1)));
        const cat = a.cat || a.c || 'especial';
        const glyph = AXCORE_BADGE_ICON_OVERRIDES[a.id] || AXCORE_BADGE_ICONS[cat];

        // Sin glifo disponible: fallback al emoji actual, sin medallón.
        if (!glyph) {
            return `<div class="axb-fallback" style="width:${size}px;height:${size}px;font-size:${Math.round(size * 0.5)}px;">${a.icon || '🏅'}</div>`;
        }

        const num = axBadgeNumber(a.title);

        return `
            <div class="axb-medal axb-t${tier}${unlocked ? '' : ' axb-locked'}" style="width:${size}px;height:${size}px;font-size:${size}px;">
                <svg class="axb-hud" viewBox="0 0 100 100">
                    <circle class="axb-ticks" cx="50" cy="50" r="42"/>
                    <circle class="axb-seg" cx="50" cy="50" r="35"/>
                    <circle class="axb-node" cx="50" cy="6" r="1.8"/>
                    <circle class="axb-node" cx="94" cy="50" r="1.8"/>
                    <circle class="axb-node" cx="50" cy="94" r="1.8"/>
                    <circle class="axb-node" cx="6" cy="50" r="1.8"/>
                    <g class="axb-glyph-glow" transform="translate(30.8,30.8) scale(1.6)">${glyph}</g>
                    <g class="axb-glyph-crisp" transform="translate(30.8,30.8) scale(1.6)">${glyph}</g>
                </svg>
                ${num ? `<div class="axb-pill">${num}</div>` : ''}
            </div>`;
    }

    window.AXCORE_BADGE_ICONS = AXCORE_BADGE_ICONS;
    window.AXCORE_BADGE_ICON_OVERRIDES = AXCORE_BADGE_ICON_OVERRIDES;
    window.badgeMedal = badgeMedal;
})();
