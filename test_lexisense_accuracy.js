/**
 * LexiSense — Synthetic Unit & Accuracy Verification Test Suite
 * 
 * Purpose: Automated unit tests using synthetic (mock) profiles to verify the 
 * mathematical correctness, weight distribution, and boundary logic of the 
 * LexiSense 3-Pillar Multimodal Dyslexia Screening Engine.
 */

const GRADE_FLUENCY_NORMS = {
    'Year 1': { expectedWCPM: 50, sd: 15 },
    'Year 2': { expectedWCPM: 75, sd: 20 },
    'Year 3': { expectedWCPM: 90, sd: 20 },
    'Year 4': { expectedWCPM: 105, sd: 22 },
    'Year 5': { expectedWCPM: 120, sd: 25 },
    'Year 6': { expectedWCPM: 135, sd: 25 }
};

/**
 * Pure calculation function for 3-Pillar Risk Engine
 */
function calculate3PillarScore({ questionnaireAnswers, gazeData, grade = 'Year 4' }) {
    // 1. Pillar 1: Behavioral Questionnaire (40%)
    let rawScore = 0;
    let validQuestionsCount = 0;

    Object.values(questionnaireAnswers).forEach(val => {
        if (val !== undefined && val >= 0) { // Exclude -1 (N/A)
            rawScore += val;
            validQuestionsCount++;
        }
    });

    const maxPossibleRaw = Math.max(validQuestionsCount * 3, 1);
    const pillar1Score = Math.min(100, Math.round((rawScore / maxPossibleRaw) * 100));

    // 2. Pillar 2 & 3 calculation if Gaze Data is provided
    let pillar2Score = 0;
    let pillar3Score = 0;
    let matchScore = 0;
    let isMultimodal = false;

    const norm = GRADE_FLUENCY_NORMS[grade] || GRADE_FLUENCY_NORMS['Year 4'];

    if (gazeData && gazeData.isRealGazeData && gazeData.wordsAttempted > 0) {
        isMultimodal = true;
        
        // Pillar 2: Oral Reading Fluency & WCPM Age-Normed Z-Score (40%)
        const observedWCPM = gazeData.calculatedWCPM;
        const zFluencyScore = (norm.expectedWCPM - observedWCPM) / norm.sd;
        pillar2Score = Math.max(5, Math.min(98, Math.round(50 + (zFluencyScore * 20))));

        // Pillar 3: Ocular Saccadic Regressions & Dispersion Index (20%)
        const regressionDeficit = Math.min(50, gazeData.normalizedRegressionRate * 2.2);
        const stabilityDeficit = Math.max(0, 85 - gazeData.fixationStability);
        pillar3Score = Math.max(5, Math.min(98, Math.round(regressionDeficit + (stabilityDeficit * 0.8))));

        matchScore = Math.round(
            (pillar1Score * 0.40) +
            (pillar2Score * 0.40) +
            (pillar3Score * 0.20)
        );
    } else {
        matchScore = pillar1Score;
    }

    let riskLevel = 'Few Indicators Observed';
    if (matchScore >= 65) {
        riskLevel = 'Elevated Indicators Observed';
    } else if (matchScore >= 35) {
        riskLevel = 'Some Indicators Observed';
    }

    return {
        pillar1Score,
        pillar2Score,
        pillar3Score,
        matchScore,
        riskLevel,
        isMultimodal
    };
}

// Simple assertion helper
function assertEqual(actual, expected, testName) {
    if (actual === expected) {
        console.log(`[PASS] ${testName}`);
        return true;
    } else {
        console.error(`[FAIL] ${testName} — Expected ${expected}, got ${actual}`);
        return false;
    }
}

function assertRange(actual, min, max, testName) {
    if (actual >= min && actual <= max) {
        console.log(`[PASS] ${testName} (${actual} is in [${min}, ${max}])`);
        return true;
    } else {
        console.error(`[FAIL] ${testName} — Expected between ${min} and ${max}, got ${actual}`);
        return false;
    }
}

