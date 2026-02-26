export interface Task {
  id: string
  title: string
  description?: string
  status: 'TO_DO' | 'IN_PROGRESS' | 'DONE'
  createdAt: string
  updatedAt: string
  deadline: string
  assigneeId?: string
  assigneeName?: string
  lastAssigneeId?: string
  lastAssigneeName?: string
  columnId?: string
  epicId: string
}

export interface Board {
  id: string
  name: string
  directionId: string
  archived: boolean
}

export interface Column {
  id: string
  title: string
  boardId: string
  order: number
}

export interface Epic {
  id: string
  title: string
  description?: string
  boardId: string
  teamId?: string
  archived?: boolean
}

export type BoardEventType =
  | 'TASK_CREATED'
  | 'TASK_MOVED'
  | 'TASK_UPDATED'
  | 'TASK_DELETED'
  | 'EPIC_CREATED'
  | 'EPIC_UPDATED'
  | 'EPIC_DELETED'
  | 'EPIC_ARCHIVED'
  | 'EPIC_RESTORED'
  | 'COLUMN_CREATED'
  | 'COLUMN_UPDATED'
  | 'COLUMN_DELETED'
  | 'BOARD_CREATED'
  | 'BOARD_UPDATED'
  | 'BOARD_DELETED'
  | 'BOARD_ARCHIVED'
  | 'BOARD_UNARCHIVED'

export interface BoardEvent {
  type: BoardEventType
  payload: Task | Epic | Board | Column
}

export interface AuthTokens {
  token: string
  refreshToken: string
  role?: string
  userId?: string
  teamId?: string
}

export interface Direction {
  id: string
  name: string
  description?: string
}

export type UserRole = 'ADMIN' | 'TEAM_LEAD' | 'DEVELOPER'

export interface User {
  id: string
  fullName: string
  email: string
  role: UserRole
  teamId?: string
}

export interface Team {
  id: string
  name: string
  directionId: string
  teamLeadId?: string
}
