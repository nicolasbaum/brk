/** On-chain indicators (Pi Cycle, Puell, NVT, MVRV Z-Score, Thermocap, Gini) */

import { Unit } from "../../utils/units.js";
import { baseline, line, price } from "../series.js";

/**
 * Create Valuation section
 * @param {PartialContext} ctx
 * @param {Object} args
 * @param {Market["indicators"]} args.indicators
 * @param {Market["movingAverage"]} args.movingAverage
 */
export function createValuationSection(ctx, { indicators, movingAverage }) {
  const { colors } = ctx;

  return {
    name: "Valuation",
    tree: [
      {
        name: "Pi Cycle",
        title: "Pi Cycle",
        top: [
          price({
            metric: movingAverage.price111dSma.price,
            name: "111d SMA",
            color: colors.green,
          }),
          price({
            metric: movingAverage.price350dSmaX2,
            name: "350d SMA x2",
            color: colors.red,
          }),
        ],
        bottom: [
          baseline({
            metric: indicators.piCycle,
            name: "Pi Cycle",
            unit: Unit.ratio,
            base: 1,
          }),
        ],
      },
      {
        name: "Puell Multiple",
        title: "Puell Multiple",
        bottom: [
          line({
            metric: indicators.puellMultiple,
            name: "Puell",
            color: colors.green,
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
            color: colors.orange,
            unit: Unit.ratio,
          }),
        ],
      },
      {
        name: "MVRV Z-Score",
        title: "MVRV Z-Score",
        bottom: [
          baseline({
            metric: indicators.mvrvZScore,
            name: "Z-Score",
            unit: Unit.ratio,
            base: 0,
            color: colors.orange,
          }),
        ],
      },
      {
        name: "Thermocap Multiple",
        title: "Thermocap Multiple",
        bottom: [
          line({
            metric: indicators.thermocapMultiple,
            name: "Thermocap",
            color: colors.cyan,
            unit: Unit.ratio,
          }),
        ],
      },
      {
        name: "Gini",
        title: "Gini Coefficient",
        bottom: [
          line({
            metric: indicators.gini,
            name: "Gini",
            color: colors.red,
            unit: Unit.ratio,
          }),
        ],
      },
    ],
  };
}
