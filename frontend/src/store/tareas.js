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
        // Cargar tareas (filtradas por el rol del usuario)
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

        // Cargar tareas completadas
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

        // Iniciar la escucha global (solo una vez por sesión)
        iniciarEscucha() {
            if (this.socketIniciado) {
                console.log('⚠️ El socket ya está escuchando, evitando duplicados.');
                return;
            }

            const socket = getSocket();
            if (socket) {
                socket.on('actualizar_tareas', () => {
                    console.log('🔄 Evento recibido: recargando tareas...');
                    // Recargamos dependiendo de la ruta actual (activas o completadas)
                    // Por simplicidad, recargamos las activas. Las completadas se recargan al entrar a su vista.
                    this.cargarTareas();
                });
                this.socketIniciado = true;
                console.log('✅ Escucha global de tareas iniciada.');
            }
        }
    }
});