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
import StatusBarComponent from '../../../compoent/StatusBarCompoent';
import CustomHeader from '../../../compoent/CustomHeader';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { styles } from './style';
import { SafeAreaView } from 'react-native-safe-area-context';
import strings from '../../../localization/Localization';
import { useNavigation } from '@react-navigation/native';
import ScreenNameEnum from '../../../routes/screenName.enum';
import NewOrderNotificationModal from '../../../compoent/NewOrderNotificationModal';
import OfferAcceptedModal from '../../../compoent/OfferAcceptedModal';

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
    { id: 'identity', label: strings.Identity, icon: 'badge' },
    { id: 'vehicle', label: strings.Vehicle, icon: 'directions-car' },
    { id: 'bank', label: strings.Banking, icon: 'account-balance' },
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
    const statusInfo = getStatusInfo(status || verificationStatus || 'pending');

    return (
      <Animated.View style={[styles.card, { opacity: fadeAnim }]}>
        <View style={styles.cardHeader}>
          <View style={styles.titleContainer}>
            <View style={styles.iconContainer}>{icon}</View>
            <View style={styles.cardTitleBlock}>
              <Text style={styles.cardTitle}>{title}</Text>
              <Text style={styles.cardSubtitle}>{strings.DocumentUploaded}</Text>
            </View>
          </View>
          <View style={[styles.statusBadge, statusInfo.badgeStyle]}>
            <Text style={[styles.statusText, statusInfo.textStyle]}>{statusInfo.label}</Text>
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
            <Icon name="zoom-out-map" size={16} color="#FFFFFF" />
            <Text style={styles.overlayText}>{strings.TapToEnlarge}</Text>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const VehicleCard = ({ data }: any) => {
    if (!data) return <EmptyState buttonText={strings.SetUpVehicleDetails} onPress={() => navigation.navigate(ScreenNameEnum.VehicleSetupScreen)} />;
    const statusInfo = getStatusInfo(data.verificationStatus || 'pending');

    return (
      <Animated.View style={[styles.vehicleCard, { opacity: fadeAnim }]}>
        <View style={styles.vehicleHero}>
          <View style={styles.vehicleHeroTop}>
            <View style={styles.vehicleIconLarge}>
              <Icon name="directions-car" size={32} color="#111827" />
            </View>
            <View style={[styles.vehicleStatusBadge, statusInfo.badgeStyle]}>
              <Text style={[styles.statusText, statusInfo.textStyle]}>{statusInfo.label}</Text>
            </View>
          </View>
          <Text style={styles.vehicleHeroLabel}>{strings.VehicleInformation}</Text>
          <Text style={styles.vehiclePlate}>{data?.vehicleNumber || '--'}</Text>
          <Text style={styles.vehicleTypeText}>{data?.vehicleType || strings.Vehicle}</Text>
        </View>

        <View style={styles.vehicleDetailGrid}>
          <View style={styles.vehicleDetailItem}>
            <View style={styles.vehicleDetailIcon}>
              <Icon name="commute" size={18} color="#111827" />
            </View>
            <View style={styles.vehicleDetailTextWrap}>
              <Text style={styles.infoLabel}>{strings?.VehicleType}</Text>
              <Text style={styles.infoValue}>{data?.vehicleType || '--'}</Text>
            </View>
          </View>

          <View style={styles.vehicleDetailItem}>
            <View style={styles.vehicleDetailIcon}>
              <Icon name="pin" size={18} color="#111827" />
            </View>
            <View style={styles.vehicleDetailTextWrap}>
              <Text style={styles.infoLabel}>{strings.VehicleNumber}</Text>
              <Text style={styles.infoValue}>{data?.vehicleNumber || ''}</Text>
            </View>
          </View>

          {data?.vehicleModel && (
            <View style={styles.vehicleDetailItem}>
              <View style={styles.vehicleDetailIcon}>
                <Icon name="local-offer" size={18} color="#111827" />
              </View>
              <View style={styles.vehicleDetailTextWrap}>
                <Text style={styles.infoLabel}>{strings.Model}</Text>
                <Text style={styles.infoValue}>{data?.vehicleModel}</Text>
              </View>
            </View>
          )}

          {data?.vehicleColor && (
            <View style={styles.vehicleDetailItem}>
              <View style={styles.vehicleDetailIcon}>
                <Icon name="palette" size={18} color="#111827" />
              </View>
              <View style={styles.vehicleDetailTextWrap}>
                <Text style={styles.infoLabel}>{strings.Color}</Text>
                <Text style={styles.infoValue}>{data?.vehicleColor}</Text>
              </View>
            </View>
          )}
        </View>

        {data?.vehicleRegistration && (
          <TouchableOpacity
            style={styles.vehicleDocumentPreview}
            onPress={() => setSelectedImage(data?.vehicleRegistration)}
            activeOpacity={0.9}
          >
            <Image
              source={{ uri: data?.vehicleRegistration }}
              style={styles.vehicleDocumentImage}
              resizeMode="cover"
            />
            <View style={styles.vehicleDocOverlay}>
              <View style={styles.vehicleDocTitle}>
                <Icon name="article" size={17} color="#FFFFFF" />
                <Text style={styles.overlayText}>{strings.RegistrationPaper}</Text>
              </View>
              <View style={styles.vehicleZoomPill}>
                <Icon name="zoom-out-map" size={14} color="#111827" />
              </View>
            </View>
          </TouchableOpacity>
        )}
      </Animated.View>
    );
  };

  const BankCard = ({ data }: any) => {
    if (!data) return <EmptyState buttonText={strings.SetUpBankDetails} onPress={() => navigation.navigate(ScreenNameEnum.BankSetupScreen)} />;

    return (
      <Animated.View style={[styles.bankCard, { opacity: fadeAnim }]}>
        <View style={styles.bankHeader}>
          <View>
            <Text style={styles.bankLabel}>{strings.YourBank}</Text>
            <Text style={styles.bankName}>{data.bankName || strings.YourBank}</Text>
          </View>
          <View style={styles.bankChip}>
            <Icon name="account-balance" size={24} color="#111827" />
          </View>
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
      <View style={styles.emptyIconWrap}>
        <Icon name="cloud-off" size={40} color="#9CA3AF" />
      </View>
      <Text style={styles.emptyTitle}>{strings.NoDataFound}</Text>
      <Text style={styles.emptySubtitle}>{strings.InfoWillAppearHere}</Text>
      {buttonText && onPress && (
        <TouchableOpacity
          style={styles.emptyButton}
          onPress={onPress}
          activeOpacity={0.8}
        >
          <Text style={styles.emptyButtonText}>{buttonText}</Text>
          <Icon name="arrow-forward" size={18} color="#111827" />
        </TouchableOpacity>
      )}
    </View>
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchDocuments(true);
  };

  const identityDocCount = [
    documents?.drivingLicense,
    documents?.idDocument,
    documents?.vehiclePapers,
  ].filter(Boolean).length;
  const completedSections = [
    identityDocCount > 0,
    Boolean(vehicleInfo),
    Boolean(bankInfo),
  ].filter(Boolean).length;

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
      <NewOrderNotificationModal />
      <OfferAcceptedModal />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#FFCC00']} />
        }
      >

        <View style={styles.heroCard}>
          <View style={styles.heroIconWrap}>
            <Icon name="verified-user" size={30} color="#111827" />
          </View>
          <View style={styles.heroTextWrap}>
            <Text style={styles.heroTitle}>{strings.MyDocuments}</Text>
            <Text style={styles.heroSubtitle}>{strings.DocumentShowSubtitle}</Text>
          </View>
          <View style={styles.heroCountPill}>
            <Text style={styles.heroCount}>{completedSections}/3</Text>
          </View>
        </View>

        <View style={styles.tabContainer}>
          {tabs?.map((tab) => (
            <TouchableOpacity
              key={tab.id}
              style={[styles.tabButton, activeTab === tab?.id && styles.activeTabButton]}
              onPress={() => setActiveTab(tab.id)}
              activeOpacity={0.7}
            >
              <Icon
                name={tab.icon}
                size={18}
                color={activeTab === tab?.id ? '#111827' : '#64748B'}
              />
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
            ) : <EmptyState buttonText={strings.UploadIdentityDocuments} onPress={() => navigation.navigate(ScreenNameEnum.UploadDocumentsScreen)} />}
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
