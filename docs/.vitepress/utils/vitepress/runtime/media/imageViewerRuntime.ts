import { nextTick } from "vue";
import "@fancyapps/ui/dist/fancybox/fancybox.css";
import type { FancyboxOptions } from "@fancyapps/ui/dist/fancybox/fancybox";

const FANCYBOX_SELECTOR =
    '.vp-doc img:not(.non-preview-image):not([data-no-fancybox])';
type FancyboxQueryRoot =
    | Pick<Document, "querySelectorAll">
    | Pick<Element, "querySelectorAll">
    | null
    | undefined;

const findNearestHeading = (imgElement) => {
    let currentElement = imgElement;
    while (currentElement && currentElement !== document.body) {
        let previousSibling = currentElement.previousElementSibling;
        while (previousSibling) {
            if (previousSibling.tagName.match(/^H[1-6]$/)) {
                return previousSibling.textContent
                    .replace(/\u200B/g, "")
                    .trim();
            }
            previousSibling = previousSibling.previousElementSibling;
        }
        currentElement = currentElement.parentElement;
    }

    return "";
};

const prepareFancyboxTargets = (root?: FancyboxQueryRoot) => {
    const queryRoot = root ?? document;
    const imgs = queryRoot.querySelectorAll(FANCYBOX_SELECTOR);

    imgs.forEach((img) => {
        const image = img as HTMLImageElement;
        if (!image.getAttribute("src")) return;

        if (!image.hasAttribute("data-fancybox")) {
            image.setAttribute("data-fancybox", "gallery");
        }
        if (
            !image.hasAttribute("alt") ||
            image.getAttribute("alt") === ""
        ) {
            const heading = findNearestHeading(image);
            image.setAttribute("alt", heading);
        }
        const altString = image.getAttribute("alt") || "";
        image.setAttribute("data-caption", altString);
    });
};

const resolveFancyboxContainer = (root?: FancyboxQueryRoot) => {
    if (root instanceof HTMLElement) return root;
    return null;
};

const fancyboxOptions = {
    Hash: false,
    caption: false,
    Thumbs: {
        type: "classic",
        showOnStart: false,
    },
    Images: {
        Panzoom: {
            maxScale: 4,
        },
    },
    Carousel: {
        transition: "slide",
    },
    Toolbar: {
        display: {
            left: ["infobar"],
            middle: [
                "zoomIn",
                "zoomOut",
                "toggle1to1",
                "rotateCCW",
                "rotateCW",
                "flipX",
                "flipY",
            ],
            right: ["slideshow", "thumbs", "close"],
        },
    },
} as Partial<FancyboxOptions>;

export const bindFancybox = (root?: FancyboxQueryRoot) => {
    nextTick(async () => {
        if (typeof document === "undefined") return;
        const { Fancybox } = await import("@fancyapps/ui");
        prepareFancyboxTargets(root);
        const container = resolveFancyboxContainer(root);
        Fancybox.unbind(container, FANCYBOX_SELECTOR);
        Fancybox.bind(container, FANCYBOX_SELECTOR, fancyboxOptions);
    });
};

export const destroyFancybox = async () => {
    const { Fancybox } = await import("@fancyapps/ui");
    Fancybox.destroy();
};
