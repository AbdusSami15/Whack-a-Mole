// Whack-a-Mole (Canvas) - Mouse + Touch via Pointer Events

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const State = {
  START: "START",
  PLAYING: "PLAYING",
  GAME_OVER: "GAME_OVER",
};

const game = {
  state: State.START,

  score: 0,
  lives: 3,

  durationMs: 60000,
  timeLeftMs: 60000,

  // spawning
  spawnIntervalMsStart: 900,
  spawnIntervalMsMin: 350,
  rampPerSecond: 8,     // ms reduced per second (difficulty scaling)
  moleVisibleMs: 1000,

  nextSpawnMs: 0,

  // grid
  gridRows: 3,
  gridCols: 3,
  holes: [],

  // one active mole at a time (simple & clean). Easy to extend to multiple.
  activeMole: null,

  // timing
  lastTs: 0,
  elapsedMs: 0,
};

function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }
function randInt(min, maxExclusive) { return Math.floor(Math.random() * (maxExclusive - min) + min); }

function resizeToFit() {
  // keep aspect ratio; scale canvas visually, not internal resolution
  const maxW = Math.min(window.innerWidth - 20, 720);
  const maxH = Math.min(window.innerHeight - 20, 900);

  const scale = Math.min(maxW / 720, maxH / 900);
  canvas.style.width = `${Math.floor(720 * scale)}px`;
  canvas.style.height = `${Math.floor(900 * scale)}px`;
}

window.addEventListener("resize", resizeToFit);
resizeToFit();

function buildHoles() {
  game.holes.length = 0;

  const padding = 70;
  const topUI = 120;
  const gridW = canvas.width - padding * 2;
  const gridH = canvas.height - topUI - padding;

  const cellW = gridW / game.gridCols;
  const cellH = gridH / game.gridRows;

  const holeRadius = Math.min(cellW, cellH) * 0.28;

  for (let r = 0; r < game.gridRows; r++) {
    for (let c = 0; c < game.gridCols; c++) {
      const cx = padding + cellW * (c + 0.5);
      const cy = topUI + cellH * (r + 0.55);
      game.holes.push({ cx, cy, r: holeRadius });
    }
  }
}
buildHoles();

function resetRun() {
  game.score = 0;
  game.lives = 3;
  game.timeLeftMs = game.durationMs;

  game.elapsedMs = 0;
  game.activeMole = null;

  game.nextSpawnMs = 0; // spawn quickly after start
}

function startGame() {
  resetRun();
  game.state = State.PLAYING;
}

function endGame() {
  game.state = State.GAME_OVER;
  game.activeMole = null;
}

function getCurrentSpawnIntervalMs() {
  // interval shrinks over time (difficulty scaling)
  const seconds = game.elapsedMs / 1000;
  const reduced = game.spawnIntervalMsStart - seconds * game.rampPerSecond;
  return clamp(reduced, game.spawnIntervalMsMin, game.spawnIntervalMsStart);
}

function spawnMole(ts) {
  if (game.activeMole) return;

  const holeIndex = randInt(0, game.holes.length);
  const hole = game.holes[holeIndex];

  game.activeMole = {
    holeIndex,
    bornTs: ts,
    despawnTs: ts + game.moleVisibleMs,
    hit: false,
    // mole "head" circle slightly above hole center
    mx: hole.cx,
    my: hole.cy - hole.r * 0.25,
    mr: hole.r * 0.55,
  };
}

function missMole() {
  game.lives -= 1;
  if (game.lives <= 0) {
    game.lives = 0;
    endGame();
  }
}

function update(ts) {
  if (!game.lastTs) game.lastTs = ts;
  const dt = ts - game.lastTs;
  game.lastTs = ts;

  if (game.state === State.PLAYING) {
    game.elapsedMs += dt;
    game.timeLeftMs -= dt;

    if (game.timeLeftMs <= 0) {
      game.timeLeftMs = 0;
      endGame();
      return;
    }

    // spawn scheduling
    if (game.nextSpawnMs <= 0) {
      game.nextSpawnMs = getCurrentSpawnIntervalMs();
    } else {
      game.nextSpawnMs -= dt;
      if (game.nextSpawnMs <= 0) {
        spawnMole(ts);
        game.nextSpawnMs = getCurrentSpawnIntervalMs();
      }
    }

    // mole expiry
    if (game.activeMole && ts >= game.activeMole.despawnTs) {
      // if it wasn't hit, lose life
      if (!game.activeMole.hit) missMole();
      game.activeMole = null;
    }
  }
}

