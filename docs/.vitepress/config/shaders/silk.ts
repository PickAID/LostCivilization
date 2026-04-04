import { baseVertexShader, buildTemplate } from "./templates/base-shader";

export const silkShader = buildTemplate({
    key: "silk",
    vertex: baseVertexShader,
    fragment: `
uniform float uTime;
uniform vec3 uBgColor;
uniform vec3 uColor1;
uniform vec3 uColor2;
uniform vec3 uColor3;
uniform float uThemeIsDark;
varying vec2 vUv;

float hash21(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 31.79);
  return fract(p.x * p.y);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  float a = hash21(i);
  float b = hash21(i + vec2(1.0, 0.0));
  float c = hash21(i + vec2(0.0, 1.0));
  float d = hash21(i + vec2(1.0, 1.0));
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

float fbm(vec2 p) {
  float sum = 0.0;
  float amp = 0.55;
  mat2 m = mat2(1.6, 1.2, -1.2, 1.6);
  for (int i = 0; i < 4; i++) {
    sum += amp * noise(p);
    p = m * p + vec2(0.08, -0.05);
    amp *= 0.5;
  }
  return sum;
}

void main() {
  vec2 uv = vUv;
  vec2 p = (uv - 0.5) * vec2(2.25, 1.35);

  float t = uTime * 0.06;
  float flowA = fbm(p * vec2(1.25, 0.92) + vec2(t, -t * 0.45));
  float flowB = fbm(p * vec2(2.05, 1.2) + vec2(-t * 0.65, t * 0.38));
  float flow = 0.62 * flowA + 0.38 * flowB;

  float cloudBody = smoothstep(0.42, 0.78, flow);
  float cloudEdge = smoothstep(0.58, 0.9, flow) - smoothstep(0.72, 0.98, flow);
  float wave = sin((p.y + flow * 0.62) * 7.4 - t * 2.1);
  float waveMask = smoothstep(-0.25, 0.6, wave) * 0.3;

  vec3 lightSkyTop = vec3(0.9, 0.95, 1.0);
  vec3 lightSkyBottom = vec3(0.76, 0.86, 0.96);
  vec3 darkSkyTop = vec3(0.13, 0.19, 0.29);
  vec3 darkSkyBottom = vec3(0.07, 0.1, 0.17);
  vec3 sky = mix(
    mix(lightSkyTop, lightSkyBottom, smoothstep(0.02, 0.98, uv.y)),
    mix(darkSkyBottom, darkSkyTop, smoothstep(0.02, 0.98, uv.y)),
    clamp(uThemeIsDark, 0.0, 1.0)
  );

  vec3 col = mix(uBgColor, sky, 0.86);

  vec3 cloudTintLight = mix(uColor1, uColor2, uv.y * 0.55);
  vec3 cloudTintDark = mix(uColor2, uColor3, uv.y * 0.6);
  vec3 cloudTint = mix(cloudTintLight, cloudTintDark, clamp(uThemeIsDark, 0.0, 1.0));
  vec3 whiteCloud = mix(vec3(0.97, 0.98, 1.0), vec3(0.84, 0.89, 0.95), clamp(uThemeIsDark, 0.0, 1.0));
  vec3 cloudColor = mix(cloudTint, whiteCloud, 0.58);

  float cloudMask = clamp(cloudBody * 0.62 + cloudEdge * 0.34 + waveMask, 0.0, 1.0);
  col = mix(col, cloudColor, cloudMask);

  float greyTrace = smoothstep(0.5, 0.9, flowB) * 0.08;
  vec3 traceColor = mix(vec3(0.82, 0.86, 0.9), vec3(0.38, 0.44, 0.54), clamp(uThemeIsDark, 0.0, 1.0));
  col = mix(col, traceColor, greyTrace);

  float vignette = 1.0 - smoothstep(0.5, 0.98, length(uv - 0.5));
  col *= mix(0.97, 1.02, vignette);

  gl_FragColor = vec4(clamp(col, 0.0, 1.0), 0.84);
}
`,
    defaultUniforms: {
        uColor1: {
            type: "vec3",
            value: {
                light: [0.95, 0.98, 1.0],
                dark: [0.12, 0.16, 0.24],
            },
        },
        uColor2: {
            type: "vec3",
            value: {
                light: [0.87, 0.93, 0.99],
                dark: [0.19, 0.25, 0.36],
            },
        },
        uColor3: {
            type: "vec3",
            value: {
                light: [0.78, 0.86, 0.95],
                dark: [0.31, 0.39, 0.54],
            },
        },
    },
});
