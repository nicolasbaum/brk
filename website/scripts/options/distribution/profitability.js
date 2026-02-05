/**
 * Profitability section builders
<<<<<<< HEAD
 *
 * Capability tiers:
 * - Full (All/STH/LTH): full unrealized with rel series, invested capital, sentiment;
 *   full realized with relToRcap, peakRegret, profitToLossRatio, grossPnl
 * - Mid (AgeRange/MaxAge): unrealized profit/loss/netPnl/nupl (no rel, no invested, no sentiment);
 *   realized with netPnl + delta (no relToRcap, no peakRegret)
 * - Basic (UtxoAmount, Empty, Address): nupl only unrealized;
 *   basic realized profit/loss (no netPnl, no relToRcap)
 */

import { Unit } from "../../utils/units.js";
import {
  ROLLING_WINDOWS,
  line,
  dotted,
  baseline,
  percentRatio,
  percentRatioBaseline,
  sumsTreeBaseline,
  rollingPercentRatioTree,
  mapWindows,
} from "../series.js";
import { colors } from "../../utils/colors.js";
import { priceLine } from "../constants.js";
import {
  mapCohortsWithAll,
  flatMapCohortsWithAll,
  groupedWindowsCumulativeUsd,
} from "../shared.js";

// ============================================================================
// Core Series Builders
// ============================================================================

=======
 */

import { Unit } from "../../utils/units.js";
import { line, baseline, dots, dotsBaseline } from "../series.js";
import { colors } from "../../utils/colors.js";
import { priceLine, priceLines } from "../constants.js";
import { satsBtcUsd, satsBtcUsdFrom, mapCohorts, mapCohortsWithAll, flatMapCohortsWithAll } from "../shared.js";

// ============================================================================
// Core Series Builders (Composable Primitives)
// ============================================================================

/**
 * @typedef {Object} PnlSeriesConfig
 * @property {AnyMetricPattern} profit
 * @property {AnyMetricPattern} loss
 * @property {AnyMetricPattern} negLoss
 * @property {AnyMetricPattern} [total]
 */

/**
 * Create profit/loss line series for a unit
 * @param {PnlSeriesConfig} metrics
 * @param {Unit} unit
 * @returns {AnyFetchedSeriesBlueprint[]}
 */
function pnlLines(metrics, unit) {
  const series = [
    line({ metric: metrics.profit, name: "Profit", color: colors.profit, unit }),
    line({ metric: metrics.loss, name: "Loss", color: colors.loss, unit }),
  ];
  if (metrics.total) {
    series.push(line({ metric: metrics.total, name: "Total", color: colors.default, unit }));
  }
  series.push(line({ metric: metrics.negLoss, name: "Negative Loss", color: colors.loss, unit, defaultActive: false }));
  return series;
}

/**
 * Create net P&L baseline
 * @param {AnyMetricPattern} metric
 * @param {Unit} unit
 * @returns {AnyFetchedSeriesBlueprint}
 */
function netBaseline(metric, unit) {
  return baseline({ metric, name: "Net P&L", unit });
}
>>>>>>> 69eb58f7 (chore: update website from upstream v0.1.5)

// ============================================================================
// Unrealized P&L Builders
// ============================================================================

/**
<<<<<<< HEAD
 * Overview chart: net + profit + loss inverted (active), loss raw (hidden)
 * @param {{ usd: AnySeriesPattern }} profit
 * @param {{ usd: AnySeriesPattern, negative: AnySeriesPattern }} loss
 * @param {AnySeriesPattern} netPnlUsd
 * @param {(name: string) => string} title
 * @returns {PartialChartOption}
 */
