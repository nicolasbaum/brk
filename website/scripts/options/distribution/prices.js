/**
 * Prices section builders
 *
 * Structure (single cohort):
 * - Compare: Both prices on one chart
 * - Realized: Price + Ratio (MVRV) + Z-Scores (for full cohorts)
 * - Investor: Price + Ratio + Z-Scores (for full cohorts)
 *
 * Structure (grouped cohorts):
 * - Realized: Price + Ratio comparison across cohorts
 * - Investor: Price + Ratio comparison across cohorts
 *
 * For cohorts WITHOUT full ratio patterns: basic Price/Ratio charts only (no Z-Scores)
 */

import { colors } from "../../utils/colors.js";
<<<<<<< HEAD
import { createPriceRatioCharts, mapCohortsWithAll, priceRatioPercentilesTree } from "../shared.js";
=======
import { createPriceRatioCharts, mapCohortsWithAll } from "../shared.js";
>>>>>>> 69eb58f7 (chore: update website from upstream v0.1.5)
import { baseline, price } from "../series.js";
import { Unit } from "../../utils/units.js";

/**
<<<<<<< HEAD
 * Create prices section for cohorts with full ratio patterns
 * (CohortAll, CohortFull, CohortLongTerm)
 * @param {{ cohort: CohortAll | CohortFull | CohortLongTerm, title: (name: string) => string }} args
=======
 * @param {{ realized: { realizedPrice: ActivePricePattern, investorPrice: ActivePricePattern } }} tree
 * @param {(metric: string) => string} title
 * @returns {PartialChartOption}
 */
function createCompareChart(tree, title) {
  return {
    name: "Compare",
    title: title("Prices"),
    top: [
      price({ metric: tree.realized.realizedPrice, name: "Realized", color: colors.realized }),
      price({ metric: tree.realized.investorPrice, name: "Investor", color: colors.investor }),
    ],
  };
}

/**
 * Create prices section for cohorts with full ActivePriceRatioPattern
 * (CohortAll, CohortFull, CohortWithPercentiles)
 * @param {{ cohort: CohortAll | CohortFull | CohortWithPercentiles, title: (metric: string) => string }} args
>>>>>>> 69eb58f7 (chore: update website from upstream v0.1.5)
 * @returns {PartialOptionsGroup}
 */
