/* ----------------------------------------------------
   Surprise and Stories - Supabase Client & Config
   ---------------------------------------------------- */

// Helper to sanitize Supabase Project URL (e.g. converting dashboard URLs to API URLs)
function sanitizeSupabaseUrl(rawUrl) {
  if (!rawUrl) return '';
  let url = rawUrl.trim();
  const match = url.match(/dashboard\/project\/([a-z0-9]+)/i);
  if (match && match[1]) {
    return `https://${match[1]}.supabase.co`;
  }
  return url.replace(/\/+$/, '');
}

// Configurable constants - Can be updated in local settings or manually here
const RAW_SUPABASE_URL = localStorage.getItem('SS_SUPABASE_URL') || 'https://supabase.com/dashboard/project/pflduczzlxpuxianmevd.supabase.co';
const SUPABASE_URL = sanitizeSupabaseUrl(RAW_SUPABASE_URL);
const SUPABASE_ANON_KEY = (localStorage.getItem('SS_SUPABASE_ANON_KEY') || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmbGR1Y3p6bHhwdXhpYW5tZXZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU3NzI1ODUsImV4cCI6MjEwMTM0ODU4NX0.rH8TNnzG11kc9uxpl59VCyTeaPDxHH10DpK-bTW_JHo').trim();
const WHATSAPP_PHONE = localStorage.getItem('SS_WHATSAPP_PHONE') || '9156578252';

// Check if using default placeholder configuration
const isPlaceholderConfig = (
  !SUPABASE_URL ||
  SUPABASE_URL.includes('YOUR_SUPABASE') ||
  !SUPABASE_ANON_KEY ||
  SUPABASE_ANON_KEY.includes('YOUR_SUPABASE')
);

// Initialize Supabase Client if library is available
let supabaseClient = null;
if (typeof supabase !== 'undefined' && !isPlaceholderConfig) {
  try {
    supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log('✅ Supabase Client initialized successfully for:', SUPABASE_URL);
  } catch (err) {
    console.warn('⚠️ Supabase init error, falling back to local demo mode:', err);
  }
} else {
  console.info('ℹ️ Demo / Fallback Mode enabled (Default Supabase credentials detected).');
}

// Initial Sample Products for Demo / Fallback Mode
const INITIAL_DEMO_PRODUCTS = [
  {
    id: 'demo-1',
    title: 'Personalized Memory Box',
    price: 1899,
    category: 'Anniversary',
    description: 'A handcrafted wooden box featuring fairy lights, custom photo clips, and mini scroll messages.',
    image_url: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&q=80&w=800',
    created_at: new Date(Date.now() - 100000).toISOString()
  },
  {
    id: 'demo-2',
    title: 'Bespoke Velvet Gift Hamper',
    price: 2499,
    category: 'Gift Hampers',
    description: 'Luxurious rose pink hamper stuffed with artisan chocolates, scented candle, and custom wax-sealed card.',
    image_url: 'https://images.unsplash.com/photo-1513885535751-8b9238bd48?auto=format&fit=crop&q=80&w=800',
    created_at: new Date(Date.now() - 200000).toISOString()
  },
  {
    id: 'demo-3',
    title: 'Vintage Floral Calligraphy Card',
    price: 499,
    category: 'Cards',
    description: 'Hand-painted watercolor floral card crafted on 300gsm deckle-edge paper with gold foil accents.',
    image_url: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&q=80&w=800',
    created_at: new Date(Date.now() - 300000).toISOString()
  },
  {
    id: 'demo-4',
    title: 'Love Story Pull-Out Accordion',
    price: 1299,
    category: 'Personalized Cards',
    description: 'Interactive photo accordion album capturing 12 milestone memories with handcrafted ribbon closure.',
    image_url: 'https://images.unsplash.com/photo-1513201099705-a9746e1e201f?auto=format&fit=crop&q=80&w=800',
    created_at: new Date(Date.now() - 400000).toISOString()
  },
  {
    id: 'demo-5',
    title: 'Blossom Glow Candle & Frame',
    price: 1599,
    category: 'Gift Hampers',
    description: 'Soy wax botanical candle paired with a custom pressed-flower glass photo frame.',
    image_url: 'https://images.unsplash.com/photo-1607344645866-009c320c5ab8?auto=format&fit=crop&q=80&w=800',
    created_at: new Date(Date.now() - 500000).toISOString()
  },
  {
    id: 'demo-6',
    title: 'Custom Exploding Surprise Box',
    price: 2199,
    category: 'Anniversary',
    description: 'Multi-layered explosion box filled with 24 photo flaps, sweet notes, and a centerpiece gift compartment.',
    image_url: 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&q=80&w=800',
    created_at: new Date(Date.now() - 600000).toISOString()
  }
];

// LocalStorage Helper for Demo & Local Synchronization
function getLocalProducts() {
  const stored = localStorage.getItem('SS_DEMO_PRODUCTS');
  if (!stored) {
    localStorage.setItem('SS_DEMO_PRODUCTS', JSON.stringify(INITIAL_DEMO_PRODUCTS));
    return [...INITIAL_DEMO_PRODUCTS];
  }
  try {
    return JSON.parse(stored);
  } catch (e) {
    return [...INITIAL_DEMO_PRODUCTS];
  }
}

function saveLocalProducts(products) {
  localStorage.setItem('SS_DEMO_PRODUCTS', JSON.stringify(products));
}

// Global Service Wrapper Methods
const DBService = {
  // Fetch all products, merging live Supabase products and locally added products
  async getProducts() {
    let supabaseProducts = [];

    if (supabaseClient && !isPlaceholderConfig) {
      try {
        const { data, error } = await supabaseClient
          .from('products')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && data) {
          supabaseProducts = data;
        }
      } catch (error) {
        console.warn('Supabase DB fetch error, relying on local sync:', error.message);
      }
    }

    const localProducts = getLocalProducts();

    // Merge Supabase products and local products (avoiding duplicates by id or title)
    const productMap = new Map();

    // Add local products first
    localProducts.forEach(p => {
      if (p && p.title) productMap.set(p.id || p.title, p);
    });

    // Supabase products take precedence if they exist
    supabaseProducts.forEach(p => {
      if (p && p.title) productMap.set(p.id || p.title, p);
    });

    const merged = Array.from(productMap.values());
    merged.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));

    return { data: merged, error: null };
  },

  // Upload image file to Supabase Storage bucket `product-images` or return base64 Data URL
  async uploadImage(file) {
    if (!file) return { url: null, error: 'No file provided' };

    // Always generate a local Data URL first so image display is 100% guaranteed
    const readAsDataURL = (fileObj) => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = () => resolve('https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&q=80&w=800');
        reader.readAsDataURL(fileObj);
      });
    };

    const dataUrl = await readAsDataURL(file);
    const fileName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;

    if (supabaseClient && !isPlaceholderConfig) {
      try {
        const { data, error } = await supabaseClient.storage
          .from('product-images')
          .upload(fileName, file, { cacheControl: '3600', upsert: true });

        if (!error && data) {
          const { data: publicUrlData } = supabaseClient.storage
            .from('product-images')
            .getPublicUrl(fileName);

          if (publicUrlData && publicUrlData.publicUrl) {
            // Verify if bucket is public by sending a quick check
            try {
              const res = await fetch(publicUrlData.publicUrl, { method: 'HEAD' });
              if (res.ok) {
                return { url: publicUrlData.publicUrl, error: null };
              }
            } catch (e) {
              console.info('Supabase Storage URL not public or blocked, using Data URL fallback.');
            }
          }
        }
      } catch (error) {
        console.warn('Supabase Storage upload failed, using Data URL:', error.message);
      }
    }

    // Fallback to self-contained Data URL
    return { url: dataUrl, error: null };
  },

  // Add a new product row to both Supabase `products` table and local sync
  async addProduct(productData) {
    const newProduct = {
      id: `prod-${Date.now()}`,
      title: productData.title,
      price: parseFloat(productData.price),
      description: productData.description,
      image_url: productData.image_url,
      category: productData.category || 'Gift Hampers',
      created_at: new Date().toISOString()
    };

    // Save to local storage first for instant visibility
    const localProducts = getLocalProducts();
    localProducts.unshift(newProduct);
    saveLocalProducts(localProducts);

    // Also insert into Supabase if connected
    if (supabaseClient && !isPlaceholderConfig) {
      try {
        const { data, error } = await supabaseClient
          .from('products')
          .insert([{
            title: newProduct.title,
            price: newProduct.price,
            description: newProduct.description,
            image_url: newProduct.image_url,
            category: newProduct.category,
            created_at: newProduct.created_at
          }])
          .select();

        if (!error && data && data[0]) {
          return { data: data[0], error: null };
        }
      } catch (error) {
        console.warn('Supabase Insert warning:', error.message);
      }
    }

    return { data: newProduct, error: null };
  },

  // Delete product row by ID from both local storage and Supabase
  async deleteProduct(id) {
    // Delete from local storage
    let localProducts = getLocalProducts();
    localProducts = localProducts.filter(p => p.id !== id && p.title !== id);
    saveLocalProducts(localProducts);

    if (supabaseClient && !isPlaceholderConfig) {
      try {
        await supabaseClient
          .from('products')
          .delete()
          .eq('id', id);
      } catch (error) {
        console.warn('Supabase Delete warning:', error.message);
      }
    }

    return { error: null };
  },

  // Get About Us Images (2 image limit)
  getAboutImages() {
    const img1 = localStorage.getItem('SS_ABOUT_IMAGE_1') || 'https://images.unsplash.com/photo-1513885535751-8b9238bd48?auto=format&fit=crop&q=80&w=600';
    const img2 = localStorage.getItem('SS_ABOUT_IMAGE_2') || 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&q=80&w=600';
    return { img1, img2 };
  },

  // Upload About Us Image to Supabase Storage bucket `aboutus-images`
  async uploadAboutImage(file, index) {
    if (!file) return { url: null, error: 'No file provided' };

    const readAsDataURL = (fileObj) => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = () => resolve(index === 1 ? 'https://images.unsplash.com/photo-1513885535751-8b9238bd48?auto=format&fit=crop&q=80&w=600' : 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&q=80&w=600');
        reader.readAsDataURL(fileObj);
      });
    };

    const dataUrl = await readAsDataURL(file);
    const ext = file.name.split('.').pop() || 'jpg';
    const fileName = `about_${index}_${Date.now()}.${ext}`;

    let finalUrl = dataUrl;

    if (supabaseClient && !isPlaceholderConfig) {
      try {
        const { data, error } = await supabaseClient.storage
          .from('aboutus-images')
          .upload(fileName, file, { cacheControl: '3600', upsert: true });

        if (!error && data) {
          const { data: publicUrlData } = supabaseClient.storage
            .from('aboutus-images')
            .getPublicUrl(fileName);

          if (publicUrlData && publicUrlData.publicUrl) {
            try {
              const res = await fetch(publicUrlData.publicUrl, { method: 'HEAD' });
              if (res.ok) {
                finalUrl = publicUrlData.publicUrl;
              }
            } catch (e) {
              console.info('Supabase aboutus-images URL not public, using Data URL fallback.');
            }
          }
        }
      } catch (error) {
        console.warn('Supabase aboutus-images upload warning:', error.message);
      }
    }

    localStorage.setItem(`SS_ABOUT_IMAGE_${index}`, finalUrl);
    return { url: finalUrl, error: null };
  },

  // Delete / Reset About Us Image back to default
  async deleteAboutImage(index) {
    localStorage.removeItem(`SS_ABOUT_IMAGE_${index}`);
    return { error: null };
  }
};

