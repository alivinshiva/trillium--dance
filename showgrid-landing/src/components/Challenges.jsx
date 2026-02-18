import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { Music, Trophy, ArrowRight, Calendar, Info, Share2 } from 'lucide-react';
import { useVideo } from '../context/VideoContext';
import Navbar from './Navbar';
import Footer from './Footer';

const Challenges = () => {
    const { isSignedIn } = useUser();
    const navigate = useNavigate();
    const { challenges, setSelectedChallenge, getUserVideos } = useVideo();
    const userVideos = getUserVideos();

    const handleJoinChallenge = (challenge) => {
        if (!isSignedIn) {
            navigate('/sign-up');
            return;
        }
        setSelectedChallenge(challenge);
        navigate(`/challenges/${challenge._id}/upload`);
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
                            {challenges.map((challenge) => {
                                const hasJoined = userVideos.some(v => {
                                    const cId = v.challengeId && v.challengeId._id ? v.challengeId._id : v.challengeId;
                                    return cId === challenge._id && v.status !== 'rejected';
                                });
                                return (
                                    <div key={challenge._id} className={`group bg-white/5 border border-white/10 rounded-3xl overflow-hidden transition-all duration-300 flex flex-col relative ${hasJoined ? 'opacity-50' : 'hover:border-primary/50 hover:-translate-y-2'}`}>
                                        {/* Banner Image Section - Top */}
                                        <div className="relative h-48 bg-black/40">
                                            {challenge.coverUrl ? (
                                                <img
                                                    src={challenge.coverUrl}
                                                    alt={challenge.title}
                                                    className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center">
                                                    <Trophy size={48} className="text-white/20 rotate-12" />
                                                </div>
                                            )}

                                            {/* Music Icon Overlay */}
                                            <div className="absolute top-4 left-4 w-10 h-10 bg-black/60 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/10 shadow-lg">
                                                <Music size={18} className="text-primary" />
                                            </div>

                                            {/* Active Badge Overlay */}
                                            <div className="absolute top-4 right-4">
                                                <span className="bg-green-500/20 text-green-400 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider border border-green-500/20 backdrop-blur-md">
                                                    Active
                                                </span>
                                            </div>
                                        </div>

                                        {/* Content Body */}
                                        <div className="p-6 flex-grow flex flex-col">
                                            <h3 className="text-2xl font-bold mb-3 group-hover:text-primary transition-colors">{challenge.title}</h3>
                                            <p className="text-white/60 leading-relaxed mb-6 line-clamp-3 flex-grow">
                                                {challenge.description}
                                            </p>

                                            {/* Footer Actions */}
                                            <div className="pt-6 border-t border-white/5 flex items-center justify-between mt-auto">
                                                <div className="flex items-center gap-2 text-xs text-white/40 font-mono">
                                                    <Calendar size={14} />
                                                    <span>Ends {new Date(challenge.endDate).toLocaleDateString()}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            const url = `${window.location.origin}/challenges/${challenge._id}/upload`;
                                                            navigator.clipboard.writeText(url);
                                                            alert("Challenge link copied to clipboard!");
                                                        }}
                                                        className="p-2 text-white/40 hover:text-white transition-colors"
                                                        title="Share Challenge"
                                                    >
                                                        <Share2 size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => !hasJoined && handleJoinChallenge(challenge)}
                                                        disabled={hasJoined}
                                                        className={`btn px-5 py-2 text-xs uppercase tracking-widest border-none rounded-lg font-bold transition-colors ${hasJoined ? 'bg-white/10 text-white/50 cursor-not-allowed' : 'bg-white text-black hover:bg-primary hover:text-white'}`}
                                                    >
                                                        {hasJoined ? 'Joined' : <div className="flex items-center gap-1">Join <ArrowRight size={14} /></div>}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default Challenges;
