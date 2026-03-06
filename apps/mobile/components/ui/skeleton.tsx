import { useEffect, useRef } from "react";
import { View, Animated, StyleSheet } from "react-native";

interface SkeletonProps {
  className?: string;
  width?: number | string;
  height?: number | string;
}

export function Skeleton({ className = "", width, height }: SkeletonProps) {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.6, duration: 600, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.3, duration: 600, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        styles.skeleton,
        width != null && { width: typeof width === "number" ? width : undefined },
        height != null && { height: typeof height === "number" ? height : undefined },
        { opacity },
      ]}
      className={className}
    />
  );
}

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 6,
    minHeight: 16,
  },
});
