<template>
  <v-container>
    <v-card class="pa-5 mb-5">
      <h1>Profit Analyzer</h1>

      <v-file-input v-model="file" label="Загрузить Excel отчет" accept=".xlsx,.xls" show-size @change="handleFileUpload" />
    </v-card>

    <v-card class="pa-5 mb-5" v-if="portfolio.length">
      <h2 class="mb-4">Portfolio</h2>

      <v-data-table :headers="portfolioHeaders" :items="portfolio" class="elevation-1" />
    </v-card>
  </v-container>
</template>

<script>
import * as XLSX from "xlsx";
import { parseBCSReport } from "../parser/bcsParser";
import { buildPortfolio } from "../analytics/portfolioEngine";

export default {
  name: "PortfolioPage",

  data() {
    return {
      file: null,

      headers: [],

      rows: [],

      transactions: [],

      portfolio: [],

      portfolioHeaders: [
        {
          text: "Ticker",
          value: "ticker"
        },
        {
          text: "Quantity",
          value: "quantity"
        },
        {
          text: "Avg Price",
          value: "avgPrice"
        },
        {
          text: "Invested",
          value: "invested"
        },
        {
          text: "PnL",
          value: "realizedPnL"
        },
        {
          text: "Dividends",
          value: "dividends"
        }
      ]
    };
  },

  methods: {
    handleFileUpload(files) {
      const file = Array.isArray(files) ? files[0] : files;

      if (!file) {
        console.log("NO FILE");
        return;
      }

      console.log("FILE INPUT:", file);

      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          console.log("FILE READ OK");

          // -----------------------------------
          // читаем excel
          // -----------------------------------
          const data = new Uint8Array(e.target.result);

          const workbook = XLSX.read(data, {
            type: "array"
          });

          console.log("SHEETS:", workbook.SheetNames);

          const firstSheetName = workbook.SheetNames[0];

          const worksheet = workbook.Sheets[firstSheetName];

          // -----------------------------------
          // excel -> array
          // -----------------------------------
          const jsonData = XLSX.utils.sheet_to_json(worksheet, {
            header: 1,
            defval: ""
          });

          console.log("TOTAL ROWS:", jsonData.length);

          // -----------------------------------
          // ищем блок сделок
          // -----------------------------------
          const startIndex = jsonData.findIndex((row) => row.includes("2.1. Сделки:"));

          const endIndex = jsonData.findIndex((row) => row.includes("2.3. Незавершенные сделки"));

          console.log("START INDEX:", startIndex);

          console.log("END INDEX:", endIndex);

          if (startIndex === -1 || endIndex === -1) {
            console.error("НЕ НАЙДЕН БЛОК СДЕЛОК");
            return;
          }

          // -----------------------------------
          // только сделки
          // -----------------------------------
          this.rows = jsonData.slice(startIndex, endIndex).filter((row) => row && row.some((cell) => String(cell).trim() !== ""));

          console.log("FILTERED ROWS:", this.rows.length);

          //   console.log("SAMPLE ROWS:", this.rows.slice(0, 20));

          // -----------------------------------
          // parser
          // -----------------------------------
          this.transactions = parseBCSReport(this.rows);

          //   console.log("TRANSACTIONS:", this.transactions);

          // -----------------------------------
          // portfolio
          // -----------------------------------
          this.portfolio = buildPortfolio(this.transactions);

          //   console.log("PORTFOLIO:", this.portfolio);
        } catch (err) {
          console.error("PARSE ERROR:", err);
        }
      };

      reader.onerror = (err) => {
        console.error("FILE READ ERROR:", err);
      };

      reader.readAsArrayBuffer(file);
    }
  }
};
</script>

<style scoped>
.portfolio-page {
  padding: 20px;
}

table {
  margin-top: 20px;
  border-collapse: collapse;
}

td,
th {
  padding: 8px;
}
</style>
