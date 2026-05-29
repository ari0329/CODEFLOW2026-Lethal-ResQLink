import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

// ===============================
// Async Thunks
// ===============================

// Fetch alerts
export const fetchAlerts = createAsyncThunk(
  "alerts/fetchAlerts",
  async (_, thunkAPI) => {
    try {
      const response = await axios.get(
        "http://localhost:4000/api/alerts"
      );

      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data || "Failed to fetch alerts"
      );
    }
  }
);

// Verify alert
export const verifyAlert = createAsyncThunk(
  "alerts/verifyAlert",
  async (alertId, thunkAPI) => {
    try {
      const response = await axios.patch(
        `http://localhost:4000/api/alerts/${alertId}/verify`
      );

      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data || "Failed to verify alert"
      );
    }
  }
);

// ===============================
// Initial State
// ===============================

const initialState = {
  alerts: [],
  selectedAlert: null,

  filters: {
    severity: "",
    status: "",
    search: "",
  },

  loading: false,
  error: null,
};

// ===============================
// Slice
// ===============================

const alertSlice = createSlice({
  name: "alerts",
  initialState,

  reducers: {
    addLiveAlert: (state, action) => {
      state.alerts.unshift(action.payload);
    },

    updateAlert: (state, action) => {
      const index = state.alerts.findIndex(
        alert => alert._id === action.payload._id
      );

      if (index !== -1) {
        state.alerts[index] = action.payload;
      }
    },

    removeAlert: (state, action) => {
      state.alerts = state.alerts.filter(
        alert => alert._id !== action.payload
      );
    },

    clearAlerts: (state) => {
      state.alerts = [];
    },

    setFilters: (state, action) => {
      state.filters = {
        ...state.filters,
        ...action.payload,
      };
    },

    selectAlert: (state, action) => {
      state.selectedAlert = action.payload;
    },
  },

  extraReducers: (builder) => {
    builder

      // Fetch Alerts
      .addCase(fetchAlerts.pending, (state) => {
        state.loading = true;
      })

      .addCase(fetchAlerts.fulfilled, (state, action) => {
        state.loading = false;
        state.alerts = action.payload || [];
      })

      .addCase(fetchAlerts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Verify Alert
      .addCase(verifyAlert.fulfilled, (state, action) => {
        const index = state.alerts.findIndex(
          alert => alert._id === action.payload._id
        );

        if (index !== -1) {
          state.alerts[index] = action.payload;
        }
      });
  },
});

export const {
  addLiveAlert,
  updateAlert,
  removeAlert,
  clearAlerts,
  setFilters,
  selectAlert,
} = alertSlice.actions;

export default alertSlice.reducer;