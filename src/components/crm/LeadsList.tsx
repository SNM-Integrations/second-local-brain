import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus, Search, MoreHorizontal, Mail, Phone, Edit, Trash2, UserCheck, PhoneCall, PhoneOff, PhoneIncoming } from "lucide-react";
import { LeadDialog } from "./LeadDialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useOrganization } from "@/hooks/useOrganization";

export interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  status: "new" | "contacted" | "qualified" | "proposal" | "won" | "lost";
  lastContact: string;
  assigned_to: string | null;
  call_status: string | null;
  last_call_duration: number | null;
  last_call_at: string | null;
}

const statusColors: Record<Lead["status"], string> = {
  new: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  contacted: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  qualified: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  proposal: "bg-cyan-500/10 text-cyan-500 border-cyan-500/20",
  won: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  lost: "bg-destructive/10 text-destructive border-destructive/20",
};

// Helper to format call duration
function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins < 60) return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
  const hours = Math.floor(mins / 60);
  const remainingMins = mins % 60;
  return `${hours}h ${remainingMins}m`;
}

// Call status badge component
function CallStatusBadge({ 
  callStatus, 
  lastCallDuration, 
  lastCallAt 
}: { 
  callStatus: string | null; 
  lastCallDuration: number | null;
  lastCallAt: string | null;
}) {
  if (!callStatus) return <span className="text-muted-foreground text-sm">—</span>;
  
  switch (callStatus) {
    case 'ringing':
      return (
        <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/20 gap-1 animate-pulse">
          <PhoneIncoming className="h-3 w-3" />
          Ringing
        </Badge>
      );
    case 'in_call':
      return (
        <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 gap-1">
          <PhoneCall className="h-3 w-3" />
          In Call
        </Badge>
      );
    case 'call_done':
      const durationText = lastCallDuration ? formatDuration(lastCallDuration) : '';
      return (
        <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20 gap-1">
          <PhoneOff className="h-3 w-3" />
          {durationText ? `Done (${durationText})` : 'Call Done'}
        </Badge>
      );
    default:
      return <span className="text-muted-foreground text-sm">{callStatus}</span>;
  }
}

export function LeadsList() {
  const { context } = useOrganization();
  const [search, setSearch] = useState("");
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);

  const loadLeads = async () => {
    setIsLoading(true);
    let query = supabase
      .from("contacts")
      .select("*")
      .eq("contact_type", "lead")
      .order("updated_at", { ascending: false });

    // Filter by context
    if (context.mode === "personal") {
      query = query.eq("visibility", "personal");
    } else if (context.mode === "organization" && context.organizationId) {
      query = query.eq("visibility", "organization").eq("organization_id", context.organizationId);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching leads:", error);
      setLeads([]);
    } else {
      setLeads(
        (data || []).map((c: any) => {
          let status: Lead["status"] = "new";
          if (c.tags?.includes("won")) status = "won";
          else if (c.tags?.includes("lost")) status = "lost";
          else if (c.tags?.includes("proposal")) status = "proposal";
          else if (c.tags?.includes("qualified")) status = "qualified";
          else if (c.tags?.includes("contacted")) status = "contacted";

          return {
            id: c.id,
            name: c.name,
            email: c.email || "",
            phone: c.phone || "",
            company: c.company || "",
            status,
            lastContact: new Date(c.updated_at).toLocaleDateString(),
            assigned_to: c.assigned_to,
            call_status: c.call_status,
            last_call_duration: c.last_call_duration,
            last_call_at: c.last_call_at,
          };
        })
      );
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadLeads();
  }, [context]);

  const filteredLeads = leads.filter(
    (lead) =>
      lead.name.toLowerCase().includes(search.toLowerCase()) ||
      lead.email.toLowerCase().includes(search.toLowerCase()) ||
      lead.company.toLowerCase().includes(search.toLowerCase())
  );

  const handleEdit = (lead: Lead) => {
    setEditingLead(lead);
    setDialogOpen(true);
  };

  const handleAdd = () => {
    setEditingLead(null);
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("contacts").delete().eq("id", id);
    if (error) {
      toast.error("Failed to delete lead");
    } else {
      setLeads((prev) => prev.filter((l) => l.id !== id));
      toast.success("Lead deleted");
    }
  };

  const handleConvertToContact = async (lead: Lead) => {
    const { error } = await supabase
      .from("contacts")
      .update({ contact_type: "contact" })
      .eq("id", lead.id);
    
    if (error) {
      toast.error("Failed to convert lead");
    } else {
      toast.success("Lead converted to contact");
      loadLeads();
    }
  };

  const handleDialogClose = (open: boolean) => {
    setDialogOpen(open);
    if (!open) {
      loadLeads();
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        Loading leads...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search leads..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button onClick={handleAdd} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Lead
        </Button>
      </div>

      <div className="rounded-lg border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Lead</TableHead>
              <TableHead>Company</TableHead>
              <TableHead>Call Status</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last Contact</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredLeads.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  {search ? "No leads found" : "No leads yet. Add one!"}
                </TableCell>
              </TableRow>
            ) : (
              filteredLeads.map((lead) => (
                <TableRow 
                  key={lead.id} 
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleEdit(lead)}
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarFallback className="bg-amber-500/10 text-amber-500 text-sm">
                          {lead.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-foreground">{lead.name}</p>
                        <p className="text-sm text-muted-foreground">{lead.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{lead.company}</TableCell>
                  <TableCell>
                    <CallStatusBadge 
                      callStatus={lead.call_status} 
                      lastCallDuration={lead.last_call_duration}
                      lastCallAt={lead.last_call_at}
                    />
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={statusColors[lead.status]}>
                      {lead.status.charAt(0).toUpperCase() + lead.status.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{lead.lastContact}</TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-popover border-border">
                        <DropdownMenuItem
                          className="gap-2 cursor-pointer"
                          onClick={() => handleEdit(lead)}
                        >
                          <Edit className="h-4 w-4" />
                          Edit / Create Work Order
                        </DropdownMenuItem>
                        <DropdownMenuItem className="gap-2 cursor-pointer">
                          <Mail className="h-4 w-4" />
                          Send Email
                        </DropdownMenuItem>
                        <DropdownMenuItem className="gap-2 cursor-pointer">
                          <Phone className="h-4 w-4" />
                          Call
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="gap-2 cursor-pointer"
                          onClick={() => handleConvertToContact(lead)}
                        >
                          <UserCheck className="h-4 w-4" />
                          Convert to Contact
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="gap-2 cursor-pointer text-destructive focus:text-destructive"
                          onClick={() => handleDelete(lead.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <LeadDialog
        open={dialogOpen}
        onOpenChange={handleDialogClose}
        lead={editingLead}
      />
    </div>
  );
}
