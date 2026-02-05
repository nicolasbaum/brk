<<<<<<< HEAD
=======
/** Build cohort data arrays from brk.metrics */

<<<<<<< HEAD
>>>>>>> 69eb58f7 (chore: update website from upstream v0.1.5)
import { colors } from "../../utils/colors.js";
import { entries } from "../../utils/array.js";
import { brk } from "../../client.js";
=======
import {
  termColors,
  maxAgeColors,
  minAgeColors,
  ageRangeColors,
  epochColors,
  geAmountColors,
  ltAmountColors,
  amountRangeColors,
  spendableTypeColors,
  yearColors,
} from "../colors/index.js";

/**
 * @template {Record<string, any>} T
 * @param {T} obj
 * @returns {[keyof T & string, T[keyof T & string]][]}
 */
const entries = (obj) =>
  /** @type {[keyof T & string, T[keyof T & string]][]} */ (
    Object.entries(obj)
  );
>>>>>>> a29452a8 (Revert "chore: update website from upstream v0.1.5")

/** @type {readonly AddressableType[]} */
const ADDRESSABLE_TYPES = [
  "p2pk65",
  "p2pk33",
  "p2pkh",
  "p2sh",
  "p2wpkh",
  "p2wsh",
  "p2tr",
  "p2a",
];

/** @type {(key: SpendableType) => key is AddressableType} */
const isAddressable = (key) =>
  /** @type {readonly string[]} */ (ADDRESSABLE_TYPES).includes(key);

