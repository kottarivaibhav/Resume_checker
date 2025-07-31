import {Link} from "react-router";
import ScoreCircle from "~/components/ScoreCircle";
import {useEffect, useState} from "react";
import {usePuterStore} from "~/lib/puter";

const ResumeCard = ({ resume: { id, companyName, jobTitle, feedback, imagePath } }: { resume: Resume }) => {
    const { fs } = usePuterStore();
    const [resumeUrl, setResumeUrl] = useState('');

    useEffect(() => {
        const loadResume = async () => {
            // Check if imagePath is already a bundled asset (starts with blob: or data: or is a URL)
            if (typeof imagePath === 'string' && (imagePath.startsWith('blob:') || imagePath.startsWith('data:') || imagePath.startsWith('http') || imagePath.startsWith('/_assets'))) {
                setResumeUrl(imagePath);
                return;
            }
            
            // Otherwise, try to read from Puter storage (for backward compatibility)
            try {
                const blob = await fs.read(imagePath);
                if(!blob) return;
                let url = URL.createObjectURL(blob);
                setResumeUrl(url);
            } catch (error) {
                console.log('Failed to load image from Puter storage, using fallback:', error);
                // Use imagePath directly as fallback
                setResumeUrl(imagePath);
            }
        }

        loadResume();
    }, [imagePath]);

    return (
        <Link to={`/resume/${id}`} className="resume-card animate-in fade-in duration-1000">
            <div className="resume-card-header">
                <div className="flex flex-col gap-2">
                    {companyName && <h2 className="!text-black font-bold break-words">{companyName}</h2>}
                    {jobTitle && <h3 className="text-lg break-words text-gray-500">{jobTitle}</h3>}
                    {!companyName && !jobTitle && <h2 className="!text-black font-bold">Resume</h2>}
                </div>
                <div className="flex-shrink-0">
                    <ScoreCircle score={feedback.overallScore} />
                </div>
            </div>
            {resumeUrl && (
                <div className="gradient-border animate-in fade-in duration-1000">
                    <div className="w-full h-full">
                        <img
                            src={resumeUrl}
                            alt="resume"
                            className="w-full h-[350px] max-sm:h-[200px] object-cover object-top"
                        />
                    </div>
                </div>
                )}
        </Link>
    )
}
export default ResumeCard