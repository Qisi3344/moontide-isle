// Clawd 方块版 (2026-10-23, from 绮思's side sketch): cube body, cube legs, cube claws. Native: body 1 wide.
// front (eyes) faces +z; claws stick out on ±x; 8 square legs: 4 front row, 4 back row (she corrected 19:39), body depth 0.675; feet at y=0.
function lc(h) { return new THREE.Color(h).convertSRGBToLinear(); }
function rbox(w, h, d, r, seg) { // a box with softly rounded edges: still a block, never a sharp "白模" corner
  var g = new THREE.BoxGeometry(w, h, d, seg || 6, seg || 6, seg || 6), p = g.attributes.position, v = new THREE.Vector3();
  var hx = w / 2 - r, hy = h / 2 - r, hz = d / 2 - r;
  for (var i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    var c = new THREE.Vector3(Math.max(-hx, Math.min(hx, v.x)), Math.max(-hy, Math.min(hy, v.y)), Math.max(-hz, Math.min(hz, v.z)));
    var n = v.clone().sub(c); if (n.lengthSq() > 1e-9) n.setLength(r); v.copy(c).add(n);
    p.setXYZ(i, v.x, v.y, v.z);
  }
  g.computeVertexNormals(); return g;
}
function makeClawd() {
  var W = 1.0, H = 0.78, D = 0.675, LEG = 0.24, LW = 0.17;           // body + legs (from her sketch)
  var orange = new THREE.MeshStandardMaterial({ color: lc(0xD97757), roughness: 0.62 });
  var belly = new THREE.MeshStandardMaterial({ color: lc(0xC9694B), roughness: 0.7 });   // legs a touch deeper
  var eyeM = new THREE.MeshStandardMaterial({ color: lc(0x2e3a5c), roughness: 0.35 });   // deep indigo, never black
  var hiM = new THREE.MeshBasicMaterial({ color: lc(0xfbfdff) });
  var g = new THREE.Group(), bodyG = new THREE.Group(); g.add(bodyG);
  var body = new THREE.Mesh(rbox(W, H, D, 0.065), orange); body.position.y = LEG + H / 2; body.castShadow = true; bodyG.add(body);
  var eyes = [];
  [-0.2, 0.2].forEach(function (x) {                               // tall narrow eyes, upper middle of the front
    var e = new THREE.Group(); e.position.set(x, LEG + H * 0.56, D / 2);
    var b = new THREE.Mesh(rbox(0.085, 0.22, 0.03, 0.012, 3), eyeM); e.add(b);
    var h = new THREE.Mesh(new THREE.PlaneGeometry(0.03, 0.05), hiM); h.position.set(-0.016, 0.06, 0.017); e.add(h);
    bodyG.add(e); eyes.push(e);
  });
  var happy = [-0.2, 0.2].map(function (x) {                     // ^ ^ smiling eyes (cheer / cute)
    var a = new THREE.Mesh(new THREE.TorusGeometry(0.055, 0.016, 8, 20, Math.PI), eyeM);
    a.position.set(x, LEG + H * 0.56, D / 2 + 0.006); a.visible = false; bodyG.add(a); return a;
  });
  var blushM = new THREE.MeshBasicMaterial({ color: lc(0xF5A3AE), transparent: true, opacity: 0 });
  var blush = [-0.33, 0.33].map(function (x) {
    var b = new THREE.Mesh(new THREE.CircleGeometry(0.055, 24), blushM); b.scale.y = 0.6;
    b.position.set(x, LEG + H * 0.4, D / 2 + 0.004); bodyG.add(b); return b;
  });
  var claws = [-1, 1].map(function (s) {                           // a cube claw on each side, mid height
    var piv = new THREE.Group(); piv.position.set(s * W / 2, LEG + H * 0.42, 0); bodyG.add(piv);
    var c = new THREE.Mesh(rbox(0.22, 0.2, 0.22, 0.035), orange); c.position.x = s * 0.1; c.castShadow = true; piv.add(c);
    piv.userData.s = s; return piv;
  });
  var legs = [];
  [-0.4, -0.15, 0.15, 0.4].forEach(function (x, i) {
    [-0.2, 0.2].forEach(function (z, j) {
      var piv = new THREE.Group(); piv.position.set(x * W, LEG, z); g.add(piv);
      var m = new THREE.Mesh(rbox(LW, LEG + 0.04, LW, 0.028, 6), belly); m.position.y = -(LEG + 0.04) / 2 + 0.02; m.castShadow = true; piv.add(m);
      piv.userData.ph = (i + j) % 2; legs.push(piv);
    });
  });
  g.userData = { bodyG: bodyG, eyes: eyes, happy: happy, blushM: blushM, claws: claws, legs: legs, H: LEG + H };
  return g;
}
// mode: "idle" | "walk" (sideways, crab) | "wave".  gait = {ph, dir, k}: phase in cycles, travel dir ±1, k 0..1 walking blend
// walk (19:45): real crab-ish gait — alternating tetrapod (checkerboard groups, half a cycle apart); each leg spends 60%
// of a cycle planted (foot slides back as the body moves over it) and 40% swinging: lifts, reaches toward the travel
// direction, sets down. Leading-side legs reach further (they pull), trailing legs push with a shorter stroke.
var GAIT = { T: 0.72, A: 0.26, duty: 0.6 }; // calmer (19:49: 她说抖得太厉害)
function smooth(x) { return x * x * (3 - 2 * x); }
function animClawd(c, t, mode, gait) {
  var u = c.userData, gk = gait ? gait.k : 0, dir = gait ? gait.dir : 1, ph = gait ? gait.ph : 0;
  u.legs.forEach(function (l) {
    var q = (ph + l.userData.ph * 0.5) % 1, a, lift = 0;
    if (q < GAIT.duty) a = 1 - 2 * (q / GAIT.duty);                       // planted: +1 → -1 (relative to travel)
    else { var w = (q - GAIT.duty) / (1 - GAIT.duty); a = -1 + 2 * smooth(w); lift = Math.sin(w * Math.PI); }
    var lead = l.position.x * dir > 0 ? 1.15 : 0.8;
    l.rotation.z = a * GAIT.A * lead * dir * gk;
    l.position.y = 0.24 + lift * 0.02 * gk;
  });
  u.bodyG.position.y = gk * 0.006 + (1 - gk) * Math.sin(t * 2.2) * 0.008; // body glides level while walking, no bob
  u.bodyG.rotation.z = gk * -dir * 0.03;                                  // just a slight lean into the walk
  u.bodyG.scale.y = 1 + (1 - gk) * Math.sin(t * 2.2) * 0.012;            // a little breath when still
  if (mode !== "dance") c.rotation.y = 0;
  if (mode === "cheer") {                                          // 欢呼: hop hop, both claws thrown up and shaking
    var hop = Math.abs(Math.sin(t * 5.2));
    u.bodyG.position.y = hop * 0.16; u.bodyG.scale.y = 1 + (hop < 0.25 ? -0.04 : 0.02);
    u.bodyG.rotation.z = 0;
  } else if (mode === "dance") {                                    // 极乐净土 15s (140 BPM): 扇子手 → 横跳 → 转圈扭 → 捧脸 → 定格
    var T = u.dt || 0, b = T * 140 / 60, ph = T < 4 ? 0 : T < 8 ? 1 : T < 11 ? 2 : T < 14 ? 3 : 4;
    u.ph = ph; u.b = b;
    var rz = 0, py = 0, ry = 0;
    if (ph === 0) { rz = Math.sin(Math.PI * b) * 0.12; py = Math.abs(Math.sin(Math.PI * b)) * 0.025; }
    else if (ph === 1) { py = Math.abs(Math.sin(Math.PI * b)) * 0.06; rz = -Math.cos(Math.PI * b / 2) * 0.07; }
    else if (ph === 2) { var k = Math.min(1, (T - 8) / 1.7); ry = (k * k * (3 - 2 * k)) * Math.PI * 2; rz = T > 9.7 ? Math.sin(2 * Math.PI * b) * 0.15 : 0; py = Math.abs(Math.sin(Math.PI * b)) * 0.03; }
    else if (ph === 3) { rz = (Math.floor(b) % 2 ? 1 : -1) * 0.12; py = Math.abs(Math.sin(Math.PI * b)) * 0.035; }
    else { py = 0.03; }
    u.bodyG.rotation.z += (rz - u.bodyG.rotation.z) * (ph === 3 ? 0.3 : 1);
    u.bodyG.position.y = py; u.bodyG.scale.y = 1 + Math.abs(Math.cos(Math.PI * b)) * 0.025; c.rotation.y = ry;
  } else if (mode === "cute") {                                     // 卖萌: sway side to side, head tilt, tiny bounce
    var sw = Math.sin(t * 3.2);
    u.bodyG.rotation.z = sw * 0.1; u.bodyG.position.y = Math.abs(sw) * 0.03; u.bodyG.scale.y = 1 + Math.abs(Math.cos(t * 3.2)) * 0.03;
  }
  // legs stay attached to the body (22:39 她说卖萌时腿原地不动像分肢): each leg top follows the body's
  // underside; while swaying the legs stretch/shrink so feet stay planted; while hopping the whole crab leaves the ground.
  u.legs.forEach(function (l) {
    if (!l.userData.x0) l.userData.x0 = l.position.x;
    var x0 = l.userData.x0;
    if (mode === "cheer") {
      l.position.set(x0, 0.24 + u.bodyG.position.y, l.position.z); l.scale.y = 1;
      l.rotation.z = (x0 > 0 ? 1 : -1) * Math.min(1, u.bodyG.position.y * 6) * 0.22;   // legs dangle out mid-air
    } else if (mode === "cute" || mode === "dance") {
      var rz = u.bodyG.rotation.z, cz = Math.cos(rz), sz = Math.sin(rz);
      var yt = x0 * sz + 0.24 * cz + u.bodyG.position.y;
      l.position.set(x0 * cz - 0.24 * sz, yt, l.position.z); l.rotation.z = 0; l.scale.y = yt / 0.24;
    } else { l.position.x = x0; l.scale.y = 1; }
  });
  u.claws.forEach(function (p) {
    var s = p.userData.s;
    if (mode === "cheer") { p.rotation.z = s * (1.25 + Math.sin(t * 14 + (s > 0 ? 0 : 1)) * 0.22); return; }
    if (mode === "dance") {
      var b = u.b || 0, z, y = 0;
      if (u.ph === 0) { z = 0.55 + 0.55 * Math.sin(Math.PI * b + (s > 0 ? 0 : Math.PI)); y = Math.sin(4 * Math.PI * b) * 0.35; } // alternating fan-hand ripple
      else if (u.ph === 1) z = 1.1 + Math.sin(2 * Math.PI * b + (s > 0 ? 0 : 0.5)) * 0.25;                            // wings flapping while side-stepping
      else if (u.ph === 2) z = 0.7 + Math.sin(2 * Math.PI * b) * 0.2;
      else if (u.ph === 3) { z = 1.05 + Math.sin(2 * Math.PI * b) * 0.06; y = -s * 1.0; }                           // claws cupped by the face
      else z = 1.4;                                                                                                // finale: both up
      p.rotation.z = s * z; p.rotation.y = y; return;
    }
    if (mode === "cute") { p.rotation.z = s * (0.95 + Math.sin(t * 6.4 + (s > 0 ? 0 : Math.PI)) * 0.12); p.rotation.y = -s * 0.7; return; }
    p.rotation.y = 0;
    if (mode === "wave") p.rotation.z = s * (0.5 + Math.sin(t * 10 + (s > 0 ? 0 : 1.6)) * 0.35);
    else p.rotation.z = s * (gk * 0.15 + (1 - gk) * Math.sin(t * 2.2) * 0.05); // claws held up, steady, while walking
  });
  var bl = (t % 3.6) < 0.12 ? 0.12 : 1;                            // blink
  var smile = mode === "cheer" || mode === "cute" || mode === "dance";
  u.eyes.forEach(function (e) { e.visible = !smile; e.scale.y = bl; });
  u.happy.forEach(function (a) { a.visible = smile; });
  u.blushM.opacity += ((smile ? 0.85 : 0) - u.blushM.opacity) * 0.12;
}
