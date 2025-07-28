import React,{useEffect} from 'react'
import { usePuterStore } from '~/lib/puter'
import {useLocation, useNavigate} from 'react-router'
import Navbar from '~/components/Navbar'


export const meta = () => ([
{   title : 'Resumecheck | Auth'},
    {name:'description',content:'Log into your account'}
]
    
)
const auth = () => {
    const location = useLocation();
    const next =location.search.split('next=')[1];
    const navigate = useNavigate();
    const {isLoading , auth, } = usePuterStore();
    useEffect(() =>{
        if(auth.isAuthenticated) navigate(next)
    },[auth.isAuthenticated,next])
  return (
   <main className="bg-[url('/images/bg-auth.svg)] bg-cover min-h-screen flex items-center justify-center">
    <Navbar />
      <div className='gradient-border shadow-lg'>
        <section className='flex flex-col gap-8 bg-white rounded-2xl p-10'>
            <div className='flex flex-col items-center gap-2 text-center'>
                <h1>Welcome</h1>
                <h2>Log in to continue your job journey</h2>
            </div>
            <div>
                {isLoading ? (
                      <button className='auth-button animate-pulse'>
                        <p>Signing in you ....</p>
                      </button>
                ):(
                    <>
                    {auth.isAuthenticated ? (
                        <button className='auth-button' onClick={auth.signOut}>
                          <p>LogOut</p>  
                        </button>
                    ):(
                        <button className='auth-button' onClick={auth.signIn}>
                            <p>LogIn</p>
                        </button>
                    )}
                    </>
                )}
            </div>
        </section>

      </div>
   </main>
  )
}

export default auth