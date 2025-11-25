import { Redis } from 'ioredis';
import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import { GameEngine } from '../game/GameEngine.js';

/**
 * Prueba del sistema de bloqueo de sesión y AI Gateway
 * Valida concurrencia y generación de narrativa
 */
async function testSessionLockAndAI() {
  console.log('🚀 Iniciando pruebas de sistema de bloqueo y AI...');

  // Configuración
  const redis = new Redis({
    host: process.env['REDIS_HOST'] || 'localhost',
    port: Number.parseInt(process.env['REDIS_PORT'] || '6379'),
    ...(process.env['REDIS_PASSWORD'] ? { password: process.env['REDIS_PASSWORD'] } : {})
  });

  const prisma = new PrismaClient();

  const config = {
    redis,
    prisma,
    maxUndoStackSize: 100,
    maxEventHistorySize: 1000,
    autoSaveInterval: 30_000, // 30 segundos
    maxConcurrentSessions: 100,
    enableAI: true,
    enablePersistence: true,
    enableEventLogging: true,
    enableMetrics: true
  };

  // Crear Game Engine
  const gameEngine = new GameEngine(config);

  try {
    // Test 1: Crear sesión de juego
    console.log('📋 Test 1: Creando sesión de juego...');
    const userId = uuidv4() as any;
    const characterId = uuidv4() as any;

    const session = await gameEngine.createSession(userId, characterId, {
      difficulty: 'normal',
      enableAutoSave: true,
      language: 'es'
    });

    console.log('✅ Sesión creada:', session.sessionId);

    // Test 2: Probar bloqueo de sesión
    console.log('🔒 Test 2: Probando bloqueo de sesión...');

    // Intentar ejecutar dos comandos simultáneos
    const {sessionId} = session;

    const promise1 = gameEngine.executeCommand(
      sessionId,
      'move',
      { direction: 'north' },
      userId
    );

    const promise2 = gameEngine.executeCommand(
      sessionId,
      'move',
      { direction: 'south' },
      userId
    );

    try {
      const [result1, result2] = await Promise.all([promise1, promise2]);
      console.log('Resultados:', { result1, result2 });
      console.log('⚠️  Ambos comandos se ejecutaron (no deberían hacerlo simultáneamente)');
    } catch (error: any) {
      console.log('✅ Bloqueo funcionando correctamente:', error.message);
    }

    // Test 3: Verificar estado de bloqueo
    console.log('🔍 Test 3: Verificando estado de bloqueo...');
    const isLocked = await gameEngine.isSessionLocked(sessionId);
    console.log('Sesión bloqueada:', isLocked);

    // Test 4: Generar narrativa con IA
    console.log('🤖 Test 4: Probando generación de narrativa con IA...');

    try {
      const narrativeResult = await gameEngine.executeCommand(
        sessionId,
        'generate_narrative',
        {
          context: 'El personaje entra en una cueva misteriosa y encuentra un antiguo artefacto',
          tone: 'mysterious',
          length: 'medium',
          includeDialogue: true
        },
        userId
      );

      if (narrativeResult.success) {
        console.log('✅ Narrativa generada exitosamente');
        console.log('📖 Mensaje:', narrativeResult.message);
        console.log('⭐ Experiencia ganada:', narrativeResult.experienceGained);
        console.log('💫 Efectos:', narrativeResult.effects?.length || 0);
      } else {
        console.log('❌ Error generando narrativa:', narrativeResult.message);
      }
    } catch (error: any) {
      console.log('❌ Error en generación de narrativa:', error.message);
    }

    // Test 5: Probar undo/redo con bloqueo
    console.log('↩️  Test 5: Probando undo/redo con bloqueo...');

    try {
      const undoResult = await gameEngine.undoCommand(sessionId, userId);
      console.log('✅ Undo ejecutado:', undoResult.success);

      const redoResult = await gameEngine.redoCommand(sessionId, userId);
      console.log('✅ Redo ejecutado:', redoResult.success);
    } catch (error: any) {
      console.log('❌ Error en undo/redo:', error.message);
    }

    // Test 6: Forzar liberación de bloqueo (administración)
    console.log('🔓 Test 6: Probando liberación forzada de bloqueo...');

    await gameEngine.forceReleaseSessionLock(sessionId);
    console.log('✅ Bloqueo liberado forzadamente');

    // Verificar que el bloqueo fue liberado
    const isLockedAfter = await gameEngine.isSessionLocked(sessionId);
    console.log('Sesión bloqueada después de liberación:', isLockedAfter);

    // Test 7: Métricas del sistema
    console.log('📊 Test 7: Verificando métricas del sistema...');
    const metrics = gameEngine.getMetrics();
    console.log('Métricas:', {
      totalCommandsExecuted: metrics.totalCommandsExecuted,
      totalSessions: metrics.totalSessions,
      activeSessions: metrics.activeSessions,
      averageCommandExecutionTime: metrics.averageCommandExecutionTime,
      errorRate: metrics.errorRate
    });

    console.log('\n🎉 ¡Todas las pruebas completadas!');

  } catch (error) {
    console.error('❌ Error en las pruebas:', error);
  } finally {
    // Cleanup
    console.log('🧹 Limpiando recursos...');
    await gameEngine.shutdown();
    await redis.quit();
    await prisma.$disconnect();
  }
}

// Ejecutar pruebas si se llama directamente
if (require.main === module) {
  testSessionLockAndAI().catch(console.error);
}

export { testSessionLockAndAI };