<template>
  <q-layout view="hHh lpR fFf">
    <!-- Header con menú hamburguesa -->
    <q-header elevated class="bg-gradient text-white">
      <q-toolbar>
        <q-btn
          dense
          flat
          round
          icon="menu"
          @click="leftDrawerOpen = !leftDrawerOpen"
        />
        <q-toolbar-title class="text-center">
          <div class="flex items-center justify-center">
            <q-icon name="storefront" class="q-mr-sm" size="sm" />
            Variedades JM
          </div>
        </q-toolbar-title>
        <q-btn
          dense
          flat
          round
          icon="notifications"
          @click="showNotifications"
        >
          <q-badge color="red" floating>3</q-badge>
        </q-btn>
      </q-toolbar>
    </q-header>

    <!-- Drawer/Menú lateral -->
    <q-drawer
      v-model="leftDrawerOpen"
      show-if-above
      :width="280"
      :breakpoint="600"
      bordered
      class="bg-white"
    >
      <q-scroll-area style="height: calc(100% - 150px); margin-top: 150px; border-right: 1px solid #ddd">
        <q-list padding>
          <q-item clickable v-ripple @click="navigateTo('dashboard')">
            <q-item-section avatar>
              <q-icon color="primary" name="dashboard" />
            </q-item-section>
            <q-item-section>
              <q-item-label>Dashboard</q-item-label>
            </q-item-section>
          </q-item>

          <q-item clickable v-ripple @click="navigateTo('/inventario')">
            <q-item-section avatar>
              <q-icon color="brown" name="inventory_2" />
            </q-item-section>
            <q-item-section>
              <q-item-label>Inventario</q-item-label>
              <q-item-label caption>Gestionar zapatos</q-item-label>
            </q-item-section>
          </q-item>

          <q-item clickable v-ripple @click="navigateTo('clientes')">
            <q-item-section avatar>
              <q-icon color="green" name="people" />
            </q-item-section>
            <q-item-section>
              <q-item-label>Clientes</q-item-label>
              <q-item-label caption>Base de clientes</q-item-label>
            </q-item-section>
          </q-item>

          <q-item clickable v-ripple @click="navigateTo('reservas')">
            <q-item-section avatar>
              <q-icon color="orange" name="bookmark" />
            </q-item-section>
            <q-item-section>
              <q-item-label>Reservas</q-item-label>
              <q-item-label caption>Apartados</q-item-label>
            </q-item-section>
          </q-item>

          <q-item clickable v-ripple @click="navigateTo('/ventas')">
            <q-item-section avatar>
              <q-icon color="purple" name="attach_money" />
            </q-item-section>
            <q-item-section>
              <q-item-label>Ventas</q-item-label>
              <q-item-label caption>Facturación</q-item-label>
            </q-item-section>
          </q-item>

          <q-item clickable v-ripple @click="navigateTo('reportes')">
            <q-item-section avatar>
              <q-icon color="blue" name="assessment" />
            </q-item-section>
            <q-item-section>
              <q-item-label>Reportes</q-item-label>
              <q-item-label caption>Análisis</q-item-label>
            </q-item-section>
          </q-item>

          <q-separator class="q-my-md" />

          <q-item clickable v-ripple @click="showSettings">
            <q-item-section avatar>
              <q-icon color="grey" name="settings" />
            </q-item-section>
            <q-item-section>
              <q-item-label>Configuración</q-item-label>
            </q-item-section>
          </q-item>

          <q-item clickable v-ripple @click="logout">
            <q-item-section avatar>
              <q-icon color="red" name="logout" />
            </q-item-section>
            <q-item-section>
              <q-item-label class="text-red">Cerrar Sesión</q-item-label>
            </q-item-section>
          </q-item>
        </q-list>
      </q-scroll-area>

      <!-- Header del drawer con usuario -->
      <div class="absolute-top bg-primary text-white" style="height: 150px">
        <div class="absolute-bottom bg-transparent">
          <q-avatar size="56px" class="q-mb-sm" color="white" text-color="primary">
            {{ getUserInitials(currentUser.username) }}
          </q-avatar>
          <div class="text-weight-bold">{{ currentUser.username }}</div>
          <div class="text-caption">{{ currentUser.role || 'Administrador' }}</div>
        </div>
      </div>
    </q-drawer>

    <!-- Contenido principal -->
    <q-page-container>
      <q-page padding>
        <!-- Saludo de bienvenida -->
        <div class="q-mb-lg">
          <h5 class="text-primary q-my-md">
            ¡Hola, {{ currentUser.username }}! 👋
          </h5>
          <p class="text-grey-7">
            Bienvenido a tu panel de control de Variedades JM
          </p>
        </div>

        <!-- Estadísticas rápidas -->
        <div class="row q-gutter-md q-mb-lg">
          <div class="col-12 col-sm-6 col-md-3">
            <q-card class="stat-card bg-blue text-white">
              <q-card-section>
                <div class="flex items-center justify-between">
                  <div>
                    <div class="text-h6">{{ stats.totalZapatos }}</div>
                    <div class="text-caption">Zapatos en Stock</div>
                  </div>
                  <q-icon name="inventory" size="2rem" />
                </div>
              </q-card-section>
            </q-card>
          </div>

          <div class="col-12 col-sm-6 col-md-3">
            <q-card class="stat-card bg-green text-white">
              <q-card-section>
                <div class="flex items-center justify-between">
                  <div>
                    <div class="text-h6">{{ stats.ventasHoy }}</div>
                    <div class="text-caption">Ventas Hoy</div>
                  </div>
                  <q-icon name="trending_up" size="2rem" />
                </div>
              </q-card-section>
            </q-card>
          </div>

          <div class="col-12 col-sm-6 col-md-3">
            <q-card class="stat-card bg-purple text-white">
              <q-card-section>
                <div class="flex items-center justify-between">
                  <div>
                    <div class="text-h6">{{ stats.totalClientes }}</div>
                    <div class="text-caption">Clientes</div>
                  </div>
                  <q-icon name="people" size="2rem" />
                </div>
              </q-card-section>
            </q-card>
          </div>

          <div class="col-12 col-sm-6 col-md-3">
            <q-card class="stat-card bg-orange text-white">
              <q-card-section>
                <div class="flex items-center justify-between">
                  <div>
                    <div class="text-h6">{{ stats.reservasPendientes }}</div>
                    <div class="text-caption">Reservas Pendientes</div>
                  </div>
                  <q-icon name="bookmark" size="2rem" />
                </div>
              </q-card-section>
            </q-card>
          </div>
        </div>

        <!-- Accesos rápidos -->
        <h6 class="text-grey-8 q-mb-md">Accesos Rápidos</h6>
        <div class="row q-gutter-md q-mb-lg">
          <div class="col-12 col-sm-6 col-md-4 col-lg-3" v-for="option in quickActions" :key="option.name">
            <q-card
              flat
              bordered
              class="quick-action-card cursor-pointer"
              @click="navigateTo(option.route)"
            >
              <q-card-section class="text-center">
                <q-icon
                  :name="option.icon"
                  :color="option.color"
                  size="3rem"
                  class="q-mb-sm"
                />
                <div class="text-weight-medium">{{ option.name }}</div>
                <div class="text-caption text-grey-6">{{ option.description }}</div>
              </q-card-section>
            </q-card>
          </div>
        </div>

        <!-- Actividad reciente -->
        <h6 class="text-grey-8 q-mb-md">Actividad Reciente</h6>
        <q-card flat bordered>
          <q-list separator>
            <q-item v-for="activity in recentActivity" :key="activity.id">
              <q-item-section avatar>
                <q-avatar
                  :color="activity.color"
                  text-color="white"
                  :icon="activity.icon"
                  size="40px"
                />
              </q-item-section>
              <q-item-section>
                <q-item-label>{{ activity.action }}</q-item-label>
                <q-item-label caption>{{ activity.time }}</q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-icon name="chevron_right" color="grey-5" />
              </q-item-section>
            </q-item>
          </q-list>
        </q-card>
      </q-page>
    </q-page-container>
  </q-layout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Notify } from 'quasar'
