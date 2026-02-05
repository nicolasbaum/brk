/** Investing section - Investment strategy tools and analysis */

import { colors } from "../utils/colors.js";
import { brk } from "../client.js";
<<<<<<< HEAD
import { percentRatioBaseline, price } from "./series.js";
=======
import { Unit } from "../utils/units.js";
import { line, baseline, price, dotted } from "./series.js";
>>>>>>> 69eb58f7 (chore: update website from upstream v0.1.5)
import { satsBtcUsd } from "./shared.js";
import { periodIdToName } from "./utils.js";

const SHORT_PERIODS = /** @type {const} */ ([
  "_1w",
  "_1m",
  "_3m",
  "_6m",
  "_1y",
]);
const LONG_PERIODS = /** @type {const} */ ([
  "_2y",
  "_3y",
  "_4y",
  "_5y",
  "_6y",
  "_8y",
  "_10y",
]);

/** @typedef {typeof SHORT_PERIODS[number]} ShortPeriodKey */
/** @typedef {typeof LONG_PERIODS[number]} LongPeriodKey */
/** @typedef {ShortPeriodKey | LongPeriodKey} AllPeriodKey */

/**
 * Add CAGR to a base entry item
 * @param {BaseEntryItem} entry
<<<<<<< HEAD
 * @param {PercentRatioPattern} cagr
=======
 * @param {AnyMetricPattern} cagr
>>>>>>> 69eb58f7 (chore: update website from upstream v0.1.5)
 * @returns {LongEntryItem}
 */
const withCagr = (entry, cagr) => ({ ...entry, cagr });

const YEARS_2020S = /** @type {const} */ ([
  2026, 2025, 2024, 2023, 2022, 2021, 2020,
]);
const YEARS_2010S = /** @type {const} */ ([2019, 2018, 2017, 2016, 2015]);

/** @typedef {typeof YEARS_2020S[number] | typeof YEARS_2010S[number]} DcaYear */
<<<<<<< HEAD
/** @typedef {`from${DcaYear}`} DcaYearKey */
=======
/** @typedef {`_${DcaYear}`} DcaYearKey */
>>>>>>> 69eb58f7 (chore: update website from upstream v0.1.5)

/** @param {AllPeriodKey} key */
const periodName = (key) => periodIdToName(key.slice(1), true);

/**
<<<<<<< HEAD
 * @typedef {{ percent: AnySeriesPattern, ratio: AnySeriesPattern }} PercentRatioPattern
 */

/**
=======
>>>>>>> 69eb58f7 (chore: update website from upstream v0.1.5)
 * Base entry item for compare and single-entry charts
 * @typedef {Object} BaseEntryItem
 * @property {string} name - Display name
 * @property {Color} color - Item color
<<<<<<< HEAD
 * @property {AnyPricePattern} costBasis - Cost basis series
 * @property {PercentRatioPattern} returns - Returns series
=======
 * @property {AnyPricePattern} costBasis - Cost basis metric
 * @property {AnyMetricPattern} returns - Returns metric
 * @property {AnyMetricPattern} minReturn - Min return metric
 * @property {AnyMetricPattern} maxReturn - Max return metric
 * @property {AnyMetricPattern} daysInProfit - Days in profit metric
 * @property {AnyMetricPattern} daysInLoss - Days in loss metric
>>>>>>> 69eb58f7 (chore: update website from upstream v0.1.5)
 * @property {AnyValuePattern} stack - Stack pattern
 */

/**
 * Long-term entry item with CAGR
<<<<<<< HEAD
 * @typedef {BaseEntryItem & { cagr: PercentRatioPattern }} LongEntryItem
 */

const ALL_YEARS = /** @type {const} */ ([...YEARS_2020S, ...YEARS_2010S]);

/**
 * Build DCA class entry from year
 * @param {Investing} investing
 * @param {DcaYear} year
 * @param {number} i
 * @returns {BaseEntryItem}
 */
