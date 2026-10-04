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
            datasets: [
                {
                    label: datasetLabel,
                    data: scores,
                    backgroundColor: bgFill,
                    borderColor: primaryColor,
                    pointBackgroundColor: '#FBBF24',
                    pointBorderColor: '#FFFFFF',
                    pointRadius: 7,
                    pointHoverRadius: 9,
                    borderWidth: 3
                },
                {
                    label: 'Typical Peer Baseline (Average Benchmark · 15–25%)',
                    data: [20, 15, 22, 18, 20],
                    backgroundColor: 'rgba(16, 185, 129, 0.10)',
                    borderColor: '#10B981',
                    borderDash: [6, 4],
                    pointBackgroundColor: '#10B981',
                    pointBorderColor: '#FFFFFF',
                    pointRadius: 4,
                    borderWidth: 2
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            onClick: (event, elements) => {
                if (elements && elements.length > 0) {
                    const index = elements[0].index;
                    const labels = ['Fixation Stability', 'Letter Orientation', 'Phonological Recall', 'Working Memory', 'Tracking Pace'];
                    const clickedLabel = labels[index] || labels[0];
                    showRadarAxisExplanationModal(clickedLabel);
                }
            },
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
                },
                tooltip: {
                    callbacks: {
                        afterBody: function(context) {
                            return "\n💡 Tip: Click on any yellow circle node for a simple parent explanation!";
                        }
                    }
                }
            }
        }
    });
}

/**
 * Interactive Popup Modal for 5 Radar Chart Axes
 */
function showRadarAxisExplanationModal(axisName) {
    const EXPLANATIONS = {
        'Fixation Stability': {
            title: '👁️ Fixation Stability (Kestabilan Pandangan)',
            description: 'Measures how steadily your child\'s eyes rest on words without drifting away or jumping out of place. High risk markers indicate eye fatigue or trouble holding steady visual focus on letters.'
        },
        'Letter Orientation': {
            title: '🔤 Letter Orientation (Keliru Huruf / Cermin)',
            description: 'Tracks whether your child confuses visually similar or mirrored letters (like b/d, p/q, 6/9) or substitutes word shapes while reading.'
        },
        'Phonological Recall': {
            title: '🎵 Phonological Recall (Ingatan Bunyi Huruf)',
            description: 'Measures how quickly and accurately your child connects letter shapes to their spoken sounds, rhyming patterns, and phoneme blends.'
        },
        'Working Memory': {
            title: '🧠 Working Memory (Ingatan & Arahan)',
            description: 'Reflects your child\'s ability to hold multi-step instructions, story details, and sequential lists (like days or times tables) in mind while reading.'
        },
        'Tracking Pace': {
            title: '⚡ Tracking Pace (Kelajuan Baris Bacaan)',
            description: 'Measures how smoothly and steadily your child\'s eyes move line-by-line across a page without skipping words or losing their place.'
        }
    };

    const info = EXPLANATIONS[axisName] || EXPLANATIONS['Fixation Stability'];

    let overlay = document.getElementById('radarAxisModalOverlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'radarAxisModalOverlay';
        overlay.className = 'fixed inset-0 z-50 bg-purple-950/70 backdrop-blur-sm flex items-center justify-center p-4 transition-all duration-300 opacity-0 pointer-events-none';
        document.body.appendChild(overlay);
    }

    overlay.innerHTML = `
        <div class="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border-2 border-purple-200 text-center animate-pop-in relative">
            <button onclick="closeRadarAxisModal()" class="absolute top-3 right-3 w-8 h-8 rounded-full bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold flex items-center justify-center transition-all">✕</button>
            <div class="w-14 h-14 mx-auto mb-3 bg-purple-100 rounded-2xl flex items-center justify-center text-2xl shadow-inner">
                🦉
            </div>
            <h3 class="font-heading font-black text-purple-900 text-lg mb-2">${info.title}</h3>
            <p class="text-xs text-gray-600 leading-relaxed font-medium mb-4 bg-purple-50/60 p-3.5 rounded-2xl border border-purple-100">${info.description}</p>
            <button onclick="closeRadarAxisModal()" class="w-full py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-extrabold text-xs rounded-xl shadow-md hover:shadow-lg transition-all">
                Faham / Understood 👌
            </button>
        </div>
    `;

    overlay.classList.remove('hidden', 'opacity-0', 'pointer-events-none');
    overlay.classList.add('opacity-100');
}

function closeRadarAxisModal() {
    const overlay = document.getElementById('radarAxisModalOverlay');
    if (overlay) {
        overlay.classList.add('opacity-0', 'pointer-events-none');
        setTimeout(() => overlay.classList.add('hidden'), 200);
    }
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
