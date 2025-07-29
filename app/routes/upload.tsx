import React,{type FormEvent,useState,useEffect} from 'react'
import FileUploader from "../components/FileUploader";
import Navbar from "../components/Navbar";
import {usePuterStore} from "~/lib/puter";
import {useNavigate} from "react-router";
import {convertPdfToImage} from "~/lib/pdf2img";
import { generateUUID } from '~/lib/utils';
import {prepareInstructions} from "../../constants";
import { useFirebaseStore } from '~/lib/firebaseStore';
import { DebugInfo } from '../components/DebugInfo';
import bgMain from '~/assets/images/bg-main.svg'
import resumeScan from '~/assets/images/resume-scan.gif'

const upload = () => {
    const puterStore = usePuterStore();
    const { auth, firestore } = useFirebaseStore();
    const navigate = useNavigate()
    const [isProcessing, setIsProcessing] = useState(false);
    const [statusText, setStatusText] = useState('');
    const[file,setFile]=useState<File | null>()

    // Check Firebase authentication before allowing access
    useEffect(() => {
        if (!auth.isAuthenticated) {
            navigate('/auth?next=/upload');
        }
    }, [auth.isAuthenticated, navigate]);

    // Show loading if Puter is not ready
    if (!puterStore || puterStore.isLoading) {
        return (
            <main 
                className="min-h-screen flex items-center justify-center"
                style={{ backgroundImage: `url(${bgMain})` }}
            >
                <Navbar />
                <div className="text-center">
                    <h2>Loading...</h2>
                    <img src={resumeScan} className="w-[200px] mx-auto" />
                </div>
            </main>
        );
    }

    const { fs, ai, kv } = puterStore;



    const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const form = e.currentTarget;
        if(!form) return;
        const formData = new FormData(form);

        const companyName = formData.get('company-name') as string;
        const jobTitle = formData.get('job-title') as string;
        const jobDescription = formData.get('job-description') as string;

        // Validation
        if (!companyName.trim()) {
            setStatusText('Error: Please enter a company name');
            return;
        }
        if (!jobTitle.trim()) {
            setStatusText('Error: Please enter a job title');
            return;
        }
        if (!jobDescription.trim()) {
            setStatusText('Error: Please enter a job description');
            return;
        }
        if (!file) {
            setStatusText('Error: Please upload a resume file');
            return;
        }

        handleAnalyze({ companyName, jobTitle, jobDescription, file });
    }
    const handleFileSelect : (file: File | null) => void = (file) => {
        console.log('File selected:', file ? file.name : 'null');
        setFile(file);
        if (statusText.includes('Error:')) {
            setStatusText(''); // Clear any previous errors
        }
    }
     const handleAnalyze = async ({ companyName,jobTitle,jobDescription,file}:{companyName:string,jobTitle:string,jobDescription:string,file:File}) =>  {
        // Check Firebase authentication
        if (!auth.user) {
            setStatusText('Error: Please sign in to continue');
            return;
        }

        // Check if Puter is available
        if (!fs || !ai || !kv) {
            setStatusText('Error: File system not ready. Please refresh the page.');
            return;
        }

        setIsProcessing(true);
        setStatusText('Uploading the file');
        
        try {
            // Use Puter for file upload
            const uploadedFile = await fs.upload([file])

            if (!uploadedFile) {
                setStatusText('Error: Failed to upload the file');
                setIsProcessing(false);
                return;
            }
            
            setStatusText('Converting to image...')
            const imageFile = await convertPdfToImage(file)
            if(!imageFile.file) {
                setStatusText('Error: Failed to convert the PDF to image');
                setIsProcessing(false);
                return;
            }
            
            setStatusText('Uploading the image...')
            const uploadedImage = await fs.upload([imageFile.file])
            if(!uploadedImage) {
                setStatusText('Error: Failed to upload Image');
                setIsProcessing(false);
                return;
            }
            
            setStatusText('Preparing data')
            const uuid = generateUUID();
            
            // Create resume data structure
            const resumeData: Resume = {
                id: uuid,
                resumePath: uploadedFile.path,
                imagePath: uploadedImage.path,
                companyName,
                jobTitle,
                feedback: {
                    overallScore: 0,
                    ATS: { score: 0, tips: [] },
                    toneAndStyle: { score: 0, tips: [] },
                    content: { score: 0, tips: [] },
                    structure: { score: 0, tips: [] },
                    skills: { score: 0, tips: [] }
                }
            }

            // Save initial data to Firebase (with user association)
            await firestore.saveResume(resumeData);
            
            // Also save to Puter KV for backwards compatibility
            await kv.set(`resume:${uuid}`, JSON.stringify(resumeData))
            
            setStatusText('Analyzing with AI...')

            // Use Puter AI for analysis
            const feedback = await ai.feedback(
                uploadedFile.path,
                prepareInstructions({jobTitle, jobDescription})
            )
            
            if (!feedback) {
                setStatusText('Error: Failed to get feedback');
                setIsProcessing(false);
                return;
            }
            
            const feedbackText = typeof feedback.message.content === 'string'
                ? feedback.message.content : feedback.message.content[0].text;    
            
            // Update resume data with AI feedback
            resumeData.feedback = JSON.parse(feedbackText);
            
            // Save updated data to both Firebase and Puter
            await firestore.saveResume(resumeData);
            await kv.set(`resume:${uuid}`, JSON.stringify(resumeData))
            
            setStatusText('Analysis complete, redirecting');
            console.log(resumeData);
            navigate(`/resume/${uuid}`);

        } catch (error) {
            console.error('Analysis error:', error);
            setStatusText(`Error: ${error instanceof Error ? error.message : 'Analysis failed'}`);
            setIsProcessing(false);
        }
    }
    return (
    <main style={{ backgroundImage: `url(${bgMain})` }}>
        <Navbar />
        
        <section className='main-section'>
            <div className='page-heading py-16'>
                <h1>Smart feedback for your dream job</h1>
                {isProcessing ? (
                    <>
                    <h2>{statusText}</h2>
                    <img src={resumeScan} className='w-full' />                    
                    </>
                ):(
                    <>
                    <h2>Drop your resume for ATS score and Improvement tips</h2>
                    {statusText && statusText.includes('Error:') && (
                        <div className="mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
                            {statusText}
                        </div>
                    )}
                    </>
                )}

                {!isProcessing && (
                    <form id="upload-form" onSubmit={handleSubmit} className='flex flex-col gap-4 mt-8'>
                        <div className='form-div '>
                            <label htmlFor='company-name'>Company Name</label>
                            <input type='text' name='company-name' placeholder='Company Name' id='company-name'></input>
                        </div>
                        <div className='form-div '>
                            <label htmlFor='job-title'>Job Title</label>
                            <input type='text' name='job-title' placeholder='Job Title' id='job-title'></input>
                        </div>
                        <div className='form-div '>
                            <label htmlFor='job-description'>Job Description</label>
                            <textarea rows={5} name='job-description' placeholder='Job Description' id='job-description'></textarea>
                        </div>
                        <div className='form-div '>
                            <label htmlFor='uploader'>Upload Resume</label>
                            <FileUploader onFileSelect={handleFileSelect} />
                            {file && (
                                <p className="mt-2 text-sm text-green-600">
                                    ✅ File selected: {file.name}
                                </p>
                            )}
                        </div>

                        <button className='primary-button' type='submit'>Analyze Resume</button>
                    </form>
                )}
            </div>
        </ section>
    </main>
    )
    }

export default upload