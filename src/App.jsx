import React, { useEffect, useRef, useState } from 'react';
import BeefreeSDK from '@beefree.io/sdk';

// Merge tags: personal, order, product, and other common Liquid
const MERGE_TAGS = [
  // Make the name equal to the Liquid for visible drag/drop syntax
  { name: "{{ customer.first_name }}", value: "{{ customer.first_name }}" },
  { name: "{{ customer.last_name }}", value: "{{ customer.last_name }}" },
  { name: "{{ customer.email }}", value: "{{ customer.email }}" },
  { name: "{{ customer.phone }}", value: "{{ customer.phone }}" },
  { name: "{{ customer.default_address.city }}", value: "{{ customer.default_address.city }}" },
  { name: "{{ customer.default_address.country }}", value: "{{ customer.default_address.country }}" },
  { name: "{{ customer.tags }}", value: "{{ customer.tags }}" },
  { name: "{{ customer.favorite_color }}", value: "{{ customer.favorite_color }}" },
  // Order details
  { name: "{{ last_order.id }}", value: "{{ last_order.id }}" },
  { name: "{{ last_order.name }}", value: "{{ last_order.name }}" },
  { name: "{{ last_order.created_at }}", value: "{{ last_order.created_at }}" },
  { name: "{{ last_order.total_price | money }}", value: "{{ last_order.total_price | money }}" },
  { name: "{{ last_order.shipping_address.address1 }}", value: "{{ last_order.shipping_address.address1 }}" },
  { name: "{{ last_order.shipping_address.city }}", value: "{{ last_order.shipping_address.city }}" },
  { name: "{{ last_order.shipping_address.country }}", value: "{{ last_order.shipping_address.country }}" },
  // Product (loop item) details
  { name: "{{ item.product_name }}", value: "{{ item.product_name }}" },
  { name: "{{ item.title }}", value: "{{ item.title }}" },
  { name: "{{ item.price | money }}", value: "{{ item.price | money }}" },
  { name: "{{ item.image }}", value: "{{ item.image }}" },
  { name: "{{ item.quantity }}", value: "{{ item.quantity }}" },
  { name: "{{ item.product_url }}", value: "{{ item.product_url }}" },
  // Recommendation loop (product)
  { name: "{{ product.title }}", value: "{{ product.title }}" },
  { name: "{{ product.price | money }}", value: "{{ product.price | money }}" },
  { name: "{{ product.image }}", value: "{{ product.image }}" },
  { name: "{{ product.url }}", value: "{{ product.url }}" },
  // Other common
  { name: "{{ shop.name }}", value: "{{ shop.name }}" },
  { name: "{{ shop.url }}", value: "{{ shop.url }}" },
  { name: "{{ 'now' | date: '%Y-%m-%d' }}", value: "{{ 'now' | date: '%Y-%m-%d' }}" },
  { name: "{{ unsubscribe_url }}", value: "{{ unsubscribe_url }}" },
  { name: "{{ preference_center_url }}", value: "{{ preference_center_url }}" }
];

function getDisplayUseCases() {
  return [
    { type: 'Personalization', name: 'Display if favorite color = green', description: 'Show row only to customers who prefer green', before: "{% if customer.favorite_color == 'green' %}", after: '{% endif %}' },
    { type: 'Personalization', name: 'Display if favorite color = yellow', description: 'Show row only to customers who prefer yellow', before: "{% if customer.favorite_color == 'yellow' %}", after: '{% endif %}' },
    { type: 'Personalization', name: 'Loop — Abandoned cart items', description: 'Repeat row for each item in abandoned cart', before: '{% for item in customer.abandoned_cart %}', after: '{% endfor %}' },
    { type: 'Personalization', name: 'Loop — Recommendations', description: 'Repeat row for each recommended product', before: '{% for product in products %}', after: '{% endfor %}' },
    { type: 'Personalization', name: 'Display if VIP', description: 'Show row only for VIP customers', before: '{% if customer.is_vip %}', after: '{% endif %}' }
  ];
}

