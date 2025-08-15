# Beefree SDK Liquid Demo

A comprehensive React-based demonstration of how to integrate Beefree SDK with Liquid templating for advanced email personalization and dynamic content creation.

## Project Overview

This project showcases how to build a powerful email editor that combines Beefree SDK's visual editing capabilities with Liquid templating for dynamic, personalized email content. Built with React and the modern `@beefree.io/sdk` package, it's designed for developers and teams who need to create sophisticated email campaigns with conditional content, product loops, and personalized messaging.

### What's Included

- **React Application**: Modern React-based email editor
- **Beefree SDK Integration**: Using the official `@beefree.io/sdk` npm package
- **Liquid Templating**: Support for dynamic content and personalization
- **Display Conditions**: Conditional content based on customer data
- **Custom Rows**: Pre-built email templates with Liquid integration
- **Content Dialogs**: Custom modals for enhanced user experience
- **Merge Tags**: Drag-and-drop personalization fields
- **Product Loops**: Dynamic product recommendations and abandoned cart items

### File Structure

```
Liquid/
├── src/
│   ├── App.jsx              # Main React component with Beefree SDK integration
│   ├── main.jsx             # React entry point
│   └── index.css            # Application styles
├── public/
│   └── template.json        # Default email template
├── index.html               # HTML entry point for React app
├── vite.config.js           # Vite configuration
├── proxy-server.js          # Backend server for authentication and API calls
├── package.json             # Node.js dependencies
└── README.md                # This file
```

### Target Audience

This project is designed for:
- **Email Developers** who need advanced personalization features
- **Marketing Teams** creating dynamic, data-driven campaigns
- **Developers** integrating email functionality into their applications
- **Agencies** building custom email solutions for clients

## Liquid Overview

Liquid is a template language created by Shopify that allows you to create dynamic content by embedding simple logic and variables into your templates. It's widely used in email marketing for personalization and conditional content.

### Key Features

- **Variables**: `{{ customer.first_name }}`
- **Conditionals**: `{% if customer.is_vip %}...{% endif %}`
- **Loops**: `{% for product in products %}...{% endfor %}`
- **Filters**: `{{ product.price | money }}`
- **Comments**: `{% comment %}...{% endcomment %}`

### Why Liquid for Email?

Liquid is particularly well-suited for email personalization because it:
- Supports complex conditional logic
- Handles loops for dynamic content (products, recommendations)
- Provides built-in filters for formatting
- Is language-agnostic and widely supported
- Integrates seamlessly with CRM and e-commerce platforms

## Beefree SDK Overview

Beefree SDK is a powerful JavaScript library that provides a complete email editor experience. It's designed to be embedded into web applications, offering a visual drag-and-drop interface for creating professional email campaigns. This project uses the official `@beefree.io/sdk` npm package for modern React integration.

### Key Capabilities

- **Visual Editor**: Intuitive drag-and-drop interface
- **Responsive Design**: Mobile-first email creation
- **Template Library**: Pre-built templates and components
- **Custom Content**: Support for custom rows and modules
- **API Integration**: Seamless backend connectivity
- **Multi-language**: Language-agnostic implementation
- **Modern React Support**: Official npm package with TypeScript support

### Why Beefree SDK + Liquid?

The combination of Beefree SDK and Liquid creates a powerful email personalization platform:

1. **Visual Editing**: Users can design emails visually while incorporating dynamic content
2. **Real-time Preview**: See how personalization will look with sample data
3. **Flexible Logic**: Complex conditional content and loops
4. **Scalable**: Handle large datasets and complex personalization rules
5. **Developer-Friendly**: Easy to integrate and customize

## Project Implementation

This project demonstrates several key integration patterns for creating a sophisticated email personalization system.

### Beefree SDK Configuration

The core configuration includes merge tags, display conditions, content dialogs, and custom modals. This example shows the React implementation using the modern `@beefree.io/sdk` package:

