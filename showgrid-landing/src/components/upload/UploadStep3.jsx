import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, Activity, Repeat, ArrowRight, Lock } from 'lucide-react';
import Navbar from '../Navbar';

const UploadStep3 = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-dark text-white">
            <Navbar />

            <div className="pt-32 pb-20 container max-w-6xl mx-auto">
                {/* Progress */}
                <div className="flex justify-between items-center mb-12 max-w-4xl mx-auto">
                    <div className="text-xs font-bold tracking-widest text-white/40 uppercase">Creator Onboarding</div>
                    <div className="text-xl font-bold text-primary">Step 3 of 3</div>
                </div>
                <div className="h-1 bg-white/10 rounded-full max-w-4xl mx-auto mb-2 overflow-hidden">
                    <div className="h-full bg-primary w-full"></div>
                </div>
                <div className="text-right text-xs text-white/40 max-w-4xl mx-auto mb-16">Finalizing your profile</div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                    {/* Left: Content */}
                    <div>
                        <h1 className="text-5xl font-extrabold mb-6">Fair Play & Fame</h1>
                        <p className="text-xl text-white/60 leading-relaxed mb-12">
                            To keep the competition fierce and fair, every performance on ShowGrid is judged on three core pillars. Master these to climb the global leaderboard.
                        </p>

                        <div className="space-y-6">
                            {/* Pillar 1 */}
                            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex gap-6 hover:bg-white/10 transition-colors group">
                                <div className="w-12 h-12 bg-[#3b1728] rounded-lg flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                                    <Zap size={24} fill="currentColor" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold mb-2">Energy</h3>
                                    <p className="text-white/50 text-sm leading-relaxed">
                                        Explosive power, stage presence, and captivating facial expressions.
                                    </p>
                                </div>
                            </div>

                            {/* Pillar 2 */}
                            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex gap-6 hover:bg-white/10 transition-colors group">
                                <div className="w-12 h-12 bg-[#3b1728] rounded-lg flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                                    <Activity size={24} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold mb-2">Choreography</h3>
                                    <p className="text-white/50 text-sm leading-relaxed">
                                        Creativity in movements, technical difficulty, and seamless flow.
                                    </p>
                                </div>
                            </div>

                            {/* Pillar 3 */}
                            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex gap-6 hover:bg-white/10 transition-colors group">
                                <div className="w-12 h-12 bg-[#3b1728] rounded-lg flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                                    <Repeat size={24} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold mb-2">Sync</h3>
                                    <p className="text-white/50 text-sm leading-relaxed">
                                        Flawless timing with the beat and precision in every hit.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="mt-12">
                            <button
                                onClick={() => navigate('/upload/step-4')}
                                className="w-full btn btn-primary py-4 text-xl font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all"
                            >
                                Let's Go: Upload Now <ArrowRight size={24} />
                            </button>
                            <p className="text-center text-white/30 text-xs mt-4 font-bold tracking-widest uppercase">Explore Dashboard First</p>
                        </div>
                    </div>

                    {/* Right: Dashboard Preview */}
                    <div className="bg-[#150a10] border border-white/10 rounded-3xl p-6 relative overflow-hidden shadow-2xl">
                        {/* Header */}
                        <div className="flex justify-between items-center mb-8 border-b border-white/5 pb-4">
                            <div>
                                <div className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-1">PREVIEW</div>
                                <h3 className="text-xl font-bold">Studio Insights</h3>
                            </div>
                            <div className="flex gap-1.5">
                                <div className="w-2 h-2 rounded-full bg-red-500"></div>
                                <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                            </div>
                        </div>

                        {/* Stats */}
                        <div className="grid grid-cols-2 gap-4 mb-6">
                            <div className="bg-white/5 rounded-xl p-4">
                                <div className="text-xs text-white/40 mb-2">Total Views</div>
                                <div className="text-3xl font-extrabold mb-2">12.4K</div>
                                <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                                    <div className="h-full bg-primary w-2/3"></div>
                                </div>
                            </div>
                            <div className="bg-white/5 rounded-xl p-4">
                                <div className="text-xs text-white/40 mb-2">Avg Score</div>
                                <div className="text-3xl font-extrabold mb-2">8.4</div>
                                <div className="flex gap-1">
                                    <div className="w-2 h-2 rounded-full bg-primary"></div>
                                    <div className="w-2 h-2 rounded-full bg-primary"></div>
                                    <div className="w-2 h-2 rounded-full bg-primary"></div>
                                    <div className="w-2 h-2 rounded-full bg-white/20"></div>
                                </div>
                            </div>
                        </div>

                        {/* Graph Blur */}
                        <div className="bg-white/5 rounded-2xl p-6 h-48 relative overflow-hidden mb-6 flex items-end gap-3 justify-between">
                            <div className="absolute inset-0 backdrop-blur-sm bg-black/40 flex items-center justify-center z-10">
                                <button className="bg-primary hover:bg-pink-600 text-white px-6 py-2 rounded-full text-xs font-bold flex items-center gap-2 transition-colors">
                                    <Lock size={12} /> Unlock after 1st Upload
                                </button>
                            </div>
                            {/* Fake bars */}
                            <div className="w-full bg-white/10 h-[30%] rounded-t-lg"></div>
                            <div className="w-full bg-white/10 h-[50%] rounded-t-lg"></div>
                            <div className="w-full bg-white/10 h-[40%] rounded-t-lg"></div>
                            <div className="w-full bg-primary/40 h-[70%] rounded-t-lg"></div>
                            <div className="w-full bg-primary h-[90%] rounded-t-lg shadow-[0_0_15px_rgba(236,72,153,0.5)]"></div>
                            <div className="w-full bg-white/10 h-[25%] rounded-t-lg"></div>
                            <div className="w-full bg-white/10 h-[60%] rounded-t-lg"></div>
                        </div>

                        {/* Metrics */}
                        <div className="space-y-4">
                            <div className="flex justify-between text-xs font-bold text-white/30 uppercase tracking-widest mb-2">Performance Metrics</div>

                            <div className="flex items-center gap-4">
                                <div className="w-16 text-xs font-bold text-white/60">Energy</div>
                                <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                                    <div className="h-full bg-gradient-to-r from-primary/50 to-primary w-[92%]"></div>
                                </div>
                                <div className="text-xs font-bold text-white">9.2</div>
                            </div>

                            <div className="flex items-center gap-4">
                                <div className="w-16 text-xs font-bold text-white/60">Sync</div>
                                <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                                    <div className="h-full bg-gradient-to-r from-primary/50 to-primary w-[75%]"></div>
                                </div>
                                <div className="text-xs font-bold text-white">7.5</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="text-center mt-12 max-w-lg mx-auto">
                    <p className="text-white/40 text-sm leading-relaxed">
                        Detailed analytics for every beat. Tracking your growth from local talent to global superstar.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default UploadStep3;
