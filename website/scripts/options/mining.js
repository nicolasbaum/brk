/** Mining section - Network security and miner economics */

import { Unit } from "../utils/units.js";
import { entries, includes } from "../utils/array.js";
import { colors } from "../utils/colors.js";
import {
  line,
<<<<<<< HEAD
  dots,
  dotted,
  distributionBtcSatsUsd,
  statsAtWindow,
  ROLLING_WINDOWS,
  percentRatio,
  percentRatioBaseline,
  chartsFromCount,
} from "./series.js";
import {
  satsBtcUsdFrom,
  satsBtcUsdFullTree,
  revenueBtcSatsUsd,
  revenueRollingBtcSatsUsd,
  formatCohortTitle,
=======
  baseline,
  dots,
  dotted,
  distributionBtcSatsUsd,
} from "./series.js";
import {
  satsBtcUsd,
  satsBtcUsdFrom,
  satsBtcUsdFromFull,
  revenueBtcSatsUsd,
>>>>>>> 69eb58f7 (chore: update website from upstream v0.1.5)
} from "./shared.js";
import { brk } from "../client.js";

/** Major pools to show in Compare section (by current hashrate dominance) */
const MAJOR_POOL_IDS = /** @type {const} */ ([
<<<<<<< HEAD
  "foundryusa",
  "antpool",
  "viabtc",
  "f2pool",
  "marapool",
  "braiinspool",
  "spiderpool",
  "ocean",
=======
  "foundryusa", // ~32% - largest pool
  "antpool", // ~18% - Bitmain-owned
  "viabtc", // ~14% - independent
  "f2pool", // ~10% - one of the oldest pools
  "marapool", // MARA Holdings
  "braiinspool", // formerly Slush Pool
  "spiderpool", // growing Asian pool
  "ocean", // decentralization-focused
>>>>>>> 69eb58f7 (chore: update website from upstream v0.1.5)
]);

/**
 * AntPool & friends - pools sharing AntPool's block templates
 * Based on b10c's research: https://b10c.me/blog/015-bitcoin-mining-centralization/
<<<<<<< HEAD
 */
