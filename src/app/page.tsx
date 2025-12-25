"use client";

import Link from "next/link";
import { HeartPulse, User } from "lucide-react";

export default function ChoicePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4 md:flex-row md:gap-8">
      
      {/* LEFT PANEL - Quick Health Check */}
      <Link href="/details" className="w-full max-w-md">
        <div className="group mb-8 cursor-pointer rounded-2xl border-2 border-green-200 bg-white p-8 text-center shadow-lg transition-all duration-300 hover:scale-105 hover:border-green-500 hover:shadow-2xl md:mb-0">
          <div className="flex justify-center">
            <HeartPulse className="mb-4 h-20 w-20 text-green-600 transition-transform duration-300 group-hover:scale-110" />
          </div>
          <h2 className="mb-2 text-3xl font-bold text-green-800">
            Quick Health Check
          </h2>
          <p className="mb-6 text-gray-600">
            Check your symptoms instantly without creating an account.
          </p>
          <div className="mt-4 rounded-full bg-green-600 px-8 py-3 text-lg font-bold text-white transition-colors duration-300 group-hover:bg-green-700">
            Start Quick Check
          </div>
          <p className="mt-4 text-xs text-gray-500">
            Anonymous check – results are not stored
          </p>
        </div>
      </Link>

      {/* RIGHT PANEL - Sign In / Sign Up */}
      <Link href="/login" className="w-full max-w-md">
        <div className="group cursor-pointer rounded-2xl border-2 border-blue-200 bg-white p-8 text-center shadow-lg transition-all duration-300 hover:scale-105 hover:border-blue-500 hover:shadow-2xl">
          <div className="flex justify-center">
            <User className="mb-4 h-20 w-20 text-blue-600 transition-transform duration-300 group-hover:scale-110" />
          </div>
          <h2 className="mb-2 text-3xl font-bold text-blue-800">
            Sign In / Sign Up
          </h2>
          <p className="mb-6 text-gray-600">
            Create an account for full health tracking and reminders.
          </p>
          <div className="mt-4 rounded-full bg-blue-600 px-8 py-3 text-lg font-bold text-white transition-colors duration-300 group-hover:bg-blue-700">
            Continue with Account
          </div>
           <p className="mt-4 text-xs text-gray-500">
            Save reports & track medicines
          </p>
        </div>
      </Link>

    </main>
  );
}
