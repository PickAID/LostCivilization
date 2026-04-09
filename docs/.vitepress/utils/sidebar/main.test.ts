import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { generateSidebars } from "./main";

test("nested roots generate standalone sidebar routes", async () => {
    const sidebar = await generateSidebars({
        docsPath: path.resolve(process.cwd(), "docs"),
        isDevMode: false,
        lang: "zh",
    });

    assert.ok(sidebar, "expected sidebar output");
    assert.ok(
        sidebar["/zh/develop/modding/1.20.4/Neoforge/"],
        "expected NeoForge nested root sidebar route",
    );
    assert.ok(
        sidebar["/zh/develop/modding/1.20.4/Neoforge/flandre/"],
        "expected flandre nested root sidebar route",
    );

    const neoforgeRoot = sidebar["/zh/develop/modding/1.20.4/Neoforge/"]?.[0];
    assert.equal(neoforgeRoot?.text, "NeoForge");

    const flandreRoot = sidebar["/zh/develop/modding/1.20.4/Neoforge/flandre/"]?.[0];
    assert.equal(flandreRoot?.text, "Flandre");
});
