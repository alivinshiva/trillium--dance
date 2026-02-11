import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, X, ChevronRight, Check } from 'lucide-react';
import { useVideo } from '../../context/VideoContext';
import { useUser } from '@clerk/clerk-react';
import Navbar from '../Navbar';

const UploadFinal = () => {
    const navigate = useNavigate();
    const { addVideo } = useVideo();
    const { user } = useUser();

    const [studioName, setStudioName] = useState('');
    const [city, setCity] = useState('');
    const [file, setFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [isDragging, setIsDragging] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [agreed, setAgreed] = useState(false);
    const fileInputRef = useRef(null);

    const cities = [
        "Mumbai", "Delhi", "Bangalore", "Kolkata", "Chennai", "Hyderabad", "Pune", "Ahmedabad", "Jaipur", "Surat"
    ];

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            setFile(selectedFile);
            setPreviewUrl(URL.createObjectURL(selectedFile));
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        const droppedFile = e.dataTransfer.files[0];
        if (droppedFile && droppedFile.type.startsWith('video/')) {
            setFile(droppedFile);
            setPreviewUrl(URL.createObjectURL(droppedFile));
        }
    };

    const handleSubmit = async () => {
        if (!file || !studioName || !city || !agreed) return;

        setUploading(true);
        // Simulate upload progress
        const interval = setInterval(() => {
            setUploadProgress(prev => {
                if (prev >= 100) {
                    clearInterval(interval);
                    completeUpload();
                    return 100;
                }
                return prev + 5;
            });
        }, 100);
    };

    const completeUpload = () => {
        const videoData = {
            id: Date.now().toString(),
            userId: user.id,
            userName: studioName, // Using Studio Name as the display name
            userAvatar: user.imageUrl,
            videoUrl: previewUrl,
            description: `Performing from ${city}`,
            city: city,
            status: 'pending',
            timestamp: new Date().toISOString()
        };

        addVideo(videoData);
        setTimeout(() => {
            setUploading(false);
            // Navigate to a success page or back to dashboard
            // For now, let's go to profile or a success state within this component?
            // The plan mentioned "Success/Redirect". Let's assume Profile for now or we can make a Success component.
            // Actually, existing Step 3 was "Success". But new Step 3 is Rules.
            // Let's redirect to Profile for now, as that shows "My Videos".
            navigate('/profile');
        }, 500);
    };

    return (
        <div className="min-h-screen bg-dark-lighter text-white">
            <Navbar />

            <div className="pt-32 pb-20 container max-w-4xl mx-auto">
                <div className="mb-8">
                    <p className="text-white/40 text-xs font-bold tracking-widest uppercase mb-2">Challenges / Studio Performance Upload</p>
                    <h1 className="text-4xl md:text-5xl font-extrabold mb-4">Submit Your Performance</h1>
                    <p className="text-white/60">Show the grid what your studio is made of. Let the dance do the talking.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                    <div>
                        <label className="block text-sm font-bold mb-2">Studio Name</label>
                        <input
                            type="text"
                            placeholder="Enter your studio name"
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors"
                            value={studioName}
                            onChange={(e) => setStudioName(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold mb-2">Select City</label>
                        <div className="relative">
                            <select
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors appearance-none cursor-pointer"
                                value={city}
                                onChange={(e) => setCity(e.target.value)}
                            >
                                <option value="" disabled>Choose your city</option>
                                {cities.map(c => <option key={c} value={c} className="bg-dark">{c}</option>)}
                            </select>
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-white/40">
                                <ChevronRight size={16} className="rotate-90" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Upload Zone */}
                <div
                    className={`border-2 border-dashed rounded-3xl h-[400px] flex flex-col items-center justify-center relative overflow-hidden transition-all duration-300 ${isDragging ? 'border-primary bg-primary/10' : 'border-white/10 bg-gradient-to-br from-orange-400/20 to-green-300/20'
                        }`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                >
                    {file ? (
                        <div className="w-full h-full relative group">
                            <video src={previewUrl} className="w-full h-full object-cover" controls />
                            <button
                                onClick={() => { setFile(null); setPreviewUrl(null); }}
                                className="absolute top-4 right-4 bg-black/60 hover:bg-red-500 text-white p-2 rounded-full transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>
                    ) : (
                        <div className="text-center p-8">
                            <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-6 text-primary">
                                <Upload size={32} />
                            </div>
                            <h3 className="text-2xl font-bold mb-2">Drag and drop your video file here</h3>
                            <p className="text-white/60 mb-8">Or click to browse from your device</p>

                            <div className="flex gap-4 justify-center">
                                <span className="px-4 py-1 rounded-full border border-white/20 text-xs font-bold text-white/40 uppercase">Max 500MB</span>
                                <span className="px-4 py-1 rounded-full border border-white/20 text-xs font-bold text-white/40 uppercase">MP4, MOV, AVI</span>
                                <span className="px-4 py-1 rounded-full border border-white/20 text-xs font-bold text-white/40 uppercase">Min 1080p</span>
                            </div>

                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                accept="video/*"
                                onChange={handleFileChange}
                            />
                            <button
                                onClick={() => fileInputRef.current.click()}
                                className="absolute inset-0 w-full h-full cursor-pointer opacity-0"
                            />
                        </div>
                    )}
                </div>

                {/* Progress Bar */}
                {uploading && (
                    <div className="mt-8">
                        <div className="flex justify-between text-xs font-bold mb-2">
                            <span>Uploading Performance...</span>
                            <span className="text-primary">{uploadProgress}%</span>
                        </div>
                        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-primary transition-all duration-300"
                                style={{ width: `${uploadProgress}%` }}
                            ></div>
                        </div>
                    </div>
                )}

                {/* Terms and Submit */}
                <div className="mt-8 flex flex-col md:flex-row items-center justify-between gap-6">
                    <label className="flex items-center gap-3 cursor-pointer group">
                        <div className={`w-6 h-6 rounded border flex items-center justify-center transition-colors ${agreed ? 'bg-primary border-primary' : 'border-white/30 group-hover:border-white/50'
                            }`}>
                            {agreed && <Check size={14} className="text-white" />}
                        </div>
                        <input
                            type="checkbox"
                            className="hidden"
                            checked={agreed}
                            onChange={() => setAgreed(!agreed)}
                        />
                        <span className="text-sm text-white/60">I agree to the <span className="text-primary font-bold">ShowGrid Challenge Rules</span> and confirm I own the performance rights.</span>
                    </label>

                    <button
                        onClick={handleSubmit}
                        disabled={!file || !studioName || !city || !agreed || uploading}
                        className="btn btn-primary px-12 py-4 text-lg font-bold rounded-full disabled:opacity-50 disabled:cursor-not-allowed w-full md:w-auto"
                    >
                        {uploading ? 'Uploading...' : 'Submit Entry ➤'}
                    </button>
                </div>
                <p className="text-center text-white/30 text-xs mt-8">Your submission will be reviewed for quality before appearing on the grid.</p>
            </div>
        </div>
    );
};

export default UploadFinal;
