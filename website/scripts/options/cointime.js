import { Unit } from "../utils/units.js";
<<<<<<< HEAD
<<<<<<< HEAD
import {
  dots,
  line,
  price,
  multiSeriesTree,
  percentRatioDots,
  sumsAndAveragesCumulative,
} from "./series.js";
import { satsBtcUsd, priceRatioPercentilesTree } from "./shared.js";
=======
import { dots, line, price } from "./series.js";
import { satsBtcUsd, createPriceRatioCharts } from "./shared.js";
>>>>>>> 69eb58f7 (chore: update website from upstream v0.1.5)
=======
import { line, price } from "./series.js";
import {
  satsBtcUsd,
  createRatioChart,
  createZScoresFolder,
  formatCohortTitle,
} from "./shared.js";

/**
 * Create price with ratio options for cointime prices
 * @param {PartialContext} ctx
 * @param {Object} args
 * @param {string} args.title
 * @param {string} args.legend
 * @param {AnyPricePattern} args.pricePattern
 * @param {ActivePriceRatioPattern} args.ratio
 * @param {Color} args.color
 * @returns {PartialOptionsTree}
 */
function createCointimePriceWithRatioOptions(
  ctx,
  { title, legend, pricePattern, ratio, color },
) {
  return [
    {
      name: "Price",
      title,
      top: [price({ metric: pricePattern, name: legend, color })],
    },
    createRatioChart(ctx, { title: formatCohortTitle(title), pricePattern, ratio, color }),
    createZScoresFolder(ctx, { title, legend, pricePattern, ratio, color }),
  ];
}
>>>>>>> a29452a8 (Revert "chore: update website from upstream v0.1.5")

/**
 * Create Cointime section
 * @param {PartialContext} ctx
 * @returns {PartialOptionsGroup}
 */
