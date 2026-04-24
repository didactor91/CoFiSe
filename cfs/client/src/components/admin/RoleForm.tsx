import { useState } from 'react'

import theme from '../../theme'

interface RoleFormProps {
  editingRole?: { id: string; name: string; permissions: string[] } | null
  onSave: (data: { name: string; permissions: string[] }, id?: string) => void
  onCancel: () => void
}

export default function RoleForm({ editingRole, onSave, onCancel }: RoleFormProps) {
  const [name, setName] = useState(editingRole?.name || '')
  const [permissions, setPermissions] = useState<string[]>(editingRole?.permissions || [])

  const resources = [
    { name: 'news', label: 'Noticias', verbs: ['read', 'create', 'update', 'delete', 'manage'] },
    { name: 'product', label: 'Productos', verbs: ['read', 'create', 'update', 'delete', 'manage'] },
    { name: 'reservation', label: 'Reservas', verbs: ['read', 'update', 'manage'] },
    { name: 'user', label: 'Usuarios', verbs: ['read', 'create', 'delete', 'manage'] },
    { name: 'event', label: 'Eventos', verbs: ['read', 'create', 'update', 'delete', 'manage'] },
    { name: 'role', label: 'Roles', verbs: ['read', 'create', 'update', 'delete', 'manage'] },
  ]

  const togglePermission = (perm: string) => {
    setPermissions(prev =>
      prev.includes(perm) ? prev.filter(p => p !== perm) : [...prev, perm]
    )
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      alert('El nombre del rol es requerido')
      return
    }
    if (permissions.length === 0) {
      alert('Selecciona al menos un permiso')
      return
    }
    onSave({ name: name.trim(), permissions }, editingRole?.id)
  }

  return (
    <form onSubmit={handleSubmit} style={{
      background: theme.colors.surface,
      borderRadius: theme.borderRadius.md,
      border: `1px solid ${theme.colors.border}`,
      padding: theme.spacing.lg,
      marginBottom: theme.spacing.lg,
    }}>
      <div style={{ marginBottom: theme.spacing.md }}>
        <label style={{ display: 'block', color: theme.colors.textSecondary, fontSize: theme.typography.fontSize.xs, marginBottom: theme.spacing.xs }}>
          Nombre del Rol *
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={editingRole?.name === 'ADMIN' || editingRole?.name === 'STAFF'}
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

      <div style={{ marginBottom: theme.spacing.md }}>
        <label style={{ display: 'block', color: theme.colors.textSecondary, fontSize: theme.typography.fontSize.xs, marginBottom: theme.spacing.sm }}>
          Permisos
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: theme.spacing.md }}>
          {resources.map((resource) => (
            <div key={resource.name} style={{
              background: theme.colors.background,
              borderRadius: theme.borderRadius.sm,
              border: `1px solid ${theme.colors.border}`,
              padding: theme.spacing.sm,
            }}>
              <div style={{ color: theme.colors.text, fontWeight: theme.typography.fontWeight.medium, fontSize: theme.typography.fontSize.sm, marginBottom: theme.spacing.xs }}>
                {resource.label}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: theme.spacing.xs }}>
                {resource.verbs.map((verb) => {
                  const perm = `${resource.name}.${verb}`
                  const isActive = permissions.includes(perm)
                  return (
                    <label
                      key={verb}
                      title={perm}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        cursor: 'pointer',
                        padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
                        background: isActive ? theme.colors.accent : theme.colors.border,
                        color: isActive ? theme.colors.background : theme.colors.text,
                        borderRadius: theme.borderRadius.sm,
                        fontSize: theme.typography.fontSize.xs,
                        transition: 'all 0.2s',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={isActive}
                        onChange={() => togglePermission(perm)}
                        style={{ display: 'none' }}
                      />
                      {verb}
                    </label>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', gap: theme.spacing.sm }}>
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
          {editingRole ? 'Actualizar' : 'Crear'}
        </button>
        <button
          type="button"
          onClick={onCancel}
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
  )
}
