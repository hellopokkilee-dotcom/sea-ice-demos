// 4_melt_ponds.js — Zero-temperature random-field Ising model for melt ponds
// (Ma, Sudakov, Strong & Golden, New J. Phys. 2019)
//
// Each 1 m × 1 m site is water (+1) or ice (-1) and has a random surface height h.
// Left panel, the model:  follow the majority of the 4 neighbours;
//                          on a 2–2 tie, low sites (h < 0) become water.
// Right panel, height only: each site just follows its own height.
// A run stops when a full sweep changes nothing: a metastable state.

// ---------- Settings ----------

const N = 160;                   // N × N sites, wrapping around at the edges
const BIG_POND = 100;            // ponds larger than 100 m² are drawn darker
const WIDTH = 1000, HEIGHT = 530, PANEL = 480;
const SWEEP_DELAY = 130;         // milliseconds between sweeps (slow on purpose)

const WATER = 1, ICE = -1;

const slider = $('slider');
const ctx = setupCanvas($('picture'), WIDTH, HEIGHT);

const height = new Float32Array(N * N);
const model = new Int8Array(N * N);        // left panel
const heightOnly = new Int8Array(N * N);   // right panel
const order = Array.from({ length: N * N }, (_, i) => i);

let sweepCount = 0;
let timer = null;

// Standard normal random number (Box–Muller)
function randomNormal() {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

function shuffle(list) {
  for (let i = list.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [list[i], list[j]] = [list[j], list[i]];
  }
}

function neighbours(i) {
  const x = i % N, y = Math.floor(i / N);
  return [((y + 1) % N) * N + x, ((y - 1 + N) % N) * N + x,
          y * N + (x + 1) % N,   y * N + (x - 1 + N) % N];
}

// ---------- The rules ----------

function modelRule(state, i) {
  const sum = neighbours(i).reduce((s, j) => s + state[j], 0);
  if (sum > 0) return WATER;                 // 3 or 4 water neighbours
  if (sum < 0) return ICE;                   // 3 or 4 ice neighbours
  return height[i] < 0 ? WATER : ICE;        // 2–2 tie: follow the height
}

function heightRule(state, i) {
  return height[i] < 0 ? WATER : ICE;
}

// One sweep: visit every site once, in a random order. Returns how many changed.
function sweep(state, rule) {
  shuffle(order);
  let changed = 0;
  for (const i of order) {
    const next = rule(state, i);
    if (next !== state[i]) { state[i] = next; changed++; }
  }
  return changed;
}

// ---------- Running ----------

function start() {
  clearTimeout(timer);
  const waterFraction = Number(slider.value);
  for (let i = 0; i < N * N; i++) {
    height[i] = randomNormal();
    model[i] = heightOnly[i] = Math.random() < waterFraction ? WATER : ICE;
  }
  sweepCount = 0;
  draw();
  timer = setTimeout(step, 500);
}

function step() {
  const changed = sweep(model, modelRule) + sweep(heightOnly, heightRule);
  sweepCount++;
  draw();
  if (changed > 0 && sweepCount < 500) timer = setTimeout(step, SWEEP_DELAY);
}

// ---------- Pond sizes (to colour big ponds) ----------
// Label each connected group of water cells and count its cells (1 cell = 1 m²).

function bigPondCells(state) {
  const pondId = new Int32Array(N * N).fill(-1);
  const pondSize = [];
  for (let start = 0; start < N * N; start++) {
    if (state[start] !== WATER || pondId[start] >= 0) continue;
    const id = pondSize.length;
    let size = 0;
    const stack = [start];
    pondId[start] = id;
    while (stack.length) {
      const i = stack.pop();
      size++;
      for (const j of neighbours(i)) {
        if (state[j] === WATER && pondId[j] < 0) { pondId[j] = id; stack.push(j); }
      }
    }
    pondSize.push(size);
  }
  return (i) => pondId[i] >= 0 && pondSize[pondId[i]] > BIG_POND;
}

// ---------- Drawing ----------

const panels = [document.createElement('canvas'), document.createElement('canvas')];
panels.forEach((c) => { c.width = N; c.height = N; });

// Paint one panel pixel by pixel; returns the water fraction.
function paintPanel(state, panel, markBigPonds) {
  const isBig = markBigPonds ? bigPondCells(state) : () => false;
  const pctx = panel.getContext('2d');
  const img = pctx.createImageData(N, N);
  let water = 0;
  for (let i = 0; i < N * N; i++) {
    const e = Math.max(-2.5, Math.min(2.5, height[i]));   // shading from the height
    let rgb;
    if (state[i] === WATER) {
      water++;
      rgb = isBig(i) ? [11 + e * 6, 79 + e * 12, 138 + e * 12]
                     : [52 + e * 12, 142 + e * 16, 210 + e * 10];
    } else {
      rgb = [222 + e * 13, 233 + e * 10, 243 + e * 5];
    }
    img.data.set([...rgb, 255], i * 4);
  }
  pctx.putImageData(img, 0, 0);
  return water / (N * N);
}

function draw() {
  ctx.fillStyle = '#f7f6f2';
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  const waterModel = paintPanel(model, panels[0], true);
  const waterHeight = paintPanel(heightOnly, panels[1], false);

  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(panels[0], 10, 40, PANEL, PANEL);
  ctx.drawImage(panels[1], WIDTH - 10 - PANEL, 40, PANEL, PANEL);
  ctx.font = canvasFont(ctx, 14, '600 ');
  ctx.fillStyle = COLORS.ink;
  ctx.fillText('Neighbour rule (the model)', 10, 26);
  ctx.fillText('Height only', WIDTH - 10 - PANEL, 26);

  $('water-model').textContent = Math.round(waterModel * 100) + '%';
  $('water-height').textContent = Math.round(waterHeight * 100) + '%';
}

// ---------- Controls ----------

function showSliderValue() {
  $('slider-value').textContent = Math.round(slider.value * 100) + '%';
}
slider.oninput = showSliderValue;   // while dragging: just update the number
slider.onchange = start;            // on release: start a new run

showSliderValue();
start();
