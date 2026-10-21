/* 月汐小岛 · magic.js — 魔法：悬浮小石头、月汐水晶、夜里的小水母、萤火光点 */
"use strict";
// ---------- magic: floating rocks, crystal, jellyfish ----------
var magicG = new THREE.Group(); scene.add(magicG);
var MM = reduce ? 0.4 : 1; // motion scale

// a soft round dot texture for all sparkles
var dotTex = (function () {
  var c = document.createElement("canvas"); c.width = c.height = 32;
  var g = c.getContext("2d"), gr = g.createRadialGradient(16, 16, 0, 16, 16, 16);
  gr.addColorStop(0, "rgba(255,255,255,1)"); gr.addColorStop(0.4, "rgba(255,255,255,0.6)"); gr.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = gr; g.fillRect(0, 0, 32, 32);
  return new THREE.CanvasTexture(c);
})();
function dotMat(hex, size) {
  return new THREE.PointsMaterial({ color: lc(hex), size: size, map: dotTex, transparent: true, opacity: 0.5,
    depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: true, fog: false });
}
function rnd(a, b) { return a + Math.random() * (b - a); }

// ---- floating rock islets ----
var fRockM = mat(0xaeb1c3), fGrassM = mat(0x6fae82), fBushM = mat(0x2f5d6e);
var fRocks = [];
[[200, 7.0, 3.2, 0.55], [262, 6.6, 4.6, 0.42], [128, 7.4, 2.6, 0.5], [20, 7.8, 4.0, 0.38]].forEach(function (d, i) {
  var q = polar(d[0], d[1]), g = new THREE.Group(), s = d[3];
  var rg = new THREE.IcosahedronGeometry(s, 0), rp = rg.attributes.position;
  for (var k = 0; k < rp.count; k++) {
    // displace by position (not vertex index) so shared corners move together and faces stay closed
    var x = rp.getX(k), y = rp.getY(k), z = rp.getZ(k);
    rp.setY(k, y > 0 ? y * 0.35 : y * 1.25);              // flat top, pointy bottom
    rp.setX(k, x * (1 + 0.12 * Math.sin(x * 7.1 / s + z * 4.3 / s + i)));
  }
  rg.computeVertexNormals();
  g.add(mesh(rg, fRockM));
  var cap = mesh(new THREE.CylinderGeometry(s * 0.92, s * 0.8, s * 0.16, 7), fGrassM, 0, s * 0.3, 0); g.add(cap);
  if (i % 2 === 0) g.add(mesh(new THREE.IcosahedronGeometry(s * 0.32, 0), fBushM, s * 0.25, s * 0.55, -s * 0.15));
  if (i === 1) {
    g.add(mesh(new THREE.CylinderGeometry(0.025, 0.04, 0.5, 5), barkM, -s * 0.2, s * 0.6, 0));
    for (var l = 0; l < 5; l++) {
      var lf = mesh(new THREE.ConeGeometry(0.07, 0.42, 3), fBushM, -s * 0.2, s * 0.6 + 0.27, 0);
      lf.rotation.set(1.15, l / 5 * Math.PI * 2, 0, "YXZ"); lf.translateY(0.18); g.add(lf);
    }
  }
  g.position.set(q[0], d[2], q[1]);
  // drifting sparkles under each rock
  var n = 10, pos = new Float32Array(n * 3), life = new Float32Array(n);
  for (var p = 0; p < n; p++) { life[p] = Math.random(); }
  var pg = new THREE.BufferGeometry(); pg.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  var pts = new THREE.Points(pg, dotMat(i % 2 ? 0xeaf7f4 : 0xa8ebd9, 0.14));
  magicG.add(g); magicG.add(pts);
  fRocks.push({ g: g, base: d[2], ph: i * 1.7, spin: (i % 2 ? -1 : 1) * rnd(0.08, 0.16), s: s, pts: pts, life: life, kick: -9 });
});

