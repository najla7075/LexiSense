/**
 * LexiSense — Supabase Client & Centralized Live Database Service Engine
 * Full live cloud database synchronization for Parent, Admin, and Super Admin portals.
 * Direct persistence to Supabase: profiles, children, screening_results, audit_logs.
 */

const SUPABASE_URL = "https://joulqudtnpaaghwkvygg.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_pC0CF0GIY-kPRsabbau9DQ_5cztiVbX";

let _supabaseInstance = null;

function isValidUUID(str) {
    if (!str || typeof str !== 'string') return false;
    const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
    return uuidRegex.test(str);
}

/**
 * Returns the singleton Supabase client instance
 */
function getSupabase() {
    if (!_supabaseInstance) {
        if (window.supabase && typeof window.supabase.createClient === 'function') {
            try {
                _supabaseInstance = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
                    auth: {
                        persistSession: true,
                        autoRefreshToken: true,
                        detectSessionInUrl: true
                    }
                });
                console.log("LexiSense Supabase Client Initialized ⚡");
            } catch (err) {
                console.error("Failed to initialize Supabase client:", err);
            }
        } else {
            console.warn("Supabase JS SDK (@supabase/supabase-js) is not loaded on this page.");
        }
    }
    return _supabaseInstance;
}

/**
 * Resolves active authenticated user ID from Supabase session, global user, or stored profile.
 */
async function getActiveAuthUserId() {
    const client = getSupabase();

    // 1. Check in-memory global user
    if (window.loggedInUser?.id && isValidUUID(window.loggedInUser.id)) {
        return window.loggedInUser.id;
    }

    // 2. Check active Supabase session
    if (client) {
        try {
            const { data: { session } } = await client.auth.getSession();
            if (session?.user?.id && isValidUUID(session.user.id)) {
                return session.user.id;
            }
            const { data: { user } } = await client.auth.getUser();
            if (user?.id && isValidUUID(user.id)) {
                return user.id;
            }
        } catch (e) {}
    }

    // 3. Check stored profile in localStorage
    try {
        const storedUser = JSON.parse(localStorage.getItem('lexisense_user') || 'null');
        if (storedUser?.id && isValidUUID(storedUser.id)) {
            return storedUser.id;
        }
    } catch (e) {}

    return null;
}

// ==============================================================================
// 1. CHILDREN / STUDENTS MANAGEMENT (SUPABASE)
// ==============================================================================

/**
 * Fetch all children profiles from Supabase.
 * If user is parent, filter to their children. If admin/super_admin, load all children.
 */
async function loadChildrenFromSupabase(forceAll = false) {
    const client = getSupabase();
    if (!client) return [];

    try {
        const userId = await getActiveAuthUserId();
        const currentUser = window.loggedInUser || JSON.parse(localStorage.getItem('lexisense_user') || 'null');
        const userRole = currentUser?.role || 'parent';
        const username = currentUser ? (currentUser.username || currentUser.name) : 'guest';

        let query = client.from('children').select('*');

        if (!forceAll && userRole === 'parent') {
            if (userId && isValidUUID(userId)) {
                query = query.or(`parent_id.eq.${userId},parent_name.ilike.${username}`);
            } else if (username && username !== 'guest') {
                query = query.ilike('parent_name', username);
            }
        }

        const { data, error } = await query.order('created_at', { ascending: false });

        if (error) {
            console.warn('Supabase Error fetching children:', error.message);
            return [];
        }

        if (!data || !Array.isArray(data)) return [];

        return formatChildrenArray(data);
    } catch (e) {
        console.warn('Exception loading children from Supabase:', e);
        return [];
    }
}

/**
 * Loads all children for Admin & Super Admin views
 */
async function loadAllChildrenFromSupabase() {
    return await loadChildrenFromSupabase(true);
}

