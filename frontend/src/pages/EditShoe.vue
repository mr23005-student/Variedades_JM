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
            <q-icon name="edit" class="q-mr-sm" size="sm" />
            Editar Zapato
          </div>
        </q-toolbar-title>
        <q-space />
      </q-toolbar>
    </q-header>

    <!-- Page Container -->
    <q-page-container>
      <q-page padding>
        <!-- Loading State -->
        <div v-if="loadingShoe" class="q-pa-lg text-center">
          <q-spinner-hourglass size="40px" color="primary" />
          <div class="q-mt-sm text-grey-6">Cargando datos del zapato...</div>
        </div>

        <!-- Edit Form -->
        <div v-else-if="shoeData && dataReady" class="row justify-center">
          <div class="col-12 col-md-8 col-lg-6">
            <q-card class="q-pa-lg shadow-10">
              <!-- Header del formulario -->
              <div class="text-center q-mb-lg">
                <q-avatar size="80px" class="bg-primary text-white q-mb-md">
                  <q-icon name="edit" size="40px" />
                </q-avatar>
                <div class="text-h6 text-weight-bold text-grey-8">
                  Editar Zapato
                </div>
                <div class="text-caption text-grey-6">
                  Modifica los datos del zapato "{{ shoeData.marca }} {{ shoeData.modelo }}"
                </div>
              </div>

              <!-- Formulario -->
              <q-form @submit="actualizarZapato" ref="formRef">
                <div class="row q-col-gutter-md">

                  <!-- Imagen del zapato -->
                  <div class="col-12">
                    <q-card flat bordered class="q-pa-md text-center">
                      <div class="text-subtitle2 q-mb-md text-weight-bold">
                        <q-icon name="photo_camera" class="q-mr-xs" />
                        Imagen del Zapato
                      </div>

                      <div class="image-preview-container q-mb-md">
                        <img
                          :src="form.imagen || imagenGenerica"
                          alt="Vista previa"
                          class="preview-image"
                          @error="onImageError"
                        />
                      </div>

                      <div class="row q-gutter-sm justify-center">
                        <q-btn
                          color="primary"
                          icon="photo_camera"
                          label="Cambiar Imagen"
                          @click="seleccionarImagen"
                          outline
                          size="sm"
                        />
                        <q-btn
                          v-if="form.imagen && form.imagen !== imagenGenerica"
                          color="negative"
                          icon="delete"
                          label="Quitar"
                          @click="quitarImagen"
                          outline
                          size="sm"
                        />
                      </div>

                      <input
                        ref="fileInput"
                        type="file"
                        accept="image/*"
                        style="display: none"
                        @change="manejarImagen"
                      />
                    </q-card>
                  </div>

                  <!-- Marca -->
                  <div class="col-12 col-md-6">
                    <q-input
                      v-model="form.marca"
                      label="Marca *"
                      outlined
                      placeholder="Ej: Nike, Adidas"
                      maxlength="50"
                    >
                      <template v-slot:prepend>
                        <q-icon name="branding_watermark" color="primary" />
                      </template>
                    </q-input>
                  </div>

                  <!-- Modelo -->
                  <div class="col-12 col-md-6">
                    <q-input
                      v-model="form.modelo"
                      label="Modelo *"
                      outlined
                      placeholder="Ej: Air Max 270"
                      maxlength="100"
                    >
                      <template v-slot:prepend>
                        <q-icon name="style" color="primary" />
                      </template>
                    </q-input>
                  </div>

                  <!-- Código -->
                  <div class="col-12 col-md-6">
                    <q-input
                      v-model="form.codigo"
                      label="Código"
                      outlined
                      placeholder="Generado automáticamente"
                      maxlength="20"
                      readonly
                    >
                      <template v-slot:prepend>
                        <q-icon name="qr_code" color="primary" />
                      </template>
                      <template v-slot:append>
                        <q-btn
                          flat
                          icon="refresh"
                          @click="generarCodigo"
                          size="sm"
                          color="primary"
                        >
                          <q-tooltip>Generar nuevo código</q-tooltip>
                        </q-btn>
                      </template>
                    </q-input>
                  </div>

                  <!-- Estado -->
                  <div class="col-12 col-md-6">
                    <q-select
                      v-model="form.estado"
                      :options="estadoOptions"
                      label="Estado *"
                      outlined
                      emit-value
                      map-options
                    >
                      <template v-slot:prepend>
                        <q-icon name="flag" color="primary" />
                      </template>
                    </q-select>
                  </div>

                  <!-- Talla -->
                  <div class="col-12 col-md-6">
                    <q-input
                      v-model="form.talla"
                      label="Talla *"
                      outlined
                      placeholder="Ej: 42, 8.5, XL"
                      maxlength="10"
                    >
                      <template v-slot:prepend>
                        <q-icon name="straighten" color="primary" />
                      </template>
                    </q-input>
                  </div>



                  <!-- Centímetros -->
                  <div class="col-12 col-md-6">
                    <q-input
                      v-model.number="form.cm"
                      label="Centímetros"
                      type="number"
                      outlined
                      step="0.5"
                      min="0"
                      placeholder="Ej: 26.5"
                    >
                      <template v-slot:prepend>
                        <q-icon name="straighten" color="primary" />
                      </template>
                      <template v-slot:append>
                        <span class="text-caption text-grey-6">cm</span>
                      </template>
                    </q-input>
                  </div>

                  <!-- Precio de Compra -->
                  <div class="col-12 col-md-6">
                    <q-input
                      v-model.number="form.precio_compra"
                      label="Precio de Compra *"
                      type="number"
                      outlined
                      min="0"
                      step="any"
                      placeholder="50000"
                    >
                      <template v-slot:prepend>
                        <q-icon name="shopping_cart" color="primary" />
                      </template>
                      <template v-slot:append>
                        <span class="text-caption text-grey-6">COP</span>
                      </template>
                    </q-input>
                  </div>

                  <!-- Precio de Venta -->
                  <div class="col-12 col-md-6">
                    <q-input
                      v-model.number="form.precio_venta"
                      label="Precio de Venta *"
                      type="number"
                      outlined
                      min="0"
                      step="any"
                      placeholder="80000"
                    >
                      <template v-slot:prepend>
                        <q-icon name="attach_money" color="primary" />
                      </template>
                      <template v-slot:append>
                        <span class="text-caption text-grey-6">COP</span>
                      </template>
                    </q-input>
                  </div>

                  <!-- Precio Vendido (solo si estado es "vendido") -->
                  <div class="col-12 col-md-6" v-if="form.estado === 'vendido'">
                    <q-input
                      v-model.number="form.precio_vendido"
                      label="Precio Final de Venta"
                      type="number"
                      outlined
                      min="0"
                      step="any"
                      placeholder="75000"
                    >
                      <template v-slot:prepend>
                        <q-icon name="sell" color="positive" />
                      </template>
                      <template v-slot:append>
                        <span class="text-caption text-grey-6">COP</span>
                      </template>
                    </q-input>
                    <div class="text-caption text-grey-6 q-mt-xs">
                      Precio al que realmente se vendió (opcional)
                    </div>
                  </div>

                  <!-- Vista previa de cambios -->
                  <div class="col-12" v-if="hasChanges">
                    <q-card flat class="bg-orange-1 q-pa-md">
                      <div class="text-subtitle2 q-mb-sm text-weight-bold text-orange-9">
                        <q-icon name="info" class="q-mr-xs" />
                        Cambios Detectados
                      </div>
                      <div class="text-caption text-orange-8">
                        Se han detectado cambios en el formulario. Recuerda guardar para confirmar las modificaciones.
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
                        label="Guardar Cambios"
                        color="primary"
                        type="submit"
                        :loading="loading"
                        :disable="!hasChanges"
                        class="q-px-xl"
                      >
                        <q-icon left name="save" />
                      </q-btn>
                    </div>
                  </div>

                  <!-- Información adicional -->
                  <div class="col-12 q-pt-md">
                    <q-card flat class="bg-blue-1 q-pa-sm">
                      <div class="text-caption text-blue-8 text-center">
                        <q-icon name="info" class="q-mr-xs" />
                        Última modificación: {{ formatDate(shoeData.fecha_registro) }}
                      </div>
                    </q-card>
                  </div>
                </div>
              </q-form>
            </q-card>
          </div>
        </div>

        <!-- Error State -->
        <div v-else class="text-center q-pa-xl">
          <q-icon name="error" size="4rem" color="negative" />
          <div class="text-h6 text-negative q-mt-md">
            Zapato no encontrado
          </div>
          <div class="text-body2 text-grey-5 q-mt-xs">
            El zapato que intentas editar no existe o fue eliminado
          </div>
          <q-btn
            color="primary"
            label="Volver al Inventario"
            icon="arrow_back"
            @click="$router.push('/inventario')"
            class="q-mt-md"
          />
        </div>
      </q-page>
    </q-page-container>
  </q-layout>
