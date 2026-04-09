export type MetadataMode = "doc" | "kubejs" | "modding" | "mod";
export type MetadataMetricKey = "update" | "wordCount" | "readTime" | "pageViews";
export type MetadataChipKind = "default" | "route";

export interface MetadataDisplayEntryInput {
    id?: string;
    key?: string;
    label?: string;
    text?: string;
    title?: string;
    name?: string;
    value?: string;
    version?: string;
    hover?: string | string[];
    note?: string;
    description?: string;
}

export interface MetadataSourceInput {
    type?: string;
    label?: string;
    text?: string;
    title?: string;
    href?: string;
    link?: string;
}

export interface MetadataMetricsInput {
    update?: boolean;
    updated?: boolean;
    wordCount?: boolean;
    words?: boolean;
    readTime?: boolean;
    readingTime?: boolean;
    pageViews?: boolean;
    views?: boolean;
}

export interface MetadataKubeJSConfigInput {
    current?: unknown;
    version?: unknown;
    requiredMods?: unknown;
    mods?: unknown;
    dependencies?: unknown;
    routes?: unknown;
    route?: unknown;
}

export interface MetadataModdingConfigInput {
    current?: unknown;
    version?: unknown;
    stack?: unknown;
    dependencies?: unknown;
    toolchain?: unknown;
    routes?: unknown;
    route?: unknown;
}

export interface MetadataModConfigInput {
    latest?: unknown;
    current?: unknown;
    supported?: unknown;
    supportedVersions?: unknown;
    versions?: unknown;
    loaders?: unknown;
    loader?: unknown;
    sources?: unknown;
    links?: unknown;
    side?: unknown;
}

export interface MetadataFrontmatterInput {
    enabled?: boolean;
    mode?: MetadataMode | string;
    type?: MetadataMode | string;
    kind?: MetadataMode | string;
    metrics?: boolean | MetadataMetricKey[] | MetadataMetricsInput;
    current?: unknown;
    version?: unknown;
    requiredMods?: unknown;
    mods?: unknown;
    dependencies?: unknown;
    routes?: unknown;
    route?: unknown;
    stack?: unknown;
    toolchain?: unknown;
    latest?: unknown;
    supported?: unknown;
    supportedVersions?: unknown;
    versions?: unknown;
    loaders?: unknown;
    loader?: unknown;
    kubejs?: MetadataKubeJSConfigInput;
    modding?: MetadataModdingConfigInput;
    mod?: MetadataModConfigInput;
    sources?: unknown;
    links?: unknown;
    side?: unknown;
}

export interface NormalizedMetadataChip {
    id?: string;
    label: string;
    hoverLines?: string[];
    kind: MetadataChipKind;
}

export interface NormalizedMetadataGroup {
    key:
        | "currentVersion"
        | "requiredMods"
        | "routes"
        | "currentStack"
        | "latestVersion"
        | "loaders"
        | "side";
    items: NormalizedMetadataChip[];
}

export interface NormalizedMetadataSource {
    type: string;
    label?: string;
    href: string;
}

export interface ResolvedMetadataFrontmatter {
    enabled: boolean;
    mode: MetadataMode;
    metrics: Record<MetadataMetricKey, boolean>;
    groups: NormalizedMetadataGroup[];
    sources: NormalizedMetadataSource[];
}

const DEFAULT_METRICS: Record<MetadataMetricKey, boolean> = {
    update: true,
    wordCount: true,
    readTime: true,
    pageViews: true,
};

const ROUTE_ALIAS_MAP: Record<string, string> = {
    addon: "addon",
    block: "block",
    capability: "capability",
    capabilities: "capability",
    client: "client_scripts",
    client_event: "client_scripts",
    client_events: "client_scripts",
    client_script: "client_scripts",
    client_scripts: "client_scripts",
    code_share: "code_share",
    codeshare: "code_share",
    command: "command",
    commands: "command",
    config: "config",
    data_generation: "datagen",
    datagen: "datagen",
    entity: "entity",
    event: "events",
    events: "events",
    global_scope: "global_scope",
    globalscope: "global_scope",
    item: "item",
    loot_table: "loot_table",
    loottable: "loot_table",
    mixin: "mixin",
    network: "networking",
    networking: "networking",
    recipe: "recipe",
    recipes: "recipe",
    register: "registry",
    registry: "registry",
    render: "rendering",
    rendering: "rendering",
    route: "route",
    server: "server_scripts",
    server_event: "server_scripts",
    server_events: "server_scripts",
    server_script: "server_scripts",
    server_scripts: "server_scripts",
    start_script: "startup_scripts",
    start_scripts: "startup_scripts",
    startup: "startup_scripts",
    startup_script: "startup_scripts",
    startup_scripts: "startup_scripts",
    tag: "tag",
    toolchain: "toolchain",
    upgrade: "upgrade",
    world_gen: "worldgen",
    worldgen: "worldgen",
};

