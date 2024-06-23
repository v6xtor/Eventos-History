const historyStageTimes = [
  { hour: 12, minute: 0 },
  { hour: 16, minute: 0 },
  { hour: 20, minute: 0 },
  { hour: 0, minute: 0 }
];

const worldBossTimes = [
  { day: 2, hour: 19, minute: 40 },
  { day: 2, hour: 22, minute: 30 },
  { day: 5, hour: 19, minute: 40 },
  { day: 5, hour: 22, minute: 30 }
];

const upEventTimes = [
  { day: 4, hour: 18, minute: 30 }
];

let alarmSound = new Audio('alarm.mp3');
let countdownInterval;

document.addEventListener('DOMContentLoaded', function () {
  const historyStageCheckbox = document.getElementById('historyStage');
  const worldBossCheckbox = document.getElementById('worldBoss');
  const upEventCheckbox = document.getElementById('upEvent');
  const saveButton = document.getElementById('saveButton');
  const countdownTimer = document.getElementById('countdownTimer');
  const volumeRange = document.getElementById('volumeRange');

  historyStageCheckbox.addEventListener('change', () => {
    if (historyStageCheckbox.checked) {
      worldBossCheckbox.checked = false;
      upEventCheckbox.checked = false;
    }
  });

  worldBossCheckbox.addEventListener('change', () => {
    if (worldBossCheckbox.checked) {
      historyStageCheckbox.checked = false;
      upEventCheckbox.checked = false;
    }
  });

  upEventCheckbox.addEventListener('change', () => {
    if (upEventCheckbox.checked) {
      historyStageCheckbox.checked = false;
      worldBossCheckbox.checked = false;
    }
  });
  chrome.storage.sync.get(['events', 'volume'], result => {
    if (result.events) {
      historyStageCheckbox.checked = result.events.historyStage || false;
      worldBossCheckbox.checked = result.events.worldBoss || false;
      upEventCheckbox.checked = result.events.upEvent || false;
    }
    if (result.volume !== undefined) {
      volumeRange.value = result.volume;
      alarmSound.volume = result.volume;
    }
    startCountdown(result.events || {});
  });
  saveButton.addEventListener('click', () => {
    const events = {
      historyStage: historyStageCheckbox.checked,
      worldBoss: worldBossCheckbox.checked,
      upEvent: upEventCheckbox.checked
    };

    chrome.storage.sync.set({ events }, () => {
      clearInterval(countdownInterval); 
      startCountdown(events);
      showSavedConfirmation(); 
      chrome.runtime.sendMessage({ action: 'settingsChanged' });
    });
  });

  volumeRange.addEventListener('input', () => {
    const volume = volumeRange.value;
    alarmSound.volume = volume;
    chrome.storage.sync.set({ volume });
    alarmSound.play();
  });

  function startCountdown(events) {
    clearInterval(countdownInterval);

    countdownInterval = setInterval(() => {
      updateCountdown(events);
    }, 1000);

    updateCountdown(events); 
  }
  function updateCountdown(events) {
    const now = new Date();
    const nextEventTime = getNextEventTime(events);
    const timeDiff = nextEventTime - now;
    
    if (timeDiff <= 0) {
      countdownTimer.textContent = 'O evento começou!';
      playAlarmRepeatedly();
      return;
    }

    const hours = Math.floor(timeDiff / 1000 / 60 / 60);
    const minutes = Math.floor((timeDiff / 1000 / 60) % 60);
    const seconds = Math.floor((timeDiff / 1000) % 60);

    countdownTimer.textContent = `${hours}h ${minutes}m ${seconds}s restantes`;
  }

  function getNextEventTime(events) {
    const now = new Date();
    const eventTimes = [];

    if (events.historyStage) {
      historyStageTimes.forEach(time => {
        const eventTime = new Date();
        eventTime.setHours(time.hour, time.minute, 0, 0);
        if (eventTime > now) eventTimes.push(eventTime);
      });
    }

    if (events.worldBoss) {
      worldBossTimes.forEach(time => {
        const eventTime = new Date();
        eventTime.setDate(eventTime.getDate() + ((time.day + 7 - eventTime.getDay()) % 7)); // Set to next occurrence of specified day
        eventTime.setHours(time.hour, time.minute, 0, 0);
        if (eventTime > now) eventTimes.push(eventTime);
      });
    }

    if (events.upEvent) {
      upEventTimes.forEach(time => {
        const eventTime = new Date();
        eventTime.setDate(eventTime.getDate() + ((time.day + 7 - eventTime.getDay()) % 7)); // Set to next occurrence of specified day
        eventTime.setHours(time.hour, time.minute, 0, 0);
        if (eventTime > now) eventTimes.push(eventTime);
      });
    }

    eventTimes.sort((a, b) => a - b);
    return eventTimes[0] || new Date();
  }

  function showSavedConfirmation() {
    const confirmationPopup = document.createElement('div');
    confirmationPopup.classList.add('popup');
    confirmationPopup.textContent = 'Configuração salva com sucesso!';
    document.body.appendChild(confirmationPopup);

    setTimeout(() => {
      confirmationPopup.remove();
    }, 2000);
  }

  function playAlarmRepeatedly() {
    let count = 0;
    const intervalId = setInterval(() => {
      alarmSound.play();
      count++;

      if (count >= 9) {
        clearInterval(intervalId);
      }
    }, 1000); 
  }
});
