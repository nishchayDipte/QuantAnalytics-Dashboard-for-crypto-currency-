import { useEffect, useRef, useState, useCallback } from 'react';
import { Tick } from '../types';

const BINANCE_WS_URL = 'wss://fstream.binance.com/stream';

export const useBinanceStream = (symbols: string[]) => {
  const [data, setData] = useState<Record<string, Tick[]>>({});
  const [isConnected, setIsConnected] = useState(false);
  const bufferRef = useRef<Record<string, Tick[]>>({});
  const wsRef = useRef<WebSocket | null>(null);

  // Initialize buffer for new symbols
  useEffect(() => {
    symbols.forEach(sym => {
      if (!bufferRef.current[sym]) {
        bufferRef.current[sym] = [];
      }
    });
  }, [symbols]);

  useEffect(() => {
    if (symbols.length === 0) return;

    // Construct stream names: e.g., btcusdt@trade
    const streams = symbols.map(s => `${s.toLowerCase()}@trade`).join('/');
    const url = `${BINANCE_WS_URL}?streams=${streams}`;

    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
      console.log('Connected to Binance Stream');
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        // Message format: { stream: "btcusdt@trade", data: { ... } }
        if (message.stream && message.data && message.data.e === 'trade') {
          const raw = message.data;
          const symbol = raw.s.toLowerCase();
          const tick: Tick = {
            symbol: symbol,
            price: parseFloat(raw.p),
            quantity: parseFloat(raw.q),
            timestamp: raw.T // Transaction time
          };

          // Append to ref buffer directly for performance
          if (!bufferRef.current[symbol]) bufferRef.current[symbol] = [];
          
          // Keep a rolling buffer of ticks per symbol. 
          // Increased to 10,000 to support sampling at 1m/5m intervals over a longer session.
          if (bufferRef.current[symbol].length > 10000) {
             bufferRef.current[symbol].shift();
          }
          bufferRef.current[symbol].push(tick);
        }
      } catch (err) {
        console.error('WS Parse Error', err);
      }
    };

    ws.onclose = () => {
      setIsConnected(false);
      console.log('Binance Stream Closed');
    };

    return () => {
      ws.close();
    };
  }, [symbols]);

  // Flush buffer to state periodically (throttling) to update UI
  useEffect(() => {
    const interval = setInterval(() => {
      // Create a shallow copy of the buffer refs for the state
      const snapshot: Record<string, Tick[]> = {};
      symbols.forEach(s => {
        snapshot[s] = bufferRef.current[s] ? [...bufferRef.current[s]] : [];
      });
      setData(snapshot);
    }, 1000); // Update UI every 1 second

    return () => clearInterval(interval);
  }, [symbols]);

  return { data, isConnected };
};