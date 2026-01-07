import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Send, 
  Mic, 
  Settings, 
  Plus, 
  MessageSquare, 
  FileText, 
  Search, 
  Copy, 
  Check,
  Calendar,
  Users,
  CheckSquare,
  LogOut,
  X,
  Trash2,
  FolderOpen
} from "lucide-react";
import { cn } from "@/lib/utils";
import { 
  streamChat,
  fetchConversations,
  fetchMessages,
  createConversation,
  saveMessage,
  deleteConversation,
  type Conversation 
} from "@/lib/supabase-api";
import { useAuth } from "@/hooks/useAuth";
import { AuthForm } from "@/components/auth/AuthForm";
import NotesPanel from "@/components/notes/NotesPanel";
import SearchPanel from "@/components/search/SearchPanel";
import { CalendarView } from "@/components/calendar/CalendarView";
import { ContactsList } from "@/components/crm/ContactsList";
import { LeadsList } from "@/components/crm/LeadsList";
import { DealsPipeline } from "@/components/crm/DealsPipeline";
import { CompaniesList } from "@/components/crm/CompaniesList";
import { TasksPanel } from "@/components/tasks/TasksPanel";
import { ProjectsPanel } from "@/components/projects/ProjectsPanel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { OrganizationSwitcher } from "@/components/organization/OrganizationSwitcher";
import { PendingInvitations } from "@/components/organization/PendingInvitations";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

type MainTab = "chat" | "calendar" | "crm" | "tasks" | "notes" | "search" | "projects";

