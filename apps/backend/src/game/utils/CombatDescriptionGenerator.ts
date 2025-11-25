
export class CombatDescriptionGenerator {
    private static readonly WEAPON_TYPES = {
        BLADE: ['slash', 'cut', 'slice', 'cleave'],
        BLUNT: ['crush', 'smash', 'bash', 'pummel'],
        PIERCE: ['pierce', 'stab', 'thrust', 'puncture'],
        MAGIC: ['blast', 'scorch', 'freeze', 'shock'],
        UNARMED: ['punch', 'kick', 'strike', 'slam']
    };

    private static readonly BODY_PARTS = [
        'chest', 'arm', 'leg', 'shoulder', 'head', 'torso', 'back'
    ];

    static generateHitDescription(attackerName: string, targetName: string, damage: number, weaponType: string = 'UNARMED', isCritical: boolean): string {
        const verbs = this.WEAPON_TYPES[weaponType as keyof typeof this.WEAPON_TYPES] || this.WEAPON_TYPES.UNARMED;
        const verb = verbs[Math.floor(Math.random() * verbs.length)];
        const bodyPart = this.BODY_PARTS[Math.floor(Math.random() * this.BODY_PARTS.length)];

        if (isCritical) {
            const critAdjectives = ['brutal', 'devastating', 'savage', 'vicious', 'deadly'];
            const adj = critAdjectives[Math.floor(Math.random() * critAdjectives.length)];
            return `${attackerName} lands a ${adj} ${verb} on ${targetName}'s ${bodyPart}, dealing ${damage} damage!`;
        }

        if (damage > 20) {
            return `${attackerName} powerfully ${verb}s ${targetName} in the ${bodyPart} for ${damage} damage.`;
        } else if (damage > 5) {
            return `${attackerName} ${verb}s ${targetName} for ${damage} damage.`;
        } else {
            return `${attackerName} grazes ${targetName} for ${damage} damage.`;
        }
    }

    static generateMissDescription(attackerName: string, targetName: string): string {
        const templates = [
            `${attackerName} attacks ${targetName} but misses wide.`,
            `${targetName} easily dodges ${attackerName}'s attack.`,
            `${attackerName}'s attack is deflected by ${targetName}.`,
            `${attackerName} stumbles and misses ${targetName}.`,
            `${targetName} sidesteps ${attackerName}'s clumsy strike.`
        ];
        return templates[Math.floor(Math.random() * templates.length)] || `${attackerName} misses ${targetName}.`;
    }

    static generateKillDescription(attackerName: string, targetName: string, weaponType: string = 'UNARMED'): string {
        const verbs = this.WEAPON_TYPES[weaponType as keyof typeof this.WEAPON_TYPES] || this.WEAPON_TYPES.UNARMED;
        const verb = verbs[Math.floor(Math.random() * verbs.length)];

        const templates = [
            `${attackerName} delivers a killing blow, ${verb}ing ${targetName} to the ground!`,
            `${targetName} falls lifeless after ${attackerName}'s final ${verb}.`,
            `${attackerName} ends ${targetName}'s life with a precise ${verb}.`,
            `With a mighty ${verb}, ${attackerName} defeats ${targetName}!`
        ];
        return templates[Math.floor(Math.random() * templates.length)] || `${attackerName} defeats ${targetName}!`;
    }
}
