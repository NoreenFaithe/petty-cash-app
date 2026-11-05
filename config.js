/**
 * PettyCash Pro - Remote Team Cloud Configuration
 * 
 * For remote teams: Connect a free Supabase cloud database so all remote
 * consultants and admins automatically sync entries in real-time.
 */
window.APP_CONFIG = {
  // Enter your free Supabase project credentials below to enable live remote team sync:
  supabaseUrl: "", // e.g. "https://your-project-id.supabase.co"
  supabaseKey: "", // your Supabase anon/public API key
  autoSyncIntervalSec: 15 // Live background sync interval in seconds
};
