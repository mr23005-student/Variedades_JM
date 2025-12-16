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
        <!-- Selección de periodo -->
        <div class="q-mb-md">
          <div class="text-subtitle1 q-mb-sm">Seleccione un periodo de tiempo</div>
          <q-select
            outlined
            v-model="selectedPeriod"
            :options="['Diario', 'Semanal', 'Mensual']"
            label="Selecciona el periodo del reporte"
          />
          <q-btn
            class="q-mt-md"
            color="primary"
            label="Generar Reporte"
            @click="generateReport"
          />
        </div>

        <!-- Mensaje de reporte generado -->
        <div v-if="reportMessage" class="q-my-md text-h6 text-center" :class="isViewingSavedReport ? 'text-orange' : 'text-primary'">
          <q-icon v-if="isViewingSavedReport" name="archive" class="q-mr-sm" />
          {{ reportMessage }}
        </div>

        <!-- Indicador de reporte guardado -->
        <div v-if="isViewingSavedReport" class="q-mb-md">
          <q-banner class="bg-orange-1 text-orange-9">
            <template v-slot:avatar>
              <q-icon name="info" color="orange" />
            </template>
            Estás viendo un reporte guardado. Los datos mostrados son históricos.
          </q-banner>
        </div>

        <div class="row q-col-gutter-md">
          <!-- KPIs -->
          <div class="col-12 col-md-4">
            <q-card>
              <q-card-section>
                <div class="text-h6">Inversión</div>
                <div class="text-subtitle1">${{ inversion.toLocaleString() }}</div>
                <q-skeleton v-if="loading" type="text" class="text-subtitle1" />
              </q-card-section>
            </q-card>
          </div>

          <div class="col-12 col-md-4">
            <q-card>
              <q-card-section>
                <div class="text-h6">Ganancias</div>
                <div class="text-subtitle1">${{ ganancias.toLocaleString() }}</div>
                <q-skeleton v-if="loading" type="text" class="text-subtitle1" />
              </q-card-section>
            </q-card>
          </div>
        </div>

        <!-- Gráficas -->
        <div class="row q-col-gutter-md q-mt-md">
          <div class="col-12">
            <q-card>
              <q-card-section>
                <div class="text-h6">📊 Marcas Más Vendidas (Cantidad de Ventas)</div>
                <canvas id="topBrandsChart" height="180"></canvas>
              </q-card-section>
            </q-card>
          </div>
        </div>

        <!-- Inventario (calzado, clientes, reservas) -->
        <div class="row q-col-gutter-md q-mt-md">
          <div class="col-12 col-md-6">
            <q-card>
              <q-card-section>
                <div class="text-h6">👟 Calzado Agregado</div>
                <div class="text-subtitle1">{{ footwearAdded }}</div>
              </q-card-section>
            </q-card>
          </div>

          <div class="col-12 col-md-6">
            <q-card>
              <q-card-section>
                <div class="text-h6">📅 Reservas Agregadas</div>
                <div class="text-subtitle1">{{ reservationsAdded }}</div>
              </q-card-section>
            </q-card>
          </div>
        </div>

        <!-- Zapatos vendidos -->
        <div class="row q-col-gutter-md q-mt-md">
          <div class="col-12">
            <q-card>
              <q-card-section>
                <div class="text-h6">👟 Zapatos Vendidos</div>
                <q-table :rows="soldShoes" :columns="soldShoesColumns" row-key="marca" />
              </q-card-section>
            </q-card>
          </div>
        </div>

        <!-- Botones para guardar y ver reportes -->
        <div class="row q-col-gutter-md q-mt-md items-center">
          <div class="col-4">
            <q-btn
              color="primary"
              label="Guardar Reportes"
              :disable="selectedPeriod !== 'Mensual'"
              @click="saveReports"
              class="full-width"
            />
          </div>
          <div class="col-4">
            <q-btn
              color="secondary"
              label="Ver Reportes"
              @click="viewSavedReports"
              class="full-width"
            />
          </div>
          <div class="col-4">
            <q-btn
              color="orange"
              label="Limpiar"
              icon="refresh"
              @click="clearAndGenerateNew"
              class="full-width"
            />
          </div>
        </div>

      </div>
    </q-page-container>

    <!-- Modal para ver reportes guardados -->
    <q-dialog v-model="showReportsModal" persistent>
      <q-card style="min-width: 400px">
        <q-card-section>
          <div class="text-h6">📊 Ver Reportes Guardados</div>
        </q-card-section>

        <q-card-section class="q-pt-none">
          <!-- Selectores de año y mes -->
          <div class="row q-col-gutter-md">
            <div class="col-6">
              <q-select
                filled
                v-model="selectedYear"
                :options="availableYears"
                label="Año"
                @update:model-value="loadSavedReports"
              />
            </div>
            <div class="col-6">
              <q-select
                filled
                v-model="selectedMonth"
                :options="availableMonths"
                label="Mes"
                @update:model-value="loadSavedReports"
              />
            </div>
          </div>

          <!-- Lista de reportes -->
          <div class="q-mt-md">
            <q-list bordered separator v-if="savedReports.length > 0">
              <q-item
                v-for="report in savedReports"
                :key="report.id"
                clickable
                @click="loadReportData(report)"
              >
                <q-item-section>
                  <q-item-label>📅 {{ formatDate(report.fecha) }}</q-item-label>
                  <q-item-label caption>
                    Ventas: ${{ report.ventas_totales.toLocaleString() }}
                  </q-item-label>
                </q-item-section>
                <q-item-section side>
                  <q-btn
                    icon="visibility"
                    size="sm"
                    color="primary"
                    flat
                    round
                    @click.stop="loadReportData(report)"
                  />
                </q-item-section>
              </q-item>
            </q-list>
            <div v-else class="text-center text-grey q-pa-md">
              No hay reportes guardados para este período
            </div>
          </div>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Cerrar" color="primary" @click="showReportsModal = false" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-layout>