```javascript
import BeefreeSDK from '@beefree.io/sdk';

// Beefree SDK configuration
const beeConfig = {
  container: 'beefree-sdk-container',
  language: 'en-US',
  enabledAdvancedPreview: true,
  trackChanges: true,
  
  // Merge tags for personalization
  mergeTags: MERGE_TAGS,
  
  // Content dialog for custom functionality
  contentDialog: {
    rowDisplayConditions: {
      label: 'Display Conditions',
      handler: async function(resolve, reject) {
        // Custom modal implementation
      }
    },
    externalContentURLs: {
      label: 'Load Custom Rows',
      handler: function(resolve, reject) {
        // Custom rows loading
      }
    }
  },
  
  // Rows configuration
  rowsConfiguration: {
    emptyRows: true,
    defaultRows: true,
    selectedRowType: 'Personalization Rows',
    externalContentURLs: [
      {
        name: 'Beefree SDK Demo Custom Rows',
        value: 'https://qa-bee-playground-backend.getbee.io/api/customrows/?ids=1,2,3,4'
      }
    ]
  }
};

// Initialize the editor using the constructor and start method
const BeefreeSDKInstance = new BeefreeSDK(v2Token);
const instance = await BeefreeSDKInstance.start(beeConfig, templateJson, '', { shared: false });
```

### Merge Tags Integration

Merge tags provide drag-and-drop personalization fields:

```javascript
const MERGE_TAGS = [
  // Customer data
  { name: "{{ customer.first_name }}", value: "{{ customer.first_name }}" },
  { name: "{{ customer.email }}", value: "{{ customer.email }}" },
  { name: "{{ customer.favorite_color }}", value: "{{ customer.favorite_color }}" },
  
  // Order data
  { name: "{{ last_order.total_price | money }}", value: "{{ last_order.total_price | money }}" },
  
  // Product data (for loops)
  { name: "{{ item.product_name }}", value: "{{ item.product_name }}" },
  { name: "{{ item.price | money }}", value: "{{ item.price | money }}" },
  
  // Shop data
  { name: "{{ shop.name }}", value: "{{ shop.name }}" }
];
```

### Display Conditions

Display conditions allow for conditional content based on customer data:

```javascript
function getDisplayUseCases() {
  return [
    {
      type: 'Personalization',
      name: 'Display if favorite color = green',
      description: 'Show row only to customers who prefer green',
      before: "{% if customer.favorite_color == 'green' %}",
      after: '{% endif %}'
    },
    {
      type: 'Personalization',
      name: 'Loop — Abandoned cart items',
      description: 'Repeat row for each item in abandoned cart',
      before: '{% for item in customer.abandoned_cart %}',
      after: '{% endfor %}'
    },
    {
      type: 'Personalization',
      name: 'Display if VIP',
      description: 'Show row only for VIP customers',
      before: '{% if customer.is_vip %}',
      after: '{% endif %}'
    }
  ];
}
```

### Custom Content Dialog

The content dialog provides a custom modal for selecting display conditions:

```javascript
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
    }
  };
}
```

## Customization Guide

### Creating Custom Modals

To create a custom modal that integrates with Beefree SDK content dialog:

```javascript
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
    
    // Event handlers
    modal.querySelector('#uc-cancel').onclick = () => {
      modal.remove();
      reject(new Error('cancelled'));
    };
    
    modal.querySelector('#uc-select').onclick = () => {
      const checked = modal.querySelector('input[name="ucase"]:checked');
      if (!checked) {
        modal.remove();
        reject(new Error('no_selection'));
        return;
      }
      const idx = Number(checked.value);
      const it = items[idx];
      modal.remove();
      resolve({
        type: it.type,
        label: it.name,
        description: it.description,
        before: it.before,
        after: it.after
      });
    };
  });
}
```

### Adding New Merge Tags

To add new merge tags for different data sources:

