import React,{useEffect} from 'react'
import { useFirebaseStore } from '~/lib/firebaseStore'
import {useLocation, useNavigate} from 'react-router'
import Navbar from '~/components/Navbar'
import { AuthTest } from '~/components/AuthTest'


export const meta = () => ([
{   title : 'Resumecheck | Auth'},
    {name:'description',content:'Log into your account'}
]
    
)
const auth = () => {
    const location = useLocation();
    const next = location.search.split('next=')[1] || '/';
    const navigate = useNavigate();
    const { isLoading, auth, error, clearError } = useFirebaseStore();
    
    useEffect(() => {
        if(auth.isAuthenticated) {
            navigate(next);
        }
    }, [auth.isAuthenticated, next, navigate]);

    const handleSignIn = async () => {
        try {
            clearError();
            await auth.signIn();
        } catch (error) {
            console.error('Sign in error:', error);
        }
    };

    const handleSignOut = async () => {
        try {
            clearError();
            await auth.signOut();
        } catch (error) {
            console.error('Sign out error:', error);
        }
    };
  return (
   <main className="bg-[url('/images/bg-auth.svg')] bg-cover min-h-screen flex items-center justify-center">
    <Navbar />
      <div className='gradient-border shadow-lg'>
        <section className='flex flex-col gap-8 bg-white rounded-2xl p-10'>
            <div className='flex flex-col items-center gap-2 text-center'>
                <h1>Welcome</h1>
                <h2>Sign in with Google to continue your job journey</h2>
            </div>
            <div>
                {error && (
                    <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                        {error}
                    </div>
                )}
                {isLoading ? (
                      <button className='auth-button animate-pulse' disabled>
                        <p>Signing you in...</p>
                      </button>
                ):(
                    <>
                    {auth.isAuthenticated ? (
                        <button className='auth-button' onClick={handleSignOut}>
                          <p>Sign Out</p>  
                        </button>
                    ):(
                        <button className='auth-button' onClick={handleSignIn}>
                            <p>Sign in with Google</p>
                        </button>
                    )}
                    </>
                )}
                
                
            </div>
        </section>
      </div>
      
      {/* Debug component - remove in production */}
      <div className="fixed bottom-4 right-4">
        <AuthTest />
      </div>
   </main>
  )
}

export default auth