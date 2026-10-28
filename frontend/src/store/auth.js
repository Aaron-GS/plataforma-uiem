// frontend/src/store/auth.js
import { defineStore } from 'pinia';
import api from '../services/api';

export const useAuthStore = defineStore('auth', {
    state: () => ({
        usuario: null,
        token: localStorage.getItem('token') || null,
        loading: false,
        error: null,
        inicializado: false  // ✅ NUEVO: ¿Ya se cargó el usuario?
    }),

    getters: {
        isAuthenticated: (state) => !!state.token,
        isSuperAdmin: (state) => state.usuario?.rol === 'superadmin',
        isAdminArea: (state) => state.usuario?.rol === 'admin_area',
        
        puedeCrearTareas: (state) => {
    if (!state.usuario) return false;
    const rolesPermitidos = ['superadmin', 'admin_area', 'encargado'];
    return rolesPermitidos.includes(state.usuario.rol);
         },
        
        esEjecutor: (state) => {
            if (!state.usuario) return false;
            return state.usuario.rol === 'gestor' || state.usuario.rol === 'ejecutor';
        },
        
        nombreCompleto: (state) => {
            if (!state.usuario) return '';
            return `${state.usuario.nombre} ${state.usuario.apellidos}`;
        },

        rolLabel: (state) => {
    const labels = {
        'superadmin': 'Administrador',
        'admin_area': 'Admin Área',
        'encargado': 'Encargado',
        'gestor': 'Gestor',
        'ejecutor': 'Ejecutor',
        'invitado': 'Invitado'
    };
    return labels[state.usuario?.rol] || state.usuario?.rol || '';
        } 
    },

    actions: {
        async login(email, password) {
            this.loading = true;
            this.error = null;

            try {
                const response = await api.post('/auth/login', {
                    email: email.toLowerCase().trim(),
                    password
                });

                const { token, usuario } = response.data.data;

                this.token = token;
                localStorage.setItem('token', token);
                this.usuario = usuario;
                this.inicializado = true;  // ✅ Marcar como inicializado
                
                api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

                return { success: true, usuario };
            } catch (error) {
                this.error = error.response?.data?.message || 'Error al iniciar sesión';
                return { success: false, error: this.error };
            } finally {
                this.loading = false;
            }
        },

        async logout() {
            this.token = null;
            this.usuario = null;
            this.inicializado = false;  // ✅ Resetear
            localStorage.removeItem('token');
            delete api.defaults.headers.common['Authorization'];
        },

        async obtenerPerfil() {
            if (!this.token) {
                this.inicializado = true;
                return null;
            }

            try {
                const response = await api.get('/auth/perfil');
                this.usuario = response.data.data;
                return this.usuario;
            } catch (error) {
                console.error('Error al obtener perfil:', error);
                if (error.response?.status === 401) {
                    this.logout();
                }
                return null;
            } finally {
                this.inicializado = true;  // ✅ Marcar como inicializado (éxito o error)
            }
        },

        async initAuth() {
            if (this.token) {
                api.defaults.headers.common['Authorization'] = `Bearer ${this.token}`;
                await this.obtenerPerfil();
            } else {
                this.inicializado = true;  // ✅ Sin token = ya está inicializado
            }
        }
    }
});