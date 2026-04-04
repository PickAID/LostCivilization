import { baseVertexShader, buildTemplate } from './templates/base-shader';

export const galaxyShader = buildTemplate({
  key: 'galaxy',
  vertex: baseVertexShader,
  fragment: `
uniform float uTime;
uniform vec3 uBgColor;
uniform vec3 uColor1;
uniform vec3 uColor2;
uniform vec3 uColor3;
varying vec2 vUv;

float star(vec2 uv, float size) {
  float d = length(uv);
  return smoothstep(size, 0.0, d);
}

void main() {
  vec2 uv = vUv * 2.0 - 1.0;
  float angle = atan(uv.y, uv.x);
  float radius = length(uv);
  float spiral = sin(angle * 3.0 + uTime * 0.25 + radius * 10.0);
  float dust = smoothstep(1.15, 0.0, radius) * (spiral * 0.5 + 0.5);

  vec2 p1 = uv - vec2(0.25 * sin(uTime * 0.11), 0.18 * cos(uTime * 0.16));
  vec2 p2 = uv + vec2(0.3 * cos(uTime * 0.08), 0.2 * sin(uTime * 0.13));

  float stars = star(p1, 0.03) + star(p2, 0.018);
  vec3 color = mix(uColor1, uColor2, dust);
  color = mix(color, uColor3, stars);
  color = mix(uBgColor, color, smoothstep(1.25, 0.0, radius));

  gl_FragColor = vec4(color, 0.85);
}
`,
  defaultUniforms: {
    uColor1: { type: 'vec3', value: [0.09, 0.11, 0.3] },
    uColor2: { type: 'vec3', value: [0.27, 0.36, 0.84] },
    uColor3: { type: 'vec3', value: [0.94, 0.97, 1.0] },
  },
});
