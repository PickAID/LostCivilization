import { baseVertexShader, buildTemplate } from './templates/base-shader';

export const rippleShader = buildTemplate({
  key: 'ripple',
  vertex: baseVertexShader,
  fragment: `
uniform float uTime;
uniform vec3 uBgColor;
uniform vec3 uColor1;
uniform vec3 uColor2;
varying vec2 vUv;

void main() {
  vec2 uv = vUv - 0.5;
  float distanceToCenter = length(uv);

  float rings = sin(distanceToCenter * 48.0 - uTime * 2.4);
  float ringMask = smoothstep(0.95, 0.0, distanceToCenter);
  float pulse = smoothstep(0.06, 0.0, abs(rings)) * ringMask;

  vec3 color = mix(uColor1, uColor2, pulse);
  color = mix(uBgColor, color, ringMask * 0.85);

  gl_FragColor = vec4(color, 0.78);
}
`,
  defaultUniforms: {
    uColor1: { type: 'vec3', value: [0.16, 0.31, 0.84] },
    uColor2: { type: 'vec3', value: [0.58, 0.74, 1.0] },
  },
});
