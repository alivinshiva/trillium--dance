import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { Music, Video, Trophy, ChevronRight } from 'lucide-react';
import { useVideo } from '../../context/VideoContext';
import Navbar from '../Navbar';

const UploadStep1 = () => {
    const { isSignedIn } = useUser();
    const navigate = useNavigate();
    const { selectedChallenge } = useVideo();

    const handleNext = () => {
        if (selectedChallenge) {
            navigate('/upload/step-2');
        } else {
            navigate('/challenges');
        }
    };

    return (
        <div className="min-h-screen bg-dark-lighter bg-gradient-to-b from-dark-lighter to-[#050505] pt-0 pb-12 text-white text-center relative">
            <Navbar />
            <div className="pt-24 container">
                {/* Progress */}
                <div className="max-w-xl mx-auto mb-16">
                    <div className="flex justify-between text-xs font-bold tracking-widest text-white/60 mb-2">
                        <span>ONBOARDING PROGRESS</span>
                        <span className="text-primary">1 of 3</span>
                    </div>
                    <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: '33%' }}></div>
                    </div>
                </div>

                {/* Content */}
                <div>
                    <h1 className="text-5xl md:text-6xl font-extrabold leading-none mb-4">
                        READY TO TAKE<br />
                        <span className="text-primary">THE GRID?</span>
                    </h1>
                    <p className="text-lg text-white/70 max-w-lg mx-auto mb-12">
                        Join India's biggest dance challenge and transform your moves into fame.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-16 text-left">
                        <div className="bg-white/5 border border-white/5 p-8 rounded-2xl transition-transform hover:-translate-y-1 hover:bg-white/10">
                            <div className="w-10 h-10 bg-primary/20 text-primary rounded-lg flex items-center justify-center mb-4">
                                <Music size={24} />
                            </div>
                            <h3 className="text-lg font-bold mb-2">1. Download the Hook</h3>
                            <p className="text-sm text-white/60 leading-relaxed">Grab the official track and feel the rhythm.</p>
                        </div>
                        <div className="bg-white/5 border border-white/5 p-8 rounded-2xl transition-transform hover:-translate-y-1 hover:bg-white/10">
                            <div className="w-10 h-10 bg-primary/20 text-primary rounded-lg flex items-center justify-center mb-4">
                                <Video size={24} />
                            </div>
                            <h3 className="text-lg font-bold mb-2">2. Record your move</h3>
                            <p className="text-sm text-white/60 leading-relaxed">Show us your unique style on the floor.</p>
                        </div>
                        <div className="bg-white/5 border border-white/5 p-8 rounded-2xl transition-transform hover:-translate-y-1 hover:bg-white/10">
                            <div className="w-10 h-10 bg-primary/20 text-primary rounded-lg flex items-center justify-center mb-4">
                                <Trophy size={24} />
                            </div>
                            <h3 className="text-lg font-bold mb-2">3. Upload & Win</h3>
                            <p className="text-sm text-white/60 leading-relaxed">Get rated by the community and climb the ranks.</p>
                        </div>
                    </div>

                    <div className="flex flex-col items-center gap-4">
                        <button className="btn btn-primary px-12 py-3 text-lg uppercase tracking-widest" onClick={handleNext}>
                            NEXT <ChevronRight size={20} />
                        </button>
                        <div className="text-[10px] tracking-[0.2em] opacity-30 uppercase font-bold">VARIANT 1 OF 3</div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UploadStep1;
