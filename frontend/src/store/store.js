import { configureStore } from '@reduxjs/toolkit';
import alertReducer from './alertSlice';

export const store = configureStore({
  reducer: {
    alerts: alertReducer
  }
});
