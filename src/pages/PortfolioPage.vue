<template>
  <v-container>
    <v-card class="pa-5 mb-5">
      <h1>Profit Analyzer</h1>

      <v-file-input v-model="file" label="Загрузить Excel отчет" accept=".xlsx,.xls" show-size @change="handleFileUpload" />
    </v-card>

    <v-card class="pa-5 mb-5" v-if="portfolio.length">
      <div class="d-flex align-center justify-space-between mb-4">
        <h2>Portfolio</h2>

        <v-menu offset-y>
          <template v-slot:activator="{ on, attrs }">
            <v-btn icon v-bind="attrs" v-on="on">
              <v-icon> mdi-filter-variant </v-icon>
            </v-btn>
          </template>

          <v-card width="260" class="pa-2">
            <div class="d-flex justify-space-between mb-2">
              <v-btn small text @click="showAllColumns"> All </v-btn>

              <v-btn small text @click="hideOptionalColumns"> Clear </v-btn>
            </div>

            <v-divider class="mb-2" />

            <v-checkbox v-for="header in optionalHeaders" :key="header.value" v-model="header.visible" :label="header.text" dense hide-details class="mt-1" />
          </v-card>
        </v-menu>
      </div>
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

      allPortfolioHeaders: [
        {
          text: "Ticker",
          value: "ticker",
          visible: true
        },
        {
          text: "Qty",
          value: "quantity",
          visible: true
        },
        {
          text: "Avg Price",
          value: "avgPrice",
          visible: true
        },
        {
          text: "Invested",
          value: "invested",
          visible: true
        },

        // -------------------
        // toggleable
        // -------------------

        {
          text: "Trading PnL",
          value: "realizedPnL",
          visible: true,
          toggleable: true
        },
        {
          text: "Trading %",
          value: "realizedPnLPercent",
          visible: true,
          toggleable: true
        },
        {
          text: "Dividends",
          value: "dividends",
          visible: true,
          toggleable: true
        },
        {
          text: "Dividend %",
          value: "dividendYieldPercent",
          visible: true,
          toggleable: true
        },
        {
          text: "Total PnL",
          value: "totalPnL",
          visible: true,
          toggleable: true
        },
        {
          text: "Total %",
          value: "totalPnLPercent",
          visible: true,
          toggleable: true
        }
      ]
    };
  },
  created() {
    const saved = localStorage.getItem("portfolio-columns");

    if (saved) {
      this.allPortfolioHeaders = JSON.parse(saved);
    }
  },
  computed: {
    portfolioHeaders() {
      return this.allPortfolioHeaders.filter((h) => {
        // обязательные поля всегда видны
        if (["ticker", "quantity", "avgPrice", "invested"].includes(h.value)) {
          return true;
        }

        return h.visible;
      });
    },

    optionalHeaders() {
      return this.allPortfolioHeaders.filter((h) => h.toggleable);
    }
  },
  watch: {
    allPortfolioHeaders: {
      deep: true,
      handler(val) {
        localStorage.setItem("portfolio-columns", JSON.stringify(val));
      }
    }
  },
  methods: {
    showAllColumns() {
      this.allPortfolioHeaders.forEach((h) => {
        h.visible = true;
      });
    },

    hideOptionalColumns() {
      this.allPortfolioHeaders.forEach((h) => {
        if (!h.required) {
          h.visible = false;
        }
      });
    },
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
