import client from './client'
import type { Team, User } from '../types'

interface Page<T> {
  content: T[]
}

export async function getTeams(): Promise<Team[]> {
  const { data } = await client.get<Page<Team>>('/teams', { params: { size: 200, sort: 'name' } })
  return data.content
}

export async function getTeamById(id: string): Promise<Team> {
  const { data } = await client.get<Team>(`/teams/${id}`)
  return data
}

export async function createTeam(name: string, directionId: string): Promise<Team> {
  const { data } = await client.post<Team>('/teams', { name, directionId })
  return data
}

export async function updateTeam(id: string, name: string, directionId: string): Promise<Team> {
  const { data } = await client.put<Team>(`/teams/${id}`, { id, name, directionId })
  return data
}

export async function deleteTeam(id: string): Promise<void> {
  await client.delete(`/teams/${id}`)
}

export async function getTeamUsers(teamId: string): Promise<User[]> {
  const { data } = await client.get<User[]>(`/teams/${teamId}/users`)
  return data
}

export async function addUserToTeam(teamId: string, userId: string): Promise<User> {
  const { data } = await client.put<User>(`/teams/${teamId}/users/${userId}`)
  return data
}

export async function removeUserFromTeam(teamId: string, userId: string): Promise<void> {
  await client.delete(`/teams/${teamId}/users/${userId}`)
}

export async function assignTeamLead(teamId: string, userId: string): Promise<Team> {
  const { data } = await client.patch<Team>(`/teams/${teamId}/lead`, { userId })
  return data
}

export async function getAvailableUsers(teamId: string): Promise<User[]> {
  const { data } = await client.get<User[]>(`/teams/${teamId}/available-users`)
  return data
}
