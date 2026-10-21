/* 月汐小岛 · terrain.js — 月牙岛地形：一层层“挤出来的厚饼”台地（内湾沙滩、白石台、草台、坡顶空地） */
"use strict";
// ---------- island shape ----------
// crescent: outer circle r=5 at origin minus inner circle r=3.3 at (2.4,0); positive = inland distance
function inside(x, z) { return Math.min(5 - Math.hypot(x, z), Math.hypot(x - 2.4, z) - 3.3); }
// the clearing for our future house, on the top terrace in the thick west middle of the crescent
var CX = -3.05, CR = 1.15;

// Terraces are built like stylized game islands: each tier is a flat 2D crescent-ish shape extruded
// into a slab with a rounded (bevelled) top edge, stacked so tiers step down toward both horns and
// toward the lagoon. Clean side walls instead of a stretched heightmap (no saw teeth).
// o = inset from the open-sea edge, n = inset from the lagoon edge, A = half-width in angle around
// the west (θ = π), top = height of the walkable top.
var TIERS = [
  { o: 0.0, n: 0.0, A: 9, top: 0.16, wob: 0 },    // sand rim (the beach), full crescent
  { o: 0.05, n: 0.5, A: 1.95, top: 0.72, wob: 1 }, // low white-stone ledge
  { o: 0.3, n: 0.68, A: 1.38, top: 1.22, wob: 1 }, // middle grass terrace
  { o: 0.52, n: 0.76, A: 0.86, top: 1.72, wob: 1 } // top terrace with the clearing
];
var HC = TIERS[3].top;
function wrapA(a) { while (a > Math.PI) a -= 2 * Math.PI; while (a < -Math.PI) a += 2 * Math.PI; return a; }
function tierR(T, k, th) { return 5 - T.o + T.wob * (0.07 * Math.sin(5 * th + k * 1.7) + 0.035 * Math.sin(11 * th + k * 2.9)); }
function tierD1(T, k, th) {
  var ri = 3.3 + T.n + T.wob * (0.05 * Math.sin(6 * th + k * 2.3) + 0.03 * Math.sin(13 * th + k)), c = 4.8 * Math.cos(th);
  return (c + Math.sqrt(c * c + 4 * (ri * ri - 5.76))) / 2;
}
function tierBulge(T, k, t) { return T.wob * (0.09 * Math.sin(Math.PI * t) + 0.03 * Math.sin(3 * Math.PI * t + k)); }
// widest angle at which the tier still has width
TIERS.forEach(function (T, k) {
  var a = 0;
  while (a < Math.PI && tierD1(T, k, Math.PI + a + 0.01) < tierR(T, k, Math.PI + a + 0.01) - 0.02 &&
         tierD1(T, k, Math.PI - a - 0.01) < tierR(T, k, Math.PI - a - 0.01) - 0.02) a += 0.01;
  T.A = Math.min(T.A, a);
});
function inTier(T, k, x, z) {
  var th = Math.atan2(z, x), d = Math.hypot(x, z), R = tierR(T, k, th), d1 = tierD1(T, k, th);
  if (d > R || d < d1) return false;
  var t = (d - d1) / Math.max(1e-4, R - d1);
  return Math.abs(wrapA(th - Math.PI)) <= T.A + tierBulge(T, k, t);
}
function height(x, z) {
  for (var k = TIERS.length - 1; k >= 0; k--) if (inTier(TIERS[k], k, x, z)) return TIERS[k].top;
  return -1.25;
}
function tierShape(T, k) {
  var s = new THREE.Shape(), N = 72, M = 8, pts = [], j, th, R, d1, t, ph;
  function P(d, a) { pts.push(new THREE.Vector2(Math.cos(a) * d, -Math.sin(a) * d)); }
  for (j = 0; j <= N; j++) { th = Math.PI - T.A + 2 * T.A * j / N; P(tierR(T, k, th), th); }
  for (j = 1; j < M; j++) {
    t = 1 - j / M; th = Math.PI + T.A; R = tierR(T, k, th); d1 = tierD1(T, k, th);
    ph = th + tierBulge(T, k, t); P(d1 + (R - d1) * t, ph);
  }
  for (j = 0; j <= N; j++) { th = Math.PI + T.A - 2 * T.A * j / N; P(tierD1(T, k, th), th); }
  for (j = 1; j < M; j++) {
    t = j / M; th = Math.PI - T.A; R = tierR(T, k, th); d1 = tierD1(T, k, th);
    ph = th - tierBulge(T, k, t); P(d1 + (R - d1) * t, ph);
  }
  s.setFromPoints(pts);
  return s;
}

