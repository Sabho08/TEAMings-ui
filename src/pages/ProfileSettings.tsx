import { useState, useEffect } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const ProfileSettings = () => {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [tempName, setTempName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPasswordInput, setShowPasswordInput] = useState(false);

  const AVAILABLE_AVATARS = [
    { id: 'diane', url: 'https://mblxyztzccdmguevjszj.supabase.co/storage/v1/object/sign/avatars/casual_diane.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8wODhmYjg1Yi1hNWQzLTRhZDgtYTVhNS1jY2E0MWEzMjhlMDQiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJhdmF0YXJzL2Nhc3VhbF9kaWFuZS5wbmciLCJpYXQiOjE3NzY4NDk3MzksImV4cCI6MTgwODM4NTczOX0.BQoDNXNs_McH0bNPs_XxZWyLSho2N7G_OWR8ybV_Muc', label: 'Casual Diane' },
    { id: 'rick', url: 'https://mblxyztzccdmguevjszj.supabase.co/storage/v1/object/sign/avatars/casual_rick.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8wODhmYjg1Yi1hNWQzLTRhZDgtYTVhNS1jY2E0MWEzMjhlMDQiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJhdmF0YXJzL2Nhc3VhbF9yaWNrLnBuZyIsImlhdCI6MTc3Njg0OTc2MCwiZXhwIjoxODA4Mzg1NzYwfQ.y1DOSfD0MnPYDM47K36M600s2GjaN7YC5ScXcDRfI6k', label: 'Casual Rick' },
    { id: 'tim', url: 'https://mblxyztzccdmguevjszj.supabase.co/storage/v1/object/sign/avatars/cool_tim.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8wODhmYjg1Yi1hNWQzLTRhZDgtYTVhNS1jY2E0MWEzMjhlMDQiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJhdmF0YXJzL2Nvb2xfdGltLnBuZyIsImlhdCI6MTc3Njg0OTc3MiwiZXhwIjoxODA4Mzg1NzcyfQ.s_JBW_Vg5_j50MyDFV6HUchXurgOdAU54aFXkxtPmM4', label: 'Cool Tim' },
    { id: 'vee', url: 'https://mblxyztzccdmguevjszj.supabase.co/storage/v1/object/public/avatars/cool_vee.png', label: 'Cool Vee' },
    { id: 'jane', url: 'https://mblxyztzccdmguevjszj.supabase.co/storage/v1/object/sign/avatars/corporate_jane.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8wODhmYjg1Yi1hNWQzLTRhZDgtYTVhNS1jY2E0MWEzMjhlMDQiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJhdmF0YXJzL2NvcnBvcmF0ZV9qYW5lLnBuZyIsImlhdCI6MTc3Njg0OTg1MCwiZXhwIjoxODA4Mzg1ODUwfQ.tBA5fzYWWo906IqIvNKRXefggKrsBJ5ayFDp30I2SrY', label: 'Corporate Jane' },
    { id: 'john', url: 'https://mblxyztzccdmguevjszj.supabase.co/storage/v1/object/sign/avatars/corporate_john.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8wODhmYjg1Yi1hNWQzLTRhZDgtYTVhNS1jY2E0MWEzMjhlMDQiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJhdmF0YXJzL2NvcnBvcmF0ZV9qb2huLnBuZyIsImlhdCI6MTc3Njg0OTg2MywiZXhwIjoxODA4Mzg1ODYzfQ.DyvLIbocy6zkXaUCemi2nEaRs_hylZ1-1JiIDqoQv0s', label: 'Corporate John' },
    { id: 'catty', url: 'https://mblxyztzccdmguevjszj.supabase.co/storage/v1/object/sign/avatars/high_school_catty.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8wODhmYjg1Yi1hNWQzLTRhZDgtYTVhNS1jY2E0MWEzMjhlMDQiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJhdmF0YXJzL2hpZ2hfc2Nob29sX2NhdHR5LnBuZyIsImlhdCI6MTc3Njg0OTg2OSwiZXhwIjoxODA4Mzg1ODY5fQ.LP75FpnK__efQoEVO4cvZ1D_PUrV5NKFxnm7oHz0jgQ', label: 'High School Catty' },
    { id: 'jerry', url: 'https://mblxyztzccdmguevjszj.supabase.co/storage/v1/object/sign/avatars/high_school_jerry.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8wODhmYjg1Yi1hNWQzLTRhZDgtYTVhNS1jY2E0MWEzMjhlMDQiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJhdmF0YXJzL2hpZ2hfc2Nob29sX2plcnJ5LnBuZyIsImlhdCI6MTc3Njg0OTg3OSwiZXhwIjoxODA4Mzg1ODc5fQ.W0lvJClyB4M4ym0qjidsPGIk6s4EpftzA-pQCU4egmU', label: 'High School Jerry' },
  ];

  useEffect(() => {
    const rawUser = localStorage.getItem('teamings_user');
    if (rawUser && rawUser !== 'undefined') {
      try {
        const parsed = JSON.parse(rawUser);
        setUser(parsed);
        fetchProfile(parsed.id);
      } catch (e) {
        console.error("Profile sync failed");
      }
    }
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/profiles/${userId}`);
      const data = await response.json();
      setProfile(data);
      setTempName(data.full_name || '');
    } catch (err) {
      console.error("Profile fetch failed");
    }
  };

  const handleUpdateAvatar = async (avatarUrl: string) => {
    if (!user) return;
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/profiles/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ avatar_url: avatarUrl })
      });
      const updated = await response.json();
      setProfile(updated);

      const rawUser = localStorage.getItem('teamings_user');
      if (rawUser) {
        const u = JSON.parse(rawUser);
        u.avatar_url = avatarUrl;
        localStorage.setItem('teamings_user', JSON.stringify(u));
        // Force refresh of any component listening to storage
        window.dispatchEvent(new Event('storage'));
      }
    } catch (err) {
      console.error("Avatar update failed");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/profiles/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ full_name: tempName })
      });
      const updated = await response.json();
      setProfile(updated);

      const rawUser = localStorage.getItem('teamings_user');
      if (rawUser) {
        const u = JSON.parse(rawUser);
        if (!u.user_metadata) u.user_metadata = {};
        u.user_metadata.full_name = tempName;
        localStorage.setItem('teamings_user', JSON.stringify(u));
        window.dispatchEvent(new Event('storage'));
      }
      alert("Profile Team Synchronized.");
    } catch (err) {
      console.error("Profile update failed");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (!newPassword) return;
    alert("In a production environment, this would call supabase.auth.updateUser({ password: newPassword }). For this demo, protocol accepted.");
    setNewPassword('');
    setShowPasswordInput(false);
  };

  const fullName = profile?.full_name || tempName || user?.user_metadata?.full_name || 'Operator';

  const handleDeleteAccount = () => {
    if (window.confirm("CRITICAL ACTION: Execute permanent deletion of all team data? This is irreversible.")) {
      localStorage.clear();
      window.location.href = '/login';
    }
  };

  return (
    <div className="flex flex-col gap-10 max-w-6xl mx-auto py-10 w-full px-4 lg:px-0 transition-colors duration-300">
      <header className="flex justify-between items-end">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-8 bg-on-surface transition-colors duration-300"></div>
            <h2 className="text-4xl font-bold tracking-tight text-on-surface uppercase font-display">Profile</h2>
          </div>
          <p className="text-on-surface-variant text-sm max-w-2xl font-medium font-mono uppercase tracking-[0.2em] text-[10px]">
            Operational Parameters for Team Intelligence
          </p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        <div className="lg:col-span-8 flex flex-col gap-8">
          <section className="glass-card bg-surface-container border border-outline relative overflow-hidden transition-all duration-300">
            <div className="absolute top-0 right-0 px-4 py-2 bg-surface border-l border-b border-outline font-mono text-[9px] text-on-surface-variant tracking-widest uppercase">
              REF: USR-{user?.id?.substring(0, 8).toUpperCase() || 'UNSYNCED'}
            </div>

            <div className="flex flex-col gap-8 mb-10 mt-4">
              <div className="flex items-center gap-8 border-b border-outline pb-8">
                <div className="relative group/avatar">
                  <div className="w-32 h-32 rounded-xl bg-surface border border-outline overflow-hidden p-1 shadow-2xl transition-all duration-300">
                    {profile?.avatar_url ? (
                      <img src={profile.avatar_url} className="w-full h-full object-cover rounded-lg" alt="Profile" />
                    ) : (
                      <div className="w-full h-full bg-surface-container flex items-center justify-center text-4xl font-black text-on-surface-variant uppercase">
                        {fullName.charAt(0)}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex flex-col gap-3">
                  <h3 className="text-on-surface text-xs font-bold uppercase tracking-widest">YOUR PROFILE</h3>
                  <p className="text-[10px] text-on-surface-variant uppercase tracking-widest leading-relaxed">Identity: {user?.email}<br />Verification Status: <span className="text-green-500 font-black">Verified Team Member</span></p>
                </div>
              </div>

              <div className="flex flex-col gap-6">
                <div className="flex items-center justify-between">
                  <h4 className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest">Select Operational Team Avatar</h4>
                </div>
                <div className="grid grid-cols-4 md:grid-cols-8 gap-4">
                  {AVAILABLE_AVATARS.map((avatar) => (
                    <button
                      key={avatar.id}
                      onClick={() => handleUpdateAvatar(avatar.url)}
                      disabled={loading}
                      className={`p-1 rounded-lg border-2 transition-all hover:scale-105 ${profile?.avatar_url === avatar.url ? 'border-on-surface bg-on-surface/5' : 'border-transparent bg-surface-container hover:border-outline opacity-60 hover:opacity-100'}`}
                    >
                      <img src={avatar.url} className="w-full aspect-square object-cover rounded shadow-lg" alt={avatar.label} />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest ml-1">Full Name</label>
                <input
                  className="w-full bg-surface border border-outline rounded px-4 py-3 text-sm text-on-surface focus:outline-none focus:border-on-surface/30 transition-all font-mono"
                  value={tempName}
                  onChange={(e) => setTempName(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest ml-1"> Email (Not Editable)</label>
                <input className="w-full bg-surface border border-outline rounded px-4 py-3 text-xs text-on-surface-variant cursor-not-allowed font-mono" value={user?.email || ''} readOnly />
              </div>
              <button
                onClick={handleSaveProfile}
                disabled={loading}
                className="mt-4 px-8 py-3 bg-on-surface text-surface font-black text-[10px] uppercase tracking-widest hover:opacity-90 transition-all shadow-lg w-fit"
              >
                Apply Changes
              </button>
            </div>
          </section>

          <section className="glass-card bg-surface-container border border-outline transition-all duration-300">
            <div className="flex items-center gap-3 mb-8">
              <span className="material-symbols-outlined text-on-surface">security</span>
              <h3 className="text-on-surface text-xs font-bold uppercase tracking-widest">Security Protocols</h3>
            </div>

            <div className="flex flex-col gap-6">
              <div className="p-6 bg-surface border border-outline rounded flex items-center justify-between">
                <div>
                  <h4 className="text-[10px] font-bold text-on-surface uppercase tracking-widest mb-1">Two-Factor Authentication</h4>
                  <p className="text-[10px] text-on-surface-variant uppercase tracking-widest font-bold">Standard security requirement for account access.</p>
                </div>
                <div className="w-10 h-5 bg-on-surface-variant rounded-full relative p-1 cursor-pointer">
                  <div className="w-3 h-3 bg-surface rounded-full absolute right-1"></div>
                </div>
              </div>
              <div className="p-6 bg-surface border border-outline rounded flex flex-col gap-4">
                <h4 className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Password Settings</h4>
                {showPasswordInput ? (
                  <div className="flex gap-4">
                    <input
                      type="password"
                      placeholder="Enter New Password..."
                      className="flex-1 bg-surface border border-outline rounded px-4 py-2 text-xs text-on-surface focus:outline-none focus:border-on-surface/30"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                    <button onClick={handleUpdatePassword} className="px-6 py-2 bg-on-surface text-surface font-black text-[9px] uppercase">Update</button>
                    <button onClick={() => setShowPasswordInput(false)} className="px-4 py-2 text-[9px] text-on-surface-variant uppercase font-bold">Cancel</button>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowPasswordInput(true)}
                    className="w-fit px-4 py-2 border border-outline text-[9px] text-on-surface font-bold uppercase tracking-widest hover:bg-surface transition-all"
                  >
                    Change Password
                  </button>
                )}
              </div>
            </div>
          </section>
        </div>

        <div className="lg:col-span-4 flex flex-col gap-8">
          <section className="glass-card bg-surface-container border border-outline transition-all duration-300">
            <h3 className="text-on-surface text-xs font-bold uppercase tracking-widest mb-6 border-b border-outline pb-4">Preferences</h3>
            <div className="flex flex-col gap-4">
              <div className="space-y-4">
                <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Interface Theme</label>
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => {
                      localStorage.setItem('teamings_theme', 'dark');
                      window.dispatchEvent(new Event('storage'));
                    }}
                    className={`w-full text-left px-4 py-3 rounded border text-[10px] font-bold uppercase tracking-widest transition-all ${localStorage.getItem('teamings_theme') !== 'light' ? 'bg-on-surface text-surface border-on-surface' : 'bg-surface text-on-surface-variant border-outline hover:border-on-surface'}`}
                  >
                    Terminal Black
                  </button>
                  <button
                    onClick={() => {
                      localStorage.setItem('teamings_theme', 'light');
                      window.dispatchEvent(new Event('storage'));
                    }}
                    className={`w-full text-left px-4 py-3 rounded border text-[10px] font-bold uppercase tracking-widest transition-all ${localStorage.getItem('teamings_theme') === 'light' ? 'bg-on-surface text-surface border-on-surface' : 'bg-surface text-on-surface-variant border-outline hover:border-on-surface'}`}
                  >
                    Clean Light
                  </button>
                </div>
              </div>
            </div>
          </section>

          <section className="glass-card bg-surface-container border border-red-900/40 transition-all duration-300">
            <h3 className="text-red-500 text-xs font-bold uppercase tracking-widest mb-2">Restricted Action</h3>
            <p className="text-[10px] text-on-surface-variant uppercase tracking-widest font-bold mb-6">Irreversible removal of all team data from the project grid.</p>
            <button
              onClick={handleDeleteAccount}
              className="w-full py-3 border border-red-900/20 text-red-500 text-[9px] font-bold uppercase tracking-widest hover:bg-red-500/10 transition-all rounded"
            >
              Execute Account Deletion
            </button>
          </section>
        </div>
      </div>
    </div>
  );
};

export default ProfileSettings;
