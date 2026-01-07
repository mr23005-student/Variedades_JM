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
            <q-icon name="inventory_2" class="q-mr-sm" size="sm" />
            Inventario de Zapatos
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

      <!-- Subtitle with counts -->
      <div class="text-center q-pb-md text-caption">
        {{ itemsPerPage }} pares por página • Total: {{ totalItems }} pares
      </div>
    </q-header>

    <!-- Page Container -->
    <q-page-container>
      <q-page>
        <!-- Filter Controls -->
        <div class="controls bg-grey-1 q-pa-md">
          <q-btn
            color="primary"
            outline
            dense
            icon="filter_list"
            label="Filtrar"
            @click="showFilters = true"
            class="full-width"
          />
        </div>

        <!-- Inventory Counter -->
        <div class="inventory-count bg-blue-1 q-pa-sm">
          <div class="row justify-between items-center text-blue-9">
            <div class="text-body2">
              Mostrando {{ startItem }}-{{ endItem }} de {{ totalItems }} pares
            </div>
            <div class="current-page-indicator q-px-sm q-py-xs bg-blue-9 text-white rounded">
              Página {{ currentPage }}/{{ totalPages }}
            </div>
          </div>
        </div>

        <!-- Loading State -->
        <div v-if="loading" class="q-pa-lg text-center">
          <q-spinner-hourglass size="40px" color="primary" />
          <div class="q-mt-sm text-grey-6">Cargando inventario...</div>
        </div>

        <!-- Shoes List -->
        <div v-else class="shoes-list">
          <div
            v-for="shoe in shoes"
            :key="shoe.id"
            class="shoe-item q-pa-md cursor-pointer"
            @click="selectShoe(shoe)"
          >
            <div class="row items-center">
              <!-- Shoe Image -->
              <div class="col-auto">
                <div class="shoe-image">
                  <img
                    v-if="shoe.imagen"
                    :src="shoe.imagen"
                    :alt="`${shoe.marca} ${shoe.modelo}`"
                    @error="handleImageError"
                    loading="lazy"
                  />
                  <!-- Placeholder siempre presente pero oculto inicialmente -->
                  <div class="image-placeholder" :style="{ display: shoe.imagen ? 'none' : 'flex' }">
                    <q-icon name="image" size="2rem" color="grey-5" />
                    <div class="text-caption text-grey-5 q-mt-xs">
                      Sin imagen
                    </div>
                  </div>
                </div>
              </div>

              <!-- Shoe Info -->
              <div class="col q-pl-md">
                <div class="shoe-brand text-weight-bold text-h6 text-primary">
                  {{ shoe.marca.toUpperCase() }}
                </div>
                <div class="shoe-model text-body1 text-grey-8 q-mb-xs">
                  {{ shoe.modelo }}
                </div>
                <div class="row items-center q-gutter-sm">
                  <div class="shoe-price text-weight-bold text-h6 text-positive">
                    ${{ formatPrice(shoe.precio_venta) }}
                  </div>
                  <q-chip
                    :color="getStatusColor(shoe.estado)"
                    text-color="white"
                    size="sm"
                    dense
                  >
                    {{ shoe.estado.toUpperCase() }}
                  </q-chip>
                </div>
                <div class="text-caption text-grey-6">
                  Talla: {{ shoe.talla }} • Código: {{ shoe.codigo || 'Sin código' }}
                </div>
              </div>
            </div>
          </div>

          <!-- Empty State -->
          <div v-if="!loading && shoes.length === 0" class="text-center q-pa-xl">
            <q-icon name="inventory_2" size="4rem" color="grey-4" />
            <div class="text-h6 text-grey-6 q-mt-md">
              No hay zapatos en inventario
            </div>
            <div class="text-body2 text-grey-5 q-mt-xs">
              Agrega zapatos para comenzar
            </div>
            <q-btn
              color="primary"
              label="Agregar Zapato"
              icon="add"
              @click="$router.push('/agregar-zapato')"
              class="q-mt-md"
            />
          </div>
        </div>
      </q-page>
    </q-page-container>

    <!-- Pagination -->
    <q-footer elevated class="bg-white text-primary">
      <div class="pagination q-pa-md">
        <div class="row justify-center items-center q-gutter-md">
          <q-btn
            flat
            icon="chevron_left"
            label="Anterior"
            :disable="currentPage === 1"
            @click="changePage(currentPage - 1)"
            color="primary"
          />
          <div class="page-info text-body2 text-grey-8">
            Página {{ currentPage }} de {{ totalPages }}
          </div>
          <q-btn
            flat
            icon-right="chevron_right"
            label="Siguiente"
            :disable="currentPage >= totalPages"
            @click="changePage(currentPage + 1)"
            color="primary"
          />
        </div>
      </div>
    </q-footer>

    <!-- Filter Dialog -->
    <q-dialog v-model="showFilters" position="bottom">
      <q-card class="filter-card">
        <q-card-section class="row items-center q-pb-none">
          <div class="text-h6">Filtros</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-card-section>
          <div class="q-gutter-md">
            <!-- Estado Filter -->
            <q-select
              v-model="filters.estado"
              :options="estadoOptions"
              label="Estado"
              outlined
              clearable
              emit-value
              map-options
            />

            <!-- Marca Filter -->
            <q-select
              v-model="filters.marca"
              :options="marcaOptions"
              label="Marca"
              outlined
              clearable
              use-input
              @filter="filterMarcas"
            />

            <!-- Price Range -->
            <div class="text-subtitle2 q-mb-sm">Rango de Precio</div>
            <div class="row q-col-gutter-md">
              <div class="col">
                <q-input
                  v-model.number="filters.minPrecio"
                  label="Precio mínimo"
                  type="number"
                  outlined
                  prefix="$"
                />
              </div>
              <div class="col">
                <q-input
                  v-model.number="filters.maxPrecio"
                  label="Precio máximo"
                  type="number"
                  outlined
                  prefix="$"
                />
              </div>
            </div>
          </div>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Limpiar" @click="clearFilters" />
          <q-btn color="primary" label="Aplicar" @click="applyFilters" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Shoe Detail Dialog -->
    <q-dialog v-model="showShoeDetail" v-if="selectedShoe">
      <q-card class="shoe-detail-card">
        <q-card-section class="row items-center q-pb-none">
          <div class="text-h6">Detalle del Zapato</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-card-section>
          <div class="row q-col-gutter-md">
            <div class="col-12 col-md-4">
              <div class="shoe-detail-image">
                <img
                  v-if="selectedShoe.imagen"
                  :src="selectedShoe.imagen"
                  :alt="`${selectedShoe.marca} ${selectedShoe.modelo}`"
                />
                <div v-else class="image-placeholder-large">
                  <q-icon name="image" size="4rem" color="grey-4" />
                </div>
              </div>
            </div>
            <div class="col-12 col-md-8">
              <div class="text-h5 text-weight-bold text-primary q-mb-sm">
                {{ selectedShoe.marca.toUpperCase() }}
              </div>
              <div class="text-h6 q-mb-md">{{ selectedShoe.modelo }}</div>

              <div class="row q-col-gutter-md q-mb-md">
                <div class="col">
                  <div class="text-caption text-grey-6">Precio</div>
                  <div class="text-h6 text-positive">${{ formatPrice(selectedShoe.precio_venta) }}</div>
                </div>
                <div class="col">
                  <div class="text-caption text-grey-6">Estado</div>
                  <q-chip
                    :color="getStatusColor(selectedShoe.estado)"
                    text-color="white"
                  >
                    {{ selectedShoe.estado.toUpperCase() }}
                  </q-chip>
                </div>
              </div>

              <div class="row q-col-gutter-md">
                <div class="col">
                  <div class="text-caption text-grey-6">Talla</div>
                  <div class="text-body1">{{ selectedShoe.talla }}</div>
                </div>
                <div class="col">
                  <div class="text-caption text-grey-6">Código</div>
                  <div class="text-body1">{{ selectedShoe.codigo || 'Sin código' }}</div>
                </div>
              </div>
            </div>
          </div>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Cerrar" v-close-popup />
          <q-btn
            color="negative"
            outline
            label="Eliminar"
            @click="confirmDeleteShoe(selectedShoe)"
          />
          <q-btn color="primary" label="Editar" @click="editShoe(selectedShoe)" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Delete Confirmation Dialog -->
    <q-dialog v-model="showDeleteConfirm" persistent>
      <q-card style="min-width: 300px">
        <q-card-section>
          <div class="text-h6 text-negative">
            <q-icon name="warning" class="q-mr-sm" />
            Confirmar Eliminación
          </div>
        </q-card-section>

        <q-card-section v-if="shoeToDelete">
          <div class="text-body2">
            ¿Estás seguro de que quieres eliminar el zapato
            <strong>"{{ shoeToDelete.marca }} {{ shoeToDelete.modelo }}"</strong>?
          </div>
          <div class="text-body2 text-negative q-mt-sm">
            Esta acción no se puede deshacer.
          </div>
        </q-card-section>

        <q-card-actions align="right" class="text-primary">
          <q-btn flat label="Cancelar" @click="cancelDelete" />
          <q-btn flat label="Eliminar" color="negative" @click="executeDelete" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-layout>
