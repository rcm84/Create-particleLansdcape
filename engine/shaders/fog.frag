vec3 applyAtmosphericFog(vec3 color, vec3 fogColor, float depth, float fogNear, float fogFar) {
  float fogFactor = smoothstep(fogNear, fogFar, depth);
  return mix(color, fogColor, fogFactor);
}
