import React, { useState } from 'react';
import { supabaseClient } from '../lib/supabase';
import { SpinnerIcon } from './icons';

interface LoginProps {
    onLoginSuccess: (userId: string) => void;
}

const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
    const [isSignUp, setIsSignUp] = useState(false);
    const [name, setName] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        const trimmedPhone = phoneNumber.trim();
        const trimmedName = name.trim();

        if (!trimmedPhone) {
            setError('Phone number cannot be empty.');
            return;
        }

        if (isSignUp && !trimmedName) {
            setError('Name cannot be empty.');
            return;
        }
        
        setError(null);
        setLoading(true);

        try {
            if (isSignUp) {
                // Sign Up Logic
                const { data: existingUser, error: checkError } = await supabaseClient
                    .from('users')
                    .select('id')
                    .eq('phone_number', trimmedPhone)
                    .maybeSingle();
                
                if (checkError) throw checkError;

                if (existingUser) {
                    throw new Error("This phone number is already registered. Please sign in.");
                }

                const avatar = `https://api.dicebear.com/8.x/initials/svg?seed=${encodeURIComponent(trimmedName)}`;

                const { data: newUser, error: insertError } = await supabaseClient
                    .from('users')
                    .insert({
                        name: trimmedName,
                        phone_number: trimmedPhone,
                        avatar: avatar,
                    })
                    .select('id')
                    .single();
                
                if (insertError) throw insertError;
                
                onLoginSuccess(newUser.id);

            } else {
                // Sign In Logic
                const { data, error: queryError } = await supabaseClient
                    .from('users')
                    .select('id')
                    .eq('phone_number', trimmedPhone)
                    .single();
                
                if (queryError || !data) {
                    throw new Error("Phone number not found. Please check the number or sign up.");
                }
                
                onLoginSuccess(data.id);
            }
        } catch (err: any) {
            setError(err.message || 'An unknown error occurred.');
        } finally {
            setLoading(false);
        }
    };

    const toggleFormMode = () => {
        setIsSignUp(!isSignUp);
        setError(null);
        setName('');
        setPhoneNumber('');
    };

    return (
        <div className="flex items-center justify-center h-screen bg-slate-100">
            <div className="w-full max-w-sm p-8 space-y-8 bg-white rounded-lg shadow-md">
                <div>
                    <h2 className="text-3xl font-extrabold text-center text-slate-900">
                        {isSignUp ? 'Create your account' : 'Sign in to your account'}
                    </h2>
                    <p className="mt-2 text-center text-sm text-slate-600">
                        {isSignUp ? 'And start chatting!' : 'Use a phone number from the database, e.g., +1111111111'}
                    </p>
                </div>
                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <div className="rounded-md shadow-sm space-y-4">
                        {isSignUp && (
                            <div>
                                <label htmlFor="name" className="sr-only">
                                    Full Name
                                </label>
                                <input
                                    id="name"
                                    name="name"
                                    type="text"
                                    autoComplete="name"
                                    required
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="relative block w-full px-3 py-3 text-lg border border-slate-300 placeholder-slate-500 text-slate-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10"
                                    placeholder="Full Name"
                                />
                            </div>
                        )}
                        <div>
                            <label htmlFor="phone-number" className="sr-only">
                                Phone number
                            </label>
                            <input
                                id="phone-number"
                                name="phone"
                                type="tel"
                                autoComplete="tel"
                                required
                                value={phoneNumber}
                                onChange={(e) => setPhoneNumber(e.target.value)}
                                className="relative block w-full px-3 py-3 text-lg border border-slate-300 placeholder-slate-500 text-slate-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10"
                                placeholder="Phone number"
                            />
                        </div>
                    </div>

                    {error && (
                        <p className="text-sm text-red-600 text-center">{error}</p>
                    )}

                    <div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="group relative flex justify-center w-full px-4 py-3 text-lg font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-slate-400"
                        >
                            {loading && <SpinnerIcon className="w-6 h-6 mr-3 animate-spin" />}
                            {loading ? 'Processing...' : (isSignUp ? 'Sign Up' : 'Sign In')}
                        </button>
                    </div>
                </form>
                <div className="text-sm text-center">
                    <button onClick={toggleFormMode} className="font-medium text-blue-600 hover:text-blue-500">
                        {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Login;
