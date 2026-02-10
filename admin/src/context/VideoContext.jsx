import React, { createContext, useState, useContext } from 'react';

const VideoContext = createContext();

export const useVideo = () => useContext(VideoContext);

export const VideoProvider = ({ children }) => {
    // Initial state with a demo video
    const [videos, setVideos] = useState(() => {
        const saved = localStorage.getItem('showgrid_videos');
        return saved ? JSON.parse(saved) : [
            {
                id: 'demo-1',
                userId: 'showgrid-official',
                userName: 'ShowGrid Official',
                userAvatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=100&h=100&fit=crop',
                videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-group-of-dancers-performing-a-choreography-43034-large.mp4",
                status: 'approved',
                timestamp: new Date().toISOString(),
                description: "Official Choreography Demo",
                challengeId: 'demo-challenge',
                judgeTags: ['Energy', 'Summer', 'Vibe', 'Flow']
            }
        ];
    });

    const [challenges, setChallenges] = useState(() => {
        const saved = localStorage.getItem('showgrid_challenges');
        return saved ? JSON.parse(saved) : [
            {
                id: 'demo-challenge',
                title: 'Summer Vibes 2024',
                songUrl: '/1.webm',
                startDate: '2024-06-01',
                endDate: '2024-08-31',
                tags: ['Energy', 'Summer', 'Vibe', 'Flow'],
                description: "Bring the heat with your best summer moves!"
            }
        ];
    });

    const [selectedChallenge, setSelectedChallenge] = useState(null);

    // Persistence
    React.useEffect(() => {
        localStorage.setItem('showgrid_videos', JSON.stringify(videos));
    }, [videos]);

    React.useEffect(() => {
        localStorage.setItem('showgrid_challenges', JSON.stringify(challenges));
    }, [challenges]);

    const addVideo = (videoData) => {
        const newVideo = {
            ...videoData,
            id: Date.now().toString(),
            status: 'pending', // Default status for new uploads
            timestamp: new Date().toISOString(),
            challengeId: selectedChallenge?.id || 'demo-challenge',
            judgeTags: selectedChallenge?.tags || ['Energy', 'Style', 'Creativity', 'Impact']
        };
        setVideos(prev => [newVideo, ...prev]);
    };

    const addChallenge = (challengeData) => {
        const newChallenge = {
            ...challengeData,
            id: Date.now().toString(),
            tags: challengeData.tags || ['Energy', 'Style', 'Creativity', 'Impact']
        };
        setChallenges(prev => [newChallenge, ...prev]);
    };

    const updateVideoStatus = (id, status) => {
        setVideos(prev => prev.map(video =>
            video.id === id ? { ...video, status } : video
        ));
    };

    const getApprovedVideos = () => videos.filter(v => v.status === 'approved');
    const getPendingVideos = () => videos.filter(v => v.status === 'pending');

    return (
        <VideoContext.Provider value={{
            videos,
            addVideo,
            updateVideoStatus,
            getApprovedVideos,
            getPendingVideos,
            challenges,
            addChallenge,
            selectedChallenge,
            setSelectedChallenge
        }}>
            {children}
        </VideoContext.Provider>
    );
};
