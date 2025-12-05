<template>
  <q-page class="ventas-page">
    <div class="page-background">
      <div class="row justify-center q-pa-md">
        <div class="col-12 col-md-10 col-lg-8">

          <!-- Botón de regreso -->
          <div class="q-mb-md">
            <q-btn
              @click="$router.push('/')"
              icon="arrow_back"
              label="Regresar al Inicio"
              color="white"
              text-color="primary"
              class="q-mb-md"
              size="md"
            />
          </div>

          <!-- Título -->
          <q-card class="beautiful-card q-mb-md">
            <q-card-section class="text-center q-pb-none">
              <div class="text-h4 text-weight-bold text-primary q-mb-md">
                Ventas y Reservaciones
              </div>
              <div class="text-h6 text-grey-7">Sistema de Gestión de Ventas</div>
            </q-card-section>
          </q-card>

          <!-- Buscar Cliente -->
          <q-card class="beautiful-card q-mb-md">
            <q-card-section>
              <div class="text-h6 text-primary q-mb-md flex items-center">
                <q-icon name="person" size="md" class="q-mr-sm" />
                Buscar Cliente
              </div>
              <div class="row q-gutter-md items-end">
                <q-input
                  v-model="clienteBusqueda"
                  label="Número de teléfono ####-####"
                  outlined
                  class="col"
                  @keyup.enter="buscarCliente"
                />
                <q-btn
                  color="primary"
                  label="Buscar"
                  @click="buscarCliente"
                  :loading="cargandoCliente"
                />
              </div>

              <!-- Cliente encontrado -->
              <div v-if="clienteEncontrado" class="q-mt-md">
                <q-banner class="bg-positive text-white rounded-borders">
                  <div class="text-weight-bold">Cliente encontrado: {{ clienteEncontrado.nombre }}</div>
                </q-banner>
              </div>

              <!-- Agregar Cliente -->
              <div v-if="mostrarFormularioCliente && !clienteEncontrado" class="q-mt-md">
                <q-separator class="q-mb-md" />
                <div class="text-h6 text-primary q-mb-md">Agregar Cliente</div>
                <div class="column q-gutter-md">
                  <q-input
                    v-model="nuevoCliente.nombre"
                    label="Nombre completo"
                    outlined
                  />
                  <q-input
                    v-model="nuevoCliente.telefono"
                    label="Número de teléfono ####-####"
                    outlined
                  />
                  <q-btn
                    color="secondary"
                    label="Guardar Cliente"
                    @click="agregarCliente"
                    :loading="agregandoCliente"
                  />
                </div>
              </div>
            </q-card-section>
          </q-card>

          <!-- Agregar calzado -->
          <q-card class="beautiful-card q-mb-md">
            <q-card-section>
              <div class="text-h6 text-primary q-mb-md flex items-center">
                <q-icon name="inventory" size="md" class="q-mr-sm" />
                Agregar Calzado
              </div>
              <div class="row q-gutter-md items-end">
                <q-input
                  v-model="codigoCalzado"
                  label="Código del calzado"
                  outlined
                  class="col"
                  @keyup.enter="buscarCalzado"
                />
                <q-btn
                  color="primary"
                  label="Agregar"
                  @click="buscarCalzado"
                  :loading="cargandoCalzado"
                />
              </div>
            </q-card-section>
          </q-card>

          <!-- Lista de zapatos -->
          <q-card v-if="zapatosSeleccionados.length > 0" class="beautiful-card q-mb-md">
            <q-card-section>
              <div class="text-h6 text-primary q-mb-md flex items-center">
                <q-icon name="shopping_cart" size="md" class="q-mr-sm" />
                Calzado Seleccionado ({{ zapatosSeleccionados.length }})
              </div>
              <q-table
                :rows="zapatosSeleccionados"
                :columns="columns"
                row-key="id"
                flat
                bordered
                class="beautiful-table"
              >
                <template v-slot:body-cell-precio="props">
                  <q-td :props="props">
                    <q-input
                      v-model.number="props.row.precio_vendido"
                      type="number"
                      step="0.01"
                      dense
                      borderless
                      @input="calcularTotal"
                      prefix="$"
                      style="min-width: 80px"
                    />
                  </q-td>
                </template>
                <template v-slot:body-cell-tipo="props">
                  <q-td :props="props">
                    <q-select
                      v-model="props.row.tipo_operacion"
                      :options="[
                        {label: 'Venta', value: 'venta'},
                        {label: 'Reserva', value: 'reservacion'}
                      ]"
                      dense
                      borderless
                      emit-value
                      map-options
                      style="min-width: 100px"
                    />
                  </q-td>
                </template>
                <template v-slot:body-cell-acciones="props">
                  <q-td :props="props">
                    <q-btn
                      color="negative"
                      icon="delete"
                      size="sm"
                      round
                      @click="eliminarZapato(props.rowIndex)"
                    />
                  </q-td>
                </template>
              </q-table>
            </q-card-section>
          </q-card>

          <!-- Total y Confirmación -->
          <q-card v-if="zapatosSeleccionados.length > 0" class="beautiful-card q-mb-md">
            <q-card-section>
              <div class="row q-gutter-lg items-center">
                <div class="col-12 col-md-6">
                  <div class="text-h6 text-primary q-mb-md">Resumen</div>
                  <div class="text-body1">
                    <strong>Ventas:</strong> {{ conteoVentas }} zapatos
                  </div>
                  <div class="text-body1">
                    <strong>Reservaciones:</strong> {{ conteoReservaciones }} zapatos
                  </div>
                </div>
                <div class="col-12 col-md-6 text-right">
                  <div class="text-h6 text-primary q-mb-md">Total General</div>
                  <div class="text-h4 text-weight-bold text-accent">
                    ${{ total.toFixed(2) }}
                  </div>
                </div>
              </div>
            </q-card-section>
          </q-card>

          <!-- Botón Confirmar -->
          <div v-if="zapatosSeleccionados.length > 0 && todosConTipo" class="text-center">
            <q-btn
              color="primary"
              label="Confirmar Operación"
              size="lg"
              @click="confirmarVenta"
              :loading="procesandoVenta"
              class="q-px-xl q-py-md"
              style="border-radius: 15px; font-weight: bold;"
            />
          </div>

        </div>
      </div>
    </div>
  </q-page>
