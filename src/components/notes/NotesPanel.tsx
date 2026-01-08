import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, FileText, Search, Trash2, FolderSync, Folder, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { fetchNotes, deleteNote, type Note } from "@/lib/supabase-api";
import NoteEditor from "./NoteEditor";
import GoogleDriveNotesSync from "./GoogleDriveNotesSync";

interface NotesPanelProps {
  onClose?: () => void;
}

const NotesPanel: React.FC<NotesPanelProps> = ({ onClose }) => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [search, setSearch] = useState("");
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [folderFilter, setFolderFilter] = useState<string[] | null>(null);
  const [breadcrumbs, setBreadcrumbs] = useState<string[]>([]);

  useEffect(() => {
    loadNotes();
  }, []);

  const loadNotes = async () => {
    setIsLoading(true);
    const data = await fetchNotes();
    setNotes(data);
    setIsLoading(false);
  };

  const handleSearch = async () => {
    // Search is now done client-side via filteredNotes
    // Could add server-side search later with Supabase full-text search
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (await deleteNote(id)) {
      setNotes((prev) => prev.filter((n) => n.id !== id));
      if (selectedNote?.id === id) {
        setSelectedNote(null);
      }
    }
  };

  const handleSave = () => {
    loadNotes();
    setSelectedNote(null);
    setIsCreating(false);
  };

  // Extract title from first line of content or use placeholder
  const getTitle = (note: Note) => {
    const firstLine = note.content.split('\n')[0].trim();
    return firstLine.length > 50 ? firstLine.slice(0, 50) + '...' : firstLine || 'Untitled';
  };

  const handleFolderClick = (note: Note) => {
    if (note.folder_path && note.folder_path.length > 0) {
      setFolderFilter(note.folder_path);
      setBreadcrumbs(note.folder_path);
    }
  };

  const handleBreadcrumbClick = (index: number) => {
    if (index === -1) {
      // Go to root
      setFolderFilter(null);
      setBreadcrumbs([]);
    } else {
      const newPath = breadcrumbs.slice(0, index + 1);
      setFolderFilter(newPath);
      setBreadcrumbs(newPath);
    }
  };

  // Filter notes by folder and search
  let filteredNotes = notes;
  
  if (folderFilter) {
    // Show items that are direct children of the current folder
    filteredNotes = notes.filter((n: any) => {
      if (!n.folder_path) return false;
      // Item must be exactly one level deeper than current folder
      if (n.folder_path.length !== folderFilter.length + 1) return false;
      // Check if path matches up to the filter depth
      for (let i = 0; i < folderFilter.length; i++) {
        if (n.folder_path[i] !== folderFilter[i]) return false;
      }
      return true;
    });
  } else {
    // At root: show local notes (no folder_path) AND top-level synced items
    // Top-level synced items have folder_path.length === 1 (just the root folder name)
    // Also show local notes that don't have folder_path
    filteredNotes = notes.filter((n: any) => {
      // Local notes without folder_path
      if (!n.folder_path || n.folder_path.length === 0) return true;
      // Top-level synced folders/files (only the linked folder name in path)
      if (n.folder_path.length === 1) return true;
      return false;
    });
  }

  if (search) {
    filteredNotes = filteredNotes.filter((n) =>
      n.content.toLowerCase().includes(search.toLowerCase())
    );
  }

  // Show editor when creating or editing
  if (isCreating || selectedNote) {
    return (
      <NoteEditor
        note={selectedNote}
        onSave={handleSave}
        onCancel={() => {
          setSelectedNote(null);
          setIsCreating(false);
        }}
      />
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-border space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Notes
          </h2>
          <div className="flex items-center gap-2">
            <GoogleDriveNotesSync onSyncComplete={loadNotes} />
            <Button size="sm" onClick={() => setIsCreating(true)}>
              <Plus className="h-4 w-4 mr-1" />
              New
            </Button>
          </div>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search notes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="pl-9"
          />
        </div>
      </div>

      {/* Breadcrumbs */}
      {breadcrumbs.length > 0 && (
        <div className="px-4 py-2 border-b border-border">
          <div className="flex items-center gap-1 text-sm text-muted-foreground overflow-x-auto">
            <button
              onClick={() => handleBreadcrumbClick(-1)}
              className="hover:text-foreground transition-colors shrink-0"
            >
              Root
            </button>
            {breadcrumbs.map((crumb, idx) => (
              <React.Fragment key={idx}>
                <ChevronRight className="h-3 w-3 shrink-0" />
                <button
                  onClick={() => handleBreadcrumbClick(idx)}
                  className={cn(
                    "hover:text-foreground transition-colors",
                    idx === breadcrumbs.length - 1 && "text-foreground font-medium"
                  )}
                >
                  {crumb}
                </button>
              </React.Fragment>
            ))}
          </div>
        </div>
      )}

      {/* Notes list */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {isLoading ? (
            <div className="p-4 text-center text-muted-foreground text-sm">
              Loading notes...
            </div>
          ) : filteredNotes.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground text-sm">
              {search ? "No notes found" : "No notes yet. Create one!"}
            </div>
          ) : (
            filteredNotes.map((note: any) => {
              const isFolder = note.is_folder === true;
              return (
                <button
                  key={note.id}
                  onClick={() => isFolder ? handleFolderClick(note) : setSelectedNote(note)}
                  className={cn(
                    "w-full text-left p-3 rounded-lg hover:bg-accent transition-colors group"
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        {isFolder ? (
                          <Folder className="h-4 w-4 text-muted-foreground shrink-0" />
                        ) : (
                          <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                        )}
                        <span className="truncate text-sm font-medium">
                          {getTitle(note)}
                        </span>
                        {isFolder && <ChevronRight className="h-4 w-4 text-muted-foreground ml-auto shrink-0" />}
                      </div>
                      {note.mime_type && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {note.mime_type}
                        </p>
                      )}
                    </div>
                    {!isFolder && (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6 opacity-0 group-hover:opacity-100 shrink-0"
                        onClick={(e) => handleDelete(note.id, e)}
                      >
                        <Trash2 className="h-3 w-3 text-destructive" />
                      </Button>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default NotesPanel;
