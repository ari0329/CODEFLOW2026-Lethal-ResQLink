import { configureStore } from "@reduxjs/toolkit";

import authReducer from "./authSlice";
import alertReducer from "./alertSlice";

const store = configureStore({
  reducer: {
    auth: authReducer,
    alerts: alertReducer,
  },
});

export default store;