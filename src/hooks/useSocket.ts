import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

type MessageData = {
  content: string;
  timestamp: number;
  sender?: string;
};

export const useSocket = () => {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // Initialize socket connection
    socketRef.current = io();

    // Cleanup on unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  const sendMessage = (message: MessageData) => {
    if (socketRef.current) {
      socketRef.current.emit('message', message);
    }
  };

  const onMessage = (callback: (data: MessageData) => void) => {
    if (socketRef.current) {
      socketRef.current.on('message', callback);
    }
  };

  return {
    sendMessage,
    onMessage,
  };
}; 