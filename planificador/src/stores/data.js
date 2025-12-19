import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '@/lib/supabase'

export const useDataStore = defineStore('data', () => {
  // Estados reactivos
  const plataformas = ref([])
  const festivos = ref([])
  const planesFestivos = ref([])
  const entregas = ref([])
  const loading = ref(false)
  const error = ref(null)

  // FUNCIÓN: Cargar plataformas activas
  const loadPlataformas = async () => {
    loading.value = true
    try {
      const { data, error: err } = await supabase
        .from('plataformas')
        .select('*')
        .eq('activo', true)
        .order('nombre', { ascending: true })

      if (err) throw err
      plataformas.value = data || []
    } catch (e) {
      error.value = e.message
      console.error('Error cargando plataformas:', e)
    } finally {
      loading.value = false
    }
  }

  // FUNCIÓN: Cargar festivos
  const loadFestivos = async () => {
    try {
      const { data, error: err } = await supabase
        .from('festivos')
        .select('*')
        .order('fecha', { ascending: true })

      if (err) throw err
      festivos.value = data || []
    } catch (e) {
      console.error('Error cargando festivos:', e)
      // No fallar si la tabla no existe aún
      festivos.value = []
    }
  }

  // FUNCIÓN: Cargar planes de festivos
  const loadPlanesFestivos = async () => {
    try {
      const { data, error: err } = await supabase
        .from('planes_festivos')
        .select('*')
        .order('fecha_inicio', { ascending: true })

      if (err) throw err
      planesFestivos.value = data || []
    } catch (e) {
      console.error('Error cargando planes festivos:', e)
      // No fallar si la tabla no existe aún
      planesFestivos.value = []
    }
  }

  // FUNCIÓN: Cargar entregas con información de plataforma
  const loadEntregas = async () => {
    try {
      const { data, error: err } = await supabase
        .from('entregas')
        .select(`
          *,
          plataforma:plataformas(
            id,
            nombre,
            cliente_nombre,
            empresa_transporte
          )
        `)
        .order('fecha', { ascending: true })

      if (err) throw err
      entregas.value = data || []
    } catch (e) {
      console.error('Error cargando entregas:', e)
      // No fallar si la tabla no existe aún
      entregas.value = []
    }
  }

  // Real-time subscriptions
  let subscriptions = []

  const setupRealtimeSubscriptions = () => {
    // Limpiar suscripciones existentes
    cleanupSubscriptions()

    // Plataformas
    const plataformasChannel = supabase
      .channel('plataformas-changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'plataformas' },
        () => {
          console.log('Cambio detectado en plataformas, recargando...')
          loadPlataformas()
        }
      )
      .subscribe()

    // Festivos
    const festivosChannel = supabase
      .channel('festivos-changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'festivos' },
        () => {
          console.log('Cambio detectado en festivos, recargando...')
          loadFestivos()
        }
      )
      .subscribe()

    // Planes festivos
    const planesChannel = supabase
      .channel('planes-changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'planes_festivos' },
        () => {
          console.log('Cambio detectado en planes festivos, recargando...')
          loadPlanesFestivos()
        }
      )
      .subscribe()

    // Entregas
    const entregasChannel = supabase
      .channel('entregas-changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'entregas' },
        () => {
          console.log('Cambio detectado en entregas, recargando...')
          loadEntregas()
        }
      )
      .subscribe()

    subscriptions = [plataformasChannel, festivosChannel, planesChannel, entregasChannel]
  }

  const cleanupSubscriptions = () => {
    subscriptions.forEach(sub => {
      try {
        supabase.removeChannel(sub)
      } catch (e) {
        console.error('Error limpiando suscripción:', e)
      }
    })
    subscriptions = []
  }

  // Inicialización
  const initialize = async () => {
    console.log('Inicializando data store con Supabase...')
    try {
      await Promise.all([
        loadPlataformas(),
        loadFestivos(),
        loadPlanesFestivos(),
        loadEntregas()
      ])
      setupRealtimeSubscriptions()
      console.log('Data store inicializado correctamente')
    } catch (e) {
      console.error('Error inicializando data store:', e)
      error.value = e.message
    }
  }

  return {
    // State
    plataformas,
    festivos,
    planesFestivos,
    entregas,
    loading,
    error,

    // Actions
    initialize,
    loadPlataformas,
    loadFestivos,
    loadPlanesFestivos,
    loadEntregas,
    cleanupSubscriptions
  }
})
