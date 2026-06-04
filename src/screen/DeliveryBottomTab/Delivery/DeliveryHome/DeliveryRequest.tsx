import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
   ActivityIndicator,
  Linking,
  ScrollView
} from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import font from '../../../../theme/font';
 import AsyncStorage from '@react-native-async-storage/async-storage';
import LoadingModal from '../../../../utils/Loader';
import { SafeAreaView } from 'react-native-safe-area-context';
import strings from '../../../../localization/Localization';
import { useDashboardContext } from '../../../../context/DashboardContext';

const DeliveryRequest = () => {
  const [loading, setLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30);
  const [deliveryInfo, setDeliveryInfo] = useState(null);
  const dashboardCtx = useDashboardContext();
  useEffect(() => {
    fetchOfferDetail();
  }, []);

  const fetchOfferDetail = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('token');
      
      const response = await fetch(
        'https://aitechnotech.in/DAINA/api/delivery/my-offers/103',
        {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      );

      const result = await response.json();
 
      if (result.status === 1 && result.offer) {
        console.log("Offer data:", result.offer);
        setDeliveryInfo(result);
      } else {
        dashboardCtx?.setGeneralAlert({
          visible: true,
          type: 'error',
          message: result.message || 'Failed to fetch offer details'
        });
      }
    } catch (error) {
      console.log('API Error:', error);
      dashboardCtx?.setGeneralAlert({
        visible: true,
        type: 'error',
        message: 'Network Error. Please try again later.'
      });
    } finally {
      setLoading(false);
    }
  };

  const getDeliveryData = () => {
    if (!deliveryInfo || !deliveryInfo.offer) return {};
    
    const offer = deliveryInfo.offer;
    const parcel = offer.parcel;
    const user = offer.user;
    
    // Default coordinates
    const defaultCoords = {
      latitude: 28.6139,
      longitude: 77.2090,
    };
    
    return {
      orderId: offer.trackingId || 'N/A',
      amount: offer.amount || '0',
      restaurantName: parcel?.senderName || 'Sender',
      pickupAddress: parcel?.pickupLocation || 'Pickup location not specified',
      restaurantPhone: user?.phone,
      customerName: user?.firstName || 'Customer',
      address: parcel?.dropLocation || 'Delivery location not specified',
      customerPhone: user?.phone,
      items: 'Parcel Delivery',
      orderTotal: offer.amount || '0',
      specialInstructions: offer.message,
      deliveryTime: '30',
      distance: '5',
      pickupLocation: defaultCoords,
      deliveryLocation: {
        latitude: defaultCoords.latitude + 0.001,
        longitude: defaultCoords.longitude + 0.001,
      },
      senderProfileImage: user?.image,
      packageSize: 'Standard',
      consignmentType: 'Parcel',
      deliveryType: 'Standard',
      shipmentType: 'General',
      // Additional fields from API
      pickupDate: parcel?.pickupDate,
      pickupTime: parcel?.pickupTime,
      offerStatus: offer.status
    };
  };

  const deliveryData = getDeliveryData();

 
 
 
 
 

 
  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [timeLeft]);

  // Action Handlers
  const handleAccept = async () => {
    setLoading(true);
    try {

      dashboardCtx?.setGeneralAlert({
        visible: true,
        type: 'success',
        title: 'Success',
        message: 'Delivery accepted successfully!'
      });
      // closeBottomSheet();
    } catch (error) {
      dashboardCtx?.setGeneralAlert({
        visible: true,
        type: 'error',
        message: 'Acceptance failed. Please try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    dashboardCtx?.setGeneralAlert({
      visible: true,
      type: 'info',
      title: 'Reject Delivery',
      message: 'Are you sure you want to reject this delivery?',
      // onClose is used for confirming actions usually, but for a simple choice
      // we might want a different modal with confirm button.
      // But for now let's stick to the premium alert style.
    });
  };

  const handleCallCustomer = () => {
    if (deliveryData?.customerPhone) {
      Linking.openURL(`tel:${deliveryData.customerPhone}`);
    } else {
      dashboardCtx?.setGeneralAlert({
        visible: true,
        type: 'error',
        message: 'Customer phone number not available'
      });
    }
  };

 
 ;

  const renderRouteCard = () => (
    <Animated.View entering={FadeInDown.delay(200).duration(600)} style={styles.routeCard}>
      
      
      {/* Pickup Location */}
      <View style={styles.locationRow}>
        <View style={[styles.locationDot, styles.pickupDot]} />
        <View style={styles.locationContent}>
          <Text style={styles.locationType}>PICKUP FROM</Text>
          <Text style={styles.locationName}>{deliveryData?.restaurantName || 'Sender'}</Text>
          <Text style={styles.locationAddress}>
            {deliveryData?.pickupAddress || 'Pickup address not available'}
          </Text>
          {/* {deliveryData?.restaurantPhone && (
            <TouchableOpacity style={styles.contactButton} onPress={handleCallRestaurant}>
              <Text style={styles.contactText}>📞 Call Sender</Text>
            </TouchableOpacity>
          )} */}
        </View>
      </View>
   <View style={styles.connectorLine} />
     
 
      {/* Delivery Location */}
      <View style={styles.locationRow}>
        <View style={[styles.locationDot, styles.dropoffDot]} />
        <View style={styles.locationContent}>
          <Text style={styles.locationType}>DELIVER TO</Text>
          <Text style={styles.locationName}>{deliveryData?.customerName || 'Receiver'}</Text>
          <Text style={styles.locationAddress}>
            {deliveryData?.address || 'Delivery address not available'}
          </Text>
          
        </View>
      </View>
    </Animated.View>
  );

  const renderMapCard = () => (
    <Animated.View entering={FadeInDown.delay(100).duration(600)} style={styles.mapCard}>
      <Text style={styles.sectionTitle}>{strings.RouteMap}</Text>
      <View style={styles.mapContainer}>
        <MapView
          provider={PROVIDER_GOOGLE}
          style={styles.map}
          initialRegion={{
            latitude: deliveryData?.pickupLocation?.latitude || 28.6139,
            longitude: deliveryData?.pickupLocation?.longitude || 77.2090,
            latitudeDelta: 0.0922,
            longitudeDelta: 0.0421,
          }}
        >
          <Marker coordinate={deliveryData?.pickupLocation || { latitude: 28.6139, longitude: 77.2090 }}>
            <View style={styles.pickupMarker}>
              <Text style={styles.markerText}>📦</Text>
            </View>
          </Marker>

          <Marker coordinate={deliveryData?.deliveryLocation || { latitude: 28.6129, longitude: 77.2295 }}>
            <View style={styles.dropoffMarker}>
              <Text style={styles.markerText}>🏠</Text>
            </View>
          </Marker>

          <Polyline
            coordinates={[
              deliveryData?.pickupLocation || { latitude: 28.6139, longitude: 77.2090 },
              deliveryData?.deliveryLocation || { latitude: 28.6129, longitude: 77.2295 }
            ]}
            strokeColor="#007AFF"
            strokeWidth={4}
          />
        </MapView>
      </View>
    </Animated.View>
  );

 
  const renderScheduleDetails = () => (
    <Animated.View entering={FadeInDown.delay(300).duration(600)} style={styles.detailsCard}>
      <Text style={styles.sectionTitle}>{strings.DeliverySchedule}</Text>
      <View style={styles.detailsGrid}>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>{strings.PickupDate}</Text>
          <Text style={styles.detailValue}>
            {deliveryData?.pickupDate ? new Date(deliveryData.pickupDate).toLocaleDateString() : 'N/A'}
          </Text>
        </View>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>{strings.PickupTime}</Text>
          <Text style={styles.detailValue}>
            {deliveryData?.pickupTime ? new Date(deliveryData.pickupTime).toLocaleTimeString() : 'N/A'}
          </Text>
        </View>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>{strings.OfferStatus}</Text>
          <Text style={styles.detailValue}>{deliveryData?.offerStatus || 'N/A'}</Text>
        </View>
      </View>
    </Animated.View>
  );

 

  const renderActionButtons = () => (
    <Animated.View entering={FadeInUp.delay(400).duration(600)} style={styles.actionSection}>
      <View style={styles.buttonRow}>
        <TouchableOpacity 
          style={[styles.button, styles.rejectButton]}
          onPress={handleCancel}
          disabled={loading}
        >
          <Text style={styles.rejectButtonText}>{strings.Reject}</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.button, styles.acceptButton]}
          onPress={handleAccept}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <Text style={styles.acceptButtonText}>{strings.AcceptDelivery}</Text>
            
            </>
          )}
        </TouchableOpacity>
      </View>
      
    
    </Animated.View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <LoadingModal visible={loading} />
       <View 
        style={[styles.bottomSheet]}
       >
        <ScrollView 
          style={styles.content}
          showsVerticalScrollIndicator={false}
        >
                    {renderMapCard()}

           {renderRouteCard()}
           {renderScheduleDetails()}
         </ScrollView>

        {renderActionButtons()}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
     flex: 1,
    backgroundColor: 'white',
  },
  backdrop: {
    flex: 1,
    backgroundColor:"white"
  },
  bottomSheet: {
   
   
    flex:1,
  
  },
  dragHandle: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  dragHandleBar: {
    width: 48,
    height: 5,
    backgroundColor: '#E5E5E5',
    borderRadius: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerContent: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  titleBadge: {
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  titleBadgeText: {
    fontSize: 12,
     fontFamily: font.MonolithRegular
 ,
    color: '#FFFFFF',
  },
  timerBadge: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  timerCritical: {
    backgroundColor: '#FF3B30',
  },
  timerText: {
    fontSize: 14,
  
    color: '#FFFFFF',
        fontFamily: font.MonolithRegular
    
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: font.MonolithRegular,
    color: '#1A1A1A',
    marginBottom: 4,
  },
  orderId: {
    fontSize: 14,
    color: '#666',
  },
  closeBtn: {
    padding: 4,
  },
  closeIcon: {
    fontSize: 28,
    color: '#666',
    fontFamily: font.MonolithRegular

  },
  content: {
    flex: 1,
  },
  routeCard: {
    margin: 16,
    marginTop: 0,
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
       borderWidth: 1,
    borderColor: "#d6e1f9ff",
 
  },
   
  sectionTitle: {
    fontSize: 18,
    
    color: '#1A1A1A',
        fontFamily: font.MonolithRegular
    
  },
 
 
  locationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  locationDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 12,
    marginTop: 4,
  },
  pickupDot: {
    backgroundColor: '#4CAF50',
    borderWidth: 3,
    borderColor: '#E8F5E8',
  },
  dropoffDot: {
    backgroundColor: '#FF6B6B',
    borderWidth: 3,
    borderColor: '#FFE5E5',
  },
  locationContent: {
    flex: 1,
  },
  locationType: {
    fontSize: 12,
    fontFamily: font.MonolithRegular
,
    color: '#666',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  locationName: {
    fontSize: 16,
    fontFamily: font.MonolithRegular,
    color: '#1A1A1A',
    marginBottom: 4,
  },
  locationAddress: {
    fontSize: 14,
    color: '#666',
    lineHeight: 18,
    marginBottom: 8,
  },
  contactButton: {
    alignSelf: 'flex-start',
  },
  contactText: {
    fontSize: 14,
    color: '#007AFF',
    fontFamily: font.MonolithRegular

  },
  routeConnector: {
    alignItems: 'center',
    marginVertical: 8,
  },
  connectorLine: {
    width: 2,
    height: 20,
    backgroundColor: '#E5E5E5',
    marginBottom: 4,
  },
  connectorTime: {
    fontSize: 12,
    color: '#666',
       fontFamily: font.MonolithRegular
   
  },
  mapCard: {
    margin: 16,
    marginTop: 0,
  },
  mapContainer: {
    height: 300,
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 8,
  },
  map: {
    flex: 1,
  },
  pickupMarker: {
    backgroundColor: '#4CAF50',
    padding: 8,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
   },
  dropoffMarker: {
    backgroundColor: '#FF6B6B',
    padding: 8,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
   },
  markerText: {
    fontSize: 14,
  },
  detailsCard: {
    margin: 16,
    marginTop: 0,
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
   },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  detailItem: {
    width: '48%',
    marginBottom: 16,
  },
  detailLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
      fontFamily: font.MonolithRegular
  
  },
  detailValue: {
    fontSize: 16,
      fontFamily: font.MonolithRegular
  ,
    color: '#1A1A1A',
  },
  instructionsCard: {
    margin: 16,
    marginTop: 0,
    padding: 20,
    backgroundColor: '#FFF3CD',
    borderRadius: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#FFC107',
  },
  instructionsContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 8,
  },
  instructionsIcon: {
    fontSize: 16,
    marginRight: 12,
    marginTop: 2,
  },
  instructionsText: {
    flex: 1,
    fontSize: 14,
    color: '#856404',
    lineHeight: 20,
  },
  actionSection: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    backgroundColor: '#FFFFFF',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
 
  },
  acceptButton: {
    backgroundColor: '#FFCC00',
  },
  rejectButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E5E5E5',
  },
  acceptButtonText: {
    color: 'white',
    fontSize: 22,
      fontFamily:font.MonolithRegular
  },
  rejectButtonText: {
    color: 'black',
    fontSize: 16,
     fontFamily:font.MonolithRegular
  },
  amountBadge: {
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  amountText: {
    color: '#1A1A1A',
    fontSize: 14,
       fontFamily: font.MonolithRegular
   
  },
  timerWarning: {
    textAlign: 'center',
    color: '#FF3B30',
    fontSize: 14,
      fontFamily: font.MonolithRegular
  ,
    marginTop: 12,
  },
});

