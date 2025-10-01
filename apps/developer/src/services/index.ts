/**
 * 服务层统一导出
 */
export { apiClient, request } from './api/client'
export { ENDPOINTS } from './api/endpoints'

export { ProjectService } from './project.service'
export { PluginService } from './plugin.service'
export { UserService } from './user.service'

export type {
  CreateProjectDTO,
  UpdateProjectDTO,
  ProjectFile,
  BuildOptions,
  BuildResult,
} from './project.service'

export type {
  SearchPluginParams,
  CreatePluginDTO,
  UpdatePluginDTO,
  PublishPluginDTO,
  PluginReview,
} from './plugin.service'

export type {
  LoginDTO,
  RegisterDTO,
  LoginResponse,
  UpdateProfileDTO,
  ChangePasswordDTO,
} from './user.service'
