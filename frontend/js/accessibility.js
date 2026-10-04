/**
 * LexiSense - Accessibility Controls Module
 * Controls dyslexia fonts, font sizing, contrast modes, reading ruler, and tint filters.
 */

let fontSizeOffset = 0;
let fontSizePercent = 100;
let isRulerActive = false;

function openAccessibilityModal() {
    const modal = document.getElementById('accessibility-modal');
    if (modal) modal.classList.remove('hidden');
}

function closeAccessibilityModal() {
    const modal = document.getElementById('accessibility-modal');
    if (modal) modal.classList.add('hidden');
}

function toggleDyslexiaFont() {
    document.body.classList.toggle('dyslexia-font');
    const isDyslexic = document.body.classList.contains('dyslexia-font');
    
    const btnModal = document.getElementById('btn-font-toggle');
    if (btnModal) {
        btnModal.textContent = isDyslexic ? 'ON' : 'OFF';
        btnModal.className = isDyslexic 
            ? 'bg-purple-600 text-white px-4 py-2 rounded-full font-bold transition-all text-sm shadow-sm'
            : 'bg-gray-300 text-gray-700 px-4 py-2 rounded-full font-bold transition-all text-sm';
    }

    if (typeof showToast === 'function') {
        showToast(isDyslexic ? 'Dyslexia-friendly typography enabled 🔤' : 'Standard typography restored', '', 'info');
    }
}

function toggleHighContrast() {
    document.body.classList.toggle('high-contrast');
    const isContrast = document.body.classList.contains('high-contrast');

    const btnModal = document.getElementById('btn-contrast-toggle');
    if (btnModal) {
        btnModal.textContent = isContrast ? 'ON' : 'OFF';
        btnModal.className = isContrast 
            ? 'bg-purple-600 text-white px-4 py-2 rounded-full font-bold transition-all text-sm shadow-sm'
            : 'bg-gray-300 text-gray-700 px-4 py-2 rounded-full font-bold transition-all text-sm';
    }

    if (typeof showToast === 'function') {
        showToast(isContrast ? 'High Contrast mode activated 🌓' : 'Standard contrast mode', '', 'info');
    }
}

function changeFontSize(delta) {
    fontSizePercent = Math.min(135, Math.max(85, fontSizePercent + delta * 10));
    document.documentElement.style.setProperty('--font-scale', (fontSizePercent / 100).toString());
    
    fontSizeOffset += delta;
    if (fontSizeOffset > 4) fontSizeOffset = 4;
    if (fontSizeOffset < -2) fontSizeOffset = -2;

    const baseSize = 15;
    const newSize = baseSize + (fontSizeOffset * 1.5);
    document.documentElement.style.fontSize = `${newSize}px`;

    const display = document.getElementById('font-size-display');
    if (display) {
        display.textContent = `${fontSizePercent}%`;
    }

    if (typeof showToast === 'function') {
        showToast(`Text size set to ${fontSizePercent}%`, '', 'info');
    }
}

function resetFontSize() {
    fontSizePercent = 100;
    fontSizeOffset = 0;
    document.documentElement.style.setProperty('--font-scale', '1');
    document.documentElement.style.fontSize = '15px';
    const display = document.getElementById('font-size-display');
    if (display) display.textContent = '100%';
    if (typeof showToast === 'function') showToast('Text size reset to default (100%)', '', 'info');
}

function toggleReadingRuler() {
    isRulerActive = !isRulerActive;
    let ruler = document.getElementById('reading-ruler') || document.getElementById('reading-ruler-overlay');

    if (isRulerActive) {
        if (!ruler) {
            ruler = document.createElement('div');
            ruler.id = 'reading-ruler';
            document.body.appendChild(ruler);
        }
        ruler.style.display = 'block';
        window.addEventListener('mousemove', moveRuler);
        if (typeof showToast === 'function') showToast('Reading Focus Ruler active 📏', '', 'info');
    } else {
        if (ruler) ruler.style.display = 'none';
        window.removeEventListener('mousemove', moveRuler);
        if (typeof showToast === 'function') showToast('Reading Focus Ruler disabled', '', 'info');
    }
}

function moveRuler(e) {
    const ruler = document.getElementById('reading-ruler') || document.getElementById('reading-ruler-overlay');
    if (ruler) {
        ruler.style.top = `${e.clientY}px`;
    }
}

function setColorTint(colorName) {
    document.body.classList.remove('tint-blue', 'tint-yellow', 'tint-green');
    if (colorName !== 'none') {
        document.body.classList.add(`tint-${colorName}`);
        if (typeof showToast === 'function') showToast(`${colorName.toUpperCase()} visual tint applied 🎨`, '', 'info');
    } else {
        if (typeof showToast === 'function') showToast('Visual tint reset to default background', '', 'info');
    }
}

