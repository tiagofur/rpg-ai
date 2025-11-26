import { useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Skeleton } from '../components/Skeleton';
import { RaceSelector } from '../components/RaceSelector';
import { ClassSelector } from '../components/ClassSelector';
import { AttributeDistributor } from '../components/AttributeDistributor';
import {
  RACES,
  CLASSES,
  ATTRIBUTES,
  DEFAULT_ATTRIBUTE_VALUE,
  TOTAL_POINTS_TO_DISTRIBUTE,
  calculateTotalPointsUsed,
  RACE_TO_BACKEND,
  CLASS_TO_BACKEND,
} from '../constants/gameData';
import { characterApi, type Character } from '../api/character';
import { theme } from '../theme';

interface CharacterCreationScreenProps {
  sessionId: string;
  playerId: string;
  onCharacterCreated: (character: Character) => void;
  onCancel: () => void;
}

export interface CharacterCreationData {
  name: string;
  raceId: string;
  classId: string;
  attributes: Record<string, number>;
}

type Step = 'race' | 'class' | 'attributes' | 'name';

const STEPS: Step[] = ['race', 'class', 'attributes', 'name'];

export function CharacterCreationScreen({
  sessionId,
  playerId,
  onCharacterCreated,
  onCancel,
}: CharacterCreationScreenProps) {
  const [currentStep, setCurrentStep] = useState<Step>('race');
  const [selectedRace, setSelectedRace] = useState<string | null>(null);
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [characterName, setCharacterName] = useState('');
  const [attributes, setAttributes] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    ATTRIBUTES.forEach((attr) => {
      initial[attr.id] = DEFAULT_ATTRIBUTE_VALUE;
    });
    return initial;
  });
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentStepIndex = STEPS.indexOf(currentStep);
  const progress = ((currentStepIndex + 1) / STEPS.length) * 100;

  const selectedRaceData = useMemo(() => RACES.find((r) => r.id === selectedRace), [selectedRace]);

  const selectedClassData = useMemo(
    () => CLASSES.find((c) => c.id === selectedClass),
    [selectedClass]
  );

  const canProceed = (): boolean => {
    switch (currentStep) {
      case 'race':
        return selectedRace !== null;
      case 'class':
        return selectedClass !== null;
      case 'attributes': {
        const pointsUsed = calculateTotalPointsUsed(attributes);
        return pointsUsed <= TOTAL_POINTS_TO_DISTRIBUTE;
      }
      case 'name':
        return characterName.trim().length >= 2;
      default:
        return false;
    }
  };

  const handleNext = () => {
    const idx = currentStepIndex;
    if (idx < STEPS.length - 1) {
      const nextStep = STEPS[idx + 1];
      if (nextStep) setCurrentStep(nextStep);
    }
  };

  const handleBack = () => {
    const idx = currentStepIndex;
    if (idx > 0) {
      const prevStep = STEPS[idx - 1];
      if (prevStep) setCurrentStep(prevStep);
    } else {
      onCancel();
    }
  };

  const handleAttributeChange = (attributeId: string, newValue: number) => {
    setAttributes((prev) => ({
      ...prev,
      [attributeId]: newValue,
    }));
  };

  const handleCreate = async () => {
    if (!selectedRace || !selectedClass || !characterName.trim()) {
      setError('Por favor completa todos los campos');
      return;
    }

    setIsCreating(true);
    setError(null);

    try {
      // Map frontend IDs to backend names
      const raza = RACE_TO_BACKEND[selectedRace];
      const clase = CLASS_TO_BACKEND[selectedClass];

      if (!raza || !clase) {
        setError('Error: Raza o clase inválida');
        return;
      }

      // Map attribute IDs to backend names with numeric values
      const backendAttributes = {
        Fuerza: attributes['strength'] ?? 10,
        Agilidad: attributes['dexterity'] ?? 10,
        Constitución: attributes['constitution'] ?? 10,
        Inteligencia: attributes['intelligence'] ?? 10,
        Sabiduría: attributes['wisdom'] ?? 10,
        Carisma: attributes['charisma'] ?? 10,
      };

      const response = await characterApi.createDirect({
        sessionId,
        playerId,
        nombre: characterName.trim(),
        raza,
        clase,
        atributos: backendAttributes,
      });

      onCharacterCreated(response.character);
    } catch (error_) {
      const message = error_ instanceof Error ? error_.message : 'Error al crear personaje';
      setError(message);
    } finally {
      setIsCreating(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 'race':
        return (
          <RaceSelector races={RACES} selectedRace={selectedRace} onSelectRace={setSelectedRace} />
        );

      case 'class':
        return (
          <ClassSelector
            classes={CLASSES}
            selectedClass={selectedClass}
            onSelectClass={setSelectedClass}
          />
        );

      case 'attributes':
        return (
          <AttributeDistributor
            attributes={attributes}
            onAttributeChange={handleAttributeChange}
            raceBonuses={selectedRaceData?.bonuses}
          />
        );

      case 'name':
        return (
          <View style={styles.nameContainer}>
            <Text style={styles.stepTitle}>Nombra a tu Héroe</Text>
            <Text style={styles.stepSubtitle}>Un nombre digno de las leyendas</Text>

            <View style={styles.previewCard}>
              <Text style={styles.previewIcon}>
                {selectedRaceData?.icon} {selectedClassData?.icon}
              </Text>
              <TextInput
                style={styles.nameInput}
                placeholder='Escribe tu nombre...'
                placeholderTextColor={theme.colors.textMuted}
                value={characterName}
                onChangeText={setCharacterName}
                maxLength={30}
                autoFocus
              />
              <Text style={styles.previewRaceClass}>
                {selectedRaceData?.nameEs} {selectedClassData?.nameEs}
              </Text>
            </View>

            {error && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>⚠️ {error}</Text>
              </View>
            )}
          </View>
        );
    }
  };

  return (
    <LinearGradient colors={[theme.colors.background, '#0a0a1f']} style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Text style={styles.backButtonText}>{currentStepIndex === 0 ? '✕' : '←'}</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Crear Personaje</Text>
          <View style={styles.stepIndicator}>
            <Text style={styles.stepText}>
              {currentStepIndex + 1}/{STEPS.length}
            </Text>
          </View>
        </View>

        {/* Progress bar */}
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>

        {/* Content */}
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {renderStepContent()}
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          {currentStep === 'name' ? (
            <TouchableOpacity
              style={[styles.primaryButton, (!canProceed() || isCreating) && styles.buttonDisabled]}
              onPress={handleCreate}
              disabled={!canProceed() || isCreating}
            >
              {isCreating ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Skeleton variant='circle' width={20} />
                  <Skeleton variant='text' width={120} height={16} />
                </View>
              ) : (
                <Text style={styles.primaryButtonText}>⚔️ Crear Héroe</Text>
              )}
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.primaryButton, !canProceed() && styles.buttonDisabled]}
              onPress={handleNext}
              disabled={!canProceed()}
            >
              <Text style={styles.primaryButtonText}>Continuar →</Text>
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonText: {
    fontSize: 20,
    color: theme.colors.text,
  },
  headerTitle: {
    fontFamily: 'Cinzel_700Bold',
    fontSize: 18,
    color: theme.colors.gold,
  },
  stepIndicator: {
    backgroundColor: theme.colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  stepText: {
    fontFamily: 'Lato_700Bold',
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  progressBar: {
    height: 3,
    backgroundColor: theme.colors.border,
    marginHorizontal: 16,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: theme.colors.gold,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  footer: {
    padding: 16,
    paddingBottom: 32,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  primaryButton: {
    backgroundColor: theme.colors.gold,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  primaryButtonText: {
    fontFamily: 'Cinzel_700Bold',
    fontSize: 16,
    color: theme.colors.background,
  },
  // Name step styles
  nameContainer: {
    alignItems: 'center',
    paddingTop: 20,
  },
  stepTitle: {
    fontFamily: 'Cinzel_700Bold',
    fontSize: 24,
    color: theme.colors.gold,
    marginBottom: 8,
  },
  stepSubtitle: {
    fontFamily: 'Lato_400Regular',
    fontSize: 14,
    color: theme.colors.textMuted,
    marginBottom: 32,
  },
  previewCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    width: '100%',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  previewIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  nameInput: {
    fontFamily: 'Cinzel_700Bold',
    fontSize: 24,
    color: theme.colors.text,
    textAlign: 'center',
    width: '100%',
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: theme.colors.gold,
    marginBottom: 16,
  },
  previewRaceClass: {
    fontFamily: 'Lato_400Regular',
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  errorContainer: {
    marginTop: 16,
    backgroundColor: 'rgba(220, 38, 38, 0.1)',
    borderWidth: 1,
    borderColor: theme.colors.danger,
    borderRadius: 8,
    padding: 12,
    width: '100%',
  },
  errorText: {
    fontFamily: 'Lato_400Regular',
    fontSize: 14,
    color: theme.colors.danger,
    textAlign: 'center',
  },
});
