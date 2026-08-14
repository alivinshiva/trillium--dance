import React, { useState } from 'react';
import { useUser, useClerk } from '@clerk/clerk-react';
import { useVideo } from '../context/VideoContext';
import { Zap, Check } from 'lucide-react';

const SubChallengeCard = ({ subChallenge, onVoted }) => {
    const { user } = useUser();
    const { openSignIn } = useClerk();
    const { voteSubChallenge } = useVideo();

    const [voteState, setVoteState] = useState(null); // { choice, votesA, votesB, alreadyVoted }
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const sc = subChallenge;
    if (!sc || !sc.videoAId || !sc.videoBId) {
        return <div className="w-full h-full flex items-center justify-center text-white/40 text-xs">Battle unavailable</div>;
    }

    const a = sc.videoAId;
    const b = sc.videoBId;

    const handleVote = async (choice) => {
        if (!user) return openSignIn();
        if (voteState || loading) return;
        setLoading(true);
        setError(null);
        try {
            const result = await voteSubChallenge(sc._id, choice);
            setVoteState({ choice, votesA: result.votesA, votesB: result.votesB, alreadyVoted: result.alreadyVoted });
            if (onVoted) onVoted(result);
        } catch (e) {
            setError('Vote failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const Option = ({ video, side }) => {
        const isChosen = voteState && voteState.choice === side;
        return (
            <div
                className={`relative w-full h-1/2 overflow-hidden cursor-pointer transition-opacity ${isChosen ? 'opacity-90' : 'hover:opacity-90'}`}
                onClick={() => handleVote(side)}
            >
                <video
                    src={video.videoUrl}
                    className="w-full h-full object-cover"
                    autoPlay muted loop playsInline
                />
                <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/80 to-transparent">
                    <p className="text-sm font-bold text-white">@{video.userName || 'Studio'}</p>
                    {video.studioName && <p className="text-[10px] text-white/60">{video.studioName}</p>}
                </div>
                <div className="absolute top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-black/60 text-white text-[10px] font-extrabold px-3 py-1 rounded-full border border-white/20">
                        {side} · {voteState ? (side === 'A' ? voteState.votesA : voteState.votesB) : 0} votes
                    </span>
                </div>
                {isChosen && (
                    <div className="absolute inset-0 bg-primary/30 flex items-center justify-center pointer-events-none">
                        <span className="bg-white text-black text-xs font-extrabold px-3 py-1.5 rounded-full flex items-center gap-1">
                            <Check size={12} /> Voted
                        </span>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="relative w-full h-full bg-black flex flex-col">
            <div className="flex-none px-3 pt-4 pb-2 text-center">
                <p className="text-[10px] font-extrabold text-white/60 uppercase tracking-widest flex items-center justify-center gap-1">
                    <Zap size={12} className="text-primary" /> {sc.type} battle
                </p>
                <p className="text-xs font-bold text-white mt-1">Which hook is stronger?</p>
            </div>
            <div className="flex-1 flex flex-col min-h-0">
                <Option video={a} side="A" />
                <div className="flex-none h-8 z-20 flex items-center justify-center bg-black">
                    <span className="bg-white/10 text-white text-[10px] font-extrabold px-4 py-1 rounded-full border border-white/20">VS</span>
                </div>
                <Option video={b} side="B" />
            </div>
            {error && (
                <div className="absolute bottom-16 inset-x-0 text-center text-[10px] text-red-400">{error}</div>
            )}
        </div>
    );
};

export default SubChallengeCard;
