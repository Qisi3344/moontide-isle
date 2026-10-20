/* 月汐小岛 · terrain.js — 月牙岛地形（沙滩、草坡、房子空地） */
"use strict";
// ---------- island shape ----------
// crescent: outer circle r=5 at origin minus inner circle r=3.3 at (2.4,0); positive = inland distance
function inside(x, z) { return Math.min(5 - Math.hypot(x, z), Math.hypot(x - 2.4, z) - 3.3); }
var CX = -2.95, CR = 1.5;
function hill(i) { return 0.32 + ss(0.55, 2.1, i) * 1.45; }
var HC = hill(inside(CX, 0));
function height(x, z) {
  var i = inside(x, z);
  if (i < 0) return Math.max(-1.25, 0.15 + i * 1.1);
  var h = i < 0.55 ? 0.15 + i * 0.3 : hill(i);
  h += (Math.sin(x * 2.1 + z * 1.3) * Math.cos(z * 1.7 - x) * 0.08) * ss(0.7, 1.3, i);
  var dc = Math.hypot(x - CX, z);
  return lerp(HC, h, ss(CR + 0.1, CR + 0.8, dc));
}

// albedos tuned so lit, tone-mapped ground reads: grass #8FC46A (shadow #6FA552), sand #EBD5AE
var SAND = lc(0xf8dba2), WET = lc(0xd9bc8a), GRASS = lc(0x76c05d),
    GRASS2 = lc(0x6cb553), CLEAR = lc(0x8ccb6c), islandMesh;
(function buildIsland() {
  var g = new THREE.PlaneGeometry(13, 13, 104, 104);
  g.rotateX(-Math.PI / 2);
  var p = g.attributes.position;
  for (var k = 0; k < p.count; k++) {
    var x = p.getX(k), z = p.getZ(k);
    var jx = x + Math.sin(k * 12.9898) * 0.04, jz = z + Math.cos(k * 78.233) * 0.04;
    p.setXYZ(k, jx, height(jx, jz), jz);
  }
  g = g.toNonIndexed();
  p = g.attributes.position;
  var col = new Float32Array(p.count * 3), c = new THREE.Color();
  for (var t = 0; t < p.count; t += 3) {
    var mx = (p.getX(t) + p.getX(t + 1) + p.getX(t + 2)) / 3, mz = (p.getZ(t) + p.getZ(t + 1) + p.getZ(t + 2)) / 3;
    var my = (p.getY(t) + p.getY(t + 1) + p.getY(t + 2)) / 3, i = inside(mx, mz);
    if (my < 0.02) c.copy(WET);
    else if (i < 0.5) c.copy(SAND);
    else if (Math.hypot(mx - CX, mz) < CR + 0.15) c.copy(CLEAR);
    else c.copy(Math.sin(mx * 5.3 + mz * 3.1) > 0.3 ? GRASS2 : GRASS);
    c.offsetHSL(0, 0, (Math.sin(t * 0.731) * 0.5) * 0.025);
    for (var v = 0; v < 3; v++) { col[(t + v) * 3] = c.r; col[(t + v) * 3 + 1] = c.g; col[(t + v) * 3 + 2] = c.b; }
  }
  g.setAttribute("color", new THREE.BufferAttribute(col, 3));
  g.computeVertexNormals();
  var m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 0.95 }));
  m.renderOrder = 0;
  scene.add(m); islandMesh = m;
})();
