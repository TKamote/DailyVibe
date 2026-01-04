import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useTheme } from '../lib/theme';
import { PRIVACY_POLICY_CONTENT } from '../lib/privacyPolicy';

interface PrivacyPolicyScreenProps {
  navigation: any;
}

export const PrivacyPolicyScreen: React.FC<PrivacyPolicyScreenProps> = ({ navigation }) => {
  const { theme } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.topHeader, { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.border }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
          style={styles.backButton}
        >
          <Text style={[styles.backButtonText, { color: theme.colors.primary }]}>← Back</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Privacy Policy</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
      >
        <Text style={[styles.lastUpdated, { color: theme.colors.textSecondary }]}>
          Last Updated: January 4, 2026
        </Text>

      {PRIVACY_POLICY_CONTENT.map((section, index) => (
        <View key={index} style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            {section.title}
          </Text>
          <Text style={[styles.sectionText, { color: theme.colors.textSecondary }]}>
            {section.content}
          </Text>
        </View>
      ))}

      <View style={[styles.contact, { borderTopColor: theme.colors.border }]}>
        <Text style={[styles.contactTitle, { color: theme.colors.text }]}>Contact Us</Text>
        <Text style={[styles.contactText, { color: theme.colors.textSecondary }]}>
          If you have questions about this Privacy Policy, please contact us at:
        </Text>
        <Text style={[styles.contactEmail, { color: theme.colors.primary }]}>
          david@pdfreportmaker.com
        </Text>
      </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topHeader: {
    paddingTop: 60,
    paddingBottom: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    minWidth: 80,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  lastUpdated: {
    fontSize: 14,
    marginBottom: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 12,
  },
  sectionText: {
    fontSize: 15,
    lineHeight: 22,
  },
  contact: {
    marginTop: 24,
    paddingTop: 24,
    borderTopWidth: 1,
  },
  contactTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
  },
  contactText: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 8,
  },
  contactEmail: {
    fontSize: 16,
    fontWeight: '500',
  },
});