<<<<<<< HEAD
export function buildCohortData() {
  const utxoCohorts = brk.series.cohorts.utxo;
  const addressCohorts = brk.series.cohorts.addr;
  const { addrs } = brk.series;
=======
/**
 * Build all cohort data from brk tree
 * @param {Colors} colors
 * @param {BrkClient} brk
 */
export function buildCohortData(colors, brk) {
  const utxoCohorts = brk.metrics.distribution.utxoCohorts;
  const addressCohorts = brk.metrics.distribution.addressCohorts;
  const { addrCount } = brk.metrics.distribution;
>>>>>>> 69eb58f7 (chore: update website from upstream v0.1.5)
  const {
    TERM_NAMES,
    EPOCH_NAMES,
    UNDER_AGE_NAMES,
    OVER_AGE_NAMES,
    AGE_RANGE_NAMES,
    OVER_AMOUNT_NAMES,
    UNDER_AMOUNT_NAMES,
    AMOUNT_RANGE_NAMES,
    SPENDABLE_TYPE_NAMES,
    CLASS_NAMES,
    PROFITABILITY_RANGE_NAMES,
    PROFIT_NAMES,
    LOSS_NAMES,
  } = brk;

  const cohortAll = {
    name: "",
    title: "",
    color: colors.orange,
    tree: utxoCohorts.all,
    addressCount: {
      base: addrs.funded.all,
      delta: addrs.delta.all,
    },
  };

  const shortNames = TERM_NAMES.short;
  const termShort = {
    name: shortNames.short,
    title: shortNames.long,
<<<<<<< HEAD
    color: colors.term.short,
<<<<<<< HEAD
    tree: utxoCohorts.sth,
=======
=======
    color: colors[termColors.short],
>>>>>>> a29452a8 (Revert "chore: update website from upstream v0.1.5")
    tree: utxoCohorts.term.short,
>>>>>>> 69eb58f7 (chore: update website from upstream v0.1.5)
  };

  const longNames = TERM_NAMES.long;
  const termLong = {
    name: longNames.short,
    title: longNames.long,
<<<<<<< HEAD
    color: colors.term.long,
<<<<<<< HEAD
    tree: utxoCohorts.lth,
=======
=======
    color: colors[termColors.long],
>>>>>>> a29452a8 (Revert "chore: update website from upstream v0.1.5")
    tree: utxoCohorts.term.long,
>>>>>>> 69eb58f7 (chore: update website from upstream v0.1.5)
  };

  // Under age cohorts
  const underAge = entries(UNDER_AGE_NAMES).map(([key, names], i, arr) => ({
    name: names.short,
    title: `UTXOs ${names.long}`,
    color: colors.at(i, arr.length),
    tree: utxoCohorts.underAge[key],
  }));

  // Over age cohorts
  const overAge = entries(OVER_AGE_NAMES).map(([key, names], i, arr) => ({
    name: names.short,
    title: `UTXOs ${names.long}`,
    color: colors.at(i, arr.length),
    tree: utxoCohorts.overAge[key],
  }));

  const ageRange = entries(AGE_RANGE_NAMES).map(([key, names], i, arr) => ({
    name: names.short,
    title: `UTXOs ${names.long}`,
    color: colors.at(i, arr.length),
    tree: utxoCohorts.ageRange[key],
    matured: utxoCohorts.matured[key],
  }));

  const epoch = entries(EPOCH_NAMES).map(([key, names], i, arr) => ({
    name: names.short,
    title: names.long,
    color: colors.at(i, arr.length),
    tree: utxoCohorts.epoch[key],
  }));

  const utxosOverAmount = entries(OVER_AMOUNT_NAMES).map(
    ([key, names], i, arr) => ({
      name: names.short,
      title: `UTXOs ${names.long}`,
<<<<<<< HEAD
<<<<<<< HEAD
      color: colors.at(i, arr.length),
      tree: utxoCohorts.overAmount[key],
    }),
  );

  const addressesOverAmount = entries(OVER_AMOUNT_NAMES).map(
    ([key, names], i, arr) => {
      const cohort = addressCohorts.overAmount[key];
      return {
        name: names.short,
        title: `Addresses ${names.long}`,
        color: colors.at(i, arr.length),
        tree: cohort,
        addressCount: cohort.addrCount,
=======
      color: colors.age[key],
=======
      color: colors[maxAgeColors[key]],
>>>>>>> a29452a8 (Revert "chore: update website from upstream v0.1.5")
      tree,
    };
  });

  // Min age cohorts (from X time)
  const fromDate = entries(utxoCohorts.minAge).map(([key, tree]) => {
    const names = MIN_AGE_NAMES[key];
    return {
      name: names.short,
      title: `UTXOs ${names.long}`,
      color: colors[minAgeColors[key]],
      tree,
    };
  });

  // Age range cohorts
  const dateRange = entries(utxoCohorts.ageRange).map(([key, tree]) => {
    const names = AGE_RANGE_NAMES[key];
    return {
      name: names.short,
      title: `UTXOs ${names.long}`,
      color: colors[ageRangeColors[key]],
      tree,
    };
  });

  // Epoch cohorts
  const epoch = entries(utxoCohorts.epoch).map(([key, tree]) => {
    const names = EPOCH_NAMES[key];
    return {
      name: names.short,
      title: names.long,
      color: colors[epochColors[key]],
      tree,
    };
  });

  // UTXOs above amount
  const utxosAboveAmount = entries(utxoCohorts.geAmount).map(([key, tree]) => {
    const names = GE_AMOUNT_NAMES[key];
    return {
      name: names.short,
      title: `UTXOs ${names.long}`,
      color: colors[geAmountColors[key]],
      tree,
    };
  });

  // Addresses above amount
  const addressesAboveAmount = entries(addressCohorts.geAmount).map(
    ([key, tree]) => {
      const names = GE_AMOUNT_NAMES[key];
      return {
        name: names.short,
        title: `Addresses ${names.long}`,
<<<<<<< HEAD
        color: colors.amount[key],
        tree: cohort,
        addrCount: {
          count: cohort.addrCount,
          _30dChange: cohort.addrCount30dChange,
        },
>>>>>>> 69eb58f7 (chore: update website from upstream v0.1.5)
=======
        color: colors[geAmountColors[key]],
        tree,
>>>>>>> a29452a8 (Revert "chore: update website from upstream v0.1.5")
      };
    },
  );

  const utxosUnderAmount = entries(UNDER_AMOUNT_NAMES).map(
    ([key, names], i, arr) => ({
      name: names.short,
      title: `UTXOs ${names.long}`,
<<<<<<< HEAD
<<<<<<< HEAD
      color: colors.at(i, arr.length),
      tree: utxoCohorts.underAmount[key],
    }),
  );

  const addressesUnderAmount = entries(UNDER_AMOUNT_NAMES).map(
    ([key, names], i, arr) => {
      const cohort = addressCohorts.underAmount[key];
      return {
        name: names.short,
        title: `Addresses ${names.long}`,
        color: colors.at(i, arr.length),
        tree: cohort,
        addressCount: cohort.addrCount,
=======
      color: colors.amount[key],
=======
      color: colors[ltAmountColors[key]],
>>>>>>> a29452a8 (Revert "chore: update website from upstream v0.1.5")
      tree,
    };
  });

  // Addresses under amount
  const addressesUnderAmount = entries(addressCohorts.ltAmount).map(
    ([key, tree]) => {
      const names = LT_AMOUNT_NAMES[key];
      return {
        name: names.short,
        title: `Addresses ${names.long}`,
<<<<<<< HEAD
        color: colors.amount[key],
        tree: cohort,
        addrCount: {
          count: cohort.addrCount,
          _30dChange: cohort.addrCount30dChange,
        },
>>>>>>> 69eb58f7 (chore: update website from upstream v0.1.5)
=======
        color: colors[ltAmountColors[key]],
        tree,
>>>>>>> a29452a8 (Revert "chore: update website from upstream v0.1.5")
      };
    },
  );

<<<<<<< HEAD
  const utxosAmountRange = entries(AMOUNT_RANGE_NAMES).map(
    ([key, names], i, arr) => ({
      name: names.short,
      title: `UTXOs ${names.long}`,
      color: colors.at(i, arr.length),
      tree: utxoCohorts.amountRange[key],
    }),
  );

  const addressesAmountRange = entries(AMOUNT_RANGE_NAMES).map(
    ([key, names], i, arr) => {
      const cohort = addressCohorts.amountRange[key];
      return {
        name: names.short,
        title: `Addresses ${names.long}`,
        color: colors.at(i, arr.length),
        tree: cohort,
        addressCount: cohort.addrCount,
=======
  // UTXOs amount ranges
  const utxosAmountRanges = entries(utxoCohorts.amountRange).map(
    ([key, tree]) => {
      const names = AMOUNT_RANGE_NAMES[key];
      return {
        name: names.short,
        title: `UTXOs ${names.long}`,
        color: colors[amountRangeColors[key]],
        tree,
      };
    },
  );

  // Addresses amount ranges
  const addressesAmountRanges = entries(addressCohorts.amountRange).map(
    ([key, tree]) => {
      const names = AMOUNT_RANGE_NAMES[key];
      return {
        name: names.short,
        title: `Addresses ${names.long}`,
<<<<<<< HEAD
        color: colors.amountRange[key],
        tree: cohort,
        addrCount: {
          count: cohort.addrCount,
          _30dChange: cohort.addrCount30dChange,
        },
>>>>>>> 69eb58f7 (chore: update website from upstream v0.1.5)
=======
        color: colors[amountRangeColors[key]],
        tree,
>>>>>>> a29452a8 (Revert "chore: update website from upstream v0.1.5")
      };
    },
  );

  const typeAddressable = ADDRESSABLE_TYPES.map((key, i, arr) => {
    const names = SPENDABLE_TYPE_NAMES[key];
    return {
      name: names.short,
      title: names.short,
<<<<<<< HEAD
<<<<<<< HEAD
      color: colors.at(i, arr.length),
=======
      color: colors.scriptType[key],
>>>>>>> 69eb58f7 (chore: update website from upstream v0.1.5)
=======
      color: colors[spendableTypeColors[key]],
>>>>>>> a29452a8 (Revert "chore: update website from upstream v0.1.5")
      tree: utxoCohorts.type[key],
      addressCount: {
        base: addrs.funded[key],
        delta: addrs.delta[key],
      },
    };
  });

  const typeOther = entries(SPENDABLE_TYPE_NAMES)
    .filter(([key]) => !isAddressable(key))
<<<<<<< HEAD
    .map(([key, names], i, arr) => ({
      name: names.short,
      title: names.short,
      color: colors.at(i, arr.length),
      tree: utxoCohorts.type[key],
    }));
=======
    .map(([key, tree]) => {
      const names = SPENDABLE_TYPE_NAMES[key];
      return {
        name: names.short,
        title: names.short,
        color: colors[spendableTypeColors[key]],
        tree,
      };
    });
>>>>>>> 69eb58f7 (chore: update website from upstream v0.1.5)

  const class_ = entries(CLASS_NAMES)
    .reverse()
    .map(([key, names], i, arr) => ({
      name: names.short,
      title: names.long,
<<<<<<< HEAD
<<<<<<< HEAD
      color: colors.at(i, arr.length),
      tree: utxoCohorts.class[key],
    }));

  const { range, profit, loss } = utxoCohorts.profitability;

  const profitabilityRange = entries(PROFITABILITY_RANGE_NAMES).map(
    ([key, names], i, arr) => ({
      name: names.short,
      color: colors.at(i, arr.length),
      pattern: range[key],
    }),
  );

  const profitabilityProfit = entries(PROFIT_NAMES).map(
    ([key, names], i, arr) => ({
      name: names.short,
      color: colors.at(i, arr.length),
      pattern: profit[key],
    }),
  );

  const profitabilityLoss = entries(LOSS_NAMES).map(([key, names], i, arr) => ({
    name: names.short,
    color: colors.at(i, arr.length),
    pattern: loss[key],
  }));
=======
      color: colors.year[key],
=======
      color: colors[yearColors[key]],
>>>>>>> a29452a8 (Revert "chore: update website from upstream v0.1.5")
      tree,
    };
  });
>>>>>>> 69eb58f7 (chore: update website from upstream v0.1.5)

  return {
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
    class: class_,
    profitabilityRange,
    profitabilityProfit,
    profitabilityLoss,
  };
}