export default DeliveryRequest;










// import React, { useState, useEffect, useRef } from 'react';
// import {
//   View,
//   Text,
//   TouchableOpacity,
//   StyleSheet,
//   Alert,
//   ActivityIndicator,
//   Linking,
//   ScrollView,
//   Dimensions
// } from 'react-native';
// import MapView, { Marker, Polyline } from 'react-native-maps';
// import font from '../../../../theme/font';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import LoadingModal from '../../../../utils/Loader';
// import { SafeAreaView } from 'react-native-safe-area-context';

// const { width, height } = Dimensions.get('window');

// const DeliveryRequest = () => {
//   const [loading, setLoading] = useState(false);
//   const [timeLeft, setTimeLeft] = useState(30);
//   const [deliveryInfo, setDeliveryInfo] = useState(null);
//   const mapRef = useRef(null);

//   useEffect(() => {
//     fetchOfferDetail();
//   }, []);

//   const fetchOfferDetail = async () => {
//     try {
//       setLoading(true);
//       const token = await AsyncStorage.getItem('token');
      
//       const response = await fetch(
//         'https://aitechnotech.in/DAINA/api/delivery/my-offers/103',
//         {
//           method: 'GET',
//           headers: {
//             'Accept': 'application/json',
//             'Authorization': `Bearer ${token}`
//           }
//         }
//       );

