// Event handlers for forms and interactions
window.EventHandlers = {
  initializeEventHandlers() {
    this.setupKeyboardShortcuts();
    this.setupButtonHandlers();
    this.setupFormHandlers();
    this.setupColorPickers();
    this.setupGlobalClickHandler();
  },

  setupKeyboardShortcuts() {
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') {
        EventHandlers.closeOpenModal();
      }
      
      if (e.key === 'Enter') {
        EventHandlers.submitOpenModal(e);
      }
    });
  },

  closeOpenModal() {
    const modals = [
      'modal', 'editModal', 'tagsModal', 'addTagModal', 
      'confirmDeleteModal', 'confirmDeleteTagModal', 'editTagModal'
    ];
    
    modals.forEach(modalId => {
      const modal = document.getElementById(modalId);
      if (modal && modal.style.display === 'flex') {
        modal.style.display = 'none';
        
        // Reset state for specific modals
        if (modalId === 'editModal') {
          window.AppState.setOriginalContactName(null);
        } else if (modalId === 'addTagModal') {
          document.getElementById('addTagForm').reset();
        } else if (modalId === 'confirmDeleteModal') {
          window.AppState.setContactToDelete(null);
        } else if (modalId === 'confirmDeleteTagModal') {
          window.AppState.setTagToDelete(null);
        }
      }
    });
  },

  submitOpenModal(e) {
    const modalFormMap = {
      'modal': 'addForm',
      'editModal': 'editForm',
      'addTagModal': 'addTagForm',
      'editTagModal': 'editTagForm'
    };
    
    for (const [modalId, formId] of Object.entries(modalFormMap)) {
      const modal = document.getElementById(modalId);
      if (modal && modal.style.display === 'flex') {
        e.preventDefault();
        const form = document.getElementById(formId);
        if (form.checkValidity()) {
          form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
        } else {
          form.reportValidity();
        }
        return;
      }
    }
    
    // Handle confirmation modals
    if (document.getElementById('confirmDeleteModal').style.display === 'flex') {
      e.preventDefault();
      document.getElementById('confirmDeleteBtn').click();
    } else if (document.getElementById('confirmDeleteTagModal').style.display === 'flex') {
      e.preventDefault();
      document.getElementById('confirmDeleteTagBtn').click();
    }
  },

  setupButtonHandlers() {
    // Main action buttons
    document.getElementById("addBtn").onclick = () => {
      if (document.getElementById("addBtn").disabled) {
        alert(`Maximum of ${window.AppConfig.MAX_CONTACTS} contacts allowed.`);
        return;
      }
      window.TagManager.loadTags();
      document.getElementById("modal").style.display = "flex";
    };

    document.getElementById("sortBtn").onclick = () => {
      window.AppState.setSortAscending(!window.AppState.sortAscending);
      window.ContactManager.loadContacts(window.AppState.currentFilter);
    };

    document.getElementById("tagBtn").onclick = () => {
      window.TagManager.loadTags();
      document.getElementById("tagsModal").style.display = "flex";
    };

    // Grid view buttons
    document.getElementById("gridViewBtn").onclick = () => {
      if (!document.getElementById("gridViewBtn").disabled) {
        window.ContactManager.showGridView();
      }
    };

    document.getElementById("backToListBtn").onclick = () => {
      window.ContactManager.showListView();
    };

    // Grid action buttons
    document.getElementById("gridSortBtn").onclick = () => {
      window.AppState.setSortAscending(!window.AppState.sortAscending);
      window.ContactManager.showGridView(); // Refresh grid view with new sort
      document.getElementById('gridSortIndicator').textContent = window.AppState.sortAscending ? '↑' : '↓';
    };

    document.getElementById("gridFilterBtn").onclick = () => {
      window.TagManager.loadTags();
      document.getElementById("tagsModal").style.display = "flex";
    };

    document.getElementById("gridAddBtn").onclick = () => {
      if (document.getElementById("gridAddBtn").disabled) {
        alert(`Maximum of ${window.AppConfig.MAX_CONTACTS} contacts allowed.`);
        return;
      }
      window.TagManager.loadTags();
      document.getElementById("modal").style.display = "flex";
    };

    // Delete contact button in edit modal
    document.getElementById("deleteContactBtn").onclick = () => {
      if (window.AppState.originalContactName) {
        window.AppState.setContactToDelete(window.AppState.originalContactName);
        document.getElementById('deleteTargetName').textContent = window.AppState.contactToDelete;
        document.getElementById('confirmDeleteModal').style.display = 'flex';
      }
    };

    // Modal control buttons
    document.getElementById("cancelBtn").onclick = () => {
      document.getElementById("modal").style.display = "none";
    };

    document.getElementById("cancelEditBtn").onclick = () => {
      document.getElementById("editModal").style.display = "none";
      window.AppState.setOriginalContactName(null);
    };

    document.getElementById("closeTagsBtn").onclick = () => {
      document.getElementById("tagsModal").style.display = "none";
    };

    document.getElementById("addTagBtn").onclick = () => {
      if (document.getElementById("addTagBtn").disabled) {
        alert(`Maximum of ${window.AppConfig.MAX_TAGS} tags allowed.`);
        return;
      }
      document.getElementById("addTagModal").style.display = "flex";
    };

    // Cancel buttons for various modals
    this.setupCancelButtons();
    this.setupDeleteButtons();
  },

  setupCancelButtons() {
    document.getElementById("cancelAddTagBtn").onclick = () => {
      document.getElementById("addTagForm").reset();
      this.resetColorPicker('color-option', '#6366f1');
      document.getElementById("addTagModal").style.display = "none";
    };

    document.getElementById("cancelEditTagBtn").onclick = () => {
      document.getElementById("editTagForm").reset();
      this.resetColorPicker('edit-color-option', '#4ade80');
      document.getElementById("editTagModal").style.display = "none";
      window.AppState.setTagToEdit(null);
    };

    document.getElementById('cancelDeleteTagBtn').onclick = () => {
      window.AppState.setTagToDelete(null);
      document.getElementById('confirmDeleteTagModal').style.display = 'none';
    };

    document.getElementById('cancelDeleteBtn').onclick = () => {
      window.AppState.setContactToDelete(null);
      document.getElementById('confirmDeleteModal').style.display = 'none';
    };
  },

  setupDeleteButtons() {
    document.getElementById('confirmDeleteTagBtn').onclick = async () => {
      if (window.AppState.tagToDelete) {
        try {
          const response = await fetch(`/tags/delete?id=${window.AppState.tagToDelete.id}`, { 
            method: 'DELETE' 
          });
          
          if (response.ok) {
            await window.TagManager.loadTags();
            window.ContactManager.loadContacts(window.AppState.currentFilter);
          } else {
            alert('Error deleting tag. Please try again.');
          }
        } catch (err) {
          alert('Error deleting tag. Please try again.');
        }
        
        window.AppState.setTagToDelete(null);
        document.getElementById('confirmDeleteTagModal').style.display = 'none';
      }
    };

    document.getElementById('confirmDeleteBtn').onclick = async () => {
      if (window.AppState.contactToDelete) {
        try {
          const response = await fetch(`/delete?name=${encodeURIComponent(window.AppState.contactToDelete)}`, { 
            method: 'DELETE' 
          });
          
          if (response.ok) {
            // Close edit modal if it's open
            if (document.getElementById('editModal').style.display === 'flex') {
              document.getElementById('editModal').style.display = 'none';
              window.AppState.setOriginalContactName(null);
            }
            
            // Refresh the appropriate view
            if (document.getElementById('gridView').style.display === 'block') {
              window.ContactManager.showGridView();
            } else {
              window.ContactManager.loadContacts(window.AppState.currentFilter);
            }
          } else {
            alert('Error deleting contact. Please try again.');
          }
        } catch (err) {
          alert('Error deleting contact. Please try again.');
        }
        
        window.AppState.setContactToDelete(null);
        document.getElementById('confirmDeleteModal').style.display = 'none';
      }
    };
  },

  setupFormHandlers() {
    // Add contact form
    document.getElementById("addForm").onsubmit = async function(e) {
      e.preventDefault();
      const form = e.target;
      
      const formattedDate = window.ContactManager.formatDateForServer(form.date.value);
      
      const data = {
        name: form.name.value,
        date: formattedDate
      };
      
      if (form.tag.value && form.tag.value !== "all") {
        data.tag_id = parseInt(form.tag.value);
      }
      
      try {
        const response = await fetch('/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          if (errorText.includes('Maximum of 150 contacts allowed')) {
            alert('Cannot add contact: Maximum of 150 contacts reached.');
          } else {
            alert('Error creating contact: ' + errorText);
          }
          return;
        }
        
        form.reset();
        document.getElementById("modal").style.display = "none";
        window.ContactManager.loadContacts(window.AppState.currentFilter);
      } catch (error) {
        alert('Error creating contact. Please try again.');
      }
    };

    // Edit contact form
    document.getElementById("editForm").onsubmit = async function(e) {
      e.preventDefault();
      const form = e.target;
      
      const formattedDate = window.ContactManager.formatDateForServer(form.date.value);
      
      const data = {
        name: form.name.value,
        date: formattedDate
      };
      
      if (form.tag.value && form.tag.value !== "all") {
        data.tag_id = parseInt(form.tag.value);
      }
      
      try {
        if (window.AppState.originalContactName !== form.name.value) {
          await fetch(`/delete?name=${encodeURIComponent(window.AppState.originalContactName)}`, { method: 'DELETE' });
          await fetch('/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
          });
        } else {
          await fetch('/edit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
          });
        }
        
        form.reset();
        document.getElementById("editModal").style.display = "none";
        window.AppState.setOriginalContactName(null);
        window.ContactManager.loadContacts(window.AppState.currentFilter);
      } catch (error) {
        alert('Error updating contact. Please try again.');
      }
    };

    // Add tag form
    document.getElementById("addTagForm").onsubmit = async function(e) {
      e.preventDefault();
      const form = e.target;
      const tagName = form.tagName.value.trim();
      const tagColor = form.tagColor.value;
      
      if (!tagName) return;
      
      // Check for duplicates
      const duplicateTag = window.AppState.allTags.find(tag => 
        tag.name.toLowerCase() === tagName.toLowerCase()
      );
      
      if (duplicateTag) {
        alert(`Tag "${tagName}" already exists. Please choose a different name.`);
        return;
      }
      
      try {
        const response = await fetch('/tags/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: tagName, color: tagColor })
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          alert('Error creating tag: ' + errorText);
          return;
        }
        
        window.TagManager.loadTags();
        form.reset();
        EventHandlers.resetColorPicker('color-option', '#6366f1');
        document.getElementById("addTagModal").style.display = "none";
      } catch (err) {
        alert('Error creating tag. Please try again.');
      }
    };

    // Edit tag form
    document.getElementById("editTagForm").onsubmit = async function(e) {
      e.preventDefault();
      const form = e.target;
      const tagName = form.tagName.value.trim();
      const tagColor = form.tagColor.value;

      if (!tagName || !window.AppState.tagToEdit) {
        alert('Tag name is required');
        return;
      }

      try {
        const response = await fetch(`/tags/edit`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            id: window.AppState.tagToEdit.id,
            name: tagName, 
            color: tagColor 
          })
        });

        if (response.ok) {
          form.reset();
          EventHandlers.resetColorPicker('edit-color-option', '#4ade80');
          document.getElementById("editTagModal").style.display = "none";
          
          await window.TagManager.loadTags();
          window.ContactManager.loadContacts(window.AppState.currentFilter);
          window.AppState.setTagToEdit(null);
        } else {
          const errorText = await response.text();
          alert('Error updating tag: ' + errorText);
        }
      } catch (error) {
        alert('Error updating tag. Please try again.');
      }
    };
  },

  setupColorPickers() {
    // Add tag color picker
    document.querySelectorAll('.color-option').forEach(option => {
      option.onclick = () => {
        document.querySelectorAll('.color-option').forEach(opt => {
          opt.style.border = '2px solid #e5e7eb';
        });
        option.style.border = '2px solid #6366f1';
        document.querySelector('input[name="tagColor"]').value = option.dataset.color;
      };
    });

    // Edit tag color picker
    document.querySelectorAll('.edit-color-option').forEach(option => {
      option.onclick = () => {
        document.querySelectorAll('.edit-color-option').forEach(opt => {
          opt.style.border = '2px solid #d1d5db';
        });
        option.style.border = '2px solid #4ade80';
        document.querySelector('#editTagForm input[name="tagColor"]').value = option.dataset.color;
      };
    });

    // Set default color selection
    setTimeout(() => {
      const defaultOption = document.querySelector('.color-option[data-color="#e5e7eb"]');
      if (defaultOption) {
        defaultOption.style.border = '2px solid #6366f1';
      }
    }, 100);
  },

  resetColorPicker(className, borderColor) {
    document.querySelectorAll(`.${className}`).forEach(option => {
      option.style.border = '2px solid #e5e7eb';
    });
    const defaultOption = document.querySelector(`.${className}[data-color="#e5e7eb"]`);
    if (defaultOption) {
      defaultOption.style.border = `2px solid ${borderColor}`;
    }
    const hiddenInput = document.querySelector('input[name="tagColor"]');
    if (hiddenInput) {
      hiddenInput.value = '#e5e7eb';
    }
  },

  setupGlobalClickHandler() {
    document.addEventListener('click', async function(e) {
      // Handle tag editing
      if (e.target.classList.contains('editTagBtn')) {
        e.stopPropagation();
        window.AppState.setTagToEdit({
          id: parseInt(e.target.dataset.tagId),
          name: e.target.dataset.tagName,
          color: e.target.dataset.tagColor
        });
        
        const editForm = document.getElementById('editTagForm');
        editForm.tagName.value = window.AppState.tagToEdit.name;
        editForm.tagColor.value = window.AppState.tagToEdit.color;
        
        document.querySelectorAll('.edit-color-option').forEach(option => {
          if (option.dataset.color === window.AppState.tagToEdit.color) {
            option.style.border = '2px solid #4ade80';
          } else {
            option.style.border = '2px solid #d1d5db';
          }
        });
        
        document.getElementById('editTagModal').style.display = 'flex';
      }
      // Handle tag deletion
      else if (e.target.classList.contains('deleteTagBtn')) {
        e.stopPropagation();
        window.AppState.setTagToDelete({
          id: e.target.dataset.tagId,
          name: e.target.dataset.tagName
        });
        document.getElementById('deleteTargetTagName').textContent = window.AppState.tagToDelete.name;
        document.getElementById('confirmDeleteTagModal').style.display = 'flex';
      }
      // Handle row click for editing contacts
      else if (e.target.tagName === 'TD' && e.target.closest('tbody')) {
        const row = e.target.closest('tr');
        const name = row.dataset.name;
        const date = row.dataset.date;
        const tagId = row.dataset.tagId;
        
        if (name && date) {
          window.AppState.setOriginalContactName(name);
          
          await window.TagManager.loadTags();
          
          const editForm = document.getElementById('editForm');
          editForm.name.value = name;
          editForm.date.value = window.ContactManager.formatDateForInput(date);
          editForm.tag.value = tagId || '';
          
          document.getElementById('editModal').style.display = 'flex';
        }
      }
      // Handle grid contact row click for editing contacts
      else if (e.target.closest('.grid-contact-row')) {
        const row = e.target.closest('.grid-contact-row');
        const name = row.dataset.name;
        const date = row.dataset.date;
        const tagId = row.dataset.tagId;
        
        if (name && date) {
          window.AppState.setOriginalContactName(name);
          
          await window.TagManager.loadTags();
          
          const editForm = document.getElementById('editForm');
          editForm.name.value = name;
          editForm.date.value = window.ContactManager.formatDateForInput(date);
          editForm.tag.value = tagId || '';
          
          document.getElementById('editModal').style.display = 'flex';
        }
      }
    });
  }
};
