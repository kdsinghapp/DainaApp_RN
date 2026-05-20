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

// ── App Theme ──────────────────────────────────────
const THEME = {
  primary: "#FFCC00",
  primaryDim: "rgba(255, 204, 0, 0.15)",
  bg: "#0E0D08",
  bgCard: "#161408",
  border: "#2E2800",
  borderLight: "#2A2200",
  textPrimary: "#FFCC00",
  textMuted: "#6B5C00",
  textFaint: "#3D3400",
};

const BLIP_POSITIONS = [
  { id: 1, dx: 0.52, dy: -0.38, delay: 800 },
  { id: 2, dx: -0.45, dy: 0.55, delay: 1600 },
  { id: 3, dx: 0.65, dy: 0.48, delay: 2400 },
];

// ── Blip ──────────────────────────────────────────
const Blip: React.FC<{ cx: number; cy: number; delay: number }> = ({ cx, cy, delay }) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(opacity, { toValue: 1, duration: 120, useNativeDriver: true }),
          Animated.timing(scale, { toValue: 1.4, duration: 120, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(opacity, { toValue: 0.7, duration: 500, useNativeDriver: true }),
          Animated.timing(scale, { toValue: 1, duration: 500, useNativeDriver: true }),
        ]),
        Animated.timing(opacity, { toValue: 0, duration: 1700, useNativeDriver: true }),
        Animated.delay(Math.max(0, 3000 - delay - 2340)),
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
        backgroundColor: THEME.primary,
        opacity,
        transform: [{ scale }],
        shadowColor: THEME.primary,
        shadowOpacity: 0.95,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 0 },
      }}
    />
  );
};

// ── Main Component ────────────────────────────────
interface RadarSearchScreenProps {
  driversFound?: number;
  radiusKm?: number;
  onCancel?: () => void;
}

