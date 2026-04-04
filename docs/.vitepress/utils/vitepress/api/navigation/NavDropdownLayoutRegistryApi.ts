interface NavDropdownLayoutRegistration {
    layout: string;
    component: any;
}

function normalizeNavLayout(value: unknown) {
    if (typeof value !== "string") return "";
    return value.trim().toLowerCase();
}

class NavDropdownLayoutRegistryApi {
    private readonly layoutMap = new Map<string, any>();

    registerLayout(layout: string, component: any) {
        const normalizedLayout = normalizeNavLayout(layout);
        if (!normalizedLayout || !component) return;
        this.layoutMap.set(normalizedLayout, component);
    }

    registerLayouts(registrations: NavDropdownLayoutRegistration[]) {
        registrations.forEach((registration) =>
            this.registerLayout(registration.layout, registration.component),
        );
    }

    hasLayout(layout: string) {
        return this.layoutMap.has(normalizeNavLayout(layout));
    }

    resolveLayoutComponent(layout: unknown, explicitComponent?: any) {
        if (explicitComponent) return explicitComponent;
        const normalizedLayout = normalizeNavLayout(layout);
        if (!normalizedLayout) return undefined;
        return this.layoutMap.get(normalizedLayout);
    }

    listLayouts() {
        return Array.from(this.layoutMap.keys()).sort();
    }
}

export const navDropdownLayoutRegistry = new NavDropdownLayoutRegistryApi();

