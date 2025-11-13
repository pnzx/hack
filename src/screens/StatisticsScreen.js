import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSelector } from 'react-redux';
import {
  getSchoolStatistics,
  getMajorStatistics,
  getAllSchools,
  getAllMajors,
  compareSchools,
  compareMajors,
} from '../services/statisticsService';
import { AppConstants } from '../utils/constants';

export default function StatisticsScreen() {
  const device = useSelector((state) => state.app.device);
  const [tab, setTab] = useState('school'); // 'school' or 'major'
  const [category, setCategory] = useState('all');
  const [schoolStats, setSchoolStats] = useState(null);
  const [majorStats, setMajorStats] = useState(null);
  const [allSchools, setAllSchools] = useState([]);
  const [allMajors, setAllMajors] = useState([]);
  const [selectedSchool, setSelectedSchool] = useState(null);
  const [selectedMajor, setSelectedMajor] = useState(null);
  const [comparisonStats, setComparisonStats] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedSchool) {
      loadSchoolStats();
    }
  }, [selectedSchool, category]);

  useEffect(() => {
    if (selectedMajor) {
      loadMajorStats();
    }
  }, [selectedMajor, category]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const schools = await getAllSchools();
      const majors = await getAllMajors();
      setAllSchools(schools);
      setAllMajors(majors);

      // 사용자의 학교/학과가 있으면 자동 선택
      if (device?.school && schools.includes(device.school)) {
        setSelectedSchool(device.school);
      }
      if (device?.major && majors.includes(device.major)) {
        setSelectedMajor(device.major);
      }
    } catch (error) {
      console.error('데이터 로드 오류:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadSchoolStats = async () => {
    if (!selectedSchool) return;
    setIsLoading(true);
    try {
      const stats = await getSchoolStatistics(selectedSchool, category);
      setSchoolStats(stats);
    } catch (error) {
      console.error('학교 통계 로드 오류:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadMajorStats = async () => {
    if (!selectedMajor) return;
    setIsLoading(true);
    try {
      const stats = await getMajorStatistics(selectedMajor, category);
      setMajorStats(stats);
    } catch (error) {
      console.error('학과 통계 로드 오류:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCompareSchools = async () => {
    if (allSchools.length < 2) {
      return;
    }
    setIsLoading(true);
    try {
      const stats = await compareSchools(allSchools.slice(0, 5), category);
      setComparisonStats({ type: 'schools', stats });
    } catch (error) {
      console.error('학교 비교 오류:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCompareMajors = async () => {
    if (allMajors.length < 2) {
      return;
    }
    setIsLoading(true);
    try {
      const stats = await compareMajors(allMajors.slice(0, 5), category);
      setComparisonStats({ type: 'majors', stats });
    } catch (error) {
      console.error('학과 비교 오류:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getCategoryName = (categoryId) => {
    const category = AppConstants.categories.find(c => c.id === categoryId);
    return category ? category.name : '전체';
  };

  const getCategoryIcon = (categoryId) => {
    const category = AppConstants.categories.find(c => c.id === categoryId);
    return category ? category.icon : '📋';
  };

  const renderSchoolStats = () => {
    if (!selectedSchool) {
      return (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyIcon}>🏫</Text>
          <Text style={styles.emptyText}>
            학교를 선택해주세요
          </Text>
          <Text style={styles.emptySubtext}>
            {allSchools.length === 0
              ? '아직 등록된 학교가 없습니다.'
              : '아래에서 학교를 선택하세요.'}
          </Text>
        </View>
      );
    }

    if (!schoolStats || schoolStats.totalVotes === 0) {
      return (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyIcon}>📊</Text>
          <Text style={styles.emptyText}>
            {selectedSchool}의 통계 데이터가 없습니다
          </Text>
        </View>
      );
    }

    return (
      <View>
        {/* 전체 통계 */}
        <View style={styles.statsCard}>
          <Text style={styles.statsTitle}>
            {selectedSchool} 전체 통계
          </Text>
          <View style={styles.statRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{schoolStats.totalVotes}</Text>
              <Text style={styles.statLabel}>총 투표</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{schoolStats.aPercentage}%</Text>
              <Text style={styles.statLabel}>A 선택</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{schoolStats.bPercentage}%</Text>
              <Text style={styles.statLabel}>B 선택</Text>
            </View>
          </View>

          {/* 통계 바 */}
          <View style={styles.barContainer}>
            <View style={styles.bar}>
              <LinearGradient
                colors={['#3b82f6', '#2563eb']}
                style={[styles.barFill, { width: `${schoolStats.aPercentage}%` }]}
              />
              <LinearGradient
                colors={['#ef4444', '#dc2626']}
                style={[styles.barFill, { width: `${schoolStats.bPercentage}%` }]}
              />
            </View>
          </View>
        </View>

        {/* 카테고리별 통계 */}
        {Object.keys(schoolStats.categoryStats).length > 0 && (
          <View style={styles.categoryStatsCard}>
            <Text style={styles.statsTitle}>카테고리별 통계</Text>
            {Object.entries(schoolStats.categoryStats).map(([catId, catStats]) => (
              <View key={catId} style={styles.categoryStatItem}>
                <View style={styles.categoryStatHeader}>
                  <Text style={styles.categoryStatIcon}>
                    {getCategoryIcon(catId)}
                  </Text>
                  <Text style={styles.categoryStatName}>
                    {getCategoryName(catId)}
                  </Text>
                  <Text style={styles.categoryStatCount}>
                    {catStats.total}표
                  </Text>
                </View>
                <View style={styles.categoryBarContainer}>
                  <LinearGradient
                    colors={['#3b82f6', '#2563eb']}
                    style={[styles.categoryBarFill, { width: `${catStats.aPercentage}%` }]}
                  />
                  <LinearGradient
                    colors={['#ef4444', '#dc2626']}
                    style={[styles.categoryBarFill, { width: `${catStats.bPercentage}%` }]}
                  />
                </View>
                <View style={styles.categoryStatPercentages}>
                  <Text style={styles.categoryStatPercent}>
                    A: {catStats.aPercentage}%
                  </Text>
                  <Text style={styles.categoryStatPercent}>
                    B: {catStats.bPercentage}%
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };

  const renderMajorStats = () => {
    if (!selectedMajor) {
      return (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyIcon}>🎓</Text>
          <Text style={styles.emptyText}>
            학과를 선택해주세요
          </Text>
          <Text style={styles.emptySubtext}>
            {allMajors.length === 0
              ? '아직 등록된 학과가 없습니다.'
              : '아래에서 학과를 선택하세요.'}
          </Text>
        </View>
      );
    }

    if (!majorStats || majorStats.totalVotes === 0) {
      return (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyIcon}>📊</Text>
          <Text style={styles.emptyText}>
            {selectedMajor}의 통계 데이터가 없습니다
          </Text>
        </View>
      );
    }

    return (
      <View>
        {/* 전체 통계 */}
        <View style={styles.statsCard}>
          <Text style={styles.statsTitle}>
            {selectedMajor} 전체 통계
          </Text>
          <View style={styles.statRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{majorStats.totalVotes}</Text>
              <Text style={styles.statLabel}>총 투표</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{majorStats.aPercentage}%</Text>
              <Text style={styles.statLabel}>A 선택</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{majorStats.bPercentage}%</Text>
              <Text style={styles.statLabel}>B 선택</Text>
            </View>
          </View>

          {/* 통계 바 */}
          <View style={styles.barContainer}>
            <View style={styles.bar}>
              <LinearGradient
                colors={['#3b82f6', '#2563eb']}
                style={[styles.barFill, { width: `${majorStats.aPercentage}%` }]}
              />
              <LinearGradient
                colors={['#ef4444', '#dc2626']}
                style={[styles.barFill, { width: `${majorStats.bPercentage}%` }]}
              />
            </View>
          </View>
        </View>

        {/* 카테고리별 통계 */}
        {Object.keys(majorStats.categoryStats).length > 0 && (
          <View style={styles.categoryStatsCard}>
            <Text style={styles.statsTitle}>카테고리별 통계</Text>
            {Object.entries(majorStats.categoryStats).map(([catId, catStats]) => (
              <View key={catId} style={styles.categoryStatItem}>
                <View style={styles.categoryStatHeader}>
                  <Text style={styles.categoryStatIcon}>
                    {getCategoryIcon(catId)}
                  </Text>
                  <Text style={styles.categoryStatName}>
                    {getCategoryName(catId)}
                  </Text>
                  <Text style={styles.categoryStatCount}>
                    {catStats.total}표
                  </Text>
                </View>
                <View style={styles.categoryBarContainer}>
                  <LinearGradient
                    colors={['#3b82f6', '#2563eb']}
                    style={[styles.categoryBarFill, { width: `${catStats.aPercentage}%` }]}
                  />
                  <LinearGradient
                    colors={['#ef4444', '#dc2626']}
                    style={[styles.categoryBarFill, { width: `${catStats.bPercentage}%` }]}
                  />
                </View>
                <View style={styles.categoryStatPercentages}>
                  <Text style={styles.categoryStatPercent}>
                    A: {catStats.aPercentage}%
                  </Text>
                  <Text style={styles.categoryStatPercent}>
                    B: {catStats.bPercentage}%
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };

  const renderComparison = () => {
    if (!comparisonStats) return null;

    return (
      <View style={styles.comparisonCard}>
        <Text style={styles.statsTitle}>
          {comparisonStats.type === 'schools' ? '🏫 학교 비교' : '🎓 학과 비교'}
        </Text>
        {comparisonStats.stats.map((stat, index) => (
          <View key={index} style={styles.comparisonItem}>
            <Text style={styles.comparisonName}>
              {stat.school || stat.major}
            </Text>
            <View style={styles.comparisonBarContainer}>
              <LinearGradient
                colors={['#3b82f6', '#2563eb']}
                style={[styles.comparisonBarFill, { width: `${stat.aPercentage}%` }]}
              />
              <LinearGradient
                colors={['#ef4444', '#dc2626']}
                style={[styles.comparisonBarFill, { width: `${stat.bPercentage}%` }]}
              />
            </View>
            <View style={styles.comparisonStats}>
              <Text style={styles.comparisonStat}>
                A: {stat.aPercentage}% ({stat.votesA}표)
              </Text>
              <Text style={styles.comparisonStat}>
                B: {stat.bPercentage}% ({stat.votesB}표)
              </Text>
            </View>
          </View>
        ))}
      </View>
    );
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* 탭 선택 */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, tab === 'school' && styles.tabActive]}
          onPress={() => {
            setTab('school');
            setComparisonStats(null);
          }}
        >
          {tab === 'school' ? (
            <LinearGradient
              colors={['#667eea', '#764ba2']}
              style={styles.tabGradient}
            >
              <Text style={styles.tabTextActive}>🏫 학교별</Text>
            </LinearGradient>
          ) : (
            <Text style={styles.tabText}>🏫 학교별</Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, tab === 'major' && styles.tabActive]}
          onPress={() => {
            setTab('major');
            setComparisonStats(null);
          }}
        >
          {tab === 'major' ? (
            <LinearGradient
              colors={['#667eea', '#764ba2']}
              style={styles.tabGradient}
            >
              <Text style={styles.tabTextActive}>🎓 학과별</Text>
            </LinearGradient>
          ) : (
            <Text style={styles.tabText}>🎓 학과별</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* 카테고리 필터 */}
      <View style={styles.categorySection}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoryScroll}
          contentContainerStyle={styles.categoryContainer}
        >
          {AppConstants.categories.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              style={[
                styles.categoryChip,
                category === cat.id && styles.categoryChipSelected,
              ]}
              onPress={() => setCategory(cat.id)}
            >
              {category === cat.id ? (
                <LinearGradient
                  colors={['#667eea', '#764ba2']}
                  style={styles.categoryChipGradient}
                >
                  <Text style={styles.categoryIcon}>{cat.icon}</Text>
                  <Text style={styles.categoryTextSelected}>{cat.name}</Text>
                </LinearGradient>
              ) : (
                <>
                  <Text style={styles.categoryIcon}>{cat.icon}</Text>
                  <Text style={styles.categoryText}>{cat.name}</Text>
                </>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* 선택 목록 */}
      {tab === 'school' ? (
        <View style={styles.selectionCard}>
          <Text style={styles.selectionTitle}>학교 선택</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.selectionContainer}>
              {allSchools.map((school) => (
                <TouchableOpacity
                  key={school}
                  style={[
                    styles.selectionItem,
                    selectedSchool === school && styles.selectionItemSelected,
                  ]}
                  onPress={() => setSelectedSchool(school)}
                >
                  {selectedSchool === school ? (
                    <LinearGradient
                      colors={['#3b82f6', '#2563eb']}
                      style={styles.selectionItemGradient}
                    >
                      <Text style={styles.selectionItemTextSelected}>{school}</Text>
                    </LinearGradient>
                  ) : (
                    <Text style={styles.selectionItemText}>{school}</Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
          {allSchools.length >= 2 && (
            <TouchableOpacity
              style={styles.compareButton}
              onPress={handleCompareSchools}
            >
              <LinearGradient
                colors={['#8b5cf6', '#7c3aed']}
                style={styles.compareButtonGradient}
              >
                <Text style={styles.compareButtonText}>학교 비교하기</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <View style={styles.selectionCard}>
          <Text style={styles.selectionTitle}>학과 선택</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.selectionContainer}>
              {allMajors.map((major) => (
                <TouchableOpacity
                  key={major}
                  style={[
                    styles.selectionItem,
                    selectedMajor === major && styles.selectionItemSelected,
                  ]}
                  onPress={() => setSelectedMajor(major)}
                >
                  {selectedMajor === major ? (
                    <LinearGradient
                      colors={['#3b82f6', '#2563eb']}
                      style={styles.selectionItemGradient}
                    >
                      <Text style={styles.selectionItemTextSelected}>{major}</Text>
                    </LinearGradient>
                  ) : (
                    <Text style={styles.selectionItemText}>{major}</Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
          {allMajors.length >= 2 && (
            <TouchableOpacity
              style={styles.compareButton}
              onPress={handleCompareMajors}
            >
              <LinearGradient
                colors={['#8b5cf6', '#7c3aed']}
                style={styles.compareButtonGradient}
              >
                <Text style={styles.compareButtonText}>학과 비교하기</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* 로딩 */}
      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#667eea" />
        </View>
      )}

      {/* 비교 통계 */}
      {renderComparison()}

      {/* 통계 표시 */}
      {tab === 'school' ? renderSchoolStats() : renderMajorStats()}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
    padding: 20,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 4,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  tab: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  tabActive: {
    borderWidth: 0,
  },
  tabGradient: {
    padding: 12,
    alignItems: 'center',
  },
  tabText: {
    padding: 12,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
    color: '#64748b',
  },
  tabTextActive: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  categorySection: {
    marginBottom: 20,
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
  selectionCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  selectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#1e293b',
  },
  selectionContainer: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  selectionItem: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
    borderWidth: 2,
    borderColor: '#e2e8f0',
  },
  selectionItemSelected: {
    borderColor: 'transparent',
  },
  selectionItemGradient: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  selectionItemText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
  },
  selectionItemTextSelected: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
  },
  compareButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 8,
  },
  compareButtonGradient: {
    padding: 12,
    alignItems: 'center',
  },
  compareButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
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
  },
  statsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#1e293b',
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#3b82f6',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '600',
  },
  barContainer: {
    height: 24,
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    overflow: 'hidden',
    flexDirection: 'row',
  },
  bar: {
    flex: 1,
    flexDirection: 'row',
    height: '100%',
  },
  barFill: {
    height: '100%',
  },
  categoryStatsCard: {
    backgroundColor: '#fff',
    padding: 24,
    borderRadius: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  categoryStatItem: {
    marginBottom: 20,
  },
  categoryStatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  categoryStatIcon: {
    fontSize: 20,
  },
  categoryStatName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  categoryStatCount: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '600',
  },
  categoryBarContainer: {
    height: 16,
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    overflow: 'hidden',
    flexDirection: 'row',
    marginBottom: 8,
  },
  categoryBarFill: {
    height: '100%',
  },
  categoryStatPercentages: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  categoryStatPercent: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
  },
  comparisonCard: {
    backgroundColor: '#fff',
    padding: 24,
    borderRadius: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  comparisonItem: {
    marginBottom: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  comparisonName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#1e293b',
  },
  comparisonBarContainer: {
    height: 20,
    backgroundColor: '#f1f5f9',
    borderRadius: 10,
    overflow: 'hidden',
    flexDirection: 'row',
    marginBottom: 8,
  },
  comparisonBarFill: {
    height: '100%',
  },
  comparisonStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  comparisonStat: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '600',
  },
  emptyCard: {
    backgroundColor: '#fff',
    padding: 48,
    borderRadius: 20,
    alignItems: 'center',
    marginBottom: 20,
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
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
});

