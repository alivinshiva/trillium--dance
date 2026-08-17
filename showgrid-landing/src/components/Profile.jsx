import { Link, useNavigate } from 'react-router-dom';
import { useUser, SignOutButton } from '@clerk/clerk-react';
import {
    Home, Trophy, BarChart2, User, Settings, Edit, MapPin, Zap,
    LogOut, ChevronRight, Star, ExternalLink, Check, Trash2, Bell, Share2, Clock, X
} from 'lucide-react';
import Navbar from './Navbar';
import { useVideo } from '../context/VideoContext';
import { useNotification } from '../context/NotificationContext';

import { useRef, useState } from 'react';

const VideoCard = ({ video, handleShare, deleteVideo }) => {
    const videoRef = useRef(null);
    const [spanClass, setSpanClass] = useState('col-span-1 row-span-1');

    const handleLoadedMetadata = () => {
        const { videoWidth, videoHeight } = videoRef.current;
        if (videoWidth < videoHeight) {
            // Vertical video -> Taller card
            setSpanClass('col-span-1 row-span-2');
        } else {
            // Horizontal/Square -> Standard card
            setSpanClass('col-span-1 row-span-1');
        }
    };

    return (
        <div className={`bg-[#111] border border-white/10 rounded-xl overflow-hidden group hover:border-white/30 transition-colors flex flex-col ${spanClass}`}>
            <Link to={`/discovered/feed/${video._id}`} className="flex-1 relative bg-black block group-hover:scale-[1.02] transition-transform duration-500">
                <video
                    ref={videoRef}
                    src={video.videoUrl}
                    className="w-full h-full object-cover absolute inset-0"
                    onLoadedMetadata={handleLoadedMetadata}
                    muted
                    playsInline
                />
                <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors"></div>

                {/* Status Badge - Icon Only */}
                <div className={`absolute top-2 right-2 w-8 h-8 rounded-full shadow-lg flex items-center justify-center backdrop-blur-md ${video.status === 'approved' ? 'bg-green-500/90 text-white' :
                    video.status === 'rejected' ? 'bg-red-500/90 text-white' :
                        'bg-yellow-500/90 text-black'
                    }`}
                    title={video.status || 'Pending'}
                >
                    {video.status === 'approved' ? <Check size={16} strokeWidth={3} /> :
                        video.status === 'rejected' ? <X size={16} strokeWidth={3} /> :
                            <Clock size={16} strokeWidth={3} />}
                </div>
            </Link>

            <div className="p-4 bg-[#111] z-10 relative">
                <div className="flex justify-between items-start mb-1">
                    <h4 className="font-bold text-sm truncate flex-1 text-primary">{video.challengeId?.title || 'Challenge'}</h4>
                    <div className="flex gap-1">
                        <button
                            onClick={(e) => handleShare(e, video._id)}
                            className="text-white/20 hover:text-white transition-colors p-1"
                            title="Share Video"
                        >
                            <Share2 size={14} />
                        </button>
                        <button
                            onClick={(e) => {
                                e.preventDefault(); // Prevent navigation
                                if (confirm('Are you sure you want to delete this video?')) {
                                    deleteVideo(video._id).catch(err => alert(err.message));
                                }
                            }}
                            className="text-white/20 hover:text-red-500 transition-colors p-1"
                            title="Delete Video"
                        >
                            <Trash2 size={14} />
                        </button>
                    </div>
                </div>
                <p className="text-[10px] text-white/50 mb-3 truncate">{video.description}</p>
                <div className="flex items-center justify-between text-[10px] text-white/30 font-bold uppercase">
                    <span>{new Date(video.createdAt).toLocaleDateString()}</span>
                    {video.status === 'approved' && (
                        <span className="text-green-500 flex items-center gap-1">
                            <Check size={10} /> Live
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
};

const Profile = () => {
    const { user, isLoaded } = useUser();
    const { getUserVideos, deleteVideo, getPublicVideoUrl, nativeShare } = useVideo();
    const { unreadCount, togglePanel } = useNotification();
    const navigate = useNavigate();
    const userVideos = getUserVideos();

    const handleShare = (e, videoId) => {
        e.preventDefault(); // Prevent grid item click
        e.stopPropagation();

        navigate(`/submission-live/${videoId}`);
    };

    if (!isLoaded) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center text-white">
                <p>Please sign in to view your profile.</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black text-white flex">
            {/* Sidebar */}
            <aside className="w-64 border-r border-white/10 hidden md:flex flex-col p-6 fixed h-full bg-black z-10">
                <Link to="/" className="flex items-center gap-2 font-bold text-xl mb-12 hover:opacity-80 transition-opacity">
                    <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                        <div className="w-3 h-3 bg-white rounded-sm grid grid-cols-2 gap-0.5">
                            <div className="bg-transparent"></div>
                            <div className="bg-primary"></div>
                            <div className="bg-primary"></div>
                            <div className="bg-transparent"></div>
                        </div>
                    </div>
                    <span>SHOWGRID</span>
                </Link>

                <nav className="flex-1 space-y-2">
                    <Link to="/discovered" className="flex items-center gap-3 px-4 py-3 text-white/60 hover:text-white hover:bg-white/5 rounded-xl transition-colors">
                        <Home size={20} /> Feed
                    </Link>
                    <Link to="/challenges" className="flex items-center gap-3 px-4 py-3 text-white/60 hover:text-white hover:bg-white/5 rounded-xl transition-colors">
                        <Trophy size={20} /> Challenges
                    </Link>
                    <Link to="/dashboard" className="flex items-center gap-3 px-4 py-3 text-white/60 hover:text-white hover:bg-white/5 rounded-xl transition-colors">
                        <Zap size={20} /> Dashboard
                    </Link>
                    <Link to="/leaderboard" className="flex items-center gap-3 px-4 py-3 text-white/60 hover:text-white hover:bg-white/5 rounded-xl transition-colors">
                        <BarChart2 size={20} /> Leaderboard
                    </Link>
                    <div className="flex items-center gap-3 px-4 py-3 bg-white/10 text-white rounded-xl font-bold cursor-default">
                        <User size={20} className="text-primary" /> My Profile
                    </div>
                    <button
                        onClick={togglePanel}
                        className="flex items-center gap-3 px-4 py-3 text-white/60 hover:text-white hover:bg-white/5 rounded-xl transition-colors w-full text-left"
                    >
                        <div className="relative">
                            <Bell size={20} />
                            {unreadCount > 0 && (
                                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border border-black"></span>
                            )}
                        </div>
                        Notifications
                        {unreadCount > 0 && (
                            <span className="ml-auto bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                                {unreadCount}
                            </span>
                        )}
                    </button>
                    <span className="flex items-center gap-3 px-4 py-3 text-white/30 cursor-not-allowed" title="Coming soon">
                        <Settings size={20} /> Settings
                    </span>
                </nav>

                <SignOutButton>
                    <button className="flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-red-500/10 rounded-xl transition-colors mt-auto w-full">
                        <LogOut size={20} /> Sign Out
                    </button>
                </SignOutButton>
            </aside>

            {/* Main Content */}
            <main className="flex-1 md:ml-64 p-6 pt-24 md:p-12 max-w-7xl mx-auto">
                {/* Header Card */}
                <div className="md:bg-[#111] md:border md:border-white/10 md:rounded-3xl md:p-8 mb-8 relative overflow-visible md:overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none hidden md:block">
                        <div className="w-64 h-64 bg-primary/20 rounded-full blur-3xl"></div>
                    </div>

                    <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-start md:items-center justify-between relative z-10">
                        <div className="flex items-center gap-4 md:gap-6">
                            <div className="relative">
                                <div className="w-20 h-20 md:w-32 md:h-32 rounded-full p-1 bg-gradient-to-br from-primary to-purple-600">
                                    <img
                                        src={user.imageUrl}
                                        alt={user.fullName}
                                        className="w-full h-full rounded-full object-cover border-4 border-[#111]"
                                    />
                                </div>
                                <div className="absolute -bottom-2 -right-2 bg-primary text-white text-[10px] md:text-xs font-bold px-2 md:px-3 py-1 rounded-full border-4 border-[#111] flex items-center gap-1">
                                    <Zap size={10} fill="white" className="md:w-3 md:h-3" /> LVL 12
                                </div>
                            </div>

                            <div>
                                <div className="flex items-center gap-2 md:gap-3 mb-1">
                                    <h1 className="text-2xl md:text-4xl font-bold">{user.fullName}</h1>
                                    <span className="bg-purple-500/20 text-purple-400 text-[10px] font-bold px-2 py-0.5 rounded border border-purple-500/30 uppercase tracking-wide">
                                        Super Fan
                                    </span>
                                </div>
                                <p className="text-white/60 text-xs md:text-base mb-2">Digital Contributor • Member since {new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</p>
                                <div className="flex items-center gap-3 md:gap-4 text-xs md:text-sm text-white/40">
                                    <span className="flex items-center gap-1"><MapPin size={12} className="md:w-3.5 md:h-3.5" /> Mumbai, IN</span>
                                    <span className="flex items-center gap-1"><Zap size={12} className="text-yellow-500 md:w-3.5 md:h-3.5" /> 450 Impact Points</span>
                                </div>
                            </div>
                        </div>

                        <button className="flex items-center gap-2 px-4 md:px-6 py-2 md:py-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors font-semibold text-xs md:text-base w-full md:w-auto justify-center">
                            <Edit size={14} className="md:w-4 md:h-4" /> Edit Profile
                        </button>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    {/* Stat I */}
                    <div className="bg-[#111] border border-white/10 rounded-2xl p-6 relative overflow-hidden group hover:border-white/20 transition-colors">
                        <div className="absolute right-4 bottom-4 opacity-5 group-hover:opacity-10 transition-opacity">
                            <Star size={80} />
                        </div>
                        <h3 className="text-xs font-bold text-white/40 tracking-widest uppercase mb-2">Performances Rated</h3>
                        <div className="text-5xl font-extrabold mb-2">—</div>
                        <div className="text-white/30 text-xs font-bold">
                            Coming soon
                        </div>
                    </div>

                    {/* Stat II */}
                    <div className="bg-[#111] border border-white/10 rounded-2xl p-6 relative overflow-hidden group hover:border-white/20 transition-colors">
                        <div className="absolute right-4 bottom-4 opacity-5 group-hover:opacity-10 transition-opacity">
                            <Trophy size={80} />
                        </div>
                        <h3 className="text-xs font-bold text-white/40 tracking-widest uppercase mb-2">Correct Predictions</h3>
                        <div className="text-5xl font-extrabold mb-2">—</div>
                        <div className="text-white/30 text-xs font-bold">
                            Coming soon
                        </div>
                    </div>

                    {/* Stat III */}
                    <div className="bg-[#111] border border-white/10 rounded-2xl p-6 relative overflow-hidden group hover:border-white/20 transition-colors">
                        <div className="absolute right-4 bottom-4 opacity-5 group-hover:opacity-10 transition-opacity">
                            <MapPin size={80} />
                        </div>
                        <h3 className="text-xs font-bold text-white/40 tracking-widest uppercase mb-2">Cities Supported</h3>
                        <div className="text-5xl font-extrabold mb-2">—</div>
                        <div className="text-white/30 text-xs font-bold">
                            Coming soon
                        </div>
                    </div>
                </div>

                {/* City Pride */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                    <div className="lg:col-span-3 bg-[#111] border border-white/10 rounded-3xl p-8 relative overflow-hidden">
                        <div className="flex items-center gap-2 mb-8">
                            <MapPin className="text-primary" size={20} />
                            <h2 className="text-xl font-bold">City Pride</h2>
                        </div>

                        <div className="flex flex-col md:flex-row gap-12 items-center">
                            <div className="flex-1 w-full">
                                <div className="text-xs font-bold text-white/40 tracking-widest uppercase mb-2">YOUR HOME CITY</div>
                                <div className="text-4xl md:text-5xl font-extrabold mb-8">
                                    <span className="text-white/30">—</span>
                                </div>

                                <div className="flex justify-between items-end mb-2">
                                    <span className="text-sm font-bold text-white/60">Contribution to Rank #1</span>
                                    <span className="text-2xl font-bold text-white/30">—</span>
                                </div>
                                <div className="h-4 bg-white/5 rounded-full overflow-hidden mb-4">
                                    <div className="h-full bg-white/10 w-0 rounded-full"></div>
                                </div>
                                <p className="text-white/30 text-sm italic mb-8">City stats will appear after your first rated performance.</p>

                                <button className="btn btn-outline border-white/10 bg-white/5 hover:bg-white/10 text-xs px-6 py-3 tracking-widest">
                                    VIEW NATIONAL LEADERBOARD
                                </button>
                            </div>

                            <div className="relative w-full md:w-80 h-48 bg-[#1a0b14] rounded-2xl overflow-hidden border border-white/5 group">
                                <img
                                    src="https://images.unsplash.com/photo-1566552881560-0be862a7c445?q=80&w=1000&auto=format&fit=crop"
                                    alt="Mumbai Map"
                                    className="w-full h-full object-cover opacity-40 group-hover:scale-110 transition-transform duration-700"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                                    <div className="bg-white/10 backdrop-blur-md border border-white/20 px-3 py-1 rounded-full text-[10px] font-bold text-white shadow-xl">
                                        IMPACT ZONE A
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* My Studio Uploads */}
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-2">
                            <div className="w-1 h-6 bg-primary rounded-full"></div>
                            <h2 className="text-xl font-bold">My Studio Uploads</h2>
                        </div>
                        <Link to="/upload" className="text-xs font-bold text-primary hover:text-white transition-colors">
                            + New Upload
                        </Link>
                    </div>

                    {userVideos.length === 0 ? (
                        <div className="bg-[#111] border border-white/10 rounded-xl p-8 text-center">
                            <p className="text-white/50 mb-4">You haven't uploaded any performances yet.</p>
                            <Link to="/upload" className="btn btn-primary px-6 py-2 rounded-full text-sm font-bold">
                                Upload Now
                            </Link>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6 auto-rows-[150px] md:auto-rows-[300px] grid-flow-dense">
                            {userVideos.map((video) => (
                                <VideoCard
                                    key={video._id}
                                    video={video}
                                    handleShare={handleShare}
                                    deleteVideo={deleteVideo}
                                />
                            ))}
                        </div>
                    )}
                </div>

                {/* Navigation Overlay */}
                <Navbar />
            </main>
        </div>
    );
};


// Simple arrow component for reuse within the file
const ArrowRight = ({ size = 16, className = "" }) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
    >
        <path d="M5 12h14" />
        <path d="m12 5 7 7-7 7" />
    </svg>
);

export default Profile;
