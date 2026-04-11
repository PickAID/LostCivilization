import {
    createContainerPlugin,
} from "./container-plugin-factory";

function escapeAttr(value: unknown): string {
    if (value === null || value === undefined) {
        return "";
    }

    return String(value).replace(/'/g, "&apos;").replace(/"/g, "&quot;");
}

function toKebabCase(key: string): string {
    return key.replace(/[A-Z]/g, (char) => `-${char.toLowerCase()}`);
}

function mapAlertConfigValue(attrName: string, value: unknown): string {
    if (typeof value === "string") {
        return ` ${attrName}="${escapeAttr(value)}"`;
    }

    if (typeof value === "boolean" || typeof value === "number") {
        return ` :${attrName}="${value}"`;
    }

    return ` :${attrName}="${escapeAttr(JSON.stringify(value))}"`;
}

/**
 * Creates a configurable v-alert component based on Vuetify's API.
 * This plugin handles complex alerts with JSON-based configurations.
 *
 * @usage
 * ::: alert {"type": "success", "variant": "tonal", "title": "My Title"}
 * Content for the alert's default slot.
 * :::
 */
export const customAlert = createContainerPlugin({
    name: "alert",
    component: "CustomAlert",
    configMapping: {
        __fullConfig: (config: Record<string, unknown>) =>
            Object.entries(config)
                .map(([key, value]) => mapAlertConfigValue(toKebabCase(key), value))
                .join(""),
    },
});
