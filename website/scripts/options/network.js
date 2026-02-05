/** Network section - On-chain activity and health */

import { colors } from "../utils/colors.js";
import { brk } from "../client.js";
import { Unit } from "../utils/units.js";
<<<<<<< HEAD
import { entries } from "../utils/array.js";
import {
  line,
  fromSupplyPattern,
  chartsFromFull,
  chartsFromFullPerBlock,
  chartsFromCount,
  chartsFromCountEntries,
  chartsFromAggregatedPerBlock,
  averagesArray,
  simpleDeltaTree,
  ROLLING_WINDOWS,
  chartsFromBlockAnd6b,
  multiSeriesTree,
  percentRatioDots,
} from "./series.js";
import { satsBtcUsd, satsBtcUsdFrom, satsBtcUsdFullTree, formatCohortTitle } from "./shared.js";
=======
import { priceLine } from "./constants.js";
import {
  line,
  dots,
  baseline,
  fromSupplyPattern,
  fromBaseStatsPattern,
  chartsFromFullPerBlock,
  chartsFromValueFull,
  fromStatsPattern,
  chartsFromSumPerBlock,
} from "./series.js";
import { satsBtcUsd, satsBtcUsdFrom } from "./shared.js";
>>>>>>> 69eb58f7 (chore: update website from upstream v0.1.5)

/**
 * Create Network section
 * @returns {PartialOptionsGroup}
 */
export function createNetworkSection() {
  const {
    blocks,
    transactions,
    inputs,
    outputs,
    scripts,
    supply,
<<<<<<< HEAD
    addrs,
    cohorts,
  } = brk.series;
=======
    distribution,
  } = brk.metrics;
>>>>>>> 69eb58f7 (chore: update website from upstream v0.1.5)

  const st = colors.scriptType;

  // Addressable types - newest to oldest (for addresses/counts that only support addressable types)
  const addressTypes = /** @type {const} */ ([
    { key: "p2a", name: "P2A", color: st.p2a, defaultActive: false },
    { key: "p2tr", name: "P2TR", color: st.p2tr, defaultActive: true },
    { key: "p2wsh", name: "P2WSH", color: st.p2wsh, defaultActive: true },
    { key: "p2wpkh", name: "P2WPKH", color: st.p2wpkh, defaultActive: true },
    { key: "p2sh", name: "P2SH", color: st.p2sh, defaultActive: true },
    { key: "p2pkh", name: "P2PKH", color: st.p2pkh, defaultActive: true },
    { key: "p2pk33", name: "P2PK33", color: st.p2pk33, defaultActive: false },
    { key: "p2pk65", name: "P2PK65", color: st.p2pk65, defaultActive: false },
  ]);

  // Non-addressable script types
  const nonAddressableTypes = /** @type {const} */ ([
    { key: "p2ms", name: "P2MS", color: st.p2ms, defaultActive: false },
    {
<<<<<<< HEAD
      key: "opReturn",
      name: "OP_RETURN",
      color: st.opReturn,
      defaultActive: true,
    },
    {
      key: "emptyOutput",
=======
      key: "opreturn",
      name: "OP_RETURN",
      color: st.opreturn,
      defaultActive: false,
    },
    {
      key: "emptyoutput",
>>>>>>> 69eb58f7 (chore: update website from upstream v0.1.5)
      name: "Empty",
      color: st.empty,
      defaultActive: false,
    },
    {
<<<<<<< HEAD
      key: "unknownOutput",
=======
      key: "unknownoutput",
>>>>>>> 69eb58f7 (chore: update website from upstream v0.1.5)
      name: "Unknown",
      color: st.unknown,
      defaultActive: false,
    },
  ]);

  // All script types = addressable + non-addressable
  const scriptTypes = [...addressTypes, ...nonAddressableTypes];

<<<<<<< HEAD
  // Transacting types (transaction participation)
  const activityTypes = /** @type {const} */ ([
    { key: "sending", name: "Sending" },
    { key: "receiving", name: "Receiving" },
    { key: "both", name: "Sending & Receiving" },
    { key: "reactivated", name: "Reactivated" },
  ]);

=======
  // Address type groups (by era)
  const taprootAddresses = /** @type {const} */ ([
    { key: "p2a", name: "P2A", color: st.p2a },
    { key: "p2tr", name: "P2TR", color: st.p2tr },
  ]);
  const segwitAddresses = /** @type {const} */ ([
    { key: "p2wsh", name: "P2WSH", color: st.p2wsh },
    { key: "p2wpkh", name: "P2WPKH", color: st.p2wpkh },
  ]);
  const legacyAddresses = /** @type {const} */ ([
    { key: "p2sh", name: "P2SH", color: st.p2sh },
    { key: "p2pkh", name: "P2PKH", color: st.p2pkh },
    { key: "p2pk33", name: "P2PK33", color: st.p2pk33 },
    { key: "p2pk65", name: "P2PK65", color: st.p2pk65 },
  ]);

  // Transacting types (transaction participation)
  const transactingTypes = /** @type {const} */ ([
    {
      key: "sending",
      name: "Sending",
      title: "Unique Sending Addresses per Block",
      compareTitle: "Unique Sending Addresses per Block by Type",
    },
    {
      key: "receiving",
      name: "Receiving",
      title: "Unique Receiving Addresses per Block",
      compareTitle: "Unique Receiving Addresses per Block by Type",
    },
    {
      key: "both",
      name: "Sending & Receiving",
      title: "Unique Addresses Sending & Receiving per Block",
      compareTitle: "Unique Addresses Sending & Receiving per Block by Type",
    },
  ]);

  // Balance change types
  const balanceTypes = /** @type {const} */ ([
    {
      key: "balanceIncreased",
      name: "Accumulating",
      title: "Accumulating Addresses per Block",
      compareTitle: "Accumulating Addresses per Block by Type",
    },
    {
      key: "balanceDecreased",
      name: "Distributing",
      title: "Distributing Addresses per Block",
      compareTitle: "Distributing Addresses per Block by Type",
    },
  ]);

  // Count types for comparison charts
  // addrCount and emptyAddrCount have .count, totalAddrCount doesn't
