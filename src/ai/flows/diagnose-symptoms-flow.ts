'use server';

import { ai } from "@/ai/genkit";
import { z } from "zod";

/* ---------------- USER DETAILS ---------------- */

const UserDetailsSchema = z.object({
  name: z.string().optional(),
  age: z.string().optional(),
  weight: z.string().optional(),
  gender: z.string().optional(),
});

/* ---------------- INPUT ---------------- */

const DiagnoseSymptomsInputSchema = z.object({
  description: z.string().describe("The user's description of their symptoms."),
  photoDataUri: z
    .string()
    .optional()
    .describe(
      "Optional photo of the symptom as a Base64 data URI."
    ),
  userDetails: UserDetailsSchema.optional(),
});

export type DiagnoseSymptomsInput = z.infer<
  typeof DiagnoseSymptomsInputSchema
>;

/* ---------------- OUTPUT ---------------- */

const DiagnoseSymptomsOutputSchema = z.object({
  riskLevel: z.enum(["Green", "Yellow", "Red"]),
  title: z.string().describe("Short and clear diagnosis title"),
  summary: z.string().describe("Simple explanation of the condition in plain language"),
  whyThisResult: z.array(z.string()).describe("List of clear medical reasoning points"),
  precautions: z.array(z.string()).describe("List of precaution or self-care steps"),
  nextAction: z.string().describe("Clear instruction telling the user what to do next"),
  hospitalRequired: z.boolean(),
  specialist: z.string().describe("e.g., General Physician, Cardiologist, etc."),
  googleMapsRequired: z.boolean(),
  googleMapsQuery: z.string().nullable().describe("Text query for Google Maps search or null"),
  disclaimer: z.string().default("This is not a medical diagnosis. Consult a licensed medical professional."),
});


export type DiagnoseSymptomsOutput = z.infer<
  typeof DiagnoseSymptomsOutputSchema
>;

/* ---------------- AI FLOW ---------------- */

const diagnoseSymptomsFlow = ai.defineFlow(
  {
    name: "diagnoseSymptomsFlow",
    inputSchema: DiagnoseSymptomsInputSchema,
    outputSchema: DiagnoseSymptomsOutputSchema,
  },
  async (input) => {
    const { userDetails, description, photoDataUri } = input;

    const promptParts: any[] = [
      `
You are a medical triage AI for a health web application. Your task is to analyze the user's symptom description and generate a structured JSON output.

IMPORTANT RULES:
- You are NOT a real doctor. Your primary goal is safety.
- Do NOT give a definitive medical diagnosis. Use general terms.
- Do NOT prescribe or mention specific medicines.
- Use very simple, clear language for a user with low medical literacy.
- If unsure, always choose a higher risk level (Yellow or Red).

TASK:
Analyze the user's health problem and return a JSON object with the following structure.

RISK LEVEL LOGIC:
- Green: Mild, common, non-dangerous issue (e.g., minor cut, simple cold). Can be managed at home.
- Yellow: Moderate issue that needs monitoring or may require a doctor visit if it worsens (e.g., persistent fever, mild sprain).
- Red: Serious, urgent issue requiring immediate medical attention (e.g., chest pain, difficulty breathing, heavy bleeding, suspected fracture).

JSON FIELD REQUIREMENTS:
- riskLevel: "Green", "Yellow", or "Red".
- title: A short, simple title for the condition (e.g., "Minor Cold Symptoms," "Signs of a Sprain," "Possible Emergency").
- summary: One or two sentences explaining the situation in simple terms.
- whyThisResult: A bulleted list of 2-3 reasons for the risk level, based on the symptoms.
- precautions: 3-5 basic, safe home-care steps. For "Red" risk, this list should be empty or contain only "Do not move the affected area if injured."
- nextAction: A clear, direct instruction.
  - Green: "Continue home care and monitor for any changes."
  - Yellow: "Visit a nearby doctor or health center if symptoms do not improve."
  - Red: "Go to the nearest hospital emergency room immediately."
- hospitalRequired: true if Red, false otherwise.
- specialist: The type of doctor to see. Use "General Physician" for Green/Yellow unless a specific specialist is obvious. Use "Emergency" for Red.
- googleMapsRequired: true if Red, false for Green. For Yellow, it's optional (true if a doctor visit is strongly suggested).
- googleMapsQuery:
  - If googleMapsRequired is true, provide a search query like "Emergency hospital near me" or "Cardiologist near me".
  - If googleMapsRequired is false, this MUST be null.
- disclaimer: Always include "This is not a medical diagnosis. Consult a licensed medical professional."

USER DETAILS:
Name: ${userDetails?.name || "Not provided"}
Age: ${userDetails?.age || "Not provided"}
Weight: ${userDetails?.weight || "Not provided"}
Gender: ${userDetails?.gender || "Not provided"}

PROBLEM DESCRIPTION:
"${description}"
      `,
    ];

    if (photoDataUri) {
      promptParts.push({ media: { url: photoDataUri } });
    }

    const llmResponse = await ai.generate({
      prompt: promptParts,
      output: {
        schema: DiagnoseSymptomsOutputSchema,
      },
      model: "gemini-1.5-flash-latest",
      config: {
        temperature: 0.2,
      },
    });

    if (!llmResponse.output) {
      throw new Error("No response from AI");
    }

    return llmResponse.output;
  }
);

