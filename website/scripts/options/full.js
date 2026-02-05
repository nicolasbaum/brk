import { createPartialOptions } from "./partial.js";
import { createButtonElement, createAnchorElement } from "../utils/dom.js";
import { pushHistory, resetParams } from "../utils/url.js";
import { readStored, writeToStorage } from "../utils/storage.js";
import { stringToId } from "../utils/format.js";
<<<<<<< HEAD
<<<<<<< HEAD
import { logUnused } from "./unused.js";
=======
import {
  collect,
  markUsed,
  logUnused,
  extractTreeStructure,
} from "./unused.js";
import { localhost } from "../utils/env.js";
>>>>>>> 69eb58f7 (chore: update website from upstream v0.1.5)
=======
import { collect, markUsed, logUnused } from "./unused.js";
>>>>>>> a29452a8 (Revert "chore: update website from upstream v0.1.5")
import { setQr } from "../panes/share.js";
import { getConstant } from "./constants.js";
import { colors } from "../chart/colors.js";
import { Unit } from "../utils/units.js";

<<<<<<< HEAD
export function initOptions() {
<<<<<<< HEAD
=======
=======
/**
 * @param {BrkClient} brk
 */
export function initOptions(brk) {
>>>>>>> a29452a8 (Revert "chore: update website from upstream v0.1.5")
  collect(brk.metrics);

>>>>>>> 69eb58f7 (chore: update website from upstream v0.1.5)
  const LS_SELECTED_KEY = `selected_path`;

  const urlPath_ = window.document.location.pathname
    .split("/")
    .filter((v) => v);
  const urlPath = urlPath_.length ? urlPath_ : undefined;
  const savedPath = /** @type {string[]} */ (
    JSON.parse(readStored(LS_SELECTED_KEY) || "[]") || []
  ).filter((v) => v);
  console.log(savedPath);

<<<<<<< HEAD
  const partialOptions = createPartialOptions();
<<<<<<< HEAD
=======

  // Log tree structure for analysis (localhost only)
  if (localhost) {
    console.log(extractTreeStructure(partialOptions));
  }
>>>>>>> 69eb58f7 (chore: update website from upstream v0.1.5)
=======
  const partialOptions = createPartialOptions({
    brk,
  });
>>>>>>> a29452a8 (Revert "chore: update website from upstream v0.1.5")

  /** @type {Option[]} */
  const list = [];

  /** @type {Map<string, HTMLLIElement>} */
  const liByPath = new Map();

  /** @type {Set<(option: Option) => void>} */
  const selectedListeners = new Set();

  /** @type {HTMLLIElement[]} */
  let highlightedLis = [];

  /**
   * @param {Option | undefined} sel
   */
  function updateHighlight(sel) {
    if (!sel) return;
    for (const li of highlightedLis) {
      delete li.dataset.highlight;
    }
    highlightedLis = [];
    let pathKey = "";
    for (const segment of sel.path) {
      pathKey = pathKey ? `${pathKey}/${segment}` : segment;
      const li = liByPath.get(pathKey);
      if (li) {
        li.dataset.highlight = "";
        highlightedLis.push(li);
      }
    }
  }

  const selected = {
    /** @type {Option | undefined} */
    value: undefined,
    /** @param {Option} v */
    set(v) {
      this.value = v;
      updateHighlight(v);
      selectedListeners.forEach((cb) => cb(v));
    },
    /** @param {(option: Option) => void} cb */
    onChange(cb) {
      selectedListeners.add(cb);
      if (this.value) cb(this.value);
      return () => selectedListeners.delete(cb);
    },
  };

  /**
   * @param {string[]} nodePath
   */
  function isOnSelectedPath(nodePath) {
    const selectedPath = selected.value?.path;
    return (
      selectedPath &&
      nodePath.length <= selectedPath.length &&
      nodePath.every((v, i) => v === selectedPath[i])
    );
  }

  /**
<<<<<<< HEAD
<<<<<<< HEAD
   * @template T
   * @param {() => T} fn
   * @returns {() => T}
   */
  function lazy(fn) {
    /** @type {T | undefined} */
    let cached;
    let computed = false;
    return () => {
      if (!computed) {
        computed = true;
        cached = fn();
      }
      return /** @type {T} */ (cached);
    };
  }

  /**
=======
>>>>>>> 69eb58f7 (chore: update website from upstream v0.1.5)
=======
   * Check if a metric is an ActivePricePattern (has dollars and sats sub-metrics)
   * @param {any} metric
   * @returns {metric is ActivePricePattern}
   */
  function isActivePricePattern(metric) {
    return (
      metric &&
      typeof metric === "object" &&
      "dollars" in metric &&
      "sats" in metric &&
      metric.dollars?.by &&
      metric.sats?.by
    );
  }

  /**
>>>>>>> a29452a8 (Revert "chore: update website from upstream v0.1.5")
   * @param {(AnyFetchedSeriesBlueprint | FetchedPriceSeriesBlueprint)[]} [arr]
   */
  function arrayToMap(arr = []) {
    /** @type {Map<Unit, AnyFetchedSeriesBlueprint[]>} */
    const map = new Map();
    /** @type {Map<Unit, Set<number>>} */
    const priceLines = new Map();

<<<<<<< HEAD
    if (!arr) return map;

    // Cache arrays for common units outside loop
    /** @type {AnyFetchedSeriesBlueprint[] | undefined} */
    let usdArr;
    /** @type {AnyFetchedSeriesBlueprint[] | undefined} */
    let satsArr;

    for (let i = 0; i < arr.length; i++) {
      const blueprint = arr[i];

<<<<<<< HEAD
      // Check for undefined series
      if (!blueprint.series) {
        throw new Error(`Blueprint has undefined series: ${blueprint.title}`);
      }

      // Check for price pattern blueprint (has usd/sats sub-series)
      // Use unknown cast for safe property access check
      const maybePriceSeries =
        /** @type {{ usd?: AnySeriesPattern, sats?: AnySeriesPattern }} */ (
          /** @type {unknown} */ (blueprint.series)
        );
      if (maybePriceSeries.usd?.by && maybePriceSeries.sats?.by) {
        const { usd, sats } = maybePriceSeries;
        if (!usdArr) map.set(Unit.usd, (usdArr = []));
        usdArr.push({ ...blueprint, series: usd, unit: Unit.usd });

        if (!satsArr) map.set(Unit.sats, (satsArr = []));
        satsArr.push({ ...blueprint, series: sats, unit: Unit.sats });
        continue;
      }

      // After continue, we know this is a regular series blueprint
      const regularBlueprint = /** @type {AnyFetchedSeriesBlueprint} */ (
        blueprint
      );
      const s = regularBlueprint.series;
      const unit = regularBlueprint.unit;
      if (!unit) continue;

=======
      // Check for undefined metric
=======
    for (const blueprint of arr || []) {
>>>>>>> a29452a8 (Revert "chore: update website from upstream v0.1.5")
      if (!blueprint.metric) {
        console.warn(
          `Blueprint missing metric (skipping): ${JSON.stringify(blueprint)}`,
        );
        continue;
      }

      // Auto-expand ActivePricePattern into USD and sats versions
      if (isActivePricePattern(blueprint.metric)) {
        const pricePattern = /** @type {AnyPricePattern} */ (blueprint.metric);

        // USD version
        markUsed(pricePattern.dollars);
        if (!map.has(Unit.usd)) map.set(Unit.usd, []);
        map.get(Unit.usd)?.push({ ...blueprint, metric: pricePattern.dollars, unit: Unit.usd });

        // Sats version
        markUsed(pricePattern.sats);
        if (!map.has(Unit.sats)) map.set(Unit.sats, []);
        map.get(Unit.sats)?.push({ ...blueprint, metric: pricePattern.sats, unit: Unit.sats });

        continue;
      }

      // At this point, blueprint is definitely an AnyFetchedSeriesBlueprint (not a price pattern)
      const regularBlueprint = /** @type {AnyFetchedSeriesBlueprint} */ (blueprint);

<<<<<<< HEAD
      markUsed(metric);
>>>>>>> 69eb58f7 (chore: update website from upstream v0.1.5)
      let unitArr = map.get(unit);
      if (!unitArr) map.set(unit, (unitArr = []));
      unitArr.push(regularBlueprint);

      // Track baseline base values for auto price lines
      const type = regularBlueprint.type;
      if (type === "Baseline") {
        let priceSet = priceLines.get(unit);
        if (!priceSet) priceLines.set(unit, (priceSet = new Set()));
        priceSet.add(regularBlueprint.options?.baseValue?.price ?? 0);
      } else if (!type || type === "Line") {
        // Check if manual price line - avoid Object.values() array allocation
<<<<<<< HEAD
        const by = s.by;
=======
        const by = metric.by;
>>>>>>> 69eb58f7 (chore: update website from upstream v0.1.5)
        for (const k in by) {
          if (by[/** @type {Index} */ (k)]?.path?.includes("constant_")) {
            priceLines.get(unit)?.delete(parseFloat(regularBlueprint.title));
          }
          break;
=======
      if (!regularBlueprint.unit) {
        console.warn(`Blueprint missing unit (skipping): ${regularBlueprint.title}`);
        continue;
      }
      markUsed(regularBlueprint.metric);
      const unit = regularBlueprint.unit;
      if (!map.has(unit)) {
        map.set(unit, []);
      }
      map.get(unit)?.push(regularBlueprint);

      // Track baseline base values for auto price lines
      if (regularBlueprint.type === "Baseline") {
        const baseValue = regularBlueprint.options?.baseValue?.price ?? 0;
        if (!priceLines.has(unit)) priceLines.set(unit, new Set());
        priceLines.get(unit)?.add(baseValue);
      }

      // Remove from set if manual price line already exists
      // Note: line() doesn't set type, so undefined means Line
      if (regularBlueprint.type === "Line" || regularBlueprint.type === undefined) {
        const path = Object.values(regularBlueprint.metric.by)[0]?.path ?? "";
        if (path.includes("constant_")) {
          priceLines.get(unit)?.delete(parseFloat(regularBlueprint.title));
>>>>>>> a29452a8 (Revert "chore: update website from upstream v0.1.5")
        }
      }
    }

    // Add price lines at end for remaining values
    for (const [unit, values] of priceLines) {
      for (const baseValue of values) {
<<<<<<< HEAD
        const s = getConstant(brk.series.constants, baseValue);
        arr.push({
          series: s,
=======
        const metric = getConstant(brk.metrics.constants, baseValue);
        markUsed(metric);
        map.get(unit)?.push({
          metric,
>>>>>>> 69eb58f7 (chore: update website from upstream v0.1.5)
          title: `${baseValue}`,
          color: colors.gray,
          unit,
          options: { lineStyle: 4, lastValueVisible: false, crosshairMarkerVisible: false },
        });
      }
    }

    return map;
  }

  /**
   * @param {Option} option
   */
  function selectOption(option) {
    if (selected.value === option) return;
    pushHistory(option.path);
    resetParams(option);
    writeToStorage(LS_SELECTED_KEY, JSON.stringify(option.path));
    selected.set(option);
  }

  /**
   * @param {Object} args
   * @param {Option} args.option
   * @param {string} [args.name]
   */
  function createOptionElement({ option, name }) {
    const title = option.title;
    if (option.kind === "link") {
      const href = option.url();

      if (option.qrcode) {
        return createButtonElement({
          inside: option.name,
          title,
          onClick: () => {
            setQr(option.url());
          },
        });
      } else {
        return createAnchorElement({
          href,
          blank: true,
          text: option.name,
          title,
        });
      }
    } else {
      return createAnchorElement({
        href: `/${option.path.join("/")}`,
        title,
        text: name || option.name,
        onClick: () => {
          selectOption(option);
        },
      });
    }
  }

  /** @type {Option | undefined} */
  let savedOption;

  /**
   * @typedef {{ type: "group"; name: string; serName: string; path: string[]; pathKey: string; count: number; children: ProcessedNode[] }} ProcessedGroup
   * @typedef {{ type: "option"; option: Option; path: string[]; pathKey: string }} ProcessedOption
   * @typedef {ProcessedGroup | ProcessedOption} ProcessedNode
   */

  /**
   * @param {PartialOptionsTree} partialTree
   * @param {string[]} parentPath
   * @returns {ProcessedNode[]}
   */
  function processPartialTree(partialTree, parentPath = []) {
    /** @type {ProcessedNode[]} */
    const nodes = [];

    for (const anyPartial of partialTree) {
      if ("tree" in anyPartial) {
        const serName = stringToId(anyPartial.name);
        const path = [...parentPath, serName];
        const children = processPartialTree(anyPartial.tree, path);

        // Compute count from children
        const count = children.reduce(
          (sum, child) => sum + (child.type === "group" ? child.count : 1),
          0,
        );

        // Skip groups with no children
        if (count === 0) continue;

        nodes.push({
          type: "group",
          name: anyPartial.name,
          serName,
          path,
          pathKey: pathStr,
          count,
          children,
        });
      } else {
        const option = /** @type {Option} */ (anyPartial);
        const name = option.name;
        const path = [...parentPath, stringToId(option.name)];

        // Transform partial to full option
        if ("kind" in anyPartial && anyPartial.kind === "explorer") {
          Object.assign(
            option,
            /** @satisfies {ExplorerOption} */ ({
              kind: anyPartial.kind,
              path,
              name,
              title: option.title,
            }),
          );
        } else if ("kind" in anyPartial && anyPartial.kind === "table") {
          Object.assign(
            option,
            /** @satisfies {TableOption} */ ({
              kind: anyPartial.kind,
              path,
              name,
              title: option.title,
            }),
          );
        } else if ("kind" in anyPartial && anyPartial.kind === "simulation") {
          Object.assign(
            option,
            /** @satisfies {SimulationOption} */ ({
              kind: anyPartial.kind,
              path,
              name,
              title: anyPartial.title,
            }),
          );
        } else if ("url" in anyPartial) {
          Object.assign(
            option,
            /** @satisfies {UrlOption} */ ({
              kind: "link",
              path,
              name,
              title: name,
              qrcode: !!anyPartial.qrcode,
              url: anyPartial.url,
            }),
          );
        } else {
<<<<<<< HEAD
          const title = option.title || name;
<<<<<<< HEAD
          const topArr = anyPartial.top;
          const bottomArr = anyPartial.bottom;
          const topFn = lazy(() => arrayToMap(topArr));
          const bottomFn = lazy(() => arrayToMap(bottomArr));
=======
>>>>>>> 69eb58f7 (chore: update website from upstream v0.1.5)
=======
          const title = option.title || option.name;
>>>>>>> a29452a8 (Revert "chore: update website from upstream v0.1.5")
          Object.assign(
            option,
            /** @satisfies {ChartOption} */ ({
              kind: "chart",
              name,
              title,
              path,
              top: topFn,
              bottom: bottomFn,
            }),
          );
        }

        list.push(option);

        // Check if this matches URL or saved path
        if (urlPath) {
          const sameAsURLPath =
            urlPath.length === path.length &&
            urlPath.every((val, i) => val === path[i]);
          if (sameAsURLPath) {
            selected.set(option);
          }
        } else if (savedPath) {
          const sameAsSavedPath =
            savedPath.length === path.length &&
            savedPath.every((val, i) => val === path[i]);
          if (sameAsSavedPath) {
            savedOption = option;
          }
        }

        nodes.push({
          type: "option",
          option,
          path,
          pathKey: pathStr,
        });
      }
    }

    return nodes;
  }

<<<<<<< HEAD
<<<<<<< HEAD
  logUnused(brk.series, partialOptions);
  const { nodes: processedTree } = processPartialTree(partialOptions);
=======
  const { nodes: processedTree } = processPartialTree(partialOptions);
=======
  const processedTree = processPartialTree(partialOptions);
>>>>>>> a29452a8 (Revert "chore: update website from upstream v0.1.5")
  logUnused();
>>>>>>> 69eb58f7 (chore: update website from upstream v0.1.5)

  /**
   * @param {ProcessedNode[]} nodes
   * @param {HTMLElement} parentEl
   */
  function buildTreeDOM(nodes, parentEl) {
    const ul = window.document.createElement("ul");

    for (const node of nodes) {
      const li = window.document.createElement("li");
      ul.append(li);

      liByPath.set(node.pathKey, li);

      const onSelectedPath = isOnSelectedPath(node.path);

      if (node.type === "group") {
        const details = window.document.createElement("details");
        details.dataset.name = node.serName;
        li.appendChild(details);

        const summary = window.document.createElement("summary");
        details.append(summary);
        summary.append(node.name);

        const count = window.document.createElement("small");
        count.textContent = `(${node.count.toLocaleString("en-us")})`;
        summary.append(count);

        let built = false;
        if (onSelectedPath) {
          built = true;
          details.open = true;
          buildTreeDOM(node.children, details);
        }
        details.addEventListener("toggle", () => {
          if (details.open && !built) {
            built = true;
            buildTreeDOM(node.children, details);
          }
        });
      } else {
        const element = createOptionElement({
          option: node.option,
        });
        li.append(element);
      }
    }

    parentEl.append(ul);
  }

  /** @type {HTMLElement | null} */
  let parentEl = null;

  /**
   * @param {HTMLElement} el
   */
  function setParent(el) {
    if (parentEl) return;
    parentEl = el;
    buildTreeDOM(processedTree, el);
    updateHighlight(selected.value);
  }

  if (!selected.value) {
    const option =
      savedOption || list.find((option) => option.kind === "chart");
    if (option) {
      selected.set(option);
    }
  }

  return {
    selected,
    list,
    tree: /** @type {OptionsTree} */ (partialOptions),
    setParent,
    createOptionElement,
    selectOption,
  };
}
/** @typedef {ReturnType<typeof initOptions>} Options */
