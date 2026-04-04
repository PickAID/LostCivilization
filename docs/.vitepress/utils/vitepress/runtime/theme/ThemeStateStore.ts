import { computed, ref, shallowRef } from "vue";
import { Ref } from "vue";

export class ThemeStateStore {
    readonly clientMounted = ref(false);
    readonly firstPaintSettled = ref(false);
    readonly version = ref(0);

    private readonly stableDark = ref<boolean | null>(null);
    private readonly reactiveDarkSource = shallowRef<Ref<boolean>>();

    readonly reactiveDark = computed(() => {
        return this.reactiveDarkSource.value.value;
    });

    readonly effectiveDark = computed(() => {
        const reactiveDark = this.reactiveDark.value;

        if (typeof window === "undefined") {
            return reactiveDark;
        }

        if (this.stableDark.value !== null) {
            return this.stableDark.value;
        }

        return reactiveDark;
    });

    readonly themeReady = computed(() => {
        if (typeof window === "undefined") {
            return true;
        }

        return this.clientMounted.value && this.firstPaintSettled.value;
    });

    constructor(reactiveDark: Ref<boolean>) {
        this.reactiveDarkSource.value = reactiveDark;
    }

    setReactiveDarkSource(reactiveDark: Ref<boolean>) {
        this.reactiveDarkSource.value = reactiveDark;
    }

    setMounted(value: boolean) {
        this.clientMounted.value = value;
    }

    setFirstPaintSettled(value: boolean) {
        this.firstPaintSettled.value = value;
    }

    syncStableDark(next: boolean) {
        if (this.stableDark.value === next) {
            return;
        }

        this.stableDark.value = next;
        this.version.value += 1;
    }

    resetForClientTeardown() {
        this.clientMounted.value = false;
        this.firstPaintSettled.value = false;
        this.stableDark.value = null;
    }
}
