export function buildPortfolio(transactions) {
  const portfolioMap = {};
  //   console.log(transactions);
  for (const tx of transactions) {
    // ---------------------------------
    // CREATE ASSET
    // ---------------------------------

    if (!portfolioMap[tx.ticker]) {
      portfolioMap[tx.ticker] = {
        ticker: tx.ticker,

        isin: tx.isin,

        regNumber: tx.regNumber,

        instrumentName: tx.instrumentName,

        assetType: tx.assetType,

        // -------------------
        // position
        // -------------------

        quantity: 0,

        invested: 0,

        avgPrice: 0,

        // -------------------
        // realized pnl
        // -------------------

        realizedPnL: 0,

        realizedPnLPercent: 0,

        // -------------------
        // dividends
        // -------------------

        dividends: 0,

        dividendYieldPercent: 0,

        // -------------------
        // total pnl
        // -------------------

        totalPnL: 0,

        totalPnLPercent: 0,

        // -------------------
        // market
        // -------------------

        currentPrice: 0,

        positionValue: 0,

        unrealizedPnL: 0,

        unrealizedPnLPercent: 0
      };
    }

    const asset = portfolioMap[tx.ticker];

    // ---------------------------------
    // BUY
    // ---------------------------------

    if (tx.side === "BUY") {
      const newQuantity = asset.quantity + tx.quantity;

      // новая средняя
      asset.avgPrice = newQuantity > 0 ? (asset.invested + tx.amount) / newQuantity : 0;

      asset.quantity = newQuantity;

      asset.invested += tx.amount;
    }

    // ---------------------------------
    // SELL
    // ---------------------------------

    if (tx.side === "SELL") {
      const soldQty = Math.abs(tx.quantity);

      // себестоимость проданной части
      const costBasis = soldQty * asset.avgPrice;

      // прибыль/убыток
      const pnl = tx.amount - costBasis;

      // realized pnl
      asset.realizedPnL += pnl;

      // уменьшаем позицию
      asset.quantity -= soldQty;

      // уменьшаем invested
      asset.invested -= costBasis;

      // защита от -0
      if (Math.abs(asset.quantity) < 0.00001) {
        asset.quantity = 0;
      }

      if (Math.abs(asset.invested) < 0.00001) {
        asset.invested = 0;
      }

      // avg price сохраняется пока позиция > 0
      if (asset.quantity <= 0) {
        asset.avgPrice = 0;
      }
    }

    // ---------------------------------
    // DIVIDENDS
    // ---------------------------------

    if (tx.side === "DIVIDEND") {
      asset.dividends += tx.amount;
    }

    // ---------------------------------
    // REALIZED %
    // ---------------------------------

    const realizedBase = asset.realizedPnL + asset.invested;

    asset.realizedPnLPercent = realizedBase > 0 ? (asset.realizedPnL / realizedBase) * 100 : 0;

    // ---------------------------------
    // DIVIDEND %
    // ---------------------------------

    asset.dividendYieldPercent = realizedBase > 0 ? (asset.dividends / realizedBase) * 100 : 0;

    // ---------------------------------
    // TOTAL
    // ---------------------------------

    asset.totalPnL = asset.realizedPnL + asset.dividends;

    asset.totalPnLPercent = realizedBase > 0 ? (asset.totalPnL / realizedBase) * 100 : 0;

    // ---------------------------------
    // UNREALIZED
    // ---------------------------------

    asset.positionValue = asset.quantity * asset.currentPrice;

    asset.unrealizedPnL = asset.positionValue - asset.invested;

    asset.unrealizedPnLPercent = asset.invested > 0 ? (asset.unrealizedPnL / asset.invested) * 100 : 0;
  }

  // ---------------------------------
  // ROUNDING
  // ---------------------------------

  return Object.values(portfolioMap).map((item) => ({
    ...item,

    quantity: round(item.quantity),

    invested: round(item.invested),

    avgPrice: round(item.avgPrice),

    realizedPnL: round(item.realizedPnL),

    realizedPnLPercent: round(item.realizedPnLPercent),

    dividends: round(item.dividends),

    dividendYieldPercent: round(item.dividendYieldPercent),

    totalPnL: round(item.totalPnL),

    totalPnLPercent: round(item.totalPnLPercent),

    currentPrice: round(item.currentPrice),

    positionValue: round(item.positionValue),

    unrealizedPnL: round(item.unrealizedPnL),

    unrealizedPnLPercent: round(item.unrealizedPnLPercent)
  }));
}

// ---------------------------------
// HELPERS
// ---------------------------------

function round(value) {
  return Math.round((value || 0) * 100) / 100;
}
