/* 月汐小岛 · house.js — 我们的小房子：挪德卡莱味的月白石屋，陡坡蓝石瓦屋顶，暖窗、木门、小火炉 */
"use strict";
// Style (her ask 2026-10-21): Genshin Nod-Krai / Frostmoon Scions feel — Nordic-Slavic cottage, NOT a temple.
// Moon-white stone walls, steep blue-slate gable roofs, silver-fir beams, a carved crescent in the front gable,
// a blue cloth awning, a bench, a little iron stove with a kettle, a hanging spider plant and moon-grass pots.
// Mix of her two references: the cosy two-dome cottage shape (arched windows, little balcony, wooden door,
// low stone wall) dressed in the island's moonstone white + pale blue, so the only warm light on the
// whole island is our windows. A small moon crystal on the dome tip and faint blue step lights from the other one.
var house = new THREE.Group();
var hWallM = mat(0xf0f2f8), hTrimM = mat(0xdde3ef), hDomeM = mat(0xd6e3f5), hBaseM = mat(0xc4cde0);
var hWoodM = mat(0x9a6a4b), hWoodDarkM = mat(0x6f4a35), hIronM = mat(0x5d6478);
var hBeamM = mat(0xb3a28d), hClothM = mat(0x6f95cc), hClothLightM = mat(0xeef3fb);
var slateTex = (function () { // overlapping rounded slate rows
  var c = document.createElement("canvas"); c.width = c.height = 128; var x = c.getContext("2d");
  x.fillStyle = "#8ea6c7"; x.fillRect(0, 0, 128, 128);
  for (var r = 0; r < 8; r++) for (var k = -1; k < 9; k++) {
    var cx = k * 16 + (r % 2) * 8, cy = r * 16 + 16;
    x.fillStyle = (r + k) % 3 ? "#8ea6c7" : "#9ab1d0";
    x.beginPath(); x.moveTo(cx - 8, cy - 16); x.lineTo(cx - 8, cy - 6); x.arc(cx, cy - 6, 8, Math.PI, 0, true); x.lineTo(cx + 8, cy - 16); x.fill();
    x.strokeStyle = "#6c82a8"; x.lineWidth = 1.5; x.beginPath(); x.arc(cx, cy - 6, 8, Math.PI, 0, true); x.stroke();
  }
  var t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.encoding = THREE.sRGBEncoding; return t;
})();
function slateMat(rx, ry) { var m = toonMat(0xffffff), t = slateTex.clone(); t.needsUpdate = true; t.repeat.set(rx, ry); m.map = t; return m; }
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
// steep gable roof, ridge along x: slate slabs + a wall-coloured attic prism underneath. returns ridge height
function gableRoof(parent, x, y, z, len, span, h, ov, rx) {
  var half = span / 2, s = half + ov, L = Math.hypot(s, h), a = Math.atan2(h, s);
  var tri = new THREE.Shape(); tri.moveTo(-half, 0); tri.lineTo(half, 0); tri.lineTo(0, h * (1 - ov / s) + ov * h / s - 0.01); tri.lineTo(-half, 0);
  var prism = new THREE.Mesh(new THREE.ExtrudeGeometry(tri, { depth: len, bevelEnabled: false }), hWallM);
  prism.rotation.y = Math.PI / 2; prism.position.set(x - len / 2, y, z); parent.add(prism);
  var sm = slateMat(rx || 4, 3);
  [1, -1].forEach(function (sg) {
    var slab = mesh(new THREE.BoxGeometry(len + ov * 2, 0.04, L), sm, x, y + h / 2 + Math.cos(a) * 0.02, z + sg * (s / 2) + sg * Math.sin(a) * 0.02);
    slab.rotation.x = sg * a; parent.add(slab);
  });
  parent.add(mesh(new THREE.BoxGeometry(len + ov * 2 + 0.02, 0.035, 0.05), hTrimM, x, y + h + 0.035, z)); // ridge cap
  return { top: y + h + 0.05, a: a, s: s, L: L };
}
// ---- main two-storey block ----
var MW = 0.86, MD = 0.74, MH = 1.0;                  // width along z, depth along x, height
house.add(mesh(new THREE.BoxGeometry(MD + 0.08, 0.08, MW + 0.08), hBaseM, 0, 0.04, 0));
house.add(mesh(new THREE.BoxGeometry(MD, MH, MW), hWallM, 0, 0.08 + MH / 2, 0));
house.add(mesh(new THREE.BoxGeometry(MD + 0.07, 0.05, MW + 0.07), hTrimM, 0, 0.08 + MH, 0));   // cornice
house.add(mesh(new THREE.BoxGeometry(MD + 0.03, 0.03, MW + 0.03), hTrimM, 0, 0.08 + MH * 0.52, 0)); // floor band
var RB = 0.08 + MH + 0.025, RH = 0.5, ROV = 0.08;
var mainRoof = gableRoof(house, 0, RB, 0, MD, MW, RH, ROV, 4);
var top = mainRoof.top;
// front gable: silver-fir bargeboards with crossed carved tips at the peak (Nordic), attic round window, carved crescent
var GX = MD / 2 + ROV + 0.005;
[1, -1].forEach(function (sg) {
  var bb = mesh(new THREE.BoxGeometry(0.03, 0.05, mainRoof.L + 0.02), hBeamM, GX, RB + RH / 2 + 0.03, sg * mainRoof.s / 2);
  bb.rotation.x = sg * mainRoof.a; house.add(bb);
  var horn = mesh(new THREE.BoxGeometry(0.028, 0.032, 0.2), hBeamM, GX, RB + RH + 0.08, -sg * 0.06);
  horn.rotation.x = -sg * mainRoof.a; house.add(horn);
});
var attic = new THREE.Group(); attic.position.set(MD / 2 + 0.003, RB, 0); attic.rotation.y = Math.PI / 2; house.add(attic);
attic.add(mesh(new THREE.CircleGeometry(0.085, 18), hTrimM, 0, 0.17, 0));
attic.add(mesh(new THREE.CircleGeometry(0.065, 18), hWinM, 0, 0.17, 0.004));
attic.add(mesh(new THREE.BoxGeometry(0.008, 0.13, 0.004), hTrimM, 0, 0.17, 0.008));
attic.add(mesh(new THREE.BoxGeometry(0.13, 0.008, 0.004), hTrimM, 0, 0.17, 0.008));
var hMoonCarveM = new THREE.MeshBasicMaterial({ color: lc(0x9fd0ff), transparent: true, opacity: 0.4 });
var gCrescent = mesh(crescentGeo, hMoonCarveM, 0, 0.34, 0.004); gCrescent.scale.setScalar(0.35); attic.add(gCrescent);
// silver-fir corner posts on the upper floor
[[1, 1], [1, -1]].forEach(function (c) { house.add(mesh(new THREE.BoxGeometry(0.04, MH * 0.48, 0.04), hBeamM, c[0] * (MD / 2), 0.08 + MH * 0.76, c[1] * (MW / 2))); });
// small moon crystal floating just above the front peak
var hCrystal = mesh(new THREE.OctahedronGeometry(0.04, 0), hCrystalM, GX - 0.02, top + 0.1, 0);
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
gableRoof(house, -0.04, 0.08 + WH + 0.022, WZ, WD, WW, 0.3, 0.06, 3);
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

