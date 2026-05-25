import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Rect, Line } from "react-native-svg";
import StatusBarComponent from "../../../compoent/StatusBarCompoent";
import font from "../../../theme/font";
import CustomHeader from "../../../compoent/CustomHeader";
import strings from "../../../localization/Localization";

const EarningsScreen = () => {
  const [loading, setLoading] = useState(true);
  const [earnings, setEarnings] = useState(null);

  useEffect(() => {
    // Simulate API fetch
    setTimeout(() => {
      setEarnings({
        total: 502.0,
        growth: 37.8,
        weeklyActivity: [100, 200, 300, 400, 350, 300, 250],
        stats: {
          hours: "8:30",
          trips: 15,
          cashTrip: 22.48,
        },
        breakdown: [

        ],
      });
      setLoading(false);
    }, 1000);
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#FFD600" />
      </View>
    );
  }

  const chartHeight = 180;
  const barWidth = 25;
  const spacing = 25;
  const maxValue = Math.max(...earnings.weeklyActivity);
  const scaleY = (val) => (val / maxValue) * chartHeight;

  return (
    <SafeAreaView style={{
      flex: 1,
      backgroundColor: "white"
    }}>
      <StatusBarComponent />
      <CustomHeader label={strings.Earnings} />

      <ScrollView

        showsVerticalScrollIndicator={false}
        style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{strings.TotalEarnings}</Text>
          <Text style={styles.amount}>$ 00</Text>
        </View>
        <Text style={styles.growth}>↑ 0% {strings.ThisWeek}</Text>

        {/* Chart */}
        <View style={{
          borderWidth: 0.6,
          borderColor: "#E4E5E7",
          marginBottom: 8,
          marginTop: 6

        }} />
        <Text style={{
          color: "#4D4D4D",
          marginTop: 20
        }}>{strings.Activity}</Text>

        <View style={styles.chartWrapper}>
          <Svg height={chartHeight + 20} width="100%">
            {[0].map((p, i) => (
              <Line
                key={i}
                x1="0"
                x2="100%"
                y1={chartHeight * p}
                y2={chartHeight * p}
                stroke="#eee"
                strokeWidth="1"
              />
            ))}

            {/* Bars */}
            {earnings.weeklyActivity.map((val, i) => {
              const barHeight = scaleY(val);
              return (
                <Rect
                  key={i}
                  x={i * (barWidth + spacing) + 30}
                  y={chartHeight - barHeight}
                  width={barWidth}
                  height={barHeight}
                  fill="#FFD600"
                  rx="6"
                />
              );
            })}
          </Svg>
          <View style={styles.chartLabels}>
            {[strings.Sun, strings.Mon, strings.Tue, strings.Wed, strings.Thu, strings.Fri, strings.Sat].map((d, i) => (
              <Text key={i} style={styles.dayLabel}>
                {d}
              </Text>
            ))}
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>00</Text>
            <Text style={styles.statLabel}>{strings.OnlineHrs}</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>0</Text>
            <Text style={styles.statLabel}>{strings.Trips}</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>$ 00</Text>
            <Text style={styles.statLabel}>{strings.CashTrip}</Text>
          </View>
        </View>

        {/* Breakdown */}
        <View style={styles.breakdown}>
          {earnings.breakdown.map((item, i) => (
            <View style={styles.breakdownRow} key={i}>
              <Text style={styles.breakdownLabel}>{item.label}</Text>
              <Text style={[styles.breakdownValue, { color: item.value < 0 ? "red" : "#000" }]}>
                ${item.value.toFixed(2)}
              </Text>
            </View>
          ))}
          <View style={styles.breakdownRow}>
            <Text style={[styles.breakdownLabel, {
              fontFamily: font.MonolithRegular
              , color: "green"
            }]}>
              {strings.TotalEarnings}
            </Text>
            <Text style={[styles.breakdownValue, {
              fontFamily: font.MonolithRegular
              , color: "green"
            }]}>
              $ 00
              {/* {(earnings.total + 0).toFixed(2)} */}
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", padding: 15 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  headerTitle: {
    fontSize: 18, fontFamily: font.MonolithRegular
    , color: "#000"
  },
  amount: {
    fontSize: 22, fontFamily: font.MonolithRegular
    , color: "#000"
  },
  growth: { color: "#34C759", marginBottom: 15, marginTop: 5 },
  chartWrapper: { marginBottom: 20, alignItems: "center" },
  chartLabels: { flexDirection: "row", justifyContent: "space-around", marginTop: 10, width: "100%" },
  dayLabel: { fontSize: 12, color: "#666" },
  statsRow: { flexDirection: "row", justifyContent: "space-around", paddingVertical: 15 },
  statBox: { alignItems: "center" },
  statValue: {
    fontSize: 18, fontFamily: font.MonolithRegular
  },
  statLabel: { fontSize: 12, color: "#666", marginTop: 8 },
  breakdown: { marginTop: 10 },
  breakdownRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 0.6,
    borderBottomColor: "#eee",
    marginTop: 10
  },
  breakdownLabel: { fontSize: 14, color: "#AFB1B0", fontFamily: font.MonolithRegular },
  breakdownValue: { fontSize: 14, fontFamily: font.MonolithRegular },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
});

export default EarningsScreen;
