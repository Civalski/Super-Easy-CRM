// Store em memória para simular banco de dados durante desenvolvimento
import {
  mockOportunidades,
  mockClientes,
  mockTarefas,
  mockAmbientes,
  MockOportunidade,
  MockCliente,
  MockTarefa,
  MockAmbiente,
} from './mockData'

class InMemoryStore {
  private oportunidades: MockOportunidade[]
  private clientes: MockCliente[]
  private tarefas: MockTarefa[]
  private ambientes: MockAmbiente[]

  constructor() {
    // Inicializa com dados mockados
    this.oportunidades = [...mockOportunidades]
    this.clientes = [...mockClientes]
    this.tarefas = [...mockTarefas]
    this.ambientes = [...mockAmbientes]
  }

  // Métodos para Oportunidades
  getOportunidades(): MockOportunidade[] {
    return [...this.oportunidades]
  }

  getOportunidadeById(id: string): MockOportunidade | undefined {
    return this.oportunidades.find((opp) => opp.id === id)
  }

  addOportunidade(oportunidade: MockOportunidade): void {
    // Busca o ambiente para incluir o nome
    const ambiente = this.getAmbienteById(oportunidade.ambienteId)
    if (ambiente) {
      oportunidade.ambiente = {
        nome: ambiente.nome,
      }
    }
    this.oportunidades.push(oportunidade)
  }

  updateOportunidade(id: string, updates: Partial<MockOportunidade>): MockOportunidade | null {
    const index = this.oportunidades.findIndex((opp) => opp.id === id)
    if (index === -1) {
      return null
    }
    
    // Se ambienteId foi atualizado, busca o nome do ambiente
    if (updates.ambienteId) {
      const ambiente = this.getAmbienteById(updates.ambienteId)
      if (ambiente) {
        updates.ambiente = {
          nome: ambiente.nome,
        }
      }
    }
    
    this.oportunidades[index] = {
      ...this.oportunidades[index],
      ...updates,
      updatedAt: new Date(),
    }
    return this.oportunidades[index]
  }

  deleteOportunidade(id: string): boolean {
    const index = this.oportunidades.findIndex((opp) => opp.id === id)
    if (index === -1) {
      return false
    }
    this.oportunidades.splice(index, 1)
    return true
  }

  // Métodos para Clientes
  getClientes(): MockCliente[] {
    return [...this.clientes]
  }

  getClienteById(id: string): MockCliente | undefined {
    return this.clientes.find((c) => c.id === id)
  }

  addCliente(cliente: MockCliente): void {
    this.clientes.push(cliente)
  }

  updateCliente(id: string, updates: Partial<MockCliente>): MockCliente | null {
    const index = this.clientes.findIndex((c) => c.id === id)
    if (index === -1) {
      return null
    }
    this.clientes[index] = {
      ...this.clientes[index],
      ...updates,
      updatedAt: new Date(),
    }
    return this.clientes[index]
  }

  deleteCliente(id: string): boolean {
    const index = this.clientes.findIndex((c) => c.id === id)
    if (index === -1) {
      return false
    }
    this.clientes.splice(index, 1)
    return true
  }

  // Métodos para Tarefas
  getTarefas(): MockTarefa[] {
    return [...this.tarefas]
  }

  getTarefaById(id: string): MockTarefa | undefined {
    return this.tarefas.find((t) => t.id === id)
  }

  addTarefa(tarefa: MockTarefa): void {
    this.tarefas.push(tarefa)
  }

  updateTarefa(id: string, updates: Partial<MockTarefa>): MockTarefa | null {
    const index = this.tarefas.findIndex((t) => t.id === id)
    if (index === -1) {
      return null
    }
    this.tarefas[index] = {
      ...this.tarefas[index],
      ...updates,
      updatedAt: new Date(),
    }
    return this.tarefas[index]
  }

  deleteTarefa(id: string): boolean {
    const index = this.tarefas.findIndex((t) => t.id === id)
    if (index === -1) {
      return false
    }
    this.tarefas.splice(index, 1)
    return true
  }

  // Métodos para Ambientes
  getAmbientes(): MockAmbiente[] {
    return [...this.ambientes]
  }

  getAmbienteById(id: string): MockAmbiente | undefined {
    return this.ambientes.find((a) => a.id === id)
  }

  addAmbiente(ambiente: MockAmbiente): void {
    this.ambientes.push(ambiente)
  }

  updateAmbiente(id: string, updates: Partial<MockAmbiente>): MockAmbiente | null {
    const index = this.ambientes.findIndex((a) => a.id === id)
    if (index === -1) {
      return null
    }
    this.ambientes[index] = {
      ...this.ambientes[index],
      ...updates,
      updatedAt: new Date(),
    }
    return this.ambientes[index]
  }

  deleteAmbiente(id: string): boolean {
    const index = this.ambientes.findIndex((a) => a.id === id)
    if (index === -1) {
      return false
    }
    this.ambientes.splice(index, 1)
    return true
  }

  reset(): void {
    this.oportunidades = [...mockOportunidades]
    this.clientes = [...mockClientes]
    this.tarefas = [...mockTarefas]
    this.ambientes = [...mockAmbientes]
  }
}

// Singleton instance
export const store = new InMemoryStore()

