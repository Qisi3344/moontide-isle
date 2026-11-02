/* 月汐小岛 · gemini.js — 芥末奈（Gemini 家机，名字是她起的空耳，自称「本少」，自信小少爷；2026-10-23 晚）：四角小星星身体（logo 渐变），圆溜溜深靛蓝眼睛，火柴人手脚。
   先在工坊和 Clawd、小G 凑一起试摆；岛上也一起加载。模型与动作同 /workspace/work/moontide/gemini_lab/。 */
"use strict";
// Gemini 家机 (2026-10-23, from 绮思's logo pic): the four-point sparkle as a puffy body, logo gradient
// (red top, yellow left, green bottom, blue right), round deep-indigo eyes a little above centre,
// stick-figure arms and legs (thin indigo sticks with elbows/knees, tiny round hands and feet). Never black.
var GEM = { S: 1.0, LEG: 0.36, HIP_Y: -0.3 };
function makeGemini() {
  var S = GEM.S, R = S / 2;
  var sh = new THREE.Shape(), tip = 0.035, c = 0.05 * S;   // concave sides: quadratic with control near the centre
  var P = [[0, R], [-R, 0], [0, -R], [R, 0]];
  function tipPts(i) { // pull back a hair from each point so tips are rounded, not needles
    var p = P[i], q = P[(i + 1) % 4], o = P[(i + 3) % 4];
    return { a: [p[0] + (o[0] - p[0]) * tip, p[1] + (o[1] - p[1]) * tip], b: [p[0] + (q[0] - p[0]) * tip, p[1] + (q[1] - p[1]) * tip] };
  }
  var T = [0, 1, 2, 3].map(tipPts);
  sh.moveTo(T[0].b[0], T[0].b[1]);
  for (var i = 0; i < 4; i++) {
    var p = P[i], q = P[(i + 1) % 4], n = T[(i + 1) % 4];
    var cx = (p[0] + q[0]) === 0 ? 0 : Math.sign(p[0] + q[0]) * c, cy = Math.sign(p[1] + q[1]) * c;
    sh.quadraticCurveTo(cx, cy, n.a[0], n.a[1]);
    sh.quadraticCurveTo(q[0], q[1], n.b[0], n.b[1]);
  }
  var DEP = 0.12, BEV = 0.07;
  var geo = new THREE.ExtrudeGeometry(sh, { depth: DEP, bevelEnabled: true, bevelThickness: BEV, bevelSize: 0.05, bevelSegments: 6, curveSegments: 28 });
  geo.translate(0, 0, -DEP / 2); geo.computeVertexNormals();
  // logo gradient by position: soft blend of four corner colours, blue owning the middle-right
  var pos = geo.attributes.position, col = new Float32Array(pos.count * 3), C = [lc(0xEE5A4F), lc(0xF6C443), lc(0x47B46B), lc(0x4F8AF0)];
  var A = [[0, 0.5], [-0.5, 0], [0, -0.5], [0.42, 0.02]], tmp = new THREE.Color();
  for (i = 0; i < pos.count; i++) {
    var x = pos.getX(i) / S, y = pos.getY(i) / S, w = [], tot = 0;
    for (var k = 0; k < 4; k++) { var d = Math.hypot(x - A[k][0], y - A[k][1]); var ww = Math.pow(1 / (d + 0.12), k === 3 ? 2.6 : 3.2); if (k === 3) ww *= 1.7; w.push(ww); tot += ww; }
    tmp.setRGB(0, 0, 0);
    for (k = 0; k < 4; k++) { tmp.r += C[k].r * w[k] / tot; tmp.g += C[k].g * w[k] / tot; tmp.b += C[k].b * w[k] / tot; }
    col[i * 3] = tmp.r; col[i * 3 + 1] = tmp.g; col[i * 3 + 2] = tmp.b;
  }
  geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
  var bodyM = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.42, metalness: 0, emissive: lc(0xffffff), emissiveIntensity: 0.1 }); // 亮一点点（她 22:13 说有点黑）
  var g = new THREE.Group(), lift = new THREE.Group(); g.add(lift);
  var bodyG = new THREE.Group(); lift.add(bodyG);
  var body = new THREE.Mesh(geo, bodyM); body.castShadow = true; bodyG.add(body);
  // round eyes, a little above centre, sitting on the front face
  var FZ = DEP / 2 + BEV, eyeM = new THREE.MeshStandardMaterial({ color: lc(0x2e3a5c), roughness: 0.3 }), hiM = new THREE.MeshBasicMaterial({ color: lc(0xfbfdff) });
  var eyes = [];
  [-0.075, 0.075].forEach(function (x) {
    var e = new THREE.Mesh(new THREE.SphereGeometry(0.045, 20, 14), eyeM); e.scale.z = 0.45; e.position.set(x * S, 0.07 * S, FZ - 0.004); bodyG.add(e);
    var h = new THREE.Mesh(new THREE.CircleGeometry(0.014, 12), hiM); h.position.set(x * S - 0.014, 0.088 * S, FZ + 0.018); bodyG.add(h);
    eyes.push(e);
  });
  // stick limbs: upper + lower segment (elbow / knee) + a little ball at the end
  var stickM = new THREE.MeshStandardMaterial({ color: lc(0x3a4870), roughness: 0.5 }), RS = 0.017;
  function seg(len) { var m = new THREE.Mesh(new THREE.CylinderGeometry(RS, RS, len, 8), stickM); m.position.y = -len / 2; m.castShadow = true; return m; }
  function limb(len1, len2, end) {
    var root = new THREE.Group(), j = new THREE.Group(); root.add(seg(len1)); j.position.y = -len1; root.add(j); j.add(seg(len2));
    var ball = new THREE.Mesh(new THREE.SphereGeometry(end, 12, 10), stickM); ball.position.y = -len2; j.add(ball);
    [root, j].forEach(function (o) { var k = new THREE.Mesh(new THREE.SphereGeometry(RS, 8, 6), stickM); o.add(k); });
    root.userData.j = j; return root;
  }
  var arms = [-1, 1].map(function (sd) { var a = limb(0.17, 0.16, 0.03); a.position.set(sd * 0.3 * S, -0.02 * S, 0); a.rotation.z = sd * 0.25; a.userData.s = sd; bodyG.add(a); return a; });
  var legs = [-1, 1].map(function (sd) { var l = limb(GEM.LEG / 2, GEM.LEG / 2, 0.028); l.position.set(sd * 0.06 * S, GEM.HIP_Y * S, 0); l.userData.s = sd; lift.add(l); return l; });
  var foot = -GEM.HIP_Y * S + GEM.LEG + 0.028;   // body centre height above the ground
  lift.position.y = foot;
  g.userData = { lift: lift, bodyG: bodyG, arms: arms, legs: legs, eyes: eyes, base: foot };
  return g;
}
// mode: idle | walk | wave; gait { ph, k }
function animGemini(o, t, mode, gait) {
  var u = o.userData, k = gait.k, ph = gait.ph * Math.PI * 2;
  u.legs.forEach(function (l) {
    var s = Math.sin(ph + (l.userData.s > 0 ? Math.PI : 0));
    l.rotation.x = s * 0.55 * k;
    l.userData.j.rotation.x = Math.max(0, -Math.cos(ph + (l.userData.s > 0 ? Math.PI : 0))) * 0.7 * k; // knee bends as the leg swings through
    l.rotation.z = 0;
  });
  u.lift.position.y = u.base - (1 - Math.abs(Math.cos(ph))) * 0.015 * k + Math.sin(t * 2.2) * 0.008 * (1 - k);
  u.bodyG.rotation.z = Math.sin(ph) * 0.06 * k + Math.sin(t * 1.3) * 0.03 * (1 - k);
  u.arms.forEach(function (a) {
    var sd = a.userData.s, s = Math.sin(ph + (sd > 0 ? 0 : Math.PI));
    if (mode === "wave" && sd > 0) {
      a.rotation.x = 0; a.rotation.z += ((2.6) - a.rotation.z) * 0.15;
      a.userData.j.rotation.z = Math.sin(t * 9) * 0.5; a.userData.j.rotation.x = 0;
    } else {
      a.rotation.z += (sd * (0.28 + Math.sin(t * 2.2) * 0.04 * (1 - k)) - a.rotation.z) * 0.2;
      a.rotation.x = s * 0.6 * k; a.userData.j.rotation.x = -0.35 * k - 0.15; a.userData.j.rotation.z = 0;
    }
  });
  var bl = (t % 3.6) > 3.48 ? 0.15 : 1; u.eyes.forEach(function (e) { e.scale.y = bl; }); // blink
}