function unrealizedOverview(profit, loss, netPnlUsd, title) {
  return {
    name: "Overview",
    title: title("Unrealized P&L"),
    bottom: [
      baseline({ series: netPnlUsd, name: "Net", unit: Unit.usd }),
      dotted({
        series: profit.usd,
        name: "Profit",
        color: colors.profit,
        unit: Unit.usd,
      }),
      dotted({
        series: loss.negative,
        name: "Negated Loss",
        color: colors.loss,
        unit: Unit.usd,
      }),
      dotted({
        series: loss.usd,
        name: "Loss",
        color: colors.loss,
        unit: Unit.usd,
        defaultActive: false,
      }),
      priceLine({ unit: Unit.usd }),
    ],
=======
 * @typedef {Object} UnrealizedMetrics
 * @property {AnyMetricPattern} profit
 * @property {AnyMetricPattern} loss
 * @property {AnyMetricPattern} negLoss
 * @property {AnyMetricPattern} total
 * @property {AnyMetricPattern} net
 */

/**
 * Extract unrealized metrics from tree
 * @param {{ unrealized: UnrealizedPattern }} tree
 * @returns {UnrealizedMetrics}
 */
function getUnrealizedMetrics(tree) {
  return {
    profit: tree.unrealized.unrealizedProfit,
    loss: tree.unrealized.unrealizedLoss,
    negLoss: tree.unrealized.negUnrealizedLoss,
    total: tree.unrealized.totalUnrealizedPnl,
    net: tree.unrealized.netUnrealizedPnl,
>>>>>>> 69eb58f7 (chore: update website from upstream v0.1.5)
  };
}

/**
<<<<<<< HEAD
 * Relative P&L chart: profit + loss as % of some denominator
 * @param {{ percent: AnySeriesPattern, ratio: AnySeriesPattern }} profit
 * @param {{ percent: AnySeriesPattern, ratio: AnySeriesPattern }} loss
 * @param {string} name
 * @param {(name: string) => string} title
 * @returns {PartialChartOption}
 */
function relPnlChart(profit, loss, name, title) {
  return {
    name,
    title: title(`Unrealized P&L (${name})`),
    bottom: [
      ...percentRatio({
        pattern: profit,
        name: "Profit",
        color: colors.profit,
      }),
      ...percentRatio({ pattern: loss, name: "Loss", color: colors.loss }),
    ],
  };
}

/** @param {{ percent: AnySeriesPattern, ratio: AnySeriesPattern }} net @param {{ percent: AnySeriesPattern, ratio: AnySeriesPattern }} profit @param {{ percent: AnySeriesPattern, ratio: AnySeriesPattern }} loss @param {string} name @param {(name: string) => string} title */
function relPnlChartWithNet(net, profit, loss, name, title) {
  return {
    name,
    title: title(`Unrealized P&L (${name})`),
    bottom: [
      ...percentRatioBaseline({ pattern: net, name: "Net" }),
      ...percentRatio({ pattern: profit, name: "Profit", color: colors.profit }),
      ...percentRatio({ pattern: loss, name: "Loss", color: colors.loss }),
    ],
  };
}

/**
 * Core unrealized items: Overview + Net + NUPL + Profit + Loss
 * @param {{ profit: { usd: AnySeriesPattern }, loss: { usd: AnySeriesPattern, negative: AnySeriesPattern }, netPnl: { usd: AnySeriesPattern }, nupl: NuplPattern }} u
 * @param {(name: string) => string} title
 * @returns {PartialOptionsTree}
 */
function unrealizedCore(u, title) {
  return [
    unrealizedOverview(u.profit, u.loss, u.netPnl.usd, title),
    {
      name: "Net",
      title: title("Net Unrealized P&L"),
      bottom: [baseline({ series: u.netPnl.usd, name: "Net", unit: Unit.usd })],
    },
    { name: "NUPL", title: title("NUPL"), bottom: nuplSeries(u.nupl) },
    {
      name: "Profit",
      title: title("Unrealized Profit"),
      bottom: [
        line({
          series: u.profit.usd,
          name: "Profit",
          color: colors.profit,
          unit: Unit.usd,
        }),
      ],
    },
    {
      name: "Loss",
      title: title("Unrealized Loss"),
      bottom: [
        line({
          series: u.loss.usd,
          name: "Loss",
          color: colors.loss,
          unit: Unit.usd,
        }),
      ],
    },
  ];
}

/**
 * Core unrealized items + Gross
 * @param {{ profit: { usd: AnySeriesPattern }, loss: { usd: AnySeriesPattern, negative: AnySeriesPattern }, netPnl: { usd: AnySeriesPattern }, grossPnl: { usd: AnySeriesPattern }, nupl: NuplPattern }} u
 * @param {(name: string) => string} title
 * @returns {PartialOptionsTree}
 */
function unrealizedCoreWithGross(u, title) {
  return [
    ...unrealizedCore(u, title),
    {
      name: "Gross",
      title: title("Gross Unrealized P&L"),
      bottom: [
        line({
          series: u.grossPnl.usd,
          name: "Gross",
          color: colors.gross,
          unit: Unit.usd,
        }),
      ],
    },
  ];
}

/**
 * % of Own P&L chart
 * @param {AllRelativePattern | FullRelativePattern} u
 * @param {(name: string) => string} title
 * @returns {PartialChartOption}
 */
function ownPnlChart(u, title) {
  return {
    name: "% of Own P&L",
    title: title("Unrealized P&L (% of Own P&L)"),
    bottom: [
      ...percentRatioBaseline({ pattern: u.netPnl.toOwnGrossPnl, name: "Net" }),
      ...percentRatio({
        pattern: u.profit.toOwnGrossPnl,
        name: "Profit",
        color: colors.profit,
        defaultActive: false,
      }),
      ...percentRatio({
        pattern: u.loss.toOwnGrossPnl,
        name: "Loss",
        color: colors.loss,
        defaultActive: false,
      }),
    ],
  };
}

/** @param {AllRelativePattern} u @param {(name: string) => string} title */
function unrealizedTreeAll(u, title) {
  return [
    ...unrealizedCoreWithGross(u, title),
    ownPnlChart(u, title),
    relPnlChart(u.profit.toMcap, u.loss.toMcap, "% of Market Cap", title),
  ];
}

/** @param {FullRelativePattern} u @param {(name: string) => string} title */
function unrealizedTreeFull(u, title) {
  return [
    ...unrealizedCoreWithGross(u, title),
    ownPnlChart(u, title),
    relPnlChart(u.profit.toMcap, u.loss.toMcap, "% of Market Cap", title),
    relPnlChartWithNet(u.netPnl.toOwnMcap, u.profit.toOwnMcap, u.loss.toOwnMcap, "% of Own Market Cap", title),
  ];
}

/** @param {FullRelativePattern} u @param {(name: string) => string} title */
function unrealizedTreeLongTerm(u, title) {
  return [
    ...unrealizedCoreWithGross(u, title),
    ownPnlChart(u, title),
    {
      name: "% of Market Cap",
      title: title("Unrealized P&L (% of Market Cap)"),
      bottom: [
        ...percentRatio({
          pattern: u.profit.toMcap,
          name: "Profit",
          color: colors.profit,
        }),
        ...percentRatio({
          pattern: u.loss.toMcap,
          name: "Loss",
          color: colors.loss,
        }),
      ],
    },
    relPnlChartWithNet(u.netPnl.toOwnMcap, u.profit.toOwnMcap, u.loss.toOwnMcap, "% of Own Market Cap", title),
  ];
}

// ============================================================================
// Invested Capital, Sentiment, NUPL
// ============================================================================

/**
 * Sentiment (Full unrealized only)
 * @param {FullRelativePattern | AllRelativePattern} u
 * @returns {AnyFetchedSeriesBlueprint[]}
 */
function sentimentSeries(u) {
  return [
    baseline({
      series: u.sentiment.net.usd,
=======
 * Base unrealized P&L (USD only)
 * @param {UnrealizedMetrics} m
 * @returns {AnyFetchedSeriesBlueprint[]}
 */
function unrealizedUsd(m) {
  return [
    ...pnlLines({ profit: m.profit, loss: m.loss, negLoss: m.negLoss, total: m.total }, Unit.usd),
    priceLine({ unit: Unit.usd, defaultActive: false }),
  ];
}

/**
 * Unrealized P&L with % of Market Cap
 * @param {UnrealizedMetrics} m
 * @param {RelativeWithNupl} rel
 * @returns {AnyFetchedSeriesBlueprint[]}
 */
function unrealizedWithMarketCap(m, rel) {
  return [
    ...unrealizedUsd(m),
    ...pnlLines(
      {
        profit: rel.unrealizedProfitRelToMarketCap,
        loss: rel.unrealizedLossRelToMarketCap,
        negLoss: rel.negUnrealizedLossRelToMarketCap,
      },
      Unit.pctMcap,
    ),
    priceLine({ unit: Unit.pctMcap, defaultActive: false }),
  ];
}

/**
 * Unrealized P&L with % of Own Market Cap + % of Own P&L
 * @param {UnrealizedMetrics} m
 * @param {RelativeWithOwnMarketCap} rel
 * @returns {AnyFetchedSeriesBlueprint[]}
 */
function unrealizedWithOwnMarketCap(m, rel) {
  return [
    ...unrealizedUsd(m),
    ...pnlLines(
      {
        profit: rel.unrealizedProfitRelToOwnMarketCap,
        loss: rel.unrealizedLossRelToOwnMarketCap,
        negLoss: rel.negUnrealizedLossRelToOwnMarketCap,
      },
      Unit.pctOwnMcap,
    ),
    priceLine({ unit: Unit.pctOwnMcap, defaultActive: false }),
    ...pnlLines(
      {
        profit: rel.unrealizedProfitRelToOwnTotalUnrealizedPnl,
        loss: rel.unrealizedLossRelToOwnTotalUnrealizedPnl,
        negLoss: rel.negUnrealizedLossRelToOwnTotalUnrealizedPnl,
      },
      Unit.pctOwnPnl,
    ),
    ...priceLines({ numbers: [100, 50, 0], unit: Unit.pctOwnPnl }),
  ];
}

/**
 * Unrealized P&L for "all" cohort (% M.Cap + % Own P&L, no Own M.Cap)
 * @param {UnrealizedMetrics} m
 * @param {AllRelativePattern} rel
 * @returns {AnyFetchedSeriesBlueprint[]}
 */
function unrealizedAll(m, rel) {
  return [
    ...unrealizedUsd(m),
    ...pnlLines(
      {
        profit: rel.unrealizedProfitRelToMarketCap,
        loss: rel.unrealizedLossRelToMarketCap,
        negLoss: rel.negUnrealizedLossRelToMarketCap,
      },
      Unit.pctMcap,
    ),
    priceLine({ unit: Unit.pctMcap, defaultActive: false }),
    ...pnlLines(
      {
        profit: rel.unrealizedProfitRelToOwnTotalUnrealizedPnl,
        loss: rel.unrealizedLossRelToOwnTotalUnrealizedPnl,
        negLoss: rel.negUnrealizedLossRelToOwnTotalUnrealizedPnl,
      },
      Unit.pctOwnPnl,
    ),
    ...priceLines({ numbers: [100, 50, 0], unit: Unit.pctOwnPnl }),
  ];
}

/**
 * Unrealized P&L for Full cohorts (all relative metrics)
 * @param {UnrealizedMetrics} m
 * @param {FullRelativePattern} rel
 * @returns {AnyFetchedSeriesBlueprint[]}
 */
function unrealizedFull(m, rel) {
  return [
    ...unrealizedUsd(m),
    ...pnlLines(
      {
        profit: rel.unrealizedProfitRelToMarketCap,
        loss: rel.unrealizedLossRelToMarketCap,
        negLoss: rel.negUnrealizedLossRelToMarketCap,
      },
      Unit.pctMcap,
    ),
    priceLine({ unit: Unit.pctMcap, defaultActive: false }),
    ...pnlLines(
      {
        profit: rel.unrealizedProfitRelToOwnMarketCap,
        loss: rel.unrealizedLossRelToOwnMarketCap,
        negLoss: rel.negUnrealizedLossRelToOwnMarketCap,
      },
      Unit.pctOwnMcap,
    ),
    priceLine({ unit: Unit.pctOwnMcap, defaultActive: false }),
    ...pnlLines(
      {
        profit: rel.unrealizedProfitRelToOwnTotalUnrealizedPnl,
        loss: rel.unrealizedLossRelToOwnTotalUnrealizedPnl,
        negLoss: rel.negUnrealizedLossRelToOwnTotalUnrealizedPnl,
      },
      Unit.pctOwnPnl,
    ),
    ...priceLines({ numbers: [100, 50, 0], unit: Unit.pctOwnPnl }),
  ];
}

/**
 * Unrealized P&L for LongTerm (% M.Cap loss only + Own M.Cap + Own P&L)
 * @param {UnrealizedMetrics} m
 * @param {RelativeWithOwnMarketCap & RelativeWithNupl} rel
 * @returns {AnyFetchedSeriesBlueprint[]}
 */
function unrealizedLongTerm(m, rel) {
  return [
    ...unrealizedUsd(m),
    line({
      metric: rel.unrealizedLossRelToMarketCap,
      name: "Loss",
      color: colors.loss,
      unit: Unit.pctMcap,
    }),
    ...pnlLines(
      {
        profit: rel.unrealizedProfitRelToOwnMarketCap,
        loss: rel.unrealizedLossRelToOwnMarketCap,
        negLoss: rel.negUnrealizedLossRelToOwnMarketCap,
      },
      Unit.pctOwnMcap,
    ),
    priceLine({ unit: Unit.pctOwnMcap, defaultActive: false }),
    ...pnlLines(
      {
        profit: rel.unrealizedProfitRelToOwnTotalUnrealizedPnl,
        loss: rel.unrealizedLossRelToOwnTotalUnrealizedPnl,
        negLoss: rel.negUnrealizedLossRelToOwnTotalUnrealizedPnl,
      },
      Unit.pctOwnPnl,
    ),
    ...priceLines({ numbers: [100, 50, 0], unit: Unit.pctOwnPnl }),
  ];
}

// ============================================================================
// Net Unrealized P&L Builders
// ============================================================================

/**
 * Net P&L (USD only)
 * @param {AnyMetricPattern} net
 * @returns {AnyFetchedSeriesBlueprint[]}
 */
function netUnrealizedUsd(net) {
  return [netBaseline(net, Unit.usd)];
}

/**
 * Net P&L with % of Market Cap
 * @param {AnyMetricPattern} net
 * @param {RelativeWithNupl} rel
 * @returns {AnyFetchedSeriesBlueprint[]}
 */
function netUnrealizedWithMarketCap(net, rel) {
  return [
    netBaseline(net, Unit.usd),
    netBaseline(rel.netUnrealizedPnlRelToMarketCap, Unit.pctMcap),
  ];
}

/**
 * Net P&L with % of Own Market Cap + % of Own P&L
 * @param {AnyMetricPattern} net
 * @param {RelativeWithOwnMarketCap} rel
 * @returns {AnyFetchedSeriesBlueprint[]}
 */
function netUnrealizedWithOwnMarketCap(net, rel) {
  return [
    netBaseline(net, Unit.usd),
    netBaseline(rel.netUnrealizedPnlRelToOwnMarketCap, Unit.pctOwnMcap),
    netBaseline(rel.netUnrealizedPnlRelToOwnTotalUnrealizedPnl, Unit.pctOwnPnl),
  ];
}

/**
 * Net P&L for "all" cohort
 * @param {AnyMetricPattern} net
 * @param {AllRelativePattern} rel
 * @returns {AnyFetchedSeriesBlueprint[]}
 */
function netUnrealizedAll(net, rel) {
  return [
    netBaseline(net, Unit.usd),
    netBaseline(rel.netUnrealizedPnlRelToMarketCap, Unit.pctMcap),
    netBaseline(rel.netUnrealizedPnlRelToOwnTotalUnrealizedPnl, Unit.pctOwnPnl),
  ];
}

/**
 * Net P&L for Full cohorts
 * @param {AnyMetricPattern} net
 * @param {FullRelativePattern} rel
 * @returns {AnyFetchedSeriesBlueprint[]}
 */
function netUnrealizedFull(net, rel) {
  return [
    netBaseline(net, Unit.usd),
    netBaseline(rel.netUnrealizedPnlRelToMarketCap, Unit.pctMcap),
    netBaseline(rel.netUnrealizedPnlRelToOwnMarketCap, Unit.pctOwnMcap),
    netBaseline(rel.netUnrealizedPnlRelToOwnTotalUnrealizedPnl, Unit.pctOwnPnl),
  ];
}

// ============================================================================
// Invested Capital & Other Unrealized
// ============================================================================

/**
 * Invested capital (USD only)
 * @param {{ unrealized: UnrealizedPattern }} tree
 * @returns {AnyFetchedSeriesBlueprint[]}
 */
function investedCapitalAbsolute(tree) {
  return [
    line({
      metric: tree.unrealized.investedCapitalInProfit,
      name: "In Profit",
      color: colors.profit,
      unit: Unit.usd,
    }),
    line({
      metric: tree.unrealized.investedCapitalInLoss,
      name: "In Loss",
      color: colors.loss,
      unit: Unit.usd,
    }),
  ];
}

/**
 * Invested capital with % of Own R.Cap
 * @param {{ unrealized: UnrealizedPattern, relative: RelativeWithInvestedCapitalPct }} tree
 * @returns {AnyFetchedSeriesBlueprint[]}
 */
function investedCapitalWithPct(tree) {
  return [
    ...investedCapitalAbsolute(tree),
    baseline({
      metric: tree.relative.investedCapitalInProfitPct,
      name: "In Profit",
      color: colors.profit,
      unit: Unit.pctOwnRcap,
    }),
    baseline({
      metric: tree.relative.investedCapitalInLossPct,
      name: "In Loss",
      color: colors.loss,
      unit: Unit.pctOwnRcap,
    }),
    ...priceLines({ numbers: [100, 50], unit: Unit.pctOwnRcap }),
  ];
}

/**
 * NUPL series
 * @param {RelativeWithNupl} rel
 * @returns {AnyFetchedSeriesBlueprint[]}
 */
function nuplSeries(rel) {
  return [baseline({ metric: rel.nupl, name: "NUPL", unit: Unit.ratio })];
}

/**
 * Peak regret (USD only)
 * @param {{ unrealized: UnrealizedFullPattern }} tree
 * @param {Color} color
 * @returns {AnyFetchedSeriesBlueprint[]}
 */
function peakRegretAbsolute(tree, color) {
  return [
    line({
      metric: tree.unrealized.peakRegret,
      name: "Peak Regret",
      color,
      unit: Unit.usd,
    }),
  ];
}

/**
 * Peak regret with % of Market Cap
 * @param {{ unrealized: UnrealizedFullPattern, relative: RelativeWithPeakRegret }} tree
 * @param {Color} color
 * @returns {AnyFetchedSeriesBlueprint[]}
 */
function peakRegretWithMarketCap(tree, color) {
  return [
    line({
      metric: tree.unrealized.peakRegret,
      name: "Peak Regret",
      color,
      unit: Unit.usd,
    }),
    baseline({
      metric: tree.relative.unrealizedPeakRegretRelToMarketCap,
      name: "Rel. to Market Cap",
      color,
      unit: Unit.pctMcap,
    }),
  ];
}

/**
 * Sentiment series
 * @param {{ unrealized: UnrealizedPattern }} tree
 * @returns {AnyFetchedSeriesBlueprint[]}
 */
function sentimentSeries(tree) {
  return [
    baseline({
      metric: tree.unrealized.netSentiment,
>>>>>>> 69eb58f7 (chore: update website from upstream v0.1.5)
      name: "Net Sentiment",
      unit: Unit.usd,
    }),
    line({
<<<<<<< HEAD
      series: u.sentiment.greedIndex.usd,
=======
      metric: tree.unrealized.greedIndex,
>>>>>>> 69eb58f7 (chore: update website from upstream v0.1.5)
      name: "Greed Index",
      color: colors.profit,
      unit: Unit.usd,
      defaultActive: false,
    }),
    line({
<<<<<<< HEAD
      series: u.sentiment.painIndex.usd,
=======
      metric: tree.unrealized.painIndex,
>>>>>>> 69eb58f7 (chore: update website from upstream v0.1.5)
      name: "Pain Index",
      color: colors.loss,
      unit: Unit.usd,
      defaultActive: false,
    }),
  ];
}

/**
<<<<<<< HEAD
 * NUPL series
 * @param {NuplPattern} nupl
 * @returns {AnyFetchedSeriesBlueprint[]}
 */
function nuplSeries(nupl) {
  return [baseline({ series: nupl.ratio, name: "NUPL", unit: Unit.ratio })];
}

// ============================================================================
// Realized P&L Helpers
// ============================================================================

/**
 * Flat metric folder: Compare + windows + Cumulative + optional % of Realized Cap
 * @param {Object} args
 * @param {{ sum: Record<string, { usd: AnySeriesPattern }>, cumulative: { usd: AnySeriesPattern } }} args.pattern
 * @param {string} args.metricTitle
 * @param {Color} args.color
 * @param {(name: string) => string} args.title
 * @returns {PartialOptionsTree}
 */
function realizedMetricFolder({ pattern, metricTitle, color, title }) {
  return [
    {
      name: "Compare",
      title: title(`Realized ${metricTitle}`),
      bottom: ROLLING_WINDOWS.map((w) =>
        line({
          series: pattern.sum[w.key].usd,
          name: w.name,
          color: w.color,
          unit: Unit.usd,
        }),
      ),
    },
    ...ROLLING_WINDOWS.map((w) => ({
      name: w.name,
      title: title(`${w.title} Realized ${metricTitle}`),
      bottom: [
        line({
          series: pattern.sum[w.key].usd,
          name: metricTitle,
          color,
          unit: Unit.usd,
        }),
      ],
    })),
    {
      name: "Cumulative",
      title: title(`Cumulative Realized ${metricTitle}`),
      bottom: [
        line({
          series: pattern.cumulative.usd,
          name: metricTitle,
          color,
          unit: Unit.usd,
        }),
      ],
    },
=======
 * Sentiment chart for single cohort
 * @param {{ unrealized: UnrealizedPattern }} tree
 * @param {(metric: string) => string} title
 * @returns {PartialChartOption}
 */
function sentimentChart(tree, title) {
  return {
    name: "Sentiment",
    title: title("Market Sentiment"),
    bottom: sentimentSeries(tree),
  };
}

/**
 * Volume subfolder for single cohort
 * @param {{ realized: AnyRealizedPattern }} tree
 * @param {(metric: string) => string} title
 * @returns {PartialOptionsGroup}
 */
function volumeSubfolder(tree, title) {
  return { name: "Volume", tree: sentInPnlTree(tree, title) };
}

// ============================================================================
// Realized P&L Builders
// ============================================================================

/**
 * Realized P&L sum series
 * @param {{ realized: AnyRealizedPattern }} tree
 * @returns {AnyFetchedSeriesBlueprint[]}
 */
function realizedPnlSum(tree) {
  const r = tree.realized;
  return [
    line({
      metric: r.realizedProfit7dEma,
      name: "Profit 7d EMA",
      color: colors.profit,
      unit: Unit.usd,
    }),
    line({
      metric: r.realizedLoss7dEma,
      name: "Loss 7d EMA",
      color: colors.loss,
      unit: Unit.usd,
    }),
    dots({
      metric: r.realizedProfit.sum,
      name: "Profit",
      color: colors.profit,
      unit: Unit.usd,
      defaultActive: false,
    }),
    dots({
      metric: r.negRealizedLoss.sum,
      name: "Negative Loss",
      color: colors.loss,
      unit: Unit.usd,
      defaultActive: false,
    }),
    dots({
      metric: r.realizedLoss.sum,
      name: "Loss",
      color: colors.loss,
      unit: Unit.usd,
      defaultActive: false,
    }),
    dots({
      metric: r.realizedValue,
      name: "Value",
      color: colors.default,
      unit: Unit.usd,
      defaultActive: false,
    }),
    baseline({
      metric: r.realizedProfitRelToRealizedCap.sum,
      name: "Profit",
      color: colors.profit,
      unit: Unit.pctRcap,
    }),
    baseline({
      metric: r.realizedLossRelToRealizedCap.sum,
      name: "Loss",
      color: colors.loss,
      unit: Unit.pctRcap,
    }),
>>>>>>> 69eb58f7 (chore: update website from upstream v0.1.5)
  ];
}

/**
<<<<<<< HEAD
 * Net P&L folder: Compare + windows + Cumulative + optional % of Rcap + Change/
 * @param {Object} args
 * @param {NetPnlFullPattern | NetPnlBasicPattern} args.netPnl
 * @param {(name: string) => string} args.title
 * @param {PartialOptionsTree} [args.extraChange] - Additional change items (% of Mcap, % of Rcap)
 * @returns {PartialOptionsGroup}
 */
function realizedNetFolder({ netPnl, title, extraChange = [] }) {
  return {
    name: "Net",
    tree: [
      {
        name: "Compare",
        title: title("Net Realized P&L"),
        bottom: ROLLING_WINDOWS.map((w) =>
          baseline({
            series: netPnl.sum[w.key].usd,
            name: w.name,
            color: w.color,
            unit: Unit.usd,
          }),
        ),
      },
      ...ROLLING_WINDOWS.map((w) => ({
        name: w.name,
        title: title(`${w.title} Net Realized P&L`),
        bottom: [
          baseline({
            series: netPnl.sum[w.key].usd,
            name: "Net",
            unit: Unit.usd,
          }),
        ],
      })),
      {
        name: "Cumulative",
        title: title("Cumulative Net Realized P&L"),
        bottom: [
          baseline({
            series: netPnl.cumulative.usd,
            name: "Net",
            unit: Unit.usd,
          }),
        ],
      },
      {
        ...sumsTreeBaseline({
          windows: mapWindows(netPnl.delta.absolute, (c) => c.usd),
          title,
          metric: "Net Realized P&L Change",
          unit: Unit.usd,
          legend: "Change",
        }),
        name: "Change",
      },
      {
        name: "Growth Rate",
        tree: [
          ...rollingPercentRatioTree({
            windows: netPnl.delta.rate,
            title,
            metric: "Net Realized P&L Growth Rate",
          }).tree,
          ...extraChange,
        ],
      },
    ],
  };
}

/**
 * Realized overview folder: one chart per window showing net + profit (dotted) + neg. loss (dotted) + loss (hidden) + gross (hidden)
 * @param {Object} args
 * @param {{ sum: Record<string, { usd: AnySeriesPattern }> }} args.profit
 * @param {{ sum: Record<string, { usd: AnySeriesPattern }>, negative: { sum: Record<string, AnySeriesPattern> } }} args.loss
 * @param {{ sum: Record<string, { usd: AnySeriesPattern }> }} args.netPnl
 * @param {{ sum: Record<string, { usd: AnySeriesPattern }> }} [args.grossPnl]
 * @param {{ sum: Record<string, { usd: AnySeriesPattern }> }} [args.peakRegret]
 * @param {(name: string) => string} args.title
 * @returns {PartialOptionsGroup}
 */
function realizedOverviewFolder({
  profit,
  loss,
  netPnl,
  grossPnl,
  peakRegret,
  title,
}) {
  return {
    name: "Overview",
    tree: ROLLING_WINDOWS.map((w) => ({
      name: w.name,
      title: title(`${w.title} Realized P&L`),
      bottom: [
        baseline({
          series: netPnl.sum[w.key].usd,
          name: "Net",
          unit: Unit.usd,
        }),
        dotted({
          series: profit.sum[w.key].usd,
          name: "Profit",
          color: colors.profit,
          unit: Unit.usd,
        }),
        dotted({
          series: loss.negative.sum[w.key],
          name: "Negated Loss",
          color: colors.loss,
          unit: Unit.usd,
        }),
        dotted({
          series: loss.sum[w.key].usd,
          name: "Loss",
          color: colors.loss,
          unit: Unit.usd,
          defaultActive: false,
        }),
        ...(grossPnl
          ? [
              dotted({
                series: grossPnl.sum[w.key].usd,
                name: "Gross",
                color: colors.gross,
                unit: Unit.usd,
                defaultActive: false,
              }),
            ]
          : []),
        ...(peakRegret
          ? [
              dotted({
                series: peakRegret.sum[w.key].usd,
                name: "Peak Regret",
                color: colors.regret,
                unit: Unit.usd,
                defaultActive: false,
              }),
            ]
          : []),
        priceLine({ unit: Unit.usd }),
      ],
    })),
  };
=======
 * Realized Net P&L sum series
 * @param {{ realized: AnyRealizedPattern }} tree
 * @returns {AnyFetchedSeriesBlueprint[]}
 */
function realizedNetPnlSum(tree) {
  const r = tree.realized;
  return [
    baseline({
      metric: r.netRealizedPnl7dEma,
      name: "Net 7d EMA",
      unit: Unit.usd,
    }),
    dotsBaseline({
      metric: r.netRealizedPnl.sum,
      name: "Net",
      unit: Unit.usd,
      defaultActive: false,
    }),
    baseline({
      metric: r.netRealizedPnlRelToRealizedCap.sum,
      name: "Net",
      unit: Unit.pctRcap,
    }),
  ];
}

/**
 * Realized P&L cumulative series
 * @param {{ realized: AnyRealizedPattern }} tree
 * @returns {AnyFetchedSeriesBlueprint[]}
 */
function realizedPnlCumulative(tree) {
  const r = tree.realized;
  return [
    line({
      metric: r.realizedProfit.cumulative,
      name: "Profit",
      color: colors.profit,
      unit: Unit.usd,
    }),
    line({
      metric: r.realizedLoss.cumulative,
      name: "Loss",
      color: colors.loss,
      unit: Unit.usd,
    }),
    line({
      metric: r.negRealizedLoss.cumulative,
      name: "Negative Loss",
      color: colors.loss,
      unit: Unit.usd,
      defaultActive: false,
    }),
    baseline({
      metric: r.realizedProfitRelToRealizedCap.cumulative,
      name: "Profit",
      color: colors.profit,
      unit: Unit.pctRcap,
    }),
    baseline({
      metric: r.realizedLossRelToRealizedCap.cumulative,
      name: "Loss",
      color: colors.loss,
      unit: Unit.pctRcap,
    }),
  ];
}

/**
 * Realized Net P&L cumulative series
 * @param {{ realized: AnyRealizedPattern }} tree
 * @returns {AnyFetchedSeriesBlueprint[]}
 */
function realizedNetPnlCumulative(tree) {
  const r = tree.realized;
  return [
    baseline({
      metric: r.netRealizedPnl.cumulative,
      name: "Net",
      unit: Unit.usd,
    }),
    baseline({
      metric: r.netRealizedPnlRelToRealizedCap.cumulative,
      name: "Net",
      unit: Unit.pctRcap,
    }),
  ];
}

/**
 * Realized 30d change series
 * @param {{ realized: AnyRealizedPattern }} tree
 * @returns {AnyFetchedSeriesBlueprint[]}
 */
function realized30dChange(tree) {
  const r = tree.realized;
  return [
    baseline({
      metric: r.netRealizedPnlCumulative30dDelta,
      name: "30d Change",
      unit: Unit.usd,
    }),
    baseline({
      metric: r.netRealizedPnlCumulative30dDeltaRelToMarketCap,
      name: "30d Change",
      unit: Unit.pctMcap,
    }),
    baseline({
      metric: r.netRealizedPnlCumulative30dDeltaRelToRealizedCap,
      name: "30d Change",
      unit: Unit.pctRcap,
    }),
  ];
}

/**
 * Sent in profit/loss tree
 * @param {{ realized: AnyRealizedPattern }} tree
 * @param {(metric: string) => string} title
 * @returns {PartialOptionsTree}
 */
function sentInPnlTree(tree, title) {
  const r = tree.realized;
  return [
    {
      name: "Sum",
      title: title("Sent In Profit & Loss"),
      bottom: [
        ...satsBtcUsd({
          pattern: r.sentInProfit14dEma,
          name: "In Profit 14d EMA",
          color: colors.profit,
          defaultActive: false,
        }),
        ...satsBtcUsd({
          pattern: r.sentInLoss14dEma,
          name: "In Loss 14d EMA",
          color: colors.loss,
          defaultActive: false,
        }),
        ...satsBtcUsdFrom({
          source: r.sentInProfit,
          key: "sum",
          name: "In Profit",
          color: colors.profit,
        }),
        ...satsBtcUsdFrom({
          source: r.sentInLoss,
          key: "sum",
          name: "In Loss",
          color: colors.loss,
        }),
      ],
    },
    {
      name: "Cumulative",
      title: title("Cumulative Sent In Profit & Loss"),
      bottom: [
        ...satsBtcUsdFrom({
          source: r.sentInProfit,
          key: "cumulative",
          name: "In Profit",
          color: colors.profit,
        }),
        ...satsBtcUsdFrom({
          source: r.sentInLoss,
          key: "cumulative",
          name: "In Loss",
          color: colors.loss,
        }),
      ],
    },
  ];
>>>>>>> 69eb58f7 (chore: update website from upstream v0.1.5)
}

// ============================================================================
// Realized Subfolder Builders
// ============================================================================

/**
<<<<<<< HEAD
 * Full realized subfolder (All/STH/LTH)
 * @param {RealizedPattern | LthRealizedPattern} r
 * @param {(name: string) => string} title
 * @returns {PartialOptionsGroup}
 */
function realizedSubfolderFull(r, title) {
  return {
    name: "Realized",
    tree: [
      realizedOverviewFolder({
        profit: r.profit,
        loss: r.loss,
        netPnl: r.netPnl,
        grossPnl: r.grossPnl,
        peakRegret: r.peakRegret,
        title,
      }),
      realizedNetFolder({
        netPnl: r.netPnl,
        title,
        extraChange: [
          {
            name: "% of Market Cap",
            title: title("Net Realized P&L Change (% of Market Cap)"),
            bottom: percentRatioBaseline({
              pattern: r.netPnl.change1m.toMcap,
              name: "1m Change",
            }),
          },
          {
            name: "% of Realized Cap",
            title: title("Net Realized P&L Change (% of Realized Cap)"),
            bottom: percentRatioBaseline({
              pattern: r.netPnl.change1m.toRcap,
              name: "1m Change",
            }),
          },
        ],
      }),
      {
        name: "Profit",
        tree: realizedMetricFolder({
          pattern: r.profit,
          metricTitle: "Profit",
          color: colors.profit,
          title,
        }),
      },
      {
        name: "Loss",
        tree: realizedMetricFolder({
          pattern: r.loss,
          metricTitle: "Loss",
          color: colors.loss,
          title,
        }),
      },
      {
        name: "Gross",
        tree: realizedMetricFolder({
          pattern: r.grossPnl,
          metricTitle: "Gross P&L",
          color: colors.gross,
          title,
        }),
      },
      {
        name: "P/L Ratio",
        tree: [
          {
            name: "Compare",
            title: title("Realized P/L Ratio"),
            bottom: ROLLING_WINDOWS.map((w) =>
              baseline({
                series: r.profitToLossRatio[w.key],
                name: w.name,
                color: w.color,
                unit: Unit.ratio,
                base: 1,
              }),
            ),
          },
          ...ROLLING_WINDOWS.map((w) => ({
            name: w.name,
            title: title(`${w.title} Realized P/L Ratio`),
            bottom: [
              baseline({
                series: r.profitToLossRatio[w.key],
                name: "P/L Ratio",
                unit: Unit.ratio,
                base: 1,
              }),
            ],
          })),
=======
 * Base realized subfolder (no P/L ratio)
 * @param {{ realized: AnyRealizedPattern }} tree
 * @param {(metric: string) => string} title
 * @returns {PartialOptionsGroup}
 */
function realizedSubfolder(tree, title) {
  const r = tree.realized;
  return {
    name: "Realized",
    tree: [
      {
        name: "P&L",
        title: title("Realized P&L"),
        bottom: realizedPnlSum(tree),
      },
      {
        name: "Net",
        title: title("Net Realized P&L"),
        bottom: realizedNetPnlSum(tree),
      },
      {
        name: "30d Change",
        title: title("Realized P&L 30d Change"),
        bottom: realized30dChange(tree),
      },
      {
        name: "Total",
        title: title("Total Realized P&L"),
        bottom: [
          line({
            metric: r.totalRealizedPnl,
            name: "Total",
            unit: Unit.usd,
            color: colors.bitcoin,
          }),
>>>>>>> 69eb58f7 (chore: update website from upstream v0.1.5)
        ],
      },
      {
        name: "Peak Regret",
<<<<<<< HEAD
        tree: [
          {
            name: "Compare",
            title: title("Peak Regret"),
            bottom: ROLLING_WINDOWS.map((w) =>
              line({
                series: r.peakRegret.sum[w.key].usd,
                name: w.name,
                color: w.color,
                unit: Unit.usd,
              }),
            ),
          },
          ...ROLLING_WINDOWS.map((w) => ({
            name: w.name,
            title: title(`${w.title} Peak Regret`),
            bottom: [
              line({
                series: r.peakRegret.sum[w.key].usd,
                name: "Peak Regret",
                unit: Unit.usd,
              }),
            ],
          })),
          {
            name: "Cumulative",
            title: title("Cumulative Peak Regret"),
            bottom: [
              line({
                series: r.peakRegret.cumulative.usd,
                name: "Peak Regret",
                unit: Unit.usd,
=======
        title: title("Realized Peak Regret"),
        bottom: [
          line({
            metric: r.peakRegret.sum,
            name: "Peak Regret",
            unit: Unit.usd,
          }),
        ],
      },
      {
        name: "Cumulative",
        tree: [
          {
            name: "P&L",
            title: title("Cumulative Realized P&L"),
            bottom: realizedPnlCumulative(tree),
          },
          {
            name: "Net",
            title: title("Cumulative Net Realized P&L"),
            bottom: realizedNetPnlCumulative(tree),
          },
          {
            name: "Peak Regret",
            title: title("Cumulative Realized Peak Regret"),
            bottom: [
              line({
                metric: r.peakRegret.cumulative,
                name: "Peak Regret",
                unit: Unit.usd,
              }),
              line({
                metric: r.peakRegretRelToRealizedCap,
                name: "Peak Regret",
                unit: Unit.pctRcap,
>>>>>>> 69eb58f7 (chore: update website from upstream v0.1.5)
              }),
            ],
          },
        ],
      },
    ],
  };
}

/**
<<<<<<< HEAD
 * Mid realized subfolder (AgeRange/MaxAge — has netPnl + delta, no relToRcap/peakRegret)
 * @param {MidRealizedPattern} r
 * @param {(name: string) => string} title
 * @returns {PartialOptionsGroup}
 */
function realizedSubfolderMid(r, title) {
  return {
    name: "Realized",
    tree: [
      realizedOverviewFolder({
        profit: r.profit,
        loss: r.loss,
        netPnl: r.netPnl,
        title,
      }),
      realizedNetFolder({ netPnl: r.netPnl, title }),
      {
        name: "Profit",
        tree: realizedMetricFolder({
          pattern: r.profit,
          metricTitle: "Profit",
          color: colors.profit,
          title,
        }),
      },
      {
        name: "Loss",
        tree: realizedMetricFolder({
          pattern: r.loss,
          metricTitle: "Loss",
          color: colors.loss,
          title,
        }),
      },
    ],
  };
}

/**
 * Basic realized subfolder (no netPnl, no relToRcap)
 * @param {BasicRealizedPattern} r
 * @param {(name: string) => string} title
 * @returns {PartialOptionsGroup}
 */
function realizedSubfolderBasic(r, title) {
  return {
    name: "Realized",
    tree: [
      {
        name: "Profit",
        tree: realizedMetricFolder({
          pattern: r.profit,
          metricTitle: "Profit",
          color: colors.profit,
          title,
        }),
      },
      {
        name: "Loss",
        tree: realizedMetricFolder({
          pattern: r.loss,
          metricTitle: "Loss",
          color: colors.loss,
          title,
        }),
      },
    ],
  };
=======
 * Realized subfolder with P/L ratio
 * @param {{ realized: RealizedWithExtras }} tree
 * @param {(metric: string) => string} title
 * @returns {PartialOptionsGroup}
 */
function realizedSubfolderWithExtras(tree, title) {
  const base = realizedSubfolder(tree, title);
  const r = tree.realized;
  // Insert P/L Ratio after Total (index 3)
  base.tree.splice(4, 0, {
    name: "P/L Ratio",
    title: title("Realized Profit/Loss Ratio"),
    bottom: [
      baseline({
        metric: r.realizedProfitToLossRatio,
        name: "P/L Ratio",
        unit: Unit.ratio,
      }),
    ],
  });
  return base;
>>>>>>> 69eb58f7 (chore: update website from upstream v0.1.5)
}

// ============================================================================
// Single Cohort Section Builders
// ============================================================================

/**
<<<<<<< HEAD
 * Basic profitability section (NUPL only unrealized, basic realized)
 * @param {{ cohort: UtxoCohortObject, title: (name: string) => string }} args
 * @returns {PartialOptionsGroup}
 */
export function createProfitabilitySection({ cohort, title }) {
  return {
    name: "Profitability",
    tree: [
      { name: "Unrealized", tree: [{ name: "NUPL", title: title("NUPL"), bottom: nuplSeries(cohort.tree.unrealized.nupl) }] },
      realizedSubfolderBasic(cohort.tree.realized, title),
    ],
  };
}

/**
 * Profitability section with unrealized P&L + NUPL (no netPnl, no rel)
 * For: CohortWithoutRelative (p2ms, unknown, empty)
 * @param {{ cohort: CohortWithoutRelative, title: (name: string) => string }} args
 * @returns {PartialOptionsGroup}
 */
export function createProfitabilitySectionWithProfitLoss({ cohort, title }) {
  const u = cohort.tree.unrealized;
=======
 * Basic profitability section (USD only unrealized)
 * @param {{ cohort: UtxoCohortObject | CohortWithoutRelative, title: (metric: string) => string }} args
 * @returns {PartialOptionsGroup}
 */
export function createProfitabilitySection({ cohort, title }) {
  const { tree } = cohort;
  const m = getUnrealizedMetrics(tree);
>>>>>>> 69eb58f7 (chore: update website from upstream v0.1.5)
  return {
    name: "Profitability",
    tree: [
      {
        name: "Unrealized",
        tree: [
          {
<<<<<<< HEAD
            name: "Overview",
            title: title("Unrealized P&L"),
            bottom: [
              line({ series: u.profit.usd, name: "Profit", color: colors.profit, unit: Unit.usd }),
              line({ series: u.loss.negative, name: "Negated Loss", color: colors.loss, unit: Unit.usd }),
              line({ series: u.loss.usd, name: "Loss", color: colors.loss, unit: Unit.usd, defaultActive: false }),
              priceLine({ unit: Unit.usd }),
            ],
          },
          { name: "NUPL", title: title("NUPL"), bottom: nuplSeries(u.nupl) },
          {
            name: "Profit",
            title: title("Unrealized Profit"),
            bottom: [
              line({
                series: u.profit.usd,
                name: "Profit",
                color: colors.profit,
                unit: Unit.usd,
              }),
            ],
          },
          {
            name: "Loss",
            title: title("Unrealized Loss"),
            bottom: [
              line({
                series: u.loss.usd,
                name: "Loss",
                color: colors.loss,
                unit: Unit.usd,
              }),
            ],
          },
        ],
      },
      realizedSubfolderBasic(cohort.tree.realized, title),
=======
            name: "P&L",
            title: title("Unrealized P&L"),
            bottom: unrealizedUsd(m),
          },
          {
            name: "Net P&L",
            title: title("Net Unrealized P&L"),
            bottom: netUnrealizedUsd(m.net),
          },
        ],
      },
      realizedSubfolder(tree, title),
      volumeSubfolder(tree, title),
      {
        name: "Invested Capital",
        tree: [
          {
            name: "Absolute",
            title: title("Invested Capital In Profit & Loss"),
            bottom: investedCapitalAbsolute(tree),
          },
        ],
      },
      sentimentChart(tree, title),
>>>>>>> 69eb58f7 (chore: update website from upstream v0.1.5)
    ],
  };
}

/**
<<<<<<< HEAD
 * Section for All cohort
 * @param {{ cohort: CohortAll, title: (name: string) => string }} args
 * @returns {PartialOptionsGroup}
 */
export function createProfitabilitySectionAll({ cohort, title }) {
  const u = cohort.tree.unrealized;
  const r = cohort.tree.realized;
  return {
    name: "Profitability",
    tree: [
      { name: "Unrealized", tree: unrealizedTreeAll(u, title) },
      realizedSubfolderFull(r, title),
      {
        name: "Sentiment",
        title: title("Market Sentiment"),
        bottom: sentimentSeries(u),
      },
=======
 * Section with invested capital % but no unrealized relative (basic cohorts)
 * @param {{ cohort: CohortBasicWithoutMarketCap, title: (metric: string) => string }} args
 * @returns {PartialOptionsGroup}
 */
export function createProfitabilitySectionBasicWithInvestedCapitalPct({
  cohort,
  title,
}) {
  const { tree } = cohort;
  const m = getUnrealizedMetrics(tree);
  return {
    name: "Profitability",
    tree: [
      {
        name: "Unrealized",
        tree: [
          {
            name: "P&L",
            title: title("Unrealized P&L"),
            bottom: unrealizedUsd(m),
          },
          {
            name: "Net P&L",
            title: title("Net Unrealized P&L"),
            bottom: netUnrealizedUsd(m.net),
          },
        ],
      },
      realizedSubfolder(tree, title),
      volumeSubfolder(tree, title),
      {
        name: "Invested Capital",
        title: title("Invested Capital In Profit & Loss"),
        bottom: investedCapitalWithPct(tree),
      },
      sentimentChart(tree, title),
>>>>>>> 69eb58f7 (chore: update website from upstream v0.1.5)
    ],
  };
}

/**
<<<<<<< HEAD
 * Section for Full cohorts (STH)
 * @param {{ cohort: CohortFull, title: (name: string) => string }} args
 * @returns {PartialOptionsGroup}
 */
export function createProfitabilitySectionFull({ cohort, title }) {
  const u = cohort.tree.unrealized;
  const r = cohort.tree.realized;
  return {
    name: "Profitability",
    tree: [
      { name: "Unrealized", tree: unrealizedTreeFull(u, title) },
      realizedSubfolderFull(r, title),
      {
        name: "Sentiment",
        title: title("Market Sentiment"),
        bottom: sentimentSeries(u),
      },
    ],
  };
}


/**
 * Section for LongTerm cohort
 * @param {{ cohort: CohortLongTerm, title: (name: string) => string }} args
 * @returns {PartialOptionsGroup}
 */
export function createProfitabilitySectionLongTerm({ cohort, title }) {
  const u = cohort.tree.unrealized;
  const r = cohort.tree.realized;
  return {
    name: "Profitability",
    tree: [
      { name: "Unrealized", tree: unrealizedTreeLongTerm(u, title) },
      realizedSubfolderFull(r, title),
      {
        name: "Sentiment",
        title: title("Market Sentiment"),
        bottom: sentimentSeries(u),
      },
    ],
  };
}

/**
 * Section for AgeRange cohorts (mid-tier: has unrealized profit/loss/netPnl, mid realized)
 * @param {{ cohort: CohortAgeRange, title: (name: string) => string }} args
=======
 * Section for ageRange cohorts (Own M.Cap + Own P&L + peak regret)
 * @param {{ cohort: CohortAgeRange, title: (metric: string) => string }} args
>>>>>>> 69eb58f7 (chore: update website from upstream v0.1.5)
 * @returns {PartialOptionsGroup}
 */
export function createProfitabilitySectionWithInvestedCapitalPct({
  cohort,
  title,
}) {
<<<<<<< HEAD
  const u = cohort.tree.unrealized;
  const r = cohort.tree.realized;
  return {
    name: "Profitability",
    tree: [
      { name: "Unrealized", tree: unrealizedCore(u, title) },
      realizedSubfolderMid(r, title),
=======
  const { tree, color } = cohort;
  const m = getUnrealizedMetrics(tree);
  return {
    name: "Profitability",
    tree: [
      {
        name: "Unrealized",
        tree: [
          {
            name: "P&L",
            title: title("Unrealized P&L"),
            bottom: unrealizedWithOwnMarketCap(m, tree.relative),
          },
          {
            name: "Net P&L",
            title: title("Net Unrealized P&L"),
            bottom: netUnrealizedWithOwnMarketCap(m.net, tree.relative),
          },
          {
            name: "Peak Regret",
            title: title("Unrealized Peak Regret"),
            bottom: peakRegretAbsolute(tree, color),
          },
        ],
      },
      realizedSubfolderWithExtras(tree, title),
      volumeSubfolder(tree, title),
      {
        name: "Invested Capital",
        title: title("Invested Capital In Profit & Loss"),
        bottom: investedCapitalWithPct(tree),
      },
      sentimentChart(tree, title),
>>>>>>> 69eb58f7 (chore: update website from upstream v0.1.5)
    ],
  };
}

<<<<<<< HEAD

=======
/**
 * Section with NUPL (basic cohorts with market cap)
 * @param {{ cohort: CohortBasicWithMarketCap, title: (metric: string) => string }} args
 * @returns {PartialOptionsGroup}
 */
export function createProfitabilitySectionWithNupl({ cohort, title }) {
  const { tree } = cohort;
  const m = getUnrealizedMetrics(tree);
  return {
    name: "Profitability",
    tree: [
      {
        name: "Unrealized",
        tree: [
          {
            name: "P&L",
            title: title("Unrealized P&L"),
            bottom: unrealizedWithMarketCap(m, tree.relative),
          },
          {
            name: "Net P&L",
            title: title("Net Unrealized P&L"),
            bottom: netUnrealizedWithMarketCap(m.net, tree.relative),
          },
          {
            name: "NUPL",
            title: title("NUPL"),
            bottom: nuplSeries(tree.relative),
          },
        ],
      },
      realizedSubfolder(tree, title),
      volumeSubfolder(tree, title),
      {
        name: "Invested Capital",
        title: title("Invested Capital In Profit & Loss"),
        bottom: investedCapitalWithPct(tree),
      },
      sentimentChart(tree, title),
    ],
  };
}

/**
 * Section for LongTerm cohort
 * @param {{ cohort: CohortLongTerm, title: (metric: string) => string }} args
 * @returns {PartialOptionsGroup}
 */
export function createProfitabilitySectionLongTerm({ cohort, title }) {
  const { tree, color } = cohort;
  const m = getUnrealizedMetrics(tree);
  return {
    name: "Profitability",
    tree: [
      {
        name: "Unrealized",
        tree: [
          {
            name: "P&L",
            title: title("Unrealized P&L"),
            bottom: unrealizedLongTerm(m, tree.relative),
          },
          {
            name: "Net P&L",
            title: title("Net Unrealized P&L"),
            bottom: netUnrealizedWithOwnMarketCap(m.net, tree.relative),
          },
          {
            name: "NUPL",
            title: title("NUPL"),
            bottom: nuplSeries(tree.relative),
          },
          {
            name: "Peak Regret",
            title: title("Unrealized Peak Regret"),
            bottom: peakRegretWithMarketCap(tree, color),
          },
        ],
      },
      realizedSubfolderWithExtras(tree, title),
      volumeSubfolder(tree, title),
      {
        name: "Invested Capital",
        title: title("Invested Capital In Profit & Loss"),
        bottom: investedCapitalWithPct(tree),
      },
      sentimentChart(tree, title),
    ],
  };
}

/**
 * Section for Full cohorts (all relative metrics)
 * @param {{ cohort: CohortFull, title: (metric: string) => string }} args
 * @returns {PartialOptionsGroup}
 */
export function createProfitabilitySectionFull({ cohort, title }) {
  const { tree, color } = cohort;
  const m = getUnrealizedMetrics(tree);
  return {
    name: "Profitability",
    tree: [
      {
        name: "Unrealized",
        tree: [
          {
            name: "P&L",
            title: title("Unrealized P&L"),
            bottom: unrealizedFull(m, tree.relative),
          },
          {
            name: "Net P&L",
            title: title("Net Unrealized P&L"),
            bottom: netUnrealizedFull(m.net, tree.relative),
          },
          {
            name: "NUPL",
            title: title("NUPL"),
            bottom: nuplSeries(tree.relative),
          },
          {
            name: "Peak Regret",
            title: title("Unrealized Peak Regret"),
            bottom: peakRegretWithMarketCap(tree, color),
          },
        ],
      },
      realizedSubfolderWithExtras(tree, title),
      volumeSubfolder(tree, title),
      {
        name: "Invested Capital",
        title: title("Invested Capital In Profit & Loss"),
        bottom: investedCapitalWithPct(tree),
      },
      sentimentChart(tree, title),
    ],
  };
}

/**
 * Section for "all" cohort
 * @param {{ cohort: CohortAll, title: (metric: string) => string }} args
 * @returns {PartialOptionsGroup}
 */
export function createProfitabilitySectionAll({ cohort, title }) {
  const { tree, color } = cohort;
  const m = getUnrealizedMetrics(tree);
  return {
    name: "Profitability",
    tree: [
      {
        name: "Unrealized",
        tree: [
          {
            name: "P&L",
            title: title("Unrealized P&L"),
            bottom: unrealizedAll(m, tree.relative),
          },
          {
            name: "Net P&L",
            title: title("Net Unrealized P&L"),
            bottom: netUnrealizedAll(m.net, tree.relative),
          },
          {
            name: "NUPL",
            title: title("NUPL"),
            bottom: nuplSeries(tree.relative),
          },
          {
            name: "Peak Regret",
            title: title("Unrealized Peak Regret"),
            bottom: peakRegretWithMarketCap(tree, color),
          },
        ],
      },
      realizedSubfolderWithExtras(tree, title),
      volumeSubfolder(tree, title),
      {
        name: "Invested Capital",
        title: title("Invested Capital In Profit & Loss"),
        bottom: investedCapitalWithPct(tree),
      },
      sentimentChart(tree, title),
    ],
  };
}

/**
 * Section with Peak Regret + NUPL (minAge cohorts)
 * @param {{ cohort: CohortMinAge, title: (metric: string) => string }} args
 * @returns {PartialOptionsGroup}
 */
export function createProfitabilitySectionWithPeakRegret({ cohort, title }) {
  const { tree, color } = cohort;
  const m = getUnrealizedMetrics(tree);
  return {
    name: "Profitability",
    tree: [
      {
        name: "Unrealized",
        tree: [
          {
            name: "P&L",
            title: title("Unrealized P&L"),
            bottom: unrealizedWithMarketCap(m, tree.relative),
          },
          {
            name: "Net P&L",
            title: title("Net Unrealized P&L"),
            bottom: netUnrealizedWithMarketCap(m.net, tree.relative),
          },
          {
            name: "NUPL",
            title: title("NUPL"),
            bottom: nuplSeries(tree.relative),
          },
          {
            name: "Peak Regret",
            title: title("Unrealized Peak Regret"),
            bottom: peakRegretWithMarketCap(tree, color),
          },
        ],
      },
      realizedSubfolder(tree, title),
      volumeSubfolder(tree, title),
      {
        name: "Invested Capital",
        title: title("Invested Capital In Profit & Loss"),
        bottom: investedCapitalWithPct(tree),
      },
      sentimentChart(tree, title),
    ],
  };
}
>>>>>>> 69eb58f7 (chore: update website from upstream v0.1.5)

// ============================================================================
// Grouped Cohort Helpers
// ============================================================================

/**
<<<<<<< HEAD
 * Grouped realized subfolder (basic)
 * @template {{ name: string, color: Color, tree: { realized: { profit: RealizedProfitLossPattern, loss: RealizedProfitLossPattern } } }} T
 * @template {{ name: string, color: Color, tree: { realized: { profit: RealizedProfitLossPattern, loss: RealizedProfitLossPattern } } }} A
 * @param {readonly T[]} list
 * @param {A} all
 * @param {(name: string) => string} title
 * @returns {PartialOptionsGroup}
 */
/**
 * Grouped realized profit + loss items
 * @param {readonly UtxoCohortObject[]} list
 * @param {CohortAll} all
 * @param {(name: string) => string} title
 * @returns {PartialOptionsTree}
 */
function groupedRealizedProfitLossItems(list, all, title) {
  return [
    { name: "Profit", tree: groupedWindowsCumulativeUsd({ list, all, title, metricTitle: "Realized Profit", getMetric: (c) => c.tree.realized.profit }) },
    { name: "Loss", tree: groupedWindowsCumulativeUsd({ list, all, title, metricTitle: "Realized Loss", getMetric: (c) => c.tree.realized.loss }) },
=======
 * Grouped P&L charts (USD only)
 * @param {readonly CohortObject[]} list
 * @param {CohortAll} all
 * @param {(metric: string) => string} title
 * @returns {PartialOptionsTree}
 */
function groupedPnlCharts(list, all, title) {
  return [
    {
      name: "Profit",
      title: title("Unrealized Profit"),
      bottom: mapCohortsWithAll(list, all, ({ name, color, tree }) =>
        line({
          metric: tree.unrealized.unrealizedProfit,
          name,
          color,
          unit: Unit.usd,
        }),
      ),
    },
    {
      name: "Loss",
      title: title("Unrealized Loss"),
      bottom: mapCohortsWithAll(list, all, ({ name, color, tree }) =>
        line({
          metric: tree.unrealized.negUnrealizedLoss,
          name,
          color,
          unit: Unit.usd,
        }),
      ),
    },
    {
      name: "Net P&L",
      title: title("Net Unrealized P&L"),
      bottom: mapCohortsWithAll(list, all, ({ name, color, tree }) =>
        baseline({
          metric: tree.unrealized.netUnrealizedPnl,
          name,
          color,
          unit: Unit.usd,
        }),
      ),
    },
>>>>>>> 69eb58f7 (chore: update website from upstream v0.1.5)
  ];
}

/**
<<<<<<< HEAD
 * Grouped realized net item
 * @param {readonly (CohortAgeRange | CohortWithAdjusted | CohortAll | CohortFull | CohortLongTerm)[]} list
 * @param {CohortAll} all
 * @param {(name: string) => string} title
 * @returns {PartialOptionsGroup}
 */
function groupedRealizedNetItem(list, all, title) {
  return { name: "Net", tree: groupedWindowsCumulativeUsd({ list, all, title, metricTitle: "Net Realized P&L", getMetric: (c) => c.tree.realized.netPnl, seriesFn: baseline }) };
}

/**
 * @param {readonly UtxoCohortObject[]} list
 * @param {CohortAll} all
 * @param {(name: string) => string} title
 * @returns {PartialOptionsGroup}
 */
function groupedRealizedSubfolder(list, all, title) {
  return { name: "Realized", tree: groupedRealizedProfitLossItems(list, all, title) };
}

/**
 * @param {readonly (CohortAgeRange | CohortWithAdjusted)[]} list
 * @param {CohortAll} all
 * @param {(name: string) => string} title
 * @returns {PartialOptionsGroup}
 */
function groupedRealizedSubfolderMid(list, all, title) {
  return { name: "Realized", tree: [groupedRealizedNetItem(list, all, title), ...groupedRealizedProfitLossItems(list, all, title)] };
}

/**
 * Grouped net realized P&L delta (Absolute + Rate with all rolling windows)
 * @param {readonly (CohortAll | CohortFull | CohortLongTerm)[]} list
 * @param {CohortAll} all
 * @param {(name: string) => string} title
 * @returns {PartialOptionsTree}
 */
function groupedRealizedNetPnlDeltaItems(list, all, title) {
  return [
    {
      name: "Change",
      tree: ROLLING_WINDOWS.map((w) => ({
        name: w.name,
        title: title(`${w.title} Net Realized P&L Change`),
        bottom: mapCohortsWithAll(list, all, ({ name, color, tree }) =>
          baseline({
            series: tree.realized.netPnl.delta.absolute[w.key].usd,
=======
 * Grouped P&L with % of Market Cap
 * @param {readonly (CohortFull | CohortBasicWithMarketCap | CohortMinAge | CohortLongTerm)[]} list
 * @param {CohortAll} all
 * @param {(metric: string) => string} title
 * @returns {PartialOptionsTree}
 */
function groupedPnlChartsWithMarketCap(list, all, title) {
  return [
    {
      name: "Profit",
      title: title("Unrealized Profit"),
      bottom: [
        ...mapCohortsWithAll(list, all, ({ name, color, tree }) =>
          line({
            metric: tree.unrealized.unrealizedProfit,
>>>>>>> 69eb58f7 (chore: update website from upstream v0.1.5)
            name,
            color,
            unit: Unit.usd,
          }),
        ),
<<<<<<< HEAD
      })),
    },
    {
      name: "Growth Rate",
      tree: ROLLING_WINDOWS.map((w) => ({
        name: w.name,
        title: title(`${w.title} Net Realized P&L Growth Rate`),
        bottom: flatMapCohortsWithAll(list, all, ({ name, color, tree }) =>
          percentRatioBaseline({
            pattern: tree.realized.netPnl.delta.rate[w.key],
            name,
            color,
          }),
        ),
      })),
=======
        ...mapCohortsWithAll(list, all, ({ name, color, tree }) =>
          baseline({
            metric: tree.relative.unrealizedProfitRelToMarketCap,
            name,
            color,
            unit: Unit.pctMcap,
          }),
        ),
      ],
    },
    {
      name: "Loss",
      title: title("Unrealized Loss"),
      bottom: [
        ...mapCohortsWithAll(list, all, ({ name, color, tree }) =>
          line({
            metric: tree.unrealized.negUnrealizedLoss,
            name,
            color,
            unit: Unit.usd,
          }),
        ),
        ...mapCohortsWithAll(list, all, ({ name, color, tree }) =>
          baseline({
            metric: tree.relative.negUnrealizedLossRelToMarketCap,
            name,
            color,
            unit: Unit.pctMcap,
          }),
        ),
      ],
    },
    {
      name: "Net P&L",
      title: title("Net Unrealized P&L"),
      bottom: [
        ...mapCohortsWithAll(list, all, ({ name, color, tree }) =>
          baseline({
            metric: tree.unrealized.netUnrealizedPnl,
            name,
            color,
            unit: Unit.usd,
          }),
        ),
        ...mapCohortsWithAll(list, all, ({ name, color, tree }) =>
          baseline({
            metric: tree.relative.netUnrealizedPnlRelToMarketCap,
            name,
            color,
            unit: Unit.pctMcap,
          }),
        ),
      ],
>>>>>>> 69eb58f7 (chore: update website from upstream v0.1.5)
    },
  ];
}

/**
<<<<<<< HEAD
 * Grouped realized subfolder for full cohorts
 * @param {readonly (CohortAll | CohortFull | CohortLongTerm)[]} list
 * @param {CohortAll} all
 * @param {(name: string) => string} title
 * @returns {PartialOptionsGroup}
 */
function groupedRealizedSubfolderFull(list, all, title) {
  return {
    name: "Realized",
    tree: [
      {
        name: "Net",
        tree: [
          ...groupedWindowsCumulativeUsd({
            list,
            all,
            title,
            metricTitle: "Net Realized P&L",
            getMetric: (c) => c.tree.realized.netPnl,
            seriesFn: baseline,
          }),
          ...groupedRealizedNetPnlDeltaItems(list, all, title),
        ],
      },
      ...groupedRealizedProfitLossItems(list, all, title),
      {
        name: "Gross",
        tree: groupedWindowsCumulativeUsd({
          list,
          all,
          title,
          metricTitle: "Realized Gross P&L",
          getMetric: (c) => c.tree.realized.grossPnl,
        }),
      },
      {
        name: "P/L Ratio",
        tree: ROLLING_WINDOWS.map((w) => ({
          name: w.name,
          title: title(`${w.title} Realized P/L Ratio`),
          bottom: mapCohortsWithAll(list, all, (c) =>
            baseline({
              series: c.tree.realized.profitToLossRatio[w.key],
              name: c.name,
              color: c.color,
              unit: Unit.ratio,
              base: 1,
            }),
          ),
        })),
      },
      {
        name: "Peak Regret",
        tree: groupedWindowsCumulativeUsd({
          list,
          all,
          title,
          metricTitle: "Peak Regret",
          getMetric: (c) => c.tree.realized.peakRegret,
        }),
      },
    ],
  };
}

/**
 * Grouped NUPL chart
 * @template {{ name: string, color: Color, tree: { unrealized: { nupl: NuplPattern } } }} T
 * @template {{ name: string, color: Color, tree: { unrealized: { nupl: NuplPattern } } }} A
 * @param {readonly T[]} list
 * @param {A} all
 * @param {(name: string) => string} title
 * @returns {PartialOptionsTree}
 */
function groupedNuplCharts(list, all, title) {
  return [
    {
      name: "NUPL",
      title: title("NUPL"),
      bottom: mapCohortsWithAll(list, all, ({ name, color, tree }) =>
        baseline({
          series: tree.unrealized.nupl.ratio,
=======
 * Grouped P&L with % of Own Market Cap
 * @param {readonly CohortAgeRange[]} list
 * @param {CohortAll} all
 * @param {(metric: string) => string} title
 * @returns {PartialOptionsTree}
 */
function groupedPnlChartsWithOwnMarketCap(list, all, title) {
  return [
    {
      name: "Profit",
      title: title("Unrealized Profit"),
      bottom: [
        ...mapCohortsWithAll(list, all, ({ name, color, tree }) =>
          line({
            metric: tree.unrealized.unrealizedProfit,
            name,
            color,
            unit: Unit.usd,
          }),
        ),
        // OwnMarketCap properties don't exist on CohortAll - use mapCohorts
        ...mapCohorts(list, ({ name, color, tree }) =>
          line({
            metric: tree.relative.unrealizedProfitRelToOwnMarketCap,
            name,
            color,
            unit: Unit.pctOwnMcap,
          }),
        ),
        ...mapCohortsWithAll(list, all, ({ name, color, tree }) =>
          line({
            metric: tree.relative.unrealizedProfitRelToOwnTotalUnrealizedPnl,
            name,
            color,
            unit: Unit.pctOwnPnl,
          }),
        ),
      ],
    },
    {
      name: "Loss",
      title: title("Unrealized Loss"),
      bottom: [
        ...mapCohortsWithAll(list, all, ({ name, color, tree }) =>
          line({
            metric: tree.unrealized.negUnrealizedLoss,
            name,
            color,
            unit: Unit.usd,
          }),
        ),
        // OwnMarketCap properties don't exist on CohortAll - use mapCohorts
        ...mapCohorts(list, ({ name, color, tree }) =>
          line({
            metric: tree.relative.negUnrealizedLossRelToOwnMarketCap,
            name,
            color,
            unit: Unit.pctOwnMcap,
          }),
        ),
        ...mapCohortsWithAll(list, all, ({ name, color, tree }) =>
          line({
            metric: tree.relative.negUnrealizedLossRelToOwnTotalUnrealizedPnl,
            name,
            color,
            unit: Unit.pctOwnPnl,
          }),
        ),
      ],
    },
    {
      name: "Net P&L",
      title: title("Net Unrealized P&L"),
      bottom: [
        ...mapCohortsWithAll(list, all, ({ name, color, tree }) =>
          baseline({
            metric: tree.unrealized.netUnrealizedPnl,
            name,
            color,
            unit: Unit.usd,
          }),
        ),
        // OwnMarketCap properties don't exist on CohortAll - use mapCohorts
        ...mapCohorts(list, ({ name, color, tree }) =>
          baseline({
            metric: tree.relative.netUnrealizedPnlRelToOwnMarketCap,
            name,
            color,
            unit: Unit.pctOwnMcap,
          }),
        ),
        ...mapCohortsWithAll(list, all, ({ name, color, tree }) =>
          baseline({
            metric: tree.relative.netUnrealizedPnlRelToOwnTotalUnrealizedPnl,
            name,
            color,
            unit: Unit.pctOwnPnl,
          }),
        ),
      ],
    },
  ];
}

/**
 * Grouped P&L for LongTerm cohorts
 * @param {readonly CohortLongTerm[]} list
 * @param {CohortAll} all
 * @param {(metric: string) => string} title
 * @returns {PartialOptionsTree}
 */
function groupedPnlChartsLongTerm(list, all, title) {
  return [
    {
      name: "Profit",
      title: title("Unrealized Profit"),
      bottom: [
        ...mapCohortsWithAll(list, all, ({ name, color, tree }) =>
          line({
            metric: tree.unrealized.unrealizedProfit,
            name,
            color,
            unit: Unit.usd,
          }),
        ),
        // OwnMarketCap properties don't exist on CohortAll - use mapCohorts
        ...mapCohorts(list, ({ name, color, tree }) =>
          line({
            metric: tree.relative.unrealizedProfitRelToOwnMarketCap,
            name,
            color,
            unit: Unit.pctOwnMcap,
          }),
        ),
        ...mapCohortsWithAll(list, all, ({ name, color, tree }) =>
          line({
            metric: tree.relative.unrealizedProfitRelToOwnTotalUnrealizedPnl,
            name,
            color,
            unit: Unit.pctOwnPnl,
          }),
        ),
      ],
    },
    {
      name: "Loss",
      title: title("Unrealized Loss"),
      bottom: [
        ...mapCohortsWithAll(list, all, ({ name, color, tree }) =>
          line({
            metric: tree.unrealized.negUnrealizedLoss,
            name,
            color,
            unit: Unit.usd,
          }),
        ),
        ...mapCohortsWithAll(list, all, ({ name, color, tree }) =>
          line({
            metric: tree.relative.unrealizedLossRelToMarketCap,
            name,
            color,
            unit: Unit.pctMcap,
          }),
        ),
        // OwnMarketCap properties don't exist on CohortAll - use mapCohorts
        ...mapCohorts(list, ({ name, color, tree }) =>
          line({
            metric: tree.relative.negUnrealizedLossRelToOwnMarketCap,
            name,
            color,
            unit: Unit.pctOwnMcap,
          }),
        ),
        ...mapCohortsWithAll(list, all, ({ name, color, tree }) =>
          line({
            metric: tree.relative.negUnrealizedLossRelToOwnTotalUnrealizedPnl,
            name,
            color,
            unit: Unit.pctOwnPnl,
          }),
        ),
      ],
    },
    {
      name: "Net P&L",
      title: title("Net Unrealized P&L"),
      bottom: [
        ...mapCohortsWithAll(list, all, ({ name, color, tree }) =>
          baseline({
            metric: tree.unrealized.netUnrealizedPnl,
            name,
            color,
            unit: Unit.usd,
          }),
        ),
        // OwnMarketCap properties don't exist on CohortAll - use mapCohorts
        ...mapCohorts(list, ({ name, color, tree }) =>
          baseline({
            metric: tree.relative.netUnrealizedPnlRelToOwnMarketCap,
            name,
            color,
            unit: Unit.pctOwnMcap,
          }),
        ),
        ...mapCohortsWithAll(list, all, ({ name, color, tree }) =>
          baseline({
            metric: tree.relative.netUnrealizedPnlRelToOwnTotalUnrealizedPnl,
            name,
            color,
            unit: Unit.pctOwnPnl,
          }),
        ),
      ],
    },
  ];
}

/**
 * Grouped invested capital (absolute only)
 * @param {readonly CohortObject[]} list
 * @param {CohortAll} all
 * @param {(metric: string) => string} title
 * @returns {PartialOptionsTree}
 */
function groupedInvestedCapitalAbsolute(list, all, title) {
  return [
    {
      name: "In Profit",
      title: title("Invested Capital In Profit"),
      bottom: mapCohortsWithAll(list, all, ({ name, color, tree }) =>
        line({
          metric: tree.unrealized.investedCapitalInProfit,
          name,
          color,
          unit: Unit.usd,
        }),
      ),
    },
    {
      name: "In Loss",
      title: title("Invested Capital In Loss"),
      bottom: mapCohortsWithAll(list, all, ({ name, color, tree }) =>
        line({
          metric: tree.unrealized.investedCapitalInLoss,
          name,
          color,
          unit: Unit.usd,
        }),
      ),
    },
  ];
}

/**
 * Grouped invested capital with %
 * @param {readonly (CohortBasicWithoutMarketCap | CohortAgeRange | CohortFull | CohortBasicWithMarketCap | CohortLongTerm | CohortMinAge)[]} list
 * @param {CohortAll} all
 * @param {(metric: string) => string} title
 * @returns {PartialOptionsTree}
 */
function groupedInvestedCapital(list, all, title) {
  return [
    {
      name: "In Profit",
      title: title("Invested Capital In Profit"),
      bottom: [
        ...mapCohortsWithAll(list, all, ({ name, color, tree }) =>
          line({
            metric: tree.unrealized.investedCapitalInProfit,
            name,
            color,
            unit: Unit.usd,
          }),
        ),
        ...mapCohortsWithAll(list, all, ({ name, color, tree }) =>
          baseline({
            metric: tree.relative.investedCapitalInProfitPct,
            name,
            color,
            unit: Unit.pctOwnRcap,
          }),
        ),
        ...priceLines({ numbers: [100, 50], unit: Unit.pctOwnRcap }),
      ],
    },
    {
      name: "In Loss",
      title: title("Invested Capital In Loss"),
      bottom: [
        ...mapCohortsWithAll(list, all, ({ name, color, tree }) =>
          line({
            metric: tree.unrealized.investedCapitalInLoss,
            name,
            color,
            unit: Unit.usd,
          }),
        ),
        ...mapCohortsWithAll(list, all, ({ name, color, tree }) =>
          baseline({
            metric: tree.relative.investedCapitalInLossPct,
            name,
            color,
            unit: Unit.pctOwnRcap,
          }),
        ),
        ...priceLines({ numbers: [100, 50], unit: Unit.pctOwnRcap }),
      ],
    },
  ];
}

/**
 * Grouped realized P&L sum
 * @param {readonly CohortObject[]} list
 * @param {CohortAll} all
 * @param {(metric: string) => string} title
 * @returns {PartialOptionsTree}
 */
function groupedRealizedPnlSum(list, all, title) {
  return [
    {
      name: "Profit",
      title: title("Realized Profit"),
      bottom: mapCohortsWithAll(list, all, ({ name, color, tree }) =>
        line({
          metric: tree.realized.realizedProfit.sum,
          name,
          color,
          unit: Unit.usd,
        }),
      ),
    },
    {
      name: "Loss",
      title: title("Realized Loss"),
      bottom: mapCohortsWithAll(list, all, ({ name, color, tree }) =>
        line({
          metric: tree.realized.negRealizedLoss.sum,
          name,
          color,
          unit: Unit.usd,
        }),
      ),
    },
    {
      name: "Total",
      title: title("Total Realized P&L"),
      bottom: mapCohortsWithAll(list, all, ({ name, color, tree }) =>
        line({
          metric: tree.realized.totalRealizedPnl,
          name,
          color,
          unit: Unit.usd,
        }),
      ),
    },
    {
      name: "Value",
      title: title("Realized Value"),
      bottom: mapCohortsWithAll(list, all, ({ name, color, tree }) =>
        line({
          metric: tree.realized.realizedValue,
          name,
          color,
          unit: Unit.usd,
        }),
      ),
    },
  ];
}

/**
 * Grouped realized P&L sum with P/L ratio
 * @param {readonly (CohortAgeRange | CohortLongTerm | CohortAll | CohortFull)[]} list
 * @param {CohortAll} all
 * @param {(metric: string) => string} title
 * @returns {PartialOptionsTree}
 */
function groupedRealizedPnlSumWithExtras(list, all, title) {
  return [
    ...groupedRealizedPnlSum(list, all, title),
    {
      name: "P/L Ratio",
      title: title("Realized Profit/Loss Ratio"),
      bottom: mapCohortsWithAll(list, all, ({ name, color, tree }) =>
        baseline({
          metric: tree.realized.realizedProfitToLossRatio,
>>>>>>> 69eb58f7 (chore: update website from upstream v0.1.5)
          name,
          color,
          unit: Unit.ratio,
        }),
      ),
    },
  ];
}

/**
<<<<<<< HEAD
 * Grouped unrealized: Net → NUPL → Profit → Loss (no relative)
 * @param {readonly (CohortAgeRange | CohortWithAdjusted)[]} list
 * @param {CohortAll} all
 * @param {(name: string) => string} title
 * @returns {PartialOptionsTree}
 */
function groupedUnrealizedMid(list, all, title) {
  return [
    {
      name: "Net",
      title: title("Net Unrealized P&L"),
      bottom: mapCohortsWithAll(list, all, ({ name, color, tree }) =>
        baseline({
          series: tree.unrealized.netPnl.usd,
          name,
          color,
          unit: Unit.usd,
        }),
      ),
    },
    ...groupedNuplCharts(list, all, title),
    {
      name: "Profit",
      title: title("Unrealized Profit"),
      bottom: mapCohortsWithAll(list, all, ({ name, color, tree }) =>
        line({
          series: tree.unrealized.profit.usd,
=======
 * Grouped realized cumulative
 * @param {readonly CohortObject[]} list
 * @param {CohortAll} all
 * @param {(metric: string) => string} title
 * @returns {PartialOptionsTree}
 */
function groupedRealizedPnlCumulative(list, all, title) {
  return [
    {
      name: "Profit",
      title: title("Cumulative Realized Profit"),
      bottom: mapCohortsWithAll(list, all, ({ name, color, tree }) =>
        line({
          metric: tree.realized.realizedProfit.cumulative,
>>>>>>> 69eb58f7 (chore: update website from upstream v0.1.5)
          name,
          color,
          unit: Unit.usd,
        }),
      ),
    },
    {
      name: "Loss",
<<<<<<< HEAD
      title: title("Unrealized Loss"),
      bottom: mapCohortsWithAll(list, all, ({ name, color, tree }) =>
        line({ series: tree.unrealized.loss.usd, name, color, unit: Unit.usd }),
=======
      title: title("Cumulative Realized Loss"),
      bottom: mapCohortsWithAll(list, all, ({ name, color, tree }) =>
        line({
          metric: tree.realized.negRealizedLoss.cumulative,
          name,
          color,
          unit: Unit.usd,
        }),
>>>>>>> 69eb58f7 (chore: update website from upstream v0.1.5)
      ),
    },
  ];
}

/**
<<<<<<< HEAD
 * Grouped unrealized: Net → NUPL → Profit → Loss → Relative(Market Cap)
 * @param {readonly (CohortFull | CohortLongTerm)[]} list
 * @param {CohortAll} all
 * @param {(name: string) => string} title
 * @returns {PartialOptionsTree}
 */
function groupedUnrealizedWithMarketCap(list, all, title) {
  return [
    ...groupedUnrealizedMid(list, all, title),
    {
      name: "% of Market Cap",
      tree: [
        {
          name: "Profit",
          title: title("Unrealized Profit (% of Market Cap)"),
          bottom: flatMapCohortsWithAll(list, all, ({ name, color, tree }) =>
            percentRatio({
              pattern: tree.unrealized.profit.toMcap,
=======
 * Grouped sent in P/L
 * @param {readonly CohortObject[]} list
 * @param {CohortAll} all
 * @param {(metric: string) => string} title
 * @returns {PartialOptionsTree}
 */
function groupedSentInPnl(list, all, title) {
  return [
    {
      name: "Sum",
      tree: [
        {
          name: "In Profit",
          title: title("Sent In Profit"),
          bottom: [
            ...flatMapCohortsWithAll(list, all, ({ name, color, tree }) =>
              satsBtcUsd({
                pattern: tree.realized.sentInProfit14dEma,
                name: `${name} 14d EMA`,
                color,
                defaultActive: false,
              }),
            ),
            ...flatMapCohortsWithAll(list, all, ({ name, color, tree }) =>
              satsBtcUsdFrom({
                source: tree.realized.sentInProfit,
                key: "sum",
                name,
                color,
              }),
            ),
          ],
        },
        {
          name: "In Loss",
          title: title("Sent In Loss"),
          bottom: [
            ...flatMapCohortsWithAll(list, all, ({ name, color, tree }) =>
              satsBtcUsd({
                pattern: tree.realized.sentInLoss14dEma,
                name: `${name} 14d EMA`,
                color,
                defaultActive: false,
              }),
            ),
            ...flatMapCohortsWithAll(list, all, ({ name, color, tree }) =>
              satsBtcUsdFrom({
                source: tree.realized.sentInLoss,
                key: "sum",
                name,
                color,
              }),
            ),
          ],
        },
      ],
    },
    {
      name: "Cumulative",
      tree: [
        {
          name: "In Profit",
          title: title("Cumulative Sent In Profit"),
          bottom: flatMapCohortsWithAll(list, all, ({ name, color, tree }) =>
            satsBtcUsdFrom({
              source: tree.realized.sentInProfit,
              key: "cumulative",
>>>>>>> 69eb58f7 (chore: update website from upstream v0.1.5)
              name,
              color,
            }),
          ),
        },
        {
<<<<<<< HEAD
          name: "Loss",
          title: title("Unrealized Loss (% of Market Cap)"),
          bottom: flatMapCohortsWithAll(list, all, ({ name, color, tree }) =>
            percentRatio({ pattern: tree.unrealized.loss.toMcap, name, color }),
=======
          name: "In Loss",
          title: title("Cumulative Sent In Loss"),
          bottom: flatMapCohortsWithAll(list, all, ({ name, color, tree }) =>
            satsBtcUsdFrom({
              source: tree.realized.sentInLoss,
              key: "cumulative",
              name,
              color,
            }),
>>>>>>> 69eb58f7 (chore: update website from upstream v0.1.5)
          ),
        },
      ],
    },
  ];
}

/**
<<<<<<< HEAD
 * Grouped sentiment (full unrealized only)
 * @param {readonly (CohortAll | CohortFull | CohortLongTerm)[]} list
 * @param {CohortAll} all
 * @param {(name: string) => string} title
=======
 * Grouped sentiment
 * @param {readonly CohortObject[]} list
 * @param {CohortAll} all
 * @param {(metric: string) => string} title
>>>>>>> 69eb58f7 (chore: update website from upstream v0.1.5)
 * @returns {PartialOptionsGroup}
 */
function groupedSentiment(list, all, title) {
  return {
    name: "Sentiment",
    tree: [
      {
        name: "Net",
        title: title("Net Sentiment"),
        bottom: mapCohortsWithAll(list, all, ({ name, color, tree }) =>
          baseline({
<<<<<<< HEAD
            series: tree.unrealized.sentiment.net.usd,
=======
            metric: tree.unrealized.netSentiment,
>>>>>>> 69eb58f7 (chore: update website from upstream v0.1.5)
            name,
            color,
            unit: Unit.usd,
          }),
        ),
      },
      {
        name: "Greed",
        title: title("Greed Index"),
        bottom: mapCohortsWithAll(list, all, ({ name, color, tree }) =>
          line({
<<<<<<< HEAD
            series: tree.unrealized.sentiment.greedIndex.usd,
=======
            metric: tree.unrealized.greedIndex,
>>>>>>> 69eb58f7 (chore: update website from upstream v0.1.5)
            name,
            color,
            unit: Unit.usd,
          }),
        ),
      },
      {
        name: "Pain",
        title: title("Pain Index"),
        bottom: mapCohortsWithAll(list, all, ({ name, color, tree }) =>
          line({
<<<<<<< HEAD
            series: tree.unrealized.sentiment.painIndex.usd,
=======
            metric: tree.unrealized.painIndex,
>>>>>>> 69eb58f7 (chore: update website from upstream v0.1.5)
            name,
            color,
            unit: Unit.usd,
          }),
        ),
      },
    ],
  };
}

<<<<<<< HEAD
// ============================================================================
// Grouped Section Builders
// ============================================================================

/**
 * Grouped profitability section (basic — NUPL only)
 * @param {{ list: readonly (UtxoCohortObject | CohortWithoutRelative)[], all: CohortAll, title: (name: string) => string }} args
 * @returns {PartialOptionsGroup}
 */
export function createGroupedProfitabilitySection({ list, all, title }) {
  return {
    name: "Profitability",
    tree: [
      { name: "Unrealized", tree: groupedNuplCharts(list, all, title) },
      groupedRealizedSubfolder(list, all, title),
    ],
  };
}

/**
 * Grouped profitability with unrealized profit/loss + NUPL
 * For: CohortWithoutRelative (p2ms, unknown, empty)
 * @param {{ list: readonly CohortWithoutRelative[], all: CohortAll, title: (name: string) => string }} args
 * @returns {PartialOptionsGroup}
 */
export function createGroupedProfitabilitySectionWithProfitLoss({
  list,
  all,
  title,
}) {
  return {
    name: "Profitability",
    tree: [
      {
        name: "Unrealized",
        tree: [
          ...groupedNuplCharts(list, all, title),
          {
            name: "Profit",
            title: title("Unrealized Profit"),
            bottom: mapCohortsWithAll(list, all, ({ name, color, tree }) =>
              line({
                series: tree.unrealized.profit.usd,
                name,
                color,
                unit: Unit.usd,
              }),
            ),
          },
          {
            name: "Loss",
            title: title("Unrealized Loss"),
            bottom: mapCohortsWithAll(list, all, ({ name, color, tree }) =>
              line({
                series: tree.unrealized.loss.usd,
=======
/**
 * Grouped realized subfolder
 * @param {readonly CohortObject[]} list
 * @param {CohortAll} all
 * @param {(metric: string) => string} title
 * @returns {PartialOptionsGroup}
 */
function groupedRealizedSubfolder(list, all, title) {
  return {
    name: "Realized",
    tree: [
      { name: "P&L", tree: groupedRealizedPnlSum(list, all, title) },
      {
        name: "Net",
        title: title("Net Realized P&L"),
        bottom: mapCohortsWithAll(list, all, ({ name, color, tree }) =>
          baseline({
            metric: tree.realized.netRealizedPnl.sum,
            name,
            color,
            unit: Unit.usd,
          }),
        ),
      },
      {
        name: "30d Change",
        title: title("Realized P&L 30d Change"),
        bottom: mapCohortsWithAll(list, all, ({ name, color, tree }) =>
          baseline({
            metric: tree.realized.netRealizedPnlCumulative30dDelta,
            name,
            color,
            unit: Unit.usd,
          }),
        ),
      },
      {
        name: "Cumulative",
        tree: [
          { name: "P&L", tree: groupedRealizedPnlCumulative(list, all, title) },
          {
            name: "Net",
            title: title("Cumulative Net Realized P&L"),
            bottom: mapCohortsWithAll(list, all, ({ name, color, tree }) =>
              baseline({
                metric: tree.realized.netRealizedPnl.cumulative,
>>>>>>> 69eb58f7 (chore: update website from upstream v0.1.5)
                name,
                color,
                unit: Unit.usd,
              }),
            ),
          },
        ],
      },
<<<<<<< HEAD
      groupedRealizedSubfolder(list, all, title),
=======
>>>>>>> 69eb58f7 (chore: update website from upstream v0.1.5)
    ],
  };
}

<<<<<<< HEAD

/**
 * Grouped section for ageRange/maxAge cohorts
 * @param {{ list: readonly (CohortAgeRange | CohortWithAdjusted)[], all: CohortAll, title: (name: string) => string }} args
=======
/**
 * Grouped realized with extras
 * @param {readonly (CohortAgeRange | CohortLongTerm | CohortAll | CohortFull)[]} list
 * @param {CohortAll} all
 * @param {(metric: string) => string} title
 * @returns {PartialOptionsGroup}
 */
function groupedRealizedSubfolderWithExtras(list, all, title) {
  return {
    name: "Realized",
    tree: [
      { name: "P&L", tree: groupedRealizedPnlSumWithExtras(list, all, title) },
      {
        name: "Net",
        title: title("Net Realized P&L"),
        bottom: mapCohortsWithAll(list, all, ({ name, color, tree }) =>
          baseline({
            metric: tree.realized.netRealizedPnl.sum,
            name,
            color,
            unit: Unit.usd,
          }),
        ),
      },
      {
        name: "30d Change",
        title: title("Realized P&L 30d Change"),
        bottom: mapCohortsWithAll(list, all, ({ name, color, tree }) =>
          baseline({
            metric: tree.realized.netRealizedPnlCumulative30dDelta,
            name,
            color,
            unit: Unit.usd,
          }),
        ),
      },
      {
        name: "Cumulative",
        tree: [
          { name: "P&L", tree: groupedRealizedPnlCumulative(list, all, title) },
          {
            name: "Net",
            title: title("Cumulative Net Realized P&L"),
            bottom: mapCohortsWithAll(list, all, ({ name, color, tree }) =>
              baseline({
                metric: tree.realized.netRealizedPnl.cumulative,
                name,
                color,
                unit: Unit.usd,
              }),
            ),
          },
        ],
      },
    ],
  };
}

// ============================================================================
// Grouped Section Builders
// ============================================================================

/**
 * Grouped profitability section (basic)
 * @param {{ list: readonly (UtxoCohortObject | CohortWithoutRelative)[], all: CohortAll, title: (metric: string) => string }} args
 * @returns {PartialOptionsGroup}
 */
export function createGroupedProfitabilitySection({ list, all, title }) {
  return {
    name: "Profitability",
    tree: [
      { name: "Unrealized", tree: groupedPnlCharts(list, all, title) },
      groupedRealizedSubfolder(list, all, title),
      { name: "Volume", tree: groupedSentInPnl(list, all, title) },
      {
        name: "Invested Capital",
        tree: groupedInvestedCapitalAbsolute(list, all, title),
      },
      groupedSentiment(list, all, title),
    ],
  };
}

/**
 * Grouped section with invested capital % (basic cohorts)
 * @param {{ list: readonly CohortBasicWithoutMarketCap[], all: CohortAll, title: (metric: string) => string }} args
 * @returns {PartialOptionsGroup}
 */
export function createGroupedProfitabilitySectionBasicWithInvestedCapitalPct({
  list,
  all,
  title,
}) {
  return {
    name: "Profitability",
    tree: [
      { name: "Unrealized", tree: groupedPnlCharts(list, all, title) },
      groupedRealizedSubfolder(list, all, title),
      { name: "Volume", tree: groupedSentInPnl(list, all, title) },
      { name: "Invested Capital", tree: groupedInvestedCapital(list, all, title) },
      groupedSentiment(list, all, title),
    ],
  };
}

/**
 * Grouped section for ageRange cohorts
 * @param {{ list: readonly CohortAgeRange[], all: CohortAll, title: (metric: string) => string }} args
>>>>>>> 69eb58f7 (chore: update website from upstream v0.1.5)
 * @returns {PartialOptionsGroup}
 */
export function createGroupedProfitabilitySectionWithInvestedCapitalPct({
  list,
  all,
  title,
}) {
  return {
    name: "Profitability",
    tree: [
<<<<<<< HEAD
      { name: "Unrealized", tree: groupedUnrealizedMid(list, all, title) },
      groupedRealizedSubfolderMid(list, all, title),
=======
      {
        name: "Unrealized",
        tree: [
          ...groupedPnlChartsWithOwnMarketCap(list, all, title),
          {
            name: "Peak Regret",
            title: title("Unrealized Peak Regret"),
            bottom: mapCohortsWithAll(list, all, ({ name, color, tree }) =>
              line({
                metric: tree.unrealized.peakRegret,
                name,
                color,
                unit: Unit.usd,
              }),
            ),
          },
        ],
      },
      groupedRealizedSubfolderWithExtras(list, all, title),
      { name: "Volume", tree: groupedSentInPnl(list, all, title) },
      { name: "Invested Capital", tree: groupedInvestedCapital(list, all, title) },
      groupedSentiment(list, all, title),
>>>>>>> 69eb58f7 (chore: update website from upstream v0.1.5)
    ],
  };
}

/**
<<<<<<< HEAD
 * Grouped section with NUPL + relToMcap
 * @param {{ list: readonly (CohortFull | CohortLongTerm)[], all: CohortAll, title: (name: string) => string }} args
 * @returns {PartialOptionsGroup}
 */
export function createGroupedProfitabilitySectionWithNupl({
=======
 * Grouped section with NUPL
 * @param {{ list: readonly (CohortFull | CohortBasicWithMarketCap)[], all: CohortAll, title: (metric: string) => string }} args
 * @returns {PartialOptionsGroup}
 */
export function createGroupedProfitabilitySectionWithNupl({ list, all, title }) {
  return {
    name: "Profitability",
    tree: [
      {
        name: "Unrealized",
        tree: [
          ...groupedPnlChartsWithMarketCap(list, all, title),
          {
            name: "NUPL",
            title: title("NUPL"),
            bottom: mapCohortsWithAll(list, all, ({ name, color, tree }) =>
              baseline({
                metric: tree.relative.nupl,
                name,
                color,
                unit: Unit.ratio,
              }),
            ),
          },
        ],
      },
      groupedRealizedSubfolder(list, all, title),
      { name: "Volume", tree: groupedSentInPnl(list, all, title) },
      { name: "Invested Capital", tree: groupedInvestedCapital(list, all, title) },
      groupedSentiment(list, all, title),
    ],
  };
}

/**
 * Grouped section for LongTerm cohorts
 * @param {{ list: readonly CohortLongTerm[], all: CohortAll, title: (metric: string) => string }} args
 * @returns {PartialOptionsGroup}
 */
export function createGroupedProfitabilitySectionLongTerm({ list, all, title }) {
  return {
    name: "Profitability",
    tree: [
      {
        name: "Unrealized",
        tree: [
          ...groupedPnlChartsLongTerm(list, all, title),
          {
            name: "NUPL",
            title: title("NUPL"),
            bottom: mapCohortsWithAll(list, all, ({ name, color, tree }) =>
              baseline({
                metric: tree.relative.nupl,
                name,
                color,
                unit: Unit.ratio,
              }),
            ),
          },
          {
            name: "Peak Regret",
            title: title("Unrealized Peak Regret"),
            bottom: [
              ...mapCohortsWithAll(list, all, ({ name, color, tree }) =>
                line({
                  metric: tree.unrealized.peakRegret,
                  name,
                  color,
                  unit: Unit.usd,
                }),
              ),
              ...mapCohortsWithAll(list, all, ({ name, color, tree }) =>
                baseline({
                  metric: tree.relative.unrealizedPeakRegretRelToMarketCap,
                  name,
                  color,
                  unit: Unit.pctMcap,
                }),
              ),
            ],
          },
        ],
      },
      groupedRealizedSubfolderWithExtras(list, all, title),
      { name: "Volume", tree: groupedSentInPnl(list, all, title) },
      { name: "Invested Capital", tree: groupedInvestedCapital(list, all, title) },
      groupedSentiment(list, all, title),
    ],
  };
}

/**
 * Grouped section with Peak Regret + NUPL (minAge cohorts)
 * @param {{ list: readonly CohortMinAge[], all: CohortAll, title: (metric: string) => string }} args
 * @returns {PartialOptionsGroup}
 */
export function createGroupedProfitabilitySectionWithPeakRegret({
>>>>>>> 69eb58f7 (chore: update website from upstream v0.1.5)
  list,
  all,
  title,
}) {
  return {
    name: "Profitability",
    tree: [
      {
        name: "Unrealized",
<<<<<<< HEAD
        tree: groupedUnrealizedWithMarketCap(list, all, title),
      },
      groupedRealizedSubfolderFull(list, all, title),
=======
        tree: [
          ...groupedPnlChartsWithMarketCap(list, all, title),
          {
            name: "NUPL",
            title: title("NUPL"),
            bottom: mapCohortsWithAll(list, all, ({ name, color, tree }) =>
              baseline({
                metric: tree.relative.nupl,
                name,
                color,
                unit: Unit.ratio,
              }),
            ),
          },
          {
            name: "Peak Regret",
            title: title("Unrealized Peak Regret"),
            bottom: [
              ...mapCohortsWithAll(list, all, ({ name, color, tree }) =>
                line({
                  metric: tree.unrealized.peakRegret,
                  name,
                  color,
                  unit: Unit.usd,
                }),
              ),
              ...mapCohortsWithAll(list, all, ({ name, color, tree }) =>
                baseline({
                  metric: tree.relative.unrealizedPeakRegretRelToMarketCap,
                  name,
                  color,
                  unit: Unit.pctMcap,
                }),
              ),
            ],
          },
        ],
      },
      groupedRealizedSubfolder(list, all, title),
      { name: "Volume", tree: groupedSentInPnl(list, all, title) },
      { name: "Invested Capital", tree: groupedInvestedCapital(list, all, title) },
>>>>>>> 69eb58f7 (chore: update website from upstream v0.1.5)
      groupedSentiment(list, all, title),
    ],
  };
}
