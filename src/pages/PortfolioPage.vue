<template>
  <div class="portfolio-page">
    <h1>Profit Analyzer</h1>

    <input type="file" accept=".xlsx,.xls" @change="handleFileUpload" />

    <div v-if="rows.length">
      <h2>Данные из Excel</h2>

      <table border="1" cellpadding="5">
        <thead>
          <tr>
            <th v-for="(header, index) in headers" :key="index">
              {{ header }}
            </th>
          </tr>
        </thead>

        <tbody>
          <tr v-for="(row, rowIndex) in rows" :key="rowIndex">
            <td v-for="(cell, cellIndex) in row" :key="cellIndex">
              {{ cell }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script>
import * as XLSX from "xlsx";

export default {
  name: "PortfolioPage",

  data() {
    return {
      headers: [],
      rows: []
    };
  },

  methods: {
    handleFileUpload(event) {
      const file = event.target.files[0];

      if (!file) return;

      const reader = new FileReader();

      reader.onload = (e) => {
        const data = new Uint8Array(e.target.result);

        const workbook = XLSX.read(data, {
          type: "array"
        });

        const firstSheetName = workbook.SheetNames[0];

        const worksheet = workbook.Sheets[firstSheetName];

        const jsonData = XLSX.utils.sheet_to_json(worksheet, {
          header: 1
        });

        this.headers = jsonData[0] || [];
        this.rows = jsonData.slice(1);
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
