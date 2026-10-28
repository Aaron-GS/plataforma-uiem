// frontend/src/services/socket.js
import { io } from 'socket.io-client';
import { useAuthStore } from '../store/auth';

let socket = null;

const initSocket = () => {
    const authStore = useAuthStore();
    const token = authStore.token;

    if (!token) {
        console.warn('No hay token para conectar socket');
        return null;
    }

    const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000';

    socket = io(SOCKET_URL, {
        auth: { token },
        transports: ['websocket'],
        reconnection: true,
        reconnectionAttempts: 5,
        withCredentials: true
    });

    socket.on('connect', () => {
        console.log('✅ Conectado al servidor de notificaciones');
    });

    socket.on('disconnect', () => {
        console.log('❌ Desconectado del servidor de notificaciones');
    });

    socket.on('connect_error', (error) => {
        console.error('Error de conexión del socket:', error);
    });

    return socket;
};

const getSocket = () => {
    if (!socket || !socket.connected) {
        return initSocket();
    }
    return socket;
};

const disconnectSocket = () => {
    if (socket) {
        socket.disconnect();
        socket = null;
    }
};

export { initSocket, getSocket, disconnectSocket };