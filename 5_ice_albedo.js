// 5_ice_albedo.js — Ice–albedo feedback in a simple energy balance model
//
//   C dT/dt = Q · (1 − α(T)) − (A + B·T)
//
// α(T) = 0.6 when T ≤ −10 °C (ice-covered), 0.3 when T ≥ 0 °C (ice-free),
// linear in between. The temperature always moves from where it is now,
// so the result depends on the planet's history (hysteresis).

// ---------- Settings ----------

const A = 202, B = 1.9;               // outgoing heat A + B·T  (W/m²)
const WIDTH = 1000, HEIGHT = 520;
const STEPS_PER_FRAME = 8, TIME_STEP = 0.012;

const slider = $('slider');
const ctx = setupCanvas($('picture'), WIDTH, HEIGHT);

function albedo(T) {
  if (T <= -10) return 0.6;
  if (T >= 0) return 0.3;
  return 0.3 + 0.03 * (-T);
}

// Net heating: sunlight absorbed minus heat lost to space
function netHeating(Q, T) {
  return Q * (1 - albedo(T)) - (A + B * T);
}

// ---------- State ----------

let T = 19.7;                 // start at the warm equilibrium for Q = 342
let trace = [];               // every (Q, T) the planet has visited
let jumps = [];               // where the temperature jumped between states
let lastState = 'warm';       // 'warm' (T ≥ 0) or 'frozen' (T ≤ −10)
let lastStablePoint = null;
let shownIce = 0;             // ice cover drawn on the planet (eases toward the real value)

function stateOf(T) {
  if (T >= 0) return 'warm';
  if (T <= -10) return 'frozen';
  return null;                // in between
}

function stepModel(Q) {
  for (let k = 0; k < STEPS_PER_FRAME; k++) T += netHeating(Q, T) * TIME_STEP;

  const last = trace[trace.length - 1];
  if (!last || Math.abs(last[0] - Q) > 0.3 || Math.abs(last[1] - T) > 0.3) trace.push([Q, T]);
  if (trace.length > 4000) trace.shift();

  // record a jump when the planet switches between warm and frozen
  const state = stateOf(T);
  if (state) {
    if (state !== lastState && lastStablePoint) jumps.push(lastStablePoint);
    lastState = state;
    lastStablePoint = [Q, T];
  }

  const iceCover = (albedo(T) - 0.3) / 0.3;        // 0 = no ice, 1 = all ice
  shownIce += (iceCover - shownIce) * 0.08;
}

// ---------- Drawing: the planet ----------

const PLANET_X = 270, PLANET_Y = 255, RADIUS = 185;

function drawPlanet(Q) {
  const sunStrength = (Q - 260) / 220;
  const sunX = PLANET_X - 120, sunY = PLANET_Y - 130;
  const glow = ctx.createRadialGradient(sunX, sunY, 10, sunX, sunY, 135);
  glow.addColorStop(0, `rgba(255,196,110,${0.15 + 0.45 * sunStrength})`);
  glow.addColorStop(1, 'rgba(255,196,110,0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(sunX, sunY, 135, 0, 2 * Math.PI);
  ctx.fill();

  // ocean
  const ocean = ctx.createRadialGradient(PLANET_X - 60, PLANET_Y - 70, 15, PLANET_X, PLANET_Y, RADIUS);
  ocean.addColorStop(0, '#8dbadd');
  ocean.addColorStop(1, '#3f74a3');
  ctx.fillStyle = ocean;
  ctx.beginPath();
  ctx.arc(PLANET_X, PLANET_Y, RADIUS, 0, 2 * Math.PI);
  ctx.fill();

  // ice caps grow from both poles toward the equator
  if (shownIce > 0.002) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(PLANET_X, PLANET_Y, RADIUS, 0, 2 * Math.PI);
    ctx.clip();
    const capHeight = RADIUS * Math.min(1.25, shownIce * 1.08);
    const wobble = 4 * Math.max(0, Math.min(1, (1 - shownIce) * 4));
    const ice = ctx.createLinearGradient(0, PLANET_Y - RADIUS, 0, PLANET_Y + RADIUS);
    ice.addColorStop(0, '#ffffff');
    ice.addColorStop(0.5, '#e3eef6');
    ice.addColorStop(1, '#ffffff');
    ctx.fillStyle = ice;
    for (const pole of [1, -1]) {             // 1 = north, -1 = south
      ctx.beginPath();
      ctx.moveTo(PLANET_X - RADIUS, PLANET_Y - pole * RADIUS);
      for (let x = PLANET_X - RADIUS; x <= PLANET_X + RADIUS; x += 4) {
        const edge = PLANET_Y - pole * (RADIUS - capHeight) + pole * Math.sin(x / 14 + pole) * wobble;
        ctx.lineTo(x, edge);
      }
      ctx.lineTo(PLANET_X + RADIUS, PLANET_Y - pole * RADIUS);
      ctx.fill();
    }
    ctx.restore();
  }
  ctx.strokeStyle = 'rgba(31,42,51,.15)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(PLANET_X, PLANET_Y, RADIUS, 0, 2 * Math.PI);
  ctx.stroke();
}