export function createPricesSectionFull({ cohort, title }) {
  const { tree, color } = cohort;
  return {
    name: "Prices",
    tree: [
<<<<<<< HEAD
      {
        name: "Compare",
        title: title("Realized Prices"),
        top: [
          price({ series: tree.realized.price, name: "Realized", color: colors.realized }),
          price({ series: tree.realized.investor.price, name: "Investor", color: colors.investor }),
        ],
      },
      {
        name: "Realized",
        tree: createPriceRatioCharts({
          context: cohort.title,
          legend: "Realized",
          pricePattern: tree.realized.price,
          ratio: tree.realized.price,
=======
      createCompareChart(tree, title),
      {
        name: "Realized",
        tree: createPriceRatioCharts({
          context: cohort.name,
          legend: "Realized",
          pricePattern: tree.realized.realizedPrice,
          ratio: tree.realized.realizedPriceExtra,
>>>>>>> 69eb58f7 (chore: update website from upstream v0.1.5)
          color,
          priceTitle: title("Realized Price"),
          titlePrefix: "Realized Price",
        }),
      },
      {
        name: "Investor",
<<<<<<< HEAD
        tree: priceRatioPercentilesTree({
          pattern: tree.realized.investor.price,
          title: title("Investor Price"),
          ratioTitle: title("Investor Price Ratio"),
          legend: "Investor",
          color,
=======
        tree: createPriceRatioCharts({
          context: cohort.name,
          legend: "Investor",
          pricePattern: tree.realized.investorPrice,
          ratio: tree.realized.investorPriceExtra,
          color,
          priceTitle: title("Investor Price"),
          titlePrefix: "Investor Price",
>>>>>>> 69eb58f7 (chore: update website from upstream v0.1.5)
        }),
      },
    ],
  };
}

/**
 * Create prices section for cohorts with basic ratio patterns only
<<<<<<< HEAD
 * (CohortWithAdjusted, CohortBasic, CohortAddr, CohortWithoutRelative)
 * @param {{ cohort: CohortWithAdjusted | CohortBasic | CohortAddr | CohortWithoutRelative | CohortAgeRange, title: (name: string) => string }} args
=======
 * (CohortWithAdjusted, CohortBasic, CohortAddress, CohortWithoutRelative)
 * @param {{ cohort: CohortWithAdjusted | CohortBasic | CohortAddress | CohortWithoutRelative, title: (metric: string) => string }} args
>>>>>>> 69eb58f7 (chore: update website from upstream v0.1.5)
 * @returns {PartialOptionsGroup}
 */
export function createPricesSectionBasic({ cohort, title }) {
  const { tree, color } = cohort;
  return {
    name: "Prices",
    tree: [
<<<<<<< HEAD
=======
      createCompareChart(tree, title),
>>>>>>> 69eb58f7 (chore: update website from upstream v0.1.5)
      {
        name: "Realized",
        tree: [
          {
            name: "Price",
            title: title("Realized Price"),
<<<<<<< HEAD
            top: [price({ series: tree.realized.price, name: "Realized", color })],
=======
            top: [
              price({
                metric: tree.realized.realizedPrice,
                name: "Realized",
                color,
              }),
            ],
>>>>>>> 69eb58f7 (chore: update website from upstream v0.1.5)
          },
          {
            name: "Ratio",
            title: title("Realized Price Ratio"),
            bottom: [
              baseline({
<<<<<<< HEAD
                series: tree.realized.price.ratio,
=======
                metric: tree.realized.realizedPriceExtra.ratio,
                name: "Ratio",
                unit: Unit.ratio,
                base: 1,
              }),
            ],
          },
        ],
      },
      {
        name: "Investor",
        tree: [
          {
            name: "Price",
            title: title("Investor Price"),
            top: [
              price({
                metric: tree.realized.investorPrice,
                name: "Investor",
                color,
              }),
            ],
          },
          {
            name: "Ratio",
            title: title("Investor Price Ratio"),
            bottom: [
              baseline({
                metric: tree.realized.investorPriceExtra.ratio,
>>>>>>> 69eb58f7 (chore: update website from upstream v0.1.5)
                name: "Ratio",
                unit: Unit.ratio,
                base: 1,
              }),
            ],
          },
        ],
      },
    ],
  };
}

/**
 * Create prices section for grouped cohorts
<<<<<<< HEAD
 * @param {{ list: readonly CohortObject[], all: CohortAll, title: (name: string) => string }} args
 * @returns {PartialOptionsGroup}
 */
/**
 * @param {readonly CohortObject[]} list
 * @param {CohortAll} all
 * @param {(name: string) => string} title
 * @returns {PartialOptionsTree}
 */
function groupedRealizedPriceItems(list, all, title) {
  return [
    {
      name: "Realized",
      tree: [
        {
          name: "Price",
          title: title("Realized Price"),
          top: mapCohortsWithAll(list, all, ({ name, color, tree }) =>
            price({ series: tree.realized.price, name, color }),
          ),
        },
        {
          name: "Ratio",
          title: title("Realized Price Ratio"),
          bottom: mapCohortsWithAll(list, all, ({ name, color, tree }) =>
            baseline({ series: tree.realized.mvrv, name, color, unit: Unit.ratio, base: 1 }),
          ),
        },
      ],
    },
  ];
}

/** @param {{ list: readonly CohortObject[], all: CohortAll, title: (name: string) => string }} args */
export function createGroupedPricesSection({ list, all, title }) {
  return {
    name: "Prices",
    tree: groupedRealizedPriceItems(list, all, title),
  };
}

/** @param {{ list: readonly (CohortAll | CohortFull | CohortLongTerm)[], all: CohortAll, title: (name: string) => string }} args */
export function createGroupedPricesSectionFull({ list, all, title }) {
  return {
    name: "Prices",
    tree: [
      ...groupedRealizedPriceItems(list, all, title),
=======
 * @param {{ list: readonly CohortObject[], all: CohortAll, title: (metric: string) => string }} args
 * @returns {PartialOptionsGroup}
 */
export function createGroupedPricesSection({ list, all, title }) {
  return {
    name: "Prices",
    tree: [
      {
        name: "Realized",
        tree: [
          {
            name: "Price",
            title: title("Realized Price"),
            top: mapCohortsWithAll(list, all, ({ name, color, tree }) =>
              price({ metric: tree.realized.realizedPrice, name, color }),
            ),
          },
          {
            name: "Ratio",
            title: title("Realized Price Ratio"),
            bottom: mapCohortsWithAll(list, all, ({ name, color, tree }) =>
              baseline({
                metric: tree.realized.realizedPriceExtra.ratio,
                name,
                color,
                unit: Unit.ratio,
                base: 1,
              }),
            ),
          },
        ],
      },
>>>>>>> 69eb58f7 (chore: update website from upstream v0.1.5)
      {
        name: "Investor",
        tree: [
          {
            name: "Price",
            title: title("Investor Price"),
            top: mapCohortsWithAll(list, all, ({ name, color, tree }) =>
<<<<<<< HEAD
              price({ series: tree.realized.investor.price, name, color }),
=======
              price({ metric: tree.realized.investorPrice, name, color }),
>>>>>>> 69eb58f7 (chore: update website from upstream v0.1.5)
            ),
          },
          {
            name: "Ratio",
            title: title("Investor Price Ratio"),
            bottom: mapCohortsWithAll(list, all, ({ name, color, tree }) =>
<<<<<<< HEAD
              baseline({ series: tree.realized.investor.price.ratio, name, color, unit: Unit.ratio, base: 1 }),
=======
              baseline({
                metric: tree.realized.investorPriceExtra.ratio,
                name,
                color,
                unit: Unit.ratio,
                base: 1,
              }),
>>>>>>> 69eb58f7 (chore: update website from upstream v0.1.5)
            ),
          },
        ],
      },
    ],
  };
}
