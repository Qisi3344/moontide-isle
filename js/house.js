/* 月汐小岛 · house.js — 我们的小房子：月白双圆顶小屋，暖窗、木门、吊兰、小火炉和长椅 */
"use strict";
// She tried a Nod-Krai gable-roof version and went back to the domes (2026-10-21), keeping the lived-in bits:
// hanging spider plant, little stove with a kettle, bench. No black anywhere: metal is pale silver, stove pale-blue enamel.
// Mix of her two references: the cosy two-dome cottage shape (arched windows, little balcony, wooden door,
// low stone wall) dressed in the island's moonstone white + pale blue, so the only warm light on the
// whole island is our windows. A small moon crystal on the dome tip and faint blue step lights from the other one.
var house = new THREE.Group();
var hWallM = mat(0xf0f2f8), hTrimM = mat(0xdde3ef), hDomeM = mat(0xd6e3f5), hBaseM = mat(0xc4cde0);
var hWoodM = mat(0x9a6a4b), hWoodDarkM = mat(0x86604a), hIronM = mat(0xaab4c8);
var hClothM = mat(0x6f95cc);
var hWinM = mat(0xffd59a); hWinM.emissive = lc(0xffb35c); hWinM.emissiveIntensity = 0.25;
var hCrystalM = mat(0xe6f2ff); hCrystalM.emissive = lc(0x8cc4ff); hCrystalM.emissiveIntensity = 0.3;
var hStepGlowM = new THREE.MeshBasicMaterial({ color: lc(0x9fd0ff), transparent: true, opacity: 0.2 });

function archShape(w, h) { // rectangle with a round top, base at y=0
  var s = new THREE.Shape(), r = w / 2;
  s.moveTo(-r, 0); s.lineTo(r, 0); s.lineTo(r, h - r); s.absarc(0, h - r, r, 0, Math.PI, false); s.lineTo(-r, 0);
  return s;
}
// an arched window on a wall facing +x: trim frame, warm glass, thin mullions
function archWindow(parent, x, y, z, w, h, door) {
  var g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = Math.PI / 2;
  var fr = new THREE.Mesh(new THREE.ExtrudeGeometry(archShape(w + 0.05, h + 0.035), { depth: 0.025, bevelEnabled: false }), hTrimM);
  fr.position.set(0, -0.025, 0.0); g.add(fr);
  var gl = new THREE.Mesh(new THREE.ShapeGeometry(archShape(w, h)), door ? hWoodM : hWinM); gl.position.z = 0.027; g.add(gl);
  if (door) {
    var port = new THREE.Mesh(new THREE.CircleGeometry(w * 0.2, 14), hWinM); port.position.set(0, h * 0.7, 0.032); g.add(port);
    g.add(mesh(new THREE.BoxGeometry(0.008, h * 0.62, 0.006), hWoodDarkM, -w * 0.18, h * 0.31, 0.031));
    g.add(mesh(new THREE.BoxGeometry(0.008, h * 0.62, 0.006), hWoodDarkM, w * 0.18, h * 0.31, 0.031));
    g.add(mesh(new THREE.SphereGeometry(0.012, 6, 4), hIronM, w * 0.3, h * 0.42, 0.036));
  } else {
    g.add(mesh(new THREE.BoxGeometry(0.012, h * 0.96, 0.006), hTrimM, 0, h * 0.48, 0.031));
    g.add(mesh(new THREE.BoxGeometry(w, 0.012, 0.006), hTrimM, 0, h * 0.5, 0.031));
    g.add(mesh(new THREE.BoxGeometry(w + 0.08, 0.025, 0.05), hTrimM, 0, -0.01, 0.02)); // sill
  }
  parent.add(g); return g;
}
function dome(parent, x, y, z, r) {
  parent.add(mesh(new THREE.CylinderGeometry(r * 1.02, r * 1.05, r * 0.22, 20), hTrimM, x, y + r * 0.11, z)); // drum
  var d = mesh(new THREE.SphereGeometry(r, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2), hDomeM, x, y + r * 0.22, z);
  d.scale.y = 0.82; parent.add(d);
  return y + r * 0.22 + r * 0.82;
}

