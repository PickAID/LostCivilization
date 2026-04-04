export type ThemeValue<T> = T | { light?: T; dark?: T; value?: T };
export type FloatingColorType = "solid" | "gradient" | "random-gradient";
export type FloatingMotionStyle = "drift";
export type FloatingShapeType = "circle" | "square" | "diamond" | "hexagon";
export type FloatingBuiltinElementType =
    | "text"
    | "card"
    | "image"
    | "lottie"
    | "badge"
    | "icon"
    | "stat"
    | "code"
    | "shape";
export type FloatingElementType =
    | FloatingBuiltinElementType
    | (string & {});

export interface FloatingItem {
    type?: FloatingElementType;
    renderAs?: FloatingBuiltinElementType;
    component?: string;
    componentProps?: Record<string, unknown>;
    className?: string;
    text?: ThemeValue<string>;
    code?: ThemeValue<string>;
    value?: ThemeValue<string>;
    icon?: ThemeValue<string>;
    shape?: FloatingShapeType;
    title?: ThemeValue<string>;
    description?: ThemeValue<string>;
    src?: ThemeValue<string>;
    alt?: ThemeValue<string>;
    x?: string;
    y?: string;
    width?: string;
    rotate?: number;
    opacity?: number;
    delay?: number;
    duration?: number;
    driftX?: number;
    driftY?: number;
    motionStyle?: FloatingMotionStyle;
    colorType?: FloatingColorType;
    color?: ThemeValue<string>;
    gradients?: Array<ThemeValue<string>>;
    gradient?: ThemeValue<string>;
    textShadow?: ThemeValue<string>;
    background?: ThemeValue<string>;
    borderColor?: ThemeValue<string>;
    borderRadius?: string;
    shadow?: ThemeValue<string>;
    size?: string;
    weight?: number | string;
    letterSpacing?: string;
    titleColor?: ThemeValue<string>;
    descriptionColor?: ThemeValue<string>;
    fit?: "cover" | "contain" | "fill" | "scale-down" | "none";
    loop?: boolean;
    autoplay?: boolean;
    speed?: number;
}

export interface FloatingConfig {
    enabled?: boolean;
    density?: number;
    opacity?: number;
    zIndex?: number;
    blur?: number;
    motion?: {
        enabled?: boolean;
        durationMin?: number;
        durationMax?: number;
        drift?: number;
        style?: FloatingMotionStyle;
    };
    gradients?: Array<ThemeValue<string>>;
    items?: FloatingItem[];
}

export interface NormalizedFloatingItem {
    key: string;
    rawType: FloatingElementType;
    type: FloatingBuiltinElementType;
    component?: string;
    componentProps?: Record<string, unknown>;
    customClass?: string;
    code: string;
    value: string;
    icon: string;
    shape: FloatingShapeType;
    text: string;
    title: string;
    description: string;
    src?: string;
    alt: string;
    x: string;
    y: string;
    width?: string;
    rotate: number;
    opacity: number;
    duration: number;
    delay: number;
    driftX: number;
    driftY: number;
    motionStyle: FloatingMotionStyle;
    color?: string;
    background?: string;
    borderColor?: string;
    colorType: FloatingColorType;
    gradientValue: string;
    textColor: string;
    textShadow: string;
    textBackground: string;
    textBorderColor: string;
    textRadius: string;
    textBoxShadow: string;
    cardBackground: string;
    cardBorderColor: string;
    cardRadius: string;
    cardShadow: string;
    cardTitleColor: string;
    cardDescriptionColor: string;
    imageBorderColor: string;
    imageRadius: string;
    imageShadow: string;
    imageBackground: string;
    imageFit: string;
    lottieLoop: boolean;
    lottieAutoplay: boolean;
    lottieSpeed: number;
    badgeBackground: string;
    badgeBorderColor: string;
    badgeRadius: string;
    badgeShadow: string;
    badgeColor: string;
    badgeIconColor: string;
    iconBackground: string;
    iconBorderColor: string;
    iconRadius: string;
    iconShadow: string;
    iconColor: string;
    iconSize: string;
    statBackground: string;
    statBorderColor: string;
    statRadius: string;
    statShadow: string;
    statLabelColor: string;
    statValueColor: string;
    codeBackground: string;
    codeBorderColor: string;
    codeRadius: string;
    codeShadow: string;
    codeColor: string;
    codeSize: string;
    shapeBackground: string;
    shapeBorderColor: string;
    shapeRadius: string;
    shapeShadow: string;
    shapeSize: string;
    textSize: string;
    textWeight: string | number;
    textLetterSpacing: string;
}
