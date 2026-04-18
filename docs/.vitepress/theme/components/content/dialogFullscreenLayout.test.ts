import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const mdDialogPath =
    "/Users/gedwen/Documents/programing/GitHub/CrychicDoc/.vitepress/theme/components/content/MdDialog.vue";
const mdMultiPageDialogPath =
    "/Users/gedwen/Documents/programing/GitHub/CrychicDoc/.vitepress/theme/components/content/MdMultiPageDialog.vue";

function readComponent(path: string) {
    return readFileSync(path, "utf8");
}

test("MdDialog fullscreen layout uses a plain in-flow header instead of a toolbar", () => {
    const source = readComponent(mdDialogPath);

    assert.ok(
        !source.includes('<v-toolbar v-if="fullscreen"'),
        "fullscreen MdDialog should not render a v-toolbar",
    );
    assert.ok(
        source.includes("md-fullscreen-header"),
        "fullscreen MdDialog should define a plain fullscreen header block",
    );
    assert.ok(
        source.includes("md-dialog-overlay--fullscreen"),
        "fullscreen MdDialog should style the overlay content for edge-to-edge layout",
    );
    assert.ok(
        source.includes("100dvh"),
        "fullscreen MdDialog should size itself against the dynamic viewport height",
    );
});

test("MdMultiPageDialog fullscreen layout uses a plain header and inline meta row", () => {
    const source = readComponent(mdMultiPageDialogPath);

    assert.ok(
        !source.includes('<v-toolbar v-if="fullscreen"'),
        "fullscreen MdMultiPageDialog should not render a v-toolbar",
    );
    assert.ok(
        source.includes("md-fullscreen-header"),
        "fullscreen MdMultiPageDialog should define a plain fullscreen header block",
    );
    assert.ok(
        source.includes("md-fullscreen-meta"),
        "fullscreen MdMultiPageDialog should define a lightweight fullscreen meta row",
    );
    assert.ok(
        source.includes("md-dialog-overlay--fullscreen"),
        "fullscreen MdMultiPageDialog should style the overlay content for edge-to-edge layout",
    );
    assert.ok(
        source.includes("100dvh"),
        "fullscreen MdMultiPageDialog should size itself against the dynamic viewport height",
    );
});
