<template>
  <q-layout view="hHh lpR fFf">
    <q-header elevated class="bg-gradient text-white">
      <q-toolbar>
        <q-btn dense flat round icon="arrow_back" @click="navigateBack" />
        <q-toolbar-title>
          📄 Reportes Generales
        </q-toolbar-title>
      </q-toolbar>
    </q-header>

    <q-page-container>
      <div class="q-pa-md">
        <div class="row q-col-gutter-md">
          <!-- KPIs -->
          <div class="col-12 col-md-4">
            <q-card>
              <q-card-section>
                <div class="text-h6">Inversión</div>
                <div class="text-subtitle1">$21,450</div>
                <div class="text-caption">vs mes anterior: <span class="text-positive">+8%</span></div>
              </q-card-section>
            </q-card>
          </div>

          <div class="col-12 col-md-4">
            <q-card>
              <q-card-section>
                <div class="text-h6">Ganancias</div>
                <div class="text-subtitle1">$11,912</div>
                <div class="text-caption">vs mes anterior: <span class="text-negative">-3%</span></div>
              </q-card-section>
            </q-card>
          </div>
        </div>

        <!-- Gráficas -->
        <div class="row q-col-gutter-md q-mt-md">
          <div class="col-12 col-md-8">
            <q-card>
              <q-card-section>
                <div class="text-h6">📈 Ventas (mes)</div>
                <canvas id="salesChart" height="180"></canvas>
              </q-card-section>
            </q-card>
          </div>

          <div class="col-12 col-md-4">
            <q-card>
              <q-card-section>
                <div class="text-h6">🔍 Distribución por categoría</div>
                <canvas id="categoryChart" height="180"></canvas>
              </q-card-section>
            </q-card>
          </div>
        </div>

        <!-- Tabla -->
        <q-card class="q-mt-md">
          <q-card-section>
            <div class="text-h6">Detalle por producto / categoría</div>
            <q-table :rows="rows" :columns="columns" row-key="name" />
          </q-card-section>
        </q-card>
      </div>
    </q-page-container>
  </q-layout>
</template>

<script>
export default {
  name: 'ReportesPage',
  data() {
    return {
      rows: [],
      columns: [
        { name: 'producto', label: 'Producto / Categoría', field: 'producto' },
        { name: 'ventas', label: 'Ventas', field: 'ventas' },
        { name: 'variacion', label: 'Variación', field: 'variacion' },
        { name: 'cumplimiento', label: 'Cumplimiento', field: 'cumplimiento' }
      ]
    };
  },
  methods: {
    navigateBack() {
      this.$router.go(-1);
    }
  },
  mounted() {
    // Aquí puedes cargar datos dinámicos para las gráficas y la tabla
  }
};
</script>

<style scoped>
.q-layout {
  background-color: #f5f7fb;
}
.text-positive {
  color: #10b981;
}
.text-negative {
  color: #ef4444;
}
.bg-gradient {
  background: linear-gradient(90deg, #3b82f6, #1e3a8a);
}
</style>
