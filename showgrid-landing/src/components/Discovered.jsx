import React, { useState, useEffect } from 'react';
import { useVideo } from '../context/VideoContext';
import { useUser } from '@clerk/clerk-react';
import { Play, Heart, MessageCircle, Share2, Music, ChevronUp, ChevronDown } from 'lucide-react';

const Discovered = () => {
    const { getApprovedVideos } = useVideo();
    const { user } = useUser();

    const [videos, setVideos] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(true);
    const videoRef = React.useRef(null);

    // Rating State
    const [ratings, setRatings] = useState({ energy: 5.0, choreo: 5.0, sync: 5.0 });

    useEffect(() => {
        // Load approved videos
        setVideos(getApprovedVideos());
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

            {/* Navigation Controls (Desktop) */}
            <div className="absolute right-8 top-1/2 -translate-y-1/2 z-20 hidden lg:flex flex-col gap-4">
                <button
                    onClick={handlePrev}
                    disabled={currentIndex === 0}
                    className="p-3 bg-white/10 rounded-full hover:bg-white/20 disabled:opacity-30 transition-all"
                >
                    <ChevronUp size={24} color="white" />
                </button>
                <div className="flex flex-col gap-6 items-center">
                    <div className="flex flex-col items-center gap-1">
                        <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center cursor-pointer hover:bg-white/20 hover:scale-110 transition-all">
                            <Heart size={24} fill={ratings.energy > 8 ? "#ec4899" : "transparent"} color={ratings.energy > 8 ? "#ec4899" : "white"} />
                        </div>
                        <span className="text-xs font-bold text-white">12.4K</span>
                    </div>
                    <div className="flex flex-col items-center gap-1">
                        <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center cursor-pointer hover:bg-white/20 hover:scale-110 transition-all">
                            <MessageCircle size={24} color="white" />
                        </div>
                        <span className="text-xs font-bold text-white">408</span>
                    </div>
                    <div className="flex flex-col items-center gap-1">
                        <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center cursor-pointer hover:bg-white/20 hover:scale-110 transition-all">
                            <Share2 size={24} color="white" />
                        </div>
                        <span className="text-xs font-bold text-white">Share</span>
                    </div>
                </div>
                <button
                    onClick={handleNext}
                    disabled={currentIndex === videos.length - 1}
                    className="p-3 bg-white/10 rounded-full hover:bg-white/20 disabled:opacity-30 transition-all"
                >
                    <ChevronDown size={24} color="white" />
                </button>
            </div>

            {/* Bottom Content Info */}
            <div className="absolute bottom-0 left-0 w-full p-6 md:p-12 z-20 flex flex-col md:flex-row items-end justify-between gap-8">
                {/* User Info */}
                <div className="flex-1 max-w-2xl">
                    <div className="flex items-center gap-3 mb-4">
                        <img src={currentVideo.userAvatar} className="w-14 h-14 rounded-full border-2 border-primary" alt="User" />
                        <div>
                            <h3 className="text-2xl font-bold text-white drop-shadow-lg">@{currentVideo.userName}</h3>
                            <div className="flex items-center gap-2 text-sm text-white/80">
                                <Music size={14} />
                                <span>Original Audio • ShowGrid Official</span>
                            </div>
                        </div>
                        <button className="btn btn-outline border-primary text-primary hover:bg-primary hover:text-white px-4 py-1 text-xs ml-4">
                            Follow
                        </button>
                    </div>
                    <p className="text-lg text-white/90 mb-6 drop-shadow-md">
                        {currentVideo.description || "Submitting my take on the #ShowGridChallenge! Let me know what you think of the drop at 0:34 🔥"} #dance #competition
                    </p>
                </div>

                {/* Rating Sliders (Bottom Right on Desktop, Bottom Center on Mobile) */}
                <div className="bg-black/40 backdrop-blur-md border border-white/10 p-6 rounded-2xl w-full max-w-sm">
                    <div className="flex justify-between items-center mb-4">
                        <span className="text-xs font-bold tracking-widest text-white/60">LIVE RATING</span>
                        <div className="flex items-center gap-2 text-green-400 text-xs font-bold">
                            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                            {user?.fullName || "Guest"} Voting
                        </div>
                    </div>

                    <div className="space-y-4">
                        {currentVideo.judgeTags && currentVideo.judgeTags.map((tag, index) => {
                            // Use safe defaults for colors/keys if tags are dynamic
                            const colors = ['text-primary', 'text-secondary', 'text-purple-400', 'text-yellow-400'];
                            const accents = ['accent-primary', 'accent-secondary', 'accent-purple-500', 'accent-yellow-500'];
                            // We map tags to state keys like tag0, tag1, etc. for simplicity in this demo
                            const tagKey = `tag${index}`;
                            const val = ratings[tagKey] || 5.0;

                            return (
                                <div key={index}>
                                    <div className="flex justify-between text-xs font-bold mb-1">
                                        <span className="text-white uppercase">{tag}</span>
                                        <span className={colors[index % colors.length]}>{val.toFixed(1)}</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="0"
                                        max="10"
                                        step="0.1"
                                        value={val}
                                        onChange={(e) => handleRatingChange(tagKey, e.target.value)}
                                        className={`w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer ${accents[index % accents.length]} hover:brightness-110 transition-all`}
                                    />
                                </div>
                            );
                        })}

                        {/* Fallback if no tags (legacy videos) */}
                        {!currentVideo.judgeTags && (
                            <>
                                <div>
                                    <div className="flex justify-between text-xs font-bold mb-1">
                                        <span className="text-white">ENERGY</span>
                                        <span className="text-primary">{ratings.energy?.toFixed(1) || "5.0"}</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="0"
                                        max="10"
                                        step="0.1"
                                        value={ratings.energy || 5.0}
                                        onChange={(e) => handleRatingChange('energy', e.target.value)}
                                        className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-primary hover:accent-pink-400 transition-all"
                                    />
                                </div>
                                <div>
                                    <div className="flex justify-between text-xs font-bold mb-1">
                                        <span className="text-white">CHOREO</span>
                                        <span className="text-secondary">{ratings.choreo?.toFixed(1) || "5.0"}</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="0"
                                        max="10"
                                        step="0.1"
                                        value={ratings.choreo || 5.0}
                                        onChange={(e) => handleRatingChange('choreo', e.target.value)}
                                        className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-secondary hover:accent-cyan-300 transition-all"
                                    />
                                </div>
                                <div>
                                    <div className="flex justify-between text-xs font-bold mb-1">
                                        <span className="text-white">SYNC</span>
                                        <span className="text-purple-400">{ratings.sync?.toFixed(1) || "5.0"}</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="0"
                                        max="10"
                                        step="0.1"
                                        value={ratings.sync || 5.0}
                                        onChange={(e) => handleRatingChange('sync', e.target.value)}
                                        className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-purple-500 hover:accent-purple-400 transition-all"
                                    />
                                </div>
                            </>
                        )}
                    </div>

                    <button className="w-full mt-6 btn btn-primary py-2 text-sm">
                        Submit Score
                    </button>
                </div>
            </div>

            {/* Top Navigation */}
            <div className="absolute top-0 left-0 w-full p-6 z-20 flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent">
                <div className="flex items-center gap-2 font-bold text-white">
                    <Play fill="#ec4899" color="#ec4899" size={20} />
                    <span className="tracking-tighter">ShowGrid</span>
                </div>
                <div className="flex gap-4 text-sm font-bold text-white/70">
                    <span className="text-white border-b-2 border-primary pb-1">Following</span>
                    <span className="hover:text-white cursor-pointer transition-colors">For You</span>
                </div>
            </div>
        </div>
    );
};

export default Discovered;
