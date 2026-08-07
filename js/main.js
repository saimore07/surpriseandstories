/* ----------------------------------------------------
   Surprise and Stories - Main Public Gallery Logic
   ---------------------------------------------------- */

document.addEventListener('DOMContentLoaded', () => {
  let allProducts = [];
  let currentCategory = 'All';

  const productsGrid = document.getElementById('products-grid');
  const searchInput = document.getElementById('search-input');
  const categoryTabs = document.getElementById('category-tabs');
  const navbar = document.getElementById('navbar');
  const mobileToggle = document.getElementById('mobile-toggle');
  const navLinks = document.getElementById('nav-links');

  // Format currency in ₹ INR
  function formatINR(price) {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(price);
  }

  // Load products from Supabase / Fallback DB
  async function loadProducts() {
    if (!productsGrid) return;
    
    productsGrid.innerHTML = `
      <div class="loading-spinner">
        <i class="fa-solid fa-circle-notch"></i>
        <p>Fetching beautiful handcrafted gifts...</p>
      </div>
    `;

    const { data, error } = await DBService.getProducts();

    if (error) {
      productsGrid.innerHTML = `
        <div class="empty-state">
          <i class="fa-solid fa-triangle-exclamation"></i>
          <h3>Failed to load products</h3>
          <p>${error.message || 'Please check your connection and try again.'}</p>
        </div>
      `;
      return;
    }

    allProducts = data || [];
    renderProducts();
  }

  // Render product cards based on active filter & search
  function renderProducts() {
    if (!productsGrid) return;

    const searchTerm = searchInput ? searchInput.value.toLowerCase().trim() : '';

    const filtered = allProducts.filter(product => {
      const matchesCategory = (currentCategory === 'All') || 
        (product.category && product.category.toLowerCase().includes(currentCategory.toLowerCase())) ||
        (currentCategory === 'Personalized Cards' && product.category === 'Cards');

      const matchesSearch = !searchTerm || 
        product.title.toLowerCase().includes(searchTerm) || 
        (product.description && product.description.toLowerCase().includes(searchTerm));

      return matchesCategory && matchesSearch;
    });

    if (filtered.length === 0) {
      productsGrid.innerHTML = `
        <div class="empty-state">
          <i class="fa-solid fa-box-open"></i>
          <h3>No gifts found</h3>
          <p>Try selecting another category or searching for something else.</p>
        </div>
      `;
      return;
    }

    const phone = typeof WHATSAPP_PHONE !== 'undefined' ? WHATSAPP_PHONE : '918180907632';

    productsGrid.innerHTML = filtered.map(product => {
      const priceFormatted = formatINR(product.price);
      // Construct WhatsApp URL as per specification
      // https://wa.me/YOUR_PHONE_NUMBER?text=Hi!%20I'd%20like%20to%20order%20the%20[PRODUCT_TITLE]%20(₹[PRICE]).
      const whatsappMsg = encodeURIComponent(`Hi! I'd like to order the ${product.title} (${priceFormatted}).`);
      const whatsappUrl = `https://wa.me/${phone}?text=${whatsappMsg}`;

      const imgUrl = product.image_url || 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&q=80&w=800';

      return `
        <article class="product-card">
          <div class="product-img-wrapper">
            <span class="product-category-badge">${product.category || 'Handcrafted'}</span>
            <img src="${imgUrl}" alt="${product.title}" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&q=80&w=800'">
          </div>
          <div class="product-content">
            <h3 class="product-title">${product.title}</h3>
            <div class="product-price">${priceFormatted}</div>
            <p class="product-desc">${product.description || 'Bespoke handmade gift tailored with love.'}</p>
            <div class="product-actions">
              <a href="${whatsappUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-whatsapp">
                <i class="fa-brands fa-whatsapp"></i> Order on WhatsApp
              </a>
            </div>
          </div>
        </article>
      `;
    }).join('');
  }

  // Category Tab Handler
  if (categoryTabs) {
    categoryTabs.addEventListener('click', (e) => {
      if (e.target.classList.contains('tab-btn')) {
        categoryTabs.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        e.target.classList.add('active');
        currentCategory = e.target.getAttribute('data-category');
        renderProducts();
      }
    });
  }

  // Live Search Listener
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      renderProducts();
    });
  }

  // Mobile Navigation Menu Toggle
  if (mobileToggle && navLinks) {
    mobileToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      navLinks.classList.toggle('open');
      const icon = mobileToggle.querySelector('i');
      if (navLinks.classList.contains('open')) {
        icon.className = 'fa-solid fa-xmark';
      } else {
        icon.className = 'fa-solid fa-bars';
      }
    });

    // Close menu when clicking a link
    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        navLinks.classList.remove('open');
        if (mobileToggle.querySelector('i')) {
          mobileToggle.querySelector('i').className = 'fa-solid fa-bars';
        }
      });
    });

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
      if (navLinks.classList.contains('open') && !navLinks.contains(e.target) && !mobileToggle.contains(e.target)) {
        navLinks.classList.remove('open');
        if (mobileToggle.querySelector('i')) {
          mobileToggle.querySelector('i').className = 'fa-solid fa-bars';
        }
      }
    });
  }

  // Navbar glassmorphism scroll background
  window.addEventListener('scroll', () => {
    if (navbar) {
      if (window.scrollY > 50) {
        navbar.classList.add('scrolled');
      } else {
        navbar.classList.remove('scrolled');
      }
    }
  });

  const phone = typeof WHATSAPP_PHONE !== 'undefined' ? WHATSAPP_PHONE : '918180907632';
  const footerWhatsapp = document.getElementById('footer-whatsapp');
  const heroCustomOrder = document.getElementById('hero-custom-order');
  const generalMsg = encodeURIComponent("Hi Surprise and Stories! I'd like to inquire about a custom gift hamper.");

  if (footerWhatsapp) {
    footerWhatsapp.href = `https://wa.me/${phone}?text=${generalMsg}`;
    footerWhatsapp.target = '_blank';
  }

  if (heroCustomOrder) {
    heroCustomOrder.href = `https://wa.me/${phone}?text=${generalMsg}`;
    heroCustomOrder.target = '_blank';
  }

  // Load About Us Images dynamically
  async function loadAboutImages() {
    const img1Elem = document.getElementById('about-img-1');
    const img2Elem = document.getElementById('about-img-2');
    if (img1Elem || img2Elem) {
      const { img1, img2 } = await DBService.getAboutImages();
      if (img1Elem && img1) img1Elem.src = img1;
      if (img2Elem && img2) img2Elem.src = img2;
    }
  }

  // Initialize gallery and about us images
  loadAboutImages();
  loadProducts();
});
