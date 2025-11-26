import React, { useState, useCallback, useMemo } from 'react';
import { View, StyleSheet, Dimensions, ScrollView, TouchableOpacity, Text } from 'react-native';
import Animated, { FadeIn, FadeOut, SlideInDown, SlideOutDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

import { COLORS, FONTS } from '../../theme';
import {
  IDialogueTree,
  IDialogueNode,
  IDialogueOption,
  IDialogueState,
  IDialogueEffect,
  checkRequirements,
} from '../../types/dialogue';
import { NPCPortrait } from './NPCPortrait';
import { DialogueBox } from './DialogueBox';
import { DialogueOption } from './DialogueOption';

const { height } = Dimensions.get('window');

interface DialogueScreenProps {
  dialogueTree: IDialogueTree;
  playerData: {
    stats?: Record<string, number>;
    items?: string[];
    quests?: string[];
    completedQuests?: string[];
    gold?: number;
    reputation?: Record<string, number>;
    level?: number;
  };
  onDialogueEnd: (effects: IDialogueEffect[]) => void;
  onClose: () => void;
}

export const DialogueScreen: React.FC<DialogueScreenProps> = ({
  dialogueTree,
  playerData,
  onDialogueEnd,
  onClose,
}) => {
  // Build nodes map for quick lookup
  const nodesMap = useMemo(() => {
    const map: Record<string, IDialogueNode> = {};
    for (const node of dialogueTree.nodes) {
      map[node.id] = node;
    }
    return map;
  }, [dialogueTree.nodes]);

  const [currentNodeId, setCurrentNodeId] = useState(dialogueTree.startNode);
  const [dialogueState, setDialogueState] = useState<IDialogueState>({
    isActive: true,
    currentDialogueId: dialogueTree.id,
    currentNodeId: dialogueTree.startNode,
    history: [],
    variables: {},
  });
  const [accumulatedEffects, setAccumulatedEffects] = useState<IDialogueEffect[]>([]);
  const [isTextComplete, setIsTextComplete] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(true);

  const currentNode: IDialogueNode | undefined = useMemo(
    () => nodesMap[currentNodeId],
    [nodesMap, currentNodeId]
  );

  const availableOptions = useMemo(() => {
    if (!currentNode?.options) return [];

    return currentNode.options
      .filter((option) => !option.isHidden || checkRequirements(option.requirements, playerData))
      .map((option) => ({
        ...option,
        isAvailable: checkRequirements(option.requirements, playerData),
      }));
  }, [currentNode?.options, playerData]);

  const handleTextComplete = useCallback(() => {
    setIsTextComplete(true);
    setIsSpeaking(false);
  }, []);

  const handleOptionSelect = useCallback(
    (option: IDialogueOption) => {
      // Accumulate effects
      const newEffects = [...accumulatedEffects];
      if (option.effects) {
        newEffects.push(...option.effects);
      }

      // Check if dialogue should end
      if (option.targetNode === 'END' || !nodesMap[option.targetNode]) {
        setAccumulatedEffects(newEffects);
        onDialogueEnd(newEffects);
        return;
      }

      // Navigate to next node
      setCurrentNodeId(option.targetNode);
      setDialogueState((prev) => ({
        ...prev,
        currentNodeId: option.targetNode,
        history: [...prev.history, currentNodeId],
      }));
      setAccumulatedEffects(newEffects);
      setIsTextComplete(false);
      setIsSpeaking(true);
    },
    [nodesMap, accumulatedEffects, currentNodeId, onDialogueEnd]
  );

  const handleDialogueBoxTap = useCallback(() => {
    // Auto-advance if node has 'next' defined and no options
    const nextNodeId = currentNode?.next;
    if (
      isTextComplete &&
      nextNodeId &&
      (!currentNode?.options || currentNode.options.length === 0)
    ) {
      if (nextNodeId === 'END' || !nodesMap[nextNodeId]) {
        onDialogueEnd(accumulatedEffects);
      } else {
        setCurrentNodeId(nextNodeId);
        setDialogueState((prev) => ({
          ...prev,
          currentNodeId: nextNodeId,
          history: [...prev.history, currentNodeId],
        }));
        setIsTextComplete(false);
        setIsSpeaking(true);
      }
    } else if (isTextComplete && (!currentNode?.options || currentNode.options.length === 0)) {
      // End dialogue if no next and no options
      onDialogueEnd(accumulatedEffects);
    }
  }, [isTextComplete, currentNode, nodesMap, currentNodeId, accumulatedEffects, onDialogueEnd]);

  if (!currentNode) {
    return null;
  }

  return (
    <Animated.View
      entering={FadeIn.duration(300)}
      exiting={FadeOut.duration(300)}
      style={styles.container}
    >
      {/* Background overlay */}
      <BlurView intensity={20} style={StyleSheet.absoluteFill} />
      <View style={styles.overlay} />

      {/* Close button */}
      <TouchableOpacity style={styles.closeButton} onPress={onClose}>
        <Text style={styles.closeButtonText}>✕</Text>
      </TouchableOpacity>

      {/* NPC Portrait section */}
      <Animated.View entering={SlideInDown.delay(100).springify()} style={styles.portraitSection}>
        <NPCPortrait
          name={dialogueTree.npcName}
          emotion={currentNode.emotion}
          isSpeaking={isSpeaking}
          size='large'
          portraitUrl={dialogueTree.npcPortrait}
        />
      </Animated.View>

      {/* Dialogue content */}
      <Animated.View
        entering={SlideInDown.delay(200).springify()}
        exiting={SlideOutDown}
        style={styles.dialogueSection}
      >
        <LinearGradient
          colors={['rgba(0,0,0,0.8)', 'rgba(20,20,30,0.95)']}
          style={styles.dialogueContainer}
        >
          {/* Dialogue box */}
          <DialogueBox
            node={currentNode}
            npcName={dialogueTree.npcName}
            onTextComplete={handleTextComplete}
            onTap={handleDialogueBoxTap}
            showContinueIndicator={
              isTextComplete && (!currentNode.options || currentNode.options.length === 0)
            }
          />

          {/* Options */}
          {isTextComplete && currentNode.options && currentNode.options.length > 0 && (
            <Animated.View entering={FadeIn.delay(100)} style={styles.optionsContainer}>
              <ScrollView style={styles.optionsScroll} showsVerticalScrollIndicator={false}>
                {availableOptions.map((option, index) => (
                  <DialogueOption
                    key={option.id}
                    option={option}
                    index={index}
                    onSelect={handleOptionSelect}
                    isAvailable={option.isAvailable}
                  />
                ))}
              </ScrollView>
            </Animated.View>
          )}

          {/* Dialogue progress indicator */}
          <View style={styles.progressContainer}>
            <Text style={styles.progressText}>
              {dialogueState.history.length + 1} / {dialogueTree.nodes.length}
            </Text>
          </View>
        </LinearGradient>
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  closeButtonText: {
    color: COLORS.text,
    fontSize: 18,
    fontFamily: FONTS.body,
  },
  portraitSection: {
    alignItems: 'center',
    paddingTop: height * 0.1,
    paddingBottom: 20,
  },
  dialogueSection: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  dialogueContainer: {
    maxHeight: height * 0.55,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 40,
  },
  optionsContainer: {
    marginTop: 16,
    maxHeight: height * 0.25,
  },
  optionsScroll: {
    flexGrow: 0,
  },
  progressContainer: {
    position: 'absolute',
    bottom: 10,
    right: 20,
    opacity: 0.5,
  },
  progressText: {
    color: COLORS.textDim,
    fontSize: 12,
    fontFamily: FONTS.body,
  },
});

export default DialogueScreen;
