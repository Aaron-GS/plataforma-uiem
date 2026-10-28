<!-- frontend/src/views/Login.vue -->
<template>
  <div class="login-wrapper">
    <div class="login-card">
      
      <!-- ============================================ -->
      <!-- PANEL IZQUIERDO: BRANDING -->
      <!-- ============================================ -->
      <div class="brand-panel">
        <div class="brand-content">
          <div class="brand-logo">
            <img src="/src/assets/logo.png" alt="UIEM" class="logo-img" />
          </div>
          
          <h1 class="brand-title">UIEM</h1>
          <p class="brand-subtitle">UNIVERSIDAD INTERCULTURAL<br>DEL ESTADO DE MÉXICO</p>
          
          <div class="brand-decoration">
            <span class="dot"></span>
            <span class="dot"></span>
            <span class="dot"></span>
          </div>
          
        
        </div>
      </div>

      <!-- ============================================ -->
      <!-- PANEL DERECHO: FORMULARIO -->
      <!-- ============================================ -->
      <div class="form-panel">
        <div class="form-content">
          
          <div class="form-header">
            <h2 class="form-title">
              SISTEMA DE CONTROL DE <span class="highlight">PENDIENTES INSTITUCIONALES</span>
            </h2>
            <h3 class="form-welcome">BIENVENIDO</h3>
            <p class="form-subtitle">Ingresa tus credenciales para acceder al sistema</p>
          </div>

          <form @submit.prevent="handleLogin" class="login-form">
            
            <div class="field">
              <label for="email">Correo Institucional</label>
              <input
                id="email"
                v-model="email"
                type="email"
                placeholder="ejemplo@uiem.edu"
                :class="{ error: error }"
                required
                autocomplete="email"
              />
            </div>

            <div class="field">
              <label for="password">Contraseña</label>
              <div class="password-wrapper">
                <input
                  id="password"
                  v-model="password"
                  :type="mostrarPassword ? 'text' : 'password'"
                  placeholder="Ingresa tu contraseña"
                  :class="{ error: error }"
                  required
                  autocomplete="current-password"
                />
                <button 
                  type="button" 
                  @click="mostrarPassword = !mostrarPassword"
                  class="toggle-password"
                  tabindex="-1"
                >
                  {{ mostrarPassword ? '👁️' : '👁️‍🗨️' }}
                </button>
              </div>
            </div>

            <div v-if="error" class="error-message">
              <span class="error-icon">⚠️</span>
              <span>{{ error }}</span>
            </div>

            <button type="submit" :disabled="loading" class="btn-login">
              <span v-if="!loading">INICIAR SESIÓN</span>
              <span v-else class="loading-text">
                <span class="spinner"></span>
                Iniciando sesión...
              </span>
            </button>

          </form>

          <div class="form-footer">
            <p class="footer-text">
              ¿Olvidaste tu contraseña? <a href="#" @click.prevent="contactarSoporte">Contacta a soporte</a>
            </p>
            <p class="footer-credits">
              <strong>UIEM</strong> · UNIVERSIDAD INTERCULTURAL DEL ESTADO DE MÉXICO
            </p>
            <p class="footer-copyright">
              Copyright © {{ year }}
            </p>
          </div>

        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../store/auth';

const router = useRouter();
const authStore = useAuthStore();

const email = ref('');
const password = ref('');
const error = ref('');
const loading = ref(false);
const mostrarPassword = ref(false);

const year = computed(() => new Date().getFullYear());

const handleLogin = async () => {
  error.value = '';
  loading.value = true;

  try {
    const result = await authStore.login(email.value, password.value);
    if (result.success) {
      if (authStore.isSuperAdmin) {
        router.push('/dashboard');
      } else {
        router.push('/mis-tareas');
      }
    } else {
      error.value = result.error;
    }
  } catch (err) {
    error.value = 'Error al iniciar sesión. Intenta nuevamente.';
  } finally {
    loading.value = false;
  }
};

