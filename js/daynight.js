/* 月汐小岛 · daynight.js — 白天 / 夜晚切换 */
"use strict";
// ---------- day / night ----------
var tmpC = new THREE.Color(), tmpV = new THREE.Vector3();
function applyNight(e) {
  nightU.value = e;
  skyU.uTop.value.copy(DAY.top).lerp(NIGHT.top, e);
  skyU.uBot.value.copy(DAY.bot).lerp(NIGHT.bot, e);
  scene.fog.color.copy(skyU.uBot.value);
  seaU.uFog.value.copy(skyU.uBot.value);
  seaU.uSky.value.copy(skyU.uTop.value);
  hemi.color.copy(DAY.hemi).lerp(NIGHT.hemi, e);
  hemi.groundColor.copy(DAY.ground).lerp(NIGHT.ground, e);
  hemi.intensity = lerp(0.36, 0.3, e); // 2026-10-21: day was washing the white trees/house/lamps out
  sun.color.copy(DAY.dir).lerp(NIGHT.dir, e);
  sun.intensity = lerp(0.95, 0.35, e);
  renderer.toneMappingExposure = lerp(0.74, 0.9, e);
  rimU.value = lerp(0.07, 0.22, e);
  tmpV.copy(SUN_DIR).lerp(MOON_DIR, e).normalize();
  sun.position.copy(tmpV).multiplyScalar(20);
  seaU.uSun.value.copy(tmpV);
  tmpC.copy(DAY.top).lerp(NIGHT.top, e).convertLinearToSRGB();
  document.body.style.background = "#" + tmpC.getHexString();
}
