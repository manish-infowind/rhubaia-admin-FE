import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { usePermissions } from "@/api/hooks/usePermissions";
import { useRoles, useRolePermissions, roleKeys } from "@/api/hooks/useRoles";
import { Permission, AssignPermissionsToRoleRequest } from "@/api/types";
import { useQueryClient } from "@tanstack/react-query";
import PageLoader from "../common/PageLoader";

interface PermissionState {
  permissionName: string;
  selected: boolean;
  permissionMaxActions: string[]; // Maximum actions allowed by the permission
  crud: {
    create: boolean;
    read: boolean;
    update: boolean;
    delete: boolean;
  };
}

type RolePermissionApiItem = {
  permissionName: string;
  roleAllowedActions?: string[] | null;
  isAssigned?: boolean;
};

interface RolePermissionsDialogProps {
  roleId: string | number | null;
  roleName: string;
  isOpen: boolean;
  onClose: () => void;
}

export function RolePermissionsDialog({
  roleId,
  roleName,
  isOpen,
  onClose,
}: RolePermissionsDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const shouldFetchPermissionsData = Boolean(isOpen && roleId);
  const { permissions, isLoadingPermissions } = usePermissions({
    enabled: shouldFetchPermissionsData,
  });
  const { rolePermissions, isLoading: isLoadingRolePermissions } = useRolePermissions(roleId, {
    enabled: shouldFetchPermissionsData,
  });
  const { assignPermissionsToRole, isAssigningPermissionsToRole } = useRoles();

  const [permissionStates, setPermissionStates] = useState<PermissionState[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize permission states when permissions and role permissions are loaded
  useEffect(() => {
    if (!isLoadingPermissions && !isLoadingRolePermissions && permissions.length > 0 && !isInitialized) {
      const currentPermissions = (rolePermissions?.permissions || []) as RolePermissionApiItem[];
      const isAssignedOnlyResponse =
        currentPermissions.length > 0 && currentPermissions.length < permissions.length;
      
      const states: PermissionState[] = permissions.map((perm: Permission) => {
        const current = currentPermissions.find(
          (p: any) => p.permissionName === perm.permissionName
        );

        // Backend may return full permission catalog in rolePermissions.
        // Treat as assigned only when explicitly marked OR role actions are non-empty.
        const isAssigned =
          (isAssignedOnlyResponse && !!current) ||
          current?.isAssigned === true ||
          (Array.isArray(current?.roleAllowedActions) && current.roleAllowedActions.length > 0);

        // Get permission's maximum allowed actions
        const permissionMaxActions = perm.allowedActions || ['create', 'read', 'update', 'delete'];

        // Preload only explicitly assigned action arrays.
        const roleGrantedActions = Array.isArray(current?.roleAllowedActions) ? current.roleAllowedActions : [];
        const effectiveActions = isAssigned
          ? (roleGrantedActions.length > 0 ? roleGrantedActions : permissionMaxActions)
          : [];
        
        return {
          permissionName: perm.permissionName,
          selected: isAssigned,
          permissionMaxActions: permissionMaxActions,
          crud: {
            create: effectiveActions.includes('create'),
            read: effectiveActions.includes('read'),
            update: effectiveActions.includes('update'),
            delete: effectiveActions.includes('delete'),
          },
        };
      });
      
      setPermissionStates(states);
      setIsInitialized(true);
    }
  }, [permissions, rolePermissions, isLoadingPermissions, isLoadingRolePermissions, isInitialized]);

  // Reset when dialog opens/closes
  useEffect(() => {
    if (isOpen && roleId) {
      setIsInitialized(false);
    } else if (!isOpen) {
      setIsInitialized(false);
      setPermissionStates([]);
    }
  }, [isOpen, roleId]);

  const handlePermissionToggle = (permissionName: string) => {
    setPermissionStates((prev) =>
      prev.map((p) => {
        if (p.permissionName === permissionName) {
          const isSelecting = !p.selected;
          // When selecting, default to all permission max actions
          if (isSelecting) {
            return {
              ...p,
              selected: true,
              crud: {
                create: p.permissionMaxActions.includes('create'),
                read: p.permissionMaxActions.includes('read'),
                update: p.permissionMaxActions.includes('update'),
                delete: p.permissionMaxActions.includes('delete'),
              },
            };
          } else {
            return { ...p, selected: false };
          }
        }
        return p;
      })
    );
  };

  const handleCrudToggle = (
    permissionName: string,
    action: keyof PermissionState["crud"]
  ) => {
    setPermissionStates((prev) =>
      prev.map((p) => {
        if (p.permissionName === permissionName) {
          // Only allow toggling if the action is in permission max actions
          const actionStr = action as string;
          if (!p.permissionMaxActions.includes(actionStr)) {
            return p; // Don't allow toggling disabled actions
          }
          
          return {
            ...p,
            crud: {
              ...p.crud,
              [action]: !p.crud[action],
            },
          };
        }
        return p;
      })
    );
  };

  const handleSave = () => {
    if (!roleId) return;

    // Include only explicitly selected permissions with at least one action.
    // This prevents sending every permission when the backend response contains full catalog entries.
    const selectedPermissions = permissionStates
      .filter((p) => p.selected)
      .map((p) => {
        const crud: string[] = [];
        if (p.crud.create) crud.push("create");
        if (p.crud.read) crud.push("read");
        if (p.crud.update) crud.push("update");
        if (p.crud.delete) crud.push("delete");

        if (crud.length === 0) {
          return null;
        }

        return {
          permissionName: p.permissionName,
          crud,
        };
      })
      .filter((p): p is { permissionName: string; crud: string[] } => p !== null);

    const requestData: AssignPermissionsToRoleRequest = {
      roleId,
      permissions: selectedPermissions,
    };

    assignPermissionsToRole(requestData, {
      onSuccess: () => {
        // Invalidate role permissions to refresh
        if (roleId) {
          queryClient.invalidateQueries({ queryKey: roleKeys.rolePermissions(roleId) });
        }
        toast({
          title: "Success",
          description: "Permissions assigned to role successfully",
        });
        onClose();
      },
    });
  };

  const isLoading = isLoadingPermissions || isLoadingRolePermissions;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Assign Permissions to Role: "{roleName}"</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <PageLoader pagename="permissions" />
        ) : (
          <div className="space-y-4">
            <ScrollArea className="pr-4">
              <div className="space-y-3">
                {permissionStates.map((state) => (
                  <div
                    key={state.permissionName}
                    className="border rounded-lg p-4 space-y-3"
                  >
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={state.selected}
                        onChange={() => handlePermissionToggle(state.permissionName)}
                        className="rounded h-4 w-4"
                      />
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-brand-green" />
                        <span className="font-medium">{state.permissionName}</span>
                      </div>
                    </label>

                    {state.selected && (
                      <div className="ml-6 space-y-2">
                        <div className="text-xs text-muted-foreground mb-2">
                          <span className="font-medium">Permission Max:</span> {state.permissionMaxActions.map(a => a.charAt(0).toUpperCase() + a.slice(1)).join(', ') || 'All Actions'}
                        </div>
                        <Label className="text-sm text-muted-foreground">
                          Role Granted Actions:
                        </Label>
                        <div className="grid grid-cols-2 gap-2">
                          {(['create', 'read', 'update', 'delete'] as const).map((action) => {
                            const isMaxAllowed = state.permissionMaxActions.includes(action);
                            const isChecked = state.crud[action];
                            
                            return (
                              <label
                                key={action}
                                className={`flex items-center space-x-2 p-2 border rounded-md ${
                                  isMaxAllowed
                                    ? 'hover:bg-gray-50 cursor-pointer'
                                    : 'opacity-50 cursor-not-allowed bg-gray-100'
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  disabled={!isMaxAllowed}
                                  onChange={() => handleCrudToggle(state.permissionName, action)}
                                  className="rounded"
                                />
                                <span
                                  className={`text-sm ${
                                    isMaxAllowed ? '' : 'line-through text-muted-foreground'
                                  }`}
                                >
                                  {action.charAt(0).toUpperCase() + action.slice(1)}
                                </span>
                              </label>
                            );
                          })}
                        </div>
                        {(() => {
                          const checkedCount = Object.values(state.crud).filter(Boolean).length;
                          const maxCount = state.permissionMaxActions.length;
                          if (checkedCount === 0) {
                            return (
                              <p className="text-xs text-muted-foreground ml-2">
                                At least one action must be selected to include this permission.
                              </p>
                            );
                          }
                          return (
                            <p className="text-xs text-muted-foreground ml-2">
                              Selected actions will be granted to this role
                            </p>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={isAssigningPermissionsToRole}
                className="bg-brand-green hover:bg-brand-green/90"
              >
                {isAssigningPermissionsToRole ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Permissions"
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

