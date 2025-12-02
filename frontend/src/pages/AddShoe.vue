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
            <q-icon name="add_shopping_cart" class="q-mr-sm" size="sm" />
            Agregar Zapato
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
          <q-form @submit="agregarZapato" ref="formRef">
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
                    <!-- Cargar desde archivos -->
                    <q-btn
                      color="primary"
                      icon="folder_open"
                      label="Seleccionar Archivo"
                      @click="fileInputRef?.click()"
                      outline
                    />

                    <!-- Input URL -->
                    <q-btn
                      color="secondary"
                      icon="link"
                      label="URL"
                      @click="mostrarDialogoURL = true"
                      outline
                    />
                  </div>

                  <!-- Input file oculto -->
                  <input
                    ref="fileInputRef"
                    type="file"
                    accept="image/*"
                    @change="onFileSelected"
                    style="display: none"
                  />
                </q-card>
              </div>

              <!-- Información básica -->
              <div class="col-12">
                <div class="text-subtitle2 q-mb-md text-weight-bold">
                  <q-icon name="info" class="q-mr-xs" />
                  Información Básica
                </div>
              </div>

              <!-- Marca y Modelo -->
              <div class="col-12 col-sm-6">
                <q-input
                  v-model="form.marca"
                  label="Marca *"
                  outlined
                  :rules="[val => !!val || 'La marca es requerida']"
                  placeholder="Ej: Nike, Adidas, Puma..."
                >
                  <template v-slot:prepend>
                    <q-icon name="branding_watermark" />
                  </template>
                </q-input>
              </div>

              <div class="col-12 col-sm-6">
                <q-input
                  v-model="form.modelo"
                  label="Modelo *"
                  outlined
                  :rules="[val => !!val || 'El modelo es requerido']"
                  placeholder="Ej: Air Max, Ultraboost..."
                >
                  <template v-slot:prepend>
                    <q-icon name="style" />
                  </template>
                </q-input>
              </div>

              <!-- Código y Estado -->
              <div class="col-12 col-sm-6">
                <q-input
                  v-model="form.codigo"
                  label="Código"
                  outlined
                  placeholder="Ej: NIKE-AM-001"
                  hint="Opcional - Haz clic en ✨ para generar automáticamente"
                >
                  <template v-slot:prepend>
                    <q-icon name="qr_code" />
                  </template>
                  <template v-slot:append>
                    <q-btn
                      flat
                      dense
                      icon="auto_awesome"
                      @click="generarCodigo"
                      color="primary"
                      size="sm"
                    >
                      <q-tooltip>Generar código automático</q-tooltip>
                    </q-btn>
                  </template>
                </q-input>
              </div>

              <div class="col-12 col-sm-6">
                <q-select
                  v-model="form.estado"
                  :options="estadosOptions"
                  label="Estado *"
                  outlined
                  :rules="[val => !!val || 'El estado es requerido']"
                >
                  <template v-slot:prepend>
                    <q-icon name="check_circle" />
                  </template>
                </q-select>
              </div>

              <!-- Detalles del producto -->
              <div class="col-12">
                <div class="text-subtitle2 q-mb-md text-weight-bold">
                  <q-icon name="straighten" class="q-mr-xs" />
                  Detalles del Producto
                </div>
              </div>

              <!-- Talla y CM -->
              <div class="col-12 col-sm-6">
                <q-input
                  v-model="form.talla"
                  label="Talla *"
                  outlined
                  :rules="[val => !!val || 'La talla es requerida']"
                  placeholder="Ej: 42, 7.5, M..."
                >
                  <template v-slot:prepend>
                    <q-icon name="straighten" />
                  </template>
                </q-input>
              </div>

              <div class="col-12 col-sm-6">
                <q-input
                  v-model.number="form.cm"
                  label="Centímetros *"
                  type="number"
                  outlined
                  step="0.5"
                  min="0"
                  :rules="[
                    val => !!val || 'Los centímetros son requeridos',
                    val => val > 0 || 'Debe ser mayor a 0'
                  ]"
                  placeholder="26.5"
                >
                  <template v-slot:prepend>
                    <q-icon name="straighten" />
                  </template>
                  <template v-slot:append>
                    <span class="text-caption">cm</span>
                  </template>
                </q-input>
              </div>

              <!-- Precios -->
              <div class="col-12">
                <div class="text-subtitle2 q-mb-md text-weight-bold">
                  <q-icon name="attach_money" class="q-mr-xs" />
                  Información de Precios
                </div>
              </div>

              <div class="col-12 col-sm-6">
                <q-input
                  v-model.number="form.precio_compra"
                  label="Precio de Compra *"
                  type="number"
                  outlined
                  min="0"
                  step="any"
                  :rules="[
                    val => !!val || 'El precio de compra es requerido',
                    val => val > 0 || 'Debe ser mayor a 0'
                  ]"
                  placeholder="50000"
                >
                  <template v-slot:prepend>
                    <q-icon name="shopping_cart" color="negative" />
                  </template>
                  <template v-slot:append>
                    <span class="text-caption">COP</span>
                  </template>
                </q-input>
              </div>

              <div class="col-12 col-sm-6">
                <q-input
                  v-model.number="form.precio_venta"
                  label="Precio de Venta *"
                  type="number"
                  outlined
                  min="0"
                  step="any"
                  :rules="[
                    val => !!val || 'El precio de venta es requerido',
                    val => val > 0 || 'Debe ser mayor a 0',
                    val => val >= form.precio_compra || 'Debe ser mayor o igual al precio de compra'
                  ]"
                  placeholder="80000"
                >
                  <template v-slot:prepend>
                    <q-icon name="sell" color="positive" />
                  </template>
                  <template v-slot:append>
                    <span class="text-caption">COP</span>
                  </template>
                </q-input>
              </div>

              <!-- Margen de ganancia (calculado) -->
              <div class="col-12" v-if="form.precio_compra && form.precio_venta">
                <q-card flat class="bg-grey-1 q-pa-sm">
                  <div class="text-body2 text-center">
                    <q-icon name="trending_up" color="positive" class="q-mr-xs" />
                    <strong>Margen de Ganancia:</strong>
                    <span class="text-positive text-weight-bold q-ml-xs">
                      ${{ (form.precio_venta - form.precio_compra).toLocaleString() }}
                      ({{ ((form.precio_venta - form.precio_compra) / form.precio_compra * 100).toFixed(1) }}%)
                    </span>
                  </div>
                </q-card>
              </div>

              <!-- Precio vendido (opcional) -->
              <div class="col-12">
                <q-input
                  v-model.number="form.precio_vendido"
                  label="Precio Vendido (Opcional)"
                  type="number"
                  outlined
                  min="0"
                  step="any"
                  hint="Solo llenar si ya se vendió con descuento"
                  :rules="[
                    val => !val || val > 0 || 'Debe ser mayor a 0'
                  ]"
                >
                  <template v-slot:prepend>
                    <q-icon name="point_of_sale" color="primary" />
                  </template>
                  <template v-slot:append>
                    <span class="text-caption">COP</span>
                  </template>
                </q-input>
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
                  />
                  <q-btn
                    label="Agregar Zapato"
                    color="primary"
                    type="submit"
                    :loading="loading"
                    class="q-px-xl"
                  >
                    <q-icon left name="add_shopping_cart" />
                  </q-btn>
                </div>
              </div>
            </div>
          </q-form>
        </q-card>
      </div>
    </div>

    <!-- Dialog para URL de imagen -->
    <q-dialog v-model="mostrarDialogoURL">
      <q-card style="min-width: 350px">
        <q-card-section>
          <div class="text-h6">Imagen por URL</div>
        </q-card-section>

        <q-card-section class="q-pt-none">
          <q-input
            v-model="urlTemporal"
            label="URL de la imagen"
            outlined
            placeholder="https://ejemplo.com/imagen.jpg"
            @keyup.enter="aplicarURL"
          />
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Cancelar" @click="mostrarDialogoURL = false" />
          <q-btn flat label="Aplicar" color="primary" @click="aplicarURL" />
        </q-card-actions>
      </q-card>
    </q-dialog>
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
  name: 'AddShoe',
  setup() {
    const router = useRouter()
    const $q = useQuasar()

    // Estado reactivo
    const loading = ref(false)
    const mostrarDialogoURL = ref(false)
    const urlTemporal = ref('')

    // Imagen genérica por defecto
    const imagenGenerica = 'https://via.placeholder.com/300x200/e0e0e0/999999?text=Sin+Imagen'

    // Formulario
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

    // Opciones para el estado
    const estadosOptions = [
      { label: 'Activo (Disponible)', value: 'activo' },
      { label: 'Reservado', value: 'reservado' },
      { label: 'Vendido', value: 'vendido' }
    ]

    // Referencias
    const formRef = ref(null)
    const fileInputRef = ref(null)

    // Generar código automático
    const generarCodigo = () => {
      const marca = form.marca?.toUpperCase().replace(/\s+/g, '').substring(0, 3) || 'ZAP'
      const modelo = form.modelo?.toUpperCase().replace(/\s+/g, '').substring(0, 3) || 'MOD'
      const timestamp = Date.now().toString().slice(-4)
      const codigo = `${marca}-${modelo}-${timestamp}`

      form.codigo = codigo

      $q.notify({
        type: 'positive',
        message: `Código generado: ${codigo}`,
        position: 'top'
      })

      console.log('Código generado:', codigo)
    }

    // Manejar selección de archivo
    const onFileSelected = (event) => {
      const file = event.target.files[0]
      if (file) {
        // Validar que sea una imagen
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
            message: 'La imagen no debe superar los 5MB',
            position: 'top'
          })
          return
        }

        // Crear URL local para la imagen
        const reader = new FileReader()
        reader.onload = (e) => {
          form.imagen = e.target.result
          console.log('Imagen cargada:', e.target.result.substring(0, 50) + '...')
        }
        reader.readAsDataURL(file)

        $q.notify({
          type: 'positive',
          message: 'Imagen cargada exitosamente',
          position: 'top'
        })
      }
    }

    // Aplicar URL de imagen
    const aplicarURL = () => {
      if (urlTemporal.value.trim()) {
        form.imagen = urlTemporal.value.trim()
        mostrarDialogoURL.value = false
        urlTemporal.value = ''

        $q.notify({
          type: 'positive',
          message: 'URL de imagen aplicada',
          position: 'top'
        })
      }
    }

    // Manejar error de imagen
    const onImageError = (event) => {
      console.log('Error cargando imagen:', event)
      if (form.imagen !== imagenGenerica) {
        console.log('Cambiando a imagen genérica')
        form.imagen = imagenGenerica
      }
    }

    // Agregar zapato
    const agregarZapato = async () => {
      loading.value = true

      try {
        const payload = {
          ...form,
          imagen: form.imagen || imagenGenerica
        }

        console.log('Enviando zapato:', payload)

        await axios.post('http://localhost:3000/api/zapatos', payload)

        $q.notify({
          type: 'positive',
          message: 'Zapato agregado exitosamente',
          position: 'top',
          actions: [{
            label: 'Ver',
            color: 'white',
            handler: () => {
              // Opcional: navegar a vista de zapato
            }
          }]
        })

        // Resetear formulario
        Object.keys(form).forEach(key => {
          if (typeof form[key] === 'string') form[key] = ''
          else form[key] = null
        })
        form.estado = 'activo'

        // Reset del input file
        if (formRef.value) {
          formRef.value.reset()
        }

      } catch (error) {
        console.error('Error al agregar zapato:', error)

        const mensaje = error.response?.data?.message ||
                       error.response?.data?.error ||
                       'Error al agregar zapato'

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
      mostrarDialogoURL,
      urlTemporal,
      imagenGenerica,

      // Formulario
      form,
      estadosOptions,
      formRef,
      fileInputRef,

      // Métodos
      generarCodigo,
      onFileSelected,
      aplicarURL,
      onImageError,
      agregarZapato,
      cancelar
    }
  }
}
</script>

<style scoped>
.image-preview-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 200px;
  background: #f5f5f5;
  border-radius: 8px;
  border: 2px dashed #ddd;
}

.preview-image {
  max-width: 100%;
  max-height: 200px;
  object-fit: contain;
  border-radius: 4px;
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

/* Header gradient */
.bg-gradient {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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
