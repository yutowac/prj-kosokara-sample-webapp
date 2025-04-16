
document.addEventListener('DOMContentLoaded', function() {
  try {
    let app = firebase.app();
    let features = [
      'auth',
      'database',
      'firestore',
      'functions',
      'messaging',
      'storage',
      'analytics',
      'remoteConfig',
      'performance',
    ].filter(feature => typeof app[feature] === 'function');

    const db = firebase.firestore(app);
    
    initializeApp(db);
    
  } catch (e) {
    console.error('Firebase initialization error:', e);
  }
});

function initializeApp(db) {
  initNavigation();
  
  initPracticeSection(db);
  
  initSubmitSection(db);
  
  initEvaluateSection(db);
  
  initProgressSection(db);
}

function initNavigation() {
  const navLinks = document.querySelectorAll('.main-nav a');
  const contentSections = document.querySelectorAll('.content-section');
  
  navLinks.forEach(link => {
    link.addEventListener('click', function(e) {
      e.preventDefault();
      
      navLinks.forEach(link => link.classList.remove('active'));
      
      this.classList.add('active');
      
      contentSections.forEach(section => section.classList.add('hidden'));
      
      const targetId = this.id.replace('nav-', '') + '-section';
      document.getElementById(targetId).classList.remove('hidden');
    });
  });
}

function initPracticeSection(db) {
  const songSelect = document.getElementById('song-select');
  const customSongInput = document.getElementById('custom-song-input');
  const customSongUrl = document.getElementById('custom-song-url');
  const loadCustomSong = document.getElementById('load-custom-song');
  const practicePlayer = document.getElementById('practice-player');
  const startPractice = document.getElementById('start-practice');
  const stopPractice = document.getElementById('stop-practice');
  const recordingIndicator = document.getElementById('recording-indicator');
  
  songSelect.addEventListener('change', function() {
    if (this.value === 'custom') {
      customSongInput.classList.remove('hidden');
      practicePlayer.innerHTML = '<p class="placeholder-text">カスタム曲のURLを入力してください</p>';
    } else if (this.value) {
      customSongInput.classList.add('hidden');
      loadSongToPlayer(this.value, practicePlayer);
    } else {
      customSongInput.classList.add('hidden');
      practicePlayer.innerHTML = '<p class="placeholder-text">曲を選択すると、ここに表示されます</p>';
    }
  });
  
  loadCustomSong.addEventListener('click', function() {
    const url = customSongUrl.value.trim();
    if (url) {
      const youtubeId = extractYouTubeId(url);
      if (youtubeId) {
        loadSongToPlayer(`https://www.youtube.com/embed/${youtubeId}`, practicePlayer);
      } else {
        alert('有効なYouTube URLを入力してください');
      }
    }
  });
  
  startPractice.addEventListener('click', function() {
    if (songSelect.value && songSelect.value !== 'custom' || 
        (songSelect.value === 'custom' && customSongUrl.value.trim())) {
      startPractice.classList.add('hidden');
      stopPractice.classList.remove('hidden');
      recordingIndicator.classList.remove('hidden');
      
      console.log('練習開始');
    } else {
      alert('練習を開始する前に曲を選択してください');
    }
  });
  
  stopPractice.addEventListener('click', function() {
    startPractice.classList.remove('hidden');
    stopPractice.classList.add('hidden');
    recordingIndicator.classList.add('hidden');
    
    console.log('練習終了');
  });
}

function initSubmitSection(db) {
  const recordNew = document.getElementById('record-new');
  const uploadFile = document.getElementById('upload-file');
  const youtubeLink = document.getElementById('youtube-link');
  const uploadForm = document.getElementById('upload-form');
  const recordSection = document.getElementById('record-section');
  const fileSection = document.getElementById('file-section');
  const youtubeSection = document.getElementById('youtube-section');
  const recordSongSelect = document.getElementById('record-song-select');
  const recordPlayer = document.getElementById('record-player');
  const startRecording = document.getElementById('start-recording');
  const stopRecording = document.getElementById('stop-recording');
  const submitRecording = document.getElementById('submit-recording');
  
  recordNew.addEventListener('click', function() {
    uploadForm.classList.remove('hidden');
    recordSection.classList.remove('hidden');
    fileSection.classList.add('hidden');
    youtubeSection.classList.add('hidden');
  });
  
  uploadFile.addEventListener('click', function() {
    uploadForm.classList.remove('hidden');
    recordSection.classList.add('hidden');
    fileSection.classList.remove('hidden');
    youtubeSection.classList.add('hidden');
  });
  
  youtubeLink.addEventListener('click', function() {
    uploadForm.classList.remove('hidden');
    recordSection.classList.add('hidden');
    fileSection.classList.add('hidden');
    youtubeSection.classList.remove('hidden');
  });
  
  recordSongSelect.addEventListener('change', function() {
    if (this.value) {
      loadSongToPlayer(this.value, recordPlayer);
    } else {
      recordPlayer.innerHTML = '';
    }
  });
  
  startRecording.addEventListener('click', function() {
    if (recordSongSelect.value) {
      startRecording.classList.add('hidden');
      stopRecording.classList.remove('hidden');
      
      console.log('録音開始');
    } else {
      alert('録音を開始する前にカラオケ音源を選択してください');
    }
  });
  
  stopRecording.addEventListener('click', function() {
    startRecording.classList.remove('hidden');
    stopRecording.classList.add('hidden');
    
    console.log('録音終了');
  });
  
  submitRecording.addEventListener('click', function() {
    const title = document.getElementById('submission-title').value.trim();
    const skillLevel = document.getElementById('skill-level').value;
    const comment = document.getElementById('submission-comment').value.trim();
    
    if (!title) {
      alert('タイトルを入力してください');
      return;
    }
    
    let hasData = false;
    
    if (!recordSection.classList.contains('hidden')) {
      hasData = true; // For demo purposes
    } else if (!fileSection.classList.contains('hidden')) {
      const audioFile = document.getElementById('audio-file').files[0];
      hasData = !!audioFile;
    } else if (!youtubeSection.classList.contains('hidden')) {
      const youtubeUrl = document.getElementById('youtube-url').value.trim();
      hasData = !!youtubeUrl;
    }
    
    if (!hasData) {
      alert('投稿するデータがありません');
      return;
    }
    
    saveSubmission(db, {
      title,
      skillLevel,
      comment,
      timestamp: new Date(),
    });
    
    alert('投稿が完了しました！評価をお待ちください。');
    
    document.getElementById('submission-title').value = '';
    document.getElementById('submission-comment').value = '';
    uploadForm.classList.add('hidden');
  });
}

