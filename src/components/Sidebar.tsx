
import React, { useState } from 'react';
import { BigGoal } from '../types';
import { Plus, ChevronRight, Compass, ChevronLeft, Layers, List } from 'lucide-react';

interface SidebarProps {
  goals: BigGoal[];
  activeGoalId: string | null;
  onSelectGoal: (id: string) => void;
  onAddGoal: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  className?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  goals, 
  activeGoalId, 
  onSelectGoal, 
  onAddGoal, 
  isCollapsed,
  onToggleCollapse,
  className = '' 
}) => {
  const [isClustered, setIsClustered] = useState(false);

  // Group goals if clustered
  const groupedGoals: Record<string, BigGoal[]> = isClustered 
    ? goals.reduce((acc, goal) => {
        const status = (goal.status || 'active').toUpperCase();
        if (!acc[status]) acc[status] = [];
        acc[status].push(goal);
        return acc;
      }, {} as Record<string, BigGoal[]>)
    : { 'ALL QUESTS': goals };

  const renderGoalItem = (goal: BigGoal) => {
    const isActive = goal.id === activeGoalId;
    const gradient = goal.themeGradient || 'linear-gradient(to right, #94a3b8, #cbd5e1)';

    return (
      <button
        key={goal.id}
        onClick={() => onSelectGoal(goal.id)}
        className={`
          w-full flex items-center rounded-xl transition-all duration-200 group relative overflow-hidden
          ${isCollapsed ? 'justify-center p-2' : 'justify-between p-3'}
          ${isActive ? `bg-slate-50 shadow-sm` : 'hover:bg-slate-50'}
        `}
        title={goal.title}
      >
        {isActive && !isCollapsed && (
           <div className="absolute left-0 top-0 bottom-0 w-1" style={{ background: gradient }}></div>
        )}
        
        <div className={`flex items-center gap-3 ${isCollapsed ? 'justify-center' : 'w-full pl-2'}`}>
          <div 
             className={`rounded-full flex-shrink-0 shadow-sm ring-1 ring-black/5 transition-all
               ${isCollapsed ? 'w-8 h-8' : 'w-4 h-4'}
             `}
             style={{ background: gradient }}
          />
          
          {!isCollapsed && (
            <div className="text-left truncate flex-1">
              <p className={`font-medium truncate text-sm ${isActive ? 'text-slate-900' : 'text-slate-600'}`}>
                {goal.title}
              </p>
            </div>
          )}
        </div>
        
        {isActive && !isCollapsed && <ChevronRight size={14} className="text-slate-400" />}
      </button>
    );
  };

  return (
    <div className={`flex flex-col h-full bg-white border-r border-slate-200 transition-all duration-300 ease-in-out ${className} ${isCollapsed ? 'w-20' : 'w-72'}`}>
      {/* Header */}
      <div className="p-4 border-b border-slate-100 flex items-center justify-between">
        {!isCollapsed && (
          <div className="flex items-center gap-2 text-slate-900">
            <div className="p-1.5 bg-amber-100 rounded-lg text-amber-600">
              <Compass size={20} />
            </div>
            <span className="font-serif font-bold text-lg truncate">QuestMap</span>
          </div>
        )}
        
        {isCollapsed && (
          <div className="w-full flex justify-center mb-4">
            <div className="p-2 bg-amber-100 rounded-lg text-amber-600">
               <Compass size={24} />
            </div>
          </div>
        )}

        <button 
          onClick={onToggleCollapse}
          className={`p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors ${isCollapsed ? 'mx-auto' : ''}`}
        >
          {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </button>
      </div>

      {/* Toolbar (Add & Cluster) */}
      <div className="p-4 flex gap-2">
        <button 
          onClick={onAddGoal}
          className={`
            flex-1 flex items-center justify-center gap-2 bg-slate-900 text-white rounded-xl font-medium hover:bg-slate-800 hover:shadow-md transition-all active:scale-95
            ${isCollapsed ? 'w-12 h-12 p-0' : 'py-3 px-4'}
          `}
          title="New Quest"
        >
          <Plus size={isCollapsed ? 24 : 18} />
          {!isCollapsed && <span>New</span>}
        </button>

        {!isCollapsed && (
          <button 
            onClick={() => setIsClustered(!isClustered)}
            className={`
              p-3 rounded-xl border transition-all
              ${isClustered ? 'bg-blue-50 border-blue-200 text-blue-600' : 'bg-white border-slate-200 text-slate-400 hover:text-slate-600 hover:bg-slate-50'}
            `}
            title={isClustered ? "Show List" : "Cluster Quests"}
          >
            {isClustered ? <List size={18} /> : <Layers size={18} />}
          </button>
        )}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-3 custom-scrollbar">
        {goals.length === 0 && !isCollapsed && (
          <div className="text-center p-4 text-slate-400 text-sm italic">
            No quests found. <br/> Start one above!
          </div>
        )}

        {Object.entries(groupedGoals).map(([groupName, groupGoals]) => {
           if (groupGoals.length === 0) return null;
           return (
             <div key={groupName} className="mb-6">
               {!isCollapsed && isClustered && (
                 <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-2 mb-2 flex items-center gap-2">
                   {groupName}
                   <span className="bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full text-[10px]">{groupGoals.length}</span>
                 </h3>
               )}
               <div className="space-y-2">
                 {groupGoals.map(renderGoalItem)}
               </div>
             </div>
           );
        })}
      </div>
      
      {!isCollapsed && (
        <div className="p-4 border-t border-slate-100 text-center">
          <p className="text-[10px] text-slate-400 uppercase tracking-wider">
            AI Powered
          </p>
        </div>
      )}
    </div>
  );
};