//       const result = await response.json();
 
//       if (result.status === 1 && result.offer) {
//         console.log("Offer data:", result.offer);
//         setDeliveryInfo(result);
        
//         // Fit map to show both markers after data is loaded
//         setTimeout(fitMapToMarkers, 500);
//       } else {
//         Alert.alert('Error', result.message || 'Failed to fetch offer details');
//       }
//     } catch (error) {
//       console.log('API Error:', error);
//       Alert.alert('Network Error', 'Please try again later.');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const fitMapToMarkers = () => {
//     const pickup = deliveryData.pickupLocation;
//     const delivery = deliveryData.deliveryLocation;
    
//     if (mapRef.current && pickup && delivery) {
//       mapRef.current.fitToCoordinates([pickup, delivery], {
//         edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
//         animated: true,
//       });
//     }
//   };

//   const getDeliveryData = () => {
//     if (!deliveryInfo || !deliveryInfo.offer) return {};
    
//     const offer = deliveryInfo.offer;
//     const parcel = offer.parcel;
//     const user = offer.user;
    
//     // More realistic coordinates for demo
//     const defaultPickup = {
//       latitude: 28.6139,
//       longitude: 77.2090,
//     };
    
//     const defaultDelivery = {
//       latitude: 28.6129,
//       longitude: 77.2295,
//     };
    