// ---- blue cloth awning over the door ----
var awn = new THREE.Group(); awn.position.set(FX, 0.56, 0.2); house.add(awn);
var awnTop = mesh(new THREE.BoxGeometry(0.2, 0.012, 0.34), hClothM, 0.09, -0.04, 0); awnTop.rotation.z = -0.45; awn.add(awnTop);
for (var ai = 0; ai < 6; ai++) { // scalloped hem, alternating blue / white
  var sc = mesh(new THREE.CylinderGeometry(0.028, 0.028, 0.01, 10, 1, false, 0, Math.PI), ai % 2 ? hClothLightM : hClothM, 0.18, -0.085, -0.14 + ai * 0.056);
  sc.rotation.z = Math.PI / 2; sc.rotation.y = Math.PI / 2; awn.add(sc);
}
[-0.16, 0.16].forEach(function (z) { var rod = mesh(new THREE.BoxGeometry(0.2, 0.008, 0.008), hIronM, 0.09, -0.035, z); rod.rotation.z = -0.45; awn.add(rod); });

// ---- wooden bench with a blue cushion under the wing window ----
var bench = new THREE.Group(); bench.position.set(WD / 2 - 0.04 + 0.1, 0, WZ - 0.02); house.add(bench);
bench.add(mesh(new THREE.BoxGeometry(0.12, 0.025, 0.34), hWoodM, 0, 0.13, 0));
bench.add(mesh(new THREE.BoxGeometry(0.1, 0.02, 0.28), hClothM, 0.005, 0.152, 0));
[-0.14, 0.14].forEach(function (z) { bench.add(mesh(new THREE.BoxGeometry(0.1, 0.12, 0.025), hWoodDarkM, 0, 0.06, z)); });

