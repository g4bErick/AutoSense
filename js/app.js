/**
 * AutoSense - Main Application Controller
 * Orquestra Telas, Autenticação, Painel OBD, Acessibilidade para Idosos e Painel do Administrador.
 */

const esc = (v) => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

const App = {
  toast(msg, type = 'info') {
    const box = document.getElementById('toast-box');
    if (!box) return;
    const el = document.createElement('div');
    el.className = 'toast ' + type;
    el.textContent = msg;
    box.appendChild(el);
    setTimeout(() => el.remove(), 4000);
  },

  currentUser: null,
  currentVehicle: null,
  activeTab: 'dashboard',
  gauges: null,
  lastSpokenAlertTime: 0,

  init() {
    console.log('Iniciando AutoSense OBD...');

    // 1. Inicializar instâncias
    this.gauges = new window.GaugeRenderer();
    this.gauges.init('speedometer-canvas', 'tachometer-canvas');

    // 2. Definir usuário inicial (Padrão: Sr. João para já demonstrar acessibilidade)
    const savedUserId = localStorage.getItem('autosense_active_user_id') || 'usr_senior_joao';
    const user = window.DB.getUserById(savedUserId) || window.DB.getUsers()[1];
    this.setCurrentUser(user);

    // 3. Registrar Listeners de Eventos do OBD
    this.setupOBDListeners();

    // 4. Configurar Eventos da Interface
    this.bindEvents();

    // 5. Aplicar preferências de acessibilidade
    this.applyAccessibilityPreferences();

    // 6. Atualizar Telas
    this.renderCurrentVehicle();
    this.renderDiagnostics();
    this.renderMaintenance();
    this.renderAdminPanel();

    // Redimensionar gauges responsivos
    window.addEventListener('resize', () => {
      if (this.gauges) {
        if (this.gauges.speedCanvas) this.gauges.adjustCanvasResolution(this.gauges.speedCanvas);
        if (this.gauges.rpmCanvas) this.gauges.adjustCanvasResolution(this.gauges.rpmCanvas);
      }
    });

    console.log('AutoSense carregado com sucesso!');
  },

  // === CONTROLE DE SESSÃO E USUÁRIO ===
  setCurrentUser(user) {
    if (window.OBD && window.OBD.status !== 'disconnected') window.OBD.disconnect();
    this.currentUser = user;
    if (user) {
      localStorage.setItem('autosense_active_user_id', user.id);
      
      // Obter veículo do usuário
      const vehicles = window.DB.getVehicles(user.id);
      this.currentVehicle = vehicles.length > 0 ? vehicles[0] : (user.role === 'admin' ? (window.DB.getVehicles()[0] || null) : null);

      // Atualizar badge do usuário na barra superior
      const avatarEl = document.getElementById('user-avatar');
      const nameEl = document.getElementById('user-name-short');
      const roleBadge = document.getElementById('user-role-badge');
      
      if (avatarEl) avatarEl.textContent = user.name.charAt(0).toUpperCase();
      if (nameEl) nameEl.textContent = user.name.split(' ')[0];
      if (roleBadge) {
        roleBadge.textContent = user.role === 'admin' ? 'ADMIN' : (user.seniorMode ? 'SÊNIOR' : 'MOTORISTA');
        roleBadge.className = `user-role-pill role-${user.role}`;
      }

      // Exibir ou ocultar aba de administrador conforme permissão
      const adminNavTab = document.getElementById('nav-tab-admin');
      if (adminNavTab) {
        adminNavTab.style.display = user.role === 'admin' ? 'flex' : 'none';
      }

      this.applyAccessibilityPreferences();
      this.renderCurrentVehicle();
      if (this.gauges) this.gauges.update(0, 0);
      this.renderDiagnostics(); this.renderMaintenance(); this.renderAdminPanel(); this.refreshMIL();
      if (user.role !== 'admin' && this.activeTab === 'admin') this.switchTab('dashboard');
    } else {
      localStorage.removeItem('autosense_active_user_id');
      this.currentVehicle = null;
      this.showModal('login-modal');
    }
  },

  applyAccessibilityPreferences() {
    if (!this.currentUser) return;

    const body = document.body;
    
    // 1. Modo Sênior
    if (this.currentUser.seniorMode) {
      body.classList.add('senior-mode-active');
    } else {
      body.classList.remove('senior-mode-active');
    }

    // 2. Alto Contraste
    if (this.currentUser.highContrast) {
      body.classList.add('high-contrast-active');
    } else {
      body.classList.remove('high-contrast-active');
    }

    // 3. Tamanho de Fonte
    body.classList.remove('font-normal', 'font-large', 'font-xlarge');
    if (this.currentUser.fontSize === 'large') {
      body.classList.add('font-large');
    } else if (this.currentUser.fontSize === 'xlarge') {
      body.classList.add('font-xlarge');
    }

    // Atualizar switch no topo
    const toggleSeniorBtn = document.getElementById('btn-toggle-senior');
    if (toggleSeniorBtn) {
      toggleSeniorBtn.textContent = this.currentUser.seniorMode ? '👴 Sênior: ATIVO' : '👓 Modo Sênior';
      toggleSeniorBtn.style.background = this.currentUser.seniorMode ? '#ffe600' : 'rgba(255,255,255,0.1)';
      toggleSeniorBtn.style.color = this.currentUser.seniorMode ? '#000000' : '#ffffff';
    }

    // Atualizar checkboxes na aba de acessibilidade
    const chkSenior = document.getElementById('pref-senior-mode');
    const chkContrast = document.getElementById('pref-high-contrast');
    const selFontSize = document.getElementById('pref-font-size');
    const chkVoice = document.getElementById('pref-voice-alerts');

    if (chkSenior) chkSenior.checked = !!this.currentUser.seniorMode;
    if (chkContrast) chkContrast.checked = !!this.currentUser.highContrast;
    if (selFontSize) selFontSize.value = this.currentUser.fontSize || 'normal';
    if (chkVoice) chkVoice.checked = !!this.currentUser.voiceAlerts;
  },

  // Leitura de voz do painel
  triggerVoiceRead() {
    const dtcs = this.currentVehicle ? window.DB.getVehicleDTCs(this.currentVehicle.id) : [];
    window.Speech.readFullDashboard(window.OBD.status === 'connected' ? window.OBD.data : null, this.currentVehicle, dtcs);
  },

  toggleSeniorModeQuick() {
    if (!this.currentUser) return;
    const newStatus = !this.currentUser.seniorMode;
    const updates = {
      seniorMode: newStatus,
      highContrast: newStatus,
      fontSize: newStatus ? 'xlarge' : 'normal',
      voiceAlerts: true
    };
    
    this.currentUser = window.DB.updateUser(this.currentUser.id, updates);
    this.applyAccessibilityPreferences();

    if (window.Speech) {
      window.Speech.beep('click');
      window.Speech.speak(newStatus ? 'Modo Sênior ativado com letras grandes e alto contraste.' : 'Modo padrão ativado.');
    }
  },

  // === LISTENERS DO SISTEMA OBD ===
  setupOBDListeners() {
    const obd = window.OBD;

    // Atualização contínua de telemetria
    obd.on('telemetry', (data) => {
      this.updateTelemetryUI(data);
    });

    // Mudança de status da conexão
    obd.on('statusChange', (status) => {
      this.updateConnectionStatusUI(status);
    });

    // Logs OBD no terminal
    obd.on('dtcDetected', (code) => {
      if (!this.currentVehicle) return;
      window.DB.addDtcToVehicle(this.currentVehicle.id, code);
      this.currentVehicle = window.DB.getVehicleById(this.currentVehicle.id);
      this.renderDiagnostics();
      window.Speech.beep('warning');
      this.toast(`Nova falha detectada pela ECU: ${code}`, 'error');
      if (this.currentUser && this.currentUser.voiceAlerts) window.Speech.speak('Atenção: o computador de bordo detectou uma nova falha no motor.');
    });
    obd.on('vehicleUpdated', (veh) => { this.currentVehicle = veh; this.renderCurrentVehicle(); this.renderMaintenance(); });
    obd.on('tripEnded', () => { this.renderMaintenance(); this.toast('Viagem salva no histórico.', 'success'); });
    obd.on('log', (entry) => {
      this.appendTerminalLog(entry);
    });
  },

  updateConnectionStatusUI(status) {
    const pill = document.getElementById('obd-status-pill');
    const textEl = document.getElementById('obd-status-text');
    const btnConnect = document.getElementById('btn-toggle-connect');

    if (!pill || !textEl || !btnConnect) return;

    pill.className = `obd-status-pill status-${status}`;

    if (status === 'connected') {
      textEl.textContent = 'OBD Online';
      btnConnect.innerHTML = '🔌 Desconectar';
      btnConnect.classList.add('btn-obd-disconnect');
    } else if (status === 'connecting') {
      textEl.textContent = 'Conectando...';
      btnConnect.innerHTML = '⏳ Conectando...';
      btnConnect.classList.remove('btn-obd-disconnect');
    } else {
      textEl.textContent = 'OBD Offline';
      btnConnect.innerHTML = '⚡ Conectar ao Carro';
      btnConnect.classList.remove('btn-obd-disconnect');
    }
  },

  updateTelemetryUI(data) {
    // 1. Atualizar Agulhas / Canvas
    if (this.gauges) {
      this.gauges.update(data.speed, data.rpm);
    }

    // 2. Atualizar Cartões Padrão
    this.setText('stat-speed-val', Math.round(data.speed));
    this.setText('stat-rpm-val', Math.round(data.rpm));
    this.setText('stat-temp-val', Math.round(data.coolantTemp));
    this.setText('stat-fuel-val', Math.round(data.fuelLevel));
    this.setText('stat-battery-val', data.batteryVoltage.toFixed(1));
    this.setText('stat-oil-val', data.oilPressure);
    this.setText('stat-consumption-val', data.instantConsumption.toFixed(1));
    this.setText('stat-throttle-val', Math.round(data.throttle));

    const autonomy = Math.round(data.fuelLevel / 100 * ((this.currentVehicle && this.currentVehicle.tankCapacityLiters) || 50) * 11);
    this.setText('stat-fuel-status', `Autonomia: ~${autonomy} km`);

    // Barra de Combustível
    const fuelFill = document.getElementById('fuel-bar-fill');
    if (fuelFill) {
      fuelFill.style.width = `${Math.min(100, Math.max(0, data.fuelLevel))}%`;
      fuelFill.style.background = data.fuelLevel <= 15 ? '#ef4444' : (data.fuelLevel <= 30 ? '#f59e0b' : '#10b981');
    }

    // Barra de Temperatura
    const tempFill = document.getElementById('temp-bar-fill');
    if (tempFill) {
      const tempPercent = Math.min(100, Math.max(0, ((data.coolantTemp - 60) / 60) * 100));
      tempFill.style.width = `${tempPercent}%`;
      tempFill.style.background = data.coolantTemp >= 105 ? '#ef4444' : (data.coolantTemp >= 98 ? '#f59e0b' : '#00f2fe');
    }

    // Status da Temperatura
    const tempStatusEl = document.getElementById('stat-temp-status');
    if (tempStatusEl) {
      if (data.coolantTemp > 105) {
        tempStatusEl.textContent = 'Superaquecimento!';
        tempStatusEl.className = 'stat-status status-danger';
      } else if (data.coolantTemp > 98) {
        tempStatusEl.textContent = 'Acima do ideal';
        tempStatusEl.className = 'stat-status status-warn';
      } else {
        tempStatusEl.textContent = 'Normal (Ideal 90°C)';
        tempStatusEl.className = 'stat-status status-ok';
      }
    }

    // 3. Atualizar HUD Sênior (Modo Acessível)
    this.setText('senior-speed-val', Math.round(data.speed));
    
    // Status de velocidade para idosos
    const seniorSpeedTag = document.getElementById('senior-speed-tag');
    if (seniorSpeedTag) {
      if (data.speed === 0) {
        seniorSpeedTag.textContent = 'VEÍCULO PARADO';
        seniorSpeedTag.className = 'senior-status-tag';
      } else if (data.speed <= 60) {
        seniorSpeedTag.textContent = 'VELOCIDADE SEGURA';
        seniorSpeedTag.className = 'senior-status-tag';
      } else if (data.speed <= 90) {
        seniorSpeedTag.textContent = 'RODOVIA / CRUZEIRO';
        seniorSpeedTag.className = 'senior-status-tag warn';
      } else {
        seniorSpeedTag.textContent = 'ATENÇÃO: ALTA VELOCIDADE';
        seniorSpeedTag.className = 'senior-status-tag danger';
      }
    }

    // Combustível no HUD Sênior
    const seniorFuelText = document.getElementById('senior-fuel-status');
    if (seniorFuelText) {
      if (data.fuelLevel <= 15) {
        seniorFuelText.textContent = 'RESERVA!';
        seniorFuelText.style.color = '#ff3333';
      } else if (data.fuelLevel <= 40) {
        seniorFuelText.textContent = `${Math.round(data.fuelLevel)}% (Abastecer)`;
        seniorFuelText.style.color = '#ffe600';
      } else {
        seniorFuelText.textContent = `${Math.round(data.fuelLevel)}% (Tranquilo)`;
        seniorFuelText.style.color = '#00e676';
      }
    }

    // Temperatura no HUD Sênior
    const seniorTempText = document.getElementById('senior-temp-status');
    if (seniorTempText) {
      if (data.coolantTemp > 105) {
        seniorTempText.textContent = 'MUITO QUENTE! PARE';
        seniorTempText.style.color = '#ff3333';
      } else {
        seniorTempText.textContent = 'MOTOR NORMAL';
        seniorTempText.style.color = '#00e676';
      }
    }

    // Bateria no HUD Sênior
    const seniorBatText = document.getElementById('senior-battery-status');
    if (seniorBatText) {
      seniorBatText.textContent = data.batteryVoltage >= 12.4 ? '100% BOA' : 'VERIFICAR';
      seniorBatText.style.color = data.batteryVoltage >= 12.4 ? '#00e676' : '#ffe600';
    }

    // 4. Banner de Alerta Check Engine (MIL)
    this.refreshMIL();

    // 5. Alertas de voz automáticos (com throttle de 15 segundos para não incomodar)
    const now = Date.now();
    if (this.currentUser && this.currentUser.voiceAlerts && (now - this.lastSpokenAlertTime > 15000)) {
      if (data.coolantTemp >= 108) {
        window.Speech.speak('Aviso urgente: temperatura do motor muito alta. Encoste em local seguro.');
        this.lastSpokenAlertTime = now;
      } else if (data.speed > 110) {
        window.Speech.speak('Atenção: velocidade alta. Reduza com calma.');
        this.lastSpokenAlertTime = now;
      } else if (data.fuelLevel <= 12 && data.fuelLevel > 0) {
        window.Speech.speak('Aviso: combustível na reserva. Procure um posto de combustível.');
        this.lastSpokenAlertTime = now;
      }
    }
  },

  refreshMIL() {
    const milBanner = document.getElementById('mil-alert-banner');
    if (!milBanner) return;
    const n = this.currentVehicle ? window.DB.getVehicleDTCs(this.currentVehicle.id).length : 0;
    milBanner.style.display = (window.OBD.status === 'connected' && n > 0) ? 'flex' : 'none';
  },

  setText(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  },

  appendTerminalLog(entry) {
    const box = document.getElementById('terminal-box');
    if (!box) return;

    const line = document.createElement('div');
    line.className = `terminal-line ${entry.type || 'info'}`;
    line.textContent = `[${entry.timestamp}] ${entry.message}`;

    box.appendChild(line);
    box.scrollTop = box.scrollHeight;
  },

  // === RENDERIZAÇÃO DAS SEÇÕES ===
  renderCurrentVehicle() {
    const veh = this.currentVehicle;
    if (!veh) return;

    this.setText('veh-title-name', `${veh.make} ${veh.model}`);
    this.setText('veh-plate-text', veh.plate);
    this.setText('veh-year-fuel', `${veh.year} • ${veh.fuelType} • ${veh.color}`);
    this.setText('veh-odometer-text', `${veh.currentOdometerKm.toLocaleString('pt-BR')} km`);

    // Atualizar também na aba de diagnóstico e perfil
    this.setText('diag-veh-name', `${veh.make} ${veh.model} (${veh.plate})`);
    this.setText('diag-protocol-text', veh.protocol);
    this.setText('diag-vin-text', veh.vin);
  },

  renderDiagnostics() {
    if (!this.currentVehicle) return;

    const dtcs = window.DB.getVehicleDTCs(this.currentVehicle.id);
    const container = document.getElementById('dtc-results-list');
    const badge = document.getElementById('dtc-count-badge');
    const navBadge = document.getElementById('nav-dtc-badge');

    if (badge) badge.textContent = `${dtcs.length} ${dtcs.length === 1 ? 'Falha' : 'Falhas'}`;
    if (navBadge) {
      navBadge.textContent = dtcs.length;
      navBadge.style.display = dtcs.length > 0 ? 'inline-block' : 'none';
    }

    const sd = document.getElementById('senior-diag-status');
    if (sd) { sd.textContent = dtcs.length ? 'VER AVISOS' : 'SEGURO'; sd.style.color = dtcs.length ? '#ffe600' : '#00e676'; }
    this.refreshMIL();
    if (!container) return;

    if (dtcs.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: 30px; background: rgba(16, 185, 129, 0.08); border: 1px dashed rgba(16, 185, 129, 0.3); border-radius: 14px;">
          <div style="font-size: 2.5rem; margin-bottom: 8px;">✅</div>
          <h4 style="color: #34d399; font-size: 1.1rem; margin-bottom: 4px;">Nenhum Código de Falha Encontrado!</h4>
          <p style="color: #9ca3af; font-size: 0.85rem;">Todos os sistemas e sensores da injeção eletrônica e barramento CAN estão operando normalmente.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = dtcs.map(dtc => `
      <div class="dtc-card sev-${dtc.severity}">
        <div class="dtc-header">
          <span class="dtc-code-badge">${dtc.code}</span>
          <span class="dtc-sev-badge">Gravidade ${dtc.severity}</span>
        </div>
        <div class="dtc-title">${esc(dtc.title)}</div>
        
        <div class="dtc-senior-box">
          <strong>👴 Entendendo em Português Simples:</strong>
          ${esc(dtc.seniorSummary)}
        </div>

        <div class="dtc-tech-desc">
          <strong>Detalhe da ECU:</strong> ${esc(dtc.technicalDescription)}
        </div>

        <div class="dtc-solution">
          <span>🔧</span>
          <span><strong>O que fazer:</strong> ${esc(dtc.recommendedAction)}</span>
        </div>
      </div>
    `).join('');
  },

  renderMaintenance() {
    if (!this.currentVehicle) return;

    const items = window.DB.getMaintenance(this.currentVehicle.id);
    const trips = window.DB.getTrips(this.currentVehicle.id);

    const maintContainer = document.getElementById('maintenance-list');
    if (maintContainer) {
      maintContainer.innerHTML = !items.length ? '<p style="color:#9ca3af;font-size:.85rem">Nenhum item de manutenção cadastrado para este veículo.</p>' : items.map(m => {
        const remaining = m.nextDueKm - this.currentVehicle.currentOdometerKm;
        const isUrgent = remaining <= m.intervalKm * 0.2;
        return `
          <div class="card" style="margin-bottom: 10px; border-left: 4px solid ${isUrgent ? '#ef4444' : '#10b981'};">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
              <strong style="color: #fff; font-size: 0.95rem;">${esc(m.item)}</strong>
              <span style="font-size: 0.75rem; padding: 2px 8px; border-radius: 999px; background: ${isUrgent ? 'rgba(239,68,68,0.2)' : 'rgba(16,185,129,0.2)'}; color: ${isUrgent ? '#f87171' : '#34d399'};">
                ${remaining <= 0 ? 'Vencido' : isUrgent ? 'Vencendo em breve' : 'Em dia'}
              </span>
            </div>
            <div style="font-size: 0.8rem; color: #9ca3af;">
              Próxima troca em: <strong style="color: #fff;">${m.nextDueKm.toLocaleString()} km</strong> (Faltam ${remaining.toLocaleString()} km)
            </div>
            <div style="font-size: 0.75rem; color: #6b7280; margin-top: 4px;">
              ${esc(m.recommendation)}
            </div>
            <button class="btn-action-icon" style="margin-top:8px;" onclick="App.completeMaintenance('${m.id}')">✅ Marcar como feita</button>
          </div>
        `;
      }).join('');
    }

    const tripsContainer = document.getElementById('trips-history-list');
    if (tripsContainer) {
      tripsContainer.innerHTML = !trips.length ? '<p style="color:#9ca3af;font-size:.85rem">Nenhuma viagem ainda. Conecte ao carro e desconecte para registrar uma.</p>' : trips.map(t => `
        <div class="card" style="margin-bottom: 10px; padding: 12px;">
          <div style="display: flex; justify-content: space-between; font-size: 0.8rem; color: #9ca3af; margin-bottom: 4px;">
            <span>${new Date(t.date).toLocaleDateString('pt-BR')} às ${new Date(t.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
            <span style="color: #00f2fe; font-weight: bold;">Score Condução: ${t.smoothDrivingScore}/100</span>
          </div>
          <div style="font-weight: 700; color: #fff; font-size: 0.9rem; margin-bottom: 4px;">
            📍 ${esc(t.origin)} ➔ ${esc(t.destination)}
          </div>
          <div style="display: flex; gap: 14px; font-size: 0.78rem; color: #d1d5db;">
            <span>📏 ${t.distanceKm} km</span>
            <span>⏱️ ${t.durationMinutes} min</span>
            <span>⚡ Média ${t.avgSpeedKmH} km/h</span>
            <span>⛽ ${t.avgFuelConsumptionKmL} km/L</span>
          </div>
        </div>
      `).join('');
    }
  },

  renderAdminPanel() {
    if (!this.currentUser || this.currentUser.role !== 'admin') return;

    const users = window.DB.getUsers();
    const vehicles = window.DB.getVehicles();
    const trips = window.DB.getTrips();

    let totalDtcs = 0;
    vehicles.forEach(v => {
      totalDtcs += (v.activeDtcCodes || []).length;
    });

    const seniorCount = users.filter(u => u.seniorMode || u.age >= 60).length;

    // Métricas
    this.setText('adm-total-users', users.length);
    this.setText('adm-total-vehicles', vehicles.length);
    this.setText('adm-total-dtcs', totalDtcs);
    this.setText('adm-senior-users', seniorCount);

    // Tabela de Usuários
    const tbody = document.getElementById('admin-users-tbody');
    if (!tbody) return;

    tbody.innerHTML = users.map(u => {
      const uVehicles = vehicles.filter(v => v.userId === u.id);
      const vehSummary = uVehicles.map(v => `${esc(v.make)} ${esc(v.model)} (${esc(v.plate)})`).join(', ') || 'Nenhum';
      const dtcCount = uVehicles.reduce((acc, v) => acc + (v.activeDtcCodes || []).length, 0);

      return `
        <tr>
          <td>
            <div style="font-weight: 700; color: #fff;">${esc(u.name)}</div>
            <div style="font-size: 0.75rem; color: #9ca3af;">${esc(u.email)}</div>
          </td>
          <td>
            <span style="padding: 2px 8px; border-radius: 999px; font-size: 0.7rem; font-weight: bold; background: ${u.role === 'admin' ? 'rgba(139,92,246,0.2)' : 'rgba(0,242,254,0.15)'}; color: ${u.role === 'admin' ? '#a78bfa' : '#38bdf8'};">
              ${u.role.toUpperCase()}
            </span>
          </td>
          <td>${u.age} anos</td>
          <td>
            <div style="font-size: 0.8rem; color: #fff;">${esc(vehSummary)}</div>
            ${dtcCount > 0 ? `<span style="font-size: 0.7rem; color: #f87171;">⚠️ ${dtcCount} falha(s) ativa(s)</span>` : '<span style="font-size: 0.7rem; color: #34d399;">Sem falhas</span>'}
          </td>
          <td>
            <span style="padding: 2px 8px; border-radius: 999px; font-size: 0.7rem; font-weight: bold; background: ${u.status === 'active' ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}; color: ${u.status === 'active' ? '#34d399' : '#f87171'};">
              ${u.status === 'active' ? 'Ativo' : 'Bloqueado'}
            </span>
          </td>
          <td>
            <button class="btn-action-icon" title="Ver Detalhes" onclick="App.viewUserDetails('${u.id}')">🔍 Ver</button>
            <button class="btn-action-icon" title="Alternar Status" onclick="App.toggleUserStatus('${u.id}')">${u.status === 'active' ? '⛔ Bloquear' : '✅ Ativar'}</button>
            ${u.role !== 'admin' ? `<button class="btn-action-icon" style="color: #f87171;" title="Excluir" onclick="App.deleteUserAccount('${u.id}')">🗑️</button>` : ''}
          </td>
        </tr>
      `;
    }).join('');
  },

  // === EVENTOS E INTERAÇÃO ===
  bindEvents() {
    document.querySelectorAll('.modal-overlay').forEach(m => {
      m.setAttribute('role', 'dialog'); m.setAttribute('aria-modal', 'true');
      m.addEventListener('click', e => { if (e.target === m) m.classList.remove('active'); });
    });
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') document.querySelectorAll('.modal-overlay.active').forEach(m => m.classList.remove('active'));
    });

    // 1. Navegação de Abas
    document.querySelectorAll('.nav-tab-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const tab = btn.dataset.tab;
        this.switchTab(tab);
      });
    });

    // 2. Conexão OBD
    const btnConnect = document.getElementById('btn-toggle-connect');
    if (btnConnect) {
      btnConnect.addEventListener('click', () => {
        if (window.OBD.status === 'connected') {
          window.OBD.disconnect();
        } else {
          if (!this.currentVehicle) { this.toast('Esta conta não tem veículo cadastrado.', 'error'); return; }
          window.OBD.connect(this.currentVehicle).then(ok => { if (ok) window.Speech.beep('connected'); });
        }
      });
    }

    // 3. Seletor de Simulação de Trânsito
    const presetSelect = document.getElementById('preset-selector');
    if (presetSelect) {
      presetSelect.addEventListener('change', (e) => {
        window.OBD.setPreset(e.target.value);
      });
    }

    // 4. Botão de Leitura de Status por Voz
    const btnVoice = document.getElementById('btn-voice-read');
    if (btnVoice) {
      btnVoice.addEventListener('click', () => {
        this.triggerVoiceRead();
      });
    }

    // 5. Botão Rápido Modo Sênior no Topo
    const btnSenior = document.getElementById('btn-toggle-senior');
    if (btnSenior) {
      btnSenior.addEventListener('click', () => {
        this.toggleSeniorModeQuick();
      });
    }

    // 6. Botão Rápido SOS de Emergência
    const btnSos = document.getElementById('btn-quick-sos');
    if (btnSos) {
      btnSos.addEventListener('click', () => {
        this.openEmergencySOS();
      });
    }

    // 7. Botão do Usuário (Troca de conta / Login)
    const userBadge = document.getElementById('user-badge');
    if (userBadge) {
      userBadge.addEventListener('click', () => {
        this.showModal('account-switch-modal');
      });
    }

    // 8. Botão de Escanear DTC
    const btnScanDtc = document.getElementById('btn-scan-dtc');
    if (btnScanDtc) {
      btnScanDtc.addEventListener('click', async () => {
        if (!this.currentVehicle) return;
        if (window.OBD.status !== 'connected') { this.toast('Conecte ao carro primeiro (aba Painel OBD).', 'error'); return; }
        btnScanDtc.disabled = true;
        btnScanDtc.textContent = '🔍 Realizando Varredura ECU...';
        await window.OBD.scanDTCs(this.currentVehicle.id);
        this.renderDiagnostics();
        btnScanDtc.disabled = false;
        btnScanDtc.textContent = '🔄 Escanear Novamente';
        window.Speech.beep('success');
      });
    }

    // 9. Botão de Limpar DTC
    const btnClearDtc = document.getElementById('btn-clear-dtc');
    if (btnClearDtc) {
      btnClearDtc.addEventListener('click', async () => {
        if (!this.currentVehicle) return;
        if (window.OBD.status !== 'connected') { this.toast('Conecte ao carro primeiro (aba Painel OBD).', 'error'); return; }
        if (confirm('Deseja realmente apagar os códigos da ECU e reiniciar a luz de injeção?')) {
          btnClearDtc.disabled = true;
          await window.OBD.clearDTCs(this.currentVehicle.id);
          this.renderDiagnostics();
          btnClearDtc.disabled = false;
          window.Speech.beep('success');
          this.refreshMIL();
          App.toast('Códigos de falha apagados com sucesso!', 'success');
        }
      });
    }

    // 10. Alternar Modo de Visualização (Frame Mobile vs Fullscreen Web)
    const btnToggleMobile = document.getElementById('btn-toggle-device-mode');
    if (btnToggleMobile) {
      btnToggleMobile.addEventListener('click', () => {
        const frame = document.getElementById('device-container');
        if (frame) {
          const isFullscreen = frame.classList.toggle('device-fullscreen');
          btnToggleMobile.textContent = isFullscreen ? '📱 Modo Celular (Moldura)' : '💻 Modo Tela Cheia (Web)';
        }
      });
    }
  },

  switchTab(tabId) {
    this.activeTab = tabId;
    window.Speech.beep('click');

    // Atualizar botões de aba
    document.querySelectorAll('.nav-tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tabId);
    });

    // Atualizar seções
    document.querySelectorAll('.view-section').forEach(sec => {
      sec.classList.remove('active');
    });

    const targetSec = document.getElementById(`view-${tabId}`);
    if (targetSec) {
      targetSec.classList.add('active');
    }

    // Redimensionar canvas caso mude para o dashboard
    if (tabId === 'dashboard' && this.gauges) {
      setTimeout(() => {
        if (this.gauges.speedCanvas) this.gauges.adjustCanvasResolution(this.gauges.speedCanvas);
        if (this.gauges.rpmCanvas) this.gauges.adjustCanvasResolution(this.gauges.rpmCanvas);
      }, 50);
    }

    // Se mudou para admin, atualizar tabela
    if (tabId === 'admin') {
      this.renderAdminPanel();
    }
  },

  // === MODAL MANAGEMENT ===
  showModal(id) {
    const el = document.getElementById(id);
    if (el) el.classList.add('active');
  },

  closeModal(id) {
    const el = document.getElementById(id);
    if (el) el.classList.remove('active');
  },

  // Login Rápido de Demonstração
  quickLogin(email) {
    const user = window.DB.getUserByEmail(email);
    if (user && user.status === 'suspended') { this.toast('Esta conta está bloqueada pelo administrador.', 'error'); return; }
    if (user) {
      this.setCurrentUser(user);
      this.closeModal('login-modal');
      this.closeModal('account-switch-modal');
      window.Speech.beep('success');
      App.toast(`Conectado com sucesso como: ${esc(user.name)}`);
    }
  },

  // Processar Formulário de Login Tradicional
  handleLoginSubmit(e) {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const pass = document.getElementById('login-password').value;

    const user = window.DB.getUserByEmail(email);
    if (user && user.password === pass) {
      if (user.status === 'suspended') {
        App.toast('Esta conta está bloqueada pelo administrador.');
        return;
      }
      this.setCurrentUser(user);
      this.closeModal('login-modal');
      window.Speech.beep('success');
    } else {
      App.toast('E-mail ou senha incorretos.');
      window.Speech.beep('warning');
    }
  },

  // Processar Formulário de Cadastro
  handleRegisterSubmit(e) {
    e.preventDefault();
    const name = document.getElementById('reg-name').value;
    const email = document.getElementById('reg-email').value;
    const pass = document.getElementById('reg-password').value;
    const age = parseInt(document.getElementById('reg-age').value, 10);
    const phone = document.getElementById('reg-phone').value;
    const emName = document.getElementById('reg-em-name').value;
    const emPhone = document.getElementById('reg-em-phone').value;

    const make = document.getElementById('reg-car-make').value;
    const model = document.getElementById('reg-car-model').value;
    const year = document.getElementById('reg-car-year').value;
    const plate = document.getElementById('reg-car-plate').value;

    try {
      const newUser = window.DB.createUser({
        name,
        email,
        password: pass,
        age,
        phone,
        emergencyContact: {
          name: emName || 'Contato de Emergência',
          phone: emPhone || '190'
        },
        seniorMode: age >= 60,
        vehicle: {
          make,
          model,
          year,
          plate
        }
      });

      this.setCurrentUser(newUser);
      this.closeModal('register-modal');
      window.Speech.beep('success');
      App.toast('Conta e Veículo criados com sucesso!');
    } catch (err) {
      App.toast(err.message);
    }
  },

  // Emergência SOS
  openEmergencySOS() {
    const user = this.currentUser;
    const veh = this.currentVehicle;
    const emContact = user ? user.emergencyContact : { name: 'Familiar', phone: '(11) 99999-9999' };

    this.setText('sos-contact-name', emContact.name);
    this.setText('sos-contact-phone', emContact.phone);
    this.setText('sos-veh-info', veh ? `${veh.make} ${veh.model} (${veh.plate})` : 'Veículo não cadastrado');

    this.showModal('sos-modal');
    window.Speech.beep('danger');
    if (user && user.voiceAlerts) {
      window.Speech.speak('Tela de emergência aberta. Escolha ligar para o contato familiar, chamar guincho ou serviços de emergência.');
    }
  },

  triggerEmergencyCall(number) {
    const digits = String(number).replace(/[^\d+]/g, '');
    if (!digits) { this.toast('Número não cadastrado.', 'error'); return; }
    this.toast(`Ligando para ${number}...`);
    window.location.href = 'tel:' + digits;
  },

  callTow() {
    let phone = this.currentUser && this.currentUser.towPhone;
    if (!phone) {
      phone = prompt('Digite o telefone do guincho / seguradora (será salvo):');
      if (!phone) return;
      this.currentUser = window.DB.updateUser(this.currentUser.id, { towPhone: phone });
    }
    this.triggerEmergencyCall(phone);
  },

  toggleAllInstruments() {
    document.body.classList.toggle('show-all-instruments');
    window.Speech.beep('click');
  },

  importDatabaseBackup(input) {
    const file = input.files && input.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try { window.DB.importJSON(reader.result); location.reload(); }
      catch (e) { this.toast('Arquivo de backup inválido.', 'error'); }
    };
    reader.readAsText(file);
  },

  completeMaintenance(id) {
    window.DB.completeMaintenance(id);
    this.renderMaintenance();
    window.Speech.beep('success');
    this.toast('Manutenção registrada!', 'success');
  },

  sendWhatsAppSOS() {
    const user = this.currentUser;
    const veh = this.currentVehicle;
    const speed = Math.round(window.OBD.status === 'connected' ? window.OBD.data.speed : 0);
    const msg = `🚨 ALERTA AUTOSENSE SOS:\nOlá! Estou precisando de assistência com o veículo ${veh ? veh.make + ' ' + veh.model + ' (Placa: ' + veh.plate + ')' : 'meu carro'}.\nVelocidade atual: ${speed} km/h.\nPor favor entre em contato!`;
    const open = (loc) => window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(msg + loc)}`, '_blank');
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        p => open(`\nMinha localização: https://maps.google.com/?q=${p.coords.latitude},${p.coords.longitude}`),
        () => open('\n(Localização indisponível)'), { timeout: 5000 });
    } else open('');
  },

  // Funções Administrativas
  viewUserDetails(userId) {
    const user = window.DB.getUserById(userId);
    if (!user) return;

    const vehicles = window.DB.getVehicles(userId);
    const trips = window.DB.getTrips();
    const userTrips = trips.filter(t => vehicles.some(v => v.id === t.vehicleId));

    const content = `
      <div style="font-size: 0.9rem;">
        <h3 style="color: #00f2fe; margin-bottom: 12px;">👤 ${esc(user.name)}</h3>
        <p><strong>E-mail:</strong> ${esc(user.email)}</p>
        <p><strong>Telefone:</strong> ${esc(user.phone || 'Não informado')}</p>
        <p><strong>Idade:</strong> ${user.age} anos (${user.seniorMode ? '👴 Modo Sênior Ativo' : 'Padrão'})</p>
        <p><strong>Status:</strong> ${user.status.toUpperCase()}</p>
        <p><strong>Contato Emergência:</strong> ${esc(user.emergencyContact.name)} (${esc(user.emergencyContact.phone)})</p>
        
        <hr style="border: 0; border-top: 1px solid rgba(255,255,255,0.1); margin: 12px 0;">
        
        <h4 style="color: #ffd200; margin-bottom: 8px;">🚗 Veículos Cadastrados (${vehicles.length}):</h4>
        ${vehicles.map(v => `
          <div style="background: rgba(255,255,255,0.05); padding: 8px; border-radius: 6px; margin-bottom: 6px;">
            <strong>${esc(v.make)} ${esc(v.model)}</strong> (${v.year})<br>
            Placa: <code>${esc(v.plate)}</code> | Km: ${v.currentOdometerKm.toLocaleString()} km<br>
            Falhas OBD ativas: ${v.activeDtcCodes && v.activeDtcCodes.length > 0 ? `<span style="color: #f87171;">${v.activeDtcCodes.join(', ')}</span>` : 'Nenhuma'}
          </div>
        `).join('')}

        <p style="margin-top: 10px;"><strong>Total de viagens registradas:</strong> ${userTrips.length}</p>
      </div>
    `;

    const modalBody = document.getElementById('user-detail-modal-body');
    if (modalBody) modalBody.innerHTML = content;
    this.showModal('user-detail-modal');
  },

  toggleUserStatus(userId) {
    const u = window.DB.getUserById(userId);
    if (u && (u.role === 'admin' || (this.currentUser && u.id === this.currentUser.id))) { this.toast('Não é possível bloquear esta conta.', 'error'); return; }
    window.DB.toggleUserStatus(userId);
    this.renderAdminPanel();
    window.Speech.beep('click');
  },

  deleteUserAccount(userId) {
    if (confirm('Tem certeza de que deseja remover permanentemente este usuário e seu veículo?')) {
      try {
        window.DB.deleteUser(userId);
        this.renderAdminPanel();
        App.toast('Usuário removido com sucesso.');
      } catch (e) {
        App.toast(e.message);
      }
    }
  },

  // Simulação de Adicionar Falha para Testes
  simulateAddFault(code) {
    if (!this.currentVehicle) return;
    window.DB.addDtcToVehicle(this.currentVehicle.id, code);
    if (window.OBD.sim) window.OBD.sim.codes.push(code);
    this.renderDiagnostics();
    window.Speech.beep('warning');
    App.toast(`Código de falha ${code} injetado na ECU com sucesso!`);
  },

  exportDatabaseBackup() {
    const json = window.DB.exportJSON();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `autosense_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  },

  resetDatabase() {
    if (confirm('Atenção: Todos os dados serão restaurados para a configuração inicial de demonstração. Deseja continuar?')) {
      window.DB.resetToDefault();
      location.reload();
    }
  }
};

// Iniciar quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});

window.App = App;
