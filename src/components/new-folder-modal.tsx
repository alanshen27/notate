import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface NewFolderModalProps {
  open: boolean;
  onClose: () => void;
  onFolderCreated: () => void;
  parentId: string;
}

export function NewFolderModal({
  open,
  onClose,
  onFolderCreated,
  parentId,
}: NewFolderModalProps) {
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsLoading(true);
    try {
      const response = await fetch("/api/folders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, parentId: parentId }),
      });

      if (!response.ok) throw new Error("Failed to create folder");
      
      toast.success("Folder created successfully");
      setName("");
      onFolderCreated();
      onClose();
    } catch (error) {
      console.error("Error creating folder:", error);
      toast.error("Failed to create folder");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Folder</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            placeholder="Folder name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={isLoading}
          />
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              Create
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
} 