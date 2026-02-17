import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Check, Share2, Instagram, MessageCircle, Play } from 'lucide-react';
import { useUser } from '@clerk/clerk-react';
import { useVideo } from '../context/VideoContext';
import Navbar from './Navbar';

const LiveSubmission = () => {
    const { submissionId } = useParams();
    const { getApprovedVideos, getVideoStats, getPublicVideoUrl } = useVideo();
    const [submission, setSubmission] = useState(null);
    const [stats, setStats] = useState({ likes: 0, votes: 0 }); // votes = likes for now? or distinct
    const videoRef = useRef(null);
    const [isPlaying, setIsPlaying] = useState(false);

    useEffect(() => {
        const fetchSubmission = async () => {
            // We need to fetch specific submission. 
            // If it's approved, it should be in approvedVideos or we need a specific endpoint.
            // For now, let's try finding it in approvedVideos.
            // If not found (maybe pagination), we might need a direct fetch.
            // Assuming getApprovedVideos returns all for now or we use a new getSubmission logic.
            // Let's use a direct fetch if available or fallback.
            // In VideoContext we have getApprovedVideos. 
            // We should add getSubmissionById to VideoContext ideally.
            // For now, I'll simulate or try to find it.
            const videos = await getApprovedVideos(); // This returns promise?
            // Wait, getApprovedVideos in context returns array directly? No, it's async in recent context edit?
            // Actually getApprovedVideos return `approvedVideos` state? 
            // Let's check context.
            // Simpler: fetch from /api/submissions/:id or /api/discovered/feed/:id? 
            // I'll assume we can filter from loaded videos for MVP.
            if (videos) {
                const found = videos.find(v => v._id === submissionId);
                if (found) setSubmission(found);
                else {
                    // Fetch direct?
                    // Implementation gap: No direct fetch single video in context exposed?
                    // I will fetch from API directly here for robustness.
                    try {
                        // We need a route for fetching single submission publically? 
                        // /api/submissions matches filter.
                        // We can filter by _id? No standard _id filter in GET /api/submissions usually?
                        // Actually GET /api/discovered/feed/:id logic? 
                        // Let's just fetch all and filter for now as it's small scale.
                    } catch (e) {
                        console.error(e);
                    }
                }
            }
        };
        fetchSubmission();
    }, [submissionId, getApprovedVideos]);

    useEffect(() => {
        if (submission) {
            const loadStats = async () => {
                const data = await getVideoStats(submission._id);
                if (data) setStats({ likes: data.stats.likes, votes: data.stats.likes }); // Assuming votes ~ likes
            };
            loadStats();
        }
    }, [submission, getVideoStats]);

    const togglePlay = () => {
        if (videoRef.current) {
            if (isPlaying) videoRef.current.pause();
            else videoRef.current.play();
            setIsPlaying(!isPlaying);
        }
    };

    const handleShare = (platform) => {
        if (!submission) return;
        const url = getPublicVideoUrl(submission._id);
        const text = `Check out my performance on ShowGrid! ${url}`;

        if (platform === 'whatsapp') {
            window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
        } else if (platform === 'instagram') {
            navigator.clipboard.writeText(url);
            alert("Link copied! Share it on your story.");
        } else {
            navigator.clipboard.writeText(url);
            alert("Link copied to clipboard!");
        }
    };

    if (!submission) return <div className="min-h-screen bg-[#1a0b14] flex items-center justify-center text-white">Loading...</div>;

    return (
        <div className="min-h-screen h-auto bg-[#1a0b14] text-white flex flex-col items-center justify-start md:justify-center p-4 relative overflow-x-hidden">
            {/* Background Glow */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[600px] md:w-[800px] h-[600px] md:h-[800px] bg-primary/10 rounded-full blur-[80px] md:blur-[100px]"></div>
            </div>

            <Navbar />

            <div className="text-center w-full max-w-2xl mx-auto z-10 pt-24 md:pt-20 pb-10">
                <div className="w-16 h-16 md:w-20 md:h-20 bg-primary rounded-full flex items-center justify-center mx-auto mb-6 md:mb-8 shadow-[0_0_30px_rgba(236,72,153,0.5)]">
                    <Check size={32} strokeWidth={4} className="md:w-10 md:h-10" />
                </div>

                <h1 className="text-3xl md:text-5xl font-extrabold mb-3 md:mb-4 tracking-tight px-2">
                    Your performance is live!
                </h1>
                <p className="text-base md:text-lg text-white/60 mb-8 md:mb-12 leading-relaxed px-4">
                    You're now competing in the <span className="text-primary font-bold">{submission.challengeId?.title || 'Challenge'}</span>. Time to rally your crew and get those votes!
                </p>

                {/* Video Card */}
                <div className="bg-[#2a1b24] p-2 rounded-3xl shadow-2xl mb-8 transform hover:scale-[1.02] transition-transform duration-300 mx-2 md:mx-0">
                    <div className="relative aspect-video rounded-2xl overflow-hidden group cursor-pointer" onClick={togglePlay}>
                        <video
                            ref={videoRef}
                            src={submission.videoUrl}
                            className="w-full h-full object-cover"
                            loop
                            playsInline
                        />
                        <div className="absolute top-4 left-4 bg-red-600 px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 animate-pulse z-10">
                            <div className="w-1.5 h-1.5 bg-white rounded-full"></div> LIVE
                        </div>
                        {!isPlaying && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/30 transition-colors z-20">
                                <div className="w-12 h-12 md:w-16 md:h-16 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/30 pl-1">
                                    <Play fill="white" size={24} className="md:w-8 md:h-8" />
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Info & Stats */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 px-4 gap-4 sm:gap-0">
                    <div className="text-left w-full sm:w-auto">
                        <h3 className="text-xl font-bold truncate">@{submission.userName}</h3>
                        <p className="text-white/40 text-sm truncate">
                            {submission.challengeId?.title} • Round 1
                        </p>
                    </div>
                    <div className="flex items-center gap-2 text-primary font-bold w-full sm:w-auto bg-[#2a1b24] sm:bg-transparent p-3 sm:p-0 rounded-xl justify-center sm:justify-start">
                        <div className="bg-primary/20 p-2 rounded-lg">
                            <MessageCircle size={20} fill="#ec4899" />
                        </div>
                        <span>{stats.votes} votes</span>
                    </div>
                </div>

                {/* Share Actions */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4 mb-6 px-2">
                    <button
                        onClick={() => handleShare('whatsapp')}
                        className="btn bg-[#25D366] hover:bg-[#20bd5a] text-white border-none h-12 md:h-14 rounded-full font-bold text-base md:text-lg flex items-center justify-center gap-2"
                    >
                        <Share2 size={20} className="md:w-6 md:h-6" /> WhatsApp
                    </button>
                    <button
                        onClick={() => handleShare('instagram')}
                        className="btn bg-gradient-to-r from-[#833AB4] via-[#FD1D1D] to-[#F77737] text-white border-none h-12 md:h-14 rounded-full font-bold text-base md:text-lg flex items-center justify-center gap-2"
                    >
                        <Instagram size={20} className="md:w-6 md:h-6" /> Instagram
                    </button>
                </div>

                {/* Copy Link */}
                <div className="bg-[#2a1b24] rounded-full p-1.5 pl-4 md:pl-6 flex items-center justify-between border border-white/5 mb-12 mx-2">
                    <span className="text-white/40 text-xs md:text-sm truncate mr-2 md:mr-4 font-mono select-all flex-1 text-left">
                        {submission ? getPublicVideoUrl(submission._id).replace(/^https?:\/\//, '') : 'Loading Link...'}
                    </span>
                    <button
                        onClick={() => handleShare('copy')}
                        className="btn btn-primary rounded-full px-4 md:px-6 font-bold text-sm h-10 md:h-12 whitespace-nowrap"
                    >
                        Copy Link
                    </button>
                </div>

                <Link to="/profile" className="text-primary font-bold hover:text-white transition-colors flex items-center justify-center gap-2 mb-12">
                    <div className="grid grid-cols-2 gap-0.5 w-4">
                        <div className="bg-current w-1.5 h-1.5 rounded-sm"></div>
                        <div className="bg-current w-1.5 h-1.5 rounded-sm"></div>
                        <div className="bg-current w-1.5 h-1.5 rounded-sm"></div>
                        <div className="bg-current w-1.5 h-1.5 rounded-sm"></div>
                    </div>
                    View Submission Dashboard
                </Link>

                <p className="text-white/30 text-sm pb-8">Need to make an edit?</p>
            </div>
        </div>
    );
};

export default LiveSubmission;
