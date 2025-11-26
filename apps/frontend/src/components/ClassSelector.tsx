import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { ClassData } from '../constants/gameData';
import { theme } from '../theme';

interface ClassSelectorProps {
  classes: ClassData[];
  selectedClass: string | null;
  onSelectClass: (classId: string) => void;
}

export function ClassSelector({ classes, selectedClass, onSelectClass }: ClassSelectorProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Elige tu Clase</Text>
      <Text style={styles.subtitle}>Tu profesión define tu camino</Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {classes.map((cls) => (
          <TouchableOpacity
            key={cls.id}
            style={[styles.classCard, selectedClass === cls.id && styles.classCardSelected]}
            onPress={() => onSelectClass(cls.id)}
            activeOpacity={0.7}
          >
            <Text style={styles.classIcon}>{cls.icon}</Text>
            <Text style={[styles.className, selectedClass === cls.id && styles.classNameSelected]}>
              {cls.nameEs}
            </Text>
            <Text style={styles.hitDie}>d{cls.hitDie}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {selectedClass && (
        <ClassDetails classData={classes.find((c) => c.id === selectedClass) ?? null} />
      )}
    </View>
  );
}

function ClassDetails({ classData }: { classData: ClassData | null }) {
  if (!classData) return null;

  return (
    <View style={styles.detailsContainer}>
      <Text style={styles.description}>{classData.description}</Text>

      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Principal</Text>
          <Text style={styles.statValue}>{classData.primaryAttribute}</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Secundario</Text>
          <Text style={styles.statValue}>{classData.secondaryAttribute}</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Dado de Vida</Text>
          <Text style={styles.statValue}>d{classData.hitDie}</Text>
        </View>
      </View>

      <View style={styles.skillsContainer}>
        <Text style={styles.sectionLabel}>Habilidades:</Text>
        <View style={styles.skillsList}>
          {classData.skills.map((skill, index) => (
            <View key={index} style={styles.skillTag}>
              <Text style={styles.skillText}>{skill}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.itemsContainer}>
        <Text style={styles.sectionLabel}>Equipo Inicial:</Text>
        <View style={styles.itemsList}>
          {classData.startingItems.map((item, index) => (
            <Text key={index} style={styles.itemText}>
              • {item}
            </Text>
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
  classCard: {
    width: 90,
    height: 110,
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  classCardSelected: {
    borderColor: theme.colors.gold,
    backgroundColor: 'rgba(247, 207, 70, 0.1)',
  },
  classIcon: {
    fontSize: 28,
    marginBottom: 6,
  },
  className: {
    fontFamily: 'Lato_700Bold',
    fontSize: 11,
    color: theme.colors.text,
    textAlign: 'center',
  },
  classNameSelected: {
    color: theme.colors.gold,
  },
  hitDie: {
    fontFamily: 'Lato_400Regular',
    fontSize: 10,
    color: theme.colors.textMuted,
    marginTop: 4,
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
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 8,
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontFamily: 'Lato_400Regular',
    fontSize: 10,
    color: theme.colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  statValue: {
    fontFamily: 'Lato_700Bold',
    fontSize: 14,
    color: theme.colors.gold,
  },
  sectionLabel: {
    fontFamily: 'Lato_700Bold',
    fontSize: 12,
    color: theme.colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  skillsContainer: {
    marginBottom: 12,
  },
  skillsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  skillTag: {
    backgroundColor: 'rgba(168, 85, 247, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#a855f7',
  },
  skillText: {
    fontFamily: 'Lato_400Regular',
    fontSize: 12,
    color: '#a855f7',
  },
  itemsContainer: {},
  itemsList: {
    gap: 4,
  },
  itemText: {
    fontFamily: 'Lato_400Regular',
    fontSize: 13,
    color: theme.colors.textSecondary,
  },
});
