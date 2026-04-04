export interface ShaderTemplate {
  key: string;
  vertex: string;
  fragment: string;
  defaultUniforms?: Record<string, any>;
}

export const baseVertexShader = `
varying vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

export const buildTemplate = (template: ShaderTemplate): ShaderTemplate => template;
