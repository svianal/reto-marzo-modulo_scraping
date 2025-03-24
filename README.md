# Scraper de Productos Tottus + Clasificación de Imágenes (Empaque Flexible)

Este proyecto realiza scraping de productos de la categoría "Despensa" de Tottus Perú, obteniendo información como nombre, marca, precio, imagen y enlace de cada producto. Además, se analiza cada imagen para determinar si el producto parece tener un empaque flexible (bolsas, plásticos, films, etc.), utilizando un modelo de visión por computadora de Hugging Face.

## Características

- Scraping de múltiples páginas de la categoría.
- Scroll automático para cargar productos con lazy loading.
- Análisis de imágenes con API de Hugging Face para detectar empaques flexibles.
- Exportación de resultados en CSV y JSON.
  
## Tecnologías usadas

- [Puppeteer](https://pptr.dev/) para el scraping web
- [Hugging Face API](https://huggingface.co/models) para la clasificación de imágenes
- [Axios](https://axios-http.com/) para la descarga de imágenes y consumo de API
- [csv-writer](https://www.npmjs.com/package/csv-writer) para la creación del CSV
- Node.js + dotenv.

## Ejecucion

node server.js

Notas adicionales
Si un producto no carga imagen correctamente por lazy loading, el sistema hace scroll para cargar todas las imágenes antes de extraer datos.

El campo "Es flexible" indica si el modelo de visión detectó que el empaque es tipo bolsa o similar

Requisitos
Node.js v16 o superior.

API Key gratuita o de pago de Hugging Face (https://huggingface.co/settings/tokens)