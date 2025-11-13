import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { submitCheckin, hasCheckedInToday } from '../services/checkinService';
import { getLatestOpenQuestion, getHotVotes } from '../services/questionService';
import { AppConstants } from '../utils/constants';

export default function HomeScreen() {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const device = useSelector((state) => state.app.device);
  const currentQuestion = useSelector((state) => state.app.currentQuestion);
  const deviceId = useSelector((state) => state.app.deviceId);
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [hotVote, setHotVote] = useState(null);

  // 카테고리 변경 시 질문 다시 로드 (폴링 제거, 변경 시에만 로드)
  useEffect(() => {
    const loadQuestion = async () => {
      const { getLatestOpenQuestion } = await import('../services/questionService');
      const question = await getLatestOpenQuestion(selectedCategory);
      dispatch({ type: 'SET_CURRENT_QUESTION', payload: question });
    };
    
    loadQuestion();
  }, [selectedCategory, dispatch]);

  // 핫한 투표 로드
  useEffect(() => {
    const loadHotVote = async () => {
      const votes = await getHotVotes(1);
      if (votes && votes.length > 0) {
        setHotVote(votes[0]);
      }
    };
    loadHotVote();
    const interval = setInterval(loadHotVote, 10000); // 10초마다 갱신
    return () => clearInterval(interval);
  }, []);

  const [hasCheckedIn, setHasCheckedIn] = useState(true); // 기본값을 true로 설정 (자동 출석)

  useEffect(() => {
    checkCheckinStatus();
    // 디바이스 정보가 변경될 때마다 출석 상태 확인
    if (device) {
      checkCheckinStatus();
    }
  }, [deviceId, device]);

  const checkCheckinStatus = async () => {
    if (!deviceId) return;
    const checkedIn = await hasCheckedInToday(deviceId);
    setHasCheckedIn(checkedIn);
    console.log('출석 상태 확인:', checkedIn);
  };

  const handleCheckin = async () => {
    if (!deviceId) return;

    setIsCheckingIn(true);
    try {
      // 오늘 이미 출석했는지 확인 (날짜 기반)
      if (hasCheckedIn) {
        Alert.alert('알림', '오늘 이미 출석했습니다.');
        setIsCheckingIn(false);
        return;
      }

      // GPS 검증 없이 바로 출석 처리
      const updatedDevice = await submitCheckin(deviceId);
      setHasCheckedIn(true);
      
      // Redux store에 업데이트된 디바이스 정보 반영
      if (updatedDevice) {
        dispatch({ type: 'SET_DEVICE', payload: updatedDevice });
        console.log('포인트 업데이트:', updatedDevice.points);
      } else {
        // 폴백: 디바이스 정보 다시 로드
        const { getDevice } = await import('../services/deviceService');
        const device = await getDevice(deviceId);
        dispatch({ type: 'SET_DEVICE', payload: device });
      }
      
      Alert.alert('성공', '출석 완료! +100 포인트');
    } catch (error) {
      console.error('출석 오류:', error);
      Alert.alert('오류', `출석 실패: ${error.message}`);
    } finally {
      setIsCheckingIn(false);
    }
  };

  const getCategoryName = (categoryId) => {
    const category = AppConstants.categories.find(c => c.id === categoryId);
    return category ? category.name : '기타';
  };

  const getCategoryIcon = (categoryId) => {
    const category = AppConstants.categories.find(c => c.id === categoryId);
    return category ? category.icon : '🤔';
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* 포인트 카드 - 그라데이션 */}
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.pointCard}
      >
        <Text style={styles.pointLabel}>내 포인트</Text>
        <Text style={styles.pointValue}>{device?.points || 0}P</Text>
        <View style={styles.pointBadge}>
          <Text style={styles.pointBadgeText}>⭐</Text>
        </View>
      </LinearGradient>

      {/* 출석하기 버튼 - 그라데이션 */}
      <TouchableOpacity
        style={[styles.checkinButton, (isCheckingIn || hasCheckedIn) && styles.buttonDisabled]}
        onPress={handleCheckin}
        disabled={isCheckingIn || hasCheckedIn}
        activeOpacity={0.8}
      >
        {hasCheckedIn ? (
          <LinearGradient
            colors={['#94a3b8', '#64748b']}
            style={styles.checkinButtonGradient}
          >
            <Text style={styles.checkinIcon}>✓</Text>
            <Text style={styles.checkinButtonText}>출석됨 (+100P)</Text>
          </LinearGradient>
        ) : (
          <LinearGradient
            colors={['#10b981', '#059669']}
            style={styles.checkinButtonGradient}
          >
            <Text style={styles.checkinIcon}>✓</Text>
            <Text style={styles.checkinButtonText}>
              {isCheckingIn ? '출석 중...' : '출석하기 (+100P)'}
            </Text>
          </LinearGradient>
        )}
      </TouchableOpacity>

      {/* 카테고리 필터 */}
      <View style={styles.categorySection}>
        <Text style={styles.sectionTitle}>카테고리</Text>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.categoryScroll}
          contentContainerStyle={styles.categoryContainer}
        >
          {AppConstants.categories.map((category) => (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.categoryChip,
                selectedCategory === category.id && styles.categoryChipSelected,
              ]}
              onPress={() => setSelectedCategory(category.id)}
              activeOpacity={0.7}
            >
              {selectedCategory === category.id ? (
                <LinearGradient
                  colors={['#667eea', '#764ba2']}
                  style={styles.categoryChipGradient}
                >
                  <Text style={styles.categoryIcon}>{category.icon}</Text>
                  <Text style={styles.categoryTextSelected}>{category.name}</Text>
                </LinearGradient>
              ) : (
                <>
                  <Text style={styles.categoryIcon}>{category.icon}</Text>
                  <Text style={styles.categoryText}>{category.name}</Text>
                </>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* 지금 핫한 투표 */}
      {hotVote && hotVote.questionId !== currentQuestion?.questionId && (
        <TouchableOpacity
          style={styles.hotVoteCard}
          onPress={() => navigation.navigate('Vote', { question: hotVote })}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#ef4444', '#dc2626']}
            style={styles.hotVoteGradient}
          >
            <View style={styles.hotVoteHeader}>
              <Text style={styles.hotVoteIcon}>🔥</Text>
              <Text style={styles.hotVoteTitle}>지금 핫한 투표</Text>
            </View>
            <Text style={styles.hotVoteText} numberOfLines={2}>
              {hotVote.text}
            </Text>
            <View style={styles.hotVoteFooter}>
              <View style={styles.hotVoteBadge}>
                <Text style={styles.hotVoteBadgeIcon}>
                  {getCategoryIcon(hotVote.category)}
                </Text>
                <Text style={styles.hotVoteBadgeText}>
                  {getCategoryName(hotVote.category)}
                </Text>
              </View>
              <Text style={styles.hotVoteCount}>
                {hotVote.totalVotes || 0}명 투표
              </Text>
            </View>
          </LinearGradient>
        </TouchableOpacity>
      )}

      {/* 현재 질문 */}
      {currentQuestion ? (
        <View style={styles.questionCard}>
          <View style={styles.questionHeader}>
            <View style={styles.questionCategoryBadge}>
              <Text style={styles.questionCategoryIcon}>
                {getCategoryIcon(currentQuestion.category)}
              </Text>
              <Text style={styles.questionCategoryText}>
                {getCategoryName(currentQuestion.category)}
              </Text>
            </View>
            <View style={styles.voteBadge}>
              <Text style={styles.voteBadgeText}>
                {currentQuestion.totalVotes || 0}명
              </Text>
            </View>
          </View>
          <Text style={styles.questionText}>{currentQuestion.text}</Text>
          <View style={styles.questionOptions}>
            <View style={styles.optionTag}>
              <Text style={styles.optionTagText}>{currentQuestion.optionA}</Text>
            </View>
            <Text style={styles.vsText}>VS</Text>
            <View style={styles.optionTag}>
              <Text style={styles.optionTagText}>{currentQuestion.optionB}</Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.voteButton}
            onPress={() => navigation.navigate('Vote', { question: currentQuestion })}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#3b82f6', '#2563eb']}
              style={styles.voteButtonGradient}
            >
              <Text style={styles.voteButtonText}>🗳️ 투표하기</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyIcon}>💭</Text>
          <Text style={styles.emptyText}>
            {selectedCategory === 'all' 
              ? '현재 진행 중인 고민이 없습니다'
              : `${getCategoryName(selectedCategory)} 카테고리에 고민이 없습니다`}
          </Text>
          <TouchableOpacity
            style={styles.createButton}
            onPress={() => navigation.navigate('QuestionCreate')}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#8b5cf6', '#7c3aed']}
              style={styles.createButtonGradient}
            >
              <Text style={styles.createButtonText}>+ 고민 작성하기</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}

      {/* 고민 작성하기 버튼 */}
      <TouchableOpacity
        style={styles.createQuestionButton}
        onPress={() => navigation.navigate('QuestionCreate')}
        activeOpacity={0.8}
      >
        <Text style={styles.createQuestionIcon}>✏️</Text>
        <Text style={styles.createQuestionButtonText}>새 고민 작성하기</Text>
      </TouchableOpacity>

      {/* 하단 메뉴 */}
      <View style={styles.bottomMenu}>
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => navigation.navigate('HotVotes')}
          activeOpacity={0.7}
        >
          <Text style={styles.menuIcon}>🔥</Text>
          <Text style={styles.menuText}>핫 투표</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => navigation.navigate('HallOfFame')}
          activeOpacity={0.7}
        >
          <Text style={styles.menuIcon}>🏆</Text>
          <Text style={styles.menuText}>명예의 전당</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => navigation.navigate('Shop')}
          activeOpacity={0.7}
        >
          <Text style={styles.menuIcon}>🛍️</Text>
          <Text style={styles.menuText}>상점</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => navigation.navigate('Statistics')}
          activeOpacity={0.7}
        >
          <Text style={styles.menuIcon}>📊</Text>
          <Text style={styles.menuText}>통계</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => navigation.navigate('Profile')}
          activeOpacity={0.7}
        >
          <Text style={styles.menuIcon}>👤</Text>
          <Text style={styles.menuText}>마이페이지</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
    padding: 20,
  },
  pointCard: {
    padding: 24,
    borderRadius: 20,
    marginBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
    position: 'relative',
    overflow: 'hidden',
  },
  pointLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    opacity: 0.9,
  },
  pointValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  pointBadge: {
    position: 'absolute',
    top: -10,
    right: -10,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pointBadgeText: {
    fontSize: 24,
  },
  checkinButton: {
    borderRadius: 16,
    marginBottom: 24,
    overflow: 'hidden',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  checkinButtonGradient: {
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkinIcon: {
    fontSize: 24,
    marginRight: 8,
    color: '#fff',
  },
  checkinButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  categorySection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 12,
  },
  categoryScroll: {
    marginHorizontal: -20,
  },
  categoryContainer: {
    paddingHorizontal: 20,
    gap: 10,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#e2e8f0',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  categoryChipSelected: {
    borderColor: 'transparent',
  },
  categoryChipGradient: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  categoryIcon: {
    fontSize: 16,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
  },
  categoryTextSelected: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
  },
  questionCard: {
    backgroundColor: '#fff',
    padding: 24,
    borderRadius: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  questionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  questionCategoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f9ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  questionCategoryIcon: {
    fontSize: 14,
  },
  questionCategoryText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0369a1',
  },
  voteBadge: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  voteBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#d97706',
  },
  questionText: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#1e293b',
    lineHeight: 32,
  },
  questionOptions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    gap: 12,
  },
  optionTag: {
    backgroundColor: '#eff6ff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#3b82f6',
  },
  optionTagText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#3b82f6',
  },
  vsText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#94a3b8',
    marginHorizontal: 8,
  },
  voteButton: {
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  voteButtonGradient: {
    padding: 16,
    alignItems: 'center',
  },
  voteButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  emptyCard: {
    backgroundColor: '#fff',
    padding: 48,
    borderRadius: 20,
    marginBottom: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 16,
    color: '#64748b',
    marginBottom: 24,
    textAlign: 'center',
  },
  createButton: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  createButtonGradient: {
    paddingHorizontal: 32,
    paddingVertical: 14,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  createQuestionButton: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderStyle: 'dashed',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  createQuestionIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  createQuestionButtonText: {
    color: '#64748b',
    fontSize: 16,
    fontWeight: '600',
  },
  bottomMenu: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    marginTop: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    justifyContent: 'space-around',
  },
  menuItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  menuIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  menuText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
  },
  hotVoteCard: {
    borderRadius: 20,
    marginBottom: 20,
    overflow: 'hidden',
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  hotVoteGradient: {
    padding: 20,
  },
  hotVoteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  hotVoteIcon: {
    fontSize: 24,
  },
  hotVoteTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  hotVoteText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
    lineHeight: 22,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  hotVoteFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  hotVoteBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  hotVoteBadgeIcon: {
    fontSize: 14,
  },
  hotVoteBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
  },
  hotVoteCount: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});
