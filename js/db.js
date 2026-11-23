/**
 * AutoSense - Database Module (Integrado com API Node.js + MySQL)
 */

const DB_KEY = 'autosense_database_v1';
const API_URL = 'http://localhost:3001/api';

const SEED_DATA = {
  users: [
    {
      id: 'usr_admin',
      name: 'Administrador do Sistema',
      email: 'admin@autosense.com',
      password: 'admin',
      role: 'admin',
      age: 38,
      phone: '(11) 98765-4321',
      emergencyContact: { name: 'Suporte Técnico AutoSense', phone: '0800-777-8000', relation: 'Central 24h' },
      seniorMode: false, fontSize: 'normal', highContrast: false, voiceAlerts: true,
      status: 'active', createdAt: '2026-01-10T10:00:00Z', lastLogin: '2026-10-27T21:00:00Z'
    },
    {
      id: 'usr_senior_joao',
      name: 'Sr. João da Silva',
      email: 'seu.joao@autosense.com',
      password: '123',
      role: 'user',
      age: 71,
      phone: '(11) 99123-5566',
      emergencyContact: { name: 'Carlos da Silva (Filho)', phone: '(11) 99887-1122', relation: 'Filho' },
      seniorMode: true, fontSize: 'xlarge', highContrast: true, voiceAlerts: true,
      status: 'active', createdAt: '2026-02-15T14:30:00Z', lastLogin: '2026-10-27T18:45:00Z'
    },
    {
      id: 'usr_mariana',
      name: 'Mariana Oliveira',
      email: 'mariana@autosense.com',
      password: '123',
      role: 'user',
      age: 29,
      phone: '(21) 98844-3322',
      emergencyContact: { name: 'Roberto Oliveira (Pai)', phone: '(21) 97755-9988', relation: 'Pai' },
      seniorMode: false, fontSize: 'normal', highContrast: false, voiceAlerts: false,
      status: 'active', createdAt: '2026-04-12T09:15:00Z', lastLogin: '2026-10-26T16:20:00Z'
    },
    {
      id: 'usr_dona_maria',
      name: 'Dona Maria Helena',
      email: 'dona.maria@autosense.com',
      password: '123',
      role: 'user',
      age: 68,
      phone: '(31) 98711-2233',
      emergencyContact: { name: 'Ana Luiza (Filha)', phone: '(31) 99222-3344', relation: 'Filha' },
      seniorMode: true, fontSize: 'large', highContrast: false, voiceAlerts: true,
      status: 'active', createdAt: '2026-05-20T11:00:00Z', lastLogin: '2026-10-25T10:10:00Z'
    }
  ],

  vehicles: [
    {
      id: 'veh_corolla_joao',
      userId: 'usr_senior_joao',
      make: 'Toyota', model: 'Corolla XEi 2.0', year: 2021, plate: 'BRA2E19',
      color: 'Prata', fuelType: 'Flex', tankCapacityLiters: 50, currentOdometerKm: 42180,
      protocol: 'ISO 15765-4 CAN (11 bit, 500 kbaud)', vin: '9BRBL42EXN0198421',
      batteryStatus: 'Boa (12.6V)', tirePressureBar: 2.2, activeDtcCodes: ['P0115'],
      createdAt: '2026-02-15T14:35:00Z'
    },
    {
      id: 'veh_civic_mariana',
      userId: 'usr_mariana',
      make: 'Honda', model: 'Civic Touring 1.5 Turbo', year: 2022, plate: 'RIO4A22',
      color: 'Branco Perolizado', fuelType: 'Gasolina', tankCapacityLiters: 56, currentOdometerKm: 28400,
      protocol: 'ISO 15765-4 CAN (29 bit, 500 kbaud)', vin: '93HFC1640NZ034112',
      batteryStatus: 'Excelente (12.8V)', tirePressureBar: 2.3, activeDtcCodes: [],
      createdAt: '2026-04-12T09:20:00Z'
    },
    {
      id: 'veh_onix_maria',
      userId: 'usr_dona_maria',
      make: 'Chevrolet', model: 'Onix Plus Premier 1.0 Turbo', year: 2023, plate: 'BHZ8J90',
      color: 'Azul Seeker', fuelType: 'Flex', tankCapacityLiters: 44, currentOdometerKm: 16750,
      protocol: 'ISO 15765-4 CAN (11 bit, 500 kbaud)', vin: '9BGKS69R0PG294011',
      batteryStatus: 'Excelente (12.7V)', tirePressureBar: 2.1, activeDtcCodes: ['P0300'],
      createdAt: '2026-05-20T11:05:00Z'
    }
  ],

  dtcLibrary: {
    'P0115': {
      code: 'P0115', system: 'Arrefecimento / Motor',
      title: 'Mau funcionamento do sensor de temperatura da água do motor', severity: 'Média',
      seniorSummary: 'O termômetro do motor pode não estar marcando certinho. O carro continua andando, mas leve para olhar em breve.',
      technicalDescription: 'Tensão do circuito do Sensor de Temperatura do Líquido de Arrefecimento (ECT) fora da faixa operacional recomendada.',
      possibleCauses: ['Sensor ECT desconectado ou danificado', 'Fiação com curto ou oxidação', 'Nível baixo de líquido refrigerante'],
      recommendedAction: 'Checar nível de água/aditivo no radiador e inspecionar conector do sensor ECT.'
    },
    'P0300': {
      code: 'P0300', system: 'Ignição / Cilindros',
      title: 'Falha de combustão aleatória / múltiplos cilindros', severity: 'Alta',
      seniorSummary: 'O motor está falhando ou engasgando de vez em quando. É melhor não acelerar muito e levar ao mecânico.',
      technicalDescription: 'Detecção de falhas de ignição (misfire) distribuídas em mais de um cilindro do motor.',
      possibleCauses: ['Velas de ignição desgastadas', 'Bobinas de ignição fracas', 'Bicos injetores sujos', 'Combustível adulterado'],
      recommendedAction: 'Substituição das velas de ignição e teste de estanqueidade dos bicos injetores.'
    },
    'P0301': {
      code: 'P0301', system: 'Ignição / Cilindro 1',
      title: 'Falha de combustão no Cilindro 1', severity: 'Alta',
      seniorSummary: 'Uma das velas ou peças de fogo do motor não está disparando bem.',
      technicalDescription: 'Sensor de rotação detectou variação de aceleração angular referente ao cilindro número 1.',
      possibleCauses: ['Vela do cilindro 1 queimada', 'Cabo de vela ou bobina 1 com fuga'],
      recommendedAction: 'Inspecionar vela e bobina do cilindro 1.'
    },
    'P0420': {
      code: 'P0420', system: 'Emissões / Escapamento',
      title: 'Eficiência do Catalisador abaixo do limite (Banco 1)', severity: 'Baixa',
      seniorSummary: 'O filtro de fumaça do escapamento (catalisador) está filtrando menos. O carro anda normalmente, mas polui mais.',
      technicalDescription: 'Sinal da sonda lambda pós-catalisador muito semelhante ao da pré-catalisador.',
      possibleCauses: ['Catalisador degradado', 'Sonda Lambda lenta', 'Vazamento no coletor de escape'],
      recommendedAction: 'Verificar integridade da sonda lambda e vazamentos na tubulação.'
    },
    'P0171': {
      code: 'P0171', system: 'Alimentação de Ar/Combustível',
      title: 'Mistura de combustível muito pobre (Excesso de ar)', severity: 'Média',
      seniorSummary: 'O motor está recebendo mais ar do que combustível.',
      technicalDescription: 'Ajuste de combustível de curto e longo prazo (Fuel Trim) atingiu o limite positivo de enriquecimento.',
      possibleCauses: ['Entrada falsa de ar no coletor', 'Sensor MAF sujo', 'Filtro de combustível entupido'],
      recommendedAction: 'Limpar sensor MAF e verificar mangueiras de vácuo do motor.'
    },
    'P0217': {
      code: 'P0217', system: 'Arrefecimento / Motor',
      title: 'Superaquecimento do motor', severity: 'Alta',
      seniorSummary: 'O motor está quente demais. Pare o carro em local seguro e desligue o motor.',
      technicalDescription: 'Temperatura do líquido de arrefecimento acima do limite máximo permitido.',
      possibleCauses: ['Falta de líquido de arrefecimento', 'Ventoinha ou válvula termostática com defeito', 'Bomba d\'água com falha'],
      recommendedAction: 'Parar imediatamente, aguardar esfriar e checar nível do radiador. Chamar guincho se persistir.'
    },
    'P0562': {
      code: 'P0562', system: 'Elétrica / Bateria',
      title: 'Tensão baixa no sistema elétrico', severity: 'Alta',
      seniorSummary: 'A bateria ou o alternador está fraco. O carro pode ter dificuldade de ligar.',
      technicalDescription: 'Módulo ECU detectou tensão de alimentação inferior a 10.0V durante o funcionamento.',
      possibleCauses: ['Alternador com defeito', 'Bateria velha ou descarregada', 'Correia do alternador frouxa'],
      recommendedAction: 'Testar carga da bateria e regulador de voltagem do alternador imediatamente.'
    }
  },

  maintenance: [
    { id: 'maint_1', vehicleId: 'veh_corolla_joao', item: 'Troca de Óleo e Filtro', intervalKm: 10000, lastChangeKm: 40000, nextDueKm: 50000, status: 'ok', recommendation: 'Usar óleo 0W-20 sintético original' },
    { id: 'maint_2', vehicleId: 'veh_corolla_joao', item: 'Pastilhas de Freio', intervalKm: 25000, lastChangeKm: 25000, nextDueKm: 50000, status: 'ok', recommendation: 'Inspecionar espessura nas revisões' },
    { id: 'maint_3', vehicleId: 'veh_corolla_joao', item: 'Filtro de Ar da Cabine (Ar Condicionado)', intervalKm: 15000, lastChangeKm: 30000, nextDueKm: 45000, status: 'warning', recommendation: 'Próximo do vencimento (faltam 2.820 km)' },
    { id: 'maint_4', vehicleId: 'veh_civic_mariana', item: 'Troca de Óleo e Filtro', intervalKm: 10000, lastChangeKm: 20000, nextDueKm: 30000, status: 'ok', recommendation: 'Óleo 0W-20 Sintético' }
  ],

  trips: [
    { id: 'trip_1', vehicleId: 'veh_corolla_joao', date: '2026-10-27T10:15:00Z', origin: 'Casa (Moema)', destination: 'Hospital / Consulta Médica', distanceKm: 8.4, durationMinutes: 22, avgSpeedKmH: 23, maxSpeedKmH: 58, avgFuelConsumptionKmL: 11.2, smoothDrivingScore: 94 },
    { id: 'trip_2', vehicleId: 'veh_corolla_joao', date: '2026-10-26T15:30:00Z', origin: 'Supermercado Pão de Açúcar', destination: 'Casa (Moema)', distanceKm: 4.1, durationMinutes: 14, avgSpeedKmH: 18, maxSpeedKmH: 45, avgFuelConsumptionKmL: 9.8, smoothDrivingScore: 98 },
    { id: 'trip_3', vehicleId: 'veh_civic_mariana', date: '2026-10-27T08:00:00Z', origin: 'Barra da Tijuca', destination: 'Centro do Rio', distanceKm: 26.5, durationMinutes: 48, avgSpeedKmH: 33, maxSpeedKmH: 92, avgFuelConsumptionKmL: 13.4, smoothDrivingScore: 88 }
  ],

  settings: {
    appVersion: '2.5.0',
    systemName: 'AutoSense OBD Smart Platform',
    obdProtocolSupport: ['ISO 15765-4 (CAN)', 'ISO 14230-4 (KWP2000)', 'ISO 9141-2', 'SAE J1850 PWM', 'SAE J1850 VPW'],
    seniorFeaturesEnabled: true
  }
};

