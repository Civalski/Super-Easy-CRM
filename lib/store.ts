// Store em memória para simular banco de dados durante desenvolvimento
import {
  mockOportunidades,
  mockClientes,
  mockTarefas,
  MockOportunidade,
  MockCliente,
  MockTarefa,
} from './mockData'

class InMemoryStore {
  private oportunidades: MockOportunidade[]
  private clientes: MockCliente[]
  private tarefas: MockTarefa[]

  constructor() {
    // Inicializa com dados mockados
    this.oportunidades = [...mockOportunidades]
    this.clientes = [...mockClientes]
    this.tarefas = [...mockTarefas]
  }

  // Métodos para Oportunidades
  getOportunidades(): MockOportunidade[] {
    return [...this.oportunidades]
  }

  getOportunidadeById(id: string): MockOportunidade | undefined {
    return this.oportunidades.find((opp) => opp.id === id)
  }

  addOportunidade(oportunidade: MockOportunidade): void {
    this.oportunidades.push(oportunidade)
  }

  updateOportunidade(id: string, updates: Partial<MockOportunidade>): MockOportunidade | null {
    const index = this.oportunidades.findIndex((opp) => opp.id === id)
    if (index === -1) {
      return null
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

  reset(): void {
    this.oportunidades = [...mockOportunidades]
    this.clientes = [...mockClientes]
    this.tarefas = [...mockTarefas]
  }
}

// Singleton instance
export const store = new InMemoryStore()

