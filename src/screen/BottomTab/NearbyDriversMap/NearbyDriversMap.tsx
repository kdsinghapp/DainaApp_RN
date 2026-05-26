// import React, { useEffect, useRef, useState } from "react";
// import {
//   View,
//   Text,
//   StyleSheet,
//   Animated,
//   Easing,
//   TouchableOpacity,
//   Dimensions,
//   StatusBar,
//   Platform,
// } from "react-native";
// import { SafeAreaView } from "react-native-safe-area-context";
// import Svg, {
//   Circle,
//   Line,
//   Defs,
//   RadialGradient,
//   Stop,
//   ClipPath,
//   G,
//   Path,
// } from "react-native-svg";
// import MapView  from 'react-native-maps';
// import Geolocation from '@react-native-community/geolocation';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import { useNavigation, useRoute } from '@react-navigation/native';
// import ScreenNameEnum from "../../../routes/screenName.enum";
// import { WebSocket_Url } from "../../../Api";
// import font from "../../../theme/font";
// import StatusBarComponent from "../../../compoent/StatusBarCompoent";
// import CustomHeader from "../../../compoent/CustomHeader";
// const { width } = Dimensions.get("window");
// const RADAR_SIZE = Math.min(width * 0.75, 280);
// const CX = RADAR_SIZE / 2;
// const CY = RADAR_SIZE / 2;
// const R = RADAR_SIZE / 2 - 6;

// // ── Theme ─────────────────────────────────────────
// const T = {
//   primary: "#FFCC00",
//   primaryLight: "#FFF8D0",
//   primaryBorder: "#F0E8CC",
//   primaryDim: "rgba(255,204,0,0.18)",
//   primaryText: "#FFCC00",
//   bg: "#FFFDF5",
//   bgCard: "#FFFFFF",
//   bgHeader: "white",
//   textDark: "#1A1200",
//   textMid: "black",
//   textFaint: "#FFCC00",
//   border: "#FFCC00",
// };

// // Blips — normalized position within radius
// const BLIPS = [
//   { id: 1, dx: 0.52, dy: -0.40, delay: 800 },
//   { id: 2, dx: -0.44, dy: 0.55, delay: 1700 },
//   { id: 3, dx: 0.62, dy: 0.46, delay: 2500 },
// ];

// // ── Blip component ────────────────────────────────
// const Blip: React.FC<{ cx: number; cy: number; delay: number }> = ({ cx, cy, delay }) => {
//   const opacity = useRef(new Animated.Value(0)).current;
//   const scale = useRef(new Animated.Value(0.3)).current;
//   const ring = useRef(new Animated.Value(0)).current;

//   useEffect(() => {
//     const loop = Animated.loop(
//       Animated.sequence([
//         Animated.delay(delay),
//         Animated.parallel([
//           Animated.timing(opacity, { toValue: 1, duration: 130, useNativeDriver: true }),
//           Animated.timing(scale, { toValue: 1.35, duration: 130, useNativeDriver: true }),
//           Animated.timing(ring, { toValue: 1, duration: 900, useNativeDriver: true }),
//         ]),
//         Animated.parallel([
//           Animated.timing(opacity, { toValue: 0.75, duration: 500, useNativeDriver: true }),
//           Animated.timing(scale, { toValue: 1, duration: 500, useNativeDriver: true }),
//         ]),
//         Animated.timing(opacity, { toValue: 0, duration: 1800, useNativeDriver: true }),
//         Animated.timing(ring, { toValue: 0, duration: 0, useNativeDriver: true }),
//         Animated.delay(Math.max(0, 3000 - delay - 2430)),
//       ])
//     );
//     loop.start();
//     return () => loop.stop();
//   }, []);

//   return (
//     <>
//       {/* Ring pulse */}
//       <Animated.View
//         pointerEvents="none"
//         style={{
//           position: "absolute",
//           left: cx - 10,
//           top: cy - 10,
//           width: 20,
//           height: 20,
//           borderRadius: 10,
//           borderWidth: 1.5,
//           borderColor: T.primary,
//           opacity: ring.interpolate({ inputRange: [0, 1], outputRange: [0.6, 0] }),
//           transform: [{ scale: ring.interpolate({ inputRange: [0, 1], outputRange: [1, 2.6] }) }],
//         }}
//       />
//       {/* Dot */}
//       <Animated.View
//         style={{
//           position: "absolute",
//           left: cx - 5,
//           top: cy - 5,
//           width: 10,
//           height: 10,
//           borderRadius: 5,
//           backgroundColor: T.primary,
//           borderWidth: 1.5,
//           borderColor: T.primaryText,
//           opacity,
//           transform: [{ scale }],
//           shadowColor: T.primary,
//           shadowOpacity: 0.8,
//           shadowRadius: 6,
//           shadowOffset: { width: 0, height: 0 },
//           elevation: 5,
//         }}
//       />
//     </>
//   );
// };
// const ACCEPT_TIMEOUT_SEC = 30;

// // ── Main ──────────────────────────────────────────
// interface RadarSearchScreenProps {
//   driversFound?: number;
//   radiusKm?: number;
//   pickupAddress?: string;
//   onCancel?: () => void;
// }

// const RadarSearchScreen: React.FC<RadarSearchScreenProps> = ({
//   driversFound = 0,
//   radiusKm = 1,
//   pickupAddress = "Sapphire House, Indore",
//   onCancel,
// }) => {
//   const sweepAnim = useRef(new Animated.Value(0)).current;
//   const pulse1 = useRef(new Animated.Value(0)).current;
//   const pulse2 = useRef(new Animated.Value(0)).current;
//   const pulse3 = useRef(new Animated.Value(0)).current;
//   const centerScale = useRef(new Animated.Value(1)).current;
//   const fadeIn = useRef(new Animated.Value(0)).current;
//   const scanBarAnim = useRef(new Animated.Value(0)).current;
//   const dotBlink = useRef(new Animated.Value(1)).current;


