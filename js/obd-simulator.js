/**
 * AutoSense - Simulador OBD-II (ELM327)
 * Fornece window.OBD: connect/disconnect, telemetria, presets, scanDTCs/clearDTCs e registro de viagens.
 */
const OBD = {
  status: 'disconnected',
  preset: 'city',
  vehicle: null,
  listeners: {},
  timer: null,
  token: 0,
  data: { speed: 0, rpm: 0, coolantTemp: 75, fuelLevel: 65, batteryVoltage: 12.6, oilPressure: 0,
          instantConsumption: 0, throttle: 0, milStatus: false },
  sim: null,

  on(evt, cb) { (this.listeners[evt] = this.listeners[evt] || []).push(cb); },
  emit(evt, payload) { (this.listeners[evt] || []).forEach(cb => { try { cb(payload); } catch (e) { console.error(e); } }); },
  sleep(ms) { return new Promise(r => setTimeout(r, ms)); },
  log(message, type = 'info') {
    this.emit('log', { timestamp: new Date().toLocaleTimeString('pt-BR'), message, type });
  },
  setStatus(s) { this.status = s; this.emit('statusChange', s); },
  snapshot() { return { ...this.data }; },

  async connect(vehicle) {
    if (!vehicle) { this.log('Nenhum veículo cadastrado para esta conta.', 'warning'); return false; }
    if (this.status !== 'disconnected') return false;
    const token = ++this.token;
    this.vehicle = vehicle;
    this.setStatus('connecting');
    const steps = [
      ['ATZ', 'ELM327 v1.5'], ['ATE0', 'OK'], ['ATSP0', 'OK'],
      ['0100', '41 00 BE 3F A8 13'], ['0902', 'VIN ' + vehicle.vin]
    ];
    for (const [cmd, reply] of steps) {
      this.log('>> ' + cmd, 'cmd');
      await this.sleep(350);
      if (token !== this.token) return false;
      this.log('<< ' + reply, 'reply');
    }
    this.log('Protocolo detectado: ' + vehicle.protocol, 'success');
    const codes = vehicle.activeDtcCodes || [];
    this.sim = {
      t: 0, speed: 0, rpm: 800, target: 0, phaseLeft: 0, temp: 75, fuel: Number(vehicle.fuelLevel ?? 65),
      dist: 0, odoStart: vehicle.currentOdometerKm, maxSpeed: 0, speedSum: 0, consSum: 0,
      harshAcc: 0, harshBrk: 0, overSecs: 0, dtcFired: false, codes
    };
    this.data.fuelLevel = this.sim.fuel;
    this.setStatus('connected');
    this.log('Conectado! Lendo PIDs em tempo real...', 'success');
    this.timer = setInterval(() => this.tick(0.25), 250);
    return true;
  },

  disconnect() {
    if (this.status === 'disconnected') return;
    this.token++;
    clearInterval(this.timer); this.timer = null;
    if (this.sim && this.vehicle) this.finishTrip();
    this.sim = null;
    Object.assign(this.data, { speed: 0, rpm: 0, oilPressure: 0, throttle: 0, instantConsumption: 0 });
    this.setStatus('disconnected');
    this.emit('telemetry', this.snapshot());
    this.log('Desconectado do veículo.', 'warning');
  },

  setPreset(p) {
    this.preset = p;
    if (this.sim) { this.sim.phaseLeft = 0; this.sim.dtcFired = false; }
    this.log('Cenário de simulação: ' + p, 'info');
  },

  pickTarget(s) {
    const r = Math.random();
    switch (this.preset) {
      case 'idle': s.target = 0; s.phaseLeft = 5; break;
      case 'highway': s.target = 85 + Math.round(r * 35); s.phaseLeft = 8 + r * 8; break;
      case 'overheat': s.target = 20 + Math.round(r * 25); s.phaseLeft = 6 + r * 6; break;
      case 'misfire': s.target = 30 + Math.round(r * 20); s.phaseLeft = 6 + r * 6; break;
      default: s.target = [0, 15, 30, 45, 60][Math.floor(r * 5)]; s.phaseLeft = s.target ? 5 + r * 6 : 3 + r * 3;
    }
  },

  tick(dt) {
    const s = this.sim, d = this.data;
    if (!s) return;
    s.t += dt; s.phaseLeft -= dt;
    if (s.phaseLeft <= 0) this.pickTarget(s);

    // Velocidade (aceleração suave, frenagem um pouco mais forte)
    const prev = s.speed;
    const maxUp = 6 * (1 - s.speed / 220), maxDown = 9;
    const diff = s.target - s.speed;
    s.speed += Math.max(-maxDown * dt, Math.min(maxUp * dt, diff));
    s.speed = Math.max(0, s.speed);
    const accel = (s.speed - prev) / dt;
    if (accel > 5.5) s.harshAcc++;
    if (accel < -8) s.harshBrk++;
    if (s.speed > 110) s.overSecs += dt;

    // Rotação por marcha
    const v = s.speed;
    const ratio = v < 12 ? 110 : v < 28 ? 78 : v < 45 ? 53 : v < 70 ? 36 : v < 100 ? 25 : 20;
    let rpm = Math.max(800, v * ratio) + Math.max(0, accel) * 40 + (Math.random() - 0.5) * 60;
    if (this.preset === 'misfire' || s.codes.includes('P0300')) rpm += (Math.random() - 0.5) * (this.preset === 'misfire' ? 700 : 250);
    s.rpm += (rpm - s.rpm) * 0.4;

    // Temperatura
    const tTarget = this.preset === 'overheat' ? 113 : 90;
    s.temp += (tTarget - s.temp) * (this.preset === 'overheat' ? 0.012 : 0.008) + (Math.random() - 0.5) * 0.1;

    // Consumo / combustível
    const lph = 0.9 + v * 0.045 + Math.max(0, accel) * 0.6;
    const kml = v > 3 ? Math.min(30, v / lph) : 0;
    s.fuel = Math.max(0, s.fuel - (lph / 3600 * dt) / (this.vehicle.tankCapacityLiters || 50) * 100);
    s.dist += v * dt / 3600;
    s.maxSpeed = Math.max(s.maxSpeed, v);
    s.speedSum += v * dt; s.consSum += kml * dt;

    // Bateria / pressão de óleo / borboleta
    const lowBat = s.codes.includes('P0562');
    d.batteryVoltage = (lowBat ? 11.7 : 14.1) + (Math.random() - 0.5) * 0.2;
    d.oilPressure = Math.round(Math.min(60, 15 + s.rpm / 1000 * 8 + (Math.random() - 0.5) * 2));
    d.throttle = v === 0 && s.target === 0 ? 0 : Math.min(100, 10 + Math.max(0, accel) * 6 + v * 0.1);
    Object.assign(d, { speed: v, rpm: s.rpm, coolantTemp: s.temp, fuelLevel: s.fuel, instantConsumption: kml });
    d.milStatus = (this.vehicle.activeDtcCodes || []).length > 0;

    // Falhas geradas pela simulação
    if (!s.dtcFired) {
      const code = this.preset === 'misfire' && s.t > 6 ? 'P0300' : (this.preset === 'overheat' && s.temp >= 110 ? 'P0217' : null);
      if (code) { s.dtcFired = true; this.log('Falha detectada pela ECU: ' + code, 'warning'); this.emit('dtcDetected', code); }
    }
    if (Math.round(s.t / dt) % 20 === 0) {
      this.log('>> 010C', 'cmd');
      this.log('<< ' + Math.round(s.rpm) + ' RPM | ' + Math.round(v) + ' km/h | ' + Math.round(s.temp) + ' °C', 'reply');
    }
    this.emit('telemetry', this.snapshot());
  },

  finishTrip() {
    const s = this.sim, veh = this.vehicle;
    try {
      const secs = Math.max(1, s.t);
      const patch = { fuelLevel: Math.round(s.fuel * 10) / 10 };
      if (s.dist >= 0.5) patch.currentOdometerKm = Math.round(s.odoStart + s.dist);
      const updated = window.DB.updateVehicle(veh.id, patch);
      this.vehicle = updated;
      if (s.dist >= 0.1) {
        const score = Math.max(60, Math.round(100 - s.harshAcc * 0.15 - s.harshBrk * 0.25 - s.overSecs * 0.3));
        const trip = window.DB.addTrip({
          vehicleId: veh.id, origin: 'Início da viagem (simulada)', destination: 'Fim da viagem',
          distanceKm: Math.round(s.dist * 10) / 10, durationMinutes: Math.max(1, Math.round(secs / 60)),
          avgSpeedKmH: Math.round(s.dist / (secs / 3600)), maxSpeedKmH: Math.round(s.maxSpeed),
          avgFuelConsumptionKmL: Math.round(s.consSum / secs * 10) / 10, smoothDrivingScore: score
        });
        this.emit('tripEnded', trip);
      }
      this.emit('vehicleUpdated', updated);
    } catch (e) { console.warn('Falha ao salvar viagem:', e); }
  },

  async scanDTCs(vehicleId) {
    this.log('>> 03 (Ler códigos de falha)', 'cmd');
    await this.sleep(1200);
    const list = window.DB.getVehicleDTCs(vehicleId);
    this.log('<< ' + (list.length ? list.map(x => x.code).join(', ') : 'NO DATA (sem falhas)'), 'reply');
    return list;
  },

  async clearDTCs(vehicleId) {
    this.log('>> 04 (Apagar códigos / MIL)', 'cmd');
    await this.sleep(900);
    window.DB.clearVehicleDTCs(vehicleId);
    if (this.sim) this.sim.codes = [];
    this.data.milStatus = false;
    this.log('<< 44 (OK) - MIL apagada', 'success');
    return true;
  }
};
window.OBD = OBD;