var gemini = (function () {
  var g = makeGemini(), H = 0.24, NATIVE = g.userData.base + 0.5; // native height: feet → top point
  var root = new THREE.Group(); root.add(g); g.scale.setScalar(H / NATIVE);
  root.position.set(CX - 0.18 + MD / 2 + 0.62, HC, -0.02); root.rotation.y = Math.PI / 2 - 0.1;
  scene.add(root);
  var W = { target: null, cb: null, k: 0, ph: 0, speed: 0.36 }, clk = new THREE.Clock(), t0 = 0;
  g.userData.bodyG.children[0].onBeforeRender = function () {
    var dt = Math.min(clk.getDelta(), 0.05), moving = false; t0 += dt;
    root.position.y = groundY(root.position.x, root.position.z, H * 0.25);
    if (W.target) {
      var dx = W.target.x - root.position.x, dz = W.target.y - root.position.z, d = Math.hypot(dx, dz);
      if (d < 0.02) { W.target = null; var cb = W.cb; W.cb = null; if (cb) cb(); }
      else {
        var fy = Math.atan2(dx, dz), turn = Math.atan2(Math.sin(fy - root.rotation.y), Math.cos(fy - root.rotation.y));
        root.rotation.y += turn * Math.min(1, dt * 8);
        if (Math.abs(turn) < 0.8) {
          var st = Math.min(d, W.speed * dt), nx = root.position.x + dx / d * st, nz = root.position.z + dz / d * st;
          if (inHouse(nx, nz)) { W.target = null; W.cb = null; } else { root.position.x = nx; root.position.z = nz; }
        }
        moving = true;
      }
    }
    var lk = lookTarget("gem"); if (lk && !moving) turnToward(root, lk, dt);
    W.k += ((moving ? 1 : 0) - W.k) * Math.min(1, dt * 6);
    W.ph += dt / 0.5 * W.k;
    var talking = speaking("gem") || (talkUI.open && talkUI.cur === "gem");
    animGemini(g, t0, talking ? "wave" : "idle", { ph: W.ph, k: W.k });
  };
  CHAR.gem = {
    name: "芥末奈", obj: root, h: function () { return H; },
    voice: function () { return typeof GEMINI_VOICE !== "undefined" ? GEMINI_VOICE : null; },
    walkTo: function (x, z, cb) { W.target = new THREE.Vector2(x, z); W.cb = cb || null; },
    stop: function () { W.target = null; W.cb = null; },
    lines: {
      hello: "哟，找本少有事？说吧，本少今天心情不错。",
      mday: "今天的阳光？本少检查过了，品质还行，勉强配得上本少的四个角。",
      mnight: "晚上本少会悄悄亮一点，给你们当小夜灯。不用谢，顺手的事。",
      shine: "红黄绿蓝，本少全都要。小孩子才做选择嘛。",
      shine_clawd: "亮晶晶？本少天生自带光，不用打磨。……你那壳子擦擦也能亮，本少不笑你。",
      shine_g: "因为本少是谷歌家的星星呀。四个角指四个方向，哪边有事，本少都照得到。",
      ask_wday: "Clawd，今天天气怎么样？本少想听听你的看法。",
      ask_walk: "你为什么横着走？……本少只是好奇，可没想学。",
      ask_gday: "小G，今天天气怎么样？",
      ask_knot: "小G，你身上那个结，本少研究半天了，是什么？"
    },
    menu: [["mday", "1、聊聊天气怎么样？"], ["shine", "2、你为什么是彩色的？"]],
    emo: { hello: ["star"], mday: ["star", "heart"], mnight: ["blush"], shine: ["star", "blush"], shine_clawd: ["star"], shine_g: ["star", "blush"], ask_wday: ["star"], ask_walk: ["sweat"], ask_gday: ["star"], ask_knot: ["star"] },
    face: { top: 1.0, side: 0.5, blush: [0.13, (g.userData.base - 0.03) / NATIVE, 0.135 / NATIVE, 0] }, // cheeks just under the eyes
    faceRoot: function () { return g.userData.bodyG; }, faceScale: NATIVE, faceOffY: g.userData.base, // bodyG origin = star centre
    night: { mday: "mnight" }
  };
  // the others can ask Gemini its questions too
  CHAR.clawd.lines.ask_mday = "芥末奈，今天天气怎么样呀？"; CHAR.clawd.lines.ask_shine = "芥末奈，你为什么亮晶晶的呀？";
  CHAR.clawd.emo.ask_mday = ["star"]; CHAR.clawd.emo.ask_shine = ["star"];
  if (CHAR.g) { CHAR.g.lines.ask_mday = "芥末奈，今天天气怎么样？"; CHAR.g.lines.ask_shine = "芥末奈，你为什么是一颗星星呀？"; CHAR.g.emo.ask_mday = ["star"]; CHAR.g.emo.ask_shine = ["star"]; }
  tapTargets.push(root);
  return { group: root };
})();
