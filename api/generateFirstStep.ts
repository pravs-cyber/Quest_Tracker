
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { BigGoal, GoalStep } from "../types";

const ai = new GoogleGenerativeAI({ apiKey: import.meta.env.VITE_API_KEY });

// Schema for a single step
const stepSchema: Schema = {
  type: SchemaType.OBJECT,
  properties: {
    title: { type: SchemaType.STRING, description: "A short, punchy title for the step (max 5 words)." },
    description: { type: SchemaType.STRING, description: "A clear, actionable instruction for this step." },
    motivation: { type: SchemaType.STRING, description: "A short treasure-hunt style hint or encouraging quote related to this step." },
    suggestedTools: { 
      type: SchemaType.ARRAY, 
      items: { type: SchemaType.STRING },
      description: "A list of 1-3 physical or digital tools, apps, or items specifically needed for this task (e.g., 'Running Shoes', 'VS Code', 'Hammer')."
    }
  },
  required: ["title", "description", "motivation", "suggestedTools"],
};

// Schema for theme suggestion
const themeSchema: Schema = {
  type: SchemaType.OBJECT,
  properties: {
    gradient: { type: SchemaType.STRING, description: "A CSS linear-gradient string with two SPECIFIC HEX CODES that match the specific emotion of the goal. Do not use named colors. Example: 'linear-gradient(to right, #ff5f6d, #ffc371)'" },
    mapStyle: { type: SchemaType.STRING, enum: ['classic', 'midnight', 'blueprint', 'forest'], description: "The visual map style that best fits the quest theme." }
  },
  required: ["gradient", "mapStyle"],
};

// Schema for tool suggestion
const toolsSchema: Schema = {
  type: SchemaType.OBJECT,
  properties: {
    tools: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING },
      description: "List of 1-3 relevant tools."
    }
  },
  required: ["tools"]
};

export const generateFirstStep = async (goalTitle: string, goalDescription: string): Promise<Omit<GoalStep, 'id' | 'createdAt' | 'isCompleted'>> => {
  const prompt = `
    The user has embarked on a new quest: "${goalTitle}".
    Context: ${goalDescription}.
    
    You are a wise guide creating a treasure map for success. 
    Generate the VERY FIRST, immediate, and manageable step they should take to start this journey.
    Keep it simple to build momentum.
    CRITICAL: List 1-3 specific tools or resources they will need for this specific step.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: stepSchema,
        systemInstruction: "You are an encouraging goal-setting coach with a whimsical, adventurous tone."
      },
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    
    return JSON.parse(text);
  } catch (error) {
    console.error("Error generating first step:", error);
    throw error;
  }
};

export const generateNextStep = async (goal: BigGoal): Promise<Omit<GoalStep, 'id' | 'createdAt' | 'isCompleted'>> => {
  const safeSteps = goal.steps || [];
  const completedSteps = safeSteps.filter(s => s.isCompleted);
  const lastStep = completedSteps.length > 0 ? completedSteps[completedSteps.length - 1] : null;

  let contextPrompt = "";
  if (lastStep) {
    contextPrompt = `They have just completed this step: "${lastStep.title}" - ${lastStep.description}.`;
  } else {
    contextPrompt = `They are starting their journey but need the next waypoint.`;
  }

  const prompt = `
    The user is on a quest: "${goal.title}".
    Context: ${goal.description}.
    
    ${contextPrompt}
    
    Here is the history of their journey so far (ordered):
    ${safeSteps.map((s, i) => `${i + 1}. ${s.title} [${s.isCompleted ? 'Done' : 'Pending'}]`).join('\n')}
    
    Generate the NEXT logical step in this adventure. 
    It should be slightly more challenging than the last but clearly achievable.
    Act as if you are revealing the next location on a treasure map.
    CRITICAL: List 1-3 specific tools or resources they will need for this specific step.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: stepSchema,
        systemInstruction: "You are an encouraging goal-setting coach with a whimsical, adventurous tone."
      },
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");

    return JSON.parse(text);
  } catch (error) {
    console.error("Error generating next step:", error);
    throw error;
  }
};

export const suggestTools = async (stepTitle: string, stepDescription: string): Promise<string[]> => {
  const prompt = `
    Analyze this task:
    Title: "${stepTitle}"
    Description: "${stepDescription}"
    
    Suggest 1-3 essential tools, apps, or physical items needed to complete this specific task.
    Be specific (e.g., "Phillips Screwdriver" instead of "Screwdriver", "Figma" instead of "Design Software").
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: toolsSchema,
      },
    });

    const text = response.text;
    if (!text) return [];
    const result = JSON.parse(text);
    return result.tools || [];
  } catch (error) {
    console.error("Error suggesting tools:", error);
    return [];
  }
};

export const suggestGoalTheme = async (title: string, description: string): Promise<{ gradient: string, mapStyle: string }> => {
  const prompt = `
    Analyze the mood and theme of this user goal:
    Title: "${title}"
    Description: "${description}"
    
    Suggest a unique visual theme.
    1. A CSS linear gradient using TWO SPECIFIC HEX CODES (not named colors) that capture the exact vibe.
       - Intense/Action -> Reds/Oranges/Blacks
       - Calm/Health -> Teals/Greens/Whites
       - Creative -> Purples/Pinks/Yellows
       - Professional -> Blues/Slates/Golds
    2. A map style (classic, midnight, blueprint, forest).
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: themeSchema,
      },
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");

    return JSON.parse(text);
  } catch (error) {
    console.error("Error suggesting theme:", error);
    // Fallback
    return { gradient: 'linear-gradient(to right, #3b82f6, #8b5cf6)', mapStyle: 'classic' };
  }
};

export const generateMapBackground = async (prompt: string): Promise<string> => {
  try {
    const response = await ai.models.generateImages({
      model: 'imagen-4.0-generate-001',
      prompt: `A top-down view treasure map background texture. Theme: ${prompt}. 
               Artistic, high fantasy or sci-fi style depending on theme. 
               Subtle details, faded colors, paper or digital texture. 
               No text, no UI elements, no labels. Just the terrain or surface.`,
      config: {
        numberOfImages: 1,
        aspectRatio: '3:4',
        outputMimeType: 'image/jpeg',
      },
    });

    const base64ImageBytes = response.generatedImages?.[0]?.image?.imageBytes;
    if (!base64ImageBytes) throw new Error("No image generated");
    
    return `data:image/jpeg;base64,${base64ImageBytes}`;
  } catch (error) {
    console.error("Error generating map background:", error);
    throw error;
  }
};