//     return {
//       orderId: offer.trackingId || 'N/A',
//       amount: offer.amount || '0',
//       restaurantName: parcel?.senderName || 'Sender',
//       pickupAddress: parcel?.pickupLocation || 'Pickup location not specified',
//       restaurantPhone: user?.phone,
//       customerName: user?.firstName || 'Customer',
//       address: parcel?.dropLocation || 'Delivery location not specified',
//       customerPhone: user?.phone,
//       items: 'Parcel Delivery',
//       orderTotal: offer.amount || '0',
//       specialInstructions: offer.message,
//       deliveryTime: '30',
//       distance: '5',
//       pickupLocation: defaultPickup,
//       deliveryLocation: defaultDelivery,
//       senderProfileImage: user?.image,
//       packageSize: 'Standard',
//       consignmentType: 'Parcel',
//       deliveryType: 'Standard',
//       shipmentType: 'General',
//       pickupDate: parcel?.pickupDate,
//       pickupTime: parcel?.pickupTime,
//       offerStatus: offer.status
//     };
//   };

//   const deliveryData = getDeliveryData();

//   // Generate more realistic polyline coordinates
//   const generatePolylineCoordinates = () => {
//     const pickup = deliveryData.pickupLocation;
//     const delivery = deliveryData.deliveryLocation;
    
//     if (!pickup || !delivery) return [];

