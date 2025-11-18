
import React, { useState, useEffect } from 'react';
import { generateFirstStep, generateMapBackground, suggestGoalTheme } from '../services/geminiService';
import { BigGoal, MapStyle } from '../types';
import { Loader2, Wand2, Pencil, Map as MapIcon, Scroll, Moon, Binary, Trees, RefreshCw, Image as ImageIcon, Palette, Sparkles } from 'lucide-react';

interface CreateGoalModalProps {
  onClose: () => void;
  onCreate: (goal: BigGoal) => void;
}

const STYLES: { id: MapStyle; label: string; icon: React.ElementType }[] = [
  { id: 'classic', label: 'Classic', icon: Scroll },
  { id: 'midnight', label: 'Dark', icon: Moon },
  { id: 'blueprint', label: 'Blueprint', icon: Binary },
  { id: 'forest', label: 'Forest', icon: Trees },
];

const GRADIENT_PRESETS = [
  'linear-gradient(to right, #3b82f6, #8b5cf6)', // Blue -> Purple
  'linear-gradient(to right, #10b981, #3b82f6)', // Green -> Blue
  'linear-gradient(to right, #f59e0b, #ef4444)', // Amber -> Red
  'linear-gradient(to right, #ec4899, #8b5cf6)', // Pink -> Purple
  'linear-gradient(to right, #6366f1, #ec4899)', // Indigo -> Pink
  'linear-gradient(to right, #14b8a6, #06b6d4)', // Teal -> Cyan
];

