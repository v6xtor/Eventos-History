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

function createAlarms() {
  chrome.storage.sync.get(['events', 'volume'], result => {
    const events = result.events || {};

    
    chrome.alarms.clearAll();

    if (events.historyStage) {
      historyStageTimes.forEach(time => {
        chrome.alarms.create(`historyStage-${time.hour}:${time.minute}`, {
          when: getNextAlarmTime(time.hour, time.minute)
        });
      });
    }

    
    if (events.worldBoss) {
      worldBossTimes.forEach(time => {
        chrome.alarms.create(`worldBoss-${time.day}-${time.hour}:${time.minute}`, {
          when: getNextDayTime(time.day, time.hour, time.minute)
        });
      });
    }
    if (events.upEvent) {
      upEventTimes.forEach(time => {
        chrome.alarms.create(`upEvent-${time.day}-${time.hour}:${time.minute}`, {
          when: getNextDayTime(time.day, time.hour, time.minute)
        });
      });
    }

    if (result.volume !== undefined) {
      alarmSound.volume = result.volume;
    }
  });
}

function getNextAlarmTime(hour, minute) {
  const now = new Date();
  const nextTime = new Date();
  nextTime.setHours(hour, minute, 0, 0);

  if (nextTime <= now) {
    nextTime.setDate(nextTime.getDate() + 1);
  }

  return nextTime.getTime();
}

function getNextDayTime(day, hour, minute) {
  const now = new Date();
  const nextTime = new Date();
  nextTime.setHours(hour, minute, 0, 0);

  if (nextTime.getDay() !== day) {
    const dayDiff = (day + 7 - now.getDay()) % 7;
    nextTime.setDate(nextTime.getDate() + dayDiff);
  }

  if (nextTime <= now) {
    nextTime.setDate(nextTime.getDate() + 7);
  }

  return nextTime.getTime();
}

chrome.runtime.onInstalled.addListener(() => {
  createAlarms();
});

chrome.runtime.onMessage.addListener((message) => {
  if (message.action === 'settingsChanged') {
    createAlarms();
  }
});

chrome.alarms.onAlarm.addListener(alarm => {
  playAlarmRepeatedly();
});

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