</template>

<script>
import { ref, reactive, computed, onMounted, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useQuasar } from 'quasar'
import axios from 'axios'

export default {
  name: 'EditShoePage',
  setup() {
    const router = useRouter()
    const route = useRoute()
    const $q = useQuasar()

    // Estado reactivo
    const loading = ref(false)
    const loadingShoe = ref(true)
    const shoeData = ref(null)
    const originalData = ref(null)
    const dataReady = ref(false)

    // Formulario reactivo
    const form = reactive({
      marca: '',
      modelo: '',
      codigo: '',
      estado: 'activo',
      talla: '',
      cm: null,
      precio_compra: null,
      precio_venta: null,
      precio_vendido: null,
      imagen: ''
    })

    // Referencias
    const formRef = ref(null)
    const fileInput = ref(null)

    // Opciones
    const estadoOptions = [
      { label: 'Activo', value: 'activo' },
      { label: 'Reservado', value: 'reservado' },
      { label: 'Vendido', value: 'vendido' }
    ]

    // Imagen genérica
    const imagenGenerica = '/placeholder-shoe.jpg'

    // Computed
    const hasChanges = computed(() => {
      if (!originalData.value) return false

      return Object.keys(form).some(key => {
        const currentValue = form[key]
        const originalValue = originalData.value[key]

        return currentValue !== originalValue
      })
    })    // Cargar datos del zapato
    const loadShoeData = async () => {
      dataReady.value = false

      try {
        const shoeId = route.params.id
        console.log('Loading shoe with ID:', shoeId)

        const response = await axios.get(`http://localhost:3000/api/zapatos/${shoeId}`)
        const data = response.data

        console.log('Received data:', data)

        // Asignar datos al estado
        shoeData.value = data

        // Poblar formulario inmediatamente con datos existentes
        Object.assign(form, {
          marca: data.marca || '',
          modelo: data.modelo || '',
          codigo: data.codigo || '',
          estado: data.estado || 'activo',
          talla: data.talla || '',
          cm: data.cm ? Number(data.cm) : null,
          precio_compra: data.precio_compra ? Number(data.precio_compra) : null,
          precio_venta: data.precio_venta ? Number(data.precio_venta) : null,
          precio_vendido: data.precio_vendido ? Number(data.precio_vendido) : null,
          imagen: data.imagen || ''
        })

        // Esperar a que Vue actualice el DOM
        await nextTick()

        // Guardar datos originales para detectar cambios
        originalData.value = { ...form }

        // Marcar que los datos están listos
        dataReady.value = true

        console.log('Form populated and ready:', form)

      } catch (error) {
        console.error('Error loading shoe:', error)

        $q.notify({
          type: 'negative',
          message: 'Error al cargar los datos del zapato',
          position: 'top'
        })

        // Si no se encuentra, shoeData queda null y se muestra error state
        shoeData.value = null
      } finally {
        loadingShoe.value = false
      }
    }

    // Actualizar zapato
    const actualizarZapato = async () => {
      // Validaciones básicas en JavaScript
      if (!form.marca || !form.modelo || !form.talla) {
        $q.notify({
          type: 'negative',
          message: 'Por favor completa todos los campos requeridos (Marca, Modelo, Talla)',
          position: 'top'
        })
        return
      }

      if (!form.precio_compra || form.precio_compra <= 0) {
        $q.notify({
          type: 'negative',
          message: 'El precio de compra debe ser mayor a 0',
          position: 'top'
        })
        return
      }

      if (!form.precio_venta || form.precio_venta <= 0) {
        $q.notify({
          type: 'negative',
          message: 'El precio de venta debe ser mayor a 0',
          position: 'top'
        })
        return
      }

      loading.value = true

      try {
        const shoeId = route.params.id
        const payload = { ...form }

        // Limpiar valores vacíos opcionales
        if (!payload.cm) payload.cm = null
        if (!payload.precio_vendido) payload.precio_vendido = null

        console.log('Updating shoe with payload:', payload)

        await axios.put(`http://localhost:3000/api/zapatos/${shoeId}`, payload)

        $q.notify({
          type: 'positive',
          message: 'Zapato actualizado exitosamente',
          position: 'top',
          actions: [{
            label: 'Ver Inventario',
            color: 'white',
            handler: () => {
              router.push('/inventario')
            }
          }]
        })

        // Actualizar datos originales
        originalData.value = { ...form }

        // Opcional: regresar después de 2 segundos
        setTimeout(() => {
          router.push('/inventario')
        }, 2000)

      } catch (error) {
        console.error('Error updating shoe:', error)

        let mensaje = 'Error al actualizar el zapato'

        if (error.response?.status === 400) {
          mensaje = error.response.data?.message || 'Datos inválidos'
        } else if (error.response?.status === 404) {
          mensaje = 'Zapato no encontrado'
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

    // Generar código automático
    const generarCodigo = () => {
      const timestamp = Date.now().toString().slice(-6)
      const random = Math.random().toString(36).substring(2, 5).toUpperCase()
      form.codigo = `SH${timestamp}${random}`
    }

    // Manejo de imágenes
    const seleccionarImagen = () => {
      fileInput.value.click()
    }

    const manejarImagen = (event) => {
      const file = event.target.files[0]
      if (!file) return

      // Validar tipo de archivo
      if (!file.type.startsWith('image/')) {
        $q.notify({
          type: 'negative',
          message: 'Por favor selecciona un archivo de imagen válido',
          position: 'top'
        })
        return
      }

      // Validar tamaño (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        $q.notify({
          type: 'negative',
          message: 'La imagen no puede superar los 5MB',
          position: 'top'
        })
        return
      }

      // Convertir a base64
      const reader = new FileReader()
      reader.onload = (e) => {
        form.imagen = e.target.result
        console.log('Image updated')
      }
      reader.readAsDataURL(file)
    }

    const quitarImagen = () => {
      form.imagen = ''
      if (fileInput.value) {
        fileInput.value.value = ''
      }
    }

    const onImageError = (event) => {
      event.target.src = imagenGenerica
    }

    // Cancelar edición
    const cancelar = () => {
      if (hasChanges.value) {
        $q.dialog({
          title: 'Confirmar',
          message: 'Tienes cambios sin guardar. ¿Estás seguro de que quieres salir?',
          cancel: true,
          persistent: true
        }).onOk(() => {
          router.go(-1)
        })
      } else {
        router.go(-1)
      }
    }

    // Formatear fecha
    const formatDate = (dateString) => {
      if (!dateString) return 'No disponible'
      return new Date(dateString).toLocaleDateString('es-CO', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    }

    // Lifecycle
    onMounted(() => {
      loadShoeData()
    })

    return {
      // Estado
      loading,
      loadingShoe,
      dataReady,
      shoeData,
      form,
      formRef,
      fileInput,

      // Opciones
      estadoOptions,
      imagenGenerica,

      // Computed
      hasChanges,

      // Métodos
      actualizarZapato,
      generarCodigo,
      seleccionarImagen,
      manejarImagen,
      quitarImagen,
      onImageError,
      cancelar,
      formatDate
    }
  }
}
</script>

<style scoped>
/* Header gradient */
.bg-gradient {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

/* Image preview */
.image-preview-container {
  width: 100%;
  max-width: 300px;
  margin: 0 auto;
}

.preview-image {
  width: 100%;
  height: 200px;
  object-fit: cover;
  border-radius: 8px;
  border: 2px solid #e0e0e0;
}

/* Animations */
.q-card {
  transition: all 0.3s ease;
}

.q-btn:hover {
  transform: translateY(-1px);
  transition: all 0.2s ease;
}

/* Prevenir parpadeo de formularios */
.q-field__control {
  transition: background-color 0.2s ease;
}

.q-input .q-field__native {
  transition: all 0.2s ease;
}

/* Responsive */
@media (max-width: 600px) {
  .q-card {
    margin: 8px;
  }

  .preview-image {
    height: 150px;
  }

  .q-px-xl {
    padding-left: 16px !important;
    padding-right: 16px !important;
  }
}
</style>