// ---- little iron stove with a kettle (warm glow at night) ----
var stove = new THREE.Group(); stove.position.set(0.5, 0, -0.5); house.add(stove);
var hStoveM = mat(0x4f586e);
for (var lg = 0; lg < 3; lg++) { var la_ = lg / 3 * Math.PI * 2; stove.add(mesh(new THREE.CylinderGeometry(0.008, 0.01, 0.05, 5), hStoveM, Math.cos(la_) * 0.045, 0.025, Math.sin(la_) * 0.045)); }
stove.add(mesh(new THREE.CylinderGeometry(0.062, 0.058, 0.13, 14), hStoveM, 0, 0.115, 0));
stove.add(mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.014, 14), hIronM, 0, 0.187, 0));
var stoveDoor = mesh(new THREE.CircleGeometry(0.028, 12), hWinM, 0.061, 0.11, 0); stoveDoor.rotation.y = Math.PI / 2; stove.add(stoveDoor);
var kettle = mesh(new THREE.SphereGeometry(0.035, 12, 8), hTrimM, 0, 0.215, 0); kettle.scale.y = 0.75; stove.add(kettle);
var spout = mesh(new THREE.CylinderGeometry(0.004, 0.008, 0.04, 5), hTrimM, 0.035, 0.225, 0); spout.rotation.z = -0.9; stove.add(spout);
var kHandle = mesh(new THREE.TorusGeometry(0.022, 0.004, 4, 10, Math.PI), hIronM, 0, 0.24, 0); stove.add(kHandle);
var stoveLight = new THREE.PointLight(lc(0xffa85a), 0, 0.9, 2); stoveLight.position.set(0.12, 0.15, 0); stove.add(stoveLight);

// ---- moon-grass pots on both sides of the steps ----
[[FX + 0.2, -0.0], [FX + 0.2, 0.42]].forEach(function (q, k) {
  house.add(mesh(new THREE.CylinderGeometry(0.05, 0.038, 0.07, 12), mat(0xe3e8f2), q[0], 0.035, q[1]));
  var tuft = makeGrassTuft(91 + k * 7, 12, 2); tuft.scale.setScalar(0.22); tuft.position.set(q[0], 0.07, q[1]); house.add(tuft);
});

// ---- hanging spider plant (吊兰) under the balcony corner + a low rounded-stone garden wall ----
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
var hanger = new THREE.Group(); hanger.position.set(FX + 0.11, 0.42, -0.15); house.add(hanger);
var potM = mat(0xe3e8f2);
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
  var run = mesh(new THREE.CylinderGeometry(0.0025, 0.0025, len, 3), hPlantM, rx, -len / 2, rz); hanger.add(run);
  var baby = new THREE.Group(); baby.position.set(rx, -len, rz); hanger.add(baby);
  for (var b = 0; b < 6; b++) baby.add(droopLeaf(b / 6 * Math.PI * 2 + k, 0.03, 0.025, 0.005));
});
for (var wi = 0; wi < 9; wi++) {
  var wa = -1.2 + wi * 0.13, wr = 0.95;
  if (Math.abs(wa) < 0.32) continue;
  var st = new THREE.Mesh(rockGeo(0.07, wi * 1.7, 0.75), rockVM);
  st.position.set(Math.cos(wa) * wr - 0.1, 0.05, Math.sin(wa) * wr); house.add(st);
}

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
  hMoonCarveM.opacity = lerp(0.4, 0.95, n);
  stoveLight.intensity = n * 0.6;
  hLight.intensity = n * 1.1;
  hCrystal.rotation.y = t * 0.6 * MM;
  hanger.rotation.z = Math.sin(t * 0.9) * 0.04 * MM; hanger.rotation.x = Math.sin(t * 0.7 + 1) * 0.03 * MM;
  hCrystal.position.y = top + 0.1 + Math.sin(t * 1.3) * 0.012 * MM;
}
if (window.Island) { window.Island.house = house; window.Island.yard = yard; }
