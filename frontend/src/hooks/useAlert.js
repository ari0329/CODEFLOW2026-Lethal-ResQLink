import { useEffect, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setFilters } from "../store/alertSlice";

export const useAlerts = () => {
  const dispatch = useDispatch();

  const {
    alerts,
    filters,
  } = useSelector((s) => s.alerts);

  useEffect(() => {
   
  }, []);

  const updateFilters = useCallback((patch) => {
    dispatch(setFilters(patch));
  }, [dispatch]);

  return {
    alerts,
    filters,
    updateFilters,
  };
};