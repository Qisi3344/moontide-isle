/* 月汐小岛 · boot.js — 先接好昼夜按钮，检查 WebGL，再按顺序加载各模块 */
"use strict";
// ---------- setup ----------
var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
var stage = document.getElementById("stage");
// day/night toggle wired first so it works even if WebGL is unavailable
var nightTarget = 0, nightT = 0, btn = document.getElementById("dayNight");
function setNight(on) {
  nightTarget = on ? 1 : 0;
  btn.textContent = on ? "☀️" : "🌙";
  btn.setAttribute("aria-label", on ? "切换到白天" : "切换到夜晚");
  btn.setAttribute("aria-pressed", on ? "true" : "false");
  document.body.classList.toggle("is-night", !!on);
}
btn.addEventListener("click", function () { setNight(!nightTarget); });

var BOOT_BASE = document.currentScript && document.currentScript.getAttribute("data-base");
if (BOOT_BASE === null || BOOT_BASE === undefined) BOOT_BASE = "js/";
(function () {
  var ok = false;
  try {
    var c = document.createElement("canvas");
    ok = !!(window.WebGLRenderingContext && (c.getContext("webgl2") || c.getContext("webgl")));
  } catch (e) {}
  if (!ok) {
    window.Island = { setNight: setNight };
    var hint = document.getElementById("hint");
    if (hint) hint.textContent = "这台设备打不开 3D 小岛 QAQ";
    return;
  }
  var files = ["core", "terrain", "props", "spots", "sky", "sea", "labels", "magic", "daynight", "main"];
  (function next(i) {
    if (i >= files.length) return;
    var s = document.createElement("script");
    s.src = BOOT_BASE + files[i] + ".js";
    s.onload = function () { next(i + 1); };
    document.body.appendChild(s);
  })(0);
})();
