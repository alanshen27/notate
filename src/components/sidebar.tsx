"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, FolderPlus, FileText, Folder, ChevronRight, MoreVertical, Pencil, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { NewFolderModal } from "@/components/new-folder-modal";
import { NewNoteModal } from "@/components/new-note-modal";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useSession } from "next-auth/react";

interface Note {
  id: string;
  title: string;
  updatedAt: string;
}

interface Folder {
  id: string;
  name: string;
  isDefault: boolean;
  notes: Note[];
  children: Folder[];
  opened: boolean;
}

interface NoteItemProps {
  note: Note;
  level: number;
  isSelected: string;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onRename: (id: string, newName: string) => void;
}

function NoteItem({ note, level, isSelected, onSelect, onDelete, onRename }: NoteItemProps) {
  const router = useRouter();
  const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false);
  const [newName, setNewName] = useState(note.title || "Untitled");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  
  return (
    <>
      <div className="group flex items-center w-full">
        <button
          key={note.id}
          onClick={() => {
            onSelect(note.id);
            router.push(`/notes/${note.id}`);
          }}
          className={cn(
            "flex-1 flex items-center gap-2 px-2 py-1 rounded-md text-sm",
            isSelected === note.id ? "bg-accent text-accent-foreground" : "hover:accent/50"
          )}
          style={{ marginLeft: `${level * 1.5 + 0.5}rem` }}
        >
          <FileText className="h-4 w-4" />
          <span className="truncate">{note.title || "Untitled"}</span>
        </button>
        <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "h-8 w-8",
                (isDropdownOpen || "group-hover:opacity-100 opacity-0")
              )}
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setIsRenameDialogOpen(true)}>
              <Pencil className="h-4 w-4 mr-2" />
              Rename
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-destructive"
              onClick={() => onDelete(note.id)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Dialog open={isRenameDialogOpen} onOpenChange={setIsRenameDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Note</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Enter new name"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsRenameDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                onRename(note.id, newName);
                setIsRenameDialogOpen(false);
              }}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

interface FolderItemProps {
  folder: Folder;
  level: number;
  isSelected: string;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onRename: (id: string, newName: string) => void;
  opened: boolean;
}

