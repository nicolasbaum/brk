/** Models section — asymmetric tail-curvature quantile fan + prior-model baselines.
 *
 * Backed by the `models` BRK category (the pure `brk_quantile` crate). The fan
 * bands and baseline prices are exposed as the usd/sats/cents price triple, so
 * they overlay the spot price like any other BRK price; the fan-position,
 * dislocation, and overshoot regressors are dimensionless ratios shown in the
 * bottom pane. The expanding-window coefficient trajectory (b(τ), Δb, μ) stays
 * on the API as a diagnostic but is not charted — it is not a regressor.
 */

import { colors } from "../utils/colors.js";
import { brk } from "../utils/client.js";
import { Unit } from "../utils/units.js";
import { line, price } from "./series.js";

/**
 * Create Models section
 * @returns {PartialOptionsGroup}
 */
export function createModelsSection() {
  const { quantileCurvature, baselines } = brk.series.models;

  // Seven bands, lowest→highest quantile, using the shared percentile palette
  // (median = yellow, tails red→green) so the fan reads like other BRK
  // percentile charts.
  const fan = [
    { series: quantileCurvature.q01, name: "Q1", color: colors.stat.min },
    { series: quantileCurvature.q10, name: "Q10", color: colors.stat.pct10 },
    { series: quantileCurvature.q25, name: "Q25", color: colors.stat.pct25 },
    { series: quantileCurvature.q50, name: "Median", color: colors.stat.median },
    { series: quantileCurvature.q75, name: "Q75", color: colors.stat.pct75 },
    { series: quantileCurvature.q95, name: "Q95", color: colors.stat.pct90 },
    { series: quantileCurvature.q99, name: "Q99", color: colors.stat.max },
  ];

  return {
    name: "Models",
    tree: [
      // ── Quantile Curvature fan ──────────────────────────────────
      {
        name: "Quantile Fan",
        tree: [
          {
            name: "Price Fan",
            title: "Asymmetric Tail-Curvature Price-Quantile Fan",
            top: fan.map((b) =>
              price({ series: b.series, name: b.name, color: b.color }),
            ),
          },
          {
            name: "Fan Position",
            title: "Fan Position Q(t) — Model-Implied Quantile of Spot",
            bottom: [
              line({
                series: quantileCurvature.fanPosition,
                name: "Q(t)",
                unit: Unit.ratio,
                color: colors.cyan,
              }),
            ],
          },
          {
            name: "Dislocation",
            title: "Dislocation U(t) — Undershoot of the 1% Band",
            bottom: [
              line({
                series: quantileCurvature.dislocationClose,
                name: "Close",
                unit: Unit.ratio,
                color: colors.blue,
              }),
              line({
                series: quantileCurvature.dislocationWick,
                name: "Wick (Low)",
                unit: Unit.ratio,
                color: colors.red,
                defaultActive: false,
              }),
            ],
          },
          {
            name: "Overshoot",
            title: "Overshoot O(t) — Stretch Above the 99% Band",
            bottom: [
              line({
                series: quantileCurvature.overshootClose,
                name: "Close",
                unit: Unit.ratio,
                color: colors.green,
              }),
              line({
                series: quantileCurvature.overshootWick,
                name: "Wick (High)",
                unit: Unit.ratio,
                color: colors.lime,
                defaultActive: false,
              }),
            ],
          },
          // The expanding-window coefficient trajectory (b(τ), Δb, μ) is the
          // backstage of the fit, kept as an API diagnostic but intentionally
          // not charted — it is not part of the top/bottom regressor set.
        ],
      },

      // ── Prior-model baselines ───────────────────────────────────
      {
        name: "Baselines",
        tree: [
          {
            name: "Prior Models",
            title: "Prior Public Price Models vs Spot",
            top: [
              price({
                series: baselines.olsPowerLawPrice,
                name: "Power Law (OLS)",
                color: colors.orange,
              }),
              price({
                series: baselines.s2fPrice,
                name: "Stock-to-Flow",
                color: colors.purple,
              }),
              price({
                series: baselines.s2fxPrice,
                name: "S2FX",
                color: colors.red,
                defaultActive: false,
              }),
            ],
          },
          {
            name: "Forecast Error",
            title: "Prior-Model log₁₀ Forecast Error vs Spot",
            bottom: [
              line({
                series: baselines.olsPowerLawError,
                name: "Power Law (OLS)",
                unit: Unit.ratio,
                color: colors.orange,
              }),
              line({
                series: baselines.s2fError,
                name: "Stock-to-Flow",
                unit: Unit.ratio,
                color: colors.purple,
              }),
              line({
                series: baselines.s2fxError,
                name: "S2FX",
                unit: Unit.ratio,
                color: colors.red,
              }),
            ],
          },
        ],
      },
    ],
  };
}
