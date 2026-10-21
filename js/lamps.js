/* 月汐小岛 · lamps.js — 顶着小月亮的白石路灯、伸进内湾的白木栈桥 */
"use strict";
// ---------- moon lamps + pier ----------
var lampsG = new THREE.Group(); scene.add(lampsG);
var lampStoneM = mat(0xe8eaf1), lampTrimM = mat(0xd6d9e4);
var moonGlowM = mat(0xdcefff); moonGlowM.emissive = lc(0x8fd2ff); moonGlowM.emissiveIntensity = 0.35; // soft ice-blue, not glaring white (2026-10-21)
var runeM = new THREE.MeshBasicMaterial({ color: lc(0x9fdcff), transparent: true, opacity: 0.35 });
var lampHaloM = new THREE.MeshBasicMaterial({ map: dotTex, color: lc(0x86ccff), transparent: true, opacity: 0,
  depthWrite: false, blending: THREE.AdditiveBlending, fog: false });
var plankM = [mat(0xeae0cc), mat(0xe1d5bd)], pierPostM = mat(0xa9a3a8);
// a thin ring-like crescent (outer circle minus a slightly smaller circle shifted up), horns pointing up
var crescentGeo = (function () {
  var R = 0.12, r = 0.098, e = 0.03, N = 40, i, t;
  var hy = (R * R - r * r + e * e) / (2 * e), hx = Math.sqrt(R * R - hy * hy); // horn tips
  var aO = Math.atan2(hy, hx), aI = Math.atan2(hy - e, hx);
  var sh = new THREE.Shape();
  for (i = 0; i <= N; i++) { t = aO - (2 * Math.PI - (Math.PI - 2 * aO)) * i / N; sh[i ? "lineTo" : "moveTo"](R * Math.cos(t), R * Math.sin(t)); }
  for (i = N - 1; i > 0; i--) { t = aI - (2 * Math.PI - (Math.PI - 2 * aI)) * i / N; sh.lineTo(r * Math.cos(t), e + r * Math.sin(t)); }
  var g = new THREE.ExtrudeGeometry(sh, { depth: 0.02, bevelEnabled: true, bevelThickness: 0.008, bevelSize: 0.005, bevelSegments: 2, curveSegments: 4 });
  g.translate(0, 0, -0.01);
  return g;
})();
var lampMoons = [], tmpQ = new THREE.Quaternion();

// a square white-stone pillar with a little crescent moon floating above it
function moonLamp(x, z, ry, y) {
  var g = new THREE.Group();
  g.add(mesh(new THREE.BoxGeometry(0.2, 0.05, 0.2), lampTrimM, 0, 0.025, 0));
  g.add(mesh(new THREE.BoxGeometry(0.16, 0.05, 0.16), lampStoneM, 0, 0.075, 0));
  g.add(mesh(new THREE.BoxGeometry(0.1, 0.56, 0.1), lampStoneM, 0, 0.38, 0));
  g.add(mesh(new THREE.BoxGeometry(0.15, 0.035, 0.15), lampTrimM, 0, 0.675, 0));
  g.add(mesh(new THREE.BoxGeometry(0.12, 0.03, 0.12), lampStoneM, 0, 0.705, 0));
  // faint glowing rune stripe + tiny crescent carving
  for (var f = 0; f < 4; f++) { // on all four faces of the pillar
    var face = new THREE.Group(); face.rotation.y = f * Math.PI / 2; g.add(face);
    face.add(mesh(new THREE.BoxGeometry(0.012, 0.22, 0.004), runeM, 0, 0.3, 0.051));
    var carve = mesh(crescentGeo, runeM, 0, 0.5, 0.052); carve.scale.setScalar(0.22); face.add(carve);
  }
  // the floating moon
  var moon = mesh(crescentGeo, moonGlowM, 0, 0.9, 0);
  g.add(moon);
  var halo = mesh(new THREE.PlaneGeometry(0.55, 0.55), lampHaloM, 0, 0.9, 0); g.add(halo);
  var ring = mesh(new THREE.PlaneGeometry(0.6, 0.6), lampHaloM, 0, 0.012, 0); ring.rotation.x = -Math.PI / 2; g.add(ring);
  g.position.set(x, y === undefined ? height(x, z) - 0.01 : y, z);
  g.rotation.y = ry || 0;
  lampsG.add(g);
  lampMoons.push({ moon: moon, halo: halo, ph: lampMoons.length * 1.3 });
  return g;
}

