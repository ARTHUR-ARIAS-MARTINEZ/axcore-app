/* ════════════════════════════════════════════════════════════════
   AX-CORE Premium Badges — Sistema de 100 insignias
   Se activa solo en .premium-mode. Lee userData.achievements
   para detectar las desbloqueadas. Las demás son mystery blocks.
   ════════════════════════════════════════════════════════════════ */
(function(){
    'use strict';

    // Definición de las 100 insignias (mismas del prototipo, 12 categorías)
    const PM_BADGES = [
        // INICIO (10)
        {id:'welcome',e:'🎯',n:'Bienvenido',d:'Abriste AX-CORE',t:1,c:'inicio'},
        {id:'first_log',e:'📋',n:'1er Perfil',d:'Llenaste tu perfil',t:1,c:'inicio'},
        {id:'first_food',e:'🍽️',n:'1er Alimento',d:'1er log de comida',t:1,c:'inicio'},
        {id:'first_strength',e:'💪',n:'1er Ejercicio',d:'Tu 1er ejercicio',t:1,c:'inicio'},
        {id:'first_measure',e:'📐',n:'1ª Medida',d:'1ª medida corporal',t:1,c:'inicio'},
        {id:'personalized',e:'🎨',n:'Estilo Propio',d:'Cambiaste el tema',t:1,c:'inicio'},
        {id:'avatar',e:'📸',n:'Con Rostro',d:'Foto de perfil',t:1,c:'inicio'},
        {id:'diet_set',e:'🥗',n:'Plan Listo',d:'Dieta configurada',t:1,c:'inicio'},
        {id:'first_calc',e:'🧮',n:'Calculador',d:'Usaste calculadora',t:1,c:'inicio'},
        {id:'first_share',e:'🌟',n:'Compartidor',d:'1ª tarjeta Studio',t:1,c:'inicio'},
        // RACHA (10)
        {id:'streak_1',e:'🔥',n:'Racha 1',d:'1 día',t:1,c:'racha'},
        {id:'streak_3',e:'🔥',n:'Racha 3',d:'3 días',t:1,c:'racha'},
        {id:'streak_7',e:'⚡',n:'Racha 7',d:'1 semana',t:2,c:'racha'},
        {id:'streak_12',e:'⚡',n:'Racha 12',d:'12 días',t:2,c:'racha'},
        {id:'streak_14',e:'⚡',n:'Racha 14',d:'2 semanas',t:2,c:'racha'},
        {id:'streak_21',e:'🌙',n:'Racha 21',d:'Hábito formado',t:3,c:'racha'},
        {id:'streak_30',e:'💫',n:'Racha 30',d:'1 mes',t:3,c:'racha'},
        {id:'streak_60',e:'🌟',n:'Racha 60',d:'2 meses',t:3,c:'racha'},
        {id:'streak_90',e:'💎',n:'Racha 90',d:'3 meses élite',t:4,c:'racha'},
        {id:'streak_365',e:'👑',n:'Racha 365',d:'UN AÑO',t:5,c:'racha'},
        // PESO (10)
        {id:'minus_05kg',e:'⚖️',n:'-0.5 kg',d:'Primera bajada',t:1,c:'peso'},
        {id:'minus_1kg',e:'⚖️',n:'-1 kg',d:'Primer kilo',t:1,c:'peso'},
        {id:'minus_2kg',e:'🎉',n:'-2 kg',d:'Dos kilos',t:2,c:'peso'},
        {id:'minus_3kg',e:'🏅',n:'-3 kg',d:'Tres kilos',t:2,c:'peso'},
        {id:'minus_5kg',e:'🥉',n:'-5 kg',d:'Bronce',t:2,c:'peso'},
        {id:'minus_7kg',e:'🥈',n:'-7 kg',d:'Plata',t:3,c:'peso'},
        {id:'minus_10kg',e:'🥇',n:'-10 kg',d:'Oro',t:3,c:'peso'},
        {id:'minus_15kg',e:'💫',n:'-15 kg',d:'15 kilos',t:4,c:'peso'},
        {id:'minus_20kg',e:'🦅',n:'-20 kg',d:'20 kilos',t:4,c:'peso'},
        {id:'goal_reached',e:'🔱',n:'META',d:'Meta alcanzada',t:5,c:'peso'},
        // CARDIO (11)
        {id:'first_cardio',e:'🏃',n:'1er Cardio',d:'Primera carrera',t:1,c:'cardio'},
        {id:'run_20min',e:'⏱️',n:'20 min',d:'20 min corriendo',t:1,c:'cardio'},
        {id:'run_30min',e:'⏱️',n:'30 min',d:'30 min seguidos',t:2,c:'cardio'},
        {id:'run_45min',e:'⏱️',n:'45 min',d:'45 minutos',t:2,c:'cardio'},
        {id:'run_60min',e:'⏱️',n:'1 hora',d:'1 hora continua',t:3,c:'cardio'},
        {id:'run_5k',e:'📍',n:'5K',d:'5 km acumulados',t:2,c:'cardio'},
        {id:'run_10k',e:'📍',n:'10K',d:'10 km acumulados',t:3,c:'cardio'},
        {id:'run_21k',e:'📍',n:'21K',d:'Media maratón',t:3,c:'cardio'},
        {id:'run_42k',e:'📍',n:'42K',d:'Maratón',t:4,c:'cardio'},
        {id:'run_100k',e:'📍',n:'100K',d:'100 km totales',t:4,c:'cardio'},
        {id:'run_500k',e:'🌍',n:'500K',d:'500 km totales',t:5,c:'cardio'},
        // FUERZA (8)
        {id:'first_set',e:'💪',n:'1er Set',d:'1ª serie fuerza',t:1,c:'fuerza'},
        {id:'reps_100',e:'💪',n:'100 Reps',d:'100 repeticiones',t:1,c:'fuerza'},
        {id:'reps_500',e:'💪',n:'500 Reps',d:'500 reps',t:2,c:'fuerza'},
        {id:'reps_1k',e:'💪',n:'1K Reps',d:'1,000 reps',t:2,c:'fuerza'},
        {id:'reps_5k',e:'💪',n:'5K Reps',d:'5,000 reps',t:3,c:'fuerza'},
        {id:'reps_10k',e:'💪',n:'10K Club',d:'10K Club',t:4,c:'fuerza'},
        {id:'reps_50k',e:'💪',n:'50K Reps',d:'50,000 reps',t:5,c:'fuerza'},
        {id:'reps_100k',e:'💪',n:'100K LEYENDA',d:'100K reps',t:5,c:'fuerza'},
        // PRESS BANCA (8)
        {id:'bench_30',e:'🏋️',n:'Banca 30',d:'30 kg',t:1,c:'banca'},
        {id:'bench_40',e:'🏋️',n:'Banca 40',d:'40 kg',t:1,c:'banca'},
        {id:'bench_50',e:'🏋️',n:'Banca 50',d:'50 kg',t:2,c:'banca'},
        {id:'bench_60',e:'🏋️',n:'Banca 60',d:'60 kg',t:2,c:'banca'},
        {id:'bench_80',e:'🏋️',n:'Banca 80',d:'80 kg',t:3,c:'banca'},
        {id:'bench_100',e:'🏋️',n:'CENTURIÓN',d:'100 kg',t:4,c:'banca'},
        {id:'bench_120',e:'🏋️',n:'Banca 120',d:'120 kg',t:5,c:'banca'},
        {id:'bench_140',e:'🏋️',n:'HÉRCULES',d:'140 kg',t:5,c:'banca'},
        // CORE (6)
        {id:'plank_first',e:'🧘',n:'1ª Plancha',d:'Primera plancha',t:1,c:'core'},
        {id:'plank_30s',e:'🧘',n:'Plancha 30s',d:'30 segundos',t:1,c:'core'},
        {id:'plank_1m',e:'🧘',n:'Plancha 1m',d:'1 minuto',t:2,c:'core'},
        {id:'plank_2m',e:'🧘',n:'Plancha 2m',d:'2 minutos',t:3,c:'core'},
        {id:'plank_5m',e:'🧘',n:'Plancha 5m',d:'5 min ÉLITE',t:4,c:'core'},
        {id:'plank_10m',e:'🧘',n:'REY CORE',d:'10 minutos',t:5,c:'core'},
        // KCAL (6)
        {id:'burn_100',e:'🔥',n:'100 kcal',d:'Primeras 100',t:1,c:'kcal'},
        {id:'burn_500day',e:'🔥',n:'500/día',d:'500 en 1 día',t:2,c:'kcal'},
        {id:'burn_1kday',e:'🔥',n:'1K/día',d:'1,000 en 1 día',t:3,c:'kcal'},
        {id:'burn_10k',e:'🔥',n:'10K total',d:'10,000 acumuladas',t:3,c:'kcal'},
        {id:'burn_50k',e:'🔥',n:'50K total',d:'50,000 totales',t:4,c:'kcal'},
        {id:'burn_100k',e:'🔥',n:'100K BURN',d:'100,000 LEYENDA',t:5,c:'kcal'},
        // DÉFICIT (6)
        {id:'def_first',e:'📉',n:'1er Déficit',d:'1er día bajo límite',t:1,c:'deficit'},
        {id:'def_3500',e:'📉',n:'3,500 kcal',d:'≈0.5 kg grasa',t:2,c:'deficit'},
        {id:'def_7700',e:'📉',n:'7,700 kcal',d:'≈1 kg grasa',t:3,c:'deficit'},
        {id:'def_15k',e:'📉',n:'15K kcal',d:'≈2 kg grasa',t:3,c:'deficit'},
        {id:'def_38k',e:'📉',n:'38K kcal',d:'≈5 kg grasa',t:4,c:'deficit'},
        {id:'def_77k',e:'📉',n:'77K kcal',d:'≈10 kg fundidos',t:5,c:'deficit'},
        // ALIMENTACIÓN (6)
        {id:'food_10',e:'🥗',n:'10 alim.',d:'10 registros',t:1,c:'food'},
        {id:'food_50',e:'🥗',n:'50 alim.',d:'50 registros',t:2,c:'food'},
        {id:'food_100',e:'🥗',n:'100 alim.',d:'100 registros',t:2,c:'food'},
        {id:'food_250',e:'🥗',n:'250 alim.',d:'250 registros',t:3,c:'food'},
        {id:'food_500',e:'🥗',n:'500 alim.',d:'500 registros',t:4,c:'food'},
        {id:'food_1k',e:'🥗',n:'MAESTRO',d:'1,000 registros',t:5,c:'food'},
        // MEDIDAS (6)
        {id:'meas_first',e:'📏',n:'1ª Med.',d:'1er registro',t:1,c:'med'},
        {id:'meas_5',e:'📏',n:'5 registros',d:'5 logs medidas',t:1,c:'med'},
        {id:'meas_10',e:'📏',n:'10 registros',d:'10 logs',t:2,c:'med'},
        {id:'waist_3',e:'📏',n:'Cintura -3',d:'-3 cm cintura',t:2,c:'med'},
        {id:'waist_5',e:'📏',n:'Cintura -5',d:'-5 cm cintura',t:3,c:'med'},
        {id:'waist_10',e:'📏',n:'Cintura -10',d:'-10 cm cintura',t:4,c:'med'},
        // ESPECIALES (13)
        {id:'early_bird',e:'🌅',n:'Madrugador',d:'Activo antes 6 AM',t:2,c:'esp'},
        {id:'night_owl',e:'🌙',n:'Noctámbulo',d:'Activo > 11 PM',t:2,c:'esp'},
        {id:'birthday',e:'🎂',n:'Cumpleañero',d:'App en cumpleaños',t:2,c:'esp'},
        {id:'constant',e:'⛄',n:'Constante',d:'30 días sin subir',t:3,c:'esp'},
        {id:'no_cheat',e:'🧊',n:'Sin Trampa',d:'7 días en límite',t:3,c:'esp'},
        {id:'exact',e:'🎯',n:'Exacto',d:'Igual a proyección',t:4,c:'esp'},
        {id:'all_in_one',e:'🤸',n:'Todo en Uno',d:'Dieta+ejer+med 1 día',t:3,c:'esp'},
        {id:'badges_10',e:'🏅',n:'10 Insignias',d:'Coleccionista',t:2,c:'esp'},
        {id:'badges_25',e:'🥈',n:'25 Insignias',d:'Acumulador',t:3,c:'esp'},
        {id:'badges_50',e:'🥇',n:'50 Insignias',d:'Master',t:4,c:'esp'},
        {id:'badges_75',e:'💎',n:'75 Insignias',d:'Quasi-Leyenda',t:5,c:'esp'},
        {id:'badges_100',e:'👑',n:'LEYENDA',d:'Las 100. ERES AX',t:5,c:'esp'},
        {id:'last_special',e:'⭐',n:'Estrella',d:'Reservado',t:5,c:'esp'}
    ];

    const CATS = ['todos','inicio','racha','peso','cardio','fuerza','banca','core','kcal','deficit','food','med','esp'];
    const CAT_NAMES = {todos:'TODAS',inicio:'INICIO',racha:'RACHA',peso:'PESO',cardio:'CARDIO',fuerza:'FUERZA',banca:'BANCA',core:'CORE',kcal:'KCAL',deficit:'DÉFICIT',food:'COMIDA',med:'MEDIDAS',esp:'ESPECIAL'};
    const TIER_NAMES = {1:'BRONCE',2:'PLATA',3:'ORO',4:'PLATINO',5:'LEY'};

    let activeCat = 'todos';

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
                <div class="pm-badges-title">🏅 LAS 100 INSIGNIAS</div>
                <button class="pm-badges-close" onclick="window.pmCloseBadges()">✕</button>
            </div>
            <div class="pm-badges-prog">Desbloqueadas: <strong id="pmBadgesNum">0</strong> de 100</div>
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
        wrap.innerHTML = CATS.map(c =>
            `<div class="pm-cat-chip ${c===activeCat?'on':''}" data-cat="${c}">${CAT_NAMES[c]}</div>`
        ).join('');
        wrap.querySelectorAll('.pm-cat-chip').forEach(chip => {
            chip.onclick = () => { activeCat = chip.dataset.cat; renderCats(); renderGrid(); };
        });
    }

    function renderGrid() {
        const wrap = document.getElementById('pmBadgesGrid');
        if (!wrap) return;
        const list = activeCat === 'todos' ? PM_BADGES : PM_BADGES.filter(b => b.c === activeCat);
        wrap.innerHTML = list.map(b => {
            const u = isUnlocked(b.id);
            if (u) {
                return `
                    <div class="pm-bcard unlocked t${b.t}" title="${b.n} · ${b.d}">
                        <div class="pm-btier">${TIER_NAMES[b.t]}</div>
                        <div class="pm-bemoji">${b.e}</div>
                        <div class="pm-bname">${b.n}</div>
                        <div class="pm-bdesc">${b.d}</div>
                    </div>`;
            }
            return `
                <div class="pm-bcard locked" title="🔒 Sigue entrenando para desbloquear">
                    <div class="pm-btier">${TIER_NAMES[b.t]}</div>
                    <div class="pm-bemoji">?</div>
                    <div class="pm-block-overlay">🔒</div>
                    <div class="pm-bname">??????</div>
                    <div class="pm-bdesc">Oculta</div>
                </div>`;
        }).join('');
    }

    function open() {
        if (!document.body.classList.contains('premium-mode')) return;
        injectModal();
        const unlocked = getUnlocked();
        // Solo cuenta los IDs que existen en PM_BADGES
        const validIds = new Set(PM_BADGES.map(b => b.id));
        const realCount = unlocked.filter(id => validIds.has(id)).length;
        document.getElementById('pmBadgesNum').textContent = realCount;
        renderCats();
        renderGrid();
        document.getElementById('pmBadgesModal').classList.add('on');
    }

    function close() {
        const m = document.getElementById('pmBadgesModal');
        if (m) m.classList.remove('on');
    }

    // Expose globally
    window.pmOpenBadges = open;
    window.pmCloseBadges = close;

    // Auto-inyectar el botón "Ver las 100" en Studio achievements panel
    // y enganchar el "Ver todas →" del dashboard premium
    function attachTriggers() {
        // Studio: agregar botón al panel de logros si existe
        const ap = document.getElementById('achievements-panel');
        if (ap && !ap.querySelector('.pm-ver-todas-btn')) {
            const btn = document.createElement('div');
            btn.style.cssText = 'grid-column:1/-1;text-align:center;margin-top:14px;';
            btn.innerHTML = '<button class="pm-ver-todas-btn" onclick="window.pmOpenBadges()">🏅 VER LAS 100 INSIGNIAS →</button>';
            ap.appendChild(btn);
        }
    }

    // Llamar después de que el DOM esté listo y periódicamente para cuando se re-renderiza Studio
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', attachTriggers);
    } else {
        attachTriggers();
    }
    // Reintenta cuando se navegue (porque achievements-panel se rellena dinámicamente)
    document.addEventListener('click', (e) => {
        if (e.target.closest('[data-page=studio]')) {
            setTimeout(attachTriggers, 200);
            setTimeout(attachTriggers, 600);
        }
    });

})();
