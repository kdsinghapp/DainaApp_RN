import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  TouchableOpacity,
  Image,
  Modal,
  ScrollView,
  Animated,
  RefreshControl,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import imageIndex from '../../../assets/imageIndex';
import { base_url } from '../../../Api';
import { color } from '../../../constant';
import StatusBarComponent from '../../../compoent/StatusBarCompoent';
import CustomHeader from '../../../compoent/CustomHeader';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { styles } from './style';
import { SafeAreaView } from 'react-native-safe-area-context';
import strings from '../../../localization/Localization';
import { successToast } from '../../../utils/customToast';
import { useNavigation } from '@react-navigation/native';
import ScreenNameEnum from '../../../routes/screenName.enum';
import font from '../../../theme/font';

export default function DocumentShow() {
  const navigation = useNavigation<any>();
  const [loading, setLoading] = useState(true);
  const [documents, setDocuments] = useState<any>({});
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [refreshing, setRefreshing] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState('');
  const [vehicleInfo, setVehicleInfo] = useState<any>(null);
  const [bankInfo, setBankInfo] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('identity');

  const tabs = [
    { id: 'identity', label: strings.Identity },
    { id: 'vehicle', label: strings.Vehicle },
    { id: 'bank', label: strings.Banking },
  ];

  const fetchDocuments = useCallback(async (isRefresh = false) => {
    try {
      if (!isRefresh) setLoading(true);
      const token = await AsyncStorage.getItem('token');

      if (!token) {
        setError(strings.SessionExpired);
        setLoading(false);
        return;
      }

      // 1. Fetch Identification Documents
      const docResponse = await fetch(`${base_url}/upload-document`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      const docResult = await docResponse.json();

      if (docResult.status == 1) {
        setDocuments(docResult?.documents || {});
        setVerificationStatus(docResult?.verificationStatus || 'pending');
      }

      // 2. Fetch Vehicle Setup
      const vehicleResponse = await fetch(`${base_url}/vehicle-setup`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      const vehicleResult = await vehicleResponse.json();
      if (vehicleResult.status == 1) {
        setVehicleInfo(vehicleResult?.data || vehicleResult);
      }
      const bankResponse = await fetch(`${base_url}/bank-setup`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      const bankResult = await bankResponse.json();
      if (bankResult.status == 1) {
        successToast(bankResult?.message)
        setBankInfo(bankResult?.data || bankResult);
      }

    } catch (err) {
      console.log('Fetch Error:', err);
      setError(strings.SomethingWentWrong);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  useEffect(() => {
    if (!loading) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
    }
  }, [loading, fadeAnim]);

  const getStatusInfo = (status: string) => {
    const s = status.toLowerCase();
    if (s === 'verified' || s === 'approved') {
      return { label: strings.Verified, badgeStyle: styles.verifiedBadge, textStyle: styles.verifiedText };
    }
    if (s === 'in_review' || s === 'review' || s === 'processing') {
      return { label: strings.InReview, badgeStyle: styles.reviewBadge, textStyle: styles.reviewText };
    }
    return { label: strings.Pending, badgeStyle: styles.pendingBadge, textStyle: styles.pendingText };
  };

  const DocumentCard = ({ title, imageUrl, icon, status }: any) => {

    return (
      <Animated.View style={[styles.card, { opacity: fadeAnim }]}>
        <View style={styles.cardHeader}>
          <View style={styles.titleContainer}>
            <View style={styles.iconContainer}>{icon}</View>
            <Text style={styles.cardTitle}>{title}</Text>
          </View>

        </View>

        <TouchableOpacity
          style={styles.docImageWrapper}
          onPress={() => imageUrl && setSelectedImage(imageUrl)}
          activeOpacity={0.9}
        >
          <Image
            source={imageUrl ? { uri: imageUrl } : imageIndex.Addressicone}
            style={styles.image}
            resizeMode="cover"
          />
          <View style={styles.imageOverlay}>
            <Text style={styles.overlayText}>{strings.TapToEnlarge}</Text>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const VehicleCard = ({ data }: any) => {
    if (!data) return <EmptyState buttonText="Set Up Vehicle Details" onPress={() => navigation.navigate(ScreenNameEnum.VehicleSetupScreen)} />;
    const statusInfo = getStatusInfo(data.verificationStatus || 'pending');

    return (
      <Animated.View style={[styles.card, { opacity: fadeAnim }]}>
        <View style={styles.cardHeader}>
          <View style={styles.titleContainer}>
            <View style={styles.iconContainer}>
              <Icon name="directions-car" size={24} color="#FFCC00" />
            </View>
            <Text style={styles.cardTitle}>{strings.VehicleInformation}</Text>
          </View>

        </View>

        <View style={styles.infoGrid}>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>{strings?.VehicleType}</Text>
            <Text style={styles.infoValue}>{data?.vehicleType || ''}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>{strings.VehicleNumber}</Text>
            <Text style={styles.infoValue}>{data?.vehicleNumber || ''}</Text>
          </View>
          {data?.vehicleModel && (
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>{strings.Model}</Text>
              <Text style={styles.infoValue}>{data?.vehicleModel}</Text>
            </View>
          )}
          {data?.vehicleColor && (
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>{strings.Color}</Text>
              <Text style={styles.infoValue}>{data?.vehicleColor}</Text>
            </View>
          )}
        </View>

        {data?.vehicleRegistration && (
          <TouchableOpacity
            style={styles.docImageWrapper}
            onPress={() => setSelectedImage(data?.vehicleRegistration)}
            activeOpacity={0.9}
          >
            <Image
              source={{ uri: data?.vehicleRegistration }}
              style={styles.image}
              resizeMode="cover"
            />
            <View style={styles.imageOverlay}>
              <Text style={styles.overlayText}>{strings.RegistrationPaper}</Text>
            </View>
          </TouchableOpacity>
        )}
      </Animated.View>
    );
  };

  const BankCard = ({ data }: any) => {
    if (!data) return <EmptyState buttonText="Set Up Bank Details" onPress={() => navigation.navigate(ScreenNameEnum.BankSetupScreen)} />;

    return (
      <Animated.View style={[styles.bankCard, { opacity: fadeAnim }]}>
        <View style={styles.bankHeader}>
          <Text style={styles.bankName}>{data.bankName || strings.YourBank}</Text>
          <View style={styles.bankChip} />
        </View>

        <Text style={styles.accountNumber}>
          {data.bankAccountNumber ? `**** **** ${data.bankAccountNumber.slice(-4)}` : '**** **** **** ****'}
        </Text>

        <View style={styles.bankFooter}>
          <View>
            <Text style={styles.bankLabel}>{strings.AccountHolder}</Text>
            <Text style={styles.bankValue}>DRIVER PARTNER</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.bankLabel}>{strings.IFSCCode}</Text>
            <Text style={styles.bankValue}>{data.bankIfscCode || ''}</Text>
          </View>
        </View>
      </Animated.View>
    );
  };

  const EmptyState = ({ buttonText, onPress }: { buttonText?: string; onPress?: () => void }) => (
    <View style={styles.emptyContainer}>
      <Icon name="cloud-off" size={64} color="#E0E0E0" />
      <Text style={styles.emptyTitle}>{strings.NoDataFound}</Text>
      <Text style={styles.emptySubtitle}>{strings.InfoWillAppearHere}</Text>
      {buttonText && onPress && (
        <TouchableOpacity
          style={{
            backgroundColor: color.primary,
            paddingVertical: 12,
            paddingHorizontal: 24,
            borderRadius: 12,
            marginTop: 20,
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onPress={onPress}
          activeOpacity={0.8}
        >
          <Text style={{
            color: '#000',
            fontSize: 15,
            fontFamily: font.MonolithRegular,
            textAlign: "center",
          }}>
            {buttonText}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchDocuments(true);
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#FFCC00" />
        <Text style={styles.loadingText}>{strings.FetchingDetails}</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBarComponent />
      <CustomHeader label={strings.MyDocuments} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#FFCC00']} />
        }
      >
        <View style={styles.tabContainer}>
          {tabs?.map((tab) => (
            <TouchableOpacity
              key={tab.id}
              style={[styles.tabButton, activeTab === tab?.id && styles.activeTabButton]}
              onPress={() => setActiveTab(tab.id)}
              activeOpacity={0.7}
            >
              <Text style={[styles.tabText, activeTab === tab?.id && styles.activeTabText]}>
                {tab?.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {activeTab === 'identity' && (
          <>
            <Text style={styles.sectionTitle}>{strings.Identification}</Text>
            {documents?.drivingLicense || documents?.idDocument || documents?.vehiclePapers ? (
              <>
                {documents?.drivingLicense && (
                  <DocumentCard
                    title={strings.DrivingLicense}
                    imageUrl={documents?.drivingLicense}
                    icon={<Icon name="assignment-ind" size={24} color="#FFCC00" />}
                    status={verificationStatus}
                  />
                )}
                {documents?.idDocument && (
                  <DocumentCard
                    title={strings.IDDocument}
                    imageUrl={documents?.idDocument}
                    icon={<Icon name="badge" size={24} color="#FFCC00" />}
                    status={verificationStatus}
                  />
                )}
                {documents?.vehiclePapers && (
                  <DocumentCard
                    title={strings.VehiclePapers}
                    imageUrl={documents?.vehiclePapers}
                    icon={<Icon name="description" size={24} color="#FFCC00" />}
                    status={verificationStatus}
                  />
                )}
              </>
            ) : <EmptyState buttonText="Upload Identity Documents" onPress={() => navigation.navigate(ScreenNameEnum.UploadDocumentsScreen)} />}
          </>
        )}

        {activeTab === 'vehicle' && (
          <>
            <Text style={styles.sectionTitle}>{strings?.Vehicle}</Text>
            <VehicleCard data={vehicleInfo} />
          </>
        )}

        {activeTab === 'bank' && (
          <>
            <Text style={styles.sectionTitle}>{strings?.Banking}</Text>
            <BankCard data={bankInfo} />
          </>
        )}
      </ScrollView>

      <Modal
        visible={!!selectedImage}
        transparent
        animationType="fade"
        statusBarTranslucent
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setSelectedImage(null)}
            >
              <Icon name="close" size={24} color="#FFF" />
            </TouchableOpacity>
          </View>
          <Image
            source={{ uri: selectedImage || '' }}
            style={styles.fullImage}
            resizeMode="contain"
          />
        </View>
      </Modal>
    </SafeAreaView>
  );
}
