import { Link, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';

const Sidebar = ({ onLogout, profile }: { onLogout: () => void, profile?: any }) => {
  const location = useLocation();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const syncUser = () => {
      const rawUser = localStorage.getItem('teamings_user');
      if (rawUser && rawUser !== 'undefined') {
        try {
          setUser(JSON.parse(rawUser));
        } catch (e) {
          console.error("Sidebar session sync failed");
        }
      }
    };

    syncUser();
    window.addEventListener('storage', syncUser);
    return () => window.removeEventListener('storage', syncUser);
  }, []);

  const navItems = [
    { name: 'Workspace', path: '/', icon: 'dashboard' },
  ];

  const userName = profile?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Operator';
  const userRole = profile?.role || user?.user_metadata?.role || 'User';

  return (
    <nav className="fixed left-0 top-0 h-full w-64 bg-surface border-r border-outline flex flex-col py-8 px-5 z-50 transition-colors duration-300">
      {/* Brand Header */}
      <div className="flex items-center gap-3 mb-12 px-2">
        <div className="w-9 h-9 rounded bg-on-surface flex items-center justify-center">
          <span className="material-symbols-outlined text-surface font-bold text-[20px]">terminal</span>
        </div>
        <h1 className="font-display text-xl font-medium tracking-tight text-on-surface">
          TEAMings
        </h1>
      </div>

      {/* Navigation Group */}
      <div className="flex-1 flex flex-col gap-1">
        <p className="px-3 text-[10px] font-bold text-on-surface-variant uppercase tracking-[0.2em] mb-4">Core</p>
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link key={item.path} to={item.path}>
              <div className={`flex items-center gap-3 px-3 py-2.5 rounded-md transition-all duration-200 ${
                isActive 
                  ? 'bg-surface-container text-on-surface' 
                  : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container/50'
              }`}>
                <span className={`material-symbols-outlined text-[20px] ${isActive ? 'text-on-surface' : 'text-on-surface-variant'}`}>
                  {item.icon}
                </span>
                <span className="text-sm font-medium">
                  {item.name}
                </span>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Profile & Footer */}
      <div className="mt-auto flex flex-col gap-6">
        <Link to="/profile">
          <div className="flex items-center gap-3 px-2 py-2 group">
            <div className="w-9 h-9 rounded-full border border-outline overflow-hidden bg-surface-container group-hover:border-on-surface transition-colors flex items-center justify-center">
              {profile?.avatar_url || user?.avatar_url ? (
                <img src={profile?.avatar_url || user.avatar_url} className="w-full h-full object-cover" alt="Profile" />
              ) : (
                <span className="material-symbols-outlined text-on-surface-variant group-hover:text-on-surface text-lg">person</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-on-surface truncate uppercase tracking-widest">{userName}</p>
              <p className="text-[10px] text-on-surface-variant truncate uppercase font-bold tracking-widest">{userRole}</p>
            </div>
          </div>
        </Link>
        
        <button 
          onClick={onLogout}
          className="flex items-center gap-3 px-3 py-2 text-on-surface-variant hover:text-red-500 transition-colors"
        >
          <span className="material-symbols-outlined text-[20px]">logout</span>
          <span className="text-sm font-medium">Logout</span>
        </button>
      </div>
    </nav>
  );
};

export default Sidebar;