// ---- 月汐水晶 crystal cluster: moonstone white + pale moon blue ----
var crystal = new THREE.Group();
var cLilac = new THREE.MeshStandardMaterial({ color: lc(0xeaf4f3), emissive: lc(0xbfe8ee), emissiveIntensity: 0.3, roughness: 0.2, metalness: 0, flatShading: true, transparent: true, opacity: 0.88 });
var cMint = cLilac.clone(); cMint.color = lc(0xa9cdf6); cMint.emissive = lc(0x8fbaf2);
function prism(h, r, m, x, z, tx, tz) {
  var g = new THREE.Group();
  g.add(mesh(new THREE.CylinderGeometry(r, r * 0.9, h, 6), m, 0, h / 2, 0));
  g.add(mesh(new THREE.ConeGeometry(r, r * 1.6, 6), m, 0, h + r * 0.8, 0));
  g.position.set(x, 0, z); g.rotation.set(tx, 0, tz); crystal.add(g);
}
prism(0.55, 0.11, cLilac, 0, 0, 0, 0);
prism(0.36, 0.08, cMint, 0.13, 0.05, 0.1, -0.35);
prism(0.3, 0.075, cLilac, -0.12, 0.06, -0.15, 0.4);
prism(0.22, 0.06, cMint, 0.02, -0.13, -0.4, 0.05);
prism(0.18, 0.05, cMint, -0.08, -0.08, 0.3, 0.45);
var crystalLight = new THREE.PointLight(lc(0xc8f0ee), 0, 3.2, 2); crystalLight.position.y = 0.45; crystal.add(crystalLight);
ground(crystal, [-3.2, 1.9], -0.03);
var crystalSpot = addSpot(crystal, "月汐水晶", null);
crystalSpot.parts = crystal.children.filter(function (c) { return c.isGroup; });
crystalSpot.anchor = topOf(crystal, 0.2);
// a little burst of sparkles when tapped
var burstN = 18, burstPos = new Float32Array(burstN * 3), burstVel = new Float32Array(burstN * 3);
var burstG = new THREE.BufferGeometry(); burstG.setAttribute("position", new THREE.BufferAttribute(burstPos, 3));
var burst = new THREE.Points(burstG, dotMat(0xe4fbf6, 0.16)); burst.material.opacity = 0; magicG.add(burst);
var burstT = -9, lastCrystalT = -9;
function startBurst() {
  var c = crystal.position;
  for (var b = 0; b < burstN; b++) {
    burstPos[b * 3] = c.x; burstPos[b * 3 + 1] = c.y + 0.45; burstPos[b * 3 + 2] = c.z;
    var a = Math.random() * Math.PI * 2, u = rnd(0.4, 1.4);
    burstVel[b * 3] = Math.cos(a) * u * 0.6; burstVel[b * 3 + 1] = rnd(0.8, 1.8); burstVel[b * 3 + 2] = Math.sin(a) * u * 0.6;
  }
  burstG.attributes.position.needsUpdate = true; burstT = timeU.value;
}

// ---- moon sigil glowing on the lagoon floor ----
var sigilTex = (function () {
  var c = document.createElement("canvas"); c.width = c.height = 256;
  var g = c.getContext("2d"); g.strokeStyle = g.fillStyle = "#fff"; g.lineCap = "round";
  g.lineWidth = 3; g.beginPath(); g.arc(128, 128, 118, 0, Math.PI * 2); g.stroke();
  g.lineWidth = 1.5; g.beginPath(); g.arc(128, 128, 106, 0, Math.PI * 2); g.stroke();
  for (var d = 0; d < 24; d++) { var a = d / 24 * Math.PI * 2; g.beginPath(); g.arc(128 + Math.cos(a) * 112, 128 + Math.sin(a) * 112, d % 6 ? 1.6 : 3, 0, Math.PI * 2); g.fill(); }
  g.beginPath(); g.arc(128, 128, 78, 0, Math.PI * 2); g.arc(150, 112, 66, 0, Math.PI * 2, true); g.fill("evenodd");
  g.beginPath();
  for (var k = 0; k < 8; k++) { var r = k % 2 ? 9 : 40, b = k / 8 * Math.PI * 2 - Math.PI / 2; g[k ? "lineTo" : "moveTo"](168 + Math.cos(b) * r, 104 + Math.sin(b) * r); }
  g.closePath(); g.fill();
  return new THREE.CanvasTexture(c);
})();
var sigilM = new THREE.MeshBasicMaterial({ map: sigilTex, color: lc(0xc4f4ff), transparent: true, opacity: 0.4, depthWrite: false, blending: THREE.AdditiveBlending, fog: false });
var sigil = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 3.2), sigilM);
sigil.rotation.x = -Math.PI / 2; sigil.position.set(2.4, -0.9, 0); sigil.renderOrder = 1; magicG.add(sigil);

