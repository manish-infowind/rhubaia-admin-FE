import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Shield, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useRoles, useRolePermissions, roleKeys } from "@/api/hooks/useRoles";
import { usePermissions } from "@/api/hooks/usePermissions";
import { Role, UpdateRoleRequest } from "@/api/types";
import { RolePermissionsDialog } from "./RolePermissionsDialog";
import PermissionCards from "../common/PermissionCards";

interface RoleEditDialogProps {
  role: Role | null;
  isOpen: boolean;
  onClose: () => void;
}

export function RoleEditDialog({
  role,
  isOpen,
  onClose,
}: RoleEditDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { updateRole, isUpdatingRole } = useRoles();
  const shouldFetchForEdit = Boolean(isOpen && role?.id);
  usePermissions({ enabled: shouldFetchForEdit });
  const { refetch: refetchRolePermissions } = useRolePermissions(role?.id, {
    enabled: shouldFetchForEdit,
  });
  const [isPermissionsDialogOpen, setIsPermissionsDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("details");

  const [formData, setFormData] = useState<UpdateRoleRequest>({
    roleName: "",
    description: "",
    isActive: true,
  });

  // Initialize form data when role changes
  useEffect(() => {
    if (role) {
      setFormData({
        roleName: role.roleName,
        description: role.description || "",
        isActive: role.isActive !== false,
      });
    }
  }, [role]);

  useEffect(() => {
    if (isOpen && activeTab === "permissions" && role?.id) {
      refetchRolePermissions();
    }
  }, [activeTab, isOpen, role?.id, refetchRolePermissions]);

  const handleSave = () => {
    if (!role) return;

    if (!formData.roleName.trim()) {
      toast({
        title: "Error",
        description: "Role name is required",
        variant: "destructive",
      });
      return;
    }

    updateRole(role.id, formData, {
      onSuccess: () => {
        onClose();
      },
    });
  };

  if (!role) return null;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-3xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-brand-green" />
              Edit Role: {role.roleName}
            </DialogTitle>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="details">Role Details</TabsTrigger>
              <TabsTrigger value="permissions">Permissions</TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="space-y-4">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="edit-roleName">Role Name</Label>
                  <Input
                    id="edit-roleName"
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
                  <Label htmlFor="edit-description">Description</Label>
                  <Textarea
                    id="edit-description"
                    placeholder="Describe the role's purpose..."
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    rows={4}
                  />
                </div>
                <div>
                  <Label>Status</Label>
                  <div className="mt-2">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={formData.isActive}
                        onChange={(e) =>
                          setFormData({ ...formData, isActive: e.target.checked })
                        }
                        className="rounded"
                      />
                      <span>Active</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={isUpdatingRole}
                  className="bg-brand-green hover:bg-brand-green/90"
                >
                  {isUpdatingRole ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="permissions" className="space-y-4">
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-4">
                    Manage permissions assigned to this role. Click the button below to assign or remove permissions.
                  </p>
                  <Button
                    onClick={() => setIsPermissionsDialogOpen(true)}
                    className="bg-brand-green hover:bg-brand-green/90"
                  >
                    <Shield className="h-4 w-4 mr-2" />
                    Manage Permissions
                  </Button>
                </div>

                {/* Current Permissions Preview */}
                <PermissionCards role={role} keyName="edit" />
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Permissions Management Dialog */}
      {role && (
        <RolePermissionsDialog
          roleId={role.id}
          roleName={role.roleName}
          isOpen={isPermissionsDialogOpen}
          onClose={() => {
            setIsPermissionsDialogOpen(false);
            // Refresh role permissions after closing
            if (role?.id) {
              queryClient.invalidateQueries({ queryKey: roleKeys.rolePermissions(role.id) });
            }
          }}
        />
      )}
    </>
  );
}

