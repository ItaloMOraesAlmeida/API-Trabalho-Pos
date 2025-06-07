# Guia de Implementação Frontend - Upload de Imagens para Produtos

## 📋 Passo a Passo para Implementar Upload de Imagens no Frontend

### 1. **ATUALIZAR FORMULÁRIO DE CRIAÇÃO DE PRODUTO**

**O que fazer:**

- Adicionar campo de input tipo file para seleção de imagem
- Alterar o enctype do formulário para "multipart/form-data"
- Usar FormData ao invés de JSON para enviar dados

**Implementação:**

```html
<!-- HTML -->
<form id="createProductForm" enctype="multipart/form-data">
  <input type="text" name="name" placeholder="Nome do Produto" required />
  <input type="number" name="price" placeholder="Preço" step="0.01" required />
  <input type="text" name="sku" placeholder="SKU" />
  <textarea name="description" placeholder="Descrição"></textarea>
  <input type="file" name="image" accept="image/*" />
  <button type="submit">Criar Produto</button>
</form>
```

```javascript
// JavaScript - Função para criar produto
async function createProduct(formElement) {
  const formData = new FormData(formElement);

  const response = await fetch('/product', {
    method: 'POST',
    body: formData, // NÃO adicionar Content-Type header
  });

  return await response.json();
}
```

### 2. **ATUALIZAR FORMULÁRIO DE EDIÇÃO DE PRODUTO**

**O que fazer:**

- Adicionar campo de input tipo file opcional
- Mostrar imagem atual se existir
- Permitir substituir ou manter imagem existente

**Implementação:**

```html
<!-- HTML -->
<form id="editProductForm" enctype="multipart/form-data">
  <input type="hidden" name="id" />
  <input type="text" name="name" required />
  <input type="number" name="price" step="0.01" required />
  <input type="text" name="sku" required />
  <textarea name="description"></textarea>

  <!-- Mostrar imagem atual -->
  <div id="currentImage"></div>

  <!-- Campo para nova imagem -->
  <input type="file" name="image" accept="image/*" />
  <small>Deixe em branco para manter a imagem atual</small>

  <button type="submit">Atualizar Produto</button>
</form>
```

```javascript
// JavaScript - Função para editar produto
async function updateProduct(formElement) {
  const formData = new FormData(formElement);

  const response = await fetch('/product', {
    method: 'PUT',
    body: formData, // NÃO adicionar Content-Type header
  });

  return await response.json();
}

// Função para preencher formulário de edição
function fillEditForm(product) {
  document.querySelector('[name="id"]').value = product.id;
  document.querySelector('[name="name"]').value = product.name;
  document.querySelector('[name="price"]').value = product.price;
  document.querySelector('[name="sku"]').value = product.sku;
  document.querySelector('[name="description"]').value = product.description;

  // Mostrar imagem atual se existir
  const currentImageDiv = document.getElementById('currentImage');
  if (product.image) {
    currentImageDiv.innerHTML = `
      <img src="/product/image/${product.image}" 
           alt="Imagem atual" 
           style="max-width: 200px; max-height: 200px;">
      <p>Imagem atual</p>
    `;
  } else {
    currentImageDiv.innerHTML = '<p>Sem imagem</p>';
  }
}
```

### 3. **ATUALIZAR LISTAGEM DE PRODUTOS**

**O que fazer:**

- Exibir imagem do produto na listagem
- Adicionar tratamento para produtos sem imagem
- Otimizar carregamento de imagens

**Implementação:**

```javascript
// JavaScript - Função para listar produtos
async function loadProducts() {
  const response = await fetch('/product');
  const products = await response.json();

  const productList = document.getElementById('productList');
  productList.innerHTML = '';

  products.forEach((product) => {
    const productElement = document.createElement('div');
    productElement.className = 'product-item';

    productElement.innerHTML = `
      <div class="product-image">
        ${
          product.image
            ? `<img src="/product/image/${product.image}" 
                  alt="${product.name}" 
                  style="max-width: 150px; max-height: 150px; object-fit: cover;">`
            : '<div class="no-image">Sem imagem</div>'
        }
      </div>
      <div class="product-info">
        <h3>${product.name}</h3>
        <p>SKU: ${product.sku}</p>
        <p>Preço: R$ ${product.price}</p>
        <p>${product.description}</p>
        <button onclick="editProduct('${product.id}')">Editar</button>
        <button onclick="deleteProduct('${product.id}')">Excluir</button>
      </div>
    `;

    productList.appendChild(productElement);
  });
}
```

### 4. **VISUALIZAÇÃO INDIVIDUAL DE PRODUTO**

**O que fazer:**

- Mostrar imagem em tamanho maior
- Adicionar funcionalidade de zoom ou modal

**Implementação:**

```javascript
// JavaScript - Função para visualizar produto individual
async function viewProduct(productId) {
  const response = await fetch(`/product/byId?id=${productId}`);
  const product = await response.json();

  const productDetail = document.getElementById('productDetail');
  productDetail.innerHTML = `
    <div class="product-detail">
      <div class="product-image-large">
        ${
          product.image
            ? `<img src="/product/image/${product.image}" 
                  alt="${product.name}" 
                  style="max-width: 400px; max-height: 400px; object-fit: contain;"
                  onclick="openImageModal('/product/image/${product.image}')">`
            : '<div class="no-image-large">Sem imagem disponível</div>'
        }
      </div>
      <div class="product-info-detail">
        <h2>${product.name}</h2>
        <p><strong>SKU:</strong> ${product.sku}</p>
        <p><strong>Preço:</strong> R$ ${product.price}</p>
        <p><strong>Descrição:</strong> ${product.description}</p>
      </div>
    </div>
  `;
}

// Modal para visualizar imagem em tamanho completo
function openImageModal(imageSrc) {
  const modal = document.createElement('div');
  modal.className = 'image-modal';
  modal.innerHTML = `
    <div class="modal-content">
      <span class="close" onclick="this.parentElement.parentElement.remove()">&times;</span>
      <img src="${imageSrc}" style="max-width: 90vw; max-height: 90vh;">
    </div>
  `;
  document.body.appendChild(modal);
}
```

