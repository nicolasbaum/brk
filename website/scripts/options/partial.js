/** Partial options - Main entry point */

import {
  buildCohortData,
  createCohortFolderAll,
  createCohortFolderFull,
  createCohortFolderWithAdjusted,
  createCohortFolderLongTerm,
<<<<<<< HEAD
  createCohortFolderAgeRangeWithMatured,
  createCohortFolderBasicWithMarketCap,
=======
  createCohortFolderAgeRange,
  createCohortFolderMinAge,
  createCohortFolderBasicWithMarketCap,
  createCohortFolderBasicWithoutMarketCap,
>>>>>>> 69eb58f7 (chore: update website from upstream v0.1.5)
  createCohortFolderWithoutRelative,
  createCohortFolderAddress,
  createAddressCohortFolder,
  createGroupedCohortFolderWithAdjusted,
  createGroupedCohortFolderWithNupl,
<<<<<<< HEAD
  createGroupedCohortFolderAgeRangeWithMatured,
  createGroupedCohortFolderBasicWithMarketCap,
  createGroupedCohortFolderAddress,
  createGroupedAddressCohortFolder,
  createUtxoProfitabilitySection,
=======
  createGroupedCohortFolderAgeRange,
  createGroupedCohortFolderMinAge,
  createGroupedCohortFolderBasicWithMarketCap,
  createGroupedCohortFolderBasicWithoutMarketCap,
  createGroupedCohortFolderAddress,
  createGroupedAddressCohortFolder,
>>>>>>> 69eb58f7 (chore: update website from upstream v0.1.5)
} from "./distribution/index.js";
import { createMarketSection } from "./market.js";
import { createNetworkSection } from "./network.js";
import { createMiningSection } from "./mining.js";
import { createCointimeSection } from "./cointime.js";
import { createInvestingSection } from "./investing.js";

// Re-export types for external consumers
export * from "./types.js";

/**
 * Create partial options tree
 * @returns {PartialOptionsTree}
 */
