/**
 * AutoSense - Gauges & Instrumental Panel Module
 * Renderização dinâmica de velocímetro, tacômetro (RPM) e instrumentos analógico-digitais via HTML5 Canvas.
 */

class GaugeRenderer {
  constructor() {
    this.speedCanvas = null;
    this.rpmCanvas = null;
    this.speedCtx = null;
    this.rpmCtx = null;

    // Valores interpolados suaves
    this.currentSpeed = 0;
    this.targetSpeed = 0;
    this.currentRpm = 0;
    this.targetRpm = 0;

    this.animationFrame = null;
  }

  init(speedCanvasId, rpmCanvasId) {
    this.speedCanvas = document.getElementById(speedCanvasId);
    this.rpmCanvas = document.getElementById(rpmCanvasId);

    if (this.speedCanvas) {
      this.speedCtx = this.speedCanvas.getContext('2d');
      this.adjustCanvasResolution(this.speedCanvas);
    }
    if (this.rpmCanvas) {
      this.rpmCtx = this.rpmCanvas.getContext('2d');
      this.adjustCanvasResolution(this.rpmCanvas);
    }

    if (window.ResizeObserver) {
      const ro = new ResizeObserver(entries => entries.forEach(e => {
        if (e.contentRect.width > 0) this.adjustCanvasResolution(e.target);
      }));
      [this.speedCanvas, this.rpmCanvas].forEach(c => c && ro.observe(c));
    }
    this.startRenderLoop();
  }

  adjustCanvasResolution(canvas) {
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const width = rect.width || 240;
    const height = rect.height || 240;

    canvas.width = width * dpr;
    canvas.height = height * dpr;

    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
  }

  update(speed, rpm) {
    this.targetSpeed = speed;
    this.targetRpm = rpm;
  }

  startRenderLoop() {
    const loop = () => {
      // Interpolação linear suave (lerp)
      this.currentSpeed += (this.targetSpeed - this.currentSpeed) * 0.15;
      this.currentRpm += (this.targetRpm - this.currentRpm) * 0.15;

      if (!document.hidden && this.speedCtx && this.speedCanvas && this.speedCanvas.offsetParent) {
        this.drawSpeedometer(this.speedCtx, this.speedCanvas, this.currentSpeed);
      }
      if (!document.hidden && this.rpmCtx && this.rpmCanvas && this.rpmCanvas.offsetParent) {
        this.drawTachometer(this.rpmCtx, this.rpmCanvas, this.currentRpm);
      }

      this.animationFrame = requestAnimationFrame(loop);
    };
    loop();
  }

  drawSpeedometer(ctx, canvas, speed) {
    const rect = canvas.getBoundingClientRect();
    const width = rect.width || 240;
    const height = rect.height || 240;
    const cx = width / 2;
    const cy = height / 2;
    const radius = Math.min(cx, cy) - 18;

    ctx.clearRect(0, 0, width, height);

    // Ângulos do mostrador: 135° (esquerda baixo) até 405° (direita baixo) -> total 270°
    const startAngle = 0.75 * Math.PI;
    const endAngle = 2.25 * Math.PI;
    const maxSpeed = 220;
    const speedRatio = Math.min(1, Math.max(0, speed / maxSpeed));
    const currentAngle = startAngle + (endAngle - startAngle) * speedRatio;

    // 1. Arco de Fundo (Pista)
    ctx.beginPath();
    ctx.arc(cx, cy, radius, startAngle, endAngle);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 14;
    ctx.lineCap = 'round';
    ctx.stroke();

    // 2. Arco Gradiente Ativo (Neon Cyan / Azul elétrico)
    if (speedRatio > 0.005) {
      const grad = ctx.createLinearGradient(0, cy + radius, width, cy - radius);
      grad.addColorStop(0, '#00d2ff');
      grad.addColorStop(0.7, '#00f2fe');
      grad.addColorStop(1, speed > 120 ? '#ff416c' : '#4facfe');

      ctx.beginPath();
      ctx.arc(cx, cy, radius, startAngle, currentAngle);
      ctx.strokeStyle = grad;
      ctx.lineWidth = 14;
      ctx.lineCap = 'round';
      ctx.shadowColor = '#00f2fe';
      ctx.shadowBlur = 12;
      ctx.stroke();
      ctx.shadowBlur = 0; // reset
    }

    // 3. Marcações de Velocidade (Ticks)
    const tickCount = 11; // 0, 20, 40, ... 220
    for (let i = 0; i <= tickCount; i++) {
      const val = i * 20;
      const angle = startAngle + (endAngle - startAngle) * (val / maxSpeed);
      const isMajor = i % 2 === 0;

      const innerR = radius - (isMajor ? 18 : 10);
      const outerR = radius - 4;

      const x1 = cx + Math.cos(angle) * innerR;
      const y1 = cy + Math.sin(angle) * innerR;
      const x2 = cx + Math.cos(angle) * outerR;
      const y2 = cy + Math.sin(angle) * outerR;

      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.strokeStyle = isMajor ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.3)';
      ctx.lineWidth = isMajor ? 2.5 : 1.5;
      ctx.stroke();

      if (isMajor && width >= 200) {
        const textR = radius - 28;
        const tx = cx + Math.cos(angle) * textR;
        const ty = cy + Math.sin(angle) * textR;
        ctx.fillStyle = 'rgba(255,255,255,0.6)';
        ctx.font = '10px "Inter", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(val.toString(), tx, ty);
      }
    }

