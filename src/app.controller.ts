import { Body, Controller, Delete, Get, Post, Query } from '@nestjs/common';
import { AppService, Product } from './app.service';
import { ApiBody, ApiTags } from '@nestjs/swagger';
import { Put } from '@nestjs/common';

export interface IResultCreateProduct {
  success: boolean;
  message?: string;
}

@ApiTags('Produto')
@Controller('product')
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Post()
  @ApiBody({
    description: 'Create a new product',
    schema: {
      type: 'object',
      properties: {
        sku: { type: 'string', example: 'SKU12345' },
        name: { type: 'string', example: 'Product Name' },
        price: { type: 'number', example: 100.0 },
        description: {
          type: 'string',
          example: 'Product Description',
        },
      },
      required: ['name', 'price'],
    },
  })
  async createProduct(
    @Body() body: { name: string; price: number; description?: string },
  ): Promise<IResultCreateProduct> {
    const resultdata = await this.appService.createProduct(body);

    return resultdata;
  }

  @Get()
  async getProducts(): Promise<Product[]> {
    const dataProducts = await this.appService.getProducts();

    return dataProducts;
  }

  @Get('bySku')
  async getProductBySku(@Query('sku') sku: string): Promise<Product> {
    const dataProduct = await this.appService.getProductsBySku(sku);

    return dataProduct;
  }

  @Put()
  @ApiBody({
    description: 'Update a product by SKU',
    schema: {
      type: 'object',
      properties: {
        sku: { type: 'string', example: 'SKU12345' },
        name: { type: 'string', example: 'Updated Product Name' },
        price: { type: 'number', example: 150.0 },
        description: {
          type: 'string',
          example: 'Updated Product Description',
        },
      },
      required: ['sku', 'name', 'price'],
    },
  })
  async updateProduct(
    @Body()
    body: {
      sku: string;
      name: string;
      price: number;
      description?: string;
    },
  ): Promise<IResultCreateProduct> {
    const resultdata = await this.appService.updateProduct(body);

    return resultdata;
  }

  @Delete('delete')
  async deleteProduct(@Query(`sku`) sku: string): Promise<boolean> {
    const resultdata = await this.appService.deleteProduct(sku);

    return resultdata;
  }
}
