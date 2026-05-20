import { useState, useEffect } from 'react';
import api from './api';
import { 
  ShoppingCart, 
  Package, 
  CreditCard, 
  CheckCircle, 
  X, 
  User, 
  Search, 
  AlertTriangle, 
  Plus, 
  Minus, 
  Trash2, 
  LogOut, 
  ListFilter,
  Check,
  RefreshCw,
  ShoppingBag
} from 'lucide-react';

function App() {
  // Navigation & Tabs
  const [activeTab, setActiveTab] = useState('shop');
  
  // Product Catalog States
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [productsLoading, setProductsLoading] = useState(true);

  // Cart States
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Auth States
  const [user, setUser] = useState(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState('login'); // 'login' or 'register'
  const [authForm, setAuthForm] = useState({ username: '', password: '', name: '', email: '' });
  const [authError, setAuthError] = useState('');

  // Checkout States
  const [checkoutModal, setCheckoutModal] = useState({ isOpen: false, step: 'form' }); // 'form', 'processing', 'result'
  const [checkoutForm, setCheckoutForm] = useState({ name: '', address: '', zip: '' });
  const [checkoutResult, setCheckoutResult] = useState(null); // { success: boolean, message: string, order: object, payment?: object }
  
  // Order History States
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

  // Global Notifications (Toast)
  const [toast, setToast] = useState(null);

  // Helper to refresh logged-in user balance from User Service
  const refreshUserBalance = async (username) => {
    try {
      const response = await api.get(`/users/${username}`);
      const updatedUser = response.data;
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
    } catch (error) {
      console.error('Error refreshing user balance:', error);
    }
  };

  // Fetch initial product catalog
  useEffect(() => {
    fetchProducts();
    // Restore session if available
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      const parsedUser = JSON.parse(savedUser);
      setUser(parsedUser);
      refreshUserBalance(parsedUser.username);
    }
  }, []);

  // Filter products when category or search query changes
  useEffect(() => {
    let result = Array.isArray(products) ? products : [];
    if (selectedCategory !== 'All') {
      result = result.filter(p => p.category === selectedCategory);
    }
    if (searchQuery.trim() !== '') {
      result = result.filter(p => 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        p.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    setFilteredProducts(result);
  }, [products, selectedCategory, searchQuery]);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchProducts = async () => {
    setProductsLoading(true);
    try {
      const response = await api.get('/products');
      if (Array.isArray(response.data)) {
        setProducts(response.data);
      } else {
        console.error('Products API returned a non-array response:', response.data);
        setProducts([]);
        showToast('Invalid products data format from server.', 'error');
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      showToast('Failed to load products. Is Product Service / Gateway running?', 'error');
    } finally {
      setProductsLoading(false);
    }
  };

  const fetchOrders = async () => {
    setOrdersLoading(true);
    try {
      const response = await api.get('/orders');
      if (Array.isArray(response.data)) {
        setOrders(response.data);
      } else {
        console.error('Orders API returned a non-array response:', response.data);
        setOrders([]);
        showToast('Invalid orders data format from server.', 'error');
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      showToast('Failed to load order history.', 'error');
    } finally {
      setOrdersLoading(false);
    }
  };

  // Switch tabs
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === 'orders') {
      fetchOrders();
    }
  };

  // Cart Operations
  const addToCart = (product) => {
    const existing = cart.find(item => item.id === product.id);
    if (existing) {
      if (existing.quantity >= product.stock) {
        showToast('Cannot add more. Limit stock reached.', 'error');
        return;
      }
      setCart(cart.map(item => 
        item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
      ));
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
    showToast(`${product.name} added to cart!`);
  };

  const updateQuantity = (productId, amount) => {
    const item = cart.find(i => i.id === productId);
    if (!item) return;

    const newQty = item.quantity + amount;
    if (newQty <= 0) {
      removeFromCart(productId);
      return;
    }

    if (newQty > item.stock) {
      showToast('Cannot select more than available stock.', 'error');
      return;
    }

    setCart(cart.map(i => i.id === productId ? { ...i, quantity: newQty } : i));
  };

  const removeFromCart = (productId) => {
    setCart(cart.filter(item => item.id !== productId));
    showToast('Item removed from cart.');
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  // Authentication API Calls
  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');
    try {
      if (authMode === 'login') {
        const response = await api.post('/users/login', {
          username: authForm.username,
          password: authForm.password
        });
        const sessionUser = response.data.user;
        setUser(sessionUser);
        localStorage.setItem('user', JSON.stringify(sessionUser));
        localStorage.setItem('token', response.data.token);
        showToast('Login successful! Welcome back.');
        setIsAuthModalOpen(false);
      } else {
        const response = await api.post('/users/register', {
          username: authForm.username,
          password: authForm.password,
          name: authForm.name,
          email: authForm.email
        });
        showToast('Registration successful! Please login.');
        setAuthMode('login');
      }
    } catch (err) {
      setAuthError(err.response?.data?.message || 'Authentication request failed.');
    }
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    showToast('Logged out successfully.');
  };

  // Checkout API Call
  const triggerCheckout = async (e) => {
    e.preventDefault();
    if (cart.length === 0) return;
    
    if (!user) {
      showToast('Please log in to complete your order.', 'error');
      setAuthMode('login');
      setIsAuthModalOpen(true);
      return;
    }

    setCheckoutModal({ isOpen: true, step: 'processing' });
    
    // Process items in cart. For demo, we submit the first item or support batch orders.
    // The Order Service checkout expects productId, quantity, and userId.
    const cartItem = cart[0]; 

    try {
      const response = await api.post('/orders', {
        productId: cartItem.id,
        quantity: cartItem.quantity,
        userId: user.username
      });

      // Clear cart on successful order creation (even if payment is failed, since order record itself is resolved)
      setCart([]);
      setIsCartOpen(false);
      
      const payload = response.data;
      const isSuccess = payload.payment ? payload.payment.success : true;
      if (isSuccess) {
        refreshUserBalance(user.username);
        fetchProducts();
      }

      setCheckoutResult({
        success: isSuccess,
        isUnknown: payload.order?.status === 'payment_unknown',
        message: payload.message,
        order: payload.order,
        payment: payload.payment,
        error: payload.error
      });
      setCheckoutModal({ isOpen: true, step: 'result' });

    } catch (err) {
      console.error(err);
      setCheckoutResult({
        success: false,
        message: err.response?.data?.message || 'Catalog / Order service returned an offline status.',
        order: null
      });
      setCheckoutModal({ isOpen: true, step: 'result' });
    }
  };

  return (
    <div>
      {/* Top Navigation */}
      <header className="header">
        <div className="header-content">
          <a href="#" className="logo" onClick={() => handleTabChange('shop')}>
            <ShoppingBag size={24} /> <span>CEP Enterprise</span>
          </a>

          <nav className="nav-links">
            <button 
              className={`nav-link-btn ${activeTab === 'shop' ? 'active' : ''}`}
              onClick={() => handleTabChange('shop')}
            >
              Shop Catalog
            </button>
            <button 
              className={`nav-link-btn ${activeTab === 'orders' ? 'active' : ''}`}
              onClick={() => handleTabChange('orders')}
            >
              Orders ledger
            </button>
          </nav>

          <div className="nav-actions">
            <button className="cart-icon-btn" onClick={() => setIsCartOpen(true)}>
              <ShoppingCart size={20} />
              {cart.length > 0 && (
                <span className="cart-badge">{cart.reduce((s, i) => s + i.quantity, 0)}</span>
              )}
            </button>

            {user ? (
              <div className="user-widget" style={{ padding: '0.4rem 1.2rem', borderRadius: '16px' }}>
                <div className="user-avatar">{user.name.charAt(0)}</div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '0.1rem' }}>
                  <span style={{ fontSize: '0.9rem', fontWeight: 600, lineHeight: 1.2 }}>{user.name}</span>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--success)', lineHeight: 1.2 }}>
                    Wallet: ${Number(user.balance !== undefined ? user.balance : 1000).toFixed(2)}
                  </span>
                </div>
                <button 
                  onClick={handleLogout} 
                  className="nav-link-btn" 
                  style={{ padding: '0.2rem', display: 'flex', alignItems: 'center', marginLeft: '0.5rem' }}
                  title="Logout"
                >
                  <LogOut size={16} />
                </button>
              </div>
            ) : (
              <button 
                className="btn btn-outline" 
                onClick={() => {
                  setAuthMode('login');
                  setAuthForm({ username: '', password: '', name: '', email: '' });
                  setAuthError('');
                  setIsAuthModalOpen(true);
                }}
              >
                <User size={16} /> Log In
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="container">
        {activeTab === 'shop' ? (
          <div>
            {/* Catalog Toolbar */}
            <div className="filter-bar">
              <div className="category-tabs">
                {['All', 'Laptops', 'Phones', 'Tablets', 'Accessories'].map(category => (
                  <button
                    key={category}
                    className={`category-tab ${selectedCategory === category ? 'active' : ''}`}
                    onClick={() => setSelectedCategory(category)}
                  >
                    {category}
                  </button>
                ))}
              </div>

              <div style={{ position: 'relative' }}>
                <Search size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
                <input 
                  type="text" 
                  className="search-input" 
                  placeholder="Search catalog products..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ paddingLeft: '2.5rem' }}
                />
              </div>
            </div>

            {/* Products grid */}
            {productsLoading ? (
              <div style={{ textAlign: 'center', padding: '4rem 0' }}>
                <RefreshCw className="spinner" size={40} style={{ animation: 'spin 1.5s linear infinite' }} />
                <p style={{ color: 'var(--text-secondary)' }}>Loading catalog inventory...</p>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--text-muted)' }}>
                <AlertTriangle size={48} style={{ marginBottom: '1rem', color: 'var(--warning)' }} />
                <p>No products match your current filters or query.</p>
              </div>
            ) : (
              <div className="product-grid">
                {filteredProducts.map(product => (
                  <div className="product-card" key={product.id}>
                    <div className="product-image-placeholder">
                      <Package size={48} />
                      <span className="product-card-badge">{product.category}</span>
                      <span className={`product-card-stock ${product.stock <= 10 ? 'low-stock' : ''}`}>
                        Stock: {product.stock}
                      </span>
                    </div>

                    <div className="product-body">
                      <div className="product-info-top">
                        <span className="product-card-category">{product.category}</span>
                        <div className="product-rating">
                          ★ <span>{product.rating}</span>
                        </div>
                      </div>

                      <h3 className="product-card-name">{product.name}</h3>
                      <p className="product-card-desc">{product.description}</p>
                      
                      <div className="product-card-footer">
                        <span className="product-card-price">${product.price}</span>
                        <button 
                          className="btn btn-primary"
                          onClick={() => addToCart(product)}
                          disabled={product.stock <= 0}
                        >
                          <ShoppingCart size={16} /> {product.stock <= 0 ? 'Out of Stock' : 'Add to Cart'}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* Orders Ledger Section */
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <h2>Transaction Audit Ledger</h2>
              <button className="btn btn-outline" onClick={fetchOrders} style={{ padding: '0.5rem 1rem' }}>
                <RefreshCw size={16} /> Refresh
              </button>
            </div>

            {ordersLoading ? (
              <div style={{ textAlign: 'center', padding: '4rem 0' }}>
                <RefreshCw className="spinner" size={40} style={{ animation: 'spin 1.5s linear infinite' }} />
                <p style={{ color: 'var(--text-secondary)' }}>Loading ledger transactions...</p>
              </div>
            ) : orders.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--text-muted)', border: '1px dashed var(--border)', borderRadius: '16px' }}>
                <Package size={48} style={{ marginBottom: '1rem' }} />
                <p>No orders recorded in database yet.</p>
              </div>
            ) : (
              <div className="orders-ledger">
                {orders.map(order => (
                  <div className="order-card" key={order._id}>
                    <div className="order-card-header">
                      <div>
                        <span className="order-id">Order ID: {order._id}</span>
                        <span className="order-date" style={{ marginLeft: '1rem' }}>
                          {new Date(order.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <span className={`status-badge status-${order.status}`}>
                        {order.status}
                      </span>
                    </div>

                    <div className="order-details">
                      <div>
                        <div className="order-product">{order.productName}</div>
                        <div className="order-meta">
                          Quantity: {order.quantity} | User: <span style={{ fontWeight: 600 }}>{order.userId}</span>
                        </div>
                      </div>
                      <div className="order-price">${order.totalPrice}</div>
                    </div>

                    {/* Resilience Error Log Box */}
                    {order.status === 'payment_unknown' && (
                      <div className="order-card-footer" style={{ borderLeft: '4px solid var(--warning)' }}>
                        <div style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--warning)', marginBottom: '0.2rem' }}>
                          <AlertTriangle size={14} /> Distributed Connectivity Timeout Alert
                        </div>
                        The gateway saved this transaction as pending, but the Payment Service timed out/failed. Payment confirmation is unknown.
                      </div>
                    )}

                    {order.status === 'failed' && (
                      <div className="order-card-footer" style={{ borderLeft: '4px solid var(--error)' }}>
                        <div style={{ fontWeight: 700, color: 'var(--error)' }}>Declined Transaction Log</div>
                        Payment simulator rejected processing. Saved record was safely rolled back to failed.
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Cart Slider Drawer */}
      <div className={`cart-drawer-backdrop ${isCartOpen ? 'open' : ''}`} onClick={() => setIsCartOpen(false)}>
        <div className="cart-drawer" onClick={(e) => e.stopPropagation()}>
          <div className="cart-drawer-header">
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ShoppingCart /> Shopping Cart
            </h3>
            <button className="cart-drawer-close" onClick={() => setIsCartOpen(false)}>
              <X size={20} />
            </button>
          </div>

          <div className="cart-items-list">
            {cart.length === 0 ? (
              <div className="cart-empty-state">
                <ShoppingCart size={48} />
                <p>Your shopping cart is empty.</p>
              </div>
            ) : (
              cart.map(item => (
                <div className="cart-item" key={item.id}>
                  <div className="cart-item-info">
                    <h4 className="cart-item-name">{item.name}</h4>
                    <p className="cart-item-price">${item.price}</p>
                    <div className="cart-item-controls">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <button className="qty-btn" onClick={() => updateQuantity(item.id, -1)}><Minus size={14} /></button>
                        <span className="qty-number">{item.quantity}</span>
                        <button className="qty-btn" onClick={() => updateQuantity(item.id, 1)}><Plus size={14} /></button>
                      </div>
                      <button className="cart-item-remove" onClick={() => removeFromCart(item.id)}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {cart.length > 0 && (
            <div className="cart-drawer-footer">
              <div className="cart-summary-row">
                <span>Shipping</span>
                <span style={{ color: 'var(--success)', fontWeight: 600 }}>FREE</span>
              </div>
              <div className="cart-summary-total">
                <span>Subtotal</span>
                <span>${cartTotal}</span>
              </div>
              
              <button 
                className="btn btn-primary" 
                style={{ width: '100%', padding: '0.8rem' }}
                onClick={() => {
                  if (!user) {
                    showToast('Please log in to place an order.', 'error');
                    setAuthMode('login');
                    setAuthForm({ username: '', password: '', name: '', email: '' });
                    setAuthError('');
                    setIsAuthModalOpen(true);
                  } else {
                    setCheckoutModal({ isOpen: true, step: 'form' });
                  }
                }}
              >
                Proceed to Checkout
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Checkout Wizard Modal */}
      {checkoutModal.isOpen && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Secure Checkout (1 Item Limit)</h3>
              {checkoutModal.step !== 'processing' && (
                <button className="modal-close" onClick={() => setCheckoutModal({ isOpen: false, step: 'form' })}>
                  <X size={20} />
                </button>
              )}
            </div>

            {checkoutModal.step === 'form' && (
              <form onSubmit={triggerCheckout}>
                <div style={{ background: 'rgba(99, 102, 241, 0.05)', border: '1px solid var(--border)', borderRadius: '10px', padding: '1rem', marginBottom: '1.5rem' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.2rem' }}>Selected Product:</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span>{cart[0]?.name} (Qty: {cart[0]?.quantity})</span>
                    <span style={{ fontWeight: 800 }}>${cartTotal}</span>
                  </div>
                  <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '0.5rem 0' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                    <span>Your Wallet Balance:</span>
                    <span style={{ fontWeight: 600, color: 'var(--success)' }}>${Number(user?.balance !== undefined ? user.balance : 1000).toFixed(2)}</span>
                  </div>
                  {user?.balance < cartTotal ? (
                    <div style={{ marginTop: '0.75rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--error)', color: 'var(--error)', borderRadius: '8px', padding: '0.5rem 0.75rem', fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <AlertTriangle size={14} /> Insufficient Wallet Balance (Short of ${(cartTotal - (user?.balance || 0)).toFixed(2)})
                    </div>
                  ) : (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                      <span>Remaining Balance:</span>
                      <span style={{ fontWeight: 600 }}>${Number((user?.balance !== undefined ? user.balance : 1000) - cartTotal).toFixed(2)}</span>
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    required 
                    placeholder="John Doe"
                    value={checkoutForm.name}
                    onChange={(e) => setCheckoutForm({ ...checkoutForm, name: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Shipping Address</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    required 
                    placeholder="123 Developer Highway"
                    value={checkoutForm.address}
                    onChange={(e) => setCheckoutForm({ ...checkoutForm, address: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">ZIP / Postal Code</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    required 
                    placeholder="90001"
                    value={checkoutForm.zip}
                    onChange={(e) => setCheckoutForm({ ...checkoutForm, zip: e.target.value })}
                  />
                </div>

                <div className="form-footer">
                  <button 
                    type="button" 
                    className="btn btn-outline" 
                    onClick={() => setCheckoutModal({ isOpen: false, step: 'form' })}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="btn btn-primary"
                    disabled={user?.balance < cartTotal}
                  >
                    <CreditCard size={16} /> Pay & Complete Order
                  </button>
                </div>
              </form>
            )}

            {checkoutModal.step === 'processing' && (
              <div className="checkout-processing">
                <RefreshCw className="spinner" size={48} />
                <h4>Authorizing Payment simulation...</h4>
                <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem', fontSize: '0.9rem' }}>
                  Calling Payment Service through API Gateway with a simulated 1.5s delay. Please wait.
                </p>
              </div>
            )}

            {checkoutModal.step === 'result' && checkoutResult && (
              <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                {checkoutResult.success ? (
                  <div>
                    <CheckCircle size={56} style={{ color: 'var(--success)', marginBottom: '1rem' }} />
                    <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Order Placed Successfully!</h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '1.5rem' }}>
                      {checkoutResult.message}
                    </p>
                    <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', borderRadius: '12px', padding: '1rem', textAlign: 'left', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
                      <div>Order Reference: <span style={{ fontFamily: 'var(--font-display)', fontWeight: 600 }}>{checkoutResult.order?._id}</span></div>
                      <div>Transaction ID: <span style={{ fontFamily: 'var(--font-display)', fontWeight: 600 }}>{checkoutResult.payment?.transactionId}</span></div>
                      <div>Amount Paid: <span style={{ fontWeight: 800 }}>${checkoutResult.order?.totalPrice}</span></div>
                    </div>
                  </div>
                ) : checkoutResult.isUnknown ? (
                  <div>
                    <AlertTriangle size={56} style={{ color: 'var(--warning)', marginBottom: '1rem' }} />
                    <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Payment Status Unknown</h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '1.5rem' }}>
                      The order was successfully saved to your profile, but the gateway failed to establish connection with the Payment Simulation Service.
                    </p>
                    <div style={{ background: 'rgba(245, 158, 11, 0.05)', border: '1px solid rgba(245, 158, 11, 0.2)', borderRadius: '12px', padding: '1rem', textAlign: 'left', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
                      <div style={{ color: 'var(--warning)', fontWeight: 700 }}>Connection Details:</div>
                      <div>Error Code: <code style={{ color: 'var(--warning)' }}>{checkoutResult.error}</code></div>
                      <div>Status in database: <span className="status-badge status-payment_unknown" style={{ fontSize: '0.75rem' }}>payment_unknown</span></div>
                    </div>
                  </div>
                ) : (
                  <div>
                    <X size={56} style={{ color: 'var(--error)', border: '4px solid var(--error)', borderRadius: '50%', padding: '0.4rem', margin: '0 auto 1rem auto' }} />
                    <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Checkout Failed</h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '1.5rem' }}>
                      {checkoutResult.message}
                    </p>
                  </div>
                )}
                
                <button 
                  className="btn btn-primary" 
                  style={{ margin: '0 auto' }}
                  onClick={() => {
                    setCheckoutModal({ isOpen: false, step: 'form' });
                    handleTabChange('orders');
                  }}
                >
                  View Order Ledger
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Authentication Modal */}
      {isAuthModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ width: '400px' }}>
            <div className="modal-header">
              <h3>{authMode === 'login' ? 'Welcome Back' : 'Create Account'}</h3>
              <button className="modal-close" onClick={() => setIsAuthModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            {authError && (
              <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', color: 'var(--error)', borderRadius: '10px', padding: '0.75rem', marginBottom: '1rem', fontSize: '0.85rem' }}>
                {authError}
              </div>
            )}

            <form onSubmit={handleAuthSubmit}>
              {authMode === 'register' && (
                <>
                  <div className="form-group">
                    <label className="form-label">Full Name</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      required 
                      placeholder="Jane Doe"
                      value={authForm.name}
                      onChange={(e) => setAuthForm({ ...authForm, name: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Email Address</label>
                    <input 
                      type="email" 
                      className="form-input" 
                      required 
                      placeholder="jane@example.com"
                      value={authForm.email}
                      onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })}
                    />
                  </div>
                </>
              )}

              <div className="form-group">
                <label className="form-label">Username</label>
                <input 
                  type="text" 
                  className="form-input" 
                  required 
                  placeholder="janedoe"
                  value={authForm.username}
                  onChange={(e) => setAuthForm({ ...authForm, username: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Password</label>
                <input 
                  type="password" 
                  className="form-input" 
                  required 
                  placeholder="••••••••"
                  value={authForm.password}
                  onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })}
                />
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem', padding: '0.75rem' }}>
                {authMode === 'login' ? 'Login Securely' : 'Sign Up'}
              </button>

              <div style={{ marginTop: '1.25rem', textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                {authMode === 'login' ? (
                  <>
                    New to CEP Store?{' '}
                    <button type="button" style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 700, cursor: 'pointer' }} onClick={() => { setAuthMode('register'); setAuthError(''); }}>
                      Create Account
                    </button>
                  </>
                ) : (
                  <>
                    Already have an account?{' '}
                    <button type="button" style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 700, cursor: 'pointer' }} onClick={() => { setAuthMode('login'); setAuthError(''); }}>
                      Log In
                    </button>
                  </>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast Alert */}
      {toast && (
        <div className={`toast toast-${toast.type}`}>
          {toast.type === 'success' && <Check size={18} style={{ color: 'var(--success)' }} />}
          {toast.type === 'error' && <X size={18} style={{ color: 'var(--error)' }} />}
          {toast.type === 'info' && <RefreshCw size={18} style={{ color: 'var(--primary)' }} />}
          <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{toast.message}</span>
        </div>
      )}
    </div>
  );
}

export default App;