const KUBEJS_CONFIG_KEYS = [
    "current",
    "version",
    "requiredMods",
    "mods",
    "dependencies",
    "routes",
    "route",
] as const;

const MODDING_CONFIG_KEYS = [
    "current",
    "version",
    "stack",
    "dependencies",
    "toolchain",
    "routes",
    "route",
] as const;

const MOD_CONFIG_KEYS = [
    "latest",
    "current",
    "supported",
    "supportedVersions",
    "versions",
    "loaders",
    "loader",
    "sources",
    "links",
    "side",
] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
    return value !== null && typeof value === "object" && !Array.isArray(value);
}

function toText(value: unknown): string | undefined {
    if (typeof value === "string") {
        const trimmed = value.trim();
        return trimmed ? trimmed : undefined;
    }

    if (typeof value === "number" || typeof value === "boolean") {
        return String(value);
    }

    return undefined;
}

function toStringArray(value: unknown): string[] {
    if (!Array.isArray(value)) return [];

    return value
        .map((item) => toText(item))
        .filter((item): item is string => Boolean(item));
}

function uniqueStrings(values: Array<string | undefined>): string[] {
    const seen = new Set<string>();
    const result: string[] = [];

    for (const value of values) {
        const normalized = toText(value);
        if (!normalized || seen.has(normalized)) continue;
        seen.add(normalized);
        result.push(normalized);
    }

    return result;
}

function normalizeMode(value: unknown): MetadataMode {
    const raw = toText(value)?.toLowerCase();

    switch (raw) {
        case "kubejs":
            return "kubejs";
        case "modding":
            return "modding";
        case "mod":
        case "mods":
            return "mod";
        case "doc":
        default:
            return "doc";
    }
}

function humanizeToken(token: string): string {
    return token
        .replace(/[_-]+/g, " ")
        .replace(/\b\w/g, (char) => char.toUpperCase());
}

function canonicalizeRouteId(value: string): string {
    const normalized = value
        .trim()
        .toLowerCase()
        .replace(/[\\/]+/g, "_")
        .replace(/\s+/g, "_")
        .replace(/-+/g, "_");

    return ROUTE_ALIAS_MAP[normalized] ?? normalized;
}

function compareVersions(left: string, right: string): number {
    const leftParts = left.split(/[^0-9]+/).filter(Boolean).map(Number);
    const rightParts = right.split(/[^0-9]+/).filter(Boolean).map(Number);
    const maxLength = Math.max(leftParts.length, rightParts.length);

    for (let index = 0; index < maxLength; index += 1) {
        const leftValue = leftParts[index] ?? 0;
        const rightValue = rightParts[index] ?? 0;
        if (leftValue !== rightValue) return rightValue - leftValue;
    }

    return right.localeCompare(left);
}

function normalizeDisplayEntry(
    input: unknown,
    options: {
        fallbackId?: string;
        kind?: MetadataChipKind;
        forceRouteId?: boolean;
    } = {},
): NormalizedMetadataChip | null {
    const kind = options.kind ?? "default";

    if (typeof input === "string" || typeof input === "number") {
        const rawLabel = toText(input);
        if (!rawLabel) return null;

        const id =
            kind === "route" || options.forceRouteId
                ? canonicalizeRouteId(rawLabel)
                : options.fallbackId;

        return {
            id,
            kind,
            label: kind === "route" ? id ?? rawLabel : rawLabel,
        };
    }

    if (!isRecord(input)) return null;

    const explicitId = toText(input.id ?? input.key);
    const routeIdSource = toText(input.route ?? input.path ?? input.value ?? input.name);
    const label = uniqueStrings([
        toText(input.label),
        toText(input.text),
        toText(input.title),
        toText(input.name),
        toText(input.value),
        toText(input.version),
    ])[0];

    const id =
        kind === "route" || options.forceRouteId
            ? canonicalizeRouteId(routeIdSource ?? explicitId ?? label ?? "")
            : explicitId ?? options.fallbackId;

    const hoverLines = uniqueStrings([
        ...toStringArray(input.hover),
        toText(input.value),
        toText(input.version),
        toText(input.note),
        toText(input.description),
    ]);

    const resolvedLabel = label ?? id;
    if (!resolvedLabel) return null;

    return {
        id,
        kind,
        label: kind === "route" ? id ?? resolvedLabel : resolvedLabel,
        hoverLines: hoverLines.length > 0 ? hoverLines : undefined,
    };
}

function normalizeEntryList(input: unknown): NormalizedMetadataChip[] {
    const values = Array.isArray(input) ? input : [input];

    return values
        .map((item) => normalizeDisplayEntry(item))
        .filter((item): item is NormalizedMetadataChip => Boolean(item));
}

