/** Partial options - Main entry point */

import { createContext } from "./context.js";
import {
  buildCohortData,
  createCohortFolderAll,
  createCohortFolderFull,
  createCohortFolderWithAdjusted,
<<<<<<< HEAD
  createCohortFolderLongTerm,
<<<<<<< HEAD
  createCohortFolderAgeRangeWithMatured,
  createCohortFolderBasicWithMarketCap,
=======
=======
  createCohortFolderWithNupl,
>>>>>>> a29452a8 (Revert "chore: update website from upstream v0.1.5")
  createCohortFolderAgeRange,
  createCohortFolderBasicWithMarketCap,
  createCohortFolderBasicWithoutMarketCap,
<<<<<<< HEAD
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
=======
  createCohortFolderAddress,
  createAddressCohortFolder,
>>>>>>> a29452a8 (Revert "chore: update website from upstream v0.1.5")
} from "./distribution/index.js";
import { createMarketSection } from "./market/index.js";
import { createMacroEconomySection } from "./macro_economy.js";
import { createChainSection } from "./chain.js";
import { createCointimeSection } from "./cointime.js";
import { colors } from "../chart/colors.js";

// Re-export types for external consumers
export * from "./types.js";
export * from "./context.js";

/**
 * Create partial options tree
 * @param {Object} args
 * @param {BrkClient} args.brk
 * @returns {PartialOptionsTree}
 */
