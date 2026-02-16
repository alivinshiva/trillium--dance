import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useVideo } from '../context/VideoContext';
import { useUser } from '@clerk/clerk-react';
import { Play, Heart, MessageCircle, Share2, Music, ChevronUp, ChevronDown, Check, Home, Trophy, BarChart2, User } from 'lucide-react';
import Navbar from './Navbar';



const Discovered = () => {
    const { getApprovedVideos, getPresets, addComment, likeVideo, rateVideo, shareVideo, getVideoStats } = useVideo();
    const { initialVideoId } = useParams();
    const { user } = useUser();

    // Main State
    const [videos, setVideos] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(true);
    const videoRef = React.useRef(null);
    // Mobile Detection
    const [isMobile, setIsMobile] = useState(false);
    // Interaction State
    const [interactionStats, setInteractionStats] = useState({ likes: 0, comments: 0, shares: 0, ratingAverage: 0, ratingCount: 0 });
    const [userInteraction, setUserInteraction] = useState({ hasLiked: false, userRating: null });

    // Slider State
    const [ratings, setRatings] = useState({ energy: 3.0, choreo: 3.0, sync: 3.0 });

    const currentVideo = videos[currentIndex];

    useEffect(() => {
        if (currentVideo) {
            const loadStats = async () => {
                const data = await getVideoStats(currentVideo._id);
                if (data) {
                    setInteractionStats(data.stats);
                    setUserInteraction(data.user);
                }
            };
            loadStats();
        }
    }, [currentVideo, getVideoStats, user]);

    const handleLike = async () => {
        if (!user) return alert("Please sign in to like");
        const wasLiked = userInteraction.hasLiked;
        setUserInteraction(prev => ({ ...prev, hasLiked: !wasLiked }));
        setInteractionStats(prev => ({ ...prev, likes: prev.likes + (wasLiked ? -1 : 1) }));
        try { await likeVideo(currentVideo._id); }
        catch (e) { setUserInteraction(prev => ({ ...prev, hasLiked: wasLiked })); }
    };

    // Handle Slider Change
    const handleRatingChange = (category, value) => {
        setRatings(prev => ({ ...prev, [category]: parseFloat(value) }));
    };

    // Calculate Average and Submit Rating
    useEffect(() => {
        // Debounce or wait for user to stop sliding? 
        // For now, we'll assume user will slide and we submit when they let go? 
        // Actually, let's add a "Submit" or auto-submit on change with debounce if needed.
        // But user asked to restore "previous rating ui". 
        // Integrating calls: We'll calculate average and send to backend on change (debounced ideally) or just keep local state
        // and add a button? No, let's auto-submit on touch end or just simple timeout.
        const timeoutId = setTimeout(() => {
            if (currentVideo && user) {
                const vals = Object.values(ratings);
                const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
                // Only rate if changed significantly? 
                // Let's just submit. Backend handles upsert.
                rateVideo(currentVideo._id, Math.round(avg));
            }
        }, 1000);
        return () => clearTimeout(timeoutId);
    }, [ratings, currentVideo, user, rateVideo]);


    // Sync Sliders with existing User Rating
    useEffect(() => {
        if (userInteraction.userRating) {
            setRatings({
                energy: userInteraction.userRating,
                choreo: userInteraction.userRating,
                sync: userInteraction.userRating
            });
        }
    }, [userInteraction.userRating]);

    // Commenting Logic
    const [showComments, setShowComments] = useState(false);
    const [commentPresets, setCommentPresets] = useState({ positive: [], neutral: [], negative: [] });

    useEffect(() => {
        const loadPresets = async () => {
            if (currentVideo && currentVideo.challengeId && currentVideo.challengeId.presetComments) {
                setCommentPresets(currentVideo.challengeId.presetComments);
            } else {
                const data = await getPresets();
                if (data) setCommentPresets(data);
            }
        };
        loadPresets();
    }, [getPresets, currentVideo]);

    const navigate = useNavigate();

    useEffect(() => {
        const approvedVideos = getApprovedVideos();
        setVideos(approvedVideos);
        if (initialVideoId && approvedVideos.length > 0) {
            const index = approvedVideos.findIndex(v => v._id === initialVideoId);
            if (index !== -1) setCurrentIndex(index);
        }
    }, [getApprovedVideos, initialVideoId]);

    // Update URL when current video changes
    useEffect(() => {
        if (currentVideo) {
            navigate(`/discovered/feed/${currentVideo._id}`, { replace: true });
        }
    }, [currentVideo, navigate]);

    const handleNext = () => { if (currentIndex < videos.length - 1) setCurrentIndex(prev => prev + 1); };
    const handlePrev = () => { if (currentIndex > 0) setCurrentIndex(prev => prev - 1); };

    const togglePlay = () => {
        if (videoRef.current) {
            if (isPlaying) videoRef.current.pause();
            else videoRef.current.play();
            setIsPlaying(!isPlaying);
        }
    };

    const handlePresetComment = async (text, type) => {
        if (!user || !currentVideo) return;
        try {
            await addComment(currentVideo._id, {
                userId: user.id, userName: user.fullName || user.username, userAvatar: user.imageUrl, text, type
            });
            setShowComments(false);
        } catch (err) { console.error("Failed to post comment", err); }
    };

    // Mobile Check
    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // ... (rest of interactions)

    if (!currentVideo) return <div className="min-h-screen bg-black flex items-center justify-center text-white">Loading...</div>;

    // Tags
    const rawTags = currentVideo.judgeTags && currentVideo.judgeTags.length > 0 ? currentVideo.judgeTags : ['Energy', 'Choreo', 'Sync'];
    const displayTags = [...rawTags];
    while (displayTags.length < 3) displayTags.push(`Metric ${displayTags.length + 1}`);

    return (
        <div className="h-screen w-full bg-black overflow-hidden relative flex">
            {/* Desktop Navbar / Sidebar (Left) */}
            {!isMobile && (
                <div className="w-20 h-full flex flex-col items-center py-6 gap-8 bg-black/40 backdrop-blur-md border-r border-white/10 z-30">
                    <Link to="/" className="mb-4"><Play fill="#ec4899" color="#ec4899" size={32} style={{ transform: 'rotate(-10deg)' }} /></Link>
                    <Link to="/" className="p-2 text-white/40 hover:text-white transition-colors"><Home size={24} /></Link>
                    <Link to="/challenges" className="p-2 text-white/40 hover:text-white transition-colors"><Trophy size={24} /></Link>
                    <Link to="/leaderboard" className="p-2 text-white/40 hover:text-white transition-colors"><BarChart2 size={24} /></Link>
                    <Link to="/profile" className="p-2 text-white/40 hover:text-white transition-colors"><User size={24} /></Link>
                </div>
            )}

            {/* Main Content Area */}
            <div className="flex-grow relative flex justify-center bg-black">
                {/* Desktop Overlays */}
                {!isMobile && (
                    <>
                        {/* Bottom-Left Info Overlay */}
                        <div className="absolute left-8 bottom-8 z-30 max-w-md text-left shadow-black drop-shadow-lg pointer-events-none">
                            <div className="bg-black/20 backdrop-blur-sm p-6 rounded-3xl border border-white/5 pointer-events-auto">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="w-1 h-4 bg-primary rounded-full"></div>
                                    <h4 className="text-xs font-bold text-white/80 uppercase tracking-widest">
                                        {currentVideo.challengeId?.title || 'Challenge'}
                                    </h4>
                                </div>
                                <h2 className="text-3xl font-extrabold text-white mb-4 leading-tight">
                                    @{currentVideo.userName}
                                </h2>
                                <div className="flex flex-wrap gap-2">
                                    {displayTags.map((tag, i) => (
                                        <span key={i} className="px-3 py-1 bg-white/10 rounded-full text-xs font-bold text-white/90 backdrop-blur-md border border-white/5">
                                            #{typeof tag === 'string' ? tag.replace(/\s+/g, '') : `Tag${i + 1}`}
                                        </span>
                                    ))}
                                </div>
                                {currentVideo.description && (
                                    <p className="border-t border-white/10 mt-4 pt-3 text-sm text-white/60 line-clamp-2">
                                        {currentVideo.description}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Right-Side Actions & Rating */}
                        <div className="absolute right-8 top-1/2 -translate-y-1/2 z-30 flex items-center gap-6">

                            {/* Rating Card (Left of Buttons) */}
                            <div className="bg-black/40 backdrop-blur-md border border-white/10 p-5 rounded-2xl w-64 shadow-xl">
                                <div className="flex justify-between items-center mb-4 border-b border-white/10 pb-2">
                                    <h3 className="text-xs font-bold text-white uppercase tracking-wider">Live Rating</h3>
                                    <div className="flex gap-1">
                                        <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></div>
                                        <span className="text-[10px] font-bold text-red-500 uppercase">Rec</span>
                                    </div>
                                </div>
                                <div className="space-y-5">
                                    {displayTags.map((tag, index) => {
                                        const tagStr = typeof tag === 'string' ? tag : `Tag ${index + 1}`;
                                        const tagKey = typeof tag === 'string' ? tag.toLowerCase() : `tag${index}`;
                                        const val = ratings[tagKey] || 3.0;
                                        const accents = ['accent-cyan-400', 'accent-fuchsia-500', 'accent-lime-400', 'accent-yellow-400'];
                                        const glowColor = ['shadow-[0_0_10px_rgba(34,211,238,0.5)]', 'shadow-[0_0_10px_rgba(217,70,239,0.5)]', 'shadow-[0_0_10px_rgba(163,230,53,0.5)]', 'shadow-[0_0_10px_rgba(250,204,21,0.5)]'];
                                        return (
                                            <div key={index}>
                                                <div className="flex justify-between text-[10px] font-bold mb-1.5">
                                                    <span className="text-white/80 uppercase tracking-wide">{tagStr}</span>
                                                    <span className="text-white bg-white/10 px-1.5 rounded text-[10px]">{Number(val).toFixed(0)}</span>
                                                </div>
                                                <input type="range" min="1" max="5" step="1" value={val}
                                                    onChange={(e) => handleRatingChange(tagKey, e.target.value)}
                                                    className={`w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer ${accents[index % accents.length]} ${glowColor[index % glowColor.length]}`} />
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Vertical Action Buttons */}
                            <div className="flex flex-col gap-4">
                                <button onClick={handlePrev} disabled={currentIndex === 0} className="p-3 bg-white/5 rounded-full hover:bg-white/20 disabled:opacity-0 transition-all self-center mb-2">
                                    <ChevronUp size={24} color="white" />
                                </button>

                                <div className="flex flex-col items-center gap-1 group">
                                    <div onClick={handleLike} className="w-12 h-12 bg-black/40 backdrop-blur-md border border-white/10 rounded-full flex items-center justify-center hover:bg-white/20 hover:scale-110 cursor-pointer transition-all shadow-lg">
                                        <Heart size={24} fill={userInteraction.hasLiked ? "#ec4899" : "transparent"} color={userInteraction.hasLiked ? "#ec4899" : "white"} />
                                    </div>
                                    <span className="text-[10px] font-bold text-white shadow-black drop-shadow-md">{interactionStats.likes}</span>
                                </div>
                                <div className="flex flex-col items-center gap-1 group">
                                    <div onClick={() => setShowComments(true)} className="w-12 h-12 bg-black/40 backdrop-blur-md border border-white/10 rounded-full flex items-center justify-center hover:bg-white/20 hover:scale-110 cursor-pointer transition-all shadow-lg">
                                        <MessageCircle size={24} color="white" />
                                    </div>
                                    <span className="text-[10px] font-bold text-white shadow-black drop-shadow-md">{interactionStats.comments}</span>
                                </div>
                                <div className="flex flex-col items-center gap-1 group">
                                    <div onClick={() => shareVideo(currentVideo._id)} className="w-12 h-12 bg-black/40 backdrop-blur-md border border-white/10 rounded-full flex items-center justify-center hover:bg-white/20 hover:scale-110 cursor-pointer transition-all shadow-lg">
                                        <Share2 size={24} color="white" />
                                    </div>
                                    <span className="text-[10px] font-bold text-white shadow-black drop-shadow-md">{interactionStats.shares}</span>
                                </div>

                                <button onClick={handleNext} disabled={currentIndex === videos.length - 1} className="p-3 bg-white/5 rounded-full hover:bg-white/20 disabled:opacity-0 transition-all self-center mt-2">
                                    <ChevronDown size={24} color="white" />
                                </button>
                            </div>
                        </div>
                    </>
                )}

                {/* Video Player Container */}
                <div className={`relative h-full ${isMobile ? 'w-full' : 'aspect-[9/16] max-w-[500px] border-x border-white/5'}`} onClick={togglePlay}>
                    <video ref={videoRef} src={currentVideo.videoUrl} className="w-full h-full object-cover" autoPlay loop playsInline />
                    {!isPlaying && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40 z-10 pointer-events-none">
                            <Play size={64} fill="white" className="text-white opacity-80" />
                        </div>
                    )}

                    {/* Mobile Controls Overlay */}
                    {isMobile && (
                        <div className="absolute inset-x-0 bottom-0 z-20 flex flex-col justify-end pb-[80px]">
                            {/* User Info (Above Interaction Area) */}
                            <div className="px-4 mb-2">
                                <h3 className="text-lg font-bold text-white drop-shadow-md">@{currentVideo.userName}</h3>
                                <p className="text-xs text-white/80 line-clamp-2">{currentVideo.description}</p>
                            </div>

                            {/* Interaction Area (Auto Height, Min 180px) */}
                            <div className="flex w-full min-h-[180px] h-auto items-end">
                                {/* Left: Rating Sliders (Takes remaining space) */}
                                <div className="flex-1 flex flex-col justify-end px-4 py-2 gap-3 min-w-0">
                                    {displayTags.map((tag, index) => {
                                        const tagStr = typeof tag === 'string' ? tag : `Tag ${index + 1}`;
                                        const tagKey = typeof tag === 'string' ? tag.toLowerCase() : `tag${index}`;
                                        const val = ratings[tagKey] || 3.0;

                                        const accents = ['accent-cyan-400', 'accent-fuchsia-500', 'accent-lime-400', 'accent-yellow-400'];
                                        const glowColor = ['drop-shadow-[0_0_5px_rgba(34,211,238,0.8)]', 'drop-shadow-[0_0_5px_rgba(217,70,239,0.8)]', 'drop-shadow-[0_0_5px_rgba(163,230,53,0.8)]', 'drop-shadow-[0_0_5px_rgba(250,204,21,0.8)]'];

                                        return (
                                            <div key={index} className="flex flex-col gap-1">
                                                <div className="flex justify-between text-[10px] font-bold text-white shadow-black drop-shadow-md whitespace-nowrap">
                                                    <span className="uppercase tracking-wider truncate mr-2">{tagStr}</span>
                                                    <span>{Number(val).toFixed(0)}</span>
                                                </div>
                                                <input type="range" min="1" max="5" step="1" value={val}
                                                    onChange={(e) => handleRatingChange(tagKey, e.target.value)}
                                                    className={`w-full h-1 bg-white/30 rounded-lg appearance-none cursor-pointer ${accents[index % accents.length]} ${glowColor[index % glowColor.length]}`}
                                                />
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Right: Action Buttons (Fixed width to prevent squishing) */}
                                <div className="w-14 flex-none flex flex-col justify-end items-center gap-4 pb-2">
                                    <div className="flex flex-col items-center gap-1" onClick={handleLike}>
                                        <Heart size={24} fill={userInteraction.hasLiked ? "#ec4899" : "transparent"} color={userInteraction.hasLiked ? "#ec4899" : "white"} />
                                        <span className="text-[10px] font-bold text-white">{interactionStats.likes}</span>
                                    </div>
                                    <div className="flex flex-col items-center gap-1" onClick={() => setShowComments(true)}>
                                        <MessageCircle size={24} color="white" />
                                        <span className="text-[10px] font-bold text-white">{interactionStats.comments}</span>
                                    </div>
                                    <div className="flex flex-col items-center gap-1" onClick={() => shareVideo(currentVideo._id)}>
                                        <Share2 size={24} color="white" />
                                        <span className="text-[10px] font-bold text-white">{interactionStats.shares}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Comments Modal (Keeping as is, just ensuring visibility) */}
            {showComments && (
                <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-[#111] border border-white/10 w-full max-w-md rounded-3xl p-6 relative">
                        <button onClick={() => setShowComments(false)} className="absolute top-4 right-4 text-white/40 hover:text-white"><ChevronDown /></button>
                        <h3 className="text-xl font-bold text-white mb-4">Comments</h3>
                        {/* Simplified Comment UI for Brevity - Presets logic retained from state */}
                        <div className="space-y-4 max-h-[60vh] overflow-y-auto">
                            {/* Positive */}
                            {commentPresets.positive && commentPresets.positive.length > 0 && (
                                <div>
                                    <h4 className="text-xs font-bold text-green-400 uppercase tracking-wider mb-2">Hype Them Up!</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {commentPresets.positive.map((text, i) => (
                                            <button key={i} onClick={() => handlePresetComment(text, 'positive')} className="text-xs px-3 py-2 bg-green-500/10 border border-green-500/30 rounded-full text-green-100 hover:bg-green-500/20">{text}</button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Neutral */}
                            {commentPresets.neutral && commentPresets.neutral.length > 0 && (
                                <div>
                                    <h4 className="text-xs font-bold text-yellow-400 uppercase tracking-wider mb-2">Observations</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {commentPresets.neutral.map((text, i) => (
                                            <button key={i} onClick={() => handlePresetComment(text, 'neutral')} className="text-xs px-3 py-2 bg-yellow-500/10 border border-yellow-500/30 rounded-full text-yellow-100 hover:bg-yellow-500/20">{text}</button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Negative */}
                            {commentPresets.negative && commentPresets.negative.length > 0 && (
                                <div>
                                    <h4 className="text-xs font-bold text-purple-400 uppercase tracking-wider mb-2">Constructive</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {commentPresets.negative.map((text, i) => (
                                            <button key={i} onClick={() => handlePresetComment(text, 'negative')} className="text-xs px-3 py-2 bg-purple-500/10 border border-purple-500/30 rounded-full text-purple-100 hover:bg-purple-500/20">{text}</button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Mobile Nav logic handled by Navbar component externally usually, but if we want strictly full custom layout we might need to suppress it. 
                However, Navbar.jsx has logic to always show on mobile. Steps to ensure it doesn't overlap content: 
                The video container has padding-bottom? In mobile overlay I added pb-20.
            */}
            {isMobile && <Navbar />}
        </div>
    );
};

export default Discovered;
