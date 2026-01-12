import { useState, useMemo } from "react";
import { useCompanyContext } from "@/contexts/CompanyContext";
import { useSuppliers, Supplier } from "@/hooks/useSuppliers";
import { getCurrencySymbol } from "@/lib/currencies";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { SupplierDialog } from "@/components/suppliers/SupplierDialog";
import { SupplierDashboard } from "@/components/suppliers/SupplierDashboard";
import {
  Plus,
  Search,
  MoreHorizontal,
  Pencil,
  Trash2,
  ArrowUpRight,
  ArrowDownLeft,
  Users,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Suppliers() {
  const { selectedCompany } = useCompanyContext();
  const {
    suppliers,
    supplierStats,
    isLoading,
    createSupplier,
    updateSupplier,
    deleteSupplier,
  } = useSuppliers(selectedCompany?.id);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [supplierToDelete, setSupplierToDelete] = useState<Supplier | null>(null);

  const currencySymbol = getCurrencySymbol(selectedCompany?.currency || "NPR");

  const filteredSuppliers = useMemo(() => {
    return suppliers.filter((supplier) => {
      const matchesSearch =
        supplier.name.toLowerCase().includes(search.toLowerCase()) ||
        supplier.contact_person?.toLowerCase().includes(search.toLowerCase()) ||
        supplier.email?.toLowerCase().includes(search.toLowerCase());

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && supplier.is_active) ||
        (statusFilter === "inactive" && !supplier.is_active);

      return matchesSearch && matchesStatus;
    });
  }, [suppliers, search, statusFilter]);

  const getSupplierStats = (supplierId: string) => {
    return supplierStats.find((s) => s.supplier_id === supplierId);
  };

  const handleCreate = (data: any) => {
    if (!selectedCompany) return;
    createSupplier.mutate(
      { ...data, company_id: selectedCompany.id },
      {
        onSuccess: () => setDialogOpen(false),
      }
    );
  };

  const handleUpdate = (data: any) => {
    if (!editingSupplier) return;
    updateSupplier.mutate(
      { id: editingSupplier.id, ...data },
      {
        onSuccess: () => {
          setEditingSupplier(null);
          setDialogOpen(false);
        },
      }
    );
  };

  const handleDelete = () => {
    if (!supplierToDelete) return;
    deleteSupplier.mutate(supplierToDelete.id, {
      onSuccess: () => {
        setSupplierToDelete(null);
        setDeleteDialogOpen(false);
      },
    });
  };

  const openEditDialog = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setDialogOpen(true);
  };

  const openDeleteDialog = (supplier: Supplier) => {
    setSupplierToDelete(supplier);
    setDeleteDialogOpen(true);
  };

  if (!selectedCompany) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <p className="text-muted-foreground">
          Please select a company to manage suppliers.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Suppliers</h1>
          <p className="text-muted-foreground">
            Manage your vendors and track payments
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Supplier
        </Button>
      </div>

      <Tabs defaultValue="dashboard" className="space-y-6">
        <TabsList>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="suppliers">All Suppliers</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard">
          <SupplierDashboard />
        </TabsContent>

        <TabsContent value="suppliers" className="space-y-4">
          {/* Filters */}
          <div className="flex gap-4 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search suppliers..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={(v: any) => setStatusFilter(v)}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Suppliers Table */}
          <Card>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="p-8 text-center text-muted-foreground">
                  Loading suppliers...
                </div>
              ) : filteredSuppliers.length === 0 ? (
                <div className="p-8 text-center">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium">No suppliers found</h3>
                  <p className="text-muted-foreground mb-4">
                    {search || statusFilter !== "all"
                      ? "Try adjusting your filters"
                      : "Add your first supplier to get started"}
                  </p>
                  {!search && statusFilter === "all" && (
                    <Button onClick={() => setDialogOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Supplier
                    </Button>
                  )}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead className="text-right">Paid (Out)</TableHead>
                      <TableHead className="text-right">Received (In)</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-[50px]" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSuppliers.map((supplier) => {
                      const stats = getSupplierStats(supplier.id);
                      return (
                        <TableRow key={supplier.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{supplier.name}</div>
                              {supplier.email && (
                                <div className="text-sm text-muted-foreground">
                                  {supplier.email}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {supplier.contact_person && (
                              <div>{supplier.contact_person}</div>
                            )}
                            {supplier.phone && (
                              <div className="text-sm text-muted-foreground">
                                {supplier.phone}
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1 text-destructive">
                              <ArrowUpRight className="h-3 w-3" />
                              {currencySymbol}{" "}
                              {(stats?.total_paid || 0).toLocaleString()}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1 text-green-500">
                              <ArrowDownLeft className="h-3 w-3" />
                              {currencySymbol}{" "}
                              {(stats?.total_received || 0).toLocaleString()}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={supplier.is_active ? "default" : "secondary"}
                            >
                              {supplier.is_active ? "Active" : "Inactive"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => openEditDialog(supplier)}
                                >
                                  <Pencil className="h-4 w-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => openDeleteDialog(supplier)}
                                  className="text-destructive"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add/Edit Dialog */}
      <SupplierDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditingSupplier(null);
        }}
        supplier={editingSupplier}
        onSubmit={editingSupplier ? handleUpdate : handleCreate}
        isLoading={createSupplier.isPending || updateSupplier.isPending}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Supplier</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{supplierToDelete?.name}"? This
              action cannot be undone. Transactions linked to this supplier will
              remain but will no longer be associated with any supplier.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