export const CreateGoalModal: React.FC<CreateGoalModalProps> = ({ onClose, onCreate }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedStyle, setSelectedStyle] = useState<MapStyle>('classic');
  
  // Gradient State
  const [customGradient, setCustomGradient] = useState(GRADIENT_PRESETS[0]);
  const [color1, setColor1] = useState('#3b82f6');
  const [color2, setColor2] = useState('#8b5cf6');
  const [useCustomColors, setUseCustomColors] = useState(false);
  const [isCustomGradientActive, setIsCustomGradientActive] = useState(false);

  // Map Background State
  const [useAiBackground, setUseAiBackground] = useState(false);
  const [mapPrompt, setMapPrompt] = useState('');
  const [generatedMapImage, setGeneratedMapImage] = useState<string | undefined>(undefined);
  const [isGeneratingMap, setIsGeneratingMap] = useState(false);
  const [isSuggestingTheme, setIsSuggestingTheme] = useState(false);
  
  const [isManual, setIsManual] = useState(false);
  const [manualStepTitle, setManualStepTitle] = useState('');
  const [manualStepDesc, setManualStepDesc] = useState('');
  const [manualTools, setManualTools] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (useCustomColors) {
      const newGrad = `linear-gradient(to right, ${color1}, ${color2})`;
      setCustomGradient(newGrad);
      setIsCustomGradientActive(true);
    }
  }, [color1, color2, useCustomColors]);

  useEffect(() => {
    // Auto-fill prompt when title changes if empty
    if (title && !mapPrompt) {
      setMapPrompt(`A fantasy map for a quest called ${title}`);
    }
  }, [title]);

  const handlePresetClick = (grad: string) => {
    setCustomGradient(grad);
    setUseCustomColors(false);
    setIsCustomGradientActive(false);
    
    // Extract hex codes to update the custom pickers
    // This ensures if the user switches to custom, they start from the selected preset
    const matches = grad.match(/#[a-fA-F0-9]{6}/g);
    if (matches && matches.length >= 2) {
      setColor1(matches[0]);
      setColor2(matches[1]);
    }
  };

  const handleSuggestTheme = async () => {
    if (!title || !description) return;
    setIsSuggestingTheme(true);
    try {
      const theme = await suggestGoalTheme(title, description);
      setCustomGradient(theme.gradient);
      setUseCustomColors(false); // Use the raw gradient string from AI
      setIsCustomGradientActive(true); // Mark as "custom" so UI highlighting works
      setSelectedStyle(theme.mapStyle as MapStyle);
      
      // Try to extract colors for the picker just in case user wants to tweak
      const hexMatches = theme.gradient.match(/#[a-fA-F0-9]{6}/g);
      if (hexMatches && hexMatches.length >= 2) {
        setColor1(hexMatches[0]);
        setColor2(hexMatches[1]);
      }
    } catch (e) {
      // Silent fail
    } finally {
      setIsSuggestingTheme(false);
    }
  };

  const handleGenerateBackground = async () => {
    if (!mapPrompt) return;
    setIsGeneratingMap(true);
    setError(null);
    try {
      const bg = await generateMapBackground(mapPrompt);
      setGeneratedMapImage(bg);
    } catch (e) {
      setError("Failed to generate map background.");
    } finally {
      setIsGeneratingMap(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description) return;
    if (isManual && (!manualStepTitle || !manualStepDesc)) return;

    setIsLoading(true);
    setError(null);

    try {
      let firstStepData;

      if (isManual) {
        firstStepData = {
          title: manualStepTitle,
          description: manualStepDesc,
          suggestedTools: manualTools.split(',').map(t => t.trim()).filter(Boolean),
          motivation: "Your journey begins with a step you chose yourself!"
        };
      } else {
        firstStepData = await generateFirstStep(title, description);
      }
      
      const newGoal: BigGoal = {
        id: Date.now().toString(),
        title,
        description,
        status: 'active',
        createdAt: Date.now(),
        themeGradient: customGradient,
        mapStyle: selectedStyle,
        backgroundImage: useAiBackground ? generatedMapImage : undefined,
        steps: [
          {
            id: Date.now().toString(),
            ...firstStepData,
            isCompleted: false,
            createdAt: Date.now(),
          }
        ]
      };

      onCreate(newGoal);
    } catch (err) {
      console.error(err);
      setError("The mapmaker couldn't chart your course. Check your connection or try manual entry.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto py-8">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden m-4 relative flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex-shrink-0">
          <h2 className="text-2xl font-serif font-bold text-slate-800">Start a New Quest</h2>
          <p className="text-slate-500 text-sm mt-1">Define your goal and prepare the map.</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto custom-scrollbar">
          {/* Basic Info */}
          <div className="space-y-4">
            <div className="space-y-1">
              <div className="flex justify-between">
                <label className="block text-sm font-medium text-slate-700">Quest Title</label>
                {(title && description) && (
                  <button 
                    type="button" 
                    onClick={handleSuggestTheme} 
                    disabled={isSuggestingTheme}
                    className="text-xs flex items-center gap-1 text-indigo-600 hover:text-indigo-800 transition-colors font-semibold"
                  >
                    {isSuggestingTheme ? <Loader2 size={12} className="animate-spin"/> : <Sparkles size={12}/>}
                    Magic Theme
                  </button>
                )}
              </div>
              <input 
                type="text" 
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="w-full px-4 py-2.5 bg-white rounded-lg border border-slate-300 text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none shadow-sm"
                placeholder="e.g., Learn Guitar"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="block text-sm font-medium text-slate-700">Description</label>
              <textarea 
                value={description}
                onChange={e => setDescription(e.target.value)}
                className="w-full px-4 py-2.5 bg-white rounded-lg border border-slate-300 text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none shadow-sm h-24 resize-none"
                placeholder="What is the ultimate treasure you seek?"
                required
              />
            </div>
          </div>

          {/* MOVED: Step Strategy to Top */}
          <div className="pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between mb-3">
               <label className="text-sm font-medium text-slate-700">First Step Strategy</label>
               <div className="flex bg-slate-100 rounded-lg p-1 border border-slate-200">
                 <button
                   type="button"
                   onClick={() => setIsManual(false)}
                   className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${!isManual ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
                 >
                   AI Guide
                 </button>
                 <button
                   type="button"
                   onClick={() => setIsManual(true)}
                   className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${isManual ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
                 >
                   Manual
                 </button>
               </div>
            </div>

            {isManual ? (
              <div className="space-y-3 animate-in slide-in-from-top-2 duration-200 bg-slate-50 p-3 rounded-lg border border-slate-200">
                <input 
                  type="text" 
                  value={manualStepTitle}
                  onChange={e => setManualStepTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-white rounded-md border border-slate-300 text-sm text-slate-900 placeholder:text-slate-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder="Step 1 Title"
                  required={isManual}
                />
                <textarea 
                  value={manualStepDesc}
                  onChange={e => setManualStepDesc(e.target.value)}
                  className="w-full px-3 py-2 bg-white rounded-md border border-slate-300 text-sm text-slate-900 placeholder:text-slate-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none h-16 resize-none"
                  placeholder="Step 1 Instructions..."
                  required={isManual}
                />
                <input 
                  type="text" 
                  value={manualTools}
                  onChange={e => setManualTools(e.target.value)}
                  className="w-full px-3 py-2 bg-white rounded-md border border-slate-300 text-sm text-slate-900 placeholder:text-slate-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder="Tools needed (comma separated)"
                />
              </div>
            ) : (
              <div className="text-xs text-slate-500 italic bg-blue-50 p-3 rounded-lg text-center border border-blue-100">
                The AI will analyze your goal and create the first actionable step for you.
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 border-t border-slate-100">
             {/* Visual Style - Left Col */}
             <div className="space-y-4">
                <label className="block text-sm font-medium text-slate-700 flex items-center gap-2">
                  <Palette size={16} />
                  Map Theme
                </label>
                
                {/* Gradient Picker */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="flex gap-2 mb-3 overflow-x-auto pb-2 custom-scrollbar">
                    {GRADIENT_PRESETS.map((grad, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => handlePresetClick(grad)}
                        className={`w-8 h-8 rounded-full flex-shrink-0 ring-offset-1 transition-all shadow-sm ${customGradient === grad && !isCustomGradientActive ? 'ring-2 ring-slate-600 scale-110' : 'hover:scale-105'}`}
                        style={{ background: grad }}
                      />
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold uppercase ${isCustomGradientActive ? 'text-indigo-600' : 'text-slate-500'}`}>Custom</span>
                    <input type="color" value={color1} onChange={e => { setColor1(e.target.value); setUseCustomColors(true); }} className="w-8 h-8 rounded cursor-pointer border-0 p-0 bg-transparent" />
                    <input type="color" value={color2} onChange={e => { setColor2(e.target.value); setUseCustomColors(true); }} className="w-8 h-8 rounded cursor-pointer border-0 p-0 bg-transparent" />
                    <div className={`flex-1 h-8 rounded-md shadow-inner transition-all ${isCustomGradientActive ? 'ring-2 ring-indigo-500 ring-offset-1' : ''}`} style={{ background: `linear-gradient(to right, ${color1}, ${color2})` }}></div>
                  </div>
                </div>

                {/* UI Mode Fallback */}
                 <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-2">UI Mode Style</label>
                    <div className="grid grid-cols-4 gap-2">
                      {STYLES.map(style => {
                        const Icon = style.icon;
                        return (
                          <button
                            key={style.id}
                            type="button"
                            onClick={() => setSelectedStyle(style.id)}
                            className={`flex flex-col items-center justify-center p-2 rounded-lg border transition-all ${
                              selectedStyle === style.id 
                                ? 'bg-slate-800 text-white border-slate-800 shadow-md' 
                                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                            }`}
                          >
                            <Icon size={16} className="mb-1" />
                            <span className="text-[9px] uppercase font-bold">{style.label}</span>
                          </button>
                        );
                      })}
                    </div>
                 </div>
             </div>

             {/* Background - Right Col */}
             <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <label className="block text-sm font-medium text-slate-700 flex items-center gap-2">
                    <ImageIcon size={16} />
                    Map Background
                  </label>
                  <div className="flex bg-slate-100 rounded-md p-0.5 border border-slate-200">
                     <button type="button" onClick={() => setUseAiBackground(false)} className={`px-2 py-0.5 text-xs font-medium rounded transition-all ${!useAiBackground ? 'bg-white shadow text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}>Preset</button>
                     <button type="button" onClick={() => setUseAiBackground(true)} className={`px-2 py-0.5 text-xs font-medium rounded transition-all ${useAiBackground ? 'bg-white shadow text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}>AI Gen</button>
                  </div>
                </div>

                {useAiBackground ? (
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="flex gap-2 mb-2">
                      <input 
                        value={mapPrompt}
                        onChange={(e) => setMapPrompt(e.target.value)}
                        className="flex-1 text-xs p-2 bg-white border border-slate-300 rounded text-slate-900 focus:border-indigo-500 outline-none"
                        placeholder="Describe the terrain..." 
                      />
                      <button 
                        type="button"
                        onClick={handleGenerateBackground}
                        disabled={isGeneratingMap || !mapPrompt}
                        className="bg-indigo-600 text-white p-2 rounded hover:bg-indigo-700 disabled:opacity-50 shadow-sm"
                      >
                        {isGeneratingMap ? <Loader2 size={14} className="animate-spin" /> : <Wand2 size={14} />}
                      </button>
                    </div>
                    <div className="w-full aspect-[4/3] bg-slate-200 rounded-lg overflow-hidden flex items-center justify-center relative group shadow-inner">
                      {generatedMapImage ? (
                        <img src={generatedMapImage} alt="Generated Map" className="w-full h-full object-cover" />
                      ) : (
                        <div className="text-center text-slate-400 p-4">
                           <ImageIcon className="mx-auto mb-1 opacity-50" size={24} />
                           <span className="text-[10px]">Preview</span>
                        </div>
                      )}
                      {isGeneratingMap && (
                        <div className="absolute inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center">
                          <Loader2 className="text-white animate-spin" />
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center h-full flex items-center justify-center">
                    <p className="text-xs text-slate-500 px-4">
                      The background will follow the 
                      <strong className="block text-slate-700 mt-1">{STYLES.find(s => s.id === selectedStyle)?.label}</strong> 
                      UI style.
                    </p>
                  </div>
                )}
             </div>
          </div>

          {error && (
             <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
               {error}
             </div>
          )}

          <div className="flex gap-3 pt-2 flex-shrink-0">
            <button 
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-medium hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-2.5 rounded-xl text-white font-medium transition-all shadow-lg disabled:opacity-70 flex justify-center items-center gap-2 hover:opacity-90"
              style={{ background: customGradient }}
            >
              {isLoading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  {isManual ? <Pencil size={18}/> : <Wand2 size={18} />}
                  Start Quest
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