// ---- night jellyfish ----
var jellyCols = [0xf7b6d2, 0xa9c8f5, 0xa6eedc];
var domeG = new THREE.SphereGeometry(0.2, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2);
var coreG = new THREE.SphereGeometry(0.09, 8, 5);
var jellies = [];
[[3.6, 0.6], [2.9, -1.4], [-6.4, 2.4], [-1.2, -6.6], [6.2, 4.6], [-5.6, -4.2]].forEach(function (p, i) {
  var col = jellyCols[i % 3], g = new THREE.Group();
  var dm = new THREE.MeshBasicMaterial({ color: lc(col), transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, fog: false });
  var cm = dm.clone();
  var dome = new THREE.Mesh(domeG, dm); g.add(dome);
  var core = new THREE.Mesh(coreG, cm); core.position.y = 0.05; g.add(core);
  var nt = 5, seg = 6, tpos = new Float32Array(nt * seg * 2 * 3);
  var tg = new THREE.BufferGeometry(); tg.setAttribute("position", new THREE.BufferAttribute(tpos, 3));
  var tm = new THREE.LineBasicMaterial({ color: lc(col), transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, fog: false });
  var tl = new THREE.LineSegments(tg, tm); g.add(tl);
  g.position.set(p[0], -0.05, p[1]); g.visible = false;
  magicG.add(g);
  jellies.push({ g: g, dome: dome, mats: [dm, cm, tm], tl: tl, tpos: tpos, nt: nt, seg: seg, x: p[0], z: p[1], ph: i * 1.3, kick: -9, dir: rnd(0, Math.PI * 2) });
});

// ---- fireflies / sparkle motes ----
var flyN = 40, flyPos = new Float32Array(flyN * 3), flySeed = [];
for (var f = 0; f < flyN; f++) {
  var fa = Math.random() * Math.PI * 2, fr = rnd(1.5, 6.5);
  flySeed.push([Math.cos(fa) * fr, rnd(0.4, 2.6), Math.sin(fa) * fr, rnd(0, 10), rnd(0.3, 0.7)]);
}
var flyG = new THREE.BufferGeometry(); flyG.setAttribute("position", new THREE.BufferAttribute(flyPos, 3));
var flies = new THREE.Points(flyG, dotMat(0xfff0b8, 0.11)); magicG.add(flies);
var flyDay = lc(0xfff7e0), flyNight = lc(0xffd27a);

// ---- taps: react to new sea ripples ----
var ripSeen = [-99, -99, -99, -99, -99, -99];
function checkRipples(t) {
  for (var i = 0; i < 6; i++) {
    var r = rip[i];
    if (r.w > 0 && r.z !== ripSeen[i]) {
      ripSeen[i] = r.z;
      fRocks.forEach(function (o) { if (Math.hypot(o.g.position.x - r.x, o.g.position.z - r.y) < 3.2) o.kick = t; });
      jellies.forEach(function (j) { if (Math.hypot(j.g.position.x - r.x, j.g.position.z - r.y) < 2.2) j.kick = t; });
    }
  }
}

