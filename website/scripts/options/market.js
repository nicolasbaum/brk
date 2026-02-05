/** Market section */

import { colors } from "../utils/colors.js";
import { brk } from "../client.js";
import { includes } from "../utils/array.js";
import { Unit } from "../utils/units.js";
import { priceLine, priceLines } from "./constants.js";
<<<<<<< HEAD
import {
  baseline,
  deltaTree,
  histogram,
  line,
  price,
  percentRatio,
  percentRatioBaseline,
  ROLLING_WINDOWS,
  ROLLING_WINDOWS_TO_1M,
} from "./series.js";
import { simplePriceRatioTree, percentileBands, priceBands } from "./shared.js";
=======
import { baseline, histogram, line, price } from "./series.js";
import { createPriceRatioCharts } from "./shared.js";
>>>>>>> 69eb58f7 (chore: update website from upstream v0.1.5)
import { periodIdToName } from "./utils.js";

/**
 * @typedef {Object} Period
 * @property {string} id
 * @property {Color} color
<<<<<<< HEAD
 * @property {{ percent: AnySeriesPattern, ratio: AnySeriesPattern }} returns
=======
 * @property {AnyMetricPattern} returns
>>>>>>> 69eb58f7 (chore: update website from upstream v0.1.5)
 * @property {AnyPricePattern} lookback
 * @property {boolean} [defaultActive]
 */

/**
<<<<<<< HEAD
 * @typedef {Period & { cagr: { percent: AnySeriesPattern, ratio: AnySeriesPattern } }} PeriodWithCagr
=======
 * @typedef {Period & { cagr: AnyMetricPattern }} PeriodWithCagr
>>>>>>> 69eb58f7 (chore: update website from upstream v0.1.5)
 */

/**
 * @typedef {Object} MaPeriod
 * @property {string} id
 * @property {Color} color
<<<<<<< HEAD
 * @property {MaPriceRatioPattern} ratio
 */

/**
 * Create index (percent) + ratio line pair from a BpsPercentRatioPattern
 * @param {{ pattern: { percent: AnySeriesPattern, ratio: AnySeriesPattern }, name: string, color?: Color, defaultActive?: boolean }} args
 * @returns {AnyFetchedSeriesBlueprint[]}
 */
function indexRatio({ pattern, name, color, defaultActive }) {
  return [
    line({
      series: pattern.percent,
      name,
      color,
      defaultActive,
      unit: Unit.index,
    }),
    line({
      series: pattern.ratio,
      name,
      color,
      defaultActive,
      unit: Unit.ratio,
    }),
  ];
}

=======
 * @property {ActivePriceRatioPattern} ratio
 */

>>>>>>> 69eb58f7 (chore: update website from upstream v0.1.5)
const commonMaIds = /** @type {const} */ ([
  "1w",
  "1m",
  "200d",
  "1y",
  "200w",
  "4y",
]);

/**
 * @param {string} label
 * @param {MaPeriod[]} averages
 */
