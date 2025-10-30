
import { GoogleGenAI } from "@google/genai";

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
    // In a real app, you'd want to handle this more gracefully,
    // but for this context, throwing an error is clear.
    throw new Error("API_KEY environment variable is not set.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });
const model = 'gemini-2.5-flash';

export const generateProductName = async (base64Image: string, mimeType: string): Promise<string> => {
    try {
        const imagePart = {
            inlineData: {
                data: base64Image,
                mimeType,
            },
        };
        
        const prompt = `Analyze this product image. Provide a creative, marketable name for it. The name should be catchy and suitable for branding and e-commerce. Return only the name, with no additional text, quotes, or explanations.`;

        const response = await ai.models.generateContent({
            model: model,
            contents: { parts: [imagePart, { text: prompt }] },
        });

        const text = response.text.trim();
        
        // Clean up potential markdown or quotes from the response
        return text.replace(/^"|"$|^\*|\*$/g, '').trim();

    } catch (error) {
        console.error("Error generating product name with Gemini:", error);
        throw new Error("Failed to communicate with the AI. Please check your connection or API key and try again.");
    }
};
