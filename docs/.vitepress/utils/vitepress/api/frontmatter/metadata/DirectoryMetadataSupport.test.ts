import test from "node:test";
import assert from "node:assert/strict";
import {
    extractRouteLocale,
    pagePathToDirectoryRoute,
    relativeDocsPathToDirectoryRoute,
    shouldReplaceDirectoryMetadataCandidate,
} from "./DirectoryMetadataSupport";

test("relativeDocsPathToDirectoryRoute resolves directory route from markdown path", () => {
    assert.equal(
        relativeDocsPathToDirectoryRoute(
            "zh/mods/adventure/Champions-Unofficial/sidebarIndex.md",
        ),
        "/zh/mods/adventure/Champions-Unofficial/",
    );
    assert.equal(relativeDocsPathToDirectoryRoute("zh/sidebarIndex.md"), "/zh/");
});

test("pagePathToDirectoryRoute resolves landing and content pages to the same directory", () => {
    assert.equal(
        pagePathToDirectoryRoute("/zh/mods/adventure/Champions-Unofficial/Catalogue"),
        "/zh/mods/adventure/Champions-Unofficial/",
    );
    assert.equal(
        pagePathToDirectoryRoute("/zh/mods/adventure/Champions-Unofficial/wiki"),
        "/zh/mods/adventure/Champions-Unofficial/",
    );
    assert.equal(
        pagePathToDirectoryRoute("/zh/mods/adventure/Champions-Unofficial/"),
        "/zh/mods/adventure/Champions-Unofficial/",
    );
});

test("sidebarIndex wins over Catalogue as directory metadata source", () => {
    assert.equal(
        shouldReplaceDirectoryMetadataCandidate("Catalogue.md", "sidebarIndex.md"),
        true,
    );
    assert.equal(
        shouldReplaceDirectoryMetadataCandidate("sidebarIndex.md", "Catalogue.md"),
        false,
    );
});

test("extractRouteLocale returns the route locale segment", () => {
    assert.equal(extractRouteLocale("/zh/mods/adventure/"), "zh");
    assert.equal(extractRouteLocale("/en/doc/rules"), "en");
    assert.equal(extractRouteLocale("/"), null);
});