### 5. **PREVIEW DE IMAGEM ANTES DO UPLOAD**

**O que fazer:**

- Mostrar preview da imagem selecionada
- Validar tipo e tamanho do arquivo

**Implementação:**

```javascript
// JavaScript - Preview de imagem
function setupImagePreview(inputElement, previewElement) {
  inputElement.addEventListener('change', function (e) {
    const file = e.target.files[0];

    if (file) {
      // Validar tipo de arquivo
      if (!file.type.startsWith('image/')) {
        alert('Por favor, selecione apenas arquivos de imagem');
        this.value = '';
        return;
      }

      // Validar tamanho (exemplo: máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('Imagem muito grande. Máximo 5MB');
        this.value = '';
        return;
      }

      // Mostrar preview
      const reader = new FileReader();
      reader.onload = function (e) {
        previewElement.innerHTML = `
          <img src="${e.target.result}" 
               style="max-width: 200px; max-height: 200px; object-fit: cover;">
          <p>Preview da nova imagem</p>
        `;
      };
      reader.readAsDataURL(file);
    } else {
      previewElement.innerHTML = '';
    }
  });
}

// Usar a função
const imageInput = document.querySelector('input[name="image"]');
const previewDiv = document.getElementById('imagePreview');
setupImagePreview(imageInput, previewDiv);
```

### 6. **TRATAMENTO DE ERROS E LOADING**

**O que fazer:**

- Adicionar indicadores de carregamento
- Tratar erros de upload
- Mostrar mensagens de sucesso/erro

**Implementação:**

```javascript
// JavaScript - Funções com tratamento completo
async function createProductWithLoading(formElement) {
  const submitButton = formElement.querySelector('button[type="submit"]');
  const originalText = submitButton.textContent;

  try {
    // Mostrar loading
    submitButton.textContent = 'Criando...';
    submitButton.disabled = true;

    const formData = new FormData(formElement);

    const response = await fetch('/product', {
      method: 'POST',
      body: formData,
    });

    const result = await response.json();

    if (result.success) {
      showMessage('Produto criado com sucesso!', 'success');
      formElement.reset();
      document.getElementById('imagePreview').innerHTML = '';
      await loadProducts();
    } else {
      showMessage('Erro: ' + result.message, 'error');
    }
  } catch (error) {
    console.error('Erro:', error);
    showMessage('Erro ao criar produto', 'error');
  } finally {
    // Restaurar botão
    submitButton.textContent = originalText;
    submitButton.disabled = false;
  }
}

function showMessage(message, type) {
  const messageDiv = document.createElement('div');
  messageDiv.className = `message ${type}`;
  messageDiv.textContent = message;

  document.body.appendChild(messageDiv);

  setTimeout(() => {
    messageDiv.remove();
  }, 3000);
}
```

### 7. **CSS PARA ESTILIZAÇÃO**

```css
/* CSS básico para as imagens */
.product-item {
  border: 1px solid #ddd;
  padding: 10px;
  margin: 10px;
  border-radius: 5px;
}

.product-image img {
  border-radius: 5px;
  border: 1px solid #eee;
}

.no-image {
  width: 150px;
  height: 150px;
  background: #f5f5f5;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px dashed #ccc;
  border-radius: 5px;
  color: #666;
}

.image-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  position: relative;
  background: white;
  padding: 20px;
  border-radius: 5px;
}

.close {
  position: absolute;
  top: 10px;
  right: 15px;
  font-size: 28px;
  cursor: pointer;
}

.message {
  position: fixed;
  top: 20px;
  right: 20px;
  padding: 10px 20px;
  border-radius: 5px;
  color: white;
  z-index: 1000;
}

.message.success {
  background: #4caf50;
}

.message.error {
  background: #f44336;
}
```

## 🚨 PONTOS IMPORTANTES:

1. **Sempre usar FormData** para uploads de arquivo, nunca JSON
2. **Não definir Content-Type** ao usar FormData - o browser faz automaticamente
3. **Validar arquivos** no frontend antes de enviar
4. **Tratar casos** onde o produto não tem imagem
5. **Otimizar carregamento** das imagens na listagem
6. **Adicionar preview** para melhor UX
7. **Implementar loading states** durante uploads

## 📝 RESUMO DAS MUDANÇAS NECESSÁRIAS:

- ✅ Formulários: adicionar `enctype="multipart/form-data"` e input file
- ✅ JavaScript: usar FormData ao invés de JSON.stringify
- ✅ Listagem: exibir imagens dos produtos
- ✅ Edição: mostrar imagem atual e permitir substituição
- ✅ Visualização: endpoint para servir imagens `/product/image/:filename`
- ✅ Validação: tipo e tamanho de arquivo
- ✅ UX: preview, loading, mensagens de erro/sucesso
