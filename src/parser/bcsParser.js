export function parseBCSReport(rows) {
  const transactions = [];

  let currentTicker = null;

  for (const row of rows) {
    if (!row || !row.length) {
      continue;
    }

    // -----------------------------------
    // у БКС первая колонка пустая
    // -----------------------------------
    const first = String(row[1] || "").trim();

    // -----------------------------------
    // пропуск пустых строк
    // -----------------------------------
    if (!first) {
      continue;
    }

    // -----------------------------------
    // пропуск мусора
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
    // дата сделки
    // -----------------------------------
    const isTradeRow = /^\d{2}\.\d{2}\.\d{2}$/.test(first);

    // -----------------------------------
    // строка тикера
    // -----------------------------------
    if (!isTradeRow) {
      // -----------------------------------
      // игнор валютных пар
      // -----------------------------------
      const isCurrencyPair =
        first.includes("RUB_TOM") || first.includes("RUB_TOD") || first.includes("USDT") || first.includes("EURRUB") || first.includes("CNYRUB");

      if (isCurrencyPair) {
        currentTicker = null;
        continue;
      }

      currentTicker = first;

      //   console.log("TICKER:", currentTicker);

      continue;
    }

    // -----------------------------------
    // если тикера нет — пропуск
    // -----------------------------------
    if (!currentTicker) {
      continue;
    }

    // -----------------------------------
    // колонки БКС
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
    // нет сделки
    // -----------------------------------
    if (!buyQty && !sellQty) {
      continue;
    }

    // -----------------------------------
    // quantity
    // -----------------------------------
    const quantity = buyQty || -sellQty;

    // -----------------------------------
    // цена
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
    // сумма
    // -----------------------------------
    const amountRaw = buyQty ? row[6] : row[9];

    const amount = parseFloat(
      String(amountRaw || "0")
        .replace(/\s/g, "")
        .replace(",", ".")
    );

    const tx = {
      ticker: currentTicker,

      date: first,

      quantity,

      price,

      amount,

      side: buyQty ? "BUY" : "SELL"
    };

    // console.log("TX:", tx);

    transactions.push(tx);
  }

  //   console.log("FINAL TX:", transactions);

  return transactions;
}
