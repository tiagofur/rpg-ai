# 🧪 Testing Guide - RPG-AI Supreme

> **Guía completa de testing para el proyecto**  
> **Última actualización:** 25 de Noviembre 2025

---

## 📋 Índice

1. [Tipos de Tests](#tipos-de-tests)
2. [Estructura de Tests](#estructura-de-tests)
3. [Comandos de Testing](#comandos-de-testing)
4. [Tests E2E Implementados](#tests-e2e-implementados)
5. [Ejecutar Tests](#ejecutar-tests)
6. [Escribir Nuevos Tests](#escribir-nuevos-tests)
7. [CI/CD Integration](#cicd-integration)
8. [Troubleshooting](#troubleshooting)

---

## 🎯 Tipos de Tests

### 1. **Tests Unitarios** ⚡

- **Objetivo**: Probar funciones y clases individuales
- **Ubicación**: `src/**/__tests__/*.test.ts`
- **Características**:
  - Rápidos (< 100ms por test)
  - Sin dependencias externas
  - Usan mocks y stubs

### 2. **Tests de Integración** 🔗

- **Objetivo**: Probar interacción entre módulos
- **Ubicación**: `src/**/__tests__/*.integration.test.ts`
- **Características**:
  - Moderadamente rápidos (< 500ms)
  - Pueden usar base de datos de prueba
  - Verifican flujos completos

### 3. **Tests End-to-End (E2E)** 🎮

- **Objetivo**: Simular flujo completo de usuario
- **Ubicación**: `src/test/e2e/*.e2e.test.ts`
- **Características**:
  - Más lentos (1-5s por test)
  - Usan servidor real
  - Verifican todo el stack

---

## 📁 Estructura de Tests

```
apps/backend/
├── src/
│   ├── game/
│   │   ├── __tests__/
│   │   │   ├── GameEngine.test.ts           # Unit tests
│   │   │   ├── GameEngineValidation.test.ts
│   │   │   └── GameEngineCorrections.test.ts
│   │   └── GameEngine.ts
│   ├── services/
│   │   ├── __tests__/
│   │   │   └── AuthenticationService.test.ts
│   │   └── AuthenticationService.ts
│   └── test/
│       ├── e2e/
│       │   ├── auth.e2e.test.ts              # E2E: Auth flow
│       │   ├── character.e2e.test.ts         # E2E: Character CRUD
│       │   ├── game-flow.e2e.test.ts         # E2E: Complete game
│       │   └── premium.e2e.test.ts           # E2E: Subscriptions
│       ├── fixtures/                          # Test data
│       ├── helpers/                           # Test utilities
│       └── mocks/                             # Mock services
├── vitest.config.ts                           # Unit/Integration config
└── vitest.e2e.config.ts                       # E2E config
```

---

## 🚀 Comandos de Testing

### Ejecutar Todos los Tests

```bash
# Backend
cd apps/backend
npm run test

# Con watch mode (re-ejecuta al cambiar archivos)
npm run test:watch

# Con UI interactiva
npm run test:ui
```

### Ejecutar Solo E2E

```bash
npm run test:e2e
```

### Ejecutar Solo Unit Tests

```bash
npm run test:unit
```

### Con Cobertura

```bash
npm run test:coverage

# Ver reporte HTML
open coverage/index.html  # Mac/Linux
start coverage/index.html # Windows
```

### Tests Específicos

```bash
# Solo tests de autenticación
npx vitest run auth

# Solo un archivo específico
npx vitest run src/test/e2e/auth.e2e.test.ts

# Solo un test específico por nombre
npx vitest run -t "should register a new user"
```

---

## ✅ Tests E2E Implementados

### 1. **Authentication Flow** (`auth.e2e.test.ts`)

**Cobertura**: 8 test suites, ~30 tests

✅ Registro de usuario

- Registro exitoso
- Validación de email
- Validación de password
- Duplicados rechazados

✅ Login

- Login exitoso
- Credenciales incorrectas
- Rate limiting

✅ Token Management

- Refresh token
- Token inválido
- Logout

✅ Rutas Protegidas

- Acceso con token válido
- Acceso sin token
- Token expirado

### 2. **Character Management** (`character.e2e.test.ts`)

**Cobertura**: 6 test suites, ~20 tests

✅ Creación Directa

- Creación exitosa
- Validación de atributos
- Validación de raza/clase
- Límites premium

✅ Creación con IA

- Generación por prompt
- Manejo de errores

✅ CRUD Operations

- Listar personajes
- Obtener por ID
- Actualizar
- Eliminar
- Permisos (solo propios)

### 3. **Complete Game Flow** (`game-flow.e2e.test.ts`)

**Cobertura**: 9 test suites, ~35 tests

✅ Gestión de Sesiones

- Crear sesión
- Listar sesiones
- Obtener sesión
- Eliminar sesión
- Sesiones multijugador

✅ Acciones de Juego

- Comandos básicos (look, move, inventory)
- Combate (attack, defend)
- Uso de items
- Comandos inválidos

✅ Undo/Redo

- Deshacer acción
- Rehacer acción
- Límites de historial

✅ Persistencia

- Guardar estado
- Cargar estado
- Continuidad entre sesiones

### 4. **Premium Features** (`premium.e2e.test.ts`)

**Cobertura**: 5 test suites, ~15 tests

✅ Suscripciones

- Estado de suscripción
- Planes disponibles
- Límites de uso
- Restricciones free tier

✅ Stripe Integration

- Crear checkout session
- Webhooks
- Portal del cliente

✅ Rewards & IAP

- Recompensas diarias
- Validación Apple
- Validación Google Play

---

## 📝 Escribir Nuevos Tests

### Plantilla Test E2E

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { FastifyInstance } from 'fastify';
import { buildServer } from '../../server.js';

describe('E2E - Feature Name', () => {
  let app: FastifyInstance;
  let accessToken: string;

  beforeAll(async () => {
    app = await buildServer();
    await app.ready();

    // Setup: register user, create character, etc.
    const response = await app.inject({
      method: 'POST',
      url: '/api/auth/register',
      payload: {
        username: `test_${Date.now()}`,
        email: `test_${Date.now()}@example.com`,
        password: 'Test123!@#',
      },
    });

    const body = JSON.parse(response.body);
    accessToken = body.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Feature Behavior', () => {
    it('should do something', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/endpoint',
        headers: {
          authorization: `Bearer ${accessToken}`,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body).toHaveProperty('data');
    });
  });
});
```

### Plantilla Test Unitario

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MyService } from '../MyService.js';

describe('MyService', () => {
  let service: MyService;
  let mockDependency: any;

  beforeEach(() => {
    mockDependency = {
      method: vi.fn().mockResolvedValue('result'),
    };
    service = new MyService(mockDependency);
  });

  it('should call dependency method', async () => {
    await service.doSomething();
    expect(mockDependency.method).toHaveBeenCalled();
  });
});
```

---

## 🎯 Best Practices

### 1. **Arrange-Act-Assert (AAA)**

```typescript
it('should create user', async () => {
  // Arrange
  const userData = { username: 'test', email: 'test@example.com' };

  // Act
  const response = await app.inject({
    method: 'POST',
    url: '/api/users',
    payload: userData,
  });

  // Assert
  expect(response.statusCode).toBe(201);
});
```

### 2. **Test Isolation**

```typescript
// ✅ Bueno: Cada test es independiente
it('test 1', async () => {
  const user = await createUser();
  // ...
});

it('test 2', async () => {
  const user = await createUser(); // Otro usuario
  // ...
});

// ❌ Malo: Tests dependen entre sí
let globalUser;
it('create user', async () => {
  globalUser = await createUser();
});
it('use user', async () => {
  // Depende del test anterior
  await doSomething(globalUser);
});
```

### 3. **Nombres Descriptivos**

```typescript
// ✅ Bueno
it('should return 404 when character does not exist', async () => {
  // ...
});

// ❌ Malo
it('test character', async () => {
  // ...
});
```

### 4. **Cleanup**

```typescript
afterEach(async () => {
  // Limpiar base de datos de prueba
  await cleanDatabase();
});

afterAll(async () => {
  // Cerrar conexiones
  await app.close();
  await prisma.$disconnect();
});
```

---

## 🔄 CI/CD Integration

### GitHub Actions

```yaml
# .github/workflows/test.yml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Run unit tests
        run: npm run test:unit

      - name: Run E2E tests
        run: npm run test:e2e
        env:
          DATABASE_URL: ${{ secrets.TEST_DATABASE_URL }}
          REDIS_URL: ${{ secrets.TEST_REDIS_URL }}

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/coverage-final.json
```

---

## 🐛 Troubleshooting

### Tests Fallan Aleatoriamente

**Problema**: Tests pasan a veces y fallan otras veces

**Solución**:

```typescript
// Aumentar timeouts
it(
  'slow test',
  async () => {
    // ...
  },
  { timeout: 10000 }
); // 10 segundos

// Esperar condiciones
await waitFor(() => {
  expect(condition).toBe(true);
});
```

### Error de Base de Datos

**Problema**: `ECONNREFUSED` o `Database locked`

**Solución**:

```bash
# Usar base de datos de prueba separada
export DATABASE_URL="postgresql://user:pass@localhost:5432/rpg_test"

# O usar SQLite en memoria
export DATABASE_URL="file::memory:?cache=shared"
```

### Memory Leaks

**Problema**: Tests consumen cada vez más memoria

**Solución**:

```typescript
afterEach(async () => {
  // Limpiar referencias
  vi.clearAllMocks();
  vi.restoreAllMocks();

  // Cerrar conexiones
  await redis.quit();
});
```

### Tests Muy Lentos

**Problema**: Tests tardan demasiado

**Solución**:

```typescript
// Ejecutar en paralelo (donde sea seguro)
describe.concurrent('Fast tests', () => {
  it.concurrent('test 1', async () => {
    /* ... */
  });
  it.concurrent('test 2', async () => {
    /* ... */
  });
});

// Reducir datos de prueba
const minimalUser = { username: 'test', email: 'test@example.com' };
```

---

## 📊 Métricas de Cobertura

### Objetivos

| Métrica    | Objetivo | Crítico |
| ---------- | -------- | ------- |
| Lines      | 80%      | 60%     |
| Functions  | 80%      | 60%     |
| Branches   | 80%      | 60%     |
| Statements | 80%      | 60%     |

### Ver Reporte

```bash
npm run test:coverage
open coverage/index.html
```

### Excluir Archivos

```typescript
// vitest.config.ts
coverage: {
  exclude: [
    'node_modules/**',
    'dist/**',
    '**/*.d.ts',
    '**/mock/**',
    'scripts/**',
  ],
}
```

---

## ✅ Checklist de Testing

Antes de hacer commit:

- [ ] Todos los tests pasan (`npm run test`)
- [ ] Cobertura > 80% en archivos nuevos
- [ ] Tests E2E cubren casos críticos
- [ ] No hay console.log en tests
- [ ] Cleanup en afterEach/afterAll
- [ ] Nombres de tests descriptivos
- [ ] No hay tests .skip() o .only()

---

## 🎯 Próximos Pasos

1. **Frontend E2E**: Tests con React Native Testing Library
2. **Performance Tests**: Load testing con k6
3. **Security Tests**: OWASP security scan
4. **Visual Regression**: Screenshot testing

---

> 💡 **Tip**: Ejecuta `npm run test:watch` durante desarrollo para ver tests en tiempo real
