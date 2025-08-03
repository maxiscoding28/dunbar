const MAX_CONTACTS = 150;
const MAX_TAGS = 10;

// Sort state - default to descending (most recent first)
    let sortAscending = false;

    async function loadContacts(filterTagId = null) {
      const res = await fetch('/list');
      const contacts = await res.json();
      const tbody = document.querySelector("#contacts tbody");
      tbody.innerHTML = '';
      
      // Check contact limit and update Add button state
      const addBtn = document.getElementById("addBtn");
      if (contacts.length >= MAX_CONTACTS) {
        addBtn.disabled = true;
        addBtn.textContent = `Add (${contacts.length}/${MAX_CONTACTS})`;
        addBtn.style.opacity = '0.5';
        addBtn.style.cursor = 'not-allowed';
      } else {
        addBtn.disabled = false;
        addBtn.textContent = 'Add';
        addBtn.style.opacity = '1';
        addBtn.style.cursor = 'pointer';
      }
      
      // Filter contacts if a tag filter is active
      const filteredContacts = filterTagId 
        ? contacts.filter(c => c.tag_id === filterTagId)
        : contacts;
      
      // Sort contacts by date
      filteredContacts.sort((a, b) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        return sortAscending ? dateA - dateB : dateB - dateA;
      });
      
      filteredContacts.forEach(c => {
        const row = document.createElement("tr");
        const [year, month, dayWithTime] = c.date.split('-');
        const day = dayWithTime.split('T')[0];
        const formatted = `${month}/${day}/${year}`;
        row.style.cursor = "pointer";
        row.dataset.name = c.name;
        row.dataset.date = formatted;
        row.dataset.tagId = c.tag_id || ''; // Store tag_id for editing
        
        // Find tag info for color
        let tagDisplay = c.tag || '';
        let tagColor = '#e5e7eb'; // default color
        if (c.tag_id && allTags) {
          const tagInfo = allTags.find(tag => tag.id == c.tag_id);
          if (tagInfo && tagInfo.color) {
            tagColor = tagInfo.color;
          }
        }
        
        // Create tag display with color if tag exists
        const tagCell = c.tag ? 
          `<span style="background: ${tagColor}; padding: 0.2rem 0.5rem; border-radius: 3px; font-size: 0.9rem;">${c.tag}</span>` : 
          '';
        
        row.innerHTML = `
          <td style="text-align: center;">${c.name}</td>
          <td style="text-align: center;">${formatted}</td>
          <td style="text-align: center;">${tagCell}</td>
          <td style="text-align: center;">
            <button class="deleteBtn" data-name="${c.name}" style="border: none; background: none; color: #666; cursor: pointer; font-size: 0.8rem; opacity: 0; transition: opacity 0.2s;">Delete</button>
          </td>
        `;
        
        // Add hover event listeners to show/hide delete button
        row.addEventListener('mouseenter', function() {
          const deleteBtn = this.querySelector('.deleteBtn');
          deleteBtn.style.opacity = '1';
        });
        
        row.addEventListener('mouseleave', function() {
          const deleteBtn = this.querySelector('.deleteBtn');
          deleteBtn.style.opacity = '0';
        });
        
        tbody.appendChild(row);
      });
      
      // Update sort indicator
      document.getElementById('sortIndicator').textContent = sortAscending ? '↑' : '↓';
    }

    // Initialize the page by loading tags first, then contacts
    async function initializePage() {
      await loadTags(); // Wait for tags to load first
      loadContacts(); // Then load contacts with tag color information
    }

    initializePage();

    // Global keyboard shortcuts for modals
    document.addEventListener('keydown', function(e) {
      // ESC key - close any open modal
      if (e.key === 'Escape') {
        // Check which modal is open and close it
        if (document.getElementById('modal').style.display === 'flex') {
          document.getElementById('modal').style.display = 'none';
        } else if (document.getElementById('editModal').style.display === 'flex') {
          document.getElementById('editModal').style.display = 'none';
          originalContactName = null;
        } else if (document.getElementById('tagsModal').style.display === 'flex') {
          document.getElementById('tagsModal').style.display = 'none';
        } else if (document.getElementById('addTagModal').style.display === 'flex') {
          document.getElementById('addTagForm').reset();
          document.getElementById('addTagModal').style.display = 'none';
        } else if (document.getElementById('confirmDeleteModal').style.display === 'flex') {
          contactToDelete = null;
          document.getElementById('confirmDeleteModal').style.display = 'none';
        } else if (document.getElementById('confirmDeleteTagModal').style.display === 'flex') {
          tagToDelete = null;
          document.getElementById('confirmDeleteTagModal').style.display = 'none';
        }
      }
      
      // ENTER key - submit/confirm current modal
      if (e.key === 'Enter') {
        // Check which modal is open and trigger appropriate action
        if (document.getElementById('modal').style.display === 'flex') {
          e.preventDefault();
          const form = document.getElementById('addForm');
          if (form.checkValidity()) {
            form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
          } else {
            form.reportValidity(); // Show validation messages
          }
        } else if (document.getElementById('editModal').style.display === 'flex') {
          e.preventDefault();
          const form = document.getElementById('editForm');
          if (form.checkValidity()) {
            form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
          } else {
            form.reportValidity(); // Show validation messages
          }
        } else if (document.getElementById('addTagModal').style.display === 'flex') {
          e.preventDefault();
          const form = document.getElementById('addTagForm');
          if (form.checkValidity()) {
            form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
          } else {
            form.reportValidity(); // Show validation messages
          }
        } else if (document.getElementById('confirmDeleteModal').style.display === 'flex') {
          e.preventDefault();
          document.getElementById('confirmDeleteBtn').click();
        } else if (document.getElementById('confirmDeleteTagModal').style.display === 'flex') {
          e.preventDefault();
          document.getElementById('confirmDeleteTagBtn').click();
        }
      }
    });

    document.getElementById("addBtn").onclick = () => {
      // Check if we're at the contact limit
      if (document.getElementById("addBtn").disabled) {
        alert(`Maximum of ${MAX_CONTACTS} contacts allowed.`);
        return;
      }
      
      loadTags(); // Refresh tags when opening modal
      document.getElementById("modal").style.display = "flex";
    };

    document.getElementById("sortBtn").onclick = () => {
      sortAscending = !sortAscending; // Toggle sort order
      loadContacts(currentFilter); // Reload with current filter and new sort order
    };

    document.getElementById("addForm").onsubmit = async function(e) {
      e.preventDefault();
      const form = e.target;
      
      // Use default date if no date is provided
      let dateValue = form.date.value;
      if (!dateValue.trim()) {
        dateValue = "06/28/1947";
      }
      
      // Handle date format - check if it's already YYYY-MM-DD (from date picker) or MM/DD/YYYY (from default)
      let formattedDate;
      if (dateValue.includes('/')) {
        const [mm, dd, yyyy] = dateValue.split('/');
        formattedDate = `${yyyy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`;
      } else {
        formattedDate = dateValue; // Already in YYYY-MM-DD format
      }
      
      const data = {
        name: form.name.value,
        date: formattedDate
      };
      
      // Add tag_id if a tag is selected (but not for special "all" value)
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
        loadContacts(currentFilter);
      } catch (error) {
        console.error('Error creating contact:', error);
        alert('Error creating contact. Please try again.');
      }
    };
    document.getElementById("cancelBtn").onclick = () => {
      document.getElementById("modal").style.display = "none";
    };

    // Edit modal functionality
    let originalContactName = null;

    document.getElementById("editForm").onsubmit = async function(e) {
      e.preventDefault();
      const form = e.target;
      
      // Use default date if no date is provided
      let dateValue = form.date.value;
      if (!dateValue.trim()) {
        dateValue = "06/28/1947";
      }
      
      // Handle date format - check if it's already YYYY-MM-DD (from date picker) or MM/DD/YYYY (from default)
      let formattedDate;
      if (dateValue.includes('/')) {
        const [mm, dd, yyyy] = dateValue.split('/');
        formattedDate = `${yyyy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`;
      } else {
        formattedDate = dateValue; // Already in YYYY-MM-DD format
      }
      
      const data = {
        name: form.name.value,
        date: formattedDate
      };
      
      // Add tag_id if a tag is selected (but not for special "all" value)
      if (form.tag.value && form.tag.value !== "all") {
        data.tag_id = parseInt(form.tag.value);
      }
      
      // If name changed, delete old contact and create new one
      if (originalContactName !== form.name.value) {
        await fetch(`/delete?name=${encodeURIComponent(originalContactName)}`, { method: 'DELETE' });
        await fetch('/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
      } else {
        // Just update the date and tag
        await fetch('/edit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
      }
      
      form.reset();
      document.getElementById("editModal").style.display = "none";
      originalContactName = null;
      loadContacts(currentFilter);
    };

    document.getElementById("cancelEditBtn").onclick = () => {
      document.getElementById("editModal").style.display = "none";
      originalContactName = null;
    };

    // Tags modal functionality
    let allTags = []; // Store tags as objects with id and name
    let currentFilter = null; // Track current tag filter

    function loadTags() {
      // Load tags from the tags API endpoint
      return fetch('/tags/list')
        .then(res => res.json())
        .then(tags => {
          allTags = tags || []; // Handle null response
          displayTags();
          populateTagDropdowns();
        })
        .catch(err => console.error('Error loading tags:', err));
    }

    function populateTagDropdowns() {
      const addTagSelect = document.querySelector('#addForm select[name="tag"]');
      const editTagSelect = document.querySelector('#editForm select[name="tag"]');
      
      // Check if elements exist before trying to populate them
      if (!addTagSelect || !editTagSelect) {
        console.warn('Tag dropdown elements not found');
        return;
      }
      
      // Clear existing options and add special options
      [addTagSelect, editTagSelect].forEach(select => {
        // Clear all existing options
        select.innerHTML = '';
        
        // Add the "No tag" option first
        const noTagOption = document.createElement('option');
        noTagOption.value = '';
        noTagOption.textContent = 'No tag';
        select.appendChild(noTagOption);
        
        // Add all tags
        allTags.forEach(tag => {
          const option = document.createElement('option');
          option.value = tag.id;
          option.textContent = tag.name;
          select.appendChild(option);
        });
      });
    }

    function displayTags() {
      const tagsList = document.getElementById('tagsList');
      tagsList.innerHTML = '';
      
      // Check tag limit and update Add Tag button state
      const addTagBtn = document.getElementById("addTagBtn");
      if (allTags.length >= MAX_TAGS) {
        addTagBtn.disabled = true;
        addTagBtn.textContent = `Add Tag (${allTags.length}/${MAX_TAGS})`;
        addTagBtn.style.opacity = '0.5';
        addTagBtn.style.cursor = 'not-allowed';
      } else {
        addTagBtn.disabled = false;
        addTagBtn.textContent = 'Add Tag';
        addTagBtn.style.opacity = '1';
        addTagBtn.style.cursor = 'pointer';
      }
      
      // Add the special "All" tag first
      const allTagElement = document.createElement('div');
      allTagElement.style.cssText = 'padding: 0.5rem; margin: 0.25rem 0; background: #e5e7eb; border-radius: 4px; display: flex; justify-content: space-between; align-items: center; cursor: pointer;';
      allTagElement.innerHTML = `<span><strong>All</strong></span>`;
      allTagElement.addEventListener('click', () => {
        currentFilter = null;
        loadContacts();
        document.getElementById("tagsModal").style.display = "none";
      });
      tagsList.appendChild(allTagElement);
      
      if (!allTags || allTags.length === 0) {
        const noTagsElement = document.createElement('p');
        noTagsElement.style.cssText = 'color: #666; font-style: italic; margin: 1rem 0;';
        noTagsElement.textContent = 'No other tags found';
        tagsList.appendChild(noTagsElement);
        return;
      }

      allTags.forEach(tag => {
        const tagElement = document.createElement('div');
        const backgroundColor = tag.color || '#e5e7eb';
        tagElement.style.cssText = `padding: 0.5rem; margin: 0.25rem 0; background: ${backgroundColor}; border-radius: 4px; display: flex; justify-content: space-between; align-items: center; cursor: pointer;`;
        tagElement.innerHTML = `
          <span>${tag.name}</span>
          <div class="tag-actions" style="display: flex; gap: 0.5rem; opacity: 0; transition: opacity 0.2s;">
            <button class="editTagBtn" data-tag-id="${tag.id}" data-tag-name="${tag.name}" data-tag-color="${tag.color || '#e5e7eb'}" style="background: none; border: none; color: #000; cursor: pointer; font-size: 0.8rem;">Edit</button>
            <button class="deleteTagBtn" data-tag-id="${tag.id}" data-tag-name="${tag.name}" style="background: none; border: none; color: #000; cursor: pointer; font-size: 0.8rem;">Delete</button>
          </div>
        `;
        
        // Add hover event listeners to show/hide action buttons
        tagElement.addEventListener('mouseenter', function() {
          const actionsDiv = this.querySelector('.tag-actions');
          actionsDiv.style.opacity = '1';
        });
        
        tagElement.addEventListener('mouseleave', function() {
          const actionsDiv = this.querySelector('.tag-actions');
          actionsDiv.style.opacity = '0';
        });
        
        // Add click handler for the entire tag element
        tagElement.addEventListener('click', (e) => {
          // Don't trigger if clicking the action buttons
          if (e.target.classList.contains('deleteTagBtn') || e.target.classList.contains('editTagBtn')) {
            return;
          }
          currentFilter = tag.id;
          loadContacts(tag.id);
          document.getElementById("tagsModal").style.display = "none";
        });
        
        tagsList.appendChild(tagElement);
      });
    }

    document.getElementById("tagBtn").onclick = () => {
      loadTags();
      document.getElementById("tagsModal").style.display = "flex";
    };

    document.getElementById("closeTagsBtn").onclick = () => {
      document.getElementById("tagsModal").style.display = "none";
    };

    document.getElementById("addTagBtn").onclick = () => {
      // Check if we're at the tag limit
      if (document.getElementById("addTagBtn").disabled) {
        alert(`Maximum of ${MAX_TAGS} tags allowed.`);
        return;
      }
      
      document.getElementById("addTagModal").style.display = "flex";
    };

    // Add tag form submission
    document.getElementById("addTagForm").onsubmit = async function(e) {
      e.preventDefault();
      const form = e.target;
      const tagName = form.tagName.value.trim();
      const tagColor = form.tagColor.value;
      
      if (tagName) {
        // Check for duplicate tag names (case insensitive)
        const duplicateTag = allTags.find(tag => 
          tag.name.toLowerCase() === tagName.toLowerCase()
        );
        
        if (duplicateTag) {
          alert(`Tag "${tagName}" already exists. Please choose a different name.`);
          return;
        }
        
        try {
          // Create tag via API
          const response = await fetch('/tags/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: tagName, color: tagColor })
          });
          
          if (!response.ok) {
            const errorText = await response.text();
            if (errorText.includes('Maximum of 10 tags allowed')) {
              alert('Cannot add tag: Maximum of 10 tags reached.');
            } else if (errorText.includes('already exists') || errorText.includes('duplicate')) {
              alert(`Tag "${tagName}" already exists. Please choose a different name.`);
            } else {
              alert('Error creating tag: ' + errorText);
            }
            return;
          }
          
          // Reload tags to get the updated list
          loadTags();
          form.reset();
          // Reset color selection to default
          document.querySelectorAll('.color-option').forEach(option => {
            option.style.border = '2px solid #e5e7eb';
          });
          document.querySelector('.color-option[data-color="#e5e7eb"]').style.border = '2px solid #6366f1';
          form.tagColor.value = '#e5e7eb';
          document.getElementById("addTagModal").style.display = "none";
        } catch (err) {
          console.error('Error creating tag:', err);
          alert('Error creating tag. Please try again.');
        }
      }
    };

    document.getElementById("cancelAddTagBtn").onclick = () => {
      document.getElementById("addTagForm").reset();
      // Reset color selection to default
      document.querySelectorAll('.color-option').forEach(option => {
        option.style.border = '2px solid #e5e7eb';
      });
      document.querySelector('.color-option[data-color="#e5e7eb"]').style.border = '2px solid #6366f1';
      document.querySelector('input[name="tagColor"]').value = '#e5e7eb';
      document.getElementById("addTagModal").style.display = "none";
    };

    // Set up color picker functionality
    document.querySelectorAll('.color-option').forEach(option => {
      option.onclick = () => {
        // Remove selection from all options
        document.querySelectorAll('.color-option').forEach(opt => {
          opt.style.border = '2px solid #e5e7eb';
        });
        // Add selection to clicked option
        option.style.border = '2px solid #6366f1';
        // Update hidden input
        document.querySelector('input[name="tagColor"]').value = option.dataset.color;
      };
    });

    // Set default color selection on page load
    setTimeout(() => {
      const defaultOption = document.querySelector('.color-option[data-color="#e5e7eb"]');
      if (defaultOption) {
        defaultOption.style.border = '2px solid #6366f1';
      }
    }, 100);

    // Edit tag form submission
    document.getElementById("editTagForm").onsubmit = async function(e) {
      e.preventDefault();
      const form = e.target;
      const tagName = form.tagName.value.trim();
      const tagColor = form.tagColor.value;

      if (!tagName) {
        alert('Tag name is required');
        return;
      }

      if (!tagToEdit) {
        alert('No tag selected for editing');
        return;
      }

      try {
        const response = await fetch(`/tags/edit`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            id: tagToEdit.id,
            name: tagName, 
            color: tagColor 
          })
        });

        if (response.ok) {
          // Reset form and close modal
          form.reset();
          document.querySelector('.edit-color-option[data-color="#e5e7eb"]').style.border = '2px solid #4ade80';
          document.querySelector('input[name="tagColor"]').value = '#e5e7eb';
          document.getElementById("editTagModal").style.display = "none";
          
          // Refresh tags list and contacts
          await loadTags();
          loadContacts(currentFilter);
          tagToEdit = null;
        } else {
          const errorText = await response.text();
          alert('Error updating tag: ' + errorText);
        }
      } catch (error) {
        console.error('Error updating tag:', error);
        alert('Error updating tag. Please try again.');
      }
    };

    // Cancel edit tag
    document.getElementById("cancelEditTagBtn").onclick = () => {
      document.getElementById("editTagForm").reset();
      document.querySelector('.edit-color-option[data-color="#e5e7eb"]').style.border = '2px solid #4ade80';
      document.querySelector('input[name="tagColor"]').value = '#e5e7eb';
      document.getElementById("editTagModal").style.display = "none";
      tagToEdit = null;
    };

    // Set up edit color picker functionality
    document.querySelectorAll('.edit-color-option').forEach(option => {
      option.onclick = () => {
        // Remove selection from all options
        document.querySelectorAll('.edit-color-option').forEach(opt => {
          opt.style.border = '2px solid #d1d5db';
        });
        // Add selection to clicked option
        option.style.border = '2px solid #4ade80';
        // Update hidden input
        document.querySelector('#editTagForm input[name="tagColor"]').value = option.dataset.color;
      };
    });

    // Handle both tag and contact deletion
    let tagToDelete = null;
    let tagToEdit = null;
    let contactToDelete = null;

    document.addEventListener('click', async function(e) {
      // Handle tag editing
      if (e.target.classList.contains('editTagBtn')) {
        e.stopPropagation(); // Prevent tag element click when clicking edit button
        tagToEdit = {
          id: parseInt(e.target.dataset.tagId),
          name: e.target.dataset.tagName,
          color: e.target.dataset.tagColor
        };
        
        // Populate the edit form
        const editForm = document.getElementById('editTagForm');
        editForm.tagName.value = tagToEdit.name;
        editForm.tagColor.value = tagToEdit.color;
        
        // Update color picker selection
        document.querySelectorAll('.edit-color-option').forEach(option => {
          if (option.dataset.color === tagToEdit.color) {
            option.style.border = '2px solid #4ade80';
          } else {
            option.style.border = '2px solid #d1d5db';
          }
        });
        
        document.getElementById('editTagModal').style.display = 'flex';
      }
      // Handle tag deletion
      else if (e.target.classList.contains('deleteTagBtn')) {
        e.stopPropagation(); // Prevent tag element click when clicking delete button
        tagToDelete = {
          id: e.target.dataset.tagId,
          name: e.target.dataset.tagName
        };
        document.getElementById('deleteTargetTagName').textContent = tagToDelete.name;
        document.getElementById('confirmDeleteTagModal').style.display = 'flex';
      }
      // Handle contact deletion
      else if (e.target.classList.contains('deleteBtn')) {
        e.stopPropagation(); // Prevent row click when clicking delete button
        contactToDelete = e.target.dataset.name;
        document.getElementById('deleteTargetName').textContent = contactToDelete;
        document.getElementById('confirmDeleteModal').style.display = 'flex';
      }
      // Handle row click for editing contacts
      else if (e.target.tagName === 'TD' && e.target.closest('tbody')) {
        const row = e.target.closest('tr');
        const name = row.dataset.name;
        const date = row.dataset.date;
        const tagId = row.dataset.tagId;
        
        if (name && date) {
          originalContactName = name;
          
          // Wait for tags to load before opening modal and setting values
          await loadTags();
          
          const editForm = document.getElementById('editForm');
          editForm.name.value = name;
          
          // Convert date from MM/DD/YYYY to YYYY-MM-DD for date input
          const [month, day, year] = date.split('/');
          const formattedDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
          editForm.date.value = formattedDate;
          
          // Set the tag dropdown value now that tags are loaded
          editForm.tag.value = tagId || '';
          
          document.getElementById('editModal').style.display = 'flex';
        }
      }
    });

    // Tag deletion handlers (keep existing)
    document.getElementById('cancelDeleteTagBtn').onclick = () => {
      tagToDelete = null;
      document.getElementById('confirmDeleteTagModal').style.display = 'none';
    };

    document.getElementById('confirmDeleteTagBtn').onclick = async () => {
      if (tagToDelete) {
        try {
          // Delete tag via API
          const response = await fetch(`/tags/delete?id=${tagToDelete.id}`, { 
            method: 'DELETE' 
          });
          
          if (response.ok) {
            // Reload tags and contacts to reflect changes
            await loadTags();
            loadContacts(currentFilter);
          } else {
            console.error('Failed to delete tag');
            alert('Error deleting tag. Please try again.');
          }
        } catch (err) {
          console.error('Error deleting tag:', err);
          alert('Error deleting tag. Please try again.');
        }
        
        tagToDelete = null;
        document.getElementById('confirmDeleteTagModal').style.display = 'none';
      }
    };

    // Contact deletion handlers (add these)
    document.getElementById('cancelDeleteBtn').onclick = () => {
      contactToDelete = null;
      document.getElementById('confirmDeleteModal').style.display = 'none';
    };

    document.getElementById('confirmDeleteBtn').onclick = async () => {
      if (contactToDelete) {
        try {
          const response = await fetch(`/delete?name=${encodeURIComponent(contactToDelete)}`, { 
            method: 'DELETE' 
          });
          
          if (response.ok) {
            loadContacts(currentFilter);
          } else {
            console.error('Failed to delete contact');
            alert('Error deleting contact. Please try again.');
          }
        } catch (err) {
          console.error('Error deleting contact:', err);
          alert('Error deleting contact. Please try again.');
        }
        
        contactToDelete = null;
        document.getElementById('confirmDeleteModal').style.display = 'none';
      }
    };
