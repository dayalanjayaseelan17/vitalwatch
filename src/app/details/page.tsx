"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

export default function DetailsPage() {
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    // Load from localStorage if it exists
    const storedDetails = localStorage.getItem("userDetails");
    if (storedDetails) {
      const { age, gender, height, weight } = JSON.parse(storedDetails);
      if (age) setAge(age);
      if (gender) setGender(gender);
      if (height) setHeight(height);
      if (weight) setWeight(weight);
    }
  }, []);


  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!isMounted) return;
    
    localStorage.setItem(
      "userDetails",
      JSON.stringify({ age, gender, height, weight })
    );

    window.location.href = "/symptoms";
  }

  if (!isMounted) {
    return null; // Or a loading spinner
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-green-50 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-md">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-green-700">
            A Few Quick Details
          </h1>
          <p className="mb-6 text-gray-600">
            This helps us give better guidance. It is not stored.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="age">Age</Label>
            <Input
              id="age"
              type="number"
              placeholder="e.g., 35"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="weight">Weight (kg)</Label>
            <Input
              id="weight"
              type="number"
              placeholder="e.g., 70"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="height">Height (cm)</Label>
            <Input
              id="height"
              type="number"
              placeholder="e.g., 175"
              value={height}
              onChange={(e) => setHeight(e.target.value)}
              required
            />
          </div>

          <div className="space-y-3">
            <Label>Gender</Label>
            <RadioGroup
              defaultValue={gender}
              onValueChange={setGender}
              className="flex justify-between text-gray-700"
              required
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="Male" id="male" />
                <Label htmlFor="male">Male</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="Female" id="female" />
                <Label htmlFor="female">Female</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="Other" id="other" />
                <Label htmlFor="other">Other</Label>
              </div>
            </RadioGroup>
          </div>

          <Button
            type="submit"
            className="w-full bg-green-600 text-white hover:bg-green-700"
            size="lg"
          >
            Continue
          </Button>
        </form>
      </div>
    </div>
  );
}
