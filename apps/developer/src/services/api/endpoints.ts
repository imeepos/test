/**
 * API 端点常量
 * 集中管理所有 API 路径
 */

// 基础路径
const BASE = {
  AUTH: '/auth',
  USERS: '/users',
  PROJECTS: '/projects',
  PLUGINS: '/plugins',
  DOCS: '/docs',
  COMMUNITY: '/community',
  MARKETPLACE: '/marketplace',
  SETTINGS: '/settings',
}

// 认证相关端点
export const AUTH_ENDPOINTS = {
  LOGIN: `${BASE.AUTH}/login`,
  REGISTER: `${BASE.AUTH}/register`,
  LOGOUT: `${BASE.AUTH}/logout`,
  REFRESH_TOKEN: `${BASE.AUTH}/refresh`,
  FORGOT_PASSWORD: `${BASE.AUTH}/forgot-password`,
  RESET_PASSWORD: `${BASE.AUTH}/reset-password`,
  VERIFY_EMAIL: `${BASE.AUTH}/verify-email`,
}

// 用户相关端点
export const USER_ENDPOINTS = {
  ME: `${BASE.USERS}/me`,
  PROFILE: `${BASE.USERS}/profile`,
  UPDATE_PROFILE: `${BASE.USERS}/profile`,
  CHANGE_PASSWORD: `${BASE.USERS}/change-password`,
  UPLOAD_AVATAR: `${BASE.USERS}/avatar`,
}

// 项目相关端点
export const PROJECT_ENDPOINTS = {
  LIST: `${BASE.PROJECTS}`,
  CREATE: `${BASE.PROJECTS}`,
  GET: (id: string) => `${BASE.PROJECTS}/${id}`,
  UPDATE: (id: string) => `${BASE.PROJECTS}/${id}`,
  DELETE: (id: string) => `${BASE.PROJECTS}/${id}`,
  FILES: (id: string) => `${BASE.PROJECTS}/${id}/files`,
  FILE: (id: string, path: string) => `${BASE.PROJECTS}/${id}/files/${path}`,
  BUILD: (id: string) => `${BASE.PROJECTS}/${id}/build`,
  RUN: (id: string) => `${BASE.PROJECTS}/${id}/run`,
  STATS: (id: string) => `${BASE.PROJECTS}/${id}/stats`,
}

// 插件相关端点
export const PLUGIN_ENDPOINTS = {
  LIST: `${BASE.PLUGINS}`,
  SEARCH: `${BASE.PLUGINS}/search`,
  GET: (id: string) => `${BASE.PLUGINS}/${id}`,
  CREATE: `${BASE.PLUGINS}`,
  UPDATE: (id: string) => `${BASE.PLUGINS}/${id}`,
  DELETE: (id: string) => `${BASE.PLUGINS}/${id}`,
  PUBLISH: (id: string) => `${BASE.PLUGINS}/${id}/publish`,
  INSTALL: (id: string) => `${BASE.PLUGINS}/${id}/install`,
  UNINSTALL: (id: string) => `${BASE.PLUGINS}/${id}/uninstall`,
  REVIEWS: (id: string) => `${BASE.PLUGINS}/${id}/reviews`,
  VERSIONS: (id: string) => `${BASE.PLUGINS}/${id}/versions`,
}

// 文档相关端点
export const DOC_ENDPOINTS = {
  LIST: `${BASE.DOCS}`,
  GET: (id: string) => `${BASE.DOCS}/${id}`,
  SEARCH: `${BASE.DOCS}/search`,
  CATEGORIES: `${BASE.DOCS}/categories`,
}

// 社区相关端点
export const COMMUNITY_ENDPOINTS = {
  POSTS: `${BASE.COMMUNITY}/posts`,
  POST: (id: string) => `${BASE.COMMUNITY}/posts/${id}`,
  CREATE_POST: `${BASE.COMMUNITY}/posts`,
  REPLIES: (postId: string) => `${BASE.COMMUNITY}/posts/${postId}/replies`,
  LIKE: (postId: string) => `${BASE.COMMUNITY}/posts/${postId}/like`,
  RESOURCES: `${BASE.COMMUNITY}/resources`,
  EVENTS: `${BASE.COMMUNITY}/events`,
}

// 市场相关端点
export const MARKETPLACE_ENDPOINTS = {
  FEATURED: `${BASE.MARKETPLACE}/featured`,
  TRENDING: `${BASE.MARKETPLACE}/trending`,
  NEW: `${BASE.MARKETPLACE}/new`,
  MY_PLUGINS: `${BASE.MARKETPLACE}/my-plugins`,
  REVENUE: `${BASE.MARKETPLACE}/revenue`,
  ANALYTICS: (pluginId: string) => `${BASE.MARKETPLACE}/analytics/${pluginId}`,
}

// 设置相关端点
export const SETTINGS_ENDPOINTS = {
  GET: `${BASE.SETTINGS}`,
  UPDATE: `${BASE.SETTINGS}`,
  API_KEYS: `${BASE.SETTINGS}/api-keys`,
  NOTIFICATIONS: `${BASE.SETTINGS}/notifications`,
  SECURITY: `${BASE.SETTINGS}/security`,
}

// 导出所有端点
export const ENDPOINTS = {
  AUTH: AUTH_ENDPOINTS,
  USER: USER_ENDPOINTS,
  PROJECT: PROJECT_ENDPOINTS,
  PLUGIN: PLUGIN_ENDPOINTS,
  DOC: DOC_ENDPOINTS,
  COMMUNITY: COMMUNITY_ENDPOINTS,
  MARKETPLACE: MARKETPLACE_ENDPOINTS,
  SETTINGS: SETTINGS_ENDPOINTS,
}

export default ENDPOINTS
