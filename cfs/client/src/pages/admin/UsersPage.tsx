import { useState } from 'react'

import RoleForm from '../../components/admin/RoleForm'
import type { User } from '../../graphql/generated-types'
import { useCreateUserMutation, useDeleteUserMutation, useCreateRoleMutation, useUpdateRoleMutation, useDeleteRoleMutation } from '../../graphql/mutations'
import { useUsersQuery, useRolesQuery } from '../../graphql/queries'
import { useAuth } from '../../hooks/useAuth'
import { Button } from '../../shared/ui/Button'
import { Panel } from '../../shared/ui/Panel'
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
      <section style={{ marginBottom: theme.spacing['2xl'] }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing.md }}>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">Gestión de Usuarios</h1>
          {canManageUsers && !showUserForm && (
            <Button
              onClick={() => setShowUserForm(true)}
            >
              Añadir Usuario
            </Button>
          )}
        </div>

        {showUserForm && canManageUsers && (
          <Panel style={{ marginBottom: theme.spacing.lg }}>
            <form onSubmit={handleCreateUser} data-testid="create-user-form">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
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
              <Button type="submit">
                Crear Usuario
              </Button>
              <Button type="button" onClick={() => setShowUserForm(false)} variant="secondary">
                Cancelar
              </Button>
            </div>
            </form>
          </Panel>
        )}

        <Panel style={{ overflow: 'hidden' }}>
          {users.length === 0 ? (
            <p style={{ color: theme.colors.textSecondary, padding: theme.spacing.md, textAlign: 'center' }}>
              No hay usuarios
            </p>
          ) : (
            <div className="table-scroll">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th className="admin-th">Email</th>
                    <th className="admin-th">Rol</th>
                    <th className="admin-th">Fecha</th>
                    <th className="admin-th text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} className="admin-row">
                      <td className="admin-td font-medium text-slate-800">{u.email}</td>
                      <td className="admin-td">
                        <span
                          className={`rounded-md px-2 py-1 text-xs font-semibold ${
                            u.role === 'ADMIN'
                              ? 'bg-slate-900 text-white'
                              : 'bg-slate-200 text-slate-700'
                          }`}
                        >
                          {u.role === 'ADMIN' ? 'Admin' : 'Staff'}
                        </span>
                      </td>
                      <td className="admin-td text-xs text-slate-500">
                        {new Date(u.createdAt).toLocaleDateString('es-ES')}
                      </td>
                      <td className="admin-td text-right">
                        {u.id !== user?.id && canManageUsers && (
                          <Button
                            data-testid="delete-user-btn"
                            onClick={() => handleDeleteUser(u.id)}
                            variant="secondary"
                            style={{ padding: `${theme.spacing.xs} ${theme.spacing.sm}` }}
                          >
                            Eliminar
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      </section>

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
            <Button
              onClick={() => { setEditingRole(null); setShowRoleForm(true) }}
            >
              Añadir Rol
            </Button>
          </div>

          {showRoleForm && (
            <RoleForm
              editingRole={editingRole}
              onSave={handleSaveRole}
              onCancel={() => { setShowRoleForm(false); setEditingRole(null); }}
            />
          )}

          <Panel style={{ overflow: 'hidden' }}>
            {roles.length === 0 ? (
              <p style={{ color: theme.colors.textSecondary, padding: theme.spacing.md, textAlign: 'center' }}>
                No hay roles
              </p>
            ) : (
              <div className="table-scroll">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th className="admin-th">Nombre</th>
                      <th className="admin-th">Permisos</th>
                      <th className="admin-th text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {roles.map((role) => (
                      <tr key={role.id} className="admin-row">
                        <td className="admin-td font-medium text-slate-800">
                          {role.name}
                          {isSystemRole(role.name) && (
                            <span className="ml-1 text-xs text-slate-500">
                              (sistema)
                            </span>
                          )}
                        </td>
                        <td className="admin-td text-xs text-slate-500">
                          {role.permissions.length} permisos
                        </td>
                        <td className="admin-td text-right">
                          {!isSystemRole(role.name) && (
                            <>
                              <Button
                                onClick={() => handleEditRole(role)}
                                style={{ marginRight: theme.spacing.xs, padding: `${theme.spacing.xs} ${theme.spacing.sm}` }}
                              >
                                Editar
                              </Button>
                              <Button
                                onClick={() => handleDeleteRole(role.id)}
                                variant="danger"
                                style={{ padding: `${theme.spacing.xs} ${theme.spacing.sm}` }}
                              >
                                Eliminar
                              </Button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Panel>
        </section>
      )}
    </div>
  )
}
