/**
 * AutoSense - Speech & Audio Feedback Module
 * Acessibilidade por voz em português (pt-BR) e efeitos sonoros automotivos via Web Audio API.
 * Especialmente projetado para pessoas da terceira idade e baixa visão.
 */

const Speech = {
  synth: window.speechSynthesis || null,
  audioCtx: null,
  enabled: true,
  voice: null,

  init() {
    if (!this.synth) {
      console.warn('SpeechSynthesis não suportado neste navegador.');
    } else {
      // Carregar vozes disponíveis
      const loadVoices = () => {
        const voices = this.synth.getVoices();
        // Preferir voz em português brasileiro
        this.voice = voices.find(v => v.lang === 'pt-BR' || v.lang.startsWith('pt')) || null;
      };
      loadVoices();
      if (this.synth.onvoiceschanged !== undefined) {
        this.synth.onvoiceschanged = loadVoices;
      }
    }
  },

  getAudioContext() {
    if (!this.audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.audioCtx = new AudioContext();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  },

  // Falar texto em voz alta
  speak(text, options = {}) {
    if (!this.enabled || !this.synth || !text) return;

    try {
      this.synth.cancel(); // Cancela fala anterior para evitar sobreposição

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'pt-BR';
      utterance.rate = options.rate || 0.95; // Velocidade confortável para idosos
      utterance.pitch = options.pitch || 1.0;
      utterance.volume = options.volume || 1.0;

      if (this.voice) {
        utterance.voice = this.voice;
      }

      setTimeout(() => this.synth.speak(utterance), 60); // evita bug do Chrome após cancel()
    } catch (e) {
      console.error('Falha ao sintetizar fala:', e);
    }
  },

  stop() {
    if (this.synth) {
      this.synth.cancel();
    }
  },

  // Efeitos Sonoros com Sintetizador de Áudio Nativo (Sem arquivos externos!)
  beep(type = 'click') {
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      const now = ctx.currentTime;

      if (type === 'click') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.exponentialRampToValueAtTime(400, now + 0.05);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
        osc.start(now);
        osc.stop(now + 0.05);
      } else if (type === 'success') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(523.25, now); // C5
        osc.frequency.setValueAtTime(659.25, now + 0.1); // E5
        osc.frequency.setValueAtTime(783.99, now + 0.2); // G5
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
        osc.start(now);
        osc.stop(now + 0.35);
      } else if (type === 'warning') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.setValueAtTime(350, now + 0.12);
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
        osc.start(now);
        osc.stop(now + 0.25);
      } else if (type === 'danger') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(880, now);
        osc.frequency.setValueAtTime(440, now + 0.15);
        osc.frequency.setValueAtTime(880, now + 0.3);
        gain.gain.setValueAtTime(0.35, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.45);
        osc.start(now);
        osc.stop(now + 0.45);
      } else if (type === 'connected') {
        // Sinal de conexão bluetooth bem-sucedida
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.setValueAtTime(880, now + 0.1);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
        osc.start(now);
        osc.stop(now + 0.25);
      }
    } catch (e) {
      console.warn('Erro ao tocar beep:', e);
    }
  },

  // Leitura acessível completa do estado do carro para idosos
  readFullDashboard(telemetry, vehicle, dtcs = []) {
    if (!telemetry) {
      this.speak('O veículo ainda não está conectado. Clique no botão verde de conectar ao carro.');
      return;
    }

    const speed = Math.round(telemetry.speed ?? 0);
    const temp = Math.round(telemetry.coolantTemp ?? 90);
    const fuel = Math.round(telemetry.fuelLevel ?? 50);
    const battery = (telemetry.batteryVoltage ?? 12.6).toFixed(1);

    let report = `Relatório do seu ${vehicle ? vehicle.model : 'carro'}. `;
    report += `Velocidade atual: ${speed} quilômetros por hora. `;

    if (fuel <= 15) {
      report += `Atenção: Combustível na reserva, restam apenas ${fuel} por cento. Abasteça em breve. `;
    } else {
      report += `Combustível em ${fuel} por cento, nível tranquilo. `;
    }

    if (temp > 105) {
      report += `Alerta de motor quente! Temperatura em ${temp} graus. Pare com segurança assim que possível. `;
    } else {
      report += `Temperatura do motor perfeita e normal, em ${temp} graus. `;
    }

    report += `Bateria marcando ${battery} volts. `;

    if (dtcs && dtcs.length > 0) {
      report += dtcs.length === 1 ? 'Atenção: foi encontrado 1 aviso mecânico no computador de bordo. ' : `Atenção: foram encontrados ${dtcs.length} avisos mecânicos no computador de bordo. `;
      report += `Código principal: ${dtcs[0].title}. `;
    } else {
      report += `Diagnóstico do motor limpo. Nenhum defeito encontrado. Tenha uma ótima viagem!`;
    }

    this.speak(report);
  }
};

// Iniciar sintetizador
Speech.init();
window.Speech = Speech;

