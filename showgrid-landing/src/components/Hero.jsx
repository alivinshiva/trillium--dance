import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Play, Upload, MessageSquare, TrendingUp } from 'lucide-react';
import heroBg from '../assets/hero-bg.png';

const Hero = () => {
    // Simulate live battle feed
    const [messages, setMessages] = useState([
        { id: 1, text: "Kings United (Mumbai) just received a 10-star rating!", type: "rating" },
        { id: 2, text: "Bengaluru Dance Co. uploaded a new performance!", type: "upload" },
    ]);

    return (
        <section className="relative h-screen min-h-[700px] flex items-center justify-center bg-cover bg-center overflow-hidden text-center" style={{ backgroundImage: `url(${heroBg})` }}>
            <div className="absolute inset-0 bg-gradient-to-b from-black/30 to-black/80"></div>
            <div className="relative z-10 flex flex-col items-center gap-6 container">
                <div className="text-xs font-bold tracking-widest uppercase bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/20 mb-4">
                    CURRENT TRACK: "NAATU NAATU" REMIX
                </div>

                <h1 className="text-6xl md:text-8xl leading-none font-extrabold tracking-tighter">
                    One Music.<br />
                    <span className="text-primary">Many Studios.</span>
                </h1>

                <p className="text-lg text-white/80 max-w-2xl mb-4">
                    India's ultimate digital arena. One track, infinite expressions. <br />
                    Compete, vote, and dominate the national dance grid.
                </p>

                <div className="flex gap-4 mb-12">
                    <Link to="/discovered" className="btn btn-primary">
                        <Play size={20} fill="currentColor" /> Watch & Rate
                    </Link>
                    <Link to="/challenges" className="btn btn-outline">
                        <TrendingUp size={20} /> Trending Challenge
                    </Link>
                </div>

                <div className="flex flex-col items-center gap-4 mt-8">
                    <div className="flex items-center gap-2 text-xs font-extrabold tracking-widest text-secondary">
                        <div className="w-1.5 h-1.5 bg-secondary rounded-full shadow-[0_0_8px_var(--color-secondary)]"></div> LIVE BATTLE FEED
                    </div>
                    <div className="flex gap-4 flex-wrap justify-center">
                        <div className="bg-black/60 backdrop-blur-md border border-white/10 px-4 py-2 rounded-full text-sm flex items-center gap-2">
                            <span className="text-white">Kings United (Mumbai) just received a <span className="text-primary">10-star rating!</span></span>
                        </div>
                        <div className="bg-black/60 backdrop-blur-md border border-white/10 px-4 py-2 rounded-full text-sm flex items-center gap-2">
                            <span className="text-white"><span className="text-secondary">Bengaluru Dance Co.</span> uploaded a new performance!</span>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Hero;
