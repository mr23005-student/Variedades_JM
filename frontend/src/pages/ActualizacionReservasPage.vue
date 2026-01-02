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
          @click="$router.push('/reservaciones')"
          class="q-mr-md"
        />
        <q-toolbar-title class="text-center">
          <div class="flex items-center justify-center">
            <q-icon name="edit" class="q-mr-sm" size="sm" />
            Actualizar Reserva
          </div>
        </q-toolbar-title>
        <q-space />
        <q-btn
          flat
          round
          dense
          icon="home"
          @click="$router.push('/main')"
          class="text-white"
        >
          <q-tooltip>Ir al Menú Principal</q-tooltip>
        </q-btn>
      </q-toolbar>
    </q-header>

    <q-page-container>
      <q-page class="q-pa-md">
        <div class="q-mx-auto" style="max-width: 500px;">

          <!-- Loading -->
          <div v-if="loading" class="text-center q-py-lg">
            <q-spinner color="primary" size="3em" />
            <div class="q-mt-md">Cargando reserva...</div>
          </div>

          <!-- Reserva Card -->
          <q-card v-else-if="reserva" class="q-mb-md" bordered>
            <!-- Cliente Header -->
            <q-card-section class="row items-center q-pb-none">
              <div class="col">
                <div class="text-h6">{{ reserva.cliente }}</div>
                <div class="text-subtitle2 text-grey-6">{{ reserva.telefono }}</div>
              </div>
              <div class="col-auto">
                <q-badge color="primary" class="q-pa-sm">
                  1 zapato
                </q-badge>
              </div>
            </q-card-section>

            <!-- Cambiar Calzado Button -->
            <q-card-section class="q-pt-none">
              <q-btn
                flat
                color="grey-7"
                class="full-width q-mb-md"
                icon="swap_horiz"
                label="Cambiar calzado"
                @click="mostrarModalZapatos = true"
                style="border: 1px solid #e0e0e0; border-radius: 8px;"
              />
            </q-card-section>

            <!-- Tabla de Zapatos -->
            <q-card-section class="q-pt-none">
              <q-table
                :rows="[reserva]"
                :columns="columns"
                row-key="id"
                flat
                dense
                class="zapatos-table"
              />
            </q-card-section>

            <!-- Resumen de Pagos -->
            <q-card-section>
              <div class="resumen-pagos">
                <div class="row justify-between q-mb-sm">
                  <span>Total Venta:</span>
                  <span class="text-weight-bold">${{ formatPrice(reserva.precio_venta) }}</span>
                </div>
                <div class="row justify-between q-mb-sm">
                  <span>Pagado:</span>
                  <span class="text-weight-bold">${{ formatPrice(reserva.monto_pagado) }}</span>
                </div>
                <div class="row justify-between q-mb-sm" :class="restanteCalculado <= 0 ? 'text-positive' : 'text-primary'">
                  <span>Restante:</span>
                  <span class="text-weight-bold" id="restante">${{ formatPrice(restanteCalculado) }}</span>
                </div>

                <!-- Indicador de pago completo -->
                <div v-if="restanteCalculado <= 0" class="row justify-center q-mt-md">
                  <q-chip color="positive" text-color="white" icon="check_circle">
                    ¡RESERVA SERÁ COMPLETADA COMO VENTA!
                  </q-chip>
                </div>
              </div>
            </q-card-section>

            <!-- Agregar Dinero -->
            <q-card-section>
              <q-input
                v-model.number="montoAdicional"
                type="number"
                label="Agregar dinero"
                placeholder="Ingrese monto"
                outlined
                dense
                class="q-mb-md"
                @input="calcularRestante"
                prefix="$"
                step="0.01"
                min="0"
              />
            </q-card-section>

            <!-- Fecha Límite -->
            <q-card-section class="q-pt-none">
              <q-input
                v-model="fechaLimite"
                type="date"
                label="Fecha límite de reservación"
                outlined
                dense
                class="q-mb-md"
              />
            </q-card-section>

            <!-- Botones de Acción -->
            <q-card-actions class="q-pa-md">
              <div class="row q-gutter-sm full-width">
                <q-btn
                  class="col"
                  :color="restanteCalculado <= 0 ? 'positive' : 'primary'"
                  :label="restanteCalculado <= 0 ? 'Completar Venta' : 'Actualizar'"
                  :icon="restanteCalculado <= 0 ? 'check_circle' : 'edit'"
                  @click="actualizarReserva"
                  :loading="actualizando"
                />
                <q-btn
                  class="col"
                  color="orange"
                  label="Cancelar"
                  @click="$router.push('/reservaciones')"
                />
                <q-btn
                  class="col"
                  color="negative"
                  label="Eliminar"
                  @click="confirmarEliminacion"
                />
              </div>
            </q-card-actions>
          </q-card>

          <!-- Error State -->
          <q-card v-else class="text-center q-pa-lg">
            <q-icon name="error" size="3em" color="negative" class="q-mb-md" />
            <div class="text-h6">Reserva no encontrada</div>
            <div class="text-subtitle2 text-grey-6 q-mb-md">
              La reserva solicitada no existe o fue eliminada
            </div>
            <q-btn color="primary" @click="$router.push('/reservaciones')">
              Volver a Reservaciones
            </q-btn>
          </q-card>
        </div>

        <!-- Modal de Selección de Zapatos -->
        <q-dialog v-model="mostrarModalZapatos">
          <q-card style="width: 400px; max-width: 90vw;">
            <q-card-section class="row items-center q-pb-none">
              <div class="text-h6">Seleccionar nuevo calzado</div>
              <q-space />
              <q-btn icon="close" flat round dense v-close-popup />
            </q-card-section>

            <q-card-section>
              <q-select
                v-model="zapatoSeleccionado"
                :options="zapatosDisponibles"
                option-label="label"
                option-value="value"
                label="Zapatos disponibles"
                outlined
                emit-value
                map-options
              />
            </q-card-section>

            <q-card-actions align="right">
              <q-btn flat label="Cancelar" v-close-popup />
              <q-btn
                color="positive"
                label="Aceptar"
                @click="cambiarZapato"
                :disable="!zapatoSeleccionado"
              />
            </q-card-actions>
          </q-card>
        </q-dialog>

        <!-- Dialog de Confirmación de Eliminación -->
        <q-dialog v-model="mostrarConfirmacion">
          <q-card>
            <q-card-section class="row items-center">
              <q-avatar icon="delete" color="negative" text-color="white" />
              <span class="q-ml-sm">¿Está seguro de eliminar esta reserva?</span>
            </q-card-section>

            <q-card-actions align="right">
              <q-btn flat label="Cancelar" v-close-popup />
              <q-btn
                color="negative"
                label="Eliminar"
                @click="eliminarReserva"
                :loading="eliminando"
              />
            </q-card-actions>
          </q-card>
        </q-dialog>
      </q-page>
    </q-page-container>
  </q-layout>
