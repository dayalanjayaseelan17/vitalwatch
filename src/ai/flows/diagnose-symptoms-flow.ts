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
  analysis: z
    .string()
    .describe("Short, simple explanation in one sentence."),
  precautions: z
    .array(z.string())
    .describe("3–5 simple home care or first-aid steps."),
  nextAction: z
    .string()
    .describe("Clear instruction on what the user should do next."),
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
You are a healthcare guidance AI for a student hackathon project called "Swasthya Margdarshan".

IMPORTANT RULES:
- You are NOT a doctor.
- Do NOT give medical diagnosis.
- Do NOT prescribe medicines.
- Use very simple language for rural users.
- If unsure, choose Yellow or Red.

TASK:
Analyze the user's health problem and return ONE risk level:
- Green: Minor issue, safe home care
- Yellow: Moderate issue, doctor visit recommended
- Red: Serious issue, hospital visit immediately

OUTPUT FORMAT:
- riskLevel: Green / Yellow / Red
- analysis: One simple sentence
- precautions: 3–5 basic, safe home-care steps (only for Green & Yellow)
- nextAction:
   Green → "Continue home care and monitor"
   Yellow → "Visit a nearby doctor or health center"
   Red → "Go to the nearest hospital immediately"

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
      model: "googleai/gemini-2.5-flash",
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
        analysis: "Not enough information provided.",
        precautions: [
          "Try to describe the problem clearly",
          "Upload a photo if possible",
        ],
        nextAction: "Visit a nearby doctor or health center",
      };
    }

    return await diagnoseSymptomsFlow(input);
  } catch (error) {
    console.error("AI failed, using fallback:", error);

    const text = input.description.toLowerCase();

    const redFlags = [
      "chest pain",
      "difficulty breathing",
      "not breathing",
      "unconscious",
      "heavy bleeding",
      "severe bleeding",
      "accident",
      "poison",
      "heart attack",
      "seizure",
    ];
    
    const yellowFlags = [
      "fever",
      "headache",
      "vomiting",
      "stomach pain",
      "swelling",
      "rash",
      "cut",
      "bleeding",
      "injury",
    ];
    

    if (redFlags.some((k) => text.includes(k))) {
      return {
        riskLevel: "Red",
        analysis: "This problem looks serious.",
        precautions: [],
        nextAction: "Go to the nearest hospital immediately",
      };
    }

    if (yellowFlags.some((k) => text.includes(k))) {
      return {
        riskLevel: "Yellow",
        analysis: "This problem needs attention.",
        precautions: [
          "Take rest",
          "Drink enough water",
          "Avoid heavy work",
          "Monitor symptoms",
        ],
        nextAction: "Visit a nearby doctor or health center",
      };
    }

    return {
      riskLevel: "Green",
      analysis: "The problem appears to be minor.",
      precautions: [
        "Take rest",
        "Keep the area clean",
        "Drink warm water",
        "Avoid strain",
      ],
      nextAction: "Continue home care and monitor",
    };
  }
}
