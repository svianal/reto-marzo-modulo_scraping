const express = require('express');
const app = express();
const path = require('path');

app.use(express.static('public'));
app.use('/data', express.static(__dirname));

app.listen(3000, () => {
  console.log('🚀 Servidor iniciado en http://localhost:3000');
});