const DB = {
  init() {
    try {
      const stored = localStorage.getItem(DB_KEY);
      if (!stored || !JSON.parse(stored).users) {
        this.saveAll(SEED_DATA);
      }
      this.syncFromMySQL();
    } catch (e) {
      console.error('AutoSense DB Init Error:', e);
    }
  },

  async syncFromMySQL() {
    try {
      const res = await fetch(`${API_URL}/sync`);
      if (!res.ok) return;
      const mysqlData = await res.json();
      const data = this.getAll();

      if (mysqlData.users && mysqlData.users.length > 0) {
        data.users = mysqlData.users.map(u => {
          const existing = data.users.find(x => x.email === u.email) || {};
          return {
            id: existing.id || `usr_mysql_${u.id}`,
            mysqlId: u.id,
            name: u.nome,
            email: u.email,
            password: existing.password || (u.perfil === 'ADMIN' ? 'admin' : '123'),
            role: u.perfil === 'ADMIN' ? 'admin' : 'user',
            age: existing.age || 45,
            phone: existing.phone || '(11) 99999-0000',
            emergencyContact: existing.emergencyContact || { name: 'Contato Emergência', phone: '190', relation: 'Familiar' },
            seniorMode: existing.seniorMode ?? false,
            fontSize: existing.fontSize || 'normal',
            highContrast: existing.highContrast ?? false,
            voiceAlerts: existing.voiceAlerts ?? true,
            status: existing.status || 'active',
            createdAt: u.criado_em || new Date().toISOString(),
            lastLogin: new Date().toISOString()
          };
        });
      }

      if (mysqlData.vehicles && mysqlData.vehicles.length > 0) {
        data.vehicles = mysqlData.vehicles.map(v => {
          const owner = data.users.find(u => u.mysqlId === v.usuario_id);
          const existing = data.vehicles.find(x => x.plate === v.placa) || {};
          let dtcs = [];
          if (v.dtc_codigos) {
            dtcs = typeof v.dtc_codigos === 'string' ? JSON.parse(v.dtc_codigos) : v.dtc_codigos;
          }
          return {
            id: existing.id || `veh_mysql_${v.id}`,
            mysqlId: v.id,
            userId: owner ? owner.id : 'usr_admin',
            make: v.marca,
            model: v.modelo,
            year: v.ano,
            plate: v.placa,
            color: existing.color || 'Prata',
            fuelType: existing.fuelType || 'Flex',
            tankCapacityLiters: existing.tankCapacityLiters || 50,
            currentOdometerKm: existing.currentOdometerKm || 25000,
            protocol: 'ISO 15765-4 CAN (11 bit, 500 kbaud)',
            vin: existing.vin || '9BRBL42EXN0198421',
            batteryStatus: 'Boa (12.6V)',
            tirePressureBar: 2.2,
            activeDtcCodes: dtcs,
            createdAt: new Date().toISOString()
          };
        });
      }

      this.saveAll(data);
      console.log('AutoSense: Sincronizado com sucesso com o banco MySQL!');
    } catch (err) {
      console.warn('API MySQL offline no momento. Operando com cache local.', err.message);
    }
  },

  getAll() {
    try {
      const data = localStorage.getItem(DB_KEY);
      if (data) return JSON.parse(data);
    } catch (e) {}
    return JSON.parse(JSON.stringify(SEED_DATA));
  },

  saveAll(data) {
    try {
      localStorage.setItem(DB_KEY, JSON.stringify(data));
      if (typeof renderQuickLoginList === 'function') {
        renderQuickLoginList();
      }
      return true;
    } catch (e) {
      return false;
    }
  },

  resetToDefault() {
    this.saveAll(SEED_DATA);
    this.syncFromMySQL();
    return JSON.parse(JSON.stringify(SEED_DATA));
  },

  // === MÓDULO DE USUÁRIOS ===
  getUsers() { return this.getAll().users || []; },
  getUserById(id) { return this.getUsers().find(u => u.id === id) || null; },
  getUserByEmail(email) {
    if (!email) return null;
    const clean = email.trim().toLowerCase();
    return this.getUsers().find(u => u.email.toLowerCase() === clean) || null;
  },

  createUser(userData) {
    const data = this.getAll();
    const existing = data.users.find(u => u.email.toLowerCase() === userData.email.trim().toLowerCase());
    if (existing) throw new Error('Já existe uma conta cadastrada com este e-mail.');

    const newUser = {
      id: 'usr_' + Date.now().toString(36),
      name: userData.name || 'Novo Usuário',
      email: userData.email.trim().toLowerCase(),
      password: userData.password,
      role: userData.role || 'user',
      age: parseInt(userData.age, 10) || 40,
      phone: userData.phone || '',
      emergencyContact: userData.emergencyContact || { name: 'Contato de Família', phone: '190', relation: 'Emergência' },
      seniorMode: userData.seniorMode ?? (parseInt(userData.age, 10) >= 60),
      fontSize: userData.fontSize || (parseInt(userData.age, 10) >= 60 ? 'xlarge' : 'normal'),
      highContrast: userData.highContrast ?? (parseInt(userData.age, 10) >= 60),
      voiceAlerts: userData.voiceAlerts ?? true,
      status: 'active',
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString()
    };

    data.users.push(newUser);

    if (userData.vehicle) {
      data.vehicles.push({
        id: 'veh_' + Date.now().toString(36),
        userId: newUser.id,
        make: userData.vehicle.make || 'Veículo',
        model: userData.vehicle.model || 'Padrão',
        year: parseInt(userData.vehicle.year, 10) || new Date().getFullYear(),
        plate: (userData.vehicle.plate || 'AUTO000').toUpperCase(),
        color: userData.vehicle.color || 'Prata',
        fuelType: userData.vehicle.fuelType || 'Flex',
        tankCapacityLiters: 50,
        currentOdometerKm: parseInt(userData.vehicle.odometer, 10) || 25000,
        protocol: 'ISO 15765-4 CAN (11 bit, 500 kbaud)',
        vin: '9BR' + Math.random().toString(36).substring(2, 12).toUpperCase(),
        batteryStatus: 'Normal (12.6V)',
        tirePressureBar: 2.2,
        activeDtcCodes: [],
        createdAt: new Date().toISOString()
      });
    }

    this.saveAll(data);

    // Envia para o MySQL
    fetch(`${API_URL}/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    }).catch(e => console.error('Erro ao salvar no MySQL:', e));

    return newUser;
  },

  updateUser(id, updates) {
    const data = this.getAll();
    const idx = data.users.findIndex(u => u.id === id);
    if (idx === -1) throw new Error('Usuário não encontrado');
    data.users[idx] = { ...data.users[idx], ...updates };
    this.saveAll(data);
    return data.users[idx];
  },

  deleteUser(id) {
    const data = this.getAll();
    const target = data.users.find(u => u.id === id);
    if (target && target.role === 'admin' && data.users.filter(u => u.role === 'admin').length <= 1) {
      throw new Error('Não é possível excluir o único administrador do sistema.');
    }

    if (target) {
      fetch(`${API_URL}/users/${encodeURIComponent(target.email)}`, { method: 'DELETE' })
        .catch(e => console.error('Erro ao excluir no MySQL:', e));
    }

    data.users = data.users.filter(u => u.id !== id);
    data.vehicles = data.vehicles.filter(v => v.userId !== id);
    this.saveAll(data);
    return true;
  },

  toggleUserStatus(id) {
    const user = this.getUserById(id);
    if (!user) throw new Error('Usuário não encontrado');
    return this.updateUser(id, { status: user.status === 'active' ? 'suspended' : 'active' });
  },

  // === MÓDULO DE VEÍCULOS ===
  getVehicles(userId = null) {
    const all = this.getAll().vehicles || [];
    return userId ? all.filter(v => v.userId === userId) : all;
  },

  getVehicleById(id) { return this.getVehicles().find(v => v.id === id) || null; },

  createVehicle(vehicleData) {
    const data = this.getAll();
    const newVeh = {
      id: 'veh_' + Date.now().toString(36),
      userId: vehicleData.userId,
      make: vehicleData.make || 'Genérico',
      model: vehicleData.model || 'Modelo',
      year: parseInt(vehicleData.year, 10) || 2020,
      plate: (vehicleData.plate || 'ABC1D23').toUpperCase(),
      color: vehicleData.color || 'Preto',
      fuelType: vehicleData.fuelType || 'Flex',
      tankCapacityLiters: 50,
      currentOdometerKm: parseInt(vehicleData.currentOdometerKm, 10) || 0,
      protocol: 'ISO 15765-4 CAN (11 bit, 500 kbaud)',
      vin: '9BR' + Math.random().toString(36).substr(2, 10).toUpperCase(),
      batteryStatus: 'Normal (12.6V)',
      tirePressureBar: 2.2,
      activeDtcCodes: vehicleData.activeDtcCodes || [],
      createdAt: new Date().toISOString()
    };
    data.vehicles.push(newVeh);
    this.saveAll(data);
    return newVeh;
  },

  updateVehicle(id, updates) {
    const data = this.getAll();
    const idx = data.vehicles.findIndex(v => v.id === id);
    if (idx === -1) throw new Error('Veículo não encontrado');
    data.vehicles[idx] = { ...data.vehicles[idx], ...updates };
    this.saveAll(data);
    return data.vehicles[idx];
  },

  // === MÓDULO DE DTC (CÓDIGOS OBD-II) ===
  getDtcLibrary() { return { ...SEED_DATA.dtcLibrary, ...(this.getAll().dtcLibrary || {}) }; },
  getDtcDetail(code) {
    return this.getDtcLibrary()[code] || {
      code, system: 'Geral / Genérico OBD-II', title: 'Código de Falha: ' + code,
      severity: 'Média', seniorSummary: 'Aviso mecânico registrado.',
      technicalDescription: 'Falha registrada pela ECU.', possibleCauses: ['Sensor intermitente'],
      recommendedAction: 'Realizar varredura com scanner.'
    };
  },
  getVehicleDTCs(vehicleId) {
    const v = this.getVehicleById(vehicleId);
    return (v && v.activeDtcCodes) ? v.activeDtcCodes.map(c => this.getDtcDetail(c)) : [];
  },
  addDtcToVehicle(vehicleId, code) {
    const v = this.getVehicleById(vehicleId);
    if (!v) return false;
    const codes = Array.from(new Set([...(v.activeDtcCodes || []), code.toUpperCase()]));
    this.updateVehicle(vehicleId, { activeDtcCodes: codes });

    fetch(`${API_URL}/vehicles/${v.plate}/dtc`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ codes })
    }).catch(e => console.error('Erro ao salvar DTC no MySQL:', e));

    return true;
  },
  clearVehicleDTCs(vehicleId) {
    const v = this.getVehicleById(vehicleId);
    if (!v) return false;
    this.updateVehicle(vehicleId, { activeDtcCodes: [] });

    fetch(`${API_URL}/vehicles/${v.plate}/dtc`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ codes: [] })
    }).catch(e => console.error('Erro ao limpar DTC no MySQL:', e));

    return true;
  },

  // === MÓDULO DE VIAGENS E MANUTENÇÃO ===
  getTrips(vehicleId = null) {
    const all = this.getAll().trips || [];
    return vehicleId ? all.filter(t => t.vehicleId === vehicleId) : all;
  },
  addTrip(tripData) {
    const data = this.getAll();
    const newTrip = { id: 'trip_' + Date.now().toString(36), date: new Date().toISOString(), ...tripData };
    data.trips.unshift(newTrip);
    this.saveAll(data);
    return newTrip;
  },
  getMaintenance(vehicleId = null) {
    const all = this.getAll().maintenance || [];
    return vehicleId ? all.filter(m => m.vehicleId === vehicleId) : all;
  },
  completeMaintenance(id) {
    const data = this.getAll();
    const m = data.maintenance.find(x => x.id === id);
    const v = data.vehicles.find(x => x.id === (m && m.vehicleId));
    if (!m || !v) return false;
    m.lastChangeKm = v.currentOdometerKm;
    m.nextDueKm = v.currentOdometerKm + m.intervalKm;
    m.status = 'ok';
    this.saveAll(data);
    return true;
  },
  exportJSON() { return JSON.stringify(this.getAll(), null, 2); },
  importJSON(jsonString) {
    const parsed = JSON.parse(jsonString);
    if (!parsed.users || !parsed.vehicles) throw new Error('Arquivo inválido.');
    this.saveAll(parsed);
    return true;
  }
};

// === RENDERIZAÇÃO DINÂMICA: 3 MOTORISTAS MAIS RECENTES + ADMIN FIXO (EXIGINDO SENHA) ===
function renderQuickLoginList() {
  const container = document.getElementById('quick-login-list');
  if (!container || typeof DB === 'undefined') return;

  const users = DB.getUsers();
  const vehicles = DB.getVehicles();

  const adminUser = users.find(u => u.role === 'admin' || u.email === 'admin@autosense.com') 
    || SEED_DATA.users.find(u => u.role === 'admin');

  const regularUsers = users.filter(u => u.role !== 'admin' && u.email !== 'admin@autosense.com');
  const latestThreeDrivers = regularUsers.slice(-3).reverse();

  const displayList = [...latestThreeDrivers];
  if (adminUser) {
    displayList.push(adminUser);
  }

  container.innerHTML = displayList.map(u => {
    const veh = vehicles.find(v => v.userId === u.id);
    const isAdmin = u.role === 'admin' || u.email === 'admin@autosense.com';
    const subtext = isAdmin
      ? 'Acesso ao Painel Multi-Contas e Frota'
      : `${veh ? `${veh.make} ${veh.model} ${veh.year}` : 'Sem veículo cadastrado'} • ${u.seniorMode ? 'Modo Sênior Ativo' : 'Modo Padrão'}`;
    const color = isAdmin ? '#a78bfa' : (u.seniorMode ? '#ffe600' : '#38bdf8');

    return `
      <button class="quick-acc-btn" onclick="openLoginWithEmail('${u.email}')">
        <div>
          <strong>${u.name} ${!isAdmin ? `(${u.age} anos)` : ''}</strong><br>
          <small style="color: ${color};">${subtext}</small>
        </div>
        <span>Entrar ➔</span>
      </button>
    `;
  }).join('');
}

// Abre o modal de senha já com o e-mail da conta selecionada preenchido
function openLoginWithEmail(email) {
  App.closeModal('account-switch-modal');
  App.showModal('login-modal');

  const emailInput = document.getElementById('login-email');
  const passInput = document.getElementById('login-password');

  if (emailInput) emailInput.value = email;
  if (passInput) {
    passInput.value = '';
    setTimeout(() => passInput.focus(), 100);
  }
}
document.addEventListener('DOMContentLoaded', () => {
  renderQuickLoginList();
  const badge = document.getElementById('user-badge');
  if (badge) badge.addEventListener('click', renderQuickLoginList);
});

DB.init();
window.DB = DB;