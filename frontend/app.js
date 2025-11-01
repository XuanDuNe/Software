const API_BASE = "http://127.0.0.1:8002";

// Xử lý tạo user
document.getElementById("createUserForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = document.getElementById("email").value;
  const full_name = document.getElementById("fullName").value;

  const res = await fetch(`${API_BASE}/users/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, full_name }),
  });

  if (res.ok) {
    alert("✅ Tạo user thành công!");
    loadUsers();
    e.target.reset();
  } else {
    try {
      const err = await res.json();
      alert("❌ Lỗi: " + err.detail);
    } catch {
      alert("❌ Lỗi không xác định!");
    }
  }
});

// Nút refresh
document.getElementById("refreshBtn").addEventListener("click", loadUsers);

// Hàm load toàn bộ user
async function loadUsers() {
  const res = await fetch(`${API_BASE}/users/`);
  if (!res.ok) {
    alert("Không tải được danh sách user!");
    return;
  }
  const data = await res.json();
  const tbody = document.querySelector("#userTable tbody");
  tbody.innerHTML = "";
  data.forEach((u) => {
    const createdAt = u.created_at ? new Date(u.created_at).toLocaleString() : "";
    const row = `<tr>
      <td>${u.id}</td>
      <td>${u.email}</td>
      <td>${u.full_name ?? ""}</td>
      <td>${createdAt}</td>
    </tr>`;
    tbody.insertAdjacentHTML("beforeend", row);
  });
}

// Tải danh sách khi mở trang
loadUsers();
