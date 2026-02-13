import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useUser, SignOutButton } from '@clerk/clerk-react';
import {
    Zap, Activity, TrendingUp, BarChart2,
    Star, MapPin, Trophy, Play, Home, User, Settings, LogOut
} from 'lucide-react';
import Navbar from './Navbar';
import { useVideo } from '../context/VideoContext';

const Dashboard = () => {
    const { user, isLoaded } = useUser();
    const [mode, setMode] = useState('fan'); // 'fan' or 'creator'
    const { getUserVideos } = useVideo();

    if (!isLoaded) {
        return <div className="min-h-screen bg-black flex items-center justify-center text-white">Loading...</div>;
    }

    return (
        <div className="min-h-screen bg-black text-white flex">
            {/* Sidebar (Desktop) */}
            <aside className="w-64 border-r border-white/10 hidden md:flex flex-col p-6 fixed h-full bg-black z-10">
                <Link to="/" className="flex items-center gap-2 font-bold text-xl mb-12 hover:opacity-80 transition-opacity">
                    <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                        <div className="w-3 h-3 bg-white rounded-sm grid grid-cols-2 gap-0.5">
                            <div className="bg-transparent"></div>
                            <div className="bg-primary"></div>
                            <div className="bg-primary"></div>
                            <div className="bg-transparent"></div>
                        </div>
                    </div>
                    <span>SHOWGRID</span>
                </Link>

                <nav className="flex-1 space-y-2">
                    <Link to="/discovered" className="flex items-center gap-3 px-4 py-3 text-white/60 hover:text-white hover:bg-white/5 rounded-xl transition-colors">
                        <Home size={20} /> Feed
                    </Link>
                    <Link to="/challenges" className="flex items-center gap-3 px-4 py-3 text-white/60 hover:text-white hover:bg-white/5 rounded-xl transition-colors">
                        <Trophy size={20} /> Challenges
                    </Link>
                    <div className="flex items-center gap-3 px-4 py-3 bg-white/10 text-white rounded-xl font-bold cursor-default">
                        <Zap size={20} className="text-primary" /> Dashboard
                    </div>
                    <Link to="/leaderboard" className="flex items-center gap-3 px-4 py-3 text-white/60 hover:text-white hover:bg-white/5 rounded-xl transition-colors">
                        <BarChart2 size={20} /> Leaderboard
                    </Link>
                    <Link to="/profile" className="flex items-center gap-3 px-4 py-3 text-white/60 hover:text-white hover:bg-white/5 rounded-xl transition-colors">
                        <User size={20} /> My Profile
                    </Link>
                    <a href="#settings" className="flex items-center gap-3 px-4 py-3 text-white/60 hover:text-white hover:bg-white/5 rounded-xl transition-colors">
                        <Settings size={20} /> Settings
                    </a>
                </nav>

                <SignOutButton>
                    <button className="flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-red-500/10 rounded-xl transition-colors mt-auto w-full">
                        <LogOut size={20} /> Sign Out
                    </button>
                </SignOutButton>
            </aside>

            {/* Main Content */}
            <main className="flex-1 md:ml-64 p-6 pt-20 md:p-12 max-w-7xl mx-auto w-full">
                {/* Dashboard Header & Toggle */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                    <div>
                        <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">
                            Your Dashboard
                        </h2>
                        <p className="text-white/40 text-sm">
                            Switch between your creator studio and your fan experience.
                        </p>
                    </div>

                    {/* Toggle Switch */}
                    <div className="bg-[#1a1a1a] p-1 rounded-full border border-white/10 flex items-center relative z-10 self-end md:self-auto">
                        <button
                            onClick={() => setMode('creator')}
                            className={`px-6 py-2 rounded-full text-xs font-bold transition-all duration-300 flex items-center gap-2 ${mode === 'creator'
                                ? 'bg-pink-600 text-white shadow-[0_0_15px_rgba(236,72,153,0.5)]'
                                : 'text-white/40 hover:text-white'
                                }`}
                        >
                            <Zap size={14} /> STUDIO
                        </button>
                        <button
                            onClick={() => setMode('fan')}
                            className={`px-6 py-2 rounded-full text-xs font-bold transition-all duration-300 flex items-center gap-2 ${mode === 'fan'
                                ? 'bg-cyan-500 text-black shadow-[0_0_15px_rgba(6,182,212,0.5)]'
                                : 'text-white/40 hover:text-white'
                                }`}
                        >
                            <Star size={14} /> FAN
                        </button>
                    </div>
                </div>

                {/* CREATOR MODE */}
                {mode === 'creator' && (
                    <div className="animate-fade-in space-y-8">
                        {/* Stats Row */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <StatsCard
                                title="Global Rank"
                                value="#42"
                                subtitle="+3 spots this week"
                                icon={<TrendingUp size={20} className="text-pink-500" />}
                                color="pink"
                            />
                            <StatsCard
                                title="Total Grid Score"
                                value="12,850"
                                subtitle=""
                                icon={<Zap size={20} className="text-pink-500" />}
                                color="pink"
                            />
                            <StatsCard
                                title="Audience Retention"
                                value="94%"
                                subtitle="+12% Monthly Growth"
                                icon={<Activity size={20} className="text-pink-500" />}
                                color="pink"
                            />
                        </div>

                        {/* Current Challenge Video & Mastery Analysis */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {/* Video Card */}
                            {(() => {
                                const userVideos = getUserVideos();
                                const latestApprovedVideo = userVideos.find(v => v.status === 'approved');

                                if (latestApprovedVideo) {
                                    return (
                                        <div className="lg:col-span-2 bg-[#0a0a0a] border border-white/10 rounded-3xl p-6 overflow-hidden relative group">
                                            <div className="flex justify-between items-center mb-4">
                                                <h3 className="text-lg font-bold flex items-center gap-2">
                                                    <Play size={18} className="text-pink-500" /> Current Challenge Video
                                                </h3>
                                            </div>
                                            <Link to={`/discovered/feed/${latestApprovedVideo._id}`} className="block relative h-64 w-full rounded-2xl overflow-hidden cursor-pointer">
                                                <video
                                                    src={latestApprovedVideo.videoUrl}
                                                    className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-700"
                                                />
                                                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent"></div>
                                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                                    <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                                                        <Play size={32} className="text-white ml-1" fill="white" />
                                                    </div>
                                                </div>
                                                <div className="absolute top-4 right-4 bg-pink-600 text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-[0_0_10px_rgba(236,72,153,0.5)]">
                                                    TRENDING #12
                                                </div>
                                                <div className="absolute bottom-4 left-4">
                                                    <h4 className="text-xl font-bold text-white mb-1">{latestApprovedVideo.description || "Challenge Entry"}</h4>
                                                    <p className="text-xs text-white/60">Global Grid • {new Date(latestApprovedVideo.timestamp).toLocaleDateString()}</p>
                                                </div>
                                            </Link>
                                        </div>
                                    );
                                } else {
                                    return (
                                        <div className="lg:col-span-2 bg-[#0a0a0a] border border-white/10 rounded-3xl p-6 overflow-hidden relative group flex flex-col items-center justify-center text-center min-h-[300px]">
                                            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
                                                <Zap size={32} className="text-white/20" />
                                            </div>
                                            <h3 className="text-xl font-bold mb-2">No Active Challenge</h3>
                                            <p className="text-white/40 max-w-sm mb-6">You haven't uploaded a video to the current challenge yet. Join the grid to see your stats here!</p>
                                            <Link to="/upload" className="btn btn-primary px-8 py-3 rounded-full font-bold">
                                                Upload Performance
                                            </Link>
                                        </div>
                                    );
                                }
                            })()}

                            {/* Mastery Analysis */}
                            <div className="bg-[#0a0a0a] border border-white/10 rounded-3xl p-6 relative">
                                <h3 className="text-lg font-bold flex items-center gap-2 mb-6">
                                    <BarChart2 size={18} className="text-pink-500" /> Mastery Analysis
                                </h3>

                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-xs font-bold uppercase tracking-wider">
                                            <span>Energy</span>
                                            <span className="text-pink-500">98%</span>
                                        </div>
                                        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                                            <div className="h-full bg-pink-500 w-[98%] shadow-[0_0_10px_#ec4899] rounded-full"></div>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-xs font-bold uppercase tracking-wider">
                                            <span>Choreography</span>
                                            <span className="text-pink-500">85%</span>
                                        </div>
                                        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                                            <div className="h-full bg-pink-500 w-[85%] shadow-[0_0_10px_#ec4899] rounded-full"></div>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-xs font-bold uppercase tracking-wider">
                                            <span>Sync</span>
                                            <span className="text-pink-500">92%</span>
                                        </div>
                                        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                                            <div className="h-full bg-pink-500 w-[92%] shadow-[0_0_10px_#ec4899] rounded-full"></div>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-8 pt-6 border-t border-white/10">
                                    <p className="text-xs text-white/50 italic text-center">
                                        "Your energy levels are consistently in the top 1% of the 'Urban' category."
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* FAN MODE */}
                {mode === 'fan' && (
                    <div className="animate-fade-in space-y-8">
                        {/* Stats Row */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <StatsCard
                                title="Performances Rated"
                                value="156"
                                subtitle="Active Reviewer Badge"
                                icon={<Star size={20} className="text-cyan-400" />}
                                color="cyan"
                            />
                            <StatsCard
                                title="City Pride"
                                value="Mumbai"
                                subtitle="Impact Zone A"
                                icon={<MapPin size={20} className="text-cyan-400" />}
                                color="cyan"
                            />
                            <StatsCard
                                title="Points Earned"
                                value="2,400"
                                subtitle="Redeem for voting power"
                                icon={<Trophy size={20} className="text-cyan-400" />}
                                color="cyan"
                            />
                        </div>

                        {/* Creator Spotlight Banner */}
                        <div className="w-full bg-gradient-to-r from-purple-900/40 to-pink-900/40 border border-white/10 rounded-3xl p-8 relative overflow-hidden text-center md:text-left">
                            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20"></div>
                            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                                <div>
                                    <div className="inline-block px-3 py-1 bg-white/10 rounded-full text-[10px] font-bold tracking-widest mb-3 border border-white/10">CREATOR SPOTLIGHT</div>
                                    <h2 className="text-3xl font-bold mb-2">Think your studio can win?</h2>
                                    <p className="text-white/60">Join the elite ranks of Indian dancers. <span className="text-pink-500 font-bold">Upload your performance now</span> and let the world rate your hustle!</p>
                                </div>
                                <button className="flex-shrink-0 bg-pink-600 hover:bg-pink-700 text-white font-bold py-3 px-8 rounded-full shadow-[0_0_20px_rgba(236,72,153,0.4)] transition-all transform hover:scale-105">
                                    START UPLOAD
                                </button>
                            </div>
                        </div>

                        {/* Recently Rated Studios */}
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <h3 className="text-xl font-bold flex items-center gap-2">
                                    <Activity size={20} className="text-cyan-400" /> Recently Rated Studios
                                </h3>
                                <button className="text-xs font-bold text-cyan-400 uppercase tracking-wider hover:text-white transition-colors">View All</button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {[
                                    { name: 'Kings United', rating: '9.8', img: 'https://images.unsplash.com/photo-1516475429286-465d815a0df4' },
                                    { name: 'MJ5 Official', rating: '8.5', img: 'https://images.unsplash.com/photo-1535525266638-c5f718b533ce' },
                                    { name: 'V-Unbeatable', rating: '9.2', img: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad' }
                                ].map((studio, i) => (
                                    <div key={i} className="bg-[#111] border border-white/10 rounded-2xl overflow-hidden group hover:border-cyan-500/50 transition-all">
                                        <div className="h-40 relative">
                                            <img src={studio.img} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" alt={studio.name} />
                                            <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md px-2 py-1 rounded flex items-center gap-1">
                                                <Star size={10} className="text-cyan-400" fill="#22d3ee" />
                                                <span className="text-xs font-bold">{studio.rating}</span>
                                            </div>
                                        </div>
                                        <div className="p-4">
                                            <h4 className="font-bold text-lg mb-1">{studio.name}</h4>
                                            <div className="flex items-center gap-1 mb-3">
                                                <div className="w-full h-1 bg-white/10 rounded-full">
                                                    <div className="h-full bg-cyan-400 rounded-full" style={{ width: `${parseFloat(studio.rating) * 10}%` }}></div>
                                                </div>
                                            </div>
                                            <p className="text-[10px] text-white/40">Your Rating: <span className="text-cyan-400 font-bold">{studio.rating}</span></p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </main>

            {/* Navbar Overlay (Mobile Bottom) */}
            <Navbar />
        </div>
    );
};

const StatsCard = ({ title, value, subtitle, icon, color }) => {
    const borderColor = color === 'pink' ? 'group-hover:border-pink-500/50' : 'group-hover:border-cyan-500/50';
    return (
        <div className={`bg-[#111] border border-white/10 rounded-2xl p-6 relative overflow-hidden group ${borderColor} transition-colors`}>
            <div className="absolute right-4 top-4 opacity-20">
                {icon}
            </div>
            <h3 className="text-[10px] font-bold text-white/40 tracking-widest uppercase mb-3">{title}</h3>
            <div className="text-4xl font-extrabold mb-2">{value}</div>
            <div className={`text-xs font-bold ${color === 'pink' ? 'text-pink-400' : 'text-cyan-400'}`}>
                {subtitle}
            </div>
        </div>
    )
}

export default Dashboard;