function normalizeRouteList(input: unknown): NormalizedMetadataChip[] {
    const values = Array.isArray(input) ? input : [input];

    return values
        .map((item) =>
            normalizeDisplayEntry(item, {
                kind: "route",
                forceRouteId: true,
            }),
        )
        .filter((item): item is NormalizedMetadataChip => Boolean(item));
}

function normalizeSources(input: unknown): NormalizedMetadataSource[] {
    if (!input) return [];

    if (Array.isArray(input)) {
        return input
            .map((item) => normalizeSource(item))
            .filter((item): item is NormalizedMetadataSource => Boolean(item));
    }

    if (!isRecord(input)) return [];

    if (toText(input.href ?? input.link)) {
        const direct = normalizeSource(input);
        return direct ? [direct] : [];
    }

    return Object.entries(input)
        .map(([type, value]) => {
            if (typeof value === "string") {
                return normalizeSource({
                    type,
                    href: value,
                });
            }

            if (isRecord(value)) {
                return normalizeSource({
                    type,
                    ...value,
                });
            }

            return null;
        })
        .filter((item): item is NormalizedMetadataSource => Boolean(item));
}

function normalizeSource(input: unknown): NormalizedMetadataSource | null {
    if (!isRecord(input)) return null;

    const href = toText(input.href ?? input.link);
    if (!href) return null;

    return {
        type: toText(input.type)?.toLowerCase() ?? "custom",
        label: toText(input.label ?? input.text ?? input.title),
        href,
    };
}

function normalizeMetrics(value: unknown): Record<MetadataMetricKey, boolean> {
    if (value === false) {
        return {
            update: false,
            wordCount: false,
            readTime: false,
            pageViews: false,
        };
    }

    if (Array.isArray(value)) {
        const selected = new Set(
            value
                .map((item) => toText(item))
                .filter((item): item is MetadataMetricKey =>
                    item === "update" ||
                    item === "wordCount" ||
                    item === "readTime" ||
                    item === "pageViews",
                ),
        );

        return {
            update: selected.has("update"),
            wordCount: selected.has("wordCount"),
            readTime: selected.has("readTime"),
            pageViews: selected.has("pageViews"),
        };
    }

    if (!isRecord(value)) {
        return { ...DEFAULT_METRICS };
    }

    return {
        update: (value.update ?? value.updated ?? DEFAULT_METRICS.update) !== false,
        wordCount: (value.wordCount ?? value.words ?? DEFAULT_METRICS.wordCount) !== false,
        readTime: (value.readTime ?? value.readingTime ?? DEFAULT_METRICS.readTime) !== false,
        pageViews: (value.pageViews ?? value.views ?? DEFAULT_METRICS.pageViews) !== false,
    };
}

function hasAnyOwnKey(
    input: Record<string, unknown>,
    keys: readonly string[],
): boolean {
    return keys.some((key) => Object.prototype.hasOwnProperty.call(input, key));
}

function mergeModeConfig(
    root: Record<string, unknown>,
    nested: unknown,
    keys: readonly string[],
): Record<string, unknown> {
    const nestedConfig = isRecord(nested) ? { ...nested } : {};

    if (!hasAnyOwnKey(root, keys)) return nestedConfig;

    const rootOverrides = Object.fromEntries(
        keys
            .filter((key) => Object.prototype.hasOwnProperty.call(root, key))
            .map((key) => [key, root[key]]),
    );

    return {
        ...nestedConfig,
        ...rootOverrides,
    };
}

function buildGroup(
    key: NormalizedMetadataGroup["key"],
    items: NormalizedMetadataChip[],
): NormalizedMetadataGroup | null {
    if (items.length === 0) return null;
    return { key, items };
}

function sortSupportedVersions(values: string[]): string[] {
    return [...values].sort(compareVersions);
}

function normalizeKubeJSConfig(input: unknown): NormalizedMetadataGroup[] {
    if (!isRecord(input)) return [];

    const current = normalizeDisplayEntry(input.current ?? input.version);
    const requiredMods = normalizeEntryList(
        input.requiredMods ?? input.mods ?? input.dependencies,
    );
    const routes = normalizeRouteList(input.routes ?? input.route);

    return [
        buildGroup("currentVersion", current ? [current] : []),
        buildGroup("requiredMods", requiredMods),
        buildGroup("routes", routes),
    ].filter((group): group is NormalizedMetadataGroup => Boolean(group));
}

