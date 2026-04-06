/** Macro Economy section — FRED data charts */

import { colors } from "../utils/colors.js";
import { brk } from "../client.js";
import { Unit } from "../utils/units.js";
import { line } from "./series.js";

/**
 * Create Macro Economy section
 * @returns {PartialOptionsGroup}
 */
export function createMacroEconomySection() {
  const { macroEconomy } = brk.series;
  const {
    interestRates,
    moneySupply,
    employment,
    inflation,
    growth,
    commodities,
    other,
  } = macroEconomy;

  return {
    name: "Macro Economy",
    tree: [
      // ── Interest Rates ──────────────────────────────────────────
      {
        name: "Interest Rates",
        tree: [
          {
            name: "Fed Funds Rate",
            title: "Federal Funds Effective Rate (DFF)",
            bottom: [
              line({
                series: interestRates.fedFundsRate,
                name: "Fed Funds Rate",
                unit: Unit.percentage,
                color: colors.blue,
              }),
            ],
          },
          {
            name: "Treasury Yields",
            title: "US Treasury Yields",
            bottom: [
              line({
                series: interestRates.treasuryYield2y,
                name: "2Y Yield",
                unit: Unit.percentage,
                color: colors.green,
              }),
              line({
                series: interestRates.treasuryYield10y,
                name: "10Y Yield",
                unit: Unit.percentage,
                color: colors.yellow,
              }),
              line({
                series: interestRates.treasuryYield30y,
                name: "30Y Yield",
                unit: Unit.percentage,
                color: colors.red,
              }),
            ],
          },
          {
            name: "Yield Spread",
            title: "10Y - 2Y Treasury Spread (Yield Curve)",
            bottom: [
              line({
                series: interestRates.yieldSpread10y2y,
                name: "10Y - 2Y Spread",
                unit: Unit.percentage,
                color: colors.orange,
              }),
            ],
          },
        ],
      },

      // ── Money Supply ────────────────────────────────────────────
      {
        name: "Money Supply",
        tree: [
          {
            name: "M1",
            title: "M1 Money Supply (Billions USD)",
            bottom: [
              line({
                series: moneySupply.m1,
                name: "M1",
                unit: Unit.usd,
                color: colors.blue,
              }),
            ],
          },
          {
            name: "M2",
            title: "M2 Money Supply (Billions USD)",
            bottom: [
              line({
                series: moneySupply.m2,
                name: "M2",
                unit: Unit.usd,
                color: colors.purple,
              }),
            ],
          },
          {
            name: "M1 vs M2",
            title: "Money Supply Comparison",
            bottom: [
              line({
                series: moneySupply.m1,
                name: "M1",
                unit: Unit.usd,
                color: colors.blue,
              }),
              line({
                series: moneySupply.m2,
                name: "M2",
                unit: Unit.usd,
                color: colors.purple,
              }),
            ],
          },
        ],
      },

      // ── Employment ──────────────────────────────────────────────
      {
        name: "Employment",
        tree: [
          {
            name: "Unemployment Rate",
            title: "US Unemployment Rate (%)",
            bottom: [
              line({
                series: employment.unemploymentRate,
                name: "Unemployment",
                unit: Unit.percentage,
                color: colors.red,
              }),
            ],
          },
          {
            name: "Initial Claims",
            title: "Initial Jobless Claims (Weekly)",
            bottom: [
              line({
                series: employment.initialClaims,
                name: "Initial Claims",
                unit: Unit.count,
                color: colors.orange,
              }),
            ],
          },
          {
            name: "Non-farm Payrolls",
            title: "Non-farm Payrolls (Thousands)",
            bottom: [
              line({
                series: employment.nonfarmPayrolls,
                name: "NFP",
                unit: Unit.count,
                color: colors.green,
              }),
            ],
          },
        ],
      },

      // ── Inflation ───────────────────────────────────────────────
      {
        name: "Inflation",
        tree: [
          {
            name: "CPI",
            title: "Consumer Price Index",
            bottom: [
              line({
                series: inflation.cpi,
                name: "CPI",
                unit: Unit.index,
                color: colors.red,
              }),
              line({
                series: inflation.coreCpi,
                name: "Core CPI",
                unit: Unit.index,
                color: colors.orange,
                defaultActive: false,
              }),
            ],
          },
          {
            name: "PCE",
            title: "Personal Consumption Expenditures Price Index",
            bottom: [
              line({
                series: inflation.pce,
                name: "PCE",
                unit: Unit.index,
                color: colors.blue,
              }),
              line({
                series: inflation.corePce,
                name: "Core PCE",
                unit: Unit.index,
                color: colors.purple,
                defaultActive: false,
              }),
            ],
          },
          {
            name: "PPI",
            title: "Producer Price Index — All Commodities",
            bottom: [
              line({
                series: inflation.ppi,
                name: "PPI",
                unit: Unit.index,
                color: colors.yellow,
              }),
            ],
          },
          {
            name: "All Inflation",
            title: "Inflation Indices Compared",
            bottom: [
              line({
                series: inflation.cpi,
                name: "CPI",
                unit: Unit.index,
                color: colors.red,
              }),
              line({
                series: inflation.coreCpi,
                name: "Core CPI",
                unit: Unit.index,
                color: colors.orange,
              }),
              line({
                series: inflation.pce,
                name: "PCE",
                unit: Unit.index,
                color: colors.blue,
              }),
              line({
                series: inflation.corePce,
                name: "Core PCE",
                unit: Unit.index,
                color: colors.purple,
              }),
              line({
                series: inflation.ppi,
                name: "PPI",
                unit: Unit.index,
                color: colors.yellow,
              }),
            ],
          },
        ],
      },

      // ── Growth & Sentiment ──────────────────────────────────────
      {
        name: "Growth",
        tree: [
          {
            name: "GDP",
            title: "US Gross Domestic Product (Billions USD)",
            bottom: [
              line({
                series: growth.gdp,
                name: "GDP",
                unit: Unit.usd,
                color: colors.green,
              }),
            ],
          },
          {
            name: "Consumer Confidence",
            title: "University of Michigan Consumer Sentiment",
            bottom: [
              line({
                series: growth.consumerConfidence,
                name: "Consumer Sentiment",
                unit: Unit.index,
                color: colors.blue,
              }),
            ],
          },
          {
            name: "Retail Sales",
            title: "Retail Sales ex Food Services (Millions USD)",
            bottom: [
              line({
                series: growth.retailSales,
                name: "Retail Sales",
                unit: Unit.usd,
                color: colors.purple,
              }),
            ],
          },
        ],
      },

      // ── Commodities ──────────────────────────────────────────────
      {
        name: "Commodities",
        tree: [
          {
            name: "Gold",
            title: "Gold Futures Price (USD/oz)",
            bottom: [
              line({
                series: commodities.goldPrice,
                name: "Gold",
                unit: Unit.usd,
                color: colors.yellow,
              }),
            ],
          },
          {
            name: "Silver",
            title: "Silver Futures Price (USD/oz)",
            bottom: [
              line({
                series: commodities.silverPrice,
                name: "Silver",
                unit: Unit.usd,
                color: colors.gray,
              }),
            ],
          },
          {
            name: "Gold vs Silver",
            title: "Precious Metals Comparison",
            bottom: [
              line({
                series: commodities.goldPrice,
                name: "Gold",
                unit: Unit.usd,
                color: colors.yellow,
              }),
              line({
                series: commodities.silverPrice,
                name: "Silver",
                unit: Unit.usd,
                color: colors.gray,
              }),
            ],
          },
          {
            name: "WTI Crude Oil",
            title: "WTI Crude Oil Futures (USD/bbl)",
            bottom: [
              line({
                series: commodities.oilWti,
                name: "WTI",
                unit: Unit.usd,
                color: colors.orange,
              }),
            ],
          },
          {
            name: "Brent Crude Oil",
            title: "Brent Crude Oil Futures (USD/bbl)",
            bottom: [
              line({
                series: commodities.oilBrent,
                name: "Brent",
                unit: Unit.usd,
                color: colors.red,
              }),
            ],
          },
          {
            name: "WTI vs Brent",
            title: "Crude Oil Comparison",
            bottom: [
              line({
                series: commodities.oilWti,
                name: "WTI",
                unit: Unit.usd,
                color: colors.orange,
              }),
              line({
                series: commodities.oilBrent,
                name: "Brent",
                unit: Unit.usd,
                color: colors.red,
              }),
            ],
          },
        ],
      },

      // ── Other ───────────────────────────────────────────────────
      {
        name: "Other",
        tree: [
          {
            name: "S&P 500",
            title: "S&P 500 Index",
            bottom: [
              line({
                series: other.sp500,
                name: "S&P 500",
                unit: Unit.index,
                color: colors.green,
              }),
            ],
          },
          {
            name: "VIX",
            title: "CBOE Volatility Index (Fear Gauge)",
            bottom: [
              line({
                series: other.vix,
                name: "VIX",
                unit: Unit.index,
                color: colors.red,
              }),
            ],
          },
          {
            name: "Dollar Index",
            title: "Trade-Weighted US Dollar Index",
            bottom: [
              line({
                series: other.dollarIndex,
                name: "DXY (Broad)",
                unit: Unit.index,
                color: colors.green,
              }),
            ],
          },
          {
            name: "Fed Balance Sheet",
            title: "Federal Reserve Total Assets (Millions USD)",
            bottom: [
              line({
                series: other.fedBalanceSheet,
                name: "Fed Balance Sheet",
                unit: Unit.usd,
                color: colors.blue,
              }),
            ],
          },
          {
            name: "BTC Funding Rate",
            title: "BTC Perpetual Futures Funding Rate (Binance)",
            bottom: [
              line({
                series: other.fundingRate,
                name: "Funding Rate",
                unit: Unit.percentage,
                color: colors.orange,
              }),
            ],
          },
        ],
      },
    ],
  };
}
