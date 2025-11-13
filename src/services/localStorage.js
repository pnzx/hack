import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppConstants } from '../utils/constants';

const STORAGE_KEYS = {
    DEVICE_ID: 'device_id',
    DEVICES: 'devices',
    QUESTIONS: 'questions',
    VOTES: 'votes',
    CHECKINS: 'checkins',
};

// Device 관리
export const getOrCreateDeviceId = async () => {
    try {
        let deviceId = await AsyncStorage.getItem(STORAGE_KEYS.DEVICE_ID);
        console.log('[웹 디버그] deviceId:', deviceId);

        if (!deviceId) {
            deviceId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            await AsyncStorage.setItem(STORAGE_KEYS.DEVICE_ID, deviceId);
            console.log('[웹 디버그] 새 deviceId 생성:', deviceId);

            // Device 생성 (시작 포인트 200)
            const devices = await getDevices();
            devices[deviceId] = {
                deviceId,
                points: 200,
                totalVotes: 0,
                totalCheckins: 0,
                school: null,
                major: null,
                createdAt: new Date().toISOString(),
                lastActiveAt: new Date().toISOString(),
            };
            await saveDevices(devices);
            console.log('[웹 디버그] 새 디바이스 생성 완료, 포인트:', devices[deviceId].points);
        } else {
            // 기존 디바이스: 자동 출석 처리
            const devices = await getDevices();
            console.log('[웹 디버그] 기존 디바이스 로드:', devices[deviceId]);

            if (devices[deviceId]) {
                // 포인트가 없거나 0이면 기본값 200으로 설정
                if (!devices[deviceId].points || devices[deviceId].points === 0) {
                    devices[deviceId].points = 200;
                    await saveDevices(devices);
                }
                
                devices[deviceId].lastActiveAt = new Date().toISOString();

                // 오늘 출석하지 않았으면 자동 출석
                const today = new Date().toISOString().split('T')[0];
                console.log('[웹 디버그] 오늘 날짜:', today);

                const checkins = await getCheckins();
                const hasCheckedInToday = Object.values(checkins).some(
                    checkin => checkin.deviceId === deviceId && checkin.date === today
                );
                console.log('[웹 디버그] 오늘 출석 여부:', hasCheckedInToday);

                if (!hasCheckedInToday) {
                    // 자동 출석 처리
                    const checkinId = `checkin_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                    checkins[checkinId] = {
                        checkinId,
                        deviceId,
                        date: today,
                        locationType: 'campus',
                        createdAt: new Date().toISOString(),
                    };
                    await saveCheckins(checkins);
                    console.log('[웹 디버그] 출석 기록 저장 완료');

                    // 포인트 추가 (100점) - updateDevice 사용하여 안전하게 업데이트
                    const { checkinPointReward } = await import('../utils/constants');
                    // 포인트가 없거나 0이면 기본값 200으로 설정, 있으면 현재 포인트에 추가
                    const currentPoints = devices[deviceId].points || 200;
                    const newPoints = currentPoints + checkinPointReward;
                    console.log('[웹 디버그] 현재 포인트:', currentPoints, '추가할 포인트:', checkinPointReward, '-> 최종:', newPoints);

                    await updateDevice(deviceId, {
                        points: newPoints,
                        totalCheckins: (devices[deviceId].totalCheckins || 0) + 1,
                        lastActiveAt: new Date().toISOString(),
                    });

                    // 업데이트된 디바이스 확인
                    const updatedDevice = await getDevice(deviceId);
                    console.log('[웹 디버그] 자동 출석 완료:', currentPoints, '->', updatedDevice?.points);
                } else {
                    // 이미 출석했으면 디바이스 정보만 저장
                    // 포인트가 없으면 기본값 200으로 설정
                    if (!devices[deviceId].points || devices[deviceId].points === 0) {
                        devices[deviceId].points = 200;
                    }
                    await saveDevices(devices);
                    console.log('[웹 디버그] 이미 출석함, 포인트:', devices[deviceId].points);
                }
            } else {
                // 디바이스가 없으면 새로 생성 (시작 포인트 200)
                console.log('[웹 디버그] 디바이스 정보 없음, 새로 생성');
                devices[deviceId] = {
                    deviceId,
                    points: 200,
                    totalVotes: 0,
                    totalCheckins: 0,
                    school: null,
                    major: null,
                    createdAt: new Date().toISOString(),
                    lastActiveAt: new Date().toISOString(),
                };
                await saveDevices(devices);
                console.log('[웹 디버그] 새 디바이스 생성 완료, 포인트: 200');
            }
        }

        return deviceId;
    } catch (error) {
        console.error('[웹 디버그] DeviceId 가져오기 오류:', error);
        throw error;
    }
};

export const getDevices = async () => {
    try {
        const data = await AsyncStorage.getItem(STORAGE_KEYS.DEVICES);
        return data ? JSON.parse(data) : {};
    } catch (error) {
        return {};
    }
};

export const saveDevices = async (devices) => {
    await AsyncStorage.setItem(STORAGE_KEYS.DEVICES, JSON.stringify(devices));
};

export const getDevice = async (deviceId) => {
    const devices = await getDevices();
    const device = devices[deviceId] || null;
    console.log('[웹 디버그] getDevice:', deviceId, '->', device?.points, '포인트');
    return device;
};

export const updateDevice = async (deviceId, updates) => {
    const devices = await getDevices();
    if (devices[deviceId]) {
        const oldPoints = devices[deviceId].points || 0;
        // 기존 필드들을 보존하면서 업데이트
        devices[deviceId] = {
            ...devices[deviceId],
            ...updates,
            // 포인트가 명시적으로 업데이트되지 않으면 기존 값 유지
            points: updates.points !== undefined ? updates.points : devices[deviceId].points,
        };
        await saveDevices(devices);
        console.log('[웹 디버그] updateDevice:', deviceId, oldPoints, '->', devices[deviceId].points, '포인트');
    } else {
        console.warn('[웹 디버그] updateDevice: 디바이스를 찾을 수 없음:', deviceId);
    }
};

// Question 관리
export const getQuestions = async () => {
    try {
        const data = await AsyncStorage.getItem(STORAGE_KEYS.QUESTIONS);
        return data ? JSON.parse(data) : {};
    } catch (error) {
        return {};
    }
};

export const saveQuestions = async (questions) => {
    await AsyncStorage.setItem(STORAGE_KEYS.QUESTIONS, JSON.stringify(questions));
};

export const getLatestOpenQuestion = async (category = 'all') => {
    const questions = await getQuestions();
    let openQuestions = Object.values(questions)
        .filter(q => q.status === 'OPEN');

    // 카테고리 필터링
    if (category !== 'all') {
        openQuestions = openQuestions.filter(q => q.category === category);
    }

    openQuestions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return openQuestions.length > 0 ? openQuestions[0] : null;
};

export const getOpenQuestionsByCategory = async (category = 'all') => {
    const questions = await getQuestions();
    let openQuestions = Object.values(questions)
        .filter(q => q.status === 'OPEN');

    if (category !== 'all') {
        openQuestions = openQuestions.filter(q => q.category === category);
    }

    return openQuestions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
};

export const createQuestion = async ({ text, type, optionA, optionB, deviceId, category = 'etc' }) => {
    const questions = await getQuestions();
    const questionId = `question_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    questions[questionId] = {
        questionId,
        text,
        type,
        optionA,
        optionB,
        votesA: 0,
        votesB: 0,
        totalVotes: 0,
        createdAt: new Date().toISOString(),
        status: 'OPEN',
        createdBy: deviceId,
        category,
    };

    await saveQuestions(questions);
    return questionId;
};

export const getQuestion = async (questionId) => {
    const questions = await getQuestions();
    return questions[questionId] || null;
};

export const updateQuestion = async (questionId, updates) => {
    const questions = await getQuestions();
    if (questions[questionId]) {
        questions[questionId] = { ...questions[questionId], ...updates };
        await saveQuestions(questions);
    }
};

// 사진 인증
export const verifyQuestion = async (questionId, imageUri, deviceId) => {
    const question = await getQuestion(questionId);
    if (!question) {
        throw new Error('질문을 찾을 수 없습니다.');
    }

    if (question.createdBy !== deviceId) {
        throw new Error('본인이 작성한 질문만 인증할 수 있습니다.');
    }

    if (question.verified) {
        throw new Error('이미 인증된 질문입니다.');
    }

    // 질문 업데이트
    await updateQuestion(questionId, {
        verified: true,
        verificationImage: imageUri,
        verifiedAt: new Date().toISOString(),
    });

    // 질문 작성자에게 포인트 지급
    const device = await getDevice(deviceId);
    if (!device) {
        throw new Error('기기 정보를 찾을 수 없습니다.');
    }

    const { verificationPointReward } = await import('../utils/constants');
    await updateDevice(deviceId, {
        points: (device.points || 0) + verificationPointReward,
        lastActiveAt: new Date().toISOString(),
    });

    // 업데이트된 디바이스 정보 반환
    const updatedDevice = await getDevice(deviceId);
    return updatedDevice;
};

// 명예의 전당 (하루 최고 투표율 질문)
export const getHallOfFame = async () => {
    const questions = await getQuestions();
    const today = new Date().toISOString().split('T')[0];

    // 오늘 생성된 질문들 중에서
    const todayQuestions = Object.values(questions).filter(q => {
        const questionDate = new Date(q.createdAt).toISOString().split('T')[0];
        return questionDate === today && q.totalVotes > 0;
    });

    if (todayQuestions.length === 0) return null;

    // 투표율 계산 (totalVotes 기준이 아니라 비율로)
    const questionsWithRate = todayQuestions.map(q => {
        const rate = q.totalVotes > 0
            ? Math.max(q.votesA / q.totalVotes, q.votesB / q.totalVotes) * 100
            : 0;
        return { ...q, voteRate: rate };
    });

    // 투표율이 가장 높은 질문
    const hallOfFame = questionsWithRate.reduce((prev, current) => {
        return (prev.voteRate > current.voteRate) ? prev : current;
    });

    return hallOfFame;
};

// 지금 핫한 투표 (현재 진행 중인 투표 중 가장 많은 투표를 받은 것)
export const getHotVotes = async (limit = 5) => {
    const questions = await getQuestions();
    const openQuestions = Object.values(questions)
        .filter(q => q.status === 'OPEN' && q.totalVotes > 0)
        .sort((a, b) => b.totalVotes - a.totalVotes)
        .slice(0, limit);

    return openQuestions;
};

// 가장 핫했던 투표들 (과거 포함, 전체 중 가장 많은 투표를 받은 것들)
export const getAllTimeHotVotes = async (limit = 10) => {
    const questions = await getQuestions();
    const allQuestions = Object.values(questions)
        .filter(q => q.totalVotes > 0)
        .sort((a, b) => b.totalVotes - a.totalVotes)
        .slice(0, limit);

    return allQuestions;
};

// Vote 관리
export const getVotes = async () => {
    try {
        const data = await AsyncStorage.getItem(STORAGE_KEYS.VOTES);
        return data ? JSON.parse(data) : {};
    } catch (error) {
        return {};
    }
};

export const saveVotes = async (votes) => {
    await AsyncStorage.setItem(STORAGE_KEYS.VOTES, JSON.stringify(votes));
};

export const hasVoted = async (questionId, deviceId) => {
    const votes = await getVotes();
    return Object.values(votes).some(
        vote => vote.questionId === questionId && vote.deviceId === deviceId
    );
};

export const submitVote = async ({ questionId, deviceId, choice }) => {
    // 중복 확인
    if (await hasVoted(questionId, deviceId)) {
        throw new Error('이미 투표했습니다.');
    }

    // 포인트 확인 및 차감
    const device = await getDevice(deviceId);
    if (!device) {
        throw new Error('기기 정보를 찾을 수 없습니다.');
    }

    const { votePointCost } = await import('../utils/constants');
    if (device.points < votePointCost) {
        throw new Error(`포인트가 부족합니다. (필요: ${votePointCost}P, 보유: ${device.points}P)`);
    }

    // Vote 생성 (학교/학과 정보 포함)
    const votes = await getVotes();
    const voteId = `vote_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    votes[voteId] = {
        voteId,
        questionId,
        deviceId,
        choice,
        school: device.school || null,
        major: device.major || null,
        createdAt: new Date().toISOString(),
    };
    await saveVotes(votes);

    // Question 업데이트
    const question = await getQuestion(questionId);
    if (question) {
        const updates = {
            totalVotes: question.totalVotes + 1,
        };
        if (choice === 'A') {
            updates.votesA = question.votesA + 1;
        } else {
            updates.votesB = question.votesB + 1;
        }
        await updateQuestion(questionId, updates);
    }

    // Device 포인트 차감
    await updateDevice(deviceId, {
        points: (device.points || 0) - votePointCost,
        totalVotes: (device.totalVotes || 0) + 1,
        lastActiveAt: new Date().toISOString(),
    });

    // 업데이트된 디바이스 정보 반환
    const updatedDevice = await getDevice(deviceId);
    console.log('투표 포인트 차감:', device.points, '->', updatedDevice?.points);
    return updatedDevice;
};

// Checkin 관리
export const getCheckins = async () => {
    try {
        const data = await AsyncStorage.getItem(STORAGE_KEYS.CHECKINS);
        return data ? JSON.parse(data) : {};
    } catch (error) {
        return {};
    }
};

export const saveCheckins = async (checkins) => {
    await AsyncStorage.setItem(STORAGE_KEYS.CHECKINS, JSON.stringify(checkins));
};

export const hasCheckedInToday = async (deviceId) => {
    const today = new Date().toISOString().split('T')[0];
    const checkins = await getCheckins();

    return Object.values(checkins).some(
        checkin => checkin.deviceId === deviceId && checkin.date === today
    );
};

// 더미 데이터 생성
export const createDummyData = async () => {
    const questions = await getQuestions();
    const dummyDeviceId = 'dummy_device';

    // 이미 더미 데이터가 있으면 생성하지 않음
    const existingDummy = Object.values(questions).find(q => q.createdBy === dummyDeviceId);
    if (existingDummy) {
        return;
    }

    const dummyQuestions = [
        {
            text: '이번 학기 수강신청, 인기 과목 신청할까?',
            type: 'YES_NO',
            optionA: 'YES',
            optionB: 'NO',
            category: 'study',
        },
        {
            text: '알바 그만두고 공부에 집중할까?',
            type: 'YES_NO',
            optionA: 'YES',
            optionB: 'NO',
            category: 'work',
        },
        {
            text: '친구와 싸웠는데 먼저 사과할까?',
            type: 'YES_NO',
            optionA: 'YES',
            optionB: 'NO',
            category: 'relationship',
        },
        {
            text: '이번 달 용돈으로 뭐 살까?',
            type: 'A_B',
            optionA: '옷',
            optionB: '음식',
            category: 'money',
        },
        {
            text: '헬스장 등록할까?',
            type: 'YES_NO',
            optionA: 'YES',
            optionB: 'NO',
            category: 'health',
        },
        {
            text: '고백할까 말까?',
            type: 'YES_NO',
            optionA: 'YES',
            optionB: 'NO',
            category: 'love',
        },
        {
            text: '주말에 뭐 할까?',
            type: 'A_B',
            optionA: '게임',
            optionB: '영화',
            category: 'hobby',
        },
        {
            text: '전공 바꿀까?',
            type: 'YES_NO',
            optionA: 'YES',
            optionB: 'NO',
            category: 'study',
        },
    ];

    dummyQuestions.forEach((q, index) => {
        const questionId = `dummy_question_${index}`;
        questions[questionId] = {
            questionId,
            ...q,
            votesA: Math.floor(Math.random() * 20),
            votesB: Math.floor(Math.random() * 20),
            totalVotes: 0,
            createdAt: new Date(Date.now() - index * 3600000).toISOString(), // 시간차를 두고 생성
            status: 'OPEN',
            createdBy: dummyDeviceId,
        };
        questions[questionId].totalVotes = questions[questionId].votesA + questions[questionId].votesB;
    });

    await saveQuestions(questions);
};

export const submitCheckin = async (deviceId) => {
    // 오늘 이미 출석했는지 확인
    if (await hasCheckedInToday(deviceId)) {
        throw new Error('오늘 이미 출석했습니다.');
    }

    // Checkin 생성
    const checkins = await getCheckins();
    const checkinId = `checkin_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const today = new Date().toISOString().split('T')[0];

    checkins[checkinId] = {
        checkinId,
        deviceId,
        date: today,
        locationType: 'campus',
        createdAt: new Date().toISOString(),
    };
    await saveCheckins(checkins);

    // Device 포인트 증가 (100점)
    const device = await getDevice(deviceId);
    if (!device) {
        throw new Error('기기 정보를 찾을 수 없습니다.');
    }

    const { checkinPointReward } = await import('../utils/constants');
    // 포인트가 없거나 0이면 기본값 200으로 설정, 있으면 현재 포인트에 추가
    const currentPoints = device.points || 200;
    const newPoints = currentPoints + checkinPointReward;
    console.log('[출석] 현재 포인트:', currentPoints, '추가:', checkinPointReward, '-> 최종:', newPoints);

    await updateDevice(deviceId, {
        points: newPoints,
        totalCheckins: (device.totalCheckins || 0) + 1,
        lastActiveAt: new Date().toISOString(),
    });

    // 업데이트된 디바이스 정보 반환
    const updatedDevice = await getDevice(deviceId);
    console.log('[출석] 포인트 업데이트 완료:', currentPoints, '->', updatedDevice?.points);
    return updatedDevice;
};

// 통계 함수들
// 학교별 통계
export const getSchoolStatistics = async (school, category = 'all') => {
    const votes = await getVotes();
    const questions = await getQuestions();
    
    // 해당 학교의 투표만 필터링
    let schoolVotes = Object.values(votes).filter(vote => vote.school === school);
    
    // 카테고리 필터링 (질문의 카테고리 기준)
    if (category !== 'all') {
        schoolVotes = schoolVotes.filter(vote => {
            const question = questions[vote.questionId];
            return question && question.category === category;
        });
    }
    
    if (schoolVotes.length === 0) {
        return {
            school,
            totalVotes: 0,
            votesA: 0,
            votesB: 0,
            aPercentage: 0,
            bPercentage: 0,
            categoryStats: {},
        };
    }
    
    const votesA = schoolVotes.filter(v => v.choice === 'A').length;
    const votesB = schoolVotes.filter(v => v.choice === 'B').length;
    const totalVotes = schoolVotes.length;
    
    // 카테고리별 통계
    const categoryStats = {};
    AppConstants.categories.filter(c => c.id !== 'all').forEach(cat => {
        const catVotes = schoolVotes.filter(vote => {
            const question = questions[vote.questionId];
            return question && question.category === cat.id;
        });
        if (catVotes.length > 0) {
            const catA = catVotes.filter(v => v.choice === 'A').length;
            const catB = catVotes.filter(v => v.choice === 'B').length;
            categoryStats[cat.id] = {
                total: catVotes.length,
                votesA: catA,
                votesB: catB,
                aPercentage: Math.round((catA / catVotes.length) * 100),
                bPercentage: Math.round((catB / catVotes.length) * 100),
            };
        }
    });
    
    return {
        school,
        totalVotes,
        votesA,
        votesB,
        aPercentage: Math.round((votesA / totalVotes) * 100),
        bPercentage: Math.round((votesB / totalVotes) * 100),
        categoryStats,
    };
};

// 학과별 통계
export const getMajorStatistics = async (major, category = 'all') => {
    const votes = await getVotes();
    const questions = await getQuestions();
    
    // 해당 학과의 투표만 필터링
    let majorVotes = Object.values(votes).filter(vote => vote.major === major);
    
    // 카테고리 필터링
    if (category !== 'all') {
        majorVotes = majorVotes.filter(vote => {
            const question = questions[vote.questionId];
            return question && question.category === category;
        });
    }
    
    if (majorVotes.length === 0) {
        return {
            major,
            totalVotes: 0,
            votesA: 0,
            votesB: 0,
            aPercentage: 0,
            bPercentage: 0,
            categoryStats: {},
        };
    }
    
    const votesA = majorVotes.filter(v => v.choice === 'A').length;
    const votesB = majorVotes.filter(v => v.choice === 'B').length;
    const totalVotes = majorVotes.length;
    
    // 카테고리별 통계
    const categoryStats = {};
    AppConstants.categories.filter(c => c.id !== 'all').forEach(cat => {
        const catVotes = majorVotes.filter(vote => {
            const question = questions[vote.questionId];
            return question && question.category === cat.id;
        });
        if (catVotes.length > 0) {
            const catA = catVotes.filter(v => v.choice === 'A').length;
            const catB = catVotes.filter(v => v.choice === 'B').length;
            categoryStats[cat.id] = {
                total: catVotes.length,
                votesA: catA,
                votesB: catB,
                aPercentage: Math.round((catA / catVotes.length) * 100),
                bPercentage: Math.round((catB / catVotes.length) * 100),
            };
        }
    });
    
    return {
        major,
        totalVotes,
        votesA,
        votesB,
        aPercentage: Math.round((votesA / totalVotes) * 100),
        bPercentage: Math.round((votesB / totalVotes) * 100),
        categoryStats,
    };
};

// 전체 학교 목록
export const getAllSchools = async () => {
    const devices = await getDevices();
    const schools = new Set();
    Object.values(devices).forEach(device => {
        if (device.school) {
            schools.add(device.school);
        }
    });
    return Array.from(schools).sort();
};

// 전체 학과 목록
export const getAllMajors = async () => {
    const devices = await getDevices();
    const majors = new Set();
    Object.values(devices).forEach(device => {
        if (device.major) {
            majors.add(device.major);
        }
    });
    return Array.from(majors).sort();
};

// 학교별 비교 통계
export const compareSchools = async (schools, category = 'all') => {
    const stats = await Promise.all(
        schools.map(school => getSchoolStatistics(school, category))
    );
    return stats;
};

// 학과별 비교 통계
export const compareMajors = async (majors, category = 'all') => {
    const stats = await Promise.all(
        majors.map(major => getMajorStatistics(major, category))
    );
    return stats;
};

