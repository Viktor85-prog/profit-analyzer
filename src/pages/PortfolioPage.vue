<template>
  <v-container>
    <v-card class="pa-5 mb-5">
      <h1>Profit Analyzer</h1>

      <v-file-input v-model="file" label="Загрузить Excel отчет" accept=".xlsx,.xls" show-size @change="handleFileUpload" />
    </v-card>
    <v-row v-if="portfolio.length" class="mb-4">
      <v-col cols="12" md="2">
        <v-card class="pa-4 stat-card">
          <div class="stat-label">Стоимость</div>

          <div class="stat-value">
            {{ formatMoney(totalPortfolioValue) }}
          </div>
        </v-card>
      </v-col>

      <v-col cols="12" md="2">
        <v-card class="pa-4 stat-card">
          <div class="stat-label">Вложено</div>

          <div class="stat-value">
            {{ formatMoney(totalInvested) }}
          </div>
        </v-card>
      </v-col>

      <v-col cols="12" md="2">
        <v-card class="pa-4 stat-card">
          <div class="stat-label">Total PnL</div>

          <div class="stat-value" :class="getPnLClass(totalPnL)">
            {{ formatMoney(totalPnL) }}
          </div>
        </v-card>
      </v-col>

      <v-col cols="12" md="2">
        <v-card class="pa-4 stat-card">
          <div class="stat-label">Total %</div>

          <div class="stat-value" :class="getPnLClass(totalPnLPercent)">{{ totalPnLPercent.toFixed(2) }}%</div>
        </v-card>
      </v-col>

      <v-col cols="12" md="2">
        <v-card class="pa-4 stat-card">
          <div class="stat-label">Дивиденды</div>

          <div class="stat-value">
            {{ formatMoney(totalDividends) }}
          </div>
        </v-card>
      </v-col>

      <v-col cols="12" md="2">
        <v-card class="pa-4 stat-card">
          <div class="stat-label">Сделки PnL</div>

          <div class="stat-value" :class="getPnLClass(totalRealizedPnL)">
            {{ formatMoney(totalRealizedPnL) }}
          </div>
        </v-card>
      </v-col>
    </v-row>
    <v-card class="pa-5 mb-5" v-if="portfolio.length">
      <div class="d-flex align-center justify-space-between mb-4">
        <h2>Portfolio</h2>

        <v-menu offset-y>
          <template v-slot:activator="{ on, attrs }">
            <v-btn icon v-bind="attrs" v-on="on">
              <v-icon>mdi-filter-variant</v-icon>
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

      <v-data-table :headers="portfolioHeaders" :items="portfolio" class="elevation-1 portfolio-table">
        <template v-slot:item="{ item, headers }">
          <tr>
            <td v-for="header in headers" :key="header.value" :class="getCellClass(item[header.value], header)">
              {{ formatValue(item[header.value], header.format) }}
            </td>
          </tr>
        </template>
      </v-data-table>
    </v-card>
  </v-container>
</template>

<script>
import * as XLSX from "xlsx";

import { parseBCSReport } from "../parser/bcsParser";

import { buildPortfolio } from "../analytics/portfolioEngine";

import { enrichPortfolioWithMarketData } from "../analytics/marketEnricher";

