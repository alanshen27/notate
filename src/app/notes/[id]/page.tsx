"use client";

import { useEffect, useState, useCallback, use } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Editor } from "@/components/editor";
import { Transcript } from "@/components/transcript";
import { Modals } from "@/components/modals";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Plus, Upload, Mic, Video, MoreVertical, Trash2, MessageSquare, X, Loader2, ExternalLink, ChevronLeft, ChevronRight } from "lucide-react";
import { Section } from "@/lib/types";
import { toast } from "sonner";
import debounce from "lodash/debounce";
import { cn } from "@/lib/utils";
import { v4 } from "uuid";
import { useRef } from "react";
import { Badge } from "@/components/ui/badge";

interface MediaFile {
  id: string;
  name: string;
  type: string;
  url: string;
  duration: number;
  transcript: string | Section[];
  summary: string;
  processing: boolean;
}

interface Note {
  id: string;
  title: string;
  content: string;
  media: MediaFile[];
  recallSetId: string;
}

export default function NotePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  
  const [note, setNote] = useState<Note | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showRecordModal, setShowRecordModal] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<MediaFile | null>(null);
  const [selectedMediaIds, setSelectedMediaIds] = useState<string[]>([]);
  const [isAddingToSummary, setIsAddingToSummary] = useState(false);
  const [recording, setRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [messages, setMessages] = useState<{ role: string; content: string; user?: { image: string; name: string } }[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isAiResponding, setIsAiResponding] = useState(false);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [changedContent, setChangedContent] = useState<number>(0);
  const [isGeneratingFlashcards, setIsGeneratingFlashcards] = useState(false);
  const [flashcards, setFlashcards] = useState<{ term: string; definition: string }[]>([]);
  const [flippedCards, setFlippedCards] = useState<Set<number>>(new Set());
  const [activeTab, setActiveTab] = useState("media");

  useEffect(() => {
    fetchNote();
  }, [id]);

  useEffect(() => {
    if (note?.recallSetId) {
      fetchRecallSet();
    }
  }, [note?.recallSetId]);

  // Fetch messages when chat is opened
  useEffect(() => {
    if (showChat) {
      fetchMessages();
    }
  }, [showChat]);

  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchNote = async () => {
    try {
      const response = await fetch(`/api/notes/${id}`);
      if (!response.ok) throw new Error("Failed to fetch note");
      const data = await response.json();
      setNote(data);
    } catch (error) {
      console.error("Error fetching note:", error);
      toast.error("Failed to load note");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMessages = async () => {
    try {
      const response = await fetch(`/api/notes/${id}/chat`);
      if (!response.ok) throw new Error('Failed to fetch messages');
      const data = await response.json();
      setMessages(data.messages);
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast.error('Failed to load messages');
    }
  };

  const fetchRecallSet = async () => {
    const response = await fetch(`https://www.recalls.sh/api/sets/${note?.recallSetId}`);
    if (!response.ok) throw new Error('Failed to fetch recall set');
    const data = await response.json();
    setFlashcards(data.flashcards);
  };

  const debouncedSave = useCallback(
    debounce(async (updates: Partial<Note>) => {
      setIsSaving(true);
      try {
        const response = await fetch(`/api/notes/${id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updates),
        });

        if (!response.ok) throw new Error("Failed to update note");
        const updatedNote = await response.json();
        setNote(updatedNote);
        toast.success("Changes saved");
      } catch (error) {
        console.error("Error updating note:", error);
        toast.error("Failed to save changes");
      } finally {
        setIsSaving(false);
      }
    }, 1000),
    [id]
  );

  const updateNote = (updates: Partial<Note>) => {
    setNote(prev => prev ? { ...prev, ...updates } : null);
    debouncedSave(updates);
  };

  const handleFileUpload = async (file: File) => {
    try {
      const formData = new FormData();
      formData.append("file", file);

      const tempId = v4();

      setNote({
        ...note!,
        media: [
          ...note!.media,
          {
            id: tempId,
            name: file.name,
            type: file.type,
            url: URL.createObjectURL(file),
            duration: 0,
            transcript: '',
            summary: '',
            processing: true,
          }
        ]
      })
      
      const mediaResponse = await fetch(`/api/notes/${id}/media`, {
        method: "POST",
        body: formData,
      });

      if (!mediaResponse.ok) throw new Error("Failed to add media");
      const updatedNote = await mediaResponse.json();

      // Get the newly created media ID
      const newMedia = updatedNote.newMedia;
    
      if (note?.media.find(media => media.id === tempId)) 
      setNote({
        ...note!,
        media: [
          ...note!.media.map(media => media.id === tempId ? { ...newMedia, processing: true } : media),
        ]
      });
      else setNote({
        ...note!,
        media: [
          ...note!.media,
          { ...newMedia, processing: true }
        ]
      });
      
      // Now get the transcript
      const transcriptFormData = new FormData();
      transcriptFormData.append("file", file);
      transcriptFormData.append("mediaId", newMedia.id);

      const transcriptResponse = await fetch('/api/getTranscript', {
        method: 'POST',
        body: transcriptFormData,
      });

      if (!transcriptResponse.ok) throw new Error("Failed to get transcript");
      const transcriptData = await transcriptResponse.json();

      // Update the note again with the transcript
      if (note?.media.find(media => media.id === newMedia.id)) 
      setNote({
        ...note!,
        media: note!.media.map(media => 
          media.id === newMedia.id 
            ? { 
                ...media, 
                transcript: transcriptData.transcript || '', 
                summary: transcriptData.summary || '',
                processing: false 
              } 
            : media
        ),
      })
      else setNote({
        ...note!,
        media: [
          ...note!.media,
          {
            ...newMedia,
            transcript: transcriptData.transcript || '',
            summary: transcriptData.summary || '',
            processing: false,
          }
        ]
      })
      toast.success("File uploaded successfully");
    } catch (error) {
      console.error("Error uploading file:", error);
      toast.error("Failed to upload file");
    }
  };

  const handleStartRecording = async () => {
    setRecording(true);
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

    const recorder = new MediaRecorder(stream, {
      mimeType: 'audio/webm',
    });
    setMediaRecorder(recorder);

    // Collect chunks as they come in
    const chunks: Blob[] = [];
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        chunks.push(e.data);
      }
    };

    // When recording stops, send the chunks for transcription
    recorder.onstop = async () => {
      const audioBlob = new Blob(chunks, { type: 'audio/webm' });
      const formData = new FormData();
      formData.append("file", audioBlob, "recording.webm");

      const tempId = v4();

      // Add temporary media item with loading state
      setNote({
        ...note!,
        media: [
          ...note!.media,
          {
            id: tempId,
            name: "recording.webm",
            type: "audio/webm",
            url: URL.createObjectURL(audioBlob),
            duration: 0,
            transcript: '',
            summary: '',
            processing: true,
          }
        ]
      });

      try {
        const mediaResponse = await fetch(`/api/notes/${id}/media`, {
          method: "POST",
          body: formData,
        });

        if (!mediaResponse.ok) throw new Error("Failed to add media");
        const updatedNote = await mediaResponse.json();
        const newMedia = updatedNote.newMedia;

        // Update with real media ID
        if (note?.media.find(media => media.id === tempId)) {
          setNote({
            ...note!,
            media: note!.media.map(media => 
              media.id === tempId ? { ...newMedia, processing: true } : media
            ),
          });
        } else {
          setNote({
            ...note!,
            media: [
              ...note!.media,
              { ...newMedia, processing: true }
            ],
          });
        }

        // Get transcript
        const transcriptFormData = new FormData();
        transcriptFormData.append("audio", newMedia.url);
        transcriptFormData.append("mediaId", newMedia.id);

        const transcriptResponse = await fetch('/api/getAudioTranscription', {
          method: 'POST',
          body: transcriptFormData,
        });

        if (!transcriptResponse.ok) throw new Error("Failed to get transcript");
        const transcriptData = await transcriptResponse.json();

        // Update with transcript
        if (note?.media.find(media => media.id === newMedia.id)) {
          setNote({
            ...note!,
            media: note!.media.map(media => 
              media.id === newMedia.id 
                ? { 
                    ...media, 
                    transcript: transcriptData.transcript || '', 
                    summary: transcriptData.summary || '',
                    processing: false 
                  } 
                : media
            ),
          });
        } else {
          setNote({
            ...note!,
            media: [
              ...note!.media,
              {
                ...newMedia,
                transcript: transcriptData.transcript || '',
                summary: transcriptData.summary || '',
                processing: false,
              }
            ],
          });
        }

        toast.success("Recording processed successfully");
      } catch (error) {
        console.error("Error processing recording:", error);
        toast.error("Failed to process recording");
        
        // Remove the failed media item
        setNote({
          ...note!,
          media: note!.media.filter(media => media.id !== tempId),
        });
      }
    };

    recorder.start(3000); // chunk every 3s
  };

  const handleStopRecording = async () => {
    setRecording(false);
    
    // Stop all tracks in the stream
    const tracks = mediaRecorder?.stream?.getTracks() || [];
    tracks.forEach(track => track.stop());
    
    // Stop the media recorder
    if (mediaRecorder) {
      mediaRecorder.stop();
    }
  };

  const handleViewTranscript = (media: MediaFile) => {
    setSelectedMedia(media);
    setShowTranscript(true);
  };

  const handleDeleteMedia = async (mediaId: string) => {
    try {
      const response = await fetch(`/api/notes/${id}/media/${mediaId}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete media");
      const updatedNote = await response.json();
      setNote(updatedNote);
      toast.success("Media deleted successfully");
    } catch (error) {
      console.error("Error deleting media:", error);
      toast.error("Failed to delete media");
    }
  };

  const handleMediaSelect = (mediaId: string) => {
    setSelectedMediaIds(prev => {
      if (prev.includes(mediaId)) {
        return prev.filter(id => id !== mediaId);
      }
      return [...prev, mediaId];
    });
  };

  const handleAddToSummary = async () => {
    if (selectedMediaIds.length === 0) {
      toast.error("Please select at least one media file");
      return;
    }

    setIsAddingToSummary(true);
    try {
      const response = await fetch(`/api/notes/${id}/summary`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          mediaIds: selectedMediaIds,
        }),
      });

      if (!response.ok) throw new Error("Failed to add to summary");
      
      const updatedNote = await response.json();
      
      setNote({
        ...note!,
        content: updatedNote.summary,
      });
      setSelectedMediaIds([]);
      setChangedContent(prev => prev + 1);
      toast.success("Added to summary successfully");
    } catch (error) {
      console.error("Error adding to summary:", error);
      toast.error("Failed to add to summary");
    } finally {
      setIsAddingToSummary(false);
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const newMessage = { role: 'user', content: inputMessage };
    setMessages(prev => [...prev, newMessage]);
    setInputMessage('');
    setIsAiResponding(true);

    try {
      const response = await fetch(`/api/notes/${id}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: inputMessage }),
      });

      if (!response.ok) throw new Error('Failed to send message');
      const data = await response.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.message }]);
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setIsAiResponding(false);
    }
  };

  // Add loading stars animation component
  const LoadingStars = () => (
    <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center rounded-lg border border-primary">
      <div className="flex flex-col items-center gap-4">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 rounded-full bg-primary/20 animate-pulse" />
          <div className="absolute inset-2 rounded-full bg-primary/40 animate-pulse" style={{ animationDelay: '0.2s' }} />
          <div className="absolute inset-4 rounded-full bg-primary/60 animate-pulse" style={{ animationDelay: '0.4s' }} />
          <div className="absolute inset-6 rounded-full bg-primary/80 animate-pulse" style={{ animationDelay: '0.6s' }} />
        </div>
        <p className="text-lg font-medium">Generating Summary...</p>
      </div>
    </div>
  );

  const handleGenerateFlashcards = async () => {
    setIsGeneratingFlashcards(true);
    try {
      const response = await fetch(`https://www.recalls.sh/api/sets/inference`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          notes: note?.content || 'No notes',
          title: note?.title || 'No title',
        }),
      });

      if (!response.ok) throw new Error("Failed to generate flashcards");
      const data = await response.json();

      const recallSetResponse = await fetch(`/api/notes/${id}/connectToRecalls`, {
        method: "POST",
        credentials: 'include',
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ setId: data.id }),
      });

      if (!recallSetResponse.ok) throw new Error("Failed to connect to Recalls");

      setFlashcards(data.flashcards);
      toast.success("Flashcards generated successfully");
    } catch (error) {
      console.error("Error generating flashcards:", error);
      toast.error("Failed to generate flashcards");
    } finally {
      setIsGeneratingFlashcards(false);
    }
  };

  const toggleCard = (index: number) => {
    setFlippedCards(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-full">Loading...</div>;
  }

  if (!note) {
    return <div className="flex items-center justify-center h-full">Note not found</div>;
  }

  return (
    <main className="bg-background w-full">
      {/* Top Bar */}
      <div className="border-b">
        <div className="w-full px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Input
              value={note.title}
              onChange={(e) => updateNote({ title: e.target.value })}
              placeholder="Untitled"
              className="text-lg font-semibold"
            />
            {isSaving && (
              <span className="text-sm text-muted-foreground">
                Saving...
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {selectedMediaIds.length > 0 && (
              <Button
                variant="default"
                onClick={handleAddToSummary}
                disabled={isAddingToSummary}
              >
                {isAddingToSummary ? "Adding..." : `Add ${selectedMediaIds.length} to Summary`}
              </Button>
            )}
            <Button 
              variant="outline"
              onClick={() => setShowChat(!showChat)}
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Chat
            </Button>
            {activeTab === "media" ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Media
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => setShowUploadModal(true)}>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload File
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setShowRecordModal(true)}>
                    <Mic className="h-4 w-4 mr-2" />
                    Record Audio
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                variant="outline"
                onClick={() => handleGenerateFlashcards()}
                disabled={isGeneratingFlashcards}
              >
                {isGeneratingFlashcards ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Generate Flashcards
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="w-full px-8 py-5">
        {/* Tabs for Media and Flashcards */}
        <Tabs defaultValue="media" className="mb-8" onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="media">Media Files</TabsTrigger>
            <TabsTrigger value="flashcards">Study Materials <Badge className="text-xs">Beta</Badge></TabsTrigger>
          </TabsList>
          
          <TabsContent value="media">
            {note.media.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                {note.media.map((file) => (
                  <div
                    key={file.id}
                    className={cn(
                      "bg-white border rounded-lg p-3 hover:bg-gray-50 transition-colors relative group cursor-pointer",
                      selectedMediaIds.includes(file.id) && "ring-2 ring-primary",
                      file.processing && "animate-pulse bg-primary/10 pointer-events-none"
                    )}
                    onClick={() => {
                      if (!file.processing) {
                        handleMediaSelect(file.id);
                      }
                    }}
                  >
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteMedia(file.id);
                            }}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <div className="aspect-video bg-muted rounded-md mb-2 flex items-center justify-center">
                      {file.type === 'audio' ? (
                        <Mic className="h-6 w-6 text-muted-foreground" />
                      ) : (
                        <Video className="h-6 w-6 text-muted-foreground" />
                      )}
                    </div>
                    <p className="text-sm font-medium truncate">{file.name}</p>
                    <p className="text-xs text-muted-foreground mb-2">
                      {file.type === 'audio' ? 'Audio' : 'Video'}
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewTranscript(file);
                      }}
                    >
                      View Transcript
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="flashcards">
            {/* Flashcards Row */}
            {flashcards.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-md font-medium">Flashcards</h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(`https://www.recalls.sh/sets/${note?.recallSetId}`, '_blank')}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Open in Recalls
                  </Button>
                </div>
                
                <div className="relative">
                  <div className="flex gap-4 overflow-x-auto pb-4 px-1 snap-x snap-mandatory">
                    {flashcards.map((flashcard, index) => (
                      <div
                        key={index}
                        className="flex-none w-64 snap-center"
                      >
                        <div 
                          className="relative w-full aspect-[4/3] cursor-pointer perspective-1000"
                          onClick={() => toggleCard(index)}
                        >
                          <div 
                            className={`absolute w-full h-full transition-transform duration-500 transform-style-3d ${
                              flippedCards.has(index) ? 'rotate-y-180' : ''
                            }`}
                          >
                            {/* Front of card */}
                            <div className="absolute w-full h-full backface-hidden bg-white border rounded-lg p-4 flex flex-col items-center justify-center shadow-sm hover:shadow-md transition-shadow">
                              <p className="font-semibold text-center">{flashcard.term}</p>
                            </div>
                            
                            {/* Back of card */}
                            <div className="absolute w-full h-full backface-hidden bg-white border rounded-lg p-4 flex flex-col items-center justify-center rotate-y-180 shadow-sm hover:shadow-md transition-shadow">
                              <p className="text-center overflow-scroll m-2">{flashcard.definition}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Editor and Sidebars Layout */}
        <div className="flex flex-col lg:flex-row gap-8 w-full">
          {/* Editor */}
          <div className="w-full relative">
            <Editor
              key={changedContent}
              initialContent={note.content}
              onChange={(content) => updateNote({ content })}
              readOnly={isAddingToSummary}
            />
            {isAddingToSummary && <LoadingStars />}
          </div>

          {/* Sidebars */}
          <div className={`lg:w-1/3 shrink-0 space-y-4 ${!showChat && !showTranscript && 'hidden'}`}>
            {/* Transcript */}
            {showTranscript && selectedMedia && (
                <Transcript
                  onClose={() => setShowTranscript(false)}
                  transcript={selectedMedia.transcript || ''}
                  type={selectedMedia.type}
                  summary={selectedMedia.summary || ''}
                  audioUrl={selectedMedia.url}
                />
            )}
            {/* Chat */}
            {showChat && (
              <div className="flex flex-col border rounded-md bg-white p-4">
                <div className="relative">
                <div className="flex items-center justify-between mb-4 sticky top-0 left-0 right-0">
                  <h3 className="font-semibold">Chat</h3>
                  <Button variant="ghost" size="sm" onClick={() => setShowChat(false)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                </div>
                <div className="flex flex-col justify-between">
                  <div ref={messagesContainerRef} className="overflow-y-auto space-y-4 h-[35rem]">
                    {messages.map((message, index) => (
                      <div
                        key={index}
                        className={cn(
                          "flex items-start gap-2",
                          message.role === 'user' ? "justify-end" : "justify-start"
                        )}
                      >
                        {message.role === 'assistant' && (
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-xs font-medium">AI</span>
                          </div>
                        )}
                        <div
                          className={cn(
                            "rounded-lg p-3 max-w-[80%]",
                            message.role === 'user'
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted"
                          )}
                        >
                          <p className="text-sm">{message.content}</p>
                        </div>
                        {message.role === 'user' && (
                          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center overflow-hidden">
                            {message.user?.image ? (
                              <img 
                                src={message.user.image} 
                                alt={message.user.name || 'User'} 
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span className="text-xs font-medium text-primary-foreground">You</span>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                    {isAiResponding && (
                      <div className="flex items-start gap-2">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-xs font-medium">AI</span>
                        </div>
                        <div className="rounded-lg p-3 bg-muted">
                          <div className="flex gap-1">
                            <div className="w-2 h-2 rounded-full bg-primary/50 animate-bounce" />
                            <div className="w-2 h-2 rounded-full bg-primary/50 animate-bounce [animation-delay:0.2s]" />
                            <div className="w-2 h-2 rounded-full bg-primary/50 animate-bounce [animation-delay:0.4s]" />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Input 
                      placeholder="Type your message..." 
                      className="flex-1"
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                    />
                    <Button 
                      onClick={handleSendMessage}
                      disabled={!inputMessage.trim() || isAiResponding}
                    >
                      Send
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <Modals
        showUploadModal={showUploadModal}
        showRecordModal={showRecordModal}
        onCloseUpload={() => setShowUploadModal(false)}
        onCloseRecord={() => setShowRecordModal(false)}
        onFileUpload={handleFileUpload}
        recording={recording}
        onStartRecording={handleStartRecording}
        onStopRecording={handleStopRecording}
      />
    </main>
  );
}
