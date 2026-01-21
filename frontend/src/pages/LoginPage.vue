<template>
  <div class="login-container">
    <div class="login-card">
      <!-- Logo y Header -->
      <div class="login-header">
        <div class="logo-container">
          <q-icon name="storefront" size="60px" color="white" />
        </div>
        <h2 class="login-title">Variedades JM</h2>
        <p class="login-subtitle">Bienvenido de vuelta</p>
      </div>

      <!-- Formulario de Login -->
      <div class="login-form-container">
        <q-form @submit="handleLogin" class="login-form">
          <div class="form-section">
            <q-input
              v-model="credentials.username"
              label="Usuario"
              outlined
              dense
              class="form-input"
              :rules="[val => !!val || 'El usuario es requerido']"
              prepend-inner-icon="person"
              autocomplete="username"
            />
          </div>

          <div class="form-section">
            <q-input
              v-model="credentials.password"
              label="Contraseña"
              outlined
              dense
              class="form-input"
              :type="showPassword ? 'text' : 'password'"
              :rules="[val => !!val || 'La contraseña es requerida']"
              prepend-inner-icon="lock"
              autocomplete="current-password"
            >
              <template v-slot:append>
                <q-icon
                  :name="showPassword ? 'visibility_off' : 'visibility'"
                  class="cursor-pointer"
                  @click="showPassword = !showPassword"
                />
              </template>
            </q-input>
          </div>

          <!-- Mensajes -->
          <div v-if="errorMessage" class="error-message">
            <q-icon name="error" size="20px" />
            {{ errorMessage }}
          </div>

          <div v-if="successMessage" class="success-message">
            <q-icon name="check_circle" size="20px" />
            {{ successMessage }}
          </div>

          <!-- Botón de Login -->
          <div class="form-section">
            <q-btn
              type="submit"
              label="Iniciar Sesión"
              class="login-btn"
              color="primary"
              size="lg"
              :loading="loading"
              :disable="!credentials.username || !credentials.password"
              no-caps
            />
          </div>
        </q-form>

        <!-- Enlaces adicionales -->
        <div class="login-footer">
          <q-separator class="q-my-md" />
          <p class="text-center text-grey-6">
            ¿No tienes cuenta?
            <router-link to="/register" class="register-link">
              Registrarse
            </router-link>
          </p>
        </div>
      </div>
    </div>

    <!-- Background decoration -->
    <div class="background-decoration">
      <div class="decoration-circle circle-1"></div>
      <div class="decoration-circle circle-2"></div>
      <div class="decoration-circle circle-3"></div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useQuasar } from 'quasar'
import { useRouter } from 'vue-router'
import axios from 'axios'
import API_CONFIG from '../config/api.js'

const router = useRouter()
const $q = useQuasar()

// Estado reactivo
const credentials = reactive({
  username: '',
  password: ''
})

const loading = ref(false)
const showPassword = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

// Función para manejar el login
const handleLogin = async () => {
  loading.value = true
  errorMessage.value = ''
  successMessage.value = ''

  try {
    const response = await axios.post(`${API_CONFIG.getBaseUrl()}/api/auth/login`, {
      username: credentials.username,
      password: credentials.password
    })

    // Guardar token y usuario en localStorage
    localStorage.setItem('token', response.data.token)
    localStorage.setItem('username', response.data.user.username)
    localStorage.setItem('userId', response.data.user.id)

    // Mostrar mensaje de éxito
    successMessage.value = `¡Bienvenido ${credentials.username}!`

    // Mostrar notificación
    $q.notify({
      type: 'positive',
      message: `¡Bienvenido ${credentials.username}!`,
      position: 'top',
      timeout: 2000
    })

    // Redirigir a la página principal después de un breve delay
    setTimeout(() => {
      router.push('/main')
    }, 1500)

  } catch (error) {
    console.error('Error en login:', error)

    const message = error.response?.data?.message || 'Error al iniciar sesión'
    errorMessage.value = message

    $q.notify({
      type: 'negative',
      message: message,
      position: 'top',
      timeout: 4000
    })
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  position: relative;
  overflow: hidden;
  padding: 20px;
}

.login-card {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  max-width: 420px;
  width: 100%;
  overflow: hidden;
  z-index: 1;
}

.login-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  text-align: center;
  padding: 40px 30px 30px;
}

.logo-container {
  margin-bottom: 20px;
}

.login-title {
  font-size: 28px;
  font-weight: 700;
  margin: 0 0 8px 0;
  letter-spacing: -0.5px;
}

.login-subtitle {
  margin: 0;
  font-size: 16px;
  opacity: 0.9;
}

.login-form-container {
  padding: 40px 30px 30px;
}

.form-section {
  margin-bottom: 24px;
}

.form-input {
  border-radius: 12px;
}

.form-input :deep(.q-field__control) {
  border-radius: 12px;
}

.login-btn {
  width: 100%;
  height: 50px;
  border-radius: 12px;
  font-weight: 600;
  font-size: 16px;
  text-transform: none;
}

.error-message {
  background: rgba(244, 67, 54, 0.1);
  color: #d32f2f;
  padding: 12px 16px;
  border-radius: 8px;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
}

.success-message {
  background: rgba(76, 175, 80, 0.1);
  color: #388e3c;
  padding: 12px 16px;
  border-radius: 8px;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
}

.login-footer {
  text-align: center;
}

.register-link {
  color: #667eea;
  text-decoration: none;
  font-weight: 600;
}

.register-link:hover {
  text-decoration: underline;
}

/* Background decoration */
.background-decoration {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.decoration-circle {
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  animation: float 6s ease-in-out infinite;
}

.circle-1 {
  width: 200px;
  height: 200px;
  top: -100px;
  left: -100px;
  animation-delay: 0s;
}

.circle-2 {
  width: 300px;
  height: 300px;
  bottom: -150px;
  right: -150px;
  animation-delay: 2s;
}

.circle-3 {
  width: 150px;
  height: 150px;
  top: 50%;
  right: -75px;
  animation-delay: 4s;
}

@keyframes float {
  0%, 100% {
    transform: translateY(0px) scale(1);
  }
  50% {
    transform: translateY(-20px) scale(1.05);
  }
}

/* Responsive */
@media (max-width: 480px) {
  .login-card {
    margin: 20px;
    border-radius: 16px;
  }

  .login-header {
    padding: 30px 20px 20px;
  }

  .login-title {
    font-size: 24px;
  }

  .login-form-container {
    padding: 30px 20px 20px;
  }
}
</style>
