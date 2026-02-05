/**
 * Cost Basis section builders
 *
 * Structure:
<<<<<<< HEAD
 * - Per Coin: sats-weighted (profitability + distribution)
 * - Per Dollar: value-weighted (profitability + distribution)
 * - Profitability: cross-cutting (per coin + per dollar on same chart)
 * - Supply Density: cost basis supply density percentage
 *
 * Only for cohorts WITH costBasis (All, STH, LTH)
 */

import { colors } from "../../utils/colors.js";
import { entries } from "../../utils/array.js";
import { price, percentRatio } from "../series.js";
import { mapCohortsWithAll, flatMapCohortsWithAll } from "../shared.js";

const ACTIVE_PCTS = new Set(["pct75", "pct50", "pct25"]);
=======
 * - Summary: Key stats (avg + median active, quartiles/extremes available)
 * - By Coin: BTC-weighted percentiles (IQR active: p25, p50, p75)
 * - By Capital: USD-weighted percentiles (IQR active: p25, p50, p75)
 * - Price Position: Spot percentile (both perspectives active)
 *
 * For cohorts WITHOUT percentiles: Summary only
 */

import { colors } from "../../utils/colors.js";
import { Unit } from "../../utils/units.js";
import { priceLines } from "../constants.js";
import { line, price } from "../series.js";
import { mapCohortsWithAll } from "../shared.js";
>>>>>>> 69eb58f7 (chore: update website from upstream v0.1.5)

/**
 * @param {PercentilesPattern} p
 * @param {(name: string) => string} [n]
 * @returns {FetchedPriceSeriesBlueprint[]}
 */
<<<<<<< HEAD
function percentileSeries(p, n = (x) => x) {
  return entries(p)
    .reverse()
    .map(([key, s], i, arr) =>
      price({
        series: s,
        name: n(key.replace("pct", "P")),
        color: colors.at(i, arr.length),
        ...(ACTIVE_PCTS.has(key) ? {} : { defaultActive: false }),
      }),
    );
}

// ============================================================================
// Single cohort helpers
// ============================================================================

/**
 * Per Coin or Per Dollar folder for a single cohort
 * @param {Object} args
 * @param {AnyPricePattern} args.avgPrice - realized price (per coin) or investor price (per dollar)
 * @param {string} args.avgName
 * @param {AnyPricePattern} args.inProfit
 * @param {AnyPricePattern} args.inLoss
 * @param {PercentilesPattern} args.percentiles
 * @param {Color} args.color
 * @param {string} args.weightLabel
 * @param {(name: string) => string} args.title
 * @param {AnyPricePattern} [args.min]
 * @param {AnyPricePattern} [args.max]
 * @returns {PartialOptionsTree}
 */
