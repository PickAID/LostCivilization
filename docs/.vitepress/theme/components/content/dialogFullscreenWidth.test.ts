import test from "node:test";
import assert from "node:assert/strict";
import { resolveDialogFullscreenShellMaxWidth } from "./dialogFullscreenWidth";

test("fullscreen shell prefers explicit width over everything else", () => {
    assert.equal(
        resolveDialogFullscreenShellMaxWidth({
            width: 640,
            maxWidth: 900,
            hasExplicitWidth: true,
            hasExplicitMaxWidth: true,
        }),
        "640px",
    );
});

test("fullscreen shell uses explicit maxWidth when width is not provided", () => {
    assert.equal(
        resolveDialogFullscreenShellMaxWidth({
            maxWidth: "72rem",
            hasExplicitMaxWidth: true,
        }),
        "72rem",
    );
});

test("fullscreen shell falls back to the default reading width when no width props were explicitly passed", () => {
    assert.equal(
        resolveDialogFullscreenShellMaxWidth({
            maxWidth: "90vw",
            hasExplicitWidth: false,
            hasExplicitMaxWidth: false,
        }),
        "860px",
    );
});

test("fullscreen shell falls back to explicit maxWidth when explicit width is empty", () => {
    assert.equal(
        resolveDialogFullscreenShellMaxWidth({
            width: "   ",
            maxWidth: 960,
            hasExplicitWidth: true,
            hasExplicitMaxWidth: true,
        }),
        "960px",
    );
});

test("fullscreen shell supports a custom fallback width", () => {
    assert.equal(
        resolveDialogFullscreenShellMaxWidth({
            hasExplicitWidth: false,
            hasExplicitMaxWidth: false,
            fallbackMaxWidth: "920px",
        }),
        "920px",
    );
});
