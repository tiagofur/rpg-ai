import { IGameCommand, CommandType } from '../interfaces.js';
import { AttackCommand } from './AttackCommand.js';
import { MoveCommand } from './MoveCommand.js';
import { UseItemCommand } from './UseItemCommand.js';
import { CastSpellCommand } from './CastSpellCommand.js';
import { DefendCommand } from './DefendCommand.js';
import { InteractCommand } from './InteractCommand.js';
import { LootCommand } from './LootCommand.js';
import { GenerateNarrativeCommand } from './GenerateNarrativeCommand.js';
import { GenerateImageCommand } from './GenerateImageCommand.js';
import { ProcessInputCommand } from './ProcessInputCommand.js';
import { RespawnCommand } from './RespawnCommand.js';
import { StartCombatCommand } from './StartCombatCommand.js';
import { CombatActionCommand } from './CombatActionCommand.js';
import { GameError, ErrorCode } from '../../errors/GameError.js';
import { IAIService } from '../../ai/interfaces/IAIService.js';

export interface ICommandFactory {
  createCommand(type: CommandType): IGameCommand;
  getAvailableCommands(): Array<CommandType>;
  isValidCommand(type: string): type is CommandType;
}

export class GameCommandFactory implements ICommandFactory {
  private readonly commands = new Map<CommandType, () => IGameCommand>();

  constructor(
    private readonly aiService?: IAIService
  ) {
    this.initializeCommands();
  }

  private initializeCommands(): void {
    // Comandos básicos que no requieren dependencias
    this.commands.set(CommandType.ATTACK, () => new AttackCommand());
    this.commands.set(CommandType.MOVE, () => new MoveCommand());
    this.commands.set(CommandType.USE_ITEM, () => new UseItemCommand());
    this.commands.set(CommandType.CAST_SPELL, () => new CastSpellCommand());
    this.commands.set(CommandType.DEFEND, () => new DefendCommand());
    this.commands.set(CommandType.INTERACT, () => new InteractCommand());
    this.commands.set(CommandType.LOOT, () => new LootCommand());
    this.commands.set(CommandType.RESPAWN, () => new RespawnCommand());
    this.commands.set(CommandType.START_COMBAT, () => new StartCombatCommand());
    this.commands.set(CommandType.COMBAT_ACTION, () => new CombatActionCommand());

    // Comandos que requieren IA (solo si el servicio está disponible)
    if (this.aiService) {
      const ai = this.aiService;
      this.commands.set(CommandType.GENERATE_NARRATIVE, () => new GenerateNarrativeCommand(ai));
      this.commands.set(CommandType.CUSTOM, () => new ProcessInputCommand(ai));
      this.commands.set(CommandType.GENERATE_IMAGE, () => new GenerateImageCommand(ai));
    }
  }

  createCommand(type: CommandType): IGameCommand {
    const commandFactory = this.commands.get(type);
    if (!commandFactory) {
      throw new GameError(
        `Unknown or unavailable command type: ${type}`,
        ErrorCode.INVALID_GAME_ACTION,
        400,
        { commandType: type }
      );
    }
    return commandFactory();
  }

  getAvailableCommands(): Array<CommandType> {
    return [...this.commands.keys()];
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