// ---- per frame ----
function updateMagic(dt, t, n) {
  checkRipples(t);
  sigil.rotation.z = t * 0.03 * MM;
  sigilM.opacity = lerp(0.35, 0.95, n) * (0.88 + 0.12 * Math.sin(t * 1.2));
  // floating rocks
  fRocks.forEach(function (o) {
    var a = t - o.kick, k = a >= 0 && a < 2.5 ? Math.sin(a * 6) * Math.exp(-1.8 * a) * 0.35 : 0;
    o.g.position.y = o.base + (Math.sin(t * 0.6 + o.ph) * 0.25 + k) * MM;
    o.g.rotation.y += o.spin * dt * MM;
    var pa = o.pts.geometry.attributes.position, arr = pa.array;
    for (var p = 0; p < o.life.length; p++) {
      o.life[p] += dt * 0.35;
      if (o.life[p] > 1) o.life[p] -= 1;
      var L = o.life[p], ang = p * 2.39996;
      arr[p * 3] = o.g.position.x + Math.cos(ang) * o.s * 0.5 * (1 + L * 0.4);
      arr[p * 3 + 1] = o.g.position.y - o.s * 0.8 - L * 1.4;
      arr[p * 3 + 2] = o.g.position.z + Math.sin(ang) * o.s * 0.5 * (1 + L * 0.4);
    }
    pa.needsUpdate = true;
    o.pts.material.opacity = lerp(0.35, 0.85, n);
  });
  // crystal: breathing glow, tap burst
  var pulse = 0.85 + 0.15 * Math.sin(t * 1.6);
  cLilac.emissiveIntensity = lerp(0.25, 1.5, n) * pulse;
  cMint.emissiveIntensity = lerp(0.25, 1.4, n) * (0.85 + 0.15 * Math.sin(t * 1.6 + 1.2));
  crystalLight.intensity = n * 1.3 * pulse;
  if (crystalSpot.t !== lastCrystalT) { lastCrystalT = crystalSpot.t; startBurst(); }
  var ba = t - burstT;
  if (ba >= 0 && ba < 1.2) {
    for (var b = 0; b < burstN; b++) {
      burstVel[b * 3 + 1] -= 2.2 * dt;
      burstPos[b * 3] += burstVel[b * 3] * dt; burstPos[b * 3 + 1] += burstVel[b * 3 + 1] * dt; burstPos[b * 3 + 2] += burstVel[b * 3 + 2] * dt;
    }
    burstG.attributes.position.needsUpdate = true;
    burst.material.opacity = 1 - ba / 1.2;
  } else burst.material.opacity = 0;
  // jellyfish
  var vis = n > 0.01;
  jellies.forEach(function (j) {
    j.g.visible = vis;
    if (!vis) return;
    var a = t - j.kick, kk = a >= 0 && a < 1.2 ? Math.sin(a * 10) * Math.exp(-3 * a) : 0;
    var beat = Math.sin(t * 2.2 + j.ph);
    j.dome.scale.set(1 + 0.08 * beat * MM + 0.25 * kk, 1 - 0.12 * beat * MM - 0.3 * kk, 1 + 0.08 * beat * MM + 0.25 * kk);
    var dx = Math.cos(j.dir + t * 0.05) * 0.35, dz = Math.sin(j.dir + t * 0.05) * 0.35;
    j.g.position.set(j.x + dx * Math.sin(t * 0.13 + j.ph) * MM, -0.08 + 0.06 * Math.sin(t * 1.1 + j.ph) * MM + 0.12 * kk, j.z + dz * Math.cos(t * 0.11 + j.ph) * MM);
    var op = n * (0.55 + 0.2 * Math.max(0, beat));
    j.mats[0].opacity = op; j.mats[1].opacity = Math.min(1, op * 1.2); j.mats[2].opacity = op * 0.8;
    var tp = j.tpos, w = 0;
    for (var q = 0; q < j.nt; q++) {
      var ang = q / j.nt * Math.PI * 2, cx = Math.cos(ang) * 0.12, cz = Math.sin(ang) * 0.12;
      var px = cx, py = 0, pz = cz;
      for (var s = 1; s <= j.seg; s++) {
        var yy = -s * 0.07, sw = Math.sin(t * 2.6 - s * 0.8 + q + j.ph) * 0.035 * s / j.seg * MM;
        var nx = cx * (1 - s * 0.06) + sw, nz = cz * (1 - s * 0.06) + sw * 0.6;
        tp[w++] = px; tp[w++] = py; tp[w++] = pz; tp[w++] = nx; tp[w++] = yy; tp[w++] = nz;
        px = nx; py = yy; pz = nz;
      }
    }
    j.tl.geometry.attributes.position.needsUpdate = true;
  });
  // fireflies
  for (var f = 0; f < flyN; f++) {
    var sd = flySeed[f], tt = t * sd[4] * MM + sd[3];
    flyPos[f * 3] = sd[0] + Math.sin(tt) * 0.5;
    flyPos[f * 3 + 1] = sd[1] + Math.sin(tt * 1.7) * 0.25;
    flyPos[f * 3 + 2] = sd[2] + Math.cos(tt * 0.9) * 0.5;
  }
  flyG.attributes.position.needsUpdate = true;
  flies.material.opacity = lerp(0.18, 0.95, n) * (0.8 + 0.2 * Math.sin(t * 3));
  flies.material.color.copy(flyDay).lerp(flyNight, n);
}
