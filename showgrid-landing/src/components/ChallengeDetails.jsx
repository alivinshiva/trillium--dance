import React, { useMemo, useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useVideo } from '../context/VideoContext';
import { Calendar, Users, Trophy, BarChart2, Share2, ArrowRight } from 'lucide-react';
import Navbar from './Navbar';
import Footer from './Footer';

const ChallengeDetails = () => {
    const { challengeId } = useParams();
    const { challenges, videos, nativeShare } = useVideo();

    // Find Challenge
    const challenge = useMemo(() =>
        challenges.find(c => c._id === challengeId),
        [challenges, challengeId]);

    // Calculate Dates
    const timeline = useMemo(() => {
        if (!challenge) return null;

        const start = new Date(challenge.startDate);
        const end = new Date(challenge.endDate);

        // Logical Phases based on user request
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
        if (!challengeId || !videos) return { entries: 0, studios: 0 };

        const challengeVideos = videos.filter(v =>
            v.challengeId === challengeId || (v.challengeId && v.challengeId._id === challengeId)
        );

        const approvedVideos = challengeVideos.filter(v => v.status === 'approved');
        const uniqueStudios = new Set(
            approvedVideos
                .map(v => v.studioName)
                .filter(name => name) // Filter out null/undefined/empty
        );

        return {
            entries: approvedVideos.length,
            studios: uniqueStudios.size
        };
    }, [videos, challengeId]);

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

            if (diff <= 0) {
                // Should ideally trigger re-eval of phase, but simplified here
                return;
            }

            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);

            setTimeLeft({ days, hours, minutes, seconds, label });

        }, 1000);

        return () => clearInterval(interval);
    }, [timeline]);

    const handleShare = () => {
        if (!challenge) return;
        nativeShare({
            title: challenge.title,
            text: `Check out the ${challenge.title} on ShowGrid!`,
            url: window.location.href
        });
    };

    if (!challenge || !timeline) {
        return <div className="min-h-screen bg-dark flex items-center justify-center text-white">Loading...</div>;
    }

    const formatDate = (date) => date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    return (
        <div className="min-h-screen bg-dark text-white flex flex-col font-sans">
            <Navbar />

            <main className="flex-grow pt-24 pb-20 px-4 md:px-8">
                <div className="max-w-6xl mx-auto">

                    {/* Header */}
                    <div className="text-center mb-12">
                        <div className="inline-block px-3 py-1 rounded-full bg-green-500/10 text-green-400 text-xs font-bold tracking-widest uppercase mb-4 border border-green-500/20">
                            <span className="w-2 h-2 rounded-full bg-green-500 inline-block mr-2 animate-pulse"></span>
                            Live Challenge
                        </div>
                        <h1 className="text-4xl md:text-6xl font-black italic tracking-tighter mb-4 uppercase">
                            {challenge.title}
                        </h1>
                        <p className="text-pink-200/60 font-mono text-sm tracking-widest uppercase">
                            CURRENT TRACK: "{challenge.songTitle || 'Unknown Track'}" ({challenge.artistName || 'Unknown Artist'})
                        </p>
                    </div>

                    {/* Countdown Card */}
                    <div className="bg-dark-lighter/50 backdrop-blur-sm border border-primary/10 rounded-3xl p-8 md:p-12 mb-12 shadow-2xl relative overflow-hidden">
                        {/* Background Glow */}
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-primary/5 blur-3xl pointer-events-none"></div>

                        <div className="text-center relative z-10">
                            <h3 className="text-primary font-bold text-sm tracking-[0.2em] uppercase mb-8">{timeLeft.label}</h3>

                            <div className="flex flex-wrap justify-center gap-4 md:gap-8">
                                {[
                                    { val: timeLeft.days, label: 'DAYS' },
                                    { val: timeLeft.hours, label: 'HOURS' },
                                    { val: timeLeft.minutes, label: 'MINUTES' },
                                    { val: timeLeft.seconds, label: 'SECONDS', highlight: true }
                                ].map((item, i) => (
                                    <div key={i} className="flex flex-col items-center">
                                        <div className={`w-20 h-24 md:w-32 md:h-40 ${item.highlight ? 'bg-primary text-white shadow-[0_0_30px_rgba(236,72,153,0.3)]' : 'bg-dark text-white border border-white/5'} rounded-2xl flex items-center justify-center text-4xl md:text-7xl font-black tabular-nums mb-2 relative overflow-hidden group`}>
                                            <span className="relative z-10">{String(item.val).padStart(2, '0')}</span>
                                            {/* Shine effect */}
                                            {item.highlight && <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>}
                                        </div>
                                        <span className="text-[10px] md:text-xs font-bold text-white/30 tracking-widest">{item.label}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Timeline */}
                    <div className="relative mb-20 px-4">
                        {/* Progress Line */}
                        <div className="absolute top-6 left-0 w-full h-1 bg-white/5 rounded-full overflow-hidden">
                            {/* Dynamic progress bar could go here based on current date */}
                            <div className="h-full bg-primary/30 w-1/3"></div>
                        </div>

                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 relative z-10">
                            <div className="text-center">
                                <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center mx-auto mb-4 ring-4 ring-dark shadow-[0_0_20px_rgba(236,72,153,0.4)]">
                                    <Calendar className="text-white" size={20} />
                                </div>
                                <h4 className="text-white font-bold text-sm mb-1">Submissions Open</h4>
                                <p className="text-white/40 text-xs font-mono uppercase">Started {formatDate(timeline.start)}</p>
                            </div>

                            <div className="text-center">
                                <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center mx-auto mb-4 ring-4 ring-dark shadow-[0_0_20px_rgba(236,72,153,0.4)]">
                                    <Share2 className="text-white" size={20} />
                                </div>
                                <h4 className="text-primary font-bold text-sm mb-1">Active Window</h4>
                                <p className="text-primary/60 text-xs font-mono uppercase">Closing {formatDate(timeline.submissionClose)}</p>
                            </div>

                            <div className="text-center opacity-50">
                                <div className="w-12 h-12 rounded-full bg-dark-lighter flex items-center justify-center mx-auto mb-4 ring-4 ring-dark border border-white/10">
                                    <Trophy className="text-white/40" size={20} />
                                </div>
                                <h4 className="text-white/60 font-bold text-sm mb-1">Ratings Live</h4>
                                <p className="text-white/20 text-xs font-mono uppercase">Starts {formatDate(timeline.ratingsStart)}</p>
                            </div>

                            <div className="text-center opacity-50">
                                <div className="w-12 h-12 rounded-full bg-dark-lighter flex items-center justify-center mx-auto mb-4 ring-4 ring-dark border border-white/10">
                                    <BarChart2 className="text-white/40" size={20} />
                                </div>
                                <h4 className="text-white/60 font-bold text-sm mb-1">Winners Announced</h4>
                                <p className="text-white/20 text-xs font-mono uppercase">On {formatDate(timeline.winnersAnnounced)}</p>
                            </div>
                        </div>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
                        <div className="bg-dark-lighter/50 border border-white/5 rounded-3xl p-8 flex flex-col items-center justify-center min-h-[160px]">
                            <h2 className="text-5xl font-black text-white mb-2">{stats.studios}</h2>
                            <p className="text-white/40 font-bold text-xs tracking-widest uppercase">Studios Joined</p>
                        </div>
                        <div className="bg-dark-lighter/50 border border-white/5 rounded-3xl p-8 flex flex-col items-center justify-center min-h-[160px]">
                            <h2 className="text-5xl font-black text-white mb-2">{stats.entries}</h2>
                            <p className="text-white/40 font-bold text-xs tracking-widest uppercase">Video Entries</p>
                        </div>
                    </div>

                    {/* CTA Section */}
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6 bg-gradient-to-r from-primary to-pink-700 rounded-3xl p-8 shadow-2xl">
                        <div className="flex items-center gap-4">
                            <div className="flex -space-x-3">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="w-10 h-10 rounded-full bg-white/20 border-2 border-primary"></div>
                                ))}
                            </div>
                            <span className="text-white/80 font-medium text-sm">+{stats.entries > 12 ? stats.entries - 3 : '12'} studios currently uploading...</span>
                        </div>

                        <div className="flex items-center gap-4 w-full md:w-auto">
                            <button onClick={handleShare} className="btn bg-white/10 text-white border-none hover:bg-white/20">
                                <Share2 size={18} className="mr-2" /> Share Challenge
                            </button>
                            <Link to={`/leaderboard/${challengeId}`} className="btn bg-white text-primary hover:bg-white/90 border-none font-bold px-8">
                                VIEW LIVE LEADERBOARD <ArrowRight size={18} className="ml-2" />
                            </Link>
                        </div>
                    </div>

                </div>
            </main>

            <Footer />
        </div>
    );
};

export default ChallengeDetails;
