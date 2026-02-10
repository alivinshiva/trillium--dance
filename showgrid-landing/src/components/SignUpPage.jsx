import React from 'react';
import { SignUp } from '@clerk/clerk-react';

const SignUpPage = () => {
    return (
        <div className="flex justify-center items-center min-h-screen bg-dark-lighter bg-[radial-gradient(circle_at_center,#1a0b14_0%,#000000_100%)]">
            <div className="animate-fade-in">
                <SignUp path="/sign-up" routing="path" signInUrl="/sign-in" forceRedirectUrl="/discovered" />
            </div>
        </div>
    );
};

export default SignUpPage;
