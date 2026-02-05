/**
 * Activity section builders
 *
<<<<<<< HEAD
 * Capabilities by cohort type:
 * - All/STH: activity (full), SOPR (rolling + adjusted), sell side risk, value (flows + breakdown), coins
 * - LTH: activity (full), SOPR (rolling), sell side risk, value (flows + breakdown), coins
 * - AgeRange/MaxAge: activity (basic), SOPR (24h only), value (no flows/breakdown), coins
 * - Others (UtxoAmount, Empty, Address): no activity, value only
 */

import { Unit } from "../../utils/units.js";
import {
  line,
  baseline,
  dotsBaseline,
  percentRatio,
  chartsFromCount,
  averagesArray,
  ROLLING_WINDOWS,
} from "../series.js";
import {
  satsBtcUsd,
  satsBtcUsdFullTree,
  mapCohortsWithAll,
  groupedWindowsCumulative,
  groupedWindowsCumulativeSatsBtcUsd,
} from "../shared.js";
import { colors } from "../../utils/colors.js";

// ============================================================================
// Shared Volume Helpers
// ============================================================================

/**
 * @param {TransferVolumePattern} tv
 * @param {Color} color
 * @param {(name: string) => string} title
 * @returns {PartialOptionsTree}
 */
function volumeTree(tv, color, title) {
  return [
    ...satsBtcUsdFullTree({
      pattern: tv,
      title,
      metric: "Transfer Volume",
      color,
    }),
    {
      name: "Profitability",
        tree: [
          ...ROLLING_WINDOWS.map((w) => ({
            name: w.name,
            title: title(`${w.title} Transfer Volume Profitability`),
            bottom: [
              ...satsBtcUsd({
                pattern: tv.inProfit.sum[w.key],
                name: "In Profit",
                color: colors.profit,
              }),
              ...satsBtcUsd({
                pattern: tv.inLoss.sum[w.key],
                name: "In Loss",
                color: colors.loss,
              }),
            ],
          })),
          {
            name: "Cumulative",
            title: title("Cumulative Transfer Volume Profitability"),
            bottom: [
              ...satsBtcUsd({
                pattern: tv.inProfit.cumulative,
                name: "In Profit",
                color: colors.profit,
              }),
              ...satsBtcUsd({
                pattern: tv.inLoss.cumulative,
                name: "In Loss",
                color: colors.loss,
=======
 * Structure:
 * - Volume: Sent volume (Sum, Cumulative, 14d EMA)
 * - SOPR: Spent Output Profit Ratio (30d > 7d > raw)
 * - Sell Side Risk: Risk ratio
 * - Value: Flows, Created & Destroyed, Breakdown
 * - Coins Destroyed: Coinblocks/Coindays (Sum, Cumulative)
 *
 * For cohorts WITH adjusted values: Additional Normal/Adjusted sub-sections
 */

import { Unit } from "../../utils/units.js";
import { line, baseline, dotsBaseline, dots } from "../series.js";
import { satsBtcUsd, mapCohortsWithAll, flatMapCohortsWithAll } from "../shared.js";
import { colors } from "../../utils/colors.js";

// ============================================================================
// Shared Helpers
// ============================================================================

/**
 * Create SOPR series from realized pattern (30d > 7d > raw order)
 * @param {{ sopr: AnyMetricPattern, sopr7dEma: AnyMetricPattern, sopr30dEma: AnyMetricPattern }} realized
 * @param {string} rawName - Name for the raw SOPR series
 * @returns {AnyFetchedSeriesBlueprint[]}
 */
function soprSeries(realized, rawName = "SOPR") {
  return [
    baseline({
      metric: realized.sopr30dEma,
      name: "30d EMA",
      color: colors.bi.p3,
      unit: Unit.ratio,
      base: 1,
    }),
    baseline({
      metric: realized.sopr7dEma,
      name: "7d EMA",
      color: colors.bi.p2,
      unit: Unit.ratio,
      base: 1,
    }),
    dotsBaseline({
      metric: realized.sopr,
      name: rawName,
      color: colors.bi.p1,
      unit: Unit.ratio,
      base: 1,
    }),
  ];
}

/**
 * Create grouped SOPR chart entries (Raw, 7d EMA, 30d EMA)
 * @template {{ color: Color, name: string }} T
 * @param {readonly T[]} list
 * @param {T} all
 * @param {(item: T) => AnyMetricPattern} getSopr
 * @param {(item: T) => AnyMetricPattern} getSopr7d
 * @param {(item: T) => AnyMetricPattern} getSopr30d
 * @param {(metric: string) => string} title
 * @param {string} titlePrefix
 * @returns {PartialOptionsTree}
 */
function groupedSoprCharts(
  list,
  all,
  getSopr,
  getSopr7d,
  getSopr30d,
  title,
  titlePrefix,
) {
  return [
    {
      name: "Raw",
      title: title(`${titlePrefix}SOPR`),
      bottom: mapCohortsWithAll(list, all, (item) =>
        baseline({
          metric: getSopr(item),
          name: item.name,
          color: item.color,
          unit: Unit.ratio,
          base: 1,
        }),
      ),
    },
    {
      name: "7d EMA",
      title: title(`${titlePrefix}SOPR 7d EMA`),
      bottom: mapCohortsWithAll(list, all, (item) =>
        baseline({
          metric: getSopr7d(item),
          name: item.name,
          color: item.color,
          unit: Unit.ratio,
          base: 1,
        }),
      ),
    },
    {
      name: "30d EMA",
      title: title(`${titlePrefix}SOPR 30d EMA`),
      bottom: mapCohortsWithAll(list, all, (item) =>
        baseline({
          metric: getSopr30d(item),
          name: item.name,
          color: item.color,
          unit: Unit.ratio,
          base: 1,
        }),
      ),
    },
  ];
}

/**
 * Create value breakdown tree (Profit/Loss Created/Destroyed)
 * @template {{ color: Color, name: string, tree: { realized: AnyRealizedPattern } }} T
 * @param {readonly T[]} list
 * @param {T} all
 * @param {(metric: string) => string} title
 * @returns {PartialOptionsTree}
 */
function valueBreakdownTree(list, all, title) {
  return [
    {
      name: "Profit",
      tree: [
        {
          name: "Created",
          title: title("Profit Value Created"),
          bottom: mapCohortsWithAll(list, all, ({ name, color, tree }) =>
            line({
              metric: tree.realized.profitValueCreated,
              name,
              color,
              unit: Unit.usd,
            }),
          ),
        },
        {
          name: "Destroyed",
          title: title("Profit Value Destroyed"),
          bottom: mapCohortsWithAll(list, all, ({ name, color, tree }) =>
            line({
              metric: tree.realized.profitValueDestroyed,
              name,
              color,
              unit: Unit.usd,
            }),
          ),
        },
      ],
    },
    {
      name: "Loss",
      tree: [
        {
          name: "Created",
          title: title("Loss Value Created"),
          bottom: mapCohortsWithAll(list, all, ({ name, color, tree }) =>
            line({
              metric: tree.realized.lossValueCreated,
              name,
              color,
              unit: Unit.usd,
            }),
          ),
        },
        {
          name: "Destroyed",
          title: title("Loss Value Destroyed"),
          bottom: mapCohortsWithAll(list, all, ({ name, color, tree }) =>
            line({
              metric: tree.realized.lossValueDestroyed,
              name,
              color,
              unit: Unit.usd,
            }),
          ),
        },
      ],
    },
  ];
}

/**
 * Create coins destroyed tree (Sum/Cumulative with Coinblocks/Coindays)
 * @template {{ color: Color, name: string, tree: { activity: { coinblocksDestroyed: CountPattern<any>, coindaysDestroyed: CountPattern<any> } } }} T
 * @param {readonly T[]} list
 * @param {T} all
 * @param {(metric: string) => string} title
 * @returns {PartialOptionsTree}
 */
function coinsDestroyedTree(list, all, title) {
  return [
    {
      name: "Sum",
      title: title("Coins Destroyed"),
      bottom: flatMapCohortsWithAll(list, all, ({ name, color, tree }) => [
        line({
          metric: tree.activity.coinblocksDestroyed.sum,
          name,
          color,
          unit: Unit.coinblocks,
        }),
        line({
          metric: tree.activity.coindaysDestroyed.sum,
          name,
          color,
          unit: Unit.coindays,
        }),
      ]),
    },
    {
      name: "Cumulative",
      title: title("Cumulative Coins Destroyed"),
      bottom: flatMapCohortsWithAll(list, all, ({ name, color, tree }) => [
        line({
          metric: tree.activity.coinblocksDestroyed.cumulative,
          name,
          color,
          unit: Unit.coinblocks,
        }),
        line({
          metric: tree.activity.coindaysDestroyed.cumulative,
          name,
          color,
          unit: Unit.coindays,
        }),
      ]),
    },
  ];
}

// ============================================================================
// SOPR Helpers
// ============================================================================

/**
 * Create SOPR series for single cohort (30d > 7d > raw order)
 * @param {UtxoCohortObject | CohortWithoutRelative} cohort
 * @returns {AnyFetchedSeriesBlueprint[]}
 */
function createSingleSoprSeries(cohort) {
  return soprSeries(cohort.tree.realized);
}

/**
 * Create SOPR tree with normal and adjusted sub-sections
 * @param {CohortAll | CohortFull | CohortWithAdjusted} cohort
 * @param {(metric: string) => string} title
 * @returns {PartialOptionsTree}
 */
function createSingleSoprTreeWithAdjusted(cohort, title) {
  const { realized } = cohort.tree;
  return [
    {
      name: "Normal",
      title: title("SOPR"),
      bottom: soprSeries(realized),
    },
    {
      name: "Adjusted",
      title: title("Adjusted SOPR"),
      bottom: soprSeries(
        {
          sopr: realized.adjustedSopr,
          sopr7dEma: realized.adjustedSopr7dEma,
          sopr30dEma: realized.adjustedSopr30dEma,
        },
        "Adjusted SOPR",
      ),
    },
  ];
}

/**
 * Create grouped SOPR tree with separate charts for each variant
 * @param {readonly (UtxoCohortObject | CohortWithoutRelative)[]} list
 * @param {CohortAll} all
 * @param {(metric: string) => string} title
 * @returns {PartialOptionsTree}
 */
function createGroupedSoprTree(list, all, title) {
  return groupedSoprCharts(
    list,
    all,
    (c) => c.tree.realized.sopr,
    (c) => c.tree.realized.sopr7dEma,
    (c) => c.tree.realized.sopr30dEma,
    title,
    "",
  );
}

/**
 * Create grouped SOPR tree with Normal and Adjusted sub-sections
 * @param {readonly (CohortAll | CohortFull | CohortWithAdjusted)[]} list
 * @param {CohortAll | CohortFull | CohortWithAdjusted} all
 * @param {(metric: string) => string} title
 * @returns {PartialOptionsTree}
 */
function createGroupedSoprTreeWithAdjusted(list, all, title) {
  return [
    {
      name: "Normal",
      tree: groupedSoprCharts(
        list,
        all,
        (c) => c.tree.realized.sopr,
        (c) => c.tree.realized.sopr7dEma,
        (c) => c.tree.realized.sopr30dEma,
        title,
        "",
      ),
    },
    {
      name: "Adjusted",
      tree: groupedSoprCharts(
        list,
        all,
        (c) => c.tree.realized.adjustedSopr,
        (c) => c.tree.realized.adjustedSopr7dEma,
        (c) => c.tree.realized.adjustedSopr30dEma,
        title,
        "Adjusted ",
      ),
    },
  ];
}

// ============================================================================
// Single Cohort Activity Section
// ============================================================================

/**
 * Base activity section builder for single cohorts
 * @param {Object} args
 * @param {UtxoCohortObject | CohortWithoutRelative} args.cohort
 * @param {(metric: string) => string} args.title
 * @param {AnyFetchedSeriesBlueprint[]} [args.valueMetrics] - Optional additional value metrics
 * @param {PartialOptionsTree} [args.soprTree] - Optional SOPR tree override
 * @returns {PartialOptionsGroup}
 */
export function createActivitySection({
  cohort,
  title,
  valueMetrics = [],
  soprTree,
}) {
  const { tree, color } = cohort;

  return {
    name: "Activity",
    tree: [
      {
        name: "Volume",
        tree: [
          {
            name: "Sum",
            title: title("Sent Volume"),
            bottom: [
              line({
                metric: tree.activity.sent14dEma.sats,
                name: "14d EMA",
                color: colors.ma._14d,
                unit: Unit.sats,
                defaultActive: false,
              }),
              line({
                metric: tree.activity.sent14dEma.bitcoin,
                name: "14d EMA",
                color: colors.ma._14d,
                unit: Unit.btc,
                defaultActive: false,
              }),
              line({
                metric: tree.activity.sent14dEma.dollars,
                name: "14d EMA",
                color: colors.ma._14d,
                unit: Unit.usd,
                defaultActive: false,
              }),
              line({
                metric: tree.activity.sent.sats.sum,
                name: "sum",
                color,
                unit: Unit.sats,
              }),
              line({
                metric: tree.activity.sent.bitcoin.sum,
                name: "sum",
                color,
                unit: Unit.btc,
              }),
              line({
                metric: tree.activity.sent.dollars.sum,
                name: "sum",
                color,
                unit: Unit.usd,
              }),
            ],
          },
          {
            name: "Cumulative",
            title: title("Sent Volume (Total)"),
            bottom: [
              line({
                metric: tree.activity.sent.sats.cumulative,
                name: "all-time",
                color,
                unit: Unit.sats,
              }),
              line({
                metric: tree.activity.sent.bitcoin.cumulative,
                name: "all-time",
                color,
                unit: Unit.btc,
              }),
              line({
                metric: tree.activity.sent.dollars.cumulative,
                name: "all-time",
                color,
                unit: Unit.usd,
              }),
            ],
          },
        ],
      },
      soprTree
        ? { name: "SOPR", tree: soprTree }
        : {
            name: "SOPR",
            title: title("SOPR"),
            bottom: createSingleSoprSeries(cohort),
          },
      {
        name: "Sell Side Risk",
        title: title("Sell Side Risk Ratio"),
        bottom: createSingleSellSideRiskSeries(tree),
      },
      {
        name: "Value",
        tree: [
          {
            name: "Flows",
            title: title("Profit & Capitulation Flows"),
            bottom: createSingleCapitulationProfitFlowSeries(tree),
          },
          {
            name: "Created & Destroyed",
            title: title("Value Created & Destroyed"),
            bottom: [
              ...createSingleValueCreatedDestroyedSeries(tree),
              ...valueMetrics,
            ],
          },
          {
            name: "Breakdown",
            tree: [
              {
                name: "Profit",
                title: title("Profit Value Created & Destroyed"),
                bottom: [
                  line({
                    metric: tree.realized.profitValueCreated,
                    name: "Created",
                    color: colors.profit,
                    unit: Unit.usd,
                  }),
                  line({
                    metric: tree.realized.profitValueDestroyed,
                    name: "Destroyed",
                    color: colors.loss,
                    unit: Unit.usd,
                  }),
                ],
              },
              {
                name: "Loss",
                title: title("Loss Value Created & Destroyed"),
                bottom: [
                  line({
                    metric: tree.realized.lossValueCreated,
                    name: "Created",
                    color: colors.profit,
                    unit: Unit.usd,
                  }),
                  line({
                    metric: tree.realized.lossValueDestroyed,
                    name: "Destroyed",
                    color: colors.loss,
                    unit: Unit.usd,
                  }),
                ],
              },
            ],
          },
        ],
      },
      {
        name: "Coins Destroyed",
        tree: [
          {
            name: "Sum",
            title: title("Coins Destroyed"),
            bottom: [
              line({
                metric: tree.activity.coinblocksDestroyed.sum,
                name: "Coinblocks",
                color,
                unit: Unit.coinblocks,
              }),
              line({
                metric: tree.activity.coindaysDestroyed.sum,
                name: "Coindays",
                color,
                unit: Unit.coindays,
>>>>>>> 69eb58f7 (chore: update website from upstream v0.1.5)
              }),
            ],
          },
          {
<<<<<<< HEAD
            name: "In Profit",
            tree: satsBtcUsdFullTree({
              pattern: tv.inProfit,
              title,
              metric: "Transfer Volume In Profit",
              color: colors.profit,
            }),
          },
          {
            name: "In Loss",
            tree: satsBtcUsdFullTree({
              pattern: tv.inLoss,
              title,
              metric: "Transfer Volume In Loss",
              color: colors.loss,
            }),
          },
        ],
      },
  ];
}

/**
 * @param {{ transferVolume: TransferVolumePattern }} activity
 * @param {Color} color
 * @param {(name: string) => string} title
 * @returns {PartialOptionsGroup}
 */
function volumeFolder(activity, color, title) {
  return { name: "Volume", tree: volumeTree(activity.transferVolume, color, title) };
}

/**
 * @param {{ transferVolume: TransferVolumePattern }} activity
 * @param {CountPattern<number>} adjustedTransferVolume
 * @param {Color} color
 * @param {(name: string) => string} title
 * @returns {PartialOptionsGroup}
 */
function volumeFolderWithAdjusted(activity, adjustedTransferVolume, color, title) {
  return {
    name: "Volume",
    tree: [
      ...volumeTree(activity.transferVolume, color, title),
      { name: "Adjusted", tree: chartsFromCount({ pattern: adjustedTransferVolume, title, metric: "Adjusted Transfer Volume", unit: Unit.usd }) },
    ],
  };
}

// ============================================================================
// Shared SOPR Helpers
// ============================================================================

/**
 * @param {RollingWindowPattern<number>} ratio
 * @param {(name: string) => string} title
 * @param {string} [prefix]
 * @returns {PartialOptionsTree}
 */
function singleRollingSoprTree(ratio, title, prefix = "") {
  return [
    {
      name: "Compare",
      title: title(`${prefix}SOPR`),
      bottom: ROLLING_WINDOWS.map((w) =>
        baseline({
          series: ratio[w.key],
          name: w.name,
          color: w.color,
          unit: Unit.ratio,
          base: 1,
        }),
      ),
    },
    ...ROLLING_WINDOWS.map((w) => ({
      name: w.name,
      title: title(`${w.title} ${prefix}SOPR`.trim()),
      bottom: [
        baseline({
          series: ratio[w.key],
          name: "SOPR",
          unit: Unit.ratio,
          base: 1,
        }),
      ],
    })),
  ];
}

/**
 * @param {CountPattern<number>} valueDestroyed
 * @param {(name: string) => string} title
 * @returns {PartialOptionsTree}
 */
function valueDestroyedTree(valueDestroyed, title) {
  return chartsFromCount({ pattern: valueDestroyed, title, metric: "Value Destroyed", unit: Unit.usd });
}

/**
 * @param {CountPattern<number>} valueDestroyed
 * @param {(name: string) => string} title
 * @returns {PartialOptionsGroup}
 */
function valueDestroyedFolder(valueDestroyed, title) {
  return { name: "Value Destroyed", tree: valueDestroyedTree(valueDestroyed, title) };
}

/**
 * @param {CountPattern<number>} valueDestroyed
 * @param {CountPattern<number>} adjusted
 * @param {(name: string) => string} title
 * @returns {PartialOptionsGroup}
 */
function valueDestroyedFolderWithAdjusted(valueDestroyed, adjusted, title) {
  return {
    name: "Value Destroyed",
    tree: [
      ...valueDestroyedTree(valueDestroyed, title),
      { name: "Adjusted", tree: chartsFromCount({ pattern: adjusted, title, metric: "Adjusted Value Destroyed", unit: Unit.usd }) },
    ],
  };
}

// ============================================================================
// Shared Sell Side Risk Helpers
// ============================================================================

/**
 * @param {SellSideRiskPattern} sellSideRisk
 * @param {(name: string) => string} title
 * @returns {PartialOptionsTree}
 */
function singleSellSideRiskTree(sellSideRisk, title) {
  return [
    {
      name: "Compare",
      title: title("Sell Side Risk"),
      bottom: ROLLING_WINDOWS.flatMap((w) =>
        percentRatio({
          pattern: sellSideRisk[w.key],
          name: w.name,
          color: w.color,
        }),
      ),
    },
    ...ROLLING_WINDOWS.map((w) => ({
      name: w.name,
      title: title(`${w.title} Sell Side Risk`),
      bottom: percentRatio({
        pattern: sellSideRisk[w.key],
        name: "Sell Side Risk",
        color: w.color,
      }),
    })),
  ];
}

// ============================================================================
// Single Cohort Activity Sections
// ============================================================================

/**
 * Single activity tree items shared between WithAdjusted and basic
 * @param {CohortAll | CohortFull | CohortLongTerm} cohort
 * @param {(name: string) => string} title
 * @param {PartialOptionsGroup} volumeItem
 * @param {PartialOptionsGroup} soprFolder
 * @param {PartialOptionsGroup} valueDestroyedItem
 * @returns {PartialOptionsTree}
 */
function singleFullActivityTree(cohort, title, volumeItem, soprFolder, valueDestroyedItem) {
  const { tree, color } = cohort;
  return [
    volumeItem,
    soprFolder,
    valueDestroyedItem,
    {
      name: "Coindays Destroyed",
      tree: chartsFromCount({
        pattern: tree.activity.coindaysDestroyed,
        title,
        metric: "Coindays Destroyed",
        unit: Unit.coindays,
        color,
      }),
    },
    {
      name: "Dormancy",
      tree: averagesArray({
        windows: tree.activity.dormancy,
        title,
        metric: "Dormancy",
        unit: Unit.days,
      }),
    },
    {
      name: "Sell Side Risk",
      tree: singleSellSideRiskTree(tree.realized.sellSideRiskRatio, title),
    },
  ];
}

/** @param {{ cohort: CohortAll | CohortFull, title: (name: string) => string }} args */
export function createActivitySectionWithAdjusted({ cohort, title }) {
  const { tree, color } = cohort;
  const sopr = tree.realized.sopr;
  return {
    name: "Activity",
    tree: singleFullActivityTree(cohort, title,
      volumeFolderWithAdjusted(tree.activity, sopr.adjusted.transferVolume, color, title),
      {
        name: "SOPR",
        tree: [
          ...singleRollingSoprTree(sopr.ratio, title),
          { name: "Adjusted", tree: singleRollingSoprTree(sopr.adjusted.ratio, title, "Adjusted ") },
        ],
      },
      valueDestroyedFolderWithAdjusted(sopr.valueDestroyed, sopr.adjusted.valueDestroyed, title),
    ),
  };
}

/** @param {{ cohort: CohortFull | CohortLongTerm, title: (name: string) => string }} args */
export function createActivitySection({ cohort, title }) {
  const { tree, color } = cohort;
  return {
    name: "Activity",
    tree: singleFullActivityTree(cohort, title,
      volumeFolder(tree.activity, color, title),
      { name: "SOPR", tree: singleRollingSoprTree(tree.realized.sopr.ratio, title) },
      valueDestroyedFolder(tree.realized.sopr.valueDestroyed, title),
    ),
  };
}

/**
 * Activity section for cohorts with activity but basic realized (AgeRange/MaxAge — 24h SOPR only)
 * @param {{ cohort: CohortAgeRange | CohortWithAdjusted, title: (name: string) => string }} args
 * @returns {PartialOptionsGroup}
 */
export function createActivitySectionWithActivity({ cohort, title }) {
  const { tree, color } = cohort;
  const sopr = tree.realized.sopr;

  return {
    name: "Activity",
    tree: [
      volumeFolder(tree.activity, color, title),
      {
        name: "SOPR",
        title: title("SOPR (24h)"),
        bottom: [
          dotsBaseline({
            series: sopr.ratio._24h,
            name: "SOPR",
            unit: Unit.ratio,
            base: 1,
          }),
        ],
      },
      valueDestroyedFolder(sopr.valueDestroyed, title),
      {
        name: "Coindays Destroyed",
        tree: chartsFromCount({
          pattern: tree.activity.coindaysDestroyed,
          title,
        metric: "Coindays Destroyed",
          unit: Unit.coindays,
          color,
        }),
      },
=======
            name: "Cumulative",
            title: title("Cumulative Coins Destroyed"),
            bottom: [
              line({
                metric: tree.activity.coinblocksDestroyed.cumulative,
                name: "Coinblocks",
                color,
                unit: Unit.coinblocks,
              }),
              line({
                metric: tree.activity.coindaysDestroyed.cumulative,
                name: "Coindays",
                color,
                unit: Unit.coindays,
              }),
            ],
          },
        ],
      },
    ],
  };
}

/**
 * Activity section with adjusted values (for cohorts with RealizedPattern3/4)
 * @param {{ cohort: CohortAll | CohortFull | CohortWithAdjusted, title: (metric: string) => string }} args
 * @returns {PartialOptionsGroup}
 */
export function createActivitySectionWithAdjusted({ cohort, title }) {
  const { tree } = cohort;
  return createActivitySection({
    cohort,
    title,
    soprTree: createSingleSoprTreeWithAdjusted(cohort, title),
    valueMetrics: [
      line({
        metric: tree.realized.adjustedValueCreated,
        name: "Adjusted Created",
        color: colors.adjustedCreated,
        unit: Unit.usd,
        defaultActive: false,
      }),
      line({
        metric: tree.realized.adjustedValueDestroyed,
        name: "Adjusted Destroyed",
        color: colors.adjustedDestroyed,
        unit: Unit.usd,
        defaultActive: false,
      }),
    ],
  });
}

// ============================================================================
// Grouped Cohort Activity Section
// ============================================================================

/**
 * Create grouped flows tree (Profit Flow, Capitulation Flow)
 * @template {{ color: Color, name: string, tree: { realized: AnyRealizedPattern } }} T
 * @param {readonly T[]} list
 * @param {T} all
 * @param {(metric: string) => string} title
 * @returns {PartialOptionsTree}
 */
function groupedFlowsTree(list, all, title) {
  return [
    {
      name: "Profit",
      title: title("Profit Flow"),
      bottom: mapCohortsWithAll(list, all, ({ name, color, tree }) =>
        line({
          metric: tree.realized.profitFlow,
          name,
          color,
          unit: Unit.usd,
        }),
      ),
    },
    {
      name: "Capitulation",
      title: title("Capitulation Flow"),
      bottom: mapCohortsWithAll(list, all, ({ name, color, tree }) =>
        line({
          metric: tree.realized.capitulationFlow,
          name,
          color,
          unit: Unit.usd,
        }),
      ),
    },
  ];
}

/**
 * Create grouped value tree (Flows, Created, Destroyed, Breakdown)
 * @template {{ color: Color, name: string, tree: { realized: AnyRealizedPattern } }} T
 * @param {readonly T[]} list
 * @param {T} all
 * @param {(metric: string) => string} title
 * @returns {PartialOptionsTree}
 */
function createGroupedValueTree(list, all, title) {
  return [
    { name: "Flows", tree: groupedFlowsTree(list, all, title) },
    {
      name: "Created",
      title: title("Value Created"),
      bottom: mapCohortsWithAll(list, all, ({ name, color, tree }) =>
        line({
          metric: tree.realized.valueCreated,
          name,
          color,
          unit: Unit.usd,
        }),
      ),
    },
    {
      name: "Destroyed",
      title: title("Value Destroyed"),
      bottom: mapCohortsWithAll(list, all, ({ name, color, tree }) =>
        line({
          metric: tree.realized.valueDestroyed,
          name,
          color,
          unit: Unit.usd,
        }),
      ),
    },
    { name: "Breakdown", tree: valueBreakdownTree(list, all, title) },
  ];
}

/**
 * Grouped activity section builder
 * @param {{ list: readonly (UtxoCohortObject | CohortWithoutRelative)[], all: CohortAll, title: (metric: string) => string, soprTree?: PartialOptionsTree, valueTree?: PartialOptionsTree }} args
 * @returns {PartialOptionsGroup}
 */
export function createGroupedActivitySection({
  list,
  all,
  title,
  soprTree,
  valueTree,
}) {
  return {
    name: "Activity",
    tree: [
      {
        name: "Volume",
        tree: [
          {
            name: "14d EMA",
            title: title("Sent Volume 14d EMA"),
            bottom: flatMapCohortsWithAll(list, all, ({ name, color, tree }) =>
              satsBtcUsd({ pattern: tree.activity.sent14dEma, name, color }),
            ),
          },
          {
            name: "Sum",
            title: title("Sent Volume"),
            bottom: flatMapCohortsWithAll(list, all, ({ name, color, tree }) =>
              satsBtcUsd({
                pattern: {
                  sats: tree.activity.sent.sats.sum,
                  bitcoin: tree.activity.sent.bitcoin.sum,
                  dollars: tree.activity.sent.dollars.sum,
                },
                name,
                color,
              }),
            ),
          },
        ],
      },
      {
        name: "SOPR",
        tree: soprTree ?? createGroupedSoprTree(list, all, title),
      },
      {
        name: "Sell Side Risk",
        title: title("Sell Side Risk Ratio"),
        bottom: createGroupedSellSideRiskSeries(list, all),
      },
      {
        name: "Value",
        tree: valueTree ?? createGroupedValueTree(list, all, title),
      },
      { name: "Coins Destroyed", tree: coinsDestroyedTree(list, all, title) },
>>>>>>> 69eb58f7 (chore: update website from upstream v0.1.5)
    ],
  };
}

/**
<<<<<<< HEAD
 * Minimal activity section: volume only
 * @param {{ cohort: CohortBasicWithMarketCap | CohortBasicWithoutMarketCap | CohortWithoutRelative | CohortAddr | AddrCohortObject, title: (name: string) => string }} args
 * @returns {PartialOptionsGroup}
 */
export function createActivitySectionMinimal({ cohort, title }) {
  return {
    name: "Activity",
    tree: satsBtcUsdFullTree({
      pattern: cohort.tree.activity.transferVolume,
      title,
      metric: "Transfer Volume",
    }),
  };
}

/**
 * Grouped minimal activity: volume
 * @param {{ list: readonly (UtxoCohortObject | CohortWithoutRelative | CohortAddr | AddrCohortObject)[], all: CohortAll, title: (name: string) => string }} args
 * @returns {PartialOptionsGroup}
 */
export function createGroupedActivitySectionMinimal({ list, all, title }) {
  return {
    name: "Activity",
    tree: groupedWindowsCumulativeSatsBtcUsd({
      list, all, title, metricTitle: "Transfer Volume",
      getMetric: (c) => c.tree.activity.transferVolume,
    }),
  };
}

/**
 * Grouped profitability folder (compare + in profit + in loss)
 * @template {{ name: string, color: Color }} T
 * @template {{ name: string, color: Color }} A
 * @param {readonly T[]} list
 * @param {A} all
 * @param {(name: string) => string} title
 * @param {(c: T | A) => { sum: Record<string, AnyValuePattern>, cumulative: AnyValuePattern }} getInProfit
 * @param {(c: T | A) => { sum: Record<string, AnyValuePattern>, cumulative: AnyValuePattern }} getInLoss
 * @returns {PartialOptionsTree}
 */
function groupedProfitabilityArray(list, all, title, getInProfit, getInLoss) {
  return [
    {
      name: "In Profit",
      tree: groupedWindowsCumulativeSatsBtcUsd({
        list,
        all,
        title,
        metricTitle: "Transfer Volume In Profit",
        getMetric: (c) => getInProfit(c),
      }),
    },
    {
      name: "In Loss",
      tree: groupedWindowsCumulativeSatsBtcUsd({
        list,
        all,
        title,
        metricTitle: "Transfer Volume In Loss",
        getMetric: (c) => getInLoss(c),
      }),
    },
=======
 * Create grouped value tree with adjusted values (Flows, Normal, Adjusted, Breakdown)
 * @param {readonly (CohortAll | CohortFull | CohortWithAdjusted)[]} list
 * @param {CohortAll | CohortFull | CohortWithAdjusted} all
 * @param {(metric: string) => string} title
 * @returns {PartialOptionsTree}
 */
function createGroupedValueTreeWithAdjusted(list, all, title) {
  return [
    { name: "Flows", tree: groupedFlowsTree(list, all, title) },
    {
      name: "Normal",
      tree: [
        {
          name: "Created",
          title: title("Value Created"),
          bottom: mapCohortsWithAll(list, all, ({ name, color, tree }) =>
            line({
              metric: tree.realized.valueCreated,
              name,
              color,
              unit: Unit.usd,
            }),
          ),
        },
        {
          name: "Destroyed",
          title: title("Value Destroyed"),
          bottom: mapCohortsWithAll(list, all, ({ name, color, tree }) =>
            line({
              metric: tree.realized.valueDestroyed,
              name,
              color,
              unit: Unit.usd,
            }),
          ),
        },
      ],
    },
    {
      name: "Adjusted",
      tree: [
        {
          name: "Created",
          title: title("Adjusted Value Created"),
          bottom: mapCohortsWithAll(list, all, ({ name, color, tree }) =>
            line({
              metric: tree.realized.adjustedValueCreated,
              name,
              color,
              unit: Unit.usd,
            }),
          ),
        },
        {
          name: "Destroyed",
          title: title("Adjusted Value Destroyed"),
          bottom: mapCohortsWithAll(list, all, ({ name, color, tree }) =>
            line({
              metric: tree.realized.adjustedValueDestroyed,
              name,
              color,
              unit: Unit.usd,
            }),
          ),
        },
      ],
    },
    { name: "Breakdown", tree: valueBreakdownTree(list, all, title) },
>>>>>>> 69eb58f7 (chore: update website from upstream v0.1.5)
  ];
}

/**
<<<<<<< HEAD
 * @template {{ name: string, color: Color }} T
 * @template {{ name: string, color: Color }} A
 * @param {readonly T[]} list
 * @param {A} all
 * @param {(name: string) => string} title
 * @param {(c: T | A) => { sum: Record<string, AnyValuePattern>, cumulative: AnyValuePattern, inProfit: { sum: Record<string, AnyValuePattern>, cumulative: AnyValuePattern }, inLoss: { sum: Record<string, AnyValuePattern>, cumulative: AnyValuePattern } }} getTransferVolume
 * @returns {PartialOptionsTree}
 */
function groupedVolumeTree(list, all, title, getTransferVolume) {
  return [
    ...groupedWindowsCumulativeSatsBtcUsd({
      list,
      all,
      title,
      metricTitle: "Transfer Volume",
      getMetric: (c) => getTransferVolume(c),
    }),
    ...groupedProfitabilityArray(
      list,
      all,
      title,
      (c) => getTransferVolume(c).inProfit,
      (c) => getTransferVolume(c).inLoss,
    ),
  ];
}

/**
 * @template {{ name: string, color: Color }} T
 * @template {{ name: string, color: Color }} A
 * @param {readonly T[]} list
 * @param {A} all
 * @param {(name: string) => string} title
 * @param {(c: T | A) => { sum: Record<string, AnyValuePattern>, cumulative: AnyValuePattern, inProfit: { sum: Record<string, AnyValuePattern>, cumulative: AnyValuePattern }, inLoss: { sum: Record<string, AnyValuePattern>, cumulative: AnyValuePattern } }} getTransferVolume
 * @returns {PartialOptionsGroup}
 */
function groupedVolumeFolder(list, all, title, getTransferVolume) {
  return { name: "Volume", tree: groupedVolumeTree(list, all, title, getTransferVolume) };
}

/**
 * @template {{ name: string, color: Color }} T
 * @template {{ name: string, color: Color }} A
 * @param {readonly T[]} list
 * @param {A} all
 * @param {(name: string) => string} title
 * @param {(c: T | A) => { sum: Record<string, AnyValuePattern>, cumulative: AnyValuePattern, inProfit: { sum: Record<string, AnyValuePattern>, cumulative: AnyValuePattern }, inLoss: { sum: Record<string, AnyValuePattern>, cumulative: AnyValuePattern } }} getTransferVolume
 * @param {(c: T | A) => CountPattern<number>} getAdjustedTransferVolume
 * @returns {PartialOptionsGroup}
 */
function groupedVolumeFolderWithAdjusted(list, all, title, getTransferVolume, getAdjustedTransferVolume) {
  return {
    name: "Volume",
    tree: [
      ...groupedVolumeTree(list, all, title, getTransferVolume),
      {
        name: "Adjusted",
        tree: groupedWindowsCumulative({
          list, all, title, metricTitle: "Adjusted Transfer Volume",
          getWindowSeries: (c, key) => getAdjustedTransferVolume(c).sum[key],
          getCumulativeSeries: (c) => getAdjustedTransferVolume(c).cumulative,
          seriesFn: line, unit: Unit.usd,
        }),
      },
    ],
  };
}

// ============================================================================
// Grouped SOPR Helpers
// ============================================================================

/**
 * @template {{ color: Color, name: string }} T
 * @template {{ color: Color, name: string }} A
 * @param {readonly T[]} list
 * @param {A} all
 * @param {(item: T | A) => { _24h: AnySeriesPattern, _1w: AnySeriesPattern, _1m: AnySeriesPattern, _1y: AnySeriesPattern }} getRatio
 * @param {(name: string) => string} title
 * @param {string} [prefix]
 * @returns {PartialOptionsTree}
 */
function groupedSoprCharts(list, all, getRatio, title, prefix = "") {
  return ROLLING_WINDOWS.map((w) => ({
    name: w.name,
    title: title(`${w.title} ${prefix}SOPR`.trim()),
    bottom: mapCohortsWithAll(list, all, (c) =>
      baseline({
        series: getRatio(c)[w.key],
        name: c.name,
        color: c.color,
        unit: Unit.ratio,
        base: 1,
      }),
    ),
  }));
}

/**
 * @template {{ name: string, color: Color }} T
 * @template {{ name: string, color: Color }} A
 * @param {readonly T[]} list
 * @param {A} all
 * @param {(name: string) => string} title
 * @param {(c: T | A) => CountPattern<number>} getValueDestroyed
 * @returns {PartialOptionsTree}
 */
function groupedValueDestroyedTree(list, all, title, getValueDestroyed) {
  return groupedWindowsCumulative({
    list, all, title, metricTitle: "Value Destroyed",
    getWindowSeries: (c, key) => getValueDestroyed(c).sum[key],
    getCumulativeSeries: (c) => getValueDestroyed(c).cumulative,
    seriesFn: line, unit: Unit.usd,
=======
 * Grouped activity section with adjusted values (for cohorts with RealizedPattern3/4)
 * @param {{ list: readonly (CohortAll | CohortFull | CohortWithAdjusted)[], all: CohortAll, title: (metric: string) => string }} args
 * @returns {PartialOptionsGroup}
 */
export function createGroupedActivitySectionWithAdjusted({ list, all, title }) {
  return createGroupedActivitySection({
    list,
    all,
    title,
    soprTree: createGroupedSoprTreeWithAdjusted(list, all, title),
    valueTree: createGroupedValueTreeWithAdjusted(list, all, title),
>>>>>>> 69eb58f7 (chore: update website from upstream v0.1.5)
  });
}

/**
<<<<<<< HEAD
 * @template {{ name: string, color: Color }} T
 * @template {{ name: string, color: Color }} A
 * @param {readonly T[]} list
 * @param {A} all
 * @param {(name: string) => string} title
 * @param {(c: T | A) => CountPattern<number>} getValueDestroyed
 * @returns {PartialOptionsGroup}
 */
function groupedValueDestroyedFolder(list, all, title, getValueDestroyed) {
  return { name: "Value Destroyed", tree: groupedValueDestroyedTree(list, all, title, getValueDestroyed) };
}

/**
 * @template {{ name: string, color: Color }} T
 * @template {{ name: string, color: Color }} A
 * @param {readonly T[]} list
 * @param {A} all
 * @param {(name: string) => string} title
 * @param {(c: T | A) => CountPattern<number>} getValueDestroyed
 * @param {(c: T | A) => CountPattern<number>} getAdjustedValueDestroyed
 * @returns {PartialOptionsGroup}
 */
function groupedValueDestroyedFolderWithAdjusted(list, all, title, getValueDestroyed, getAdjustedValueDestroyed) {
  return {
    name: "Value Destroyed",
    tree: [
      ...groupedValueDestroyedTree(list, all, title, getValueDestroyed),
      { name: "Adjusted", tree: groupedValueDestroyedTree(list, all, title, getAdjustedValueDestroyed) },
    ],
  };
}

// ============================================================================
// Grouped Activity Sections
// ============================================================================

/**
 * Grouped activity tree items shared between WithAdjusted and basic
 * @param {readonly (CohortFull | CohortLongTerm)[]} list
 * @param {CohortAll} all
 * @param {(name: string) => string} title
 * @param {PartialOptionsGroup} volumeItem
 * @param {PartialOptionsGroup} soprFolder
 * @param {PartialOptionsGroup} valueDestroyedItem
 * @returns {PartialOptionsTree}
 */
function groupedFullActivityTree(list, all, title, volumeItem, soprFolder, valueDestroyedItem) {
  return [
    volumeItem,
    soprFolder,
    valueDestroyedItem,
    ...groupedActivitySharedItems(list, all, title),
  ];
}

/** @param {{ list: readonly CohortFull[], all: CohortAll, title: (name: string) => string }} args */
export function createGroupedActivitySectionWithAdjusted({ list, all, title }) {
  return {
    name: "Activity",
    tree: groupedFullActivityTree(list, all, title,
      groupedVolumeFolderWithAdjusted(list, all, title, (c) => c.tree.activity.transferVolume, (c) => c.tree.realized.sopr.adjusted.transferVolume),
      {
        name: "SOPR",
        tree: [
          ...groupedSoprCharts(list, all, (c) => c.tree.realized.sopr.ratio, title),
          { name: "Adjusted", tree: groupedSoprCharts(list, all, (c) => c.tree.realized.sopr.adjusted.ratio, title, "Adjusted ") },
        ],
      },
      groupedValueDestroyedFolderWithAdjusted(list, all, title, (c) => c.tree.realized.sopr.valueDestroyed, (c) => c.tree.realized.sopr.adjusted.valueDestroyed),
    ),
  };
}

/** @param {{ list: readonly (CohortFull | CohortLongTerm)[], all: CohortAll, title: (name: string) => string }} args */
export function createGroupedActivitySection({ list, all, title }) {
  return {
    name: "Activity",
    tree: groupedFullActivityTree(list, all, title,
      groupedVolumeFolder(list, all, title, (c) => c.tree.activity.transferVolume),
      { name: "SOPR", tree: groupedSoprCharts(list, all, (c) => c.tree.realized.sopr.ratio, title) },
      groupedValueDestroyedFolder(list, all, title, (c) => c.tree.realized.sopr.valueDestroyed),
    ),
  };
}

/**
 * Shared grouped activity items: coindays, dormancy, sell side risk
 * @param {readonly (CohortFull | CohortLongTerm)[]} list
 * @param {CohortAll} all
 * @param {(name: string) => string} title
 * @returns {PartialOptionsTree}
 */
function groupedActivitySharedItems(list, all, title) {
  return [
    {
      name: "Coindays Destroyed",
      tree: groupedWindowsCumulative({
        list,
        all,
        title,
        metricTitle: "Coindays Destroyed",
        getWindowSeries: (c, key) => c.tree.activity.coindaysDestroyed.sum[key],
        getCumulativeSeries: (c) =>
          c.tree.activity.coindaysDestroyed.cumulative,
        seriesFn: line,
        unit: Unit.coindays,
      }),
    },
    {
      name: "Dormancy",
      tree: ROLLING_WINDOWS.map((w) => ({
        name: w.name,
        title: title(`${w.title} Dormancy`),
        bottom: mapCohortsWithAll(list, all, ({ name, color, tree }) =>
          line({
            series: tree.activity.dormancy[w.key],
            name,
            color,
            unit: Unit.days,
          }),
        ),
      })),
    },
    {
      name: "Sell Side Risk",
      tree: ROLLING_WINDOWS.map((w) => ({
        name: w.name,
        title: title(`${w.title} Sell Side Risk`),
        bottom: mapCohortsWithAll(list, all, ({ name, color, tree }) =>
          line({
            series: tree.realized.sellSideRiskRatio[w.key].ratio,
            name,
            color,
            unit: Unit.ratio,
          }),
        ),
      })),
    },
=======
 * Create sell side risk ratio series for single cohort
 * @param {{ realized: AnyRealizedPattern }} tree
 * @returns {AnyFetchedSeriesBlueprint[]}
 */
function createSingleSellSideRiskSeries(tree) {
  return [
    line({
      metric: tree.realized.sellSideRiskRatio30dEma,
      name: "30d EMA",
      color: colors.ma._1m,
      unit: Unit.ratio,
    }),
    line({
      metric: tree.realized.sellSideRiskRatio7dEma,
      name: "7d EMA",
      color: colors.ma._1w,
      unit: Unit.ratio,
    }),
    dots({
      metric: tree.realized.sellSideRiskRatio,
      name: "Raw",
      color: colors.bitcoin,
      unit: Unit.ratio,
    }),
>>>>>>> 69eb58f7 (chore: update website from upstream v0.1.5)
  ];
}

/**
<<<<<<< HEAD
 * Grouped activity for cohorts with activity but basic realized (AgeRange/MaxAge)
 * @param {{ list: readonly (CohortAgeRange | CohortWithAdjusted)[], all: CohortAll, title: (name: string) => string }} args
 * @returns {PartialOptionsGroup}
 */
export function createGroupedActivitySectionWithActivity({ list, all, title }) {
  return {
    name: "Activity",
    tree: [
      groupedVolumeFolder(list, all, title, (c) => c.tree.activity.transferVolume),
      {
        name: "SOPR",
        title: title("SOPR (24h)"),
        bottom: mapCohortsWithAll(list, all, ({ name, color, tree }) =>
          baseline({
            series: tree.realized.sopr.ratio._24h,
            name,
            color,
            unit: Unit.ratio,
            base: 1,
          }),
        ),
      },
      groupedValueDestroyedFolder(list, all, title, (c) => c.tree.realized.sopr.valueDestroyed),
      {
        name: "Coindays Destroyed",
        tree: [
          ...ROLLING_WINDOWS.map((w) => ({
            name: w.name,
            title: title(`${w.title} Coindays Destroyed`),
            bottom: mapCohortsWithAll(list, all, ({ name, color, tree }) =>
              line({
                series: tree.activity.coindaysDestroyed.sum[w.key],
                name,
                color,
                unit: Unit.coindays,
              }),
            ),
          })),
          {
            name: "Cumulative",
            title: title("Cumulative Coindays Destroyed"),
            bottom: mapCohortsWithAll(list, all, ({ name, color, tree }) =>
              line({
                series: tree.activity.coindaysDestroyed.cumulative,
                name,
                color,
                unit: Unit.coindays,
              }),
            ),
          },
        ],
      },
    ],
  };
=======
 * Create sell side risk ratio series for grouped cohorts
 * @param {readonly CohortObject[]} list
 * @param {CohortObject} all
 * @returns {AnyFetchedSeriesBlueprint[]}
 */
function createGroupedSellSideRiskSeries(list, all) {
  return flatMapCohortsWithAll(list, all, ({ name, color, tree }) => [
    line({
      metric: tree.realized.sellSideRiskRatio,
      name,
      color,
      unit: Unit.ratio,
    }),
  ]);
}

/**
 * Create value created & destroyed series for single cohort
 * @param {{ realized: AnyRealizedPattern }} tree
 * @returns {AnyFetchedSeriesBlueprint[]}
 */
function createSingleValueCreatedDestroyedSeries(tree) {
  return [
    line({
      metric: tree.realized.valueCreated,
      name: "Created",
      color: colors.usd,
      unit: Unit.usd,
    }),
    line({
      metric: tree.realized.valueDestroyed,
      name: "Destroyed",
      color: colors.loss,
      unit: Unit.usd,
    }),
  ];
}

/**
 * Create capitulation & profit flow series for single cohort
 * @param {{ realized: AnyRealizedPattern }} tree
 * @returns {AnyFetchedSeriesBlueprint[]}
 */
function createSingleCapitulationProfitFlowSeries(tree) {
  return [
    line({
      metric: tree.realized.profitFlow,
      name: "Profit Flow",
      color: colors.profit,
      unit: Unit.usd,
    }),
    line({
      metric: tree.realized.capitulationFlow,
      name: "Capitulation Flow",
      color: colors.loss,
      unit: Unit.usd,
    }),
  ];
>>>>>>> 69eb58f7 (chore: update website from upstream v0.1.5)
}
