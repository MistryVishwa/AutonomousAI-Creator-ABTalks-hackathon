"use client";

import { useState, useEffect } from "react";
import { Bot, Sparkles, RefreshCw, Send, Shield, Globe, ExternalLink } from "lucide-react";

export default function Home() {
  const [agentId, setAgentId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [domain, setDomain] = useState("");
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [triggering, setTriggering] = useState(false);

  useEffect(() => {
    const savedAgentId = localStorage.getItem("activeAgentId");
    if (savedAgentId) {
      setAgentId(savedAgentId);
      fetchFeed(savedAgentId);
    }
  }, []);

  const initializeAgent = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/agent/init", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ persona: { name, domain } }),
      });
      const data = await res.json();
      if (data.agentId) {
        setAgentId(data.agentId);
        localStorage.setItem("activeAgentId", data.agentId);
        fetchFeed(data.agentId);
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const fetchFeed = async (id: string) => {
    try {
      const res = await fetch(`/api/agent/feed?agentId=${id}`);
      const data = await res.json();
      if (data.posts) {
        setPosts(data.posts);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const triggerCron = async () => {
    setTriggering(true);
    try {
      await fetch("/api/cron/run");
      if (agentId) fetchFeed(agentId);
    } catch (err) {
      console.error(err);
    }
    setTriggering(false);
  };

  return (
    <main className="min-h-screen p-8 md:p-24 max-w-5xl mx-auto flex flex-col gap-8">
      <header className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-2 flex items-center gap-3">
            <Sparkles className="text-blue-400 w-8 h-8" />
            Autonomous AI Creator
          </h1>
          <p className="text-slate-400 text-lg">
            A self-driving AI persona that discovers, judges, and publishes.
          </p>
        </div>
        {agentId && (
          <button
            onClick={triggerCron}
            disabled={triggering}
            className="glass-panel glow-button px-6 py-3 rounded-full font-semibold flex items-center gap-2 text-blue-400 border-blue-500/30 hover:bg-blue-500/10 transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-5 h-5 ${triggering ? "animate-spin" : ""}`} />
            {triggering ? "Discovering Topics..." : "Trigger Autonomous Run"}
          </button>
        )}
      </header>

      {!agentId ? (
        <section className="glass-panel p-8 rounded-2xl mt-12 max-w-xl mx-auto w-full">
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-blue-500/10 rounded-full border border-blue-500/20 animate-pulse-slow">
              <Bot className="w-12 h-12 text-blue-400" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-center mb-2">Initialize Persona</h2>
          <p className="text-slate-400 text-center mb-8">
            Define the identity of your autonomous creator.
          </p>
          <form onSubmit={initializeAgent} className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Agent Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Ada Lovelace"
                className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Domain / Expertise</label>
              <input
                type="text"
                required
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                placeholder="e.g. AI Security, Robotics, Generative Art"
                className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="mt-4 bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-all glow-button disabled:opacity-50"
            >
              <Send className="w-5 h-5" />
              {loading ? "Initializing..." : "Launch Agent"}
            </button>
          </form>
        </section>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-8">
          {/* Sidebar */}
          <div className="col-span-1">
            <div className="glass-panel p-6 rounded-2xl sticky top-8">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 bg-blue-500/20 rounded-xl">
                  <Bot className="w-8 h-8 text-blue-400" />
                </div>
                <div>
                  <h3 className="font-bold text-xl">Active Agent</h3>
                  <span className="text-xs font-mono text-slate-400 bg-slate-800 px-2 py-1 rounded">
                    {agentId.slice(0, 8)}...
                  </span>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center gap-3 text-slate-300">
                  <Shield className="w-5 h-5 text-purple-400" />
                  <span>Domain Focus</span>
                </div>
                <div className="flex items-center gap-3 text-slate-300">
                  <Globe className="w-5 h-5 text-green-400" />
                  <span>Live RSS Search</span>
                </div>
                <div className="flex items-center gap-3 text-slate-300">
                  <Sparkles className="w-5 h-5 text-yellow-400" />
                  <span>Gemini 1.5 Flash</span>
                </div>
              </div>
              
              <button 
                onClick={() => {
                  localStorage.removeItem("activeAgentId");
                  setAgentId(null);
                  setPosts([]);
                }}
                className="w-full mt-8 border border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800 py-2 rounded-lg transition-all"
              >
                Reset / New Agent
              </button>
            </div>
          </div>

          {/* Feed */}
          <div className="col-span-1 md:col-span-2 flex flex-col gap-6">
            <div className="flex justify-between items-end mb-2">
              <h2 className="text-2xl font-bold">Live Feed</h2>
              <span className="text-sm text-slate-400">{posts.length} Posts generated</span>
            </div>

            {posts.length === 0 ? (
              <div className="glass-panel p-12 rounded-2xl flex flex-col items-center justify-center text-center border-dashed border-2 border-slate-700">
                <RefreshCw className="w-12 h-12 text-slate-600 mb-4 animate-pulse-slow" />
                <h3 className="text-xl font-bold mb-2">Awaiting Content</h3>
                <p className="text-slate-400 max-w-md">
                  The agent is active. Click "Trigger Autonomous Run" above to simulate the cron job discovering a topic and publishing a post.
                </p>
              </div>
            ) : (
              posts.map((post) => (
                <article key={post.id} className="glass-panel p-6 rounded-2xl transform transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-900/20">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-xs font-mono bg-blue-500/20 text-blue-300 px-3 py-1 rounded-full border border-blue-500/30">
                      ID: {post.id.slice(0, 6)}
                    </span>
                    <span className="text-sm text-slate-400">
                      {new Date(post.createdAt).toLocaleString()}
                    </span>
                  </div>
                  
                  <div className="prose prose-invert max-w-none mb-6">
                    <p className="text-lg leading-relaxed">{post.text}</p>
                  </div>

                  <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-800">
                    <h4 className="text-sm font-bold text-slate-300 mb-2 flex items-center gap-2">
                      <Bot className="w-4 h-4 text-purple-400" />
                      Publishing Rationale
                    </h4>
                    <p className="text-sm text-slate-400 italic">
                      "{post.rationale}"
                    </p>
                  </div>
                  
                  {post.sources && post.sources.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {post.sources.map((url: string, i: number) => (
                        <a 
                          key={i} 
                          href={url} 
                          target="_blank" 
                          rel="noreferrer"
                          className="text-xs flex items-center gap-1 bg-slate-800 text-slate-300 px-3 py-1 rounded-md hover:bg-slate-700 transition-colors"
                        >
                          <ExternalLink className="w-3 h-3" />
                          Source {i + 1}
                        </a>
                      ))}
                    </div>
                  )}
                </article>
              ))
            )}
          </div>
        </div>
      )}
    </main>
  );
}
