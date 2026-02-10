import React, { createContext, useState, useContext } from 'react';

const VideoContext = createContext();

export const useVideo = () => useContext(VideoContext);

export const VideoProvider = ({ children }) => {
    // Initial state with a demo video
    const [videos, setVideos] = useState([
        {
            id: 'demo-1',
            userId: 'showgrid-official',
            userName: 'ShowGrid Official',
            userAvatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=100&h=100&fit=crop',
            videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-group-of-dancers-performing-a-choreography-43034-large.mp4",
            status: 'approved',
            timestamp: new Date().toISOString(),
            description: "Official Choreography Demo"
        }
    ]);

    const addVideo = (videoData) => {
        const newVideo = {
            ...videoData,
            id: Date.now().toString(),
            status: 'pending', // Default status for new uploads
            timestamp: new Date().toISOString()
        };
        setVideos(prev => [newVideo, ...prev]);
    };

    const updateVideoStatus = (id, status) => {
        setVideos(prev => prev.map(video =>
            video.id === id ? { ...video, status } : video
        ));
    };

    const getApprovedVideos = () => videos.filter(v => v.status === 'approved');
    const getPendingVideos = () => videos.filter(v => v.status === 'pending');

    return (
        <VideoContext.Provider value={{ videos, addVideo, updateVideoStatus, getApprovedVideos, getPendingVideos }}>
            {children}
        </VideoContext.Provider>
    );
};