```javascript
// Add to MERGE_TAGS array
const MERGE_TAGS = [
  // Existing tags...
  
  // New custom tags
  { name: "{{ customer.loyalty_points }}", value: "{{ customer.loyalty_points }}" },
  { name: "{{ customer.last_purchase_date }}", value: "{{ customer.last_purchase_date | date: '%B %d, %Y' }}" },
  { name: "{{ campaign.name }}", value: "{{ campaign.name }}" },
  { name: "{{ store.location }}", value: "{{ store.location }}" }
];
```

### Custom Display Conditions

Create new display conditions for different use cases:

```javascript
function getCustomDisplayUseCases() {
  return [
    {
      type: 'Loyalty',
      name: 'High-value customers',
      description: 'Show content only to customers with 1000+ loyalty points',
      before: '{% if customer.loyalty_points >= 1000 %}',
      after: '{% endif %}'
    },
    {
      type: 'Geography',
      name: 'Local store promotion',
      description: 'Show store-specific content based on location',
      before: "{% if customer.default_address.city == 'New York' %}",
      after: '{% endif %}'
    },
    {
      type: 'Behavior',
      name: 'Recent purchasers',
      description: 'Target customers who bought in the last 30 days',
      before: "{% if customer.last_purchase_date >= 'now' | date: '%s' | minus: 2592000 %}",
      after: '{% endif %}'
    }
  ];
}
```

## Detailed Example: Product Loops with Display Conditions

