<script setup lang="ts">
import {
    ref,
    computed,
    watch,
    onMounted,
    onUpdated,
    onBeforeUpdate,
    nextTick,
} from "vue";
import { BillManager } from "@utils/content/billing/BillManager";
import type { Bill } from "@utils/content/billing/BillTypes";
import { useSafeI18n } from "@utils/i18n/locale";
import { getDefaultCurrency } from "@config/project-config";

const props = defineProps<{
    bills: Bill[] | (() => Promise<Bill[]>);
    currency?: string;
}>();

const { t } = useSafeI18n("bills-component", {
    available: "Available: {amount}",
    income: "Income: {amount}",
    outlay: "Outlay: {amount}",
    operator: "Operator: {name}",
    incomeSource: "Income Source",
    outlayTarget: "Outlay Target",
    transactionContent: "Transaction Content",
    empty: "No bill data available.",
    loading: "Processing bills...",
});

const componentId = `bills-${Math.random().toString(36).substring(2, 9)}`;
const manager = ref<BillManager | null>(null);
const isLoading = ref(true);
const summaryDisplayCurrency = ref(props.currency || getDefaultCurrency());
const availableCurrencies = ref<string[]>([
    "CNY",
    "USD",
    "EUR",
    "JPY",
    "GBP",
]);

const descriptionRowRefs = ref<HTMLElement[]>([]);

onBeforeUpdate(() => {
    descriptionRowRefs.value = [];
});

onUpdated(() => {
    nextTick(() => {
        if (typeof document !== "undefined") {
            const container = document.getElementById(componentId);
            if (container) {
                const allDetailRows =
                    container.querySelectorAll(".detail-row");
                allDetailRows.forEach((row) => {
                    const textEl =
                        row.querySelector<HTMLElement>(".detail-text");
                    if (textEl) {
                        const style = getComputedStyle(textEl);
                        const lineHeight = parseFloat(style.lineHeight);
                        if (textEl.scrollHeight > lineHeight + 3) {
                            row.classList.add("multiline");
                        } else {
                            row.classList.remove("multiline");
                        }
                    }
                });
            }
        }
    });
});

async function fetchAvailableCurrencies() {
    try {
        const response = await fetch(
            "https://api.frankfurter.app/currencies"
        );
        if (!response.ok) throw new Error("Failed to fetch currencies");
        const data = await response.json();
        const currencyCodes = Object.keys(data);
        const preferred = ["CNY", "USD", "EUR", "JPY", "GBP"];
        const other = currencyCodes
            .filter((c) => !preferred.includes(c))
            .sort();
        availableCurrencies.value = [...preferred, ...other];
    } catch (error) {
        console.error(
            "Could not fetch available currencies, using fallback list.",
            error
        );
    }
}

const initialize = async () => {
    isLoading.value = true;
    let sourceBills: Bill[] = [];
    
    if (typeof props.bills === "function") {
        try {
            sourceBills = await props.bills();
        } catch (e) {
            console.error("Failed to load bills from function:", e);
        }
    } else {
        sourceBills = props.bills || [];
    }

    const defaultTargetUnit = props.currency || getDefaultCurrency();
    const processedBills = await BillManager.processBills(
        sourceBills,
        defaultTargetUnit
    );
    manager.value = new BillManager(processedBills);
    isLoading.value = false;
};

const summaryInPrimaryCurrency = computed(() => {
    if (!manager.value)
        return { available: 0, totalIncome: 0, totalOutlay: 0 };
    return manager.value.getSummary();
});

const summaryRate = ref(1);
watch(
    summaryDisplayCurrency,
    async (newCurrency) => {
        const primary = props.currency || getDefaultCurrency();
        if (newCurrency === primary) {
            summaryRate.value = 1;
            return;
        }
        try {
            const response = await fetch(
                `https://api.frankfurter.app/latest?from=${primary}&to=${newCurrency}`
            );
            const data = await response.json();
            summaryRate.value = data.rates[newCurrency] || 1;
        } catch {
            summaryRate.value = 1;
        }
    },
    { immediate: true }
);

const convertedSummary = computed(() => {
    const symbol = BillManager.resolveCurrencySymbol(
        summaryDisplayCurrency.value
    );
    return {
        available: BillManager.format(
            summaryInPrimaryCurrency.value.available * summaryRate.value,
            symbol
        ),
        totalIncome: BillManager.format(
            summaryInPrimaryCurrency.value.totalIncome * summaryRate.value,
            symbol
        ),
        totalOutlay: BillManager.format(
            summaryInPrimaryCurrency.value.totalOutlay * summaryRate.value,
            symbol
        ),
    };
});

