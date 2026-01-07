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
          @click="$router.push('/main')"
          class="q-mr-md"
        />
        <q-toolbar-title class="text-center">
          <div class="flex items-center justify-center">
            <q-icon name="history" class="q-mr-sm" size="sm" />
            Historial de Ventas
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
      <q-page class="historial-ventas-page">
        <div class="page-background">
          <div class="row justify-center q-pa-md">
            <div class="col-12 col-md-10 col-lg-8">

          <!-- Título -->
          <q-card class="beautiful-card q-mb-md">
            <q-card-section class="text-center q-pb-none">
              <div class="text-h4 text-weight-bold text-primary q-mb-md">
                <q-icon name="history" class="q-mr-sm" />
                Historial de Ventas
              </div>
              <div class="text-h6 text-grey-7">Consulta de ventas por día</div>
            </q-card-section>
          </q-card>

          <!-- Selector de Fecha -->
          <q-card class="beautiful-card q-mb-md">
            <q-card-section>
              <div class="text-h6 text-primary q-mb-md">
                <q-icon name="calendar_today" class="q-mr-sm" />
                Seleccionar Fecha
              </div>
              <div class="row q-gutter-md items-center">
                <div class="col">
                  <q-input
                    v-model="fechaSeleccionada"
                    type="date"
                    outlined
                    label="Fecha"
                    @update:model-value="cargarVentasPorFecha"
                    class="fecha-input"
                  />
                </div>
                <div class="col-auto">
                  <q-btn
                    color="primary"
                    label="Hoy"
                    @click="seleccionarHoy"
                    outline
                  />
                </div>
              </div>
            </q-card-section>
          </q-card>

          <!-- Resumen del Día -->
          <q-card v-if="resumenDia" class="beautiful-card q-mb-md">
            <q-card-section>
              <div class="text-h6 text-primary q-mb-md">Resumen del {{ fechaFormateada }}</div>
              <div class="row q-gutter-md">
                <div class="col">
                  <div class="stat-box bg-blue-1 text-blue-9">
                    <div class="text-h5 text-weight-bold">{{ resumenDia.totalZapatos }}</div>
                    <div class="text-caption">Zapatos Vendidos</div>
                  </div>
                </div>
                <div class="col">
                  <div class="stat-box bg-green-1 text-green-9">
                    <div class="text-h5 text-weight-bold">${{ formatPrice(resumenDia.totalVentas) }}</div>
                    <div class="text-caption">Total Vendido</div>
                  </div>
                </div>
                <div class="col">
                  <div class="stat-box bg-purple-1 text-purple-9">
                    <div class="text-h5 text-weight-bold">${{ formatPrice(resumenDia.totalInversion) }}</div>
                    <div class="text-caption">Total Invertido</div>
                  </div>
                </div>
                <div class="col">
                  <div class="stat-box bg-orange-1 text-orange-9">
                    <div class="text-h5 text-weight-bold">${{ formatPrice(resumenDia.gananciaTotal) }}</div>
                    <div class="text-caption">Ganancia Total</div>
                  </div>
                </div>
              </div>
            </q-card-section>
          </q-card>

          <!-- Lista de Zapatos Vendidos -->
          <q-card class="beautiful-card">
            <q-card-section>
              <div class="text-h6 text-primary q-mb-md">
                <q-icon name="list" class="q-mr-sm" />
                Zapatos Vendidos - {{ fechaFormateada }}
              </div>

              <!-- Loading -->
              <div v-if="cargando" class="text-center q-py-lg">
                <q-spinner-hourglass size="40px" color="primary" />
                <div class="q-mt-sm text-grey-6">Cargando ventas...</div>
              </div>

              <!-- Tabla de Zapatos -->
              <q-table
                v-else
                :rows="zapatosVendidos"
                :columns="columns"
                row-key="id"
                flat
                bordered
                class="beautiful-table"
                :pagination="{ rowsPerPage: 0 }"
                hide-pagination
              >
                <!-- Columna de Ganancia con color -->
                <template v-slot:body-cell-ganancia="props">
                  <q-td :props="props">
                    <div class="text-weight-bold" :class="props.value >= 0 ? 'text-positive' : 'text-negative'">
                      ${{ formatPrice(Math.abs(props.value)) }}
                      <q-icon
                        :name="props.value >= 0 ? 'trending_up' : 'trending_down'"
                        :color="props.value >= 0 ? 'positive' : 'negative'"
                        class="q-ml-xs"
                      />
                    </div>
                  </q-td>
                </template>

                <!-- Columna de Precio con formato -->
                <template v-slot:body-cell-precio_vendido="props">
                  <q-td :props="props">
                    <div class="text-weight-bold text-green-8">
                      ${{ formatPrice(props.value) }}
                    </div>
                  </q-td>
                </template>

                <!-- Columna de Precio de Compra -->
                <template v-slot:body-cell-precio_compra="props">
                  <q-td :props="props">
                    <div class="text-grey-7">
                      ${{ formatPrice(props.value) }}
                    </div>
                  </q-td>
                </template>
              </q-table>

              <!-- Empty State -->
              <div v-if="!cargando && zapatosVendidos.length === 0" class="text-center q-py-xl">
                <q-icon name="shopping_cart_off" size="4rem" color="grey-4" />
                <div class="text-h6 text-grey-6 q-mt-md">
                  No hay ventas registradas
                </div>
                <div class="text-body2 text-grey-5 q-mt-xs">
                  Para la fecha {{ fechaFormateada }}
                </div>
                <q-btn
                  color="primary"
                  label="Realizar Nueva Venta"
                  icon="add_shopping_cart"
                  @click="$router.push('/ventas')"
                  class="q-mt-md"
                />
              </div>

            </q-card-section>
          </q-card>

            </div>
          </div>
        </div>
      </q-page>
    </q-page-container>
  </q-layout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import axios from 'axios'

