import { createClient } from '@supabase/supabase-js'

// Reemplaza estos valores por los de tu propio proyecto Supabase
// (Configuración > API en tu dashboard de Supabase)
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://TU-PROYECTO.supabase.co'
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'TU-ANON-KEY'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
