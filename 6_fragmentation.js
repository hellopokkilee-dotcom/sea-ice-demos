// 6_fragmentation.js — Random fragmentation of ice floes
//
// Start with one big floe. The first floe always breaks into 4.
// After that, each floe that is still breaking splits into 4 equal pieces
// with probability p, or stops breaking for good with probability 1 − p.
// This is a branching process with mean 4p, so it is critical at p = 1/4.

// ---------- Settings ----------

const SIZE = 640;
const MAX_GENERATIONS = 8;           // smallest floe = 1/256 of the side
const GENERATION_DELAY = 650;        // milliseconds between generations
const BREAKING_COLOR = '#8fbfe0';
const STOPPED_COLOR = '#f6fafd';

const slider = $('slider');
const ctx = setupCanvas($('picture'), SIZE, SIZE);

// A floe is a square: position (x, y) and size, all as fractions of the whole picture.
let floes = [];
let generation = 0;
let timer = null;
let crackStart = 0;                  // time the latest split happened (for the animation)

// ---------- One generation ----------

function nextGeneration() {
  const p = Number(slider.value);
  const next = [];
  for (const floe of floes) {
    if (!floe.breaking) { next.push(floe); continue; }

    const breaks = generation === 0 || Math.random() < p;
    if (!breaks) {
      floe.breaking = false;          // stops for good
      next.push(floe);
      continue;
    }
    const half = floe.size / 2;
    const atSmallestSize = generation + 1 >= MAX_GENERATIONS;
    for (const [i, j] of [[0, 0], [1, 0], [0, 1], [1, 1]]) {
      next.push({ x: floe.x + i * half, y: floe.y + j * half, size: half,
                  breaking: !atSmallestSize, born: generation + 1 });
    }
  }
  floes = next;
  generation++;
  crackStart = performance.now();
  animateCracks();
  return floes.some((f) => f.breaking);
}

// ---------- Running ----------

function start() {
  clearTimeout(timer);
  floes = [{ x: 0, y: 0, size: 1, breaking: true, born: 0 }];
  generation = 0;
  draw(1);
  timer = setTimeout(run, 600);
}

function run() {
  if (nextGeneration()) timer = setTimeout(run, GENERATION_DELAY);
}

// ---------- Drawing ----------

function animateCracks() {
  const progress = Math.min(1, (performance.now() - crackStart) / 400);
  draw(progress);
  if (progress < 1) requestAnimationFrame(animateCracks);
}

// crackProgress goes 0 → 1: new cracks open up smoothly
function draw(crackProgress) {
  ctx.fillStyle = '#2a5a84';              // sea
  ctx.fillRect(0, 0, SIZE, SIZE);
  const margin = 2, area = SIZE - 2 * margin;

  for (const floe of floes) {
    const sidePx = floe.size * area;
    const isNew = floe.born === generation && generation > 0;
    let gap = sidePx < 5 ? 0 : Math.min(2.2, Math.max(0.6, sidePx * 0.07));
    if (isNew) gap *= crackProgress;
    ctx.fillStyle = floe.breaking ? BREAKING_COLOR : STOPPED_COLOR;
    ctx.fillRect(margin + floe.x * area + gap / 2, margin + floe.y * area + gap / 2,
                 Math.max(0.4, sidePx - gap), Math.max(0.4, sidePx - gap));
  }

  const stillBreaking = floes.filter((f) => f.breaking).length;
  $('floe-count').textContent = floes.length.toLocaleString('en-US');
  $('slider-value').textContent = Number(slider.value).toFixed(2);
  $('floe-label').textContent =
    generation === 0 ? 'Number of floes'
    : stillBreaking ? `Number of floes · generation ${generation}`
    : `Number of floes · finished after ${generation} generations`;
}

// ---------- Controls ----------

slider.oninput = () => { $('slider-value').textContent = Number(slider.value).toFixed(2); };
slider.onchange = start;             // on release: start a new run
$('run-again').onclick = start;
start();
