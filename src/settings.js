import { ipcRenderer } from 'electron';
import Store from 'electron-store';

const store = new Store();

// DOM 요소
const backBtn = document.getElementById('backBtn');
const loopEnabled = document.getElementById('loopEnabled');
const soundEnabled = document.getElementById('soundEnabled');
const desktopEnabled = document.getElementById('desktopEnabled');
const currentWidth = document.getElementById('currentWidth');
const currentHeight = document.getElementById('currentHeight');
const minWidth = document.getElementById('minWidth');
const minHeight = document.getElementById('minHeight');
const maxWidth = document.getElementById('maxWidth');
const maxHeight = document.getElementById('maxHeight');

// 설정 로드
function loadSettings() {
    const settings = store.get('timerSettings', {
        loopEnabled: true,
        notifications: {
            sound: true,
            desktop: true
        }
    });
    
    loopEnabled.checked = settings.loopEnabled;
    soundEnabled.checked = settings.notifications.sound;
    desktopEnabled.checked = settings.notifications.desktop;
    
    const windowSize = store.get('windowSize', {
        width: 300,
        height: 450,
        minWidth: 250,
        minHeight: 400,
        maxWidth: 500,
        maxHeight: 800
    });
    
    currentWidth.textContent = windowSize.width;
    currentHeight.textContent = windowSize.height;
    minWidth.value = windowSize.minWidth;
    minHeight.value = windowSize.minHeight;
    maxWidth.value = windowSize.maxWidth;
    maxHeight.value = windowSize.maxHeight;
}

// 설정 저장
function saveSettings() {
    const settings = {
        timerSettings: {
            loopEnabled: loopEnabled.checked,
            notifications: {
                sound: soundEnabled.checked,
                desktop: desktopEnabled.checked
            }
        },
        windowSize: {
            width: parseInt(currentWidth.textContent),
            height: parseInt(currentHeight.textContent),
            minWidth: parseInt(minWidth.value),
            minHeight: parseInt(minHeight.value),
            maxWidth: parseInt(maxWidth.value),
            maxHeight: parseInt(maxHeight.value)
        }
    };
    
    ipcRenderer.send('settings-updated', settings);
}

// 이벤트 리스너
backBtn.addEventListener('click', () => {
    window.close();
});

[loopEnabled, soundEnabled, desktopEnabled].forEach(input => {
    input.addEventListener('change', saveSettings);
});

[minWidth, minHeight, maxWidth, maxHeight].forEach(input => {
    input.addEventListener('change', () => {
        // 값 검증
        const min = parseInt(input.min);
        const max = parseInt(input.max);
        let value = parseInt(input.value);
        
        if (isNaN(value)) {
            value = parseInt(input.defaultValue);
        }
        
        value = Math.max(min, Math.min(max, value));
        input.value = value;
        
        saveSettings();
    });
});

// 초기 설정 로드
loadSettings(); 