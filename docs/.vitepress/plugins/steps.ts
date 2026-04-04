import { createTabPlugin } from "./tab-plugin-factory";

/**
 * Vertical Steps component plugin.
 * Markdown variable name: "steps"
 * Compatible with the stepper plugin variable space but renders as a
 * prose-style vertical timeline (inspired by nuxt/ui Prose Steps).
 *
 * Usage in markdown:
 *   #steps
 *   ## Step 1 Title
 *   Content for step 1
 *
 *   #steps
 *   ## Step 2 Title
 *   Content for step 2
 */
export const steps = createTabPlugin({
    name: "steps",
    containerComponent: "VPSteps",
    tabComponent: "template",
    useSlots: true,

    containerRenderer: (info) => {
        const { data } = info;
        const titles = data.map((tab) => `'${tab.title}'`).join(", ");
        return `<VPSteps :titles="[${titles}]">`;
    },

    slotPattern: (data) => `<template v-slot:step${data.index}>`,
});
