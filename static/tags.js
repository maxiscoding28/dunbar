// Tag management functions
window.TagManager = {
  loadTags() {
    return fetch('/tags/list')
      .then(res => res.json())
      .then(tags => {
        window.AppState.setAllTags(tags || []);
        this.displayTags();
        this.populateTagDropdowns();
      })
      .catch(err => console.error('Error loading tags:', err));
  },

  populateTagDropdowns() {
    const addTagSelect = document.querySelector('#addForm select[name="tag"]');
    const editTagSelect = document.querySelector('#editForm select[name="tag"]');
    
    if (!addTagSelect || !editTagSelect) {
      console.warn('Tag dropdown elements not found, will retry when modals are loaded');
      return;
    }
    
    [addTagSelect, editTagSelect].forEach(select => {
      select.innerHTML = '';
      
      const noTagOption = document.createElement('option');
      noTagOption.value = '';
      noTagOption.textContent = 'No tag';
      select.appendChild(noTagOption);
      
      window.AppState.allTags.forEach(tag => {
        const option = document.createElement('option');
        option.value = tag.id;
        option.textContent = tag.name;
        select.appendChild(option);
      });
    });
  },

  displayTags() {
    const tagsList = document.getElementById('tagsList');
    if (!tagsList) {
      console.warn('tagsList element not found, skipping displayTags');
      return;
    }
    
    tagsList.innerHTML = '';
    
    // Check tag limit and update Add Tag button state
    const addTagBtn = document.getElementById("addTagBtn");
    if (!addTagBtn) {
      console.warn('addTagBtn element not found');
      return;
    }
    if (window.AppState.allTags.length >= window.AppConfig.MAX_TAGS) {
      addTagBtn.disabled = true;
      addTagBtn.textContent = `Add Tag (${window.AppState.allTags.length}/${window.AppConfig.MAX_TAGS})`;
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
      window.AppState.setCurrentFilter(null);
      window.ContactManager.loadContacts();
      document.getElementById("tagsModal").style.display = "none";
    });
    tagsList.appendChild(allTagElement);
    
    if (!window.AppState.allTags || window.AppState.allTags.length === 0) {
      const noTagsElement = document.createElement('p');
      noTagsElement.style.cssText = 'color: #666; font-style: italic; margin: 1rem 0;';
      noTagsElement.textContent = 'No other tags found';
      tagsList.appendChild(noTagsElement);
      return;
    }

    window.AppState.allTags.forEach(tag => {
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
      
      // Add hover event listeners
      tagElement.addEventListener('mouseenter', function() {
        const actionsDiv = this.querySelector('.tag-actions');
        actionsDiv.style.opacity = '1';
      });
      
      tagElement.addEventListener('mouseleave', function() {
        const actionsDiv = this.querySelector('.tag-actions');
        actionsDiv.style.opacity = '0';
      });
      
      // Add click handler for filtering
      tagElement.addEventListener('click', (e) => {
        if (e.target.classList.contains('deleteTagBtn') || e.target.classList.contains('editTagBtn')) {
          return;
        }
        window.AppState.setCurrentFilter(tag.id);
        window.ContactManager.loadContacts(tag.id);
        document.getElementById("tagsModal").style.display = "none";
      });
      
      tagsList.appendChild(tagElement);
    });
  }
};
