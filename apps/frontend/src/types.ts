export interface Character {
    id: string;
    name: string;
    level: number;
    class: string;
    experience: number;
    health: {
        current: number;
        maximum: number;
    };
    mana: {
        current: number;
        maximum: number;
    };
    status?: string[];
    nextLevelExperience?: number;
    attributes: {
        strength: number;
        dexterity: number;
        intelligence: number;
        wisdom: number;
        constitution: number;
        charisma: number;
        luck: number;
    };
    inventory: {
        items: Item[];
        gold: number;
    };
    equipment: {
        helmet?: Item;
        armor?: Item;
        gloves?: Item;
        boots?: Item;
        weapon?: Item;
        shield?: Item;
        amulet?: Item;
        ring1?: Item;
        ring2?: Item;
    };
}

export interface Item {
    id: string;
    name: string;
    description: string;
    type: string;
    rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
    value: number;
    quantity: number;
}
