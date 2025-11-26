import { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, Modal, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import Animated, { FadeIn, SlideInDown } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';

import { COLORS, FONTS } from '../../theme';
import { MapNode } from './MapNode';
import { IMapLocation, IMapState, getLocationIcon, getDangerColor } from '../../types/map';
import { useGameEffects } from '../../hooks/useGameEffects';

interface MiniMapProps {
  mapState: IMapState;
  onLocationPress?: (location: IMapLocation) => void;
  onTravelTo?: (locationId: string) => void;
  width?: number;
  height?: number;
  showLegend?: boolean;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DEFAULT_MAP_SIZE = SCREEN_WIDTH - 32;

/**
 * Connection line component using positioned View
 */
function ConnectionLine({
  from,
  to,
  mapWidth,
  mapHeight,
  isDashed,
}: {
  from: { x: number; y: number };
  to: { x: number; y: number };
  mapWidth: number;
  mapHeight: number;
  isDashed: boolean;
}) {
  const x1 = (from.x / 100) * mapWidth;
  const y1 = (from.y / 100) * mapHeight;
  const x2 = (to.x / 100) * mapWidth;
  const y2 = (to.y / 100) * mapHeight;

  const dx = x2 - x1;
  const dy = y2 - y1;
  const length = Math.hypot(dx, dy);
  const angle = Math.atan2(dy, dx) * (180 / Math.PI);

  return (
    <View
      style={[
        styles.connectionLine,
        {
          width: length,
          left: x1,
          top: y1,
          transform: [{ translateY: -1 }, { rotate: `${angle}deg` }],
          transformOrigin: 'left center',
          borderStyle: isDashed ? 'dashed' : 'solid',
        },
      ]}
    />
  );
}

export function MiniMap({
  mapState,
  onLocationPress,
  onTravelTo,
  width = DEFAULT_MAP_SIZE,
  height = DEFAULT_MAP_SIZE,
  showLegend = true,
}: MiniMapProps) {
  const { t } = useTranslation();
  const { playHaptic } = useGameEffects();
  const [selectedLocation, setSelectedLocation] = useState<IMapLocation | null>(null);

  const currentLocation = mapState.locations.find((loc) => loc.id === mapState.currentLocationId);

  const handleNodePress = (location: IMapLocation) => {
    playHaptic('light');
    setSelectedLocation(location);
    onLocationPress?.(location);
  };

  const handleTravelPress = () => {
    if (!selectedLocation) return;
    playHaptic('medium');
    onTravelTo?.(selectedLocation.id);
    setSelectedLocation(null);
  };

  // Filter locations based on fog of war
  const visibleLocations = mapState.fogOfWar
    ? mapState.locations.filter(
        (loc) => loc.status !== 'unexplored' || currentLocation?.connectedTo.includes(loc.id)
      )
    : mapState.locations;

  // Calculate connections between visible locations
  const connections: { from: IMapLocation; to: IMapLocation }[] = [];
  for (const location of visibleLocations) {
    for (const connectedId of location.connectedTo) {
      const connected = visibleLocations.find((l) => l.id === connectedId);
      if (connected) {
        // Avoid duplicate connections
        const exists = connections.some(
          (c) =>
            (c.from.id === location.id && c.to.id === connected.id) ||
            (c.from.id === connected.id && c.to.id === location.id)
        );
        if (!exists) {
          connections.push({ from: location, to: connected });
        }
      }
    }
  }

  const canTravelTo = (location: IMapLocation): boolean => {
    if (!currentLocation) return false;
    if (location.id === currentLocation.id) return false;
    return currentLocation.connectedTo.includes(location.id);
  };

  return (
    <View style={[styles.container, { width, height: height + (showLegend ? 60 : 0) }]}>
      {/* Region title */}
      <View style={styles.titleContainer}>
        <Text style={styles.regionTitle}>{mapState.regionName}</Text>
      </View>

      {/* Map area */}
      <View style={[styles.mapContainer, { width, height }]}>
        <LinearGradient
          colors={['rgba(20,25,40,0.95)', 'rgba(15,20,35,0.98)']}
          style={styles.mapGradient}
        >
          {/* Connection lines */}
          <View style={StyleSheet.absoluteFill} pointerEvents='none'>
            {connections.map((conn, index) => (
              <ConnectionLine
                key={`${conn.from.id}-${conn.to.id}-${index}`}
                from={conn.from.position}
                to={conn.to.position}
                mapWidth={width}
                mapHeight={height}
                isDashed={conn.from.status === 'unexplored' || conn.to.status === 'unexplored'}
              />
            ))}
          </View>

          {/* Location nodes */}
          {visibleLocations.map((location) => (
            <View
              key={location.id}
              style={[
                styles.nodePositioner,
                {
                  left: (location.position.x / 100) * width - 28,
                  top: (location.position.y / 100) * height - 28,
                },
              ]}
            >
              <MapNode
                location={location}
                isCurrentLocation={location.id === mapState.currentLocationId}
                onPress={handleNodePress}
                size='medium'
                showLabel={true}
              />
            </View>
          ))}

          {/* Fog overlay for unexplored areas */}
          {mapState.fogOfWar && (
            <View style={styles.fogOverlay} pointerEvents='none'>
              <Text style={styles.fogText}>?</Text>
            </View>
          )}
        </LinearGradient>
      </View>

      {/* Legend */}
      {showLegend && (
        <Animated.View entering={FadeIn.delay(200)} style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#f7cf46' }]} />
            <Text style={styles.legendText}>{t('map.current')}</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#4a9eff' }]} />
            <Text style={styles.legendText}>{t('map.visited')}</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#888' }]} />
            <Text style={styles.legendText}>{t('map.unexplored')}</Text>
          </View>
        </Animated.View>
      )}

      {/* Location Detail Modal */}
      <Modal
        visible={!!selectedLocation}
        transparent
        animationType='fade'
        onRequestClose={() => setSelectedLocation(null)}
      >
        <View style={styles.modalOverlay}>
          <BlurView intensity={20} style={StyleSheet.absoluteFill} />
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            onPress={() => setSelectedLocation(null)}
          />

          {selectedLocation && (
            <Animated.View entering={SlideInDown.springify()} style={styles.detailCard}>
              <LinearGradient colors={[COLORS.secondary, '#1a1a2e']} style={styles.detailGradient}>
                <View style={styles.detailHeader}>
                  <Text style={styles.locationIcon}>{getLocationIcon(selectedLocation.type)}</Text>
                  <Text style={styles.locationName}>{selectedLocation.name}</Text>
                  <Text style={styles.locationType}>{selectedLocation.type}</Text>
                </View>

                {selectedLocation.description && (
                  <Text style={styles.description}>{selectedLocation.description}</Text>
                )}

                {selectedLocation.dangerLevel && (
                  <View style={styles.dangerRow}>
                    <Text style={styles.dangerLabel}>{t('map.dangerLevel')}:</Text>
                    <View
                      style={[
                        styles.dangerBadge,
                        { backgroundColor: getDangerColor(selectedLocation.dangerLevel) },
                      ]}
                    >
                      <Text style={styles.dangerText}>
                        {t(`map.danger.${selectedLocation.dangerLevel}`)}
                      </Text>
                    </View>
                  </View>
                )}

                <View style={styles.detailActions}>
                  {canTravelTo(selectedLocation) && (
                    <TouchableOpacity
                      style={[styles.actionButton, styles.travelButton]}
                      onPress={handleTravelPress}
                    >
                      <Text style={styles.actionButtonText}>{t('map.travelTo')}</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    style={[styles.actionButton, styles.closeButton]}
                    onPress={() => setSelectedLocation(null)}
                  >
                    <Text style={styles.actionButtonText}>{t('common.close')}</Text>
                  </TouchableOpacity>
                </View>
              </LinearGradient>
            </Animated.View>
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  titleContainer: {
    marginBottom: 8,
  },
  regionTitle: {
    color: COLORS.primary,
    fontSize: 18,
    fontFamily: FONTS.title,
    textAlign: 'center',
    textShadowColor: COLORS.primary,
    textShadowRadius: 4,
  },
  mapContainer: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(247,207,70,0.3)',
  },
  mapGradient: {
    flex: 1,
    position: 'relative',
  },
  nodePositioner: {
    position: 'absolute',
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fogOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 80,
    height: 80,
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fogText: {
    color: '#555',
    fontSize: 32,
    fontFamily: FONTS.title,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 12,
    gap: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    color: COLORS.textDim,
    fontSize: 11,
    fontFamily: FONTS.body,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  detailCard: {
    width: '85%',
    borderRadius: 16,
    overflow: 'hidden',
  },
  detailGradient: {
    padding: 20,
  },
  detailHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  locationIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  locationName: {
    color: COLORS.text,
    fontSize: 20,
    fontFamily: FONTS.title,
    textAlign: 'center',
  },
  locationType: {
    color: COLORS.textDim,
    fontSize: 12,
    fontFamily: FONTS.body,
    textTransform: 'capitalize',
    marginTop: 4,
  },
  description: {
    color: COLORS.textDim,
    fontSize: 13,
    fontFamily: FONTS.body,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 20,
  },
  dangerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    gap: 8,
  },
  dangerLabel: {
    color: COLORS.textDim,
    fontFamily: FONTS.body,
    fontSize: 13,
  },
  dangerBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  dangerText: {
    color: '#fff',
    fontFamily: FONTS.bodyBold,
    fontSize: 11,
    textTransform: 'uppercase',
  },
  detailActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  travelButton: {
    backgroundColor: 'rgba(76,175,80,0.3)',
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  closeButton: {
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  actionButtonText: {
    color: COLORS.text,
    fontFamily: FONTS.bodyBold,
    fontSize: 14,
  },
  connectionLine: {
    position: 'absolute',
    height: 2,
    backgroundColor: 'rgba(100,100,120,0.5)',
  },
});