function formatChildrenArray(rawChildren) {
    return rawChildren.map(c => {
        const isDone = c.status === 'Completed' || (c.match_score && c.match_score > 0) || (c.score && c.score > 0);
        let riskText = c.risk || 'Not Screened';
        if (isDone && (!c.risk || c.risk === 'Not Screened')) {
            const scoreVal = c.match_score || c.score || 0;
            riskText = scoreVal >= 65 ? 'Higher Indicators' : (scoreVal >= 35 ? 'Moderate Risk' : 'Low Risk');
        }

        return {
            id: c.id,
            dbId: c.id,
            name: c.name || 'Unnamed Student',
            age: c.age || 8,
            grade: c.grade || c.school_grade || 'Class 1A',
            class: c.grade || c.school_grade || 'Class 1A',
            school: c.school || c.school_name || 'SK Taman Permata',
            avatar: c.avatar || '👧',
            gender: c.gender || 'Unspecified',
            parent_id: c.parent_id,
            parent_name: c.parent_name || 'Parent / Guardian',
            parent_phone: c.parent_phone || '+6012-3456789',
            parent_email: c.parent_email || 'guardian@email.com',
            status: isDone ? 'Completed' : (c.status || 'Pending'),
            risk: riskText,
            outcome: riskText,
            score: c.match_score || c.score || 0,
            match_score: c.match_score || c.score || 0,
            pillar1_score: c.pillar1_score || 0,
            pillar2_score: c.pillar2_score || 0,
            pillar3_score: c.pillar3_score || 0,
            diagnostic_area: c.diagnostic_area || (isDone ? 'Screening Completed' : '⏳ Screening not yet conducted'),
            date: c.created_at ? new Date(c.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Today'
        };
    });
}

/**
 * Saves a new child/student profile directly into Supabase children table
 */
async function saveChildProfileToSupabase(childObj) {
    const client = getSupabase();
    if (!client) return null;

    try {
        const userId = await getActiveAuthUserId();
        const currentUser = window.loggedInUser || JSON.parse(localStorage.getItem('lexisense_user') || 'null');
        const parentName = childObj.parent_name || (currentUser ? (currentUser.name || currentUser.username) : 'Parent User');
        const schoolVal = childObj.school || childObj.school_name || (currentUser?.school || 'SK Taman Permata');
        const gradeVal = childObj.grade || childObj.class || childObj.school_grade || 'Class 1A';

        const lxId = childObj.child_id || childObj.student_id || ('LX-' + Math.floor(1000 + Math.random() * 9000));
        const record = {
            child_id: lxId,
            student_id: lxId,
            name: childObj.name,
            age: parseInt(childObj.age, 10) || 8,
            grade: gradeVal,
            school: schoolVal,
            school_grade: gradeVal,
            school_name: schoolVal,
            parent_name: parentName,
            parent_phone: childObj.parent_phone || '+6012-3456789',
            parent_email: childObj.parent_email || (currentUser?.email || 'guardian@email.com'),
            gender: childObj.gender || 'Unspecified',
            avatar: childObj.avatar || (childObj.gender === 'Female' ? '👧' : '👦'),
            status: childObj.status || 'Pending',
            risk: childObj.risk || 'Not Screened',
            score: parseInt(childObj.score || childObj.match_score || 0, 10),
            match_score: parseInt(childObj.match_score || childObj.score || 0, 10),
            created_at: new Date().toISOString()
        };

        if (userId && isValidUUID(userId)) {
            record.parent_id = userId;
        }

        console.log("Inserting child profile into Supabase 🚀:", record);

        let { data, error } = await client
            .from('children')
            .insert([record])
            .select();

        if (error) {
            console.error("Supabase Child Insert Error:", error.message);
            return null;
        }

        console.log("Child profile saved to Supabase ⚡:", data);
        return data && data[0] ? data[0] : null;
    } catch (e) {
        console.error("Exception saving child profile to Supabase:", e);
        return null;
    }
}

/**
 * Updates an existing child profile in Supabase
 */
async function updateChildProfileInSupabase(childIdOrName, updatedChildObj) {
    const client = getSupabase();
    if (!client) return null;

    try {
        const gradeVal = updatedChildObj.grade || updatedChildObj.class || updatedChildObj.school_grade || 'Class 1A';
        const schoolVal = updatedChildObj.school || updatedChildObj.school_name || 'SK Taman Permata';

        const updateData = {
            name: updatedChildObj.name,
            age: parseInt(updatedChildObj.age, 10) || 8,
            grade: gradeVal,
            school: schoolVal,
            school_grade: gradeVal,
            gender: updatedChildObj.gender || (updatedChildObj.avatar === '👧' ? 'Female' : 'Male'),
            avatar: updatedChildObj.avatar || (updatedChildObj.gender === 'Female' ? '👧' : '👦'),
            updated_at: new Date().toISOString()
        };

        if (updatedChildObj.parent_name) updateData.parent_name = updatedChildObj.parent_name;
        if (updatedChildObj.parent_phone) updateData.parent_phone = updatedChildObj.parent_phone;
        if (updatedChildObj.parent_email) updateData.parent_email = updatedChildObj.parent_email;
        if (updatedChildObj.avatar) updateData.avatar = updatedChildObj.avatar;
        if (updatedChildObj.status) updateData.status = updatedChildObj.status;
        if (updatedChildObj.risk) updateData.risk = updatedChildObj.risk;
        if (updatedChildObj.score !== undefined) updateData.score = parseInt(updatedChildObj.score, 10);
        if (updatedChildObj.match_score !== undefined) updateData.match_score = parseInt(updatedChildObj.match_score, 10);
        if (updatedChildObj.diagnostic_area) updateData.diagnostic_area = updatedChildObj.diagnostic_area;

        let query = client.from('children').update(updateData);

        if (updatedChildObj.id && isValidUUID(updatedChildObj.id)) {
            query = query.eq('id', updatedChildObj.id);
        } else if (childIdOrName && isValidUUID(childIdOrName)) {
            query = query.eq('id', childIdOrName);
        } else if (childIdOrName) {
            query = query.ilike('name', childIdOrName);
        } else {
            query = query.ilike('name', updatedChildObj.name);
        }

        const { data, error } = await query.select();

        if (error) {
            console.error("Supabase Child Profile Update Error:", error.message);
            return null;
        }

        console.log("Updated child in Supabase ⚡:", data);
        return data && data[0] ? data[0] : true;
    } catch (e) {
        console.error("Exception updating child in Supabase:", e);
        return null;
    }
}

/**
 * Deletes a child profile from Supabase
 */
async function deleteChildProfileFromSupabase(childIdOrName) {
    const client = getSupabase();
    if (!client) return false;

    try {
        let query = client.from('children').delete();

        if (childIdOrName && isValidUUID(childIdOrName)) {
            query = query.eq('id', childIdOrName);
        } else if (childIdOrName) {
            query = query.ilike('name', childIdOrName);
        } else {
            return false;
        }

        const { error } = await query;
        if (error) {
            console.error("Supabase Child Delete Error:", error.message);
            return false;
        }
        console.log("Deleted child from Supabase 🗑️⚡:", childIdOrName);
        return true;
    } catch (e) {
        console.error("Exception deleting child from Supabase:", e);
        return false;
    }
}

// ==============================================================================
// 2. SCREENING RESULTS MANAGEMENT (SUPABASE)
// ==============================================================================

/**
 * Fetch screening history from Supabase.
 * If user is parent, filter to their screenings. If admin/super_admin, load all.
 */
async function loadHistoryFromSupabase(forceAll = false) {
    const client = getSupabase();
    if (!client) return [];

    try {
        const userId = await getActiveAuthUserId();
        const currentUser = window.loggedInUser || JSON.parse(localStorage.getItem('lexisense_user') || 'null');
        const userRole = currentUser?.role || 'parent';
        const username = currentUser ? (currentUser.username || currentUser.name) : 'guest';

        let query = client.from('screening_results').select('*');

        if (!forceAll && userRole === 'parent') {
            if (userId && isValidUUID(userId)) {
                query = query.eq('parent_id', userId);
            }
        }

        const { data, error } = await query.order('created_at', { ascending: false });

        if (error) {
            console.warn('Supabase Error fetching history:', error.message);
            return [];
        }

        if (!data || !Array.isArray(data)) return [];

        return formatHistoryArray(data);
    } catch (e) {
        console.warn('Exception loading history from Supabase:', e);
        return [];
    }
}

/**
 * Loads all screening results across the whole platform for Super Admin & Admin
 */
async function loadAllScreeningsFromSupabase() {
    return await loadHistoryFromSupabase(true);
}

function formatHistoryArray(rawHistory) {
    return rawHistory.map(h => {
        const scoreVal = typeof h.match_score === 'number' ? h.match_score : (parseInt(h.match_score, 10) || 0);
        return {
            id: h.id,
            child_id: h.child_id,
            child_name: h.child_name || 'Student',
            child: `👧 ${h.child_name || 'Student'}`,
            type: 'Full Pre-Diagnosis',
            outcome: h.risk_level || (scoreVal >= 65 ? 'Higher Indicators' : (scoreVal >= 35 ? 'Moderate Risk' : 'Low Risk')),
            risk_level: h.risk_level || (scoreVal >= 65 ? 'Tier 3 · Specialist Referral' : (scoreVal >= 35 ? 'Tier 2 · Moderate Concern' : 'Tier 1 · Low Concern')),
            score: `${scoreVal}%`,
            match_score: scoreVal,
            raw_score: h.raw_score || 0,
            adjusted_raw_score: h.adjusted_raw_score || h.raw_score || 0,
            pillar1_score: h.pillar1_score || 0,
            pillar2_score: h.pillar2_score || 0,
            pillar3_score: h.pillar3_score || 0,
            reading_wpm: h.reading_wpm || 0,
            hesitation_ms: h.hesitation_ms || 0,
            reading_seconds: h.reading_seconds || 0,
            educator_script: h.educator_script || '',
            recommendation: h.recommendation || '',
            grade: h.grade || 'Year 1',
            school: h.school || 'SK Taman Permata',
            sub_scores: h.sub_scores || {},
            date: h.created_at ? new Date(h.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Today',
            created_at: h.created_at || new Date().toISOString(),
            outcomeClass: scoreVal >= 65 ? 'bg-red-100 text-red-800' : (scoreVal >= 35 ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800')
        };
    });
}

/**
 * Saves screening result record into Supabase screening_results table
 * and updates the child profile in Supabase to status: 'Completed'.
 */
let lastScreeningSavedTimestamp = 0;
let lastScreeningSavedKey = '';

async function saveScreeningToSupabase(payload) {
    const client = getSupabase();
    if (!client) return null;

    try {
        const userId = await getActiveAuthUserId();
        const childNameStr = typeof payload.childId === 'object' ? payload.childId.name : (payload.childName || payload.childId || 'Student');
        const childIdStr = typeof payload.childId === 'object' ? payload.childId.id : payload.childId;
        const scoreVal = parseInt(payload.matchScore || payload.score || 0, 10);
        const riskLevelStr = payload.riskLevel || (scoreVal >= 65 ? 'Tier 3 · Specialist Referral' : (scoreVal >= 35 ? 'Tier 2 · Moderate Concern' : 'Tier 1 · Low Concern'));
        const riskShort = scoreVal >= 65 ? 'Higher Indicators' : (scoreVal >= 35 ? 'Moderate Risk' : 'Low Risk');

        // Deduplication Guard: Prevent double-execution within 6 seconds
        const dedupKey = `${childNameStr}_${scoreVal}`;
        const now = Date.now();
        if (lastScreeningSavedKey === dedupKey && (now - lastScreeningSavedTimestamp) < 6000) {
            console.log("Deduplicating screening save (already processed in last 6s) 🛡️");
            return { deduplicated: true };
        }
        lastScreeningSavedKey = dedupKey;
        lastScreeningSavedTimestamp = now;

        // Auto-resolve or assign LX- student/child ID
        let lxStudentId = null;
        if (typeof payload.childId === 'object' && (payload.childId.student_id || payload.childId.child_id)) {
            lxStudentId = payload.childId.student_id || payload.childId.child_id;
        } else if (typeof childIdStr === 'string' && childIdStr.startsWith('LX-')) {
            lxStudentId = childIdStr;
        } else if (payload.student_id && payload.student_id.startsWith('LX-')) {
            lxStudentId = payload.student_id;
        } else if (payload.child_id && payload.child_id.startsWith('LX-')) {
            lxStudentId = payload.child_id;
        } else {
            const currentUser = window.loggedInUser || JSON.parse(localStorage.getItem('lexisense_user') || 'null');
            const username = currentUser ? (currentUser.username || 'guest') : 'guest';
            try {
                const userChildren = JSON.parse(localStorage.getItem(`lexisense_children_${username.toLowerCase()}`) || '[]');
                const found = userChildren.find(c => c.name?.toLowerCase() === childNameStr.toLowerCase());
                if (found?.student_id || found?.child_id) {
                    lxStudentId = found.student_id || found.child_id;
                }
            } catch(e) {}
            if (!lxStudentId) {
                lxStudentId = 'LX-' + Math.floor(1000 + Math.random() * 9000);
            }
        }

        const recordData = {
            child_id: lxStudentId,
            student_id: lxStudentId,
            child_name: childNameStr,
            match_score: scoreVal,
            risk_level: riskLevelStr,
            raw_score: parseInt(payload.rawScore || 0, 10),
            adjusted_raw_score: parseInt(payload.adjustedRawScore || payload.rawScore || 0, 10),
            pillar1_score: parseInt(payload.pillar1Score || 0, 10),
            pillar2_score: parseInt(payload.pillar2Score || 0, 10),
            pillar3_score: parseInt(payload.pillar3Score || 0, 10),
            reading_wpm: Math.round(payload.temporalMetrics?.calculatedWCPM || payload.temporalMetrics?.calculatedWPM || 0),
            hesitation_ms: Math.round(payload.temporalMetrics?.avgHesitationMs || 0),
            reading_seconds: Math.round(payload.temporalMetrics?.totalReadingSeconds || 0),
            educator_script: payload.educatorScript || '',
            recommendation: payload.recommendation || '',
            sub_scores: payload.subScores || {},
            created_at: new Date().toISOString()
        };

        if (userId && isValidUUID(userId)) {
            recordData.parent_id = userId;
        }

        console.log("Saving screening result to Supabase 🚀:", recordData);

        // 1. Insert into screening_results (and fallback to screenings table)
        let savedScreeningId = null;
        const { data, error } = await client
            .from('screening_results')
            .insert([recordData])
            .select();

        if (error) {
            console.warn("Notice inserting into 'screening_results', trying 'screenings':", error.message);
            try {
                const { data: altData } = await client.from('screenings').insert([recordData]).select();
                if (altData && altData[0]?.id) savedScreeningId = altData[0].id;
            } catch (e) {}
        } else if (data && data[0]?.id) {
            savedScreeningId = data[0].id;
            console.log("Saved screening result to Supabase successfully 📊⚡:", data);
        }

        // 2. Update students and children table in Supabase
        const studentUpdate = {
            student_id: lxStudentId,
            status: 'Completed',
            risk: riskShort,
            match_score: scoreVal,
            score: scoreVal,
            pillar1_score: parseInt(payload.pillar1Score || 0, 10),
            pillar2_score: parseInt(payload.pillar2Score || 0, 10),
            pillar3_score: parseInt(payload.pillar3Score || 0, 10),
            reading_wpm: Math.round(payload.temporalMetrics?.calculatedWCPM || payload.temporalMetrics?.calculatedWPM || 45),
            diagnostic_area: payload.recommendation || `Screening completed with ${scoreVal}% Risk Index`,
            date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
        };

        const childrenUpdate = {
            child_id: lxStudentId,
            student_id: lxStudentId,
            status: 'Completed',
            risk: riskShort,
            score: scoreVal,
            match_score: scoreVal,
            pillar1_score: parseInt(payload.pillar1Score || 0, 10),
            pillar2_score: parseInt(payload.pillar2Score || 0, 10),
            pillar3_score: parseInt(payload.pillar3Score || 0, 10),
            reading_wpm: Math.round(payload.temporalMetrics?.calculatedWCPM || payload.temporalMetrics?.calculatedWPM || 45),
            diagnostic_area: payload.recommendation || `Screening completed with ${scoreVal}% Risk Index`
        };

        const isFromAdmin = (typeof payload.isAdmin !== 'undefined' && payload.isAdmin) ||
                            (typeof isAdminMode === 'function' && isAdminMode());

        if (isFromAdmin) {
            try {
                if (childIdStr && isValidUUID(childIdStr)) {
                    await client.from('students').update(studentUpdate).eq('id', childIdStr);
                } else if (childNameStr) {
                    await client.from('students').update(studentUpdate).ilike('name', childNameStr);
                }
                console.log(`Updated student "${childNameStr}" status to 'Completed' in Supabase students table 🎓✅`);
            } catch (errSync) {
                console.warn("Notice updating students table in Supabase:", errSync);
            }
        } else {
            try {
                if (childIdStr && isValidUUID(childIdStr)) {
                    await client.from('children').update(childrenUpdate).eq('id', childIdStr);
                } else if (lxStudentId) {
                    const { data: cRes, error: cErr } = await client.from('children').update(childrenUpdate).or(`child_id.eq.${lxStudentId},student_id.eq.${lxStudentId}`);
                    if (cErr || !cRes || cRes.length === 0) {
                        await client.from('children').update(childrenUpdate).ilike('name', childNameStr);
                    }
                } else if (childNameStr) {
                    await client.from('children').update(childrenUpdate).ilike('name', childNameStr);
                }
                console.log(`Updated child "${childNameStr}" status to 'Completed' (Risk: ${riskShort}) in Supabase children table 👶✅`);
            } catch (cSyncErr) {
                console.warn("Notice updating children table in Supabase:", cSyncErr);
            }
        }

        // 3. Save Questionnaire Responses to Supabase (Clean LX- ID)
        try {
            const questionnairePayload = {
                student_name: childNameStr,
                child_name: childNameStr,
                student_id: lxStudentId,
                child_id: lxStudentId,
                screening_id: savedScreeningId,
                answers: typeof questionnaireAnswers !== 'undefined' ? questionnaireAnswers : (payload.answers || {}),
                sub_scores: payload.subScores || {},
                total_score: parseInt(payload.rawScore || 0, 10),
                pillar1_score: parseInt(payload.pillar1Score || 0, 10),
                created_at: new Date().toISOString()
            };
            if (userId && isValidUUID(userId)) questionnairePayload.user_id = userId;

            await client.from('questionnaire_responses').insert([questionnairePayload]);
            console.log("Saved questionnaire responses to Supabase 'questionnaire_responses' table 📝✅");
        } catch (qErr) {
            console.warn("Notice saving questionnaire responses:", qErr);
        }

        // 4. Save Eye Tracking Data to Supabase (Clean LX- ID & Deduplicated)
        try {
            const eyePayload = {
                student_name: childNameStr,
                child_name: childNameStr,
                student_id: lxStudentId,
                child_id: lxStudentId,
                screening_id: savedScreeningId,
                calibration_quality: payload.temporalMetrics?.calibrationQualityGate || 'Good',
                calibration_error_px: Math.round(payload.temporalMetrics?.calibrationMedianErrorPx || 0),
                words_attempted: parseInt(payload.temporalMetrics?.wordsAttempted || 0, 10),
                oral_errors_count: parseInt(payload.temporalMetrics?.oralErrorsCount || 0, 10),
                reading_wpm: Math.round(payload.temporalMetrics?.calculatedWCPM || payload.temporalMetrics?.calculatedWPM || 45),
                regressions_count: parseInt(payload.temporalMetrics?.regressionsCount || 0, 10),
                regression_rate: Math.round(payload.temporalMetrics?.normalizedRegressionRate || 0),
                hesitation_ms: Math.round(payload.temporalMetrics?.avgHesitationMs || 0),
                fixation_stability: Math.round(payload.temporalMetrics?.fixationStability || 85),
                total_reading_seconds: Math.round(payload.temporalMetrics?.totalReadingSeconds || 0),
                gaze_trail: payload.temporalMetrics?.gazeTrail || [],
                created_at: new Date().toISOString()
            };
            if (userId && isValidUUID(userId)) eyePayload.user_id = userId;

            const { error: eyeErr } = await client.from('eye_tracking_data').insert([eyePayload]);
            if (eyeErr) {
                await client.from('eye_tracking').insert([eyePayload]);
            }
            console.log("Saved eye-tracking biometric data to Supabase 'eye_tracking_data' table 👁️✅");
        } catch (eyeErr) {
            console.warn("Notice saving eye tracking data:", eyeErr);
        }

        // 5. Log activity in audit_logs
        try {
            if (typeof logAuditToSupabase === 'function') {
                const currentUser = window.loggedInUser || JSON.parse(localStorage.getItem('lexisense_user') || 'null');
                const actorName = currentUser?.full_name || currentUser?.name || 'Faiz Ikhwan';
                logAuditToSupabase(actorName, 'COMPLETE_SCREENING', `Completed 3-pillar screening for "${childNameStr}" (Score: ${scoreVal}%, Risk: ${riskShort})`);
            }
        } catch (audErr) {}

        return data;
    } catch (e) {
        console.warn("Exception saving screening result to Supabase:", e);
        return null;
    }
}

/**
 * Deletes a screening result from Supabase
 */
async function deleteScreeningFromSupabase(screeningId) {
    const client = getSupabase();
    if (!client) return false;

    try {
        const { error } = await client.from('screening_results').delete().eq('id', screeningId);
        if (error) {
            console.error("Supabase Screening Delete Error:", error.message);
            return false;
        }
        return true;
    } catch (e) {
        console.error("Exception deleting screening from Supabase:", e);
        return false;
    }
}

// ==============================================================================
// 3. USER PROFILES MANAGEMENT (SUPABASE)
// ==============================================================================

/**
 * Loads all user profiles for Super Admin
 */
async function loadAllProfilesFromSupabase() {
    const client = getSupabase();
    if (!client) return [];

    try {
        const { data, error } = await client
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.warn("Supabase profiles query error:", error.message);
            return [];
        }

        if (!data || !Array.isArray(data)) return [];

        return data.map(p => ({
            id: p.id,
            full_name: p.full_name || p.name || p.username || 'User',
            username: p.username || p.email?.split('@')[0] || 'user',
            email: p.email || 'user@lexisense.ai',
            role: p.role || 'parent',
            school: p.school || p.school_branch || p.school_name || 'SK Taman Ria',
            is_active: p.is_active !== false,
            status: p.is_active === false ? 'disabled' : (p.is_approved === false ? 'pending' : (p.status || 'active')),
            avatar: p.avatar_url || '👩',
            created_at: p.created_at ? p.created_at.split('T')[0] : new Date().toISOString().split('T')[0],
            last_login: 'Active Now'
        }));
    } catch (e) {
        console.warn("Exception loading profiles from Supabase:", e);
        return [];
    }
}

/**
 * Updates a user's role, active status, or details in Supabase
 */
async function updateUserProfileInSupabase(userId, updateFields) {
    const client = getSupabase();
    if (!client) return false;

    try {
        const payload = { ...updateFields, updated_at: new Date().toISOString() };
        const { data, error } = await client
            .from('profiles')
            .update(payload)
            .eq('id', userId)
            .select();

        if (error) {
            console.error("Supabase update profile error:", error.message);
            return false;
        }
        console.log("Updated user profile in Supabase ⚡:", data);
        return true;
    } catch (e) {
        console.error("Exception updating profile in Supabase:", e);
        return false;
    }
}

/**
 * Deletes a user profile from Supabase
 */
async function deleteUserFromSupabase(userId) {
    const client = getSupabase();
    if (!client) return false;

    try {
        const { error } = await client.from('profiles').delete().eq('id', userId);
        if (error) {
            console.error("Supabase delete profile error:", error.message);
            return false;
        }
        return true;
    } catch (e) {
        console.error("Exception deleting user from Supabase:", e);
        return false;
    }
}

// ==============================================================================
// 4. AUDIT LOGS (SUPABASE)
// ==============================================================================

async function logAuditToSupabase(actor, event, target, status = 'SUCCESS') {
    const client = getSupabase();
    if (!client) return;

    try {
        await client.from('audit_logs').insert([{
            actor: actor || 'system',
            event: event || 'ACTIVITY',
            target: target || 'Record',
            ip: '127.0.0.1',
            status: status,
            timestamp: new Date().toISOString()
        }]);
    } catch (e) {}
}

async function loadAuditLogsFromSupabase() {
    const client = getSupabase();
    if (!client) return [];

    try {
        const { data, error } = await client
            .from('audit_logs')
            .select('*')
            .order('timestamp', { ascending: false })
            .limit(50);

        if (!error && Array.isArray(data)) {
            return data.map(l => ({
                id: l.id,
                timestamp: l.timestamp ? new Date(l.timestamp).toLocaleString('en-GB') : new Date().toLocaleString(),
                actor: l.actor || 'admin',
                event: l.event || 'ACTIVITY',
                target: l.target || 'System',
                ip: l.ip || '127.0.0.1',
                status: l.status || 'SUCCESS'
            }));
        }
        return [];
    } catch (e) {
        return [];
    }
}

// ==============================================================================
// 5. TEACHER FOLLOW-UPS MANAGEMENT (SUPABASE)
// ==============================================================================

/**
 * Loads all teacher follow-up records from Supabase teacher_followups table
 */
async function loadFollowupsFromSupabase() {
    const client = getSupabase();
    if (!client) return [];

    try {
        const { data, error } = await client
            .from('teacher_followups')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.warn("Notice loading teacher followups from Supabase:", error.message);
            return [];
        }

        if (!data || !Array.isArray(data)) return [];

        return data.map(f => ({
            id: f.id,
            dbId: f.id,
            student: f.student_name || f.student || 'Unnamed Student',
            student_id: f.student_id || null,
            class: f.class_name || f.class || 'Class 1A',
            action: f.action_plan || f.action || 'Educator Action',
            date: f.date || f.scheduled_date || 'Today',
            status: f.status || 'Pending',
            notes: f.notes || '',
            teacher_name: f.teacher_name || null,
            teacher_email: f.teacher_email || null,
            school: f.school || 'SK Taman Permata',
            created_at: f.created_at || new Date().toISOString()
        }));
    } catch (e) {
        console.warn("Exception loading followups from Supabase:", e);
        return [];
    }
}

/**
 * Saves a new teacher follow-up record into Supabase
 */
async function saveFollowupToSupabase(followupObj) {
    const client = getSupabase();
    if (!client) return null;

    try {
        const studentName = followupObj.student_name || followupObj.student || 'Unnamed Student';
        const className = followupObj.class_name || followupObj.class || 'Class 1A';
        const actionPlan = followupObj.action_plan || followupObj.action || 'Educator Action Plan';
        const dateVal = followupObj.date || followupObj.scheduled_date || new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
        const statusVal = followupObj.status || 'Pending';
        const notesVal = followupObj.notes || '';

        const record = {
            student_name: studentName,
            class_name: className,
            action_plan: actionPlan,
            date: dateVal,
            status: statusVal,
            notes: notesVal
        };

        const { data, error } = await client
            .from('teacher_followups')
            .insert([record])
            .select();

        if (error) {
            console.error("Supabase Follow-Up Insert Error:", error.message);
            return null;
        }

        console.log("Teacher Follow-Up saved to Supabase 📝⚡:", data);
        return data && data[0] ? data[0] : null;
    } catch (e) {
        console.error("Exception saving followup to Supabase:", e);
        return null;
    }
}

/**
 * Updates status of a teacher follow-up in Supabase
 */
async function updateFollowupStatusInSupabase(followupId, newStatus) {
    const client = getSupabase();
    if (!client || !followupId) return false;

    try {
        let query = client.from('teacher_followups').update({
            status: newStatus
        });

        if (isValidUUID(followupId)) {
            query = query.eq('id', followupId);
        } else {
            query = query.or(`id.eq.${followupId},student_name.ilike.${followupId}`);
        }

        const { error } = await query;
        if (error) {
            console.warn("Notice updating followup in Supabase:", error.message);
            return false;
        }
        console.log(`Updated followup ${followupId} status to "${newStatus}" in Supabase ⚡`);
        return true;
    } catch (e) {
        console.warn("Exception updating followup in Supabase:", e);
        return false;
    }
}

/**
 * Deletes a teacher follow-up from Supabase
 */
async function deleteFollowupFromSupabase(followupId) {
    const client = getSupabase();
    if (!client || !followupId) return false;

    try {
        let query = client.from('teacher_followups').delete();

        if (isValidUUID(followupId)) {
            query = query.eq('id', followupId);
        } else {
            query = query.or(`id.eq.${followupId},student_name.ilike.${followupId}`);
        }

        const { error } = await query;
        if (error) {
            console.warn("Notice deleting followup from Supabase:", error.message);
            return false;
        }
        console.log(`Deleted followup ${followupId} from Supabase 🗑️⚡`);
        return true;
    } catch (e) {
        console.warn("Exception deleting followup from Supabase:", e);
        return false;
    }
}

// Initialize on DOM Load
document.addEventListener('DOMContentLoaded', () => {
    getSupabase();
});