function buildYearEntry(investing, year, i) {
  const key = /** @type {DcaYearKey} */ (`from${year}`);
  return {
    name: `${year}`,
    color: colors.at(i, ALL_YEARS.length),
    costBasis: investing.class.dcaCostBasis[key],
    returns: investing.class.dcaReturn[key],
    stack: investing.class.dcaStack[key],
=======
 * @typedef {BaseEntryItem & { cagr: AnyMetricPattern }} LongEntryItem
 */

/**
 * Build DCA class entry from year
 * @param {MarketDca} dca
 * @param {DcaYear} year
 * @returns {BaseEntryItem}
 */
function buildYearEntry(dca, year) {
  const key = /** @type {DcaYearKey} */ (`_${year}`);
  return {
    name: `${year}`,
    color: colors.year[key],
    costBasis: dca.classAveragePrice[key],
    returns: dca.classReturns[key],
    minReturn: dca.classMinReturn[key],
    maxReturn: dca.classMaxReturn[key],
    daysInProfit: dca.classDaysInProfit[key],
    daysInLoss: dca.classDaysInLoss[key],
    stack: dca.classStack[key],
>>>>>>> 69eb58f7 (chore: update website from upstream v0.1.5)
  };
}

/**
 * Create Investing section
 * @returns {PartialOptionsGroup}
 */
export function createInvestingSection() {
<<<<<<< HEAD
  const { market, investing } = brk.series;
  const { lookback, returns } = market;
=======
  const { market } = brk.metrics;
  const { dca, lookback, returns } = market;
>>>>>>> 69eb58f7 (chore: update website from upstream v0.1.5)

  return {
    name: "Investing",
    tree: [
<<<<<<< HEAD
      createDcaVsLumpSumSection({ investing, lookback, returns }),
      createDcaByPeriodSection({ investing, returns }),
      createLumpSumByPeriodSection({ investing, lookback, returns }),
      createDcaByStartYearSection({ investing }),
=======
      createDcaVsLumpSumSection({ dca, lookback, returns }),
      createDcaByPeriodSection({ dca, returns }),
      createLumpSumByPeriodSection({ dca, lookback, returns }),
      createDcaByStartYearSection({ dca }),
    ],
  };
}

/**
 * Create profitability folder for compare charts
 * @param {string} context
 * @param {Pick<BaseEntryItem, 'name' | 'color' | 'costBasis' | 'daysInProfit' | 'daysInLoss'>[]} items
 */
function createProfitabilityFolder(context, items) {
  const top = items.map(({ name, color, costBasis }) =>
    price({ metric: costBasis, name, color }),
  );
  return {
    name: "Profitability",
    tree: [
      {
        name: "Days in Profit",
        title: `Days in Profit: ${context}`,
        top,
        bottom: items.map(({ name, color, daysInProfit }) =>
          line({ metric: daysInProfit, name, color, unit: Unit.days }),
        ),
      },
      {
        name: "Days in Loss",
        title: `Days in Loss: ${context}`,
        top,
        bottom: items.map(({ name, color, daysInLoss }) =>
          line({ metric: daysInLoss, name, color, unit: Unit.days }),
        ),
      },
>>>>>>> 69eb58f7 (chore: update website from upstream v0.1.5)
    ],
  };
}

/**
 * Create compare folder from items
 * @param {string} context
<<<<<<< HEAD
 * @param {Pick<BaseEntryItem, 'name' | 'color' | 'costBasis' | 'returns' | 'stack'>[]} items
 */
function createCompareFolder(context, items) {
  const topPane = items.map(({ name, color, costBasis }) =>
    price({ series: costBasis, name, color }),
=======
 * @param {Pick<BaseEntryItem, 'name' | 'color' | 'costBasis' | 'returns' | 'daysInProfit' | 'daysInLoss' | 'stack'>[]} items
 */
function createCompareFolder(context, items) {
  const topPane = items.map(({ name, color, costBasis }) =>
    price({ metric: costBasis, name, color }),
>>>>>>> 69eb58f7 (chore: update website from upstream v0.1.5)
  );
  return {
    name: "Compare",
    tree: [
      {
        name: "Cost Basis",
        title: `Cost Basis: ${context}`,
        top: topPane,
      },
      {
        name: "Returns",
        title: `Returns: ${context}`,
        top: topPane,
<<<<<<< HEAD
        bottom: items.flatMap(({ name, color, returns }) =>
          percentRatioBaseline({
            pattern: returns,
            name,
            color: [color, color],
          }),
        ),
      },
      {
        name: "Accumulated",
        title: `Accumulated Value ($100/day): ${context}`,
        top: topPane,
        bottom: items.flatMap(({ name, color, stack }) =>
          satsBtcUsd({ pattern: stack, name, color }),
        ),
      },
    ],
  };
}

/**
 * Create compare folder from long items (includes CAGR chart)
 * @param {string} context
 * @param {LongEntryItem[]} items
 */
function createLongCompareFolder(context, items) {
  const topPane = items.map(({ name, color, costBasis }) =>
    price({ series: costBasis, name, color }),
  );
  return {
    name: "Compare",
    tree: [
      {
        name: "Cost Basis",
        title: `Cost Basis: ${context}`,
        top: topPane,
      },
      {
        name: "Returns",
        title: `Returns: ${context}`,
        top: topPane,
        bottom: items.flatMap(({ name, color, returns }) =>
          percentRatioBaseline({
            pattern: returns,
            name,
            color: [color, color],
          }),
        ),
      },
      {
        name: "CAGR",
        title: `CAGR: ${context}`,
        top: topPane,
        bottom: items.flatMap(({ name, color, cagr }) =>
          percentRatioBaseline({
            pattern: cagr,
            name,
            color: [color, color],
          }),
        ),
      },
      {
        name: "Accumulated",
        title: `Accumulated Value ($100/day): ${context}`,
=======
        bottom: items.map(({ name, color, returns }) =>
          baseline({
            metric: returns,
            name,
            color: [color, color],
            unit: Unit.percentage,
          }),
        ),
      },
      createProfitabilityFolder(context, items),
      {
        name: "Accumulated",
        title: `Accumulated Value: ${context}`,
>>>>>>> 69eb58f7 (chore: update website from upstream v0.1.5)
        top: topPane,
        bottom: items.flatMap(({ name, color, stack }) =>
          satsBtcUsd({ pattern: stack, name, color }),
        ),
      },
    ],
  };
}

/**
 * Create single entry tree structure
 * @param {BaseEntryItem & { titlePrefix?: string }} item
 * @param {object[]} returnsBottom - Bottom pane items for returns chart
 */
function createSingleEntryTree(item, returnsBottom) {
<<<<<<< HEAD
  const { name, titlePrefix = name, color, costBasis, stack } = item;
  const top = [price({ series: costBasis, name: "Cost Basis", color })];
=======
  const {
    name,
    titlePrefix = name,
    color,
    costBasis,
    daysInProfit,
    daysInLoss,
    stack,
  } = item;
  const top = [price({ metric: costBasis, name: "Cost Basis", color })];
>>>>>>> 69eb58f7 (chore: update website from upstream v0.1.5)
  return {
    name,
    tree: [
      { name: "Cost Basis", title: `Cost Basis: ${titlePrefix}`, top },
      {
        name: "Returns",
        title: `Returns: ${titlePrefix}`,
        top,
        bottom: returnsBottom,
      },
      {
<<<<<<< HEAD
        name: "Accumulated",
        title: `Accumulated Value ($100/day): ${titlePrefix}`,
=======
        name: "Profitability",
        title: `Profitability: ${titlePrefix}`,
        top,
        bottom: [
          line({
            metric: daysInProfit,
            name: "Days in Profit",
            color: colors.profit,
            unit: Unit.days,
          }),
          line({
            metric: daysInLoss,
            name: "Days in Loss",
            color: colors.loss,
            unit: Unit.days,
          }),
        ],
      },
      {
        name: "Accumulated",
        title: `Accumulated Value: ${titlePrefix}`,
>>>>>>> 69eb58f7 (chore: update website from upstream v0.1.5)
        top,
        bottom: satsBtcUsd({ pattern: stack, name: "Value" }),
      },
    ],
  };
}

/**
 * Create a single entry from a base item (no CAGR)
 * @param {BaseEntryItem & { titlePrefix?: string }} item
 */
function createShortSingleEntry(item) {
<<<<<<< HEAD
  return createSingleEntryTree(
    item,
    percentRatioBaseline({ pattern: item.returns, name: "Return" }),
  );
}

/**
 * Create a single entry from a long item (with CAGR as its own chart)
 * @param {LongEntryItem & { titlePrefix?: string }} item
 */
function createLongSingleEntry(item) {
  const {
    name,
    titlePrefix = name,
    color,
    costBasis,
    returns,
    cagr,
    stack,
  } = item;
  const top = [price({ series: costBasis, name: "Cost Basis", color })];
  return {
    name,
    tree: [
      { name: "Cost Basis", title: `Cost Basis: ${titlePrefix}`, top },
      {
        name: "Returns",
        title: `Returns: ${titlePrefix}`,
        top,
        bottom: percentRatioBaseline({ pattern: returns, name: "Return" }),
      },
      {
        name: "CAGR",
        title: `CAGR: ${titlePrefix}`,
        top,
        bottom: percentRatioBaseline({ pattern: cagr, name: "CAGR" }),
      },
      {
        name: "Accumulated",
        title: `Accumulated Value ($100/day): ${titlePrefix}`,
        top,
        bottom: satsBtcUsd({ pattern: stack, name: "Value" }),
      },
    ],
  };
=======
  const { returns, minReturn, maxReturn } = item;
  return createSingleEntryTree(item, [
    baseline({ metric: returns, name: "Current", unit: Unit.percentage }),
    dotted({
      metric: maxReturn,
      name: "Max",
      color: colors.profit,
      unit: Unit.percentage,
      defaultActive: false,
    }),
    dotted({
      metric: minReturn,
      name: "Min",
      color: colors.loss,
      unit: Unit.percentage,
      defaultActive: false,
    }),
  ]);
}

/**
 * Create a single entry from a long item (with CAGR)
 * @param {LongEntryItem & { titlePrefix?: string }} item
 */
function createLongSingleEntry(item) {
  const { returns, minReturn, maxReturn, cagr } = item;
  return createSingleEntryTree(item, [
    baseline({ metric: returns, name: "Current", unit: Unit.percentage }),
    baseline({ metric: cagr, name: "CAGR", unit: Unit.cagr }),
    dotted({
      metric: maxReturn,
      name: "Max",
      color: colors.profit,
      unit: Unit.percentage,
      defaultActive: false,
    }),
    dotted({
      metric: minReturn,
      name: "Min",
      color: colors.loss,
      unit: Unit.percentage,
      defaultActive: false,
    }),
  ]);
>>>>>>> 69eb58f7 (chore: update website from upstream v0.1.5)
}

/**
 * Create DCA vs Lump Sum section
 * @param {Object} args
<<<<<<< HEAD
 * @param {Investing} args.investing
 * @param {Market["lookback"]} args.lookback
 * @param {Market["returns"]} args.returns
 */
export function createDcaVsLumpSumSection({ investing, lookback, returns }) {
  /** @param {AllPeriodKey} key */
  const topPane = (key) => [
    price({
      series: investing.period.dcaCostBasis[key],
      name: "DCA",
      color: colors.profit,
    }),
    price({ series: lookback[key], name: "Lump Sum", color: colors.bitcoin }),
=======
 * @param {Market["dca"]} args.dca
 * @param {Market["lookback"]} args.lookback
 * @param {Market["returns"]} args.returns
 */
export function createDcaVsLumpSumSection({ dca, lookback, returns }) {
  /** @param {AllPeriodKey} key */
  const topPane = (key) => [
    price({
      metric: dca.periodAveragePrice[key],
      name: "DCA",
      color: colors.profit,
    }),
    price({ metric: lookback[key], name: "Lump Sum", color: colors.bitcoin }),
>>>>>>> 69eb58f7 (chore: update website from upstream v0.1.5)
  ];

  /** @param {string} name @param {AllPeriodKey} key */
  const costBasisChart = (name, key) => ({
    name: "Cost Basis",
    title: `Cost Basis: ${name} DCA vs Lump Sum`,
    top: topPane(key),
  });

  /** @param {string} name @param {AllPeriodKey} key */
<<<<<<< HEAD
  const returnsChart = (name, key) => ({
    name: "Returns",
    title: `Returns: ${name} DCA vs Lump Sum`,
    top: topPane(key),
    bottom: [
      ...percentRatioBaseline({
        pattern: investing.period.dcaReturn[key],
        name: "DCA",
      }),
      ...percentRatioBaseline({
        pattern: investing.period.lumpSumReturn[key],
        name: "Lump Sum",
        color: colors.bi.p2,
      }),
=======
  const returnsMinMax = (name, key) => [
    {
      name: "Max",
      title: `Max Return: ${name} DCA vs Lump Sum`,
      top: topPane(key),
      bottom: [
        baseline({
          metric: dca.periodMaxReturn[key],
          name: "DCA",
          unit: Unit.percentage,
        }),
        baseline({
          metric: dca.periodLumpSumMaxReturn[key],
          name: "Lump Sum",
          color: colors.bi.p2,
          unit: Unit.percentage,
        }),
      ],
    },
    {
      name: "Min",
      title: `Min Return: ${name} DCA vs Lump Sum`,
      top: topPane(key),
      bottom: [
        baseline({
          metric: dca.periodMinReturn[key],
          name: "DCA",
          unit: Unit.percentage,
        }),
        baseline({
          metric: dca.periodLumpSumMinReturn[key],
          name: "Lump Sum",
          color: colors.bi.p2,
          unit: Unit.percentage,
        }),
      ],
    },
  ];

  /** @param {string} name @param {ShortPeriodKey} key */
  const shortReturnsFolder = (name, key) => ({
    name: "Returns",
    tree: [
      {
        name: "Current",
        title: `Returns: ${name} DCA vs Lump Sum`,
        top: topPane(key),
        bottom: [
          baseline({
            metric: dca.periodReturns[key],
            name: "DCA",
            unit: Unit.percentage,
          }),
          baseline({
            metric: dca.periodLumpSumReturns[key],
            name: "Lump Sum",
            color: colors.bi.p2,
            unit: Unit.percentage,
          }),
        ],
      },
      ...returnsMinMax(name, key),
>>>>>>> 69eb58f7 (chore: update website from upstream v0.1.5)
    ],
  });

  /** @param {string} name @param {LongPeriodKey} key */
<<<<<<< HEAD
  const longCagrChart = (name, key) => ({
    name: "CAGR",
    title: `CAGR: ${name} DCA vs Lump Sum`,
    top: topPane(key),
    bottom: [
      ...percentRatioBaseline({
        pattern: investing.period.dcaCagr[key],
        name: "DCA",
      }),
      ...percentRatioBaseline({
        pattern: returns.cagr[key],
        name: "Lump Sum",
        color: colors.bi.p2,
      }),
=======
  const longReturnsFolder = (name, key) => ({
    name: "Returns",
    tree: [
      {
        name: "Current",
        title: `Returns: ${name} DCA vs Lump Sum`,
        top: topPane(key),
        bottom: [
          baseline({
            metric: dca.periodReturns[key],
            name: "DCA",
            unit: Unit.percentage,
          }),
          baseline({
            metric: dca.periodLumpSumReturns[key],
            name: "Lump Sum",
            color: colors.bi.p2,
            unit: Unit.percentage,
          }),
          baseline({
            metric: dca.periodCagr[key],
            name: "DCA",
            unit: Unit.cagr,
          }),
          baseline({
            metric: returns.cagr[key],
            name: "Lump Sum",
            color: colors.bi.p2,
            unit: Unit.cagr,
          }),
        ],
      },
      ...returnsMinMax(name, key),
    ],
  });

  /** @param {string} name @param {AllPeriodKey} key */
  const profitabilityFolder = (name, key) => ({
    name: "Profitability",
    tree: [
      {
        name: "Days in Profit",
        title: `Days in Profit: ${name} DCA vs Lump Sum`,
        top: topPane(key),
        bottom: [
          line({
            metric: dca.periodDaysInProfit[key],
            name: "DCA",
            color: colors.profit,
            unit: Unit.days,
          }),
          line({
            metric: dca.periodLumpSumDaysInProfit[key],
            name: "Lump Sum",
            color: colors.bitcoin,
            unit: Unit.days,
          }),
        ],
      },
      {
        name: "Days in Loss",
        title: `Days in Loss: ${name} DCA vs Lump Sum`,
        top: topPane(key),
        bottom: [
          line({
            metric: dca.periodDaysInLoss[key],
            name: "DCA",
            color: colors.profit,
            unit: Unit.days,
          }),
          line({
            metric: dca.periodLumpSumDaysInLoss[key],
            name: "Lump Sum",
            color: colors.bitcoin,
            unit: Unit.days,
          }),
        ],
      },
>>>>>>> 69eb58f7 (chore: update website from upstream v0.1.5)
    ],
  });

  /** @param {string} name @param {AllPeriodKey} key */
  const stackChart = (name, key) => ({
    name: "Accumulated",
    title: `Accumulated Value ($100/day): ${name} DCA vs Lump Sum`,
    top: topPane(key),
    bottom: [
      ...satsBtcUsd({
<<<<<<< HEAD
        pattern: investing.period.dcaStack[key],
=======
        pattern: dca.periodStack[key],
>>>>>>> 69eb58f7 (chore: update website from upstream v0.1.5)
        name: "DCA",
        color: colors.profit,
      }),
      ...satsBtcUsd({
<<<<<<< HEAD
        pattern: investing.period.lumpSumStack[key],
=======
        pattern: dca.periodLumpSumStack[key],
>>>>>>> 69eb58f7 (chore: update website from upstream v0.1.5)
        name: "Lump Sum",
        color: colors.bitcoin,
      }),
    ],
  });

  /** @param {ShortPeriodKey} key */
  const createShortPeriodEntry = (key) => {
    const name = periodName(key);
    return {
      name,
      tree: [
        costBasisChart(name, key),
<<<<<<< HEAD
        returnsChart(name, key),
=======
        shortReturnsFolder(name, key),
        profitabilityFolder(name, key),
>>>>>>> 69eb58f7 (chore: update website from upstream v0.1.5)
        stackChart(name, key),
      ],
    };
  };

  /** @param {LongPeriodKey} key */
  const createLongPeriodEntry = (key) => {
    const name = periodName(key);
    return {
      name,
      tree: [
        costBasisChart(name, key),
<<<<<<< HEAD
        returnsChart(name, key),
        longCagrChart(name, key),
=======
        longReturnsFolder(name, key),
        profitabilityFolder(name, key),
>>>>>>> 69eb58f7 (chore: update website from upstream v0.1.5)
        stackChart(name, key),
      ],
    };
  };

  return {
    name: "DCA vs Lump Sum",
    title: "Compare Investment Strategies",
    tree: [
      {
        name: "Short Term",
        title: "Up to 1 Year",
        tree: SHORT_PERIODS.map(createShortPeriodEntry),
      },
      {
        name: "Long Term",
        title: "2+ Years",
        tree: LONG_PERIODS.map(createLongPeriodEntry),
      },
    ],
  };
}

/**
 * Create period-based section (DCA or Lump Sum)
 * @param {Object} args
<<<<<<< HEAD
 * @param {Investing} args.investing
 * @param {Market["lookback"]} [args.lookback]
 * @param {Market["returns"]} args.returns
 */
function createPeriodSection({ investing, lookback, returns }) {
  const isLumpSum = !!lookback;
  const suffix = isLumpSum ? "Lump Sum" : "DCA";

  const allPeriods = /** @type {const} */ ([...SHORT_PERIODS, ...LONG_PERIODS]);

  /** @param {AllPeriodKey} key @param {number} i @returns {BaseEntryItem} */
  const buildBaseEntry = (key, i) => ({
    name: periodName(key),
    color: colors.at(i, allPeriods.length),
    costBasis: isLumpSum ? lookback[key] : investing.period.dcaCostBasis[key],
    returns: isLumpSum
      ? investing.period.lumpSumReturn[key]
      : investing.period.dcaReturn[key],
    stack: isLumpSum
      ? investing.period.lumpSumStack[key]
      : investing.period.dcaStack[key],
  });

  /** @param {LongPeriodKey} key @param {number} i @returns {LongEntryItem} */
  const buildLongEntry = (key, i) =>
    withCagr(
      buildBaseEntry(key, i),
      isLumpSum ? returns.cagr[key] : investing.period.dcaCagr[key],
=======
 * @param {Market["dca"]} args.dca
 * @param {Market["lookback"]} [args.lookback]
 * @param {Market["returns"]} args.returns
 */
function createPeriodSection({ dca, lookback, returns }) {
  const isLumpSum = !!lookback;
  const suffix = isLumpSum ? "Lump Sum" : "DCA";

  /** @param {AllPeriodKey} key @returns {BaseEntryItem} */
  const buildBaseEntry = (key) => ({
    name: periodName(key),
    color: colors.dca[key],
    costBasis: isLumpSum ? lookback[key] : dca.periodAveragePrice[key],
    returns: isLumpSum ? dca.periodLumpSumReturns[key] : dca.periodReturns[key],
    minReturn: isLumpSum
      ? dca.periodLumpSumMinReturn[key]
      : dca.periodMinReturn[key],
    maxReturn: isLumpSum
      ? dca.periodLumpSumMaxReturn[key]
      : dca.periodMaxReturn[key],
    daysInProfit: isLumpSum
      ? dca.periodLumpSumDaysInProfit[key]
      : dca.periodDaysInProfit[key],
    daysInLoss: isLumpSum
      ? dca.periodLumpSumDaysInLoss[key]
      : dca.periodDaysInLoss[key],
    stack: isLumpSum ? dca.periodLumpSumStack[key] : dca.periodStack[key],
  });

  /** @param {LongPeriodKey} key @returns {LongEntryItem} */
  const buildLongEntry = (key) =>
    withCagr(
      buildBaseEntry(key),
      isLumpSum ? returns.cagr[key] : dca.periodCagr[key],
>>>>>>> 69eb58f7 (chore: update website from upstream v0.1.5)
    );

  /** @param {BaseEntryItem} entry */
  const createShortEntry = (entry) =>
    createShortSingleEntry({
      ...entry,
      titlePrefix: `${entry.name} ${suffix}`,
    });

  /** @param {LongEntryItem} entry */
  const createLongEntry = (entry) =>
    createLongSingleEntry({
      ...entry,
      titlePrefix: `${entry.name} ${suffix}`,
    });

<<<<<<< HEAD
  const shortEntries = SHORT_PERIODS.map((key, i) => buildBaseEntry(key, i));
  const longEntries = LONG_PERIODS.map((key, i) =>
    buildLongEntry(key, SHORT_PERIODS.length + i),
  );
=======
  const shortEntries = SHORT_PERIODS.map(buildBaseEntry);
  const longEntries = LONG_PERIODS.map(buildLongEntry);
>>>>>>> 69eb58f7 (chore: update website from upstream v0.1.5)

  return {
    name: `${suffix} by Period`,
    title: `${suffix} Performance by Investment Period`,
    tree: [
<<<<<<< HEAD
=======
      createCompareFolder(`All Periods ${suffix}`, [
        ...shortEntries,
        ...longEntries,
      ]),
>>>>>>> 69eb58f7 (chore: update website from upstream v0.1.5)
      {
        name: "Short Term",
        title: "Up to 1 Year",
        tree: [
          createCompareFolder(`Short Term ${suffix}`, shortEntries),
          ...shortEntries.map(createShortEntry),
        ],
      },
      {
        name: "Long Term",
        title: "2+ Years",
        tree: [
<<<<<<< HEAD
          createLongCompareFolder(`Long Term ${suffix}`, longEntries),
=======
          createCompareFolder(`Long Term ${suffix}`, longEntries),
>>>>>>> 69eb58f7 (chore: update website from upstream v0.1.5)
          ...longEntries.map(createLongEntry),
        ],
      },
    ],
  };
}

/**
 * Create DCA by Period section
 * @param {Object} args
<<<<<<< HEAD
 * @param {Investing} args.investing
 * @param {Market["returns"]} args.returns
 */
export function createDcaByPeriodSection({ investing, returns }) {
  return createPeriodSection({ investing, returns });
=======
 * @param {Market["dca"]} args.dca
 * @param {Market["returns"]} args.returns
 */
export function createDcaByPeriodSection({ dca, returns }) {
  return createPeriodSection({ dca, returns });
>>>>>>> 69eb58f7 (chore: update website from upstream v0.1.5)
}

/**
 * Create Lump Sum by Period section
 * @param {Object} args
<<<<<<< HEAD
 * @param {Investing} args.investing
 * @param {Market["lookback"]} args.lookback
 * @param {Market["returns"]} args.returns
 */
export function createLumpSumByPeriodSection({ investing, lookback, returns }) {
  return createPeriodSection({ investing, lookback, returns });
=======
 * @param {Market["dca"]} args.dca
 * @param {Market["lookback"]} args.lookback
 * @param {Market["returns"]} args.returns
 */
export function createLumpSumByPeriodSection({ dca, lookback, returns }) {
  return createPeriodSection({ dca, lookback, returns });
>>>>>>> 69eb58f7 (chore: update website from upstream v0.1.5)
}

/**
 * Create DCA by Start Year section
 * @param {Object} args
<<<<<<< HEAD
 * @param {Investing} args.investing
 */
export function createDcaByStartYearSection({ investing }) {
=======
 * @param {Market["dca"]} args.dca
 */
export function createDcaByStartYearSection({ dca }) {
>>>>>>> 69eb58f7 (chore: update website from upstream v0.1.5)
  /** @param {string} name @param {string} title @param {BaseEntryItem[]} entries */
  const createDecadeGroup = (name, title, entries) => ({
    name,
    title,
    tree: [
      createCompareFolder(`${name} DCA`, entries),
      ...entries.map((entry) =>
        createShortSingleEntry({
          ...entry,
          titlePrefix: `${entry.name} DCA`,
        }),
      ),
    ],
  });

<<<<<<< HEAD
  const entries2020s = YEARS_2020S.map((year, i) =>
    buildYearEntry(investing, year, i),
  );
  const entries2010s = YEARS_2010S.map((year, i) =>
    buildYearEntry(investing, year, YEARS_2020S.length + i),
  );
=======
  const entries2020s = YEARS_2020S.map((year) => buildYearEntry(dca, year));
  const entries2010s = YEARS_2010S.map((year) => buildYearEntry(dca, year));
>>>>>>> 69eb58f7 (chore: update website from upstream v0.1.5)

  return {
    name: "DCA by Start Year",
    title: "DCA Performance by When You Started",
    tree: [
      createCompareFolder("All Years DCA", [...entries2020s, ...entries2010s]),
      createDecadeGroup("2020s", "2020-2026", entries2020s),
      createDecadeGroup("2010s", "2015-2019", entries2010s),
    ],
  };
}
