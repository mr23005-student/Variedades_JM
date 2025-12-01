<template>
  <div class="register-container">
    <div class="register-card">
      <!-- Logo y Header -->
      <div class="register-header">
        <div class="logo-container">
          <q-icon name="person_add" size="50px" color="white" />
        </div>
        <h2 class="register-title">Crear Cuenta</h2>
        <p class="register-subtitle">Únete a Variedades JM</p>
      </div>

      <!-- Formulario de Registro -->
      <div class="register-form-container">
        <q-form @submit="handleRegister" class="register-form">
          <div class="form-section">
            <q-input
              v-model="userData.username"
              label="Usuario"
              outlined
              dense
              class="form-input"
              :rules="[
                val => !!val || 'El usuario es requerido',
                val => val.length >= 3 || 'Mínimo 3 caracteres'
              ]"
              prepend-inner-icon="person"
              autocomplete="username"
            />
          </div>

          <div class="form-section">
            <q-input
              v-model="userData.password"
              label="Contraseña"
              outlined
              dense
              class="form-input"
              :type="showPassword ? 'text' : 'password'"
              :rules="[
                val => !!val || 'La contraseña es requerida',
                val => val.length >= 6 || 'Mínimo 6 caracteres'
              ]"
              prepend-inner-icon="lock"
              autocomplete="new-password"
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

          <div class="form-section">
            <q-input
              v-model="userData.confirmPassword"
              label="Confirmar Contraseña"
              outlined
              dense
              class="form-input"
              :type="showConfirmPassword ? 'text' : 'password'"
              :rules="[
                val => !!val || 'Confirma tu contraseña',
                val => val === userData.password || 'Las contraseñas no coinciden'
              ]"
              prepend-inner-icon="lock_outline"
              autocomplete="new-password"
            >
              <template v-slot:append>
                <q-icon
                  :name="showConfirmPassword ? 'visibility_off' : 'visibility'"
                  class="cursor-pointer"
                  @click="showConfirmPassword = !showConfirmPassword"
                />
              </template>
            </q-input>
          </div>

          <div class="form-section">
            <q-input
              v-model="userData.masterPassword"
              label="Contraseña Maestra"
              outlined
              dense
              class="form-input"
              :type="showMasterPassword ? 'text' : 'password'"
              :rules="[val => !!val || 'La contraseña maestra es requerida']"
              prepend-inner-icon="admin_panel_settings"
              hint="Solicita esta contraseña al administrador"
            >
              <template v-slot:append>
                <q-icon
                  :name="showMasterPassword ? 'visibility_off' : 'visibility'"
                  class="cursor-pointer"
                  @click="showMasterPassword = !showMasterPassword"
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

          <!-- Botón de Registro -->
          <div class="form-section">
            <q-btn
              type="submit"
              label="Crear Cuenta"
              class="register-btn"
              color="secondary"
              size="lg"
              :loading="loading"
              :disable="!isFormValid"
              no-caps
            />
          </div>
        </q-form>

        <!-- Enlaces adicionales -->
        <div class="register-footer">
          <q-separator class="q-my-md" />
          <p class="text-center text-grey-6">
            ¿Ya tienes cuenta?
            <router-link to="/" class="login-link">
              Iniciar Sesión
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
import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import axios from 'axios'

const router = useRouter()
const $q = useQuasar()

// Estado reactivo
const userData = reactive({
  username: '',
  password: '',
  confirmPassword: '',
  masterPassword: ''
})

const loading = ref(false)
const showPassword = ref(false)
const showConfirmPassword = ref(false)
const showMasterPassword = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

// Computed para validar el formulario
const isFormValid = computed(() => {
  return userData.username.length >= 3 &&
         userData.password.length >= 6 &&
         userData.password === userData.confirmPassword &&
         userData.masterPassword.length > 0
})

// Función para manejar el registro
const handleRegister = async () => {
  loading.value = true
  errorMessage.value = ''
  successMessage.value = ''

  try {
    console.log('Enviando datos de registro:', {
      username: userData.username,
      password: '***',
      masterPassword: '***'
    })

    const response = await axios.post('http://localhost:3000/api/auth/register', {
      username: userData.username,
      password: userData.password,
      masterPassword: userData.masterPassword
    })

    console.log('Respuesta exitosa del servidor:', response)

    // Mostrar mensaje de éxito
    successMessage.value = response.data?.message || '¡Cuenta creada exitosamente!'

    // Mostrar notificación
    $q.notify({
      type: 'positive',
      message: '¡Cuenta creada exitosamente!',
      position: 'top',
      timeout: 3000
    })

    // Limpiar formulario
    Object.keys(userData).forEach(key => {
      userData[key] = ''
    })

    // Redirigir al login después de unos segundos
    setTimeout(() => {
      router.push('/')
    }, 2000)

  } catch (error) {
    console.error('Error en registro completo:', error)
    console.error('Error response:', error.response)
    console.error('Error message:', error.message)

    const message = error.response?.data?.message || error.message || 'Error al crear la cuenta'
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
.register-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  position: relative;
  overflow: hidden;
  padding: 20px;
}

.register-card {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  max-width: 420px;
  width: 100%;
  overflow: hidden;
  z-index: 1;
}

.register-header {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  color: white;
  text-align: center;
  padding: 30px 30px 25px;
}

.logo-container {
  margin-bottom: 15px;
}

.register-title {
  font-size: 26px;
  font-weight: 700;
  margin: 0 0 8px 0;
  letter-spacing: -0.5px;
}

.register-subtitle {
  margin: 0;
  font-size: 15px;
  opacity: 0.9;
}

.register-form-container {
  padding: 30px 30px 25px;
}

.form-section {
  margin-bottom: 20px;
}

.form-input {
  border-radius: 12px;
}

.form-input :deep(.q-field__control) {
  border-radius: 12px;
}

.register-btn {
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

.register-footer {
  text-align: center;
}

.login-link {
  color: #f5576c;
  text-decoration: none;
  font-weight: 600;
}

.login-link:hover {
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
  width: 180px;
  height: 180px;
  top: -90px;
  left: -90px;
  animation-delay: 0s;
}

.circle-2 {
  width: 250px;
  height: 250px;
  bottom: -125px;
  right: -125px;
  animation-delay: 2s;
}

.circle-3 {
  width: 120px;
  height: 120px;
  top: 60%;
  right: -60px;
  animation-delay: 4s;
}

@keyframes float {
  0%, 100% {
    transform: translateY(0px) scale(1);
  }
  50% {
    transform: translateY(-15px) scale(1.05);
  }
}

/* Responsive */
@media (max-width: 480px) {
  .register-card {
    margin: 20px;
    border-radius: 16px;
  }

  .register-header {
    padding: 25px 20px 20px;
  }

  .register-title {
    font-size: 22px;
  }

  .register-form-container {
    padding: 25px 20px 20px;
  }

  .form-section {
    margin-bottom: 18px;
  }
}
</style>