    // 4. Mostrador Digital Central
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 36px "Inter", "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(Math.round(speed).toString(), cx, cy);

    ctx.fillStyle = '#00f2fe';
    ctx.font = '600 12px "Inter", sans-serif';
    ctx.fillText('KM/H', cx, cy + 24);

    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.font = '10px "Inter", sans-serif';
    ctx.fillText('VELOCIDADE', cx, cy - 26);
  }

  drawTachometer(ctx, canvas, rpm) {
    const rect = canvas.getBoundingClientRect();
    const width = rect.width || 240;
    const height = rect.height || 240;
    const cx = width / 2;
    const cy = height / 2;
    const radius = Math.min(cx, cy) - 18;

    ctx.clearRect(0, 0, width, height);

    const startAngle = 0.75 * Math.PI;
    const endAngle = 2.25 * Math.PI;
    const maxRpm = 8000;
    const rpmRatio = Math.min(1, Math.max(0, rpm / maxRpm));
    const currentAngle = startAngle + (endAngle - startAngle) * rpmRatio;

    // 1. Arco de Fundo
    ctx.beginPath();
    ctx.arc(cx, cy, radius, startAngle, endAngle);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 14;
    ctx.lineCap = 'round';
    ctx.stroke();

    // 2. Zona Vermelha (Redline: 6000 a 8000 RPM)
    const redlineStartAngle = startAngle + (endAngle - startAngle) * (6000 / maxRpm);
    ctx.beginPath();
    ctx.arc(cx, cy, radius, redlineStartAngle, endAngle);
    ctx.strokeStyle = 'rgba(255, 59, 48, 0.35)';
    ctx.lineWidth = 14;
    ctx.lineCap = 'round';
    ctx.stroke();

    // 3. Arco Ativo (Âmbar / Laranja esportivo)
    if (rpmRatio > 0.005) {
      const grad = ctx.createLinearGradient(0, cy + radius, width, cy - radius);
      grad.addColorStop(0, '#f7971e');
      grad.addColorStop(0.7, '#ffd200');
      grad.addColorStop(1, rpm >= 6000 ? '#ff3b30' : '#ff9500');

      ctx.beginPath();
      ctx.arc(cx, cy, radius, startAngle, currentAngle);
      ctx.strokeStyle = grad;
      ctx.lineWidth = 14;
      ctx.lineCap = 'round';
      ctx.shadowColor = rpm >= 6000 ? '#ff3b30' : '#ffd200';
      ctx.shadowBlur = 12;
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    // 4. Mostrador Digital Central
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 34px "Inter", "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText((rpm / 1000).toFixed(1), cx, cy);

    ctx.fillStyle = '#ffd200';
    ctx.font = '600 12px "Inter", sans-serif';
    ctx.fillText('x1000 RPM', cx, cy + 24);

    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.font = '10px "Inter", sans-serif';
    ctx.fillText('ROTAÇÃO MOTOR', cx, cy - 26);
  }
}

window.GaugeRenderer = GaugeRenderer;

