export class ChartThemeRuntime {
    static readonly presets = {
        light: {
            colors: ['#4caf50', '#2196f3', '#ff9800', '#9c27b0', '#f44336', '#00bcd4', '#ffc107', '#e91e63', '#009688', '#795548', '#607d8b', '#673ab7', '#3f51b5', '#03a9f4', '#8bc34a', '#cddc39', '#ff5722', '#607d8b'],
            backgroundColor: 'transparent',
            textColor: '#333333',
            axisColor: '#ccc',
            gridColor: '#f5f5f5',
        },
        dark: {
            colors: ['#81c784', '#64b5f6', '#ffb74d', '#ba68c8', '#e57373', '#4dd0e1', '#ffd54f', '#f06292', '#4db6ac', '#a1887f', '#90a4ae', '#9575cd', '#7986cb', '#4fc3f7', '#aed581', '#dce775', '#ff8a65', '#90a4ae'],
            backgroundColor: 'transparent',
            textColor: '#ffffff',
            axisColor: '#666',
            gridColor: '#424242',
        },
    };

    static resolvePaletteMode(theme: any, isDark: boolean): 'light' | 'dark' | null {
        if (theme && typeof theme === 'object' && !Array.isArray(theme)) return null;
        if (!theme || theme === 'auto') return isDark ? 'dark' : 'light';
        return theme === 'dark' ? 'dark' : 'light';
    }

    static resolveComputedTheme(theme: any, isDark: boolean): any {
        if (theme && typeof theme === 'object' && !Array.isArray(theme)) return theme;
        if (theme === 'auto' || !theme) return isDark ? 'dark' : undefined;
        return theme;
    }
}
