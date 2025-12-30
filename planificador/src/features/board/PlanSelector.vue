<template>
  <div class="flex items-center gap-2">
    <label class="text-sm font-medium text-gray-600">Plan:</label>
    <select
      :value="modelValue"
      @change="$emit('update:modelValue', $event.target.value ? parseInt($event.target.value) : null)"
      class="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white min-w-[200px]"
      :class="{ 'border-red-400 bg-red-50': !modelValue }"
    >
      <option :value="null">Selecciona o crea un plan</option>
      <option v-for="plan in planes" :key="plan.id" :value="plan.id">
        {{ plan.nombre }} ({{ formatDate(plan.fecha_inicio) }} - {{ formatDate(plan.fecha_fin) }})
      </option>
    </select>
    <button
      @click="openEditModal"
      :disabled="!modelValue"
      class="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium disabled:bg-gray-300 disabled:cursor-not-allowed"
      title="Editar plan seleccionado"
    >
      ✏️ Editar
    </button>
    <button
      @click="showCreateModal = true"
      class="px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm font-medium"
      title="Crear nuevo plan"
    >
      + Nuevo Plan
    </button>

    <!-- Modal para crear/editar plan -->
    <div
      v-if="showCreateModal || showEditModal"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      @click.self="closeModal"
    >
      <div class="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
        <h3 class="text-lg font-bold text-gray-800 mb-4">
          {{ isEditMode ? 'Editar Plan Festivo' : 'Crear Nuevo Plan Festivo' }}
        </h3>

        <!-- Advertencia si se van a borrar entregas -->
        <div
          v-if="isEditMode && orphanedOrders.length > 0"
          class="mb-4 p-3 bg-red-50 border border-red-300 rounded-md"
        >
          <p class="text-sm text-red-800 font-medium">⚠️ Atención:</p>
          <p class="text-sm text-red-700 mt-1">
            {{ orphanedOrders.length }} entrega(s) quedarán fuera del rango de fechas y serán <strong>eliminadas permanentemente</strong>.
          </p>
        </div>

        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Nombre del Plan</label>
            <input
              v-model="planForm.nombre"
              type="text"
              placeholder="ej: Puente Navidad 2024"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Fecha Inicio</label>
              <input
                v-model="planForm.fecha_inicio"
                type="date"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                @change="calculateOrphanedOrders"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Fecha Fin</label>
              <input
                v-model="planForm.fecha_fin"
                type="date"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                @change="calculateOrphanedOrders"
              />
            </div>
          </div>
        </div>

        <div class="flex gap-2 mt-6">
          <button
            @click="closeModal"
            class="flex-1 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            @click="isEditMode ? updatePlan() : createPlan()"
            :disabled="!canSave"
            class="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {{ isEditMode ? 'Guardar Cambios' : 'Crear Plan' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useDataStore } from '@/stores/data'
import { supabase } from '@/lib/supabase'

const props = defineProps({
  modelValue: Number,
  planes: Array
})

const emit = defineEmits(['update:modelValue'])

const dataStore = useDataStore()
const showCreateModal = ref(false)
const showEditModal = ref(false)
const planForm = ref({
  nombre: '',
  fecha_inicio: '',
  fecha_fin: ''
})
const orphanedOrders = ref([])
const editingPlanId = ref(null)

const isEditMode = computed(() => showEditModal.value)