// ---- main two-storey block ----
var MW = 0.86, MD = 0.74, MH = 1.0;                  // width along z, depth along x, height
house.add(mesh(new THREE.BoxGeometry(MD + 0.08, 0.08, MW + 0.08), hBaseM, 0, 0.04, 0));
house.add(mesh(new THREE.BoxGeometry(MD, MH, MW), hWallM, 0, 0.08 + MH / 2, 0));
house.add(mesh(new THREE.BoxGeometry(MD + 0.07, 0.05, MW + 0.07), hTrimM, 0, 0.08 + MH, 0));   // cornice
house.add(mesh(new THREE.BoxGeometry(MD + 0.03, 0.03, MW + 0.03), hTrimM, 0, 0.08 + MH * 0.52, 0)); // floor band
var top = dome(house, 0, 0.08 + MH + 0.025, 0, 0.36);
// moon crystal on the tip
house.add(mesh(new THREE.ConeGeometry(0.035, 0.08, 6), hTrimM, 0, top + 0.03, 0));
var hCrystal = mesh(new THREE.OctahedronGeometry(0.055, 0), hCrystalM, 0, top + 0.13, 0);
hCrystal.scale.y = 1.6; house.add(hCrystal);
// front (+x): wooden door + big window downstairs, window + balcony upstairs
var FX = MD / 2 + 0.002;
archWindow(house, FX, 0.08, 0.2, 0.22, 0.4, true);
archWindow(house, FX, 0.2, -0.2, 0.24, 0.3);
archWindow(house, FX, 0.66, 0, 0.2, 0.28);
var bal = new THREE.Group(); bal.position.set(FX, 0.62, 0); house.add(bal);
bal.add(mesh(new THREE.BoxGeometry(0.16, 0.035, 0.42), hTrimM, 0.08, 0, 0));
bal.add(mesh(new THREE.BoxGeometry(0.03, 0.02, 0.42), hTrimM, 0.15, 0.13, 0));
for (var bi = 0; bi < 7; bi++) bal.add(mesh(new THREE.BoxGeometry(0.018, 0.11, 0.018), hTrimM, 0.15, 0.07, -0.18 + bi * 0.06));
[-0.15, 0.15].forEach(function (z) { bal.add(mesh(new THREE.BoxGeometry(0.05, 0.08, 0.04), hTrimM, 0.03, -0.05, z)); }); // corbels
[-0.2, 0.2].forEach(function (z) { // side railings back to the wall
  bal.add(mesh(new THREE.BoxGeometry(0.16, 0.02, 0.03), hTrimM, 0.075, 0.13, z));
  [0.035, 0.09].forEach(function (x) { bal.add(mesh(new THREE.BoxGeometry(0.018, 0.11, 0.018), hTrimM, x, 0.07, z)); });
});
// side windows
archWindow(house, 0, 0.66, MW / 2 + 0.002, 0.16, 0.24).rotation.y = 0;

// ---- lower wing with the small dome (toward -z) ----
var WW = 0.56, WD = 0.62, WH = 0.56, WZ = -(MW / 2 + WW / 2 - 0.02);
house.add(mesh(new THREE.BoxGeometry(WD + 0.08, 0.08, WW + 0.06), hBaseM, -0.04, 0.04, WZ));
house.add(mesh(new THREE.BoxGeometry(WD, WH, WW), hWallM, -0.04, 0.08 + WH / 2, WZ));
house.add(mesh(new THREE.BoxGeometry(WD + 0.06, 0.045, WW + 0.06), hTrimM, -0.04, 0.08 + WH, WZ));
dome(house, -0.04, 0.08 + WH + 0.02, WZ, 0.24);
archWindow(house, WD / 2 - 0.04 + 0.002, 0.16, WZ, 0.28, 0.32);

// ---- front steps with faint blue edge lights ----
[0, 1].forEach(function (k) {
  var w = 0.34 - k * 0.04, d = 0.09;
  house.add(mesh(new THREE.BoxGeometry(d, 0.04, w), hBaseM, FX + 0.05 + (1 - k) * 0.08, 0.02 + k * 0.04, 0.2));
  house.add(mesh(new THREE.BoxGeometry(0.012, 0.012, w), hStepGlowM, FX + 0.096 + (1 - k) * 0.08, 0.042 + k * 0.04, 0.2));
});

