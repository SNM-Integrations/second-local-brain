import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FolderSync, Folder, ChevronRight, Loader2, Unlink, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface GoogleDriveNotesSyncProps {
  onSyncComplete?: () => void;
}

interface DriveItem {
  id: string;
  name: string;
  mimeType?: string;
  isSharedDrive?: boolean;
  isFolder?: boolean;
}

interface LinkedFolder {
  id: string | null;
  name: string;
  driveId?: string | null;
}

// Store folder link in localStorage for now (could move to user settings table later)
const DRIVE_FOLDER_KEY = "notes_drive_folder";

const GoogleDriveNotesSync: React.FC<GoogleDriveNotesSyncProps> = ({ onSyncComplete }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [items, setItems] = useState<DriveItem[]>([]);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [folderPath, setFolderPath] = useState<DriveItem[]>([]);
  const [linkedFolder, setLinkedFolder] = useState<LinkedFolder | null>(null);
  const [hasGoogleAuth, setHasGoogleAuth] = useState(false);
  const [currentDriveId, setCurrentDriveId] = useState<string | null>(null);

  useEffect(() => {
    checkGoogleAuth();
    loadLinkedFolder();
    
    // Check for OAuth success callback
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("google_auth") === "success") {
      toast.success("Google Drive connected successfully!");
      setHasGoogleAuth(true);
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const loadLinkedFolder = () => {
    const stored = localStorage.getItem(DRIVE_FOLDER_KEY);
    if (stored) {
      setLinkedFolder(JSON.parse(stored));
    }
  };

  const checkGoogleAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("google_auth_tokens")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    setHasGoogleAuth(!!data);
  };

  const connectGoogle = async () => {
    setIsConnecting(true);
    try {
      const { data, error } = await supabase.functions.invoke("google-oauth", {
        method: "POST",
        body: {},
      });

      if (error) throw error;

      if (data?.authUrl) {
        // Redirect to Google OAuth
        window.location.href = data.authUrl;
      }
    } catch (error: any) {
      console.error("Failed to start OAuth:", error);
      toast.error("Failed to connect Google: " + error.message);
      setIsConnecting(false);
    }
  };

  const loadItems = async (folderId: string | null = null, driveId: string | null = null) => {
    setIsLoading(true);
    try {
      // If at root, load shared drives + My Drive folders
      if (!folderId && !driveId) {
        const [foldersResponse, sharedDrivesResponse] = await Promise.all([
          supabase.functions.invoke("google-drive", {
            body: { action: "list-folders", parentId: null },
          }),
          supabase.functions.invoke("google-drive", {
            body: { action: "list-shared-drives" },
          }),
        ]);

        if (foldersResponse.error) throw foldersResponse.error;
        if (foldersResponse.data?.needsAuth) {
          setHasGoogleAuth(false);
          toast.error("Please connect Google Drive first");
          return;
        }

        const myDriveFolders = (foldersResponse.data?.data || []).map((f: any) => ({
          ...f,
          isFolder: true,
        }));
        const sharedDrives = (sharedDrivesResponse.data?.data || []).map((d: any) => ({
          ...d,
          isFolder: true,
        }));
        
        // Combine My Drive folders with Shared Drives
        setItems([...myDriveFolders, ...sharedDrives]);
        setCurrentFolderId(null);
        setCurrentDriveId(null);
      } else {
        // Load both folders AND files from the current location
        const [foldersResponse, filesResponse] = await Promise.all([
          supabase.functions.invoke("google-drive", {
            body: { action: "list-folders", parentId: folderId, driveId },
          }),
          supabase.functions.invoke("google-drive", {
            body: { action: "list-files", folderId: folderId, driveId },
          }),
        ]);

        if (foldersResponse.error) throw foldersResponse.error;
        if (filesResponse.error) throw filesResponse.error;
        
        if (foldersResponse.data?.needsAuth || filesResponse.data?.needsAuth) {
          setHasGoogleAuth(false);
          toast.error("Please connect Google Drive first");
          return;
        }

        const folders = (foldersResponse.data?.data || []).map((f: any) => ({
          ...f,
          isFolder: true,
        }));
        
        // Show ALL file types (no filtering)
        const files = (filesResponse.data?.data || []).map((f: any) => ({
          ...f,
          isFolder: false,
        }));
        
        // Show folders first, then files
        setItems([...folders, ...files]);
        setCurrentFolderId(folderId);
        setCurrentDriveId(driveId);
      }
    } catch (error: any) {
      toast.error("Failed to load items: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const navigateToFolder = (item: DriveItem) => {
    if (!item.isFolder) return;
    
    setFolderPath([...folderPath, item]);
    // If it's a shared drive, we're entering the drive root (use null as parentId, drive ID as driveId)
    if (item.isSharedDrive) {
      loadItems(null, item.id);
    } else {
      loadItems(item.id, currentDriveId);
    }
  };

  const navigateBack = () => {
    const newPath = [...folderPath];
    newPath.pop();
    setFolderPath(newPath);
    
    if (newPath.length > 0) {
      const lastFolder = newPath[newPath.length - 1];
      // Determine the driveId based on the path
      const sharedDrive = newPath.find(f => f.isSharedDrive);
      loadItems(lastFolder.id, sharedDrive?.id || null);
    } else {
      loadItems(null, null);
    }
  };

  const linkFolder = (item: DriveItem) => {
    // If linking a shared drive, set id to null (drive root) and driveId to the drive ID
    const folderData: LinkedFolder = item.isSharedDrive
      ? {
          id: null,
          name: item.name,
          driveId: item.id,
        }
      : {
          id: item.id,
          name: item.name,
          driveId: currentDriveId,
        };
    setLinkedFolder(folderData);
    localStorage.setItem(DRIVE_FOLDER_KEY, JSON.stringify(folderData));
    setIsOpen(false);
    toast.success(`Linked to folder: ${item.name}`);
  };

  const unlinkFolder = () => {
    setLinkedFolder(null);
    localStorage.removeItem(DRIVE_FOLDER_KEY);
    toast.success("Folder unlinked");
  };

  const syncNotes = async () => {
    if (!linkedFolder) {
      toast.error("No folder linked");
      return;
    }

    setIsSyncing(true);
    try {
      // Call batch sync edge function
      const { data, error } = await supabase.functions.invoke("google-drive-batch-sync", {
        body: {
          folderId: linkedFolder.id,
          driveId: linkedFolder.driveId,
          folderName: linkedFolder.name,
        },
      });

      if (error) throw error;

      toast.success(`Synced ${data?.synced || 0} items from Google Drive`);
      onSyncComplete?.();
    } catch (error: any) {
      toast.error("Sync failed: " + error.message);
    } finally {
      setIsSyncing(false);
    }
  };

  if (!hasGoogleAuth) {
    return (
      <Button 
        variant="outline" 
        size="sm" 
        onClick={connectGoogle}
        disabled={isConnecting}
      >
        {isConnecting ? (
          <Loader2 className="h-4 w-4 mr-1 animate-spin" />
        ) : (
          <FolderSync className="h-4 w-4 mr-1" />
        )}
        Connect Google
      </Button>
    );
  }

  const renderItemsList = () => (
    <ScrollArea className="h-64 border rounded-md">
      {isLoading ? (
        <div className="flex items-center justify-center h-full">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : items.length === 0 ? (
        <div className="p-4 text-center text-muted-foreground text-sm">
          No items found
        </div>
      ) : (
        <div className="p-2 space-y-1">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between p-2 rounded hover:bg-accent"
            >
              {item.isFolder ? (
                <>
                  <button
                    className="flex items-center gap-2 flex-1"
                    onClick={() => navigateToFolder(item)}
                  >
                    <Folder className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{item.name}</span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground ml-auto" />
                  </button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => linkFolder(item)}
                  >
                    Select
                  </Button>
                </>
              ) : (
                <div className="flex items-center gap-2 flex-1 text-muted-foreground">
                  <FileText className="h-4 w-4" />
                  <span className="text-sm">{item.name}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </ScrollArea>
  );

  return (
    <div className="flex items-center gap-2">
      {linkedFolder ? (
        <>
          <Button
            variant="outline"
            size="sm"
            onClick={syncNotes}
            disabled={isSyncing}
          >
            {isSyncing ? (
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
            ) : (
              <FolderSync className="h-4 w-4 mr-1" />
            )}
            Sync
          </Button>
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-muted-foreground"
                onClick={() => loadItems()}
              >
                {linkedFolder.name}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Change Drive Folder</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>Current:</span>
                  <span className="font-medium text-foreground">{linkedFolder.name}</span>
                  <Button variant="ghost" size="sm" onClick={unlinkFolder}>
                    <Unlink className="h-3 w-3" />
                  </Button>
                </div>
                
                {folderPath.length > 0 && (
                  <Button variant="ghost" size="sm" onClick={navigateBack}>
                    ← Back
                  </Button>
                )}

                {renderItemsList()}
              </div>
            </DialogContent>
          </Dialog>
        </>
      ) : (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              onClick={() => loadItems()}
            >
              <FolderSync className="h-4 w-4 mr-1" />
              Link Drive
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Select Drive Folder for Notes</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {folderPath.length > 0 && (
                <Button variant="ghost" size="sm" onClick={navigateBack}>
                  ← Back
                </Button>
              )}

              {renderItemsList()}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default GoogleDriveNotesSync;