// ---------- terrace look ----------
// Clean painted look (2026-10-21: she found the striped strata walls and the darker bevel rims ugly):
// one vertex-coloured toon material per tier; the top and its rounded bevel take the top colour, the walls a soft
// light-to-darker gradient, no stripes, no seam between top and rim.
var TIER_COL = [
  { top: 0xe8e3d9, hi: 0xe2d9c8, lo: 0xc2b49c }, // sand
  { top: 0xd8dbe6, hi: 0xd2d8e6, lo: 0xa6b0c9 }, // white stone ledge
  { top: 0x77b58a, hi: 0xcfd6e5, lo: 0xa3adc6 }, // grass terrace, stone wall
  { top: 0x6aab80, hi: 0xd0d7e6, lo: 0xa5afc8 }  // top terrace, stone wall
];
// Underwater foundation (2026-10-21: she saw the straight pulled-down walls through the water and wanted it to tuck
// inward like the underside of a floating-style island). Below the waterline every vertex slides inward along the
// crescent's inward direction, more the deeper it is, but never past the middle of the strip (no self-crossing).
function tuckUnderwater(g, baseY) {
  var pos = g.attributes.position, e = 0.02;
  function grad(x, z) {
    var gx = inside(x + e, z) - inside(x - e, z), gz = inside(x, z + e) - inside(x, z - e), l = Math.hypot(gx, gz) || 1;
    return [gx / l, gz / l];
  }
  for (var v = 0; v < pos.count; v++) {
    var x = pos.getX(v), z = pos.getZ(v), wy = pos.getY(v) + baseY;
    if (wy > -0.04) continue;
    var f = Math.min(1, (-0.04 - wy) / 0.58), want = 0.7 * (1 - Math.sqrt(Math.max(0, 1 - f * f))) + 0.12 * f;
    // half-width of the strip here: walk inward until inside() stops growing
    var d = grad(x, z), h = 0, last = inside(x, z);
    for (var s = 0.03; s < 3; s += 0.03) {
      var val = inside(x + d[0] * s, z + d[1] * s);
      if (val <= last + 0.004) break;
      last = val; h = s;
    }
    var a = Math.min(want, h * 0.88);
    pos.setX(v, x + d[0] * a); pos.setZ(v, z + d[1] * a);
  }
  pos.needsUpdate = true;
}
// ExtrudeGeometry is non-indexed, so its walls come out flat-faceted; with toon banding every facet showed as a
// vertical crease (2026-10-21, 'paper-box fold lines'). Re-derive face normals, then average normals of coincident
// vertices whose faces are within ~60°, keeping the top/wall edge crisp.
function smoothWalls(g) {
  g.computeVertexNormals();
  var pos = g.attributes.position, nor = g.attributes.normal, map = {}, i, k, key;
  for (i = 0; i < pos.count; i++) {
    key = Math.round(pos.getX(i) * 1000) + "," + Math.round(pos.getY(i) * 1000) + "," + Math.round(pos.getZ(i) * 1000);
    (map[key] = map[key] || []).push(i);
  }
  var out = new Float32Array(pos.count * 3);
  for (key in map) {
    var L = map[key];
    for (i = 0; i < L.length; i++) {
      var a = L[i], ax = nor.getX(a), ay = nor.getY(a), az = nor.getZ(a), sx = 0, sy = 0, sz = 0;
      for (k = 0; k < L.length; k++) {
        var b = L[k], bx = nor.getX(b), by = nor.getY(b), bz = nor.getZ(b);
        if (ax * bx + ay * by + az * bz > 0.5) { sx += bx; sy += by; sz += bz; }
      }
      var l = Math.hypot(sx, sy, sz) || 1;
      out[a * 3] = sx / l; out[a * 3 + 1] = sy / l; out[a * 3 + 2] = sz / l;
    }
  }
  g.setAttribute("normal", new THREE.BufferAttribute(out, 3));
}
var islandMesh = new THREE.Group(); scene.add(islandMesh);
TIERS.forEach(function (T, k) {
  var bottom = k === 0 ? -0.66 : TIERS[k - 1].top - 0.08, bt = k === 0 ? 0.12 : 0.07, bs = k === 0 ? 0.28 : 0.07;
  var g = new THREE.ExtrudeGeometry(tierShape(T, k), {
    depth: Math.max(0.05, T.top - bottom - 2 * bt), bevelEnabled: true, bevelThickness: bt, bevelSize: bs,
    bevelSegments: k === 0 ? 3 : 2, curveSegments: 4, steps: k === 0 ? 6 : 1
  });
  g.rotateX(-Math.PI / 2);
  if (k === 0) tuckUnderwater(g, bottom + bt);
  smoothWalls(g);
  var C = TIER_COL[k], cTop = new THREE.Color(lc(C.top)), cHi = new THREE.Color(lc(C.hi)), cLo = new THREE.Color(lc(C.lo));
  var pos = g.attributes.position, nor = g.attributes.normal, col = new Float32Array(pos.count * 3), c = new THREE.Color();
  var y0 = (k === 0 ? -0.3 : bottom) - bottom - bt, y1 = T.top - bottom - bt;
  for (var v = 0; v < pos.count; v++) {
    var f = THREE.MathUtils.clamp((pos.getY(v) - y0) / Math.max(0.01, y1 - y0), 0, 1);
    c.copy(cLo).lerp(cHi, f * f * (3 - 2 * f));
    c.lerp(cTop, THREE.MathUtils.smoothstep(nor.getY(v), 0.25, 0.6));
    col[v * 3] = c.r; col[v * 3 + 1] = c.g; col[v * 3 + 2] = c.b;
  }
  g.setAttribute("color", new THREE.BufferAttribute(col, 3));
  var mat = toonMat(0xffffff); mat.vertexColors = true;
  var m = new THREE.Mesh(g, mat);
  m.position.y = bottom + bt;
  islandMesh.add(m);
});
// pale stone paving of the clearing
var clearing = new THREE.Mesh(new THREE.CylinderGeometry(CR + 0.08, CR + 0.08, 0.03, 40), toonMat(0xe6e8ef));
clearing.position.set(CX, HC + 0.015, 0); islandMesh.add(clearing);