// ---- warm lantern beside the door ----
var hLantern = new THREE.Group(); hLantern.position.set(FX + 0.04, 0.5, 0.39); house.add(hLantern);
hLantern.add(mesh(new THREE.BoxGeometry(0.06, 0.012, 0.012), hIronM, -0.03, 0.05, 0));
hLantern.add(mesh(new THREE.BoxGeometry(0.035, 0.05, 0.035), hWinM, 0, 0, 0));
hLantern.add(mesh(new THREE.ConeGeometry(0.03, 0.025, 4), hIronM, 0, 0.037, 0));
var hLight = new THREE.PointLight(lc(0xffb867), 0, 2.2, 2); hLight.position.set(FX + 0.35, 0.55, 0); house.add(hLight);

// ---- wooden bench with a blue cushion under the wing window ----
var bench = new THREE.Group(); bench.position.set(WD / 2 - 0.04 + 0.1, 0, WZ - 0.02); house.add(bench);
bench.add(mesh(new THREE.BoxGeometry(0.12, 0.025, 0.34), hWoodM, 0, 0.13, 0));
bench.add(mesh(new THREE.BoxGeometry(0.1, 0.02, 0.28), hClothM, 0.005, 0.152, 0));
[-0.14, 0.14].forEach(function (z) { bench.add(mesh(new THREE.BoxGeometry(0.1, 0.12, 0.025), hWoodDarkM, 0, 0.06, z)); });

// ---- little iron stove with a kettle (warm glow at night) ----
var stove = new THREE.Group(); stove.position.set(0.5, 0, -0.5); house.add(stove);
var hStoveM = mat(0xb4cbe8);
for (var lg = 0; lg < 3; lg++) { var la_ = lg / 3 * Math.PI * 2; stove.add(mesh(new THREE.CylinderGeometry(0.008, 0.01, 0.05, 5), hStoveM, Math.cos(la_) * 0.045, 0.025, Math.sin(la_) * 0.045)); }
stove.add(mesh(new THREE.CylinderGeometry(0.062, 0.058, 0.13, 14), hStoveM, 0, 0.115, 0));
stove.add(mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.014, 14), hIronM, 0, 0.187, 0));
var stoveDoor = mesh(new THREE.CircleGeometry(0.028, 12), hWinM, 0.061, 0.11, 0); stoveDoor.rotation.y = Math.PI / 2; stove.add(stoveDoor);
var kettle = mesh(new THREE.SphereGeometry(0.035, 12, 8), hTrimM, 0, 0.215, 0); kettle.scale.y = 0.75; stove.add(kettle);
var spout = mesh(new THREE.CylinderGeometry(0.004, 0.008, 0.04, 5), hTrimM, 0.035, 0.225, 0); spout.rotation.z = -0.9; stove.add(spout);
var kHandle = mesh(new THREE.TorusGeometry(0.022, 0.004, 4, 10, Math.PI), hIronM, 0, 0.24, 0); stove.add(kHandle);
var stoveLight = new THREE.PointLight(lc(0xffa85a), 0, 0.9, 2); stoveLight.position.set(0.12, 0.15, 0); stove.add(stoveLight);

