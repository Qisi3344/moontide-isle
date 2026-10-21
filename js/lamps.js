/* 月汐小岛 · lamps.js — 顶着小月亮的白石路灯、伸进内湾的白木栈桥 */
"use strict";
// ---------- moon lamps + pier ----------
var lampsG = new THREE.Group(); scene.add(lampsG);
var lampStoneM = mat(0xe9ebf1), lampPostM = mat(0xd5d8e3);
var moonGlowM = mat(0xfff4cf); moonGlowM.emissive = lc(0xffe9a8); moonGlowM.emissiveIntensity = 0.25;
var plankM = [mat(0xeae0cc), mat(0xe1d5bd)], pierPostM = mat(0xa9a3a8);

function moonLamp(x, z, ry, y) {
  var g = new THREE.Group();
  g.add(mesh(new THREE.CylinderGeometry(0.075, 0.095, 0.07, 8), lampStoneM, 0, 0.035, 0));
  g.add(mesh(new THREE.CylinderGeometry(0.024, 0.034, 0.56, 8), lampPostM, 0, 0.35, 0));
  g.add(mesh(new THREE.CylinderGeometry(0.045, 0.03, 0.03, 8), lampStoneM, 0, 0.64, 0));
  // the little crescent moon on top
  var moon = mesh(new THREE.TorusGeometry(0.075, 0.022, 8, 20, Math.PI * 1.25), moonGlowM, 0, 0.75, 0);
  moon.rotation.z = Math.PI * 0.12 - 0.6;
  g.add(moon);
  g.position.set(x, y === undefined ? height(x, z) - 0.01 : y, z);
  g.rotation.y = ry || 0;
  lampsG.add(g);
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
var pierLamps = [moonLamp(PX1 - 0.05, -PW / 2 + 0.02, 0.3, PY + 0.018), moonLamp(PX1 - 0.05, PW / 2 - 0.02, -0.3, PY + 0.018)];
pierLamps.forEach(function (l) { pier.add(l); });
var pierLight = new THREE.PointLight(lc(0xffe2a0), 0, 2.4, 2); pierLight.position.set(PX1 - 0.05, PY + 0.8, 0); pier.add(pierLight);

// ---- lamps by the clearing (flanking its lagoon side) ----
[-0.75, 0.75].forEach(function (a) {
  moonLamp(CX + Math.cos(a) * (CR + 0.3), Math.sin(a) * (CR + 0.3), a);
});
var clearLight = new THREE.PointLight(lc(0xffe2a0), 0, 2.6, 2); clearLight.position.set(CX + CR + 0.3, HC + 0.85, 0); lampsG.add(clearLight);

// ---- lamps along the low white-stone ledge toward both horns ----
[-1.62, 1.62, -1.15, 1.15].forEach(function (ph, i) {
  var k = i < 2 ? 1 : 2, T = TIERS[k], th = Math.PI + ph, R = tierR(T, k, th), d = R - 0.18;
  if (i >= 2) d = R - 0.16;
  moonLamp(Math.cos(th) * d, Math.sin(th) * d, -th);
});

function updateLamps(t, n) {
  moonGlowM.emissiveIntensity = lerp(0.25, 1.7, n);
  pierLight.intensity = n * 0.9;
  clearLight.intensity = n * 0.9;
}
