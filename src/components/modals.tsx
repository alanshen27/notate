import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Mic, Upload, Square } from "lucide-react";

interface ModalsProps {
  showUploadModal?: boolean;
  showRecordModal?: boolean;
  onCloseUpload?: () => void;
  onCloseRecord?: () => void;
  onFileUpload?: (file: File) => void;
  onStartRecording?: () => void;
  onStopRecording?: () => void;
  recording?: boolean;
}

// e6d1fee438c4172f1c67b6628d02ce1bea5ae876 API KEY
export function Modals({
  showUploadModal,
  showRecordModal,
  onCloseUpload,
  onCloseRecord,
  onFileUpload,
  onStartRecording,
  onStopRecording,
  recording = false,
}: ModalsProps) {
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        onFileUpload?.(file);
      } catch (error) {
        console.error('Error uploading file:', error);
      }
      onCloseUpload?.();
    }
  };

  return (
    <>
      {/* Upload File Modal */}
      <Dialog open={showUploadModal} onOpenChange={onCloseUpload}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload File</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="border-2 border-dashed rounded-lg p-8 text-center">
              <input
                type="file"
                accept="audio/*,video/*,.pdf,.doc,.docx,.ppt,.pptx,.txt"
                onChange={handleFileChange}
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className="cursor-pointer flex flex-col items-center gap-2"
              >
                <Upload className="h-8 w-8 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  Click to upload or drag and drop
                </span>
                <span className="text-xs text-muted-foreground">
                  Audio, video, PDF, Word, PowerPoint, and text files
                </span>
              </label>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Record Audio Modal */}
      <Dialog open={showRecordModal} onOpenChange={onCloseRecord}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Audio</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex justify-center">
              <Button
                size="lg"
                className={`h-24 w-24 rounded-full ${recording ? 'bg-red-500 hover:bg-red-600' : ''}`}
                onClick={recording ? onStopRecording : onStartRecording}
              >
                {recording ? (
                  <Square className="h-8 w-8" />
                ) : (
                  <Mic className="h-8 w-8" />
                )}
              </Button>
            </div>
            <p className="text-center text-sm text-muted-foreground">
              {recording ? 'Recording in progress...' : 'Click the button above to start recording'}
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
} 