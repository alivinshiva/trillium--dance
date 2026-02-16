import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { useVideo } from '../context/VideoContext';
import { Crown, MapPin } from 'lucide-react';
import Navbar from './Navbar';
import Footer from './Footer';

const Leaderboard = () => {
    const { user } = useUser();
    const { challenges, getLeaderboard } = useVideo();
    const [stats, setStats] = useState([]);
    const [selectedChallengeId, setSelectedChallengeId] = useState(null);
    const [loading, setLoading] = useState(false);

    // Initialize selection
    useEffect(() => {
        if (challenges.length > 0 && !selectedChallengeId) {
            setSelectedChallengeId(challenges[0]._id);
        }
    }, [challenges, selectedChallengeId]);

    // Fetch Leaderboard
    useEffect(() => {
        if (!selectedChallengeId) return;

        const load = async () => {
            setLoading(true);
            const data = await getLeaderboard(selectedChallengeId);
            setStats(data);
            setLoading(false);
        };
        load();
    }, [selectedChallengeId, getLeaderboard]);

    // Top 3
    const top3 = stats.slice(0, 3);
    const rest = stats.slice(3);

    return (
        <div className="min-h-screen bg-dark text-white flex flex-col">
            <Navbar />

            <main className="flex-grow pt-32 pb-20">
                <div className="container">
                    <div className="text-center mb-16">
                        <h1 className="text-5xl md:text-7xl font-extrabold mb-6 tracking-tight">
                            LEADERBOARD
                        </h1>

                        {/* Challenge Selector */}
                        <div className="flex justify-center mb-6">
                            <select
                                value={selectedChallengeId || ''}
                                onChange={(e) => setSelectedChallengeId(e.target.value)}
                                className="bg-white/10 border border-white/20 text-white rounded-xl px-4 py-2 focus:outline-none focus:border-primary"
                            >
                                {challenges.map(c => (
                                    <option key={c._id} value={c._id} className="bg-dark">{c.title}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {loading ? (
                        <div className="text-center py-20">Loading rankings...</div>
                    ) : stats.length === 0 ? (
                        <div className="text-center py-20 text-white/40">No participants yet. Be the first!</div>
                    ) : (
                        <>
                            {/* Top 3 Podium */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-end max-w-4xl mx-auto mb-20">
                                {/* 2nd Place */}
                                {top3[1] && (
                                    <div className="bg-white/5 border border-white/10 rounded-3xl p-6 relative flex flex-col items-center order-2 md:order-1">
                                        <div className="absolute -top-6 w-12 h-12 bg-white/20 rounded-full flex items-center justify-center font-bold text-xl border-4 border-dark">2</div>
                                        <img src={top3[1].userAvatar} alt={top3[1].userName} className="w-24 h-24 rounded-full border-4 border-white/20 mb-4 object-cover" />
                                        <h3 className="text-xl font-bold mb-1">{top3[1].userName}</h3>
                                        {top3[1].city && <p className="text-white/40 text-sm mb-3 flex items-center gap-1"><MapPin size={12} /> {top3[1].city}</p>}
                                        <div className="text-2xl font-extrabold text-primary">{(top3[1].averageRating || 0).toFixed(2)}</div>
                                        <div className="text-xs font-bold text-white/30 uppercase tracking-wider mt-1">Rating</div>
                                    </div>
                                )}

                                {/* 1st Place */}
                                {top3[0] && (
                                    <div className="bg-gradient-to-b from-primary/20 to-black/40 border border-primary/50 rounded-3xl p-8 relative flex flex-col items-center transform scale-110 z-10 order-1 md:order-2">
                                        <div className="absolute -top-8 text-primary">
                                            <Crown size={48} fill="currentColor" />
                                        </div>
                                        <img src={top3[0].userAvatar} alt={top3[0].userName} className="w-32 h-32 rounded-full border-4 border-primary mb-4 object-cover" />
                                        <h3 className="text-2xl font-bold mb-1">{top3[0].userName}</h3>
                                        {top3[0].city && <p className="text-white/40 text-sm mb-4 flex items-center gap-1"><MapPin size={12} /> {top3[0].city}</p>}
                                        <div className="text-4xl font-extrabold text-white">{(top3[0].averageRating || 0).toFixed(2)}</div>
                                        <div className="text-xs font-bold text-primary uppercase tracking-wider mt-1">Rating</div>
                                    </div>
                                )}

                                {/* 3rd Place */}
                                {top3[2] && (
                                    <div className="bg-white/5 border border-white/10 rounded-3xl p-6 relative flex flex-col items-center order-3">
                                        <div className="absolute -top-6 w-12 h-12 bg-white/20 rounded-full flex items-center justify-center font-bold text-xl border-4 border-dark">3</div>
                                        <img src={top3[2].userAvatar} alt={top3[2].userName} className="w-24 h-24 rounded-full border-4 border-white/20 mb-4 object-cover" />
                                        <h3 className="text-xl font-bold mb-1">{top3[2].userName}</h3>
                                        {top3[2].city && <p className="text-white/40 text-sm mb-3 flex items-center gap-1"><MapPin size={12} /> {top3[2].city}</p>}
                                        <div className="text-2xl font-extrabold text-primary">{(top3[2].averageRating || 0).toFixed(2)}</div>
                                        <div className="text-xs font-bold text-white/30 uppercase tracking-wider mt-1">Rating</div>
                                    </div>
                                )}
                            </div>

                            {/* Full List */}
                            <div className="max-w-4xl mx-auto bg-white/5 border border-white/10 rounded-3xl overflow-hidden">
                                <div className="grid grid-cols-12 gap-4 p-4 border-b border-white/10 text-xs font-bold text-white/40 uppercase tracking-wider">
                                    <div className="col-span-1 text-center">Rank</div>
                                    <div className="col-span-8">Dancer</div>
                                    <div className="col-span-3 text-right">Rating</div>
                                </div>

                                {rest.map((dancer, index) => {
                                    const rank = index + 4;
                                    const isCurrentUser = user && dancer.userId === user.id;
                                    return (
                                        <div key={dancer._id} className={`grid grid-cols-12 gap-4 p-4 items-center border-b border-white/5 transition-colors ${isCurrentUser ? 'bg-primary/20 border-primary/50' : 'hover:bg-white/5'}`}>
                                            <div className="col-span-1 text-center font-bold text-lg text-white/50">#{rank}</div>
                                            <div className="col-span-8 flex items-center gap-4">
                                                <img src={dancer.userAvatar} alt={dancer.userName} className="w-10 h-10 rounded-full object-cover" />
                                                <div>
                                                    <h4 className={`font-bold ${isCurrentUser ? 'text-white' : ''}`}>{dancer.userName} {isCurrentUser && '(You)'}</h4>
                                                    {dancer.city && <div className="text-xs text-white/40 flex items-center gap-1"><MapPin size={10} /> {dancer.city}</div>}
                                                </div>
                                            </div>
                                            <div className="col-span-3 text-right font-bold text-primary">{(dancer.averageRating || 0).toFixed(2)}</div>
                                        </div>
                                    );
                                })}
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