//     // Create intermediate points for a curved polyline
//     const intermediatePoints = [
//       pickup,
//       {
//         latitude: (pickup.latitude + delivery.latitude) / 2 + 0.001,
//         longitude: (pickup.longitude + delivery.longitude) / 2,
//       },
//       delivery
//     ];

//     return intermediatePoints;
//   };

//   const polylineCoordinates = generatePolylineCoordinates();

//   useEffect(() => {
//     if (timeLeft > 0) {
//       const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
//       return () => clearTimeout(timer);
//     }
//   }, [timeLeft]);

//   const handleAccept = async () => {
//     setLoading(true);
//     try {
//       // Simulate API call
//       await new Promise(resolve => setTimeout(resolve, 1500));
//       Alert.alert('Success', 'Delivery accepted successfully!');
//     } catch (error) {
//       Alert.alert('Error', 'Acceptance failed. Please try again.');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleCancel = () => {
//     Alert.alert(
//       'Reject Delivery',
//       'Are you sure you want to reject this delivery?',
//       [
//         { text: 'No', style: 'cancel' },
//         {
//           text: 'Yes',
//           onPress: async () => {
//             setLoading(true);
//             try {
//               await new Promise(resolve => setTimeout(resolve, 1000));
//               Alert.alert('Rejected', 'Delivery has been rejected.');
//             } catch (error) {
//               Alert.alert('Error', 'Rejection failed. Please try again.');
//             } finally {
//               setLoading(false);
//             }
//           },
//         },
//       ]
//     );
//   };

//   const handleCallCustomer = () => {
//     if (deliveryData?.customerPhone) {
//       Linking.openURL(`tel:${deliveryData.customerPhone}`);
//     } else {
//       Alert.alert('Error', 'Customer phone number not available');
//     }
//   };

//   const handleCallSender = () => {
//     if (deliveryData?.restaurantPhone) {
//       Linking.openURL(`tel:${deliveryData.restaurantPhone}`);
//     } else {
//       Alert.alert('Error', 'Sender phone number not available');
//     }
//   };

//   const renderHeader = () => (
//     <View style={styles.header}>
//       <View style={styles.headerContent}>
//         <View style={styles.titleRow}>
//           <View style={styles.titleBadge}>
//             <Text style={styles.titleBadgeText}>NEW DELIVERY</Text>
//           </View>
//           <View style={[styles.timerBadge, timeLeft < 10 && styles.timerCritical]}>
//             <Text style={styles.timerText}>{timeLeft}s</Text>
//           </View>
//         </View>
//         <Text style={styles.headerTitle}>Delivery Request</Text>
//         <Text style={styles.orderId}>Order ID: {deliveryData?.orderId}</Text>
//       </View>
//     </View>
//   );

//   const renderRouteCard = () => (
//     <View style={styles.routeCard}>
//       {/* Pickup Location */}
//       <View style={styles.locationRow}>
//         <View style={[styles.locationDot, styles.pickupDot]} />
//         <View style={styles.locationContent}>
//           <Text style={styles.locationType}>PICKUP FROM</Text>
//           <Text style={styles.locationName}>{deliveryData?.restaurantName || 'Sender'}</Text>
//           <Text style={styles.locationAddress}>
//             {deliveryData?.pickupAddress || 'Pickup address not available'}
//           </Text>
//           {deliveryData?.restaurantPhone && (
//             <TouchableOpacity style={styles.contactButton} onPress={handleCallSender}>
//               <Text style={styles.contactText}>📞 Call Sender</Text>
//             </TouchableOpacity>
//           )}
//         </View>
//       </View>
      
//       <View style={styles.connectorLine} />
      
//       {/* Delivery Location */}
//       <View style={styles.locationRow}>
//         <View style={[styles.locationDot, styles.dropoffDot]} />
//         <View style={styles.locationContent}>
//           <Text style={styles.locationType}>DELIVER TO</Text>
//           <Text style={styles.locationName}>{deliveryData?.customerName || 'Receiver'}</Text>
//           <Text style={styles.locationAddress}>
//             {deliveryData?.address || 'Delivery address not available'}
//           </Text>
//           {deliveryData?.customerPhone && (
//             <TouchableOpacity style={styles.contactButton} onPress={handleCallCustomer}>
//               <Text style={styles.contactText}>📞 Call Receiver</Text>
//             </TouchableOpacity>
//           )}
//         </View>
//       </View>
//     </View>
//   );

