import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import CommandCenter from './pages/CommandCenter';
import TeamRoles from './pages/TeamRoles';
import EvidenceVault from './pages/EvidenceVault';
import ProjectSettings from './pages/ProjectSettings';
import ProfileSettings from './pages/ProfileSettings';
import NotificationCenter from './components/NotificationCenter';

function AppContent({ isLoggedIn, handleLogin, handleLogout }: any) {
  const location = useLocation();
  const isTeamView = location.pathname.startsWith('/team/');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [theme, setTheme] = useState(() => localStorage.getItem('teamings_theme') || 'dark');

  useEffect(() => {
    const syncUser = () => {
      const rawUser = localStorage.getItem('teamings_user');
      if (rawUser && rawUser !== 'undefined') {
        try {
          setCurrentUser(JSON.parse(rawUser));
        } catch (e) {
          console.error("Session sync failed:", e);
        }
      }
      
      const savedTheme = localStorage.getItem('teamings_theme');
      if (savedTheme) setTheme(savedTheme);
    };

    if (isLoggedIn) {
      syncUser();
      window.addEventListener('storage', syncUser);
      return () => window.removeEventListener('storage', syncUser);
    }
  }, [isLoggedIn]);

  useEffect(() => {
    document.documentElement.className = theme === 'light' ? 'light-mode' : '';
  }, [theme]);

  useEffect(() => {
    if (currentUser?.id) {
      const fetchProfile = async () => {
        try {
          const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
          const response = await fetch(`${API_BASE_URL}/api/profiles/${currentUser.id}`);
          if (response.ok) {
            const data = await response.json();
            setProfile(data);
          }
        } catch (error) {
          console.error("Global profile fetch failed:", error);
        }
      };
      fetchProfile();
      
      // Re-fetch on profile update event
      const handleProfileUpdate = () => fetchProfile();
      window.addEventListener('storage', handleProfileUpdate);
      return () => window.removeEventListener('storage', handleProfileUpdate);
    }
  }, [currentUser?.id]);

  if (!isLoggedIn) {
    return (
      <Routes>
        <Route path="/login" element={<Login onLogin={handleLogin} />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  const userInitial = profile?.full_name 
    ? profile.full_name.charAt(0).toUpperCase() 
    : currentUser?.user_metadata?.full_name?.charAt(0).toUpperCase() || currentUser?.email?.charAt(0).toUpperCase() || 'U';
  
  const userName = profile?.full_name || currentUser?.user_metadata?.full_name || currentUser?.email?.split('@')[0] || 'User';

  return (
    <div className="flex min-h-screen bg-surface selection:bg-on-surface/10 selection:text-on-surface transition-colors duration-300">
      {!isTeamView && <Sidebar onLogout={handleLogout} profile={profile} />}
      <div className={`flex-1 flex flex-col min-h-screen relative ${!isTeamView ? 'ml-64' : ''}`}>
        
        {!isTeamView && (
          <header className="fixed top-0 right-0 z-40 h-16 left-64 border-b border-outline px-8 flex items-center justify-between bg-surface-container/50 backdrop-blur-md transition-all duration-300">
            <div className="flex items-center gap-8">
              <div className="flex items-center gap-2 text-[12px] font-medium text-on-surface-variant transition-colors">
                <span className="material-symbols-outlined text-[16px]">folder</span>
                <span>TEAMings</span>
                <span className="text-[10px] opacity-40">/</span>
                <span className="font-bold text-on-surface transition-colors">Workspace Control</span>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2 pr-6 border-r border-outline transition-colors">
                <button className="w-8 h-8 flex items-center justify-center rounded-md transition-colors text-on-surface-variant hover:bg-surface-container hover:text-on-surface" title="Terminal">
                  <span className="material-symbols-outlined text-[18px]">terminal</span>
                </button>
                <NotificationCenter />
              </div>

              <Link to="/profile" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                <div className="w-9 h-9 rounded-full border border-outline overflow-hidden flex items-center justify-center transition-all bg-surface-container">
                  {profile?.avatar_url || currentUser?.avatar_url ? (
                    <img src={profile?.avatar_url || currentUser.avatar_url} className="w-full h-full object-cover" alt="Profile" />
                  ) : (
                    <span className="text-[10px] font-black uppercase text-on-surface-variant">{userInitial}</span>
                  )}
                </div>
                <span className="text-xs font-bold uppercase tracking-wider text-on-surface transition-colors">{userName}</span>
              </Link>
            </div>
          </header>
        )}

        <main className={`flex-1 flex flex-col ${!isTeamView ? 'mt-16 p-8' : ''}`}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/team/:teamId" element={<CommandCenter />} />
            <Route path="/team/:teamId/management" element={<TeamRoles />} />
            <Route path="/team/:teamId/reports" element={<EvidenceVault />} />
            <Route path="/settings" element={<ProjectSettings />} />
            <Route path="/profile" element={<ProfileSettings />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return localStorage.getItem('isLoggedIn') === 'true';
  });

  const handleLogin = (user: any) => {
    setIsLoggedIn(true);
    localStorage.setItem('isLoggedIn', 'true');
    localStorage.setItem('teamings_user', JSON.stringify(user));
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('teamings_user');
  };

  return (
    <Router>
      <AppContent isLoggedIn={isLoggedIn} handleLogin={handleLogin} handleLogout={handleLogout} />
    </Router>
  );
}

export default App;
