/* ----------------------------------------------------
   Surprise and Stories - Production Supabase Config & Services
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

// Production Supabase Configuration
const SUPABASE_URL = sanitizeSupabaseUrl('https://pflduczzlxpuxianmevd.supabase.co');
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmbGR1Y3p6bHhwdXhpYW5tZXZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU3NzI1ODUsImV4cCI6MjEwMTM0ODU4NX0.rH8TNnzG11kc9uxpl59VCyTeaPDxHH10DpK-bTW_JHo';
const WHATSAPP_PHONE = '918180907632';

// Initialize Supabase Client
let supabaseClient = null;
if (typeof supabase !== 'undefined') {
  try {
    supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log('✅ Production Supabase Client connected:', SUPABASE_URL);
  } catch (err) {
    console.error('❌ Supabase init error:', err);
  }
} else {
  console.error('❌ Supabase JS SDK not loaded');
}

// Global Production Database & Storage Service Wrapper
const DBService = {
  // Fetch all products directly from Supabase `products` table
  async getProducts() {
    if (!supabaseClient) return { data: [], error: { message: 'Supabase client not initialized' } };

    try {
      const { data, error } = await supabaseClient
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { data: data || [], error: null };
    } catch (error) {
      console.error('Error fetching products from Supabase:', error.message);
      return { data: [], error };
    }
  },

  // Upload image file directly to Supabase Storage bucket `product-images`
  async uploadImage(file) {
    if (!file) return { url: null, error: 'No file provided' };
    if (!supabaseClient) return { url: null, error: 'Supabase client not initialized' };

    const fileName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;

    try {
      const { data, error } = await supabaseClient.storage
        .from('product-images')
        .upload(fileName, file, { cacheControl: '3600', upsert: true });

      if (error) throw error;

      const { data: publicUrlData } = supabaseClient.storage
        .from('product-images')
        .getPublicUrl(fileName);

      return { url: publicUrlData.publicUrl, error: null };
    } catch (error) {
      console.error('Error uploading product image to Supabase Storage:', error.message);
      return { url: null, error: error.message };
    }
  },

  // Add a new product row directly to Supabase `products` table
  async addProduct(productData) {
    if (!supabaseClient) return { data: null, error: { message: 'Supabase client not initialized' } };

    const newProduct = {
      title: productData.title,
      price: parseFloat(productData.price),
      description: productData.description,
      image_url: productData.image_url,
      category: productData.category || 'Gift Hampers',
      created_at: new Date().toISOString()
    };

    try {
      const { data, error } = await supabaseClient
        .from('products')
        .insert([newProduct])
        .select();

      if (error) throw error;
      return { data: data ? data[0] : newProduct, error: null };
    } catch (error) {
      console.error('Error inserting product into Supabase DB:', error.message);
      return { data: null, error };
    }
  },

  // Delete product row directly from Supabase `products` table
  async deleteProduct(id) {
    if (!supabaseClient) return { error: { message: 'Supabase client not initialized' } };

    try {
      const { error } = await supabaseClient
        .from('products')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { error: null };
    } catch (error) {
      console.error('Error deleting product from Supabase DB:', error.message);
      return { error };
    }
  },

  // Get About Us Images directly from Supabase Storage bucket `aboutus-images`
  async getAboutImages() {
    let img1 = 'https://images.unsplash.com/photo-1513885535751-8b9238bd48?auto=format&fit=crop&q=80&w=600';
    let img2 = 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&q=80&w=600';

    if (!supabaseClient) return { img1, img2 };

    try {
      const { data: list, error } = await supabaseClient.storage
        .from('aboutus-images')
        .list('', { sortBy: { column: 'created_at', order: 'desc' } });

      if (!error && list && list.length > 0) {
        const file1 = list.find(f => f.name.startsWith('about_1'));
        const file2 = list.find(f => f.name.startsWith('about_2'));

        if (file1) {
          img1 = supabaseClient.storage.from('aboutus-images').getPublicUrl(file1.name).data.publicUrl;
        }
        if (file2) {
          img2 = supabaseClient.storage.from('aboutus-images').getPublicUrl(file2.name).data.publicUrl;
        }
      }
    } catch (e) {
      console.warn('Could not list aboutus-images from Supabase Storage:', e.message);
    }

    return { img1, img2 };
  },

  // Upload About Us Image directly to Supabase Storage bucket `aboutus-images`
  async uploadAboutImage(file, index) {
    if (!file) return { url: null, error: 'No file provided' };
    if (!supabaseClient) return { url: null, error: 'Supabase client not initialized' };

    const ext = file.name.split('.').pop() || 'jpg';
    const fileName = `about_${index}_${Date.now()}.${ext}`;

    try {
      const { data, error } = await supabaseClient.storage
        .from('aboutus-images')
        .upload(fileName, file, { cacheControl: '3600', upsert: true });

      if (error) throw error;

      const { data: publicUrlData } = supabaseClient.storage
        .from('aboutus-images')
        .getPublicUrl(fileName);

      return { url: publicUrlData.publicUrl, error: null };
    } catch (error) {
      console.error('Error uploading about us image:', error.message);
      return { url: null, error: error.message };
    }
  },

  // Delete About Us Image from Supabase Storage bucket `aboutus-images`
  async deleteAboutImage(index) {
    if (!supabaseClient) return { error: null };

    try {
      const { data: list } = await supabaseClient.storage
        .from('aboutus-images')
        .list();

      if (list && list.length > 0) {
        const toDelete = list.filter(f => f.name.startsWith(`about_${index}`)).map(f => f.name);
        if (toDelete.length > 0) {
          await supabaseClient.storage.from('aboutus-images').remove(toDelete);
        }
      }
    } catch (e) {
      console.warn('Error deleting about image from Supabase Storage:', e.message);
    }

    return { error: null };
  }
};

// Production Auth Wrapper Service
const AuthService = {
  async getSession() {
    if (!supabaseClient) return null;
    try {
      const { data, error } = await supabaseClient.auth.getSession();
      if (error) throw error;
      return data.session;
    } catch (e) {
      console.warn('Session check error:', e.message);
      return null;
    }
  },

  async login(email, password) {
    if (!supabaseClient) return { user: null, error: 'Supabase client not initialized' };

    try {
      const { data, error } = await supabaseClient.auth.signInWithPassword({
        email: email,
        password: password
      });

      if (error) throw error;
      return { user: data.user, error: null };
    } catch (error) {
      return { user: null, error: error.message };
    }
  },

  async logout() {
    if (supabaseClient) {
      try {
        await supabaseClient.auth.signOut();
      } catch (e) {
        console.warn('Signout error:', e.message);
      }
    }
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