function FolderItem({ folder, level, isSelected, onSelect, onDelete, onRename, opened }: FolderItemProps) {
  const [isExpanded, setIsExpanded] = useState(opened);
  const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false);
  const [newName, setNewName] = useState(folder.name);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  return (
    <>
      <Collapsible
        key={folder.id}
        open={isExpanded}
        onOpenChange={async () => {
          onSelect(folder.id);
          setIsExpanded(!isExpanded);

          await fetch(`/api/folders/${folder.id}`, {
            method: "PUT",
            body: JSON.stringify({ opened: !isExpanded }),
          });

        }}
        className="space-y-2"
      >
        <div className="group flex items-center">
          <CollapsibleTrigger
            className={cn(
              "flex-1 flex items-center gap-2 px-2 py-1 rounded-md cursor-pointer",
              isSelected === folder.id ? "bg-accent text-accent-foreground" : "hover:accent/50"
            )}
            style={{ marginLeft: `${level * 1.5 + 0.5}rem` }}
          >
            <ChevronRight 
              className={cn(
                "h-4 w-4 transition-transform",
                isExpanded && "transform rotate-90"
              )}
            />
            <Folder className="h-4 w-4" />
            <span className="text-sm font-medium">{folder.name}</span>
          </CollapsibleTrigger>
          <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "h-8 w-8",
                  (isDropdownOpen || "group-hover:opacity-100 opacity-0")
                )}
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setIsRenameDialogOpen(true)}>
                <Pencil className="h-4 w-4 mr-2" />
                Rename
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => onDelete(folder.id)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <CollapsibleContent className="space-y-2">
          {folder.children && folder.children.length > 0 && (
            folder.children.map(child => (
              <FolderItem
                key={child.id}
                folder={child}
                level={level + 1}
                isSelected={isSelected}
                onSelect={onSelect}
                onDelete={onDelete}
                onRename={onRename}
                opened={opened}
              />
            ))
          )}
          {folder.notes && folder.notes.map(note => (
            <NoteItem
              key={note.id}
              note={note}
              level={level + 1}
              isSelected={isSelected}
              onSelect={onSelect}
              onDelete={onDelete}
              onRename={onRename}
            />
          ))}
        </CollapsibleContent>
      </Collapsible>

      <Dialog open={isRenameDialogOpen} onOpenChange={setIsRenameDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Folder</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Enter new name"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsRenameDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                onRename(folder.id, newName);
                setIsRenameDialogOpen(false);
              }}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function Sidebar() {
  const router = useRouter();
  const { id } = useParams();

  const [folders, setFolders] = useState<Folder | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [showNewFolderModal, setShowNewFolderModal] = useState(false);
  const [showNewNoteModal, setShowNewNoteModal] = useState(false);

  useEffect(() => {
    fetchFolders();
  }, []);

  const fetchFolders = async () => {
    try {
      const response = await fetch("/api/folders");
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to fetch folders");
      }
      const data = await response.json();
      setSelectedFolder(data.find((folder: Folder) => folder.isDefault)?.id || null);
      setFolders(data.find((folder: Folder) => folder.isDefault));
    } catch (error) {
      console.error("Error fetching folders:", error);
      toast.error(error instanceof Error ? error.message : "Failed to load folders");
    } finally {
      setIsLoading(false);
    }
  };

  const createNewNote = async (title: string) => {
    try {
      const response = await fetch("/api/notes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          content: "",
          folderId: selectedFolder,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create note");
      }
      
      const newNote = await response.json();
      
      setFolders(prevFolders => {
        if (!prevFolders) return null;
        return {
          ...prevFolders,
          notes: [newNote, ...prevFolders.notes]
        }
      })

      toast.success("Note created successfully");
      setShowNewNoteModal(false);
      router.push(`/notes/${newNote.id}`);
    } catch (error) {
      console.error("Error creating note:", error);
      toast.error(error instanceof Error ? error.message : "Failed to create note");
    }
  };

  const handleDeleteFolder = async (id: string) => {
    try {
      const response = await fetch(`/api/folders/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete");
      toast.success("Deleted successfully");
      fetchFolders();
    } catch (error) {
      console.error("Error deleting:", error);
      toast.error("Failed to delete");
    }
  };

  const handleRenameFolder = async (id: string, newName: string) => {
    try {
      const response = await fetch(`/api/folders/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: newName }),
      });
      if (!response.ok) throw new Error("Failed to rename");
      toast.success("Renamed successfully");
      fetchFolders();
    } catch (error) {
      console.error("Error renaming:", error);
      toast.error("Failed to rename");
    }
  };

  const handleDeleteNote = async (id: string) => {
    try {
      const response = await fetch(`/api/notes/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete");
      toast.success("Deleted successfully");
      fetchFolders();
    } catch (error) {
      console.error("Error deleting:", error);
      toast.error("Failed to delete");
    }
  };

  const handleRenameNote = async (id: string, newName: string) => {
    try {
      const response = await fetch(`/api/notes/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ title: newName }),
      });
      if (!response.ok) throw new Error("Failed to rename");
      toast.success("Renamed successfully");
      fetchFolders();
    } catch (error) {
      console.error("Error renaming:", error);
      toast.error("Failed to rename");
    }
  };

  const { data: session } = useSession();


  if (isLoading && !session) {
    return <div className="w-64 border-r p-4">Loading...</div>;
  }


  if (!session) {
    return <div className="w-64 border-r p-4">Unauthenticated</div>;
  }

  return (
    <div className="border-r bg-background h-full">
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Notes</h2>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowNewNoteModal(true)}
              title="New Note"
            >
              <Plus className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowNewFolderModal(true)}
              title="New Folder"
            >
              <FolderPlus className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <ScrollArea className="">
          <div className="space-y-2">
            {folders?.children && folders.children.map(folder => (
              <FolderItem
                key={folder.id}
                folder={folder}
                level={0}
                isSelected={id as string}
                onSelect={setSelectedFolder}
                onDelete={handleDeleteFolder}
                onRename={handleRenameFolder}
                opened={folder.opened}
              />
            ))}
            {folders?.notes && folders.notes.map(note => (
              <NoteItem
                key={note.id}
                note={note}
                level={0}
                isSelected={id as string}
                onSelect={() => {
                  router.push(`/notes/${note.id}`);
                }}
                onDelete={handleDeleteNote}
                onRename={handleRenameNote}
              />
            ))}
          </div>
        </ScrollArea>
      </div>

      <NewFolderModal
        open={showNewFolderModal}
        parentId={selectedFolder || ""}
        onClose={() => setShowNewFolderModal(false)}
        onFolderCreated={fetchFolders}
      />
      <NewNoteModal
        open={showNewNoteModal}
        onClose={() => setShowNewNoteModal(false)}
        onNoteCreated={createNewNote}
      />
    </div>
  );
}