>>>>>>> 69eb58f7 (chore: update website from upstream v0.1.5)
  const countTypes = /** @type {const} */ ([
    {
      name: "Funded",
      title: "Address Count by Type",
      /** @param {AddressableType} t */
<<<<<<< HEAD
      getSeries: (t) => addrs.funded[t],
=======
      getMetric: (t) => distribution.addrCount[t].count,
>>>>>>> 69eb58f7 (chore: update website from upstream v0.1.5)
    },
    {
      name: "Empty",
      title: "Empty Address Count by Type",
      /** @param {AddressableType} t */
<<<<<<< HEAD
      getSeries: (t) => addrs.empty[t],
=======
      getMetric: (t) => distribution.emptyAddrCount[t].count,
>>>>>>> 69eb58f7 (chore: update website from upstream v0.1.5)
    },
    {
      name: "Total",
      title: "Total Address Count by Type",
      /** @param {AddressableType} t */
<<<<<<< HEAD
      getSeries: (t) => addrs.total[t],
    },
  ]);

  const countMetrics = /** @type {const} */ ([
    { key: "funded", name: "Funded", color: undefined },
    { key: "empty", name: "Empty", color: colors.gray },
    { key: "total", name: "Total", color: colors.default },
  ]);

  /**
   * @param {AddressableType | "all"} key
   * @param {string} [typeName]
   */
  const createAddressSeriesTree = (key, typeName) => {
    const title = formatCohortTitle(typeName);
    return [
    {
      name: "Count",
      tree: [
        {
          name: "Compare",
          title: title("Address Count"),
          bottom: countMetrics.map((m) =>
            line({
              series: addrs[m.key][key],
              name: m.name,
              color: m.color,
              unit: Unit.count,
            }),
          ),
        },
        ...countMetrics.map((m) => ({
          name: m.name,
          title: title(`${m.name} Addresses`),
          bottom: [
            line({ series: addrs[m.key][key], name: m.name, unit: Unit.count }),
          ],
        })),
      ],
    },
    ...simpleDeltaTree({
      delta: addrs.delta[key],
      title,
      metric: "Address Count",
      unit: Unit.count,
    }),
    {
      name: "New",
      tree: chartsFromCount({
        pattern: addrs.new[key],
        title,
        metric: "New Addresses",
        unit: Unit.count,
      }),
    },
    {
      name: "Activity",
      tree: [
        {
          name: "Compare",
          tree: ROLLING_WINDOWS.map((w) => ({
            name: w.name,
            title: title(`${w.title} Active Addresses`),
            bottom: activityTypes.map((t, i) =>
              line({
                series: addrs.activity[key][t.key][w.key],
                name: t.name,
                color: colors.at(i, activityTypes.length),
                unit: Unit.count,
              }),
            ),
          })),
        },
        ...activityTypes.map((t) => ({
          name: t.name,
          tree: averagesArray({
            windows: addrs.activity[key][t.key],
            title,
            metric: `${t.name} Addresses`,
            unit: Unit.count,
          }),
        })),
      ],
    },
  ];
  };

  /** @type {Record<string, typeof scriptTypes[number]>} */
  const byKey = Object.fromEntries(scriptTypes.map((t) => [t.key, t]));

  const scriptGroups = [
    { name: "Legacy", types: [byKey.p2pkh, byKey.p2pk33, byKey.p2pk65] },
    { name: "Script Hash", types: [byKey.p2sh, byKey.p2ms] },
    { name: "SegWit", types: [byKey.p2wsh, byKey.p2wpkh] },
    { name: "Taproot", types: [byKey.p2a, byKey.p2tr] },
    {
      name: "Other",
      types: [byKey.opReturn, byKey.emptyOutput, byKey.unknownOutput],
    },
  ];

  /**
=======
      getMetric: (t) => distribution.totalAddrCount[t],
    },
  ]);

  /**
   * Create address metrics tree for a given type key
   * @param {AddressableType | "all"} key
   * @param {string} titlePrefix
   */
  const createAddressMetricsTree = (key, titlePrefix) => [
    {
      name: "Count",
      title: `${titlePrefix}Address Count`,
      bottom: [
        line({
          metric: distribution.addrCount[key].count,
          name: "Funded",
          unit: Unit.count,
        }),
        line({
          metric: distribution.emptyAddrCount[key].count,
          name: "Empty",
          color: colors.gray,
          unit: Unit.count,
          defaultActive: false,
        }),
        line({
          metric: distribution.totalAddrCount[key],
          name: "Total",
          color: colors.default,
          unit: Unit.count,
          defaultActive: false,
        }),
      ],
    },
    {
      name: "Trends",
      tree: [
        {
          name: "30d Change",
          title: `${titlePrefix}Address Count 30d Change`,
          bottom: [
            baseline({
              metric: distribution.addrCount[key]._30dChange,
              name: "Funded",
              unit: Unit.count,
            }),
            baseline({
              metric: distribution.emptyAddrCount[key]._30dChange,
              name: "Empty",
              color: colors.gray,
              unit: Unit.count,
              defaultActive: false,
            }),
          ],
        },
        {
          name: "New",
          tree: chartsFromFullPerBlock({
            pattern: distribution.newAddrCount[key],
            title: `${titlePrefix}New Address Count`,
            unit: Unit.count,
          }),
        },
        {
          name: "Reactivated",
          title: `${titlePrefix}Reactivated Addresses per Block`,
          bottom: fromBaseStatsPattern({
            pattern: distribution.addressActivity[key].reactivated,
            unit: Unit.count,
          }),
        },
        {
          name: "Growth Rate",
          title: `${titlePrefix}Address Growth Rate per Block`,
          bottom: fromBaseStatsPattern({
            pattern: distribution.growthRate[key],
            unit: Unit.ratio,
          }),
        },
      ],
    },
    {
      name: "Transacting",
      tree: transactingTypes.map((t) => ({
        name: t.name,
        title: `${titlePrefix}${t.title}`,
        bottom: fromBaseStatsPattern({
          pattern: distribution.addressActivity[key][t.key],
          unit: Unit.count,
        }),
      })),
    },
    {
      name: "Balance",
      tree: balanceTypes.map((b) => ({
        name: b.name,
        title: `${titlePrefix}${b.title}`,
        bottom: fromBaseStatsPattern({
          pattern: distribution.addressActivity[key][b.key],
          unit: Unit.count,
        }),
      })),
    },
  ];

  /**
   * Create Compare charts for an address group
   * @template {AddressableType} K
   * @param {string} groupName
   * @param {ReadonlyArray<{key: K, name: string, color: Color}>} types
   */
  const createAddressCompare = (groupName, types) => ({
    name: "Compare",
    tree: [
      {
        name: "Count",
        tree: countTypes.map((c) => ({
          name: c.name,
          title: `${groupName} ${c.title}`,
          bottom: types.map((t) =>
            line({
              metric: c.getMetric(t.key),
              name: t.name,
              color: t.color,
              unit: Unit.count,
            }),
          ),
        })),
      },
      {
        name: "New",
        title: `${groupName} New Address Count`,
        bottom: types.flatMap((t) => [
          line({
            metric: distribution.newAddrCount[t.key].base,
            name: t.name,
            color: t.color,
            unit: Unit.count,
          }),
          line({
            metric: distribution.newAddrCount[t.key].sum,
            name: t.name,
            color: t.color,
            unit: Unit.count,
          }),
        ]),
      },
      {
        name: "Reactivated",
        title: `${groupName} Reactivated Addresses per Block`,
        bottom: types.flatMap((t) => [
          line({
            metric: distribution.addressActivity[t.key].reactivated.base,
            name: t.name,
            color: t.color,
            unit: Unit.count,
          }),
          line({
            metric: distribution.addressActivity[t.key].reactivated.average,
            name: t.name,
            color: t.color,
            unit: Unit.count,
          }),
        ]),
      },
      {
        name: "Growth Rate",
        title: `${groupName} Address Growth Rate per Block`,
        bottom: types.flatMap((t) => [
          dots({
            metric: distribution.growthRate[t.key].base,
            name: t.name,
            color: t.color,
            unit: Unit.ratio,
          }),
          dots({
            metric: distribution.growthRate[t.key].average,
            name: t.name,
            color: t.color,
            unit: Unit.ratio,
          }),
        ]),
      },
      {
        name: "Transacting",
        tree: transactingTypes.map((tr) => ({
          name: tr.name,
          title: `${groupName} ${tr.compareTitle}`,
          bottom: types.flatMap((t) => [
            line({
              metric: distribution.addressActivity[t.key][tr.key].base,
              name: t.name,
              color: t.color,
              unit: Unit.count,
            }),
            line({
              metric: distribution.addressActivity[t.key][tr.key].average,
              name: t.name,
              color: t.color,
              unit: Unit.count,
            }),
          ]),
        })),
      },
      {
        name: "Balance",
        tree: balanceTypes.map((b) => ({
          name: b.name,
          title: `${groupName} ${b.compareTitle}`,
          bottom: types.flatMap((t) => [
            line({
              metric: distribution.addressActivity[t.key][b.key].base,
              name: t.name,
              color: t.color,
              unit: Unit.count,
            }),
            line({
              metric: distribution.addressActivity[t.key][b.key].average,
              name: t.name,
              color: t.color,
              unit: Unit.count,
            }),
          ]),
        })),
      },
    ],
  });

  // Script type groups for Output Counts
  const legacyScripts = /** @type {const} */ ([
    { key: "p2pkh", name: "P2PKH", color: st.p2pkh },
    { key: "p2pk33", name: "P2PK33", color: st.p2pk33 },
    { key: "p2pk65", name: "P2PK65", color: st.p2pk65 },
  ]);
  const scriptHashScripts = /** @type {const} */ ([
    { key: "p2sh", name: "P2SH", color: st.p2sh },
    { key: "p2ms", name: "P2MS", color: st.p2ms },
  ]);
  const segwitScripts = /** @type {const} */ ([
    { key: "segwit", name: "All SegWit", color: colors.segwit },
    { key: "p2wsh", name: "P2WSH", color: st.p2wsh },
    { key: "p2wpkh", name: "P2WPKH", color: st.p2wpkh },
  ]);
  const otherScripts = /** @type {const} */ ([
    { key: "opreturn", name: "OP_RETURN", color: st.opreturn },
    { key: "emptyoutput", name: "Empty", color: st.empty },
    { key: "unknownoutput", name: "Unknown", color: st.unknown },
  ]);

  /**
   * Create Compare charts for a script group
>>>>>>> 69eb58f7 (chore: update website from upstream v0.1.5)
   * @template {keyof typeof scripts.count} K
   * @param {string} groupName
   * @param {ReadonlyArray<{key: K, name: string, color: Color}>} types
   */
