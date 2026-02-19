import React from 'react';
import { X, Activity, Music, Zap, Layers, Maximize, Eye } from 'lucide-react';

const ScoreModal = ({ isOpen, onClose, aiRating }) => {
    if (!isOpen || !aiRating) return null;

    const metrics = [
        { name: 'Synchronization', score: aiRating.synchronization, icon: <Activity className="text-blue-400" />, color: 'bg-blue-500/10 text-blue-400' },
        { name: 'Musicality', score: aiRating.musicality, icon: <Music className="text-purple-400" />, color: 'bg-purple-500/10 text-purple-400' },
        { name: 'Energy & Intensity', score: aiRating.energy_intensity, icon: <Zap className="text-yellow-400" />, color: 'bg-yellow-500/10 text-yellow-400' },
        { name: 'Choreography', score: aiRating.choreography_complexity, icon: <Layers className="text-pink-400" />, color: 'bg-pink-500/10 text-pink-400' },
        { name: 'Stage Utilization', score: aiRating.stage_utilization, icon: <Maximize className="text-green-400" />, color: 'bg-green-500/10 text-green-400' },
        { name: 'Visual Cleanliness', score: aiRating.visual_cleanliness, icon: <Eye className="text-cyan-400" />, color: 'bg-cyan-500/10 text-cyan-400' },
    ];

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl transform transition-all">
                {/* Header */}
                <div className="p-6 border-b border-white/10 flex items-center justify-between bg-white/5">
                    <div>
                        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                            Grid Index Score
                            <span className={`px-2 py-0.5 rounded text-sm bg-primary/20 text-primary border border-primary/30`}>
                                {aiRating.final_grid_index} / 10
                            </span>
                        </h2>
                        <p className="text-white/40 text-sm mt-1">AI Performance Analysis</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/60 hover:text-white"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 overflow-y-auto max-h-[70vh]">

                    {/* Verdict */}
                    <div className="mb-8 bg-white/5 rounded-xl p-4 border-l-4 border-primary">
                        <h3 className="text-sm font-bold text-white/60 uppercase tracking-wider mb-2">Verdict Summary</h3>
                        <p className="text-white/90 leading-relaxed italic">
                            "{aiRating.verdict_summary}"
                        </p>
                    </div>

                    {/* Metrics Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {metrics.map((metric) => (
                            <div key={metric.name} className="bg-black/20 rounded-xl p-4 flex items-center gap-4 hover:bg-white/5 transition-colors border border-white/5">
                                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${metric.color}`}>
                                    {metric.icon}
                                </div>
                                <div className="flex-1">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-white/70 font-medium text-sm">{metric.name}</span>
                                        <span className={`font-bold ${metric.score >= 8 ? 'text-green-400' : metric.score >= 6 ? 'text-yellow-400' : 'text-white/60'}`}>
                                            {metric.score}
                                        </span>
                                    </div>
                                    <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full rounded-full transition-all duration-500 ease-out ${metric.score >= 8 ? 'bg-green-500' : metric.score >= 6 ? 'bg-yellow-500' : 'bg-white/40'
                                                }`}
                                            style={{ width: `${(metric.score / 10) * 100}%` }}
                                        ></div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ScoreModal;
