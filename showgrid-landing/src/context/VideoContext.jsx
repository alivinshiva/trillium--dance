import React, { createContext, useState, useContext, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';

const VideoContext = createContext();

export const useVideo = () => useContext(VideoContext);

export const VideoProvider = ({ children }) => {
    const { user } = useUser();

    // Videos - Now fetched from Backend (Submissions)
    const [videos, setVideos] = useState([]);

    // Challenges - Now fetched from Backend
    const [challenges, setChallenges] = useState([]);
    const [selectedChallenge, setSelectedChallenge] = useState(null);

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

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

        // Poll for updates
        const interval = setInterval(fetchVideos, 10000);
        return () => clearInterval(interval);
    }, []);


    // Add Video - Adjusted for FormData (Multipart)
    const addVideo = async (formData) => {
        try {
            // Note: Content-Type header should NOT be set manually when sending FormData
            // The browser sets it automatically with the boundary
            const res = await fetch(`${API_URL}/submissions`, {
                method: 'POST',
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
            const res = await fetch(`${API_URL}/submissions/${submissionId}/comments`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
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

    // Delete Video
    const deleteVideo = async (videoId) => {
        try {
            const res = await fetch(`${API_URL}/submissions/${videoId}`, {
                method: 'DELETE'
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

    const getApprovedVideos = () => videos.filter(v => v.status === 'approved');
    const getPendingVideos = () => videos.filter(v => v.status === 'pending');

    const getUserVideos = () => {
        if (!user) return [];
        return videos.filter(v => v.userId === user.id);
    };

    // Get Presets from Backend
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

    return (
        <VideoContext.Provider value={{
            videos,
            addVideo,
            addComment,
            deleteVideo,
            getApprovedVideos,
            getPendingVideos,
            getUserVideos,
            getPresets,
            challenges,
            selectedChallenge,
            setSelectedChallenge
        }}>
            {children}
        </VideoContext.Provider>
    );
};