//   const [driverStatus, setDriverStatus] = useState('Searching for available drivers...');
//   const [statusDetails, setStatusDetails] = useState('Connecting to delivery network');
//   const [isConnected, setIsConnected] = useState(false);
//   const [error, setError] = useState<string | null>(null);
//   const [retryCount, setRetryCount] = useState(0);
//   const [timeoutReached, setTimeoutReached] = useState(false);
//   const [secondsLeft, setSecondsLeft] = useState(ACCEPT_TIMEOUT_SEC);
//   const [currentRegion, setCurrentRegion] = useState({
//     latitude: 28.6139,
//     longitude: 77.209,
//     latitudeDelta: 0.02,
//     longitudeDelta: 0.02,
//   });
//   const spinValue = useRef(new Animated.Value(0)).current;
//   const fadeAnim = useRef(new Animated.Value(0)).current;
//   const progressAnim = useRef(new Animated.Value(0)).current;
//   const mapRef = useRef<MapView>(null);
//   const socketRef = useRef<WebSocket | null>(null);
//   const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
//   const countdownRef = useRef<NodeJS.Timeout | null>(null);
//   const maxRetries = 5;

//   const route = useRoute();
//   const navigation = useNavigation<any>();
//   const { parcelId } = (route?.params as RouteParams) || {};

//   const updateStatusDetails = (status: string) => {
//     const statusMap: Record<string, string> = {
//       DRIVER_FOUND: 'Driver confirmed • Preparing pickup',
//       ON_THE_WAY: 'Driver en route • ETA calculating',
//       PICKED_UP: 'Parcel collected • In transit',
//       DELIVERED: 'Parcel delivered successfully',
//     };
//     setStatusDetails(statusMap[status] || 'Connecting to delivery network');
//   };

//   const clearCountdown = () => {
//     if (countdownRef.current) {
//       clearInterval(countdownRef.current);
//       countdownRef.current = null;
//     }
//   };

//   const connectSocket = async (token: string): Promise<void> => {
//     try {
//       if (!parcelId?.parcel?.id) {
//         throw new Error('Parcel ID not found');
//       }
// const wsUrl = `${WebSocket_Url}/parcel/${parcelId?.parcel?.id}?token=${token}&role=user`;
//       // const wsUrl = ` {WebSocket_Url}/parcel/${parcelId.parcel.id}?token=${token}&role=user`;
//       // const wsUrl = `wss://aitechnotech.in/DAINA/ws/parcel/${parcelId.parcel.id}?token=${token}&role=user`;
//       const ws = new WebSocket(wsUrl);
//       ws.onopen = () => {
//         setIsConnected(true);
//         setError(null);
//         setRetryCount(0);
//         socketRef.current = ws;
//       };

//       ws.onmessage = (event) => {
//         try {
//           const data: WSMessage = JSON.parse(event.data);

//           if (data?.type === 'offers_update') {
//             clearCountdown();
//             navigation.replace(ScreenNameEnum.OfferOR, {
//               Parcelid: data.offers,
//               id: parcelId,
//             });
//             return;
//           }

//           if (data?.status) {
//             setDriverStatus(data.status);
//             updateStatusDetails(data.status);
//           }
//         } catch (e) {
//           console.warn('Failed to parse message:', e);
//         }
//       };

//       ws.onerror = () => {
//         setIsConnected(false);
//         setError('Connection error. Retrying...');
//       };

//       ws.onclose = () => {
//         setIsConnected(false);
//         if (retryCount < maxRetries) {
//           reconnectTimeoutRef.current = setTimeout(() => {
//             setRetryCount((prev) => prev + 1);
//             handleReconnect();
//           }, Math.min(1000 * Math.pow(2, retryCount), 10000));
//         } else {
//           setError('Connection failed. Please try again.');
//         }
//       };

//       socketRef.current = ws;
//     } catch (err) {
//       setError('Failed to connect. Please check your internet.');
//     }
//   };

//   const handleReconnect = async () => {
//     try {
//       const token = await AsyncStorage.getItem('token');
//       if (token) await connectSocket(token);
//     } catch (_) { }
//   };

//   const handleRetry = () => {
//     setRetryCount(0);
//     setError(null);
//     setTimeoutReached(false);
//     setSecondsLeft(ACCEPT_TIMEOUT_SEC);
//     progressAnim.setValue(0);
//     startProgressAnimation();
//     startCountdown();
//     handleReconnect();
//   };

//   const handleGoBack = () => {
//     clearCountdown();
//     if (navigation.canGoBack()) {
//       navigation.goBack();
//     } else {
//       navigation.replace(ScreenNameEnum.DashBoardScreen);
//     }
//   };

//   const startProgressAnimation = () => {
//     progressAnim.setValue(0);
//     Animated.timing(progressAnim, {
//       toValue: 1,
//       duration: ACCEPT_TIMEOUT_SEC * 1000,
//       easing: Easing.linear,
//       useNativeDriver: false,
//     }).start(({ finished }) => {
//       if (finished) setTimeoutReached(true);
//     });
//   };

//   const startCountdown = () => {
//     clearCountdown();
//     let s = ACCEPT_TIMEOUT_SEC;
//     setSecondsLeft(s);
//     countdownRef.current = setInterval(() => {
//       s -= 1;
//       setSecondsLeft(s);
//       if (s <= 0) clearCountdown();
//     }, 1000);
//   };

//   useEffect(() => {
//     Animated.loop(
//       Animated.timing(spinValue, {
//         toValue: 1,
//         duration: 2000,
//         easing: Easing.linear,
//         useNativeDriver: true,
//       })
//     ).start();

//     Animated.timing(fadeAnim, {
//       toValue: 1,
//       duration: 500,
//       useNativeDriver: true,
//     }).start();
//   }, []);

//   useEffect(() => {
//     Geolocation.getCurrentPosition(
//       (position) => {
//         const { latitude, longitude } = position.coords;
//         const region = {
//           latitude,
//           longitude,
//           latitudeDelta: 0.008,
//           longitudeDelta: 0.008,
//         };
//         setCurrentRegion(region);
//         setTimeout(() => {
//           mapRef.current?.animateToRegion(region, 1000);
//         }, 300);
//       },
//       () => { },
//       { enableHighAccuracy: true, timeout: 15000, maximumAge: 3000 }
//     );
//   }, []);