const contactarSoporte = () => {
  alert('📧 Contacta a soporte:\n\nsoporte@uiem.edu.mx\nTel: (722) 123 4567');
};
</script>

<style scoped>
/* ============================================
   WRAPPER - FONDO VERDE OSCURO INSTITUCIONAL
   ============================================ */
.login-wrapper {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(160deg, #0d3d2a 0%, #1a5c40 50%, #0d3d2a 100%);
  padding: 20px;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  overflow: auto;
}

.login-card {
  display: flex;
  width: 100%;
  max-width: 1100px;
  min-height: 620px;
  max-height: 90vh;
  background: white;
  border-radius: 24px;
  overflow: hidden;
  box-shadow: 0 25px 70px rgba(0, 0, 0, 0.5);
  margin: auto;  /* ✅ Centrado perfecto */
}

/* ============================================
   PANEL IZQUIERDO: BRANDING - VERDE INSTITUCIONAL
   ============================================ */
.brand-panel {
  flex: 0 0 40%;
  /* ✅ IMAGEN DE FONDO con degradado verde encima */
  background-image: 
    linear-gradient(160deg, rgba(13, 61, 42, 0.85) 0%, rgba(26, 92, 64, 0.75) 50%, rgba(13, 61, 42, 0.9) 100%),
    url('/src/assets/campus2.jpg');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48px 32px;
  position: relative;
  overflow: hidden;
}

.brand-panel::before {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(circle, rgba(255,255,255,0.08) 1px, transparent 1px);
  background-size: 30px 30px;
  opacity: 0.5;
}

.brand-content {
  position: relative;
  z-index: 1;
  text-align: center;
  color: white;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.brand-logo {
  width: 120px;
  height: 120px;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 12px;
  backdrop-filter: blur(10px);
  border: 2px solid rgba(255, 255, 255, 0.3);
  margin-bottom: 8px;
}

.logo-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  filter: brightness(0) invert(1);  /* Logo blanco sobre verde */
}

.brand-title {
  font-size: 56px;
  font-weight: 900;
  letter-spacing: 6px;
  margin: 0;
  color: white;
  text-shadow: 2px 4px 8px rgba(0,0,0,0.3);
}

.brand-subtitle {
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 2px;
  line-height: 1.5;
  margin: 0;
  color: rgba(255, 255, 255, 0.95);
  text-transform: uppercase;
}

.brand-decoration {
  display: flex;
  gap: 12px;
  margin: 16px 0;
}

.brand-decoration .dot {
  width: 8px;
  height: 8px;
  background: white;
  border-radius: 50%;
  opacity: 0.8;
  box-shadow: 0 0 12px rgba(255, 255, 255, 0.6);
}

.brand-decoration .dot:nth-child(2) {
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 0.8; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.3); }
}

.brand-footer {
  font-size: 13px;
  line-height: 1.6;
  color: rgba(255, 255, 255, 0.85);
  margin: 0;
  font-style: italic;
}

/* ============================================
   PANEL DERECHO: FORMULARIO
   ============================================ */
.form-panel {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48px 56px;
  background: white;
}

.form-content {
  width: 100%;
  max-width: 420px;
}

.form-header {
  margin-bottom: 32px;
  text-align: center;
}

.form-title {
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.8px;
  color: #000;  /* ✅ Negro */
  margin: 0 0 12px 0;
  line-height: 1.4;
  text-transform: uppercase;
  white-space: nowrap;  /* ✅ Una sola línea */
}

.form-title .highlight {
  color: #1a5c40;  /* Verde institucional */
}

.form-welcome {
  font-size: 36px;
  font-weight: 900;
  color: #000;  /* ✅ Negro */
  margin: 0 0 8px 0;
  letter-spacing: 2px;
}

.form-subtitle {
  font-size: 13px;
  color: #888;
  margin: 0;
}

/* ============================================
   FORMULARIO
   ============================================ */
