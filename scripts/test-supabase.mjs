import { createClient } from '@supabase/supabase-js';

const url = 'https://vvwizaunsdtnkocwjgwi.supabase.co';
const key = 'sb_publishable_9V6B8kV1_OjwCwdyCU8Dng_VMAuV_cW';

const supabase = createClient(url, key);

async function test() {
  console.log('Testing Supabase connection...');
  try {
    const { data, error } = await supabase.from('categories').select('*').limit(5);
    console.log('Categories query result:', JSON.stringify({ data, error }, null, 2));
  } catch (err) {
    console.error('Catch error:', err);
  }
}

test();
