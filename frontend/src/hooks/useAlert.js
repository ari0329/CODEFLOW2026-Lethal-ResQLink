import { useEffect, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchAlerts, fetchSummary, setFilters } from "../store/alertSlice";

export const useAlerts = () => {
  const dispatch = useDispatch();
  const { items, total, summary, loading, error, filters } = useSelector(s => s.alerts);

  const load = useCallback((params) => {
    dispatch(fetchAlerts(params || filters));
  }, [dispatch, filters]);

  useEffect(() => {
    load();
    dispatch(fetchSummary());
    const timer = setInterval(() => dispatch(fetchSummary()), 30_000);
    return () => clearInterval(timer);
  }, [dispatch, load]);

  const updateFilters = useCallback((patch) => {
    dispatch(setFilters(patch));
  }, [dispatch]);

  return { alerts: items, total, summary, loading, error, filters, load, updateFilters };
};