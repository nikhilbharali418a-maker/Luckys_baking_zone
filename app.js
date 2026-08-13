/**
 * luckys_baking_zone - Interactive Application Logic
 */

// Owner Information Configuration
const API_BASE = 'http://127.0.0.1:3016';

const OWNER_CONFIG = {
  name: "Lucky Singh (Owner & Master Baker)",
  phone: "+919365904191",
  displayPhone: "+91 93659 04191",
  whatsapp: "919365904191",
  address: "Shop #14, Royal Bakery Lane, Baker Street, Main Market",
  hours: "8:00 AM - 11:00 PM (Everyday)"
};

// UPI ID available for instant payments
OWNER_CONFIG.upi = 'nikhilbharali418a@okhdfcbank';

// Copy UPI to clipboard (used by checkout/owner UI)
function copyUpi() {
  if (!navigator.clipboard) {
    alert(`Please copy this UPI ID manually: ${OWNER_CONFIG.upi}`);
    return;
  }

  navigator.clipboard.writeText(OWNER_CONFIG.upi).then(() => {
    alert('UPI ID copied to clipboard: ' + OWNER_CONFIG.upi);
  }).catch(() => {
    alert(`Please copy this UPI ID manually: ${OWNER_CONFIG.upi}`);
  });
}

// Database of Cakes
const PRODUCTS = [
  {
    id: "c1",
    name: "Belgian Dark Chocolate Truffle",
    category: "truffles",
    priceBase: 650, // 0.5kg
    rating: 4.9,
    reviews: 142,
    badge: "Bestseller",
    isEggless: true,
    desc: "Rich 70% Belgian dark chocolate ganache layered between soft cocoa sponge cakes.",
    image: "images/chocolate_truffle.png"
  },
  {
    id: "c2",
    name: "Signature Berry & Dark Truffle",
    category: "signature",
    priceBase: 790,
    rating: 5.0,
    reviews: 98,
    badge: "Chef's Special",
    isEggless: true,
    desc: "Luxurious cocoa layers loaded with fresh strawberries, blueberries, and silky truffle drip.",
    image: "images/hero_cake.png"
  },
  {
    id: "c3",
    name: "Red Velvet Berry Cream Cheese",
    category: "birthday",
    priceBase: 750,
    rating: 4.8,
    reviews: 115,
    badge: "Trending",
    isEggless: true,
    desc: "Classic crimson sponge infused with Madagascar vanilla and layered with rich cream cheese.",
    image: "https://images.unsplash.com/photo-1586788680434-30d324b2d46f?auto=format&fit=crop&w=600&q=80"
  },
  {
    id: "c4",
    name: "Royal Rose Gold Wedding Tier",
    category: "wedding",
    priceBase: 2400, // 2kg base
    rating: 5.0,
    reviews: 45,
    badge: "Grand Tier",
    isEggless: false,
    desc: "Multi-tiered masterpiece adorned with edible gold leaf, soft pink macarons, and white florals.",
    image: "https://images.unsplash.com/photo-1535141192574-5d4897c13136?auto=format&fit=crop&w=600&q=80"
  },
  {
    id: "c5",
    name: "Alphonso Mango Sunshine Cheesecake",
    category: "cheesecakes",
    priceBase: 850,
    rating: 4.9,
    reviews: 86,
    badge: "Seasonal",
    isEggless: true,
    desc: "No-bake velvety cheesecake topped with fresh Alphonso mango glaze and butter biscuit base.",
    image: "https://images.unsplash.com/photo-1533134242443-d4fd215305ad?auto=format&fit=crop&w=600&q=80"
  },
  {
    id: "c6",
    name: "Lotus Biscoff Salted Caramel",
    category: "signature",
    priceBase: 820,
    rating: 4.9,
    reviews: 104,
    badge: "Top Rated",
    isEggless: true,
    desc: "Crushed Biscoff cookie crust, salted caramel drip, and creamy Biscoff spread layers.",
    image: "https://images.unsplash.com/photo-1565958011703-44f9829ba187?auto=format&fit=crop&w=600&q=80"
  },
  {
    id: "c7",
    name: "Assorted Gourmet Cupcake Box (6 Pcs)",
    category: "cupcakes",
    priceBase: 490,
    rating: 4.7,
    reviews: 73,
    badge: "Party Pack",
    isEggless: true,
    desc: "Box of 6 handcrafted cupcakes: Chocolate Fudge, Red Velvet, Vanilla Bean, and Nutella.",
    image: "https://images.unsplash.com/photo-1576618148400-f54bed99fcfd?auto=format&fit=crop&w=600&q=80"
  },
  {
    id: "c8",
    name: "Eggless Fresh Pineapple Delight",
    category: "eggless",
    priceBase: 580,
    rating: 4.8,
    reviews: 160,
    badge: "100% Pure Veg",
    isEggless: true,
    desc: "Light and airy vanilla sponge soaked in real pineapple juice with whipped cream and cherries.",
    image: "https://images.unsplash.com/photo-1542826438-bd32f43d626f?auto=format&fit=crop&w=600&q=80"
  }
];

