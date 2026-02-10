import React from 'react';
import { Play, Twitter, Instagram, Globe } from 'lucide-react';

const Footer = () => {
    return (
        <footer className="py-12 bg-[#050505] border-t border-white/5 text-sm">
            <div className="container">
                <div className="flex flex-col md:flex-row items-center justify-between gap-8 mb-12">
                    <div className="flex items-center gap-2 font-bold text-lg">
                        <Play fill="#ec4899" color="#ec4899" size={20} style={{ transform: 'rotate(-10deg)' }} />
                        <span className="tracking-tighter">ShowGrid</span>
                    </div>

                    <div className="flex flex-wrap justify-center gap-8">
                        <a href="#" className="text-white/60 hover:text-white transition-colors no-underline">Terms of Service</a>
                        <a href="#" className="text-white/60 hover:text-white transition-colors no-underline">Privacy Policy</a>
                        <a href="#" className="text-white/60 hover:text-white transition-colors no-underline">Contact Us</a>
                        <a href="#" className="text-white/60 hover:text-white transition-colors no-underline">Studio Kit</a>
                    </div>

                    <div className="flex gap-6">
                        <a href="#" aria-label="Twitter" className="text-white/60 hover:text-white transition-colors"><Twitter size={18} /></a>
                        <a href="#" aria-label="Instagram" className="text-white/60 hover:text-white transition-colors"><Instagram size={18} /></a>
                        <a href="#" aria-label="Website" className="text-white/60 hover:text-white transition-colors"><Globe size={18} /></a>
                    </div>
                </div>

                <div className="text-center text-white/30 text-xs tracking-wider uppercase">
                    <p>© 2024 ShowGrid India. All rights reserved. Crafted for the creators of tomorrow.</p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