// ---------- Drawing: the (Q, T) chart ----------

const CHART = { left: 570, right: 975, top: 30, bottom: 440 };
const chartX = (Q) => CHART.left + (Q - 260) / 220 * (CHART.right - CHART.left);
const chartY = (T) => CHART.bottom - (T + 60) / 140 * (CHART.bottom - CHART.top);

function drawChart(Q) {
  const { left, right, top, bottom } = CHART;

  // shade the ice-covered region and draw grid lines
  ctx.fillStyle = 'rgba(43,123,191,.06)';
  ctx.fillRect(left, chartY(-10), right - left, bottom - chartY(-10));
  ctx.strokeStyle = COLORS.grid;
  for (let q = 260; q <= 480; q += 40) { ctx.beginPath(); ctx.moveTo(chartX(q), top); ctx.lineTo(chartX(q), bottom); ctx.stroke(); }
  for (let t = -60; t <= 80; t += 20) { ctx.beginPath(); ctx.moveTo(left, chartY(t)); ctx.lineTo(right, chartY(t)); ctx.stroke(); }
  strokeBox(ctx, left, top, right - left, bottom - top);

  // labels
  ctx.font = canvasFont(ctx);
  ctx.fillStyle = COLORS.muted;
  for (let q = 260; q <= 480; q += 40) ctx.fillText(q, chartX(q) - 11, bottom + 20);
  for (let t = -40; t <= 80; t += 40) ctx.fillText(withMinus(t) + ' °C', left - 54, chartY(t) + 4);
  ctx.fillText('sunlight Q (W/m²)', right - 120, bottom + 42);
  ctx.fillText('temperature', left + 8, top + 18);
  ctx.fillText('ice-covered (T ≤ −10 °C)', left + 8, bottom - 10);

  // the path the planet has taken
  ctx.strokeStyle = COLORS.blue;
  ctx.lineWidth = 3;
  ctx.lineJoin = 'round';
  ctx.beginPath();
  trace.forEach(([q, t], i) => (i ? ctx.lineTo(chartX(q), chartY(t)) : ctx.moveTo(chartX(q), chartY(t))));
  ctx.stroke();
  ctx.lineWidth = 1;

  // jump points and the current state
  ctx.fillStyle = COLORS.ink;
  for (const [q, t] of jumps) { ctx.beginPath(); ctx.arc(chartX(q), chartY(t), 4, 0, 2 * Math.PI); ctx.fill(); }
  ctx.fillStyle = COLORS.warm;
  ctx.beginPath();
  ctx.arc(chartX(Q), chartY(T), 7, 0, 2 * Math.PI);
  ctx.fill();
}

function updateReadout(Q) {
  $('slider-value').textContent = Q + ' W/m²';
  $('temperature').textContent = withMinus(T.toFixed(1)) + ' °C';
  $('temperature').style.color = T >= 0 ? COLORS.warm : T <= -10 ? COLORS.accent : COLORS.ink;
  $('ice-note').textContent = T >= 0 ? 'Ice-free.' : T <= -10 ? 'Frozen over.' : 'Partly frozen.';
}

function animate() {
  const Q = Number(slider.value);
  stepModel(Q);
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  drawPlanet(Q);
  drawChart(Q);
  updateReadout(Q);
  requestAnimationFrame(animate);
}

// ---------- Controls ----------

$('clear-trace').onclick = () => { trace = []; jumps = []; };
animate();
