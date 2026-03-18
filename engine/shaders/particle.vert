attribute float aHeight;
attribute vec2 aUv;

uniform float uParticleSize;
uniform float uPixelRatio;
uniform float uTime;
uniform vec3 uHoverPoint;
uniform float uHoverRadius;
uniform float uHoverStrength;
uniform vec3 uMaskCenter;
uniform float uMaskRadius;
uniform float uMaskSoftness;

varying float vHeight;
varying float vDistanceToHover;
varying float vMask;
varying float vDepth;
varying vec2 vUv;

void main() {
  vec3 displacedPosition = position;

  float hoverDistance = distance(displacedPosition, uHoverPoint);
  float hoverInfluence = 1.0 - smoothstep(0.0, uHoverRadius, hoverDistance);
  displacedPosition.y += hoverInfluence * uHoverStrength;

  float maskDistance = distance(displacedPosition.xz, uMaskCenter.xz);
  float mask = 1.0 - smoothstep(max(0.0, uMaskRadius - uMaskSoftness), uMaskRadius, maskDistance);

  vec4 mvPosition = modelViewMatrix * vec4(displacedPosition, 1.0);
  gl_Position = projectionMatrix * mvPosition;

  float perspectiveScale = clamp(160.0 / max(1.0, -mvPosition.z), 0.0, 160.0);
  gl_PointSize = uParticleSize * uPixelRatio * perspectiveScale;

  vHeight = aHeight;
  vDistanceToHover = hoverDistance;
  vMask = mask;
  vDepth = -mvPosition.z;
  vUv = aUv;
}