// Run Test Suite
function runTestSuite() {
    console.log("==================================================");
    console.log(" LexiSense Synthetic Accuracy & Unit Test Suite ");
    console.log("==================================================\n");

    let passed = 0;
    let total = 0;

    // Test 1: Low Risk Profile (Questionnaire Only)
    total++;
    const qAnswersLow = {};
    for (let i = 1; i <= 30; i++) qAnswersLow[i] = 0; // Never (0)
    const result1 = calculate3PillarScore({ questionnaireAnswers: qAnswersLow });
    if (
        assertEqual(result1.pillar1Score, 0, "Test 1.1: Low Risk Questionnaire Score") &&
        assertEqual(result1.riskLevel, 'Few Indicators Observed', "Test 1.2: Low Risk Classification")
    ) passed++;

    // Test 2: High Risk Profile (Questionnaire Only)
    total++;
    const qAnswersHigh = {};
    for (let i = 1; i <= 30; i++) qAnswersHigh[i] = 3; // Severe (3)
    const result2 = calculate3PillarScore({ questionnaireAnswers: qAnswersHigh });
    if (
        assertEqual(result2.pillar1Score, 100, "Test 2.1: High Risk Questionnaire Score") &&
        assertEqual(result2.riskLevel, 'Elevated Indicators Observed', "Test 2.2: High Risk Classification")
    ) passed++;

    // Test 3: N/A Exclude Handling (15 Answered as 3, 15 Answered as N/A -1)
    total++;
    const qAnswersNA = {};
    for (let i = 1; i <= 15; i++) qAnswersNA[i] = 3;
    for (let i = 16; i <= 30; i++) qAnswersNA[i] = -1; // N/A
    const result3 = calculate3PillarScore({ questionnaireAnswers: qAnswersNA });
    if (
        assertEqual(result3.pillar1Score, 100, "Test 3.1: N/A Denominator Exclusion Math") &&
        assertEqual(result3.riskLevel, 'Elevated Indicators Observed', "Test 3.2: Correct Risk despite 50% N/A")
    ) passed++;

    // Test 4: Multimodal Triangulation (Low Questionnaire + Slow Reading WCPM + High Regressions)
    total++;
    const gazeDataHighRisk = {
        isRealGazeData: true,
        wordsAttempted: 100,
        calculatedWCPM: 40, // Expected Year 4 is 105 -> Low WCPM
        normalizedRegressionRate: 18, // High regression rate
        fixationStability: 50 // Low stability
    };
    const result4 = calculate3PillarScore({ 
        questionnaireAnswers: qAnswersLow, // 0%
        gazeData: gazeDataHighRisk,
        grade: 'Year 4'
    });
    // Pillar 1: 0, Pillar 2: ~98 (z = (105-40)/22 = 2.95 -> max 98), Pillar 3: ~68
    // Match Score: 0*0.4 + 98*0.4 + 68*0.2 = ~53 -> Moderate Risk
    if (
        assertRange(result4.matchScore, 45, 60, "Test 4.1: Multimodal 3-Pillar Weight Integration") &&
        assertEqual(result4.riskLevel, 'Some Indicators Observed', "Test 4.2: Multimodal Risk Triage")
    ) passed++;

    // Test 5: Boundary Risk Classification Check (Moderate Risk threshold 35%)
    total++;
    const qAnswersMod = {};
    for (let i = 1; i <= 30; i++) qAnswersMod[i] = 1; // Mild (1) -> 30/90 = 33.3% -> 33
    const result5 = calculate3PillarScore({ questionnaireAnswers: qAnswersMod });
    if (
        assertEqual(result5.pillar1Score, 33, "Test 5.1: Boundary Questionnaire Score (33%)") &&
        assertEqual(result5.riskLevel, 'Few Indicators Observed', "Test 5.2: Strict Below-35% Threshold Check")
    ) passed++;

    console.log("\n--------------------------------------------------");
    console.log(` Test Results: ${passed}/${total} test cases passed.`);
    console.log("--------------------------------------------------\n");
}

runTestSuite();
