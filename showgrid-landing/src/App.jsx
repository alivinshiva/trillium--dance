import React from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { SignedIn, SignedOut, RedirectToSignIn } from "@clerk/clerk-react";
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Features from './components/Features';
import CTA from './components/CTA';
import Footer from './components/Footer';
import SignInPage from './components/SignInPage';
import SignUpPage from './components/SignUpPage';
import UploadStep1 from './components/upload/UploadStep1';
import UploadStep2 from './components/upload/UploadStep2';
import UploadStep3 from './components/upload/UploadStep3';
import UploadFinal from './components/upload/UploadFinal';
import Discovered from './components/Discovered';
import Challenges from './components/Challenges';
import Leaderboard from './components/Leaderboard';
import Profile from './components/Profile';
import Dashboard from './components/Dashboard';

const LandingPage = () => {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <Features />
        <CTA />
      </main>
      <Footer />
    </>
  );
};

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/sign-in/*" element={<SignInPage />} />
      <Route path="/sign-up/*" element={<SignUpPage />} />
      {/* Upload Flow */}
      <Route path="/challenges/:challengeId/upload" element={<UploadStep1 />} />
      <Route
        path="/challenges/:challengeId/upload/step-2"
        element={
          <>
            <SignedIn>
              <UploadStep2 />
            </SignedIn>
            <SignedOut>
              <RedirectToSignIn />
            </SignedOut>
          </>
        }
      />
      <Route
        path="/challenges/:challengeId/upload/step-3"
        element={
          <>
            <SignedIn>
              <UploadStep3 />
            </SignedIn>
            <SignedOut>
              <RedirectToSignIn />
            </SignedOut>
          </>
        }
      />
      <Route
        path="/challenges/:challengeId/upload/step-4"
        element={
          <>
            <SignedIn>
              <UploadFinal />
            </SignedIn>
            <SignedOut>
              <RedirectToSignIn />
            </SignedOut>
          </>
        }
      />
      <Route path="/challenges" element={<Challenges />} />
      <Route path="/leaderboard" element={<Leaderboard />} />
      {/* Discovered Page - Protected */}
      <Route
        path="/discovered"
        element={
          <>
            <SignedIn>
              <Discovered />
            </SignedIn>
            <SignedOut>
              <RedirectToSignIn />
            </SignedOut>
          </>
        }
      />
      <Route
        path="/discovered/feed/:initialVideoId"
        element={
          <>
            <SignedIn>
              <Discovered />
            </SignedIn>
            <SignedOut>
              <RedirectToSignIn />
            </SignedOut>
          </>
        }
      />
      <Route
        path="/profile"
        element={
          <>
            <SignedIn>
              <Profile />
            </SignedIn>
            <SignedOut>
              <RedirectToSignIn />
            </SignedOut>
          </>
        }
      />
      <Route
        path="/dashboard"
        element={
          <>
            <SignedIn>
              <Dashboard />
            </SignedIn>
            <SignedOut>
              <RedirectToSignIn />
            </SignedOut>
          </>
        }
      />
    </Routes>
  );
}

export default App;
