const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');
const fs = require('fs');
require('dotenv').config();
const nodemailer = require('nodemailer');

const app = express();
const PORT = process.env.PORT || 3001;

// Beefree credentials from env
const {
  BEE_CLIENT_ID,
  BEE_CLIENT_SECRET,
  BEE_API_KEY,
  BEE_CONVERSION_API_KEY,
  SMTP_HOST,
  SMTP_PORT,
  SMTP_SECURE,
  SMTP_USER,
  SMTP_PASS,
  SMTP_FROM
} = process.env;

if (!BEE_CLIENT_ID || !BEE_CLIENT_SECRET || !BEE_API_KEY) {
  console.warn('Warning: Missing Beefree credentials in environment. Set BEE_CLIENT_ID, BEE_CLIENT_SECRET, BEE_API_KEY in .env');
}

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.text({ 
  type: 'text/html',
  limit: '50mb'
}));
app.use(express.static(path.join(__dirname)));

// NEW: Beefree Auth V2 endpoint
app.post('/proxy/bee-auth', async (req, res) => {
  try {
    const { uid } = req.body;
    
    const response = await axios.post(
      'https://auth.getbee.io/loginV2',
      {
        client_id: BEE_CLIENT_ID,
        client_secret: BEE_CLIENT_SECRET,
        uid: uid || 'default-uid'
      },
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    
    res.json(response.data);
  } catch (error) {
    console.error('Auth error:', error.response?.data || error.message);
    res.status(500).json({ 
      error: 'Failed to authenticate with Beefree',
      details: error.response?.data || error.message
    });
  }
});

// Convert template JSON to HTML via Beefree Conversion API
app.post('/api/json-to-html', async (req, res) => {
  try {
    if (!BEE_CONVERSION_API_KEY) {
      return res.status(500).json({ error: 'Conversion API key missing' });
    }
    const templateJson = req.body;
    const response = await axios.post('https://api.getbee.io/v1/conversion/json-to-html', templateJson, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${BEE_CONVERSION_API_KEY}`
      },
      maxContentLength: Infinity,
      maxBodyLength: Infinity
    });
    res.json(response.data);
  } catch (err) {
    console.error('JSON to HTML error:', err.response?.data || err.message);
    res.status(500).json({ error: 'JSON to HTML failed', details: err.response?.data || err.message });
  }
});

// ORIGINAL HTML to JSON conversion endpoint (unchanged from your working version)
app.post('/proxy/html-to-json', async (req, res) => {
  try {
    const response = await axios.post(
      'https://api.getbee.io/v1/conversion/html-to-json',
      req.body,
      {
        headers: {
          'Content-Type': 'text/html',
          'Authorization': `Bearer ${BEE_API_KEY}`
        },
        maxContentLength: Infinity,
        maxBodyLength: Infinity
      }
    );
    res.json(response.data);
  } catch (error) {
    console.error('Proxy error:', error.message);
    res.status(500).json({ error: 'Failed to convert HTML to JSON' });
  }
});

// Demo data streams (focused on favorite_color + abandoned_cart loop)
app.get('/api/streams/green', (req, res) => {
  res.json({
    stream: 'green',
    customer: {
      email: 'greenlover@example.com',
      first_name: 'Casey',
      last_name: 'Green',
      favorite_color: 'green',
      abandoned_cart: [
        { product_name: 'Green t-shirt', price: 19.99, quantity: 1, image: 'https://media.istockphoto.com/id/1346570499/photo/smiling-climate-activists-in-public-park.jpg?s=612x612&w=0&k=20&c=5RLd1Dr-zPsSzqn4eZX1rOeqQcstlrJW0cIlYMsCKRo=', product_url: 'https://www.target.com/s/green+t+shirt' },
        { product_name: 'Green shorts', price: 29.99, quantity: 2, image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSqrblpnHi7gldR9rjWB5-GfJNAi_VFsueGdQ&s', product_url: 'https://www.target.com/s?searchTerm=green+shorts' }
      ]
    }
  });
});

app.get('/api/streams/yellow', (req, res) => {
  res.json({
    stream: 'yellow',
    customer: {
      email: 'yellowfan@example.com',
      first_name: 'Jordan',
      last_name: 'Yellow',
      favorite_color: 'yellow',
      abandoned_cart: [
        { product_name: 'Yellow t-shirt', price: 19.99, quantity: 1, image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT3VM83dh9a-yuMH5-yu8jeQZK6-nHGAI2bKg&s=', product_url: 'https://www.target.com/s/yellow+shirt' },
        { product_name: 'Yellow shorts', price: 29.99, quantity: 2, image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQCEiM412YUpO0mou51izxter00hOoF9Cs2e0kKjJSCSVMdiLNEYbI-5h15OPznoANBd3A&usqp=CAU', product_url: 'https://www.target.com/s/mens+yellow+shorts' }
      ]
    }
  });
});

// Additional demo stream: recommendations
app.get('/api/streams/recommendations', (req, res) => {
  res.json({
    stream: 'recommendations',
    customer: {
      email: 'shopper@example.com',
      first_name: 'Alex',
      last_name: 'Shopper',
      favorite_color: 'yellow',
      is_vip: true
    },
    products: [
      { title: 'Eco Hoodie', price: 49.0, image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518', url: 'https://example.com/p/eco-hoodie' },
      { title: 'Organic Tee', price: 19.0, image: 'https://images.unsplash.com/photo-1512436991641-6745cdb1723f', url: 'https://example.com/p/organic-tee' },
      { title: 'Canvas Tote', price: 15.0, image: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246', url: 'https://example.com/p/canvas-tote' }
    ]
  });
});

// External rows for Rows panel (use cases)
app.get('/api/rows/product-loop', (req, res) => {
  res.json([
    {
      name: 'Product Loop Row',
      colStackOnMobile: true,
      'display-condition': {
        type: 'Personalization',
        label: 'Product loop',
        description: 'Iterate items in customer.abandoned_cart',
        before: '{% for item in customer.abandoned_cart %}',
        after: '{% endfor %}'
      },
      columns: [
        {
          'grid-columns': 12,
          modules: [
            { type: 'mailup-bee-newsletter-modules-paragraph', descriptor: { paragraph: { html: '<p><strong>{{ item.product_name }}</strong><br/>Price: {{ item.price | money }}<br/>Qty: {{ item.quantity }}</p>' } } },
            { type: 'mailup-bee-newsletter-modules-image', descriptor: { image: { src: '{{ item.image }}', href: '{{ item.product_url }}', target: '_blank', alt: 'Product image' } } },
            { type: 'mailup-bee-newsletter-modules-button', descriptor: { button: { link: { href: '{{ item.product_url }}', target: '_blank' }, text: 'Buy now' } } }
          ]
        }
      ]
    }
  ]);
});

app.get('/api/rows/display-or-hide', (req, res) => {
  res.json([
    {
      name: 'Display if Favorite Color',
      colStackOnMobile: true,
      'display-condition': {
        type: 'Personalization',
        label: 'Display or hide',
        description: 'Display when customer.favorite_color matches',
        before: "{% if customer.favorite_color == 'green' %}",
        after: '{% endif %}'
      },
      columns: [
        {
          'grid-columns': 12,
          modules: [
            { type: 'mailup-bee-newsletter-modules-paragraph', descriptor: { paragraph: { html: '<p>Hi {{ customer.first_name }}, green deals just for you!</p>' } } }
          ]
        }
      ]
    }
  ]);
});

app.get('/api/rows/mixed-examples', (req, res) => {
  res.json([
    {
      name: 'Headline + CTA (Conditional)',
      colStackOnMobile: true,
      'display-condition': {
        type: 'Personalization',
        label: 'Display or hide',
        description: 'Show CTA to yellow lovers',
        before: "{% if customer.favorite_color == 'yellow' %}",
        after: '{% endif %}'
      },
      columns: [
        {
          'grid-columns': 12,
          modules: [
            { type: 'mailup-bee-newsletter-modules-paragraph', descriptor: { paragraph: { html: '<h3 style="text-align:center">Yellow Collection Picks</h3>' } } },
            { type: 'mailup-bee-newsletter-modules-button', descriptor: { button: { text: 'Shop now', link: { href: 'https://example.com/yellow' } } } }
          ]
        }
      ]
    }
  ]);
});


function clone(obj) { return JSON.parse(JSON.stringify(obj)); }

function replaceAllOccurrences(text, find, replaceWith) {
  if (!find) return text;
  const escaped = find.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return text.replace(new RegExp(escaped, 'g'), replaceWith);
}

// Send test email using Nodemailer with basic HTML content provided by client
app.post('/api/send-test', async (req, res) => {
  try {
    let { to, subject = 'Beefree Demo Test', html, replacements } = req.body || {};
    if (!to || !html) {
      return res.status(400).json({ error: 'Missing "to" or "html"' });
    }

    if (replacements && typeof replacements === 'object') {
      for (const [needle, value] of Object.entries(replacements)) {
        html = replaceAllOccurrences(html, needle, String(value ?? ''));
      }
    }

    let transporter;
    let fromAddress = SMTP_FROM || SMTP_USER;
    let usingEthereal = false;

    if (SMTP_HOST && SMTP_USER && SMTP_PASS) {
      transporter = nodemailer.createTransport({
        host: SMTP_HOST,
        port: Number(SMTP_PORT || 587),
        secure: String(SMTP_SECURE).toLowerCase() === 'true',
        auth: { user: SMTP_USER, pass: SMTP_PASS }
      });
    } else {
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: testAccount.smtp.host,
        port: testAccount.smtp.port,
        secure: testAccount.smtp.secure,
        auth: { user: testAccount.user, pass: testAccount.pass }
      });
      fromAddress = `Beefree Demo <${testAccount.user}>`;
      usingEthereal = true;
    }

    const info = await transporter.sendMail({
      from: fromAddress,
      to,
      subject,
      html
    });

    const previewUrl = nodemailer.getTestMessageUrl(info);
    res.json({ messageId: info.messageId, previewUrl: usingEthereal ? previewUrl : undefined, usingEthereal });
  } catch (err) {
    console.error('Send test email error:', err.message);
    res.status(500).json({ error: 'Failed to send test email', details: err.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Proxy server running on http://localhost:${PORT}`);
  console.log(`Access your HTML file at http://localhost:${PORT}/index.html`);
});

// Full Product Recommendations template JSON (modeled from provided template)
app.get('/api/templates/recommendations', (req, res) => {
  const tpl = {
    page: {
      body: templateJson.page.body,
      description: 'Recommendations email',
      rows: [
        // Hero/header from the first row
        clone(templateJson.page.rows[0]),
        // Greeting + VIP conditional
        {
          container: { style: { 'background-color': '#FFFFFF' } },
          content: { style: { 'background-color': 'transparent', color: '#000000' } },
          columns: [
            {
              'grid-columns': 12,
              style: { 'background-color': '#FFFFFF', 'padding-top': '20px', 'padding-bottom': '10px' },
              modules: [
                { type: 'mailup-bee-newsletter-modules-paragraph', descriptor: { paragraph: { html: '<p style="text-align:center">Hi {{ customer.first_name }}, we picked these for you.</p>' } } },
                { type: 'mailup-bee-newsletter-modules-paragraph', descriptor: { paragraph: { html: '<p style="text-align:center;color:#FBB51B"><strong>VIP early access</strong></p>' } } }
              ],
              'display-condition': {
                type: 'Personalization', label: 'Display or hide', description: 'VIP only', before: '{% if customer.is_vip %}', after: '{% endif %}'
              }
            }
          ]
        },
        // Recommendations loop
        {
          container: { style: { 'background-color': '#FFFFFF' } },
          content: { style: { 'background-color': 'transparent', color: '#000000' } },
          columns: [
            {
              'grid-columns': 12,
              style: { 'background-color': '#FFFFFF', 'padding-top': '10px', 'padding-bottom': '10px' },
              modules: [
                { type: 'mailup-bee-newsletter-modules-paragraph', descriptor: { paragraph: { html: '<h2 style="text-align:center">Recommended for you</h2>' } } },
                { type: 'mailup-bee-newsletter-modules-image', descriptor: { image: { src: '{{ product.image }}', href: '{{ product.url }}', target: '_blank', alt: 'Product' }, style: { 'padding-top': '10px', 'padding-bottom': '10px' } } },
                { type: 'mailup-bee-newsletter-modules-paragraph', descriptor: { paragraph: { html: '<p style="text-align:center"><strong>{{ product.title }}</strong><br/>{{ product.price | money }}</p>' } } },
                { type: 'mailup-bee-newsletter-modules-button', descriptor: { button: { text: 'Shop now', link: { href: '{{ product.url }}', target: '_blank' } } } }
              ],
              'display-condition': {
                type: 'Personalization', label: 'Product loop', description: 'Loop products', before: '{% for product in products %}', after: '{% endfor %}'
              }
            }
          ]
        },
        // Footer from last row
        clone(templateJson.page.rows[templateJson.page.rows.length - 1])
      ],
      template: { version: '2.0.0' },
      title: 'Product Recommendations'
    },
    comments: {}
  };
  res.json(tpl);
});