</template>

<script>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import axios from 'axios'

export default {
  name: 'ActualizacionReservasPage',
  setup() {
    const route = useRoute()
    const router = useRouter()
    const $q = useQuasar()

    // Reactive data
    const loading = ref(true)
    const actualizando = ref(false)
    const eliminando = ref(false)
    const reserva = ref(null)
    const montoAdicional = ref(0)
    const fechaLimite = ref('')
    const mostrarModalZapatos = ref(false)
    const mostrarConfirmacion = ref(false)
    const zapatoSeleccionado = ref(null)
    const zapatosDisponibles = ref([
      { label: '$80 - Puma', value: 'puma-80' },
      { label: '$90 - Nike Air', value: 'nike-90' },
      { label: '$100 - Adidas Boost', value: 'adidas-100' }
    ])

    // Computed
    const restanteCalculado = computed(() => {
      if (!reserva.value) return 0
      const restante = reserva.value.precio_venta - (reserva.value.monto_pagado + (montoAdicional.value || 0))
      return Math.max(0, restante)
    })

    // Table columns
    const columns = [
      {
        name: 'marca',
        label: 'Marca',
        field: 'marca',
        align: 'left'
      },
      {
        name: 'talla',
        label: 'Talla',
        field: 'talla',
        align: 'center'
      },
      {
        name: 'precio_venta',
        label: 'Precio Venta',
        field: 'precio_venta',
        align: 'center',
        format: val => `$${parseFloat(val || 0).toFixed(2)}`
      },
      {
        name: 'monto_pagado',
        label: 'Precio Vendido',
        field: 'monto_pagado',
        align: 'center',
        format: val => `$${parseFloat(val || 0).toFixed(2)}`
      }
    ]

    // Methods
    const cargarReserva = async () => {
      try {
        loading.value = true
        const reservaId = route.params.id

        console.log('Cargando reserva ID:', reservaId)

        const response = await axios.get(`http://localhost:3000/api/reservas/${reservaId}`)
        reserva.value = response.data

        // Formatear fecha límite para el input
        if (reserva.value.fecha_limite) {
          fechaLimite.value = reserva.value.fecha_limite.split('T')[0]
        }

        console.log('Reserva cargada:', reserva.value)
      } catch (error) {
        console.error('Error al cargar reserva:', error)
        $q.notify({
          type: 'negative',
          message: 'Error al cargar la reserva',
          timeout: 3000
        })
      } finally {
        loading.value = false
      }
    }

    const formatPrice = (price) => {
      return parseFloat(price || 0).toFixed(2)
    }

    const calcularRestante = () => {
      // El computed ya maneja esto automáticamente
    }

    const actualizarReserva = async () => {
      try {
        actualizando.value = true

        const datos = {
          monto_adicional: montoAdicional.value || 0,
          fecha_limite: fechaLimite.value
        }

        console.log('Actualizando reserva:', datos)

        const response = await axios.put(`http://localhost:3000/api/reservas/${reserva.value.id}/pago`, datos)

        // Verificar si el pago se completó
        if (response.data.pago_completo) {
          $q.notify({
            type: 'positive',
            message: '¡Reserva completada! Se ha registrado la venta exitosamente',
            timeout: 5000,
            actions: [
              { label: 'Ver Ventas', color: 'white', handler: () => router.push('/historial-ventas') }
            ]
          })

          // Regresar a reservaciones después de un momento
          setTimeout(() => {
            router.push('/reservaciones')
          }, 2000)
        } else {
          $q.notify({
            type: 'positive',
            message: 'Pago actualizado exitosamente',
            timeout: 3000
          })

          // Recargar datos
          await cargarReserva()
          montoAdicional.value = 0
        }

      } catch (error) {
        console.error('Error al actualizar reserva:', error)
        $q.notify({
          type: 'negative',
          message: 'Error al actualizar la reserva',
          timeout: 3000
        })
      } finally {
        actualizando.value = false
      }
    }

    const cambiarZapato = () => {
      // Por ahora solo mostrar notificación
      $q.notify({
        type: 'info',
        message: 'Funcionalidad de cambio de zapato pendiente de implementación',
        timeout: 3000
      })
      mostrarModalZapatos.value = false
    }

    const confirmarEliminacion = () => {
      mostrarConfirmacion.value = true
    }

    const eliminarReserva = async () => {
      try {
        eliminando.value = true

        await axios.delete(`http://localhost:3000/api/reservas/${reserva.value.id}`)

        $q.notify({
          type: 'positive',
          message: 'Reserva eliminada exitosamente',
          timeout: 3000
        })

        router.push('/reservaciones')

      } catch (error) {
        console.error('Error al eliminar reserva:', error)
        $q.notify({
          type: 'negative',
          message: 'Error al eliminar la reserva',
          timeout: 3000
        })
      } finally {
        eliminando.value = false
        mostrarConfirmacion.value = false
      }
    }

    // Lifecycle
    onMounted(() => {
      cargarReserva()
    })

    return {
      loading,
      actualizando,
      eliminando,
      reserva,
      montoAdicional,
      fechaLimite,
      mostrarModalZapatos,
      mostrarConfirmacion,
      zapatoSeleccionado,
      zapatosDisponibles,
      restanteCalculado,
      columns,
      cargarReserva,
      formatPrice,
      calcularRestante,
      actualizarReserva,
      cambiarZapato,
      confirmarEliminacion,
      eliminarReserva
    }
  }
}
</script>

<style scoped>
.bg-gradient {
  background: linear-gradient(135deg, #2c3e50 0%, #4a6491 100%);
}

.resumen-pagos {
  font-size: 14px;
}

.zapatos-table {
  font-size: 13px;
}

.zapatos-table .q-table__container {
  box-shadow: none;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
}
</style>
