import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
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

      if (err) {
        console.error('Error cargando plataformas:', err)
        plataformas.value = []
        return
      }
      plataformas.value = data || []
    } catch (e) {
      error.value = e.message
      console.error('Error cargando plataformas:', e)
      plataformas.value = []
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

      if (err) {
        console.error('Error cargando festivos:', err)
        festivos.value = []
        return
      }
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

      if (err) {
        console.error('Error cargando planes festivos:', err)
        planesFestivos.value = []
        return
      }
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
      // Primero intentamos cargar con JOIN
      const { data, error: err } = await supabase
        .from('entregas')
        .select(`
          *,
          plataforma:plataformas!plataforma_id(
            id,
            nombre,
            cliente_nombre,
            empresa_transporte
          )
        `)
        .order('fecha', { ascending: true })

      if (err) {
        console.error('Error cargando entregas con JOIN:', err)
        // Si falla el JOIN, intentar sin él
        const { data: simpleData, error: simpleErr } = await supabase
          .from('entregas')
          .select('*')
          .order('fecha', { ascending: true })

        if (simpleErr) {
          console.error('Error cargando entregas:', simpleErr)
          entregas.value = []
          return
        }

        // Enriquecer manualmente con datos de plataforma
        const enrichedData = simpleData.map(entrega => {
          const plat = plataformas.value.find(p => p.id === entrega.plataforma_id)
          return {
            ...entrega,
            plataforma: plat ? {
              id: plat.id,
              nombre: plat.nombre,
              cliente_nombre: plat.cliente_nombre,
              empresa_transporte: plat.empresa_transporte
            } : null
          }
        })

        entregas.value = enrichedData
        return
      }

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

  // COMPUTED: Obtener empresas de transporte únicas
  const empresasTransporte = computed(() => {
    const empresas = plataformas.value
      .map(p => p.empresa_transporte)
      .filter(e => e && e.trim() !== '')

    // Eliminar duplicados y ordenar
    return [...new Set(empresas)].sort()
  })

  return {
    // State
    plataformas,
    festivos,
    planesFestivos,
    entregas,
    loading,
    error,

    // Computed
    empresasTransporte,

    // Actions
    initialize,
    loadPlataformas,
    loadFestivos,
    loadPlanesFestivos,
    loadEntregas,
    cleanupSubscriptions
  }
})