import { loadMoexRegistry } from "../services/moexRegistry";

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
          text: "Тикер",
          value: "moexTicker",
          visible: true
        },

        {
          text: "Сектор",
          value: "sector",
          visible: true
        },

        {
          text: "Qty",
          value: "quantity",
          visible: true,
          format: "number"
        },

        {
          text: "Цена",
          value: "avgPrice",
          visible: true,
          format: "money"
        },
        {
          text: "Тек. цена",
          value: "currentPrice",
          visible: false,
          format: "money"
        },

        {
          text: "Вложено",
          value: "invested",
          visible: false,
          format: "money"
        },

        // -------------------
        // TOGGLEABLE
        // -------------------

        {
          text: "Trading PnL",
          value: "realizedPnL",
          visible: false,
          toggleable: true,
          format: "money",
          colorize: true
        },

        {
          text: "Trading %",
          value: "realizedPnLPercent",
          visible: false,
          toggleable: true,
          format: "percent",
          colorize: true
        },

        {
          text: "Dividends",
          value: "dividends",
          visible: false,
          toggleable: true,
          format: "money",
          colorize: true
        },

        {
          text: "Dividend %",
          value: "dividendYieldPercent",
          visible: false,
          toggleable: true,
          format: "percent",
          colorize: true
        },

        {
          text: "Total PnL",
          value: "totalPnL",
          visible: true,
          toggleable: true,
          format: "money",
          colorize: true
        },

        {
          text: "Total %",
          value: "totalPnLPercent",
          visible: true,
          toggleable: true,
          format: "percent",
          colorize: true
        },

        // -------------------
        // MARKET
        // -------------------

        {
          text: "Состояние",
          value: "positionValue",
          visible: true,
          toggleable: true,
          format: "money"
        },

        {
          text: "Unrealized",
          value: "unrealizedPnL",
          visible: true,
          toggleable: true,
          format: "money",
          colorize: true
        },

        {
          text: "Unrealized %",
          value: "unrealizedPnLPercent",
          visible: true,
          toggleable: true,
          format: "percent",
          colorize: true
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
        if (["moexTicker", "quantity", "avgPrice", "invested", "currentPrice"].includes(h.value)) {
          return true;
        }

        return h.visible;
      });
    },

    optionalHeaders() {
      return this.allPortfolioHeaders.filter((h) => h.toggleable);
    },

    totalPortfolioValue() {
      return this.portfolio.reduce((sum, item) => {
        return sum + Number(item.positionValue || 0);
      }, 0);
    },

    totalInvested() {
      return this.portfolio.reduce((sum, item) => {
        return sum + Number(item.invested || 0);
      }, 0);
    },

    totalPnL() {
      return this.portfolio.reduce((sum, item) => {
        return sum + Number(item.totalPnL || 0);
      }, 0);
    },

    totalPnLPercent() {
      if (!this.totalInvested) {
        return 0;
      }

      return (this.totalPnL / this.totalInvested) * 100;
    },

    totalDividends() {
      return this.portfolio.reduce((sum, item) => {
        return sum + Number(item.dividends || 0);
      }, 0);
    },

    totalRealizedPnL() {
      return this.portfolio.reduce((sum, item) => {
        return sum + Number(item.realizedPnL || 0);
      }, 0);
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
    formatMoney(value) {
      return new Intl.NumberFormat("ru-RU", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(Number(value || 0));
    },

    getPnLClass(value) {
      if (value > 0) {
        return "profit";
      }

      if (value < 0) {
        return "loss";
      }

      return "";
    },
    // -------------------
    // FORMATTERS
    // -------------------

    formatValue(value, format) {
      if (value === null || value === undefined || value === "") {
        return "-";
      }

      switch (format) {
        case "money":
          if (!Number(value)) {
            return "-";
          }
          return Number(value).toFixed(2);

        case "percent":
          if (!Number(value)) {
            return "-";
          }
          return `${Number(value).toFixed(2)}%`;

        case "number":
          return Number(value).toFixed(2);

        default:
          return value;
      }
    },

    // -------------------
    // CELL COLORS
    // -------------------

    getCellClass(value, header) {
      if (!header.colorize) {
        return "";
      }

      const number = Number(value);

      if (number > 0) {
        return "profit";
      }

      if (number < 0) {
        return "loss";
      }

      return "";
    },

    // -------------------
    // COLUMN FILTERS
    // -------------------

    showAllColumns() {
      this.allPortfolioHeaders.forEach((h) => {
        h.visible = true;
      });
    },

    hideOptionalColumns() {
      this.allPortfolioHeaders.forEach((h) => {
        if (h.toggleable) {
          h.visible = false;
        }
      });
    },

    // -------------------
    // FILE UPLOAD
    // -------------------

    handleFileUpload(files) {
      const file = Array.isArray(files) ? files[0] : files;

      if (!file) {
        console.log("NO FILE");

        return;
      }

      console.log("FILE INPUT:", file);

      const reader = new FileReader();

      reader.onload = async (e) => {
        try {
          console.log("FILE READ OK");

          // -------------------
          // READ EXCEL
          // -------------------

          const data = new Uint8Array(e.target.result);

          const workbook = XLSX.read(data, {
            type: "array"
          });

          console.log("SHEETS:", workbook.SheetNames);

          const firstSheetName = workbook.SheetNames[0];

          const worksheet = workbook.Sheets[firstSheetName];

          // -------------------
          // EXCEL -> JSON
          // -------------------

          const jsonData = XLSX.utils.sheet_to_json(worksheet, {
            header: 1,
            defval: ""
          });

          console.log("TOTAL ROWS:", jsonData.length);

          // -------------------
          // FIND DEALS BLOCK
          // -------------------

          const startIndex = jsonData.findIndex((row) => row.includes("2.1. Сделки:"));

          const endIndex = jsonData.findIndex((row) => row.includes("2.3. Незавершенные сделки"));

          console.log("START INDEX:", startIndex);

          console.log("END INDEX:", endIndex);

          if (startIndex === -1 || endIndex === -1) {
            console.error("НЕ НАЙДЕН БЛОК СДЕЛОК");

            return;
          }

          // -------------------
          // FILTER ROWS
          // -------------------

          //   this.rows = jsonData.slice(startIndex, endIndex).filter((row) => row && row.some((cell) => String(cell).trim() !== ""));
          // -------------------
          // FILTER ROWS
          // -------------------

          const rawRows = jsonData.slice(startIndex, endIndex).filter((row) => row && row.some((cell) => String(cell).trim() !== ""));

          // -------------------
          // DETECT ASSET TYPES
          // -------------------

          let currentAssetType = null;

          this.rows = rawRows.map((row) => {
            const rowText = row.join(" ").trim().toLowerCase();

            // -------------------
            // sections
            // -------------------
            // console.log(rowText);
            if (rowText.includes("акция")) {
              currentAssetType = "shares";
            }

            if (rowText.includes("облигация")) {
              currentAssetType = "bonds";
            }

            if (rowText.includes("пай")) {
              currentAssetType = "etfs";
            }

            if (rowText.includes("драгоценные")) {
              currentAssetType = "metals";
            }

            if (rowText.includes("займы")) {
              currentAssetType = "loans";
            }

            return {
              assetType: currentAssetType,
              row
            };
          });

          console.log("ROWS WITH TYPES:", this.rows);

          console.log("FILTERED ROWS:", this.rows.length);

          // -------------------
          // PARSE TRANSACTIONS
          // -------------------

          this.transactions = parseBCSReport(this.rows);

          console.log("TRANSACTIONS:", this.transactions);

          // -------------------
          // BUILD PORTFOLIO
          // -------------------

          this.portfolio = buildPortfolio(this.transactions);

          console.log("PORTFOLIO BEFORE ENRICH:", this.portfolio);

          // -------------------
          // LOAD MOEX REGISTRY
          // -------------------

          await loadMoexRegistry();

          // -------------------
          // ENRICH MARKET DATA
          // -------------------

          this.portfolio = await enrichPortfolioWithMarketData(this.portfolio);

          console.log("FINAL PORTFOLIO:", this.portfolio);
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
.stat-card {
  border-radius: 14px;
  transition: 0.2s ease;
}

.stat-card:hover {
  transform: translateY(-2px);
}

.stat-label {
  font-size: 13px;
  color: #888;
  margin-bottom: 10px;
}

.stat-value {
  font-size: 20px;
  font-weight: 700;
  line-height: 1.2;
}
.portfolio-page {
  padding: 10px;
}

table {
  margin-top: 20px;
  border-collapse: collapse;
}

td,
th {
  padding: 8px;
}

.profit {
  color: #4caf50;
  font-weight: 600;
}

.loss {
  color: #f44336;
  font-weight: 600;
}

.portfolio-table ::v-deep thead th {
  white-space: nowrap;
  height: 56px;
  vertical-align: middle;
  font-weight: 600;
  font-size: 14px;
}

.portfolio-table ::v-deep tbody td {
  white-space: nowrap;
  height: 52px;
  vertical-align: middle;
}

.portfolio-table ::v-deep table {
  table-layout: auto;
}

.portfolio-table {
  border-radius: 12px;
  overflow: hidden;
}
</style>
