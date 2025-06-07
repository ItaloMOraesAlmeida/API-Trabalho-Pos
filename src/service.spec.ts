import { Test, TestingModule } from '@nestjs/testing';
import { AppService, Product } from './app.service';
import { PrismaService } from './Database/database.service';
import { IResultCreateProduct } from './app.controller';

describe('AppService Tests', () => {
  let service: AppService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    product: {
      findUnique: jest.fn(),
      create: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AppService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<AppService>(AppService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createProduct', () => {
    const mockProduct: Product = {
      sku: 'PROD001',
      name: 'Produto Teste',
      price: 99.99,
      description: 'Descrição do produto teste',
      image: 'product-image.jpg',
    };

    it('deve criar um produto com sucesso quando SKU não existe', async () => {
      // Arrange
      mockPrismaService.product.findUnique.mockResolvedValue(null);
      mockPrismaService.product.create.mockResolvedValue({
        id: '123',
        ...mockProduct,
      });

      // Act
      const result: IResultCreateProduct =
        await service.createProduct(mockProduct);

      // Assert
      expect(mockPrismaService.product.findUnique).toHaveBeenCalledWith({
        where: { sku: mockProduct.sku },
      });
      expect(mockPrismaService.product.create).toHaveBeenCalledWith({
        data: {
          sku: mockProduct.sku,
          name: mockProduct.name,
          price: mockProduct.price,
          description: mockProduct.description,
          image: mockProduct.image,
        },
      });
      expect(result).toEqual({
        success: true,
      });
    });

    it('deve retornar erro quando SKU já existe', async () => {
      // Arrange
      mockPrismaService.product.findUnique.mockResolvedValue({
        id: '456',
        sku: 'PROD001',
        name: 'Produto Existente',
        price: 50.0,
        description: 'Produto já cadastrado',
        image: 'existing-image.jpg',
      });

      // Act
      const result: IResultCreateProduct =
        await service.createProduct(mockProduct);

      // Assert
      expect(mockPrismaService.product.findUnique).toHaveBeenCalledWith({
        where: { sku: mockProduct.sku },
      });
      expect(mockPrismaService.product.create).not.toHaveBeenCalled();
      expect(result).toEqual({
        success: false,
        message: 'SKU já cadastrado',
      });
    });

    it('deve retornar success false quando criação falha', async () => {
      // Arrange
      mockPrismaService.product.findUnique.mockResolvedValue(null);
      mockPrismaService.product.create.mockResolvedValue(null);

      // Act
      const result: IResultCreateProduct =
        await service.createProduct(mockProduct);

      // Assert
      expect(result).toEqual({
        success: false,
      });
    });

    it('deve criar produto sem campos opcionais', async () => {
      // Arrange
      const productMinimal: Product = {
        name: 'Produto Simples',
        price: 25.5,
      };

      mockPrismaService.product.findUnique.mockResolvedValue(null);
      mockPrismaService.product.create.mockResolvedValue({
        id: '789',
        ...productMinimal,
      });

      // Act
      const result: IResultCreateProduct =
        await service.createProduct(productMinimal);

      // Assert
      expect(mockPrismaService.product.create).toHaveBeenCalledWith({
        data: {
          sku: undefined,
          name: productMinimal.name,
          price: productMinimal.price,
          description: undefined,
          image: undefined,
        },
      });
      expect(result.success).toBe(true);
    });
  });

  describe('getProducts', () => {
    it('deve retornar lista de produtos formatada', async () => {
      // Arrange
      const mockDbProducts = [
        {
          id: '1',
          sku: 'PROD001',
          name: 'Produto 1',
          price: 99.99,
          description: 'Descrição 1',
          image: 'image1.jpg',
        },
        {
          id: '2',
          sku: 'PROD002',
          name: 'Produto 2',
          price: 149.99,
          description: 'Descrição 2',
          image: 'image2.jpg',
        },
        {
          id: '3',
          sku: null,
          name: 'Produto 3',
          price: 75.5,
          description: null,
          image: null,
        },
      ];

      mockPrismaService.product.findMany.mockResolvedValue(mockDbProducts);

      // Act
      const result: Product[] = await service.getProducts();

      // Assert
      expect(mockPrismaService.product.findMany).toHaveBeenCalled();
      expect(result).toEqual([
        {
          id: '1',
          sku: 'PROD001',
          name: 'Produto 1',
          price: 99.99,
          description: 'Descrição 1',
          image: 'image1.jpg',
        },
        {
          id: '2',
          sku: 'PROD002',
          name: 'Produto 2',
          price: 149.99,
          description: 'Descrição 2',
          image: 'image2.jpg',
        },
        {
          id: '3',
          sku: '',
          name: 'Produto 3',
          price: 75.5,
          description: '',
          image: '',
        },
      ]);
    });

    it('deve retornar array vazio quando não há produtos', async () => {
      // Arrange
      mockPrismaService.product.findMany.mockResolvedValue([]);

      // Act
      const result: Product[] = await service.getProducts();

      // Assert
      expect(mockPrismaService.product.findMany).toHaveBeenCalled();
      expect(result).toEqual([]);
    });

    it('deve converter preços decimais corretamente', async () => {
      // Arrange
      const mockDbProducts = [
        {
          id: '1',
          sku: 'PROD001',
          name: 'Produto Decimal',
          price: '123.45', // Simulando Decimal do Prisma como string
          description: 'Teste decimal',
          image: 'decimal-image.jpg',
        },
      ];

      mockPrismaService.product.findMany.mockResolvedValue(mockDbProducts);

      // Act
      const result: Product[] = await service.getProducts();

      // Assert
      expect(result[0].price).toBe(123.45);
      expect(typeof result[0].price).toBe('number');
    });
  });

  describe('getProductsById', () => {
    it('deve retornar produto encontrado por ID', async () => {
      // Arrange
      const id = '123';
      const mockDbProduct = {
        id: '123',
        sku: 'PROD001',
        name: 'Produto Encontrado',
        price: 199.99,
        description: 'Produto encontrado por ID',
        image: 'found-product.jpg',
      };

      mockPrismaService.product.findUnique.mockResolvedValue(mockDbProduct);

      // Act
      const result: Product = await service.getProductsById(id);

      // Assert
      expect(mockPrismaService.product.findUnique).toHaveBeenCalledWith({
        where: { id },
      });
      expect(result).toEqual({
        id: '123',
        sku: 'PROD001',
        name: 'Produto Encontrado',
        price: 199.99,
        description: 'Produto encontrado por ID',
        image: 'found-product.jpg',
      });
    });

    it('deve retornar produto com valores padrão quando não encontrado', async () => {
      // Arrange
      const id = 'ID_INEXISTENTE';
      mockPrismaService.product.findUnique.mockResolvedValue(null);

      // Act
      const result: Product = await service.getProductsById(id);

      // Assert
      expect(mockPrismaService.product.findUnique).toHaveBeenCalledWith({
        where: { id },
      });
      expect(result).toEqual({
        id: undefined,
        sku: '',
        name: '',
        price: NaN,
        description: '',
        image: '',
      });
    });

    it('deve tratar valores nulos do banco corretamente', async () => {
      // Arrange
      const id = '456';
      const mockDbProduct = {
        id: '456',
        sku: null,
        name: 'Produto Sem SKU',
        price: '99.99',
        description: null,
        image: null,
      };

      mockPrismaService.product.findUnique.mockResolvedValue(mockDbProduct);

      // Act
      const result: Product = await service.getProductsById(id);

      // Assert
      expect(result).toEqual({
        id: '456',
        sku: '',
        name: 'Produto Sem SKU',
        price: 99.99,
        description: '',
        image: '',
      });
    });
  });

  describe('updateProduct', () => {
    const updateData = {
      id: '123',
      sku: 'PROD001_UPDATED',
      name: 'Produto Atualizado',
      price: 199.99,
      description: 'Descrição atualizada',
      image: 'updated-image.jpg',
    };

    it('deve atualizar produto com sucesso quando produto existe', async () => {
      // Arrange
      mockPrismaService.product.findUnique.mockResolvedValue({
        id: '123',
        sku: 'PROD001',
        name: 'Produto Original',
        price: 99.99,
        description: 'Descrição original',
        image: 'original-image.jpg',
      });
      mockPrismaService.product.update.mockResolvedValue(updateData);

      // Act
      const result = await service.updateProduct(updateData);

      // Assert
      expect(mockPrismaService.product.findUnique).toHaveBeenCalledWith({
        where: { id: updateData.id },
      });
      expect(mockPrismaService.product.update).toHaveBeenCalledWith({
        where: { id: updateData.id },
        data: {
          sku: updateData.sku,
          name: updateData.name,
          price: updateData.price,
          description: updateData.description,
          image: updateData.image,
        },
      });
      expect(result).toEqual({
        success: true,
        message: 'Product updated successfully',
      });
    });

    it('deve retornar erro quando produto não existe', async () => {
      // Arrange
      mockPrismaService.product.findUnique.mockResolvedValue(null);

      // Act
      const result = await service.updateProduct(updateData);

      // Assert
      expect(mockPrismaService.product.findUnique).toHaveBeenCalledWith({
        where: { id: updateData.id },
      });
      expect(mockPrismaService.product.update).not.toHaveBeenCalled();
      expect(result).toEqual({
        success: false,
        message: 'Product not found',
      });
    });

    it('deve atualizar produto sem imagem quando não fornecida', async () => {
      // Arrange
      const updateDataWithoutImage = {
        id: '123',
        sku: 'PROD001_UPDATED',
        name: 'Produto Atualizado',
        price: 199.99,
        description: 'Descrição atualizada',
      };

      mockPrismaService.product.findUnique.mockResolvedValue({
        id: '123',
        sku: 'PROD001',
        name: 'Produto Original',
        price: 99.99,
        description: 'Descrição original',
        image: 'original-image.jpg',
      });
      mockPrismaService.product.update.mockResolvedValue(
        updateDataWithoutImage,
      );

      // Act
      const result = await service.updateProduct(updateDataWithoutImage);

      // Assert
      expect(mockPrismaService.product.update).toHaveBeenCalledWith({
        where: { id: updateDataWithoutImage.id },
        data: {
          sku: updateDataWithoutImage.sku,
          name: updateDataWithoutImage.name,
          price: updateDataWithoutImage.price,
          description: updateDataWithoutImage.description,
        },
      });
      expect(result.success).toBe(true);
    });
  });

  describe('deleteProduct', () => {
    it('deve deletar produto com sucesso quando produto existe', async () => {
      // Arrange
      const id = '123';
      const mockProduct = {
        id: '123',
        sku: 'PROD001',
        name: 'Produto a ser deletado',
        price: 99.99,
        description: 'Produto que será removido',
        image: 'to-delete.jpg',
      };

      mockPrismaService.product.findUnique.mockResolvedValue(mockProduct);
      mockPrismaService.product.delete.mockResolvedValue(mockProduct);

      // Act
      const result = await service.deleteProduct(id);

      // Assert
      expect(mockPrismaService.product.findUnique).toHaveBeenCalledWith({
        where: { id },
      });
      expect(mockPrismaService.product.delete).toHaveBeenCalledWith({
        where: { id },
      });
      expect(result).toBe(true);
    });

    it('deve retornar false quando produto não existe', async () => {
      // Arrange
      const id = 'ID_INEXISTENTE';
      mockPrismaService.product.findUnique.mockResolvedValue(null);

      // Act
      const result = await service.deleteProduct(id);

      // Assert
      expect(mockPrismaService.product.findUnique).toHaveBeenCalledWith({
        where: { id },
      });
      expect(mockPrismaService.product.delete).not.toHaveBeenCalled();
      expect(result).toBe(false);
    });

    it('deve retornar false quando delete falha', async () => {
      // Arrange
      const id = '123';
      const mockProduct = {
        id: '123',
        sku: 'PROD001',
        name: 'Produto a ser deletado',
        price: 99.99,
        description: 'Produto que será removido',
        image: 'to-delete.jpg',
      };

      mockPrismaService.product.findUnique.mockResolvedValue(mockProduct);
      mockPrismaService.product.delete.mockResolvedValue(null);

      // Act
      const result = await service.deleteProduct(id);

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('Testes de Integração do Service', () => {
    it('deve ser definido', () => {
      expect(service).toBeDefined();
    });

    it('deve ter PrismaService injetado', () => {
      expect(prismaService).toBeDefined();
    });
  });
});
