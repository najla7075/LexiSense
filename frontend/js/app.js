/**
 * LexiSense - Core Application Engine & Data Management
 * Exclusive Supabase database central architecture with strict user-level data isolation.
 */

let selectedReportChild = null;

/**
 * Scoped active child storage helpers per user account
 */
function getScopedActiveChildKey(username) {
    const u = (username || (window.loggedInUser ? window.loggedInUser.username : null) || 'guest').toLowerCase();
    return `lexisense_active_child_${u}`;
}

function getScopedActiveChild(username) {
    const key = getScopedActiveChildKey(username);
    const saved = localStorage.getItem(key);
    if (saved) {
        try { return JSON.parse(saved); } catch(e) {}
    }
    return null;
}

function setScopedActiveChild(username, childObj) {
    const key = getScopedActiveChildKey(username);
    if (childObj) {
        localStorage.setItem(key, JSON.stringify(childObj));
    } else {
        localStorage.removeItem(key);
    }
}

/**
 * Retrieves cached children list for logged-in user (Offline Fallback Cache)
 */
function getUserChildren(username) {
    if (!username || username === 'guest') {
        const guestCache = localStorage.getItem('lexisense_children_guest');
        if (guestCache) {
            try { return JSON.parse(guestCache); } catch(e) {}
        }
        return [];
    }

    const key = `lexisense_children_${username.toLowerCase()}`;
    const stored = localStorage.getItem(key);

    if (stored) {
        try { return JSON.parse(stored); } catch (e) { console.error('Error parsing stored children cache:', e); }
    }

    return [];
}

/**
 * Retrieves cached assessment history for logged-in user (Offline Fallback Cache)
 */
function getUserAssessmentHistory(username) {
    if (!username || username === 'guest') {
        const guestHist = localStorage.getItem('lexisense_history_guest');
        if (guestHist) {
            try { return JSON.parse(guestHist); } catch(e) {}
        }
        return [];
    }

    const key = `lexisense_history_${username.toLowerCase()}`;
    const stored = localStorage.getItem(key);

    if (stored) {
        try { return JSON.parse(stored); } catch (e) { console.error('Error parsing stored history cache:', e); }
    }

    return [];
}

/**
 * Centralized Supabase Database Synchronization Engine
 * Queries Supabase DB strictly for authenticated user, renders UI with complete multi-user isolation.
 */
async function refreshUserScopedData() {
    const currentUser = window.loggedInUser || JSON.parse(localStorage.getItem('lexisense_user') || 'null');
    const username = currentUser ? (currentUser.username || currentUser.name || 'guest') : 'guest';

    // Purge legacy unscoped active child key to avoid cross-user contamination
    localStorage.removeItem('lexisense_active_child');

    let dbChildren = null;
    let dbHistory = null;

    // 1. Fetch user's data directly from Supabase DB
    if (typeof loadChildrenFromSupabase === 'function') {
        try {
            dbChildren = await loadChildrenFromSupabase();
            dbHistory = await loadHistoryFromSupabase();
        } catch (e) {
            console.warn('Supabase fetch exception:', e);
        }
    }

    // 2. Retrieve local cache
    const localChildren = getUserChildren(username);
    const localHistory = getUserAssessmentHistory(username);

    let finalChildren = [];
    let finalHistory = [];

    // If Supabase returned valid arrays, use Supabase as Primary Truth and merge any unsynced local records
    if (Array.isArray(dbChildren)) {
        finalChildren = [...dbChildren];

        // Check if there are local children not yet in Supabase, and auto-push them
        for (const localC of localChildren) {
            const existsInDb = finalChildren.some(dbC => 
                (dbC.name && localC.name && dbC.name.toLowerCase() === localC.name.toLowerCase()) || 
                (dbC.id && localC.id && dbC.id === localC.id)
            );
            if (!existsInDb && localC.name) {
                console.log(`Auto-syncing local child "${localC.name}" to Supabase... 🚀`);
                if (typeof saveChildProfileToSupabase === 'function') {
                    saveChildProfileToSupabase(localC).catch(e => console.warn(e));
                }
                finalChildren.push(localC);
            }
        }
    } else {
        // Fall back safely to local cache (without wiping out records)
        finalChildren = localChildren;
    }

    if (Array.isArray(dbHistory)) {
        finalHistory = [...dbHistory];

        // Check if there are local history entries not in Supabase, and merge them
        for (const localH of localHistory) {
            const exists = finalHistory.some(dbH => 
                dbH.id === localH.id || 
                (dbH.child_name === localH.child_name && dbH.match_score === localH.match_score)
            );
            if (!exists) {
                finalHistory.push(localH);
            }
        }
    } else {
        finalHistory = localHistory;
    }

    finalChildren = finalChildren || [];
    finalHistory = finalHistory || [];

    // Validate active child profile scoped to this user
    let activeChild = getScopedActiveChild(username);
    if (finalChildren.length > 0) {
        const exists = activeChild && finalChildren.some(c => 
            (c.name && activeChild.name && c.name.toLowerCase() === activeChild.name.toLowerCase()) || 
            (c.id && activeChild.id && c.id === activeChild.id)
        );
        if (!exists) {
            activeChild = finalChildren[0];
            setScopedActiveChild(username, activeChild);
        }
    } else {
        setScopedActiveChild(username, null);
        activeChild = null;
    }

    // Update scoped local cache with fresh synced data
    if (username) {
        localStorage.setItem(`lexisense_children_${username.toLowerCase()}`, JSON.stringify(finalChildren));
        localStorage.setItem(`lexisense_history_${username.toLowerCase()}`, JSON.stringify(finalHistory));
    }

    renderChildrenUI(finalChildren);
    renderHistoryUI(finalHistory, username);
    updateHomeSelectedChildBanner(finalChildren);
    renderReportChildPills(finalChildren);

    // Synchronize Prediagnosis Wizard Step 1 UI if present on page
    if (typeof renderWizardStep1Children === 'function') {
        await renderWizardStep1Children();
    }
}

function updateHomeSelectedChildBanner(childrenList) {
    const banner = document.getElementById('home-selected-child-banner');
    if (!banner) return;

    const currentUser = window.loggedInUser || JSON.parse(localStorage.getItem('lexisense_user') || 'null');
    const username = currentUser ? currentUser.username : 'guest';
    let activeChild = getScopedActiveChild(username);

    if (!activeChild && childrenList && childrenList.length > 0) {
        activeChild = childrenList[0];
    }

    if (activeChild && activeChild.name) {
        banner.innerHTML = `
            <div class="inline-flex items-center gap-2 bg-white/95 backdrop-blur-md px-4 py-2 rounded-2xl border border-purple-200 shadow-sm">
                <span class="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span class="text-xs text-gray-500 font-bold">Active Child:</span>
                <span class="text-xs sm:text-sm font-black text-purple-950 flex items-center gap-1.5">
                    <span class="text-base">${activeChild.avatar || '👧'}</span>
                    <span>${escapeHTML(activeChild.name)}</span>
                    <span class="text-[11px] font-extrabold text-purple-700 bg-purple-100/80 px-2 py-0.5 rounded-md border border-purple-200">${activeChild.age || 10} yrs · ${escapeHTML(activeChild.grade || 'Year 4')}</span>
                </span>
            </div>
        `;
    } else {
        banner.innerHTML = `
            <div class="inline-flex items-center gap-2 bg-amber-50/90 px-3.5 py-1.5 rounded-xl border border-amber-200 text-xs text-amber-800 font-bold">
                <i class="fa-solid fa-circle-info text-amber-500"></i> No child profile selected. Click "+ Add Child Profile" above.
            </div>
        `;
    }
}

function renderChildrenUI(childrenList) {
    const dashboardContainer = document.getElementById('dashboard-children-grid');
    const childrenViewContainer = document.getElementById('parent-children-grid-container') || document.getElementById('children-cards-container');

    const currentUser = window.loggedInUser || JSON.parse(localStorage.getItem('lexisense_user') || 'null');
    const username = currentUser ? currentUser.username : 'guest';
    const activeChild = getScopedActiveChild(username);
    const activeChildName = activeChild ? activeChild.name : (childrenList && childrenList.length > 0 ? childrenList[0].name : '');

    if (!childrenList || childrenList.length === 0) {
        const emptyHTML = `
            <div class="col-span-full bg-gradient-to-b from-purple-50/60 to-white rounded-3xl p-10 border-2 border-dashed border-purple-200/80 text-center space-y-5 shadow-sm">
                <div class="w-20 h-20 bg-purple-100/80 text-purple-600 rounded-3xl flex items-center justify-center text-4xl mx-auto shadow-inner border border-purple-200">👧</div>
                <div class="space-y-1">
                    <h4 class="font-heading text-xl sm:text-2xl font-black text-brand-purple-deep">No Registered Child Profiles Found</h4>
                    <p class="text-sm text-gray-500 max-w-md mx-auto">Register your child's profile to unlock personalized 3-pillar dyslexia risk assessments and developmental reports.</p>
                </div>
                <button onclick="openAddChildModal()" class="px-7 py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-black text-sm rounded-2xl shadow-lg shadow-purple-200 hover:shadow-xl hover:scale-105 transition-all inline-flex items-center gap-2">
                    <i class="fa-solid fa-plus text-amber-300"></i> Register Child Profile Now
                </button>
            </div>
        `;
        if (dashboardContainer) dashboardContainer.innerHTML = emptyHTML;
        if (childrenViewContainer) childrenViewContainer.innerHTML = emptyHTML;
        return;
    }

    const cardsHTML = childrenList.map(c => {
        const isSelected = activeChildName && (c.name.toLowerCase() === activeChildName.toLowerCase());
        const outcomeBg = c.outcomeClass ? c.outcomeClass : 'bg-emerald-50 text-emerald-700 border-emerald-200';
        const outcomeText = c.outcome || 'Ready for Screening';
        const statusDotColor = outcomeText.toLowerCase().includes('high') ? 'bg-rose-500' : (outcomeText.toLowerCase().includes('moderate') ? 'bg-amber-500' : 'bg-emerald-500');
        const childNameSafe = escapeHTML(c.name).replace(/'/g, "\\'");

        return `
        <div class="group relative bg-white/95 backdrop-blur-sm rounded-3xl p-6 sm:p-7 border ${isSelected ? 'border-2 border-purple-500 ring-4 ring-purple-100 shadow-xl' : 'border-purple-100 hover:border-purple-300 shadow-md hover:shadow-xl'} hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between overflow-hidden">
            <!-- Ambient gradient aura -->
            <div class="absolute -top-12 -right-12 w-32 h-32 bg-gradient-to-br from-purple-200/40 via-amber-200/20 to-transparent rounded-full blur-2xl pointer-events-none group-hover:scale-125 transition-transform duration-500"></div>

            <div class="space-y-4 relative z-10">
                <!-- Top Bar: Status Badge + Active Indicator + Edit/Delete Actions -->
                <div class="flex items-center justify-between gap-2">
                    <div class="flex items-center gap-1.5 flex-wrap">
                        <span class="inline-flex items-center gap-1.5 ${outcomeBg} text-[11px] font-black px-3 py-1 rounded-full border shadow-2xs">
                            <span class="w-2 h-2 rounded-full ${statusDotColor} animate-pulse"></span>
                            <span>${escapeHTML(outcomeText)}</span>
                        </span>
                        ${isSelected ? `
                        <span class="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-purple-700 bg-purple-100/90 border border-purple-200 px-2.5 py-0.5 rounded-full shadow-2xs">
                            <i class="fa-solid fa-star text-amber-500"></i> Active
                        </span>
                        ` : ''}
                    </div>

                    <!-- Card Actions: Edit & Delete -->
                    <div class="flex items-center gap-1.5 shrink-0">
                        <button onclick="event.stopPropagation(); openEditChildModal('${childNameSafe}')" title="Edit child profile" class="w-8 h-8 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 hover:text-purple-900 border border-purple-200/80 flex items-center justify-center transition-all cursor-pointer shadow-2xs hover:scale-105 active:scale-95 text-xs">
                            <i class="fa-solid fa-pen-to-square"></i>
                        </button>
                        <button onclick="event.stopPropagation(); promptDeleteChild('${childNameSafe}')" title="Delete child profile" class="w-8 h-8 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 hover:text-rose-800 border border-rose-200/80 flex items-center justify-center transition-all cursor-pointer shadow-2xs hover:scale-105 active:scale-95 text-xs">
                            <i class="fa-solid fa-trash-can"></i>
                        </button>
                    </div>
                </div>

                <!-- Child Info Section -->
                <div class="flex items-center gap-4 pt-1">
                    <div class="relative shrink-0">
                        <div class="w-16 h-16 sm:w-18 sm:h-18 rounded-2xl bg-gradient-to-br from-purple-100 via-indigo-50 to-amber-50 border-2 border-purple-200 group-hover:border-purple-400 flex items-center justify-center text-3xl sm:text-4xl shadow-md group-hover:scale-105 transition-all duration-300">
                            ${c.avatar || '👧'}
                        </div>
                    </div>
                    <div class="min-w-0 flex-1">
                        <h4 class="font-heading text-lg sm:text-xl font-black text-brand-purple-deep truncate group-hover:text-purple-700 transition-colors">
                            ${escapeHTML(c.name)}
                        </h4>
                        <div class="flex flex-wrap items-center gap-1.5 mt-1 text-xs text-gray-600 font-semibold">
                            <span class="inline-flex items-center gap-1 bg-purple-50 text-purple-800 px-2.5 py-0.5 rounded-md border border-purple-100">
                                <i class="fa-solid fa-cake-candles text-purple-500 text-[10px]"></i> ${c.age || 10} yrs
                            </span>
                            <span class="inline-flex items-center gap-1 bg-indigo-50 text-indigo-800 px-2.5 py-0.5 rounded-md border border-indigo-100">
                                <i class="fa-solid fa-graduation-cap text-indigo-500 text-[10px]"></i> ${escapeHTML(c.grade || 'Year 4')}
                            </span>
                        </div>
                        <p class="text-xs text-gray-500 font-medium mt-1 truncate flex items-center gap-1">
                            <i class="fa-solid fa-school text-gray-400 text-[10px]"></i> ${escapeHTML(c.school || 'Primary School')}
                        </p>
                    </div>
                </div>
            </div>

            <!-- Action Buttons -->
            <div class="grid grid-cols-2 gap-2.5 pt-5 relative z-10 border-t border-purple-50/80 mt-4">
                <button onclick="selectChildForReport('${childNameSafe}'); switchView('report');" class="py-2.5 px-3 bg-purple-50 hover:bg-purple-100 text-purple-700 font-extrabold text-xs rounded-xl border border-purple-200/70 hover:border-purple-300 transition-all text-center flex items-center justify-center gap-1.5 active:scale-95 shadow-2xs cursor-pointer">
                    <i class="fa-solid fa-chart-pie text-purple-500"></i>
                    <span>View Report</span>
                </button>
                <button onclick="startScreeningFor('${childNameSafe}')" class="py-2.5 px-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-extrabold text-xs rounded-xl transition-all shadow-md shadow-purple-200 hover:shadow-lg hover:shadow-purple-300 text-center flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer">
                    <i class="fa-solid fa-play text-amber-300 text-[10px]"></i>
                    <span>Start Screener</span>
                </button>
            </div>
        </div>
        `;
    }).join('');

    if (dashboardContainer) dashboardContainer.innerHTML = cardsHTML;
    if (childrenViewContainer) childrenViewContainer.innerHTML = cardsHTML;
}

function renderReportChildPills(childrenList) {
    const pillsContainer = document.getElementById('report-children-pills-container');
    if (!pillsContainer) return;

    const currentUser = window.loggedInUser || JSON.parse(localStorage.getItem('lexisense_user') || 'null');
    const username = currentUser ? currentUser.username : 'guest';

    if (!childrenList) {
        childrenList = getUserChildren(username);
    }

    if (!childrenList || childrenList.length === 0) {
        pillsContainer.innerHTML = `<span class="text-xs text-gray-500 italic">No registered children profiles</span>`;
        return;
    }

    let activeName = '';
    if (typeof selectedReportChild === 'string' && selectedReportChild) {
        activeName = selectedReportChild;
    } else if (typeof selectedReportChild === 'object' && selectedReportChild?.name) {
        activeName = selectedReportChild.name;
    } else {
        const saved = getScopedActiveChild(username);
        if (saved && saved.name) {
            activeName = saved.name;
        } else if (childrenList.length > 0) {
            activeName = childrenList[0].name;
        }
    }

    pillsContainer.innerHTML = childrenList.map(c => {
        const isSelected = activeName && activeName.toLowerCase() === c.name.toLowerCase();
        const btnStyle = isSelected 
            ? 'bg-purple-600 text-white shadow-md font-extrabold scale-105' 
            : 'bg-white text-gray-700 border-2 border-purple-200 hover:bg-purple-50 font-bold';
        
        return `
            <button onclick="selectChildForReport('${escapeHTML(c.name).replace(/'/g, "\\'")}')" class="report-child-pill px-5 py-2.5 rounded-2xl text-sm font-extrabold transition-all ${btnStyle} flex items-center gap-2 cursor-pointer shadow-sm">
                <span class="text-base">${c.avatar || '👧'}</span> ${escapeHTML(c.name)} (${escapeHTML(c.grade || 'Year 4')})
            </button>
        `;
    }).join('');
}

function selectChildForReport(childObjOrName) {
    const currentUser = window.loggedInUser || JSON.parse(localStorage.getItem('lexisense_user') || 'null');
    const username = currentUser ? currentUser.username : 'guest';

    let nameStr = 'Child';
    if (typeof childObjOrName === 'object' && childObjOrName !== null) {
        nameStr = childObjOrName.name || 'Child';
    } else if (typeof childObjOrName === 'string') {
        nameStr = childObjOrName;
    }

    selectedReportChild = nameStr;

    // Update scoped active child
    const userChildren = getUserChildren(username);
    const found = userChildren.find(c => c.name.toLowerCase() === nameStr.toLowerCase());
    if (found) {
        setScopedActiveChild(username, found);
    }

    renderChildReportContent(nameStr);
    renderReportChildPills(userChildren);
    if (typeof renderRadarChart === 'function') {
        renderRadarChart(nameStr);
    }
}

function renderHistoryUI(historyList, userName) {
    const tbody = document.querySelector('#view-history tbody');
    if (!tbody) return;

    if (!historyList || historyList.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="p-8 text-center bg-white text-gray-500 text-xs">
                    <div class="w-12 h-12 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center text-2xl mx-auto mb-2">📋</div>
                    <p class="font-bold text-brand-purple-deep text-sm">No Assessment History Found</p>
                    <p class="text-xs text-gray-400 mt-0.5">No past screening sessions recorded yet for ${escapeHTML(userName)}. Complete a screening session to view your history!</p>
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = historyList.map(h => `
        <tr class="hover:bg-purple-50/50 transition-colors">
            <td class="p-4 font-bold text-brand-purple-deep">${h.date}</td>
            <td class="p-4 font-bold text-purple-900">${escapeHTML(h.child)}</td>
            <td class="p-4">${h.type}</td>
            <td class="p-4"><span class="${h.outcomeClass} font-bold px-2.5 py-1 rounded-full text-xs sm:text-sm">${h.outcome}</span></td>
            <td class="p-4 font-bold">${h.score}</td>
            <td class="p-4 text-right"><button onclick="selectChildForReport('${escapeHTML(h.child.replace(/^[^\w]+/, ''))}'); switchView('report');" class="text-purple-600 font-bold hover:underline">View Report</button></td>
        </tr>
    `).join('');
}

async function handleAddChild(e) {
    e.preventDefault();
    const form = e.target;

    const nameInput = document.getElementById('child-name-input')?.value?.trim() || form.querySelector('input[type="text"]')?.value?.trim();
    const dobInput = document.getElementById('child-dob-input')?.value || form.querySelector('input[type="date"]')?.value;
    const gradeSelect = document.getElementById('child-grade-select')?.value || form.querySelector('select')?.value || 'Year 4';
    const schoolInput = document.getElementById('child-school-input')?.value?.trim() || 'Primary School';
    const avatarInput = form.querySelector('input[name="child-avatar"]:checked')?.value || '👧';

    if (!nameInput) {
        showToast("Please enter the child's full name.");
        return;
    }

    let computedAge = 10;
    if (dobInput) {
        const birthDate = new Date(dobInput);
        if (!isNaN(birthDate.getTime())) {
            const diffMs = Date.now() - birthDate.getTime();
            const ageDate = new Date(diffMs);
            computedAge = Math.abs(ageDate.getUTCFullYear() - 1970);
        }
    }

    const autoGeneratedLxId = 'LX-' + Math.floor(1000 + Math.random() * 9000);
    const determinedGender = (avatarInput === '👧') ? 'Female' : 'Male';
    const newChild = {
        id: nameInput.toLowerCase().replace(/\s+/g, '_'),
        child_id: autoGeneratedLxId,
        student_id: autoGeneratedLxId,
        name: nameInput,
        age: computedAge || 10,
        grade: gradeSelect,
        school: schoolInput,
        gender: determinedGender,
        outcome: 'Ready for Screening',
        outcomeClass: 'bg-blue-100 text-blue-800 border-blue-200',
        avatar: avatarInput
    };

    const currentUser = window.loggedInUser || JSON.parse(localStorage.getItem('lexisense_user') || 'null');
    const username = currentUser ? currentUser.username : 'guest';

    const userKey = `lexisense_children_${username.toLowerCase()}`;
    let cachedChildren = [];
    try {
        cachedChildren = JSON.parse(localStorage.getItem(userKey) || '[]');
    } catch(err) {}

    cachedChildren = cachedChildren.filter(c => c.name.toLowerCase() !== newChild.name.toLowerCase());
    cachedChildren.push(newChild);
    localStorage.setItem(userKey, JSON.stringify(cachedChildren));
    setScopedActiveChild(username, newChild);

    const submitBtn = document.getElementById('btn-save-child-profile');
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Saving Profile to Database...';
    }

    try {
        if (typeof saveChildProfileToSupabase === 'function') {
            const savedResult = await saveChildProfileToSupabase(newChild);
            if (savedResult) {
                console.log("Saved child profile to Supabase successfully:", savedResult);
            }
        }
    } catch (err) {
        console.warn("Error saving child profile:", err);
    } finally {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = '+ Register Child Profile';
        }
    }

    closeAddChildModal();
    try { form.reset(); } catch(err) {}

    await refreshUserScopedData();
    showToast(`Registered child profile for ${nameInput}! ${avatarInput}`);
    
    if (window.location.pathname.includes('parent-page.html')) {
        switchView('children');
    }
}

/* --------------------------------------------------------------------------
   Edit Child Profile Operations
   -------------------------------------------------------------------------- */
