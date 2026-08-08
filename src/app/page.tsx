"use client";

import { useState, useEffect } from "react";
import { Bot, Sparkles, RefreshCw, Send, Shield, Globe, ExternalLink, Activity, BrainCircuit, CheckCircle2, XCircle, Sun, Moon, AlertTriangle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "next-themes";

export default function Home() {
  const [agentId, setAgentId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [domain, setDomain] = useState("");
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [triggering, setTriggering] = useState(false);
  const [triggerLog, setTriggerLog] = useState<{status: string, rationale?: string, error?: string} | null>(null);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
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
    setTriggerLog(null);
    try {
      const res = await fetch("/api/cron/run");
      const data = await res.json();
      
      if (!res.ok) {
        setTriggerLog({ status: 'error', error: data.error || 'Failed to trigger cron. Ensure your GOOGLE_GENERATIVE_AI_API_KEY is correct.' });
      } else if (data.results && data.results.length > 0) {
        const result = data.results.find((r: any) => r.agentId === agentId);
        if (result) {
          setTriggerLog({ status: result.status, rationale: result.rationale });
        } else {
            setTriggerLog({ status: 'error', error: 'No results found for this agent.' });
        }
      }

      if (agentId) fetchFeed(agentId);
    } catch (err: any) {
      console.error(err);
      setTriggerLog({ status: 'error', error: err.message || 'An unexpected error occurred.' });
    }
    setTriggering(false);
  };

  return (
    <main className="min-h-screen p-6 md:p-12 lg:p-24 max-w-7xl mx-auto flex flex-col gap-8 transition-colors duration-300">
      <motion.header 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6"
      >
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-3 py-1 text-xs font-semibold bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400 rounded-full border border-blue-500/20 dark:border-blue-500/30">
              ABTalks Hackathon - Problem Statement 3
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-3 flex items-center gap-3 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400">
            <BrainCircuit className="text-blue-500 dark:text-blue-400 w-10 h-10" />
            Autonomous AI Creator
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-lg max-w-2xl">
            A self-driving AI persona that autonomously discovers topics, applies strict editorial judgment, and publishes expert content.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-4">
            {mounted && (
                <button
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="p-3 rounded-xl bg-slate-200/50 dark:bg-slate-800/50 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300/50 dark:hover:bg-slate-700/50 transition-all"
                >
                {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                </button>
            )}
            {agentId && (
            <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={triggerCron}
                disabled={triggering}
                className="glass-panel px-6 py-4 rounded-xl font-semibold flex items-center gap-3 text-blue-600 dark:text-blue-400 bg-white/50 dark:bg-slate-900/50 border border-blue-500/20 dark:border-blue-500/40 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-all disabled:opacity-50 shadow-lg shadow-blue-900/5 dark:shadow-blue-900/20"
            >
                <RefreshCw className={`w-5 h-5 ${triggering ? "animate-spin text-blue-500 dark:text-white" : ""}`} />
                {triggering ? "Agent is Thinking..." : "Trigger Autonomous Run"}
            </motion.button>
            )}
        </div>
      </motion.header>

      {!agentId ? (
        <motion.section 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="glass-panel p-8 md:p-12 rounded-3xl mt-8 max-w-2xl mx-auto w-full relative overflow-hidden bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 shadow-xl"
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-purple-500"></div>
          
          <div className="flex justify-center mb-8">
            <div className="p-5 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-500/20 dark:to-purple-500/20 rounded-2xl border border-blue-200 dark:border-blue-500/30 shadow-[0_0_30px_rgba(59,130,246,0.1)] dark:shadow-[0_0_30px_rgba(59,130,246,0.3)]">
              <Bot className="w-12 h-12 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <h2 className="text-3xl font-bold text-center mb-3 text-slate-900 dark:text-white">Initialize Persona</h2>
          <p className="text-slate-600 dark:text-slate-400 text-center mb-10 text-lg">
            Define the identity of your autonomous creator. This will shape its editorial judgment and writing style.
          </p>
          <form onSubmit={initializeAgent} className="flex flex-col gap-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wider">Agent Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Ada Lovelace"
                className="w-full bg-white dark:bg-slate-900/60 border border-slate-300 dark:border-slate-700 rounded-xl px-5 py-4 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-500/50 transition-all text-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wider">Domain / Expertise</label>
              <input
                type="text"
                required
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                placeholder="e.g. AI Security, Robotics, Generative Art"
                className="w-full bg-white dark:bg-slate-900/60 border border-slate-300 dark:border-slate-700 rounded-xl px-5 py-4 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-500/50 transition-all text-lg"
              />
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="mt-6 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 dark:hover:from-blue-500 dark:hover:to-blue-400 text-white font-bold py-4 px-6 rounded-xl flex items-center justify-center gap-3 transition-all shadow-lg shadow-blue-500/20 dark:shadow-blue-900/30 disabled:opacity-50 text-lg"
            >
              {loading ? (
                <RefreshCw className="w-6 h-6 animate-spin" />
              ) : (
                <Send className="w-6 h-6" />
              )}
              {loading ? "Booting Systems..." : "Launch Autonomous Agent"}
            </motion.button>
          </form>
        </motion.section>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-4">
          {/* Sidebar */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-4"
          >
            <div className="glass-panel p-6 rounded-3xl sticky top-8 bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 border-t border-t-blue-500/30">
              <div className="flex items-center gap-4 mb-8 pb-6 border-b border-slate-200 dark:border-slate-800">
                <div className="relative">
                  <div className="p-4 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-500/20 dark:to-purple-500/20 rounded-2xl border border-blue-200 dark:border-blue-500/30">
                    <Bot className="w-10 h-10 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white dark:border-slate-900 animate-pulse"></div>
                </div>
                <div>
                  <h3 className="font-bold text-2xl text-slate-900 dark:text-white">Active Agent</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="w-2 h-2 rounded-full bg-green-500 dark:bg-green-400"></span>
                    <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Online & Autonomous</span>
                  </div>
                </div>
              </div>
              
              <div className="space-y-6">
                <div className="bg-slate-100/50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-3 text-slate-700 dark:text-slate-300 mb-1">
                    <Shield className="w-5 h-5 text-purple-500 dark:text-purple-400" />
                    <span className="text-sm font-semibold uppercase tracking-wider">Agent ID</span>
                  </div>
                  <span className="font-mono text-slate-900 dark:text-white break-all">{agentId}</span>
                </div>

                <div className="bg-slate-100/50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-3 text-slate-700 dark:text-slate-300 mb-2">
                    <Activity className="w-5 h-5 text-blue-500 dark:text-blue-400" />
                    <span className="text-sm font-semibold uppercase tracking-wider">Engine Specs</span>
                  </div>
                  <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                    <li className="flex items-center gap-2"><Globe className="w-4 h-4 text-green-500 dark:text-green-400"/> Live Google News RSS Search</li>
                    <li className="flex items-center gap-2"><Sparkles className="w-4 h-4 text-yellow-500 dark:text-yellow-400"/> Google Gemini 1.5 Flash</li>
                    <li className="flex items-center gap-2"><BrainCircuit className="w-4 h-4 text-red-500 dark:text-red-400"/> Strict Editorial Judgment</li>
                  </ul>
                </div>
              </div>
              
              <button 
                onClick={() => {
                  localStorage.removeItem("activeAgentId");
                  setAgentId(null);
                  setPosts([]);
                  setTriggerLog(null);
                }}
                className="w-full mt-8 border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 py-3 rounded-xl transition-all font-medium"
              >
                Reset System / New Agent
              </button>
            </div>
          </motion.div>

          {/* Feed */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-8 flex flex-col gap-6"
          >
            <div className="flex justify-between items-end mb-2 px-2">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Activity className="text-blue-600 dark:text-blue-400" />
                Publishing Feed
              </h2>
              <span className="text-sm text-slate-600 dark:text-slate-400 font-medium bg-slate-200 dark:bg-slate-800 px-3 py-1 rounded-full">{posts.length} Posts generated</span>
            </div>

            <AnimatePresence>
              {triggering && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="glass-panel p-6 rounded-2xl border-l-4 border-l-blue-500 overflow-hidden bg-white/50 dark:bg-slate-900/50"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-100 dark:bg-blue-500/20 rounded-full animate-pulse-slow">
                      <BrainCircuit className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-white text-lg">Agent is currently analyzing...</h4>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">1. Fetching live news for domain • 2. Reading memory • 3. Applying editorial judgment</p>
                    </div>
                  </div>
                </motion.div>
              )}

              {!triggering && triggerLog && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={`glass-panel p-6 rounded-2xl border-l-4 overflow-hidden mb-4 bg-white/50 dark:bg-slate-900/50 ${
                    triggerLog.status === 'published' ? 'border-l-green-500 dark:bg-green-500/5' : 
                    triggerLog.status === 'error' ? 'border-l-red-500 dark:bg-red-500/5' :
                    'border-l-yellow-500 dark:bg-yellow-500/5'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`p-2 rounded-full ${
                        triggerLog.status === 'published' ? 'bg-green-100 dark:bg-green-500/20' : 
                        triggerLog.status === 'error' ? 'bg-red-100 dark:bg-red-500/20' :
                        'bg-yellow-100 dark:bg-yellow-500/20'
                        }`}>
                      {triggerLog.status === 'published' ? <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-400" /> : 
                       triggerLog.status === 'error' ? <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" /> :
                       <XCircle className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-white text-lg">
                        {triggerLog.status === 'published' ? 'New Post Published!' : 
                         triggerLog.status === 'error' ? 'Error Executing Cron' :
                         'Topics Rejected by AI'}
                      </h4>
                      {triggerLog.rationale && (
                         <div className="mt-2 bg-slate-100 dark:bg-slate-900/50 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
                           <p className="text-sm text-slate-700 dark:text-slate-300">
                             <span className="font-semibold text-slate-900 dark:text-slate-200">AI Rationale:</span> {triggerLog.rationale}
                           </p>
                         </div>
                      )}
                      {triggerLog.error && (
                         <div className="mt-2 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border border-red-200 dark:border-red-900/50">
                           <p className="text-sm text-red-600 dark:text-red-400 font-mono">
                             {triggerLog.error}
                           </p>
                         </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {posts.length === 0 && !triggering ? (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="glass-panel p-16 rounded-3xl flex flex-col items-center justify-center text-center border-dashed border-2 border-slate-300 dark:border-slate-700/50 bg-white/30 dark:bg-transparent"
              >
                <div className="p-6 bg-slate-100 dark:bg-slate-800/50 rounded-full mb-6">
                  <RefreshCw className="w-12 h-12 text-slate-400 dark:text-slate-500 animate-pulse-slow" />
                </div>
                <h3 className="text-2xl font-bold mb-3 text-slate-900 dark:text-white">Awaiting Content</h3>
                <p className="text-slate-600 dark:text-slate-400 max-w-md text-lg">
                  The agent is active. Click <strong>"Trigger Autonomous Run"</strong> to simulate the cron job discovering a topic, making an editorial decision, and publishing.
                </p>
              </motion.div>
            ) : (
              <div className="space-y-6">
                <AnimatePresence>
                  {posts.map((post, index) => (
                    <motion.article 
                      key={post.id} 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="glass-panel p-8 rounded-3xl relative group bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 shadow-sm"
                    >
                      <div className="absolute top-0 left-8 w-1 h-full bg-gradient-to-b from-blue-400 to-transparent dark:from-blue-500/50 -z-10 rounded-full"></div>
                      
                      <div className="flex justify-between items-start mb-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center border-2 border-white dark:border-slate-800 shadow-lg">
                            <Bot className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <h4 className="font-bold text-slate-900 dark:text-white leading-tight">Agent Output</h4>
                            <span className="text-xs text-slate-500 dark:text-slate-400">
                              {new Date(post.createdAt).toLocaleString(undefined, { 
                                month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
                              })}
                            </span>
                          </div>
                        </div>
                        <span className="text-xs font-mono bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-3 py-1 rounded-md border border-slate-200 dark:border-slate-700">
                          ID: {post.id.slice(0, 8)}
                        </span>
                      </div>
                      
                      <div className="prose prose-slate dark:prose-invert max-w-none mb-8 text-slate-700 dark:text-slate-200">
                        {post.text.split('\n').map((paragraph: string, idx: number) => (
                          <p key={idx} className="text-lg leading-relaxed mb-4">{paragraph}</p>
                        ))}
                      </div>

                      <div className="bg-slate-50 dark:bg-slate-900/80 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-inner">
                        <h4 className="text-sm font-bold text-blue-600 dark:text-blue-400 mb-3 flex items-center gap-2 uppercase tracking-wide">
                          <BrainCircuit className="w-4 h-4" />
                          Publishing Rationale (Editorial Judgment)
                        </h4>
                        <p className="text-sm text-slate-700 dark:text-slate-300 italic border-l-2 border-blue-400 dark:border-blue-500/50 pl-4 py-1">
                          "{post.rationale}"
                        </p>
                      </div>
                      
                      {post.sources && post.sources.length > 0 && (
                        <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-800/50 flex flex-wrap gap-3 items-center">
                          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Sources:</span>
                          {post.sources.map((url: string, i: number) => (
                            <a 
                              key={i} 
                              href={url} 
                              target="_blank" 
                              rel="noreferrer"
                              className="text-xs flex items-center gap-1.5 bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-300 px-3 py-1.5 rounded-lg border border-blue-200 dark:border-blue-500/20 hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-colors"
                            >
                              <ExternalLink className="w-3 h-3" />
                              Link {i + 1}
                            </a>
                          ))}
                        </div>
                      )}
                    </motion.article>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </main>
  );
}
