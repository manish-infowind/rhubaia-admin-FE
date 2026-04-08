import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
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
  Key,
  Search,
  Edit,
  Trash2,
  Loader2,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { usePermissions } from "@/api/hooks/usePermissions";
import { useSelector } from "react-redux";
import type { RootState } from "@/redux/store/store";
import { canManagePermissions } from "@/lib/permissions";
import { Permission, CreatePermissionRequest } from "@/api/types";
import PageHeader from "@/components/common/PageHeader";
import BlockPage from "@/components/common/BlockPage";

export default function PermissionsManagement() {
  const { toast } = useToast();
  const loginState = useSelector((state: RootState) => state.auth.loginState);
  const { permissions, isLoadingPermissions, createPermission, isCreatingPermission, updatePermission, isUpdatingPermission, deletePermission, isDeletingPermission } = usePermissions();
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [formData, setFormData] = useState<CreatePermissionRequest>({
    permissionName: "",
    allowedActions: undefined,
  });
  const [selectedActions, setSelectedActions] = useState<{
    create: boolean;
    read: boolean;
    update: boolean;
    delete: boolean;
  }>({
    create: true,
    read: true,
    update: true,
    delete: true,
  });
  const [permissionToDelete, setPermissionToDelete] = useState<Permission | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [permissionToEdit, setPermissionToEdit] = useState<Permission | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editSelectedActions, setEditSelectedActions] = useState<{
    create: boolean;
    read: boolean;
    update: boolean;
    delete: boolean;
  }>({
    create: true,
    read: true,
    update: true,
    delete: true,
  });

  // Check permissions
  const canCreate = canManagePermissions(loginState as any, 'create');
  const canRead = canManagePermissions(loginState as any, 'read');
  const canUpdate = canManagePermissions(loginState as any, 'update');
  const canDelete = canManagePermissions(loginState as any, 'delete');

  const filteredPermissions = permissions.filter((permission) =>
    (permission.permissionName || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreatePermission = async () => {
    if (!formData.permissionName.trim()) {
      toast({
        title: "Error",
        description: "Permission name is required",
        variant: "destructive",
      });
      return;
    }

    // Build allowedActions array from selected actions
    const allowedActions: string[] = [];
    if (selectedActions.create) allowedActions.push('create');
    if (selectedActions.read) allowedActions.push('read');
    if (selectedActions.update) allowedActions.push('update');
    if (selectedActions.delete) allowedActions.push('delete');

    // If all actions are selected, don't send allowedActions (means all allowed)
    const requestData: CreatePermissionRequest = {
      permissionName: formData.permissionName,
      ...(allowedActions.length < 4 ? { allowedActions } : {}),
    };

    createPermission(requestData, {
      onSuccess: () => {
        setIsCreateDialogOpen(false);
        setFormData({ permissionName: "", allowedActions: undefined });
        setSelectedActions({
          create: true,
          read: true,
          update: true,
          delete: true,
        });
      },
    });
  };

  const formatAllowedActions = (allowedActions: string[] | null): string => {
    if (!allowedActions || allowedActions.length === 0) {
      return "All Actions";
    }
    return allowedActions.map(a => a.charAt(0).toUpperCase() + a.slice(1)).join(", ");
  };

  // Initialize edit dialog when permission is selected
  useEffect(() => {
    if (permissionToEdit) {
      const allowedActions = permissionToEdit.allowedActions || ['create', 'read', 'update', 'delete'];
      setEditSelectedActions({
        create: allowedActions.includes('create'),
        read: allowedActions.includes('read'),
        update: allowedActions.includes('update'),
        delete: allowedActions.includes('delete'),
      });
    }
  }, [permissionToEdit]);

  const handleUpdatePermission = () => {
    if (!permissionToEdit) return;

    // Build allowedActions array from selected actions
    const allowedActions: string[] = [];
    if (editSelectedActions.create) allowedActions.push('create');
    if (editSelectedActions.read) allowedActions.push('read');
    if (editSelectedActions.update) allowedActions.push('update');
    if (editSelectedActions.delete) allowedActions.push('delete');

    // If all actions are selected, don't send allowedActions (means all allowed)
    const requestData = allowedActions.length < 4 ? { allowedActions } : {};

    updatePermission(Number(permissionToEdit.id), requestData, {
      onSuccess: () => {
        setIsEditDialogOpen(false);
        setPermissionToEdit(null);
        setEditSelectedActions({
          create: true,
          read: true,
          update: true,
          delete: true,
        });
      },
    });
  };

  const handleDeletePermission = () => {
    if (!permissionToDelete) return;

    deletePermission(permissionToDelete.id, {
      onSuccess: () => {
        setIsDeleteDialogOpen(false);
        setPermissionToDelete(null);
      },
    });
  };

  // Open Permission modal
  const openPermissionModal = () => {
    setIsCreateDialogOpen(true);
  };

  if (!canRead) {
    return (
       <BlockPage message="You don't have permission to view permissions." />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        page="permissions"
        heading="Permissions Management"
        subHeading="Manage system permissions"
      />
      {/* comment-out the  create Permission button in PageHeader.tsx component file  */}
      {/* comment-out/remove for now  the dialoge that opens when create permission opens*/}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>All Permissions</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search permissions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoadingPermissions ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Permission Name</TableHead>
                    <TableHead>ID</TableHead>
                    <TableHead>Allowed Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPermissions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                        <div className="flex flex-col items-center">
                          <Key className="h-12 w-12 mb-4" />
                          <p>No permissions found</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredPermissions.map((permission) => (
                      <TableRow key={permission.id}>
                        <TableCell className="font-medium">{permission.permissionName}</TableCell>
                        <TableCell>{permission.id}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {!permission.allowedActions || permission.allowedActions.length === 0 ? (
                              <Badge variant="secondary">All Actions</Badge>
                            ) : (
                              permission.allowedActions.map((action) => (
                                <Badge key={action} variant="outline" className="text-xs">
                                  {action.charAt(0).toUpperCase() + action.slice(1)}
                                </Badge>
                              ))
                            )}
                          </div>
                        </TableCell>
                        {/* comment-out/remove for now  the EDIT and delete buttton  */}
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Permission Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Permission: {permissionToEdit?.permissionName}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Permission Name</Label>
              <Input
                value={permissionToEdit?.permissionName || ''}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Permission names are immutable and cannot be changed.
              </p>
            </div>
            <div>
              <Label>Allowed Actions</Label>
              <p className="text-xs text-muted-foreground mb-2">
                Select which CRUD operations are allowed for this permission.
              </p>
              <div className="grid grid-cols-2 gap-2">
                <label className="flex items-center space-x-2 p-2 border rounded-md hover:bg-gray-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editSelectedActions.create}
                    onChange={(e) =>
                      setEditSelectedActions({ ...editSelectedActions, create: e.target.checked })
                    }
                    className="rounded"
                  />
                  <span>Create</span>
                </label>
                <label className="flex items-center space-x-2 p-2 border rounded-md hover:bg-gray-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editSelectedActions.read}
                    onChange={(e) =>
                      setEditSelectedActions({ ...editSelectedActions, read: e.target.checked })
                    }
                    className="rounded"
                  />
                  <span>Read</span>
                </label>
                <label className="flex items-center space-x-2 p-2 border rounded-md hover:bg-gray-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editSelectedActions.update}
                    onChange={(e) =>
                      setEditSelectedActions({ ...editSelectedActions, update: e.target.checked })
                    }
                    className="rounded"
                  />
                  <span>Update</span>
                </label>
                <label className="flex items-center space-x-2 p-2 border rounded-md hover:bg-gray-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editSelectedActions.delete}
                    onChange={(e) =>
                      setEditSelectedActions({ ...editSelectedActions, delete: e.target.checked })
                    }
                    className="rounded"
                  />
                  <span>Delete</span>
                </label>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleUpdatePermission}
                disabled={isUpdatingPermission}
                className="bg-brand-green hover:bg-brand-green/90"
              >
                {isUpdatingPermission ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  "Update Permission"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Permission</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Are you sure you want to delete the permission <strong>{permissionToDelete?.permissionName}</strong>?
            </p>
            <p className="text-xs text-muted-foreground">
              <strong>Note:</strong> This permission cannot be deleted if it is assigned to any user or role.
              You must first remove the permission from all users and roles.
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeletePermission}
                disabled={isDeletingPermission}
              >
                {isDeletingPermission ? (
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

