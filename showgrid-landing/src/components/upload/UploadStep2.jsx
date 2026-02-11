import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Pause, Download, Volume2, RotateCcw, RotateCw, AlertCircle, CheckCircle, ArrowRight } from 'lucide-react';
import { useVideo } from '../../context/VideoContext';
import Navbar from '../Navbar';

const UploadStep2 = () => {
    const navigate = useNavigate();
    const { selectedChallenge } = useVideo();
    const [isPlaying, setIsPlaying] = useState(false);
    const audioRef = useRef(null);

    // If no challenge selected, redirect
    useEffect(() => {
        if (!selectedChallenge) {
            navigate('/challenges');
        }
    }, [selectedChallenge, navigate]);

    const togglePlay = () => {
        if (audioRef.current) {
            if (isPlaying) {
                audioRef.current.pause();
            } else {
                audioRef.current.play();
            }
            setIsPlaying(!isPlaying);
        }
    };

    if (!selectedChallenge) return null;

    return (
        <div className="min-h-screen bg-dark text-white">
            <Navbar />

            <div className="pt-32 pb-20 container max-w-6xl mx-auto">
                {/* Progress */}
                <div className="flex justify-between items-center mb-12 max-w-4xl mx-auto">
                    <div className="text-xs font-bold tracking-widest text-white/40 uppercase">Onboarding Progress</div>
                    <div className="text-xl font-bold text-primary">66%</div>
                </div>
                <div className="h-1 bg-white/10 rounded-full max-w-4xl mx-auto mb-2 overflow-hidden">
                    <div className="h-full bg-primary w-2/3"></div>
                </div>
                <div className="text-right text-xs text-white/40 max-w-4xl mx-auto mb-16">Step 2 of 3: Audio Mastery</div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-6xl mx-auto items-start">
                    {/* Left: Audio Player */}
                    <div>
                        <h1 className="text-4xl font-extrabold mb-4">Master the Audio</h1>
                        <p className="text-white/60 mb-8 leading-relaxed">
                            Every viral dance starts with the perfect timing. Listen to the official segment you'll be using for your challenge.
                        </p>

                        <div className="bg-white/5 border border-white/10 rounded-3xl p-8 relative overflow-hidden group">
                            {/* Pink Bars Visualizer simulation */}
                            <div className="flex items-end justify-center gap-1 h-32 mb-8 opacity-70">
                                {[...Array(20)].map((_, i) => (
                                    <div
                                        key={i}
                                        className="w-2 bg-primary rounded-t-full animate-pulse"
                                        style={{
                                            height: `${Math.random() * 100}%`,
                                            animationDelay: `${i * 0.1}s`,
                                            opacity: isPlaying ? 1 : 0.3
                                        }}
                                    ></div>
                                ))}
                            </div>

                            <div className="text-center mb-8">
                                <h3 className="text-xl font-bold text-white mb-1">The 60-second Hook</h3>
                                <p className="text-primary text-sm font-bold">ShowGrid Official Audio Track</p>
                            </div>

                            <audio ref={audioRef} src={selectedChallenge.songUrl} onEnded={() => setIsPlaying(false)} className="hidden" />

                            {/* Controls */}
                            <div className="relative z-10">
                                <div className="h-1 bg-white/10 rounded-full mb-8 relative cursor-pointer group-hover:h-2 transition-all">
                                    <div className="h-full bg-primary w-1/3 relative">
                                        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"></div>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between text-xs font-bold text-white/40 mb-6 font-mono">
                                    <span>0:20</span>
                                    <span>1:00</span>
                                </div>

                                <div className="flex items-center justify-center gap-8">
                                    <button className="p-3 text-white/40 hover:text-white transition-colors"><RotateCcw size={24} /></button>
                                    <button
                                        onClick={togglePlay}
                                        className="w-16 h-16 bg-primary text-white rounded-full flex items-center justify-center shadow-lg shadow-primary/30 hover:scale-105 transition-transform"
                                    >
                                        {isPlaying ? <Pause size={28} fill="currentColor" /> : <Play size={28} fill="currentColor" className="translate-x-0.5" />}
                                    </button>
                                    <button className="p-3 text-white/40 hover:text-white transition-colors"><RotateCw size={24} /></button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right: Guidelines */}
                    <div className="bg-[#1a0b14] border border-white/10 rounded-3xl p-8">
                        <div className="flex items-center gap-3 mb-8">
                            <Volume2 className="text-primary" size={24} />
                            <h3 className="text-xl font-bold">Audio Guidelines</h3>
                        </div>

                        <div className="space-y-6">
                            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex gap-4">
                                <div className="mt-1"><AlertCircle className="text-red-500" size={20} /></div>
                                <div>
                                    <h4 className="font-bold text-white mb-1">No Remixes</h4>
                                    <p className="text-xs text-white/60 leading-relaxed">
                                        Uploads with edited versions or unofficial remixes will be automatically disqualified from the leaderboard.
                                    </p>
                                </div>
                            </div>

                            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex gap-4">
                                <div className="mt-1"><AlertCircle className="text-red-500" size={20} /></div>
                                <div>
                                    <h4 className="font-bold text-white mb-1">No Tempo Changes</h4>
                                    <p className="text-xs text-white/60 leading-relaxed">
                                        Keep the original BPM. Slowed + Reverb or Nightcore edits are not allowed for this challenge category.
                                    </p>
                                </div>
                            </div>

                            <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 flex gap-4">
                                <div className="mt-1"><CheckCircle className="text-green-500" size={20} /></div>
                                <div>
                                    <h4 className="font-bold text-white mb-1">Official Audio Only</h4>
                                    <p className="text-xs text-white/60 leading-relaxed">
                                        Ensure your recording syncs with the segment played on the left. High quality stems available for download.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="mt-8 space-y-4">
                            <button className="w-full btn bg-primary hover:bg-pink-600 text-white border-none py-4 rounded-xl flex items-center justify-center gap-2 font-bold transition-all" onClick={togglePlay}>
                                Listen to the Hook <Volume2 size={20} />
                            </button>
                            <button className="w-full btn btn-outline border-white/10 text-white py-4 rounded-xl flex items-center justify-center gap-2 font-bold hover:bg-white/5 transition-all">
                                Download Audio Stems <Download size={20} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Footer Nav */}
                <div className="max-w-6xl mx-auto mt-12 flex justify-between items-center border-t border-white/10 pt-8">
                    <button onClick={() => navigate('/challenges')} className="flex items-center gap-2 text-white/60 hover:text-white transition-colors">
                        <ArrowRight size={20} className="rotate-180" /> Back to Challenges
                    </button>
                    <div className="flex items-center gap-4">
                        <span className="text-xs text-white/40">Reviewing accurate audio is mandatory</span>
                        <button
                            onClick={() => navigate('/upload/step-3')}
                            className="btn btn-white px-8 py-3 rounded-xl font-bold text-black flex items-center gap-2 hover:bg-gray-200 transition-colors"
                        >
                            Next Step <ArrowRight size={20} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UploadStep2;
