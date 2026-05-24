import { useEffect, useRef } from "react";
import { io } from "socket.io-client";
import { useDispatch } from "react-redux";
import { addLiveAlert, updateAlert, removeAlert } from "../store/alertSlice";
import cfg from "../config";

let socketInstance = null;

export const useSocket = () => {
  const dispatch    = useDispatch();
  const socketRef   = useRef(null);

  useEffect(() => {
    if (socketInstance) { socketRef.current = socketInstance; return; }

    const token = localStorage.getItem("rq_token");
    const socket = io(cfg.WS_URL, {
      auth:       { token },
      transports: ["websocket","polling"],
      reconnectionAttempts: 10,
      reconnectionDelay:    2000,
    });

    socket.on("connect",       () => console.info("WS connected:", socket.id));
    socket.on("disconnect",    (r) => console.warn("WS disconnected:", r));
    socket.on("connect_error", (e) => console.error("WS error:", e.message));

    socket.on("alert:new",     (a) => dispatch(addLiveAlert(a)));
    socket.on("alert:kafka",   (a) => dispatch(addLiveAlert(a)));
    socket.on("alert:updated", (a) => dispatch(updateAlert(a)));
    socket.on("alert:deleted", (a) => dispatch(removeAlert(a)));

    socketInstance   = socket;
    socketRef.current = socket;

    return () => {};   // intentionally persistent across re-renders
  }, [dispatch]);

  return socketRef.current;
};