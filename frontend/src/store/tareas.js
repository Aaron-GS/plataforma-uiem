// frontend/src/store/tareas.js
import { defineStore } from 'pinia';
import api from '../services/api';
import { getSocket } from '../services/socket';

export const useTareasStore = defineStore('tareas', {
    state: () => ({
        tareas: [],
        loading: false,
        escuchando: false
    }),

    actions: {
        // Cargar las tareas (activas)
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

        // Cargar las tareas completadas
        async cargarTareasCompletadas() {
            this.loading = true;
            try {
                const response = await api.get('/tareas?estado=completada');
                this.tareas = response.data.data || [];
            } catch (error) {
                console.error('Error al cargar tareas completadas:', error);
            } finally {
                this.loading = false;
            }
        },

        // Iniciar la escucha global (solo se llama una vez)
        iniciarEscuchaTiempoReal() {
            if (this.escuchando) return;
            
            const socket = getSocket();
            if (socket) {
                socket.on('actualizar_tareas', () => {
                    console.log('🔄 Evento recibido: recargando datos...');
                    // Si el store tiene tareas, recargarlas (dependiendo de qué vista esté activa)
                    // Para simplificar, recargamos las activas. Las vistas se encargan de pedir las completadas.
                    if (this.tareas.length > 0) {
                        this.cargarTareas(); 
                    }
                });
                this.escuchando = true;
                console.log('✅ Escuchando cambios en tiempo real');
            }
        }
    }
});