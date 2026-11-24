// index.js — small preview pictures for the six cards on the home page.
// Each one is a tiny, quick version of the full demo.

const THUMB_W = 360, THUMB_H = 230;
const thumb = (id) => setupCanvas($(id), THUMB_W, THUMB_H);

// Copy a small grid of colors onto a thumbnail, scaled up with sharp pixels
function paintPixels(ctx, cols, rows, colorOf) {
  const small = document.createElement('canvas');
  small.width = cols;
  small.height = rows;
  const sctx = small.getContext('2d');
  const img = sctx.createImageData(cols, rows);
  for (let i = 0; i < cols * rows; i++) img.data.set([...colorOf(i), 255], i * 4);
  sctx.putImageData(img, 0, 0);
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(small, 0, 0, THUMB_W, THUMB_H);
}

// ---------- 1. Percolation: a crossing cluster with one path in orange ----------
function drawPercolationThumb() {
  const ctx = thumb('thumb-percolation');
  const cols = 21, rows = 12, step = 16.4;
  const left = (THUMB_W - (cols - 1) * step) / 2, top = (THUMB_H - (rows - 1) * step) / 2;
  const pos = (point) => [left + (point % cols) * step, top + Math.floor(point / cols) * step];

  const edges = [];
  for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
    const point = x + y * cols;
    if (x < cols - 1) edges.push([point, point + 1]);
    if (y < rows - 1) edges.push([point, point + cols]);
  }

  // try random samples until one crosses from top to bottom
  let open, find, crossingGroup = null;
  while (crossingGroup === null) {
    open = edges.map(() => Math.random() < 0.54);
    const parent = Array.from({ length: cols * rows }, (_, i) => i);
    find = (a) => (parent[a] === a ? a : (parent[a] = find(parent[a])));
    edges.forEach(([a, b], i) => { if (open[i]) parent[find(a)] = find(b); });
    const topGroups = new Set();
    for (let x = 0; x < cols; x++) topGroups.add(find(x));
    for (let x = 0; x < cols; x++) {
      const g = find(x + (rows - 1) * cols);
      if (topGroups.has(g)) crossingGroup = g;
    }
  }

  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, THUMB_W, THUMB_H);
  ctx.lineCap = 'round';
  edges.forEach(([a, b], i) => {
    if (!open[i]) return;
    const inCluster = find(a) === crossingGroup;
    ctx.strokeStyle = inCluster ? '#9cc3e4' : '#b4c0ca';
    ctx.lineWidth = inCluster ? 2.6 : 2;
    ctx.beginPath();
    ctx.moveTo(...pos(a));
    ctx.lineTo(...pos(b));
    ctx.stroke();
  });

  // breadth-first search for one shortest path
  const neighbours = Array.from({ length: cols * rows }, () => []);
  edges.forEach(([a, b], i) => { if (open[i]) { neighbours[a].push(b); neighbours[b].push(a); } });
  const cameFrom = new Array(cols * rows).fill(undefined);
  const queue = [];
  for (let x = 0; x < cols; x++) { cameFrom[x] = null; queue.push(x); }
  let end = null;
  for (let head = 0; head < queue.length && end === null; head++) {
    const point = queue[head];
    if (point >= cols * (rows - 1)) { end = point; break; }
    for (const next of neighbours[point]) {
      if (cameFrom[next] === undefined) { cameFrom[next] = point; queue.push(next); }
    }
  }
  ctx.strokeStyle = COLORS.warm;
  ctx.lineWidth = 4;
  ctx.lineJoin = 'round';
  ctx.beginPath();
  for (let point = end, first = true; point !== null; point = cameFrom[point], first = false) {
    first ? ctx.moveTo(...pos(point)) : ctx.lineTo(...pos(point));
  }
  ctx.stroke();
}

// ---------- 2. Rule of fives: brine pockets in ice above the ocean ----------
function drawBrineThumb() {
  const ctx = thumb('thumb-brine');
  const iceBottom = 158;
  ctx.fillStyle = '#f6f9fb';
  ctx.fillRect(0, 0, THUMB_W, iceBottom);
  ctx.fillStyle = '#e9eef2';
  ctx.fillRect(0, 0, THUMB_W, 10);
  const ocean = ctx.createLinearGradient(0, iceBottom, 0, THUMB_H);
  ocean.addColorStop(0, '#6e9cc2');
  ocean.addColorStop(1, '#4b7ba3');
  ctx.fillStyle = ocean;
  ctx.fillRect(0, iceBottom, THUMB_W, THUMB_H - iceBottom);

  const cols = 48, rows = 16, cellW = THUMB_W / cols, cellH = (iceBottom - 10) / rows;
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    if (Math.random() > 0.45) continue;
    const connected = Math.random() < 0.25 + 0.6 * (r / rows);   // more connected near the ocean
    ctx.fillStyle = connected ? '#3d84c2' : 'rgba(125,160,192,.5)';
    ctx.beginPath();
    ctx.ellipse((c + 0.5) * cellW + (Math.random() - 0.5) * 2.5, 10 + (r + 0.5) * cellH + (Math.random() - 0.5) * 2,
                1.3 + Math.random(), 2.8 + Math.random() * 1.8, 0, 0, 2 * Math.PI);
    ctx.fill();
  }
}

