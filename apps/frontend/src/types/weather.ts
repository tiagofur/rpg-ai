/**
 * Weather System Types
 * Sistema de clima dinámico que afecta el gameplay
 */

export type WeatherType =
    | 'clear'
    | 'cloudy'
    | 'rain'
    | 'storm'
    | 'snow'
    | 'fog'
    | 'heatwave'
    | 'windy'
    | 'sandstorm'
    | 'blizzard';

export type WeatherIntensity = 'light' | 'moderate' | 'heavy';

export type TimeOfDay = 'dawn' | 'day' | 'dusk' | 'night';

export interface IWeatherEffect {
    stat: string;
    modifier: number; // Percentage or flat value
    isPercentage: boolean;
    description: string;
}

export interface IWeather {
    type: WeatherType;
    intensity: WeatherIntensity;
    timeOfDay: TimeOfDay;
    effects: IWeatherEffect[];
    duration: number; // In game minutes
    transitionTime: number; // Seconds to transition to this weather
}

export interface IWeatherForecast {
    weather: IWeather;
    startsAt: Date;
    probability: number; // 0-1
}

export interface IWeatherState {
    current: IWeather;
    forecast: IWeatherForecast[];
    lastUpdate: Date;
}

/**
 * Get weather icon by type
 */
export function getWeatherIcon(type: WeatherType): string {
    const icons: Record<WeatherType, string> = {
        clear: '☀️',
        cloudy: '☁️',
        rain: '🌧️',
        storm: '⛈️',
        snow: '❄️',
        fog: '🌫️',
        heatwave: '🔥',
        windy: '💨',
        sandstorm: '🏜️',
        blizzard: '🌨️',
    };
    return icons[type];
}

/**
 * Get time of day icon
 */
export function getTimeIcon(time: TimeOfDay): string {
    const icons: Record<TimeOfDay, string> = {
        dawn: '🌅',
        day: '☀️',
        dusk: '🌆',
        night: '🌙',
    };
    return icons[time];
}

/**
 * Get weather color for UI
 */
export function getWeatherColor(type: WeatherType): string {
    const colors: Record<WeatherType, string> = {
        clear: '#FFD700',
        cloudy: '#A0A0A0',
        rain: '#4A90D9',
        storm: '#4A0080',
        snow: '#E8F4F8',
        fog: '#C0C0C0',
        heatwave: '#FF6B35',
        windy: '#87CEEB',
        sandstorm: '#C2B280',
        blizzard: '#B0E0E6',
    };
    return colors[type];
}

/**
 * Get intensity label
 */
export function getIntensityLabel(intensity: WeatherIntensity): string {
    const labels: Record<WeatherIntensity, string> = {
        light: 'Light',
        moderate: 'Moderate',
        heavy: 'Heavy',
    };
    return labels[intensity];
}

/**
 * Get background gradient colors for weather
 */
export function getWeatherGradient(type: WeatherType, time: TimeOfDay): [string, string] {
    // Base gradients by time of day
    const timeGradients: Record<TimeOfDay, [string, string]> = {
        dawn: ['#FF9A8B', '#FF6A88'],
        day: ['#87CEEB', '#4A90D9'],
        dusk: ['#FF7E5F', '#FEB47B'],
        night: ['#1a1a2e', '#16213e'],
    };

    // Modify based on weather
    switch (type) {
        case 'storm':
            return ['#2C3E50', '#1a1a2e'];
        case 'fog':
            return ['#C0C0C0', '#A0A0A0'];
        case 'snow':
        case 'blizzard':
            return ['#E8F4F8', '#B0C4DE'];
        case 'heatwave':
            return ['#FF6B35', '#FF8C00'];
        case 'sandstorm':
            return ['#C2B280', '#8B7355'];
        default:
            return timeGradients[time];
    }
}

/**
 * Weather effects on combat and gameplay
 */