// App State
let cart = [];
let currentCategory = 'all';
let searchQuery = '';
let egglessOnlyFilter = false;
let selectedWeights = {}; // product_id -> selected_multiplier (e.g. 1 for 0.5kg, 1.8 for 1kg, 3.4 for 2kg)

// Multiplier mapping for cake weights
const WEIGHT_OPTIONS = [
  { label: '0.5 kg', multiplier: 1 },
  { label: '1 kg', multiplier: 1.8 },
  { label: '2 kg', multiplier: 3.4 }
];

// Custom Cake Builder State
let customCakeState = {
  shape: 'Round',
  flavour: 'Belgian Chocolate Truffle',
  weight: '1 kg',
  frosting: 'Whipped Cream',
  topping: 'Fresh Berries & Chocolate Shavings',
  message: '',
  eggless: true,
  basePrice: 1200
};

// DOM Content Loaded Initialization
document.addEventListener('DOMContentLoaded', () => {
  renderMenu();
  setupEventListeners();
  updateCartUI();
  updateCustomBuilderPrice();
});

// Render Cake Menu
function renderMenu() {
  const grid = document.getElementById('productsGrid');
  if (!grid) return;

  let filtered = PRODUCTS.filter(product => {
    // Category filter
    const matchesCategory = currentCategory === 'all' || 
                            product.category === currentCategory || 
                            (currentCategory === 'eggless' && product.isEggless);
    
    // Search filter
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          product.desc.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Eggless filter
    const matchesEggless = !egglessOnlyFilter || product.isEggless;

    return matchesCategory && matchesSearch && matchesEggless;
  });

  if (filtered.length === 0) {
    grid.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 4rem 1rem; color: var(--text-muted);">
        <i class="fas fa-search" style="font-size: 3rem; margin-bottom: 1rem; color: var(--accent-gold);"></i>
        <h3>No delicious cakes found!</h3>
        <p>Try searching for another flavor or switch category tabs.</p>
      </div>
    `;
    return;
  }

  grid.innerHTML = filtered.map(product => {
    const currentWeightIdx = selectedWeights[product.id] || 0;
    const currentMultiplier = WEIGHT_OPTIONS[currentWeightIdx].multiplier;
    const finalPrice = Math.round(product.priceBase * currentMultiplier);

    return `
      <div class="product-card" data-id="${product.id}">
        <div class="card-image-wrap">
          <img src="${product.image}" alt="${product.name}" loading="lazy">
          ${product.badge ? `<span class="card-badge">${product.badge}</span>` : ''}
          ${product.isEggless ? `
            <div class="eggless-indicator" title="100% Eggless">
              <div class="eggless-dot"></div>
            </div>
          ` : ''}
        </div>
        <div class="card-content">
          <div class="card-rating">
            <i class="fas fa-star"></i>
            <span>${product.rating} (${product.reviews} reviews)</span>
          </div>
          <h3 class="card-title">${product.name}</h3>
          <p class="card-desc">${product.desc}</p>
          
          <div class="card-options">
            <span style="font-size: 0.8rem; font-weight: 700; color: var(--text-muted);">Weight:</span>
            <div class="weight-selector">
              ${WEIGHT_OPTIONS.map((w, idx) => `
                <button class="weight-btn ${idx === currentWeightIdx ? 'active' : ''}" 
                        onclick="changeProductWeight('${product.id}', ${idx})">
                  ${w.label}
                </button>
              `).join('')}
            </div>
          </div>

          <div class="card-footer">
            <div class="card-price">₹${finalPrice}</div>
            <div class="card-actions">
              <button class="btn-add-cart" onclick="addToCart('${product.id}')">
                <i class="fas fa-shopping-bag"></i> Add
              </button>
              <button class="btn-quick-call" onclick="openOwnerModal()" title="Order via Call/WhatsApp">
                <i class="fas fa-phone-alt"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// Weight Selector Event Handler
function changeProductWeight(productId, weightIndex) {
  selectedWeights[productId] = weightIndex;
  renderMenu();
}

// Category Switcher
function setCategory(category, element) {
  currentCategory = category;
  document.querySelectorAll('.category-tab').forEach(el => el.classList.remove('active'));
  if (element) element.classList.add('active');
  renderMenu();
}

// Search Filter Handler
function setupEventListeners() {
  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value;
      renderMenu();
    });
  }

  const egglessCheck = document.getElementById('egglessOnlyToggle');
  if (egglessCheck) {
    egglessCheck.addEventListener('change', (e) => {
      egglessOnlyFilter = e.target.checked;
      renderMenu();
    });
  }
}

