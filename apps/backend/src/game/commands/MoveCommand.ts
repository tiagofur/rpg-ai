import { v4 as uuidv4 } from 'uuid';
import { BaseGameCommand } from './BaseGameCommand.js';
import {
  IGameContext,
  ICommandResult,
  IValidationResult,
  ICommandCost,
  IGameLogEntry,
  INotification,
  LogLevel,
  CommandType
} from '../interfaces.js';
import { GameError, ErrorCode } from '../../errors/GameError.js';

export interface IMoveParameters {
  direction: 'north' | 'south' | 'east' | 'west';
  distance?: number;
}

export class MoveCommand extends BaseGameCommand {
  constructor() {
    super(
      'Move',
      'Move your character in a specific direction',
      CommandType.MOVE,
      500, // 0.5s cooldown
      1
    );
  }

  protected validateSpecificRequirements(context: IGameContext): IValidationResult {
    const errors: Array<string> = [];
    const warnings: Array<string> = [];
    const requirements: Array<any> = [];
    const parameters = context.parameters as IMoveParameters;

    if (!parameters || !parameters.direction || !['north', 'south', 'east', 'west'].includes(parameters.direction)) {
      errors.push('Invalid direction. Must be north, south, east, or west');
    }

    if (parameters && parameters.distance !== undefined && (parameters.distance < 1 || parameters.distance > 10)) {
      errors.push('Distance must be between 1 and 10');
    }

    const { character } = context;
    if (character.status?.includes('stunned')) {
      errors.push('Cannot move while stunned');
    }

    if (character.status?.includes('rooted')) {
      errors.push('Cannot move while rooted');
    }

    if (character.health.current <= 0) {
      errors.push('Cannot move while dead');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      requirements
    };
  }

  protected calculateBaseCost(context: IGameContext): ICommandCost {
    const parameters = context.parameters as IMoveParameters;
    const distance = parameters?.distance || 1;
    let baseStaminaCost = distance * 2;

    const { character } = context;
    // Reduce cost based on dexterity (assuming agility maps to dexterity in this system or similar)
    const agilityBonus = Math.floor((character.attributes.dexterity - 10) / 5);
    const staminaMultiplier = Math.max(0.5, 1 - (agilityBonus * 0.05)); // 5% reduction per 5 dex points

    baseStaminaCost *= staminaMultiplier;

    return {
      stamina: Math.floor(baseStaminaCost),
      cooldownMs: this.cooldownMs
    };
  }

  protected async executeSpecificCommand(context: IGameContext): Promise<ICommandResult> {
    const parameters = context.parameters as IMoveParameters;
    const { character } = context;
    const distance = parameters.distance || 1;
    const logEntries: Array<IGameLogEntry> = [];
    const notifications: Array<INotification> = [];

    // Calculate new position
    const oldPosition = character.position ? { ...character.position } : { x: 0, y: 0, z: 0, mapId: 'default', region: 'default' };
    const targetCoordinates = this.calculateNewCoordinates(oldPosition, parameters.direction, distance);

    // Find connected location
    const targetLocation = this.findConnectedLocation(context, targetCoordinates);

    if (!targetLocation) {
      throw new GameError(
        'Cannot move there - path is blocked or no location exists',
        ErrorCode.INVALID_GAME_ACTION,
        400
      );
    }

    const newPosition = {
      ...targetCoordinates,
      mapId: targetLocation.id,
      region: (targetLocation as any).type || 'unknown'
    };

    // Update character position
    // Note: In a real system, this should be done via a state update method or event
    // character.position = newPosition; // This might be read-only

    // Check for traps or hidden objects
    const discoveredObjects = await this.checkForHiddenObjects(context, newPosition);

    // Generate movement description
    const movementDescription = this.generateMovementDescription(parameters.direction, distance, discoveredObjects, (targetLocation as any).name);

    logEntries.push({
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      level: LogLevel.INFO,
      category: 'movement',
      message: `Moved from ${oldPosition.region} to ${newPosition.region} (${(targetLocation as any).name})`,
      data: {
        oldPosition,
        newPosition,
        distance,
        direction: parameters.direction
      }
    });

    notifications.push({
      id: uuidv4(),
      type: 'info',
      title: 'Movement',
      message: movementDescription,
      timestamp: new Date().toISOString(),
      duration: 3000
    });

    // Add discovery notifications
    if (discoveredObjects.length > 0) {
      for (const object of discoveredObjects) {
        notifications.push({
          id: uuidv4(),
          type: 'success',
          title: 'Discovery',
          message: `You discovered: ${object.name}`,
          timestamp: new Date().toISOString(),
          duration: 5000
        });
      }
    }

    return {
      success: true,
      commandId: this.id,
      message: movementDescription,
      effects: [], // effects
      rewards: [], // rewards
      experienceGained: 0, // experience
      newState: { entities: { [character.id]: { id: character.id, type: 'character', data: { position: newPosition } } } }, // newState
      logEntries,
      notifications
    };
  }