export function createPartialOptions() {
  // Build cohort data
  const {
    cohortAll,
    termShort,
    termLong,
    underAge,
    overAge,
    ageRange,
    epoch,
    utxosOverAmount,
    addressesOverAmount,
    utxosUnderAmount,
    addressesUnderAmount,
    utxosAmountRange,
    addressesAmountRange,
    typeAddressable,
    typeOther,
<<<<<<< HEAD
    class: class_,
    profitabilityRange,
    profitabilityProfit,
    profitabilityLoss,
  } = buildCohortData();

  return [
    ...(location.hostname === "localhost" || location.hostname === "127.0.0.1"
      ? [
          /** @type {any} */ ({
            name: "Explorer",
            kind: "explorer",
            title: "Explorer",
          }),
        ]
      : []),
    {
      name: "Charts",
      tree: [
        createMarketSection(),

        createNetworkSection(),

=======
    year,
  } = buildCohortData();

  return [
    // Charts section
    {
      name: "Charts",
      tree: [
        // Market section
        createMarketSection(),

        // Network section (on-chain activity)
        createNetworkSection(),

        // Mining section (security & economics)
>>>>>>> 69eb58f7 (chore: update website from upstream v0.1.5)
        createMiningSection(),

        {
          name: "Distribution",
          tree: [
<<<<<<< HEAD
            createCohortFolderAll({ ...cohortAll, name: "Overview" }),

=======
            // Overview - All UTXOs
            createCohortFolderAll({ ...cohortAll, name: "Overview" }),

            // STH vs LTH - Direct comparison
>>>>>>> 69eb58f7 (chore: update website from upstream v0.1.5)
            createGroupedCohortFolderWithNupl({
              name: "STH vs LTH",
              title: "STH vs LTH",
              list: [termShort, termLong],
              all: cohortAll,
            }),

<<<<<<< HEAD
            createCohortFolderFull(termShort),

            createCohortFolderLongTerm(termLong),

            {
              name: "UTXO Age",
=======
            // STH - Short term holder cohort
            createCohortFolderFull(termShort),

            // LTH - Long term holder cohort
            createCohortFolderLongTerm(termLong),

            // Ages cohorts
            {
              name: "UTXO Ages",
>>>>>>> 69eb58f7 (chore: update website from upstream v0.1.5)
              tree: [
                {
                  name: "Younger Than",
                  tree: [
                    createGroupedCohortFolderWithAdjusted({
                      name: "Compare",
<<<<<<< HEAD
                      title: "Under Age",
                      list: underAge,
                      all: cohortAll,
                    }),
                    ...underAge.map(createCohortFolderWithAdjusted),
=======
                      title: "Max Age",
                      list: upToDate,
                      all: cohortAll,
                    }),
                    ...upToDate.map(createCohortFolderWithAdjusted),
>>>>>>> 69eb58f7 (chore: update website from upstream v0.1.5)
                  ],
                },
                {
                  name: "Older Than",
                  tree: [
<<<<<<< HEAD
                    createGroupedCohortFolderWithAdjusted({
                      name: "Compare",
                      title: "Over Age",
                      list: overAge,
                      all: cohortAll,
                    }),
                    ...overAge.map(createCohortFolderWithAdjusted),
=======
                    createGroupedCohortFolderMinAge({
                      name: "Compare",
                      title: "Min Age",
                      list: fromDate,
                      all: cohortAll,
                    }),
                    ...fromDate.map(createCohortFolderMinAge),
>>>>>>> 69eb58f7 (chore: update website from upstream v0.1.5)
                  ],
                },
                {
                  name: "Range",
                  tree: [
<<<<<<< HEAD
                    createGroupedCohortFolderAgeRangeWithMatured({
                      name: "Compare",
                      title: "Age Ranges",
                      list: ageRange,
                      all: cohortAll,
                    }),
                    ...ageRange.map(createCohortFolderAgeRangeWithMatured),
=======
                    createGroupedCohortFolderAgeRange({
                      name: "Compare",
                      title: "Age Ranges",
                      list: dateRange,
                      all: cohortAll,
                    }),
                    ...dateRange.map(createCohortFolderAgeRange),
>>>>>>> 69eb58f7 (chore: update website from upstream v0.1.5)
                  ],
                },
              ],
            },

            {
<<<<<<< HEAD
              name: "UTXO Size",
=======
              name: "UTXO Sizes",
>>>>>>> 69eb58f7 (chore: update website from upstream v0.1.5)
              tree: [
                {
                  name: "Less Than",
                  tree: [
                    createGroupedCohortFolderBasicWithMarketCap({
                      name: "Compare",
<<<<<<< HEAD
                      title: "Under Amount",
                      list: utxosUnderAmount,
                      all: cohortAll,
                    }),
                    ...utxosUnderAmount.map(
                      createCohortFolderBasicWithMarketCap,
                    ),
=======
                      title: "Max Size",
                      list: utxosUnderAmount,
                      all: cohortAll,
                    }),
                    ...utxosUnderAmount.map(createCohortFolderBasicWithMarketCap),
>>>>>>> 69eb58f7 (chore: update website from upstream v0.1.5)
                  ],
                },
                {
                  name: "More Than",
                  tree: [
                    createGroupedCohortFolderBasicWithMarketCap({
                      name: "Compare",
<<<<<<< HEAD
                      title: "Over Amount",
                      list: utxosOverAmount,
                      all: cohortAll,
                    }),
                    ...utxosOverAmount.map(
                      createCohortFolderBasicWithMarketCap,
                    ),
=======
                      title: "Min Size",
                      list: utxosAboveAmount,
                      all: cohortAll,
                    }),
                    ...utxosAboveAmount.map(createCohortFolderBasicWithMarketCap),
>>>>>>> 69eb58f7 (chore: update website from upstream v0.1.5)
                  ],
                },
                {
                  name: "Range",
                  tree: [
<<<<<<< HEAD
                    createGroupedCohortFolderBasicWithMarketCap({
                      name: "Compare",
                      title: "Amount Ranges",
                      list: utxosAmountRange,
                      all: cohortAll,
                    }),
                    ...utxosAmountRange.map(
                      createCohortFolderBasicWithMarketCap,
                    ),
=======
                    createGroupedCohortFolderBasicWithoutMarketCap({
                      name: "Compare",
                      title: "Size Ranges",
                      list: utxosAmountRanges,
                      all: cohortAll,
                    }),
                    ...utxosAmountRanges.map(createCohortFolderBasicWithoutMarketCap),
>>>>>>> 69eb58f7 (chore: update website from upstream v0.1.5)
                  ],
                },
              ],
            },

            createUtxoProfitabilitySection({
              range: profitabilityRange,
              profit: profitabilityProfit,
              loss: profitabilityLoss,
            }),

            {
<<<<<<< HEAD
              name: "Address Balance",
=======
              name: "Address Balances",
>>>>>>> 69eb58f7 (chore: update website from upstream v0.1.5)
              tree: [
                {
                  name: "Less Than",
                  tree: [
                    createGroupedAddressCohortFolder({
                      name: "Compare",
<<<<<<< HEAD
                      title: "Under Balance",
=======
                      title: "Max Balance",
>>>>>>> 69eb58f7 (chore: update website from upstream v0.1.5)
                      list: addressesUnderAmount,
                      all: cohortAll,
                    }),
                    ...addressesUnderAmount.map(createAddressCohortFolder),
                  ],
                },
                {
                  name: "More Than",
                  tree: [
                    createGroupedAddressCohortFolder({
                      name: "Compare",
<<<<<<< HEAD
                      title: "Over Balance",
                      list: addressesOverAmount,
                      all: cohortAll,
                    }),
                    ...addressesOverAmount.map(createAddressCohortFolder),
=======
                      title: "Min Balance",
                      list: addressesAboveAmount,
                      all: cohortAll,
                    }),
                    ...addressesAboveAmount.map(createAddressCohortFolder),
>>>>>>> 69eb58f7 (chore: update website from upstream v0.1.5)
                  ],
                },
                {
                  name: "Range",
                  tree: [
                    createGroupedAddressCohortFolder({
                      name: "Compare",
                      title: "Balance Ranges",
<<<<<<< HEAD
                      list: addressesAmountRange,
                      all: cohortAll,
                    }),
                    ...addressesAmountRange.map(createAddressCohortFolder),
=======
                      list: addressesAmountRanges,
                      all: cohortAll,
                    }),
                    ...addressesAmountRanges.map(createAddressCohortFolder),
>>>>>>> 69eb58f7 (chore: update website from upstream v0.1.5)
                  ],
                },
              ],
            },

            {
              name: "Script Type",
              tree: [
                createGroupedCohortFolderAddress({
                  name: "Compare",
                  title: "Script Types",
                  list: typeAddressable,
                  all: cohortAll,
                }),
                ...typeAddressable.map(createCohortFolderAddress),
                ...typeOther.map(createCohortFolderWithoutRelative),
              ],
            },