// Add to Cart Handler
function addToCart(productId) {
  const product = PRODUCTS.find(p => p.id === productId);
  if (!product) return;

  const weightIdx = selectedWeights[productId] || 0;
  const weightObj = WEIGHT_OPTIONS[weightIdx];
  const unitPrice = Math.round(product.priceBase * weightObj.multiplier);

  const cartItemId = `${productId}-${weightObj.label}`;
  const existingItem = cart.find(item => item.cartItemId === cartItemId);

  if (existingItem) {
    existingItem.qty += 1;
  } else {
    cart.push({
      cartItemId: cartItemId,
      id: product.id,
      name: product.name,
      weight: weightObj.label,
      price: unitPrice,
      image: product.image,
      qty: 1
    });
  }

  updateCartUI();
  toggleCartDrawer(true);
}

// Update Cart UI Drawer & Count
function updateCartUI() {
  const cartCountEl = document.getElementById('cartCount');
  const cartBodyEl = document.getElementById('cartItemsBody');
  const subtotalEl = document.getElementById('cartSubtotal');
  const totalEl = document.getElementById('cartTotal');

  const totalItemsCount = cart.reduce((acc, item) => acc + item.qty, 0);
  if (cartCountEl) cartCountEl.textContent = totalItemsCount;

  if (!cartBodyEl) return;

  if (cart.length === 0) {
    cartBodyEl.innerHTML = `
      <div style="text-align: center; padding: 3rem 1rem; color: var(--text-muted);">
        <i class="fas fa-shopping-basket" style="font-size: 3rem; margin-bottom: 1rem; color: var(--accent-rose);"></i>
        <p>Your cake basket is currently empty.</p>
        <button class="btn btn-primary" onclick="toggleCartDrawer(false)" style="margin-top: 1rem;">
          Explore Menu
        </button>
      </div>
    `;
    if (subtotalEl) subtotalEl.textContent = '₹0';
    if (totalEl) totalEl.textContent = '₹0';
    return;
  }

  let subtotal = 0;
  cartBodyEl.innerHTML = cart.map(item => {
    const itemTotal = item.price * item.qty;
    subtotal += itemTotal;

    return `
      <div class="cart-item">
        <img src="${item.image}" alt="${item.name}">
        <div class="cart-item-details">
          <h5>${item.name}</h5>
          <p>Weight: ${item.weight}</p>
          <div class="cart-item-price">₹${item.price} × ${item.qty} = ₹${itemTotal}</div>
        </div>
        <div class="cart-qty-ctrl">
          <button class="qty-btn" onclick="changeCartQty('${item.cartItemId}', -1)">-</button>
          <span style="font-weight:700; font-size:0.9rem;">${item.qty}</span>
          <button class="qty-btn" onclick="changeCartQty('${item.cartItemId}', 1)">+</button>
        </div>
      </div>
    `;
  }).join('');

  if (subtotalEl) subtotalEl.textContent = `₹${subtotal}`;
  if (totalEl) totalEl.textContent = `₹${subtotal}`;
}