const Index = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeTab, setActiveTab] = useState<MainTab>("chat");
  const [chatPanelOpen, setChatPanelOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [crmSubTab, setCrmSubTab] = useState<"contacts" | "leads" | "deals" | "companies">("contacts");
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (user) {
      loadConversations();
    }
  }, [user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const loadConversations = async () => {
    const data = await fetchConversations();
    setConversations(data);
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const userInput = input.trim();
    setInput("");
    setIsLoading(true);

    try {
      // Create conversation if needed
      let currentConvId = conversationId;
      if (!currentConvId) {
        const conv = await createConversation(userInput.slice(0, 50));
        if (!conv) throw new Error("Failed to create conversation");
        currentConvId = conv.id;
        setConversationId(currentConvId);
      }

      // Save user message
      await saveMessage(currentConvId, "user", userInput);

      // Prepare messages for AI
      const chatMessages = [...messages, userMessage].map(m => ({
        role: m.role,
        content: m.content
      }));

      let assistantContent = "";
      
      console.log("Starting streamChat with messages:", chatMessages);
      await streamChat({
        messages: chatMessages,
        conversationId: currentConvId,
        onDelta: (delta) => {
          console.log("Received delta:", delta);
          assistantContent += delta;
          setMessages((prev) => {
            const last = prev[prev.length - 1];
            if (last?.role === "assistant") {
              return prev.map((m, i) => 
                i === prev.length - 1 ? { ...m, content: assistantContent } : m
              );
            }
            return [...prev, {
              id: crypto.randomUUID(),
              role: "assistant" as const,
              content: assistantContent,
              timestamp: new Date(),
            }];
          });
        },
        onDone: async () => {
          console.log("Stream done. Full content:", assistantContent);
          // Save assistant message
          if (currentConvId && assistantContent) {
            await saveMessage(currentConvId, "assistant", assistantContent);
          }
          loadConversations();
        },
      });
    } catch (error: any) {
      toast.error(error.message || "Failed to send message");
      const errorMessage: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: "Sorry, I encountered an error. Please try again.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const startNewConversation = () => {
    setMessages([]);
    setConversationId(null);
  };

  const loadConversation = async (id: string) => {
    try {
      const msgs = await fetchMessages(id);
      setConversationId(id);
      setMessages(
        msgs.map((m) => ({
          id: m.id,
          role: m.role,
          content: m.content,
          timestamp: new Date(m.created_at),
        }))
      );
    } catch {
      toast.error("Failed to load conversation");
    }
  };

  const copyToClipboard = async (text: string, messageId: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(messageId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSearchSelectConversation = (id: string) => {
    loadConversation(id);
    setActiveTab("chat");
  };

  const handleTabChange = (tab: MainTab) => {
    if (tab === "chat") {
      setChatPanelOpen(false);
    }
    setActiveTab(tab);
  };

  // CRM navigation handlers
  const handleNavigateToCompany = (companyId: string) => {
    setSelectedCompanyId(companyId);
    setCrmSubTab("companies");
  };

  const handleNavigateToContact = (contactId: string) => {
    setSelectedContactId(contactId);
    setCrmSubTab("contacts");
  };

  // When on a non-chat tab, show chat as side panel
  const showChatAsSidePanel = activeTab !== "chat" && chatPanelOpen;

  // Show auth form if not logged in
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <AuthForm onSuccess={() => {}} />;
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Left Navigation Bar */}
      <div className="w-16 border-r border-border bg-card/50 flex flex-col items-center py-4 gap-2">
        <Button
          variant={activeTab === "chat" ? "secondary" : "ghost"}
          size="icon"
          onClick={() => handleTabChange("chat")}
          className="h-12 w-12"
          title="Chat"
        >
          <MessageSquare className="h-5 w-5" />
        </Button>
        <Button
          variant={activeTab === "calendar" ? "secondary" : "ghost"}
          size="icon"
          onClick={() => handleTabChange("calendar")}
          className="h-12 w-12"
          title="Calendar"
        >
          <Calendar className="h-5 w-5" />
        </Button>
        <Button
          variant={activeTab === "crm" ? "secondary" : "ghost"}
          size="icon"
          onClick={() => handleTabChange("crm")}
          className="h-12 w-12"
          title="CRM"
        >
          <Users className="h-5 w-5" />
        </Button>
        <Button
          variant={activeTab === "tasks" ? "secondary" : "ghost"}
          size="icon"
          onClick={() => handleTabChange("tasks")}
          className="h-12 w-12"
          title="Tasks"
        >
          <CheckSquare className="h-5 w-5" />
        </Button>
        <Button
          variant={activeTab === "notes" ? "secondary" : "ghost"}
          size="icon"
          onClick={() => handleTabChange("notes")}
          className="h-12 w-12"
          title="Notes"
        >
          <FileText className="h-5 w-5" />
        </Button>
        <Button
          variant={activeTab === "projects" ? "secondary" : "ghost"}
          size="icon"
          onClick={() => handleTabChange("projects")}
          className="h-12 w-12"
          title="Projects"
        >
          <FolderOpen className="h-5 w-5" />
        </Button>
        <Button
          variant={activeTab === "search" ? "secondary" : "ghost"}
          size="icon"
          onClick={() => handleTabChange("search")}
          className="h-12 w-12"
          title="Search"
        >
          <Search className="h-5 w-5" />
        </Button>
        
        <div className="flex-1" />
        
        <Button
          variant="ghost"
          size="icon"
          onClick={() => (window.location.href = "/settings")}
          className="h-12 w-12"
          title="Settings"
        >
          <Settings className="h-5 w-5" />
        </Button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-14 border-b border-border flex items-center px-4 gap-4">
          <OrganizationSwitcher />
          <div className="w-px h-6 bg-border" />
          <h1 className="font-semibold capitalize">{activeTab === "crm" ? "CRM" : activeTab}</h1>
          
          {/* Chat toggle button when not on chat tab */}
          {activeTab !== "chat" && (
            <Button
              variant={chatPanelOpen ? "secondary" : "outline"}
              size="sm"
              onClick={() => setChatPanelOpen(!chatPanelOpen)}
              className="ml-auto gap-2"
            >
              <MessageSquare className="h-4 w-4" />
              {chatPanelOpen ? "Hide Chat" : "Show Chat"}
            </Button>
          )}
          
          {activeTab === "chat" && (
            <div className="ml-auto flex items-center gap-2">
              {conversationId && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={async () => {
                    if (confirm("Delete this conversation?")) {
                      await deleteConversation(conversationId);
                      startNewConversation();
                      loadConversations();
                      toast.success("Conversation deleted");
                    }
                  }} 
                  className="gap-2 text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete Chat
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={signOut} className="gap-2">
                <LogOut className="h-4 w-4" />
                Sign Out
              </Button>
            </div>
          )}
        </header>

        {/* Content with optional chat side panel */}
        <div className="flex-1 flex overflow-hidden">
          {/* Main Tab Content */}
          <div className={cn(
            "flex-1 flex flex-col overflow-hidden transition-all duration-300",
            showChatAsSidePanel && "mr-0"
          )}>
            {/* Chat Tab */}
            {activeTab === "chat" && (
              <div className="flex flex-1 overflow-hidden">
                {/* Conversation History Sidebar */}
                <div className="w-64 border-r border-border flex flex-col">
                  <div className="p-4 border-b border-border">
                    <Button
                      onClick={startNewConversation}
                      className="w-full justify-start gap-2"
                      variant="outline"
                    >
                      <Plus className="h-4 w-4" />
                      New Chat
                    </Button>
                  </div>
                  <ScrollArea className="flex-1">
                    <div className="p-2 space-y-1">
                      {conversations.map((conv) => (
                        <div
                          key={conv.id}
                          onClick={() => loadConversation(conv.id)}
                          className={cn(
                            "w-full text-left p-3 rounded-lg hover:bg-accent transition-colors group flex items-center gap-2 cursor-pointer",
                            conversationId === conv.id && "bg-accent"
                          )}
                        >
                          <MessageSquare className="h-4 w-4 text-muted-foreground shrink-0" />
                          <span className="truncate text-sm flex-1">{conv.title}</span>
                          <button
                            className="h-6 w-6 shrink-0 flex items-center justify-center rounded hover:bg-destructive/20 text-muted-foreground hover:text-destructive"
                            onClick={async (e) => {
                              e.stopPropagation();
                              if (confirm("Delete this conversation?")) {
                                await deleteConversation(conv.id);
                                if (conversationId === conv.id) {
                                  startNewConversation();
                                }
                                loadConversations();
                                toast.success("Conversation deleted");
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                      {conversations.length === 0 && (
                        <p className="text-sm text-muted-foreground p-3">
                          No conversations yet
                        </p>
                      )}
                    </div>
                  </ScrollArea>
                </div>

                {/* Chat Messages */}
                <div className="flex-1 flex flex-col">
                  <ScrollArea className="flex-1 p-4">
                    <div className="max-w-3xl mx-auto space-y-6">
                      {/* Pending Invitations Banner */}
                      <PendingInvitations />
                      
                      {messages.length === 0 && (
                        <div className="text-center py-20">
                          <h2 className="text-2xl font-bold mb-2">Welcome to your Second Brain</h2>
                          <p className="text-muted-foreground">
                            Start a conversation with your AI assistant.
                          </p>
                        </div>
                      )}

                      {messages.map((message) => (
                        <div
                          key={message.id}
                          className={cn(
                            "flex",
                            message.role === "user" ? "justify-end" : "justify-start"
                          )}
                        >
                          <div
                            className={cn(
                              "max-w-[80%] rounded-2xl px-4 py-3 group relative",
                              message.role === "user"
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted"
                            )}
                          >
                            <p className="whitespace-pre-wrap">{message.content}</p>
                            
                            {message.role === "assistant" && (
                              <Button
                                size="icon"
                                variant="ghost"
                                className="absolute -right-10 top-1 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => copyToClipboard(message.content, message.id)}
                              >
                                {copiedId === message.id ? (
                                  <Check className="h-4 w-4 text-green-500" />
                                ) : (
                                  <Copy className="h-4 w-4" />
                                )}
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}

                      {isLoading && (
                        <div className="flex justify-start">
                          <div className="bg-muted rounded-2xl px-4 py-3">
                            <div className="flex gap-1">
                              <span className="w-2 h-2 bg-foreground/50 rounded-full animate-bounce" />
                              <span className="w-2 h-2 bg-foreground/50 rounded-full animate-bounce [animation-delay:100ms]" />
                              <span className="w-2 h-2 bg-foreground/50 rounded-full animate-bounce [animation-delay:200ms]" />
                            </div>
                          </div>
                        </div>
                      )}

                      <div ref={messagesEndRef} />
                    </div>
                  </ScrollArea>

                  {/* Input Area */}
                  <div className="border-t border-border p-4">
                    <div className="max-w-3xl mx-auto flex gap-2">
                      <Textarea
                        ref={textareaRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Message your second brain..."
                        className="min-h-[52px] max-h-[200px] resize-none"
                        rows={1}
                      />
                      <div className="flex flex-col gap-2">
                        <Button
                          size="icon"
                          onClick={handleSend}
                          disabled={!input.trim() || isLoading}
                        >
                          <Send className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="outline" disabled>
                          <Mic className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Calendar Tab */}
            {activeTab === "calendar" && (
              <div className="flex-1 p-4 overflow-auto">
                <CalendarView />
              </div>
            )}

            {/* CRM Tab */}
            {activeTab === "crm" && (
              <div className="flex-1 flex flex-col min-h-0">
                <Tabs value={crmSubTab} onValueChange={(v) => setCrmSubTab(v as any)} className="flex-1 flex flex-col min-h-0">
                  <div className="px-4 pt-2 shrink-0">
                    <TabsList>
                      <TabsTrigger value="contacts">Contacts</TabsTrigger>
                      <TabsTrigger value="leads">Leads</TabsTrigger>
                      <TabsTrigger value="deals">Deals</TabsTrigger>
                      <TabsTrigger value="companies">Companies</TabsTrigger>
                    </TabsList>
                  </div>
                  <TabsContent value="contacts" className="flex-1 overflow-auto mt-0 p-4">
                    <ContactsList 
                      onNavigateToCompany={handleNavigateToCompany}
                      selectedContactId={selectedContactId}
                      onContactSelected={setSelectedContactId}
                    />
                  </TabsContent>
                  <TabsContent value="leads" className="flex-1 overflow-auto mt-0 p-4">
                    <LeadsList />
                  </TabsContent>
                  <TabsContent value="deals" className="flex-1 overflow-auto mt-0 p-4">
                    <DealsPipeline />
                  </TabsContent>
                  <TabsContent value="companies" className="flex-1 overflow-auto mt-0 p-4">
                    <CompaniesList 
                      onNavigateToContact={handleNavigateToContact}
                      selectedCompanyId={selectedCompanyId}
                      onCompanySelected={setSelectedCompanyId}
                    />
                  </TabsContent>
                </Tabs>
              </div>
            )}

            {/* Tasks Tab */}
            {activeTab === "tasks" && (
              <div className="flex-1 overflow-hidden">
                <TasksPanel />
              </div>
            )}

            {/* Notes Tab */}
            {activeTab === "notes" && (
              <div className="flex-1 overflow-hidden">
                <NotesPanel />
              </div>
            )}

            {/* Projects Tab */}
            {activeTab === "projects" && (
              <div className="flex-1 overflow-hidden">
                <ProjectsPanel />
              </div>
            )}

            {/* Search Tab */}
            {activeTab === "search" && (
              <div className="flex-1 overflow-hidden">
                <SearchPanel onSelectConversation={handleSearchSelectConversation} />
              </div>
            )}
          </div>

          {/* Collapsible Chat Side Panel */}
          {showChatAsSidePanel && (
            <div className="w-96 border-l border-border flex flex-col bg-card/50">
              <div className="h-12 border-b border-border flex items-center px-3 gap-2">
                <MessageSquare className="h-4 w-4" />
                <span className="font-medium text-sm">Chat</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="ml-auto h-8 w-8"
                  onClick={() => setChatPanelOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              <ScrollArea className="flex-1 p-3">
                <div className="space-y-4">
                  {messages.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      No messages yet
                    </p>
                  )}
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={cn(
                        "flex",
                        message.role === "user" ? "justify-end" : "justify-start"
                      )}
                    >
                      <div
                        className={cn(
                          "max-w-[85%] rounded-xl px-3 py-2 text-sm",
                          message.role === "user"
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted"
                        )}
                      >
                        <p className="whitespace-pre-wrap">{message.content}</p>
                      </div>
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="bg-muted rounded-xl px-3 py-2">
                        <div className="flex gap-1">
                          <span className="w-1.5 h-1.5 bg-foreground/50 rounded-full animate-bounce" />
                          <span className="w-1.5 h-1.5 bg-foreground/50 rounded-full animate-bounce [animation-delay:100ms]" />
                          <span className="w-1.5 h-1.5 bg-foreground/50 rounded-full animate-bounce [animation-delay:200ms]" />
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>
              
              <div className="border-t border-border p-3">
                <div className="flex gap-2">
                  <Textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Message..."
                    className="min-h-[40px] max-h-[100px] resize-none text-sm"
                    rows={1}
                  />
                  <Button
                    size="icon"
                    onClick={handleSend}
                    disabled={!input.trim() || isLoading}
                    className="shrink-0"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Index;
