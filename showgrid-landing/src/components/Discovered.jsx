import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useVideo } from '../context/VideoContext';
import { useUser, useClerk } from '@clerk/clerk-react';
import { Play, Heart, MessageCircle, Share2, Music, ChevronUp, ChevronDown, Check, Home, Trophy, BarChart2, User, Lock, Trash2, MapPin } from 'lucide-react';
import Navbar from './Navbar';
import SubChallengeCard from './SubChallengeCard';



const Discovered = () => {
    const { fetchFeed, getPresets, addComment, deleteComment, likeVideo, rateVideo, shareVideo, getVideoStats, getPublicVideoUrl, nativeShare } = useVideo();
    const { initialVideoId } = useParams();
    const { user } = useUser();
    const { openSignIn } = useClerk();

    // Main State
    const [videos, setVideos] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [feedPage, setFeedPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [feedLoading, setFeedLoading] = useState(false);
    const [feedSort, setFeedSort] = useState('latest');
    const [isPlaying, setIsPlaying] = useState(true);
    const [progress, setProgress] = useState(0);
    const videoRef = React.useRef(null);

    const handleTimeUpdate = () => {
        if (videoRef.current) {
            const current = videoRef.current.currentTime;
            const duration = videoRef.current.duration;
            if (duration > 0) {
                setProgress((current / duration) * 100);
            }
        }
    };

    const handleSeek = (e) => {
        if (videoRef.current) {
            const percent = parseFloat(e.target.value);
            const seekTime = (percent / 100) * videoRef.current.duration;
            videoRef.current.currentTime = seekTime;
            setProgress(percent);
        }
    };

    // Mobile Detection
    const [isMobile, setIsMobile] = useState(false);
    // Interaction State
    const [interactionStats, setInteractionStats] = useState({ likes: 0, comments: 0, shares: 0, ratingAverage: 0, ratingCount: 0 });
    const [userInteraction, setUserInteraction] = useState({ hasLiked: false, userRating: null });

    // Slider State
    const [ratings, setRatings] = useState({});



    // Info Ticker State
    const [infoMode, setInfoMode] = useState('song'); // 'song' | 'location'

    useEffect(() => {
        const interval = setInterval(() => {
            setInfoMode(prev => prev === 'song' ? 'location' : 'song');
        }, 2000); // Toggle every 2 seconds
        return () => clearInterval(interval);
    }, []);

    const currentVideo = videos[currentIndex];
    const isSubChallenge = currentVideo?.type === 'sub_challenge';

    useEffect(() => {
        if (!currentVideo || isSubChallenge) return;
        setProgress(0); // Reset progress on video change
        const loadStats = async () => {
            const data = await getVideoStats(currentVideo._id);
            if (data) {
                setInteractionStats(data.stats);
                setUserInteraction(data.user);
            }
        };
        loadStats();
    }, [currentVideo, getVideoStats, user]);

    const handleLike = async () => {
        if (!user) return openSignIn();
        // Prevent owner from liking their own video
        if (currentVideo && user.id === currentVideo.userId) return;

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
        const timeoutId = setTimeout(() => {
            if (currentVideo && user && Object.keys(ratings).length > 0 && currentVideo.challengeId?.ratingParameters) {
                const params = currentVideo.challengeId.ratingParameters;

                let totalScore = 0;
                let totalWeight = 0;

                params.forEach(p => {
                    const key = p.name.toLowerCase().replace(/\s+/g, '');
                    const val = ratings[key] || 3.0; // Default to 3 if not set
                    totalScore += val * p.weight;
                    totalWeight += p.weight;
                });

                const weightedAvg = totalWeight > 0 ? (totalScore / totalWeight) : 3.0;

                // Submit rounded rating (1-5)
                rateVideo(currentVideo._id, Math.round(weightedAvg));
            }
        }, 1000);
        return () => clearTimeout(timeoutId);
    }, [ratings, currentVideo, user, rateVideo]);


    // Sync Sliders with existing User Rating
    // Sync Sliders with existing User Rating or Defaults
    useEffect(() => {
        if (currentVideo && !isSubChallenge && currentVideo.challengeId) {
            const params = currentVideo.challengeId.ratingParameters || [
                { name: 'Energy', weight: 10 },
                { name: 'Choreo', weight: 10 },
                { name: 'Sync', weight: 10 }
            ];

            const newRatings = {};
            params.forEach(p => {
                const key = p.name.toLowerCase().replace(/\s+/g, '');
                // If user has already rated, pre-fill with that overall rating or 3.0
                // Ideally we'd store per-parameter rating but for now we just show global userRating
                newRatings[key] = userInteraction.userRating || 3.0;
            });
            setRatings(newRatings);
        }
    }, [currentVideo, userInteraction.userRating]);

    // Commenting Logic
    const [showComments, setShowComments] = useState(false);
    const [commentPresets, setCommentPresets] = useState({ positive: [], neutral: [], negative: [] });

    useEffect(() => {
        if (isSubChallenge) return;
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

    // Initial feed load
    useEffect(() => {
        const loadInitialFeed = async () => {
            setFeedLoading(true);
            const result = await fetchFeed({ page: 1, limit: 10, sort: feedSort });
            setVideos(result.data);
            setHasMore(result.pagination.hasMore);
            setFeedPage(1);

            // Find initial video if provided via URL
            if (initialVideoId && result.data.length > 0) {
                const index = result.data.findIndex(v => v._id === initialVideoId);
                if (index !== -1) setCurrentIndex(index);
            }
            setFeedLoading(false);
        };
        loadInitialFeed();
    }, [initialVideoId, feedSort]);

    // Load more videos (infinite scroll)
    const loadMore = async () => {
        if (feedLoading || !hasMore) return;
        setFeedLoading(true);
        const nextPage = feedPage + 1;
        const result = await fetchFeed({ page: nextPage, limit: 10, sort: feedSort });
        setVideos(prev => [...prev, ...result.data]);
        setFeedPage(nextPage);
        setHasMore(result.pagination.hasMore);
        setFeedLoading(false);
    };

    // Update URL when current video changes
    useEffect(() => {
        if (currentVideo && !isSubChallenge) {
            navigate(`/discovered/feed/${currentVideo._id}`, { replace: true });
        }
    }, [currentVideo, navigate]);

    const handleNext = () => {
        if (!user) return openSignIn();
        if (currentIndex < videos.length - 1) {
            setCurrentIndex(prev => prev + 1);
            // Load more when near the end (within 3 videos of the end)
            if (currentIndex >= videos.length - 3 && hasMore && !feedLoading) {
                loadMore();
            }
        }
    };
    const handlePrev = () => {
        if (!user) return openSignIn();
        if (currentIndex > 0) setCurrentIndex(prev => prev - 1);
    };


    // --- Scroll & Swipe Logic ---
    const [touchStart, setTouchStart] = useState(null);
    const [touchEnd, setTouchEnd] = useState(null);
    const lastScrollTime = React.useRef(0);
    const SCROLL_COOLDOWN = 800; // ms

    // Min swipe distance (in px) 
    const minSwipeDistance = 50;

    const onTouchStart = (e) => {
        setTouchEnd(null); // Reset
        setTouchStart(e.targetTouches[0].clientY);
    };

    const onTouchMove = (e) => {
        setTouchEnd(e.targetTouches[0].clientY);
    };

    const onTouchEnd = () => {
        if (!touchStart || !touchEnd) return;
        const distance = touchStart - touchEnd;
        const isSwipeUp = distance > minSwipeDistance;
        const isSwipeDown = distance < -minSwipeDistance;

        if (isSwipeUp) {
            handleNext();
        } else if (isSwipeDown) {
            handlePrev();
        }
    };

    // Wheel Event for Desktop
    useEffect(() => {
        const handleWheel = (e) => {
            // Prevent default scroll behavior if needed, or just let it trigger nav
            // e.preventDefault(); 
            // Better to not e.preventDefault() globally unless we are sure about container bounds, 
            // but for full screen video feed it's usually expected.

            const now = Date.now();
            if (now - lastScrollTime.current > SCROLL_COOLDOWN) {
                if (e.deltaY > 50) {
                    handleNext();
                    lastScrollTime.current = now;
                } else if (e.deltaY < -50) {
                    handlePrev();
                    lastScrollTime.current = now;
                }
            }
        };

        window.addEventListener('wheel', handleWheel);
        return () => window.removeEventListener('wheel', handleWheel);
    }, [handleNext, handlePrev]); // Dependencies are stable? handleNext/Prev use state, need to wrap them or use refs/functional updates

    // Fix handleNext/Prev stability for useEffect
    // Actually handleNext/Prev depend on 'currentIndex' and 'videos'. 
    // This might cause re-attaching event listener on every slide change, which is fine but let's check.
    // Yes, they depend on state. Re-attaching is okay for this logic.

    const togglePlay = () => {
        if (videoRef.current) {
            if (isPlaying) videoRef.current.pause();
            else videoRef.current.play();
            setIsPlaying(!isPlaying);
        }
    };

    const handlePresetComment = async (text, type) => {
        if (!user) return openSignIn();
        if (!currentVideo) return;
        try {
            await addComment(currentVideo._id, {
                userId: user.id, userName: user.fullName || user.username, userAvatar: user.imageUrl, text, type
            });
            setShowComments(false);
        } catch (err) { console.error("Failed to post comment", err); }
    };

    const handleShare = async (videoId) => {
        if (!currentVideo) return;
        await nativeShare({
            videoId,
            title: `Watch ${currentVideo.userName}'s performance on ShowGrid!`,
            text: `Check out this amazing video by @${currentVideo.userName}`
        });
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
    // Tags / Rating Parameters
    // We now use currentVideo.challengeId.ratingParameters
    // Fallback to tags or default if missing
    const displayParams = currentVideo.challengeId?.ratingParameters && currentVideo.challengeId.ratingParameters.length > 0
        ? currentVideo.challengeId.ratingParameters
        : [
            { name: 'Energy', weight: 10 },
            { name: 'Choreo', weight: 10 },
            { name: 'Sync', weight: 10 }
        ];

    return (
        <div
            className="h-screen w-full bg-black overflow-hidden relative flex"
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
        >
            {/* Unauthenticated Overlay Hint */}
            {!user && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-black/60 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 flex items-center gap-2 pointer-events-none">
                    <Lock size={14} className="text-white/60" />
                    <span className="text-xs font-bold text-white/80">Sign in to interact & scroll</span>
                </div>
            )}
            {/* Desktop Navbar / Sidebar (Left) */}
            {!isMobile && (
                <div className="w-20 h-full flex flex-col items-center py-6 gap-8 bg-black/40 backdrop-blur-md border-r border-white/10 z-30">
                    <Link to="/" className="mb-4"><Play fill="#ec4899" color="#ec4899" size={32} style={{ transform: 'rotate(-10deg)' }} /></Link>
                    <Link to="/" className="p-2 text-white/40 hover:text-white transition-colors"><Home size={24} /></Link>
                    <Link to="/challenges" className="p-2 text-white/40 hover:text-white transition-colors"><Trophy size={24} /></Link>
                    <Link to="/leaderboard" className="p-2 text-white/40 hover:text-white transition-colors"><BarChart2 size={24} /></Link>
                    <Link to="/profile" className="p-2 text-white/40 hover:text-white transition-colors"><User size={24} /></Link>
                    {/* Feed Sort Tabs */}
                    <div className="mt-auto flex flex-col gap-2">
                        <button
                            onClick={() => setFeedSort('latest')}
                            className={`p-2 rounded-lg text-[10px] font-bold transition-colors ${feedSort === 'latest' ? 'bg-white/20 text-white' : 'text-white/40 hover:text-white'}`}
                        >
                            Latest
                        </button>
                        <button
                            onClick={() => setFeedSort('top_rated')}
                            className={`p-2 rounded-lg text-[10px] font-bold transition-colors ${feedSort === 'top_rated' ? 'bg-white/20 text-white' : 'text-white/40 hover:text-white'}`}
                        >
                            Top
                        </button>
                        <button
                            onClick={() => setFeedSort('trending')}
                            className={`p-2 rounded-lg text-[10px] font-bold transition-colors ${feedSort === 'trending' ? 'bg-white/20 text-white' : 'text-white/40 hover:text-white'}`}
                        >
                            Trending
                        </button>
                    </div>
                </div>
            )}

            {/* Main Content Area */}
            <div className="flex-grow relative flex justify-center bg-black">
                {/* Mobile Sort Tabs (Top) */}
                {isMobile && (
                    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40 flex gap-1 bg-black/60 backdrop-blur-md rounded-full p-1 border border-white/10">
                        <button
                            onClick={() => setFeedSort('latest')}
                            className={`px-3 py-1.5 rounded-full text-[10px] font-bold transition-colors ${feedSort === 'latest' ? 'bg-white/20 text-white' : 'text-white/60'}`}
                        >
                            Latest
                        </button>
                        <button
                            onClick={() => setFeedSort('top_rated')}
                            className={`px-3 py-1.5 rounded-full text-[10px] font-bold transition-colors ${feedSort === 'top_rated' ? 'bg-white/20 text-white' : 'text-white/60'}`}
                        >
                            Top
                        </button>
                        <button
                            onClick={() => setFeedSort('trending')}
                            className={`px-3 py-1.5 rounded-full text-[10px] font-bold transition-colors ${feedSort === 'trending' ? 'bg-white/20 text-white' : 'text-white/60'}`}
                        >
                            Trending
                        </button>
                    </div>
                )}

                {/* Desktop Overlays */}
                {!isMobile && isSubChallenge && (
                    <div className="absolute right-8 top-1/2 -translate-y-1/2 z-30 flex flex-col gap-4">
                        <button onClick={handlePrev} disabled={currentIndex === 0} className="p-3 bg-white/5 rounded-full hover:bg-white/20 disabled:opacity-0 transition-all self-center">
                            <ChevronUp size={24} color="white" />
                        </button>
                        <button onClick={handleNext} disabled={currentIndex === videos.length - 1} className="p-3 bg-white/5 rounded-full hover:bg-white/20 disabled:opacity-0 transition-all self-center">
                            <ChevronDown size={24} color="white" />
                        </button>
                    </div>
                )}
                {!isMobile && !isSubChallenge && (
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
                                <h2 className="text-3xl font-extrabold text-white mb-0.5 leading-tight">
                                    @{currentVideo.userName}
                                </h2>
                                {currentVideo.studioName && (
                                    <p className="text-xs text-white/50 font-medium mb-3">
                                        via {currentVideo.studioName}
                                    </p>
                                )}

                                {currentVideo.challengeId && (
                                    <div className="h-10 flex items-center">
                                        {infoMode === 'song' && currentVideo.challengeId.songTitle ? (
                                            <div className="flex items-center gap-2 mb-3 text-white/60 animate-in fade-in zoom-in duration-500">
                                                <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center">
                                                    <Music size={12} className="text-primary" />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-bold text-white/90">{currentVideo.challengeId.songTitle}</span>
                                                    {currentVideo.challengeId.artistName && <span className="text-[10px] text-white/50">{currentVideo.challengeId.artistName}</span>}
                                                </div>
                                            </div>
                                        ) : infoMode === 'location' && currentVideo.city ? (
                                            <div className="flex items-center gap-2 mb-3 text-white/60 animate-in fade-in zoom-in duration-500">
                                                <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center">
                                                    <MapPin size={12} className="text-blue-400" />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-bold text-white/90">{currentVideo.city}</span>
                                                    <span className="text-[10px] text-white/50">Location</span>
                                                </div>
                                            </div>
                                        ) : (
                                            /* Fallback/Default to song */
                                            currentVideo.challengeId.songTitle && (
                                                <div className="flex items-center gap-2 mb-3 text-white/60 animate-in fade-in zoom-in duration-500">
                                                    <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center">
                                                        <Music size={12} className="text-primary" />
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-xs font-bold text-white/90">{currentVideo.challengeId.songTitle}</span>
                                                        {currentVideo.challengeId.artistName && <span className="text-[10px] text-white/50">{currentVideo.challengeId.artistName}</span>}
                                                    </div>
                                                </div>
                                            )
                                        )}
                                    </div>
                                )}
                                {currentVideo.description && !currentVideo.description.startsWith('Performing from') && (
                                    <p className="border-t border-white/10 mt-4 pt-3 text-sm text-white/60 line-clamp-2">
                                        {currentVideo.description}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Right-Side Actions & Rating */}
                        <div className="absolute right-8 top-1/2 -translate-y-1/2 z-30 flex items-center gap-6">

                            {/* Rating Card (Left of Buttons) */}
                            {user && user.id === currentVideo.userId ? (
                                <div className="bg-black/40 backdrop-blur-md border border-white/10 p-5 rounded-2xl w-64 shadow-xl text-center flex items-center justify-center min-h-[200px]">
                                    <p className="text-white/60 text-sm italic">
                                        You cannot rate your own performance.
                                    </p>
                                </div>
                            ) : (
                                <div className="bg-black/40 backdrop-blur-md border border-white/10 p-5 rounded-2xl w-64 shadow-xl">
                                    <div className="flex justify-between items-center mb-4 border-b border-white/10 pb-2">
                                        <h3 className="text-xs font-bold text-white uppercase tracking-wider">Live Rating</h3>
                                        <div className="flex gap-1">
                                            <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></div>
                                            <span className="text-[10px] font-bold text-red-500 uppercase">Rec</span>
                                        </div>
                                    </div>
                                    <div className="space-y-5">
                                        {displayParams.map((param, index) => {
                                            const tagStr = param.name;
                                            const tagKey = param.name.toLowerCase().replace(/\s+/g, '');
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
                            )}

                            {/* Vertical Action Buttons */}
                            <div className="flex flex-col gap-4">
                                <button onClick={handlePrev} disabled={currentIndex === 0} className="p-3 bg-white/5 rounded-full hover:bg-white/20 disabled:opacity-0 transition-all self-center mb-2">
                                    <ChevronUp size={24} color="white" />
                                </button>

                                {/* Like Button */}
                                {(!user || user.id !== currentVideo.userId) && (
                                    <div className="flex flex-col items-center gap-1 group">
                                        <div onClick={handleLike} className="w-12 h-12 bg-black/40 backdrop-blur-md border border-white/10 rounded-full flex items-center justify-center hover:bg-white/20 hover:scale-110 cursor-pointer transition-all shadow-lg">
                                            <Heart size={24} fill={userInteraction.hasLiked ? "#ec4899" : "transparent"} color={userInteraction.hasLiked ? "#ec4899" : "white"} />
                                        </div>
                                        <span className="text-[10px] font-bold text-white shadow-black drop-shadow-md">{interactionStats.likes || 0}</span>
                                    </div>
                                )}

                                {/* Comment Button */}
                                <div className="flex flex-col items-center gap-1 group">
                                    <div onClick={() => setShowComments(true)} className="w-12 h-12 bg-black/40 backdrop-blur-md border border-white/10 rounded-full flex items-center justify-center hover:bg-white/20 hover:scale-110 cursor-pointer transition-all shadow-lg">
                                        <MessageCircle size={24} color="white" />
                                    </div>
                                    <span className="text-[10px] font-bold text-white shadow-black drop-shadow-md">{currentVideo.comments?.length || 0}</span>
                                </div>

                                <div className="flex flex-col items-center gap-1 group">
                                    <div onClick={() => handleShare(currentVideo._id)} className="w-12 h-12 bg-black/40 backdrop-blur-md border border-white/10 rounded-full flex items-center justify-center hover:bg-white/20 hover:scale-110 cursor-pointer transition-all shadow-lg">
                                        <Share2 size={24} color="white" />
                                    </div>
                                    <span className="text-[10px] font-bold text-white shadow-black drop-shadow-md">{interactionStats.shares}</span>
                                </div>
                            </div>


                            <button onClick={handleNext} disabled={currentIndex === videos.length - 1} className="p-3 bg-white/5 rounded-full hover:bg-white/20 disabled:opacity-0 transition-all self-center mt-2">
                                <ChevronDown size={24} color="white" />
                            </button>
                        </div>
                    </>
                )}

                {/* Video Player Container */}
                <div className={`relative h-full ${isMobile ? 'w-full' : 'aspect-[9/16] max-w-[500px] border-x border-white/5'}`} onClick={isSubChallenge ? undefined : togglePlay}>
                    {isSubChallenge ? (
                        <SubChallengeCard subChallenge={currentVideo.subChallenge} />
                    ) : (
                        <>
                            <video ref={videoRef} src={currentVideo.videoUrl} className="w-full h-full object-contain" autoPlay loop playsInline onTimeUpdate={handleTimeUpdate} />
                            {!isPlaying && (
                                <div className="absolute inset-0 flex items-center justify-center bg-black/40 z-10 pointer-events-none">
                                    <Play size={64} fill="white" className="text-white opacity-80" />
                                </div>
                            )}

                            {/* Seek Bar */}
                            <div
                                className={`absolute inset-x-0 z-30 h-0.5 bg-gray-500/50 cursor-pointer ${isMobile ? 'bottom-[53px]' : 'bottom-0'}`}
                                onClick={(e) => e.stopPropagation()}
                            >
                                <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    step="0.1"
                                    value={progress || 0}
                                    onChange={handleSeek}
                                    className="w-full h-full absolute inset-0 opacity-0 cursor-pointer z-40 m-0 p-0"
                                />
                                <div
                                    className="h-full bg-white relative z-30 pointer-events-none transition-all duration-75"
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                        </>
                    )}

                    {/* Loading More Indicator */}
                    {feedLoading && (
                        <div className={`absolute inset-x-0 z-30 flex justify-center ${isMobile ? 'bottom-[60px]' : 'bottom-4'}`}>
                            <div className="bg-black/60 backdrop-blur-md px-4 py-2 rounded-full border border-white/10">
                                <span className="text-xs font-bold text-white/80">Loading more...</span>
                            </div>
                        </div>
                    )}

                    {/* End of Feed Indicator */}
                    {!hasMore && videos.length > 0 && currentIndex === videos.length - 1 && (
                        <div className={`absolute inset-x-0 z-30 flex justify-center ${isMobile ? 'bottom-[60px]' : 'bottom-4'}`}>
                            <div className="bg-black/60 backdrop-blur-md px-4 py-2 rounded-full border border-white/10">
                                <span className="text-xs font-bold text-white/60">You've reached the end</span>
                            </div>
                        </div>
                    )}

                    {/* Mobile Controls Overlay */}
                    {isMobile && !isSubChallenge && (
                        <div className="absolute inset-x-0 bottom-0 z-20 flex flex-col justify-end pb-[60px]">
                            {/* Interaction Area (Dynamic Height) */}
                            <div className="flex w-full h-auto items-end">
                                {/* Left: Rating Sliders OR Info placement */}
                                <div className="flex-1 flex flex-col justify-end px-4 gap-0 min-w-0">

                                    {/* User Info (Moved inside flex layout to stack properly above ratings) */}
                                    <div className="-mb-2 shadow-black drop-shadow-md">
                                        <div className="flex items-center gap-2 mb-1">
                                            <div className="w-0.5 h-3 bg-primary rounded-full"></div>
                                            <h3 className="text-[10px] font-bold text-white/80 uppercase tracking-widest">{currentVideo.challengeId?.title || 'Challenge'}</h3>
                                        </div>
                                        <h3 className="text-xl font-bold text-white mb-0.5">@{currentVideo.userName}</h3>
                                        {currentVideo.studioName && (
                                            <p className="text-[10px] text-white/50 font-medium mb-2">via {currentVideo.studioName}</p>
                                        )}

                                        {/* Song Info */}
                                        {/* Info Ticker (Song <-> Location) */}
                                        {/* Info Ticker (Song <-> Location) */}
                                        {currentVideo.challengeId && (
                                            <div className="h-9 flex items-center mb-1">
                                                {infoMode === 'song' && currentVideo.challengeId.songTitle ? (
                                                    <div className="flex items-center gap-1.5 text-white/70 animate-in fade-in zoom-in duration-500">
                                                        <Music size={10} className="text-primary" />
                                                        <span className="text-[10px] font-bold">{currentVideo.challengeId.songTitle}</span>
                                                        {currentVideo.challengeId.artistName && <span className="text-[10px] opacity-70">- {currentVideo.challengeId.artistName}</span>}
                                                    </div>
                                                ) : infoMode === 'location' && currentVideo.city ? (
                                                    <div className="flex items-center gap-1.5 text-white/70 animate-in fade-in zoom-in duration-500">
                                                        <MapPin size={10} className="text-blue-400" />
                                                        <span className="text-[10px] font-bold">{currentVideo.city}</span>
                                                    </div>
                                                ) : (
                                                    currentVideo.challengeId.songTitle && (
                                                        <div className="flex items-center gap-1.5 text-white/70">
                                                            <Music size={10} className="text-primary" />
                                                            <span className="text-[10px] font-bold">{currentVideo.challengeId.songTitle}</span>
                                                        </div>
                                                    )
                                                )}
                                            </div>
                                        )}

                                        {currentVideo.description && !currentVideo.description.startsWith('Performing from') && (
                                            <p className="text-xs text-white/80 line-clamp-2">{currentVideo.description}</p>
                                        )}
                                    </div>

                                    {/* Rating Sliders Component */}
                                    {user && user.id === currentVideo.userId ? (
                                        <div className="bg-black/40 backdrop-blur-md border border-white/10 p-3 rounded-xl text-center">
                                            <p className="text-white/60 text-[10px] italic">
                                                You cannot rate your own performance.
                                            </p>
                                        </div>
                                    ) : (
                                        displayParams.map((param, index) => {
                                            const tagStr = param.name;
                                            const tagKey = param.name.toLowerCase().replace(/\s+/g, '');
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
                                        })
                                    )}
                                </div>

                                {/* Right: Action Buttons */}
                                <div className="w-14 flex-none flex flex-col justify-end items-center gap-4">
                                    {/* Like Button */}
                                    {(!user || user.id !== currentVideo.userId) && (
                                        <div className="flex flex-col items-center gap-1" onClick={handleLike}>
                                            <Heart size={24} fill={userInteraction.hasLiked ? "#ec4899" : "transparent"} color={userInteraction.hasLiked ? "#ec4899" : "white"} />
                                            <span className="text-[10px] font-bold text-white drop-shadow-md">{interactionStats.likes || 0}</span>
                                        </div>
                                    )}

                                    {/* Comment Button */}
                                    <div className="flex flex-col items-center gap-1" onClick={() => user ? setShowComments(true) : openSignIn()}>
                                        <MessageCircle size={24} color="white" />
                                        <span className="text-[10px] font-bold text-white drop-shadow-md">{currentVideo.comments?.length || 0}</span>
                                    </div>

                                    <div className="flex flex-col items-center gap-1" onClick={() => handleShare(currentVideo._id)}>
                                        <Share2 size={24} color="white" />
                                        <span className="text-[10px] font-bold text-white">{interactionStats.shares}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Comments Drawer - Animated Ease In/Out */}
            <div className={`fixed inset-x-0 bottom-0 z-50 bg-[#111] border-t border-white/10 rounded-t-3xl transition-transform duration-300 ease-in-out flex flex-col max-h-[70vh] shadow-2xl shadow-black ${showComments ? 'translate-y-0' : 'translate-y-full'}`}>
                {/* Drawer Header */}
                <div className="flex items-center justify-between p-6 border-b border-white/5 relative bg-[#111] rounded-t-3xl z-10 shrink-0">
                    <h3 className="text-xl font-bold text-white">Comments <span className="text-white/40 text-sm ml-2">{currentVideo.comments?.length || 0}</span></h3>
                    <button onClick={() => setShowComments(false)} className="p-2 bg-white/5 rounded-full text-white/40 hover:text-white transition-colors">
                        <ChevronDown size={20} />
                    </button>
                    {/* IOS-style handle */}
                    <div className="absolute top-2 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-white/10 rounded-full" />
                </div>

                {/* Drawer Body - Scrollable */}
                <div className="flex-grow overflow-y-auto p-6 space-y-8 pb-24">

                    {/* 1. Presets Section (Pinned Top) */}
                    {/* 1. Presets Section (Pinned Top) - Check if user is owner */}
                    {user && currentVideo && user.id === currentVideo.userId ? (
                        <div className="bg-white/5 p-4 rounded-xl text-center border border-white/10">
                            <p className="text-white/60 text-xs italic">
                                You cannot comment on your own performance.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <h4 className="text-xs font-bold text-white/40 uppercase tracking-widest pl-1">Quick React</h4>
                            <div className="space-y-4">
                                {/* Positive */}
                                {commentPresets.positive && commentPresets.positive.length > 0 && (
                                    <div className="flex flex-wrap gap-2">
                                        {commentPresets.positive.map((text, i) => (
                                            <button key={i} onClick={() => handlePresetComment(text, 'positive')} className="text-xs px-3 py-2 bg-green-500/10 border border-green-500/30 rounded-full text-green-100 hover:bg-green-500/20 active:scale-95 transition-all">{text}</button>
                                        ))}
                                    </div>
                                )}
                                {/* Neutral */}
                                {commentPresets.neutral && commentPresets.neutral.length > 0 && (
                                    <div className="flex flex-wrap gap-2">
                                        {commentPresets.neutral.map((text, i) => (
                                            <button key={i} onClick={() => handlePresetComment(text, 'neutral')} className="text-xs px-3 py-2 bg-yellow-500/10 border border-yellow-500/30 rounded-full text-yellow-100 hover:bg-yellow-500/20 active:scale-95 transition-all">{text}</button>
                                        ))}
                                    </div>
                                )}
                                {/* Negative */}
                                {commentPresets.negative && commentPresets.negative.length > 0 && (
                                    <div className="flex flex-wrap gap-2">
                                        {commentPresets.negative.map((text, i) => (
                                            <button key={i} onClick={() => handlePresetComment(text, 'negative')} className="text-xs px-3 py-2 bg-purple-500/10 border border-purple-500/30 rounded-full text-purple-100 hover:bg-purple-500/20 active:scale-95 transition-all">{text}</button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* 2. Existing Comments List */}
                    <div className="space-y-4">
                        <h4 className="text-xs font-bold text-white/40 uppercase tracking-widest pl-1">Discussion</h4>
                        {currentVideo?.comments && currentVideo.comments.length > 0 ? (
                            <div className="space-y-4">
                                {currentVideo.comments.map((comment, index) => (
                                    <div key={index} className="flex gap-3 animate-in fade-in slide-in-from-bottom-2 duration-500" style={{ animationDelay: `${index * 50}ms` }}>
                                        <div className="w-8 h-8 rounded-full bg-white/10 flex-shrink-0 overflow-hidden">
                                            {comment.userAvatar ? (
                                                <img src={comment.userAvatar} alt={comment.userName} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-xs font-bold text-white/40">
                                                    {comment.userName ? comment.userName[0].toUpperCase() : '?'}
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-baseline justify-between mb-0.5">
                                                <div className="flex items-baseline gap-2">
                                                    <span className="text-sm font-bold text-white mb-0.5 block">{comment.userName || 'Anonymous'}</span>
                                                    <span className="text-[10px] text-white/30">{new Date(comment.createdAt).toLocaleDateString()}</span>
                                                </div>
                                                {user && user.id === comment.userId && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            if (confirm('Delete this comment?')) {
                                                                deleteComment(currentVideo._id, comment._id);
                                                            }
                                                        }}
                                                        className="text-red-500 hover:text-red-400 transition-colors p-1"
                                                    >
                                                        <Trash2 size={12} />
                                                    </button>
                                                )}
                                            </div>
                                            <p className="text-sm text-white/80 leading-relaxed bg-white/5 p-3 rounded-r-xl rounded-bl-xl border border-white/5">
                                                {comment.text}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-10 opacity-50">
                                <MessageCircle size={32} className="mx-auto mb-2 text-white/20" />
                                <p className="text-sm text-white/40">No comments yet. Be the first to hype them!</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Backdrop for closing drawer */}
            {showComments && (
                <div
                    className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm transition-opacity duration-300"
                    onClick={() => setShowComments(false)}
                />
            )}

            {/* Mobile Nav logic handled by Navbar component externally usually, but if we want strictly full custom layout we might need to suppress it. 
                However, Navbar.jsx has logic to always show on mobile. Steps to ensure it doesn't overlap content: 
                The video container has padding-bottom? In mobile overlay I added pb-20.
            */}
            {isMobile && <Navbar />}
        </div >
    );
};

export default Discovered;