  private calculateNewCoordinates(
    currentPosition: { x: number; y: number; z: number },
    direction: string,
    distance: number
  ): { x: number; y: number; z: number } {
    const newPosition = { ...currentPosition };

    switch (direction) {
      case 'north': {
        newPosition.y -= distance;
        break;
      }
      case 'south': {
        newPosition.y += distance;
        break;
      }
      case 'east': {
        newPosition.x += distance;
        break;
      }
      case 'west': {
        newPosition.x -= distance;
        break;
      }
    }

    return newPosition;
  }

  private findConnectedLocation(context: IGameContext, coordinates: { x: number; y: number }): any | null {
    const currentLocation = context.location;
    if (!currentLocation || !currentLocation.connections) return null;

    for (const connectionId of currentLocation.connections) {
      const entity = context.gameState.entities[connectionId];
      if (entity && entity.type === 'location') {
        const location = entity.data as any;
        if (location.coordinates.x === coordinates.x && location.coordinates.y === coordinates.y) {
          return location;
        }
      }
    }
    return null;
  }

  private async checkForHiddenObjects(context: IGameContext, _position: { x: number; y: number }): Promise<Array<{ id: string; name: string; type: string }>> {
    // Simulate discovering hidden objects based on character's perception
    const { character } = context;
    const perceptionCheck = character.attributes.intelligence + character.attributes.wisdom;
    const discoveredObjects: Array<{ id: string; name: string; type: string }> = [];

    // Higher perception = higher chance to discover things
    const discoveryChance = Math.min(0.8, perceptionCheck / 40);

    if (Math.random() < discoveryChance) {
      const possibleObjects: Array<{ name: string; type: string }> = [
        { name: 'Hidden Treasure', type: 'treasure' },
        { name: 'Secret Passage', type: 'passage' },
        { name: 'Ancient Rune', type: 'rune' },
        { name: 'Mysterious Herb', type: 'herb' }
      ];

      const discovered = possibleObjects[Math.floor(Math.random() * possibleObjects.length)];
      if (discovered) {
        discoveredObjects.push({
          id: `discovered_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`,
          ...discovered
        });
      }
    }

    return discoveredObjects;
  }

  private generateMovementDescription(
    direction: string,
    distance: number,
    discoveredObjects: Array<{ name: string }>,
    locationName?: string
  ): string {
    const directionDescriptions: Record<string, string> = {
      north: 'north',
      south: 'south',
      east: 'east',
      west: 'west'
    };

    let description = `You moved ${distance} space${distance > 1 ? 's' : ''} to the ${directionDescriptions[direction]}`;
    if (locationName) {
      description += ` and arrived at ${locationName}`;
    }
    description += '.';

    if (discoveredObjects.length > 0) {
      description += ` You discovered ${discoveredObjects.length} interesting ${discoveredObjects.length > 1 ? 'things' : 'thing'}.`;
    }

    return description;
  }
}