</template>

<script>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import axios from 'axios'

export default {
  name: 'InventarioPage',
  setup() {
    const router = useRouter()
    const $q = useQuasar()

    // Estado reactivo
    const loading = ref(false)
    const shoes = ref([])
    const currentPage = ref(1)
    const itemsPerPage = ref(20)
    const totalItems = ref(0)
    const showDeleteConfirm = ref(false)
    const shoeToDelete = ref(null)
    const showFilters = ref(false)
    const showShoeDetail = ref(false)
    const selectedShoe = ref(null)

    // Filtros
    const filters = reactive({
      estado: null,
      marca: null,
      minPrecio: null,
      maxPrecio: null
    })

    // Options para filtros
    const estadoOptions = [
      { label: 'Activo', value: 'activo' },
      { label: 'Reservado', value: 'reservado' },
      { label: 'Vendido', value: 'vendido' }
    ]

    const marcaOptions = ref([])
    const allMarcas = ref([])

    // Computed properties
    const totalPages = computed(() => Math.ceil(totalItems.value / itemsPerPage.value))

    const startItem = computed(() => {
      return totalItems.value === 0 ? 0 : (currentPage.value - 1) * itemsPerPage.value + 1
    })

    const endItem = computed(() => {
      return Math.min(currentPage.value * itemsPerPage.value, totalItems.value)
    })



    // Cargar zapatos
    const fetchShoes = async () => {
      loading.value = true

      try {
        const params = {
          page: currentPage.value,
          limit: itemsPerPage.value
        }



        // Agregar filtros
        if (filters.estado) params.estado = filters.estado
        if (filters.marca) params.marca = filters.marca
        if (filters.minPrecio) params.minPrecio = filters.minPrecio
        if (filters.maxPrecio) params.maxPrecio = filters.maxPrecio

        console.log('Fetching shoes with params:', params)

        const response = await axios.get('http://localhost:3000/api/zapatos', { params })

        shoes.value = response.data.zapatos || []
        totalItems.value = response.data.pagination?.total || 0

        console.log(`Loaded ${shoes.value.length} shoes, total: ${totalItems.value}`)

      } catch (error) {
        console.error('Error fetching shoes:', error)

        $q.notify({
          type: 'negative',
          message: 'Error al cargar el inventario',
          position: 'top'
        })

        shoes.value = []
        totalItems.value = 0
      } finally {
        loading.value = false
      }
    }

    // Cambiar página
    const changePage = (newPage) => {
      if (newPage >= 1 && newPage <= totalPages.value) {
        currentPage.value = newPage
        fetchShoes()
      }
    }

    // Manejar errores de imagen
    const handleImageError = (event) => {
      event.target.style.display = 'none'
      // Mostrar placeholder si la imagen falla
      const parent = event.target.parentElement
      if (parent) {
        const placeholder = parent.querySelector('.image-placeholder')
        if (placeholder) {
          placeholder.style.display = 'block'
        }
      }
    }

    // Formatear precio
    const formatPrice = (price) => {
      return new Intl.NumberFormat('es-CO').format(price || 0)
    }

    // Color del estado
    const getStatusColor = (estado) => {
      const colors = {
        activo: 'positive',
        reservado: 'warning',
        vendido: 'negative'
      }
      return colors[estado] || 'grey'
    }

    // Seleccionar zapato
    const selectShoe = (shoe) => {
      selectedShoe.value = shoe
      showShoeDetail.value = true
    }

    // Editar zapato
    const editShoe = (shoe) => {
      console.log('Navigating to edit shoe:', shoe)
      router.push(`/editar-zapato/${shoe.id}`)
    }

    // Confirmar eliminación de zapato
    const confirmDeleteShoe = (shoe) => {
      shoeToDelete.value = shoe
      showDeleteConfirm.value = true
    }

    // Ejecutar eliminación
    const executeDelete = () => {
      if (shoeToDelete.value) {
        deleteShoe(shoeToDelete.value)
        showDeleteConfirm.value = false
        shoeToDelete.value = null
      }
    }

    // Cancelar eliminación
    const cancelDelete = () => {
      showDeleteConfirm.value = false
      shoeToDelete.value = null
    }

    // Eliminar zapato
    const deleteShoe = async (shoe) => {
      loading.value = true

      try {
        await axios.delete(`http://localhost:3000/api/zapatos/${shoe.id}`)

        $q.notify({
          type: 'positive',
          message: `Zapato "${shoe.marca} ${shoe.modelo}" eliminado exitosamente`,
          position: 'top',
          icon: 'check'
        })

        // Cerrar el modal
        showShoeDetail.value = false

        // Recargar la lista de zapatos
        fetchShoes()

      } catch (error) {
        console.error('Error deleting shoe:', error)

        const mensaje = error.response?.data?.message ||
                       error.response?.data?.error ||
                       'Error al eliminar zapato'

        $q.notify({
          type: 'negative',
          message: mensaje,
          position: 'top',
          icon: 'error'
        })
      } finally {
        loading.value = false
      }
    }

    // Filtros
    const filterMarcas = (val, update) => {
      update(() => {
        if (val === '') {
          marcaOptions.value = allMarcas.value
        } else {
          const needle = val.toLowerCase()
          marcaOptions.value = allMarcas.value.filter(
            marca => marca.toLowerCase().indexOf(needle) > -1
          )
        }
      })
    }

    const clearFilters = () => {
      filters.estado = null
      filters.marca = null
      filters.minPrecio = null
      filters.maxPrecio = null
    }

    const applyFilters = () => {
      currentPage.value = 1
      showFilters.value = false
      fetchShoes()
    }

    // Cargar marcas disponibles
    const loadMarcas = async () => {
      try {
        // Esto sería un endpoint separado, por ahora extraemos de los zapatos actuales
        const uniqueMarcas = [...new Set(shoes.value.map(shoe => shoe.marca))]
        allMarcas.value = uniqueMarcas.sort()
        marcaOptions.value = allMarcas.value
      } catch (error) {
        console.error('Error loading brands:', error)
      }
    }

    // Lifecycle
    onMounted(() => {
      fetchShoes()
    })

    // Watch para actualizar marcas cuando cambien los zapatos
    watch(shoes, () => {
      loadMarcas()
    })

    return {
      // Estado
      loading,
      shoes,
      currentPage,
      itemsPerPage,
      totalItems,
      showFilters,
      showShoeDetail,
      selectedShoe,
      filters,

      // Options
      estadoOptions,
      marcaOptions,

      // Computed
      totalPages,
      startItem,
      endItem,

      // Métodos
      fetchShoes,
      changePage,
      handleImageError,
      formatPrice,
      getStatusColor,
      selectShoe,
      editShoe,
      confirmDeleteShoe,
      executeDelete,
      cancelDelete,
      filterMarcas,
      clearFilters,
      applyFilters,

      // Delete dialog
      showDeleteConfirm,
      shoeToDelete
    }
  }
}
</script>

