import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Layout, Menu } from "antd";
import {
  DashboardOutlined,
  UserOutlined,
  CrownOutlined,
  LogoutOutlined,
  WalletOutlined,
} from "@ant-design/icons";
import { LoginPage } from "../features/auth/LoginPage";
import { ProtectedRoute } from "../features/auth/ProtectedRoute";
import { DashboardPage } from "../features/dashboard/DashboardPage";
import { UsersPage } from "../features/users/UsersPage";
import { VipsPage } from "../features/vips/VipsPage";
import { WithdrawsPage } from "../features/withdraws/WithdrawsPage";
import { useAuth } from "../hooks/useAuth";
import { useNavigate, useLocation } from "react-router-dom";

const { Header, Sider, Content } = Layout;

const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    {
      key: "/dashboard",
      icon: <DashboardOutlined />,
      label: "Dashboard",
    },
    {
      key: "/users",
      icon: <UserOutlined />,
      label: "Users",
    },
    {
      key: "/withdraws",
      icon: <WalletOutlined />,
      label: "Withdraws",
    },
    {
      key: "/vips",
      icon: <CrownOutlined />,
      label: "VIP Plans",
    },
  ];

  const handleMenuClick = (key: string) => {
    navigate(key);
  };

  return (
    <Layout className="min-h-screen">
      <Sider
        breakpoint="lg"
        collapsedWidth="0"
        theme="light"
        className="shadow-sm"
        width={240}
      >
        <div className="h-16 flex items-center justify-center border-b">
          <h1 className="text-xl font-bold text-gray-800">Admin Panel</h1>
        </div>
        <Menu
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => handleMenuClick(key)}
          className="border-r-0"
        />
        <div className="absolute bottom-4 left-0 right-0 px-4">
          <Menu
            mode="inline"
            items={[
              {
                key: "logout",
                icon: <LogoutOutlined />,
                label: "Logout",
                danger: true,
              },
            ]}
            onClick={logout}
          />
        </div>
      </Sider>
      <Layout>
        <Header className="bg-white shadow-sm px-6 flex items-center justify-between">
          <div className="text-gray-600">Welcome to Admin Panel</div>
        </Header>
        <Content className="bg-gray-50">{children}</Content>
      </Layout>
    </Layout>
  );
};

export const AppRouter: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <AppLayout>
                <DashboardPage />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/users"
          element={
            <ProtectedRoute>
              <AppLayout>
                <UsersPage />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/withdraws"
          element={
            <ProtectedRoute>
              <AppLayout>
                <WithdrawsPage />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/vips"
          element={
            <ProtectedRoute>
              <AppLayout>
                <VipsPage />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
};