/**
 * Device & Orientation Experience & Accuracy Recommendation Engine
 * Detects mobile phones / portrait mode and prompts user to use Laptop/iPad or rotate to Landscape for maximum screening accuracy.
 */
function checkDeviceOrientationAndRecommendDesktop() {
    if (sessionStorage.getItem('lexisense_device_modal_dismissed') === 'true') {
        return;
    }

    const isMobileDevice = /Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const isPortrait = window.innerHeight > window.innerWidth;
    const isNarrowWidth = window.innerWidth < 850;

    if ((isMobileDevice && isPortrait) || (isNarrowWidth && isPortrait)) {
        showDeviceOrientationModal();
    } else {
        const existingModal = document.getElementById('device-orientation-modal');
        if (existingModal) existingModal.remove();
    }
}

function showDeviceOrientationModal() {
    if (document.getElementById('device-orientation-modal')) return;

    const modal = document.createElement('div');
    modal.id = 'device-orientation-modal';
    modal.className = 'fixed inset-0 z-[99999] bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-4 transition-all duration-300 animate-fade-in';
    
    modal.innerHTML = `
        <div class="bg-gradient-to-b from-white via-purple-50/50 to-indigo-50/70 rounded-3xl p-6 sm:p-7 max-w-md w-full border border-purple-200/80 shadow-2xl space-y-4 relative text-center">
            
            <button onclick="dismissDeviceOrientationModal()" class="absolute top-4 right-4 w-8 h-8 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-full flex items-center justify-center transition-all cursor-pointer">
                <i class="fa-solid fa-xmark text-sm"></i>
            </button>

            <div class="w-16 h-16 bg-gradient-to-tr from-amber-400 via-amber-500 to-orange-500 rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-amber-400/40 text-white text-3xl animate-bounce">
                <i class="fa-solid fa-laptop-code"></i>
            </div>
            
            <div class="space-y-1.5">
                <span class="inline-flex items-center gap-1.5 px-3 py-1 bg-purple-100 text-purple-800 text-xs font-extrabold rounded-full">
                    <i class="fa-solid fa-circle-info text-amber-500"></i> Saranan Peranti / Device Recommendation
                </span>
                <h3 class="text-lg sm:text-xl font-extrabold text-slate-900 font-heading leading-snug">
                    Sila Gunakan Laptop, iPad atau Mod Landscape 💻📱
                </h3>
            </div>

            <p class="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
                Untuk pengalaman terbaik dan <strong>ketepatan saringan disleksia (Eye-Tracking Saccades & Speech Recognition)</strong> yang paling tinggi, kami mengesyorkan anda menggunakan <strong>Laptop, Tablet (iPad)</strong> atau memutarkan telefon anda ke <strong>Mod Melintang (Landscape)</strong>.
            </p>

            <div class="bg-purple-100/70 p-3.5 rounded-2xl border border-purple-200/80 text-xs text-purple-950 text-left space-y-1.5">
                <p class="font-bold flex items-center gap-1.5 text-purple-900">
                    <i class="fa-solid fa-lightbulb text-amber-500"></i> Mengapa Laptop / iPad / Landscape?
                </p>
                <ul class="space-y-1 text-purple-900 font-medium text-[11px]">
                    <li class="flex items-start gap-1.5">
                        <span class="text-purple-600 font-bold">•</span>
                        <span>Paparan perkataan & perenggan ujian pembacaan lebih luas dan jelas.</span>
                    </li>
                    <li class="flex items-start gap-1.5">
                        <span class="text-purple-600 font-bold">•</span>
                        <span>Penjejakan fokus mata (Gaze Tracking Saccades) dengan kamera lebih tepat.</span>
                    </li>
                </ul>
            </div>

            <div class="pt-2 flex flex-col gap-2">
                <button onclick="dismissDeviceOrientationModal()" class="w-full py-3.5 bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 hover:from-purple-700 hover:to-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-purple-600/30 text-xs sm:text-sm transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer">
                    <span>Saya Faham & Teruskan 🚀</span>
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
}

function dismissDeviceOrientationModal() {
    sessionStorage.setItem('lexisense_device_modal_dismissed', 'true');
    const modal = document.getElementById('device-orientation-modal');
    if (modal) {
        modal.classList.add('opacity-0', 'pointer-events-none');
        setTimeout(() => modal.remove(), 250);
    }
}

// Auto-initialize orientation check on load and resize
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', checkDeviceOrientationAndRecommendDesktop);
} else {
    checkDeviceOrientationAndRecommendDesktop();
}
window.addEventListener('resize', checkDeviceOrientationAndRecommendDesktop);
window.addEventListener('orientationchange', checkDeviceOrientationAndRecommendDesktop);
