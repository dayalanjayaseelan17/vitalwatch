"use client";

import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-green-50">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-green-700 mb-4">
          Health Guidance
        </h1>

        <p className="text-gray-600 mb-8">
          Simple health help for everyone
        </p>

        <Link href="/details">
          <button
            className="px-10 py-4 text-xl rounded-full bg-green-600 text-white hover:bg-green-700"
          >
            Start
          </button>
        </Link>
      </div>
    </main>
  );
}