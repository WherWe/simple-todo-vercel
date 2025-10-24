"use client";

import { useState, useEffect } from "react";
import { UserButton } from "@clerk/nextjs";
import Link from "next/link";

interface UsageStats {
  totalRequests: number;
  extractRequests: number;
  queryRequests: number;
  anthropicRequests: number;
  openaiRequests: number;
  lastAnthropicModel: string | null;
  lastOpenaiModel: string | null;
  lastUpdated: string;
}

export default function SettingsPage() {
  const [usage, setUsage] = useState<UsageStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [needsSetup, setNeedsSetup] = useState(false);

  useEffect(() => {
    fetchUsageStats();
  }, []);

  const fetchUsageStats = async () => {
    try {
      setLoading(true);
      setError(null);
      setNeedsSetup(false);
      const response = await fetch("/api/usage");

      if (!response.ok) {
        const errorData = await response.json();

        // Check if database needs setup
        if (errorData.needsSetup) {
          setNeedsSetup(true);
          setError("Database not initialized. Click the button below to set up your database.");
        } else {
          setError(errorData.error || "Failed to fetch usage stats");
        }
        return;
      }

      const data = await response.json();
      setUsage(data);
    } catch (err) {
      setError("Failed to load usage statistics");
      console.error("Error fetching usage:", err);
    } finally {
      setLoading(false);
    }
  };

  const runSetup = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch("/api/setup", {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Setup failed");
      }

      // After successful setup, fetch usage stats
      await fetchUsageStats();
    } catch (err) {
      setError("Failed to initialize database");
      console.error("Error running setup:", err);
      setLoading(false);
    }
  };

  const resetStats = async () => {
    if (!confirm("Are you sure you want to reset your usage statistics?")) {
      return;
    }

    try {
      const response = await fetch("/api/usage", {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to reset stats");
      }

      await fetchUsageStats();
    } catch (err) {
      setError("Failed to reset statistics");
      console.error("Error resetting stats:", err);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="text-3xl">✨</div>
              <div>
                <Link href="/">
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent cursor-pointer hover:opacity-80 transition-opacity">todoish</h1>
                </Link>
                <p className="text-xs text-gray-500">Settings</p>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <nav className="hidden md:flex items-center gap-4">
                <Link href="/" className="text-sm text-gray-600 hover:text-purple-600 transition-colors font-medium">
                  Home
                </Link>
                <Link href="/settings" className="text-sm text-purple-600 font-semibold">
                  Settings
                </Link>
              </nav>

              <UserButton
                appearance={{
                  elements: {
                    avatarBox: "w-9 h-9 ring-2 ring-purple-100 hover:ring-purple-300 transition-all",
                  },
                }}
              />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-6 py-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Settings</h2>
        <p className="text-gray-600 mb-8">Manage your AI usage and preferences</p>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center justify-between">
              <p className="text-red-700">{error}</p>
              <button onClick={() => setError(null)} className="ml-2 text-red-500 hover:text-red-700">
                ✕
              </button>
            </div>
            <div className="mt-3 space-y-2">
              <p className="text-sm text-red-600">Try initializing the database:</p>
              <button
                onClick={runSetup}
                disabled={loading}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Setting up..." : "🚀 Initialize Database"}
              </button>
            </div>
          </div>
        )}

        {/* AI Usage Statistics */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="text-2xl">📊</span>
              <h3 className="text-xl font-semibold text-gray-900">AI Usage Statistics</h3>
            </div>
            <button onClick={resetStats} className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 border border-red-300 rounded-lg transition-colors">
              Reset Stats
            </button>
          </div>

          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading statistics...</div>
          ) : usage ? (
            <div className="space-y-4">
              {/* Total Requests */}
              <div className="bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-purple-700 font-medium">Total AI Requests</p>
                    <p className="text-3xl font-bold text-purple-900">{usage.totalRequests}</p>
                  </div>
                  <div className="text-4xl">🤖</div>
                </div>
              </div>

              {/* Request Breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-700 font-medium">Todo Extractions</p>
                  <p className="text-2xl font-bold text-blue-900">{usage.extractRequests}</p>
                </div>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-sm text-green-700 font-medium">Query Detections</p>
                  <p className="text-2xl font-bold text-green-900">{usage.queryRequests}</p>
                </div>
              </div>

              {/* AI Provider Breakdown */}
              <div className="border-t border-gray-200 pt-4">
                <p className="text-sm font-semibold text-gray-700 mb-3">AI Provider Usage</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xl">🔮</span>
                      <p className="text-sm text-orange-700 font-medium">Anthropic (Claude)</p>
                    </div>
                    <p className="text-2xl font-bold text-orange-900">{usage.anthropicRequests}</p>
                    <p className="text-xs text-orange-600 mt-1">{usage.totalRequests > 0 ? Math.round((usage.anthropicRequests / usage.totalRequests) * 100) : 0}% of total</p>
                    {usage.lastAnthropicModel && <p className="text-xs text-orange-700 mt-2 font-mono bg-orange-100 px-2 py-1 rounded">{usage.lastAnthropicModel}</p>}
                  </div>
                  <div className="bg-teal-50 border border-teal-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xl">⚡</span>
                      <p className="text-sm text-teal-700 font-medium">OpenAI (GPT)</p>
                    </div>
                    <p className="text-2xl font-bold text-teal-900">{usage.openaiRequests}</p>
                    <p className="text-xs text-teal-600 mt-1">{usage.totalRequests > 0 ? Math.round((usage.openaiRequests / usage.totalRequests) * 100) : 0}% of total</p>
                    {usage.lastOpenaiModel && <p className="text-xs text-teal-700 mt-2 font-mono bg-teal-100 px-2 py-1 rounded">{usage.lastOpenaiModel}</p>}
                  </div>
                </div>
              </div>

              {/* Last Updated */}
              <div className="text-xs text-gray-500 text-center pt-2">Last updated: {new Date(usage.lastUpdated).toLocaleString()}</div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">No usage data available</div>
          )}
        </div>

        {/* Info Section */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <span className="text-2xl">ℹ️</span>
            <div>
              <h4 className="font-semibold text-blue-900 mb-1">About AI Usage</h4>
              <p className="text-sm text-blue-800">
                Todoish uses AI to extract todos from your rambling text and detect when you're asking questions.
                {usage && usage.anthropicRequests > 0 && usage.openaiRequests > 0 && " We try Anthropic's Claude first, then fall back to OpenAI's GPT if needed."}
                {usage && usage.anthropicRequests > 0 && usage.openaiRequests === 0 && " Currently using Anthropic's Claude."}
                {usage && usage.anthropicRequests === 0 && usage.openaiRequests > 0 && " Currently using OpenAI's GPT."}
                {(!usage || (usage.anthropicRequests === 0 && usage.openaiRequests === 0)) && " We try Anthropic's Claude first, then fall back to OpenAI's GPT if needed."}
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-auto">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="text-lg">✨</span>
              <span className="text-sm text-gray-600">
                <span className="font-semibold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">todoish</span> - AI-powered task management
              </span>
            </div>
            <div className="flex items-center gap-6 text-sm text-gray-500">
              <Link href="/" className="hover:text-purple-600 transition-colors">
                Home
              </Link>
              <span className="text-gray-400">© 2025 todoish</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