function normalizeModdingConfig(input: unknown): NormalizedMetadataGroup[] {
    if (!isRecord(input)) return [];

    const current = normalizeDisplayEntry(input.current ?? input.version);
    const stack = normalizeEntryList(
        input.stack ?? input.dependencies ?? input.toolchain,
    );
    const routes = normalizeRouteList(input.routes ?? input.route);

    return [
        buildGroup("currentVersion", current ? [current] : []),
        buildGroup("currentStack", stack),
        buildGroup("routes", routes),
    ].filter((group): group is NormalizedMetadataGroup => Boolean(group));
}

function normalizeSide(value: unknown): NormalizedMetadataChip | null {
    const raw = toText(value)?.toLowerCase().trim();
    if (!raw) return null;

    let canonical: string;
    if (raw === "server" || raw === "server_side" || raw === "serverside" || raw === "server_only") {
        canonical = "server";
    } else if (raw === "client" || raw === "client_side" || raw === "clientside" || raw === "client_only") {
        canonical = "client";
    } else if (raw === "both" || raw === "all" || raw === "universal" || raw === "server+client") {
        canonical = "both";
    } else {
        canonical = raw;
    }

    return { id: canonical, kind: "default", label: humanizeToken(canonical) };
}

function normalizeModConfig(
    input: unknown,
): {
    groups: NormalizedMetadataGroup[];
    sources: NormalizedMetadataSource[];
} {
    if (!isRecord(input)) return { groups: [], sources: [] };

    const supported = sortSupportedVersions(
        uniqueStrings([
            ...toStringArray(input.supported),
            ...toStringArray(input.supportedVersions),
            ...toStringArray(input.versions),
        ]),
    );

    const latest =
        normalizeDisplayEntry(input.latest ?? input.current ?? supported[0]) ??
        (supported[0]
            ? {
                  kind: "default" as const,
                  label: supported[0],
              }
            : null);

    if (latest && supported.length > 0) {
        latest.hoverLines = uniqueStrings([
            ...(latest.hoverLines ?? []),
            ...supported,
        ]);
    }

    const loaders = normalizeEntryList(input.loaders ?? input.loader);
    const side = normalizeSide(input.side);
    const sources = normalizeSources(input.sources ?? input.links);

    return {
        groups: [
            buildGroup("side", side ? [side] : []),
            buildGroup("latestVersion", latest ? [latest] : []),
            buildGroup("loaders", loaders),
        ].filter((group): group is NormalizedMetadataGroup => Boolean(group)),
        sources,
    };
}

export function normalizeMetadataFrontmatter(input: unknown): ResolvedMetadataFrontmatter {
    if (input === false) {
        return {
            enabled: false,
            mode: "doc",
            metrics: { ...DEFAULT_METRICS },
            groups: [],
            sources: [],
        };
    }

    if (input === true || input === undefined || input === null) {
        return {
            enabled: true,
            mode: "doc",
            metrics: { ...DEFAULT_METRICS },
            groups: [],
            sources: [],
        };
    }

    if (typeof input === "string") {
        return {
            enabled: true,
            mode: normalizeMode(input),
            metrics: { ...DEFAULT_METRICS },
            groups: [],
            sources: [],
        };
    }

    if (!isRecord(input)) {
        return {
            enabled: true,
            mode: "doc",
            metrics: { ...DEFAULT_METRICS },
            groups: [],
            sources: [],
        };
    }

    const mode = normalizeMode(input.mode ?? input.type ?? input.kind);
    const metrics = normalizeMetrics(input.metrics);
    const globalSources = normalizeSources(input.sources);
    const kubejsConfig = mergeModeConfig(input, input.kubejs, KUBEJS_CONFIG_KEYS);
    const moddingConfig = mergeModeConfig(input, input.modding, MODDING_CONFIG_KEYS);
    const modConfigInput = mergeModeConfig(input, input.mod, MOD_CONFIG_KEYS);

    if (input.enabled === false) {
        return {
            enabled: false,
            mode,
            metrics,
            groups: [],
            sources: [],
        };
    }

    switch (mode) {
        case "kubejs":
            return {
                enabled: true,
                mode,
                metrics,
                groups: normalizeKubeJSConfig(kubejsConfig),
                sources: globalSources,
            };
        case "modding":
            return {
                enabled: true,
                mode,
                metrics,
                groups: normalizeModdingConfig(moddingConfig),
                sources: globalSources,
            };
        case "mod": {
            const modConfig = normalizeModConfig(modConfigInput);
            return {
                enabled: true,
                mode,
                metrics,
                groups: modConfig.groups,
                sources: modConfig.sources.length > 0 ? modConfig.sources : globalSources,
            };
        }
        case "doc":
        default:
            return {
                enabled: true,
                mode: "doc",
                metrics,
                groups: [],
                sources: [],
            };
    }
}

export function resolveRouteFallbackLabel(routeId: string): string {
    return humanizeToken(routeId);
}