<<<<<<< HEAD
export function createCointimeSection() {
<<<<<<< HEAD
  const { cointime, cohorts, supply } = brk.series;
=======
=======
export function createCointimeSection(ctx) {
  const { colors, brk } = ctx;
>>>>>>> a29452a8 (Revert "chore: update website from upstream v0.1.5")
  const { cointime, distribution, supply } = brk.metrics;
>>>>>>> 69eb58f7 (chore: update website from upstream v0.1.5)
  const {
    prices: cointimePrices,
    cap,
    activity,
    supply: cointimeSupply,
    adjusted,
    reserveRisk,
    value,
  } = cointime;
  const { all } = cohorts.utxo;

<<<<<<< HEAD
  // Reference lines for cap comparisons
  const capReferenceLines = /** @type {const} */ ([
<<<<<<< HEAD
    { series: supply.marketCap.usd, name: "Market", color: colors.default },
=======
    { metric: supply.marketCap, name: "Market", color: colors.default },
    {
      metric: all.realized.realizedCap,
      name: "Realized",
      color: colors.realized,
    },
  ]);

  const prices = /** @type {const} */ ([
>>>>>>> 69eb58f7 (chore: update website from upstream v0.1.5)
=======
  // Cointime prices data
  const cointimePrices = [
>>>>>>> a29452a8 (Revert "chore: update website from upstream v0.1.5")
    {
      series: all.realized.cap.usd,
      name: "Realized",
      color: colors.realized,
    },
  ]);

  const prices = /** @type {const} */ ([
    {
      pattern: cointimePrices.trueMarketMean,
      name: "True Market Mean",
<<<<<<< HEAD
      color: colors.trueMarketMean,
<<<<<<< HEAD
      defaultActive: true,
=======
>>>>>>> 69eb58f7 (chore: update website from upstream v0.1.5)
=======
      title: "True Market Mean",
      color: colors.blue,
>>>>>>> a29452a8 (Revert "chore: update website from upstream v0.1.5")
    },
    {
      pattern: cointimePrices.vaulted,
      name: "Vaulted",
<<<<<<< HEAD
      color: colors.vaulted,
<<<<<<< HEAD
      defaultActive: true,
=======
>>>>>>> 69eb58f7 (chore: update website from upstream v0.1.5)
=======
      title: "Vaulted Price",
      color: colors.lime,
>>>>>>> a29452a8 (Revert "chore: update website from upstream v0.1.5")
    },
    {
      pattern: cointimePrices.active,
      name: "Active",
<<<<<<< HEAD
      color: colors.active,
<<<<<<< HEAD
      defaultActive: true,
=======
>>>>>>> 69eb58f7 (chore: update website from upstream v0.1.5)
=======
      title: "Active Price",
      color: colors.rose,
>>>>>>> a29452a8 (Revert "chore: update website from upstream v0.1.5")
    },
    {
      pattern: cointimePrices.cointime,
      name: "Cointime",
<<<<<<< HEAD
      color: colors.cointime,
<<<<<<< HEAD
      defaultActive: true,
=======
>>>>>>> 69eb58f7 (chore: update website from upstream v0.1.5)
=======
      title: "Cointime Price",
      color: colors.yellow,
>>>>>>> a29452a8 (Revert "chore: update website from upstream v0.1.5")
    },
  ];

<<<<<<< HEAD
  const caps = /** @type {const} */ ([
<<<<<<< HEAD
    {
      series: cap.vaulted.usd,
      name: "Vaulted",
      color: colors.vaulted,
      defaultActive: true,
    },
    {
      series: cap.active.usd,
      name: "Active",
      color: colors.active,
      defaultActive: true,
    },
    {
      series: cap.cointime.usd,
      name: "Cointime",
      color: colors.cointime,
      defaultActive: true,
    },
    {
      series: cap.investor.usd,
      name: "Investor",
      color: colors.investor,
      defaultActive: false,
    },
    {
      series: cap.thermo.usd,
      name: "Thermo",
      color: colors.thermo,
      defaultActive: false,
    },
  ]);

  const supplyBreakdown = /** @type {const} */ ([
    { pattern: all.supply.total, name: "Total", color: colors.bitcoin },
    {
      pattern: cointimeSupply.vaulted,
      name: "Vaulted",
      color: colors.vaulted,
    },
    {
      pattern: cointimeSupply.active,
      name: "Active",
      color: colors.active,
    },
  ]);

  const coinblocks = /** @type {const} */ ([
    {
      pattern: activity.coinblocksDestroyed,
      name: "Destroyed",
      title: "Coinblocks Destroyed",
      color: colors.destroyed,
    },
    {
      pattern: activity.coinblocksCreated,
      name: "Created",
      title: "Coinblocks Created",
      color: colors.created,
    },
    {
      pattern: activity.coinblocksStored,
      name: "Stored",
      title: "Coinblocks Stored",
      color: colors.stored,
    },
  ]);

  // Colors aligned with coinblocks: Destroyed=red, Created=orange, Stored=green
  const cointimeValues = /** @type {const} */ ([
    {
      pattern: value.created,
      name: "Created",
      title: "Cointime Value Created",
      color: colors.created,
    },
    {
      pattern: value.destroyed,
      name: "Destroyed",
      title: "Cointime Value Destroyed",
      color: colors.destroyed,
    },
    {
      pattern: value.stored,
=======
    { metric: cap.vaultedCap, name: "Vaulted", color: colors.vaulted },
    { metric: cap.activeCap, name: "Active", color: colors.active },
    { metric: cap.cointimeCap, name: "Cointime", color: colors.cointime },
    { metric: cap.investorCap, name: "Investor", color: colors.investor },
    { metric: cap.thermoCap, name: "Thermo", color: colors.thermo },
  ]);

  const supplyBreakdown = /** @type {const} */ ([
    { pattern: all.supply.total, name: "Total", color: colors.bitcoin },
=======
  // Cointime capitalizations data
  const cointimeCapitalizations = [
>>>>>>> a29452a8 (Revert "chore: update website from upstream v0.1.5")
    {
      metric: cap.vaultedCap,
      name: "Vaulted",
      title: "Vaulted Cap",
      color: colors.lime,
    },
    {
      metric: cap.activeCap,
      name: "Active",
      title: "Active Cap",
      color: colors.rose,
    },
    {
      metric: cap.cointimeCap,
      name: "Cointime",
      title: "Cointime Cap",
      color: colors.yellow,
    },
    {
      metric: cap.investorCap,
      name: "Investor",
      title: "Investor Cap",
      color: colors.fuchsia,
    },
    {
      metric: cap.thermoCap,
      name: "Thermo",
      title: "Thermo Cap",
      color: colors.emerald,
    },
<<<<<<< HEAD
    {
      pattern: value.cointimeValueStored,
>>>>>>> 69eb58f7 (chore: update website from upstream v0.1.5)
      name: "Stored",
      title: "Cointime Value Stored",
      color: colors.stored,
    },
  ]);

  const vocdd = /** @type {const} */ ({
    pattern: value.vocdd,
    name: "VOCDD",
    title: "Value of Coin Days Destroyed",
    color: colors.vocdd,
  });
=======
  ];
>>>>>>> a29452a8 (Revert "chore: update website from upstream v0.1.5")

  return {
    name: "Cointime",
    tree: [
<<<<<<< HEAD
<<<<<<< HEAD
=======
      // Prices - the core pricing models
>>>>>>> 69eb58f7 (chore: update website from upstream v0.1.5)
=======
      // Prices
>>>>>>> a29452a8 (Revert "chore: update website from upstream v0.1.5")
      {
        name: "Prices",
        tree: [
          {
            name: "Compare",
            title: "Cointime Prices",
<<<<<<< HEAD
            top: [
              price({
<<<<<<< HEAD
                series: all.realized.price,
=======
                metric: all.realized.realizedPrice,
>>>>>>> 69eb58f7 (chore: update website from upstream v0.1.5)
                name: "Realized",
                color: colors.realized,
              }),
              price({
<<<<<<< HEAD
                series: all.realized.investor.price,
                name: "Investor",
                color: colors.investor,
              }),
              ...prices.map(({ pattern, name, color, defaultActive }) =>
                price({ series: pattern, name, color, defaultActive }),
              ),
            ],
          },
          ...prices.map(({ pattern, name, color }) => ({
            name,
            tree: priceRatioPercentilesTree({
              pattern,
              title: `${name} Price`,
              legend: name,
              color,
              priceReferences: [
                price({
                  series: all.realized.price,
=======
                metric: all.realized.investorPrice,
                name: "Investor",
                color: colors.investor,
              }),
              ...prices.map(({ pricePattern, name, color }) =>
                price({ metric: pricePattern, name, color }),
              ),
            ],
=======
            top: cointimePrices.map(({ pricePattern, name, color }) =>
              price({ metric: pricePattern, name, color }),
            ),
>>>>>>> a29452a8 (Revert "chore: update website from upstream v0.1.5")
          },
          ...cointimePrices.map(({ pricePattern, ratio, name, color, title }) => ({
            name,
            tree: createCointimePriceWithRatioOptions(ctx, {
              pricePattern,
              ratio,
              legend: name,
              color,
<<<<<<< HEAD
              priceReferences: [
                price({
                  metric: all.realized.realizedPrice,
>>>>>>> 69eb58f7 (chore: update website from upstream v0.1.5)
                  name: "Realized",
                  color: colors.realized,
                  defaultActive: false,
                }),
              ],
=======
              title,
>>>>>>> a29452a8 (Revert "chore: update website from upstream v0.1.5")
            }),
          })),
        ],
      },

<<<<<<< HEAD
<<<<<<< HEAD
=======
      // Caps - market capitalizations from different models
>>>>>>> 69eb58f7 (chore: update website from upstream v0.1.5)
=======
      // Capitalization
>>>>>>> a29452a8 (Revert "chore: update website from upstream v0.1.5")
      {
        name: "Capitalization",
        tree: [
          {
            name: "Compare",
            title: "Cointime Caps",
            bottom: [
<<<<<<< HEAD
<<<<<<< HEAD
              ...capReferenceLines.map(({ series, name, color }) =>
                line({ series, name, color, unit: Unit.usd }),
              ),
              ...caps.map(({ series, name, color, defaultActive }) =>
                line({ series, name, color, defaultActive, unit: Unit.usd }),
              ),
            ],
          },
          ...caps.map(({ series, name, color }) => ({
            name,
            title: `${name} Cap`,
            bottom: [
              line({ series, name, color, unit: Unit.usd }),
              ...capReferenceLines.map((ref) =>
                line({
                  series: ref.series,
=======
              ...capReferenceLines.map(({ metric, name, color }) =>
                line({ metric, name, color, unit: Unit.usd }),
              ),
              ...caps.map(({ metric, name, color }) =>
=======
              line({
                metric: supply.marketCap,
                name: "Market",
                color: colors.default,
                unit: Unit.usd,
              }),
              line({
                metric: all.realized.realizedCap,
                name: "Realized",
                color: colors.orange,
                unit: Unit.usd,
              }),
              ...cointimeCapitalizations.map(({ metric, name, color }) =>
>>>>>>> a29452a8 (Revert "chore: update website from upstream v0.1.5")
                line({ metric, name, color, unit: Unit.usd }),
              ),
            ],
          },
          ...cointimeCapitalizations.map(({ metric, name, color, title }) => ({
            name,
            title,
            bottom: [
              line({ metric, name, color, unit: Unit.usd }),
<<<<<<< HEAD
              ...capReferenceLines.map((ref) =>
                line({
                  metric: ref.metric,
>>>>>>> 69eb58f7 (chore: update website from upstream v0.1.5)
                  name: ref.name,
                  color: ref.color,
                  unit: Unit.usd,
                }),
              ),
=======
              line({
                metric: supply.marketCap,
                name: "Market",
                color: colors.default,
                unit: Unit.usd,
              }),
              line({
                metric: all.realized.realizedCap,
                name: "Realized",
                color: colors.orange,
                unit: Unit.usd,
              }),
>>>>>>> a29452a8 (Revert "chore: update website from upstream v0.1.5")
            ],
          })),
        ],
      },

<<<<<<< HEAD
<<<<<<< HEAD
=======
      // Supply - active vs vaulted breakdown
>>>>>>> 69eb58f7 (chore: update website from upstream v0.1.5)
=======
      // Supply
>>>>>>> a29452a8 (Revert "chore: update website from upstream v0.1.5")
      {
        name: "Supply",
        title: "Cointime Supply",
        bottom: [
          ...satsBtcUsd(all.supply.total, "All", colors.orange),
          ...satsBtcUsd(cointimeSupply.vaultedSupply, "Vaulted", colors.lime),
          ...satsBtcUsd(cointimeSupply.activeSupply, "Active", colors.rose),
        ],
      },

<<<<<<< HEAD
<<<<<<< HEAD
=======
      // Liveliness - the foundational cointime ratios
>>>>>>> 69eb58f7 (chore: update website from upstream v0.1.5)
=======
      // Liveliness & Vaultedness
>>>>>>> a29452a8 (Revert "chore: update website from upstream v0.1.5")
      {
        name: "Liveliness & Vaultedness",
        title: "Liveliness & Vaultedness",
        bottom: [
          line({
            series: activity.liveliness,
            name: "Liveliness",
            color: colors.rose,
            unit: Unit.ratio,
          }),
          line({
            series: activity.vaultedness,
            name: "Vaultedness",
            color: colors.lime,
            unit: Unit.ratio,
          }),
          line({
<<<<<<< HEAD
            series: activity.ratio,
            name: "Liveliness / Vaultedness",
=======
            metric: activity.activityToVaultednessRatio,
<<<<<<< HEAD
            name: "L/V Ratio",
>>>>>>> 69eb58f7 (chore: update website from upstream v0.1.5)
            color: colors.activity,
=======
            name: "Liveliness / Vaultedness",
            color: colors.purple,
>>>>>>> a29452a8 (Revert "chore: update website from upstream v0.1.5")
            unit: Unit.ratio,
          }),
        ],
      },

<<<<<<< HEAD
<<<<<<< HEAD
      {
        name: "Coinblocks",
        tree: [
          ...multiSeriesTree({
            entries: coinblocks.map(({ pattern, name, color }) => ({
              name,
              color,
              average: pattern.average,
              sum: pattern.sum,
              cumulative: pattern.cumulative,
            })),
            metric: "Coinblocks",
            unit: Unit.coinblocks,
          }),
          ...coinblocks.map(({ pattern, name, title: metric, color }) => ({
            name,
            tree: sumsAndAveragesCumulative({
              sum: pattern.sum,
              average: pattern.average,
              cumulative: pattern.cumulative,
              metric,
              unit: Unit.coinblocks,
              color,
            }),
          })),
        ],
      },

=======
      // Coinblocks - created, destroyed, stored
=======
      // Coinblocks
>>>>>>> a29452a8 (Revert "chore: update website from upstream v0.1.5")
      {
        name: "Coinblocks",
        title: "Coinblocks",
        bottom: [
          // Destroyed comes from the all cohort's activity
          line({
            metric: all.activity.coinblocksDestroyed.sum,
            name: "Destroyed",
            color: colors.red,
            unit: Unit.coinblocks,
          }),
          line({
            metric: all.activity.coinblocksDestroyed.cumulative,
            name: "Cumulative Destroyed",
            color: colors.red,
            defaultActive: false,
            unit: Unit.coinblocks,
          }),
          // Created and stored from cointime
          line({
            metric: activity.coinblocksCreated.sum,
            name: "Created",
            color: colors.orange,
            unit: Unit.coinblocks,
          }),
          line({
            metric: activity.coinblocksCreated.cumulative,
            name: "Cumulative Created",
            color: colors.orange,
            defaultActive: false,
            unit: Unit.coinblocks,
          }),
          line({
            metric: activity.coinblocksStored.sum,
            name: "Stored",
            color: colors.green,
            unit: Unit.coinblocks,
          }),
          line({
            metric: activity.coinblocksStored.cumulative,
            name: "Cumulative Stored",
            color: colors.green,
            defaultActive: false,
            unit: Unit.coinblocks,
          }),
        ],
      },

      // Reserve Risk
      {
        name: "Reserve Risk",
        tree: [
          {
            name: "Ratio",
            title: "Reserve Risk",
            bottom: [
              line({
                metric: reserveRisk.reserveRisk,
                name: "Reserve Risk",
                color: colors.orange,
                unit: Unit.ratio,
              }),
            ],
          },
          {
            name: "HODL Bank",
            title: "HODL Bank",
            bottom: [
              line({
                metric: reserveRisk.hodlBank,
                name: "HODL Bank",
                color: colors.blue,
                unit: Unit.ratio,
              }),
            ],
          },
          {
            name: "VOCDD 365d SMA",
            title: "VOCDD 365d SMA",
            bottom: [
              line({
                metric: reserveRisk.vocdd365dSma,
                name: "VOCDD 365d SMA",
                color: colors.purple,
                unit: Unit.ratio,
              }),
            ],
          },
        ],
      },

<<<<<<< HEAD
      // Cointime-Adjusted - comparing base vs adjusted metrics
>>>>>>> 69eb58f7 (chore: update website from upstream v0.1.5)
      {
        name: "Cointime-Adjusted",
        tree: [
          ...multiSeriesTree({
            entries: [
              ...cointimeValues.map(({ pattern, name, color }) => ({
                name,
                color,
                average: pattern.average,
                sum: pattern.sum,
                cumulative: pattern.cumulative,
              })),
              {
                name: vocdd.name,
                color: vocdd.color,
                average: vocdd.pattern.average,
                sum: vocdd.pattern.sum,
                cumulative: vocdd.pattern.cumulative,
              },
            ],
            metric: "Cointime Value",
            unit: Unit.usd,
          }),
          ...cointimeValues.map(({ pattern, name, title: metric, color }) => ({
            name,
            tree: sumsAndAveragesCumulative({
              sum: pattern.sum,
              average: pattern.average,
              cumulative: pattern.cumulative,
              metric,
              unit: Unit.usd,
              color,
            }),
          })),
          {
<<<<<<< HEAD
            name: vocdd.name,
            tree: sumsAndAveragesCumulative({
              sum: vocdd.pattern.sum,
              average: vocdd.pattern.average,
              cumulative: vocdd.pattern.cumulative,
              metric: vocdd.title,
              unit: Unit.usd,
              color: vocdd.color,
            }),
          },
        ],
      },

      {
        name: "Indicators",
        tree: [
          {
            name: "Reserve Risk",
            title: "Reserve Risk",
            bottom: [
              line({
                series: reserveRisk.value,
                name: "Ratio",
                color: colors.reserveRisk,
                unit: Unit.ratio,
              }),
            ],
          },
          {
            name: "AVIV",
            title: "AVIV Ratio",
            bottom: [
              line({
                series: cap.aviv.ratio,
                name: "AVIV",
                unit: Unit.ratio,
              }),
            ],
          },
        ],
      },

=======
      // Cointime Value
>>>>>>> a29452a8 (Revert "chore: update website from upstream v0.1.5")
      {
        name: "Value",
        tree: [
          {
<<<<<<< HEAD
=======
>>>>>>> 69eb58f7 (chore: update website from upstream v0.1.5)
            name: "Inflation",
            title: "Cointime-Adjusted Inflation",
            bottom: [
              dots({
<<<<<<< HEAD
                series: supply.inflationRate.percent,
=======
                metric: supply.inflation,
>>>>>>> 69eb58f7 (chore: update website from upstream v0.1.5)
                name: "Base",
                color: colors.base,
                unit: Unit.percentage,
              }),
<<<<<<< HEAD
              ...percentRatioDots({
                pattern: adjusted.inflationRate,
                name: "Cointime-Adjusted",
                color: colors.adjusted,
=======
              dots({
                metric: adjusted.cointimeAdjInflationRate,
                name: "Cointime-Adjusted",
                color: colors.adjusted,
                unit: Unit.percentage,
>>>>>>> 69eb58f7 (chore: update website from upstream v0.1.5)
=======
            name: "Created",
            title: "Cointime Value Created",
            bottom: [
              line({
                metric: value.cointimeValueCreated.sum,
                name: "Created",
                color: colors.green,
                unit: Unit.usd,
              }),
              line({
                metric: value.cointimeValueCreated.cumulative,
                name: "Cumulative",
                color: colors.green,
                unit: Unit.usd,
                defaultActive: false,
>>>>>>> a29452a8 (Revert "chore: update website from upstream v0.1.5")
              }),
            ],
          },
          {
<<<<<<< HEAD
<<<<<<< HEAD
            name: "BTC Velocity",
            title: "Cointime-Adjusted BTC Velocity",
            bottom: [
              line({
                series: supply.velocity.native,
                name: "Base",
                color: colors.base,
                unit: Unit.ratio,
              }),
              line({
                series: adjusted.txVelocityNative,
                name: "Cointime-Adjusted",
                color: colors.adjusted,
                unit: Unit.ratio,
=======
            name: "Destroyed",
            title: "Cointime Value Destroyed",
            bottom: [
              line({
                metric: value.cointimeValueDestroyed.sum,
                name: "Destroyed",
                color: colors.red,
                unit: Unit.usd,
              }),
              line({
                metric: value.cointimeValueDestroyed.cumulative,
                name: "Cumulative",
                color: colors.red,
                unit: Unit.usd,
                defaultActive: false,
>>>>>>> a29452a8 (Revert "chore: update website from upstream v0.1.5")
              }),
            ],
          },
          {
<<<<<<< HEAD
            name: "USD Velocity",
            title: "Cointime-Adjusted USD Velocity",
            bottom: [
              line({
                series: supply.velocity.fiat,
                name: "Base",
                color: colors.thermo,
                unit: Unit.ratio,
              }),
              line({
                series: adjusted.txVelocityFiat,
                name: "Cointime-Adjusted",
                color: colors.vaulted,
                unit: Unit.ratio,
              }),
=======
=======
            name: "Stored",
            title: "Cointime Value Stored",
            bottom: [
              line({
                metric: value.cointimeValueStored.sum,
                name: "Stored",
                color: colors.blue,
                unit: Unit.usd,
              }),
              line({
                metric: value.cointimeValueStored.cumulative,
                name: "Cumulative",
                color: colors.blue,
                unit: Unit.usd,
                defaultActive: false,
              }),
            ],
          },
          {
            name: "VOCDD",
            title: "VOCDD (Value of Coin Days Destroyed)",
            bottom: [
              line({
                metric: value.vocdd.sum,
                name: "VOCDD",
                color: colors.orange,
                unit: Unit.usd,
              }),
              line({
                metric: value.vocdd.cumulative,
                name: "Cumulative",
                color: colors.orange,
                unit: Unit.usd,
                defaultActive: false,
              }),
            ],
          },
        ],
      },

      // Adjusted metrics
      {
        name: "Adjusted",
        tree: [
          // Inflation
          {
            name: "Inflation",
            title: "Adjusted Inflation",
            bottom: [
              line({
                metric: supply.inflation,
                name: "Base",
                color: colors.orange,
                unit: Unit.percentage,
              }),
              line({
                metric: adjusted.cointimeAdjInflationRate,
                name: "Adjusted",
                color: colors.purple,
                unit: Unit.percentage,
              }),
            ],
          },
          // Velocity
          {
>>>>>>> a29452a8 (Revert "chore: update website from upstream v0.1.5")
            name: "Velocity",
            title: "Adjusted Velocity",
            bottom: [
              line({
                metric: supply.velocity.btc,
                name: "BTC",
                color: colors.orange,
                unit: Unit.ratio,
              }),
              line({
                metric: adjusted.cointimeAdjTxBtcVelocity,
                name: "Adj. BTC",
                color: colors.red,
                unit: Unit.ratio,
              }),
              line({
                metric: supply.velocity.usd,
                name: "USD",
<<<<<<< HEAD
                title: "Cointime-Adjusted USD Velocity",
                bottom: [
                  line({
                    metric: supply.velocity.usd,
                    name: "Base",
                    color: colors.thermo,
                    unit: Unit.ratio,
                  }),
                  line({
                    metric: adjusted.cointimeAdjTxUsdVelocity,
                    name: "Cointime-Adjusted",
                    color: colors.vaulted,
                    unit: Unit.ratio,
                  }),
                ],
              },
>>>>>>> 69eb58f7 (chore: update website from upstream v0.1.5)
=======
                color: colors.emerald,
                unit: Unit.ratio,
              }),
              line({
                metric: adjusted.cointimeAdjTxUsdVelocity,
                name: "Adj. USD",
                color: colors.lime,
                unit: Unit.ratio,
              }),
>>>>>>> a29452a8 (Revert "chore: update website from upstream v0.1.5")
            ],
          },
        ],
      },
    ],
  };
}
