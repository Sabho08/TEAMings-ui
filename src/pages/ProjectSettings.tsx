import { motion } from 'framer-motion';

const ProjectSettings = () => {
  return (
    <div className="flex flex-col gap-10 max-w-4xl mx-auto py-10 w-full">
      <header className="flex flex-col gap-3 text-center">
        <h2 className="text-4xl font-bold tracking-tight text-white uppercase">Project Protocol</h2>
        <p className="text-zinc-500 text-sm max-w-2xl mx-auto font-medium">
          Specify the structural foundation for your project pipeline. This configuration governs the mandatory validation gates across the engineering lifecycle.
        </p>
      </header>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Model 1: 7-Task (Active) */}
        <motion.div 
          whileHover={{ y: -4 }}
          className="glass-card p-8 border border-white bg-zinc-950 flex flex-col gap-6 relative"
        >
          <div className="absolute top-6 right-6 text-white">
            <span className="material-symbols-outlined text-2xl">verified</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Active Schema</span>
            <h3 className="text-xl font-bold text-white uppercase tracking-wider">Rapid Tier (7)</h3>
          </div>
          <p className="text-xs text-zinc-400 leading-relaxed flex-1 font-medium">
            Streamlined pipeline optimized for high-velocity engineering. Concise validation cycles for rapid deployment.
          </p>

          <div className="pt-6 border-t border-zinc-900">
             <p className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest mb-4">Pipeline Sequence</p>
             <div className="flex items-center gap-1.5">
                {[1,2,3,4,5,6,7].map((n) => (
                    <div key={n} className="flex-1 h-8 rounded bg-zinc-900 border border-zinc-800 flex items-center justify-center font-mono text-[10px] text-white/50 font-bold">
                        {n}
                    </div>
                ))}
             </div>
          </div>
        </motion.div>

        {/* Model 2: 10-Task */}
        <motion.div 
          whileHover={{ y: -4 }}
          className="glass-card p-8 border border-zinc-900 bg-zinc-950/20 flex flex-col gap-6 opacity-60 hover:opacity-100 hover:border-zinc-800 transition-all cursor-pointer group"
        >
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-bold text-zinc-700 uppercase tracking-widest">Locked Schema</span>
            <h3 className="text-xl font-bold text-zinc-500 group-hover:text-white transition-colors uppercase tracking-wider">Rigorous (10)</h3>
          </div>
          <p className="text-xs text-zinc-600 leading-relaxed flex-1 font-medium group-hover:text-zinc-500 transition-colors">
            Comprehensive engineering model. Integrates extensive documentation, peer review phases, and extended QA validation sequences.
          </p>

          <div className="pt-6 border-t border-zinc-900">
             <p className="text-[9px] font-bold text-zinc-700 uppercase tracking-widest mb-4">Pipeline Sequence</p>
             <div className="flex items-center gap-1">
                {[1,2,3,4,5,6,7,8,9,10].map((n) => (
                    <div key={n} className="flex-1 h-6 rounded bg-zinc-900/50 border border-zinc-900 flex items-center justify-center font-mono text-[9px] text-zinc-800">
                        {n}
                    </div>
                ))}
             </div>
          </div>
        </motion.div>
      </div>

      <div className="mt-10 flex flex-col items-center gap-6 p-10 glass-card bg-zinc-950/50 border border-zinc-900">
         <div className="flex items-center gap-4">
             <span className="material-symbols-outlined text-white text-3xl">security</span>
             <div>
                <p className="text-sm font-bold text-white uppercase tracking-wider">Authorize Protocol Change</p>
                <p className="text-[10px] text-zinc-600 uppercase tracking-widest font-bold">Apply selected model to all terminal teams</p>
             </div>
         </div>
         <button className="px-12 py-4 bg-white text-black text-xs font-bold uppercase tracking-widest rounded hover:bg-zinc-200 transition-colors shadow-2xl">
            Execute Initialization
         </button>
      </div>
    </div>
  );
};

export default ProjectSettings;