function drawRoundedRect(x, y, w, h, r) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // background
  ctx.fillStyle = "#141824";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // top UI bar
  ctx.fillStyle = "rgba(255,255,255,0.06)";
  drawRoundedRect(20, 20, canvas.width - 40, 80, 18);
  ctx.fill();

  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 24px system-ui";
  ctx.textBaseline = "middle";

  ctx.fillText(`Score: ${game.score}`, 40, 60);
  ctx.fillText(`Lives: ${game.lives}`, 240, 60);

  const secs = Math.ceil(game.timeLeftMs / 1000);
  ctx.fillText(`Time: ${secs}`, canvas.width - 170, 60);

  // holes
  for (let i = 0; i < game.holes.length; i++) {
    const h = game.holes[i];

    // outer ring
    ctx.beginPath();
    ctx.arc(h.cx, h.cy, h.r, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255,255,255,0.07)";
    ctx.fill();

    // inner hole
    ctx.beginPath();
    ctx.arc(h.cx, h.cy, h.r * 0.75, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(0,0,0,0.35)";
    ctx.fill();
  }

  // mole
  if (game.activeMole) {
    const m = game.activeMole;

    // subtle pop animation based on lifetime
    const lifeT = (performance.now() - m.bornTs) / 120;
    const pop = clamp(lifeT, 0, 1);

    const y = m.my + (1 - pop) * 22;

    // body
    ctx.beginPath();
    ctx.arc(m.mx, y, m.mr, 0, Math.PI * 2);
    ctx.fillStyle = "#b07a4a";
    ctx.fill();

    // face
    ctx.beginPath();
    ctx.arc(m.mx, y + m.mr * 0.18, m.mr * 0.55, 0, Math.PI * 2);
    ctx.fillStyle = "#d7a679";
    ctx.fill();

    // eyes
    ctx.fillStyle = "#1b1b1b";
    ctx.beginPath();
    ctx.arc(m.mx - m.mr * 0.18, y - m.mr * 0.10, m.mr * 0.07, 0, Math.PI * 2);
    ctx.arc(m.mx + m.mr * 0.18, y - m.mr * 0.10, m.mr * 0.07, 0, Math.PI * 2);
    ctx.fill();
  }

  // overlays
  if (game.state === State.START) drawOverlay("Whack-a-Mole", "Tap / Click to Start");
  if (game.state === State.GAME_OVER) drawOverlay("Game Over", "Tap / Click to Restart");
}

function drawOverlay(title, subtitle) {
  ctx.fillStyle = "rgba(0,0,0,0.55)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  ctx.font = "bold 54px system-ui";
  ctx.fillText(title, canvas.width / 2, canvas.height / 2 - 30);

  ctx.font = "24px system-ui";
  ctx.fillText(subtitle, canvas.width / 2, canvas.height / 2 + 30);

  ctx.textAlign = "left";
}

function canvasToGameCoords(clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  const sx = canvas.width / rect.width;
  const sy = canvas.height / rect.height;
  return {
    x: (clientX - rect.left) * sx,
    y: (clientY - rect.top) * sy,
  };
}

function hitTestMole(x, y) {
  const m = game.activeMole;
  if (!m) return false;

  const dx = x - m.mx;
  const dy = y - m.my;
  const dist2 = dx * dx + dy * dy;
  return dist2 <= m.mr * m.mr;
}

function onPointerDown(e) {
  e.preventDefault();

  const p = canvasToGameCoords(e.clientX, e.clientY);

  if (game.state === State.START) {
    startGame();
    return;
  }

  if (game.state === State.GAME_OVER) {
    startGame();
    return;
  }

  if (game.state !== State.PLAYING) return;

  if (game.activeMole && hitTestMole(p.x, p.y)) {
    game.activeMole.hit = true;
    game.score += 1;

    // remove mole immediately on hit
    game.activeMole = null;
  }
}

canvas.addEventListener("pointerdown", onPointerDown, { passive: false });

function loop(ts) {
  update(ts);
  draw();
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
