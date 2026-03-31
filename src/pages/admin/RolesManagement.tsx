import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  UserCog,
  Search,
  Edit,
  Trash2,
  Shield,
  Loader2,
} from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useRoles } from "@/api/hooks/useRoles";
import { useSelector } from "react-redux";
import type { RootState } from "@/redux/store/store";
import { canManageRoles } from "@/lib/permissions";
import { Role, CreateRoleRequest } from "@/api/types";
import { RolePermissionsDialog } from "@/components/admin/RolePermissionsDialog";
import { RoleDetailsDialog } from "@/components/admin/RoleDetailsDialog";
import { RoleEditDialog } from "@/components/admin/RoleEditDialog";
import PageHeader from "@/components/common/PageHeader";
import PageLoader from "@/components/common/PageLoader";
import BlockPage from "@/components/common/BlockPage";

export default function RolesManagement() {
  const { toast } = useToast();

  const loginState = useSelector((state: RootState) => state.auth.loginState);
  const { roles, isLoadingRoles, createRole, isCreatingRole, deleteRole, isDeletingRole } = useRoles();

  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isPermissionsDialogOpen, setIsPermissionsDialogOpen] = useState(false);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [roleToDelete, setRoleToDelete] = useState<Role | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [formData, setFormData] = useState<CreateRoleRequest>({
    roleName: "",
    description: "",
  });

  // Check permissions
  const canCreate = canManageRoles(loginState as any, 'create');
  const canRead = canManageRoles(loginState as any, 'read');
  const canUpdate = canManageRoles(loginState as any, 'update');
  const canDelete = canManageRoles(loginState as any, 'delete');

  const filteredRoles = roles.filter((role) =>
    (role.roleName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (role.description || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Create Role API Handlers
  const handleCreateRole = async () => {
    if (!formData.roleName.trim()) {
      toast({
        title: "Error",
        description: "Role name is required",
        variant: "destructive",
      });
      return;
    }

    createRole(formData, {
      onSuccess: () => {
        closeRoleModal();
      },
    });
  };

  // Delete Role API Handlers
  const handleDeleteRole = () => {
    if (!roleToDelete) return;

    deleteRole(roleToDelete.id, {
      onSuccess: () => {
        setIsDeleteDialogOpen(false);
        setRoleToDelete(null);
      },
    });
  };


  // Open Create Roles modal - Header button
  const openRoleModal = () => {
    setIsCreateDialogOpen(true);
  };

  const closeRoleModal = () => {
    setIsCreateDialogOpen(false);
    setFormData({ roleName: "", description: "" });
  };


  // Role Details Dialog handlers
  const openRoleDetailsModal = (role) => {
    setSelectedRole(role);
    setIsDetailsDialogOpen(true);
  };

  const closeRoleDetailsModal = () => {
    setSelectedRole(null);
    setIsDetailsDialogOpen(false);
  };


  // Edit Role Dialog handlers
  const openRoleEditModal = () => {
    setIsDetailsDialogOpen(false);
    setIsEditDialogOpen(true);
  };

  const closeRoleEditModal = () => {
    setIsEditDialogOpen(false);
    setSelectedRole(null);
  };


  // Role Permissions Dialog handlers
  const openPermissionModal = (role) => {
    setSelectedRole(role);
    setIsPermissionsDialogOpen(true);
  };

  const closePermissionModal = () => {
    setSelectedRole(null);
    setIsPermissionsDialogOpen(false);
  };


  if (!canRead) {
    return (
      <BlockPage message="You don't have permission to view roles." />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        page="roles"
        heading="Roles Management"
        subHeading="Manage user roles and their permissions"
        openModal={openRoleModal}
      />

      <Card>
        {/* Search section */}
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>All Roles</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search roles..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>

        {/* List of Roles */}
        <CardContent>
          {isLoadingRoles ? (
            <PageLoader pagename="roles" />
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Role Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>ID</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRoles?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        <div className="flex flex-col items-center">
                          <UserCog className="h-12 w-12 mb-4" />
                          <p>No roles found</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredRoles?.map((role) => (
                      <TableRow
                        key={role.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => { openRoleDetailsModal(role) }}
                      >
                        <TableCell className="font-medium">{role.roleName}</TableCell>
                        <TableCell>{role.description || '-'}</TableCell>
                        <TableCell>
                          <Badge variant={role.isActive ? "secondary" : "outline"}>
                            {role.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell>{role.id}</TableCell>
                        <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex justify-end gap-2">
                            {canUpdate && (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openPermissionModal(role);
                                  }}
                                >
                                  <Shield className="h-4 w-4 mr-2" />
                                  Permissions
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedRole(role);
                                    setIsEditDialogOpen(true);
                                  }}
                                >
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit
                                </Button>
                              </>
                            )}
                            {canDelete && (
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setRoleToDelete(role);
                                  setIsDeleteDialogOpen(true);
                                }}
                                disabled={isDeletingRole}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Role Dialog */}
      {canCreate && (
        <Dialog open={isCreateDialogOpen} onOpenChange={closeRoleModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Role</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="roleName">Role Name</Label>
                <Input
                  id="roleName"
                  placeholder="e.g., admin, moderator"
                  value={formData.roleName}
                  onChange={(e) =>
                    setFormData({ ...formData, roleName: e.target.value })
                  }
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Use lowercase with underscores (e.g., admin, super_admin)
                </p>
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe the role's purpose..."
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                />
              </div>
              <Button
                onClick={handleCreateRole}
                disabled={isCreatingRole}
                className="w-full bg-brand-green hover:bg-brand-green/90"
              >
                {isCreatingRole ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Role"
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Role Details Dialog */}
      {selectedRole && (
        <RoleDetailsDialog
          role={selectedRole}
          isOpen={isDetailsDialogOpen}
          onClose={closeRoleDetailsModal}
          onEdit={openRoleEditModal}
        />
      )}


      {/* Edit Role Dialog */}
      {selectedRole && (
        <RoleEditDialog
          role={selectedRole}
          isOpen={isEditDialogOpen}
          onClose={closeRoleEditModal}
        />
      )}


      {/* Role Permissions Dialog */}
      {selectedRole && (
        <RolePermissionsDialog
          roleId={selectedRole.id}
          roleName={selectedRole.roleName}
          isOpen={isPermissionsDialogOpen}
          onClose={closePermissionModal}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Role</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Are you sure you want to delete the role <strong>{roleToDelete?.roleName}</strong>?
            </p>
            <p className="text-xs text-muted-foreground">
              <strong>Note:</strong> This role cannot be deleted if it is assigned to any user or has permissions assigned.
              You must first remove the role from all users and remove all permissions from the role.
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteRole}
                disabled={isDeletingRole}
              >
                {isDeletingRole ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  "Delete"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