function changeCartQty(cartItemId, delta) {
  const item = cart.find(i => i.cartItemId === cartItemId);
  if (!item) return;

  item.qty += delta;
  if (item.qty <= 0) {
    cart = cart.filter(i => i.cartItemId !== cartItemId);
  }
  updateCartUI();
}

function toggleCartDrawer(show) {
  const drawer = document.getElementById('cartDrawer');
  const overlay = document.getElementById('cartOverlay');
  if (!drawer || !overlay) return;

  if (show) {
    drawer.classList.add('active');
    overlay.classList.add('active');
  } else {
    drawer.classList.remove('active');
    overlay.classList.remove('active');
  }
}

// Custom Cake Builder Controls
function selectBuilderOption(category, value, element, priceAdd = 0) {
  customCakeState[category] = value;

  // Toggle active class in sibling buttons
  if (element && element.parentElement) {
    element.parentElement.querySelectorAll('.builder-option-card').forEach(el => el.classList.remove('active'));
    element.classList.add('active');
  }

  updateCustomBuilderPrice();
}

function updateCustomBuilderPrice() {
  let price = 700; // Base starting price

  // Weight pricing calculation
  if (customCakeState.weight === '1 kg') price += 500;
  else if (customCakeState.weight === '2 kg') price += 1200;
  else if (customCakeState.weight === '3 Tier (3.5kg)') price += 2400;

  // Flavour pricing
  if (customCakeState.flavour.includes('Biscoff') || customCakeState.flavour.includes('Red Velvet')) {
    price += 150;
  }

  customCakeState.basePrice = price;

  // Update summary preview
  const prevShape = document.getElementById('prevShape');
  const prevFlavour = document.getElementById('prevFlavour');
  const prevWeight = document.getElementById('prevWeight');
  const prevFrosting = document.getElementById('prevFrosting');
  const prevPrice = document.getElementById('prevPrice');

  if (prevShape) prevShape.textContent = customCakeState.shape;
  if (prevFlavour) prevFlavour.textContent = customCakeState.flavour;
  if (prevWeight) prevWeight.textContent = customCakeState.weight;
  if (prevFrosting) prevFrosting.textContent = customCakeState.frosting;
  if (prevPrice) prevPrice.textContent = `₹${price}`;
}

function addCustomCakeToCart() {
  const messageInput = document.getElementById('customCakeMessage');
  if (messageInput) customCakeState.message = messageInput.value;

  const customItem = {
    cartItemId: `custom-${Date.now()}`,
    id: `custom-cake`,
    name: `Custom ${customCakeState.shape} Cake (${customCakeState.flavour})`,
    weight: customCakeState.weight,
    price: customCakeState.basePrice,
    image: 'images/hero_cake.png',
    qty: 1
  };

  cart.push(customItem);
  updateCartUI();
  toggleCartDrawer(true);
}

// Delivery Pincode Availability Checker
function checkPincode() {
  const pinInput = document.getElementById('pincodeInput');
  const resultEl = document.getElementById('pincodeResult');
  if (!pinInput || !resultEl) return;

  const pin = pinInput.value.trim();
  if (pin.length !== 6 || isNaN(pin)) {
    resultEl.innerHTML = `<span style="color: var(--danger);">⚠️ Please enter a valid 6-digit Pincode.</span>`;
    return;
  }

  // Simulate express delivery check
  resultEl.innerHTML = `
    <span style="color: #2A9D8F; font-weight: 700;">
      🎉 Great News! Express 2-Hour Delivery & Same-Day Slot available for Pincode ${pin}!
    </span>
  `;
}

