import { useEffect } from 'react'
import io from 'socket.io-client'

const socket = io()

export default function useSocket(eventName: string, callback: (payload?: any) => void) {
  useEffect(() => {
    socket.on(eventName, callback)

    return function useSocketCleanup() {
      socket.off(eventName, callback)
    }
  }, [eventName, callback])

  return socket
}