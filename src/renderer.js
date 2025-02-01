const { ipcRenderer } = require('electron');
const Store = require('electron-store');

const store = new Store();

// 전역 변수
let timers = [];
let currentTimer = null;
let timerInterval = null;
let draggedTimer = null;

// DOM 요소와 이벤트 리스너 초기화
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM Content Loaded');

    // DOM 요소
    const elements = {
        minutes: document.getElementById('minutes'),
        seconds: document.getElementById('seconds'),
        currentIndex: document.getElementById('currentIndex'),
        startBtn: document.getElementById('startBtn'),
        pauseBtn: document.getElementById('pauseBtn'),
        stopBtn: document.getElementById('stopBtn'),
        settingsBtn: document.getElementById('settingsBtn'),
        addTimerBtn: document.getElementById('addTimerBtn'),
        timerList: document.getElementById('timerList')
    };

    console.log('DOM Elements:', elements);

    // DOM 요소 검증
    for (const [key, element] of Object.entries(elements)) {
        if (!element) {
            console.error(`Element not found: ${key}`);
            return;
        }
    }

    // 설정 가져오기
    function getSettings() {
        return store.get('timerSettings', {
            loopEnabled: true,
            notifications: {
                sound: true,
                desktop: true
            }
        });
    }

    // 타이머 포맷팅
    function formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return {
            minutes: mins.toString().padStart(2, '0'),
            seconds: secs.toString().padStart(2, '0')
        };
    }

    // 타이머 업데이트
    function updateTimerDisplay(seconds) {
        const time = formatTime(seconds);
        elements.minutes.textContent = time.minutes;
        elements.seconds.textContent = time.seconds;
        
        if (currentTimer) {
            const index = timers.indexOf(currentTimer) + 1;
            elements.currentIndex.textContent = `${index}/${timers.length}`;
            ipcRenderer.send('update-tray', {
                index,
                total: timers.length,
                time: `${time.minutes}:${time.seconds}`,
                name: currentTimer.name
            });
        } else {
            elements.currentIndex.textContent = '-/-';
            ipcRenderer.send('update-tray', null);
        }
    }

    // 컨트롤 초기화
    function resetControls() {
        elements.startBtn.disabled = false;
        elements.pauseBtn.disabled = true;
        elements.stopBtn.disabled = true;
    }

    // 타이머 시작
    function startTimer() {
        console.log('startTimer called');
        if (!currentTimer) {
            currentTimer = timers[0];
        }
        if (!currentTimer) return;

        elements.startBtn.disabled = true;
        elements.pauseBtn.disabled = false;
        elements.stopBtn.disabled = false;

        timerInterval = setInterval(() => {
            currentTimer.remainingTime--;
            updateTimerDisplay(currentTimer.remainingTime);

            if (currentTimer.remainingTime <= 0) {
                clearInterval(timerInterval);
                const settings = getSettings();
                
                if (currentTimer.notificationEnabled) {
                    if (settings.notifications.desktop) {
                        new Notification(currentTimer.name || 'StepClock', {
                            body: '타이머가 완료되었습니다!'
                        });
                    }
                    if (settings.notifications.sound) {
                        const audio = new Audio('notification.mp3');
                        audio.play();
                    }
                }

                // 다음 타이머 시작
                const currentIndex = timers.indexOf(currentTimer);
                if (currentIndex < timers.length - 1) {
                    currentTimer = timers[currentIndex + 1];
                    updateTimerDisplay(currentTimer.remainingTime);
                    updateTimerList();
                    startTimer();
                } else if (settings.loopEnabled && timers.length > 0) {
                    // 순환 실행이 활성화되어 있으면 처음부터 다시 시작
                    timers.forEach(timer => {
                        timer.remainingTime = timer.duration;
                    });
                    currentTimer = timers[0];
                    updateTimerDisplay(currentTimer.remainingTime);
                    updateTimerList();
                    startTimer();
                } else {
                    resetControls();
                    currentTimer = null;
                    updateTimerDisplay(0);
                }
            }
        }, 1000);

        updateTimerList();
        ipcRenderer.send('start-timer');
    }

    // 타이머 일시정지
    function pauseTimer() {
        console.log('pauseTimer called');
        clearInterval(timerInterval);
        elements.startBtn.disabled = false;
        elements.pauseBtn.disabled = true;
        ipcRenderer.send('pause-timer');
    }

    // 타이머 정지
    function stopTimer() {
        console.log('stopTimer called');
        clearInterval(timerInterval);
        timers.forEach(timer => {
            timer.remainingTime = timer.duration;
        });
        currentTimer = null;
        updateTimerDisplay(0);
        resetControls();
        updateTimerList();
        ipcRenderer.send('stop-timer');
    }

    // 타이머 추가
    function addTimer(duration = 1500) {
        console.log('addTimer called', { duration });
        if (timers.length >= 5) {
            alert('최대 5개까지만 타이머를 추가할 수 있습니다.');
            return;
        }

        const timer = {
            id: Date.now(),
            duration: duration,
            remainingTime: duration,
            order: timers.length,
            name: `타이머 ${timers.length + 1}`,
            notificationEnabled: true
        };
        console.log('New timer created:', timer);
        timers.push(timer);
        
        updateTimerDisplay(0);
        updateTimerList();
    }

    // 타이머 이름 수정
    function editTimerName(id, element) {
        const timer = timers.find(t => t.id === id);
        if (!timer) return;

        element.contentEditable = true;
        element.focus();

        function handleEdit() {
            element.contentEditable = false;
            const newName = element.textContent.trim();
            if (newName) {
                timer.name = newName;
            }
            updateTimerList();
        }

        element.onblur = handleEdit;
        element.onkeydown = (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                handleEdit();
            }
        };
    }

    // 알림 설정 토글
    function toggleNotification(id) {
        const timer = timers.find(t => t.id === id);
        if (timer) {
            timer.notificationEnabled = !timer.notificationEnabled;
            updateTimerList();
        }
    }

    // 타이머 시간 조정
    function adjustTimer(id, change) {
        const timer = timers.find(t => t.id === id);
        if (!timer) return;

        const newDuration = Math.max(60, timer.duration + change);
        timer.duration = newDuration;
        timer.remainingTime = newDuration;
        
        if (currentTimer && currentTimer.id === id) {
            updateTimerDisplay(newDuration);
        }
        
        updateTimerList();
    }

    // 타이머 직접 수정
    function editTimer(id, element) {
        const timer = timers.find(t => t.id === id);
        if (!timer) return;

        const time = formatTime(timer.duration);
        element.classList.add('editing');
        element.contentEditable = true;
        element.focus();

        function handleEdit() {
            element.contentEditable = false;
            element.classList.remove('editing');
            
            const parts = element.textContent.split(':');
            if (parts.length === 2) {
                const minutes = parseInt(parts[0]);
                const seconds = parseInt(parts[1]);
                if (!isNaN(minutes) && !isNaN(seconds)) {
                    const newDuration = minutes * 60 + seconds;
                    if (newDuration >= 0) {
                        timer.duration = newDuration;
                        timer.remainingTime = newDuration;
                        
                        if (currentTimer && currentTimer.id === id) {
                            updateTimerDisplay(newDuration);
                        }
                        
                        updateTimerList();
                        return;
                    }
                }
            }
            
            updateTimerList();
        }

        element.onblur = handleEdit;
        element.onkeydown = (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                handleEdit();
            }
        };
    }

    // 타이머 순서 변경
    function handleDragStart(e, id) {
        draggedTimer = timers.find(t => t.id === id);
        e.currentTarget.classList.add('dragging');
    }

    function handleDragEnd(e) {
        e.currentTarget.classList.remove('dragging');
        draggedTimer = null;
    }

    function handleDragOver(e) {
        e.preventDefault();
        const timerItem = e.target.closest('.timer-item');
        if (!timerItem || !draggedTimer) return;

        const targetId = parseInt(timerItem.dataset.id);
        const targetTimer = timers.find(t => t.id === targetId);
        if (!targetTimer || targetTimer.id === draggedTimer.id) return;

        const draggedIndex = timers.indexOf(draggedTimer);
        const targetIndex = timers.indexOf(targetTimer);

        timers.splice(draggedIndex, 1);
        timers.splice(targetIndex, 0, draggedTimer);

        timers.forEach((timer, index) => {
            timer.order = index;
        });

        updateTimerList();
    }

    // 타이머 목록 업데이트
    function updateTimerList() {
        elements.timerList.innerHTML = '';
        timers.sort((a, b) => a.order - b.order).forEach((timer) => {
            const time = formatTime(timer.duration);
            const timerElement = document.createElement('div');
            timerElement.className = 'timer-item' + (currentTimer && currentTimer.id === timer.id ? ' active' : '');
            timerElement.dataset.id = timer.id;
            timerElement.draggable = true;
            timerElement.ondragstart = (e) => handleDragStart(e, timer.id);
            timerElement.ondragend = handleDragEnd;
            timerElement.ondragover = handleDragOver;
            
            timerElement.innerHTML = `
                <div class="handle">⋮⋮</div>
                <div class="timer-info">
                    <span class="timer-name">${timer.name}</span>
                    <div class="time-control">
                        <button class="time-btn decrease-btn">◀</button>
                        <span class="time">${time.minutes}:${time.seconds}</span>
                        <button class="time-btn increase-btn">▶</button>
                    </div>
                </div>
                <div class="timer-actions">
                    <button class="notification-btn ${timer.notificationEnabled ? 'enabled' : ''}">
                        ${timer.notificationEnabled ? '🔔' : '🔕'}
                    </button>
                    <button class="remove-btn">✕</button>
                </div>
            `;

            // 이벤트 리스너 추가
            const timerName = timerElement.querySelector('.timer-name');
            timerName.addEventListener('dblclick', () => editTimerName(timer.id, timerName));

            const timeDisplay = timerElement.querySelector('.time');
            timeDisplay.addEventListener('dblclick', () => editTimer(timer.id, timeDisplay));

            const decreaseBtn = timerElement.querySelector('.decrease-btn');
            decreaseBtn.addEventListener('click', () => adjustTimer(timer.id, -60));

            const increaseBtn = timerElement.querySelector('.increase-btn');
            increaseBtn.addEventListener('click', () => adjustTimer(timer.id, 60));

            const notificationBtn = timerElement.querySelector('.notification-btn');
            notificationBtn.addEventListener('click', () => toggleNotification(timer.id));

            const removeBtn = timerElement.querySelector('.remove-btn');
            removeBtn.addEventListener('click', () => removeTimer(timer.id));

            elements.timerList.appendChild(timerElement);
        });

        elements.addTimerBtn.style.display = timers.length >= 5 ? 'none' : 'block';
    }

    // 타이머 제거
    function removeTimer(id) {
        const index = timers.findIndex(t => t.id === id);
        if (index !== -1) {
            timers.splice(index, 1);
            if (currentTimer && currentTimer.id === id) {
                stopTimer();
            }
            
            timers.forEach((timer, index) => {
                timer.order = index;
            });
            
            updateTimerList();
            updateTimerDisplay(0);
        }
    }

    // 설정 메뉴 표시
    function showSettings() {
        console.log('showSettings called');
        ipcRenderer.send('show-settings');
    }

    // 이벤트 리스너 등록
    elements.startBtn.addEventListener('click', () => {
        console.log('Start button clicked');
        startTimer();
    });

    elements.pauseBtn.addEventListener('click', () => {
        console.log('Pause button clicked');
        pauseTimer();
    });

    elements.stopBtn.addEventListener('click', () => {
        console.log('Stop button clicked');
        stopTimer();
    });

    elements.settingsBtn.addEventListener('click', () => {
        console.log('Settings button clicked');
        showSettings();
    });

    elements.addTimerBtn.addEventListener('click', () => {
        console.log('Add timer button clicked');
        addTimer();
    });

    // 초기 타이머 추가
    console.log('Adding initial timer...');
    addTimer();
}); 