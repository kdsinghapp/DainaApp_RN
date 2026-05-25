import { StyleSheet } from "react-native";
import { color } from "../../../constant";
import font from "../../../theme/font";

export const styles = StyleSheet.create({
    safeContainer: {
        flex: 1,
        backgroundColor: 'white',
    },
    container: {
        flex: 1,
        padding: 15,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#ebebeb',
        borderRadius: 25,
        paddingHorizontal: 12,
        height: 55,
        borderColor: "#7D9A9B",
        marginTop: 20,
        borderWidth: 0.8,
    },
    searchInput: {
        flex: 1,
        fontSize: 14,

    },
    headerText: {
        fontSize: 15,
        color: '#333333',
        fontFamily: font.TrialDemiBold,
        marginTop: 20,
        lineHeight: 20
    },

});