const RadarSearchScreen: React.FC<RadarSearchScreenProps> = ({
  driversFound = 0,
  radiusKm = 1,
  onCancel,
}) => {
  const sweepAnim = useRef(new Animated.Value(0)).current;
  const pulse1 = useRef(new Animated.Value(0)).current;
  const pulse2 = useRef(new Animated.Value(0)).current;
  const pulse3 = useRef(new Animated.Value(0)).current;
  const centerPulse = useRef(new Animated.Value(1)).current;
  const fadeIn = useRef(new Animated.Value(0)).current;
  const scanBarAnim = useRef(new Animated.Value(0)).current;
  const dotBlink = useRef(new Animated.Value(1)).current;

  const [elapsed, setElapsed] = useState(0);
  const [scanPct, setScanPct] = useState(0);

  useEffect(() => {
    Animated.timing(fadeIn, { toValue: 1, duration: 700, useNativeDriver: true }).start();

    Animated.loop(
      Animated.timing(sweepAnim, { toValue: 1, duration: 3000, easing: Easing.linear, useNativeDriver: true })
    ).start();

    const startPulse = (anim: Animated.Value, delay: number) => {
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, { toValue: 1, duration: 2400, easing: Easing.out(Easing.quad), useNativeDriver: true }),
          Animated.timing(anim, { toValue: 0, duration: 0, useNativeDriver: true }),
        ])
      ).start();
    };
    startPulse(pulse1, 0);
    startPulse(pulse2, 800);
    startPulse(pulse3, 1600);

    Animated.loop(
      Animated.sequence([
        Animated.timing(centerPulse, { toValue: 1.4, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(centerPulse, { toValue: 1, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(dotBlink, { toValue: 0.2, duration: 600, useNativeDriver: true }),
        Animated.timing(dotBlink, { toValue: 1, duration: 600, useNativeDriver: true }),
      ])
    ).start();

    Animated.loop(
      Animated.timing(scanBarAnim, { toValue: 1, duration: 2200, easing: Easing.inOut(Easing.ease), useNativeDriver: false })
    ).start();

    const timer = setInterval(() => setElapsed((s) => s + 1), 1000);
    const scanTimer = setInterval(() => {
      setScanPct((p) => (p >= 97 ? 8 : Math.min(p + Math.floor(Math.random() * 18) + 6, 100)));
    }, 1100);

    return () => { clearInterval(timer); clearInterval(scanTimer); };
  }, []);

  const sweepRotate = sweepAnim.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] });

  const makePulseStyle = (anim: Animated.Value) => ({
    position: "absolute" as const,
    left: CX - R,
    top: CY - R,
    width: R * 2,
    height: R * 2,
    borderRadius: R,
    borderWidth: 1.5,
    borderColor: THEME.primary,
    opacity: anim.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0.8, 0.35, 0] }),
    transform: [{ scale: anim.interpolate({ inputRange: [0, 1], outputRange: [0.05, 1] }) }],
  });

  const scanBarWidth = scanBarAnim.interpolate({
    inputRange: [0, 0.45, 0.55, 1],
    outputRange: ["0%", "75%", "75%", "0%"],
  });

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={THEME.bg} />

      <Animated.View style={[styles.container, { opacity: fadeIn }]}>

        {/* ── HEADER ── */}
        <View style={styles.header}>
          <View style={styles.statusRow}>
            <Animated.View style={[styles.statusDot, { opacity: dotBlink }]} />
            <Text style={styles.statusText}>SCANNING</Text>
          </View>
          <View style={styles.radiusBadge}>
            <Text style={styles.radiusBadgeText}>RADIUS · {radiusKm} KM</Text>
          </View>
        </View>

        {/* ── RADAR ── */}
        <View style={[styles.radarWrap, { width: RADAR_SIZE, height: RADAR_SIZE }]}>

          {/* Base SVG: background + rings + crosshairs */}
          <Svg width={RADAR_SIZE} height={RADAR_SIZE} style={StyleSheet.absoluteFill}>
            <Defs>
              <RadialGradient id="bgGrad" cx="50%" cy="50%" r="50%">
                <Stop offset="0%" stopColor="#1A1600" stopOpacity="1" />
                <Stop offset="100%" stopColor="#090800" stopOpacity="1" />
              </RadialGradient>
              <ClipPath id="radarClip">
                <Circle cx={CX} cy={CY} r={R} />
              </ClipPath>
            </Defs>
            <Circle cx={CX} cy={CY} r={R} fill="url(#bgGrad)" stroke={THEME.border} strokeWidth="1.5" />
            {[0.25, 0.5, 0.75, 1].map((ratio, i) => (
              <Circle key={i} cx={CX} cy={CY} r={R * ratio} fill="none" stroke={THEME.borderLight} strokeWidth="0.8" />
            ))}
            <Line x1={8} y1={CY} x2={RADAR_SIZE - 8} y2={CY} stroke={THEME.borderLight} strokeWidth="0.8" />
            <Line x1={CX} y1={8} x2={CX} y2={RADAR_SIZE - 8} stroke={THEME.borderLight} strokeWidth="0.8" />
            <Line x1={CX - R * 0.72} y1={CY - R * 0.72} x2={CX + R * 0.72} y2={CY + R * 0.72} stroke="#1E1A00" strokeWidth="0.6" />
            <Line x1={CX + R * 0.72} y1={CY - R * 0.72} x2={CX - R * 0.72} y2={CY + R * 0.72} stroke="#1E1A00" strokeWidth="0.6" />
          </Svg>

          {/* Compass labels */}
          {[
            { label: "N", left: CX - 5, top: 4 },
            { label: "E", left: RADAR_SIZE - 14, top: CY - 7 },
            { label: "S", left: CX - 5, top: RADAR_SIZE - 18 },
            { label: "W", left: 4, top: CY - 7 },
          ].map(({ label, left, top }) => (
            <Text key={label} style={[styles.compassLabel, { left, top }]}>{label}</Text>
          ))}

          {/* Rotating sweep */}
          <Animated.View
            style={[
              styles.sweepWrap,
              { width: RADAR_SIZE, height: RADAR_SIZE, transform: [{ rotate: sweepRotate }] },
            ]}
          >
            <Svg width={RADAR_SIZE} height={RADAR_SIZE}>
              <Defs>
                <RadialGradient id="sweepGrad" cx="50%" cy="50%" r="50%">
                  <Stop offset="0%" stopColor="#FFCC00" stopOpacity="0.45" />
                  <Stop offset="100%" stopColor="#FFCC00" stopOpacity="0" />
                </RadialGradient>
                <ClipPath id="sweepClip">
                  <Circle cx={CX} cy={CY} r={R} />
                </ClipPath>
              </Defs>
              <G clipPath="url(#sweepClip)">
                <Path
                  d={`M${CX} ${CY} L${CX + R} ${CY} A${R} ${R} 0 0 0 ${CX} ${CY - R} Z`}
                  fill="url(#sweepGrad)"
                  opacity={0.8}
                />
                <Line x1={CX} y1={CY} x2={CX + R} y2={CY} stroke="#FFCC00" strokeWidth="2" opacity={1} />
              </G>
            </Svg>
          </Animated.View>

          {/* Pulse rings */}
          <Animated.View style={makePulseStyle(pulse1)} pointerEvents="none" />
          <Animated.View style={makePulseStyle(pulse2)} pointerEvents="none" />
          <Animated.View style={makePulseStyle(pulse3)} pointerEvents="none" />

          {/* Blips */}
          {BLIP_POSITIONS.map((b) => (
            <Blip key={b.id} cx={CX + b.dx * R} cy={CY + b.dy * R} delay={b.delay} />
          ))}

          {/* Center dot */}
          <Animated.View
            style={[styles.centerDot, { left: CX - 14, top: CY - 14, transform: [{ scale: centerPulse }] }]}
          >
            <View style={styles.centerDotCore} />
          </Animated.View>
        </View>

        {/* ── STATS ── */}
        <View style={styles.statsRow}>
          <View style={styles.statCol}>
            <Text style={styles.statVal}>{driversFound}</Text>
            <Text style={styles.statLabel}>DRIVERS</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCol}>
            <Text style={styles.statVal}>{radiusKm}<Text style={styles.statUnit}>km</Text></Text>
            <Text style={styles.statLabel}>RADIUS</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCol}>
            <Text style={styles.statVal}>{elapsed}<Text style={styles.statUnit}>s</Text></Text>
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
        <TouchableOpacity style={styles.cancelBtn} onPress={onCancel} activeOpacity={0.7}>
          <Text style={styles.cancelText}>CANCEL SEARCH</Text>
        </TouchableOpacity>

      </Animated.View>
    </SafeAreaView>
  );
};