export const WEATHER_EFFECTS: Record<WeatherType, IWeatherEffect[]> = {
    clear: [],
    cloudy: [],
    rain: [
        { stat: 'rangedAccuracy', modifier: -10, isPercentage: true, description: '-10% ranged accuracy' },
        { stat: 'fireSpellDamage', modifier: -20, isPercentage: true, description: '-20% fire spell damage' },
    ],
    storm: [
        { stat: 'rangedAccuracy', modifier: -20, isPercentage: true, description: '-20% ranged accuracy' },
        { stat: 'lightningDamage', modifier: 50, isPercentage: true, description: '+50% lightning damage' },
        { stat: 'fireSpellDamage', modifier: -30, isPercentage: true, description: '-30% fire spell damage' },
    ],
    snow: [
        { stat: 'movementSpeed', modifier: -1, isPercentage: false, description: '-1 movement speed' },
        { stat: 'iceDamage', modifier: 20, isPercentage: true, description: '+20% ice damage' },
    ],
    fog: [
        { stat: 'accuracy', modifier: -20, isPercentage: true, description: '-20% accuracy' },
        { stat: 'stealth', modifier: 10, isPercentage: true, description: '+10% stealth' },
        { stat: 'criticalChance', modifier: -10, isPercentage: true, description: '-10% critical chance' },
    ],
    heatwave: [
        { stat: 'maxStamina', modifier: -10, isPercentage: true, description: '-10% max stamina' },
        { stat: 'fireSpellDamage', modifier: 30, isPercentage: true, description: '+30% fire spell damage' },
        { stat: 'iceDamage', modifier: -20, isPercentage: true, description: '-20% ice damage' },
    ],
    windy: [
        { stat: 'rangedAccuracy', modifier: -15, isPercentage: true, description: '-15% ranged accuracy' },
        { stat: 'movementSpeed', modifier: -0.5, isPercentage: false, description: '-0.5 movement speed' },
    ],
    sandstorm: [
        { stat: 'accuracy', modifier: -30, isPercentage: true, description: '-30% accuracy' },
        { stat: 'visibility', modifier: -50, isPercentage: true, description: '-50% visibility' },
        { stat: 'earthDamage', modifier: 25, isPercentage: true, description: '+25% earth damage' },
    ],
    blizzard: [
        { stat: 'movementSpeed', modifier: -2, isPercentage: false, description: '-2 movement speed' },
        { stat: 'accuracy', modifier: -25, isPercentage: true, description: '-25% accuracy' },
        { stat: 'iceDamage', modifier: 40, isPercentage: true, description: '+40% ice damage' },
        { stat: 'fireSpellDamage', modifier: -40, isPercentage: true, description: '-40% fire spell damage' },
    ],
};

/**
 * Sample weather for development
 */
export const SAMPLE_WEATHER: IWeather = {
    type: 'rain',
    intensity: 'moderate',
    timeOfDay: 'dusk',
    effects: WEATHER_EFFECTS.rain,
    duration: 30,
    transitionTime: 5,
};

/**
 * Sample forecast for development
 */
export const SAMPLE_FORECAST: IWeatherForecast[] = [
    {
        weather: {
            type: 'storm',
            intensity: 'heavy',
            timeOfDay: 'night',
            effects: WEATHER_EFFECTS.storm,
            duration: 45,
            transitionTime: 10,
        },
        startsAt: new Date(Date.now() + 30 * 60 * 1000),
        probability: 0.8,
    },
    {
        weather: {
            type: 'cloudy',
            intensity: 'light',
            timeOfDay: 'dawn',
            effects: WEATHER_EFFECTS.cloudy,
            duration: 60,
            transitionTime: 15,
        },
        startsAt: new Date(Date.now() + 75 * 60 * 1000),
        probability: 0.6,
    },
    {
        weather: {
            type: 'clear',
            intensity: 'light',
            timeOfDay: 'day',
            effects: WEATHER_EFFECTS.clear,
            duration: 120,
            transitionTime: 20,
        },
        startsAt: new Date(Date.now() + 135 * 60 * 1000),
        probability: 0.9,
    },
];
