'use client'

import { UsuariosHeader, UsuariosList, useUsuarios } from '@/components/features/usuarios'

export default function UsuariosPage() {
  const { users, loading, error, forbidden, refetch } = useUsuarios()

  return (
    <div className="max-w-4xl">
      <UsuariosHeader />
      <UsuariosList
        users={users}
        loading={loading}
        error={error}
        forbidden={forbidden}
        onRefetch={refetch}
      />
    </div>
  )
}
