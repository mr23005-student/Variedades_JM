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
            <q-icon name="event" class="q-mr-sm" size="sm" />
            Reservaciones
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

    <!-- Page Container -->
    <q-page-container>
      <q-page>
        <!-- Filters -->
        <div class="filters bg-grey-1 q-pa-md">
          <q-select
            outlined
            label="Ordenar por fecha"
            v-model="filters.orden"
            :options="[
              { label: 'Más antigua primero', value: 'asc' },
              { label: 'Más reciente primero', value: 'desc' }
            ]"
            class="q-mb-md"
          />
          <q-input
            outlined
            label="Buscar por número de teléfono"
            v-model="filters.telefono"
            placeholder="Ej: 7123-4567"
          />
        </div>

        <!-- Reservations List -->
        <div v-if="loading" class="q-pa-lg text-center">
          <q-spinner-hourglass size="40px" color="primary" />
          <div class="q-mt-sm text-grey-6">Cargando reservaciones...</div>
        </div>

        <div v-else class="list">
          <div
            v-for="reservation in reservations"
            :key="reservation.id"
            class="item"
          >
            <div class="item-title">{{ reservation.cliente }} {{ reservation.telefono }}</div>
            <div class="item-date">{{ new Date(reservation.fecha_reserva).toLocaleDateString() }}</div>
            <div class="item-details">
              <span>{{ reservation.marca }}</span>
              <span>Talla {{ reservation.talla }}</span>
              <span class="price">${{ reservation.precio_venta }}</span>
            </div>
          </div>

          <div v-if="!loading && reservations.length === 0" class="text-center q-pa-xl">
            No hay reservaciones disponibles.
          </div>
        </div>

        <!-- Pagination -->
        <q-footer elevated class="bg-white text-primary">
          <div class="pagination q-pa-md">
            <div class="row justify-center items-center q-gutter-md">
              <q-btn
                flat
                round
                dense
                icon="chevron_left"
                :disable="currentPage === 1"
                @click="changePage(currentPage - 1)"
              />
              <div class="page-info text-body2 text-grey-8">
                Página {{ currentPage }} de {{ totalPages }} ({{ itemsPerPage }} por página)
              </div>
              <q-btn
                flat
                round
                dense
                icon="chevron_right"
                :disable="currentPage === totalPages"
                @click="changePage(currentPage + 1)"
              />
            </div>
          </div>
        </q-footer>
      </q-page>
    </q-page-container>
  </q-layout>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import axios from 'axios'

export default {
  name: 'ReservationPage',
  setup() {
    const loading = ref(false)
    const reservations = ref([])
    const currentPage = ref(1)
    const itemsPerPage = ref(20)
    const totalItems = ref(0)

    const filters = ref({
      telefono: '',
      orden: 'asc' // Valor predeterminado para el orden
    })

    const totalPages = computed(() => Math.ceil(totalItems.value / itemsPerPage.value))

    const fetchReservations = async () => {
      loading.value = true
      try {
        const params = {
          page: currentPage.value,
          limit: itemsPerPage.value,
          orden: filters.value.orden, // Agregar el orden al parámetro
        }
        const response = await axios.get('http://localhost:3000/api/reservas', { params })
        reservations.value = response.data.reservas || []
        totalItems.value = response.data.pagination?.total || 0
        console.log('Datos recibidos:', response.data.reservas) // Debug para ver qué datos llegan
      } catch (error) {
        console.error('Error fetching reservations:', error)
      } finally {
        loading.value = false
      }
    }

    const changePage = (newPage) => {
      if (newPage >= 1 && newPage <= totalPages.value) {
        currentPage.value = newPage
        fetchReservations()
      }
    }

    onMounted(() => {
      fetchReservations()
    })

    return {
      loading,
      reservations,
      currentPage,
      itemsPerPage,
      totalItems,
      filters,
      totalPages,
      fetchReservations,
      changePage
    }
  }
}
</script>

<style scoped>
.bg-gradient {
  background: linear-gradient(135deg, #2c3e50 0%, #4a6491 100%);
}

.filters {
  border-bottom: 1px solid #eee;
}

.list {
  padding-bottom: 80px;
}

.item {
  padding: 12px 16px;
  border-bottom: 1px solid #e5e7eb;
}

.item-title {
  font-weight: bold;
  font-size: 15px;
  margin-bottom: 2px;
}

.item-subtitle {
  font-size: 12px;
  color: #6b7280;
  margin-bottom: 2px;
}

.item-date {
  font-size: 11px;
  color: #9ca3af;
  margin-bottom: 4px;
}

.item-details {
  font-size: 13px;
  color: #4b5563;
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
}

.price {
  font-weight: bold;
  color: #059669;
}

.pagination {
  background-color: #f9fafb;
  border-top: 1px solid #eee;
}
</style>