function createMaSubSection(label, averages) {
  const common = averages.filter((a) => includes(commonMaIds, a.id));
  const more = averages.filter((a) => !includes(commonMaIds, a.id));

  /** @param {MaPeriod} a */
  const toFolder = (a) => ({
    name: periodIdToName(a.id, true),
<<<<<<< HEAD
    tree: simplePriceRatioTree({
      pattern: a.ratio,
      title: `${periodIdToName(a.id, true)} ${label}`,
      legend: "Average",
=======
    tree: createPriceRatioCharts({
      context: `${periodIdToName(a.id, true)} ${label}`,
      legend: "average",
      pricePattern: a.ratio.price,
      ratio: a.ratio,
>>>>>>> 69eb58f7 (chore: update website from upstream v0.1.5)
      color: a.color,
    }),
  });

  return {
    name: label,
    tree: [
      {
        name: "Compare",
        title: `Price ${label}s`,
        top: averages.map((a) =>
<<<<<<< HEAD
          price({
            series: a.ratio,
            name: a.id,
            color: a.color,
            defaultActive: includes(commonMaIds, a.id),
          }),
=======
          price({ metric: a.ratio.price, name: a.id, color: a.color }),
>>>>>>> 69eb58f7 (chore: update website from upstream v0.1.5)
        ),
      },
      ...common.map(toFolder),
      { name: "More...", tree: more.map(toFolder) },
    ],
  };
}

/**
 * @param {string} name
<<<<<<< HEAD
=======
 * @param {string} title
 * @param {Unit} unit
 * @param {{ _1w: AnyMetricPattern, _1m: AnyMetricPattern, _1y: AnyMetricPattern }} metrics
 */
function volatilityChart(name, title, unit, metrics) {
  return {
    name,
    title,
    bottom: [
      line({ metric: metrics._1w, name: "1w", color: colors.time._1w, unit }),
      line({ metric: metrics._1m, name: "1m", color: colors.time._1m, unit }),
      line({ metric: metrics._1y, name: "1y", color: colors.time._1y, unit }),
    ],
  };
}

/**
 * @param {string} name
>>>>>>> 69eb58f7 (chore: update website from upstream v0.1.5)
 * @param {Period[]} periods
 */
function returnsSubSection(name, periods) {
  return {
    name,
    tree: [
      {
        name: "Compare",
<<<<<<< HEAD
        title: `${name} Price Returns`,
        bottom: periods.flatMap((p) =>
          percentRatioBaseline({
            pattern: p.returns,
            name: p.id,
            color: p.color,
=======
        title: `${name} Returns`,
        bottom: periods.map((p) =>
          baseline({
            metric: p.returns,
            name: p.id,
            color: p.color,
            unit: Unit.percentage,
>>>>>>> 69eb58f7 (chore: update website from upstream v0.1.5)
          }),
        ),
      },
      ...periods.map((p) => ({
        name: periodIdToName(p.id, true),
<<<<<<< HEAD
        title: `${periodIdToName(p.id, true)} Price Returns`,
        bottom: percentRatioBaseline({ pattern: p.returns, name: "Return" }),
=======
        title: `${periodIdToName(p.id, true)} Returns`,
        bottom: [
          baseline({ metric: p.returns, name: "Total", unit: Unit.percentage }),
        ],
>>>>>>> 69eb58f7 (chore: update website from upstream v0.1.5)
      })),
    ],
  };
}

/**
 * @param {string} name
 * @param {PeriodWithCagr[]} periods
 */
function returnsSubSectionWithCagr(name, periods) {
  return {
    name,
    tree: [
      {
<<<<<<< HEAD
        name: "Total",
        tree: [
          {
            name: "Compare",
            title: `${name} Total Price Returns`,
            bottom: periods.flatMap((p) =>
              percentRatioBaseline({
                pattern: p.returns,
                name: p.id,
                color: p.color,
              }),
            ),
          },
          ...periods.map((p) => ({
            name: periodIdToName(p.id, true),
            title: `${periodIdToName(p.id, true)} Total Price Returns`,
            bottom: percentRatioBaseline({
              pattern: p.returns,
              name: "Return",
            }),
          })),
        ],
      },
      {
        name: "CAGR",
        tree: [
          {
            name: "Compare",
            title: `${name} Price CAGR`,
            bottom: periods.flatMap((p) =>
              percentRatioBaseline({
                pattern: p.cagr,
                name: p.id,
                color: p.color,
              }),
            ),
          },
          ...periods.map((p) => ({
            name: periodIdToName(p.id, true),
            title: `${periodIdToName(p.id, true)} Price CAGR`,
            bottom: percentRatioBaseline({ pattern: p.cagr, name: "CAGR" }),
          })),
        ],
      },
=======
        name: "Compare",
        title: `${name} Returns`,
        bottom: periods.map((p) =>
          baseline({
            metric: p.returns,
            name: p.id,
            color: p.color,
            unit: Unit.percentage,
          }),
        ),
      },
      ...periods.map((p) => ({
        name: periodIdToName(p.id, true),
        title: `${periodIdToName(p.id, true)} Returns`,
        bottom: [
          baseline({ metric: p.returns, name: "Total", unit: Unit.percentage }),
          baseline({ metric: p.cagr, name: "annual", unit: Unit.cagr }),
        ],
      })),
>>>>>>> 69eb58f7 (chore: update website from upstream v0.1.5)
    ],
  };
}

/**
 * @param {string} name
 * @param {Period[]} periods
 */
function historicalSubSection(name, periods) {
  return {
    name,
    tree: [
      {
        name: "Compare",
<<<<<<< HEAD
        title: `${name} Historical Prices`,
        top: periods.map((p) =>
          price({ series: p.lookback, name: p.id, color: p.color }),
=======
        title: `${name} Historical`,
        top: periods.map((p) =>
          price({ metric: p.lookback, name: p.id, color: p.color }),
>>>>>>> 69eb58f7 (chore: update website from upstream v0.1.5)
        ),
      },
      ...periods.map((p) => ({
        name: periodIdToName(p.id, true),
<<<<<<< HEAD
        title: `Price ${periodIdToName(p.id)} Ago`,
        top: [price({ series: p.lookback, name: "Price" })],
=======
        title: `${periodIdToName(p.id, true)} Ago`,
        top: [price({ metric: p.lookback, name: "Price" })],
>>>>>>> 69eb58f7 (chore: update website from upstream v0.1.5)
      })),
    ],
  };
}

/**
 * Create Market section
 * @returns {PartialOptionsGroup}
 */
export function createMarketSection() {
<<<<<<< HEAD
  const { market, supply, cohorts, prices, indicators } = brk.series;
=======
  const { market, supply, price: priceMetrics } = brk.metrics;
>>>>>>> 69eb58f7 (chore: update website from upstream v0.1.5)
  const {
    movingAverage: ma,
    ath,
    returns,
    volatility,
    range,
<<<<<<< HEAD
    technical,
    lookback,
  } = market;

  const shortPeriodsBase = [
    { id: "24h", returns: returns.periods._24h, lookback: lookback._24h },
    { id: "1w", returns: returns.periods._1w, lookback: lookback._1w },
    { id: "1m", returns: returns.periods._1m, lookback: lookback._1m },
    {
      id: "3m",
      returns: returns.periods._3m,
=======
    indicators,
    lookback,
  } = market;

  /** @type {Period[]} */
  const shortPeriods = [
    {
      id: "1d",
      color: colors.returns._1d,
      returns: returns.priceReturns._1d,
      lookback: lookback._1d,
    },
    {
      id: "1w",
      color: colors.returns._1w,
      returns: returns.priceReturns._1w,
      lookback: lookback._1w,
    },
    {
      id: "1m",
      color: colors.returns._1m,
      returns: returns.priceReturns._1m,
      lookback: lookback._1m,
    },
    {
      id: "3m",
      color: colors.returns._3m,
      returns: returns.priceReturns._3m,
>>>>>>> 69eb58f7 (chore: update website from upstream v0.1.5)
      lookback: lookback._3m,
      defaultActive: false,
    },
    {
      id: "6m",
<<<<<<< HEAD
      returns: returns.periods._6m,
      lookback: lookback._6m,
      defaultActive: false,
    },
    { id: "1y", returns: returns.periods._1y, lookback: lookback._1y },
  ];

  const longPeriodsBase = [
    {
      id: "2y",
      returns: returns.periods._2y,
=======
      color: colors.returns._6m,
      returns: returns.priceReturns._6m,
      lookback: lookback._6m,
      defaultActive: false,
    },
    {
      id: "1y",
      color: colors.returns._1y,
      returns: returns.priceReturns._1y,
      lookback: lookback._1y,
    },
  ];

  /** @type {PeriodWithCagr[]} */
  const longPeriods = [
    {
      id: "2y",
      color: colors.returns._2y,
      returns: returns.priceReturns._2y,
>>>>>>> 69eb58f7 (chore: update website from upstream v0.1.5)
      cagr: returns.cagr._2y,
      lookback: lookback._2y,
      defaultActive: false,
    },
    {
      id: "3y",
<<<<<<< HEAD
      returns: returns.periods._3y,
=======
      color: colors.returns._3y,
      returns: returns.priceReturns._3y,
>>>>>>> 69eb58f7 (chore: update website from upstream v0.1.5)
      cagr: returns.cagr._3y,
      lookback: lookback._3y,
      defaultActive: false,
    },
    {
      id: "4y",
<<<<<<< HEAD
      returns: returns.periods._4y,
=======
      color: colors.returns._4y,
      returns: returns.priceReturns._4y,
>>>>>>> 69eb58f7 (chore: update website from upstream v0.1.5)
      cagr: returns.cagr._4y,
      lookback: lookback._4y,
    },
    {
      id: "5y",
<<<<<<< HEAD
      returns: returns.periods._5y,
=======
      color: colors.returns._5y,
      returns: returns.priceReturns._5y,
>>>>>>> 69eb58f7 (chore: update website from upstream v0.1.5)
      cagr: returns.cagr._5y,
      lookback: lookback._5y,
      defaultActive: false,
    },
    {
      id: "6y",
<<<<<<< HEAD
      returns: returns.periods._6y,
=======
      color: colors.returns._6y,
      returns: returns.priceReturns._6y,
>>>>>>> 69eb58f7 (chore: update website from upstream v0.1.5)
      cagr: returns.cagr._6y,
      lookback: lookback._6y,
      defaultActive: false,
    },
    {
      id: "8y",
<<<<<<< HEAD
      returns: returns.periods._8y,
=======
      color: colors.returns._8y,
      returns: returns.priceReturns._8y,
>>>>>>> 69eb58f7 (chore: update website from upstream v0.1.5)
      cagr: returns.cagr._8y,
      lookback: lookback._8y,
      defaultActive: false,
    },
    {
      id: "10y",
<<<<<<< HEAD
      returns: returns.periods._10y,
=======
      color: colors.returns._10y,
      returns: returns.priceReturns._10y,
>>>>>>> 69eb58f7 (chore: update website from upstream v0.1.5)
      cagr: returns.cagr._10y,
      lookback: lookback._10y,
      defaultActive: false,
    },
  ];

<<<<<<< HEAD
  const totalReturnPeriods = shortPeriodsBase.length + longPeriodsBase.length;

  /** @type {Period[]} */
  const shortPeriods = shortPeriodsBase.map((p, i) => ({
    ...p,
    color: colors.at(i, totalReturnPeriods),
  }));

  /** @type {PeriodWithCagr[]} */
  const longPeriods = longPeriodsBase.map((p, i) => ({
    ...p,
    color: colors.at(shortPeriodsBase.length + i, totalReturnPeriods),
  }));

  /** @type {MaPeriod[]} */
  const sma = [
    { id: "1w", ratio: ma.sma._1w },
    { id: "8d", ratio: ma.sma._8d },
    { id: "13d", ratio: ma.sma._13d },
    { id: "21d", ratio: ma.sma._21d },
    { id: "1m", ratio: ma.sma._1m },
    { id: "34d", ratio: ma.sma._34d },
    { id: "55d", ratio: ma.sma._55d },
    { id: "89d", ratio: ma.sma._89d },
    { id: "111d", ratio: ma.sma._111d },
    { id: "144d", ratio: ma.sma._144d },
    { id: "200d", ratio: ma.sma._200d },
    { id: "350d", ratio: ma.sma._350d },
    { id: "1y", ratio: ma.sma._1y },
    { id: "2y", ratio: ma.sma._2y },
    { id: "200w", ratio: ma.sma._200w },
    { id: "4y", ratio: ma.sma._4y },
  ].map((p, i, arr) => ({ ...p, color: colors.at(i, arr.length) }));

  /** @type {MaPeriod[]} */
  const ema = [
    { id: "1w", ratio: ma.ema._1w },
    { id: "8d", ratio: ma.ema._8d },
    { id: "12d", ratio: ma.ema._12d },
    { id: "13d", ratio: ma.ema._13d },
    { id: "21d", ratio: ma.ema._21d },
    { id: "26d", ratio: ma.ema._26d },
    { id: "1m", ratio: ma.ema._1m },
    { id: "34d", ratio: ma.ema._34d },
    { id: "55d", ratio: ma.ema._55d },
    { id: "89d", ratio: ma.ema._89d },
    { id: "144d", ratio: ma.ema._144d },
    { id: "200d", ratio: ma.ema._200d },
    { id: "1y", ratio: ma.ema._1y },
    { id: "2y", ratio: ma.ema._2y },
    { id: "200w", ratio: ma.ema._200w },
    { id: "4y", ratio: ma.ema._4y },
  ].map((p, i, arr) => ({ ...p, color: colors.at(i, arr.length) }));
=======
  /** @type {MaPeriod[]} */
  const sma = [
    { id: "1w", color: colors.ma._1w, ratio: ma.price1wSma },
    { id: "8d", color: colors.ma._8d, ratio: ma.price8dSma },
    { id: "13d", color: colors.ma._13d, ratio: ma.price13dSma },
    { id: "21d", color: colors.ma._21d, ratio: ma.price21dSma },
    { id: "1m", color: colors.ma._1m, ratio: ma.price1mSma },
    { id: "34d", color: colors.ma._34d, ratio: ma.price34dSma },
    { id: "55d", color: colors.ma._55d, ratio: ma.price55dSma },
    { id: "89d", color: colors.ma._89d, ratio: ma.price89dSma },
    { id: "111d", color: colors.ma._111d, ratio: ma.price111dSma },
    { id: "144d", color: colors.ma._144d, ratio: ma.price144dSma },
    { id: "200d", color: colors.ma._200d, ratio: ma.price200dSma },
    { id: "350d", color: colors.ma._350d, ratio: ma.price350dSma },
    { id: "1y", color: colors.ma._1y, ratio: ma.price1ySma },
    { id: "2y", color: colors.ma._2y, ratio: ma.price2ySma },
    { id: "200w", color: colors.ma._200w, ratio: ma.price200wSma },
    { id: "4y", color: colors.ma._4y, ratio: ma.price4ySma },
  ];

  /** @type {MaPeriod[]} */
  const ema = [
    { id: "1w", color: colors.ma._1w, ratio: ma.price1wEma },
    { id: "8d", color: colors.ma._8d, ratio: ma.price8dEma },
    { id: "12d", color: colors.ma._12d, ratio: ma.price12dEma },
    { id: "13d", color: colors.ma._13d, ratio: ma.price13dEma },
    { id: "21d", color: colors.ma._21d, ratio: ma.price21dEma },
    { id: "26d", color: colors.ma._26d, ratio: ma.price26dEma },
    { id: "1m", color: colors.ma._1m, ratio: ma.price1mEma },
    { id: "34d", color: colors.ma._34d, ratio: ma.price34dEma },
    { id: "55d", color: colors.ma._55d, ratio: ma.price55dEma },
    { id: "89d", color: colors.ma._89d, ratio: ma.price89dEma },
    { id: "144d", color: colors.ma._144d, ratio: ma.price144dEma },
    { id: "200d", color: colors.ma._200d, ratio: ma.price200dEma },
    { id: "1y", color: colors.ma._1y, ratio: ma.price1yEma },
    { id: "2y", color: colors.ma._2y, ratio: ma.price2yEma },
    { id: "200w", color: colors.ma._200w, ratio: ma.price200wEma },
    { id: "4y", color: colors.ma._4y, ratio: ma.price4yEma },
  ];
>>>>>>> 69eb58f7 (chore: update website from upstream v0.1.5)

  // SMA vs EMA comparison periods (common periods only)
  const smaVsEma = [
    {
      id: "1w",
      name: "1 Week",
<<<<<<< HEAD
      sma: ma.sma._1w,
      ema: ma.ema._1w,
=======
      color: colors.ma._1w,
      sma: ma.price1wSma,
      ema: ma.price1wEma,
>>>>>>> 69eb58f7 (chore: update website from upstream v0.1.5)
    },
    {
      id: "1m",
      name: "1 Month",
<<<<<<< HEAD
      sma: ma.sma._1m,
      ema: ma.ema._1m,
=======
      color: colors.ma._1m,
      sma: ma.price1mSma,
      ema: ma.price1mEma,
>>>>>>> 69eb58f7 (chore: update website from upstream v0.1.5)
    },
    {
      id: "200d",
      name: "200 Day",
<<<<<<< HEAD
      sma: ma.sma._200d,
      ema: ma.ema._200d,
=======
      color: colors.ma._200d,
      sma: ma.price200dSma,
      ema: ma.price200dEma,
>>>>>>> 69eb58f7 (chore: update website from upstream v0.1.5)
    },
    {
      id: "1y",
      name: "1 Year",
<<<<<<< HEAD
      sma: ma.sma._1y,
      ema: ma.ema._1y,
=======
      color: colors.ma._1y,
      sma: ma.price1ySma,
      ema: ma.price1yEma,
>>>>>>> 69eb58f7 (chore: update website from upstream v0.1.5)
    },
    {
      id: "200w",
      name: "200 Week",
<<<<<<< HEAD
      sma: ma.sma._200w,
      ema: ma.ema._200w,
=======
      color: colors.ma._200w,
      sma: ma.price200wSma,
      ema: ma.price200wEma,
>>>>>>> 69eb58f7 (chore: update website from upstream v0.1.5)
    },
    {
      id: "4y",
      name: "4 Year",
<<<<<<< HEAD
      sma: ma.sma._4y,
      ema: ma.ema._4y,
    },
  ].map((p, i, arr) => ({ ...p, color: colors.at(i, arr.length) }));
=======
      color: colors.ma._4y,
      sma: ma.price4ySma,
      ema: ma.price4yEma,
    },
  ];
>>>>>>> 69eb58f7 (chore: update website from upstream v0.1.5)

  return {
    name: "Market",
    tree: [
<<<<<<< HEAD
      // Price
      { name: "Price", title: "Bitcoin Price" },

      // Sats/$
=======
      { name: "Price", title: "Bitcoin Price" },

>>>>>>> 69eb58f7 (chore: update website from upstream v0.1.5)
      {
        name: "Sats/$",
        title: "Sats per Dollar",
        bottom: [
          line({
<<<<<<< HEAD
            series: prices.spot.sats,
=======
            metric: priceMetrics.sats.split.close,
>>>>>>> 69eb58f7 (chore: update website from upstream v0.1.5)
            name: "Sats/$",
            unit: Unit.sats,
          }),
        ],
      },

<<<<<<< HEAD
      // All Time High
=======
      {
        name: "Capitalization",
        title: "Market Capitalization",
        bottom: [
          line({
            metric: supply.marketCap,
            name: "Capitalization",
            unit: Unit.usd,
          }),
        ],
      },

>>>>>>> 69eb58f7 (chore: update website from upstream v0.1.5)
      {
        name: "All Time High",
        tree: [
          {
            name: "Drawdown",
            title: "ATH Drawdown",
<<<<<<< HEAD
            top: [price({ series: ath.high, name: "ATH" })],
            bottom: percentRatio({
              pattern: ath.drawdown,
              name: "Drawdown",
              color: colors.loss,
            }),
=======
            top: [price({ metric: ath.priceAth, name: "ATH" })],
            bottom: [
              line({
                metric: ath.priceDrawdown,
                name: "Drawdown",
                color: colors.loss,
                unit: Unit.percentage,
              }),
            ],
>>>>>>> 69eb58f7 (chore: update website from upstream v0.1.5)
          },
          {
            name: "Time Since",
            title: "Time Since ATH",
<<<<<<< HEAD
            top: [price({ series: ath.high, name: "ATH" })],
            bottom: [
              line({
                series: ath.daysSince,
                name: "Days",
                unit: Unit.days,
              }),
              line({
                series: ath.yearsSince,
                name: "Years",
                unit: Unit.years,
              }),
              line({
                series: ath.maxDaysBetween,
                name: "Max Days",
=======
            top: [price({ metric: ath.priceAth, name: "ATH" })],
            bottom: [
              line({
                metric: ath.daysSincePriceAth,
                name: "Since",
                unit: Unit.days,
              }),
              line({
                metric: ath.yearsSincePriceAth,
                name: "Since",
                unit: Unit.years,
              }),
              line({
                metric: ath.maxDaysBetweenPriceAths,
                name: "Max",
>>>>>>> 69eb58f7 (chore: update website from upstream v0.1.5)
                color: colors.loss,
                unit: Unit.days,
              }),
              line({
<<<<<<< HEAD
                series: ath.maxYearsBetween,
                name: "Max Years",
=======
                metric: ath.maxYearsBetweenPriceAths,
                name: "Max",
>>>>>>> 69eb58f7 (chore: update website from upstream v0.1.5)
                color: colors.loss,
                unit: Unit.years,
              }),
            ],
          },
        ],
      },

<<<<<<< HEAD
      // Returns
=======
>>>>>>> 69eb58f7 (chore: update website from upstream v0.1.5)
      {
        name: "Returns",
        tree: [
          {
            name: "Compare",
<<<<<<< HEAD
            title: "Price Returns",
            bottom: [...shortPeriods, ...longPeriods].flatMap((p) =>
              percentRatioBaseline({
                pattern: p.returns,
                name: p.id,
                color: p.color,
=======
            title: "Returns Comparison",
            bottom: [...shortPeriods, ...longPeriods].map((p) =>
              baseline({
                metric: p.returns,
                name: p.id,
                color: p.color,
                unit: Unit.percentage,
>>>>>>> 69eb58f7 (chore: update website from upstream v0.1.5)
                defaultActive: p.defaultActive,
              }),
            ),
          },
          returnsSubSection("Short-term", shortPeriods),
          returnsSubSectionWithCagr("Long-term", longPeriods),
        ],
      },

<<<<<<< HEAD
      // Historical
=======
      {
        name: "Volatility",
        tree: [
          volatilityChart("Index", "Volatility Index", Unit.percentage, {
            _1w: volatility.price1wVolatility,
            _1m: volatility.price1mVolatility,
            _1y: volatility.price1yVolatility,
          }),
          {
            name: "True Range",
            title: "True Range",
            bottom: [
              line({
                metric: range.priceTrueRange,
                name: "Daily",
                color: colors.time._24h,
                unit: Unit.usd,
              }),
              line({
                metric: range.priceTrueRange2wSum,
                name: "2w Sum",
                color: colors.time._1w,
                unit: Unit.usd,
                defaultActive: false,
              }),
            ],
          },
          {
            name: "Choppiness",
            title: "Choppiness Index",
            bottom: [
              line({
                metric: range.price2wChoppinessIndex,
                name: "2w",
                color: colors.indicator.main,
                unit: Unit.index,
              }),
              ...priceLines({ unit: Unit.index, numbers: [61.8, 38.2] }),
            ],
          },
          volatilityChart("Sharpe Ratio", "Sharpe Ratio", Unit.ratio, {
            _1w: volatility.sharpe1w,
            _1m: volatility.sharpe1m,
            _1y: volatility.sharpe1y,
          }),
          volatilityChart("Sortino Ratio", "Sortino Ratio", Unit.ratio, {
            _1w: volatility.sortino1w,
            _1m: volatility.sortino1m,
            _1y: volatility.sortino1y,
          }),
        ],
      },

      {
        name: "Moving Averages",
        tree: [
          {
            name: "SMA vs EMA",
            tree: [
              {
                name: "All Periods",
                title: "SMA vs EMA Comparison",
                top: smaVsEma.flatMap((p) => [
                  price({
                    metric: p.sma.price,
                    name: `${p.id} SMA`,
                    color: p.color,
                  }),
                  price({
                    metric: p.ema.price,
                    name: `${p.id} EMA`,
                    color: p.color,
                    style: 1,
                  }),
                ]),
              },
              ...smaVsEma.map((p) => ({
                name: p.name,
                title: `${p.name} SMA vs EMA`,
                top: [
                  price({ metric: p.sma.price, name: "SMA", color: p.color }),
                  price({
                    metric: p.ema.price,
                    name: "EMA",
                    color: p.color,
                    style: 1,
                  }),
                ],
              })),
            ],
          },
          createMaSubSection("SMA", sma),
          createMaSubSection("EMA", ema),
        ],
      },

      {
        name: "Bands",
        tree: [
          {
            name: "MinMax",
            tree: [
              {
                id: "1w",
                name: "1 Week",
                min: range.price1wMin,
                max: range.price1wMax,
              },
              {
                id: "2w",
                name: "2 Week",
                min: range.price2wMin,
                max: range.price2wMax,
              },
              {
                id: "1m",
                name: "1 Month",
                min: range.price1mMin,
                max: range.price1mMax,
              },
              {
                id: "1y",
                name: "1 Year",
                min: range.price1yMin,
                max: range.price1yMax,
              },
            ].map((p) => ({
              name: p.id,
              title: `${p.name} MinMax`,
              top: [
                price({
                  metric: p.max,
                  name: "Max",
                  key: "price-max",
                  color: colors.stat.max,
                }),
                price({
                  metric: p.min,
                  name: "Min",
                  key: "price-min",
                  color: colors.stat.min,
                }),
              ],
            })),
          },
          {
            name: "Mayer Multiple",
            title: "Mayer Multiple",
            top: [
              price({
                metric: ma.price200dSma.price,
                name: "200d SMA",
                color: colors.ma._200d,
              }),
              price({
                metric: ma.price200dSmaX24,
                name: "200d SMA x2.4",
                color: colors.indicator.upper,
              }),
              price({
                metric: ma.price200dSmaX08,
                name: "200d SMA x0.8",
                color: colors.indicator.lower,
              }),
            ],
          },
        ],
      },

      {
        name: "Momentum",
        tree: [
          {
            name: "RSI",
            title: "RSI (14d)",
            bottom: [
              line({
                metric: indicators.rsi14d,
                name: "RSI",
                color: colors.indicator.main,
                unit: Unit.index,
              }),
              line({
                metric: indicators.rsi14dMax,
                name: "Max",
                color: colors.stat.max,
                defaultActive: false,
                unit: Unit.index,
              }),
              line({
                metric: indicators.rsi14dMin,
                name: "Min",
                color: colors.stat.min,
                defaultActive: false,
                unit: Unit.index,
              }),
              priceLine({ unit: Unit.index, number: 70 }),
              priceLine({ unit: Unit.index, number: 50, defaultActive: false }),
              priceLine({ unit: Unit.index, number: 30 }),
            ],
          },
          {
            name: "StochRSI",
            title: "Stochastic RSI",
            bottom: [
              line({
                metric: indicators.stochRsiK,
                name: "K",
                color: colors.indicator.fast,
                unit: Unit.index,
              }),
              line({
                metric: indicators.stochRsiD,
                name: "D",
                color: colors.indicator.slow,
                unit: Unit.index,
              }),
              ...priceLines({ unit: Unit.index, numbers: [80, 20] }),
            ],
          },
          {
            name: "MACD",
            title: "MACD",
            bottom: [
              line({
                metric: indicators.macdLine,
                name: "MACD",
                color: colors.indicator.fast,
                unit: Unit.usd,
              }),
              line({
                metric: indicators.macdSignal,
                name: "Signal",
                color: colors.indicator.slow,
                unit: Unit.usd,
              }),
              histogram({
                metric: indicators.macdHistogram,
                name: "Histogram",
                unit: Unit.usd,
              }),
            ],
          },
        ],
      },

>>>>>>> 69eb58f7 (chore: update website from upstream v0.1.5)
      {
        name: "Historical",
        tree: [
          {
            name: "Compare",
<<<<<<< HEAD
            title: "Historical Prices",
            top: [...shortPeriods, ...longPeriods].map((p) =>
              price({
                series: p.lookback,
=======
            title: "Historical Comparison",
            top: [...shortPeriods, ...longPeriods].map((p) =>
              price({
                metric: p.lookback,
>>>>>>> 69eb58f7 (chore: update website from upstream v0.1.5)
                name: p.id,
                color: p.color,
                defaultActive: p.defaultActive,
              }),
            ),
          },
          historicalSubSection("Short-term", shortPeriods),
          historicalSubSection("Long-term", longPeriods),
        ],
      },

<<<<<<< HEAD
      // Capitalization
      {
        name: "Capitalization",
        tree: [
          {
            name: "Compare",
            title: "Market vs Realized Cap",
            bottom: [
              line({
                series: supply.marketCap.usd,
                name: "Market Cap",
                unit: Unit.usd,
              }),
              line({
                series: cohorts.utxo.all.realized.cap.usd,
                name: "Realized Cap",
                color: colors.realized,
                unit: Unit.usd,
              }),
            ],
          },
          {
            name: "Market Cap",
            tree: [
              {
                name: "Value",
                title: "Market Capitalization",
                bottom: [
                  line({
                    series: supply.marketCap.usd,
                    name: "Market Cap",
                    unit: Unit.usd,
                  }),
                ],
              },
              ...deltaTree({
                delta: supply.marketCap.delta,
                metric: "Market Cap",
                unit: Unit.usd,
                extract: (v) => v.usd,
              }),
            ],
          },
          {
            name: "Realized Cap",
            tree: [
              {
                name: "Value",
                title: "Realized Cap",
                bottom: [
                  line({
                    series: cohorts.utxo.all.realized.cap.usd,
                    name: "Realized Cap",
                    color: colors.realized,
                    unit: Unit.usd,
                  }),
                ],
              },
              ...deltaTree({
                delta: cohorts.utxo.all.realized.cap.delta,
                metric: "Realized Cap",
                unit: Unit.usd,
                extract: (v) => v.usd,
              }),
            ],
          },
          {
            name: "Growth Rate Spread",
            tree: [
              {
                name: "Compare",
                title: "Capitalization Growth Rate Spread",
                bottom: ROLLING_WINDOWS.map((w) =>
                  baseline({
                    series: supply.marketMinusRealizedCapGrowthRate[w.key],
                    name: w.name,
                    color: w.color,
                    unit: Unit.percentage,
                  }),
                ),
              },
              ...ROLLING_WINDOWS.map((w) => ({
                name: w.name,
                title: `${w.title} Capitalization Growth Rate Spread`,
                bottom: [
                  baseline({
                    series: supply.marketMinusRealizedCapGrowthRate[w.key],
                    name: "Spread",
                    unit: Unit.percentage,
                  }),
                ],
              })),
            ],
          },
        ],
      },

      // Technical
      {
        name: "Technical",
        tree: [
          // Moving Averages
          {
            name: "Moving Averages",
            tree: [
              {
                name: "SMA vs EMA",
                tree: [
                  {
                    name: "All Periods",
                    title: "SMA vs EMA",
                    top: smaVsEma.flatMap((p) => [
                      price({
                        series: p.sma,
                        name: `${p.id} SMA`,
                        color: p.color,
                      }),
                      price({
                        series: p.ema,
                        name: `${p.id} EMA`,
                        color: p.color,
                        style: 1,
                      }),
                    ]),
                  },
                  ...smaVsEma.map((p) => ({
                    name: p.name,
                    title: `${p.name} SMA vs EMA`,
                    top: [
                      price({ series: p.sma, name: "SMA", color: p.color }),
                      price({
                        series: p.ema,
                        name: "EMA",
                        color: p.color,
                        style: 1,
                      }),
                    ],
                  })),
                ],
              },
              createMaSubSection("SMA", sma),
              createMaSubSection("EMA", ema),
            ],
          },

          // Momentum
          {
            name: "Momentum",
            tree: [
              {
                name: "RSI",
                tree: [
                  {
                    name: "Compare",
                    title: "RSI",
                    bottom: [
                      ...ROLLING_WINDOWS_TO_1M.flatMap((w) =>
                        indexRatio({
                          pattern: technical.rsi[w.key].rsi,
                          name: w.name,
                          color: w.color,
                        }),
                      ),
                      priceLine({ unit: Unit.index, number: 70 }),
                      priceLine({ unit: Unit.index, number: 30 }),
                    ],
                  },
                  ...ROLLING_WINDOWS_TO_1M.map((w) => {
                    const rsi = technical.rsi[w.key];
                    return {
                      name: w.name,
                      title: `${w.title} RSI`,
                      bottom: [
                        ...indexRatio({
                          pattern: rsi.rsi,
                          name: "RSI",
                          color: colors.indicator.main,
                        }),
                        priceLine({ unit: Unit.index, number: 70 }),
                        priceLine({
                          unit: Unit.index,
                          number: 50,
                          defaultActive: false,
                        }),
                        priceLine({ unit: Unit.index, number: 30 }),
                      ],
                    };
                  }),
                  {
                    name: "Stochastic",
                    tree: ROLLING_WINDOWS_TO_1M.map((w) => {
                      const rsi = technical.rsi[w.key];
                      return {
                        name: w.name,
                        title: `${w.title} Stochastic RSI`,
                        bottom: [
                          ...indexRatio({
                            pattern: rsi.stochRsiK,
                            name: "K",
                            color: colors.indicator.fast,
                          }),
                          ...indexRatio({
                            pattern: rsi.stochRsiD,
                            name: "D",
                            color: colors.indicator.slow,
                          }),
                          ...priceLines({
                            unit: Unit.index,
                            numbers: [80, 20],
                          }),
                        ],
                      };
                    }),
                  },
                ],
              },
              {
                name: "MACD",
                tree: [
                  {
                    name: "Compare",
                    title: "MACD",
                    bottom: ROLLING_WINDOWS_TO_1M.map((w) =>
                      line({
                        series: technical.macd[w.key].line,
                        name: w.name,
                        color: w.color,
                        unit: Unit.usd,
                      }),
                    ),
                  },
                  ...ROLLING_WINDOWS_TO_1M.map((w) => ({
                    name: w.name,
                    title: `${w.title} MACD`,
                    bottom: [
                      line({
                        series: technical.macd[w.key].line,
                        name: "MACD",
                        color: colors.indicator.fast,
                        unit: Unit.usd,
                      }),
                      line({
                        series: technical.macd[w.key].signal,
                        name: "Signal",
                        color: colors.indicator.slow,
                        unit: Unit.usd,
                      }),
                      histogram({
                        series: technical.macd[w.key].histogram,
                        name: "Histogram",
                        unit: Unit.usd,
                      }),
                    ],
                  })),
                ],
              },
            ],
          },

          // Volatility
          {
            name: "Volatility",
            tree: [
              {
                name: "Index",
                tree: [
                  {
                    name: "Compare",
                    title: "Volatility Index",
                    bottom: ROLLING_WINDOWS.map((w) =>
                      line({
                        series: volatility[w.key],
                        name: w.name,
                        color: w.color,
                        unit: Unit.percentage,
                      }),
                    ),
                  },
                  ...ROLLING_WINDOWS.map((w) => ({
                    name: w.name,
                    title: `${w.title} Volatility Index`,
                    bottom: [
                      line({
                        series: volatility[w.key],
                        name: "Volatility",
                        color: w.color,
                        unit: Unit.percentage,
                      }),
                    ],
                  })),
                ],
              },
              {
                name: "True Range",
                tree: [
                  {
                    name: "Daily",
                    title: "Daily True Range",
                    bottom: [
                      line({
                        series: range.trueRange,
                        name: "True Range",
                        color: colors.time._24h,
                        unit: Unit.usd,
                      }),
                    ],
                  },
                  {
                    name: "2 Week Sum",
                    title: "2 Week True Range Sum",
                    bottom: [
                      line({
                        series: range.trueRangeSum2w,
                        name: "2w Sum",
                        color: colors.time._1w,
                        unit: Unit.usd,
                      }),
                    ],
                  },
                ],
              },
              {
                name: "Choppiness",
                title: "Choppiness Index",
                bottom: [
                  ...percentRatio({
                    pattern: range.choppinessIndex2w,
                    name: "2w",
                    color: colors.indicator.main,
                  }),
                  ...priceLines({ unit: Unit.index, numbers: [61.8, 38.2] }),
                ],
              },
            ],
          },

          // Price Bands
          {
            name: "Price Bands",
            tree: [
              {
                name: "Mayer Multiple",
                title: "Mayer Multiple",
                top: [
                  price({
                    series: ma.sma._200d,
                    name: "200d SMA",
                    color: colors.indicator.main,
                  }),
                  price({
                    series: ma.sma._200d.x24,
                    name: "200d SMA x2.4",
                    color: colors.indicator.upper,
                  }),
                  price({
                    series: ma.sma._200d.x08,
                    name: "200d SMA x0.8",
                    color: colors.indicator.lower,
                  }),
                ],
              },
              {
                name: "Min/Max",
                tree: [
                  {
                    id: "1w",
                    name: "1 Week",
                    min: range.min._1w,
                    max: range.max._1w,
                  },
                  {
                    id: "2w",
                    name: "2 Week",
                    min: range.min._2w,
                    max: range.max._2w,
                  },
                  {
                    id: "1m",
                    name: "1 Month",
                    min: range.min._1m,
                    max: range.max._1m,
                  },
                  {
                    id: "1y",
                    name: "1 Year",
                    min: range.min._1y,
                    max: range.max._1y,
                  },
                ].map((p) => ({
                  name: p.id,
                  title: `${p.name} Min/Max`,
                  top: [
                    price({
                      series: p.max,
                      name: "Max",
                      key: "price-max",
                      color: colors.stat.max,
                    }),
                    price({
                      series: p.min,
                      name: "Min",
                      key: "price-min",
                      color: colors.stat.min,
                    }),
                  ],
                })),
              },
            ],
          },
        ],
      },

      // Indicators
=======
>>>>>>> 69eb58f7 (chore: update website from upstream v0.1.5)
      {
        name: "Indicators",
        tree: [
          {
<<<<<<< HEAD
            name: "Envelope",
            title: "Realized Envelope",
            top: priceBands(percentileBands(indicators.realizedEnvelope), {
              defaultActive: true,
            }),
            bottom: [
              histogram({
                series: indicators.realizedEnvelope.index,
                name: "Index",
                unit: Unit.count,
                colorFn: (v) =>
                  /** @type {const} */ ([
                    colors.ratioPct._0_5,
                    colors.ratioPct._1,
                    colors.ratioPct._2,
                    colors.ratioPct._5,
                    colors.transparent,
                    colors.ratioPct._95,
                    colors.ratioPct._98,
                    colors.ratioPct._99,
                    colors.ratioPct._99_5,
                  ])[v + 4],
              }),
              baseline({
                series: indicators.realizedEnvelope.score,
                name: "Score",
                unit: Unit.count,
                color: [colors.ratioPct._99, colors.ratioPct._1],
                defaultActive: false,
=======
            name: "Pi Cycle",
            title: "Pi Cycle",
            top: [
              price({
                metric: ma.price111dSma.price,
                name: "111d SMA",
                color: colors.indicator.upper,
              }),
              price({
                metric: ma.price350dSmaX2,
                name: "350d SMA x2",
                color: colors.indicator.lower,
              }),
            ],
            bottom: [
              baseline({
                metric: indicators.piCycle,
                name: "Pi Cycle",
                unit: Unit.ratio,
                base: 1,
>>>>>>> 69eb58f7 (chore: update website from upstream v0.1.5)
              }),
            ],
          },
          {
<<<<<<< HEAD
            name: "Valuation",
            tree: [
              {
                name: "NVT",
                title: "NVT Ratio",
                bottom: [
                  line({
                    series: indicators.nvt.ratio,
                    name: "NVT",
                    color: colors.bitcoin,
                    unit: Unit.ratio,
                  }),
                ],
              },
              {
                name: "MVRV Z-Score",
                title: "MVRV Z-Score",
                bottom: [
                  baseline({
                    series: indicators.mvrvZScore,
                    name: "Z-Score",
                    color: colors.bitcoin,
                    unit: Unit.ratio,
                    base: 0,
                  }),
                ],
              },
              {
                name: "Thermocap Multiple",
                title: "Thermocap Multiple",
                bottom: [
                  line({
                    series: indicators.thermoCapMultiple.ratio,
                    name: "Thermocap",
                    color: colors.bitcoin,
                    unit: Unit.ratio,
                  }),
                ],
              },
            ],
          },
          {
            name: "Cycle",
            tree: [
              {
                name: "Pi Cycle",
                title: "Pi Cycle",
                top: [
                  price({
                    series: ma.sma._111d,
                    name: "111d SMA",
                    color: colors.indicator.upper,
                  }),
                  price({
                    series: ma.sma._350d.x2,
                    name: "350d SMA x2",
                    color: colors.indicator.lower,
                  }),
                ],
                bottom: [
                  baseline({
                    series: technical.piCycle.ratio,
                    name: "Pi Cycle",
                    unit: Unit.ratio,
                    base: 1,
                  }),
                ],
              },
              {
                name: "Stock-to-Flow",
                title: "Stock-to-Flow",
                bottom: [
                  line({
                    series: indicators.stockToFlow,
                    name: "S2F",
                    color: colors.bitcoin,
                    unit: Unit.ratio,
                  }),
                ],
              },
              {
                name: "Puell Multiple",
                title: "Puell Multiple",
                bottom: [
                  line({
                    series: indicators.puellMultiple.ratio,
                    name: "Puell",
                    color: colors.usd,
                    unit: Unit.ratio,
                  }),
                ],
              },
              {
                name: "RHODL Ratio",
                title: "RHODL Ratio",
                bottom: [
                  line({
                    series: indicators.rhodlRatio.ratio,
                    name: "RHODL",
                    color: colors.bitcoin,
                    unit: Unit.ratio,
                  }),
                ],
              },
            ],
          },
          {
            name: "Activity",
            tree: [
              {
                name: "Dormancy",
                title: "Dormancy",
                bottom: [
                  line({
                    series: indicators.dormancy.supplyAdjusted,
                    name: "Supply Adjusted",
                    color: colors.bitcoin,
                    unit: Unit.ratio,
                  }),
                  line({
                    series: indicators.dormancy.flow,
                    name: "Flow",
                    color: colors.usd,
                    unit: Unit.ratio,
                    defaultActive: false,
                  }),
                ],
              },
              {
                name: "Seller Exhaustion",
                title: "Seller Exhaustion Constant",
                bottom: [
                  line({
                    series: indicators.sellerExhaustion,
                    name: "SEC",
                    color: colors.bitcoin,
                    unit: Unit.ratio,
                  }),
                ],
              },
              {
                name: "CDD Supply Adjusted",
                title: "Coindays Destroyed (Supply Adjusted)",
                bottom: [
                  line({
                    series: indicators.coindaysDestroyedSupplyAdjusted,
                    name: "CDD SA",
                    color: colors.bitcoin,
                    unit: Unit.ratio,
                  }),
                ],
              },
              {
                name: "CYD Supply Adjusted",
                title: "Coinyears Destroyed (Supply Adjusted)",
                bottom: [
                  line({
                    series: indicators.coinyearsDestroyedSupplyAdjusted,
                    name: "CYD SA",
                    color: colors.bitcoin,
                    unit: Unit.ratio,
                  }),
                ],
              },
=======
            name: "Puell Multiple",
            title: "Puell Multiple",
            bottom: [
              line({
                metric: indicators.puellMultiple,
                name: "Puell",
                color: colors.usd,
                unit: Unit.ratio,
              }),
            ],
          },
          {
            name: "NVT",
            title: "NVT Ratio",
            bottom: [
              line({
                metric: indicators.nvt,
                name: "NVT",
                color: colors.bitcoin,
                unit: Unit.ratio,
              }),
>>>>>>> 69eb58f7 (chore: update website from upstream v0.1.5)
            ],
          },
          {
            name: "Gini",
            title: "Gini Coefficient",
<<<<<<< HEAD
            bottom: percentRatio({
              pattern: indicators.gini,
              name: "Gini",
              color: colors.loss,
            }),
=======
            bottom: [
              line({
                metric: indicators.gini,
                name: "Gini",
                color: colors.loss,
                unit: Unit.ratio,
              }),
            ],
>>>>>>> 69eb58f7 (chore: update website from upstream v0.1.5)
          },
        ],
      },
    ],
  };
}