//   useEffect(() => {
//     let mounted = true;
//     const init = async () => {
//       try {
//         const token = await AsyncStorage.getItem('token');
//         if (!token) {
//           setError('Authentication token not found');
//           return;
//         }
//         if (mounted) {
//           await connectSocket(token);
//           startProgressAnimation();
//           startCountdown();
//         }
//       } catch (_) { }
//     };
//     init();
//     return () => {
//       mounted = false;
//       clearCountdown();
//       if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
//       socketRef.current?.close();
//       socketRef.current = null;
//     };
//   }, []);




//   const [elapsed, setElapsed] = useState(0);
//   const [scanPct, setScanPct] = useState(0);

//   useEffect(() => {
//     // Entrance
//     Animated.timing(fadeIn, { toValue: 1, duration: 600, useNativeDriver: true }).start();

//     // Sweep rotation
//     Animated.loop(
//       Animated.timing(sweepAnim, {
//         toValue: 1, duration: 3000,
//         easing: Easing.linear, useNativeDriver: true,
//       })
//     ).start();

//     // Pulse rings
//     const doPulse = (anim: Animated.Value, delay: number) =>
//       Animated.loop(
//         Animated.sequence([
//           Animated.delay(delay),
//           Animated.timing(anim, { toValue: 1, duration: 2400, easing: Easing.out(Easing.quad), useNativeDriver: true }),
//           Animated.timing(anim, { toValue: 0, duration: 0, useNativeDriver: true }),
//         ])
//       ).start();
//     doPulse(pulse1, 0);
//     doPulse(pulse2, 800);
//     doPulse(pulse3, 1600);

//     // Center pulse
//     Animated.loop(
//       Animated.sequence([
//         Animated.timing(centerScale, { toValue: 1.45, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
//         Animated.timing(centerScale, { toValue: 1, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
//       ])
//     ).start();

//     // Status dot blink
//     Animated.loop(
//       Animated.sequence([
//         Animated.timing(dotBlink, { toValue: 0.2, duration: 550, useNativeDriver: true }),
//         Animated.timing(dotBlink, { toValue: 1, duration: 550, useNativeDriver: true }),
//       ])
//     ).start();

//     // Scan bar shimmer
//     Animated.loop(
//       Animated.timing(scanBarAnim, {
//         toValue: 1, duration: 2200,
//         easing: Easing.inOut(Easing.ease), useNativeDriver: false,
//       })
//     ).start();

//     const timer = setInterval(() => setElapsed(s => s + 1), 1000);
//     const scanTick = setInterval(() =>
//       setScanPct(p => (p >= 97 ? 8 : Math.min(p + Math.floor(Math.random() * 18) + 6, 100))),
//       1100
//     );
//     return () => { clearInterval(timer); clearInterval(scanTick); };
//   }, []);

//   const sweepRotate = sweepAnim.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] });

//   const pulseStyle = (anim: Animated.Value) => ({
//     position: "absolute" as const,
//     left: CX - R, top: CY - R,
//     width: R * 2, height: R * 2, borderRadius: R,
//     borderWidth: 1.5, borderColor: T.primary,
//     opacity: anim.interpolate({ inputRange: [0, 0.25, 1], outputRange: [0.75, 0.35, 0] }),
//     transform: [{ scale: anim.interpolate({ inputRange: [0, 1], outputRange: [0.05, 1] }) }],
//   });

//   const scanFillWidth = scanBarAnim.interpolate({
//     inputRange: [0, 0.4, 0.6, 1],
//     outputRange: ["0%", "70%", "70%", "0%"],
//   });

//   return (
//     <SafeAreaView style={s.safe}>
//       <StatusBarComponent />
//       <CustomHeader label="Finding Driver" />

//       {/* ── YELLOW HEADER ── */}


//       {/* ── BODY ── */}
//       <Animated.View style={[s.body, { opacity: fadeIn }]}>

//         {/* ── RADAR ── */}
//         <View style={[s.radarWrap, { width: RADAR_SIZE, height: RADAR_SIZE }]}>

//           {/* Static rings */}
//           <Svg width={RADAR_SIZE} height={RADAR_SIZE} style={StyleSheet.absoluteFill}>
//             <Defs>
//               <RadialGradient id="radarBg" cx="50%" cy="50%" r="50%">
//                 <Stop offset="0%" stopColor="#FFFCE8" stopOpacity="1" />
//                 <Stop offset="100%" stopColor="#FFF5C0" stopOpacity="1" />
//               </RadialGradient>
//               <ClipPath id="rc"><Circle cx={CX} cy={CY} r={R} /></ClipPath>
//             </Defs>
//             <Circle cx={CX} cy={CY} r={R} fill="url(#radarBg)" stroke={T.border} strokeWidth="1.5" />
//             {[0.25, 0.5, 0.75, 1].map((ratio, i) => (
//               <Circle key={i} cx={CX} cy={CY} r={R * ratio} fill="none" stroke={T.border} strokeWidth="0.8" />
//             ))}
//             <Line x1={6} y1={CY} x2={RADAR_SIZE - 6} y2={CY} stroke={T.border} strokeWidth="0.8" />
//             <Line x1={CX} y1={6} x2={CX} y2={RADAR_SIZE - 6} stroke={T.border} strokeWidth="0.8" />
//             <Line x1={CX - R * 0.71} y1={CY - R * 0.71} x2={CX + R * 0.71} y2={CY + R * 0.71} stroke="#F5ECC0" strokeWidth="0.6" />
//             <Line x1={CX + R * 0.71} y1={CY - R * 0.71} x2={CX - R * 0.71} y2={CY + R * 0.71} stroke="#F5ECC0" strokeWidth="0.6" />
//           </Svg>

//           {/* Compass labels */}
//           {[
//             { l: "N", left: CX - 5, top: 4 },
//             { l: "E", left: RADAR_SIZE - 13, top: CY - 7 },
//             { l: "S", left: CX - 5, top: RADAR_SIZE - 17 },
//             { l: "W", left: 4, top: CY - 7 },
//           ].map(({ l, left, top }) => (
//             <Text key={l} style={[s.compass, { left, top }]}>{l}</Text>
//           ))}

