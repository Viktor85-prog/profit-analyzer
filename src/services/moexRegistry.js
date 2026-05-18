// src/services/moexRegistry.js

// -----------------------------------
// cache
// -----------------------------------

let cachedRegistry = null;

// -----------------------------------
// sources
// -----------------------------------

const SOURCES = [
  {
    market: "shares",
    board: "TQBR"
  },

  {
    market: "bonds",
    board: "TQCB"
  },

  {
    market: "etfs",
    board: "TQTF"
  }
];

// -----------------------------------
// load registry
// -----------------------------------

export async function loadMoexRegistry() {
  // -----------------------------------
  // cache
  // -----------------------------------

  if (cachedRegistry) {
    return cachedRegistry;
  }

  const registry = {};

  // -----------------------------------
  // parallel lightweight requests
  // -----------------------------------

  await Promise.all(
    SOURCES.map(async ({ market, board }) => {
      try {
        const url =
          `https://iss.moex.com/iss/engines/stock/markets/${market}/boards/${board}/securities.json` +
          `?iss.only=securities,marketdata` +
          `&securities.columns=ISIN,SECID` +
          `&marketdata.columns=SECID,LAST,MARKETPRICE2,LCURRENTPRICE,WAPRICE`;

        console.log("LOAD:", market, board);

        const response = await fetch(url);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();

        const securities = data.securities?.data || [];

        const marketdata = data.marketdata?.data || [];

        // -----------------------------------
        // secid -> market row
        // -----------------------------------

        const marketMap = {};

        marketdata.forEach((row) => {
          marketMap[row[0]] = row;
        });

        // -----------------------------------
        // build registry
        // -----------------------------------

        securities.forEach((secRow) => {
          const isin = secRow[0];

          const secid = secRow[1];

          if (!isin || !secid) {
            return;
          }

          const marketRow = marketMap[secid];

          if (!marketRow) {
            return;
          }

          // columns:
          // SECID,LAST,MARKETPRICE2,LCURRENTPRICE,WAPRICE

          const last = marketRow[1];

          const marketPrice2 = marketRow[2];

          const currentPrice = marketRow[3];

          const waPrice = marketRow[4];

          const price = last ?? marketPrice2 ?? currentPrice ?? waPrice ?? null;

          if (price === null || Number.isNaN(Number(price))) {
            return;
          }

          registry[isin] = Number(price);
          //   registry[secid] = secid;

          //   console.log("REG:", isin, secid, board, registry[isin]);
        });
      } catch (err) {
        console.error("MOEX REGISTRY ERROR:", market, board, err);
      }
    })
  );

  console.log("MOEX REGISTRY LOADED:", Object.keys(registry).length);

  cachedRegistry = registry;

  return registry;
}
