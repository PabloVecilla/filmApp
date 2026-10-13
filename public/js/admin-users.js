// ADMIN USERS EJS FUNCTIONS:

// edit user
document.addEventListener("click", (e) => {
  // EDIT
  if (e.target.classList.contains("edit-btn")) {
    const btn = e.target;
    editUser(
      btn.dataset.id,
      btn.dataset.name,
      btn.dataset.email,
      btn.dataset.role
    );
  }

  // DELETE
  if (e.target.classList.contains("delete-btn")) {
    deleteUser(e.target.dataset.id);
  }
});

const loadUsers = async () => {
  const res = await fetch("/api/users");
  const users = await res.json();

  const list = document.getElementById("users-list");

  if (!users.length) {
    const message = document.createElement("p");
    message.textContent = "No hay usuarios";
    list.replaceChildren(message);
    return;
  }

  const cards = users.map((user) => {
    const card = document.createElement("div");
    card.className = "user-card";

    const description = document.createElement("p");
    const name = document.createElement("strong");
    name.textContent = user.name ?? "";
    description.append(
      name,
      ` - ${user.email ?? ""} - ${user.role ?? ""}`,
    );

    const editButton = document.createElement("button");
    editButton.className = "btn edit-btn";
    editButton.dataset.id = user.id ?? "";
    editButton.dataset.name = user.name ?? "";
    editButton.dataset.email = user.email ?? "";
    editButton.dataset.role = user.role ?? "";
    editButton.textContent = "Editar";

    const deleteButton = document.createElement("button");
    deleteButton.className = "btn delete-btn";
    deleteButton.dataset.id = user.id ?? "";
    deleteButton.textContent = "Eliminar";

    card.append(description, editButton, deleteButton);
    return card;
  });

  list.replaceChildren(...cards);
};

const editUser = async (id, name, email, role) => {
  const nuevoNombre = prompt("Nombre:", name);
  const nuevoEmail = prompt("Email:", email);
  const nuevoRole = prompt("Role (user/admin):", role);

  const res = await fetch(`/api/user/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: nuevoNombre,
      email: nuevoEmail,
      role: nuevoRole,
    }),
  });

  const data = await res.json();
  alert(data.message || data.error);
  loadUsers();
};

const deleteUser = async (id) => {
  if (!confirm("¿Estás segura de que quieres eliminar este usuario?")) return;

  const res = await fetch(`/api/user/${id}`, {
    method: "DELETE",
  });

  const data = await res.json();
  alert(data.message || data.error);
  loadUsers();
};

loadUsers();
