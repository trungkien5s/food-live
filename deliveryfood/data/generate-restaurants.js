// generate-restaurants.js
const fs = require("fs");
const path = require("path");

const INPUT = path.join(__dirname, "grab_like.json");   // đổi tên file cho đúng
const OUTPUT = path.join(__dirname, "grab_like_1000.json");

const raw = fs.readFileSync(INPUT, "utf8");
const baseData = JSON.parse(raw); // mảng restaurant hiện có

const target = 1000;
const result = [];

const namePrefixes = ["Quán", "Nhà hàng", "Tiệm", "Quán ăn", "Food Corner"];
const districts = ["Q1", "Q3", "Q5", "Q7", "Q10", "Bình Thạnh", "Gò Vấp", "Tân Bình", "Phú Nhuận", "Thủ Đức"];

function randomFrom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomRating() {
  return Math.round((4 + Math.random() * 0.9) * 10) / 10; // 4.0 - 4.9
}

function randomPrice(basePrice) {
  const delta = (Math.floor(Math.random() * 5) - 2) * 5000; // -10k..+10k
  const price = basePrice + delta;
  return price < 15000 ? 15000 : price;
}

let idCounter = 1;
while (result.length < target) {
  const template = baseData[result.length % baseData.length]; // xoay vòng
  const cloned = JSON.parse(JSON.stringify(template));        // deep clone

  // restaurant
  const prefix = randomFrom(namePrefixes);
  const district = randomFrom(districts);
  cloned.restaurant.name = `${prefix} ${cloned.restaurant.name} #${idCounter}`;
  cloned.restaurant.address = `${idCounter * 3} ${cloned.restaurant.address.split(",")[0]}, ${district}, TP.HCM`;
  cloned.restaurant.rating = randomRating();
  cloned.restaurant.isOpen = Math.random() < 0.7; // 70% open

  // menus + items
  cloned.menus.forEach((menu, mi) => {
    menu.title = `${menu.title} ${idCounter}`;
    menu.items.forEach((item, ii) => {
      item.title = `${item.title} ${idCounter}-${mi}${ii}`;
      item.price = randomPrice(item.price || 30000);
      // giữ nguyên category, description, image cho đơn giản
    });
  });

  result.push(cloned);
  idCounter++;
}

fs.writeFileSync(OUTPUT, JSON.stringify(result, null, 2), "utf8");
console.log("Generated:", result.length, "restaurants ->", OUTPUT);
