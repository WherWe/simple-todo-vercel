"use client";

import { useState } from "react";

export default function SetupPage() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const setupDatabase = async () => {
    try {
      setLoading(true);
      setError("");
      setMessage("Setting up database...");

      const response = await fetch("/api/setup", {
        method: "POST",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Setup failed");
      }

      const result = await response.json();
      setMessage("✅ " + result.message);

      // Test the database after setup
      setTimeout(async () => {
        try {
          const testResponse = await fetch("/api/test-db");
          const testResult = await testResponse.json();
          if (testResult.database?.todosTableExists) {
            setMessage("✅ Database setup complete! Table created successfully. You can now use the todo app.");
          }
        } catch (e) {
          console.error("Test failed:", e);
        }
      }, 1000);
    } catch (err) {
      setError("❌ " + (err instanceof Error ? err.message : "Setup failed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
        <h1 className="text-2xl font-bold text-gray-800 mb-6 text-center">Database Setup</h1>

        <div className="mb-6">
          <p className="text-gray-600 mb-4">Click the button below to initialize your database tables for the todo app.</p>
        </div>

        {message && <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700">{message}</div>}

        {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">{error}</div>}

        <button
          onClick={setupDatabase}
          disabled={loading}
          className="w-full px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
        >
          {loading ? "Setting up database..." : "Setup Database"}
        </button>

        <div className="mt-6 text-center">
          <a href="/" className="text-blue-500 hover:text-blue-600 text-sm">
            ← Back to Todo App
          </a>
        </div>
      </div>
    </div>
  );
}
