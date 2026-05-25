import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Alert, Dimensions, Linking } from 'react-native';
import {
    widthPercentageToDP as wp,
    heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import { trigger } from 'react-native-haptic-feedback';
import moment from 'moment';


const { height, width, fontScale, scale } = Dimensions.get('screen');

export const restrictInput = (val: any, type = '') => {
    switch (type) {
        case 'Number':
            return val?.replace(/[^0-9]/g, '');
        case 'Space':
            return;
        case 'Special Character':
            return val?.replace(/[`~0-9!@#$%^&*()_"'|+\-=?;:,.<>\{\}\[\]\\\/]/gi, '');
        case 'script':
            return val?.replace(/[`~#$%&*()|\<>\{\}\[\]\\\/]/gi, '');
        default:
            return errorToast('Value not found');
    }
};
const impactOptions = {
    light_both: 'impactlight',
    medium_both: 'impactMedium',
    heavy_both: 'impactHeavy',
    rigid_both: 'rigid',
    soft_both: 'soft',
    notification_success_both: 'notificationSuccess',
    notification_warning_both: 'notificationWarning',
    notification_error: 'notificationError',
};
const hapticFeedback = (impact = 'impactLight') => {
    return trigger(impact, {
        enableVibrateFallback: true,
        ignoreAndroidSystemSettings: false,
    });
};
const regex = {
    email: /^[a-zA-Z0-9+_.-]+@[a-zA-Z0-9.-]+$/g,
};
const getExtension = (val = '') => {
    let extension = val?.split('.')?.pop()?.toUpperCase();
    return extension;
};
const getName = (val = '') => {
    let name = val?.split('.')?.shift();
    return name;
};

const UTCFormat = (timeStamp = 1683526848) => {
    let dateTime = new Date(timeStamp * 1000);
    return dateTime?.toISOString();
};

const calculateDuration = event_time =>
    moment.duration(
        Math.max(event_time - Math.floor(Date.now() / 1000), 0),
        'seconds',
    );

const Countdown = ({ eventTime = 1683526848, interval = 1000 }) => {
    const [duration, setDuration] = useState(calculateDuration(eventTime));
    const timerRef = useRef(0);
    const timerCallback = useCallback(() => {
        setDuration(calculateDuration(eventTime));
    }, [eventTime]);

    useEffect(() => {
        timerRef.current = setInterval(timerCallback, interval);

        return () => {
            clearInterval(timerRef.current);
        };
    }, [eventTime]);

    return (
        <Text size={14} color="#FFF">
            This class start in - {duration.days()}D : {duration.hours()}H :{' '}
            {duration.minutes()}M : {duration.seconds()}S
        </Text>
    );
};
const getCloser = (value: any, checkOne: any, checkTwo: any) =>
    Math.abs(value - checkOne) < Math.abs(value - checkTwo) ? checkOne : checkTwo;

const openDialer = (phoneNumber: any) => {
    const cleanedNumber = phoneNumber.replace(/\s+/g, '');

    const phoneUrl = `tel:${cleanedNumber}`;

    Linking.openURL(phoneUrl).catch(() =>
        Alert.alert('Error', 'Unable to open dialer')
    );
};


import strings from '../localization/Localization';
import { errorToast } from './customToast';

// constants/statusConstants.js
export const STATUS = {
    PENDING: 'pending',
    ASSIGNED: 'assigned',
    GOING_TO_PICKUP: 'going_to_pickup',
    PICKED_UP: 'picked_up',
    ON_THE_WAY: 'on_the_way',
    ARRIVING: 'arriving',
    DELIVERED: 'delivered',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled'
};

export const STATUS_LABELS = {
    get [STATUS.PENDING]() { return strings.StatusPending; },
    get [STATUS.ASSIGNED]() { return strings.StatusAssigned; },
    get [STATUS.GOING_TO_PICKUP]() { return strings.StatusGoingToPickup; },
    get [STATUS.PICKED_UP]() { return strings.StatusPickedUp; },
    get [STATUS.ON_THE_WAY]() { return strings.StatusOnTheWay; },
    get [STATUS.ARRIVING]() { return strings.StatusArriving; },
    get [STATUS.DELIVERED]() { return strings.StatusDelivered; },
    get [STATUS.COMPLETED]() { return strings.StatusCompleted; },
    get [STATUS.CANCELLED]() { return strings.StatusCancelled; },
};

export const STATUS_COLORS = {
    [STATUS.PENDING]: '#FF9500', // Orange
    [STATUS.ASSIGNED]: '#007AFF', // Blue
    [STATUS.GOING_TO_PICKUP]: '#5856D6', // Purple
    [STATUS.PICKED_UP]: '#34C759', // Green
    [STATUS.ON_THE_WAY]: '#5AC8FA', // Light Blue
    [STATUS.ARRIVING]: '#FF2D55', // Pink
    [STATUS.DELIVERED]: '#32D74B', // Bright Green
    [STATUS.COMPLETED]: '#64D2FF', // Sky Blue
    [STATUS.CANCELLED]: '#FF3B30' // Red
};

export const STATUS_ICONS = {
    [STATUS.PENDING]: 'time-outline',
    [STATUS.ASSIGNED]: 'person-outline',
    [STATUS.GOING_TO_PICKUP]: 'car-outline',
    [STATUS.PICKED_UP]: 'cube-outline',
    [STATUS.ON_THE_WAY]: 'navigate-outline',
    [STATUS.ARRIVING]: 'location-outline',
    [STATUS.DELIVERED]: 'checkmark-circle-outline',
    [STATUS.COMPLETED]: 'flag-outline',
    [STATUS.CANCELLED]: 'close-circle-outline'
};
export {
    hp,
    wp,
    height,
    width,
    fontScale as fs,
    scale as s,
    hapticFeedback,
    impactOptions,
    regex,
    getExtension,
    getName,
    UTCFormat,
    Countdown,
    getCloser,
    openDialer
};