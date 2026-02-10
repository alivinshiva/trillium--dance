import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useVideo } from '../../context/VideoContext';
import { useUser } from '@clerk/clerk-react';
import { Play, RotateCw, RotateCcw, Headphones, Download, CheckCircle, XCircle, AlertCircle, Upload as UploadIcon, FileVideo } from 'lucide-react';

const UploadStep2 = () => {
    const navigate = useNavigate();
    const { addVideo } = useVideo();
    const { user } = useUser();

    // State for file upload
    const [file, setFile] = useState(null);
    const [videoPreview, setVideoPreview] = useState(null);
    const fileInputRef = useRef(null);

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            setFile(selectedFile);
            setVideoPreview(URL.createObjectURL(selectedFile));
        }
    };

    const handleNextStep = () => {
        if (!file) return;

        const newVideo = {
            userId: user?.id || 'guest',
            userName: user?.fullName || 'Guest Dancer',
            userAvatar: user?.imageUrl || 'https://via.placeholder.com/100',
            videoUrl: videoPreview,
            description: `Submission for ${user?.fullName || 'Guest'}`
        };

        addVideo(newVideo);
        navigate('/upload/step-3');
    };

    return (
        <div className="min-h-screen bg-dark-lighter pt-24 pb-12 text-white">
            <div className="container">
                {/* Progress */}
                <div className="max-w-6xl mx-auto mb-12">
                    <div className="flex justify-between text-xs font-bold tracking-widest text-white/60 mb-2">
                        <span>ONBOARDING PROGRESS </span>
                        <span className="text-primary">66%</span>
                    </div>
                    <div className="h-1 bg-white/10 rounded-full overflow-hidden mb-2">
                        <div className="h-full bg-primary rounded-full" style={{ width: '66%' }}></div>
                    </div>
                    <div className="text-right text-xs text-white/40">Step 2 of 3: Audio Mastery</div>
                </div>

                <div className="text-center mb-12">
                    <h1 className="text-4xl font-extrabold mb-4">Master the Audio</h1>
                    <p className="text-white/60 max-w-xl mx-auto">
                        Every viral dance starts with the perfect timing. Listen to the official segment you'll be using for your challenge.
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-8 max-w-6xl mx-auto mb-16">
                    {/* Audio Player Card & Upload Area */}
                    <div className="flex flex-col gap-6">
                        {/* Audio Player */}
                        <div className="bg-white/5 border border-white/10 rounded-3xl p-8 flex flex-col items-center justify-center min-h-[300px]">
                            {/* Visualizer */}
                            <div className="flex items-center gap-1 h-24 mb-6">
                                {[...Array(20)].map((_, i) => (
                                    <div key={i} className="w-1.5 bg-primary rounded-full animate-pulse-slow" style={{ height: `${Math.random() * 60 + 20}%`, animationDelay: `${i * 0.1}s` }}></div>
                                ))}
                            </div>

                            <div className="text-center mb-6">
                                <h3 className="text-xl font-bold mb-1">The 60-second Hook</h3>
                                <span className="text-primary font-medium text-sm">ShowGrid Official Audio Track</span>
                            </div>

                            {/* Native Audio Element for functionality */}
                            <audio controls className="w-full max-w-md mb-4 accent-primary">
                                <source src="https://assets.mixkit.co/music/preview/mixkit-tech-house-vibes-130.mp3" type="audio/mpeg" />
                                Your browser does not support the audio element.
                            </audio>
                        </div>

                        {/* File Upload Area */}
                        <div
                            className={`bg-white/5 border-2 border-dashed ${file ? 'border-primary bg-primary/5' : 'border-white/10'} rounded-3xl p-8 flex flex-col items-center justify-center transition-all cursor-pointer hover:border-primary/50 hover:bg-white/10`}
                            onClick={() => fileInputRef.current.click()}
                        >
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                accept="video/*"
                                className="hidden"
                            />

                            {file ? (
                                <div className="text-center">
                                    <div className="w-16 h-16 bg-primary/20 text-primary rounded-full flex items-center justify-center mx-auto mb-4">
                                        <FileVideo size={32} />
                                    </div>
                                    <h3 className="font-bold text-lg mb-1">Video Selected!</h3>
                                    <p className="text-white/60 text-sm mb-4">{file.name}</p>
                                    <button className="text-xs font-bold uppercase tracking-wider text-white/40 hover:text-white">Click to change video</button>
                                </div>
                            ) : (
                                <div className="text-center">
                                    <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4 text-white/60">
                                        <UploadIcon size={32} />
                                    </div>
                                    <h3 className="font-bold text-lg mb-2">Upload Your Dance</h3>
                                    <p className="text-white/60 text-sm mb-6 max-w-xs mx-auto">Select your video file to upload. MP4, MOV formats supported.</p>
                                    <span className="btn btn-outline py-2 text-sm">Select Video File</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Guidelines Sidebar */}
                    <div className="bg-white/5 border border-white/5 rounded-3xl p-8 h-fit">
                        <h3 className="flex items-center gap-3 text-lg font-bold mb-6">
                            <Headphones size={20} className="text-primary" /> Audio Guidelines
                        </h3>

                        <div className="space-y-4 mb-8">
                            <div className="bg-black/20 rounded-xl p-4 flex gap-4 border-l-4 border-red-500">
                                <XCircle size={20} className="text-red-500 shrink-0 mt-0.5" />
                                <div>
                                    <h4 className="text-sm font-bold mb-1">No Remixes</h4>
                                    <p className="text-xs text-white/60 leading-relaxed">Uploads with edited versions or unofficial remixes will be automatically disqualified.</p>
                                </div>
                            </div>

                            <div className="bg-black/20 rounded-xl p-4 flex gap-4 border-l-4 border-amber-500">
                                <AlertCircle size={20} className="text-amber-500 shrink-0 mt-0.5" />
                                <div>
                                    <h4 className="text-sm font-bold mb-1">No Tempo Changes</h4>
                                    <p className="text-xs text-white/60 leading-relaxed">Keep the original BPM. Slowed + Reverb or Nightcore edits are not allowed.</p>
                                </div>
                            </div>

                            <div className="bg-black/20 rounded-xl p-4 flex gap-4 border-l-4 border-emerald-500">
                                <CheckCircle size={20} className="text-emerald-500 shrink-0 mt-0.5" />
                                <div>
                                    <h4 className="text-sm font-bold mb-1">Official Audio Only</h4>
                                    <p className="text-xs text-white/60 leading-relaxed">Ensure your recording syncs with the segment played on the left.</p>
                                </div>
                            </div>
                        </div>

                        <button className="btn btn-primary w-full justify-center mb-3">
                            Listen to the Hook <Headphones size={18} />
                        </button>

                        <button className="btn btn-outline w-full justify-center">
                            Download Audio Stems <Download size={18} />
                        </button>
                    </div>
                </div>

                <div className="max-w-6xl mx-auto flex justify-between items-center pt-8 border-t border-white/10">
                    <button className="text-white/50 hover:text-white font-semibold transition-colors" onClick={() => navigate('/upload')}>
                        ← Back to Step 1
                    </button>
                    <div className="text-xs text-white/30 hidden md:block">Reviewing the audio is mandatory before proceeding.</div>
                    <button
                        className={`btn px-8 py-3 font-bold transition-all ${file ? 'btn-white text-dark hover:bg-gray-100' : 'bg-white/10 text-white/30 cursor-not-allowed'}`}
                        onClick={handleNextStep}
                        disabled={!file}
                    >
                        {file ? 'Submit & Continue →' : 'Upload Video to Continue'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default UploadStep2;
