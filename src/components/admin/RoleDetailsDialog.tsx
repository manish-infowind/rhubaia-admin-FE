import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Shield, Edit } from "lucide-react";
import { useRolePermissions } from "@/api/hooks/useRoles";
import { Role } from "@/api/types";
import PermissionCards from "../common/PermissionCards";

interface RoleDetailsDialogProps {
  role: Role | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: () => void;
}

export function RoleDetailsDialog({
  role,
  isOpen,
  onClose,
  onEdit,
}: RoleDetailsDialogProps) {
  const { rolePermissions, isLoading } = useRolePermissions(role?.id);

  if (!role) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-brand-green" />
              Role Details: {role.roleName}
            </DialogTitle>
            <div className="flex gap-2 mx-[40px]">
              <Button
                variant="outline"
                size="sm"
                onClick={onEdit}
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Role Information */}
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Role Name
              </label>
              <p className="text-lg font-semibold">{role.roleName}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Description
              </label>
              <p className="text-base">
                {role.description || "No description provided"}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Status
              </label>
              <div className="mt-1">
                {role.isActive !== false ? (
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    Active
                  </Badge>
                ) : (
                  <Badge variant="outline" className="bg-gray-100 text-gray-800">
                    Inactive
                  </Badge>
                )}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Role ID
              </label>
              <p className="text-base">{role.id}</p>
            </div>
          </div>

          {/* Permissions Section */}
          <PermissionCards role={role} keyName="role" />
        </div>
      </DialogContent>
    </Dialog>
  );
}