// ---------- 3. Ising: a quick run near the critical temperature ----------
function drawIsingThumb() {
  const ctx = thumb('thumb-ising');
  const cols = 120, rows = 67, T = 2.3;
  const spin = Array.from({ length: cols * rows }, () => (Math.random() < 0.5 ? 1 : -1));
  for (let k = 0; k < cols * rows * 60; k++) {
    const i = Math.floor(Math.random() * cols * rows), x = i % cols, y = Math.floor(i / cols);
    const sum = spin[((y + 1) % rows) * cols + x] + spin[((y - 1 + rows) % rows) * cols + x]
              + spin[y * cols + (x + 1) % cols] + spin[y * cols + (x - 1 + cols) % cols];
    const deltaE = 2 * spin[i] * sum;
    if (deltaE <= 0 || Math.random() < Math.exp(-deltaE / T)) spin[i] = -spin[i];
  }
  paintPixels(ctx, cols, rows, (i) => (spin[i] > 0 ? [232, 243, 251] : [16, 46, 74]));
}

// ---------- 4. Melt ponds: the neighbour rule on a small grid ----------
function drawPondsThumb() {
  const ctx = thumb('thumb-ponds');
  const cols = 144, rows = 80;
  const normal = () => Math.sqrt(-2 * Math.log(1 - Math.random())) * Math.cos(2 * Math.PI * Math.random());
  const height = Array.from({ length: cols * rows }, normal);
  const water = Array.from({ length: cols * rows }, () => (Math.random() < 0.46 ? 1 : -1));
  for (let k = 0; k < cols * rows * 30; k++) {
    const i = Math.floor(Math.random() * cols * rows), x = i % cols, y = Math.floor(i / cols);
    const sum = water[((y + 1) % rows) * cols + x] + water[((y - 1 + rows) % rows) * cols + x]
              + water[y * cols + (x + 1) % cols] + water[y * cols + (x - 1 + cols) % cols];
    water[i] = sum > 0 ? 1 : sum < 0 ? -1 : (height[i] < 0 ? 1 : -1);
  }
  paintPixels(ctx, cols, rows, (i) => {
    const e = Math.max(-2.5, Math.min(2.5, height[i]));
    return water[i] > 0 ? [22 + e * 7, 128 + e * 12, 196 + e * 9] : [226 + e * 6, 237 + e * 5, 245 + e * 3];
  });
}

// ---------- 5. Ice–albedo: a planet with polar ice caps ----------
function drawAlbedoThumb() {
  const ctx = thumb('thumb-albedo');
  const cx = THUMB_W / 2, cy = THUMB_H / 2, R = 78;
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, THUMB_W, THUMB_H);

  const glow = ctx.createRadialGradient(cx - 70, cy - 60, 5, cx - 70, cy - 60, 90);
  glow.addColorStop(0, 'rgba(255,196,110,.45)');
  glow.addColorStop(1, 'rgba(255,196,110,0)');
  ctx.fillStyle = glow;
  ctx.beginPath(); ctx.arc(cx - 70, cy - 60, 90, 0, 2 * Math.PI); ctx.fill();

  const ocean = ctx.createRadialGradient(cx - 25, cy - 30, 8, cx, cy, R);
  ocean.addColorStop(0, '#8dbadd');
  ocean.addColorStop(1, '#3f74a3');
  ctx.fillStyle = ocean;
  ctx.beginPath(); ctx.arc(cx, cy, R, 0, 2 * Math.PI); ctx.fill();

  ctx.save();
  ctx.beginPath(); ctx.arc(cx, cy, R, 0, 2 * Math.PI); ctx.clip();
  ctx.fillStyle = '#f4f8fb';
  for (const pole of [1, -1]) {
    ctx.beginPath();
    ctx.moveTo(cx - R, cy - pole * R);
    for (let x = cx - R; x <= cx + R; x += 3) ctx.lineTo(x, cy - pole * R * 0.58 + pole * Math.sin(x / 9 + pole) * 2.5);
    ctx.lineTo(cx + R, cy - pole * R);
    ctx.fill();
  }
  ctx.restore();
  ctx.strokeStyle = 'rgba(31,42,51,.15)';
  ctx.beginPath(); ctx.arc(cx, cy, R, 0, 2 * Math.PI); ctx.stroke();
}

// ---------- 6. Fragmentation: a few generations of breaking ----------
function drawFloesThumb() {
  const ctx = thumb('thumb-floes');
  const sea = ctx.createLinearGradient(0, 0, 0, THUMB_H);
  sea.addColorStop(0, '#2d5f8a');
  sea.addColorStop(1, '#1d4669');
  ctx.fillStyle = sea;
  ctx.fillRect(0, 0, THUMB_W, THUMB_H);

  let floes;
  do {   // re-run until the picture has enough pieces to look interesting
    floes = [{ x: 0, y: 0, size: 1, breaking: true }];
    for (let gen = 0; gen < 7; gen++) {
      const next = [];
      for (const f of floes) {
        if (f.breaking && (gen === 0 || Math.random() < 0.75)) {
          const half = f.size / 2;
          for (const [i, j] of [[0, 0], [1, 0], [0, 1], [1, 1]]) {
            next.push({ x: f.x + i * half, y: f.y + j * half, size: half, breaking: true });
          }
        } else {
          f.breaking = false;
          next.push(f);
        }
      }
      floes = next;
    }
  } while (floes.length < 1500);

  for (const f of floes) {
    const w = f.size * THUMB_W, h = f.size * THUMB_H;
    const gap = Math.max(0.4, Math.min(2, Math.min(w, h) * 0.07));
    ctx.fillStyle = f.breaking ? '#8fbfe0' : '#f6fafd';
    ctx.fillRect(f.x * THUMB_W + gap / 2, f.y * THUMB_H + gap / 2, w - gap, h - gap);
  }
}

drawPercolationThumb();
drawBrineThumb();
drawIsingThumb();
drawPondsThumb();
drawAlbedoThumb();
drawFloesThumb();