function singleWeightFolder({ avgPrice, avgName, inProfit, inLoss, percentiles, color, weightLabel, title, min, max }) {
  return [
    {
      name: "Average",
      title: title(`Cost Basis Average (${weightLabel})`),
      top: [
        price({ series: inProfit, name: "In Profit", color: colors.profit }),
        price({ series: avgPrice, name: avgName, color }),
        price({ series: inLoss, name: "In Loss", color: colors.loss }),
      ],
    },
    {
      name: "Distribution",
      title: title(`Cost Basis Distribution (${weightLabel})`),
      top: [
        price({ series: avgPrice, name: avgName, color }),
        ...(max ? [price({ series: max, name: "P100", color: colors.stat.max, defaultActive: false })] : []),
        ...percentileSeries(percentiles),
        ...(min ? [price({ series: min, name: "P0", color: colors.stat.min, defaultActive: false })] : []),
      ],
    },
=======
function createCorePercentileSeries(p, n = (x) => x) {
  return [
    price({
      metric: p.pct95,
      name: n("p95"),
      color: colors.pct._95,
      defaultActive: false,
    }),
    price({
      metric: p.pct90,
      name: n("p90"),
      color: colors.pct._90,
      defaultActive: false,
    }),
    price({
      metric: p.pct85,
      name: n("p85"),
      color: colors.pct._85,
      defaultActive: false,
    }),
    price({
      metric: p.pct80,
      name: n("p80"),
      color: colors.pct._80,
      defaultActive: false,
    }),
    price({ metric: p.pct75, name: n("p75"), color: colors.pct._75 }),
    price({
      metric: p.pct70,
      name: n("p70"),
      color: colors.pct._70,
      defaultActive: false,
    }),
    price({
      metric: p.pct65,
      name: n("p65"),
      color: colors.pct._65,
      defaultActive: false,
    }),
    price({
      metric: p.pct60,
      name: n("p60"),
      color: colors.pct._60,
      defaultActive: false,
    }),
    price({
      metric: p.pct55,
      name: n("p55"),
      color: colors.pct._55,
      defaultActive: false,
    }),
    price({ metric: p.pct50, name: n("p50"), color: colors.pct._50 }),
    price({
      metric: p.pct45,
      name: n("p45"),
      color: colors.pct._45,
      defaultActive: false,
    }),
    price({
      metric: p.pct40,
      name: n("p40"),
      color: colors.pct._40,
      defaultActive: false,
    }),
    price({
      metric: p.pct35,
      name: n("p35"),
      color: colors.pct._35,
      defaultActive: false,
    }),
    price({
      metric: p.pct30,
      name: n("p30"),
      color: colors.pct._30,
      defaultActive: false,
    }),
    price({ metric: p.pct25, name: n("p25"), color: colors.pct._25 }),
    price({
      metric: p.pct20,
      name: n("p20"),
      color: colors.pct._20,
      defaultActive: false,
    }),
    price({
      metric: p.pct15,
      name: n("p15"),
      color: colors.pct._15,
      defaultActive: false,
    }),
    price({
      metric: p.pct10,
      name: n("p10"),
      color: colors.pct._10,
      defaultActive: false,
    }),
    price({
      metric: p.pct05,
      name: n("p05"),
      color: colors.pct._05,
      defaultActive: false,
    }),
>>>>>>> 69eb58f7 (chore: update website from upstream v0.1.5)
  ];
}

/**
<<<<<<< HEAD
 * @param {{ cohort: CohortAll | CohortFull | CohortLongTerm, title: (name: string) => string }} args
 * @returns {PartialOptionsGroup}
 */
export function createCostBasisSectionWithPercentiles({ cohort, title }) {
  const { tree, color } = cohort;
  const cb = tree.costBasis;
=======
 * @param {UtxoCohortObject | CohortWithoutRelative} cohort
 * @returns {FetchedPriceSeriesBlueprint[]}
 */
function createSingleSummarySeriesBasic(cohort) {
  const { color, tree } = cohort;
  return [
    price({ metric: tree.realized.realizedPrice, name: "Average", color }),
    price({
      metric: tree.costBasis.max,
      name: "Max",
      color: colors.pct._100,
      defaultActive: false,
    }),
    price({
      metric: tree.costBasis.min,
      name: "Min",
      color: colors.pct._0,
      defaultActive: false,
    }),
  ];
}

/**
 * @param {CohortAll | CohortFull | CohortWithPercentiles} cohort
 * @returns {FetchedPriceSeriesBlueprint[]}
 */
function createSingleSummarySeriesWithPercentiles(cohort) {
  const { color, tree } = cohort;
  const p = tree.costBasis.percentiles;
  return [
    price({ metric: tree.realized.realizedPrice, name: "Average", color }),
    price({
      metric: tree.costBasis.max,
      name: "Max (p100)",
      color: colors.pct._100,
      defaultActive: false,
    }),
    price({
      metric: p.pct75,
      name: "Q3 (p75)",
      color: colors.pct._75,
      defaultActive: false,
    }),
    price({ metric: p.pct50, name: "Median (p50)", color: colors.pct._50 }),
    price({
      metric: p.pct25,
      name: "Q1 (p25)",
      color: colors.pct._25,
      defaultActive: false,
    }),
    price({
      metric: tree.costBasis.min,
      name: "Min (p0)",
      color: colors.pct._0,
      defaultActive: false,
    }),
  ];
}

/**
 * @param {readonly CohortObject[]} list
 * @param {CohortAll} all
 * @returns {FetchedPriceSeriesBlueprint[]}
 */
function createGroupedSummarySeries(list, all) {
  return mapCohortsWithAll(list, all, ({ name, color, tree }) =>
    price({ metric: tree.realized.realizedPrice, name, color }),
  );
}

/**
 * @param {CohortAll | CohortFull | CohortWithPercentiles} cohort
 * @returns {FetchedPriceSeriesBlueprint[]}
 */
function createSingleByCoinSeries(cohort) {
  const { color, tree } = cohort;
  const cb = tree.costBasis;
  return [
    price({ metric: tree.realized.realizedPrice, name: "Average", color }),
    price({
      metric: cb.max,
      name: "p100",
      color: colors.pct._100,
      defaultActive: false,
    }),
    ...createCorePercentileSeries(cb.percentiles),
    price({
      metric: cb.min,
      name: "p0",
      color: colors.pct._0,
      defaultActive: false,
    }),
  ];
}

/**
 * @param {CohortAll | CohortFull | CohortWithPercentiles} cohort
 * @returns {FetchedPriceSeriesBlueprint[]}
 */
function createSingleByCapitalSeries(cohort) {
  const { color, tree } = cohort;
  return [
    price({ metric: tree.realized.investorPrice, name: "Average", color }),
    ...createCorePercentileSeries(tree.costBasis.investedCapital),
  ];
}

/**
 * @param {CohortAll | CohortFull | CohortWithPercentiles} cohort
 * @returns {AnyFetchedSeriesBlueprint[]}
 */
function createSinglePricePositionSeries(cohort) {
  const { tree } = cohort;
  return [
    line({
      metric: tree.costBasis.spotCostBasisPercentile,
      name: "By Coin",
      color: colors.bitcoin,
      unit: Unit.percentage,
    }),
    line({
      metric: tree.costBasis.spotInvestedCapitalPercentile,
      name: "By Capital",
      color: colors.usd,
      unit: Unit.percentage,
    }),
    ...priceLines({ numbers: [100, 50, 0], unit: Unit.percentage }),
  ];
}

/**
 * @param {{ cohort: UtxoCohortObject | CohortWithoutRelative, title: (metric: string) => string }} args
 * @returns {PartialOptionsGroup}
 */
export function createCostBasisSection({ cohort, title }) {
>>>>>>> 69eb58f7 (chore: update website from upstream v0.1.5)
  return {
    name: "Cost Basis",
    tree: [
      {
<<<<<<< HEAD
        name: "Per Coin",
        tree: singleWeightFolder({
          avgPrice: tree.realized.price, avgName: "All",
          inProfit: cb.inProfit.perCoin, inLoss: cb.inLoss.perCoin,
          percentiles: cb.perCoin, color, weightLabel: "BTC-weighted", title,
          min: cb.min, max: cb.max,
        }),
      },
      {
        name: "Per Dollar",
        tree: singleWeightFolder({
          avgPrice: tree.realized.investor.price, avgName: "All",
          inProfit: cb.inProfit.perDollar, inLoss: cb.inLoss.perDollar,
          percentiles: cb.perDollar, color, weightLabel: "USD-weighted", title,
        }),
      },
      {
        name: "Supply Density",
        title: title("Cost Basis Supply Density"),
        bottom: percentRatio({ pattern: cb.supplyDensity, name: "Supply Density", color: colors.bitcoin }),
=======
        name: "Summary",
        title: title("Cost Basis Summary"),
        top: createSingleSummarySeriesBasic(cohort),
>>>>>>> 69eb58f7 (chore: update website from upstream v0.1.5)
      },
    ],
  };
}

<<<<<<< HEAD
// ============================================================================
// Grouped cohort helpers
// ============================================================================

/**
 * Per Coin or Per Dollar folder for grouped cohorts
 * @param {Object} args
 * @param {readonly (CohortAll | CohortFull | CohortLongTerm)[]} args.list
 * @param {CohortAll} args.all
 * @param {(c: CohortAll | CohortFull | CohortLongTerm) => AnyPricePattern} args.getAvgPrice
 * @param {(c: CohortAll | CohortFull | CohortLongTerm) => AnyPricePattern} args.getInProfit
 * @param {(c: CohortAll | CohortFull | CohortLongTerm) => AnyPricePattern} args.getInLoss
 * @param {(c: CohortAll | CohortFull | CohortLongTerm) => PercentilesPattern} args.getPercentiles
 * @param {string} args.avgTitle
 * @param {string} args.weightLabel
 * @param {(name: string) => string} args.title
 * @returns {PartialOptionsTree}
 */
function groupedWeightFolder({ list, all, getAvgPrice, getInProfit, getInLoss, getPercentiles, avgTitle, weightLabel, title }) {
  return [
    {
      name: "Average",
      title: title(`Cost Basis ${avgTitle} (${weightLabel})`),
      top: mapCohortsWithAll(list, all, (c) =>
        price({ series: getAvgPrice(c), name: c.name, color: c.color }),
      ),
    },
    {
      name: "In Profit",
      title: title(`Cost Basis In Profit (${weightLabel})`),
      top: mapCohortsWithAll(list, all, (c) =>
        price({ series: getInProfit(c), name: c.name, color: c.color }),
      ),
    },
    {
      name: "In Loss",
      title: title(`Cost Basis In Loss (${weightLabel})`),
      top: mapCohortsWithAll(list, all, (c) =>
        price({ series: getInLoss(c), name: c.name, color: c.color }),
      ),
    },
    ...(/** @type {const} */ ([
      ["pct50", "Median"],
      ["pct75", "Q3"],
      ["pct25", "Q1"],
    ])).map(([pct, label]) => ({
      name: label,
      title: title(`Cost Basis ${label} (${weightLabel})`),
      top: mapCohortsWithAll(list, all, (c) =>
        price({ series: getPercentiles(c)[pct], name: c.name, color: c.color }),
      ),
    })),
  ];
}

/**
 * @param {{ list: readonly (CohortAll | CohortFull | CohortLongTerm)[], all: CohortAll, title: (name: string) => string }} args
=======
/**
 * @param {{ cohort: CohortAll | CohortFull | CohortWithPercentiles, title: (metric: string) => string }} args
 * @returns {PartialOptionsGroup}
 */
export function createCostBasisSectionWithPercentiles({ cohort, title }) {
  return {
    name: "Cost Basis",
    tree: [
      {
        name: "Summary",
        title: title("Cost Basis Summary"),
        top: createSingleSummarySeriesWithPercentiles(cohort),
      },
      {
        name: "By Coin",
        title: title("Cost Basis Distribution (BTC-weighted)"),
        top: createSingleByCoinSeries(cohort),
      },
      {
        name: "By Capital",
        title: title("Cost Basis Distribution (USD-weighted)"),
        top: createSingleByCapitalSeries(cohort),
      },
      {
        name: "Price Position",
        title: title("Current Price Position"),
        bottom: createSinglePricePositionSeries(cohort),
      },
    ],
  };
}

/**
 * @param {{ list: readonly (UtxoCohortObject | CohortWithoutRelative)[], all: CohortAll, title: (metric: string) => string }} args
 * @returns {PartialOptionsGroup}
 */
export function createGroupedCostBasisSection({ list, all, title }) {
  return {
    name: "Cost Basis",
    tree: [
      {
        name: "Summary",
        title: title("Cost Basis Summary"),
        top: createGroupedSummarySeries(list, all),
      },
    ],
  };
}

/**
 * @param {{ list: readonly (CohortAll | CohortFull | CohortWithPercentiles)[], all: CohortAll, title: (metric: string) => string }} args
>>>>>>> 69eb58f7 (chore: update website from upstream v0.1.5)
 * @returns {PartialOptionsGroup}
 */
export function createGroupedCostBasisSectionWithPercentiles({ list, all, title }) {
  return {
    name: "Cost Basis",
    tree: [
      {
<<<<<<< HEAD
        name: "Per Coin",
        tree: groupedWeightFolder({
          list, all, title,
          getAvgPrice: (c) => c.tree.realized.price,
          getInProfit: (c) => c.tree.costBasis.inProfit.perCoin,
          getInLoss: (c) => c.tree.costBasis.inLoss.perCoin,
          getPercentiles: (c) => c.tree.costBasis.perCoin,
          avgTitle: "Average", weightLabel: "BTC-weighted",
        }),
      },
      {
        name: "Per Dollar",
        tree: groupedWeightFolder({
          list, all, title,
          getAvgPrice: (c) => c.tree.realized.investor.price,
          getInProfit: (c) => c.tree.costBasis.inProfit.perDollar,
          getInLoss: (c) => c.tree.costBasis.inLoss.perDollar,
          getPercentiles: (c) => c.tree.costBasis.perDollar,
          avgTitle: "Average", weightLabel: "USD-weighted",
        }),
      },
      {
        name: "Supply Density",
        title: title("Cost Basis Supply Density"),
        bottom: flatMapCohortsWithAll(list, all, ({ name, color, tree }) =>
          percentRatio({ pattern: tree.costBasis.supplyDensity, name, color }),
        ),
=======
        name: "Summary",
        title: title("Cost Basis Summary"),
        top: createGroupedSummarySeries(list, all),
      },
      {
        name: "By Coin",
        tree: [
          {
            name: "Average",
            title: title("Realized Price Comparison"),
            top: mapCohortsWithAll(list, all, ({ name, color, tree }) =>
              price({ metric: tree.realized.realizedPrice, name, color }),
            ),
          },
          {
            name: "Median",
            title: title("Cost Basis Median (BTC-weighted)"),
            top: mapCohortsWithAll(list, all, ({ name, color, tree }) =>
              price({ metric: tree.costBasis.percentiles.pct50, name, color }),
            ),
          },
          {
            name: "Q3",
            title: title("Cost Basis Q3 (BTC-weighted)"),
            top: mapCohortsWithAll(list, all, ({ name, color, tree }) =>
              price({ metric: tree.costBasis.percentiles.pct75, name, color }),
            ),
          },
          {
            name: "Q1",
            title: title("Cost Basis Q1 (BTC-weighted)"),
            top: mapCohortsWithAll(list, all, ({ name, color, tree }) =>
              price({ metric: tree.costBasis.percentiles.pct25, name, color }),
            ),
          },
        ],
      },
      {
        name: "By Capital",
        tree: [
          {
            name: "Average",
            title: title("Investor Price Comparison"),
            top: mapCohortsWithAll(list, all, ({ name, color, tree }) =>
              price({ metric: tree.realized.investorPrice, name, color }),
            ),
          },
          {
            name: "Median",
            title: title("Cost Basis Median (USD-weighted)"),
            top: mapCohortsWithAll(list, all, ({ name, color, tree }) =>
              price({
                metric: tree.costBasis.investedCapital.pct50,
                name,
                color,
              }),
            ),
          },
          {
            name: "Q3",
            title: title("Cost Basis Q3 (USD-weighted)"),
            top: mapCohortsWithAll(list, all, ({ name, color, tree }) =>
              price({
                metric: tree.costBasis.investedCapital.pct75,
                name,
                color,
              }),
            ),
          },
          {
            name: "Q1",
            title: title("Cost Basis Q1 (USD-weighted)"),
            top: mapCohortsWithAll(list, all, ({ name, color, tree }) =>
              price({
                metric: tree.costBasis.investedCapital.pct25,
                name,
                color,
              }),
            ),
          },
        ],
      },
      {
        name: "Price Position",
        tree: [
          {
            name: "By Coin",
            title: title("Price Position (BTC-weighted)"),
            bottom: [
              ...mapCohortsWithAll(list, all, ({ name, color, tree }) =>
                line({
                  metric: tree.costBasis.spotCostBasisPercentile,
                  name,
                  color,
                  unit: Unit.percentage,
                }),
              ),
              ...priceLines({ numbers: [100, 50, 0], unit: Unit.percentage }),
            ],
          },
          {
            name: "By Capital",
            title: title("Price Position (USD-weighted)"),
            bottom: [
              ...mapCohortsWithAll(list, all, ({ name, color, tree }) =>
                line({
                  metric: tree.costBasis.spotInvestedCapitalPercentile,
                  name,
                  color,
                  unit: Unit.percentage,
                }),
              ),
              ...priceLines({ numbers: [100, 50, 0], unit: Unit.percentage }),
            ],
          },
        ],
>>>>>>> 69eb58f7 (chore: update website from upstream v0.1.5)
      },
    ],
  };
}