const formatDate = (dateStr) => {
  if (!dateStr) return ''
  const date = new Date(dateStr + 'T00:00:00')
  return date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

const canSave = computed(() => {
  return planForm.value.nombre.trim() !== '' &&
    planForm.value.fecha_inicio !== '' &&
    planForm.value.fecha_fin !== '' &&
    new Date(planForm.value.fecha_inicio) <= new Date(planForm.value.fecha_fin)
})

const openEditModal = () => {
  if (!props.modelValue) return

  const currentPlan = props.planes.find(p => p.id === props.modelValue)
  if (!currentPlan) return

  // Cargar datos del plan actual en el formulario
  planForm.value = {
    nombre: currentPlan.nombre,
    fecha_inicio: currentPlan.fecha_inicio,
    fecha_fin: currentPlan.fecha_fin
  }

  editingPlanId.value = currentPlan.id
  orphanedOrders.value = []
  showEditModal.value = true
}

const closeModal = () => {
  showCreateModal.value = false
  showEditModal.value = false
  planForm.value = {
    nombre: '',
    fecha_inicio: '',
    fecha_fin: ''
  }
  orphanedOrders.value = []
  editingPlanId.value = null
}

const calculateOrphanedOrders = () => {
  if (!isEditMode.value || !editingPlanId.value) return

  const newStart = new Date(planForm.value.fecha_inicio)
  const newEnd = new Date(planForm.value.fecha_fin)

  // Encontrar entregas del plan actual que quedarían fuera del nuevo rango
  const affectedOrders = dataStore.entregas.filter(order => {
    if (order.plan_id !== editingPlanId.value) return false
    const orderDate = new Date(order.fecha)
    return orderDate < newStart || orderDate > newEnd
  })

  orphanedOrders.value = affectedOrders
}

const createPlan = async () => {
  if (!canSave.value) return

  try {
    const { data, error } = await supabase
      .from('planes_festivos')
      .insert([{
        nombre: planForm.value.nombre.trim(),
        fecha_inicio: planForm.value.fecha_inicio,
        fecha_fin: planForm.value.fecha_fin
      }])
      .select()

    if (error) {
      console.error('Error creando plan:', error)
      alert('Error al crear el plan: ' + error.message)
      return
    }

    // Recargar planes
    await dataStore.loadPlanesFestivos()

    // Seleccionar el plan recién creado
    if (data && data.length > 0) {
      emit('update:modelValue', data[0].id)
    }

    closeModal()
  } catch (e) {
    console.error('Error creando plan:', e)
    alert('Error al crear el plan: ' + e.message)
  }
}

const updatePlan = async () => {
  if (!canSave.value || !editingPlanId.value) return

  // Confirmar si hay entregas que serán eliminadas
  if (orphanedOrders.value.length > 0) {
    const confirmDelete = confirm(
      `⚠️ ATENCIÓN: Esta acción eliminará permanentemente ${orphanedOrders.value.length} entrega(s) que quedan fuera del nuevo rango de fechas.\n\n¿Estás seguro de continuar?`
    )
    if (!confirmDelete) {
      return // Usuario canceló la operación
    }
  }

  try {
    // 1. Eliminar entregas que quedan fuera del rango
    if (orphanedOrders.value.length > 0) {
      const orphanedIds = orphanedOrders.value.map(o => o.id)
      const { error: deleteError } = await supabase
        .from('entregas')
        .delete()
        .in('id', orphanedIds)

      if (deleteError) {
        console.error('Error eliminando entregas:', deleteError)
        alert('Error al eliminar las entregas: ' + deleteError.message)
        return
      }
    }

    // 2. Actualizar el plan
    const { error: planError } = await supabase
      .from('planes_festivos')
      .update({
        nombre: planForm.value.nombre.trim(),
        fecha_inicio: planForm.value.fecha_inicio,
        fecha_fin: planForm.value.fecha_fin
      })
      .eq('id', editingPlanId.value)

    if (planError) {
      console.error('Error actualizando plan:', planError)
      alert('Error al actualizar el plan: ' + planError.message)
      return
    }

    // 3. Recargar datos
    await dataStore.loadPlanesFestivos()
    await dataStore.loadEntregas()

    closeModal()

    // Mostrar mensaje de éxito
    if (orphanedOrders.value.length > 0) {
      alert(`Plan actualizado correctamente. ${orphanedOrders.value.length} entrega(s) fueron eliminadas.`)
    } else {
      alert('Plan actualizado correctamente.')
    }
  } catch (e) {
    console.error('Error actualizando plan:', e)
    alert('Error al actualizar el plan: ' + e.message)
  }
}
</script>
