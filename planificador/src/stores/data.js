import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { db, appId } from '@/lib/firebase'
import { collection, onSnapshot } from 'firebase/firestore'
import { useAuthStore } from './auth'

export const useDataStore = defineStore('data', () => {
  const authStore = useAuthStore()

  const holidays = ref([])
  const holidayPlans = ref([])
  const orders = ref([])
  const mockClients = ref([
    { id: 'cli1', name: 'Mercadona Sur' },
    { id: 'cli2', name: 'Día Central' },
    { id: 'cli3', name: 'Carrefour Norte' },
    { id: 'cli4', name: 'Alcampo Levante' },
    { id: 'cli5', name: 'Lidl Regional' },
  ])

  // Mock data for development - replace with actual Firebase listeners
  const loadMockData = () => {
    // Mock holidays
    holidays.value = [
      { id: 'h1', date: '2024-12-25', name: 'Navidad' },
      { id: 'h2', date: '2024-12-31', name: 'Fin de Año' }
    ]

    // Mock holiday plans
    holidayPlans.value = [
      { id: 'p1', name: 'Puente Navidad', startDate: '2024-12-24', endDate: '2024-12-26' }
    ]

    // Mock orders
    orders.value = [
      {
        id: 'o1',
        clientId: 'cli1',
        date: '2024-12-04',
        delivers: true,
        receptionDate: '2024-12-04',
        receptionTime: '08:00',
        transportCompany: 'Transportes Rápidos',
        manufacturingDate: '2024-12-05',
        manufacturingNotes: 'Urgente',
        loadingDate: '2024-12-06',
        transportComments: 'Entrega prioritaria'
      }
    ]
  }

  // Load mock data immediately
  loadMockData()

  return {
    holidays,
    holidayPlans,
    orders,
    mockClients
  }
})