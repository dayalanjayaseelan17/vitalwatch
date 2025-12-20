"use client";

import { useState } from "react";

export default function DetailsPage() {
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [weight, setWeight] = useState("");
  const [gender, setGender] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    // Save data temporarily (for next page)
    localStorage.setItem(
      "userDetails",
      JSON.stringify({ name, age, weight, gender })
    );

    // Go to next page (symptoms page later)
    window.location.href = "/symptoms";
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-green-50 p-4">
      <div className="w-full max-w-md bg-white p-6 rounded-xl shadow">
        
        <h1 className="text-2xl font-bold text-center text-green-700 mb-2">
          Basic Details
        </h1>
        <p className="text-center text-gray-600 mb-6">
          This helps us give better guidance
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          
          <input
            type="text"
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full p-3 border rounded"
            required
          />

          <input
            type="number"
            placeholder="Age"
            value={age}
            onChange={(e) => setAge(e.target.value)}
            className="w-full p-3 border rounded"
            required
          />

          <input
            type="number"
            placeholder="Weight (kg)"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            className="w-full p-3 border rounded"
            required
          />

          <div className="flex justify-between text-gray-700">
            <label>
              <input
                type="radio"
                name="gender"
                value="Male"
                onChange={(e) => setGender(e.target.value)}
                required
              />{" "}
              Male
            </label>
            <label>
              <input
                type="radio"
                name="gender"
                value="Female"
                onChange={(e) => setGender(e.target.value)}
              />{" "}
              Female
            </label>
            <label>
              <input
                type="radio"
                name="gender"
                value="Other"
                onChange={(e) => setGender(e.target.value)}
              />{" "}
              Other
            </label>
          </div>

          <button
            type="submit"
            className="w-full bg-green-600 text-white py-3 rounded-lg text-lg"
          >
            Continue
          </button>
        </form>

      </div>
    </div>
  );
}
