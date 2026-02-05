/**
<<<<<<< HEAD
 * Capitalization section builders
 */

import { Unit } from "../../utils/units.js";
import { colors } from "../../utils/colors.js";
import { ROLLING_WINDOWS, line, baseline, mapWindows, sumsTreeBaseline, rollingPercentRatioTree, percentRatio, percentRatioBaseline } from "../series.js";
import { ratioBottomSeries, mapCohortsWithAll, flatMapCohortsWithAll } from "../shared.js";

// ============================================================================
// Shared building blocks
// ============================================================================

/**
 * Single cohort: Change + Growth Rate items (flat)
 * @param {UtxoCohortObject["tree"]} tree
 * @param {(name: string) => string} title
 * @returns {PartialOptionsTree}
 */
function singleDeltaItems(tree, title) {
  return [
    { ...sumsTreeBaseline({ windows: mapWindows(tree.realized.cap.delta.absolute, (c) => c.usd), title, metric: "Realized Cap Change", unit: Unit.usd, legend: "Change" }), name: "Change" },
    { ...rollingPercentRatioTree({ windows: tree.realized.cap.delta.rate, title, metric: "Realized Cap Growth Rate" }), name: "Growth Rate" },
=======
 * Valuation section builders
 *
 * Structure:
 * - Realized Cap: Total value at cost basis (USD)
 * - 30d Change: Recent realized cap changes
 * - MVRV: Market Value to Realized Value ratio
 *
 * For cohorts WITH full ratio patterns: MVRV uses createRatioChart (price + percentiles)
 * For cohorts WITHOUT full ratio patterns: MVRV is simple baseline
 */

import { Unit } from "../../utils/units.js";
import { line, baseline } from "../series.js";
import { createRatioChart, mapCohortsWithAll } from "../shared.js";

/**
 * @param {UtxoCohortObject | CohortWithoutRelative} cohort
 * @returns {AnyFetchedSeriesBlueprint[]}
 */
function createSingleRealizedCapSeries(cohort) {
  const { color, tree } = cohort;
  return [
    line({
      metric: tree.realized.realizedCap,
      name: "Realized Cap",
      color,
      unit: Unit.usd,
    }),
>>>>>>> 69eb58f7 (chore: update website from upstream v0.1.5)
  ];
}

/**
<<<<<<< HEAD
 * Grouped: Change + Growth Rate + MVRV items (flat)
 * @param {readonly (UtxoCohortObject | CohortWithoutRelative)[]} list
 * @param {CohortAll} all
 * @param {(name: string) => string} title
 * @returns {PartialOptionsTree}
 */
function groupedDeltaAndMvrv(list, all, title) {
  return [
    {
      name: "MVRV",
      title: title("MVRV"),
      bottom: mapCohortsWithAll(list, all, ({ name, color, tree }) =>
        baseline({ series: tree.realized.mvrv, name, color, unit: Unit.ratio, base: 1 }),
      ),
    },
    {
      name: "Change",
      tree: ROLLING_WINDOWS.map((w) => ({
        name: w.name,
        title: title(`${w.title} Realized Cap Change`),
        bottom: mapCohortsWithAll(list, all, ({ name, color, tree }) =>
          baseline({ series: tree.realized.cap.delta.absolute[w.key].usd, name, color, unit: Unit.usd }),
        ),
      })),
    },
    {
      name: "Growth Rate",
      tree: ROLLING_WINDOWS.map((w) => ({
        name: w.name,
        title: title(`${w.title} Realized Cap Growth Rate`),
        bottom: flatMapCohortsWithAll(list, all, ({ name, color, tree }) =>
          percentRatioBaseline({ pattern: tree.realized.cap.delta.rate[w.key], name, color }),
        ),
      })),
    },
  ];
}

// ============================================================================
// Single Cohort Sections
// ============================================================================

/**
 * Full capitalization (has invested capital, own market cap ratio, full MVRV)
 * @param {{ cohort: CohortAll | CohortFull | CohortLongTerm, title: (name: string) => string }} args
=======
 * @param {UtxoCohortObject | CohortWithoutRelative} cohort
 * @returns {AnyFetchedSeriesBlueprint[]}
 */
function createSingle30dChangeSeries(cohort) {
  return [
    baseline({
      metric: cohort.tree.realized.realizedCap30dDelta,
      name: "30d Change",
      unit: Unit.usd,
    }),
  ];
}

/**
 * Create valuation section for cohorts with full ratio patterns
 * (CohortAll, CohortFull, CohortWithPercentiles)
 * @param {{ cohort: CohortAll | CohortFull | CohortWithPercentiles, title: (metric: string) => string }} args
>>>>>>> 69eb58f7 (chore: update website from upstream v0.1.5)
 * @returns {PartialOptionsGroup}
 */
export function createValuationSectionFull({ cohort, title }) {
  const { tree, color } = cohort;
  return {
<<<<<<< HEAD
    name: "Capitalization",
    tree: [
      { name: "Total", title: title("Realized Cap"), bottom: [line({ series: tree.realized.cap.usd, name: "Realized Cap", color, unit: Unit.usd })] },
      {
        name: "Profitability",
        title: title("Invested Capital"),
        bottom: [
          line({ series: tree.realized.cap.usd, name: "Total", color: colors.default, unit: Unit.usd }),
          line({ series: tree.unrealized.investedCapital.inProfit.usd, name: "In Profit", color: colors.profit, unit: Unit.usd }),
          line({ series: tree.unrealized.investedCapital.inLoss.usd, name: "In Loss", color: colors.loss, unit: Unit.usd }),
        ],
      },
      { name: "MVRV", title: title("MVRV"), bottom: ratioBottomSeries(tree.realized.price) },
      ...singleDeltaItems(tree, title),
      { name: "% of Own Market Cap", title: title("Realized Cap (% of Own Market Cap)"), bottom: percentRatioBaseline({ pattern: tree.realized.cap.toOwnMcap, name: "% of Own Market Cap", color }) },
=======
    name: "Valuation",
    tree: [
      {
        name: "Realized Cap",
        title: title("Realized Cap"),
        bottom: [
          ...createSingleRealizedCapSeries(cohort),
          baseline({
            metric: tree.realized.realizedCapRelToOwnMarketCap,
            name: "Rel. to Own M.Cap",
            color,
            unit: Unit.pctOwnMcap,
          }),
        ],
      },
      {
        name: "30d Change",
        title: title("Realized Cap 30d Change"),
        bottom: createSingle30dChangeSeries(cohort),
      },
      createRatioChart({
        title,
        pricePattern: tree.realized.realizedPrice,
        ratio: tree.realized.realizedPriceExtra,
        color,
        name: "MVRV",
      }),
>>>>>>> 69eb58f7 (chore: update website from upstream v0.1.5)
    ],
  };
}

/**
<<<<<<< HEAD
 * Basic capitalization (no invested capital, simple MVRV)
 * @param {{ cohort: CohortWithAdjusted | CohortBasic | CohortAddr | CohortWithoutRelative, title: (name: string) => string }} args
 * @returns {PartialOptionsGroup}
 */
export function createValuationSection({ cohort, title }) {
  const { tree } = cohort;
  return {
    name: "Capitalization",
    tree: [
      { name: "Total", title: title("Realized Cap"), bottom: [line({ series: tree.realized.cap.usd, name: "Realized Cap", color: cohort.color, unit: Unit.usd })] },
      ...singleDeltaItems(tree, title),
      { name: "MVRV", title: title("MVRV"), bottom: [baseline({ series: tree.realized.mvrv, name: "MVRV", unit: Unit.ratio, base: 1 })] },
=======
 * Create valuation section for cohorts with basic ratio patterns
 * (CohortWithAdjusted, CohortBasic, CohortAddress, CohortWithoutRelative)
 * @param {{ cohort: CohortWithAdjusted | CohortBasic | CohortAddress | CohortWithoutRelative, title: (metric: string) => string }} args
 * @returns {PartialOptionsGroup}
 */
export function createValuationSection({ cohort, title }) {
  const { tree, color } = cohort;
  return {
    name: "Valuation",
    tree: [
      {
        name: "Realized Cap",
        title: title("Realized Cap"),
        bottom: createSingleRealizedCapSeries(cohort),
      },
      {
        name: "30d Change",
        title: title("Realized Cap 30d Change"),
        bottom: createSingle30dChangeSeries(cohort),
      },
      {
        name: "MVRV",
        title: title("MVRV"),
        bottom: [
          baseline({
            metric: tree.realized.realizedPriceExtra.ratio,
            name: "MVRV",
            color,
            unit: Unit.ratio,
            base: 1,
          }),
        ],
      },
>>>>>>> 69eb58f7 (chore: update website from upstream v0.1.5)
    ],
  };
}

<<<<<<< HEAD
// ============================================================================
// Grouped Cohort Sections
// ============================================================================

/**
 * @param {{ list: readonly (UtxoCohortObject | CohortWithoutRelative)[], all: CohortAll, title: (name: string) => string }} args
=======
/**
 * @param {{ list: readonly (UtxoCohortObject | CohortWithoutRelative)[], all: CohortAll, title: (metric: string) => string }} args
>>>>>>> 69eb58f7 (chore: update website from upstream v0.1.5)
 * @returns {PartialOptionsGroup}
 */
export function createGroupedValuationSection({ list, all, title }) {
  return {
<<<<<<< HEAD
    name: "Capitalization",
    tree: [
      {
        name: "Total",
        title: title("Realized Cap"),
        bottom: mapCohortsWithAll(list, all, ({ name, color, tree }) =>
          line({ series: tree.realized.cap.usd, name, color, unit: Unit.usd }),
        ),
      },
      ...groupedDeltaAndMvrv(list, all, title),
=======
    name: "Valuation",
    tree: [
      {
        name: "Realized Cap",
        title: title("Realized Cap"),
        bottom: mapCohortsWithAll(list, all, ({ name, color, tree }) =>
          line({
            metric: tree.realized.realizedCap,
            name,
            color,
            unit: Unit.usd,
          }),
        ),
      },
      {
        name: "30d Change",
        title: title("Realized Cap 30d Change"),
        bottom: mapCohortsWithAll(list, all, ({ name, color, tree }) =>
          baseline({
            metric: tree.realized.realizedCap30dDelta,
            name,
            color,
            unit: Unit.usd,
          }),
        ),
      },
      {
        name: "MVRV",
        title: title("MVRV"),
        bottom: mapCohortsWithAll(list, all, ({ name, color, tree }) =>
          baseline({
            metric: tree.realized.realizedPriceExtra.ratio,
            name,
            color,
            unit: Unit.ratio,
            base: 1,
          }),
        ),
      },
>>>>>>> 69eb58f7 (chore: update website from upstream v0.1.5)
    ],
  };
}

/**
<<<<<<< HEAD
 * @param {{ list: readonly (CohortAll | CohortFull | CohortLongTerm)[], all: CohortAll, title: (name: string) => string }} args
=======
 * @param {{ list: readonly (CohortAll | CohortFull | CohortWithPercentiles)[], all: CohortAll, title: (metric: string) => string }} args
>>>>>>> 69eb58f7 (chore: update website from upstream v0.1.5)
 * @returns {PartialOptionsGroup}
 */
export function createGroupedValuationSectionWithOwnMarketCap({ list, all, title }) {
  return {
<<<<<<< HEAD
    name: "Capitalization",
    tree: [
      {
        name: "Total",
        title: title("Realized Cap"),
        bottom: mapCohortsWithAll(list, all, ({ name, color, tree }) =>
          line({ series: tree.realized.cap.usd, name, color, unit: Unit.usd }),
        ),
      },
      {
        name: "In Profit",
        title: title("Invested Capital In Profit"),
        bottom: mapCohortsWithAll(list, all, ({ name, color, tree }) =>
          line({ series: tree.unrealized.investedCapital.inProfit.usd, name, color, unit: Unit.usd }),
        ),
      },
      {
        name: "In Loss",
        title: title("Invested Capital In Loss"),
        bottom: mapCohortsWithAll(list, all, ({ name, color, tree }) =>
          line({ series: tree.unrealized.investedCapital.inLoss.usd, name, color, unit: Unit.usd }),
        ),
      },
      ...groupedDeltaAndMvrv(list, all, title),
      {
        name: "% of Own Market Cap",
        title: title("Realized Cap (% of Own Market Cap)"),
        bottom: flatMapCohortsWithAll(list, all, ({ name, color, tree }) =>
          percentRatio({ pattern: tree.realized.cap.toOwnMcap, name, color }),
=======
    name: "Valuation",
    tree: [
      {
        name: "Realized Cap",
        title: title("Realized Cap"),
        bottom: [
          ...mapCohortsWithAll(list, all, ({ name, color, tree }) =>
            line({
              metric: tree.realized.realizedCap,
              name,
              color,
              unit: Unit.usd,
            }),
          ),
          ...mapCohortsWithAll(list, all, ({ name, color, tree }) =>
            baseline({
              metric: tree.realized.realizedCapRelToOwnMarketCap,
              name,
              color,
              unit: Unit.pctOwnMcap,
            }),
          ),
        ],
      },
      {
        name: "30d Change",
        title: title("Realized Cap 30d Change"),
        bottom: mapCohortsWithAll(list, all, ({ name, color, tree }) =>
          baseline({
            metric: tree.realized.realizedCap30dDelta,
            name,
            color,
            unit: Unit.usd,
          }),
        ),
      },
      {
        name: "MVRV",
        title: title("MVRV"),
        bottom: mapCohortsWithAll(list, all, ({ name, color, tree }) =>
          baseline({
            metric: tree.realized.realizedPriceExtra.ratio,
            name,
            color,
            unit: Unit.ratio,
            base: 1,
          }),
>>>>>>> 69eb58f7 (chore: update website from upstream v0.1.5)
        ),
      },
    ],
  };
}
