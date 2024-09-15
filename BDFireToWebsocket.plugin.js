/**
 * @name BDFireToWebsocket
 * @author Pinapelz
 * @description Broadcasts messages from Discord to a WebSocket server
 * @version 0.0.4
 */

const { Webpack } = BdApi;
const { Filters } = Webpack;
const Dispatcher = Webpack.getModule(Filters.byProps("isDispatching", "subscribe"));

let socket;
let defaultWebSocketAddress = BdApi.loadData("AutoReplier", "webSocketAddress") || 'ws://localhost:8765';

function connectWebSocket() {
  if (socket) {
    socket.close();
  }

  socket = new WebSocket(defaultWebSocketAddress);
  
  socket.onopen = () => {
    console.log('WebSocket connection established.');
  };

  socket.onclose = (event) => {
    console.log(`WebSocket connection closed: ${event.code} ${event.reason}`);
  };

  socket.onerror = (error) => {
    console.error(`WebSocket error: ${error.message}`);
  };
}

connectWebSocket();

module.exports = (meta) => {
  let listenChannelId = [];  // Channel IDs to broadcast from
  let selfUserId = 246787839570739211;  // Your User ID to exclude your own messages
  let webSocketAddress = defaultWebSocketAddress;

  const updateListenChannel = (value) => {
    listenChannelId = value.split(",").filter(el => el.trim() !== "");
  };

  const updateSelfUserId = (value) => {
    selfUserId = value.trim();
  };

  const updateWebSocketAddress = (value) => {
    webSocketAddress = value.trim();
  };

  const applyStyles = (element, styles) => {
    Object.assign(element.style, styles);
  };

  return {
    onMessage: ({ message, channelId }) => {
      if (message.author.id !== selfUserId && socket.readyState === WebSocket.OPEN) {
        const data = {
          author: message.author.id,
          author_name: message.author_name,
          content: message.content,
          time: message.time,
          channel: channelId
        };
        
        console.log(JSON.stringify(data));

        if (listenChannelId.includes(channelId) || listenChannelId.length === 0) {
          console.log("Propagating message");
          socket.send(JSON.stringify(data));
        }
      }
    },

    start() {
      Dispatcher.subscribe('MESSAGE_CREATE', this.onMessage);
    },

    stop() {
      Dispatcher.unsubscribe('MESSAGE_CREATE', this.onMessage);
      if (socket) {
        socket.close();
      }
    },

    getSettingsPanel: () => {
      const panel = document.createElement('div');
      applyStyles(panel, {
        padding: '10px',
        fontFamily: 'Arial, sans-serif',
        color: '#fff',
        backgroundColor: '#36393f',
        borderRadius: '8px'
      });

      // WebSocket Address input field
      const wsAddressContainer = document.createElement('div');
      applyStyles(wsAddressContainer, { marginBottom: '15px' });
      const wsAddressLabel = document.createElement('label');
      wsAddressLabel.textContent = 'WebSocket Address:';
      applyStyles(wsAddressLabel, { display: 'block', marginBottom: '5px', fontWeight: 'bold' });
      wsAddressContainer.appendChild(wsAddressLabel);

      const wsAddressInput = document.createElement('input');
      wsAddressInput.type = 'text';
      wsAddressInput.placeholder = 'Enter WebSocket Address';
      wsAddressInput.value = webSocketAddress;
      applyStyles(wsAddressInput, {
        width: '100%',
        padding: '8px',
        borderRadius: '5px',
        border: '1px solid #ccc',
        backgroundColor: '#2f3136',
        color: '#fff'
      });
      wsAddressInput.addEventListener('input', (event) => {
        updateWebSocketAddress(event.target.value);
      });
      wsAddressContainer.appendChild(wsAddressInput);
      panel.appendChild(wsAddressContainer);

      // Channel ID input field
      const channelIdContainer = document.createElement('div');
      applyStyles(channelIdContainer, { marginBottom: '15px' });
      const channelIdLabel = document.createElement('label');
      channelIdLabel.textContent = 'Channel IDs (comma-separated):';
      applyStyles(channelIdLabel, { display: 'block', marginBottom: '5px', fontWeight: 'bold' });
      channelIdContainer.appendChild(channelIdLabel);

      const channelIdInput = document.createElement('input');
      channelIdInput.type = 'text';
      channelIdInput.placeholder = 'Enter Channel IDs';
      channelIdInput.value = listenChannelId.join(", ");
      applyStyles(channelIdInput, {
        width: '100%',
        padding: '8px',
        borderRadius: '5px',
        border: '1px solid #ccc',
        backgroundColor: '#2f3136',
        color: '#fff'
      });
      channelIdInput.addEventListener('input', (event) => {
        updateListenChannel(event.target.value);
      });
      channelIdContainer.appendChild(channelIdInput);
      panel.appendChild(channelIdContainer);

      // Self User ID input field
      const selfUserIdContainer = document.createElement('div');
      applyStyles(selfUserIdContainer, { marginBottom: '15px' });
      const selfUserIdLabel = document.createElement('label');
      selfUserIdLabel.textContent = 'Your Discord User ID (to exclude your messages):';
      applyStyles(selfUserIdLabel, { display: 'block', marginBottom: '5px', fontWeight: 'bold' });
      selfUserIdContainer.appendChild(selfUserIdLabel);

      const selfUserIdInput = document.createElement('input');
      selfUserIdInput.type = 'text';
      selfUserIdInput.placeholder = 'Enter Your User ID';
      selfUserIdInput.value = selfUserId;
      applyStyles(selfUserIdInput, {
        width: '100%',
        padding: '8px',
        borderRadius: '5px',
        border: '1px solid #ccc',
        backgroundColor: '#2f3136',
        color: '#fff'
      });
      selfUserIdInput.addEventListener('input', (event) => {
        updateSelfUserId(event.target.value);
      });
      selfUserIdContainer.appendChild(selfUserIdInput);
      panel.appendChild(selfUserIdContainer);

      // Reconnect button
      const reconnectButton = document.createElement('button');
      reconnectButton.textContent = 'Reconnect to WebSocket Server';
      applyStyles(reconnectButton, {
        padding: '10px 15px',
        backgroundColor: '#7289da',
        color: '#fff',
        border: 'none',
        borderRadius: '5px',
        cursor: 'pointer',
        marginBottom: '10px'
      });
      reconnectButton.addEventListener('click', () => {
        defaultWebSocketAddress = webSocketAddress; // Update the WebSocket address
        connectWebSocket();
        BdApi.showToast('Reconnected to WebSocket server', { type: 'info' });
      });
      panel.appendChild(reconnectButton);

      // Save button
      const saveButton = document.createElement('button');
      saveButton.textContent = 'Save Settings';
      applyStyles(saveButton, {
        padding: '10px 15px',
        backgroundColor: '#43b581',
        color: '#fff',
        border: 'none',
        borderRadius: '5px',
        cursor: 'pointer'
      });
      saveButton.addEventListener('click', () => {
        BdApi.saveData(meta.name, 'listenChannelId', listenChannelId);
        BdApi.saveData(meta.name, 'selfUserId', selfUserId);
        BdApi.saveData(meta.name, 'webSocketAddress', webSocketAddress);
        BdApi.showToast('Settings saved', { type: 'success' });
      });
      panel.appendChild(saveButton);

      return panel;
    }
  };
};
