"use client";

import { useState, useEffect } from "react";
import { UserButton, useUser } from "@clerk/nextjs";
import Link from "next/link";

interface UserProfile {
  userId: string;
  age: number | null;
  gender: string | null;
  occupation: string | null;
  currentWakeTime: string | null;
  idealWakeTime: string | null;
  currentBedtime: string | null;
  idealBedtime: string | null;
  bio: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function ProfilePage() {
  const { user, isLoaded } = useUser();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form state
  const [age, setAge] = useState<string>("");
  const [gender, setGender] = useState<string>("");
  const [occupation, setOccupation] = useState<string>("");
  const [currentWakeTime, setCurrentWakeTime] = useState<string>("");
  const [idealWakeTime, setIdealWakeTime] = useState<string>("");
  const [currentBedtime, setCurrentBedtime] = useState<string>("");
  const [idealBedtime, setIdealBedtime] = useState<string>("");
  const [bio, setBio] = useState<string>("");

  // Load profile on mount
  useEffect(() => {
    if (isLoaded && user) {
      fetchProfile();
    }
  }, [isLoaded, user]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/profile");

      if (res.ok) {
        const data = await res.json();
        setProfile(data);

        // Populate form with existing data
        setAge(data.age?.toString() || "");
        setGender(data.gender || "");
        setOccupation(data.occupation || "");
        setCurrentWakeTime(data.currentWakeTime || "");
        setIdealWakeTime(data.idealWakeTime || "");
        setCurrentBedtime(data.currentBedtime || "");
        setIdealBedtime(data.idealBedtime || "");
        setBio(data.bio || "");
      } else if (res.status === 404) {
        // No profile yet - that's ok, form will be empty
        setProfile(null);
      } else {
        throw new Error("Failed to load profile");
      }
    } catch (err) {
      console.error("Error loading profile:", err);
      setError("Failed to load profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const payload = {
        age: age ? parseInt(age) : null,
        gender: gender || null,
        occupation: occupation || null,
        currentWakeTime: currentWakeTime || null,
        idealWakeTime: idealWakeTime || null,
        currentBedtime: currentBedtime || null,
        idealBedtime: idealBedtime || null,
        bio: bio || null,
      };

      const res = await fetch("/api/profile", {
        method: profile ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error("Failed to save profile");
      }

      const data = await res.json();
      setProfile(data);
      setSuccessMessage("Profile saved successfully! AI will now use this context for better suggestions.");

      // Clear success message after 5 seconds
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err) {
      console.error("Error saving profile:", err);
      setError("Failed to save profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (!isLoaded || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src="/icon.svg" alt="todoish logo" className="w-10 h-10" />
              <div>
                <Link href="/">
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent cursor-pointer hover:opacity-80 transition-opacity">todoish</h1>
                </Link>
                <p className="text-xs text-gray-500">AI-powered task management</p>
              </div>
            </div>
            <UserButton afterSignOutUrl="/" />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
          {/* Page Header */}
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-8 py-6">
            <h2 className="text-3xl font-bold text-white">Your Profile</h2>
            <p className="text-purple-100 mt-2">Help AI understand you better for personalized task suggestions</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            {/* Success Message */}
            {successMessage && (
              <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg flex items-center gap-2">
                <span className="text-xl">✅</span>
                <span>{successMessage}</span>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg flex items-center gap-2">
                <span className="text-xl">❌</span>
                <span>{error}</span>
              </div>
            )}

            {/* Basic Info Section */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <span>👤</span> Basic Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Age</label>
                  <input
                    type="number"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    placeholder="e.g., 28"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-black bg-white"
                    min="13"
                    max="120"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-black bg-white"
                  >
                    <option value="">Prefer not to say</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="non-binary">Non-binary</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Occupation</label>
                  <input
                    type="text"
                    value={occupation}
                    onChange={(e) => setOccupation(e.target.value)}
                    placeholder="e.g., Software Engineer, Student, Freelance Designer"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-black bg-white"
                  />
                </div>
              </div>
            </div>

            {/* Sleep Schedule Section */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <span>😴</span> Sleep Schedule
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Current Wake Time</label>
                  <input
                    type="time"
                    value={currentWakeTime}
                    onChange={(e) => setCurrentWakeTime(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-black bg-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ideal Wake Time</label>
                  <input
                    type="time"
                    value={idealWakeTime}
                    onChange={(e) => setIdealWakeTime(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-black bg-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Current Bedtime</label>
                  <input
                    type="time"
                    value={currentBedtime}
                    onChange={(e) => setCurrentBedtime(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-black bg-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ideal Bedtime</label>
                  <input
                    type="time"
                    value={idealBedtime}
                    onChange={(e) => setIdealBedtime(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-black bg-white"
                  />
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-2">💡 AI uses this to suggest optimal times for tasks based on your energy levels</p>
            </div>

            {/* Bio Section */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <span>✍️</span> About You
              </h3>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell AI about yourself - your goals, preferences, lifestyle, working style, etc. The more context you provide, the better AI can tailor suggestions.

Example: I'm a morning person who likes to tackle creative work early. I have young kids, so I'm usually busy 5-8pm. I prefer to batch similar tasks together. I'm working on launching a startup while freelancing."
                rows={8}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-black bg-white resize-none"
              />
              <p className="text-xs text-gray-500 mt-2">💡 This context helps AI give you personalized suggestions like "This might be easier in the morning based on your schedule"</p>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-200">
              <Link href="/" className="text-gray-600 hover:text-gray-800 font-medium transition-colors">
                ← Back to Todos
              </Link>

              <button
                type="submit"
                disabled={saving}
                className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <span>💾</span>
                    Save Profile
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Info Box */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg px-6 py-4">
          <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
            <span>🔒</span> Privacy & Security
          </h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Your profile data is private and only visible to you</li>
            <li>• AI uses this context to enhance your todo suggestions</li>
            <li>• You can update or delete your information anytime</li>
            <li>• All data is encrypted and stored securely</li>
          </ul>
        </div>
      </main>
    </div>
  );
}
