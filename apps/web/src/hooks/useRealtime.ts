/**
 * useRealtime Hook
 * Manages WebSocket connection and event subscription
 * Connect to backend real-time events
 */

import { useEffect, useRef, useCallback } from 'react';
import { Socket } from 'socket.io-client';
import { getSocket, disconnectSocket } from '@/lib/socket';
import { useRealtimeStore } from '@/stores/realtime';
import type { RealtimeEvent } from '@/types/realtime';

interface UseRealtimeOptions {
  enabled?: boolean;
  reconnect?: boolean;
  autoSubscribeAll?: boolean;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: string) => void;
}

export function useRealtime(options: UseRealtimeOptions = {}) {
  const {
    enabled = true,
    reconnect = true,
    autoSubscribeAll = true,
    onConnect,
    onDisconnect,
    onError,
  } = options;

  const socketRef = useRef<Socket | null>(null);
  const processEvent = useRealtimeStore((s) => s.processEvent);
  const setConnected = useRealtimeStore((s) => s.setConnected);
  const setConnectionError = useRealtimeStore((s) => s.setConnectionError);

  const connect = useCallback(() => {
    if (!enabled) return;

    try {
      const socket = getSocket();
      socketRef.current = socket;

      // Connection event
      socket.on('connected', (data: any) => {
        console.log('[Realtime] Connected to server', data);
        processEvent({
          type: 'connected',
          payload: {
            clientId: data.clientId || 'unknown',
            timestamp: Date.now(),
          },
        });
        setConnected(true);
        setConnectionError(null);
        onConnect?.();
      });

      // Handle all realtime events
      socket.on('message', (data: string) => {
        try {
          const event = JSON.parse(data) as RealtimeEvent;
          console.log('[Realtime] Event received:', event.type);
          processEvent(event);
        } catch (e) {
          console.error('[Realtime] Failed to parse event:', e);
        }
      });

      // Handle specific event types if socket.io emits them as separate events
      const eventTypes = [
        'report:created',
        'report:updated',
        'report:assigned',
        'report:priority_changed',
        'settings:updated',
        'setting:category_updated',
        'staff:online',
        'staff:offline',
        'call:metrics',
        'call:quality_alert',
      ];

      eventTypes.forEach((eventType) => {
        socket.on(eventType, (payload: any) => {
          console.log('[Realtime] Event received:', eventType);
          processEvent({
            type: eventType as any,
            payload,
          });
        });
      });

      // Connection events
      socket.on('connect', () => {
        console.log('[Realtime] Socket connected');
        setConnected(true);
        setConnectionError(null);
        onConnect?.();
      });

      socket.on('disconnect', (reason) => {
        console.log('[Realtime] Socket disconnected:', reason);
        setConnected(false);
        onDisconnect?.();

        // Auto reconnect on unexpected disconnections
        if (reconnect && reason !== 'io client disconnect') {
          setTimeout(() => {
            console.log('[Realtime] Attempting to reconnect...');
            connect();
          }, 3000);
        }
      });

      socket.on('error', (error) => {
        console.error('[Realtime] Socket error:', error);
        const errorMessage = error?.message || 'Connection error';
        setConnectionError(errorMessage);
        onError?.(errorMessage);
      });

      socket.on('connect_error', (error) => {
        console.error('[Realtime] Connection error:', error);
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to connect';
      console.error('[Realtime] Failed to establish connection:', error);
      setConnectionError(errorMessage);
      onError?.(errorMessage);
    }
  }, [enabled, reconnect, processEvent, setConnected, setConnectionError, onConnect, onDisconnect, onError]);

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      disconnectSocket();
      socketRef.current = null;
      setConnected(false);
    }
  }, [setConnected]);

  const emit = useCallback(
    (event: string, data: any) => {
      if (!socketRef.current?.connected) {
        console.warn('[Realtime] Socket not connected, cannot emit event:', event);
        return;
      }
      socketRef.current?.emit(event, data);
      console.log('[Realtime] Event emitted:', event);
    },
    []
  );

  const subscribe = useCallback((event: string, handler: (data: any) => void) => {
    if (!socketRef.current) {
      console.warn('[Realtime] Socket not initialized, cannot subscribe:', event);
      return;
    }
    socketRef.current.on(event, handler);
    return () => {
      socketRef.current?.off(event, handler);
    };
  }, []);

  // Initialize connection on mount
  useEffect(() => {
    if (enabled) {
      connect();
    }
    return () => {
      disconnect();
    };
  }, [enabled, connect, disconnect]);

  return {
    socket: socketRef.current,
    connect,
    disconnect,
    emit,
    subscribe,
    isConnected: socketRef.current?.connected ?? false,
  };
}

/**
 * Hook to subscribe to specific event types
 */
export function useRealtimeEvent(
  eventType: string,
  handler: (payload: any) => void,
  options: { enabled?: boolean } = {}
) {
  const { enabled = true } = options;
  const { subscribe } = useRealtime({ enabled });

  useEffect(() => {
    if (!enabled) return;
    return subscribe(eventType, handler);
  }, [eventType, handler, enabled, subscribe]);
}

/**
 * Hook to track a specific staff member's online status
 */
export function useStaffStatus(staffId: string | undefined) {
  const getStaffStatus = useRealtimeStore((s) => s.getStaffStatus);

  return getStaffStatus(staffId || '');
}

/**
 * Hook to track call metrics for a specific call
 */
export function useCallMetrics(callId: string | undefined) {
  const getCallMetrics = useRealtimeStore((s) => s.getCallMetrics);

  return getCallMetrics(callId || '');
}
