// common.js — small helpers shared by every page

// Shortcut for document.getElementById
const $ = (id) => document.getElementById(id);

// Colors used on all pages
const COLORS = {
  ink:    '#1f2a33',
  muted:  '#56616b',
  line:   '#e4e2da',
  grid:   '#f1efe9',
  accent: '#2b7bbf',
  blue:   '#5a9bd5',
  warm:   '#d9774a',
};

// Set up a canvas that we draw on in "logical" units (width × height),
// but that stays sharp on high-resolution screens.
function setupCanvas(canvas, width, height) {
  const scale = Math.min(2, window.devicePixelRatio || 1);
  canvas.width = Math.round(width * scale);
  canvas.height = Math.round(height * scale);
  const ctx = canvas.getContext('2d');
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
  ctx.W = width;
  ctx.H = height;
  return ctx;
}

// The page shrinks or stretches each canvas to fit the screen.
// This returns a font size that still looks about `px` pixels tall on screen.
function canvasFont(ctx, px = 13, weight = '') {
  const c = ctx.canvas;
  let shrink = 1;
  if (c.clientWidth && ctx.W) shrink = Math.min(c.clientWidth / ctx.W, c.clientHeight / ctx.H);
  shrink = Math.max(0.35, Math.min(shrink, 1.3));
  return `${weight}${(px / shrink).toFixed(1)}px -apple-system, "Helvetica Neue", Arial, sans-serif`;
}

// Draw a thin rectangle outline (used as a chart frame)
function strokeBox(ctx, left, top, width, height) {
  ctx.strokeStyle = COLORS.line;
  ctx.lineWidth = 1;
  ctx.strokeRect(left + 0.5, top + 0.5, width, height);
}

// Show negative numbers with a real minus sign: "-5" -> "−5"
const withMinus = (text) => String(text).replace('-', '−');

// Color the part of a slider track that is left of the thumb
function paintSliderTrack(slider) {
  const fraction = (slider.value - slider.min) / (slider.max - slider.min);
  slider.style.setProperty('--fill', fraction * 100 + '%');
}
document.addEventListener('input', (e) => {
  if (e.target.type === 'range') paintSliderTrack(e.target);
});

// Open / close the "About · 说明" dialog
window.addEventListener('load', () => {
  document.querySelectorAll('input[type=range]').forEach(paintSliderTrack);
  const dialog = $('about');
  const button = $('about-button');
  if (!dialog || !button) return;
  button.onclick = () => dialog.classList.add('open');
  dialog.onclick = (e) => {
    if (e.target === dialog || e.target.classList.contains('close')) dialog.classList.remove('open');
  };
});
