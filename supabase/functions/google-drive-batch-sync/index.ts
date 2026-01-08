import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface DriveItem {
  id: string;
  name: string;
  mimeType: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { folderId, driveId, folderName } = await req.json();

    const itemsToInsert: any[] = [];
    const processedIds = new Set<string>();

    // Recursive function to collect all items
    const collectItems = async (parentId: string | null, dId: string | null, path: string[] = []) => {
      try {
        // Fetch folders and files in parallel
        const [foldersRes, filesRes] = await Promise.all([
          supabase.functions.invoke("google-drive", {
            body: { action: "list-folders", parentId, driveId: dId },
          }),
          supabase.functions.invoke("google-drive", {
            body: { action: "list-files", folderId: parentId, driveId: dId },
          }),
        ]);

        const folders: DriveItem[] = foldersRes.data?.data || [];
        const files: DriveItem[] = filesRes.data?.data || [];

        // Add folders to batch
        for (const folder of folders) {
          if (processedIds.has(folder.id)) continue;
          processedIds.add(folder.id);

          const folderPath = [...path, folder.name];
          itemsToInsert.push({
            user_id: user.id,
            content: `📁 ${folder.name}`,
            drive_file_id: folder.id,
            mime_type: folder.mimeType,
            is_folder: true,
            folder_path: folderPath,
            visibility: "personal",
          });

          // Recurse into subfolder
          await collectItems(folder.id, dId, folderPath);
        }

        // Add files to batch
        for (const file of files) {
          if (processedIds.has(file.id)) continue;
          processedIds.add(file.id);

          const filePath = [...path, file.name];
          
          // Determine icon
          let icon = "📄";
          if (file.mimeType.includes("audio")) icon = "🎵";
          else if (file.mimeType.includes("video")) icon = "🎬";
          else if (file.mimeType.includes("image")) icon = "🖼️";
          else if (file.mimeType.includes("pdf")) icon = "📕";
          else if (file.mimeType.includes("spreadsheet") || file.mimeType.includes("excel")) icon = "📊";
          else if (file.mimeType.includes("presentation") || file.mimeType.includes("powerpoint")) icon = "📽️";
          else if (file.mimeType.includes("document") || file.mimeType.includes("word")) icon = "📝";

          itemsToInsert.push({
            user_id: user.id,
            content: `${icon} ${file.name}`,
            drive_file_id: file.id,
            mime_type: file.mimeType,
            is_folder: false,
            folder_path: filePath,
            visibility: "personal",
          });
        }
      } catch (error) {
        console.error("Error collecting items:", error);
      }
    };

    // Collect all items recursively
    await collectItems(folderId, driveId, [folderName]);

    // Batch process items in chunks
    if (itemsToInsert.length > 0) {
      const chunkSize = 50;
      for (let i = 0; i < itemsToInsert.length; i += chunkSize) {
        const chunk = itemsToInsert.slice(i, i + chunkSize);
        
        // Check existing items in batch
        const driveFileIds = chunk.map(item => item.drive_file_id);
        const { data: existingNotes } = await supabase
          .from("notes")
          .select("id, drive_file_id")
          .eq("user_id", user.id)
          .in("drive_file_id", driveFileIds);

        const existingMap = new Map((existingNotes || []).map(n => [n.drive_file_id, n.id]));

        // Separate updates and inserts
        const updates = [];
        const inserts = [];

        for (const item of chunk) {
          const existingId = existingMap.get(item.drive_file_id);
          if (existingId) {
            updates.push({
              id: existingId,
              content: item.content,
              mime_type: item.mime_type,
              folder_path: item.folder_path,
              updated_at: new Date().toISOString(),
            });
          } else {
            inserts.push(item);
          }
        }

        // Batch updates
        if (updates.length > 0) {
          for (const update of updates) {
            await supabase
              .from("notes")
              .update({
                content: update.content,
                mime_type: update.mime_type,
                folder_path: update.folder_path,
                updated_at: update.updated_at,
              })
              .eq("id", update.id);
          }
        }

        // Batch inserts
        if (inserts.length > 0) {
          await supabase.from("notes").insert(inserts);
        }
      }

      console.log(`Synced ${itemsToInsert.length} items from Google Drive`);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        synced: itemsToInsert.length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Batch sync error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
