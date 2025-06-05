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

    it('deve criar produto sem SKU e descrição', async () => {
      // Arrange
      const productWithoutSkuAndDescription: Product = {
        name: 'Produto Simples',
        price: 25.5,
      };

      mockPrismaService.product.findUnique.mockResolvedValue(null);
      mockPrismaService.product.create.mockResolvedValue({
        id: '789',
        ...productWithoutSkuAndDescription,
      });

      // Act
      const result: IResultCreateProduct = await service.createProduct(
        productWithoutSkuAndDescription,
      );

      // Assert
      expect(mockPrismaService.product.create).toHaveBeenCalledWith({
        data: {
          sku: undefined,
          name: productWithoutSkuAndDescription.name,
          price: productWithoutSkuAndDescription.price,
          description: undefined,
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
          sku: null,
          name: 'Produto 3',
          price: 75.5,
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
          price: '123.45', // Simulando Decimal do Prisma como string
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
  });

  describe('getProductsBySku', () => {
    it('deve retornar produto encontrado por SKU', async () => {
      // Arrange
      const sku = 'PROD001';
      const mockDbProduct = {
        id: '1',
        sku: 'PROD001',
        name: 'Produto Encontrado',
        price: 199.99,
        description: 'Produto encontrado por SKU',
      };

      mockPrismaService.product.findUnique.mockResolvedValue(mockDbProduct);

      // Act
      const result: Product = await service.getProductsBySku(sku);

      // Assert
      expect(mockPrismaService.product.findUnique).toHaveBeenCalledWith({
        where: { sku },
      });
      expect(result).toEqual({
        id: '1',
        sku: 'PROD001',
        name: 'Produto Encontrado',
        price: 199.99,
        description: 'Produto encontrado por SKU',
      });
    });

    it('deve retornar produto com valores padrão quando não encontrado', async () => {
      // Arrange
      const sku = 'PROD_INEXISTENTE';
      mockPrismaService.product.findUnique.mockResolvedValue(null);

      // Act
      const result: Product = await service.getProductsBySku(sku);

      // Assert
      expect(mockPrismaService.product.findUnique).toHaveBeenCalledWith({
        where: { sku },
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
      const sku = 'PROD002';
      const mockDbProduct = {
        id: '2',
        sku: null,
        name: 'Produto Sem SKU',
        price: '99.99',
        description: null,
      };

      mockPrismaService.product.findUnique.mockResolvedValue(mockDbProduct);

      // Act
      const result: Product = await service.getProductsBySku(sku);

      // Assert
      expect(result).toEqual({
        id: '2',
        sku: '',
        name: 'Produto Sem SKU',
        price: 99.99,
        description: '',
      });
    });

    it('deve converter preço decimal para number', async () => {
      // Arrange
      const sku = 'PROD003';
      const mockDbProduct = {
        id: '3',
        sku: 'PROD003',
        name: 'Produto Preço Decimal',
        price: '456.78', // Simulando Decimal do Prisma
        description: 'Teste conversão preço',
      };

      mockPrismaService.product.findUnique.mockResolvedValue(mockDbProduct);

      // Act
      const result: Product = await service.getProductsBySku(sku);

      // Assert
      expect(result.price).toBe(456.78);
      expect(typeof result.price).toBe('number');
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
