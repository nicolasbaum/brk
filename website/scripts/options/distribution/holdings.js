/**
 * Holdings section builders
 *
<<<<<<< HEAD
 * Supply pattern capabilities by cohort type:
 * - DeltaHalfInRelTotalPattern2 (STH/LTH): inProfit + inLoss + toCirculating + toOwn
 * - SeriesTree_Cohorts_Utxo_All_Supply (All): inProfit + inLoss + toOwn (no toCirculating)
 * - DeltaHalfInRelTotalPattern (AgeRange/MaxAge/Epoch): inProfit + inLoss + toCirculating (no toOwn)
 * - DeltaHalfInTotalPattern2 (Type.*): inProfit + inLoss (no rel)
 * - DeltaHalfTotalPattern (Empty/UtxoAmount/AddrAmount): total + half only
 */

import { Unit } from "../../utils/units.js";
import {
  ROLLING_WINDOWS,
  line,
  baseline,
  sumsTreeBaseline,
  rollingPercentRatioTree,
  percentRatio,
  percentRatioBaseline,
  chartsFromCount,
} from "../series.js";
import {
  satsBtcUsd,
  flatMapCohorts,
  mapCohortsWithAll,
  flatMapCohortsWithAll,
  groupedWindowsCumulative,
} from "../shared.js";
=======
 * Structure (Option C - optimized for UX):
 * - Supply: Total BTC held (flat, one click)
 * - UTXO Count: Number of UTXOs (flat, one click)
 * - Address Count: Number of addresses (when available, flat)
 * - 30d Changes/: Folder for change metrics
 *   - Supply: 30d supply change
 * - Relative: % of circulating supply (when available)
 *
 * Rationale: Most-used metrics (Supply, UTXO Count) are immediately accessible.
 * 30d changes are grouped together for consistency and cleaner navigation.
 */

import { Unit } from "../../utils/units.js";
import { line, baseline } from "../series.js";
import { satsBtcUsd, satsBtcUsdBaseline, mapCohorts, mapCohortsWithAll, flatMapCohortsWithAll } from "../shared.js";
>>>>>>> 69eb58f7 (chore: update website from upstream v0.1.5)
import { colors } from "../../utils/colors.js";
import { priceLines } from "../constants.js";

/**
<<<<<<< HEAD
 * Simple supply series (total + half only, no profit/loss)
 * @param {{ total: AnyValuePattern }} supply
 * @returns {AnyFetchedSeriesBlueprint[]}
 */
function simpleSupplySeries(supply) {
  return satsBtcUsd({
    pattern: supply.total,
    name: "Total",
  });
}

=======
 * Base supply series (total, profit, loss, halved)
 * @param {{ supply: { total: AnyValuePattern, halved: AnyValuePattern }, unrealized: { supplyInProfit: AnyValuePattern, supplyInLoss: AnyValuePattern } }} tree
 * @returns {AnyFetchedSeriesBlueprint[]}
 */
function baseSupplySeries(tree) {
  return [
    ...satsBtcUsd({ pattern: tree.supply.total, name: "Total", color: colors.default }),
    ...satsBtcUsd({ pattern: tree.unrealized.supplyInProfit, name: "In Profit", color: colors.profit }),
    ...satsBtcUsd({ pattern: tree.unrealized.supplyInLoss, name: "In Loss", color: colors.loss }),
    ...satsBtcUsd({ pattern: tree.supply.halved, name: "Halved", color: colors.gray, style: 4 }),
  ];
}

/**
 * % of Own Supply series (profit/loss relative to own supply)
 * @param {{ relative: { supplyInProfitRelToOwnSupply: AnyMetricPattern, supplyInLossRelToOwnSupply: AnyMetricPattern } }} tree
 * @returns {AnyFetchedSeriesBlueprint[]}
 */
function ownSupplyPctSeries(tree) {
  return [
    line({ metric: tree.relative.supplyInProfitRelToOwnSupply, name: "In Profit", color: colors.profit, unit: Unit.pctOwn }),
    line({ metric: tree.relative.supplyInLossRelToOwnSupply, name: "In Loss", color: colors.loss, unit: Unit.pctOwn }),
    ...priceLines({ numbers: [100, 50, 0], unit: Unit.pctOwn }),
  ];
}

/**
 * % of Circulating Supply series (total, profit, loss)
 * @param {{ relative: { supplyRelToCirculatingSupply: AnyMetricPattern, supplyInProfitRelToCirculatingSupply: AnyMetricPattern, supplyInLossRelToCirculatingSupply: AnyMetricPattern } }} tree
 * @returns {AnyFetchedSeriesBlueprint[]}
 */
function circulatingSupplyPctSeries(tree) {
  return [
    line({ metric: tree.relative.supplyRelToCirculatingSupply, name: "Total", color: colors.default, unit: Unit.pctSupply }),
    line({ metric: tree.relative.supplyInProfitRelToCirculatingSupply, name: "In Profit", color: colors.profit, unit: Unit.pctSupply }),
    line({ metric: tree.relative.supplyInLossRelToCirculatingSupply, name: "In Loss", color: colors.loss, unit: Unit.pctSupply }),
  ];
}
>>>>>>> 69eb58f7 (chore: update website from upstream v0.1.5)

/**
 * @param {readonly (UtxoCohortObject | CohortWithoutRelative)[]} list
 * @param {CohortAll} all
<<<<<<< HEAD
 * @param {(name: string) => string} title
 */