function openUseCaseModal(items) {
  return new Promise((resolve, reject) => {
    const modal = document.createElement('div');
    modal.className = 'modal';
    const list = items.map((it, idx) => `
      <label style="display:block;border:1px solid var(--border);border-radius:10px;padding:10px;margin-bottom:8px;background:#0a122e">
        <div style="display:flex;gap:10px;align-items:flex-start">
          <input type="radio" name="ucase" value="${idx}" style="margin-top:4px" />
          <div>
            <div style="font-weight:800">${it.name}</div>
            <div style="color:#94a3b8;margin:4px 0">${it.description}</div>
            <pre style="white-space:pre-wrap;background:#0b1230;border:1px dashed #233159;border-radius:8px;padding:8px;">before: ${it.before}\nafter:  ${it.after}</pre>
          </div>
        </div>
      </label>`).join('');
    modal.innerHTML = `
      <div class="modal-content">
        <h3 style="margin-bottom:8px">Select a display condition</h3>
        <div style="max-height:420px;overflow:auto">${list}</div>
        <div class="modal-actions">
          <button id="uc-cancel" class="btn">Cancel</button>
          <button id="uc-select" class="btn primary">Select</button>
        </div>
      </div>`;
    document.body.appendChild(modal);
    modal.style.display = 'block';
    modal.querySelector('#uc-cancel').onclick = () => { modal.remove(); reject(new Error('cancelled')); };
    modal.querySelector('#uc-select').onclick = () => {
      const checked = modal.querySelector('input[name="ucase"]:checked');
      if (!checked) { modal.remove(); reject(new Error('no_selection')); return; }
      const idx = Number(checked.value);
      const it = items[idx];
      modal.remove();
      resolve({ type: it.type, label: it.name, description: it.description, before: it.before, after: it.after });
    };
  });
}

