/* ============================================================
   YIPEEVERSE — ONLINE 1v1 MULTIPLAYER NETWORK ENGINE
   - Public serverless WSS MQTT brokers with auto-fallback
   - Live presence heartbeat & lobby list of players on site
   - 1v1 Challenge sending, receiving, accepting & declining
   - Synchronized real-time 1v1 scripture race
   ============================================================ */

const Online = (() => {
  const BROKERS = [
    "wss://broker.emqx.io:8084/mqtt",
    "wss://broker.hivemq.com:8884/mqtt"
  ];

  // Persistent Player ID per session
  let myId = sessionStorage.getItem("yipee_player_id");
  if (!myId) {
    myId = "p_" + Math.random().toString(36).substring(2, 9) + "_" + Date.now().toString(36).slice(-4);
    sessionStorage.setItem("yipee_player_id", myId);
  }

  const TOPIC_LOBBY = "yipeeverse/v2/lobby/presence";
  const TOPIC_MY_INBOX = "yipeeverse/v2/user/" + myId + "/inbox";
  let currentMatchTopic = null;

  let client = null;
  let brokerIdx = 0;
  let isConnected = false;
  let presenceTimer = null;
  let cleanupTimer = null;
  let challengeTimeoutTimer = null;

  // Map of online players: id -> { id, name, avatarId, status, lastSeen }
  const onlinePlayers = new Map();

  // Active outgoing challenge: { targetId, matchId, timer }
  let pendingOutgoingChallenge = null;

  // Active incoming challenge: { fromId, fromName, fromAvatarId, matchId, difficulty, verseRef, seed }
  let pendingIncomingChallenge = null;

  // Active match info
  let activeMatch = null;

  // Callbacks
  let onLobbyChangeCb = null;
  let onChallengeReceivedCb = null;
  let onChallengeResponseCb = null;
  let onMatchActionCb = null;

  function getMyProfile() {
    const prof = (typeof Store !== "undefined" && Store.profile) ? Store.profile() : { name: "You", avatarId: "capybara" };
    return {
      id: myId,
      name: prof.name || "You",
      avatarId: prof.avatarId || "capybara",
      status: (typeof G !== "undefined" && G && G.running && G.rivalKind === "online") ? "in_game" : "available",
      ts: Date.now()
    };
  }

  function init() {
    connect();
    if (presenceTimer) clearInterval(presenceTimer);
    presenceTimer = setInterval(broadcastPresence, 3200);

    if (cleanupTimer) clearInterval(cleanupTimer);
    cleanupTimer = setInterval(pruneInactivePlayers, 2000);
  }

  function connect() {
    if (typeof mqtt === "undefined") {
      console.warn("MQTT.js not loaded, loading dynamically...");
      const s = document.createElement("script");
      s.src = "https://unpkg.com/mqtt@5.3.4/dist/mqtt.min.js";
      s.onload = () => connect();
      document.head.appendChild(s);
      return;
    }

    const brokerUrl = BROKERS[brokerIdx % BROKERS.length];
    try {
      if (client) {
        try { client.end(true); } catch (e) {}
      }

      client = mqtt.connect(brokerUrl, {
        clientId: "yipee_" + myId + "_" + Math.random().toString(16).slice(2, 6),
        clean: true,
        connectTimeout: 7000,
        keepalive: 20
      });

      client.on("connect", () => {
        isConnected = true;
        updateStatusPill();
        client.subscribe(TOPIC_LOBBY, { qos: 0 });
        client.subscribe(TOPIC_MY_INBOX, { qos: 1 });
        broadcastPresence();
      });

      client.on("message", (topic, message) => {
        try {
          const payload = JSON.parse(message.toString());
          handleMessage(topic, payload);
        } catch (e) {
          console.error("Online message error:", e);
        }
      });

      client.on("error", (err) => {
        console.warn("MQTT broker error:", err);
      });

      client.on("close", () => {
        isConnected = false;
        updateStatusPill();
      });

      client.on("offline", () => {
        isConnected = false;
        updateStatusPill();
        brokerIdx++;
      });
    } catch (e) {
      console.warn("Failed to connect to MQTT broker:", e);
    }
  }

  function updateStatusPill() {
    const textEl = document.getElementById("onlineCountText");
    const count = getActivePlayerCount();
    if (textEl) {
      if (!isConnected) {
        textEl.textContent = "Connecting to 1v1 network...";
      } else {
        const others = Math.max(0, count - 1);
        textEl.textContent = others === 0 ? "🟢 Online (You are ready!)" : "🟢 " + others + " other player" + (others > 1 ? "s" : "") + " online";
      }
    }
  }

  function broadcastPresence() {
    if (!client || !isConnected) return;
    const prof = getMyProfile();
    try {
      client.publish(TOPIC_LOBBY, JSON.stringify(prof), { qos: 0 });
    } catch (e) {}
  }

  function pruneInactivePlayers() {
    const now = Date.now();
    let changed = false;
    for (const [id, player] of onlinePlayers.entries()) {
      if (id !== myId && now - player.lastSeen > 9500) {
        onlinePlayers.delete(id);
        changed = true;
      }
    }
    if (changed) {
      updateStatusPill();
      if (onLobbyChangeCb) onLobbyChangeCb(getPlayersList());
    }
  }

  function handleMessage(topic, data) {
    if (topic === TOPIC_LOBBY) {
      if (data && data.id) {
        const prev = onlinePlayers.get(data.id);
        const isNew = !prev;
        const statusChanged = prev && prev.status !== data.status;

        onlinePlayers.set(data.id, {
          id: data.id,
          name: data.name || "Adventurer",
          avatarId: data.avatarId || "capybara",
          status: data.status || "available",
          lastSeen: Date.now()
        });

        if (isNew || statusChanged) {
          updateStatusPill();
          if (onLobbyChangeCb) onLobbyChangeCb(getPlayersList());
        }
      }
    } else if (topic === TOPIC_MY_INBOX) {
      handleInboxMessage(data);
    } else if (currentMatchTopic && topic === currentMatchTopic) {
      if (onMatchActionCb && data.fromId !== myId) {
        onMatchActionCb(data);
      }
    }
  }

  function handleInboxMessage(data) {
    if (!data || !data.type) return;

    if (data.type === "challenge_request") {
      pendingIncomingChallenge = data;
      if (onChallengeReceivedCb) {
        onChallengeReceivedCb(data);
      }
    } else if (data.type === "challenge_response") {
      if (pendingOutgoingChallenge && pendingOutgoingChallenge.matchId === data.matchId) {
        clearTimeout(challengeTimeoutTimer);
        const matchInfo = pendingOutgoingChallenge;
        pendingOutgoingChallenge = null;

        if (onChallengeResponseCb) {
          onChallengeResponseCb({
            accepted: data.accepted,
            reason: data.reason,
            targetName: data.fromName,
            matchInfo: matchInfo,
            targetAvatarId: data.fromAvatarId
          });
        }
      }
    }
  }

  function getPlayersList() {
    const list = [];
    for (const [id, p] of onlinePlayers.entries()) {
      if (id !== myId) {
        list.push(p);
      }
    }
    return list;
  }

  function getActivePlayerCount() {
    return onlinePlayers.size;
  }

  function sendChallenge(targetPlayerId, difficulty = "medium", verse = null) {
    if (!client || !isConnected) {
      if (typeof toast === "function") toast("Connecting to online server, please wait a moment...");
      connect();
      return false;
    }

    const matchId = "m_" + Math.random().toString(36).substring(2, 9);
    const myProf = getMyProfile();

    if (!verse && typeof pickVerse === "function") {
      verse = pickVerse(difficulty);
    }

    const payload = {
      type: "challenge_request",
      fromId: myId,
      fromName: myProf.name,
      fromAvatarId: myProf.avatarId,
      targetId: targetPlayerId,
      matchId: matchId,
      difficulty: difficulty,
      verseRef: verse ? verse.ref : "John 3:16",
      verseText: verse ? verse.text : "For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life.",
      ts: Date.now()
    };

    pendingOutgoingChallenge = {
      targetId: targetPlayerId,
      matchId: matchId,
      difficulty: difficulty,
      verse: verse
    };

    clearTimeout(challengeTimeoutTimer);
    challengeTimeoutTimer = setTimeout(() => {
      if (pendingOutgoingChallenge && pendingOutgoingChallenge.matchId === matchId) {
        pendingOutgoingChallenge = null;
        if (onChallengeResponseCb) {
          onChallengeResponseCb({
            accepted: false,
            reason: "timeout",
            targetName: "Player"
          });
        }
      }
    }, 16000);

    const targetTopic = "yipeeverse/v2/user/" + targetPlayerId + "/inbox";
    client.publish(targetTopic, JSON.stringify(payload), { qos: 1 });
    return true;
  }

  function cancelOutgoingChallenge() {
    clearTimeout(challengeTimeoutTimer);
    if (pendingOutgoingChallenge && client && isConnected) {
      const payload = {
        type: "challenge_response",
        fromId: myId,
        matchId: pendingOutgoingChallenge.matchId,
        accepted: false,
        reason: "cancelled"
      };
      client.publish("yipeeverse/v2/user/" + pendingOutgoingChallenge.targetId + "/inbox", JSON.stringify(payload), { qos: 1 });
    }
    pendingOutgoingChallenge = null;
  }

  function respondToChallenge(accepted, reason = "declined") {
    if (!pendingIncomingChallenge || !client || !isConnected) {
      pendingIncomingChallenge = null;
      return;
    }

    const challenge = pendingIncomingChallenge;
    pendingIncomingChallenge = null;
    const myProf = getMyProfile();

    const payload = {
      type: "challenge_response",
      fromId: myId,
      fromName: myProf.name,
      fromAvatarId: myProf.avatarId,
      matchId: challenge.matchId,
      accepted: accepted,
      reason: reason
    };

    client.publish("yipeeverse/v2/user/" + challenge.fromId + "/inbox", JSON.stringify(payload), { qos: 1 });

    if (accepted) {
      startOnlineMatch(challenge.matchId, challenge.verseRef, challenge.verseText, challenge.difficulty, challenge.fromName, challenge.fromAvatarId, false);
    }
  }

  function startOnlineMatch(matchId, verseRef, verseText, difficulty, opponentName, opponentAvatarId, isHost) {
    if (currentMatchTopic && client) {
      try { client.unsubscribe(currentMatchTopic); } catch (e) {}
    }

    currentMatchTopic = "yipeeverse/v2/match/" + matchId;
    if (client && isConnected) {
      client.subscribe(currentMatchTopic, { qos: 1 });
    }

    activeMatch = {
      matchId: matchId,
      opponentName: opponentName,
      opponentAvatarId: opponentAvatarId,
      isHost: isHost
    };

    let verseObj = null;
    if (typeof VERSES !== "undefined" && VERSES.length) {
      verseObj = VERSES.find(v => v.ref === verseRef);
    }
    if (!verseObj) {
      verseObj = { ref: verseRef, text: verseText, stars: 1 };
    }

    G.pendingDifficulty = difficulty;
    startGame("duo", verseObj, {
      rivalKind: "online",
      rivalName: opponentName,
      rivalAvatarId: opponentAvatarId,
      diff: difficulty,
      matchId: matchId
    });

    broadcastPresence();
  }

  function sendMatchAction(actionData) {
    if (!currentMatchTopic || !client || !isConnected) return;
    const packet = Object.assign({ fromId: myId, ts: Date.now() }, actionData);
    client.publish(currentMatchTopic, JSON.stringify(packet), { qos: 1 });
  }

  function leaveMatch() {
    if (currentMatchTopic && client) {
      try { client.unsubscribe(currentMatchTopic); } catch (e) {}
      currentMatchTopic = null;
    }
    activeMatch = null;
    broadcastPresence();
  }

  return {
    init,
    getMyId: () => myId,
    getMyProfile,
    isConnected: () => isConnected,
    getPlayersList,
    getActivePlayerCount,
    sendChallenge,
    cancelOutgoingChallenge,
    respondToChallenge,
    startOnlineMatch,
    sendMatchAction,
    leaveMatch,
    onLobbyChange: (cb) => { onLobbyChangeCb = cb; },
    onChallengeReceived: (cb) => { onChallengeReceivedCb = cb; },
    onChallengeResponse: (cb) => { onChallengeResponseCb = cb; },
    onMatchAction: (cb) => { onMatchActionCb = cb; }
  };
})();
