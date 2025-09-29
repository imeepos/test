import React from 'react'
import { Routes, Route } from 'react-router-dom'
import { Layout } from 'antd'
import { ErrorBoundary } from '@components/common/ErrorBoundary'
import { AppHeader } from '@components/layout/AppHeader'
import { AppSidebar } from '@components/layout/AppSidebar'
import { DashboardPage } from '@components/workspace/DashboardPage'
import { ProjectsPage } from '@components/workspace/ProjectsPage'
import { IDEPage } from '@components/workspace/IDEPage'
import { DocumentationPage } from '@components/docs/DocumentationPage'
import { ToolsPage } from '@components/tools/ToolsPage'
import { MarketplacePage } from '@components/marketplace/MarketplacePage'
import { CommunityPage } from '@components/community/CommunityPage'
import { SettingsPage } from '@components/settings/SettingsPage'

const { Content } = Layout

function App() {
  return (
    <ErrorBoundary>
      <Layout className="min-h-screen">
        <AppHeader />
        <Layout hasSider>
          <AppSidebar />
          <Layout>
            <Content className="m-0 p-0 overflow-hidden">
              <Routes>
                {/* 工作台路由 */}
                <Route path="/" element={<DashboardPage />} />
                <Route path="/workspace" element={<DashboardPage />} />
                <Route path="/workspace/dashboard" element={<DashboardPage />} />
                <Route path="/workspace/projects" element={<ProjectsPage />} />
                <Route path="/workspace/ide" element={<IDEPage />} />
                <Route path="/workspace/ide/:projectId" element={<IDEPage />} />

                {/* 文档路由 */}
                <Route path="/docs" element={<DocumentationPage />} />
                <Route path="/docs/:section" element={<DocumentationPage />} />
                <Route path="/docs/:section/:topic" element={<DocumentationPage />} />

                {/* 工具路由 */}
                <Route path="/tools" element={<ToolsPage />} />
                <Route path="/tools/:category" element={<ToolsPage />} />

                {/* 市场路由 */}
                <Route path="/marketplace" element={<MarketplacePage />} />
                <Route path="/marketplace/:section" element={<MarketplacePage />} />

                {/* 社区路由 */}
                <Route path="/community" element={<CommunityPage />} />
                <Route path="/community/:section" element={<CommunityPage />} />

                {/* 设置路由 */}
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/settings/:section" element={<SettingsPage />} />

                {/* 404 页面 */}
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </Content>
          </Layout>
        </Layout>
      </Layout>
    </ErrorBoundary>
  )
}

// 404 页面组件
const NotFoundPage: React.FC = () => {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">404</h1>
        <p className="text-lg text-gray-600 mb-8">页面未找到</p>
        <a
          href="/"
          className="developer-button developer-button-primary"
        >
          返回首页
        </a>
      </div>
    </div>
  )
}

export default App