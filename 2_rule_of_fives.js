// 2_rule_of_fives.js — When does brine connect through sea ice?
//
// Real part:   brine volume fraction φ(T) from the Frankenstein–Garner relation.
// Schematic:   brine pockets placed at random on a lattice. The density is
//              chosen so this picture first connects exactly when φ = 5%.

// ---------- Settings ----------

const SALINITY = 5;                 // ppt, fixed
const WIDTH = 640, HEIGHT = 560;
const COLS = 64, ROWS = 50;         // lattice of possible brine pockets
const CELL_W = WIDTH / COLS, CELL_H = 10;
const ICE_TOP = 24;                 // y where the ice starts
const ICE_BOTTOM = ICE_TOP + ROWS * CELL_H;

const slider = $('slider');
const ctx = setupCanvas($('picture'), WIDTH, HEIGHT);

// Frankenstein–Garner: φ = S · (49.185 / |T| + 0.532) / 1000
function brineFraction(temperature) {
  return SALINITY * (49.185 / Math.abs(temperature) + 0.532) / 1000;
}

// ---------- The random picture ----------
// Each cell gets a random number (is it brine?) and a small random
// shape, so the pockets look a bit irregular.

const cells = [];
for (let i = 0; i < COLS * ROWS; i++) {
  cells.push({
    u: Math.random(),                        // brine if u < density
    dx: (Math.random() - 0.5) * 3.2,         // small jitter in position
    dy: (Math.random() - 0.5) * 2.4,
    rx: 1.2 + Math.random() * 1.1,           // pocket width
    ry: 2.6 + Math.random() * 2.2,           // pocket height (tall: columnar ice)
  });
}

// faint vertical lines = boundaries between ice crystals
const grainLines = [];
for (let x = 6; x < WIDTH; x += 9 + Math.random() * 10) grainLines.push(x);

// ---------- Which brine is connected to the ocean? (breadth-first search) ----------
// Start from brine cells in the bottom row and spread to brine neighbours.
// distance[i] = how many steps cell i is from the ocean (-1 = not connected).