//   const renderMapCard = () => (
//     <View style={styles.mapCard}>
//       <View style={styles.mapHeader}>
//         <Text style={styles.sectionTitle}>Delivery Route</Text>
//         <View style={styles.distanceBadge}>
//           <Text style={styles.distanceText}>{deliveryData?.distance} km • {deliveryData?.deliveryTime} min</Text>
//         </View>
//       </View>
//       <View style={styles.mapContainer}>
//         <MapView
//           ref={mapRef}
//           style={styles.map}
//           initialRegion={{
//             latitude: deliveryData?.pickupLocation?.latitude || 28.6139,
//             longitude: deliveryData?.pickupLocation?.longitude || 77.2090,
//             latitudeDelta: 0.0922,
//             longitudeDelta: 0.0421,
//           }}
//           showsUserLocation={true}
//           showsCompass={true}
//           showsScale={true}
//         >
//           <Marker 
//             coordinate={deliveryData?.pickupLocation || { latitude: 28.6139, longitude: 77.2090 }}
//             title="Pickup Location"
//             description={deliveryData?.restaurantName}
//           >
//             <View style={styles.pickupMarker}>
//               <Text style={styles.markerText}>📦</Text>
//             </View>
//           </Marker>

//           <Marker 
//             coordinate={deliveryData?.deliveryLocation || { latitude: 28.6129, longitude: 77.2295 }}
//             title="Delivery Location"
//             description={deliveryData?.customerName}
//           >
//             <View style={styles.dropoffMarker}>
//               <Text style={styles.markerText}>🏠</Text>
//             </View>
//           </Marker>

//           <Polyline
//             coordinates={polylineCoordinates}
//             strokeColor="#007AFF"
//             strokeWidth={4}
//             lineDashPattern={[1, 0]} // Solid line
//           />
//         </MapView>
//       </View>
//     </View>
//   );

//   const renderDeliveryDetails = () => (
//     <View style={styles.detailsCard}>
//       <Text style={styles.sectionTitle}>Delivery Information</Text>
//       <View style={styles.detailsGrid}>
//         <View style={styles.detailItem}>
//           <Text style={styles.detailLabel}>Package Size</Text>
//           <Text style={styles.detailValue}>{deliveryData?.packageSize}</Text>
//         </View>
//         <View style={styles.detailItem}>
//           <Text style={styles.detailLabel}>Delivery Type</Text>
//           <Text style={styles.detailValue}>{deliveryData?.deliveryType}</Text>
//         </View>
//         <View style={styles.detailItem}>
//           <Text style={styles.detailLabel}>Amount</Text>
//           <Text style={[styles.detailValue, styles.amountValue]}>₹{deliveryData?.amount}</Text>
//         </View>
//         <View style={styles.detailItem}>
//           <Text style={styles.detailLabel}>Distance</Text>
//           <Text style={styles.detailValue}>{deliveryData?.distance} km</Text>
//         </View>
//       </View>
//     </View>
//   );

//   const renderScheduleDetails = () => (
//     <View style={styles.detailsCard}>
//       <Text style={styles.sectionTitle}>Delivery Schedule</Text>
//       <View style={styles.detailsGrid}>
//         <View style={styles.detailItem}>
//           <Text style={styles.detailLabel}>Pickup Date</Text>
//           <Text style={styles.detailValue}>
//             {deliveryData?.pickupDate ? new Date(deliveryData.pickupDate).toLocaleDateString() : 'N/A'}
//           </Text>
//         </View>
//         <View style={styles.detailItem}>
//           <Text style={styles.detailLabel}>Pickup Time</Text>
//           <Text style={styles.detailValue}>
//             {deliveryData?.pickupTime ? new Date(deliveryData.pickupTime).toLocaleTimeString() : 'N/A'}
//           </Text>
//         </View>
//         <View style={styles.detailItem}>
//           <Text style={styles.detailLabel}>Offer Status</Text>
//           <Text style={[styles.detailValue, 
//             deliveryData?.offerStatus === 'accepted' ? styles.statusAccepted : styles.statusPending
//           ]}>
//             {deliveryData?.offerStatus || 'N/A'}
//           </Text>
//         </View>
//       </View>
//     </View>
//   );

//   const renderActionButtons = () => (
//     <View style={styles.actionSection}>
//       {timeLeft < 10 && (
//         <Text style={styles.timerWarning}>Hurry! Time is running out</Text>
//       )}
      
//       <View style={styles.buttonRow}>
//         <TouchableOpacity 
//           style={[styles.button, styles.rejectButton]}
//           onPress={handleCancel}
//           disabled={loading}
//         >
//           <Text style={styles.rejectButtonText}>Reject</Text>
//         </TouchableOpacity>
        
