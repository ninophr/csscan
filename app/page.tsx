"use client";

import { useState } from "react";

export default function Home() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<any>(null);
  const [error, setError] = useState("");

  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setReport(null);
    try {
      const res = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur inconnue");
      setReport(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckout = async () => {
    const res = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    });
    const data = await res.json();
    if (data.url) window.location.href = data.url;
  };

  const scoreColor = (score: number) => {
    if (score >= 80) return "text-green-400";
    if (score >= 60) return "text-yellow-400";
    return "text-red-400";
  };

  return (
    <main className="min-h-screen bg-gray-950 text-white flex flex-col items-center px-4 py-16">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-3 tracking-tight">
            CSS<span className="text-indigo-400">can</span>
          </h1>
          <p className="text-gray-400 text-lg">
            Audit visuel instantané de n&apos;importe quel site web.
          </p>
        </div>

        <form onSubmit={handleScan} className="flex gap-2 mb-8">
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://votre-site.com"
            required
            className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition"
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 px-6 py-3 rounded-lg font-semibold transition"
          >
            {loading ? "Analyse..." : "Scanner"}
          </button>
        </form>

        {error && (
          <div className="bg-red-900/30 border border-red-700 rounded-lg p-4 text-red-300 mb-6">
            {error}
          </div>
        )}

        {report && (
          <div className="space-y-6">
            {/* Score global */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 text-center">
              <p className="text-gray-400 mb-1 text-sm uppercase tracking-widest">Score global</p>
              <p className={`text-6xl font-bold ${scoreColor(report.score)}`}>{report.score}<span className="text-2xl text-gray-500">/100</span></p>
            </div>

            {/* Métriques */}
            <div className="grid grid-cols-2 gap-4">
              {report.metrics.map((m: any) => (
                <div key={m.name} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-400">{m.name}</span>
                    <span className={`font-bold ${scoreColor(m.score)}`}>{m.score}/100</span>
                  </div>
                  <div className="w-full bg-gray-800 rounded-full h-1.5">
                    <div
                      className="h-1.5 rounded-full bg-indigo-500"
                      style={{ width: `${m.score}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-2">{m.detail}</p>
                </div>
              ))}
            </div>

            {/* Suggestions */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
              <h2 className="font-semibold mb-4 text-gray-200">💡 Suggestions</h2>
              <ul className="space-y-2">
                {report.suggestions.map((s: string, i: number) => (
                  <li key={i} className="flex gap-2 text-sm text-gray-300">
                    <span className="text-indigo-400 mt-0.5">→</span>
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* CTA Rapport complet */}
            <div className="bg-indigo-900/20 border border-indigo-700 rounded-xl p-6 text-center">
              <p className="text-gray-300 mb-1 font-medium">Rapport complet avec screenshots</p>
              <p className="text-gray-500 text-sm mb-4">Analyse détaillée + export PDF — 5€ one-shot</p>
              <button
                onClick={handleCheckout}
                className="bg-indigo-600 hover:bg-indigo-500 px-8 py-3 rounded-lg font-semibold transition"
              >
                Obtenir le rapport complet — 5€
              </button>
            </div>
          </div>
        )}

        <p className="text-center text-gray-600 text-xs mt-12">
          Audit gratuit · Rapport complet à 5€ · Powered by CSScan
        </p>
      </div>
    </main>
  );
}
