import { useMemo, useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useSelector } from "react-redux";
import type { RootState } from "@/redux/store/store";
import { canAccessAdminManagement } from "@/lib/permissions";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Users,
  Search,
  MoreVertical,
  Edit,
  Trash2,
  Shield,
  ShieldCheck,
  ShieldX,
  Calendar,
  Loader2,
  Eye,
  Lock,
  BarChart3,
} from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { useAdminManagement } from "@/api/hooks/useAdminManagement";
import { AdminUser, CreateAdminRequest, UpdateAdminRequest, ChangePasswordRequest } from "@/api/types";
import { format } from "date-fns";
import { useRoles, useAdminRoles, useRolePermissions } from "@/api/hooks/useRoles";
import { usePermissions, useAdminPermissions } from "@/api/hooks/usePermissions";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, XCircle } from "lucide-react";
import PageHeader from "@/components/common/PageHeader";
import { activeList, roleList } from "@/constants/uiLists";
import { canManageAdminUsers } from "@/lib/permissions";

export default function AdminManagement() {
  const loginState = useSelector((state: RootState) => state.auth.loginState);
  const { toast } = useToast();

  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedAdmin, setSelectedAdmin] = useState<AdminUser | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

  // Form states for create/edit
  const [formData, setFormData] = useState<CreateAdminRequest>({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    role: "admin",
    permissions: [],
    isActive: true,
  });

  // Role and permission selection (separate from formData)
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
  const [selectedPermissionIds, setSelectedPermissionIds] = useState<string[]>([]);

  // Edit mode: selected roles and permissions
  const [editSelectedRoleId, setEditSelectedRoleId] = useState<string | null>(null);
  const [editSelectedPermissionIds, setEditSelectedPermissionIds] = useState<string[]>([]);

  // Password validation state
  const [passwordErrors, setPasswordErrors] = useState({
    hasUppercase: false,
    hasNumber: false,
    hasSpecialChar: false,
    hasMinLength: false,
  });

  // Fetch roles and permissions (hooks already return extracted arrays)
  const { roles, assignRole, isLoadingRoles, rolesError } = useRoles();
  const { permissions, assignPermissions, isLoadingPermissions, permissionsError } = usePermissions();

  // Fetch current admin roles and permissions when editing
  const { adminRoles, isLoading: isLoadingAdminRoles } = useAdminRoles(selectedAdmin?.id || '');
  const { adminPermissions, isLoading: isLoadingAdminPermissions } = useAdminPermissions(selectedAdmin?.id || '');
  const { rolePermissions: editRolePermissions, isLoading: isLoadingEditRolePermissions } = useRolePermissions(
    isEditModalOpen ? editSelectedRoleId : null
  );

  const viewRoleId = isViewModalOpen
    ? (selectedAdmin?.roles?.[0]?.id ?? adminRoles?.roles?.[0]?.id ?? null)
    : null;
  const { rolePermissions: viewRolePermissions, isLoading: isLoadingViewRolePermissions } = useRolePermissions(viewRoleId);

  // Lock/unlock "From Role" permissions dynamically based on the currently selected role in the edit modal.
  // If user clears role selection, these become editable again.
  const roleDerivedPermissionNames = useMemo(() => {
    const source =
      isEditModalOpen && editSelectedRoleId
        ? (editRolePermissions?.permissions ?? [])
        : [];

    return new Set<string>(
      source
        .filter(
          (p: any) =>
            p?.isAssigned === true ||
            (Array.isArray(p?.roleAllowedActions) && p.roleAllowedActions.length > 0),
        )
        .map((p: any) => p.permissionName)
        .filter(Boolean),
    );
  }, [editRolePermissions?.permissions, editSelectedRoleId, isEditModalOpen]);

  const roleDerivedPermissionNamesKey = useMemo(() => {
    return Array.from(roleDerivedPermissionNames).sort().join("|");
  }, [roleDerivedPermissionNames]);

  // Password change form (for admin management, we don't need currentPassword)
  const [passwordData, setPasswordData] = useState<{
    newPassword: string;
    confirmPassword: string;
  }>({
    newPassword: "",
    confirmPassword: "",
  });

  // Check if current user can access admin management
  const canAccess = canAccessAdminManagement(loginState as any);
  const canReadAdmins = canManageAdminUsers(loginState as any, "read");
  const canUpdateAdmins = canManageAdminUsers(loginState as any, "update");
  const canDeleteAdmins = canManageAdminUsers(loginState as any, "delete");
  const canCreateAdmins = canManageAdminUsers(loginState as any, "create");

  // Use the admin management hook
  const {
    admins,
    stats,
    pagination,
    isLoading,
    isLoadingStats,
    isCreating,
    isUpdating,
    isDeleting,
    isTogglingStatus,
    isChangingPassword,
    error,
    createAdmin,
    updateAdmin,
    deleteAdmin,
    toggleStatus,
    changePassword,
    refetch,
  } = useAdminManagement({
    page: currentPage,
    limit: 10,
    search: searchTerm || undefined,
    role: roleFilter !== "all" ? roleFilter : undefined,
    status: statusFilter !== "all" ? statusFilter : undefined,
  });


  // Initial states clear after the popup modal closed (Freeze screen issue fix)
  useEffect(() => {
    const anyModalOpen =
      isCreateModalOpen ||
      isEditModalOpen ||
      isDeleteModalOpen ||
      isViewModalOpen ||
      isPasswordModalOpen;

    if (!anyModalOpen) {
      cleanupModalArtifacts();
    }
  }, [isCreateModalOpen, isEditModalOpen, isDeleteModalOpen, isViewModalOpen, isPasswordModalOpen]);

  const cleanupModalArtifacts = () => {
    try {
      // restore scrolling and pointer events
      document.body.style.overflow = "";
      document.body.style.position = "";
      document.body.style.pointerEvents = "";

      // Remove inert attribute if set by some modal implementations
      document.querySelectorAll('[inert]').forEach(n => n.removeAttribute('inert'));

      // Clear aria-hidden on body children (Radix sets this)
      Array.from(document.body.children).forEach((child) => {
        if ((child as HTMLElement).getAttribute && (child as HTMLElement).getAttribute('aria-hidden') === 'true') {
          (child as HTMLElement).removeAttribute('aria-hidden');
        }
      });

      // Remove common overlay/portal elements appended to body
      const overlays = document.querySelectorAll(
        '[data-radix-dialog-overlay], [data-radix-portal], .radix-portal, .__dialog-overlay, .dialog-backdrop, .modal-backdrop, .overlay, .backdrop'
      );
      overlays.forEach(n => {
        if (n.parentElement === document.body) n.remove();
      });

      // Blur active element and focus app root
      (document.activeElement as HTMLElement)?.blur?.();
      const maybeRoot = document.getElementById('root') || document.querySelector('#app') || document.body;
      if (maybeRoot && maybeRoot instanceof HTMLElement) {
        maybeRoot.tabIndex = -1;
        maybeRoot.focus();
      }
    } catch (e) {
      // ignore in SSR or restricted env
    }
  };

  // Handle search and filter changes with debouncing
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setCurrentPage(1);
      refetch();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, roleFilter, statusFilter, refetch]);

  // Handle page changes
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Password validation function
  const validatePassword = (password: string) => {
    setPasswordErrors({
      hasUppercase: /[A-Z]/.test(password),
      hasNumber: /[0-9]/.test(password),
      hasSpecialChar: /[!@#$%^&*]/.test(password),
      hasMinLength: password.length >= 8,
    });
  };

  // Handle password change
  const handlePasswordChange = (password: string) => {
    setFormData({ ...formData, password });
    validatePassword(password);
  };

  // Handle create admin
  const handleCreateAdmin = async () => {
    // Validate required fields
    if (!formData.email || !formData.password || !formData.firstName || !formData.lastName) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    // Validate password
    if (!passwordErrors.hasUppercase || !passwordErrors.hasNumber || !passwordErrors.hasSpecialChar || !passwordErrors.hasMinLength) {
      toast({
        title: "Password Validation Error",
        description: "Password must meet all requirements.",
        variant: "destructive",
      });
      return;
    }

    // Validate that either role OR permissions are assigned
    if (!selectedRoleId && selectedPermissionIds.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please assign at least one role or individual permission.",
        variant: "destructive",
      });
      return;
    }

    // Create admin first
    createAdmin(formData, {
      onSuccess: async (response) => {
        if (response.success && response.data) {
          const adminId = (response.data as any).id || (response.data as any).uuid;

          // Assign role if selected
          if (selectedRoleId && adminId) {
            assignRole(
              { adminId: String(adminId), roleIds: [String(selectedRoleId)] },
              {
                onSuccess: () => {
                  toast({
                    title: "Success",
                    description: "Role assigned successfully",
                  });
                },
                onError: (error: any) => {
                  toast({
                    title: "Warning",
                    description: `Admin created but role assignment failed: ${error?.message || 'Unknown error'}`,
                    variant: "destructive",
                  });
                },
              }
            );
          }

          // Assign permissions if selected
          if (selectedPermissionIds.length > 0 && adminId) {
            assignPermissions(
              { adminId: String(adminId), permissionIds: selectedPermissionIds },
              {
                onSuccess: () => {
                  toast({
                    title: "Success",
                    description: "Permissions assigned successfully",
                  });
                },
                onError: (error: any) => {
                  toast({
                    title: "Warning",
                    description: `Admin created but permission assignment failed: ${error?.message || 'Unknown error'}`,
                    variant: "destructive",
                  });
                },
              }
            );
          }

          if (!adminId) {
            toast({
              title: "Warning",
              description: "Admin created but ID was missing, so roles/permissions were not assigned.",
              variant: "destructive",
            });
          }

          // Reset form
          setIsCreateModalOpen(false);
          setFormData({
            email: "",
            password: "",
            firstName: "",
            lastName: "",
            role: "admin",
            permissions: [],
            isActive: true,
          });
          setSelectedRoleId(null);
          setSelectedPermissionIds([]);
          setPasswordErrors({
            hasUppercase: false,
            hasNumber: false,
            hasSpecialChar: false,
            hasMinLength: false,
          });
        }
      },
    });
  };

  // Handle edit admin
  const handleEditAdmin = async () => {
    if (!selectedAdmin || !formData.firstName || !formData.lastName) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    // Validate that either role OR permissions are assigned
    if (!editSelectedRoleId && editSelectedPermissionIds.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please assign at least one role or individual permission.",
        variant: "destructive",
      });
      return;
    }

    const updateData: UpdateAdminRequest = {
      first_name: formData.firstName,
      last_name: formData.lastName,
      is_active: formData.isActive,
    };

    // Update admin details first
    updateAdmin({ id: selectedAdmin.id, data: updateData }, {
      onSuccess: async () => {
        // IMPORTANT: Always call both APIs with replace semantics.
        // 1) Assign roles (empty array means clear all roles)
        // 2) Assign direct permissions (empty array means clear all direct permissions)
        assignRole(
          {
            adminId: String(selectedAdmin.id),
            roleIds: editSelectedRoleId ? [String(editSelectedRoleId)] : [],
          },
          {
            onSuccess: () => {
              assignPermissions(
                {
                  adminId: String(selectedAdmin.id),
                  permissionIds: editSelectedPermissionIds,
                },
                {
                  onSuccess: () => {
                    setIsEditModalOpen(false);
                    setSelectedAdmin(null);
                    setEditSelectedRoleId(null);
                    setEditSelectedPermissionIds([]);
                  },
                  onError: (error: any) => {
                    toast({
                      title: "Warning",
                      description: `Admin updated but permission assignment failed: ${error?.message || 'Unknown error'}`,
                      variant: "destructive",
                    });
                  },
                }
              );
            },
            onError: (error: any) => {
              toast({
                title: "Warning",
                description: `Admin updated but role assignment failed: ${error?.message || 'Unknown error'}`,
                variant: "destructive",
              });
            },
          }
        );
      },
    });
  };

  // Handle delete admin
  const handleDeleteAdmin = async () => {
    if (!selectedAdmin) return;
    deleteAdmin(selectedAdmin.id);
    setIsDeleteModalOpen(false);
    setSelectedAdmin(null);
  };

  // Handle change password
  const handleChangePassword = async () => {
    if (!selectedAdmin || !passwordData.newPassword || !passwordData.confirmPassword) {
      toast({
        title: "Validation Error",
        description: "Please fill in all password fields.",
        variant: "destructive",
      });
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: "Validation Error",
        description: "Passwords do not match.",
        variant: "destructive",
      });
      return;
    }

    changePassword({
      id: selectedAdmin.id,
      data: {
        currentPassword: "", // Not required for admin management password change
        newPassword: passwordData.newPassword,
        confirmPassword: passwordData.confirmPassword,
      } as ChangePasswordRequest
    });
    setIsPasswordModalOpen(false);
    setSelectedAdmin(null);
    setPasswordData({ newPassword: "", confirmPassword: "" });
  };

  // Open edit modal
  const openEditModal = (admin: AdminUser) => {
    setSelectedAdmin(admin);
    setFormData({
      email: admin.email,
      password: "",
      firstName: admin.firstName,
      lastName: admin.lastName,
      role: admin.role,
      permissions: admin.permissions,
      isActive: admin.isActive,
    });

    // Initialize role and permission selection from admin's current assignments
    // These will be populated when adminRoles and adminPermissions are fetched
    setEditSelectedRoleId(null);
    setEditSelectedPermissionIds([]);

    setIsEditModalOpen(true);
  };

  // Ensure edit form is always hydrated when modal opens.
  useEffect(() => {
    if (!isEditModalOpen || !selectedAdmin) return;

    setFormData((prev) => ({
      ...prev,
      email: selectedAdmin.email,
      password: "",
      firstName: selectedAdmin.firstName || "",
      lastName: selectedAdmin.lastName || "",
      role: selectedAdmin.role,
      permissions: selectedAdmin.permissions,
      isActive: selectedAdmin.isActive,
    }));
  }, [isEditModalOpen, selectedAdmin]);

  // Update edit role/permission selection when admin roles/permissions are fetched
  useEffect(() => {
    if (!selectedAdmin) {
      setEditSelectedRoleId(null);
      return;
    }

    if (adminRoles?.roles && adminRoles.roles.length > 0) {
      // Prefer explicit role assignment from admin-role endpoint.
      setEditSelectedRoleId(String(adminRoles.roles[0].id));
      return;
    }

    // If admin-role endpoint says no roles, keep selection empty.
    // Do NOT fall back to selectedAdmin.role because backend can return role="admin"
    // even when the admin has no RBAC role (direct-permissions-only user).
    setEditSelectedRoleId(null);
  }, [adminRoles, selectedAdmin, roles]);

  // Update edit permission selection when admin permissions are fetched
  useEffect(() => {
    if (selectedAdmin && adminPermissions?.permissions) {
      // Treat adminPermissions as DIRECT permissions; role-derived permissions are read-only in UI.
      const directPermissionNames = adminPermissions.permissions
        .map((p) => p.permissionName)
        .filter((name) => !roleDerivedPermissionNames.has(name));

      const permissionIds = permissions
        .filter((p) => directPermissionNames.includes(p.permissionName))
        .map((p) => String(p.id));

      setEditSelectedPermissionIds(permissionIds);
    } else {
      setEditSelectedPermissionIds([]);
    }
  }, [adminPermissions, selectedAdmin, permissions, roleDerivedPermissionNamesKey]);

  // Open delete modal
  const openDeleteModal = (admin: AdminUser) => {
    setSelectedAdmin(admin);
    setIsDeleteModalOpen(true);
  };

  // Open view modal
  const openViewModal = (admin: AdminUser) => {
    setSelectedAdmin(admin);
    setIsViewModalOpen(true);
  };

  // Open password modal
  const openPasswordModal = (admin: AdminUser) => {
    setSelectedAdmin(admin);
    setIsPasswordModalOpen(true);
  };

  // Get role badge - now uses roleName from roles array
  const getRoleBadge = (admin: AdminUser) => {
    // If no roles are assigned, don't show misleading "Admin".
    // This can happen when admin has only direct permissions.
    const hasAssignedRole = Boolean(admin.roles && admin.roles.length > 0);
    if (!hasAssignedRole) {
      return (
        <Badge variant="secondary" className="bg-gray-200 text-gray-800">
          Direct Permissions
        </Badge>
      );
    }

    const roleName = admin.roles![0].roleName;
    
    // Format role name for display (capitalize first letter of each word)
    const formattedRoleName = roleName
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
    
    // Determine badge variant based on role name
    const isSuperAdmin = roleName === 'super_admin' || roleName.toLowerCase().includes('super');
    
    return isSuperAdmin ? (
      <Badge variant="destructive" className="bg-red-600">
        <Shield className="h-3 w-3 mr-1" />
        {formattedRoleName}
      </Badge>
    ) : (
      <Badge variant="default" className="bg-blue-600">
        <ShieldCheck className="h-3 w-3 mr-1" />
        {formattedRoleName}
      </Badge>
    );
  };

  // Get status badge
  const getStatusBadge = (isActive: boolean) => {
    return isActive ? (
      <Badge variant="default" className="bg-green-600">
        <ShieldCheck className="h-3 w-3 mr-1" />
        Active
      </Badge>
    ) : (
      <Badge variant="secondary" className="bg-gray-500">
        <ShieldX className="h-3 w-3 mr-1" />
        Inactive
      </Badge>
    );
  };

  const formatRolePermissionActions = (actions: string[] | null | undefined) => {
    if (!actions || actions.length === 0) return "Not assigned";
    return actions.join(", ");
  };

  const getAssignedRolePermissions = (
    permissionsList: Array<{
      permissionName: string;
      roleAllowedActions?: string[] | null;
      isAssigned?: boolean;
    }> | undefined
  ) => {
    if (!permissionsList) return [];
    const isAssignedOnlyResponse =
      permissionsList.length > 0 &&
      permissionsList.length < (permissions?.length || Number.MAX_SAFE_INTEGER);
    if (isAssignedOnlyResponse) {
      return permissionsList;
    }
    return permissionsList.filter((permission) =>
      permission.isAssigned === true ||
      (Array.isArray(permission.roleAllowedActions) && permission.roleAllowedActions.length > 0)
    );
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Open Create Admin Modal
  const openAdminModal = () => {
    setIsCreateModalOpen(true);
  };

  const handleCreateModalOpenChange = (open: boolean) => {
    if (!open) closeAdminModal();
  };

  const handleEditModalOpenChange = (open: boolean) => {
    if (!open) closeAdminModal();
  };

  // Close Modal and Reset All States
  const closeAdminModal = () => {
    setIsCreateModalOpen(false);
    setIsEditModalOpen(false);
    setFormData({
      email: "",
      password: "",
      firstName: "",
      lastName: "",
      role: "admin",
      permissions: [],
      isActive: true,
    });
    setSelectedRoleId(null);
    setSelectedPermissionIds([]);
    setPasswordErrors({
      hasUppercase: false,
      hasNumber: false,
      hasSpecialChar: false,
      hasMinLength: false,
    });

    // extra cleanup to ensure no leftover modal artifacts (focus lock / overlays)
    cleanupModalArtifacts();
    setSelectedAdmin(null);
  };

  // If user doesn't have permission, show access denied
  if (!canAccess || !canReadAdmins) {
    return (
      <div className="flex items-center justify-center py-12">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <ShieldX className="h-12 w-12 mx-auto text-red-500 mb-4" />
              <h3 className="text-lg font-medium mb-2">Access Denied</h3>
              <p className="text-muted-foreground">
                You don't have permission to access this page. You need "admin_management" read access (or "all_allowed") to view admins.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        page="admin"
        heading="Admin Management"
        subHeading="Manage admin accounts, permissions, and access controls"
        openModal={canCreateAdmins ? openAdminModal : undefined}
      />

      <Dialog open={isCreateModalOpen} onOpenChange={handleCreateModalOpenChange}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">Add New Admin</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            {/* Basic Information Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Basic Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">First Name *</label>
                  <Input
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    placeholder="Enter first name"
                    className="h-10"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Last Name *</label>
                  <Input
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    placeholder="Enter last name"
                    className="h-10"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Email *</label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="Enter email"
                  className="h-10"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password *</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => handlePasswordChange(e.target.value)}
                  placeholder="Enter password"
                  className="h-10"
                />
                {formData.password && (
                  <div className="mt-2 space-y-1">
                    <div className={`flex items-center gap-2 text-xs ${passwordErrors.hasMinLength ? 'text-green-600' : 'text-red-600'}`}>
                      {passwordErrors.hasMinLength ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                      <span>At least 8 characters</span>
                    </div>
                    <div className={`flex items-center gap-2 text-xs ${passwordErrors.hasUppercase ? 'text-green-600' : 'text-red-600'}`}>
                      {passwordErrors.hasUppercase ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                      <span>At least one uppercase letter (A-Z)</span>
                    </div>
                    <div className={`flex items-center gap-2 text-xs ${passwordErrors.hasNumber ? 'text-green-600' : 'text-red-600'}`}>
                      {passwordErrors.hasNumber ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                      <span>At least one number (0-9)</span>
                    </div>
                    <div className={`flex items-center gap-2 text-xs ${passwordErrors.hasSpecialChar ? 'text-green-600' : 'text-red-600'}`}>
                      {passwordErrors.hasSpecialChar ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                      <span>At least one special character (!@#$%^&*)</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Role & Permissions Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 border-b pb-2">
                Role & Permissions <span className="text-red-500">*</span>
              </h3>
              <Alert>
                <AlertDescription>
                  You must assign at least one <strong>Role</strong> OR <strong>Individual Permission</strong> to the admin.
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Role Selection */}
                <div className="space-y-2">
                  <Label htmlFor="role">Assign Role (Optional)</Label>
                  <select
                    id="role"
                    value={selectedRoleId || ""}
                    onChange={(e) => setSelectedRoleId(e.target.value || null)}
                    className="w-full px-3 py-2 border border-border rounded-md bg-background h-10"
                  >
                    <option value="">Select a role...</option>
                    {roles?.map((role) => (
                      <option key={role.id} value={role.id}>
                        {role.roleName} {role.description ? `- ${role.description}` : ''}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-muted-foreground">
                    Select a role to assign all permissions from that role
                  </p>
                </div>

                {/* Individual Permissions */}
                <div className="space-y-2">
                  <Label>Assign Individual Permissions (Optional)</Label>
                  <div className="max-h-48 overflow-y-auto border rounded-md p-2 space-y-2">
                    {isLoadingPermissions ? (
                      <div className="flex items-center justify-center py-4">
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        <span className="text-sm text-muted-foreground">Loading permissions...</span>
                      </div>
                    ) : permissions && permissions.length > 0 ? (
                      permissions.map((permission) => (
                        <label
                          key={permission.id}
                          className="flex items-center space-x-2 p-2 border rounded-md hover:bg-gray-50 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={selectedPermissionIds.includes(String(permission.id))}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedPermissionIds([...selectedPermissionIds, String(permission.id)]);
                              } else {
                                setSelectedPermissionIds(
                                  selectedPermissionIds.filter((id) => id !== String(permission.id))
                                );
                              }
                            }}
                            className="rounded border-gray-300"
                          />
                          <span className="text-sm font-medium">{permission.permissionName}</span>
                          {permission.allowedActions && permission.allowedActions.length > 0 && (
                            <Badge variant="outline" className="text-xs">
                              {permission.allowedActions.join(", ")}
                            </Badge>
                          )}
                        </label>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-2">No permissions available</p>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Select individual permissions to assign directly to the admin
                  </p>
                </div>
              </div>

              {/* Validation Message */}
              {!selectedRoleId && selectedPermissionIds.length === 0 && (
                <Alert variant="destructive">
                  <AlertDescription>
                    Please assign at least one role or individual permission.
                  </AlertDescription>
                </Alert>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 justify-end pt-4 border-t">
              <Button
                variant="outline"
                onClick={closeAdminModal}
                disabled={isCreating}
                className="px-6"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateAdmin}
                disabled={isCreating}
                className="bg-brand-green hover:bg-brand-green/90 text-white px-6"
              >
                {isCreating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Admin"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Statistics Cards */}
      {stats && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4"
        >
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium">Total</span>
              </div>
              <p className="text-2xl font-bold">{stats.total}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-red-600" />
                <span className="text-sm font-medium">Super Admins</span>
              </div>
              <p className="text-2xl font-bold">{stats.superAdmins}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium">Admins</span>
              </div>
              <p className="text-2xl font-bold">{stats.admins}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium">Active</span>
              </div>
              <p className="text-2xl font-bold">{stats.active}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <ShieldX className="h-4 w-4 text-gray-600" />
                <span className="text-sm font-medium">Inactive</span>
              </div>
              <p className="text-2xl font-bold">{stats.inactive}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium">Online</span>
              </div>
              <p className="text-2xl font-bold">{stats.online}</p>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search admins by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-3 py-2 border border-border rounded-md bg-background text-sm"
            >
              {roleList?.map(list => (
                <option key={list?.value} value={list?.value}>{list?.name}</option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-border rounded-md bg-background text-sm"
            >
              {activeList?.map(list => (
                <option key={list?.value} value={list?.value}>{list?.name}</option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Admins List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Admins ({pagination.total})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="mb-4 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                <p className="text-destructive text-sm">{error}</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => refetch()}
                  className="mt-2"
                >
                  Retry
                </Button>
              </div>
            )}

            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                <span className="ml-2 text-muted-foreground">Loading admins...</span>
              </div>
            ) : (
              <>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead>Last Login</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {!admins || admins.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                            No admins found
                          </TableCell>
                        </TableRow>
                      ) : (
                        (admins as AdminUser[]).map((admin) => (
                          <TableRow key={admin.id}>
                            <TableCell className="font-medium">
                              {admin.firstName} {admin.lastName}
                            </TableCell>
                            <TableCell>{admin.email}</TableCell>
                            <TableCell>{getRoleBadge(admin)}</TableCell>
                            <TableCell>{getStatusBadge(admin.isActive)}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {formatDate(admin.createdAt)}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {admin.lastLogin ? formatDate(admin.lastLogin) : '-'}
                            </TableCell>
                            <TableCell className="text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0"
                                  >
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => openViewModal(admin)}>
                                    <Eye className="h-4 w-4 mr-2" />
                                    View Details
                                  </DropdownMenuItem>
                                  {canUpdateAdmins && (
                                    <DropdownMenuItem onClick={() => openEditModal(admin)}>
                                      <Edit className="h-4 w-4 mr-2" />
                                      Edit Admin
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuItem onClick={() => openPasswordModal(admin)}>
                                    <Lock className="h-4 w-4 mr-2" />
                                    Change Password
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => toggleStatus(admin.id)}
                                    disabled={isTogglingStatus}
                                  >
                                    {isTogglingStatus ? (
                                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    ) : admin.isActive ? (
                                      <ShieldX className="h-4 w-4 mr-2" />
                                    ) : (
                                      <ShieldCheck className="h-4 w-4 mr-2" />
                                    )}
                                    {admin.isActive ? "Deactivate" : "Activate"}
                                  </DropdownMenuItem>
                                  {canDeleteAdmins && (
                                    <DropdownMenuItem
                                      onClick={() => openDeleteModal(admin)}
                                      disabled={isDeleting}
                                      className="text-destructive"
                                    >
                                      {isDeleting ? (
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                      ) : (
                                        <Trash2 className="h-4 w-4 mr-2" />
                                      )}
                                      Delete Admin
                                    </DropdownMenuItem>
                                  )}
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
                {pagination.totalPages > 1 && (
                  <div className="flex items-center justify-between mt-6 pt-4 border-t">
                    <div className="text-sm text-muted-foreground">
                      Showing {((pagination.page - 1) * pagination.limit) + 1} to{" "}
                      {Math.min(pagination.page * pagination.limit, pagination.total)} of{" "}
                      {pagination.total} admins
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(pagination.page - 1)}
                        disabled={!pagination.hasPrevPage || isLoading}
                      >
                        Previous
                      </Button>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                          const page = i + 1;
                          return (
                            <Button
                              key={page}
                              variant={page === pagination.page ? "default" : "outline"}
                              size="sm"
                              onClick={() => handlePageChange(page)}
                              disabled={isLoading}
                              className="w-8 h-8 p-0"
                            >
                              {page}
                            </Button>
                          );
                        })}
                        {pagination.totalPages > 5 && (
                          <span className="text-sm text-muted-foreground px-2">...</span>
                        )}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(pagination.page + 1)}
                        disabled={!pagination.hasNextPage || isLoading}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Edit Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={handleEditModalOpenChange}>
        {isEditModalOpen && (
          <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold">Edit Admin</DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              {/* Basic Information Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Basic Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">First Name *</label>
                    <Input
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      placeholder="Enter first name"
                      className="h-10"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Last Name *</label>
                    <Input
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      placeholder="Enter last name"
                      className="h-10"
                    />
                  </div>
                </div>
              </div>

              {/* Role & Permissions Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 border-b pb-2">
                  Role & Permissions <span className="text-red-500">*</span>
                </h3>
                <Alert>
                  <AlertDescription>
                    You must assign at least one <strong>Role</strong> OR <strong>Individual Permission</strong> to the admin.
                  </AlertDescription>
                </Alert>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Role Selection */}
                  <div className="space-y-2">
                    <Label htmlFor="edit-role">Assign Role (Optional)</Label>
                    <select
                      id="edit-role"
                      value={editSelectedRoleId || ""}
                      onChange={(e) => setEditSelectedRoleId(e.target.value || null)}
                      className="w-full px-3 py-2 border border-border rounded-md bg-background h-10"
                      disabled={isLoadingRoles}
                    >
                      <option value="">
                        {isLoadingRoles ? "Loading roles..." : "Select a role..."}
                      </option>
                      {roles && roles.length > 0 ? (
                        roles.map((role) => (
                          <option key={role.id} value={role.id}>
                            {role.roleName} {role.description ? `- ${role.description}` : ''}
                          </option>
                        ))
                      ) : (
                        !isLoadingRoles && <option value="" disabled>No roles available</option>
                      )}
                    </select>
                    {adminRoles?.roles && adminRoles.roles.length > 0 && (
                      <p className="text-xs text-muted-foreground">
                        Current roles: {adminRoles.roles.map(r => r.roleName).join(', ')}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Select a role to assign all permissions from that role
                    </p>
                    {editSelectedRoleId && (
                      <div className="mt-3 p-3 rounded-md border bg-muted/20 space-y-2">
                        <p className="text-xs font-medium text-muted-foreground">
                          Assigned permissions for selected role
                        </p>
                        {isLoadingEditRolePermissions ? (
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Loader2 className="h-3 w-3 animate-spin" />
                            Loading role permissions...
                          </div>
                        ) : getAssignedRolePermissions(editRolePermissions?.permissions).length > 0 ? (
                          <div className="max-h-28 overflow-y-auto space-y-1">
                            {getAssignedRolePermissions(editRolePermissions?.permissions).map((p, idx) => (
                              <div key={`${p.permissionName}-${idx}`} className="text-xs">
                                <span className="font-medium">{p.permissionName}</span>
                                <span className="text-muted-foreground"> - {formatRolePermissionActions(p.roleAllowedActions)}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-muted-foreground">No permissions assigned to this role.</p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Individual Permissions */}
                  <div className="space-y-2">
                    <Label>Assign Individual Permissions (Optional)</Label>
                    <div className="max-h-48 overflow-y-auto border rounded-md p-2 space-y-2">
                      {isLoadingPermissions ? (
                        <div className="flex items-center justify-center py-4">
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          <span className="text-sm text-muted-foreground">Loading permissions...</span>
                        </div>
                      ) : permissions && permissions.length > 0 ? (
                        permissions.map((permission) => (
                          <label
                            key={permission.id}
                            className={`flex items-center space-x-2 p-2 border rounded-md ${
                              roleDerivedPermissionNames.has(permission.permissionName)
                                ? "opacity-60 bg-muted/40 cursor-not-allowed"
                                : "hover:bg-gray-50 cursor-pointer"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={
                                roleDerivedPermissionNames.has(permission.permissionName) ||
                                editSelectedPermissionIds.includes(String(permission.id))
                              }
                              disabled={roleDerivedPermissionNames.has(permission.permissionName)}
                              onChange={(e) => {
                                if (roleDerivedPermissionNames.has(permission.permissionName)) return;
                                if (e.target.checked) {
                                  setEditSelectedPermissionIds([...editSelectedPermissionIds, String(permission.id)]);
                                } else {
                                  setEditSelectedPermissionIds(
                                    editSelectedPermissionIds.filter((id) => id !== String(permission.id))
                                  );
                                }
                              }}
                              className="rounded border-gray-300"
                            />
                            <span className="text-sm font-medium">{permission.permissionName}</span>
                            {roleDerivedPermissionNames.has(permission.permissionName) && (
                              <Badge variant="secondary" className="text-xs">
                                From Role
                              </Badge>
                            )}
                            {permission.allowedActions && permission.allowedActions.length > 0 && (
                              <Badge variant="outline" className="text-xs">
                                {permission.allowedActions.join(", ")}
                              </Badge>
                            )}
                          </label>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground text-center py-2">No permissions available</p>
                      )}
                    </div>
                    {adminPermissions?.permissions && adminPermissions.permissions.length > 0 && (
                      <p className="text-xs text-muted-foreground">
                        Current permissions: {adminPermissions.permissions.map(p => p.permissionName).join(', ')}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Select individual permissions to assign directly to the admin
                    </p>
                  </div>
                </div>

                {/* Validation Message */}
                {!editSelectedRoleId && editSelectedPermissionIds.length === 0 && (
                  <Alert variant="destructive">
                    <AlertDescription>
                      Please assign at least one role or individual permission.
                    </AlertDescription>
                  </Alert>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 justify-end pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={closeAdminModal}
                  disabled={isUpdating}
                  className="px-6"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleEditAdmin}
                  disabled={isUpdating}
                  className="bg-brand-green hover:bg-brand-green/90 text-white px-6"
                >
                  {isUpdating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    "Update Admin"
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        {isDeleteModalOpen && (
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Trash2 className="h-5 w-5 text-destructive" />
                Delete Admin
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-red-100 to-red-200 rounded-full flex items-center justify-center">
                  <Trash2 className="h-5 w-5 text-red-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900">
                    Are you sure you want to delete this admin?
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    This action cannot be undone. The admin account for{" "}
                    <span className="font-medium text-gray-900">
                      {selectedAdmin?.firstName} {selectedAdmin?.lastName}
                    </span>{" "}
                    will be permanently removed.
                  </p>
                </div>
              </div>

              {selectedAdmin && (
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="text-sm">
                    <p className="font-medium text-gray-900">
                      {selectedAdmin.firstName} {selectedAdmin.lastName}
                    </p>
                    <p className="text-gray-500 mt-1">
                      {selectedAdmin.email}
                    </p>
                    <p className="text-gray-500 text-xs mt-1">
                      Created {formatDate(selectedAdmin.createdAt)}
                    </p>
                  </div>
                </div>
              )}

              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setIsDeleteModalOpen(false)}
                  disabled={isDeleting}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDeleteAdmin}
                  disabled={isDeleting}
                  className="bg-red-600 hover:bg-red-700"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Admin
                    </>
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>

      {/* Change Password Modal */}
      <Dialog open={isPasswordModalOpen} onOpenChange={setIsPasswordModalOpen}>
        {isPasswordModalOpen && (
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Change Admin Password
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              {/* Admin Info */}
              {selectedAdmin && (
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <Users className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-blue-900">{selectedAdmin.firstName} {selectedAdmin.lastName}</p>
                      <p className="text-sm text-blue-700">{selectedAdmin.email}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Password Form */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">New Password *</label>
                  <Input
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                    placeholder="Enter new password"
                    className="h-10"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Confirm Password *</label>
                  <Input
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                    placeholder="Confirm new password"
                    className="h-10"
                  />
                </div>
              </div>

              {/* Security Notice */}
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <div className="w-5 h-5 bg-yellow-100 rounded-full flex items-center justify-center mt-0.5">
                    <span className="text-yellow-600 text-xs font-bold">!</span>
                  </div>
                  <div className="text-sm">
                    <p className="font-medium text-yellow-900">Security Notice</p>
                    <p className="text-yellow-700 mt-1">
                      The admin will be notified of this password change. Make sure to use a strong password.
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 justify-end pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => setIsPasswordModalOpen(false)}
                  disabled={isChangingPassword}
                  className="px-6"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleChangePassword}
                  disabled={isChangingPassword}
                  className="bg-brand-green hover:bg-brand-green/90 text-white px-6"
                >
                  {isChangingPassword ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Changing...
                    </>
                  ) : (
                    "Change Password"
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>

      {/* View Details Modal */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        {isViewModalOpen && (
          <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Admin Details
              </DialogTitle>
            </DialogHeader>
            {selectedAdmin && (
              <div className="space-y-6">
                {/* Admin Header */}
                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                  <div className="w-16 h-16 bg-brand-green/20 rounded-full flex items-center justify-center">
                    <Users className="h-8 w-8 text-brand-green" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold">{selectedAdmin.firstName} {selectedAdmin.lastName}</h3>
                    <p className="text-sm text-muted-foreground">
                      {selectedAdmin.email}
                    </p>
                  </div>
                  <div className="flex flex-col gap-2">
                    {getRoleBadge(selectedAdmin)}
                    {getStatusBadge(selectedAdmin.isActive)}
                  </div>
                </div>

                {/* Account Information */}
                <div className="space-y-4">
                    <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Account Information</h3>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <Calendar className="h-5 w-5 text-gray-600" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">Created</p>
                          <p className="text-sm text-gray-600">{formatDate(selectedAdmin.createdAt)}</p>
                        </div>
                      </div>
                      {selectedAdmin.lastLogin && (
                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                          <Calendar className="h-5 w-5 text-gray-600" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">Last Login</p>
                            <p className="text-sm text-gray-600">{formatDate(selectedAdmin.lastLogin)}</p>
                          </div>
                        </div>
                      )}
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <Lock className="h-5 w-5 text-gray-600" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">2FA Status</p>
                          <p className="text-sm text-gray-600">
                            {selectedAdmin.twoFactorEnabled ? 'Enabled' : 'Disabled'}
                          </p>
                        </div>
                      </div>
                    </div>
                </div>

                {/* Permissions */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900 border-b pb-2">
                    Permissions
                  </h3>

                  <div className="grid grid-cols-2 gap-3">
                    {selectedAdmin.permissions.map((permission) => (
                      <div
                        key={permission}
                        className="flex items-start gap-2 p-3 bg-green-50 border border-green-200 rounded-lg"
                      >
                        <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>

                        <span className="text-sm font-medium text-green-800 capitalize break-words min-w-0">
                          {permission}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Assigned permissions through role */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900 border-b pb-2">
                    Assigned Permissions (via Role)
                  </h3>
                  {isLoadingViewRolePermissions ? (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading role permissions...
                    </div>
                  ) : getAssignedRolePermissions(viewRolePermissions?.permissions).length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {getAssignedRolePermissions(viewRolePermissions?.permissions).map((permission, idx) => (
                        <div
                          key={`${permission.permissionName}-${idx}`}
                          className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg"
                        >
                          <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-blue-800 break-words">
                              {permission.permissionName}
                            </p>
                            <p className="text-xs text-blue-700 mt-1">
                              Actions: {formatRolePermissionActions(permission.roleAllowedActions)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No role permissions available.</p>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 justify-end pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => setIsViewModalOpen(false)}
                    className="px-6"
                  >
                    Close
                  </Button>
                  <Button
                    onClick={() => {
                      setIsViewModalOpen(false);
                      openEditModal(selectedAdmin);
                    }}
                    className="bg-brand-green hover:bg-brand-green/90 text-white px-6"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Admin
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
} 