//         <TouchableOpacity 
//           style={[styles.button, styles.acceptButton]}
//           onPress={handleAccept}
//           disabled={loading}
//         >
//           {loading ? (
//             <ActivityIndicator color="#fff" size="small" />
//           ) : (
//             <View style={styles.acceptButtonContent}>
//               <Text style={styles.acceptButtonText}>Accept Delivery</Text>
//               <View style={styles.amountBadge}>
//                 <Text style={styles.amountText}>₹{deliveryData?.amount}</Text>
//               </View>
//             </View>
//           )}
//         </TouchableOpacity>
//       </View>
//     </View>
//   );

//   return (
//     <SafeAreaView style={styles.container}>
//       <LoadingModal visible={loading} />
//       {renderHeader()}
//       <ScrollView 
//         style={styles.scrollView}
//         showsVerticalScrollIndicator={false}
//         contentContainerStyle={styles.scrollContent}
//       >
//         {renderMapCard()}
//         {renderRouteCard()}
//         {renderDeliveryDetails()}
//         {renderScheduleDetails()}
//       </ScrollView>
//       {renderActionButtons()}
//     </SafeAreaView>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#f8f9fa',
//   },
//   scrollView: {
//     flex: 1,
//   },
//   scrollContent: {
//     paddingBottom: 20,
//   },
//   header: {
//     backgroundColor: '#FFFFFF',
//     paddingHorizontal: 20,
//     paddingVertical: 16,
//     borderBottomWidth: 1,
//     borderBottomColor: '#E8E8E8',
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 3,
 
