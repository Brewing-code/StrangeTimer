document.addEventListener('DOMContentLoaded', () => {
  const steps = [
    "Inicio de empaste",
    "Fin empaste - Inicio de sacarificacion",
    "Inicio de recirculado",
    "Fin de recirculado - Inicio del trasvase",
    "Inicio de lavado",
    "Fin de lavado",
    "Fin de trasvase",
    "Inicio de hervido",
    "Fin de hervido",
    "Inicio de whirlpool",
    "Fin de whirlpool",
    "Inicio de hopstand",
    "Fin de hopstand",
    "Inicio de enfriamiento",
    "Fin de enfriamiento",
  ];

  // Alarm intervals in seconds (undefined or 0 for steps without alarm)
  const alarmIntervals = {
    1: 20 * 60,
    2: 15 * 60,
    3: 90 * 60,
    7: 60 * 60,
    9: 20 * 60,
    11: 10 * 60
  };

  // Steps with alarms and their default values (in minutes)
  const alarmSteps = [
    { idx: 1, label: "Fin empaste - Inicio de sacarificacion", default: 20 },
    { idx: 2, label: "Inicio de recirculado", default: 15 },
    { idx: 3, label: "Fin de recirculado - Inicio del trasvase", default: 90 },
    { idx: 7, label: "Inicio de hervido", default: 60 },
    { idx: 9, label: "Inicio de whirlpool", default: 20 },
    { idx: 11, label: "Inicio de hopstand", default: 10 }
  ];

  let currentStep = 0;
  const results = [];
  const stepDiv = document.getElementById('step');
  const nextBtn = document.getElementById('nextBtn');
  const resultsTable = document.getElementById('resultsTable');
  const tbody = resultsTable.querySelector('tbody');

  let alarmTimeout;
  let alarmAudio = new Audio('alarm.mp3');
  alarmAudio.loop = true;

// Unlock audio on first user interaction
function unlockAudio() {
  alarmAudio.play().then(() => {
    alarmAudio.pause();
    alarmAudio.currentTime = 0;
    document.removeEventListener('touchstart', unlockAudio);
    document.removeEventListener('click', unlockAudio);
  }).catch(() => {});
}
document.addEventListener('touchstart', unlockAudio, { once: true });
document.addEventListener('click', unlockAudio, { once: true });

  function playAlarmLoop() {
  alarmAudio.currentTime = 0;
  alarmAudio.play();
}
function stopAlarmLoop() {
  alarmAudio.pause();
  alarmAudio.currentTime = 0;
}

  // TIMER
  let timerInterval;
  let timerSeconds = 0;

  function updateTimerDisplay() {
    const mins = String(Math.floor(timerSeconds / 60)).padStart(2, '0');
    const secs = String(timerSeconds % 60).padStart(2, '0');
    document.getElementById('timer').textContent = `${mins}:${secs}`;
  }

  function startTimer(alarmSeconds) {
    clearInterval(timerInterval);
    clearTimeout(alarmTimeout);
    timerSeconds = 0;
    updateTimerDisplay();

    if (alarmSeconds) {
      alarmTimeout = setTimeout(() => {
        playAlarmLoop();
        Swal.fire({
          title: '¡Alarma!',
          text: 'Ha pasado el tiempo para este paso.',
          icon: 'warning',
          confirmButtonText: 'OK',
          background: '#222',
          color: '#fff',
          confirmButtonColor: '#53ac50',
          width: '400px',
          allowOutsideClick: true
        }).then(() => {
          stopAlarmLoop();
        });
      }, alarmSeconds * 1000);
    }

    timerInterval = setInterval(() => {
      timerSeconds++;
      updateTimerDisplay();
    }, 1000);
  }

  // UI
  function updateStep() {
    if (currentStep < steps.length) {
      stepDiv.textContent = `Proximo paso: ${steps[currentStep]}`;
      nextBtn.textContent = currentStep === 0 ? "Iniciar empaste" : "Proximo paso";
    } else {
      stepDiv.textContent = "Proceso completo!";
      nextBtn.style.display = "none";
      clearInterval(timerInterval);
    }
  }

  function addResult(paso, horario) {
    const row = document.createElement('tr');
    const stepCell = document.createElement('td');
    const timeCell = document.createElement('td');
    stepCell.textContent = paso;
    timeCell.textContent = horario;
    row.appendChild(stepCell);
    row.appendChild(timeCell);
    tbody.appendChild(row);
    row.scrollIntoView({ behavior: "smooth" });
  }

  // MAIN BUTTON: step + timer + alarm
  nextBtn.addEventListener('click', () => {
    // Get alarm interval for the next step
    const alarmSeconds = alarmIntervals[currentStep] || null;
    startTimer(alarmSeconds);

    const now = new Date();
    const timeString = now.toLocaleTimeString();
    if (currentStep < steps.length) {
      addResult(steps[currentStep], timeString);
      results.push({ step: steps[currentStep], time: timeString });
      currentStep++;
      updateStep();
    }
  });

  // DOWNLOAD BUTTON
  document.getElementById('downloadBtn').addEventListener('click', () => {
    let csvContent = "Paso,Horario\n";
    results.forEach(row => {
      csvContent += `"${row.step}","${row.time}"\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = 'brewing_process.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  });

  // SHOW ALARM CONFIG FORM FIRST
  let formHtml = '<form id="alarmForm">';
  alarmSteps.forEach(step => {
    formHtml += `
      <label style="display:block;margin:10px 0 5px 0;">${step.label} (minutos):</label>
      <input type="number" min="0" value="${step.default}" id="alarm_${step.idx}" style="width:80px;">
    `;
  });
  formHtml += '</form>';

  Swal.fire({
    title: 'Configurar alarmas',
    html: formHtml,
    confirmButtonText: 'Guardar',
    confirmButtonColor: '#53ac50',
    allowOutsideClick: false,
    customClass: {
    confirmButton: 'my-confirm-btn'
    },
    preConfirm: () => {
  alarmSteps.forEach(step => {
    const val = parseFloat(document.getElementById(`alarm_${step.idx}`).value); // <-- use parseFloat
    if (!isNaN(val) && val > 0) {
      alarmIntervals[step.idx] = val * 60; // convert to seconds
    } else {
      delete alarmIntervals[step.idx]; // remove if not set
    }
  });
}
  }).then(() => {
    updateStep();
    updateTimerDisplay();
  });
});