// src/services/moexRegistry.js

// -----------------------------------
// cache
// -----------------------------------

let cachedRegistry = null;

// -----------------------------------
// sources
// -----------------------------------

const SOURCES = {
  shares: {
    market: "shares",
    board: "TQBR"
  },

  bonds: [
    {
      market: "bonds",
      board: "TQCB"
    },

    {
      market: "bonds",
      board: "TQOB"
    }
  ],

  etfs: {
    market: "etfs",
    board: "TQTF"
  }
};

// -----------------------------------
// load single market
// -----------------------------------

async function loadMarketRegistry(assetType, config) {
  const registry = {};

  try {
    const url =
      `https://iss.moex.com/iss/engines/stock/markets/${config.market}/boards/${config.board}/securities.json` +
      `?iss.only=securities,marketdata` +
      `&securities.columns=ISIN,SECID,SHORTNAME` +
      `&marketdata.columns=SECID,LAST,MARKETPRICE2,LCURRENTPRICE,WAPRICE`;

    console.log("LOAD:", assetType, config.board, url);

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
    // registry
    // -----------------------------------

    securities.forEach((secRow) => {
      const isin = secRow[0];

      const secid = secRow[1];

      const shortName = secRow[2];

      if (!isin || !secid) {
        return;
      }

      const marketRow = marketMap[secid];

      if (!marketRow) {
        return;
      }

      const last = marketRow[1];

      const marketPrice2 = marketRow[2];

      const currentPrice = marketRow[3];

      const waPrice = marketRow[4];

      const price = last ?? marketPrice2 ?? currentPrice ?? waPrice ?? null;

      if (price === null || Number.isNaN(Number(price))) {
        return;
      }

      registry[isin] = {
        price: Number(price),

        moexTicker: assetType === "bonds" ? shortName || secid || isin : secid || shortName || isin
      };
    });

    console.log(assetType, config.board, "LOADED:", Object.keys(registry).length);

    return registry;
  } catch (err) {
    console.error("MOEX REGISTRY ERROR:", assetType, config.board, err);

    return {};
  }
}

// -----------------------------------
// load registry
// -----------------------------------

export async function loadMoexRegistry() {
  if (cachedRegistry) {
    return cachedRegistry;
  }

  const result = {};

  const entries = Object.entries(SOURCES);

  await Promise.all(
    entries.map(async ([assetType, config]) => {
      // -----------------------------------
      // multiple boards
      // -----------------------------------

      if (Array.isArray(config)) {
        result[assetType] = {};

        const registries = await Promise.all(config.map((item) => loadMarketRegistry(assetType, item)));

        registries.forEach((part) => {
          Object.assign(result[assetType], part);
        });

        return;
      }

      // -----------------------------------
      // single board
      // -----------------------------------

      result[assetType] = await loadMarketRegistry(assetType, config);
    })
  );

  cachedRegistry = result;

  console.log("MOEX REGISTRY READY:", result);

  return result;
}
