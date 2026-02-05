import { colors } from "../utils/colors.js";
import { brk } from "../client.js";
import { Unit } from "../utils/units.js";
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

/**
 * Create Cointime section
 * @returns {PartialOptionsGroup}
 */
export function createCointimeSection() {
<<<<<<< HEAD
  const { cointime, cohorts, supply } = brk.series;
=======
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
      color: colors.trueMarketMean,
<<<<<<< HEAD
      defaultActive: true,
=======
>>>>>>> 69eb58f7 (chore: update website from upstream v0.1.5)
    },
    {
      pattern: cointimePrices.vaulted,
      name: "Vaulted",
      color: colors.vaulted,
<<<<<<< HEAD
      defaultActive: true,
=======
>>>>>>> 69eb58f7 (chore: update website from upstream v0.1.5)
    },
    {
      pattern: cointimePrices.active,
      name: "Active",
      color: colors.active,
<<<<<<< HEAD
      defaultActive: true,
=======
>>>>>>> 69eb58f7 (chore: update website from upstream v0.1.5)
    },
    {
      pattern: cointimePrices.cointime,
      name: "Cointime",
      color: colors.cointime,
<<<<<<< HEAD
      defaultActive: true,
=======
>>>>>>> 69eb58f7 (chore: update website from upstream v0.1.5)
    },
  ]);

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
    {
      pattern: cointimeSupply.vaultedSupply,
      name: "Vaulted",
      color: colors.vaulted,
    },
    {
      pattern: cointimeSupply.activeSupply,
      name: "Active",
      color: colors.active,
    },
  ]);

  const coinblocks = /** @type {const} */ ([
    {
      pattern: all.activity.coinblocksDestroyed,
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
      pattern: value.cointimeValueCreated,
      name: "Created",
      title: "Cointime Value Created",
      color: colors.created,
    },
    {
      pattern: value.cointimeValueDestroyed,
      name: "Destroyed",
      title: "Cointime Value Destroyed",
      color: colors.destroyed,
    },
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

  return {
    name: "Cointime",
    tree: [
<<<<<<< HEAD
=======
      // Prices - the core pricing models
>>>>>>> 69eb58f7 (chore: update website from upstream v0.1.5)
      {
        name: "Prices",
        tree: [
          {
            name: "Compare",
            title: "Cointime Prices",
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
          },
          ...prices.map(({ pricePattern, ratio, name, color }) => ({
            name,
            tree: createPriceRatioCharts({
              context: `${name} Price`,
              legend: name,
              pricePattern,
              ratio,
              color,
              priceReferences: [
                price({
                  metric: all.realized.realizedPrice,
>>>>>>> 69eb58f7 (chore: update website from upstream v0.1.5)
                  name: "Realized",
                  color: colors.realized,
                  defaultActive: false,
                }),
              ],
            }),
          })),
        ],
      },

<<<<<<< HEAD
=======
      // Caps - market capitalizations from different models
>>>>>>> 69eb58f7 (chore: update website from upstream v0.1.5)
      {
        name: "Caps",
        tree: [
          {
            name: "Compare",
            title: "Cointime Caps",
            bottom: [
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
                line({ metric, name, color, unit: Unit.usd }),
              ),
            ],
          },
          ...caps.map(({ metric, name, color }) => ({
            name,
            title: `${name} Cap`,
            bottom: [
              line({ metric, name, color, unit: Unit.usd }),
              ...capReferenceLines.map((ref) =>
                line({
                  metric: ref.metric,
>>>>>>> 69eb58f7 (chore: update website from upstream v0.1.5)
                  name: ref.name,
                  color: ref.color,
                  unit: Unit.usd,
                }),
              ),
            ],
          })),
        ],
      },

<<<<<<< HEAD
=======
      // Supply - active vs vaulted breakdown
>>>>>>> 69eb58f7 (chore: update website from upstream v0.1.5)
      {
        name: "Supply",
        title: "Active vs Vaulted Supply",
        bottom: supplyBreakdown.flatMap(({ pattern, name, color }) =>
          satsBtcUsd({ pattern, name, color }),
        ),
      },

<<<<<<< HEAD
=======
      // Liveliness - the foundational cointime ratios
>>>>>>> 69eb58f7 (chore: update website from upstream v0.1.5)
      {
        name: "Activity",
        title: "Liveliness & Vaultedness",
        bottom: [
          line({
            series: activity.liveliness,
            name: "Liveliness",
            color: colors.liveliness,
            unit: Unit.ratio,
          }),
          line({
            series: activity.vaultedness,
            name: "Vaultedness",
            color: colors.vaulted,
            unit: Unit.ratio,
          }),
          line({
<<<<<<< HEAD
            series: activity.ratio,
            name: "Liveliness / Vaultedness",
=======
            metric: activity.activityToVaultednessRatio,
            name: "L/V Ratio",
>>>>>>> 69eb58f7 (chore: update website from upstream v0.1.5)
            color: colors.activity,
            unit: Unit.ratio,
            defaultActive: false,
          }),
        ],
      },

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
      {
        name: "Coinblocks",
        tree: [
          {
            name: "Compare",
            tree: [
              {
                name: "Sum",
                title: "Coinblocks",
                bottom: coinblocks.map(({ pattern, name, color }) =>
                  line({
                    metric: pattern.sum,
                    name,
                    color,
                    unit: Unit.coinblocks,
                  }),
                ),
              },
              {
                name: "Cumulative",
                title: "Coinblocks (Total)",
                bottom: coinblocks.map(({ pattern, name, color }) =>
                  line({
                    metric: pattern.cumulative,
                    name,
                    color,
                    unit: Unit.coinblocks,
                  }),
                ),
              },
            ],
          },
          ...coinblocks.map(({ pattern, name, title, color }) => ({
            name,
            tree: [
              {
                name: "Sum",
                title,
                bottom: [
                  line({
                    metric: pattern.sum,
                    name,
                    color,
                    unit: Unit.coinblocks,
                  }),
                ],
              },
              {
                name: "Cumulative",
                title: `${title} (Total)`,
                bottom: [
                  line({
                    metric: pattern.cumulative,
                    name,
                    color,
                    unit: Unit.coinblocks,
                  }),
                ],
              },
            ],
          })),
        ],
      },

      // Value - cointime value flows
      {
        name: "Value",
        tree: [
          {
            name: "Compare",
            tree: [
              {
                name: "Sum",
                title: "Cointime Value",
                bottom: [
                  ...cointimeValues.map(({ pattern, name, color }) =>
                    line({ metric: pattern.sum, name, color, unit: Unit.usd }),
                  ),
                  line({
                    metric: vocdd.pattern.sum,
                    name: vocdd.name,
                    color: vocdd.color,
                    unit: Unit.usd,
                  }),
                ],
              },
              {
                name: "Cumulative",
                title: "Cointime Value (Total)",
                bottom: [
                  ...cointimeValues.map(({ pattern, name, color }) =>
                    line({
                      metric: pattern.cumulative,
                      name,
                      color,
                      unit: Unit.usd,
                    }),
                  ),
                  line({
                    metric: vocdd.pattern.cumulative,
                    name: vocdd.name,
                    color: vocdd.color,
                    unit: Unit.usd,
                  }),
                ],
              },
            ],
          },
          ...cointimeValues.map(({ pattern, name, title, color }) => ({
            name,
            tree: [
              {
                name: "Sum",
                title,
                bottom: [
                  line({ metric: pattern.sum, name, color, unit: Unit.usd }),
                ],
              },
              {
                name: "Cumulative",
                title: `${title} (Total)`,
                bottom: [
                  line({
                    metric: pattern.cumulative,
                    name,
                    color,
                    unit: Unit.usd,
                  }),
                ],
              },
            ],
          })),
          {
            name: vocdd.name,
            tree: [
              {
                name: "Sum",
                title: vocdd.title,
                bottom: [
                  line({
                    metric: vocdd.pattern.sum,
                    name: vocdd.name,
                    color: vocdd.color,
                    unit: Unit.usd,
                  }),
                  line({
                    metric: reserveRisk.vocdd365dMedian,
                    name: "365d Median",
                    color: colors.ma._1y,
                    unit: Unit.usd,
                  }),
                ],
              },
              {
                name: "Cumulative",
                title: `${vocdd.title} (Total)`,
                bottom: [
                  line({
                    metric: vocdd.pattern.cumulative,
                    name: vocdd.name,
                    color: vocdd.color,
                    unit: Unit.usd,
                  }),
                ],
              },
            ],
          },
        ],
      },

      // Indicators - derived decision metrics
      {
        name: "Indicators",
        tree: [
          {
            name: "Reserve Risk",
            title: "Reserve Risk",
            bottom: [
              line({
                metric: reserveRisk.reserveRisk,
                name: "Ratio",
                color: colors.reserveRisk,
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
                name: "Value",
                color: colors.hodlBank,
                unit: Unit.usd,
              }),
            ],
          },
        ],
      },

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

      {
        name: "Cointime-Adjusted",
        tree: [
          {
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
              }),
            ],
          },
          {
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
              }),
            ],
          },
          {
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
            name: "Velocity",
            tree: [
              {
                name: "BTC",
                title: "Cointime-Adjusted BTC Velocity",
                bottom: [
                  line({
                    metric: supply.velocity.btc,
                    name: "Base",
                    color: colors.base,
                    unit: Unit.ratio,
                  }),
                  line({
                    metric: adjusted.cointimeAdjTxBtcVelocity,
                    name: "Cointime-Adjusted",
                    color: colors.adjusted,
                    unit: Unit.ratio,
                  }),
                ],
              },
              {
                name: "USD",
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
            ],
          },
        ],
      },
    ],
  };
}
