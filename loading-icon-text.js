export function createLoadingIconText({
  container,
  size = 200,
  backgroundColor = '#000',
} = {}) {
  const INTERNAL_SIZE = 500;
  const SHAPE_SIZE = 64;
  const TEXT_RADIUS = 155;
  const PHASE_DURATION = 2500;
  const NUM_PHASES = 3;
  const FULL_CYCLE = PHASE_DURATION * NUM_PHASES;
  const NUM_POINTS = 120;
  const SHAPES = ['circle', 'ellipse', 'star'];
  const TEXT_STRING = 'BWITHU BMSG';
  const SEPARATOR = ' · ';
  const TEXT_REPEATS = 4;

  const COLOR_BLOBS = [
    { baseAngle: 0, speed: 1.2, dist: 55, radius: 120, color: [255, 140, 60] },
    { baseAngle: 1.2, speed: -0.9, dist: 60, radius: 110, color: [200, 200, 60] },
    { baseAngle: 2.5, speed: 1.4, dist: 50, radius: 130, color: [230, 55, 120] },
    { baseAngle: 3.8, speed: -1.1, dist: 58, radius: 115, color: [150, 60, 210] },
    { baseAngle: 5.0, speed: 0.8, dist: 45, radius: 125, color: [80, 120, 230] },
    { baseAngle: 0.6, speed: -1.3, dist: 40, radius: 100, color: [72, 199, 165] },
  ];

  const canvas = document.createElement('canvas');
  canvas.width = INTERNAL_SIZE;
  canvas.height = INTERNAL_SIZE;
  canvas.style.width = size + 'px';
  canvas.style.height = size + 'px';
  canvas.style.display = 'block';
  const ctx = canvas.getContext('2d');

  const offCanvas = document.createElement('canvas');
  offCanvas.width = INTERNAL_SIZE;
  offCanvas.height = INTERNAL_SIZE;
  const offCtx = offCanvas.getContext('2d');

  if (container) container.appendChild(canvas);

  let rafId = null;
  let shapeTime = 0;
  let textAngle = 0;
  let lastTime = 0;

  function easeInOutSine(t) {
    return -(Math.cos(Math.PI * t) - 1) / 2;
  }
  function easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }
  function speedProfile(phaseT) {
    return Math.pow(Math.sin(phaseT * Math.PI), 2);
  }

  function getShapeMorph(time) {
    const cycleT = (time % FULL_CYCLE) / FULL_CYCLE;
    const phaseIndex = Math.floor(cycleT * NUM_PHASES);
    const phaseT = (cycleT * NUM_PHASES) - phaseIndex;
    const currentShape = SHAPES[phaseIndex % NUM_PHASES];
    const nextShape = SHAPES[(phaseIndex + 1) % NUM_PHASES];
    let morphT = 0;
    if (phaseT > 0.4) morphT = easeInOutCubic((phaseT - 0.4) / 0.6);
    return { currentShape, nextShape, morphT };
  }

  function shapeRadius(shape, angle) {
    const R = SHAPE_SIZE;
    switch (shape) {
      case 'circle': {
        const breath = Math.sin(shapeTime / 1200) * 0.12;
        const rx = 1 + breath;
        const ry = 1 - breath;
        return R / Math.sqrt(
          Math.pow(Math.cos(angle) / rx, 2) +
          Math.pow(Math.sin(angle) / ry, 2)
        );
      }
      case 'ellipse':
        return R / Math.sqrt(
          Math.pow(Math.cos(angle) / 1.4, 2) +
          Math.pow(Math.sin(angle) / 0.7, 2)
        );
      case 'star': {
        const innerR = R * 0.45;
        const outerR = R * 1.1;
        const sector = Math.PI * 2 / 4;
        const half = sector / 2;
        const mod = ((angle % sector) + sector) % sector;
        const t = mod < half ? mod / half : (sector - mod) / half;
        return innerR + (outerR - innerR) * easeInOutSine(t);
      }
      default:
        return R;
    }
  }

  function getShapePoints(rotAngle, time) {
    shapeTime = time;
    const { currentShape, nextShape, morphT } = getShapeMorph(time);
    const points = [];
    for (let i = 0; i < NUM_POINTS; i++) {
      const a = (i / NUM_POINTS) * Math.PI * 2;
      const r1 = shapeRadius(currentShape, a);
      const r2 = shapeRadius(nextShape, a);
      const r = r1 + (r2 - r1) * morphT;
      points.push({
        x: Math.cos(a + rotAngle) * r,
        y: Math.sin(a + rotAngle) * r,
      });
    }
    return points;
  }

  const fullCycleIntegral = (() => {
    let sum = 0;
    const steps = 200;
    for (let i = 0; i < steps; i++) {
      const t = i / steps;
      const phaseT = (t * NUM_PHASES) % 1;
      sum += (0.6 + 1.5 * speedProfile(phaseT)) / steps;
    }
    return sum;
  })();

  function getRotationAngle(time) {
    const cycleT = (time % FULL_CYCLE) / FULL_CYCLE;
    const fullCycles = Math.floor(time / FULL_CYCLE);
    const steps = 200;
    let integral = 0;
    for (let i = 0; i < steps; i++) {
      const t = (i / steps) * cycleT;
      const phaseT = (t * NUM_PHASES) % 1;
      integral += (0.6 + 1.5 * speedProfile(phaseT)) * (cycleT / steps);
    }
    return (fullCycles * fullCycleIntegral + integral) * Math.PI * 2 * 6;
  }

  function getRotationSpeed(time) {
    const cycleT = (time % FULL_CYCLE) / FULL_CYCLE;
    const phaseT = (cycleT * NUM_PHASES) % 1;
    return 0.6 + 1.5 * speedProfile(phaseT);
  }

  function buildPath(cx, cy, points) {
    ctx.beginPath();
    ctx.moveTo(cx + points[0].x, cy + points[0].y);
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(cx + points[i].x, cy + points[i].y);
    }
    ctx.closePath();
  }

  function drawBlobGradient(time, cx, cy) {
    offCtx.clearRect(0, 0, INTERNAL_SIZE, INTERNAL_SIZE);
    const base = offCtx.createRadialGradient(cx, cy, 0, cx, cy, SHAPE_SIZE * 1.3);
    base.addColorStop(0, 'rgba(140,80,170,0.9)');
    base.addColorStop(1, 'rgba(60,50,120,0.7)');
    offCtx.fillStyle = base;
    offCtx.fillRect(0, 0, INTERNAL_SIZE, INTERNAL_SIZE);

    for (const blob of COLOR_BLOBS) {
      const angle = blob.baseAngle + time / 2000 * blob.speed;
      const wobble = Math.sin(time / 1500 + blob.baseAngle * 3) * 20;
      const bx = cx + Math.cos(angle) * (blob.dist + wobble);
      const by = cy + Math.sin(angle) * (blob.dist + wobble);
      const grad = offCtx.createRadialGradient(bx, by, 0, bx, by, blob.radius);
      const [r, g, b] = blob.color;
      grad.addColorStop(0, `rgba(${r},${g},${b},1)`);
      grad.addColorStop(0.35, `rgba(${r},${g},${b},0.8)`);
      grad.addColorStop(0.65, `rgba(${r},${g},${b},0.35)`);
      grad.addColorStop(1, `rgba(${r},${g},${b},0)`);
      offCtx.beginPath();
      offCtx.arc(bx, by, blob.radius, 0, Math.PI * 2);
      offCtx.fillStyle = grad;
      offCtx.fill();
    }
  }

  function drawCircularText(time, cx, cy) {
    const dt = lastTime === 0 ? 16 : (time - lastTime);
    lastTime = time;

    const speed = getRotationSpeed(time);
    textAngle += speed * -0.0004 * dt;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(textAngle);

    ctx.font = '600 30px Figtree, sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
    ctx.textBaseline = 'top';
    ctx.textAlign = 'center';

    const fullUnit = TEXT_STRING + SEPARATOR;
    const repeatedText = fullUnit.repeat(TEXT_REPEATS);

    const allCharWidths = [];
    for (let i = 0; i < repeatedText.length; i++) {
      allCharWidths.push(ctx.measureText(repeatedText[i]).width);
    }
    const totalWidth = allCharWidths.reduce((a, b) => a + b, 0);
    const circumference = 2 * Math.PI * TEXT_RADIUS;
    const scale = circumference / totalWidth;

    let currentAngle = 0;
    for (let i = 0; i < repeatedText.length; i++) {
      const charAngle = (allCharWidths[i] * scale) / TEXT_RADIUS;
      const midAngle = currentAngle + charAngle / 2;

      ctx.save();
      ctx.rotate(midAngle);
      ctx.translate(0, -TEXT_RADIUS);
      ctx.fillText(repeatedText[i], 0, 0);
      ctx.restore();

      currentAngle += charAngle;
    }

    ctx.restore();
  }

  function render(time) {
    const cx = INTERNAL_SIZE / 2;
    const cy = INTERNAL_SIZE / 2;

    if (backgroundColor === 'transparent') {
      ctx.clearRect(0, 0, INTERNAL_SIZE, INTERNAL_SIZE);
    } else {
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, INTERNAL_SIZE, INTERNAL_SIZE);
    }

    drawCircularText(time, cx, cy);

    const angle = getRotationAngle(time);
    const points = getShapePoints(angle, time);

    ctx.save();
    ctx.shadowColor = 'rgba(180,120,230,0.6)';
    ctx.shadowBlur = 50;
    buildPath(cx, cy, points);
    ctx.fillStyle = 'rgba(120,80,160,0.15)';
    ctx.fill();
    ctx.restore();

    ctx.save();
    buildPath(cx, cy, points);
    ctx.clip();
    drawBlobGradient(time, cx, cy);
    ctx.drawImage(offCanvas, 0, 0);
    ctx.restore();

    ctx.save();
    buildPath(cx, cy, points);
    const hl = ctx.createRadialGradient(
      cx - SHAPE_SIZE * 0.25, cy - SHAPE_SIZE * 0.25, 0,
      cx, cy, SHAPE_SIZE * 1.1
    );
    hl.addColorStop(0, 'rgba(255,255,255,0.2)');
    hl.addColorStop(0.5, 'rgba(255,255,255,0.05)');
    hl.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = hl;
    ctx.fill();
    ctx.restore();

    rafId = requestAnimationFrame(render);
  }

  rafId = requestAnimationFrame(render);

  function destroy() {
    if (rafId != null) cancelAnimationFrame(rafId);
    if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
    lastTime = 0;
    textAngle = 0;
  }

  return { canvas, destroy };
}
