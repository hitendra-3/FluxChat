import { io, Socket } from 'socket.io-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || '';

let socket: Socket | null = null;

export function getSocket(token?: string): Socket {
  if (!socket) {
    socket = io(SOCKET_URL, {
      autoConnect: false,
      auth: { token },
      transports: ['websocket'],
      upgrade: false,
    });
  } else if (token) {
    socket.auth = { token };
  }
  return socket;
}

