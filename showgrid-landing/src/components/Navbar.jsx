import React from 'react';
import { Link } from 'react-router-dom';
import { Play } from 'lucide-react';

const Navbar = () => {
  return (
    <nav className="absolute top-0 left-0 w-full z-50 py-6 bg-gradient-to-b from-black/80 to-transparent">
      <div className="container flex justify-between items-center">
        <div className="flex items-center gap-2 font-bold text-xl text-white">
          <Play fill="#ec4899" color="#ec4899" size={24} style={{ transform: 'rotate(-10deg)' }} />
          <span className="tracking-tighter">ShowGrid</span>
        </div>

        <div className="hidden md:flex gap-8">
          <Link to="/challenges" className="text-white/70 hover:text-white text-sm font-semibold tracking-wider transition-colors">CHALLENGES</Link>
          <a href="#leaderboard" className="text-white/70 hover:text-white text-sm font-semibold tracking-wider transition-colors">LEADERBOARD</a>
          <a href="#studios" className="text-white/70 hover:text-white text-sm font-semibold tracking-wider transition-colors">STUDIOS</a>
        </div>

        <Link to="/sign-in" className="btn btn-primary text-sm px-6 py-2">
          Sign In
        </Link>
      </div>
    </nav>
  );
};

export default Navbar;
