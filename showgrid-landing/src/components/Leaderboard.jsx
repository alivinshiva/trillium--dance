import React from 'react';
import { Crown, TrendingUp, Users, MapPin, Zap } from 'lucide-react';
import Navbar from './Navbar';
import Footer from './Footer';

const Leaderboard = () => {
    // Dummy data for leaderboard
    const dancers = [
        { rank: 1, name: "Kings United", city: "Mumbai", points: 12500, change: "+2", avatar: "https://images.unsplash.com/photo-1535525266638-c5f718b533ce?w=500&h=500&fit=crop" },
        { rank: 2, name: "MJ5 Crew", city: "Delhi", points: 11800, change: "-1", avatar: "https://images.unsplash.com/photo-1547153760-18fc86324498?w=500&h=500&fit=crop" },
        { rank: 3, name: "V. Unbeatable", city: "Mumbai", points: 11200, change: "0", avatar: "https://images.unsplash.com/photo-1516475429286-465d815a0df4?w=500&h=500&fit=crop" },
        { rank: 4, name: "Desi Hoppers", city: "Kolkata", points: 10500, change: "+5", avatar: "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=500&h=500&fit=crop" },
        { rank: 5, name: "Gang 13", city: "Pune", points: 9800, change: "-1", avatar: "https://images.unsplash.com/photo-1524593689594-aae2f26b75ab?w=500&h=500&fit=crop" },
    ];

    return (
        <div className="min-h-screen bg-dark text-white flex flex-col">
            <Navbar />

            <main className="flex-grow pt-32 pb-20">
                <div className="container">
                    <div className="text-center mb-16">
                        <h1 className="text-5xl md:text-7xl font-extrabold mb-6 tracking-tight">
                            NATIONAL <span className="text-primary">LEADERBOARD</span>
                        </h1>
                        <p className="text-xl text-white/60 max-w-2xl mx-auto">
                            The top studios and dancers ruling the grid. Compete, win, and climb the ranks.
                        </p>
                    </div>

                    {/* Top 3 Podium */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-end max-w-4xl mx-auto mb-20">
                        {/* 2nd Place */}
                        <div className="bg-white/5 border border-white/10 rounded-3xl p-6 relative flex flex-col items-center order-2 md:order-1">
                            <div className="absolute -top-6 w-12 h-12 bg-white/20 rounded-full flex items-center justify-center font-bold text-xl border-4 border-dark">2</div>
                            <img src={dancers[1].avatar} alt={dancers[1].name} className="w-24 h-24 rounded-full border-4 border-white/20 mb-4 object-cover" />
                            <h3 className="text-xl font-bold mb-1">{dancers[1].name}</h3>
                            <p className="text-white/40 text-sm mb-3 flex items-center gap-1"><MapPin size={12} /> {dancers[1].city}</p>
                            <div className="text-2xl font-extrabold text-primary">{dancers[1].points.toLocaleString()}</div>
                            <div className="text-xs font-bold text-white/30 uppercase tracking-wider mt-1">Impact Points</div>
                        </div>

                        {/* 1st Place */}
                        <div className="bg-gradient-to-b from-primary/20 to-black/40 border border-primary/50 rounded-3xl p-8 relative flex flex-col items-center transform scale-110 z-10 order-1 md:order-2">
                            <div className="absolute -top-8 text-primary">
                                <Crown size={48} fill="currentColor" />
                            </div>
                            <img src={dancers[0].avatar} alt={dancers[0].name} className="w-32 h-32 rounded-full border-4 border-primary mb-4 object-cover" />
                            <h3 className="text-2xl font-bold mb-1">{dancers[0].name}</h3>
                            <p className="text-white/40 text-sm mb-4 flex items-center gap-1"><MapPin size={12} /> {dancers[0].city}</p>
                            <div className="text-4xl font-extrabold text-white">{dancers[0].points.toLocaleString()}</div>
                            <div className="text-xs font-bold text-primary uppercase tracking-wider mt-1">Impact Points</div>
                        </div>

                        {/* 3rd Place */}
                        <div className="bg-white/5 border border-white/10 rounded-3xl p-6 relative flex flex-col items-center order-3">
                            <div className="absolute -top-6 w-12 h-12 bg-white/20 rounded-full flex items-center justify-center font-bold text-xl border-4 border-dark">3</div>
                            <img src={dancers[2].avatar} alt={dancers[2].name} className="w-24 h-24 rounded-full border-4 border-white/20 mb-4 object-cover" />
                            <h3 className="text-xl font-bold mb-1">{dancers[2].name}</h3>
                            <p className="text-white/40 text-sm mb-3 flex items-center gap-1"><MapPin size={12} /> {dancers[2].city}</p>
                            <div className="text-2xl font-extrabold text-primary">{dancers[2].points.toLocaleString()}</div>
                            <div className="text-xs font-bold text-white/30 uppercase tracking-wider mt-1">Impact Points</div>
                        </div>
                    </div>

                    {/* Full List */}
                    <div className="max-w-4xl mx-auto bg-white/5 border border-white/10 rounded-3xl overflow-hidden">
                        <div className="grid grid-cols-12 gap-4 p-4 border-b border-white/10 text-xs font-bold text-white/40 uppercase tracking-wider">
                            <div className="col-span-1 text-center">Rank</div>
                            <div className="col-span-5">Studio / Dancer</div>
                            <div className="col-span-3 text-right">Points</div>
                            <div className="col-span-3 text-right">Trend</div>
                        </div>

                        {dancers.map((dancer) => (
                            <div key={dancer.rank} className="grid grid-cols-12 gap-4 p-4 items-center border-b border-white/5 hover:bg-white/5 transition-colors">
                                <div className="col-span-1 text-center font-bold text-lg text-white/50">#{dancer.rank}</div>
                                <div className="col-span-5 flex items-center gap-4">
                                    <img src={dancer.avatar} alt={dancer.name} className="w-10 h-10 rounded-full object-cover" />
                                    <div>
                                        <h4 className="font-bold">{dancer.name}</h4>
                                        <div className="text-xs text-white/40 flex items-center gap-1"><MapPin size={10} /> {dancer.city}</div>
                                    </div>
                                </div>
                                <div className="col-span-3 text-right font-bold text-primary">{dancer.points.toLocaleString()}</div>
                                <div className="col-span-3 text-right flex justify-end">
                                    <span className={`text-xs font-bold px-2 py-1 rounded ${dancer.change.startsWith('+') ? 'bg-green-500/20 text-green-400' :
                                            dancer.change.startsWith('-') ? 'bg-red-500/20 text-red-400' :
                                                'bg-white/10 text-white/40'
                                        }`}>
                                        {dancer.change}
                                    </span>
                                </div>
                            </div>
                        ))}

                        <div className="p-4 text-center">
                            <button className="text-xs font-bold text-white/40 hover:text-white uppercase tracking-wider transition-colors">
                                View Top 100
                            </button>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default Leaderboard;
