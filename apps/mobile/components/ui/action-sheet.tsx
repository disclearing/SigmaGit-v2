import { useState } from "react";
import {
  View,
  Text,
  Modal,
  Pressable,
  TouchableWithoutFeedback,
  StyleSheet,
  useWindowDimensions,
} from "react-native";

export interface ActionSheetOption {
  label: string;
  onPress: () => void;
  destructive?: boolean;
}

interface ActionSheetProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  options: ActionSheetOption[];
}

export function ActionSheet({ visible, onClose, title, options }: ActionSheetProps) {
  const { height } = useWindowDimensions();

  return (
    <Modal visible={visible} transparent animationType="fade">
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={[StyleSheet.absoluteFill, styles.overlay]}>
          <TouchableWithoutFeedback>
            <View style={[styles.sheet, { maxHeight: height * 0.5 }]}>
              {title ? (
                <View className="py-3 px-4 border-b border-gray-700">
                  <Text className="text-base font-semibold text-white">{title}</Text>
                </View>
              ) : null}
              {options.map((opt, i) => (
                <Pressable
                  key={i}
                  onPress={() => {
                    opt.onPress();
                    onClose();
                  }}
                  className={`py-4 px-4 border-b border-gray-800 active:bg-white/5 ${i === options.length - 1 ? "border-b-0" : ""}`}
                >
                  <Text className={opt.destructive ? "text-red-400 font-medium" : "text-white font-medium"}>
                    {opt.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "rgb(30 30 40)",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    overflow: "hidden",
  },
});
