import Vue from "vue";
import Vuex from "vuex";

Vue.use(Vuex);

export default new Vuex.Store({
  state: {
    // { id: string, name: string, transactions: [] }
    files: []
  },

  getters: {
    files: (state) => state.files,

    // Объединённые транзакции из всех файлов
    allTransactions: (state) => state.files.flatMap((f) => f.transactions)
  },

  mutations: {
    ADD_FILE(state, { id, name, transactions }) {
      state.files.push({ id, name, transactions });
    },

    REMOVE_FILE(state, id) {
      state.files = state.files.filter((f) => f.id !== id);
    },

    CLEAR_FILES(state) {
      state.files = [];
    }
  },

  actions: {
    addFile({ commit }, { name, transactions }) {
      const id = `${name}-${Date.now()}`;
      commit("ADD_FILE", { id, name, transactions });
    },

    removeFile({ commit }, id) {
      commit("REMOVE_FILE", id);
    },

    clearFiles({ commit }) {
      commit("CLEAR_FILES");
    }
  }
});
