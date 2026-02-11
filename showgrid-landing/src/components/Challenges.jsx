import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { Music, Trophy, ArrowRight, Calendar, Info } from 'lucide-react';
import { useVideo } from '../context/VideoContext';
import Navbar from './Navbar';
import Footer from './Footer';

const Challenges = () => {
    const { isSignedIn } = useUser();
    const navigate = useNavigate();
    const { challenges, setSelectedChallenge } = useVideo();

    const handleJoinChallenge = (challenge) => {
        if (!isSignedIn) {
            navigate('/sign-up');
            return;
        }
        setSelectedChallenge(challenge);
        navigate('/upload');
    };

    return (
        <div className="min-h-screen bg-dark text-white flex flex-col">
            <Navbar />

            <main className="flex-grow pt-32 pb-20">
                <div className="container">
                    <div className="text-center mb-16">
                        <h1 className="text-5xl md:text-7xl font-extrabold mb-6 tracking-tight">
                            ACTIVE <span className="text-primary">BATTLES</span>
                        </h1>
                        <p className="text-xl text-white/60 max-w-2xl mx-auto">
                            Step into the arena. Choose a challenge, download the track, and show the world what you've got.
                        </p>
                    </div>

                    {challenges.length === 0 ? (
                        <div className="text-center py-20 bg-white/5 rounded-3xl border border-white/10">
                            <Info size={48} className="mx-auto text-white/30 mb-4" />
                            <h3 className="text-2xl font-bold text-white/50">No Active Challenges</h3>
                            <p className="text-white/30 mt-2">Check back later for new battles.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {challenges.map((challenge) => (
                                <div key={challenge.id} className="group bg-white/5 border border-white/10 rounded-3xl overflow-hidden hover:bg-white/10 hover:border-primary/50 transition-all duration-300 hover:-translate-y-2 flex flex-col">
                                    <div className="p-8 flex-grow relative">
                                        <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                                            <Trophy size={140} className="rotate-12" />
                                        </div>

                                        <div className="flex justify-between items-start mb-6 relative z-10">
                                            <div className="w-14 h-14 bg-gradient-to-br from-primary to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20 group-hover:scale-110 transition-transform">
                                                <Music size={28} className="text-white" />
                                            </div>
                                            <span className="bg-green-500/20 text-green-400 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider border border-green-500/20">
                                                Active
                                            </span>
                                        </div>

                                        <h3 className="text-3xl font-bold mb-3 group-hover:text-primary transition-colors relative z-10">{challenge.title}</h3>
                                        <p className="text-white/60 leading-relaxed mb-6 line-clamp-3 relative z-10">
                                            {challenge.description}
                                        </p>

                                        <div className="flex flex-wrap gap-2 mb-6 relative z-10">
                                            {challenge.tags.map((tag, i) => (
                                                <span key={i} className="text-xs font-bold bg-black/40 border border-white/10 px-3 py-1.5 rounded-lg text-white/80">
                                                    #{tag}
                                                </span>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="p-6 bg-black/20 border-t border-white/5 flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-xs text-white/40 font-mono">
                                            <Calendar size={14} />
                                            <span>Ends {new Date(challenge.endDate).toLocaleDateString()}</span>
                                        </div>
                                        <button
                                            onClick={() => handleJoinChallenge(challenge)}
                                            className="btn btn-white px-6 py-2 text-xs uppercase tracking-widest hover:bg-primary hover:text-white border-none"
                                        >
                                            Join <ArrowRight size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default Challenges;
