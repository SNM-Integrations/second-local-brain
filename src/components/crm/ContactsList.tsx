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
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/components/ui/pagination";
import { Plus, Search, MoreHorizontal, Mail, Phone, Edit, Trash2, Building2 } from "lucide-react";
import { ContactDialog } from "./ContactDialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useOrganization } from "@/hooks/useOrganization";

export interface Contact {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  company_id: string | null;
  relationship: "friend" | "colleague" | "partner" | "network";
  lastContact: string;
  assigned_to: string | null;
}

const relationshipColors: Record<Contact["relationship"], string> = {
  friend: "bg-pink-500/10 text-pink-500 border-pink-500/20",
  colleague: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  partner: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  network: "bg-purple-500/10 text-purple-500 border-purple-500/20",
};

const CONTACTS_PER_PAGE = 10;

interface ContactsListProps {
  onNavigateToCompany?: (companyId: string) => void;
  selectedContactId?: string | null;
  onContactSelected?: (contactId: string | null) => void;
}

export function ContactsList({ 
  onNavigateToCompany, 
  selectedContactId, 
  onContactSelected 
}: ContactsListProps) {
  const { context } = useOrganization();
  const [search, setSearch] = useState("");
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const loadContacts = async () => {
    setIsLoading(true);
    let query = supabase
      .from("contacts")
      .select("*")
      .eq("contact_type", "contact")
      .order("created_at", { ascending: false });

    // Filter by context
    if (context.mode === "personal") {
      query = query.eq("visibility", "personal");
    } else if (context.mode === "organization" && context.organizationId) {
      query = query.eq("visibility", "organization").eq("organization_id", context.organizationId);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching contacts:", error);
      setContacts([]);
    } else {
      setContacts(
        (data || []).map((c) => {
          let relationship: Contact["relationship"] = "network";
          if (c.tags?.includes("friend")) relationship = "friend";
          else if (c.tags?.includes("colleague")) relationship = "colleague";
          else if (c.tags?.includes("partner")) relationship = "partner";

          return {
            id: c.id,
            name: c.name,
            email: c.email || "",
            phone: c.phone || "",
            company: c.company || "",
            company_id: c.company_id || null,
            relationship,
            lastContact: new Date(c.updated_at).toLocaleDateString(),
            assigned_to: c.assigned_to,
          };
        })
      );
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadContacts();
  }, [context]);

  // Auto-open dialog when selectedContactId changes
  useEffect(() => {
    if (selectedContactId && contacts.length > 0) {
      const contact = contacts.find(c => c.id === selectedContactId);
      if (contact) {
        handleEdit(contact);
        onContactSelected?.(null); // Clear selection after opening
      }
    }
  }, [selectedContactId, contacts]);

  const filteredContacts = contacts.filter(
    (contact) =>
      contact.name.toLowerCase().includes(search.toLowerCase()) ||
      contact.email.toLowerCase().includes(search.toLowerCase()) ||
      contact.company.toLowerCase().includes(search.toLowerCase())
  );

  // Pagination logic
  const totalPages = Math.ceil(filteredContacts.length / CONTACTS_PER_PAGE);
  const startIndex = (currentPage - 1) * CONTACTS_PER_PAGE;
  const paginatedContacts = filteredContacts.slice(startIndex, startIndex + CONTACTS_PER_PAGE);

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  const getPageNumbers = () => {
    const pages: (number | 'ellipsis')[] = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push('ellipsis');
      for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
        pages.push(i);
      }
      if (currentPage < totalPages - 2) pages.push('ellipsis');
      pages.push(totalPages);
    }
    return pages;
  };

  const handleEdit = (contact: Contact) => {
    setEditingContact(contact);
    setDialogOpen(true);
  };

  const handleAdd = () => {
    setEditingContact(null);
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("contacts").delete().eq("id", id);
    if (error) {
      toast.error("Failed to delete contact");
    } else {
      setContacts((prev) => prev.filter((c) => c.id !== id));
      toast.success("Contact deleted");
    }
  };

  const handleDialogClose = (open: boolean) => {
    setDialogOpen(open);
    if (!open) {
      loadContacts(); // Refresh list after dialog closes
    }
  };

  const handleCompanyClick = (e: React.MouseEvent, companyId: string | null) => {
    e.stopPropagation();
    if (companyId && onNavigateToCompany) {
      onNavigateToCompany(companyId);
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        Loading contacts...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search contacts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button onClick={handleAdd} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Contact
        </Button>
      </div>

      <div className="rounded-lg border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Contact</TableHead>
              <TableHead>Company</TableHead>
              <TableHead>Relationship</TableHead>
              <TableHead>Last Contact</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedContacts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  {search ? "No contacts found" : "No contacts yet. Add one!"}
                </TableCell>
              </TableRow>
            ) : (
              paginatedContacts.map((contact) => (
                <TableRow 
                  key={contact.id} 
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleEdit(contact)}
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarFallback className="bg-primary/10 text-primary text-sm">
                          {contact.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-foreground">{contact.name}</p>
                        <p className="text-sm text-muted-foreground">{contact.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {contact.company_id ? (
                      <button
                        onClick={(e) => handleCompanyClick(e, contact.company_id)}
                        className="flex items-center gap-1.5 text-primary hover:underline"
                      >
                        <Building2 className="h-4 w-4" />
                        {contact.company}
                      </button>
                    ) : (
                      <span className="text-muted-foreground">{contact.company || "-"}</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={relationshipColors[contact.relationship]}>
                      {contact.relationship.charAt(0).toUpperCase() + contact.relationship.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{contact.lastContact}</TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-popover border-border">
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
                          onClick={() => handleEdit(contact)}
                        >
                          <Edit className="h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="gap-2 cursor-pointer text-destructive focus:text-destructive"
                          onClick={() => handleDelete(contact.id)}
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

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {startIndex + 1}-{Math.min(startIndex + CONTACTS_PER_PAGE, filteredContacts.length)} of {filteredContacts.length} contacts
          </p>
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious 
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                />
              </PaginationItem>
              {getPageNumbers().map((page, idx) => (
                <PaginationItem key={idx}>
                  {page === 'ellipsis' ? (
                    <PaginationEllipsis />
                  ) : (
                    <PaginationLink
                      onClick={() => setCurrentPage(page)}
                      isActive={currentPage === page}
                      className="cursor-pointer"
                    >
                      {page}
                    </PaginationLink>
                  )}
                </PaginationItem>
              ))}
              <PaginationItem>
                <PaginationNext 
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}

      <ContactDialog
        open={dialogOpen}
        onOpenChange={handleDialogClose}
        contact={editingContact}
        onNavigateToCompany={onNavigateToCompany}
      />
    </div>
  );
}
