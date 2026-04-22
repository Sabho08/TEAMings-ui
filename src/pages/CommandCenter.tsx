import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Send as SendIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { format, addMonths, subMonths, isSameDay, getDaysInMonth, startOfMonth } from "date-fns";
import { cn } from "../lib/utils";
import BinaryLoader from '../components/BinaryLoader';

import { supabase } from '../lib/supabase';
import NotificationCenter from '../components/NotificationCenter';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

interface Task {
  id: string;
  title: string;
  status: 'pending' | 'submitted' | 'confirmed';
  evidence?: {
    text: string;
    fileUrl: string;
  };
}

interface Member {
  id: string;
  name: string;
  role: string;
  avatar: string;
  tasks: Task[];
  user_id?: string;
  username?: string;
  permission_level?: string;
}

const CommandCenter = () => {
  const { teamId } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('progress');
  const [loading, setLoading] = useState(true);

  // State from server
  const [team, setTeam] = useState<any>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [msgInput, setMsgInput] = useState('');
  const [selectedRecipient, setSelectedRecipient] = useState<Member | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [calendarSelectedDate, setCalendarSelectedDate] = useState(new Date());
  const [reviewTask, setReviewTask] = useState<any>(null);
  const [submitTaskModal, setSubmitTaskModal] = useState<any>(null);
  const [submissionText, setSubmissionText] = useState('');
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [addingTaskToMember, setAddingTaskToMember] = useState<string | null>(null);
  const [editingRoleMember, setEditingRoleMember] = useState<string | null>(null);
  const [tempRoleName, setTempRoleName] = useState('');
  const [tempDescription, setTempDescription] = useState('');
  const [tempDuration, setTempDuration] = useState(1);

  useEffect(() => {
    const syncUser = () => {
      const rawUser = localStorage.getItem('teamings_user');
      if (rawUser && rawUser !== 'undefined') {
        try {
          const parsed = JSON.parse(rawUser);
          setCurrentUser(parsed);
          // If the profile changed, re-fetch member names
          if (teamId) fetchData();
        } catch (e) {
          console.error("User session sync failed");
        }
      }
    };

    syncUser();
    window.addEventListener('storage', syncUser);
    if (teamId) fetchData();

    return () => window.removeEventListener('storage', syncUser);
  }, [teamId]);

  // --- TRUE REAL-TIME SYNC ---
  useEffect(() => {
    if (!teamId) return;

    // Listen for new messages in real-time
    const channel = supabase
      .channel(`team-chat-${teamId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `team_id=eq.${teamId}`
        },
        () => {
          console.log('[Real-time] New message detected, syncing...');
          fetchData(false);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [teamId]);

  // Background Heartbeat (Fallover Polling every 30s)
  useEffect(() => {
    if (!teamId || loading) return;
    const pollInterval = setInterval(() => {
      fetchData(false); 
    }, 30000);
    return () => clearInterval(pollInterval);
  }, [teamId, loading]);

  const fetchData = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      const [teamRes, msgRes, eventRes, memberRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/projects/${teamId}`),
        axios.get(`${API_BASE_URL}/api/messages/${teamId}`),
        axios.get(`${API_BASE_URL}/api/events/${teamId}`),
        axios.get(`${API_BASE_URL}/api/members/${teamId}`)
      ]);

      setTeam(teamRes.data);
      setTempDescription(teamRes.data.description || '');
      setTempDuration(teamRes.data.duration_months || 1);
      
      // Merge chat messages to prevent scroll jumping if possible
      setChatMessages(prev => {
        const isDifferent = JSON.stringify(prev) !== JSON.stringify(msgRes.data);
        return isDifferent ? msgRes.data : prev;
      });

      setEvents(eventRes.data);

      const transformedMembers = memberRes.data.map((m: any) => ({
        id: m.id,
        name: m.user?.full_name || 'Unknown',
        username: m.user?.username || 'operator',
        role: m.role_title || 'Operator',
        avatar: m.user?.avatar_url || `https://i.pravatar.cc/150?u=${m.id}`,
        tasks: teamRes.data.tasks?.filter((t: any) => t.assignee_id === m.id) || [],
        user_id: m.user_id,
        permission_level: m.permission_level
      }));
      
      setMembers(prev => {
        const isDifferent = JSON.stringify(prev) !== JSON.stringify(transformedMembers);
        return isDifferent ? transformedMembers : prev;
      });

      // Self-healing: If user is owner but not in members, add them
      const isUserInMembers = transformedMembers.some((m: any) => m.user_id === currentUser?.id);
      if (teamRes.data.owner_id === currentUser?.id && !isUserInMembers) {
        console.log("Self-healing: Adding owner to team_members...");
        await axios.post(`${API_BASE_URL}/api/projects/join`, {
          invite_code: teamRes.data.invite_code,
          user_id: currentUser.id
        });
        fetchData(); // Reload with new member
      }

    } catch (err) {
      console.error('Data sync failed:', err);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  const isLeader = useMemo(() => {
    if (!currentUser) return false;
    // Owner is always a leader, even if not in members list yet
    if (team?.owner_id === currentUser.id) return true;

    const memberRecord = members.find(m => m.user_id === currentUser.id);
    return memberRecord?.permission_level === 'leader';
  }, [currentUser, members, team]);

  const teamLeader = useMemo(() => {
    return members.find(m => m.permission_level === 'leader' || m.user_id === team?.owner_id);
  }, [members, team]);

  const chatRecipients = useMemo(() => {
    if (isLeader) {
      // Leader can DM any member
      return members.filter(m => m.user_id !== currentUser?.id);
    } else {
      // Member can only DM the leader
      return teamLeader ? [teamLeader] : [];
    }
  }, [isLeader, members, teamLeader, currentUser]);

  const filteredMessages = useMemo(() => {
    if (!selectedRecipient) {
      // Team Feed (Group Chat)
      return chatMessages.filter(m => !m.receiver_id);
    } else {
      // Direct Message
      const targetId = selectedRecipient.user_id;
      return chatMessages.filter(m =>
        (m.sender_id === currentUser?.id && m.receiver_id === targetId) ||
        (m.sender_id === targetId && m.receiver_id === currentUser?.id)
      );
    }
  }, [chatMessages, selectedRecipient, currentUser]);

  const handleSendMessage = async () => {
    if (!msgInput.trim() || !currentUser) return;
    try {
      const response = await axios.post(`${API_BASE_URL}/api/messages`, {
        team_id: teamId,
        sender_id: currentUser.id,
        receiver_id: selectedRecipient?.user_id || null,
        content: msgInput
      });

      const newMsg = {
        ...response.data,
        sender: {
          full_name: currentUser.user_metadata?.full_name || 'You',
          avatar_url: currentUser.user_metadata?.avatar_url
        }
      };
      setChatMessages([...chatMessages, newMsg]);
      setMsgInput('');
    } catch (err) {
      console.error('Failed to send message');
    }
  };

  const handleDeleteMessage = async (msgId: string) => {
    try {
      await axios.delete(`${API_BASE_URL}/api/messages/${msgId}`);
      setChatMessages(chatMessages.filter(m => m.id !== msgId));
    } catch (err) {
      console.error('Failed to delete message');
    }
  };

  const handleAddTask = async (memberId: string) => {
    if (!newTaskTitle.trim()) return;
    try {
      await axios.post(`${API_BASE_URL}/api/tasks`, {
        team_id: teamId,
        assignee_id: memberId,
        title: newTaskTitle,
        description: 'Standard operational objective.'
      });
      setNewTaskTitle('');
      setAddingTaskToMember(null);
      fetchData();
    } catch (err) {
      console.error('Task addition failed');
    }
  };

  const handleUpdateRole = async (memberId: string) => {
    try {
      await axios.put(`${API_BASE_URL}/api/members/${memberId}`, {
        role_title: tempRoleName
      });
      setEditingRoleMember(null);
      setTempRoleName('');
      fetchData();
    } catch (err) {
      console.error('Role update failed');
    }
  };

  const handleSaveDirective = async () => {
    try {
      await axios.put(`${API_BASE_URL}/api/projects/${teamId}`, {
        description: tempDescription,
        duration_months: tempDuration
      });
      fetchData();
    } catch (err) {
      console.error('Directive update failed');
    }
  };

  const handleUpdateTask = async (taskId: string, status: string, subText?: string, evidenceUrl?: string) => {
    try {
      await axios.put(`${API_BASE_URL}/api/tasks/${taskId}`, {
        status,
        submission_text: subText || submissionText,
        evidence_url: evidenceUrl
      });
      fetchData(); // Refresh board
      setReviewTask(null);
      setSubmitTaskModal(null);
      setSubmissionText('');
    } catch (err) {
      console.error('Task update failed');
    }
  };

  const tabs = [
    { id: 'progress', label: 'Monitor', icon: 'monitoring', leaderOnly: false },
    { id: 'overview', label: 'Overview', icon: 'groups', leaderOnly: false },
    { id: 'tasks', label: 'Workflows', icon: 'task_alt', leaderOnly: false },
    { id: 'schedule', label: 'Timeline', icon: 'calendar_month', leaderOnly: false },
    { id: 'intelligence', label: 'Chat', icon: 'forum', leaderOnly: false },
    { id: 'report', label: 'Final Summary', icon: 'description', leaderOnly: false },
  ];

  if (loading) {
    return (
      <div className="h-screen w-screen bg-surface flex flex-col items-center justify-center p-10 transition-colors duration-300">
        <BinaryLoader />
      </div>
    );
  }

  return (
    <div className="flex bg-surface h-screen w-screen overflow-hidden fixed inset-0 z-50 transition-colors duration-300">
      {/* Team Sidebar */}
      <nav className="w-20 lg:w-64 border-r border-outline bg-surface flex flex-col items-center lg:items-stretch py-8 px-4 flex-shrink-0 transition-colors duration-300">
        <div className="flex items-center gap-3 mb-10 px-2 cursor-pointer" onClick={() => navigate('/')}>
          <div className="w-8 h-8 rounded bg-on-surface flex items-center justify-center transition-colors">
            <span className="material-symbols-outlined text-surface font-bold text-lg">arrow_back</span>
          </div>
          <span className="hidden lg:block text-xs font-bold text-on-surface-variant uppercase tracking-widest">Back to Core</span>
        </div>

        <div className="mb-10 px-2">
          <div className="flex flex-col gap-1">
            <h2 className="hidden lg:block text-sm font-bold text-white uppercase tracking-wider truncate">{team?.name || 'Loading...'}</h2>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">TEAM_{team?.invite_code}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2 flex-1">
          {tabs.filter(t => !t.leaderOnly || isLeader).map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-4 px-4 py-3 rounded transition-all group ${activeTab === tab.id ? 'bg-surface-container text-on-surface shadow-[inset_0_0_10px_rgba(255,255,255,0.05)]' : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container/50'}`}>
              <span className={`material-symbols-outlined text-xl transition-transform ${activeTab === tab.id ? 'scale-110' : 'group-hover:translate-x-1'}`}>{tab.icon}</span>
              <span className="hidden lg:block text-[11px] font-bold uppercase tracking-widest">{tab.label}</span>
            </button>
          ))}
        </div>

        <div className="mt-auto border-t border-outline pt-6 px-2 flex items-center gap-4 transition-colors">
          <div className="w-10 h-10 rounded bg-surface-container border border-outline flex items-center justify-center overflow-hidden">
            {currentUser?.avatar_url ? (
              <img src={currentUser.avatar_url} className="w-full h-full object-cover" alt="Profile" />
            ) : (
              <span className="material-symbols-outlined text-on-surface-variant">person</span>
            )}
          </div>
          <div className="hidden lg:block min-w-0">
            <p className="text-[10px] font-bold text-on-surface uppercase tracking-widest truncate">{currentUser?.user_metadata?.full_name || currentUser?.email?.split('@')[0] || 'User'}</p>
            <p className="text-[9px] text-on-surface-variant uppercase font-bold mt-0.5 truncate">
              {members.find(m => m.user_id === currentUser?.id)?.role || (isLeader ? 'Lead Team' : 'Member Access')}
            </p>
          </div>
        </div>
      </nav>

      <main className="flex-1 overflow-auto flex flex-col relative bg-surface transition-colors duration-300">
        <header className="h-20 border-b border-outline flex items-center justify-between px-10 bg-surface-container/50 backdrop-blur-md transition-all">
          <div>
            <h1 className="text-on-surface text-xs font-bold uppercase tracking-[0.3em] font-mono">{tabs.find(t => t.id === activeTab)?.label} Dashboard</h1>
            <p className="text-[10px] text-on-surface-variant font-bold uppercase mt-1">Team ID: {teamId}</p>
          </div>

          <div className="flex items-center gap-6">
            <NotificationCenter />
            <div className="flex flex-col items-end">
              <p className="text-[10px] font-bold text-zinc-500 uppercase">Sync Status</p>
              <p className="text-[10px] font-mono text-green-500 uppercase">Authenticated</p>
            </div>
          </div>
        </header>

        <div className="p-10 flex-1">
          <AnimatePresence mode="wait">
            {activeTab === 'progress' && (
              <motion.div key="progress" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                <div className="glass-card bg-surface-container p-6 border border-outline lg:col-span-2">
                  <h3 className="text-on-surface text-[10px] font-bold uppercase tracking-[0.2em] mb-8">Team Progression</h3>
                  <div className="space-y-10">
                    {members.map((item, i) => {
                      const completed = item.tasks.filter(t => t.status === 'confirmed').length;
                      const total = item.tasks.length;
                      const p = total > 0 ? Math.round((completed / total) * 100) : 0;
                      return (
                        <div key={i} className="flex flex-col gap-4">
                          <div className="flex justify-between items-end">
                            <div className="flex flex-col gap-1">
                              <span className="text-on-surface text-xs font-bold tracking-wider uppercase">{item.role}</span>
                              <span className="text-[8px] text-on-surface-variant font-bold uppercase tracking-widest">{completed}/{total} Tasks Confirmed</span>
                            </div>
                            <span className="text-[10px] font-mono text-on-surface font-bold">{p}%</span>
                          </div>
                          <div className="h-1 bg-surface rounded-full overflow-hidden">
                            <motion.div initial={{ width: 0 }} animate={{ width: `${p}%` }} className="h-full bg-on-surface shadow-[0_0_15px_rgba(255,255,255,0.2)] transition-all duration-300" />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                <div className="glass-card bg-surface-container p-6 border border-outline text-center">
                  <h3 className="text-on-surface text-[10px] font-bold uppercase tracking-[0.2em] mb-8">Overall Completion</h3>
                  <div className="flex items-center justify-center p-4">
                    <div className="relative w-24 h-24">
                      <svg className="w-full h-full transform -rotate-90">
                        <circle className="text-zinc-900" strokeWidth="4" stroke="currentColor" fill="transparent" r="44" cx="48" cy="48" />
                        <circle className="text-white" strokeWidth="4" strokeDasharray={276} strokeDashoffset={276 - (276 * (team?.progress || 0)) / 100} strokeLinecap="round" stroke="currentColor" fill="transparent" r="44" cx="48" cy="48" />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center text-white font-mono text-xl">{team?.progress || 0}%</div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'overview' && (
              <motion.div key="overview" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex flex-col gap-10">
                <header className="flex flex-col gap-2">
                  <h2 className="text-3xl font-bold text-white uppercase tracking-tighter">Team Directory</h2>
                  <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest opacity-60">Verified operational teams within {team?.name}.</p>
                </header>

                <div className="glass-card bg-surface-container p-10 border border-outline relative overflow-hidden group transition-all">
                  <div className="absolute top-0 right-0 p-6 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity">
                    <span className="material-symbols-outlined text-[120px]">description</span>
                  </div>

                  <div className="flex justify-between items-center mb-8 relative z-10 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-1.5 h-6 bg-on-surface"></div>
                      <h3 className="text-on-surface text-xs font-bold uppercase tracking-[0.2em]">Operational Directive</h3>
                    </div>
                    {isLeader && (
                      <button
                        onClick={handleSaveDirective}
                        className="px-6 py-2 bg-on-surface text-surface font-black text-[9px] uppercase tracking-widest hover:opacity-90 transition-all shadow-lg"
                      >
                        Commit Updates
                      </button>
                    )}
                  </div>

                  {isLeader ? (
                    <div className="flex flex-col gap-8 relative z-10">
                      <div className="flex flex-col gap-3">
                        <label className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">Project Scope & Team Role Definitions</label>
                        <textarea
                          value={tempDescription}
                          onChange={(e) => setTempDescription(e.target.value)}
                          className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 text-sm text-zinc-300 outline-none focus:border-white/20 transition-all min-h-[160px] leading-relaxed"
                          placeholder="Describe the mission objective and designate roles for specific members (e.g., Team 1: Backend Architecture, Team 2: UI/UX Flow)..."
                        />
                      </div>

                      <div className="flex items-center gap-8 border-t border-zinc-900 pt-8">
                        <div className="flex flex-col gap-2">
                          <label className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">Lifespan Projection</label>
                          <div className="flex items-center gap-4">
                            <input
                              type="number"
                              value={tempDuration}
                              onChange={(e) => setTempDuration(Number(e.target.value))}
                              className="w-24 bg-zinc-900/50 border border-zinc-800 rounded-lg px-4 py-3 text-lg font-mono font-bold text-white outline-none focus:border-white/20"
                            />
                            <span className="text-xs font-black text-zinc-400 uppercase tracking-widest">Months</span>
                          </div>
                        </div>
                        <div className="flex-1 p-6 bg-white/5 rounded-xl border border-white/5">
                          <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest leading-relaxed">
                            This data serves as the baseline for AI timeline generation. Objective intervals will be calculated based on this projection.
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-8 relative z-10">
                      <div className="p-8 bg-black/40 rounded-2xl border border-zinc-900/50">
                        <p className="text-zinc-300 text-sm leading-relaxed whitespace-pre-wrap">{team?.description || 'No operational directive issued by command yet.'}</p>
                      </div>
                      <div className="flex items-center gap-3 px-2">
                        <span className="material-symbols-outlined text-zinc-600 text-sm">schedule</span>
                        <span className="text-[10px] text-zinc-600 font-black uppercase tracking-widest">Strategic Completion Span: <span className="text-white ml-2">{team?.duration_months || 0} MONTHS</span></span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {members.map(member => (
                    <div key={member.id} className="glass-card bg-surface-container p-8 border border-outline group hover:border-on-surface/10 transition-all">
                      <div className="flex items-center gap-6 mb-8">
                        <div className="w-16 h-16 rounded-2xl bg-surface border border-outline overflow-hidden shrink-0 group-hover:scale-105 transition-transform">
                          <img src={member.avatar} alt={member.name} className="w-full h-full object-cover" />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-on-surface uppercase tracking-tight">{member.name}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] text-on-surface-variant font-mono">@{member.username}</span>
                            {member.permission_level === 'leader' && <span className="bg-on-surface/10 px-2 py-0.5 rounded text-[8px] font-black text-on-surface uppercase tracking-widest">Leader</span>}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4 border-t border-outline pt-6 transition-colors">
                        <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                          <span className="text-on-surface-variant">Primary Role</span>
                          <span className="text-on-surface">{member.role}</span>
                        </div>
                        <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                          <span className="text-on-surface-variant">Success Rate</span>
                          <span className="text-on-surface">
                            {member.tasks.length > 0 ? Math.round((member.tasks.filter(t => t.status === 'confirmed').length / member.tasks.length) * 100) : 0}%
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                          <span className="text-on-surface-variant">Current Task</span>
                          <span className="text-on-surface-variant truncate ml-4">
                            {member.tasks.find(t => t.status !== 'confirmed')?.title || 'Standby'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {activeTab === 'tasks' && (
              <motion.div key="tasks" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="h-full">
                {isLeader ? (
                  /* LEADER: 4-COLUMN BOARD */
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 h-full items-start">
                    {members.map((member) => (
                      <div key={member.id} className="flex flex-col bg-surface-container/50 border border-outline rounded-lg overflow-hidden h-full min-h-[500px] transition-all">
                        {/* Member Header */}
                        <div className="p-5 border-b border-outline bg-surface-container/30 transition-colors">
                          <div className="flex items-center gap-3 mb-4">
                            <div className="w-8 h-8 rounded border border-outline bg-surface overflow-hidden shrink-0">
                              <img src={member.avatar} alt={member.name} className="w-full h-full object-cover" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="text-[11px] font-bold text-on-surface uppercase tracking-widest truncate">{member.name}</h4>
                              {editingRoleMember === member.id ? (
                                <div className="flex gap-2 mt-1">
                                  <input
                                    autoFocus
                                    value={tempRoleName}
                                    onChange={(e) => setTempRoleName(e.target.value)}
                                    onBlur={() => handleUpdateRole(member.id)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleUpdateRole(member.id)}
                                    className="bg-black border border-zinc-700 text-[9px] text-white px-2 py-0.5 rounded outline-none w-full"
                                  />
                                </div>
                              ) : (
                                <p
                                  onClick={() => {
                                    setEditingRoleMember(member.id);
                                    setTempRoleName(member.role);
                                  }}
                                  className="text-[8px] text-zinc-600 uppercase font-black tracking-[0.2em] hover:text-white cursor-pointer transition-colors"
                                >
                                  {member.role}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center justify-between text-[8px] font-bold uppercase tracking-widest text-zinc-500">
                            <span>{member.tasks.length} Objectives</span>
                            <span>{member.tasks.filter(t => t.status === 'confirmed').length} Verified</span>
                          </div>
                        </div>

                        {/* Tasks List */}
                        <div className="flex-1 p-4 overflow-y-auto space-y-3 custom-scrollbar">
                          {member.tasks.map((task) => (
                            <div
                              key={task.id}
                              onClick={() => {
                                // Allow leader to evaluate at any stage
                                if (isLeader) setReviewTask({ member, task });
                                else if (task.status === 'submitted') setReviewTask({ member, task });
                              }}
                              className={cn(
                                "p-4 border transition-all cursor-pointer relative group",
                                task.status === 'confirmed' ? "bg-zinc-900/40 border-green-500/20" : "bg-zinc-900/20 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900/40"
                              )}
                            >
                              <h5 className="text-[10px] font-bold text-zinc-200 uppercase tracking-wider leading-relaxed mb-4">{task.title}</h5>
                              <div className="flex justify-between items-center">
                                {task.status === 'confirmed' ? (
                                  <span className="text-[8px] font-black text-green-500 uppercase tracking-widest flex items-center gap-1">
                                    <span className="material-symbols-outlined text-[12px]">verified</span>
                                    LOGGED
                                  </span>
                                ) : task.status === 'submitted' ? (
                                  <span className="text-[8px] font-black text-white bg-blue-500/20 px-2 py-0.5 rounded uppercase tracking-widest animate-pulse">Needs Review</span>
                                ) : (
                                  <span className="text-[8px] font-black text-zinc-700 uppercase tracking-widest">Active</span>
                                )}
                              </div>
                            </div>
                          ))}

                          {/* Add Task Control */}
                          {addingTaskToMember === member.id ? (
                            <div className="p-4 bg-zinc-900/40 border border-white/10 rounded animate-in fade-in slide-in-from-top-2">
                              <textarea
                                autoFocus
                                value={newTaskTitle}
                                onChange={(e) => setNewTaskTitle(e.target.value)}
                                placeholder="Define objective..."
                                className="w-full bg-transparent text-[10px] text-white outline-none resize-none h-16 mb-2"
                              />
                              <div className="flex gap-2">
                                <button onClick={() => handleAddTask(member.id)} className="flex-1 bg-white text-black text-[9px] font-black uppercase py-1.5 hover:bg-zinc-200">Commit</button>
                                <button onClick={() => setAddingTaskToMember(null)} className="px-2 text-zinc-500 text-[9px] uppercase font-bold hover:text-white">Abort</button>
                              </div>
                            </div>
                          ) : (
                            <button
                              onClick={() => setAddingTaskToMember(member.id)}
                              className="w-full py-3 border border-dashed border-zinc-800 rounded text-[9px] font-black text-zinc-600 uppercase tracking-[0.2em] hover:bg-white/5 hover:border-zinc-700 hover:text-zinc-400 transition-all"
                            >
                              + New Operational Objective
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  /* MEMBER: PERSONAL TASK LIST */
                  <div className="max-w-4xl mx-auto flex flex-col gap-10 py-10 transition-colors">
                    <header className="flex flex-col gap-2">
                      <div className="flex items-center gap-4">
                        <div className="w-1.5 h-10 bg-on-surface"></div>
                        <h2 className="text-4xl font-bold text-on-surface uppercase tracking-tighter">Assigned Tasks</h2>
                      </div>
                      <p className="text-on-surface-variant text-sm font-medium ml-6 uppercase tracking-widest opacity-60">Task List to be Executed</p>
                    </header>

                    <div className="grid gap-4 ml-6">
                      {members.find(m => m.user_id === currentUser?.id)?.tasks.map((task) => (
                        <div key={task.id} className="glass-card bg-surface-container p-8 border border-outline group hover:border-on-surface/10 transition-all flex items-center justify-between">
                          <div className="flex flex-col gap-1 max-w-2xl">
                            <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-widest transition-colors">Task ID: {task.id.substring(0, 8)}</p>
                            <h3 className="text-lg font-bold text-on-surface uppercase tracking-tight leading-snug">{task.title}</h3>
                          </div>

                          <div className="flex items-center gap-12">
                            <div className="flex flex-col items-end w-32">
                              <span className="text-[9px] text-on-surface-variant font-black uppercase tracking-widest mb-1">Status</span>
                              <span className={cn(
                                "text-[10px] font-black uppercase tracking-[0.2em]",
                                task.status === 'confirmed' ? "text-green-500" : task.status === 'submitted' ? "text-blue-400" : "text-on-surface"
                              )}>
                                {task.status === 'confirmed' ? 'Verified' : task.status === 'submitted' ? 'Analyzing' : 'Ready'}
                              </span>
                            </div>

                            {task.status === 'pending' ? (
                              <button
                                onClick={() => setSubmitTaskModal(task)}
                                className="px-8 py-4 bg-on-surface text-surface font-black text-[10px] uppercase tracking-[0.2em] shadow-lg hover:scale-105 transition-all"
                              >
                                Execute Task
                              </button>
                            ) : (
                              <div className="px-8 py-4 border border-outline text-on-surface-variant text-[10px] font-black uppercase tracking-[0.2em] select-none cursor-not-allowed transition-colors">
                                Locked
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                      {(!members.find(m => m.user_id === currentUser?.id)?.tasks.length) && (
                        <div className="flex flex-col items-center justify-center p-20 glass-card bg-zinc-950 border-zinc-900 opacity-20 gap-4">
                          <span className="material-symbols-outlined text-4xl">inventory_2</span>
                          <p className="text-[10px] font-black uppercase tracking-[0.3em]">No objectives currently queued for your team</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'control' && isLeader && (
              <motion.div key="control" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-10">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  {/* Member Management */}
                  <div className="lg:col-span-8 flex flex-col gap-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-white text-[10px] font-bold uppercase tracking-[0.2em]">Team Members & Access</h3>
                      <span className="text-[10px] font-mono text-zinc-500">{members.length} Active Teams</span>
                    </div>
                    <div className="grid gap-3">
                      {members.map((member) => (
                        <div key={member.id} className="glass-card bg-zinc-950 p-6 border border-zinc-900 group hover:border-zinc-800 transition-all flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded border border-zinc-900 bg-zinc-950 overflow-hidden">
                              <img src={member.avatar} className="w-full h-full object-cover opacity-50 group-hover:opacity-100 transition-opacity" />
                            </div>
                            <div>
                              <h4 className="text-xs font-bold text-white uppercase tracking-wider">{member.name}</h4>
                              <p className="text-[9px] text-zinc-600 font-black uppercase mt-1 tracking-widest leading-none">{member.role}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-6">
                            <div className="text-right">
                              <button className="px-5 py-2 border border-zinc-900 text-white text-[9px] font-black uppercase tracking-widest hover:bg-zinc-900 transition-all">Adjust Role</button>
                            </div>
                            <button className="text-zinc-800 hover:text-white transition-colors">
                              <span className="material-symbols-outlined">more_vert</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Unassigned Tasks */}
                  <div className="lg:col-span-4 flex flex-col gap-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-white text-[10px] font-bold uppercase tracking-[0.2em]">Assignment Queue</h3>
                      <span className="text-[10px] font-mono text-zinc-500">{team?.tasks?.filter((t: any) => !t.assignee_id).length || 0} Pending</span>
                    </div>
                    <div className="flex flex-col gap-3">
                      {team?.tasks?.filter((t: any) => !t.assignee_id).length === 0 && (
                        <div className="p-10 bg-zinc-950 border border-zinc-900 rounded text-center opacity-30">
                          <p className="text-[10px] font-black uppercase tracking-widest">No unassigned tasks</p>
                        </div>
                      )}
                      {team?.tasks?.filter((t: any) => !t.assignee_id).map((task: any) => (
                        <div key={task.id} className="p-5 bg-zinc-950 border border-zinc-900 rounded group hover:border-zinc-700 transition-all flex flex-col gap-4">
                          <h4 className="text-[11px] font-bold text-white uppercase tracking-wider leading-relaxed">{task.title}</h4>
                          <select
                            onChange={async (e) => {
                              const mId = e.target.value;
                              if (!mId) return;
                              try {
                                await axios.put(`${API_BASE_URL}/api/tasks/${task.id}`, { assignee_id: mId });
                                fetchData();
                              } catch (err) { console.error("Assignment failed"); }
                            }}
                            className="w-full bg-zinc-900 border border-zinc-800 rounded px-4 py-2 text-[10px] font-bold text-white uppercase tracking-widest outline-none focus:border-white/20 appearance-none"
                          >
                            <option value="">Assign To...</option>
                            {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                          </select>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'intelligence' && (
              <motion.div key="intelligence" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-5xl mx-auto bg-surface-container rounded-3xl flex flex-col h-[600px] border border-outline overflow-hidden relative transition-all">
                <main className="flex flex-1 overflow-hidden">
                  <aside className="w-56 bg-surface border-r border-outline p-6 overflow-y-auto hidden md:block transition-colors">
                    <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-6">Communication</p>
                    <button
                      onClick={() => setSelectedRecipient(null)}
                      className={cn("flex items-center gap-3 w-full p-2 mb-4 rounded transition-all border border-transparent", !selectedRecipient ? "bg-on-surface/10 text-on-surface border-on-surface/20 shadow-sm" : "text-on-surface-variant hover:text-on-surface")}
                    >
                      <span className="material-symbols-outlined text-[16px]">hub</span>
                      <span className="text-[9px] font-bold uppercase">Team Feed</span>
                    </button>

                    <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-4">Direct Teams</p>
                    {chatRecipients.map((recipient: any) => (
                      <button
                        key={recipient.id}
                        onClick={() => setSelectedRecipient(selectedRecipient?.user_id === recipient.user_id ? null : recipient)}
                        className={cn("flex items-center gap-3 w-full p-2 mb-2 rounded transition-all", selectedRecipient?.user_id === recipient.user_id ? "bg-white text-black" : "text-zinc-400 hover:text-white")}
                      >
                        <img src={recipient.avatar || `https://i.pravatar.cc/150?u=${recipient.id}`} className="w-8 h-8 rounded-full" />
                        <span className="text-[9px] font-bold uppercase truncate">{recipient.name}</span>
                      </button>
                    ))}
                  </aside>
                  <section className="flex-1 flex flex-col overflow-hidden bg-black/40">
                    <div className="flex-1 p-6 overflow-y-auto scrollbar-hide flex flex-col gap-8">
                      {filteredMessages.map((msg) => (
                        <div key={msg.id} className="flex flex-col gap-2 group/msg">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <span className="text-[9px] font-bold text-white uppercase tracking-widest">{msg.sender?.full_name || 'Operator'}</span>
                              <span className="text-[8px] text-zinc-700 font-mono">{format(new Date(msg.created_at), 'HH:mm')}</span>
                            </div>
                            {msg.sender_id === currentUser?.id && (
                              <button
                                onClick={() => handleDeleteMessage(msg.id)}
                                className="opacity-0 group-hover/msg:opacity-100 text-zinc-600 hover:text-red-500 transition-all"
                              >
                                <span className="material-symbols-outlined text-[14px]">delete</span>
                              </button>
                            )}
                          </div>
                          <p className="text-xs text-zinc-400 leading-relaxed max-w-xl">{msg.content}</p>
                        </div>
                      ))}
                    </div>
                    <div className="p-6 border-t border-zinc-900 flex gap-4">
                      <input
                        value={msgInput}
                        onChange={(e) => setMsgInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                        placeholder="Transmit message team..."
                        className="flex-1 bg-zinc-900/50 border border-zinc-900 rounded-full px-6 py-3 text-xs text-white focus:outline-none focus:border-white/20"
                      />
                      <button onClick={handleSendMessage} className="p-3 rounded-full bg-white text-black hover:scale-105 transition-all"><SendIcon className="h-4 w-4" /></button>
                    </div>
                  </section>
                </main>
              </motion.div>
            )}

            {activeTab === 'schedule' && (
              <motion.div key="schedule" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-10 py-10 transition-colors">
                <button
                  onClick={() => alert("Initializing Neural Scheduler... Generating 7-month grid based on objective model.")}
                  className="px-10 py-4 bg-surface-container border border-outline rounded-full text-on-surface text-[10px] font-black uppercase tracking-[0.3em] hover:bg-surface hover:border-on-surface/20 transition-all flex items-center gap-3 shadow-lg"
                >
                  <span className="material-symbols-outlined text-lg">auto_awesome</span>
                  AI Generate Adaptive Timeline
                </button>

                {/* Advanced Glass Calendar Integration */}
                <div className="w-full max-w-[400px] bg-surface-container p-8 rounded-3xl border border-outline shadow-2xl relative overflow-hidden transition-all">
                  <div className="absolute top-0 right-0 p-4 opacity-5">
                    <span className="material-symbols-outlined text-[100px] text-on-surface-variant">calendar_today</span>
                  </div>
                  <header className="flex justify-between items-center mb-10 relative z-10 transition-colors">
                    <h2 className="text-2xl font-bold uppercase font-display tracking-tight text-on-surface">{format(currentMonth, "MMMM")}</h2>
                    <div className="flex gap-2">
                      <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-2 hover:bg-zinc-900 rounded-full text-zinc-600 transition-colors"><ChevronLeft /></button>
                      <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-2 hover:bg-zinc-900 rounded-full text-zinc-600 transition-colors"><ChevronRight /></button>
                    </div>
                  </header>
                  <div className="grid grid-cols-7 gap-2">
                    {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => <span key={d} className="text-center text-[10px] font-black text-zinc-800">{d}</span>)}
                    {(() => {
                      const days = [];
                      const start = startOfMonth(currentMonth).getDay();
                      for (let i = 0; i < start; i++) days.push(<div key={`empty-${i}`} />);
                      for (let i = 1; i <= getDaysInMonth(currentMonth); i++) {
                        const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), i);
                        const hasEvent = events.some(e => isSameDay(new Date(e.start_time), date));
                        days.push(
                          <button
                            key={i}
                            onClick={() => setCalendarSelectedDate(date)}
                            className={cn("h-10 w-10 flex flex-col items-center justify-center rounded-xl text-[11px] font-bold relative", isSameDay(date, calendarSelectedDate) ? "bg-white text-black" : "text-zinc-500 hover:text-white")}
                          >
                            {i}
                            {hasEvent && <span className="absolute bottom-1.5 w-1 h-1 bg-current rounded-full" />}
                          </button>
                        );
                      }
                      return days;
                    })()}
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'report' && (
              <motion.div key="report" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="max-w-4xl mx-auto flex flex-col gap-8">
                <div className="glass-card bg-zinc-950 p-10 border border-zinc-900 border-t-white/20">
                  <div className="flex justify-between items-start mb-12">
                    <div className="flex flex-col gap-2">
                      <h2 className="text-3xl font-bold text-white uppercase tracking-tighter">Mission Summary Report</h2>
                      <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest">Project Reference: {team?.invite_code}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-zinc-500 font-bold uppercase mb-1">Generated</p>
                      <p className="text-xs font-mono text-white">{format(new Date(), 'yyyy-MM-dd')}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-6 mb-12">
                    <div className="p-4 bg-zinc-900/50 border border-zinc-800 rounded">
                      <p className="text-[10px] text-zinc-600 font-black uppercase mb-1">Status</p>
                      <p className="text-sm font-bold text-white">{team?.progress === 100 ? 'COMPLETED' : 'OPERATIONAL'}</p>
                    </div>
                    <div className="p-4 bg-zinc-900/50 border border-zinc-800 rounded">
                      <p className="text-[10px] text-zinc-600 font-black uppercase mb-1">Efficiency</p>
                      <p className="text-sm font-bold text-white">{(team?.progress || 0) * 0.9 + 10}% Nominal</p>
                    </div>
                    <div className="p-4 bg-zinc-900/50 border border-zinc-800 rounded">
                      <p className="text-[10px] text-zinc-600 font-black uppercase mb-1">Teams</p>
                      <p className="text-sm font-bold text-white">{members.length} Verified</p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <h3 className="text-white text-[10px] font-bold uppercase tracking-widest border-b border-zinc-900 pb-2">Technical Objectives</h3>
                    {team?.tasks?.map((t: any) => (
                      <div key={t.id} className="flex items-center justify-between py-2">
                        <span className="text-xs text-zinc-400">{t.title}</span>
                        <span className={cn("text-[9px] font-black uppercase tracking-widest", t.status === 'confirmed' ? 'text-green-500' : 'text-zinc-700')}>
                          {t.status === 'confirmed' ? 'Verified' : 'Pending'}
                        </span>
                      </div>
                    ))}
                  </div>

                  <button className="w-full py-4 mt-12 border border-zinc-800 text-white text-[10px] font-black uppercase tracking-widest hover:bg-zinc-900 transition-all">Export Mission Blueprint</button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {reviewTask && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/95 p-6 animate-in fade-in zoom-in duration-300">
            <div className="glass-card bg-zinc-950 w-full max-w-xl p-10 border border-zinc-800 shadow-2xl">
              <h2 className="text-2xl font-bold text-white uppercase tracking-tighter mb-8 flex items-center gap-3">
                <span className="w-2 h-6 bg-white"></span>
                Review Team Output
              </h2>
              <div className="space-y-6">
                <div className="p-6 bg-zinc-900/40 border border-zinc-900 rounded flex flex-col gap-4">
                  <div>
                    <p className="text-[10px] text-zinc-600 font-bold uppercase mb-2">Subject: {reviewTask.member.name}</p>
                    <p className="text-white text-xs leading-relaxed">{reviewTask.task.evidence?.text || (reviewTask.task as any).submission_text || 'No description provided.'}</p>
                  </div>
                  {(reviewTask.task as any).evidence_url && (
                    <div className="pt-4 border-t border-zinc-800">
                      <p className="text-[10px] text-zinc-600 font-bold uppercase mb-2">Evidence Link</p>
                      <a href={(reviewTask.task as any).evidence_url} target="_blank" rel="noopener noreferrer" className="text-white text-[10px] font-bold underline hover:text-zinc-300 break-all">
                        {(reviewTask.task as any).evidence_url}
                      </a>
                    </div>
                  )}
                </div>
                <div className="flex gap-4 pt-4">
                  <button onClick={() => handleUpdateTask(reviewTask.task.id, 'confirmed')} className="flex-1 py-4 bg-white text-black font-black text-[10px] uppercase tracking-[0.2em] hover:bg-zinc-200 shadow-lg shadow-white/10">Confirm and Verify</button>
                  <button onClick={() => setReviewTask(null)} className="px-8 border border-zinc-800 text-zinc-600 font-black text-[10px] uppercase hover:text-white transition-colors">Reject Access</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {submitTaskModal && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/95 p-6 animate-in fade-in zoom-in duration-300">
            <div className="glass-card bg-zinc-950 w-full max-w-xl p-10 border border-zinc-800 shadow-2xl">
              <div className="absolute top-0 right-0 p-4">
                <button onClick={() => setSubmitTaskModal(null)} className="text-zinc-500 hover:text-white transition-colors">
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
              <h2 className="text-2xl font-bold text-white uppercase tracking-tighter mb-8 flex items-center gap-3">
                <span className="w-2 h-6 bg-white"></span>
                Submit Workspace Output
              </h2>
              <div className="space-y-6">
                <div>
                  <label className="text-[10px] font-bold text-zinc-700 uppercase tracking-[0.2em] block mb-4">Supporting Evidence (Link or Image URL)</label>
                  <input
                    onChange={(e) => (window as any)._evidenceUrl = e.target.value}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded p-4 text-xs text-white focus:outline-none focus:border-white/50 mb-6"
                    placeholder="https://github.com/... or https://image-host.com/..."
                  />

                  <label className="text-[10px] font-bold text-zinc-700 uppercase tracking-[0.2em] block mb-4">Technical Output Log</label>
                  <textarea
                    value={submissionText}
                    onChange={(e) => setSubmissionText(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded p-4 text-xs text-white h-32 focus:outline-none focus:border-white/50"
                    placeholder="Describe your technical contributions and methodology..."
                  />
                </div>
                <div className="flex gap-4 pt-4">
                  <button onClick={() => {
                    const evidenceUrl = (window as any)._evidenceUrl;
                    handleUpdateTask(submitTaskModal.id, 'submitted', submissionText, evidenceUrl);
                  }} className="flex-1 py-4 bg-white text-black font-black text-[10px] uppercase tracking-[0.2em] hover:bg-zinc-200 shadow-lg shadow-white/10">Transmit for Verification</button>
                  <button onClick={() => setSubmitTaskModal(null)} className="px-8 border border-zinc-800 text-zinc-600 font-black text-[10px] uppercase hover:text-white transition-colors">Abort</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default CommandCenter;