function makeContentDialog() {
  return {
    rowDisplayConditions: {
      label: 'Display Conditions',
      handler: async function(resolve, reject) {
        try {
          const result = await openUseCaseModal(getDisplayUseCases());
          resolve(result);
        } catch (e) {
          reject(e);
        }
      }
    },
    externalContentURLs: {
      label: 'Load Custom Rows',
      handler: function(resolve, reject) {
        // Show a modal to let users choose or immediately load
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
          <div class="modal-content" style="position: relative; max-width: 480px;">
            <button id="modal-close" style="position: absolute; top: 16px; right: 16px; background: none; border: none; color: #94a3b8; font-size: 24px; cursor: pointer; font-weight: bold; line-height: 1; padding: 0; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; border-radius: 6px; transition: all 0.2s ease;">&times;</button>
            
            <h3 style="margin: 0 0 12px 0; color: #e2e8f0; font-family: 'Inter', sans-serif; font-weight: 600; font-size: 20px;">Pre-built Rows</h3>
            <p style="margin: 0 0 24px 0; color: #94a3b8; font-family: 'Inter', sans-serif; font-size: 14px; line-height: 1.5;">Ready-to-use email row templates that you can drag and drop into your email design.</p>
            
            <div style="display: flex; gap: 12px; justify-content: flex-end;">
              <button id="load-immediate" style="background: linear-gradient(135deg, #6c8cff, #22d3ee); color: white; border: none; padding: 12px 24px; border-radius: 12px; cursor: pointer; font-family: 'Inter', sans-serif; font-weight: 600; font-size: 14px; letter-spacing: 0.025em; box-shadow: 0 4px 16px rgba(108,140,255,0.35); transition: all 0.2s ease; min-width: 120px;">Load Rows</button>
            </div>
          </div>
        `;
        document.body.appendChild(modal);
        modal.style.display = 'block';
        
        // Add hover effects
        const loadButton = modal.querySelector('#load-immediate');
        const closeButton = modal.querySelector('#modal-close');
        
        loadButton.addEventListener('mouseenter', () => {
          loadButton.style.transform = 'translateY(-1px)';
          loadButton.style.boxShadow = '0 6px 20px rgba(108,140,255,0.45)';
        });
        
        loadButton.addEventListener('mouseleave', () => {
          loadButton.style.transform = 'translateY(0)';
          loadButton.style.boxShadow = '0 4px 16px rgba(108,140,255,0.35)';
        });
        
        closeButton.addEventListener('mouseenter', () => {
          closeButton.style.backgroundColor = 'rgba(148, 163, 184, 0.1)';
          closeButton.style.color = '#e2e8f0';
        });
        
        closeButton.addEventListener('mouseleave', () => {
          closeButton.style.backgroundColor = 'transparent';
          closeButton.style.color = '#94a3b8';
        });
        
        loadButton.onclick = () => {
          modal.remove();
          resolve({
            name: 'Beefree SDK Demo Custom Rows',
            value: 'https://qa-bee-playground-backend.getbee.io/api/customrows/?ids=1,2,3,4'
          });
        };
        
        closeButton.onclick = () => {
          modal.remove();
          reject(new Error('cancelled'));
        };
      }
    }
  };
}

function App() {
  const containerRef = useRef(null);
  const [beeInstance, setBeeInstance] = useState(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [htmlInput, setHtmlInput] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sdkLoaded, setSdkLoaded] = useState(false);

  // Change tracking callbacks
  const handleOnChange = (jsonFile, response) => {
    try {
      console.log('[Beefree SDK:onChange] message:', jsonFile);
      console.log('[Beefree SDK:onChange] response:', response);
      localStorage.setItem('bee_last_change', JSON.stringify({ ts: Date.now(), response }));
    } catch (err) {
      console.warn('onChange handler error:', err);
    }
  };

  const handleOnRemoteChange = (jsonFile, response) => {
    try {
      console.log('[Beefree SDK:onRemoteChange] message:', jsonFile);
      console.log('[Beefree SDK:onRemoteChange] response:', response);
      localStorage.setItem('bee_last_remote_change', JSON.stringify({ ts: Date.now(), response }));
    } catch (err) {
      console.warn('onRemoteChange handler error:', err);
    }
  };

  const handleOnViewChange = (view) => {
    try {
      console.log('[Beefree SDK:onViewChange] view:', view);
      localStorage.setItem('bee_last_view', JSON.stringify({ ts: Date.now(), view }));
    } catch (err) {
      console.warn('onViewChange handler error:', err);
    }
  };

  const handleLoadRows = () => {
    if (beeInstance && typeof beeInstance.loadRows === 'function') {
      console.log('Loading custom rows...');
      beeInstance.loadRows();
    } else {
      console.warn('loadRows method not available');
    }
  };

  const handleImportHTML = async () => {
    const html = htmlInput.trim();
    if (!html || !html.includes('<') || !html.includes('>')) {
      setErrorMessage('HTML not valid');
      return;
    }
    setLoading(true);
    setErrorMessage('');
    try {
      const response = await fetch('/proxy/html-to-json', { 
        method: 'POST', 
        headers: { 'Content-Type': 'text/html' }, 
        body: html 
      });
      if (!response.ok) throw new Error('Conversion failed');
      const data = await response.json();
      beeInstance.load(data);
      setShowImportModal(false);
    } catch (error) {
      setErrorMessage('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const getBeeToken = async () => {
    const res = await fetch('/proxy/bee-auth', {
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' }, 
      body: JSON.stringify({ uid: 'demo-user' })
    });
    if (!res.ok) throw new Error('Auth failed');
    return await res.json();
  };

  useEffect(() => {
    async function initializeEditor() {
      try {
        console.log('Starting Beefree SDK initialization...');
        
        // Check if container exists
        const container = document.getElementById('beefree-sdk-container');
        console.log('Container found:', container);
        if (container) {
          console.log('Container dimensions:', container.offsetWidth, 'x', container.offsetHeight);
        }
        
        // Beefree SDK configuration
        const beeConfig = {
          container: 'beefree-sdk-container',
          language: 'en-US',
          enabledAdvancedPreview: true,
          trackChanges: true,
          onChange: handleOnChange,
          onRemoteChange: handleOnRemoteChange,
          onViewChange: handleOnViewChange,
          specialLinks: [
            { type: 'Frequently used', label: 'Unsubscribe link', link: 'http://[unsubscribe]/' },
            { type: 'Frequently used', label: 'Preference center link', link: 'http://[preference_center]/' }
          ],
          mergeTags: MERGE_TAGS,
          contentDialog: makeContentDialog(),
          rowsConfiguration: {
            emptyRows: true,
            defaultRows: true,
            selectedRowType: 'Personalization Rows',
            externalContentURLs: [
              { name: 'Beefree SDK Demo Custom Rows', value: 'https://qa-bee-playground-backend.getbee.io/api/customrows/?ids=1,2,3,4' }
            ]
          },
          onError: function(error) {
            console.error('Beefree SDK Error:', error);
            if (error.code === 5101 || error.code === 5102) {
              (async () => {
                const token = await getBeeToken();
                if (error.code === 5101) {
                  beeInstance.updateToken(token);
                } else if (error.code === 5102) {
                  // Reinitialize if needed
                  console.log('Reinitializing Beefree SDK...');
                }
              })();
            }
          }
        };

        // Get a token from your backend
        const token = await getBeeToken();
        console.log('Got token:', token ? 'success' : 'failed');

        // Load provided template from public folder
        const templateJson = await fetch('/template.json')
          .then((r) => (r.ok ? r.json() : undefined))
          .catch(() => undefined);
        console.log('Loaded template:', templateJson ? 'success' : 'failed');

        // Ensure token includes v2 flag per best practices
        const v2Token = { ...token, v2: true };

        // Initialize the editor using the constructor and start promise
        console.log('Creating BeefreeSDK instance...');
        const BeefreeSDKInstance = new BeefreeSDK(v2Token);
        console.log('BeefreeSDK instance created:', BeefreeSDKInstance);
        
        console.log('Starting BeefreeSDK...');
        const instance = await BeefreeSDKInstance.start(beeConfig, templateJson, '', { shared: false });
        console.log('BeefreeSDK instance returned:', instance);
        
        setBeeInstance(instance);
        setSdkLoaded(true);
        console.log('Beefree SDK started successfully!');
      } catch (error) {
        console.error('Beefree SDK initialization error:', error);
      }
    }

    // Add a small delay to ensure DOM is ready
    setTimeout(() => {
      initializeEditor();
    }, 100);
  }, []);

  return (
    <>
      <header>
        <button className="btn" onClick={() => setShowImportModal(true)}>
          Import HTML
        </button>
        <button className="btn" onClick={handleLoadRows} style={{ marginLeft: '8px' }}>
          Load External Rows
        </button>
      </header>
      <main>
        <div 
          id="beefree-sdk-container" 
          ref={containerRef}
          style={{ 
            position: 'absolute', 
            top: '0',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '90%', 
            height: '100%',
            minHeight: '700px',
            background: '#ffffff'
          }}
        >
          <div style={{ padding: '20px', color: '#000' }}>
            {sdkLoaded ? 'Beefree SDK loaded!' : 'Loading Beefree SDK...'}
          </div>
        </div>
      </main>

      {/* HTML Import Modal */}
      {showImportModal && (
        <div className="modal" style={{ display: 'block' }}>
          <div className="modal-content">
            <h3>Paste your HTML below</h3>
            <textarea
              id="html-input"
              placeholder="Paste your HTML here..."
              value={htmlInput}
              onChange={(e) => setHtmlInput(e.target.value)}
            />
            {errorMessage && (
              <div className="error-message" style={{ display: 'block' }}>
                {errorMessage}
              </div>
            )}
            {loading && (
              <div className="loading" style={{ display: 'block' }}>
                Converting HTML, please wait...
              </div>
            )}
            <div className="modal-actions">
              <button className="btn" onClick={() => setShowImportModal(false)}>
                Cancel
              </button>
              <button className="btn primary" onClick={handleImportHTML}>
                Upload
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default App;