const $q = useQuasar()

// Estado reactivo
const cargando = ref(false)
const fechaSeleccionada = ref(new Date().toISOString().split('T')[0]) // Fecha de hoy por defecto
const zapatosVendidos = ref([])
const resumenDia = ref(null)

// Computed
const fechaFormateada = computed(() => {
  const fecha = new Date(fechaSeleccionada.value + 'T00:00:00')
  return fecha.toLocaleDateString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
})

// Columnas de la tabla
const columns = [
  {
    name: 'marca',
    label: 'Marca',
    align: 'left',
    field: 'marca',
    sortable: true
  },
  {
    name: 'modelo',
    label: 'Modelo',
    align: 'left',
    field: 'modelo',
    sortable: true
  },
  {
    name: 'talla',
    label: 'Talla',
    align: 'center',
    field: 'talla',
    sortable: true
  },
  {
    name: 'precio_compra',
    label: 'Precio Compra',
    align: 'center',
    field: 'precio_compra',
    sortable: true
  },
  {
    name: 'precio_vendido',
    label: 'Precio Vendido',
    align: 'center',
    field: 'precio_vendido',
    sortable: true
  },
  {
    name: 'ganancia',
    label: 'Ganancia',
    align: 'center',
    field: 'ganancia',
    sortable: true
  },
  {
    name: 'cliente',
    label: 'Cliente',
    align: 'left',
    field: 'cliente_nombre',
    sortable: true
  },
  {
    name: 'hora',
    label: 'Hora (El Salvador UTC-6)',
    align: 'center',
    field: 'hora_venta',
    sortable: true
  }
]

// Métodos
const formatPrice = (price) => {
  return new Intl.NumberFormat('es-CO').format(price || 0)
}

const seleccionarHoy = () => {
  fechaSeleccionada.value = new Date().toISOString().split('T')[0]
  cargarVentasPorFecha()
}

const cargarVentasPorFecha = async () => {
  cargando.value = true

  try {
    console.log('📅 Cargando ventas para fecha:', fechaSeleccionada.value)

    const response = await axios.get(`http://localhost:3000/api/reportes/ventas-por-dia/${fechaSeleccionada.value}`)

    if (response.data.success) {
      zapatosVendidos.value = response.data.data.zapatos || []
      resumenDia.value = response.data.data.resumen || null

      console.log('✅ Ventas cargadas:', zapatosVendidos.value.length, 'zapatos')
      console.log('📊 Resumen del día:', resumenDia.value)
    } else {
      throw new Error(response.data.message || 'Error al cargar ventas')
    }

  } catch (error) {
    console.error('❌ Error cargando ventas:', error)

    $q.notify({
      type: 'negative',
      message: 'Error al cargar las ventas del día',
      position: 'top'
    })

    zapatosVendidos.value = []
    resumenDia.value = null
  } finally {
    cargando.value = false
  }
}

// Lifecycle
onMounted(() => {
  cargarVentasPorFecha()
})
</script>

<style scoped>
.bg-gradient {
  background: linear-gradient(135deg, #2c3e50 0%, #4a6491 100%);
}

.page-background {
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  min-height: 100vh;
  padding: 20px 0;
}

.beautiful-card {
  border-radius: 15px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(10px);
  background: rgba(255, 255, 255, 0.95);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.beautiful-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
}

.beautiful-table {
  border-radius: 10px;
  overflow: hidden;
}

.fecha-input {
  max-width: 200px;
}

.stat-box {
  padding: 20px;
  border-radius: 10px;
  text-align: center;
  border: 1px solid rgba(0, 0, 0, 0.1);
}

.stat-box .text-h5 {
  font-size: 1.8rem;
  margin-bottom: 5px;
}

/* Responsive */
@media (max-width: 600px) {
  .stat-box {
    padding: 15px 10px;
  }

  .stat-box .text-h5 {
    font-size: 1.4rem;
  }
}
</style>
