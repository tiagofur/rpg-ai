import { IGameCommand, CommandType } from '../interfaces/IGameCommand';
import { AttackCommand } from './AttackCommand';
import { MoveCommand } from './MoveCommand';
import { UseItemCommand } from './UseItemCommand';
import { CastSpellCommand } from './CastSpellCommand';
import { DefendCommand } from './DefendCommand';
import { InteractCommand } from './InteractCommand';
import { GenerateNarrativeCommand } from './GenerateNarrativeCommand';
import { GameError, ErrorCode } from '../../errors/GameError';
import { IAIService } from '../../ai/interfaces/IAIService';

export interface ICommandFactory {
  createCommand(type: CommandType): IGameCommand;
  getAvailableCommands(): CommandType[];
  isValidCommand(type: string): type is CommandType;
}

export class GameCommandFactory implements ICommandFactory {
  private readonly commands = new Map<CommandType, () => IGameCommand>();
  private readonly aiService?: IAIService;

  constructor(aiService?: IAIService) {
    this.aiService = aiService;
    this.registerCommands();
  }

  private registerCommands(): void {
    // Comandos básicos que no requieren dependencias
    this.commands.set(CommandType.ATTACK, () => new AttackCommand());
    this.commands.set(CommandType.MOVE, () => new MoveCommand());
    this.commands.set(CommandType.USE_ITEM, () => new UseItemCommand());
    this.commands.set(CommandType.CAST_SPELL, () => new CastSpellCommand());
    this.commands.set(CommandType.DEFEND, () => new DefendCommand());
    this.commands.set(CommandType.INTERACT, () => new InteractCommand());

    // Comandos que requieren IA (solo si el servicio está disponible)
    if (this.aiService) {
      this.commands.set(CommandType.GENERATE_NARRATIVE, () => new GenerateNarrativeCommand(this.aiService!));
    }
  }

  createCommand(type: CommandType): IGameCommand {
    const commandFactory = this.commands.get(type);
    if (!commandFactory) {
      throw new GameError(
        `Unknown or unavailable command type: ${type}`,
        ErrorCode.INVALID_COMMAND,
        400,
        { commandType: type }
      );
    }
    return commandFactory();
  }

  getAvailableCommands(): CommandType[] {
    return Array.from(this.commands.keys());
  }

  isValidCommand(type: string): type is CommandType {
    return this.commands.has(type as CommandType);
  }

  // Método estático para compatibilidad retroactiva
  static createCommand(type: CommandType): IGameCommand {
    const factory = new GameCommandFactory();
    return factory.createCommand(type);
  }
}