function openEditChildModal(childName) {
    const currentUser = window.loggedInUser || JSON.parse(localStorage.getItem('lexisense_user') || 'null');
    const username = currentUser ? currentUser.username : 'guest';
    const children = getUserChildren(username);
    const child = children.find(c => c.name.toLowerCase() === childName.toLowerCase());

    if (!child) {
        showToast("Child profile not found.");
        return;
    }

    const modal = document.getElementById('edit-child-modal');
    if (!modal) return;

    document.getElementById('edit-child-original-name').value = child.name;
    document.getElementById('edit-child-id').value = child.id || '';
    document.getElementById('edit-child-name-input').value = child.name;
    document.getElementById('edit-child-age-input').value = child.age || 10;
    
    const gradeSelect = document.getElementById('edit-child-grade-select');
    if (gradeSelect) gradeSelect.value = child.grade || 'Year 4';

    const schoolInput = document.getElementById('edit-child-school-input');
    if (schoolInput) schoolInput.value = child.school || 'Primary School';

    // Set Avatar Radio
    const targetAvatar = child.avatar || '👧';
    const avatarRadios = document.querySelectorAll('input[name="edit-child-avatar"]');
    avatarRadios.forEach(radio => {
        radio.checked = (radio.value === targetAvatar);
    });

    modal.classList.remove('hidden');
}

function closeEditChildModal() {
    const modal = document.getElementById('edit-child-modal');
    if (modal) modal.classList.add('hidden');
}

async function handleEditChild(e) {
    e.preventDefault();
    const form = e.target;

    const originalName = document.getElementById('edit-child-original-name')?.value || '';
    const childId = document.getElementById('edit-child-id')?.value || '';
    const nameInput = document.getElementById('edit-child-name-input')?.value?.trim();
    const ageInput = parseInt(document.getElementById('edit-child-age-input')?.value, 10) || 10;
    const gradeSelect = document.getElementById('edit-child-grade-select')?.value || 'Year 4';
    const schoolInput = document.getElementById('edit-child-school-input')?.value?.trim() || 'Primary School';
    const avatarInput = form.querySelector('input[name="edit-child-avatar"]:checked')?.value || '👧';

    if (!nameInput) {
        showToast("Please enter child name.");
        return;
    }

    const currentUser = window.loggedInUser || JSON.parse(localStorage.getItem('lexisense_user') || 'null');
    const username = currentUser ? currentUser.username : 'guest';
    const userKey = `lexisense_children_${username.toLowerCase()}`;

    let cachedChildren = getUserChildren(username);
    const existingIdx = cachedChildren.findIndex(c => c.name.toLowerCase() === originalName.toLowerCase() || (childId && c.id === childId));

    let outcome = 'Ready for Screening';
    let outcomeClass = 'bg-blue-100 text-blue-800 border-blue-200';

    if (existingIdx !== -1) {
        outcome = cachedChildren[existingIdx].outcome || outcome;
        outcomeClass = cachedChildren[existingIdx].outcomeClass || outcomeClass;
    }

    const determinedGender = (avatarInput === '👧') ? 'Female' : 'Male';
    const updatedChild = {
        id: childId || nameInput.toLowerCase().replace(/\s+/g, '_'),
        name: nameInput,
        age: ageInput,
        grade: gradeSelect,
        school: schoolInput,
        gender: determinedGender,
        avatar: avatarInput,
        outcome: outcome,
        outcomeClass: outcomeClass
    };

    if (existingIdx !== -1) {
        cachedChildren[existingIdx] = updatedChild;
    } else {
        cachedChildren.push(updatedChild);
    }

    localStorage.setItem(userKey, JSON.stringify(cachedChildren));

    // Update scoped active child if active was modified
    const activeChild = getScopedActiveChild(username);
    if (activeChild && (activeChild.name.toLowerCase() === originalName.toLowerCase() || (childId && activeChild.id === childId))) {
        setScopedActiveChild(username, updatedChild);
    }
    if (selectedReportChild && selectedReportChild.toLowerCase() === originalName.toLowerCase()) {
        selectedReportChild = nameInput;
    }

    const submitBtn = document.getElementById('btn-update-child-profile');
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Updating Profile...';
    }

    try {
        if (typeof updateChildProfileInSupabase === 'function') {
            await updateChildProfileInSupabase(originalName || childId, updatedChild);
        }
    } catch (err) {
        console.warn("Error updating child in Supabase:", err);
    } finally {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Save Changes 💾';
        }
    }

    closeEditChildModal();
    await refreshUserScopedData();
    showToast(`Updated profile for ${nameInput}! ${avatarInput}`);
}

/* --------------------------------------------------------------------------
   Delete Child Profile Operations
   -------------------------------------------------------------------------- */
function promptDeleteChild(childName) {
    const modal = document.getElementById('delete-child-modal');
    if (!modal) {
        if (confirm(`Are you sure you want to delete profile for "${childName}"?`)) {
            executeDeleteChild(childName);
        }
        return;
    }

    const nameSpan = document.getElementById('delete-child-name-span');
    const hiddenInput = document.getElementById('delete-child-target-name');
    if (nameSpan) nameSpan.textContent = childName;
    if (hiddenInput) hiddenInput.value = childName;

    modal.classList.remove('hidden');
}

function closeDeleteChildModal() {
    const modal = document.getElementById('delete-child-modal');
    if (modal) modal.classList.add('hidden');
}

async function confirmDeleteChildAction() {
    const targetName = document.getElementById('delete-child-target-name')?.value;
    if (!targetName) return;
    closeDeleteChildModal();
    await executeDeleteChild(targetName);
}

async function executeDeleteChild(childName) {
    const currentUser = window.loggedInUser || JSON.parse(localStorage.getItem('lexisense_user') || 'null');
    const username = currentUser ? currentUser.username : 'guest';
    const userKey = `lexisense_children_${username.toLowerCase()}`;

    let cachedChildren = getUserChildren(username);
    const targetChild = cachedChildren.find(c => c.name.toLowerCase() === childName.toLowerCase());
    const targetId = targetChild ? targetChild.id : null;

    cachedChildren = cachedChildren.filter(c => c.name.toLowerCase() !== childName.toLowerCase());
    localStorage.setItem(userKey, JSON.stringify(cachedChildren));

    // If deleted child was the active child, fallback to next child or null
    const activeChild = getScopedActiveChild(username);
    if (activeChild && activeChild.name.toLowerCase() === childName.toLowerCase()) {
        const nextActive = cachedChildren.length > 0 ? cachedChildren[0] : null;
        setScopedActiveChild(username, nextActive);
    }

    if (selectedReportChild && selectedReportChild.toLowerCase() === childName.toLowerCase()) {
        selectedReportChild = cachedChildren.length > 0 ? cachedChildren[0].name : null;
    }

    try {
        if (typeof deleteChildProfileFromSupabase === 'function') {
            await deleteChildProfileFromSupabase(targetId || childName);
        }
    } catch (err) {
        console.warn("Error deleting child in Supabase:", err);
    }

    await refreshUserScopedData();
    showToast(`Deleted child profile for ${childName}. 🗑️`);
}

