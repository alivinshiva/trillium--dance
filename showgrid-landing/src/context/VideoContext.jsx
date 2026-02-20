import React, { createContext, useState, useContext, useEffect } from 'react';
import { useUser, useAuth } from '@clerk/clerk-react';

const VideoContext = createContext();

export const useVideo = () => useContext(VideoContext);

export const VideoProvider = ({ children }) => {
    const { user } = useUser();
    const { getToken } = useAuth();

    // Videos - Now fetched from Backend (Submissions)
    const [videos, setVideos] = useState([]);

    // Challenges - Now fetched from Backend
    const [challenges, setChallenges] = useState([]);
    const [selectedChallenge, setSelectedChallenge] = useState(null);

    const API_URL = import.meta.env.VITE_API_URL;

    // Fetch Challenges
    useEffect(() => {
        const fetchChallenges = async () => {
            try {
                const res = await fetch(`${API_URL}/challenges`);
                if (!res.ok) throw new Error('Failed to fetch challenges');
                const data = await res.json();
                setChallenges(data);
            } catch (err) {
                console.error("Error fetching challenges:", err);
            }
        };
        fetchChallenges();
    }, []);

    // Fetch Submissions
    useEffect(() => {
        const fetchVideos = async () => {
            try {
                const res = await fetch(`${API_URL}/submissions`);
                if (!res.ok) throw new Error('Failed to fetch submissions');
                const data = await res.json();
                setVideos(data);
            } catch (err) {
                console.error("Error fetching videos:", err);
            }
        };
        fetchVideos();

        // Polling removed to prevent excessive API calls
        const interval = setInterval(fetchVideos, 10000);
        return () => clearInterval(interval);
    }, []);


    // Add Video - Adjusted for FormData (Multipart)
    const addVideo = async (formData) => {
        try {
            const token = await getToken();
            // Note: Content-Type header should NOT be set manually when sending FormData
            // The browser sets it automatically with the boundary
            const res = await fetch(`${API_URL}/submissions`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || 'Failed to submit video');
            }

            const newVideo = await res.json();
            setVideos(prev => [newVideo, ...prev]);
            return newVideo;
        } catch (err) {
            console.error("Error submitting video:", err);
            throw err; // Re-throw to handle in UI
        }
    };

    // Add Comment - Post to backend
    const addComment = async (submissionId, commentData) => {
        try {
            const token = await getToken();
            const res = await fetch(`${API_URL}/submissions/${submissionId}/comments`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(commentData)
            });

            if (!res.ok) throw new Error('Failed to add comment');

            // Get updated submission
            const updatedSubmission = await res.json();

            // Update local state
            setVideos(prev => prev.map(v => v._id === updatedSubmission._id ? updatedSubmission : v));
            return updatedSubmission;
        } catch (err) {
            console.error("Error adding comment:", err);
            throw err;
        }
    }

    // Delete Comment
    const deleteComment = async (submissionId, commentId) => {
        try {
            const token = await getToken();
            const res = await fetch(`${API_URL}/submissions/${submissionId}/comments/${commentId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!res.ok) throw new Error('Failed to delete comment');

            const updatedSubmission = await res.json();

            // Update local state
            setVideos(prev => prev.map(v => v._id === updatedSubmission._id ? updatedSubmission : v));
            return updatedSubmission;
        } catch (err) {
            console.error("Error deleting comment:", err);
            throw err;
        }
    };

    // Delete Video
    const deleteVideo = async (videoId) => {
        try {
            const token = await getToken();
            const res = await fetch(`${API_URL}/submissions/${videoId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || 'Failed to delete video');
            }

            // Update local state
            setVideos(prev => prev.filter(v => v._id !== videoId));
            return true;
        } catch (err) {
            console.error("Error deleting video:", err);
            throw err;
        }
    };

    // --- Interactions ---

    const likeVideo = async (videoId) => {
        try {
            const token = await getToken();
            const res = await fetch(`${API_URL}/interactions/like`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ videoId, userId: user.id })
            });
            if (!res.ok) throw new Error('Failed to like video');
            return await res.json(); // { liked: boolean }
        } catch (err) {
            console.error("Error liking video:", err);
            throw err;
        }
    };

    const rateVideo = async (videoId, rating) => {
        try {
            const token = await getToken();
            const res = await fetch(`${API_URL}/interactions/rate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ videoId, userId: user.id, rating })
            });
            if (!res.ok) throw new Error('Failed to rate video');
            return await res.json(); // { success: true, rating, average }
        } catch (err) {
            console.error("Error rating video:", err);
            throw err;
        }
    };

    const shareVideo = async (videoId, targetType = 'external') => {
        try {
            const token = await getToken();
            await fetch(`${API_URL}/interactions/share`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ videoId, userId: user ? user.id : 'guest', targetType })
            });
        } catch (err) {
            console.error("Error sharing video:", err);
        }
    };

    const getVideoStats = async (videoId) => {
        try {
            const url = new URL(`${API_URL}/interactions/video/${videoId}`);
            if (user) url.searchParams.append('userId', user.id);

            const res = await fetch(url);
            if (res.ok) return await res.json();
            return null;
        } catch (err) {
            console.error("Error fetching video stats:", err);
            return null;
        }
    };

    const getApprovedVideos = () => videos.filter(v => v.status === 'approved');
    const getPendingVideos = () => videos.filter(v => v.status === 'pending');

    const getUserVideos = () => {
        if (!user) return [];
        return videos.filter(v => v.userId === user.id);
    };

    const getPresets = async () => {
        try {
            const res = await fetch(`${API_URL}/challenges/presets`);
            if (res.ok) {
                const data = await res.json();
                return data;
            }
            return { positive: [], neutral: [], negative: [] };
        } catch (err) {
            console.error("Error fetching presets:", err);
            return { positive: [], neutral: [], negative: [] };
        }
    };

    const getLeaderboard = async (challengeId) => {
        try {
            let url = `${API_URL}/submissions/leaderboard`;
            if (challengeId) url += `?challengeId=${challengeId}`;

            const res = await fetch(url);
            if (res.ok) return await res.json();
            return [];
        } catch (err) {
            console.error("Error fetching leaderboard:", err);
            return [];
        }
    };

    const getPublicVideoUrl = (videoId) => {
        return `${window.location.origin}/discovered/feed/${videoId}`;
    };

    const nativeShare = async ({ videoId, title, text, url: customUrl }) => {
        // Track the share
        shareVideo(videoId);

        const url = customUrl || getPublicVideoUrl(videoId);
        const shareData = {
            title: title || 'Check out this video on ShowGrid!',
            text: text || 'Watch this amazing performance!',
            url: url
        };

        try {
            if (navigator.share) {
                await navigator.share(shareData);
            } else {
                // Fallback
                await navigator.clipboard.writeText(url);
                alert("Link copied to clipboard! (Share menu not supported)");
            }
        } catch (err) {
            console.error("Error sharing:", err);
            // If user cancels share, it throws error, ignore or handle lightly
        }
    };

    const updateSubmissionStatus = async (submissionId, status, message) => {
        try {
            const token = await getToken();
            const res = await fetch(`${API_URL}/submissions/${submissionId}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ status, message })
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || 'Failed to update status');
            }

            const updatedSubmission = await res.json();

            // Update local state
            setVideos(prev => prev.map(v => v._id === submissionId ? updatedSubmission : v));

            return updatedSubmission;
        } catch (err) {
            console.error("Error updating submission status:", err);
            throw err;
        }
    };

    return (
        <VideoContext.Provider value={{
            videos,
            addVideo,
            addComment,
            deleteComment,
            deleteVideo,
            getApprovedVideos,
            getPendingVideos,
            getUserVideos,
            getPresets,
            challenges,
            selectedChallenge,
            setSelectedChallenge,
            likeVideo,
            rateVideo,
            shareVideo,
            getVideoStats,
            getLeaderboard,
            getPublicVideoUrl,
            nativeShare,
            updateSubmissionStatus
        }}>
            {children}
        </VideoContext.Provider>
    );
};
