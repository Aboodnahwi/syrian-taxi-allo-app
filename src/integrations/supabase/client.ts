// This file is automatically generated. Do not edit it directly.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://qfjwtbepnqegpjcqwmmx.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmand0YmVwbnFlZ3BqY3F3bW14Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk4MDY1ODYsImV4cCI6MjA2NTM4MjU4Nn0.MvwT9e6hdqoD8Bse1dEOSvNU-NKhJ9aoOFgvbgqDcCo";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);