</template>

<script>
import Chart from 'chart.js/auto';

export default {
  name: 'ReportesPage',
  data() {
    return {
      selectedPeriod: 'Mensual',
      reportMessage: '',
      loading: false,
      // Modal de reportes guardados
      showReportsModal: false,
      savedReports: [],
      selectedYear: new Date().getFullYear(),
      selectedMonth: new Date().getMonth() + 1,
      availableYears: [],
      availableMonths: [
        { label: 'Enero', value: 1 },
        { label: 'Febrero', value: 2 },
        { label: 'Marzo', value: 3 },
        { label: 'Abril', value: 4 },
        { label: 'Mayo', value: 5 },
        { label: 'Junio', value: 6 },
        { label: 'Julio', value: 7 },
        { label: 'Agosto', value: 8 },
        { label: 'Septiembre', value: 9 },
        { label: 'Octubre', value: 10 },
        { label: 'Noviembre', value: 11 },
        { label: 'Diciembre', value: 12 }
      ],
      isViewingSavedReport: false,
      // Datos reales del backend
      inversion: 0,
      ganancias: 0,
      topBrands: [],
      topBrandsData: [],
      footwearAdded: 0,
      reservationsAdded: 0,
      soldShoes: [
        { marca: 'Marca A', talla: '42', precio: '$50', ganancia: '$20', fecha: '2025-12-15' },
        { marca: 'Marca B', talla: '40', precio: '$60', ganancia: '$25', fecha: '2025-12-14' },
        { marca: 'Marca C', talla: '38', precio: '$45', ganancia: '$15', fecha: '2025-12-13' }
      ],
      soldShoesColumns: [
        { name: 'marca', label: 'Marca', field: 'marca' },
        { name: 'talla', label: 'Talla', field: 'talla' },
        { name: 'precio', label: 'Precio Vendido', field: 'precio' },
        { name: 'ganancia', label: 'Ganancia', field: 'ganancia' },
        { name: 'fecha', label: 'Fecha', field: 'fecha' }
      ],
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
    },
    async generateReport() {
      this.loading = true;
      this.reportMessage = `Generando reporte ${this.selectedPeriod.toLowerCase()}...`;

      try {
        const fechas = this.calculatePeriodDates();
        await this.fetchReportData(fechas);
        this.reportMessage = `Reporte ${this.selectedPeriod.toLowerCase()} generado exitosamente`;
      } catch (error) {
        console.error('Error al generar reporte:', error);
        this.reportMessage = 'Error al generar el reporte';
        this.$q.notify({
          type: 'negative',
          message: 'Error al obtener datos del reporte'
        });
      } finally {
        this.loading = false;
      }
    },
    calculatePeriodDates() {
      const today = new Date();
      let fechaDesde, fechaHasta, grupo;

      switch (this.selectedPeriod) {
        case 'Diario': {
          fechaDesde = fechaHasta = today.toISOString().split('T')[0];
          grupo = 'dia';
          break;
        }
        case 'Semanal': {
          const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay()));
          const endOfWeek = new Date(today.setDate(today.getDate() - today.getDay() + 6));
          fechaDesde = startOfWeek.toISOString().split('T')[0];
          fechaHasta = endOfWeek.toISOString().split('T')[0];
          grupo = 'dia';
          break;
        }
        case 'Mensual': {
          const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
          const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
          fechaDesde = startOfMonth.toISOString().split('T')[0];
          fechaHasta = endOfMonth.toISOString().split('T')[0];
          grupo = 'mes';
          break;
        }
      }

      return { fechaDesde, fechaHasta, grupo };
    },
    async fetchReportData({ fechaDesde, fechaHasta, grupo }) {
      try {
        // Obtener datos de ventas
        const ventasUrl = fechaDesde && fechaHasta ?
          `http://localhost:3000/api/reportes/ventas?fecha_desde=${fechaDesde}&fecha_hasta=${fechaHasta}&grupo=${grupo}` :
          `http://localhost:3000/api/reportes/ventas?grupo=${grupo}`;
        const ventasResponse = await fetch(ventasUrl);
        const ventasData = await ventasResponse.json();

        // Obtener datos de inventario
        const inventarioResponse = await fetch('http://localhost:3000/api/reportes/inventario');
        const inventarioData = await inventarioResponse.json();

        // Obtener productos más vendidos
        const productosUrl = fechaDesde && fechaHasta ?
          `http://localhost:3000/api/reportes/productos-mas-vendidos?fecha_desde=${fechaDesde}&fecha_hasta=${fechaHasta}&limite=5` :
          `http://localhost:3000/api/reportes/productos-mas-vendidos?limite=5`;
        const productosResponse = await fetch(productosUrl);
        const productosData = await productosResponse.json();

        // Obtener datos del dashboard
        const dashboardResponse = await fetch('http://localhost:3000/api/reportes/dashboard');
        const dashboardData = await dashboardResponse.json();

        // Obtener zapatos agregados en el período
        const zapatosAgregadosResponse = await fetch(`http://localhost:3000/api/reportes/zapatos-agregados?fecha_desde=${fechaDesde}&fecha_hasta=${fechaHasta}`);
        const zapatosAgregadosData = await zapatosAgregadosResponse.json();

        // Obtener reservas agregadas en el período
        const reservasAgregadasResponse = await fetch(`http://localhost:3000/api/reportes/reservas-agregadas?fecha_desde=${fechaDesde}&fecha_hasta=${fechaHasta}`);
        const reservasAgregadasData = await reservasAgregadasResponse.json();

        // Actualizar datos
        this.updateReportData(ventasData, inventarioData, productosData, dashboardData, zapatosAgregadosData, reservasAgregadasData, { fechaDesde, fechaHasta });

        // Actualizar gráfica
        this.updateChart();

      } catch (error) {
        console.error('Error fetching report data:', error);
        throw error;
      }
    },
    updateReportData(ventas, inventario, productos, dashboard, zapatosAgregados, reservasAgregadas, fechas) {
      // Actualizar KPIs
      if (ventas && ventas.totales) {
        this.inversion = ventas.totales.total_inversion || 0;
        this.ganancias = ventas.totales.total_ganancias || 0;
      } else {
        this.inversion = 0;
        this.ganancias = 0;
      }

      // Actualizar inventario con datos del período
      this.footwearAdded = zapatosAgregados ? zapatosAgregados.length : 0;
      this.clientsAdded = 0; // No mostrar clientes
      this.reservationsAdded = reservasAgregadas ? reservasAgregadas.length : 0;

      // Actualizar productos más vendidos (por marca)
      if (productos && productos.length > 0) {
        this.topBrands = productos.map(p => p.marca_original || p.marca_normalizada);
        this.topBrandsData = productos.map(p => p.total_vendidos || 0);
      } else {
        this.topBrands = ['Sin datos'];
        this.topBrandsData = [0];
      }

      // Actualizar zapatos vendidos - obtener detalles individuales
      if (fechas) {
        this.fetchSoldShoesDetails(fechas);
      }
    },
    updateChart() {
      const ctx = document.getElementById('topBrandsChart');
      if (ctx && this.topBrands.length > 0) {
        // Destruir gráfica anterior si existe
        if (this.chart) {
          this.chart.destroy();
        }

        this.chart = new Chart(ctx.getContext('2d'), {
          type: 'bar',
          data: {
            labels: this.topBrands,
            datasets: [{
              label: 'Cantidad de Ventas',
              data: this.topBrandsData,
              backgroundColor: ['#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe', '#dbeafe', '#1e40af', '#2563eb']
            }]
          },
          options: {
            responsive: true,
            plugins: {
              legend: {
                display: true
              },
              tooltip: {
                callbacks: {
                  label: function(context) {
                    return `${context.dataset.label}: ${context.parsed.y} ventas`;
                  }
                }
              }
            },
            scales: {
              y: {
                beginAtZero: true,
                ticks: {
                  stepSize: 1,
                  callback: function(value) {
                    if (Number.isInteger(value)) {
                      return value;
                    }
                  }
                },
                title: {
                  display: true,
                  text: 'Cantidad de Ventas'
                }
              },
              x: {
                title: {
                  display: true,
                  text: 'Marcas'
                }
              }
            }
          }
        });
      }
    },
    async saveReports() {
      if (this.selectedPeriod !== 'Mensual') return;

      this.loading = true;
      try {
        const fechas = this.calculatePeriodDates();
        const reportData = {
          fecha: fechas.fechaHasta,
          ventas_totales: this.ganancias,
          datos: {
            inversion: this.inversion,
            ganancias: this.ganancias,
            topBrands: this.topBrands,
            topBrandsData: this.topBrandsData,
            inventario: {
              calzado: this.footwearAdded,
              clientes: this.clientsAdded,
              reservas: this.reservationsAdded
            },
            zapatos_vendidos: this.soldShoes
          }
        };

        const response = await fetch('http://localhost:3000/api/reportes/guardar', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(reportData)
        });

        if (response.ok) {
          this.$q.notify({
            type: 'positive',
            message: 'Reporte guardado exitosamente'
          });
        } else {
          throw new Error('Error al guardar reporte');
        }
      } catch (error) {
        console.error('Error guardando reporte:', error);
        this.$q.notify({
          type: 'negative',
          message: 'Error al guardar el reporte'
        });
      } finally {
        this.loading = false;
      }
    },
    async fetchSoldShoesDetails({ fechaDesde, fechaHasta }) {
      try {
        const response = await fetch(`http://localhost:3000/api/reportes/zapatos-vendidos-detalle?fecha_desde=${fechaDesde}&fecha_hasta=${fechaHasta}`);
        const zapatosVendidos = await response.json();

        if (zapatosVendidos && zapatosVendidos.length > 0) {
          this.soldShoes = zapatosVendidos.map(zapato => ({
            marca: `${zapato.marca} ${zapato.modelo}`,
            talla: zapato.talla,
            precio: `$${zapato.precio_venta}`,
            ganancia: `$${zapato.ganancia}`,
            fecha: zapato.fecha_venta.split('T')[0] // Solo la fecha, sin la hora
          }));
        } else {
          this.soldShoes = [{
            marca: 'Sin ventas',
            talla: 'N/A',
            precio: '$0',
            ganancia: '$0',
            fecha: 'N/A'
          }];
        }
      } catch (error) {
        console.error('Error obteniendo detalles de zapatos vendidos:', error);
        this.soldShoes = [{
          marca: 'Error al cargar',
          talla: 'N/A',
          precio: '$0',
          ganancia: '$0',
          fecha: 'N/A'
        }];
      }
    },
    async viewSavedReports() {
      this.showReportsModal = true;
      await this.loadAvailableYears();
      await this.loadSavedReports();
    },
    async loadAvailableYears() {
      try {
        const response = await fetch('http://localhost:3000/api/reportes/years-disponibles');
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        const years = await response.json();
        if (Array.isArray(years) && years.length > 0) {
          this.availableYears = years.map(year => ({ label: year.toString(), value: year }));
        } else {
          this.availableYears = [{ label: new Date().getFullYear().toString(), value: new Date().getFullYear() }];
        }
      } catch (error) {
        console.error('Error cargando años disponibles:', error);
        this.availableYears = [{ label: new Date().getFullYear().toString(), value: new Date().getFullYear() }];
        this.$q.notify({
          type: 'warning',
          message: 'No se pudieron cargar los años disponibles. Usando año actual.'
        });
      }
    },
    async loadSavedReports() {
      if (!this.selectedYear || !this.selectedMonth) return;

      try {
        const response = await fetch(`http://localhost:3000/api/reportes/guardados?año=${this.selectedYear}&mes=${this.selectedMonth}`);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        const reports = await response.json();
        this.savedReports = Array.isArray(reports) ? reports : [];
      } catch (error) {
        console.error('Error cargando reportes guardados:', error);
        this.savedReports = [];
        this.$q.notify({
          type: 'warning',
          message: 'No se pudieron cargar los reportes guardados'
        });
      }
    },
    async loadReportData(report) {
      this.loading = true;
      this.isViewingSavedReport = true;
      this.showReportsModal = false;

      try {
        // Parsear los datos guardados del reporte
        const reportData = JSON.parse(report.datos);

        // Actualizar la UI con los datos guardados
        this.inversion = reportData.inversion || 0;
        this.ganancias = reportData.ganancias || 0;
        this.topBrands = reportData.topBrands || ['Sin datos'];
        this.topBrandsData = reportData.topBrandsData || [0];
        this.footwearAdded = reportData.inventario?.calzado || 0;
        this.clientsAdded = reportData.inventario?.clientes || 0;
        this.reservationsAdded = reportData.inventario?.reservas || 0;
        this.soldShoes = reportData.zapatos_vendidos || [];

        // Actualizar gráfica
        this.updateChart();

        // Actualizar mensaje
        this.reportMessage = `Reporte mensual cargado: ${this.formatDate(report.fecha)}`;

        this.$q.notify({
          type: 'positive',
          message: 'Reporte cargado exitosamente'
        });

      } catch (error) {
        console.error('Error cargando datos del reporte:', error);
        this.$q.notify({
          type: 'negative',
          message: 'Error al cargar el reporte'
        });
      } finally {
        this.loading = false;
      }
    },
    clearAndGenerateNew() {
      this.isViewingSavedReport = false;
      this.reportMessage = '';

      // Resetear datos
      this.inversion = 0;
      this.ganancias = 0;
      this.topBrands = [];
      this.topBrandsData = [];
      this.footwearAdded = 0;
      this.clientsAdded = 0;
      this.reservationsAdded = 0;
      this.soldShoes = [];

      // Generar nuevo reporte
      this.generateReport();

      this.$q.notify({
        type: 'info',
        message: 'Generando nuevo reporte en tiempo real'
      });
    },
    formatDate(dateString) {
      const date = new Date(dateString);
      return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    },
    renderTopBrandsChart() {
      // Inicializar con datos vacíos, se actualizará con updateChart()
      this.updateChart();
    }
  },
  mounted() {
    // Renderizar la gráfica inicial
    this.renderTopBrandsChart();
    // Generar reporte inicial
    this.generateReport();
  },
  beforeUnmount() {
    // Limpiar gráfica al destruir componente
    if (this.chart) {
      this.chart.destroy();
    }
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
