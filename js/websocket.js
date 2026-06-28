export const getWebSocketProtocol = () => {
  return window.location.protocol === 'https:' ? 'wss:' : 'ws:';
};

export const buildWebSocketUrl = (apiBaseUrl, protocol, host) => {
  const base = apiBaseUrl.replace(/\/+$/, '');

  if (base.startsWith('http://')) {
    return `ws://${base.slice(7)}/ws`;
  }
  if (base.startsWith('https://')) {
    return `wss://${base.slice(8)}/ws`;
  }

  if (base.startsWith('/')) {
    return `${protocol}//${host}${base}/ws`;
  }

  return `${protocol}//${base}/ws`;
};

export const createWebSocketConnection = (apiBaseUrl, resumeId, authToken = null) => {
  const protocol = getWebSocketProtocol();
  const host = window.location.host;
  const wsUrl = buildWebSocketUrl(apiBaseUrl, protocol, host);

  const ws = new WebSocket(wsUrl);

  ws.addEventListener('open', () => {
    console.log('WebSocket connected');
    const subscribeMessage = {
      type: 'subscribe',
      resume_id: resumeId,
    };
    if (authToken) {
      subscribeMessage.token = authToken;
    }
    ws.send(JSON.stringify(subscribeMessage));
  });

  return ws;
};

export const createWebSocketWithReconnect = (apiBaseUrl, resumeId, authToken = null, messageHandler = null) => {
  let ws = null;
  let reconnectAttempts = 0;
  const maxReconnectAttempts = 5;
  const reconnectDelay = 1000;

  const connect = () => {
    ws = createWebSocketConnection(apiBaseUrl, resumeId, authToken);

    if (messageHandler) {
      ws.addEventListener('message', messageHandler);
    }

    ws.addEventListener('close', (event) => {
      console.log('WebSocket closed:', event.code, event.reason);

      if (reconnectAttempts < maxReconnectAttempts) {
        reconnectAttempts++;
        console.log(`Reconnecting... Attempt ${reconnectAttempts}/${maxReconnectAttempts}`);
        setTimeout(connect, reconnectDelay * reconnectAttempts);
      }
    });

    ws.addEventListener('error', (error) => {
      console.error('WebSocket error:', error);
    });
  };

  connect();
  return ws;
};
