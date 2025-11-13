import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSelector, useDispatch } from 'react-redux';
import { updateDevice } from '../services/localStorage';

export default function ProfileScreen() {
  const dispatch = useDispatch();
  const device = useSelector((state) => state.app.device);
  const deviceId = useSelector((state) => state.app.deviceId);
  const [school, setSchool] = useState('');
  const [major, setMajor] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (device) {
      setSchool(device.school || '');
      setMajor(device.major || '');
    }
  }, [device]);

  const formatDate = (timestamp) => {
    if (!timestamp) return '로딩 중...';
    const date = new Date(timestamp);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };

  const handleSave = async () => {
    if (!deviceId) {
      Alert.alert('오류', '기기 정보를 불러올 수 없습니다.');
      return;
    }

    setIsSaving(true);
    try {
      await updateDevice(deviceId, {
        school: school.trim() || null,
        major: major.trim() || null,
      });

      // Redux store 업데이트
      const { getDevice } = await import('../services/deviceService');
      const updatedDevice = await getDevice(deviceId);
      dispatch({ type: 'SET_DEVICE', payload: updatedDevice });

      setIsEditing(false);
      Alert.alert('성공', '학교/학과 정보가 저장되었습니다.');
    } catch (error) {
      Alert.alert('오류', `저장 실패: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* 프로필 카드 - 그라데이션 */}
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.profileCard}
      >
        <View style={styles.profileIconContainer}>
          <Text style={styles.profileIcon}>👤</Text>
        </View>
        <Text style={styles.deviceIdLabel}>기기 ID</Text>
        <Text style={styles.deviceId} numberOfLines={1} ellipsizeMode="middle">
          {deviceId || '로딩 중...'}
        </Text>
      </LinearGradient>

      {/* 통계 카드 */}
      <View style={styles.statsCard}>
        <Text style={styles.statsTitle}>📊 내 통계</Text>

        <View style={styles.statRow}>
          <LinearGradient
            colors={['#fbbf24', '#f59e0b']}
            style={styles.statIconContainer}
          >
            <Text style={styles.statIcon}>⭐</Text>
          </LinearGradient>
          <View style={styles.statInfo}>
            <Text style={styles.statLabel}>포인트</Text>
          </View>
          <Text style={styles.statValue}>{device?.points || 0}P</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.statRow}>
          <LinearGradient
            colors={['#3b82f6', '#2563eb']}
            style={styles.statIconContainer}
          >
            <Text style={styles.statIcon}>🗳️</Text>
          </LinearGradient>
          <View style={styles.statInfo}>
            <Text style={styles.statLabel}>총 투표 수</Text>
          </View>
          <Text style={styles.statValue}>{device?.totalVotes || 0}회</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.statRow}>
          <LinearGradient
            colors={['#10b981', '#059669']}
            style={styles.statIconContainer}
          >
            <Text style={styles.statIcon}>✅</Text>
          </LinearGradient>
          <View style={styles.statInfo}>
            <Text style={styles.statLabel}>총 출석 수</Text>
          </View>
          <Text style={styles.statValue}>{device?.totalCheckins || 0}회</Text>
        </View>
      </View>

      {/* 학교/학과 설정 */}
      <View style={styles.schoolCard}>
        <View style={styles.schoolCardHeader}>
          <Text style={styles.schoolCardTitle}>🏫 학교/학과 정보</Text>
          {!isEditing ? (
            <TouchableOpacity
              onPress={() => setIsEditing(true)}
              style={styles.editButton}
            >
              <Text style={styles.editButtonText}>수정</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.editActions}>
              <TouchableOpacity
                onPress={() => {
                  setIsEditing(false);
                  setSchool(device?.school || '');
                  setMajor(device?.major || '');
                }}
                style={styles.cancelButton}
              >
                <Text style={styles.cancelButtonText}>취소</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSave}
                disabled={isSaving}
                style={[styles.saveButton, isSaving && styles.buttonDisabled]}
              >
                <Text style={styles.saveButtonText}>
                  {isSaving ? '저장 중...' : '저장'}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>학교</Text>
          {isEditing ? (
            <TextInput
              style={styles.textInput}
              placeholder="예: 서울대학교"
              placeholderTextColor="#94a3b8"
              value={school}
              onChangeText={setSchool}
            />
          ) : (
            <Text style={styles.inputValue}>
              {device?.school || '미설정'}
            </Text>
          )}
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>학과</Text>
          {isEditing ? (
            <TextInput
              style={styles.textInput}
              placeholder="예: 컴퓨터공학과"
              placeholderTextColor="#94a3b8"
              value={major}
              onChangeText={setMajor}
            />
          ) : (
            <Text style={styles.inputValue}>
              {device?.major || '미설정'}
            </Text>
          )}
        </View>

        {!isEditing && (!device?.school || !device?.major) && (
          <View style={styles.infoBox}>
            <Text style={styles.infoText}>
              💡 학교/학과 정보를 설정하면 통계 기능을 이용할 수 있습니다.
            </Text>
          </View>
        )}
      </View>

      {/* 활동 정보 */}
      {device && (
        <View style={styles.activityCard}>
          <Text style={styles.activityTitle}>📅 활동 정보</Text>
          <View style={styles.activityRow}>
            <Text style={styles.activityLabel}>가입일</Text>
            <Text style={styles.activityValue}>
              {formatDate(device.createdAt)}
            </Text>
          </View>
          <View style={styles.activityRow}>
            <Text style={styles.activityLabel}>마지막 활동</Text>
            <Text style={styles.activityValue}>
              {formatDate(device.lastActiveAt)}
            </Text>
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
    padding: 20,
  },
  profileCard: {
    padding: 32,
    borderRadius: 24,
    marginBottom: 20,
    alignItems: 'center',
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  profileIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  profileIcon: {
    fontSize: 50,
  },
  deviceIdLabel: {
    fontSize: 12,
    color: '#fff',
    opacity: 0.9,
    marginBottom: 8,
    fontWeight: '600',
  },
  deviceId: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  statsCard: {
    backgroundColor: '#fff',
    padding: 24,
    borderRadius: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  statsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#1e293b',
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  statIcon: {
    fontSize: 24,
  },
  statInfo: {
    flex: 1,
  },
  statLabel: {
    fontSize: 16,
    color: '#1e293b',
    fontWeight: '600',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#3b82f6',
  },
  divider: {
    height: 1,
    backgroundColor: '#e2e8f0',
    marginVertical: 8,
  },
  activityCard: {
    backgroundColor: '#fff',
    padding: 24,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  activityTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#1e293b',
  },
  activityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  activityLabel: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '600',
  },
  activityValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  schoolCard: {
    backgroundColor: '#fff',
    padding: 24,
    borderRadius: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  schoolCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  schoolCardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  editButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
  },
  editButtonText: {
    color: '#3b82f6',
    fontSize: 14,
    fontWeight: '600',
  },
  editActions: {
    flexDirection: 'row',
    gap: 8,
  },
  cancelButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
  },
  cancelButtonText: {
    color: '#64748b',
    fontSize: 14,
    fontWeight: '600',
  },
  saveButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#3b82f6',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    color: '#1e293b',
    backgroundColor: '#f8fafc',
  },
  inputValue: {
    fontSize: 16,
    color: '#1e293b',
    fontWeight: '600',
    paddingVertical: 8,
  },
  infoBox: {
    backgroundColor: '#f0f9ff',
    padding: 12,
    borderRadius: 12,
    marginTop: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
  },
  infoText: {
    fontSize: 13,
    color: '#0369a1',
    lineHeight: 18,
  },
});