const ANTPOOL_AND_FRIENDS_IDS = /** @type {const} */ ([
  "antpool",
  "poolin",
  "btccom",
  "braiinspool",
  "ultimuspool",
  "binancepool",
  "secpool",
  "sigmapoolcom",
  "rawpool",
  "luxor",
=======
 * Collectively ~35-40% of network hashrate
 */
const ANTPOOL_AND_FRIENDS_IDS = /** @type {const} */ ([
  "antpool", // Bitmain-owned, template source
  "poolin", // shares AntPool templates
  "btccom", // CloverPool (formerly BTC.com)
  "braiinspool", // shares AntPool templates
  "ultimuspool", // shares AntPool templates
  "binancepool", // shares AntPool templates
  "secpool", // shares AntPool templates
  "sigmapoolcom", // SigmaPool
  "rawpool", // shares AntPool templates
  "luxor", // shares AntPool templates
>>>>>>> 69eb58f7 (chore: update website from upstream v0.1.5)
]);

/**
 * Create Mining section
 * @returns {PartialOptionsGroup}
 */
export function createMiningSection() {
<<<<<<< HEAD
  const { blocks, pools, mining } = brk.series;

  const majorPoolData = entries(pools.major).map(([id, pool]) => ({
    id,
    name: brk.POOL_ID_TO_POOL_NAME[id],
    pool,
  }));
  const minorPoolData = entries(pools.minor).map(([id, pool]) => ({
=======
  const { blocks, transactions, pools } = brk.metrics;

  // Pre-compute pool entries with resolved names
  const poolData = entries(pools.vecs).map(([id, pool]) => ({
>>>>>>> 69eb58f7 (chore: update website from upstream v0.1.5)
    id,
    name: brk.POOL_ID_TO_POOL_NAME[id],
    pool,
  }));

<<<<<<< HEAD
  const featuredPools = majorPoolData.filter((p) =>
    includes(MAJOR_POOL_IDS, p.id),
  );
  const antpoolFriends = majorPoolData.filter((p) =>
    includes(ANTPOOL_AND_FRIENDS_IDS, p.id),
  );

  /**
   * @param {(metric: string) => string} title
   * @param {string} metric
   * @param {DominancePattern} dominance
   */
  const dominanceTree = (title, metric, dominance) => ({
    name: "Dominance",
    tree: [
      {
        name: "Compare",
        title: title(metric),
        bottom: [
          ...ROLLING_WINDOWS.flatMap((w) =>
            percentRatio({ pattern: dominance[w.key], name: w.name, color: w.color, defaultActive: w.key !== "_24h" }),
          ),
          ...percentRatio({ pattern: dominance, name: "All Time", color: colors.time.all }),
        ],
      },
      ...ROLLING_WINDOWS.map((w) => ({
        name: w.name,
        title: title(`${w.title} ${metric}`),
        bottom: percentRatio({ pattern: dominance[w.key], name: "Dominance", color: w.color }),
      })),
      {
        name: "All Time",
        title: title(`All Time ${metric}`),
        bottom: percentRatio({ pattern: dominance, name: "Dominance", color: colors.time.all }),
      },
    ],
  });

  /**
   * @param {typeof majorPoolData} poolList
   */
  const createPoolTree = (poolList) =>
    poolList.map(({ name, pool }) => {
      const title = formatCohortTitle(name);
      return {
        name,
        tree: [
          dominanceTree(title, "Dominance", pool.dominance),
          {
            name: "Blocks Mined",
            tree: chartsFromCount({
              pattern: pool.blocksMined,
              title,
              metric: "Blocks Mined",
              unit: Unit.count,
            }),
          },
          {
            name: "Rewards",
            tree: satsBtcUsdFullTree({
              pattern: pool.rewards,
              title,
              metric: "Rewards",
            }),
          },
        ],
      };
    });

  /**
   * @param {typeof minorPoolData} poolList
   */
  const createMinorPoolTree = (poolList) =>
    poolList.map(({ name, pool }) => {
      const title = formatCohortTitle(name);
      return {
        name,
        tree: [
          {
            name: "Dominance",
            title: title("Dominance"),
            bottom: percentRatio({ pattern: pool.dominance, name: "All Time", color: colors.time.all }),
          },
          {
            name: "Blocks Mined",
            tree: chartsFromCount({
              pattern: pool.blocksMined,
              title,
              metric: "Blocks Mined",
              unit: Unit.count,
            }),
          },
        ],
      };
    });

  /**
   * @param {string} groupTitle
   * @param {typeof majorPoolData} poolList
   */
  const createPoolCompare = (groupTitle, poolList) => ({
    name: "Compare",
    tree: [
      {
        name: "Dominance",
        tree: ROLLING_WINDOWS.map((w) => ({
          name: w.name,
          title: formatCohortTitle(groupTitle)(`${w.title} Dominance`),
          bottom: poolList.flatMap((p, i) =>
            percentRatio({
              pattern: p.pool.dominance[w.key],
              name: p.name,
              color: colors.at(i, poolList.length),
            }),
          ),
        })),
      },
      {
        name: "Blocks Mined",
        tree: ROLLING_WINDOWS.map((w) => ({
          name: w.name,
          title: formatCohortTitle(groupTitle)(`${w.title} Blocks Mined`),
          bottom: poolList.map((p, i) =>
            line({
              series: p.pool.blocksMined.sum[w.key],
              name: p.name,
              color: colors.at(i, poolList.length),
              unit: Unit.count,
            }),
          ),
        })),
      },
    ],
  });

=======
  // Filtered pool groups for comparisons
  const majorPools = poolData.filter((p) => includes(MAJOR_POOL_IDS, p.id));
  const antpoolFriends = poolData.filter((p) =>
    includes(ANTPOOL_AND_FRIENDS_IDS, p.id),
  );

  // Build individual pool trees
  const poolsTree = poolData.map(({ name, pool }) => ({
    name,
    tree: [
      {
        name: "Dominance",
        title: `Dominance: ${name}`,
        bottom: [
          dots({
            metric: pool._24hDominance,
            name: "24h",
            color: colors.time._24h,
            unit: Unit.percentage,
            defaultActive: false,
          }),
          line({
            metric: pool._1wDominance,
            name: "1w",
            color: colors.time._1w,
            unit: Unit.percentage,
            defaultActive: false,
          }),
          line({
            metric: pool._1mDominance,
            name: "1m",
            color: colors.time._1m,
            unit: Unit.percentage,
          }),
          line({
            metric: pool._1yDominance,
            name: "1y",
            color: colors.time._1y,
            unit: Unit.percentage,
            defaultActive: false,
          }),
          line({
            metric: pool.dominance,
            name: "All Time",
            color: colors.time.all,
            unit: Unit.percentage,
            defaultActive: false,
          }),
        ],
      },
      {
        name: "Blocks Mined",
        tree: [
          {
            name: "Sum",
            title: `Blocks Mined: ${name}`,
            bottom: [
              line({
                metric: pool.blocksMined.sum,
                name: "sum",
                unit: Unit.count,
              }),
              line({
                metric: pool._24hBlocksMined,
                name: "24h",
                color: colors.time._24h,
                unit: Unit.count,
                defaultActive: false,
              }),
              line({
                metric: pool._1wBlocksMined,
                name: "1w",
                color: colors.time._1w,
                unit: Unit.count,
                defaultActive: false,
              }),
              line({
                metric: pool._1mBlocksMined,
                name: "1m",
                color: colors.time._1m,
                unit: Unit.count,
                defaultActive: false,
              }),
              line({
                metric: pool._1yBlocksMined,
                name: "1y",
                color: colors.time._1y,
                unit: Unit.count,
                defaultActive: false,
              }),
            ],
          },
          {
            name: "Cumulative",
            title: `Blocks Mined: ${name} (Total)`,
            bottom: [
              line({
                metric: pool.blocksMined.cumulative,
                name: "all-time",
                unit: Unit.count,
              }),
            ],
          },
        ],
      },
      {
        name: "Rewards",
        tree: [
          {
            name: "Sum",
            title: `Rewards: ${name}`,
            bottom: revenueBtcSatsUsd({
              coinbase: pool.coinbase,
              subsidy: pool.subsidy,
              fee: pool.fee,
              key: "sum",
            }),
          },
          {
            name: "Cumulative",
            title: `Rewards: ${name} (Total)`,
            bottom: revenueBtcSatsUsd({
              coinbase: pool.coinbase,
              subsidy: pool.subsidy,
              fee: pool.fee,
              key: "cumulative",
            }),
          },
        ],
      },
      {
        name: "Since Last Block",
        title: `Since Last Block: ${name}`,
        bottom: [
          line({
            metric: pool.blocksSinceBlock,
            name: "Elapsed",
            unit: Unit.blocks,
          }),
          line({
            metric: pool.daysSinceBlock,
            name: "Elapsed",
            unit: Unit.days,
          }),
        ],
      },
    ],
  }));
>>>>>>> 69eb58f7 (chore: update website from upstream v0.1.5)

  return {
    name: "Mining",
    tree: [
<<<<<<< HEAD
=======
      // Hashrate
>>>>>>> 69eb58f7 (chore: update website from upstream v0.1.5)
      {
        name: "Hashrate",
        tree: [
          {
            name: "Current",
            title: "Network Hashrate",
            bottom: [
              dots({
<<<<<<< HEAD
                series: mining.hashrate.rate.base,
=======
                metric: blocks.mining.hashRate,
>>>>>>> 69eb58f7 (chore: update website from upstream v0.1.5)
                name: "Hashrate",
                unit: Unit.hashRate,
              }),
              line({
<<<<<<< HEAD
                series: mining.hashrate.rate.sma._1w,
=======
                metric: blocks.mining.hashRate1wSma,
>>>>>>> 69eb58f7 (chore: update website from upstream v0.1.5)
                name: "1w SMA",
                color: colors.time._1w,
                unit: Unit.hashRate,
                defaultActive: false,
              }),
              line({
<<<<<<< HEAD
                series: mining.hashrate.rate.sma._1m,
=======
                metric: blocks.mining.hashRate1mSma,
>>>>>>> 69eb58f7 (chore: update website from upstream v0.1.5)
                name: "1m SMA",
                color: colors.time._1m,
                unit: Unit.hashRate,
                defaultActive: false,
              }),
              line({
<<<<<<< HEAD
                series: mining.hashrate.rate.sma._2m,
                name: "2m SMA",
                color: colors.indicator.main,
=======
                metric: blocks.mining.hashRate2mSma,
                name: "2m SMA",
                color: colors.ma._2m,
>>>>>>> 69eb58f7 (chore: update website from upstream v0.1.5)
                unit: Unit.hashRate,
                defaultActive: false,
              }),
              line({
<<<<<<< HEAD
                series: mining.hashrate.rate.sma._1y,
=======
                metric: blocks.mining.hashRate1ySma,
>>>>>>> 69eb58f7 (chore: update website from upstream v0.1.5)
                name: "1y SMA",
                color: colors.time._1y,
                unit: Unit.hashRate,
                defaultActive: false,
              }),
              dotted({
<<<<<<< HEAD
                series: blocks.difficulty.hashrate,
                name: "From Difficulty",
=======
                metric: blocks.difficulty.asHash,
                name: "Difficulty",
>>>>>>> 69eb58f7 (chore: update website from upstream v0.1.5)
                color: colors.default,
                unit: Unit.hashRate,
              }),
              line({
<<<<<<< HEAD
                series: mining.hashrate.rate.ath,
=======
                metric: blocks.mining.hashRateAth,
>>>>>>> 69eb58f7 (chore: update website from upstream v0.1.5)
                name: "ATH",
                color: colors.loss,
                unit: Unit.hashRate,
                defaultActive: false,
              }),
            ],
          },
          {
            name: "ATH",
            title: "Network Hashrate ATH",
            bottom: [
              line({
<<<<<<< HEAD
                series: mining.hashrate.rate.ath,
=======
                metric: blocks.mining.hashRateAth,
>>>>>>> 69eb58f7 (chore: update website from upstream v0.1.5)
                name: "ATH",
                color: colors.loss,
                unit: Unit.hashRate,
              }),
              dots({
<<<<<<< HEAD
                series: mining.hashrate.rate.base,
=======
                metric: blocks.mining.hashRate,
>>>>>>> 69eb58f7 (chore: update website from upstream v0.1.5)
                name: "Hashrate",
                color: colors.bitcoin,
                unit: Unit.hashRate,
              }),
            ],
          },
          {
            name: "Drawdown",
            title: "Network Hashrate Drawdown",
<<<<<<< HEAD
            bottom: percentRatio({
              pattern: mining.hashrate.rate.drawdown,
              name: "Drawdown",
              color: colors.loss,
            }),
=======
            bottom: [
              line({
                metric: blocks.mining.hashRateDrawdown,
                name: "Drawdown",
                unit: Unit.percentage,
                color: colors.loss,
              }),
            ],
>>>>>>> 69eb58f7 (chore: update website from upstream v0.1.5)
          },
        ],
      },

<<<<<<< HEAD
      {
        name: "Revenue",
        tree: [
          ...ROLLING_WINDOWS.map((w) => ({
            name: w.name,
            title: `${w.title} Mining Revenue`,
            bottom: revenueRollingBtcSatsUsd({
              coinbase: mining.rewards.coinbase.average[w.key],
              subsidy: mining.rewards.subsidy.average[w.key],
              fee: mining.rewards.fees.average[w.key],
            }),
          })),
          {
            name: "Cumulative",
            title: "Cumulative Mining Revenue",
            bottom: revenueBtcSatsUsd({
              coinbase: mining.rewards.coinbase,
              subsidy: mining.rewards.subsidy,
              fee: mining.rewards.fees,
              key: "cumulative",
            }),
          },
          {
            name: "Coinbase",
            tree: satsBtcUsdFullTree({
              pattern: mining.rewards.coinbase,
              metric: "Coinbase Rewards",
            }),
          },
          {
            name: "Subsidy",
            tree: satsBtcUsdFullTree({
              pattern: mining.rewards.subsidy,
              metric: "Block Subsidy",
            }),
=======
      // Difficulty
      {
        name: "Difficulty",
        tree: [
          {
            name: "Current",
            title: "Mining Difficulty",
            bottom: [
              line({
                metric: blocks.difficulty.raw,
                name: "Difficulty",
                unit: Unit.difficulty,
              }),
            ],
          },
          {
            name: "Epoch",
            title: "Difficulty Epoch",
            bottom: [
              line({
                metric: blocks.difficulty.epoch,
                name: "Epoch",
                unit: Unit.epoch,
              }),
            ],
          },
          {
            name: "Adjustment",
            title: "Difficulty Adjustment",
            bottom: [
              baseline({
                metric: blocks.difficulty.adjustment,
                name: "Change",
                unit: Unit.percentage,
              }),
            ],
          },
          {
            name: "Countdown",
            title: "Next Difficulty Adjustment",
            bottom: [
              line({
                metric: blocks.difficulty.blocksBeforeNextAdjustment,
                name: "Remaining",
                unit: Unit.blocks,
              }),
              line({
                metric: blocks.difficulty.daysBeforeNextAdjustment,
                name: "Remaining",
                unit: Unit.days,
              }),
            ],
          },
        ],
      },

      // Revenue
      {
        name: "Revenue",
        tree: [
          {
            name: "Compare",
            tree: [
              {
                name: "Sum",
                title: "Revenue Comparison",
                bottom: revenueBtcSatsUsd({
                  coinbase: blocks.rewards.coinbase,
                  subsidy: blocks.rewards.subsidy,
                  fee: transactions.fees.fee,
                  key: "sum",
                }),
              },
              {
                name: "Cumulative",
                title: "Revenue Comparison (Total)",
                bottom: revenueBtcSatsUsd({
                  coinbase: blocks.rewards.coinbase,
                  subsidy: blocks.rewards.subsidy,
                  fee: transactions.fees.fee,
                  key: "cumulative",
                }),
              },
            ],
          },
          {
            name: "Coinbase",
            tree: [
              {
                name: "Sum",
                title: "Coinbase Rewards",
                bottom: [
                  ...satsBtcUsdFromFull({
                    source: blocks.rewards.coinbase,
                    key: "base",
                    name: "sum",
                  }),
                  ...satsBtcUsdFrom({
                    source: blocks.rewards.coinbase,
                    key: "sum",
                    name: "sum",
                  }),
                  ...satsBtcUsd({
                    pattern: blocks.rewards._24hCoinbaseSum,
                    name: "24h",
                    color: colors.time._24h,
                    defaultActive: false,
                  }),
                ],
              },
              {
                name: "Distribution",
                title: "Coinbase Rewards per Block Distribution",
                bottom: distributionBtcSatsUsd(blocks.rewards.coinbase),
              },
              {
                name: "Cumulative",
                title: "Coinbase Rewards (Total)",
                bottom: satsBtcUsdFrom({
                  source: blocks.rewards.coinbase,
                  key: "cumulative",
                  name: "all-time",
                }),
              },
            ],
          },
          {
            name: "Subsidy",
            tree: [
              {
                name: "Sum",
                title: "Block Subsidy",
                bottom: [
                  ...satsBtcUsdFromFull({
                    source: blocks.rewards.subsidy,
                    key: "base",
                    name: "sum",
                  }),
                  ...satsBtcUsdFrom({
                    source: blocks.rewards.subsidy,
                    key: "sum",
                    name: "sum",
                  }),
                  line({
                    metric: blocks.rewards.subsidyUsd1ySma,
                    name: "1y SMA",
                    color: colors.time._1y,
                    unit: Unit.usd,
                    defaultActive: false,
                  }),
                ],
              },
              {
                name: "Distribution",
                title: "Block Subsidy Distribution",
                bottom: distributionBtcSatsUsd(blocks.rewards.subsidy),
              },
              {
                name: "Cumulative",
                title: "Block Subsidy (Total)",
                bottom: satsBtcUsdFrom({
                  source: blocks.rewards.subsidy,
                  key: "cumulative",
                  name: "all-time",
                }),
              },
            ],
>>>>>>> 69eb58f7 (chore: update website from upstream v0.1.5)
          },
          {
            name: "Fees",
            tree: [
<<<<<<< HEAD
              ...satsBtcUsdFullTree({
                pattern: mining.rewards.fees,
                metric: "Transaction Fee Revenue",
              }),
              {
                name: "Distribution",
                tree: ROLLING_WINDOWS.map((w) => ({
                  name: w.name,
                  title: `${w.title} Fee Revenue per Block Distribution`,
                  bottom: distributionBtcSatsUsd(statsAtWindow(mining.rewards.fees, w.key)),
                })),
=======
              {
                name: "Sum",
                title: "Transaction Fee Revenue per Block",
                bottom: satsBtcUsdFrom({
                  source: transactions.fees.fee,
                  key: "sum",
                  name: "sum",
                }),
              },
              {
                name: "Distribution",
                title: "Transaction Fee Revenue per Block Distribution",
                bottom: distributionBtcSatsUsd(transactions.fees.fee),
              },
              {
                name: "Cumulative",
                title: "Transaction Fee Revenue (Total)",
                bottom: satsBtcUsdFrom({
                  source: transactions.fees.fee,
                  key: "cumulative",
                  name: "all-time",
                }),
>>>>>>> 69eb58f7 (chore: update website from upstream v0.1.5)
              },
            ],
          },
          {
            name: "Dominance",
<<<<<<< HEAD
            tree: [
              ...ROLLING_WINDOWS.map((w) => ({
                name: w.name,
                title: `${w.title} Mining Revenue Dominance`,
                bottom: [
                  ...percentRatio({ pattern: mining.rewards.subsidy.dominance[w.key], name: "Subsidy", color: colors.mining.subsidy }),
                  ...percentRatio({ pattern: mining.rewards.fees.dominance[w.key], name: "Fees", color: colors.mining.fee }),
                ],
              })),
              {
                name: "All Time",
                title: "All Time Mining Revenue Dominance",
                bottom: [
                  ...percentRatio({ pattern: mining.rewards.subsidy.dominance, name: "Subsidy", color: colors.mining.subsidy }),
                  ...percentRatio({ pattern: mining.rewards.fees.dominance, name: "Fees", color: colors.mining.fee }),
                ],
              },
            ],
          },
          {
            name: "Fee-to-Subsidy",
            tree: ROLLING_WINDOWS.map((w) => ({
              name: w.name,
              title: `${w.title} Fee-to-Subsidy Ratio`,
              bottom: [line({ series: mining.rewards.fees.toSubsidyRatio[w.key].ratio, name: "Ratio", color: colors.mining.fee, unit: Unit.ratio })],
            })),
          },
          {
            name: "Unclaimed",
            title: "Unclaimed Rewards",
            bottom: satsBtcUsdFrom({
              source: mining.rewards.unclaimed,
              key: "cumulative",
              name: "All Time",
            }),
=======
            title: "Revenue Dominance",
            bottom: [
              line({
                metric: blocks.rewards.subsidyDominance,
                name: "Subsidy",
                color: colors.mining.subsidy,
                unit: Unit.percentage,
              }),
              line({
                metric: blocks.rewards.feeDominance,
                name: "Fees",
                color: colors.mining.fee,
                unit: Unit.percentage,
              }),
            ],
          },
          {
            name: "Unclaimed",
            tree: [
              {
                name: "Sum",
                title: "Unclaimed Rewards",
                bottom: satsBtcUsdFrom({
                  source: blocks.rewards.unclaimedRewards,
                  key: "sum",
                  name: "sum",
                }),
              },
              {
                name: "Cumulative",
                title: "Unclaimed Rewards (Total)",
                bottom: satsBtcUsdFrom({
                  source: blocks.rewards.unclaimedRewards,
                  key: "cumulative",
                  name: "all-time",
                }),
              },
            ],
>>>>>>> 69eb58f7 (chore: update website from upstream v0.1.5)
          },
        ],
      },

<<<<<<< HEAD
=======
      // Economics
>>>>>>> 69eb58f7 (chore: update website from upstream v0.1.5)
      {
        name: "Economics",
        tree: [
          {
            name: "Hash Price",
            title: "Hash Price",
            bottom: [
<<<<<<< HEAD
              line({ series: mining.hashrate.price.ths, name: "per TH/s", color: colors.usd, unit: Unit.usdPerThsPerDay }),
              line({ series: mining.hashrate.price.phs, name: "per PH/s", color: colors.usd, unit: Unit.usdPerPhsPerDay }),
              dotted({ series: mining.hashrate.price.thsMin, name: "per TH/s ATL", color: colors.stat.min, unit: Unit.usdPerThsPerDay }),
              dotted({ series: mining.hashrate.price.phsMin, name: "per PH/s ATL", color: colors.stat.min, unit: Unit.usdPerPhsPerDay }),
=======
              line({
                metric: blocks.mining.hashPriceThs,
                name: "TH/s",
                color: colors.usd,
                unit: Unit.usdPerThsPerDay,
              }),
              line({
                metric: blocks.mining.hashPricePhs,
                name: "PH/s",
                color: colors.usd,
                unit: Unit.usdPerPhsPerDay,
              }),
              dotted({
                metric: blocks.mining.hashPriceThsMin,
                name: "TH/s Min",
                color: colors.stat.min,
                unit: Unit.usdPerThsPerDay,
              }),
              dotted({
                metric: blocks.mining.hashPricePhsMin,
                name: "PH/s Min",
                color: colors.stat.min,
                unit: Unit.usdPerPhsPerDay,
              }),
>>>>>>> 69eb58f7 (chore: update website from upstream v0.1.5)
            ],
          },
          {
            name: "Hash Value",
            title: "Hash Value",
            bottom: [
<<<<<<< HEAD
              line({ series: mining.hashrate.value.ths, name: "per TH/s", color: colors.bitcoin, unit: Unit.satsPerThsPerDay }),
              line({ series: mining.hashrate.value.phs, name: "per PH/s", color: colors.bitcoin, unit: Unit.satsPerPhsPerDay }),
              dotted({ series: mining.hashrate.value.thsMin, name: "per TH/s ATL", color: colors.stat.min, unit: Unit.satsPerThsPerDay }),
              dotted({ series: mining.hashrate.value.phsMin, name: "per PH/s ATL", color: colors.stat.min, unit: Unit.satsPerPhsPerDay }),
=======
              line({
                metric: blocks.mining.hashValueThs,
                name: "TH/s",
                color: colors.bitcoin,
                unit: Unit.satsPerThsPerDay,
              }),
              line({
                metric: blocks.mining.hashValuePhs,
                name: "PH/s",
                color: colors.bitcoin,
                unit: Unit.satsPerPhsPerDay,
              }),
              dotted({
                metric: blocks.mining.hashValueThsMin,
                name: "TH/s Min",
                color: colors.stat.min,
                unit: Unit.satsPerThsPerDay,
              }),
              dotted({
                metric: blocks.mining.hashValuePhsMin,
                name: "PH/s Min",
                color: colors.stat.min,
                unit: Unit.satsPerPhsPerDay,
              }),
>>>>>>> 69eb58f7 (chore: update website from upstream v0.1.5)
            ],
          },
          {
            name: "Recovery",
<<<<<<< HEAD
            title: "Hash Price & Value Recovery",
            bottom: [
              ...percentRatio({ pattern: mining.hashrate.price.rebound, name: "Hash Price", color: colors.usd }),
              ...percentRatio({ pattern: mining.hashrate.value.rebound, name: "Hash Value", color: colors.bitcoin }),
=======
            title: "Recovery",
            bottom: [
              line({
                metric: blocks.mining.hashPriceRebound,
                name: "Hash Price",
                color: colors.usd,
                unit: Unit.percentage,
              }),
              line({
                metric: blocks.mining.hashValueRebound,
                name: "Hash Value",
                color: colors.bitcoin,
                unit: Unit.percentage,
              }),
>>>>>>> 69eb58f7 (chore: update website from upstream v0.1.5)
            ],
          },
        ],
      },

<<<<<<< HEAD
=======
      // Halving
>>>>>>> 69eb58f7 (chore: update website from upstream v0.1.5)
      {
        name: "Halving",
        tree: [
          {
            name: "Countdown",
            title: "Next Halving",
            bottom: [
<<<<<<< HEAD
              line({ series: blocks.halving.blocksToHalving, name: "Blocks", unit: Unit.blocks }),
              line({ series: blocks.halving.daysToHalving, name: "Days", unit: Unit.days }),
=======
              line({
                metric: blocks.halving.blocksBeforeNextHalving,
                name: "Remaining",
                unit: Unit.blocks,
              }),
              line({
                metric: blocks.halving.daysBeforeNextHalving,
                name: "Remaining",
                unit: Unit.days,
              }),
>>>>>>> 69eb58f7 (chore: update website from upstream v0.1.5)
            ],
          },
          {
            name: "Epoch",
            title: "Halving Epoch",
<<<<<<< HEAD
            bottom: [line({ series: blocks.halving.epoch, name: "Epoch", unit: Unit.epoch })],
=======
            bottom: [
              line({
                metric: blocks.halving.epoch,
                name: "Epoch",
                unit: Unit.epoch,
              }),
            ],
>>>>>>> 69eb58f7 (chore: update website from upstream v0.1.5)
          },
        ],
      },

<<<<<<< HEAD
      {
        name: "Difficulty",
        tree: [
          {
            name: "Current",
            title: "Mining Difficulty",
            bottom: [line({ series: blocks.difficulty.value, name: "Difficulty", unit: Unit.difficulty })],
          },
          {
            name: "Adjustment",
            title: "Difficulty Adjustment",
            bottom: percentRatioBaseline({ pattern: blocks.difficulty.adjustment, name: "Change" }),
          },
          {
            name: "Countdown",
            title: "Next Difficulty Adjustment",
            bottom: [
              line({ series: blocks.difficulty.blocksToRetarget, name: "Blocks", unit: Unit.blocks }),
              line({ series: blocks.difficulty.daysToRetarget, name: "Days", unit: Unit.days }),
            ],
          },
          {
            name: "Epoch",
            title: "Difficulty Epoch",
            bottom: [line({ series: blocks.difficulty.epoch, name: "Epoch", unit: Unit.epoch })],
          },
        ],
      },
      {
        name: "Pools",
        tree: [
          createPoolCompare("Major Pools", featuredPools),
          {
            name: "AntPool & Friends",
            tree: [
              createPoolCompare("AntPool & Friends", antpoolFriends),
              ...createPoolTree(antpoolFriends),
            ],
          },
          {
            name: "Major",
            tree: createPoolTree(majorPoolData),
          },
          {
            name: "Minor",
            tree: createMinorPoolTree(minorPoolData),
=======
      // Pools
      {
        name: "Pools",
        tree: [
          // Compare section (major pools only)
          {
            name: "Compare",
            tree: [
              {
                name: "Dominance",
                title: "Dominance: Major Pools (1m)",
                bottom: majorPools.map((p, i) =>
                  line({
                    metric: p.pool._1mDominance,
                    name: p.name,
                    color: colors.at(i),
                    unit: Unit.percentage,
                  }),
                ),
              },
              {
                name: "Blocks Mined",
                title: "Blocks Mined: Major Pools (1m)",
                bottom: majorPools.map((p, i) =>
                  line({
                    metric: p.pool._1mBlocksMined,
                    name: p.name,
                    color: colors.at(i),
                    unit: Unit.count,
                  }),
                ),
              },
              {
                name: "Total Rewards",
                title: "Total Rewards: Major Pools",
                bottom: majorPools.flatMap((p, i) =>
                  satsBtcUsdFrom({
                    source: p.pool.coinbase,
                    key: "sum",
                    name: p.name,
                    color: colors.at(i),
                  }),
                ),
              },
            ],
          },
          // AntPool & friends - pools sharing block templates
          {
            name: "AntPool & Friends",
            tree: [
              {
                name: "Dominance",
                title: "Dominance: AntPool & Friends (1m)",
                bottom: antpoolFriends.map((p, i) =>
                  line({
                    metric: p.pool._1mDominance,
                    name: p.name,
                    color: colors.at(i),
                    unit: Unit.percentage,
                  }),
                ),
              },
              {
                name: "Blocks Mined",
                title: "Blocks Mined: AntPool & Friends (1m)",
                bottom: antpoolFriends.map((p, i) =>
                  line({
                    metric: p.pool._1mBlocksMined,
                    name: p.name,
                    color: colors.at(i),
                    unit: Unit.count,
                  }),
                ),
              },
              {
                name: "Total Rewards",
                title: "Total Rewards: AntPool & Friends",
                bottom: antpoolFriends.flatMap((p, i) =>
                  satsBtcUsdFrom({
                    source: p.pool.coinbase,
                    key: "sum",
                    name: p.name,
                    color: colors.at(i),
                  }),
                ),
              },
            ],
          },
          // All pools
          {
            name: "All Pools",
            tree: poolsTree,
>>>>>>> 69eb58f7 (chore: update website from upstream v0.1.5)
          },
        ],
      },
    ],
  };
}
