import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { Heart, MessageCircle, Share2, Star } from 'lucide-react';
import { useVideo } from '../context/VideoContext';

const VideoInteraction = ({ videoId }) => {
    const { user } = useUser();
    const { likeVideo, rateVideo, shareVideo, getVideoStats } = useVideo();

    const [stats, setStats] = useState({
        likes: 0,
        comments: 0,
        shares: 0,
        ratingAverage: 0,
        ratingCount: 0
    });
    const [userInteraction, setUserInteraction] = useState({
        hasLiked: false,
        userRating: null
    });
    const [loading, setLoading] = useState(true);
    const [isRating, setIsRating] = useState(false);

    useEffect(() => {
        const fetchStats = async () => {
            const data = await getVideoStats(videoId);
            if (data) {
                setStats(data.stats);
                setUserInteraction(data.user);
            }
            setLoading(false);
        };
        fetchStats();
    }, [videoId, user]); // Refetch if user changes (login/logout)

    const handleLike = async () => {
        if (!user) return alert("Please sign in to like");

        // Optimistic update
        const wasLiked = userInteraction.hasLiked;
        setUserInteraction(prev => ({ ...prev, hasLiked: !wasLiked }));
        setStats(prev => ({ ...prev, likes: prev.likes + (wasLiked ? -1 : 1) }));

        try {
            const res = await likeVideo(videoId);
            // Revert if mismatch (optional, but good practice)
            if (res.liked !== !wasLiked) {
                setUserInteraction(prev => ({ ...prev, hasLiked: res.liked }));
            }
        } catch (err) {
            // Revert on error
            setUserInteraction(prev => ({ ...prev, hasLiked: wasLiked }));
            setStats(prev => ({ ...prev, likes: prev.likes + (wasLiked ? 1 : -1) }));
        }
    };

    const handleRate = async (rating) => {
        if (!user) return alert("Please sign in to rate");

        try {
            const res = await rateVideo(videoId, rating);
            if (res.success) {
                setUserInteraction(prev => ({ ...prev, userRating: res.rating }));
                setIsRating(false);
                // Simple update of average for UI (actual calc is complex, better to refetch or trust backend return)
                // Backend returns new average, let's use it
                if (res.average) {
                    setStats(prev => ({
                        ...prev,
                        ratingAverage: res.average,
                        ratingCount: userInteraction.userRating ? prev.ratingCount : prev.ratingCount + 1
                    }));
                }
            }
        } catch (err) {
            alert("Failed to save rating");
        }
    };

    const handleShare = async () => {
        if (!user) return alert("Please sign in to share");
        await shareVideo(videoId);
        setStats(prev => ({ ...prev, shares: prev.shares + 1 }));
        alert("Shared! (Simulated)");
    };

    if (loading) return <div className="h-10 animate-pulse bg-white/5 rounded-xl"></div>;

    return (
        <div className="flex items-center justify-between bg-black/40 backdrop-blur-md rounded-2xl p-3 border border-white/10 mt-4">
            {/* Like */}
            <button
                onClick={handleLike}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors ${userInteraction.hasLiked ? 'text-pink-500 bg-pink-500/10' : 'text-white/60 hover:text-white hover:bg-white/5'}`}
            >
                <Heart size={20} fill={userInteraction.hasLiked ? "currentColor" : "none"} />
                <span className="text-sm font-bold">{stats.likes}</span>
            </button>

            {/* Rating */}
            <div className="relative group">
                <button
                    onClick={() => setIsRating(!isRating)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors ${userInteraction.userRating ? 'text-yellow-400 bg-yellow-400/10' : 'text-white/60 hover:text-white hover:bg-white/5'}`}
                >
                    <Star size={20} fill={userInteraction.userRating ? "currentColor" : "none"} />
                    <span className="text-sm font-bold">{stats.ratingAverage.toFixed(1)}</span>
                </button>

                {/* Rating Popup */}
                {(isRating || false) && (
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-dark border border-white/10 rounded-xl p-2 flex gap-1 shadow-xl z-20">
                        {[1, 2, 3, 4, 5].map(star => (
                            <button
                                key={star}
                                onClick={() => handleRate(star)}
                                className={`p-1 hover:scale-110 transition-transform ${userInteraction.userRating >= star ? 'text-yellow-400' : 'text-white/20 hover:text-yellow-400'}`}
                            >
                                <Star size={16} fill="currentColor" />
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Comments (Static for now) */}
            <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/5 transition-colors">
                <MessageCircle size={20} />
                <span className="text-sm font-bold">{stats.comments}</span>
            </button>

            {/* Share */}
            <button
                onClick={handleShare}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/5 transition-colors"
            >
                <Share2 size={20} />
                <span className="text-sm font-bold">{stats.shares}</span>
            </button>
        </div>
    );
};

export default VideoInteraction;
