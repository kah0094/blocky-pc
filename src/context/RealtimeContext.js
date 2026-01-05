import React, { createContext, useState, useEffect, useContext } from 'react';
import { supabase } from '../services/supabase';

const RealtimeContext = createContext();

export function RealtimeProvider({ children }) {
  const [lastUpdate, setLastUpdate] = useState({ type: null, payload: null, time: Date.now() });

  useEffect(() => {
    // Escuta GLOBAL de mudanças no banco
    const channel = supabase.channel('global-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, (p) => setLastUpdate({ type: 'PROFILE', payload: p, time: Date.now() }))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, (p) => setLastUpdate({ type: 'POST', payload: p, time: Date.now() }))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, (p) => setLastUpdate({ type: 'NOTIF', payload: p, time: Date.now() }))
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  return (
    <RealtimeContext.Provider value={lastUpdate}>
      {children}
    </RealtimeContext.Provider>
  );
}

// Hook fácil para usar nas telas
export function useRealtime() {
  return useContext(RealtimeContext);
}