// ---- pier: from the beach by the north horn (beside 小灰狼's moon rock) out to the open sea ----
// built along local +x, then turned to point straight out from the island so the lagoon stays clear
var pier = new THREE.Group(), PX0 = 0, PX1 = 1.55, PW = 0.46, PY = 0.04, PTH = THREE.MathUtils.degToRad(62), PD0 = 4.72;
for (var px = PX0, pk = 0; px < PX1; px += 0.17, pk++) {
  var pl = mesh(new THREE.BoxGeometry(0.15, 0.035, PW * (1 + 0.04 * Math.sin(pk * 2.1))), plankM[pk % 2], px + 0.075, PY, 0.012 * Math.sin(pk * 1.3));
  pl.rotation.y = 0.02 * Math.sin(pk * 3.7);
  pier.add(pl);
}
[0.55, 1.05, PX1 - 0.05].forEach(function (x) {
  [-1, 1].forEach(function (s) {
    pier.add(mesh(new THREE.CylinderGeometry(0.035, 0.04, 0.95, 7), pierPostM, x, PY - 0.42, s * (PW / 2 - 0.02)));
  });
});
// side beams under the planks
[-1, 1].forEach(function (s) {
  pier.add(mesh(new THREE.BoxGeometry(PX1 - PX0, 0.04, 0.05), pierPostM, (PX0 + PX1) / 2, PY - 0.035, s * (PW / 2 - 0.04)));
});
pier.position.set(Math.cos(PTH) * PD0, 0.16, Math.sin(PTH) * PD0);
pier.rotation.y = -PTH;
lampsG.add(pier);
// 2026-10-21: two tall pillar lamps on the pier looked odd; one small night light at the end instead
var nightLampM = glowMat(0xeaf4ff, 0xbfe3ff), nightLamp = new THREE.Group(), lanMetalM = mat(0xaab4c8);
// a little hand-carried lantern sitting on the planks: metal base + cap, glowing glass, a crescent inside, carry handle on top
nightLamp.add(mesh(new THREE.CylinderGeometry(0.05, 0.055, 0.02, 12), lanMetalM, 0, 0.01, 0));
var lanGlass = mesh(new THREE.CylinderGeometry(0.038, 0.038, 0.085, 12), nightLampM, 0, 0.0625, 0);
lanGlass.material = nightLampM.clone(); lanGlass.material.transparent = true; lanGlass.material.opacity = 0.75; nightLamp.add(lanGlass);
for (var lp = 0; lp < 4; lp++) { var la = lp * Math.PI / 2 + Math.PI / 4; nightLamp.add(mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.09, 4), lanMetalM, Math.cos(la) * 0.041, 0.0625, Math.sin(la) * 0.041)); }
nightLamp.add(mesh(new THREE.CylinderGeometry(0.046, 0.046, 0.012, 12), lanMetalM, 0, 0.111, 0));
nightLamp.add(mesh(new THREE.ConeGeometry(0.04, 0.035, 12), lanMetalM, 0, 0.134, 0));
nightLamp.add(mesh(new THREE.SphereGeometry(0.008, 6, 4), lanMetalM, 0, 0.154, 0));
var lanHandle = mesh(new THREE.TorusGeometry(0.032, 0.004, 5, 14, Math.PI), lanMetalM, 0, 0.15, 0); nightLamp.add(lanHandle);
var nlMoon = mesh(crescentGeo, moonGlowM, 0, 0.055, 0); nlMoon.scale.setScalar(0.22); nightLamp.add(nlMoon);
var nlHalo = mesh(new THREE.PlaneGeometry(0.3, 0.3), lampHaloM, 0, 0.065, 0); nightLamp.add(nlHalo);
nightLamp.position.set(PX1 - 0.12, PY + 0.018, PW / 2 - 0.1); nightLamp.rotation.y = 0.5; pier.add(nightLamp);

