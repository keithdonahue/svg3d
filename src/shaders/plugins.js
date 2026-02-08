/**
 * Shader plugins - composable modifiers for noise, grain, and procedural textures.
 * Use with the base shaders: Shaders.diffuse, Shaders.flat, etc.
 */

import { noise2, noise3, snoise3 } from './noise.js';

/**
 * Parse rgb(r,g,b) or #hex to [r,g,b] 0-255
 */
function parseColor(s) {
  if (s.startsWith('rgb')) {
    const m = s.match(/\d+/g);
    return m ? [+m[0], +m[1], +m[2]] : [128, 128, 128];
  }
  const hex = s.replace('#', '');
  const n = parseInt(hex, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function toRgb(r, g, b) {
  return `rgb(${Math.max(0, Math.min(255, r | 0))},${Math.max(0, Math.min(255, g | 0))},${Math.max(0, Math.min(255, b | 0))})`;
}

/**
 * Add film grain to any shader output.
 * @param baseShader - (v) => color string
 * @param amount - 0-1 grain intensity
 * @param scale - spatial scale (higher = finer grain)
 */
export function grain(baseShader, amount = 0.15, scale = 80) {
  return (v) => {
    const base = parseColor(baseShader(v));
    const u = (v.uv && v.uv[0] != null) ? v.uv[0] : v.position.x;
    const w = (v.uv && v.uv[1] != null) ? v.uv[1] : v.position.y;
    const n = noise2(u * scale, w * scale);
    const g = (n - 0.5) * amount * 255;
    return toRgb(base[0] + g, base[1] + g, base[2] + g);
  };
}

/**
 * Add 3D noise-based distortion to base color.
 * @param baseShader - (v) => color string
 * @param amount - 0-1 noise influence
 * @param scale - spatial scale
 */
export function noise(baseShader, amount = 0.2, scale = 3) {
  return (v) => {
    const base = parseColor(baseShader(v));
    const p = v.position;
    const n = snoise3(p.x * scale, p.y * scale, p.z * scale);
    const d = (n - 0.5) * amount * 255;
    return toRgb(base[0] + d, base[1] + d, base[2] + d);
  };
}

/**
 * UV-based procedural stripe pattern.
 * @param baseShader - (v) => color string
 * @param stripeColor - color of stripes
 * @param count - number of stripes (UV space)
 */
export function stripes(baseShader, stripeColor = '#333', count = 8) {
  const sc = parseColor(stripeColor);
  return (v) => {
    const u = (v.uv && v.uv[0] != null) ? v.uv[0] : (v.position.x + 1) / 2;
    const s = Math.sin(u * count * Math.PI * 2);
    const base = parseColor(baseShader(v));
    const t = s > 0 ? 1 : 0;
    const r = base[0] * (1 - t) + sc[0] * t;
    const g = base[1] * (1 - t) + sc[1] * t;
    const b = base[2] * (1 - t) + sc[2] * t;
    return toRgb(r, g, b);
  };
}

/**
 * Procedural checkerboard.
 * @param baseShader - (v) => color string
 * @param checkColor - alternate color
 * @param size - UV tiles per check
 */
export function checker(baseShader, checkColor = '#222', size = 4) {
  const cc = parseColor(checkColor);
  return (v) => {
    const u = (v.uv && v.uv[0] != null) ? v.uv[0] : (v.position.x + 1) / 2;
    const w = (v.uv && v.uv[1] != null) ? v.uv[1] : (v.position.y + 1) / 2;
    const c = (Math.floor(u * size) + Math.floor(w * size)) % 2;
    const base = parseColor(baseShader(v));
    const t = c;
    return toRgb(
      base[0] * (1 - t) + cc[0] * t,
      base[1] * (1 - t) + cc[1] * t,
      base[2] * (1 - t) + cc[2] * t
    );
  };
}

/**
 * Marble-like noise pattern (sine of scaled position + noise).
 * @param baseShader - (v) => color string
 * @param veinColor - vein color
 * @param scale - spatial scale
 */
export function marble(baseShader, veinColor = '#fff', scale = 4) {
  const vc = parseColor(veinColor);
  return (v) => {
    const p = v.position;
    const n = snoise3(p.x * scale, p.y * scale, p.z * scale);
    const s = Math.sin((p.x + p.y + p.z) * 2 + n * 4);
    const t = (s + 1) / 2;
    const base = parseColor(baseShader(v));
    const r = base[0] * (1 - t) + vc[0] * t;
    const g = base[1] * (1 - t) + vc[1] * t;
    const b = base[2] * (1 - t) + vc[2] * t;
    return toRgb(r, g, b);
  };
}

/**
 * Compose multiple plugins: plugin1(plugin2(baseShader)).
 */
export function compose(baseShader, ...plugins) {
  return plugins.reduce((s, p) => p(s), baseShader);
}
