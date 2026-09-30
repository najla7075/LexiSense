/**
 * LexiSense - Dynamic Chart.js Radar & Category Comparison Module
 * Fully responsive to selected assessment date records and comparison sessions.
 */

let radarChartInstance = null;
let comparisonChartInstance = null;

/**
 * Renders 5-Axis Diagnostic Radar Chart dynamically based on the selected assessment record
 */
function renderRadarChart(recordOrChildName, matchScoreOverride, riskLevelOverride) {
    const canvas = document.getElementById('reportRadarChart');
    if (!canvas) return;

    if (radarChartInstance) {
        radarChartInstance.destroy();
        radarChartInstance = null;
    }

    if (typeof Chart === 'undefined') {
        console.warn('Chart.js library not loaded yet.');
        return;
    }

    let childName = 'Child';
    let riskLevel = 'Moderate Risk';
    let matchScore = 64;
    let recordDate = 'Recent';

    if (typeof recordOrChildName === 'object' && recordOrChildName !== null) {
        if (recordOrChildName.match_score !== undefined || recordOrChildName.score !== undefined) {
            // Full assessment record object passed!
            const record = recordOrChildName;
            childName = record.child_name || (record.child ? record.child.replace(/^[^\w]+/, '').trim() : 'Child');
            riskLevel = record.risk_level || record.outcome || 'Moderate Risk';
            matchScore = parseInt(record.match_score || record.score || 64, 10);
            recordDate = record.date || 'Recent';
        } else {
            childName = recordOrChildName.name || 'Child';
        }
    } else if (typeof recordOrChildName === 'string' && recordOrChildName) {
        childName = recordOrChildName;
    }

    if (matchScoreOverride !== undefined) matchScore = parseInt(matchScoreOverride, 10);
    if (riskLevelOverride !== undefined) riskLevel = riskLevelOverride;

    // Scale scores dynamically based on the exact matchScore of the selected assessment session
    const base = Math.min(95, Math.max(15, matchScore));
    const scores = [
        Math.min(98, Math.max(15, Math.round(base * 1.08))), // Fixation Stability
        Math.min(98, Math.max(15, Math.round(base * 0.88))), // Letter Orientation
        Math.min(98, Math.max(15, Math.round(base * 1.02))), // Phonological Recall
        Math.min(98, Math.max(15, Math.round(base * 0.94))), // Working Memory
        Math.min(98, Math.max(15, Math.round(base * 0.90)))  // Tracking Pace
    ];

    const isHigh = matchScore >= 70;
    const isMod = matchScore >= 36 && matchScore < 70;
    const primaryColor = isHigh ? '#DC2626' : (isMod ? '#D97706' : '#10B981');
    const bgFill = isHigh ? 'rgba(220, 38, 38, 0.22)' : (isMod ? 'rgba(217, 119, 6, 0.22)' : 'rgba(16, 185, 129, 0.22)');

    const datasetLabel = `${childName} (${recordDate} · ${riskLevel} · ${matchScore}%)`;

    radarChartInstance = new Chart(canvas, {
        type: 'radar',
        data: {
            labels: ['Fixation Stability', 'Letter Orientation', 'Phonological Recall', 'Working Memory', 'Tracking Pace'],
            datasets: [{
                label: datasetLabel,
                data: scores,
                backgroundColor: bgFill,
                borderColor: primaryColor,
                pointBackgroundColor: '#FBBF24',
                pointBorderColor: '#FFFFFF',
                pointRadius: 6,
                borderWidth: 3
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                r: {
                    min: 0,
                    max: 100,
                    ticks: { display: false },
                    grid: { color: '#E9D5FF' },
                    pointLabels: {
                        font: { family: 'Nunito', size: 10, weight: '700' },
                        color: '#3B0764'
                    }
                }
            },
            plugins: {
                legend: {
                    display: true,
                    labels: { font: { family: 'Nunito', size: 11, weight: '800' }, color: '#3B0764' }
                }
            }
        }
    });
}

/**
 * Renders Visual Category Comparison Bar Chart dynamically for Session A vs Session B
 */
function renderComparisonChart(recordA, recordB) {
    const canvas = document.getElementById('comparisonBarChart');
    if (!canvas) return;

    if (comparisonChartInstance) {
        comparisonChartInstance.destroy();
        comparisonChartInstance = null;
    }

    if (typeof Chart === 'undefined') return;

    const valA = recordA ? parseInt(recordA.match_score || recordA.score || 64, 10) : 64;
    const valB = recordB ? parseInt(recordB.match_score || recordB.score || 48, 10) : 48;

    const labelA = recordA ? `Session A (${recordA.date || 'Recent'} · ${valA}%)` : `Session A (${valA}%)`;
    const labelB = recordB ? `Session B (${recordB.date || 'Previous'} · ${valB}%)` : `Session B (${valB}%)`;

    const scoresA = [
        Math.min(98, Math.max(15, Math.round(valA * 1.05))),
        Math.min(98, Math.max(15, Math.round(valA * 0.92))),
        Math.min(98, Math.max(15, Math.round(valA * 1.02))),
        Math.min(98, Math.max(15, Math.round(valA * 0.96))),
        Math.min(98, Math.max(15, Math.round(valA * 0.88)))
    ];

    const scoresB = [
        Math.min(98, Math.max(15, Math.round(valB * 1.05))),
        Math.min(98, Math.max(15, Math.round(valB * 0.92))),
        Math.min(98, Math.max(15, Math.round(valB * 1.02))),
        Math.min(98, Math.max(15, Math.round(valB * 0.96))),
        Math.min(98, Math.max(15, Math.round(valB * 0.88)))
    ];

    comparisonChartInstance = new Chart(canvas, {
        type: 'bar',
        data: {
            labels: ['Phonological', 'Eye Fixation', 'Reading Speed', 'Memory', 'Letter Symmetry'],
            datasets: [
                {
                    label: labelB,
                    data: scoresB,
                    backgroundColor: '#C084FC',
                    borderRadius: 8
                },
                {
                    label: labelA,
                    data: scoresA,
                    backgroundColor: '#7E22CE',
                    borderRadius: 8
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    min: 0,
                    max: 100,
                    grid: { color: '#F3E8FF' }
                },
                x: {
                    grid: { display: false }
                }
            },
            plugins: {
                legend: {
                    display: true,
                    labels: { font: { family: 'Nunito', size: 11, weight: '800' }, color: '#3B0764' }
                }
            }
        }
    });
}