function floodFromOcean(density) {
  const isBrine = cells.map((c) => c.u < density);
  const distance = new Array(COLS * ROWS).fill(-1);
  const queue = [];

  for (let col = 0; col < COLS; col++) {
    const i = (ROWS - 1) * COLS + col;
    if (isBrine[i]) { distance[i] = 0; queue.push(i); }
  }
  for (let head = 0; head < queue.length; head++) {
    const i = queue[head];
    const col = i % COLS, row = Math.floor(i / COLS);
    for (const [dc, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const c = col + dc, r = row + dr;
      if (c < 0 || r < 0 || c >= COLS || r >= ROWS) continue;
      const j = r * COLS + c;
      if (isBrine[j] && distance[j] < 0) { distance[j] = distance[i] + 1; queue.push(j); }
    }
  }

  const reachesSurface = distance.slice(0, COLS).some((d) => d >= 0);
  const maxDistance = Math.max(...distance);
  return { isBrine, distance, reachesSurface, maxDistance };
}

// Find the density at which this particular picture first connects
function findCriticalDensity() {
  let low = 0, high = 1;
  for (let k = 0; k < 30; k++) {
    const mid = (low + high) / 2;
    if (floodFromOcean(mid).reachesSurface) high = mid; else low = mid;
  }
  return high;
}
const CRITICAL_DENSITY = findCriticalDensity();

// Map φ to a density: φ = 5% gives exactly the critical density.
function densityFor(phi) {
  return Math.min(0.78, CRITICAL_DENSITY * Math.pow(phi / 0.05, 0.25));
}

// ---------- Animation state ----------

let flood = null;
let fillProgress = 0;        // how far the water has climbed (in steps)
let pulsePhase = 0;          // moving highlight once water reaches the top
let wasConnected = null;

function update() {
  const temperature = Number(slider.value);
  const phi = brineFraction(temperature);
  flood = floodFromOcean(densityFor(phi));

  if (flood.reachesSurface !== wasConnected) {
    if (flood.reachesSurface) fillProgress = 0;   // start the climb again
    wasConnected = flood.reachesSurface;
  }

  $('slider-value').textContent = withMinus(temperature.toFixed(1)) + ' °C';
  $('brine-fraction').textContent = (phi * 100).toFixed(1) + '%';
  $('brine-fraction').style.color = phi >= 0.05 ? COLORS.accent : COLORS.ink;
  $('brine-note').textContent = phi >= 0.05
    ? 'Open — sea water can flow through.'
    : 'Sealed — no connected pathway.';
}

// ---------- Drawing ----------

const cellCenter = (i) => [
  (i % COLS + 0.5) * CELL_W + cells[i].dx,
  ICE_TOP + (Math.floor(i / COLS) + 0.5) * CELL_H + cells[i].dy,
];

function drawPocket(i, grow = 0) {
  const [x, y] = cellCenter(i);
  ctx.beginPath();
  ctx.ellipse(x, y, cells[i].rx + grow, cells[i].ry + grow, 0, 0, 2 * Math.PI);
  ctx.fill();
}

function draw() {
  // ice, crystal boundaries, air on top, ocean below
  ctx.fillStyle = '#f6f9fb';
  ctx.fillRect(0, 0, WIDTH, ICE_BOTTOM);
  ctx.strokeStyle = 'rgba(120,150,175,.13)';
  ctx.lineWidth = 1;
  grainLines.forEach((gx, k) => {
    ctx.beginPath();
    ctx.moveTo(gx, ICE_TOP);
    for (let y = ICE_TOP; y <= ICE_BOTTOM; y += 40) ctx.lineTo(gx + Math.sin(y / 90 + k) * 2.5, y);
    ctx.stroke();
  });
  ctx.fillStyle = '#e9eef2';
  ctx.fillRect(0, 0, WIDTH, ICE_TOP);
  const ocean = ctx.createLinearGradient(0, ICE_BOTTOM, 0, HEIGHT);
  ocean.addColorStop(0, '#6e9cc2');
  ocean.addColorStop(1, '#4b7ba3');
  ctx.fillStyle = ocean;
  ctx.fillRect(0, ICE_BOTTOM, WIDTH, HEIGHT - ICE_BOTTOM);

  // a cell counts as "filled" once the climbing water has reached it
  const limit = flood.reachesSurface ? fillProgress : Infinity;
  const filled = (i) => flood.distance[i] >= 0 && flood.distance[i] <= limit;

  // isolated brine pockets (grey-blue)
  ctx.fillStyle = 'rgba(110,148,182,.62)';
  for (let i = 0; i < cells.length; i++) {
    if (flood.isBrine[i] && !filled(i)) drawPocket(i);
  }

  // vertical channels between filled pockets, and down into the ocean
  ctx.strokeStyle = '#3d84c2';
  ctx.lineWidth = 2.2;
  ctx.lineCap = 'round';
  ctx.beginPath();
  for (let i = 0; i < cells.length; i++) {
    if (!filled(i)) continue;
    const [x, y] = cellCenter(i);
    const row = Math.floor(i / COLS);
    if (row < ROWS - 1 && filled(i + COLS)) {
      const [x2, y2] = cellCenter(i + COLS);
      ctx.moveTo(x, y);
      ctx.lineTo(x2, y2);
    }
    if (row === ROWS - 1) { ctx.moveTo(x, y); ctx.lineTo(x, ICE_BOTTOM + 2); }
  }
  ctx.stroke();

  // filled pockets (blue); once open, a bright pulse moves upward
  const fullyOpen = flood.reachesSurface && fillProgress > flood.maxDistance;
  for (let i = 0; i < cells.length; i++) {
    if (!filled(i)) continue;
    ctx.fillStyle = '#3d84c2';
    if (fullyOpen) {
      const wave = ((flood.distance[i] - pulsePhase) % 24 + 24) % 24;
      if (wave < 4) {
        const k = 1 - wave / 4;
        ctx.fillStyle = `rgb(${61 + 120 * k},${132 + 90 * k},${194 + 55 * k})`;
      }
    }
    drawPocket(i, 0.35);
  }

  // water arriving at the surface
  if (fullyOpen) {
    ctx.fillStyle = '#3d84c2';
    for (let col = 0; col < COLS; col++) {
      if (flood.distance[col] >= 0) ctx.fillRect(col * CELL_W - 1, ICE_TOP - 4, CELL_W + 2, 4);
    }
  }

  ctx.font = canvasFont(ctx);
  ctx.fillStyle = COLORS.muted;
  ctx.fillText('surface', 8, 16);
  ctx.fillStyle = '#eef4f9';
  ctx.fillText('ocean', 8, ICE_BOTTOM + 22);

  // advance the animation
  if (flood.reachesSurface) {
    if (fillProgress <= flood.maxDistance + 2) fillProgress += 0.35;
    else pulsePhase += 0.18;
  }
}

function animate() {
  draw();
  requestAnimationFrame(animate);
}

// ---------- Controls ----------

slider.oninput = update;
update();
animate();