// Direct Call & WhatsApp Owner Actions
function openOwnerModal() {
  const modal = document.getElementById('ownerModal');
  if (modal) modal.classList.add('active');
}

function closeOwnerModal() {
  const modal = document.getElementById('ownerModal');
  if (modal) modal.classList.remove('active');
}

function callOwnerDirect() {
  window.location.href = `tel:${OWNER_CONFIG.phone}`;
}

function openWhatsAppOrder() {
  const text = encodeURIComponent(
    `Hello luckys_baking_zone! 🎂 I would like to inquire/order a cake for my event. Please guide me!`
  );
  window.open(`https://wa.me/${OWNER_CONFIG.whatsapp}?text=${text}`, '_blank');
}

// Checkout & Live Order Simulation
function openCheckoutModal() {
  if (cart.length === 0) {
    alert("Your cart is empty! Please add a cake first.");
    return;
  }
  toggleCartDrawer(false);
  const checkoutModal = document.getElementById('checkoutModal');
  if (checkoutModal) checkoutModal.classList.add('active');
}

function closeCheckoutModal() {
  const checkoutModal = document.getElementById('checkoutModal');
  if (checkoutModal) checkoutModal.classList.remove('active');
}

async function submitCheckoutOrder(event) {
  event.preventDefault();

  const form = event.target;
  const name = form.querySelector('input[type="text"]').value.trim();
  const mobile = form.querySelector('input[type="tel"]').value.trim();
  const address = form.querySelector('textarea').value.trim();
  const paymentMethod = form.querySelector('select').value;

  if (!name || !mobile || !address) {
    alert('Please complete your name, mobile number, and delivery address.');
    return;
  }

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const payload = {
    customerName: name,
    mobile,
    address,
    paymentMethod,
    items: cart,
    totalAmount: subtotal,
    status: 'Received',
    createdAt: new Date().toISOString()
  };

  const savedOrders = JSON.parse(localStorage.getItem('luckys_baking_zone_orders') || '[]');
  const orderWithId = {
    ...payload,
    id: `LC-${Date.now()}`,
    orderNumber: `${10000 + savedOrders.length}`
  };
  savedOrders.unshift(orderWithId);
  localStorage.setItem('luckys_baking_zone_orders', JSON.stringify(savedOrders));

  closeCheckoutModal();
  cart = [];
  updateCartUI();

  const trackerModal = document.getElementById('trackerModal');
  if (trackerModal) {
    const orderBadge = trackerModal.querySelector('span');
    if (orderBadge) orderBadge.textContent = `ORDER #${orderWithId.orderNumber} PLACED`;
    trackerModal.classList.add('active');
  }

  // Try to send order to backend server so owner can view it centrally
  try {
      const resp = await fetch(`${API_BASE}/api/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderWithId)
    });

    if (resp.ok) {
      const serverOrder = await resp.json();
      alert('Order placed successfully! Owner will receive the order.');
    } else {
      console.warn('Server rejected order:', resp.status);
      alert('Order placed locally, but could not reach server. Owner will not see it until server is available.');
    }
  } catch (err) {
    console.warn('Order POST failed:', err);
    alert('Order placed locally, but server is unreachable. Owner will not see it until the server is running.');
  }

  simulateOrderProgress();
}

function closeTrackerModal() {
  const trackerModal = document.getElementById('trackerModal');
  if (trackerModal) trackerModal.classList.remove('active');
}

// Live Order Progress Animation
function simulateOrderProgress() {
  const steps = document.querySelectorAll('.tracker-step');
  steps.forEach((step, idx) => {
    setTimeout(() => {
      step.classList.add('completed');
      if (idx < steps.length - 1) {
        steps[idx + 1].classList.add('active');
      }
    }, idx * 2500);
  });
}