onMounted(() => {
    initialize();
    fetchAvailableCurrencies();
});
watch(() => [props.bills, props.currency], initialize, { deep: true });
</script>

<template>
    <div class="bills-root">
        <div class="summary-section">
            <div class="summary-values">
                <div class="summary-item available">
                    {{
                        t.available.replace(
                            "{amount}",
                            convertedSummary.available
                        )
                    }}
                </div>
                <div class="summary-item income">
                    {{
                        t.income.replace(
                            "{amount}",
                            convertedSummary.totalIncome
                        )
                    }}
                </div>
                <div class="summary-item outlay">
                    {{
                        t.outlay.replace(
                            "{amount}",
                            convertedSummary.totalOutlay
                        )
                    }}
                </div>
            </div>
            <div class="currency-switcher-wrapper">
                <select
                    v-model="summaryDisplayCurrency"
                    class="currency-select"
                >
                    <option
                        v-for="c in availableCurrencies"
                        :key="c"
                        :value="c"
                    >
                        {{ c }}
                    </option>
                </select>
            </div>
        </div>

        <div v-if="isLoading" class="state-placeholder">{{ t.loading }}</div>
        <div
            v-else-if="!manager || manager.getBills().length === 0"
            class="state-placeholder"
        >
            {{ t.empty }}
        </div>

        <div v-else class="bill-list-container" :id="componentId">
            <div
                v-for="(bill, index) in manager.getBills()"
                :key="index"
                class="collapse-container"
            >
                <input
                    type="checkbox"
                    :id="`${componentId}-${index}`"
                    class="collapse-toggle"
                />
                <label :for="`${componentId}-${index}`" class="collapse-header">
                    <div class="icon-wrapper">
                        <div :class="['icon-circle', bill.type]">
                            {{
                                BillManager.resolveCurrencySymbol(
                                    bill["target-unit"]!
                                )
                            }}
                        </div>
                    </div>
                    <div class="info-wrapper">
                        <div class="info-primary">{{ bill.date }}</div>
                        <div class="info-secondary">
                            {{ t.operator.replace("{name}", bill.operator) }}
                        </div>
                    </div>
                    <div class="amount-wrapper">
                        <div
                            v-if="
                                bill['original-unit'] && bill['original-amount']
                            "
                            class="original-amount"
                        >
                            {{
                                BillManager.format(
                                    bill["original-amount"],
                                    BillManager.resolveCurrencySymbol(
                                        bill["original-unit"]
                                    )
                                )
                            }}
                        </div>
                        <div class="exchanged-amount">
                            {{
                                BillManager.format(
                                    bill["exchanged-amount"],
                                    BillManager.resolveCurrencySymbol(
                                        bill["target-unit"]!
                                    )
                                )
                            }}
                        </div>
                    </div>
                </label>
                <div class="collapse-content">
                    <div class="detail-row">
                        <span class="detail-badge type">
                            {{
                                bill.type === "income"
                                    ? t.incomeSource
                                    : t.outlayTarget
                            }}
                        </span>
                        <span class="detail-text">{{ bill.target }}</span>
                    </div>
                    <div
                        v-if="bill.description"
                        class="detail-row"
                        :ref="(el) => (descriptionRowRefs[index] = el as HTMLElement)"
                    >
                        <span class="detail-badge description">
                            {{ t.transactionContent }}
                        </span>
                        <span class="detail-text">{{ bill.description }}</span>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.bills-root {
    --bill-frame-bg: var(--vp-c-bg-soft);
    --bill-panel-bg: var(--vp-c-bg-elv);
    --bill-border: var(--vp-c-divider);
    --bill-border-strong: var(--vp-c-divider);
    --bill-text: var(--vp-c-text-1);
    --bill-muted: var(--vp-c-text-2);
    --bill-subtle: var(--vp-c-text-3);
    --bill-available: #7a8089;
    --bill-available-soft: rgba(122, 128, 137, 0.12);
    --bill-income: #2f8f5b;
    --bill-income-soft: rgba(47, 143, 91, 0.14);
    --bill-outlay: #b88918;
    --bill-outlay-soft: rgba(184, 137, 24, 0.16);
    margin: 20px 0;
}

