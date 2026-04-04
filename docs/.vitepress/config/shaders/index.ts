import { type ShaderTemplate } from './templates/base-shader';
import { waterShader } from './water';
import { noiseShader } from './noise';
import { galaxyShader } from './galaxy';
import { plasmaShader } from './plasma';
import { rippleShader } from './ripple';
import { silkShader } from './silk';

const shaderRegistry = new Map<string, ShaderTemplate>([
  ['water', waterShader],
  ['noise', noiseShader],
  ['galaxy', galaxyShader],
  ['plasma', plasmaShader],
  ['ripple', rippleShader],
  ['silk', silkShader],
]);

export const listShaderTemplates = (): string[] => Array.from(shaderRegistry.keys());

export const getShaderTemplate = (key: string): ShaderTemplate => {
  return shaderRegistry.get(key) || waterShader;
};

export const getShaderTemplateByType = (type?: string): ShaderTemplate => {
  if (!type) return waterShader;

  const normalizedType = String(type).trim().toLowerCase();
  if (normalizedType.startsWith('template:')) {
    return getShaderTemplate(normalizedType.slice('template:'.length));
  }

  return getShaderTemplate(normalizedType);
};

export const registerShaderTemplate = (key: string, template: ShaderTemplate) => {
  shaderRegistry.set(key, {
    ...template,
    key,
  });
};

export type { ShaderTemplate };
