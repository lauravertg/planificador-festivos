<template>
  <div class="relative">
    <button
      @click="isOpen = !isOpen"
      class="flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors text-sm"
    >
      <Filter size="16" />
      <span>Plataformas ({{ selectedCount }}/{{ totalCount }})</span>
      <ChevronDown size="16" :class="{ 'rotate-180': isOpen }" class="transition-transform" />
    </button>

    <!-- Dropdown -->
    <div
      v-if="isOpen"
      class="absolute top-full mt-2 right-0 bg-white border border-gray-300 rounded-lg shadow-xl w-80 z-50"
    >
      <!-- Header -->
      <div class="p-3 border-b flex justify-between items-center bg-gray-50">
        <span class="font-bold text-gray-700">Filtrar Plataformas</span>
        <button @click="isOpen = false" class="text-gray-500 hover:text-gray-700">
          <X size="18" />
        </button>
      </div>

      <!-- Acciones rápidas -->
      <div class="p-3 border-b flex gap-2 bg-gray-50">
        <button
          @click="selectAll"
          class="flex-1 px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
        >
          Seleccionar Todas
        </button>
        <button
          @click="deselectAll"
          class="flex-1 px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
        >
          Deseleccionar Todas
        </button>
      </div>

      <!-- Ordenamiento -->
      <div class="p-3 border-b bg-gray-50">
        <label class="text-xs text-gray-600 block mb-1">Ordenar por:</label>
        <select
          v-model="sortBy"
          @change="$emit('update:sortBy', sortBy)"
          class="w-full border border-gray-300 rounded px-2 py-1 text-sm"
        >
          <option value="nombre">Nombre (A-Z)</option>
          <option value="nombre-desc">Nombre (Z-A)</option>
          <option value="cliente">Cliente (A-Z)</option>
          <option value="cliente-desc">Cliente (Z-A)</option>
        </select>
      </div>

      <!-- Lista de plataformas -->
      <div class="max-h-96 overflow-y-auto">
        <div
          v-for="plataforma in sortedPlataformas"
          :key="plataforma.id"
          class="p-3 border-b hover:bg-gray-50 cursor-pointer transition-colors"
          @click="togglePlatform(plataforma.id)"
        >
          <div class="flex items-center gap-3">
            <input
              type="checkbox"
              :checked="selectedPlatforms.includes(plataforma.id)"
              @click.stop="togglePlatform(plataforma.id)"
              class="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
            />
            <div class="flex-1">
              <div class="font-medium text-gray-800">{{ plataforma.nombre }}</div>
              <div v-if="plataforma.cliente_nombre" class="text-xs text-gray-500">
                {{ plataforma.cliente_nombre }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { Filter, ChevronDown, X } from 'lucide-vue-next'

const props = defineProps({
  plataformas: {
    type: Array,
    required: true
  },
  modelValue: {
    type: Array,
    required: true
  },
  sortBy: {
    type: String,
    default: 'nombre'
  }
})

const emit = defineEmits(['update:modelValue', 'update:sortBy'])

const isOpen = ref(false)
const sortBy = ref(props.sortBy)
const selectedPlatforms = ref([...props.modelValue])

const totalCount = computed(() => props.plataformas.length)
const selectedCount = computed(() => selectedPlatforms.value.length)

const sortedPlataformas = computed(() => {
  const sorted = [...props.plataformas]

  switch (sortBy.value) {
    case 'nombre':
      return sorted.sort((a, b) => a.nombre.localeCompare(b.nombre))
    case 'nombre-desc':
      return sorted.sort((a, b) => b.nombre.localeCompare(a.nombre))
    case 'cliente':
      return sorted.sort((a, b) => {
        const aCliente = a.cliente_nombre || a.nombre
        const bCliente = b.cliente_nombre || b.nombre
        return aCliente.localeCompare(bCliente)
      })
    case 'cliente-desc':
      return sorted.sort((a, b) => {
        const aCliente = a.cliente_nombre || a.nombre
        const bCliente = b.cliente_nombre || b.nombre
        return bCliente.localeCompare(aCliente)
      })
    default:
      return sorted
  }
})

const togglePlatform = (id) => {
  const index = selectedPlatforms.value.indexOf(id)
  if (index > -1) {
    selectedPlatforms.value.splice(index, 1)
  } else {
    selectedPlatforms.value.push(id)
  }
  emit('update:modelValue', selectedPlatforms.value)
}

const selectAll = () => {
  selectedPlatforms.value = props.plataformas.map(p => p.id)
  emit('update:modelValue', selectedPlatforms.value)
}

const deselectAll = () => {
  selectedPlatforms.value = []
  emit('update:modelValue', selectedPlatforms.value)
}

// Actualizar selectedPlatforms cuando cambia modelValue desde afuera
import { watch } from 'vue'
watch(() => props.modelValue, (newVal) => {
  selectedPlatforms.value = [...newVal]
}, { deep: true })
</script>
