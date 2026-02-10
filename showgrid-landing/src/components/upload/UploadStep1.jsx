// React import removed from here as it is imported below

import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { Music, Video, Trophy, ChevronRight, Play, Calendar, Users, ArrowRight } from 'lucide-react';
import { useVideo } from '../../context/VideoContext';

const UploadStep1 = () => {
    const { isSignedIn } = useUser();
    const navigate = useNavigate();
    const { challenges, setSelectedChallenge } = useVideo();

    const handleJoinChallenge = (challenge) => {
        if (!isSignedIn) {
            navigate('/sign-up');
            return;
        }
        setSelectedChallenge(challenge);
        navigate('/upload/step-2');
    };

    return (
        <div className="min-h-screen bg-dark-lighter bg-gradient-to-b from-dark-lighter to-[#050505] pt-24 pb-12 text-white text-center">
            <div className="container">
                {/* Progress */}
                <div className="max-w-xl mx-auto mb-12">
                    <div className="flex justify-between text-xs font-bold tracking-widest text-white/60 mb-2">
                        <span>ONBOARDING PROGRESS </span>
                        <span className="text-primary">1 of 3</span>
                    </div>
                    <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: '33%' }}></div>
                    </div>
                </div>

                {/* Content */}
                <div>
                    <h1 className="text-5xl md:text-6xl font-extrabold leading-none mb-4">
                        CHOOSE YOUR<br />
                        <span className="text-primary">BATTLEFIELD</span>
                    </h1>
                    <p className="text-lg text-white/70 max-w-lg mx-auto mb-12">
                        Select an active challenge to join. Your performance will be judged on the specific criteria for each track.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto mb-16 text-left">
                        {challenges.map((challenge, index) => (
                            <div key={challenge.id} className="group bg-white/5 border border-white/5 p-1 rounded-3xl transition-all hover:-translate-y-2 hover:bg-white/10 hover:border-primary/50 relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                    <Trophy size={120} className="rotate-12" />
                                </div>

                                <div className="p-8 h-full flex flex-col relative z-10">
                                    <div className="flex justify-between items-start mb-6">
                                        <div className="w-12 h-12 bg-gradient-to-br from-primary to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20">
                                            <Music size={24} className="text-white" />
                                        </div>
                                        <span className="bg-white/10 text-white/80 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                                            Active
                                        </span>
                                    </div>

                                    <h3 className="text-2xl font-bold mb-2 group-hover:text-primary transition-colors">{challenge.title}</h3>
                                    <p className="text-sm text-white/60 leading-relaxed mb-6 line-clamp-3">
                                        {challenge.description}
                                    </p>

                                    <div className="flex flex-wrap gap-2 mb-8">
                                        {challenge.tags.map((tag, i) => (
                                            <span key={i} className="text-[10px] font-bold bg-black/30 border border-white/10 px-2 py-1 rounded text-white/70">
                                                #{tag}
                                            </span>
                                        ))}
                                    </div>

                                    <div className="mt-auto pt-6 border-t border-white/10 flex items-center justify-between">
                                        <div className="text-xs text-white/40 font-mono">
                                            Ends {new Date(challenge.endDate).toLocaleDateString()}
                                        </div>
                                        <button
                                            onClick={() => handleJoinChallenge(challenge)}
                                            className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all transform group-hover:scale-110"
                                        >
                                            <ArrowRight size={20} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {!isSignedIn && (
                        <div className="text-white/40 text-sm">
                            <Link to="/sign-in" className="underline hover:text-white">Sign in</Link> to save your progress
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default UploadStep1;
