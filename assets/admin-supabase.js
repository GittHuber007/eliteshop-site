/* ELITEshop : connexion a la base Supabase existante de la boutique (projet hbeblgibghwbllngmrjp).
   La cle ci-dessous est la cle PUBLIQUE "anon", deja servie a tous les visiteurs par eliteshoop.com.
   Elle ne donne que les droits accordes par les regles RLS de la base. Ne jamais mettre ici la cle service_role. */
(function () {
  var URL_SUPABASE = 'https://hbeblgibghwbllngmrjp.supabase.co';
  var CLE_PUBLIQUE = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhiZWJsZ2liZ2h3YmxsbmdtcmpwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI0NjU3MTIsImV4cCI6MjA4ODA0MTcxMn0.sa4lGGMvWgoJpLwIPQp4HOFWUJQEhab5iieES16_PkM';
  if (!window.supabase || !window.supabase.createClient) {
    window.ELITE_DB = null;
    return;
  }
  window.ELITE_DB = window.supabase.createClient(URL_SUPABASE, CLE_PUBLIQUE, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false }
  });
})();
