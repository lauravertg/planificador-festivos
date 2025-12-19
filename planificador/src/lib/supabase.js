import { createClient } from '@supabase/supabase-js'

// Las variables de entorno con prefijo VITE_ están disponibles en import.meta.env
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('⚠️ Faltan las credenciales de Supabase. Copia .env.example a .env.local y añade tus credenciales.')
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '')

// Export individual values if needed
export { supabaseUrl, supabaseAnonKey }
