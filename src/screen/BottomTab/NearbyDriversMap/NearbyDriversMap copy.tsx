import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, {
  Circle,
  Line,
  Defs,
  RadialGradient,
  Stop,
  ClipPath,
  G,
  Path,
} from "react-native-svg";
import font from "../../../theme/font";

const { width } = Dimensions.get("window");
const RADAR_SIZE = Math.min(width * 0.78, 300);
const CX = RADAR_SIZE / 2;
const CY = RADAR_SIZE / 2;
const R = RADAR_SIZE / 2 - 8;

// Blip positions (relative to radar center, normalized 0..1 within radius)
const BLIP_POSITIONS = [
  { id: 1, dx: 0.52, dy: -0.38, delay: 800 },
  { id: 2, dx: -0.45, dy: 0.55, delay: 1600 },
  { id: 3, dx: 0.65, dy: 0.48, delay: 2400 },
];

const AnimatedG = Animated.createAnimatedComponent(G);

interface BlipProps {
  cx: number;
  cy: number;
  delay: number;
  sweepAnim: Animated.Value;
}

const Blip: React.FC<BlipProps> = ({ cx, cy, delay, sweepAnim }) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(opacity, {
            toValue: 1,
            duration: 120,
            useNativeDriver: true,
          }),
          Animated.timing(scale, {
            toValue: 1.3,
            duration: 120,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(opacity, {
            toValue: 0.6,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(scale, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
        ]),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 1600,
          useNativeDriver: true,
        }),
        Animated.delay(3000 - delay - 2340),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  return (
    <Animated.View
      style={{
        position: "absolute",
        left: cx - 6,
        top: cy - 6,
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: "#00ff88",
        opacity,
        transform: [{ scale }],
        shadowColor: "#00ff88",
        shadowOpacity: 0.9,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 0 },
      }}
    />
  );
};

interface RadarSearchScreenProps {
  driversFound?: number;
  radiusKm?: number;
  onCancel?: () => void;
  onDriverFound?: () => void;
}