// ---- hanging spider plant (吊兰) under the balcony (she had the little stone wall by the bench removed, 2026-10-21) ----
var hPlantM = new THREE.MeshToonMaterial({ color: 0xffffff, gradientMap: toonGrad, vertexColors: true, side: THREE.DoubleSide });
function droopLeaf(a, len, up, w) { // a ribbon that arcs up-and-out from the pot rim, then droops down
  var seg = 8, pos = [], col = [], idx = [], cA = Math.cos(a), sA = Math.sin(a), c = new THREE.Color();
  for (var i = 0; i <= seg; i++) {
    var t = i / seg, r = 0.02 + len * t, y = up * Math.sin(t * Math.PI * 0.9) - len * 0.9 * t * t, ww = w * (1 - t * 0.85);
    var x = cA * r, z = sA * r, px = -sA * ww, pz = cA * ww;
    pos.push(x - px, y, z - pz, x + px, y, z + pz);
    c.copy(lc(0x6f9fd8)).lerp(lc(0xf2f7ff), t); col.push(c.r, c.g, c.b, c.r, c.g, c.b);
    if (i < seg) { var k = i * 2; idx.push(k, k + 1, k + 2, k + 1, k + 3, k + 2); }
  }
  var g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
  g.setIndex(idx); g.computeVertexNormals();
  return new THREE.Mesh(g, hPlantM);
}
var hanger = new THREE.Group(); hanger.position.set(FX + 0.11, 0.42, 0.0); house.add(hanger);
var potM = mat(0xe3e8f2), hRunnerM = mat(0x7fa8dc); // runners pale blue, never black
var hPot = mesh(new THREE.CylinderGeometry(0.05, 0.032, 0.05, 12), potM, 0, 0, 0); hanger.add(hPot);
var potRim = mesh(new THREE.TorusGeometry(0.05, 0.006, 4, 16), hTrimM, 0, 0.025, 0); potRim.rotation.x = Math.PI / 2; hanger.add(potRim);
for (var ci = 0; ci < 3; ci++) { // three thin cords up to the balcony slab
  var ca = ci / 3 * Math.PI * 2, cord = mesh(new THREE.CylinderGeometry(0.002, 0.002, 0.19, 3), hIronM, Math.cos(ca) * 0.024, 0.115, Math.sin(ca) * 0.024);
  cord.rotation.z = -Math.cos(ca) * 0.24; cord.rotation.x = Math.sin(ca) * 0.24; hanger.add(cord);
}
for (var li = 0; li < 14; li++) {
  var la = li / 14 * Math.PI * 2 + Math.sin(li * 2.3) * 0.2;
  var lf = droopLeaf(la, 0.07 + (li % 3) * 0.02, 0.05 + (li % 2) * 0.02, 0.008); lf.position.y = 0.02; hanger.add(lf);
}
[[0.6, 0.15], [2.6, 0.2], [4.4, 0.12]].forEach(function (r, k) { // runners trailing down with baby plantlets
  var len = r[1], rx = Math.cos(r[0]) * 0.05, rz = Math.sin(r[0]) * 0.05;
  var run = mesh(new THREE.CylinderGeometry(0.0025, 0.0025, len, 3), hRunnerM, rx, -len / 2, rz); hanger.add(run);
  var baby = new THREE.Group(); baby.position.set(rx, -len, rz); hanger.add(baby);
  for (var b = 0; b < 6; b++) baby.add(droopLeaf(b / 6 * Math.PI * 2 + k, 0.03, 0.025, 0.005));
});
// ---- moon-grass pots on both sides of the steps (she asked to make them nicer, 2026-10-21):
// a rounded moon-white glazed pot with a pale-blue band, a little saucer, warm soil, a full arching
// rosette and three glowing moon-tide buds on thin stems ----
var mpPotM = mat(0xf1f4fa), mpBandM = mat(0x9dbde6), mpSoilM = mat(0xb59a82);
var mpBudM = new THREE.MeshBasicMaterial({ color: lc(0xcfe8ff), transparent: true, opacity: 0.75 });
var mpBuds = [];
var potProfile = [[0, 0], [0.032, 0], [0.042, 0.012], [0.05, 0.035], [0.05, 0.055], [0.044, 0.07], [0.047, 0.078], [0.05, 0.082]]
  .map(function (v) { return new THREE.Vector2(v[0], v[1]); });
