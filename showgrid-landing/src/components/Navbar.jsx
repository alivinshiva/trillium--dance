
import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Play, Home, Trophy, BarChart2, User, Zap, Bell } from 'lucide-react';
import { useUser } from '@clerk/clerk-react';
import { useNotification } from '../context/NotificationContext';

const Navbar = () => {
  const { isSignedIn, user } = useUser();
  const { unreadCount, togglePanel } = useNotification();
  const location = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isActive = (path) => location.pathname === path ? 'text-primary' : 'text-white/40';
  const isProfilePage = location.pathname === '/profile';

  // Hide Top Navbar on desktop for sidebar pages, but KEEP IT for mobile
  // The logic below: 'md:hidden' hides this entire nav on desktop if strictly a sidebar page
  // But we want a different structure for mobile vs desktop within the nav?
  // Actually, the user wants a specific MOBILE layout. 
  // I will split the render:
  // 1. Desktop Nav (Hidden on sidebar pages)
  // 2. Mobile Top Nav (Always visible, adapts content)

  const isSidebarPage = ['/profile', '/dashboard'].includes(location.pathname);

  return (
    <>
      {/* Top Navbar */}
      <nav
        className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${isScrolled
          ? 'py-2 bg-black/90 backdrop-blur-md border-b border-white/10'
          : 'py-3 bg-gradient-to-b from-black/30 to-transparent'
          } ${isSidebarPage ? 'md:hidden' : ''}`}
      >
        <div className="container mx-auto px-4 max-w-7xl">

          {/* Desktop View */}
          <div className="hidden md:flex justify-between items-center relative">
            <Link to="/" className="flex items-center gap-2 font-bold text-xl text-white z-20">
              <Play fill="#ec4899" color="#ec4899" size={24} style={{ transform: 'rotate(-10deg)' }} />
              <span className="tracking-tighter">ShowGrid</span>
            </Link>

            <div className="absolute left-1/2 -translate-x-1/2 gap-8 flex z-10">
              <Link to="/discovered" className="text-white/70 hover:text-white text-sm font-semibold tracking-wider transition-colors">DISCOVER</Link>
              <Link to="/challenges" className="text-white/70 hover:text-white text-sm font-semibold tracking-wider transition-colors">CHALLENGES</Link>
              <Link to="/leaderboard" className="text-white/70 hover:text-white text-sm font-semibold tracking-wider transition-colors">LEADERBOARD</Link>
            </div>

            <div className="block z-20">
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
          </div>

          {/* Mobile View */}
          <div className="md:hidden grid grid-cols-3 items-center w-full">
            {/* Left: Notification or UserID */}
            <div className="justify-self-start">
              {isSignedIn && isProfilePage ? (
                <div className="text-xs font-bold text-white/90 truncate max-w-[100px]">
                  @{user.username || user.firstName || 'User'}
                </div>
              ) : (
                <button
                  onClick={togglePanel}
                  className="text-white/80 hover:text-white p-1 -ml-1 relative"
                >
                  <Bell size={18} />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border border-black flex items-center justify-center text-[8px] font-bold text-white">
                      {unreadCount}
                    </span>
                  )}
                </button>
              )}
            </div>

            {/* Center: Title Only (Video Clear View) */}
            <div className="justify-self-center pointer-events-none opacity-80 mix-blend-difference">
              {/* Using mix-blend to ensure visibility over any video without heavy tint? Or just standard text. 
                        User wants "remove tint". I'll just use standard text with light shadow.
                     */}
              <Link to="/" className="font-bold text-base text-white tracking-tighter pointer-events-auto">
                ShowGrid
              </Link>
            </div>

            {/* Right: Dashboard or Sign In */}
            <div className="justify-self-end">
              {isSignedIn ? (
                <Link to="/dashboard" className="text-white/80 hover:text-white flex items-center justify-center p-1 -mr-1">
                  <Zap size={18} className={location.pathname === '/dashboard' ? 'text-primary fill-primary' : ''} />
                </Link>
              ) : (
                <Link to="/sign-in" className="text-[10px] font-bold text-primary border border-primary/50 px-2 py-1 rounded-full">
                  Login
                </Link>
              )}
            </div>
          </div>

        </div>
      </nav>

      {/* Mobile Bottom Navigation Bar */}
      <div className="md:hidden fixed bottom-0 left-0 w-full bg-[#111] border-t border-white/10 pb-safe pt-1 z-50">
        <div className="flex justify-around items-center h-12 w-full px-2 max-w-md mx-auto">
          <Link to="/discovered" className={`flex flex-col items-center justify-center gap-0.5 w-14 h-full ${isActive('/discovered')}`}>
            <Home size={18} />
            <span className="text-[9px] font-bold">Feed</span>
          </Link>
          <Link to="/challenges" className={`flex flex-col items-center justify-center gap-0.5 w-14 h-full ${isActive('/challenges')}`}>
            <Trophy size={18} />
            <span className="text-[9px] font-bold">Battles</span>
          </Link>
          <Link to="/leaderboard" className={`flex flex-col items-center justify-center gap-0.5 w-14 h-full ${isActive('/leaderboard')}`}>
            <BarChart2 size={18} />
            <span className="text-[9px] font-bold">Rank</span>
          </Link>
          <Link to="/profile" className={`flex flex-col items-center justify-center gap-0.5 w-14 h-full ${isActive('/profile')}`}>
            {isSignedIn ? (
              <img src={user?.imageUrl} alt="Me" className="w-4 h-4 rounded-full border border-white/20 object-cover" />
            ) : (
              <User size={18} />
            )}
            <span className="text-[9px] font-bold">Profile</span>
          </Link>
        </div>
      </div>
    </>
  );
};

export default Navbar;
