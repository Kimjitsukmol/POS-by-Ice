// ไฟล์ script.js

let productList = [];
let totalPrice = 0;
let totalQty = 0;

window.addEventListener('load', () => {
  document.querySelector('.summary-box')?.classList.add('summary-fixed');
  document.querySelector('#changeBox')?.classList.add('change-fixed');
});

document.getElementById('excelFile').addEventListener('change', function (e) {
  const reader = new FileReader();
  reader.readAsArrayBuffer(e.target.files[0]);
  reader.onload = function () {
    const data = new Uint8Array(reader.result);
    const workbook = XLSX.read(data, { type: 'array' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    productList = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    alert("โหลดข้อมูลสินค้าสำเร็จแล้ว!");
  };
});

document.getElementById("productCode").addEventListener("keypress", function (e) {
  if (e.key === "Enter") {
    findProduct();
  }
});

document.getElementById("received").addEventListener("keypress", function (e) {
  if (e.key === "Enter") {
    const html = generateReceiptHTML();      // สร้างใบเสร็จ
    showReceiptPopup(html);                 // แสดงใบเสร็จ popup
    saveReceiptToHistory(html);             // ⬅️ บันทึกใบเสร็จไว้
    saveToLocalSummary();                   // บันทึกยอดขาย
    clearAll();                             // เคลียร์รายการสินค้า
  }
});


document.getElementById("showTodayBtn").addEventListener("click", () => {
  const box = document.getElementById("todaySummaryBox");
  box.style.display = "block";
  setTimeout(() => box.style.display = "none", 10000);
});

window.addEventListener("keydown", function (e) {
  if (e.code === "NumpadDecimal") {
    document.getElementById("productCode").focus();
    e.preventDefault();
  } else if (e.code === "NumpadAdd") {
    document.getElementById("received").focus();
    e.preventDefault();
  }
});

flatpickr("#calendar", {
  dateFormat: "d/M/yyyy",
  locale: "th",
  onChange: function (selectedDates) {
    const summary = JSON.parse(localStorage.getItem("posSummary")) || {};
    const selected = new Date(selectedDates[0]);
    const key = selected.toLocaleDateString("th-TH");
    const value = summary[key] || 0;
    document.getElementById("selectedTotal").textContent = `ยอดรวม: ฿${value.toFixed(2)}`;
  }
});

function findProduct() {
  const code = document.getElementById("productCode").value;
  document.getElementById("productCode").value = "";

  for (let i = 1; i < productList.length; i++) {
    if (productList[i][1] == code) {
      const row = document.createElement("tr");

      row.innerHTML = `
        <td>${productList[i][1]}</td>
        <td>${productList[i][2]}</td>
        <td><input type='number' value='1' min='1' oninput='updateTotals()' style='width: 60px;'></td>
        <td class='item-row-price'>${productList[i][3]}</td>
        <td><button class='delete-btn'>ลบ</button></td>
      `;

      // ใส่ event ลบ พร้อม update สีแถวใหม่
      row.querySelector(".delete-btn").addEventListener("click", function () {
        row.remove();
        updateTotals();
        updateRowColors(); // สำคัญ!!
      });

      document.getElementById("productBody").appendChild(row);
      updateTotals();
      updateRowColors(); // สำคัญ!!
      break;
    }
  }
}




function updateRowColors_DEPRECATED() {
  const rows = document.querySelectorAll("#productBody tr");
  rows.forEach((row, index) => {
    row.style.backgroundColor = index % 2 === 0 ? "#f2f2f2" : "#ffffff";
  });
}





function updateTotals() {
  const rows = document.querySelectorAll("#productBody tr");
  totalPrice = 0;
  totalQty = 0;

  rows.forEach(row => {
    const qtyInput = row.querySelector("input[type='number']");
    const qty = parseInt(qtyInput.value);
    const unitPrice = parseFloat(row.querySelector(".item-row-price").getAttribute("data-unit-price") || row.querySelector(".item-row-price").textContent);
    const itemTotal = qty * unitPrice;
    row.querySelector(".item-row-price").textContent = itemTotal.toFixed(2);
    totalQty += qty;
    totalPrice += itemTotal;
    if (!row.querySelector(".item-row-price").getAttribute("data-unit-price")) {
      row.querySelector(".item-row-price").setAttribute("data-unit-price", unitPrice);
    }
  });

  document.getElementById("totalQty").textContent = `จำนวน: ${totalQty}`;
  document.getElementById("totalPrice").textContent = `฿${totalPrice.toFixed(2)}`;
  const summaryBox = document.querySelector(".summary-box");
  summaryBox.classList.add("animate-grow");
  setTimeout(() => summaryBox.classList.remove("animate-grow"), 300);
  calculateChange();
}

function calculateChange() {
  const receivedInput = document.getElementById("received");
  const changeBox = document.getElementById("changeAmount");
  const received = parseFloat(receivedInput.value);
  const summaryBox = document.querySelector(".summary-box");

  if (!receivedInput.value || isNaN(received)) {
    changeBox.textContent = "";
    summaryBox.classList.remove("animate-shrink");
    return;
  }

  const change = received - totalPrice;
  changeBox.textContent = `฿${change.toFixed(2)}`;
  summaryBox.classList.add("animate-shrink");
}

function clearAll() {
  document.getElementById("productBody").innerHTML = "";
  document.getElementById("received").value = "";
  totalPrice = 0;
  totalQty = 0;
  updateTotals();
  const summaryBox = document.querySelector(".summary-box");
  summaryBox.classList.remove("animate-shrink");
  summaryBox.style.opacity = "1";
}

function saveToLocalSummary() {
  const now = new Date();
  const dateKey = now.toLocaleDateString("th-TH");
  let summary = JSON.parse(localStorage.getItem("posSummary")) || {};

  if (summary[dateKey]) {
    summary[dateKey] += totalPrice;
  } else {
    summary[dateKey] = totalPrice;
  }

  localStorage.setItem("posSummary", JSON.stringify(summary));
  updateTodaySummaryBox();
}

function updateTodaySummaryBox() {
  const dateKey = new Date().toLocaleDateString("th-TH");
  const summary = JSON.parse(localStorage.getItem("posSummary")) || {};
  const todayTotal = summary[dateKey] || 0;
  document.getElementById("todayTotal").textContent = `฿${todayTotal.toFixed(2)}`;
}

// เรียกทันทีเมื่อโหลดหน้า
updateTodaySummaryBox();

function updateRowColors_OLD() {
  const rows = document.querySelectorAll("#productBody tr");
  rows.forEach((row, index) => {
    row.style.backgroundColor = index % 2 === 0 ? "#f2f2f2" : "#ffffff";
  });
}


function updateRowColors_OLD() {
  const rows = document.querySelectorAll("#productBody tr");
  rows.forEach((row, index) => {
    row.removeAttribute("class");
    row.style.backgroundColor = (index % 2 === 0) ? "#f2f2f2" : "#ffffff";
  });
}


function updateRowColors() {
  const rows = document.querySelectorAll("#productBody tr");
  rows.forEach((row, index) => {
    const bg = (index % 2 === 0) ? "#f2f2f2" : "#ffffff";
    row.querySelectorAll("td").forEach(cell => {
      cell.style.backgroundColor = bg;
    });
  });
}


function showReceiptPopup() {
  const popup = document.createElement("div");
  popup.style.position = "fixed";
  popup.style.top = "50%";
  popup.style.left = "55%";
  popup.style.transform = "translate(-50%, -50%)"; // <<< ให้กลางจริง
  popup.style.padding = "15px";
  popup.style.backgroundColor = "white";
  popup.style.color = "black";
  popup.style.border = "1px solid #ccc";
  popup.style.zIndex = "9999";
  popup.style.width = "300px";
  popup.style.fontFamily = "monospace";
  popup.style.boxShadow = "0 0 10px rgba(0,0,0,0.3)";
  popup.innerHTML = generateReceiptHTML();
  document.body.appendChild(popup);
  setTimeout(() => popup.remove(), 5000);
}


function generateReceiptHTML() {
  const rows = document.querySelectorAll("#productBody tr");
  let listHTML = "<table style='width:100%; border-collapse: collapse; font-size: 12px;'>"
               + "<tr><th style='text-align:left;'>สินค้า</th><th style='text-align:center;'>จำนวน</th><th style='text-align:right;'>ราคา</th></tr>";

  rows.forEach(row => {
    const cols = row.querySelectorAll("td");
    const name = cols[1].textContent;
    const qty = cols[2].querySelector("input").value;
    const price = cols[3].textContent;
    listHTML += "<tr>"
              + `<td>${name}</td>`
              + `<td style='text-align:center;'>${qty}</td>`
              + `<td style='text-align:right;'>฿${price}</td>`
              + "</tr>";
  });

  listHTML += "</table>";

  const date = new Date();
  const time = date.toLocaleTimeString("th-TH");
  const dateStr = date.toLocaleDateString("th-TH");

  const received = parseFloat(document.getElementById("received").value || 0);
  const change = received - totalPrice;

  return `
    <div style="text-align:left;">
      <strong style="font-size:16px;">ร้านเจ้พิน</strong><br>
      <small>${dateStr} ${time}</small><br><hr>
      ${listHTML}<hr>
      <div style="text-align:right;">
        รวม: ฿${totalPrice.toFixed(2)}<br>
        รับเงิน: ฿${received.toFixed(2)}<br>
        เงินทอน: ฿${change.toFixed(2)}<br><br>
      </div>
      <div style="text-align:center;">ขอบคุณที่อุดหนุน ❤️</div>
    </div>
  `;
}

function saveReceiptToHistory(receiptHTML) {
  let history = JSON.parse(localStorage.getItem("receiptHistory")) || [];
  history.push(receiptHTML);

  if (history.length > 200) {
    history.shift(); // ลบใบแรกออก
  }

  localStorage.setItem("receiptHistory", JSON.stringify(history));
}


function showReceiptHistory() {
  const history = JSON.parse(localStorage.getItem("receiptHistory")) || [];
  const container = document.createElement("div");
  container.style.position = "fixed";
  container.style.top = "0";
  container.style.left = "0";
  container.style.width = "100vw";
  container.style.height = "100vh";
  container.style.overflow = "auto";
  container.style.background = "rgba(0,0,0,0.7)";
  container.style.zIndex = "9999";
  container.style.padding = "30px";
  container.style.color = "#000";

  let html = "<div style='background:white; padding:20px; max-width:800px; margin:auto;'>";
  html += `<h3>ใบเสร็จย้อนหลัง (${history.length} ใบ)</h3><hr>`;
  for (let i = history.length - 1; i >= 0; i--) {
    html += `<div style='margin-bottom:20px; border-bottom:1px dashed #ccc;'>${history[i]}</div>`;
  }
html += "<button onclick='this.closest(`div`).parentElement.remove()' style='position:absolute; top:25px; right:370px;'>ปิด</button>";
html += `<h3 style='text-align:center;'>ใบเสร็จย้อนหลัง (${history.length} ใบ)</h3><hr>`;

  container.innerHTML = html;
  document.body.appendChild(container);
}
