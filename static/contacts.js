// Contact management functions
window.ContactManager = {
  async loadContacts(filterTagId = null) {
    const res = await fetch('/list');
    const contacts = await res.json();
    const tbody = document.querySelector("#contacts tbody");
    tbody.innerHTML = '';
    
    // Check contact limit and update Add button state
    const addBtn = document.getElementById("addBtn");
    if (contacts.length >= window.AppConfig.MAX_CONTACTS) {
      addBtn.disabled = true;
      addBtn.textContent = `Add (${contacts.length}/${window.AppConfig.MAX_CONTACTS})`;
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
      return window.AppState.sortAscending ? dateA - dateB : dateB - dateA;
    });
    
    filteredContacts.forEach(c => {
      const row = document.createElement("tr");
      const [year, month, dayWithTime] = c.date.split('-');
      const day = dayWithTime.split('T')[0];
      const formatted = `${month}/${day}/${year}`;
      row.style.cursor = "pointer";
      row.dataset.name = c.name;
      row.dataset.date = formatted;
      row.dataset.tagId = c.tag_id || '';
      
      // Find tag info for color
      let tagDisplay = c.tag || '';
      let tagColor = '#e5e7eb';
      if (c.tag_id && window.AppState.allTags) {
        const tagInfo = window.AppState.allTags.find(tag => tag.id == c.tag_id);
        if (tagInfo && tagInfo.color) {
          tagColor = tagInfo.color;
        }
      }
      
      // Create tag display with color if tag exists
      const tagCell = c.tag ? 
        `<span class="tag-badge" style="background: ${tagColor};">${c.tag}</span>` : 
        '';
      
      row.innerHTML = `
        <td data-label="Name" style="text-align: center;">${c.name}</td>
        <td data-label="Date" style="text-align: center;">${formatted}</td>
        <td data-label="Tag" style="text-align: center;">${tagCell}</td>
      `;
      
      tbody.appendChild(row);
    });
    
    // Update sort indicator
    document.getElementById('sortIndicator').textContent = window.AppState.sortAscending ? '↑' : '↓';
    
    // Update grid view button state
    this.updateGridViewButton(filterTagId);
  },

  updateGridViewButton(filterTagId) {
    const gridViewBtn = document.getElementById('gridViewBtn');
    if (gridViewBtn) {
      if (filterTagId === null || filterTagId === undefined) {
        // No filter applied - enable grid view
        gridViewBtn.disabled = false;
        gridViewBtn.style.opacity = '1';
        gridViewBtn.style.cursor = 'pointer';
      } else {
        // Filter is applied - disable grid view
        gridViewBtn.disabled = true;
        gridViewBtn.style.opacity = '0.5';
        gridViewBtn.style.cursor = 'not-allowed';
      }
    }
  },

  async showGridView() {
    // Fetch all contacts
    const res = await fetch('/list');
    const contacts = await res.json();
    
    // Group contacts by tag
    const contactsByTag = {};
    const untaggedContacts = [];
    
    contacts.forEach(contact => {
      if (contact.tag && contact.tag_id) {
        if (!contactsByTag[contact.tag]) {
          contactsByTag[contact.tag] = {
            tag_id: contact.tag_id,
            contacts: []
          };
        }
        contactsByTag[contact.tag].contacts.push(contact);
      } else {
        untaggedContacts.push(contact);
      }
    });
    
    // Add untagged contacts if any exist
    if (untaggedContacts.length > 0) {
      contactsByTag['No Tag'] = {
        tag_id: null,
        contacts: untaggedContacts
      };
    }
    
    // Generate grid HTML
    const gridContainer = document.getElementById('gridContainer');
    gridContainer.innerHTML = '';
    
    Object.keys(contactsByTag).forEach(tagName => {
      const tagData = contactsByTag[tagName];
      const tagInfo = window.AppState.allTags.find(tag => tag.id == tagData.tag_id);
      const tagColor = tagInfo ? tagInfo.color : '#e5e7eb';
      
      // Sort contacts within each tag by date
      tagData.contacts.sort((a, b) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        return window.AppState.sortAscending ? dateA - dateB : dateB - dateA;
      });
      
      const tableHtml = `
        <div class="grid-table">
          <div class="grid-table-header">
            <span class="tag-badge" style="background: ${tagColor};">${tagName}</span>
            <span style="color: #666; font-size: 0.9rem;">(${tagData.contacts.length})</span>
          </div>
          <div class="grid-table-body">
            ${tagData.contacts.map(contact => {
              const [year, month, dayWithTime] = contact.date.split('-');
              const day = dayWithTime.split('T')[0];
              const formatted = `${month}/${day}/${year}`;
              
              return `
                <div class="grid-contact-row" data-name="${contact.name}" data-date="${formatted}" data-tag-id="${contact.tag_id || ''}">
                  <span class="grid-contact-name">${contact.name}</span>
                  <span class="grid-contact-date">${formatted}</span>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      `;
      
      gridContainer.insertAdjacentHTML('beforeend', tableHtml);
    });
    
    // Hide main table and show grid view
    document.getElementById('contacts').style.display = 'none';
    document.getElementById('gridView').style.display = 'block';
    
    // Hide action buttons except the back button
    document.querySelector('.action-buttons').style.display = 'none';
    
    // Update grid sort indicator
    document.getElementById('gridSortIndicator').textContent = window.AppState.sortAscending ? '↑' : '↓';
  },

  showListView() {
    // Show main table and hide grid view
    document.getElementById('contacts').style.display = 'table';
    document.getElementById('gridView').style.display = 'none';
    
    // Show action buttons
    document.querySelector('.action-buttons').style.display = 'flex';
    
    // Reset to unfiltered view
    window.AppState.setCurrentFilter(null);
    this.loadContacts();
  },

  formatDateForInput(dateString) {
    // Convert MM/DD/YYYY to YYYY-MM-DD for date input
    const [month, day, year] = dateString.split('/');
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  },

  formatDateForServer(dateValue) {
    if (!dateValue.trim()) {
      dateValue = "06/28/1947";
    }
    
    // Handle date format - check if it's already YYYY-MM-DD (from date picker) or MM/DD/YYYY (from default)
    if (dateValue.includes('/')) {
      const [mm, dd, yyyy] = dateValue.split('/');
      return `${yyyy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`;
    } else {
      return dateValue; // Already in YYYY-MM-DD format
    }
  }
};