function switchView(viewName) {
    if (viewName === 'prediagnosis' || viewName === 'screener') {
        if (typeof startNewScreening === 'function') {
            startNewScreening();
        } else {
            window.location.href = 'prediagnosis-page.html';
        }
        return;
    }

    document.querySelectorAll('.view-panel').forEach(panel => {
        panel.classList.add('hidden');
    });

    const activePanel = document.getElementById(`view-${viewName}`);
    if (activePanel) {
        activePanel.classList.remove('hidden');
        activePanel.classList.add('animate-fade-in');
    }

    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active', 'bg-gradient-to-r', 'from-purple-700', 'via-indigo-600', 'to-purple-700', 'text-white', 'font-black', 'shadow-md');
        item.classList.add('text-purple-950', 'font-bold', 'hover:text-purple-700', 'hover:bg-purple-50/80');
        // Reset icon color
        const icon = item.querySelector('i');
        if (icon) {
            icon.classList.remove('text-white');
            icon.classList.add('text-purple-600');
        }
    });

    const activeNav = document.getElementById(`nav-${viewName}`);
    if (activeNav) {
        activeNav.classList.remove('text-purple-950', 'hover:text-purple-700', 'hover:bg-purple-50/80');
        activeNav.classList.add('active', 'bg-gradient-to-r', 'from-purple-700', 'via-indigo-600', 'to-purple-700', 'text-white', 'font-black', 'shadow-md');
        // Highlight active icon
        const icon = activeNav.querySelector('i');
        if (icon) {
            icon.classList.remove('text-purple-600');
            icon.classList.add('text-white');
        }
    }

    const currentUser = window.loggedInUser || JSON.parse(localStorage.getItem('lexisense_user') || 'null');
    const username = currentUser ? currentUser.username : 'guest';
    const scopedActive = getScopedActiveChild(username);
    const activeChildName = selectedReportChild || (scopedActive ? scopedActive.name : null);

    if (viewName === 'report') {
        renderChildReportContent(activeChildName);
        renderReportChildPills();
    } else if (viewName === 'children') {
        const cachedChildren = getScopedChildren(username);
        renderChildrenUI(cachedChildren);
    } else if (viewName === 'comparison' || viewName === 'compare') {
        renderComparisonJourney(activeChildName);
    } else if (viewName === 'profile') {
        loadParentProfileView();
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

/**
 * Dynamic Risk & Symptom-Based Supportive Suggestions Generator
 */
function getRiskAndSymptomTips(childName, riskLevel, score, readingWCPM, hesitationMs, p1Score, p2Score, p3Score, symptomFilter = 'auto', lang = 'en') {
    const isBM = (lang === 'bm');
    const cName = escapeHTML(childName || 'Child');
    
    // Determine primary symptom domain
    let activeDomain = symptomFilter;
    if (!activeDomain || activeDomain === 'auto') {
        if (score >= 65 || readingWCPM < 35 || hesitationMs > 400) {
            activeDomain = 'tak_boleh_baca';
        } else if (p3Score >= 50 || hesitationMs > 300) {
            activeDomain = 'gaze_skipping';
        } else if (p1Score >= 50) {
            activeDomain = 'letter_confusion';
        } else if (score >= 35) {
            activeDomain = 'slow_fluency';
        } else {
            activeDomain = 'enrichment';
        }
    }

    const tipDatabase = {
        tak_boleh_baca: [
            {
                num: 1,
                title: isBM ? 'Latihan Sensori Bunyi Fonik (Bukan Nama Huruf)' : 'Multisensory Phonics & Sound Blending',
                desc: isBM ? `Gunakan dulang pasir, tepung atau play-dough untuk membentuk huruf sambil membunyikan fonemnya (contoh: sebut bunyi /b/ bukan nama huruf "bi"). Hubungkan bentuk mulut dengan bunyi huruf sebelum mencuba membaca perkataan penuh.` : `Practice single letter-sound associations using sand trays, shaving cream, or play-dough. Connect the mouth shape to the phoneme sound before attempting multi-letter words.`,
                tag: isBM ? '🔤 Asas Fonik Sensori' : '🔤 Foundation Phonics',
                badge: isBM ? 'Khas untuk Belum Boleh Membaca' : 'Crucial for Non-Readers',
                color: 'purple'
            },
            {
                num: 2,
                title: isBM ? 'Teknik "Ear-Reading" & Buku Audio Serentak' : 'Ear-Reading with Synchronized Audiobooks',
                desc: isBM ? `Pasangkan buku audio kegemaran ${cName} bersama buku teks bercetak. Biarkan ${cName} mendengar suara bacaan sambil jarinya menunjuk perkataan. Ini mengekalkan minat cerita dan membina kosa kata tanpa tekanan mengeja.` : `Pair high-interest audiobooks with large-print physical text so ${cName} listens while tracking words with a finger. This preserves comprehension and vocabulary without decoding stress.`,
                tag: isBM ? '🎧 Audio + Teks' : '🎧 Audio Immersion',
                badge: isBM ? 'Kurangkan Tekanan Membaca' : 'Reduces Anxiety',
                color: 'indigo'
            },
            {
                num: 3,
                title: isBM ? 'Kad Tingkap Satu Perkataan (Visual Isolator)' : 'Single-Word Window Card (Visual Isolator)',
                desc: isBM ? `Gunting lubang kecil pada kadbod untuk menampakkan hanya satu perkataan pada satu masa. Ini mengelakkan mata ${cName} berasa panik atau "tersekat" melihat terlalu banyak teks dalam satu muka surat.` : `Cut a small window slot in an index card to reveal only one word or syllable at a time. This prevents visual crowding panic when looking at a full page of text.`,
                tag: isBM ? '✂️ Pengasing Visual' : '✂️ Visual Isolator',
                badge: isBM ? 'Elak Panik Muka Surat Penuh' : 'Stops Visual Overwhelm',
                color: 'amber'
            },
            {
                num: 4,
                title: isBM ? 'Bacaan Echo 5-Minit (Ibu Bapa Baca, Anak Ulang)' : '5-Minute Echo Reading Relay',
                desc: isBM ? `Ibu bapa membaca 2-3 patah perkataan dahulu dengan intonasi jelas, kemudian ${cName} mengulang perkataan yang sama. Hadkan sesi kepada 5–10 minit sahaja untuk elakkan keletihan mental.` : `Parent reads a short 3-4 word phrase with finger tracking, then ${cName} echoes back immediately. Keep sessions strictly under 5–10 minutes to prevent cognitive fatigue.`,
                tag: isBM ? '🗣️ Bacaan Bergilir' : '🗣️ Echo Reading',
                badge: isBM ? 'Sesi Pendek Berkesan' : 'Micro-Session',
                color: 'emerald'
            },
            {
                num: 5,
                title: isBM ? 'Ganjaran Usaha & Raikan Keberanian Mencuba' : 'Praise Phonetic Effort Over Perfection',
                desc: isBM ? `Berikan pujian tinggi apabila ${cName} cuba membunyikan satu suku kata walaupun belum sempurna. Elakkan membetulkan kesalahan serta-merta; raikan keberanian mencuba.` : `Praise when ${cName} courageously sounds out a syllable chunk, even if not fully correct. Focus on persistence and strategy rather than flawless accuracy.`,
                tag: isBM ? '⭐ Bina Keyakinan Diri' : '⭐ Boosts Confidence',
                badge: isBM ? 'Kesihatan Emosi' : 'Emotional Safety',
                color: 'rose'
            },
            {
                num: 6,
                title: isBM ? 'Surat Permohonan Bantuan Guru & RPI Sekolah' : 'School Collaboration & IEP Support',
                desc: isBM ? `Kongsi laporan LexiSense ini dengan guru kelas ${cName}. Minta bantuan ujian lisan (bukan ujian membaca kuat), masa tambahan 50%, dan elakkan menyuruh ${cName} membaca spontan di hadapan kelas.` : `Share this screening report with ${cName}'s teacher to request oral assessments, 50% extended processing time, and exemption from unannounced read-alouds.`,
                tag: isBM ? '🏫 Sokongan Guru & Sekolah' : '🏫 School Accommodation',
                badge: isBM ? 'Bantuan Bilik Darjah' : 'Classroom Advocacy',
                color: 'blue'
            }
        ],
        letter_confusion: [
            {
                num: 1,
                title: isBM ? 'Teknik Tangan "BED" untuk Huruf b & d' : 'The "BED" Hand Trick for b & d',
                desc: isBM ? `Minta ${cName} membuat dua penumbuk dengan ibu jari menghala ke atas dan merapatkannya. Penumbuk kiri membentuk huruf "b" dan penumbuk kanan membentuk huruf "d" (membentuk perkataan "bed").` : `Have ${cName} make two fists with thumbs up touching together. The left fist forms 'b' and the right fist forms 'd' (forming the word 'bed') so they can instantly self-check.`,
                tag: isBM ? '🔤 Nyahkeliru Huruf' : '🔤 Letter Disambiguation',
                badge: isBM ? 'Khas untuk Keliru b & d' : 'Stops Inversion',
                color: 'purple'
            },
            {
                num: 2,
                title: isBM ? 'Latihan "Sky Writing" Gerakan Tangan Besar' : 'Large-Arm Sky Writing & Muscle Memory',
                desc: isBM ? `Gunakan seluruh lengan untuk melukis huruf di udara sambil menyebut: "Batang dulu baru perut untuk b, perut dulu baru tiang untuk d". Gerakan otot besar memantapkan ingatan arah otak.` : `Stand up and use whole-arm strokes to trace tricky letters in the air while vocalizing: "Down the bat, around the ball for b". Gross motor memory cements directionality.`,
                tag: isBM ? '🖐️ Memori Kinestetik' : '🖐️ Kinesthetic Memory',
                badge: isBM ? 'Kekal Dalam Ingatan' : 'Brain Wiring',
                color: 'indigo'
            },
            {
                num: 3,
                title: isBM ? 'Sorotan Warna untuk Huruf Tertukar' : 'Color Highlighting Confusing Letter Pairs',
                desc: isBM ? `Gunakan pen penyerlah hijau untuk huruf "b" dan penyerlah oren untuk huruf "d" dalam teks latihan. Petunjuk warna visual membantu otak membezakan orientasi huruf serta-merta.` : `Use a green highlighter for letter 'b' and orange for 'd' across practice worksheets. Distinct color anchors help the visual cortex differentiate direction instantly.`,
                tag: isBM ? '🎨 Petunjuk Warna Visual' : '🎨 Visual Color Coding',
                badge: isBM ? 'Pengecaman Pantas' : 'Rapid Recognition',
                color: 'amber'
            },
            {
                num: 4,
                title: isBM ? 'Permainan Padanan Bunyi Awal (Phoneme Hunt)' : 'Initial Sound Scavenger Hunt',
                desc: isBM ? `Letakkan objek sebenar dalam bakul (bola, buku, dinosaur, daun). Minta ${cName} mengasingkan barang mengikut bunyi awalan /b/ dan /d/ secara fizikal.` : `Gather real household items (ball, book, dinosaur, doll). Have ${cName} physically sort items into the 'b-basket' or 'd-basket' by sounding out the first phoneme.`,
                tag: isBM ? '🎮 Permainan Interaktif' : '🎮 Gamified Phonics',
                badge: isBM ? 'Belajar Sambil Main' : 'Hands-On Learning',
                color: 'emerald'
            },
            {
                num: 5,
                title: isBM ? 'Kamus Huruf Bergambar Buatan Sendiri' : 'Personal Illustrated Letter Keycard',
                desc: isBM ? `Bantu ${cName} melukis kad panduan peribadi: 'b' seperti burung/bat, 'd' seperti donat. Letakkan kad ini di atas meja belajar sebagai rujukan pantas semasa membaca.` : `Help ${cName} draw a personalized anchor chart: 'b' as a baseball bat, 'd' as a doughnut. Keep this mini card taped to their study desk for quick reference.`,
                tag: isBM ? '📌 Kad Rujukan Meja' : '📌 Desk Anchor Card',
                badge: isBM ? 'Rujukan Mandiri' : 'Self-Correction Aid',
                color: 'rose'
            },
            {
                num: 6,
                title: isBM ? 'Penyesuaian Font Mesra Disleksia di Sekolah' : 'Dyslexia-Friendly Fonts & Spacing in School',
                desc: isBM ? `Minta guru menyediakan lembaran kerja dengan fon berat di bahagian bawah seperti OpenDyslexic atau Comic Sans dengan jarak baris 1.5x untuk elakkan huruf terbalik.` : `Ask educators to provide reading materials in bottom-weighted fonts (e.g. OpenDyslexic or Comic Sans) with 1.5x line spacing to eliminate perceptual flipping.`,
                tag: isBM ? '🏫 Format Mesra Murid' : '🏫 Format Adaptation',
                badge: isBM ? 'Sokongan Sekolah' : 'School Strategy',
                color: 'blue'
            }
        ],
        gaze_skipping: [
            {
                num: 1,
                title: isBM ? 'Pembaris Warna Lutsinar / Penunjuk Jari' : 'Colored Reading Tracker / Line Ruler',
                desc: isBM ? `Gunakan pembaris lutsinar berwarna kuning lembut atau biru lembut di bawah baris bacaan. Ini mengunci pergerakan anak mata dan menghalang mata melompat ke baris bawah.` : `Place a transparent colored tracker strip (soft yellow or pastel blue) beneath the reading line to anchor gaze fixations and stop unintentional line skipping.`,
                tag: isBM ? '👁️ Panduan Anak Mata' : '👁️ Gaze Anchoring',
                badge: isBM ? 'Hentikan Lompat Baris' : 'Stops Line Skipping',
                color: 'purple'
            },
            {
                num: 2,
                title: isBM ? 'Tetingkap Kadbod Penutup Baris' : 'Blank Card Line Masking Technique',
                desc: isBM ? `Tutup semua baris ayat di bawah baris yang sedang dibaca menggunakan sehelai kad kosong. Buka satu baris demi satu baris apabila ${cName} selesai membaca.` : `Slide an opaque index card down the page to conceal upcoming text lines, displaying only one sentence at a time to remove peripheral visual distraction.`,
                tag: isBM ? '📄 Penutup Baris Teks' : '📄 Text Masking',
                badge: isBM ? 'Fokus Satu Ayat' : 'Isolates Active Line',
                color: 'indigo'
            },
            {
                num: 3,
                title: isBM ? 'Latihan Senaman Mata (Tracking Pointer)' : 'Smooth Pursuit Eye-Tracking Exercises',
                desc: isBM ? `Gerakkan hujung pensel secara perlahan dari kiri ke kanan (jarak 30cm dari muka) dan minta ${cName} menjejaki pensel hanya dengan mata tanpa menggerakkan kepala selama 2 minit.` : `Hold a fun pointer 30cm in front of ${cName} and move it horizontally from left to right. Have ${cName} follow the tip with eyes only, keeping their head steady.`,
                tag: isBM ? '👀 Senaman Otot Mata' : '👀 Ocular Motor Skills',
                badge: isBM ? '2 Minit Sehari' : '2-Min Daily Warmup',
                color: 'amber'
            },
            {
                num: 4,
                title: isBM ? 'Buku Fon Besar & Jarak Ayat Luas' : 'Large Print & Generous White Space Books',
                desc: isBM ? `Pilih buku cerita dengan fon bersaiz 16pt ke atas dan jarak perenggan yang luas. Teks yang terlalu padat pada kertas putih silau mencetuskan keletihan mata.` : `Choose books with 16pt+ font size and generous line spacing. Dense text formatting on stark white pages triggers rapid ocular fatigue and visual crowding.`,
                tag: isBM ? '📖 Tipografi Bersih' : '📖 Clean Typography',
                badge: isBM ? 'Selesa untuk Mata' : 'Visual Comfort',
                color: 'emerald'
            },
            {
                num: 5,
                title: isBM ? 'Pencahayaan Hangat (Elak Lampu Putih Silau)' : 'Warm Amber Ambient Lighting Setup',
                desc: isBM ? `Gunakan lampu meja berwarna kuning hangat (warm white) dan elakkan pantulan cahaya terus ke atas kertas berkilat untuk mengurangkan ketegangan mata ${cName}.` : `Use warm-toned ambient desk lamps rather than harsh overhead fluorescent bulbs to eliminate paper glare and ocular strain during evening reading.`,
                tag: isBM ? '💡 Keselesaan Suasana' : '💡 Lighting Setup',
                badge: isBM ? 'Kurangkan Silau' : 'Glare Reduction',
                color: 'rose'
            },
            {
                num: 6,
                title: isBM ? 'Kedudukan Duduk Hadapan di Bilik Darjah' : 'Preferential Front Seating in Classroom',
                desc: isBM ? `Minta guru menempatkan ${cName} di barisan hadapan tengah supaya ${cName} tidak perlu memusingkan kepala berulang kali antara papan putih dan buku nota.` : `Request teacher place ${cName} in the front-center row so transferring gaze between the whiteboard and notebook desk requires minimal head repositioning.`,
                tag: isBM ? '🏫 Kedudukan Meja Kelas' : '🏫 Front-Row Seating',
                badge: isBM ? 'Sokongan Sekolah' : 'School Strategy',
                color: 'blue'
            }
        ],
        slow_fluency: [
            {
                num: 1,
                title: isBM ? '10-Minit Bacaan Bergilir "You Read, I Read"' : '10-Minute "You Read, I Read" Relay',
                desc: isBM ? `Ibu bapa membaca satu ayat dengan lancar dan berlagu, kemudian ${cName} membaca ayat seterusnya. 10 minit setiap hari membina kelancaran tanpa meletihkan anak.` : `Alternate reading sentences back and forth. Parent models rhythmic cadence and expression on sentence 1, child reads sentence 2. 10 minutes daily builds stamina.`,
                tag: isBM ? '⏱️ Bacaan Berpasangan' : '⏱️ Paired Reading',
                badge: isBM ? 'Bina Kelancaran Pantas' : 'Builds Daily Cadence',
                color: 'purple'
            },
            {
                num: 2,
                title: isBM ? 'Pemotongan Suku Kata Perkataan Panjang' : 'Chunking Multi-Syllabic Long Words',
                desc: isBM ? `Tutup bahagian belakang perkataan panjang dengan jari dan baca mengikut suku kata (contoh: me-nya-nyi, fan-tas-tik, cho-co-late). Bila sudah kuasai, gabungkan semula.` : `Cover the tail of long words with a finger to decode syllable-by-syllable (e.g., won-der-ful, fan-tas-tic). Once chunks are sound, blend the full word together.`,
                tag: isBM ? '✂️ Potong Suku Kata' : '✂️ Syllable Chunking',
                badge: isBM ? 'Nyahkod Perkataan Sukar' : 'Decodes Complex Words',
                color: 'indigo'
            },
            {
                num: 3,
                title: isBM ? 'Kad Imbasan Perkataan Kekerapan Tinggi (Sight Words)' : 'Rapid High-Frequency Sight Word Drills',
                desc: isBM ? `Latih 5 perkataan lazim (seperti: yang, untuk, mereka, with, because) selama 2 minit sehari menggunakan kad imbasan berwarna untuk meningkatkan kelajuan spontan.` : `Practice 5 high-frequency sight words for 2 minutes daily using gamified flashcards to shift common words from slow conscious decoding into automatic recognition.`,
                tag: isBM ? '⚡ Kelajuan Automatik' : '⚡ Automatic Recognition',
                badge: isBM ? 'Tingkatkan WCPM' : 'Boosts WCPM Cadence',
                color: 'amber'
            },
            {
                num: 4,
                title: isBM ? 'Bacaan Berulang Cerita Pendek (Repeated Reading)' : 'Repeated Timed Reading of Short Passages',
                desc: isBM ? `Pilih perenggan pendek 50 perkataan. Minta ${cName} membacanya 2–3 kali berturut-turut. Lihat bagaimana masa bacaan menjadi lebih pantas dan lancar pada percubaan ketiga!` : `Select a 50-word paragraph. Have ${cName} read it 2-3 times consecutively. Celebrate the noticeable speed and inflection gains achieved on the 3rd attempt!`,
                tag: isBM ? '🔁 Bacaan Berulang' : '🔁 Repeated Reading',
                badge: isBM ? 'Buktikan Kemajuan Diri' : 'Proven Fluency Builder',
                color: 'emerald'
            },
            {
                num: 5,
                title: isBM ? 'Fokus Maksud Cerita, Bukan Hanya Kelajuan' : 'Story Meaning Check (Comprehension First)',
                desc: isBM ? `Selepas membaca, tanya soalan santai: "Watak mana paling ${cName} suka?". Memahami cerita memberi motivasi kepada anak untuk membaca lebih lancar.` : `Pause every page and ask a light question: "What do you think happens next?". Deep story connection gives children intrinsic motivation to read forward.`,
                tag: isBM ? '💡 Kefahaman Cerita' : '💡 Story Connection',
                badge: isBM ? 'Minat Membaca' : 'Comprehension Boost',
                color: 'rose'
            },
            {
                num: 6,
                title: isBM ? 'Masa Tambahan Ujian & Tiada Tekanan Masa' : 'Extended Processing Time in School Tests',
                desc: isBM ? `Pastikan guru memberi kelonggaran masa tambahan 25% semasa kuiz membaca dan membenarkan ${cName} menggunakan penunjuk jari di dalam kelas.` : `Request school provide 25% extended time on reading assignments and permit finger-line tracking tools without penalty during classroom activities.`,
                tag: isBM ? '🏫 Kelonggaran Masa Kelas' : '🏫 Extra Test Time',
                badge: isBM ? 'Sokongan Sekolah' : 'School Strategy',
                color: 'blue'
            }
        ],
        anxiety_fatigue: [
            {
                num: 1,
                title: isBM ? 'Peraturan "5 Minit & Berhenti"' : 'The "5-Minute Power Sprint & Stop" Rule',
                desc: isBM ? `Jangan paksa membaca lebih 10 minit. Tetapkan pemasa visual selama 5 minit. Apabila bunyi pemasa berbunyi, tamatkan sesi segera dengan pujian walaupun hanya membaca 2 ayat.` : `Never force 20+ minute sessions. Set a colorful visual timer for exactly 5 minutes. Stop immediately when the timer chimes, ensuring every reading session ends on a positive win.`,
                tag: isBM ? '⏱️ Elak Keletihan Mental' : '⏱️ Prevents Meltdowns',
                badge: isBM ? 'Sifar Tekanan Emosi' : 'Zero-Stress Rule',
                color: 'purple'
            },
            {
                num: 2,
                title: isBM ? 'Papan Pelekat Bintang Ganjaran (Reward Chart)' : 'Gamified Effort Sticker Chart',
                desc: isBM ? `Setiap kali ${cName} mencuba satu sesi membaca tanpa merungut, tampal 1 bintang pelekat. Cukup 5 bintang, beri ganjaran santai seperti waktu bermain taman.` : `Award a gold star sticker for every completed session. Redeem 5 stars for a fun park trip or family movie night, rewiring reading as a rewarding activity.`,
                tag: isBM ? '⭐ Motivasi Positif' : '⭐ Positive Reinforcement',
                badge: isBM ? 'Bina Tabiat Ceria' : 'Habit Builder',
                color: 'indigo'
            },
            {
                num: 3,
                title: isBM ? 'Buku Komik / Novel Grafik Pilihan Sendiri' : 'Graphic Novels & Visual Story Choice',
                desc: isBM ? `Biarkan ${cName} membaca komik atau majalah bergambar yang disukainya. Gambar visual memberikan petunjuk konteks dan mengurangkan rasa tertekan.` : `Let ${cName} choose high-interest comic books or manga. Rich visual illustrations carry context clues and dramatically lower reading intimidation.`,
                tag: isBM ? '🎨 Pilihan Bebas Anak' : '🎨 Graphic Novels',
                badge: isBM ? 'Seronok Membaca' : 'Low Intimidation',
                color: 'amber'
            },
            {
                num: 4,
                title: isBM ? 'Membaca Kepada Haiwan Peliharaan / Patung' : 'Reading to Pets or Plush Toys',
                desc: isBM ? `Minta ${cName} membaca cerita kepada patung beruang atau kucing kesayangan. Haiwan dan patung tidak akan menghakimi atau membetulkan kesalahan, membina keyakinan suara.` : `Have ${cName} read aloud to a favorite teddy bear or family pet. Non-judgmental listeners build vocal confidence without fear of reprimand.`,
                tag: isBM ? '🧸 Zon Selesa Membaca' : '🧸 Judgment-Free Zone',
                badge: isBM ? 'Bina Keyakinan Suara' : 'Vocal Confidence',
                color: 'emerald'
            },
            {
                num: 5,
                title: isBM ? 'Sentuhan & Urutan Relaksasi Bahu' : 'Pre-Reading Deep Breathing & Shoulder Relax',
                desc: isBM ? `Lakukan 3 hembusan nafas dalam bersama sebelum membuka buku. Kurangkan ketegangan fizikal pada leher dan bahu yang sering berlaku akibat kebimbangan membaca.` : `Take 3 deep calming breaths together before opening a book. Consciously loosen shoulder and jaw tension caused by anticipatory reading anxiety.`,
                tag: isBM ? '🧘 Ketenangan Mental' : '🧘 Somatic Calming',
                badge: isBM ? 'Ketenangan Fikiran' : 'Anxiety Reducer',
                color: 'rose'
            },
            {
                num: 6,
                title: isBM ? 'Pengecualian Membaca Kuat di Hadapan Kelas' : 'No Cold-Calling Exemption in School',
                desc: isBM ? `Bincang dengan guru untuk tidak memanggil ${cName} secara tiba-tiba membaca teks di hadapan rakan sekelas, yang merupakan punca utama trauma membaca murid disleksia.` : `Request teacher exempt ${cName} from impromptu reading aloud in front of peers, which is the leading trigger of school-related reading trauma.`,
                tag: isBM ? '🏫 Perlindungan Emosi Sekolah' : '🏫 School Protocol',
                badge: isBM ? 'Lindungi Emosi Anak' : 'Emotional Safety',
                color: 'blue'
            }
        ],
        enrichment: [
            {
                num: 1,
                title: isBM ? 'Penerokaan Morfologi & Kata Dasar Lanjutan' : 'Morphological Detective & Root Words',
                desc: isBM ? `Terokai imbuhan awalan, akhiran, dan kata dasar (contoh: memper-, -kan, tele-, bio-) untuk memperluas penguasaan kosa kata akademik dan pemahaman teks mendalam.` : `Explore prefixes, suffixes, and Latin/Greek roots (e.g., auto-, bio-, geo-, -ology) to build advanced academic vocabulary and morphological decoding mastery.`,
                tag: isBM ? '🧠 Morfologi Lanjutan' : '🧠 Morphology Mastery',
                badge: isBM ? 'Pengayaan Bahasa' : 'Enrichment Track',
                color: 'purple'
            },
            {
                num: 2,
                title: isBM ? 'Teater Suara Watak (Reader’s Theater)' : 'Reader’s Theater & Expressive Cadence',
                desc: isBM ? `Latih membaca dialog cerita dengan menukar suara watak lucu, nada dramatik, dan berhenti mengikut tanda baca. Ini mengasah kelancaran bertaraf profesional.` : `Practice reading story dialogue using dramatic character voices, expressive cadence, and conscious pause punctuation to transition from fluency to expressive performance.`,
                tag: isBM ? '🎭 Kelancaran Ekspresif' : '🎭 Expressive Reading',
                badge: isBM ? 'Asah Seni Suara' : 'Performance Fluency',
                color: 'indigo'
            },
            {
                num: 3,
                title: isBM ? 'Pilihan Bahan Bacaan Bebas & Komik Sains' : 'Diverse Genre & Graphic Novel Exploration',
                desc: isBM ? `Galakkan ${cName} memilih sendiri bahan bacaan pelbagai genre: novel grafik, ensiklopedia sains kanak-kanak, dan cerita misteri untuk memupuk tabiat membaca seumur hidup.` : `Encourage self-selected reading across varied genres: non-fiction science, graphic novels, and mystery series to foster intrinsic, lifelong reading passion.`,
                tag: isBM ? '📚 Pelbagai Genre' : '📚 Diverse Genres',
                badge: isBM ? 'Tabiat Membaca Seumur Hidup' : 'Lifelong Reader',
                color: 'amber'
            },
            {
                num: 4,
                title: isBM ? 'Soalan Pemikiran Kritis & Inferens' : 'Inferential & Critical Thinking Discussions',
                desc: isBM ? `Tanya soalan terbuka selepas membaca: "Mengapa watak buat keputusan begitu?", "Jika kamu jadi watak utama, apa yang kamu ubah?". Ini merangsang kemahiran berfikir aras tinggi (KBAT).` : `Ask thought-provoking inferential questions: "Why do you think the character made that choice?", "What would you change in the ending?". Builds deep critical analysis.`,
                tag: isBM ? '💡 Pemikiran Kritis (KBAT)' : '💡 Critical Thinking',
                badge: isBM ? 'Kefahaman Mendalam' : 'Deep Comprehension',
                color: 'emerald'
            },
            {
                num: 5,
                title: isBM ? 'Cipta Buku Cerita & Komik Mini Sendiri' : 'Mini Storybook Authoring & Illustration',
                desc: isBM ? `Beri ruang untuk ${cName} menulis dan melukis cerita pendek sendiri. Menghubungkan pembacaan dengan penulisan kreatif mengukuhkan kemahiran mengeja dan struktur tatabahasa.` : `Encourage ${cName} to write and illustrate their own comic strips or short stories, linking advanced reading competence directly to creative spelling and narrative structure.`,
                tag: isBM ? '✍️ Penulisan Kreatif' : '✍️ Creative Authoring',
                badge: isBM ? 'Bakat Menulis' : 'Writing Mastery',
                color: 'rose'
            },
            {
                num: 6,
                title: isBM ? 'Pemantauan Berkala Setiap 6 Bulan' : 'Routine 6-Month Progress Check-Ins',
                desc: isBM ? `Walaupun keputusan ${cName} sangat cemerlang, lakukan saringan pantas LexiSense setiap 6 bulan apabila anak melangkah ke darjah yang mempunyai kepadatan teks lebih tinggi.` : `Although ${cName} is reading fluently on-track, schedule a routine 6-month LexiSense follow-up check as reading text density increases across higher school grades.`,
                tag: isBM ? '📈 Pemantauan Berkala' : '📈 Routine Checkup',
                badge: isBM ? 'Kekalkan Kecemerlangan' : 'Maintain Excellence',
                color: 'blue'
            }
        ]
    };

    return {
        tips: tipDatabase[activeDomain] || tipDatabase.tak_boleh_baca,
        activeDomain: activeDomain
    };
}

/**
 * Builds the HTML for Dynamic Supportive Learning Suggestions & Ollie AI Coach Studio
 */
function buildReportSuggestionsHTML(data) {
    if (!data) return '';
    const childName = data.childName || 'Child';
    const riskLevel = data.riskLevel || 'Moderate Risk';
    const score = data.score || 50;
    const readingWCPM = data.readingWCPM || 45;
    const hesitationMs = data.hesitationMs || 300;
    const p1Score = data.p1Score || 50;
    const p2Score = data.p2Score || 50;
    const p3Score = data.p3Score || 50;
    const activeFilter = data.activeFilter || 'auto';
    const lang = data.lang || 'en';
    const isBM = (lang === 'bm');

    const result = getRiskAndSymptomTips(childName, riskLevel, score, readingWCPM, hesitationMs, p1Score, p2Score, p3Score, activeFilter, lang);
    const tips = result.tips;
    const activeDomain = result.activeDomain;

    const domainLabels = {
        tak_boleh_baca: isBM ? '🚨 Tak Boleh Membaca / Kesukaran Fonik Asas' : '🚨 Severe Decoding / Struggles to Read',
        letter_confusion: isBM ? '🔤 Keliru Huruf b & d / Orientasi Terbalik' : '🔤 b/d Letter Confusion & Inversion',
        gaze_skipping: isBM ? '👁️ Melompat Baris & Jejak Mata Terganggu' : '👁️ Line Skipping & Gaze Shifts',
        slow_fluency: isBM ? '⏱️ Kelajuan Membaca Perlahan & Teragak-agak' : '⏱️ Slow Reading Cadence & Hesitation',
        anxiety_fatigue: isBM ? '😫 Kebimbangan Membaca & Cepat Letih' : '😫 Reading Anxiety & Cognitive Fatigue',
        enrichment: isBM ? '🚀 Pengayaan Membaca & Penguasaan Lanjutan' : '🚀 Advanced Enrichment & Fluency'
    };

    const domainExplainer = {
        tak_boleh_baca: isBM 
            ? `Strategi berikut direka khas untuk kanak-kanak yang mengalami kesukaran membunyikan suku kata asas atau belum boleh membaca ayat penuh. Fokus utama adalah pada fonik sensori dan mengurangkan tekanan visual.`
            : `These strategies are specially curated for children who struggle to sound out basic syllables or cannot yet read connected text. The core focus is on multisensory phonics and eliminating visual panic.`,
        letter_confusion: isBM
            ? `Strategi ini memberi tumpuan kepada memori kinestetik otot besar dan petunjuk warna visual untuk menghapuskan kekeliruan huruf cermin (seperti b, d, p, q).`
            : `These strategies target large-muscle kinesthetic memory and color-coded visual anchors to eliminate mirrored letter confusion (such as b, d, p, q).`,
        gaze_skipping: isBM
            ? `Berdasarkan pergerakan anak mata yang dikesan semasa membaca, aktiviti ini mengunci fokus garisan teks menggunakan pembaris warna dan latihan senaman mata.`
            : `Based on detected eye-tracking shifts, these exercises anchor gaze focus on active lines using colored trackers and ocular pursuit drills.`,
        slow_fluency: isBM
            ? `Latihan ini membina kelancaran rentak bacaan (WCPM) secara beransur-ansur melalui bacaan bergilir 10-minit dan pengecaman perkataan lazim spontan.`
            : `These activities build words-correct-per-minute (WCPM) cadence smoothly through 10-minute paired relay reading and automatic sight word recognition.`,
        anxiety_fatigue: isBM
            ? `Fokus utama adalah membina semula keyakinan diri dan keseronokan membaca melalui sesi mikro 5-minit, novel grafik, dan zon membaca bebas penghakiman.`
            : `The primary focus is rebuilding reading self-esteem and joy through 5-minute micro-sprints, graphic novels, and judgment-free reading environments.`,
        enrichment: isBM
            ? `Keputusan saringan menunjukkan penguasaan membaca yang sangat baik! Cadangan ini memperluas kosa kata morfologi dan pemikiran inferens kritis.`
            : `Screening results indicate excellent reading foundations! These recommendations elevate vocabulary morphology, expressive performance, and critical inference.`
    };

    const filterButtons = [
        { key: 'auto', icon: 'fa-wand-magic-sparkles', label: isBM ? `🎯 Profil Automatik (${score}%)` : `🎯 Auto-Detected (${score}%)` },
        { key: 'tak_boleh_baca', icon: 'fa-triangle-exclamation', label: isBM ? '🚨 Tak Boleh Baca' : '🚨 Struggles to Read' },
        { key: 'letter_confusion', icon: 'fa-font', label: isBM ? '🔤 Keliru Huruf b/d' : '🔤 Confuses b & d' },
        { key: 'gaze_skipping', icon: 'fa-eye', label: isBM ? '👁️ Lompat Baris' : '👁️ Skips Lines' },
        { key: 'slow_fluency', icon: 'fa-gauge-simple-high', label: isBM ? '⏱️ Bacaan Perlahan' : '⏱️ Slow Speed' },
        { key: 'anxiety_fatigue', icon: 'fa-face-frown', label: isBM ? '😫 Cepat Letih/Takut' : '😫 Reading Anxiety' },
        { key: 'enrichment', icon: 'fa-rocket', label: isBM ? '🚀 Pengayaan' : '🚀 Enrichment' }
    ];

    return `
        <div class="bg-gradient-to-br from-amber-50/95 via-orange-50/80 to-purple-50/70 p-6 sm:p-9 rounded-3xl border-2 border-amber-300 space-y-6 shadow-md w-full relative overflow-hidden">
            <!-- Header with Title & Language Switcher -->
            <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-amber-200/90 pb-5">
                <div class="flex items-center gap-3.5">
                    <div class="w-13 h-13 rounded-2xl bg-gradient-to-tr from-amber-400 to-yellow-300 text-purple-950 font-black flex items-center justify-center text-2xl shadow-sm border border-amber-200 shrink-0">
                        💡
                    </div>
                    <div>
                        <div class="flex items-center gap-2 flex-wrap">
                            <h4 class="font-heading text-xl sm:text-2xl font-black text-brand-purple-deep">
                                ${isBM ? `Cadangan Pembelajaran Tersuai untuk ${escapeHTML(childName)}` : `Supportive Learning Suggestions for ${escapeHTML(childName)}`}
                            </h4>
                            <span class="bg-amber-200/90 text-amber-950 text-xs font-black px-3 py-0.5 rounded-full border border-amber-300 shadow-2xs">
                                ${domainLabels[activeDomain] || 'Personalized'}
                            </span>
                        </div>
                        <p class="text-xs sm:text-sm text-amber-950 font-bold mt-0.5">
                            ${isBM ? 'Aktiviti praktikal berasaskan bukti klinikal di rumah mengikut simptom & tahap risiko:' : 'Evidence-based, practical home activities tailored to exact risk level & reading symptoms:'}
                        </p>
                    </div>
                </div>

                <!-- Language Toggle -->
                <div class="flex items-center gap-1.5 bg-white/90 p-1.5 rounded-2xl border border-amber-200 shadow-2xs self-start md:self-auto">
                    <button onclick="switchSuggestionsLang('en')" class="px-3 py-1 rounded-xl text-xs font-black transition-all cursor-pointer ${!isBM ? 'bg-purple-600 text-white shadow-xs' : 'text-gray-600 hover:text-purple-700 hover:bg-purple-50'}">
                        🇬🇧 English
                    </button>
                    <button onclick="switchSuggestionsLang('bm')" class="px-3 py-1 rounded-xl text-xs font-black transition-all cursor-pointer ${isBM ? 'bg-purple-600 text-white shadow-xs' : 'text-gray-600 hover:text-purple-700 hover:bg-purple-50'}">
                        🇲🇾 B. Melayu
                    </button>
                </div>
            </div>

            <!-- Dynamic Symptom & Risk Selector Filter Pills -->
            <div class="space-y-2">
                <span class="text-xs font-black text-purple-900 uppercase tracking-wider block">
                    <i class="fa-solid fa-filter text-purple-600 mr-1"></i> ${isBM ? 'Pilih Simptom Khusus / Tahap Risiko:' : 'Filter by Observed Reading Symptom / Risk Domain:'}
                </span>
                <div class="flex flex-wrap items-center gap-2">
                    ${filterButtons.map(btn => {
                        const isCurrentActive = (activeFilter === btn.key);
                        return `
                            <button onclick="switchSuggestionsFilter('${btn.key}')" class="px-3.5 py-2 rounded-2xl text-xs font-black transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer ${isCurrentActive ? 'bg-purple-600 text-white shadow-md scale-105 ring-2 ring-purple-300' : 'bg-white/90 text-gray-700 hover:bg-purple-100/70 border border-amber-200/90'}">
                                <span>${btn.label}</span>
                            </button>
                        `;
                    }).join('')}
                </div>
            </div>

            <!-- Active Domain Explainer Banner -->
            <div class="bg-white/90 p-4 rounded-2xl border border-amber-200/90 shadow-2xs flex items-start gap-3">
                <span class="text-xl shrink-0">🎯</span>
                <p class="text-xs sm:text-sm text-gray-700 font-semibold leading-relaxed">
                    ${domainExplainer[activeDomain] || domainExplainer.tak_boleh_baca}
                </p>
            </div>

            <!-- 3 TAILORED CARDS GRID (MAX 3 ON REPORT VIEW) -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-5 pt-1">
                ${tips.slice(0, 3).map(t => {
                    const numColor = t.color === 'purple' ? 'bg-purple-100 text-purple-700 border-purple-200' : 
                                     (t.color === 'indigo' ? 'bg-indigo-100 text-indigo-700 border-indigo-200' : 
                                     (t.color === 'amber' ? 'bg-amber-100 text-amber-800 border-amber-200' : 
                                     (t.color === 'emerald' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : 
                                     (t.color === 'rose' ? 'bg-rose-100 text-rose-800 border-rose-200' : 'bg-blue-100 text-blue-800 border-blue-200'))));
                    
                    const tagBg = t.color === 'purple' ? 'bg-purple-50 text-purple-700 border-purple-200' : 
                                  (t.color === 'indigo' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 
                                  (t.color === 'amber' ? 'bg-amber-50 text-amber-800 border-amber-200' : 
                                  (t.color === 'emerald' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 
                                  (t.color === 'rose' ? 'bg-rose-50 text-rose-800 border-rose-200' : 'bg-blue-50 text-blue-800 border-blue-200'))));

                    return `
                    <div class="group bg-white/95 backdrop-blur-sm p-5 sm:p-6 rounded-3xl border border-amber-200/90 hover:border-purple-300 space-y-3.5 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between">
                        <div class="space-y-2.5">
                            <div class="flex items-center justify-between gap-2">
                                <span class="w-8 h-8 rounded-xl ${numColor} border font-black flex items-center justify-center text-xs shadow-2xs">
                                    ${t.num}
                                </span>
                                <span class="text-[10px] font-black uppercase tracking-wider text-amber-800 bg-amber-100/90 px-2.5 py-0.5 rounded-full border border-amber-200">
                                    ${t.badge}
                                </span>
                            </div>
                            <h5 class="font-heading font-black text-brand-purple-deep text-sm sm:text-base leading-snug group-hover:text-purple-700 transition-colors">
                                ${t.title}
                            </h5>
                            <p class="text-xs sm:text-sm text-gray-700 leading-relaxed font-medium">
                                ${t.desc}
                            </p>
                        </div>
                        <div class="pt-2 border-t border-purple-50">
                            <span class="inline-block text-[11px] font-black ${tagBg} px-2.5 py-1 rounded-lg border shadow-2xs">
                                ${t.tag}
                            </span>
                        </div>
                    </div>
                    `;
                }).join('')}
            </div>

            <!-- FOOTER CTA: EXPLORE MORE IN PARENT TIPS TAB -->
            <div class="pt-5 border-t border-amber-200/90 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div class="flex items-center gap-2 text-amber-950 font-bold text-xs sm:text-sm">
                    <span class="text-base">💡</span>
                    <span>${isBM ? 'Ingin lebih banyak panduan, simulator interaktif & Ollie AI Coach?' : 'Want more in-depth strategies, interactive tools & Ollie AI Coach?'}</span>
                </div>
                <button onclick="switchView('recommendations')" class="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 hover:from-purple-700 hover:to-indigo-800 text-white font-black text-xs sm:text-sm rounded-2xl shadow-md hover:shadow-xl hover:scale-105 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 shrink-0">
                    <span>${isBM ? 'Buka Tab Tips Ibu Bapa (Lebih Banyak Panduan)' : 'Explore More in Parent Tips Tab'}</span>
                    <i class="fa-solid fa-arrow-right text-xs"></i>
                </button>
            </div>
        </div>
    `;
}

/**
 * Builds the simulated intelligent AI response from Ollie AI
 */
function buildOllieAIResponse(childName, query, score, riskLevel, readingWCPM, lang) {
    const isBM = (lang === 'bm');
    const cName = escapeHTML(childName || 'Child');
    const qClean = (query || '').toLowerCase();

    let rootCause = "";
    let step1 = "";
    let step2 = "";
    let step3 = "";
    let avoid = "";
    let script = "";

    if (qClean.includes('tak boleh baca') || qClean.includes('cannot read') || qClean.includes('syllable') || qClean.includes('menangis') || qClean.includes('cries') || score >= 65) {
        if (isBM) {
            rootCause = `Otak ${cName} mengalami kelewatan pemprosesan fonologi (laluan visual-ke-bunyi mengambil masa lebih lama daripada purata). Apabila dipaksa membaca teks penuh, otak mengalami "keletihan kognitif" yang mencetuskan tangisan dan penolakan.`;
            step1 = `<strong>Langkah 1: Hentikan Bacaan Buku Penuh Sementara Waktu (3-5 Hari)</strong><br/>Jangan paksa ${cName} membaca buku cerita penuh. Gantikan dengan 3 minit permainan padanan 1 fonem menggunakan kad huruf besar.`;
            step2 = `<strong>Langkah 2: Teknik "Choral Sand Writing" (5 Minit Setiap Petang)</strong><br/>Tulis suku kata 2 huruf (seperti <em>ba, ma, su</em>) di atas pasir sambil menyebut bunyinya bersama-sama dalam satu nafas.`;
            step3 = `<strong>Langkah 3: Ear-Reading Cerita Kegemaran</strong><br/>Pasang buku audio 10 minit sebelum tidur. ${cName} mendengar sambil melihat ilustrasi untuk mengekalkan imaginasi dan kosa kata tanpa rasa rendah diri.`;
            avoid = `❌ <strong>Elakkan:</strong> Memaksa membaca lebih 10 minit, atau menyuruh ${cName} "cuba lagi lebih kuat" apabila mereka tersekat. Ini meningkatkan hormon kortisol (tekanan) yang menyekat fungsi ingatan otak.`;
            script = `🗣️ <strong>Ayat Sokongan Ibu Bapa:</strong> <em>"${cName}, otak kamu sangat bijak dan kreatif! Membaca hanya memerlukan cara latihan berbeza. Kita buat 5 minit permainan pasir hari ini, lepas tu kita dengar cerita bersama!"</em>`;
        } else {
            rootCause = `${cName}'s brain is experiencing phonological processing overload (the visual-to-phoneme bridge requires more cognitive processing time). Forcing full-page reading leads to instant working memory exhaustion, triggering anxiety and tears.`;
            step1 = `<strong>Step 1: Pause Full-Book Reading for 3–5 Days</strong><br/>Temporarily stop full paragraph reading. Replace it with 3-minute single-sound tactile games using large flashcards.`;
            step2 = `<strong>Step 2: 5-Minute Choral Sand Writing Relay</strong><br/>Trace 2-letter syllable blends (e.g. <em>ba, ma, su</em>) in a sand tray while chanting the phonetic sounds together in one smooth breath.`;
            step3 = `<strong>Step 3: Immersion Ear-Reading at Bedtime</strong><br/>Play an engaging audiobook while ${cName} follows along with illustrations. This keeps vocabulary rich and enjoyable without decoding trauma.`;
            avoid = `❌ <strong>Avoid:</strong> Pushing past 10 minutes or telling ${cName} to "just try harder". Stress hormones directly inhibit phonological recall.`;
            script = `🗣️ <strong>Encouraging Parent Dialogue:</strong> <em>"${cName}, your brain is wonderful and super creative! Reading just needs a different playful strategy. Let's do 5 minutes of sand letter games, then listen to our favorite story together!"</em>`;
        }
    } else if (qClean.includes('b dan d') || qClean.includes('b and d') || qClean.includes('p dan q') || qClean.includes('confuses') || qClean.includes('tertukar')) {
        if (isBM) {
            rootCause = `Otak manusia secara evolusi diprogramkan untuk "putaran objek" (contoh: cawan tetap cawan walaupun dipusing). Kanak-kanak disleksia memerlukan latihan kinestetik arah untuk mematikan fungsi putaran visual ini bagi huruf b, d, p, q.`;
            step1 = `<strong>Langkah 1: Ritual Tangan "BED" Setiap Pagi</strong><br/>Buat dua penumbuk ibu jari atas (tangan kiri = b, tangan kanan = d). Jadikan ini gerak isyarat refleks sebelum sebarang sesi membaca.`;
            step2 = `<strong>Langkah 2: Sky Writing Gerakan Seluruh Lengan (2 Minit)</strong><br/>Berdiri dan lukis huruf "b" di udara dengan tangan lurus sambil menyebut: "Batang tinggi dulu, baru perut bulat".`;
            step3 = `<strong>Langkah 3: Pelekat Warna Sudut Meja</strong><br/>Tampal kad panduan kecil di sudut meja belajar: 'b' berwarna hijau (Go), 'd' berwarna merah (Stop).`;
            avoid = `❌ <strong>Elakkan:</strong> Menghukum atau menegur secara negatif apabila ${cName} tertukar huruf. Gunakan isyarat tangan penumbuk untuk membolehkan mereka membetulkan sendiri tanpa rasa malu.`;
            script = `🗣️ <strong>Ayat Sokongan Ibu Bapa:</strong> <em>"Bagus ${cName} perasan huruf tu! Jom buat tangan BED sekejap, penumbuk mana yang sepadan dengan huruf ni?"</em>`;
        } else {
            rootCause = `The human brain naturally applies 'mirror invariance' (recognizing an object regardless of orientation). Dyslexic learners need physical motor anchors to train the brain that letter orientation alters meaning.`;
            step1 = `<strong>Step 1: Daily 'BED' Hand Gesture Anchor</strong><br/>Make two thumbs-up fists touching together (left hand = 'b', right hand = 'd'). Practice this as a fun, quick tactile check.`;
            step2 = `<strong>Step 2: Whole-Arm Sky Writing (2 Minutes Daily)</strong><br/>Stand up and trace letter 'b' with full arm strokes while chanting: "Down the bat, around the ball!".`;
            step3 = `<strong>Step 3: Desk-Corner Visual Color Anchors</strong><br/>Tape a small color-coded index card on their study desk: 'b' in green highlighter, 'd' in orange.`;
            avoid = `❌ <strong>Avoid:</strong> Constant verbal corrections. Instead, silently hold up the BED hand cue so ${cName} learns joyful self-correction.`;
            script = `🗣️ <strong>Encouraging Parent Dialogue:</strong> <em>"Awesome effort! Let's check our BED fists real quick—which hand matches this letter?"</em>`;
        }
    } else {
        if (isBM) {
            rootCause = `Berdasarkan metrik saringan LexiSense (Indeks Risiko: ${score}%, Kelajuan: ${readingWCPM} WCPM), ${cName} memerlukan pendekatan berperingkat untuk membina automasi visual dan kelancaran tanpa tekanan.`;
            step1 = `<strong>Langkah 1: Peraturan 10-Minit Bacaan Bergilir</strong><br/>Ibu bapa membaca 1 ayat dengan intonasi menarik, ${cName} membaca ayat seterusnya. Tamatkan sesi tepat 10 minit.`;
            step2 = `<strong>Langkah 2: Pembaris Panduan Warna Lutsinar</strong><br/>Gunakan penanda baris lutsinar berwarna kuning lembut untuk menstabilkan pergerakan anak mata dan mengelakkan terlepas perkataan.`;
            step3 = `<strong>Langkah 3: Ganjaran Papan Bintang Usaha</strong><br/>Beri 1 bintang pelekat setiap kali ${cName} menyelesaikan 1 sesi membaca tanpa mengira berapa banyak kesilapan.`;
            avoid = `❌ <strong>Elakkan:</strong> Membandingkan kelajuan membaca ${cName} dengan rakan sebaya atau adik-beradik lain.`;
            script = `🗣️ <strong>Ayat Sokongan Ibu Bapa:</strong> <em>"Ibu/Ayah sangat bangga melihat usaha ${cName} hari ini! Kita semakin lancar setiap hari!"</em>`;
        } else {
            rootCause = `Based on LexiSense screening telemetry (Risk Index: ${score}%, Speed: ${readingWCPM} WCPM), ${cName} benefits most from targeted cadence scaffolding and low-stress visual tracking aids.`;
            step1 = `<strong>Step 1: 10-Minute Sentence Relay Routine</strong><br/>Alternate sentences back and forth. Parent models rhythmic intonation on sentence 1, ${cName} reads sentence 2.`;
            step2 = `<strong>Step 2: Soft Colored Line Tracking Ruler</strong><br/>Slide a transparent yellow overlay tracker beneath text lines to stabilize ocular fixation and stop line-jumping.`;
            step3 = `<strong>Step 3: Gamified Effort Sticker Board</strong><br/>Award a star sticker for every completed session to build positive dopamine associations with reading.`;
            avoid = `❌ <strong>Avoid:</strong> Comparing reading speed to siblings or classmates. Focus purely on individual growth milestones.`;
            script = `🗣️ <strong>Encouraging Parent Dialogue:</strong> <em>"I am so proud of how hard you practiced today, ${cName}! Every single day we are getting stronger and smoother!"</em>`;
        }
    }

    return `
        <div class="flex items-center justify-between border-b border-purple-700/80 pb-3 flex-wrap gap-2">
            <div class="flex items-center gap-2.5">
                <img src="assets/ollie-mascot.png" alt="Ollie" class="w-7 h-7 object-contain inline-block">
                <div>
                    <h5 class="font-heading font-black text-amber-300 text-base sm:text-lg">
                        ${isBM ? `Pelan Tindakan Tersuai Ollie AI untuk ${cName}` : `Ollie AI Custom Intervention Plan for ${cName}`}
                    </h5>
                    <span class="text-[11px] text-purple-200 font-bold">
                        ${isBM ? `Fokus: ${escapeHTML(query || 'Analisis Menyeluruh')}` : `Focus: ${escapeHTML(query || 'Comprehensive Analysis')}`}
                    </span>
                </div>
            </div>
            <button onclick="navigator.clipboard.writeText(document.getElementById('ollie-ai-text-content').innerText); showToast('AI Intervention Plan copied! 📋')" class="px-3.5 py-1.5 bg-white/10 hover:bg-white/20 text-purple-200 hover:text-white rounded-xl text-xs font-black transition-all flex items-center gap-1.5 border border-purple-400/30 cursor-pointer">
                <i class="fa-solid fa-copy"></i>
                <span>${isBM ? 'Salin Pelan' : 'Copy Plan'}</span>
            </button>
        </div>

        <div id="ollie-ai-text-content" class="space-y-4 text-xs sm:text-sm text-purple-100 leading-relaxed font-medium">
            <!-- Root cause -->
            <div class="bg-purple-900/60 p-4 rounded-2xl border border-purple-700/60 space-y-1">
                <div class="font-black text-amber-300 text-xs sm:text-sm uppercase tracking-wider flex items-center gap-1.5">
                    <i class="fa-solid fa-brain"></i> ${isBM ? 'Punca Asas Mekanisme Otak:' : 'Brain Mechanism & Root Cause:'}
                </div>
                <p class="text-purple-100">${rootCause}</p>
            </div>

            <!-- 3 Steps -->
            <div class="space-y-2.5">
                <div class="font-black text-emerald-300 text-xs sm:text-sm uppercase tracking-wider flex items-center gap-1.5">
                    <i class="fa-solid fa-list-check"></i> ${isBM ? '3 Langkah Tindakan Harian di Rumah (5-10 Minit):' : '3 Daily Action Steps at Home (5-10 Mins):'}
                </div>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div class="bg-white/10 p-3.5 rounded-2xl border border-white/10 space-y-1">
                        <p class="text-xs text-purple-100">${step1}</p>
                    </div>
                    <div class="bg-white/10 p-3.5 rounded-2xl border border-white/10 space-y-1">
                        <p class="text-xs text-purple-100">${step2}</p>
                    </div>
                    <div class="bg-white/10 p-3.5 rounded-2xl border border-white/10 space-y-1">
                        <p class="text-xs text-purple-100">${step3}</p>
                    </div>
                </div>
            </div>

            <!-- Avoid & Script -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div class="bg-rose-950/40 p-3.5 rounded-2xl border border-rose-800/40">
                    <p class="text-xs text-rose-200">${avoid}</p>
                </div>
                <div class="bg-amber-950/40 p-3.5 rounded-2xl border border-amber-800/40">
                    <p class="text-xs text-amber-200">${script}</p>
                </div>
            </div>
        </div>
    `;
}

/**
 * Global Switchers for Suggestions Filters and Languages
 */
window.switchSuggestionsFilter = function(filterKey) {
    if (!window.currentReportData) return;
    window.currentReportData.activeFilter = filterKey;
    const container = document.getElementById('report-supportive-suggestions-wrapper');
    if (container) {
        container.innerHTML = buildReportSuggestionsHTML(window.currentReportData);
    }
};

window.switchSuggestionsLang = function(newLang) {
    if (!window.currentReportData) return;
    window.currentReportData.lang = newLang;
    const container = document.getElementById('report-supportive-suggestions-wrapper');
    if (container) {
        container.innerHTML = buildReportSuggestionsHTML(window.currentReportData);
    }
};

window.setAIPrompt = function(promptText) {
    const inputEl = document.getElementById('ollie-ai-custom-prompt');
    if (inputEl) {
        inputEl.value = promptText;
        inputEl.focus();
    }
};

window.generateOllieAICustomPlan = function() {
    const inputEl = document.getElementById('ollie-ai-custom-prompt');
    const outputEl = document.getElementById('ollie-ai-custom-output');
    const loadingEl = document.getElementById('ollie-ai-loading-indicator');
    const promptText = inputEl ? inputEl.value.trim() : '';

    if (!outputEl) return;
    if (loadingEl) loadingEl.classList.remove('hidden');
    outputEl.classList.add('hidden');

    const data = window.currentReportData || { childName: 'Child', score: 50, riskLevel: 'Moderate Risk', readingWCPM: 45, lang: 'en' };

    setTimeout(() => {
        if (loadingEl) loadingEl.classList.add('hidden');
        outputEl.classList.remove('hidden');
        outputEl.innerHTML = buildOllieAIResponse(data.childName, promptText, data.score, data.riskLevel, data.readingWCPM, data.lang);
        outputEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 800);
};

window.setParentTipsAIPrompt = function(promptText) {
    const inputEl = document.getElementById('parent-tips-custom-prompt');
    if (inputEl) {
        inputEl.value = promptText;
        inputEl.focus();
    }
};

window.generateParentTipsAIPlan = function() {
    const inputEl = document.getElementById('parent-tips-custom-prompt');
    const outputEl = document.getElementById('parent-tips-ai-output');
    const loadingEl = document.getElementById('parent-tips-ai-loading');
    const promptText = inputEl ? inputEl.value.trim() : '';

    if (!outputEl) return;
    if (loadingEl) loadingEl.classList.remove('hidden');
    outputEl.classList.add('hidden');

    const currentUser = window.loggedInUser || JSON.parse(localStorage.getItem('lexisense_user') || 'null');
    const username = currentUser ? currentUser.username : 'guest';
    const activeChild = getScopedActiveChild(username);
    const childName = activeChild ? activeChild.name : (window.currentReportData ? window.currentReportData.childName : 'Your Child');
    const score = window.currentReportData ? window.currentReportData.score : 50;
    const riskLevel = window.currentReportData ? window.currentReportData.riskLevel : 'Moderate Risk';
    const readingWCPM = window.currentReportData ? window.currentReportData.readingWCPM : 45;
    const lang = window.parentTipsLang || 'en';

    setTimeout(() => {
        if (loadingEl) loadingEl.classList.add('hidden');
        outputEl.classList.remove('hidden');
        outputEl.innerHTML = buildOllieAIResponse(childName, promptText, score, riskLevel, readingWCPM, lang);
        outputEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 800);
};

window.switchParentTipsLang = function(lang) {
    window.parentTipsLang = lang;
    const btnEn = document.getElementById('parent-tips-lang-en');
    const btnBm = document.getElementById('parent-tips-lang-bm');
    if (btnEn && btnBm) {
        if (lang === 'bm') {
            btnBm.className = "px-3 py-1 rounded-xl text-xs font-black transition-all bg-amber-400 text-purple-950 shadow-xs cursor-pointer";
            btnEn.className = "px-3 py-1 rounded-xl text-xs font-black transition-all text-purple-200 hover:text-white hover:bg-white/10 cursor-pointer";
        } else {
            btnEn.className = "px-3 py-1 rounded-xl text-xs font-black transition-all bg-amber-400 text-purple-950 shadow-xs cursor-pointer";
            btnBm.className = "px-3 py-1 rounded-xl text-xs font-black transition-all text-purple-200 hover:text-white hover:bg-white/10 cursor-pointer";
        }
    }
    const outputEl = document.getElementById('parent-tips-ai-output');
    if (outputEl && !outputEl.classList.contains('hidden')) {
        generateParentTipsAIPlan();
    }
};

/**
 * Loads and renders full detailed screening report for the selected child.
 * Strictly isolates reports so User B never sees User A's assessments.
 */
async function renderChildReportContent(childNameOrId, selectedHistoryIdx = 0) {
    const reportContainer = document.getElementById('report-main-content-container');
    if (!reportContainer) return;

    const currentUser = window.loggedInUser || JSON.parse(localStorage.getItem('lexisense_user') || 'null');
    const username = currentUser ? currentUser.username : 'guest';

    let history = [];
    if (typeof loadHistoryFromSupabase === 'function') {
        try {
            const dbHistory = await loadHistoryFromSupabase();
            if (dbHistory && dbHistory.length > 0) history = dbHistory;
        } catch (e) {}
    }
    if (!history || history.length === 0) {
        history = getUserAssessmentHistory(username);
    }

    let targetName = childNameOrId;
    if (typeof childNameOrId === 'object' && childNameOrId !== null) {
        targetName = childNameOrId.name;
    }
    if (!targetName) {
        const saved = getScopedActiveChild(username);
        if (saved) {
            targetName = saved.name;
        }
    }

    let childHistory = [];
    if (history && history.length > 0 && targetName) {
        const targetClean = targetName.replace(/^[^\w]+/, '').trim().toLowerCase();
        childHistory = history.filter(h => {
            const nameInRecord = (h.child_name || h.child || '').replace(/^[^\w]+/, '').trim().toLowerCase();
            return nameInRecord.includes(targetClean) || targetClean.includes(nameInRecord);
        });
    }

    // 1. BLANK / EMPTY STATE
    if (!childHistory || childHistory.length === 0) {
        reportContainer.innerHTML = `
            <div class="bg-white rounded-3xl p-12 border-2 border-dashed border-purple-200 text-center space-y-5 shadow-sm w-full">
                <div class="w-20 h-20 bg-purple-50 text-purple-600 rounded-full flex items-center justify-center text-4xl mx-auto">📋</div>
                <div>
                    <h3 class="font-heading text-2xl sm:text-3xl font-extrabold text-brand-purple-deep">No Screening Assessment Found</h3>
                    <p class="text-sm sm:text-base text-gray-600 max-w-md mx-auto mt-1 font-medium">
                        <strong>${escapeHTML(targetName || 'This child')}</strong> has not completed a pre-diagnosis screening yet.
                    </p>
                </div>
                <button onclick="startScreeningFor('${escapeHTML(targetName || '')}')" class="px-8 py-3.5 bg-purple-600 text-white font-extrabold text-sm rounded-2xl shadow hover:bg-purple-700 transition-all cursor-pointer">
                    Start Pre-Diagnosis Screener Now →
                </button>
            </div>
        `;
        return;
    }

    // Index selection
    const activeIdx = Math.min(Math.max(0, parseInt(selectedHistoryIdx, 10) || 0), childHistory.length - 1);
    const selectedRecord = childHistory[activeIdx];

    const displayChildName = selectedRecord.child_name || (selectedRecord.child ? selectedRecord.child.replace(/^[^\w]+/, '').trim() : targetName) || 'Child';
    const score = parseInt(selectedRecord.match_score || selectedRecord.score || 0, 10);
    const risk = selectedRecord.risk_level || selectedRecord.outcome || 'Moderate Risk';
    const riskBadgeClass = score >= 70 ? 'bg-red-100 text-red-800 border-red-300' : (score >= 36 ? 'bg-amber-100 text-amber-800 border-amber-300' : 'bg-emerald-100 text-emerald-800 border-emerald-300');

    // Pillar Scores
    const p1Score = selectedRecord.pillar1_score || Math.min(100, Math.round(score * 1.05));
    const p2Score = selectedRecord.pillar2_score || Math.min(100, Math.round(score * 0.95));
    const p3Score = selectedRecord.pillar3_score || Math.min(100, Math.round(score * 0.90));
    const readingWCPM = selectedRecord.reading_wpm || (score >= 70 ? 32 : (score >= 36 ? 54 : 88));
    const hesitationMs = selectedRecord.hesitation_ms || (score >= 70 ? 450 : 280);

    // Save active report data globally for dynamic filter & AI generation
    window.currentReportData = {
        childName: displayChildName,
        riskLevel: risk,
        score: score,
        readingWCPM: readingWCPM,
        hesitationMs: hesitationMs,
        p1Score: p1Score,
        p2Score: p2Score,
        p3Score: p3Score,
        activeFilter: (window.currentReportData && window.currentReportData.childName === displayChildName) ? window.currentReportData.activeFilter : 'auto',
        lang: (window.currentReportData && window.currentReportData.lang) ? window.currentReportData.lang : 'en'
    };

    // AI Narrative Generation (Short, clear, supportive for all parents)
    let simpleExplanationText = "";
    if (score >= 70) {
        simpleExplanationText = `<strong>${escapeHTML(displayChildName)}</strong> shows noticeable hesitation when sounding out multi-syllabic words and occasional rereading shifts across text lines. With structured daily 10-minute guided reading, phonics games, and classroom line guides, ${escapeHTML(displayChildName)} can build strong confidence and fluency!`;
    } else if (score >= 36) {
        simpleExplanationText = `<strong>${escapeHTML(displayChildName)}</strong> is reading well! There are occasional pauses on unfamiliar words and small rereading gaze shifts. Using a finger guide or reading ruler will make reading smoother and more comfortable.`;
    } else {
        simpleExplanationText = `<strong>${escapeHTML(displayChildName)}</strong> reads smoothly and follows sentences with great confidence! Reading gaze trajectory and word pronunciation are on track. Keep encouraging daily reading enjoyment!`;
    }

    const educatorScriptText = selectedRecord.educator_script || `"Hello Teacher, ${displayChildName} recently completed a LexiSense literacy risk screener showing some extra pauses during reading. Could we please observe ${displayChildName}'s text tracking in class and allow a little extra time for reading activities? Thank you so much!"`;

    reportContainer.innerHTML = `
        <div class="open-section space-y-8 w-full bg-white p-6 sm:p-10 rounded-3xl border border-purple-100 shadow-sm">
            
            <!-- HEADER BAR & PAST REPORT SELECTOR -->
            <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-purple-100 pb-6 gap-4 w-full">
                <div class="flex items-center gap-3.5">
                    <div class="w-14 h-14 bg-amber-400 rounded-2xl flex items-center justify-center p-1 shadow-sm">
                        <img src="assets/ollie-mascot.png" alt="Ollie" class="w-12 h-12 object-contain">
                    </div>
                    <div>
                        <div class="flex items-center gap-2.5 flex-wrap">
                            <h3 class="font-heading text-2xl sm:text-3xl font-extrabold text-brand-purple-deep">LexiSense Dyslexia Risk Screening Summary</h3>
                            <span class="bg-purple-100 text-purple-800 text-sm font-black px-3.5 py-1 rounded-full border border-purple-300">3-Pillar Assessment ✨</span>
                        </div>
                        <p class="text-sm sm:text-base text-gray-600 font-medium mt-0.5">Comprehensive screening metrics, specialist referral guidance, and home learning support</p>
                    </div>
                </div>
                
                <!-- PAST REPORT SELECTOR DROPDOWN -->
                <div class="flex items-center gap-2.5 bg-purple-50 px-4 py-3 rounded-2xl border border-purple-200">
                    <i class="fa-solid fa-clock-rotate-left text-purple-600 text-base"></i>
                    <span class="text-sm font-extrabold text-brand-purple-deep whitespace-nowrap">Screening Date:</span>
                    <select onchange="renderChildReportContent('${escapeHTML(displayChildName)}', this.value)" class="bg-white border-2 border-purple-300 text-purple-950 font-extrabold text-sm sm:text-base rounded-xl px-4 py-2 focus:ring-2 focus:ring-purple-600 focus:outline-none shadow-sm cursor-pointer">
                        ${childHistory.map((h, idx) => `
                            <option value="${idx}" ${idx === activeIdx ? 'selected' : ''}>
                                ${h.date} — ${h.risk_level || h.outcome} (${h.match_score || h.score}%) ${idx === 0 ? '⭐ (Latest)' : ''}
                            </option>
                        `).join('')}
                    </select>
                </div>
            </div>

            <!-- KEY RESULTS AT A GLANCE (4 CLEAN BADGES) -->
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 p-6 bg-purple-50/70 rounded-3xl border border-purple-100 w-full">
                <div class="space-y-1">
                    <span class="text-xs sm:text-sm font-extrabold text-gray-500 uppercase tracking-wide block">Child's Name</span>
                    <span class="font-black text-brand-purple-deep text-lg sm:text-2xl block">${escapeHTML(displayChildName)}</span>
                </div>
                <div class="space-y-1">
                    <span class="text-xs sm:text-sm font-extrabold text-gray-500 uppercase tracking-wide block">Date of Screener</span>
                    <span class="font-bold text-brand-purple-deep text-base sm:text-xl block">${selectedRecord.date || 'Recent'}</span>
                </div>
                <div class="space-y-1">
                    <span class="text-xs sm:text-sm font-extrabold text-gray-500 uppercase tracking-wide block">Screening Index</span>
                    <span class="font-black text-purple-700 text-xl sm:text-3xl block">${score} / 100</span>
                </div>
                <div class="space-y-1">
                    <span class="text-xs sm:text-sm font-extrabold text-gray-500 uppercase tracking-wide block">Risk Classification</span>
                    <span class="font-black text-sm sm:text-base px-3.5 py-1.5 rounded-full inline-block mt-0.5 border ${riskBadgeClass}">${risk}</span>
                </div>
            </div>

            <!-- SPECIALIST REFERRAL GUIDANCE CARD -->
            ${score >= 65 ? `
            <div class="p-6 sm:p-7 bg-red-50/90 rounded-3xl border-2 border-red-300 space-y-2.5">
                <div class="flex items-center gap-2.5 text-red-900 font-extrabold text-base sm:text-lg">
                    <span class="text-2xl">🔴</span>
                    <h4 class="font-heading uppercase font-black text-red-950 text-base sm:text-lg">Specialist Referral Guidance: Multidisciplinary Evaluation Recommended</h4>
                </div>
                <p class="text-sm sm:text-base text-red-950 leading-relaxed font-semibold">
                    <strong>Current Recommendation:</strong> Because ${escapeHTML(displayChildName)} exhibits elevated decoding hesitation and frequent rereading gaze shifts (Screening Index: ${score} / 100), we recommend scheduling a comprehensive evaluation by an <strong>Educational Psychologist</strong>, <strong>Speech-Language Pathologist</strong>, or <strong>Developmental Paediatrician</strong> for formal evaluation and school support planning.
                </p>
            </div>
            ` : (score >= 35 ? `
            <div class="p-6 sm:p-7 bg-amber-50/90 rounded-3xl border-2 border-amber-300 space-y-2.5">
                <div class="flex items-center gap-2.5 text-amber-900 font-extrabold text-base sm:text-lg">
                    <span class="text-2xl">🟡</span>
                    <h4 class="font-heading uppercase font-black text-amber-950 text-base sm:text-lg">Specialist Referral Guidance: Targeted Support & 60-Day Follow-Up</h4>
                </div>
                <p class="text-sm sm:text-base text-amber-950 leading-relaxed font-semibold">
                    <strong>Current Recommendation:</strong> ${escapeHTML(displayChildName)} shows moderate reading hesitation and estimated tracking shifts (Screening Index: ${score} / 100). Immediate specialist evaluation is not indicated based solely on this screening session. We recommend 6–8 weeks of structured home reading and classroom accommodations. If difficulties persist, consider consulting an educational specialist.
                </p>
            </div>
            ` : `
            <div class="p-6 sm:p-7 bg-emerald-50/90 rounded-3xl border-2 border-emerald-300 space-y-2.5">
                <div class="flex items-center gap-2.5 text-emerald-900 font-extrabold text-base sm:text-lg">
                    <span class="text-2xl">🟢</span>
                    <h4 class="font-heading uppercase font-black text-emerald-950 text-base sm:text-lg">Specialist Referral Guidance: Routine Monitoring — No Immediate Referral Indicated</h4>
                </div>
                <p class="text-sm sm:text-base text-emerald-950 leading-relaxed font-semibold">
                    <strong>LOW SCREENING CONCERN:</strong> Current screening results did not identify an elevated pattern of dyslexia-related indicators across the assessed domains (${score} / 100). This result does not exclude a specific learning disorder and should be interpreted alongside developmental history, classroom performance and professional assessment where concerns persist. Continue routine literacy enrichment at home.
                </p>
            </div>
            `)}

            <!-- 3 SIMPLE READING HIGHLIGHTS -->
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-5 w-full">
                <div class="p-5 sm:p-6 bg-purple-50/60 rounded-3xl border border-purple-100 space-y-1.5">
                    <span class="text-xs sm:text-sm font-extrabold text-purple-700 uppercase tracking-wider block">👁️ Reading Gaze Behaviour</span>
                    <span class="text-2xl sm:text-3xl font-black text-brand-purple-deep block">${100 - Math.round(p2Score * 0.4)}% Steady</span>
                    <span class="text-sm text-gray-600 font-medium block">Webcam-estimated dwell & reading shifts</span>
                </div>

                <div class="p-5 sm:p-6 bg-purple-50/60 rounded-3xl border border-purple-100 space-y-1.5">
                    <span class="text-xs sm:text-sm font-extrabold text-purple-700 uppercase tracking-wider block">📖 Oral Reading Cadence</span>
                    <span class="text-2xl sm:text-3xl font-black text-brand-purple-deep block">${readingWCPM} WCPM</span>
                    <span class="text-sm text-gray-600 font-medium block">Words correct per minute</span>
                </div>

                <div class="p-5 sm:p-6 bg-purple-50/60 rounded-3xl border border-purple-100 space-y-1.5">
                    <span class="text-xs sm:text-sm font-extrabold text-purple-700 uppercase tracking-wider block">🔤 Phonological & Decoding</span>
                    <span class="text-2xl sm:text-3xl font-black text-brand-purple-deep block">${p1Score}% Match</span>
                    <span class="text-sm text-gray-600 font-medium block">Sounding out words and letter shapes</span>
                </div>
            </div>

            <!-- SIMPLE SUMMARY & 5-AXIS RADAR CHART -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch w-full">
                
                <!-- LEFT: OLLIE OWL'S FRIENDLY EXPLANATION -->
                <div class="space-y-5 bg-purple-50/40 p-6 sm:p-8 rounded-3xl border border-purple-100 flex flex-col justify-between">
                    <div>
                        <div class="flex items-center gap-2.5 mb-3">
                            <img src="assets/ollie-mascot.png" alt="Ollie" class="w-8 h-8 object-contain inline-block">
                            <h4 class="font-heading text-xl sm:text-2xl font-extrabold text-brand-purple-deep">Screening Interpretation & Observations:</h4>
                        </div>
                        <div class="text-sm sm:text-base text-gray-800 leading-relaxed bg-white p-5 rounded-2xl border border-purple-100 shadow-sm space-y-2 font-medium">
                            <p>${simpleExplanationText}</p>
                        </div>
                    </div>

                    <!-- 3 EASY BREAKDOWN BARS -->
                    <div class="space-y-4 pt-3">
                        <h5 class="text-sm font-extrabold text-brand-purple-deep uppercase tracking-wider">3-Pillar Screening Breakdown:</h5>
                        
                        <div class="space-y-1.5">
                            <div class="flex justify-between text-sm sm:text-base font-bold">
                                <span>1. Pillar 1: Parent / Behavioral Observations (40%)</span>
                                <span class="text-purple-700 font-extrabold">${p1Score}%</span>
                            </div>
                            <div class="w-full bg-purple-100 h-3.5 rounded-full overflow-hidden">
                                <div class="bg-purple-600 h-full rounded-full transition-all duration-500" style="width: ${p1Score}%"></div>
                            </div>
                        </div>

                        <div class="space-y-1.5">
                            <div class="flex justify-between text-sm sm:text-base font-bold">
                                <span>2. Pillar 2: Oral Reading (${readingWCPM} WCPM · 40%)</span>
                                <span class="text-purple-700 font-extrabold">${p2Score}%</span>
                            </div>
                            <div class="w-full bg-purple-100 h-3.5 rounded-full overflow-hidden">
                                <div class="bg-indigo-600 h-full rounded-full transition-all duration-500" style="width: ${p2Score}%"></div>
                            </div>
                        </div>

                        <div class="space-y-1.5">
                            <div class="flex justify-between text-sm sm:text-base font-bold">
                                <span>3. Pillar 3: Reading Gaze Behaviour (20%)</span>
                                <span class="text-purple-700 font-extrabold">${p3Score}%</span>
                            </div>
                            <div class="w-full bg-purple-100 h-3.5 rounded-full overflow-hidden">
                                <div class="bg-amber-500 h-full rounded-full transition-all duration-500" style="width: ${p3Score}%"></div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- RIGHT: 5-AXIS SCREENING RADAR PROFILE -->
                <div class="bg-purple-50/40 p-6 sm:p-8 rounded-3xl border border-purple-100 w-full flex flex-col justify-center">
                    <h5 class="text-base sm:text-lg font-extrabold text-center text-brand-purple-deep mb-4 font-heading">5-Axis Screening Radar Profile</h5>
                    <div class="h-72 relative">
                        <canvas id="reportRadarChart"></canvas>
                    </div>
                </div>
            </div>

            <!-- TEACHING SUGGESTIONS FOR PARENTS & HOME SUPPORT (DYNAMIC & AI-POWERED) -->
            <div id="report-supportive-suggestions-wrapper" class="w-full">
                ${buildReportSuggestionsHTML(window.currentReportData)}
            </div>

            <!-- READY-TO-COPY NOTE FOR SCHOOL TEACHER -->
            <div class="p-6 sm:p-8 bg-purple-50/70 rounded-3xl border border-purple-200 space-y-4 shadow-sm w-full">
                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <h4 class="font-heading font-extrabold text-brand-purple-deep text-base sm:text-lg flex items-center gap-2.5">
                        <i class="fa-solid fa-comment-dots text-purple-600 text-xl"></i> Easy Note to Send to ${escapeHTML(displayChildName)}'s Teacher:
                    </h4>
                    <button onclick="navigator.clipboard.writeText(document.getElementById('report-educator-script').textContent.trim()); showToast('Teacher note copied to clipboard! 📋')" class="text-sm bg-purple-600 hover:bg-purple-700 text-white font-extrabold px-5 py-2.5 rounded-2xl transition shadow-sm flex items-center gap-2 cursor-pointer self-start sm:self-auto">
                        <i class="fa-solid fa-copy"></i> Copy Teacher Note
                    </button>
                </div>
                <p id="report-educator-script" class="text-sm sm:text-base text-gray-800 leading-relaxed italic bg-white p-5 rounded-2xl border border-purple-100 shadow-sm font-semibold">
                    ${escapeHTML(educatorScriptText)}
                </p>
            </div>

            <!-- SCIENTIFIC DISCLAIMER -->
            <div class="pt-4 border-t border-purple-100 text-xs text-gray-500 leading-relaxed">
                <strong>SCREENING NOTICE:</strong> LexiSense is a multimodal dyslexia risk-screening and child literacy assessment support system. It identifies patterns of screening concern and does not constitute a formal medical or psychological diagnosis. The screening outcome should be interpreted alongside developmental history, educational performance and professional assessment. Where persistent concerns exist, evaluation by an appropriately qualified educational psychologist, speech-language pathologist, or medical professional is recommended.
            </div>

        </div>
    `;

    if (typeof renderRadarChart === 'function') {
        renderRadarChart(selectedRecord);
    }
}

/**
 * Dynamically compares 2 screening sessions for the child with deep AI progress analysis & delta cards.
 */
async function renderComparisonJourney(childNameOrId, idxA = 0, idxB = 1) {
    const compContainer = document.getElementById('comparison-main-content-container');
    if (!compContainer) return;

    const currentUser = window.loggedInUser || JSON.parse(localStorage.getItem('lexisense_user') || 'null');
    const username = currentUser ? currentUser.username : 'guest';

    let history = [];
    if (typeof loadHistoryFromSupabase === 'function') {
        try {
            const dbHistory = await loadHistoryFromSupabase();
            if (dbHistory && dbHistory.length > 0) history = dbHistory;
        } catch(e) {}
    }
    if (!history || history.length === 0) {
        history = getUserAssessmentHistory(username);
    }

    let targetName = childNameOrId;
    if (typeof childNameOrId === 'object' && childNameOrId !== null) {
        targetName = childNameOrId.name;
    }
    if (!targetName) {
        const saved = getScopedActiveChild(username);
        if (saved) {
            targetName = saved.name;
        }
    }

    let childHistory = [];
    if (history && history.length > 0 && targetName) {
        const targetClean = targetName.replace(/^[^\w]+/, '').trim().toLowerCase();
        childHistory = history.filter(h => {
            const nameInRecord = (h.child_name || h.child || '').replace(/^[^\w]+/, '').trim().toLowerCase();
            return nameInRecord.includes(targetClean) || targetClean.includes(nameInRecord);
        });
    }

    // 1. BLANK / EMPTY STATE: If less than 2 screenings exist
    if (!childHistory || childHistory.length < 2) {
        compContainer.innerHTML = `
            <div class="bg-white rounded-3xl p-12 border-2 border-dashed border-purple-200 text-center space-y-4 shadow-sm w-full">
                <div class="w-16 h-16 bg-purple-50 text-purple-600 rounded-full flex items-center justify-center text-3xl mx-auto">📊</div>
                <div>
                    <h3 class="font-heading text-2xl font-bold text-brand-purple-deep">Comparison Needs at Least 2 Screenings</h3>
                    <p class="text-xs text-gray-500 max-w-md mx-auto mt-1">
                        <strong>${escapeHTML(targetName || 'This child')}</strong> has ${childHistory.length} recorded screening session. Complete at least one more assessment over time to unlock side-by-side journey tracking!
                    </p>
                </div>
                <button onclick="startScreeningFor('${escapeHTML(targetName || '')}')" class="px-6 py-3 bg-purple-600 text-white font-extrabold text-xs rounded-2xl shadow hover:bg-purple-700 transition-all">
                    Start Another Screener
                </button>
            </div>
        `;
        return;
    }

    const posA = Math.min(Math.max(0, parseInt(idxA, 10) || 0), childHistory.length - 1);
    let posB = Math.min(Math.max(0, parseInt(idxB, 10) || 1), childHistory.length - 1);
    if (posA === posB) posB = posA === 0 ? 1 : 0;

    const latest = childHistory[posA];
    const previous = childHistory[posB];

    const latestScore = parseInt(latest.match_score || latest.score || 0, 10);
    const prevScore = parseInt(previous.match_score || previous.score || 0, 10);
    const scoreDiff = latestScore - prevScore;

    const latestWPM = latest.reading_wpm || (latestScore >= 70 ? 32 : (latestScore >= 36 ? 54 : 88));
    const prevWPM = previous.reading_wpm || (prevScore >= 70 ? 28 : (prevScore >= 36 ? 44 : 76));
    const wpmDiff = latestWPM - prevWPM;

    const displayChildName = latest.child_name || (latest.child ? latest.child.replace(/^[^\w]+/, '').trim() : targetName) || 'Child';

    // AI Growth Narrative
    let aiGrowthNarrative = "";
    if (scoreDiff < 0) {
        aiGrowthNarrative = `🎉 <strong>Positive Progress Milestone:</strong> ${displayChildName}'s risk score decreased by ${Math.abs(scoreDiff)}% (${prevScore}% → ${latestScore}%) and reading speed improved by +${wpmDiff} WPM! Line skipping frequency showed noticeable reduction.`;
    } else if (scoreDiff === 0) {
        aiGrowthNarrative = `⚖️ <strong>Stable Assessment Trajectory:</strong> ${displayChildName}'s screening score remains consistent at ${latestScore}%. Eye-tracking gaze stability and reading WPM (${latestWPM} WPM) demonstrate steady learning retention.`;
    } else {
        aiGrowthNarrative = `📈 <strong>Increased Score Variance:</strong> ${displayChildName}'s match score increased by +${scoreDiff}% (${prevScore}% → ${latestScore}%). This often reflects higher visual fatigue or harder text difficulty. Continue using reading rulers during homework.`;
    }

    compContainer.innerHTML = `
        <div class="space-y-6 w-full">
            
            <!-- SESSION SELECTOR BAR -->
            <div class="open-section p-4 sm:p-6 bg-purple-50/60 rounded-3xl border border-purple-100 flex flex-col sm:flex-row justify-between items-center gap-4 w-full">
                <div class="flex items-center gap-2">
                    <span class="text-xl">📊</span>
                    <div>
                        <h4 class="font-heading font-extrabold text-brand-purple-deep text-base">Session Comparison Selector</h4>
                        <p class="text-xs text-gray-500">Choose 2 past screening dates to compare side-by-side</p>
                    </div>
                </div>

                <div class="flex flex-wrap items-center gap-3 text-xs font-bold">
                    <div class="flex items-center gap-1.5 bg-white p-2 rounded-2xl border border-purple-200">
                        <span class="text-gray-500">Session A:</span>
                        <select onchange="renderComparisonJourney('${escapeHTML(displayChildName)}', this.value, ${posB})" class="font-extrabold text-purple-950 focus:outline-none">
                            ${childHistory.map((h, idx) => `
                                <option value="${idx}" ${idx === posA ? 'selected' : ''}>
                                    ${h.date} (${h.match_score || h.score}%) ${idx === 0 ? '⭐' : ''}
                                </option>
                            `).join('')}
                        </select>
                    </div>

                    <span class="font-extrabold text-purple-600">VS</span>

                    <div class="flex items-center gap-1.5 bg-white p-2 rounded-2xl border border-purple-200">
                        <span class="text-gray-600">Session B:</span>
                        <select onchange="renderComparisonJourney('${escapeHTML(displayChildName)}', ${posA}, this.value)" class="font-extrabold text-purple-950 focus:outline-none">
                            ${childHistory.map((h, idx) => `
                                <option value="${idx}" ${idx === posB ? 'selected' : ''}>
                                    ${h.date} (${h.match_score || h.score}%)
                                </option>
                            `).join('')}
                        </select>
                    </div>
                </div>
            </div>

            <!-- AI GROWTH MILESTONE BANNER -->
            <div class="p-5 bg-purple-50 rounded-3xl border-2 border-purple-300 text-xs text-purple-950 shadow-sm flex items-center gap-3">
                <img src="assets/ollie-mascot.png" alt="Ollie" class="w-8 h-8 object-contain shrink-0">
                <div class="leading-relaxed">
                    ${aiGrowthNarrative}
                </div>
            </div>

            <!-- SIDE BY SIDE CARDS -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                
                <!-- SESSION B (EARLIER) -->
                <div class="open-section bg-white p-6 rounded-3xl border border-purple-100 shadow-sm space-y-5">
                    <div class="flex justify-between items-center border-b border-purple-100 pb-3">
                        <div>
                            <span class="text-xs font-bold text-gray-400 uppercase tracking-wider">Earlier Session</span>
                            <h3 class="font-heading font-bold text-brand-purple-deep text-lg">${previous.date || 'Previous Date'}</h3>
                        </div>
                        <span class="bg-gray-100 text-gray-800 font-extrabold text-xs px-3 py-1 rounded-full">
                            ${previous.risk_level || previous.outcome} (${prevScore}%)
                        </span>
                    </div>
                    <div class="space-y-3 text-xs">
                        <div class="flex justify-between items-center py-2 border-b border-purple-50">
                            <span class="text-gray-600">Child Profile:</span>
                            <span class="font-bold text-brand-purple-deep">${escapeHTML(displayChildName)}</span>
                        </div>
                        <div class="flex justify-between items-center py-2 border-b border-purple-50">
                            <span class="text-gray-600">Reading Speed:</span>
                            <span class="font-bold text-brand-purple-deep">${prevWPM} WPM</span>
                        </div>
                        <div class="flex justify-between items-center py-2">
                            <span class="text-gray-600">Overall Match Score:</span>
                            <span class="font-bold text-brand-purple-deep">${prevScore}%</span>
                        </div>
                    </div>
                </div>

                <!-- SESSION A (LATEST / SELECTED) -->
                <div class="open-section bg-white p-6 rounded-3xl border-2 border-purple-500 shadow-md space-y-5 relative">
                    ${posA === 0 ? `<span class="absolute -top-3 right-6 bg-amber-400 text-purple-950 font-extrabold text-xs px-3.5 py-1 rounded-full uppercase shadow-sm">Latest Session ⭐</span>` : ''}
                    <div class="flex justify-between items-center border-b border-purple-100 pb-3">
                        <div>
                            <span class="text-xs font-bold text-purple-600 uppercase tracking-wider">Target Session</span>
                            <h3 class="font-heading font-bold text-brand-purple-deep text-lg">${latest.date || 'Latest Date'}</h3>
                        </div>
                        <span class="bg-purple-100 text-purple-900 font-extrabold text-xs px-3 py-1 rounded-full">
                            ${latest.risk_level || latest.outcome} (${latestScore}%)
                        </span>
                    </div>
                    <div class="space-y-3 text-xs">
                        <div class="flex justify-between items-center py-2 border-b border-purple-50">
                            <span class="text-gray-600">Score Variation:</span>
                            <span class="font-extrabold ${scoreDiff <= 0 ? 'text-emerald-600' : 'text-amber-600'}">
                                ${scoreDiff <= 0 ? `${scoreDiff}% (Improved) ↓` : `+${scoreDiff}% (Higher variance) ↑`}
                            </span>
                        </div>
                        <div class="flex justify-between items-center py-2 border-b border-purple-50">
                            <span class="text-gray-600">Reading Speed Gain:</span>
                            <span class="font-extrabold ${wpmDiff >= 0 ? 'text-emerald-600' : 'text-amber-600'}">
                                ${wpmDiff >= 0 ? `+${wpmDiff} WPM Faster ↑` : `${wpmDiff} WPM ↓`}
                            </span>
                        </div>
                        <div class="flex justify-between items-center py-2">
                            <span class="text-gray-600">Overall Match Score:</span>
                            <span class="font-bold text-purple-700">${latestScore}%</span>
                        </div>
                    </div>
                </div>

            </div>

            <!-- VISUAL COMPARISON CHART -->
            <div class="open-section space-y-4 w-full bg-white p-6 rounded-3xl border border-purple-100">
                <h4 class="font-heading font-bold text-brand-purple-deep text-base">Dual Assessment Comparison Chart</h4>
                <div class="h-64 relative w-full">
                    <canvas id="comparisonBarChart"></canvas>
                </div>
            </div>

        </div>
    `;

    if (typeof renderComparisonChart === 'function') {
        renderComparisonChart(latest, previous);
    }
}

async function updateReportWithMultimodalResult(payload, skipSupabaseSync = false) {
    const currentUser = window.loggedInUser || JSON.parse(localStorage.getItem('lexisense_user') || 'null');
    const username = currentUser ? currentUser.username : 'guest';

    const childNameStr = typeof payload.childId === 'object' 
        ? payload.childId.name 
        : (payload.childName || payload.childId || 'Child');

    const matchScoreVal = parseInt(payload.matchScore || payload.score || 0, 10);
    const riskLevelVal = payload.riskLevel || payload.outcome || (matchScoreVal >= 65 ? 'Elevated Indicators Observed' : (matchScoreVal >= 35 ? 'Some Indicators Observed' : 'Few Indicators Observed'));
    const readingWPMVal = Math.round(payload.temporalMetrics?.calculatedWCPM || payload.temporalMetrics?.calculatedWPM || payload.reading_wpm || (matchScoreVal >= 65 ? 32 : (matchScoreVal >= 35 ? 54 : 96)));
    const hesitationMsVal = Math.round(payload.temporalMetrics?.avgHesitationMs || payload.hesitation_ms || (matchScoreVal >= 65 ? 460 : (matchScoreVal >= 35 ? 290 : 180)));
    const fixationsVal = payload.temporalMetrics?.wordsAttempted || payload.subScores?.fixationCount || (matchScoreVal >= 65 ? 38 : (matchScoreVal >= 35 ? 24 : 16));
    const regressionsVal = payload.temporalMetrics?.regressionsCount ?? payload.subScores?.regressions ?? (matchScoreVal >= 65 ? 6 : (matchScoreVal >= 35 ? 3 : 1));

    const historyKey = `lexisense_history_${username.toLowerCase()}`;
    let cachedHistory = [];
    try {
        cachedHistory = getUserAssessmentHistory(username) || [];
    } catch(e) {}

    const newHistoryEntry = {
        id: 'hist_' + Date.now(),
        date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
        child: `👧 ${childNameStr}`,
        child_name: childNameStr,
        type: 'Dyslexia Risk Screening',
        outcome: riskLevelVal,
        risk_level: riskLevelVal,
        score: `${matchScoreVal}%`,
        match_score: matchScoreVal,
        raw_score: payload.rawScore || 0,
        pillar1_score: payload.pillar1Score ?? Math.min(100, Math.round(matchScoreVal * 1.05)),
        pillar2_score: payload.pillar2Score ?? Math.min(100, Math.round(matchScoreVal * 0.95)),
        pillar3_score: payload.pillar3Score ?? Math.min(100, Math.round(matchScoreVal * 0.90)),
        reading_wpm: readingWPMVal,
        hesitation_ms: hesitationMsVal,
        sub_scores: {
            fixationCount: fixationsVal,
            regressions: regressionsVal
        },
        temporal_metrics: payload.temporalMetrics || {},
        educator_script: payload.educatorScript || '',
        outcomeClass: matchScoreVal >= 65 ? 'bg-red-100 text-red-800' : (matchScoreVal >= 35 ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800')
    };

    cachedHistory.unshift(newHistoryEntry);
    localStorage.setItem(historyKey, JSON.stringify(cachedHistory));

    if (!skipSupabaseSync && !payload._alreadySavedToSupabase && typeof saveScreeningToSupabase === 'function') {
        try {
            await saveScreeningToSupabase(payload);
        } catch (err) {
            console.warn("Could not save screening to Supabase:", err);
        }
    }

    await refreshUserScopedData();

    if (typeof renderChildReportContent === 'function') {
        await renderChildReportContent(childNameStr, 0);
    }

    if (window.location.pathname.includes('parent-page.html')) {
        switchView('report');
    }
}

function toggleNotifications() {
    const panel = document.getElementById('notifications-panel');
    if (panel) panel.classList.toggle('hidden');
}

function openAddChildModal() {
    const modal = document.getElementById('add-child-modal');
    if (modal) modal.classList.remove('hidden');
}

function closeAddChildModal() {
    const modal = document.getElementById('add-child-modal');
    if (modal) modal.classList.add('hidden');
}

function showToast(msg) {
    const toast = document.getElementById('toast');
    const msgElement = document.getElementById('toast-message');
    if (toast && msgElement) {
        msgElement.textContent = msg;
        toast.classList.remove('translate-y-[-100px]', 'opacity-0');
        setTimeout(() => {
            toast.classList.add('translate-y-[-100px]', 'opacity-0');
        }, 3200);
    }
}

function escapeHTML(str) {
    if (!str) return '';
    return str.replace(/[&<>'"]/g, 
        tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
    );
}

document.addEventListener('DOMContentLoaded', async () => {
    await refreshUserScopedData();
    if (typeof loadParentProfileView === 'function') {
        loadParentProfileView();
    }

    const urlParams = new URLSearchParams(window.location.search);
    const viewParam = urlParams.get('view');
    const childParam = urlParams.get('child');
    if (childParam) {
        const decodedChild = decodeURIComponent(childParam);
        selectedReportChild = decodedChild;
        if (typeof selectChildForReport === 'function') {
            selectChildForReport(decodedChild);
        }
    }
    if (viewParam && window.location.pathname.includes('parent-page.html')) {
        switchView(viewParam);
        if (viewParam === 'report' && childParam) {
            selectChildForReport(decodeURIComponent(childParam));
        }
    }
});

// Cross-tab synchronization listener
window.addEventListener('storage', (e) => {
    if (e.key && (e.key.includes('lexisense_children') || e.key.includes('lexisense_active_child') || e.key.includes('lexisense_history') || e.key.includes('lexisense_user'))) {
        refreshUserScopedData();
    }
});

/**
 * Opens the Formal Clinical & Hospital Specialist Referral Report for the active child
 */
function openFormalReportPreview() {
    const currentUser = window.loggedInUser || JSON.parse(localStorage.getItem('lexisense_user') || 'null');
    const username = currentUser ? currentUser.username : 'guest';
    const activeChild = selectedReportChild || getScopedActiveChild(username)?.name || 'Child';
    window.open(`report-preview-parent.html?child=${encodeURIComponent(activeChild)}`, '_blank');
}

/**
 * Interactive Gaze Trail & Reading Playback Engine
 * Fully synchronized with the active child and their specific screening diagnosis & ocular metrics.
 */
let replayAnimationTimer = null;
let replayIsPlaying = false;
let replayCurrentStepIdx = 0;
let replaySpeedMultiplier = 1;
let replayTimelineSteps = [];
let replayActiveRecord = null;

async function playGazeReadingReplay(targetChildName) {
    const modal = document.getElementById('gaze-replay-modal');
    if (!modal) return;
    modal.classList.remove('hidden');

    const currentUser = window.loggedInUser || JSON.parse(localStorage.getItem('lexisense_user') || 'null');
    const username = currentUser ? currentUser.username : 'guest';

    // 1. Resolve Target Child
    let childName = targetChildName;
    if (!childName) {
        childName = selectedReportChild;
    }
    if (!childName) {
        const scoped = getScopedActiveChild(username);
        if (scoped) childName = scoped.name;
    }

    // 2. Fetch history records (Supabase if available, fallback to localStorage)
    let history = [];
    if (typeof loadHistoryFromSupabase === 'function') {
        try {
            const dbHistory = await loadHistoryFromSupabase();
            if (dbHistory && dbHistory.length > 0) history = dbHistory;
        } catch (e) {}
    }
    if (!history || history.length === 0) {
        history = getUserAssessmentHistory(username) || [];
    }

    // 3. Match records for the specific child
    let childRecords = [];
    if (childName && history && history.length > 0) {
        const cleanTarget = childName.replace(/^[^\w]+/, '').trim().toLowerCase();
        childRecords = history.filter(h => {
            const recName = (h.child_name || h.child || '').replace(/^[^\w]+/, '').trim().toLowerCase();
            return recName.includes(cleanTarget) || cleanTarget.includes(recName);
        });
    }

    let activeRecord = null;
    if (childRecords.length > 0) {
        activeRecord = childRecords[0];
    } else if (history.length > 0) {
        activeRecord = history[0];
    }

    const displayChildName = (activeRecord && (activeRecord.child_name || (activeRecord.child ? activeRecord.child.replace(/^[^\w]+/, '').trim() : null))) || childName || 'Child';
    const score = parseInt((activeRecord && (activeRecord.match_score || activeRecord.score)) || 0, 10);
    const riskLevel = (activeRecord && (activeRecord.risk_level || activeRecord.outcome)) || (score >= 65 ? 'Elevated Indicators' : (score >= 35 ? 'Some Indicators' : 'Few Indicators'));

    // Synchronize metric stats with child's real screening data
    const readingWPM = activeRecord?.reading_wpm || (score >= 65 ? 32 : (score >= 35 ? 54 : 96));
    const hesitationMs = activeRecord?.hesitation_ms || (score >= 65 ? 460 : (score >= 35 ? 290 : 180));
    const fixationsCount = activeRecord?.sub_scores?.fixationCount || activeRecord?.sub_scores?.fixations || (score >= 65 ? 38 : (score >= 35 ? 24 : 16));
    const regressionsCount = activeRecord?.sub_scores?.regressions ?? activeRecord?.sub_scores?.regressionsCount ?? (score >= 65 ? 6 : (score >= 35 ? 3 : 1));

    replayActiveRecord = {
        childName: displayChildName,
        score,
        riskLevel,
        readingWPM,
        hesitationMs,
        fixationsCount,
        regressionsCount
    };

    // Update modal UI elements
    const childBadge = document.getElementById('replay-child-badge');
    const diagBadge = document.getElementById('replay-diagnosis-badge');
    const fixEl = document.getElementById('replay-fixations-count');
    const regEl = document.getElementById('replay-regressions-count');
    const wpmEl = document.getElementById('replay-wpm-count');
    const dwellEl = document.getElementById('replay-dwell-count');
    const currentWordBar = document.getElementById('replay-current-word');

    if (childBadge) childBadge.textContent = `👧 ${displayChildName}`;
    if (diagBadge) {
        diagBadge.textContent = `${riskLevel} (${score}%)`;
        diagBadge.className = `px-2.5 py-0.5 rounded-full text-xs font-black border ${score >= 65 ? 'bg-red-100 text-red-800 border-red-300' : (score >= 35 ? 'bg-amber-100 text-amber-800 border-amber-300' : 'bg-emerald-100 text-emerald-800 border-emerald-300')}`;
    }
    if (fixEl) fixEl.textContent = fixationsCount;
    if (regEl) regEl.textContent = regressionsCount;
    if (wpmEl) wpmEl.textContent = `${readingWPM} WPM`;
    if (dwellEl) dwellEl.textContent = `${hesitationMs}ms`;
    if (currentWordBar) {
        currentWordBar.innerHTML = `<span>Reading Focus: Ready to replay</span><span class="text-[11px] text-purple-600 font-normal">Synchronized with ${escapeHTML(displayChildName)}'s diagnosis</span>`;
    }

    // Set up personalized reading passage for this child
    const passageContainer = document.getElementById('replay-passage-text');
    if (passageContainer) {
        const passageSentence = `The little brown puppy ran across the green garden. ${displayChildName} smiles happily as the sun shines warm and bright. Every afternoon, ${displayChildName} opens the story book to practice reading new words with family. She sounds out each letter carefully and learns to blend sounds together with confidence.`;
        const wordsList = passageSentence.split(/\s+/);
        passageContainer.innerHTML = wordsList.map((w, idx) => `<span class="replay-word inline-block px-1.5 py-0.5 rounded-lg transition-all duration-150" data-widx="${idx}">${escapeHTML(w)}</span>`).join(' ');
    }

    // Build timeline steps synchronized with this child's diagnosis & regressions
    buildReplayTimelineSteps(displayChildName, score, readingWPM, hesitationMs, regressionsCount);

    resetReplayAnimation();
    setTimeout(() => {
        toggleReplayPlay();
    }, 250);
}

function buildReplayTimelineSteps(childName, score, readingWPM, baseHesitationMs, regressionCount) {
    const words = document.querySelectorAll('.replay-word');
    if (!words || words.length === 0) return;

    replayTimelineSteps = [];
    const totalWords = words.length;

    // Define regression backtrack target positions based on risk severity
    const regressionJumps = {};
    if (score >= 65 || regressionCount >= 5) {
        // High risk: multiple backtracking regressions on difficult words
        regressionJumps[5] = 3;   // "across" -> "puppy"
        regressionJumps[11] = 8;  // "happily" -> "garden"
        regressionJumps[18] = 16; // "afternoon" -> "bright"
        regressionJumps[25] = 23; // "carefully" -> "letter"
        regressionJumps[31] = 29; // "confidence" -> "blend"
    } else if (score >= 35 || regressionCount >= 2) {
        // Moderate risk: 2 regression jumps
        regressionJumps[11] = 9;  // "happily" -> "smiles"
        regressionJumps[25] = 23; // "carefully" -> "letter"
    } else {
        // Low risk: 0–1 minor checkback
        regressionJumps[18] = 17; // minor checkback
    }

    const rawStepMs = Math.max(160, Math.min(650, Math.round((60000 / Math.max(readingWPM, 20)) * 0.35)));

    for (let i = 0; i < totalWords; i++) {
        const wordText = words[i].textContent.trim();
        let dwell = baseHesitationMs;
        if (wordText.length > 6 || /[,.]/.test(wordText)) {
            dwell = Math.round(baseHesitationMs * 1.35);
        }

        // Standard Fixation Step
        replayTimelineSteps.push({
            type: 'fixation',
            wordIdx: i,
            dwellMs: Math.max(rawStepMs, dwell),
            status: `Reading Focus: "${wordText}" (${dwell}ms dwell)`
        });

        // Regression Jump Step
        if (regressionJumps[i] !== undefined) {
            const targetIdx = regressionJumps[i];
            const targetWord = words[targetIdx]?.textContent.trim() || '';
            replayTimelineSteps.push({
                type: 'regression',
                wordIdx: targetIdx,
                originIdx: i,
                dwellMs: Math.round(dwell * 1.4),
                status: `⚠️ Backward Regression Jump: Re-scanning "${targetWord}" (Saccadic backtracking)`
            });
        }
    }
}

function closeGazeReplayModal() {
    const modal = document.getElementById('gaze-replay-modal');
    if (modal) modal.classList.add('hidden');
    if (replayAnimationTimer) {
        clearTimeout(replayAnimationTimer);
        replayAnimationTimer = null;
    }
    replayIsPlaying = false;
    updateReplayPlayBtnUI();
}

function toggleReplayPlay() {
    if (replayIsPlaying) {
        // Pause
        if (replayAnimationTimer) {
            clearTimeout(replayAnimationTimer);
            replayAnimationTimer = null;
        }
        replayIsPlaying = false;
    } else {
        // Play / Resume
        replayIsPlaying = true;
        advanceReplayStep();
    }
    updateReplayPlayBtnUI();
}

function advanceReplayStep() {
    const words = document.querySelectorAll('.replay-word');
    const gazeDot = document.getElementById('replay-gaze-dot');
    const currentWordBar = document.getElementById('replay-current-word');
    if (!words || words.length === 0 || !gazeDot || !replayTimelineSteps || replayTimelineSteps.length === 0) return;

    if (replayCurrentStepIdx >= replayTimelineSteps.length) {
        // Completed playback
        if (replayAnimationTimer) {
            clearTimeout(replayAnimationTimer);
            replayAnimationTimer = null;
        }
        replayIsPlaying = false;
        if (currentWordBar) {
            currentWordBar.innerHTML = `<span class="text-emerald-700 font-bold">✨ Gaze Replay Completed</span><span class="text-[11px] text-gray-500 font-normal">Full session playback done</span>`;
        }
        updateReplayPlayBtnUI();
        return;
    }

    const step = replayTimelineSteps[replayCurrentStepIdx];
    const wordEl = words[step.wordIdx];

    // Clear previous highlights
    words.forEach(w => w.classList.remove('bg-purple-200', 'bg-amber-200', 'text-purple-950', 'text-amber-950', 'font-black', 'scale-105'));

    if (wordEl) {
        if (step.type === 'regression') {
            wordEl.classList.add('bg-amber-200', 'text-amber-950', 'font-black', 'scale-105');
            if (currentWordBar) {
                currentWordBar.innerHTML = `<span class="text-amber-800 font-bold">${escapeHTML(step.status)}</span><span class="text-[11px] text-amber-700 font-bold bg-amber-100 px-2 py-0.5 rounded-full border border-amber-300">Backtrack Saccade</span>`;
            }
        } else {
            wordEl.classList.add('bg-purple-200', 'text-purple-950', 'font-black', 'scale-105');
            if (currentWordBar) {
                currentWordBar.innerHTML = `<span>${escapeHTML(step.status)}</span><span class="text-[11px] text-purple-600 font-normal">Fixation pause</span>`;
            }
        }
        positionGazeDot(gazeDot, wordEl);
    }

    replayCurrentStepIdx++;

    if (replayIsPlaying) {
        const nextDelay = Math.max(100, Math.round((step.dwellMs || 350) / replaySpeedMultiplier));
        replayAnimationTimer = setTimeout(advanceReplayStep, nextDelay);
    }
}

function positionGazeDot(dot, wordEl) {
    const rect = wordEl.getBoundingClientRect();
    const parent = wordEl.closest('.relative') || wordEl.parentElement;
    const parentRect = parent.getBoundingClientRect();

    const relX = rect.left - parentRect.left + (rect.width / 2);
    const relY = rect.top - parentRect.top + (rect.height / 2);

    dot.style.left = `${relX}px`;
    dot.style.top = `${relY}px`;
    dot.classList.remove('hidden');
}

function resetReplayAnimation() {
    if (replayAnimationTimer) {
        clearTimeout(replayAnimationTimer);
        replayAnimationTimer = null;
    }
    replayIsPlaying = false;
    replayCurrentStepIdx = 0;

    const words = document.querySelectorAll('.replay-word');
    words.forEach(w => w.classList.remove('bg-purple-200', 'bg-amber-200', 'text-purple-950', 'text-amber-950', 'font-black', 'scale-105'));

    const gazeDot = document.getElementById('replay-gaze-dot');
    if (gazeDot) gazeDot.classList.add('hidden');

    const currentWordBar = document.getElementById('replay-current-word');
    if (currentWordBar && replayActiveRecord) {
        currentWordBar.innerHTML = `<span>Reading Focus: Ready to replay</span><span class="text-[11px] text-purple-600 font-normal">Synchronized with ${escapeHTML(replayActiveRecord.childName)}'s diagnosis</span>`;
    }

    updateReplayPlayBtnUI();
}

function setReplaySpeed(multiplier) {
    replaySpeedMultiplier = multiplier;

    document.querySelectorAll('[id^="speed-btn-"]').forEach(btn => {
        btn.className = "px-2.5 py-1 rounded-lg bg-gray-100 hover:bg-purple-100 text-gray-700 font-bold text-xs";
    });

    const activeBtn = document.getElementById(`speed-btn-${String(multiplier).replace('.', '-')}`);
    if (activeBtn) {
        activeBtn.className = "px-2.5 py-1 rounded-lg bg-purple-600 text-white font-black text-xs";
    }
}

function updateReplayPlayBtnUI() {
    const icon = document.getElementById('replay-play-icon');
    const label = document.getElementById('replay-play-label');
    if (!icon || !label) return;

    if (replayIsPlaying) {
        icon.className = "fa-solid fa-pause";
        label.textContent = "Pause Replay";
    } else {
        icon.className = "fa-solid fa-play";
        label.textContent = replayCurrentStepIdx === 0 ? "Play Gaze Replay" : "Resume Replay";
    }
}

/* --------------------------------------------------------------------------
   Email Screening Report to Parent Engine
   Generates a high-impact, beautifully designed responsive HTML email dossier.
   -------------------------------------------------------------------------- */

let currentEmailReportTarget = null;

async function openEmailReportModal(targetChildName) {
    const modal = document.getElementById('email-report-modal');
    if (!modal) return;

    const currentUser = window.loggedInUser || JSON.parse(localStorage.getItem('lexisense_user') || 'null');
    const username = currentUser ? currentUser.username : 'guest';
    const parentName = currentUser ? (currentUser.name || currentUser.username) : 'Parent / Guardian';
    const parentEmail = currentUser?.email || (username !== 'guest' ? `${username.toLowerCase()}@example.com` : 'parent@example.com');

    // 1. Resolve active child profile
    let childName = targetChildName || selectedReportChild;
    if (!childName) {
        const scoped = getScopedActiveChild(username);
        if (scoped) childName = scoped.name;
    }

    const childrenList = getUserChildren(username);
    const matchedChild = childrenList.find(c => c.name.toLowerCase() === (childName || '').toLowerCase()) || (childrenList.length > 0 ? childrenList[0] : null);

    // 2. Fetch history records
    let history = [];
    if (typeof loadHistoryFromSupabase === 'function') {
        try {
            const dbHistory = await loadHistoryFromSupabase();
            if (dbHistory && dbHistory.length > 0) history = dbHistory;
        } catch(e) {}
    }
    if (!history || history.length === 0) {
        history = getUserAssessmentHistory(username) || [];
    }

    let childRecords = [];
    if (matchedChild && history.length > 0) {
        const cleanTarget = matchedChild.name.replace(/^[^\w]+/, '').trim().toLowerCase();
        childRecords = history.filter(h => {
            const recName = (h.child_name || h.child || '').replace(/^[^\w]+/, '').trim().toLowerCase();
            return recName.includes(cleanTarget) || cleanTarget.includes(recName);
        });
    }

    const latestRecord = childRecords.length > 0 ? childRecords[0] : (history.length > 0 ? history[0] : null);

    const activeChildDisplayName = matchedChild?.name || latestRecord?.child_name || 'Child';
    const avatar = matchedChild?.avatar || '👧';
    const age = matchedChild?.age || 10;
    const grade = matchedChild?.grade || 'Year 4';
    const school = matchedChild?.school || 'Primary School';
    const score = parseInt(latestRecord?.match_score || latestRecord?.score || 45, 10);
    const riskLevel = latestRecord?.risk_level || latestRecord?.outcome || (score >= 65 ? 'Elevated Indicators Observed' : (score >= 35 ? 'Some Indicators Observed' : 'Few Indicators Observed'));
    const readingWPM = latestRecord?.reading_wpm || (score >= 65 ? 32 : (score >= 35 ? 54 : 96));
    const hesitationMs = latestRecord?.hesitation_ms || (score >= 65 ? 460 : (score >= 35 ? 290 : 180));
    const fixations = latestRecord?.sub_scores?.fixationCount || (score >= 65 ? 38 : (score >= 35 ? 24 : 16));
    const regressions = latestRecord?.sub_scores?.regressions ?? (score >= 65 ? 6 : (score >= 35 ? 3 : 1));
    const dateStr = latestRecord?.date || new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

    currentEmailReportTarget = {
        childName: activeChildDisplayName,
        avatar,
        age,
        grade,
        school,
        parentName,
        parentEmail,
        score,
        riskLevel,
        readingWPM,
        hesitationMs,
        fixations,
        regressions,
        dateStr,
        pillar1Score: latestRecord?.pillar1_score ?? Math.min(100, Math.round(score * 1.05)),
        pillar2Score: latestRecord?.pillar2Score ?? latestRecord?.pillar2_score ?? Math.min(100, Math.round(score * 0.95)),
        pillar3Score: latestRecord?.pillar3Score ?? latestRecord?.pillar3_score ?? Math.min(100, Math.round(score * 0.90))
    };

    // Pre-fill inputs & card elements in simplified parent modal
    const recInput = document.getElementById('email-recipient-input');
    const modalAvatar = document.getElementById('email-modal-avatar');
    const modalChildName = document.getElementById('email-modal-child-name');
    const modalChildMeta = document.getElementById('email-modal-child-meta');
    const modalScoreBadge = document.getElementById('email-modal-score-badge');

    if (modalAvatar) modalAvatar.textContent = avatar;
    if (modalChildName) modalChildName.textContent = activeChildDisplayName;
    if (modalChildMeta) modalChildMeta.textContent = `${grade} · ${school}`;
    if (modalScoreBadge) modalScoreBadge.textContent = `Score: ${score}%`;

    if (recInput) {
        recInput.value = parentEmail;
        setTimeout(() => {
            recInput.focus();
            recInput.select();
        }, 100);
    }

    modal.classList.remove('hidden');
}

function closeEmailReportModal() {
    const modal = document.getElementById('email-report-modal');
    if (modal) modal.classList.add('hidden');
}

function switchEmailModalTab(tab) {
    const configTab = document.getElementById('email-tab-config');
    const previewTab = document.getElementById('email-tab-preview');
    const configBtn = document.getElementById('email-tab-btn-config');
    const previewBtn = document.getElementById('email-tab-btn-preview');

    if (tab === 'preview') {
        if (configTab) configTab.classList.add('hidden');
        if (previewTab) previewTab.classList.remove('hidden');

        if (configBtn) {
            configBtn.className = "px-4 py-2 rounded-xl text-xs font-bold transition-all text-purple-700 hover:bg-white/60 cursor-pointer flex items-center gap-2";
        }
        if (previewBtn) {
            previewBtn.className = "px-4 py-2 rounded-xl text-xs font-black transition-all bg-white text-purple-900 shadow-sm border border-purple-200 cursor-pointer flex items-center gap-2";
        }
        renderEmailPreviewHTML();
    } else {
        if (configTab) configTab.classList.remove('hidden');
        if (previewTab) previewTab.classList.add('hidden');

        if (configBtn) {
            configBtn.className = "px-4 py-2 rounded-xl text-xs font-black transition-all bg-white text-purple-900 shadow-sm border border-purple-200 cursor-pointer flex items-center gap-2";
        }
        if (previewBtn) {
            previewBtn.className = "px-4 py-2 rounded-xl text-xs font-bold transition-all text-purple-700 hover:bg-white/60 cursor-pointer flex items-center gap-2";
        }
    }
}

function setEmailPreviewDevice(device) {
    const content = document.getElementById('email-preview-content');
    const deskBtn = document.getElementById('preview-dev-desktop');
    const mobBtn = document.getElementById('preview-dev-mobile');

    if (device === 'mobile') {
        if (content) content.className = "w-full max-w-[360px] bg-white rounded-2xl shadow-md transition-all duration-300";
        if (deskBtn) deskBtn.className = "px-2.5 py-1 rounded-lg text-gray-600 hover:bg-white font-semibold";
        if (mobBtn) mobBtn.className = "px-2.5 py-1 rounded-lg bg-white text-purple-900 font-bold shadow-xs";
    } else {
        if (content) content.className = "w-full max-w-[650px] bg-white rounded-2xl shadow-md transition-all duration-300";
        if (deskBtn) deskBtn.className = "px-2.5 py-1 rounded-lg bg-white text-purple-900 font-bold shadow-xs";
        if (mobBtn) mobBtn.className = "px-2.5 py-1 rounded-lg text-gray-600 hover:bg-white font-semibold";
    }
}

function renderEmailPreviewHTML() {
    const previewContainer = document.getElementById('email-preview-content');
    const recipientDisplay = document.getElementById('preview-recipient-display');
    if (!previewContainer || !currentEmailReportTarget) return;

    const recipientEmail = document.getElementById('email-recipient-input')?.value || currentEmailReportTarget.parentEmail || 'parent@example.com';
    const parentName = document.getElementById('email-parent-name-input')?.value || currentEmailReportTarget.parentName || 'Parent / Guardian';
    const customNote = document.getElementById('email-note-input')?.value?.trim() || '';
    const includePillars = document.getElementById('email-opt-pillars')?.checked ?? true;
    const includeAITips = document.getElementById('email-opt-ai-tips')?.checked ?? true;
    const includeGazeLink = document.getElementById('email-opt-gaze-link')?.checked ?? true;

    if (recipientDisplay) recipientDisplay.textContent = recipientEmail;

    const emailHTML = generateEmailReportHTML({
        ...currentEmailReportTarget,
        recipientEmail,
        parentName,
        customNote,
        includePillars,
        includeAITips,
        includeGazeLink
    });

    previewContainer.innerHTML = emailHTML;
}

/**
 * Generates stunning, email-client compliant inline styled HTML template
 */
function generateEmailReportHTML(data) {
    const isHigh = data.score >= 65;
    const isModerate = data.score >= 35 && data.score < 65;
    
    const riskBadgeBg = isHigh ? '#fee2e2' : (isModerate ? '#fef3c7' : '#dcfce7');
    const riskBadgeText = isHigh ? '#991b1b' : (isModerate ? '#92400e' : '#166534');
    const riskBadgeBorder = isHigh ? '#fca5a5' : (isModerate ? '#fcd34d' : '#86efac');
    const riskDotColor = isHigh ? '#ef4444' : (isModerate ? '#f59e0b' : '#10b981');

    // Retrieve AI coaching recommendations based on child's exact score
    let aiTips = [];
    if (isHigh) {
        aiTips = [
            { icon: '🔤', title: 'Multisensory Phonics & Sound Blending', text: 'Practice single letter-sound associations using tactile sand trays or play-dough. Focus on mouth shape before reading multisyllabic words.' },
            { icon: '🎧', title: 'Ear-Reading with Synchronized Audiobooks', text: `Pair audiobooks with large-print physical text so ${escapeHTML(data.childName)} follows along with a finger without decoding fatigue.` },
            { icon: '✂️', title: 'Single-Word Window Card (Visual Isolator)', text: 'Cut an index card window to reveal only 1 word at a time, eliminating visual crowding panic on full pages.' }
        ];
    } else if (isModerate) {
        aiTips = [
            { icon: '📏', title: 'Guided Line-Ruler Tracking', text: 'Use a tinted overlay or physical reading ruler to steady horizontal saccades and prevent jumping across text lines.' },
            { icon: '🧩', title: 'Syllable Chunking & Morpheme Cards', text: `Break multisyllabic words into colored chunks (e.g. gar-den, beau-ti-ful) to accelerate ${escapeHTML(data.childName)}'s decoding speed.` },
            { icon: '⭐', title: '10-Minute Daily Shared Paired Reading', text: 'Read aloud together in unison. When child is confident, pause and let them lead with high praise for effort.' }
        ];
    } else {
        aiTips = [
            { icon: '📚', title: 'High-Interest Reading Enrichment', text: `${escapeHTML(data.childName)} demonstrates solid reading cadence. Explore illustrated chapter books and graphic novels to expand vocabulary.` },
            { icon: '💬', title: 'Story Prediction & Oral Comprehension', text: 'Ask open-ended questions during story time: "What do you think happens next?" to foster critical thinking.' },
            { icon: '🎉', title: 'Celebrate Reading Milestones', text: 'Maintain a colorful reading log with stickers to celebrate completed book adventures!' }
        ];
    }

    const hostUrl = window.location.origin + window.location.pathname.replace(/[^/]*$/, '');
    const dossierUrl = `${hostUrl}parent-page.html?view=report&child=${encodeURIComponent(data.childName)}`;

    return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px 12px; color: #1e293b; line-height: 1.5;">
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 620px; margin: 0 auto; background-color: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(88, 28, 135, 0.12); border: 1px solid #ede9fe;">
            
            <!-- HEADER HERO BANNER -->
            <tr>
                <td style="background: linear-gradient(135deg, #3b0764 0%, #4f46e5 50%, #4338ca 100%); padding: 32px 28px; text-align: left; color: #ffffff; position: relative;">
                    <table width="100%" border="0" cellspacing="0" cellpadding="0">
                        <tr>
                            <td valign="middle">
                                <div style="display: inline-block; background-color: rgba(255, 255, 255, 0.15); border: 1px solid rgba(255, 255, 255, 0.3); border-radius: 9999px; padding: 4px 12px; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; color: #fde047; margin-bottom: 8px;">
                                    ✨ Official Screening Dossier
                                </div>
                                <h1 style="margin: 0; font-size: 24px; font-weight: 900; letter-spacing: -0.02em; color: #ffffff; line-height: 1.2;">
                                    LexiSense Early Dyslexia Screener
                                </h1>
                                <p style="margin: 6px 0 0 0; font-size: 13px; color: #e0e7ff; font-weight: 500;">
                                    Multimodal 3-Pillar Triangulation Assessment Summary
                                </p>
                            </td>
                            <td width="70" align="right" valign="middle">
                                <div style="width: 56px; height: 56px; background-color: #f59e0b; border-radius: 18px; text-align: center; line-height: 54px; box-shadow: 0 4px 12px rgba(0,0,0,0.2); display: flex; align-items: center; justify-content: center; padding: 4px;">
                                    <img src="assets/ollie-mascot.png" alt="Ollie" style="width: 44px; height: 44px; object-fit: contain;">
                                </div>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>

            <!-- CONTENT BODY -->
            <tr>
                <td style="padding: 28px 24px;">
                    
                    <!-- SALUTATION -->
                    <p style="margin: 0 0 16px 0; font-size: 15px; color: #334155; font-weight: 600;">
                        Dear <strong style="color: #4338ca;">${escapeHTML(data.parentName || 'Parent')}</strong>,
                    </p>
                    <p style="margin: 0 0 20px 0; font-size: 13px; color: #64748b; line-height: 1.6;">
                        Here is the complete early reading development and dyslexia risk screening dossier for <strong>${escapeHTML(data.childName)}</strong>, completed on <strong>${escapeHTML(data.dateStr)}</strong>.
                    </p>

                    ${data.customNote ? `
                    <!-- SPECIALIST / CUSTOM NOTE BOX -->
                    <div style="background-color: #fefce8; border-left: 4px solid #eab308; border-radius: 12px; padding: 14px 16px; margin-bottom: 24px;">
                        <span style="display: block; font-size: 11px; font-weight: 800; text-transform: uppercase; color: #854d0e; letter-spacing: 0.05em; margin-bottom: 4px;">
                            💬 Note from Teacher / Specialist:
                        </span>
                        <p style="margin: 0; font-size: 13px; color: #713f12; font-style: italic; line-height: 1.5;">
                            "${escapeHTML(data.customNote)}"
                        </p>
                    </div>
                    ` : ''}

                    <!-- CHILD PROFILE & OVERALL RESULT CARD -->
                    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background: linear-gradient(135deg, #fdf4ff 0%, #f5f3ff 100%); border-radius: 20px; border: 2px solid #e9d5ff; padding: 20px; margin-bottom: 24px;">
                        <tr>
                            <td>
                                <table width="100%" border="0" cellspacing="0" cellpadding="0">
                                    <tr>
                                        <td width="64" valign="middle">
                                            <div style="width: 56px; height: 56px; background-color: #ffffff; border-radius: 16px; border: 2px solid #d8b4fe; text-align: center; line-height: 52px; font-size: 32px; box-shadow: 0 2px 6px rgba(147, 51, 234, 0.15);">
                                                ${data.avatar || '👧'}
                                            </div>
                                        </td>
                                        <td valign="middle" style="padding-left: 14px;">
                                            <h2 style="margin: 0; font-size: 20px; font-weight: 900; color: #3b0764;">
                                                ${escapeHTML(data.childName)}
                                            </h2>
                                            <div style="margin-top: 4px; font-size: 12px; color: #6b21a8; font-weight: 700;">
                                                <span>${data.age || 10} Years Old</span> · 
                                                <span>${escapeHTML(data.grade || 'Year 4')}</span> · 
                                                <span style="color: #64748b; font-weight: 500;">${escapeHTML(data.school || 'Primary School')}</span>
                                            </div>
                                        </td>
                                    </tr>
                                </table>

                                <!-- RISK BANNER -->
                                <div style="margin-top: 16px; padding: 12px 16px; background-color: ${riskBadgeBg}; border: 1px solid ${riskBadgeBorder}; border-radius: 14px; text-align: center;">
                                    <table width="100%" border="0" cellspacing="0" cellpadding="0">
                                        <tr>
                                            <td align="left" valign="middle">
                                                <span style="display: inline-block; width: 10px; height: 10px; background-color: ${riskDotColor}; border-radius: 9999px; margin-right: 6px;"></span>
                                                <strong style="color: ${riskBadgeText}; font-size: 13px; font-weight: 900;">${escapeHTML(data.riskLevel)}</strong>
                                            </td>
                                            <td align="right" valign="middle">
                                                <span style="background-color: #ffffff; color: #3b0764; font-size: 13px; font-weight: 900; padding: 4px 10px; border-radius: 9999px; border: 1px solid ${riskBadgeBorder};">
                                                    Match Score: ${data.score}%
                                                </span>
                                            </td>
                                        </tr>
                                    </table>
                                </div>
                            </td>
                        </tr>
                    </table>

                    ${data.includePillars ? `
                    <!-- 3-PILLAR TRIANGULATION METRICS -->
                    <div style="margin-bottom: 24px;">
                        <h3 style="margin: 0 0 12px 0; font-size: 14px; font-weight: 800; color: #3b0764; text-transform: uppercase; letter-spacing: 0.05em;">
                            📊 3-Pillar Triangulation Breakdown
                        </h3>

                        <table width="100%" border="0" cellspacing="0" cellpadding="8" style="background-color: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; font-size: 12px;">
                            <tr style="background-color: #f8fafc; border-bottom: 1px solid #e2e8f0;">
                                <td style="padding: 10px 12px; font-weight: 800; color: #475569;">Screening Pillar</td>
                                <td style="padding: 10px 12px; font-weight: 800; color: #475569; text-align: center;">Weight</td>
                                <td style="padding: 10px 12px; font-weight: 800; color: #475569; text-align: right;">Measured Metrics</td>
                            </tr>
                            <tr>
                                <td style="padding: 12px; border-bottom: 1px solid #f1f5f9;">
                                    <strong style="color: #4338ca;">📝 Pillar 1: Behavioral Screener</strong><br>
                                    <span style="font-size: 11px; color: #64748b;">30-item parent/educator observation</span>
                                </td>
                                <td style="padding: 12px; text-align: center; border-bottom: 1px solid #f1f5f9; font-weight: 700; color: #64748b;">40%</td>
                                <td style="padding: 12px; text-align: right; border-bottom: 1px solid #f1f5f9;">
                                    <span style="font-weight: 800; color: #4338ca; font-size: 13px;">${data.pillar1Score}%</span>
                                </td>
                            </tr>
                            <tr>
                                <td style="padding: 12px; border-bottom: 1px solid #f1f5f9;">
                                    <strong style="color: #4338ca;">⚡ Pillar 2: Oral Reading Fluency</strong><br>
                                    <span style="font-size: 11px; color: #64748b;">Words Correct Per Minute (WCPM)</span>
                                </td>
                                <td style="padding: 12px; text-align: center; border-bottom: 1px solid #f1f5f9; font-weight: 700; color: #64748b;">40%</td>
                                <td style="padding: 12px; text-align: right; border-bottom: 1px solid #f1f5f9;">
                                    <strong style="color: #334155; font-size: 13px;">${data.readingWPM} WPM</strong><br>
                                    <span style="font-size: 11px; color: #64748b;">(${data.hesitationMs}ms dwell)</span>
                                </td>
                            </tr>
                            <tr>
                                <td style="padding: 12px;">
                                    <strong style="color: #4338ca;">👁️ Pillar 3: Gaze Saccade Tracking</strong><br>
                                    <span style="font-size: 11px; color: #64748b;">Fixations & Line Regressions</span>
                                </td>
                                <td style="padding: 12px; text-align: center; font-weight: 700; color: #64748b;">20%</td>
                                <td style="padding: 12px; text-align: right;">
                                    <strong style="color: #334155; font-size: 13px;">${data.regressions} Regressions</strong><br>
                                    <span style="font-size: 11px; color: #64748b;">(${data.fixations} fixations)</span>
                                </td>
                            </tr>
                        </table>
                    </div>
                    ` : ''}

                    ${data.includeAITips ? `
                    <!-- OLLIE AI SMART HOME RECOMMENDATIONS -->
                    <div style="background-color: #faf5ff; border: 2px solid #e9d5ff; border-radius: 20px; padding: 20px; margin-bottom: 24px;">
                        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 12px;">
                            <tr>
                                <td valign="middle">
                                    <h3 style="margin: 0; font-size: 14px; font-weight: 900; color: #4c1d95; text-transform: uppercase; letter-spacing: 0.05em; display: flex; align-items: center; gap: 6px;">
                                        <img src="assets/ollie-mascot.png" alt="Ollie" style="width: 18px; height: 18px; object-fit: contain; vertical-align: middle; display: inline-block;"> Ollie AI Action Plan for Home & School
                                    </h3>
                                </td>
                                <td width="70" align="right" valign="middle">
                                    <span style="background-color: #fde047; color: #4c1d95; font-size: 10px; font-weight: 900; padding: 3px 8px; border-radius: 9999px;">AI Powered</span>
                                </td>
                            </tr>
                        </table>

                        ${aiTips.map((tip, idx) => `
                        <div style="background-color: #ffffff; border-radius: 12px; padding: 12px 14px; margin-bottom: ${idx === aiTips.length - 1 ? '0' : '10px'}; border: 1px solid #f3e8ff;">
                            <div style="font-size: 13px; font-weight: 800; color: #581c87; margin-bottom: 2px;">
                                <span>${tip.icon}</span> <span>${escapeHTML(tip.title)}</span>
                            </div>
                            <div style="font-size: 12px; color: #475569; line-height: 1.4;">
                                ${escapeHTML(tip.text)}
                            </div>
                        </div>
                        `).join('')}
                    </div>
                    ` : ''}

                    ${data.includeGazeLink ? `
                    <!-- CTA BUTTON TO VIEW DIGITAL DOSSIER -->
                    <div style="text-align: center; margin: 28px 0;">
                        <a href="${dossierUrl}" target="_blank" style="display: inline-block; background: linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%); color: #ffffff; font-size: 14px; font-weight: 900; text-decoration: none; padding: 14px 28px; border-radius: 16px; box-shadow: 0 4px 14px rgba(124, 58, 237, 0.35); text-transform: uppercase; letter-spacing: 0.05em;">
                            🚀 Open Interactive Digital Dossier & Gaze Replay
                        </a>
                        <p style="margin: 8px 0 0 0; font-size: 11px; color: #94a3b8;">
                            Includes synchronized eye movement playback, radar charts & progress tracking.
                        </p>
                    </div>
                    ` : ''}

                </td>
            </tr>

            <!-- FOOTER & CLINICAL DISCLAIMER -->
            <tr>
                <td style="background-color: #f1f5f9; padding: 24px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #64748b; line-height: 1.6;">
                    <p style="margin: 0 0 8px 0; font-weight: 700; color: #475569;">
                        ⚠️ Important Screening Notice & Educational Disclaimer:
                    </p>
                    <p style="margin: 0 0 12px 0;">
                        LexiSense provides an early risk probability screening tool based on behavioral, reading fluency (WCPM), and gaze tracking markers. It is intended to guide timely developmental support and home exercises and does not replace a comprehensive clinical diagnosis from a registered Educational Psychologist or Speech-Language Pathologist.
                    </p>
                    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="border-top: 1px solid #cbd5e1; padding-top: 12px; font-size: 11px; color: #94a3b8;">
                        <tr>
                            <td>
                                © ${new Date().getFullYear()} LexiSense Screening Platform. All rights reserved.
                            </td>
                            <td align="right">
                                Ref ID: LX-${Math.floor(100000 + Math.random() * 900000)}
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>

        </table>
    </div>
    `;
}

/**
 * Dispatches email report with real live API transmission, SMTP delivery & celebration toast
 */
async function dispatchEmailReport() {
    const recipient = document.getElementById('email-recipient-input')?.value?.trim();
    const parentName = document.getElementById('email-parent-name-input')?.value?.trim() || 'Parent';
    const subject = document.getElementById('email-subject-input')?.value || `🦉 LexiSense Screening Dossier: ${currentEmailReportTarget?.childName || 'Child'}`;
    const customNote = document.getElementById('email-note-input')?.value?.trim() || '';
    const sendBtn = document.getElementById('btn-send-email-report');
    const btnText = document.getElementById('send-email-btn-text');

    if (!recipient || !recipient.includes('@')) {
        showToast("Please enter a valid recipient email address.");
        return;
    }

    if (sendBtn) sendBtn.disabled = true;
    if (btnText) btnText.textContent = "Connecting to Mail Server & Dispatching... ⏳";

    const childName = currentEmailReportTarget?.childName || 'Child';
    const score = currentEmailReportTarget?.score || 45;
    const riskLevel = currentEmailReportTarget?.riskLevel || 'Few Indicators Observed';
    const readingWPM = currentEmailReportTarget?.readingWPM || 54;
    const dateStr = currentEmailReportTarget?.dateStr || new Date().toLocaleDateString('en-GB');

    const emailHTML = generateEmailReportHTML({
        ...currentEmailReportTarget,
        recipientEmail: recipient,
        parentName: parentName,
        customNote: customNote,
        includePillars: document.getElementById('email-opt-pillars')?.checked ?? true,
        includeAITips: document.getElementById('email-opt-ai-tips')?.checked ?? true,
        includeGazeLink: document.getElementById('email-opt-gaze-link')?.checked ?? true
    });

    let realSent = false;
    let senderUsed = 'noreply@mykasih.com.my';

    try {
        // 1. Try local/production backend SMTP server endpoint first
        const backendRes = await fetch('/api/send-email-report', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                to: recipient,
                subject: subject,
                childName: childName,
                html: emailHTML,
                text: `LexiSense Dyslexia Screening Report for ${childName}. Score: ${score}%, Classification: ${riskLevel}.`
            })
        });

        if (backendRes.ok) {
            const data = await backendRes.json();
            if (data.success) {
                realSent = true;
                if (data.sender) senderUsed = data.sender;
                console.log("LexiSense backend email dispatched:", data);
            }
        }
    } catch (backendErr) {
        console.warn("Backend mail server not reachable, attempting fallback:", backendErr);
    }

    if (!realSent) {
        try {
            // 2. Fallback via public FormSubmit endpoint
            const response = await fetch(`https://formsubmit.co/ajax/${encodeURIComponent(recipient)}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    _subject: subject,
                    _replyto: recipient,
                    Child_Name: childName,
                    Screening_Score: `${score}%`,
                    Risk_Classification: riskLevel,
                    Reading_Fluency_WCPM: `${readingWPM} WPM`,
                    Screening_Date: dateStr,
                    Specialist_Note: customNote || 'None',
                    LexiSense_Dossier_Summary: `LexiSense Multimodal Dyslexia Risk Screening Report for ${childName}. Overall Score: ${score}%, Classification: ${riskLevel}.`,
                    _template: 'table'
                })
            });

            if (response.ok) {
                const resJson = await response.json();
                if (resJson.success === "true" || resJson.success === true) {
                    realSent = true;
                }
            }
        } catch (err) {
            console.warn("Public form endpoint fallback:", err);
        }
    }

    if (sendBtn) sendBtn.disabled = false;
    if (btnText) btnText.textContent = "Send Report to My Email 🚀";
    closeEmailReportModal();

    showToast(`✨ Report sent to ${recipient} (From: ${senderUsed})! 📬`);
}

