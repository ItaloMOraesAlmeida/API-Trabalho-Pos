import { Injectable } from '@nestjs/common';
import { PrismaService } from './Database/database.service';
import { IResultCreateProduct } from './app.controller';

export interface Product {
  id?: string;
  sku?: string;
  name: string;
  price: number;
  description?: string;
}

@Injectable()
export class AppService {
  constructor(private prismaService: PrismaService) {}

  async createProduct(product: Product): Promise<IResultCreateProduct> {
    const skuExists = await this.prismaService.product.findUnique({
      where: { sku: product.sku },
    });

    if (skuExists) {
      return {
        success: false,
        message: 'SKU já cadastrado',
      };
    }

    const dataProduct = await this.prismaService.product.create({
      data: {
        sku: product.sku,
        name: product.name,
        price: product.price,
        description: product.description,
      },
    });

    return {
      success: !!dataProduct,
    };
  }

  async getProducts(): Promise<Product[]> {
    const dataProsducts = await this.prismaService.product.findMany();

    return dataProsducts.map((product) => ({
      id: product.id,
      sku: product.sku ?? '',
      name: product.name,
      price: Number(product.price),
      description: product.description ?? '',
    }));
  }

  async getProductsBySku(sku: string): Promise<Product> {
    const dataProsduct = await this.prismaService.product.findUnique({
      where: { sku },
    });

    return {
      id: dataProsduct?.id,
      sku: dataProsduct?.sku ?? '',
      name: dataProsduct?.name ?? '',
      price: Number(dataProsduct?.price),
      description: dataProsduct?.description ?? '',
    };
  }
}
