import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import BinaryLoader from '../components/BinaryLoader';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

interface Team {
  id: string;
  name: string;
  members_count?: number;
  role?: 'Leader' | 'Member';
  progress?: number;
  status?: string;
  invite_code: string;
}

const Dashboard = () => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [showOptions, setShowOptions] = useState(false);
  const [modalType, setModalType] = useState<'create' | 'join' | null>(null);
  const [error, setError] = useState('');

  // Form States
  const [newTeamName, setNewTeamName] = useState('');
  const [taskModel, setTaskModel] = useState(7);
  const [inviteCode, setInviteCode] = useState('');

  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    const rawUser = localStorage.getItem('teamings_user');
    if (rawUser && rawUser !== 'undefined') {
      setCurrentUser(JSON.parse(rawUser));
    }
    fetchTeams();
  }, []);

  const fetchTeams = async () => {
    try {
      const rawUser = localStorage.getItem('teamings_user');
      if (!rawUser || rawUser === 'undefined') return;
      const user = JSON.parse(rawUser);

      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/api/projects?userId=${user.id}`);
      setTeams(response.data);
    } catch (err) {
      console.error('Failed to fetch teams:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTeam = async () => {
    if (!newTeamName) {
      setError('Project Alias is required');
      return;
    }

    if (!currentUser?.id) {
      setError('Authentication sync failed. Please log out and log in again.');
      return;
    }

    try {
      setError('');
      await axios.post(`${API_BASE_URL}/api/projects`, {
        name: newTeamName,
        task_model: taskModel,
        owner_id: currentUser.id
      });
      setModalType(null);
      setNewTeamName('');
      fetchTeams();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Creation failed');
    }
  };

  const handleJoinTeam = async () => {
    if (!inviteCode || !currentUser) return;
    try {
      setError('');
      await axios.post(`${API_BASE_URL}/api/projects/join`, {
        invite_code: inviteCode,
        user_id: currentUser.id
      });
      setModalType(null);
      setInviteCode('');
      fetchTeams();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Join failed');
    }
  };

  return (
    <div className="flex flex-col gap-10 transition-colors duration-300">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-medium tracking-tight text-on-surface mb-2">Workspace</h1>
          <p className="text-on-surface-variant text-sm transition-colors">
            {loading ? '' : `Managing ${teams.length} active team environments`}
          </p>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {loading ? (
          <div className="col-span-1 md:col-span-2 lg:col-span-3 py-20 flex justify-center items-center">
            <BinaryLoader text="Loading Workspace..." />
          </div>
        ) : (
          teams.map((team) => (
            <Link key={team.id} to={`/team/${team.id}`}>
              <div className="glass-card bg-surface-container p-6 flex flex-col gap-6 group hover:border-on-surface/20 transition-all border border-outline h-full">
                <div className="flex justify-between items-start">
                  <div className="w-12 h-12 rounded bg-surface border border-outline flex items-center justify-center group-hover:bg-on-surface group-hover:border-on-surface transition-all duration-300">
                    <span className="material-symbols-outlined text-on-surface-variant group-hover:text-surface transition-colors">hub</span>
                  </div>
                  <div className="flex flex-col items-end">
                    <p className="text-[10px] font-mono text-on-surface-variant mt-2 opacity-50 uppercase tracking-widest">{team.invite_code}</p>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-on-surface group-hover:translate-x-1 transition-transform">{team.name}</h3>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                    <span>Progress</span>
                    <span className="text-on-surface">{team.progress || 0}%</span>
                  </div>
                  <div className="h-1 w-full bg-surface rounded-full overflow-hidden">
                    <div className="h-full bg-on-surface transition-all duration-1000" style={{ width: `${team.progress || 0}%` }} />
                  </div>
                </div>

                <div className="flex justify-between items-center pt-2 mt-auto">
                  <div className="flex items-center gap-2 text-on-surface-variant">
                    <span className="material-symbols-outlined text-sm">group</span>
                    <span className="text-xs font-medium uppercase tracking-tight">Network Team</span>
                  </div>
                  <span className="material-symbols-outlined text-on-surface-variant group-hover:text-on-surface transition-colors">arrow_forward</span>
                </div>
              </div>
            </Link>
          ))
        )}

        <div
          onClick={() => setShowOptions(!showOptions)}
          className={`glass-card p-6 flex flex-col items-center justify-center gap-4 cursor-pointer transition-all border-dashed border-outline hover:border-on-surface min-h-[250px] relative overflow-hidden ${showOptions ? 'bg-surface-container border-on-surface/30' : 'bg-transparent'}`}
        >
          {showOptions ? (
            <div className="flex flex-col gap-3 w-full h-full justify-center">
              <button onClick={(e) => { e.stopPropagation(); setModalType('create'); setShowOptions(false); }} className="w-full py-4 bg-on-surface text-surface rounded font-black uppercase text-[10px] tracking-widest hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-lg">
                <span className="material-symbols-outlined text-sm">add_circle</span>
                Initialize Team
              </button>
              <button onClick={(e) => { e.stopPropagation(); setModalType('join'); setShowOptions(false); }} className="w-full py-4 border border-outline text-on-surface rounded font-black uppercase text-[10px] tracking-widest hover:bg-surface transition-all flex items-center justify-center gap-2">
                <span className="material-symbols-outlined text-sm">group_add</span>
                Request Access
              </button>
              <button onClick={(e) => { e.stopPropagation(); setShowOptions(false); }} className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest hover:text-on-surface mt-4 transition-colors">Abort Interaction</button>
            </div>
          ) : (
            <>
              <div className="w-14 h-14 rounded-full border border-outline flex items-center justify-center group-hover:border-on-surface transition-colors">
                <span className="material-symbols-outlined text-on-surface-variant text-3xl">add</span>
              </div>
              <div className="text-center">
                <h3 className="text-on-surface font-medium font-display tracking-tight text-lg">Add Project</h3>
                <p className="text-[10px] text-on-surface-variant uppercase tracking-widest mt-1">Initiate Workspace</p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Modals */}
      {modalType && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-6 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="glass-card bg-surface w-full max-w-md p-10 border border-outline relative overflow-hidden shadow-2xl transition-all">
            <div className="absolute top-0 right-0 p-4">
              <button onClick={() => setModalType(null)} className="text-on-surface-variant hover:text-on-surface transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <h2 className="text-2xl font-bold text-on-surface uppercase tracking-tighter mb-8 flex items-center gap-3">
              <span className="w-2 h-6 bg-on-surface transition-colors"></span>
              {modalType === 'create' ? 'Create Team' : 'Join Team'}
            </h2>

            <div className="space-y-6">
              {error && <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest bg-red-500/10 p-3 border border-red-500/20">{error}</p>}

              {modalType === 'create' ? (
                <>
                  <div>
                    <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-[0.2em] mb-2 block">Project Alias</label>
                    <input value={newTeamName} onChange={(e) => setNewTeamName(e.target.value)} className="w-full bg-surface-container border border-outline rounded p-4 text-xs text-on-surface focus:outline-none focus:border-on-surface/50 font-mono transition-all" placeholder="e.g. Apollo Mission" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-[0.2em] mb-2 block">Objective Model</label>
                    <select value={taskModel} onChange={(e) => setTaskModel(Number(e.target.value))} className="w-full bg-surface-container border border-outline rounded p-4 text-xs text-on-surface outline-none focus:border-on-surface/50 font-mono transition-all appearance-none">
                      <option value={5}>5 Tasks (Lightweight)</option>
                      <option value={7}>7 Tasks (Standard)</option>
                      <option value={10}>10 Tasks (Immersive)</option>
                    </select>
                  </div>
                  <button onClick={handleCreateTeam} className="w-full py-4 bg-on-surface text-surface font-black text-[10px] uppercase tracking-[0.2em] hover:opacity-90 transition-all shadow-lg">Initialize Team</button>
                </>
              ) : (
                <>
                  <div>
                    <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-[0.2em] mb-2 block">Invite Code</label>
                    <input value={inviteCode} onChange={(e) => setInviteCode(e.target.value)} className="w-full bg-surface-container border border-outline rounded p-4 text-xs text-on-surface uppercase font-mono tracking-widest focus:outline-none focus:border-on-surface/50 transition-all" placeholder="XXXXXX" />
                  </div>
                  <button onClick={handleJoinTeam} className="w-full py-4 bg-on-surface text-surface font-black text-[10px] uppercase tracking-[0.2em] hover:opacity-90 transition-all shadow-lg">Request Access</button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
