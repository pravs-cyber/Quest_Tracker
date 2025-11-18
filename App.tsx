
import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { GoalView } from './components/GoalView';
import { CreateGoalModal } from './components/CreateGoalModal';
import { BigGoal } from './types';
import { Menu } from 'lucide-react';

const App: React.FC = () => {
  // Load from local storage if available
  const [goals, setGoals] = useState<BigGoal[]>(() => {
    const saved = localStorage.getItem('questmap_goals');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [activeGoalId, setActiveGoalId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Persist to local storage
  useEffect(() => {
    localStorage.setItem('questmap_goals', JSON.stringify(goals));
  }, [goals]);

  // Set initial active goal if exists and none selected
  useEffect(() => {
    if (goals.length > 0 && !activeGoalId) {
      setActiveGoalId(goals[0].id);
    }
  }, [goals, activeGoalId]);

  const handleCreateGoal = (newGoal: BigGoal) => {
    setGoals(prev => [...prev, newGoal]);
    setActiveGoalId(newGoal.id);
    setIsModalOpen(false);
  };

  const handleUpdateGoal = (updatedGoal: BigGoal) => {
    setGoals(prev => prev.map(g => g.id === updatedGoal.id ? updatedGoal : g));
  };

  const activeGoal = goals.find(g => g.id === activeGoalId);

  return (
    <div className="flex h-screen w-full bg-slate-100 overflow-hidden font-sans text-slate-900">
      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      {/* Desktop: Position relative, Width controlled by prop */}
      {/* Mobile: Fixed, full height, translate controlled by state */}
      <div className={`
        fixed inset-y-0 left-0 z-50 bg-white shadow-xl md:shadow-none transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <Sidebar 
          goals={goals}
          activeGoalId={activeGoalId}
          onSelectGoal={(id) => {
            setActiveGoalId(id);
            setIsMobileMenuOpen(false);
          }}
          onAddGoal={() => {
            setIsModalOpen(true);
            setIsMobileMenuOpen(false);
          }}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        />
      </div>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full relative p-4 md:p-6 transition-all duration-300">
        {/* Mobile Header */}
        <div className="md:hidden flex items-center justify-between mb-4">
          <button 
            onClick={() => setIsMobileMenuOpen(true)}
            className="p-2 bg-white rounded-lg shadow-sm text-slate-600"
          >
            <Menu size={24} />
          </button>
          <span className="font-serif font-bold text-lg text-slate-800">QuestMap</span>
          <div className="w-10"></div> {/* Spacer */}
        </div>

        {activeGoal ? (
          <div className="flex-1 h-full overflow-hidden">
             <GoalView 
               goal={activeGoal} 
               onUpdateGoal={handleUpdateGoal}
               onBack={() => setIsMobileMenuOpen(true)} 
             />
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-slate-500">
            <div className="w-24 h-24 bg-slate-200 rounded-full flex items-center justify-center mb-6">
              <Menu size={48} className="text-slate-400" />
            </div>
            <h2 className="text-2xl font-serif font-bold text-slate-700 mb-2">No Quests Selected</h2>
            <p className="max-w-md mx-auto mb-8">Your journey begins with a single step. Create a new quest or select one from the map list.</p>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="px-6 py-3 bg-slate-900 text-white rounded-xl font-semibold shadow-lg hover:scale-105 transition-transform"
            >
              Create New Quest
            </button>
          </div>
        )}
      </main>

      {/* Create Goal Modal */}
      {isModalOpen && (
        <CreateGoalModal 
          onClose={() => setIsModalOpen(false)}
          onCreate={handleCreateGoal}
        />
      )}
    </div>
  );
};

export default App;