import axios from 'axios'

const router = useRouter()
const leftDrawerOpen = ref(false)

// Usuario actual
const currentUser = ref({
  username: localStorage.getItem('username') || 'Usuario',
  role: 'Administrador'
})

// Estadísticas
const stats = ref({
  totalZapatos: 0,
  ventasHoy: 0,
  totalVentasHoy: 0,
  totalClientes: 0,
  reservasPendientes: 0
})

// Acciones rápidas
const quickActions = ref([
  {
    name: 'Nueva Venta',
    description: 'Registrar venta',
    icon: 'add_shopping_cart',
    color: 'green',
    route: '/ventas'
  },
  {
    name: 'Agregar Zapato',
    description: 'Nuevo producto',
    icon: 'add_box',
    color: 'blue',
    route: '/agregar-zapato'
  },
  {
    name: 'Nuevo Cliente',
    description: 'Registrar cliente',
    icon: 'person_add',
    color: 'purple',
    route: '/agregar-cliente'
  },
  {
    name: 'Reserva',
    description: 'Crear apartado',
    icon: 'bookmark_add',
    color: 'orange',
    route: 'reservas'
  }
])

// Actividad reciente
const recentActivity = ref([
  {
    id: 1,
    action: 'Venta realizada - Zapatos Nike Air',
    time: 'Hace 30 minutos',
    icon: 'shopping_cart',
    color: 'green'
  },
  {
    id: 2,
    action: 'Cliente registrado - María González',
    time: 'Hace 1 hora',
    icon: 'person_add',
    color: 'blue'
  },
  {
    id: 3,
    action: 'Producto agregado - Adidas Ultraboost',
    time: 'Hace 2 horas',
    icon: 'add_box',
    color: 'purple'
  }
])

