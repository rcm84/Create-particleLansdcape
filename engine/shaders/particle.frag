uniform vec3 uBaseColor;
uniform vec3 uHighlightColor;
uniform vec3 uFogColor;
uniform float uFogNear;
uniform float uFogFar;
uniform float uFadeNear;
uniform float uFadeFar;
uniform float uHoverRadius;
uniform float uOpacity;

varying float vHeight;
varying float vDistanceToHover;
varying float vMask;
varying float vDepth;
varying vec2 vUv;

void main() {
  vec2 centered = gl_PointCoord - vec2(0.5);
  float circle = 1.0 - smoothstep(0.35, 0.5, length(centered));

  if (circle <= 0.0 || vMask <= 0.0) {
    discard;
  }

  float heightMix = clamp(vHeight / 255.0, 0.0, 1.0);
  float hoverMix = 1.0 - smoothstep(0.0, uHoverRadius, vDistanceToHover);
  vec3 baseColor = mix(uBaseColor, uHighlightColor, heightMix * 0.65 + hoverMix * 0.35);

  float fogFactor = smoothstep(uFogNear, uFogFar, vDepth);
  float distanceFade = 1.0 - smoothstep(uFadeNear, uFadeFar, vDepth);
  vec3 color = mix(baseColor, uFogColor, fogFactor);
  float alpha = circle * distanceFade * vMask * uOpacity;

  gl_FragColor = vec4(color, alpha);
}
