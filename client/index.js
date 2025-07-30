    async function loadContacts() {
      const res = await fetch('http://localhost:8080/list');
      const contacts = await res.json();
      const tbody = document.querySelector("#contacts tbody");
      tbody.innerHTML = '';
      contacts.forEach(c => {
        const row = document.createElement("tr");
        const [year, month, dayWithTime] = c.date.split('-');
        const day = dayWithTime.split('T')[0];
        const formatted = `${month}/${day}/${year}`;
        row.innerHTML = `
          <td>${c.name}</td>
          <td>${formatted}</td>
          <td style="text-align: right;">
            <button class="deleteBtn" data-name="${c.name}" style="border: none; background: none; font-size: 1rem; cursor: pointer;">╳</button>
          </td>
        `;
        tbody.appendChild(row);
      });
    }

    loadContacts();

    document.getElementById("addBtn").onclick = () => {
      document.getElementById("modal").style.display = "flex";
    };

    document.getElementById("addForm").onsubmit = async function(e) {
      e.preventDefault();
      const form = e.target;
      const [mm, dd, yyyy] = form.date.value.split('/');
      const data = {
        name: form.name.value,
        date: `${yyyy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`
      };
      await fetch('http://localhost:8080/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      form.reset();
      document.getElementById("modal").style.display = "none";
      loadContacts();
    };
    document.getElementById("cancelBtn").onclick = () => {
      document.getElementById("modal").style.display = "none";
    };

// --- Global click event listener for delete buttons and confirm modal logic ---
let contactToDelete = null;

document.addEventListener('click', function(e) {
  if (e.target.classList.contains('deleteBtn')) {
    contactToDelete = e.target.dataset.name;
    document.getElementById('deleteTargetName').textContent = contactToDelete;
    document.getElementById('confirmDeleteModal').style.display = 'flex';
  }
});

document.getElementById('cancelDeleteBtn').onclick = () => {
  contactToDelete = null;
  document.getElementById('confirmDeleteModal').style.display = 'none';
};

document.getElementById('confirmDeleteBtn').onclick = async () => {
  if (contactToDelete) {
    await fetch(`http://localhost:8080/delete?name=${encodeURIComponent(contactToDelete)}`, { method: 'DELETE' });
    contactToDelete = null;
    document.getElementById('confirmDeleteModal').style.display = 'none';
    loadContacts();
  }
};