export function parseBCSReport(rows) {
  const transactions = [];

  // -----------------------------------
  // current instrument
  // -----------------------------------

  let currentTicker = null;

  // -----------------------------------
  // metadata storage
  // -----------------------------------

  const tickerMeta = {};

  for (const item of rows) {
    const row = item.row;
    const assetType = item.assetType;

    if (!row || !row.length) {
      continue;
    }

    // -----------------------------------
    // у БКС первая колонка пустая
    // -----------------------------------

    const first = String(row[1] || "").trim();

    // -----------------------------------
    // пустые строки
    // -----------------------------------

    if (!first) {
      continue;
    }

    // -----------------------------------
    // мусор
    // -----------------------------------

    const ignoredRows = [
      "Акция",
      "Облигация",
      "Пай",
      "Драгоценные металлы",
      "Валюта цены",
      "Дата",
      "Номер рег.",
      "ISIN",
      "Итого",
      "Займы",
      "Овернайт",
      "Сделки РЕПО",
      "Валютный рынок",
      "Срочный рынок",
      "Денежный рынок"
    ];

    const isIgnored = ignoredRows.some((word) => first.includes(word));

    if (isIgnored) {
      continue;
    }

    // -----------------------------------
    // строка сделки = дата
    // -----------------------------------

    const isTradeRow = /^\d{2}\.\d{2}\.\d{2}$/.test(first);

    // -----------------------------------
    // ticker row
    // -----------------------------------

    if (!isTradeRow) {
      // -----------------------------------
      // пропуск валют
      // -----------------------------------

      const isCurrencyPair =
        first.includes("RUB_TOM") || first.includes("RUB_TOD") || first.includes("USDT") || first.includes("EURRUB") || first.includes("CNYRUB");

      if (isCurrencyPair) {
        currentTicker = null;

        continue;
      }

      currentTicker = first;

      // -----------------------------------
      // metadata
      // -----------------------------------
      const regIndex = row.findIndex((cell) => String(cell).includes("Номер рег."));

      const isinIndex = row.findIndex((cell) => String(cell).includes("ISIN"));

      const regNumber = regIndex >= 0 ? String(row[regIndex + 1] || "").trim() : "";

      const isin = isinIndex >= 0 ? String(row[isinIndex + 1] || "").trim() : "";

      // -----------------------------------
      // название инструмента
      // обычно идет после ISIN value
      // -----------------------------------

      const instrumentName = isinIndex >= 0 ? String(row[isinIndex + 2] || "").trim() : "";

      tickerMeta[currentTicker] = {
        regNumber,
        isin,
        instrumentName
      };

      //   console.log("META:", currentTicker, tickerMeta[currentTicker]);

      continue;
    }

    // -----------------------------------
    // нет ticker
    // -----------------------------------

    if (!currentTicker) {
      continue;
    }

    // -----------------------------------
    // quantity
    // -----------------------------------

    const buyQty = parseFloat(
      String(row[4] || "0")
        .replace(/\s/g, "")
        .replace(",", ".")
    );

    const sellQty = parseFloat(
      String(row[7] || "0")
        .replace(/\s/g, "")
        .replace(",", ".")
    );

    // -----------------------------------
    // пустая сделка
    // -----------------------------------

    if (!buyQty && !sellQty) {
      continue;
    }

    // -----------------------------------
    // итоговое количество
    // -----------------------------------

    const quantity = buyQty || -sellQty;

    // -----------------------------------
    // price
    // -----------------------------------

    const priceRaw = buyQty ? row[5] : row[8];

    const price = parseFloat(
      String(priceRaw || "0")
        .replace(/\s/g, "")
        .replace(",", ".")
    );

    // -----------------------------------
    // битые строки
    // -----------------------------------

    if (isNaN(price)) {
      continue;
    }

    // -----------------------------------
    // amount
    // -----------------------------------

    const amountRaw = buyQty ? row[6] : row[9];

    const amount = parseFloat(
      String(amountRaw || "0")
        .replace(/\s/g, "")
        .replace(",", ".")
    );

    // -----------------------------------
    // transaction
    // -----------------------------------

    const tx = {
      ticker: currentTicker,
      regNumber: tickerMeta[currentTicker]?.regNumber || "",
      isin: tickerMeta[currentTicker]?.isin || "",
      instrumentName: tickerMeta[currentTicker]?.instrumentName || "",
      date: first,
      quantity,
      price,
      amount,
      assetType,
      side: buyQty ? "BUY" : "SELL"
    };

    // console.log("TX:", tx);

    transactions.push(tx);
  }

  // console.log("FINAL TX:", transactions);

  return transactions;
}
