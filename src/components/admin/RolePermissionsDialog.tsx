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
import {
  buildRolePermissionAssignPayload,
  getEffectiveRoleGrantedActions,
  isAssignedOnlyRolePermissionsResponse,
  isRolePermissionAssigned,
} from "@/lib/rolePermissions";

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
  const {
    permissions,
    isLoadingPermissions,
    isFetchingPermissions,
    isPermissionsSuccess,
    permissionsError,
  } = usePermissions({
    enabled: shouldFetchPermissionsData,
  });
  const {
    rolePermissions,
    isLoading: isLoadingRolePermissions,
    refetch: refetchRolePermissions,
  } = useRolePermissions(roleId, {
    enabled: shouldFetchPermissionsData,
  });
  const { assignPermissionsToRole, isAssigningPermissionsToRole } = useRoles();

  const [permissionStates, setPermissionStates] = useState<PermissionState[]>([]);
  const [hasFinishedInitialLoad, setHasFinishedInitialLoad] = useState(false);

  useEffect(() => {
    if (shouldFetchPermissionsData) {
      refetchRolePermissions();
    }
  }, [shouldFetchPermissionsData, roleId, refetchRolePermissions]);

  // Initialize permission states when permissions and role permissions are loaded
  useEffect(() => {
    if (!shouldFetchPermissionsData) return;
    if (isLoadingPermissions || isLoadingRolePermissions || isFetchingPermissions) return;
    if (!isPermissionsSuccess) return;

    const currentPermissions = rolePermissions?.permissions ?? [];
    const isAssignedOnlyResponse = isAssignedOnlyRolePermissionsResponse(
      currentPermissions,
      permissions.length,
    );

    const states: PermissionState[] = permissions.map((perm: Permission) => {
      const current = currentPermissions.find(
        (p) => p.permissionName === perm.permissionName,
      );

      const isAssigned = isRolePermissionAssigned(current, isAssignedOnlyResponse);
      const permissionMaxActions = perm.allowedActions || [
        "create",
        "read",
        "update",
        "delete",
      ];
      const effectiveActions = getEffectiveRoleGrantedActions(
        current,
        permissionMaxActions,
        isAssigned,
      );

      return {
        permissionName: perm.permissionName,
        selected: isAssigned,
        permissionMaxActions,
        crud: {
          create: effectiveActions.includes("create"),
          read: effectiveActions.includes("read"),
          update: effectiveActions.includes("update"),
          delete: effectiveActions.includes("delete"),
        },
      };
    });

    setPermissionStates(states);
    setHasFinishedInitialLoad(true);
  }, [
    shouldFetchPermissionsData,
    permissions,
    rolePermissions,
    isLoadingPermissions,
    isLoadingRolePermissions,
    isFetchingPermissions,
    isPermissionsSuccess,
  ]);

  // Clear local state only when dialog closes (do not clear on open — that races with init above).
  useEffect(() => {
    if (!isOpen) {
      setHasFinishedInitialLoad(false);
      setPermissionStates([]);
    }
  }, [isOpen]);

  const handlePermissionToggle = (permissionName: string) => {
    setPermissionStates((prev) =>
      prev.map((p) => {
        if (p.permissionName === permissionName) {
          const isSelecting = !p.selected;
          if (isSelecting) {
            return {
              ...p,
              selected: true,
              crud: {
                create: p.permissionMaxActions.includes("create"),
                read: p.permissionMaxActions.includes("read"),
                update: p.permissionMaxActions.includes("update"),
                delete: p.permissionMaxActions.includes("delete"),
              },
            };
          }
          return { ...p, selected: false };
        }
        return p;
      }),
    );
  };

  const handleCrudToggle = (
    permissionName: string,
    action: keyof PermissionState["crud"],
  ) => {
    setPermissionStates((prev) =>
      prev.map((p) => {
        if (p.permissionName === permissionName) {
          const actionStr = action as string;
          if (!p.permissionMaxActions.includes(actionStr)) {
            return p;
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
      }),
    );
  };

  const handleSave = () => {
    if (!roleId) return;

    if (!hasFinishedInitialLoad) {
      toast({
        title: "Please wait",
        description: "Permissions are still loading. Try again in a moment.",
        variant: "destructive",
      });
      return;
    }

    const selectedPermissions = buildRolePermissionAssignPayload(permissionStates);

    const requestData: AssignPermissionsToRoleRequest = {
      roleId,
      permissions: selectedPermissions,
    };

    assignPermissionsToRole(requestData, {
      onSuccess: () => {
        if (roleId) {
          queryClient.invalidateQueries({
            queryKey: roleKeys.rolePermissions(roleId),
          });
        }
        toast({
          title: "Success",
          description: "Permissions assigned to role successfully",
        });
        onClose();
      },
    });
  };

  const isLoading =
    isLoadingPermissions ||
    isLoadingRolePermissions ||
    isFetchingPermissions ||
    !hasFinishedInitialLoad;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Assign Permissions to Role: "{roleName}"</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <PageLoader pagename="permissions" />
        ) : permissionsError ? (
          <div className="py-8 text-center text-sm text-destructive">
            Failed to load permissions. Please close and try again.
          </div>
        ) : permissionStates.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            No permissions available in the catalog.
          </div>
        ) : (
          <div className="space-y-4 flex flex-col min-h-0 flex-1">
            <ScrollArea className="h-[min(55vh,520px)] pr-4">
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
                          <span className="font-medium">Permission Max:</span>{" "}
                          {state.permissionMaxActions
                            .map((a) => a.charAt(0).toUpperCase() + a.slice(1))
                            .join(", ") || "All Actions"}
                        </div>
                        <Label className="text-sm text-muted-foreground">
                          Role Granted Actions:
                        </Label>
                        <div className="grid grid-cols-2 gap-2">
                          {(["create", "read", "update", "delete"] as const).map(
                            (action) => {
                              const isMaxAllowed =
                                state.permissionMaxActions.includes(action);
                              const isChecked = state.crud[action];

                              return (
                                <label
                                  key={action}
                                  className={`flex items-center space-x-2 p-2 border rounded-md ${
                                    isMaxAllowed
                                      ? "hover:bg-gray-50 cursor-pointer"
                                      : "opacity-50 cursor-not-allowed bg-gray-100"
                                  }`}
                                >
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    disabled={!isMaxAllowed}
                                    onChange={() =>
                                      handleCrudToggle(state.permissionName, action)
                                    }
                                    className="rounded"
                                  />
                                  <span
                                    className={`text-sm ${
                                      isMaxAllowed
                                        ? ""
                                        : "line-through text-muted-foreground"
                                    }`}
                                  >
                                    {action.charAt(0).toUpperCase() + action.slice(1)}
                                  </span>
                                </label>
                              );
                            },
                          )}
                        </div>
                        {(() => {
                          const checkedCount =
                            Object.values(state.crud).filter(Boolean).length;
                          if (checkedCount === 0) {
                            return (
                              <p className="text-xs text-muted-foreground ml-2">
                                At least one action must be selected to include this
                                permission.
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
                disabled={isAssigningPermissionsToRole || !hasFinishedInitialLoad}
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
