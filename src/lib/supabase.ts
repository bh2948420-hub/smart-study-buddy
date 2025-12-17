import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ofdkfntqlqxhgjawuax.supabase.co'
const supabaseKey = 'sb_publishable_9EFoLIObZUgPuA7o_VyOeg_2bcAv'

export const supabase = createClient(supabaseUrl, supabaseKey)