// Global Auth Wrapper Service
const AuthService = {
  async getSession() {
    if (supabaseClient && !isPlaceholderConfig) {
      try {
        const { data, error } = await supabaseClient.auth.getSession();
        if (error) throw error;
        return data.session;
      } catch (e) {
        console.warn('Session fetch failed:', e);
      }
    }
    // Fallback demo auth status
    return localStorage.getItem('SS_DEMO_LOGGED_IN') === 'true' ? { user: { email: 'admin@surpriseandstories.com' } } : null;
  },

  async login(email, password, forceDemo = false) {
    if (!forceDemo && supabaseClient && !isPlaceholderConfig) {
      try {
        const { data, error } = await supabaseClient.auth.signInWithPassword({
          email: email,
          password: password
        });
        if (error) throw error;
        return { user: data.user, error: null };
      } catch (error) {
        let msg = error.message;
        if (msg.includes('Invalid login credentials')) {
          msg = 'Invalid credentials on your live Supabase project. Make sure you created a User under Supabase Dashboard -> Authentication -> Users, or click "Use Offline Demo Mode" to log in instantly.';
        }
        return { user: null, error: msg, isSupabaseError: true };
      }
    }

    // Fallback Demo Login
    if (email && password && password.length >= 3) {
      localStorage.setItem('SS_DEMO_LOGGED_IN', 'true');
      return { user: { email: email }, error: null };
    } else {
      return { user: null, error: 'Please enter a valid email and password.' };
    }
  },

  async logout() {
    if (supabaseClient && !isPlaceholderConfig) {
      try {
        await supabaseClient.auth.signOut();
      } catch (e) {
        console.warn('Signout error:', e);
      }
    }
    localStorage.removeItem('SS_DEMO_LOGGED_IN');
    return { error: null };
  }
};

// Toast notification helper
function showToast(message, type = 'success') {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i>
    <span>${message}</span>
  `;

  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    toast.style.transition = 'all 0.4s ease';
    setTimeout(() => toast.remove(), 400);
  }, 3500);
}
