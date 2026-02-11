import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Play, Home, Trophy, BarChart2, User } from 'lucide-react';
import { useUser } from '@clerk/clerk-react';

const Navbar = () => {
  const { isSignedIn, user } = useUser();
  const location = useLocation();

  const isActive = (path) => location.pathname === path ? 'text-primary' : 'text-white/40';

  return (
    <>
      {/* Desktop Top Navbar */}
      <nav className="absolute top-0 left-0 w-full z-50 py-6 bg-gradient-to-b from-black/80 to-transparent">
        <div className="container flex justify-between items-center relative">
          {/* Left: Logo */}
          <Link to="/" className="flex items-center gap-2 font-bold text-xl text-white z-20">
            <Play fill="#ec4899" color="#ec4899" size={24} style={{ transform: 'rotate(-10deg)' }} />
            <span className="tracking-tighter">ShowGrid</span>
          </Link>

          {/* Center: Navigation Links (Desktop Only) */}
          <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 gap-8 z-10">
            <Link to="/discovered" className="text-white/70 hover:text-white text-sm font-semibold tracking-wider transition-colors">DISCOVER</Link>
            <Link to="/challenges" className="text-white/70 hover:text-white text-sm font-semibold tracking-wider transition-colors">CHALLENGES</Link>
            <Link to="/leaderboard" className="text-white/70 hover:text-white text-sm font-semibold tracking-wider transition-colors">LEADERBOARD</Link>
          </div>

          {/* Right: Auth / Profile (Desktop Only) */}
          <div className="hidden md:block z-20">
            {isSignedIn ? (
              <Link to="/profile" className="flex items-center gap-3 pl-1 pr-4 py-1.5 bg-white/10 hover:bg-white/20 border border-white/10 rounded-full transition-all">
                <img src={user.imageUrl} alt="Profile" className="w-8 h-8 rounded-full" />
                <span className="text-sm font-bold">My Profile</span>
              </Link>
            ) : (
              <Link to="/sign-in" className="btn btn-primary text-sm px-6 py-2">
                Sign In
              </Link>
            )}
          </div>

          {/* Mobile Top Right Auth (if needed, otherwise logo is enough) */}
          <div className="md:hidden">
            {/* Optional: Add small profile circle here if desired, otherwise keeping clean as requested */}
          </div>
        </div>
      </nav>

      {/* Mobile Bottom Navigation Bar */}
      <div className="md:hidden fixed bottom-0 left-0 w-full bg-[#111] border-t border-white/10 pb-safe pt-2 z-50 px-6">
        <div className="flex justify-between items-center h-16">
          <Link to="/discovered" className={`flex flex-col items-center gap-1 ${isActive('/discovered')}`}>
            <Home size={24} />
            <span className="text-[10px] font-bold">Feed</span>
          </Link>
          <Link to="/challenges" className={`flex flex-col items-center gap-1 ${isActive('/challenges')}`}>
            <Trophy size={24} />
            <span className="text-[10px] font-bold">Battles</span>
          </Link>
          <Link to="/leaderboard" className={`flex flex-col items-center gap-1 ${isActive('/leaderboard')}`}>
            <BarChart2 size={24} />
            <span className="text-[10px] font-bold">Rank</span>
          </Link>
          <Link to="/profile" className={`flex flex-col items-center gap-1 ${isActive('/profile')}`}>
            {isSignedIn ? (
              <img src={user?.imageUrl} alt="Me" className="w-6 h-6 rounded-full border border-white/20" />
            ) : (
              <User size={24} />
            )}
            <span className="text-[10px] font-bold">Profile</span>
          </Link>
        </div>
      </div>
    </>
  );
};

export default Navbar;
