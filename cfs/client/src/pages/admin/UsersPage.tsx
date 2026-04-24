import { useState } from 'react'

import RoleForm from '../../components/admin/RoleForm'
import type { User } from '../../graphql/generated-types'
import { useCreateUserMutation, useDeleteUserMutation, useCreateRoleMutation, useUpdateRoleMutation, useDeleteRoleMutation } from '../../graphql/mutations'
import { useUsersQuery, useRolesQuery } from '../../graphql/queries'
import { useAuth } from '../../hooks/useAuth'
import theme from '../../theme'

interface RoleItem {
  id: string
  name: string
  permissions: string[]
}

function toErrorMessage(err: unknown, fallback: string): string {
  return err instanceof Error ? err.message : fallback
}

export default function UsersPage() {
  const { user, can } = useAuth()
  const [usersResult] = useUsersQuery()
  const [rolesResult] = useRolesQuery()
  const [, createUserMutation] = useCreateUserMutation()
  const [, deleteUserMutation] = useDeleteUserMutation()
  const [, createRoleMutation] = useCreateRoleMutation()
  const [, updateRoleMutation] = useUpdateRoleMutation()
  const [, deleteRoleMutation] = useDeleteRoleMutation()

  const users: User[] = usersResult.data?.users ?? []
  const roles: RoleItem[] = rolesResult.data?.roles ?? []

  // Permissions
  const canManageUsers = can('user.create') && can('user.delete')
  const canManageRoles = can('role.create') && can('role.delete')

  // User form state
  const [newUserEmail, setNewUserEmail] = useState('')
  const [newUserPassword, setNewUserPassword] = useState('')
  const [newUserRole, setNewUserRole] = useState('STAFF')
  const [createError, setCreateError] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [showUserForm, setShowUserForm] = useState(false)

  // Role form state
  const [showRoleForm, setShowRoleForm] = useState(false)
  const [editingRole, setEditingRole] = useState<RoleItem | null>(null)

  const isSystemRole = (name: string) => name === 'ADMIN' || name === 'STAFF'

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreateError(null)
    try {
      const result = await createUserMutation({
        input: { email: newUserEmail, password: newUserPassword, role: newUserRole }
      })
      if (result.error) {
        setCreateError(result.error.message)
        return
      }
      setNewUserEmail('')
      setNewUserPassword('')
      setNewUserRole('STAFF')
      setShowUserForm(false)
    } catch (err: unknown) {
      setCreateError(toErrorMessage(err, 'Error al crear usuario'))
    }
  }

  const handleDeleteUser = async (userId: string) => {
    // Prevent self-delete
    if (userId === user?.id) {
      setDeleteError('No puedes eliminarte a ti mismo')
      return
    }

    try {
      const result = await deleteUserMutation({ id: userId })
      if (result.error) {
        setDeleteError(result.error.message)
      }
    } catch (err: unknown) {
      setDeleteError(toErrorMessage(err, 'Error al eliminar usuario'))
    }
  }

  const handleEditRole = (role: RoleItem) => {
    setEditingRole(role)
    setShowRoleForm(true)
  }

  const handleDeleteRole = async (roleId: string) => {
    if (!confirm('¿Eliminar este rol?')) return
    try {
      const result = await deleteRoleMutation({ id: roleId })
      if (result.error) {
        alert('Error: ' + result.error.message)
      }
    } catch (err: unknown) {
      alert('Error: ' + toErrorMessage(err, 'Error al eliminar rol'))
    }
  }

  const handleSaveRole = async (data: { name: string; permissions: string[] }, id?: string) => {
    try {
      if (id) {
        const result = await updateRoleMutation({ id, input: data })
        if (result.error) {
          alert('Error: ' + result.error.message)
          return
        }
      } else {
        const result = await createRoleMutation({ input: data })
        if (result.error) {
          alert('Error: ' + result.error.message)
          return
        }
      }
      setShowRoleForm(false)
      setEditingRole(null)
    } catch (err: unknown) {
      alert('Error: ' + toErrorMessage(err, 'Error al guardar rol'))
    }
  }

  return (
    <div data-testid="users-page">
      {/* Users Section */}
      <section style={{ marginBottom: theme.spacing['2xl'] }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing.md }}>
          <h1 style={{
            color: theme.colors.text,
            fontSize: theme.typography.fontSize.xl,
            fontWeight: theme.typography.fontWeight.semibold,
          }}>
            Gestión de Usuarios
          </h1>
          {canManageUsers && !showUserForm && (
            <button
              onClick={() => setShowUserForm(true)}
              style={{
                padding: `${theme.spacing.sm} ${theme.spacing.md}`,
                background: theme.colors.accent,
                color: theme.colors.background,
                border: 'none',
                borderRadius: theme.borderRadius.sm,
                cursor: 'pointer',
                fontWeight: theme.typography.fontWeight.semibold,
                fontSize: theme.typography.fontSize.sm,
              }}
            >
              Añadir Usuario
            </button>
          )}
        </div>

        {showUserForm && canManageUsers && (
          <form
            onSubmit={handleCreateUser}
            data-testid="create-user-form"
            style={{
              background: theme.colors.surface,
              borderRadius: theme.borderRadius.md,
              border: `1px solid ${theme.colors.border}`,
              padding: theme.spacing.lg,
              marginBottom: theme.spacing.lg,
            }}
          >
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: theme.spacing.md }}>
              <div>
                <label style={{ display: 'block', color: theme.colors.textSecondary, fontSize: theme.typography.fontSize.xs, marginBottom: theme.spacing.xs }}>
                  Email *
                </label>
                <input
                  type="email"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: theme.spacing.sm,
                    background: theme.colors.background,
                    border: `1px solid ${theme.colors.border}`,
                    borderRadius: theme.borderRadius.sm,
                    color: theme.colors.text,
                    fontSize: theme.typography.fontSize.sm,
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', color: theme.colors.textSecondary, fontSize: theme.typography.fontSize.xs, marginBottom: theme.spacing.xs }}>
                  Contraseña *
                </label>
                <input
                  type="password"
                  value={newUserPassword}
                  onChange={(e) => setNewUserPassword(e.target.value)}
                  required
                  minLength={8}
                  style={{
                    width: '100%',
                    padding: theme.spacing.sm,
                    background: theme.colors.background,
                    border: `1px solid ${theme.colors.border}`,
                    borderRadius: theme.borderRadius.sm,
                    color: theme.colors.text,
                    fontSize: theme.typography.fontSize.sm,
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', color: theme.colors.textSecondary, fontSize: theme.typography.fontSize.xs, marginBottom: theme.spacing.xs }}>
                  Rol *
                </label>
                <select
                  value={newUserRole}
                  onChange={(e) => setNewUserRole(e.target.value)}
                  style={{
                    width: '100%',
                    padding: theme.spacing.sm,
                    background: theme.colors.background,
                    border: `1px solid ${theme.colors.border}`,
                    borderRadius: theme.borderRadius.sm,
                    color: theme.colors.text,
                    fontSize: theme.typography.fontSize.sm,
                  }}
                >
                  <option value="STAFF">Staff</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
            </div>
            {createError && (
              <p style={{ color: theme.colors.error, marginTop: theme.spacing.md, fontSize: theme.typography.fontSize.sm }}>
                {createError}
              </p>
            )}
            {deleteError && (
              <p style={{ color: theme.colors.error, marginTop: theme.spacing.md, fontSize: theme.typography.fontSize.sm }}>
                {deleteError}
              </p>
            )}
            <div style={{ display: 'flex', gap: theme.spacing.sm, marginTop: theme.spacing.md }}>
              <button
                type="submit"
                style={{
                  padding: `${theme.spacing.sm} ${theme.spacing.md}`,
                  background: theme.colors.accent,
                  color: theme.colors.background,
                  border: 'none',
                  borderRadius: theme.borderRadius.sm,
                  cursor: 'pointer',
                  fontWeight: theme.typography.fontWeight.semibold,
                  fontSize: theme.typography.fontSize.sm,
                }}
              >
                Crear Usuario
              </button>
              <button
                type="button"
                onClick={() => setShowUserForm(false)}
                style={{
                  padding: `${theme.spacing.sm} ${theme.spacing.md}`,
                  background: theme.colors.border,
                  color: theme.colors.text,
                  border: 'none',
                  borderRadius: theme.borderRadius.sm,
                  cursor: 'pointer',
                  fontWeight: theme.typography.fontWeight.semibold,
                  fontSize: theme.typography.fontSize.sm,
                }}
              >
                Cancelar
              </button>
            </div>
          </form>
        )}

        <div
          style={{
            background: theme.colors.surface,
            borderRadius: theme.borderRadius.md,
            border: `1px solid ${theme.colors.border}`,
            overflow: 'hidden',
          }}
        >
          {users.length === 0 ? (
            <p style={{ color: theme.colors.textSecondary, padding: theme.spacing.md, textAlign: 'center' }}>
              No hay usuarios
            </p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: theme.colors.border }}>
                  <th style={{ padding: theme.spacing.sm, textAlign: 'left', color: theme.colors.textSecondary, fontSize: theme.typography.fontSize.xs }}>Email</th>
                  <th style={{ padding: theme.spacing.sm, textAlign: 'left', color: theme.colors.textSecondary, fontSize: theme.typography.fontSize.xs }}>Rol</th>
                  <th style={{ padding: theme.spacing.sm, textAlign: 'left', color: theme.colors.textSecondary, fontSize: theme.typography.fontSize.xs }}>Fecha</th>
                  <th style={{ padding: theme.spacing.sm, textAlign: 'right', color: theme.colors.textSecondary, fontSize: theme.typography.fontSize.xs }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} style={{ borderBottom: `1px solid ${theme.colors.border}` }}>
                    <td style={{ padding: theme.spacing.sm, color: theme.colors.text }}>{u.email}</td>
                    <td style={{ padding: theme.spacing.sm }}>
                      <span
                        style={{
                          padding: `${theme.spacing.xs} ${theme.spacing.xs}`,
                          background: u.role === 'ADMIN' ? theme.colors.accent : theme.colors.border,
                          color: u.role === 'ADMIN' ? theme.colors.background : theme.colors.text,
                          borderRadius: theme.borderRadius.sm,
                          fontSize: theme.typography.fontSize.xs,
                          fontWeight: theme.typography.fontWeight.semibold,
                        }}
                      >
                        {u.role === 'ADMIN' ? 'Admin' : 'Staff'}
                      </span>
                    </td>
                    <td style={{ padding: theme.spacing.sm, color: theme.colors.textSecondary, fontSize: theme.typography.fontSize.xs }}>
                      {new Date(u.createdAt).toLocaleDateString('es-ES')}
                    </td>
                    <td style={{ padding: theme.spacing.sm, textAlign: 'right' }}>
                      {u.id !== user?.id && canManageUsers && (
                        <button
                          data-testid="delete-user-btn"
                          onClick={() => handleDeleteUser(u.id)}
                          style={{
                            padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
                            background: theme.colors.border,
                            color: theme.colors.text,
                            border: 'none',
                            borderRadius: theme.borderRadius.sm,
                            cursor: 'pointer',
                            fontSize: theme.typography.fontSize.xs,
                            fontWeight: theme.typography.fontWeight.semibold,
                          }}
                        >
                          Eliminar
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>

      {/* Roles Section - Admin only */}
      {canManageRoles && (
        <section>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing.md }}>
            <h2 style={{
              color: theme.colors.text,
              fontSize: theme.typography.fontSize.lg,
              fontWeight: theme.typography.fontWeight.semibold,
            }}>
              Gestión de Roles
            </h2>
            <button
              onClick={() => { setEditingRole(null); setShowRoleForm(true) }}
              style={{
                padding: `${theme.spacing.sm} ${theme.spacing.md}`,
                background: theme.colors.accent,
                color: theme.colors.background,
                border: 'none',
                borderRadius: theme.borderRadius.sm,
                cursor: 'pointer',
                fontWeight: theme.typography.fontWeight.semibold,
                fontSize: theme.typography.fontSize.sm,
              }}
            >
              Añadir Rol
            </button>
          </div>

          {showRoleForm && (
            <RoleForm
              editingRole={editingRole}
              onSave={handleSaveRole}
              onCancel={() => { setShowRoleForm(false); setEditingRole(null); }}
            />
          )}

          <div
            style={{
              background: theme.colors.surface,
              borderRadius: theme.borderRadius.md,
              border: `1px solid ${theme.colors.border}`,
              overflow: 'hidden',
            }}
          >
            {roles.length === 0 ? (
              <p style={{ color: theme.colors.textSecondary, padding: theme.spacing.md, textAlign: 'center' }}>
                No hay roles
              </p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: theme.colors.border }}>
                    <th style={{ padding: theme.spacing.sm, textAlign: 'left', color: theme.colors.textSecondary, fontSize: theme.typography.fontSize.xs }}>Nombre</th>
                    <th style={{ padding: theme.spacing.sm, textAlign: 'left', color: theme.colors.textSecondary, fontSize: theme.typography.fontSize.xs }}>Permisos</th>
                    <th style={{ padding: theme.spacing.sm, textAlign: 'right', color: theme.colors.textSecondary, fontSize: theme.typography.fontSize.xs }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {roles.map((role) => (
                    <tr key={role.id} style={{ borderBottom: `1px solid ${theme.colors.border}` }}>
                      <td style={{ padding: theme.spacing.sm, color: theme.colors.text, fontWeight: theme.typography.fontWeight.medium }}>
                        {role.name}
                        {isSystemRole(role.name) && (
                          <span style={{ marginLeft: theme.spacing.xs, fontSize: theme.typography.fontSize.xs, color: theme.colors.textSecondary }}>
                            (sistema)
                          </span>
                        )}
                      </td>
                      <td style={{ padding: theme.spacing.sm, color: theme.colors.textSecondary, fontSize: theme.typography.fontSize.xs }}>
                        {role.permissions.length} permisos
                      </td>
                      <td style={{ padding: theme.spacing.sm, textAlign: 'right' }}>
                        {!isSystemRole(role.name) && (
                          <>
                            <button
                              onClick={() => handleEditRole(role)}
                              style={{
                                padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
                                background: theme.colors.accent,
                                color: theme.colors.background,
                                border: 'none',
                                borderRadius: theme.borderRadius.sm,
                                cursor: 'pointer',
                                fontSize: theme.typography.fontSize.xs,
                                fontWeight: theme.typography.fontWeight.semibold,
                                marginRight: theme.spacing.xs,
                              }}
                            >
                              Editar
                            </button>
                            <button
                              onClick={() => handleDeleteRole(role.id)}
                              style={{
                                padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
                                background: theme.colors.error,
                                color: '#fff',
                                border: 'none',
                                borderRadius: theme.borderRadius.sm,
                                cursor: 'pointer',
                                fontSize: theme.typography.fontSize.xs,
                                fontWeight: theme.typography.fontWeight.semibold,
                              }}
                            >
                              Eliminar
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>
      )}
    </div>
  )
}