//   },
//   headerContent: {
//     flex: 1,
//   },
//   titleRow: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     marginBottom: 8,
//   },
//   titleBadge: {
//     backgroundColor: '#FF6B6B',
//     paddingHorizontal: 12,
//     paddingVertical: 6,
//     borderRadius: 12,
//   },
//   titleBadgeText: {
//     fontSize: 12,
//     fontWeight: '700',
//     color: '#FFFFFF',
//   },
//   timerBadge: {
//     backgroundColor: '#4CAF50',
//     paddingHorizontal: 12,
//     paddingVertical: 6,
//     borderRadius: 12,
//   },
//   timerCritical: {
//     backgroundColor: '#FF3B30',
//   },
//   timerText: {
//     fontSize: 14,
//     fontWeight: '700',
//     color: '#FFFFFF',
//   },
//   headerTitle: {
//     fontSize: 24,
//     fontFamily: font.MonolithRegular,
//     color: '#1A1A1A',
//     marginBottom: 4,
//   },
//   orderId: {
//     fontSize: 14,
//     color: '#666',
//     fontFamily: font.MonolithRegular,
//   },
//   routeCard: {
//     margin: 16,
//     marginTop: 8,
//     padding: 20,
//     backgroundColor: '#FFFFFF',
//     borderRadius: 16,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 4 },
//     shadowOpacity: 0.1,
//     shadowRadius: 8,
//     elevation: 4,
//   },
//   sectionTitle: {
//     fontSize: 18,
//     fontWeight: '700',
//     color: '#1A1A1A',
//     fontFamily: font.MonolithRegular,
//   },
//   locationRow: {
//     flexDirection: 'row',
//     alignItems: 'flex-start',
//     marginBottom: 8,
//   },
//   locationDot: {
//     width: 16,
//     height: 16,
//     borderRadius: 8,
//     marginRight: 12,
//     marginTop: 4,
//   },
//   pickupDot: {
//     backgroundColor: '#4CAF50',
//     borderWidth: 3,
//     borderColor: '#E8F5E8',
//   },
//   dropoffDot: {
//     backgroundColor: '#FF6B6B',
//     borderWidth: 3,
//     borderColor: '#FFE5E5',
//   },
//   locationContent: {
//     flex: 1,
//   },
//   locationType: {
//     fontSize: 12,
//     fontWeight: '600',
//     color: '#666',
//     marginBottom: 4,
//     textTransform: 'uppercase',
//   },
//   locationName: {
//     fontSize: 16,
//     fontFamily: font.MonolithRegular,
//     color: '#1A1A1A',
//     marginBottom: 4,
//   },
//   locationAddress: {
//     fontSize: 14,
//     color: '#666',
//     lineHeight: 18,
//     marginBottom: 8,
//     fontFamily: font.MonolithRegular,
//   },
//   contactButton: {
//     alignSelf: 'flex-start',
//   },
//   contactText: {
//     fontSize: 14,
//     color: '#007AFF',
//     fontWeight: '600',
//     fontFamily: font.MonolithRegular,
//   },
//   connectorLine: {
//     width: 2,
//     height: 20,
//     backgroundColor: '#E5E5E5',
//     marginLeft: 7,
//     marginBottom: 4,
//   },
//   mapCard: {
//     margin: 16,
//     marginBottom: 8,
//   },
//   mapHeader: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     marginBottom: 8,
//   },
//   distanceBadge: {
//     backgroundColor: '#007AFF',
//     paddingHorizontal: 12,
//     paddingVertical: 6,
//     borderRadius: 12,
//   },
//   distanceText: {
//     color: '#FFFFFF',
//     fontSize: 12,
//     fontWeight: '600',
//   },
//   mapContainer: {
//     height: 200,
//     borderRadius: 16,
//     overflow: 'hidden',
//     marginTop: 8,
//   },
//   map: {
//     flex: 1,
//   },
//   pickupMarker: {
//     backgroundColor: '#4CAF50',
//     padding: 8,
//     borderRadius: 20,
//     borderWidth: 3,
//     borderColor: '#FFFFFF',
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.3,
//     shadowRadius: 4,
//     elevation: 4,
//   },
//   dropoffMarker: {
//     backgroundColor: '#FF6B6B',
//     padding: 8,
//     borderRadius: 20,
//     borderWidth: 3,
//     borderColor: '#FFFFFF',
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.3,
//     shadowRadius: 4,
//     elevation: 4,
//   },
//   markerText: {
//     fontSize: 14,
//   },
//   detailsCard: {
//     margin: 16,
//     marginTop: 0,
//     marginBottom: 8,
//     padding: 20,
//     backgroundColor: '#FFFFFF',
//     borderRadius: 16,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 4 },
//     shadowOpacity: 0.1,
//     shadowRadius: 8,
//     elevation: 4,
//   },
//   detailsGrid: {
//     flexDirection: 'row',
//     flexWrap: 'wrap',
//     justifyContent: 'space-between',
//     marginTop: 8,
//   },
//   detailItem: {
//     width: '48%',
//     marginBottom: 16,
//   },
//   detailLabel: {
//     fontSize: 12,
//     color: '#666',
//     marginBottom: 4,
//     fontWeight: '500',
//     fontFamily: font.MonolithRegular,
//   },
//   detailValue: {
//     fontSize: 16,
//     fontWeight: '600',
//     color: '#1A1A1A',
//     fontFamily: font.MonolithRegular,
//   },
//   amountValue: {
//     color: '#4CAF50',
//   },
//   statusAccepted: {
//     color: '#4CAF50',
//   },
//   statusPending: {
//     color: '#FF9800',
//   },
//   actionSection: {
//     padding: 16,
//     borderTopWidth: 1,
//     borderTopColor: '#F0F0F0',
//     backgroundColor: '#FFFFFF',
//   },
//   buttonRow: {
//     flexDirection: 'row',
//     gap: 12,
//   },
//   button: {
//     flex: 1,
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'center',
//     padding: 18,
//     borderRadius: 16,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 4 },
//     shadowOpacity: 0.1,
//     shadowRadius: 8,
//     elevation: 4,
//   },
//   acceptButton: {
//     backgroundColor: '#FFCC00',
//   },
//   rejectButton: {
//     backgroundColor: '#FFFFFF',
//     borderWidth: 2,
//     borderColor: '#E5E5E5',
//   },
//   acceptButtonContent: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 8,
//   },
//   acceptButtonText: {
//     color: '#1A1A1A',
//     fontSize: 18,
//     fontFamily: font.MonolithRegular,
//     fontWeight: '700',
//   },
//   rejectButtonText: {
//     color: '#666',
//     fontSize: 18,
//     fontFamily: font.MonolithRegular,
//     fontWeight: '700',
//   },
//   amountBadge: {
//     backgroundColor: 'rgba(0, 0, 0, 0.1)',
//     paddingHorizontal: 8,
//     paddingVertical: 4,
//     borderRadius: 8,
//   },
//   amountText: {
//     color: '#1A1A1A',
//     fontSize: 14,
 //     fontFamily: font.MonolithRegular,
//   },
//   timerWarning: {
//     textAlign: 'center',
//     color: '#FF3B30',
//     fontSize: 14,
//     
//     marginBottom: 12,
//     fontFamily: font.MonolithRegular,
//   },
// });

// export default DeliveryRequest;