import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { RaceData } from '../constants/gameData';
import { theme } from '../theme';

interface RaceSelectorProps {
  races: RaceData[];
  selectedRace: string | null;
  onSelectRace: (raceId: string) => void;
}

export function RaceSelector({ races, selectedRace, onSelectRace }: RaceSelectorProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Elige tu Raza</Text>
      <Text style={styles.subtitle}>Tu herencia define tus habilidades innatas</Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {races.map((race) => (
          <TouchableOpacity
            key={race.id}
            style={[styles.raceCard, selectedRace === race.id && styles.raceCardSelected]}
            onPress={() => onSelectRace(race.id)}
            activeOpacity={0.7}
          >
            <Text style={styles.raceIcon}>{race.icon}</Text>
            <Text style={[styles.raceName, selectedRace === race.id && styles.raceNameSelected]}>
              {race.nameEs}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {selectedRace && <RaceDetails race={races.find((r) => r.id === selectedRace)!} />}
    </View>
  );
}

function RaceDetails({ race }: { race: RaceData }) {
  return (
    <View style={styles.detailsContainer}>
      <Text style={styles.description}>{race.description}</Text>

      <View style={styles.bonusesContainer}>
        <Text style={styles.sectionLabel}>Bonificaciones:</Text>
        <View style={styles.bonusesList}>
          {race.bonuses.map((bonus, index) => (
            <View key={index} style={styles.bonusTag}>
              <Text style={styles.bonusText}>
                +{bonus.value} {bonus.attribute}
              </Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.traitsContainer}>
        <Text style={styles.sectionLabel}>Rasgos:</Text>
        <View style={styles.traitsList}>
          {race.traits.map((trait, index) => (
            <View key={index} style={styles.traitTag}>
              <Text style={styles.traitText}>{trait}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  title: {
    fontFamily: 'Cinzel_700Bold',
    fontSize: 20,
    color: theme.colors.gold,
    marginBottom: 4,
  },
  subtitle: {
    fontFamily: 'Lato_400Regular',
    fontSize: 14,
    color: theme.colors.textMuted,
    marginBottom: 16,
  },
  scrollContent: {
    paddingRight: 16,
    gap: 12,
  },
  raceCard: {
    width: 90,
    height: 100,
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  raceCardSelected: {
    borderColor: theme.colors.gold,
    backgroundColor: 'rgba(247, 207, 70, 0.1)',
  },
  raceIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  raceName: {
    fontFamily: 'Lato_700Bold',
    fontSize: 12,
    color: theme.colors.text,
    textAlign: 'center',
  },
  raceNameSelected: {
    color: theme.colors.gold,
  },
  detailsContainer: {
    marginTop: 16,
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  description: {
    fontFamily: 'Lato_400Regular',
    fontSize: 14,
    color: theme.colors.textSecondary,
    lineHeight: 20,
    marginBottom: 12,
  },
  sectionLabel: {
    fontFamily: 'Lato_700Bold',
    fontSize: 12,
    color: theme.colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  bonusesContainer: {
    marginBottom: 12,
  },
  bonusesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  bonusTag: {
    backgroundColor: 'rgba(74, 222, 128, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: theme.colors.success,
  },
  bonusText: {
    fontFamily: 'Lato_700Bold',
    fontSize: 12,
    color: theme.colors.success,
  },
  traitsContainer: {},
  traitsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  traitTag: {
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: theme.colors.info,
  },
  traitText: {
    fontFamily: 'Lato_400Regular',
    fontSize: 12,
    color: theme.colors.info,
  },
});
