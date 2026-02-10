import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, Activity, Repeat, Lock } from 'lucide-react';

const UploadStep3 = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-dark-lighter pt-24 pb-12 text-white">
            <div className="container">
                {/* Progress */}
                <div className="max-w-6xl mx-auto mb-16">
                    <div className="flex justify-between text-xs font-bold tracking-widest text-white/60 mb-2">
                        <span>CREATOR ONBOARDING</span>
                        <span className="text-primary">Step 3 of 3</span>
                    </div>
                    <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full w-full"></div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 max-w-6xl mx-auto items-center">
                    <div className="order-2 lg:order-1">
                        <h1 className="text-4xl md:text-5xl font-extrabold mb-6">Fair Play & Fame</h1>
                        <p className="text-white/60 text-lg mb-12 leading-relaxed">
                            To keep the competition fierce and fair, every performance on ShowGrid is judged on three core pillars.
                            Master these to climb the global leaderboard.
                        </p>

                        <div className="space-y-4 mb-12">
                            <div className="bg-white/5 border border-white/10 p-6 rounded-2xl flex items-start gap-6">
                                <div className="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center text-primary shrink-0">
                                    <Zap size={24} />
                                </div>
                                <div>
                                    <h4 className="text-lg font-bold mb-1">Energy</h4>
                                    <p className="text-sm text-white/60 leading-relaxed">Explosive power, stage presence, and captivating facial expressions.</p>
                                </div>
                            </div>
                            <div className="bg-white/5 border border-white/10 p-6 rounded-2xl flex items-start gap-6">
                                <div className="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center text-primary shrink-0">
                                    <Activity size={24} />
                                </div>
                                <div>
                                    <h4 className="text-lg font-bold mb-1">Choreography</h4>
                                    <p className="text-sm text-white/60 leading-relaxed">Creativity in movements, technical difficulty, and seamless flow.</p>
                                </div>
                            </div>
                            <div className="bg-white/5 border border-white/10 p-6 rounded-2xl flex items-start gap-6">
                                <div className="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center text-primary shrink-0">
                                    <Repeat size={24} />
                                </div>
                                <div>
                                    <h4 className="text-lg font-bold mb-1">Sync</h4>
                                    <p className="text-sm text-white/60 leading-relaxed">Flawless timing with the beat and precision in every hit.</p>
                                </div>
                            </div>
                        </div>

                        <button className="btn btn-primary w-full py-4 text-lg justify-center mb-4 shadow-[0_4px_20px_rgba(236,72,153,0.4)] hover:shadow-[0_6px_25px_rgba(236,72,153,0.6)]">
                            Let's Go: Upload Now →
                        </button>
                        <p className="text-center text-sm text-white/50 cursor-pointer hover:text-white transition-colors">Explore Dashboard First</p>
                    </div>

                    <div className="order-1 lg:order-2">
                        {/* Dashboard Preview */}
                        <div className="bg-[#111] border border-white/10 rounded-3xl p-8 relative overflow-hidden">
                            <div className="flex justify-between items-start mb-8">
                                <div>
                                    <span className="text-[10px] font-bold tracking-widest text-white/40 uppercase block mb-1">PREVIEW</span>
                                    <h4 className="text-2xl font-bold">Studio Insights</h4>
                                </div>
                                <div className="flex gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-white/20"></span>
                                    <span className="w-1.5 h-1.5 rounded-full bg-white/20"></span>
                                    <span className="w-1.5 h-1.5 rounded-full bg-white/20"></span>
                                </div>
                            </div>

                            <div className="flex gap-4 mb-8">
                                <div className="flex-1 bg-white/5 rounded-xl p-4">
                                    <span className="text-xs text-white/50 block mb-2">Total Views</span>
                                    <div className="text-2xl font-extrabold mb-2">12.4K</div>
                                    <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                                        <div className="h-full bg-primary w-[70%]"></div>
                                    </div>
                                </div>
                                <div className="flex-1 bg-white/5 rounded-xl p-4">
                                    <span className="text-xs text-white/50 block mb-2">Avg Score</span>
                                    <div className="text-2xl font-extrabold mb-2">8.4</div>
                                    <div className="flex gap-1 text-[8px] text-primary">● ● ● ● <span className="text-white/20">●</span></div>
                                </div>
                            </div>

                            <div className="h-48 bg-white/5 rounded-2xl relative mb-8 flex items-end justify-between px-4 pb-0 overflow-hidden">
                                <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] z-10 flex items-center justify-center">
                                    <button className="bg-primary text-white border-0 px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2">
                                        <Lock size={14} /> Unlock after 1st Upload
                                    </button>
                                </div>
                                <div className="w-full h-[60%] flex items-end gap-2">
                                    <div className="flex-1 bg-white/10 rounded-t h-[30%]"></div>
                                    <div className="flex-1 bg-white/10 rounded-t h-[50%]"></div>
                                    <div className="flex-1 bg-white/10 rounded-t h-[40%]"></div>
                                    <div className="flex-1 bg-white/10 rounded-t h-[70%]"></div>
                                    <div className="flex-1 bg-primary rounded-t h-full shadow-[0_0_15px_#ec4899]"></div>
                                    <div className="flex-1 bg-white/10 rounded-t h-[20%]"></div>
                                    <div className="flex-1 bg-white/10 rounded-t h-[60%]"></div>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center gap-4 text-xs text-white/60">
                                    <span className="w-16">Energy</span>
                                    <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                                        <div className="h-full bg-primary w-[90%]"></div>
                                    </div>
                                    <span className="w-6 text-right font-bold text-white">9.2</span>
                                </div>
                                <div className="flex items-center gap-4 text-xs text-white/60">
                                    <span className="w-16">Sync</span>
                                    <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                                        <div className="h-full bg-primary w-[75%]"></div>
                                    </div>
                                    <span className="w-6 text-right font-bold text-white">7.5</span>
                                </div>
                            </div>
                        </div>
                        <p className="text-center text-xs text-white/40 mt-4 max-w-sm mx-auto"> Detailed analytics for every beat. Tracking your growth from local talent to global superstar.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UploadStep3;