/* ---------------- FALLBACK FUNCTION ---------------- */

export async function diagnoseSymptoms(
  input: DiagnoseSymptomsInput
): Promise<DiagnoseSymptomsOutput> {
  try {
    if (!input.description && !input.photoDataUri) {
       return {
        riskLevel: "Yellow",
        title: "Not Enough Information",
        summary: "You have not provided enough information for a useful suggestion.",
        whyThisResult: ["No symptom description was provided.", "No photo was uploaded."],
        precautions: ["Please describe your problem clearly.", "Consider uploading a photo if it helps explain the issue."],
        nextAction: "Please go back and provide more details, or visit a nearby doctor if you are concerned.",
        hospitalRequired: false,
        specialist: "General Physician",
        googleMapsRequired: false,
        googleMapsQuery: null,
        disclaimer: "This is not a medical diagnosis. Consult a licensed medical professional."
      };
    }

    return await diagnoseSymptomsFlow(input);
  } catch (error) {
    console.error("AI failed, using fallback:", error);

    const text = input.description.toLowerCase();

    const redFlags = ["chest pain", "difficulty breathing", "not breathing", "unconscious", "heavy bleeding", "severe bleeding", "accident", "poison", "heart attack", "seizure", "fracture"];
    const yellowFlags = ["fever", "headache", "vomiting", "stomach pain", "swelling", "rash", "deep cut", "bleeding", "sprain", "injury"];

    if (redFlags.some((k) => text.includes(k))) {
      return {
        riskLevel: "Red",
        title: "Potential Emergency",
        summary: "The symptoms you described may indicate a serious medical emergency.",
        whyThisResult: ["Keywords like 'chest pain', 'difficulty breathing', or 'heavy bleeding' suggest a high-risk situation."],
        precautions: [],
        nextAction: "Go to the nearest hospital emergency room immediately.",
        hospitalRequired: true,
        specialist: "Emergency",
        googleMapsRequired: true,
        googleMapsQuery: "Emergency hospital near me",
        disclaimer: "This is not a medical diagnosis. Consult a licensed medical professional."
      };
    }

    if (yellowFlags.some((k) => text.includes(k))) {
      return {
        riskLevel: "Yellow",
        title: "Caution Advised",
        summary: "The symptoms described need attention and should be monitored closely.",
        whyThisResult: ["Symptoms like fever, vomiting, or moderate pain can sometimes worsen without care."],
        precautions: ["Take adequate rest.", "Stay hydrated by drinking water or fluids.", "Monitor your symptoms for any changes."],
        nextAction: "Visit a nearby doctor or health center if symptoms do not improve or get worse.",
        hospitalRequired: false,
        specialist: "General Physician",
        googleMapsRequired: true,
        googleMapsQuery: "General Physician near me",
        disclaimer: "This is not a medical diagnosis. Consult a licensed medical professional."
      };
    }

    return {
      riskLevel: "Green",
      title: "Minor Issue",
      summary: "The problem you described appears to be minor and can likely be managed at home.",
      whyThisResult: ["The symptoms do not match common high-risk or moderate-risk indicators."],
      precautions: ["Keep the affected area clean.", "Take adequate rest.", "Drink plenty of fluids."],
      nextAction: "Continue home care and monitor for any changes.",
      hospitalRequired: false,
      specialist: "General Physician",
      googleMapsRequired: false,
      googleMapsQuery: null,
      disclaimer: "This is not a medical diagnosis. Consult a licensed medical professional."
    };
  }
}
