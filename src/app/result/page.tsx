"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  diagnoseSymptoms,
  type DiagnoseSymptomsOutput,
  type DiagnoseSymptomsInput,
} from "@/ai/flows/diagnose-symptoms-flow";
import { AlertTriangle, HeartPulse, ShieldCheck, ListChecks, Stethoscope, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type RiskLevel = "Green" | "Yellow" | "Red";

/* ---------------- CONFIG & HELPERS ---------------- */

const config = {
  Green: {
    bgColor: "bg-green-100",
    textColor: "text-green-800",
    borderColor: "border-green-300",
    icon: <ShieldCheck className="h-16 w-16" />,
    buttonClass: "bg-green-600 hover:bg-green-700",
  },
  Yellow: {
    bgColor: "bg-yellow-100",
    textColor: "text-yellow-800",
    borderColor: "border-yellow-300",
    icon: <AlertTriangle className="h-16 w-16" />,
    buttonClass: "bg-yellow-500 hover:bg-yellow-600",
  },
  Red: {
    bgColor: "bg-red-100",
    textColor: "text-red-800",
    borderColor: "border-red-300",
    icon: <HeartPulse className="h-16 w-16" />,
    buttonClass: "bg-red-600 hover:bg-red-700",
  },
};

const GoogleMapsButton = ({ query }: { query: string | null }) => {
  if (!query) return null;
  
  const handleRedirect = () => {
    const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
    window.open(googleMapsUrl, "_blank");
  };

  return (
    <Button
      onClick={handleRedirect}
      className="w-full text-lg h-12 bg-blue-600 hover:bg-blue-700 mt-4"
    >
      Find on Google Maps
    </Button>
  );
};


/* ---------------- RESULT PAGE ---------------- */

export default function ResultPage() {
  const [result, setResult] = useState<DiagnoseSymptomsOutput | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const getResult = async () => {
      setLoading(true);
      setError(null);

      const userDetailsString = localStorage.getItem("userDetails");
      const symptomDescription = localStorage.getItem("symptomDescription");
      const symptomImage = localStorage.getItem("symptomImage");

      if (!symptomDescription && !symptomImage) {
        setError("No symptoms were provided. Please go back and describe your problem.");
        setLoading(false);
        return;
      }

      try {
        const userDetails = userDetailsString
          ? JSON.parse(userDetailsString)
          : {};

        const input: DiagnoseSymptomsInput = {
          description: symptomDescription || "",
          photoDataUri: symptomImage || undefined,
          userDetails,
        };

        const diagnosisResult = await diagnoseSymptoms(input);
        setResult(diagnosisResult);
      } catch (e) {
        console.error(e);
        setError("Could not get guidance. An unexpected error occurred.");
      } finally {
        setLoading(false);
        // Clean up localStorage after getting the result
        localStorage.removeItem("symptomDescription");
        localStorage.removeItem("symptomImage");
      }
    };

    getResult();
  }, []);
  
  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-green-600 mx-auto"></div>
          <p className="text-green-700 mt-4 text-xl">
            Analyzing your symptoms safely...
          </p>
          <p className="text-gray-500 mt-2">This may take a moment.</p>
        </div>
      </div>
    );
  }

  if (error) {
     return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-md bg-red-50 border-red-200">
          <CardHeader>
            <CardTitle className="text-red-700 text-center">An Error Occurred</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-red-600 mb-6">{error}</p>
            <Button onClick={() => router.push("/symptoms")}>Try Again</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!result) {
    return null; // Should not happen if loading is false and no error
  }

  const {
    riskLevel,
    title,
    summary,
    whyThisResult,
    precautions,
    nextAction,
    googleMapsQuery
  } = result;
  const theme = config[riskLevel];

  return (
    <div className={`min-h-screen w-full flex justify-center p-4 md:p-8 ${theme.bgColor} transition-colors duration-500`}>
      <div className="w-full max-w-2xl space-y-6">
        
        {/* Main Result Card */}
        <Card className={cn("w-full shadow-2xl border-2", theme.borderColor)}>
          <CardHeader className="items-center text-center">
            <div className={cn("p-4 rounded-full", theme.bgColor, theme.textColor)}>
              {theme.icon}
            </div>
            <CardTitle className={cn("text-3xl font-bold", theme.textColor)}>{title}</CardTitle>
            <p className="text-lg text-gray-700 px-4">{summary}</p>
          </CardHeader>
          <CardContent className="space-y-6">
            
            {whyThisResult && whyThisResult.length > 0 && (
              <div className="p-4 bg-white rounded-lg border">
                <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2 mb-2"><Info size={20}/> Why We Think So</h3>
                <ul className="list-disc pl-5 space-y-1 text-gray-600">
                  {whyThisResult.map((reason, i) => <li key={i}>{reason}</li>)}
                </ul>
              </div>
            )}
            
            {precautions && precautions.length > 0 && (
               <div className="p-4 bg-white rounded-lg border">
                <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2 mb-2"><ListChecks size={20}/> Recommended Precautions</h3>
                <ul className="list-disc pl-5 space-y-1 text-gray-600">
                  {precautions.map((p, i) => <li key={i}>{p}</li>)}
                </ul>
              </div>
            )}

             <div className={cn("p-4 rounded-lg border-2 text-center", theme.borderColor, theme.bgColor)}>
                <h3 className="font-bold text-lg text-gray-800 flex items-center justify-center gap-2 mb-2"><Stethoscope size={20}/> Next Action</h3>
                <p className={cn("text-xl font-semibold", theme.textColor)}>{nextAction}</p>
             </div>

            {googleMapsQuery && <GoogleMapsButton query={googleMapsQuery} />}

          </CardContent>
        </Card>
        
        {/* Buttons and Disclaimer */}
        <div className="space-y-4">
          <Button onClick={() => router.push("/")} variant="outline" className="w-full h-12 text-lg bg-white">
            Start Over
          </Button>

          <div className="text-center text-xs text-gray-500 p-4 border-t-2 border-gray-200">
            <p className="font-bold">Disclaimer:</p>
            <p>{result.disclaimer}</p>
          </div>
        </div>

      </div>
    </div>
  );
}
