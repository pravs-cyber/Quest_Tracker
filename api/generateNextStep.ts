import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";

export default async function handler(req, res) {
  const { goal } = JSON.parse(req.body);

  const ai = new GoogleGenerativeAI(process.env.API_KEY);
  const model = ai.getGenerativeModel({ model: "gemini-2.5-flash" });

  const schema = {
    type: SchemaType.OBJECT,
    properties: {
      title: { type: SchemaType.STRING },
      description: { type: SchemaType.STRING },
      motivation: { type: SchemaType.STRING },
      suggestedTools: {
        type: SchemaType.ARRAY,
        items: { type: SchemaType.STRING }
      }
    },
    required: ["title", "description", "motivation", "suggestedTools"]
  };

  const prompt = `Generate the next step for the user's goal:
  Goal: ${goal.title}
  Description: ${goal.description}
  Steps so far: ${goal.steps?.map(s => s.title).join(", ")}`;

  const response = await model.generateContent({
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: schema
    }
  });

  return res.status(200).json(JSON.parse(response.text()));
}