.dark .bills-root {
    --bill-available-soft: rgba(122, 128, 137, 0.2);
    --bill-income-soft: rgba(47, 143, 91, 0.22);
    --bill-outlay-soft: rgba(184, 137, 24, 0.24);
}

.summary-section {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    margin-bottom: 16px;
    align-items: center;
    padding: 16px;
    border: 1px solid var(--bill-border);
    border-radius: 18px;
    background: var(--bill-frame-bg);
}

.summary-values {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
    flex-grow: 1;
}
@media (max-width: 640px) {
    .summary-section {
        flex-direction: column;
        align-items: stretch;
        padding: 12px;
        border-radius: 14px;
        gap: 10px;
    }
    .summary-values {
        display: grid;
        grid-template-columns: 1fr;
        gap: 8px;
        width: 100%;
    }
    .currency-switcher-wrapper {
        align-self: stretch;
        width: 100%;
    }
    .currency-select {
        width: 100%;
    }
    .summary-item {
        min-width: 0;
        width: 100%;
        justify-content: flex-start;
        padding: 10px 12px;
        font-size: 13px;
    }
    .bill-list-container {
        padding: 8px;
        border-radius: 16px;
    }
    .collapse-container {
        border-radius: 14px;
    }
}
.summary-item {
    min-width: 132px;
    min-height: 48px;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 10px 16px;
    border-radius: 12px;
    border: 1px solid var(--bill-border);
    font-weight: 600;
    font-size: 14px;
    text-align: center;
    white-space: nowrap;
    flex-shrink: 0;
    background: var(--bill-panel-bg);
}

.available {
    border-color: color-mix(in srgb, var(--bill-available) 24%, var(--bill-border) 76%);
    background: var(--bill-available-soft);
    color: var(--bill-text);
}

.income {
    border-color: color-mix(in srgb, var(--bill-income) 34%, var(--bill-border) 66%);
    background: var(--bill-income-soft);
    color: var(--bill-text);
}

.outlay {
    border-color: color-mix(in srgb, var(--bill-outlay) 36%, var(--bill-border) 64%);
    background: var(--bill-outlay-soft);
    color: var(--bill-text);
}

.currency-switcher-wrapper {
    flex-shrink: 0;
}

.currency-select {
    border: 1px solid var(--bill-border);
    background-color: var(--bill-panel-bg);
    color: var(--bill-text);
    border-radius: 10px;
    padding: 8px 12px;
    font-size: 14px;
    cursor: pointer;
    transition: border-color 0.2s ease, background-color 0.2s ease;
    min-width: 92px;
}

.currency-select:hover {
    border-color: var(--vp-c-brand-1);
}

