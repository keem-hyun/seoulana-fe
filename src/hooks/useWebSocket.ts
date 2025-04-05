import { useEffect, useState, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

type WebSocketEvent = {
  roomId: string;
  lastMessageTime: string | null;
  clientCount?: number;
};

// This is a custom hook to handle WebSocket connections to communities
export const useWebSocket = (communityId: string) => {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessageTime, setLastMessageTime] = useState<string | null>(null);
  const [clientCount, setClientCount] = useState<number>(0);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // Create socket connection
    const socket = io(`${process.env.NEXT_PUBLIC_API_URL}/communities`, {
      transports: ['websocket'],
      withCredentials: true,
    });

    socketRef.current = socket;

    // Connection event handlers
    socket.on('connect', () => {
      console.log('WebSocket connected');
      setIsConnected(true);
      
      // Join the room for this community
      socket.emit('joinRoom', communityId, (response: { event: string, data: WebSocketEvent }) => {
        if (response.event === 'roomJoined') {
          console.log('Joined room:', response.data);
          setLastMessageTime(response.data.lastMessageTime);
          if (response.data.clientCount) {
            setClientCount(response.data.clientCount);
          }
        } else if (response.event === 'error') {
          console.error('Error joining room:', response);
        }
      });
    });

    socket.on('disconnect', () => {
      console.log('WebSocket disconnected');
      setIsConnected(false);
    });

    socket.on('error', (error) => {
      console.error('WebSocket error:', error);
    });

    // Listen for lastMessageTime updates
    socket.on('lastMessageTimeUpdated', (data: WebSocketEvent) => {
      console.log('Last message time updated:', data);
      if (data.roomId === communityId) {
        setLastMessageTime(data.lastMessageTime);
      }
    });

    // Cleanup on unmount
    return () => {
      if (socket) {
        // Leave the room before disconnecting
        socket.emit('leaveRoom', communityId);
        socket.disconnect();
      }
    };
  }, [communityId]);

  // Function to manually disconnect
  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.emit('leaveRoom', communityId);
      socketRef.current.disconnect();
      setIsConnected(false);
    }
  }, [communityId]);

  return {
    isConnected,
    lastMessageTime,
    clientCount,
    disconnect
  };
};