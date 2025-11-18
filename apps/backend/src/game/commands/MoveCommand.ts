import { BaseGameCommand } from './BaseGameCommand';
import { IGameContext, ICommandResult, ICharacter } from '../interfaces';
import { GameError, ErrorCode } from '../../errors/GameError';

export interface IMoveParameters {
  direction: 'north' | 'south' | 'east' | 'west';
  distance?: number;
}

export class MoveCommand extends BaseGameCommand {
  protected get commandType(): string {
    return 'move';
  }

  protected get requiredParameters(): string[] {
    return ['direction'];
  }

  protected validate(context: IGameContext): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    const params = context.parameters as IMoveParameters;
    
    if (!params.direction || !['north', 'south', 'east', 'west'].includes(params.direction)) {
      errors.push('Invalid direction. Must be north, south, east, or west');
    }

    if (params.distance !== undefined && (params.distance < 1 || params.distance > 10)) {
      errors.push('Distance must be between 1 and 10');
    }

    const character = context.session.character;
    if (character.status?.includes('stunned')) {
      errors.push('Cannot move while stunned');
    }

    if (character.status?.includes('rooted')) {
      errors.push('Cannot move while rooted');
    }

    if (character.attributes.health <= 0) {
      errors.push('Cannot move while dead');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  protected calculateCost(context: IGameContext): { health: number; mana: number; stamina: number } {
    const params = context.parameters as IMoveParameters;
    const distance = params.distance || 1;
    const baseStaminaCost = distance * 2;
    
    // Reduce cost based on agility
    const agilityBonus = Math.floor((context.session.character.attributes.agility - 10) / 5);
    const finalStaminaCost = Math.max(1, baseStaminaCost - agilityBonus);

    return {
      health: 0,
      mana: 0,
      stamina: finalStaminaCost
    };
  }

  protected async executeLogic(context: IGameContext): Promise<ICommandResult> {
    const params = context.parameters as IMoveParameters;
    const character = context.session.character;
    const distance = params.distance || 1;

    // Calculate new position
    const oldPosition = { ...character.position };
    const newPosition = this.calculateNewPosition(character.position, params.direction, distance);

    // Check if the new position is valid (not blocked by obstacles)
    if (!await this.isValidPosition(context, newPosition)) {
      throw new GameError(
        'Cannot move to that position - path is blocked',
        ErrorCode.INVALID_TARGET,
        400
      );
    }

    // Update character position
    character.position = newPosition;

    // Check for traps or hidden objects
    const discoveredObjects = await this.checkForHiddenObjects(context, newPosition);

    // Generate movement description
    const movementDescription = this.generateMovementDescription(params.direction, distance, discoveredObjects);

    const logEntries = [
      {
        timestamp: new Date(),
        actor: character.name,
        action: 'move',
        target: `${params.direction}${distance > 1 ? ` ${distance} spaces` : ''}`,
        result: `Moved from (${oldPosition.x}, ${oldPosition.y}) to (${newPosition.x}, ${newPosition.y})`,
        metadata: {
          oldPosition,
          newPosition,
          distance,
          staminaCost: this.calculateCost(context).stamina
        }
      }
    ];

    const notifications = [
      {
        type: 'movement' as const,
        message: movementDescription,
        recipientId: character.id,
        priority: 'info' as const,
        metadata: {
          position: newPosition,
          discoveredObjects
        }
      }
    ];

    // Add discovery notifications
    if (discoveredObjects.length > 0) {
      discoveredObjects.forEach(obj => {
        notifications.push({
          type: 'discovery' as const,
          message: `You discovered: ${obj.name}`,
          recipientId: character.id,
          priority: 'info' as const,
          metadata: { discoveredObject: obj }
        });
      });
    }

    return {
      success: true,
      data: {
        newPosition,
        discoveredObjects,
        staminaCost: this.calculateCost(context).stamina
      },
      message: movementDescription,
      logEntries,
      notifications
    };
  }

  private calculateNewPosition(
    currentPosition: { x: number; y: number },
    direction: string,
    distance: number
  ): { x: number; y: number } {
    const newPosition = { ...currentPosition };
    
    switch (direction) {
      case 'north':
        newPosition.y -= distance;
        break;
      case 'south':
        newPosition.y += distance;
        break;
      case 'east':
        newPosition.x += distance;
        break;
      case 'west':
        newPosition.x -= distance;
        break;
    }

    return newPosition;
  }

  private async isValidPosition(context: IGameContext, position: { x: number; y: number }): Promise<boolean> {
    // Check map boundaries
    if (position.x < 0 || position.y < 0) {
      return false;
    }

    // Check for obstacles (this would typically query the game world/map data)
    // For now, we'll simulate some basic terrain checks
    const gameWorld = await context.services.worldService.getTerrainAt(position);
    return gameWorld?.passable !== false;
  }

  private async checkForHiddenObjects(context: IGameContext, position: { x: number; y: number }): Promise<Array<{ id: string; name: string; type: string }>> {
    // Simulate discovering hidden objects based on character's perception
    const character = context.session.character;
    const perceptionCheck = character.attributes.intelligence + character.attributes.wisdom;
    const discoveredObjects: Array<{ id: string; name: string; type: string }> = [];

    // Higher perception = higher chance to discover things
    const discoveryChance = Math.min(0.8, perceptionCheck / 40);
    
    if (Math.random() < discoveryChance) {
      const possibleObjects = [
        { name: 'Hidden Treasure', type: 'treasure' },
        { name: 'Secret Passage', type: 'passage' },
        { name: 'Ancient Rune', type: 'rune' },
        { name: 'Mysterious Herb', type: 'herb' }
      ];
      
      const discovered = possibleObjects[Math.floor(Math.random() * possibleObjects.length)];
      discoveredObjects.push({
        id: `discovered_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        ...discovered
      });
    }

    return discoveredObjects;
  }

  private generateMovementDescription(
    direction: string,
    distance: number,
    discoveredObjects: Array<{ name: string }>
  ): string {
    const directionDescriptions = {
      north: 'north',
      south: 'south',
      east: 'east',
      west: 'west'
    };

    let description = `You moved ${distance} space${distance > 1 ? 's' : ''} to the ${directionDescriptions[direction as keyof typeof directionDescriptions]}.`;
    
    if (discoveredObjects.length > 0) {
      description += ` You discovered ${discoveredObjects.length} interesting ${discoveredObjects.length > 1 ? 'things' : 'thing'}.`;
    }

    return description;
  }
}