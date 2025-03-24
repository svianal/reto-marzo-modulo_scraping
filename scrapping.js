const puppeteer = require("puppeteer");
const fs = require("fs");
const axios = require("axios");
const csvWriter = require("csv-writer").createObjectCsvWriter;
require("dotenv").config();

const START_URL = "https://tottus.falabella.com.pe/tottus-pe/category/cat13380487/Despensa";

// cargar todo
async function autoScroll(page) {
  await page.evaluate(async () => {
    await new Promise((resolve) => {
      let totalHeight = 0;
      const distance = 200;
      const timer = setInterval(() => {
        window.scrollBy(0, distance);
        totalHeight += distance;
        if (totalHeight >= document.body.scrollHeight) {
          clearInterval(timer);
          resolve();
        }
      }, 100);
    });
  });
}

// Obtener productos desde la página actual
async function getProducts(page) {
  try {
    await page.waitForSelector(".pod.pod-2_GRID.pod-link", { timeout: 5000 });
  } catch {
    console.log("No se encontraron productos visibles.");
    return [];
  }

  return page.evaluate(() => {
    const items = document.querySelectorAll(".pod.pod-2_GRID.pod-link");
    return [...items].map((el) => ({
      categoria: "Despensa",
      subcategoria: el.closest(".section")?.querySelector(".section-title")?.innerText.trim() || "Sin subcategoría",
      nombre: el.querySelector(".pod-subTitle")?.innerText.trim() || "Sin nombre",
      marca: el.querySelector(".pod-title")?.innerText.trim() || "Sin marca",
      precio: el.querySelector(".prices-0 span")?.innerText.trim() || "Sin precio",
      imagen: el.querySelector("picture img")?.src || el.querySelector("picture img")?.getAttribute("data-src") || "Sin imagen",
      enlace: el.href ? `https://tottus.falabella.com.pe${el.getAttribute("href")}` : "Sin enlace"
    }));
  });
}

// Revisar si la imagen parece un empaque flexible
async function esFlexible(imagenUrl) {
  if (!imagenUrl.includes("http")) return "No aplica";

  try {
    const buffer = await axios.get(imagenUrl, { responseType: "arraybuffer" });
    const resp = await axios.post(
      "https://api-inference.huggingface.co/models/google/vit-base-patch16-224",
      buffer.data,
      {
        headers: {
          Authorization: `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
          "Content-Type": "application/octet-stream",
        },
        timeout: 4000,
      }
    );

    const es = resp.data.some((r) =>
      ["plastic", "bag", "package", "wrap", "film", "pouch"].some((w) =>
        r.label.toLowerCase().includes(w)
      )
    );

    return es ? "Sí" : "No";
  } catch (e) {
    console.log("Problema al analizar imagen:", e.message);
    return "Error";
  }
}

// Guardar datos como JSON
function guardarJSON(data, archivo = "productos.json") {
  if (!data.length) {
    console.log("No hay productos para JSON.");
    return;
  }
  fs.writeFileSync(archivo, JSON.stringify(data, null, 2));
  console.log(`JSON creado: ${archivo}`);
}

// Guardar datos como CSV
async function guardarCSV(data, archivo = "productos.csv") {
  if (!data.length) {
    console.log("No hay productos para CSV.");
    return;
  }
  const writer = csvWriter({
    path: archivo,
    header: [
      { id: "categoria", title: "Categoría" },
      { id: "subcategoria", title: "Subcategoría" },
      { id: "nombre", title: "Nombre" },
      { id: "marca", title: "Marca" },
      { id: "precio", title: "Precio" },
      { id: "imagen", title: "Imagen (URL)" },
      { id: "enlace", title: "Enlace" },
      { id: "flexible", title: "Es flexible" }
    ],
  });
  await writer.writeRecords(data);
  console.log(`CSV creado: ${archivo}`);
}

// Scraping completo
(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  let pageNum = 1;
  let productos = [];

  while (true) {
    const url = `${START_URL}?page=${pageNum}`;
    console.log(`Visitando: ${url}`);
    await page.goto(url, { waitUntil: "networkidle2", timeout: 0 });

    await autoScroll(page); // Scroll aquí para cargar todas las imágenes lazy

    const items = await getProducts(page);
    if (!items.length) break;

    for (let item of items) {
      item.flexible = await esFlexible(item.imagen);
      console.log(`${item.nombre} - Flexible: ${item.flexible}`);
      productos.push(item);
    }

    pageNum++;
  }

  await browser.close();
  guardarJSON(productos);
  await guardarCSV(productos);
  console.log("Scraping terminado.");
})();
