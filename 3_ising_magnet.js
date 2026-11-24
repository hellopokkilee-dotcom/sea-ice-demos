// 3_ising_magnet.js — The 2D Ising model with Metropolis updates
//
// Each site holds a spin s = +1 (up) or -1 (down).
// Energy H = -J Σ s_i s_j over neighbouring pairs, with J = 1 and k_B = 1.
// Critical temperature T_c = 2 / ln(1 + √2) ≈ 2.269.

// ---------- Settings ----------

const N = 160;                 // N × N sites, wrapping around at the edges (torus)
const T_CRITICAL = 2.269;
const UP_COLOR = [232, 243, 251];
const DOWN_COLOR = [16, 46, 74];

const slider = $('slider');
const canvas = $('picture');
canvas.width = N;
canvas.height = N;
const ctx = canvas.getContext('2d');
const image = ctx.createImageData(N, N);

// Start with every spin up
const spin = new Int8Array(N * N).fill(1);

// Sum of the 4 neighbours of site i (wrapping around the edges)
function neighbourSum(i) {
  const x = i % N, y = Math.floor(i / N);
  return spin[((y + 1) % N) * N + x]
       + spin[((y - 1 + N) % N) * N + x]
       + spin[y * N + (x + 1) % N]
       + spin[y * N + (x - 1 + N) % N];
}

// ---------- Metropolis: one sweep = N² random flip attempts ----------
// Flipping site i changes the energy by ΔE = 2 · s_i · (neighbour sum).
// Accept the flip if ΔE ≤ 0, otherwise accept with probability exp(-ΔE / T).

function sweep() {
  const T = Number(slider.value);
  const acceptIf4 = Math.exp(-4 / T);    // ΔE can only be 0, 4 or 8 (or negative)
  const acceptIf8 = Math.exp(-8 / T);

  for (let k = 0; k < N * N; k++) {
    const i = Math.floor(Math.random() * N * N);
    const deltaE = 2 * spin[i] * neighbourSum(i);
    if (deltaE <= 0
        || (deltaE === 4 && Math.random() < acceptIf4)
        || (deltaE === 8 && Math.random() < acceptIf8)) {
      spin[i] = -spin[i];
    }
  }
}

// ---------- Drawing ----------

function draw() {
  let total = 0;
  for (let i = 0; i < N * N; i++) {
    const color = spin[i] > 0 ? UP_COLOR : DOWN_COLOR;
    image.data.set([...color, 255], i * 4);
    total += spin[i];
  }
  ctx.putImageData(image, 0, 0);
  $('magnetization').textContent = (Math.abs(total) / (N * N)).toFixed(2);
}

function updateLabels() {
  const T = Number(slider.value);
  $('slider-value').textContent = T.toFixed(2);
  let note;
  if (Math.abs(T - T_CRITICAL) < 0.03) note = 'Critical: clusters of every size.';
  else if (T < T_CRITICAL) note = 'Ordered: most magnets agree.';
  else note = 'Disordered: mostly random.';
  $('phase-note').textContent = note;
}

function animate() {
  sweep();
  draw();
  requestAnimationFrame(animate);
}

// ---------- Controls ----------

slider.oninput = updateLabels;
updateLabels();
animate();