<style scoped>
/* Header gradient */
.bg-gradient {
  background: linear-gradient(135deg, #2c3e50 0%, #4a6491 100%);
}

/* Controls */
.controls {
  border-bottom: 1px solid #eee;
}

.search-input {
  border-radius: 8px;
}

/* Inventory counter */
.inventory-count {
  border-bottom: 1px solid #d0e4ff;
}

.current-page-indicator {
  border-radius: 20px;
  font-size: 0.9rem;
}

/* Shoes list */
.shoes-list {
  padding-bottom: 80px; /* Space for pagination */
}

.shoe-item {
  border-bottom: 1px solid #eee;
  transition: background-color 0.2s;
}

.shoe-item:hover {
  background-color: #f9f9f9;
}

.shoe-image {
  width: 100px;
  height: 100px;
  border-radius: 8px;
  overflow: hidden;
  background-color: #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #eaeaea;
}

.shoe-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.image-placeholder {
  text-align: center;
  color: #aaa;
}

/* Pagination */
.pagination {
  background-color: #f9f9f9;
  border-top: 1px solid #eee;
}

/* Dialog styles */
.filter-card {
  width: 100%;
  max-width: 400px;
}

.shoe-detail-card {
  width: 100%;
  max-width: 600px;
}

.shoe-detail-image {
  width: 100%;
  max-width: 200px;
  border-radius: 8px;
  overflow: hidden;
  background-color: #f0f0f0;
}

.shoe-detail-image img {
  width: 100%;
  height: auto;
  object-fit: cover;
}

.image-placeholder-large {
  height: 200px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #aaa;
}

/* Responsive */
@media (max-width: 600px) {
  .shoe-image {
    width: 85px;
    height: 85px;
  }

  .shoe-brand {
    font-size: 1rem;
  }
}
</style>
