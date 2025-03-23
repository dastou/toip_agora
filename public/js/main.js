// Variables globales
let rtc = {
    localAudioTrack: null,
    localVideoTrack: null,
    localScreenTrack: null,
    client: null,
    channelName: '',
    screenClient: null,
    networkQualityInterval: null,
    stats: {}
  };
  
  let options = {
    appId: '',
    channel: '',
    token: null,
    uid: null
  };
  
  // État de l'application
  let state = {
    isJoined: false,
    isMuted: false,
    isCameraOff: false,
    isScreenSharing: false,
    isChatEnabled: false,
    participantCount: 0,
    remoteUsers: {},
    diagnosticsVisible: false,
    networkQuality: {
      uplink: 0,
      downlink: 0
    }
  };
  
  // Éléments DOM
  const joinBtn = document.getElementById('join-btn');
  const leaveBtn = document.getElementById('leave-btn');
  const micBtn = document.getElementById('mic-btn');
  const cameraBtn = document.getElementById('camera-btn');
  const screenShareBtn = document.getElementById('screen-share-btn');
  const testAudioBtn = document.getElementById('test-audio-btn');
  const channelInput = document.getElementById('channel');
  const localStreamDiv = document.getElementById('local-stream');
  const remoteStreamsDiv = document.getElementById('remote-streams');
  const chatInput = document.getElementById('chat-input');
  const sendMsgBtn = document.getElementById('send-msg-btn');
  const chatMessages = document.getElementById('chat-messages');
  const toggleDiagnosticsBtn = document.getElementById('toggle-diagnostics');
  const diagnosticsContent = document.getElementById('diagnostics-content');
  const notificationsContainer = document.getElementById('notifications');
  
  // Statistiques et diagnostics
  const networkStatus = document.getElementById('network-status');
  const micStatus = document.getElementById('mic-status');
  const cameraStatus = document.getElementById('camera-status');
  const connectionDiagnostics = document.getElementById('connection-diagnostics');
  const packetLoss = document.getElementById('packet-loss');
  const bitrateDisplay = document.getElementById('bitrate');
  const localResolution = document.getElementById('local-resolution');
  
  // Initialisation
  async function init() {
    try {
      // Récupérer l'App ID depuis le serveur
      const response = await fetch('/api/token');
      const data = await response.json();
      options.appId = data.appId;
      
      // Mettre à jour la version dans l'interface
      document.querySelector('.version').textContent = `v${data.appVersion || '1.0.0'}`;
      
      // Initialiser les clients Agora RTC
      rtc.client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
      rtc.screenClient = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
      
      // Configurer les événements
      setupEventListeners();
      
      // Vérifier la connexion réseau
      checkNetworkStatus();
      
      // Notification de bienvenue
      showNotification('Bienvenue dans l\'application d\'appels WebRTC', 'info');
      
      // Pré-vérification des médias
      await preCheckMediaDevices();
      
    } catch (error) {
      console.error('Erreur lors de l\'initialisation:', error);
      showNotification('Erreur lors de l\'initialisation de l\'application', 'error');
    }
  }
  
  // Vérification préalable des périphériques
  async function preCheckMediaDevices() {
    try {
      // Vérifier les appareils disponibles
      const devices = await AgoraRTC.getDevices();
      const hasAudioDevice = devices.some(device => device.kind === 'audioinput');
      const hasVideoDevice = devices.some(device => device.kind === 'videoinput');
      
      // Mettre à jour l'interface
      micStatus.textContent = hasAudioDevice ? 'Disponible' : 'Non détecté';
      cameraStatus.textContent = hasVideoDevice ? 'Disponible' : 'Non détecté';
      
      // Désactiver les boutons si les périphériques ne sont pas disponibles
      if (!hasAudioDevice) {
        micBtn.disabled = true;
        micBtn.title = 'Aucun microphone détecté';
      }
      
      if (!hasVideoDevice) {
        cameraBtn.disabled = true;
        cameraBtn.title = 'Aucune caméra détectée';
      }
      
      return { hasAudioDevice, hasVideoDevice };
    } catch (error) {
      console.error('Erreur lors de la vérification des périphériques:', error);
      return { hasAudioDevice: false, hasVideoDevice: false };
    }
  }
  
  // Vérification de la connexion réseau
  async function checkNetworkStatus() {
    try {
      const start = Date.now();
      const response = await fetch('/api/network-test');
      const elapsed = Date.now() - start;
      
      if (response.ok) {
        networkStatus.textContent = `Connecté (${elapsed}ms)`;
        networkStatus.style.color = '#4CAF50';
      } else {
        networkStatus.textContent = 'Problème de connexion';
        networkStatus.style.color = '#f44336';
      }
    } catch (error) {
      networkStatus.textContent = 'Hors ligne';
      networkStatus.style.color = '#f44336';
    }
  }
  
  // Configuration des écouteurs d'événements
  function setupEventListeners() {
    // Boutons de contrôle
    joinBtn.addEventListener('click', joinChannel);
    leaveBtn.addEventListener('click', leaveChannel);
    micBtn.addEventListener('click', toggleMic);
    cameraBtn.addEventListener('click', toggleCamera);
    screenShareBtn.addEventListener('click', toggleScreenShare);
    testAudioBtn.addEventListener('click', testAudio);
    
    // Chat
    sendMsgBtn.addEventListener('click', sendMessage);
    chatInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') sendMessage();
    });
    
    // Diagnostics
    toggleDiagnosticsBtn.addEventListener('click', toggleDiagnostics);
    
    // Événements Agora
    rtc.client.on('user-published', handleUserPublished);
    rtc.client.on('user-unpublished', handleUserUnpublished);
    rtc.client.on('user-joined', handleUserJoined);
    rtc.client.on('user-left', handleUserLeft);
    rtc.client.on('exception', handleException);
    rtc.client.on('connection-state-change', handleConnectionStateChange);
    rtc.client.on('network-quality', handleNetworkQuality);
    
    // Auto-focus sur le champ de canal
    channelInput.focus();
  }
  
  // Tester l'audio
  function testAudio() {
    // Créer un contexte audio
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    
    // Créer un oscillateur pour générer un son
    const oscillator = audioCtx.createOscillator();
    oscillator.type = 'sine'; // Onde sinusoïdale
    oscillator.frequency.setValueAtTime(440, audioCtx.currentTime); // Note La (A4)
    
    // Créer un nœud de gain pour contrôler le volume
    const gainNode = audioCtx.createGain();
    gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime); // Volume à 10%
    
    // Connecter l'oscillateur au nœud de gain et à la destination
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    // Démarrer l'oscillateur
    oscillator.start();
    
    // Réduire progressivement le volume et arrêter après 1 seconde
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 1);
    setTimeout(() => {
      oscillator.stop();
      
      // Afficher un message
      showNotification('Si vous avez entendu un son, votre audio fonctionne correctement', 'success');
    }, 1000);
  }
  
  // Afficher une notification
  function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
      <div>${message}</div>
      <button class="notification-close">&times;</button>
    `;
    
    notificationsContainer.appendChild(notification);
    
    // Bouton de fermeture
    const closeBtn = notification.querySelector('.notification-close');
    closeBtn.addEventListener('click', () => {
      notification.style.opacity = '0';
      setTimeout(() => {
        notification.remove();
      }, 300);
    });
    
    // Auto-fermeture après 5 secondes
    setTimeout(() => {
      notification.style.opacity = '0';
      setTimeout(() => {
        notification.remove();
      }, 300);
    }, 5000);
  }
  
  // Afficher/masquer le panneau de diagnostic
  function toggleDiagnostics() {
    state.diagnosticsVisible = !state.diagnosticsVisible;
    diagnosticsContent.style.display = state.diagnosticsVisible ? 'block' : 'none';
    toggleDiagnosticsBtn.innerHTML = state.diagnosticsVisible ? 
      '<i class="fas fa-chevron-up"></i>' : 
      '<i class="fas fa-chevron-down"></i>';
  }
  
  // Vérifier les permissions avant de tenter de rejoindre
  async function checkMediaPermissions() {
    let hasVideo = false;
    let hasAudio = false;
    
    try {
      // Vérifier l'accès à la caméra
      const videoStream = await navigator.mediaDevices.getUserMedia({ video: true });
      hasVideo = true;
      
      // Arrêter le stream de test pour libérer la caméra
      videoStream.getTracks().forEach(track => track.stop());
      
      // Mettre à jour l'interface
      cameraStatus.textContent = 'Autorisé';
      cameraStatus.style.color = '#4CAF50';
    } catch (error) {
      console.warn("Aucun accès à la caméra:", error.name);
      cameraStatus.textContent = 'Non autorisé';
      cameraStatus.style.color = '#f44336';
    }
    
    try {
      // Vérifier l'accès au microphone
      const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      hasAudio = true;
      
      // Arrêter le stream de test pour libérer le micro
      audioStream.getTracks().forEach(track => track.stop());
      
      // Mettre à jour l'interface
      micStatus.textContent = 'Autorisé';
      micStatus.style.color = '#4CAF50';
    } catch (error) {
      console.warn("Aucun accès au microphone:", error.name);
      micStatus.textContent = 'Non autorisé';
      micStatus.style.color = '#f44336';
    }
    
    return { hasVideo, hasAudio };
  }
  
  // Mettre à jour le statut de la connexion
  function updateConnectionStatus(status) {
    const connectionStatus = document.getElementById('connection-status');
    const statusText = connectionStatus.querySelector('.status-text');
    
    connectionStatus.className = 'status-indicator ' + status;
    
    switch (status) {
      case 'offline':
        statusText.textContent = 'Déconnecté';
        connectionDiagnostics.textContent = 'Non connecté';
        connectionDiagnostics.style.color = '#f44336';
        break;
      case 'connecting':
        statusText.textContent = 'Connexion en cours...';
        connectionDiagnostics.textContent = 'Connexion en cours...';
        connectionDiagnostics.style.color = '#FFC107';
        break;
      case 'connected':
        statusText.textContent = 'Connecté';
        connectionDiagnostics.textContent = 'Connecté';
        connectionDiagnostics.style.color = '#4CAF50';
        break;
    }
  }
  
  // Mettre à jour le compteur de participants
  function updateParticipantCount() {
    document.getElementById('count').textContent = state.participantCount;
  }
  
  // Rejoindre un canal
  async function joinChannel() {
    try {
      options.channel = channelInput.value.trim();
      rtc.channelName = options.channel;
      
      if (!options.channel) {
        showNotification('Veuillez saisir un nom de canal', 'warning');
        return;
      }
      
      // Vérifier les permissions avant de rejoindre
      const { hasVideo, hasAudio } = await checkMediaPermissions();
      
      if (!hasVideo && !hasAudio) {
        showNotification('Impossible d\'accéder à votre caméra et microphone. Veuillez vérifier vos permissions.', 'error');
        return;
      }
      
      if (!hasVideo) {
        showNotification('Impossible d\'accéder à votre caméra. L\'appel continuera en mode audio.', 'warning');
      }
      
      if (!hasAudio) {
        showNotification('Impossible d\'accéder à votre microphone. L\'appel continuera sans audio.', 'warning');
      }
      
      // Mettre à jour le statut
      updateConnectionStatus('connecting');
      
      // Désactiver le bouton de rejoindre
      joinBtn.disabled = true;
      
      // Générer un UID unique à 9 chiffres
      options.uid = Math.floor(Math.random() * 1000000000);
      
      // Rejoindre le canal
      await rtc.client.join(options.appId, options.channel, options.token, options.uid);
      console.log('Rejoint au canal avec succès!');
      showNotification(`Canal "${options.channel}" rejoint avec succès`, 'success');
      
      // Tentative de création des pistes audio et vidéo avec meilleure gestion d'erreur
      try {
        if (hasAudio) {
          rtc.localAudioTrack = await AgoraRTC.createMicrophoneAudioTrack();
        }
        
        // Tentative d'accès à la caméra
        if (hasVideo) {
          try {
            rtc.localVideoTrack = await AgoraRTC.createCameraVideoTrack({
              encoderConfig: {
                width: { min: 640, ideal: 1280, max: 1920 },
                height: { min: 480, ideal: 720, max: 1080 },
                frameRate: 30
              }
            });
            
            // Afficher la vidéo locale
            rtc.localVideoTrack.play(localStreamDiv);
            
            // Mettre à jour la résolution affichée
            rtc.localVideoTrack.on('track-ended', () => {
              showNotification('Votre caméra a été déconnectée', 'warning');
            });
            
            rtc.localVideoTrack.once('first-frame-decoded', () => {
              const width = rtc.localVideoTrack.getMediaStreamTrack().getSettings().width || 640;
              const height = rtc.localVideoTrack.getMediaStreamTrack().getSettings().height || 480;
              localResolution.textContent = `${width}x${height}`;
            });
          } catch (videoError) {
            console.warn("Impossible d'accéder à la caméra:", videoError);
            showNotification("Impossible d'accéder à votre caméra. L'appel continuera en mode audio uniquement.", 'warning');
          }
        }
        
        // Publier les pistes disponibles
        const tracksToPublish = [];
        if (rtc.localAudioTrack) tracksToPublish.push(rtc.localAudioTrack);
        if (rtc.localVideoTrack) tracksToPublish.push(rtc.localVideoTrack);
        
        if (tracksToPublish.length > 0) {
          await rtc.client.publish(tracksToPublish);
          console.log('Pistes locales publiées avec succès');
        }
        
        // Activer le chat
        enableChat();
        
        // Démarrer le monitoring des statistiques
        startStatsMonitoring();
        
        // Mettre à jour l'interface
        joinBtn.disabled = true;
        leaveBtn.disabled = false;
        channelInput.disabled = true;
        
        // Mettre à jour l'état
        state.isJoined = true;
        state.participantCount = 1; // Nous sommes le premier participant
        updateParticipantCount();
        
        // Quand la connexion est réussie
        updateConnectionStatus('connected');
        
      } catch (mediaError) {
        console.error('Erreur lors de l\'accès aux médias:', mediaError);
        
        // Si aucun média n'est disponible, quitter le canal
        if (!rtc.localAudioTrack && !rtc.localVideoTrack) {
          showNotification("Impossible d'accéder à vos périphériques audio/vidéo. Veuillez vérifier vos permissions.", 'error');
          await rtc.client.leave();
          joinBtn.disabled = false;
          updateConnectionStatus('offline');
          return;
        }
        
        // Sinon, continuer avec les médias disponibles
        showNotification("Certains problèmes sont survenus. L'appel continuera avec les fonctionnalités disponibles.", 'warning');
        
        // Mettre à jour l'interface quand même
        joinBtn.disabled = true;
        leaveBtn.disabled = false;
        channelInput.disabled = true;
        
        // Mettre à jour l'état
        state.isJoined = true;
        state.participantCount = 1; // Nous sommes le premier participant
        updateParticipantCount();
        
        // Quand la connexion est réussie, même avec des médias limités
        updateConnectionStatus('connected');
      }
      
    } catch (error) {
      console.error('Erreur lors de la connexion:', error);
      showNotification(`Erreur lors de la connexion: ${error.message}`, 'error');
      joinBtn.disabled = false;
      updateConnectionStatus('offline');
    }
  }
  
  // Démarrer le monitoring des statistiques réseau
  function startStatsMonitoring() {
    if (rtc.networkQualityInterval) {
      clearInterval(rtc.networkQualityInterval);
    }
    
    rtc.networkQualityInterval = setInterval(async () => {
      try {
        // Obtenir les statistiques de chaque connexion
        if (rtc.client) {
          const stats = rtc.client.getRTCStats();
          const currentBitrate = stats.SendBitrate + stats.RecvBitrate;
          bitrateDisplay.textContent = `${(currentBitrate / 1000).toFixed(1)} kbps`;
          
          // Mettre à jour la perte de paquets
          packetLoss.textContent = `${stats.OutgoingPacketsLost > 0 ? stats.OutgoingPacketsLost : 0}%`;
          packetLoss.style.color = stats.OutgoingPacketsLost > 5 ? '#f44336' : '#4CAF50';
        }
      } catch (e) {
        console.error('Erreur lors de la récupération des statistiques', e);
      }
    }, 1000);
  }
  
  // Activer le chat
  function enableChat() {
    state.isChatEnabled = true;
    chatInput.disabled = false;
    sendMsgBtn.disabled = false;
    
    // Ajouter un message système
    const systemMsg = document.createElement('div');
    systemMsg.className = 'system-message';
    systemMsg.textContent = 'Vous avez rejoint le chat.';
    chatMessages.appendChild(systemMsg);
    
    // Faire défiler jusqu'au dernier message
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }
  
  // Envoyer un message
  function sendMessage() {
    const message = chatInput.value.trim();
    if (!message || !state.isChatEnabled) return;
    
    // Créer un élément de message
    const msgElement = document.createElement('div');
    msgElement.className = 'message sent';
    msgElement.textContent = message;
    
    // Ajouter à la zone de chat
    chatMessages.appendChild(msgElement);
    
    // Effacer le champ de saisie
    chatInput.value = '';
    
    // Faire défiler jusqu'au dernier message
    chatMessages.scrollTop = chatMessages.scrollHeight;
    
    // Dans un vrai système de chat, ici on enverrait le message à tous les participants
    // Pour cet exemple, nous simulons juste l'envoi local
  }
  
  // Quitter le canal
  async function leaveChannel() {
    // Arrêter le monitoring des statistiques
    if (rtc.networkQualityInterval) {
      clearInterval(rtc.networkQualityInterval);
      rtc.networkQualityInterval = null;
    }
    
    // Arrêter et fermer les pistes locales
    if (rtc.localAudioTrack) {
      rtc.localAudioTrack.close();
      rtc.localAudioTrack = null;
    }
    
    if (rtc.localVideoTrack) {
      rtc.localVideoTrack.close();
      rtc.localVideoTrack = null;
    }
    
    // Arrêter le partage d'écran s'il est actif
    if (rtc.localScreenTrack) {
      rtc.localScreenTrack.close();
      rtc.localScreenTrack = null;
      state.isScreenSharing = false;
      screenShareBtn.innerHTML = '<i class="fas fa-desktop"></i> <span>Partage d\'écran</span>';
      screenShareBtn.classList.remove('active');
    }
    
    // Quitter le canal
    await rtc.client.leave();
    
    // Vider le conteneur des flux distants
    remoteStreamsDiv.innerHTML = '';
    
    // Désactiver le chat
    state.isChatEnabled = false;
    chatInput.disabled = true;
    sendMsgBtn.disabled = true;
    
    // Ajouter un message système
    const systemMsg = document.createElement('div');
    systemMsg.className = 'system-message';
    systemMsg.textContent = 'Vous avez quitté le chat.';
    chatMessages.appendChild(systemMsg);
    
    // Mettre à jour l'interface
    joinBtn.disabled = false;
    leaveBtn.disabled = true;
    channelInput.disabled = false;
    
    // Réinitialiser l'état
    state.isJoined = false;
    state.isMuted = false;
    state.isCameraOff = false;
    state.participantCount = 0;
    state.remoteUsers = {};
    updateParticipantCount();
    
    // Mettre à jour le statut de connexion
    updateConnectionStatus('offline');
    
    // Réinitialiser les boutons
    micBtn.innerHTML = '<i class="fas fa-microphone"></i> <span>Micro</span>';
    micBtn.classList.remove('active');
    cameraBtn.innerHTML = '<i class="fas fa-video"></i> <span>Caméra</span>';
    cameraBtn.classList.remove('active');
    
    console.log('Canal quitté avec succès');
    showNotification('Vous avez quitté le canal', 'info');
  }
  
  // Activer/désactiver le microphone
  async function toggleMic() {
    if (!state.isJoined) return;
    
    if (!rtc.localAudioTrack) {
      try {
        // Tentative de création de la piste audio si elle n'existe pas encore
        rtc.localAudioTrack = await AgoraRTC.createMicrophoneAudioTrack();
        await rtc.client.publish([rtc.localAudioTrack]);
        
        micBtn.innerHTML = '<i class="fas fa-microphone"></i> <span>Micro</span>';
        micBtn.classList.remove('active');
        state.isMuted = false;
        showNotification('Microphone activé', 'success');
      } catch (error) {
        console.error("Impossible d'accéder au microphone:", error);
        showNotification("Impossible d'accéder à votre microphone", 'error');
      }
      return;
    }
    
    if (state.isMuted) {
      // Réactiver le microphone
      await rtc.localAudioTrack.setEnabled(true);
      micBtn.innerHTML = '<i class="fas fa-microphone"></i> <span>Micro</span>';
      micBtn.classList.remove('active');
      showNotification('Microphone activé', 'info');
    } else {
      // Désactiver le microphone
      await rtc.localAudioTrack.setEnabled(false);
      micBtn.innerHTML = '<i class="fas fa-microphone-slash"></i> <span>Micro Off</span>';
      micBtn.classList.add('active');
      showNotification('Microphone désactivé', 'info');
    }
    
    state.isMuted = !state.isMuted;
  }
  
  // Activer/désactiver la caméra
  async function toggleCamera() {
    if (!state.isJoined) return;
    
    if (!rtc.localVideoTrack) {
      try {
        // Tentative de création de la piste vidéo si elle n'existe pas encore
        rtc.localVideoTrack = await AgoraRTC.createCameraVideoTrack();
        rtc.localVideoTrack.play(localStreamDiv);
        await rtc.client.publish([rtc.localVideoTrack]);
        
        cameraBtn.innerHTML = '<i class="fas fa-video"></i> <span>Caméra</span>';
        cameraBtn.classList.remove('active');
        state.isCameraOff = false;
        showNotification('Caméra activée', 'success');
      } catch (error) {
        console.error("Impossible d'accéder à la caméra:", error);
        showNotification("Impossible d'accéder à votre caméra", 'error');
      }
      return;
    }
    
    if (state.isCameraOff) {
      // Réactiver la caméra
      await rtc.localVideoTrack.setEnabled(true);
      cameraBtn.innerHTML = '<i class="fas fa-video"></i> <span>Caméra</span>';
      cameraBtn.classList.remove('active');
      showNotification('Caméra activée', 'info');
    } else {
      // Désactiver la caméra
      await rtc.localVideoTrack.setEnabled(false);
      cameraBtn.innerHTML = '<i class="fas fa-video-slash"></i> <span>Caméra Off</span>';
      cameraBtn.classList.add('active');
      showNotification('Caméra désactivée', 'info');
    }
    
    state.isCameraOff = !state.isCameraOff;
  }
  
  // Activer/désactiver le partage d'écran
  async function toggleScreenShare() {
    if (!state.isJoined) return;
    
    // Si le partage d'écran est déjà actif, l'arrêter
    if (state.isScreenSharing) {
      if (rtc.localScreenTrack) {
        await rtc.client.unpublish(rtc.localScreenTrack);
        rtc.localScreenTrack.close();
        rtc.localScreenTrack = null;
      }
      
      state.isScreenSharing = false;
      screenShareBtn.innerHTML = '<i class="fas fa-desktop"></i> <span>Partage d\'écran</span>';
      screenShareBtn.classList.remove('active');
      showNotification('Partage d\'écran arrêté', 'info');
      return;
    }
    
    // Sinon, démarrer le partage d'écran
    try {
      rtc.localScreenTrack = await AgoraRTC.createScreenVideoTrack({
        encoderConfig: '1080p_1',
        optimizationMode: 'detail' // Pour un meilleur rendu du texte
      });
      
      // Gérer l'arrêt du partage d'écran par l'utilisateur
      rtc.localScreenTrack.on('track-ended', () => {
        toggleScreenShare(); // Arrêter proprement le partage
      });
      
      // Publier la piste de partage d'écran
      await rtc.client.publish(rtc.localScreenTrack);
      
      // Mettre à jour l'interface
      state.isScreenSharing = true;
      screenShareBtn.innerHTML = '<i class="fas fa-stop-circle"></i> <span>Arrêter</span>';
      screenShareBtn.classList.add('active');
      showNotification('Partage d\'écran démarré', 'success');
      
    } catch (error) {
      console.error('Erreur lors du partage d\'écran:', error);
      if (error.name === 'NotAllowedError') {
        showNotification('Vous avez refusé l\'autorisation de partage d\'écran', 'error');
      } else {
        showNotification('Erreur lors du partage d\'écran', 'error');
      }
    }
  }
  
  // Gérer un utilisateur qui publie un flux
  async function handleUserPublished(user, mediaType) {
    // S'abonner à l'utilisateur
    await rtc.client.subscribe(user, mediaType);
    console.log('Abonnement réussi');
    
    // Ajouter l'utilisateur à notre état s'il n'existe pas déjà
    if (!state.remoteUsers[user.uid]) {
      state.remoteUsers[user.uid] = user;
    }
    
    // Si c'est une piste vidéo
    if (mediaType === 'video') {
      // Créer un élément pour le flux distant s'il n'existe pas déjà
      let remotePlayerDiv = document.getElementById(`player-${user.uid}`);
      if (!remotePlayerDiv) {
        // Cloner le template
        const template = document.getElementById('remote-player-template');
        remotePlayerDiv = template.content.cloneNode(true).firstElementChild;
        remotePlayerDiv.id = `player-${user.uid}`;
        
        // Mettre à jour l'interface utilisateur
        remotePlayerDiv.querySelector('.user-info').textContent = `Participant ${user.uid % 1000}`;
        remoteStreamsDiv.appendChild(remotePlayerDiv);
      }
      
      // Lire la vidéo distante
      user.videoTrack.play(`player-${user.uid}`);
      
      // Mettre à jour la résolution
      user.videoTrack.once('first-frame-decoded', () => {
        try {
          const resolution = remotePlayerDiv.querySelector('.remote-resolution');
          if (resolution) {
            const track = user.videoTrack.getMediaStreamTrack();
            const settings = track.getSettings();
            resolution.textContent = `${settings.width || 640}x${settings.height || 480}`;
          }
        } catch (e) {
          console.warn('Erreur lors de la récupération de la résolution:', e);
        }
      });
      
      // Notification
      showNotification(`Un participant a activé sa caméra`, 'info');
    }
    
    // Si c'est une piste audio
    if (mediaType === 'audio') {
      user.audioTrack.play();
      
      // Détection du niveau sonore
      setTimeout(() => {
        try {
          const volumeIndicator = document.querySelector(`#player-${user.uid} .remote-volume i`);
          if (volumeIndicator && user.audioTrack) {
            user.audioTrack.on('volume-indicator', (volume) => {
              if (volume > 5) {
                volumeIndicator.style.color = '#4CAF50';
              } else {
                volumeIndicator.style.color = 'white';
              }
            });
          }
        } catch (e) {
          console.warn('Erreur lors de la configuration de l\'indicateur de volume:', e);
        }
      }, 1000);
      
      // Notification
      showNotification(`Un participant a activé son microphone`, 'info');
    }
  }
  
  // Gérer un utilisateur qui arrête de publier
  function handleUserUnpublished(user, mediaType) {
    // Si c'est une vidéo, arrêter la lecture
    if (mediaType === 'video') {
      const remotePlayerDiv = document.getElementById(`player-${user.uid}`);
      if (remotePlayerDiv) {
        // Mettre à jour l'interface pour indiquer que la vidéo est désactivée
        remotePlayerDiv.classList.add('video-off');
        
        // Ajouter une notification
        showNotification(`Un participant a désactivé sa caméra`, 'info');
      }
    }
    
    // Si c'est audio, pas besoin de faire quoi que ce soit car Agora gère automatiquement l'arrêt
    if (mediaType === 'audio') {
      showNotification(`Un participant a désactivé son microphone`, 'info');
    }
  }
  
  // Gérer un utilisateur qui rejoint
  function handleUserJoined(user) {
    console.log('Utilisateur rejoint:', user.uid);
    
    // Si c'est le premier utilisateur distant, 2 participants au total
    // Si des utilisateurs supplémentaires rejoignent, incrémenter le compteur
    const newParticipantCount = Math.max(Object.keys(state.remoteUsers).length + 1, 2);
    
    // Mettre à jour l'état global et l'interface
    state.participantCount = newParticipantCount;
    updateParticipantCount();
    
    // Notification
    showNotification(`Un nouveau participant a rejoint l'appel`, 'info');
    
    // Ajouter un message système dans le chat
    if (state.isChatEnabled) {
      const systemMsg = document.createElement('div');
      systemMsg.className = 'system-message';
      systemMsg.textContent = `Un participant a rejoint l'appel.`;
      chatMessages.appendChild(systemMsg);
      chatMessages.scrollTop = chatMessages.scrollHeight;
    }
  }
  
  // Gérer un utilisateur qui part
  function handleUserLeft(user) {
    console.log('Utilisateur parti:', user.uid);
    
    // Supprimer l'élément vidéo de l'utilisateur
    const remotePlayerDiv = document.getElementById(`player-${user.uid}`);
    if (remotePlayerDiv) {
      remotePlayerDiv.remove();
    }
    
    // Supprimer l'utilisateur de notre état
    if (state.remoteUsers[user.uid]) {
      delete state.remoteUsers[user.uid];
    }
    
    // Mettre à jour le compteur de participants
    state.participantCount = Math.max(Object.keys(state.remoteUsers).length + 1, 1);
    updateParticipantCount();
    
    // Notification
    showNotification(`Un participant a quitté l'appel`, 'info');
    
    // Ajouter un message système dans le chat
    if (state.isChatEnabled) {
      const systemMsg = document.createElement('div');
      systemMsg.className = 'system-message';
      systemMsg.textContent = `Un participant a quitté l'appel.`;
      chatMessages.appendChild(systemMsg);
      chatMessages.scrollTop = chatMessages.scrollHeight;
    }
  }
  
  // Gérer les exceptions Agora
  function handleException(event) {
    console.warn('Exception Agora:', event);
    
    // Gérer différents types d'exceptions
    switch (event.code) {
      case 'SOCKET_DISCONNECTED':
        showNotification('La connexion a été perdue. Tentative de reconnexion...', 'error');
        break;
      case 'NETWORK_QUALITY_POOR':
        showNotification('Qualité réseau faible. Vérifiez votre connexion.', 'warning');
        break;
      case 'RECV_AUDIO_DECODE_FAILED':
        showNotification('Problème de décodage audio. La communication peut être perturbée.', 'warning');
        break;
      case 'RECV_VIDEO_DECODE_FAILED':
        showNotification('Problème de décodage vidéo. La vidéo peut être temporairement indisponible.', 'warning');
        break;
      default:
        // Ne pas afficher de notification pour toutes les exceptions pour éviter le spam
        console.log(`Exception Agora: ${event.code} - ${event.msg}`);
    }
  }
  
  // Gérer les changements d'état de la connexion
  function handleConnectionStateChange(curState, prevState, reason) {
    console.log(`État de connexion: ${prevState} -> ${curState}, raison: ${reason}`);
    
    switch (curState) {
      case 'DISCONNECTED':
        updateConnectionStatus('offline');
        if (state.isJoined) {
          showNotification('Connexion perdue. Veuillez rejoindre à nouveau.', 'error');
        }
        break;
      case 'CONNECTING':
        updateConnectionStatus('connecting');
        break;
      case 'CONNECTED':
        updateConnectionStatus('connected');
        break;
      case 'RECONNECTING':
        updateConnectionStatus('connecting');
        showNotification('Tentative de reconnexion...', 'warning');
        break;
      case 'DISCONNECTING':
        updateConnectionStatus('offline');
        break;
    }
  }
  
  // Gérer la qualité réseau
  function handleNetworkQuality(stats) {
    state.networkQuality.uplink = stats.uplinkNetworkQuality;
    state.networkQuality.downlink = stats.downlinkNetworkQuality;
    
    // Mettre à jour l'interface en fonction de la qualité
    const connectionDiagnostics = document.getElementById('connection-diagnostics');
    
    // Qualité entre 0 (meilleure) et 6 (pire)
    if (stats.uplinkNetworkQuality > 3 || stats.downlinkNetworkQuality > 3) {
      connectionDiagnostics.textContent = 'Connexion faible';
      connectionDiagnostics.style.color = '#f44336';
    } else if (stats.uplinkNetworkQuality > 1 || stats.downlinkNetworkQuality > 1) {
      connectionDiagnostics.textContent = 'Connexion moyenne';
      connectionDiagnostics.style.color = '#FFC107';
    } else {
      connectionDiagnostics.textContent = 'Bonne connexion';
      connectionDiagnostics.style.color = '#4CAF50';
    }
  }
  
  // Initialiser l'application au chargement
  document.addEventListener('DOMContentLoaded', init);