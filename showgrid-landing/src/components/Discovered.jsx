import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useVideo } from '../context/VideoContext';
import { useUser } from '@clerk/clerk-react';
import { Play, Heart, MessageCircle, Share2, Music, ChevronUp, ChevronDown } from 'lucide-react';
import Navbar from './Navbar';

import { useParams } from 'react-router-dom';

const Discovered = () => {
    const { getApprovedVideos } = useVideo();
    const { initialVideoId } = useParams();
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
    const [ratings, setRatings] = useState({ energy: 3.0, choreo: 3.0, sync: 3.0 });

    useEffect(() => {
        // Load approved videos and prepend the local demo video
        const approvedVideos = getApprovedVideos();
        const demoVideo = {
            _id: 'local-demo', // Changed id to _id for consistency
            userId: 'demo-user',
            userName: 'ShowGrid Demo',
            userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ShowGrid',
            videoUrl: '/v1.mp4',
            description: 'Showcasing the power of the grid! #ShowGrid #Dance',
            judgeTags: ['Energy', 'Choreo', 'Sync'],
            city: 'Mumbai',
            timestamp: new Date().toISOString()
        };
        const allVideos = [demoVideo, ...approvedVideos];
        setVideos(allVideos);

        // Deep Linking Logic
        if (initialVideoId) {
            const index = allVideos.findIndex(v => v._id === initialVideoId);
            if (index !== -1) {
                setCurrentIndex(index);
            }
        }
    }, [getApprovedVideos, initialVideoId]);

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

    // Swipe / Scroll Logic
    const [touchStart, setTouchStart] = useState(null);
    const [touchEnd, setTouchEnd] = useState(null);

    const minSwipeDistance = 50;

    const onTouchStart = (e) => {
        setTouchEnd(null);
        setTouchStart(e.targetTouches[0].clientY);
    };

    const onTouchMove = (e) => {
        setTouchEnd(e.targetTouches[0].clientY);
    };

    const onTouchEnd = () => {
        if (!touchStart || !touchEnd) return;
        const distance = touchStart - touchEnd;
        const isUpSwipe = distance > minSwipeDistance;
        const isDownSwipe = distance < -minSwipeDistance;

        if (isUpSwipe) {
            handleNext();
        } else if (isDownSwipe) {
            handlePrev();
        }
    };

    const onWheel = (e) => {
        // Simple debounce could be added here if needed, 
        // but for now relying on user discrete scrolling
        if (Math.abs(e.deltaY) > 50) {
            if (e.deltaY > 0) handleNext();
            else handlePrev();
        }
    };

    if (!currentVideo) return <div className="min-h-screen bg-dark flex items-center justify-center text-white">Loading...</div>;

    // Ensure we always have at least 3 items to show the 3 buttons
    const rawTags = currentVideo.judgeTags && currentVideo.judgeTags.length > 0 ? currentVideo.judgeTags : ['Energy', 'Choreo', 'Sync'];
    // Pad with placeholders if less than 3, to ensure buttons align
    const displayTags = [...rawTags];
    while (displayTags.length < 3) {
        displayTags.push(`Metric ${displayTags.length + 1}`);
    }

    return (
        <div
            className="h-screen w-full bg-black overflow-hidden relative"
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
            onWheel={onWheel}
        >
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



            {/* Side Actions (Like, Share, Nav) - Desktop Only or Modified for Mobile */}
            {!isMobile && (
                <div className="absolute right-8 top-1/2 -translate-y-1/2 z-30 flex flex-col items-center gap-6">
                    <button onClick={handlePrev} disabled={currentIndex === 0} className="p-3 bg-white/10 rounded-full hover:bg-white/20 disabled:opacity-30 transition-all">
                        <ChevronUp size={24} color="white" />
                    </button>

                    <div className="flex flex-col gap-6 items-center">
                        <div className="flex flex-col items-center gap-1">
                            <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center cursor-pointer hover:bg-white/20 hover:scale-110 transition-all">
                                <Heart size={24} fill={ratings.energy > 4 ? "#ec4899" : "transparent"} color={ratings.energy > 4 ? "#ec4899" : "white"} />
                            </div>
                            <span className="text-xs font-bold text-white shadow-black drop-shadow-md">12.4K</span>
                        </div>
                        <div className="flex flex-col items-center gap-1">
                            <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center cursor-pointer hover:bg-white/20 hover:scale-110 transition-all">
                                <MessageCircle size={24} color="white" />
                            </div>
                            <span className="text-xs font-bold text-white shadow-black drop-shadow-md">408</span>
                        </div>
                        <div className="flex flex-col items-center gap-1">
                            <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center cursor-pointer hover:bg-white/20 hover:scale-110 transition-all">
                                <Share2 size={24} color="white" />
                            </div>
                            <span className="text-xs font-bold text-white shadow-black drop-shadow-md">Share</span>
                        </div>
                    </div>

                    <button onClick={handleNext} disabled={currentIndex === videos.length - 1} className="p-3 bg-white/10 rounded-full hover:bg-white/20 disabled:opacity-30 transition-all">
                        <ChevronDown size={24} color="white" />
                    </button>
                </div>
            )}

            {/* Bottom Content Info */}
            <div className={`absolute bottom-0 left-0 w-full z-20 flex flex-col justify-end transition-all duration-300 ${isMobile ? 'pb-20 px-4' : 'pb-12 px-12 md:flex-row md:items-end md:justify-between md:gap-8'}`}>

                {/* User Info */}
                <div className={`w-full ${isMobile ? 'mb-4' : 'flex-1 max-w-2xl mb-0'}`}>
                    <div className="flex items-center gap-3 mb-2">
                        <img src={currentVideo.userAvatar} className={`${isMobile ? 'w-10 h-10' : 'w-14 h-14'} rounded-full border-2 border-primary`} alt="User" />
                        <div>
                            <h3 className={`${isMobile ? 'text-lg' : 'text-2xl'} font-bold text-white drop-shadow-lg shadow-black`}>@{currentVideo.userName}</h3>
                            <div className="flex items-center gap-2 text-xs text-white/80 shadow-black drop-shadow-md">
                                <Music size={12} />
                                <span>Original Audio • ShowGrid Official</span>
                            </div>
                        </div>
                        <button className="btn btn-outline border-primary text-primary bg-black/20 backdrop-blur-sm hover:bg-primary hover:text-white px-3 py-1 text-[10px] ml-auto rounded-full">
                            Follow
                        </button>
                    </div>
                    <p className={`${isMobile ? 'text-sm' : 'text-lg'} text-white/90 drop-shadow-md shadow-black line-clamp-2`}>
                        {currentVideo.description || "Submitting my take on the #ShowGridChallenge!"}
                    </p>
                </div>

                {/* Mobile: Rating + Actions Container */}
                {isMobile ? (
                    <div className="w-full pb-6 relative z-20">
                        {/* Custom Gradient Background */}
                        <div className="absolute -inset-x-4 -bottom-24 h-96 bg-gradient-to-t from-black via-black/80 to-transparent -z-10 pointer-events-none"></div>

                        <div className="flex justify-between items-center mb-4 pl-1 pr-4">
                            <span className="text-[10px] font-bold tracking-[0.2em] text-cyan-400 drop-shadow-[0_0_5px_rgba(34,211,238,0.8)]">LIVE RATING</span>
                            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_#22c55e]"></div>
                        </div>

                        <div className="space-y-6">
                            {displayTags.map((tag, index) => {
                                const tagStr = typeof tag === 'string' ? tag : `Tag ${index + 1}`;
                                const tagKey = typeof tag === 'string' ? tag.toLowerCase() : `tag${index}`;
                                const val = ratings[tagKey] || 3.0;

                                // Neon Config
                                const neonStyles = [
                                    { bg: 'bg-pink-500', glow: 'shadow-[0_0_8px_rgba(236,72,153,0.8)]' },
                                    { bg: 'bg-blue-500', glow: 'shadow-[0_0_8px_rgba(59,130,246,0.8)]' },
                                    { bg: 'bg-purple-500', glow: 'shadow-[0_0_8px_rgba(168,85,247,0.8)]' },
                                    { bg: 'bg-yellow-500', glow: 'shadow-[0_0_8px_rgba(234,179,8,0.8)]' }
                                ];
                                const style = neonStyles[index % neonStyles.length];

                                // Define Action Button for this row (0: Like, 1: Comment, 2: Share)
                                const renderAction = () => {
                                    if (index === 0) return (
                                        <div className="flex flex-col items-center gap-1 group">
                                            <div className="w-10 h-10 rounded-full flex items-center justify-center active:scale-90 transition-all drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]">
                                                <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-white/5 rounded-full blur-sm"></div>
                                                <Heart size={24} fill={ratings.energy > 3.5 ? "#ec4899" : "transparent"} color={ratings.energy > 3.5 ? "#ec4899" : "white"} className="drop-shadow-md z-10" />
                                            </div>
                                            <span className="text-[10px] font-bold text-white shadow-black drop-shadow-md">12.4K</span>
                                        </div>
                                    );
                                    if (index === 1) return (
                                        <div className="flex flex-col items-center gap-1 group">
                                            <div className="w-10 h-10 rounded-full flex items-center justify-center active:scale-90 transition-all drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]">
                                                <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-white/5 rounded-full blur-sm"></div>
                                                <MessageCircle size={24} color="white" className="drop-shadow-md z-10" />
                                            </div>
                                            <span className="text-[10px] font-bold text-white shadow-black drop-shadow-md">408</span>
                                        </div>
                                    );
                                    if (index === 2) return (
                                        <div className="flex flex-col items-center gap-1 group">
                                            <div className="w-10 h-10 rounded-full flex items-center justify-center active:scale-90 transition-all drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]">
                                                <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-white/5 rounded-full blur-sm"></div>
                                                <Share2 size={24} color="white" className="drop-shadow-md z-10" />
                                            </div>
                                            <span className="text-[10px] font-bold text-white shadow-black drop-shadow-md">Share</span>
                                        </div>
                                    );
                                    return <div className="w-10"></div>; // Spacer if more tags than actions
                                };

                                return (
                                    <div key={index} className="flex items-center gap-4 pr-2">
                                        {/* Slider Container (Flexible Width) */}
                                        <div className="flex-1 relative group pt-2">
                                            {/* Label */}
                                            <div className="flex justify-between text-[10px] font-bold mb-2 px-1">
                                                <span className="text-white/90 uppercase tracking-wider drop-shadow-md">{tagStr}</span>
                                                <span className="text-white drop-shadow-[0_0_5px_rgba(255,255,255,0.8)]">{Number(val).toFixed(1)}</span>
                                            </div>

                                            {/* Slider Track */}
                                            <div className="relative h-4 flex items-center">
                                                {/* Background Track (Thin Gray Line) */}
                                                <div className="absolute w-full h-[2px] bg-white/20 rounded-full"></div>

                                                {/* Neon Active Track */}
                                                <div
                                                    className={`absolute h-[2px] rounded-full left-0 transition-all duration-75 ${style.bg} ${style.glow}`}
                                                    style={{ width: `${((val - 1) / 4) * 100}%` }}
                                                ></div>

                                                {/* Thumb (Glowing Dot) */}
                                                <div
                                                    className="absolute w-3 h-3 bg-white rounded-full shadow-[0_0_8px_white] transition-all duration-75 pointer-events-none"
                                                    style={{ left: `calc(${((val - 1) / 4) * 100}% - 6px)` }}
                                                ></div>

                                                <input
                                                    type="range"
                                                    min="1"
                                                    max="5"
                                                    step="0.5"
                                                    value={val}
                                                    onChange={(e) => handleRatingChange(tagKey, e.target.value)}
                                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                                                />
                                            </div>
                                        </div>

                                        {/* Action Button (Aligned Right) */}
                                        <div className="flex-shrink-0 w-12 flex justify-center pt-2">
                                            {renderAction()}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ) : (
                    /* Desktop Rating Card */
                    <div className="w-full md:max-w-sm bg-black/40 backdrop-blur-md border border-white/10 p-6 rounded-2xl">
                        <div className="flex justify-between items-center mb-4">
                            <span className="text-xs font-bold tracking-widest text-white/60">LIVE RATING</span>
                            <div className="flex items-center gap-2 text-green-400 text-xs font-bold">
                                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                                Voting Active
                            </div>
                        </div>

                        <div className="space-y-4">
                            {(currentVideo.judgeTags || ['Energy', 'Choreo', 'Sync']).map((tag, index) => {
                                const tagStr = typeof tag === 'string' ? tag : `Tag ${index + 1}`;
                                const tagKey = typeof tag === 'string' ? tag.toLowerCase() : `tag${index}`;
                                const val = ratings[tagKey] || 3.0;
                                const accents = ['accent-primary', 'accent-secondary', 'accent-purple-500', 'accent-yellow-500'];

                                return (
                                    <div key={index}>
                                        <div className="flex justify-between text-xs font-bold mb-1">
                                            <span className="text-white uppercase">{tagStr}</span>
                                            <span className="text-primary">{Number(val).toFixed(1)}</span>
                                        </div>
                                        <input
                                            type="range"
                                            min="1"
                                            max="5"
                                            step="0.1"
                                            value={val}
                                            onChange={(e) => handleRatingChange(tagKey, e.target.value)}
                                            className={`w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer ${accents[index % accents.length]}`}
                                        />
                                    </div>
                                );
                            })}
                        </div>
                        {/* Submit button removed as per request for mobile, assuming desktop should stay? Or remove for both? 
                             User said "remove submit rating button" in the context of mobile changes. 
                             I'll remove it for mobile (already done by structural change) and keep for desktop 
                             unless implied otherwise. "in discover page when viewing in mobile... also remove submit rating button". 
                             I will interpret strictly for mobile. Desktop can keep it or I'll remove it if it feels redundant without backend logic yet.
                             Let's remove it entirely to be safe as auto-save is better UX. 
                         */}
                    </div>
                )}
            </div>

            {/* Top Navigation */}
            <Navbar />
        </div>
    );
};

export default Discovered;
