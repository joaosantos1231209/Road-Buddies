import { vi } from 'vitest';

/**
 * Cria um mock do Drizzle que suporta qualquer encadeamento de funções (Chaining)
 * e resolve como uma Promise (Thenable).
 */
export const createDrizzleMock = (returnValue: any = []) => {
  const chain: any = new Proxy(() => {}, {
    apply: () => chain,
    get: (target, prop) => {
      if (prop === 'then') {
        return (onRes: any) => Promise.resolve(returnValue).then(onRes);
      }
      if (prop === 'catch') {
        return (onFail: any) => Promise.resolve(returnValue).catch(onFail);
      }
      // Métodos especiais do Drizzle Query API
      if (prop === 'findFirst') return vi.fn().mockResolvedValue(Array.isArray(returnValue) ? returnValue[0] : returnValue);
      if (prop === 'findMany') return vi.fn().mockResolvedValue(returnValue);
      
      return chain;
    }
  });
  return chain;
};

export const mockDb = {
  select: vi.fn(() => createDrizzleMock()),
  insert: vi.fn(() => createDrizzleMock()),
  update: vi.fn(() => createDrizzleMock()),
  delete: vi.fn(() => createDrizzleMock()),
  query: new Proxy({}, {
    get: () => ({
      findFirst: vi.fn().mockResolvedValue(null),
      findMany: vi.fn().mockResolvedValue([])
    })
  }),
  transaction: vi.fn(async (cb) => cb({
    query: new Proxy({}, {
        get: () => ({
          findFirst: vi.fn().mockResolvedValue({ id: 1, availableSeats: 5, status: 'ACTIVE', type: 'PROVIDER' }),
          findMany: vi.fn().mockResolvedValue([])
        })
    }),
    insert: vi.fn(() => createDrizzleMock()),
    update: vi.fn(() => createDrizzleMock()),
    delete: vi.fn(() => createDrizzleMock())
  }))
};
