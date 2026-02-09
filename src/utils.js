/**
 * Utility functions for SVG3D
 */

import { Vec3 } from './math.js';

/**
 * Calculate camera distance to fit an object at a specific viewport fraction.
 * @param {number} objectSize - Approximate size of object (bounding sphere radius or max dimension)
 * @param {number} viewportHeight - Height of viewport in pixels
 * @param {number} fov - Camera field of view in degrees
 * @param {number} viewportFraction - Desired fraction of viewport (0.25 = 1/4, 0.5 = 1/2, etc.)
 * @returns {number} Camera distance from origin
 */
export function calculateCameraDistance(objectSize, viewportHeight, fov = 50, viewportFraction = 0.25) {
  // Convert FOV to radians
  const fovRad = (fov * Math.PI) / 180;
  // Calculate distance needed to fit object at desired fraction
  // Formula: distance = objectSize / (tan(fov/2) * viewportFraction * viewportHeight / viewportHeight)
  // Simplified: distance = objectSize / (tan(fov/2) * viewportFraction)
  const tanHalfFov = Math.tan(fovRad / 2);
  const distance = objectSize / (tanHalfFov * viewportFraction);
  return distance;
}

/**
 * Get bounding box of a geometry from its position attribute.
 * @param {BufferGeometry} geometry
 * @returns {{min: Vec3, max: Vec3, size: Vec3, center: Vec3}}
 */
export function getBoundingBox(geometry) {
  const posAttr = geometry.getAttribute('position');
  if (!posAttr) {
    return {
      min: new Vec3(0, 0, 0),
      max: new Vec3(0, 0, 0),
      size: new Vec3(0, 0, 0),
      center: new Vec3(0, 0, 0)
    };
  }

  const pos = posAttr.array;
  const itemSize = posAttr.itemSize;
  let minX = Infinity, minY = Infinity, minZ = Infinity;
  let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;

  for (let i = 0; i < pos.length; i += itemSize) {
    const x = pos[i];
    const y = pos[i + 1];
    const z = pos[i + 2];
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    minZ = Math.min(minZ, z);
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);
    maxZ = Math.max(maxZ, z);
  }

  const min = new Vec3(minX, minY, minZ);
  const max = new Vec3(maxX, maxY, maxZ);
  const size = new Vec3(maxX - minX, maxY - minY, maxZ - minZ);
  const center = new Vec3(
    (minX + maxX) / 2,
    (minY + maxY) / 2,
    (minZ + maxZ) / 2
  );

  return { min, max, size, center };
}

/**
 * Setup camera to frame an object nicely in the viewport.
 * @param {Camera} camera - Camera instance
 * @param {number} viewportWidth - Viewport width
 * @param {number} viewportHeight - Viewport height
 * @param {BufferGeometry|number} geometryOrSize - Geometry to frame, or approximate size
 * @param {number} viewportFraction - Fraction of viewport to fill (default 0.25 = 1/4)
 */
export function frameObject(camera, viewportWidth, viewportHeight, geometryOrSize, viewportFraction = 0.25) {
  let objectSize;
  if (typeof geometryOrSize === 'number') {
    objectSize = geometryOrSize;
  } else {
    const bbox = getBoundingBox(geometryOrSize);
    // Use the maximum dimension as the size
    objectSize = Math.max(bbox.size.x, bbox.size.y, bbox.size.z);
  }

  const distance = calculateCameraDistance(objectSize, viewportHeight, camera.fov, viewportFraction);
  camera.position.set(0, 0, distance);
  camera.lookAt(0, 0, 0);
  camera.updateProjectionMatrix();
}
