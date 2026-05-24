import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setAlerts, setLoading } from '../store/alertSlice';
import axios from 'axios';
import config from '../config';

export function useAlerts() {
  const dispatch = useDispatch();
  const alerts  = useSelector(s => s.alerts.alerts);
  const loading = useSelector(s => s.alerts.loading);
  const selected = useSelector(s => s.alerts.selected);

  useEffect(() => {
    async function fetchAlerts() {
      dispatch(setLoading(true));
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`${config.API_URL}/api/alerts`, {
          headers: { Authorization: `Bearer ${token}` },
          params: { limit: 100 }
        });
        dispatch(setAlerts([
  { _id:'1', emergencyType:'flood', severity:'critical', cleanedText:'Water rising near colony', locationText:'Kolkata', urgencyScore:92, verified:true, coordinates:{ lat:22.5726, lng:88.3639 } },
  { _id:'2', emergencyType:'fire',  severity:'high',     cleanedText:'Building on fire',         locationText:'Mumbai',  urgencyScore:78, verified:false, coordinates:{ lat:19.0760, lng:72.8777 } },
]));
      } catch (err) {
        console.error('Failed to fetch alerts:', err.message);
      } finally {
        dispatch(setLoading(false));
      }
    }
    fetchAlerts();
  }, [dispatch]);

  return { alerts, loading, selected };
}