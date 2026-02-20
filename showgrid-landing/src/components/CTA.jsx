import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { useVideo } from '../context/VideoContext';
import FeaturedChallenge from './FeaturedChallenge';

const CTA = () => {
    const { isSignedIn } = useUser();
    const { challenges } = useVideo();
    const [featuredChallenge, setFeaturedChallenge] = useState(null);

    useEffect(() => {
        if (challenges && challenges.length > 0) {
            const active = challenges.find(c => new Date(c.endDate) > new Date());
            setFeaturedChallenge(active || challenges[0]);
        }
    }, [challenges]);

    return (
        <section className="py-24 bg-dark text-center relative overflow-hidden">
            <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,rgba(236,72,153,0.15),transparent_70%)]"></div>
            <div className="container relative z-10 w-full mx-auto px-4">

                {featuredChallenge && (
                    <div className="mb-20">
                        <FeaturedChallenge challenge={featuredChallenge} />
                        <div className="mt-8">
                            <Link to={`/challenges/${featuredChallenge._id}/details`} className="text-primary hover:text-white text-sm font-bold tracking-widest uppercase border-b border-primary hover:border-white transition-colors pb-1">
                                View Full Challenge Details
                            </Link>
                        </div>
                    </div>
                )}

                <div className="max-w-2xl mx-auto">
                    <h2 className="text-5xl font-extrabold mb-4">Ready to take the stage?</h2>
                    <p className="text-lg text-white/70 mb-10">
                        Join hundreds of studios across India competing for the top spot.<br />
                        Your performance, your rules, one track.
                    </p>
                    <Link to={isSignedIn ? "/challenges" : "/sign-up"} className="btn btn-primary text-lg px-8 py-3 inline-block">
                        Get Started Now
                    </Link>
                </div>
            </div>
        </section>
    );
};

export default CTA;