//           {/* Sweep */}
//           <Animated.View
//             style={[s.sweepWrap, { width: RADAR_SIZE, height: RADAR_SIZE, transform: [{ rotate: sweepRotate }] }]}
//           >
//             <Svg width={RADAR_SIZE} height={RADAR_SIZE}>
//               <Defs>
//                 <RadialGradient id="sweepG" cx="50%" cy="50%" r="50%">
//                   <Stop offset="0%" stopColor="#FFCC00" stopOpacity="0.55" />
//                   <Stop offset="100%" stopColor="#FFCC00" stopOpacity="0" />
//                 </RadialGradient>
//                 <ClipPath id="sc"><Circle cx={CX} cy={CY} r={R} /></ClipPath>
//               </Defs>
//               <G clipPath="url(#sc)">
//                 <Path
//                   d={`M${CX} ${CY} L${CX + R} ${CY} A${R} ${R} 0 0 0 ${CX} ${CY - R} Z`}
//                   fill="url(#sweepG)" opacity={0.9}
//                 />
//                 <Line x1={CX} y1={CY} x2={CX + R} y2={CY}
//                   stroke="#FFCC00" strokeWidth="2" opacity={1} />
//               </G>
//             </Svg>
//           </Animated.View>

//           {/* Pulse rings */}
//           <Animated.View style={pulseStyle(pulse1)} pointerEvents="none" />
//           <Animated.View style={pulseStyle(pulse2)} pointerEvents="none" />
//           <Animated.View style={pulseStyle(pulse3)} pointerEvents="none" />

//           {/* Blips */}
//           {BLIPS.map(b => (
//             <Blip key={b.id} cx={CX + b.dx * R} cy={CY + b.dy * R} delay={b.delay} />
//           ))}

//           {/* Center */}
//           <Animated.View
//             style={[s.centerDot, { left: CX - 14, top: CY - 14, transform: [{ scale: centerScale }] }]}
//           >
//             <View style={s.centerCore} />
//           </Animated.View>
//         </View>

//         {/* ── STATS CARD ── */}
//         <View style={s.statsCard}>
//           <View style={s.statCol}>
//             <Text style={s.statVal}>{driversFound || 2}</Text>
//             <Text style={s.statLbl}>DRIVERS</Text>
//           </View>
//           <View style={s.statDiv} />
//           <View style={s.statCol}>
//             <Text style={s.statVal}>{radiusKm}km</Text>
//             <Text style={s.statLbl}>RADIUS</Text>
//           </View>
//           <View style={s.statDiv} />

//         </View>

//         {/* ── SCAN BAR ── */}
//         <View style={s.scanWrap}>
//           <View style={s.scanMeta}>
//             <Text style={s.scanLbl}>SCANNING AREA</Text>
//             <Text style={s.scanPct}>{scanPct}%</Text>
//           </View>
//           <View style={s.scanTrack}>
//             <Animated.View style={[s.scanFill, { width: scanFillWidth }]} />
//           </View>
//         </View>

//         {/* ── CANCEL ── */}
//         <TouchableOpacity style={s.cancelBtn} onPress={onCancel} activeOpacity={0.7}>
//           <Text style={s.cancelTxt}>CANCEL SEARCH</Text>
//         </TouchableOpacity>

//       </Animated.View>
//     </SafeAreaView>
//   );
// };

// export default RadarSearchScreen;

// // ── StyleSheet ─────────────────────────────────────
// const s = StyleSheet.create({
//   safe: {
//     flex: 1,
//     backgroundColor: T.bgHeader,   // yellow SafeArea top
//   },

//   // Header
//   header: {
//     flexDirection: "row",
//     alignItems: "center",
//     backgroundColor: T.bgHeader,
//     paddingHorizontal: 16,
//     paddingTop: 8,
//     paddingBottom: 18,
//     gap: 12,
//   },
//   backBtn: {
//     width: 34, height: 34,
//     borderRadius: 17,
//     backgroundColor: "rgba(0,0,0,0.10)",
//     justifyContent: "center",
//     alignItems: "center",
//   },
//   backArrow: {
//     width: 0, height: 0,
//     borderTopWidth: 5, borderTopColor: "transparent",
//     borderBottomWidth: 5, borderBottomColor: "transparent",
//     borderRightWidth: 9, borderRightColor: T.textDark,
//     marginLeft: -2,
//   },
//   headerCenter: { flex: 1 },
//   headerTitle: {
//     fontSize: 16,
//     color: T.textDark,
//     letterSpacing: 0.3,
//     fontFamily: font.MonolithRegular
//   },
//   headerSub: {
//     fontSize: 11,
//     color: "rgba(26,18,0,0.55)",
//     marginTop: 2,
//     fontFamily: font.MonolithRegular

//   },
//   liveBadge: {
//     flexDirection: "row",
//     alignItems: "center",
//     gap: 5,
//     backgroundColor: "rgba(0,0,0,0.10)",
//     borderRadius: 20,
//     paddingHorizontal: 10,
//     paddingVertical: 5,
//   },
//   liveDot: {
//     width: 6, height: 6,
//     borderRadius: 3,
//     backgroundColor: T.textDark,
//   },
//   liveText: {
//     fontSize: 10,
//     fontFamily: font.MonolithRegular
//     ,
//     color: T.textDark,
//     letterSpacing: 1.5,
//   },

//   // Body
//   body: {
//     flex: 1,
//      alignItems: "center",
//     justifyContent: "center",
//     paddingHorizontal: 20,
//     gap: 22,
//     paddingVertical: 24,
//   },

//   // Radar
//   radarWrap: {
// borderRadius: 999,
// overflow: "hidden",
// position: "relative",
//  borderColor: "#76889A",

// // iOS Shadow
// shadowColor: T.primary,
// shadowOpacity: 0.25,
// shadowRadius: 10,
// shadowOffset: { width: 0, height: 4 },

// // Android Shadow
// elevation: 8,

//   },
//   sweepWrap: {
//     position: "absolute", top: 0, left: 0,
//   },
//   compass: {
//     position: "absolute",
//     color: T.textFaint,
//     fontSize: 9,
//       fontFamily: font.MonolithRegular,

