import test from "node:test";
import assert from "node:assert/strict";
import type { NavLink } from "../../../config/navTypes";
import {
    activeNavHoverMenuId,
    activateNavHoverMenu,
    cancelNavHoverMenuClose,
    createNavHoverPreviewState,
    deactivateNavHoverMenu,
    getActiveNavHoverPreviewLinkForTests,
    isNavHoverPreviewSheetHoveredForTests,
    resetNavHoverStateForTests,
    scheduleNavHoverMenuClose,
} from "./navHoverPreviewState";

const previewLinkA: NavLink = {
    text: "Alpha",
    preview: {
        title: "Alpha",
        desc: "alpha preview",
    },
};

const previewLinkB: NavLink = {
    text: "Beta",
    preview: {
        title: "Beta",
        desc: "beta preview",
    },
};

function wait(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

test.afterEach(() => {
    resetNavHoverStateForTests();
});

test("nav hover menu switches active section immediately and ignores stale close timers", async () => {
    activateNavHoverMenu("menu-a");
    assert.equal(activeNavHoverMenuId.value, "menu-a");

    scheduleNavHoverMenuClose("menu-a", 20);
    activateNavHoverMenu("menu-b");

    assert.equal(activeNavHoverMenuId.value, "menu-b");

    await wait(30);

    assert.equal(activeNavHoverMenuId.value, "menu-b");
});

test("preview hover keeps the current preview alive long enough to enter the sheet", async () => {
    const state = createNavHoverPreviewState("menu-a");

    activateNavHoverMenu("menu-a");
    state.onItemEnter(previewLinkA);

    assert.equal(getActiveNavHoverPreviewLinkForTests()?.text, "Alpha");

    state.onItemLeave();
    assert.equal(getActiveNavHoverPreviewLinkForTests()?.text, "Alpha");

    await wait(40);
    state.onSheetEnter();

    assert.equal(isNavHoverPreviewSheetHoveredForTests(), true);
    assert.equal(getActiveNavHoverPreviewLinkForTests()?.text, "Alpha");

    await wait(70);
    assert.equal(getActiveNavHoverPreviewLinkForTests()?.text, "Alpha");

    state.onSheetLeave();
    await wait(270);

    assert.equal(getActiveNavHoverPreviewLinkForTests(), null);
});

test("preview link switching inside one menu is immediate", () => {
    const state = createNavHoverPreviewState("menu-a");

    activateNavHoverMenu("menu-a");
    state.onItemEnter(previewLinkA);
    assert.equal(getActiveNavHoverPreviewLinkForTests()?.text, "Alpha");

    state.onItemEnter(previewLinkB);
    assert.equal(getActiveNavHoverPreviewLinkForTests()?.text, "Beta");

    cancelNavHoverMenuClose("menu-a");
    deactivateNavHoverMenu("menu-a");
});
