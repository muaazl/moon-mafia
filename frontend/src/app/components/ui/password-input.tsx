'use client';
import { Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';

const PasswordInput = ({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) => {
    const [isVisible, setIsVisible] = useState(false);

    return (
        <div className='w-full'>
            <div className='relative mt-1'>
                <input
                    type={isVisible ? 'text' : 'password'}
                    id='pass'
                    {...props}
                    className={`bg-background w-full outline-none focus-within:border-blue-700 focus-within:ring-2 focus-within:ring-blue-700/20 rounded-md p-2 border border-input text-foreground h-10 px-3 py-2 text-sm shadow-sm transition-colors ${className || ''}`}
                />
                <div
                    className='absolute top-2.5 right-3 text-2xl text-gray-500 cursor-pointer'
                    onClick={() => setIsVisible((prev) => !prev)}
                >
                    {isVisible ? <Eye size={20} /> : <EyeOff size={20} />}
                </div>
            </div>
        </div>
    );
};

export default PasswordInput;
