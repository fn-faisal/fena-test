import '../styles/globals.css'
import type { AppProps } from 'next/app'
import { useEffect, useState } from 'react';
import io from 'socket.io-client'

export default function App({ Component, pageProps }: AppProps) {
  const [ socket, setSocket ] = useState<any>();

  useEffect(() => {
    (async () => {
      setSocket(io());
    })();

    return () => {
      socket?.close();
      setSocket(undefined);
    }
  },[]);

  return <Component {...pageProps} socket={socket} />
}
