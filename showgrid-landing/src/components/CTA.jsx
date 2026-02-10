import React from 'react';

const CTA = () => {
    return (
        <section className="py-24 bg-dark text-center relative overflow-hidden">
            <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,rgba(236,72,153,0.15),transparent_70%)]"></div>
            <div className="container relative z-10 w-full max-w-3xl mx-auto">
                <div className="max-w-2xl mx-auto">
                    <h2 className="text-5xl font-extrabold mb-4">Ready to take the stage?</h2>
                    <p className="text-lg text-white/70 mb-10">
                        Join hundreds of studios across India competing for the top spot.<br />
                        Your performance, your rules, one track.
                    </p>
                    <button className="btn btn-primary text-lg px-8 py-3">
                        Get Started Now
                    </button>
                </div>
            </div>
        </section>
    );
};

export default CTA;
