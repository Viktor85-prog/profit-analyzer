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
  // load registry
  // -----------------------------------

  const registry = await loadMoexRegistry();

  // -----------------------------------
  // enrich
  // -----------------------------------

  return portfolio.map((item) => {
    // -----------------------------------
    // asset registry
    // -----------------------------------

    const assetRegistry = registry[item.assetType] || {};

    const moexData = assetRegistry[item.isin];

    // -----------------------------------
    // market data
    // -----------------------------------

    let currentPrice = 0;

    let moexTicker = null;

    if (moexData) {
      currentPrice = round(moexData.price);

      moexTicker = moexData.moexTicker;
    }

    // -----------------------------------
    // bonds price normalization
    // -----------------------------------

    if (item.assetType === "bonds") {
      currentPrice = round((currentPrice / 100) * 1000);
    }

    // -----------------------------------
    // calculations
    // -----------------------------------

    const positionValue = round(currentPrice * item.quantity);

    const unrealizedPnL = round(positionValue - item.invested);

    const unrealizedPnLPercent = item.invested ? round((unrealizedPnL / item.invested) * 100) : 0;

    const totalPnL = round(unrealizedPnL + (item.realizedPnL || 0) + (item.dividends || 0));

    const totalPnLPercent = item.invested ? round((totalPnL / item.invested) * 100) : 0;

    // -----------------------------------
    // result
    // -----------------------------------

    return {
      ...item,

      moexTicker,

      currentPrice,

      positionValue,

      unrealizedPnL,

      unrealizedPnLPercent,

      totalPnL,

      totalPnLPercent
    };
  });
}
