/* 月汐小岛 · terrain.js — 月牙岛地形（外侧灰白崖壁、内湾银白沙滩、草坡、房子空地） */
"use strict";
// ---------- island shape ----------
// crescent: outer circle r=5 at origin minus inner circle r=3.3 at (2.4,0); positive = inland distance
function inside(x, z) { return Math.min(5 - Math.hypot(x, z), Math.hypot(x - 2.4, z) - 3.3); }
var CX = -2.95, CR = 1.5;
// stepped terraces: low tier, middle tier, top tier, each wall a short steep step
function hill(i) { return 0.32 + 0.06 * i + 0.5 * ss(0.62, 0.78, i) + 0.5 * ss(1.18, 1.34, i) + 0.42 * ss(1.72, 1.88, i); }
var HC = hill(inside(CX, 0));
// 0 on the lagoon (beach) side, 1 on the open-sea (cliff) side
function cliffW(x, z) { return ss(-0.3, 0.5, (Math.hypot(x - 2.4, z) - 3.3) - (5 - Math.hypot(x, z))); }
// terrace coordinate: inland distance with a gentle wobble so the tiers are not perfect arcs
function wiAt(x, z, i) { return i + 0.12 * Math.sin(x * 1.7 + z * 2.3) * Math.cos(z * 1.3 - x * 0.6) * ss(0.4, 0.9, i); }
var WALLS = [[0.62, 0.78], [1.18, 1.34], [1.72, 1.88]];
// slide a grid vertex onto the top or bottom edge of the wall it falls in, so walls are clean instead of saw-toothed
function snapToWalls(x, z) {
  if (Math.hypot(x - CX, z) < CR + 0.9) return [x, z];
  for (var it = 0; it < 3; it++) {
    var i = inside(x, z), cw = cliffW(x, z), f, fn = null;
    if (cw > 0.5 && i > -0.02 && i < 0.18) fn = function (a, b) { return inside(a, b); };
    else fn = function (a, b) { return wiAt(a, b, inside(a, b)); };
    f = fn(x, z);
    var band = null;
    if (cw > 0.5 && i > -0.02 && i < 0.18) band = [0, 0.16];
    else for (var k = 0; k < WALLS.length; k++) if (f > WALLS[k][0] && f < WALLS[k][1]) band = WALLS[k];
    if (!band) break;
    var tgt = f - band[0] < band[1] - f ? band[0] : band[1], e = 0.01;
    var gx = (fn(x + e, z) - fn(x - e, z)) / (2 * e), gz = (fn(x, z + e) - fn(x, z - e)) / (2 * e), g2 = gx * gx + gz * gz;
    if (g2 < 1e-6) break;
    var d = (tgt - f) / g2; x += gx * d; z += gz * d;
  }
  return [x, z];
}
function height(x, z) {
  var i = inside(x, z), w = cliffW(x, z), wi = wiAt(x, z, i);
  var beach = i < 0 ? Math.max(-1.25, 0.15 + i * 1.1) : (i < 0.55 ? 0.15 + i * 0.3 : hill(wi));
  var cliff = i < 0 ? Math.max(-1.25, 0.25 + i * 2.6) : Math.max(hill(wi), 0.25 + 0.6 * ss(0, 0.16, i));
  if (i < 0) return lerp(beach, cliff, w);
  var h = lerp(beach, cliff, w);
  h += (Math.sin(x * 2.1 + z * 1.3) * Math.cos(z * 1.7 - x) * 0.03) * ss(0.7, 1.3, i);
  var dc = Math.hypot(x - CX, z);
  return lerp(HC, h, ss(CR + 0.1, CR + 0.8, dc));
}

// moon palette: silver-white sand, cool blue-green grass, grey-lavender cliffs, pale stone plaza
var SAND = lc(0xf1eee8), WET = lc(0xc9ccd6), GRASS = lc(0x6fae82),
    GRASS2 = lc(0x62a079), CLEAR = lc(0xdcdfe8), CLIFF = lc(0xa3a6b8), CLIFF2 = lc(0x8f93a8), PAVE = lc(0xd3d6e0), islandMesh;
var tA = new THREE.Vector3(), tB = new THREE.Vector3(), tN = new THREE.Vector3();
(function buildIsland() {
  var g = new THREE.PlaneGeometry(13, 13, 168, 168);
  g.rotateX(-Math.PI / 2);
  var p = g.attributes.position;
  for (var k = 0; k < p.count; k++) {
    var x = p.getX(k), z = p.getZ(k);
    var sn = snapToWalls(x, z), jx = sn[0], jz = sn[1];
    p.setXYZ(k, jx, height(jx, jz), jz);
  }
  g = g.toNonIndexed();
  p = g.attributes.position;
  var col = new Float32Array(p.count * 3), c = new THREE.Color();
  for (var t = 0; t < p.count; t += 3) {
    var mx = (p.getX(t) + p.getX(t + 1) + p.getX(t + 2)) / 3, mz = (p.getZ(t) + p.getZ(t + 1) + p.getZ(t + 2)) / 3;
    var my = (p.getY(t) + p.getY(t + 1) + p.getY(t + 2)) / 3, i = inside(mx, mz);
    tA.set(p.getX(t + 1) - p.getX(t), p.getY(t + 1) - p.getY(t), p.getZ(t + 1) - p.getZ(t));
    tB.set(p.getX(t + 2) - p.getX(t), p.getY(t + 2) - p.getY(t), p.getZ(t + 2) - p.getZ(t));
    var ny = Math.abs(tN.crossVectors(tA, tB).normalize().y), cw = cliffW(mx, mz);
    var dcl = Math.hypot(mx - CX, mz);
    if (dcl < CR + 0.15) c.copy(CLEAR);
    else if (ny < 0.62 || (cw > 0.5 && i < 0.12)) c.copy(CLIFF).lerp(CLIFF2, 0.5 + 0.5 * Math.sin(mx * 0.9 + mz * 1.3));   // terrace walls + sea cliffs
    else if (my < 0.02) c.copy(WET);
    else if (i < 0.5 && cw < 0.5) c.copy(SAND);
    else if (cw > 0.5 && i < 0.36) c.copy(PAVE);                                                          // pale stone ledge on the cliff top
    else if (Math.sin(mx * 2.3 + mz * 1.7) * Math.cos(mz * 2.9 - mx * 1.1) > 0.42) c.copy(PAVE);              // stone patches between the grass
    else c.copy(Math.sin(mx * 5.3 + mz * 3.1) > 0.3 ? GRASS2 : GRASS);
    c.offsetHSL(0, 0, (Math.sin(t * 0.731) * 0.5) * 0.012);
    for (var v = 0; v < 3; v++) { col[(t + v) * 3] = c.r; col[(t + v) * 3 + 1] = c.g; col[(t + v) * 3 + 2] = c.b; }
  }
  g.setAttribute("color", new THREE.BufferAttribute(col, 3));
  g.computeVertexNormals();
  var m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 0.95 }));
  m.renderOrder = 0;
  scene.add(m); islandMesh = m;
})();
