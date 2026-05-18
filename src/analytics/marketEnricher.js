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
    console.log(item);
    const currentPrice = round(registry[item.isin] ?? 0);

    const positionValue = round(currentPrice * item.quantity);

    const unrealizedPnL = round(positionValue - item.invested);

    const unrealizedPnLPercent = item.invested ? round((unrealizedPnL / item.invested) * 100) : 0;

    const totalPnL = round(unrealizedPnL + item.realizedPnL + item.dividends);

    const totalPnLPercent = item.invested ? round((totalPnL / item.invested) * 100) : 0;

    return {
      ...item,

      currentPrice,

      positionValue,

      unrealizedPnL,

      unrealizedPnLPercent,

      totalPnL,

      totalPnLPercent
    };
  });
}
