/**
 * Lightweight noise utilities for shader plugins.
 * Stateless, no allocations - safe for per-vertex use.
 */

/** Hash for 3D position -> pseudo-random [0,1] */
export function noise3(x, y, z) {
  const p = x * 12.9898 + y * 78.233 + z * 45.164;
  return ((Math.sin(p) * 43758.5453) % 1);
}

/** Smooth 3D noise via tri-linear interpolation of 8 samples */
export function snoise3(x, y, z) {
  const ix = Math.floor(x), iy = Math.floor(y), iz = Math.floor(z);
  const fx = x - ix, fy = y - iy, fz = z - iz;
  const ux = fx * fx * (3 - 2 * fx), uy = fy * fy * (3 - 2 * fy), uz = fz * fz * (3 - 2 * fz);

  const n000 = noise3(ix, iy, iz);
  const n001 = noise3(ix, iy, iz + 1);
  const n010 = noise3(ix, iy + 1, iz);
  const n011 = noise3(ix, iy + 1, iz + 1);
  const n100 = noise3(ix + 1, iy, iz);
  const n101 = noise3(ix + 1, iy, iz + 1);
  const n110 = noise3(ix + 1, iy + 1, iz);
  const n111 = noise3(ix + 1, iy + 1, iz + 1);

  const nx00 = n000 * (1 - ux) + n100 * ux;
  const nx01 = n001 * (1 - ux) + n101 * ux;
  const nx10 = n010 * (1 - ux) + n110 * ux;
  const nx11 = n011 * (1 - ux) + n111 * ux;
  const nxy0 = nx00 * (1 - uy) + nx10 * uy;
  const nxy1 = nx01 * (1 - uy) + nx11 * uy;
  return nxy0 * (1 - uz) + nxy1 * uz;
}

/** 2D noise for UV-based effects */
export function noise2(u, v) {
  return noise3(u * 100, v * 100, 0);
}
