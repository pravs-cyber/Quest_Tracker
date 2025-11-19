import { GoogleGenerativeAI } from "@google/generative-ai";

export const config = { runtime: "edge" };

export default async function handler(req) {
  try {
    const { theme } = await req.json();

    const genAI = new GoogleGenerativeAI(process.env.API_KEY);
    const model = genAI.getGenerativeModel({ model: "imagen-1.0" });

    const result = await model.generateImage({
      prompt: `A treasure map background with theme: ${theme}. No text.`,
      size: "1024x1024",
    });

    return new Response(result.image, {
      headers: { "Content-Type": "image/png" }
    });

  } catch (err) {
    console.error("generateMapBackground error:", err);
    return new Response(JSON.stringify({ error: "Map failed" }), { status: 500 });
  }
}
