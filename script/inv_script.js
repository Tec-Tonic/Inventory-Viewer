let inventoryData = [];
let data = ``;
let redBackgroundItems = [
  "coal_ore",
  "deepslate_coal_ore",
  "coal",
  "iron_ore",
  "deepslate_iron_ore",
  "iron_ingot",
  "copper_ore",
  "deepslate_copper_ore",
  "raw_copper",
  "copper_ingot",
  "gold_ore",
  "deepslate_gold_ore",
  "gold_ingot",
  "raw_gold",
  "gold_nugget",
  "redstone_ore",
  "deepslate_redstone_ore",
  "redstone",
  "emerald_ore",
  "deepslate_emerald_ore",
  "emerald",
  "lapis_ore",
  "deepslate_lapis_ore",
  "lapis_lazuli",
  "diamond_ore",
  "deepslate_diamond_ore",
  "diamond",
  "nether_gold_ore",
  "nether_quartz_ore",
  "quartz",
  "ancient_debri",
  "netherite_scrap",
  "coal_block",
  "iron_block",
  "gold_block",
  "diamond_block",
  "netherite_block"
];

window.onload = function () {
  document.getElementById("fileInputInventory").addEventListener("change", function (event) {
    const file = event.target.files[0];
    const reader = new FileReader();
    reader.onload = function (event) {
      data = event.target.result;
      processData();
    };
    reader.readAsText(file);
  });
};

function processData() {
  data = data.replace(/\?/g, "");
  const namelines = data.split("\n");
  let name = "";
  for (let i = namelines.length - 1; i >= 0; i--) {
    if (namelines[i].includes("======== Inventory Contents ========\\nPlayer:")) {
      name = namelines[i]
        .substring(namelines[i].indexOf("Player:") + "Player:".length)
        .trim();
      break;
    }
  }
  const element = `<h1 class="text-center">${name}'s Inventory</h1>`;
  document.getElementById("nameContainer").innerHTML = element;
  let lines = data.split("\n");
  let startIndex;
  for (let i = lines.length - 1; i >= 0; i--) {
    if (lines[i].includes("======== Inventory Contents ========")) {
      startIndex = i;
      break;
    }
  }
  lines = lines.slice(startIndex);
  let inventory = [];
  for (let i = 0; i < lines.length; i++) {
    if (
      lines[i].includes("hotbar.") ||
      lines[i].includes("inventory.") ||
      lines[i].includes("armor.feet") ||
      lines[i].includes("armor.legs") ||
      lines[i].includes("armor.chest") ||
      lines[i].includes("armor.head") ||
      lines[i].includes("weapon.offhand")
    ) {
      let parts = lines[i].split(": ");
      let item = parts[2].split(" ");
      let quantity = item.shift();
      item = item.join(" ");
      let itemParts = item.split(" ");
      let nbtIndex = itemParts.indexOf("[Extra]");
      let itemNameAfterNbt;
      if (nbtIndex !== -1) {
        itemNameAfterNbt = itemParts.slice(nbtIndex + 1).join(" ");
        itemParts.splice(nbtIndex);
      } else {
        itemNameAfterNbt = itemParts.slice(1).join(" ");
      }
      let minecraftItemName = itemParts[0].trim();
      if (itemNameAfterNbt) {
        minecraftItemName = minecraftItemName.replace(itemNameAfterNbt, "").trim();
      }
      if (minecraftItemName.endsWith("s")) {
        minecraftItemName = minecraftItemName.slice(0, -1);
      }
      inventory.push({
        name: minecraftItemName,
        quantity: +quantity,
        location: `${parts[1].replace("[System] [CHAT]", "").trim()}`,
        itemNameAfterNbt: itemNameAfterNbt,
      });
    }
  }
  inventoryData = inventory;
  updateInventoryDisplay();
  initializeTooltips();
}

function initializeTooltips() {
  var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
  tooltipTriggerList.forEach(function (tooltipTriggerEl) {
    new bootstrap.Tooltip(tooltipTriggerEl);
  });
}

function fetchItemImage(itemName) {
  return fetch(`https://minecraft-api.com/api/v1/item/${itemName}`)
    .then(response => response.json())
    .then(data => data.image)
    .catch(error => {
      console.error(`Failed to fetch image for item '${itemName}':`, error);
      return null;
    });
}

function updateInventoryDisplay() {
  const inventorySlots = document.getElementById("inventory").children;
  const hotbarSlots = document.getElementById("hotbar").children;
  const armorSlots = document.getElementById("armor-offhand-container").children;
  const fetchImagePromises = [];

  for (let i = 0; i < inventoryData.length; i++) {
    const item = inventoryData[i];
    const location = item.location.split(".");
    const slotNumber = +location[1];

    let slot;
    if (location[0] === "hotbar") {
      slot = hotbarSlots[slotNumber];
    } else if (location[0] === "armor" || location[0] === "weapon") {
      slot = armorSlots[slotNumber];
    } else if (location[0] === "inventory") {
      slot = inventorySlots[slotNumber];
    }

    if (redBackgroundItems.includes(item.name.toLowerCase())) {
      slot.style.backgroundColor = "rgba(255, 0, 0, 0.3)";
    }

    const imagePromise = fetchItemImage(item.name)
      .then(imageUrl => {
        if (imageUrl) {
          let innerHTML = `<img src="${imageUrl}" alt="${item.name}" data-bs-toggle="tooltip" data-bs-original-title="${item.name}"><p>${item.quantity}</p>`;
          if (item.itemNameAfterNbt) {
            innerHTML += `<p>${item.itemNameAfterNbt}</p>`;
          }
          slot.innerHTML = innerHTML;
        }
      });

    fetchImagePromises.push(imagePromise);
  }

  Promise.all(fetchImagePromises)
    .then(() => {
      document.getElementById("inventory-container").style.display = "block";
    });
}