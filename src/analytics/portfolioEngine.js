export function buildPortfolio(transactions) {
  const portfolioMap = {};

  for (const tx of transactions) {
    if (!portfolioMap[tx.ticker]) {
      portfolioMap[tx.ticker] = {
        ticker: tx.ticker,

        quantity: 0,

        invested: 0,

        avgPrice: 0,

        realizedPnL: 0,
        realizedPnLPercent: 0,

        dividends: 0,
        dividendYieldPercent: 0,

        totalPnL: 0,
        totalPnLPercent: 0
      };
    }

    const asset = portfolioMap[tx.ticker];

    // ---------------------------------
    // BUY
    // ---------------------------------
    if (tx.side === "BUY") {
      asset.quantity += tx.quantity;

      asset.invested += tx.amount;

      asset.avgPrice = asset.quantity > 0 ? asset.invested / asset.quantity : 0;
    }

    // ---------------------------------
    // SELL
    // ---------------------------------
    if (tx.side === "SELL") {
      const soldQty = Math.abs(tx.quantity);

      const costBasis = soldQty * asset.avgPrice;

      const pnl = tx.amount - costBasis;

      asset.realizedPnL += pnl;

      asset.quantity -= soldQty;

      asset.invested -= costBasis;

      asset.realizedPnLPercent = costBasis > 0 ? (asset.realizedPnL / (asset.realizedPnL + costBasis)) * 100 : 0;
    }

    // ---------------------------------
    // DIVIDENDS
    // ---------------------------------
    if (tx.side === "DIVIDEND") {
      asset.dividends += tx.amount;
    }

    // ---------------------------------
    // DIVIDEND YIELD
    // ---------------------------------
    const investedBase = asset.invested + asset.realizedPnL;

    asset.dividendYieldPercent = investedBase > 0 ? (asset.dividends / investedBase) * 100 : 0;

    // ---------------------------------
    // TOTAL
    // ---------------------------------
    asset.totalPnL = asset.realizedPnL + asset.dividends;

    asset.totalPnLPercent = investedBase > 0 ? (asset.totalPnL / investedBase) * 100 : 0;
  }

  return Object.values(portfolioMap).map((item) => ({
    ...item,

    quantity: Math.round(item.quantity * 100) / 100,

    invested: Math.round(item.invested * 100) / 100,

    avgPrice: Math.round(item.avgPrice * 100) / 100,

    realizedPnL: Math.round(item.realizedPnL * 100) / 100,

    realizedPnLPercent: Math.round(item.realizedPnLPercent * 100) / 100,

    dividends: Math.round(item.dividends * 100) / 100,

    dividendYieldPercent: Math.round(item.dividendYieldPercent * 100) / 100,

    totalPnL: Math.round(item.totalPnL * 100) / 100,

    totalPnLPercent: Math.round(item.totalPnLPercent * 100) / 100
  }));
}
