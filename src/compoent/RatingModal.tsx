import React, { memo, useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Platform,
  TouchableWithoutFeedback,
  Animated,
} from "react-native";
import font from "../theme/font";
import { color } from "../constant";
import Icon from "react-native-vector-icons/MaterialIcons";
import strings from "../localization/Localization";

interface RatingModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (rating: number, comment: string) => void | Promise<void>;
  isSubmitting?: boolean;
  title?: string;
  subtitle?: string;
}

const RatingModal = ({
  visible,
  onClose,
  onSubmit,
  isSubmitting = false,
  title = strings.RateYourDelivery,
  subtitle = strings.HowWasExperience,
}: RatingModalProps) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const RATING_LABELS = [
    strings.RatingPoor,
    strings.RatingFair,
    strings.RatingGood,
    strings.RatingGreat,
    strings.RatingExcellent
  ];

  useEffect(() => {
    if (!visible) {
      setRating(0);
      setComment("");
    }
  }, [visible]);

  const handleRatingPress = (index: number) => {
    setRating(index);
    // Pulse animation for feedback
    scaleAnim.setValue(0.8);
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 4,
      useNativeDriver: true,
    }).start();
  };

  const handleSubmit = () => {
    if (rating < 1) return;
    onSubmit(rating, comment);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={styles.backdrop} />
        </TouchableWithoutFeedback>
        <TouchableWithoutFeedback>
          <View style={styles.content}>
            <View style={styles.header}>
              <View style={styles.iconWrap}>
                <Icon name="stars" size={32} color={color.primary} />
              </View>
              <Text style={styles.title}>{title}</Text>
              <Text style={styles.subtitle}>{subtitle}</Text>
            </View>

            <View style={styles.starsSection}>
              <View style={styles.starsRow}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <TouchableOpacity
                    key={star}
                    onPress={() => handleRatingPress(star)}
                    style={styles.starTouch}
                    activeOpacity={0.7}
                  >
                    <Animated.View style={rating === star ? { transform: [{ scale: scaleAnim }] } : {}}>
                      <Icon
                        name={rating >= star ? "star" : "star-outline"}
                        size={48}
                        color={rating >= star ? color.primary : "#E2E8F0"}
                      />
                    </Animated.View>
                  </TouchableOpacity>
                ))}
              </View>
              <View style={styles.labelContainer}>
                {rating > 0 ? (
                  <Text style={styles.ratingLabel}>{RATING_LABELS[rating - 1]}</Text>
                ) : (
                  <Text style={styles.placeholderLabel}>{strings.TypeMessageHere}</Text>
                )}
              </View>
            </View>

            <View style={styles.commentSection}>
              <TextInput
                style={styles.commentInput}
                placeholder={strings.ShareExperiencePlaceholder}
                placeholderTextColor="#94A3B8"
                value={comment}
                onChangeText={setComment}
                multiline
                numberOfLines={3}
                maxLength={200}
              />
              <Text style={styles.charCount}>{comment.length}/200</Text>
            </View>

            <View style={styles.buttons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={onClose}
                activeOpacity={0.7}
              >
                <Text style={styles.cancelButtonText}>{strings.Cancel}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.submitButton,
                  rating < 1 && styles.submitButtonDisabled,
                ]}
                onPress={handleSubmit}
                disabled={rating < 1 || isSubmitting}
                activeOpacity={0.85}
              >
                <Text
                  style={[
                    styles.submitButtonText,
                    rating < 1 && styles.submitButtonTextDisabled,
                  ]}
                >
                  {isSubmitting ? strings.Processing : strings.Submit}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  content: {
    width: "100%",
    maxWidth: 360,
    backgroundColor: "#FFF",
    borderRadius: 24,
    padding: 24,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
      },
    }),
  },
  header: {
    alignItems: "center",
    marginBottom: 24,
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#FFF9E6",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontFamily: font.MonolithRegular,
    color: "#1C1C1C",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: font.MonolithRegular,
    color: "#666",
    textAlign: "center",
    lineHeight: 20,
  },
  starsSection: {
    marginBottom: 24,
  },
  starsRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 4,
  },
  starTouch: {
    padding: 4,
  },
  labelContainer: {
    height: 24,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 12,
  },
  ratingLabel: {
    fontSize: 16,
    fontFamily: font.MonolithRegular,
    color: color.primary,
  },
  placeholderLabel: {
    fontSize: 14,
    fontFamily: font.MonolithRegular,
    color: "#CBD5E1",
  },
  commentSection: {
    marginBottom: 24,
  },
  commentInput: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 16,
    padding: 16,
    fontSize: 15,
    fontFamily: font.MonolithRegular,
    color: "#1C1C1C",
    minHeight: 100,
    textAlignVertical: "top",
  },
  charCount: {
    fontSize: 12,
    fontFamily: font.MonolithRegular,
    color: "#94A3B8",
    textAlign: "right",
    marginTop: 8,
  },
  buttons: {
    flexDirection: "row",
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    height: 52,
    borderRadius: 16,
    backgroundColor: "#F1F5F9",
    justifyContent: "center",
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: 16,
    fontFamily: font.MonolithRegular,
    color: "#64748B",
  },
  submitButton: {
    flex: 1,
    height: 52,
    borderRadius: 16,
    backgroundColor: color.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  submitButtonDisabled: {
    backgroundColor: "#E2E8F0",
  },
  submitButtonText: {
    fontSize: 16,
    fontFamily: font.MonolithRegular,
    color: "#000",
  },
  submitButtonTextDisabled: {
    color: "#94A3B8",
  },
});

export default memo(RatingModal);

