import { useState } from "react";
import { Layout, FloatButton } from "antd";
import { VerticalAlignTopOutlined } from "@ant-design/icons";
import AdminHeader from "./AdminHeader";
import AdminSidebar from "./AdminSidebar";

const { Content } = Layout;

export default function AdminLayout({ children }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <Layout style={{ minHeight: "100vh", backgroundColor: "#f0f2f5" }}>
      <AdminSidebar collapsed={collapsed} onCollapse={setCollapsed} />
      
      <Layout style={{ marginLeft: collapsed ? 80 : 280, transition: "all 0.2s" }}>
        <AdminHeader />
        
        <Content
          style={{
            margin: "24px 24px 0",
            overflow: "initial",
            minHeight: "calc(100vh - 112px)",
          }}
        >
          <div
            style={{
              padding: 24,
              minHeight: 360,
              background: "#ffffff",
              borderRadius: 12,
              boxShadow: "0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24)",
              border: "1px solid #e8e8e8",
              position: "relative",
              overflow: "hidden",
            }}
          >
            {/* Content Background Pattern */}
            <div
              style={{
                position: "absolute",
                top: 0,
                right: 0,
                width: 200,
                height: 200,
                background: "linear-gradient(135deg, rgba(24, 144, 255, 0.02) 0%, rgba(9, 109, 217, 0.04) 100%)",
                borderRadius: "50%",
                transform: "translate(50%, -50%)",
                pointerEvents: "none",
              }}
            />
            
            <div style={{ position: "relative", zIndex: 1 }}>
              {children}
            </div>
          </div>
          
          {/* Footer */}
          <div
            style={{
              textAlign: "center",
              padding: "24px 0",
              color: "#8c8c8c",
              fontSize: 14,
            }}
          >
            
          </div>
        </Content>
      </Layout>

      {/* Scroll to top button */}
      <FloatButton.BackTop
        style={{
          right: 24,
          bottom: 24,
        }}
        icon={<VerticalAlignTopOutlined />}
      />
    </Layout>
  );
}