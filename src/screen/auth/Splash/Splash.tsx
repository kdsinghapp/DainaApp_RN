import React, { useEffect, useRef } from 'react';
import { Animated, ImageBackground, View, Text, Image } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import ScreenNameEnum from '../../../routes/screenName.enum';
import { color } from '../../../constant';
import imageIndex from '../../../assets/imageIndex';
import StatusBarComponent from '../../../compoent/StatusBarCompoent';
import { styles } from './style';
import { useDispatch } from 'react-redux';
import { restoreLogin } from '../../../redux/feature/authSlice';
import { getAuthData, GetVerificationStatusApi } from '../../../Api/apiRequest';

type RootStackParamList = {
  Home: undefined;
};

const Splash: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const dispatch = useDispatch();

  // Animation reference
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Fade-in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1500,
      useNativeDriver: true,
    }).start();

    // Timer for navigation
    const timer = setTimeout(async () => {
      try {
        const storedAuth = await getAuthData();
        console.log(storedAuth, "storedAuth")
        if (storedAuth?.token) {
          dispatch(restoreLogin(storedAuth));
          if (storedAuth.userData?.type == "Delivery") {
            navigation.replace(ScreenNameEnum.DeliveryTabNavigator);
          } else {
            navigation.replace(ScreenNameEnum.TabNavigator);
          }
        } else {
          navigation.replace(ScreenNameEnum.language, { isFirstTime: true });
        }
      } catch (error) {
        console.error('Splash check failed:', error);
        navigation.replace(ScreenNameEnum.language, { isFirstTime: true });
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [fadeAnim, navigation, dispatch]);

  return (
    <ImageBackground
      style={styles.container}
      source={imageIndex.bag}
      resizeMode="cover"
    >
      <StatusBarComponent backgroundColor={color.white} />

      {/* Center content */}
      <View style={styles.centerContent}>
        <Animated.View style={{ opacity: fadeAnim }}>
          <Image
            source={imageIndex.appLogo1}
            style={styles.logo}

          />
          {/* <FastImage
            style={styles.logo}
            source={imageIndex.appLogo1}
            resizeMode={FastImage.resizeMode.contain}
          /> */}
        </Animated.View>
      </View>

      {/* Version text at bottom center */}
      {/* <View style={styles.versionContainer}>
        <Text style={styles.versionText}>Version 1.0.44</Text>
      </View> */}
    </ImageBackground>
  );
};

export default Splash;

// import React, { useEffect, useState } from "react";
// import { View, StyleSheet } from "react-native";
// import MapLibreGL from "@maplibre/maplibre-react-native";
// import Geolocation from "@react-native-community/geolocation";

// export default function Map() {
//   // [longitude, latitude] format
//   const [userPosition, setUserPosition] = useState([79.0882, 21.1567]);
//   const [routeCoordinates, setRouteCoordinates] = useState([[79.0882, 21.1567]]);

//   useEffect(() => {
//     const watchId = Geolocation.watchPosition(
//       (pos) => {
//         const { latitude, longitude } = pos.coords;

//         // Only update if user moved more than 1 meter (optional)
//         const lastCoord = routeCoordinates[routeCoordinates.length - 1];
//         const distanceMoved = getDistance(lastCoord[1], lastCoord[0], latitude, longitude);

//         if (distanceMoved > 0.5) { // 0.5 meter threshold
//           const newCoord = [longitude, latitude];

//           // Update user position
//           setUserPosition(newCoord);

//           // Append to route for polyline
//           setRouteCoordinates((prev) => [...prev, newCoord]);
//         }
//       },
//       (error) => console.error(error),
//       { enableHighAccuracy: true, distanceFilter: 0, interval: 1000, fastestInterval: 500 }
//     );

//     return () => Geolocation.clearWatch(watchId);
//   }, [routeCoordinates]);

//   // Helper function: Haversine formula to calculate distance between two coords
//   const getDistance = (lat1, lon1, lat2, lon2) => {
//     const toRad = (x) => (x * Math.PI) / 180;
//     const R = 6371000; // meters
//     const dLat = toRad(lat2 - lat1);
//     const dLon = toRad(lon2 - lon1);
//     const a =
//       Math.sin(dLat / 2) * Math.sin(dLat / 2) +
//       Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
//     const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
//     return R * c;
//   };

//   return (
//     <View style={styles.container}>
//       <MapLibreGL.MapView style={styles.map} styleURL={MapLibreGL.StyleURL.Street}>
//         <MapLibreGL.Camera
//           zoomLevel={16}
//           centerCoordinate={userPosition}
//           animationMode="flyTo"
//           animationDuration={1000}
//         />

//         {/* User Marker */}
//         <MapLibreGL.PointAnnotation id="user-marker" coordinate={userPosition}>
//           <View
//             style={{
//               height: 30,
//               width: 30,
//               backgroundColor: "green",
//               borderRadius: 15,
//               borderWidth: 3,
//               borderColor: "#fff",
//             }}
//           />
//         </MapLibreGL.PointAnnotation>

//         {/* Polyline */}
//         <MapLibreGL.ShapeSource
//           id="lineSource"
//           shape={{
//             type: "Feature",
//             geometry: { type: "LineString", coordinates: routeCoordinates },
//           }}
//         >
//           <MapLibreGL.LineLayer
//             id="lineLayer"
//             style={{
//               lineColor: "blue",
//               lineWidth: 4,
//               lineCap: "round",
//               lineJoin: "round",
//             }}
//           />
//         </MapLibreGL.ShapeSource>
//       </MapLibreGL.MapView>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: { flex: 1 },
//   map: { flex: 1 },
// });