<<<<<<< HEAD
  const createScriptGroup = (groupName, types) => ({
    name: groupName,
    tree: [
      {
        name: "Compare",
        tree: [
          ...ROLLING_WINDOWS.map((w) => ({
            name: w.name,
            title: `${w.title} ${groupName} Output Count`,
            bottom: types.map((t) =>
              line({
                series: /** @type {CountPattern<number>} */ (
                  scripts.count[t.key]
                ).sum[w.key],
                name: t.name,
                color: t.color,
                unit: Unit.count,
              }),
            ),
          })),
          {
            name: "Cumulative",
            title: `Cumulative ${groupName} Output Count`,
            bottom: types.map((t) =>
              line({
                series: scripts.count[t.key].cumulative,
                name: t.name,
                color: t.color,
                unit: Unit.count,
              }),
            ),
          },
        ],
      },
      ...types.map((t) => ({
        name: t.name,
        tree: chartsFromCount({
          pattern: /** @type {CountPattern<number>} */ (scripts.count[t.key]),
          metric: `${t.name} Output Count`,
          unit: Unit.count,
        }),
      })),
=======
  const createScriptCompare = (groupName, types) => ({
    name: "Compare",
    tree: [
      {
        name: "Sum",
        title: `${groupName} Output Count`,
        bottom: types.map((t) =>
          line({
            metric: scripts.count[t.key].sum,
            name: t.name,
            color: t.color,
            unit: Unit.count,
          }),
        ),
      },
      {
        name: "Cumulative",
        title: `${groupName} Output Count (Total)`,
        bottom: types.map((t) =>
          line({
            metric: scripts.count[t.key].cumulative,
            name: t.name,
            color: t.color,
            unit: Unit.count,
          }),
        ),
      },
>>>>>>> 69eb58f7 (chore: update website from upstream v0.1.5)
    ],
  });

  return {
    name: "Network",
    tree: [
      // Supply
      {
        name: "Supply",
        tree: [
          {
            name: "Circulating",
            title: "Circulating Supply",
            bottom: fromSupplyPattern({
              pattern: supply.circulating,
              title: "Supply",
            }),
          },
          {
            name: "Inflation",
            title: "Inflation Rate",
<<<<<<< HEAD
            bottom: percentRatioDots({
              pattern: supply.inflationRate,
              name: "Rate",
            }),
          },
          {
            name: "Hodled or Lost",
            title: "Hodled or Lost Supply",
            bottom: satsBtcUsd({
              pattern: supply.hodledOrLost,
              name: "Supply",
            }),
          },

          {
            name: "Unspendable",
            title: "Unspendable Supply",
            bottom: satsBtcUsdFrom({
              source: supply.burned,
              key: "cumulative",
              name: "All Time",
            }),
          },
          {
            name: "OP_RETURN",
            title: "OP_RETURN Burned",
            bottom: satsBtcUsd({
              pattern: scripts.value.opReturn.cumulative,
              name: "All Time",
=======
            bottom: [
              dots({
                metric: supply.inflation,
                name: "Rate",
                unit: Unit.percentage,
              }),
            ],
          },
          {
            name: "Unspendable",
            tree: [
              {
                name: "Sum",
                title: "Unspendable Supply",
                bottom: satsBtcUsdFrom({
                  source: supply.burned.unspendable,
                  key: "sum",
                  name: "sum",
                }),
              },
              {
                name: "Cumulative",
                title: "Unspendable Supply (Total)",
                bottom: satsBtcUsdFrom({
                  source: supply.burned.unspendable,
                  key: "cumulative",
                  name: "all-time",
                }),
              },
            ],
          },
          {
            name: "OP_RETURN",
            tree: chartsFromValueFull({
              pattern: scripts.value.opreturn,
              title: "OP_RETURN Burned",
>>>>>>> 69eb58f7 (chore: update website from upstream v0.1.5)
            }),
          },
        ],
      },

      // Transactions
      {
        name: "Transactions",
        tree: [
          {
            name: "Count",
            tree: chartsFromFullPerBlock({
<<<<<<< HEAD
              pattern: transactions.count.total,
              metric: "Transaction Count",
=======
              pattern: transactions.count.txCount,
              title: "Transaction Count",
>>>>>>> 69eb58f7 (chore: update website from upstream v0.1.5)
              unit: Unit.count,
            }),
          },
          {
<<<<<<< HEAD
            name: "Volume",
            tree: satsBtcUsdFullTree({
              pattern: transactions.volume.transferVolume,
              metric: "Transaction Volume",
            }),
          },
          {
            name: "Fee Rate",
            tree: chartsFromBlockAnd6b({
              pattern: transactions.fees.feeRate,
              metric: "Transaction Fee Rate",
=======
            name: "Fee Rate",
            title: "Transaction Fee Rate",
            bottom: fromStatsPattern({
              pattern: transactions.fees.feeRate,
>>>>>>> 69eb58f7 (chore: update website from upstream v0.1.5)
              unit: Unit.feeRate,
            }),
          },
          {
<<<<<<< HEAD
            name: "Fee",
            tree: chartsFromBlockAnd6b({
              pattern: transactions.fees.fee,
              metric: "Transaction Fee",
              unit: Unit.sats,
            }),
          },
          {
            name: "Weight",
            tree: chartsFromBlockAnd6b({
              pattern: transactions.size.weight,
              metric: "Transaction Weight",
              unit: Unit.wu,
            }),
          },
          {
            name: "vSize",
            tree: chartsFromBlockAnd6b({
              pattern: transactions.size.vsize,
              metric: "Transaction vSize",
              unit: Unit.vb,
            }),
          },
          {
            name: "Versions",
            tree: chartsFromCountEntries({
              entries: entries(transactions.versions),
              metric: "Transaction Versions",
              unit: Unit.count,
            }),
=======
            name: "Volume",
            tree: [
              {
                name: "Transferred",
                title: "Transaction Volume",
                bottom: [
                  ...satsBtcUsd({
                    pattern: transactions.volume.sentSum,
                    name: "Sent",
                  }),
                  ...satsBtcUsd({
                    pattern: transactions.volume.receivedSum,
                    name: "Received",
                    color: colors.entity.output,
                  }),
                ],
              },
              {
                name: "Annualized",
                title: "Annualized Transaction Volume",
                bottom: satsBtcUsd({
                  pattern: transactions.volume.annualizedVolume,
                  name: "Annualized",
                }),
              },
            ],
          },
          {
            name: "Size",
            title: "Transaction Size",
            bottom: [
              ...fromStatsPattern({
                pattern: transactions.size.weight,
                unit: Unit.wu,
              }),
              ...fromStatsPattern({
                pattern: transactions.size.vsize,
                unit: Unit.vb,
              }),
            ],
          },
          {
            name: "Versions",
            tree: [
              {
                name: "Sum",
                title: "Transaction Versions",
                bottom: [
                  line({
                    metric: transactions.versions.v1.sum,
                    name: "v1",
                    color: colors.txVersion.v1,
                    unit: Unit.count,
                  }),
                  line({
                    metric: transactions.versions.v2.sum,
                    name: "v2",
                    color: colors.txVersion.v2,
                    unit: Unit.count,
                  }),
                  line({
                    metric: transactions.versions.v3.sum,
                    name: "v3",
                    color: colors.txVersion.v3,
                    unit: Unit.count,
                  }),
                ],
              },
              {
                name: "Cumulative",
                title: "Transaction Versions (Total)",
                bottom: [
                  line({
                    metric: transactions.versions.v1.cumulative,
                    name: "v1",
                    color: colors.txVersion.v1,
                    unit: Unit.count,
                  }),
                  line({
                    metric: transactions.versions.v2.cumulative,
                    name: "v2",
                    color: colors.txVersion.v2,
                    unit: Unit.count,
                  }),
                  line({
                    metric: transactions.versions.v3.cumulative,
                    name: "v3",
                    color: colors.txVersion.v3,
                    unit: Unit.count,
                  }),
                ],
              },
            ],
>>>>>>> 69eb58f7 (chore: update website from upstream v0.1.5)
          },
          {
            name: "Velocity",
            title: "Transaction Velocity",
            bottom: [
              line({
<<<<<<< HEAD
                series: supply.velocity.native,
=======
                metric: supply.velocity.btc,
>>>>>>> 69eb58f7 (chore: update website from upstream v0.1.5)
                name: "BTC",
                unit: Unit.ratio,
              }),
              line({
<<<<<<< HEAD
                series: supply.velocity.fiat,
=======
                metric: supply.velocity.usd,
>>>>>>> 69eb58f7 (chore: update website from upstream v0.1.5)
                name: "USD",
                color: colors.usd,
                unit: Unit.ratio,
              }),
            ],
          },
        ],
      },

      // Blocks
      {
        name: "Blocks",
        tree: [
          {
            name: "Count",
            tree: [
              {
<<<<<<< HEAD
                name: "Compare",
                title: "Block Count",
                bottom: ROLLING_WINDOWS.map((w) =>
                  line({
                    series: blocks.count.total.sum[w.key],
                    name: w.name,
                    color: w.color,
                    unit: Unit.count,
                  }),
                ),
              },
              ...ROLLING_WINDOWS.map((w) => ({
                name: w.name,
                title: `${w.title} Block Count`,
                bottom: [
                  line({
                    series: blocks.count.total.sum[w.key],
                    name: "Actual",
                    unit: Unit.count,
                  }),
                  line({
                    series: blocks.count.target[w.key],
=======
                name: "Sum",
                title: "Block Count",
                bottom: [
                  line({
                    metric: blocks.count.blockCount.sum,
                    name: "sum",
                    unit: Unit.count,
                  }),
                  line({
                    metric: blocks.count.blockCountTarget,
>>>>>>> 69eb58f7 (chore: update website from upstream v0.1.5)
                    name: "Target",
                    color: colors.gray,
                    unit: Unit.count,
                    options: { lineStyle: 4 },
                  }),
                ],
<<<<<<< HEAD
              })),
              {
                name: "Cumulative",
                title: "Cumulative Block Count",
                bottom: [
                  {
                    series: blocks.count.total.cumulative,
                    title: "All Time",
                    unit: Unit.count,
                  },
=======
              },
              {
                name: "Rolling",
                title: "Block Count (Rolling)",
                bottom: [
                  line({
                    metric: blocks.count._24hBlockCount,
                    name: "24h",
                    color: colors.time._24h,
                    unit: Unit.count,
                  }),
                  line({
                    metric: blocks.count._1wBlockCount,
                    name: "1w",
                    color: colors.time._1w,
                    unit: Unit.count,
                  }),
                  line({
                    metric: blocks.count._1mBlockCount,
                    name: "1m",
                    color: colors.time._1m,
                    unit: Unit.count,
                  }),
                  line({
                    metric: blocks.count._1yBlockCount,
                    name: "1y",
                    color: colors.time._1y,
                    unit: Unit.count,
                  }),
                ],
              },
              {
                name: "Cumulative",
                title: "Block Count (Total)",
                bottom: [
                  line({
                    metric: blocks.count.blockCount.cumulative,
                    name: "all-time",
                    unit: Unit.count,
                  }),
>>>>>>> 69eb58f7 (chore: update website from upstream v0.1.5)
                ],
              },
            ],
          },
          {
            name: "Interval",
<<<<<<< HEAD
            tree: averagesArray({
              windows: blocks.interval,
              metric: "Block Interval",
              unit: Unit.secs,
            }),
          },
          {
            name: "Size",
            tree: chartsFromFull({
              pattern: blocks.size,
              metric: "Block Size",
              unit: Unit.bytes,
            }),
          },
          {
            name: "Weight",
            tree: chartsFromFull({
              pattern: blocks.weight,
              metric: "Block Weight",
              unit: Unit.wu,
            }),
          },
          {
            name: "vBytes",
            tree: chartsFromFull({
              pattern: blocks.vbytes,
              metric: "Block vBytes",
              unit: Unit.vb,
=======
            title: "Block Interval",
            bottom: [
              ...fromBaseStatsPattern({
                pattern: blocks.interval,
                unit: Unit.secs,
              }),
              priceLine({ unit: Unit.secs, name: "Target", number: 600 }),
            ],
          },
          {
            name: "Size",
            tree: [
              {
                name: "Sum",
                title: "Block Size",
                bottom: [
                  line({
                    metric: blocks.totalSize,
                    name: "base",
                    unit: Unit.bytes,
                  }),
                  line({
                    metric: blocks.size.sum,
                    name: "sum",
                    unit: Unit.bytes,
                  }),
                ],
              },
              {
                name: "Distribution",
                title: "Block Size Distribution",
                bottom: [
                  line({
                    metric: blocks.totalSize,
                    name: "base",
                    unit: Unit.bytes,
                  }),
                  ...fromStatsPattern({
                    pattern: blocks.size,
                    unit: Unit.bytes,
                  }),
                ],
              },
              {
                name: "Cumulative",
                title: "Block Size (Total)",
                bottom: [
                  line({
                    metric: blocks.size.cumulative,
                    name: "all-time",
                    unit: Unit.bytes,
                  }),
                ],
              },
            ],
          },
          {
            name: "Weight",
            tree: [
              {
                name: "Sum",
                title: "Block Weight",
                bottom: [
                  line({
                    metric: blocks.weight.base,
                    name: "base",
                    unit: Unit.wu,
                  }),
                  line({
                    metric: blocks.weight.sum,
                    name: "sum",
                    unit: Unit.wu,
                  }),
                ],
              },
              {
                name: "Distribution",
                title: "Block Weight Distribution",
                bottom: [
                  line({
                    metric: blocks.weight.base,
                    name: "base",
                    unit: Unit.wu,
                  }),
                  ...fromStatsPattern({
                    pattern: blocks.weight,
                    unit: Unit.wu,
                  }),
                ],
              },
              {
                name: "Cumulative",
                title: "Block Weight (Total)",
                bottom: [
                  line({
                    metric: blocks.weight.cumulative,
                    name: "all-time",
                    unit: Unit.wu,
                  }),
                ],
              },
            ],
          },
          {
            name: "vBytes",
            tree: [
              {
                name: "Sum",
                title: "Block vBytes",
                bottom: [
                  line({
                    metric: blocks.vbytes.base,
                    name: "base",
                    unit: Unit.vb,
                  }),
                  line({
                    metric: blocks.vbytes.sum,
                    name: "sum",
                    unit: Unit.vb,
                  }),
                ],
              },
              {
                name: "Distribution",
                title: "Block vBytes Distribution",
                bottom: [
                  line({
                    metric: blocks.vbytes.base,
                    name: "base",
                    unit: Unit.vb,
                  }),
                  ...fromStatsPattern({
                    pattern: blocks.vbytes,
                    unit: Unit.vb,
                  }),
                ],
              },
              {
                name: "Cumulative",
                title: "Block vBytes (Total)",
                bottom: [
                  line({
                    metric: blocks.vbytes.cumulative,
                    name: "all-time",
                    unit: Unit.vb,
                  }),
                ],
              },
            ],
          },
          {
            name: "Fullness",
            title: "Block Fullness",
            bottom: fromBaseStatsPattern({
              pattern: blocks.fullness,
              unit: Unit.percentage,
>>>>>>> 69eb58f7 (chore: update website from upstream v0.1.5)
            }),
          },
        ],
      },

      // UTXOs
      {
        name: "UTXOs",
        tree: [
          {
            name: "Count",
            title: "UTXO Count",
            bottom: [
              line({
<<<<<<< HEAD
                series: outputs.count.unspent,
=======
                metric: outputs.count.utxoCount,
>>>>>>> 69eb58f7 (chore: update website from upstream v0.1.5)
                name: "Count",
                unit: Unit.count,
              }),
            ],
          },
<<<<<<< HEAD
          ...simpleDeltaTree({
            delta: cohorts.utxo.all.outputs.unspentCount.delta,
            metric: "UTXO Count",
            unit: Unit.count,
          }),
          {
            name: "Flow",
            tree: multiSeriesTree({
              entries: [
                {
                  name: "Created",
                  color: colors.entity.output,
                  average: outputs.count.total.rolling.average,
                  sum: outputs.count.total.rolling.sum,
                  cumulative: outputs.count.total.cumulative,
                },
                {
                  name: "Spent",
                  color: colors.entity.input,
                  average: inputs.count.rolling.average,
                  sum: inputs.count.rolling.sum,
                  cumulative: inputs.count.cumulative,
                },
              ],
              metric: "UTXO Flow",
              unit: Unit.count,
            }),
=======
          {
            name: "30d Change",
            title: "UTXO Count 30d Change",
            bottom: [
              baseline({
                metric: distribution.utxoCohorts.all.outputs.utxoCount30dChange,
                name: "30d Change",
                unit: Unit.count,
              }),
            ],
          },
          {
            name: "Flow",
            title: "UTXO Flow",
            bottom: [
              line({
                metric: outputs.count.totalCount.sum,
                name: "Created",
                color: colors.entity.output,
                unit: Unit.count,
              }),
              line({
                metric: inputs.count.sum,
                name: "Spent",
                color: colors.entity.input,
                unit: Unit.count,
              }),
            ],
>>>>>>> 69eb58f7 (chore: update website from upstream v0.1.5)
          },
        ],
      },
      {
        name: "Inputs",
<<<<<<< HEAD
        tree: chartsFromAggregatedPerBlock({
          pattern: inputs.count,
          metric: "Input Count",
=======
        tree: chartsFromSumPerBlock({
          pattern: inputs.count,
          title: "Input Count",
>>>>>>> 69eb58f7 (chore: update website from upstream v0.1.5)
          unit: Unit.count,
        }),
      },
      {
        name: "Outputs",
<<<<<<< HEAD
        tree: chartsFromAggregatedPerBlock({
          pattern: outputs.count.total,
          metric: "Output Count",
=======
        tree: chartsFromSumPerBlock({
          pattern: outputs.count.totalCount,
          title: "Output Count",
>>>>>>> 69eb58f7 (chore: update website from upstream v0.1.5)
          unit: Unit.count,
        }),
      },
      {
<<<<<<< HEAD
        name: "Throughput",
        tree: ROLLING_WINDOWS.map((w) => ({
          name: w.name,
          title: `${w.title} Throughput`,
          bottom: [
            line({
              series: transactions.volume.txPerSec[w.key],
              name: "TX/sec",
              color: colors.entity.tx,
              unit: Unit.perSec,
            }),
            line({
              series: transactions.volume.inputsPerSec[w.key],
              name: "Inputs/sec",
              color: colors.entity.input,
              unit: Unit.perSec,
            }),
            line({
              series: transactions.volume.outputsPerSec[w.key],
              name: "Outputs/sec",
              color: colors.entity.output,
              unit: Unit.perSec,
            }),
          ],
        })),
=======
        name: "Activity Rate",
        title: "Activity Rate",
        bottom: [
          dots({
            metric: transactions.volume.txPerSec,
            name: "TX/sec",
            color: colors.entity.tx,
            unit: Unit.perSec,
          }),
          dots({
            metric: transactions.volume.inputsPerSec,
            name: "Inputs/sec",
            color: colors.entity.input,
            unit: Unit.perSec,
          }),
          dots({
            metric: transactions.volume.outputsPerSec,
            name: "Outputs/sec",
            color: colors.entity.output,
            unit: Unit.perSec,
          }),
        ],
>>>>>>> 69eb58f7 (chore: update website from upstream v0.1.5)
      },

      // Addresses
      {
        name: "Addresses",
        tree: [
<<<<<<< HEAD
          ...createAddressSeriesTree("all"),
          {
            name: "By Type",
            tree: [
              {
                name: "Compare",
=======
          // Overview - global metrics for all addresses
          { name: "Overview", tree: createAddressMetricsTree("all", "") },

          // Top-level Compare - all types
          {
            name: "Compare",
            tree: [
              {
                name: "Count",
>>>>>>> 69eb58f7 (chore: update website from upstream v0.1.5)
                tree: countTypes.map((c) => ({
                  name: c.name,
                  title: c.title,
                  bottom: addressTypes.map((t) =>
                    line({
<<<<<<< HEAD
                      series: c.getSeries(t.key),
=======
                      metric: c.getMetric(t.key),
>>>>>>> 69eb58f7 (chore: update website from upstream v0.1.5)
                      name: t.name,
                      color: t.color,
                      unit: Unit.count,
                      defaultActive: t.defaultActive,
                    }),
                  ),
                })),
              },
<<<<<<< HEAD
              ...addressTypes.map((t) => ({
                name: t.name,
                tree: createAddressSeriesTree(t.key, t.name),
=======
              {
                name: "New",
                title: "New Address Count by Type",
                bottom: addressTypes.flatMap((t) => [
                  line({
                    metric: distribution.newAddrCount[t.key].base,
                    name: t.name,
                    color: t.color,
                    unit: Unit.count,
                    defaultActive: t.defaultActive,
                  }),
                  line({
                    metric: distribution.newAddrCount[t.key].sum,
                    name: t.name,
                    color: t.color,
                    unit: Unit.count,
                    defaultActive: t.defaultActive,
                  }),
                ]),
              },
              {
                name: "Reactivated",
                title: "Reactivated Addresses per Block by Type",
                bottom: addressTypes.flatMap((t) => [
                  line({
                    metric:
                      distribution.addressActivity[t.key].reactivated.base,
                    name: t.name,
                    color: t.color,
                    unit: Unit.count,
                    defaultActive: t.defaultActive,
                  }),
                  line({
                    metric:
                      distribution.addressActivity[t.key].reactivated.average,
                    name: t.name,
                    color: t.color,
                    unit: Unit.count,
                    defaultActive: t.defaultActive,
                  }),
                ]),
              },
              {
                name: "Growth Rate",
                title: "Address Growth Rate per Block by Type",
                bottom: addressTypes.flatMap((t) => [
                  dots({
                    metric: distribution.growthRate[t.key].base,
                    name: t.name,
                    color: t.color,
                    unit: Unit.ratio,
                    defaultActive: t.defaultActive,
                  }),
                  dots({
                    metric: distribution.growthRate[t.key].average,
                    name: t.name,
                    color: t.color,
                    unit: Unit.ratio,
                    defaultActive: t.defaultActive,
                  }),
                ]),
              },
              {
                name: "Transacting",
                tree: transactingTypes.map((tr) => ({
                  name: tr.name,
                  title: tr.compareTitle,
                  bottom: addressTypes.flatMap((t) => [
                    line({
                      metric: distribution.addressActivity[t.key][tr.key].base,
                      name: t.name,
                      color: t.color,
                      unit: Unit.count,
                      defaultActive: t.defaultActive,
                    }),
                    line({
                      metric:
                        distribution.addressActivity[t.key][tr.key].average,
                      name: t.name,
                      color: t.color,
                      unit: Unit.count,
                      defaultActive: t.defaultActive,
                    }),
                  ]),
                })),
              },
              {
                name: "Balance",
                tree: balanceTypes.map((b) => ({
                  name: b.name,
                  title: b.compareTitle,
                  bottom: addressTypes.flatMap((t) => [
                    line({
                      metric: distribution.addressActivity[t.key][b.key].base,
                      name: t.name,
                      color: t.color,
                      unit: Unit.count,
                      defaultActive: t.defaultActive,
                    }),
                    line({
                      metric:
                        distribution.addressActivity[t.key][b.key].average,
                      name: t.name,
                      color: t.color,
                      unit: Unit.count,
                      defaultActive: t.defaultActive,
                    }),
                  ]),
                })),
              },
            ],
          },

          // Legacy (pre-SegWit)
          {
            name: "Legacy",
            tree: [
              createAddressCompare("Legacy", legacyAddresses),
              ...legacyAddresses.map((t) => ({
                name: t.name,
                tree: createAddressMetricsTree(t.key, `${t.name} `),
              })),
            ],
          },

          // SegWit
          {
            name: "SegWit",
            tree: [
              createAddressCompare("SegWit", segwitAddresses),
              ...segwitAddresses.map((t) => ({
                name: t.name,
                tree: createAddressMetricsTree(t.key, `${t.name} `),
              })),
            ],
          },

          // Taproot
          {
            name: "Taproot",
            tree: [
              createAddressCompare("Taproot", taprootAddresses),
              ...taprootAddresses.map((t) => ({
                name: t.name,
                tree: createAddressMetricsTree(t.key, `${t.name} `),
>>>>>>> 69eb58f7 (chore: update website from upstream v0.1.5)
              })),
            ],
          },
        ],
      },

      // Scripts
      {
        name: "Scripts",
        tree: [
          {
<<<<<<< HEAD
            name: "Compare",
            tree: [
              ...ROLLING_WINDOWS.map((w) => ({
                name: w.name,
                title: `${w.title} Output Count by Script Type`,
                bottom: scriptTypes.map((t) =>
                  line({
                    series: /** @type {CountPattern<number>} */ (
                      scripts.count[t.key]
                    ).sum[w.key],
                    name: t.name,
                    color: t.color,
                    unit: Unit.count,
                    defaultActive: t.defaultActive,
                  }),
                ),
              })),
              {
                name: "Cumulative",
                title: "Cumulative Output Count by Script Type",
                bottom: scriptTypes.map((t) =>
                  line({
                    series: scripts.count[t.key].cumulative,
                    name: t.name,
                    color: t.color,
                    unit: Unit.count,
                    defaultActive: t.defaultActive,
                  }),
                ),
              },
            ],
          },
          ...scriptGroups.map((g) => createScriptGroup(g.name, g.types)),
=======
            name: "By Type",
            tree: [
              // Compare section
              {
                name: "Compare",
                tree: [
                  {
                    name: "Sum",
                    title: "Output Count by Script Type",
                    bottom: scriptTypes.map((t) =>
                      line({
                        metric: scripts.count[t.key].sum,
                        name: t.name,
                        color: t.color,
                        unit: Unit.count,
                        defaultActive: t.defaultActive,
                      }),
                    ),
                  },
                  {
                    name: "Cumulative",
                    title: "Output Count by Script Type (Total)",
                    bottom: scriptTypes.map((t) =>
                      line({
                        metric: scripts.count[t.key].cumulative,
                        name: t.name,
                        color: t.color,
                        unit: Unit.count,
                        defaultActive: t.defaultActive,
                      }),
                    ),
                  },
                ],
              },
              {
                name: "Legacy",
                tree: [
                  createScriptCompare("Legacy", legacyScripts),
                  ...legacyScripts.map((t) => ({
                    name: t.name,
                    tree: chartsFromFullPerBlock({
                      pattern: scripts.count[t.key],
                      title: `${t.name} Output Count`,
                      unit: Unit.count,
                    }),
                  })),
                ],
              },
              {
                name: "Script Hash",
                tree: [
                  createScriptCompare("Script Hash", scriptHashScripts),
                  ...scriptHashScripts.map((t) => ({
                    name: t.name,
                    tree: chartsFromFullPerBlock({
                      pattern: scripts.count[t.key],
                      title: `${t.name} Output Count`,
                      unit: Unit.count,
                    }),
                  })),
                ],
              },
              {
                name: "SegWit",
                tree: [
                  createScriptCompare("SegWit", segwitScripts),
                  ...segwitScripts.map((t) => ({
                    name: t.name,
                    tree: chartsFromFullPerBlock({
                      pattern: scripts.count[t.key],
                      title: `${t.name} Output Count`,
                      unit: Unit.count,
                    }),
                  })),
                ],
              },
              {
                name: "Taproot",
                tree: [
                  createScriptCompare("Taproot", taprootAddresses),
                  ...taprootAddresses.map((t) => ({
                    name: t.name,
                    tree: chartsFromFullPerBlock({
                      pattern: scripts.count[t.key],
                      title: `${t.name} Output Count`,
                      unit: Unit.count,
                    }),
                  })),
                ],
              },
              {
                name: "Other",
                tree: [
                  createScriptCompare("Other", otherScripts),
                  ...otherScripts.map((t) => ({
                    name: t.name,
                    tree: chartsFromFullPerBlock({
                      pattern: scripts.count[t.key],
                      title: `${t.name} Output Count`,
                      unit: Unit.count,
                    }),
                  })),
                ],
              },
            ],
          },
          {
            name: "Adoption",
            tree: [
              {
                name: "Compare",
                title: "Script Adoption",
                bottom: [
                  line({
                    metric: scripts.count.segwitAdoption.cumulative,
                    name: "SegWit",
                    color: colors.segwit,
                    unit: Unit.percentage,
                  }),
                  line({
                    metric: scripts.count.taprootAdoption.cumulative,
                    name: "Taproot",
                    color: colors.scriptType.p2tr,
                    unit: Unit.percentage,
                  }),
                ],
              },
              {
                name: "SegWit",
                title: "SegWit Adoption",
                bottom: [
                  line({
                    metric: scripts.count.segwitAdoption.base,
                    name: "Base",
                    unit: Unit.percentage,
                  }),
                  line({
                    metric: scripts.count.segwitAdoption.sum,
                    name: "Sum",
                    unit: Unit.percentage,
                  }),
                  line({
                    metric: scripts.count.segwitAdoption.cumulative,
                    name: "All-Time",
                    color: colors.time.all,
                    unit: Unit.percentage,
                  }),
                ],
              },
              {
                name: "Taproot",
                title: "Taproot Adoption",
                bottom: [
                  line({
                    metric: scripts.count.taprootAdoption.base,
                    name: "Base",
                    unit: Unit.percentage,
                  }),
                  line({
                    metric: scripts.count.taprootAdoption.sum,
                    name: "Sum",
                    unit: Unit.percentage,
                  }),
                  line({
                    metric: scripts.count.taprootAdoption.cumulative,
                    name: "All-Time",
                    color: colors.time.all,
                    unit: Unit.percentage,
                  }),
                ],
              },
            ],
          },
>>>>>>> 69eb58f7 (chore: update website from upstream v0.1.5)
        ],
      },
    ],
  };
}