// a little moon boat beside the pier, folded like a paper boat, tips curling up like a crescent
var paperM = toonMat(0xf3f6fc); paperM.side = THREE.DoubleSide; paperM.emissive = lc(0xcfe6ff); paperM.emissiveIntensity = 0;
var moonBoat = new THREE.Group(), boatClothM, boatSail;
(function () {
  var P = [], V3 = function (x, y, z) { return [x, y, z]; };
  function tri(a, b, c) { P.push.apply(P, a.concat(b, c)); }
  function quad(a, b, c, d) { tri(a, b, c); tri(a, c, d); }
  var kA = V3(-0.14, 0, 0), kB = V3(0.14, 0, 0), tA = V3(-0.31, 0.17, 0), tB = V3(0.31, 0.17, 0);
  [-1, 1].forEach(function (sd) {
    var rA = V3(-0.2, 0.085, sd * 0.085), rB = V3(0.2, 0.085, sd * 0.085);
    quad(kA, kB, rB, rA); tri(kB, tB, rB); tri(kA, rA, tA); // hull side + the curled-up ends
  });
  var g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(P, 3)); g.computeVertexNormals();
  moonBoat.add(new THREE.Mesh(g, paperM));
  // 2026-10-21: a little sailboat — slim mast + a billowing cloth sail with a glowing crescent on it
  moonBoat.add(mesh(new THREE.CylinderGeometry(0.007, 0.009, 0.44, 6), mat(0xe6dccb), -0.02, 0.26, 0));
  var boom = mesh(new THREE.CylinderGeometry(0.005, 0.005, 0.2, 5), mat(0xe6dccb), 0.08, 0.105, 0); boom.rotation.z = Math.PI / 2; moonBoat.add(boom);
  var clothM = toonMat(0xf7f4ec); clothM.side = THREE.DoubleSide; clothM.emissive = lc(0xcfe6ff); clothM.emissiveIntensity = 0; boatClothM = clothM;
  var sp = [], si = [], NR = 8, NC = 6;
  for (var i = 0; i <= NR; i++) for (var j = 0; j <= NC; j++) {
    var u = i / NR, v = j / NC, w = 0.2 * (1 - u);
    sp.push(-0.01 + w * v, 0.11 + 0.35 * u, 0.045 * Math.sin(Math.PI * v) * Math.sqrt(1 - u) + 0.015 * v * (1 - u));
  }
  for (i = 0; i < NR; i++) for (j = 0; j < NC; j++) { var a0 = i * (NC + 1) + j, a1 = a0 + NC + 1; si.push(a0, a1, a0 + 1, a1, a1 + 1, a0 + 1); }
  var sg = new THREE.BufferGeometry(); sg.setAttribute("position", new THREE.Float32BufferAttribute(sp, 3)); sg.setIndex(si); sg.computeVertexNormals();
  boatSail = new THREE.Mesh(sg, clothM); moonBoat.add(boatSail);
  var em = mesh(crescentGeo, runeM, 0.055, 0.21, 0.042); em.scale.setScalar(0.3); moonBoat.add(em);
  var glow = mesh(new THREE.PlaneGeometry(0.7, 0.45), lampHaloM, 0, 0.005, 0); glow.rotation.x = -Math.PI / 2; moonBoat.add(glow);
})();
moonBoat.scale.setScalar(1.5); moonBoat.position.set(PX1 - 0.5, -0.15, -(PW / 2 + 0.42)); moonBoat.rotation.y = -0.35; pier.add(moonBoat); // right side of the pier as seen from the default view
var pierLight = new THREE.PointLight(lc(0xcfe6ff), 0, 1.6, 2); pierLight.position.set(PX1 - 0.12, PY + 0.2, PW / 2 - 0.1); pier.add(pierLight);

// ---- lamps by the clearing (flanking its lagoon side) ----
[-0.75, 0.75].forEach(function (a) {
  moonLamp(CX + Math.cos(a) * (CR + 0.3), Math.sin(a) * (CR + 0.3), a);
});
var clearLight = new THREE.PointLight(lc(0xffb867), 0, 2.8, 2); clearLight.position.set(CX + CR + 0.3, HC + 0.85, 0); lampsG.add(clearLight);

// ---- lamps along the low white-stone ledge toward both horns ----
[-1.62, 1.62, -1.15, 1.15].forEach(function (ph, i) {
  var k = i < 2 ? 1 : 2, T = TIERS[k], th = Math.PI + ph, R = tierR(T, k, th), d = R - 0.18;
  if (i >= 2) d = R - 0.16;
  moonLamp(Math.cos(th) * d, Math.sin(th) * d, -th);
});

function updateLamps(t, n) {
  leafTimeU.value = t * MM; grassTimeU.value = t * MM;
  grassBladeM.emissiveIntensity = n * 0.3; grassFlowerM.emissiveIntensity = lerp(0.15, 1.6, n);
  moonGlowM.emissiveIntensity = lerp(0.12, 1.05, n); shroomCapM.emissiveIntensity = shroomCapM2.emissiveIntensity = lerp(0.1, 1.1, n); starPinkM.emissiveIntensity = lerp(0.1, 0.9, n);
  runeM.opacity = lerp(0.35, 0.95, n);
  moonLeafM.forEach(function (m, k) { m.emissiveIntensity = n * (k ? 0.35 : 0.25); });
  lampHaloM.opacity = n * 0.32;
  lampMoons.forEach(function (m) {
    m.moon.position.y = 0.9 + Math.sin(t * 1.1 + m.ph) * 0.025 * MM;
    m.moon.rotation.y = t * 0.4 * MM + m.ph;
    m.halo.position.y = m.moon.position.y;
    m.halo.quaternion.copy(camera.quaternion);
    m.halo.parent.getWorldQuaternion(tmpQ); m.halo.quaternion.premultiply(tmpQ.invert());
  });
  pierLight.intensity = n * 0.6;
  nightLampM.emissiveIntensity = lerp(0.3, 1.6, n); paperM.emissiveIntensity = n * 0.35; boatClothM.emissiveIntensity = n * 0.3;
  boatSail.scale.z = 1 + Math.sin(t * 1.7) * 0.15 * MM;
  nlMoon.rotation.y = t * 0.5 * MM; lanGlass.material.emissiveIntensity = lerp(0.3, 1.8, n);
  nlHalo.quaternion.copy(camera.quaternion); nightLamp.getWorldQuaternion(tmpQ); nlHalo.quaternion.premultiply(tmpQ.invert());
  moonBoat.position.y = -0.15 + Math.sin(t * 1.3) * 0.012 * MM;
  moonBoat.rotation.z = Math.sin(t * 0.9) * 0.05 * MM; moonBoat.rotation.x = Math.sin(t * 1.1 + 1) * 0.03 * MM;
  clearLight.intensity = n * 1.3;
}
