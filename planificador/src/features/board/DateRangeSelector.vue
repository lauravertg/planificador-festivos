<template>
  <div class="flex flex-col sm:flex-row items-start sm:items-center gap-2 bg-gray-50 p-1.5 rounded-lg border border-gray-200">
    <!-- Selector de Plan Guardado -->
    <select
      v-model="selectedPlanId"
      @change="onPlanChange"
      class="bg-white border border-gray-300 text-gray-700 py-1 px-2 rounded text-sm focus:outline-none focus:border-blue-500 font-medium h-10 w-48 sm:w-auto"
    >
      <option value="">-- Rango Personalizado --</option>
      <option v-for="plan in holidayPlans" :key="plan.id" :value="plan.id">
        {{ plan.name }} ({{ formatDate(plan.startDate) }} - {{ formatDate(plan.endDate) }})
      </option>
    </select>

    <!-- Fechas Personalizadas -->
    <div class="flex items-center gap-2 text-sm">
      <input
        type="date"
        v-model="startDate"
        @input="onDateChange"
        class="bg-white border border-gray-300 text-gray-700 py-1 px-2 rounded text-sm focus:outline-none focus:border-blue-500 font-medium w-32"
      />
      <ArrowRight size="16" class="text-gray-400 shrink-0" />
      <input
        type="date"
        v-model="endDate"
        @input="onDateChange"
        class="bg-white border border-gray-300 text-gray-700 py-1 px-2 rounded text-sm focus:outline-none focus:border-blue-500 font-medium w-32"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { ArrowRight } from 'lucide-vue-next'
import { formatDate } from '@/utils/date'
import { useDataStore } from '@/stores/data'

const props = defineProps({
  modelValue: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['update:modelValue'])

const dataStore = useDataStore()
const holidayPlans = dataStore.holidayPlans

const selectedPlanId = ref('')
const startDate = ref(props.modelValue.start)
const endDate = ref(props.modelValue.end)

watch(() => props.modelValue, (newVal) => {
  startDate.value = newVal.start
  endDate.value = newVal.end
  selectedPlanId.value = ''
}, { immediate: true })

const onPlanChange = () => {
  const plan = holidayPlans.value.find(p => p.id === selectedPlanId.value)
  if (plan) {
    emit('update:modelValue', { start: plan.startDate, end: plan.endDate })
  }
}

const onDateChange = () => {
  selectedPlanId.value = ''
  emit('update:modelValue', { start: startDate.value, end: endDate.value })
}
</script>