[[FX + 0.2, -0.0], [FX + 0.2, 0.42]].forEach(function (q, k) {
  var g = new THREE.Group(); g.position.set(q[0], 0, q[1]); g.rotation.y = k * 1.3; house.add(g);
  g.add(mesh(new THREE.CylinderGeometry(0.056, 0.05, 0.008, 16), hTrimM, 0, 0.004, 0)); // saucer
  g.add(mesh(new THREE.LatheGeometry(potProfile, 18), mpPotM, 0, 0.008, 0));
  g.add(mesh(new THREE.CylinderGeometry(0.0505, 0.0505, 0.012, 18, 1, true), mpBandM, 0, 0.053, 0)); // glazed band
  var rim = mesh(new THREE.TorusGeometry(0.049, 0.005, 5, 18), mpPotM, 0, 0.09, 0); rim.rotation.x = Math.PI / 2; g.add(rim);
  var soil = mesh(new THREE.CircleGeometry(0.045, 16), mpSoilM, 0, 0.084, 0); soil.rotation.x = -Math.PI / 2; g.add(soil);
  for (var i = 0; i < 16; i++) { // arching moon-grass rosette
    var a = i / 16 * Math.PI * 2 + Math.sin(i * 1.7 + k) * 0.25;
    var lf = droopLeaf(a, 0.05 + (i % 3) * 0.018, 0.06 + (i % 2) * 0.03, 0.007); lf.position.y = 0.084; g.add(lf);
  }
  for (var b = 0; b < 3; b++) { // glowing buds on slim stems
    var ba = b / 3 * Math.PI * 2 + k, bh = 0.15 + b * 0.025, bx = Math.cos(ba) * 0.012, bz = Math.sin(ba) * 0.012;
    var stem = mesh(new THREE.CylinderGeometry(0.0018, 0.0022, bh - 0.08, 4), mpBandM, bx, 0.08 + (bh - 0.08) / 2, bz);
    stem.rotation.z = -Math.cos(ba) * 0.12; stem.rotation.x = Math.sin(ba) * 0.12; g.add(stem);
    var bud = mesh(new THREE.SphereGeometry(0.011, 8, 6), mpBudM, bx * 2.2, bh, bz * 2.2); bud.scale.y = 1.4; g.add(bud); mpBuds.push(bud);
  }
});


