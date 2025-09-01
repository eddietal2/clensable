import type { RequestHandler } from '@sveltejs/kit';
import { json } from '@sveltejs/kit';
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_AI_API_KEY });

export const POST: RequestHandler = async ({ request }) => {
  try {
    const { leadName, leadEmail, campaignName } = await request.json();

    if (!leadName) {
      return json({ error: 'Missing leadName' }, { status: 400 });
    }

    const prompt = `
      Write a short professional email to a potential client named ${leadName} 
      about our cleaning services for the campaign "${campaignName}". 
      Keep it friendly, concise, and engaging. 
      If the lead email is available, you may mention reaching out to ${leadEmail}.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash', 
      contents: prompt
    });

    const message = response?.candidates;

    return json({ message });
  } catch (err: any) {
    console.error(err);
    return json({ error: 'Failed to generate message', details: err.message }, { status: 500 });
  }
};