.login-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.field label {
  font-size: 13px;
  font-weight: 700;
  color: #333;
  letter-spacing: 0.5px;
}

.field input {
  width: 100%;
  padding: 14px 18px;
  border: 2px solid #e0ebe5;  /* Borde verde claro */
  border-radius: 10px;
  font-size: 15px;
  transition: all 0.25s;
  outline: none;
  background: #f5faf7;  /* Fondo verde muy claro */
  color: #333;
  font-family: inherit;
  box-sizing: border-box;
}

.field input::placeholder {
  color: #a8b8ae;
}

.field input:focus {
  border-color: #1a5c40;  /* Verde institucional */
  background: white;
  box-shadow: 0 0 0 4px rgba(26, 92, 64, 0.1);
}

.field input.error {
  border-color: #e74c3c;
  background: #fff5f5;
}

/* Password wrapper */
.password-wrapper {
  position: relative;
}

.password-wrapper input {
  padding-right: 48px;
}

.toggle-password {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  cursor: pointer;
  font-size: 18px;
  padding: 4px;
  opacity: 0.6;
  transition: opacity 0.2s;
}

.toggle-password:hover {
  opacity: 1;
}

/* Error message */
.error-message {
  background: #fee;
  color: #c0392b;
  padding: 12px 16px;
  border-radius: 8px;
  font-size: 13px;
  display: flex;
  align-items: center;
  gap: 8px;
  border-left: 4px solid #e74c3c;
}

.error-icon {
  font-size: 16px;
}

/* Botón de login - VERDE INSTITUCIONAL */
.btn-login {
  margin-top: 8px;
  padding: 16px;
  background: linear-gradient(135deg, #0d3d2a 0%, #1a5c40 100%);
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 15px;
  font-weight: 800;
  letter-spacing: 2px;
  cursor: pointer;
  transition: all 0.3s;
  text-transform: uppercase;
  box-shadow: 0 6px 20px rgba(13, 61, 42, 0.35);
}

.btn-login:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 10px 28px rgba(13, 61, 42, 0.5);
  background: linear-gradient(135deg, #1a5c40 0%, #2d7a55 100%);
}

.btn-login:active:not(:disabled) {
  transform: translateY(0);
}

.btn-login:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.loading-text {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255,255,255,0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* ============================================
   FOOTER
   ============================================ */
.form-footer {
  margin-top: 28px;
  padding-top: 20px;
  border-top: 1px solid #eee;
  text-align: center;
}

.footer-text {
  font-size: 13px;
  color: #666;
  margin: 0 0 12px 0;
}

.footer-text a {
  color: #1a5c40;  /* Verde institucional */
  text-decoration: none;
  font-weight: 700;
}

.footer-text a:hover {
  text-decoration: underline;
}

.footer-credits {
  font-size: 10px;
  color: #999;
  margin: 0 0 4px 0;
  letter-spacing: 0.5px;
  line-height: 1.4;
}

.footer-credits strong {
  color: #1a5c40;
}

.footer-copyright {
  font-size: 10px;
  color: #bbb;
  margin: 0;
}

/* ============================================
   RESPONSIVE
   ============================================ */
@media (max-width: 900px) {
  .login-card {
    flex-direction: column;
    max-width: 500px;
  }
  
  .brand-panel {
    flex: 0 0 auto;
    padding: 32px 24px;
  }
  
  .brand-title {
    font-size: 40px;
  }
  
  .brand-logo {
    width: 90px;
    height: 90px;
  }
  
  .form-panel {
    padding: 32px 24px;
  }
  
  .form-welcome {
    font-size: 28px;
  }
}

@media (max-width: 480px) {
  .login-wrapper {
    padding: 0;
  }
  
  .login-card {
    border-radius: 0;
    min-height: 100vh;
  }
  
  .form-panel {
    padding: 24px 20px;
  }
  
  .form-title {
    font-size: 11px;
  }
  
  .form-welcome {
    font-size: 24px;
  }
}
</style>