export function createPartialOptions({ brk }) {
  // Create context with all helpers
  const ctx = createContext({ brk });

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
  } = buildCohortData(colors, brk);

  // Helpers to map cohorts by capability type
  /** @param {CohortWithAdjusted} cohort */
  const mapWithAdjusted = (cohort) =>
    createCohortFolderWithAdjusted(ctx, cohort);
  /** @param {CohortAgeRange} cohort */
  const mapAgeRange = (cohort) => createCohortFolderAgeRange(ctx, cohort);
  /** @param {CohortBasicWithMarketCap} cohort */
  const mapBasicWithMarketCap = (cohort) =>
    createCohortFolderBasicWithMarketCap(ctx, cohort);
  /** @param {CohortBasicWithoutMarketCap} cohort */
  const mapBasicWithoutMarketCap = (cohort) =>
    createCohortFolderBasicWithoutMarketCap(ctx, cohort);
  /** @param {CohortAddress} cohort */
  const mapAddress = (cohort) => createCohortFolderAddress(ctx, cohort);
  /** @param {AddressCohortObject} cohort */
  const mapAddressCohorts = (cohort) => createAddressCohortFolder(ctx, cohort);

  return [
    // Debug explorer (disabled)
    // ...(localhost
    //   ? [
    //       {
    //         kind: /** @type {const} */ ("explorer"),
    //         name: "Explorer",
    //         title: "Debug explorer",
    //       },
    //     ]
    //   : []),

    // Charts section
    {
      name: "Charts",
      tree: [
        // Market section
        createMarketSection(ctx),

        // Macro Economy section (FRED data)
        createMacroEconomySection(ctx),

<<<<<<< HEAD
        // Mining section (security & economics)
>>>>>>> 69eb58f7 (chore: update website from upstream v0.1.5)
        createMiningSection(),
=======
        // Chain section
        createChainSection(ctx),
>>>>>>> a29452a8 (Revert "chore: update website from upstream v0.1.5")

        {
          name: "Distribution",
          tree: [
<<<<<<< HEAD
<<<<<<< HEAD
            createCohortFolderAll({ ...cohortAll, name: "Overview" }),

=======
            // Overview - All UTXOs
            createCohortFolderAll({ ...cohortAll, name: "Overview" }),

            // STH vs LTH - Direct comparison
>>>>>>> 69eb58f7 (chore: update website from upstream v0.1.5)
            createGroupedCohortFolderWithNupl({
=======
            // Overview - All UTXOs (adjustedSopr + percentiles but no RelToMarketCap)
            createCohortFolderAll(ctx, { ...cohortAll, name: "Overview" }),

            // STH - Short term holder cohort (Full capability)
            createCohortFolderFull(ctx, termShort),

            // LTH - Long term holder cohort (nupl)
            createCohortFolderWithNupl(ctx, termLong),

            // STH vs LTH - Direct comparison
            createCohortFolderWithNupl(ctx, {
>>>>>>> a29452a8 (Revert "chore: update website from upstream v0.1.5")
              name: "STH vs LTH",
              title: "Term",
              list: [termShort, termLong],
            }),

<<<<<<< HEAD
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
=======
            // Ages cohorts
            {
              name: "Ages",
>>>>>>> a29452a8 (Revert "chore: update website from upstream v0.1.5")
              tree: [
                {
                  name: "Younger Than",
                  tree: [
                    createCohortFolderWithAdjusted(ctx, {
                      name: "Compare",
<<<<<<< HEAD
<<<<<<< HEAD
                      title: "Under Age",
                      list: underAge,
                      all: cohortAll,
                    }),
                    ...underAge.map(createCohortFolderWithAdjusted),
=======
                      title: "Max Age",
=======
                      title: "Age Younger Than",
>>>>>>> a29452a8 (Revert "chore: update website from upstream v0.1.5")
                      list: upToDate,
                    }),
<<<<<<< HEAD
                    ...upToDate.map(createCohortFolderWithAdjusted),
>>>>>>> 69eb58f7 (chore: update website from upstream v0.1.5)
=======
                    ...upToDate.map(mapWithAdjusted),
>>>>>>> a29452a8 (Revert "chore: update website from upstream v0.1.5")
                  ],
                },
                {
                  name: "Older Than",
                  tree: [
<<<<<<< HEAD
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
=======
                    createCohortFolderBasicWithMarketCap(ctx, {
>>>>>>> a29452a8 (Revert "chore: update website from upstream v0.1.5")
                      name: "Compare",
                      title: "Age Older Than",
                      list: fromDate,
                    }),
<<<<<<< HEAD
                    ...fromDate.map(createCohortFolderMinAge),
>>>>>>> 69eb58f7 (chore: update website from upstream v0.1.5)
=======
                    ...fromDate.map(mapBasicWithMarketCap),
>>>>>>> a29452a8 (Revert "chore: update website from upstream v0.1.5")
                  ],
                },
                {
                  name: "Range",
                  tree: [
<<<<<<< HEAD
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
=======
                    createCohortFolderAgeRange(ctx, {
>>>>>>> a29452a8 (Revert "chore: update website from upstream v0.1.5")
                      name: "Compare",
                      title: "Age Range",
                      list: dateRange,
                    }),
<<<<<<< HEAD
                    ...dateRange.map(createCohortFolderAgeRange),
>>>>>>> 69eb58f7 (chore: update website from upstream v0.1.5)
=======
                    ...dateRange.map(mapAgeRange),
>>>>>>> a29452a8 (Revert "chore: update website from upstream v0.1.5")
                  ],
                },
              ],
            },

            {
<<<<<<< HEAD
<<<<<<< HEAD
              name: "UTXO Size",
=======
              name: "UTXO Sizes",
>>>>>>> 69eb58f7 (chore: update website from upstream v0.1.5)
=======
              name: "Sizes",
>>>>>>> a29452a8 (Revert "chore: update website from upstream v0.1.5")
              tree: [
                {
                  name: "Less Than",
                  tree: [
                    createCohortFolderBasicWithMarketCap(ctx, {
                      name: "Compare",
<<<<<<< HEAD
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
=======
                      title: "Size Less Than",
>>>>>>> a29452a8 (Revert "chore: update website from upstream v0.1.5")
                      list: utxosUnderAmount,
                    }),
<<<<<<< HEAD
                    ...utxosUnderAmount.map(createCohortFolderBasicWithMarketCap),
>>>>>>> 69eb58f7 (chore: update website from upstream v0.1.5)
=======
                    ...utxosUnderAmount.map(mapBasicWithMarketCap),
>>>>>>> a29452a8 (Revert "chore: update website from upstream v0.1.5")
                  ],
                },
                {
                  name: "More Than",
                  tree: [
                    createCohortFolderBasicWithMarketCap(ctx, {
                      name: "Compare",
<<<<<<< HEAD
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
=======
                      title: "Size More Than",
>>>>>>> a29452a8 (Revert "chore: update website from upstream v0.1.5")
                      list: utxosAboveAmount,
                    }),
<<<<<<< HEAD
                    ...utxosAboveAmount.map(createCohortFolderBasicWithMarketCap),
>>>>>>> 69eb58f7 (chore: update website from upstream v0.1.5)
=======
                    ...utxosAboveAmount.map(mapBasicWithMarketCap),
>>>>>>> a29452a8 (Revert "chore: update website from upstream v0.1.5")
                  ],
                },
                {
                  name: "Range",
                  tree: [
<<<<<<< HEAD
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
=======
                    createCohortFolderBasicWithoutMarketCap(ctx, {
>>>>>>> a29452a8 (Revert "chore: update website from upstream v0.1.5")
                      name: "Compare",
                      title: "Size Range",
                      list: utxosAmountRanges,
                    }),
<<<<<<< HEAD
                    ...utxosAmountRanges.map(createCohortFolderBasicWithoutMarketCap),
>>>>>>> 69eb58f7 (chore: update website from upstream v0.1.5)
=======
                    ...utxosAmountRanges.map(mapBasicWithoutMarketCap),
>>>>>>> a29452a8 (Revert "chore: update website from upstream v0.1.5")
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
<<<<<<< HEAD
              name: "Address Balance",
=======
              name: "Address Balances",
>>>>>>> 69eb58f7 (chore: update website from upstream v0.1.5)
=======
              name: "Balances",
>>>>>>> a29452a8 (Revert "chore: update website from upstream v0.1.5")
              tree: [
                {
                  name: "Less Than",
                  tree: [
                    createAddressCohortFolder(ctx, {
                      name: "Compare",
<<<<<<< HEAD
<<<<<<< HEAD
                      title: "Under Balance",
=======
                      title: "Max Balance",
>>>>>>> 69eb58f7 (chore: update website from upstream v0.1.5)
=======
                      title: "Balance Less Than",
>>>>>>> a29452a8 (Revert "chore: update website from upstream v0.1.5")
                      list: addressesUnderAmount,
                    }),
                    ...addressesUnderAmount.map(mapAddressCohorts),
                  ],
                },
                {
                  name: "More Than",
                  tree: [
                    createAddressCohortFolder(ctx, {
                      name: "Compare",
<<<<<<< HEAD
<<<<<<< HEAD
                      title: "Over Balance",
                      list: addressesOverAmount,
                      all: cohortAll,
                    }),
                    ...addressesOverAmount.map(createAddressCohortFolder),
=======
                      title: "Min Balance",
=======
                      title: "Balance More Than",
>>>>>>> a29452a8 (Revert "chore: update website from upstream v0.1.5")
                      list: addressesAboveAmount,
                    }),
<<<<<<< HEAD
                    ...addressesAboveAmount.map(createAddressCohortFolder),
>>>>>>> 69eb58f7 (chore: update website from upstream v0.1.5)
=======
                    ...addressesAboveAmount.map(mapAddressCohorts),
>>>>>>> a29452a8 (Revert "chore: update website from upstream v0.1.5")
                  ],
                },
                {
                  name: "Range",
                  tree: [
                    createAddressCohortFolder(ctx, {
                      name: "Compare",
<<<<<<< HEAD
                      title: "Balance Ranges",
<<<<<<< HEAD
                      list: addressesAmountRange,
                      all: cohortAll,
                    }),
                    ...addressesAmountRange.map(createAddressCohortFolder),
=======
=======
                      title: "Balance Range",
>>>>>>> a29452a8 (Revert "chore: update website from upstream v0.1.5")
                      list: addressesAmountRanges,
                    }),
<<<<<<< HEAD
                    ...addressesAmountRanges.map(createAddressCohortFolder),
>>>>>>> 69eb58f7 (chore: update website from upstream v0.1.5)
=======
                    ...addressesAmountRanges.map(mapAddressCohorts),
>>>>>>> a29452a8 (Revert "chore: update website from upstream v0.1.5")
                  ],
                },
              ],
            },

            {
              name: "Script Type",
              tree: [
                createCohortFolderAddress(ctx, {
                  name: "Compare",
                  title: "Script Type",
                  list: typeAddressable,
                }),
                ...typeAddressable.map(mapAddress),
                ...typeOther.map(mapBasicWithoutMarketCap),
              ],
            },

<<<<<<< HEAD
<<<<<<< HEAD
=======
            // Epochs
>>>>>>> 69eb58f7 (chore: update website from upstream v0.1.5)
=======
            // Epochs - CohortBasicWithoutMarketCap (no RelToMarketCap)
>>>>>>> a29452a8 (Revert "chore: update website from upstream v0.1.5")
            {
              name: "Epoch",
              tree: [
<<<<<<< HEAD
<<<<<<< HEAD
                createGroupedCohortFolderWithAdjusted({
=======
                createGroupedCohortFolderBasicWithoutMarketCap({
>>>>>>> 69eb58f7 (chore: update website from upstream v0.1.5)
=======
                createCohortFolderBasicWithoutMarketCap(ctx, {
>>>>>>> a29452a8 (Revert "chore: update website from upstream v0.1.5")
                  name: "Compare",
                  title: "Epoch",
                  list: epoch,
                }),
<<<<<<< HEAD
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
=======
                ...epoch.map(mapBasicWithoutMarketCap),
              ],
            },

            // Years - CohortBasicWithoutMarketCap (no RelToMarketCap)
>>>>>>> a29452a8 (Revert "chore: update website from upstream v0.1.5")
            {
              name: "Class",
              tree: [
<<<<<<< HEAD
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
=======
                createCohortFolderBasicWithoutMarketCap(ctx, {
>>>>>>> a29452a8 (Revert "chore: update website from upstream v0.1.5")
                  name: "Compare",
                  title: "Year",
                  list: year,
                }),
<<<<<<< HEAD
                ...year.map(createCohortFolderBasicWithoutMarketCap),
>>>>>>> 69eb58f7 (chore: update website from upstream v0.1.5)
=======
                ...year.map(mapBasicWithoutMarketCap),
>>>>>>> a29452a8 (Revert "chore: update website from upstream v0.1.5")
              ],
            },
          ],
        },

        createInvestingSection(),

        {
          name: "Frameworks",
          tree: [
            createCointimeSection(ctx),
          ],
        },
      ],
    },

<<<<<<< HEAD
<<<<<<< HEAD
=======
=======
    // Table section (disabled)
    // {
    //   kind: /** @type {const} */ ("table"),
    //   title: "Table",
    //   name: "Table",
    // },

    // Simulations section (disabled)
    // {
    //   name: "Simulations",
    //   tree: [
    //     {
    //       kind: /** @type {const} */ ("simulation"),
    //       name: "Save In Bitcoin",
    //       title: "Save In Bitcoin",
    //     },
    //   ],
    // },

>>>>>>> a29452a8 (Revert "chore: update website from upstream v0.1.5")
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