<<<<<<< HEAD
=======
            // Epochs
>>>>>>> 69eb58f7 (chore: update website from upstream v0.1.5)
            {
              name: "Epoch",
              tree: [
<<<<<<< HEAD
                createGroupedCohortFolderWithAdjusted({
=======
                createGroupedCohortFolderBasicWithoutMarketCap({
>>>>>>> 69eb58f7 (chore: update website from upstream v0.1.5)
                  name: "Compare",
                  title: "Epochs",
                  list: epoch,
                  all: cohortAll,
                }),
<<<<<<< HEAD
                ...epoch.map(createCohortFolderWithAdjusted),
              ],
            },

=======
                ...epoch.map(createCohortFolderBasicWithoutMarketCap),
              ],
            },

            // Years
>>>>>>> 69eb58f7 (chore: update website from upstream v0.1.5)
            {
              name: "Class",
              tree: [
<<<<<<< HEAD
                createGroupedCohortFolderWithAdjusted({
                  name: "Compare",
                  title: "Class",
                  list: class_,
                  all: cohortAll,
                }),
                ...class_.map(createCohortFolderWithAdjusted),
=======
                createGroupedCohortFolderBasicWithoutMarketCap({
                  name: "Compare",
                  title: "Years",
                  list: year,
                  all: cohortAll,
                }),
                ...year.map(createCohortFolderBasicWithoutMarketCap),
>>>>>>> 69eb58f7 (chore: update website from upstream v0.1.5)
              ],
            },
          ],
        },

        createInvestingSection(),

        {
          name: "Frameworks",
          tree: [createCointimeSection()],
        },

        // Investing section
        createInvestingSection(),
      ],
    },

<<<<<<< HEAD
=======
    // API documentation
>>>>>>> 69eb58f7 (chore: update website from upstream v0.1.5)
    {
      name: "API",
      url: () => "/api",
      title: "API documentation",
    },

    {
      name: "Source",
      url: () => "https://bitcoinresearchkit.org",
      title: "Bitcoin Research Kit",
    },
  ];
}