//   },
//   centerDot: {
//     position: "absolute",
//     width: 28, height: 28, borderRadius: 14,
//     backgroundColor: T.primaryDim,
//     alignItems: "center", justifyContent: "center",
//   },
//   centerCore: {
//     width: 10, height: 10, borderRadius: 5,
//     backgroundColor: T.primary,
//     borderWidth: 1.5, borderColor: T.primaryText,
//     shadowColor: T.primary,
//     shadowOpacity: 0.9, shadowRadius: 8,
//     shadowOffset: { width: 0, height: 0 },
//   },

//   // Stats
//   statsCard: {
//     flexDirection: "row",
//     width: "100%",
//     maxWidth: 320,
//     backgroundColor: T.bgCard,
//     borderRadius: 16,
//     borderWidth: 1,
//     borderColor: T.border,
//     overflow: "hidden",
//     shadowColor: "#000",
//     shadowOpacity: 0.04,
//     shadowRadius: 8,
//     shadowOffset: { width: 0, height: 2 },
//   },
//   statCol: {
//     flex: 1, alignItems: "center",
//     paddingVertical: 14, paddingHorizontal: 8,
//   },
//   statDiv: {
//     width: 1, backgroundColor: T.border,
//     marginVertical: 10,
//   },
//   statVal: {
//     fontSize: 22,
//     fontFamily: font.MonolithRegular,

//     color: T.textDark, letterSpacing: 0.5,
//   },
//   statUnit: {
//     fontSize: 13,
//     color: T.primaryText,
//     fontFamily: font.MonolithRegular

//   },
//   statLbl: {
//     fontSize: 9, 
//     color: T.textMid,
//     letterSpacing: 1.8, marginTop: 3,
//     fontFamily: font.MonolithRegular

//   },

//   // Scan bar
//   scanWrap: { width: "100%", maxWidth: 320, gap: 7 },
//   scanMeta: { flexDirection: "row", justifyContent: "space-between" },
//   scanLbl: {
//     fontSize: 10, 
//     color: T.textMid, letterSpacing: 1.8,
//     fontFamily: font.MonolithRegular

//   },
//   scanPct: {
//     fontSize: 11,  
//     color: T.primary,
//     fontFamily: font.MonolithRegular

//   },
//   scanTrack: {
//     height: 4, backgroundColor: T.border,
//     borderRadius: 4, overflow: "hidden",

//   },
//   scanFill: {
//     height: "100%", backgroundColor: T.primary,
//     borderRadius: 4,
//     shadowColor: T.primary,
//     shadowOpacity: 0.7, shadowRadius: 4,
//   },

//   // Cancel
//   cancelBtn: {
//     width: "100%", maxWidth: 320,
//     paddingVertical: 14,
//     borderRadius: 14,
//     borderWidth: 1.5, borderColor: T.border,
//     backgroundColor: T.bgCard,
//     alignItems: "center",
//   },
//   cancelTxt: {
//     fontSize: 12,
//     color: T.textMid, letterSpacing: 2.5,
//     fontFamily: font.MonolithRegular

//   },
// });
import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
  TouchableOpacity,
  Dimensions,
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
import Geolocation from "@react-native-community/geolocation";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation, useRoute } from "@react-navigation/native";
import ScreenNameEnum from "../../../routes/screenName.enum";
import { WebSocket_Url } from "../../../Api";
import font from "../../../theme/font";
import StatusBarComponent from "../../../compoent/StatusBarCompoent";
import CustomHeader from "../../../compoent/CustomHeader";
import strings from "../../../localization/Localization";

const { width } = Dimensions.get("window");
const RADAR_SIZE = Math.min(width * 0.75, 280);
const CX = RADAR_SIZE / 2;
const CY = RADAR_SIZE / 2;
const R = RADAR_SIZE / 2 - 6;

// ── Types ──────────────────────────────────────────
type RouteParams = {
  parcelId: {
    parcel: {
      id: string;
    };
  };
};

type WSMessage = {
  type?: string;
  status?: string;
  offers?: any;
};

// ── Theme ──────────────────────────────────────────
const T = {
  primary: "#5D4037",
  primaryLight: "#EFEBE9",
  primaryBorder: "#BCAAA4",
  primaryDim: "rgba(93, 64, 55, 0.18)",
  primaryText: "#5D4037",
  bg: "#FAF7F2",
  bgCard: "#FFFFFF",
  bgHeader: "white",
  textDark: "#1A1200",
  textMid: "black",
  textFaint: "#8D6E63",
  border: "#5D4037",
};

// ── Blips ─────────────────────────────────────────
const BLIPS = [
  { id: 1, dx: 0.52, dy: -0.4, delay: 800 },
  { id: 2, dx: -0.44, dy: 0.55, delay: 1700 },
  { id: 3, dx: 0.62, dy: 0.46, delay: 2500 },
];

const ACCEPT_TIMEOUT_SEC = 30;
const MAX_RETRIES = 5;

// ── Blip Component ────────────────────────────────
interface BlipProps {
  cx: number;
  cy: number;
  delay: number;
}

