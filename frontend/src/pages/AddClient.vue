<template>
  <q-layout view="hHh lpR fFf">
    <!-- Header -->
    <q-header elevated class="bg-gradient text-white">
      <q-toolbar>
        <q-btn
          dense
          flat
          round
          icon="arrow_back"
          @click="$router.go(-1)"
          class="q-mr-md"
        />
        <q-toolbar-title class="text-center">
          <div class="flex items-center justify-center">
            <q-icon name="person_add" class="q-mr-sm" size="sm" />
            Agregar Cliente
          </div>
        </q-toolbar-title>
        <q-space />
      </q-toolbar>
    </q-header>

    <!-- Page Container -->
    <q-page-container>
      <q-page padding>
        <div class="row justify-center">
          <div class="col-12 col-md-8 col-lg-6">
            <q-card class="q-pa-lg shadow-10">

              <!-- Formulario -->
              <q-form @submit="agregarCliente" ref="formRef">
                <div class="row q-col-gutter-md">

                  <!-- Header del formulario -->
                  <div class="col-12 text-center q-mb-lg">
                    <q-avatar size="80px" class="bg-primary text-white q-mb-md">
                      <q-icon name="person_add" size="40px" />
                    </q-avatar>
                    <div class="text-h6 text-weight-bold text-grey-8">
                      Información del Cliente
                    </div>
                    <div class="text-caption text-grey-6">
                      Completa los datos del nuevo cliente
                    </div>
                  </div>

                  <!-- Nombre completo -->
                  <div class="col-12">
                    <q-input
                      v-model="form.nombre"
                      label="Nombre Completo *"
                      outlined
                      :rules="[
                        val => !!val || 'El nombre es requerido',
                        val => val.length >= 2 || 'El nombre debe tener al menos 2 caracteres',
                        val => /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(val) || 'Solo se permiten letras y espacios'
                      ]"
                      placeholder="Ej: Juan Pérez García"
                      maxlength="100"
                    >
                      <template v-slot:prepend>
                        <q-icon name="person" color="primary" />
                      </template>
                      <template v-slot:append>
                        <q-icon
                          v-if="form.nombre"
                          name="check_circle"
                          color="positive"
                          size="sm"
                        />
                      </template>
                    </q-input>
                    <div class="text-caption text-grey-6 q-mt-xs">
                      Ingresa el nombre completo del cliente
                    </div>
                  </div>

                  <!-- Teléfono -->
                  <div class="col-12">
                    <q-input
                      v-model="form.telefono"
                      label="Número de Teléfono *"
                      outlined
                      type="tel"
                      :rules="[
                        val => !!val || 'El teléfono es requerido',
                        val => /^\d{4}-\d{4}$/.test(val) || 'Formato debe ser ####-####',
                        val => val.replace(/\D/g, '').length === 8 || 'Debe tener exactamente 8 dígitos'
                      ]"
                      placeholder="Ej: 2345-6789"
                      maxlength="9"
                      @input="formatearTelefono"
                    >
                      <template v-slot:prepend>
                        <q-icon name="phone" color="primary" />
                      </template>
                      <template v-slot:append>
                        <q-icon
                          v-if="form.telefono && /^\d{4}-\d{4}$/.test(form.telefono)"
                          name="check_circle"
                          color="positive"
                          size="sm"
                        />
                      </template>
                    </q-input>
                    <div class="text-caption text-grey-6 q-mt-xs">
                      Número de teléfono en formato ####-#### (8 dígitos)
                    </div>
                  </div>

                  <!-- Vista previa de datos -->
                  <div class="col-12" v-if="form.nombre && form.telefono">
                    <q-card flat class="bg-grey-1 q-pa-md">
                      <div class="text-subtitle2 q-mb-sm text-weight-bold text-primary">
                        <q-icon name="visibility" class="q-mr-xs" />
                        Vista Previa
                      </div>
                      <div class="row q-gutter-md">
                        <div class="col">
                          <div class="text-caption text-grey-7">Cliente:</div>
                          <div class="text-body1 text-weight-medium">
                            {{ form.nombre }}
                          </div>
                        </div>
                        <div class="col">
                          <div class="text-caption text-grey-7">Teléfono:</div>
                          <div class="text-body1 text-weight-medium">
                            <q-icon name="phone" size="xs" class="q-mr-xs" />
                            {{ form.telefono }}
                          </div>
                        </div>
                      </div>
                    </q-card>
                  </div>

                  <!-- Botones de acción -->
                  <div class="col-12 q-pt-lg">
                    <div class="row q-gutter-md justify-center">
                      <q-btn
                        label="Cancelar"
                        color="grey"
                        outline
                        @click="cancelar"
                        class="q-px-xl"
                        icon="close"
                      />
                      <q-btn
                        label="Agregar Cliente"
                        color="primary"
                        type="submit"
                        :loading="loading"
                        :disable="!form.nombre || !form.telefono"
                        class="q-px-xl"
                      >
                        <q-icon left name="person_add" />
                      </q-btn>
                    </div>
                  </div>

                  <!-- Información adicional -->
                  <div class="col-12 q-pt-md">
                    <q-card flat class="bg-blue-1 q-pa-sm">
                      <div class="text-caption text-blue-8 text-center">
                        <q-icon name="info" class="q-mr-xs" />
                        Los clientes se pueden usar para reservas y ventas
                      </div>
                    </q-card>
                  </div>
                </div>
              </q-form>
            </q-card>
          </div>
        </div>
      </q-page>
    </q-page-container>
  </q-layout>
