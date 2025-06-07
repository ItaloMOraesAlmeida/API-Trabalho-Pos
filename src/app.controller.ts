import {
  Body,
  Controller,
  Delete,
  Get,
  Post,
  Query,
  Put,
  UploadedFile,
  UseInterceptors,
  Res,
  Param,
} from '@nestjs/common';
import { AppService, Product } from './app.service';
import { ApiBody, ApiTags, ApiConsumes } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { Response } from 'express';
import * as fs from 'fs';

export interface IResultCreateProduct {
  success: boolean;
  message?: string;
}

@ApiTags('Produto')
@Controller('product')
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Post()
  @UseInterceptors(
    FileInterceptor('image', {
      storage: diskStorage({
        destination: './uploadProductImages',
        filename: (req, file, cb) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, `product-${uniqueSuffix}${extname(file.originalname)}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
          return cb(new Error('Only image files are allowed!'), false);
        }
        cb(null, true);
      },
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Create a new product with optional image',
    schema: {
      type: 'object',
      properties: {
        sku: { type: 'string', example: 'SKU12345' },
        name: { type: 'string', example: 'Product Name' },
        price: { type: 'number', example: 100.0 },
        description: { type: 'string', example: 'Product Description' },
        image: { type: 'string', format: 'binary' },
      },
      required: ['name', 'price'],
    },
  })
  async createProduct(
    @Body()
    body: {
      sku?: string;
      name: string;
      price: number;
      description?: string;
    },
    @UploadedFile() file?: Express.Multer.File,
  ): Promise<IResultCreateProduct> {
    const productData = {
      ...body,
      price: Number(body.price),
      image: file ? file.filename : undefined,
    };

    const resultdata = await this.appService.createProduct(productData);
    return resultdata;
  }

  @Get()
  async getProducts(): Promise<Product[]> {
    const dataProducts = await this.appService.getProducts();
    return dataProducts;
  }

  @Get('byId')
  async getProductById(@Query('id') id: string): Promise<Product> {
    const dataProduct = await this.appService.getProductsById(id);
    return dataProduct;
  }

  @Get('image/:filename')
  getProductImage(@Param('filename') filename: string, @Res() res: Response) {
    const imagePath = `./uploadProductImages/${filename}`;

    if (fs.existsSync(imagePath)) {
      return res.sendFile(imagePath, { root: '.' });
    } else {
      return res.status(404).json({ message: 'Image not found' });
    }
  }

  @Put()
  @UseInterceptors(
    FileInterceptor('image', {
      storage: diskStorage({
        destination: './uploadProductImages',
        filename: (req, file, cb) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, `product-${uniqueSuffix}${extname(file.originalname)}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
          return cb(new Error('Only image files are allowed!'), false);
        }
        cb(null, true);
      },
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Update a product with optional image',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', example: 'uuid' },
        sku: { type: 'string', example: 'SKU12345' },
        name: { type: 'string', example: 'Updated Product Name' },
        price: { type: 'number', example: 150.0 },
        description: { type: 'string', example: 'Updated Product Description' },
        image: { type: 'string', format: 'binary' },
      },
      required: ['id', 'sku', 'name', 'price'],
    },
  })
  async updateProduct(
    @Body()
    body: {
      id: string;
      sku: string;
      name: string;
      price: number;
      description?: string;
    },
    @UploadedFile() file?: Express.Multer.File,
  ): Promise<IResultCreateProduct> {
    const updateData = {
      ...body,
      price: Number(body.price),
      image: file ? file.filename : undefined,
    };

    const resultdata = await this.appService.updateProduct(updateData);
    return resultdata;
  }

  @Delete('delete')
  async deleteProduct(@Query(`id`) id: string): Promise<boolean> {
    const resultdata = await this.appService.deleteProduct(id);
    return resultdata;
  }
}
