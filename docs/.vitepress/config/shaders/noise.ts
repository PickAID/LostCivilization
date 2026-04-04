import { baseVertexShader, buildTemplate } from './templates/base-shader';

export const noiseShader = buildTemplate({
  key: 'noise',
  vertex: baseVertexShader,
  fragment: `
uniform float uTime;
uniform vec3 uBgColor;
uniform vec3 uColor1;
uniform vec3 uColor2;
varying vec2 vUv;

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);

  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));

  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
}

void main() {
  vec2 uv = vUv * 6.0;
  float n = noise(uv + uTime * 0.16);
  float m = noise((uv * 1.8) - uTime * 0.12);
  vec3 color = mix(uColor1, uColor2, n);
  color = mix(uBgColor, color, m * 0.85);
  gl_FragColor = vec4(color, 0.78);
}
`,
  defaultUniforms: {
    uColor1: { type: 'vec3', value: [0.24, 0.35, 0.86] },
    uColor2: { type: 'vec3', value: [0.72, 0.78, 1.0] },
  },
});
