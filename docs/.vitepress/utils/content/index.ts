/**
 * Content utilities for CryChicDoc
 */

import { countWord } from "./functions";
import * as navLinkType from "./navLinkType";
import * as mNavLinkFactory from "./mNavLinkFactory";

export * from "./billing";
export * from "./mNavLinkFactory";
export { navLinksData } from "./navLinksData";

export const text = {
    countWord,
    getReadingTime: (text: string, wordsPerMinute: number = 200): number => {
        const wordCount = countWord(text);
        return Math.ceil(wordCount / wordsPerMinute);
    },
};

export const contentUtils = {
    text,
    countWord,
    getReadingTime: text.getReadingTime,
    navLinkType,
    mNavLinkFactory,
};

export default contentUtils;