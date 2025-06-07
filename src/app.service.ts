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

  async updateProduct(body: {
    sku: string;
    name: string;
    price: number;
    description?: string;
  }): Promise<{ success: boolean; message?: string }> {
    // Implement your update logic here, e.g., find product by SKU and update its fields
    const productExists = await this.prismaService.product.findUnique({
      where: { sku: body.sku },
    });
    if (!productExists) {
      return { success: false, message: 'Product not found' };
    }
    await this.prismaService.product.update({
      where: { sku: body.sku },
      data: {
        name: body.name,
        price: body.price,
        description: body.description,
      },
    });
    // This is a placeholder implementation
    return { success: true, message: 'Product updated successfully' };
  }

  async deleteProduct(sku: string): Promise<boolean> {
    const productExists = await this.prismaService.product.findUnique({
      where: { sku },
    });

    if (!productExists) {
      return false;
    }

    const resultUpdate = await this.prismaService.product.delete({
      where: { sku },
    });

    return !!resultUpdate;
  }
}
