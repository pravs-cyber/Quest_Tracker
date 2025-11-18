
import React, { useState } from 'react';
import { BigGoal, GoalStep, MapStyle } from '../types';
import { TreasureMap } from './TreasureMap';
import { CheckCircle, ArrowLeft, Wand2, Pencil, Sparkles, Wrench, Loader2 } from 'lucide-react';
import { generateNextStep, suggestTools } from '../services/geminiService';

interface GoalViewProps {
  goal: BigGoal;
  onUpdateGoal: (updatedGoal: BigGoal) => void;
  onBack: () => void;
}

export const GoalView: React.FC<GoalViewProps> = ({ goal, onUpdateGoal, onBack }) => {
  const [selectedStep, setSelectedStep] = useState<GoalStep | null>(null);
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [showNextStepOptions, setShowNextStepOptions] = useState(false);
  
  const [isManualEntry, setIsManualEntry] = useState(false);
  const [isSubmittingManual, setIsSubmittingManual] = useState(false);
  const [manualTitle, setManualTitle] = useState('');
  const [manualDesc, setManualDesc] = useState('');
  const [manualTools, setManualTools] = useState('');

  const [error, setError] = useState<string | null>(null);

  const handleStepClick = (step: GoalStep) => {
    setSelectedStep(step);
  };

  const handleCompleteStep = async (stepId: string) => {
    const steps = goal.steps || [];
    const updatedSteps = steps.map(s => 
      s.id === stepId ? { ...s, isCompleted: true } : s
    );
    const updatedGoal = { ...goal, steps: updatedSteps };
    onUpdateGoal(updatedGoal);
    
    const lastStep = updatedSteps.length > 0 ? updatedSteps[updatedSteps.length - 1] : null;
    if (lastStep && lastStep.id === stepId) {
      setShowNextStepOptions(true);
    } else {
       setSelectedStep(null);
    }
  };

  const handleGenerateNext = async () => {
    setIsGenerating(true);
    setError(null);
    setShowNextStepOptions(false); 
    setSelectedStep(null);

    try {
      const nextStepData = await generateNextStep(goal);
      const newStep: GoalStep = {
        id: Date.now().toString(),
        ...nextStepData,
        isCompleted: false,
        createdAt: Date.now(),
      };
      
      onUpdateGoal({
        ...goal,
        steps: [...(goal.steps || []), newStep]
      });
    } catch (e) {
      console.error(e);
      setError("Failed to find the next clue. Check your connection.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleManualNext = () => {
    setIsManualEntry(true);
  };

  const submitManualNext = async () => {
    if (!manualTitle || !manualDesc) return;
    
    setIsSubmittingManual(true);
    
    try {
      let toolsList = manualTools.split(',').map(t => t.trim()).filter(t => t.length > 0);

      // AI Auto-suggest tools if empty
      if (toolsList.length === 0) {
        toolsList = await suggestTools(manualTitle, manualDesc);
      }

      const newStep: GoalStep = {
        id: Date.now().toString(),
        title: manualTitle,
        description: manualDesc,
        motivation: "You paved this part of the path yourself.",
        suggestedTools: toolsList,
        isCompleted: false,
        createdAt: Date.now(),
      };

      onUpdateGoal({
        ...goal,
        steps: [...(goal.steps || []), newStep]
      });

      setManualTitle('');
      setManualDesc('');
      setManualTools('');
      setIsManualEntry(false);
      setShowNextStepOptions(false);
      setSelectedStep(null);
    } catch (e) {
      setError("Could not add step. Please try again.");
    } finally {
      setIsSubmittingManual(false);
    }
  };

  // Defensive checks for legacy data
  const themeGradient = goal?.themeGradient || 'linear-gradient(to right, #3b82f6, #8b5cf6)';
  const mapStyle = goal?.mapStyle || 'classic';
  const safeSteps = goal?.steps || [];

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-100">
      {/* Simple Header */}
      <div className="absolute top-0 left-0 z-20 w-full p-4 pointer-events-none flex justify-between items-start">
         <div className="pointer-events-auto">
            <button onClick={onBack} className="md:hidden p-2 bg-white shadow-sm rounded-full text-slate-700 border border-slate-100 mb-2 hover:bg-slate-50">
              <ArrowLeft size={20} />
            </button>
            <div className="bg-white p-4 rounded-2xl shadow-md border border-slate-100 max-w-md">
              <div className="h-1 w-full rounded mb-2" style={{ background: themeGradient }}></div>
              <h1 className="text-xl font-serif font-bold text-slate-900">{goal?.title}</h1>
              <p className="text-sm text-slate-600 line-clamp-2">{goal?.description}</p>
            </div>
         </div>
         
         {/* Error Toast */}
         {error && (
            <div className="bg-red-50 text-red-800 px-4 py-2 rounded-lg text-sm shadow-md animate-in fade-in pointer-events-auto border border-red-100">
              {error}
            </div>
         )}
      </div>

      {/* Main Map Area */}
      <div className="flex-1 relative overflow-hidden bg-slate-50">
        <TreasureMap 
          steps={safeSteps} 
          themeGradient={themeGradient} 
          mapStyle={mapStyle as MapStyle}
          backgroundImage={goal?.backgroundImage}
          onStepClick={handleStepClick}
          onCompleteStep={handleCompleteStep}
          isGenerating={isGenerating}
        />
      </div>

      {/* Interaction Modal */}
      {(selectedStep || showNextStepOptions) && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div 
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden transform transition-all scale-100 border border-slate-200"
            onClick={(e) => e.stopPropagation()}
          >
            
            {showNextStepOptions && !isManualEntry && (
              <div className="p-8 text-center">
                <div className={`mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4 text-green-600`}>
                  <CheckCircle size={32} />
                </div>
                <h3 className="text-2xl font-serif font-bold text-slate-900 mb-2">Step Completed!</h3>
                <p className="text-slate-600 mb-8">The path ahead is hidden in fog. How will you proceed?</p>
                
                <div className="space-y-3">
                  <button 
                    onClick={handleGenerateNext}
                    className={`w-full py-4 px-6 rounded-xl text-white font-semibold shadow-lg hover:opacity-90 transition-all flex items-center justify-center gap-3`}
                    style={{ background: themeGradient }}
                  >
                    <Wand2 size={20} />
                    <div>
                      <div className="text-sm font-bold">Consult the Map</div>
                      <div className="text-[10px] opacity-90 font-normal uppercase tracking-wide">Let AI Generate Step</div>
                    </div>
                  </button>

                  <button 
                    onClick={handleManualNext}
                    className="w-full py-4 px-6 rounded-xl bg-white border-2 border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 transition-all flex items-center justify-center gap-3"
                  >
                    <Pencil size={20} />
                    <div>
                      <div className="text-sm font-bold">Chart the Path</div>
                      <div className="text-[10px] opacity-70 font-normal uppercase tracking-wide">Write Step Manually</div>
                    </div>
                  </button>
                </div>
                <button onClick={() => {setShowNextStepOptions(false); setSelectedStep(null);}} className="mt-6 text-sm text-slate-500 hover:text-slate-700">
                  Close for now
                </button>
              </div>
            )}

            {showNextStepOptions && isManualEntry && (
               <div className="p-8">
                  <h3 className="text-xl font-serif font-bold text-slate-900 mb-4">Chart Your Own Path</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
                      <input 
                        className="w-full p-3 bg-white border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 placeholder:text-slate-400"
                        placeholder="Next Step Title"
                        value={manualTitle}
                        onChange={e => setManualTitle(e.target.value)}
                        autoFocus
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                      <textarea 
                        className="w-full p-3 bg-white border border-slate-300 rounded-lg h-24 outline-none focus:ring-2 focus:ring-blue-500 resize-none text-slate-900 placeholder:text-slate-400"
                        placeholder="What do you need to do?"
                        value={manualDesc}
                        onChange={e => setManualDesc(e.target.value)}
                      />
                    </div>
                    <div>
                       <label className="block text-sm font-medium text-slate-700 mb-1">Suggested Tools <span className="text-slate-400 font-normal">(optional)</span></label>
                       <input 
                        className="w-full p-3 bg-white border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 placeholder:text-slate-400"
                        placeholder={manualTools ? "e.g. Hammer, Nails" : "Leave empty to auto-suggest"}
                        value={manualTools}
                        onChange={e => setManualTools(e.target.value)}
                      />
                    </div>

                    <div className="flex gap-2 mt-4">
                       <button onClick={() => setIsManualEntry(false)} className="flex-1 py-2 text-slate-600 hover:bg-slate-100 rounded-lg border border-slate-200 bg-white">Back</button>
                       <button 
                        onClick={submitManualNext} 
                        disabled={!manualTitle || !manualDesc || isSubmittingManual}
                        className="flex-1 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 disabled:opacity-50 font-medium flex items-center justify-center gap-2"
                       >
                         {isSubmittingManual ? <Loader2 className="animate-spin" size={16}/> : 'Confirm Step'}
                       </button>
                    </div>
                  </div>
               </div>
            )}

            {!showNextStepOptions && selectedStep && (
              <>
                <div className="h-2 w-full" style={{ background: themeGradient }}></div>
                <div className="p-8">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-2xl font-bold text-slate-900 font-serif">{selectedStep.title}</h3>
                    <button onClick={() => setSelectedStep(null)} className="text-slate-400 hover:text-slate-600 p-1">
                      ✕
                    </button>
                  </div>
                  
                  <div className="mb-6">
                    <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">Mission</h4>
                    <p className="text-slate-800 leading-relaxed text-lg">
                      {selectedStep.description}
                    </p>
                  </div>

                  {selectedStep.suggestedTools && selectedStep.suggestedTools.length > 0 && (
                    <div className="mb-6">
                      <h4 className="text-xs font-bold text-slate-500 uppercase mb-2 flex items-center gap-1">
                        <Wrench size={12} /> Suggested Tools
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedStep.suggestedTools.map((tool, i) => (
                          <span key={i} className="px-2 py-1 bg-slate-100 text-slate-700 rounded-md text-sm font-medium border border-slate-200">
                            {tool}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedStep.motivation && (
                    <div className={`mb-8 p-4 rounded-xl bg-amber-50 border border-amber-100 flex gap-3`}>
                      <Sparkles className={`flex-shrink-0 text-amber-500 mt-0.5`} size={20} />
                      <p className={`text-sm italic text-amber-900`}>
                        "{selectedStep.motivation}"
                      </p>
                    </div>
                  )}

                  <div className="flex gap-3">
                    {!selectedStep.isCompleted ? (
                      <button 
                        onClick={() => handleCompleteStep(selectedStep.id)}
                        className={`flex-1 py-3 px-6 rounded-xl text-white font-semibold shadow-lg hover:opacity-90 hover:shadow-xl transition-all flex items-center justify-center gap-2`}
                        style={{ background: themeGradient }}
                      >
                        <CheckCircle size={20} />
                        Complete Step
                      </button>
                    ) : (
                      <div className="flex-1 py-3 px-6 rounded-xl bg-green-50 text-green-700 font-semibold text-center border border-green-200 flex items-center justify-center gap-2">
                        <CheckCircle size={18} /> Completed
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
