"use client";

import { useState } from "react";
import { ScoreResponse } from "@/types";

export default function Home() {
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ScoreResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch(
        `/api/score?address=${encodeURIComponent(address)}`,
      );
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to fetch score");
        return;
      }

      setResult(data);
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-8 text-gray-800">
          Onchain Wallet Score
        </h1>

        <form onSubmit={handleSubmit} className="mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Wallet Address or Basename
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="0x... or basename.base.eth"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
              />
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? "Loading..." : "Get Score"}
              </button>
            </div>
          </div>
        </form>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {result && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <div className="text-6xl font-bold text-blue-600 mb-2">
                {result.score}
              </div>
              <div className="text-gray-600">Overall Score</div>
              {result.basename && (
                <div className="mt-2 text-sm text-gray-500">
                  Resolved from <span className="font-medium text-indigo-600">{result.basename}</span>
                </div>
              )}
              {result.flags?.insufficientData && (
                <div className="mt-4 text-yellow-600">
                  ⚠️ Insufficient data for accurate scoring
                </div>
              )}
              {/* {result.flags?.possibleBot && (
                <div className="mt-4 text-orange-600">
                  🤖 Possible bot activity detected
                </div>
              )} */}
            </div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4 text-black">
                Score Breakdown
              </h2>
              <div className="space-y-3">
                {Object.entries(result.breakdown).map(([key, value]) => (
                  <div key={key}>
                    <div className="flex justify-between mb-1">
                      <span className="text-gray-700 capitalize">
                        {key.replace(/([A-Z])/g, " $1").trim()}
                      </span>
                      <span className="font-semibold text-black">{value}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${value}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4 text-black">
                Wallet Statistics
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-gray-600 text-sm">
                    Total Transactions
                  </div>
                  <div className="text-2xl font-semibold text-black">
                    {result.stats.totalTransactions}
                  </div>
                </div>
                <div>
                  <div className="text-gray-600 text-sm">Active Days</div>
                  <div className="text-2xl font-semibold text-black">
                    {result.stats.uniqueActiveDays}
                  </div>
                </div>
                <div>
                  <div className="text-gray-600 text-sm">Longest Streak</div>
                  <div className="text-2xl font-semibold text-black">
                    {result.stats.longestStreak}
                  </div>
                </div>
                <div>
                  <div className="text-gray-600 text-sm">Unique Contracts</div>
                  <div className="text-2xl font-semibold text-black">
                    {result.stats.uniqueContracts}
                  </div>
                </div>
                {result.stats.firstTxAt && (
                  <div className="col-span-2">
                    <div className="text-gray-600 text-sm">
                      First Transaction
                    </div>
                    <div className="font-semibold text-black">
                      {new Date(result.stats.firstTxAt).toLocaleDateString()}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
