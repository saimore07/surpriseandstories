/* ----------------------------------------------------
   Surprise and Stories - Admin Dashboard & Auth Logic
   ---------------------------------------------------- */

document.addEventListener('DOMContentLoaded', async () => {
  // UI Elements
  const loginView = document.getElementById('login-view');
  const dashboardView = document.getElementById('dashboard-view');
  const loginForm = document.getElementById('login-form');
  const logoutBtn = document.getElementById('logout-btn');
  const userEmailDisplay = document.getElementById('user-email-display');
  const userAvatarInitial = document.getElementById('user-avatar-initial');
  const userStatusText = document.getElementById('user-status-text');

  // Stats Elements
  const statTotalProducts = document.getElementById('stat-total-products');
  const statTotalCategories = document.getElementById('stat-total-categories');
  const statWhatsappPhone = document.getElementById('stat-whatsapp-phone');
  const statSystemMode = document.getElementById('stat-system-mode');

  // Inventory Table
  const inventoryTableBody = document.getElementById('inventory-table-body');
  const refreshInventoryBtn = document.getElementById('refresh-inventory-btn');

  // Add Product Form & Dropzone
  const addProductForm = document.getElementById('add-product-form');
  const prodImageFileInput = document.getElementById('prod-image-file');
  const imagePreviewWrapper = document.getElementById('image-preview-wrapper');
  const imagePreview = document.getElementById('image-preview');
  const removeImgBtn = document.getElementById('remove-img-btn');
  const submitProductBtn = document.getElementById('submit-product-btn');
  const dropzone = document.getElementById('dropzone');

  // Settings Form
  const settingsForm = document.getElementById('settings-form');
  const configSupabaseUrl = document.getElementById('config-supabase-url');
  const configSupabaseKey = document.getElementById('config-supabase-key');
  const configWhatsappPhone = document.getElementById('config-whatsapp-phone');
  const resetSettingsBtn = document.getElementById('reset-settings-btn');

  // Active state variables
  let currentFile = null;
  let cachedProducts = [];

  // 1. Auth Guard - Check initial session
  async function checkAuthSession() {
    const session = await AuthService.getSession();
    if (session && session.user) {
      showDashboard(session.user);
    } else {
      showLogin();
    }
  }

  function showLogin() {
    loginView.style.display = 'flex';
    dashboardView.style.display = 'none';
  }

  function showDashboard(user) {
    loginView.style.display = 'none';
    dashboardView.style.display = 'block';

    const email = user.email || 'admin@surpriseandstories.com';
    if (userEmailDisplay) userEmailDisplay.textContent = email;
    if (userAvatarInitial) userAvatarInitial.textContent = email.charAt(0).toUpperCase();

    // Set connection mode status
    if (statSystemMode) {
      statSystemMode.innerHTML = '<span style="color: #10B981;"><i class="fa-solid fa-circle-check"></i> Supabase Live</span>';
      if (userStatusText) userStatusText.textContent = 'Supabase Administrator';
    }

    if (statWhatsappPhone) {
      statWhatsappPhone.textContent = `+${WHATSAPP_PHONE}`;
    }

    loadInventory();
    initSettingsFormValues();
    initAboutImagesAdmin();
  }

  // Login Submit Handler
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('login-email').value;
      const password = document.getElementById('login-password').value;
      const loginBtn = document.getElementById('login-btn');

      loginBtn.disabled = true;
      loginBtn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Signing In...';

      const { user, error } = await AuthService.login(email, password);

      loginBtn.disabled = false;
      loginBtn.innerHTML = '<i class="fa-solid fa-right-to-bracket"></i> Sign In to Dashboard';

      if (error) {
        showToast(error, 'error');
      } else {
        showToast('Logged in successfully!', 'success');
        showDashboard(user);
      }
    });
  }

  // Logout Handler
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      await AuthService.logout();
      showToast('Logged out of admin portal.', 'info');
      showLogin();
    });
  }

  // 2. Tab Navigation Handler
  const tabBtns = document.querySelectorAll('.admin-tab-btn');
  const tabPanes = document.querySelectorAll('.tab-pane');

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetTab = btn.getAttribute('data-tab');

      tabBtns.forEach(b => b.classList.remove('active'));
      tabPanes.forEach(pane => pane.style.display = 'none');

      btn.classList.add('active');
      const activePane = document.getElementById(targetTab);
      if (activePane) activePane.style.display = 'block';
    });
  });

  // 3. File Dropzone & Image Handling
  if (prodImageFileInput) {
    prodImageFileInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files[0]) {
        handleFileSelect(e.target.files[0]);
      }
    });
  }

  if (dropzone) {
    ['dragenter', 'dragover'].forEach(eventName => {
      dropzone.addEventListener(eventName, (e) => {
        e.preventDefault();
        dropzone.classList.add('dragover');
      }, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
      dropzone.addEventListener(eventName, (e) => {
        e.preventDefault();
        dropzone.classList.remove('dragover');
      }, false);
    });

    dropzone.addEventListener('drop', (e) => {
      const dt = e.dataTransfer;
      const files = dt.files;
      if (files && files[0]) {
        handleFileSelect(files[0]);
      }
    });
  }

  function handleFileSelect(file) {
    if (!file.type.startsWith('image/')) {
      showToast('Please select a valid image file (JPG, PNG, WEBP).', 'error');
      return;
    }

    currentFile = file;
    const reader = new FileReader();
    reader.onload = (e) => {
      imagePreview.src = e.target.result;
      imagePreviewWrapper.style.display = 'block';
    };
    reader.readAsDataURL(file);
  }

  if (removeImgBtn) {
    removeImgBtn.addEventListener('click', () => {
      currentFile = null;
      prodImageFileInput.value = '';
      imagePreview.src = '';
      imagePreviewWrapper.style.display = 'none';
    });
  }

  // 4. Add Product Form Submit Handler
  if (addProductForm) {
    addProductForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const title = document.getElementById('prod-title').value.trim();
      const price = document.getElementById('prod-price').value.trim();
      const category = document.getElementById('prod-category').value;
      const description = document.getElementById('prod-desc').value.trim();

      if (!currentFile) {
        showToast('Please upload a product image photo.', 'error');
        return;
      }

      submitProductBtn.disabled = true;
      submitProductBtn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Uploading Image & Saving...';

      try {
        // Step 1: Upload image file to Supabase Storage bucket `product-images`
        const { url: imageUrl, error: uploadErr } = await DBService.uploadImage(currentFile);

        if (uploadErr) {
          throw new Error('Image upload failed: ' + uploadErr);
        }

        // Step 2: Insert product row into Supabase `products` table
        const { data: newProd, error: dbErr } = await DBService.addProduct({
          title: title,
          price: price,
          category: category,
          description: description,
          image_url: imageUrl
        });

        if (dbErr) {
          throw new Error('Database insert failed: ' + dbErr.message);
        }

        showToast(`Product "${title}" added successfully!`, 'success');

        // Reset form state
        addProductForm.reset();
        currentFile = null;
        imagePreview.src = '';
        imagePreviewWrapper.style.display = 'none';

        // Switch back to Inventory Tab & Refresh
        const inventoryTabBtn = document.querySelector('[data-tab="tab-inventory"]');
        if (inventoryTabBtn) inventoryTabBtn.click();
        loadInventory();

      } catch (err) {
        showToast(err.message || 'Error adding product.', 'error');
      } finally {
        submitProductBtn.disabled = false;
        submitProductBtn.innerHTML = '<i class="fa-solid fa-cloud-arrow-up"></i> Upload Product to Store';
      }
    });
  }

  // 5. Load & Render Inventory Table
  async function loadInventory() {
    if (!inventoryTableBody) return;

    inventoryTableBody.innerHTML = `
      <tr>
        <td colspan="6" class="text-center" style="padding: 3rem 0;">
          <i class="fa-solid fa-circle-notch fa-spin" style="font-size: 1.8rem; color: var(--primary);"></i>
          <p style="margin-top: 0.5rem; color: var(--text-muted);">Fetching products from database...</p>
        </td>
      </tr>
    `;

    const { data, error } = await DBService.getProducts();

    if (error) {
      inventoryTableBody.innerHTML = `
        <tr>
          <td colspan="6" class="text-center text-danger" style="padding: 2rem 0;">
            <i class="fa-solid fa-circle-exclamation"></i> Error loading products: ${error.message}
          </td>
        </tr>
      `;
      return;
    }

    cachedProducts = data || [];

    // Update Stats
    if (statTotalProducts) statTotalProducts.textContent = cachedProducts.length;

    const categories = new Set(cachedProducts.map(p => p.category || 'General'));
    if (statTotalCategories) statTotalCategories.textContent = categories.size;

    if (cachedProducts.length === 0) {
      inventoryTableBody.innerHTML = `
        <tr>
          <td colspan="6" class="text-center" style="padding: 3rem 0; color: var(--text-muted);">
            <i class="fa-solid fa-box-open" style="font-size: 2rem; margin-bottom: 0.5rem;"></i>
            <p>No products in inventory yet. Click "Add New Product" to create one.</p>
          </td>
        </tr>
      `;
      return;
    }

    const formatINR = (val) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);

    inventoryTableBody.innerHTML = cachedProducts.map(prod => {
      const dateStr = prod.created_at ? new Date(prod.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Recently';
      const img = prod.image_url || 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&q=80&w=800';

      return `
        <tr data-id="${prod.id}">
          <td>
            <img src="${img}" alt="${prod.title}" class="table-img" onerror="this.src='https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&q=80&w=800'">
          </td>
          <td>
            <strong>${prod.title}</strong>
            <div style="font-size: 0.78rem; color: var(--text-muted); max-width: 280px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
              ${prod.description || ''}
            </div>
          </td>
          <td>
            <span class="badge badge-primary">${prod.category || 'Gift Hampers'}</span>
          </td>
          <td style="font-weight: 700; color: var(--primary);">
            ${formatINR(prod.price)}
          </td>
          <td style="font-size: 0.82rem; color: var(--text-muted);">
            ${dateStr}
          </td>
          <td class="text-right">
            <button class="btn btn-danger btn-delete-product" data-id="${prod.id}" data-title="${prod.title}">
              <i class="fa-solid fa-trash-can"></i> Delete
            </button>
          </td>
        </tr>
      `;
    }).join('');

    // Attach Delete Event Listeners
    inventoryTableBody.querySelectorAll('.btn-delete-product').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-id');
        const title = btn.getAttribute('data-title');

        if (confirm(`Are you sure you want to delete "${title}" from inventory?`)) {
          btn.disabled = true;
          btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';

          const { error } = await DBService.deleteProduct(id);

          if (error) {
            showToast('Failed to delete product: ' + error.message, 'error');
            btn.disabled = false;
            btn.innerHTML = '<i class="fa-solid fa-trash-can"></i> Delete';
          } else {
            showToast(`Product "${title}" deleted.`, 'info');
            loadInventory();
          }
        }
      });
    });
  }

  if (refreshInventoryBtn) {
    refreshInventoryBtn.addEventListener('click', () => {
      loadInventory();
      showToast('Inventory reloaded.', 'info');
    });
  }

  // 6. Settings Form Initialization & Handler
  function initSettingsFormValues() {
    if (configSupabaseUrl) configSupabaseUrl.value = SUPABASE_URL;
    if (configSupabaseKey) configSupabaseKey.value = SUPABASE_ANON_KEY;
  }

  if (settingsForm) {
    settingsForm.addEventListener('submit', (e) => {
      e.preventDefault();
      showToast('Production Supabase configuration updated.', 'success');
    });
  }

  // 7. About Us Images Handler
  const aboutImagesForm = document.getElementById('about-images-form');
  const aboutFile1 = document.getElementById('about-file-1');
  const aboutFile2 = document.getElementById('about-file-2');
  const aboutPreview1 = document.getElementById('about-preview-1');
  const aboutPreview2 = document.getElementById('about-preview-2');
  const saveAboutImgsBtn = document.getElementById('save-about-imgs-btn');

  async function initAboutImagesAdmin() {
    if (aboutPreview1 || aboutPreview2) {
      const { img1, img2 } = await DBService.getAboutImages();
      if (aboutPreview1 && img1) aboutPreview1.src = img1;
      if (aboutPreview2 && img2) aboutPreview2.src = img2;
    }
  }

  if (aboutFile1) {
    aboutFile1.addEventListener('change', (e) => {
      if (e.target.files && e.target.files[0]) {
        const reader = new FileReader();
        reader.onload = (evt) => { if (aboutPreview1) aboutPreview1.src = evt.target.result; };
        reader.readAsDataURL(e.target.files[0]);
      }
    });
  }

  if (aboutFile2) {
    aboutFile2.addEventListener('change', (e) => {
      if (e.target.files && e.target.files[0]) {
        const reader = new FileReader();
        reader.onload = (evt) => { if (aboutPreview2) aboutPreview2.src = evt.target.result; };
        reader.readAsDataURL(e.target.files[0]);
      }
    });
  }

  if (aboutImagesForm) {
    aboutImagesForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const file1 = aboutFile1 && aboutFile1.files ? aboutFile1.files[0] : null;
      const file2 = aboutFile2 && aboutFile2.files ? aboutFile2.files[0] : null;

      if (!file1 && !file2) {
        showToast('Please select at least 1 image file to upload.', 'info');
        return;
      }

      saveAboutImgsBtn.disabled = true;
      saveAboutImgsBtn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Uploading to aboutus-images bucket...';

      try {
        if (file1) {
          await DBService.uploadAboutImage(file1, 1);
        }
        if (file2) {
          await DBService.uploadAboutImage(file2, 2);
        }

        showToast('About Us photos updated successfully!', 'success');
        initAboutImagesAdmin();
      } catch (err) {
        showToast(err.message || 'Failed to upload About Us photos.', 'error');
      } finally {
        saveAboutImgsBtn.disabled = false;
        saveAboutImgsBtn.innerHTML = '<i class="fa-solid fa-cloud-arrow-up"></i> Upload & Save About Us Photos';
      }
    });
  }

  // Delete / Reset About Us Image Event Listeners
  const deleteAbout1Btn = document.getElementById('delete-about-1-btn');
  const deleteAbout2Btn = document.getElementById('delete-about-2-btn');

  if (deleteAbout1Btn) {
    deleteAbout1Btn.addEventListener('click', async () => {
      if (confirm('Are you sure you want to delete / reset About Us Photo 1?')) {
        await DBService.deleteAboutImage(1);
        if (aboutFile1) aboutFile1.value = '';
        initAboutImagesAdmin();
        showToast('About Us Photo 1 reset to default.', 'info');
      }
    });
  }

  if (deleteAbout2Btn) {
    deleteAbout2Btn.addEventListener('click', async () => {
      if (confirm('Are you sure you want to delete / reset About Us Photo 2?')) {
        await DBService.deleteAboutImage(2);
        if (aboutFile2) aboutFile2.value = '';
        initAboutImagesAdmin();
        showToast('About Us Photo 2 reset to default.', 'info');
      }
    });
  }

  // Initial Auth Check
  checkAuthSession();
});
