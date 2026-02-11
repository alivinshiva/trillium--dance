import React, { useState, useEffect } from 'react';
import { useVideo } from '../context/VideoContext';
import { useUser } from '@clerk/clerk-react';
import { Play, Heart, MessageCircle, Share2, Music, ChevronUp, ChevronDown } from 'lucide-react';
import Navbar from './Navbar';

const Discovered = () => {
    const { getApprovedVideos } = useVideo();
    const { user } = useUser();

    const [videos, setVideos] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(true);
    const videoRef = React.useRef(null);
    // Mobile Detection
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Rating State
    const [ratings, setRatings] = useState({ energy: 5.0, choreo: 5.0, sync: 5.0 });

    useEffect(() => {
        // Load approved videos and prepend the local demo video
        const approvedVideos = getApprovedVideos();
        const demoVideo = {
            id: 'local-demo',
            userId: 'demo-user',
            userName: 'ShowGrid Demo',
            userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ShowGrid',
            videoUrl: '/v1.mp4',
            description: 'Showcasing the power of the grid! #ShowGrid #Dance',
            judgeTags: ['Energy', 'Choreo', 'Sync'],
            city: 'Mumbai',
            timestamp: new Date().toISOString()
        };
        setVideos([demoVideo, ...approvedVideos]);
    }, [getApprovedVideos]);

    const currentVideo = videos[currentIndex];

    const handleNext = () => {
        if (currentIndex < videos.length - 1) {
            setCurrentIndex(prev => prev + 1);
        }
    };

    const handlePrev = () => {
        if (currentIndex > 0) {
            setCurrentIndex(prev => prev - 1);
        }
    };

    const togglePlay = () => {
        if (videoRef.current) {
            if (isPlaying) {
                videoRef.current.pause();
            } else {
                videoRef.current.play();
            }
            setIsPlaying(!isPlaying);
        }
    };

    const handleRatingChange = (category, value) => {
        setRatings(prev => ({ ...prev, [category]: parseFloat(value) }));
    };

    if (!currentVideo) return <div className="min-h-screen bg-dark flex items-center justify-center text-white">Loading...</div>;

    return (
        <div className="h-screen w-full bg-black overflow-hidden relative">
            {/* Video Player */}
            <div className="absolute inset-0 z-0" onClick={togglePlay}>
                <video
                    ref={videoRef}
                    src={currentVideo.videoUrl}
                    className="w-full h-full object-cover opacity-80"
                    autoPlay
                    loop
                    playsInline
                />
                {!isPlaying && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 z-10 pointer-events-none">
                        <Play size={64} fill="white" className="text-white opacity-80" />
                    </div>
                )}
            </div>

            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/90 pointer-events-none z-0"></div>

            {/* Side Actions (Like, Share, Nav) */}
            <div className={`absolute z-30 flex flex-col items-center gap-4 transition-all duration-300 ${isMobile
                ? 'right-2 bottom-48' /* Mobile: Bot-Right, higher to avoid Rating overlap */
                : 'right-8 top-1/2 -translate-y-1/2 h-auto' /* Desktop: Center Right */
                }`}>
                {!isMobile && (
                    <button
                        onClick={handlePrev}
                        disabled={currentIndex === 0}
                        className="p-3 bg-white/10 rounded-full hover:bg-white/20 disabled:opacity-30 transition-all"
                    >
                        <ChevronUp size={24} color="white" />
                    </button>
                )}

                <div className="flex flex-col gap-6 items-center">
                    <div className="flex flex-col items-center gap-1">
                        <div className="w-10 h-10 md:w-12 md:h-12 bg-black/20 backdrop-blur-sm md:bg-white/10 rounded-full flex items-center justify-center cursor-pointer hover:bg-white/20 md:hover:scale-110 transition-all">
                            <Heart size={20} className="md:w-6 md:h-6" fill={ratings.energy > 8 ? "#ec4899" : "transparent"} color={ratings.energy > 8 ? "#ec4899" : "white"} />
                        </div>
                        <span className="text-[10px] md:text-xs font-bold text-white shadow-black drop-shadow-md">12.4K</span>
                    </div>
                    <div className="flex flex-col items-center gap-1">
                        <div className="w-10 h-10 md:w-12 md:h-12 bg-black/20 backdrop-blur-sm md:bg-white/10 rounded-full flex items-center justify-center cursor-pointer hover:bg-white/20 md:hover:scale-110 transition-all">
                            <MessageCircle size={20} className="md:w-6 md:h-6" color="white" />
                        </div>
                        <span className="text-[10px] md:text-xs font-bold text-white shadow-black drop-shadow-md">408</span>
                    </div>
                    <div className="flex flex-col items-center gap-1">
                        <div className="w-10 h-10 md:w-12 md:h-12 bg-black/20 backdrop-blur-sm md:bg-white/10 rounded-full flex items-center justify-center cursor-pointer hover:bg-white/20 md:hover:scale-110 transition-all">
                            <Share2 size={20} className="md:w-6 md:h-6" color="white" />
                        </div>
                        <span className="text-[10px] md:text-xs font-bold text-white shadow-black drop-shadow-md">Share</span>
                    </div>
                </div>

                {!isMobile && (
                    <button
                        onClick={handleNext}
                        disabled={currentIndex === videos.length - 1}
                        className="p-3 bg-white/10 rounded-full hover:bg-white/20 disabled:opacity-30 transition-all"
                    >
                        <ChevronDown size={24} color="white" />
                    </button>
                )}
            </div>

            {/* Bottom Content Info */}
            <div className={`absolute bottom-0 left-0 w-full p-4 md:p-12 z-20 flex flex-col md:flex-row items-end justify-between gap-4 md:gap-8 transition-all duration-300 ${isMobile ? 'pb-24' : 'pb-12'}`}>
                {/* User Info */}
                <div className="flex-1 max-w-2xl w-full">
                    <div className="flex items-center gap-3 mb-2 md:mb-4">
                        <img src={currentVideo.userAvatar} className="w-10 h-10 md:w-14 md:h-14 rounded-full border-2 border-primary" alt="User" />
                        <div>
                            <h3 className="text-lg md:text-2xl font-bold text-white drop-shadow-lg shadow-black">@{currentVideo.userName}</h3>
                            <div className="flex items-center gap-2 text-xs md:text-sm text-white/80 shadow-black drop-shadow-md">
                                <Music size={12} className="md:w-3.5 md:h-3.5" />
                                <span>Original Audio • ShowGrid Official</span>
                            </div>
                        </div>
                        <button className="btn btn-outline border-primary text-primary bg-black/20 backdrop-blur-sm hover:bg-primary hover:text-white px-3 py-1 text-[10px] md:text-xs ml-auto md:ml-4 rounded-full">
                            Follow
                        </button>
                    </div>
                    <p className="text-sm md:text-lg text-white/90 mb-4 md:mb-6 drop-shadow-md shadow-black line-clamp-2 md:line-clamp-none">
                        {currentVideo.description || "Submitting my take on the #ShowGridChallenge! Let me know what you think of the drop at 0:34 🔥"} #dance #competition
                    </p>
                </div>

                {/* Rating Sliders */}
                <div className={`w-full md:max-w-sm transition-all duration-300 rounded-2xl ${isMobile
                    ? 'bg-transparent p-0' // Mobile: Transparent, no padding
                    : 'bg-black/40 backdrop-blur-md border border-white/10 p-6' // Desktop: Card style
                    }`}>
                    <div className="flex justify-between items-center mb-2 md:mb-4">
                        <span className="text-[10px] md:text-xs font-bold tracking-widest text-white/60">LIVE RATING</span>
                        <div className="flex items-center gap-2 text-green-400 text-[10px] md:text-xs font-bold">
                            <span className="w-1.5 h-1.5 md:w-2 md:h-2 bg-green-500 rounded-full animate-pulse"></span>
                            {user?.fullName || "Guest"} Voting
                        </div>
                    </div>

                    <div className="space-y-2 md:space-y-4">
                        {currentVideo.judgeTags && currentVideo.judgeTags.map((tag, index) => {
                            const colors = ['text-primary', 'text-secondary', 'text-purple-400', 'text-yellow-400'];
                            const accents = ['accent-primary', 'accent-secondary', 'accent-purple-500', 'accent-yellow-500'];
                            const tagKey = `tag${index}`;
                            const val = ratings[tagKey] || 5.0;

                            return (
                                <div key={index}>
                                    <div className="flex justify-between text-[10px] md:text-xs font-bold mb-1">
                                        <span className="text-white uppercase shadow-black drop-shadow-sm">{tag}</span>
                                        <span className={`${colors[index % colors.length]} drop-shadow-sm`}>{val.toFixed(1)}</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="0"
                                        max="10"
                                        step="0.1"
                                        value={val}
                                        onChange={(e) => handleRatingChange(tagKey, e.target.value)}
                                        className={`w-full h-1 md:h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer ${accents[index % accents.length]} hover:brightness-110 transition-all`}
                                    />
                                </div>
                            );
                        })}

                        {/* Fallback for legacy videos */}
                        {!currentVideo.judgeTags && ['Energy', 'Choreo', 'Sync'].map((tag, i) => (
                            <div key={tag}>
                                <div className="flex justify-between text-[10px] md:text-xs font-bold mb-1">
                                    <span className="text-white uppercase">{tag}</span>
                                    <span className="text-primary">{ratings[tag.toLowerCase()]?.toFixed(1) || "5.0"}</span>
                                </div>
                                <input
                                    type="range"
                                    min="0"
                                    max="10"
                                    step="0.1"
                                    value={ratings[tag.toLowerCase()] || 5.0}
                                    onChange={(e) => handleRatingChange(tag.toLowerCase(), e.target.value)}
                                    className="w-full h-1 md:h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-primary transition-all"
                                />
                            </div>
                        ))}
                    </div>

                    <button className="w-full mt-4 btn btn-primary py-1.5 md:py-2 text-xs md:text-sm font-bold shadow-lg shadow-primary/20">
                        Submit Score
                    </button>
                </div>
            </div>

            {/* Top Navigation */}
            <Navbar />
        </div>
    );
};

export default Discovered;