export default RadarSearchScreen;

/* ── STYLES ────────────────────────────────────── */
const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: THEME.bg,
  },
  container: {
    flex: 1,
    backgroundColor: THEME.bg,
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
    backgroundColor: THEME.primary,
    shadowColor: THEME.primary,
    shadowOpacity: 1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 0 },
  },
  statusText: {
    color: THEME.primary,
    fontSize: 13,
    letterSpacing: 3,
    fontFamily: font.MonolithRegular

  },
  radiusBadge: {
    borderWidth: 1,
    borderColor: THEME.border,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
    backgroundColor: THEME.bgCard,
  },
  radiusBadgeText: {
    color: THEME.textMuted,
    fontSize: 11,
    fontFamily: Platform.OS === "ios" ? "Courier New" : "monospace",
    letterSpacing: 1.5,
  },

  // Radar wrapper
  radarWrap: {
    borderRadius: 999,
    overflow: "hidden",
    position: "relative",
    borderWidth: 1.5,
    borderColor: THEME.border,
    shadowColor: THEME.primary,
    shadowOpacity: 0.25,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 0 },
  },
  sweepWrap: {
    position: "absolute",
    top: 0,
    left: 0,
  },
  compassLabel: {
    position: "absolute",
    color: THEME.textFaint,
    fontSize: 10,
    fontFamily: Platform.OS === "ios" ? "Courier New" : "monospace",
  },

  // Center
  centerDot: {
    position: "absolute",
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: THEME.primaryDim,
    alignItems: "center",
    justifyContent: "center",
  },
  centerDotCore: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: THEME.primary,
    shadowColor: THEME.primary,
    shadowOpacity: 1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
  },

  // Stats
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    maxWidth: 320,
    backgroundColor: THEME.bgCard,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: THEME.border,
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
    backgroundColor: THEME.border,
  },
  statVal: {
    color: THEME.primary,
    fontSize: 24,
    fontFamily: font.MonolithRegular,

    letterSpacing: 1,
  },
  statUnit: {
    fontSize: 13,
    color: THEME.textMuted,
  },
  statLabel: {
    color: THEME.textFaint,
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
  },
  scanBarLabel: {
    color: THEME.textFaint,
    fontSize: 10,
    fontFamily: Platform.OS === "ios" ? "Courier New" : "monospace",
    letterSpacing: 2,
  },
  scanBarPct: {
    color: THEME.primary,
    fontSize: 11,
    fontFamily: Platform.OS === "ios" ? "Courier New" : "monospace",
  },
  scanBarTrack: {
    height: 3,
    backgroundColor: THEME.border,
    borderRadius: 2,
    overflow: "hidden",
  },
  scanBarFill: {
    height: "100%",
    backgroundColor: THEME.primary,
    borderRadius: 2,
    shadowColor: THEME.primary,
    shadowOpacity: 0.9,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 0 },
  },

  // Cancel
  cancelBtn: {
    borderWidth: 1,
    borderColor: THEME.border,
    borderRadius: 24,
    paddingVertical: 12,
    paddingHorizontal: 36,
    marginTop: 4,
    backgroundColor: THEME.bgCard,
  },
  cancelText: {
    color: THEME.textMuted,
    fontSize: 12,
    fontFamily: Platform.OS === "ios" ? "Courier New" : "monospace",
    letterSpacing: 3,
  },
});