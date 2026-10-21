/* 月汐小岛 · lamps.js — 顶着小月亮的白石路灯、伸进内湾的白木栈桥 */
"use strict";
// ---------- moon lamps + pier ----------
var lampsG = new THREE.Group(); scene.add(lampsG);
var lampStoneM = mat(0xe8eaf1), lampTrimM = mat(0xd6d9e4);
var moonGlowM = mat(0xf3f8ff); moonGlowM.emissive = lc(0xd6ecff); moonGlowM.emissiveIntensity = 0.35;
var runeM = new THREE.MeshBasicMaterial({ color: lc(0x9fdcff), transparent: true, opacity: 0.35 });
var lampHaloM = new THREE.MeshBasicMaterial({ map: dotTex, color: lc(0xa8dcff), transparent: true, opacity: 0,
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
var pier = new THREE.Group(), PX0 = 0, PX1 = 2.05, PW = 0.46, PY = 0.04, PTH = THREE.MathUtils.degToRad(62), PD0 = 4.72;
for (var px = PX0, pk = 0; px < PX1; px += 0.17, pk++) {
  var pl = mesh(new THREE.BoxGeometry(0.15, 0.035, PW * (1 + 0.04 * Math.sin(pk * 2.1))), plankM[pk % 2], px + 0.075, PY, 0.012 * Math.sin(pk * 1.3));
  pl.rotation.y = 0.02 * Math.sin(pk * 3.7);
  pier.add(pl);
}
[0.55, 1.05, 1.55, PX1 - 0.05].forEach(function (x) {
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
  leafTimeU.value = t * MM; grassTimeU.value = t * MM;
  grassBladeM.emissiveIntensity = n * 0.3; grassFlowerM.emissiveIntensity = lerp(0.15, 1.6, n);
  moonGlowM.emissiveIntensity = lerp(0.35, 1.9, n);
  runeM.opacity = lerp(0.35, 0.95, n);
  moonLeafM.forEach(function (m, k) { m.emissiveIntensity = n * (k ? 0.35 : 0.25); });
  lampHaloM.opacity = n * 0.55;
  lampMoons.forEach(function (m) {
    m.moon.position.y = 0.9 + Math.sin(t * 1.1 + m.ph) * 0.025 * MM;
    m.moon.rotation.y = t * 0.4 * MM + m.ph;
    m.halo.position.y = m.moon.position.y;
    m.halo.quaternion.copy(camera.quaternion);
    m.halo.parent.getWorldQuaternion(tmpQ); m.halo.quaternion.premultiply(tmpQ.invert());
  });
  pierLight.intensity = n * 0.9;
  clearLight.intensity = n * 0.9;
}
