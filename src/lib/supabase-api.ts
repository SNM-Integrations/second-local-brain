// Cloud API client using Supabase
import { supabase } from "@/integrations/supabase/client";

// Context filter for organization-aware queries
export interface OrgContextFilter {
  mode: "personal" | "organization";
  organizationId: string | null;
}

// Types
export interface Note {
  id: string;
  content: string;
  formatted_content: string | null;
  category_id: string | null;
  drive_file_id?: string | null;
  mime_type?: string | null;
  is_folder?: boolean;
  folder_path?: string[] | null;
  created_at: string;
  updated_at: string;
}

export interface Conversation {
  id: string;
  title: string | null;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

export interface Contact {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  role: string | null;
  notes: string | null;
  tags: string[];
  contact_type: "contact" | "lead";
  created_at: string;
  updated_at: string;
}

export interface Company {
  id: string;
  name: string;
  industry: string | null;
  website: string | null;
  employees: number | null;
  revenue: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Deal {
  id: string;
  title: string;
  value: number;
  stage: string;
  contact_id: string | null;
  company_id: string | null;
  expected_close_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface SearchResult {
  id: string;
  content: string;
  score: number;
  type: "note" | "conversation";
}

export interface Task {
  id: string;
  title: string;
  description: string | null;
  completed: boolean;
  priority: "low" | "medium" | "high";
  due_date: string | null;
  category_id: string | null;
  project_id: string | null;
  assigned_to: string | null;
  parent_task_id: string | null;
  notification_settings: string[];
  notifications_sent: string[];
  visibility: "personal" | "organization";
  organization_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  name: string;
  description: string | null;
  company_id: string | null;
  organization_id: string | null;
  visibility: "personal" | "organization";
  assigned_to: string | null;
  status: string;
  color: string | null;
  drive_folder_id: string | null;
  drive_folder_name: string | null;
  drive_last_synced_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProjectDocument {
  id: string;
  project_id: string;
  user_id: string;
  type: "file" | "document";
  name: string;
  content: string | null;
  file_path: string | null;
  file_size: number | null;
  mime_type: string | null;
  created_at: string;
  updated_at: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  description: string | null;
  start_time: string;
  end_time: string;
  location: string | null;
  project_id: string | null;
  created_at: string;
  updated_at: string;
}

// ============ NOTES ============
export async function fetchNotes(): Promise<Note[]> {
  const { data, error } = await supabase
    .from("notes")
    .select("id, content, formatted_content, category_id, drive_file_id, mime_type, is_folder, folder_path, created_at, updated_at")
    .order("updated_at", { ascending: false });
  
  if (error) {
    console.error("Error fetching notes:", error);
    return [];
  }
  return data || [];
}

export async function createNote(content: string): Promise<Note | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("notes")
    .insert({ content, user_id: user.id })
    .select()
    .single();
  
  if (error) {
    console.error("Error creating note:", error);
    return null;
  }
  return data;
}

export async function updateNote(id: string, content: string): Promise<Note | null> {
  const { data, error } = await supabase
    .from("notes")
    .update({ content, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  
  if (error) {
    console.error("Error updating note:", error);
    return null;
  }
  return data;
}

export async function deleteNote(id: string): Promise<boolean> {
  const { error } = await supabase.from("notes").delete().eq("id", id);
  if (error) {
    console.error("Error deleting note:", error);
    return false;
  }
  return true;
}

export async function searchNotes(query: string): Promise<Note[]> {
  const { data, error } = await supabase
    .from("notes")
    .select("id, content, formatted_content, category_id, created_at, updated_at")
    .ilike("content", `%${query}%`)
    .order("updated_at", { ascending: false })
    .limit(20);

  if (error) {
    console.error("Error searching notes:", error);
    return [];
  }
  return data || [];
}

// ============ SEARCH (combined) ============
export async function searchMemory(query: string): Promise<SearchResult[]> {
  const results: SearchResult[] = [];

  // Search notes
  const notes = await searchNotes(query);
  for (const note of notes) {
    results.push({
      id: note.id,
      content: note.content.slice(0, 200),
      score: 0.8, // Placeholder score for text search
      type: "note",
    });
  }

  // Search messages in conversations
  const { data: messages } = await supabase
    .from("messages")
    .select("id, conversation_id, content")
    .ilike("content", `%${query}%`)
    .limit(10);

  if (messages) {
    for (const msg of messages) {
      results.push({
        id: msg.conversation_id,
        content: msg.content.slice(0, 200),
        score: 0.7,
        type: "conversation",
      });
    }
  }

  return results;
}

// ============ CONVERSATIONS ============
export async function fetchConversations(): Promise<Conversation[]> {
  const { data, error } = await supabase
    .from("conversations")
    .select("*")
    .order("updated_at", { ascending: false });
  
  if (error) {
    console.error("Error fetching conversations:", error);
    return [];
  }
  return data || [];
}

export async function createConversation(title?: string): Promise<Conversation | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("conversations")
    .insert({ title: title || "New Chat", user_id: user.id })
    .select()
    .single();
  
  if (error) {
    console.error("Error creating conversation:", error);
    return null;
  }
  return data;
}

export async function deleteConversation(id: string): Promise<boolean> {
  const { error } = await supabase.from("conversations").delete().eq("id", id);
  if (error) {
    console.error("Error deleting conversation:", error);
    return false;
  }
  return true;
}

// ============ MESSAGES ============
export async function fetchMessages(conversationId: string): Promise<Message[]> {
  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });
  
  if (error) {
    console.error("Error fetching messages:", error);
    return [];
  }
  return (data || []).map(m => ({
    ...m,
    role: m.role as "user" | "assistant"
  }));
}

export async function saveMessage(conversationId: string, role: "user" | "assistant", content: string): Promise<Message | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("messages")
    .insert({ conversation_id: conversationId, role, content, user_id: user.id })
    .select()
    .single();
  
