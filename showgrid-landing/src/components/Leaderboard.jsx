import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { useVideo } from '../context/VideoContext';
import { Crown, MapPin, Share2 } from 'lucide-react'; // Added Share2
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';

const Leaderboard = () => {
    const { user } = useUser();
    const { challengeId } = useParams();
    const navigate = useNavigate();
    const { challenges, getLeaderboard } = useVideo();
    const [stats, setStats] = useState([]);
    const [loading, setLoading] = useState(false);

    // Sync URL with selection or default to first
    useEffect(() => {
        if (challenges.length > 0) {
            if (!challengeId) {
                // If no ID in URL, default to first and replace URL
                navigate(`/leaderboard/${challenges[0]._id}`, { replace: true });
            }
        }
    }, [challenges, challengeId, navigate]);

    // Fetch Leaderboard when challengeId changes
    useEffect(() => {
        if (!challengeId) return;

        const load = async () => {
            setLoading(true);
            const data = await getLeaderboard(challengeId);
            setStats(data);
            setLoading(false);
        };
        load();
    }, [challengeId, getLeaderboard]);

    // Top 3
    const top3 = stats.slice(0, 3);
    const rest = stats.slice(3);

    return (
        <div className="min-h-screen bg-dark text-white flex flex-col font-sans overflow-hidden w-full">
            <Navbar />

            <main className="flex-grow pt-24 md:pt-32 pb-safe pb-24 md:pb-20 px-2 sm:px-4 w-full max-w-full">
                <div className="container mx-auto max-w-6xl">
                    <div className="text-center mb-10 md:mb-16">
                        <h1 className="text-4xl sm:text-5xl md:text-7xl font-extrabold mb-4 md:mb-6 tracking-tight break-words px-2">
                            LEADERBOARD
                        </h1>

                        {/* Challenge Selector */}
                        <div className="flex justify-center items-center gap-4 mb-6">
                            <select
                                value={challengeId || ''}
                                onChange={(e) => navigate(`/leaderboard/${e.target.value}`)}
                                className="bg-white/10 border border-white/20 text-white rounded-xl px-4 py-2 focus:outline-none focus:border-primary"
                            >
                                {challenges.map(c => (
                                    <option key={c._id} value={c._id} className="bg-dark">{c.title}</option>
                                ))}
                            </select>

                            <button
                                onClick={() => {
                                    const url = window.location.href;
                                    navigator.clipboard.writeText(url);
                                    alert("Leaderboard link copied!");
                                }}
                                className="p-2 bg-white/10 rounded-xl hover:bg-white/20 transition-colors text-white/60 hover:text-white"
                                title="Share Leaderboard"
                            >
                                <Share2 size={20} />
                            </button>
                        </div>
                    </div>

                    {loading ? (
                        <div className="text-center py-20">Loading rankings...</div>
                    ) : stats.length === 0 ? (
                        <div className="text-center py-20 text-white/40">No participants yet. Be the first!</div>
                    ) : (
                        <>
                            {/* Top 3 Podium */}
                            <div className="grid grid-cols-3 gap-2 sm:gap-4 md:gap-8 items-end max-w-4xl mx-auto mb-16 md:mb-20 px-1 sm:px-4 w-full">
                                {/* 2nd Place */}
                                {top3[1] && (
                                    <div className="bg-white/5 border border-white/10 rounded-xl md:rounded-3xl p-2 sm:p-4 md:p-6 relative flex flex-col items-center order-1 w-full h-full justify-end">
                                        <div className="absolute -top-3 sm:-top-4 md:-top-6 w-6 h-6 sm:w-8 sm:h-8 md:w-12 md:h-12 bg-white/20 rounded-full flex items-center justify-center font-bold text-xs sm:text-base md:text-xl border-[1px] sm:border-2 md:border-4 border-dark">2</div>
                                        <img src={top3[1].userAvatar} alt={top3[1].userName} className="w-10 h-10 sm:w-16 sm:h-16 md:w-24 md:h-24 rounded-full border-[1px] sm:border-2 md:border-4 border-white/20 mb-1 sm:mb-2 md:mb-4 object-cover" />
                                        <h3 className="text-[10px] sm:text-sm md:text-xl font-bold mb-0.5 md:mb-1 break-words text-center px-1 w-full leading-tight">{top3[1].userName}</h3>
                                        {top3[1].city && <p className="text-white/40 text-[8px] sm:text-xs md:text-sm mb-1 sm:mb-2 md:mb-3 flex flex-wrap items-center justify-center gap-0.5 sm:gap-1 w-full leading-none"><MapPin className="w-[8px] h-[8px] sm:w-[10px] sm:h-[10px] md:w-[12px] md:h-[12px]" /> <span className="truncate max-w-full">{top3[1].city}</span></p>}
                                        <div className="text-sm sm:text-lg md:text-2xl font-extrabold text-primary leading-none">{(top3[1].averageRating || 0).toFixed(2)}</div>
                                        <div className="text-[6px] sm:text-[8px] md:text-xs font-bold text-white/30 uppercase tracking-wider mt-0.5 md:mt-1">Rating</div>
                                    </div>
                                )}

                                {/* 1st Place */}
                                {top3[0] && (
                                    <div className="bg-gradient-to-b from-primary/20 to-black/40 border border-primary/50 rounded-xl md:rounded-3xl p-3 sm:p-5 md:p-8 relative flex flex-col items-center transform scale-105 md:scale-110 z-10 order-2 w-full h-full shadow-[0_0_15px_rgba(236,72,153,0.2)] md:shadow-none justify-end">
                                        <div className="absolute -top-5 sm:-top-6 md:-top-8 text-primary">
                                            <Crown className="w-6 h-6 sm:w-8 sm:h-8 md:w-12 md:h-12" fill="currentColor" />
                                        </div>
                                        <img src={top3[0].userAvatar} alt={top3[0].userName} className="w-14 h-14 sm:w-20 sm:h-20 md:w-32 md:h-32 rounded-full border-2 sm:border-4 border-primary mb-1.5 sm:mb-3 md:mb-4 object-cover" />
                                        <h3 className="text-xs sm:text-lg md:text-2xl font-bold mb-0.5 md:mb-1 break-words text-center px-1 w-full leading-tight">{top3[0].userName}</h3>
                                        {top3[0].city && <p className="text-white/40 text-[8px] sm:text-xs md:text-sm mb-1.5 sm:mb-3 md:mb-4 flex flex-wrap items-center justify-center gap-0.5 sm:gap-1 w-full leading-none"><MapPin className="w-[8px] h-[8px] sm:w-[10px] sm:h-[10px] md:w-[12px] md:h-[12px]" /> <span className="truncate max-w-full">{top3[0].city}</span></p>}
                                        <div className="text-lg sm:text-2xl md:text-4xl font-extrabold text-white leading-none">{(top3[0].averageRating || 0).toFixed(2)}</div>
                                        <div className="text-[8px] sm:text-[10px] md:text-xs font-bold text-primary uppercase tracking-wider mt-0.5 md:mt-1">Rating</div>
                                    </div>
                                )}

                                {/* 3rd Place */}
                                {top3[2] && (
                                    <div className="bg-white/5 border border-white/10 rounded-xl md:rounded-3xl p-2 sm:p-4 md:p-6 relative flex flex-col items-center order-3 w-full h-full justify-end">
                                        <div className="absolute -top-3 sm:-top-4 md:-top-6 w-6 h-6 sm:w-8 sm:h-8 md:w-12 md:h-12 bg-white/20 rounded-full flex items-center justify-center font-bold text-xs sm:text-base md:text-xl border-[1px] sm:border-2 md:border-4 border-dark">3</div>
                                        <img src={top3[2].userAvatar} alt={top3[2].userName} className="w-10 h-10 sm:w-16 sm:h-16 md:w-24 md:h-24 rounded-full border-[1px] sm:border-2 md:border-4 border-white/20 mb-1 sm:mb-2 md:mb-4 object-cover" />
                                        <h3 className="text-[10px] sm:text-sm md:text-xl font-bold mb-0.5 md:mb-1 break-words text-center px-1 w-full leading-tight">{top3[2].userName}</h3>
                                        {top3[2].city && <p className="text-white/40 text-[8px] sm:text-xs md:text-sm mb-1 sm:mb-2 md:mb-3 flex flex-wrap items-center justify-center gap-0.5 sm:gap-1 w-full leading-none"><MapPin className="w-[8px] h-[8px] sm:w-[10px] sm:h-[10px] md:w-[12px] md:h-[12px]" /> <span className="truncate max-w-full">{top3[2].city}</span></p>}
                                        <div className="text-sm sm:text-lg md:text-2xl font-extrabold text-primary leading-none">{(top3[2].averageRating || 0).toFixed(2)}</div>
                                        <div className="text-[6px] sm:text-[8px] md:text-xs font-bold text-white/30 uppercase tracking-wider mt-0.5 md:mt-1">Rating</div>
                                    </div>
                                )}
                            </div>

                            {/* Full List */}
                            <div className="w-full max-w-4xl mx-auto bg-white/5 border border-white/10 rounded-2xl md:rounded-3xl overflow-hidden overflow-x-auto">
                                <div className="min-w-[300px]">
                                    <div className="grid grid-cols-12 gap-2 md:gap-4 p-3 md:p-4 border-b border-white/10 text-[10px] md:text-xs font-bold text-white/40 uppercase tracking-wider">
                                        <div className="col-span-2 md:col-span-1 text-center">Rank</div>
                                        <div className="col-span-7 md:col-span-8">Dancer</div>
                                        <div className="col-span-3 text-right">Rating</div>
                                    </div>

                                    {rest.map((dancer, index) => {
                                        const rank = index + 4;
                                        const isCurrentUser = user && dancer.userId === user.id;
                                        return (
                                            <div key={dancer._id} className={`grid grid-cols-12 gap-2 md:gap-4 p-3 md:p-4 items-center border-b border-white/5 transition-colors ${isCurrentUser ? 'bg-primary/20 border-primary/50' : 'hover:bg-white/5'}`}>
                                                <div className="col-span-2 md:col-span-1 text-center font-bold text-sm md:text-lg text-white/50">#{rank}</div>
                                                <div className="col-span-7 md:col-span-8 flex items-center gap-2 md:gap-4">
                                                    <img src={dancer.userAvatar} alt={dancer.userName} className="w-8 h-8 md:w-10 md:h-10 rounded-full object-cover" />
                                                    <div className="min-w-0 overflow-hidden">
                                                        <h4 className={`font-bold text-xs md:text-base truncate ${isCurrentUser ? 'text-white' : ''}`}>{dancer.userName} {isCurrentUser && '(You)'}</h4>
                                                        {dancer.city && <div className="text-[10px] md:text-xs text-white/40 flex items-center gap-1 truncate"><MapPin size={8} className="md:w-[10px] md:h-[10px] flex-shrink-0" /> <span className="truncate">{dancer.city}</span></div>}
                                                    </div>
                                                </div>
                                                <div className="col-span-3 text-right font-bold text-sm md:text-base text-primary">{(dancer.averageRating || 0).toFixed(2)}</div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default Leaderboard;
