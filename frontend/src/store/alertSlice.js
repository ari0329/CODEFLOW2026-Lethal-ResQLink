import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import cfg from "../config";

export const fetchAlerts = createAsyncThunk("alerts/fetchAll", async (params = {}) => {
  const { data } = await axios.get(`${cfg.API_URL}/api/alerts`, {
    params,
    headers: { Authorization: `Bearer ${localStorage.getItem("rq_token")}` },
  });
  return data;
});

export const fetchSummary = createAsyncThunk("alerts/summary", async () => {
  const { data } = await axios.get(`${cfg.API_URL}/api/analytics/summary`);
  return data;
});

export const verifyAlert = createAsyncThunk("alerts/verify", async ({ id, status, notes }) => {
  const { data } = await axios.patch(
    `${cfg.API_URL}/api/alerts/${id}/verify`,
    { status, notes },
    { headers: { Authorization: `Bearer ${localStorage.getItem("rq_token")}` } }
  );
  return data.alert;
});

const alertSlice = createSlice({
  name: "alerts",
  initialState: {
    items:      [],
    total:      0,
    summary:    null,
    loading:    false,
    error:      null,
    selected:   null,
    filters:    { status: "", severity: "", type: "" },
  },
  reducers: {
    addLiveAlert(state, { payload }) {
      // Prepend and cap at 500
      state.items = [payload, ...state.items.filter(a => a._id !== payload._id)].slice(0, 500);
      state.total += 1;
    },
    updateAlert(state, { payload }) {
      const idx = state.items.findIndex(a => a._id === payload._id);
      if (idx !== -1) state.items[idx] = { ...state.items[idx], ...payload };
    },
    removeAlert(state, { payload }) {
      state.items = state.items.filter(a => a._id !== payload._id);
    },
    selectAlert(state, { payload }) {
      state.selected = payload;
    },
    setFilters(state, { payload }) {
      state.filters = { ...state.filters, ...payload };
    },
    clearError(state) {
      state.error = null;
    },
  },
  extraReducers: (b) => {
    b.addCase(fetchAlerts.pending,  (s) => { s.loading = true; s.error = null; });
    b.addCase(fetchAlerts.fulfilled,(s, { payload }) => {
      s.loading = false; s.items = payload.alerts; s.total = payload.pagination.total;
    });
    b.addCase(fetchAlerts.rejected, (s, { error }) => { s.loading = false; s.error = error.message; });

    b.addCase(fetchSummary.fulfilled, (s, { payload }) => { s.summary = payload; });

    b.addCase(verifyAlert.fulfilled, (s, { payload }) => {
      const idx = s.items.findIndex(a => a._id === payload._id);
      if (idx !== -1) s.items[idx] = payload;
    });
  },
});

export const { addLiveAlert, updateAlert, removeAlert, selectAlert, setFilters, clearError } = alertSlice.actions;
export default alertSlice.reducer;