  if (error) {
    console.error("Error saving message:", error);
    return null;
  }
  
  // Update conversation's updated_at
  await supabase
    .from("conversations")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", conversationId);
  
  return data ? { ...data, role: data.role as "user" | "assistant" } : null;
}

// ============ CONTACTS ============
export async function fetchContacts(context?: OrgContextFilter): Promise<Contact[]> {
  let query = supabase
    .from("contacts")
    .select("*")
    .order("name", { ascending: true });
  
  // Filter by context
  if (context) {
    if (context.mode === "personal") {
      query = query.eq("visibility", "personal");
    } else if (context.mode === "organization" && context.organizationId) {
      query = query.eq("visibility", "organization").eq("organization_id", context.organizationId);
    }
  }
  
  const { data, error } = await query;
  
  if (error) {
    console.error("Error fetching contacts:", error);
    return [];
  }
  return data || [];
}

export async function createContact(contact: Omit<Contact, "id" | "created_at" | "updated_at">): Promise<Contact | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("contacts")
    .insert({ ...contact, user_id: user.id })
    .select()
    .single();
  
  if (error) {
    console.error("Error creating contact:", error);
    return null;
  }
  return data;
}

export async function updateContact(id: string, contact: Partial<Contact>): Promise<Contact | null> {
  const { data, error } = await supabase
    .from("contacts")
    .update({ ...contact, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  
  if (error) {
    console.error("Error updating contact:", error);
    return null;
  }
  return data;
}

export async function deleteContact(id: string): Promise<boolean> {
  const { error } = await supabase.from("contacts").delete().eq("id", id);
  if (error) {
    console.error("Error deleting contact:", error);
    return false;
  }
  return true;
}

// ============ COMPANIES ============
export async function fetchCompanies(context?: OrgContextFilter): Promise<Company[]> {
  let query = supabase
    .from("companies")
    .select("*")
    .order("name", { ascending: true });
  
  // Filter by context
  if (context) {
    if (context.mode === "personal") {
      query = query.eq("visibility", "personal");
    } else if (context.mode === "organization" && context.organizationId) {
      query = query.eq("visibility", "organization").eq("organization_id", context.organizationId);
    }
  }
  
  const { data, error } = await query;
  
  if (error) {
    console.error("Error fetching companies:", error);
    return [];
  }
  return data || [];
}

export async function createCompany(company: Omit<Company, "id" | "created_at" | "updated_at">): Promise<Company | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("companies")
    .insert({ ...company, user_id: user.id })
    .select()
    .single();
  
  if (error) {
    console.error("Error creating company:", error);
    return null;
  }
  return data;
}

export async function updateCompany(id: string, company: Partial<Company>): Promise<Company | null> {
  const { data, error } = await supabase
    .from("companies")
    .update({ ...company, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  
  if (error) {
    console.error("Error updating company:", error);
    return null;
  }
  return data;
}

export async function deleteCompany(id: string): Promise<boolean> {
  const { error } = await supabase.from("companies").delete().eq("id", id);
  if (error) {
    console.error("Error deleting company:", error);
    return false;
  }
  return true;
}

// ============ DEALS ============
export async function fetchDeals(context?: OrgContextFilter): Promise<Deal[]> {
  let query = supabase
    .from("deals")
    .select("*")
    .order("created_at", { ascending: false });
  
  // Filter by context
  if (context) {
    if (context.mode === "personal") {
      query = query.eq("visibility", "personal");
    } else if (context.mode === "organization" && context.organizationId) {
      query = query.eq("visibility", "organization").eq("organization_id", context.organizationId);
    }
  }
  
  const { data, error } = await query;
  
  if (error) {
    console.error("Error fetching deals:", error);
    return [];
  }
  return data || [];
}

export async function createDeal(deal: Omit<Deal, "id" | "created_at" | "updated_at">): Promise<Deal | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("deals")
    .insert({ ...deal, user_id: user.id })
    .select()
    .single();
  
  if (error) {
    console.error("Error creating deal:", error);
    return null;
  }
  return data;
}

export async function updateDeal(id: string, deal: Partial<Deal>): Promise<Deal | null> {
  const { data, error } = await supabase
    .from("deals")
    .update({ ...deal, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  
  if (error) {
    console.error("Error updating deal:", error);
    return null;
  }
  return data;
}

export async function deleteDeal(id: string): Promise<boolean> {
  const { error } = await supabase.from("deals").delete().eq("id", id);
  if (error) {
    console.error("Error deleting deal:", error);
    return false;
  }
  return true;
}

// ============ TASKS ============
export async function fetchTasks(context?: OrgContextFilter): Promise<Task[]> {
  let query = supabase
    .from("tasks")
    .select("*")
    .order("created_at", { ascending: false });
  
  // Filter by context
  if (context) {
    if (context.mode === "personal") {
      query = query.eq("visibility", "personal");
    } else if (context.mode === "organization" && context.organizationId) {
      query = query.eq("visibility", "organization").eq("organization_id", context.organizationId);
    }
  }
  
  const { data, error } = await query;
  
  if (error) {
    console.error("Error fetching tasks:", error);
    return [];
  }
  return (data || []).map(t => ({
    ...t,
    priority: t.priority as "low" | "medium" | "high",
    visibility: t.visibility as "personal" | "organization"
  }));
}

export async function createTask(task: Omit<Task, "id" | "created_at" | "updated_at" | "category_id">): Promise<Task | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("tasks")
    .insert({ ...task, user_id: user.id })
    .select()
    .single();
  
  if (error) {
    console.error("Error creating task:", error);
    return null;
  }
  return data ? { 
    ...data, 
    priority: data.priority as "low" | "medium" | "high",
    visibility: data.visibility as "personal" | "organization"
  } : null;
}

export async function updateTask(id: string, task: Partial<Task>): Promise<Task | null> {
  const { data, error } = await supabase
    .from("tasks")
    .update({ ...task, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  
  if (error) {
    console.error("Error updating task:", error);
    return null;
  }
  return data ? { ...data, priority: data.priority as "low" | "medium" | "high" } : null;
}

export async function deleteTask(id: string): Promise<boolean> {
  const { error } = await supabase.from("tasks").delete().eq("id", id);
  if (error) {
    console.error("Error deleting task:", error);
    return false;
  }
  return true;
}

// ============ PROJECTS ============
export async function fetchProjects(context?: OrgContextFilter): Promise<Project[]> {
  let query = supabase
    .from("projects")
    .select("*")
    .order("updated_at", { ascending: false });
  
  // Filter by context
  if (context) {
    if (context.mode === "personal") {
      query = query.eq("visibility", "personal");
    } else if (context.mode === "organization" && context.organizationId) {
      query = query.eq("visibility", "organization").eq("organization_id", context.organizationId);
    }
  }
  
  const { data, error } = await query;
  
  if (error) {
    console.error("Error fetching projects:", error);
    return [];
  }
  return (data || []).map(p => ({
    ...p,
    visibility: p.visibility as "personal" | "organization"
  }));
}

export async function createProject(project: Omit<Project, "id" | "created_at" | "updated_at" | "drive_folder_id" | "drive_folder_name" | "drive_last_synced_at">): Promise<Project | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("projects")
    .insert({ ...project, user_id: user.id })
    .select()
    .single();
  
  if (error) {
    console.error("Error creating project:", error);
    return null;
  }
  return data ? { ...data, visibility: data.visibility as "personal" | "organization" } : null;
}

export async function updateProject(id: string, project: Partial<Project>): Promise<Project | null> {
  const { data, error } = await supabase
    .from("projects")
    .update({ ...project, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  
  if (error) {
    console.error("Error updating project:", error);
    return null;
  }
  return data ? { ...data, visibility: data.visibility as "personal" | "organization" } : null;
}

export async function deleteProject(id: string): Promise<boolean> {
  const { error } = await supabase.from("projects").delete().eq("id", id);
  if (error) {
    console.error("Error deleting project:", error);
    return false;
  }
  return true;
}

// ============ PROJECT DOCUMENTS ============
export async function fetchProjectDocuments(projectId: string): Promise<ProjectDocument[]> {
  const { data, error } = await supabase
    .from("project_documents")
    .select("*")
    .eq("project_id", projectId)
    .order("updated_at", { ascending: false });
  
  if (error) {
    console.error("Error fetching project documents:", error);
    return [];
  }
  return (data || []).map(d => ({
    ...d,
    type: d.type as "file" | "document"
  }));
}

export async function createProjectDocument(
  projectId: string, 
  doc: { name: string; type: "file" | "document"; content?: string; file_path?: string; file_size?: number; mime_type?: string }
): Promise<ProjectDocument | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("project_documents")
    .insert({ 
      project_id: projectId, 
      user_id: user.id,
      name: doc.name,
      type: doc.type,
      content: doc.content || null,
      file_path: doc.file_path || null,
      file_size: doc.file_size || null,
      mime_type: doc.mime_type || null
    })
    .select()
    .single();
  
  if (error) {
    console.error("Error creating project document:", error);
    return null;
  }
  return data ? { ...data, type: data.type as "file" | "document" } : null;
}

export async function updateProjectDocument(id: string, doc: Partial<ProjectDocument>): Promise<ProjectDocument | null> {
  const { data, error } = await supabase
    .from("project_documents")
    .update({ ...doc, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  
  if (error) {
    console.error("Error updating project document:", error);
    return null;
  }
  return data ? { ...data, type: data.type as "file" | "document" } : null;
}

export async function deleteProjectDocument(id: string): Promise<boolean> {
  const { error } = await supabase.from("project_documents").delete().eq("id", id);
  if (error) {
    console.error("Error deleting project document:", error);
    return false;
  }
  return true;
}

export async function uploadProjectFile(projectId: string, file: File): Promise<ProjectDocument | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const filePath = `${user.id}/${projectId}/${Date.now()}_${file.name}`;
  
  const { error: uploadError } = await supabase.storage
    .from("project-files")
    .upload(filePath, file);
  
  if (uploadError) {
    console.error("Error uploading file:", uploadError);
    return null;
  }

  return createProjectDocument(projectId, {
    name: file.name,
    type: "file",
    file_path: filePath,
    file_size: file.size,
    mime_type: file.type
  });
}

export async function downloadProjectFile(filePath: string): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from("project-files")
    .createSignedUrl(filePath, 3600); // 1 hour expiry
  
  if (error) {
    console.error("Error creating download URL:", error);
    return null;
  }
  return data.signedUrl;
}

// ============ PROJECT RELATED ITEMS ============
export async function fetchProjectTasks(projectId: string): Promise<Task[]> {
  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });
  
  if (error) {
    console.error("Error fetching project tasks:", error);
    return [];
  }
  return (data || []).map(t => ({
    ...t,
    priority: t.priority as "low" | "medium" | "high",
    visibility: t.visibility as "personal" | "organization"
  }));
}

export async function fetchProjectCalendarEvents(projectId: string): Promise<CalendarEvent[]> {
  const { data, error } = await supabase
    .from("calendar_events")
    .select("*")
    .eq("project_id", projectId)
    .order("start_time", { ascending: true });
  
  if (error) {
    console.error("Error fetching project calendar events:", error);
    return [];
  }
  return data || [];
}

// ============ AI CHAT (Streaming) ============
export async function streamChat({
  messages,
  conversationId,
  onDelta,
  onDone,
}: {
  messages: { role: "user" | "assistant"; content: string }[];
  conversationId?: string;
  onDelta: (deltaText: string) => void;
  onDone: () => void;
}) {
  // Use fallback URL since env var may not be available in deployed builds
  const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://pccvvqmrwbcdjgkyteqn.supabase.co';
  const CHAT_URL = `${SUPABASE_URL}/functions/v1/chat`;
  console.log("Chat URL:", CHAT_URL);
  
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    console.error("No session found - user not authenticated");
    throw new Error("Not authenticated");
  }
  console.log("Session found, user:", session.user.email);

  try {
    console.log("Calling edge function with messages:", messages.length);
    const resp = await fetch(CHAT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ messages, conversationId }),
    });

    console.log("Response status:", resp.status);

    if (!resp.ok) {
      const errorText = await resp.text();
      console.error("Error response:", errorText);
      throw new Error(errorText || `Chat failed: ${resp.status}`);
    }

    if (!resp.body) {
      console.error("No response body");
      throw new Error("No response body");
    }
    
    console.log("Got response body, starting stream...");

  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let textBuffer = "";
  let streamDone = false;

  while (!streamDone) {
    const { done, value } = await reader.read();
    if (done) break;
    textBuffer += decoder.decode(value, { stream: true });

    let newlineIndex: number;
    while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
      let line = textBuffer.slice(0, newlineIndex);
      textBuffer = textBuffer.slice(newlineIndex + 1);

      if (line.endsWith("\r")) line = line.slice(0, -1);
      if (line.startsWith(":") || line.trim() === "") continue;
      if (!line.startsWith("data: ")) continue;

      const jsonStr = line.slice(6).trim();
      if (jsonStr === "[DONE]") {
        streamDone = true;
        break;
      }

      try {
        const parsed = JSON.parse(jsonStr);
        const content = parsed.choices?.[0]?.delta?.content as string | undefined;
        if (content) onDelta(content);
      } catch {
        textBuffer = line + "\n" + textBuffer;
        break;
      }
    }
  }

  // Final flush
  if (textBuffer.trim()) {
    for (let raw of textBuffer.split("\n")) {
      if (!raw) continue;
      if (raw.endsWith("\r")) raw = raw.slice(0, -1);
      if (raw.startsWith(":") || raw.trim() === "") continue;
      if (!raw.startsWith("data: ")) continue;
      const jsonStr = raw.slice(6).trim();
      if (jsonStr === "[DONE]") continue;
      try {
        const parsed = JSON.parse(jsonStr);
        const content = parsed.choices?.[0]?.delta?.content as string | undefined;
        if (content) onDelta(content);
      } catch { /* ignore */ }
    }
  }

  onDone();
  } catch (error) {
    console.error("Fetch error:", error);
    throw error;
  }
}
