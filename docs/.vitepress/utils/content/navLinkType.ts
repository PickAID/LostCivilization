export interface NavBadge {
    text: string
    type?: 'info' | 'tip' | 'warning' | 'danger' | 'new' | 'beta' | 'deprecated'
}

export type NavLinkStyle = 'default' | 'soft' | 'outline' | 'solid'

export interface NavLink {
    icon?: NavIcon | NavThemeIcon
    logo?: NavIcon | NavThemeIcon
    badge?: string | NavBadge
    badges?: Array<string | NavBadge>
    title: string
    desc?: string
    link: string
    tag?: string
    color?: string
    target?: '_blank' | '_self' | '_parent'
    eyebrow?: string
    note?: string
    featured?: boolean
    style?: NavLinkStyle
    iconBackground?: string
}

export interface NavData {
    title: string
    description?: string
    items: NavLink[]
    columns?: number
    icon?: NavIcon | NavThemeIcon
    eyebrow?: string
}

export type NavIcon = string | NavSvg

export interface NavSvg {
    svg: string
}

export interface NavThemeIcon {
    dark?: NavIcon
    light?: NavIcon
}
