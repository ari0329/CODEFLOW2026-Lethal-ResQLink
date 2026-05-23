import { createSlice } from '@reduxjs/toolkit';

const alertSlice = createSlice({
  name: 'alerts',
  initialState: {
    alerts: [],
    selected: null,
    loading: false
  },
  reducers: {
    setAlerts: (state, action) => {
      state.alerts = action.payload;
    },
    addAlert: (state, action) => {
      const exists = state.alerts.some(a => a._id === action.payload._id);
      if (!exists) {
        state.alerts.unshift(action.payload);
      }
    },
    updateAlert: (state, action) => {
      const idx = state.alerts.findIndex(a => a._id === action.payload._id);
      if (idx !== -1) {
        state.alerts[idx] = action.payload;
      }
      if (state.selected?._id === action.payload._id) {
        state.selected = action.payload;
      }
    },
    selectAlert: (state, action) => {
      state.selected = action.payload;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    }
  }
});

export const { setAlerts, addAlert, updateAlert, selectAlert, setLoading } = alertSlice.actions;
export default alertSlice.reducer;
