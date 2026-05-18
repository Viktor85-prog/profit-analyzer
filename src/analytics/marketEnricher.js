// src/analytics/marketEnricher.js

import { loadMoexRegistry } from "../services/moexRegistry";

// -----------------------------------
// round helper
// -----------------------------------

function round(value, digits = 2) {
  return Number(Number(value || 0).toFixed(digits));
}

// -----------------------------------
// enrich portfolio
// -----------------------------------

export async function enrichPortfolioWithMarketData(portfolio) {
  // -----------------------------------
  // load all prices once
  // -----------------------------------

  const registry = await loadMoexRegistry();

  // -----------------------------------
  // enrich
  // -----------------------------------

  return portfolio.map((item) => {
    const registryItem = registry[item.isin];

    // -----------------------------------
    // market data
    // -----------------------------------

    const currentPrice = round(registryItem?.price ?? 0);

    const moexTicker = registryItem?.moexTicker ?? item.ticker;

    const market = registryItem?.market ?? null;

    const board = registryItem?.board ?? null;

    // -----------------------------------
    // calculations
    // -----------------------------------

    const positionValue = round(currentPrice * item.quantity);

    const unrealizedPnL = round(positionValue - item.invested);

    const unrealizedPnLPercent = item.invested ? round((unrealizedPnL / item.invested) * 100) : 0;

    const totalPnL = round(unrealizedPnL + item.realizedPnL + item.dividends);

    const totalPnLPercent = item.invested ? round((totalPnL / item.invested) * 100) : 0;

    // -----------------------------------
    // result
    // -----------------------------------

    return {
      ...item,

      // MOEX

      moexTicker,

      market,

      board,

      currentPrice,

      // POSITION

      positionValue,

      unrealizedPnL,

      unrealizedPnLPercent,

      // TOTAL

      totalPnL,

      totalPnLPercent
    };
  });
}
