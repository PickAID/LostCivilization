import { baseVertexShader, buildTemplate } from './templates/base-shader';

export const waterShader = buildTemplate({
  key: 'water',
  vertex: baseVertexShader,
  fragment: `
uniform float uTime;
uniform vec2 uResolution;
uniform vec3 uBgColor;
uniform vec3 uColor1;
uniform vec3 uColor2;
uniform vec3 uColor3;
varying vec2 vUv;

void main() {
  vec2 uv = vUv;
  float waveA = sin((uv.x * 9.0) + uTime * 0.7) * 0.5 + 0.5;
  float waveB = cos((uv.y * 6.0) - uTime * 0.5) * 0.5 + 0.5;
  float tide = sin((uv.x + uv.y) * 4.0 + uTime * 0.25) * 0.5 + 0.5;

  vec3 mixed = mix(uColor1, uColor2, waveA);
  mixed = mix(mixed, uColor3, waveB * 0.6);
  mixed = mix(uBgColor, mixed, tide * 0.7);

  gl_FragColor = vec4(mixed, 0.82);
}
`,
  defaultUniforms: {
    uColor1: { type: 'vec3', value: [0.13, 0.29, 0.78] },
    uColor2: { type: 'vec3', value: [0.31, 0.47, 0.98] },
    uColor3: { type: 'vec3', value: [0.51, 0.67, 1.0] },
  },
});
