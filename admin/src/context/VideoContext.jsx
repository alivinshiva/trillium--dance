import React, { createContext, useState, useContext, useEffect } from 'react';

const VideoContext = createContext();

export const useVideo = () => useContext(VideoContext);

export const VideoProvider = ({ children }) => {
    // Videos (Submissions)
    const [videos, setVideos] = useState([]);

    // Challenges
    const [challenges, setChallenges] = useState([]);

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

    // Fetch Initial Data
    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch Challenges
                const challengeRes = await fetch(`${API_URL}/challenges`);
                if (challengeRes.ok) setChallenges(await challengeRes.json());

                // Fetch Submissions
                const submissionRes = await fetch(`${API_URL}/submissions`);
                if (submissionRes.ok) setVideos(await submissionRes.json());

            } catch (err) {
                console.error("Error fetching data:", err);
            }
        };
        fetchData();

        // Poll for new submissions every 5 seconds
        const interval = setInterval(async () => {
            try {
                const res = await fetch(`${API_URL}/submissions`);
                if (res.ok) setVideos(await res.json());
            } catch (err) {
                console.error("Error polling submissions:", err);
            }
        }, 5000);

        return () => clearInterval(interval);
    }, []);

    const [selectedChallenge, setSelectedChallenge] = useState(null);

    // Add Challenge - POST to Backend
    const addChallenge = async (challengeData) => {
        try {
            const res = await fetch(`${API_URL}/challenges`, {
                method: 'POST',
                // body is FormData, so no Content-Type header needed (browser sets it with boundary)
                body: challengeData
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || 'Failed to create challenge');
            }

            const newChallenge = await res.json();
            setChallenges(prev => [newChallenge, ...prev]);
            return newChallenge;
        } catch (err) {
            console.error("Error adding challenge:", err);
            alert(`Error: ${err.message}`);
        }
    };

    // Delete Challenge - DELETE to Backend
    const deleteChallenge = async (id) => {
        try {
            const res = await fetch(`${API_URL}/challenges/${id}`, {
                method: 'DELETE'
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || 'Failed to delete challenge');
            }

            setChallenges(prev => prev.filter(c => c._id !== id));
            return true;
        } catch (err) {
            console.error("Error deleting challenge:", err);
            alert(`Error: ${err.message}`);
            return false;
        }
    };

    // Get Presets from Backend
    const getPresets = async () => {
        console.log("Fetching presets from:", `${API_URL}/challenges/presets`);
        try {
            const res = await fetch(`${API_URL}/challenges/presets`);
            console.log("Presets fetch status:", res.status);

            if (res.ok) {
                const data = await res.json();
                console.log("Presets data:", data);
                return data;
            }
            console.error("Failed to fetch presets:", res.statusText);
            return { positive: [], neutral: [], negative: [] };
        } catch (err) {
            console.error("Error fetching presets:", err);
            return { positive: [], neutral: [], negative: [] };
        }
    };

    // Update Video Status - PATCH to Backend
    const updateVideoStatus = async (id, status, comment = null) => {
        try {
            const body = { status };
            if (comment) body.comment = comment;

            const res = await fetch(`${API_URL}/submissions/${id}/status`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(body)
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || 'Failed to update status');
            }

            // Optimistic update locally
            setVideos(prev => prev.map(video =>
                video._id === id ? { ...video, status } : video
            ));

            // Also refresh from server to be sure
            const updatedVideo = await res.json();
            setVideos(prev => prev.map(video =>
                video._id === id ? updatedVideo : video
            ));

        } catch (err) {
            console.error("Error updating status:", err);
            alert(`Error: ${err.message}`);
        }
    };

    const getApprovedVideos = () => videos.filter(v => v.status === 'approved');
    const getPendingVideos = () => videos.filter(v => v.status === 'pending');

    return (
        <VideoContext.Provider value={{
            videos,
            // addVideo, // Admin doesn't add videos
            updateVideoStatus,
            getApprovedVideos,
            getPendingVideos,
            challenges,
            addChallenge,
            deleteChallenge,
            selectedChallenge,
            setSelectedChallenge,
            getPresets
        }}>
            {children}
        </VideoContext.Provider>
    );
};
