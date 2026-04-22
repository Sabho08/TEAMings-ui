import { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import BinaryLoader from '../components/BinaryLoader';

interface Member {
  id: string;
  name: string;
  role: string;
  email: string;
  status: 'Active' | 'Pending';
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const TeamRoles = () => {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    axios.get(`${API_BASE_URL}/api/members`)
      .then(res => {
        setMembers(res.data);
        setLoading(false);
      })
      .catch(() => {
        // Mock data if API fails
        setMembers([
          { id: '1', name: 'Alex Rivera', role: 'Lead Architect', email: 'alex@team.int', status: 'Active' },
          { id: '2', name: 'Sarah Chen', role: 'Security Ops', email: 'sarah@team.int', status: 'Active' },
          { id: '3', name: 'Marcus Bell', role: 'DevOps Engine', email: 'marcus@team.int', status: 'Pending' },
        ]);
        setLoading(false);
      });
  }, []);

  return (
    <div className="flex flex-col gap-10">
      <header className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
           <div className="w-1.5 h-8 bg-white"></div>
            <h2 className="text-4xl font-bold tracking-tight text-white uppercase">Members</h2>
        </div>
        <p className="text-zinc-500 text-sm max-w-2xl font-medium">
          Manage team roles and project access.
        </p>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-10 items-start">
        {/* Recruitment Module */}
        <section className="xl:col-span-4">
          <div className="glass-card p-8 bg-zinc-950 border border-zinc-800">
            <h3 className="text-white text-xs font-bold uppercase tracking-widest mb-8">Add Member</h3>
            
            <form className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest ml-1">Full Name</label>
                <input 
                  className="w-full bg-zinc-900 border border-zinc-800 rounded px-4 py-3 text-sm text-white focus:outline-none focus:border-white/50 transition-all placeholder:text-zinc-700" 
                  placeholder="Full Name" 
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest ml-1">Email</label>
                <input 
                  className="w-full bg-zinc-900 border border-zinc-800 rounded px-4 py-3 text-sm text-white focus:outline-none focus:border-white/50 transition-all placeholder:text-zinc-700" 
                  placeholder="secure@team.int" 
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest ml-1">Role</label>
                <select className="w-full bg-zinc-900 border border-zinc-800 rounded px-4 py-3 text-sm text-white focus:outline-none focus:border-white/50 transition-all appearance-none cursor-pointer">
                  <option>Lead Systems Architect</option>
                  <option>Intelligence Analyst</option>
                  <option>Frontend Specialist</option>
                  <option>Core Security</option>
                </select>
              </div>

              <button className="w-full py-4 bg-white text-black text-xs font-bold uppercase tracking-widest rounded hover:bg-zinc-200 transition-colors">
                Invite Member
              </button>
            </form>
          </div>
        </section>

        {/* Global Directory */}
        <section className="xl:col-span-8 flex flex-col gap-6">
          <div className="flex items-center justify-between">
             <h3 className="text-white text-xs font-bold uppercase tracking-widest">Team Members</h3>
             <span className="text-[10px] font-bold text-zinc-600">{members.length} RECORDED</span>
          </div>

          <div className="grid gap-3 min-h-[400px] relative">
            {loading ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <BinaryLoader text="Fetching Operational Teams..." />
              </div>
            ) : (
              <AnimatePresence>
                  {members.map((m, i) => (
                      <motion.div
                          key={m.id}
                          initial={{ opacity: 0, x: 10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.05 }}
                          className="glass-card p-5 bg-zinc-950/40 border border-zinc-800/50 flex items-center justify-between group hover:border-white/20 transition-all"
                      >
                          <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded bg-zinc-900 border border-zinc-800 overflow-hidden">
                                  <img src={`https://i.pravatar.cc/150?u=${m.id}`} alt={m.name} className="w-full h-full object-cover grayscale opacity-60 group-hover:opacity-100 transition-opacity" />
                              </div>
                              <div>
                                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">{m.name}</h4>
                                  <p className="text-[10px] text-zinc-600 mt-0.5">{m.email}</p>
                              </div>
                          </div>

                          <div className="flex items-center gap-12">
                              <div className="hidden md:flex flex-col text-right">
                                  <span className="text-[10px] text-zinc-700 uppercase tracking-widest mb-1">Position</span>
                                  <span className="text-[10px] font-bold text-white uppercase">{m.role}</span>
                              </div>

                              <div className="flex flex-col items-end w-20">
                                  <span className="text-[10px] text-zinc-700 uppercase tracking-widest mb-1">Status</span>
                                  <span className={`text-[10px] font-bold uppercase ${m.status === 'Active' ? 'text-white' : 'text-zinc-600 animate-pulse'}`}>
                                    {m.status}
                                  </span>
                              </div>

                              <button className="text-zinc-700 hover:text-white transition-colors">
                                  <span className="material-symbols-outlined text-lg">more_vert</span>
                              </button>
                          </div>
                      </motion.div>
                  ))}
              </AnimatePresence>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default TeamRoles;
