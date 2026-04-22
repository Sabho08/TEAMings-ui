import React from 'react';

const BinaryLoader = ({ text = "Loading..." }: { text?: string }) => {
  return (
    <div className="flex flex-col items-center justify-center gap-6">
      <div className="binary-grid grid grid-cols-4 gap-2">
        <div className="binary-unit w-4 h-4 bg-on-surface animate-grid-ripple" style={{ animationDelay: '0.1s' }}></div>
        <div className="binary-unit inactive w-4 h-4 bg-transparent border border-on-surface/20 animate-grid-ripple" style={{ animationDelay: '0.2s' }}></div>
        <div className="binary-unit w-4 h-4 bg-on-surface animate-grid-ripple" style={{ animationDelay: '0.3s' }}></div>
        <div className="binary-unit w-4 h-4 bg-on-surface animate-grid-ripple" style={{ animationDelay: '0.4s' }}></div>
        <div className="binary-unit inactive w-4 h-4 bg-transparent border border-on-surface/20 animate-grid-ripple" style={{ animationDelay: '0.5s' }}></div>
        <div className="binary-unit w-4 h-4 bg-on-surface animate-grid-ripple" style={{ animationDelay: '0.6s' }}></div>
        <div className="binary-unit inactive w-4 h-4 bg-transparent border border-on-surface/20 animate-grid-ripple" style={{ animationDelay: '0.7s' }}></div>
        <div className="binary-unit w-4 h-4 bg-on-surface animate-grid-ripple" style={{ animationDelay: '0.8s' }}></div>
      </div>
      <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-[0.3em] animate-pulse">
        {text}
      </p>
    </div>
  );
};

export default BinaryLoader;
