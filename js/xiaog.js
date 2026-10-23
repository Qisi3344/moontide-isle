/* 月汐小岛 · xiaog.js — 小G（GPT 家机）：软软的团子头 + 小身子，胸口绣着结。
   形状来自果冻捏捏里的「毛绒小G」SDF（crab3d.js gParts），去掉了 shell 毛（太吃渲染），
   用 sheen 绒面材质代替毛绒感；结用深靛蓝线绣（不用黑色）。工坊试摆中。 */
"use strict";
var xiaoG = (function () {
  var GS = 1.25; // same 1.25 scale the plush used
  function sdEll(x, y, z, rx, ry, rz) {
    var a = Math.sqrt(x * x / (rx * rx) + y * y / (ry * ry) + z * z / (rz * rz));
    var b = Math.sqrt(x * x / (rx * rx * rx * rx) + y * y / (ry * ry * ry * ry) + z * z / (rz * rz * rz * rz)) || 1e-6;
    return a * (a - 1) / b;
  }
  function smin(a, b, k) { var h = Math.max(k - Math.abs(a - b), 0) / k; return Math.min(a, b) - h * h * k * 0.25; }
  function parts(x, y, z) {
    var d = sdEll(x - 0.03, y - 0.62, z, 1.42, 1.25, 1.08);          // big soft head
    d = smin(d, sdEll(x, y + 0.85, z, 0.78, 0.8, 0.66), 0.32);        // little body
    for (var s = -1; s <= 1; s += 2) {
      var ax = x - s * 0.82, ay = y + 0.72, a = s * 0.9, c = Math.cos(a), sn = Math.sin(a);
      d = smin(d, sdEll(ax * c + ay * sn, -ax * sn + ay * c, z - 0.04, 0.33, 0.24, 0.26), 0.16); // stubby arms
      d = smin(d, sdEll(x - s * 0.3, y + 1.62, z - 0.04, 0.3, 0.3, 0.32), 0.14);                  // feet
    }
    return d;
  }
  // separate part distances (torso = head+body, then feet L/R, arms L/R) → skin weights
  function partD(x, y, z) {
    var t = smin(sdEll(x - 0.03, y - 0.62, z, 1.42, 1.25, 1.08), sdEll(x, y + 0.85, z, 0.78, 0.8, 0.66), 0.32), out = [t];
    for (var s = -1; s <= 1; s += 2) out.push(sdEll(x - s * 0.3, y + 1.62, z - 0.04, 0.3, 0.3, 0.32));
    for (s = -1; s <= 1; s += 2) {
      var ax = x - s * 0.82, ay = y + 0.72, a = s * 0.9, c = Math.cos(a), sn = Math.sin(a);
      out.push(sdEll(ax * c + ay * sn, -ax * sn + ay * c, z - 0.04, 0.33, 0.24, 0.26));
    }
    return out; // [torso, footL, footR, armL, armR]
  }
  function sdf(x, y, z) { return parts(x / GS, y / GS, z / GS) * GS; }

  // surface nets mesher (same idea as the plush build, without particles / fur)
  function mesh() {
    var B = [-1.75, -2.2, -1.3, 3.5, 4.3, 2.6], h = 0.06 * GS;
    var x0 = B[0] * GS, y0 = B[1] * GS, z0 = B[2] * GS;
    var nx = Math.ceil(B[3] * GS / h) + 1, ny = Math.ceil(B[4] * GS / h) + 1, nz = Math.ceil(B[5] * GS / h) + 1;
    var F = new Float32Array(nx * ny * nz), i, j, k;
    function id(i, j, k) { return (k * ny + j) * nx + i; }
    for (k = 0; k < nz; k++) for (j = 0; j < ny; j++) for (i = 0; i < nx; i++) F[id(i, j, k)] = sdf(x0 + i * h, y0 + j * h, z0 + k * h);
    var vid = new Int32Array((nx - 1) * (ny - 1) * (nz - 1)).fill(-1), V = [];
    function cid(i, j, k) { return (k * (ny - 1) + j) * (nx - 1) + i; }
    var CE = [[0, 1], [2, 3], [4, 5], [6, 7], [0, 2], [1, 3], [4, 6], [5, 7], [0, 4], [1, 5], [2, 6], [3, 7]];
    for (k = 0; k < nz - 1; k++) for (j = 0; j < ny - 1; j++) for (i = 0; i < nx - 1; i++) {
      var c = [], m = 0, q;
      for (q = 0; q < 8; q++) { var v = F[id(i + (q & 1), j + ((q >> 1) & 1), k + ((q >> 2) & 1))]; c.push(v); if (v < 0) m |= 1 << q; }
      if (m === 0 || m === 255) continue;
      var sx = 0, sy = 0, sz = 0, ne = 0;
      for (var e = 0; e < 12; e++) {
        var a0 = CE[e][0], b0 = CE[e][1]; if ((c[a0] < 0) === (c[b0] < 0)) continue;
        var t = c[a0] / (c[a0] - c[b0]);
        sx += (a0 & 1) + ((b0 & 1) - (a0 & 1)) * t; sy += ((a0 >> 1) & 1) + (((b0 >> 1) & 1) - ((a0 >> 1) & 1)) * t; sz += ((a0 >> 2) & 1) + (((b0 >> 2) & 1) - ((a0 >> 2) & 1)) * t; ne++;
      }
      vid[cid(i, j, k)] = V.length / 3;
      V.push(x0 + (i + sx / ne) * h, y0 + (j + sy / ne) * h, z0 + (k + sz / ne) * h);
    }
    var I = [];
    function quad(a, b, cc, d, ax, inside) {
      if (a < 0 || b < 0 || cc < 0 || d < 0) return;
      var ux = V[cc * 3] - V[a * 3], uy = V[cc * 3 + 1] - V[a * 3 + 1], uz = V[cc * 3 + 2] - V[a * 3 + 2];
      var wx = V[d * 3] - V[b * 3], wy = V[d * 3 + 1] - V[b * 3 + 1], wz = V[d * 3 + 2] - V[b * 3 + 2];
      var n = ax === 0 ? uy * wz - uz * wy : ax === 1 ? uz * wx - ux * wz : ux * wy - uy * wx;
      if (n * (inside ? 1 : -1) < 0) I.push(a, d, cc, a, cc, b); else I.push(a, b, cc, a, cc, d);
    }
    for (k = 1; k < nz - 1; k++) for (j = 1; j < ny - 1; j++) for (i = 1; i < nx - 1; i++) {
      var f0 = F[id(i, j, k)] < 0;
      if (f0 !== (F[id(i + 1, j, k)] < 0)) quad(vid[cid(i, j - 1, k - 1)], vid[cid(i, j, k - 1)], vid[cid(i, j, k)], vid[cid(i, j - 1, k)], 0, f0);
      if (f0 !== (F[id(i, j + 1, k)] < 0)) quad(vid[cid(i - 1, j, k - 1)], vid[cid(i, j, k - 1)], vid[cid(i, j, k)], vid[cid(i - 1, j, k)], 1, f0);
      if (f0 !== (F[id(i, j, k + 1)] < 0)) quad(vid[cid(i - 1, j - 1, k)], vid[cid(i, j - 1, k)], vid[cid(i, j, k)], vid[cid(i - 1, j, k)], 2, f0);
    }
    // snap onto the true surface, smooth normals from the field
    var nv = V.length / 3, N = new Float32Array(nv * 3), e2 = 0.012, mnY = 1e9, mxY = -1e9;
    function grad(x, y, z) {
      var gx = sdf(x + e2, y, z) - sdf(x - e2, y, z), gy = sdf(x, y + e2, z) - sdf(x, y - e2, z), gz = sdf(x, y, z + e2) - sdf(x, y, z - e2), l = Math.sqrt(gx * gx + gy * gy + gz * gz) || 1;
      return [gx / l, gy / l, gz / l];
    }
    for (i = 0; i < nv; i++) {
      var px = V[i * 3], py = V[i * 3 + 1], pz = V[i * 3 + 2];
      for (var it = 0; it < 2; it++) { var d0 = sdf(px, py, pz), g = grad(px, py, pz); px -= g[0] * d0; py -= g[1] * d0; pz -= g[2] * d0; }
      V[i * 3] = px; V[i * 3 + 1] = py; V[i * 3 + 2] = pz; mnY = Math.min(mnY, py); mxY = Math.max(mxY, py);
      var nn = grad(px, py, pz); N[i * 3] = nn[0]; N[i * 3 + 1] = nn[1]; N[i * 3 + 2] = nn[2];
    }
    // skin: bones 0 root, 1 torso, 2/3 feet, 4/5 arms — soft weights from how close each part is
    var SI = new Uint16Array(nv * 4), SW = new Float32Array(nv * 4);
    for (i = 0; i < nv; i++) {
      var pd = partD(V[i * 3] / GS, V[i * 3 + 1] / GS, V[i * 3 + 2] / GS), w = [], tot = 0;
      for (var b = 0; b < 5; b++) { var ww = Math.exp(-Math.max(pd[b], -0.02) * 22); w.push(ww); tot += ww; }
      var ord = [0, 1, 2, 3, 4].sort(function (p, q) { return w[q] - w[p]; }), t4 = w[ord[0]] + w[ord[1]] + w[ord[2]] + w[ord[3]];
      for (b = 0; b < 4; b++) { SI[i * 4 + b] = ord[b] + 1; SW[i * 4 + b] = w[ord[b]] / t4; }
    }
    for (i = 1; i < V.length; i += 3) V[i] -= mnY; // feet on y = 0
    var geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(V), 3));
    geo.setAttribute("normal", new THREE.BufferAttribute(N, 3));
    geo.setAttribute("skinIndex", new THREE.Uint16BufferAttribute(SI, 4));
    geo.setAttribute("skinWeight", new THREE.Float32BufferAttribute(SW, 4));
    geo.setIndex(I);
    return { geo: geo, height: mxY - mnY, dy: -mnY };
  }

  // the knot, drawn in deep indigo thread on a clear canvas
  var KNOT = "M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.872zm16.5963 3.8558L13.1038 8.364 15.1192 7.2a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.407-.667zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813zm1.0976-2.3654l2.602-1.4998 2.6069 1.4998v2.9994l-2.5974 1.4997-2.6067-1.4997Z";
  function knotTex() {
    try {
      var cv = document.createElement("canvas"); cv.width = cv.height = 256; var c = cv.getContext("2d");
      c.clearRect(0, 0, 256, 256); c.setTransform(256 / 24, 0, 0, 256 / 24, 0, 0);
      c.fillStyle = "#2e3a5c"; c.fill(new Path2D(KNOT));
      return new THREE.CanvasTexture(cv);
    } catch (e) { return null; }
  }

  var M = mesh(), tex = knotTex();
  var mat = new THREE.MeshPhysicalMaterial({
    color: lc(0xf6f1ea), roughness: 0.92, metalness: 0,
    sheen: 1, sheenColor: lc(0xffffff), sheenRoughness: 0.55   // velvet rim instead of shell fur
  });
  var LC = new THREE.Vector3(0.03 * GS, 0.62 * GS + M.dy, 2.05);  // knot centre (x, y) + width, in mesh units
  if (tex) mat.onBeforeCompile = function (sh) {
    sh.uniforms.uKnot = { value: tex }; sh.uniforms.uKP = { value: LC }; sh.uniforms.uInk = { value: lc(0x2e3a5c) };
    sh.vertexShader = "varying vec3 vLP; varying vec3 vLN;\n" + sh.vertexShader.replace("#include <begin_vertex>", "#include <begin_vertex>\n vLP = position; vLN = normal;");
    sh.fragmentShader = "uniform sampler2D uKnot; uniform vec3 uKP; uniform vec3 uInk; varying vec3 vLP; varying vec3 vLN;\n" +
      sh.fragmentShader.replace("#include <color_fragment>", [
        "#include <color_fragment>",
        "{ vec2 kuv = (vLP.xy - uKP.xy) / uKP.z + 0.5;",
        "  float inb = step(0.0, kuv.x) * step(kuv.x, 1.0) * step(0.0, kuv.y) * step(kuv.y, 1.0);",
        "  float face = smoothstep(0.2, 0.45, vLN.z) * step(0.0, vLP.z);",
        "  float a = texture2D(uKnot, clamp(kuv, 0.0, 1.0)).a * inb * face;",
        "  diffuseColor.rgb = mix(diffuseColor.rgb, uInk, a * 0.92); }"
      ].join("\n"));
  };
  mat.customProgramCacheKey = function () { return "xiaogKnot"; };

  // ---- a little skeleton: root → torso → arms, root → feet (pivots at hips / shoulders) ----
  var g = new THREE.Group(), body = new THREE.SkinnedMesh(M.geo, mat);
  var bRoot = new THREE.Bone(), bTorso = new THREE.Bone(), bF = [new THREE.Bone(), new THREE.Bone()], bA = [new THREE.Bone(), new THREE.Bone()];
  var TORSO_Y = -0.85 * GS + M.dy, HIP_Y = -1.36 * GS + M.dy, SH_Y = -0.52 * GS + M.dy;
  bTorso.position.set(0, TORSO_Y, 0); bRoot.add(bTorso);
  [-1, 1].forEach(function (sd, k) {
    bF[k].position.set(sd * 0.3 * GS, HIP_Y, 0.04 * GS); bRoot.add(bF[k]);
    bA[k].position.set(sd * 0.6 * GS, SH_Y - TORSO_Y, 0.04 * GS); bTorso.add(bA[k]);
  });
  body.add(bRoot); body.updateMatrixWorld(true);
  body.bind(new THREE.Skeleton([bRoot, bTorso, bF[0], bF[1], bA[0], bA[1]]));
  body.frustumCulled = false;
  body.castShadow = true; body.receiveShadow = true;
  g.add(body);
  var H = 0.26;                          // standing height (Clawd 0.2, door 0.4)
  body.scale.setScalar(H / M.height);
  // beside the door, the other side from Clawd
  g.position.set(CX - 0.18 + MD / 2 + 0.42, HC, -0.38); g.rotation.y = Math.PI / 2 - 0.15;
  scene.add(g);
  tapTargets.push(g);

  // ---- walking (a little waddle, facing where it goes), breathing, boing when poked ----
  var squish = 0, t0 = 0, W = { target: null, cb: null, amt: 0, ph: 0, speed: 0.34 };
  function poke() { squish = 1; }
  var clk = new THREE.Clock();
  body.onBeforeRender = function () {
    var dt = Math.min(clk.getDelta(), 0.05), moving = false;
    g.position.y = groundY(g.position.x, g.position.z, H * 0.25);
    if (W.target) {
      var dx = W.target.x - g.position.x, dz = W.target.y - g.position.z, d = Math.hypot(dx, dz);
      if (d < 0.02) { W.target = null; var cb = W.cb; W.cb = null; if (cb) cb(); }
      else {
        var fy = Math.atan2(dx, dz), turn = Math.atan2(Math.sin(fy - g.rotation.y), Math.cos(fy - g.rotation.y));
        g.rotation.y += turn * Math.min(1, dt * 8);
        if (Math.abs(turn) < 0.8) {
          var st = Math.min(d, W.speed * dt * (H / 0.26)), nx = g.position.x + dx / d * st, nz = g.position.z + dz / d * st;
          if (inHouse(nx, nz)) { W.target = null; W.cb = null; } else { g.position.x = nx; g.position.z = nz; }
        }
        moving = true;
      }
    }
    var lk = lookTarget("g");
    if (lk && !moving) turnToward(g, lk, dt);
    W.amt += ((moving ? 1 : 0) - W.amt) * Math.min(1, dt * 10);
    W.ph += dt * 9 * W.amt;
    // proper little steps: feet swing + lift in turn, arms swing opposite, torso sways and bobs
    var a = W.amt, ph = W.ph, talking = speaking("g");
    [0, 1].forEach(function (k) {
      var off = k ? Math.PI : 0, sw = Math.sin(ph + off), sd = k ? 1 : -1;
      bF[k].rotation.x = -sw * 0.55 * a;
      bF[k].position.y = HIP_Y + Math.max(0, Math.cos(ph + off)) * 0.32 * GS * a;
      bA[k].rotation.x = sw * 0.7 * a;
      bA[k].rotation.z = sd * (0.12 * a + (talking ? 0.18 + Math.sin(t0 * 9 + k * 2) * 0.12 : Math.sin(t0 * 2.2) * 0.04));
    });
    bTorso.rotation.z = Math.sin(ph) * 0.07 * a;
    bTorso.rotation.y = Math.sin(ph) * 0.1 * a;
    bTorso.position.y = TORSO_Y + Math.abs(Math.cos(ph)) * 0.08 * GS * a;
    t0 += dt; squish = Math.max(0, squish - dt * 1.6);
    var br = 1 + Math.sin(t0 * 2.2) * 0.012, b = squish * Math.sin(squish * 18) * 0.12;
    if (speaking("g")) b += Math.sin(t0 * 16) * 0.025;                 // bobs along while it talks
    g.scale.set(1 + b * 0.6, br - b, 1 + b * 0.6);
  };

  CHAR.g = {
    name: "小G", obj: g, h: function () { return H; },
    voice: function () { return typeof XIAOG_VOICE !== "undefined" ? XIAOG_VOICE : null; },
    lines: {
      hello: "嗯？你找我呀？",
      gday: "太阳把我的绒毛晒得暖烘烘的，好想在长椅上眯一会儿～",
      gnight: "夜里好安静，我在数天上的星星，数到一百就困啦。",
      knot: "这是我身上绣的小结，是一圈一圈绕起来的念头哦！",
      ask_wday: "Clawd，今天天气怎么样？",       // asked by 小G when visiting Clawd
      ask_walk: "你为什么横着走路呀？"
    },
    menu: [["gday", "1、聊聊天气怎么样？"], ["knot", "2、你身上的结是什么？"]],
    emo: { hello: ["blush"], gday: ["blush", "heart"], gnight: ["star"], knot: ["blush", "star"], ask_wday: ["star"], ask_walk: ["sweat"] },
    face: (function () { // cheeks just outside the knot, on the head's curve; in "height = 1" units
      var x = 0.95, y = -0.35, nz = 1 - Math.pow((x - 0.03) / 1.42, 2) - Math.pow(y / 1.25, 2), z = 1.08 * Math.sqrt(Math.max(nz, 0.05));
      var u = GS / M.height;
      return { top: 1.0, side: 0.62, blush: [x * u, ((0.62 + y) * GS + M.dy) / M.height, z * u + 0.012, Math.atan2(x / (1.42 * 1.42), z / (1.08 * 1.08))] };
    })(),
    night: { gday: "gnight" }
  };

  // ---- who am I steering? (Sims-style picker, bottom centre) ----
  (function () {
    var bar = document.createElement("div"); bar.className = "x-glass";
    bar.style.cssText = "position:fixed;left:50%;bottom:calc(76px + env(safe-area-inset-bottom));transform:translateX(-50%);display:flex;gap:6px;padding:6px;border-radius:999px;z-index:5;color:#4a5674;font-size:13px;align-items:center";
    var lab = document.createElement("span"); lab.textContent = "操纵"; lab.style.cssText = "padding:0 4px 0 8px;opacity:.75";
    bar.appendChild(lab);
    var btns = {};
    [["clawd", "🦀 Clawd"], ["g", "☁️ 小G"]].forEach(function (o) {
      var b = document.createElement("button"); b.type = "button"; b.textContent = o[1];
      b.style.cssText = "font:inherit;font-weight:600;border:none;border-radius:999px;padding:7px 14px;cursor:pointer;transition:background .2s,color .2s";
      b.addEventListener("click", function () { pick(o[0]); });
      bar.appendChild(b); btns[o[0]] = b;
    });
    function pick(n) {
      ctrl = n;
      Object.keys(btns).forEach(function (k) {
        var on = k === n; btns[k].setAttribute("aria-pressed", on ? "true" : "false");
        btns[k].style.background = on ? "#8fb8d8" : "rgba(255,255,255,0.6)"; btns[k].style.color = on ? "#fbfdff" : "#5b6b86";
      });
    }
    ["pointerdown", "pointerup", "touchstart", "click"].forEach(function (ev) { bar.addEventListener(ev, function (e) { e.stopPropagation(); }); });
    document.body.appendChild(bar); pick(ctrl);
  })();

  return {
    group: g, poke: poke,
    walkTo: function (x, z, cb) { W.target = new THREE.Vector2(x, z); W.cb = cb || null; },
    stop: function () { W.target = null; W.cb = null; },
    setHeight: function (h) { H = h; body.scale.setScalar(H / M.height); }
  };
})();
