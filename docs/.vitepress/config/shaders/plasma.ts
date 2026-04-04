import { baseVertexShader, buildTemplate } from './templates/base-shader';

export const plasmaShader = buildTemplate({
  key: 'plasma',
  vertex: baseVertexShader,
  fragment: `
uniform float uTime;
uniform vec3 uBgColor;
uniform vec3 uColor1;
uniform vec3 uColor2;
uniform vec3 uColor3;
varying vec2 vUv;

void main() {
  vec2 uv = vUv * 2.0 - 1.0;

  float plasma = 0.0;
  plasma += sin(uv.x * 9.0 + uTime * 1.25);
  plasma += sin(uv.y * 8.0 - uTime * 1.05);
  plasma += sin((uv.x + uv.y) * 6.0 + uTime * 0.9);
  plasma += sin(length(uv) * 12.0 - uTime * 1.2);
  plasma *= 0.25;

  float blendA = sin(plasma * 3.14159) * 0.5 + 0.5;
  float blendB = cos(plasma * 2.51327) * 0.5 + 0.5;

  vec3 color = mix(uColor1, uColor2, blendA);
  color = mix(color, uColor3, blendB * 0.6);
  color = mix(uBgColor, color, 0.8);

  gl_FragColor = vec4(color, 0.82);
}
`,
  defaultUniforms: {
    uColor1: { type: 'vec3', value: [0.24, 0.21, 0.79] },
    uColor2: { type: 'vec3', value: [0.19, 0.64, 0.98] },
    uColor3: { type: 'vec3', value: [0.94, 0.44, 0.99] },
  },
});
