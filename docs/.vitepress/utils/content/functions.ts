const WORD_PATTERN = /[a-zA-Z0-9_\u0392-\u03C9\u00C0-\u00FF\u0600-\u06FF\u0400-\u04FF]+|[\u4E00-\u9FFF\u3400-\u4DBF\uF900-\uFAFF\u3040-\u309F\uAC00-\uD7AF]+/g

export function countWord(data: string): number {
    const matches = data.match(WORD_PATTERN)
    if (!matches) return 0

    return matches.reduce((count, match) => {
        const isCjk = match.charCodeAt(0) >= 0x4E00
        return count + (isCjk ? match.length : 1)
    }, 0)
}