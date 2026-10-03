import { createClient } from '@supabase/supabase-js'
// ====== ÚNICO LUGAR QUE DEBES EDITAR PARA CONECTAR TU SUPABASE ======
export const SUPABASE_URL = 'https://gxfnqyehanfuspcbprqt.supabase.co'
export const SUPABASE_KEY = 'sb_publishable_GvT1E1tiNL6w3y0drME0iw_g7MoJCp6'
export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)