// Métodos
const getUserInitials = (username) => {
  if (!username) return 'U'
  return username
    .split(' ')
    .map(name => name.charAt(0).toUpperCase())
    .join('')
    .slice(0, 2) // Máximo 2 iniciales
}

const navigateTo = (route) => {
  // Si la ruta empieza con '/', es una ruta absoluta
  if (route.startsWith('/')) {
    router.push(route)
  } else {
    // Para rutas relativas, mostrar notificación temporal
    Notify.create({
      message: `Navegando a ${route}`,
      color: 'info',
      position: 'top'
    })
    // Aquí puedes implementar la navegación real cuando tengas las rutas
  }
}

const showNotifications = () => {
  Notify.create({
    message: 'Tienes 3 notificaciones nuevas',
    color: 'info',
    position: 'top'
  })
}

const showSettings = () => {
  Notify.create({
    message: 'Configuración próximamente',
    color: 'info',
    position: 'top'
  })
}

const logout = () => {
  // Limpiar localStorage
  localStorage.removeItem('token')
  localStorage.removeItem('username')

  Notify.create({
    message: 'Sesión cerrada exitosamente',
    color: 'positive',
    position: 'top'
  })

  // Redirigir al login
  router.push('/login')
}

// Cargar estadísticas al montar el componente
const loadStats = async () => {
  try {
    console.log('🔄 Cargando estadísticas reales...')

    const token = localStorage.getItem('token')
    const response = await axios.get('http://localhost:3000/api/stats', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })

    console.log('✅ Estadísticas obtenidas:', response.data)

    // Actualizar estadísticas con datos reales
    const data = response.data.data
    stats.value.totalZapatos = data.totalZapatos || 0
    stats.value.ventasHoy = data.ventasHoy || 0
    stats.value.totalVentasHoy = data.totalVentasHoy || 0
    stats.value.totalClientes = data.totalClientes || 0
    stats.value.reservasPendientes = data.reservasPendientes || 0

    console.log(`📊 Zapatos en stock: ${stats.value.totalZapatos}`)
    console.log(`📈 Ventas hoy: ${stats.value.ventasHoy}`)
  } catch (error) {
    console.error('❌ Error cargando estadísticas:', error)
    // Valores por defecto en caso de error
    stats.value.totalZapatos = 0
    stats.value.ventasHoy = 0
    stats.value.totalClientes = 0
    stats.value.reservasPendientes = 0
  }
}

// Cargar actividad reciente
const loadRecentActivity = async () => {
  try {
    console.log('🔄 Cargando actividad reciente...')

    const token = localStorage.getItem('token')
    const response = await axios.get('http://localhost:3000/api/stats/activity', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })

    console.log('✅ Actividad reciente obtenida:', response.data)
    recentActivity.value = response.data.data || []
  } catch (error) {
    console.error('❌ Error cargando actividad reciente:', error)
    // Mantener actividad por defecto si falla
  }
}

onMounted(() => {
  loadStats()
  loadRecentActivity()
})
</script>

<style lang="scss" scoped>
.bg-gradient {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.stat-card {
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.quick-action-card {
  border-radius: 12px;
  transition: transform 0.2s, box-shadow 0.2s;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
  }
}

.q-drawer {
  .q-item {
    border-radius: 0 25px 25px 0;
    margin-right: 12px;

    &:hover {
      background: rgba(103, 126, 234, 0.1);
    }
  }
}

.q-header {
  backdrop-filter: blur(10px);
}
</style>
