import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import type { RootState } from "@/redux/store/store";
import PageHeader from "@/components/common/PageHeader";
import RetryPage from "@/components/common/RetryPage";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { canPerformAction } from "@/lib/permissions";
import { getDefaultLandingRoute } from "@/lib/adminRoutes";
import UsersList from "./UserList";
import DeletedAccountsList from "./DeletedAccountsList";

export default function UserManagement() {
  const navigate = useNavigate();
  const loginState = useSelector((state: RootState) => state.auth.loginState);
  const canReadUsers = canPerformAction(loginState as any, "user_management", "read");
  const [activeTab, setActiveTab] = useState("users");

  if (!canReadUsers) {
    return (
      <RetryPage
        message="Access denied. You don't have permission to view system users."
        btnName="Back"
        onRetry={() => navigate(getDefaultLandingRoute(loginState as any))}
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        page="systemuser"
        heading="User Management"
        subHeading="Manage system users and review deleted accounts"
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="users">System Users</TabsTrigger>
          <TabsTrigger value="deleted">Deleted Accounts</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="mt-0">
          <UsersList embedded />
        </TabsContent>

        <TabsContent value="deleted" className="mt-0">
          <DeletedAccountsList />
        </TabsContent>
      </Tabs>
    </div>
  );
}