// ---- 小院: a patio of irregular moon-white flagstones with thin grass seams, plus a stepping-stone path ----
// cells are a jittered-grid Voronoi (each stone = its point's cell, shrunk a little so grass shows between)
var yard = new THREE.Group(); yard.position.set(CX, HC, 0); scene.add(yard);
var flagM = [mat(0xeef0f6), mat(0xe2e6ef), mat(0xd5dbe8)], flagEdgeM = mat(0xc4cbdc);
function yRand(k) { var x = Math.sin(k * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }
(function patio() {
  var R = CR + 0.02, step = 0.26, pts = [];
  for (var gx = -R - step; gx <= R + step; gx += step)
    for (var gz = -R - step; gz <= R + step; gz += step) {
      var k = pts.length + 1;
      pts.push([gx + (yRand(k) - 0.5) * step * 0.7, gz + (yRand(k + 50) - 0.5) * step * 0.7]);
    }
  pts.forEach(function (p, i) {
    if (Math.hypot(p[0], p[1]) > R - 0.1) return;
    var poly = [[p[0] - 0.4, p[1] - 0.4], [p[0] + 0.4, p[1] - 0.4], [p[0] + 0.4, p[1] + 0.4], [p[0] - 0.4, p[1] + 0.4]];
    pts.forEach(function (q, j) {
      if (j === i || Math.abs(q[0] - p[0]) > 0.6 || Math.abs(q[1] - p[1]) > 0.6) return;
      var nx = q[0] - p[0], nz = q[1] - p[1], mx = (p[0] + q[0]) / 2, mz = (p[1] + q[1]) / 2, out = [];
      for (var a = 0; a < poly.length; a++) { // keep the half nearer p
        var A = poly[a], B = poly[(a + 1) % poly.length];
        var da = (A[0] - mx) * nx + (A[1] - mz) * nz, db = (B[0] - mx) * nx + (B[1] - mz) * nz;
        if (da <= 0) out.push(A);
        if ((da <= 0) !== (db <= 0)) { var t = da / (da - db); out.push([A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t]); }
      }
      poly = out;
    });
    if (poly.length < 3) return;
    var cx = 0, cz = 0; poly.forEach(function (v) { cx += v[0]; cz += v[1]; }); cx /= poly.length; cz /= poly.length;
    var sh = new THREE.Shape();
    poly.forEach(function (v, n) { // shrink toward the centre -> grass seams
      var dx = v[0] - cx, dz = v[1] - cz, d = Math.hypot(dx, dz), f = Math.max(0.2, (d - 0.022) / d);
      var X = cx + dx * f, Z = -(cz + dz * f);
      if (n) sh.lineTo(X, Z); else sh.moveTo(X, Z);
    });
    var hgt = 0.022 + yRand(i + 9) * 0.012;
    var g = new THREE.ExtrudeGeometry(sh, { depth: hgt, bevelEnabled: true, bevelThickness: 0.008, bevelSize: 0.01, bevelSegments: 1 });
    g.rotateX(-Math.PI / 2);
    var m = new THREE.Mesh(g, flagM[Math.floor(yRand(i + 3) * 3)]);
    m.position.y = 0.002; yard.add(m);
  });
})();
// stepping stones from the front steps out toward the lagoon side
for (var si = 0; si < 4; si++) {
  var sx = CR + 0.12 + si * 0.25, sz = 0.25 + Math.sin(si * 1.3) * 0.08;
  var wx = CX + sx, wz = sz;
  if (Math.abs(height(wx, wz) - HC) > 0.05) break;
  var ss_ = new THREE.Mesh(new THREE.CylinderGeometry(0.1 - si * 0.008, 0.11 - si * 0.008, 0.03, 9), flagM[si % 3]);
  ss_.scale.z = 0.8; ss_.rotation.y = si * 0.7; ss_.position.set(sx, 0.015, sz); yard.add(ss_);
}
clearing.visible = false; ring.visible = false;   // the patio replaces the old round paving + ring slabs

// ---- big wind-swept moon tree behind the house, back-left (her sketch + render, 2026-10-21) ----
// Thick twisted silver trunk with a wide root flare, leaning out to the left, then arcing hard to the right; five
// limbs fan out from the bend and split into twigs, all streaming right over both domes. The crown is one broad,
// flat, lacy layer of small leaf cards (not clumps), slightly drooping at the right end, with blue glints in it.
var windTree = new THREE.Group(), wtSparkM;
(function () {
  var V = THREE.Vector3, O = new V(-0.7, 0.02, 0.72); // tree origin in house space
  function H(z, y, x) { return new V((x || 0), y - O.y, z - O.z); } // author points in house space (z: + left, - right as seen from the bay)
  var cRidge = new THREE.Color(lc(0xeef1f8)), cGroove = new THREE.Color(lc(0x8f9bb5)), barkM = toonMat(0xffffff);
  barkM.vertexColors = true; barkM.side = THREE.DoubleSide;
  // one seamless tapered tube along a smooth curve, with spiralling bark furrows (2026-10-21: chains of cylinders
  // looked like tofu snapped into blocks, so every limb is one continuous mesh now)
  function tube(cv, radAt, depth, N, M) {
    var fr = cv.computeFrenetFrames(N, false), pos = [], col = [], idx = [], c = new THREE.Color();
    for (var i = 0; i <= N; i++) {
      var t = i / N, P = cv.getPoint(t), Nn = fr.normals[i], B = fr.binormals[i], rad = radAt(t);
      for (var j = 0; j <= M; j++) {
        var th = j / M * Math.PI * 2, tw = th + t * 2.6;
        var fl = Math.sin(tw * 7) * 0.5 + Math.sin(tw * 3 + 1.1) * 0.35 + Math.sin(tw * 11 + t * 9) * 0.15;
        var but = radAt.buttress ? Math.max(0, 1 - t * 5) * Math.max(0, Math.sin(th * 5 + 0.4)) * 0.2 : 0;
        var rr = rad * (1 + depth * fl) + but, cx = Math.cos(th) * rr, cy = Math.sin(th) * rr;
        pos.push(P.x + Nn.x * cx + B.x * cy, P.y + Nn.y * cx + B.y * cy, P.z + Nn.z * cx + B.z * cy);
        c.copy(cGroove).lerp(cRidge, THREE.MathUtils.smoothstep(fl * depth / 0.16, -0.6, 0.5)); col.push(c.r, c.g, c.b);
      }
    }
    for (i = 0; i < N; i++) for (j = 0; j < M; j++) { var a0 = i * (M + 1) + j, a1 = a0 + M + 1; idx.push(a0, a1, a0 + 1, a1, a1 + 1, a0 + 1); }
    var g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
    g.setIndex(idx); g.computeVertexNormals();
    windTree.add(new THREE.Mesh(g, barkM));
  }
  function bough(pts, r0, r1, depth) {
    var cv = new THREE.CatmullRomCurve3(pts);
    tube(cv, function (t) { return r0 + (r1 - r0) * Math.pow(t, 0.8); }, depth || 0.1, 18, 12);
    return cv;
  }
  // trunk, laid out against her picture: leans in from the left corner and bends over at about dome-top height,
  // then runs almost level out to the right above both domes (2026-10-21: the upright version looked like a mound)
  var trunk = new THREE.CatmullRomCurve3([H(0.66, -0.04), H(0.62, 0.45, 0.02), H(0.56, 0.9, -0.02), H(0.42, 1.42, 0.03), H(0.22, 1.8), H(-0.04, 2.02, 0.02), H(-0.3, 2.14)]);
  var trR = function (t) { return (0.1 + 0.11 * Math.pow(1 - t, 2) + 0.14 * Math.pow(Math.max(0, 1 - t * 6), 2)) * (1 + 0.07 * Math.sin(t * 15 + 0.7)); };
  trR.buttress = true;
  tube(trunk, trR, 0.16, 54, 30);
  for (var r = 0; r < 6; r++) { // surface roots
    var ra = r / 6 * Math.PI * 2 + 0.6, rl = 0.42 + (r % 3) * 0.1;
    bough([new V(Math.cos(ra) * 0.15, 0.1, Math.sin(ra) * 0.15), new V(Math.cos(ra + 0.2) * rl * 0.6, 0.03, Math.sin(ra + 0.2) * rl * 0.6), new V(Math.cos(ra) * rl, -0.03, Math.sin(ra) * rl)], 0.08, 0.018, 0.08);
  }
  function at(t) { return trunk.getPoint(t); }
  var tips = { main: [], right: [], left: [] };
  // slender limbs spreading out right under the crown, visible between the leaves like in her picture
  var mains = [
    [at(1), H(-0.55, 2.26, 0.05), H(-0.85, 2.36, 0.1), H(-1.2, 2.3, 0.05)],
    [at(0.96), H(-0.35, 2.36, -0.15), H(-0.6, 2.56, -0.18), H(-0.95, 2.62, -0.12)],
    [at(0.9), H(-0.05, 2.3, 0.18), H(-0.2, 2.55, 0.25), H(-0.4, 2.72, 0.2)],
    [at(0.86), H(0.1, 2.2, -0.2), H(0.05, 2.45, -0.28), H(-0.05, 2.62, -0.25)],
    [at(0.98), H(-0.6, 2.12, -0.05), H(-0.95, 2.1, -0.15), H(-1.25, 2.02, -0.12)]
  ];
  mains.forEach(function (pts, k) {
    var cv = bough(pts, k === 0 ? 0.075 : 0.055, 0.014, 0.1);
    [0.35, 0.6, 0.85].forEach(function (u, j) {
      var s = cv.getPoint(u), e = s.clone().add(new V((j - 1) * 0.16 * (k % 2 ? 1 : -1), 0.14 + 0.04 * j, -0.1 - 0.03 * k));
      bough([s, s.clone().lerp(e, 0.5).add(new V(0.02, 0.03, 0.02)), e], 0.022, 0.006, 0.05); tips.main.push(e, s);
    });
    tips.main.push(pts[pts.length - 1]);
  });
  // the drooping limb on the right, hanging over the little dome
  var dr = bough([H(-0.5, 2.24, 0.05), H(-0.72, 2.0, 0.12), H(-0.86, 1.68, 0.16), H(-0.92, 1.42, 0.18)], 0.04, 0.012, 0.08);
  [0.4, 0.65, 0.85, 1].forEach(function (u) { var s = dr.getPoint(u); tips.right.push(s, s.clone().add(new V(0.05, -0.1, -0.12)), s.clone().add(new V(-0.05, -0.05, 0.1))); });
  // the little limb on the left, just above the bend
  var lf = bough([at(0.62), H(0.5, 1.72, 0.05), H(0.58, 1.9, 0.06), H(0.6, 2.05, 0.04)], 0.04, 0.01, 0.08);
  [0.5, 0.8, 1].forEach(function (u) { var s = lf.getPoint(u); tips.left.push(s, s.clone().add(new V(0, 0.03, 0.1))); });
  // three leaf masses: a broad, fairly flat band up top, a droop at the right, a small tuft at the left; small fine leaves
  var allBlobs = [];
  function mass(list, fill, rad, cnt, seed, sc) {
    var blobs = list.map(function (t) { return [t.x, t.y + 0.04, t.z, rad]; }).concat(fill);
    var cx = 0, cy = 0, cz = 0; blobs.forEach(function (b) { cx += b[0]; cy += b[1]; cz += b[2]; });
    windTree.add(leafCards(blobs, [cx / blobs.length, cy / blobs.length - 0.3, cz / blobs.length], sc, seed, cnt));
    allBlobs = allBlobs.concat(blobs);
  }
  var fillMain = [];
  for (var z = 0.2; z > -1.3; z -= 0.14) for (var xx = -0.3; xx <= 0.31; xx += 0.2) {
    var yy = 2.42 + 0.18 * Math.sin((0.2 - z) / 1.5 * Math.PI) - Math.max(0, -z - 1.0) * 0.5 + Math.sin(z * 7 + xx * 5) * 0.05;
    fillMain.push([xx + Math.sin(z * 9) * 0.05, yy - O.y, z - O.z, 0.17]);
  }
  mass(tips.main, fillMain, 0.15, 2300, 51, 0.42);
  mass(tips.right, [[0.2, 1.7 - O.y, -0.86 - O.z, 0.16], [0.2, 1.45 - O.y, -0.92 - O.z, 0.13]], 0.12, 480, 57, 0.4);
  mass(tips.left, [[0.05, 1.92 - O.y, 0.6 - O.z, 0.15]], 0.11, 200, 60, 0.4);
  // blue glints in the leaves and along the trunk (glow at night)
  var sp = [], rs = 77;
  function R() { rs = (rs * 9301 + 49297) % 233280; return rs / 233280; }
  for (var k = 0; k < 110; k++) { var b = allBlobs[Math.floor(R() * allBlobs.length)]; sp.push(b[0] + (R() - 0.5) * b[3] * 1.6, b[1] + (R() - 0.5) * b[3] * 1.4, b[2] + (R() - 0.5) * b[3] * 1.6); }
  for (k = 0; k < 28; k++) { var q = trunk.getPoint(R()); sp.push(q.x + (R() - 0.5) * 0.24, q.y, q.z + (R() - 0.5) * 0.24); }
  var sg = new THREE.BufferGeometry(); sg.setAttribute("position", new THREE.Float32BufferAttribute(sp, 3));
  wtSparkM = new THREE.PointsMaterial({ color: lc(0x8fd0ff), size: 0.045, transparent: true, opacity: 0.2, depthWrite: false, blending: THREE.AdditiveBlending });
  windTree.add(new THREE.Points(sg, wtSparkM));
  windTree.position.copy(O);
})();
house.add(windTree);

house.position.set(CX - 0.18, HC, 0.05);
scene.add(house);
// tap the house just like the clearing
houseSpot.label = "我们的小房子 ♡";
houseSpot.parts = [house];
houseSpot.anchor = new THREE.Vector3(CX - 0.18, HC + 1.75, 0.05);
house.traverse(function (o) { o.userData.spot = houseSpot; });
tapTargets.push(house);

function updateHouse(t, n) {
  hWinM.emissiveIntensity = lerp(0.25, 1.5, n);
  hCrystalM.emissiveIntensity = lerp(0.3, 1.6, n);
  hStepGlowM.opacity = lerp(0.2, 0.85, n);
  stoveLight.intensity = n * 0.6;
  wtSparkM.opacity = lerp(0.15, 1, n);
  hLight.intensity = n * 1.1;
  hCrystal.rotation.y = t * 0.6 * MM;
  hanger.rotation.z = Math.sin(t * 0.9) * 0.04 * MM; hanger.rotation.x = Math.sin(t * 0.7 + 1) * 0.03 * MM;
  mpBudM.opacity = lerp(0.6, 1, n); mpBuds.forEach(function (b, i) { b.position.y += 0; b.rotation.z = Math.sin(t * 1.1 + i) * 0.15 * MM; });
  hCrystal.position.y = top + 0.13 + Math.sin(t * 1.3) * 0.012 * MM;
}
if (window.Island) { window.Island.house = house; window.Island.yard = yard; }
