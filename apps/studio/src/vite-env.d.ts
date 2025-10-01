/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_TITLE: string
  readonly VITE_API_BASE_URL: string
  readonly VITE_AI_API_URL: string
  readonly VITE_WS_URL: string
  readonly VITE_GATEWAY_URL: string
  readonly VITE_STORE_URL: string
  // 更多环境变量...
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}