.bill-list-container {
    border: 1px solid var(--bill-border);
    border-radius: 20px;
    padding: 10px;
    background: var(--bill-frame-bg);
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.collapse-container {
    background: var(--bill-panel-bg);
    border-radius: 16px;
    overflow: hidden;
    border: 1px solid var(--bill-border-strong);
    transition: border-color 0.2s ease, background-color 0.2s ease;
}

.collapse-toggle {
    display: none;
}

.collapse-header {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 24px 40px 24px 12px;
    cursor: pointer;
    position: relative;
    transition: background-color 0.2s ease;
}

.collapse-header:hover {
    background: color-mix(in srgb, var(--bill-frame-bg) 52%, transparent);
}

@media (max-width: 640px) {
    .collapse-header {
        display: grid;
        grid-template-columns: 36px minmax(0, 1fr);
        grid-template-areas:
            "icon info"
            "amount amount";
        align-items: center;
        padding: 14px 36px 14px 12px;
        gap: 10px;
    }
    .icon-wrapper {
        grid-area: icon;
    }
    .info-wrapper {
        grid-area: info;
        min-width: 0;
    }
    .amount-wrapper {
        grid-area: amount;
        margin-top: 0;
        padding-top: 10px;
        border-top: 1px solid var(--bill-border);
        justify-content: space-between;
        align-items: flex-end;
        width: 100%;
    }
    .icon-circle {
        width: 32px;
        height: 32px;
        font-size: 16px;
    }
    .info-primary {
        font-size: 15px;
        margin-bottom: 4px;
    }
    .info-secondary {
        font-size: 13px;
    }
    .original-amount {
        border-right: none;
        padding-right: 0;
    }
    .exchanged-amount {
        font-size: 18px;
    }
}

.collapse-header::after {
    content: "▾";
    position: absolute;
    right: 16px;
    top: 50%;
    transform: translateY(-50%);
    transition: transform 0.3s ease;
    font-size: 14px;
    color: var(--bill-subtle);
}

.collapse-toggle:not(:checked) ~ .collapse-header::after {
    transform: translateY(-50%) rotate(180deg);
}

.icon-wrapper {
    flex-shrink: 0;
}

.icon-circle {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: bold;
    font-size: 18px;
    border: 1px solid transparent;
}

.icon-circle.income {
    background: var(--bill-income-soft);
    border-color: color-mix(in srgb, var(--bill-income) 34%, var(--bill-border) 66%);
    color: var(--bill-income);
}

.icon-circle.outlay {
    background: var(--bill-outlay-soft);
    border-color: color-mix(in srgb, var(--bill-outlay) 36%, var(--bill-border) 64%);
    color: var(--bill-outlay);
}

.info-wrapper {
    flex-grow: 1;
}

.info-primary {
    font-weight: 700;
    color: var(--bill-text);
    font-size: 18px;
    margin-bottom: 2px;
}

.info-secondary {
    font-size: 15px;
    color: var(--bill-muted);
}

.amount-wrapper {
    text-align: right;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    gap: 8px;
}

.original-amount {
    font-size: 15px;
    color: var(--bill-muted);
    opacity: 0.75;
    border-right: 1px solid var(--bill-border);
    padding-right: 8px;
}

.exchanged-amount {
    font-size: 20px;
    font-weight: 600;
    color: var(--bill-text);
}

.collapse-content {
    display: none;
    padding: 16px 24px 16px 16px;
    opacity: 0;
    max-height: 0;
    overflow: hidden;
    transition: all 0.3s ease;
    background: var(--bill-panel-bg);
    border-top: 1px solid var(--bill-border);
}

.collapse-toggle:checked ~ .collapse-content {
    display: grid;
    grid-template-columns: max-content 1fr;
    gap: 12px;
    align-items: center;
    padding: 16px 24px 16px 16px;
    opacity: 1;
    max-height: 300px;
    animation: slideDown 0.3s ease;
}

@keyframes slideDown {
    from {
        opacity: 0;
        transform: translateY(-10px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.detail-row {
    display: contents;
}

.detail-row.multiline > .detail-badge,
.detail-row.multiline > .detail-text {
    align-self: start;
}

.detail-row:last-child {
    margin-bottom: 0;
}
@media (max-width: 640px) {
    .collapse-toggle:checked ~ .collapse-content {
        display: flex;
        flex-direction: column;
        gap: 4px;
        align-items: initial;
        padding: 14px 16px;
    }

    .detail-row {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        gap: 6px;
        margin-bottom: 10px;
    }

    .detail-badge {
        min-width: auto !important;
        max-width: none;
        align-self: flex-start;
        padding: 5px 10px;
        font-size: 11px;
    }
    .detail-text {
        max-width: 100%;
        font-size: 13px;
        line-height: 1.55;
    }
}
.detail-badge {
    padding: 6px 12px;
    border-radius: 999px;
    font-size: 12px;
    font-weight: 600;
    color: var(--bill-text);
    flex-shrink: 0;
    min-width: 110px;
    max-width: 160px;
    text-align: center;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    border: 1px solid var(--bill-border);
    background: var(--bill-frame-bg);
}

.detail-badge.type {
    color: var(--bill-income);
    border-color: color-mix(in srgb, var(--bill-income) 30%, var(--bill-border) 70%);
    background: var(--bill-income-soft);
}

.detail-badge.description {
    color: var(--bill-outlay);
    border-color: color-mix(in srgb, var(--bill-outlay) 30%, var(--bill-border) 70%);
    background: var(--bill-outlay-soft);
}

.detail-text {
    font-size: 13px;
    color: var(--bill-muted);
    line-height: 1.6;
    word-break: break-word;
    font-weight: 500;
    text-align: left;
    transition: text-align 0.2s ease;
}

.detail-row.multiline .detail-text {
    text-align: justify;
}

.state-placeholder {
    padding: 32px;
    text-align: center;
    background: var(--bill-frame-bg);
    border: 1px solid var(--bill-border);
    border-radius: 16px;
    color: var(--bill-muted);
    margin: 8px 0;
}
</style>
