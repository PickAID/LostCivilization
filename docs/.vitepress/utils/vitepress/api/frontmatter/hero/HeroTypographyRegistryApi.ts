export interface HeroTypographyMotionNodeDefaults {
    x: number;
    y: number;
    scale: number;
}

export interface HeroTypographyMotionDefaults {
    intensity: number;
    title: HeroTypographyMotionNodeDefaults;
    text: HeroTypographyMotionNodeDefaults;
    tagline: HeroTypographyMotionNodeDefaults;
    image: HeroTypographyMotionNodeDefaults;
    transitionDuration: number;
    transitionDelayStep: number;
    transitionEasing: string;
}

export interface HeroTypographyStyleDefinition {
    type: string;
    aliases?: string[];
    motion: HeroTypographyMotionDefaults;
}

function cloneMotionNode(node: HeroTypographyMotionNodeDefaults) {
    return { ...node };
}

function cloneMotionDefaults(motion: HeroTypographyMotionDefaults) {
    return {
        intensity: motion.intensity,
        title: cloneMotionNode(motion.title),
        text: cloneMotionNode(motion.text),
        tagline: cloneMotionNode(motion.tagline),
        image: cloneMotionNode(motion.image),
        transitionDuration: motion.transitionDuration,
        transitionDelayStep: motion.transitionDelayStep,
        transitionEasing: motion.transitionEasing,
    };
}

function normalizeStyleType(value: unknown) {
    if (typeof value !== "string") return "";
    return value.trim().toLowerCase();
}

class HeroTypographyRegistryApi {
    private readonly definitions = new Map<string, HeroTypographyStyleDefinition>();

    constructor(defaultDefinitions: HeroTypographyStyleDefinition[]) {
        this.registerStyles(defaultDefinitions);
    }

    registerStyle(definition: HeroTypographyStyleDefinition) {
        const normalizedType = normalizeStyleType(definition.type);
        if (!normalizedType) return;

        const canonicalDefinition: HeroTypographyStyleDefinition = {
            type: normalizedType,
            aliases: Array.isArray(definition.aliases)
                ? definition.aliases
                      .map((alias) => normalizeStyleType(alias))
                      .filter(Boolean)
                : [],
            motion: cloneMotionDefaults(definition.motion),
        };

        this.definitions.set(normalizedType, canonicalDefinition);
        canonicalDefinition.aliases?.forEach((alias) => {
            this.definitions.set(alias, canonicalDefinition);
        });
    }

    registerStyles(definitions: HeroTypographyStyleDefinition[]) {
        definitions.forEach((definition) => this.registerStyle(definition));
    }

    hasStyle(type: unknown) {
        return this.definitions.has(normalizeStyleType(type));
    }

    resolveStyleType(type: unknown, fallback = "floating-tilt") {
        const normalizedType = normalizeStyleType(type);
        if (normalizedType && this.definitions.has(normalizedType)) {
            return this.definitions.get(normalizedType)!.type;
        }
        const normalizedFallback = normalizeStyleType(fallback);
        if (this.definitions.has(normalizedFallback)) {
            return this.definitions.get(normalizedFallback)!.type;
        }
        return "floating-tilt";
    }

    resolveMotionDefaults(type: unknown, fallback = "floating-tilt") {
        const resolvedType = this.resolveStyleType(type, fallback);
        const definition = this.definitions.get(resolvedType);
        if (!definition) {
            return cloneMotionDefaults(DEFAULT_TYPOGRAPHY_STYLE_DEFINITIONS[0].motion);
        }
        return cloneMotionDefaults(definition.motion);
    }

    listStyleTypes() {
        const canonicalTypes = new Set<string>();
        this.definitions.forEach((definition) => {
            canonicalTypes.add(definition.type);
        });
        return Array.from(canonicalTypes.values());
    }
}

export const DEFAULT_TYPOGRAPHY_STYLE_DEFINITIONS: HeroTypographyStyleDefinition[] = [
    {
        type: "floating-tilt",
        aliases: ["default"],
        motion: {
            intensity: 1,
            title: { x: 2, y: -2, scale: 1.018 },
            text: { x: 6, y: 4, scale: 1.03 },
            tagline: { x: 3, y: 7, scale: 1.014 },
            image: { x: 5, y: -3, scale: 1.02 },
            transitionDuration: 560,
            transitionDelayStep: 40,
            transitionEasing: "cubic-bezier(0.2, 0.9, 0.2, 1)",
        },
    },
    {
        type: "grouped-float",
        motion: {
            intensity: 1,
            title: { x: 12, y: -7, scale: 1.09 },
            text: { x: 14, y: -3, scale: 1.1 },
            tagline: { x: 11, y: 1, scale: 1.06 },
            image: { x: 16, y: -10, scale: 1.11 },
            transitionDuration: 700,
            transitionDelayStep: 58,
            transitionEasing: "cubic-bezier(0.2, 0.9, 0.2, 1)",
        },
    },
    {
        type: "slanted-wrap",
        motion: {
            intensity: 1,
            title: { x: -12, y: -6, scale: 1.06 },
            text: { x: 16, y: 8, scale: 1.07 },
            tagline: { x: 20, y: 15, scale: 1.032 },
            image: { x: 8, y: -6, scale: 1.028 },
            transitionDuration: 640,
            transitionDelayStep: 52,
            transitionEasing: "cubic-bezier(0.2, 0.9, 0.2, 1)",
        },
    },
    {
        type: "none",
        aliases: ["static"],
        motion: {
            intensity: 0,
            title: { x: 0, y: 0, scale: 1 },
            text: { x: 0, y: 0, scale: 1 },
            tagline: { x: 0, y: 0, scale: 1 },
            image: { x: 0, y: 0, scale: 1 },
            transitionDuration: 260,
            transitionDelayStep: 16,
            transitionEasing: "cubic-bezier(0.2, 0.9, 0.2, 1)",
        },
    },
];

export const heroTypographyRegistry = new HeroTypographyRegistryApi(
    DEFAULT_TYPOGRAPHY_STYLE_DEFINITIONS,
);

