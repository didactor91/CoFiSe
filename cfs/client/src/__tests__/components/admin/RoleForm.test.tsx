import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import RoleForm from '../../../components/admin/RoleForm'

describe('RoleForm', () => {
  const mockOnSave = vi.fn()
  const mockOnCancel = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render the form with all resource sections', () => {
    render(<RoleForm onSave={mockOnSave} onCancel={mockOnCancel} />)

    // Check form title
    expect(screen.getByText('Nombre del Rol *')).toBeInTheDocument()
    expect(screen.getByText('Permisos')).toBeInTheDocument()

    // Check resource sections
    expect(screen.getByText('Noticias')).toBeInTheDocument()
    expect(screen.getByText('Productos')).toBeInTheDocument()
    expect(screen.getByText('Reservas')).toBeInTheDocument()
    expect(screen.getByText('Usuarios')).toBeInTheDocument()
    expect(screen.getByText('Eventos')).toBeInTheDocument()
    expect(screen.getByText('Roles')).toBeInTheDocument()
  })

  it('should show Save and Cancel buttons', () => {
    render(<RoleForm onSave={mockOnSave} onCancel={mockOnCancel} />)

    expect(screen.getByText('Crear')).toBeInTheDocument()
    expect(screen.getByText('Cancelar')).toBeInTheDocument()
  })

  it('should call onCancel when cancel button is clicked', () => {
    render(<RoleForm onSave={mockOnSave} onCancel={mockOnCancel} />)

    fireEvent.click(screen.getByText('Cancelar'))
    expect(mockOnCancel).toHaveBeenCalled()
  })

  it('should pre-fill form when editingRole is provided', () => {
    const editingRole = {
      id: '1',
      name: 'CustomRole',
      permissions: ['news.read', 'product.read'],
    }

    render(<RoleForm editingRole={editingRole} onSave={mockOnSave} onCancel={mockOnCancel} />)

    const nameInput = screen.getByDisplayValue('CustomRole')
    expect(nameInput).toBeInTheDocument()
  })

  it('should show Update button when editing', () => {
    const editingRole = {
      id: '1',
      name: 'CustomRole',
      permissions: ['news.read'],
    }

    render(<RoleForm editingRole={editingRole} onSave={mockOnSave} onCancel={mockOnCancel} />)

    expect(screen.getByText('Actualizar')).toBeInTheDocument()
  })

  it('should disable name input for ADMIN system role', () => {
    render(
      <RoleForm
        editingRole={{ id: '1', name: 'ADMIN', permissions: ['*'] }}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />,
    )

    const input = screen.getByDisplayValue('ADMIN') as HTMLInputElement
    expect(input).toBeDisabled()
  })

  it('should disable name input for STAFF system role', () => {
    render(
      <RoleForm
        editingRole={{ id: '2', name: 'STAFF', permissions: ['product.read'] }}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />,
    )

    const input = screen.getByDisplayValue('STAFF') as HTMLInputElement
    expect(input).toBeDisabled()
  })

  it('should allow editing name for non-system roles', () => {
    render(
      <RoleForm
        editingRole={{ id: '3', name: 'CustomRole', permissions: ['news.read'] }}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />,
    )

    const input = screen.getByDisplayValue('CustomRole') as HTMLInputElement
    expect(input).not.toBeDisabled()
  })

  it('should alert if role name is empty on submit', () => {
    const alertMock = vi.fn()
    window.alert = alertMock

    render(<RoleForm onSave={mockOnSave} onCancel={mockOnCancel} />)

    // Submit without filling anything
    fireEvent.click(screen.getByText('Crear'))

    expect(alertMock).toHaveBeenCalledWith('El nombre del rol es requerido')
    expect(mockOnSave).not.toHaveBeenCalled()
  })

  it('should alert if no permissions selected on submit', () => {
    const alertMock = vi.fn()
    window.alert = alertMock

    render(<RoleForm onSave={mockOnSave} onCancel={mockOnCancel} />)

    // Fill name only
    const nameInput = screen.getByRole('textbox') as HTMLInputElement
    fireEvent.change(nameInput, { target: { value: 'TestRole' } })

    fireEvent.click(screen.getByText('Crear'))

    expect(alertMock).toHaveBeenCalledWith('Selecciona al menos un permiso')
    expect(mockOnSave).not.toHaveBeenCalled()
  })
})
