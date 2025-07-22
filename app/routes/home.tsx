import Navbar from "~/components/Navbar";
import React,{useEffect} from 'react'
import { usePuterStore } from '~/lib/puter'
import {useLocation, useNavigate} from 'react-router'
import type { Route } from "./+types/home";
import {resumes} from "../../constants";
import ResumeCard from "../components/ResumeCard";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Resumecheck" },
    { name: "description", content: "Smart Feedback towards your dream" },
  ];
}

export default function Home() {
 
   
    const navigate = useNavigate();
    const {auth } = usePuterStore();
    useEffect(() =>{
        if(!auth.isAuthenticated) navigate('/auth?next=/')
    },[auth.isAuthenticated])

  return <main className="bg-[url('/images/bg-main.svg')]">
    <Navbar />
    <section className='main-section'>
      <div className="page-heading"></div>
      <h1>Track your Application and Resume ratings</h1>
      <h2>Review your submission and check AI Powered Feedback</h2>
    </section>

    {resumes.length > 0 && (
      <div className="resumes-section">
       {resumes.map((resume)=>(
      <ResumeCard key={resume.id} resume={resume} />
    ))}
    </div>
    )}
    

   
    </main>
}