</template>

<script>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import axios from 'axios'

export default {
  name: 'AddClient',
  setup() {
    const router = useRouter()
    const $q = useQuasar()

    // Estado reactivo
    const loading = ref(false)

    // Formulario
    const form = reactive({
      nombre: '',
      telefono: ''
    })

    // Referencias
    const formRef = ref(null)

    // Formatear teléfono automáticamente al formato ####-####
    const formatearTelefono = () => {
      // Eliminar todos los caracteres no numéricos
      let numeros = form.telefono.replace(/\D/g, '')

      // Limitar a máximo 8 dígitos
      numeros = numeros.substring(0, 8)

      // Aplicar formato ####-#### automáticamente
      if (numeros.length >= 4) {
        // Cuando hay 4 o más dígitos, agregar el guión
        numeros = numeros.replace(/(\d{4})(\d{0,4})/, '$1-$2')
      }

      form.telefono = numeros
    }

    // Agregar cliente
    const agregarCliente = async () => {
      loading.value = true

      try {
        const payload = {
          nombre: form.nombre.trim(),
          telefono: form.telefono.trim()
        }

        console.log('Enviando cliente:', payload)

        await axios.post('http://localhost:3000/api/clientes', payload)

        $q.notify({
          type: 'positive',
          message: 'Cliente agregado exitosamente',
          position: 'top',
          actions: [{
            label: 'Ver',
            color: 'white',
            handler: () => {
              // Opcional: navegar a vista de cliente
            }
          }]
        })

        // Resetear formulario
        form.nombre = ''
        form.telefono = ''

        // Reset del formulario
        if (formRef.value) {
          formRef.value.reset()
        }

        // Opcional: regresar a página anterior después de 2 segundos
        setTimeout(() => {
          router.go(-1)
        }, 2000)

      } catch (error) {
        console.error('Error al agregar cliente:', error)

        let mensaje = 'Error al agregar cliente'

        if (error.response?.status === 400) {
          mensaje = error.response.data?.message || 'Datos inválidos'
        } else if (error.response?.status === 409) {
          mensaje = 'Ya existe un cliente con ese teléfono'
        } else if (error.response?.data?.message) {
          mensaje = error.response.data.message
        }

        $q.notify({
          type: 'negative',
          message: mensaje,
          position: 'top'
        })
      } finally {
        loading.value = false
      }
    }

    // Cancelar
    const cancelar = () => {
      router.go(-1)
    }

    return {
      // Estado
      loading,

      // Formulario
      form,
      formRef,

      // Métodos
      formatearTelefono,
      agregarCliente,
      cancelar
    }
  }
}
</script>

<style scoped>
/* Header gradient */
.bg-gradient {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

/* Animaciones suaves */
.q-card {
  transition: all 0.3s ease;
}

/* Hover effects para botones */
.q-btn:hover {
  transform: translateY(-1px);
  transition: all 0.2s ease;
}

/* Estilo para campos requeridos */
.q-field--outlined .q-field__control:before {
  border-color: #e0e0e0;
}

/* Vista previa más atractiva */
.bg-grey-1 {
  border: 1px solid #f0f0f0;
  border-radius: 8px;
}

/* Responsive adjustments */
@media (max-width: 600px) {
  .q-card {
    margin: 8px;
  }

  .q-px-xl {
    padding-left: 16px !important;
    padding-right: 16px !important;
  }
}
</style>