const Blip: React.FC<BlipProps> = ({ cx, cy, delay }) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.3)).current;
  const ring = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(opacity, {
            toValue: 1,
            duration: 130,
            useNativeDriver: true,
          }),
          Animated.timing(scale, {
            toValue: 1.35,
            duration: 130,
            useNativeDriver: true,
          }),
          Animated.timing(ring, {
            toValue: 1,
            duration: 900,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(opacity, {
            toValue: 0.75,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(scale, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ]),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 1800,
          useNativeDriver: true,
        }),
        Animated.timing(ring, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
        Animated.delay(Math.max(0, 3000 - delay - 2430)),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  return (
    <>
      {/* Ring pulse */}
      <Animated.View
        pointerEvents="none"
        style={{
          position: "absolute",
          left: cx - 10,
          top: cy - 10,
          width: 20,
          height: 20,
          borderRadius: 10,
          borderWidth: 1.5,
          borderColor: T.primary,
          opacity: ring.interpolate({
            inputRange: [0, 1],
            outputRange: [0.6, 0],
          }),
          transform: [
            {
              scale: ring.interpolate({
                inputRange: [0, 1],
                outputRange: [1, 2.6],
              }),
            },
          ],
        }}
      />
      {/* Dot */}
      <Animated.View
        style={{
          position: "absolute",
          left: cx - 5,
          top: cy - 5,
          width: 10,
          height: 10,
          borderRadius: 5,
          backgroundColor: T.primary,
          borderWidth: 1.5,
          borderColor: T.primaryText,
          opacity,
          transform: [{ scale }],
          shadowColor: T.primary,
          shadowOpacity: 0.8,
          shadowRadius: 6,
          shadowOffset: { width: 0, height: 0 },
        }}
      />
    </>
  );
};

// ── Main Component ────────────────────────────────
interface RadarSearchScreenProps {
  driversFound?: number;
  radiusKm?: number;
  pickupAddress?: string;
  onCancel?: () => void;
}

const RadarSearchScreen: React.FC<RadarSearchScreenProps> = ({
  driversFound = 0,
  radiusKm = 1,
  pickupAddress = "Sapphire House, Indore",
  onCancel,
}) => {
  // ── Animation refs ──────────────────────────────
  const sweepAnim = useRef(new Animated.Value(0)).current;
  const pulse1 = useRef(new Animated.Value(0)).current;
  const pulse2 = useRef(new Animated.Value(0)).current;
  const pulse3 = useRef(new Animated.Value(0)).current;
  const centerScale = useRef(new Animated.Value(1)).current;
  const fadeIn = useRef(new Animated.Value(0)).current;
  const scanBarAnim = useRef(new Animated.Value(0)).current;
  const dotBlink = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  // ── State ───────────────────────────────────────
  const [driverStatus, setDriverStatus] = useState(
    strings.SearchingDrivers
  );
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeoutReached, setTimeoutReached] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(ACCEPT_TIMEOUT_SEC);
  const [scanPct, setScanPct] = useState(0);

  // ── Refs ────────────────────────────────────────
  const retryCountRef = useRef(0);
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Navigation ──────────────────────────────────
  const route = useRoute();
  const navigation = useNavigation<any>();
  const { parcelId } = (route?.params as RouteParams) || {};

  // ── Helpers ─────────────────────────────────────
  const updateStatusDetails = (status: string) => {
    const statusMap: Record<string, string> = {
      DRIVER_FOUND: strings.DriverConfirmed,
      ON_THE_WAY: strings.DriverEnRoute,
      PICKED_UP: strings.ParcelCollected,
      DELIVERED: strings.ParcelDelivered,
    };
    setDriverStatus(statusMap[status] || strings.ConnectingNetwork);
  };

  const clearCountdown = () => {
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
  };

  const startCountdown = () => {
    clearCountdown();
    let s = ACCEPT_TIMEOUT_SEC;
    setSecondsLeft(s);
    countdownRef.current = setInterval(() => {
      s -= 1;
      setSecondsLeft(s);
      if (s <= 0) clearCountdown();
    }, 1000);
  };

  const startProgressAnimation = useCallback(() => {
    progressAnim.setValue(0);
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: ACCEPT_TIMEOUT_SEC * 1000,
      easing: Easing.linear,
      useNativeDriver: false,
    }).start(({ finished }) => {
      if (finished) setTimeoutReached(true);
    });
  }, []);

  // ── Socket ──────────────────────────────────────
  const connectSocket = useCallback(
    async (token: string): Promise<void> => {
      try {
        if (!parcelId?.parcel?.id) {
          setError(strings.ParcelIDNotFound);
          return;
        }

        const wsUrl = `${WebSocket_Url}/parcel/${parcelId.parcel.id}?token=${token}&role=user`;
        const ws = new WebSocket(wsUrl);
        console.log('wsUrl', wsUrl);
        ws.onopen = () => {
          setIsConnected(true);
          setError(null);
          retryCountRef.current = 0;
          socketRef.current = ws;
        };

        ws.onmessage = (event) => {
          try {
            const data: WSMessage = JSON.parse(event.data);
            console.log('data', data);
            if (data?.type === "offers_update") {
              clearCountdown();
              navigation.replace(ScreenNameEnum.OfferOR, {
                Parcelid: data.offers,
                id: parcelId,
              });
              return;
            }

            if (data?.status) {
              setDriverStatus(data.status);
              updateStatusDetails(data.status);
            }
          } catch (e) {
            console.warn("Failed to parse message:", e);
          }
        };

        ws.onerror = () => {
          setIsConnected(false);
          setError(strings.ConnectionErrorRetrying);
        };

        ws.onclose = () => {
          setIsConnected(false);
          if (retryCountRef.current < MAX_RETRIES) {
            const delay = Math.min(
              1000 * Math.pow(2, retryCountRef.current),
              10000
            );
            reconnectTimeoutRef.current = setTimeout(() => {
              retryCountRef.current += 1;
              handleReconnect();
            }, delay);
          } else {
            setError(strings.ConnectionFailedTryAgain);
          }
        };

        socketRef.current = ws;
      } catch (err) {
        setError(strings.FailedConnectCheckInternet);
      }
    },
    [parcelId, navigation]
  );

  const handleReconnect = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (token) await connectSocket(token);
    } catch (_) { }
  };

  const handleRetry = () => {
    retryCountRef.current = 0;
    setError(null);
    setTimeoutReached(false);
    setSecondsLeft(ACCEPT_TIMEOUT_SEC);
    startProgressAnimation();
    startCountdown();
    handleReconnect();
  };

  const handleGoBack = () => {
    clearCountdown();
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.replace(ScreenNameEnum.DashBoardScreen);
    }
  };

  // ── Effects ─────────────────────────────────────
  // Init socket + countdown
  useEffect(() => {
    let mounted = true;
    const init = async () => {
      try {
        const token = await AsyncStorage.getItem("token");
        if (!token) {
          setError(strings.AuthTokenNotFound);
          return;
        }
        if (mounted) {
          await connectSocket(token);
          startProgressAnimation();
          startCountdown();
        }
      } catch (_) { }
    };
    init();

    return () => {
      mounted = false;
      clearCountdown();
      if (reconnectTimeoutRef.current)
        clearTimeout(reconnectTimeoutRef.current);
      socketRef.current?.close();
      socketRef.current = null;
    };
  }, []);

  // Animations
  useEffect(() => {
    // Entrance fade
    Animated.timing(fadeIn, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();

    // Sweep rotation
    Animated.loop(
      Animated.timing(sweepAnim, {
        toValue: 1,
        duration: 3000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    // Pulse rings
    const doPulse = (anim: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, {
            toValue: 1,
            duration: 2400,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
        ])
      ).start();

    doPulse(pulse1, 0);
    doPulse(pulse2, 800);
    doPulse(pulse3, 1600);

    // Center pulse
    Animated.loop(
      Animated.sequence([
        Animated.timing(centerScale, {
          toValue: 1.45,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(centerScale, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Status dot blink
    Animated.loop(
      Animated.sequence([
        Animated.timing(dotBlink, {
          toValue: 0.2,
          duration: 550,
          useNativeDriver: true,
        }),
        Animated.timing(dotBlink, {
          toValue: 1,
          duration: 550,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Scan bar shimmer
    Animated.loop(
      Animated.timing(scanBarAnim, {
        toValue: 1,
        duration: 2200,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: false,
      })
    ).start();

    // Scan percentage ticker
    const scanTick = setInterval(() => {
      setScanPct((p) =>
        p >= 97 ? 8 : Math.min(p + Math.floor(Math.random() * 18) + 6, 100)
      );
    }, 1100);

    return () => {
      clearInterval(scanTick);
    };
  }, []);

  // ── Derived animation values ─────────────────────
  const sweepRotate = sweepAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  const pulseStyle = (anim: Animated.Value) => ({
    position: "absolute" as const,
    left: CX - R,
    top: CY - R,
    width: R * 2,
    height: R * 2,
    borderRadius: R,
    borderWidth: 1.5,
    borderColor: T.primary,
    opacity: anim.interpolate({
      inputRange: [0, 0.25, 1],
      outputRange: [0.75, 0.35, 0],
    }),
    transform: [
      {
        scale: anim.interpolate({
          inputRange: [0, 1],
          outputRange: [0.05, 1],
        }),
      },
    ],
  });

  const scanFillWidth = scanBarAnim.interpolate({
    inputRange: [0, 0.4, 0.6, 1],
    outputRange: ["0%", "70%", "70%", "0%"],
  });

  // ── Render ───────────────────────────────────────
  return (
    <SafeAreaView style={s.safe}>
      <StatusBarComponent />
      <CustomHeader label={strings.FindingDriver} />

      <Animated.View style={[s.body, { opacity: fadeIn }]}>

        {/* ── RADAR ── */}
        <View style={[s.radarWrap, { width: RADAR_SIZE, height: RADAR_SIZE }]}>

          {/* Static SVG: background, grid, rings */}
          <Svg width={RADAR_SIZE} height={RADAR_SIZE} style={StyleSheet.absoluteFill}>
            <Defs>
              <RadialGradient id="radarBg" cx="50%" cy="50%" r="50%">
                <Stop offset="0%" stopColor="#FFFCE8" stopOpacity="1" />
                <Stop offset="100%" stopColor="#FFF5C0" stopOpacity="1" />
              </RadialGradient>
              <ClipPath id="rc">
                <Circle cx={CX} cy={CY} r={R} />
              </ClipPath>
            </Defs>
            <Circle
              cx={CX}
              cy={CY}
              r={R}
              fill="url(#radarBg)"
              stroke={T.border}
              strokeWidth="1.5"
            />
            {[0.25, 0.5, 0.75, 1].map((ratio, i) => (
              <Circle
                key={i}
                cx={CX}
                cy={CY}
                r={R * ratio}
                fill="none"
                stroke={T.border}
                strokeWidth="0.8"
              />
            ))}
            <Line
              x1={6} y1={CY} x2={RADAR_SIZE - 6} y2={CY}
              stroke={T.border} strokeWidth="0.8"
            />
            <Line
              x1={CX} y1={6} x2={CX} y2={RADAR_SIZE - 6}
              stroke={T.border} strokeWidth="0.8"
            />
            <Line
              x1={CX - R * 0.71} y1={CY - R * 0.71}
              x2={CX + R * 0.71} y2={CY + R * 0.71}
              stroke="#F5ECC0" strokeWidth="0.6"
            />
            <Line
              x1={CX + R * 0.71} y1={CY - R * 0.71}
              x2={CX - R * 0.71} y2={CY + R * 0.71}
              stroke="#F5ECC0" strokeWidth="0.6"
            />
          </Svg>

          {/* Compass labels */}
          {[
            { l: "N", left: CX - 5, top: 4 },
            { l: "E", left: RADAR_SIZE - 13, top: CY - 7 },
            { l: "S", left: CX - 5, top: RADAR_SIZE - 17 },
            { l: "W", left: 4, top: CY - 7 },
          ].map(({ l, left, top }) => (
            <Text key={l} style={[s.compass, { left, top }]}>
              {l}
            </Text>
          ))}

          {/* Sweep arm */}
          <Animated.View
            style={[
              s.sweepWrap,
              {
                width: RADAR_SIZE,
                height: RADAR_SIZE,
                transform: [{ rotate: sweepRotate }],
              },
            ]}
          >
            <Svg width={RADAR_SIZE} height={RADAR_SIZE}>
              <Defs>
                <RadialGradient id="sweepG" cx="50%" cy="50%" r="50%">
                  <Stop offset="0%" stopColor={T.primary} stopOpacity="0.55" />
                  <Stop offset="100%" stopColor={T.primary} stopOpacity="0" />
                </RadialGradient>
                <ClipPath id="sc">
                  <Circle cx={CX} cy={CY} r={R} />
                </ClipPath>
              </Defs>
              <G clipPath="url(#sc)">
                <Path
                  d={`M${CX} ${CY} L${CX + R} ${CY} A${R} ${R} 0 0 0 ${CX} ${CY - R
                    } Z`}
                  fill="url(#sweepG)"
                  opacity={0.9}
                />
                <Line
                  x1={CX} y1={CY} x2={CX + R} y2={CY}
                  stroke={T.primary} strokeWidth="2" opacity={1}
                />
              </G>
            </Svg>
          </Animated.View>

          {/* Pulse rings */}
          <Animated.View style={pulseStyle(pulse1)} pointerEvents="none" />
          <Animated.View style={pulseStyle(pulse2)} pointerEvents="none" />
          <Animated.View style={pulseStyle(pulse3)} pointerEvents="none" />

          {/* Blips */}
          {BLIPS.map((b) => (
            <Blip
              key={b.id}
              cx={CX + b.dx * R}
              cy={CY + b.dy * R}
              delay={b.delay}
            />
          ))}

          {/* Center dot */}
          <Animated.View
            style={[
              s.centerDot,
              {
                left: CX - 14,
                top: CY - 14,
                transform: [{ scale: centerScale }],
              },
            ]}
          >
            <View style={s.centerCore} />
          </Animated.View>
        </View>

        {/* ── STATUS TEXT ── */}
        <View style={s.statusWrap}>
          <Animated.View style={[s.statusDot, { opacity: dotBlink }]} />
          <Text style={[s.statusText, {}]} numberOfLines={1}>
            {driverStatus}
          </Text>
        </View>

        {/* ── ERROR BANNER ── */}


        {/* ── STATS CARD ── */}
        {/* <View style={s.statsCard}>
          <View style={s.statCol}>
            <Text style={s.statVal}>{driversFound || 2}</Text>
            <Text style={s.statLbl}>DRIVERS</Text>
          </View>
          <View style={s.statDiv} />
          <View style={s.statCol}>
            <Text style={s.statVal}>{radiusKm}km</Text>
            <Text style={s.statLbl}>RADIUS</Text>
          </View>
          <View style={s.statDiv} />
          <View style={s.statCol}>
            <Text style={s.statVal}>{secondsLeft}s</Text>
            <Text style={s.statLbl}>TIMEOUT</Text>
          </View>
        </View> */}

        {/* ── SCAN BAR ── */}
        <View style={[s.scanWrap, {
          marginTop: 18
        }]}>
          <View style={s.scanMeta}>
            <Text style={s.scanLbl}>{strings.ScanningArea}</Text>
            <Text style={s.scanPct}>{scanPct}%</Text>
          </View>
          <View style={s.scanTrack}>
            <Animated.View style={[s.scanFill, { width: scanFillWidth }]} />
          </View>
        </View>

        {/* ── CANCEL ── */}
        <TouchableOpacity
          style={s.cancelBtn}
          onPress={onCancel ?? handleGoBack}
          activeOpacity={0.7}
        >
          <Text style={s.cancelTxt}>{strings.CancelSearch}</Text>
        </TouchableOpacity>

      </Animated.View>
    </SafeAreaView>
  );
};

export default RadarSearchScreen;

// ── StyleSheet ─────────────────────────────────────
const s = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: T.bgHeader,
  },
  body: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    gap: 22,
    paddingVertical: 24,
  },

  // Radar
  radarWrap: {
    borderRadius: 999,
    overflow: "hidden",
    position: "relative",
    shadowColor: T.primary,
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  sweepWrap: {
    position: "absolute",
    top: 0,
    left: 0,
  },
  compass: {
    position: "absolute",
    color: T.textFaint,
    fontSize: 9,
    fontFamily: font.MonolithRegular,
  },
  centerDot: {
    position: "absolute",
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: T.primaryDim,
    alignItems: "center",
    justifyContent: "center",
  },
  centerCore: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: T.primary,
    borderWidth: 1.5,
    borderColor: T.primaryText,
    shadowColor: T.primary,
    shadowOpacity: 0.9,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
  },

  // Status
  statusWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    maxWidth: 320,
    width: "100%",
    paddingHorizontal: 4,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: T.primary,
  },
  statusText: {
    fontSize: 14,
    color: T.textMid,
    letterSpacing: 0.5,
    fontFamily: font.MonolithRegular,
    flex: 1,
  },

  // Error
  errorBanner: {
    width: "100%",
    maxWidth: 320,
    backgroundColor: T.primaryLight,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: T.border,
    paddingVertical: 10,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  errorText: {
    fontSize: 11,
    color: T.textDark,
    fontFamily: font.MonolithRegular,
    flex: 1,
  },
  retryBtn: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: T.primary,
    marginLeft: 8,
  },
  retryText: {
    fontSize: 10,
    fontFamily: font.MonolithRegular,
    color: T.textDark,
    letterSpacing: 1.5,
  },

  // Stats
  statsCard: {
    flexDirection: "row",
    width: "100%",
    maxWidth: 320,
    backgroundColor: T.bgCard,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: T.border,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  statCol: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 8,
  },
  statDiv: {
    width: 1,
    backgroundColor: T.border,
    marginVertical: 10,
  },
  statVal: {
    fontSize: 22,
    fontFamily: font.MonolithRegular,
    color: T.textDark,
    letterSpacing: 0.5,
  },
  statLbl: {
    fontSize: 9,
    color: T.textMid,
    letterSpacing: 1.8,
    marginTop: 3,
    fontFamily: font.MonolithRegular,
  },

  // Scan bar
  scanWrap: {
    width: "100%",
    maxWidth: 320,
    gap: 7,
  },
  scanMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  scanLbl: {
    fontSize: 10,
    color: T.textMid,
    letterSpacing: 1.8,
    fontFamily: font.MonolithRegular,
  },
  scanPct: {
    fontSize: 11,
    color: T.primary,
    fontFamily: font.MonolithRegular,
  },
  scanTrack: {
    height: 4,
    backgroundColor: "#76889A",
    borderRadius: 4,
    overflow: "hidden",
  },
  scanFill: {
    height: "100%",
    backgroundColor: "#FFCC00",
    borderRadius: 4,
    shadowColor: T.primary,
    shadowOpacity: 0.7,
    shadowRadius: 4,
  },

  // Cancel
  cancelBtn: {
    width: "100%",
    maxWidth: 320,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#FFCC00",
    backgroundColor: T.bgCard,
    alignItems: "center",
  },
  cancelTxt: {
    fontSize: 12,
    color: T.textMid,
    letterSpacing: 2.5,
    fontFamily: font.MonolithRegular,
    textTransform: "uppercase"
  },
});