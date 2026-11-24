// 1_percolation.js — Bond percolation on a square lattice
//
// Every edge of an N × N grid is open with probability p.
// Question: is there a path of open edges from the top row to the bottom row?

// ---------- Settings ----------

const N = 30;                              // the grid has N × N points
const CANVAS_SIZE = 640;
const MARGIN = 36;
const SPACING = (CANVAS_SIZE - 2 * MARGIN) / (N - 1);

const slider = $('slider');

// ---------- The grid ----------
// Points are numbered row by row: point = x + y * N.
// Each edge joins two neighbouring points: [a, b].

const edges = [];
for (let y = 0; y < N; y++) {
  for (let x = 0; x < N; x++) {
    const point = x + y * N;
    if (x < N - 1) edges.push([point, point + 1]);   // edge to the right
    if (y < N - 1) edges.push([point, point + N]);   // edge downward
  }
}

// ---------- Randomness ----------
// Each edge gets ONE uniform random number U in [0, 1).
// The edge is open when U < p.
// Moving the slider only changes p, so the same random sample just gains
// edges as p grows. (This is the standard monotone coupling.)

let U = [];

function drawNewSample() {
  U = edges.map(() => Math.random());
}

function isOpen(edgeIndex, p) {
  return U[edgeIndex] < p;
}

// ---------- Which points are connected? (union-find) ----------
// Start with every point in its own group. For each open edge,
// merge the groups of its two ends. Returns find(point) -> group id.

function findGroups(p) {
  const parent = Array.from({ length: N * N }, (_, i) => i);

  function find(a) {
    while (parent[a] !== a) {
      parent[a] = parent[parent[a]];   // path halving keeps trees short
      a = parent[a];
    }
    return a;
  }

  edges.forEach(([a, b], i) => {
    if (isOpen(i, p)) parent[find(a)] = find(b);
  });
  return find;
}

// Groups that touch both the top row and the bottom row
function findCrossingGroups(find) {
  const topGroups = new Set();
  for (let x = 0; x < N; x++) topGroups.add(find(x));

  const crossing = new Set();
  for (let x = 0; x < N; x++) {
    const group = find(x + (N - 1) * N);
    if (topGroups.has(group)) crossing.add(group);
  }
  return crossing;
}

// ---------- One shortest top-to-bottom path (breadth-first search) ----------
// Start from every top point at once and spread out along open edges.
// The first bottom point we reach gives a shortest path; walk back to draw it.

function findShortestPath(p) {
  const neighbours = Array.from({ length: N * N }, () => []);
  edges.forEach(([a, b], i) => {
    if (isOpen(i, p)) {
      neighbours[a].push(b);
      neighbours[b].push(a);
    }
  });

  const cameFrom = new Array(N * N).fill(undefined);
  const queue = [];
  for (let x = 0; x < N; x++) {
    cameFrom[x] = null;          // null = "starting point"
    queue.push(x);
  }

  for (let head = 0; head < queue.length; head++) {
    const point = queue[head];
    if (point >= N * (N - 1)) {  // reached the bottom row
      const path = [];
      for (let p2 = point; p2 !== null; p2 = cameFrom[p2]) path.push(p2);
      return path;
    }
    for (const next of neighbours[point]) {
      if (cameFrom[next] === undefined) {
        cameFrom[next] = point;
        queue.push(next);
      }
    }
  }
  return null;                   // no path
}

// ---------- Drawing ----------

const ctx = setupCanvas($('picture'), CANVAS_SIZE, CANVAS_SIZE);
const screenX = (point) => MARGIN + (point % N) * SPACING;
const screenY = (point) => MARGIN + Math.floor(point / N) * SPACING;

function strokeEdges(edgeList, color, width) {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  ctx.beginPath();
  for (const [a, b] of edgeList) {
    ctx.moveTo(screenX(a), screenY(a));
    ctx.lineTo(screenX(b), screenY(b));
  }
  ctx.stroke();
}

function draw() {
  const p = Number(slider.value);
  const find = findGroups(p);
  const crossingGroups = findCrossingGroups(find);
  const crosses = crossingGroups.size > 0;

  // background, plus a bar marking the top row and the bottom row
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
  ctx.fillStyle = '#c9d6e1';
  ctx.fillRect(MARGIN - 6, MARGIN - 20, CANVAS_SIZE - 2 * MARGIN + 12, 7);
  ctx.fillRect(MARGIN - 6, CANVAS_SIZE - MARGIN + 13, CANVAS_SIZE - 2 * MARGIN + 12, 7);

  // grid points
  ctx.fillStyle = '#d5dbe0';
  for (let point = 0; point < N * N; point++) {
    ctx.beginPath();
    ctx.arc(screenX(point), screenY(point), 1.5, 0, 2 * Math.PI);
    ctx.fill();
  }

  // open edges: grey if not part of a crossing cluster, light blue if they are
  const openEdges = edges.filter((_, i) => isOpen(i, p));
  const inCrossing = ([a]) => crossingGroups.has(find(a));
  strokeEdges(openEdges.filter((e) => !inCrossing(e)), '#b4c0ca', 2.4);
  strokeEdges(openEdges.filter(inCrossing), '#9cc3e4', 3);

  // one shortest path in orange
  if (crosses) {
    const path = findShortestPath(p);
    ctx.strokeStyle = COLORS.warm;
    ctx.lineWidth = 5;
    ctx.lineJoin = 'round';
    ctx.beginPath();
    path.forEach((point, i) => {
      if (i === 0) ctx.moveTo(screenX(point), screenY(point));
      else ctx.lineTo(screenX(point), screenY(point));
    });
    ctx.stroke();
  }

  // readout
  $('slider-value').textContent = p.toFixed(2);
  $('result').textContent = crosses ? 'Connected' : 'Not connected';
  $('result').style.color = crosses ? COLORS.accent : COLORS.ink;
  $('result-note').textContent = crosses
    ? 'An open path joins top and bottom.'
    : 'No open path from top to bottom.';
}

// ---------- Controls ----------

slider.oninput = draw;
$('new-sample').onclick = () => {
  drawNewSample();
  draw();
};

drawNewSample();
draw();
