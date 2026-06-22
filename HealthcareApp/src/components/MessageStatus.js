import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View, Image } from 'react-native';
import { Svg, Path } from 'react-native-svg';

const AnimatedSvg = Animated.createAnimatedComponent(Svg);

const statusColors = {
  sent: '#8696A0',      // Gray check for sent
  delivered: '#8696A0',  // Gray check for delivered
  read: '#53BDEB',      // Blue check for read (WhatsApp blue)
};

export default function MessageStatus({ status = 'sent', iconSources = null }) {
  const scale = useRef(new Animated.Value(1)).current;
  const color = statusColors[status] || statusColors.sent;
  const showDouble = status !== 'sent';

  useEffect(() => {
    Animated.sequence([
      Animated.timing(scale, {
        toValue: 1.15,
        duration: 120,
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: 1,
        duration: 120,
        useNativeDriver: true,
      }),
    ]).start();
  }, [status, scale]);

  // If the caller provided image sources (require(...) results), prefer them.
  if (iconSources && iconSources[status]) {
    return (
      <Animated.View style={[styles.wrapper, { transform: [{ scale }] }]}>
        <Image source={iconSources[status]} style={styles.image} resizeMode="contain" />
      </Animated.View>
    );
  }

  return (
    <Animated.View style={[styles.wrapper, { transform: [{ scale }] }]}>
      <View style={styles.icon}>
        <AnimatedSvg width={18} height={14} viewBox="0 0 18 14" fill="none">
          <Path
            d="M1 8.2L5.6 12.8L17 1.4"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {showDouble && (
            <Path
              d="M1 5.8L5.6 10.4L9.5 6.5"
              stroke={color}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}
        </AnimatedSvg>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: 24,
    height: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 6,
  },
  icon: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: 18,
    height: 14,
  },
});
