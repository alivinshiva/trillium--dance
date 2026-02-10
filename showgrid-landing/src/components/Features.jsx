import React from 'react';
import { Music, Star, Trophy } from 'lucide-react';

const Features = () => {
  return (
    <section className="py-24 bg-dark-lighter">
      <div className="container">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-extrabold mb-2">Why Join ShowGrid?</h2>
          <p className="text-primary text-sm font-bold tracking-wider uppercase">INDIA'S PREMIER DIGITAL STAGE FOR DANCE EXCELLENCE</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white/5 border border-white/5 p-10 rounded-3xl transition-transform hover:-translate-y-1 hover:bg-white/10">
            <div className="w-12 h-12 rounded-full flex items-center justify-center mb-6 bg-primary/20 text-primary">
              <Music size={24} />
            </div>
            <h3 className="text-xl font-bold mb-3">Single Track Challenge</h3>
            <p className="text-white/60 leading-relaxed text-sm">Every studio performs to the same curated track, leveling the playing field for pure creativity.</p>
          </div>

          <div className="bg-white/5 border border-white/5 p-10 rounded-3xl transition-transform hover:-translate-y-1 hover:bg-white/10">
            <div className="w-12 h-12 rounded-full flex items-center justify-center mb-6 bg-primary/20 text-primary">
              <Star size={24} fill="currentColor" />
            </div>
            <h3 className="text-xl font-bold mb-3">Community Voting</h3>
            <p className="text-white/60 leading-relaxed text-sm">Real fans and peers decide who owned the track. Transparent, community-driven rankings.</p>
          </div>

          <div className="bg-white/5 border border-white/5 p-10 rounded-3xl transition-transform hover:-translate-y-1 hover:bg-white/10">
            <div className="w-12 h-12 rounded-full flex items-center justify-center mb-6 bg-primary/20 text-primary">
              <Trophy size={24} />
            </div>
            <h3 className="text-xl font-bold mb-3">Studio Rankings</h3>
            <p className="text-white/60 leading-relaxed text-sm">Climb the leaderboard and become the top-rated studio in the country. Win national recognition.</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Features;
