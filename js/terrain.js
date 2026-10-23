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
  { o: 0.0, n: 0.0, A: 9, top: -0.34, wob: 0 },   // underwater foundation under the real sloped beach (2026-10-23)
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
// ---------- real beach (2026-10-23) ----------
// She found the old beach fake: a flat slab at 0.16 with a pale band painted on the sea. Now the sand is its own
// heightfield that slopes gently from the dry crest (0.16) down through the waterline (~0.12 inland of the crescent
// outline) and under the sea, so the water really meets it. sea.js shades depth against the same profile (BEACH_GLSL).
function beachY(d) {
  if (d < -0.6) return -0.32 + (d + 0.6) * 2.0;
  var t = Math.min(1, (d + 0.6) / 1.2); return -0.32 + 0.48 * t * t * (3 - 2 * t);
}
// beachD: like inside(), but the lagoon edge is pushed 0.35 into the lagoon so the inner beach is about twice as wide (2026-10-23)
function beachD(x, z) { return Math.min(5 - Math.hypot(x, z), Math.hypot(x - 2.4, z) - 2.95); }
var BEACH_GLSL = "float beachD(vec2 p){ return min(5.0-length(p),length(p-vec2(2.4,0.))-2.95); }\n" + "float beachY(float d){ if(d<-0.6) return -0.32+(d+0.6)*2.0; float t=min(1.,(d+0.6)/1.2); return -0.32+0.48*t*t*(3.-2.*t); }\n";
function height(x, z) {
  for (var k = TIERS.length - 1; k >= 1; k--) if (inTier(TIERS[k], k, x, z)) return TIERS[k].top;
  var d = beachD(x, z);
  return d > -0.8 ? beachY(d) + beachDrift(x, z, d) : -1.25;
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
  { top: 0xb3d8c8, hi: 0xcfd6e5, lo: 0xa3adc6 }, // moon-grass terrace (sea-glass blue, was green till 2026-10-21), stone wall
  { top: 0xb3d8c8, hi: 0xd0d7e6, lo: 0xa5afc8 }  // top terrace, stone wall
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
  var bottom = k === 0 ? -0.66 : k === 1 ? -0.45 : TIERS[k - 1].top - 0.08, bt = k === 0 ? 0.12 : 0.07, bs = k === 0 ? 0.28 : 0.07;
  var g = new THREE.ExtrudeGeometry(tierShape(T, k), {
    depth: Math.max(0.05, T.top - bottom - 2 * bt), bevelEnabled: true, bevelThickness: bt, bevelSize: bs,
    bevelSegments: k === 0 ? 3 : 2, curveSegments: 4, steps: k === 0 ? 6 : 1
  });
  g.rotateX(-Math.PI / 2);
  if (k === 0) tuckUnderwater(g, bottom + bt);
  smoothWalls(g);
  var cSand = new THREE.Color(lc(0xe2d8c6));
  var C = TIER_COL[k], cTop = new THREE.Color(lc(C.top)), cHi = new THREE.Color(lc(C.hi)), cLo = new THREE.Color(lc(C.lo));
  var pos = g.attributes.position, nor = g.attributes.normal, col = new Float32Array(pos.count * 3), c = new THREE.Color();
  var y0 = (k === 0 ? -0.3 : bottom) - bottom - bt, y1 = T.top - bottom - bt;
  for (var v = 0; v < pos.count; v++) {
    var f = THREE.MathUtils.clamp((pos.getY(v) - y0) / Math.max(0.01, y1 - y0), 0, 1);
    c.copy(cLo).lerp(cHi, f * f * (3 - 2 * f));
    c.lerp(cTop, THREE.MathUtils.smoothstep(nor.getY(v), 0.25, 0.6));
    if (k === 1) c.lerp(cSand, 0.75 * (1 - THREE.MathUtils.smoothstep(pos.getY(v) + bottom + bt, 0.17, 0.34))); // sand-dusted foot where the ledge meets the beach
    col[v * 3] = c.r; col[v * 3 + 1] = c.g; col[v * 3 + 2] = c.b;
  }
  g.setAttribute("color", new THREE.BufferAttribute(col, 3));
  var mat = toonMat(0xffffff); mat.vertexColors = true;
  var m = new THREE.Mesh(g, mat);
  m.position.y = bottom + bt;
  islandMesh.add(m);
});
// moon-grass turf overlay (2026-10-21): the extruded tops have no inner vertices, so a clipped grid lies on each
// grass terrace carrying patchy dense/mid/light sea-glass blues plus a silver "moon frost" band along the edges.
(function () {
  var gD = lc(0x9fcfc0), gM = lc(0xb3d8c8), gL = lc(0xb4dcd9), fr = lc(0xe6f3ef), // soft mint/aqua (her swatch, 2026-10-21)
      S = 0.08, c = new THREE.Color();
  function nz(x, z) { return Math.sin(x * 2.3 + 1.1) * Math.cos(z * 2.9 - 0.4) + 0.6 * Math.sin((x - z) * 5.7 + 2) + 0.35 * Math.sin(x * 11.3 + z * 9.1); }
  [2, 3].forEach(function (k) {
    var T = TIERS[k], pos = [], col = [], idx = [], id = {}, n = 0, N = Math.ceil(12 / S);
    function ok(x, z) { return inTier(T, k, x, z) && (k === 3 || !inTier(TIERS[3], 3, x, z)); }
    for (var i = 0; i <= N; i++) for (var j = 0; j <= N; j++) {
      var x = -6 + i * S, z = -6 + j * S, inn = true, edge = false, d;
      for (d = 0; d < 6 && inn; d++) { var a = d / 6 * 6.283; if (!ok(x + Math.cos(a) * 0.09, z + Math.sin(a) * 0.09)) inn = false; }
      if (!inn) continue;
      for (d = 0; d < 8; d++) { var b = d / 8 * 6.283; if (!ok(x + Math.cos(b) * 0.24, z + Math.sin(b) * 0.24)) edge = true; }
      var v = nz(x, z);
      if (v < -0.5) c.copy(gL).lerp(gM, (v + 1.6) / 1.1 < 0 ? 0 : (v + 1.6) / 1.1); else if (v < 0.6) c.copy(gM).lerp(gD, (v + 0.5) / 1.1); else c.copy(gD);
      if (edge) c.lerp(fr, 0.65);
      id[i * 10000 + j] = n++; pos.push(x, T.top + 0.003, z); col.push(c.r, c.g, c.b);
    }
    for (i = 0; i < N; i++) for (j = 0; j < N; j++) {
      var p0 = id[i * 10000 + j], p1 = id[(i + 1) * 10000 + j], p2 = id[i * 10000 + j + 1], p3 = id[(i + 1) * 10000 + j + 1];
      if (p0 !== undefined && p1 !== undefined && p3 !== undefined) idx.push(p0, p3, p1);
      if (p0 !== undefined && p3 !== undefined && p2 !== undefined) idx.push(p0, p2, p3);
    }
    var g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
    g.setAttribute("normal", new THREE.Float32BufferAttribute(new Float32Array(pos.length).map(function (_, q) { return q % 3 === 1 ? 1 : 0; }), 3));
    g.setIndex(idx);
    var m = toonMat(0xffffff); m.vertexColors = true; m.polygonOffset = true; m.polygonOffsetFactor = -1;
    var turf = new THREE.Mesh(g, m); turf.receiveShadow = true; islandMesh.add(turf);
  });
})();
// sand drifts up against the white-stone ledge's foot like a little scree apron (2026-10-23)
function ledgeNear(x, z, d) {
  if (d < -0.1) return 0;
  for (var rr = 0.04; rr <= 0.4; rr += 0.04) for (var q = 0; q < 10; q++) {
    var qa = q / 10 * 6.283; if (inTier(TIERS[1], 1, x + Math.cos(qa) * rr, z + Math.sin(qa) * rr)) return Math.pow(1 - rr / 0.44, 2);
  }
  return 0;
}
function beachDrift(x, z, d) { return 0.09 * ledgeNear(x, z, d) * THREE.MathUtils.smoothstep(d, -0.05, 0.25); }
(function buildBeach() {
  var S = 0.04, N = Math.ceil(12 / S), pos = [], col = [], idx = [], id = {}, n = 0, i, j;
  for (i = 0; i <= N; i++) for (j = 0; j <= N; j++) {
    var x = -6 + i * S, z = -6 + j * S, d = beachD(x, z);
    if (d < -0.8) continue;
    var near = ledgeNear(x, z, d);
    id[i * 10000 + j] = n++; pos.push(x, beachY(d) + 0.09 * near * THREE.MathUtils.smoothstep(d, -0.05, 0.25), z);
    var ao = 1 - 0.13 * near * near; col.push(ao, ao, ao * 1.02 > 1 ? 1 : ao * 1.02);
  }
  for (i = 0; i < N; i++) for (j = 0; j < N; j++) {
    var p0 = id[i * 10000 + j], p1 = id[(i + 1) * 10000 + j], p2 = id[i * 10000 + j + 1], p3 = id[(i + 1) * 10000 + j + 1];
    if (p0 !== undefined && p1 !== undefined && p3 !== undefined) idx.push(p0, p3, p1);
    if (p0 !== undefined && p3 !== undefined && p2 !== undefined) idx.push(p0, p2, p3);
  }
  var g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
  g.setIndex(idx); g.computeVertexNormals();
  var m = toonMat(0xece4d4), base = m.onBeforeCompile; m.vertexColors = true; // colour attr = soft contact shade at the ledge foot
  // milky sand: fine grain, soft wind ripples, a wet band the swash leaves darker, a thin sheet of water that runs
  // up the slope and slides back with a lacy foam edge, and sparse glints on the dry sand (Journey-style glitter).
  m.onBeforeCompile = function (sh) {
    base(sh);
    sh.uniforms.uTime = timeU; sh.uniforms.uNight = nightU;
    sh.vertexShader = "varying vec3 vSW;\n" + sh.vertexShader.replace("#include <project_vertex>", "#include <project_vertex>\nvSW=(modelMatrix*vec4(transformed,1.)).xyz;");
    sh.fragmentShader = "uniform float uTime,uNight; varying vec3 vSW;\n" +
      "float h21(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }\n" +
      "float vn(vec2 p){ vec2 i=floor(p),f=fract(p); f=f*f*(3.-2.*f); return mix(mix(h21(i),h21(i+vec2(1,0)),f.x),mix(h21(i+vec2(0,1)),h21(i+vec2(1,1)),f.x),f.y); }\n" +
      sh.fragmentShader.replace("#include <color_fragment>", [
        "#include <color_fragment>",
        "vec2 sp=vSW.xz; float ang=atan(sp.y,sp.x); float y=vSW.y;",
        "float grain=h21(floor(sp*90.))*0.5+vn(sp*22.)*0.5;",
        "float rp=sin(dot(sp,vec2(0.8,0.6))*38.+vn(sp*3.)*5.); float ripple=smoothstep(0.55,1.,rp)*smoothstep(0.03,0.09,y);",
        "vec3 sand=diffuseColor.rgb*(0.93+0.1*grain)*(1.+0.05*ripple)-vec3(0.012,0.01,0.)*(1.-ripple);",
        "float cyc=uTime*0.55+0.35*sin(ang*3.)+0.15*sin(ang*11.);",
        "float run=pow(0.5+0.5*sin(cyc),1.6); float sw=-0.005+0.055*run+0.006*vn(sp*9.+uTime*0.3);",
        "float wetTop=0.06+0.006*sin(ang*7.);",
        "float wet=1.-smoothstep(wetTop-0.025,wetTop,y);",
        "sand=mix(sand,sand*vec3(0.78,0.82,0.86),wet*0.75);",
        "float film=1.-smoothstep(sw-0.006,sw,y);",
        "sand=mix(sand,mix(sand,vec3(0.62,0.86,0.86),0.45),film*smoothstep(-0.04,0.0,y));",
        "float lace=(1.-smoothstep(0.0,0.006,abs(y-sw)))*smoothstep(0.35,0.75,vn(sp*28.+vec2(uTime*0.4,0.)))*smoothstep(-0.01,0.01,y);",
        "sand=mix(sand,vec3(1.,0.99,0.96),lace*0.85);",
        "diffuseColor.rgb=sand;",
        "float dry=smoothstep(wetTop,wetTop+0.03,y);"
      ].join("\n")).replace("#include <output_fragment>", [
        "{ vec2 cell=floor(vSW.xz*70.); float r=h21(cell); float tw=0.5+0.5*sin(uTime*2.3+r*40.+dot(normalize(vViewPosition).xy,vec2(9.,7.)));",
        "  float glint=step(0.965,r)*pow(tw,12.)*dry; outgoingLight+=mix(vec3(1.,0.95,0.85),vec3(0.75,0.9,1.),uNight)*glint*mix(0.9,0.6,uNight); }",
        "#include <output_fragment>"
      ].join("\n"));
  };
  var beach = new THREE.Mesh(g, m); beach.receiveShadow = true; islandMesh.add(beach);
})();
// pale stone paving of the clearing
var clearing = new THREE.Mesh(new THREE.CylinderGeometry(CR + 0.08, CR + 0.08, 0.03, 40), toonMat(0xe6e8ef));
clearing.position.set(CX, HC + 0.015, 0); islandMesh.add(clearing);