function initEvaluateSection(db) {
  const refreshSubmissions = document.getElementById('refresh-submissions');
  const filterSkill = document.getElementById('filter-skill');
  
  loadSubmissions(db, 'all');
  
  refreshSubmissions.addEventListener('click', function() {
    loadSubmissions(db, filterSkill.value);
  });
  
  filterSkill.addEventListener('change', function() {
    loadSubmissions(db, this.value);
  });
  
  setupExistingSubmissionButtons(db);
}

function initProgressSection(db) {
}

function loadSongToPlayer(url, playerElement) {
  playerElement.innerHTML = `
    <iframe width="560" height="315" src="${url}" 
      title="YouTube video player" frameborder="0" 
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
      allowfullscreen></iframe>
  `;
}

function extractYouTubeId(url) {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
}

function saveSubmission(db, data) {
  console.log('投稿を保存:', data);
  
  const submissionsList = document.getElementById('submissions-list');
  const newSubmission = createSubmissionElement(data);
  
  if (submissionsList.firstChild) {
    submissionsList.insertBefore(newSubmission, submissionsList.firstChild);
  } else {
    submissionsList.appendChild(newSubmission);
  }
}

function loadSubmissions(db, filter) {
  console.log('投稿を読み込み:', filter);
  
}

function createSubmissionElement(data) {
  const div = document.createElement('div');
  div.className = 'voiceCnt';
  div.innerHTML = `
    <div>匿名さんの歌声 - ${data.title}</div>
    <div class="player">
      <p class="placeholder-text">投稿された音声/動画がここに表示されます</p>
    </div>
    <div data-is-on="false">
      <div class="judgeCnt">
        <div class="balloons">
          <div class="sample-balloon">0</div>
          <div class="sample-balloon">0</div>
        </div>
        <br>
        <div class="btns">
          <button class="judgeBtn">カラオケ行って大丈夫！</button>
          <button class="judgeBtn bad">カラオケ行くのまだ早い！</button>
        </div>
      </div>
    </div>
    <div class="meter">
      <meter value="0.5" min="0" max="1">0%</meter>
    </div>
    <div class="feedback-section">
      <textarea placeholder="温かいアドバイスを書いてください" class="feedback-input"></textarea>
      <button class="btn primary-btn feedback-submit">送信</button>
    </div>
  `;
  
  return div;
}

function setupExistingSubmissionButtons(db) {
  const goodButtons = document.querySelectorAll('#submissions-list .judgeBtn:not(.bad)');
  const badButtons = document.querySelectorAll('#submissions-list .judgeBtn.bad');
  const feedbackSubmits = document.querySelectorAll('#submissions-list .feedback-submit');
  
  goodButtons.forEach((button, index) => {
    button.addEventListener('click', function() {
      const balloons = button.closest('.judgeCnt').querySelectorAll('.sample-balloon');
      const goodCount = parseInt(balloons[0].textContent) + 1;
      balloons[0].textContent = goodCount;
      
      const badCount = parseInt(balloons[1].textContent);
      const meterValue = goodCount / (goodCount + badCount);
      const meter = button.closest('.voiceCnt').querySelector('meter');
      meter.value = meterValue;
      
    });
  });
  
  badButtons.forEach((button, index) => {
    button.addEventListener('click', function() {
      const balloons = button.closest('.judgeCnt').querySelectorAll('.sample-balloon');
      const badCount = parseInt(balloons[1].textContent) + 1;
      balloons[1].textContent = badCount;
      
      const goodCount = parseInt(balloons[0].textContent);
      const meterValue = goodCount / (goodCount + badCount);
      const meter = button.closest('.voiceCnt').querySelector('meter');
      meter.value = meterValue;
      
    });
  });
  
  feedbackSubmits.forEach((button, index) => {
    button.addEventListener('click', function() {
      const textarea = button.previousElementSibling;
      const feedback = textarea.value.trim();
      
      if (feedback) {
        alert('フィードバックを送信しました！');
        textarea.value = '';
        
      } else {
        alert('フィードバックを入力してください');
      }
    });
  });
}
