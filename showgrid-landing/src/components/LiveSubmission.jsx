import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link, useLocation, useNavigate } from 'react-router-dom';
import { Check, Share2, Instagram, MessageCircle, Play, Info, Upload, Zap, Activity, Music, Layers, Maximize, Eye } from 'lucide-react';
import { useUser } from '@clerk/clerk-react';
import { useVideo } from '../context/VideoContext';
import Navbar from './Navbar';

const LiveSubmission = () => {
    const { submissionId } = useParams();
    const { state } = useLocation();
    const navigate = useNavigate();
    const { videos, getVideoStats, getPublicVideoUrl, nativeShare } = useVideo();
    const [submission, setSubmission] = useState(null);
    const [stats, setStats] = useState({ likes: 0, votes: 0 });
    const videoRef = useRef(null);
    const [isPlaying, setIsPlaying] = useState(false);

    useEffect(() => {
        const fetchSubmission = async () => {
            if (videos.length > 0) {
                const found = videos.find(v => v._id === submissionId);
                if (found) setSubmission(found);
            }
        };
        fetchSubmission();
    }, [submissionId, videos]);

    useEffect(() => {
        if (submission) {
            const loadStats = async () => {
                const data = await getVideoStats(submission._id);
                if (data) setStats({ likes: data.stats.likes, votes: data.stats.likes });
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

    const handleShare = async (platform) => {
        if (!submission) return;

        if (platform === 'native') {
            await nativeShare({
                videoId: submission._id,
                title: `Check out my performance on ShowGrid!`,
                text: `I'm competing in the ${submission.challengeId?.title}. Watch and vote for me!`
            });
            return;
        }

        const url = getPublicVideoUrl(submission._id);
        const text = `Check out my performance on ShowGrid! ${url}`;

        if (platform === 'whatsapp') {
            window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
        } else if (platform === 'instagram') {
            await nativeShare({
                videoId: submission._id,
                title: `Check out my performance on ShowGrid!`,
                text: `I'm competing in the ${submission.challengeId?.title}. Watch and vote for me!`
            });
        } else if (platform === 'copy') {
            await nativeShare({
                videoId: submission._id,
                title: `Check out my performance on ShowGrid!`,
                text: `I'm competing in the ${submission.challengeId?.title}. Watch and vote for me!`
            });
        }
    };

    const handleUploadFix = () => {
        if (submission?.challengeId?._id) {
            navigate(`/challenges/${submission.challengeId._id}/upload`);
        } else if (submission?.challengeId) {
            // Handle case where challengeId might be populated object or just ID
            // Based on mongoose population, likely object if populated, but let's be safe
            const cId = typeof submission.challengeId === 'object' ? submission.challengeId._id : submission.challengeId;
            navigate(`/challenges/${cId}/upload`);
        } else {
            navigate('/upload');
        }
    };

    if (!submission) return <div className="min-h-screen bg-[#1a0b14] flex items-center justify-center text-white">Loading...</div>;

    const isRejected = submission.status === 'rejected';
    const rejectionMessage = state?.rejectionMessage || "Your submission needs some changes.";

    return (
        <div className="min-h-screen h-auto bg-[#1a0b14] text-white flex flex-col items-center justify-start md:justify-center p-4 relative overflow-x-hidden">
            {/* Background Glow */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className={`absolute top-[-10%] left-1/2 -translate-x-1/2 w-[600px] md:w-[800px] h-[600px] md:h-[800px] ${isRejected ? 'bg-red-500/10' : 'bg-primary/10'} rounded-full blur-[80px] md:blur-[100px]`}></div>
            </div>

            <Navbar />

            <div className="text-center w-full max-w-2xl mx-auto z-10 pt-24 md:pt-20 pb-10">
                <div className={`w-16 h-16 md:w-20 md:h-20 ${isRejected ? 'bg-red-500' : 'bg-primary'} rounded-full flex items-center justify-center mx-auto mb-6 md:mb-8 shadow-[0_0_30px_rgba(236,72,153,0.5)]`}>
                    {isRejected ? <Info size={32} strokeWidth={3} className="md:w-10 md:h-10" /> : <Check size={32} strokeWidth={4} className="md:w-10 md:h-10" />}
                </div>

                <h1 className="text-3xl md:text-5xl font-extrabold mb-3 md:mb-4 tracking-tight px-2">
                    {isRejected ? 'Submission Returned' : 'Your performance is live!'}
                </h1>

                {isRejected ? (
                    <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 mb-8 md:mb-12 mx-4 text-left">
                        <h4 className="text-xs font-bold text-red-400 uppercase tracking-wider mb-2">JUDGE'S FEEDBACK</h4>
                        <p className="text-white/90 text-sm md:text-base leading-relaxed">
                            "{rejectionMessage}"
                        </p>
                    </div>
                ) : (
                    <p className="text-base md:text-lg text-white/60 mb-8 md:mb-12 leading-relaxed px-4">
                        You're now competing in the <span className="text-primary font-bold">{submission.challengeId?.title || 'Challenge'}</span>. Time to rally your crew and get those votes!
                    </p>
                )}

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
                        {!isRejected && (
                            <div className="absolute top-4 left-4 bg-red-600 px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 animate-pulse z-10">
                                <div className="w-1.5 h-1.5 bg-white rounded-full"></div> LIVE
                            </div>
                        )}
                        {!isPlaying && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/30 transition-colors z-20">
                                <div className="w-12 h-12 md:w-16 md:h-16 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/30 pl-1">
                                    <Play fill="white" size={24} className="md:w-8 md:h-8" />
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Info & Stats / Actions */}
                {isRejected ? (
                    <div className="px-4 mb-12">
                        <button
                            onClick={handleUploadFix}
                            className="w-full btn bg-red-600 hover:bg-red-500 text-white border-none h-14 rounded-xl font-bold text-lg flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(220,38,38,0.3)]"
                        >
                            <Upload size={20} /> Upload Fixed Version
                        </button>
                        <p className="text-white/40 text-sm mt-4">
                            Submitting a fix replaces your previous entry.
                        </p>
                    </div>
                ) : (
                    <>
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


                        {/* AI Score Section */}
                        {submission.aiRating && submission.aiRating.final_grid_index && (
                            <div className="mb-12 w-full">
                                <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                                    <div className="w-1.5 h-6 bg-primary rounded-full"></div>
                                    AI Performance Analysis
                                </h3>

                                <div className="bg-[#2a1b24] p-6 rounded-3xl border border-white/5 relative overflow-hidden">
                                    {/* Score Header */}
                                    <div className="flex justify-between items-start mb-6">
                                        <div>
                                            <h4 className="text-white/60 text-sm font-bold uppercase tracking-wider mb-1">Grid Index Score</h4>
                                            <div className="flex items-baseline gap-1">
                                                <span className={`text-4xl font-extrabold ${submission.aiRating.final_grid_index >= 8.5 ? 'text-green-400' :
                                                    submission.aiRating.final_grid_index >= 7.0 ? 'text-yellow-400' : 'text-white'
                                                    }`}>
                                                    {submission.aiRating.final_grid_index.toFixed(1)}
                                                </span>
                                                <span className="text-white/30 text-lg">/ 10</span>
                                            </div>
                                        </div>
                                        <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center">
                                            <Activity size={24} className="text-primary" />
                                        </div>
                                    </div>

                                    {/* Verdict */}
                                    <div className="bg-black/20 p-4 rounded-xl border border-white/5 mb-6">
                                        <p className="text-white/80 italic text-sm leading-relaxed">
                                            "{submission.aiRating.verdict_summary}"
                                        </p>
                                    </div>

                                    {/* Metrics Grid */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {[
                                            { name: 'Synchronization', score: submission.aiRating.synchronization, icon: <Activity className="text-blue-400" size={16} />, color: 'bg-blue-500/10' },
                                            { name: 'Musicality', score: submission.aiRating.musicality, icon: <Music className="text-purple-400" size={16} />, color: 'bg-purple-500/10' },
                                            { name: 'Energy', score: submission.aiRating.energy_intensity, icon: <Zap className="text-yellow-400" size={16} />, color: 'bg-yellow-500/10' },
                                            { name: 'Choreography', score: submission.aiRating.choreography_complexity, icon: <Layers className="text-pink-400" size={16} />, color: 'bg-pink-500/10' },
                                            { name: 'Stage Use', score: submission.aiRating.stage_utilization, icon: <Maximize className="text-green-400" size={16} />, color: 'bg-green-500/10' },
                                            { name: 'Cleanliness', score: submission.aiRating.visual_cleanliness, icon: <Eye className="text-cyan-400" size={16} />, color: 'bg-cyan-500/10' },
                                        ].map((metric) => (
                                            <div key={metric.name} className="flex items-center gap-3 bg-white/5 p-3 rounded-xl border border-white/5">
                                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${metric.color}`}>
                                                    {metric.icon}
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex justify-between items-center mb-1">
                                                        <span className="text-xs text-white/50 font-bold uppercase">{metric.name}</span>
                                                        <span className="text-white font-bold text-sm">{metric.score}</span>
                                                    </div>
                                                    <div className="w-full bg-white/10 h-1 rounded-full overflow-hidden">
                                                        <div
                                                            className={`h-full rounded-full ${metric.score >= 8 ? 'bg-green-500' : metric.score >= 6 ? 'bg-yellow-500' : 'bg-white/40'}`}
                                                            style={{ width: `${(metric.score / 10) * 100}%` }}
                                                        ></div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Copy Link */}
                        <div className="bg-[#2a1b24] rounded-full p-1.5 pl-4 md:pl-6 flex items-center justify-between border border-white/5 mb-12 mx-2">
                            <span className="text-white/40 text-xs md:text-sm truncate mr-2 md:mr-4 font-mono select-all flex-1 text-left">
                                {submission ? getPublicVideoUrl(submission._id).replace(/^https?:\/\//, '') : 'Loading Link...'}
                            </span>
                            <button
                                onClick={() => handleShare('native')}
                                className="btn btn-primary rounded-full px-4 md:px-6 font-bold text-sm h-10 md:h-12 whitespace-nowrap flex items-center gap-2"
                            >
                                <Share2 size={16} /> Share
                            </button>
                        </div>
                    </>
                )}

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
