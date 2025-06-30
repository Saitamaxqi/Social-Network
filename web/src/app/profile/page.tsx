'use client'
import { EditProfilePage } from '@/components/EditProfile/EditProfile';
import MainLayout from '@/components/Layout/MainLayout';
import { useEffect, useState } from 'react';

export default function EditProfile() {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    // Add a loading state to ensure the component renders properly
    useEffect(() => {
        // This is just to ensure the component has mounted properly
        setLoading(false);
    }, []);
    
    if (loading) return (
        <MainLayout>
            <div className="flex justify-center items-center h-screen">
                <p className="text-lg">Loading profile editor...</p>
            </div>
        </MainLayout>
    );
    
    if (error) return (
        <MainLayout>
            <div className="flex justify-center items-center h-screen">
                <p className="text-lg text-red-500">{error}</p>
            </div>
        </MainLayout>
    );
    
    return (
        <MainLayout>
            <div className="container mx-auto py-8">
                <EditProfilePage />
            </div>
        </MainLayout>
    );
}
