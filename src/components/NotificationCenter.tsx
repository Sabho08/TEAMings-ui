import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';

const NotificationCenter = () => {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isShaking, setIsShaking] = useState(false);


  useEffect(() => {
    const rawUser = localStorage.getItem('teamings_user');
    if (rawUser && rawUser !== 'undefined') {
      try {
        const user = JSON.parse(rawUser);

        
        let activeChannel: any = null;

        // Unified Real-time Uplink
        const initGrid = async () => {
          console.log(`[Intelligence] Node ${user.id} established. Booting neural uplink...`);
          
          try {
            // 1. Fetch user's current team membership
            const { data: teamMembers } = await supabase
              .from('team_members')
              .select('team_id')
              .eq('user_id', user.id);

            const teamIds = teamMembers?.map(m => m.team_id) || [];

            // 2. Build ONE dynamic channel for all intelligence streams
            // Unique name per session prevents "callback after subscribe" collisions
            const channel = supabase.channel(`neural-uplink-${user.id}-${Date.now()}`);

            // A. Direct Transmission Filter
            channel.on(
              'postgres_changes',
              { event: 'INSERT', schema: 'public', table: 'messages', filter: `receiver_id=eq.${user.id}` },
              (payload) => {
                console.log('[Intelligence] Private Transmission Intercepted');
                addNotification({
                  id: payload.new.id,
                  type: 'message',
                  title: 'Private Transmission',
                  content: payload.new.content,
                  time: new Date().toLocaleTimeString(),
                });
              }
            );

            // B. Mission Directive Filter
            channel.on(
              'postgres_changes',
              { event: '*', schema: 'public', table: 'tasks', filter: `assignee_id=eq.${user.id}` },
              (payload) => {
                console.log('[Intelligence] Mission Directive Updated');
                if (payload.eventType === 'INSERT' || (payload.eventType === 'UPDATE' && payload.old.assignee_id !== user.id)) {
                  addNotification({
                    id: payload.new.id + Date.now(),
                    type: 'task',
                    title: 'Mission Assigned',
                    content: payload.new.title,
                    time: new Date().toLocaleTimeString(),
                  });
                }
              }
            );

            // C. Team Broadcast Filters
            teamIds.forEach(teamId => {
              channel.on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'messages', filter: `team_id=eq.${teamId}` },
                (payload) => {
                  if (!payload.new.receiver_id && payload.new.sender_id !== user.id) {
                    console.log('[Intelligence] Team Broadcast Detected');
                    addNotification({
                      id: payload.new.id,
                      type: 'message',
                      title: 'Team Broadcast',
                      content: payload.new.content,
                      time: new Date().toLocaleTimeString(),
                    });
                  }
                }
              );
            });

            // 3. Commit the Uplink
            channel.subscribe((status) => {
              if (status === 'SUBSCRIBED') {
                console.log(`[Intelligence] Neural connection STABLE. Monitoring ${teamIds.length + 2} streams.`);
              }
            });

            activeChannel = channel;
          } catch (err) {
            console.error('[Intelligence] Uplink Error:', err);
          }
        };

        initGrid();

        return () => {
          if (activeChannel) {
            console.log('[Intelligence] Severing neural uplink...');
            supabase.removeChannel(activeChannel);
          }
        };
      } catch (e) {
        console.error("Failed to init intelligence center");
      }
    }
  }, []);

  const addNotification = (notif: any) => {
    setNotifications(prev => [notif, ...prev].slice(0, 5));
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 500);
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  return (
    <div className="relative">
      <div className={`
        ${isShaking ? 'animate-shake' : ''}
        [&>button]:bg-none [&>button]:border-none [&>button]:p-[10px] [&>button]:rounded-[10px] [&>button]:transition-all [&>button]:duration-500
        [&>button:hover]:bg-on-surface/5
        [&>button_svg]:text-on-surface
      `}>
        <button className="relative" onClick={() => setIsOpen(!isOpen)}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={20} height={20}>
            <path fill="none" d="M0 0h24v24H0z" />
            <path fill="currentColor" d="M20 17h2v2H2v-2h2v-7a8 8 0 1 1 16 0v7zm-2 0v-7a6 6 0 1 0-12 0v7h12zm-9 4h6v2H9v-2z" />
          </svg>
          {notifications.length > 0 && (
            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-surface shadow-sm"></span>
          )}
        </button>
      </div>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 pointer-events-auto"
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute right-0 mt-4 w-80 glass-card bg-surface-container border border-outline shadow-2xl z-[60] overflow-hidden"
            >
              <div className="p-4 border-b border-outline flex items-center justify-between bg-surface-container-low/50">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface">Intelligence Feed</span>
                <button onClick={clearNotifications} className="text-[9px] font-bold text-on-surface-variant hover:text-on-surface transition-colors uppercase">Flush Buffer</button>
              </div>

              <div className="max-h-96 overflow-y-auto scrollbar-hide">
                {notifications.length === 0 ? (
                  <div className="p-10 text-center flex flex-col items-center gap-3 opacity-30">
                    <span className="material-symbols-outlined text-2xl">sensors</span>
                    <p className="text-[9px] font-bold uppercase tracking-widest">No Active Transmissions</p>
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <div key={notif.id} className="p-4 border-b border-outline/30 hover:bg-surface-container-low transition-all group">
                      <div className="flex items-start gap-4">
                        <div className={`mt-1 w-2 h-2 rounded-full ${notif.type === 'message' ? 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]' : 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]'}`}></div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] font-black text-on-surface uppercase tracking-tight truncate">{notif.title}</span>
                            <span className="text-[8px] font-mono text-on-surface-variant opacity-60">{notif.time}</span>
                          </div>
                          <p className="text-[11px] text-on-surface-variant line-clamp-2 leading-relaxed font-medium">{notif.content}</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationCenter;
