import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Upload, X, ChevronRight, Check } from 'lucide-react';
import { useVideo } from '../../context/VideoContext';
import { useUser } from '@clerk/clerk-react';
import Navbar from '../Navbar';

const UploadFinal = () => {
    const navigate = useNavigate();
    const { challengeId } = useParams();
    const { addVideo, selectedChallenge, challenges, setSelectedChallenge } = useVideo();
    const { user } = useUser();

    // Restore selected challenge if missing
    useEffect(() => {
        if (!selectedChallenge && challenges.length > 0 && challengeId) {
            const challenge = challenges.find(c => c._id === challengeId);
            if (challenge) setSelectedChallenge(challenge);
        }
    }, [challengeId, challenges, selectedChallenge, setSelectedChallenge]);

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

    const AVAILABLE_TAGS = selectedChallenge?.tags && selectedChallenge.tags.length > 0
        ? selectedChallenge.tags
        : [
            "DanceVideo", "DanceLife", "Choreography", "DanceReels", "InstaDance",
            "StreetDance", "StudioDance", "FreestyleDance", "HipHopDance", "UrbanDance"
        ];

    const [selectedTags, setSelectedTags] = useState([]);

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

    const [success, setSuccess] = useState(false);

    const handleSubmit = async () => {
        if (!file || !studioName || !city || !agreed) return;

        if (!selectedChallenge) {
            alert("No challenge selected found. Please go back and join a challenge.");
            return;
        }

        setUploading(true);
        setUploadProgress(10); // Start progress

        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('userId', user.id || 'guest');
            // FIX: Use actual user name for display, save studio name separately
            formData.append('userName', user.fullName || user.username || 'Anonymous');
            formData.append('studioName', studioName);
            formData.append('userAvatar', user.imageUrl || 'https://via.placeholder.com/150');
            // Removed "Performing from" per user request
            formData.append('description', '');
            formData.append('city', city);
            formData.append('challengeId', selectedChallenge._id);
            formData.append('tags', JSON.stringify(selectedTags));

            // Simulating progress for UX since we can't easily track fetch upload progress
            const interval = setInterval(() => {
                setUploadProgress(prev => Math.min(prev + 10, 90));
            }, 500);

            await addVideo(formData);

            clearInterval(interval);
            setUploadProgress(100);
            setUploading(false);
            setSuccess(true); // Show success message

        } catch (error) {
            console.error(error);
            alert('Upload failed: ' + error.message);
            setUploading(false);
            setUploadProgress(0);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen bg-dark-lighter text-white flex flex-col">
                <Navbar />
                <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                    <div className="w-24 h-24 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mb-6 animate-bounce">
                        <Check size={48} />
                    </div>
                    <h1 className="text-4xl font-extrabold mb-4">Submission Received!</h1>
                    <p className="text-white/60 max-w-md mb-8">
                        Your performance is now <span className="text-yellow-400 font-bold">Under Review</span>.
                        <br />We will notify you once it's approved and live on the grid.
                    </p>

                    <div className="flex gap-4">
                        <button
                            onClick={() => navigate('/profile')}
                            className="btn btn-primary px-8 py-3 rounded-full font-bold"
                        >
                            Go to Dashboard
                        </button>
                        <button
                            onClick={() => navigate('/discovered')}
                            className="bg-white/10 hover:bg-white/20 text-white px-8 py-3 rounded-full font-bold transition-colors"
                        >
                            Back to Grid
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-dark-lighter text-white">
            <Navbar />

            <div className="pt-32 pb-20 container max-w-4xl mx-auto">
                <div className="mb-8 relative">
                    <button onClick={() => navigate(`/challenges/${challengeId}/upload/step-3`)} className="absolute -top-10 left-0 flex items-center gap-2 text-white/40 hover:text-white transition-colors text-xs font-bold uppercase tracking-widest">
                        <ChevronRight size={14} className="rotate-180" /> Back to Step 3
                    </button>
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

                {/* Tags Selection */}
                <div className="mb-12">
                    <label className="block text-sm font-bold mb-4">Select Tags (Max 10)</label>
                    <div className="flex flex-wrap gap-3">
                        {AVAILABLE_TAGS.map(tag => (
                            <button
                                key={tag}
                                onClick={() => {
                                    if (selectedTags.includes(tag)) {
                                        setSelectedTags(prev => prev.filter(t => t !== tag));
                                    } else {
                                        if (selectedTags.length < 10) {
                                            setSelectedTags(prev => [...prev, tag]);
                                        }
                                    }
                                }}
                                className={`px-4 py-2 rounded-full text-xs font-bold transition-all duration-200 border ${selectedTags.includes(tag)
                                    ? 'bg-primary border-primary text-white shadow-[0_0_10px_rgba(236,72,153,0.5)]'
                                    : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10 hover:border-white/20'
                                    }`}
                            >
                                {tag.startsWith('#') ? tag : `#${tag}`}
                            </button>
                        ))}
                    </div>
                    <div className="mt-2 text-xs text-white/40 text-right">
                        {selectedTags.length}/10 selected
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
