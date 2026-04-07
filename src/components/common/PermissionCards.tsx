import PageLoader from "./PageLoader";
import { Shield } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useRolePermissions } from "@/api";
import { usePermissions } from "@/api/hooks/usePermissions";
import { Role } from "@/api/types";

interface PermissionCardProps {
    role: Role | null;
    keyName: string;
};

const PermissionCards = ({ role, keyName }: PermissionCardProps) => {
    const { rolePermissions, isLoading } = useRolePermissions(role?.id || 0, {
        enabled: Boolean(role?.id),
    });
    const { permissions } = usePermissions({ enabled: Boolean(role?.id) });

    const allRolePermissions = rolePermissions?.permissions || [];
    const isAssignedOnlyResponse =
        allRolePermissions.length > 0 &&
        allRolePermissions.length < (permissions?.length || Number.MAX_SAFE_INTEGER);

    const assignedPermissions = isAssignedOnlyResponse
        ? allRolePermissions
        : allRolePermissions.filter((perm: any) =>
            perm?.isAssigned === true ||
            (Array.isArray(perm?.roleAllowedActions) && perm.roleAllowedActions.length > 0)
        );

    return (
        <div className="border-t pt-4">
            <h3 className="text-lg font-semibold mb-4">Assigned Permissions</h3>
            {isLoading ? (
                <div className="flex items-center justify-center py-8">
                    <PageLoader pagename="permissions" />
                </div>
            ) : assignedPermissions.length > 0 ? (
                <div className="space-y-3">
                    {assignedPermissions.map((perm: any) => (
                        <div
                            key={perm.id || perm.permissionName}
                            className="border rounded-lg p-4 space-y-2"
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Shield className="h-4 w-4 text-brand-green" />
                                    <span className="font-medium">{perm.permissionName}</span>
                                </div>
                            </div>

                            <div className="ml-6 space-y-1">
                                {keyName === 'edit'
                                    ?
                                    <div className="text-xs text-muted-foreground">
                                        <span className="font-medium">Granted Actions:</span>{" "}
                                        {perm.roleAllowedActions === null ||
                                            (Array.isArray(perm.roleAllowedActions) &&
                                                perm.roleAllowedActions.length === 0)
                                            ? "All Actions"
                                            : perm.roleAllowedActions
                                                ?.map((a: string) => a.charAt(0).toUpperCase() + a.slice(1))
                                                .join(", ") || "All Actions"}
                                    </div>
                                    :
                                    <>
                                        <div className="text-xs text-muted-foreground">
                                            <span className="font-medium">Permission Max:</span>{" "}
                                            {perm.permissionAllowedActions && perm.permissionAllowedActions.length > 0
                                                ? perm.permissionAllowedActions
                                                    .map((a: string) => a.charAt(0).toUpperCase() + a.slice(1))
                                                    .join(", ")
                                                : "All Actions"}
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                            <span className="font-medium">Role Granted:</span>{" "}
                                            {perm.roleAllowedActions === null ||
                                                (Array.isArray(perm.roleAllowedActions) &&
                                                    perm.roleAllowedActions.length === 0)
                                                ? "All Actions (from permission)"
                                                : perm.roleAllowedActions
                                                    ?.map((a: string) => a.charAt(0).toUpperCase() + a.slice(1))
                                                    .join(", ") || "All Actions"}
                                        </div>
                                    </>
                                }

                                <div className="flex flex-wrap gap-1 mt-2">
                                    {(perm.roleAllowedActions === null ||
                                        (Array.isArray(perm.roleAllowedActions) &&
                                            perm.roleAllowedActions.length === 0)
                                        ? perm.permissionAllowedActions || ["create", "read", "update", "delete"]
                                        : perm.roleAllowedActions || []
                                    ).map((action: string) => (
                                        <Badge
                                            key={action}
                                            variant="outline"
                                            className="text-xs"
                                        >
                                            {action.charAt(0).toUpperCase() + action.slice(1)}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-8 text-muted-foreground">
                    <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No permissions assigned to this role</p>
                </div>
            )}
        </div>
    )
};

export default PermissionCards;