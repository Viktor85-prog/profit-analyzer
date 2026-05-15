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

        dividends: 0
      };
    }

    const asset = portfolioMap[tx.ticker];

    // ------------------------
    // BUY
    // ------------------------
    if (tx.side === "BUY") {
      asset.quantity += tx.quantity;

      asset.invested += tx.amount;

      asset.avgPrice = asset.quantity > 0 ? asset.invested / asset.quantity : 0;
    }

    // ------------------------
    // SELL
    // ------------------------
    if (tx.side === "SELL") {
      asset.quantity += tx.quantity;

      asset.invested += tx.quantity * asset.avgPrice;
    }
  }

  return Object.values(portfolioMap).map((item) => ({
    ...item,

    quantity: Math.round(item.quantity * 100) / 100,

    invested: Math.round(item.invested * 100) / 100,

    avgPrice: Math.round(item.avgPrice * 100) / 100,

    realizedPnL: Math.round(item.realizedPnL * 100) / 100,

    dividends: Math.round(item.dividends * 100) / 100
  }));
}
