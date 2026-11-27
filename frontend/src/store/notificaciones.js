// frontend/src/store/notificaciones.js
import { defineStore } from 'pinia';
import { getSocket } from '../services/socket';
import api from '../services/api'; // Asegúrate de tener tu axios importado

export const useNotificacionesStore = defineStore('notificaciones', {
    state: () => ({
        notificaciones: [],
        noLeidas: 0
    }),

    getters: {
        totalNoLeidas: (state) => state.notificaciones.filter(n => !n.leida).length
    },

    actions: {
        // ✅ Nueva acción para cargar el historial al entrar
        async cargarNotificaciones() {
            try {
                const res = await api.get('/notificaciones');
                this.notificaciones = res.data.data;
                this.noLeidas = this.notificaciones.filter(n => !n.leida).length;
            } catch (error) {
                console.error('Error al cargar notificaciones', error);
            }
        },

        agregarNotificacion(notificacion) {
            this.notificaciones.unshift({
                ...notificacion,
                // Si el backend no envía ID (por ser socket), generamos uno temporal
                id: notificacion.id || Date.now(),
                leida: false
            });
            this.noLeidas++;
        },

        marcarComoLeida(id) {
            const noti = this.notificaciones.find(n => n.id === id);
            if (noti && !noti.leida) {
                noti.leida = true;
                this.noLeidas--;
            }
        },

        marcarTodasComoLeidas() {
            this.notificaciones.forEach(n => n.leida = true);
            this.noLeidas = 0;
        },

        iniciarEscucha() {
            const socket = getSocket();
            if (socket) {
                socket.off('nueva_notificacion'); // Evitar listeners duplicados
                socket.on('nueva_notificacion', (notificacion) => {
                    console.log('🔔 Notificación recibida:', notificacion);
                    this.agregarNotificacion(notificacion);
                });
            }
        },

        limpiar() {
            this.notificaciones = [];
            this.noLeidas = 0;
            const socket = getSocket();
            if (socket) socket.off('nueva_notificacion');
        }
    }
});