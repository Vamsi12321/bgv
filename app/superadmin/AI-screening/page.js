"use client";

import { useState } from "react";
import { Upload, FileText, Sparkles, Loader2, CheckCircle } from "lucide-react";

/* ------------------------------
   Temporary Dummy Resume Data
-------------------------------- */
const sampleCandidates = [
  {
    id: 1,
    name: "Rohit Sharma",
    experience: "4.2 years",
    skills: ["React", "Node.js", "MongoDB"],
    score: 92,
  },
  {
    id: 2,
    name: "Anita Verma",
    experience: "3.8 years",
    skills: ["Next.js", "Tailwind", "Express"],
    score: 87,
  },
  {
    id: 3,
    name: "Praveen Kumar",
    experience: "5.1 years",
    skills: ["React", "Redux", "TypeScript"],
    score: 84,
  },
  {
    id: 4,
    name: "Sana Shaikh",
    experience: "2.9 years",
    skills: ["JavaScript", "UI/UX", "HTML/CSS"],
    score: 79,
  },
  {
    id: 5,
    name: "Vikram Singh",
    experience: "6.1 years",
    skills: ["Node.js", "DevOps", "Docker"],
    score: 73,
  },
];

export default function AIMatcherPage() {
  const [jdText, setJdText] = useState(""); // optional for manual paste
  const [jdFile, setJdFile] = useState(null); // store file object
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  /* ------------------------------
        Handle Get Matches
  ------------------------------ */
  const handleGetMatches = () => {
    if (!jdText.trim() && !jdFile) {
      alert("Please paste or upload a Job Description first.");
      return;
    }

    setLoading(true);

    // Simulate backend AI scoring (1.2 seconds)
    setTimeout(() => {
      const results = [...sampleCandidates].sort((a, b) => b.score - a.score);
      setMatches(results.slice(0, 5)); // Top 5 matches
      setLoading(false);
    }, 1200);
  };

  /* ------------------------------
        Render UI
  ------------------------------ */
  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-10 text-gray-900">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-[#ff004f] flex items-center gap-2">
            <Sparkles size={30} /> AI Resume Matcher
          </h1>
          <p className="text-gray-600 mt-1">
            Upload a Job Description and instantly get top-5 matching
            candidates.
          </p>
        </div>

        {/* JD Input Card */}
        <div className="bg-white border border-gray-200 shadow-sm rounded-2xl p-6 space-y-4">
          <h2 className="text-xl font-semibold flex items-center gap-2 text-gray-800">
            <FileText /> Job Description
          </h2>

          {/* JD Textarea (optional) */}
          <textarea
            placeholder="Paste job description here..."
            value={jdText}
            onChange={(e) => setJdText(e.target.value)}
            className="w-full border rounded-lg p-4 min-h-[160px] resize-none focus:ring-2 focus:ring-[#ff004f]"
          />

          {/* Upload JD File */}
          <label className="cursor-pointer flex items-center gap-2 text-sm text-[#ff004f] hover:underline w-fit">
            <Upload size={18} /> Upload JD (txt/pdf)
            <input
              type="file"
              accept=".txt,.pdf"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                setJdFile(file);
                setUploadSuccess(true);
              }}
            />
          </label>

          {/* Upload success indicator */}
          {uploadSuccess && (
            <p className="flex items-center gap-1 text-green-600 text-sm">
              <CheckCircle size={16} /> JD uploaded successfully
            </p>
          )}

          {/* Get Matches Button */}
          <button
            onClick={handleGetMatches}
            className="bg-[#ff004f] hover:bg-[#e60047] text-white font-medium px-6 py-3 rounded-lg w-full sm:w-auto flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" /> Matching…
              </>
            ) : (
              <>
                <Sparkles size={18} /> Get Top Matches
              </>
            )}
          </button>
        </div>

        {/* Matches Section */}
        {matches.length > 0 && (
          <div className="bg-white border border-gray-200 shadow-md rounded-2xl p-6">
            <h2 className="text-xl font-bold text-[#ff004f] mb-4">
              🎯 Top Candidate Matches
            </h2>

            <div className="space-y-4">
              {matches.map((c, i) => (
                <div
                  key={c.id}
                  className="p-4 border rounded-xl hover:bg-gray-50 transition flex flex-col sm:flex-row justify-between"
                >
                  <div>
                    <p className="font-semibold text-lg">
                      {i + 1}. {c.name}
                    </p>
                    <p className="text-gray-600 text-sm">
                      Experience: {c.experience}
                    </p>
                    <p className="text-gray-700 text-sm">
                      Skills:{" "}
                      <span className="font-medium">{c.skills.join(", ")}</span>
                    </p>
                  </div>

                  <div className="flex items-center justify-center mt-3 sm:mt-0">
                    <div className="bg-[#ff004f]/10 text-[#ff004f] font-bold px-5 py-2 rounded-lg">
                      Score: {c.score}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
