import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { X } from "lucide-react";
import { Section } from "@/lib/types";
import { useRef } from "react";

interface TranscriptProps {
  onClose: () => void;
  transcript: string | Section[];
  type: string;
  summary: string;
  audioUrl: string;
}

export function Transcript({
  onClose,
  transcript,
  summary,
  type,
  audioUrl,
}: TranscriptProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  return (
    <div className="w-full flex flex-col border rounded-md bg-white p-4 typography-enabled">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">Transcript</h3>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>
      {/* Audio Player */}
      {type === 'audio' && (
        <div className="mb-4">
          <audio
            ref={audioRef}
            src={audioUrl}
            controls
            className="w-full"

          />
        </div>
      )}
      <Tabs defaultValue="raw" className="flex-1 flex flex-col">
        <TabsList className="mb-4">
          <TabsTrigger value="raw">Raw</TabsTrigger>
          <TabsTrigger value="summarized">Summarized</TabsTrigger>
        </TabsList>
        <TabsContent value="raw" className="prose prose-sm">
          {typeof transcript === 'string' && (
            <p className="h-[35rem] overflow-y-auto" dangerouslySetInnerHTML={{ __html: transcript }} />
          )}
          {Array.isArray(transcript) && transcript.map((section, index) => (
            <div key={index} className="flex flex-col ">
              <span className="text-gray-500 font-semibold">{section.label}</span>
              <p dangerouslySetInnerHTML={{ __html: section.text }} />
            </div>
          ))}
        </TabsContent>
        <TabsContent value="summarized" className="prose prose-sm">
          <p className="h-[35rem] overflow-y-auto" dangerouslySetInnerHTML={{ __html: summary }} />
        </TabsContent>
      </Tabs>
    </div>
  );
} 