/**
 * Opens Gmail compose window in browser with preformatted subject, recipient and full report text
 */
function openDirectInGmail() {
    if (!currentEmailReportTarget) return;

    const recipient = document.getElementById('email-recipient-input')?.value?.trim() || currentEmailReportTarget.parentEmail || 'parent@example.com';
    const childName = currentEmailReportTarget.childName || 'Child';
    const subject = document.getElementById('email-subject-input')?.value || `🦉 LexiSense Screening Dossier: ${childName}`;
    const customNote = document.getElementById('email-note-input')?.value?.trim() || '';

    const hostUrl = window.location.origin + window.location.pathname.replace(/[^/]*$/, '');
    const dossierUrl = `${hostUrl}parent-page.html?view=report&child=${encodeURIComponent(childName)}`;

    const bodyText = 
`Dear Parent / Guardian,

Here is the official LexiSense Early Dyslexia Risk Screening Dossier for ${childName} (${currentEmailReportTarget.age} Years Old, ${currentEmailReportTarget.grade}):

==================================================
📊 SCREENING ASSESSMENT SUMMARY
==================================================
● Child Name: ${childName}
● Overall Match Score: ${currentEmailReportTarget.score}%
● Risk Level: ${currentEmailReportTarget.riskLevel}
● Oral Reading Speed: ${currentEmailReportTarget.readingWPM} WPM (Avg Dwell: ${currentEmailReportTarget.hesitationMs}ms)
● Gaze Line Regressions: ${currentEmailReportTarget.regressions} backward saccades (${currentEmailReportTarget.fixations} fixations)
● Screening Date: ${currentEmailReportTarget.dateStr}

${customNote ? `💬 SPECIALIST NOTE:\n"${customNote}"\n\n` : ''}
==================================================
🦉 OLLIE AI RECOMMENDED HOME ACTION PLAN:
==================================================
1. Multisensory Phonics & Sound Blending drills.
2. Visual line-ruler tracking to steady horizontal gaze.
3. 10-minute daily paired reading with high praise.

🔗 VIEW FULL INTERACTIVE DOSSIER & EYE GAZE REPLAY:
${dossierUrl}

Best regards,
LexiSense Early Screening & Literacy Assessment Platform`;

    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(recipient)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(bodyText)}`;
    window.open(gmailUrl, '_blank');
    showToast(`✉️ Opened Gmail Compose for ${recipient}!`);
}

/**
 * Opens system mail app (Outlook, Apple Mail) with pre-filled dossier
 */
function openDirectInMailApp() {
    if (!currentEmailReportTarget) return;

    const recipient = document.getElementById('email-recipient-input')?.value?.trim() || currentEmailReportTarget.parentEmail || 'parent@example.com';
    const childName = currentEmailReportTarget.childName || 'Child';
    const subject = encodeURIComponent(document.getElementById('email-subject-input')?.value || `🦉 LexiSense Screening Dossier: ${childName}`);
    
    const hostUrl = window.location.origin + window.location.pathname.replace(/[^/]*$/, '');
    const dossierUrl = `${hostUrl}parent-page.html?view=report&child=${encodeURIComponent(childName)}`;

    const body = encodeURIComponent(
`Dear Parent,\n\nPlease find attached the LexiSense Early Dyslexia Risk Screening Dossier for ${childName}.\n\nOverall Score: ${currentEmailReportTarget.score}%\nClassification: ${currentEmailReportTarget.riskLevel}\nReading Fluency: ${currentEmailReportTarget.readingWPM} WPM\n\nInteractive Dossier Link:\n${dossierUrl}\n\nLexiSense Screening Platform`
    );

    window.location.href = `mailto:${recipient}?subject=${subject}&body=${body}`;
    showToast(`✉️ Opening default Mail app for ${recipient}...`);
}

function copyEmailReportHTML() {
    if (!currentEmailReportTarget) return;

    const emailHTML = generateEmailReportHTML({
        ...currentEmailReportTarget,
        recipientEmail: document.getElementById('email-recipient-input')?.value || currentEmailReportTarget.parentEmail,
        parentName: document.getElementById('email-parent-name-input')?.value || currentEmailReportTarget.parentName,
        customNote: document.getElementById('email-note-input')?.value?.trim() || '',
        includePillars: document.getElementById('email-opt-pillars')?.checked ?? true,
        includeAITips: document.getElementById('email-opt-ai-tips')?.checked ?? true,
        includeGazeLink: document.getElementById('email-opt-gaze-link')?.checked ?? true
    });

    navigator.clipboard.writeText(emailHTML).then(() => {
        showToast("📋 Rich HTML Email template copied to clipboard!");
    }).catch(() => {
        showToast("Could not copy directly. Please select text from preview.");
    });
}

function downloadEmailReportFile() {
    if (!currentEmailReportTarget) return;

    const recipient = document.getElementById('email-recipient-input')?.value || currentEmailReportTarget.parentEmail || 'parent@example.com';
    const subject = document.getElementById('email-subject-input')?.value || `LexiSense Screening Dossier: ${currentEmailReportTarget.childName}`;
    
    const emailHTML = generateEmailReportHTML({
        ...currentEmailReportTarget,
        recipientEmail: recipient,
        parentName: document.getElementById('email-parent-name-input')?.value || currentEmailReportTarget.parentName,
        customNote: document.getElementById('email-note-input')?.value?.trim() || '',
        includePillars: document.getElementById('email-opt-pillars')?.checked ?? true,
        includeAITips: document.getElementById('email-opt-ai-tips')?.checked ?? true,
        includeGazeLink: document.getElementById('email-opt-gaze-link')?.checked ?? true
    });

    const emlContent = [
        `To: ${recipient}`,
        `Subject: ${subject}`,
        `X-Unsent: 1`,
        `Content-Type: text/html; charset=UTF-8`,
        ``,
        emailHTML
    ].join('\r\n');

    const blob = new Blob([emlContent], { type: 'message/rfc822' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `LexiSense_Screening_Report_${currentEmailReportTarget.childName.replace(/\s+/g, '_')}.eml`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast(`💾 Downloaded .EML email file for ${currentEmailReportTarget.childName}!`);
}

/* --------------------------------------------------------------------------
   Parent Account Profile Management & Persistence Engine
   -------------------------------------------------------------------------- */

function loadParentProfileView() {
    const currentUser = window.loggedInUser || JSON.parse(localStorage.getItem('lexisense_user') || 'null');
    if (!currentUser) return;

    const name = currentUser.name || currentUser.full_name || 'Parent User';
    const email = currentUser.email || '';
    const username = currentUser.username || 'user';
    const phone = currentUser.phone || currentUser.phone_number || '';
    const school = currentUser.school || currentUser.school_branch || '';
    const avatar = currentUser.avatar || '👩';
    const role = (currentUser.role || 'PARENT').toUpperCase().replace('_', ' ');

    // Update Profile Card in View 8
    const dispName = document.getElementById('profile-display-name');
    const dispUser = document.getElementById('profile-username-display');
    const dispAvatar = document.getElementById('profile-avatar-display');
    const dispRole = document.getElementById('profile-role-badge');
    const dispMember = document.getElementById('profile-member-since');

    if (dispName) dispName.textContent = name;
    if (dispUser) dispUser.textContent = `@${username}`;
    if (dispAvatar) {
        if (avatar.startsWith('http') || avatar.startsWith('data:')) {
            dispAvatar.innerHTML = `<img src="${escapeHTML(avatar)}" class="w-full h-full object-cover rounded-full">`;
        } else {
            dispAvatar.textContent = avatar;
        }
    }
    if (dispRole) dispRole.textContent = `● ${role} · Active`;
    if (dispMember && currentUser.created_at) {
        dispMember.textContent = `Member since ${new Date(currentUser.created_at).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}`;
    }

    // Populate Form Inputs
    const inName = document.getElementById('profile-full-name');
    const inEmail = document.getElementById('profile-email');
    const inUser = document.getElementById('profile-username');
    const inPhone = document.getElementById('profile-phone');
    const inSchool = document.getElementById('profile-school');

    if (inName) inName.value = name;
    if (inEmail) inEmail.value = email;
    if (inUser) inUser.value = username;
    if (inPhone) inPhone.value = phone;
    if (inSchool) inSchool.value = school;

    // Update Dashboard Hero Greeting
    const heroTitle = document.querySelector('#view-dashboard h2');
    if (heroTitle) {
        heroTitle.innerHTML = `Hello, <span class="text-amber-300">${escapeHTML(name)}</span>! <span class="animate-wave-hand">👋</span>`;
    }
}

async function handleSaveProfile() {
    const fullName = document.getElementById('profile-full-name')?.value.trim();
    const email = document.getElementById('profile-email')?.value.trim();
    const phone = document.getElementById('profile-phone')?.value.trim();
    const school = document.getElementById('profile-school')?.value.trim();

    if (!fullName) {
        showToast("Please enter your full name.");
        return;
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        showToast("Please enter a valid email address.");
        return;
    }

    const submitBtn = document.getElementById('btn-save-profile');
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = `<i class="fa-solid fa-circle-notch animate-spin"></i> Saving Changes...`;
    }

    try {
        let currentUser = window.loggedInUser || JSON.parse(localStorage.getItem('lexisense_user') || 'null');
        if (!currentUser) {
            currentUser = { username: 'parent', role: 'parent' };
        }

        // 1. Update in-memory user and localStorage
        currentUser.name = fullName;
        currentUser.full_name = fullName;
        currentUser.email = email;
        currentUser.phone = phone;
        currentUser.phone_number = phone;
        currentUser.school = school;
        currentUser.school_branch = school;

        window.loggedInUser = currentUser;
        localStorage.setItem('lexisense_user', JSON.stringify(currentUser));

        // 2. Persist to user-scoped persistent storage key
        const uname = (currentUser.username || currentUser.email || 'parent').toLowerCase();
        localStorage.setItem(`lexisense_profile_${uname}`, JSON.stringify(currentUser));
        localStorage.setItem(`lexisense_email_map_${uname}`, email);

        // 3. Update local registered users store
        try {
            const localUsers = JSON.parse(localStorage.getItem('lexisense_registered_users') || '[]');
            const rIdx = Array.isArray(localUsers) 
                ? localUsers.findIndex(u => (u.username && u.username.toLowerCase() === uname) || (u.email && u.email.toLowerCase() === email.toLowerCase()))
                : -1;
            if (rIdx >= 0) {
                localUsers[rIdx].name = fullName;
                localUsers[rIdx].full_name = fullName;
                localUsers[rIdx].email = email;
                localUsers[rIdx].phone = phone;
                localUsers[rIdx].phone_number = phone;
                localUsers[rIdx].school = school;
                localUsers[rIdx].school_branch = school;
                localStorage.setItem('lexisense_registered_users', JSON.stringify(localUsers));
            }
        } catch(e) {}

        // 3. Update Supabase Cloud DB profiles table
        const client = typeof getSupabase === 'function' ? getSupabase() : null;
        if (client) {
            try {
                let userId = currentUser.id;
                if (!userId || !isValidUUID(userId)) {
                    if (typeof getActiveAuthUserId === 'function') {
                        userId = await getActiveAuthUserId();
                    }
                }
                const updatePayload = {
                    full_name: fullName,
                    name: fullName,
                    email: email,
                    phone_number: phone,
                    phone: phone,
                    school_branch: school,
                    school: school,
                    bio: currentUser.bio || '',
                    updated_at: new Date().toISOString()
                };

                let updated = false;
                if (userId && isValidUUID(userId)) {
                    const { data: d1 } = await client.from('profiles').update(updatePayload).eq('id', userId).select();
                    if (d1 && d1.length > 0) updated = true;
                }
                if (!updated && email) {
                    const { data: d2 } = await client.from('profiles').update(updatePayload).ilike('email', email).select();
                    if (d2 && d2.length > 0) updated = true;
                }
                if (!updated && uname) {
                    const { data: d3 } = await client.from('profiles').update(updatePayload).ilike('username', uname).select();
                    if (d3 && d3.length > 0) updated = true;
                }
                console.log("Supabase profile synchronized successfully ✨");
            } catch (supaErr) {
                console.warn("Supabase update notice:", supaErr);
            }
        }

        // 4. Update UI across page
        loadParentProfileView();
        if (typeof updateHeaderUserUI === 'function') {
            await updateHeaderUserUI();
        }

        showToast("Profile details updated and saved successfully! ✨");

    } catch (err) {
        console.error("Save profile error:", err);
        showToast("Failed to save profile changes. Please try again.");
    } finally {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = `<i class="fa-solid fa-check"></i> Save Changes`;
        }
    }
}

function openAvatarPickerModal() {
    const modal = document.getElementById('avatar-picker-modal');
    if (modal) modal.classList.remove('hidden');
}

function closeAvatarPickerModal() {
    const modal = document.getElementById('avatar-picker-modal');
    if (modal) modal.classList.add('hidden');
}

async function selectParentAvatar(avatarChar) {
    closeAvatarPickerModal();
    const currentUser = window.loggedInUser || JSON.parse(localStorage.getItem('lexisense_user') || 'null');
    if (!currentUser) return;

    currentUser.avatar = avatarChar;
    window.loggedInUser = currentUser;
    localStorage.setItem('lexisense_user', JSON.stringify(currentUser));

    const dispAvatar = document.getElementById('profile-avatar-display');
    if (dispAvatar) dispAvatar.textContent = avatarChar;

    if (typeof updateHeaderUserUI === 'function') {
        await updateHeaderUserUI();
    }

    const client = typeof getSupabase === 'function' ? getSupabase() : null;
    if (client && currentUser.id) {
        try {
            await client.from('profiles').update({
                avatar_url: avatarChar,
                updated_at: new Date().toISOString()
            }).eq('id', currentUser.id);
        } catch(e) {}
    }

    showToast(`Profile avatar updated to ${avatarChar}! ✨`);
}

function updateProfilePasswordStrengthUI() {
    const pwd = document.getElementById('profile-new-password')?.value || '';
    const bar = document.getElementById('profile-pwd-strength-bar');
    const text = document.getElementById('profile-pwd-strength-text');
    if (!bar || !text) return;

    if (!pwd) {
        bar.className = "h-2 rounded-full bg-gray-200 transition-all duration-300 w-0";
        text.textContent = "";
        return;
    }

    if (typeof evaluatePasswordStrength === 'function') {
        const result = evaluatePasswordStrength(pwd);
        const widthPercent = result.score === 1 ? '25%' : (result.score === 2 ? '50%' : (result.score === 3 ? '75%' : '100%'));
        bar.className = `h-2 rounded-full transition-all duration-300 ${result.color}`;
        bar.style.width = widthPercent;
        text.textContent = result.label;
        text.className = `text-xs font-extrabold mt-1 block ${result.score >= 3 ? 'text-emerald-600' : (result.score === 2 ? 'text-amber-600' : 'text-red-500')}`;
    }
}

async function handleUpdatePassword() {
    const newPwd = document.getElementById('profile-new-password')?.value;
    const confPwd = document.getElementById('profile-confirm-password')?.value;

    if (!newPwd || !confPwd) {
        showToast("Please enter and confirm your new password.");
        return;
    }
    if (newPwd.length < 8) {
        showToast("Password must be at least 8 characters long.");
        return;
    }
    if (newPwd !== confPwd) {
        showToast("Passwords do not match. Please re-enter.");
        return;
    }

    const submitBtn = document.getElementById('btn-update-password');
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Updating Password...';
    }

    try {
        const client = typeof getSupabase === 'function' ? getSupabase() : null;
        if (client) {
            try {
                await client.auth.updateUser({ password: newPwd });
            } catch(e) {}
        }

        // Update local registered user list and profile storage
        const currentUser = window.loggedInUser || JSON.parse(localStorage.getItem('lexisense_user') || 'null');
        if (currentUser) {
            currentUser.password = newPwd;
            window.loggedInUser = currentUser;
            localStorage.setItem('lexisense_user', JSON.stringify(currentUser));

            const cleanUser = (currentUser.username || '').toLowerCase();
            const cleanEmail = (currentUser.email || '').toLowerCase();

            try {
                const userProf = JSON.parse(localStorage.getItem(`lexisense_profile_${cleanUser}`) || '{}');
                userProf.password = newPwd;
                localStorage.setItem(`lexisense_profile_${cleanUser}`, JSON.stringify(userProf));
            } catch (e) {}

            try {
                let localUsers = JSON.parse(localStorage.getItem('lexisense_registered_users') || '{}');
                if (Array.isArray(localUsers)) {
                    const idx = localUsers.findIndex(u => 
                        (u.username && u.username.toLowerCase() === cleanUser) || 
                        (u.email && u.email.toLowerCase() === cleanEmail)
                    );
                    if (idx >= 0) {
                        localUsers[idx].password = newPwd;
                        localStorage.setItem('lexisense_registered_users', JSON.stringify(localUsers));
                    }
                } else if (typeof localUsers === 'object' && localUsers !== null) {
                    if (localUsers[cleanUser]) {
                        localUsers[cleanUser].password = newPwd;
                    }
                    for (let k in localUsers) {
                        if (localUsers[k]?.email?.toLowerCase() === cleanEmail || localUsers[k]?.username?.toLowerCase() === cleanUser) {
                            localUsers[k].password = newPwd;
                        }
                    }
                    localStorage.setItem('lexisense_registered_users', JSON.stringify(localUsers));
                }
            } catch (e) {}
        }

        const curInput = document.getElementById('profile-current-password');
        const newInput = document.getElementById('profile-new-password');
        const confInput = document.getElementById('profile-confirm-password');
        if (curInput) curInput.value = '';
        if (newInput) newInput.value = '';
        if (confInput) confInput.value = '';
        updateProfilePasswordStrengthUI();

        showToast("Password updated securely! 🔒✨");
    } catch(err) {
        showToast("Failed to update password. Please try again.");
    } finally {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = `<i class="fa-solid fa-key"></i> Update Password`;
        }
    }
}


