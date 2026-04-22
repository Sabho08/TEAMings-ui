import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const EvidenceVault = () => {
  const { teamId } = useParams();
  const navigate = useNavigate();
  const [assets, setAssets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (teamId) fetchAssets();
  }, [teamId]);

  const fetchAssets = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/api/assets/${teamId}`);
      setAssets(response.data);
    } catch (err) {
      console.error('Vault synchronization failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-10 max-w-5xl mx-auto py-6">
      <header className="flex justify-between items-start">
        <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3">
            <div className="w-1.5 h-8 bg-white"></div>
            <h2 className="text-4xl font-bold tracking-tight text-white uppercase">Vault</h2>
            </div>
            <p className="text-zinc-500 text-sm max-w-2xl font-medium font-mono uppercase tracking-widest text-[9px]">
            Team: {teamId} / Central Asset Inventory
            </p>
        </div>
        <button onClick={() => navigate(-1)} className="px-4 py-2 border border-zinc-800 text-zinc-500 hover:text-white text-[10px] font-bold uppercase tracking-widest transition-all rounded">Back to Base</button>
      </header>

      <div className="glass-card bg-zinc-950 border border-zinc-800 rounded-lg overflow-hidden flex flex-col shadow-[0_0_50px_rgba(0,0,0,0.5)]">
        {/* Repository Header */}
        <div className="p-8 border-b border-zinc-800/50 flex justify-between items-center bg-zinc-900/20">
          <div className="flex gap-4 items-center">
            <div className="w-12 h-12 rounded bg-zinc-900 flex items-center justify-center text-white border border-zinc-800">
                <span className="material-symbols-outlined text-2xl">inventory_2</span>
            </div>
            <div>
                <h3 className="text-white text-lg font-bold uppercase tracking-wider">Asset Management</h3>
                <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mt-1">Classification: Top Secret</p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded bg-zinc-900 border border-zinc-800">
            <span className="material-symbols-outlined text-white text-[14px]">verified</span>
            <span className="text-[9px] text-white uppercase tracking-widest font-bold">Secure Team</span>
          </div>
        </div>

        {/* Upload Zone */}
        <div className="p-8 flex flex-col gap-10">
          <div className="relative group border-2 border-dashed border-zinc-900 bg-zinc-900/10 rounded-xl p-12 flex flex-col items-center justify-center text-center hover:border-white/20 transition-all cursor-pointer">
            <div className="flex gap-6 mb-8">
                {['picture_as_pdf', 'description', 'analytics'].map((icon, i) => (
                    <div key={i} className="w-14 h-14 rounded bg-zinc-900 flex items-center justify-center text-zinc-800 border border-zinc-900 group-hover:text-white group-hover:border-white transition-all">
                      <span className="material-symbols-outlined text-2xl">{icon}</span>
                    </div>
                ))}
            </div>
            <h4 className="text-white text-lg font-bold uppercase tracking-widest">Upload Assets</h4>
            <p className="text-zinc-700 text-[10px] font-bold uppercase mt-2 max-w-sm tracking-widest">Drag and drop packets here for encryption.</p>
            
            <button className="mt-8 px-8 py-3 bg-white text-black text-[10px] font-bold uppercase tracking-widest rounded hover:bg-zinc-200 transition-colors">
              SELECT PACKAGE
            </button>
          </div>

          {/* History Log */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-zinc-900 pb-4">
                <h3 className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">TRANSMISSION HISTORY</h3>
                <span className="text-[10px] font-bold text-zinc-800 uppercase tracking-widest">Team Storage Active</span>
            </div>
            
            <div className="grid gap-2">
              {loading ? (
                <div className="py-20 text-center animate-pulse">
                    <p className="text-[10px] text-zinc-800 font-bold uppercase tracking-[0.3em]">Syncing Records...</p>
                </div>
              ) : assets.length === 0 ? (
                 <div className="py-20 text-center border border-dashed border-zinc-900 rounded bg-zinc-900/10">
                    <p className="text-[10px] text-zinc-700 font-bold uppercase tracking-[0.3em]">No records found in team vault</p>
                 </div>
              ) : (
                assets.map((log, i) => (
                    <motion.div 
                        key={i} 
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="flex items-center justify-between p-4 bg-zinc-900/20 border border-zinc-950 hover:border-zinc-800 transition-all group"
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded bg-zinc-900 border border-zinc-900 flex items-center justify-center text-zinc-800 group-hover:text-white transition-colors">
                                <span className="material-symbols-outlined">description</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-xs font-bold text-white uppercase tracking-wider group-hover:translate-x-1 transition-transform">{log.file_name}</span>
                                <span className="text-[9px] text-zinc-600 uppercase tracking-widest font-mono">
                                    Source: {log.owner?.full_name} • {new Date(log.created_at).toLocaleDateString()}
                                </span>
                            </div>
                        </div>
                        <div className="flex items-center gap-8">
                            <span className="text-[10px] font-mono text-zinc-800">{Math.round(log.file_size / 1024 / 1024 * 100) / 100} MB</span>
                            <div className="hidden md:flex items-center gap-1.5 px-2 py-0.5 border border-zinc-900 rounded">
                                <div className="w-1 h-1 rounded-full bg-green-500"></div>
                                <span className="text-[8px] font-bold text-zinc-600 uppercase tracking-widest">SAVED</span>
                            </div>
                            <button className="text-zinc-800 hover:text-white transition-colors">
                                <span className="material-symbols-outlined text-lg">download</span>
                            </button>
                        </div>
                    </motion.div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Action Bar */}
        <div className="p-6 border-t border-zinc-800/50 bg-zinc-900/10 flex justify-end gap-3">
          <button className="px-6 py-2 border border-zinc-800 text-zinc-500 hover:text-white text-[10px] font-bold uppercase tracking-widest transition-colors rounded" onClick={() => navigate(-1)}>Dismiss</button>
          <button className="px-6 py-2 bg-white text-black text-[10px] font-bold uppercase tracking-widest hover:bg-zinc-200 transition-colors rounded">Commit Changes</button>
        </div>
      </div>
    </div>
  );
};

export default EvidenceVault;
