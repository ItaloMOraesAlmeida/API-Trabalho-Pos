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

    it('deve criar produto sem SKU e descrição (campos opcionais)', async () => {
      // Arrange
      const productWithoutOptionalFields: Product = {
        name: 'Produto Simples',
        price: 25.5,
      };

      mockPrismaService.product.findUnique.mockResolvedValue(null);
      mockPrismaService.product.create.mockResolvedValue({
        id: '789',
        ...productWithoutOptionalFields,
      });

      // Act
      const result: IResultCreateProduct = await service.createProduct(
        productWithoutOptionalFields,
      );

      // Assert
      expect(mockPrismaService.product.create).toHaveBeenCalledWith({
        data: {
          sku: undefined,
          name: productWithoutOptionalFields.name,
          price: productWithoutOptionalFields.price,
          description: undefined,
        },
      });
      expect(result.success).toBe(true);
    });

    it('deve verificar SKU mesmo quando produto não tem SKU definido', async () => {
      // Arrange
      const productWithoutSku: Product = {
        name: 'Produto Sem SKU',
        price: 15.0,
      };

      mockPrismaService.product.findUnique.mockResolvedValue(null);
      mockPrismaService.product.create.mockResolvedValue({
        id: '999',
        ...productWithoutSku,
      });

      // Act
      const result: IResultCreateProduct =
        await service.createProduct(productWithoutSku);

      // Assert
      expect(mockPrismaService.product.findUnique).toHaveBeenCalledWith({
        where: { sku: undefined },
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
          price: '99.99',
          description: 'Descrição 1',
        },
        {
          id: '2',
          sku: 'PROD002',
          name: 'Produto 2',
          price: '149.99',
          description: 'Descrição 2',
        },
        {
          id: '3',
          sku: null,
          name: 'Produto 3',
          price: '75.50',
          description: null,
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
        },
        {
          id: '2',
          sku: 'PROD002',
          name: 'Produto 2',
          price: 149.99,
          description: 'Descrição 2',
        },
        {
          id: '3',
          sku: '',
          name: 'Produto 3',
          price: 75.5,
          description: '',
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
          price: '123.45',
          description: 'Teste decimal',
        },
      ];

      mockPrismaService.product.findMany.mockResolvedValue(mockDbProducts);

      // Act
      const result: Product[] = await service.getProducts();

      // Assert
      expect(result[0].price).toBe(123.45);
      expect(typeof result[0].price).toBe('number');
    });

    it('deve tratar valores NaN no preço', async () => {
      // Arrange
      const mockDbProducts = [
        {
          id: '1',
          sku: 'PROD001',
          name: 'Produto Preço Inválido',
          price: 'invalid_price',
          description: 'Teste preço inválido',
        },
      ];

      mockPrismaService.product.findMany.mockResolvedValue(mockDbProducts);

      // Act
      const result: Product[] = await service.getProducts();

      // Assert
      expect(isNaN(result[0].price)).toBe(true);
    });
  });

  describe('getProductsById', () => {
    it('deve retornar produto encontrado por ID', async () => {
      // Arrange
      const id = 'product-id-123';
      const mockDbProduct = {
        id: 'product-id-123',
        sku: 'PROD001',
        name: 'Produto Encontrado',
        price: '199.99',
        description: 'Produto encontrado por ID',
      };

      mockPrismaService.product.findUnique.mockResolvedValue(mockDbProduct);

      // Act
      const result: Product = await service.getProductsById(id);

      // Assert
      expect(mockPrismaService.product.findUnique).toHaveBeenCalledWith({
        where: { id },
      });
      expect(result).toEqual({
        id: 'product-id-123',
        sku: 'PROD001',
        name: 'Produto Encontrado',
        price: 199.99,
        description: 'Produto encontrado por ID',
      });
    });

    it('deve retornar produto com valores padrão quando não encontrado', async () => {
      // Arrange
      const id = 'produto-inexistente';
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
      });
    });

    it('deve tratar valores nulos do banco corretamente', async () => {
      // Arrange
      const id = 'product-id-456';
      const mockDbProduct = {
        id: 'product-id-456',
        sku: null,
        name: 'Produto Sem SKU',
        price: '99.99',
        description: null,
      };

      mockPrismaService.product.findUnique.mockResolvedValue(mockDbProduct);

      // Act
      const result: Product = await service.getProductsById(id);

      // Assert
      expect(result).toEqual({
        id: 'product-id-456',
        sku: '',
        name: 'Produto Sem SKU',
        price: 99.99,
        description: '',
      });
    });

    it('deve converter preço decimal para number', async () => {
      // Arrange
      const id = 'product-id-789';
      const mockDbProduct = {
        id: 'product-id-789',
        sku: 'PROD003',
        name: 'Produto Preço Decimal',
        price: '456.78',
        description: 'Teste conversão preço',
      };

      mockPrismaService.product.findUnique.mockResolvedValue(mockDbProduct);

      // Act
      const result: Product = await service.getProductsById(id);

      // Assert
      expect(result.price).toBe(456.78);
      expect(typeof result.price).toBe('number');
    });
  });

  describe('updateProduct', () => {
    const updateData = {
      id: 'product-id-123',
      sku: 'PROD001_UPDATED',
      name: 'Produto Atualizado',
      price: 199.99,
      description: 'Descrição atualizada',
    };

    it('deve atualizar produto com sucesso quando produto existe', async () => {
      // Arrange
      mockPrismaService.product.findUnique.mockResolvedValue({
        id: 'product-id-original',
        sku: 'PROD001',
        name: 'Produto Original',
        price: '99.99',
        description: 'Descrição original',
      });
      mockPrismaService.product.update.mockResolvedValue({
        ...updateData,
      });

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

    it('deve atualizar produto sem descrição (campo opcional)', async () => {
      // Arrange
      const updateDataWithoutDescription = {
        id: 'product-id-456',
        sku: 'PROD002_UPDATED',
        name: 'Produto Sem Descrição',
        price: 299.99,
      };

      mockPrismaService.product.findUnique.mockResolvedValue({
        id: 'product-id-original-2',
        sku: 'PROD002',
        name: 'Produto Original',
        price: '199.99',
        description: 'Descrição original',
      });
      mockPrismaService.product.update.mockResolvedValue({
        ...updateDataWithoutDescription,
      });

      // Act
      const result = await service.updateProduct(updateDataWithoutDescription);

      // Assert
      expect(mockPrismaService.product.update).toHaveBeenCalledWith({
        where: { id: updateDataWithoutDescription.id },
        data: {
          sku: updateDataWithoutDescription.sku,
          name: updateDataWithoutDescription.name,
          price: updateDataWithoutDescription.price,
          description: undefined,
        },
      });
      expect(result.success).toBe(true);
    });
  });

  describe('deleteProduct', () => {
    it('deve deletar produto com sucesso quando produto existe', async () => {
      // Arrange
      const productId = 'product-id-123';
      mockPrismaService.product.findUnique.mockResolvedValue({
        id: productId,
        sku: 'PROD001',
        name: 'Produto Para Deletar',
        price: '99.99',
        description: 'Produto será deletado',
      });
      mockPrismaService.product.delete.mockResolvedValue({
        id: productId,
        sku: 'PROD001',
        name: 'Produto Para Deletar',
        price: '99.99',
        description: 'Produto será deletado',
      });

      // Act
      const result = await service.deleteProduct(productId);

      // Assert
      expect(mockPrismaService.product.findUnique).toHaveBeenCalledWith({
        where: { id: productId },
      });
      expect(mockPrismaService.product.delete).toHaveBeenCalledWith({
        where: { id: productId },
      });
      expect(result).toBe(true);
    });

    it('deve retornar false quando produto não existe', async () => {
      // Arrange
      const productId = 'produto-inexistente';
      mockPrismaService.product.findUnique.mockResolvedValue(null);

      // Act
      const result = await service.deleteProduct(productId);

      // Assert
      expect(mockPrismaService.product.findUnique).toHaveBeenCalledWith({
        where: { id: productId },
      });
      expect(mockPrismaService.product.delete).not.toHaveBeenCalled();
      expect(result).toBe(false);
    });

    it('deve retornar false quando delete falha', async () => {
      // Arrange
      const productId = 'product-id-456';
      mockPrismaService.product.findUnique.mockResolvedValue({
        id: productId,
        sku: 'PROD002',
        name: 'Produto Teste',
        price: '150.00',
        description: 'Teste delete',
      });
      mockPrismaService.product.delete.mockResolvedValue(null);

      // Act
      const result = await service.deleteProduct(productId);

      // Assert
      expect(mockPrismaService.product.delete).toHaveBeenCalledWith({
        where: { id: productId },
      });
      expect(result).toBe(false);
    });

    it('deve lidar com erro durante operação de delete', async () => {
      // Arrange
      const productId = 'product-id-error';
      mockPrismaService.product.findUnique.mockResolvedValue({
        id: productId,
        sku: 'PROD003',
        name: 'Produto Erro',
        price: '200.00',
        description: 'Teste erro',
      });
      mockPrismaService.product.delete.mockRejectedValue(
        new Error('Database error'),
      );

      // Act & Assert
      await expect(service.deleteProduct(productId)).rejects.toThrow(
        'Database error',
      );
      expect(mockPrismaService.product.findUnique).toHaveBeenCalledWith({
        where: { id: productId },
      });
      expect(mockPrismaService.product.delete).toHaveBeenCalledWith({
        where: { id: productId },
      });
    });
  });

  describe('Testes de Integração do Service', () => {
    it('deve ser definido', () => {
      expect(service).toBeDefined();
    });

    it('deve ter PrismaService injetado', () => {
      expect(prismaService).toBeDefined();
    });

    it('deve ter todos os métodos definidos', () => {
      expect(typeof service.createProduct).toBe('function');
      expect(typeof service.getProducts).toBe('function');
      expect(typeof service.getProductsById).toBe('function');
      expect(typeof service.updateProduct).toBe('function');
      expect(typeof service.deleteProduct).toBe('function');
    });
  });

  describe('Testes de Edge Cases', () => {
    it('deve lidar com erro de banco durante createProduct', async () => {
      // Arrange
      const mockProduct: Product = {
        sku: 'PROD_ERROR',
        name: 'Produto Erro',
        price: 99.99,
        description: 'Teste erro',
      };

      mockPrismaService.product.findUnique.mockRejectedValue(
        new Error('Database connection error'),
      );

      // Act & Assert
      await expect(service.createProduct(mockProduct)).rejects.toThrow(
        'Database connection error',
      );
    });

    it('deve lidar com erro de banco durante getProducts', async () => {
      // Arrange
      mockPrismaService.product.findMany.mockRejectedValue(
        new Error('Database error'),
      );

      // Act & Assert
      await expect(service.getProducts()).rejects.toThrow('Database error');
    });

    it('deve lidar com erro de banco durante getProductsById', async () => {
      // Arrange
      mockPrismaService.product.findUnique.mockRejectedValue(
        new Error('Database error'),
      );

      // Act & Assert
      await expect(service.getProductsById('test-id')).rejects.toThrow(
        'Database error',
      );
    });

    it('deve lidar com erro de banco durante updateProduct', async () => {
      // Arrange
      const updateData = {
        id: 'product-id-error',
        sku: 'PROD_ERROR',
        name: 'Produto Erro',
        price: 99.99,
        description: 'Teste erro',
      };

      mockPrismaService.product.findUnique.mockRejectedValue(
        new Error('Database error'),
      );

      // Act & Assert
      await expect(service.updateProduct(updateData)).rejects.toThrow(
        'Database error',
      );
    });
  });
});