</template>

<script>
export default {
  name: 'SalesPage',
  data() {
    return {
      // Cliente
      clienteBusqueda: '',
      clienteEncontrado: null,
      mostrarFormularioCliente: false,
      nuevoCliente: {
        nombre: '',
        telefono: ''
      },
      cargandoCliente: false,
      agregandoCliente: false,

      // Calzado
      codigoCalzado: '',
      zapatosSeleccionados: [],
      cargandoCalzado: false,

      // General
      total: 0,
      procesandoVenta: false,

      // Columnas de la tabla
      columns: [
        {
          name: 'descripcion',
          label: 'Descripción',
          align: 'left',
          field: 'descripcion',
          style: 'max-width: 200px'
        },
        {
          name: 'talla',
          label: 'Talla',
          align: 'center',
          field: 'talla'
        },
        {
          name: 'precio',
          label: 'Precio',
          align: 'center',
          field: 'precio_vendido'
        },
        {
          name: 'tipo',
          label: 'Tipo',
          align: 'center',
          field: 'tipo_operacion'
        },
        {
          name: 'acciones',
          label: 'Acciones',
          align: 'center'
        }
      ]
    }
  },

  computed: {
    conteoVentas() {
      return this.zapatosSeleccionados.filter(z => z.tipo_operacion === 'venta').length;
    },

    conteoReservaciones() {
      return this.zapatosSeleccionados.filter(z => z.tipo_operacion === 'reservacion').length;
    },

    todosConTipo() {
      return this.zapatosSeleccionados.length > 0 &&
             this.zapatosSeleccionados.every(z => z.tipo_operacion);
    }
  },

  methods: {
    async buscarCliente() {
      if (!this.clienteBusqueda.trim()) {
        this.$q.notify({
          type: 'warning',
          message: 'Ingrese un término de búsqueda'
        });
        return;
      }

      this.cargandoCliente = true;
      try {
        const response = await fetch(`http://localhost:3000/api/ventas/clientes/buscar?termino=${encodeURIComponent(this.clienteBusqueda)}`);
        const data = await response.json();

        if (data.success && data.cliente) {
          this.clienteEncontrado = data.cliente;
          this.mostrarFormularioCliente = false;
          this.$q.notify({
            type: 'positive',
            message: 'Cliente encontrado'
          });
        } else {
          this.clienteEncontrado = null;
          this.mostrarFormularioCliente = true;
          this.$q.notify({
            type: 'info',
            message: 'Cliente no encontrado. Complete el formulario para agregarlo.'
          });
        }
      } catch (error) {
        console.error('Error:', error);
        this.$q.notify({
          type: 'negative',
          message: 'Error al buscar cliente'
        });
        this.mostrarFormularioCliente = true;
      }
      this.cargandoCliente = false;
    },

    async agregarCliente() {
      if (!this.nuevoCliente.nombre.trim() || !this.nuevoCliente.telefono.trim()) {
        this.$q.notify({
          type: 'warning',
          message: 'Complete todos los campos'
        });
        return;
      }

      this.agregandoCliente = true;
      try {
        console.log('Enviando datos del cliente:', this.nuevoCliente);

        const response = await fetch('http://localhost:3000/api/clientes', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(this.nuevoCliente)
        });

        const data = await response.json();
        console.log('Respuesta del servidor para cliente:', response.status, data);

        if (response.ok && (data.success || data.message === 'Cliente creado exitosamente')) {
          this.clienteEncontrado = {
            id: data.clienteId || data.id,
            nombre: this.nuevoCliente.nombre,
            telefono: this.nuevoCliente.telefono
          };
          this.$q.notify({
            type: 'positive',
            message: 'Cliente agregado exitosamente'
          });
          this.mostrarFormularioCliente = false;
        } else {
          throw new Error(data.message || 'Error al agregar cliente');
        }
      } catch (error) {
        console.error('Error:', error);
        this.$q.notify({
          type: 'negative',
          message: 'Error al agregar cliente'
        });
      }
      this.agregandoCliente = false;
    },

    async buscarCalzado() {
      if (!this.codigoCalzado.trim()) {
        this.$q.notify({
          type: 'warning',
          message: 'Ingrese un código de calzado'
        });
        return;
      }

      this.cargandoCalzado = true;
      try {
        console.log('Buscando zapato con código:', this.codigoCalzado);

        const response = await fetch(`http://localhost:3000/api/ventas/zapatos/buscar/${encodeURIComponent(this.codigoCalzado)}`);
        const data = await response.json();

        console.log('Respuesta búsqueda zapato:', response.status, data);

        if (data.success && data.zapato) {
          // Verificar si ya está agregado
          const yaExiste = this.zapatosSeleccionados.find(z => z.id === data.zapato.id);
          if (yaExiste) {
            this.$q.notify({
              type: 'warning',
              message: 'Este zapato ya está en la lista'
            });
          } else {
            this.zapatosSeleccionados.push({
              ...data.zapato,
              precio_vendido: data.zapato.precio_venta || 0,
              tipo_operacion: 'venta' // Tipo por defecto
            });
            this.$q.notify({
              type: 'positive',
              message: 'Zapato agregado'
            });
            this.calcularTotal();
          }
          this.codigoCalzado = '';
        } else {
          this.$q.notify({
            type: 'warning',
            message: 'Zapato no encontrado o no disponible'
          });
        }
      } catch (error) {
        console.error('Error:', error);
        this.$q.notify({
          type: 'negative',
          message: 'Error al buscar calzado'
        });
      }
      this.cargandoCalzado = false;
    },

    eliminarZapato(index) {
      this.zapatosSeleccionados.splice(index, 1);
      this.calcularTotal();
      this.$q.notify({
        type: 'info',
        message: 'Zapato eliminado'
      });
    },

    calcularTotal() {
      this.total = this.zapatosSeleccionados.reduce((sum, zapato) => {
        return sum + (parseFloat(zapato.precio_vendido) || 0);
      }, 0);
    },

    async confirmarVenta() {
      if (!this.validarVenta()) return;

      this.procesandoVenta = true;
      try {
        // Asegurarse de que tenemos el cliente con ID
        let cliente = this.clienteEncontrado;

        // Si no hay cliente encontrado pero hay datos de nuevo cliente, crear primero
        if (!cliente && this.nuevoCliente.nombre && this.nuevoCliente.telefono) {
          await this.agregarCliente();
          cliente = this.clienteEncontrado;
        }

        if (!cliente || !cliente.id) {
          throw new Error('No se pudo obtener la información del cliente');
        }

        // Validar datos de zapatos antes de enviar
        for (let zapato of this.zapatosSeleccionados) {
          if (!zapato.id) {
            throw new Error('Zapato sin ID encontrado');
          }
          if (!zapato.precio_vendido || isNaN(parseFloat(zapato.precio_vendido))) {
            throw new Error(`Precio inválido para zapato ${zapato.codigo}`);
          }
          if (!zapato.tipo_operacion) {
            throw new Error(`Tipo de operación no seleccionado para zapato ${zapato.codigo}`);
          }
        }

        const zapatos_data = this.zapatosSeleccionados.map(zapato => ({
          zapato_id: zapato.id,
          precio_vendido: parseFloat(zapato.precio_vendido),
          tipo: zapato.tipo_operacion
        }));

        const ventaData = {
          cliente_id: cliente.id,
          zapatos_data: zapatos_data
        };

        console.log('Cliente:', cliente);
        console.log('Zapatos seleccionados:', this.zapatosSeleccionados);
        console.log('Zapatos data:', zapatos_data);
        console.log('Enviando datos de venta:', JSON.stringify(ventaData, null, 2));

        const response = await fetch('http://localhost:3000/api/ventas', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(ventaData)
        });

        const data = await response.json();
        console.log('Respuesta del servidor:', data);

        if (response.ok && data.success) {
          this.$q.notify({
            type: 'positive',
            message: `${this.tipoOperacion === 'venta' ? 'Venta' : 'Reservación'} registrada exitosamente`
          });
          this.limpiarFormulario();
        } else {
          throw new Error(data.message || 'Error del servidor');
        }
      } catch (error) {
        console.error('Error completo:', error);
        console.error('Error message:', error.message);
        this.$q.notify({
          type: 'negative',
          message: error.message || 'Error al procesar la venta'
        });
      }
      this.procesandoVenta = false;
    },

    validarVenta() {
      console.log('Validando venta...');
      console.log('Cliente encontrado:', this.clienteEncontrado);
      console.log('Nuevo cliente:', this.nuevoCliente);
      console.log('Zapatos seleccionados:', this.zapatosSeleccionados);
      console.log('Tipo operación:', this.tipoOperacion);

      // Validar cliente
      if (!this.clienteEncontrado && (!this.nuevoCliente.nombre.trim() || !this.nuevoCliente.telefono.trim())) {
        this.$q.notify({
          type: 'warning',
          message: 'Debe seleccionar o completar los datos del cliente'
        });
        return false;
      }

      // Validar zapatos
      if (this.zapatosSeleccionados.length === 0) {
        this.$q.notify({
          type: 'warning',
          message: 'Debe agregar al menos un zapato'
        });
        return false;
      }

      // Validar que los zapatos tengan IDs y tipos
      for (let zapato of this.zapatosSeleccionados) {
        if (!zapato.id) {
          this.$q.notify({
            type: 'warning',
            message: `El zapato "${zapato.descripcion || 'Sin descripción'}" no tiene ID válido`
          });
          return false;
        }

        if (!zapato.tipo_operacion) {
          this.$q.notify({
            type: 'warning',
            message: `Debe seleccionar el tipo de operación para "${zapato.descripcion || 'Sin descripción'}"`
          });
          return false;
        }
      }

      // Validar precios
      for (let i = 0; i < this.zapatosSeleccionados.length; i++) {
        const zapato = this.zapatosSeleccionados[i];
        if (!zapato.precio_vendido || zapato.precio_vendido <= 0) {
          this.$q.notify({
            type: 'warning',
            message: `El zapato "${zapato.descripcion}" debe tener un precio válido mayor a 0`
          });
          return false;
        }
      }

      return true;
    },

    limpiarFormulario() {
      this.clienteBusqueda = '';
      this.clienteEncontrado = null;
      this.mostrarFormularioCliente = false;
      this.nuevoCliente = { nombre: '', telefono: '' };
      this.codigoCalzado = '';
      this.zapatosSeleccionados = [];
      this.total = 0;
    }
  }
}
</script>

<style scoped>
.ventas-page {
  min-height: 100vh;
}

.page-background {
  background: #f5f5f5;
  min-height: 100vh;
  padding: 0;
}

.beautiful-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.1);
  transition: all 0.3s ease;
}

.beautiful-card:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 20px rgba(0,0,0,0.15) !important;
}

.beautiful-table {
  border-radius: 12px;
  overflow: hidden;
}

.beautiful-table .q-table__top,
.beautiful-table .q-table__bottom,
.beautiful-table thead tr:first-child th {
  background-color: #f8fafc;
}

.beautiful-table tbody tr:hover {
  background-color: rgba(0, 0, 0, 0.05);
}

.text-primary {
  color: #424242 !important;
}

.text-accent {
  color: #1976d2 !important;
}

.q-btn {
  transition: all 0.3s ease;
}

.q-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}

/* Animaciones de entrada */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.beautiful-card {
  animation: fadeInUp 0.6s ease-out;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .q-pa-md {
    padding: 1rem;
  }
}
</style>
