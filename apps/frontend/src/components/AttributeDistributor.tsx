import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import {
  ATTRIBUTES,
  MIN_ATTRIBUTE_VALUE,
  MAX_ATTRIBUTE_VALUE,
  TOTAL_POINTS_TO_DISTRIBUTE,
  calculatePointCost,
  calculateTotalPointsUsed,
} from '../constants/gameData';
import { theme } from '../theme';

export interface AttributeDistributorProps {
  attributes: Record<string, number>;
  onAttributeChange: (attributeId: string, newValue: number) => void;
  raceBonuses?: { attribute: string; value: number }[] | undefined;
}

const canDecrease = (value: number): boolean => value > MIN_ATTRIBUTE_VALUE;

export function AttributeDistributor({
  attributes,
  onAttributeChange,
  raceBonuses = [],
}: AttributeDistributorProps) {
  const pointsUsed = calculateTotalPointsUsed(attributes);
  const pointsRemaining = TOTAL_POINTS_TO_DISTRIBUTE - pointsUsed;

  const getBonus = (attributeName: string): number => {
    const bonus = raceBonuses.find((b) => b.attribute === attributeName || b.attribute === 'Todas');
    return bonus?.value ?? 0;
  };

  const canIncrease = (value: number): boolean => {
    if (value >= MAX_ATTRIBUTE_VALUE) return false;
    const nextCost = calculatePointCost(value + 1) - calculatePointCost(value);
    return nextCost <= pointsRemaining;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Distribuye tus Atributos</Text>
        <View style={styles.pointsContainer}>
          <Text style={styles.pointsLabel}>Puntos:</Text>
          <Text
            style={[
              styles.pointsValue,
              pointsRemaining === 0 && styles.pointsComplete,
              pointsRemaining < 0 && styles.pointsOver,
            ]}
          >
            {pointsRemaining}/{TOTAL_POINTS_TO_DISTRIBUTE}
          </Text>
        </View>
      </View>

      <View style={styles.attributesList}>
        {ATTRIBUTES.map((attr) => {
          const baseValue = attributes[attr.id] ?? 10;
          const bonus = getBonus(attr.nameEs);
          const totalValue = baseValue + bonus;
          const modifier = Math.floor((totalValue - 10) / 2);

          return (
            <View key={attr.id} style={styles.attributeRow}>
              <View style={styles.attributeInfo}>
                <Text style={styles.attributeIcon}>{attr.icon}</Text>
                <View>
                  <Text style={styles.attributeName}>{attr.nameEs}</Text>
                  <Text style={styles.attributeAbbr}>{attr.abbreviation}</Text>
                </View>
              </View>

              <View style={styles.attributeControls}>
                <TouchableOpacity
                  style={[
                    styles.controlButton,
                    !canDecrease(baseValue) && styles.controlButtonDisabled,
                  ]}
                  onPress={() => onAttributeChange(attr.id, baseValue - 1)}
                  disabled={!canDecrease(baseValue)}
                >
                  <Text style={styles.controlButtonText}>−</Text>
                </TouchableOpacity>

                <View style={styles.valueContainer}>
                  <Text style={styles.baseValue}>{baseValue}</Text>
                  {bonus > 0 && <Text style={styles.bonusValue}>+{bonus}</Text>}
                </View>

                <TouchableOpacity
                  style={[
                    styles.controlButton,
                    !canIncrease(baseValue) && styles.controlButtonDisabled,
                  ]}
                  onPress={() => onAttributeChange(attr.id, baseValue + 1)}
                  disabled={!canIncrease(baseValue)}
                >
                  <Text style={styles.controlButtonText}>+</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.totalContainer}>
                <Text style={styles.totalValue}>{totalValue}</Text>
                <Text
                  style={[
                    styles.modifierValue,
                    modifier >= 0 ? styles.modifierPositive : styles.modifierNegative,
                  ]}
                >
                  {modifier >= 0 ? `+${modifier}` : modifier}
                </Text>
              </View>
            </View>
          );
        })}
      </View>

      <Text style={styles.hint}>💡 El coste aumenta a medida que subes un atributo</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontFamily: 'Cinzel_700Bold',
    fontSize: 20,
    color: theme.colors.gold,
  },
  pointsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  pointsLabel: {
    fontFamily: 'Lato_400Regular',
    fontSize: 12,
    color: theme.colors.textMuted,
    marginRight: 6,
  },
  pointsValue: {
    fontFamily: 'Lato_700Bold',
    fontSize: 14,
    color: theme.colors.text,
  },
  pointsComplete: {
    color: theme.colors.success,
  },
  pointsOver: {
    color: theme.colors.danger,
  },
  attributesList: {
    gap: 8,
  },
  attributeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  attributeInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  attributeIcon: {
    fontSize: 20,
  },
  attributeName: {
    fontFamily: 'Lato_700Bold',
    fontSize: 13,
    color: theme.colors.text,
  },
  attributeAbbr: {
    fontFamily: 'Lato_400Regular',
    fontSize: 10,
    color: theme.colors.textMuted,
  },
  attributeControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  controlButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: theme.colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlButtonDisabled: {
    backgroundColor: theme.colors.border,
    opacity: 0.5,
  },
  controlButtonText: {
    fontFamily: 'Lato_700Bold',
    fontSize: 18,
    color: theme.colors.background,
  },
  valueContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    minWidth: 50,
    justifyContent: 'center',
  },
  baseValue: {
    fontFamily: 'Lato_700Bold',
    fontSize: 18,
    color: theme.colors.text,
  },
  bonusValue: {
    fontFamily: 'Lato_700Bold',
    fontSize: 12,
    color: theme.colors.success,
    marginLeft: 2,
  },
  totalContainer: {
    alignItems: 'center',
    minWidth: 50,
    marginLeft: 8,
  },
  totalValue: {
    fontFamily: 'Cinzel_700Bold',
    fontSize: 20,
    color: theme.colors.gold,
  },
  modifierValue: {
    fontFamily: 'Lato_700Bold',
    fontSize: 12,
  },
  modifierPositive: {
    color: theme.colors.success,
  },
  modifierNegative: {
    color: theme.colors.danger,
  },
  hint: {
    fontFamily: 'Lato_400Regular',
    fontSize: 12,
    color: theme.colors.textMuted,
    textAlign: 'center',
    marginTop: 12,
  },
});
