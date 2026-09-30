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
