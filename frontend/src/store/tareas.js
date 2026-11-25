// frontend/src/store/tareas.js
import { defineStore } from 'pinia';
import api from '../services/api';
import { getSocket } from '../services/socket';

export const useTareasStore = defineStore('tareas', {
    state: () => ({
        tareas: [],
        loading: false,
        socketIniciado: false
    }),

    actions: {
        async cargarTareas() {
            this.loading = true;
            try {
                const response = await api.get('/tareas?excluir_completadas=true');
                this.tareas = response.data.data || [];
            } catch (error) {
                console.error('Error al cargar tareas:', error);
            } finally {
                this.loading = false;
            }
        },

        async cargarTareasCompletadas() {
            this.loading = true;
            try {
                const response = await api.get('/tareas?estado=completada');
                this.tareas = response.data.data || [];
            } catch (error) {
                console.error('Error al cargar completadas:', error);
            } finally {
                this.loading = false;
            }
        },

        iniciarEscucha() {
            if (this.socketIniciado) return;

            const socket = getSocket();
            if (socket) {
                socket.on('actualizar_tareas', () => {
                    console.log('🔄 Evento de tiempo real recibido en el Store.');
                    // Recargamos las tareas. Dependiendo de la vista, esto actualizará los datos.
                    // Si estamos en completadas, se recargan las completadas.
                    // Si estamos en activas, se recargan las activas.
                    if (this.tareas.length > 0 && this.tareas[0].estado === 'completada') {
                        this.cargarTareasCompletadas();
                    } else {
                        this.cargarTareas();
                    }
                });
                this.socketIniciado = true;
            }
        }
    }
});