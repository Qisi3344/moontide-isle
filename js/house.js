/* 月汐小岛 · house.js — 我们的小房子：月白双圆顶小屋，只有窗、木门和灯笼是暖橙色 */
"use strict";
// Mix of her two references: the cosy two-dome cottage shape (arched windows, little balcony, wooden door,
// low stone wall) dressed in the island's moonstone white + pale blue, so the only warm light on the
// whole island is our windows. A small moon crystal on the dome tip and faint blue step lights from the other one.
var house = new THREE.Group();
var hWallM = mat(0xf0f2f8), hTrimM = mat(0xdde3ef), hDomeM = mat(0xd6e3f5), hBaseM = mat(0xc4cde0);
var hWoodM = mat(0x9a6a4b), hWoodDarkM = mat(0x6f4a35), hIronM = mat(0x5d6478);
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
// side windows
archWindow(house, 0, 0.66, MW / 2 + 0.002, 0.16, 0.24).rotation.y = 0;
archWindow(house, 0, 0.66, -MW / 2 - 0.002, 0.16, 0.24).rotation.y = Math.PI;

// ---- lower wing with the small dome (toward -z) ----
var WW = 0.56, WD = 0.62, WH = 0.56, WZ = -(MW / 2 + WW / 2 - 0.02);
house.add(mesh(new THREE.BoxGeometry(WD + 0.08, 0.08, WW + 0.06), hBaseM, -0.04, 0.04, WZ));
house.add(mesh(new THREE.BoxGeometry(WD, WH, WW), hWallM, -0.04, 0.08 + WH / 2, WZ));
house.add(mesh(new THREE.BoxGeometry(WD + 0.06, 0.045, WW + 0.06), hTrimM, -0.04, 0.08 + WH, WZ));
dome(house, -0.04, 0.08 + WH + 0.02, WZ, 0.24);
archWindow(house, WD / 2 - 0.04 + 0.002, 0.16, WZ, 0.28, 0.32);
// little chimney
house.add(mesh(new THREE.CylinderGeometry(0.035, 0.04, 0.16, 8), hTrimM, -0.25, 0.08 + WH + 0.08, WZ - 0.15));

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

// ---- hanging moon-grass pot under the balcony + a low rounded-stone garden wall ----
var pot = makeGrassTuft(77, 16, 2); pot.scale.setScalar(0.34); pot.position.set(FX + 0.09, 0.15, -0.36); house.add(pot);
house.add(mesh(new THREE.CylinderGeometry(0.07, 0.05, 0.08, 10), hTrimM, FX + 0.09, 0.11, -0.36)); // planter by the window
for (var wi = 0; wi < 9; wi++) {
  var wa = -1.2 + wi * 0.13, wr = 0.95;
  if (Math.abs(wa) < 0.32) continue;
  var st = new THREE.Mesh(rockGeo(0.07, wi * 1.7, 0.75), rockVM);
  st.position.set(Math.cos(wa) * wr - 0.1, 0.05, Math.sin(wa) * wr); house.add(st);
}

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
  hLight.intensity = n * 1.1;
  hCrystal.rotation.y = t * 0.6 * MM;
  hCrystal.position.y = top + 0.13 + Math.sin(t * 1.3) * 0.012 * MM;
}
if (window.Island) window.Island.house = house;
