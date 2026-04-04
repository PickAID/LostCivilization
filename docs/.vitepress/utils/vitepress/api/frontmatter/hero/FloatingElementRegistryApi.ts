export type FloatingBuiltinElementType =
    | "text"
    | "card"
    | "image"
    | "lottie"
    | "badge"
    | "icon"
    | "stat"
    | "code"
    | "shape";

export interface FloatingElementTypeDefinition {
    type: string;
    renderAs?: FloatingBuiltinElementType;
    component?: string;
    className?: string;
}

const BUILTIN_ELEMENT_TYPES: FloatingBuiltinElementType[] = [
    "text",
    "card",
    "image",
    "lottie",
    "badge",
    "icon",
    "stat",
    "code",
    "shape",
];

function normalizeFloatingType(value: unknown) {
    if (typeof value !== "string") return "";
    return value.trim().toLowerCase();
}

export interface ResolvedFloatingElementDefinition {
    rawType: string;
    renderAs: FloatingBuiltinElementType;
    component?: string;
    className?: string;
}

class FloatingElementRegistryApi {
    private readonly definitions = new Map<string, FloatingElementTypeDefinition>();
    private readonly builtinTypes = new Set<string>(
        BUILTIN_ELEMENT_TYPES.map((type) => normalizeFloatingType(type)),
    );

    constructor() {
        BUILTIN_ELEMENT_TYPES.forEach((type) => {
            const normalized = normalizeFloatingType(type);
            this.definitions.set(normalized, {
                type: normalized,
                renderAs: type,
            });
        });
    }

    registerType(definition: FloatingElementTypeDefinition) {
        const normalizedType = normalizeFloatingType(definition.type);
        if (!normalizedType) return;

        const normalizedRenderAs =
            normalizeFloatingType(definition.renderAs) ||
            normalizeFloatingType(definition.type);
        const fallbackType: FloatingBuiltinElementType = "text";

        const renderAs = this.builtinTypes.has(normalizedRenderAs)
            ? (normalizedRenderAs as FloatingBuiltinElementType)
            : fallbackType;

        this.definitions.set(normalizedType, {
            type: normalizedType,
            renderAs,
            component: definition.component?.trim() || undefined,
            className: definition.className?.trim() || undefined,
        });
    }

    registerTypes(definitions: FloatingElementTypeDefinition[]) {
        definitions.forEach((definition) => this.registerType(definition));
    }

    resolveType(
        requestedType: unknown,
        fallbackType: FloatingBuiltinElementType = "text",
    ): ResolvedFloatingElementDefinition {
        const normalizedType = normalizeFloatingType(requestedType);
        const requestedDefinition = normalizedType
            ? this.definitions.get(normalizedType)
            : undefined;

        if (requestedDefinition) {
            return {
                rawType: requestedDefinition.type,
                renderAs: requestedDefinition.renderAs || fallbackType,
                component: requestedDefinition.component,
                className: requestedDefinition.className,
            };
        }

        const resolvedFallback = this.builtinTypes.has(
            normalizeFloatingType(fallbackType),
        )
            ? fallbackType
            : "text";

        return {
            rawType: normalizedType || resolvedFallback,
            renderAs: resolvedFallback,
        };
    }

    listRegisteredTypes() {
        return Array.from(this.definitions.keys()).sort();
    }
}

export const floatingElementRegistry = new FloatingElementRegistryApi();
export const floatingBuiltinElementTypes = [...BUILTIN_ELEMENT_TYPES];

