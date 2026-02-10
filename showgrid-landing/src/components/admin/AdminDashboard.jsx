import React from 'react';
import { useVideo } from '../../context/VideoContext';
import { Check, X, Shield, Play } from 'lucide-react';

const AdminDashboard = () => {
    const { getPendingVideos, updateVideoStatus } = useVideo();
    const pendingVideos = getPendingVideos();

    return (
        <div className="min-h-screen bg-dark-lighter text-white pt-24 px-6 md:px-12">
            <div className="max-w-7xl mx-auto">
                <div className="flex items-center gap-4 mb-12">
                    <div className="w-12 h-12 bg-red-500/20 rounded-xl flex items-center justify-center text-red-500">
                        <Shield size={24} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-extrabold">Admin Command Center</h1>
                        <p className="text-white/50">Review and moderate incoming submissions</p>
                    </div>
                </div>

                {pendingVideos.length === 0 ? (
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-12 text-center">
                        <div className="w-16 h-16 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Check size={32} />
                        </div>
                        <h3 className="text-xl font-bold mb-2">All Caught Up!</h3>
                        <p className="text-white/50">There are no pending videos to review at this time.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {pendingVideos.map((video) => (
                            <div key={video.id} className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden flex flex-col">
                                {/* Video Preview */}
                                <div className="relative aspect-video bg-black group">
                                    <video src={video.videoUrl} className="w-full h-full object-cover" controls />
                                    <div className="absolute top-4 left-4">
                                        <span className="bg-yellow-500 text-black text-xs font-bold px-2 py-1 rounded">PENDING REVIEW</span>
                                    </div>
                                </div>

                                {/* Details */}
                                <div className="p-6 flex-1">
                                    <div className="flex items-center gap-3 mb-4">
                                        <img src={video.userAvatar} alt={video.userName} className="w-10 h-10 rounded-full border border-white/20" />
                                        <div>
                                            <h4 className="font-bold text-sm">{video.userName}</h4>
                                            <span className="text-xs text-white/40">Uploaded {new Date(video.timestamp).toLocaleDateString()}</span>
                                        </div>
                                    </div>

                                    {video.description && (
                                        <p className="text-sm text-white/60 mb-6 line-clamp-2">{video.description}</p>
                                    )}

                                    <div className="grid grid-cols-2 gap-3 mt-auto">
                                        <button
                                            onClick={() => updateVideoStatus(video.id, 'rejected')}
                                            className="flex items-center justify-center gap-2 py-2 rounded-lg bg-red-500/20 text-red-500 hover:bg-red-500/30 transition-colors font-semibold text-sm"
                                        >
                                            <X size={16} /> Revoke
                                        </button>
                                        <button
                                            onClick={() => updateVideoStatus(video.id, 'approved')}
                                            className="flex items-center justify-center gap-2 py-2 rounded-lg bg-green-500/20 text-green-500 hover:bg-green-500/30 transition-colors font-semibold text-sm"
                                        >
                                            <Check size={16} /> Approve
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminDashboard;