function groupedOutputsFolder(list, all, title) {
  return {
    name: "Outputs",
    tree: [
      {
        name: "Unspent",
        tree: [
          {
            name: "Count",
            title: title("UTXO Count"),
            bottom: mapCohortsWithAll(list, all, ({ name, color, tree }) =>
              line({ series: tree.outputs.unspentCount.base, name, color, unit: Unit.count }),
            ),
          },
          ...groupedDeltaItems(list, all, (c) => c.tree.outputs.unspentCount.delta, Unit.count, title, "UTXO Count"),
        ],
      },
      {
        name: "Spent",
        tree: groupedWindowsCumulative({
          list, all, title, metricTitle: "Spent UTXO Count",
          getWindowSeries: (c, key) => c.tree.outputs.spentCount.sum[key],
          getCumulativeSeries: (c) => c.tree.outputs.spentCount.cumulative,
          seriesFn: line, unit: Unit.count,
        }),
      },
      {
        name: "Spending Rate",
        title: title("Spending Rate"),
        bottom: mapCohortsWithAll(list, all, ({ name, color, tree }) =>
          line({ series: tree.outputs.spendingRate, name, color, unit: Unit.ratio }),
        ),
      },
=======
 * @param {(metric: string) => string} title
 */
function groupedUtxoCountChart(list, all, title) {
  return {
    name: "UTXO Count",
    title: title("UTXO Count"),
    bottom: mapCohortsWithAll(list, all, ({ name, color, tree }) =>
      line({ metric: tree.outputs.utxoCount, name, color, unit: Unit.count }),
    ),
  };
}

/**
 * @param {readonly (UtxoCohortObject | CohortWithoutRelative)[]} list
 * @param {CohortAll} all
 * @param {(metric: string) => string} title
 */
function grouped30dSupplyChangeChart(list, all, title) {
  return {
    name: "Supply",
    title: title("Supply 30d Change"),
    bottom: flatMapCohortsWithAll(list, all, ({ name, color, tree }) =>
      satsBtcUsdBaseline({ pattern: tree.supply._30dChange, name, color }),
    ),
  };
}

/**
 * @param {readonly (UtxoCohortObject | CohortWithoutRelative)[]} list
 * @param {CohortAll} all
 * @param {(metric: string) => string} title
 */
function grouped30dUtxoCountChangeChart(list, all, title) {
  return {
    name: "UTXO Count",
    title: title("UTXO Count 30d Change"),
    bottom: mapCohortsWithAll(list, all, ({ name, color, tree }) =>
      baseline({ metric: tree.outputs.utxoCount30dChange, name, unit: Unit.count, color }),
    ),
  };
}

/**
 * Single cohort UTXO count chart
 * @param {UtxoCohortObject | CohortWithoutRelative} cohort
 * @param {(metric: string) => string} title
 * @returns {PartialChartOption}
 */
function singleUtxoCountChart(cohort, title) {
  return {
    name: "UTXO Count",
    title: title("UTXO Count"),
    bottom: createSingleUtxoCountSeries(cohort),
  };
}

/**
 * Single cohort 30d supply change chart
 * @param {UtxoCohortObject | CohortWithoutRelative} cohort
 * @param {(metric: string) => string} title
 * @returns {PartialChartOption}
 */
function single30dSupplyChangeChart(cohort, title) {
  return {
    name: "Supply",
    title: title("Supply 30d Change"),
    bottom: createSingle30dChangeSeries(cohort),
  };
}

/**
 * Single cohort 30d UTXO count change chart
 * @param {UtxoCohortObject | CohortWithoutRelative} cohort
 * @param {(metric: string) => string} title
 * @returns {PartialChartOption}
 */
function single30dUtxoCountChangeChart(cohort, title) {
  return {
    name: "UTXO Count",
    title: title("UTXO Count 30d Change"),
    bottom: createSingleUtxoCount30dChangeSeries(cohort),
  };
}

/**
 * Single cohort address count chart
 * @param {CohortAll | CohortAddress} cohort
 * @param {(metric: string) => string} title
 * @returns {PartialChartOption}
 */
function singleAddressCountChart(cohort, title) {
  return {
    name: "Address Count",
    title: title("Address Count"),
    bottom: [
      line({ metric: cohort.addrCount.count, name: "Address Count", color: cohort.color, unit: Unit.count }),
>>>>>>> 69eb58f7 (chore: update website from upstream v0.1.5)
    ],
  };
}

/**
<<<<<<< HEAD
 * @param {{ absolute: { _24h: AnySeriesPattern, _1w: AnySeriesPattern, _1m: AnySeriesPattern, _1y: AnySeriesPattern }, rate: { _24h: { percent: AnySeriesPattern, ratio: AnySeriesPattern }, _1w: { percent: AnySeriesPattern, ratio: AnySeriesPattern }, _1m: { percent: AnySeriesPattern, ratio: AnySeriesPattern }, _1y: { percent: AnySeriesPattern, ratio: AnySeriesPattern } } }} delta
 * @param {Unit} unit
 * @param {(name: string) => string} title
 * @param {string} name
 * @returns {PartialOptionsTree}
 */
function singleDeltaItems(delta, unit, title, name) {
  return [
    {
      ...sumsTreeBaseline({
        windows: delta.absolute,
        title,
        metric: `${name} Change`,
        unit,
        legend: "Change",
      }),
      name: "Change",
    },
    {
      ...rollingPercentRatioTree({
        windows: delta.rate,
        title,
        metric: `${name} Growth Rate`,
      }),
      name: "Growth Rate",
    },
=======
 * Single cohort 30d address count change chart
 * @param {CohortAll | CohortAddress} cohort
 * @param {(metric: string) => string} title
 * @returns {PartialChartOption}
 */
function single30dAddressCountChangeChart(cohort, title) {
  return {
    name: "Address Count",
    title: title("Address Count 30d Change"),
    bottom: createSingleAddrCount30dChangeSeries(cohort),
  };
}

/**
 * @param {UtxoCohortObject | CohortWithoutRelative} cohort
 * @returns {AnyFetchedSeriesBlueprint[]}
 */
function createSingleSupplySeries(cohort) {
  return baseSupplySeries(cohort.tree);
}

/**
 * Supply series for CohortAll (has % of Own Supply but not % of Circulating)
 * @param {CohortAll} cohort
 * @returns {AnyFetchedSeriesBlueprint[]}
 */
function createSingleSupplySeriesAll(cohort) {
  return [...baseSupplySeries(cohort.tree), ...ownSupplyPctSeries(cohort.tree)];
}

/**
 * @param {UtxoCohortObject | CohortWithoutRelative} cohort
 * @returns {AnyFetchedSeriesBlueprint[]}
 */
function createSingle30dChangeSeries(cohort) {
  return satsBtcUsdBaseline({
    pattern: cohort.tree.supply._30dChange,
    name: "30d Change",
  });
}

/**
 * @param {UtxoCohortObject | CohortWithoutRelative} cohort
 * @returns {AnyFetchedSeriesBlueprint[]}
 */
function createSingleUtxoCountSeries(cohort) {
  const { color, tree } = cohort;
  return [
    line({
      metric: tree.outputs.utxoCount,
      name: "UTXO Count",
      color,
      unit: Unit.count,
    }),
>>>>>>> 69eb58f7 (chore: update website from upstream v0.1.5)
  ];
}

/**
<<<<<<< HEAD
 * @template {{ name: string, color: Color }} T
 * @template {{ name: string, color: Color }} A
 * @param {readonly T[]} list
 * @param {A} all
 * @param {(c: T | A) => DeltaPattern} getDelta
 * @param {Unit} unit
 * @param {(name: string) => string} title
 * @param {string} name
 * @returns {PartialOptionsTree}
 */
function groupedDeltaItems(list, all, getDelta, unit, title, name) {
  return [
      {
        name: "Change",
        tree: ROLLING_WINDOWS.map((w) => ({
          name: w.name,
          title: title(`${w.title} ${name} Change`),
          bottom: mapCohortsWithAll(list, all, (c) =>
            baseline({
              series: getDelta(c).absolute[w.key],
              name: c.name,
              color: c.color,
              unit,
            }),
          ),
        })),
      },
      {
        name: "Growth Rate",
        tree: ROLLING_WINDOWS.map((w) => ({
          name: w.name,
          title: title(`${w.title} ${name} Growth Rate`),
          bottom: flatMapCohortsWithAll(list, all, (c) =>
            percentRatioBaseline({
              pattern: getDelta(c).rate[w.key],
              name: c.name,
              color: c.color,
            }),
          ),
        })),
      },
  ];
}

// ============================================================================
// Single Cohort Composable Builders
// ============================================================================

/**
 * Profitability chart (in profit + in loss supply)
 * @param {{ total: AnyValuePattern, half: AnyValuePattern, inProfit: AnyValuePattern, inLoss: AnyValuePattern }} supply
 * @param {(name: string) => string} title
 * @returns {PartialChartOption}
 */
function profitabilityChart(supply, title) {
  return {
    name: "Profitability",
    title: title("Supply Profitability"),
    bottom: [
      ...satsBtcUsd({
        pattern: supply.total,
        name: "Total",
        color: colors.default,
      }),
      ...satsBtcUsd({
        pattern: supply.inProfit,
        name: "In Profit",
        color: colors.profit,
      }),
      ...satsBtcUsd({
        pattern: supply.inLoss,
        name: "In Loss",
        color: colors.loss,
      }),
      ...satsBtcUsd({
        pattern: supply.half,
        name: "Halved",
        color: colors.gray,
        style: 4,
      }),
    ],
  };
}

/**
 * @param {{ toCirculating: PercentRatioPattern, inProfit: { toCirculating: PercentRatioPattern }, inLoss: { toCirculating: PercentRatioPattern } }} supply
 * @param {(name: string) => string} title
 * @returns {PartialChartOption}
 */
function circulatingChart(supply, title) {
  return {
    name: "% of Circulating",
    title: title("Supply (% of Circulating)"),
    bottom: [
      ...percentRatio({ pattern: supply.toCirculating, name: "Total", color: colors.default }),
      ...percentRatio({ pattern: supply.inProfit.toCirculating, name: "In Profit", color: colors.profit }),
      ...percentRatio({ pattern: supply.inLoss.toCirculating, name: "In Loss", color: colors.loss }),
    ],
  };
}

/**
 * @param {{ inProfit: { toOwn: { percent: AnySeriesPattern, ratio: AnySeriesPattern } }, inLoss: { toOwn: { percent: AnySeriesPattern, ratio: AnySeriesPattern } } }} supply
 * @param {(name: string) => string} title
 * @returns {PartialChartOption}
 */
function ownSupplyChart(supply, title) {
  return {
    name: "% of Own Supply",
    title: title("Supply (% of Own)"),
    bottom: [
      ...percentRatio({ pattern: supply.inProfit.toOwn, name: "In Profit", color: colors.profit }),
      ...percentRatio({ pattern: supply.inLoss.toOwn, name: "In Loss", color: colors.loss }),
      ...priceLines({ numbers: [100, 50, 0], unit: Unit.percentage }),
    ],
  };
}

/**
 * @param {OutputsPattern} outputs
 * @param {Color} color
 * @param {(name: string) => string} title
 * @returns {PartialOptionsGroup}
 */
function outputsFolder(outputs, color, title) {
  return {
    name: "Outputs",
    tree: [
      countFolder(outputs.unspentCount, "Unspent", "UTXO Count", color, title),
      {
        name: "Spent",
        tree: chartsFromCount({ pattern: outputs.spentCount, title, metric: "Spent UTXO Count", unit: Unit.count, color }),
      },
      {
        name: "Spending Rate",
        title: title("Spending Rate"),
        bottom: [
          line({ series: outputs.spendingRate, name: "Rate", color, unit: Unit.ratio }),
        ],
      },
    ],
  };
}

/**
 * @param {{ base: AnySeriesPattern, delta: DeltaPattern }} pattern
 * @param {string} name
 * @param {string} chartTitle
 * @param {Color} color
 * @param {(name: string) => string} title
 * @returns {PartialOptionsGroup}
 */
function countFolder(pattern, name, chartTitle, color, title) {
  return {
    name,
    tree: [
      {
        name: "Count",
        title: title(chartTitle),
        bottom: [
          line({
            series: pattern.base,
            name: "Count",
            color,
            unit: Unit.count,
          }),
        ],
      },
      ...singleDeltaItems(pattern.delta, Unit.count, title, chartTitle),
    ],
  };
}

// ============================================================================
// Single Cohort Holdings Sections
// ============================================================================

/**
 * @param {{ cohort: UtxoCohortObject | CohortWithoutRelative, title: (name: string) => string }} args
 * @returns {PartialOptionsTree}
 */
export function createHoldingsSection({ cohort, title }) {
  const { supply } = cohort.tree;
  return [
    {
      name: "Supply",
      tree: [
        {
          name: "Total",
          title: title("Supply"),
          bottom: simpleSupplySeries(supply),
        },
        ...singleDeltaItems(supply.delta, Unit.sats, title, "Supply"),
      ],
    },
    outputsFolder(cohort.tree.outputs, cohort.color, title),
  ];
}

/**
 * @param {{ cohort: CohortAll, title: (name: string) => string }} args
 * @returns {PartialOptionsTree}
 */
export function createHoldingsSectionAll({ cohort, title }) {
  const { supply } = cohort.tree;
  return [
    {
      name: "Supply",
      tree: [
        {
          name: "Total",
          title: title("Supply"),
          bottom: simpleSupplySeries(supply),
        },
        profitabilityChart(supply, title),
        ownSupplyChart(supply, title),
        ...singleDeltaItems(supply.delta, Unit.sats, title, "Supply"),
      ],
    },
    outputsFolder(cohort.tree.outputs, cohort.color, title),
    countFolder(cohort.addressCount, "Addresses", "Address Count", cohort.color, title),
  ];
}

/**
 * @param {{ cohort: CohortFull | CohortLongTerm, title: (name: string) => string }} args
 * @returns {PartialOptionsTree}
 */
export function createHoldingsSectionWithRelative({ cohort, title }) {
  const { supply } = cohort.tree;
  return [
    {
      name: "Supply",
      tree: [
        {
          name: "Total",
          title: title("Supply"),
          bottom: simpleSupplySeries(supply),
        },
        profitabilityChart(supply, title),
        circulatingChart(supply, title),
        ownSupplyChart(supply, title),
        ...singleDeltaItems(supply.delta, Unit.sats, title, "Supply"),
      ],
    },
    outputsFolder(cohort.tree.outputs, cohort.color, title),
  ];
}

/**
 * @param {{ cohort: CohortWithAdjusted | CohortAgeRange, title: (name: string) => string }} args
 * @returns {PartialOptionsTree}
 */
export function createHoldingsSectionWithOwnSupply({ cohort, title }) {
  const { supply } = cohort.tree;
  return [
    {
      name: "Supply",
      tree: [
        {
          name: "Total",
          title: title("Supply"),
          bottom: simpleSupplySeries(supply),
        },
        profitabilityChart(supply, title),
        circulatingChart(supply, title),
        ...singleDeltaItems(supply.delta, Unit.sats, title, "Supply"),
      ],
    },
    outputsFolder(cohort.tree.outputs, cohort.color, title),
  ];
}

/**
 * @param {{ cohort: CohortWithoutRelative, title: (name: string) => string }} args
 * @returns {PartialOptionsTree}
 */
export function createHoldingsSectionWithProfitLoss({ cohort, title }) {
  const { supply } = cohort.tree;
  return [
    {
      name: "Supply",
      tree: [
        {
          name: "Total",
          title: title("Supply"),
          bottom: simpleSupplySeries(supply),
        },
        profitabilityChart(supply, title),
        ...singleDeltaItems(supply.delta, Unit.sats, title, "Supply"),
      ],
    },
    outputsFolder(cohort.tree.outputs, cohort.color, title),
  ];
}

/**
 * @param {{ cohort: CohortAddr, title: (name: string) => string }} args
 * @returns {PartialOptionsTree}
 */
export function createHoldingsSectionAddress({ cohort, title }) {
  const { supply } = cohort.tree;
  return [
    {
      name: "Supply",
      tree: [
        {
          name: "Total",
          title: title("Supply"),
          bottom: simpleSupplySeries(supply),
        },
        profitabilityChart(supply, title),
        ...singleDeltaItems(supply.delta, Unit.sats, title, "Supply"),
      ],
    },
    outputsFolder(cohort.tree.outputs, cohort.color, title),
    countFolder(cohort.addressCount, "Addresses", "Address Count", cohort.color, title),
  ];
}

/**
 * @param {{ cohort: AddrCohortObject, title: (name: string) => string }} args
 * @returns {PartialOptionsTree}
 */
export function createHoldingsSectionAddressAmount({ cohort, title }) {
  const { supply } = cohort.tree;
  return [
    {
      name: "Supply",
      tree: [
        {
          name: "Total",
          title: title("Supply"),
          bottom: simpleSupplySeries(supply),
        },
        ...singleDeltaItems(supply.delta, Unit.sats, title, "Supply"),
      ],
    },
    outputsFolder(cohort.tree.outputs, cohort.color, title),
    countFolder(cohort.addressCount, "Addresses", "Address Count", cohort.color, title),
  ];
}

// ============================================================================
// Grouped Cohort Supply Helpers
// ============================================================================

/**
 * @template {{ name: string, color: Color, tree: { supply: { total: AnyValuePattern } } }} T
 * @param {readonly T[]} list
 * @param {CohortAll} all
 * @param {(name: string) => string} title
 * @returns {PartialChartOption}
 */
function groupedSupplyTotal(list, all, title) {
  return { name: "Total", title: title("Supply"), bottom: flatMapCohortsWithAll(list, all, ({ name, color, tree }) => satsBtcUsd({ pattern: tree.supply.total, name, color })) };
}

/**
 * @template {{ name: string, color: Color, tree: { supply: { inProfit: AnyValuePattern, inLoss: AnyValuePattern } } }} T
 * @param {readonly T[]} list
 * @param {CohortAll} all
 * @param {(name: string) => string} title
 * @returns {PartialOptionsTree}
 */
function groupedSupplyProfitLoss(list, all, title) {
  return [
    { name: "In Profit", title: title("Supply In Profit"), bottom: flatMapCohortsWithAll(list, all, ({ name, color, tree }) => satsBtcUsd({ pattern: tree.supply.inProfit, name, color })) },
    { name: "In Loss", title: title("Supply In Loss"), bottom: flatMapCohortsWithAll(list, all, ({ name, color, tree }) => satsBtcUsd({ pattern: tree.supply.inLoss, name, color })) },
  ];
}

// ============================================================================
// Grouped Cohort Holdings Sections
// ============================================================================

/**
 * @param {{ list: readonly CohortAddr[], all: CohortAll, title: (name: string) => string }} args
 * @returns {PartialOptionsTree}
 */
export function createGroupedHoldingsSectionAddress({ list, all, title }) {
  return [
    {
      name: "Supply",
      tree: [
        groupedSupplyTotal(list, all, title),
        ...groupedSupplyProfitLoss(list, all, title),
        ...groupedDeltaItems(list, all, (c) => c.tree.supply.delta, Unit.sats, title, "Supply"),
      ],
    },
    groupedOutputsFolder(list, all, title),
    {
      name: "Addresses",
      tree: [
        {
          name: "Count",
          title: title("Address Count"),
          bottom: mapCohortsWithAll(list, all, ({ name, color, addressCount }) =>
            line({ series: addressCount.base, name, color, unit: Unit.count }),
          ),
        },
        ...groupedDeltaItems(list, all, (c) => c.addressCount.delta, Unit.count, title, "Address Count"),
      ],
    },
  ];
}

/**
 * Grouped holdings for address amount cohorts (no inProfit/inLoss, has address count)
 * @param {{ list: readonly AddrCohortObject[], all: CohortAll, title: (name: string) => string }} args
 * @returns {PartialOptionsTree}
 */
export function createGroupedHoldingsSectionAddressAmount({ list, all, title }) {
  return [
    {
      name: "Supply",
      tree: [
        groupedSupplyTotal(list, all, title),
        ...groupedDeltaItems(list, all, (c) => c.tree.supply.delta, Unit.sats, title, "Supply"),
      ],
    },
    groupedOutputsFolder(list, all, title),
    {
      name: "Addresses",
      tree: [
        {
          name: "Count",
          title: title("Address Count"),
          bottom: mapCohortsWithAll(list, all, ({ name, color, addressCount }) =>
            line({ series: addressCount.base, name, color, unit: Unit.count }),
          ),
        },
        ...groupedDeltaItems(list, all, (c) => c.addressCount.delta, Unit.count, title, "Address Count"),
      ],
    },
  ];
}

/** @param {{ list: readonly (UtxoCohortObject | CohortWithoutRelative)[], all: CohortAll, title: (name: string) => string }} args */
export function createGroupedHoldingsSection({ list, all, title }) {
  return [
    {
      name: "Supply",
      tree: [
        groupedSupplyTotal(list, all, title),
        ...groupedDeltaItems(list, all, (c) => c.tree.supply.delta, Unit.sats, title, "Supply"),
      ],
    },
    groupedOutputsFolder(list, all, title),
  ];
}

/** @param {{ list: readonly CohortWithoutRelative[], all: CohortAll, title: (name: string) => string }} args */
export function createGroupedHoldingsSectionWithProfitLoss({ list, all, title }) {
  return [
    {
      name: "Supply",
      tree: [
        groupedSupplyTotal(list, all, title),
        ...groupedSupplyProfitLoss(list, all, title),
        ...groupedDeltaItems(list, all, (c) => c.tree.supply.delta, Unit.sats, title, "Supply"),
      ],
    },
    groupedOutputsFolder(list, all, title),
  ];
}

/** @param {{ list: readonly (CohortWithAdjusted | CohortAgeRange)[], all: CohortAll, title: (name: string) => string }} args */
export function createGroupedHoldingsSectionWithOwnSupply({ list, all, title }) {
  return [
    {
      name: "Supply",
      tree: [
        groupedSupplyTotal(list, all, title),
        ...groupedSupplyProfitLoss(list, all, title),
        { name: "% of Circulating", title: title("Supply (% of Circulating)"), bottom: flatMapCohorts(list, ({ name, color, tree }) => percentRatio({ pattern: tree.supply.toCirculating, name, color })) },
        ...groupedDeltaItems(list, all, (c) => c.tree.supply.delta, Unit.sats, title, "Supply"),
      ],
    },
    groupedOutputsFolder(list, all, title),
  ];
}

/**
 * Grouped holdings with full relative series (toCirculating + toOwn)
 * For: CohortFull, CohortLongTerm
 * @param {{ list: readonly (CohortFull | CohortLongTerm)[], all: CohortAll, title: (name: string) => string }} args
 * @returns {PartialOptionsTree}
 */
export function createGroupedHoldingsSectionWithRelative({ list, all, title }) {
  return [
    {
      name: "Supply",
      tree: [
        groupedSupplyTotal(list, all, title),
        ...groupedSupplyProfitLoss(list, all, title),
        { name: "% of Circulating", title: title("Supply (% of Circulating)"), bottom: flatMapCohorts(list, ({ name, color, tree }) => percentRatio({ pattern: tree.supply.toCirculating, name, color })) },
        { name: "% of Own Supply", title: title("Supply (% of Own)"), bottom: mapCohortsWithAll(list, all, ({ name, color, tree }) => line({ series: tree.supply.inProfit.toOwn.percent, name, color, unit: Unit.percentage })) },
        ...groupedDeltaItems(list, all, (c) => c.tree.supply.delta, Unit.sats, title, "Supply"),
      ],
    },
    groupedOutputsFolder(list, all, title),
  ];
=======
 * @param {UtxoCohortObject | CohortWithoutRelative} cohort
 * @returns {AnyFetchedSeriesBlueprint[]}
 */
function createSingleUtxoCount30dChangeSeries(cohort) {
  return [
    baseline({
      metric: cohort.tree.outputs.utxoCount30dChange,
      name: "30d Change",
      unit: Unit.count,
    }),
  ];
}

/**
 * @param {CohortAll | CohortAddress} cohort
 * @returns {AnyFetchedSeriesBlueprint[]}
 */
function createSingleAddrCount30dChangeSeries(cohort) {
  return [
    baseline({
      metric: cohort.addrCount._30dChange,
      name: "30d Change",
      unit: Unit.count,
    }),
  ];
}

/**
 * Create supply series with % of Circulating (for cohorts with relative data)
 * @param {CohortFull | CohortWithAdjusted | CohortBasicWithMarketCap | CohortMinAge} cohort
 * @returns {AnyFetchedSeriesBlueprint[]}
 */
function createSingleSupplySeriesWithRelative(cohort) {
  const { tree } = cohort;
  return [
    ...baseSupplySeries(tree),
    ...circulatingSupplyPctSeries(tree),
    ...ownSupplyPctSeries(tree),
  ];
}

/**
 * Supply series with % of Own Supply only (for cohorts without % of Circulating)
 * Note: Different order - profit/loss before total for visual emphasis
 * @param {CohortAgeRange | CohortBasicWithoutMarketCap} cohort
 * @returns {AnyFetchedSeriesBlueprint[]}
 */
function createSingleSupplySeriesWithOwnSupply(cohort) {
  const { tree } = cohort;
  return [
    ...satsBtcUsd({ pattern: tree.unrealized.supplyInProfit, name: "In Profit", color: colors.profit }),
    ...satsBtcUsd({ pattern: tree.unrealized.supplyInLoss, name: "In Loss", color: colors.loss }),
    ...satsBtcUsd({ pattern: tree.supply.total, name: "Total", color: colors.default }),
    ...satsBtcUsd({ pattern: tree.supply.halved, name: "Halved", color: colors.gray, style: 4 }),
    ...ownSupplyPctSeries(tree),
  ];
}

/**
 * @param {{ cohort: UtxoCohortObject | CohortWithoutRelative, title: (metric: string) => string }} args
 * @returns {PartialOptionsGroup}
 */
export function createHoldingsSection({ cohort, title }) {
  return {
    name: "Holdings",
    tree: [
      {
        name: "Supply",
        title: title("Supply"),
        bottom: createSingleSupplySeries(cohort),
      },
      singleUtxoCountChart(cohort, title),
      {
        name: "30d Changes",
        tree: [
          single30dSupplyChangeChart(cohort, title),
          single30dUtxoCountChangeChart(cohort, title),
        ],
      },
    ],
  };
}

/**
 * Holdings section with % of Own Supply only (for cohorts without % of Circulating)
 * @param {{ cohort: CohortAgeRange | CohortBasicWithoutMarketCap, title: (metric: string) => string }} args
 * @returns {PartialOptionsGroup}
 */
export function createHoldingsSectionWithOwnSupply({ cohort, title }) {
  return {
    name: "Holdings",
    tree: [
      {
        name: "Supply",
        title: title("Supply"),
        bottom: createSingleSupplySeriesWithOwnSupply(cohort),
      },
      singleUtxoCountChart(cohort, title),
      {
        name: "30d Changes",
        tree: [
          single30dSupplyChangeChart(cohort, title),
          single30dUtxoCountChangeChart(cohort, title),
        ],
      },
    ],
  };
}

/**
 * @param {{ cohort: CohortFull | CohortWithAdjusted | CohortBasicWithMarketCap | CohortMinAge, title: (metric: string) => string }} args
 * @returns {PartialOptionsGroup}
 */
export function createHoldingsSectionWithRelative({ cohort, title }) {
  return {
    name: "Holdings",
    tree: [
      {
        name: "Supply",
        title: title("Supply"),
        bottom: createSingleSupplySeriesWithRelative(cohort),
      },
      singleUtxoCountChart(cohort, title),
      {
        name: "30d Changes",
        tree: [
          single30dSupplyChangeChart(cohort, title),
          single30dUtxoCountChangeChart(cohort, title),
        ],
      },
    ],
  };
}

/**
 * @param {{ cohort: CohortAll, title: (metric: string) => string }} args
 * @returns {PartialOptionsGroup}
 */
export function createHoldingsSectionAll({ cohort, title }) {
  return {
    name: "Holdings",
    tree: [
      {
        name: "Supply",
        title: title("Supply"),
        bottom: createSingleSupplySeriesAll(cohort),
      },
      singleUtxoCountChart(cohort, title),
      singleAddressCountChart(cohort, title),
      {
        name: "30d Changes",
        tree: [
          single30dSupplyChangeChart(cohort, title),
          single30dUtxoCountChangeChart(cohort, title),
          single30dAddressCountChangeChart(cohort, title),
        ],
      },
    ],
  };
}

/**
 * @param {{ cohort: CohortAddress, title: (metric: string) => string }} args
 * @returns {PartialOptionsGroup}
 */
export function createHoldingsSectionAddress({ cohort, title }) {
  return {
    name: "Holdings",
    tree: [
      {
        name: "Supply",
        title: title("Supply"),
        bottom: createSingleSupplySeriesWithOwnSupply(cohort),
      },
      singleUtxoCountChart(cohort, title),
      singleAddressCountChart(cohort, title),
      {
        name: "30d Changes",
        tree: [
          single30dSupplyChangeChart(cohort, title),
          single30dUtxoCountChangeChart(cohort, title),
          single30dAddressCountChangeChart(cohort, title),
        ],
      },
    ],
  };
}

/**
 * Holdings section for address amount cohorts (has relative supply + address count)
 * @param {{ cohort: AddressCohortObject, title: (metric: string) => string }} args
 * @returns {PartialOptionsGroup}
 */
export function createHoldingsSectionAddressAmount({ cohort, title }) {
  return {
    name: "Holdings",
    tree: [
      {
        name: "Supply",
        title: title("Supply"),
        bottom: createSingleSupplySeriesWithRelative(cohort),
      },
      singleUtxoCountChart(cohort, title),
      singleAddressCountChart(cohort, title),
      {
        name: "30d Changes",
        tree: [
          single30dSupplyChangeChart(cohort, title),
          single30dUtxoCountChangeChart(cohort, title),
          single30dAddressCountChangeChart(cohort, title),
        ],
      },
    ],
  };
}

/**
 * @param {{ list: readonly CohortAddress[], all: CohortAll, title: (metric: string) => string }} args
 * @returns {PartialOptionsGroup}
 */
export function createGroupedHoldingsSectionAddress({ list, all, title }) {
  return {
    name: "Holdings",
    tree: [
      {
        name: "Supply",
        tree: [
          {
            name: "Total",
            title: title("Supply"),
            bottom: flatMapCohortsWithAll(list, all, ({ name, color, tree }) =>
              satsBtcUsd({ pattern: tree.supply.total, name, color }),
            ),
          },
          {
            name: "In Profit",
            title: title("Supply In Profit"),
            bottom: [
              ...flatMapCohortsWithAll(list, all, ({ name, color, tree }) =>
                satsBtcUsd({
                  pattern: tree.unrealized.supplyInProfit,
                  name,
                  color,
                }),
              ),
              ...mapCohortsWithAll(list, all, ({ name, color, tree }) =>
                line({
                  metric: tree.relative.supplyInProfitRelToOwnSupply,
                  name,
                  color,
                  unit: Unit.pctOwn,
                }),
              ),
              ...priceLines({ numbers: [100, 50, 0], unit: Unit.pctOwn }),
            ],
          },
          {
            name: "In Loss",
            title: title("Supply In Loss"),
            bottom: [
              ...flatMapCohortsWithAll(list, all, ({ name, color, tree }) =>
                satsBtcUsd({
                  pattern: tree.unrealized.supplyInLoss,
                  name,
                  color,
                }),
              ),
              ...mapCohortsWithAll(list, all, ({ name, color, tree }) =>
                line({
                  metric: tree.relative.supplyInLossRelToOwnSupply,
                  name,
                  color,
                  unit: Unit.pctOwn,
                }),
              ),
              ...priceLines({ numbers: [100, 50, 0], unit: Unit.pctOwn }),
            ],
          },
        ],
      },
      groupedUtxoCountChart(list, all, title),
      {
        name: "Address Count",
        title: title("Address Count"),
        bottom: mapCohortsWithAll(list, all, ({ name, color, addrCount }) =>
          line({ metric: addrCount.count, name, color, unit: Unit.count }),
        ),
      },
      {
        name: "30d Changes",
        tree: [
          grouped30dSupplyChangeChart(list, all, title),
          grouped30dUtxoCountChangeChart(list, all, title),
          {
            name: "Address Count",
            title: title("Address Count 30d Change"),
            bottom: mapCohortsWithAll(list, all, ({ name, color, addrCount }) =>
              baseline({ metric: addrCount._30dChange, name, unit: Unit.count, color }),
            ),
          },
        ],
      },
    ],
  };
}

/**
 * Grouped holdings section for address amount cohorts (has relative supply + address count)
 * @param {{ list: readonly AddressCohortObject[], all: CohortAll, title: (metric: string) => string }} args
 * @returns {PartialOptionsGroup}
 */
export function createGroupedHoldingsSectionAddressAmount({ list, all, title }) {
  return {
    name: "Holdings",
    tree: [
      {
        name: "Supply",
        tree: [
          {
            name: "Total",
            title: title("Supply"),
            bottom: [
              ...flatMapCohortsWithAll(list, all, ({ name, color, tree }) =>
                satsBtcUsd({ pattern: tree.supply.total, name, color }),
              ),
              ...mapCohorts(list, ({ name, color, tree }) =>
                line({
                  metric: tree.relative.supplyRelToCirculatingSupply,
                  name,
                  color,
                  unit: Unit.pctSupply,
                }),
              ),
            ],
          },
          {
            name: "In Profit",
            title: title("Supply In Profit"),
            bottom: [
              ...flatMapCohortsWithAll(list, all, ({ name, color, tree }) =>
                satsBtcUsd({
                  pattern: tree.unrealized.supplyInProfit,
                  name,
                  color,
                }),
              ),
              ...mapCohorts(list, ({ name, color, tree }) =>
                line({
                  metric: tree.relative.supplyInProfitRelToCirculatingSupply,
                  name,
                  color,
                  unit: Unit.pctSupply,
                }),
              ),
              ...mapCohortsWithAll(list, all, ({ name, color, tree }) =>
                line({
                  metric: tree.relative.supplyInProfitRelToOwnSupply,
                  name,
                  color,
                  unit: Unit.pctOwn,
                }),
              ),
              ...priceLines({ numbers: [100, 50, 0], unit: Unit.pctOwn }),
            ],
          },
          {
            name: "In Loss",
            title: title("Supply In Loss"),
            bottom: [
              ...flatMapCohortsWithAll(list, all, ({ name, color, tree }) =>
                satsBtcUsd({
                  pattern: tree.unrealized.supplyInLoss,
                  name,
                  color,
                }),
              ),
              ...mapCohorts(list, ({ name, color, tree }) =>
                line({
                  metric: tree.relative.supplyInLossRelToCirculatingSupply,
                  name,
                  color,
                  unit: Unit.pctSupply,
                }),
              ),
              ...mapCohortsWithAll(list, all, ({ name, color, tree }) =>
                line({
                  metric: tree.relative.supplyInLossRelToOwnSupply,
                  name,
                  color,
                  unit: Unit.pctOwn,
                }),
              ),
              ...priceLines({ numbers: [100, 50, 0], unit: Unit.pctOwn }),
            ],
          },
        ],
      },
      groupedUtxoCountChart(list, all, title),
      {
        name: "Address Count",
        title: title("Address Count"),
        bottom: mapCohortsWithAll(list, all, ({ name, color, addrCount }) =>
          line({ metric: addrCount.count, name, color, unit: Unit.count }),
        ),
      },
      {
        name: "30d Changes",
        tree: [
          grouped30dSupplyChangeChart(list, all, title),
          grouped30dUtxoCountChangeChart(list, all, title),
          {
            name: "Address Count",
            title: title("Address Count 30d Change"),
            bottom: mapCohortsWithAll(list, all, ({ name, color, addrCount }) =>
              baseline({ metric: addrCount._30dChange, name, unit: Unit.count, color }),
            ),
          },
        ],
      },
    ],
  };
}

/**
 * @param {{ list: readonly (UtxoCohortObject | CohortWithoutRelative)[], all: CohortAll, title: (metric: string) => string }} args
 * @returns {PartialOptionsGroup}
 */
export function createGroupedHoldingsSection({ list, all, title }) {
  return {
    name: "Holdings",
    tree: [
      {
        name: "Supply",
        tree: [
          {
            name: "Total",
            title: title("Supply"),
            bottom: flatMapCohortsWithAll(list, all, ({ name, color, tree }) =>
              satsBtcUsd({ pattern: tree.supply.total, name, color }),
            ),
          },
          {
            name: "In Profit",
            title: title("Supply In Profit"),
            bottom: flatMapCohortsWithAll(list, all, ({ name, color, tree }) =>
              satsBtcUsd({
                pattern: tree.unrealized.supplyInProfit,
                name,
                color,
              }),
            ),
          },
          {
            name: "In Loss",
            title: title("Supply In Loss"),
            bottom: flatMapCohortsWithAll(list, all, ({ name, color, tree }) =>
              satsBtcUsd({
                pattern: tree.unrealized.supplyInLoss,
                name,
                color,
              }),
            ),
          },
        ],
      },
      groupedUtxoCountChart(list, all, title),
      {
        name: "30d Changes",
        tree: [
          grouped30dSupplyChangeChart(list, all, title),
          grouped30dUtxoCountChangeChart(list, all, title),
        ],
      },
    ],
  };
}

/**
 * Grouped holdings section with % of Own Supply only (for cohorts without % of Circulating)
 * @param {{ list: readonly (CohortAgeRange | CohortBasicWithoutMarketCap)[], all: CohortAll, title: (metric: string) => string }} args
 * @returns {PartialOptionsGroup}
 */
export function createGroupedHoldingsSectionWithOwnSupply({ list, all, title }) {
  return {
    name: "Holdings",
    tree: [
      {
        name: "Supply",
        tree: [
          {
            name: "In Profit",
            title: title("Supply In Profit"),
            bottom: [
              ...flatMapCohortsWithAll(list, all, ({ name, color, tree }) =>
                satsBtcUsd({
                  pattern: tree.unrealized.supplyInProfit,
                  name,
                  color,
                }),
              ),
              ...mapCohortsWithAll(list, all, ({ name, color, tree }) =>
                line({
                  metric: tree.relative.supplyInProfitRelToOwnSupply,
                  name,
                  color,
                  unit: Unit.pctOwn,
                }),
              ),
              ...priceLines({ numbers: [100, 50, 0], unit: Unit.pctOwn }),
            ],
          },
          {
            name: "In Loss",
            title: title("Supply In Loss"),
            bottom: [
              ...flatMapCohortsWithAll(list, all, ({ name, color, tree }) =>
                satsBtcUsd({
                  pattern: tree.unrealized.supplyInLoss,
                  name,
                  color,
                }),
              ),
              ...mapCohortsWithAll(list, all, ({ name, color, tree }) =>
                line({
                  metric: tree.relative.supplyInLossRelToOwnSupply,
                  name,
                  color,
                  unit: Unit.pctOwn,
                }),
              ),
              ...priceLines({ numbers: [100, 50, 0], unit: Unit.pctOwn }),
            ],
          },
          {
            name: "Total",
            title: title("Supply"),
            bottom: flatMapCohortsWithAll(list, all, ({ name, color, tree }) =>
              satsBtcUsd({ pattern: tree.supply.total, name, color }),
            ),
          },
        ],
      },
      groupedUtxoCountChart(list, all, title),
      {
        name: "30d Changes",
        tree: [
          grouped30dSupplyChangeChart(list, all, title),
          grouped30dUtxoCountChangeChart(list, all, title),
        ],
      },
    ],
  };
}

/**
 * @param {{ list: readonly (CohortFull | CohortWithAdjusted | CohortBasicWithMarketCap | CohortMinAge)[], all: CohortAll, title: (metric: string) => string }} args
 * @returns {PartialOptionsGroup}
 */
export function createGroupedHoldingsSectionWithRelative({ list, all, title }) {
  return {
    name: "Holdings",
    tree: [
      {
        name: "Supply",
        tree: [
          {
            name: "Total",
            title: title("Supply"),
            bottom: [
              ...flatMapCohortsWithAll(list, all, ({ name, color, tree }) =>
                satsBtcUsd({ pattern: tree.supply.total, name, color }),
              ),
              ...mapCohorts(list, ({ name, color, tree }) =>
                line({
                  metric: tree.relative.supplyRelToCirculatingSupply,
                  name,
                  color,
                  unit: Unit.pctSupply,
                }),
              ),
            ],
          },
          {
            name: "In Profit",
            title: title("Supply In Profit"),
            bottom: [
              ...flatMapCohortsWithAll(list, all, ({ name, color, tree }) =>
                satsBtcUsd({
                  pattern: tree.unrealized.supplyInProfit,
                  name,
                  color,
                }),
              ),
              ...mapCohorts(list, ({ name, color, tree }) =>
                line({
                  metric: tree.relative.supplyInProfitRelToCirculatingSupply,
                  name,
                  color,
                  unit: Unit.pctSupply,
                }),
              ),
              ...mapCohortsWithAll(list, all, ({ name, color, tree }) =>
                line({
                  metric: tree.relative.supplyInProfitRelToOwnSupply,
                  name,
                  color,
                  unit: Unit.pctOwn,
                }),
              ),
              ...priceLines({ numbers: [100, 50, 0], unit: Unit.pctOwn }),
            ],
          },
          {
            name: "In Loss",
            title: title("Supply In Loss"),
            bottom: [
              ...flatMapCohortsWithAll(list, all, ({ name, color, tree }) =>
                satsBtcUsd({
                  pattern: tree.unrealized.supplyInLoss,
                  name,
                  color,
                }),
              ),
              ...mapCohorts(list, ({ name, color, tree }) =>
                line({
                  metric: tree.relative.supplyInLossRelToCirculatingSupply,
                  name,
                  color,
                  unit: Unit.pctSupply,
                }),
              ),
              ...mapCohortsWithAll(list, all, ({ name, color, tree }) =>
                line({
                  metric: tree.relative.supplyInLossRelToOwnSupply,
                  name,
                  color,
                  unit: Unit.pctOwn,
                }),
              ),
              ...priceLines({ numbers: [100, 50, 0], unit: Unit.pctOwn }),
            ],
          },
        ],
      },
      groupedUtxoCountChart(list, all, title),
      {
        name: "30d Changes",
        tree: [
          grouped30dSupplyChangeChart(list, all, title),
          grouped30dUtxoCountChangeChart(list, all, title),
        ],
      },
    ],
  };
>>>>>>> 69eb58f7 (chore: update website from upstream v0.1.5)
}
