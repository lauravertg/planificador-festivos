<template>
  <div class="p-6 max-w-6xl mx-auto bg-white min-h-screen print:p-0 print:max-w-full">
    <div class="flex justify-between items-center mb-8 print:hidden">
      <h2 class="text-2xl font-bold text-gray-800">Informe de Cargas</h2>
      <div class="flex gap-4">
        <div class="flex gap-2 items-center">
          <label class="text-sm font-medium text-gray-700">Desde:</label>
          <input
            type="date"
            class="border p-2 rounded"
            v-model="loadDateStart"
          />
        </div>
        <div class="flex gap-2 items-center">
          <label class="text-sm font-medium text-gray-700">Hasta:</label>
          <input
            type="date"
            class="border p-2 rounded"
            v-model="loadDateEnd"
          />
        </div>
        <select
          class="border p-2 rounded"
          v-model="selectedTransport"
        >
          <option value="all">Todas las compañías</option>
          <option v-for="company in transportCompanies" :key="company" :value="company">
            {{ company }}
          </option>
        </select>
        <button @click="generatePDF" class="bg-gray-800 text-white px-4 py-2 rounded flex items-center gap-2 hover:bg-black">
          <Printer size="18" /> Generar PDF
        </button>
      </div>
    </div>

    <!-- Encabezado del informe - se repite en cada página -->
    <div class="report-header mb-6 border-b pb-4">
      <h1 class="text-3xl font-bold uppercase tracking-wide text-gray-900">Planificación de Cargas</h1>
      <div class="mt-2 flex gap-8 text-gray-600">
        <p><span class="font-bold">Fechas de Carga:</span> {{ loadDateStart ? formatDate(loadDateStart) : 'Sin límite' }} - {{ loadDateEnd ? formatDate(loadDateEnd) : 'Sin límite' }}</p>
        <p><span class="font-bold">Compañía:</span> {{ selectedTransport === 'all' ? 'TODAS' : selectedTransport }}</p>
        <p><span class="font-bold">Fecha Emisión:</span> {{ new Date().toLocaleDateString() }}</p>
      </div>
    </div>

    <div v-if="reportData.length === 0" class="text-center py-10 text-gray-500">
      No hay datos de carga registrados para este rango.
    </div>
    <div v-else class="space-y-4">
      <div
        v-for="group in reportData"
        :key="group.date"
      >
        <h3 :class="[
          'text-xl font-bold p-2 border-l-4 mb-2 flex items-center gap-2',
          isHolidayLoad(group.date) ? 'bg-red-50 border-red-500 text-red-800' : 'bg-gray-100 border-orange-500 text-gray-800'
        ]">
          <AlertCircle v-if="isHolidayLoad(group.date)" size="20" />
          Fecha de Carga: {{ group.date === 'Sin fecha de carga' ? 'FECHA NO ASIGNADA' : `${getDayOfWeek(group.date)} ${formatDate(group.date)}` }}
          <span v-if="isHolidayLoad(group.date)" class="text-sm font-normal ml-2">(Festivo)</span>
        </h3>
        <table class="w-full text-sm text-left text-gray-600 border border-gray-200 mb-4">
          <thead class="text-xs text-gray-700 uppercase bg-gray-50">
            <tr>
              <th class="px-4 py-3 border-b">Cliente / Plataforma</th>
              <th class="px-4 py-3 border-b">Transporte</th>
              <th class="px-4 py-3 border-b">Fecha de Entrega</th>
              <th class="px-4 py-3 border-b w-1/3">Comentarios Transporte</th>
              <th v-if="selectedTransport === 'all'" class="px-4 py-3 border-b w-1/4">Notas Internas (Fab)</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="item in group.items"
              :key="item.id"
              class="bg-white border-b hover:bg-gray-50 print:hover:bg-white"
            >
              <td class="px-4 py-3 font-medium text-gray-900">{{ item.clientName }}</td>
              <td class="px-4 py-3 font-bold">{{ item.transportCompany }}</td>
              <td class="px-4 py-3">{{ getDayOfWeek(item.deliveryDate) }} {{ formatDate(item.deliveryDate) }}</td>
              <td class="px-4 py-3 italic">{{ item.transportComments || '-' }}</td>
              <td v-if="selectedTransport === 'all'" class="px-4 py-3 text-xs text-gray-500">{{ item.manufacturingNotes || '-' }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { Printer, AlertCircle } from 'lucide-vue-next'
import { formatDate, getDayOfWeek } from '@/utils/date'
import { useDataStore } from '@/stores/data'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

const props = defineProps({
  dateRange: Object,
  orders: Array
})

const dataStore = useDataStore()
const { festivos } = dataStore

const selectedTransport = ref('all')

// Rango de fechas de carga
const loadDateStart = ref('')
const loadDateEnd = ref('')

// Inicializar con el rango completo del plan
watch(() => props.dateRange, (newRange) => {
  if (newRange && !loadDateStart.value && !loadDateEnd.value) {
    loadDateStart.value = newRange.start
    loadDateEnd.value = newRange.end
  }
}, { immediate: true })

// Obtener lista única de empresas de transporte de las órdenes
const transportCompanies = computed(() => {
  if (!props.orders.length) return []

  const companies = props.orders
    .filter(o => o.entrega && o.empresa_transporte)
    .map(o => o.empresa_transporte)

  // Eliminar duplicados y ordenar
  return [...new Set(companies)].sort()
})

const reportData = computed(() => {
  if (!props.orders.length) return []

  // Filtrar: solo entregas con empresa de transporte
  let filtered = props.orders.filter(o => o.entrega && o.empresa_transporte)

  if (selectedTransport.value !== 'all') {
    filtered = filtered.filter(o => o.empresa_transporte === selectedTransport.value)
  }

  // Filtrar por rango de fechas de carga
  if (loadDateStart.value || loadDateEnd.value) {
    filtered = filtered.filter(o => {
      const loadDate = o.fecha_carga
      if (!loadDate) return false // Excluir las que no tienen fecha de carga

      if (loadDateStart.value && loadDate < loadDateStart.value) return false
      if (loadDateEnd.value && loadDate > loadDateEnd.value) return false

      return true
    })
  }

  const grouped = {}
  filtered.forEach(order => {
    const loadDate = order.fecha_carga || 'Sin fecha de carga'
    if (!grouped[loadDate]) grouped[loadDate] = []

    // Mapear campos de Supabase (español) a formato de reporte (inglés para compatibilidad con template)
    grouped[loadDate].push({
      id: order.id,
      clientName: order.plataforma?.nombre || 'Plataforma',
      transportCompany: order.empresa_transporte,
      deliveryDate: order.fecha,
      transportComments: order.comentarios_transporte,
      manufacturingNotes: order.notas_fabricacion
    })
  })

  return Object.keys(grouped).sort().map(date => ({
    date,
    items: grouped[date]
  }))
})

const isHolidayLoad = (date) => {
  if (!festivos.value) return false
  return festivos.value.some(h => h.fecha === date)
}

const generatePDF = () => {
  const doc = new jsPDF('p', 'mm', 'a4')

  let yPosition = 20
  const pageHeight = doc.internal.pageSize.height
  const pageWidth = doc.internal.pageSize.width
  const margin = 10

  // Función para agregar encabezado
  const addHeader = () => {
    doc.setFontSize(16)
    doc.setFont('helvetica', 'bold')
    doc.text('PLANIFICACIÓN DE CARGAS', margin, yPosition)

    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    yPosition += 7
    doc.text(`Fechas de Carga: ${loadDateStart.value ? formatDate(loadDateStart.value) : 'Sin límite'} - ${loadDateEnd.value ? formatDate(loadDateEnd.value) : 'Sin límite'}`, margin, yPosition)
    yPosition += 5
    doc.text(`Compañía: ${selectedTransport.value === 'all' ? 'TODAS' : selectedTransport.value}`, margin, yPosition)
    yPosition += 5

    // Formatear fecha y hora actual
    const now = new Date()
    const day = String(now.getDate()).padStart(2, '0')
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const year = now.getFullYear()
    const hours = String(now.getHours()).padStart(2, '0')
    const minutes = String(now.getMinutes()).padStart(2, '0')
    const fechaEmision = `${day}/${month}/${year} ${hours}:${minutes}`

    doc.text(`Fecha Emisión: ${fechaEmision}`, margin, yPosition)
    yPosition += 10
  }

  // Función para agregar pie de página con numeración
  const addFooter = (pageNum, totalPages) => {
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text(`Pág ${pageNum} / ${totalPages}`, pageWidth - margin - 20, pageHeight - 10)
  }

  // Función para verificar espacio y agregar nueva página si es necesario
  const checkAddPage = (neededSpace) => {
    if (yPosition + neededSpace > pageHeight - 20) {
      doc.addPage()
      yPosition = 20
      addHeader()
    }
  }

  // Agregar encabezado inicial
  addHeader()

  // Procesar cada grupo de fechas
  reportData.value.forEach((group) => {
    // Verificar espacio para el título del grupo
    checkAddPage(15)

    // Título de fecha de carga
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    const isHoliday = isHolidayLoad(group.date)

    if (isHoliday) {
      doc.setTextColor(153, 27, 27) // Rojo
    } else {
      doc.setTextColor(55, 65, 81) // Gris oscuro
    }

    const dateText = group.date === 'Sin fecha de carga'
      ? 'FECHA NO ASIGNADA'
      : `${getDayOfWeek(group.date)} ${formatDate(group.date)}${isHoliday ? ' (Festivo)' : ''}`

    doc.text(`Fecha de Carga: ${dateText}`, margin, yPosition)
    yPosition += 7

    doc.setTextColor(0, 0, 0) // Reset color

    // Preparar datos de la tabla
    const headers = ['Cliente / Plataforma', 'Transporte', 'Fecha de Entrega', 'Comentarios Transporte']
    if (selectedTransport.value === 'all') {
      headers.push('Notas Internas (Fab)')
    }

    const rows = group.items.map(item => {
      const row = [
        item.clientName,
        item.transportCompany,
        `${getDayOfWeek(item.deliveryDate)} ${formatDate(item.deliveryDate)}`,
        item.transportComments || '-'
      ]
      if (selectedTransport.value === 'all') {
        row.push(item.manufacturingNotes || '-')
      }
      return row
    })

    // Agregar tabla
    autoTable(doc, {
      head: [headers],
      body: rows,
      startY: yPosition,
      margin: { left: margin, right: margin },
      styles: {
        fontSize: 8,
        cellPadding: 3
      },
      headStyles: {
        fillColor: [249, 250, 251],
        textColor: [55, 65, 81],
        fontStyle: 'bold',
        halign: 'left'
      },
      columnStyles: {
        0: { cellWidth: 40 },
        1: { cellWidth: 30 },
        2: { cellWidth: 35 },
        3: { cellWidth: selectedTransport.value === 'all' ? 40 : 75 },
        4: selectedTransport.value === 'all' ? { cellWidth: 35, fontSize: 7 } : {}
      }
    })

    yPosition = doc.lastAutoTable.finalY + 8
  })

  // Agregar numeración a todas las páginas
  const totalPages = doc.internal.pages.length - 1 // -1 porque la primera página es vacía
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    addFooter(i, totalPages)
  }

  // Guardar o abrir el PDF
  doc.save(`Planificacion_Cargas_${new Date().toISOString().split('T')[0]}.pdf`)
}
</script>