This example demonstrates how to create dynamic product loops with conditional content, based on the [Beefree for Klaviyo article](https://support.beefree.io/hc/en-us/articles/20739290016914-Adding-Dynamic-Content-in-Beefree-for-Klaviyo).

### Use Case: Abandoned Cart Recovery

Create an email that shows abandoned cart items with personalized recommendations and conditional content.

#### 1. Setup the Product Loop Structure

```liquid
{% for item in customer.abandoned_cart %}
  <!-- Product row content -->
  <div class="product-item">
    <img src="{{ item.image }}" alt="{{ item.product_name }}" />
    <h3>{{ item.product_name }}</h3>
    <p class="price">{{ item.price | money }}</p>
    <p class="quantity">Quantity: {{ item.quantity }}</p>
    <a href="{{ item.product_url }}" class="cta-button">Add to Cart</a>
  </div>
{% endfor %}
```

#### 2. Add Conditional Content

```liquid
{% if customer.abandoned_cart.size > 0 %}
  <!-- Show abandoned cart content -->
  <h2>Complete Your Purchase</h2>
  <p>Hi {{ customer.first_name }}, you left some items in your cart!</p>
  
  {% for item in customer.abandoned_cart %}
    <!-- Product loop content -->
  {% endfor %}
  
  {% if customer.abandoned_cart.size >= 3 %}
    <!-- Special offer for multiple items -->
    <div class="special-offer">
      <p>Get 15% off when you complete your purchase today!</p>
      <p>Use code: COMPLETE15</p>
    </div>
  {% endif %}
  
{% else %}
  <!-- Fallback content -->
  <h2>Shop Our Latest Collection</h2>
  <p>Hi {{ customer.first_name }}, check out our newest arrivals!</p>
{% endif %}
```

#### 3. Implement in Beefree SDK

Create a custom row with this structure:

```javascript
const abandonedCartRow = {
  name: 'Abandoned Cart Items',
  colStackOnMobile: true,
  'display-condition': {
    type: 'Personalization',
    label: 'Abandoned cart loop',
    description: 'Show abandoned cart items with conditional offers',
    before: '{% for item in customer.abandoned_cart %}',
    after: '{% endfor %}'
  },
  columns: [
    {
      'grid-columns': 12,
      modules: [
        {
          type: 'mailup-bee-newsletter-modules-image',
          descriptor: {
            image: {
              src: '{{ item.image }}',
              href: '{{ item.product_url }}',
              target: '_blank',
              alt: '{{ item.product_name }}'
            }
          }
        },
        {
          type: 'mailup-bee-newsletter-modules-paragraph',
          descriptor: {
            paragraph: {
              html: '<h3>{{ item.product_name }}</h3><p class="price">{{ item.price | money }}</p><p>Quantity: {{ item.quantity }}</p>'
            }
          }
        },
        {
          type: 'mailup-bee-newsletter-modules-button',
          descriptor: {
            button: {
              text: 'Add to Cart',
              link: {
                href: '{{ item.product_url }}',
                target: '_blank'
              }
            }
          }
        }
      ]
    }
  ]
};
```

#### 4. Add Conditional Offers

Create additional rows for special offers:

```javascript
const specialOfferRow = {
  name: 'Special Offer for Multiple Items',
  colStackOnMobile: true,
  'display-condition': {
    type: 'Personalization',
    label: 'Multiple items offer',
    description: 'Show special offer when cart has 3+ items',
    before: '{% if customer.abandoned_cart.size >= 3 %}',
    after: '{% endif %}'
  },
  columns: [
    {
      'grid-columns': 12,
      modules: [
        {
          type: 'mailup-bee-newsletter-modules-paragraph',
          descriptor: {
            paragraph: {
              html: '<div class="special-offer"><h3>🎉 Special Offer!</h3><p>Get 15% off when you complete your purchase today!</p><p><strong>Use code: COMPLETE15</strong></p></div>'
            }
          }
        }
      ]
    }
  ]
};
```

### Testing the Implementation

1. **Load sample data** with abandoned cart items
2. **Preview the email** to see how the loop renders
3. **Test different scenarios** (empty cart, single item, multiple items)
4. **Verify conditional content** appears correctly

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Beefree SDK credentials

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd Liquid
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
# Create .env file with your Beefree credentials
BEE_CLIENT_ID=your_client_id
BEE_CLIENT_SECRET=your_client_secret
BEE_API_KEY=your_api_key
```

4. Start the development servers:
```bash
# Start both the proxy server and React dev server
npm start

# Or start them separately:
npm run server  # Starts proxy server on port 3001
npm run dev     # Starts React dev server on port 3000
```

5. Open your browser to `http://localhost:3000`

### Development

The application uses:
- **Vite**: Fast React development server
- **React**: Modern UI framework
- **@beefree.io/sdk**: Official Beefree SDK npm package
- **Proxy Server**: Backend for authentication and API calls

The React app runs on port 3000 and proxies API calls to the backend server on port 3001.

### Configuration

The main configuration is in `src/App.jsx`. Key areas to customize:

- **Merge Tags**: Add your custom data fields in the `MERGE_TAGS` array
- **Display Conditions**: Create conditional logic for your use cases in `getDisplayUseCases()`
- **Custom Rows**: Define your pre-built templates in the `rowsConfiguration`
- **Content Dialogs**: Build custom user interfaces in `makeContentDialog()`

## Best Practices

### Performance

- **Lazy load** custom rows when needed
- **Cache** frequently used templates
- **Optimize** images and assets
- **Minimize** API calls

### User Experience

- **Clear labeling** for merge tags and conditions
- **Helpful descriptions** for display conditions
- **Consistent styling** across custom modals
- **Accessible design** with proper contrast and focus states

### Code Organization

- **Modular functions** for different features
- **Consistent naming** conventions
- **Error handling** for all async operations
- **Documentation** for custom implementations

## Troubleshooting

### Common Issues

1. **Beefree SDK not loading**: Check script URL and network connectivity
2. **Authentication errors**: Verify credentials in .env file
3. **Custom rows not appearing**: Check externalContentURLs configuration
4. **Display conditions not working**: Verify Liquid syntax and data structure

### Debug Mode

Enable debug logging by adding to the console:

```javascript
console.log('Beefree SDK Debug:', {
  config: beeConfig,
  mergeTags: MERGE_TAGS,
  displayConditions: getDisplayUseCases()
});
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For questions and support:
- Check the [Beefree SDK documentation](https://docs.beefree.io/)
- Review the [Liquid documentation](https://shopify.github.io/liquid/)
- Open an issue in this repository

---

**Happy coding! 🚀**
