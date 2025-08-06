// Main application initialization
document.addEventListener('DOMContentLoaded', function() {
  console.log('DOM loaded, waiting for modals...');
  
  // Wait for modals to be loaded before initializing
  document.addEventListener('modalsLoaded', async function() {
    console.log('Modals loaded event received, initializing app...');
    await initializeApp();
  });
  
  // Fallback: if modals are already loaded, initialize immediately
  setTimeout(async () => {
    console.log('Fallback timeout triggered, checking for modal...');
    if (document.getElementById('modal')) {
      console.log('Modal found, initializing app...');
      await initializeApp();
    } else {
      console.log('Modal not found in fallback');
    }
  }, 100);
});

async function initializeApp() {
  console.log('Starting app initialization...');
  
  // Ensure we don't initialize twice
  if (window.appInitialized) {
    console.log('App already initialized, skipping...');
    return;
  }
  window.appInitialized = true;
  
  console.log('Loading tags...');
  // Load tags first, then contacts
  await window.TagManager.loadTags();
  
  console.log('Loading contacts...');
  await window.ContactManager.loadContacts();
  
  console.log('Initializing event handlers...');
  // Initialize event handlers
  window.EventHandlers.initializeEventHandlers();
  
  console.log('Dunbar app initialized successfully');
}
