import { createClient } from '@supabase/supabase-js'
// ====== ÚNICO LUGAR QUE DEBES EDITAR PARA CONECTAR TU SUPABASE ======
export const SUPABASE_URL = 'PEGA_AQUI_TU_PROJECT_URL'
export const SUPABASE_KEY = 'PEGA_AQUI_TU_PUBLISHABLE_O_ANON_KEY'
export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)
