// Configuration constants
const MAX_CONTACTS = 150;
const MAX_TAGS = 10;

// Export for use in other modules
window.AppConfig = {
  MAX_CONTACTS,
  MAX_TAGS
};

// Global state object - use object properties for proper reference sharing
window.AppState = {
  sortAscending: false,
  allTags: [],
  currentFilter: null,
  originalContactName: null,
  tagToDelete: null,
  tagToEdit: null,
  contactToDelete: null,
  
  setSortAscending: function(value) { this.sortAscending = value; },
  setAllTags: function(value) { this.allTags = value; },
  setCurrentFilter: function(value) { this.currentFilter = value; },
  setOriginalContactName: function(value) { this.originalContactName = value; },
  setTagToDelete: function(value) { this.tagToDelete = value; },
  setTagToEdit: function(value) { this.tagToEdit = value; },
  setContactToDelete: function(value) { this.contactToDelete = value; }
};
