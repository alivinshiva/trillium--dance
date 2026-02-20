import React, { useMemo, useState, useEffect } from 'react';
import { useVideo } from '../context/VideoContext';
import { Calendar, Trophy, BarChart2, Share2 } from 'lucide-react';

const FeaturedChallenge = ({ challenge }) => {
    const { videos } = useVideo();

    // Calculate Dates
    const timeline = useMemo(() => {
        if (!challenge) return null;

        const start = new Date(challenge.startDate);
        const end = new Date(challenge.endDate);

        const submissionClose = new Date(start);
        submissionClose.setDate(start.getDate() + 5);

        const ratingsStart = new Date(submissionClose);
        ratingsStart.setDate(submissionClose.getDate() + 1);

        const winnersAnnounced = new Date(end);
        winnersAnnounced.setDate(end.getDate() + 1);

        return {
            start,
            submissionClose,
            ratingsStart,
            winnersAnnounced,
            end
        };
    }, [challenge]);

    // Calculate Stats
    const stats = useMemo(() => {
        if (!challenge || !videos) return { entries: 0, studios: 0 };

        const challengeVideos = videos.filter(v =>
            v.challengeId === challenge._id || (v.challengeId && v.challengeId._id === challenge._id)
        );

        const approvedVideos = challengeVideos.filter(v => v.status === 'approved');
        const uniqueStudios = new Set(
            approvedVideos
                .map(v => v.studioName)
                .filter(name => name)
        );

        return {
            entries: approvedVideos.length,
            studios: uniqueStudios.size
        };
    }, [videos, challenge]);

    // Countdown Timer
    const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0, label: 'Loading...' });

    useEffect(() => {
        if (!timeline) return;

        const interval = setInterval(() => {
            const now = new Date();
            let targetDate = timeline.submissionClose;
            let label = "SUBMISSION WINDOW CLOSES IN";

            if (now < timeline.start) {
                targetDate = timeline.start;
                label = "CHALLENGE STARTS IN";
            } else if (now > timeline.submissionClose && now < timeline.ratingsStart) {
                targetDate = timeline.ratingsStart;
                label = "RATINGS OPEN IN";
            } else if (now > timeline.ratingsStart && now < timeline.winnersAnnounced) {
                targetDate = timeline.winnersAnnounced;
                label = "WINNERS ANNOUNCED IN";
            } else if (now > timeline.winnersAnnounced) {
                setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, label: "CHALLENGE COMPLETED" });
                return;
            }

            const diff = targetDate - now;

            if (diff <= 0) return;

            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);

            setTimeLeft({ days, hours, minutes, seconds, label });

        }, 1000);

        return () => clearInterval(interval);
    }, [timeline]);

    if (!challenge || !timeline) return null;

    const formatDate = (date) => date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    return (
        <div className="w-full mx-auto flex flex-col">

            {/* Header / Title */}
            <div className="text-center mb-12">
                <div className="inline-block px-3 py-1 rounded-full bg-green-500/10 text-green-400 text-[10px] md:text-xs font-bold tracking-widest uppercase mb-4 border border-green-500/20">
                    <span className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-green-500 inline-block mr-2 animate-pulse"></span>
                    Live Challenge
                </div>
                <h1 className="text-3xl md:text-6xl font-black italic tracking-tighter mb-2 uppercase drop-shadow-[0_0_15px_rgba(236,72,153,0.3)]">
                    {challenge.title}
                </h1>
                <p className="text-pink-200/60 font-mono text-xs md:text-sm tracking-widest uppercase">
                    CURRENT TRACK: "{challenge.songTitle || 'Unknown'}"
                </p>
            </div>


            {/* Countdown Card */}
            <div className="bg-dark-lighter/50 backdrop-blur-sm border border-primary/10 rounded-3xl p-6 md:p-12 mb-12 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-primary/5 blur-3xl pointer-events-none"></div>

                <div className="text-center relative z-10">
                    <h3 className="text-primary font-bold text-xs md:text-sm tracking-[0.2em] uppercase mb-6 md:mb-8">{timeLeft.label}</h3>

                    <div className="flex flex-nowrap justify-center gap-2 md:gap-8 overflow-x-auto pb-2 md:pb-0">
                        {[
                            { val: timeLeft.days, label: 'DAYS' },
                            { val: timeLeft.hours, label: 'HOURS' },
                            { val: timeLeft.minutes, label: 'MINUTES' },
                            { val: timeLeft.seconds, label: 'SECONDS', highlight: true }
                        ].map((item, i) => (
                            <div key={i} className="flex flex-col items-center min-w-[60px] md:min-w-auto">
                                <div className={`w-14 h-16 md:w-32 md:h-40 ${item.highlight ? 'bg-primary text-white shadow-[0_0_30px_rgba(236,72,153,0.3)]' : 'bg-dark text-white border border-white/5'} rounded-xl md:rounded-2xl flex items-center justify-center text-2xl md:text-7xl font-black tabular-nums mb-2 relative overflow-hidden group`}>
                                    <span className="relative z-10">{String(item.val).padStart(2, '0')}</span>
                                    {/* Shine effect */}
                                    {item.highlight && <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>}
                                </div>
                                <span className="text-[8px] md:text-xs font-bold text-white/30 tracking-widest">{item.label}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Timeline */}
            <div className="relative mb-12 px-2 md:px-0">
                {/* Progress Line */}
                <div className="absolute top-5 left-0 w-full h-0.5 md:h-1 bg-white/5 rounded-full overflow-hidden block md:block">
                    {/* Mobile progress line */}
                    <div className="h-full bg-primary/30 w-1/3"></div>
                </div>

                <div className="grid grid-cols-4 gap-2 md:gap-8 relative z-10">
                    <div className="text-center">
                        <div className="w-8 h-8 md:w-12 md:h-12 rounded-full bg-primary flex items-center justify-center mx-auto mb-2 md:mb-4 ring-2 md:ring-4 ring-dark shadow-[0_0_20px_rgba(236,72,153,0.4)]">
                            <Calendar className="text-white" size={14} />
                        </div>
                        <h4 className="text-white font-bold text-[8px] md:text-sm mb-0.5 md:mb-1 hidden md:block">Submissions Open</h4>
                        <h4 className="text-white font-bold text-[8px] md:text-sm mb-0.5 md:mb-1 md:hidden">Open</h4>
                        <p className="text-white/40 text-[8px] md:text-xs font-mono uppercase leading-tight">{formatDate(timeline.start)}</p>
                    </div>

                    <div className="text-center">
                        <div className="w-8 h-8 md:w-12 md:h-12 rounded-full bg-primary flex items-center justify-center mx-auto mb-2 md:mb-4 ring-2 md:ring-4 ring-dark shadow-[0_0_20px_rgba(236,72,153,0.4)]">
                            <Share2 className="text-white" size={14} />
                        </div>
                        <h4 className="text-primary font-bold text-[8px] md:text-sm mb-0.5 md:mb-1 hidden md:block">Active Window</h4>
                        <h4 className="text-primary font-bold text-[8px] md:text-sm mb-0.5 md:mb-1 md:hidden">Active</h4>
                        <p className="text-primary/60 text-[8px] md:text-xs font-mono uppercase leading-tight">{formatDate(timeline.submissionClose)}</p>
                    </div>

                    <div className="text-center opacity-50">
                        <div className="w-8 h-8 md:w-12 md:h-12 rounded-full bg-dark-lighter flex items-center justify-center mx-auto mb-2 md:mb-4 ring-2 md:ring-4 ring-dark border border-white/10">
                            <Trophy className="text-white/40" size={14} />
                        </div>
                        <h4 className="text-white/60 font-bold text-[8px] md:text-sm mb-0.5 md:mb-1 hidden md:block">Ratings Live</h4>
                        <h4 className="text-white/60 font-bold text-[8px] md:text-sm mb-0.5 md:mb-1 md:hidden">Rate</h4>
                        <p className="text-white/20 text-[8px] md:text-xs font-mono uppercase leading-tight">{formatDate(timeline.ratingsStart)}</p>
                    </div>

                    <div className="text-center opacity-50">
                        <div className="w-8 h-8 md:w-12 md:h-12 rounded-full bg-dark-lighter flex items-center justify-center mx-auto mb-2 md:mb-4 ring-2 md:ring-4 ring-dark border border-white/10">
                            <BarChart2 className="text-white/40" size={14} />
                        </div>
                        <h4 className="text-white/60 font-bold text-[8px] md:text-sm mb-0.5 md:mb-1 hidden md:block">Winners Announced</h4>
                        <h4 className="text-white/60 font-bold text-[8px] md:text-sm mb-0.5 md:mb-1 md:hidden">Winners</h4>
                        <p className="text-white/20 text-[8px] md:text-xs font-mono uppercase leading-tight">{formatDate(timeline.winnersAnnounced)}</p>
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 gap-4 md:gap-6 mb-8">
                <div className="bg-dark-lighter/50 border border-white/5 rounded-3xl p-4 md:p-8 flex flex-col items-center justify-center min-h-[120px] md:min-h-[160px]">
                    <h2 className="text-3xl md:text-5xl font-black text-white mb-1 md:mb-2">{stats.studios}</h2>
                    <p className="text-white/40 font-bold text-[10px] md:text-xs tracking-widest uppercase text-center">Studios Joined</p>
                </div>
                <div className="bg-dark-lighter/50 border border-white/5 rounded-3xl p-4 md:p-8 flex flex-col items-center justify-center min-h-[120px] md:min-h-[160px]">
                    <h2 className="text-3xl md:text-5xl font-black text-white mb-1 md:mb-2">{stats.entries}</h2>
                    <p className="text-white/40 font-bold text-[10px] md:text-xs tracking-widest uppercase text-center">Video Entries</p>
                </div>
            </div>

        </div>
    );
};

export default FeaturedChallenge;