const RadarSearchScreen: React.FC<RadarSearchScreenProps> = ({
  driversFound = 0,
  radiusKm = 1,
  onCancel,
  onDriverFound,
}) => {
  const sweepAnim = useRef(new Animated.Value(0)).current;
  const pulse1 = useRef(new Animated.Value(0)).current;
  const pulse2 = useRef(new Animated.Value(0)).current;
  const pulse3 = useRef(new Animated.Value(0)).current;
  const centerPulse = useRef(new Animated.Value(1)).current;
  const fadeIn = useRef(new Animated.Value(0)).current;
  const scanBarAnim = useRef(new Animated.Value(0)).current;

  const [elapsed, setElapsed] = useState(0);
  const [liveDrivers, setLiveDrivers] = useState(driversFound);
  const [scanPct, setScanPct] = useState(0);

  useEffect(() => {
    // Fade in entrance
    Animated.timing(fadeIn, {
      toValue: 1,
      duration: 700,
      useNativeDriver: true,
    }).start();

    // Radar sweep rotation — 3s per full rotation
    Animated.loop(
      Animated.timing(sweepAnim, {
        toValue: 1,
        duration: 3000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    // Pulse rings — staggered outward
    const startPulseRing = (anim: Animated.Value, delay: number) => {
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, {
            toValue: 1,
            duration: 2400,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(anim, { toValue: 0, duration: 0, useNativeDriver: true }),
        ])
      ).start();
    };
    startPulseRing(pulse1, 0);
    startPulseRing(pulse2, 800);
    startPulseRing(pulse3, 1600);

    // Center dot pulse
    Animated.loop(
      Animated.sequence([
        Animated.timing(centerPulse, {
          toValue: 1.4,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(centerPulse, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Scanning bar
    Animated.loop(
      Animated.timing(scanBarAnim, {
        toValue: 1,
        duration: 2200,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: false,
      })
    ).start();

    // Elapsed timer
    const timer = setInterval(() => {
      setElapsed((s) => s + 1);
    }, 1000);

    // Simulate scan percentage
    const scanTimer = setInterval(() => {
      setScanPct((p) => {
        if (p >= 97) return 12;
        return Math.min(p + Math.floor(Math.random() * 18) + 6, 100);
      });
    }, 1100);

    return () => {
      clearInterval(timer);
      clearInterval(scanTimer);
    };
  }, []);

  const sweepRotate = sweepAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  const makePulseStyle = (anim: Animated.Value) => ({
    position: "absolute" as const,
    left: CX - R,
    top: CY - R,
    width: R * 2,
    height: R * 2,
    borderRadius: R,
    borderWidth: 1.5,
    borderColor: "#00ff88",
    opacity: anim.interpolate({ inputRange: [0, 0.4, 1], outputRange: [0.7, 0.4, 0] }),
    transform: [
      {
        scale: anim.interpolate({ inputRange: [0, 1], outputRange: [0.05, 1] }),
      },
    ],
  });

  const scanBarWidth = scanBarAnim.interpolate({
    inputRange: [0, 0.4, 0.6, 1],
    outputRange: ["0%", "60%", "60%", "0%"],
  });

  const rings = [0.25, 0.5, 0.75, 1];

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor="#080d0b" />
      <Animated.View style={[styles.container, { opacity: fadeIn }]}>

        {/* ── HEADER ── */}
        <View style={styles.header}>
          <View style={styles.statusRow}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>SCANNING</Text>
          </View>
          <View style={styles.radiusBadge}>
            <Text style={styles.radiusBadgeText}>RADIUS: {radiusKm} KM</Text>
          </View>
        </View>

        {/* ── RADAR ── */}
        <View style={[styles.radarWrap, { width: RADAR_SIZE, height: RADAR_SIZE }]}>

          {/* SVG base — rings, crosshairs */}
          <Svg width={RADAR_SIZE} height={RADAR_SIZE} style={StyleSheet.absoluteFill}>
            <Defs>
              <RadialGradient id="bgGrad" cx="50%" cy="50%" r="50%">
                <Stop offset="0%" stopColor="#0d2318" stopOpacity="1" />
                <Stop offset="100%" stopColor="#070c0a" stopOpacity="1" />
              </RadialGradient>
              <ClipPath id="radarClip">
                <Circle cx={CX} cy={CY} r={R} />
              </ClipPath>
            </Defs>

            {/* Background */}
            <Circle cx={CX} cy={CY} r={R} fill="url(#bgGrad)" stroke="#1a2e24" strokeWidth="1.5" />

            {/* Rings */}
            {rings.map((ratio, i) => (
              <Circle
                key={i}
                cx={CX}
                cy={CY}
                r={R * ratio}
                fill="none"
                stroke="#1e3d2e"
                strokeWidth="0.8"
              />
            ))}

            {/* Crosshairs */}
            <Line x1={8} y1={CY} x2={RADAR_SIZE - 8} y2={CY} stroke="#1e3d2e" strokeWidth="0.8" />
            <Line x1={CX} y1={8} x2={CX} y2={RADAR_SIZE - 8} stroke="#1e3d2e" strokeWidth="0.8" />
            <Line
              x1={CX - R * 0.72} y1={CY - R * 0.72}
              x2={CX + R * 0.72} y2={CY + R * 0.72}
              stroke="#152d21" strokeWidth="0.6"
            />
            <Line
              x1={CX + R * 0.72} y1={CY - R * 0.72}
              x2={CX - R * 0.72} y2={CY + R * 0.72}
              stroke="#152d21" strokeWidth="0.6"
            />

            {/* Compass labels */}
            {[
              { label: "N", x: CX, y: 16 },
              { label: "E", x: RADAR_SIZE - 10, y: CY + 4 },
              { label: "S", x: CX, y: RADAR_SIZE - 6 },
              { label: "W", x: 10, y: CY + 4 },
            ].map(({ label, x, y }) => (
              <Text
                key={label}
                style={[
                  styles.compassLabel,
                  { position: "absolute", left: x - 6, top: y - 10 },
                ]}
              >
                {label}
              </Text>
            ))}
          </Svg>

          {/* Sweep — Animated.View rotating over radar */}
          <Animated.View
            style={[
              styles.sweepWrap,
              {
                width: RADAR_SIZE,
                height: RADAR_SIZE,
                transform: [{ rotate: sweepRotate }],
              },
            ]}
          >
            <Svg width={RADAR_SIZE} height={RADAR_SIZE}>
              <Defs>
                <RadialGradient id="sweepGrad" cx="50%" cy="50%" r="50%">
                  <Stop offset="0%" stopColor="#00ff88" stopOpacity="0.4" />
                  <Stop offset="100%" stopColor="#00ff88" stopOpacity="0" />
                </RadialGradient>
                <ClipPath id="sweepClip">
                  <Circle cx={CX} cy={CY} r={R} />
                </ClipPath>
              </Defs>
              <G clipPath="url(#sweepClip)">
                {/* Sweep wedge: right side of center → top */}
                <Path
                  d={`M${CX} ${CY} L${CX + R} ${CY} A${R} ${R} 0 0 0 ${CX} ${CY - R} Z`}
                  fill="url(#sweepGrad)"
                  opacity={0.75}
                />
                {/* Leading edge line */}
                <Line
                  x1={CX}
                  y1={CY}
                  x2={CX + R}
                  y2={CY}
                  stroke="#00ff88"
                  strokeWidth="1.8"
                  opacity={0.95}
                />
              </G>
            </Svg>
          </Animated.View>

          {/* Pulse rings */}
          <Animated.View style={makePulseStyle(pulse1)} pointerEvents="none" />
          <Animated.View style={makePulseStyle(pulse2)} pointerEvents="none" />
          <Animated.View style={makePulseStyle(pulse3)} pointerEvents="none" />

          {/* Blips */}
          {BLIP_POSITIONS.map((b) => (
            <Blip
              key={b.id}
              cx={CX + b.dx * R}
              cy={CY + b.dy * R}
              delay={b.delay}
              sweepAnim={sweepAnim}
            />
          ))}

          {/* Center dot */}
          <Animated.View
            style={[
              styles.centerDot,
              {
                left: CX - 14,
                top: CY - 14,
                transform: [{ scale: centerPulse }],
              },
            ]}
          >
            <View style={styles.centerDotInner} />
          </Animated.View>
        </View>

        {/* ── STATS ROW ── */}
        <View style={styles.statsRow}>
          <View style={styles.statCol}>
            <Text style={styles.statVal}>{liveDrivers}</Text>
            <Text style={styles.statLabel}>DRIVERS</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCol}>
            <Text style={styles.statVal}>
              {radiusKm}
              <Text style={styles.statUnit}>km</Text>
            </Text>
            <Text style={styles.statLabel}>RADIUS</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCol}>
            <Text style={styles.statVal}>
              {elapsed}
              <Text style={styles.statUnit}>s</Text>
            </Text>
            <Text style={styles.statLabel}>ELAPSED</Text>
          </View>
        </View>

        {/* ── SCAN BAR ── */}
        <View style={styles.scanBarWrap}>
          <View style={styles.scanBarMeta}>
            <Text style={styles.scanBarLabel}>SCANNING AREA</Text>
            <Text style={styles.scanBarPct}>{scanPct}%</Text>
          </View>
          <View style={styles.scanBarTrack}>
            <Animated.View style={[styles.scanBarFill, { width: scanBarWidth }]} />
          </View>
        </View>

        {/* ── CANCEL ── */}
        <TouchableOpacity
          style={styles.cancelBtn}
          onPress={onCancel}
          activeOpacity={0.7}
        >
          <Text style={styles.cancelText}>CANCEL SEARCH</Text>
        </TouchableOpacity>
      </Animated.View>
    </SafeAreaView>
  );
};

export default RadarSearchScreen;

/* ── STYLES ── */
const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#080d0b",
  },
  container: {
    flex: 1,
    backgroundColor: "#080d0b",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    gap: 28,
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    maxWidth: 340,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#00ff88",
    shadowColor: "#00ff88",
    shadowOpacity: 1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 0 },
  },
  statusText: {
    color: "#00ff88",
    fontSize: 13,
    letterSpacing: 3,
    fontFamily: font.MonolithRegular

  },
  radiusBadge: {
    borderWidth: 1,
    borderColor: "#1e3d2e",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  radiusBadgeText: {
    color: "#3a6050",
    fontSize: 11,
    fontFamily: Platform.OS === "ios" ? "Courier New" : "monospace",
    letterSpacing: 1.5,
  },

  // Radar
  radarWrap: {
    borderRadius: 999,
    overflow: "hidden",
    position: "relative",
  },
  sweepWrap: {
    position: "absolute",
    top: 0,
    left: 0,
  },
  compassLabel: {
    color: "#2a4a38",
    fontSize: 10,
    fontFamily: Platform.OS === "ios" ? "Courier New" : "monospace",
    position: "absolute",
  },

  // Pulse rings
  pulseRing: {
    position: "absolute",
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: "#00ff88",
  },

  // Center dot
  centerDot: {
    position: "absolute",
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(0, 255, 136, 0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  centerDotInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#00ff88",
    shadowColor: "#00ff88",
    shadowOpacity: 1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
  },

  // Stats
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    maxWidth: 320,
    backgroundColor: "#0d1a14",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#1a2e24",
    paddingVertical: 16,
    paddingHorizontal: 8,
  },
  statCol: {
    flex: 1,
    alignItems: "center",
    gap: 4,
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: "#1a2e24",
  },
  statVal: {
    color: "#00ff88",
    fontSize: 24,
    fontFamily: font.MonolithRegular
    ,
    letterSpacing: 1,
  },
  statUnit: {
    fontSize: 14,
    color: "#3a6050",
  },
  statLabel: {
    color: "#2a4a38",
    fontSize: 10,
    fontFamily: Platform.OS === "ios" ? "Courier New" : "monospace",
    letterSpacing: 2,
  },

  // Scan bar
  scanBarWrap: {
    width: "100%",
    maxWidth: 320,
    gap: 8,
  },
  scanBarMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  scanBarLabel: {
    color: "#2a4a38",
    fontSize: 10,
    fontFamily: Platform.OS === "ios" ? "Courier New" : "monospace",
    letterSpacing: 2,
  },
  scanBarPct: {
    color: "#00ff88",
    fontSize: 11,
    fontFamily: Platform.OS === "ios" ? "Courier New" : "monospace",
    letterSpacing: 1,
  },
  scanBarTrack: {
    height: 3,
    backgroundColor: "#1a2e24",
    borderRadius: 2,
    overflow: "hidden",
  },
  scanBarFill: {
    height: "100%",
    backgroundColor: "#00ff88",
    borderRadius: 2,
    shadowColor: "#00ff88",
    shadowOpacity: 0.8,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 0 },
  },

  // Cancel
  cancelBtn: {
    borderWidth: 1,
    borderColor: "#1e3d2e",
    borderRadius: 24,
    paddingVertical: 12,
    paddingHorizontal: 36,
    marginTop: 4,
  },
  cancelText: {
    color: "#3a6050",
    fontSize: 12,
    fontFamily: Platform.OS === "ios" ? "Courier New" : "monospace",
    letterSpacing: 3,
  },
});