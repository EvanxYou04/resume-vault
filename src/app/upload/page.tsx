import ResumeUploader from "@/components/ResumeUploader";
import ResumeList from "@/components/ResumeList";

export default function UploadPage() {
    const userId = "temp-user-id";

    return (
        <div className="container mx-auto py-8 max-w-4xl">
            <h1 className="text-3xl font-bold text-center mb-8">Resume Vault</h1>
            <div className="grid md:grid-cols-2 gap-8">
                <div>
                    <h2 className="text-xl font-semibold mb-4">Upload New Resume</h2>
                    <ResumeUploader userId={userId} />
                </div>
                <div>
                    <ResumeList userId={userId} />
                </div>
            </div>
        </div>
    );
}