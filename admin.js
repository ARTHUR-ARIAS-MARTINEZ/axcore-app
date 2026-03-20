document.addEventListener('DOMContentLoaded', () => {
    // --- ESTADO ADMIN ---
    const ADMIN_PASSWORD = "ARTHUR2026";
    let adminData = {
        blocks: [],
        gyms: []
    };

    const loginOverlay = document.getElementById('admin-login');
    const adminContainer = document.getElementById('admin-container');
    const adminPassInput = document.getElementById('admin-pass');
    const btnLogin = document.getElementById('btn-admin-access');
    const btnLogout = document.getElementById('btn-logout-admin');

    const blocksList = document.getElementById('blocks-list');
    const gymsTableBody = document.getElementById('gyms-table-body');
    const gymBlockSelect = document.getElementById('gym-block-select');

    // --- SESIÓN ---
    if (sessionStorage.getItem('admin_active')) {
        showAdmin();
    }

    btnLogin.onclick = () => {
        if (adminPassInput.value === ADMIN_PASSWORD) {
            sessionStorage.setItem('admin_active', 'true');
            showAdmin();
        } else {
            alert("ACCESO DENEGADO: Clave Maestra Incorrecta.");
        }
    };

    adminPassInput.onkeypress = (e) => { if (e.key === 'Enter') btnLogin.click(); };

    btnLogout.onclick = () => {
        sessionStorage.removeItem('admin_active');
        location.reload();
    };

    function showAdmin() {
        loginOverlay.classList.add('hidden');
        adminContainer.classList.remove('hidden');
        loadAdminData();
        renderBlocks();
        renderGyms();
        renderCodes();
        calculateProfits();
    }

    const API_URL = location.hostname === 'localhost' || location.hostname === '127.0.0.1' ? 'http://localhost:3000' : 'https://axcore-appax-core-backend.onrender.com';

    // --- PERSISTENCIA ---
    async function loadAdminData() {
        const saved = localStorage.getItem('arthur_admin_blocks_data');
        if (saved) {
            adminData = JSON.parse(saved);
        }
        
        // Sincronizar desde MongoDB
        try {
            const res = await fetch(`${API_URL}/api/admin/gyms`);
            const data = await res.json();
            if(data.success && data.gyms) {
                adminData.gyms = data.gyms; // Reemplazar con datos reales
            }
        } catch(e) {
            console.error("Modo offline: Cargando gyms locales", e);
        }
    }

    function saveAdminData() {
        localStorage.setItem('arthur_admin_blocks_data', JSON.stringify(adminData));
    }

    // --- NAVEGACIÓN TABS ---
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.onclick = () => {
            const tab = btn.dataset.tab;
            document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.admin-pane').forEach(p => p.classList.remove('active'));
            
            btn.classList.add('active');
            document.getElementById(`tab-${tab}`).classList.add('active');

            // Actualizar datos al cambiar de pestaña
            if (tab === 'codes') renderCodes();
            if (tab === 'profits') calculateProfits();
        };
    });

    // --- GESTIÓN DE BLOQUES ---
    window.openModal = (id) => document.getElementById(id).classList.remove('hidden');
    window.closeModal = (id) => {
        document.getElementById(id).classList.add('hidden');
        document.getElementById(id).querySelectorAll('input, select').forEach(el => {
            if (el.type !== 'hidden') el.value = '';
        });
    };

    document.getElementById('btn-new-block').onclick = () => {
        document.getElementById('modal-block-title').textContent = "CONFIGURAR NUEVO BLOQUE";
        document.getElementById('block-name').value = "";
        document.getElementById('block-key').value = "";
        openModal('modal-block');
    };

    document.getElementById('btn-save-block').onclick = () => {
        const name = document.getElementById('block-name').value.trim();
        const key = document.getElementById('block-key').value.trim();

        if (!name || !key) return alert("Completa todos los campos del bloque.");

        const newBlock = {
            id: Date.now().toString(),
            name: name,
            apiKey: key,
            created: new Date().toLocaleDateString()
        };

        adminData.blocks.push(newBlock);
        saveAdminData();
        closeModal('modal-block');
        renderBlocks();
        updateGymBlockSelect();
    };

    function renderBlocks() {
        blocksList.innerHTML = adminData.blocks.map(b => {
            const gymsInBlock = adminData.gyms.filter(g => g.blockId === b.id).length;
            return `
                <div class="block-card">
                    <h4>${b.name.toUpperCase()}</h4>
                    <div class="api-preview">API: ${b.apiKey.substring(0, 8)}...${b.apiKey.slice(-4)}</div>
                    <div class="gym-count">Status: ${gymsInBlock} / 20 Gimnasios</div>
                    <div class="block-actions">
                        <button class="btn-cancel" style="font-size:0.6rem;" onclick="deleteBlock('${b.id}')">ELIMINAR</button>
                    </div>
                </div>
            `;
        }).join('');
        if (adminData.blocks.length === 0) {
            blocksList.innerHTML = `<p style="grid-column: 1/-1; text-align:center; padding:3rem; color:var(--text-dim);">No hay bloques configurados. Crea el primero para empezar.</p>`;
        }
    }

    window.deleteBlock = (id) => {
        if (confirm("¿Seguro que quieres eliminar este bloque? Los gimnasios asociados quedarán huérfanos.")) {
            adminData.blocks = adminData.blocks.filter(b => b.id !== id);
            saveAdminData();
            renderBlocks();
            updateGymBlockSelect();
        }
    };

    // --- SELECTOR DE PLAN ---
    let selectedPlan = 'basico';

    document.querySelectorAll('.plan-btn').forEach(btn => {
        btn.onclick = () => {
            document.querySelectorAll('.plan-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            selectedPlan = btn.dataset.plan;
        };
    });

    // --- GENERADOR DE CÓDIGO AUTOMÁTICO ---
    function generateGymCode(plan) {
        const prefixes = {
            basico: 'AXB',
            estandar: 'AXE',
            premium: 'AXP'
        };
        const prefix = prefixes[plan] || 'AXB';
        const random = Math.random().toString(36).substring(2, 6).toUpperCase();
        return `${prefix}-${random}`;
    }

    // --- GESTIÓN DE GIMNASIOS ---
    document.getElementById('btn-new-gym').onclick = () => {
        if (adminData.blocks.length === 0) return alert("Primero debes crear al menos un Bloque.");
        updateGymBlockSelect();
        // Reset plan selector
        selectedPlan = 'basico';
        document.querySelectorAll('.plan-btn').forEach(b => b.classList.remove('active'));
        document.querySelector('.plan-btn[data-plan="basico"]').classList.add('active');
        openModal('modal-gym');
    };

    function updateGymBlockSelect() {
        gymBlockSelect.innerHTML = adminData.blocks.map(b => `<option value="${b.id}">${b.name}</option>`).join('');
    }

    document.getElementById('btn-save-gym').onclick = async () => {
        const bid = gymBlockSelect.value;
        const gname = document.getElementById('gym-name').value.trim();
        const gowner = document.getElementById('gym-owner').value.trim();
        const gmanager = document.getElementById('gym-manager').value.trim();
        const gcoach = document.getElementById('gym-coach').value.trim();
        
        if (!gname || !gowner) return alert("Nombre de gimnasio y dueño son obligatorios.");

        // Obtener datos del plan seleccionado
        const planInfo = AX_PLANS[selectedPlan];
        const gymCode = generateGymCode(selectedPlan);
        const rent = planInfo.price;

        const newGym = {
            gymCode: gymCode,
            name: gname,
            owner: gowner,
            manager: gmanager,
            coach: gcoach,
            plan: selectedPlan,
            maxUsers: planInfo.maxUsers,
            rent: rent,
            active: true
        };

        document.getElementById('btn-save-gym').textContent = 'Subiendo a la nube...';

        try {
            // Guardar globalmente
            const res = await fetch(`${API_URL}/api/admin/gyms`, {
                method: 'POST',
                headers:{'Content-Type': 'application/json'},
                body: JSON.stringify(newGym)
            });
            const data = await res.json();
            if(data.success) {
                adminData.gyms.push(data.gym);
                saveAdminData();
            } else {
                alert("Error creando en global, se guardará en local.");
                adminData.gyms.push(newGym);
                saveAdminData();
            }
        } catch(e) {
            adminData.gyms.push(newGym);
            saveAdminData();
        }

        document.getElementById('btn-save-gym').textContent = 'GUARDAR GIMNASIO';
        closeModal('modal-gym');
        renderGyms();
        renderBlocks(); 
        renderCodes();
        calculateProfits();

        // Mostrar modal con el código generado
        document.getElementById('generated-code-display').textContent = gymCode;
        document.getElementById('generated-plan-info').innerHTML = `
            <strong>Gimnasio:</strong> ${gname}<br>
            <strong>Plan:</strong> ${planInfo.name} ($${rent.toLocaleString()} MXN/mes)<br>
            <strong>Límite:</strong> ${planInfo.maxUsers} usuarios<br>
            <strong>Dueño:</strong> ${gowner}<br>
            <strong style="color:var(--accent-main); font-size:1.1rem;">Nube: ✅ ACTIVADO</strong>
        `;
        openModal('modal-code-result');
    };

    // Botón copiar código
    document.getElementById('btn-copy-code').onclick = () => {
        const code = document.getElementById('generated-code-display').textContent;
        navigator.clipboard.writeText(code).then(() => {
            document.getElementById('btn-copy-code').textContent = "✅ ¡COPIADO!";
            setTimeout(() => {
                document.getElementById('btn-copy-code').textContent = "📋 COPIAR CÓDIGO";
            }, 2000);
        }).catch(() => {
            // Fallback para navegadores sin clipboard API
            prompt("Copia este código manualmente:", code);
        });
    };

    // --- CONTAR USUARIOS POR CÓDIGO ---
    function countUsersForCode(code) {
        // Ahora lo leemos directamente si viene del servidor
        const gymNode = adminData.gyms.find(g => g.gymCode === code);
        if (gymNode && gymNode.currentUsers !== undefined) {
            return gymNode.currentUsers;
        }

        // Fallback local por si estamos offline
        let count = 0;
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.startsWith('arthur_data_')) {
                try {
                    const data = JSON.parse(localStorage.getItem(key));
                    if (data.gymCode === code) count++;
                } catch(e) {}
            }
        }
        return count;
    }

    function renderGyms() {
        gymsTableBody.innerHTML = adminData.gyms.map(g => {
            const block = adminData.blocks.find(b => b.id === g.blockId);
            const blockName = block ? block.name : "N/A";
            const planInfo = AX_PLANS[g.plan || 'basico'];
            const userCount = countUsersForCode(g.gymCode);
            const maxUsers = g.maxUsers || planInfo.maxUsers;
            const usagePercent = Math.round((userCount / maxUsers) * 100);
            const isNearLimit = usagePercent >= 80;
            const isAtLimit = userCount >= maxUsers;
            
            return `
                <tr>
                    <td style="color:var(--accent-secondary); font-weight:bold;">${blockName}</td>
                    <td><span style="font-family:monospace; background:rgba(0,255,136,0.1); padding:2px 6px; border-radius:4px; font-size:0.7rem; color:var(--accent-main);">${g.gymCode || 'N/A'}</span></td>
                    <td><span style="font-size:0.65rem; background:${planInfo.color}22; color:${planInfo.color}; padding:3px 8px; border-radius:8px; font-weight:bold;">${planInfo.name}</span></td>
                    <td>${g.name}</td>
                    <td>${g.owner}</td>
                    <td style="color:var(--accent-main); font-weight:bold;">$${(g.rent || 0).toLocaleString()}</td>
                    <td>
                        <span style="color:${isAtLimit ? '#ff3366' : isNearLimit ? '#ffaa00' : '#00ff88'}; font-weight:bold;">${userCount}/${maxUsers}</span>
                        <div style="background:rgba(255,255,255,0.1); border-radius:4px; height:4px; margin-top:3px; overflow:hidden;">
                            <div style="width:${usagePercent}%; background:${isAtLimit ? '#ff3366' : isNearLimit ? '#ffaa00' : '#00ff88'}; height:100%; border-radius:4px; transition:0.3s;"></div>
                        </div>
                    </td>
                    <td>
                        <span style="font-size:0.65rem; padding:3px 8px; border-radius:8px; ${g.active ? 'background:rgba(0,255,136,0.1); color:#00ff88;' : 'background:rgba(255,51,102,0.1); color:#ff3366;'}">${g.active ? '✅ ACTIVO' : '❌ PAUSADO'}</span>
                    </td>
                    <td style="display:flex; gap:4px; flex-wrap:wrap;">
                        <button class="btn-cancel" style="padding:4px 8px; font-size:0.55rem; background:transparent; border:1px solid ${g.active ? '#ffaa00' : '#00ff88'}; color:${g.active ? '#ffaa00' : '#00ff88'}; border-radius:4px;" onclick="toggleGym('${g._id || g.id}')">${g.active ? 'PAUSAR' : 'ACTIVAR'}</button>
                        <button class="btn-cancel" style="padding:4px 8px; font-size:0.55rem;" onclick="deleteGym('${g._id || g.id}')">QUITAR</button>
                    </td>
                </tr>
            `;
        }).join('');
    }

    // --- PAUSAR/ACTIVAR GIMNASIO ---
    window.toggleGym = async (id) => {
        const gym = adminData.gyms.find(g => g._id === id || g.id === id);
        if (gym) {
            gym.active = !gym.active;
            
            // Sincronizar en global
            try {
                await fetch(`${API_URL}/api/admin/toggle`, {
                    method: 'POST',
                    headers:{'Content-Type': 'application/json'},
                    body: JSON.stringify({ gymCode: gym.gymCode, status: gym.active })
                });
            } catch(e) { console.error('Conexion fallida, guardado en local', e); }

            saveAdminData();
            renderGyms();
            renderCodes();
            calculateProfits();
            alert(gym.active 
                ? `✅ Gimnasio "${gym.name}" ACTIVADO globalmente. El código ${gym.gymCode} ya funciona.`
                : `⏸️ Gimnasio "${gym.name}" PAUSADO globalmente. Sus usuarios NO podrán registrarse con el código ${gym.gymCode}.`
            );
        }
    };

    window.deleteGym = async (id) => {
        if (confirm("¿Desvincular este gimnasio definitivamente también de la base de datos GLOBAL?")) {
            const gym = adminData.gyms.find(g => g._id === id || g.id === id);
            adminData.gyms = adminData.gyms.filter(g => g._id !== id && g.id !== id);
            
            if(gym) {
                try {
                    await fetch(`${API_URL}/api/admin/gyms/${gym.gymCode}`, { method: 'DELETE' });
                } catch(e) {}
            }

            saveAdminData();
            renderGyms();
            renderBlocks();
            renderCodes();
            calculateProfits();
        }
    };

    // --- CÓDIGOS ACTIVOS (NUEVA PESTAÑA) ---
    function renderCodes() {
        const codesContainer = document.getElementById('codes-cards');
        if (!codesContainer) return;

        codesContainer.innerHTML = adminData.gyms.map(g => {
            const planInfo = AX_PLANS[g.plan || 'basico'];
            const userCount = countUsersForCode(g.gymCode);
            const maxUsers = g.maxUsers || planInfo.maxUsers;
            
            return `
                <div class="block-card" style="border-color:${g.active ? planInfo.color : '#ff3366'}33; position:relative;">
                    ${!g.active ? '<div style="position:absolute; top:10px; right:10px; font-size:0.6rem; background:rgba(255,51,102,0.2); color:#ff3366; padding:2px 8px; border-radius:8px;">PAUSADO</div>' : ''}
                    <h4 style="color:${planInfo.color}; font-size:0.85rem;">${g.name}</h4>
                    <div style="font-family:monospace; font-size:1.5rem; color:var(--accent-main); background:rgba(0,255,136,0.05); padding:0.8rem; border-radius:10px; text-align:center; letter-spacing:3px; margin:0.8rem 0; user-select:all; cursor:pointer;" onclick="copyCode('${g.gymCode}')" title="Clic para copiar">
                        ${g.gymCode}
                    </div>
                    <div style="font-size:0.7rem; color:var(--text-dim);">
                        <div>Plan: <strong style="color:${planInfo.color};">${planInfo.name}</strong> ($${planInfo.price.toLocaleString()}/mes)</div>
                        <div>Usuarios: <strong>${userCount}/${maxUsers}</strong></div>
                        <div>Dueño: ${g.owner}</div>
                    </div>
                    <button class="btn-premium small" style="width:100%; margin-top:0.8rem; font-size:0.6rem;" onclick="copyCode('${g.gymCode}')">📋 COPIAR CÓDIGO</button>
                </div>
            `;
        }).join('');

        if (adminData.gyms.length === 0) {
            codesContainer.innerHTML = `<p style="grid-column: 1/-1; text-align:center; padding:3rem; color:var(--text-dim);">No hay códigos generados. Ve a "Asignación de Gimnasios" → "+ AGREGAR GIMNASIO" para crear uno.</p>`;
        }
    }

    window.copyCode = (code) => {
        navigator.clipboard.writeText(code).then(() => {
            alert(`✅ Código "${code}" copiado al portapapeles. ¡Dáselo al dueño del gimnasio!`);
        }).catch(() => {
            prompt("Copia este código manualmente:", code);
        });
    };

    function calculateProfits() {
        const activeGyms = adminData.gyms.filter(g => g.active !== false);
        const totalMRR = activeGyms.reduce((sum, g) => sum + (g.rent || 0), 0);
        const totalUsers = adminData.gyms.reduce((sum, g) => sum + countUsersForCode(g.gymCode), 0);
        
        document.getElementById('total-mrr').textContent = totalMRR.toLocaleString();
        document.getElementById('total-ltm').textContent = (totalMRR * 12).toLocaleString();
        
        const gymsCountEl = document.getElementById('total-gyms-count');
        if (gymsCountEl) gymsCountEl.textContent = activeGyms.length;
        
        const usersCountEl = document.getElementById('total-users-count');
        if (usersCountEl) usersCountEl.textContent = totalUsers;

        // Desglose por plan
        const breakdownEl = document.getElementById('plan-breakdown');
        if (breakdownEl) {
            const plans = ['basico', 'estandar', 'premium'];
            breakdownEl.innerHTML = plans.map(planKey => {
                const plan = AX_PLANS[planKey];
                const planGyms = activeGyms.filter(g => g.plan === planKey);
                const planRevenue = planGyms.reduce((s, g) => s + (g.rent || 0), 0);
                return `
                    <div class="glass-card profit-card" style="border-color:${plan.color}33;">
                        <h3 style="color:${plan.color};">${plan.name}</h3>
                        <div class="profit-value" style="font-size:1.2rem;">$ ${planRevenue.toLocaleString()}</div>
                        <p style="font-size:0.7rem; color:var(--text-dim);">${planGyms.length} gimnasio(s) × $${plan.price.toLocaleString()}</p>
                    </div>
                `;
            }).join('');
        }
    }
});
