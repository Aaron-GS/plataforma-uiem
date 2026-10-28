// frontend/src/store/notificaciones.js
import { defineStore } from 'pinia';
import { getSocket } from '../services/socket';

export const useNotificacionesStore = defineStore('notificaciones', {
    state: () => ({
        notificaciones: [],
        noLeidas: 0
    }),

    getters: {
        totalNoLeidas: (state) => state.notificaciones.filter(n => !n.leida).length
    },

    actions: {
        agregarNotificacion(notificacion) {
            this.notificaciones.unshift({
                ...notificacion,
                id: Date.now(),
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
                socket.on('nueva_notificacion', (notificacion) => {
                    this.agregarNotificacion(notificacion);
                });
            }
        },

        limpiar() {
            this.notificaciones = [];
            this.noLeidas = 0;
        }
    }
});