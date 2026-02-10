import React from 'react';
import { SignIn } from '@clerk/clerk-react';

const SignInPage = () => {
    return (
        <div className="flex justify-center items-center min-h-screen bg-dark-lighter bg-[radial-gradient(circle_at_center,#1a0b14_0%,#000000_100%)]">
            <div className="animate-fade-in">
                <SignIn path="/sign-in" routing="path" signUpUrl="/sign-up" forceRedirectUrl="/discovered" />
            </div>
        </div>
    );
};

export default SignInPage;
