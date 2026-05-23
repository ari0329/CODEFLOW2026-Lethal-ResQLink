
import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { useDispatch } from 'react-redux';
import { addAlert, updateAlert } from '../store/alertSlice';
import config from '../config';

export function useSocket() {
  const dispatch = useDispatch();
  const socketRef = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const socket = io(config.SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
    });
    socketRef.current = socket;

    socket.on('connect',     () => console.log('Socket connected:', socket.id));
    socket.on('disconnect',  () => console.log('Socket disconnected'));
    socket.on('new_alert',   (a) => dispatch(addAlert(a)));
    socket.on('alert_updated',(a) => dispatch(updateAlert(a)));

    return () => socket.disconnect();
  }, [dispatch]);

  return socketRef;
}